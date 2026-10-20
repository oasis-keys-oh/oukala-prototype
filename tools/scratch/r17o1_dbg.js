const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=process.argv[2];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1800);
let t=Date.now();console.log(await p.evaluate(()=>document.documentElement.className+'|'+!!document.querySelector('#r17o1Tab')),Date.now()-t);
t=Date.now();await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));console.log('raf',Date.now()-t);
t=Date.now();try{await p.screenshot({path:'r17_shots/dbg.png',timeout:20000});console.log('shot',Date.now()-t)}catch(e){console.log('shot fail')}
await b.close()})();
