import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = rel => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, import.meta.url));

test('admin entry selects one immutable v9 release', () => {
  const html = read('../index.html');

  assert.match(html, /window\.__SVGA_ADMIN_BUILD__="20260919-v9"/);
  assert.match(html, /\.\/releases\/20260919-v9\/app\.mjs/);
  assert.match(html, /\.\/releases\/20260919-v9\/styles\.css/);
  assert.doesNotMatch(
    html,
    /official-materials-v6|official-materials-stable-v7|admin-upload-v7|admin-upload-queue-v8/,
  );
  assert.doesNotMatch(html, /\?v=/);
  const runtimeRefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  assert.equal(runtimeRefs.length, 6);
  assert.equal(runtimeRefs.every(ref => ref.startsWith('./releases/20260919-v9/')), true);
});

test('v9 release keeps every runtime dependency in its own directory', () => {
  const required = [
    '../releases/20260919-v9/app.mjs',
    '../releases/20260919-v9/styles.css',
    '../releases/20260919-v9/growth.mjs',
    '../releases/20260919-v9/growth.css',
    '../releases/20260919-v9/vendor/uPlot.iife.min.js',
    '../releases/20260919-v9/vendor/uPlot.min.css',
    '../releases/20260919-v9/base.css',
    '../releases/20260919-v9/preview.css',
    '../releases/20260919-v9/material.css',
    '../releases/20260919-v9/official.css',
  ];

  for (const path of required) {
    assert.equal(exists(path), true, `missing immutable release asset: ${path}`);
  }
});

test('v9 app owns the only material renderer without observer patches', () => {
  const app = read('../releases/20260919-v9/app.mjs');

  assert.match(app, /const ADMIN_BUILD='20260919-v9'/);
  assert.equal((app.match(/data-material-controller="v9"/g) || []).length, 1);
  assert.doesNotMatch(app, /new MutationObserver/);
  assert.equal((app.match(/function renderOfficialMaterials/g) || []).length, 1);
  assert.equal((app.match(/function uploadOfficialFolders/g) || []).length, 1);
  assert.match(app, /function loadMoreUsers\(/);
  assert.match(app, /function setupUserPagination\(/);
});

test('PRO controls keep their size, align to the avatar, and update locally', () => {
  const app = read('../releases/20260919-v9/app.mjs');
  const css = read('../releases/20260919-v9/styles.css');

  assert.match(css, /\.proBtn\{[^}]*height:30px[^}]*align-self:start[^}]*margin-top:2px/s);
  assert.match(css, /\.proBtn\[data-on="0"\][^{]*\{[^}]*#8b5cf6/s);
  assert.match(css, /\.proBtn\[data-on="1"\][^{]*\{[^}]*#edc676/s);
  assert.match(css, /animation:svga-admin-plugin-pro-sweep 2\.8s linear infinite/);
  assert.match(app, /function applyProButtonState\(button,enabled\)/);
  assert.match(app, /admin-user-feature[\s\S]{0,240}applyProButtonState\(pro,next\)/);
  assert.doesNotMatch(app, /if\(epoch===pageEpoch\)await loadUsers\(\)/);
});

test('material previews keep a stable card height without image distortion', () => {
  const css = read('../releases/20260919-v9/preview.css');

  assert.match(css, /\.preview\{[^}]*height:96px/s);
  assert.doesNotMatch(css, /\.preview\{[^}]*height:auto/s);
  assert.doesNotMatch(css, /\.preview\{[^}]*aspect-ratio:/s);
  assert.match(css, /\.preview img\{[^}]*width:100%[^}]*height:100%[^}]*object-fit:contain[^}]*object-position:center/s);
});
