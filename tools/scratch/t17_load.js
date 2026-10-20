const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const d of ['out_v16g','out_t17']){const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();await p.route(/^https?:/,r=>r.abort());const t=Date.now();
await p.goto('file://'+path.resolve(d)+'/full.html',{waitUntil:'load'});const tl=Date.now()-t;await p.waitForSelector('#view .screen, #view .hero',{timeout:60000}).catch(()=>{});console.log(d,'load',tl,'first screen',Date.now()-t);await c.close()}
await b.close()})();
