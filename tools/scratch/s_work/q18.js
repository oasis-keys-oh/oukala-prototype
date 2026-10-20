 const c=ATLAS.coverage();const out={};c.screens.forEach(s=>{out[s.id||s.screen]=s});
 const res={};for(const k in out){const s=out[k];res[k]={ents:(s.ents||s.entities||s.read||[]).slice?.(0,6),keys:Object.keys(s)}}
 return JSON.stringify(Object.keys(c.screens[0])) + ' ' + JSON.stringify(c.screens[3]).slice(0,800);
