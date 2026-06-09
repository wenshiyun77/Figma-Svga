import { generateKeyPairSync } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const PRIVATE_KEY_PATH = new URL("../license-private-key.pem", import.meta.url);
const UI_PATH = new URL("../src/ui.html", import.meta.url);

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
});

const privatePem = privateKey.export({
  type: "pkcs8",
  format: "pem",
});
const publicJwk = publicKey.export({ format: "jwk" });

await writeFile(PRIVATE_KEY_PATH, privatePem, { mode: 0o600 });

const ui = await readFile(UI_PATH, "utf8");
const nextUi = ui.replace(
  /const LICENSE_PUBLIC_KEY_JWK = \/\* LICENSE_PUBLIC_KEY_START \*\/[\s\S]*?\/\* LICENSE_PUBLIC_KEY_END \*\/;/,
  `const LICENSE_PUBLIC_KEY_JWK = /* LICENSE_PUBLIC_KEY_START */ ${JSON.stringify(
    publicJwk,
    null,
    8,
  )} /* LICENSE_PUBLIC_KEY_END */;`,
);

if (nextUi === ui) {
  throw new Error("Could not find LICENSE_PUBLIC_KEY_JWK marker in src/ui.html");
}

await writeFile(UI_PATH, nextUi);

console.log("Created license-private-key.pem");
console.log("Updated src/ui.html with the public verification key");
console.log("Keep license-private-key.pem private. Do not ship it with the plugin.");
