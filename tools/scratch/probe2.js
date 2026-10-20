const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.stack.slice(0,600)));p.on('console',m=>m.type()==='error'&&console.log('console:',m.text().slice(0,300)));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(800);await b.close()})();
