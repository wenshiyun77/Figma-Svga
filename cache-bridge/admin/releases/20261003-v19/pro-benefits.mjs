export async function renderProBenefits({root,request,toast,isCurrent}) {
  root.innerHTML=`<header class="page-head"><div><h1>PRO 福利</h1><div class="muted">每次发放按配置天数重置，不累加；未上线用户只保留最新一轮。</div></div></header>
<section class="benefit-settings"><h2>新用户试用</h2><label><input id="newcomerEnabled" type="checkbox" disabled> 首次打开插件，赠送 3 天 PRO</label><p class="muted">每个 Figma ID 仅一次，上线自动开启。</p><label class="benefit-copy-field">插件提示文案<textarea id="newcomerMessage" maxlength="200" rows="3" disabled></textarea></label><p class="muted">用户只需点击“好的”关闭通知，权益已自动到账。</p><button class="btn secondary" id="saveNewcomerMessage" disabled>保存新用户文案</button><span id="newcomerStatus" role="status">加载中…</span></section>
<section class="benefit-settings"><h2>全平台福利</h2><label>福利标题<input id="benefitTitle" value="PRO 限时福利" maxlength="80"></label><label>有效天数<input id="benefitDays" type="number" min="1" max="30" step="1" value="3" aria-label="全平台福利有效天数，1至30天"></label><label class="benefit-copy-field">插件提示文案<textarea id="benefitMessage" maxlength="200" rows="3">3 天 PRO 福利已自动到账，尽情体验吧！</textarea></label><div class="benefit-copy-preview" id="benefitPreview"></div><p class="muted" id="benefitRules"></p><button class="btn" id="publishBenefit">一键发放 / 重置福利</button><span id="benefitPublishStatus" role="status"></span></section>
<section class="benefit-settings"><h2>发放记录</h2><div id="benefitCampaigns">加载中…</div></section>`;
  const el=id=>root.querySelector('#'+id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let pendingRequest=null,copyLoaded=false,campaignCopyLoaded=false,campaignDirty=false;
  const defaultMessage=days=>`${days} 天 PRO 福利已自动到账，尽情体验吧！`;
  let previousDays=3;
  const updateRules=()=>{const days=Number(el('benefitDays').value);el('benefitRules').textContent=Number.isInteger(days)&&days>=1&&days<=30?`符合条件的已生效 PRO 重置为本次发放起 ${days} 天；未上线用户只保留最新一轮，上线后开始计时。永久 PRO 与剩余时间不少于 ${days} 天的 PRO 不参与，不累加时长。`:'有效天数请输入 1–30 的整数。';};
  const updatePreview=()=>{el('benefitPreview').textContent=el('benefitMessage').value;};updatePreview();el('benefitMessage').oninput=()=>{campaignDirty=true;updatePreview();};el('benefitTitle').oninput=()=>{campaignDirty=true;};
  el('benefitDays').oninput=()=>{campaignDirty=true;const days=Number(el('benefitDays').value);if(Number.isInteger(days)&&days>=1&&days<=30){if(el('benefitMessage').value===defaultMessage(previousDays))el('benefitMessage').value=defaultMessage(days);previousDays=days;}updateRules();updatePreview();};updateRules();
  async function load(){
    const data=await request('admin-pro-benefits');if(!isCurrent())return;
    if(!campaignCopyLoaded){const latest=data.campaigns.find(c=>c.enabled!==false);if(latest&&!campaignDirty){el('benefitTitle').value=latest.title;el('benefitDays').value=String(latest.days||3);previousDays=Number(latest.days)||3;el('benefitMessage').value=latest.message||defaultMessage(previousDays);updateRules();updatePreview();}campaignCopyLoaded=true;}
    el('newcomerEnabled').checked=data.settings.newcomer_enabled;el('newcomerEnabled').disabled=false;
    if(!copyLoaded){el('newcomerMessage').value=data.settings.newcomer_message||'欢迎使用 SVGA Editor！已为你自动开启 3 天 PRO 试用。';copyLoaded=true;}
    el('newcomerMessage').disabled=false;el('saveNewcomerMessage').disabled=false;el('newcomerStatus').textContent='';
    el('benefitCampaigns').innerHTML=data.campaigns.length?data.campaigns.map(c=>`<article class="benefit-campaign"><strong>${escape(c.title)}${c.enabled===false?' · 已被新一轮替代':''}</strong><span>${escape(c.days)} 天 PRO · ${new Date(c.created_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</span><span>${escape(c.message||'')}</span><span>已到账 ${c.claimed} 人 · 待上线到账 ${c.pending} 人 · 不再符合条件 ${c.skipped} 人 · 被新一轮替代 ${c.superseded||0} 人</span></article>`).join(''):'暂无发放记录';
  }
  el('newcomerEnabled').onchange=async()=>{const enabled=el('newcomerEnabled').checked;el('newcomerEnabled').disabled=true;try{await request('admin-pro-benefits-configure',{newcomerEnabled:enabled});toast(enabled?'新用户试用已开启':'新用户试用已关闭');}catch(e){if(isCurrent())el('newcomerEnabled').checked=!enabled;toast(e.message,true);}finally{if(isCurrent())el('newcomerEnabled').disabled=false;}};
  el('saveNewcomerMessage').onclick=async()=>{
    const message=el('newcomerMessage').value.trim();if(!message||message.length>200){toast('请输入 1–200 字的新用户提示文案',true);return;}
    el('saveNewcomerMessage').disabled=true;
    try{await request('admin-pro-benefits-configure',{newcomerMessage:message});if(isCurrent())el('newcomerStatus').textContent='新用户提示文案已保存';toast('新用户提示文案已保存');}
    catch(e){toast(e.message,true);}finally{if(isCurrent())el('saveNewcomerMessage').disabled=false;}
  };
  el('publishBenefit').onclick=async()=>{
    if(!pendingRequest){const title=el('benefitTitle').value.trim(),message=el('benefitMessage').value.trim(),days=Number(el('benefitDays').value);if(!Number.isInteger(days)||days<1||days>30||!title||title.length>80||!message||message.length>200){toast('请输入 1–30 的整数天数、福利标题和 1–200 字的插件提示文案',true);return;}pendingRequest={title,message,days,requestId:crypto.randomUUID()};}
    el('publishBenefit').disabled=true;el('benefitTitle').disabled=true;el('benefitMessage').disabled=true;el('benefitDays').disabled=true;el('benefitPublishStatus').textContent='正在发放 / 重置…';
    try{const days=pendingRequest.days;const result=await request('admin-pro-benefits-publish',pendingRequest);pendingRequest=null;if(!isCurrent())return;
      el('benefitPublishStatus').textContent=result.created===false?'本轮已处理，无需重复重置':`已处理 ${result.recipients} 人：${result.reset||0} 人重置为 ${days} 天，${result.pending??result.recipients} 人待上线自动到账`;
      toast(`福利已发放，已按 ${days} 天重置，不累加`);await load();
    }catch(e){if(isCurrent())el('benefitPublishStatus').textContent=e.message+'；重试会沿用本次文案，不会重复重置。';toast(e.message,true);}
    finally{if(isCurrent()){el('publishBenefit').disabled=false;el('benefitTitle').disabled=!!pendingRequest;el('benefitMessage').disabled=!!pendingRequest;el('benefitDays').disabled=!!pendingRequest;}}
  };
  try{await load();}catch(e){if(isCurrent())el('newcomerStatus').textContent=e.message;toast(e.message,true);}
}
