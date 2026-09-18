const BASE='https://nepilrihisogontdkcqi.supabase.co';
const KEY='sb_publishable_SnT1-Gwl82d_P0HCIfS6Tw_2m8Azxd6';
const FN=BASE+'/functions/v1/plugin-control';
const STORE='svga-admin-auth-v1';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function readSession(){
  try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}
}
function saveSession(value){
  localStorage.setItem(STORE,JSON.stringify({
    access_token:value.access_token,
    refresh_token:value.refresh_token,
    expires_at:Number(value.expires_at||Math.floor(Date.now()/1000)+Number(value.expires_in||3600)),
  }));
}
async function token(force=false){
  let session=readSession();
  if(!session?.access_token)throw Error('请先登录管理员账号');
  if(force||Number(session.expires_at||0)<=Math.floor(Date.now()/1000)+60){
    const response=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',
      headers:{apikey:KEY,'content-type':'application/json'},
      body:JSON.stringify({refresh_token:session.refresh_token}),
    });
    const json=await response.json().catch(()=>({}));
    if(!response.ok)throw Error('登录状态已失效');
    saveSession(json);
    session=json;
  }
  return session.access_token;
}
async function request(action,body={}){
  let access=await token();
  const send=()=>fetch(FN,{
    method:'POST',
    headers:{Authorization:'Bearer '+access,apikey:KEY,'content-type':'application/json'},
    body:JSON.stringify({action,...body}),
  });
  let response=await send();
  if(response.status===401){access=await token(true);response=await send()}
  const json=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(json.error||json.message||`请求失败（${response.status}）`);
  return json;
}
function toast(message,error=false){
  const node=document.createElement('div');
  node.className='toast'+(error?' err':'');
  node.textContent=message;
  document.body.append(node);
  setTimeout(()=>node.remove(),2600);
}
function currentFilter(){
  const chip=document.querySelector('.official-category-chip.active[data-filter-category]');
  const id=String(chip?.dataset?.filterCategory||'all');
  return id||'all';
}
function statusCounts(){
  const text=document.querySelector('#materialStatus')?.textContent||'';
  const match=text.match(/全部\s*(\d+)\s*套\s*·\s*当前\s*(\d+)\s*套/);
  if(match)return {total:Number(match[1]),current:Number(match[2])};
  const current=document.querySelectorAll('.official-v6-card').length;
  return {total:current,current};
}
function writeStatus(total,current){
  const status=document.querySelector('#materialStatus');
  if(status)status.textContent=`全部 ${Math.max(0,total)} 套 · 当前 ${Math.max(0,current)} 套`;
}
function ensureEmpty(){
  const list=document.querySelector('.official-v6-materials');
  if(list&&!list.querySelector('.official-v6-card')){
    list.innerHTML='<div class="status">当前标签暂无素材</div>';
  }
}
function lockButtonState(button,locked){
  button.dataset.lockOn=locked?'1':'0';
  button.classList.toggle('is-locked',locked);
  button.title=locked?'解除锁定':'锁定素材';
  button.setAttribute('aria-label',button.title);
}

async function handleLock(button,event){
  event.preventDefault();
  event.stopImmediatePropagation();
  const id=button.dataset.lockId;
  const next=button.dataset.lockOn!=='1';
  try{
    button.disabled=true;
    await request('admin-sequence-update',{id,locked:next});
    lockButtonState(button,next);
  }catch(error){toast(error.message,true)}finally{button.disabled=false}
}

async function handleCategory(select,event){
  event.preventDefault();
  event.stopImmediatePropagation();
  const id=select.dataset.categoryId;
  const previous=select.dataset.stablePreviousValue??select.defaultValue??'';
  const next=select.value||'';
  select.dataset.stablePreviousValue=next;
  try{
    select.disabled=true;
    await request('admin-sequence-update',{id,categoryId:next||null});
    const filter=currentFilter();
    if(filter!=='all'&&next!==filter){
      const counts=statusCounts();
      select.closest('.official-v6-card')?.remove();
      ensureEmpty();
      writeStatus(counts.total,counts.current-1);
    }
  }catch(error){
    toast(error.message,true);
    select.value=previous;
    select.dataset.stablePreviousValue=previous;
  }finally{select.disabled=false}
}

