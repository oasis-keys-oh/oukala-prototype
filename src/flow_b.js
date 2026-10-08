const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_budget');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:2400}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);
const shot=n=>p.screenshot({path:dir+'/shots/f_'+n+'.png'});
await p.evaluate(()=>{S.v.budv=1;go('bud_over')});await p.waitForTimeout(300);
// drag PR1-HW to PR3
const src=await p.locator('[data-dnd-id="PR1-HW"]').boundingBox();await p.locator('[data-dnd-id="PR1-HW"]').scrollIntoViewIfNeeded();
const s2=await p.locator('[data-dnd-id="PR1-HW"]').boundingBox();const t=await p.locator('[data-dnd="PR3"]').boundingBox();
await p.mouse.move(s2.x+60,s2.y+30);await p.mouse.down();await p.mouse.move(s2.x+80,s2.y+50,{steps:4});await p.mouse.move(t.x+100,t.y+40,{steps:12});await p.mouse.up();await p.waitForTimeout(500);
await shot('xfer');console.log('drawer open',await p.evaluate(()=>document.querySelector('#drawer').matches(':popover-open')));
await p.click('[data-fsubmit="bud_xfer"]');await p.waitForTimeout(400);
console.log('PR1-HW appr',await p.evaluate(()=>S.bud.lines.find(l=>l.id==='PR1-HW').appr),'PR3 total',await p.evaluate(()=>S.bud.lines.filter(l=>l.p==='PR3').reduce((a,l)=>a+l.appr,0)),'xf',await p.evaluate(()=>S.bud.xf.length));
// reforecast
await p.evaluate(()=>go('bud_over'));await p.click('.hero [data-bud-refc]');await p.waitForTimeout(400);await shot('refc');
await p.fill('[data-fk="bud_refc:why"]','Test reason');await p.click('[data-fsubmit="bud_refc"]');await p.waitForTimeout(300);
console.log('ledger',await p.evaluate(()=>S.bud.led.map(e=>e.id+e.st).join(',')));
// approve RL-04
await p.evaluate(()=>{S.v.budv=4;go('bud_over')});await p.click('[data-bud-led="RL-04:ok"]');await p.waitForTimeout(300);console.log('bal',await p.evaluate(()=>S.bud.led.filter(e=>e.st==='Approved').reduce((a,e)=>a+e.amt,0)));
// vendors forms
await p.evaluate(()=>{S.v.budx=4;go('bud_ven')});await p.click('.hero [data-bud-newpo]');await p.waitForTimeout(400);await shot('po');
await p.click('[data-fsubmit="bud_npo"]');await p.waitForTimeout(300);
await p.evaluate(()=>go('bud_ven'));await p.click('.hero [data-bud-newvend]');await p.waitForTimeout(300);await p.fill('[data-fk="bud_nvend:n"]','Harbor Analytics');await p.fill('[data-fk="bud_nvend:cat"]','Analytics consulting');await p.click('[data-fchip^="bud_nvend:own:"]');await p.click('[data-fsubmit="bud_nvend"]');await p.waitForTimeout(300);console.log('vendors',await p.evaluate(()=>S.bud.vend.length));
await p.evaluate(()=>{S.v.budx=1;go('bud_ven')});await p.click('tr[data-bud-ct="CT-104"]');await p.waitForTimeout(400);await shot('contract');
await p.keyboard.press('Escape');await p.waitForTimeout(200);
await p.evaluate(()=>{S.v.budx=2;go('bud_ven')});await p.click('[data-bud-decide="CT-107"]');await p.waitForTimeout(300);await p.click('[data-fsubmit="bud_dec"]');await p.waitForTimeout(300);console.log('renew metric',await p.evaluate(()=>METRICS.m_renew.cur));
// benefits measurement
await p.evaluate(()=>go('bud_ben'));await p.click('.hero [data-bud-measure]');await p.waitForTimeout(300);await p.fill('[data-fk="bud_meas:val"]','20000');await p.click('[data-fchip^="bud_meas:how:"]');await p.fill('[data-fk="bud_meas:ev"]','Q1 ledger');await shot('meas');await p.click('[data-fsubmit="bud_meas"]');await p.waitForTimeout(300);console.log('benefit metric',await p.evaluate(()=>METRICS.m_benefit.cur));
// DoA tier edit + simulation
await p.evaluate(()=>{S.v.budd=3;go('bud_doa')});await p.click('[data-bud-tier="T3"]');await p.waitForTimeout(300);await shot('tier');await p.keyboard.press('Escape');
await p.evaluate(()=>{S.v.budd=1;go('bud_doa')});await p.fill('[data-bud-sim="amt"]','300000');await p.waitForTimeout(200);console.log('sim',await p.textContent('#bud-sim-out .pill'));
// model: slider, alloc form
await p.evaluate(()=>{S.v.budm=3;go('bud_model')});await p.locator('[data-bud-rng="rate"]').fill('12');await p.waitForTimeout(200);console.log('npv text',(await p.textContent('[data-bud-calc="tco"] .formula')).slice(0,60));
await p.evaluate(()=>{S.v.budm=4;render()});await p.click('[data-bud-alloc="PR3"]');await p.waitForTimeout(300);await shot('alloc');
// chat
await p.evaluate(()=>ask('who approves a $75,000 purchase?'));await p.waitForTimeout(300);console.log(await p.evaluate(()=>S.chat.slice(-1)[0].t));
await p.evaluate(()=>ask('how much reserve is left'));console.log(await p.evaluate(()=>S.chat.slice(-1)[0].t));
await p.evaluate(()=>ask('which contracts renew this quarter'));console.log(await p.evaluate(()=>S.chat.slice(-1)[0].t));
await p.evaluate(()=>ask('show the budget'));console.log(await p.evaluate(()=>S.screen));
console.log('search',await p.evaluate(()=>searchIndex().filter(x=>x.g==='Contracts').length));
console.log('errors',errs.length?errs:'none');await b.close()})();
