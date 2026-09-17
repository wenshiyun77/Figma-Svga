const BASE='https://nepilrihisogontdkcqi.supabase.co';
const KEY='sb_publishable_SnT1-Gwl82d_P0HCIfS6Tw_2m8Azxd6';
const FN=BASE+'/functions/v1/plugin-control';
const STORE='svga-admin-auth-v1';
const PAGE_SIZE=50;

let pagingObserver=null;
let loading=false;
let setupTimer=0;
let committedQuery='';
const wiredForms=new WeakSet();

const num=v=>Number(v||0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bj=v=>v?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v)):'-';

export function getUserPageRequest(activeMode,query,loadedCount){
  return {
    mode:activeMode==='pro'?'history':(activeMode||'online'),
    query:query||'',
    proOnly:activeMode==='pro',
    offset:loadedCount,
    limit:PAGE_SIZE
  };
}

function avatarMarkup(u){
  if(u.photoUrl)return `<span class="avatar"><img src="${esc(u.photoUrl)}" alt="" loading="lazy" decoding="async"></span>`;
  return `<span class="avatar">${esc((u.displayName||'?').trim().slice(0,1).toUpperCase()||'?')}</span>`;
}

function userCard(u,index){
  const detailId=`other-export-more-${index}`;
  return `<article class="user">${avatarMarkup(u)}<div class="user-copy"><div class="row user-name-row"><strong><span class="number-badge">#${String(num(u.userNumber)).padStart(6,'0')}</span> ${esc(u.displayName||'未命名用户')}</strong>${u.isOnline?'<span class="badge ok">在线</span>':''}${u.isAdmin?'<span class="badge admin">管理员</span>':''}</div><div class="muted user-meta">${esc(u.figmaUserId)} · 最近打开 ${bj(u.lastOpenedAt)} · v${esc(u.pluginVersion||'-')}</div><div class="stats"><span><strong>${num(u.openCount)}</strong>打开</span><span><strong>${num(u.figmaImportCount)}</strong>Figma 导入</span><span><strong>${num(u.svgaExportCount)}</strong>SVGA 导出</span><button class="stat-button other-export-toggle" data-target="${detailId}" aria-expanded="false"><strong>${num(u.otherExportCount)}</strong>其他导出 · 查看</button><span><strong>${num(u.sequenceImportCount)}</strong>序列帧</span><div class="other-export-breakdown" id="${detailId}" hidden><span><strong>${num(u.webpExportCount)}</strong>WebP</span><span><strong>${num(u.gifExportCount)}</strong>GIF</span><span><strong>${num(u.lottieExportCount)}</strong>Lottie</span><span><strong>${num(u.webmExportCount)}</strong>WebM</span></div></div></div><button class="btn secondary proBtn" data-id="${esc(u.figmaUserId)}" data-on="${u.features?.lighting?'1':'0'}">${u.features?.lighting?'已开通PRO':'未开通PRO'}</button></article>`;
}

function readSession(){
  try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}
}

function saveSession(s){
  localStorage.setItem(STORE,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Number(s.expires_at||Math.floor(Date.now()/1000)+Number(s.expires_in||3600))}));
}

async function refreshSession(s){
  if(!s?.refresh_token)throw Error('登录状态已失效');
  const r=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'content-type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Error('登录状态已失效');
  saveSession(j);
  return j;
}

async function accessToken(forceRefresh=false){
  let s=readSession();
  if(!s?.access_token)throw Error('请先登录管理员账号');
  if(forceRefresh||Number(s.expires_at||0)<=Math.floor(Date.now()/1000)+60)s=await refreshSession(s);
  return s.access_token;
}

async function adminUsers(body){
  let token=await accessToken();
  const send=()=>fetch(FN,{method:'POST',headers:{Authorization:'Bearer '+token,apikey:KEY,'content-type':'application/json'},body:JSON.stringify({action:'admin-users',...body})});
  let r=await send();
  if(r.status===401){token=await accessToken(true);r=await send()}
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(j.error||j.message||`请求失败（${r.status}）`);
  return j;
}

function totalUsers(){
  const text=document.querySelector('#userStatus')?.textContent||'';
  const m=text.match(/共\s*(\d+)\s*人/);
  return m?Number(m[1]):0;
}

function activeMode(){
  return document.querySelector('.tabs button[data-mode].active')?.dataset.mode||'online';
}

function loadedCount(){return document.querySelectorAll('#userList .user').length}
function currentSignature(){return `${activeMode()}|${committedQuery}`}

function wireSearchForm(){
  const form=document.querySelector('#userSearch');
  if(!form||wiredForms.has(form))return;
  committedQuery=form.querySelector('input[name="q"]')?.value.trim()||'';
  form.addEventListener('submit',()=>{committedQuery=form.querySelector('input[name="q"]')?.value.trim()||''},{capture:true});
  wiredForms.add(form);
}

async function loadMore(){
  if(loading)return;
  const list=document.querySelector('#userList');
  const status=document.querySelector('#userStatus');
  if(!list||!status||status.textContent.includes('加载中'))return;
  const total=totalUsers(),loaded=loadedCount();
  if(!total||loaded>=total){document.querySelector('#userLoadMoreSentinel')?.remove();return}
  const signature=currentSignature();
  const sentinel=document.querySelector('#userLoadMoreSentinel');
  loading=true;
  if(sentinel)sentinel.textContent=`正在加载 ${loaded+1}–${Math.min(loaded+PAGE_SIZE,total)}…`;
  try{
    const state=getUserPageRequest(activeMode(),committedQuery,loaded);
    const d=await adminUsers(state);
    if(currentSignature()!==signature||!document.querySelector('#userList'))return;
    const users=d.users||[];
    document.querySelector('#userLoadMoreSentinel')?.remove();
    if(users.length)list.insertAdjacentHTML('beforeend',users.map((u,i)=>userCard(u,loaded+i)).join(''));
    const newTotal=num(d.pagination?.total)||total;
    status.textContent=`共 ${newTotal} 人 · 已加载 ${loaded+users.length}`;
  }catch(err){
    const s=document.querySelector('#userLoadMoreSentinel');
    if(s)s.innerHTML=`<button class="btn secondary" type="button">加载失败，点击重试</button>`;
  }finally{
    loading=false;
    scheduleSetup();
  }
}

function setupPagination(){
  pagingObserver?.disconnect();
  wireSearchForm();
  const list=document.querySelector('#userList'),status=document.querySelector('#userStatus');
  if(!list||!status||status.textContent.includes('加载中'))return;
  const total=totalUsers(),loaded=loadedCount();
  if(!total||loaded>=total){document.querySelector('#userLoadMoreSentinel')?.remove();return}
  let sentinel=document.querySelector('#userLoadMoreSentinel');
  if(!sentinel){
    sentinel=document.createElement('div');
    sentinel.id='userLoadMoreSentinel';
    sentinel.className='status';
    sentinel.style.cssText='display:grid;place-items:center;min-height:52px;';
    sentinel.innerHTML='<button class="btn secondary" type="button">继续加载更多用户</button>';
    list.append(sentinel);
  }
  sentinel.querySelector('button')?.addEventListener('click',loadMore,{once:true});
  if('IntersectionObserver'in window){
    pagingObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))loadMore()},{rootMargin:'700px 0px'});
    pagingObserver.observe(sentinel);
  }
}

function scheduleSetup(){
  clearTimeout(setupTimer);
  setupTimer=setTimeout(setupPagination,80);
}

if(typeof window!=='undefined'){
  new MutationObserver(scheduleSetup).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  window.addEventListener('pageshow',scheduleSetup);
  scheduleSetup();
}
