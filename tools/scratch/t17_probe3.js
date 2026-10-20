const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.AGENTRT&&AGENTRT.booted,null,{timeout:30000});
const r=await p.evaluate(()=>{const o={};const J=(x)=>{try{return JSON.stringify(x)}catch(e){return 'ERR'}};
o.skillsdbKeys=Object.keys(SKILLSDB);o.skillsKeys=Object.keys(SKILLS);
for(const k of Object.keys(SKILLS)){const v=SKILLS[k];o['SKILLS.'+k]=typeof v==='function'?String(v).slice(0,200):J(v).slice(0,300)}
for(const k of Object.keys(SKILLSDB)){const v=SKILLSDB[k];o['SKILLSDB.'+k]=typeof v==='function'?String(v).slice(0,200):J(v).slice(0,300)}
const ag=FLOWX.flows().filter(f=>f.nodes&&f.nodes.some(n=>n.t==='agent'||/agent/i.test(n.t)));o.agFlows=ag.length;if(ag[0]){o.agNode=J(ag[0].nodes.find(n=>/agent/i.test(n.t))).slice(0,900);}
o.nodeTypes=J([...new Set(FLOWX.flows().flatMap(f=>(f.nodes||[]).map(n=>n.t)))]);
const wd=WFX.defs.filter(d=>d.steps.some(s=>s.type==='agent'));o.wdAg=wd.length;if(wd[0])o.wdStep=J(wd[0].steps.find(s=>s.type==='agent'));
o.wdTypes=J([...new Set(WFX.defs.flatMap(d=>d.steps.map(s=>s.type)))]);
o.dm=Object.keys(DATAMODEL.tables).length;const t=DATAMODEL.tables.invoice;o.dmInv=J(t).slice(0,600);
o.dmCls=J([...new Set(Object.values(DATAMODEL.tables).flatMap(t=>(t.fields||[]).map(f=>f.classification)))]);
o.teams=J(TEAMS).slice(0,300);o.cur=J(PERM.rows&&String(PERM.rows)).slice(0,200);
o.mat=Object.keys(MAT);o.approvalGroup=J(Object.keys(APPR));o.nav=Object.keys(NAVX);o.mm=Object.keys(MODMAP);o.plib=Object.keys(PROCLIB);o.pl=Object.keys(PLAT);
return o});
for(const k in r)console.log(k,'=',String(r[k]).slice(0,900));await b.close()})();
