const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>{const d=new Date(v);return v&&Number.isFinite(d.valueOf())?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d):'';};
const ordered=messages=>[...messages].sort((a,b)=>(Date.parse(a.createdAt)||0)-(Date.parse(b.createdAt)||0));
export function feedbackSummary(thread,messages){
 const value={...thread};if(messages){for(const message of ordered(messages)){if(message.sender==='admin'&&(!value.latestAdminReplyAt||(Date.parse(message.createdAt)||0)>=(Date.parse(value.latestAdminReplyAt)||0))){value.latestAdminReply=String(message.body||'');value.latestAdminReplyAt=message.createdAt;}else if(message.sender==='user'&&(!value.latestUserMessageAt||(Date.parse(message.createdAt)||0)>=(Date.parse(value.latestUserMessageAt)||0))){value.latestUserMessage=String(message.body||'');value.latestUserMessageAt=message.createdAt;}}}
 return value;
}
function summaryMarkup(thread){
 const user=thread.latestUserMessage??(thread.latestSender==='user'?thread.latestMessage:null),reply=thread.latestAdminReply??(thread.latestSender==='admin'?thread.latestMessage:'');
 return `<div class="feedback-user-row"><span class="feedback-message-label">用户反馈${thread.latestUserMessageAt?` · ${escape(date(thread.latestUserMessageAt))}`:''}</span><div class="feedback-user-text">${escape(user??'展开查看反馈原文')||'暂无文字反馈'}</div></div>${reply?`<div class="feedback-reply-row"><span class="feedback-message-label">管理员回复${thread.latestAdminReplyAt?` · ${escape(date(thread.latestAdminReplyAt))}`:''}</span><div class="feedback-reply-text">${escape(reply)}</div></div>`:''}`;
}
export async function renderFeedbackInbox({root,request,toast=()=>{},isCurrent=()=>true}){
 let selected=null,loadTicket=0,detailTicket=0;const threads=new Map(),cards=new Map(),cache=new Map(),drafts=new Map(),sending=new Set();
 const alive=()=>isCurrent()&&root.isConnected;
 root.innerHTML=`<div class="head"><div><h1>用户反馈</h1><div class="muted">查看反馈，在当前卡片内回复</div></div></div><form class="search" id="feedbackSearch"><input name="q" placeholder="用户 / Figma ID / 内容"><button class="btn" type="submit">搜索</button></form><div class="spacer"></div><div class="list feedback-list" id="feedbackList" aria-live="polite">加载中…</div>`;
 const list=root.querySelector('#feedbackList'),search=root.querySelector('#feedbackSearch');
 const updateSummary=(id,data)=>{if(!cards.get(id)?.isConnected)return;const current=feedbackSummary({...threads.get(id),...data.thread},data.messages);threads.set(id,current);cards.get(id).querySelector('.feedback-summary').innerHTML=summaryMarkup(current);};
 function renderDetail(id,data){
  const card=cards.get(id);if(!alive()||selected!==id||!card?.isConnected)return;
  const detail=card.querySelector('.feedback-detail'),previous=detail.querySelector('textarea'),focused=previous&&document.activeElement===previous,selection=focused?[previous.selectionStart,previous.selectionEnd]:null,messages=ordered(data.messages||[]),busy=sending.has(id),inputId='feedback-reply-'+id;
  detail.innerHTML=`<div class="feedback-conversation" aria-label="反馈会话">${messages.map(message=>`<div class="feedback-message ${message.sender==='admin'?'is-admin':''}"><div class="feedback-message-label">${message.sender==='admin'?'管理员':'用户'} · ${escape(date(message.createdAt))}</div><div>${escape(message.body)}</div></div>`).join('')||'<div class="muted">暂无文字消息</div>'}</div><form class="feedback-reply-form"><label for="${escape(inputId)}">回复用户</label><textarea id="${escape(inputId)}" maxlength="2000" placeholder="输入回复内容" ${busy?'disabled':''}>${escape(drafts.get(id)||'')}</textarea><div class="feedback-reply-actions"><span class="feedback-reply-status" role="status"></span><button class="btn" type="submit" ${busy?'disabled':''}>${busy?'发送中…':'发送回复'}</button></div></form>`;
  const form=detail.querySelector('form'),input=form.querySelector('textarea');input.addEventListener('input',()=>drafts.set(id,input.value));form.onsubmit=event=>{event.preventDefault();void sendReply(id,form);};
  const history=detail.querySelector('.feedback-conversation');history.scrollTop=history.scrollHeight;if(focused){input.focus({preventScroll:true});input.setSelectionRange(Math.min(selection[0],input.value.length),Math.min(selection[1],input.value.length));}
 }
 async function open(id,force=false){
  if(!alive()||!cards.has(id))return;
  if(selected===id&&!force){selected=null;detailTicket++;cards.get(id).querySelector('.feedback-detail').hidden=true;cards.get(id).querySelector('.threadButton').setAttribute('aria-expanded','false');return;}
  selected=id;const ticket=++detailTicket;
  for(const [key,card] of cards){card.querySelector('.feedback-detail').hidden=key!==id;card.querySelector('.threadButton').setAttribute('aria-expanded',String(key===id));}
  const detail=cards.get(id).querySelector('.feedback-detail');if(cache.has(id))renderDetail(id,cache.get(id));else detail.innerHTML='<div class="feedback-loading" role="status">正在读取会话…</div>';
  try{const data=await request('admin-feedback-thread',{id});if(!alive()||selected!==id||ticket!==detailTicket)return;cache.set(id,data);updateSummary(id,data);renderDetail(id,data);}
  catch(error){if(!alive()||selected!==id||ticket!==detailTicket)return;detail.innerHTML='<div class="feedback-load-error" role="status"></div><button class="btn secondary feedback-retry" type="button">重试</button>';detail.querySelector('[role="status"]').textContent=error.message||'会话读取失败';detail.querySelector('button').onclick=()=>void open(id,true);}
 }
 async function sendReply(id,form){
  const input=form.querySelector('textarea'),body=input.value.trim();if(!body||sending.has(id)||!alive())return;
  sending.add(id);drafts.set(id,input.value);for(const control of form.querySelectorAll('textarea,button'))control.disabled=true;form.querySelector('[role="status"]').textContent='发送中…';
  const card=cards.get(id),ticket=loadTicket;
  try{
   let data=await request('admin-feedback-reply',{id,body});
   if(!Array.isArray(data.messages))data={thread:threads.get(id),messages:[...(cache.get(id)?.messages||[]),{sender:'admin',body,createdAt:new Date().toISOString()}]};
   cache.set(id,data);drafts.delete(id);
   if(!alive()||ticket!==loadTicket||cards.get(id)!==card)return;updateSummary(id,data);if(selected===id)renderDetail(id,data);toast('已回复');
  }catch(error){if(alive()&&ticket===loadTicket&&cards.get(id)===card){const status=card.querySelector('[role="status"]');if(status)status.textContent=error.message||'回复发送失败，请重试';}}
  finally{sending.delete(id);if(alive()&&cards.get(id)===card){for(const control of card.querySelectorAll('.feedback-reply-form textarea,.feedback-reply-form button'))control.disabled=false;const button=card.querySelector('.feedback-reply-form button');if(button)button.textContent='发送回复';}}
 }
 async function load(query){
  const ticket=++loadTicket;detailTicket++;selected=null;list.textContent='加载中…';cards.clear();
  try{const data=await request('admin-feedback-list',{query});if(!alive()||ticket!==loadTicket)return;threads.clear();
   list.innerHTML=(data.threads||[]).map((thread,index)=>{const id=String(thread.id),value=feedbackSummary(thread,cache.get(id)?.messages);threads.set(id,value);return `<article class="feedback-card" data-thread-id="${escape(id)}"><button class="threadButton feedback-card-toggle" type="button" data-feedback-toggle="${escape(id)}" aria-expanded="false" aria-controls="feedback-detail-${index}"><div class="row"><strong>${escape(thread.displayName||'未命名用户')}</strong><span class="stars" aria-label="${Math.max(0,Math.min(5,Number(thread.rating)||0))}分">${'★'.repeat(Math.max(0,Math.min(5,Number(thread.rating)||0)))}</span></div><div class="muted">${escape(thread.figmaUserId)} · ${escape(date(thread.updatedAt))}</div><div class="feedback-summary">${summaryMarkup(value)}</div></button><div class="feedback-detail" id="feedback-detail-${index}" hidden></div></article>`;}).join('')||'<div class="status">暂无反馈</div>';
   for(const card of list.querySelectorAll('[data-thread-id]'))cards.set(card.dataset.threadId,card);
  }catch(error){if(alive()&&ticket===loadTicket)list.textContent=error.message||'反馈读取失败';}
 }
 list.addEventListener('click',event=>{const button=event.target.closest('[data-feedback-toggle]');if(button&&list.contains(button))void open(button.dataset.feedbackToggle);});search.onsubmit=event=>{event.preventDefault();void load(new FormData(search).get('q')?.trim()||'');};await load('');
}
