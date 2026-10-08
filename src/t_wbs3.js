const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('console',m=>console.log('C',m.text()));p.on('pageerror',e=>console.log('E',e.message));
await p.goto('file://'+path.resolve('out_wbs/full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('ppm_wbs'));await p.waitForTimeout(900);
await p.evaluate(()=>{const f=DND.h.wbs;DND.h.wbs=(...a)=>{console.log('dnd',JSON.stringify(a));return f(...a)}});
await p.evaluate(()=>{document.querySelector('[data-wbs-sheet]').scrollIntoView()});await p.waitForTimeout(300);const bb=await (await p.$('[data-wbs-row="p1_11"]')).boundingBox(),ab=await (await p.$('[data-wbs-row="p1_13"]')).boundingBox();console.log(JSON.stringify([bb,ab]));
await p.mouse.move(ab.x+250,ab.y+18);await p.mouse.down();await p.mouse.move(ab.x+250,ab.y+6,{steps:3});console.log('drag?',await p.evaluate(()=>document.body.classList.contains('dnding')));await p.mouse.move(bb.x+250,bb.y+3,{steps:10});await p.mouse.up();await p.waitForTimeout(800);
console.log(await p.evaluate(()=>wbsOutline('PR1').slice(0,7).map(x=>x.id).join()));await b.close()})();
