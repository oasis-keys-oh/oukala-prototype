const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_r9/full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('home'));await p.waitForTimeout(300);
const c=await p.$('.fchip[data-k]');await c.hover();await p.waitForTimeout(500);
console.log(await p.evaluate(()=>document.querySelector('#fhov').matches(':popover-open')));
await p.mouse.move(5,5);await p.waitForTimeout(400);
console.log(await p.evaluate(()=>document.querySelector('#fhov').matches(':popover-open')));
console.log(await p.evaluate(()=>getComputedStyle(document.querySelector('#fhov')).backgroundColor));
await b.close()})();
