const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>{go('svc_360')});await p.waitForTimeout(400);await p.evaluate(()=>{document.querySelector('[data-s360-open=svc_portal]').click()});await p.waitForTimeout(700);
console.log(await p.evaluate(()=>{const d=document.getElementById('drawer');return [...d.querySelectorAll('[role=tab],.tabs button,.vsw label,button')].map(x=>x.textContent.trim()).filter(Boolean).slice(0,60).join(' | ')}));
await p.screenshot({path:'aud/svc360.png'});
const t=await p.evaluate(()=>document.getElementById('drawer').innerText);require('fs').writeFileSync('aud/svc360_drawer.txt',t);
console.log(errs);await b.close()})();
