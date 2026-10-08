const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:2600}})).newPage();const e=[];p.on('pageerror',x=>e.push('PE '+x.message));p.on('console',m=>m.type()==='error'&&e.push(m.text()));
await p.goto('file://'+process.cwd()+'/out_ppm/full.html');await p.waitForTimeout(400);const D='out_ppm/shots/';
async function drag(sel,tsel){const a=await p.$(sel),t=await p.$(tsel);const ba=await a.boundingBox(),bt=await t.boundingBox();await p.mouse.move(ba.x+40,ba.y+20);await p.mouse.down();await p.mouse.move(ba.x+60,ba.y+60,{steps:4});await p.mouse.move(bt.x+bt.width/2,bt.y+bt.height/2,{steps:12});await p.mouse.up();await p.waitForTimeout(500)}
await p.evaluate(()=>{S.v.ppmv=3;go('ppm_proj')});await p.waitForTimeout(400);
// drag Elise Park to PR2 team list
await drag('.ppm-plist [data-dnd-id="Elise Park"]','[data-dnd="team:PR2"]');
console.log('team PR2:',await p.evaluate(()=>ppmTeam('PR2').join()));
await p.screenshot({path:D+'d1.png'});
// drag Triage Agent... to PR1
await drag('.ppm-plist [data-dnd-id="Change Risk Agent"]','[data-dnd="team:PR3"]');await p.waitForTimeout(900);
console.log('acct form:',await p.evaluate(()=>!!document.querySelector('[data-form="ppm_acct"]')));await p.screenshot({path:D+'d2.png'});
// drop AI on PM slot
await p.evaluate(()=>closeDrawer());await p.waitForTimeout(300);
await drag('.ppm-plist [data-dnd-id="PMO Agent"]','[data-dnd="pm:PR3"]');
// person click
await p.evaluate(()=>person360('Maya Ortiz'));await p.waitForTimeout(400);
await p.evaluate(()=>{document.querySelector('#drawer input[data-vw="p360:1"]')?.click()});await p.waitForTimeout(300);await p.screenshot({path:D+'p360.png'});
console.log('p360 groups:',await p.evaluate(()=>workFor('Maya Ortiz').map(g=>g.tag).join()));
await p.evaluate(()=>{closeDrawer();ppmOpenProject('PR1')});await p.waitForTimeout(400);await p.screenshot({path:D+'pd.png'});
// demand drag
await p.evaluate(()=>{closeDrawer();S.v.port=0;go('port')});await p.waitForTimeout(400);
await p.evaluate(()=>window.scrollTo(0,1500));
const rows=await p.$$('.drow.vd');const b1=await rows[4].boundingBox(),b0=await rows[0].boundingBox();
await p.mouse.move(b1.x+60,b1.y+20);await p.mouse.down();await p.mouse.move(b1.x+60,b1.y-30,{steps:5});await p.mouse.move(b0.x+60,b0.y+4,{steps:12});await p.mouse.up();await p.waitForTimeout(500);
console.log('reorder form:',await p.evaluate(()=>!!document.querySelector('[data-form="ppm_reorder"]')));
await p.evaluate(()=>closeDrawer());
// triggers
await p.evaluate(()=>{S.v.port=4;render()});await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-ppm-trig="tbm"]').click());await p.waitForTimeout(500);
await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:D+'trig.png'});
console.log('trig demand:',await p.evaluate(()=>DEMAND.filter(d=>d.trig).map(d=>d.id+':'+dscore(d,S.w)).join()));
// intake form + fund
await p.evaluate(()=>document.querySelector('[data-ppm-intake]').click());await p.waitForTimeout(400);await p.screenshot({path:D+'intake.png'});
await p.evaluate(()=>{closeDrawer();ppmOpenDemand('D1')});await p.waitForTimeout(400);await p.screenshot({path:D+'dd.png'});
await p.evaluate(()=>{closeDrawer();S.v.ppmv=6;go('ppm_proj')});await p.waitForTimeout(400);
await p.evaluate(()=>{const f=document.querySelector('[data-ppm-fill]');f&&f.click()});await p.waitForTimeout(300);
await p.evaluate(()=>{closeDrawer();go('ppm_raid');S.v.raid=2;render()});await p.waitForTimeout(400);await p.screenshot({path:D+'heat.png',fullPage:false});
await p.evaluate(()=>{ppmOpenRaid('R-104')});await p.waitForTimeout(300);await p.screenshot({path:D+'ri.png'});
await p.evaluate(()=>{closeDrawer();document.querySelector('[data-ppm-radd]').click()});await p.waitForTimeout(300);await p.screenshot({path:D+'rf.png'});
console.log('errors',e);await b.close()})();
