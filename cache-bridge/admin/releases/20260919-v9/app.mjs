const ADMIN_BUILD='20260919-v9';
window.__SVGA_ADMIN_BUILD__=ADMIN_BUILD;
const EMAIL='wenshiyun77@gmail.com';
const BASE='https://nepilrihisogontdkcqi.supabase.co';
const KEY='sb_publishable_SnT1-Gwl82d_P0HCIfS6Tw_2m8Azxd6';
const FN=BASE+'/functions/v1/plugin-control';
const STORE='svga-admin-auth-v1';
const ADMIN_USER={figmaUserId:'1252421179015815869',displayName:'Admin',photoUrl:null,sessionId:0,pluginVersion:'web-admin-v2'};
let token='',refreshToken='',expiresAt=0,route='users',userMode='online',userSearch='',proOnly=false,official=null,personal=null,materialTab='official',backfillBusy=false,usersLoadSeq=0,pageEpoch=0,previewObserver=null;
let selectedCategory='all',categoryEditMode=false,officialLoading=false,uploading=false,userPagingObserver=null;
const uploadQueue=[];
const $=s=>document.querySelector(s),app=$('#app'),num=v=>Number(v||0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bj=v=>v?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v)):'-';
const fmtBytes=n=>{n=Math.max(0,num(n));return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`};
const yieldToMain=()=>new Promise(r=>'requestIdleCallback'in window?requestIdleCallback(()=>r(),{timeout:80}):setTimeout(r,0));
function toast(message,error=false){const n=document.createElement('div');n.className='toast'+(error?' err':'');n.textContent=message;document.body.append(n);setTimeout(()=>n.remove(),2600)}
function saveSession(s){if(!s){token=refreshToken='';expiresAt=0;localStorage.removeItem(STORE);return}token=s.access_token||'';refreshToken=s.refresh_token||'';expiresAt=Number(s.expires_at||Math.floor(Date.now()/1000)+Number(s.expires_in||3600));localStorage.setItem(STORE,JSON.stringify({access_token:token,refresh_token:refreshToken,expires_at:expiresAt}))}
function restoreSession(){try{const s=JSON.parse(localStorage.getItem(STORE)||'null');if(!s?.access_token||!s?.refresh_token)return false;token=s.access_token;refreshToken=s.refresh_token;expiresAt=Number(s.expires_at||0);return true}catch{return false}}
async function auth(password){const r=await fetch(BASE+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'content-type':'application/json'},body:JSON.stringify({email:EMAIL,password})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.msg||j.error_description||j.error||'登录失败');saveSession(j)}
async function refresh(){if(!refreshToken)throw Error('登录状态已失效');const r=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'content-type':'application/json'},body:JSON.stringify({refresh_token:refreshToken})});const j=await r.json().catch(()=>({}));if(!r.ok){saveSession(null);throw Error('登录状态已失效')}saveSession(j)}
async function request(action,body={}){if(!token)throw Error('请先登录管理员账号');if(expiresAt<=Math.floor(Date.now()/1000)+60)await refresh();const send=()=>fetch(FN,{method:'POST',headers:{Authorization:'Bearer '+token,apikey:KEY,'content-type':'application/json'},body:JSON.stringify({action,...body})});let r=await send();if(r.status===401){await refresh();r=await send()}const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(r.status===403?'当前账号不是管理员':(j.error||j.message||`请求失败（${r.status}）`));return j}
async function adminRpc(name,body={}){if(!token)throw Error('请先登录管理员账号');if(expiresAt<=Math.floor(Date.now()/1000)+60)await refresh();const send=()=>fetch(BASE+'/rest/v1/rpc/'+name,{method:'POST',headers:{Authorization:'Bearer '+token,apikey:KEY,'content-type':'application/json'},body:JSON.stringify(body)});let r=await send();if(r.status===401){await refresh();r=await send()}const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.message||j.error_description||j.error||`请求失败（${r.status}）`);return j}
async function verify(){try{return(await request('admin-state',{user:ADMIN_USER})).isAdmin===true}catch{return false}}
function loginView(message=''){pageEpoch++;app.innerHTML=`<main class="login"><form class="login-card" id="loginForm"><div class="brand">SVGA</div><h1>管理后台</h1><div class="muted">已绑定账号 w••••@gmail.com</div><input name="password" type="password" placeholder="输入密码" autocomplete="current-password" required>${message?`<div class="login-error">${esc(message)}</div>`:''}<button class="btn">登录</button></form></main>`;$('#loginForm').onsubmit=async e=>{e.preventDefault();const b=e.currentTarget.querySelector('button');b.disabled=true;b.textContent='登录中…';try{await auth(e.currentTarget.password.value);if(!await verify())throw Error('当前账号不是管理员');shell()}catch(err){loginView(err.message)}}}
function shell(){app.innerHTML=`<div class="shell"><aside class="side"><div class="side-brand"><span class="side-logo">S</span><div><strong>SVGA 编辑器</strong><small>管理后台</small></div></div><nav class="nav"><button data-route="users">用户数据</button><button data-route="materials">素材管理</button><button data-route="feedback">用户反馈</button></nav><button class="btn secondary logout" id="logout">退出登录</button></aside><main class="main" id="page"></main></div>`;document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=b.dataset.route;render()});$('#logout').onclick=()=>{saveSession(null);loginView()};render()}
function render(){pageEpoch++;if(previewObserver)previewObserver.disconnect();if(userPagingObserver)userPagingObserver.disconnect();document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route));if(route==='users')usersPage();else if(route==='materials')materialsPage();else feedbackPage()}
function avatarMarkup(u){if(u.photoUrl)return`<span class="avatar"><img src="${esc(u.photoUrl)}" alt="" loading="lazy" decoding="async"></span>`;return`<span class="avatar">${esc((u.displayName||'?').trim().slice(0,1).toUpperCase()||'?')}</span>`}
function userCard(u,index){const detailId=`other-export-${index}`;return`<article class="user">${avatarMarkup(u)}<div class="user-copy"><div class="row user-name-row"><strong><span class="number-badge">#${String(num(u.userNumber)).padStart(6,'0')}</span> ${esc(u.displayName||'未命名用户')}</strong>${u.isOnline?'<span class="badge ok">在线</span>':''}${u.isAdmin?'<span class="badge admin">管理员</span>':''}</div><div class="muted user-meta">${esc(u.figmaUserId)} · 最近打开 ${bj(u.lastOpenedAt)} · v${esc(u.pluginVersion||'-')}</div><div class="stats"><span><strong>${num(u.openCount)}</strong>打开</span><span><strong>${num(u.figmaImportCount)}</strong>Figma 导入</span><span><strong>${num(u.svgaExportCount)}</strong>SVGA 导出</span><button class="stat-button other-export-toggle" data-target="${detailId}" aria-expanded="false"><strong>${num(u.otherExportCount)}</strong>其他导出 · 查看</button><span><strong>${num(u.sequenceImportCount)}</strong>序列帧</span><div class="other-export-breakdown" id="${detailId}" hidden><span><strong>${num(u.webpExportCount)}</strong>WebP</span><span><strong>${num(u.gifExportCount)}</strong>GIF</span><span><strong>${num(u.lottieExportCount)}</strong>Lottie</span><span><strong>${num(u.webmExportCount)}</strong>WebM</span></div></div></div><button class="btn secondary proBtn" data-id="${esc(u.figmaUserId)}" data-on="${u.features?.lighting?'1':'0'}">${u.features?.lighting?'已开通PRO':'未开通PRO'}</button></article>`}
function applyProButtonState(button,enabled){button.dataset.on=enabled?'1':'0';button.textContent=enabled?'已开通PRO':'未开通PRO'}
async function usersPage(){const p=$('#page');p.innerHTML=`<div class="head"><div><h1>用户数据</h1><div class="muted">北京时间统计</div></div><button class="btn secondary" id="reloadUsers">刷新</button></div><div class="grid5" id="summary"></div><div class="toolbar"><div class="tabs"><button data-mode="online">在线</button><button data-mode="daily">当日</button><button data-mode="history">历史</button><button data-mode="pro">PRO</button></div><form class="search" id="userSearch"><input name="q" value="${esc(userSearch)}" placeholder="昵称 / Figma ID / #编号"><button class="btn">搜索</button></form></div><div class="status" id="userStatus">加载中…</div><div class="list" id="userList"></div>`;$('#reloadUsers').onclick=()=>loadUsers();document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===(proOnly?'pro':userMode));b.onclick=()=>{const m=b.dataset.mode;proOnly=m==='pro';userMode=proOnly?'history':m;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));loadUsers()}});$('#userSearch').onsubmit=e=>{e.preventDefault();userSearch=e.currentTarget.q.value.trim();loadUsers()};$('#userList').addEventListener('click',async e=>{const toggle=e.target.closest('.other-export-toggle');if(toggle){const d=document.getElementById(toggle.dataset.target);if(d){const open=d.hidden;d.hidden=!open;toggle.dataset.expanded=open?'true':'false';toggle.setAttribute('aria-expanded',open?'true':'false')}return}const pro=e.target.closest('.proBtn');if(!pro)return;const next=pro.dataset.on!=='1';if(!confirm(`确认设置为${next?'已开通PRO':'未开通PRO'}？`))return;try{pro.disabled=true;await request('admin-user-feature',{figmaUserId:pro.dataset.id,feature:'lighting',enabled:next});applyProButtonState(pro,next);toast(next?'已开通 PRO':'已关闭 PRO')}catch(err){toast(err.message,true)}finally{pro.disabled=false}});await loadUsers()}
async function loadUsers(){const seq=++usersLoadSeq;if($('#userStatus'))$('#userStatus').textContent='加载中…';try{const d=await request('admin-users',{mode:userMode,query:userSearch,proOnly,offset:0,limit:50});if(seq!==usersLoadSeq||route!=='users')return;const s=d.summary||{};$('#summary').innerHTML=[['在线用户',s.onlineUsers],['当日用户',s.dailyUsers],['历史用户',s.totalUsers],['PRO 人数',s.proUsers],['当日打开',s.dailyOpens]].map(([a,b])=>`<div class="summary"><span>${a}</span><strong>${num(b)}</strong></div>`).join('');const total=num(d.pagination?.total),users=d.users||[];$('#userStatus').textContent=`共 ${total} 人 · 已加载 ${users.length}`;$('#userList').innerHTML=users.map(userCard).join('')||'<div class="status">没有匹配的用户</div>';setupUserPagination(total)}catch(err){if(seq===usersLoadSeq&&$('#userStatus'))$('#userStatus').textContent=err.message;toast(err.message,true)}}

