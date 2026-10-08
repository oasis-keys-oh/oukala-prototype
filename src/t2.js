const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_kcs');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:1440,height:2200}});const p=await c.newPage();p.setDefaultTimeout(30000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);
await p.evaluate(()=>{go('kcs_viz');S.v.kcs_vv=1;render()});await p.waitForTimeout(1200);
const order=()=>p.evaluate(()=>[...document.querySelectorAll('.kcs-canvas>[data-dnd-id]')].map(x=>x.dataset.dndId).join(','));console.log('before',await order());
const a=await p.locator('.kcs-canvas>[data-dnd-id="c1"] .grip').boundingBox(),t=await p.locator('.kcs-canvas>[data-dnd-id="c3"]').boundingBox();
await p.mouse.move(a.x+4,a.y+4);await p.mouse.down();await p.mouse.move(a.x+30,a.y+40,{steps:3});await p.mouse.move(t.x+t.width/2,t.y+t.height-20,{steps:14});await p.waitForTimeout(150);await p.screenshot({path:dir+'/shots/dash_dragging.png'});await p.mouse.up();await p.waitForTimeout(500);
console.log('after',await order());
// publish form
await p.evaluate(()=>{const A=KCS_TEST.ART.find(a=>a.id==='KB0475');A.st='In review';A.appr=true;edLoadX=0});
await p.evaluate(()=>{const e=document.createElement('button');e.dataset.kcsEdit='KB0475';document.body.appendChild(e);e.click();e.remove()});await p.waitForTimeout(300);
await p.evaluate(()=>{S.v.kcs_ev=3;render()});await p.waitForTimeout(1000);await p.click('[data-kcs-publish]');await p.waitForTimeout(700);await p.screenshot({path:dir+'/shots/f_pub.png'});
await p.evaluate(()=>{document.querySelector('[data-fsubmit="kcs_pub"]').click()});await p.waitForTimeout(500);console.log('KB0475',await p.evaluate(()=>KCS_TEST.ART.find(a=>a.id==='KB0475').st+' role '+KCS_TEST.K.role));
console.log('errors',errs);await b.close()})();
