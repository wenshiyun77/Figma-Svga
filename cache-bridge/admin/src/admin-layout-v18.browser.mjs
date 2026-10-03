import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// Run the real released UI, replacing only authentication/API boundaries.
const { chromium } = createRequire(import.meta.url)('playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.env.ADMIN_QA_OUTPUT || '/tmp/admin-layout-v18';
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  try {
    const file = path.join(root, new URL(req.url, 'http://local').pathname);
    let data = fs.readFileSync(file);
    if (file.endsWith('/app.mjs')) data = data.toString().replace(
      '(async()=>{if(restoreSession()&&await verify())shell();else loginView()})();',
      "token='qa';expiresAt=Date.now()/1000+3600;shell();"
    );
    res.setHeader('Content-Type', /\.(mjs|js)$/.test(file) ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(data);
  } catch { res.statusCode = 404; res.end('missing'); }
}).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const browser = await chromium.launch({
  executablePath: process.env.ADMIN_QA_CHROME || '/tmp/pag-browser-fixed/chrome-headless-shell-linux64/chrome-headless-shell',
  args: ['--no-sandbox']
});
const fields = { number:'userNumber', name:'displayName', opens:'totalOpenCount', exports:'totalExportCount', figmaImports:'totalFigmaImportCount', sequenceImports:'totalSequenceImportCount', svga:'totalSvgaExportCount', webp:'totalWebpExportCount', gif:'totalGifExportCount', lottie:'totalLottieExportCount', webm:'totalWebmExportCount', pag:'totalPagExportCount' };
const users = Array.from({ length: 112 }, (_, i) => ({
  figmaUserId:'qa-'+i, userNumber:i+1, displayName:'测试用户 '+String(i).padStart(3, '0'),
  ...Object.fromEntries(Object.values(fields).filter(f => f.startsWith('total')).map(f => [f, (i+1)*7])),
  openCount:13, figmaImportCount:11, svgaExportCount:2, otherExportCount:15,
  webpExportCount:1, gifExportCount:2, lottieExportCount:3, webmExportCount:4, pagExportCount:5,
  lastOpenedAt:'2026-10-03T09:00:00Z', pluginVersion:'0.8.69',
  subscription:{ plan:'trial', startedAt:'2026-10-01T09:19:00Z', expiresAt:'2026-10-08T09:19:00Z', daysRemaining:6 }
}));
users[111].lastLoginAt='2026-10-02T00:01:00Z';delete users[110].lastOpenedAt;
const sorted = data => [...users].sort((a,b) => {
  const av=a[fields[data.sort]], bv=b[fields[data.sort]];
  return (typeof av === 'number' ? av-bv : String(av).localeCompare(String(bv))) * (data.sortDirection === 'asc' ? 1 : -1);
}).map((u,i) => ({...u, statisticRank:i+1}));
const response = data => ({ users:sorted(data).slice(data.offset, data.offset+data.limit), pagination:{ total:users.length } });
const requests = [], pending = [];
let hold = false;
const page = await browser.newPage({ viewport:{width:1440,height:1000} });
await page.addInitScript(() => localStorage.setItem('svga-admin-auth-v1',JSON.stringify({access_token:'qa',refresh_token:'qa',expires_at:Math.floor(Date.now()/1000)+3600})));
await page.route('https://nepilrihisogontdkcqi.supabase.co/**', async route => {
  const data = route.request().postDataJSON() || {};
  requests.push(data);
  if(data.action === 'admin-state') return route.fulfill({json:{isAdmin:true}});
  if(data.action === 'admin-users') return route.fulfill({json:{users:users.slice(0,4),summary:{totalUsers:112},pagination:{total:4}}});
  if(data.action === 'admin-user-statistics') {
    if(hold) return new Promise(resolve => pending.push({data, route, resolve}));
    return route.fulfill({json:response(data)});
  }
  return route.fulfill({json:[]});
});
const waitPending = async count => { const deadline=Date.now()+3000;while(pending.length<count&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));assert.equal(pending.length,count); };
const complete = async (item, json = response(item.data), status = 200) => {
  await item.route.fulfill({status,json}); item.resolve();
};
const geometry = () => page.evaluate(() => {
  const sc = document.querySelector('.statistics-scroll');
  const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
  return {x:sc.scrollLeft,y:sc.scrollTop,pageY:window.scrollY,scroll:rect(sc),headers:[...document.querySelectorAll('.statistics-table th')].map(rect)};
});
const stable = (before, after) => {
  assert.equal(after.x,before.x,'horizontal scroll preserved');
  assert.equal(after.y,before.y,'vertical scroll preserved');
  assert.equal(after.pageY,before.pageY,'page scroll preserved');
  assert.deepEqual(after.scroll,before.scroll,'scroll area geometry preserved');
  assert.deepEqual(after.headers,before.headers,'header widths and positions preserved');
};
try {
  await page.goto(process.env.ADMIN_QA_URL || 'http://127.0.0.1:'+server.address().port+'/index.html');
  await page.waitForSelector('.user');
  // Regression: expanding details must never move avatar or PRO controls.
  for (const width of [1440, 1000, 760, 390]) {
    await page.setViewportSize({width,height:1000});
    const card = page.locator('.user').first();
    const avatar = await card.locator('.avatar').boundingBox();
    const controls = await card.locator('.proButtons').boundingBox();
    assert.ok(Math.abs(avatar.y+avatar.height/2-controls.y-controls.height/2)<1,'avatar and PRO controls share center');
    await card.locator('.other-export-toggle').click();
    const items = await card.locator('.other-export-breakdown span').evaluateAll(els => els.map(el => ({top:el.getBoundingClientRect().top,text:el.textContent})));
    assert.equal(items.length,5);
    assert.equal(new Set(items.map(i=>i.top)).size,1,'all five export formats fit one row');
    assert.deepEqual(await card.locator('.avatar').boundingBox(),avatar,'expansion keeps avatar fixed');
    assert.deepEqual(await card.locator('.proButtons').boundingBox(),controls,'expansion keeps PRO controls fixed');
    await page.screenshot({path:path.join(output,'card-'+width+'.png')});
    await card.locator('.other-export-toggle').click();
  }
  await page.setViewportSize({width:1100,height:1000});
  await page.locator('[data-mode="statistics"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.statistics-table tbody tr').length===50);
  assert.equal(await page.locator('thead th').count(),13,'date columns removed');
  assert.deepEqual(await page.locator('tbody tr td:nth-child(3) small').allTextContents().then(v=>v.slice(0,2)),['2026/10/02 08:01','—'],'ranking name metadata shows last login time, fallback and empty marker');
  const headerText = await page.locator('thead').innerText();
  assert.ok(!headerText.includes('首次使用')&&!headerText.includes('最近打开'));
  await page.evaluate(()=>{window.qaScroll=document.querySelector('.statistics-scroll');window.qaTable=document.querySelector('.statistics-table');qaScroll.scrollLeft=160;qaScroll.scrollTop=380;});
  const before = await geometry();
  assert.ok(before.x>0&&before.y>0,'test exercises both scroll axes');
  const oldRows = await page.locator('tbody').innerText();
  hold=true;
  // DOM click avoids Playwright auto-scrolling the button into view.
  await page.locator('[data-stat-sort="pag"]').last().evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#userStatus').textContent.includes('正在'));
  assert.equal(await page.locator('tbody').innerText(),oldRows,'old rows stay visible while sort awaits API');
  stable(before,await geometry());
  await page.locator('#statisticsLoadMore').evaluate(el=>el.click());
  assert.equal(pending.length,1,'append cannot enter while sorting');
  await complete(pending[0]);
  await page.waitForFunction(()=>[...document.querySelectorAll('th button[data-stat-sort="pag"]')].at(-1).closest('th').getAttribute('aria-sort')==='descending');
  stable(before,await geometry());
  assert.equal(await page.evaluate(()=>qaScroll===document.querySelector('.statistics-scroll')&&qaTable===document.querySelector('.statistics-table')),true,'container and table reused');
  // Ascending/descending while old request is delayed; newest response wins.
  await page.locator('[data-stat-sort="pag"]').last().evaluate(el=>el.click());
  await page.locator('[data-stat-sort="exports"]').last().evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#userStatus').textContent.includes('正在'));
  await waitPending(3);
  await complete(pending[2]);
  await page.waitForFunction(()=>document.querySelector('#userStatus').textContent.includes('共'));
  const freshRows = await page.locator('tbody').innerText();
  await complete(pending[1]);
  assert.equal(await page.locator('tbody').innerText(),freshRows,'late response ignored');
  stable(before,await geometry());
  // Sort failure keeps data/geometry and load-more resumes the committed sort.
  await page.locator('[data-stat-sort="gif"]').last().evaluate(el=>el.click());
  await waitPending(4);
  await complete(pending[3],{error:'QA rejected sort'},500);
  await page.waitForFunction(()=>document.querySelector('#userStatus').textContent==='QA rejected sort');
  assert.equal(await page.locator('tbody').innerText(),freshRows);
  stable(before,await geometry());
  await page.locator('#statisticsLoadMore').evaluate(el=>el.click());
  await page.locator('#statisticsLoadMore').evaluate(el=>el.click());
  await waitPending(5);
  assert.equal(pending.length,5,'duplicate append does not start a second request');
  assert.equal(pending[4].data.sort,'exports','append uses committed sort after failed new sort');
  assert.equal(pending[4].data.offset,50);
  await complete(pending[4]);
  await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===100);
  stable(before,await geometry());
  hold=false;
  await page.locator('#statisticsLoadMore').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===112);
  const counts = await page.locator('tbody tr td:nth-child(5)').allTextContents();
  assert.deepEqual(counts.map(v=>Number(v.replaceAll(',',''))),users.map(u=>u.totalExportCount).sort((a,b)=>b-a),'all pages remain globally sorted');
  // Sorting after pagination retains the number of displayed rows and deep scroll.
  await page.evaluate(()=>{qaScroll.scrollTop=2800;});
  const deep=await geometry();
  await page.locator('[data-stat-sort="pag"]').last().evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#userStatus').textContent.includes('共')&&[...document.querySelectorAll('th button[data-stat-sort="pag"]')].at(-1).closest('th').getAttribute('aria-sort')==='descending');
  assert.equal(await page.locator('tbody tr').count(),112);
  stable(deep,await geometry());
  for (const key of Object.keys(fields)) {
    await page.locator('[data-stat-sort="'+key+'"]').last().evaluate(el=>el.click());
    await page.waitForFunction(key=>document.querySelector('#userStatus').textContent.includes('共')&&document.querySelector('th button[data-stat-sort="'+key+'"]')?.closest('th').getAttribute('aria-sort')!=='none',key);
    assert.equal(requests.filter(r=>r.action==='admin-user-statistics').at(-1).sort,key);
    stable(deep,await geometry());
  }
  const report={build:await page.evaluate(()=>window.__SVGA_ADMIN_BUILD__),cardWidths:[1440,1000,760,390],formatsInOneRow:true,controlsFixed:true,dateColumnsRemoved:true,scrollPreserved:true,stableColumnWidths:true,delayedDataRetained:true,staleResponseIgnored:true,duplicateAppendBlocked:true,failedSortPreservesCommittedPagination:true,globallySortedRows:112,loadedRowsAndDeepScrollPreserved:true,sortableKeys:Object.keys(fields),requests:requests.filter(r=>r.action==='admin-user-statistics')};
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
  await page.screenshot({path:path.join(output,'statistics.png')});
  console.log(JSON.stringify(report));
} finally { await browser.close(); server.close(); }
