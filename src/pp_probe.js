const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const o={};o.keys=Object.keys(window.PEOPLEX||{});
const names=DIR.filter(d=>d.kind==='human').map(d=>d.name);const w=names.map(n=>{try{return workload(n).pct}catch(e){return -1}}).sort((a,b)=>a-b);
o.n=w.length;o.p10=w[Math.floor(w.length*.1)];o.med=w[w.length>>1];o.p90=w[Math.floor(w.length*.9)];o.over=w.filter(x=>x>100).length;o.over150=w.filter(x=>x>150).length;o.max=w[w.length-1];
return o});console.log(JSON.stringify(r));console.log(errs);await b.close()})();
