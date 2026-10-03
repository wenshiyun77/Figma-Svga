import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
const exists = (relativePath) => fs.existsSync(new URL(relativePath, import.meta.url));

test("admin entry selects the immutable 20261003-v17 release", () => {
  const html = read("../index.html");

  assert.match(html, /window\.__SVGA_ADMIN_BUILD__="20261003-v17"/);
  assert.match(html, /\.\/releases\/20261003-v17\/app\.mjs/);
  assert.match(html, /\.\/releases\/20261003-v17\/styles\.css/);
  assert.doesNotMatch(html, /releases\/20260920-v10/);
});

test("v11 release is self-contained", () => {
  for (const path of [
    "../releases/20260928-v11/app.mjs",
    "../releases/20260928-v11/styles.css",
    "../releases/20260928-v11/growth.mjs",
    "../releases/20260928-v11/growth.css",
    "../releases/20260928-v11/base.css",
    "../releases/20260928-v11/preview.css",
    "../releases/20260928-v11/material.css",
    "../releases/20260928-v11/official.css",
    "../releases/20260928-v11/vendor/uPlot.iife.min.js",
    "../releases/20260928-v11/vendor/uPlot.min.css",
  ]) {
    assert.equal(exists(path), true, `missing immutable release asset: ${path}`);
  }
});

test("user cards can issue and extend a fixed seven-day trial", () => {
  const app = read("../releases/20260928-v11/app.mjs");

  assert.match(app, /const ADMIN_BUILD='20260928-v11'/);
  assert.match(app, /\['trial','monthly','permanent'\]\.includes\(plan\)/);
  assert.match(app, /const proLabel=subscription\.plan==='trial'\?'试用中'/);
  assert.match(app, /class="btn secondary proBtn trialProBtn"[^>]*data-plan="trial"[^>]*data-label="试用PRO"[^>]*>试用PRO<\/button>/);
  assert.match(app, /title\.textContent=active\?'增加试用时长':'发放7天试用'/);
  assert.match(app, /确认后到期：\$\{bj\(projectedTrialExpiry\(subscription\.expiresAt\)\)\}/);
  assert.match(app, /plan==='trial'\?1:/);
  assert.match(app, /plan==='trial'\?'已增加 7 天试用 PRO'/);
  assert.match(app, /admin-user-feature[\s\S]{0,500}plan,months/);
});

test("trial uses the same active gold treatment while remaining visibly distinct", () => {
  const css = read("../releases/20260928-v11/styles.css");

  assert.match(css, /\.trialProBtn\[data-on="1"\]/);
  assert.match(css, /\.trialProBtn\[data-on="1"\]::after/);
  assert.match(css, /#d8b4fe/);
});
