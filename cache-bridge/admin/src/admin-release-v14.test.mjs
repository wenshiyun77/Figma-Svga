import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (name) => fs.readFileSync(new URL(name, import.meta.url), 'utf8');

test('all active PRO plans show cancellation and require a confirmation dialog', () => {
  const app = read('../releases/20260930-v14/app.mjs');
  assert.match(app, /class="btn secondary proCancelBtn" data-plan="cancel"[^>]*\$\{subscription\.plan==='none'\?'hidden':''\}[^>]*>取消 PRO/);
  assert.match(app, /plan==='cancel'\)\{title\.textContent='取消 PRO 权限'/);
  assert.match(app, /confirmBtn\.textContent='确认取消'/);
  assert.match(app, /confirmCancel:plan==='cancel'/);
  assert.match(app, /if\(plan==='cancel'\)void loadUsers\(\)/);
});

test('release retains built-in displacement frame count and independent assets', () => {
  const app = read('../releases/20260930-v14/app.mjs');
  const html = read('../index.html');
  assert.match(app, /displacementFrameCount\(/);
  assert.doesNotMatch(html, /patches\/20260929-displacement-frame-count/);
  for (const path of [
    '../releases/20260930-v14/vendor/uPlot.iife.min.js',
    '../releases/20260930-v14/preset-previews/flutter.webp',
    '../releases/20260930-v14/styles.css',
  ]) assert.ok(fs.existsSync(new URL(path, import.meta.url)), path);
});
