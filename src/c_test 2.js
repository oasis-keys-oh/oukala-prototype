const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(800);
for(const scale of [false,true]){
 if(scale){const t=Date.now();await p.evaluate(()=>SCALE.set(true));console.log('SCALE.set ms',Date.now()-t);console.log(await p.evaluate(()=>[SCALE.projects().length,SCALE.incidents().length,SCALE.changes().length,SCALE.demand().length,SCALE.raid().length].join(',')))}
 for(const id of ['home','trace','inv','fo','kg','loop','tower','log','metrics']){const r=await p.evaluate(async id=>{const t=performance.now();go(id);const ms=performance.now()-t;await new Promise(r=>setTimeout(r,500));const h=document.querySelector('#view .hero');const hr=h?h.getBoundingClientRect():null;return {id,ms:Math.round(ms),hero:hr?Math.round(hr.height):null,n:document.querySelectorAll('#view *').length,sw:document.documentElement.scrollWidth}},id);console.log(JSON.stringify(r))}
}
// popover anchor
await p.evaluate(()=>go('home'));await p.waitForTimeout(500);
const f=await p.$('#view .fchip');if(f){const bb=await f.boundingBox();await f.click();await p.waitForTimeout(400);console.log('chip',JSON.stringify(bb),'pop',await p.evaluate(()=>{const o=document.querySelector('.pop:popover-open');if(!o)return null;const r=o.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}));await p.screenshot({path:path.resolve(process.argv[2])+'/shots/pop.png'})}
console.log(errs.slice(0,8));await b.close()})();
