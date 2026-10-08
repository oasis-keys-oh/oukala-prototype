const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>go('exe_strat'));await p.waitForTimeout(600);await p.evaluate(()=>window.scrollTo(0,420));await p.waitForTimeout(300);await p.screenshot({path:'aud/s1_okr.png'});
// milestone drawer
await p.evaluate(()=>go('ims'));await p.waitForTimeout(400);await p.click('#view .vsw label:nth-child(3)');await p.waitForTimeout(600);
await p.evaluate(()=>{const r=[...document.querySelectorAll('#view tr')].filter(t=>t.querySelectorAll('td').length)[2];r.click()});await p.waitForTimeout(700);await p.screenshot({path:'aud/s2_ms.png'});
await p.evaluate(()=>document.getElementById('drawer').hidePopover());
await p.evaluate(()=>go('exe_board'));await p.waitForTimeout(600);
await p.evaluate(()=>{const e=[...document.querySelectorAll('#view *')].find(x=>x.children.length==0&&/Approval workflow/i.test(x.textContent));e&&e.scrollIntoView({block:'start'})});await p.waitForTimeout(400);await p.screenshot({path:'aud/s3_board.png'});
console.log(errs);await b.close()})();