async function loadMoreUsers(){
  const list=$('#userList'),sentinel=$('#userLoadMoreSentinel');
  if(!list||!sentinel||sentinel.dataset.loading==='1')return;
  const total=num(sentinel.dataset.total),offset=list.querySelectorAll('.user').length;
  if(offset>=total){sentinel.remove();return}
  sentinel.dataset.loading='1';sentinel.textContent=`正在加载 ${offset+1}–${Math.min(offset+50,total)}…`;
  const signature=`${userMode}|${userSearch}|${proOnly}|${pageEpoch}`;
  try{
    const data=await request('admin-users',{mode:userMode,query:userSearch,proOnly,offset,limit:50});
    if(signature!==`${userMode}|${userSearch}|${proOnly}|${pageEpoch}`||route!=='users')return;
    const users=data.users||[];
    sentinel.remove();
    if(users.length)list.insertAdjacentHTML('beforeend',users.map((user,index)=>userCard(user,offset+index)).join(''));
    const loaded=offset+users.length,nextTotal=num(data.pagination?.total)||total;
    $('#userStatus').textContent=`共 ${nextTotal} 人 · 已加载 ${loaded}`;
    setupUserPagination(nextTotal);
  }catch(err){sentinel.dataset.loading='0';sentinel.innerHTML='<button class="btn secondary" type="button">加载失败，点击重试</button>';sentinel.querySelector('button').onclick=loadMoreUsers}
}

