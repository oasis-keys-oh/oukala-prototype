const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:730,height:1000}})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve('out_q17c')+'/full.html',{waitUntil:'domcontentloaded',timeout:240000});
await p.waitForFunction(()=>window.PERM&&document.querySelector('#view'),null,{timeout:240000});await p.waitForTimeout(3000);
await p.evaluate(()=>{go('r17q_value');R17Q.openPrint()});await p.emulateMedia({media:'print'});await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const td=document.querySelector('.r17q-page td.r17q-pn');const cs=getComputedStyle(td);const r=td.getBoundingClientRect();const t=td.closest('table');return [t.getBoundingClientRect().width,td.getBoundingClientRect().left,getComputedStyle(td.closest('.r17q-pcol')).overflow,td.innerText,cs.color,cs.display,cs.visibility,r.width,r.height,getComputedStyle(td.parentElement).display,td.outerHTML.slice(0,200)]}));await b.close()})();
