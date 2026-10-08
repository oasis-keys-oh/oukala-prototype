const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>go('itsm_inc'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const f=document.querySelector('#view .fchip');const c=getComputedStyle(f);return JSON.stringify({style:c.fontStyle,pad:c.padding,ls:c.letterSpacing,fs:c.fontSize,gap:c.gap,h:f.getBoundingClientRect().height})}));
await p.evaluate(()=>{document.querySelector('#view .fchip').click()});await p.waitForTimeout(500);await p.screenshot({path:'aud/fchip.png'});
await b.close()})();
