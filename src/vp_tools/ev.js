const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:+(process.argv[5]||1440),height:1000}});await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(600);
await p.evaluate(i=>go(i),process.argv[3]);await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(process.argv[4])));await b.close()})();
