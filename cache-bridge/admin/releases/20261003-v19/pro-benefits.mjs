export async function renderProBenefits({root,request,toast,isCurrent}) {
  root.innerHTML=`<header class="page-head"><div><h1>PRO 福利</h1><div class="muted">试用与福利从用户上线领取时开始计时。</div></div></header><section class="benefit-settings"><h2>新用户试用</h2><label><input id="newcomerEnabled" type="checkbox" disabled> 首次打开插件，赠送 3 天 PRO</label><p class="muted">每个 Figma ID 仅一次。历史用户通过福利活动领取。</p><span id="newcomerStatus" role="status">加载中…</span></section><section class="benefit-settings"><h2>全平台福利</h2><label>福利标题<input id="benefitTitle" value="PRO 限时福利" maxlength="80"></label><label>有效天数<input id="benefitDays" type="number" min="1" max="30" value="3"></label><p class="muted">发放给当前非 PRO 用户，以及剩余时间少于福利天数的非永久 PRO 用户。每人每期领取一次，下次上线自动领取；永久 PRO 不参与。</p><button class="btn" id="publishBenefit">一键发放福利</button><span id="benefitPublishStatus" role="status"></span></section><section class="benefit-settings"><h2>发放记录</h2><div id="benefitCampaigns">加载中…</div></section>`;
  const el=id=>root.querySelector('#'+id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let requestId=null;
  async function load(){
    const data=await request('admin-pro-benefits');if(!isCurrent())return;
    el('newcomerEnabled').checked=data.settings.newcomer_enabled;el('newcomerEnabled').disabled=false;el('newcomerStatus').textContent='';
    el('benefitCampaigns').innerHTML=data.campaigns.length?data.campaigns.map(c=>`<article class="benefit-campaign"><strong>${escape(c.title)}</strong><span>${c.days} 天 PRO · ${new Date(c.created_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</span><span>已领取 ${c.claimed} 人 · 待上线 ${c.pending} 人 · 不再符合条件 ${c.skipped} 人</span></article>`).join(''):'暂无发放记录';
  }
  el('newcomerEnabled').onchange=async()=>{const enabled=el('newcomerEnabled').checked;el('newcomerEnabled').disabled=true;try{await request('admin-pro-benefits-configure',{newcomerEnabled:enabled});toast(enabled?'新用户试用已开启':'新用户试用已关闭');}catch(e){if(isCurrent())el('newcomerEnabled').checked=!enabled;toast(e.message,true);}finally{if(isCurrent())el('newcomerEnabled').disabled=false;}};
  el('publishBenefit').onclick=async()=>{
    const title=el('benefitTitle').value.trim(),days=Number(el('benefitDays').value);
    if(!title||!Number.isInteger(days)||days<1||days>30){toast('请输入福利标题和 1–30 天的时长',true);return;}
    if(!requestId)requestId=crypto.randomUUID();el('publishBenefit').disabled=true;el('benefitPublishStatus').textContent='正在发放…';
    try{const result=await request('admin-pro-benefits-publish',{title,days,requestId});requestId=null;
      if(!isCurrent())return;
      el('benefitPublishStatus').textContent=result.created===false?'本期福利已发放，无需重复操作':`已发放：${result.recipients} 人待上线领取`;
      toast('福利已发放，用户上线后自动领取');await load();
    }catch(e){if(isCurrent())el('benefitPublishStatus').textContent=e.message;toast(e.message,true);}
    finally{if(isCurrent())el('publishBenefit').disabled=false;}
  };
  try{await load();}catch(e){if(isCurrent())el('newcomerStatus').textContent=e.message;toast(e.message,true);}
}
