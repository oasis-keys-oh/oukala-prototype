const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const d of process.argv.slice(2)){const c=await b.newContext({viewport:{width:1000,height:800}});const p=await c.newPage();
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(d)+'/full.html',{waitUntil:'load',timeout:180000});await p.waitForTimeout(3000);
 console.log(d,await p.evaluate(()=>({ox:document.documentElement.scrollWidth,tb:document.querySelector('.topbar').scrollWidth+'/'+document.querySelector('.topbar').clientWidth,kids:[...document.querySelectorAll('.tb-right > *')].map(e=>e.id||e.className.toString().slice(0,18)+":"+Math.round(e.getBoundingClientRect().width)).join(" ")})));await c.close()}
await b.close()})();
