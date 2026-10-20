const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:1700}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_admin/full.html'));await p.waitForTimeout(500);
const ev=(f,a)=>p.evaluate(f,a);const log=(...a)=>console.log('[e'+errs.length+']',...a);
// DND mouse helper
async function drag(sel1,sel2,dy){const a=await p.locator(sel1).first().boundingBox();const t=await p.locator(sel2).first().boundingBox();await p.mouse.move(a.x+20,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+30,a.y+a.height/2+8,{steps:3});await p.mouse.move(t.x+t.width/2,t.y+t.height/2+(dy||0),{steps:8});await p.mouse.up();await p.waitForTimeout(300)}
// 1 fields reorder
await ev(()=>{S.v.adm_studio=0;go("adm_studio")});await p.waitForTimeout(500);
const before=await ev(()=>S.adm.fields.Incident.map(f=>f.k).slice(0,4));
await drag('[data-dnd="fields"] [data-dnd-id="number"]','[data-dnd="fields"] [data-dnd-id="description"]',20);
log('fields order',before,'->',await ev(()=>S.adm.fields.Incident.map(f=>f.k).slice(0,4)));
// 2 layout drag from pool to section 1
await ev(()=>{S.v.adm_studio=1;go("adm_studio")});await p.waitForTimeout(600);
await drag('[data-dnd="pool"] [data-dnd-id="business_unit"]','[data-dnd="sec_s1"] [data-dnd-id="description"]',0);
log('s1 keys',await ev(()=>S.adm.layout.Incident[0].keys),'preview has bu:',await ev(()=>!!document.getElementById('admprev_business_unit')));
// 3 field form
await ev(()=>{S.v.adm_studio=0;go("adm_studio")});await p.waitForTimeout(400);
await p.click('.card [data-adm="fnew"]');await p.waitForTimeout(400);
await p.fill('#adm_fld_label','Customer impact score');await p.selectOption('#adm_fld_type','number');await p.waitForTimeout(200);
log('api name',await p.inputValue('#adm_fld_k'),await ev(()=>document.getElementById('adm_live').textContent));
await p.screenshot({path:'out_admin/shots/form_field.png'});
await p.click('[data-fsubmit="adm_fld"]');await p.waitForTimeout(500);
log('fields now',await ev(()=>S.adm.fields.Incident.length),'draft items',await ev(()=>S.adm.pkgs.find(x=>x.id===S.adm.draftId).items.length));
// 4 env promote drag blocked then approve
await ev(()=>{S.v.adm_env=0;go("adm_env")});await p.waitForTimeout(600);
await drag('[data-dnd="test"] [data-dnd-id="PKG-0141"]','[data-dnd="uat"]',0);
log('0141 env after blocked drag (needs integ)',await ev(()=>S.adm.pkgs.find(x=>x.id==='PKG-0141').env));
const gt=async k=>{await ev(()=>document.querySelector('[data-adm="pkgopen:PKG-0141"]').click());await p.waitForTimeout(300);await p.click('[data-adm="gate:PKG-0141:'+k+'"]');await p.waitForTimeout(300)};await gt('integ');await gt('integ');await gt('scan');await ev(()=>closeDrawer());await p.waitForTimeout(300);
await drag('[data-dnd="test"] [data-dnd-id="PKG-0141"]','[data-dnd="uat"]',0);
log('0141 env after fixed',await ev(()=>S.adm.pkgs.find(x=>x.id==='PKG-0141').env),'m_prom',await ev(()=>METRICS.m_prom.cur));
await p.screenshot({path:'out_admin/shots/env_after.png'});
// 5 route reorder
await ev(()=>{S.v.adm_gate=0;go("adm_gate")});await p.waitForTimeout(600);
await drag('[data-dnd="r"] [data-dnd-id="rt5"]','[data-dnd="r"] [data-dnd-id="rt2"]',-10);
log('routes',await ev(()=>S.adm.routes.map(r=>r.id).join(',')));
// 6 kb move: alt+arrow on policy
await ev(()=>{S.v.adm_sec=1;go("adm_sec")});await p.waitForTimeout(500);
await p.focus('[data-dnd="pol"] [data-dnd-id="pol1"]');await p.keyboard.press('Alt+ArrowDown');await p.waitForTimeout(300);
log('pol order',await ev(()=>S.adm.pol.map(r=>r.id).join(',')));
// 7 forms screenshot
log('forms start');for(const [n,scr,tab,sel] of [['polform','adm_sec',1,'[data-adm="polnew"]'],['bg','adm_sec',3,'[data-adm="bgnew"]'],['upg','adm_env',2,'[data-adm="upgsched:26.12"]'],['rt','adm_gate',0,'[data-adm="rtnew"]'],['hold','adm_audit',2,'[data-adm="holdnew"]'],['kit','adm_env',1,'[data-adm="kitnew"]'],['seat','adm_meter',0,'[data-adm="seatbuy"]'],['bud','adm_gate',3,'[data-adm="budedit"]'],['ctl','adm_audit',1,'[data-adm^="ctl:c8"]']]){await p.evaluate(([a,t])=>{S.v[a]=t;go(a)},[scr,tab]);await p.waitForTimeout(500);await p.locator(sel).first().click({timeout:4000}).catch(e=>console.log('CLICKFAIL',n));await p.waitForTimeout(500);await p.screenshot({path:'out_admin/shots/form_'+n+'.png'});await ev(()=>closeDrawer());await p.waitForTimeout(250);log('form',n)}
// 8 asks
for(const q of ['who can see the Lumen contract','promote the config to UAT','how much AI have we used','change the theme']){await ev(q=>ask(q),q);await p.waitForTimeout(500);log(q,'=>',JSON.stringify(await ev(()=>({s:S.screen,last:S.chat[S.chat.length-1].t.slice(0,160)}))))}
await ev(()=>{S.v.adm_audit=0;go("adm_audit")});await p.waitForTimeout(500);await p.click('[data-adm="logcopy"]');await p.waitForTimeout(400);log('csv ta len',await ev(()=>document.getElementById('adm_csvta').value.length));
log('errors',errs);await b.close()})();
