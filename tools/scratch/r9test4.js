const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_r9/full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('itsm_prb'));await p.waitForTimeout(500);
await p.locator('#view >> text=PRB0009').first().click();await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelector('#drawer [data-itsm-fishbox]').scrollIntoView({block:'start'}));await p.waitForTimeout(300);await p.screenshot({path:'out_r9/shots/r9_prb3.png'});
await p.locator('#drawer [data-dexpand-fish]').first().click();await p.waitForTimeout(600);await p.screenshot({path:'out_r9/shots/r9_prb4.png'});await b.close()})();
