const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_wbs/full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('ppm_wbs'));await p.waitForTimeout(900);
const ord=()=>p.evaluate(()=>wbsOutline('PR1').slice(0,7).map(x=>x.id).join());
const bb=await (await p.$('[data-wbs-row="p1_11"]')).boundingBox(),ab=await (await p.$('[data-wbs-row="p1_13"]')).boundingBox();
console.log(await ord());
await p.mouse.move(ab.x+250,ab.y+18);await p.mouse.down();await p.mouse.move(ab.x+250,ab.y+6,{steps:3});await p.mouse.move(bb.x+250,bb.y+3,{steps:10});await p.mouse.up();await p.waitForTimeout(900);
console.log(await ord());
// bad pred state
console.log('p1_11 preds',await p.evaluate(()=>JSON.stringify(TASK('p1_11').pred)));
await p.evaluate(()=>{SCALE.set(true)});await p.waitForTimeout(1500);
const t0=Date.now();await p.evaluate(()=>{go('ppm_wbs')});await p.waitForTimeout(1200);console.log('scale sheet ms',Date.now()-t0,await p.evaluate(()=>[UPROJ().length,WS_N=document.querySelectorAll('.wbs-r').length]));
for(const t of ['gantt','net','res','use','ms','bc','ev','sheet']){const t1=Date.now();const e=await p.evaluate(t=>{const s=performance.now();S.wbs.tab=t;render();return performance.now()-s},t);console.log(t,Math.round(e),'ms')}
await p.evaluate(()=>{S.wbs.tab='sheet';render()});await p.waitForTimeout(600);await p.screenshot({path:'out_wbs/shots/scale_sheet.png'});
const e2=await p.evaluate(()=>{go('ims');const s=performance.now();render();return performance.now()-s});console.log('ims scale',Math.round(e2));
await p.evaluate(()=>{S.v.ims=1;render()});await p.waitForTimeout(800);await p.screenshot({path:'out_wbs/shots/scale_ims.png'});
await p.evaluate(()=>{go('plan');S.planProj=UPROJ()[10].id;render()});await p.waitForTimeout(600);await p.screenshot({path:'out_wbs/shots/scale_plan.png'});
console.log('errs',errs);await b.close()})();
