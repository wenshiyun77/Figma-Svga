// Canonical feature catalog. Build copies this module to the admin and Edge Function.
export const FEATURE_CATALOG=Object.freeze([
 ['motion.float','上下浮动','基础动效','free'],['motion.swing','摇摆','基础动效','free'],['motion.pulse','缩放','基础动效','free'],['motion.spin','旋转','基础动效','free'],['motion.fade','渐隐','基础动效','pro'],
 ['motion.sweep','扫光','图层动效','pro'],['motion.glow','发光','图层动效','pro'],['motion.lighting','光照','图层动效','pro'],['motion.particle','粒子','图层动效','pro'],['motion.sequence','序列帧','图层动效','free'],['motion.displacement','置换','图层动效','pro'],['motion.flash','闪光','其他动效','free'],['motion.glitch','故障风','其他动效','free'],['motion.flame','火焰','其他动效','free'],
 ['export.svga','SVGA','导出格式','free'],['export.webp','WebP','导出格式','pro'],['export.gif','GIF','导出格式','pro'],['export.lottie','Lottie JSON','导出格式','pro'],['export.webm','WebM','导出格式','pro'],['export.pag','PAG','导出格式','pro']
].map(([key,label,group,defaultMode])=>Object.freeze({key,label,group,defaultMode})));
export const DEFAULT_FEATURE_POLICY=Object.freeze(Object.fromEntries(FEATURE_CATALOG.map(item=>[item.key,item.defaultMode])));
export function normalizeFeaturePolicy(value){const policy={...DEFAULT_FEATURE_POLICY};for(const key of Object.keys(policy))if(value?.[key]==='free'||value?.[key]==='pro')policy[key]=value[key];return policy;}
export function featureAllowed(key,isPro,policy){if(!Object.hasOwn(DEFAULT_FEATURE_POLICY,key))return false;return isPro===true||normalizeFeaturePolicy(policy)[key]==='free';}
