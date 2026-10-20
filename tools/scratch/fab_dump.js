const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+path.resolve(process.argv[2],'full.html'));await p.waitForTimeout(500);
const r=await p.evaluate(process.argv[3]);console.log(typeof r==='string'?r:JSON.stringify(r));await b.close()})();
