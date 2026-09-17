import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { presetRange, normalizeGrowthRows } from './growth-trend-v5.mjs';

const read = rel => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');

test('growth trend defaults to inclusive 30-day range', () => {
  assert.deepEqual(presetRange('30', '2026-09-17'), { start: '2026-08-19', end: '2026-09-17' });
});

test('growth rows normalize numeric values', () => {
  assert.deepEqual(normalizeGrowthRows([{ day: '2026-09-16', new_users: '4', total_users: '237' }]), [{ day: '2026-09-16', newUsers: 4, totalUsers: 237 }]);
});

test('admin entry loads local uPlot and v5 growth UI', () => {
  const html = read('../index.html');
  assert.match(html, /vendor\/uplot\/uPlot\.min\.css/);
  assert.match(html, /vendor\/uplot\/uPlot\.iife\.min\.js/);
  assert.match(html, /growth-trend-v5\.css/);
  assert.match(html, /growth-trend-v5\.mjs/);
  assert.doesNotMatch(html, /growth-trend-v4\.(?:css|mjs)/);
});

test('material cards are denser and preview images upscale within a compact complete-fit region', () => {
  const css = read('./material-density-v4.css');
  assert.match(css, /minmax\(210px,1fr\)/);
  assert.match(css, /\.preview\{[^}]*height:96px/);
  assert.match(css, /\.preview img\{[^}]*width:100%[^}]*height:100%[^}]*object-fit:contain/);
});

test('growth modal reuses icon-only close control', () => {
  const css = read('./growth-trend-v5.css');
  const js = read('./growth-trend-v5.mjs');
  assert.match(css, /\.tool-button\.icon-only/);
  assert.match(js, /class="tool-button icon-only growth-close"/);
  assert.match(js, /data-range="30"/);
  assert.match(js, /window\.uPlot/);
});
