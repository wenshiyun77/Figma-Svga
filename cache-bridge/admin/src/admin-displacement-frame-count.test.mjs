import test from 'node:test';
import assert from 'node:assert/strict';
import { displacementFrameCount } from '../releases/20260930-v14/displacement-frame-count.mjs';

test('built-in displacement shows its twelve generated source frames', () => {
  assert.equal(displacementFrameCount({ presetKey: 'flutter', frames: [] }), 12);
});

test('uploaded displacement shows its stored frame count', () => {
  assert.equal(displacementFrameCount({ presetKey: '', frames: Array(7).fill({}) }), 7);
  assert.equal(displacementFrameCount({ presetKey: 'flutter', frames: Array(9).fill({}) }), 9);
});

test('empty custom displacement does not claim generated frames', () => {
  assert.equal(displacementFrameCount({ presetKey: '', frames: [] }), 0);
});
