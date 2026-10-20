const L=require('./load.js');
(async()=>{const {b,p}=await L();
const r=await p.evaluate(()=>{
 const o={};const sh=(x,n=500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.mm=sh(MODMAP.modules.slice(0,2),900); o.mmn=MODMAP.modules.length; o.flown=MODMAP.flows.length;o.bands=sh(MODMAP.bands);
 o.ownScr=sh(OWNX.ownedScreens('Casey Rowan'),300);
 o.get=sh(OWNX.get('screen','bud_over'),400);o.kinds=sh(OWNX.kinds);
 o.stats=sh(OWNX.stats(),400);
 o.recs=OWNX.records().length; o.rec0=sh(OWNX.records().slice(0,2),500);
 o.ORGXstats=sh(ORGX.stats(),500); o.people=ORGX.people.length; o.person0=sh(ORGX.people[0],400);o.domains=ORGX.domains.length;o.dom0=sh(ORGX.domains[0],300);
 o.PROCn=PROCLIB.list().length;o.proc0=sh(PROCLIB.list()[0],500);o.pstats=sh(PROCLIB.stats(),500);
 o.atlasCov=sh(ATLAS.coverage(),1500);
 o.dmtables=Object.keys(DATAMODEL.tables).length;
 o.evcat=sh(EVENTS.catalog,400);o.evn=(EVENTS.list()||[]).length;o.rules=EVENTS.rules.length;
 o.permroles=sh(PERM.roles,600);o.permgroups=sh(PERM.groups,400);
 o.personaN=Object.keys(PERSONAS).length;
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
