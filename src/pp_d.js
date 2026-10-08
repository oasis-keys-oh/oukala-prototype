const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('ppl_org'));await p.waitForTimeout(500);
for(const t of [0,1]){await p.evaluate(t=>{S.pp2.tab.ppl_org=t;render()},t);await p.waitForTimeout(1500);
console.log(t,await p.evaluate(()=>{const s=document.querySelector('.screen');const cs=getComputedStyle(s);const r=s.getBoundingClientRect();return [cs.opacity,cs.visibility,cs.transform,r.top,r.height,s.className,s.parentElement.className, document.activeElement&&document.activeElement.tagName]}))}
await b.close()})();
