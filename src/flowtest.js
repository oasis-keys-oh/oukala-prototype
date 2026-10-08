const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.resolve('out_flow/full.html'));await p.waitForTimeout(500);
await p.evaluate(()=>go('flw_design'));await p.waitForTimeout(500);
const n0=await p.evaluate(()=>S.flw.flows[0].nodes.length);
// drag palette Approval into canvas empty area
await p.evaluate(()=>{document.querySelector('#flwCanvas').scrollIntoView({block:'center'})});
const pal=await p.locator('[data-flw-pal="approval"]').boundingBox();const cv=await p.locator('#flwCanvas').boundingBox();
await p.mouse.move(pal.x+20,pal.y+15);await p.mouse.down();await p.mouse.move(pal.x+60,pal.y+60,{steps:4});await p.mouse.move(cv.x+300,cv.y+cv.height-90,{steps:10});
await p.screenshot({path:'out_flow/shots/t_dragging.png'});
await p.mouse.up();await p.waitForTimeout(300);
const n1=await p.evaluate(()=>S.flw.flows[0].nodes.length);console.log('nodes',n0,'->',n1);
// move node: drag the new node
const newN=await p.evaluate(()=>{const f=S.flw.flows[0];return f.nodes[f.nodes.length-1].id});
const nb=await p.locator(`[data-flw-node="${newN}"]`).boundingBox();
await p.mouse.move(nb.x+40,nb.y+20);await p.mouse.down();await p.mouse.move(nb.x+140,nb.y-60,{steps:6});await p.mouse.up();
console.log('moved',await p.evaluate(id=>{const n=S.flw.flows[0].nodes.find(x=>x.id===id);return [n.x,n.y]},newN));
// connect: click out port of G2? use API through UI: out port of new node Approved -> in port of E3
await p.locator(`[data-flw-node="${newN}"] [data-flw-out$="|Approved"]`).click();
await p.locator('[data-flw-node="E3"] [data-flw-in]').click();
console.log('edges from new',await p.evaluate(id=>S.flw.flows[0].edges.filter(e=>e.f===id).length,newN));
await p.screenshot({path:'out_flow/shots/t_after.png'});
// test run
await p.locator('[data-flw-test]').click();await p.waitForTimeout(9500);
await p.screenshot({path:'out_flow/shots/t_run.png'});
console.log('run',await p.evaluate(()=>[S.flw.run.status,S.flw.run.outcome,S.flw.run.log.length]));
// forms
const forms={pub:()=>document.querySelector('[data-flw-publish]').click()};
await p.evaluate(()=>{S.flw.flows[0].nodes=S.flw.flows[0].nodes.filter(n=>n.id!==S.flw.flows[0].nodes[S.flw.flows[0].nodes.length-1].id)});
console.log('errs',errs);await b.close()})();