function setupUserPagination(total){
  userPagingObserver?.disconnect();
  const list=$('#userList');if(!list)return;
  const loaded=list.querySelectorAll('.user').length;
  $('#userLoadMoreSentinel')?.remove();
  if(!total||loaded>=total)return;
  const sentinel=document.createElement('div');
  sentinel.id='userLoadMoreSentinel';sentinel.className='status';sentinel.dataset.total=String(total);sentinel.innerHTML='<button class="btn secondary" type="button">继续加载更多用户</button>';
  sentinel.querySelector('button').onclick=loadMoreUsers;list.append(sentinel);
  if('IntersectionObserver'in window){userPagingObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))void loadMoreUsers()},{rootMargin:'700px 0px'});userPagingObserver.observe(sentinel)}
}
function hydrateLazyPreviews(root=document){if(previewObserver)previewObserver.disconnect();const imgs=[...root.querySelectorAll('img[data-src]')];if(!imgs.length)return;if(!('IntersectionObserver'in window)){imgs.forEach(img=>{img.src=img.dataset.src;delete img.dataset.src});return}previewObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const img=entry.target;img.src=img.dataset.src;delete img.dataset.src;previewObserver.unobserve(img)}},{rootMargin:'280px 0px'});imgs.forEach(img=>previewObserver.observe(img))}
const previewMarkup=(url,name='')=>url?`<img data-src="${esc(url)}" alt="${esc(name)}" loading="lazy" decoding="async">`:'无动态预览';
async function materialsPage(){
  const p=$('#page');
  p.innerHTML=`<section data-material-controller="v9"><div class="head"><div><h1>素材管理</h1><div class="muted">单一素材控制器 · 动态预览按需加载</div></div><div class="head-actions"><input id="folderInput" type="file" webkitdirectory multiple hidden><button class="btn secondary" id="backfillPreviews">补齐缺失预览</button><button class="btn" id="uploadFolder">添加文件夹</button><button class="btn" id="uploadQueueStart" hidden>开始上传</button><button class="btn secondary" id="uploadQueueClear" hidden>清空</button><span class="muted" id="uploadQueueSummary" hidden></span></div></div><div class="tabs"><button class="active" id="officialTab">官方素材</button><button id="personalTab">用户素材</button></div><div class="status" id="materialStatus"></div><div id="materialBody"></div></section>`;
  const input=$('#folderInput');
  $('#uploadFolder').onclick=()=>input.click();
  input.onchange=event=>{enqueueOfficialFiles(event.target.files);event.target.value=''};
  $('#uploadQueueStart').onclick=flushOfficialUploadQueue;
  $('#uploadQueueClear').onclick=()=>{uploadQueue.length=0;renderUploadQueue()};
  const uploadButton=$('#uploadFolder');
  uploadButton.addEventListener('dragover',event=>{event.preventDefault();uploadButton.classList.add('active')});
  uploadButton.addEventListener('dragleave',()=>uploadButton.classList.remove('active'));
  uploadButton.addEventListener('drop',async event=>{event.preventDefault();uploadButton.classList.remove('active');enqueueOfficialFiles(await filesFromDrop(event.dataTransfer))});
  $('#backfillPreviews').onclick=()=>materialTab==='official'?backfillOfficial():backfillPersonal();
  $('#officialTab').onclick=()=>{materialTab='official';setMaterialTab(true);void loadOfficialMaterials()};
  $('#personalTab').onclick=()=>{materialTab='personal';setMaterialTab(false);void loadPersonal('')};
  materialTab='official';
  setMaterialTab(true);
  await loadOfficialMaterials();
}

function setMaterialTab(isOfficial){
  $('#officialTab')?.classList.toggle('active',isOfficial);
  $('#personalTab')?.classList.toggle('active',!isOfficial);
  if($('#uploadFolder'))$('#uploadFolder').hidden=!isOfficial;
  renderUploadQueue();
}

const officialLockSvg='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.4a3.5 3.5 0 0 1 7 0V7"/><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M8 10v1.5"/></svg>';
const officialEditSvg='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 11.8.4-2.5 6.9-6.9a1.4 1.4 0 0 1 2 0l1.3 1.3a1.4 1.4 0 0 1 0 2l-6.9 6.9-2.5.4Z"/><path d="m9.4 3.3 3.3 3.3"/></svg>';
const materialName=value=>{const name=String(value||'').trim();if(!name)throw Error('标签名称不能为空');if(Array.from(name).length>8)throw Error('标签名称最多 8 个字符');return name};

