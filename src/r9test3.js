const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_r9/full.html'));await p.waitForTimeout(500);
await p.evaluate(()=>go('itsm_prb'));await p.waitForTimeout(500);
await p.locator('#view >> text=PRB0009').first().click();await p.waitForTimeout(700);
await p.screenshot({path:'out_r9/shots/r9_prb1.png'});
// overlap check
console.log(await p.evaluate(()=>{const d=document.getElementById('drawer');const bar=d.querySelector('.dctl').getBoundingClientRect();const pills=[...d.querySelectorAll(':scope>.row .pill')].map(e=>e.getBoundingClientRect());return {bar:[bar.top,bar.bottom],overlap:pills.some(r=>!(r.bottom<=bar.top||r.top>=bar.bottom||r.right<=bar.left||r.left>=bar.right))}}));
await p.locator('#drawer [data-dexpand-fish]').first().click();await p.waitForTimeout(700);
await p.screenshot({path:'out_r9/shots/r9_prb2.png'});
console.log(errs);await b.close()})();
