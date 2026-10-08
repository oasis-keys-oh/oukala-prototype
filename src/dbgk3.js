const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message,e.stack));p.on('console',m=>console.log('CON',m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
await p.evaluate(()=>{S.v.kgx_v=1;go("vault")});await p.waitForTimeout(800);
console.log(await p.evaluate(process.argv[3]));await b.close()})();
