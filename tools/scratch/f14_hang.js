const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:+process.argv[3]||1440,height:820}})).newPage();
await p.route(/^https?:/,r=>r.abort());const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});console.log('goto',Date.now()-t0);
for(let i=0;i<5;i++){const t=Date.now();const r=await Promise.race([p.evaluate(()=>1),new Promise(r=>setTimeout(()=>r('TIMEOUT'),15000))]);console.log('eval',i,r,Date.now()-t)}
await b.close()})();
