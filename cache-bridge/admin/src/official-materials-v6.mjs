const BASE='https://nepilrihisogontdkcqi.supabase.co';
const KEY='sb_publishable_SnT1-Gwl82d_P0HCIfS6Tw_2m8Azxd6';
const FN=BASE+'/functions/v1/plugin-control';
const STORE='svga-admin-auth-v1';

let selectedCategory='all';
let editMode=false;
let snapshot=null;
let loading=false;
let refreshTimer=0;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const num=value=>Math.max(0,Number(value||0));
const charCount=value=>Array.from(String(value||'').trim()).length;
const lockSvg='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.4a3.5 3.5 0 0 1 7 0V7"/><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M8 10v1.5"/></svg>';
const editSvg='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 11.8.4-2.5 6.9-6.9a1.4 1.4 0 0 1 2 0l1.3 1.3a1.4 1.4 0 0 1 0 2l-6.9 6.9-2.5.4Z"/><path d="m9.4 3.3 3.3 3.3"/></svg>';

function readSession(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function saveSession(value){localStorage.setItem(STORE,JSON.stringify({access_token:value.access_token,refresh_token:value.refresh_token,expires_at:Number(value.expires_at||Math.floor(Date.now()/1000)+Number(value.expires_in||3600))}))}
async function token(force=false){let session=readSession();if(!session?.access_token)throw Error('请先登录管理员账号');if(force||Number(session.expires_at||0)<=Math.floor(Date.now()/1000)+60){const response=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'content-type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});const json=await response.json().catch(()=>({}));if(!response.ok)throw Error('登录状态已失效');saveSession(json);session=json}return session.access_token}
async function request(action,body={}){let access=await token();const send=()=>fetch(FN,{method:'POST',headers:{Authorization:'Bearer '+access,apikey:KEY,'content-type':'application/json'},body:JSON.stringify({action,...body})});let response=await send();if(response.status===401){access=await token(true);response=await send()}const json=await response.json().catch(()=>({}));if(!response.ok)throw Error(json.error||json.message||`请求失败（${response.status}）`);return json}
async function adminRpc(name,body={}){let access=await token();const send=()=>fetch(BASE+'/rest/v1/rpc/'+name,{method:'POST',headers:{Authorization:'Bearer '+access,apikey:KEY,'content-type':'application/json'},body:JSON.stringify(body)});let response=await send();if(response.status===401){access=await token(true);response=await send()}const json=await response.json().catch(()=>({}));if(!response.ok)throw Error(json.message||json.error_description||json.error||`请求失败（${response.status}）`);return json}
function toast(message,error=false){const node=document.createElement('div');node.className='toast'+(error?' err':'');node.textContent=message;document.body.append(node);setTimeout(()=>node.remove(),2600)}
function officialActive(){return Boolean(document.querySelector('#officialTab.active')&&document.querySelector('#materialBody'))}
function validName(raw){const name=String(raw||'').trim();if(!name)throw Error('标签名称不能为空');if(charCount(name)>8)throw Error('标签名称最多 8 个字符');return name}

function categoryBar(categories){
  const categoryItems=categories.map(category=>editMode
    ? `<div class="official-category-editor" draggable="true" data-id="${esc(category.id)}"><span class="official-category-drag" title="拖拽调整顺序">⋮⋮</span><input class="official-category-name" maxlength="8" value="${esc(category.name)}" data-original="${esc(category.name)}" aria-label="编辑标签 ${esc(category.name)}"></div>`
    : `<button class="official-category-chip${selectedCategory===String(category.id)?' active':''}" type="button" data-filter-category="${esc(category.id)}">${esc(category.name)}</button>`).join('');
  return `<div class="official-v6-category-row"><button class="official-category-chip fixed${selectedCategory==='all'?' active':''}" type="button" data-filter-category="all">全部</button><div class="official-v6-category-list" id="officialV6CategoryList">${categoryItems}</div><button class="official-category-tool" type="button" id="officialV6Add" title="添加标签" aria-label="添加标签">+</button><button class="official-category-tool${editMode?' active':''}" type="button" id="officialV6Edit" title="编辑标签" aria-label="编辑标签">${editSvg}</button></div>`;
}
function previewMarkup(set){const url=set.previewFrames?.[0];return url?`<img src="${esc(url)}" alt="${esc(set.name)}" loading="lazy" decoding="async">`:'<span class="official-preview-empty">无动态预览</span>'}
function card(set,categories){return `<article class="card official-v6-card" data-sequence-id="${esc(set.id)}"><div class="preview official-v6-preview">${previewMarkup(set)}<button class="official-lock-button${set.locked?' is-locked':''}" type="button" data-lock-id="${esc(set.id)}" data-lock-on="${set.locked?'1':'0'}" title="${set.locked?'解除锁定':'锁定素材'}" aria-label="${set.locked?'解除锁定':'锁定素材'}">${lockSvg}</button></div><div class="body"><div class="official-card-title-row"><strong title="${esc(set.name)}">${esc(set.name)}</strong><span>使用 ${num(set.usageCount)}</span></div><div class="muted">${set.frames?.length||0} 帧 · 排序 ${num(set.sortOrder)}</div><select class="official-category-select" data-category-id="${esc(set.id)}"><option value="">未分类</option>${categories.map(category=>`<option value="${esc(category.id)}" ${String(set.categoryId||'')===String(category.id)?'selected':''}>${esc(category.name)}</option>`).join('')}</select><div class="actions official-card-actions"><button class="btn secondary" type="button" data-rename-id="${esc(set.id)}" data-name="${esc(set.name)}">重命名</button><button class="btn secondary" type="button" data-enable-id="${esc(set.id)}" data-enable-on="${set.enabled?'1':'0'}">${set.enabled?'隐藏':'显示'}</button><button class="btn danger" type="button" data-delete-id="${esc(set.id)}" data-name="${esc(set.name)}">删除</button></div></div></article>`}
function render(){
  if(!officialActive()||!snapshot)return;
  const body=document.querySelector('#materialBody');
  const categories=snapshot.categories||[];
  if(selectedCategory!=='all'&&!categories.some(c=>String(c.id)===selectedCategory))selectedCategory='all';
  const all=snapshot.sequences||[];
  const shown=selectedCategory==='all'?all:all.filter(set=>String(set.categoryId||'')===selectedCategory);
  body.innerHTML=`<section class="official-v6-root" data-official-v6="1">${categoryBar(categories)}<div class="materials official-v6-materials">${shown.map(set=>card(set,categories)).join('')||'<div class="status">当前标签暂无素材</div>'}</div></section>`;
  const status=document.querySelector('#materialStatus');if(status)status.textContent=`全部 ${all.length} 套 · 当前 ${shown.length} 套`;
  wire();
}
async function load(){if(loading||!officialActive())return;loading=true;try{const [base,counts]=await Promise.all([request('admin-sequences'),adminRpc('svga_admin_official_sequence_usage_counts')]);const usage=new Map((counts||[]).map(row=>[String(row.sequence_set_id||''),num(row.usage_count)]));snapshot={...base,sequences:(base.sequences||[]).map(set=>({...set,usageCount:usage.get(String(set.id||''))||0}))};render()}catch(error){toast(error.message,true)}finally{loading=false}}
function scheduleLoad(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(officialActive()&&!document.querySelector('.official-v6-root'))load()},60)}
async function saveOrder(){const ids=[...document.querySelectorAll('#officialV6CategoryList .official-category-editor')].map(node=>node.dataset.id).filter(Boolean);if(!snapshot||ids.join('|')===(snapshot.categories||[]).map(c=>String(c.id)).join('|'))return;try{await adminRpc('reorder_svga_official_sequence_categories',{p_ids:ids});snapshot.categories=[...document.querySelectorAll('#officialV6CategoryList .official-category-editor')].map(node=>{const current=(snapshot.categories||[]).find(category=>String(category.id)===String(node.dataset.id));return current}).filter(Boolean);toast('标签顺序已同步到插件');render()}catch(error){toast(error.message,true);await load()}}
function wire(){
  document.querySelectorAll('[data-filter-category]').forEach(button=>button.onclick=()=>{if(editMode&&button.dataset.filterCategory!=='all')return;selectedCategory=button.dataset.filterCategory||'all';render()});
  document.querySelector('#officialV6Edit')?.addEventListener('click',()=>{editMode=!editMode;render()});
  document.querySelector('#officialV6Add')?.addEventListener('click',async()=>{const raw=prompt('标签名称（最多 8 个字符）');if(raw===null)return;try{const name=validName(raw);await request('admin-sequence-category-create',{name});selectedCategory='all';await load()}catch(error){toast(error.message,true)}});
  document.querySelectorAll('.official-category-name').forEach(input=>{
    let cancelled=false;
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();input.blur()}if(event.key==='Escape'){cancelled=true;input.value=input.dataset.original||'';input.blur()}});
    input.addEventListener('blur',async()=>{if(cancelled)return;const original=input.dataset.original||'';let name;try{name=validName(input.value)}catch(error){toast(error.message,true);input.value=original;return}if(name===original)return;try{await request('admin-sequence-category-update',{id:input.closest('[data-id]').dataset.id,name});toast('标签名称已更新');await load()}catch(error){toast(error.message,true);input.value=original}});
  });
  document.querySelectorAll('.official-category-editor').forEach(node=>{
    node.addEventListener('dragstart',event=>{node.classList.add('dragging');event.dataTransfer.effectAllowed='move'});
    node.addEventListener('dragover',event=>{event.preventDefault();const dragging=document.querySelector('.official-category-editor.dragging');if(!dragging||dragging===node)return;const rect=node.getBoundingClientRect();node.parentElement.insertBefore(dragging,event.clientX<rect.left+rect.width/2?node:node.nextSibling)});
    node.addEventListener('dragend',async()=>{node.classList.remove('dragging');await saveOrder()});
  });
  document.querySelectorAll('[data-lock-id]').forEach(button=>button.onclick=async()=>{try{button.disabled=true;await request('admin-sequence-update',{id:button.dataset.lockId,locked:button.dataset.lockOn!=='1'});await load()}catch(error){toast(error.message,true);button.disabled=false}});
  document.querySelectorAll('[data-category-id]').forEach(select=>select.onchange=async()=>{try{await request('admin-sequence-update',{id:select.dataset.categoryId,categoryId:select.value||null});await load()}catch(error){toast(error.message,true)}});
  document.querySelectorAll('[data-rename-id]').forEach(button=>button.onclick=async()=>{const raw=prompt('素材名称',button.dataset.name||'');if(!raw?.trim())return;try{await request('admin-sequence-update',{id:button.dataset.renameId,name:raw.trim()});await load()}catch(error){toast(error.message,true)}});
  document.querySelectorAll('[data-enable-id]').forEach(button=>button.onclick=async()=>{try{await request('admin-sequence-update',{id:button.dataset.enableId,enabled:button.dataset.enableOn!=='1'});await load()}catch(error){toast(error.message,true)}});
  document.querySelectorAll('[data-delete-id]').forEach(button=>button.onclick=async()=>{if(!confirm(`删除“${button.dataset.name||''}”及全部帧？`))return;try{await request('admin-sequence-delete',{id:button.dataset.deleteId});await load()}catch(error){toast(error.message,true)}});
}

const observer=new MutationObserver(scheduleLoad);
observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleLoad,{once:true});else scheduleLoad();
