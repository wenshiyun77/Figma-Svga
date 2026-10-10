function createWavePanel() {
 const style=document.createElement('style');style.textContent=`
 .wave-left,.wave-right,.wave-stage-controls,.wave-presets,.wave-avatar{display:none}
 body.wave-workspace{min-width:0}
 body.wave-workspace .editor-layout{grid-template-columns:280px minmax(0,1fr) 220px}
 body.wave-workspace .right-sidebar{display:none!important}
 body.wave-workspace .left-sidebar>*{display:none!important}
 body.wave-workspace .left-sidebar>.wave-left{display:flex!important;flex-direction:column;height:100%;min-height:0;background:var(--surface-left)}
 body.wave-workspace .stage-canvas-summary,body.wave-workspace #currentMaterialActions,body.wave-workspace .playbar,body.wave-workspace #canvasInteraction{display:none!important}
 body.wave-workspace .stage{position:relative;min-width:0;background:var(--surface-stage)}
 body.wave-workspace .stage-viewport{background:radial-gradient(ellipse at center,rgba(139,92,246,.08),transparent 70%)}
 body.wave-workspace .stage-viewport::before{opacity:.025}
 body.wave-workspace .canvas-frame{background:transparent!important;border:0!important;box-shadow:none!important}
 body.wave-workspace .wave-presets{display:flex;gap:8px;padding:12px 16px;align-items:center;border-bottom:1px solid #ffffff0d;flex:0 0 auto;background:var(--surface-topbar)}
 body.wave-workspace .wave-stage-controls{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid #ffffff12;flex:0 0 auto;min-height:58px;background:var(--surface-topbar)}
 .wave-stage-controls>.right-action-footer{display:flex;height:auto;flex:0 0 auto;padding:0;margin-left:auto;border:0;background:none;box-shadow:none;gap:8px;overflow:visible}
 body.wave-workspace .wave-avatar:not([hidden]){display:flex;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40%;aspect-ratio:1;border:1px dashed #8b5cf650;border-radius:50%;align-items:center;justify-content:center;color:#a3a0b5;font-size:11px;pointer-events:none;background:#0c0b1260}
 .wave-header{display:flex;align-items:center;gap:10px;padding:16px;border-bottom:1px solid #ffffff0d;flex:0 0 auto}.wave-header strong{font-size:16px;color:#f0eef9}.wave-header small{display:block;color:#8d869e;font-size:10px;margin-top:4px}.wave-mark{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;font-size:19px}
 .wave-left button,.wave-right button,.wave-presets button,.wave-stage-controls>button,.wave-presets summary{border:1px solid #ffffff15;background:#ffffff05;color:#bdb8cd;border-radius:7px;padding:7px 10px;font-size:11px;min-height:30px;cursor:pointer;transition:background .12s,border-color .12s}
 .wave-left button:hover:not(:disabled),.wave-right button:hover:not(:disabled),.wave-presets button:hover:not(:disabled),.wave-stage-controls>button:hover:not(:disabled){background:#8b5cf61a;border-color:#8b5cf655;color:#eee8ff}
 .wave-left button[aria-pressed=true],.wave-right .active,.wave-stage-controls>button[aria-pressed=true]{background:color-mix(in srgb,var(--accent-2) 18%,transparent);color:#d5c4ff;border-color:color-mix(in srgb,var(--accent-2) 65%,transparent)}
 .wave-left button:focus-visible,.wave-right button:focus-visible,.wave-presets button:focus-visible,.wave-stage-controls button:focus-visible,.wave-left input:focus-visible,.wave-layer-card:focus-visible{outline:2px solid var(--accent-2);outline-offset:2px}
 .wave-current-layer{padding:12px 16px 10px;display:flex;align-items:center;gap:8px;color:#847d96;font-size:11px}.wave-current-layer select{flex:1;min-width:0}.wave-current-layer input[type=color]{width:30px;height:30px;padding:3px;border:1px solid #ffffff20;border-radius:6px;background:#ffffff05;cursor:pointer}.wave-quick-controls{padding-top:5px;padding-bottom:10px;border-bottom:0}.wave-quick-controls .wave-slider>span{font-size:10px}.wave-stage-controls #waveUndoBtn,.wave-stage-controls #waveRedoBtn{font-size:17px;padding:3px 8px;min-width:28px}
 .wave-left select,.wave-presets select{background:#17151f;color:#e0d9ec;border:1px solid #ffffff15;border-radius:7px;padding:7px 8px;min-height:30px;font-size:11px}
 .wave-panel-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:4px;background:#07060c;border:1px solid #ffffff0d;border-radius:9px;margin:0 16px 12px}.wave-panel-tabs button{border:0;background:none;color:#928ba3}.wave-panel-tabs button[aria-selected=true]{background:var(--accent-2);color:#fff;box-shadow:0 1px 4px #0006}
 .wave-panel-scroll{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#4b385f transparent;padding-bottom:10px}.wave-tab-panel[hidden]{display:none}.wave-section{padding:11px 16px;border-bottom:1px solid #ffffff09}.wave-section h3{font-size:11px;color:#9992aa;font-weight:500;margin:0 0 9px}.wave-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.wave-options[data-wave-group=shape]{grid-template-columns:repeat(5,minmax(0,1fr))}.wave-options[data-wave-group=colorType]{grid-template-columns:repeat(3,minmax(0,1fr))}.wave-options button{padding:7px 3px}
 .wave-slider-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 14px;padding-top:14px;padding-bottom:14px}.wave-slider[hidden],.wave-motion button[hidden],.wave-section[hidden],.wave-current-layer input[hidden]{display:none!important}.wave-slider{display:block;min-width:0;margin:0}.wave-slider>span{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#bcb5cb;gap:4px;margin-bottom:3px}.wave-slider output{display:none}.wave-number-wrap{display:flex;align-items:center;gap:2px;color:#81788f;font-size:10px}.wave-number{width:40px;min-width:0;background:#ffffff06;border:1px solid #ffffff12;border-radius:4px;color:#d5c4ff;font:inherit;font-size:11px;padding:3px;text-align:right;appearance:textfield}.wave-number::-webkit-inner-spin-button{appearance:none}.wave-slider input[type=range]{display:block;width:100%;height:22px;min-height:22px;padding:0;border:0;box-shadow:none;accent-color:var(--accent-2);cursor:pointer;margin:0;background:transparent}
 .wave-slider input[type=range]{appearance:none;-webkit-appearance:none}.wave-slider input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:linear-gradient(to right,var(--accent-2) var(--wave-progress,0%),#342e40 var(--wave-progress,0%))}.wave-slider input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:12px;height:12px;border-radius:50%;margin-top:-4px;background:var(--accent-2);border:2px solid #bda1ff}.wave-slider input[type=range]::-moz-range-track{height:4px;border-radius:4px;background:#342e40}.wave-slider input[type=range]::-moz-range-progress{height:4px;background:var(--accent-2)}
 #waveBitmapUpload{border-style:dashed;width:100%;padding:9px}#waveBitmapSummary{display:flex;align-items:center;gap:8px;font-size:11px;color:#bcb5cb;margin-top:9px}#waveBitmapSummary[hidden]{display:none}#waveBitmapSummary img{width:32px;height:32px;object-fit:contain;background:#ffffff08;border-radius:5px}#waveBitmapSummary button{margin-left:auto}.wave-note{font-size:10px;color:#837b93;line-height:1.7;margin:7px 0 0}.wave-panel-footer{padding:10px 16px;border-top:1px solid #ffffff0d;color:#81788f;font-size:10px;flex:0 0 auto}
 .wave-motion{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.wave-motion button{height:auto;min-height:70px;line-height:1.2;padding:12px 5px;display:flex;flex-direction:column;gap:7px;align-items:center}.wave-motion button i{font-style:normal;font-size:20px;color:inherit}.wave-motion-description{font-size:11px;color:#9990a8;line-height:1.8;margin:0 0 12px}
 #waveColors{display:flex;gap:10px;flex-wrap:wrap}#waveColors input{width:44px;height:44px;border:1px solid #ffffff20;border-radius:8px;background:#ffffff05;padding:4px;cursor:pointer}
 body.wave-workspace .wave-right{display:flex;flex-direction:column;min-width:0;min-height:0;height:100%;border-left:1px solid #ffffff0d;background:var(--surface-left)}.wave-right .wave-header{padding:8px 16px;border:0;gap:8px;height:auto;min-height:38px;display:grid;grid-template-columns:1fr auto}.wave-right .wave-header strong{font-size:11px}.wave-right .wave-header small{display:none}.wave-right .wave-header button{grid-column:1/-1;width:100%;padding:3px 9px;min-height:25px;margin-left:auto}.wave-layer-count{color:#82798e;font-size:10px}
 #waveCompositionList{display:flex;flex-direction:column;gap:8px;overflow-x:hidden;overflow-y:auto;padding:10px;flex:1;min-height:0;scrollbar-width:thin;scrollbar-color:#49385f transparent}.wave-layer-card{position:relative;flex:0 0 auto;min-width:0;border:1px solid #ffffff14;border-radius:8px;background:#ffffff03;padding:8px;cursor:pointer;outline:0}.wave-layer-card.active{border-color:var(--accent-2);background:#8b5cf614}.wave-layer-card canvas{float:left;width:32px;height:32px;margin:0 7px 4px 0;border-radius:5px;background:#08070d}.wave-layer-card strong{font-size:11px;display:block;margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wave-layer-card small{display:block;font-size:9px;color:#978ca6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wave-layer-actions{clear:both;display:flex;gap:4px;justify-content:flex-end;margin-top:3px}.wave-layer-actions button{padding:0 6px;min-height:22px;font-size:10px}.wave-layer-card[data-hidden=true]{opacity:.5}
 .wave-presets select{max-width:180px;min-width:90px;flex:1}.wave-presets .wave-toolbar-title{font-size:11px;color:#837b93;margin-right:2px;white-space:nowrap}.wave-more{position:relative;margin-left:auto}.wave-more summary{list-style:none;white-space:nowrap}.wave-more summary::-webkit-details-marker{display:none}.wave-more[open] summary{border-color:var(--accent-2);color:#d4c0ff}.wave-more-menu{position:absolute;right:0;top:38px;z-index:30;width:150px;padding:6px;display:grid;gap:4px;border:1px solid #453353;border-radius:9px;background:#19141f;box-shadow:0 12px 32px #0008}.wave-more-menu button{text-align:left;border:0;background:none;width:100%}.wave-stage-controls #wavePlayBtn{color:#d5c4ff;min-width:72px}.wave-stage-controls #waveAvatarBtn{white-space:nowrap}.wave-shortcut{font-size:10px;color:#777080;margin-left:5px}
 @media(max-width:1100px){.wave-stage-controls,.wave-presets{flex-wrap:wrap}.wave-stage-controls>.right-action-footer{flex:1 0 100%;justify-content:flex-end}.wave-shortcut{display:none}}
 @media(max-width:960px){body.wave-workspace .editor-layout{grid-template-columns:250px minmax(0,1fr) 200px}.wave-shortcut,.wave-toolbar-title{display:none!important}.wave-presets{padding:10px!important;gap:6px!important}.wave-stage-controls{padding:8px 10px!important;gap:6px!important}.wave-stage-controls>button{padding:6px!important}.wave-stage-controls>.right-action-footer{gap:5px}.wave-stage-controls #waveAvatarBtn{font-size:10px}.wave-presets select{max-width:150px}}
 @media(max-width:760px){.wave-slider-grid{grid-template-columns:minmax(0,1fr)}body.wave-workspace .editor-layout{grid-template-columns:220px minmax(0,1fr) 170px}.wave-stage-controls{flex-wrap:wrap}.wave-stage-controls>.right-action-footer{flex:1 0 100%;justify-content:flex-end}.wave-presets{flex-wrap:wrap}.wave-presets select{max-width:none}.wave-right .wave-header{padding-left:10px}#waveCompositionList{padding-left:10px}.wave-presets .wave-more{margin-left:0}}
 `;document.head.append(style);
 const sliderHtml=keys=>waveSliders.filter(([key])=>keys.includes(key)).map(([key,label,min,max,step])=>{const percent=['length','holeRadius','opacity'].includes(key),scale=percent?100:1,unit=percent?'%':key==='rotation'?'°':key==='speed'?'×':'';return `<label class="wave-slider"><span>${label}<output id="wave_value_${key}"></output><span class="wave-number-wrap"><input class="wave-number" id="wave_number_${key}" data-wave-number="${key}" type="number" aria-label="${label}数值" min="${min*scale}" max="${max*scale}" step="${step*scale}">${unit}</span></span><input id="wave_${key}" data-wave-slider="${key}" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}"></label>`;}).join('');
 const left=document.createElement('div');left.className='wave-left';left.innerHTML=`<header class="wave-header"><button id="waveBackBtn" title="返回功能入口" aria-label="返回功能入口">‹</button><strong>声浪实验室</strong></header><div class="wave-current-layer"><span>正在编辑</span><select id="waveActiveLayer" aria-label="当前声波图层"></select><input id="waveQuickColor" type="color" data-wave-color="1" aria-label="当前图层颜色" title="直接修改当前图层颜色"></div><section class="wave-section wave-slider-grid wave-quick-controls">`+sliderHtml(['speed','opacity'])+`</section><nav class="wave-panel-tabs" role="tablist" aria-label="声波参数"><button role="tab" id="waveTabShape" data-wave-tab="shape" aria-controls="wavePanelShape" aria-selected="true">形态</button><button role="tab" id="waveTabMotion" data-wave-tab="motion" aria-controls="wavePanelMotion" aria-selected="false">动效</button><button role="tab" id="waveTabColor" data-wave-tab="color" aria-controls="wavePanelColor" aria-selected="false">色彩</button></nav><div class="wave-panel-scroll"><div id="wavePanelShape" class="wave-tab-panel" role="tabpanel" aria-labelledby="waveTabShape">`+
 waveChoiceGroup('type','构件类型',[['point','散点构件'],['line','流光线条']])+waveChoiceGroup('pattern','分布方式',[['emit','中心迸发'],['ring','闭环圆周']])+waveChoiceGroup('shape','轮廓形状',[['circle','圆'],['square','方'],['diamond','菱'],['star','星'],['heart','心']])+`<section class="wave-section wave-slider-grid">`+sliderHtml(['layers','density','thickness','length','holeRadius','rotation'])+`</section><section class="wave-section"><button id="waveBitmapUpload">＋ 上传自定义构件</button><input id="waveBitmapInput" type="file" accept="image/png,image/jpeg,image/webp" hidden><div id="waveBitmapSummary" hidden><img id="waveBitmapThumb" alt="自定义构件"><span>已应用自定义素材</span><button id="waveBitmapClearBtn" aria-label="移除自定义构件">×</button></div><p class="wave-note">透明 PNG 效果更佳，支持替换 PAG 图片。</p></section></div><div id="wavePanelMotion" class="wave-tab-panel" role="tabpanel" aria-labelledby="waveTabMotion" hidden><section class="wave-section"><h3>动效组合</h3><p class="wave-motion-description">可叠加多个动效，点击再次关闭。</p><div class="wave-motion">${[['diffuse','扩散','◎'],['stream','发散','↗'],['rotate','旋转','↻'],['tracer','流光','〰'],['vibrate','震动','≈'],['pulse','缩放','↔']].map(([key,label,icon])=>`<button data-wave-motion="${key}" aria-pressed="false"><i aria-hidden="true">${icon}</i>${label}</button>`).join('')}</div></section><section class="wave-section wave-slider-grid">`+sliderHtml(['attenuation'])+`</section></div><div id="wavePanelColor" class="wave-tab-panel" role="tabpanel" aria-labelledby="waveTabColor" hidden>`+waveChoiceGroup('colorType','配色方式',[['solid','单色'],['radial','径向'],['quad','象限']])+`<section class="wave-section"><h3>颜色</h3><div id="waveColors"></div><p class="wave-note">点击色块选择颜色，修改只应用到当前图层。</p></section></div></div><div class="wave-panel-footer">调整即时预览 · 数值可直接输入</div>`;
 document.querySelector('.left-sidebar').append(left);
 const right=document.createElement('div');right.className='wave-right';right.innerHTML='<header class="wave-header"><strong>声波图层</strong><span class="wave-layer-count" id="waveLayerCount"></span><button id="waveAddLayer" aria-label="添加声波图层">＋ 添加图层</button></header><div id="waveCompositionList"></div>';document.querySelector('.editor-layout').append(right);
 const presets=document.createElement('div');presets.className='wave-presets';presets.innerHTML='<span class="wave-toolbar-title">方案</span><select id="wavePresetList" aria-label="已保存方案"><option value="">已保存方案</option></select><button id="waveSavePreset">保存方案</button><button id="waveSaveImage">保存图片</button><details class="wave-more" id="waveMore"><summary>更多 ···</summary><div class="wave-more-menu"><button id="waveSaveProject">保存工程</button><button id="waveOpenProject">打开工程</button><button id="waveDeletePreset">删除当前方案</button></div></details>';document.querySelector('.stage').prepend(presets);
 const controls=document.createElement('div');controls.className='wave-stage-controls';controls.innerHTML='<button id="wavePlayBtn" aria-label="播放或暂停">暂停 / 播放</button><button id="waveUndoBtn" title="撤销（⌘/Ctrl Z）" aria-label="撤销">↶</button><button id="waveRedoBtn" title="重做（⌘/Ctrl Shift Z）" aria-label="重做">↷</button><button id="waveAvatarBtn" aria-pressed="true">头像参考</button><span class="wave-shortcut">空格播放 / 暂停</span>';document.querySelector('.stage').append(controls);
 const avatar=document.createElement('div');avatar.className='wave-avatar';avatar.id='waveAvatar';avatar.textContent='头像位 (Avatar)';$('canvasFrame').append(avatar);
 left.addEventListener('click',event=>{const tab=event.target.closest('[data-wave-tab]');if(tab)selectWaveTab(tab.dataset.waveTab);const button=event.target.closest('[data-wave-key]');if(button){const key=button.dataset.waveKey,value=button.dataset.waveValue;changeWaveComposition(()=>{const c=activeWaveLayer().config;c[key]=value;if(key==='colorType'){const n={solid:1,radial:2,quad:4}[value];c.colors=Array.from({length:n},(_,i)=>c.colors[i]||c.colors[0]);}});}
 const motion=event.target.closest('[data-wave-motion]');if(motion)changeWaveComposition(()=>{const c=activeWaveLayer().config;c.motionFlags={...c.motionFlags,[motion.dataset.waveMotion]:!c.motionFlags[motion.dataset.waveMotion]};c.rotate=c.motionFlags.rotate;});});
 left.addEventListener('pointerdown',e=>{if(e.target.matches('[data-wave-slider], [data-wave-color]'))beginWaveGesture();});
 window.addEventListener('pointerup',endWaveGesture);window.addEventListener('pointercancel',endWaveGesture);window.addEventListener('blur',endWaveGesture);
 left.addEventListener('keydown',e=>{if(e.target.matches('[data-wave-slider]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))beginWaveGesture();if(e.target.matches('[data-wave-number]')&&e.key==='Enter')e.target.blur();});left.addEventListener('keyup',e=>{if(e.target.matches('[data-wave-slider]'))endWaveGesture();});
 left.addEventListener('dblclick',e=>{const key=e.target.dataset.waveSlider;if(key)waveChangeConfig(key,normalizeWaveConfig()[key]);});
 left.addEventListener('input',event=>{if(event.target.dataset.waveSlider)waveChangeConfig(event.target.dataset.waveSlider,Number(event.target.value));if(event.target.dataset.waveColor)changeWaveComposition(()=>{const c=activeWaveLayer().config;c.colors[Number(event.target.dataset.waveColor)-1]=event.target.value;c.color=c.colors[0];});});
 left.addEventListener('change',event=>{if(event.target.matches('[data-wave-slider], [data-wave-color]'))endWaveGesture();const key=event.target.dataset.waveNumber;if(key){const input=$('wave_'+key),scale=['length','holeRadius','opacity'].includes(key)?100:1;const value=Number(event.target.value)/scale;if(Number.isFinite(value))waveChangeConfig(key,Math.max(Number(input.min),Math.min(Number(input.max),value)));}});
 $('waveActiveLayer').onchange=()=>{waveSelectedLayer=$('waveActiveLayer').value;renderWavePanel();};
 left.querySelector('.wave-panel-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const tabs=[...left.querySelectorAll('[data-wave-tab]')],current=tabs.indexOf(document.activeElement),next=tabs[(current+(e.key==='ArrowRight'?1:2))%3];selectWaveTab(next.dataset.waveTab);next.focus();});
 document.addEventListener('keydown',e=>{if(state.workspaceMode!=='wave'||state.busy||e.code!=='Space'||e.target.closest('input,textarea,select,button,summary,[contenteditable]'))return;e.preventDefault();setPreviewSpacePressed(false);togglePreviewPlayback();renderWavePanel();});
 $('waveBackBtn').onclick=returnSvgaFeatureWorkspace;$('waveBitmapUpload').onclick=()=>$('waveBitmapInput').click();$('waveBitmapInput').onchange=()=>void uploadWaveBitmap();$('waveBitmapClearBtn').onclick=()=>changeWaveComposition(()=>activeWaveLayer().bitmap=null);
 $('waveAddLayer').onclick=()=>changeWaveComposition(()=>{const layers=waveLayers();if(layers.length>=10)return;const active=activeWaveLayer(),layer=newWaveLayer(JSON.parse(JSON.stringify(active.config)),active.bitmap);layers.push(layer);waveSelectedLayer=layer.id;});
 right.addEventListener('click',event=>{const card=event.target.closest('[data-wave-layer]');if(!card)return;const id=card.dataset.waveLayer,action=event.target.closest('[data-wave-action]')?.dataset.waveAction;if(!action){waveSelectedLayer=id;renderWavePanel();return;}changeWaveComposition(()=>{const layers=waveLayers(),index=layers.findIndex(l=>l.id===id);if(action==='visible')layers[index].visible=!layers[index].visible;if(action==='delete'&&layers.length>1)layers.splice(index,1);if(action==='up'&&index>0)[layers[index-1],layers[index]]=[layers[index],layers[index-1]];if(action==='down'&&index<layers.length-1)[layers[index+1],layers[index]]=[layers[index],layers[index+1]];});});
 let dragged=null;right.addEventListener('dragstart',e=>{dragged=e.target.closest('[data-wave-layer]')?.dataset.waveLayer;e.dataTransfer.setData('text/plain',dragged||'');});right.addEventListener('dragover',e=>e.preventDefault());right.addEventListener('drop',e=>{e.preventDefault();const target=e.target.closest('[data-wave-layer]')?.dataset.waveLayer;if(target&&dragged&&target!==dragged)changeWaveComposition(()=>{const layers=waveLayers(),from=layers.findIndex(l=>l.id===dragged),to=layers.findIndex(l=>l.id===target);if(from>=0&&to>=0)layers.splice(to,0,layers.splice(from,1)[0]);});dragged=null;});
 $('waveUndoBtn').onclick=()=>{endWaveGesture();undoProjectEdit();};$('waveRedoBtn').onclick=()=>{endWaveGesture();redoProjectEdit();};
 document.addEventListener('keydown',e=>{if(state.workspaceMode!=='wave'||state.busy||e.target.closest('input,textarea,select,[contenteditable]'))return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='d'){e.preventDefault();$('waveAddLayer').click();}if(e.altKey&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const layers=waveLayers(),index=layers.indexOf(activeWaveLayer());waveSelectedLayer=layers[(index+(e.key==='ArrowRight'?1:layers.length-1))%layers.length].id;renderWavePanel();}});
 $('wavePlayBtn').onclick=()=>{togglePreviewPlayback();renderWavePanel();};$('waveAvatarBtn').onclick=()=>{waveAvatarVisible=!waveAvatarVisible;renderWavePanel();};$('waveSaveProject').onclick=()=>void saveWaveProject();$('waveOpenProject').onclick=()=>$('waveProjectInput').click();
 $('waveSaveImage').onclick=async()=>{if(state.busy)return;const canvas=document.createElement('canvas');canvas.width=state.package.project.canvas.width;canvas.height=state.package.project.canvas.height;await drawProjectFrameToCanvas(canvas,state.previewFrame,{project:state.package.project,fps:projectFps(),totalFrames:projectBaseFrameCount(),outputScale:1});canvas.toBlob(async blob=>{if(blob)downloadBytes('声波.png','image/png',new Uint8Array(await blob.arrayBuffer()));});};
 $('waveSavePreset').onclick=()=>{if(state.busy)return;const name=prompt('方案名称','声波方案 '+(readWavePresets().length+1));if(!name)return;const presets=readWavePresets();presets.unshift({id:Date.now().toString(36),name:name.slice(0,50),layers:JSON.parse(JSON.stringify(waveLayers()))});try{localStorage.setItem('svga_wave_presets',JSON.stringify(presets.slice(0,20)));renderWavePresetList();}catch{log('方案存储空间不足，请保存声波工程。');}};
 $('wavePresetList').onchange=()=>{const preset=readWavePresets().find(p=>p.id===$('wavePresetList').value);if(preset)changeWaveComposition(()=>{state.package.project.metadata.waveLayers=JSON.parse(JSON.stringify(preset.layers));waveSelectedLayer=null;});};
 $('waveDeletePreset').onclick=()=>{const id=$('wavePresetList').value;if(id){localStorage.setItem('svga_wave_presets',JSON.stringify(readWavePresets().filter(p=>p.id!==id)));renderWavePresetList();}};
 renderWavePresetList();selectWaveTab('shape');
}
const state = {
        selection: null,
        package: null,
        selectedKey: null,
        selectedKeys: new Set(),
        layerStatuses: new Map(),
        canvasStale: false,
        autoCaptured: false,
        selectionDiagnosticSignature: "",
        updateTimer: null,
        updatePollInFlight: false,
        layerUpdateStatusSignature: "",
        licenseBackupRestoreInFlight: false,
        license: null,
        busy: false,
        exportModalOwner: null,
        exportProgressValue: 0,
        activeExportFormat: "",
        exportProfileDraft: null,
        exportSettingsReturnFocus: null,
        pendingRequests: new Map(),
        lightingUnlocked: false,
        legacyLightingUnlocked: false,
        lightingUnlockLoaded: false,
        lightingUnlockReturnFocus: null,
        controlPlane: {
          configured: false,
          online: false,
          isAdmin: false,
          authenticated: false,
          features: { lighting: false },
          subscription: { plan: "none", startedAt: null, expiresAt: null, daysRemaining: null },
          user: null,
          cacheBridgeUrl: "",
        },
        adminUsers: [],
        adminSecondaryUsers: [],
        adminUserMode: "online",
        adminUsersPagination: { offset: 0, limit: 40, total: 0, hasMore: false },
        adminSecondaryUsersPagination: { offset: 0, limit: 40, total: 0, hasMore: false },
        adminStatistics: { sort: "opens", direction: "desc", users: [], total: 0, sequence: 0 },
        adminUsersLoading: false,
        adminUsersRequestSequence: 0,
        adminOnlineUsersRefreshTimer: null,
        adminResumePreview: false,
        adminOfficialSequences: [],
        adminDisplacementMaterials: [],
        adminOfficialSequenceCategories: [],
        adminSequenceCategoryDraftOpen: false,
        adminPersonalSequenceUsers: [],
        adminFeedbackThreads: [],
        adminFeedbackThread: null,
        adminUserSecondaryPageOpen: false,
        adminUserSecondaryMode: "",
        adminPanelSection: "users",
        adminPanelBusy: false,
        adminSequencePreviewBackfillPromise: null,
        adminSequencePreviewBackfillComplete: false,
        feedbackRating: 0,
        feedbackMessages: [],
        feedbackBusy: false,
        controlPlanePollTimer: null,
        controlPlaneExpiryTimer: null,
        previewFrame: 0,
        previewPlaying: false,
        previewRaf: null,
        previewStartedAt: 0,
        previewLastPlaybackFrame: null,
        previewDrawToken: 0,
        previewDrawInFlight: false,
        previewDrawQueuedFrame: null,
        previewViewportRaf: null,
        previewViewportMetrics: null,
        previewDisplaySignature: "",
        previewRenderScale: 1,
        previewPasteboardSignature: "",
        previewViewportMode: "fit",
        previewViewportNeedsCenter: true,
        previewSpacePressed: false,
        previewPan: null,
        selectionOverlaySignature: "",
        appliedCanvasBg: "",
        previewBufferCanvas: null,
        previewImageCache: new Map(),
        glowRayTextureCache: new Map(),
        glowStarTextureCache: new Map(),
        glowTriangleTextureCache: new Map(),
        glowParticleTextureCache: new Map(),
        lightingTextureCache: new Map(),
        lightingBrightElementCache: new WeakMap(),
        glowInnerEdgeTextureCache: new WeakMap(),
        glowAuraTextureCache: new WeakMap(),
        glowSurfaceHighlightCache: new WeakMap(),
        glowSurfaceHighlightSheetCache: new WeakMap(),
        hardSweepSourceCanvasCache: new Map(),
        hardSweepSourceCanvasCacheBytes: 0,
        hardSweepSourceIdentityCache: new WeakMap(),
        hardSweepContourCanvasCache: new WeakMap(),
        sweepMotionPayloadCache: new Map(),
        sweepMaskPathCache: new WeakMap(),
        sweepPreviewMaskCanvas: null,
        sweepPreviewContourCanvas: null,
        sweepMotionPreviewMaskCanvas: null,
        sweepSparkleFieldCache: new Map(),
        sweepTravelBoundsCache: new WeakMap(),
        particleTextureCache: new Map(),
        particleRandomPlanCache: new Map(),
        particleContentDistributionCache: new Map(),
        particleLayerEmissionCache: new WeakMap(),
        particleGuidePathSampleCache: new WeakMap(),
        particleGuidePathDraft: null,
        particleGuidePathDrag: null,
        particleGuidePathSelectedPointIndex: 0,
        sequenceAreaSubtractDraft: null,
        sequenceAreaSubtractDrag: null,
        sequenceAreaSubtractSelectedPointIndex: 0,
        lightingSourceDrag: null,
        lightingSourcePickGesture: null,
        normalizedParticleEffectRefs: new WeakSet(),
        normalizedLightingEffectRefs: new WeakSet(),
        sequenceFrameEffectCache: new Map(),
        sequenceMaskCanvasCache: new Map(),
        lastSequenceMaskSourceKey: "",
        sequenceParentBindingAssetKey: "",
        sequenceParentBindingPointer: null,
        sequenceParentBindingHoverKey: "",
        sequenceParentLinkRaf: null,
        displacementFrameCache: new Map(),
        displacementCompositeSourceCache: new Map(),
        displacementCompositeBuildPromiseCache: new Map(),
        displacementPresetFrameCache: new Map(),
        displacementListPreviewEnabled: false,
        displacementListPreviewToken: 0,
        displacementPreviewLoadingToken: 0,
        displacementPreviewLoadingTimer: null,
        displacementWarmupToken: 0,
        displacementWarmupSignature: "",
        displacementWarmupCompletedSignature: "",
        displacementWarmupInFlight: false,
        displacementControlPreviewRaf: null,
        displacementControlIdleTimer: null,
        displacementThumbnailIdleTimer: null,
        sweepCustomShapeDraft: null,
        sequenceLibrary: [],
        officialSequenceLibrary: [],
        displacementMaterials: [],
        displacementCatalogReady: false,
        displacementLibraryLoading: false,
        displacementLibraryReady: false,
        displacementLibrarySessionInitialized: false,
        displacementLibraryError: "",
        displacementVisibleBoundsByAssetKey: new Map(),
        displacementVisibleBoundsPending: new Map(),
        officialSequenceCategories: [],
        officialSequenceCategoryId: "all",
        officialSequenceLoading: false,
        officialSequenceLoadPromise: null,
        officialSequenceLoadError: "",
        officialSequenceLibraryReady: false,
        officialSequenceMetadataStale: false,
        officialSequenceRefreshRetryCount: 0,
        officialSequenceRefreshTimer: null,
        officialSequenceLoadProgress: { loadedFrames: 0, totalFrames: 0, loadedBytes: 0, totalBytes: 0 },
        personalSequenceLoading: false,
        personalSequenceLoadPromise: null,
        personalSequenceLoadError: "",
        personalSequenceLibraryReady: false,
        personalSequenceLoadProgress: { loadedFrames: 0, totalFrames: 0, loadedBytes: 0, totalBytes: 0 },
        personalSequenceUploading: false,
        personalSequenceUploadError: "",
        personalSequenceUploadProgress: { percent: 0, countText: "0 / 0 帧", detail: "" },
        sequenceLibraryTab: "official",
        sequenceToolsActivated: false,
        sequenceLibrarySessionInitialized: false,
        sequenceLibraryOverlayRevealAt: 0,
        sequenceLibraryOverlayTimer: null,
        sequenceListRenderSignature: "",
        sequenceLibraryStatus: "idle",
        sequenceEditingSetId: null,
        sequencePreviewTimer: null,
        sequencePreviewBusy: false,
        sequencePreviewObserver: null,
        sequencePreviewWarmupPromise: null,
        sequencePreviewWarmupSignature: "",
        sequencePreviewWarmupGeneration: 0,
        sequencePreviewLoading: false,
        sequencePreviewLoadError: "",
        sequencePreviewLoadProgress: { loaded: 0, total: 0 },
        sequenceBinaryMemoryCache: new Map(),
        sequenceBinaryMemoryBytes: 0,
        sequenceBinaryDatabasePromise: null,
        sequenceBinaryDatabaseDisabled: false,
        sequenceBinaryObjectUrls: new Map(),
        sequenceBinaryTrimPending: false,
        sequencePersistentCacheBridgeUrl: "",
        sequencePersistentCacheBridgeOrigin: "",
        sequencePersistentCacheBridgeFrame: null,
        sequencePersistentCacheBridgeToken: "",
        sequencePersistentCacheBridgeTokenMode: "",
        sequencePersistentCacheStats: null,
        sequencePersistentCacheBridgeReady: false,
        sequencePersistentCacheBridgeFailed: false,
        sequencePersistentCacheBridgePromise: null,
        sequencePersistentCacheBridgeRequests: new Map(),
        sequenceSetUseProgress: new Map(),
        sequenceSetUsePromises: new Map(),
        sequenceContextSetId: "",
        sequenceDownloadBusy: false,
        canvasZoom: 1,
        canvasBg: "checkered-dark",
        layerDragKey: null,
        layerThumbnailLoadToken: 0,
        layerThumbnailLoadedSignature: "",
        layerEffectClipboard: null,
        layerContextMenuKey: "",
        windowSize: { width: 1120, height: 780 },
        windowMinimized:false,
        windowRestoreSize:null,
        windowRestorePlaying:false,
        resizeDrag: null,
        resizeRaf: null,
        pendingResize: null,
        canvasDrag: null,
        selectedMotionTab: "base",
        recentMotionTabByLayerKey: new Map(),
        selectedMotionType: "float",
        anchorPickType: null,
        undoStack: [],
        redoStack: [],
        undoCheckpoint: null,
        undoCheckpointTimer: null,
        historyApplying: false,
        canvasConfigLoadedKey: "",
        canvasConfigSavedVisualFingerprint: "",
        canvasConfigUnsavedVisualChanges: false,
        allowCloseWithoutPrompt: false,
        canvasConfigSaveTextTimer: null,
        canvasConfigClearTextTimer: null,
        reuseConfigSummaries: [],
        reuseConfigCache: new Map(),
        reuseConfigListScopeKey: "",
        reuseConfigListRevision: 0,
        reuseConfigBaselineProject: null,
        reuseConfigLoading: false,
        reuseConfigListRequestToken: 0,
        reuseConfigMessage: "",
        reuseConfigMessageError: false,
      };
const $ = (id) => document.getElementById(id);
const log = message => { if($('waveWebStatus'))$('waveWebStatus').textContent=message; };
const projectFps = (p=state.package?.project) => Number(p?.exportRules.fps || 24);
const projectBaseFrameCount = (p=state.package?.project) => Math.max(1,Math.round(projectFps(p)*projectDurationSeconds(p)));
const projectDurationSeconds = (p=state.package?.project) => Number(p?.exportRules.durationSeconds || 3);
const drawProjectFrameToCanvas = async (canvas,index,options={}) => drawWavePreviewFrame(canvas,index,{...options,previewToken:state.previewDrawToken,outputScale:options.outputScale||1});
async function drawWavePreviewFrame(canvas,frameIndex,options) {
 const project=options.project||state.package.project,token=options.previewToken;
 let plan=wavePreviewPlans.get(project.assets);
 if(!plan){
  const payloads=new Map(state.package.assets.map(p=>[p.key,p])),resources=new Map();
  const entries=project.assets.map(asset=>({asset,payload:payloads.get(asset.key)})).filter(item=>item.payload);
  for(const entry of entries){const key=entry.payload.svgaCacheKey||entry.payload.key;resources.set(key,entry.payload);entry.resourceKey=key;}
  const pixels=[...resources.values()].filter(p=>p.mimeType==='image/svg+xml').reduce((sum,p)=>sum+Math.ceil(p.width)*Math.ceil(p.height),0),ratio=Math.max(1,Math.min(4,Math.sqrt(4*1024*1024/Math.max(1,pixels))));
  plan={entries,ready:Promise.all([...resources].map(async([key,payload])=>[key,await wavePreviewResource(payload,ratio)])).then(rows=>new Map(rows))};wavePreviewPlans.set(project.assets,plan);
 }
 const images=await plan.ready;if(token!==state.previewDrawToken)return false;
 const ctx=canvas.getContext('2d'),scale=Number(options.outputScale)>0?Number(options.outputScale):clamp(Number(options.renderScale)||1,1,PREVIEW_MAX_RENDER_SCALE);
 const fps=Math.max(1,Math.round(Number(options.fps)||previewFps())),frames=Math.max(1,Math.round(Number(options.totalFrames)||previewFrameCount(project)));
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.__logicalRenderScale=scale;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 for(const {asset,payload,resourceKey}of plan.entries){
  if(asset.visible===false)continue;
  const sample=waveElementSample(asset,frameIndex,fps,projectDurationSeconds());if(sample.alpha<=0)continue;
  const image=images.get(resourceKey),geometry={...assetRenderGeometry(asset,payload),imageWidth:image.width||image.naturalWidth,imageHeight:image.height||image.naturalHeight},hasLegacyMotion=(asset.animations||[]).some(e=>e.enabled!==false)||asset.animation?.type&&asset.animation.type!=='none';
  const matrix=hasLegacyMotion?motionMatrixForGeometry(asset,geometry,frameIndex,frames,fps):waveApplyMotionMatrix(asset,geometry,assetStaticMatrixForGeometry(asset,geometry),frameIndex,fps);
  setScaledCanvasTransform(ctx,matrix);ctx.globalAlpha=sample.alpha;if(image.drawable)ctx.drawImage(image.drawable,0,0,image.width,image.height);else ctx.drawImage(image,0,0);
 }
 ctx.restore();return token===state.previewDrawToken;
}
const PREVIEW_MAX_RENDER_SCALE = 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const setScaledCanvasTransform = (ctx, matrix) => {
        const renderScale = Number(ctx.__logicalRenderScale) > 0 ? Number(ctx.__logicalRenderScale) : 1;
        ctx.setTransform(
          matrix.a * renderScale,
          matrix.b * renderScale,
          matrix.c * renderScale,
          matrix.d * renderScale,
          matrix.e * renderScale,
          matrix.f * renderScale,
        );
      };
const previewFps = () => projectFps();
const previewFrameCount = (p=state.package?.project) => projectBaseFrameCount(p);
const assetRenderGeometry = (asset, payloadOverride = null) => {
        const payload = payloadOverride || assetPayloadByKey(asset.key);
        const source = asset.source || {};
        const relative = source.canvasRelativeBoundingBox || {};
        const absolute = source.absoluteBoundingBox || {};
        const imageWidth = Math.max(1, Math.round(Number(payload?.width || relative.width || absolute.width || asset.width || 1)));
        const imageHeight = Math.max(1, Math.round(Number(payload?.height || relative.height || absolute.height || asset.height || 1)));
        const baseWidth = Math.max(1, Number(relative.width || asset.width || absolute.width || imageWidth));
        const baseHeight = Math.max(1, Number(relative.height || asset.height || absolute.height || imageHeight));
        const transform = normalizeAssetTransform(asset);
        const scale = Math.max(0.01, Number(transform.scale || 1));
        const scaleX = Math.max(0.01, Number(transform.scaleX || 1));
        const scaleY = Math.max(0.01, Number(transform.scaleY || 1));
        return {
          imageWidth,
          imageHeight,
          baseWidth,
          baseHeight,
          displayWidth: baseWidth * scale * scaleX,
          displayHeight: baseHeight * scale * scaleY,
          x: Number(transform.x || 0),
          y: Number(transform.y || 0),
          scale,
          scaleX,
          scaleY,
          rotate: Number(transform.rotate || 0),
        };
      };
const assetPayloadByKey = (key) => {
        const direct = state.package?.assets?.find((asset) => asset.key === key) || null;
        if (direct) return direct;
        const projectAsset = projectAssetByKey(key);
        return projectAsset?.mirrorOfKey
          ? state.package?.assets?.find((asset) => asset.key === projectAsset.mirrorOfKey) || null
          : null;
      };
const projectAssetByKey = (key, project = state.package?.project) =>
        (project?.assets || []).find((asset) => asset.key === key) || null;
const normalizeAssetTransform = (asset) => {
        asset.transform = {
          x: Number(asset.transform?.x || 0),
          y: Number(asset.transform?.y || 0),
          scale: Math.max(0.01, Number(asset.transform?.scale || 1)),
          scaleX: Math.max(0.01, Number(asset.transform?.scaleX || 1)),
          scaleY: Math.max(0.01, Number(asset.transform?.scaleY || 1)),
          rotate: Number(asset.transform?.rotate || 0),
        };
        return asset.transform;
      };
const assetStaticMatrixForGeometry = (asset, geometry) => {
        const mirrored = isGeneratedMirrorAsset(asset);
        const scaleX = geometry.displayWidth / Math.max(1, geometry.imageWidth);
        let matrix = {
          a: mirrored ? -scaleX : scaleX,
          b: 0,
          c: 0,
          d: geometry.displayHeight / Math.max(1, geometry.imageHeight),
          e: mirrored ? geometry.x + geometry.displayWidth : geometry.x,
          f: geometry.y,
        };
        const baseRotate = ((Number(asset?.transform?.rotate || 0) || 0) * Math.PI) / 180;
        if (baseRotate) {
          const center = geometryCenterPoint(geometry);
          matrix = multiplyMatrix(
            aroundPointMatrix(center.x, center.y, rotationMatrix(baseRotate)),
            matrix,
          );
        }
        return matrix;
      };
const isGeneratedMirrorAsset = (asset) =>
        Boolean(asset?.generatedMirror && asset?.mirrorOfKey);
const multiplyMatrix = (left, right) => ({
        a: left.a * right.a + left.c * right.b,
        b: left.b * right.a + left.d * right.b,
        c: left.a * right.c + left.c * right.d,
        d: left.b * right.c + left.d * right.d,
        e: left.a * right.e + left.c * right.f + left.e,
        f: left.b * right.e + left.d * right.f + left.f,
      });
const rotationMatrix = (radians) => {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
      };
const aroundPointMatrix = (x, y, matrix) =>
        multiplyMatrix(
          multiplyMatrix(translationMatrix(x, y), matrix),
          translationMatrix(-x, -y),
        );
const translationMatrix = (x, y) => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
const geometryCenterPoint = (geometry) => ({
        x: geometry.x + geometry.displayWidth / 2,
        y: geometry.y + geometry.displayHeight / 2,
      });
const motionMatrixForGeometry = (asset,geometry,index,frames,fps) => waveApplyMotionMatrix(asset,geometry,assetStaticMatrixForGeometry(asset,geometry),index,fps);
function waveApplyMotionMatrix(asset,geometry,matrix,frameIndex,fps) {
  if(!asset.waveElement)return matrix;
  const duration=projectDurationSeconds(), s=waveElementSample(asset,frameIndex,fps,duration),base=waveElementSample(asset,0,fps,duration);
  const center=geometryCenterPoint(geometry),angle=(Number(asset.transform?.rotate||0)*Math.PI/180)+(s.angle-base.angle);
  let delta=aroundPointMatrix(center.x,center.y,rotationMatrix(s.angle-base.angle));
  const stretch=asset.waveElement.config.type==='point'||asset.waveElement.ringPath||asset.waveElement.bitmapRing?scaleMatrix(s.scale):{a:s.scale,b:0,c:0,d:1,e:0,f:0};
  const oriented=multiplyMatrix(rotationMatrix(angle),multiplyMatrix(stretch,rotationMatrix(-angle)));
  delta=multiplyMatrix(aroundPointMatrix(center.x,center.y,oriented),delta);
  return multiplyMatrix(translationMatrix(s.x-base.x,s.y-base.y),multiplyMatrix(delta,matrix));
}
const scaleMatrix = (value) => ({ a: value, b: 0, c: 0, d: value, e: 0, f: 0 });
function waveElementSample(asset, frameIndex, fps, duration) {
  const e=asset.waveElement;
  if (!e) return {x:0,y:0,angle:0,scale:1,alpha:1};
  const c=e.config, flags=c.motionFlags || {}, t=((frameIndex / Math.max(1,fps) / Math.max(.001,duration))%1+1)%1;
  const cycle=t*c.speed, phase=e.layer/c.layers;
  const p=((phase+(flags.diffuse?cycle:0))%1+1)%1;
  const breath=(Math.sin(2*Math.PI*(cycle+phase+e.index/c.density))+1)/2;
  const radius=e.inner+(e.outer-e.inner)*(flags.diffuse?p:(e.layer+.5)/c.layers);
  const angle=e.index/c.density*2*Math.PI+c.rotation*Math.PI/180;
  const point=e.bitmapRing ? {x:0,y:0} : wavePathPoint(angle,radius,c.pattern==='ring'?c.shape:'circle');
  if(e.centerOffset){point.x+=e.centerOffset.x*radius/e.baseRadius;point.y+=e.centerOffset.y*radius/e.baseRadius;}
  // Rotate the whole path (including square/star/heart), retaining its shape.
  const spin=c.rotate?t*2*Math.PI*c.speed:0;
  const shake=flags.vibrate?Math.sin(2*Math.PI*cycle*8)*(c.type==='line'?c.thickness:1):0;
  return {x:e.centerX+point.x*Math.cos(spin)-point.y*Math.sin(spin)+shake,y:e.centerY+point.x*Math.sin(spin)+point.y*Math.cos(spin)+shake*.5,
    angle:angle+spin,scale:e.ringPath ? 1 : (e.bitmapRing ? radius/e.baseRadius : 1)*((flags.stream?.25+.75*breath:1)*(flags.pulse?.7+.3*breath:1)),
    alpha:c.opacity*(flags.tracer?.3+.7*((Math.sin(2*Math.PI*(cycle+e.index/c.density))+1)/2):1)*(flags.diffuse?Math.pow(Math.max(0,Math.sin(Math.PI*p)),c.attenuation):!e.ringPath&&(flags.stream||flags.pulse)?.4+.6*breath:1)};
}
function wavePathPoint(angle, radius, shape) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  if (shape === 'square') { const s = radius / Math.max(Math.abs(cos), Math.abs(sin)); return {x:cos*s,y:sin*s}; }
  if (shape === 'diamond') { const s = radius / (Math.abs(cos)+Math.abs(sin)); return {x:cos*s,y:sin*s}; }
  if (shape === 'star') {
    const n = ((angle / (2*Math.PI)*10)%10+10)%10, i = Math.floor(n), t = n-i;
    const point = j => {const a=j*Math.PI/5-Math.PI/2,r=radius*(j%2===0?1:.5);return {x:Math.cos(a)*r,y:Math.sin(a)*r};};
    const a=point(i),b=point(i+1);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  }
  if (shape === 'heart') return {x:radius*Math.pow(sin,3),y:-radius*(13*cos-5*Math.cos(2*angle)-2*Math.cos(3*angle)-Math.cos(4*angle))/18};
  return {x:cos*radius,y:sin*radius};
}
const wavePreviewPlans=new WeakMap();
function wavePreviewResource(payload,ratio){
 const key=(payload.svgaCacheKey||payload.key)+':'+ratio.toFixed(3),cached=wavePreviewResourceCache.get(key);
 if(cached&&cached.url===payload.dataUrl){wavePreviewResourceCache.delete(key);wavePreviewResourceCache.set(key,cached);return cached.promise;}
 const entry={url:payload.dataUrl,pixels:0};entry.promise=loadPreviewImage(payload).then(image=>{
  if(payload.mimeType!=='image/svg+xml')return image;
  const raster=document.createElement('canvas');raster.width=Math.max(1,Math.ceil(image.naturalWidth*ratio));raster.height=Math.max(1,Math.ceil(image.naturalHeight*ratio));raster.getContext('2d').drawImage(image,0,0,raster.width,raster.height);
  entry.pixels=raster.width*raster.height;
  if(wavePreviewResourceCache.get(key)===entry){wavePreviewResourcePixels+=entry.pixels;
  while(wavePreviewResourceCache.size>1024||wavePreviewResourcePixels>4*1024*1024){const oldest=wavePreviewResourceCache.keys().next().value;if(oldest===undefined)break;wavePreviewResourcePixels-=wavePreviewResourceCache.get(oldest).pixels;wavePreviewResourceCache.delete(oldest);}}
  return{drawable:raster,width:image.naturalWidth,height:image.naturalHeight};
 }).catch(error=>{if(wavePreviewResourceCache.get(key)===entry){wavePreviewResourceCache.delete(key);wavePreviewResourcePixels-=entry.pixels;}throw error;});
 if(cached)wavePreviewResourcePixels-=cached.pixels;wavePreviewResourceCache.set(key,entry);return entry.promise;
}
const loadPreviewImage = (payload) => {
        if(payload?.drawable)return Promise.resolve(payload.drawable);
        if (!payload?.dataUrl) return Promise.reject(new Error("缺少图片数据。"));
        const imageCache = state.pagExportImageCache || state.previewImageCache;
        const cacheKey=payload.svgaCacheKey || payload.key;
        const cacheLimit = state.pagExportImageCache ? 24 : PREVIEW_IMAGE_CACHE_LIMIT;
        const cacheBytes = state.pagExportImageCache ? 8 * 1024 * 1024 : PREVIEW_IMAGE_CACHE_MAX_BYTES;
        const cached = cacheGetRecent(imageCache, cacheKey);
        if (cached && cached.src === payload.dataUrl) return cached.promise;
        const entry = {
          src: payload.dataUrl,
          width: Math.max(0, Math.round(Number(payload.width) || 0)),
          height: Math.max(0, Math.round(Number(payload.height) || 0)),
          promise: null,
        };
        const promise = new Promise((resolve, reject) => {
          const img = new Image();
          if (/^https?:\/\//i.test(payload.dataUrl)) img.crossOrigin = "anonymous";
          img.onload = () => {
            entry.width = Math.max(entry.width, Math.round(Number(img.naturalWidth || img.width) || 0));
            entry.height = Math.max(entry.height, Math.round(Number(img.naturalHeight || img.height) || 0));
            if (imageCache.get(cacheKey) === entry) {
              cacheSetLimited(
                imageCache,
                cacheKey,
                entry,
                cacheLimit,
                cacheBytes,
              );
            }
            resolve(img);
          };
          img.onerror = () => {
            if (imageCache.get(cacheKey) === entry) {
              imageCache.delete(cacheKey);
            }
            reject(new Error("预览图片加载失败。"));
          };
          img.src = payload.dataUrl;
        });
        entry.promise = promise;
        cacheSetLimited(
          imageCache,
          cacheKey,
          entry,
          cacheLimit,
          cacheBytes,
        );
        return promise;
      };
const cacheGetRecent = (cache, key) => {
        if (!cache?.has?.(key)) return null;
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value);
        return value;
      };
const cacheSetLimited = (cache, key, value, limit, maxBytes = Number.POSITIVE_INFINITY) => {
        if (!cache) return;
        const metadata = cacheMetadata(cache);
        if (metadata.weights.has(key)) {
          metadata.bytes -= metadata.weights.get(key) || 0;
          metadata.weights.delete(key);
        }
        if (cache.has(key)) cache.delete(key);
        cache.set(key, value);
        const weight = estimateCacheValueBytes(value);
        metadata.weights.set(key, weight);
        metadata.bytes += weight;
        const maxSize = Math.max(1, Math.round(Number(limit) || 1));
        const byteLimit = Math.max(1, Number(maxBytes) || Number.POSITIVE_INFINITY);
        while (cache.size > maxSize || metadata.bytes > byteLimit) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey == null) break;
          metadata.bytes -= metadata.weights.get(oldestKey) || 0;
          metadata.weights.delete(oldestKey);
          cache.delete(oldestKey);
        }
      };
const estimateCacheValueBytes = (value) => {
        if (!value || typeof value !== "object") return 0;
        const dataUrl = String(value.dataUrl || value.src || "");
        const width = Math.max(0, Math.round(Number(value.width || value.canvas?.width) || 0));
        const height = Math.max(0, Math.round(Number(value.height || value.canvas?.height) || 0));
        const vectorBytes = Number(value.vectorData?.byteLength || 0);
        return dataUrl.length + width * height * 4 + vectorBytes;
      };
const cacheMetadata = (cache) => {
        let metadata = boundedCacheMetadata.get(cache);
        if (!metadata || metadata.weights.size !== cache.size) {
          metadata = { bytes: 0, weights: new Map() };
          for (const [entryKey, entryValue] of cache || []) {
            const weight = estimateCacheValueBytes(entryValue);
            metadata.weights.set(entryKey, weight);
            metadata.bytes += weight;
          }
          boundedCacheMetadata.set(cache, metadata);
        }
        return metadata;
      };
const boundedCacheMetadata = new WeakMap();
const PREVIEW_IMAGE_CACHE_LIMIT = 240;
const PREVIEW_IMAGE_CACHE_MAX_BYTES = 128 * 1024 * 1024;
const wavePreviewResourceCache=new Map();
let wavePreviewResourcePixels=0;
const togglePreviewPlayback = () => {state.previewPlaying?stopPreviewPlayback():startPreviewPlayback();renderWavePanel();};
const stopPreviewPlayback = () => {state.previewPlaying=false;cancelAnimationFrame(webPlaybackFrame);};
let webPlaybackStart=0,webPlaybackFrame=0;
const startPreviewPlayback = () => {if(state.previewPlaying||state.busy)return;state.previewPlaying=true;webPlaybackStart=performance.now()-state.previewFrame/previewFps()*1000;
 const tick=now=>{if(!state.previewPlaying)return;const frame=Math.floor((now-webPlaybackStart)/1000*previewFps())%previewFrameCount();if(frame!==state.previewFrame){state.previewFrame=frame;void renderPreview(frame);}webPlaybackFrame=requestAnimationFrame(tick);};webPlaybackFrame=requestAnimationFrame(tick);
};
const renderPreview = async index => {
 if(webDrawInFlight){webDrawPending=index;return;}webDrawInFlight=true;
 try{
  const canvas=$('previewCanvas'),project=state.package?.project;if(!project)return;
  const viewport=$('stageViewport').getBoundingClientRect();const scale=Math.max(.1,Math.min((viewport.width-48)/project.canvas.width,(viewport.height-48)/project.canvas.height,2));
  canvas.width=Math.round(project.canvas.width*scale);canvas.height=Math.round(project.canvas.height*scale);
  $('canvasFrame').style.width=canvas.width+'px';$('canvasFrame').style.height=canvas.height+'px';
  await drawProjectFrameToCanvas(canvas,index,{outputScale:scale});
 }finally{webDrawInFlight=false;if(webDrawPending!==null){const frame=webDrawPending;webDrawPending=null;void renderPreview(frame);}}
};
let webDrawInFlight=false,webDrawPending=null;
function renderWavePanel() {
 if(!$('waveCompositionList')||!isWaveProject())return;
 const layers=waveLayers(),layer=activeWaveLayer(),c=layer.config;waveSelectedLayer=layer.id;
 $('wave_length').closest('label').querySelector('span').firstChild.textContent=c.type==='line'?'分段长度':'构件大小';
 const bitmapRing=!!layer.bitmap&&c.type==='line'&&c.pattern==='ring',vectorRing=!layer.bitmap&&c.type==='line'&&c.pattern==='ring';
 const showSlider=(key,show)=>{$('wave_'+key).closest('label').hidden=!show;};
 showSlider('thickness',c.type==='line'&&(!layer.bitmap||c.pattern==='emit'));$('wave_thickness').closest('label').querySelector('span').firstChild.textContent=layer.bitmap?'构件高度':'线条粗细';showSlider('density',!bitmapRing);showSlider('length',!bitmapRing);
 showSlider('attenuation',!!c.motionFlags.diffuse);
 showSlider('speed',Object.entries(c.motionFlags).some(([key,on])=>on&&(!vectorRing||!['stream','pulse'].includes(key))));
 for(const key of ['stream','pulse'])document.querySelector('[data-wave-motion="'+key+'"]').hidden=key==='stream'||vectorRing;
 const shapeGroup=document.querySelector('[data-wave-group="shape"]').closest('section');shapeGroup.hidden=!!layer.bitmap||(c.type==='line'&&c.pattern==='emit');
 const colorDisabled=!!layer.bitmap;document.querySelector('[data-wave-group="colorType"]').closest('section').hidden=colorDisabled;$('waveColors').closest('section').hidden=colorDisabled;$('waveQuickColor').hidden=colorDisabled;
 const colorPanel=$('wavePanelColor');let bitmapNote=$('waveBitmapColorNote');if(!bitmapNote){bitmapNote=document.createElement('p');bitmapNote.id='waveBitmapColorNote';bitmapNote.className='wave-section wave-note';bitmapNote.textContent='自定义构件保留原图颜色，可在形态中更换图片。';colorPanel.append(bitmapNote);}bitmapNote.hidden=!colorDisabled;

 for(const button of document.querySelectorAll('[data-wave-key]'))button.setAttribute('aria-pressed',String(c[button.dataset.waveKey]===button.dataset.waveValue));
 for(const button of document.querySelectorAll('[data-wave-motion]'))button.setAttribute('aria-pressed',String(!!c.motionFlags?.[button.dataset.waveMotion]));
 for(const [key] of waveSliders){const number=$('wave_number_'+key);if(document.activeElement!==number)number.value=Number((c[key]*(['length','holeRadius','opacity'].includes(key)?100:1)).toFixed(2));const input=$('wave_'+key);input.style.setProperty('--wave-progress',((c[key]-Number(input.min))/(Number(input.max)-Number(input.min))*100)+'%');if(document.activeElement!==input)input.value=c[key];$('wave_value_'+key).textContent=['length','holeRadius','opacity','speed'].includes(key)?Math.round(c[key]*100)+'%':key==='rotation'?c[key]+'°':c[key];}
 const colors=$('waveColors');if(colors.children.length!==c.colors.length){colors.replaceChildren();c.colors.forEach((color,i)=>{const input=document.createElement('input');input.type='color';input.dataset.waveColor=String(i+1);input.setAttribute('aria-label','颜色 '+(i+1));colors.append(input);});}c.colors.forEach((color,i)=>{if(document.activeElement!==colors.children[i])colors.children[i].value=color;});
 $('waveBitmapSummary').hidden=!layer.bitmap;if(layer.bitmap)$('waveBitmapThumb').src=layer.bitmap.dataUrl;
 const layerSelect=$('waveActiveLayer'),names=JSON.stringify(layers.map(l=>[l.id,l.name]));
 if(layerSelect.dataset.names!==names){layerSelect.replaceChildren(...layers.map(l=>new Option(l.name,l.id)));layerSelect.dataset.names=names;}if(layerSelect.value!==layer.id)layerSelect.value=layer.id;
 const list=$('waveCompositionList'),scrollTop=list.scrollTop,keys=new Set(layers.map(l=>l.id));
 for(const card of [...list.children])if(!keys.has(card.dataset.waveLayer))card.remove();
 layers.forEach((l,i)=>{
  let card=[...list.children].find(card=>card.dataset.waveLayer===l.id);
  if(!card){card=document.createElement('div');card.className='wave-layer-card';card.dataset.waveLayer=l.id;card.draggable=true;card.tabIndex=0;card.innerHTML='<strong></strong><small></small><div class="wave-layer-actions"></div>';
   const name=card.querySelector('strong');name.ondblclick=e=>{e.stopPropagation();const current=waveLayers().find(layer=>layer.id===l.id),title=prompt('图层名称',current.name);if(title)changeWaveComposition(()=>current.name=title.slice(0,50));};
   [['visible','◉','显示或隐藏'],['up','↑','上移'],['down','↓','下移'],['delete','×','删除']].forEach(([action,label,title])=>{const button=document.createElement('button');button.dataset.waveAction=action;button.textContent=label;button.title=title;button.setAttribute('aria-label',title);card.querySelector('.wave-layer-actions').append(button);});
   card.onkeydown=e=>{if(e.key==='Enter'){waveSelectedLayer=l.id;renderWavePanel();}};
  }
  if(list.children[i]!==card)list.insertBefore(card,list.children[i]||null);
  const selected=l.id===layer.id;if(card.classList.contains('active')!==selected)card.classList.toggle('active',selected);
  card.dataset.hidden=String(l.visible===false);card.setAttribute('aria-label',l.name);
  const name=card.querySelector('strong'),text='⠿ '+l.name;if(name.textContent!==text)name.textContent=text;
  const info=card.querySelector('small'),summary=(l.config.type==='line'?'流光线条':'散点构件')+' · '+(l.config.pattern==='ring'?'闭环圆周':'中心迸发')+' · '+l.config.density;if(info.textContent!==summary)info.textContent=summary;
  const thumbKey=waveGeometryKey(l.config);if(card.dataset.thumb!==thumbKey||card._waveBitmap!==l.bitmap){const thumb=waveLayerThumbnail(l);if(card.querySelector('canvas'))card.querySelector('canvas').replaceWith(thumb);else card.prepend(thumb);card.dataset.thumb=thumbKey;card._waveBitmap=l.bitmap;}
  for(const button of card.querySelectorAll('[data-wave-action]')){const action=button.dataset.waveAction;button.disabled=state.busy||(action==='delete'&&layers.length===1)||(action==='up'&&i===0)||(action==='down'&&i===layers.length-1);if(action==='visible'){const label=l.visible!==false?'◉':'○';if(button.textContent!==label)button.textContent=label;}}
 });
 list.scrollTop=scrollTop;if(list.dataset.selected!==layer.id){list.querySelector('.active')?.scrollIntoView({block:'nearest',inline:'nearest'});list.dataset.selected=layer.id;}
 if(document.activeElement!==$('waveQuickColor'))$('waveQuickColor').value=c.colors[0];
 $('wavePlayBtn').textContent=state.previewPlaying?'Ⅱ 暂停':'▶ 播放';
 $('waveLayerCount').textContent=layers.length+' / 10';$('waveAddLayer').disabled=state.busy||layers.length>=10;$('waveAvatar').hidden=!waveAvatarVisible;$('waveAvatarBtn').setAttribute('aria-pressed',String(waveAvatarVisible));
 for(const control of document.querySelectorAll('.wave-left select,.wave-left input,.wave-left button,.wave-presets button,.wave-presets select,.wave-stage-controls button'))control.disabled=state.busy;
 $('waveUndoBtn').disabled=state.busy||!state.undoStack.length;$('waveRedoBtn').disabled=state.busy||!state.redoStack.length;
}
function isWaveProject(project=state.package?.project) { return project?.metadata?.sourceMode==='wave'; }
let waveSelectedLayer=null, waveAvatarVisible=true;
function waveLayers() {
 if(!isWaveProject())return [];
 const m=state.package.project.metadata;
 if(!Array.isArray(m.waveLayers)||!m.waveLayers.length)m.waveLayers=[newWaveLayer(m.waveGenerator,waveBitmapPayload())];
 return m.waveLayers;
}
function waveBitmapPayload(){
 const layers=state.package?.project?.metadata?.waveLayers;
 if(layers?.length)return(layers.find(l=>l.id===waveSelectedLayer)||layers[0]).bitmap||null;
 const keys=new Set((state.package?.project?.assets||[]).filter(a=>a.waveElement).map(a=>a.key));
 return state.package?.assets?.find(p=>p.mimeType==='image/png'&&keys.has(p.key))||null;
}
function newWaveLayer(config={color:'#a78bfa',motion:'diffuse'},bitmap=null) {return {id:'wl_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),name:'图层 '+((state.package?.project?.metadata?.waveLayers?.length||0)+1),config:normalizeWaveConfig(config),bitmap,visible:true};}
function normalizeWaveConfig(input = {}) {
  if (!input || typeof input !== "object") input = {};
  const number = (key, fallback, min, max, integer = false) => {
    const value = Number(input[key]);
    const safe = Math.max(min, Math.min(max, Number.isFinite(value) ? value : fallback));
    return integer ? Math.round(safe) : safe;
  };
  const choice = (key, values, fallback) => values.includes(input[key]) ? input[key] : fallback;
  return {
    type: choice('type', ['line', 'point'], 'line'), pattern: choice('pattern', ['ring', 'emit'], 'ring'),
    shape: choice('shape', ['circle', 'square', 'diamond', 'star', 'heart'], 'circle'),
    motion: choice('motion', ['stream', 'diffuse', 'pulse'], 'diffuse'),
    density: number('density', 32, 1, 48, true), layers: number('layers', 4, 1, 4, true),
    length: number('length', .25, .01, 2), thickness: number('thickness', 2.4, .1, 5),
    holeRadius: number('holeRadius', .5, 0, .95), speed: number('speed', 1, .1, 2),
    attenuation: number('attenuation', 1, .1, 8), opacity: number('opacity', input.globalOpacity ?? 1, 0, 1),
    rotation: number('rotation', 0, 0, 360), rotate: input.rotate === true || input.motionFlags?.rotate === true,
    motionFlags: Object.fromEntries(['stream','diffuse','rotate','tracer','vibrate','pulse'].map(key=>[key,key==='stream'?false:input.motionFlags ? (key==='pulse'?(input.motionFlags.pulse===true||input.motionFlags.stream===true):input.motionFlags[key] === true) : key==='stream'?choice('motion',['stream','diffuse','pulse'],'diffuse')==='stream':key==='diffuse'?choice('motion',['stream','diffuse','pulse'],'diffuse')==='diffuse':key==='pulse'?input.motion === 'pulse'||input.motion === 'stream':key==='rotate'?input.rotate === true:false])),
    colorType: choice('colorType', ['solid','radial','quad'], 'solid'),
    colors: (Array.isArray(input.colors) && input.colors.length ? input.colors : [input.color || '#62f4b5']).slice(0,4).map(v=>/^#[\da-f]{6}$/i.test(v)?v:'#62f4b5'),
    color: /^#[\da-f]{6}$/i.test(input.color || '') ? input.color : '#62f4b5',
  };
}
function activeWaveLayer() {const layers=waveLayers();return layers.find(l=>l.id===waveSelectedLayer)||layers[0];}
function waveGeometryKey(config) {return JSON.stringify([config.type,config.pattern,config.shape,config.density,config.layers,config.length,config.thickness,config.holeRadius,config.rotation,config.colorType,config.colors]);}
function changeWaveComposition(change) {
 if(state.busy||!isWaveProject())return false;
 holdUndoCheckpoint('声波参数',{includeAssetPayloads:true});
 try{change();rebuildWaveComposition();renderWavePanel();renderPreview(state.previewFrame);return true;}finally{if(!waveInputGesture){commitUndoCheckpoint();updateWaveHistoryButtons();}}
}
function commitUndoCheckpoint(){if(!waveUndoBefore)return;if(JSON.stringify(waveUndoBefore)!==JSON.stringify(publicWaveSnapshot())){state.undoStack.push(waveUndoBefore);if(state.undoStack.length>50)state.undoStack.shift();state.redoStack=[];}waveUndoBefore=null;updateWaveHistoryButtons();}
let waveUndoBefore=null;
function publicWaveSnapshot(){return structuredClone({canvas:state.package.project.canvas,rules:state.package.project.exportRules,layers:waveLayers(),selected:waveSelectedLayer});}
function updateWaveHistoryButtons(){if(!$('waveUndoBtn'))return;$('waveUndoBtn').disabled=state.busy||!state.undoStack.length;$('waveRedoBtn').disabled=state.busy||!state.redoStack.length;}
function holdUndoCheckpoint(){if(!waveUndoBefore)waveUndoBefore=publicWaveSnapshot();}
let waveInputGesture=false;
function rebuildWaveComposition() {
 const p=state.package.project,assets=[],payloads=[];
 for(const layer of [...waveLayers()].reverse()) {
  const c=normalizeWaveConfig(layer.config),signature=waveGeometryKey(c)+':'+p.canvas.width+':'+p.canvas.height;
  let entry=waveLayerBuildCache.get(layer);
  if(!entry||entry.signature!==signature||entry.bitmap!==layer.bitmap){
   const pack=buildWavePackage(c,layer.bitmap,p.canvas);
   for(const asset of pack.project.assets){asset.key=layer.id+'_'+asset.key;asset.waveLayerId=layer.id;}
   for(const payload of pack.assets)payload.key=layer.id+'_'+payload.key;
   entry={signature,bitmap:layer.bitmap,assets:pack.project.assets,payloads:pack.assets,config:pack.project.metadata.waveGenerator};waveLayerBuildCache.set(layer,entry);
  }else if(entry.config!==layer.config){
   for(const asset of entry.assets){const before=waveElementSample(asset,0,24,3);asset.waveElement.config=c;const after=waveElementSample(asset,0,24,3);asset.transform.x+=after.x-before.x;asset.transform.y+=after.y-before.y;}
   entry.config=c;
  }
  layer.config=entry.config;for(const asset of entry.assets)asset.visible=layer.visible!==false;
  assets.push(...entry.assets);payloads.push(...entry.payloads);
 }
 if(!p.assets||p.assets.length!==assets.length||p.assets.some((a,i)=>a!==assets[i]))p.assets=assets;
 if(!state.package.assets||state.package.assets.length!==payloads.length||state.package.assets.some((a,i)=>a!==payloads[i]))state.package.assets=payloads;
 p.metadata.waveGenerator=activeWaveLayer().config;state.package.summary.layerCount=assets.length;
}
function buildWavePackage(input = {}, bitmap = null, canvas = {width:300,height:300}) {
  const c=normalizeWaveConfig(input), size=Math.min(canvas.width,canvas.height), length=size*c.length*.45;
  const width=c.type==='line'?length:Math.max(.1,size*.05*c.length), height=c.thickness;
  const shapeExtent=c.shape==='square'?Math.SQRT2:c.shape==='heart'?1.15:1;
  const outer=Math.max(size*.1,(size*.46-(bitmap&&c.type==='line'&&c.pattern==='ring'?0:width*.5))/(c.pattern==='ring'&&!bitmap?shapeExtent:1)),inner=Math.min(size*.5*c.holeRadius,outer*.85);
  const pointPath=wavePointPath(width,c.shape);
  const path=c.type==='line'?`M0 0H${width}V${height}H0Z`: pointPath;
  const materialHeight=c.type==='point'?width:height;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${materialHeight}" viewBox="0 0 ${width} ${materialHeight}"><path d="${path}" fill="${c.color}"/></svg>`;
  const dataUrl=bitmap?.dataUrl || 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const payloads=[],assets=[], cacheKey='wave_resource_'+dataUrlSignatureForWave(dataUrl);
  for(let l=0;l<c.layers;l++)for(let i=0;i<(bitmap&&c.type==='line'&&c.pattern==='ring'?1:c.density);i++){
    const color=waveComponentColor(c,l,i);
    const key=`wave_${l}_${i}`, e={config:c,index:i,layer:l,centerX:canvas.width/2,centerY:canvas.height/2,inner,outer};
    let localWidth=width,localHeight=materialHeight,localDataUrl=bitmap?dataUrl:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.replace(c.color,color)),tilt=null;
    const baseRadius=inner+(outer-inner)*(l+.5)/c.layers;
    if(c.type==='line'&&c.pattern==='ring'){
      e.baseRadius=baseRadius;
      if(bitmap){e.bitmapRing=true;localWidth=baseRadius*2;localHeight=localWidth;}
      else {
        e.ringPath=true;const angle=i/c.density*2*Math.PI+c.rotation*Math.PI/180,templateAngle=c.shape==='circle'?0:angle;
        const half=Math.PI/c.density*(.2+.75*c.length/.6),points=Array.from({length:9},(_,n)=>wavePathPoint(templateAngle-half+n*half/4,baseRadius,c.shape));
        const minX=Math.min(...points.map(p=>p.x))-c.thickness,minY=Math.min(...points.map(p=>p.y))-c.thickness;
        localWidth=Math.max(...points.map(p=>p.x))-minX+c.thickness;localHeight=Math.max(...points.map(p=>p.y))-minY+c.thickness;
        const mid=wavePathPoint(templateAngle,baseRadius,c.shape),dx=minX+localWidth/2-mid.x,dy=minY+localHeight/2-mid.y;
        if(c.shape==='circle'){tilt=angle;e.centerOffset={x:dx*Math.cos(angle)-dy*Math.sin(angle),y:dx*Math.sin(angle)+dy*Math.cos(angle)};}
        else {tilt=0;e.centerOffset={x:dx,y:dy};}
        const d=points.map((p,n)=>(n?'L':'M')+(p.x-minX)+' '+(p.y-minY)).join('');
        const arc='<svg xmlns="http://www.w3.org/2000/svg" width="'+localWidth+'" height="'+localHeight+'"><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+c.thickness+'" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        localDataUrl='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(arc);
      }
    }
    const a={key,name:`声波 ${l+1}·${i+1}`,label:`声波 ${l+1}·${i+1}`,type:bitmap?'image':'vector',visible:true,
      width:localWidth,height:localHeight,fit:'none',animation:{type:'none'},animations:[],waveElement:e,
      source:{vectorPathPreserved:!bitmap},transform:{x:0,y:0,scale:1,rotate:0}};
    const s=waveElementSample(a,0,24,3);a.transform.x=s.x-localWidth/2;a.transform.y=s.y-localHeight/2;a.transform.rotate=(tilt??s.angle)*180/Math.PI;
    assets.push(a);payloads.push({key,file:`assets/${key}.${bitmap?'png':'svg'}`,mimeType:bitmap?'image/png':'image/svg+xml',
      width:bitmap?.width||localWidth,height:bitmap?.height||localHeight,dataUrl:localDataUrl,svgaCacheKey:localDataUrl===dataUrl?cacheKey:'wave_resource_'+dataUrlSignatureForWave(localDataUrl)});
  }
  return {project:{schemaVersion:'svga-vap-lab-project/v1',createdBy:'figma-plugin:svga-editor',materialType:'wave',canvas:{...canvas},assets,effects:[],sequenceSets:[],
    exportRules:{fps:24,frames:72,durationSeconds:3,svgaQuality:'high',exportSize:'1x',exportScale:1},
    layoutRules:{preserveCanvasPlacement:true},metadata:{sourceMode:'wave',sourceCanvasName:'生成声波',waveGenerator:c}},
    assets:payloads,summary:{layerCount:assets.length,canvasWidth:canvas.width,canvasHeight:canvas.height}};
}
function dataUrlSignatureForWave(url) { let hash=2166136261;for(let i=0;i<url.length;i++)hash=Math.imul(hash^url.charCodeAt(i),16777619);return (hash>>>0).toString(16); }
function wavePointPath(size,shape) {
 const points=Array.from({length:shape==='circle'?32:shape==='heart'?40:shape==='star'?10:4},(_,i)=>{const count=shape==='circle'?32:shape==='heart'?40:shape==='star'?10:4;const p=wavePathPoint(i/count*2*Math.PI+(shape==='square'?Math.PI/4:0),size/2,shape);return {x:p.x+size/2,y:p.y+size/2};});
 return points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('')+'Z';
}
function waveComponentColor(c,layer,index) {
 const colors=c.colors||[c.color];if(c.colorType==='solid'||colors.length===1)return colors[0];
 const t=c.colorType==='quad'?index/c.density*4:layer/Math.max(1,c.layers-1)*(colors.length-1),n=Math.floor(t),fraction=t-n;
 const a=colors[n%colors.length],b=colors[(n+1)%colors.length];return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-fraction)+parseInt(b.slice(i,i+2),16)*fraction).toString(16).padStart(2,'0')).join('');
}
const waveLayerBuildCache=new WeakMap();
const waveSliders=[['layers','波纹圈数',1,4,1],['density','每圈数量',1,48,1],['thickness','线条粗细',.1,5,.1],['length','分段长度 / 构件大小',.01,2,.01],['holeRadius','内径大小',0,.95,.05],['attenuation','扩散消隐',.1,8,.1],['rotation','整体旋转',0,360,1],['opacity','图层透明度',0,1,.05],['speed','动画速度',.1,2,.1]];
function waveLayerThumbnail(layer) {
 const canvas=document.createElement('canvas');canvas.width=canvas.height=60;const ctx=canvas.getContext('2d'),c=layer.config;
 ctx.strokeStyle=c.colors[0];ctx.fillStyle=c.colors[0];ctx.lineWidth=.7;
 const assets=state.package.project.assets.filter(a=>a.waveLayerId===layer.id);const size=Math.min(state.package.project.canvas.width,state.package.project.canvas.height);
 for(const a of assets){const sample=waveElementSample(a,13,24,3);ctx.globalAlpha=sample.alpha;const x=30+(sample.x-a.waveElement.centerX)/size*56,y=30+(sample.y-a.waveElement.centerY)/size*56;ctx.beginPath();if(c.type==='point'){ctx.arc(x,y,Math.max(.3,a.width/size*28),0,2*Math.PI);ctx.fill();}else if(a.waveElement.bitmapRing){ctx.arc(30,30,a.width/size*28,0,2*Math.PI);ctx.stroke();}else{ctx.moveTo(x-Math.cos(sample.angle)*1.5,y-Math.sin(sample.angle)*1.5);ctx.lineTo(x+Math.cos(sample.angle)*1.5,y+Math.sin(sample.angle)*1.5);ctx.stroke();}}
 return canvas;
}
const setPreviewSpacePressed = () => {};
function undoProjectEdit(){if(state.busy||!state.undoStack.length)return;state.redoStack.push(publicWaveSnapshot());publicRestoreWaveSnapshot(state.undoStack.pop());updateWaveHistoryButtons();}
function publicRestoreWaveSnapshot(snapshot){const p=state.package.project;p.canvas=snapshot.canvas;p.exportRules=snapshot.rules;p.metadata.waveLayers=snapshot.layers;waveSelectedLayer=snapshot.selected;rebuildWaveComposition();renderWavePanel();void renderPreview(state.previewFrame);}
function redoProjectEdit(){if(state.busy||!state.redoStack.length)return;state.undoStack.push(publicWaveSnapshot());publicRestoreWaveSnapshot(state.redoStack.pop());updateWaveHistoryButtons();}
const downloadBytes = (filename, mimeType, bytes) => {
        const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mimeType });
        if (state.exportModalOwner === "export") setExportModalProgress(1);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        try { a.click(); } finally {
          // Let the Figma/browser download handler acquire the Blob before releasing it.
          window.setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 60000);
        }
      };
