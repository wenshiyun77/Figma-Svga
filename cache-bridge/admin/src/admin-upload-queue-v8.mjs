const NAME_LIMIT=120;
const queue=[];
let uploading=false;
let baseChange=null;
let lockedCategory=null;

const activeCategory=()=>{
  const chip=document.querySelector('.official-category-chip.active[data-filter-category]');
  const id=String(chip?.dataset?.filterCategory||'').trim();
  return {id:id&&id!=='all'?id:'',name:id&&id!=='all'?String(chip?.textContent||'').trim():''};
};
const truncateName=value=>{
  const chars=Array.from(String(value||'未命名').trim()||'未命名');
  return chars.length<=NAME_LIMIT?chars.join(''):chars.slice(0,NAME_LIMIT-3).join('')+'...';
};
const relativePath=file=>String(file?.webkitRelativePath||file?.name||'');

const normalizeFiles=files=>[...(files||[])].map(file=>{
  const parts=relativePath(file).split('/').filter(Boolean);
  if(!parts.length)return file;
  const folderIndex=parts.length>2?1:0;
  const next=truncateName(parts[folderIndex]||'未命名');
  if(next===parts[folderIndex])return file;
  parts[folderIndex]=next;
  const clone=new File([file],file.name,{type:file.type,lastModified:file.lastModified});
  try{Object.defineProperty(clone,'webkitRelativePath',{value:parts.join('/'),configurable:true})}catch{}
  return clone;
});

const folderNames=files=>{
  const names=new Set();
  for(const file of files||[]){
    if(!/^image\/(png|jpeg|webp|gif)$/i.test(file?.type||''))continue;
    const parts=relativePath(file).split('/').filter(Boolean);
    if(!parts.length)continue;
    names.add(truncateName(parts.length>2?parts[1]:parts[0]));
  }
  return [...names];
};

// Ensure the material is classified correctly at the first write.
if(!window.__svgaUploadQueueFetchPatched){
  window.__svgaUploadQueueFetchPatched=true;
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
    const url=typeof input==='string'?input:String(input?.url||'');
    let next=init;
    if(url.includes('/functions/v1/plugin-control')&&typeof init?.body==='string'){
      try{
        const payload=JSON.parse(init.body);
        if(payload?.action==='admin-sequence-upsert'&&payload.sequence&&typeof payload.sequence==='object'){
          const category=lockedCategory||activeCategory();
          payload.sequence={
            ...payload.sequence,
            name:truncateName(payload.sequence.name),
            categoryId:category.id||null,
          };
          next={...init,body:JSON.stringify(payload)};
        }
      }catch{}
    }
    return nativeFetch(input,next);
  };
}

const ensureUi=()=>{
  const add=document.querySelector('#uploadFolder');
  if(!add)return null;

  let start=document.querySelector('#uploadQueueStart');
  if(!start){
    start=document.createElement('button');
    start.id='uploadQueueStart';
    start.className='btn';
    start.type='button';
    add.insertAdjacentElement('afterend',start);
  }

  let clear=document.querySelector('#uploadQueueClear');
  if(!clear){
    clear=document.createElement('button');
    clear.id='uploadQueueClear';
    clear.className='btn secondary';
    clear.type='button';
    clear.textContent='清空';
    start.insertAdjacentElement('afterend',clear);
  }

  let summary=document.querySelector('#uploadQueueSummary');
  if(!summary){
    summary=document.createElement('span');
    summary.id='uploadQueueSummary';
    summary.className='muted';
    summary.style.whiteSpace='nowrap';
    clear.insertAdjacentElement('afterend',summary);
  }

  return {add,start,clear,summary};
};

const allNames=()=>[...new Set(queue.flatMap(item=>item.names))];
const allFiles=()=>queue.flatMap(item=>item.files);
const officialActive=()=>Boolean(document.querySelector('#officialTab.active'));

