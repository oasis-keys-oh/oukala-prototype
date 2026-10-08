const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const p=await b.newPage();
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
console.log(await p.evaluate(process.argv[3]));await b.close()})();
