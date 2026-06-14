import { createPublicKey, verify } from "node:crypto";
import { readFile } from "node:fs/promises";

const PRODUCT_ID = "figma-svga-editor";
const PREFIX = "SVGA1";
const UI_PATH = new URL("../src/ui.html", import.meta.url);

const args = process.argv.slice(2);
const readArg = (name, fallback = "") => {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  return args[index + 1] || fallback;
};

const help = () => {
  console.log(`Usage:
node scripts/verify-license-code.mjs --code "SVGA1..."

Options:
  --code <code>              License code to verify
  --installation-id <id>     Optional expected authorization ID
`);
};

if (args.includes("--help")) {
  help();
  process.exit(0);
}

const code = readArg("--code", args[0] || "");
const expectedInstallationId = readArg("--installation-id", "");

const base64UrlToBytes = (value) => {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
};

const parseCode = (value) => {
  const compact = String(value || "").trim().replace(/\s+/g, "");
  const parts = compact.split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    throw new Error("License code format is invalid.");
  }
  const payload = JSON.parse(base64UrlToBytes(parts[1]).toString("utf8"));
  const signature = base64UrlToBytes(parts[2]);
  return {
    signedText: `${parts[0]}.${parts[1]}`,
    payload,
    signature,
  };
};

const readUiPublicKey = async () => {
  const ui = await readFile(UI_PATH, "utf8");
  const match = ui.match(
    /const LICENSE_PUBLIC_KEY_JWK = \/\* LICENSE_PUBLIC_KEY_START \*\/\s*([\s\S]*?)\s*\/\* LICENSE_PUBLIC_KEY_END \*\//,
  );
  if (!match) throw new Error("Could not find LICENSE_PUBLIC_KEY_JWK marker in src/ui.html.");
  return JSON.parse(match[1]);
};

const parsed = parseCode(code);
if (parsed.payload.product !== PRODUCT_ID) {
  throw new Error("License code product does not match this plugin.");
}
if (
  expectedInstallationId &&
  parsed.payload.installationId &&
  parsed.payload.installationId !== expectedInstallationId
) {
  throw new Error("License code installation ID does not match the expected ID.");
}
if (parsed.payload.expiresAt) {
  const expiresAt = Date.parse(parsed.payload.expiresAt);
  if (!Number.isFinite(expiresAt)) throw new Error("License code expiration is invalid.");
  if (expiresAt <= Date.now()) throw new Error("License code is expired.");
}

const publicKey = createPublicKey({
  key: await readUiPublicKey(),
  format: "jwk",
});
const ok = verify("sha256", Buffer.from(parsed.signedText), {
  key: publicKey,
  dsaEncoding: "ieee-p1363",
}, parsed.signature);

if (!ok) throw new Error("License signature is invalid for the current UI public key.");

console.log("License code verified.");
console.log(`licenseId: ${parsed.payload.licenseId}`);
console.log(`installationId: ${parsed.payload.installationId || "all-devices"}`);
console.log(`issuedAt: ${parsed.payload.issuedAt}`);
console.log(`expiresAt: ${parsed.payload.expiresAt || "never"}`);
