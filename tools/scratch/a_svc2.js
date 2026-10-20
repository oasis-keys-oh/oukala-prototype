const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>{go('svc_360')});await p.waitForTimeout(400);await p.evaluate(()=>document.querySelector('[data-s360-open=svc_portal]').click());await p.waitForTimeout(500);
for(const [n,i] of [['off',7],['lr',8],['fin',5],['imp',6],['proj',2],['biz',1],['stk',3],['perf',4]]){await p.evaluate(i=>document.querySelectorAll('#view .vsw label')[i].click(),i);await p.waitForTimeout(500);
 require('fs').writeFileSync('aud/svc_'+n+'.txt',await p.evaluate(()=>document.querySelector('#view').innerText));await p.screenshot({path:'aud/svc_'+n+'.png',fullPage:false})}
console.log(errs);await b.close()})();