const renderQueue=()=>{
  const ui=ensureUi();
  if(!ui)return;
  const names=allNames();
  const category=activeCategory();
  const hidden=!officialActive()||ui.add.hidden;

  ui.start.hidden=hidden;
  ui.clear.hidden=hidden;
  ui.summary.hidden=hidden;
  ui.add.textContent=names.length?'继续添加文件夹':'添加文件夹';
  ui.add.title='系统窗口一次选择一个文件夹；可连续添加多个文件夹，也可一次拖入多个文件夹';
  ui.start.textContent=names.length
    ? `开始上传 ${names.length} 个文件夹${category.id?` → ${category.name}`:''}`
    : '开始上传';
  ui.start.disabled=uploading||!names.length;
  ui.clear.disabled=uploading||!names.length;
  ui.summary.textContent=names.length?`待上传：${names.join('、')}`:'待上传 0 个文件夹';
};

const addFiles=files=>{
  const normalized=normalizeFiles(files);
  const names=folderNames(normalized);
  if(!names.length)return false;
  queue.push({files:normalized,names});
  renderQueue();
  return true;
};

const clearQueue=()=>{
  queue.length=0;
  renderQueue();
};

const readEntries=reader=>new Promise((resolve,reject)=>reader.readEntries(resolve,reject));
async function collectEntry(entry,prefix,files){
  if(!entry)return;
  if(entry.isFile){
    await new Promise((resolve,reject)=>entry.file(file=>{
      try{Object.defineProperty(file,'webkitRelativePath',{value:prefix+file.name,configurable:true})}catch{}
      files.push(file);
      resolve();
    },reject));
    return;
  }
  if(!entry.isDirectory)return;
  const nextPrefix=prefix+truncateName(entry.name)+'/';
  const reader=entry.createReader();
  for(;;){
    const batch=await readEntries(reader);
    if(!batch.length)break;
    for(const child of batch)await collectEntry(child,nextPrefix,files);
  }
}
async function filesFromDrop(dataTransfer){
  const entries=[...(dataTransfer?.items||[])]
    .map(item=>item.webkitGetAsEntry?.())
    .filter(Boolean);
  if(!entries.length)return [...(dataTransfer?.files||[])];
  const files=[];
  for(const entry of entries)await collectEntry(entry,'',files);
  return files;
}

async function startUpload(){
  if(uploading||!queue.length||typeof baseChange!=='function')return;
  uploading=true;
  lockedCategory=activeCategory();
  renderQueue();
  try{
    await baseChange({target:{files:allFiles()}});
    clearQueue();
  }finally{
    lockedCategory=null;
    uploading=false;
    renderQueue();
  }
}

function enhance(){
  const input=document.querySelector('#folderInput');
  const button=document.querySelector('#uploadFolder');
  if(!input||!button)return;

  // Wait until existing admin-upload-v7 has installed its normal upload handler.
  if(input.dataset.uploadV7!=='1')return;

  ensureUi();
  renderQueue();
  if(input.dataset.uploadQueueV8==='1')return;

  input.dataset.uploadQueueV8='1';
  baseChange=input.onchange;

  // Picker: select one folder per system dialog, then keep adding to the queue.
  input.onchange=event=>{
    addFiles(event?.target?.files||[]);
    try{event.target.value=''}catch{}
  };

  const ui=ensureUi();
  ui.start.onclick=startUpload;
  ui.clear.onclick=clearQueue;

  // Capture-phase drop handler prevents the older v7 handler from uploading immediately.
  button.addEventListener('drop',async event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    button.classList.remove('active');
    try{addFiles(await filesFromDrop(event.dataTransfer))}catch(error){console.error(error)}
  },true);
  button.addEventListener('dragover',event=>event.preventDefault(),true);
}

let raf=0;
const schedule=()=>{
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(enhance);
};

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',event=>{
  if(event.target?.closest?.('[data-filter-category],#officialTab,#personalTab'))queueMicrotask(renderQueue);
},true);

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
}else{
  schedule();
}

window.__svgaAdminUploadQueueVersion='8';
