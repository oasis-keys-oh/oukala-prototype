const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PE '+e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
const f=fs=>require('fs').readFileSync(process.argv[3],'utf8');
const r=await p.evaluate(require("fs").readFileSync(process.argv[3],"utf8").trim().replace(/;$/,""));
console.log(typeof r==='string'?r:JSON.stringify(r,null,1));await b.close()})();
