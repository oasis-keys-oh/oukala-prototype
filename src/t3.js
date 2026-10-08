const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_svc');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1300}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);
const forms={item:"design|laptop",sla:"slanew",oc:"override",swap:"swap",asset:"assetadd",reclaim:"reclaim",tpl:"tpledit|T1",inc:"inc0",esc:"eadd",pick:"pick"};
for(const [k,a] of Object.entries(forms)){await p.evaluate(()=>go('svc_cat'));await p.evaluate(a=>{const t=document.createElement('button');t.dataset.svc=a;document.body.appendChild(t);t.click();t.remove()},a);await p.waitForTimeout(350);await p.screenshot({path:`${dir}/shots/form-${k}.png`});await p.evaluate(()=>closeDrawer());await p.waitForTimeout(200)}
await p.evaluate(()=>go('svc_req'));await p.waitForTimeout(300);
const a=await p.$('[data-dnd-id="RITM0010425"]'),t=await p.$('[data-dnd="Delivered"]');const ab=await a.boundingBox(),tb=await t.boundingBox();await p.mouse.move(ab.x+60,ab.y+20);await p.mouse.down();await p.mouse.move(ab.x+80,ab.y+40,{steps:3});await p.mouse.move(tb.x+tb.width/2,tb.y+30,{steps:12});await p.mouse.up();await p.waitForTimeout(500);
console.log('425',await p.evaluate(()=>document.querySelector('[data-dnd-id="RITM0010425"]').closest('[data-dnd]').dataset.dnd));
// open drawer for request
await p.evaluate(()=>{const t=document.createElement('button');t.dataset.svc='req|RITM0010441';document.body.appendChild(t);t.click()});await p.waitForTimeout(400);await p.screenshot({path:dir+'/shots/req-drawer.png'});
console.log('errors',errs.length?errs:'none');await b.close()})();