async function handleRename(button,event){
  event.preventDefault();
  event.stopImmediatePropagation();
  const id=button.dataset.renameId;
  const raw=prompt('素材名称',button.dataset.name||'');
  if(!raw?.trim())return;
  const name=raw.trim();
  try{
    button.disabled=true;
    await request('admin-sequence-update',{id,name});
    const card=button.closest('.official-v6-card');
    const title=card?.querySelector('.official-card-title-row strong');
    if(title){title.textContent=name;title.title=name}
    button.dataset.name=name;
    const del=card?.querySelector('[data-delete-id]');
    if(del)del.dataset.name=name;
  }catch(error){toast(error.message,true)}finally{button.disabled=false}
}

async function handleEnable(button,event){
  event.preventDefault();
  event.stopImmediatePropagation();
  const id=button.dataset.enableId;
  const next=button.dataset.enableOn!=='1';
  try{
    button.disabled=true;
    await request('admin-sequence-update',{id,enabled:next});
    button.dataset.enableOn=next?'1':'0';
    button.textContent=next?'隐藏':'显示';
  }catch(error){toast(error.message,true)}finally{button.disabled=false}
}

async function handleDelete(button,event){
  event.preventDefault();
  event.stopImmediatePropagation();
  const name=button.dataset.name||'';
  if(!confirm(`删除“${name}”及全部帧？`))return;
  const id=button.dataset.deleteId;
  const counts=statusCounts();
  try{
    button.disabled=true;
    await request('admin-sequence-delete',{id});
    button.closest('.official-v6-card')?.remove();
    ensureEmpty();
    writeStatus(counts.total-1,counts.current-1);
  }catch(error){toast(error.message,true);button.disabled=false}
}

async function handleCategoryRename(input,event){
  event.stopImmediatePropagation();
  const original=input.dataset.original||'';
  const name=String(input.value||'').trim();
  if(name===original)return;
  if(!name){input.value=original;return}
  if(Array.from(name).length>8){
    toast('标签名称最多 8 个字符',true);
    input.value=original;
    return;
  }
  const id=input.closest('[data-id]')?.dataset.id||'';
  if(!id)return;
  try{
    input.disabled=true;
    await request('admin-sequence-category-update',{id,name});
    input.dataset.original=name;
    toast('标签名称已更新');
  }catch(error){
    toast(error.message,true);
    input.value=original;
  }finally{input.disabled=false}
}

// Capture-phase handlers run before the v6 onclick/onchange handlers.
// This prevents the old handler from calling load() and rebuilding the entire list.
document.addEventListener('click',event=>{
  const lock=event.target.closest?.('[data-lock-id]');
  if(lock){void handleLock(lock,event);return}
  const rename=event.target.closest?.('[data-rename-id]');
  if(rename){void handleRename(rename,event);return}
  const enable=event.target.closest?.('[data-enable-id]');
  if(enable){void handleEnable(enable,event);return}
  const del=event.target.closest?.('[data-delete-id]');
  if(del){void handleDelete(del,event)}
},true);

document.addEventListener('change',event=>{
  const select=event.target.closest?.('[data-category-id]');
  if(select){void handleCategory(select,event)}
},true);

document.addEventListener('focusin',event=>{
  const select=event.target.closest?.('[data-category-id]');
  if(select)select.dataset.stablePreviousValue=select.value||'';
},true);

document.addEventListener('blur',event=>{
  const input=event.target.closest?.('.official-category-name');
  if(input){void handleCategoryRename(input,event)}
},true);

window.__svgaOfficialMaterialsStablePatch='7';
