const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.env.OUT||'out_slafull');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const sh=async n=>{await p.waitForTimeout(700);await p.screenshot({path:dir+'/shots/f_'+n+'.png'})};
await p.evaluate(()=>{go('svc_sla')});await p.waitForTimeout(500);
await p.evaluate(()=>SLAX.openAg('SLA-INC-P1'));await sh('ag_drawer');
await p.evaluate(()=>{closeDrawer();SLAX.openRec('SLA-INC-P1','INC0004423')});await sh('rec_drawer');
await p.evaluate(()=>{closeDrawer();SLAX.agForm({proc:'incident',ty:'OLA'})});await sh('form_new');
await p.evaluate(()=>{closeDrawer();SLAX.creditForm('UC-LUMEN-P1')});await sh('form_credit');
await p.evaluate(()=>{closeDrawer();SLAX.policyForm('incident')});await sh('form_policy');
await p.evaluate(()=>{closeDrawer();const e=SLAX.entities().find(x=>x.cls==='incident');SLAX.openProc(e.key)});await sh('proc_drawer');
await p.evaluate(()=>{closeDrawer();const e=SLAX.entities().find(x=>x.cls==='incident');SLAX.stepForm(e.key+'|0')});await sh('form_step');
await p.evaluate(()=>{closeDrawer();SLAX.reasonForm('INC0004422')});await sh('form_reason');
await p.evaluate(()=>{closeDrawer();SLAX.retireForm('SLA-INC-P3')});await sh('form_retire');
await p.evaluate(()=>{closeDrawer();SLAX.openList('Incident and problem','x',a=>a.proc==='incident')});await sh('list_drawer');
// designer: edit via UI
await p.evaluate(()=>{closeDrawer();SLAX.loadDr('SLA-INC-P2');S.v.svc_slav=1;render()});await p.waitForTimeout(1200);
await p.selectOption('[data-sla-f="sch.cal"]','ext');await p.waitForTimeout(500);
await p.click('[data-sla-cadd="pause"]');await p.waitForTimeout(500);
await p.click('[data-sla-wadd]');await p.waitForTimeout(500);
const dirty=await p.evaluate(()=>SLAX.dr().ag.sch.cal+'|'+SLAX.dr().ag.cond.pause.rows.length+'|'+SLAX.dr().ag.warn.length);console.log('designer state',dirty);
await p.click('[data-sla-save]');await p.waitForTimeout(600);
console.log('saved ver',await p.evaluate(()=>SLAX.AGS().find(a=>a.id==='SLA-INC-P2').ver));
// new agreement via form submit
await p.evaluate(()=>{SLAX.agForm({proc:'delivery',ty:'OLA'})});await p.waitForTimeout(600);
await p.fill('input[name="n"],#f_n,[data-k="n"] input',"Project plan: tasks updated weekly").catch(async()=>{console.log('fill fallback')});
await sh('form_new_filled');
console.log('errors',errs.length?errs:'none');await b.close()})();