async function loadOfficialMaterials(){
  if(officialLoading||route!=='materials'||materialTab!=='official')return;
  officialLoading=true;
  const status=$('#materialStatus');
  if(status)status.textContent=official?'正在刷新官方素材…':'加载官方素材…';
  try{
    const [base,counts]=await Promise.all([
      request('admin-sequences'),
      adminRpc('svga_admin_official_sequence_usage_counts').catch(()=>[]),
    ]);
    if(route!=='materials'||materialTab!=='official')return;
    const usage=new Map((counts||[]).map(row=>[String(row.sequence_set_id||''),num(row.usage_count)]));
    official={...base,sequences:(base.sequences||[]).map(set=>({...set,usageCount:usage.get(String(set.id||''))||0}))};
    renderOfficialMaterials();
  }catch(err){
    if(status)status.textContent=official?'刷新失败，当前素材保持不变':err.message;
    toast(err.message,true);
  }finally{officialLoading=false}
}

function officialCategoryBar(categories){
  const items=categories.map(category=>categoryEditMode
    ? `<div class="official-category-editor" draggable="true" data-id="${esc(category.id)}"><span class="official-category-drag" title="拖拽调整顺序">⋮⋮</span><input class="official-category-name" maxlength="8" value="${esc(category.name)}" data-original="${esc(category.name)}" aria-label="编辑标签 ${esc(category.name)}"></div>`
    : `<button class="official-category-chip${selectedCategory===String(category.id)?' active':''}" type="button" data-filter-category="${esc(category.id)}">${esc(category.name)}</button>`).join('');
  return `<div class="official-v6-category-row"><button class="official-category-chip fixed${selectedCategory==='all'?' active':''}" type="button" data-filter-category="all">全部</button><div class="official-v6-category-list" id="officialV9CategoryList">${items}</div><button class="official-category-tool" type="button" id="officialV9Add" title="添加标签" aria-label="添加标签">+</button><button class="official-category-tool${categoryEditMode?' active':''}" type="button" id="officialV9Edit" title="编辑标签" aria-label="编辑标签">${officialEditSvg}</button></div>`;
}

function officialMaterialCard(set,categories){
  const preview=set.previewFrames?.[0]?`<img data-src="${esc(set.previewFrames[0])}" alt="${esc(set.name)}" loading="lazy" decoding="async">`:'<span class="official-preview-empty">无动态预览</span>';
  return `<article class="card official-v6-card" data-sequence-id="${esc(set.id)}"><div class="preview official-v6-preview">${preview}<button class="official-lock-button${set.locked?' is-locked':''}" type="button" data-lock-id="${esc(set.id)}" data-lock-on="${set.locked?'1':'0'}" title="${set.locked?'解除锁定':'锁定素材'}" aria-label="${set.locked?'解除锁定':'锁定素材'}">${officialLockSvg}</button></div><div class="body"><div class="official-card-title-row"><strong title="${esc(set.name)}">${esc(set.name)}</strong><span>使用 ${num(set.usageCount)}</span></div><div class="muted">${set.frames?.length||0} 帧 · 排序 ${num(set.sortOrder)}</div><select class="official-category-select" data-category-id="${esc(set.id)}"><option value="">未分类</option>${categories.map(category=>`<option value="${esc(category.id)}" ${String(set.categoryId||'')===String(category.id)?'selected':''}>${esc(category.name)}</option>`).join('')}</select><div class="actions official-card-actions"><button class="btn secondary" type="button" data-rename-id="${esc(set.id)}" data-name="${esc(set.name)}">重命名</button><button class="btn secondary" type="button" data-enable-id="${esc(set.id)}" data-enable-on="${set.enabled?'1':'0'}">${set.enabled?'隐藏':'显示'}</button><button class="btn danger" type="button" data-delete-id="${esc(set.id)}" data-name="${esc(set.name)}">删除</button></div></div></article>`;
}

function renderOfficialMaterials(){
  if(route!=='materials'||materialTab!=='official'||!official)return;
  const body=$('#materialBody'),categories=official.categories||[],all=official.sequences||[];
  if(selectedCategory!=='all'&&!categories.some(category=>String(category.id)===selectedCategory))selectedCategory='all';
  const shown=selectedCategory==='all'?all:all.filter(set=>String(set.categoryId||'')===selectedCategory);
  body.innerHTML=`<section class="official-v6-root">${officialCategoryBar(categories)}<div class="materials official-v6-materials">${shown.map(set=>officialMaterialCard(set,categories)).join('')||'<div class="status">当前标签暂无素材</div>'}</div></section>`;
  const missing=all.filter(set=>!(set.previewAnimated&&set.previewFrames?.[0])).length;
  $('#materialStatus').textContent=`全部 ${all.length} 套 · 当前 ${shown.length} 套${missing?` · ${missing} 套缺少动态预览`:''}`;
  wireOfficialMaterials();
  hydrateLazyPreviews(body);
  renderUploadQueue();
}

function updateOfficialSnapshot(id,patch){const set=(official?.sequences||[]).find(item=>String(item.id)===String(id));if(set)Object.assign(set,patch);return set}
function lockButtonState(button,locked){button.dataset.lockOn=locked?'1':'0';button.classList.toggle('is-locked',locked);button.title=locked?'解除锁定':'锁定素材';button.setAttribute('aria-label',button.title)}

