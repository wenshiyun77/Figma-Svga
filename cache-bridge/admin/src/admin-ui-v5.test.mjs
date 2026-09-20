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
  assert.match(html, /releases\/20260919-v9\/vendor\/uPlot\.min\.css/);
  assert.match(html, /releases\/20260919-v9\/vendor\/uPlot\.iife\.min\.js/);
  assert.match(html, /releases\/20260919-v9\/growth\.css/);
  assert.match(html, /releases\/20260919-v9\/growth\.mjs/);
  assert.doesNotMatch(html, /growth-trend-v4\.(?:css|mjs)/);
});

test('material cards are denser and previews fully use a compact region', () => {
  const css = read('./material-density-v4.css');
  assert.match(css, /minmax\(210px,1fr\)/);
  assert.match(css, /\.preview\{[^}]*height:96px/);
  assert.match(css, /\.preview\{[^}]*aspect-ratio:auto/);
  assert.match(css, /\.preview img\{[^}]*width:100%[^}]*height:100%[^}]*object-fit:contain/);
  assert.match(css, /\.card \.btn\{[^}]*min-height:28px/);
});

test('growth v5 is wired to real admin growth data and the history summary card', () => {
  const js = read('../releases/20260919-v9/growth.mjs');
  assert.match(js, /svga_admin_user_growth/);
  assert.match(js, /Asia\/Shanghai/);
  assert.match(js, /MutationObserver/);
  assert.match(js, /历史用户/);
  assert.match(js, /openGrowthChart/);
  assert.match(js, /class="tool-button icon-only growth-close"/);
  assert.match(js, /data-range="7"/);
  assert.match(js, /data-range="30"/);
  assert.match(js, /data-range="90"/);
  assert.match(js, /data-range="all"/);
  assert.match(js, /data-range="custom"/);
  assert.match(js, /type="date"/);
  assert.match(js, /每日新增/);
  assert.match(js, /用户总数/);
  assert.match(js, /window\.uPlot/);
  assert.match(js, /growth-tooltip/);
});

test('growth chart presents standard axes, grid and polished modal controls', () => {
  const css = read('../releases/20260919-v9/growth.css');
  const js = read('../releases/20260919-v9/growth.mjs');
  assert.match(css, /\.tool-button\.icon-only/);
  assert.match(css, /\.growth-tooltip/);
  assert.match(css, /\.growth-custom/);
  assert.match(js, /label:'日期'/);
  assert.match(js, /label:'人数'/);
  assert.match(js, /grid:/);
  assert.match(js, /setCursor/);
});
