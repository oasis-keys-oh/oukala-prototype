(()=>{const o={};const g=(k,f)=>{try{o[k]=f()}catch(e){o[k]='ERR '+e.message}};
g('OBJS',()=>OBJS);
g('dmfirst',()=>{const k=Object.keys(DATAMODEL.tables);return k.slice(0,5).join(',')+' :: '+JSON.stringify(DATAMODEL.tables[k[0]]).slice(0,700)});
g('dmfields',()=>JSON.stringify(DATAMODEL.fields(Object.keys(DATAMODEL.tables)[3])).slice(0,600));
g('dmlist',()=>JSON.stringify(DATAMODEL.list()).slice(0,300));
g('atlasEnts',()=>{const e=ATLAS.coverage&&ATLAS.coverage();return JSON.stringify(e).slice(0,400)});
g('AF',()=>JSON.stringify(Object.keys(S.adm.fields)));
g('fld',()=>JSON.stringify(S.adm.fields.Project.slice(0,3)));
g('modules',()=>{const m=new Set();Object.values(DATAMODEL.tables).forEach(t=>m.add(t.module||t.mod||t.domain||t.area||'?'));return [...m].join('|')});
return o})()
