const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.resolve('out_flow/full.html'));await p.waitForTimeout(500);
const shot=n=>p.screenshot({path:'out_flow/shots/'+n+'.png'});
// DMN drag reorder
await p.evaluate(()=>go('flw_dmn'));await p.waitForTimeout(300);
const g1=await p.locator('[data-flw-drow="4"] .g').boundingBox(),g2=await p.locator('[data-flw-drow="0"]').boundingBox();
await p.mouse.move(g1.x+8,g1.y+8);await p.mouse.down();await p.mouse.move(g1.x+8,g1.y-60,{steps:5});await p.mouse.move(g2.x+100,g2.y+4,{steps:8});await p.mouse.up();await p.waitForTimeout(300);
console.log('first row now',await p.locator('[data-flw-drow="0"] input').first().inputValue(),await p.locator('[data-flw-drow="0"] input').nth(1).inputValue());
// edit cell + unique policy
await p.locator('[data-flw-hp="dt_inv|unique"]').click();await p.waitForTimeout(200);await shot('t_dmn_unique');
// approvals: open approve form for risky
await p.evaluate(()=>go('flw_appr'));await p.waitForTimeout(300);
await p.locator('[data-flw-ap="approve|AP-3011"]').click();await p.waitForTimeout(400);await shot('t_apr_form');
await p.locator('[data-fsubmit="flw_apf"]').click();await p.waitForTimeout(200);
await p.locator('#flw_apf_comment').fill('Priya confirmed acceptance verbally.');await p.locator('[data-fsubmit="flw_apf"]').click();await p.waitForTimeout(500);
console.log('log',await p.evaluate(()=>AUDIT[0]&&AUDIT[0].a+' '+AUDIT[0].d));
// connector form with mapping drag
await p.evaluate(()=>go('flw_hub'));await p.waitForTimeout(300);
await p.locator('[data-flw-newconn]').first().click();await p.waitForTimeout(500);
const src=p.locator('.flw-pool [data-dnd-id]').first(),slot=p.locator('.flw-slot').first();
const sb=await src.boundingBox();await slot.scrollIntoViewIfNeeded();const sb2=await src.boundingBox();const tb=await slot.boundingBox();
await p.mouse.move(sb2.x+30,sb2.y+10);await p.mouse.down();await p.mouse.move(sb2.x+50,sb2.y+30,{steps:3});await p.mouse.move(tb.x+60,tb.y+15,{steps:8});await shot('t_map_drag');await p.mouse.up();await p.waitForTimeout(300);
console.log('slot filled',await p.locator('.flw-slot.full').count());
await p.locator('[data-flw-automap]').click();await p.waitForTimeout(200);await shot('t_conn_form');
await p.evaluate(()=>document.querySelector('#drawer').scrollTo(0,0));await shot('t_conn_form_top');
await p.locator('[data-fchip="flw_conn:auth:apikey"]').click();await p.waitForTimeout(100);
console.log('apikey field',await p.locator('#flw_conn_key').count());
await p.evaluate(()=>closeDrawer());
// other forms
for(const [scr,sel,name] of [['flw_agent','[data-flw-wiz]','t_wiz'],['flw_agent','[data-flw-kill]','t_kill'],['flw_agent','[data-flw-guard]','t_guard'],['flw_hub','[data-flw-newmcp]','t_mcp'],['flw_bpmn','[data-flw-baddany]','t_badd']]){await p.evaluate(s=>go(s),scr);await p.waitForTimeout(250);await p.locator(sel).first().click();await p.waitForTimeout(400);await shot(name);await p.evaluate(()=>closeDrawer());await p.waitForTimeout(200)}
// hub dlq replay
await p.evaluate(()=>{go('flw_hub');S.v.flw_hub=3;render()});await p.waitForTimeout(300);await p.locator('[data-flw-replay="c:erp"]').click();await p.waitForTimeout(300);await shot('t_dlq');
// bpmn inspector
await p.evaluate(()=>go('flw_bpmn'));await p.waitForTimeout(300);await p.locator('[data-flw-bel="t3"]').click({force:true});await p.waitForTimeout(300);await shot('t_bpmn_sel');
// ask
await p.evaluate(()=>{ask("which integrations are failing")});await p.waitForTimeout(400);console.log('screen',await p.evaluate(()=>S.screen));
await p.evaluate(()=>{ask("what is waiting for my approval")});console.log('screen',await p.evaluate(()=>S.screen));
await p.evaluate(()=>{ask("build a workflow for invoice approval")});console.log('screen',await p.evaluate(()=>S.screen));
console.log('errs',errs);await b.close()})();
