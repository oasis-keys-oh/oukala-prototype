const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const d of process.argv.slice(2)){const p=await (await b.newContext()).newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve(d+'/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(5000);await p.evaluate(()=>go('svc_catpage')).catch(x=>e.push(x.message));await p.waitForTimeout(300);console.log(d,e.map(s=>s.slice(0,90)))}
await b.close()})();
