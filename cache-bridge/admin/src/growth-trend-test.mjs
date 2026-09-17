import test from 'node:test';
import assert from 'node:assert/strict';
import {presetRange,normalizeGrowthRows} from './growth-trend-v4.mjs';
test('growth range',()=>assert.deepEqual(presetRange('7','2026-09-17'),{start:'2026-09-11',end:'2026-09-17'}));
test('growth normalize',()=>assert.deepEqual(normalizeGrowthRows([{day:'2026-09-16',new_users:'4',total_users:'237'}]),[{day:'2026-09-16',newUsers:4,totalUsers:237}]));
