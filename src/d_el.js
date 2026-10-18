const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const w=+process.argv[2]||1440,mode=process.argv[3]||'domains',out=process.argv[4]||'d_el.png',drawer=process.argv[5]==='drawer';
const c=await b.newContext({viewport:{width:w,height:w<1200?800:w>1600?1080:900},deviceScaleFactor:w>1600?1:1.5});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto('file://'+path.resolve('out_d','full.html'));await p.waitForTimeout(600);
await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(900);
if(drawer){await p.evaluate(()=>{const d=document.querySelector('[data-ent],.btn');openDrawer('<h2>Drawer test</h2><p>content</p>')});await p.waitForTimeout(700)}
await p.evaluate(m=>{const s=document.querySelector('[data-at-refs]');s.value=m;s.dispatchEvent(new Event('change',{bubbles:true}))},mode);await p.waitForTimeout(600);
await p.evaluate(()=>{document.querySelector('.at-vpbox').scrollIntoView({block:'start'});0});await p.waitForTimeout(300);
const info=await p.evaluate(()=>{const v=document.querySelector('.at-vp').getBoundingClientRect(),w=document.querySelector('.at-world').getBoundingClientRect();return {vp:[v.left,v.top,v.right,v.bottom].map(Math.round),world:[w.left,w.top,w.right,w.bottom].map(Math.round),k:S.atlas.cam.k}});
console.log(JSON.stringify(info),errs);
await p.screenshot({path:out});await b.close()})();
