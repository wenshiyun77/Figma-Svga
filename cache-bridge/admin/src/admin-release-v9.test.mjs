import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));

test('entry pins one immutable v9 release', () => {
  const html = read('index.html');
  assert.match(html, /window\.__SVGA_ADMIN_BUILD__="20260919-v9"/);
  assert.match(html, /\.\/releases\/20260919-v9\/app\.mjs/);
  assert.match(html, /\.\/releases\/20260919-v9\/styles\.css/);
  assert.doesNotMatch(html, /official-materials-v6|official-materials-stable-v7|admin-upload-v7|admin-upload-queue-v8/);
  assert.equal((html.match(/data-material-controller/g) || []).length, 1);
});

test('v9 release is self-contained and single-renderer', () => {
  for (const rel of [
    'releases/20260919-v9/app.mjs',
    'releases/20260919-v9/styles.css',
    'releases/20260919-v9/growth.mjs',
    'releases/20260919-v9/growth.css',
    'releases/20260919-v9/vendor/uPlot.iife.min.js',
    'releases/20260919-v9/vendor/uPlot.min.css',
  ]) assert.equal(exists(rel), true, `${rel} must exist`);
  const app = read('releases/20260919-v9/app.mjs');
  assert.match(app, /const ADMIN_BUILD='20260919-v9'/);
  assert.match(app, /data-material-controller="v9"/);
  assert.doesNotMatch(app, /new MutationObserver/);
  assert.equal((app.match(/function renderOfficialMaterials/g) || []).length, 1);
  assert.equal((app.match(/function uploadOfficialFolders/g) || []).length, 1);
});

test('PRO button stays compact and updates locally', () => {
  const css = read('releases/20260919-v9/styles.css');
  const app = read('releases/20260919-v9/app.mjs');
  assert.match(css, /\.proBtn\{[^}]*height:30px[^}]*align-self:start[^}]*margin-top:2px/s);
  assert.match(css, /\.proBtn\[data-on="0"\][^{]*\{[^}]*#8b5cf6/s);
  assert.match(css, /\.proBtn\[data-on="1"\][^{]*\{[^}]*#edc676/s);
  assert.match(app, /function applyProButtonState\(button,enabled\)/);
  assert.doesNotMatch(app, /await loadUsers\(\)[\s\S]{0,120}admin-user-feature/);
});
