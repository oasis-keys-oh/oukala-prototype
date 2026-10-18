const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('out_a14/full.html'));await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(()=>({S_agents:S.agents.map(a=>a.n+'|'+a.kind),dir:DIR.filter(d=>d.kind==='ai').map(d=>d.name+'|'+d.role),ppl:((S.ppl||{}).agents||[]).map(a=>a.n),orgx:ORGX.agents().map(a=>a.name),staff:ORGX.staff.map(p=>p.n+'|'+p.role),people:ORGX.people.length}))));await b.close()})();
