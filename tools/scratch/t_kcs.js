const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_kcs');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);p.setDefaultTimeout(30000);const sh=n=>p.screenshot({path:dir+'/shots/'+n+'.png'});
// 1 kanban drag: Draft KB0480 -> In review (should block: <70%), then KB0475 -> Structure (reviewer ok, 90%)
await p.evaluate(()=>{go('kcs_home');S.v.kcs_hv=1;render()});await p.waitForTimeout(300);
async function drag(sel,tosel){const a=await p.locator(sel).boundingBox(),t=await p.locator(tosel).boundingBox();await p.mouse.move(a.x+60,a.y+20);await p.mouse.down();await p.mouse.move(a.x+80,a.y+40,{steps:3});await p.mouse.move(t.x+t.width/2,t.y+60,{steps:12});await p.waitForTimeout(100);await p.mouse.up();await p.waitForTimeout(300)}
await drag('[data-dnd-id="KB0480"]','[data-dnd="In review"]');console.log('KB0480',await p.evaluate(()=>KCS_TEST.ART.find(a=>a.id==='KB0480').st));
await drag('[data-dnd-id="KB0475"]','[data-dnd="In review"]');console.log('KB0475',await p.evaluate(()=>KCS_TEST.ART.find(a=>a.id==='KB0475').st));await sh('k_drag');
await drag('[data-dnd-id="KB0475"]','[data-dnd="Published"]');console.log('KB0475 publish attempt',await p.evaluate(()=>KCS_TEST.ART.find(a=>a.id==='KB0475').st));
// 2 article drawer + publish form
await p.evaluate(()=>{openForm({id:'x',title:'t',fields:[]})});await p.evaluate(()=>closeDrawer());
console.log('step');await p.click('[data-dnd-id="KB0502"]');await p.waitForTimeout(300);await sh('k_drawer');
await p.evaluate(()=>{document.querySelector('[data-kcs-approve]').click()});await p.waitForTimeout(200);
await p.evaluate(()=>{document.querySelector('[data-kcs-mv="KB0502:Published"]').click()});await p.waitForTimeout(300);console.log('KB0502',await p.evaluate(()=>KCS_TEST.ART.find(a=>a.id==='KB0502').st));
// 3 editor: AI generate
await p.evaluate(()=>{document.querySelector('[data-kcs-new]')&&0;go('kcs_edit');S.v.kcs_ev=1;render()});await p.waitForTimeout(200);
console.log('step');await p.click('[data-kcs-src="INC0102"]');await p.click('[data-kcs-gen]');await p.waitForTimeout(900);await sh('e_gen_mid');await p.waitForTimeout(2200);
await p.evaluate(()=>{S.v.kcs_ev=1;render()});await sh('e_gen');
await p.evaluate(()=>{S.v.kcs_ev=3;render()});await sh('e_rev');
await p.evaluate(()=>{S.v.kcs_ev=0;render()});await p.click('[data-kcs-revall]').catch(()=>{});
await p.evaluate(()=>{S.v.kcs_ev=2;render()});await sh('e_ver');
// version diff on KB0421
await p.evaluate(()=>{document.body.click();KCS_TEST;});
await p.evaluate(()=>{const e=document.createElement('button');e.dataset.kcsEdit='KB0421';document.body.appendChild(e);e.click();e.remove()});await p.waitForTimeout(300);await p.evaluate(()=>{S.v.kcs_ev=2;render()});await sh('e_diff');
// 4 publish form
await p.evaluate(()=>{const e=document.createElement('button');e.dataset.kcsEdit='KB0475';document.body.appendChild(e);e.click();e.remove()});await p.waitForTimeout(200);
// 5 forms
await p.evaluate(()=>{go('kcs_test')});await p.waitForTimeout(200);await p.click('[data-kcs-newcase]');await p.waitForTimeout(500);await sh('f_case');await p.evaluate(()=>closeDrawer());
console.log('step');await p.click('[data-kcs-newsuite]');await p.waitForTimeout(500);await sh('f_suite');await p.evaluate(()=>closeDrawer());
// 6 run suite animation
await p.evaluate(()=>{S.v.kcs_tv=2;render()});await p.click('[data-kcs-run="ST1:c"]');await p.waitForTimeout(1500);await sh('t_run');await p.waitForTimeout(5000);await sh('t_done');
await p.evaluate(()=>{S.v.kcs_tv=1;render()});await sh('t_judge');
// 7 viz forms
await p.evaluate(()=>{go('kcs_viz');S.v.kcs_vv=0;render()});await p.waitForTimeout(200);await p.click('[data-kcs-vzt="donut"]');await p.waitForTimeout(100);await p.click('[data-kcs-vsave]');await p.waitForTimeout(500);await sh('f_vsave');await p.evaluate(()=>closeDrawer());
await p.evaluate(()=>{S.v.kcs_vv=1;render()});await p.click('[data-kcs-share]');await p.waitForTimeout(300);await p.click('[data-fmulti="kcs_vshare:who:ops"]');await p.waitForTimeout(300);await sh('f_share');await p.evaluate(()=>closeDrawer());
// dashboard drag
await p.evaluate(()=>{S.v.kcs_vv=1;render()});await p.waitForTimeout(200);
const order=()=>p.evaluate(()=>[...document.querySelectorAll('.kcs-canvas>[data-dnd-id]')].map(x=>x.dataset.dndId).join(','));console.log('dash before',await order());
{const a=await p.locator('.kcs-canvas>[data-dnd-id="c1"] .grip').boundingBox(),t=await p.locator('.kcs-canvas>[data-dnd-id="c3"]').boundingBox();await p.mouse.move(a.x+4,a.y+4);await p.mouse.down();await p.mouse.move(a.x+30,a.y+40,{steps:3});await p.mouse.move(t.x+t.width/2,t.y+t.height-20,{steps:14});await p.waitForTimeout(100);await p.mouse.up();await p.waitForTimeout(400)}
console.log('dash after',await order());
// prompt editor test
await p.evaluate(()=>{go('kcs_prompt');S.v.kcs_pt=2;render()});await p.click('[data-kcs-prun]');await p.waitForTimeout(2300);await sh('p_test');
console.log('errors',errs);await b.close()})();
