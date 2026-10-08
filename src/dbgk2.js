const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext()).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
console.log(await p.evaluate(process.argv[3]));await b.close()})();
