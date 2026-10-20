const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_r9/full.html'));await p.waitForTimeout(500);
await p.evaluate(()=>go('itsm_chg'));await p.waitForTimeout(400);
const n=await p.evaluate(()=>document.querySelectorAll('.ps.gate').length);console.log('gates',n);
const el=await p.$('.ps.gate');if(el){await el.scrollIntoViewIfNeeded();await p.screenshot({path:'out_r9/shots/r9_proc.png'});await el.click();await p.waitForTimeout(500);await p.screenshot({path:'out_r9/shots/r9_gate.png'})}
console.log(errs);await b.close()})();
