const {chromium}=require('playwright');const path=require('path');
const scheme=process.argv[2]||'dark';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const p=await (await b.newContext({viewport:{width:400,height:820},colorScheme:scheme})).newPage();
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a15/full.html'),{waitUntil:'load',timeout:150000});await p.waitForTimeout(2500);
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){errs.push('EV '+e.message.slice(0,200))}};
const sh=async n=>{await p.waitForTimeout(500);await p.screenshot({path:`out_a15/t9_${scheme}_${n}.png`})};
const ox=async n=>console.log(n,'overflowX',await ev(()=>document.documentElement.scrollWidth>innerWidth+1));
await ev(()=>{S.org.mode='human';S.org.tab='chart';go('org_chart')});await p.waitForTimeout(600);
await ev(()=>{document.querySelector('.org-wrap,.org-outline').scrollIntoView()});await sh('chart');await ox('chart');
for(const t of ['vac','sync','act']){await ev(t=>{S.org.tab=t;go('org_chart')},t);await p.waitForTimeout(400);await ev(()=>{document.querySelector('.org-tabs').scrollIntoView()});await sh(t);await ox(t)}
await ev(()=>ORGX.hr.add());await ev(()=>{const s=FORMST.org5_add;Object.assign(s.vals,{name:'Zed Park',title:'Analyst',unit:'Finance',mgr:'Avery Chen',et:'ct',start:'2026-10-20',end:'2026-12-30'});refreshForm('org5_add')});await sh('add');await ox('add');
await ev(()=>submitForm('org5_add'));await sh('addres');
await ev(()=>{closeDrawer();ORGX.openProfile('Priya Shah',7)});await sh('comp');
console.log('errs',errs);await b.close()})();
