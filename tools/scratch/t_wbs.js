const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_wbs/full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('ppm_wbs'));await p.waitForTimeout(900);
const fin=()=>p.evaluate(()=>{const P=plan('now');return [P.R.p1_9.es,P.R.p1_5.es,TASK('p1_3').dur]});
console.log('start',await fin());
// edit duration of indexer
await p.evaluate(()=>{document.querySelector('[data-wbs-sc]').scrollTop=0});
await p.fill('[data-wbs-q]','indexer');await p.waitForTimeout(900);
await p.click('[data-wbs-f="dur"][data-id="p1_3"]');await p.waitForTimeout(200);await p.fill('.wbs-ed','66');await p.keyboard.press('Enter');await p.waitForTimeout(900);
console.log('after dur 66',await fin());
await p.fill('[data-wbs-q]','indexer');await p.waitForTimeout(900);
await p.click('[data-wbs-f="dur"][data-id="p1_3"]');await p.fill('.wbs-ed','59');await p.keyboard.press('Enter');await p.waitForTimeout(900);
console.log('restored',await fin());
// bad pred
await p.fill('[data-wbs-q]','');await p.waitForTimeout(700);
await p.click('[data-wbs-f="pred"][data-id="p1_11"]');await p.fill('.wbs-ed','9.9');await p.keyboard.press('Enter');await p.waitForTimeout(500);
console.log('toast',await p.evaluate(()=>(document.querySelector('.toast,#toast')||{}).textContent));
// select + indent
await p.evaluate(()=>{S.wbs.sel={};render()});await p.waitForTimeout(500);
await p.click('[data-wbs-ck="p1_11"]');await p.click('[data-wbs-act="indent"]');await p.waitForTimeout(600);
console.log('indent',await p.evaluate(()=>wbsLn('p1_11').lv+' '+wbsLn('p1_11').wbs));
await p.evaluate(()=>{S.wbs.sel={};render()});await p.waitForTimeout(500);await p.click('[data-wbs-ck="p1_11"]');await p.click('[data-wbs-act="outdent"]');await p.waitForTimeout(600);
console.log('outdent',await p.evaluate(()=>wbsLn('p1_11').lv+' '+wbsLn('p1_11').wbs));
// drag row p1_12 above p1_11
const a=await p.$('[data-wbs-row="p1_12"] .wbs-code'),bb=await (await p.$('[data-wbs-row="p1_11"]')).boundingBox(),ab=await (await p.$('[data-wbs-row="p1_12"]')).boundingBox();
const before=await p.evaluate(()=>wbsOutline('PR1').slice(0,8).map(x=>x.id).join());
await p.mouse.move(ab.x+200,ab.y+18);await p.mouse.down();await p.mouse.move(ab.x+200,ab.y+8,{steps:3});await p.mouse.move(bb.x+200,bb.y+4,{steps:8});await p.mouse.up();await p.waitForTimeout(800);
console.log('drag\n',before,'\n',await p.evaluate(()=>wbsOutline('PR1').slice(0,8).map(x=>x.id).join()));
// forms
for(const [n,js] of [['task',"taskForm"],]){}
await p.click('[data-wbs-act="addtask"]');await p.waitForTimeout(500);await p.screenshot({path:'out_wbs/shots/f_task.png'});
await p.fill('[data-fk$=":n"]','Test task from form');await p.click('[data-fsubmit]');await p.waitForTimeout(900);
console.log('added',await p.evaluate(()=>TASKS.filter(t=>t.n==='Test task from form').map(t=>t.id+' '+t.p)));
await p.evaluate(()=>{S.wbs.sel={};S.wbs.last='p1_12';render()});await p.waitForTimeout(500);
await p.click('[data-wbs-act="link"]');await p.waitForTimeout(500);await p.screenshot({path:'out_wbs/shots/f_link.png'});
await p.click('[data-wbs-act="assign"]').catch(()=>{});
await p.evaluate(()=>closeDrawer());await p.waitForTimeout(300);
await p.click('[data-wbs-act="assign"]');await p.waitForTimeout(500);await p.screenshot({path:'out_wbs/shots/f_assign.png'});
await p.evaluate(()=>closeDrawer());await p.click('[data-wbs-act="base"]');await p.waitForTimeout(500);await p.screenshot({path:'out_wbs/shots/f_base.png'});
await p.evaluate(()=>{closeDrawer();WBSX.dict('p1_3')});await p.waitForTimeout(500);await p.screenshot({path:'out_wbs/shots/f_dict.png'});
console.log('errs',errs);await b.close()})();
