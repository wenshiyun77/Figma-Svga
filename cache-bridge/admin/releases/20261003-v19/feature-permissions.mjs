import { FEATURE_CATALOG, normalizeFeaturePolicy, DEFAULT_FEATURE_POLICY } from './feature-permissions.catalog.mjs';

const GROUPS=['基础动效','图层动效','其他动效','导出格式'];
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lockIcon=locked=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${locked?'M7 10V7a5 5 0 0 1 10 0v3':'M7 10V7a5 5 0 0 1 9-3'}"/><rect x="4" y="10" width="16" height="12" rx="3"/><path d="M12 14v4"/></svg>`;

export async function renderFeaturePermissions({root,request,toast,isCurrent}) {
  let baseline={...DEFAULT_FEATURE_POLICY},draft={...baseline},revision=0,loaded=false,busy=false,stale=false,message='',error=false,updatedAt=null;
  root.innerHTML=`<section class="feature-permissions"><div class="head"><div><h1>权限管理</h1><p class="muted">锁定：仅 PRO 用户可用；解锁：所有用户可用。</p></div><button type="button" class="btn secondary" id="permissionsReload">重新加载</button></div><div id="permissionsStatus" class="permissions-status" role="status" aria-live="polite"></div><div id="permissionsGroups"></div><div class="permissions-footer"><span id="permissionsDirty" class="muted"></span><button type="button" class="btn" id="permissionsSave" disabled>保存修改</button></div></section>`;
  const el=id=>root.querySelector('#'+id);
  const changes=()=>Object.fromEntries(FEATURE_CATALOG.filter(({key})=>draft[key]!==baseline[key]).map(({key})=>[key,draft[key]]));
  function paint(){
    if(!isCurrent())return;
    const count=Object.keys(changes()).length;
    root.querySelector('.feature-permissions').setAttribute('aria-busy',String(busy));
    el('permissionsStatus').textContent=message;
    el('permissionsStatus').classList.toggle('is-error',error);
    el('permissionsDirty').textContent=loaded?(count?`${count} 项待保存`:`全部 ${FEATURE_CATALOG.length} 项已同步${updatedAt?' · 更新于 '+new Date(updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}):''}`):'尚未加载权限配置';
    el('permissionsSave').disabled=!loaded||busy||!count||stale;
    el('permissionsSave').textContent=busy&&loaded?'处理中…':'保存修改';
    el('permissionsReload').disabled=busy;
    el('permissionsReload').textContent=count?'重新加载（保留修改）':'重新加载';
    el('permissionsGroups').innerHTML=loaded?GROUPS.map(group=>`<section class="permissions-group"><h2>${group}</h2>${FEATURE_CATALOG.filter(item=>item.group===group).map(({key,label})=>{const locked=draft[key]==='pro';return `<div class="permissions-row${draft[key]!==baseline[key]?' is-dirty':''}"><span>${escape(label)}</span><button type="button" class="permissions-toggle${locked?' is-locked':''}" data-permission-key="${escape(key)}" aria-pressed="${locked}" aria-label="${escape(label)}：${locked?'已锁定，仅 PRO 用户可用；点击解锁':'已解锁，所有用户可用；点击锁定'}"${busy?' disabled':''}>${lockIcon(locked)}<span>${locked?'锁定 · 仅 PRO':'解锁 · 所有用户'}</span></button></div>`}).join('')}</section>`).join(''):'';
  }
  async function load(){
    if(busy||!isCurrent())return;
    const pending=changes();busy=true;message='正在加载权限配置…';error=false;paint();
    try{
      const data=await request('admin-feature-permissions');if(!isCurrent())return;
      baseline=normalizeFeaturePolicy(data.policy);draft={...baseline,...pending};revision=data.revision;updatedAt=data.updatedAt;loaded=true;stale=false;
      message=Object.keys(changes()).length?'已加载最新配置，未保存的修改已保留，请核对后保存。':'权限配置已加载';
    }catch(err){if(!isCurrent())return;message=`加载失败：${err.message}。请检查登录状态后重新加载。`;error=true;}
    finally{if(isCurrent()){busy=false;paint();}}
  }
  async function save(){
    if(!loaded||busy||stale||!isCurrent())return;
    const changed=changes();if(!Object.keys(changed).length)return;
    busy=true;message='正在保存权限配置…';error=false;paint();
    try{
      const data=await request('admin-feature-permissions-save',{changes:changed,revision});if(!isCurrent())return;
      baseline=normalizeFeaturePolicy(data.policy);draft={...baseline};revision=data.revision;updatedAt=data.updatedAt;message='权限配置已保存';toast(message);
    }catch(err){
      if(!isCurrent())return;
      stale=err.status===409;error=true;
      message=stale?'配置已被其他管理员更新。你的修改已保留，请点击“重新加载（保留修改）”，核对最新配置后再保存。':`保存失败：${err.message}。你的修改已保留，可检查登录状态后重试。`;
    }finally{if(isCurrent()){busy=false;paint();}}
  }
  el('permissionsReload').onclick=load;
  el('permissionsSave').onclick=save;
  el('permissionsGroups').onclick=event=>{
    const button=event.target.closest('[data-permission-key]');
    if(!button||busy||!loaded||!isCurrent())return;
    const key=button.dataset.permissionKey;if(!Object.hasOwn(DEFAULT_FEATURE_POLICY,key))return;
    draft[key]=draft[key]==='pro'?'free':'pro';message=stale?message:'修改尚未保存';if(!stale)error=false;
    paint();root.querySelector(`[data-permission-key="${key}"]`)?.focus();
  };
  await load();
}
