const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
p.on('pageerror',e=>console.log('PE',e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(process.argv[2]||'out_f3_15/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(800);
const r=await p.evaluate(process.argv[3]);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));await b.close()})();
