const L=require('./load.js');
(async()=>{
const {b,p}=await L(1440,900);
const r=await p.evaluate(async()=>{
 const o={};const sh=(x,n=600)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 const c=ATLAS.coverage();
 o.entKeys=sh(Object.keys(c.entities||{}).slice(0,3));o.entType=Array.isArray(c.entities)?'arr':typeof c.entities;
 const ents=Array.isArray(c.entities)?c.entities:Object.values(c.entities||{});o.entN=ents.length;o.ent0=sh(ents[0],700);
 o.DOM=sh(PLAT.DOM,1500);o.stats=sh(PLAT.stats(),600);
 const pe=PLAT.entities();o.peType=Array.isArray(pe)?'arr':typeof pe;const pa=Array.isArray(pe)?pe:Object.values(pe);o.peN=pa.length;o.pe0=sh(pa[0],700);
 const by={},st={},cl={};pa.forEach(e=>{const d=PLAT.domOf?PLAT.domOf(e.id||e.k):'?';by[d]=(by[d]||0)+1;st[e.state||e.status]=(st[e.state||e.status]||0)+1;cl[e.cls||e.classification]=(cl[e.cls||e.classification]||0)+1});
 o.by=sh(by,1500);o.st=sh(st);o.cl=sh(cl);
 const fa=PLAT.fieldsAll?PLAT.fieldsAll():null;o.fa=sh(fa&&fa.length);
 const au={},fc={};let tot=0;Object.values(DATAMODEL.tables).forEach(t=>t.fields.forEach(f=>{tot++;au[f.authority]=(au[f.authority]||0)+1;fc[f.classification]=(fc[f.classification]||0)+1}));o.authority=sh(au);o.fcls=sh(fc);o.totFields=tot;
 let refs=0,noref=0;Object.values(DATAMODEL.tables).forEach(t=>t.fields.forEach(f=>{if(f.type==='ref'){refs++;if(!f.ref)noref++}}));o.refs=refs;o.noref=noref;
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
