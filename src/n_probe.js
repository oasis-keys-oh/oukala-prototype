const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const code=process.argv[3];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>m.type()==='error'&&console.log('console err:',m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(code);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));await b.close()})();