const setExportModalProgress = (progress = null) => {
        const track = $("exportModalProgress");
        const bar = $("exportModalProgressBar");
        if (!track || !bar) return;
        const exportOnly = state.exportModalOwner === "export";
        let value = progress == null ? (exportOnly ? state.exportProgressValue || 0 : null) : clamp(Number(progress) || 0, 0, 1);
        if (exportOnly) { value = Math.max(state.exportProgressValue || 0, value || 0); state.exportProgressValue = value; }
        const percent = exportOnly ? Math.floor((value || 0) * 100) : Math.round((value || 0) * 100);
        track.hidden = value == null;
        track.setAttribute("aria-valuenow", String(percent));
        bar.style.width = `${percent}%`;
        $("exportModalPercent").hidden = !exportOnly && state.exportModalOwner !== "svga-import";
        $("exportModalPercent").textContent = `${percent}%`;
      };
const returnSvgaFeatureWorkspace = () => {};
async function uploadWaveBitmap() {
 const file=$('waveBitmapInput').files?.[0];$('waveBitmapInput').value='';if(!file||state.busy||!isWaveProject())return;
 const pkg=state.package,layerId=activeWaveLayer().id;setBusy(true);
 try {
  if(file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('请选择不超过 5 MB 的 PNG、JPEG 或 WebP。');
  const image=await loadPreviewImage({key:'wave_upload_'+Date.now(),dataUrl:await fileToDataUrl(file)});
  const ratio=Math.min(1,256/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  if(state.package!==pkg)return;setBusy(false);
  changeWaveComposition(()=>{const layer=waveLayers().find(l=>l.id===layerId);if(layer)layer.bitmap={dataUrl:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height,mimeType:'image/png'};});
 }catch(error){log(error.message);}finally{setBusy(false);}
}
const setBusy = busy => {
 state.busy=busy;
 document.querySelectorAll('[data-wave-web-export]').forEach(button=>button.disabled=busy);
};
const fileToDataUrl = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("素材读取失败。"));
          reader.readAsDataURL(file);
        });
