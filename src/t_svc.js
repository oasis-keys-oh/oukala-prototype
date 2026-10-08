const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_svc');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const errs=[];
async function mk(opts){const c=await b.newContext(opts);const p=await c.newPage();p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);return p}
const ids=['svc_portal','svc_cat','svc_req','svc_sla','svc_oncall','svc_asset','svc_notify'];
for(const [tag,o] of [['dark',{viewport:{width:1440,height:900},colorScheme:'dark'}],['phone',{viewport:{width:400,height:820}}],['phonedark',{viewport:{width:400,height:820},colorScheme:'dark'}]]){const p=await mk(o);for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(250);const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(ox)console.log('OVERFLOW',tag,id);await p.screenshot({path:`${dir}/shots/${id}-${tag}.png`,fullPage:tag!=='dark'})}await p.context().close()}
const p=await mk({viewport:{width:1440,height:2400}});
// VA chat
await p.evaluate(()=>go('svc_portal'));
for(const q of ['How do I reset my password?','I need a new developer laptop','Contract Repository search is timing out','Talk to a person']){await p.fill('[data-svc-vaform] input',q);await p.press('[data-svc-vaform] input','Enter');await p.waitForTimeout(900)}
await p.click('[data-svc^="vawhy"]');await p.waitForTimeout(300);
await p.screenshot({path:dir+'/shots/va-chat.png',fullPage:true});
const routes=await p.$$eval('.svc-rt .pill',e=>e.map(x=>x.textContent));console.log('routes',routes);
await p.click('[data-svc^="vareq"]');await p.waitForTimeout(500);await p.screenshot({path:dir+'/shots/form-laptop.png'});
await p.fill('#svc_req_laptop_just','Needs more memory');await p.click('[data-fsubmit]');await p.waitForTimeout(500);await p.screenshot({path:dir+'/shots/after-submit.png'});
await p.keyboard.press('Escape');
// forms
const forms={item:"itemDesigner('laptop')",sla:"slaForm()",oc:"ocForm()",swap:"swapForm()",asset:"assetForm()",reclaim:"reclaimForm()",tpl:"tplForm('T1')",inc:"incForm('Search is slow')",esc:"escAddForm()"};
await p.evaluate(()=>{window.__x=1});
for(const [k,f] of Object.entries(forms)){await p.evaluate(()=>go('svc_cat'));await p.evaluate(`(()=>{${f}})()`).catch(e=>errs.push(k+' '+e.message));await p.waitForTimeout(300);await p.screenshot({path:`${dir}/shots/form-${k}.png`});await p.evaluate(()=>closeDrawer())}
// drag on request board
await p.evaluate(()=>go('svc_req'));await p.waitForTimeout(300);
async function drag(sel,tosel){const a=await p.$(sel),t=await p.$(tosel);const ab=await a.boundingBox(),tb=await t.boundingBox();await p.mouse.move(ab.x+40,ab.y+20);await p.mouse.down();await p.mouse.move(ab.x+60,ab.y+40,{steps:3});await p.mouse.move(tb.x+tb.width/2,tb.y+tb.height-10,{steps:12});await p.mouse.up();await p.waitForTimeout(500)}
await drag('[data-dnd-id="RITM0010445"]','[data-dnd="Awaiting approval"]');
console.log('stage 445',await p.evaluate(()=>document.querySelector('[data-dnd-id="RITM0010445"]').closest('[data-dnd]').dataset.dnd));
await drag('[data-dnd-id="RITM0010425"]','[data-dnd="Delivered"]');
console.log('stage 425',await p.evaluate(()=>document.querySelector('[data-dnd-id="RITM0010425"]').closest('[data-dnd]').dataset.dnd));
await drag('[data-dnd-id="RITM0010441"]','[data-dnd="Fulfilling"]');
console.log('stage 441 (blocked expected)',await p.evaluate(()=>document.querySelector('[data-dnd-id="RITM0010441"]').closest('[data-dnd]').dataset.dnd));
await p.screenshot({path:dir+'/shots/req-drag.png'});
// on-call drag pool->open shift
await p.evaluate(()=>go('svc_oncall'));await p.waitForTimeout(300);
await drag('[data-dnd-id="P:Maya Ortiz"]','[data-dnd="ds|4|1"]');
console.log('ds|4|1 =',await p.evaluate(()=>(document.querySelector('[data-dnd="ds|4|1"]').textContent)));
await p.screenshot({path:dir+'/shots/oncall-drag.png',fullPage:true});
// catalog detail + item designer interaction
await p.evaluate(()=>{S.svc.catSel='laptop';go('svc_cat')});await p.waitForTimeout(300);
await p.click('[data-svc="vc|cat|reason|Lost or stolen"]').catch(async()=>{await p.selectOption('#svc_cat_reason','Lost or stolen')});await p.waitForTimeout(200);
await p.screenshot({path:dir+'/shots/cat-detail.png',fullPage:true});
// asks
for(const q of ['I need a new laptop','who is on call','are we compliant on licences']){await p.evaluate(q=>ask(q),q);await p.waitForTimeout(400);console.log(q,'->',await p.evaluate(()=>S.screen));await p.evaluate(()=>closeDrawer())}
console.log('errors:',errs.length?errs:'none');await b.close()})();
