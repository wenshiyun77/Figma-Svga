import { randomUUID, sign } from "node:crypto";
import { readFile } from "node:fs/promises";

const PRODUCT_ID = "figma-svga-editor";
const PREFIX = "SVGA1";

const args = process.argv.slice(2);
const readArg = (name, fallback = "") => {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  return args[index + 1] || fallback;
};
const hasFlag = (name) => args.includes(name);

const help = () => {
  console.log(`Usage:
node scripts/generate-license-code.mjs \\
  --customer "客户名" \\
  --installation-id "figma-xxxx" \\
  --months 1

Options:
  --private-key <path>       Default: license-private-key.pem
  --customer <name>          Customer name or note
  --installation-id <id>     Bind code to the plugin's authorization ID
  --all-devices              Do not bind to one authorization ID
  --months <number>          Expire after N calendar months. Default: 1
  --days <number>            Expire after N days
  --expires-at <iso-date>    Explicit expiration time
  --plan <name>              Default: pro
  --max-exports <number>     Optional export quota after activation
`);
};

if (hasFlag("--help")) {
  help();
  process.exit(0);
}

const privateKeyPath = readArg("--private-key", "license-private-key.pem");
const customer = readArg("--customer", "customer");
const installationId = readArg("--installation-id", "");
const allDevices = hasFlag("--all-devices");
const hasMonths = hasFlag("--months");
const hasDays = hasFlag("--days");
const months = Number(readArg("--months", "1"));
const days = Number(readArg("--days", ""));
const explicitExpiresAt = readArg("--expires-at", "");
const plan = readArg("--plan", "pro");
const maxExportsRaw = readArg("--max-exports", "");

if (!allDevices && !installationId) {
  console.error("Missing --installation-id. Use --all-devices only when you intentionally want a shareable code.");
  process.exit(1);
}

if (!explicitExpiresAt && hasMonths && hasDays) {
  console.error("Use either --months or --days, not both.");
  process.exit(1);
}

const assertPositiveNumber = (value, label) => {
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`${label} must be a positive number.`);
    process.exit(1);
  }
};

const addCalendarMonths = (date, value) => {
  const wholeMonths = Math.round(value);
  if (wholeMonths !== value) {
    console.error("--months must be a whole number.");
    process.exit(1);
  }
  const next = new Date(date.getTime());
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + wholeMonths);
  const daysInMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, daysInMonth));
  return next;
};

const issuedAt = new Date();
let expiresAt = explicitExpiresAt || null;
if (expiresAt && !Number.isFinite(Date.parse(expiresAt))) {
  console.error("--expires-at must be a valid ISO date.");
  process.exit(1);
}
if (!expiresAt) {
  if (hasDays) {
    assertPositiveNumber(days, "--days");
    expiresAt = new Date(issuedAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  } else {
    assertPositiveNumber(months, "--months");
    expiresAt = addCalendarMonths(issuedAt, months).toISOString();
  }
}

const payload = {
  v: 1,
  product: PRODUCT_ID,
  licenseId: randomUUID(),
  customer,
  plan,
  issuedAt: issuedAt.toISOString(),
  expiresAt,
  installationId: allDevices ? null : installationId,
  maxExports: maxExportsRaw ? Math.max(0, Math.round(Number(maxExportsRaw))) : null,
};

const privateKey = await readFile(privateKeyPath, "utf8");
const base64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const payloadB64 = base64Url(JSON.stringify(payload));
const signedText = `${PREFIX}.${payloadB64}`;
const signature = sign("sha256", Buffer.from(signedText), {
  key: privateKey,
  dsaEncoding: "ieee-p1363",
});
const code = `${signedText}.${base64Url(signature)}`;

console.log(code);
console.error("");
console.error(`licenseId: ${payload.licenseId}`);
console.error(`customer: ${payload.customer}`);
console.error(`installationId: ${payload.installationId || "all-devices"}`);
console.error(`expiresAt: ${payload.expiresAt || "never"}`);
