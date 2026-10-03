import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../releases/20261003-v18/app.mjs',import.meta.url),'utf8');
const between=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b,app.indexOf(a)));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('statistics columns exclude dates, escape identity and expose all lifetime export formats',()=>{
 const ctx={num:v=>Number(v||0),esc};
 const {columns,row}=vm.runInNewContext(between('const STATISTICS_COLUMNS =','function updateStatisticsControls(')+';({columns:STATISTICS_COLUMNS,row:statisticsRow({figmaUserId:"<img>",displayName:"<script>",statisticRank:2,totalPagExportCount:25})})',ctx);
 assert.equal(columns.length,12);
 assert.deepEqual(Array.from(columns.filter(c=>['webp','gif','lottie','webm','pag'].includes(c.key)),c=>c.key),['webp','gif','lottie','webm','pag']);
 assert.ok(columns.every(c=>c.type!=='date'));
 assert.match(row,/&lt;script&gt;/);assert.match(row,/&lt;img&gt;/);assert.match(row,/>25<\/td>/);
 const card=vm.runInNewContext(between('function userCard(','function applyProButtonState(')+';userCard',{num:v=>Number(v||0),esc,bj:()=>'-',normalizeAdminSubscription:()=>({plan:'none'}),avatarMarkup:()=>'',proMetaMarkup:()=>''})({figmaUserId:'x',totalOpenCount:100,openRank:3,pagExportCount:2},0);
 assert.doesNotMatch(card,/累计|排名/);assert.match(card,/当日打开/);assert.match(card,/PAG/);
});
function harness(initial=[]){
 const pending=[],status={textContent:''},panel={querySelector:()=>true};
 const context={usersLoadSeq:0,pageEpoch:1,statisticsSort:'opens',statisticsDirection:'desc',userSearch:'',userMode:'statistics',route:'users',statisticsUsers:initial,statisticsTotal:120,statisticsBusy:0,statisticsCommitted:{sort:'opens',direction:'desc',query:''},userPagingObserver:null,num:Number,renderStatistics(){},updateStatisticsControls(){},toast(){},$:id=>id==='#statisticsPanel'?panel:status,request:(action,body)=>new Promise((resolve,reject)=>pending.push({action,body,resolve,reject}))};
 const load=vm.runInNewContext(between('async function loadStatistics(','async function loadMoreUsers(')+';loadStatistics',context);
 return {pending,context,load,status};
}
test('delayed sorting preserves existing rows and stale responses cannot replace current data',async()=>{
 const {pending,context,load}=harness([{figmaUserId:'visible'}]);
 const old=load();assert.equal(context.statisticsUsers[0].figmaUserId,'visible');
 context.statisticsSort='pag';context.statisticsDirection='asc';const current=load();
 pending[1].resolve({users:[{figmaUserId:'new'}],pagination:{total:2}});await current;
 pending[0].resolve({users:[{figmaUserId:'stale'}],pagination:{total:99}});await old;
 assert.equal(context.statisticsUsers[0].figmaUserId,'new');assert.equal(context.statisticsTotal,2);assert.equal(context.statisticsBusy,0);
 const next=load(true);assert.equal(pending[2].body.offset,1);assert.equal(pending[2].body.sort,'pag');assert.equal(pending[2].body.sortDirection,'asc');
 assert.equal(pending[2].action,'admin-user-statistics');
 await load(true);assert.equal(pending.length,3,'duplicate append is ignored');
 pending[2].resolve({users:[{figmaUserId:'second'}],pagination:{total:2}});await next;assert.equal(context.statisticsUsers.length,2);
});
test('failed sorting retains rows and appends with the committed search and sort',async()=>{
 const {pending,context,load}=harness([{figmaUserId:'visible'}]);
 context.statisticsCommitted.query='displayed-search';context.userSearch='failed-search';context.statisticsSort='pag';
 const sorting=load();await load(true);assert.equal(pending.length,1,'append is blocked during sorting');
 pending[0].reject(Error('failed'));await sorting;assert.equal(context.statisticsUsers[0].figmaUserId,'visible');assert.equal(context.statisticsSort,'opens');
 const more=load(true);assert.equal(pending[1].body.query,'displayed-search');assert.equal(pending[1].body.sort,'opens');
 pending[1].resolve({users:[],pagination:{total:1}});await more;
});
test('sorting loaded pages fetches enough of the new global ordering before committing',async()=>{
 const initial=Array.from({length:112},(_,i)=>({figmaUserId:'old-'+i}));
 const {pending,context,load}=harness(initial);
 context.statisticsSort='pag';const sorting=load();
 for(const [index,count] of [[0,50],[1,50],[2,12]]){
  assert.equal(pending[index].body.offset,index*50);assert.equal(pending[index].body.sort,'pag');
  pending[index].resolve({users:Array.from({length:count},(_,i)=>({figmaUserId:'sorted-'+(index*50+i)})),pagination:{total:112}});
  await new Promise(r=>setImmediate(r));
  if(index<2)assert.equal(context.statisticsUsers[0].figmaUserId,'old-0','no partial page replaces displayed data');
 }
 await sorting;assert.equal(context.statisticsUsers.length,112);assert.equal(context.statisticsUsers[111].figmaUserId,'sorted-111');
});
test('navigation epoch invalidates responses and request busy state is released',async()=>{
 const {pending,context,load}=harness([{figmaUserId:'visible'}]);const sorting=load();context.pageEpoch++;
 pending[0].resolve({users:[{figmaUserId:'stale'}],pagination:{total:1}});await sorting;
 assert.equal(context.statisticsUsers[0].figmaUserId,'visible');assert.equal(context.statisticsBusy,0);
});
