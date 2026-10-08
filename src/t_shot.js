const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
await p.evaluate(process.argv[3]);await p.waitForTimeout(1800);
await p.screenshot({path:process.argv[4],fullPage:false});await b.close()})();
