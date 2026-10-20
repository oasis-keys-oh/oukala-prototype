(()=>{const o={};const g=(k,f)=>{try{o[k]=f()}catch(e){o[k]='ERR '+e.message}};
g('tkeys',()=>{const t=DATAMODEL.tables.project;return Object.keys(t).join(',')+' | '+JSON.stringify(Object.keys(t.fields[0]))});
g('tmeta',()=>JSON.stringify(Object.fromEntries(Object.entries(DATAMODEL.tables.project).filter(([k])=>k!=='fields'))).slice(0,500));
g('mods',()=>{const c={};Object.values(DATAMODEL.tables).forEach(t=>{const m=t.module||t.mod||t.domain||'none';c[m]=(c[m]||0)+1});return c});
g('ent',()=>{const e=ATLAS.lin&&1;return Object.keys(ATLAS)});
g('ENTS',()=>{ const a=window.ATLAS; return typeof a.entities});
g('ctypes',()=>{const c={};Object.values(DATAMODEL.tables).forEach(t=>t.fields.forEach(f=>{c[f.type]=(c[f.type]||0)+1}));return c});
g('cls',()=>{const c={};Object.values(DATAMODEL.tables).forEach(t=>t.fields.forEach(f=>{const k=f.cls||f.classification||'-';c[k]=(c[k]||0)+1}));return c});
g('own',()=>{const t=DATAMODEL.tables.project;return JSON.stringify(t.fields.find(f=>f.k==='manager'))});
g('PERSONAS',()=>Object.keys(PERSONAS));
g('plat',()=>typeof PLAT!=='undefined'?Object.keys(PLAT).join(','):'-');
g('registry',()=>typeof REGISTRY!=='undefined');
g('gate',()=>Object.keys(GUARD).join(','));
g('store',()=>Object.keys(STORE).join(','));
g('events',()=>Object.keys(EVENTS).join(','));
g('semantic',()=>Object.keys(window).filter(k=>/SEM|RPT|REPORT|SL$/i.test(k)).join(','));
return o})()
