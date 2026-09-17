export function presetRange(key,today){const d=new Date(today+'T00:00:00Z');const days=Number(key)||7;d.setUTCDate(d.getUTCDate()-days+1);return {start:d.toISOString().slice(0,10),end:today}}
export function normalizeGrowthRows(rows){return (rows||[]).map(r=>({day:String(r.day),newUsers:Number(r.new_users||0),totalUsers:Number(r.total_users||0)}))}
