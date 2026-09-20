const BASE='https://nepilrihisogontdkcqi.supabase.co';
const KEY='sb_publishable_SnT1-Gwl82d_P0HCIfS6Tw_2m8Azxd6';
const STORE='svga-admin-auth-v1';

export function presetRange(key,today){
  const d=new Date(today+'T00:00:00Z');
  d.setUTCDate(d.getUTCDate()-Number(key)+1);
  return {start:d.toISOString().slice(0,10),end:today};
}

export function normalizeGrowthRows(rows){
  return (rows||[]).map(r=>({day:String(r.day),newUsers:Number(r.new_users||0),totalUsers:Number(r.total_users||0)}));
}

function beijingToday(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function readSession(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function saveSession(s){
  localStorage.setItem(STORE,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Number(s.expires_at||Math.floor(Date.now()/1000)+Number(s.expires_in||3600))}));
}
async function refreshSession(s){
  if(!s?.refresh_token)throw Error('登录状态已失效，请重新登录');
  const r=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'content-type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(j.error_description||j.msg||j.error||'登录状态已失效，请重新登录');
  saveSession(j);
  return j;
}
async function accessToken(force=false){
  let s=readSession();
  if(!s?.access_token)throw Error('请先登录管理员账号');
  if(force||Number(s.expires_at||0)<=Math.floor(Date.now()/1000)+60)s=await refreshSession(s);
  return s.access_token;
}
async function fetchGrowth(start,end){
  let token=await accessToken();
  const send=()=>fetch(BASE+'/rest/v1/rpc/svga_admin_user_growth',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({p_start_date:start||null,p_end_date:end||null})});
  let r=await send();
  if(r.status===401){token=await accessToken(true);r=await send()}
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(j.message||j.error_description||j.error||`趋势数据加载失败（${r.status}）`);
  return normalizeGrowthRows(j);
}

function formatDay(day){const [,m,d]=String(day).split('-');return `${Number(m)}月${Number(d)}日`}
function rangeText(range,start,end){
  if(range==='7')return '最近 7 天';
  if(range==='30')return '最近 30 天';
  if(range==='90')return '最近 90 天';
  if(range==='all')return '全部历史';
  return `${start||'-'} 至 ${end||'-'}`;
}
function xSplits(rows){
  return (u,axisIdx,min,max)=>{
    const count=rows.length;
    if(count<=1)return [0];
    const visible=Math.max(1,Math.round(max-min));
    const target=Math.min(7,Math.max(2,Math.floor((u.bbox?.width||700)/110)));
    const step=Math.max(1,Math.ceil(visible/Math.max(1,target-1)));
    const out=[];
    let v=Math.max(0,Math.ceil(min/step)*step);
    for(;v<=Math.min(count-1,max)+0.001;v+=step)out.push(v);
    if(!out.includes(count-1)&&count-1<=max+0.001)out.push(count-1);
    return out;
  };
}
function tooltipPlugin(rows,metric){
  let tip;
  return {hooks:{
    init:u=>{
      tip=document.createElement('div');
      tip.className='growth-tooltip';
      tip.hidden=true;
      u.root.append(tip);
    },
    setCursor:u=>{
      if(!tip)return;
      const idx=u.cursor.idx;
      if(idx==null||!rows[idx]){tip.hidden=true;return}
      const row=rows[idx];
      const value=metric==='total'?row.totalUsers:row.newUsers;
      tip.innerHTML=`<span>${formatDay(row.day)}</span><strong>${value.toLocaleString('zh-CN')} 人</strong><small>${metric==='total'?'累计用户总数':'当日新增用户'}</small>`;
      tip.hidden=false;
      const w=u.width||800,h=u.height||340;
      const left=Math.min(Math.max(10,(u.cursor.left||0)+18),Math.max(10,w-154));
      const top=Math.min(Math.max(10,(u.cursor.top||0)-20),Math.max(10,h-88));
      tip.style.left=`${left}px`;
      tip.style.top=`${top}px`;
    }
  }};
}

