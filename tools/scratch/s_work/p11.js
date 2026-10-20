const L=require('./load.js');
(async()=>{
const {b,p}=await L(1440,900);
const r=await p.evaluate(async()=>{
 const o={};const sh=(x,n=600)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.platEntities=typeof PLAT!=="undefined"?Object.keys(PLAT).join(','):'noPLAT';
 try{const ents=PLAT.entities;o.entN=Array.isArray(ents)?ents.length:Object.keys(ents).length;const a=Array.isArray(ents)?ents:Object.values(ents);o.ent0=sh(a[0],800);o.entKeys=sh(Object.keys(a[0]));
  const by={};a.forEach(e=>{const d=e.domain||e.dom||'?';by[d]=(by[d]||0)+1});o.byDomain=sh(by,1500);
  const st={};a.forEach(e=>{const d=e.status||e.state||'?';st[d]=(st[d]||0)+1});o.byStatus=sh(st);
  const cl={};a.forEach(e=>{const d=e.cls||e.classification||'?';cl[d]=(cl[d]||0)+1});o.byCls=sh(cl);
 }catch(e){o.entErr=e.message}
 o.dmN=Object.keys(DATAMODEL.tables).length;o.dm0=sh(Object.entries(DATAMODEL.tables)[0],500);
 try{o.cov=sh(Object.keys(ATLAS.coverage()),400);const c=ATLAS.coverage();o.covSummary=sh({recordSets:(c.records||c.sets||[]).length,mods:c.modules.length,sum:c.summary||c.stats},800)}catch(e){o.covErr=e.message}
 o.atlasLin=sh(ATLAS.lin&&typeof ATLAS.lin,50);
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