function wireOfficialMaterials(){
  document.querySelectorAll('[data-filter-category]').forEach(button=>button.onclick=()=>{if(categoryEditMode&&button.dataset.filterCategory!=='all')return;selectedCategory=button.dataset.filterCategory||'all';renderOfficialMaterials()});
  $('#officialV9Edit')?.addEventListener('click',()=>{categoryEditMode=!categoryEditMode;renderOfficialMaterials()});
  $('#officialV9Add')?.addEventListener('click',async()=>{const raw=prompt('标签名称（最多 8 个字符）');if(raw===null)return;try{await request('admin-sequence-category-create',{name:materialName(raw)});selectedCategory='all';await loadOfficialMaterials()}catch(err){toast(err.message,true)}});
  document.querySelectorAll('.official-category-name').forEach(input=>{
    let cancelled=false;
    input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();input.blur()}else if(event.key==='Escape'){cancelled=true;input.value=input.dataset.original||'';input.blur()}};
    input.onblur=async()=>{if(cancelled)return;const original=input.dataset.original||'';let name;try{name=materialName(input.value)}catch(err){toast(err.message,true);input.value=original;return}if(name===original)return;try{input.disabled=true;await request('admin-sequence-category-update',{id:input.closest('[data-id]').dataset.id,name});const category=(official.categories||[]).find(item=>String(item.id)===String(input.closest('[data-id]').dataset.id));if(category)category.name=name;input.dataset.original=name;toast('标签名称已更新')}catch(err){toast(err.message,true);input.value=original}finally{input.disabled=false}};
  });
  document.querySelectorAll('.official-category-editor').forEach(node=>{
    node.ondragstart=event=>{node.classList.add('dragging');event.dataTransfer.effectAllowed='move'};
    node.ondragover=event=>{event.preventDefault();const dragging=document.querySelector('.official-category-editor.dragging');if(!dragging||dragging===node)return;const rect=node.getBoundingClientRect();node.parentElement.insertBefore(dragging,event.clientX<rect.left+rect.width/2?node:node.nextSibling)};
    node.ondragend=async()=>{node.classList.remove('dragging');const ids=[...document.querySelectorAll('#officialV9CategoryList [data-id]')].map(item=>item.dataset.id);try{await adminRpc('reorder_svga_official_sequence_categories',{p_ids:ids});official.categories=ids.map(id=>official.categories.find(category=>String(category.id)===String(id))).filter(Boolean);toast('标签顺序已同步到插件')}catch(err){toast(err.message,true);renderOfficialMaterials()}};
  });
  document.querySelectorAll('[data-lock-id]').forEach(button=>button.onclick=async()=>{const next=button.dataset.lockOn!=='1';try{button.disabled=true;await request('admin-sequence-update',{id:button.dataset.lockId,locked:next});updateOfficialSnapshot(button.dataset.lockId,{locked:next});lockButtonState(button,next)}catch(err){toast(err.message,true)}finally{button.disabled=false}});
  document.querySelectorAll('[data-category-id]').forEach(select=>select.onchange=async()=>{const id=select.dataset.categoryId,previous=(official.sequences||[]).find(item=>String(item.id)===String(id))?.categoryId||null,next=select.value||null;try{select.disabled=true;await request('admin-sequence-update',{id,categoryId:next});updateOfficialSnapshot(id,{categoryId:next});if(selectedCategory!=='all'&&String(next||'')!==selectedCategory)renderOfficialMaterials()}catch(err){toast(err.message,true);select.value=previous||''}finally{select.disabled=false}});
  document.querySelectorAll('[data-rename-id]').forEach(button=>button.onclick=async()=>{const raw=prompt('素材名称',button.dataset.name||'');if(!raw?.trim())return;const name=raw.trim();try{button.disabled=true;await request('admin-sequence-update',{id:button.dataset.renameId,name});updateOfficialSnapshot(button.dataset.renameId,{name});const card=button.closest('.official-v6-card'),title=card?.querySelector('.official-card-title-row strong');if(title){title.textContent=name;title.title=name}button.dataset.name=name;const del=card?.querySelector('[data-delete-id]');if(del)del.dataset.name=name}catch(err){toast(err.message,true)}finally{button.disabled=false}});
  document.querySelectorAll('[data-enable-id]').forEach(button=>button.onclick=async()=>{const next=button.dataset.enableOn!=='1';try{button.disabled=true;await request('admin-sequence-update',{id:button.dataset.enableId,enabled:next});updateOfficialSnapshot(button.dataset.enableId,{enabled:next});button.dataset.enableOn=next?'1':'0';button.textContent=next?'隐藏':'显示'}catch(err){toast(err.message,true)}finally{button.disabled=false}});
  document.querySelectorAll('[data-delete-id]').forEach(button=>button.onclick=async()=>{if(!confirm(`删除“${button.dataset.name||''}”及全部帧？`))return;try{button.disabled=true;await request('admin-sequence-delete',{id:button.dataset.deleteId});official.sequences=(official.sequences||[]).filter(item=>String(item.id)!==String(button.dataset.deleteId));renderOfficialMaterials()}catch(err){toast(err.message,true);button.disabled=false}});
}
async function loadPersonal(q=''){setMaterialTab(false);materialTab='personal';try{$('#materialStatus').textContent='加载用户素材…';personal=await request('admin-personal-sequences',{query:q});if(route!=='materials'||materialTab!=='personal')return;const users=personal.users||[],missing=users.reduce((n,u)=>n+(u.sequences||[]).filter(s=>!(s.previewAnimated&&s.previewFrames?.[0])).length,0);$('#materialStatus').textContent=`${personal.summary?.userCount||0} 名用户 · ${personal.summary?.sequenceCount||0} 套素材${missing?` · ${missing} 套缺少动态预览`:''}`;$('#materialBody').innerHTML=`<form class="search" id="personalSearch"><input name="q" value="${esc(q)}" placeholder="用户 / Figma ID / 素材名"><button class="btn">搜索</button></form><div class="spacer"></div>${users.length?users.map(personalUser).join(''):'<div class="status">没有用户素材</div>'}`;$('#personalSearch').onsubmit=e=>{e.preventDefault();loadPersonal(e.currentTarget.q.value.trim())};document.querySelectorAll('.personalRename').forEach(b=>b.onclick=()=>{const n=prompt('素材名称',b.dataset.name);if(n?.trim())request('admin-personal-sequence-update',{id:b.dataset.id,name:n.trim()}).then(()=>loadPersonal(q)).catch(err=>toast(err.message,true))});document.querySelectorAll('.personalDelete').forEach(b=>b.onclick=()=>{if(confirm(`删除“${b.dataset.name}”？`))request('admin-personal-sequence-delete',{id:b.dataset.id}).then(()=>loadPersonal(q)).catch(err=>toast(err.message,true))});document.querySelectorAll('.personalDownload').forEach(b=>b.onclick=async()=>{try{const d=await request('admin-personal-sequence-frames',{id:b.dataset.id});for(const f of d.frames||[])window.open(f.url,'_blank','noopener')}catch(err){toast(err.message,true)}});hydrateLazyPreviews($('#materialBody'))}catch(err){if($('#materialStatus'))$('#materialStatus').textContent=err.message;toast(err.message,true)}}
function personalUser(u){return`<section class="person"><div class="row">${avatarMarkup(u)}<div><strong>${esc(u.displayName||'未命名用户')}</strong><div class="muted">${esc(u.figmaUserId)} · ${fmtBytes(u.totalBytes)} / ${fmtBytes(u.capacityBytes)}</div></div></div><div class="materials person-materials">${(u.sequences||[]).map(s=>`<article class="card"><div class="preview">${previewMarkup(s.previewFrames?.[0],s.name)}</div><div class="body"><strong>${esc(s.name)}</strong><div class="muted">${s.frameCount} 帧 · ${fmtBytes(s.totalBytes)} · ${bj(s.updatedAt)}</div><div class="actions"><button class="btn secondary personalRename" data-id="${s.id}" data-name="${esc(s.name)}">重命名</button><button class="btn secondary personalDownload" data-id="${s.id}">下载帧</button><button class="btn danger personalDelete" data-id="${s.id}" data-name="${esc(s.name)}">删除</button></div></div></article>`).join('')}</div></section>`}
const read32=(a,o)=>(a[o]|a[o+1]<<8|a[o+2]<<16|a[o+3]<<24)>>>0;function set24(a,o,v){a[o]=v&255;a[o+1]=v>>8&255;a[o+2]=v>>16&255}function set32(a,o,v){a[o]=v&255;a[o+1]=v>>8&255;a[o+2]=v>>16&255;a[o+3]=v>>24&255}const ascii=s=>Uint8Array.from(s,c=>c.charCodeAt(0));function riffChunk(t,p){const a=new Uint8Array(8+p.length+(p.length%2));a.set(ascii(t));set32(a,4,p.length);a.set(p,8);return a}function concat(parts){const a=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let o=0;for(const p of parts){a.set(p,o);o+=p.length}return a}function extractFrame(b){if(String.fromCharCode(...b.slice(0,4))!=='RIFF'||String.fromCharCode(...b.slice(8,12))!=='WEBP')throw Error('WebP 帧无效');const parts=[];for(let o=12;o+8<=b.length;){const t=String.fromCharCode(...b.slice(o,o+4)),n=read32(b,o+4),e=o+8+n+(n%2);if(e>b.length)break;if(['ALPH','VP8 ','VP8L'].includes(t))parts.push(b.slice(o,e));o=e}return concat(parts)}function animatedWebp(frames,w,h){const x=new Uint8Array(10);x[0]=0x12;set24(x,4,w-1);set24(x,7,h-1);const anim=new Uint8Array(6),chunks=[riffChunk('VP8X',x),riffChunk('ANIM',anim)];for(const frame of frames){const d=extractFrame(frame),p=new Uint8Array(16+d.length);set24(p,6,w-1);set24(p,9,h-1);set24(p,12,125);p[15]=2;p.set(d,16);chunks.push(riffChunk('ANMF',p))}const body=4+chunks.reduce((n,c)=>n+c.length,0),out=new Uint8Array(8+body);out.set(ascii('RIFF'));set32(out,4,body);out.set(ascii('WEBP'),8);let o=12;for(const c of chunks){out.set(c,o);o+=c.length}return out}
async function makePreview(files){if(files.length<2)throw Error('动态预览至少需要 2 帧');const count=Math.min(24,files.length),sampled=Array.from({length:count},(_,i)=>files[Math.round(i*(files.length-1)/Math.max(1,count-1))]);const first=await createImageBitmap(sampled[0]),scale=Math.min(1,60/Math.max(first.width,first.height)),w=Math.max(1,Math.round(first.width*scale)),h=Math.max(1,Math.round(first.height*scale));first.close();const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:true}),frames=[];for(const f of sampled){await yieldToMain();const im=await createImageBitmap(f);ctx.clearRect(0,0,w,h);const sc=Math.min(w/im.width,h/im.height),dw=im.width*sc,dh=im.height*sc;ctx.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);im.close();const blob=await new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(Error('WebP 编码失败')),'image/webp',.08));frames.push(new Uint8Array(await blob.arrayBuffer()))}return new Blob([animatedWebp(frames,w,h)],{type:'image/webp'})}
const toDataUrl=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)});async function dimensions(file){await yieldToMain();const im=await createImageBitmap(file),d={width:im.width,height:im.height};im.close();return d}
const uploadNameLimit=120;
const truncateUploadName=value=>{const chars=Array.from(String(value||'未命名').trim()||'未命名');return chars.length<=uploadNameLimit?chars.join(''):chars.slice(0,uploadNameLimit-3).join('')+'...'};
const relativePath=file=>String(file?.webkitRelativePath||file?.name||'');
const activeUploadCategory=()=>{const id=String(selectedCategory||'');const category=(official?.categories||[]).find(item=>String(item.id)===id);return category?{id:String(category.id),name:String(category.name||'')}:{id:'',name:''}};
const folderNames=files=>[...new Set([...(files||[])].filter(file=>/^image\/(png|jpeg|webp|gif)$/i.test(file?.type||'')).map(file=>{const parts=relativePath(file).split('/').filter(Boolean);return truncateUploadName(parts.length>2?parts[1]:parts[0])}).filter(Boolean))];

