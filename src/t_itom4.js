const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_itom');const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>{S.v.itom_hl=1;go('itom_health')});await p.waitForTimeout(400);
await p.evaluate(()=>{const o=DND.h.itomtask;DND.h.itomtask=function(){console.log('CALLED',[...arguments].join('|'));return o.apply(this,arguments)}});p.on('console',m=>console.log('C',m.text()));
const tk=p.locator('.itom-tk').first();await tk.scrollIntoViewIfNeeded();const tb=await tk.boundingBox();const col=p.locator('.itom-kl[data-dnd="In progress"]');const cb=await col.boundingBox();console.log(tb,cb);
await p.mouse.move(tb.x+30,tb.y+30);await p.mouse.down();await p.mouse.move(cb.x+40,cb.y+40,{steps:10});await p.mouse.up();await p.waitForTimeout(300);
console.log(await p.evaluate(()=>S.itom.tasks.map(t=>t.id+t.st).join()));await b.close()})();
