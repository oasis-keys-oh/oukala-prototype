const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(()=>({c:PEOPLEX.capacity('Sam Patel'),t:PEOPLEX.capacity('Ops team'),pf:PEOPLEX.performance('Sam Patel').index,pl:PEOPLEX.plate('Sam Patel').length,rq:PEOPLEX.requestResource({team:'Ops team',fte:2}).id}))));
for(const s of ['ppl_org','ppl_perf','ppl_cap','ppl_jrny','ppl_av','ppl_train','ppl_meet']){await p.evaluate(s=>go(s),s)}
await p.evaluate(()=>person360('Sam Patel'));await p.waitForTimeout(300);console.log(errs);await b.close()})();
