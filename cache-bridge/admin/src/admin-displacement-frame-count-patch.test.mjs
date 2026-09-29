import test from 'node:test';
import assert from 'node:assert/strict';
import { correctDisplacementFrameCounts } from '../patches/20260929-displacement-frame-count.mjs';

test('built-in procedural displacement displays twelve source frames', () => {
  const builtIn = { textContent: '内置效果 · 0 帧 · 排序 10' };
  const uploaded = { textContent: '内置效果 · 9 帧 · 排序 20' };
  const custom = { textContent: '7 帧 · 排序 30' };
  const root = { querySelectorAll: () => [builtIn, uploaded, custom] };

  correctDisplacementFrameCounts(root);

  assert.equal(builtIn.textContent, '内置效果 · 12 帧 · 排序 10');
  assert.equal(uploaded.textContent, '内置效果 · 9 帧 · 排序 20');
  assert.equal(custom.textContent, '7 帧 · 排序 30');
});