function normalizeUploadFiles(files){
  return [...(files||[])].map(file=>{
    const parts=relativePath(file).split('/').filter(Boolean);
    if(!parts.length)return file;
    const folderIndex=parts.length>2?1:0,next=truncateUploadName(parts[folderIndex]);
    if(next===parts[folderIndex])return file;
    parts[folderIndex]=next;
    const clone=new File([file],file.name,{type:file.type,lastModified:file.lastModified});
    try{Object.defineProperty(clone,'webkitRelativePath',{value:parts.join('/'),configurable:true})}catch{}
    return clone;
  });
}

function enqueueOfficialFiles(files){
  const normalized=normalizeUploadFiles(files),names=folderNames(normalized);
  if(!names.length){toast('未找到可上传的图片文件',true);return}
  uploadQueue.push({files:normalized,names});
  renderUploadQueue();
}

function renderUploadQueue(){
  const add=$('#uploadFolder'),start=$('#uploadQueueStart'),clear=$('#uploadQueueClear'),summary=$('#uploadQueueSummary');
  if(!add||!start||!clear||!summary)return;
  const names=[...new Set(uploadQueue.flatMap(item=>item.names))],category=activeUploadCategory(),hidden=materialTab!=='official';
  add.hidden=hidden;start.hidden=hidden||!names.length;clear.hidden=hidden||!names.length;summary.hidden=hidden||!names.length;
  add.textContent=names.length?'继续添加文件夹':'添加文件夹';
  start.textContent=`开始上传 ${names.length} 个文件夹${category.id?` → ${category.name}`:''}`;
  start.disabled=uploading;clear.disabled=uploading;
  summary.textContent=`待上传：${names.join('、')}`;
}

