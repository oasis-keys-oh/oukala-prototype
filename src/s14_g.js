const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
for(const id of ['vault','itom_graph']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(1500);
console.log(id,await p.evaluate(()=>[...document.querySelectorAll('.gx-cv')].map(h=>{const g=h.closest('.gx');return JSON.stringify({w:h.clientWidth,h:h.clientHeight,gx:!!g,cam:!!(g&&g._gxcam),zs:!!h._zs})})));}
console.log(errs);await b.close()})();
