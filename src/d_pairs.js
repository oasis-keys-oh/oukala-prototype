const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_d','full.html'));await p.waitForTimeout(600);await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const o=[];document.querySelectorAll('.at-reg').forEach(r=>o.push([r.getAttribute('aria-label'),r.style.left,r.style.top,r.style.width,r.style.height].join(' ')));return o.join('\n')+'\n'+document.querySelectorAll('.at-fe').length}));await b.close()})();
