const {chromium}=require('playwright');
(async()=>{const dir=require('path').resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const h of ['#portal','#portal/catalog/laptop','#portal/guides/onboarding']){const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});const p=await c.newPage();p.setDefaultTimeout(120000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html'+h,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(6000);
console.log(h,JSON.stringify(await p.evaluate(()=>({scr:S.screen,hash:location.hash,lay:document.documentElement.dataset.r16Layout,h1:(document.querySelector('#view h1')||{}).textContent,tiles:document.querySelectorAll('.r16p-tile').length}))),errs.slice(0,2));await c.close()}
await b.close()})();
