const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const w=DIR.filter(d=>d.kind==='human').map(d=>workload(d.name).pct).sort((a,b)=>a-b);return {n:w.length,med:w[w.length>>1],max:w[w.length-1],over:w.filter(x=>x>100).length,sam:workload('Sam Patel')}});console.log(JSON.stringify(r),errs);await b.close()})();
