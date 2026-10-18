const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('console',m=>{if(m.type()==='error'||m.type()==='log')console.log('C',m.text().slice(0,200))});p.on('pageerror',e=>console.log('PE',e.message.slice(0,200)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});
const t0=Date.now();for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,500));const ok=await Promise.race([p.evaluate('typeof APG!=="undefined"?JSON.stringify(APG.state.migrated):"noapg"'),new Promise(r=>setTimeout(()=>r("HANG"),25000))]);console.log(Date.now()-t0,ok);if(ok==='HANG')break}
await b.close();process.exit(0)})();