const readEntries=reader=>new Promise((resolve,reject)=>reader.readEntries(resolve,reject));
async function collectEntry(entry,prefix,files){
  if(!entry)return;
  if(entry.isFile){await new Promise((resolve,reject)=>entry.file(file=>{try{Object.defineProperty(file,'webkitRelativePath',{value:prefix+file.name,configurable:true})}catch{}files.push(file);resolve()},reject));return}
  if(!entry.isDirectory)return;
  const nextPrefix=prefix+truncateUploadName(entry.name)+'/';
  const reader=entry.createReader();
  for(;;){const batch=await readEntries(reader);if(!batch.length)break;for(const child of batch)await collectEntry(child,nextPrefix,files)}
}

async function filesFromDrop(dataTransfer){
  const entries=[...(dataTransfer?.items||[])].map(item=>item.webkitGetAsEntry?.()).filter(Boolean);
  if(!entries.length)return [...(dataTransfer?.files||[])];
  const files=[];for(const entry of entries)await collectEntry(entry,'',files);return files;
}

async function flushOfficialUploadQueue(){
  if(uploading||!uploadQueue.length)return;
  uploading=true;renderUploadQueue();
  const category=activeUploadCategory(),files=uploadQueue.flatMap(item=>item.files);
  try{await uploadOfficialFolders(files,category);uploadQueue.length=0}
  finally{uploading=false;renderUploadQueue()}
}

