const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_r9/full.html'));await p.waitForTimeout(500);
const open=()=>p.evaluate(()=>document.querySelector('#fhov')?.matches(':popover-open')||false);
for(const scr of ['home','agile_art','metrics','ppm_proj']){await p.evaluate(s=>go(s),scr);await p.waitForTimeout(500);
 const c=await p.$('.fchip[data-k]');if(!c){console.log(scr,'no chip');continue}
 await c.scrollIntoViewIfNeeded();const bb=await c.boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(500);const a=await open();
 await p.mouse.move(bb.x+bb.width/2+4,bb.y+bb.height/2);await p.waitForTimeout(100);
 // simulate re-render while hovered
 await p.evaluate(()=>render());await p.waitForTimeout(200);const stillOpen=await open();
 await p.mouse.move(5,300);await p.waitForTimeout(400);const after=await open();
 console.log(scr,'shown',a,'afterRerender(hover moves)',stillOpen,'afterLeave',after)}
console.log(errs);await b.close()})();
