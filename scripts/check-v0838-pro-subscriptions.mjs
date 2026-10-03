import assert from "node:assert/strict";
import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
const pkg = JSON.parse(read("../package.json"));
const main = read("../src/main.js");
const ui = read("../src/ui.html");
const adminIndex = read("../cache-bridge/admin/index.html");
const adminApp = read("../cache-bridge/admin/releases/20261003-v19/app.mjs");
const adminStyles = read("../cache-bridge/admin/releases/20261003-v19/styles.css");
const migration = read("../supabase/migrations/202609200001_pro_subscriptions.sql");
const edgeFunction = read("../supabase/functions/plugin-control/index.ts");

assert.equal(pkg.version, "0.8.69");
assert.match(main, /pluginVersion:\s*"0\.8\.69"/);
assert.doesNotMatch(main, /pluginVersion:\s*"0\.8\.37"/);
assert.match(main, /subscription:\s*normalizeControlPlaneSubscription/);

assert.match(ui, /const PRO_COUNTDOWN_CLOCK_SVG =/);
assert.match(ui, /label: subscription\.plan === "trial"/);
assert.match(ui, /subscription\.daysRemaining <= 3/);
assert.match(ui, /if \(isProUser\(\) && state\.controlPlane\.subscription\.plan === "permanent"\) return;/);

assert.match(adminIndex, /20261003-v19\/styles\.css/);
assert.match(adminIndex, /20261003-v19\/app\.mjs/);
assert.match(adminApp, /data-plan="trial"/);
assert.match(adminApp, /data-plan="monthly"/);
assert.match(adminApp, /data-plan="permanent"/);
assert.match(adminApp, /id="proMonthDecrement"/);
assert.match(adminApp, /id="proMonthIncrement"/);
assert.match(adminStyles, /\.proBtn\[data-on="1"\]::after/);
assert.match(adminStyles, /content:\s*attr\(data-label\)/);

assert.match(migration, /create table if not exists public\.svga_plugin_pro_subscriptions/i);
assert.match(migration, /svga_admin_set_pro_subscription/);
assert.match(edgeFunction, /svga_effective_pro_subscription/);
assert.match(edgeFunction, /svga_admin_set_pro_subscription/);

console.log("v0.8.69 PRO subscription contracts passed.");
