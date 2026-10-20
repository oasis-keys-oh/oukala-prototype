const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h] of [[1440,900],[1000,800],[1920,1080]]){const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve('out_d','full.html'));await p.waitForTimeout(600);await p.evaluate(()=>go('plat_map'));await p.waitForTimeout(1000);
console.log(w,await p.evaluate(()=>{const v=document.querySelector('.mm-vp').getBoundingClientRect(),n=[...document.querySelectorAll('.mm-n,.mm-lane')].map(x=>x.getBoundingClientRect());return JSON.stringify({vp:[v.top,v.bottom].map(Math.round),minL:Math.round(Math.min(...n.map(r=>r.left))-v.left),maxR:Math.round(Math.max(...n.map(r=>r.right))-v.right),minT:Math.round(Math.min(...n.map(r=>r.top))-v.top),maxB:Math.round(Math.max(...n.map(r=>r.bottom))-v.bottom),inner:innerHeight})}),errs);
await p.evaluate(()=>document.querySelector('.mm-vp').scrollIntoView({block:'start'}));await p.screenshot({path:`d_mm_${w}.png`});await p.close()}
await b.close()})();
