const {chromium}=require('playwright');const path=require('path');
const scheme=process.argv[2]||'dark',w=+process.argv[3]||1440;const phone=w<700;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const p=await (await b.newContext({viewport:{width:w,height:phone?820:1000},colorScheme:scheme})).newPage();
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a15/full.html'),{waitUntil:'load'});await p.waitForTimeout(1200);
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){errs.push('EV '+e.message.slice(0,200))}};
const sh=async(n,sel)=>{await p.waitForTimeout(400);if(sel){await p.locator(sel).first().screenshot({path:`out_a15/t3_${scheme}_${w}_${n}.png`})}else await p.screenshot({path:`out_a15/t3_${scheme}_${w}_${n}.png`})};
await ev(()=>{S.org.mode='human';S.org.k=0;S.org.tab='chart';go('org_chart')});await p.waitForTimeout(700);
await sh('chart','.org-wrap, .org-outline');
if(!phone){await ev(()=>{S.org.f.et='pt';render()});await sh('chartpt','.org-wrap');await ev(()=>{S.org.f.et='';render()})}
await ev(()=>document.querySelector('[data-org5-vac]').click());await sh('vacdrawer');
await ev(()=>{closeDrawer();ORGX.hr.move('Leah Moss')});await ev(()=>{const s=FORMST.org5_move;s.vals.mgr='Carla Reyes';s.vals.title='Platform engineer II';refreshForm('org5_move')});await sh('move');
await ev(()=>submitForm('org5_move'));await sh('moveres');
console.log(await ev(()=>JSON.stringify({mgr:ORGX.P('Leah Moss').mgr,ev:ORGX.hr.log()[0].events.map(e=>e.id+' '+e.eid),oc:(EVENTS.log[0]||{}).outcomes})));
await ev(()=>{closeDrawer();S.org.tab='act';render()});await sh('act');
await ev(()=>{ORGX.openProfile('Femi Adeyemi',7)});await sh('pto');
await ev(()=>{closeDrawer();ORGX.hr.term('Anil Mehta')});await sh('term');
console.log('errs',errs);await b.close()})();
