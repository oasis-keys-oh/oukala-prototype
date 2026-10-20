const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const w of [1000,820]){const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html#tour',{waitUntil:'load',timeout:180000});await p.waitForTimeout(3500);
 await p.evaluate(()=>R17P.start('govern',3));await p.waitForTimeout(2200);await p.screenshot({path:'r17_shots/w_'+w+'.png'});
 console.log(w,await p.evaluate(()=>({ox:document.documentElement.scrollWidth>innerWidth+1,bar:JSON.stringify(document.getElementById('r17pBar').getBoundingClientRect().toJSON()),tb:document.querySelector('.topbar').scrollWidth+'/'+document.querySelector('.topbar').clientWidth})));await c.close()}
await b.close()})();
