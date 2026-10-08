const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_r9/full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('svc_notify'));await p.waitForTimeout(800);
console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('.svc-pn2')].map(e=>({top:Math.round(e.getBoundingClientRect().top),h:Math.round(e.getBoundingClientRect().height),ch:[...e.children].map(c=>c.className+':'+Math.round(c.getBoundingClientRect().height)+'/'+c.dataset.ca),par:e.parentElement.className}))),null,0));await b.close()})();
