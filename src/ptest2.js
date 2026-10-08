const {chromium}=require('playwright');const path=require('path');const dir=path.resolve('out_people');
(async()=>{try{var b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const c=await b.newContext({viewport:{width:1440,height:1800}});const p=await c.newPage();const errs=[];p.setDefaultTimeout(8000);p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const drag=async(from,to,steps=12,hold)=>{const a=await p.locator(from).first().boundingBox();let t=await p.locator(to).first().boundingBox();await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2+10,a.y+a.height/2+10,{steps:3});await p.waitForTimeout(200);t=await p.locator(to).first().boundingBox();await p.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps});if(hold)await hold();await p.mouse.up();await p.waitForTimeout(300)};
// 1 org drag
await p.evaluate(()=>go('ppl_org'));await p.waitForTimeout(400);
await p.evaluate(()=>{document.querySelector('[data-ppl-all="1"]').click()});await p.waitForTimeout(300);
await drag('[data-ppl-wi="W3"]','[data-ppl-drop="rk"]',12,async()=>{console.log('HOLD orgdrag',await p.evaluate(()=>(document.querySelector('.ppl-ghost')||{}).innerText))});
console.log('W3 owner',await p.evaluate(()=>S.ppl.work.find(i=>i.id==='W3').owner));
// overload drop
await drag('[data-ppl-wi="W4"]','[data-ppl-drop="tb"]');await p.screenshot({path:dir+'/shots/t_overload.png',timeout:25000});
console.log('W4 owner',await p.evaluate(()=>S.ppl.work.find(i=>i.id==='W4').owner));
await p.evaluate(()=>closeDrawer());
// agent blocked
await drag('[data-ppl-wi="W2"]','[data-ppl-drop="oa"]');console.log('W2 owner (expect null)',await p.evaluate(()=>S.ppl.work.find(i=>i.id==='W2').owner));
// alloc drag
await p.evaluate(()=>go('ppl_cap'));await p.waitForTimeout(1800);
const before=await p.evaluate(()=>JSON.stringify(S.ppl.alloc.bi[3]));
await drag('[data-ppl-chip="bi:3:PR1"]','[data-ppl-zone="PR2"]',10,async()=>{console.log('HOLD allocdrag',await p.evaluate(()=>(document.querySelector('.ppl-ghost')||{}).innerText))});
console.log('alloc',before,'->',await p.evaluate(()=>JSON.stringify(S.ppl.alloc.bi[3])));
await p.click('[data-ppl-level]');await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/t_level.png',timeout:25000});await p.click('[data-ppl-applylevel]');await p.waitForTimeout(300);
// views
for(const [i,n] of [[1,'skills'],[2,'avail'],[3,'find']]){await p.evaluate(i=>{S.v.ppl_cap=i;render()},i);await p.waitForTimeout(250);await p.screenshot({path:dir+'/shots/t_cap_'+n+'.png',timeout:25000,fullPage:true})}
await p.evaluate(()=>document.querySelector('[data-ppl-find]').click());await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/t_findform.png',timeout:25000});
await p.evaluate(()=>closeDrawer());
// av drag
await p.evaluate(()=>{S.v.ppl_av=0;S.ppl.avd.view='week';go('ppl_av')});await p.waitForTimeout(1800);
const bk0=await p.evaluate(()=>JSON.stringify(S.ppl.bk.find(b=>b.id==='b3')));
await drag('[data-ppl-bk="b3"]','[data-ppl-room="R3"][data-ppl-day="7"]',10,async()=>{console.log('HOLD bkdrag',await p.evaluate(()=>(document.querySelector('.ppl-ghost')||{}).innerText))});
console.log('b3',bk0,'->',await p.evaluate(()=>JSON.stringify(S.ppl.bk.find(b=>b.id==='b3'))));
// conflict: move b2 to R2 Tue at 10 where? drop b8 onto R1 at b? just try conflicting

await p.evaluate(()=>bookForm?0:0).catch(()=>{});
await p.click('[data-ppl-book]');await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/t_bookform.png',timeout:25000});await p.evaluate(()=>closeDrawer());
for(const i of [1,2]){await p.evaluate(i=>{S.v.ppl_av=i;render()},i);await p.waitForTimeout(250);await p.screenshot({path:dir+'/shots/t_av_'+i+'.png',timeout:25000,fullPage:true})}
// week view
await p.evaluate(()=>{S.v.ppl_av=0;S.ppl.avd.view='week';render()});await p.waitForTimeout(250);await p.screenshot({path:dir+'/shots/t_av_week.png',timeout:25000,fullPage:true});
// journey
await p.evaluate(()=>{go('ppl_jrny')});await p.waitForTimeout(300);
await drag('[data-dnd-id="st1"]','[data-dnd-id="st4"]',10);console.log('stages',await p.evaluate(()=>S.ppl.jr.list[0].stages.map(s=>s.id).join(',')));
await p.click('[data-ppl-raisepain]:not([disabled])');await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/t_painform.png',timeout:25000});await p.click('[data-fsubmit]');await p.waitForTimeout(300);console.log('raised',await p.evaluate(()=>S.ppl.jr.raised.length));
// meet kanban
await p.evaluate(()=>{S.v.ppl_meet=1;go('ppl_meet')});await p.waitForTimeout(300);
const a0=await p.evaluate(()=>S.ppl.acts.find(a=>a.id==='A5').st);await drag('[data-dnd-id="A5"]','[data-dnd="done"]',10);console.log('A5',a0,'->',await p.evaluate(()=>S.ppl.acts.find(a=>a.id==='A5').st));
await p.screenshot({path:dir+'/shots/t_kanban.png',timeout:25000,fullPage:true});
await p.evaluate(()=>{S.v.ppl_meet=3;render()});await p.click('[data-ppl-minutes]');await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/t_minform.png',timeout:25000});await p.evaluate(()=>closeDrawer());
// train views
for(const i of [1,2,3,4]){await p.evaluate(i=>{S.v.ppl_train=i;go('ppl_train')},i);await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/t_train_'+i+'.png',timeout:25000,fullPage:true})}
await p.evaluate(()=>{S.v.ppl_train=3;go('ppl_train')});await p.click('[data-ppl-import]');await p.waitForTimeout(300);
await p.setInputFiles('input[type=file]',{name:'security-refresher-xapi.zip',mimeType:'application/zip',buffer:Buffer.from('PK')});await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/t_importform.png',timeout:25000});
await p.click('[data-fsubmit]');await p.waitForTimeout(400);console.log('courses',await p.evaluate(()=>S.ppl.courses.length));
// player
await p.evaluate(()=>{S.v.ppl_train=4;go('ppl_train')});
for(let i=0;i<8;i++){const m=p.locator('[data-ppl-mod="done"]');if(await m.count())await m.first().click().catch(()=>{});await p.waitForTimeout(80)}
await p.screenshot({path:dir+'/shots/t_player.png',timeout:25000,fullPage:true});
// chat
for(const q of ['who is overloaded','book the boardroom Thursday at 2','who has not done security training','show the org chart']){await p.evaluate(q=>ask(q),q);await p.waitForTimeout(300);console.log(q,'=>',await p.evaluate(()=>S.chat[S.chat.length-1].t.slice(0,140)),await p.evaluate(()=>S.screen))}
console.log('errors',errs);}catch(e){console.log("FAIL",e.message.slice(0,300))}await b.close()})();
