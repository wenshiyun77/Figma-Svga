import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const edge = fs.readFileSync(new URL('../functions/plugin-control/index.ts', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../../cache-bridge/admin/releases/20261003-v16/app.mjs', import.meta.url), 'utf8');
const between = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test('admin API gets global lifetime pagination on server and preserves today/PAG fields', async () => {
  const calls = [];
  const row = { figma_user_id: 'person', user_number: 7, display_name: 'Test', total_open_count: 123, total_export_count: 45, open_rank: 8, export_rank: 3 };
  const tables = { svga_plugin_daily_usage: [{ figma_user_id: 'person', open_count: 2, svga_export_count: 1, pag_export_count: 4 }], svga_plugin_pro_subscriptions: [] };
  const service = {
    async rpc(name, args) { calls.push([name,args]); return {data:name==='svga_admin_user_usage_page'?{users:[row],total:101}:{dailyOpens:2},error:null}; },
    from(name) { const result={data:tables[name]||[],error:null}; const q=new Proxy({}, {get:(_,key)=>key==='then'?Promise.resolve(result).then.bind(Promise.resolve(result)):()=>q}); return q; }
  };
  const source = between(edge,'const adminUsers = async','const adminProMilestones');
  const fn = vm.runInNewContext(source.replace(/: Record<string, unknown>/g,'').replace(/new Map<string, ProSubscription>/g,'new Map').replace(/new Map<string, Record<string, unknown>>/g,'new Map')+';adminUsers', {service,beijingDate:()=> '2026-10-03',adminPersonalSequenceLibrariesForUsers:async()=>new Map(),normalizeProSubscription:()=>({plan:'none'}),emptyProSubscription:()=>({plan:'none'}),PERSONAL_SEQUENCE_LIBRARY_MAX_BYTES:10485760});
  const result=await fn({mode:'history',sort:'exports',query:'Test',offset:50,limit:50});
  const rpc=calls.find(([name])=>name==='svga_admin_user_usage_page');
  assert.equal(rpc[1].p_sort,'exports');
  assert.equal(rpc[1].p_offset,50);
  assert.equal(result.pagination.total,101);
  assert.equal(result.users[0].totalOpenCount,123);
  assert.equal(result.users[0].totalExportCount,45);
  assert.equal(result.users[0].openRank,8);
  assert.equal(result.users[0].exportRank,3);
  assert.equal(result.users[0].openCount,2);
  assert.equal(result.users[0].pagExportCount,4);
  assert.equal(result.users[0].otherExportCount,4);
});

test('external card distinguishes lifetime ranks and today counts, displays PAG', () => {
  const fn=vm.runInNewContext(between(app,'function userCard(', 'function applyProButtonState(')+';userCard',{esc:String,num:v=>Number(v||0),normalizeAdminSubscription:()=>({plan:'none'}),avatarMarkup:()=>'',bj:()=>'-',proMetaMarkup:()=>''});
  const card=fn({figmaUserId:'x',totalOpenCount:123,totalExportCount:45,openRank:8,exportRank:3,openCount:2,pagExportCount:4},0);
  assert.match(card,/累计打开/); assert.match(card,/123/); assert.match(card,/累计成功导出/); assert.match(card,/45/);
  assert.match(card,/打开排名 #8/); assert.match(card,/导出排名 #3/); assert.match(card,/当日打开/); assert.match(card,/PAG/);
});

test('both page requests and stale-response identity include leaderboard sort', () => {
  assert.equal((app.match(/sort:userSort/g)||[]).length,2);
  assert.match(app, /userMode}\|\$\{userSearch}\|\$\{proOnly}\|\$\{userSort}/);
  assert.match(app, /id="userSort"/);
  assert.match(edge, /"pag_export"/);
  assert.match(edge, /await requireAdmin\(req\);\s*return json\(await adminUsers\(body\)\)/);
});
