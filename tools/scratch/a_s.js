const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>go('itsm_chg'));await p.waitForTimeout(500);
await p.screenshot({path:'aud/chg.png'});
const t=await p.evaluate(()=>document.querySelector('#view').innerText.slice(0,1500));console.log(t);
const rail=await p.evaluate(()=>document.querySelector('.rail').innerText);console.log(rail.slice(0,900));
await b.close()})();
