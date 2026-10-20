const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();
await p.goto('file://'+path.resolve('out_atlas','full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('[data-vw="atlas:1"]').click());await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const r=[...document.querySelectorAll('[data-bt="at_lin"] tbody tr')].slice(0,3).map(tr=>[...tr.children].map(td=>td.className+'|'+getComputedStyle(td).fontSize+'|'+getComputedStyle(td).color).join(' ; '));return r.join('\n')}));await b.close()})();
