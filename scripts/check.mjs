import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));
if (typeof manifest.id !== "string" || !manifest.id.trim()) {
  throw new Error("manifest.json must include a plugin id so figma.clientStorage can persist license state.");
}

const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
if (main.includes("?.") || main.includes("??") || main.includes("...")) {
  throw new Error("src/main.js must avoid optional chaining, nullish coalescing, and spread syntax for Figma plugin runtime compatibility.");
}

run("node", ["--check", "src/main.js"]);

const ui = await readFile(new URL("../src/ui.html", import.meta.url), "utf8");
if (ui.includes("__CONTACT_QR_DATA_URL__")) {
  throw new Error("Contact QR data URL has not been embedded in src/ui.html");
}

const keyMatch = ui.match(
  /const LICENSE_PUBLIC_KEY_JWK = \/\* LICENSE_PUBLIC_KEY_START \*\/\s*([\s\S]*?)\s*\/\* LICENSE_PUBLIC_KEY_END \*\//,
);
if (!keyMatch) {
  throw new Error("License public key marker not found in src/ui.html");
}
const publicKey = JSON.parse(keyMatch[1]);
if (publicKey.kty !== "EC" || publicKey.crv !== "P-256" || !publicKey.x || !publicKey.y) {
  throw new Error("License public key is not configured. Run npm run license:keygen.");
}

const scripts = [...ui.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
if (scripts.length === 0) {
  throw new Error("ui.html has no inline script to validate");
}
for (const script of scripts) {
  new Function(script);
}

console.log("Figma SVGA plugin project checks passed.");