async function uploadOfficialFolders(fileList,category=activeUploadCategory()){
  const groups=new Map();
  for(const file of[...fileList]){
    if(!/^image\/(png|jpeg|webp|gif)$/i.test(file.type||''))continue;
    const parts=relativePath(file).split('/').filter(Boolean),name=truncateUploadName(parts.length>2?parts[1]:(parts[0]||'未命名'));
    if(!groups.has(name))groups.set(name,[]);
    groups.get(name).push(file);
  }
  for(const[name,files]of groups){
    files.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN',{numeric:true}));
    if(files.reduce((total,file)=>total+file.size,0)>10*1024*1024){toast(`${name} 超过 10MB`,true);continue}
    try{
      $('#materialStatus').textContent=`上传 ${name}…`;
      const preview=await makePreview(files),frames=[];
      for(const file of files){const size=await dimensions(file);frames.push({name:file.name,mimeType:file.type,width:size.width,height:size.height,dataUrl:await toDataUrl(file)})}
      await request('admin-sequence-upsert',{sequence:{name,categoryId:category.id||null,enabled:true,locked:false,frames,previews:[{mimeType:'image/webp',dataUrl:await toDataUrl(preview)}]}});
      toast(`已上传 ${name}`);
    }catch(err){toast(`${name}: ${err.message}`,true)}
    await yieldToMain();
  }
  await loadOfficialMaterials();
}
async function backfillOfficial(){if(backfillBusy)return;const missing=(official?.sequences||[]).filter(s=>!(s.previewAnimated&&s.previewFrames?.[0]));if(!missing.length){toast('官方素材预览已经完整');return}backfillBusy=true;const b=$('#backfillPreviews');if(b){b.disabled=true;b.textContent='补齐中…'}try{for(let i=0;i<missing.length;i++){const s=missing[i];try{$('#materialStatus').textContent=`补齐预览 ${i+1}/${missing.length}：${s.name}`;const files=[];for(const f of s.frames||[]){await yieldToMain();const r=await fetch(f.url);if(!r.ok)throw Error('源帧下载失败');files.push(new File([await r.blob()],f.name||'frame.png',{type:f.mimeType||'image/png'}))}if(files.length>1){const p=await makePreview(files);await request('admin-sequence-preview-backfill',{id:s.id,preview:{mimeType:'image/webp',dataUrl:await toDataUrl(p)}})}}catch(err){console.warn('preview backfill failed',s.name,err)}await yieldToMain()}await loadOfficialMaterials()}finally{backfillBusy=false;if(b){b.disabled=false;b.textContent='补齐缺失预览'}}}
async function backfillPersonal(){if(backfillBusy)return;const missing=[];for(const u of personal?.users||[])for(const s of u.sequences||[])if(!(s.previewAnimated&&s.previewFrames?.[0]))missing.push(s);if(!missing.length){toast('用户素材预览已经完整');return}backfillBusy=true;const b=$('#backfillPreviews');if(b){b.disabled=true;b.textContent='补齐中…'}try{for(let i=0;i<missing.length;i++){const s=missing[i];try{$('#materialStatus').textContent=`补齐用户预览 ${i+1}/${missing.length}：${s.name}`;const d=await request('admin-personal-sequence-frames',{id:s.id}),files=[];for(const f of d.frames||[]){await yieldToMain();const r=await fetch(f.url);if(!r.ok)throw Error('源帧下载失败');files.push(new File([await r.blob()],f.name||'frame.png',{type:f.mimeType||'image/png'}))}if(files.length>1){const p=await makePreview(files);await request('admin-personal-sequence-preview-backfill',{id:s.id,preview:{mimeType:'image/webp',dataUrl:await toDataUrl(p)}})}}catch(err){console.warn('personal preview backfill failed',s.name,err)}await yieldToMain()}await loadPersonal('')}finally{backfillBusy=false;if(b){b.disabled=false;b.textContent='补齐缺失预览'}}}
async function feedbackPage(){const p=$('#page');p.innerHTML=`<div class="head"><div><h1>用户反馈</h1><div class="muted">评分、反馈与回复</div></div></div><form class="search" id="feedbackSearch"><input name="q" placeholder="用户 / Figma ID / 内容"><button class="btn">搜索</button></form><div class="spacer"></div><div class="list" id="feedbackList">加载中…</div><div id="feedbackDetail"></div>`;$('#feedbackSearch').onsubmit=e=>{e.preventDefault();loadFeedback(e.currentTarget.q.value.trim())};$('#feedbackList').addEventListener('click',e=>{const b=e.target.closest('.threadButton');if(b)openThread(b.dataset.id)});await loadFeedback('')}
async function loadFeedback(q){try{const d=await request('admin-feedback-list',{query:q});if(route!=='feedback')return;$('#feedbackList').innerHTML=(d.threads||[]).map(t=>`<button class="feedback threadButton" data-id="${t.id}"><div class="row"><strong>${esc(t.displayName)}</strong><span class="stars">${'★'.repeat(num(t.rating))}</span></div><div class="muted">${esc(t.figmaUserId)} · ${bj(t.updatedAt)}</div><div>${esc(t.latestMessage||'暂无文字')}</div></button>`).join('')||'<div class="status">暂无反馈</div>'}catch(err){if($('#feedbackList'))$('#feedbackList').textContent=err.message}}
async function openThread(id){try{const d=await request('admin-feedback-thread',{id});if(route!=='feedback')return;$('#feedbackDetail').innerHTML=`<div class="spacer"></div><div class="card body"><h3>${esc(d.thread?.displayName||'反馈会话')}</h3><div class="thread">${(d.messages||[]).map(m=>`<div class="msg ${m.sender==='admin'?'admin':''}"><div class="muted">${m.sender==='admin'?'管理员':'用户'} · ${bj(m.createdAt)}</div>${esc(m.body)}</div>`).join('')}</div><textarea id="reply" placeholder="输入回复内容"></textarea><button class="btn" id="sendReply">发送回复</button></div>`;$('#sendReply').onclick=async()=>{const body=$('#reply').value.trim();if(!body)return;try{await request('admin-feedback-reply',{id,body});toast('已回复');await openThread(id)}catch(err){toast(err.message,true)}}}catch(err){toast(err.message,true)}}
(async()=>{if(restoreSession()&&await verify())shell();else loginView()})();
