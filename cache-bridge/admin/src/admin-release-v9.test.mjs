import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = rel => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, import.meta.url));

test('admin entry selects one immutable v10 release', () => {
  const html = read('../index.html');

  assert.match(html, /window\.__SVGA_ADMIN_BUILD__="20260920-v10"/);
  assert.match(html, /\.\/releases\/20260920-v10\/app\.mjs/);
  assert.match(html, /\.\/releases\/20260920-v10\/styles\.css/);
  assert.doesNotMatch(
    html,
    /official-materials-v6|official-materials-stable-v7|admin-upload-v7|admin-upload-queue-v8/,
  );
  assert.doesNotMatch(html, /\?v=/);
  const runtimeRefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  assert.equal(runtimeRefs.length, 6);
  assert.equal(runtimeRefs.every(ref => ref.startsWith('./releases/20260920-v10/')), true);
});

test('v10 release keeps every runtime dependency in its own directory', () => {
  const required = [
    '../releases/20260920-v10/app.mjs',
    '../releases/20260920-v10/styles.css',
    '../releases/20260920-v10/growth.mjs',
    '../releases/20260920-v10/growth.css',
    '../releases/20260920-v10/vendor/uPlot.iife.min.js',
    '../releases/20260920-v10/vendor/uPlot.min.css',
    '../releases/20260920-v10/base.css',
    '../releases/20260920-v10/preview.css',
    '../releases/20260920-v10/material.css',
    '../releases/20260920-v10/official.css',
  ];

  for (const path of required) {
    assert.equal(exists(path), true, `missing immutable release asset: ${path}`);
  }
});

test('v10 app owns the only material renderer without observer patches', () => {
  const app = read('../releases/20260920-v10/app.mjs');

  assert.match(app, /const ADMIN_BUILD='20260920-v10'/);
  assert.equal((app.match(/data-material-controller="v10"/g) || []).length, 1);
  assert.doesNotMatch(app, /new MutationObserver/);
  assert.equal((app.match(/function renderOfficialMaterials/g) || []).length, 1);
  assert.equal((app.match(/function uploadOfficialFolders/g) || []).length, 1);
  assert.match(app, /function loadMoreUsers\(/);
  assert.match(app, /function setupUserPagination\(/);
});

test('PRO controls show monthly and permanent plans with non-destructive dialogs', () => {
  const app = read('../releases/20260920-v10/app.mjs');
  const css = read('../releases/20260920-v10/styles.css');

  assert.match(css, /\.proButtons\{[^}]*align-self:center/s);
  assert.match(css, /\.proBtn\{[^}]*height:30px/s);
  assert.match(css, /\.proBtn\[data-on="0"\][^{]*\{[^}]*(?:#8b909c|#8f95a3|#9ca3af)/s);
  assert.match(css, /\.proBtn\[data-on="1"\][^{]*\{[^}]*#edc676/s);
  assert.match(css, /\.proBtn\[data-on="1"\]::after\{[^}]*content:attr\(data-label\)[^}]*background-clip:text/s);
  assert.match(css, /animation:svga-admin-plugin-pro-sweep 2\.8s linear infinite/);
  assert.match(app, /class="btn secondary proBtn monthlyProBtn"[^>]*data-plan="monthly"[^>]*>包月PRO<\/button>/);
  assert.match(app, /class="btn secondary proBtn permanentProBtn"[^>]*data-plan="permanent"[^>]*>永久PRO<\/button>/);
  assert.match(app, /id="proSubscriptionDialog"/);
  assert.match(app, /id="proMonthDecrement"[^>]*>−<\/button>/);
  assert.match(app, /id="proMonthCount"[^>]*>1<\/strong>/);
  assert.match(app, /id="proMonthIncrement"[^>]*>\+<\/button>/);
  assert.match(app, /function openProSubscriptionDialog\(/);
  assert.match(app, /\$\('#proSubscriptionDialog'\)\.onkeydown=e=>\{if\(e\.key==='Escape'\)closeProSubscriptionDialog\(\)\}/);
  assert.doesNotMatch(app, /document\.addEventListener\('keydown',[\s\S]{0,180}\{once:true\}/);
  assert.match(app, /admin-user-feature[\s\S]{0,500}plan,[\s\S]{0,200}months/);
  assert.doesNotMatch(app, /admin-user-feature[\s\S]{0,400}enabled:/);
  assert.doesNotMatch(app, /if\(epoch===pageEpoch\)await loadUsers\(\)/);
  assert.match(app, /PRO 套餐：\$\{esc\(proLabel\)\}/);
  assert.match(app, /开通时间 \$\{bj\(subscription\.startedAt\)\}/);
  assert.match(app, /到期时间 \$\{bj\(subscription\.expiresAt\)\}/);
});

test('material previews keep a stable card height without image distortion', () => {
  const css = read('../releases/20260920-v10/preview.css');

  assert.match(css, /\.preview\{[^}]*height:96px/s);
  assert.doesNotMatch(css, /\.preview\{[^}]*height:auto/s);
  assert.doesNotMatch(css, /\.preview\{[^}]*aspect-ratio:/s);
  assert.match(css, /\.preview img\{[^}]*width:100%[^}]*height:100%[^}]*object-fit:contain[^}]*object-position:center/s);
});
