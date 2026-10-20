const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.AGENTRT&&AGENTRT.booted,null,{timeout:30000}).catch(()=>console.log('no boot'));console.log('boot ms',Date.now()-t0);
const r=await p.evaluate(()=>{const o={};const J=(x)=>{try{return JSON.stringify(x)}catch(e){return 'ERR'}};
o.reg=J(AGENTRT.registry().slice(0,2));o.nreg=AGENTRT.registry().length;o.runs=J(AGENTRT.runs().slice(0,2));o.nruns=AGENTRT.runs().length;
o.whoIA=J(who('Invoice Advisor'));
for(const f of ['principalFor','principalOfUser','kindOf','entityClass','allEntities','can','as','reportsOf','coverage']){try{o['perm_'+f]=String(PERM[f]).slice(0,300)}catch(e){}}
try{o.pf=J(PERM.principalFor('Invoice Advisor'))}catch(e){o.pf='ERR '+e.message}
try{o.pf2=J(PERM.principalOfUser('Invoice Advisor'))}catch(e){o.pf2='ERR '+e.message}
o.personaRoles=J(PERM.personaRoles).slice(0,300);
try{o.ents=J(PERM.allEntities().slice(0,3))}catch(e){o.ents='ERR '+e.message}
try{o.flows=J(FLOWX.flows().slice(0,1)).slice(0,1500);o.nflows=FLOWX.flows().length}catch(e){o.flows='ERR '+e.message}
try{o.wfdefs=J(WFX.defs).slice(0,300)}catch(e){}
try{o.inboxItems=J(INBOX.items().slice(0,2)).slice(0,800)}catch(e){o.inboxItems='ERR '+e.message}
try{o.hist=J(INBOX.hist().slice(0,2)).slice(0,600)}catch(e){}
o.ents2=Object.keys(STORE.entities||{}).length;
try{o.atlasEnt=J((window.PLAT&&PLAT.entities||[]).slice(0,1)).slice(0,500)}catch(e){}
o.globals=Object.keys(window).filter(k=>/^(PLAT|ENT|DATAMODEL|PROCLIB|MODMAP|NAVX|CONTRACT|EVENTS|WF|MAT|ORGX|SKILLS|TEAMS|APPR|GATE)/.test(k));
o.flowsA=J(FLOWX.flows().filter(f=>JSON.stringify(f).match(/agent/i)).map(f=>f.id||f.name)).slice(0,500);
return o});
for(const k in r)console.log(k,'=',String(r[k]).slice(0,1500));console.log(errs);await b.close()})();
