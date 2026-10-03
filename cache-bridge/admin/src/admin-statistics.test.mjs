import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const app=fs.readFileSync(new URL('../releases/20261003-v17/app.mjs',import.meta.url),'utf8'),between=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b,app.indexOf(a)));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('statistics table has all sortable columns and escaped identity; ordinary cards contain daily data only',()=>{
 const panel={innerHTML:''},calls=[],context={num:v=>Number(v||0),esc,bj:v=>String(v||'-'),$:()=>panel,loadStatistics:()=>calls.push(true)};
 vm.runInNewContext(between('const STATISTICS_COLUMNS =','async function loadStatistics(')+'; statisticsUsers=[{figmaUserId:"<img>",displayName:"<script>",statisticRank:2,totalPagExportCount:25}]; statisticsTotal=1;renderStatistics();',context);
 assert.equal((panel.innerHTML.match(/data-stat-sort=/g)||[]).length,15);assert.match(panel.innerHTML,/&lt;script&gt;/);assert.match(panel.innerHTML,/&lt;img&gt;/);assert.match(panel.innerHTML,/>25<\/td>/);
 panel.onclick({target:{closest:()=>({dataset:{statSort:'pag'}})}});assert.equal(vm.runInNewContext('statisticsSort',context),'pag');assert.equal(vm.runInNewContext('statisticsDirection',context),'desc');
 panel.onclick({target:{closest:()=>({dataset:{statSort:'pag'}})}});assert.equal(vm.runInNewContext('statisticsDirection',context),'asc');assert.equal(calls.length,2);
 const card=vm.runInNewContext(between('function userCard(','function applyProButtonState(')+';userCard',{num:v=>Number(v||0),esc,bj:()=>'-',normalizeAdminSubscription:()=>({plan:'none'}),avatarMarkup:()=>'',proMetaMarkup:()=>''})({figmaUserId:'x',totalOpenCount:100,openRank:3,pagExportCount:2},0);
 assert.doesNotMatch(card,/累计|排名/);assert.match(card,/当日打开/);assert.match(card,/PAG/);
});
test('statistics sort cancels stale results and pagination keeps direction and offset',async()=>{
 const pending=[],dom={textContent:''},context={usersLoadSeq:0,pageEpoch:1,statisticsSort:'opens',statisticsDirection:'desc',userSearch:'',userMode:'statistics',route:'users',statisticsUsers:[],statisticsTotal:0,userPagingObserver:null,num:Number,renderStatistics(){},toast(){},$:id=>id==='#statisticsLoadMore'?null:dom,request:(action,body)=>new Promise(resolve=>pending.push({action,body,resolve}))};
 const load=vm.runInNewContext(between('async function loadStatistics(','async function loadMoreUsers(')+';loadStatistics',context);
 const old=load();context.statisticsSort='pag';context.statisticsDirection='asc';const current=load();pending[1].resolve({users:[{figmaUserId:'new'}],pagination:{total:2}});await current;pending[0].resolve({users:[{figmaUserId:'stale'}],pagination:{total:99}});await old;
 assert.equal(context.statisticsUsers[0].figmaUserId,'new');assert.equal(context.statisticsTotal,2);
 const next=load(true);assert.equal(pending[2].body.offset,1);assert.equal(pending[2].body.sort,'pag');assert.equal(pending[2].body.sortDirection,'asc');assert.equal(pending[2].action,'admin-user-statistics');pending[2].resolve({users:[{figmaUserId:'second'}],pagination:{total:2}});await next;assert.equal(context.statisticsUsers.length,2);
});
