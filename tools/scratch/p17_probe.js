const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:120000});await p.waitForTimeout(500);
const r=await p.evaluate("("+process.argv[3]+")()");
console.log(typeof r==='string'?r:JSON.stringify(r,null,1));await b.close()})();