export function openGrowthChart(){
  if(typeof document==='undefined')return;
  const existing=document.getElementById('growthTrendModal');
  if(existing){existing.querySelector('.growth-close')?.focus();return}

  const today=beijingToday();
  const initial=presetRange('30',today);
  const overlay=document.createElement('div');
  overlay.id='growthTrendModal';
  overlay.className='growth-mask';
  overlay.innerHTML=`<section class="growth-panel" role="dialog" aria-modal="true" aria-labelledby="growthTitle">
    <header class="growth-head"><div><h2 id="growthTitle">历史用户增长趋势</h2><p>按北京时间统计首次打开插件的用户</p></div><button class="tool-button icon-only growth-close" type="button" aria-label="关闭" title="关闭">×</button></header>
    <div class="growth-toolbar">
      <div class="growth-metrics" role="group" aria-label="统计指标"><button class="growth-metric active" type="button" data-metric="total">用户总数</button><button class="growth-metric" type="button" data-metric="new">每日新增</button></div>
      <div class="growth-ranges" role="group" aria-label="时间范围"><button class="growth-range" type="button" data-range="7">7天</button><button class="growth-range active" type="button" data-range="30">30天</button><button class="growth-range" type="button" data-range="90">90天</button><button class="growth-range" type="button" data-range="all">全部</button><button class="growth-range" type="button" data-range="custom">自定义</button></div>
    </div>
    <div class="growth-custom" hidden><label>开始日期<input class="growth-start" type="date" max="${today}" value="${initial.start}"></label><span>—</span><label>结束日期<input class="growth-end" type="date" max="${today}" value="${initial.end}"></label><button class="btn growth-apply" type="button">应用</button></div>
    <div class="growth-summary"><div><span class="growth-period">最近 30 天</span><small class="growth-dates">${initial.start} — ${initial.end}</small></div><strong class="growth-value">—</strong></div>
    <div class="growth-chart-shell"><div class="growth-chart" id="growthChart"><div class="growth-loading"><span></span>趋势数据加载中…</div></div></div>
  </section>`;
  document.body.append(overlay);

  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const panel=overlay.querySelector('.growth-panel');
  const chartEl=overlay.querySelector('#growthChart');
  const customEl=overlay.querySelector('.growth-custom');
  const startInput=overlay.querySelector('.growth-start');
  const endInput=overlay.querySelector('.growth-end');
  const periodEl=overlay.querySelector('.growth-period');
  const datesEl=overlay.querySelector('.growth-dates');
  const valueEl=overlay.querySelector('.growth-value');
  let metric='total',range='30',rows=[],rangeStart=initial.start,rangeEnd=initial.end,chart=null,resizeObserver=null,requestSeq=0;

  const destroyChart=()=>{resizeObserver?.disconnect();resizeObserver=null;if(chart){chart.destroy();chart=null}chartEl.innerHTML=''};
  const close=()=>{requestSeq++;destroyChart();document.removeEventListener('keydown',onKey);document.body.style.overflow=previousOverflow;overlay.remove()};
  const onKey=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',onKey);
  overlay.querySelector('.growth-close').onclick=close;
  overlay.addEventListener('mousedown',e=>{if(e.target===overlay)close()});

  function updateActive(){
    overlay.querySelectorAll('[data-metric]').forEach(b=>b.classList.toggle('active',b.dataset.metric===metric));
    overlay.querySelectorAll('[data-range]').forEach(b=>b.classList.toggle('active',b.dataset.range===range));
  }
  function updateSummary(){
    periodEl.textContent=rangeText(range,rangeStart,rangeEnd);
    datesEl.textContent=rows.length?`${rows[0].day} — ${rows[rows.length-1].day}`:`${rangeStart||'最早'} — ${rangeEnd||today}`;
    const last=rows[rows.length-1];
    valueEl.textContent=last?`${(metric==='total'?last.totalUsers:last.newUsers).toLocaleString('zh-CN')} 人`:'—';
  }
  function renderChart(){
    destroyChart();
    updateSummary();
    if(!rows.length){chartEl.innerHTML='<div class="growth-empty">所选时间段暂无用户数据</div>';return}
    if(!window.uPlot){chartEl.innerHTML='<div class="growth-empty">图表组件加载失败，请刷新页面重试</div>';return}
    const values=rows.map(r=>metric==='total'?r.totalUsers:r.newUsers);
    const xs=rows.map((_,i)=>i);
    const stroke=metric==='total'?'#8b5cf6':'#818cf8';
    const fill=metric==='total'?'rgba(139,92,246,.11)':'rgba(129,140,248,.10)';
    const build=()=>{
      const width=Math.max(320,Math.floor(chartEl.getBoundingClientRect().width||820));
      const height=window.innerWidth<720?290:350;
      const options={
        width,height,
        legend:{show:false},
        cursor:{show:true,x:true,y:true,points:{show:true,size:7,width:2}},
        scales:{x:{time:false},y:{auto:true}},
        axes:[
          {label:'日期',stroke:'rgba(255,255,255,.46)',grid:{show:true,stroke:'rgba(255,255,255,.055)',width:1},ticks:{show:true,stroke:'rgba(255,255,255,.11)'},splits:xSplits(rows),values:(u,splits)=>splits.map(v=>rows[Math.max(0,Math.min(rows.length-1,Math.round(v)))]?.day.slice(5).replace('-','/')||'')},
          {label:'人数',stroke:'rgba(255,255,255,.46)',grid:{show:true,stroke:'rgba(255,255,255,.065)',width:1},ticks:{show:true,stroke:'rgba(255,255,255,.11)'},values:(u,splits)=>splits.map(v=>Math.max(0,Math.round(v)).toLocaleString('zh-CN')),size:58}
        ],
        series:[{}, {label:metric==='total'?'用户总数':'每日新增',stroke,width:2.5,fill,points:{show:false}}],
        plugins:[tooltipPlugin(rows,metric)]
      };
      chart=new window.uPlot(options,[xs,values],chartEl);
    };
    build();
    if('ResizeObserver'in window){
      let lastWidth=chartEl.clientWidth;
      resizeObserver=new ResizeObserver(()=>{
        if(!chart)return;
        const width=Math.max(320,Math.floor(chartEl.getBoundingClientRect().width||820));
        if(Math.abs(width-lastWidth)>4){lastWidth=width;chart.setSize({width,height:window.innerWidth<720?290:350})}
      });
      resizeObserver.observe(chartEl);
    }
  }
  async function loadCurrent(){
    const seq=++requestSeq;
    destroyChart();
    chartEl.innerHTML='<div class="growth-loading"><span></span>趋势数据加载中…</div>';
    valueEl.textContent='—';
    try{
      let start=rangeStart,end=rangeEnd;
      if(range==='all')start=null;
      const nextRows=await fetchGrowth(start,end);
      if(seq!==requestSeq||!document.body.contains(overlay))return;
      rows=nextRows;
      renderChart();
    }catch(err){
      if(seq!==requestSeq||!document.body.contains(overlay))return;
      rows=[];
      updateSummary();
      chartEl.innerHTML=`<div class="growth-empty growth-error">${String(err.message||err)}</div>`;
    }
  }
  function selectPreset(next){
    range=next;
    customEl.hidden=true;
    if(next==='all'){rangeStart=null;rangeEnd=today}
    else{const r=presetRange(next,today);rangeStart=r.start;rangeEnd=r.end;startInput.value=r.start;endInput.value=r.end}
    updateActive();
    loadCurrent();
  }

  overlay.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;updateActive();renderChart()});
  overlay.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{
    const next=b.dataset.range;
    if(next==='custom'){range='custom';customEl.hidden=false;updateActive();startInput.focus();return}
    selectPreset(next);
  });
  overlay.querySelector('.growth-apply').onclick=()=>{
    const start=startInput.value,end=endInput.value;
    if(!start||!end){chartEl.innerHTML='<div class="growth-empty growth-error">请选择完整的开始和结束日期</div>';return}
    if(start>end){chartEl.innerHTML='<div class="growth-empty growth-error">开始日期不能晚于结束日期</div>';return}
    range='custom';rangeStart=start;rangeEnd=end;updateActive();loadCurrent();
  };

  updateActive();
  loadCurrent();
  requestAnimationFrame(()=>overlay.querySelector('.growth-close')?.focus());
}

function wireHistorySummary(){
  if(typeof document==='undefined')return;
  document.querySelectorAll('.summary').forEach(card=>{
    const label=card.querySelector('span')?.textContent?.trim()||'';
    if(label!=='历史用户'||card.dataset.growthV5==='1')return;
    card.dataset.growthV5='1';
    card.classList.add('growth-summary-entry');
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label','查看历史用户增长趋势');
    card.title='查看历史用户增长趋势';
    card.addEventListener('click',openGrowthChart);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openGrowthChart()}});
  });
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  const observer=new MutationObserver(wireHistorySummary);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wireHistorySummary,{once:true});
  else wireHistorySummary();
}
