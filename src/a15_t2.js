const {chromium}=require('playwright');const path=require('path');
const scheme=process.argv[2]||'dark',w=+process.argv[3]||1440;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const p=await (await b.newContext({viewport:{width:w,height:w<700?820:1000},colorScheme:scheme})).newPage();
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a15/full.html'),{waitUntil:'load'});await p.waitForTimeout(1200);
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){errs.push('EV '+e.message.slice(0,200))}};
const sh=async n=>{await p.waitForTimeout(350);await p.screenshot({path:`out_a15/t2_${scheme}_${w}_${n}.png`})};
await ev(()=>{S.org.mode='human';S.org.k=0;go('org_chart')});await p.waitForTimeout(500);
await ev(()=>{document.querySelector('[data-org-all="expand"]').click()});await p.waitForTimeout(500);
await ev(()=>{document.querySelector('[data-org-z="fit"]').click()});
await p.locator('.org-wrap').first().scrollIntoViewIfNeeded();await sh('chart');
// add person
await ev(()=>{ORGX.hr.add()});await p.waitForTimeout(300);
await ev(()=>{const s=FORMST.org5_add;Object.assign(s.vals,{name:'Dana Whitlock',title:'Release analyst',unit:'Change and release',mgr:'Nia Brooks',et:'pt',fte:.6,start:'2026-10-19',loc:'Remote'});refreshForm('org5_add')});await sh('add');
await ev(()=>submitForm('org5_add'));await sh('addres');
console.log('add',await ev(()=>JSON.stringify({p:!!ORGX.P('Dana Whitlock'),et:ORGX.etOf('Dana Whitlock'),log:ORGX.hr.log().length,ev:ORGX.hr.log()[0].events.map(e=>e.id+':'+e.via),queued:ORGX.hr.queued()})));
// leaver
console.log('own before',await ev(()=>JSON.stringify(Object.fromEntries(Object.entries(ORGX.ownRecs('Paula Grant')).map(([k,v])=>[k,v.length])))));
await ev(()=>ORGX.hr.term('Paula Grant'));await sh('term');
console.log('fields',await ev(()=>JSON.stringify(Object.keys(FORMST.org5_term.vals))));
await ev(()=>submitForm('org5_term'));await sh('termres');
console.log('after',await ev(()=>JSON.stringify({still:!!ORGX.P('Paula Grant'),owner:ORGX.owns('Sam Patel').map(x=>x.label+':'+x.role).join(),own:Object.fromEntries(Object.entries(ORGX.ownRecs('Tom Becker')).map(([k,v])=>[k,v.length])),dirs:ORGX.hr.log()[0].moved})));
// vacancy fill
await ev(()=>ORGX.hr.fill('V05'));await sh('fill');
await ev(()=>{const s=FORMST.org5_add;s.vals.name='Mira Castellan';});await ev(()=>submitForm('org5_add'));
console.log('vac',await ev(()=>JSON.stringify({open:ORGX.vacOpen().length,s:ORGX.stats5(),ev:ORGX.hr.log()[0].events.map(e=>e.id)})));
// profile comp
await ev(()=>ORGX.openProfile('Anil Mehta',7));await sh('comp');
await ev(()=>document.querySelector('[data-org5="reveal"]').click());await sh('comp2');
// tabs
for(const t of ['vac','sync','act']){await ev(t=>{S.org.tab=t;closeDrawer();go('org_chart')},t);await sh('tab_'+t)}
console.log('errs',errs);await b.close()})();
