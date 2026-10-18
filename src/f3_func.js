const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('C '+m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_f3_15/full.html'),{timeout:120000});await p.waitForTimeout(1000);
const T=async(f)=>await p.evaluate(f);const w=ms=>p.waitForTimeout(ms);
console.log('sod',JSON.stringify(await T(()=>R15I.sodScan().map(x=>x.person+":"+x.rule.id+":"+(x.viaGrant?"grant":"role")))));
// time approve
const before=await T(()=>BUDX.LN("PR1-LAB").act);
await T(()=>{go("r15_time");S.v.r3time=2;render()});await w(300);
await p.click('[data-r3t-ap]:visible');await w(300);
console.log('PR1-LAB act',before,'->',await T(()=>BUDX.LN("PR1-LAB").act),await T(()=>R15T.state.posts.length));
// requisition approve -> PO
await T(()=>{go("r15_p2p");S.v.r3p2p=2;render()});await w(300);
const po0=await T(()=>BUDX.B().po.length);
await p.click('[data-r3p-reqok]:visible');await w(300);
console.log('req approve by Casey: PO count',po0,'->',await T(()=>BUDX.B().po.length),'drawer?',await T(()=>!!document.querySelector('#drawer:popover-open')));
// SoD deny: Priya raised REQ-0412; act as Priya and approve
await T(()=>{S.r15i.actAs="Priya Shah";render()});await w(200);
await T(()=>{S.v.r3p2p=2;render()});await w(200);
await p.click('[data-r3p-reqok]:visible');await w(400);
console.log('denied log',JSON.stringify(await T(()=>GUARD.log().map(l=>l.who+" "+l.rule+" "+l.why))));
await T(()=>{try{closeDrawer()}catch(e){}});
// Inbox approve as service desk lead
await T(()=>{S.r15i.actAs="Tom Becker";go("inbox")});await w(900);
const btn=await p.$('[data-inbx-act="approve"]');console.log('inbox approve btn',!!btn);
if(btn){await btn.click({force:true});await w(400);console.log('after inbox click log',await T(()=>GUARD.log().length),'drawer',await T(()=>(document.querySelector('#drawer')||{}).innerText.slice(0,80)))}
await T(()=>{S.r15i.actAs=""});
// receipt + pay
await T(()=>{go("r15_p2p");S.v.r3p2p=4;render()});await w(300);
console.log('pay btns',await T(()=>document.querySelectorAll('[data-r3p-pay]').length));
// report run schedule
await T(()=>{go("r15_rpt");S.v.r3rpt=2;render()});await w(300);
await p.click('[data-r3r-advance]');await w(300);console.log('runs',await T(()=>R15R.state.runs.length));
// semantic: uncertified
console.log('run labor',JSON.stringify(await T(()=>{const r=R15R.run({measure:"sm_hours",dim:"person",top:3});return r.rows})));
// mobile approve
await T(()=>{S.r15i.actAs="";go("r15_mobile");S.r15m.tab="appr";render()});await w(300);
const nb=await T(()=>document.querySelectorAll('.r3m-card').length);await p.click('.r3m-b.ok:visible');await w(400);
console.log('mobile cards',nb,'->',await T(()=>document.querySelectorAll('.r3m-card').length),'fromMobile',await T(()=>R15M.state.fromMobile));
// jml
await T(()=>{go("r15_iam");S.v.r3iam=4;render()});await w(200);await p.click('[data-r3i-sim="leaver"]');await w(300);console.log('runs',await T(()=>R15I.state.runs.length),JSON.stringify(await T(()=>R15I.state.roleOverride)));
console.log('ERRS',JSON.stringify(errs));await b.close()})();
