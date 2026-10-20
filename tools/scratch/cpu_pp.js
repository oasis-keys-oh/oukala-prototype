const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);await p.evaluate(()=>go('ppl_cap'));await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const d=pp2Debug;const hum=DIR.filter(x=>x.kind==="human");const A=d.agg?d.agg(hum.map(x=>x.name)):null;let rows=hum.map(x=>{const m=d.PM(x.name);return {n:x.name,m:m&&Object.keys(m)}});return {n:hum.length,sample:rows[0],keys:Object.keys(d)}});
console.log(JSON.stringify(r),errs);await b.close()})();