async function saveWaveProject() {
  if(state.busy || !isWaveProject())return;
  const bytes=new TextEncoder().encode(JSON.stringify(waveProjectDocument()));
  downloadBytes('声波.wave-project.json','application/json',bytes);markCanvasVisualConfigSaved();setSaveConfigButtonFeedback('已保存');
}
const markCanvasVisualConfigSaved = () => {};
const setSaveConfigButtonFeedback = () => {};
function waveProjectDocument() {commitUndoCheckpoint();return {schema:'svga-editor-wave-project/v1',package:{...state.package,assets:svgaPackAssetPayloads(state.package.assets)}};}
function svgaPackAssetPayloads(payloads) {
  const resources=[],indices=new Map();
  const entries=payloads.map(payload=>{
    const {dataUrl,...metadata}=payload;
    let resourceIndex=indices.get(dataUrl);
    if(resourceIndex==null){resourceIndex=resources.length;indices.set(dataUrl,resourceIndex);resources.push(dataUrl);}
    return {metadata,resourceIndex};
  });
  return {schema:'svga-payloads/v1',entries,resources};
}
function beginWaveGesture(){if(!isWaveProject()||state.busy)return;waveInputGesture=true;holdUndoCheckpoint('声波参数',{includeAssetPayloads:true});}
function endWaveGesture(){if(!waveInputGesture)return;waveInputGesture=false;commitUndoCheckpoint();updateWaveHistoryButtons();}
function waveChangeConfig(key,value){if(activeWaveLayer().config[key]===value)return;changeWaveComposition(()=>{activeWaveLayer().config={...activeWaveLayer().config,[key]:value};});}
function waveChoiceGroup(key,title,items) {return `<section class="wave-section"><h3>${title}</h3><div class="wave-options" data-wave-group="${key}">${items.map(([value,label])=>`<button type="button" data-wave-key="${key}" data-wave-value="${value}">${label}</button>`).join('')}</div></section>`;}
function readWavePresets(){try{return JSON.parse(localStorage.getItem('svga_wave_presets')||'[]');}catch{return [];}}
function renderWavePresetList(){const select=$('wavePresetList'),value=select.value;select.replaceChildren(new Option('已保存方案',''));for(const p of readWavePresets())select.add(new Option(p.name,p.id));select.value=value;}
function selectWaveTab(tab) {
 for(const button of document.querySelectorAll('[data-wave-tab]')){const active=button.dataset.waveTab===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
 for(const [key,id] of [['shape','wavePanelShape'],['motion','wavePanelMotion'],['color','wavePanelColor']])$(id).hidden=key!==tab;
 document.querySelector('.wave-panel-scroll').scrollTop=0;
}
function startWaveWeb() {
 document.title='声浪实验室';enterWaveWorkspace();
 $('waveBackBtn').hidden=true;$('waveSaveImage').hidden=true;
 const controls=document.querySelector('.wave-stage-controls');
 const exports=document.createElement('div');exports.className='wave-web-exports';
 exports.innerHTML='<label>压缩画质 <input id="waveWebQuality" type="number" min="1" max="100" value="70" aria-label="压缩画质">%</label><button data-wave-web-export="png">当前帧 PNG</button><button data-wave-web-export="webp">导出 WebP</button><button data-wave-web-export="pag">导出 PAG</button><span id="waveWebStatus" role="status"></span>';
 controls.append(exports);
 exports.prepend(document.querySelector('.project-settings-menu'));$('projectSettingsPopover').querySelector('strong').textContent='画布与动画';$('projectSettingsBtn').title='画布与动画设置';$('projectSettingsBtn').setAttribute('aria-label','画布与动画设置');$('materialType').closest('.field').hidden=true;$('svgaQuality').closest('.field').hidden=true;document.querySelector('.project-settings-license-slot').hidden=true;
 $('waveWebQuality').onchange=()=>{$('waveWebQuality').value=Math.max(1,Math.min(100,Number($('waveWebQuality').value)||70));};
 for(const button of exports.querySelectorAll('[data-wave-web-export]'))button.onclick=()=>void exportWaveWeb(button.dataset.waveWebExport);
 const qualityNote=document.createElement('p');qualityNote.className='wave-note';qualityNote.textContent='PNG 使用透明调色板压缩；矢量 PAG 保留路径，画质影响图片素材。';document.querySelector('.wave-panel-footer').append(qualityNote);
}
async function exportWaveWeb(format) {
 if(state.busy||!isWaveProject())return;
 const quality=Number($('waveWebQuality').value)/100,project=state.package.project;
 const wasPlaying=state.previewPlaying,frame=state.previewFrame;stopPreviewPlayback();setBusy(true);
 $('waveWebStatus').textContent='';
 try{
  const profile={fps:projectFps(),quality,exportSize:project.exportRules.exportSize||'1x',compression:'balanced',mergeMode:'smart'};
  if(format==='webp')await exportWebp(profile);
  else if(format==='pag')await exportPag(profile);
  else if(format==='png'){
   await updateExportModal('正在导出当前帧 PNG','正在压缩透明图片...',0);
   const canvas=document.createElement('canvas');const size=exportSizeForProject(project,profile.exportSize);canvas.width=size.width;canvas.height=size.height;
   await drawProjectFrameToCanvas(canvas,frame,{project,fps:projectFps(),totalFrames:projectBaseFrameCount(),outputScale:size.width/project.canvas.width});
   const url=await indexedPngDataUrlForCanvas(canvas.getContext('2d',{willReadFrequently:true}),canvas.width,canvas.height,{adaptive:true,maxColors:Math.max(16,Math.round(256*quality))});
   if(!url)throw Error('PNG 压缩失败，请重试。');
   downloadBytes('声浪-当前帧.png','image/png',base64ToBytes(url.split(',')[1]));
  }else throw Error('不支持的导出格式。');
  $('waveWebStatus').textContent='已导出';
 }catch(error){$('waveWebStatus').textContent=error.message||'导出失败';}
 finally{setExportModal(false,'','','export');setBusy(false);if(wasPlaying)startPreviewPlayback({warmup:false});renderWavePanel();}
}
const exportWebp = async (profile = exportProfileFor("webp")) => {
        if (!state.package) throw new Error("请先导入 Figma 选区。");
        prepareSweepEffectsForExport();
        await updateExportModal("正在导出 WebP", "正在读取工程参数...", 0);
        const project = state.package.project;
        const resolvedProfile = profile || exportProfileFor("webp", project);
        const fps = normalizeExportFps(resolvedProfile.fps);
        const frameCount = exportFrameCountForFps(fps, projectDurationSeconds(project));
        const quality = clamp(Number(resolvedProfile.quality ?? WEBP_EXPORT_QUALITY), 0.01, 1);
        const size = webpExportSize(project, resolvedProfile.exportSize || "1x");
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = size.sourceWidth;
        sourceCanvas.height = size.sourceHeight;
        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = size.width;
        frameCanvas.height = size.height;
        const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
        if (!frameCtx) throw new Error("无法创建 WebP 导出画布。");
        frameCtx.imageSmoothingEnabled = true;
        frameCtx.imageSmoothingQuality = "medium";

        const frames = [];
        for (let index = 0; index < frameCount; index += 1) {
          const frameDurationMs = webpFrameDurationMs(index, fps);
          if (index === 0 || index === frameCount - 1 || index % 4 === 0) {
            await updateExportModal(
              "正在导出 WebP",
              `正在渲染并完整压缩第 ${index + 1}/${frameCount} 帧...`, 0.05 + 0.87 * index / frameCount,
            );
          }
          await drawProjectFrameToCanvas(sourceCanvas, index, {
            drawSelection: false,
            fps,
            totalFrames: frameCount,
          });
          frameCtx.clearRect(0, 0, size.width, size.height);
          frameCtx.drawImage(sourceCanvas, 0, 0, size.width, size.height);
          const currentImageData = frameCtx.getImageData(0, 0, size.width, size.height);
          const bounds = imageDataAlphaBounds(currentImageData, size.width, size.height);
          if (!bounds && frames.length) {
            frames[frames.length - 1].durationMs += frameDurationMs;
            continue;
          }
          const frame = await cropCanvasToWebpFrame(frameCanvas, bounds, frameDurationMs, quality, {
            dispose: true,
            replace: true,
          });
          const previousFrame = frames[frames.length - 1];
          if (sameWebpFrame(previousFrame, frame)) {
            previousFrame.durationMs += frameDurationMs;
          } else {
            frames.push(frame);
          }
        }

        await updateExportModal("正在导出 WebP", "正在封装动态 WebP 文件...", 0.95);
        const webpBytes = buildAnimatedWebp({
          width: size.width,
          height: size.height,
          fps,
          loopCount: resolvedProfile.loop === false ? 1 : 0,
          frames,
        });
        const filename = `${exportFilenameBaseForProject(project)}.webp`;
        downloadBytes(filename, "image/webp", webpBytes);
        return {
          filename,
          bytes: webpBytes.length,
          width: size.width,
          height: size.height,
          frames: frameCount,
          encodedFrames: frames.length,
          fps,
          loop: resolvedProfile.loop === false ? "once" : "infinite",
        };
      };
const WEBP_EXPORT_QUALITY = 0.36;
async function updateExportModal(title,detail='',progress){$('exportModal').hidden=false;$('exportTitle').textContent=title;$('exportDetail').textContent=detail;await new Promise(r=>requestAnimationFrame(r));}
const normalizeExportFps = (value) =>
        Math.max(1, Math.min(typeof isExternalSvgaProject === "function" && isExternalSvgaProject() ? 240 : 60, Math.round(Number(value) || EXPORT_DEFAULT_FPS)));
const EXPORT_DEFAULT_FPS = 24;
function isExternalSvgaProject(project = state.package?.project) {
  return project?.metadata?.sourceMode === 'svga-edit';
}
const exportFrameCountForFps = (fps, durationSeconds = EXPORT_DURATION_SECONDS) =>
        Math.max(
          1,
          Math.min(
            typeof isExternalSvgaProject === "function" && isExternalSvgaProject() ? 100000 : 600,
            Math.round(normalizeExportFps(fps) * normalizeExportDuration(durationSeconds)),
          ),
        );
const EXPORT_DURATION_SECONDS = 3;
const normalizeExportDuration = (value) =>
        typeof isExternalSvgaProject === "function" && isExternalSvgaProject() && Number(value) > 0
          ? Math.min(100000, Number(value)) : [3, 6, 9].includes(Number(value)) ? Number(value) : EXPORT_DURATION_SECONDS;
const exportProfileFor = (format, project = state.package?.project) => {
        if (!EXPORT_FORMAT_KEYS.includes(format)) return null;
        const profiles = ensureExportProfiles(project);
        const profile = normalizeExportProfile(format, profiles[format], project);
        if (project && profile) project.exportProfiles[format] = profile;
        return profile;
      };
const EXPORT_FORMAT_KEYS = ["webp", "gif", "lottie", "webm", "pag"];
const normalizeExportProfile = (format, source = {}, project = state.package?.project) => {
        const defaults = EXPORT_FORMAT_DEFAULTS[format];
        if (!defaults) return null;
        const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
        const profile = { ...defaults, ...input };
        profile.exportSize = exportSizeForProject(project, profile.exportSize || defaults.exportSize).input;
        profile.fps = normalizeExportFps(profile.fps);
        if (format === "webp" || format === "webm" || format === "pag") {
          profile.quality = clamp(Number(profile.quality ?? defaults.quality), 0.01, 1);
        }
        if (format === "webp" || format === "gif") {
          profile.loop = profile.loop !== false;
        }
        if (format === "gif") {
          profile.compression = ["small", "balanced", "quality"].includes(profile.compression)
            ? profile.compression
            : defaults.compression;
        }
        if (format === "lottie") {
          profile.minify = profile.minify !== false;
          profile.preserveVectors = true;
          profile.embedImages = true;
          profile.bitmapFormat = "auto";
        }
        if (format === "webm") profile.codec = "vp9";
        if (format === "pag") {
          delete profile.maxFileKB; // Ignore size caps saved by older versions.
          profile.mergeMode = profile.mergeMode === "smart" ? "smart" : "merged";
          if (!Number.isFinite(profile.quality)) profile.quality = defaults.quality;
        }
        return profile;
      };
const EXPORT_FORMAT_DEFAULTS = {
        webp: {
          exportSize: "1x",
          fps: EXPORT_DEFAULT_FPS,
          quality: WEBP_EXPORT_QUALITY,
          loop: true,
        },
        gif: {
          exportSize: "1x",
          fps: EXPORT_DEFAULT_FPS,
          compression: "balanced",
          loop: true,
        },
        lottie: {
          exportSize: "1x",
          fps: EXPORT_DEFAULT_FPS,
          minify: true,
          preserveVectors: true,
          embedImages: true,
          bitmapFormat: "auto",
        },
        webm: {
          exportSize: "1x",
          fps: EXPORT_DEFAULT_FPS,
          quality: 0.8,
          codec: "vp9",
        },
        pag: { exportSize: "1x", fps: EXPORT_DEFAULT_FPS, quality: 0.82, mergeMode: "merged" },
      };
const exportSizeForProject = (project = state.package?.project, value = exportSizeControlValue()) => {
        const canvas = project?.canvas || {};
        const sourceWidth = Math.max(1, Math.round(Number(canvas.width || 1)));
        const sourceHeight = Math.max(1, Math.round(Number(canvas.height || 1)));
        const raw = String(value || "1x").trim().toLowerCase();
        const match = raw.match(/^(\d+(?:\.\d+)?)([xwh])?$/);
        const amount = match ? Number(match[1]) : 1;
        const unit = match ? match[2] || "x" : "x";
        const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 1;
        const normalizedInput = match ? `${match[1]}${unit}` : "1x";
        let width = sourceWidth;
        let height = sourceHeight;
        let scale = 1;
        if (unit === "w") {
          width = Math.max(1, Math.round(safeAmount));
          scale = width / sourceWidth;
          height = Math.max(1, Math.round(sourceHeight * scale));
        } else if (unit === "h") {
          height = Math.max(1, Math.round(safeAmount));
          scale = height / sourceHeight;
          width = Math.max(1, Math.round(sourceWidth * scale));
        } else {
          scale = safeAmount;
          width = Math.max(1, Math.round(sourceWidth * scale));
          height = Math.max(1, Math.round(sourceHeight * scale));
        }
        return {
          input: normalizedInput,
          sourceWidth,
          sourceHeight,
          width,
          height,
          scale,
          scaleX: width / sourceWidth,
          scaleY: height / sourceHeight,
        };
      };
const exportSizeControlValue = () =>
        String($("exportScale")?.value || state.package?.project?.exportRules?.exportSize || "1x").trim() || "1x";
const ensureExportProfiles = () => {};
const prepareSweepEffectsForExport = () => {};
const exportFilenameBaseForProject = (project) => {
        const canvasName = getProjectCanvasName(project);
        return safeFilename(canvasName).replace(/\.(?:svga|webp)$/i, "") || "figma-selection";
      };
const getProjectCanvasName = (project) =>
        project?.metadata?.sourceCanvasName ||
        project?.canvasName ||
        project?.metadata?.sourceFileName ||
        "未命名画布";
const safeFilename = (value) =>
        String(value || "figma-selection")
          .trim()
          .replace(/[\\/:*?"<>|]+/g, "_")
          .replace(/\s+/g, "_")
          .slice(0, 80) || "figma-selection";
const buildAnimatedWebp = ({ width, height, fps, loopCount = 0, frameBytes, frames: frameEntries = null }) => {
        const canvasWidth = Math.max(1, Math.min(0xffffff, Math.round(width)));
        const canvasHeight = Math.max(1, Math.min(0xffffff, Math.round(height)));
        const defaultDurationMs = Math.max(10, Math.round(1000 / Math.max(1, fps)));
        const vp8x = new Uint8Array(10);
        vp8x[0] = 0x12; // Animation + alpha.
        setUint24LE(vp8x, 4, canvasWidth - 1);
        setUint24LE(vp8x, 7, canvasHeight - 1);

        const anim = new Uint8Array(6);
        // Transparent BGRA background. WebP uses 0 for infinite looping and
        // a positive count for finite playback.
        setUint32LE(anim, 0, 0);
        const normalizedLoopCount = Math.max(0, Math.min(0xffff, Math.round(Number(loopCount) || 0)));
        anim[4] = normalizedLoopCount & 255;
        anim[5] = (normalizedLoopCount >> 8) & 255;

        const chunks = [
          makeRiffChunk("VP8X", vp8x),
          makeRiffChunk("ANIM", anim),
        ];
        const frames = frameEntries || (frameBytes || []).map((bytes) => ({
          bytes,
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          durationMs: defaultDurationMs,
          replace: false,
          dispose: true,
        }));
        for (const frame of frames) {
          const bytes = frame.bytes || frame;
          const frameData = extractWebpFrameChunks(bytes);
          const payload = new Uint8Array(16 + frameData.length);
          const frameX = Math.max(0, Math.min(canvasWidth - 1, Math.round(Number(frame.x) || 0)));
          const frameY = Math.max(0, Math.min(canvasHeight - 1, Math.round(Number(frame.y) || 0)));
          const frameWidth = Math.max(1, Math.min(canvasWidth - frameX, Math.round(Number(frame.width) || canvasWidth)));
          const frameHeight = Math.max(1, Math.min(canvasHeight - frameY, Math.round(Number(frame.height) || canvasHeight)));
          setUint24LE(payload, 0, Math.floor(frameX / 2));
          setUint24LE(payload, 3, Math.floor(frameY / 2));
          setUint24LE(payload, 6, frameWidth - 1);
          setUint24LE(payload, 9, frameHeight - 1);
          setUint24LE(payload, 12, Math.max(10, Math.round(Number(frame.durationMs) || defaultDurationMs)));
          payload[15] = (frame.replace === false ? 0 : 0x01) | (frame.dispose ? 0x02 : 0);
          payload.set(frameData, 16);
          chunks.push(makeRiffChunk("ANMF", payload));
        }

        const riffBodyLength = 4 + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const output = new Uint8Array(8 + riffBodyLength);
        setAscii(output, 0, "RIFF");
        setUint32LE(output, 4, riffBodyLength);
        setAscii(output, 8, "WEBP");
        let offset = 12;
        for (const chunk of chunks) {
          output.set(chunk, offset);
          offset += chunk.length;
        }
        return output;
      };
const setAscii = (target, offset, value) => {
        target.set(asciiBytes(value), offset);
      };
const asciiBytes = (value) => {
        const bytes = new Uint8Array(String(value || "").length);
        for (let index = 0; index < bytes.length; index += 1) {
          bytes[index] = value.charCodeAt(index) & 255;
        }
        return bytes;
      };
const setUint24LE = (target, offset, value) => {
        const safeValue = Math.max(0, Math.min(0xffffff, Math.round(Number(value) || 0)));
        target[offset] = safeValue & 255;
        target[offset + 1] = (safeValue >> 8) & 255;
        target[offset + 2] = (safeValue >> 16) & 255;
      };
const setUint32LE = (target, offset, value) => {
        const safeValue = Math.max(0, Math.round(Number(value) || 0)) >>> 0;
        target[offset] = safeValue & 255;
        target[offset + 1] = (safeValue >> 8) & 255;
        target[offset + 2] = (safeValue >> 16) & 255;
        target[offset + 3] = (safeValue >> 24) & 255;
      };
const makeRiffChunk = (fourcc, payload) => {
        const pad = payload.length % 2;
        const chunk = new Uint8Array(8 + payload.length + pad);
        setAscii(chunk, 0, fourcc);
        setUint32LE(chunk, 4, payload.length);
        chunk.set(payload, 8);
        return chunk;
      };
const extractWebpFrameChunks = (bytes) => {
        if (!isWebpBytes(bytes)) throw new Error("当前环境没有生成有效的 WebP 帧。");
        const chunks = [];
        let offset = 12;
        while (offset + 8 <= bytes.length) {
          const fourcc = String.fromCharCode(...bytes.slice(offset, offset + 4));
          const size = readUint32LE(bytes, offset + 4);
          const end = offset + 8 + size + (size % 2);
          if (end > bytes.length) break;
          if (fourcc === "ALPH" || fourcc === "VP8 " || fourcc === "VP8L") {
            chunks.push(bytes.slice(offset, end));
          }
          offset = end;
        }
        if (!chunks.some((chunk) => {
          const fourcc = String.fromCharCode(...chunk.slice(0, 4));
          return fourcc === "VP8 " || fourcc === "VP8L";
        })) {
          throw new Error("当前环境不支持导出可封装的 WebP 帧。");
        }
        return concatWebpParts(chunks);
      };
const readUint32LE = (bytes, offset) =>
        (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
const concatWebpParts = (parts) => {
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const output = new Uint8Array(total);
        let offset = 0;
        for (const part of parts) {
          output.set(part, offset);
          offset += part.length;
        }
        return output;
      };
const isWebpBytes = (bytes) =>
        bytes?.length >= 12 &&
        String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
const imageDataAlphaBounds = (imageData, width, height) => {
        const data = imageData?.data;
        if (!data) return null;
        let left = width;
        let top = height;
        let right = 0;
        let bottom = 0;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (data[(y * width + x) * 4 + 3] <= 0) continue;
            if (x < left) left = x;
            if (y < top) top = y;
            if (x + 1 > right) right = x + 1;
            if (y + 1 > bottom) bottom = y + 1;
          }
        }
        return right > left && bottom > top ? evenCropBounds({ left, top, right, bottom }, width, height) : null;
      };
const evenCropBounds = (bounds, width, height) => {
        if (!bounds) return null;
        let left = Math.max(0, Math.floor(bounds.left) - WEBP_FRAME_CROP_PADDING);
        let top = Math.max(0, Math.floor(bounds.top) - WEBP_FRAME_CROP_PADDING);
        let right = Math.min(width, Math.ceil(bounds.right) + WEBP_FRAME_CROP_PADDING);
        let bottom = Math.min(height, Math.ceil(bounds.bottom) + WEBP_FRAME_CROP_PADDING);
        if (left % 2 === 1) left = Math.max(0, left - 1);
        if (top % 2 === 1) top = Math.max(0, top - 1);
        right = Math.max(left + 1, right);
        bottom = Math.max(top + 1, bottom);
        return {
          x: left,
          y: top,
          width: Math.max(1, right - left),
          height: Math.max(1, bottom - top),
        };
      };
const WEBP_FRAME_CROP_PADDING = 8;
const cropCanvasToWebpFrame = async (sourceCanvas, bounds, durationMs, quality = WEBP_EXPORT_QUALITY, options = {}) => {
        const safeBounds = bounds || { x: 0, y: 0, width: 1, height: 1 };
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = Math.max(1, safeBounds.width);
        cropCanvas.height = Math.max(1, safeBounds.height);
        const cropCtx = cropCanvas.getContext("2d");
        if (!cropCtx) throw new Error("无法创建 WebP 帧裁剪画布。");
        cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        cropCtx.drawImage(
          sourceCanvas,
          safeBounds.x,
          safeBounds.y,
          safeBounds.width,
          safeBounds.height,
          0,
          0,
          safeBounds.width,
          safeBounds.height,
        );
        return {
          bytes: await canvasToWebpBytes(cropCanvas, quality),
          x: safeBounds.x,
          y: safeBounds.y,
          width: safeBounds.width,
          height: safeBounds.height,
          durationMs,
          replace: options.replace !== false,
          dispose: options.dispose === true,
        };
      };
const canvasToWebpBytes = (canvas, quality = WEBP_EXPORT_QUALITY) =>
        new Promise((resolve, reject) => {
          if (!canvas.toBlob) {
            reject(new Error("当前环境不支持 Canvas WebP 编码。"));
            return;
          }
          canvas.toBlob(async (blob) => {
            try {
              if (!blob) throw new Error("WebP 帧编码失败。");
              resolve(await blobToBytes(blob));
            } catch (error) {
              reject(error);
            }
          }, "image/webp", quality);
        });
const blobToBytes = async (blob) => new Uint8Array(await blob.arrayBuffer());
const sameWebpFrame = (left, right) => {
        if (!left || !right) return false;
        if (left.x !== right.x || left.y !== right.y || left.width !== right.width || left.height !== right.height) return false;
        if (left.bytes?.length !== right.bytes?.length) return false;
        for (let index = 0; index < left.bytes.length; index += 1) {
          if (left.bytes[index] !== right.bytes[index]) return false;
        }
        return true;
      };
const webpExportSize = (project, value = "1x") => exportSizeForProject(project, value);
const webpFrameDurationMs = (frameIndex, fps) => {
        const safeFps = normalizeExportFps(fps);
        const index = Math.max(0, Math.round(Number(frameIndex) || 0));
        return Math.max(
          10,
          Math.round(((index + 1) * 1000) / safeFps) - Math.round((index * 1000) / safeFps),
        );
      };
async function exportPag(profile={}){
 const project=state.package.project,fps=projectFps(),frameCount=projectBaseFrameCount(),size=exportSizeForProject(project,profile.exportSize||'1x');
 const composition={assets:[],layers:[]},ensureImage=createPagNativeImageAssetRegistry(composition.assets),payloads=new Map(state.package.assets.map(p=>[p.key,p]));
 for(const asset of project.assets){if(asset.visible===false)continue;const payload=payloads.get(asset.key),geometry=assetRenderGeometry(asset,payload);
  const common={ddd:0,ind:0,nm:asset.name,sr:1,ks:lottieLayerTransform(asset,geometry,size,frameCount,fps),ao:0,ip:0,op:frameCount,st:0,bm:0};
  const vector=asset.type==='vector'?lottieVectorPlanForAsset(asset,payload):null;
  const shapes=vector?lottieShapeGroupsForPlan(vector):null;
  composition.layers.push(shapes?{...common,ty:4,shapes}:{...common,ty:2,refId:await ensureImage(payload)});
 }
 composition.layers.reverse().forEach((layer,i)=>layer.ind=i+1);
 const priorYield=state.pagExportYield,priorCache=state.pagExportImageCache;state.pagExportYield=createPagExportYield();state.pagExportImageCache=new Map();
 try{await updateExportModal('正在导出 PAG','正在编码矢量与可替换图片...',.1);await compactPagTransformTracks(composition);
 const images=await preparePagNativeImages(composition,profile.quality??.7,null,[.3,.6]);
 const plan=await buildPagNativePlan({composition,size,fps,frameCount});const blob=await pagBlobFromPlan(plan);images.clear();
 downloadBytes('声浪.pag','application/octet-stream',new Uint8Array(await blob.arrayBuffer()));
 }finally{state.pagExportYield=priorYield;state.pagExportImageCache=priorCache;}
}
const createPagNativeImageAssetRegistry = (assets) => {
        const idsBySource = new Map();
        return async (payload) => {
          const source = String(payload?.dataUrl || ""); if (!source) return "";
          const w = Math.max(1, Math.round(Number(payload.width) || 1)), h = Math.max(1, Math.round(Number(payload.height) || 1));
          let dimensions = idsBySource.get(source);
          if (!dimensions) { dimensions = new Map(); idsBySource.set(source, dimensions); }
          const key = `${w}x${h}`; if (dimensions.has(key)) return dimensions.get(key);
          const id = `pag_native_image_${assets.length + 1}`;
          assets.push({ id, w, h, u: "", p: source, e: 1 }); dimensions.set(key, id); return id;
        };
      };
const lottieLayerTransform = (asset, geometry, exportSize, frameCount, fps = projectFps(state.package?.project)) => {
        const samples = [];
        for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
          samples.push(lottieTransformSampleForMatrix(
            motionMatrixForGeometry(asset, geometry, frameIndex, frameCount, fps),
            exportSize,
          ));
        }
        return {
          o: lottiePropertyFromSamples(Array.from({ length: frameCount }, (_, i) => assetFadeAlpha(asset, i, frameCount, fps) * 100)),
          r: lottiePropertyFromSamples(samples.map((sample) => sample.rotation)),
          p: lottiePropertyFromSamples(samples.map((sample) => sample.position)),
          a: { a: 0, k: [0, 0, 0] },
          s: lottiePropertyFromSamples(samples.map((sample) => sample.scale)),
        };
      };
const assetFadeAlpha = (asset,index,frames,fps) => waveAlpha(asset,index,fps);
function waveAlpha(asset,frameIndex,fps) {return asset.waveElement?waveElementSample(asset,frameIndex,fps,projectDurationSeconds()).alpha:1;}
const lottieTransformSampleForMatrix = (
        matrix,
        exportSize,
        anchor = [0, 0, 0],
      ) => {
        const scaled = matrixFromTransform(
          scaleTransformForExport(transformFromMatrix(matrix), exportSize),
        );
        const scaleX = Math.max(0.000001, Math.hypot(scaled.a, scaled.b));
        const determinant = scaled.a * scaled.d - scaled.b * scaled.c;
        const scaleY = determinant / scaleX;
        const anchorX = Number(anchor?.[0]) || 0;
        const anchorY = Number(anchor?.[1]) || 0;
        return {
          position: [
            round(scaled.a * anchorX + scaled.c * anchorY + scaled.e, 3),
            round(scaled.b * anchorX + scaled.d * anchorY + scaled.f, 3),
            0,
          ],
          scale: [round(scaleX * 100, 3), round(scaleY * 100, 3), 100],
          rotation: round((Math.atan2(scaled.b, scaled.a) * 180) / Math.PI, 3),
        };
      };
const scaleTransformForExport = (transform, exportSize) => ({
        ...transform,
        a: round(Number(transform.a || 0) * exportSize.scaleX, 6),
        b: round(Number(transform.b || 0) * exportSize.scaleY, 6),
        c: round(Number(transform.c || 0) * exportSize.scaleX, 6),
        d: round(Number(transform.d || 0) * exportSize.scaleY, 6),
        tx: round(Number(transform.tx || 0) * exportSize.scaleX, 2),
        ty: round(Number(transform.ty || 0) * exportSize.scaleY, 2),
      });
const round = (value, digits = 4) => {
        const factor = 10 ** digits;
        return Math.round((Number(value) || 0) * factor) / factor;
      };
const transformFromMatrix = (matrix) => ({
        a: matrixCoefficientValue(matrix.a),
        b: matrixCoefficientValue(matrix.b),
        c: matrixCoefficientValue(matrix.c),
        d: matrixCoefficientValue(matrix.d),
        tx: roundMatrixValue(matrix.e, 2),
        ty: roundMatrixValue(matrix.f, 2),
      });
const roundMatrixValue = (value, digits = 6) => {
        const rounded = round(value, digits);
        return Math.abs(rounded) <= 1 / (10 ** digits) ? 0 : rounded;
      };
const matrixCoefficientValue = (value) => {
        const next = Number(value);
        return Number.isFinite(next) ? next : 0;
      };
const matrixFromTransform = (transform) => ({
        a: Number(transform?.a ?? 1) || 0,
        b: Number(transform?.b ?? 0) || 0,
        c: Number(transform?.c ?? 0) || 0,
        d: Number(transform?.d ?? 1) || 0,
        e: Number(transform?.tx ?? transform?.e ?? 0) || 0,
        f: Number(transform?.ty ?? transform?.f ?? 0) || 0,
      });
const lottiePropertyFromSamples = (samples, startFrame = 0, options = {}) => {
        const values = samples?.length ? samples : [0];
        if (values.every((value) => lottieValuesEqual(value, values[0]))) {
          return { a: 0, k: values[0] };
        }
        const linearRunEnds = new Map();
        if (options.allowLinear === true) {
          for (let index = 0; index + 2 < values.length;) {
            const endIndex = lottieLinearRunEnd(values, index, { ...options, startFrame });
            if (endIndex > index) {
              linearRunEnds.set(index, endIndex);
              index = endIndex;
            } else {
              index += 1;
            }
          }
        }
        const keyframes = [];
        for (let index = 0; index < values.length;) {
          const value = values[index];
          const linearEndIndex = linearRunEnds.get(index);
          if (linearEndIndex != null) {
            const linearEasing = lottieLinearEasingForValue(value);
            keyframes.push({
              t: startFrame + index,
              s: Array.isArray(value) ? value : [value],
              ...linearEasing,
            });
            index = linearEndIndex;
            continue;
          }
          keyframes.push({
            t: startFrame + index,
            s: Array.isArray(value) ? value : [value],
            h: 1,
          });
          let nextIndex = index + 1;
          while (
            nextIndex < values.length &&
            lottieValuesEqual(values[nextIndex], value) &&
            !linearRunEnds.has(nextIndex)
          ) {
            nextIndex += 1;
          }
          index = nextIndex;
        }
        keyframes.push({
          t: startFrame + values.length,
          s: Array.isArray(values[values.length - 1])
            ? values[values.length - 1]
            : [values[values.length - 1]],
          h: 1,
        });
        return { a: 1, k: keyframes };
      };
const lottieValuesEqual = (left, right) => {
        const leftValues = Array.isArray(left) ? left : [left];
        const rightValues = Array.isArray(right) ? right : [right];
        return leftValues.length === rightValues.length &&
          leftValues.every((value, index) => Math.abs(Number(value) - Number(rightValues[index])) <= 0.0001);
      };
const lottieLinearEasingForValue = (value) => {
        const dimensionCount = Math.max(1, Array.isArray(value) ? value.length : 1);
        return {
          o: { x: Array(dimensionCount).fill(0), y: Array(dimensionCount).fill(0) },
          i: { x: Array(dimensionCount).fill(1), y: Array(dimensionCount).fill(1) },
        };
      };
const lottieLinearRunEnd = (
        values,
        startIndex,
        { preserveVisibility = false, startFrame = 0 } = {},
      ) => {
        if (!Array.isArray(values) || startIndex < 0 || startIndex + 2 >= values.length) {
          return startIndex;
        }
        const components = (value) => Array.isArray(value) ? value : [value];
        const start = components(values[startIndex]);
        const roundThree = (value) => Math.round((Number(value) || 0) * 1000) / 1000;
        const remainsVisible = (value) =>
          !preserveVisibility || Number(components(value)[0]) > 0.001;
        if (!remainsVisible(values[startIndex])) return startIndex;
        for (let endIndex = values.length - 1; endIndex >= startIndex + 2; endIndex -= 1) {
          const end = components(values[endIndex]);
          if (end.length !== start.length || !remainsVisible(values[endIndex])) continue;
          if (lottieValuesEqual(start, end)) continue;
          let exactAtEveryFrame = true;
          for (let index = startIndex + 1; index < endIndex; index += 1) {
            const sample = components(values[index]);
            if (sample.length !== start.length || !remainsVisible(values[index])) {
              exactAtEveryFrame = false;
              break;
            }
            const progress = (index - startIndex) / (endIndex - startIndex);
            for (let componentIndex = 0; componentIndex < start.length; componentIndex += 1) {
              const interpolated = roundThree(
                Number(start[componentIndex]) +
                (Number(end[componentIndex]) - Number(start[componentIndex])) * progress,
              );
              if (interpolated !== roundThree(sample[componentIndex])) {
                exactAtEveryFrame = false;
                break;
              }
            }
            if (!exactAtEveryFrame) break;
          }
          if (!exactAtEveryFrame) continue;
          const holdKeyframes = [];
          for (let index = startIndex; index < endIndex; index += 1) {
            if (index > startIndex && lottieValuesEqual(values[index], values[index - 1])) continue;
            const value = values[index];
            holdKeyframes.push({
              t: startFrame + index,
              s: Array.isArray(value) ? value : [value],
              h: 1,
            });
          }
          const holdJson = JSON.stringify(holdKeyframes);
          const linearEasing = lottieLinearEasingForValue(values[startIndex]);
          const linearJson = JSON.stringify([{
            t: startFrame + startIndex,
            s: Array.isArray(values[startIndex]) ? values[startIndex] : [values[startIndex]],
            ...linearEasing,
          }]);
          if (linearJson.length < holdJson.length) return endIndex;
          return startIndex;
        }
        return startIndex;
      };
const lottieVectorPlanForAsset = (asset, payload) => {
        const nativePlan = nativeVectorPlanForAsset(asset, payload);
        if (nativePlan) {
          return {
            ...nativePlan,
            shapes: nativePlan.shapes.map((shape) => ({ ...shape, fillRule: "nonzero" })),
          };
        }
        if (
          asset?.type !== "vector" ||
          asset.source?.vectorPathPreserved !== true ||
          !/^data:image\/svg\+xml(?:;[^,]*)?,/i.test(String(payload?.dataUrl || ""))
        ) return null;
        try {
          const documentNode = new DOMParser().parseFromString(
            sweepCustomShapeSvgText(payload.dataUrl),
            "image/svg+xml",
          );
          const root = documentNode.documentElement;
          if (!root || documentNode.querySelector("parsererror")) return null;
          const visiblePaths = Array.from(documentNode.querySelectorAll("path"))
            .filter((path) => !svgElementIsHidden(path) && String(path.getAttribute("d") || "").trim());
          const fillRules = visiblePaths.map((path) =>
            svgInheritedStyleValue(path, "fill-rule", "nonzero").toLowerCase()
          );
          if (!fillRules.includes("evenodd") || fillRules.some((rule) => !["nonzero", "evenodd"].includes(rule))) {
            return null;
          }
          for (const path of visiblePaths) path.setAttribute("fill-rule", "nonzero");
          // The marker also prevents a collision with the native-plan cache's
          // compact data-URL signature after an equal-length fill-rule rewrite.
          const normalizedSvg = `${new XMLSerializer().serializeToString(documentNode)}<!--lottie-evenodd-->`;
          const normalizedPayload = {
            ...payload,
            dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizedSvg)}`,
          };
          const plan = nativeVectorPlanForAsset(asset, normalizedPayload);
          if (!plan || plan.shapes.length !== fillRules.length) return null;
          return {
            ...plan,
            shapes: plan.shapes.map((shape, index) => ({
              ...shape,
              fillRule: fillRules[index],
            })),
          };
        } catch (_error) {
          return null;
        }
      };
const sweepCustomShapeSvgText = (dataUrl) => {
        const value = String(dataUrl || "");
        const match = value.match(/^data:image\/svg\+xml(?:;[^,]*)?,(.*)$/i);
        if (!match) throw new Error("仅支持 SVG 矢量形状。");
        if (/;base64,/i.test(value.slice(0, value.indexOf(",") + 1))) {
          const binary = atob(match[1]);
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
          return new TextDecoder().decode(bytes);
        }
        return decodeURIComponent(match[1]);
      };
const svgInheritedStyleValue = (element, property, fallback = "") => {
        let current = element;
        while (current && current.nodeType === 1) {
          const value = svgStyleValue(current, property);
          if (value) return value;
          current = current.parentElement;
        }
        return fallback;
      };
const svgStyleValue = (element, property) => {
        const direct = String(element?.getAttribute?.(property) || "").trim();
        if (direct) return direct;
        const style = String(element?.getAttribute?.("style") || "");
        for (const declaration of style.split(";")) {
          const separator = declaration.indexOf(":");
          if (separator < 0) continue;
          if (declaration.slice(0, separator).trim().toLowerCase() !== property) continue;
          return declaration.slice(separator + 1).trim();
        }
        return "";
      };
const svgElementIsHidden = (element) => {
        let current = element;
        while (current && current.nodeType === 1) {
          if (svgStyleValue(current, "display").toLowerCase() === "none") return true;
          const visibility = svgStyleValue(current, "visibility").toLowerCase();
          if (visibility === "hidden" || visibility === "collapse") return true;
          current = current.parentElement;
        }
        return false;
      };
const nativeVectorPlanForAsset = (asset, payload) => {
        if (
          !asset ||
          asset.type !== "vector" ||
          asset.source?.vectorPathPreserved !== true ||
          !/^data:image\/svg\+xml(?:;[^,]*)?,/i.test(String(payload?.dataUrl || ""))
        ) return null;
        const cacheKey = [
          asset.waveElement ? (payload.svgaCacheKey || asset.key) : asset.key,
          payload.width || 0,
          payload.height || 0,
          dataUrlSignature(payload.dataUrl),
        ].join(":");
        if (nativeVectorPlanCache.has(cacheKey)) return nativeVectorPlanCache.get(cacheKey);
        let plan = null;
        try {
          const documentNode = new DOMParser().parseFromString(
            sweepCustomShapeSvgText(payload.dataUrl),
            "image/svg+xml",
          );
          const root = documentNode.documentElement;
          if (
            !root ||
            root.localName.toLowerCase() !== "svg" ||
            documentNode.querySelector("parsererror") ||
            documentNode.querySelector("defs, clipPath, mask, filter, pattern, linearGradient, radialGradient, image, text, use, foreignObject, style, symbol")
          ) {
            throw new Error("unsupported-vector-feature");
          }
          for (const element of documentNode.querySelectorAll("*")) {
            if (!["svg", "g", "path", "title", "desc"].includes(element.localName.toLowerCase())) {
              throw new Error("unsupported-vector-element");
            }
            const blend = svgStyleValue(element, "mix-blend-mode").toLowerCase();
            if (blend && blend !== "normal") throw new Error("unsupported-vector-blend");
          }
          const width = Math.max(1, Number(payload.width || root.getAttribute("width") || 1));
          const height = Math.max(1, Number(payload.height || root.getAttribute("height") || 1));
          const rawViewBox = svgNumberList(root.getAttribute("viewBox"));
          const viewBox = rawViewBox.length === 4 && rawViewBox.every(Number.isFinite) && rawViewBox[2] > 0 && rawViewBox[3] > 0
            ? rawViewBox
            : [0, 0, width, height];
          const viewBoxTransform = {
            a: width / viewBox[2],
            b: 0,
            c: 0,
            d: height / viewBox[3],
            e: (-viewBox[0] * width) / viewBox[2],
            f: (-viewBox[1] * height) / viewBox[3],
          };
          const shapes = [];
          for (const path of documentNode.querySelectorAll("path")) {
            if (svgElementIsHidden(path)) continue;
            const data = String(path.getAttribute("d") || "").trim();
            if (!data) continue;
            const fillRule = svgInheritedStyleValue(path, "fill-rule", "nonzero").toLowerCase();
            if (fillRule !== "nonzero") {
              throw new Error("unsupported-vector-fill-rule");
            }
            let opacityAncestor = path.parentElement;
            while (opacityAncestor && opacityAncestor.nodeType === 1) {
              const ancestorOpacityText = svgStyleValue(opacityAncestor, "opacity");
              const ancestorOpacity = ancestorOpacityText
                ? svgOpacityValue(ancestorOpacityText)
                : 1;
              if (ancestorOpacity == null || Math.abs(ancestorOpacity - 1) > 0.0001) {
                throw new Error("unsupported-vector-group-opacity");
              }
              opacityAncestor = opacityAncestor.parentElement;
            }
            if (
              svgStyleValue(path, "vector-effect") ||
              svgStyleValue(path, "stroke-dashoffset") ||
              (svgInheritedStyleValue(path, "stroke-dasharray", "none").toLowerCase() !== "none")
            ) {
              throw new Error("unsupported-vector-stroke");
            }
            const elementOpacity = svgOpacityForElement(path);
            const fillOpacity = svgOpacityValue(svgInheritedStyleValue(path, "fill-opacity", "1"));
            const strokeOpacity = svgOpacityValue(svgInheritedStyleValue(path, "stroke-opacity", "1"));
            if (elementOpacity == null || fillOpacity == null || strokeOpacity == null) {
              throw new Error("unsupported-vector-opacity");
            }
            const fillText = svgInheritedStyleValue(path, "fill", "#000000");
            const strokeText = svgInheritedStyleValue(path, "stroke", "none");
            const fill = fillText.toLowerCase() === "none"
              ? null
              : svgColor(fillText, elementOpacity * fillOpacity);
            const stroke = strokeText.toLowerCase() === "none"
              ? null
              : svgColor(strokeText, elementOpacity * strokeOpacity);
            if ((fillText.toLowerCase() !== "none" && !fill) || (strokeText.toLowerCase() !== "none" && !stroke)) {
              throw new Error("unsupported-vector-paint");
            }
            if ((!fill || fill.a <= 0.0001) && (!stroke || stroke.a <= 0.0001)) continue;
            const transform = svgPathTransform(path, root, viewBoxTransform);
            if (!transform) throw new Error("unsupported-vector-transform");
            const strokeWidth = stroke
              ? Number(svgInheritedStyleValue(path, "stroke-width", "1"))
              : 0;
            if (stroke && (!Number.isFinite(strokeWidth) || strokeWidth < 0)) {
              throw new Error("unsupported-vector-stroke-width");
            }
            const lineCap = { butt: 0, round: 1, square: 2 }[
              svgInheritedStyleValue(path, "stroke-linecap", "butt").toLowerCase()
            ];
            const lineJoin = { miter: 0, round: 1, bevel: 2 }[
              svgInheritedStyleValue(path, "stroke-linejoin", "miter").toLowerCase()
            ];
            const miterLimit = Number(svgInheritedStyleValue(path, "stroke-miterlimit", "4"));
            shapes.push({
              type: 0,
              path: data,
              fill,
              stroke,
              strokeWidth,
              lineCap: Number.isInteger(lineCap) ? lineCap : 0,
              lineJoin: Number.isInteger(lineJoin) ? lineJoin : 0,
              miterLimit: Number.isFinite(miterLimit) ? miterLimit : 4,
              transform: transformFromMatrix(transform),
            });
          }
          if (shapes.length) {
            plan = {
              width,
              height,
              shapes,
              keepShapes: shapes.map(() => ({ type: 3 })),
            };
          }
        } catch (_error) {
          plan = null;
        }
        if (nativeVectorPlanCache.size > 120) nativeVectorPlanCache.clear();
        nativeVectorPlanCache.set(cacheKey, plan);
        return plan;
      };
const dataUrlSignature = (dataUrl) => {
        const text = String(dataUrl || "");
        return `${text.length}:${text.slice(0, 24)}:${text.slice(-24)}`;
      };
const nativeVectorPlanCache = new Map();
const svgNumberList = (value) =>
        String(value || "")
          .trim()
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number);
const svgOpacityValue = (value) => {
        const text = String(value == null ? "" : value).trim();
        const number = text.endsWith("%")
          ? Number.parseFloat(text) / 100
          : Number(text);
        return Number.isFinite(number) ? clamp(number, 0, 1) : null;
      };
const svgOpacityForElement = (element) => {
        let opacity = 1;
        let current = element;
        while (current && current.nodeType === 1) {
          const value = svgStyleValue(current, "opacity");
          if (value) {
            const number = svgOpacityValue(value);
            if (number == null) return null;
            opacity *= number;
          }
          current = current.parentElement;
        }
        return opacity;
      };
const svgColor = (value, opacity) => {
        const text = String(value || "").trim();
        if (!text || text.toLowerCase() === "none") return null;
        if (/^(?:url|var)\(|currentcolor$/i.test(text)) return null;
        let normalized = text;
        if (svgColorProbe) {
          svgColorProbe.fillStyle = "#010203";
          svgColorProbe.fillStyle = text;
          const first = svgColorProbe.fillStyle;
          svgColorProbe.fillStyle = "#040506";
          svgColorProbe.fillStyle = text;
          const second = svgColorProbe.fillStyle;
          if (first === "#010203" && second === "#040506") return null;
          normalized = second;
        }
        const color = parseNormalizedCssColor(normalized);
        if (!color) return null;
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: clamp(color.a * opacity, 0, 1),
        };
      };
const parseNormalizedCssColor = (value) => {
        const text = String(value || "").trim().toLowerCase();
        if (text === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
        const hex = text.match(/^#([0-9a-f]{3,8})$/i);
        if (hex) {
          let digits = hex[1];
          if (digits.length === 3 || digits.length === 4) {
            digits = digits.split("").map((digit) => digit + digit).join("");
          }
          if (digits.length === 6) digits += "ff";
          if (digits.length !== 8) return null;
          return {
            r: parseInt(digits.slice(0, 2), 16) / 255,
            g: parseInt(digits.slice(2, 4), 16) / 255,
            b: parseInt(digits.slice(4, 6), 16) / 255,
            a: parseInt(digits.slice(6, 8), 16) / 255,
          };
        }
        const functional = text.match(/^rgba?\(([^)]+)\)$/);
        if (!functional) return null;
        const parts = functional[1].split(/[\s,\/]+/).filter(Boolean);
        if (parts.length < 3) return null;
        const channel = (part) =>
          String(part).endsWith("%")
            ? clamp(Number.parseFloat(part) / 100, 0, 1)
            : clamp(Number(part) / 255, 0, 1);
        const alpha = parts.length > 3
          ? (String(parts[3]).endsWith("%")
              ? clamp(Number.parseFloat(parts[3]) / 100, 0, 1)
              : clamp(Number(parts[3]), 0, 1))
          : 1;
        if (![channel(parts[0]), channel(parts[1]), channel(parts[2]), alpha].every(Number.isFinite)) return null;
        return {
          r: channel(parts[0]),
          g: channel(parts[1]),
          b: channel(parts[2]),
          a: alpha,
        };
      };
const svgColorProbe = document.createElement("canvas").getContext("2d");
const svgPathTransform = (element, root, viewBoxTransform) => {
        const chain = [];
        let current = element;
        while (current && current.nodeType === 1) {
          chain.unshift(current);
          if (current === root) break;
          current = current.parentElement;
        }
        if (!chain.length || chain[0] !== root) return null;
        let matrix = viewBoxTransform;
        for (const item of chain) {
          const local = svgTransformMatrix(item.getAttribute("transform"));
          if (!local) return null;
          matrix = multiplyMatrix(matrix, local);
        }
        return matrix;
      };
const svgTransformMatrix = (value) => {
        const text = String(value || "").trim();
        if (!text) return svgIdentityMatrix();
        const matcher = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
        let matrix = svgIdentityMatrix();
        let consumed = "";
        let match;
        while ((match = matcher.exec(text))) {
          consumed += match[0];
          const name = match[1].toLowerCase();
          const values = svgNumberList(match[2]);
          if (!values.every(Number.isFinite)) return null;
          let next = null;
          if (name === "matrix" && values.length === 6) {
            next = {
              a: values[0],
              b: values[1],
              c: values[2],
              d: values[3],
              e: values[4],
              f: values[5],
            };
          } else if (name === "translate" && values.length >= 1 && values.length <= 2) {
            next = translationMatrix(values[0], values.length > 1 ? values[1] : 0);
          } else if (name === "scale" && values.length >= 1 && values.length <= 2) {
            next = {
              a: values[0],
              b: 0,
              c: 0,
              d: values.length > 1 ? values[1] : values[0],
              e: 0,
              f: 0,
            };
          } else if (name === "rotate" && (values.length === 1 || values.length === 3)) {
            const rotation = rotationMatrix((values[0] * Math.PI) / 180);
            next = values.length === 3
              ? aroundPointMatrix(values[1], values[2], rotation)
              : rotation;
          } else if (name === "skewx" && values.length === 1) {
            next = { a: 1, b: 0, c: Math.tan((values[0] * Math.PI) / 180), d: 1, e: 0, f: 0 };
          } else if (name === "skewy" && values.length === 1) {
            next = { a: 1, b: Math.tan((values[0] * Math.PI) / 180), c: 0, d: 1, e: 0, f: 0 };
          }
          if (!next) return null;
          matrix = multiplyMatrix(matrix, next);
        }
        if (!consumed || text.replace(/\s+/g, "") !== consumed.replace(/\s+/g, "")) return null;
        return matrix;
      };
const svgIdentityMatrix = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
const lottieShapeGroupsForPlan = (plan) => {
        const groups = [];
        for (const [shapeIndex, shape] of (plan?.shapes || []).entries()) {
          const parsedPaths = svgPathToLottiePaths(shape.path);
          if (!parsedPaths?.length) return null;
          const items = parsedPaths.map((parsedPath, pathIndex) => ({
              ty: "sh",
              nm: `路径 ${shapeIndex + 1}.${pathIndex + 1}`,
              ks: { a: 0, k: transformLottiePath(parsedPath, shape.transform) },
            }));
          if (shape.fill?.a > 0.0001) {
            items.push({
              ty: "fl",
              nm: "填充",
              c: lottieColorProperty(shape.fill),
              o: { a: 0, k: round(shape.fill.a * 100, 3) },
              r: shape.fillRule === "evenodd" ? 2 : 1,
            });
          }
          if (shape.stroke?.a > 0.0001 && Number(shape.strokeWidth || 0) > 0) {
            const strokeMatrix = matrixFromTransform(shape.transform);
            const strokeScale = (Math.hypot(strokeMatrix.a, strokeMatrix.b) + Math.hypot(strokeMatrix.c, strokeMatrix.d)) / 2;
            items.push({
              ty: "st",
              nm: "描边",
              c: lottieColorProperty(shape.stroke),
              o: { a: 0, k: round(shape.stroke.a * 100, 3) },
              w: { a: 0, k: round(Number(shape.strokeWidth) * strokeScale, 3) },
              lc: Math.max(1, Math.min(3, Number(shape.lineCap || 0) + 1)),
              lj: Math.max(1, Math.min(3, Number(shape.lineJoin || 0) + 1)),
              ml: Math.max(1, Number(shape.miterLimit || 4)),
            });
          }
          items.push({
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
          });
          groups.push({ ty: "gr", nm: `矢量 ${shapeIndex + 1}`, it: items });
        }
        return groups.length ? groups : null;
      };
const svgPathToLottiePaths = (pathData) => {
        const tokens = String(pathData || "").match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
        if (!tokens.length) return null;
        let tokenIndex = 0;
        let command = "";
        let current = { x: 0, y: 0 };
        let subpathStart = { x: 0, y: 0 };
        let path = null;
        let lastCubicControl = null;
        let lastQuadraticControl = null;
        const paths = [];
        const isCommand = (token) => /^[a-zA-Z]$/.test(token);
        const readNumber = () => {
          if (tokenIndex >= tokens.length || isCommand(tokens[tokenIndex])) throw new Error("invalid-svg-path");
          const value = Number(tokens[tokenIndex]);
          tokenIndex += 1;
          if (!Number.isFinite(value)) throw new Error("invalid-svg-path-number");
          return value;
        };
        const absolutePoint = (x, y, relative) => ({
          x: relative ? current.x + x : x,
          y: relative ? current.y + y : y,
        });
        const startSubpath = (point) => {
          current = point;
          subpathStart = { ...point };
          path = { v: [[point.x, point.y]], i: [[0, 0]], o: [[0, 0]], c: false };
          paths.push(path);
        };
        const appendCubic = (control1, control2, end) => {
          if (!path) startSubpath(current);
          const previousIndex = path.v.length - 1;
          path.o[previousIndex] = [control1.x - current.x, control1.y - current.y];
          path.v.push([end.x, end.y]);
          path.i.push([control2.x - end.x, control2.y - end.y]);
          path.o.push([0, 0]);
          current = end;
          lastCubicControl = control2;
          lastQuadraticControl = null;
        };
        const appendLine = (end) => {
          appendCubic(current, end, end);
          lastCubicControl = null;
          lastQuadraticControl = null;
        };
        const closeSubpath = () => {
          if (path) path.c = true;
          current = { ...subpathStart };
          lastCubicControl = null;
          lastQuadraticControl = null;
          command = "";
        };

        try {
          while (tokenIndex < tokens.length) {
            if (isCommand(tokens[tokenIndex])) {
              command = tokens[tokenIndex];
              tokenIndex += 1;
              if (command === "Z" || command === "z") {
                closeSubpath();
                continue;
              }
            }
            if (!command) throw new Error("missing-svg-path-command");
            const relative = command === command.toLowerCase();
            const upper = command.toUpperCase();
            if (upper === "M") {
              const point = absolutePoint(readNumber(), readNumber(), relative);
              startSubpath(point);
              command = relative ? "l" : "L";
              lastCubicControl = null;
              lastQuadraticControl = null;
            } else if (upper === "L") {
              appendLine(absolutePoint(readNumber(), readNumber(), relative));
            } else if (upper === "H") {
              const x = readNumber();
              appendLine({ x: relative ? current.x + x : x, y: current.y });
            } else if (upper === "V") {
              const y = readNumber();
              appendLine({ x: current.x, y: relative ? current.y + y : y });
            } else if (upper === "C") {
              const control1 = absolutePoint(readNumber(), readNumber(), relative);
              const control2 = absolutePoint(readNumber(), readNumber(), relative);
              const end = absolutePoint(readNumber(), readNumber(), relative);
              appendCubic(control1, control2, end);
            } else if (upper === "S") {
              const control1 = lastCubicControl
                ? { x: current.x * 2 - lastCubicControl.x, y: current.y * 2 - lastCubicControl.y }
                : { ...current };
              const control2 = absolutePoint(readNumber(), readNumber(), relative);
              const end = absolutePoint(readNumber(), readNumber(), relative);
              appendCubic(control1, control2, end);
            } else if (upper === "Q") {
              const quadratic = absolutePoint(readNumber(), readNumber(), relative);
              const end = absolutePoint(readNumber(), readNumber(), relative);
              const control1 = {
                x: current.x + (quadratic.x - current.x) * (2 / 3),
                y: current.y + (quadratic.y - current.y) * (2 / 3),
              };
              const control2 = {
                x: end.x + (quadratic.x - end.x) * (2 / 3),
                y: end.y + (quadratic.y - end.y) * (2 / 3),
              };
              appendCubic(control1, control2, end);
              lastCubicControl = null;
              lastQuadraticControl = quadratic;
            } else if (upper === "T") {
              const quadratic = lastQuadraticControl
                ? { x: current.x * 2 - lastQuadraticControl.x, y: current.y * 2 - lastQuadraticControl.y }
                : { ...current };
              const end = absolutePoint(readNumber(), readNumber(), relative);
              const control1 = {
                x: current.x + (quadratic.x - current.x) * (2 / 3),
                y: current.y + (quadratic.y - current.y) * (2 / 3),
              };
              const control2 = {
                x: end.x + (quadratic.x - end.x) * (2 / 3),
                y: end.y + (quadratic.y - end.y) * (2 / 3),
              };
              appendCubic(control1, control2, end);
              lastCubicControl = null;
              lastQuadraticControl = quadratic;
            } else if (upper === "A") {
              const radiusX = readNumber();
              const radiusY = readNumber();
              const rotation = readNumber();
              const largeArc = readNumber() !== 0;
              const sweep = readNumber() !== 0;
              const end = absolutePoint(readNumber(), readNumber(), relative);
              const curves = lottieArcCubics(current, end, radiusX, radiusY, rotation, largeArc, sweep);
              if (!curves.length) appendLine(end);
              else for (const curve of curves) appendCubic(curve.control1, curve.control2, curve.end);
              lastCubicControl = null;
              lastQuadraticControl = null;
            } else {
              throw new Error("unsupported-svg-path-command");
            }
          }
        } catch (_error) {
          return null;
        }
        return paths
          .filter((entry) => entry.v.length > 0)
          .map((entry) => ({
            v: entry.v.map(([x, y]) => [lottiePathNumber(x), lottiePathNumber(y)]),
            i: entry.i.map(([x, y]) => [lottiePathNumber(x), lottiePathNumber(y)]),
            o: entry.o.map(([x, y]) => [lottiePathNumber(x), lottiePathNumber(y)]),
            c: entry.c,
          }));
      };
const lottiePathNumber = (value) => round(Number(value) || 0, 3);
const lottieArcCubics = (start, end, radiusX, radiusY, rotationDegrees, largeArc, sweep) => {
        let rx = Math.abs(Number(radiusX) || 0);
        let ry = Math.abs(Number(radiusY) || 0);
        if (rx <= 0.000001 || ry <= 0.000001) return [];
        const phi = ((Number(rotationDegrees) || 0) * Math.PI) / 180;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const dx = (start.x - end.x) / 2;
        const dy = (start.y - end.y) / 2;
        const xPrime = cosPhi * dx + sinPhi * dy;
        const yPrime = -sinPhi * dx + cosPhi * dy;
        const radiusScale = (xPrime * xPrime) / (rx * rx) + (yPrime * yPrime) / (ry * ry);
        if (radiusScale > 1) {
          const scale = Math.sqrt(radiusScale);
          rx *= scale;
          ry *= scale;
        }
        const numerator = Math.max(
          0,
          rx * rx * ry * ry - rx * rx * yPrime * yPrime - ry * ry * xPrime * xPrime,
        );
        const denominator = Math.max(
          0.000001,
          rx * rx * yPrime * yPrime + ry * ry * xPrime * xPrime,
        );
        const centerSign = Boolean(largeArc) === Boolean(sweep) ? -1 : 1;
        const centerScale = centerSign * Math.sqrt(numerator / denominator);
        const centerPrimeX = centerScale * ((rx * yPrime) / ry);
        const centerPrimeY = centerScale * (-(ry * xPrime) / rx);
        const centerX = cosPhi * centerPrimeX - sinPhi * centerPrimeY + (start.x + end.x) / 2;
        const centerY = sinPhi * centerPrimeX + cosPhi * centerPrimeY + (start.y + end.y) / 2;
        const vectorAngle = (ux, uy, vx, vy) =>
          Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
        const startUx = (xPrime - centerPrimeX) / rx;
        const startUy = (yPrime - centerPrimeY) / ry;
        const endUx = (-xPrime - centerPrimeX) / rx;
        const endUy = (-yPrime - centerPrimeY) / ry;
        const startAngle = Math.atan2(startUy, startUx);
        let sweepAngle = vectorAngle(startUx, startUy, endUx, endUy);
        if (!sweep && sweepAngle > 0) sweepAngle -= Math.PI * 2;
        if (sweep && sweepAngle < 0) sweepAngle += Math.PI * 2;
        const segmentCount = Math.max(1, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 2)));
        const segmentAngle = sweepAngle / segmentCount;
        const pointAt = (angle) => ({
          x: centerX + cosPhi * rx * Math.cos(angle) - sinPhi * ry * Math.sin(angle),
          y: centerY + sinPhi * rx * Math.cos(angle) + cosPhi * ry * Math.sin(angle),
        });
        const derivativeAt = (angle) => ({
          x: -cosPhi * rx * Math.sin(angle) - sinPhi * ry * Math.cos(angle),
          y: -sinPhi * rx * Math.sin(angle) + cosPhi * ry * Math.cos(angle),
        });
        const curves = [];
        let currentPoint = start;
        for (let index = 0; index < segmentCount; index += 1) {
          const fromAngle = startAngle + index * segmentAngle;
          const toAngle = fromAngle + segmentAngle;
          const alpha = (4 / 3) * Math.tan(segmentAngle / 4);
          const fromDerivative = derivativeAt(fromAngle);
          const toDerivative = derivativeAt(toAngle);
          const nextPoint = index === segmentCount - 1 ? end : pointAt(toAngle);
          curves.push({
            start: currentPoint,
            control1: {
              x: currentPoint.x + alpha * fromDerivative.x,
              y: currentPoint.y + alpha * fromDerivative.y,
            },
            control2: {
              x: nextPoint.x - alpha * toDerivative.x,
              y: nextPoint.y - alpha * toDerivative.y,
            },
            end: nextPoint,
          });
          currentPoint = nextPoint;
        }
        return curves;
      };
const transformLottiePath = (path, transform) => {
        const matrix = matrixFromTransform(transform);
        const transformVector = ([x, y]) => [
          lottiePathNumber(matrix.a * x + matrix.c * y),
          lottiePathNumber(matrix.b * x + matrix.d * y),
        ];
        return {
          v: path.v.map(([x, y]) => [
            lottiePathNumber(matrix.a * x + matrix.c * y + matrix.e),
            lottiePathNumber(matrix.b * x + matrix.d * y + matrix.f),
          ]),
          i: path.i.map(transformVector),
          o: path.o.map(transformVector),
          c: Boolean(path.c),
        };
      };
const lottieColorProperty = (color) => ({
        a: 0,
        k: [round(color.r, 4), round(color.g, 4), round(color.b, 4), 1],
      });
const createPagExportYield = () => {
        let lastYield = -Infinity;
        return async (progress = null) => {
          const now = performance.now();
          if (progress !== 0 && progress !== 1 && now - lastYield < 24) return;
          // Yield on elapsed work, not every frame/layer; hidden Figma paints are not a clock.
          await new Promise((resolve) => window.setTimeout(resolve, 0));
          lastYield = performance.now();
        };
      };
const compactPagTransformTracks = async (animation) => {
        const groups = [animation.layers, ...(animation.assets || []).map((a) => a.layers)].filter(Boolean);
        const total = groups.reduce((n, layers) => n + layers.length, 0); let completed = 0;
        for (const layers of groups) for (let offset = 0; offset < layers.length; offset += 1) {
          const batch = layers.slice(offset, offset + 1);
          await updateExportModal("正在导出 PAG", `正在整理原生动画 · ${completed + batch.length}/${total}`, 0.46 + 0.14 * (completed + batch.length) / Math.max(1, total));
          // PAG codec emits hold/linear keys. Preserve curved samples instead of
          // feeding Lottie Bezier fits to a codec that does not encode their easing.
          for (const layer of batch) for (const [name, property] of Object.entries(layer.ks || {})) {
            if (property?.a !== 1 || !Array.isArray(property.k) || property.k.some((key) => key.h !== 1)) continue;
            const keys = property.k, start = keys[0].t, end = keys[keys.length - 1].t;
            const values = []; let cursor = 0;
            for (let frame = start; frame < end; frame++) {
              while (cursor + 1 < keys.length && keys[cursor + 1].t <= frame) cursor++;
              values.push(keys[cursor].s);
            }
            if (values.length) layer.ks[name] = lottiePropertyFromSamples(values, start, { allowLinear: true, preserveVisibility: name === "o" });
          }
          completed += batch.length;
        }
      };
const preparePagNativeImages = async (composition, quality, originals = null, progressRange = [0.62, 0.78]) => {
        const sources = originals || new Map(), scales = pagImageDisplayScales(composition);
        const imageAssets = (composition.assets || []).filter((asset) => asset.p); let completed = 0;
        for (const asset of imageAssets) {
          await updateExportModal("正在导出 PAG", `正在编码共享素材 · ${++completed}/${imageAssets.length}`, progressRange[0] + (progressRange[1] - progressRange[0]) * completed / Math.max(1, imageAssets.length));
          // Composite frame bytes already use the requested quality and sampling size.
          if (asset.pagEncodedFrame) continue;
          if (!sources.has(asset.id)) sources.set(asset.id, asset.p);
          const ratio = Math.min(1, (scales.get(asset.id) || 1) * 1.1, 4096 / Math.max(asset.w, asset.h));
          asset.pagPixelWidth = Math.max(1, Math.round(asset.w * ratio));
          asset.pagPixelHeight = Math.max(1, Math.round(asset.h * ratio));
          asset.pagScaleFactor = asset.pagPixelWidth / asset.w;
          asset.pagBytes = await pagReencodeImage(sources.get(asset.id), asset.pagPixelWidth, asset.pagPixelHeight, quality);
        }
        return sources;
      };
const pagReencodeImage = async (url, width, height, quality) => {
        const canvas = document.createElement("canvas");
        const image = new Image();
        try {
          await pagWithTimeout(new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("PAG 素材读取失败。")); image.src = url;
          }), "PAG 素材读取");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) throw new Error("无法创建 PAG 素材画布。");
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
          ctx.drawImage(image, 0, 0, width, height);
          const blob = await pagWithTimeout(new Promise((resolve, reject) => {
            canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PAG 素材编码失败。")), "image/webp", quality);
          }), "PAG 素材编码");
          if (blob.type !== "image/webp") throw new Error("当前环境不支持 PAG WebP 素材编码。");
          return new Uint8Array(await pagWithTimeout(blob.arrayBuffer(), "PAG 素材编码"));
        } finally {
          canvas.width = canvas.height = 1;
          if (image) { image.onload = image.onerror = null; image.src = ""; }
        }
      };
const pagWithTimeout = (operation, label, timeoutMs = 30000) => new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error(`${label}超时，请降低导出尺寸后重试。`)), timeoutMs);
        Promise.resolve(operation).then((result) => { window.clearTimeout(timer); resolve(result); },
          (error) => { window.clearTimeout(timer); reject(error); });
      });
const pagImageDisplayScales = (composition) => {
        const assets = new Map((composition.assets || []).map((a) => [a.id, a])), scales = new Map();
        const visit = (layers, inherited = 1, ancestors = new Set()) => {
          for (const layer of layers || []) {
            const property = layer.ks?.s, samples = property?.a === 1 ? property.k.map((k) => k.s) : [property?.k || [100, 100]];
            const scale = inherited * Math.max(...samples.map((v) => Math.max(Math.abs(v[0]), Math.abs(v[1])) / 100));
            const asset = assets.get(layer.refId);
            if (asset?.p) scales.set(asset.id, Math.max(scales.get(asset.id) || 0, scale));
            else if (asset?.layers && !ancestors.has(asset.id)) visit(asset.layers, scale, new Set([...ancestors, asset.id]));
          }
        };
        visit(composition.layers); return scales;
      };
const buildPagNativePlan = async (options, progressStart = 0.78, progressEnd = 0.82) => {
        const records = createPagNativeFileRecords({ ...options, chunked: true });
        const total = (options.composition.assets || []).reduce((n, a) => n + (a.p ? 1 : a.pagVideo ? 1 : a.pagSequence ? Math.ceil(a.pagSequence.length / 16) : Math.ceil((a.layers || []).length / 4)), 0)
          + Math.ceil((options.composition.layers || []).length / 4);
        let done = 0, next;
        while (!(next = records.next()).done) {
          await updateExportModal("正在导出 PAG", "", progressStart + (progressEnd - progressStart) * Math.min(1, ++done / Math.max(1, total)));
        }
        return next.value;
      };
const createPagNativeFileRecords = function* ({ composition, size, fps, frameCount, chunked = false }) {
        const writer = () => createPagWriter({ chunked });
        const body = writer(), images = new Map(), comps = new Map(); let nextId = 2, layerId = 1;
        for (const asset of composition.assets || []) {
          if (asset.p) images.set(asset.id, nextId++);
          else if (asset.layers || asset.pagSequence || asset.pagVideo) comps.set(asset.id, nextId++);
        }
        for (const asset of composition.assets || []) {
          if (!asset.p) continue;
          const w = writer(), bytes = asset.pagBytes || parseDataUrlBytes(asset.p).bytes;
          w.uint(images.get(asset.id)); w.uint(bytes.length); w.bytes(bytes); w.float(asset.pagScaleFactor || 1); w.sint(asset.w); w.sint(asset.h); w.sint(0); w.sint(0); body.tag(49, w.finish()); yield;
        }
        const writeLayer = (layer) => {
          const w = writer(), type = layer.ty === 4 ? 4 : layer.ty === 2 ? 5 : layer.ty === 0 ? 6 : layer.ty === 3 ? 1 : 0;
          if (!type) throw new Error(`PAG 图层类型 ${layer.ty} 无法直接编码。`);
          const id = layerId++, ip = Math.max(0, Math.round(layer.ip || 0)), op = Math.min(frameCount, Math.round(layer.op ?? frameCount));
          w.bytes(Uint8Array.of(type)); w.uint(id);
          w.tag(6, pagAttributeBlock([{ kind: "flag", value: true }, { kind: "flag", value: !!layer.ao }, pagValue("uint", 0, 0), pagValue("uint", 0, 0), pagValue("uint", ip, 0), pagValue("byte", layer.bm || 0, 0), pagValue("byte", layer.tt || 0, 0), pagProperty("float", layer.tm || { a: 0, k: 0 }, 0), { kind: "fixed", type: "uint", value: Math.max(1, op - ip) }]));
          w.tag(13, pagTransformBytes(layer.ks));
          for (const [n, mask] of (layer.masksProperties || []).entries()) w.tag(14, pagAttributeBlock([{ kind: "fixed", type: "uint", value: n + 1 }, { kind: "flag", value: !!mask.inv }, pagValue("byte", ({ a: 1, s: 2, i: 3, n: 0 })[mask.mode] ?? 1, 1), pagProperty("path", mask.pt, null), pagOpacity(mask.o), pagProperty("float", mask.x || { a: 0, k: 0 }, 0)]));
          if (type === 4) w.bytes(pagShapeBytes(layer.shapes).slice(0, -2));
          if (type === 5) { const ref = writer(); if (!images.has(layer.refId)) throw new Error("PAG 图片引用缺失。"); ref.uint(images.get(layer.refId)); w.tag(11, ref.finish()); }
          if (type === 6) { const ref = writer(); if (!comps.has(layer.refId)) throw new Error("PAG 合成引用缺失。"); ref.uint(comps.get(layer.refId)); ref.uint(Math.max(0, Math.round(layer.st || 0))); w.tag(12, ref.finish()); }
          w.u16(0); return w.finish();
        };
        const writeComposition = function* (id, width, height, layers, sequence = null, sequenceSize = null, sequenceFps = fps, video = null) {
          const w = writer(); w.uint(id); if (video) w.bytes(Uint8Array.of(1));
          w.tag(3, pagCompositionAttributes(width, height, sequence || video ? sequenceFps : fps, video ? video.frames.length : sequence ? sequence.length : frameCount));
          if (video) {
            const encoded = writer(); encoded.bytes(pagVideoSequenceBytes(video, sequenceSize?.width || width, sequenceSize?.height || height, sequenceFps));
            w.tag(51, encoded.finish()); yield;
          } else if (sequence) {
            const s = writer(), flags = pagBitWriter(); s.sint(sequenceSize?.width || width); s.sint(sequenceSize?.height || height); s.float(sequenceFps); s.uint(sequence.length);
            for (const frame of sequence) flags.bits(frame && frame.keyframe !== false ? 1 : 0, 1); s.bytes(flags.finish());
            for (let n = 0; n < sequence.length; n++) {
              const frame = sequence[n], rectangles = frame ? frame.bitmaps || [{ x: 0, y: 0, bytes: frame }] : [];
              s.uint(rectangles.length);
              for (const rect of rectangles) { s.sint(rect.x); s.sint(rect.y); s.uint(rect.bytes.length); s.bytes(rect.bytes); }
              if (n % 16 === 0) yield;
            }
            w.tag(46, s.finish());
          } else for (let n = 0; n < (layers || []).length; n++) {
            w.tag(5, writeLayer(layers[n])); if (n % 4 === 0) yield;
          }
          w.u16(0); body.tag(video ? 50 : sequence ? 45 : 2, w.finish());
        };
        for (const asset of composition.assets || []) if (comps.has(asset.id)) yield* writeComposition(comps.get(asset.id), asset.w || size.width, asset.h || size.height, asset.layers, asset.pagSequence, { width: asset.pagPixelWidth, height: asset.pagPixelHeight }, asset.pagSequenceFps || fps, asset.pagVideo);
        yield* writeComposition(1, size.width, size.height, composition.layers); body.u16(0);
        const data = body.finish(), file = writer(); file.bytes(Uint8Array.of(80, 65, 71, 1)); file.u32(data.length); file.bytes(Uint8Array.of(85)); file.bytes(data); return file.finish();
      };
const parseDataUrlBytes = (dataUrl) => {
        const match = String(dataUrl || "").match(/^data:([^;,]+);base64,(.+)$/);
        if (!match) throw new Error("图片数据格式无效。");
        return {
          mimeType: match[1],
          bytes: base64ToBytes(match[2]),
        };
      };
const base64ToBytes = (base64) => {
        const clean = String(base64 || "").replace(/\s/g, "");
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      };
const createPagWriter = ({ chunked = false } = {}) => {
        const parts = [];
        let length = 0, pending = null, used = 0;
        const flush = () => { if (used) parts.push(pending.slice(0, used)); pending = null; used = 0; };
        const bytes = (data) => {
          if (!data.length) return;
          length += data.length;
          if (chunked && ArrayBuffer.isView(data) && data.length < 1024) {
            if (!pending || used + data.length > 1024) { flush(); pending = new Uint8Array(1024); }
            pending.set(data, used); used += data.length;
          } else { if (chunked) flush(); parts.push(data); }
        };
        const uint = (value) => {
          if (!Number.isSafeInteger(value) || value < 0) throw new Error("PAG 整数超出范围。");
          const data = [];
          do { const next = value % 128; value = Math.floor(value / 128); data.push(next | (value ? 128 : 0)); } while (value);
          bytes(Uint8Array.from(data));
        };
        const u16 = (value) => bytes(Uint8Array.of(value & 255, (value >>> 8) & 255));
        const u32 = (value) => { const data = new Uint8Array(4); new DataView(data.buffer).setUint32(0, value, true); bytes(data); };
        const float = (value) => { const data = new Uint8Array(4); new DataView(data.buffer).setFloat32(0, value, true); bytes(data); };
        const finish = () => {
          if (chunked) { flush(); return { length, parts }; }
          const data = new Uint8Array(length); let offset = 0;
          for (const part of parts) { data.set(part, offset); offset += part.length; } return data;
        };
        const tag = (code, data) => { u16((code << 6) | Math.min(63, data.length)); if (data.length >= 63) u32(data.length); bytes(data); };
        return { bytes, uint, sint: (value) => uint(Math.abs(value) * 2 + (value < 0 ? 1 : 0)), u16, u32, float, tag, finish };
      };
const pagBitWriter = () => {
        const data = []; let position = 0;
        const bits = (value, count) => { for (let n = 0; n < count; n++, position++) { const i = position >>> 3; data[i] = (data[i] || 0) | ((Math.floor(value / 2 ** n) & 1) << (position & 7)); } };
        const list = (values, signed = false) => {
          let width = 1;
          for (const v of values) width = Math.max(width, Math.max(1, Math.floor(Math.log2(Math.max(1, Math.abs(v)))) + 1) + (signed ? 1 : 0));
          if (width > 32) throw new Error("PAG 路径坐标超出范围。");
          bits(width - 1, 5);
          for (const v of values) bits(v < 0 ? 2 ** width + v : v, width);
        };
        return { bits, list, finish: () => Uint8Array.from(data) };
      };
const pagAttributeBlock = (attributes) => {
        const flags = pagBitWriter(), w = createPagWriter();
        const value = (type, v) => {
          if (type === "point") { w.float(v[0]); w.float(v[1]); }
          else if (type === "byte") w.bytes(Uint8Array.of(v));
          else if (type === "uint") w.uint(v);
          else if (type === "string") { w.bytes(new TextEncoder().encode(v)); w.bytes(Uint8Array.of(0)); }
          else if (type === "path") w.bytes(pagPathBytes(v));
          else if (type === "color") w.bytes(Uint8Array.from(v.slice(0, 3).map((c) => Math.round(clamp(c, 0, 1) * 255))));
          else if (type === "gradient") {
            const colors = v.colors || [], alpha = v.alpha || [];
            w.uint(alpha.length); w.uint(colors.length);
            for (const stop of alpha) { w.u16(Math.round(stop[0] / 0.00002)); w.u16(25000); w.bytes(Uint8Array.of(Math.round(clamp(stop[1], 0, 1) * 255))); }
            for (const stop of colors) { w.u16(Math.round(stop[0] / 0.00002)); w.u16(25000); value("color", stop.slice(1)); }
          } else w.float(v);
        };
        for (const a of attributes) {
          if (a.kind === "flag") { flags.bits(a.value ? 1 : 0, 1); continue; }
          if (a.kind === "fixed") { value(a.type, a.value); continue; }
          if (a.kind === "custom") { flags.bits(a.value?.length ? 1 : 0, 1); if (a.value?.length) w.bytes(a.value); continue; }
          const property = a.property, animated = property?.a === 1 && property.k?.length > 1;
          const map = a.map || ((v) => v);
          const scalar = (v) => a.type === "point" || a.type === "color" || a.type === "gradient" ? v : Array.isArray(v) ? v[0] : v;
          const raw = property ? (animated ? property.k[0].s : property.k) : a.value;
          const mapped = map(scalar(raw));
          const exists = animated || JSON.stringify(mapped) !== JSON.stringify(a.default);
          flags.bits(exists ? 1 : 0, 1);
          if (!exists) continue;
          if (a.kind === "value") { value(a.type, mapped); continue; }
          flags.bits(animated ? 1 : 0, 1);
          if (animated && a.spatial) flags.bits(0, 1);
          if (!animated) { value(a.type, mapped); continue; }
          const keys = property.k, count = keys.length - 1, interpolation = pagBitWriter();
          w.uint(count);
          for (let n = 0; n < count; n++) interpolation.bits(a.type === "path" || keys[n].h === 1 ? 3 : 1, 2);
          w.bytes(interpolation.finish());
          for (const key of keys) w.uint(Math.max(0, Math.round(key.t)));
          const values = keys.map((key) => map(scalar(key.s)));
          if (a.spatial) { const b = pagBitWriter(); b.list(values.flat().map((v) => Math.round(v / 0.05)), true); b.bits(0, 5); w.bytes(b.finish()); }
          else if (a.type === "byte") { const b = pagBitWriter(); b.list(values); b.bits(0, 5); w.bytes(b.finish()); }
          else for (const v of values) value(a.type, v);
          // Even linear/hold keyframes store the empty temporal-ease bit list.
          if (!a.spatial && a.type !== "byte") w.bytes(Uint8Array.of(0));
        }
        const result = createPagWriter(); result.bytes(flags.finish()); result.bytes(w.finish()); return result.finish();
      };
const pagPathBytes = (path) => {
        const w = createPagWriter(), b = pagBitWriter(), points = [], verbs = [];
        const paths = Array.isArray(path) ? path : [path];
        for (const p of paths) {
          if (!p?.v?.length) continue;
          verbs.push(1); points.push(...p.v[0]);
          const count = p.v.length, segments = p.c ? count : count - 1;
          for (let n = 0; n < segments; n++) {
            const next = (n + 1) % count, from = p.v[n], to = p.v[next], out = p.o?.[n] || [0, 0], into = p.i?.[next] || [0, 0];
            if (out.every((v) => Math.abs(v) < 0.0001) && into.every((v) => Math.abs(v) < 0.0001)) { verbs.push(2); points.push(...to); }
            else { verbs.push(7); points.push(from[0] + out[0], from[1] + out[1], to[0] + into[0], to[1] + into[1], ...to); }
          }
          if (p.c) verbs.push(0);
        }
        w.uint(verbs.length);
        if (verbs.length) { for (const verb of verbs) b.bits(verb, 3); b.list(points.map((v) => Math.round(v / 0.05)), true); w.bytes(b.finish()); }
        return w.finish();
      };
const pagProperty = (type, property, fallback, map = null, spatial = false) => ({ type, property, default: fallback, map, spatial });
const pagValue = (type, value, fallback) => ({ kind: "value", type, value, default: fallback });
const pagOpacity = (property) => pagProperty("byte", property || { a: 0, k: 100 }, 255, (v) => Math.round(clamp(v / 100, 0, 1) * 255));
const pagTransformBytes = (ks = {}, group = false, children = null) => {
        const attributes = [pagPoint(ks.a), pagPoint(ks.p), pagPoint(ks.s || { a: 0, k: [100, 100] }, [1, 1], 0.01, false)];
        if (group) attributes.unshift(pagValue("byte", 0, 0));
        else attributes.splice(2, 0, pagProperty("float", { a: 0, k: 0 }, 0), pagProperty("float", { a: 0, k: 0 }, 0));
        if (group) attributes.push(pagProperty("float", ks.sk || { a: 0, k: 0 }, 0), pagProperty("float", ks.sa || { a: 0, k: 0 }, 0));
        attributes.push(pagProperty("float", ks.r || { a: 0, k: 0 }, 0), pagOpacity(ks.o));
        if (group) attributes.push({ kind: "custom", value: children });
        return pagAttributeBlock(attributes);
      };
const pagPoint = (property, fallback = [0, 0], scale = 1, spatial = true) => pagProperty("point", property || { a: 0, k: fallback }, fallback, (v) => v.slice(0, 2).map((n) => n * scale), spatial);
const pagShapeBytes = (shapes) => {
        const w = createPagWriter();
        for (const shape of shapes || []) {
          if (shape.hd || shape.ty === "tr") continue;
          if (shape.ty === "gr") { w.tag(15, pagTransformBytes((shape.it || []).find((v) => v.ty === "tr"), true, pagShapeBytes(shape.it))); }
          else if (shape.ty === "sh") w.tag(19, pagAttributeBlock([pagProperty("path", shape.ks, null)]));
          else if (shape.ty === "re" || shape.ty === "el") {
            const a = [{ kind: "flag", value: shape.d === 3 }, pagPoint(shape.s, [100, 100], 1, false), pagPoint(shape.p)];
            if (shape.ty === "re") a.push(pagProperty("float", shape.r || { a: 0, k: 0 }, 0));
            w.tag(shape.ty === "re" ? 16 : 17, pagAttributeBlock(a));
          } else if (shape.ty === "fl" || shape.ty === "st") {
            const a = [pagValue("byte", 0, 0), pagValue("byte", shape.ty === "st" ? 1 : 0, 0)];
            if (shape.ty === "fl") a.push(pagValue("byte", shape.r === 2 ? 1 : 0, 0));
            else a.push(pagValue("byte", (shape.lc || 1) - 1, 0), pagValue("byte", (shape.lj || 1) - 1, 0), pagProperty("float", { a: 0, k: shape.ml || 4 }, 4));
            a.push(pagProperty("color", shape.c, shape.ty === "fl" ? [1, 0, 0] : [1, 1, 1], (v) => v.slice(0, 3)), pagOpacity(shape.o));
            if (shape.ty === "st") a.push(pagProperty("float", shape.w, 2), { kind: "custom", value: null });
            w.tag(shape.ty === "fl" ? 20 : 21, pagAttributeBlock(a));
          } else if (shape.ty === "gf" || shape.ty === "gs") {
            const g = shape.g?.k?.k || [], count = shape.g?.p || 0, colors = [], alpha = [];
            for (let n = 0; n < count; n++) colors.push(g.slice(n * 4, n * 4 + 4));
            for (let n = count * 4; n < g.length; n += 2) alpha.push(g.slice(n, n + 2));
            const a = [pagValue("byte", 0, 0), pagValue("byte", shape.ty === "gs" ? 1 : 0, 0)];
            if (shape.ty === "gf") a.push(pagValue("byte", shape.r === 2 ? 1 : 0, 0));
            a.push(pagValue("byte", shape.t === 2 ? 1 : 0, 0), pagPoint(shape.s), pagPoint(shape.e, [100, 0]), pagProperty("gradient", { a: 0, k: { colors, alpha } }, null), pagOpacity(shape.o));
            if (shape.ty === "gs") a.push(pagProperty("float", shape.w, 2), pagValue("byte", (shape.lc || 1) - 1, 0), pagValue("byte", (shape.lj || 1) - 1, 0), pagProperty("float", { a: 0, k: shape.ml || 4 }, 4), { kind: "custom", value: null });
            w.tag(shape.ty === "gf" ? 22 : 23, pagAttributeBlock(a));
          } else throw new Error(`PAG 暂不支持矢量类型 ${shape.ty}，请反馈该工程。`);
        }
        w.u16(0); return w.finish();
      };
const pagCompositionAttributes = (width, height, fps, frames) => {
        const w = createPagWriter(); w.sint(width); w.sint(height); w.uint(frames); w.float(fps); w.bytes(Uint8Array.of(0, 0, 0)); return w.finish();
      };
const pagVideoSequenceBytes = (video, width, height, fps) => {
        if (!video.sps?.length || !video.pps?.length || (video.sps[0] & 31) !== 7 || (video.pps[0] & 31) !== 8 || !video.frames?.length || !video.frames[0].key)
          throw new Error("PAG 视频编码结果不完整。");
        const w = createPagWriter(), flags = pagBitWriter(); w.sint(width); w.sint(height); w.float(fps);
        w.sint(video.alphaStartX); w.sint(video.alphaStartY || 0);
        w.uint(video.sps.length); w.bytes(video.sps); w.uint(video.pps.length); w.bytes(video.pps);
        w.uint(video.frames.length);
        for (const frame of video.frames) flags.bits(frame.key ? 1 : 0, 1); w.bytes(flags.finish());
        for (const [n, frame] of video.frames.entries()) {
          if (frame.index !== n || ![1, 5].includes(frame.data[0] & 31)) throw new Error("PAG 视频帧顺序无效。");
          w.uint(frame.index); w.uint(frame.data.length); w.bytes(frame.data);
        }
        w.uint(0); return w.finish();
      };
const pagBlobFromPlan = async (plan) => {
        // Traverse references rather than concatenate sequence/composition/file-sized arrays.
        const stack = [{ parts: plan.parts, index: 0 }], chunks = []; let processed = 0, steps = 0;
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.index >= top.parts.length) { stack.pop(); continue; }
          const part = top.parts[top.index++];
          if (part.parts) stack.push({ parts: part.parts, index: 0 });
          else { chunks.push(part); processed += part.length; }
          if (++steps % 128 === 0) await updateExportModal("正在导出 PAG", "", 0.9 + 0.08 * processed / Math.max(1, plan.length));
        }
        const blob = new Blob(chunks, { type: "application/octet-stream" });
        chunks.length = 0;
        if (blob.size !== plan.length) throw new Error("PAG 文件写入不完整，请重试。");
        return blob;
      };
const indexedPngDataUrlForCanvas = async (ctx, width, height, options = {}) => {
        const imageData = options.imageData || ctx.getImageData(0, 0, width, height).data;
        const requestedMaxColors = Math.round(Number(options.maxColors));
        const maxColors = Number.isFinite(requestedMaxColors)
          ? clamp(requestedMaxColors, 2, SVGA_INDEXED_PNG_MAX_COLORS)
          : SVGA_INDEXED_PNG_MAX_COLORS;
        const colorByKey = new Map();
        let transparentPixels = 0;
        for (let pixel = 0; pixel < width * height; pixel += 1) {
          const offset = pixel * 4;
          const red = imageData[offset];
          const green = imageData[offset + 1];
          const blue = imageData[offset + 2];
          const alpha = imageData[offset + 3];
          if (alpha === 0) {
            transparentPixels += 1;
            if (
              options.adaptive !== true &&
              colorByKey.size + 1 > maxColors
            ) {
              return "";
            }
            continue;
          }
          const key = indexedPngColorKey(red, green, blue, alpha);
          const existing = colorByKey.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            colorByKey.set(key, { key, red, green, blue, alpha, count: 1 });
            if (
              options.adaptive !== true &&
              colorByKey.size + (transparentPixels > 0 ? 1 : 0) > maxColors
            ) {
              // Exact-index attempts only need to know that the palette cannot
              // fit. Stop before a photographic image creates a huge color map.
              return "";
            }
          }
        }

        const colors = Array.from(colorByKey.values());
        const palette = transparentPixels > 0 ? [[0, 0, 0, 0]] : [];
        const indexBySourceColor = new Map();
        const availableColors = maxColors - palette.length;
        if (colors.length <= availableColors) {
          for (const color of colors) {
            indexBySourceColor.set(color.key, palette.length);
            palette.push([color.red, color.green, color.blue, color.alpha]);
          }
        } else {
          if (options.adaptive !== true) return "";
          const adaptive = adaptiveIndexedPngPalette(colors, availableColors);
          const paletteOffset = palette.length;
          for (const color of adaptive.palette) palette.push(color);
          for (const [key, index] of adaptive.indexBySourceColor) {
            indexBySourceColor.set(key, index + paletteOffset);
          }
        }
        if (!palette.length || palette.length > maxColors) return "";

        const indices = new Uint8Array(width * height);
        for (let pixel = 0; pixel < width * height; pixel += 1) {
          const offset = pixel * 4;
          const red = imageData[offset];
          const green = imageData[offset + 1];
          const blue = imageData[offset + 2];
          const alpha = imageData[offset + 3];
          indices[pixel] = alpha === 0
            ? 0
            : indexBySourceColor.get(indexedPngColorKey(red, green, blue, alpha)) || 0;
        }

        const header = new Uint8Array(13);
        const headerView = new DataView(header.buffer);
        headerView.setUint32(0, width, false);
        headerView.setUint32(4, height, false);
        header[8] = 8;
        header[9] = 3;
        const paletteBytes = new Uint8Array(palette.length * 3);
        let lastTransparentIndex = -1;
        palette.forEach(([red, green, blue, alpha], index) => {
          paletteBytes[index * 3] = red;
          paletteBytes[index * 3 + 1] = green;
          paletteBytes[index * 3 + 2] = blue;
          if (alpha < 255) lastTransparentIndex = index;
        });
        const transparencyBytes = lastTransparentIndex >= 0
          ? new Uint8Array(palette.slice(0, lastTransparentIndex + 1).map((entry) => entry[3]))
          : null;
        const compressedPixels = await publicPngDeflate(indexedPngScanlines(indices, width, height));
        const parts = [
          new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
          pngChunk("IHDR", header),
          pngChunk("PLTE", paletteBytes),
        ];
        if (transparencyBytes) parts.push(pngChunk("tRNS", transparencyBytes));
        parts.push(pngChunk("IDAT", compressedPixels), pngChunk("IEND"));
        const totalLength = parts.reduce((total, part) => total + part.length, 0);
        const output = new Uint8Array(totalLength);
        let outputOffset = 0;
        for (const part of parts) {
          output.set(part, outputOffset);
          outputOffset += part.length;
        }
        return `data:image/png;base64,${bytesToBase64(output)}`;
      };
const SVGA_INDEXED_PNG_MAX_COLORS = 256;
const bytesToBase64 = (bytes) => {
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
      };
const pngChunk = (type, data = new Uint8Array()) => {
        const typeBytes = new TextEncoder().encode(type);
        const crcInput = new Uint8Array(typeBytes.length + data.length);
        crcInput.set(typeBytes, 0);
        crcInput.set(data, typeBytes.length);
        const output = new Uint8Array(12 + data.length);
        const view = new DataView(output.buffer);
        view.setUint32(0, data.length, false);
        output.set(typeBytes, 4);
        output.set(data, 8);
        view.setUint32(8 + data.length, pngCrc32(crcInput), false);
        return output;
      };
const pngCrc32 = (bytes) => {
        let crc = 0xffffffff;
        for (const byte of bytes) {
          crc ^= byte;
          for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
          }
        }
        return (crc ^ 0xffffffff) >>> 0;
      };
const indexedPngScanlines = (indices, width, height) => {
        const output = new Uint8Array((width + 1) * height);
        const candidates = Array.from({ length: 5 }, () => new Uint8Array(width));
        for (let y = 0; y < height; y += 1) {
          const rowOffset = y * width;
          const previousOffset = (y - 1) * width;
          let bestFilter = 0;
          let bestScore = Number.POSITIVE_INFINITY;
          for (let filter = 0; filter <= 4; filter += 1) {
            const candidate = candidates[filter];
            let score = 0;
            for (let x = 0; x < width; x += 1) {
              const value = indices[rowOffset + x];
              const left = x > 0 ? indices[rowOffset + x - 1] : 0;
              const up = y > 0 ? indices[previousOffset + x] : 0;
              const upLeft = x > 0 && y > 0 ? indices[previousOffset + x - 1] : 0;
              const predictor = filter === 1
                ? left
                : filter === 2
                  ? up
                  : filter === 3
                    ? Math.floor((left + up) / 2)
                    : filter === 4
                      ? pngPaethPredictor(left, up, upLeft)
                      : 0;
              const filtered = (value - predictor + 256) & 255;
              candidate[x] = filtered;
              score += Math.abs(filtered < 128 ? filtered : filtered - 256);
            }
            if (score < bestScore) {
              bestScore = score;
              bestFilter = filter;
            }
          }
          const outputOffset = y * (width + 1);
          output[outputOffset] = bestFilter;
          output.set(candidates[bestFilter], outputOffset + 1);
        }
        return output;
      };
const pngPaethPredictor = (left, up, upLeft) => {
        const estimate = left + up - upLeft;
        const leftDistance = Math.abs(estimate - left);
        const upDistance = Math.abs(estimate - up);
        const cornerDistance = Math.abs(estimate - upLeft);
        if (leftDistance <= upDistance && leftDistance <= cornerDistance) return left;
        return upDistance <= cornerDistance ? up : upLeft;
      };
const indexedPngColorKey = (red, green, blue, alpha) =>
        (((red << 24) | (green << 16) | (blue << 8) | alpha) >>> 0);
const adaptiveIndexedPngPalette = (colors, maxColors) => {
        const boxes = [indexedPngPaletteBox(colors)];
        while (boxes.length < maxColors) {
          let boxIndex = -1;
          for (let index = 0; index < boxes.length; index += 1) {
            if (boxes[index].score < 0) continue;
            if (boxIndex < 0 || boxes[index].score > boxes[boxIndex].score) boxIndex = index;
          }
          if (boxIndex < 0) break;
          const box = boxes[boxIndex];
          const sorted = box.colors.slice().sort(
            (left, right) =>
              indexedPngColorChannel(left, box.splitChannel) -
              indexedPngColorChannel(right, box.splitChannel),
          );
          const middleWeight = box.total / 2;
          let accumulated = 0;
          let splitAt = 1;
          for (let index = 0; index < sorted.length - 1; index += 1) {
            accumulated += sorted[index].count;
            splitAt = index + 1;
            if (accumulated >= middleWeight) break;
          }
          if (splitAt <= 0 || splitAt >= sorted.length) {
            box.score = -1;
            continue;
          }
          boxes.splice(
            boxIndex,
            1,
            indexedPngPaletteBox(sorted.slice(0, splitAt)),
            indexedPngPaletteBox(sorted.slice(splitAt)),
          );
        }

        const palette = [];
        const paletteByColor = new Map();
        const indexBySourceColor = new Map();
        for (const box of boxes) {
          let alphaWeight = 0;
          let redTotal = 0;
          let greenTotal = 0;
          let blueTotal = 0;
          let total = 0;
          for (const color of box.colors) {
            const normalizedAlpha = color.alpha / 255;
            const weight = color.count;
            const visibleWeight = normalizedAlpha * weight;
            total += weight;
            alphaWeight += visibleWeight;
            redTotal += color.red * visibleWeight;
            greenTotal += color.green * visibleWeight;
            blueTotal += color.blue * visibleWeight;
          }
          const alpha = clamp(Math.round((alphaWeight / Math.max(1, total)) * 255), 0, 255);
          const red = alphaWeight > 0 ? clamp(Math.round(redTotal / alphaWeight), 0, 255) : 0;
          const green = alphaWeight > 0 ? clamp(Math.round(greenTotal / alphaWeight), 0, 255) : 0;
          const blue = alphaWeight > 0 ? clamp(Math.round(blueTotal / alphaWeight), 0, 255) : 0;
          const paletteKey = indexedPngColorKey(red, green, blue, alpha);
          let paletteIndex = paletteByColor.get(paletteKey);
          if (paletteIndex == null) {
            paletteIndex = palette.length;
            paletteByColor.set(paletteKey, paletteIndex);
            palette.push([red, green, blue, alpha]);
          }
          for (const color of box.colors) indexBySourceColor.set(color.key, paletteIndex);
        }
        return { palette, indexBySourceColor };
      };
const indexedPngColorChannel = (color, channel) => {
        if (channel === 3) return color.alpha;
        const alpha = color.alpha / 255;
        if (channel === 0) return color.red * alpha;
        if (channel === 1) return color.green * alpha;
        return color.blue * alpha;
      };
const indexedPngPaletteBox = (colors) => {
        const minimums = [255, 255, 255, 255];
        const maximums = [0, 0, 0, 0];
        let total = 0;
        for (const color of colors) {
          total += color.count;
          for (let channel = 0; channel < 4; channel += 1) {
            const value = indexedPngColorChannel(color, channel);
            minimums[channel] = Math.min(minimums[channel], value);
            maximums[channel] = Math.max(maximums[channel], value);
          }
        }
        const ranges = maximums.map((maximum, channel) =>
          (maximum - minimums[channel]) * (channel === 3 ? 1.2 : 1),
        );
        let splitChannel = 0;
        for (let channel = 1; channel < ranges.length; channel += 1) {
          if (ranges[channel] > ranges[splitChannel]) splitChannel = channel;
        }
        const range = ranges[splitChannel];
        return {
          colors,
          total,
          splitChannel,
          score: colors.length > 1 ? range * range * Math.sqrt(Math.max(1, total)) : -1,
        };
      };
async function publicPngDeflate(bytes){const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));return new Uint8Array(await new Response(stream).arrayBuffer());}
function setExportModal(show){$('exportModal').hidden=!show;}
function enterWaveWorkspace(){resetSvgaWorkspaceProject();state.workspaceMode='wave';state.package=buildWavePackage();state.package.project.metadata.waveLayers=[newWaveLayer()];document.body.classList.add('wave-workspace');rebuildWaveComposition();refreshWaveEditor();return true;}
const resetSvgaWorkspaceProject = () => {state.undoStack=[];state.redoStack=[];state.previewFrame=0;};
function refreshWaveEditor(){const p=state.package.project;for(const [id,value]of [['waveCanvasWidth',p.canvas.width],['waveCanvasHeight',p.canvas.height],['fps',projectFps(p)],['exportDuration',projectDurationSeconds(p)]])if($(id))$(id).value=value;state.package.summary.layerCount=p.assets.length;setLayerSelection(p.assets[0]?.key||null);renderWavePanel();void renderPreview(state.previewFrame);ensurePreviewPlayback();}
const setLayerSelection = key => {state.selectedKey=key;};
const ensurePreviewPlayback = () => startPreviewPlayback();
function startPublicWaveSettings(){
 $('projectSettingsCloseBtn').onclick=()=>{$('projectSettingsPopover').hidden=true;};
 $('projectSettingsBtn').onclick=()=>{$('projectSettingsPopover').hidden=!$('projectSettingsPopover').hidden;};
 for(const id of ['waveCanvasWidth','waveCanvasHeight','fps','exportDuration'])$(id).onchange=()=>{
  if(state.busy)return;holdUndoCheckpoint();const p=state.package.project;p.canvas.width=Math.max(32,Math.min(2048,Number($('waveCanvasWidth').value)||300));p.canvas.height=Math.max(32,Math.min(2048,Number($('waveCanvasHeight').value)||300));p.exportRules.fps=Math.max(1,Math.min(60,Number($('fps').value)||24));p.exportRules.durationSeconds=Math.max(.5,Math.min(30,Number($('exportDuration').value)||3));p.exportRules.frames=Math.round(p.exportRules.fps*p.exportRules.durationSeconds);rebuildWaveComposition();commitUndoCheckpoint();renderWavePanel();void renderPreview(state.previewFrame);
 };
 $('waveProjectInput').onchange=e=>void openWaveProject(e.target.files?.[0]);
 new ResizeObserver(()=>{if(state.package)void renderPreview(state.previewFrame);}).observe($('stageViewport'));
}
async function openWaveProject(file) {
  if(!file || state.busy || !confirmSvgaWorkspaceDiscard())return;
  setBusy(true);
  try {
    if(file.size>32*1024*1024)throw new Error('声波工程超过 32 MB。');
    const data=JSON.parse(await file.text()),pkg=data.package;
    if(data.schema!=='svga-editor-wave-project/v1' || !isWaveProject(pkg?.project) || !Array.isArray(pkg.project.assets) || pkg.project.assets.length>4000 ||
      ![pkg.project.canvas?.width,pkg.project.canvas?.height].every(v=>Number.isFinite(v)&&v>0&&v<=4096))throw new Error('无效的声波工程。');
    pkg.assets=svgaUnpackAssetPayloads(pkg.assets);
    const payloadKeys=new Set(pkg.assets.map(p=>p.key));
    for(const p of pkg.assets)if(!/^data:image\/(png|jpeg|webp|svg\+xml)[;,]/i.test(p.dataUrl))throw new Error('工程图片资源无效。');
    for(const a of pkg.project.assets){if(a.waveElement){
      const e=a.waveElement;e.config=normalizeWaveConfig(e.config);
      if(![e.index,e.layer,e.centerX,e.centerY,e.inner,e.outer].every(Number.isFinite)||e.index<0||e.index>=e.config.density||e.layer<0||e.layer>=e.config.layers||!payloadKeys.has(a.key))throw new Error('声波图层参数无效。');
    }}
    if(pkg.project.metadata.waveLayers){
      const layers=pkg.project.metadata.waveLayers;
      if(!Array.isArray(layers)||layers.length<1||layers.length>10||new Set(layers.map(l=>l?.id)).size!==layers.length)throw Error('声波图层管理数据无效。');
      for(const l of layers){if(typeof l.id!=='string'||typeof l.name!=='string'||!l.config)throw Error('声波图层管理数据无效。');l.config=normalizeWaveConfig(l.config);if(l.bitmap&&(!/^data:image\/(png|jpeg|webp)[;,]/i.test(l.bitmap.dataUrl)||![l.bitmap.width,l.bitmap.height].every(v=>Number.isFinite(v)&&v>0&&v<=4096)))throw Error('声波构件图片无效。');}
    }
    resetSvgaWorkspaceProject('wave');state.workspaceMode='wave';state.package=pkg;refreshWaveEditor();markCanvasVisualConfigSaved();syncSvgaWorkspaceUI();
  }catch(error){log(`打开声波工程失败: ${error.message}`);}finally{setBusy(false);$('waveProjectInput').value='';syncSvgaWorkspaceUI();}
}
const syncSvgaWorkspaceUI = () => {};
const confirmSvgaWorkspaceDiscard = () => true;
function svgaUnpackAssetPayloads(packed) {
  if(packed?.schema!=='svga-payloads/v1' || !Array.isArray(packed.entries) || !Array.isArray(packed.resources) || packed.entries.length>20000 || packed.resources.length>20000)throw new Error('工程的共享素材资源无效。');
  return packed.entries.map(entry=>{
    const index=entry?.resourceIndex;
    if(!entry?.metadata || typeof entry.metadata!=='object' || !Number.isInteger(index) || index<0 || index>=packed.resources.length || typeof packed.resources[index]!=='string')throw new Error('工程的共享素材引用无效。');
    return {...entry.metadata,dataUrl:packed.resources[index]};
  });
}
function regenerateWave(input,bitmap=waveBitmapPayload()) {
  if(state.busy || !isWaveProject())return false;
  return changeWaveComposition(()=>{const layer=activeWaveLayer();layer.config=normalizeWaveConfig(input);layer.bitmap=bitmap;});
}
function openWaveSettings() { renderWavePanel(); }
window.__WAVE_WEB__=true;createWavePanel();startWaveWeb();startPublicWaveSettings();