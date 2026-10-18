const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const js=process.argv[3];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>m.type()==='error'&&console.log('console:',m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(2500);
const r=await p.evaluate(js);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));await b.close()})();
