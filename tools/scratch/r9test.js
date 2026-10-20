const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_r9/full.html'));await p.waitForTimeout(500);
await p.evaluate(()=>go('home'));await p.waitForTimeout(300);
const c=await p.$('.fchip[data-k]');console.log('fchip',!!c);if(c){await c.hover();await p.waitForTimeout(500);await p.screenshot({path:'out_r9/shots/r9_hover.png'});}
await p.mouse.move(5,5);await p.evaluate(()=>{document.querySelector('#lens').checked=true});await p.waitForTimeout(300);await p.screenshot({path:'out_r9/shots/r9_lens.png'});
await p.evaluate(()=>{document.querySelector('#lens').checked=false;go('itsm_prb')});await p.waitForTimeout(400);
const ok=await p.evaluate(()=>{const r=document.querySelector('[data-itsm-open],[data-id^=PRB]');return !!r});console.log('prbrow',ok);
await p.evaluate(()=>{const f=Object.keys(window).includes('prbDrawer');});
const h=await p.evaluate(()=>{const e=[...document.querySelectorAll('[data-itsm-a]')].find(x=>/pd|open/.test(x.dataset.itsmA)&&/PRB/.test(x.dataset.id||''));if(e){e.click();return e.dataset.itsmA+e.dataset.id}return null});console.log('open',h);
await p.waitForTimeout(500);await p.screenshot({path:'out_r9/shots/r9_drawer.png'});
console.log(errs);await b.close()})();
