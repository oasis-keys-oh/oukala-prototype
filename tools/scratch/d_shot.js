const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const widths=(process.argv[2]||'1440').split(',').map(Number);const tag=process.argv[3]||'a';const modes=(process.argv[4]||'domains').split(',');
for(const w of widths){const c=await b.newContext({viewport:{width:w,height:w<1200?800:w>1600?1080:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto('file://'+path.resolve('out_d','full.html'));await p.waitForTimeout(600);
await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(900);
for(const m of modes){await p.evaluate(m=>{const s=document.querySelector('[data-at-refs]');s.value=m;s.dispatchEvent(new Event('change',{bubbles:true}))},m);await p.waitForTimeout(500);
const info=await p.evaluate(()=>{const v=document.querySelector('.at-vp').getBoundingClientRect(),w=document.querySelector('.at-world').getBoundingClientRect();return {vp:[v.left,v.top,v.width,v.height].map(Math.round),world:[w.left,w.top,w.width,w.height].map(Math.round),cam:S.atlas.cam}});
console.log(w,m,JSON.stringify(info));
const el=await p.$('.at-vpbox');await el.scrollIntoViewIfNeeded();await p.screenshot({path:`d_${tag}_${w}_${m}.png`});}
console.log('errs',errs);await c.close()}
await b.close()})();
