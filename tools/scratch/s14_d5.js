const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
await p.evaluate(()=>go('kcs_viz'));await p.waitForTimeout(600);
for(const t of ['Builder','Maps']){await p.click('#view button:has-text("'+t+'")');await p.waitForTimeout(900);
console.log(t,await p.evaluate(()=>{const o=[];document.querySelectorAll('#view .screen *').forEach(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);if(r.width>380&&r.height>200&&r.height<1500&&(/viz|vz|kcs/.test(typeof e.className==='string'?e.className:''))) o.push(e.tagName+'.'+e.className+'|'+cs.overflow+'|'+Math.round(r.width)+'x'+Math.round(r.height))});return o.slice(0,12).join('\n')}));
await p.screenshot({path:'out_s14/d5_'+t+'.png'})}
console.log(errs);await b.close()})();
