const L=require('./load.js');
(async()=>{
const {b,p}=await L(1440,900);
const r=await p.evaluate(async()=>{
 const o={};const sh=(x,n=600)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.dom=Object.entries(PLAT.DOM).map(([k,v])=>k+': '+v.n+' ('+v.ent.length+' listed) steward '+v.steward);
 o.restricted=PLAT.entities().filter(e=>e.cls==='restricted'||/comp|benefit|pto|salary|pay/.test(e.id)).map(e=>e.id+':'+e.cls+':'+e.domain+':'+e.fields.length);
 o.lists=sh(LISTS.defs&&Object.keys(LISTS.defs),600);o.listsMeta=sh(LISTS.meta&&LISTS.meta(),800);
 o.listRows=sh(typeof LISTS.rows,50);
 o.storeEnt=sh(STORE.entities(),800);o.backend=STORE.backend;o.storeMeter=sh(STORE.meter&&STORE.meter(),400);
 o.cmdb=typeof CMDBX!=="undefined"?Object.keys(CMDBX).join(','):'no CMDBX';
 o.ccmap=typeof CCMAP!=="undefined"?Object.keys(CCMAP).join(','):'noCCMAP';
 o.r16hKeys=typeof R16H!=="undefined"?Object.keys(R16H).join(','):'';
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
