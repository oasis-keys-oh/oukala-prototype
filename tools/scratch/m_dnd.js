const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>{go('meet_hub');S.v.meet=1;render()});await p.waitForTimeout(300);
const drag=async(sel,toSel)=>{const a=await p.locator(sel).first().boundingBox(),t=await p.locator(toSel).first().boundingBox();await p.mouse.move(a.x+20,a.y+20);await p.mouse.down();await p.mouse.move(a.x+30,a.y+30,{steps:3});await p.mouse.move(t.x+40,t.y+40,{steps:8});await p.mouse.up();await p.waitForTimeout(500)};
// move m10 (Oct 9 beta readiness) to Sat Oct 10? choose Wed Oct 7 lists
await drag('[data-dnd-id="m10"]','[data-dnd="d:2026-10-10"]');
console.log('drawer open:',await p.evaluate(()=>document.querySelector('#drawer').matches(':popover-open')),await p.evaluate(()=>document.querySelector('#drawer').innerText.slice(0,160).replace(/\n/g,' | ')));
await p.screenshot({path:dir+'/shots/dnd1.png'});
await p.evaluate(()=>document.querySelector('[data-mt=rs-go]').click());await p.waitForTimeout(400);
console.log('m10 dt:',await p.evaluate(()=>MEETX.mById('m10').dt));
// actions board drag
await p.evaluate(()=>{S.v.meet=2;S.meet.av='board';render()});await p.waitForTimeout(300);
const id=await p.evaluate(()=>document.querySelector('[data-dnd="st:open"] [data-dnd-id]').dataset.dndId);
await drag('[data-dnd="st:open"] [data-dnd-id]','[data-dnd="st:done"]');
console.log('action',id,await p.evaluate(i=>MEETX.aById(i).st,id));
console.log('errors',errs.length?errs:'none');await b.close()})();
