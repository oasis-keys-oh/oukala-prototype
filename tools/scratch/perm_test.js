/* Playwright policy test for the Permissions model. Usage: node perm_test.js <outdir> [--quiet]
   Iterates all 13 personas over all screens and asserts a policy table (independent of the rule data), listing violations. Exit code 1 on any violation. */
const {chromium}=require('playwright');const path=require('path');
const dir=path.resolve(process.argv[2]||'out_g16');const quiet=process.argv.includes('--quiet');
/* ---- policy table (written down independently of the seed rules) ---- */
const ALL=["exec","fin","pm","ops","portfolio","change","arch","admin","audit","board","guest","emp","newhire","cco","dist","fac","scm","plant","proc"];
const POLICY={ /* screen -> personas that may open it */
 inv:["fin","exec","audit"], r15_p2p:["fin","exec","audit"], bud_lines:["fin","exec","audit","portfolio"], bud_over:["fin","exec","audit","portfolio"], bud_doa:["fin","exec","audit","portfolio"],
 bud_req:["fin","exec","portfolio","pm","arch","audit","board"],
 ppl_perf:["exec","portfolio"], ppl_av:["exec","portfolio","pm"],
 adm_sec:["admin","audit","exec"], r15_iam:["admin","audit","exec"], r16g_perm:["admin","audit","exec"], adm_audit:["admin","audit","exec"],
 exe_board:["exec","board","audit"], grc_home:["audit","exec","admin","board"], adm_meter:["admin","fin","exec"],
 itsm_inc:["ops","change","arch","admin","pm","portfolio","exec","audit","proc"], svc_portal:ALL, home:ALL};
const NEVER_FOR_OPS=["inv","bud_req","bud_lines","bud_over","ppl_perf","ppl_av","r15_p2p","adm_sec","r15_iam","r16g_perm","exe_board"];
/* person drawer tabs for a subject */
const SUBJECT="Priya Shah"; /* reports to Maya Ortiz (portfolio), under Casey Rowan (exec); persona pm IS Priya */
const TAB_POLICY={Performance:["exec","portfolio","pm"],"Pay and PTO":["exec","portfolio","pm"], /* PTO part: chain+self; pay content is further limited below */ };
const PAY_BLOCK=["pm"]; /* compensation block (pay) visible only to self (and HR, which is no persona) */
const BUD_DECIDERS_DEC=["fin","exec"]; /* funding decision stage */
const viol=[];const V=(persona,check,detail)=>{viol.push({persona,check,detail})};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:180000});await p.waitForSelector('#nav',{state:'attached',timeout:170000});await p.waitForFunction(()=>window.PERM&&window.NAVX&&NAVX.persona&&document.querySelector('#nav')&&document.querySelector('#view'),null,{timeout:170000});await p.waitForTimeout(1500);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const T0=Date.now();
const rows=[];
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
for(const k of ALL){if(ONLY.length&&!ONLY.includes(k))continue;
 await p.evaluate(k=>{PERM.state.log.length=0;NAVX.persona.set(k);S.screen="home";render()},k);await p.waitForTimeout(120);
 let nOpen=0,nDen=0;
 const RA=process.argv.includes('--render-all');const KEY=Object.keys(POLICY);
 const res=await p.evaluate(({ids,RA,KEY})=>{const out=[];const navIds=new Set([...document.querySelectorAll('#nav [data-nx-it]')].map(e=>e.dataset.nxIt));
  for(const id of ids){try{const can=PERM.can(null,'read','screen:'+id).ok;let den=null;
   if(RA||!can||KEY.includes(id)){go(id);den=!!document.getElementById('view').querySelector('[data-perm-denied]')}
   out.push({id,den,nav:navIds.has(id),can})}catch(e){out.push({id,err:e.message})}}return out},{ids,RA,KEY});
 for(const r of res){const id=r.id;
  if(r.err){V(k,'render-error',id+': '+r.err);continue}
  if(r.den!==null&&r.den===r.can)V(k,'screen-render-mismatch',id+' evaluator='+(r.can?'allow':'deny')+' but view '+(r.den?'denied':'rendered'));
  if(!r.can&&r.nav)V(k,'nav-leak',id+' denied but present in the menu');
  if(r.can)nOpen++;else nDen++;
  if(POLICY[id]){const want=POLICY[id].includes(k);if(want!==r.can)V(k,'policy',id+' should be '+(want?'open':'denied')+' for '+k+' but is '+(r.can?'open':'denied'))}
  if(k==='ops'&&NEVER_FOR_OPS.includes(id)&&r.den===false)V(k,'service-desk-leak',id+' rendered for service desk');
 }
 console.log('persona',k,'open',nOpen,'denied',nDen,'at',Math.round((Date.now()-T0)/1000),'s');
 rows.push([k,nOpen,nDen]);
 /* ---- person drawer tabs ---- */
 const hrGrant=await p.evaluate(()=>PERM.principal().roles.includes('hr')); /* PS-HR grants (e.g. GR-4 to Maya Ortiz) lift a persona to the HR role */
 await p.evaluate(k=>{go('home')},k);
 const tabs=await p.evaluate(n=>{person360(n);window.__dtxt=document.getElementById('drawer').innerText;const L=[...document.querySelectorAll('#drawer .views[data-views="p360"] .vsw label')].map(x=>x.textContent.trim());return L},SUBJECT);
 for(const t of ["Performance","Performance and growth","Delivery performance"])if(tabs.includes(t)&&!TAB_POLICY.Performance.includes(k)&&!hrGrant)V(k,'person-tab-leak',t+' visible for '+SUBJECT);
 for(const t of ["Performance"])if(tabs.includes(t)===false&&tabs.length&&TAB_POLICY.Performance.includes(k)&&!tabs.includes("Performance and growth"))V(k,'person-tab-missing','Performance expected for '+k);
 const dtxt=await p.evaluate(()=>window.__dtxt||'');
 if(/Goal attainment|Last rating|Base salary|Bonus target|Pay grade/.test(dtxt)&&!TAB_POLICY.Performance.includes(k)&&!hrGrant)V(k,'person-drawer-text-leak','sensitive text in person drawer for '+SUBJECT);
 await p.evaluate(()=>closeDrawer());
 const org=await p.evaluate(async n=>{try{ORGX.openProfile?ORGX.openProfile(n):(window.O&&O.openProfile&&O.openProfile(n))}catch(e){}await new Promise(r=>setTimeout(r,120));const d=document.getElementById('drawer');const L=[...d.querySelectorAll('.views[data-views="org_p"] .vsw label')].map(x=>x.textContent.trim());const h4=[...d.querySelectorAll('h4.org5-h')].map(x=>x.textContent.trim());return{L,h4,sec:PERM.section(null,'person.pay',n).ok,who:PERM.principal().user,html:d.querySelectorAll('h4.org5-h').length}},SUBJECT).catch(()=>({L:[],h4:[]}));
 if(org.L.includes('Performance')&&!TAB_POLICY.Performance.includes(k)&&!hrGrant)V(k,'org-profile-tab-leak','Performance tab visible for '+SUBJECT);
 if(org.L.includes('Pay and PTO')&&!TAB_POLICY["Pay and PTO"].includes(k)&&!hrGrant)V(k,'org-profile-tab-leak','Pay and PTO visible for '+SUBJECT);
 if(org.h4.includes('Compensation')&&!PAY_BLOCK.includes(k)&&!hrGrant)V(k,'pay-leak','Compensation block visible for '+SUBJECT+' (section.ok='+org.sec+', viewer='+org.who+')');
 await p.evaluate(()=>closeDrawer());
 /* ---- org chart badges ---- */
 const badge=await p.evaluate(async()=>{go('org_chart');await new Promise(r=>setTimeout(r,250));if(document.querySelector('[data-perm-denied]'))return -1;return {me:PERM.principal().user,names:[...document.querySelectorAll('.org-card')].filter(c=>[...c.querySelectorAll('.org-m em')].some(e=>/% load/.test(e.textContent))).map(c=>c.dataset.orgOpen)}});
 if(badge&&Array.isArray(badge.names)&&['ops','emp','newhire','guest','board','change','arch','admin','audit','fin'].includes(k)){const other=badge.names.filter(n=>n!==badge.me);if(other.length)V(k,'org-load-badge-leak',other.length+' load badges on other people ('+other.slice(0,3).join(', ')+')')}
 /* ---- budget approvals ---- */
 const bud=await p.evaluate(async()=>{const out={};const rs=BUDREQ.requests();const dec=rs.find(r=>r.st==='dec')||rs[0];if(!dec)return{none:1};
  out.decide=PERM.can(null,'approve','budget_request',PERM.recordOf('budget_request',dec.id)).ok;
  go('bud_req');await new Promise(r=>setTimeout(r,200));
  if(document.querySelector('[data-perm-denied]'))return{screen:'denied',decide:out.decide};
  BUDREQ.openReq(dec.id);await new Promise(r=>setTimeout(r,250));
  const btn=document.querySelector('#drawer [data-br-act$=":Approve"]');out.btn=!!btn;out.btnEnabled=!!btn&&!btn.disabled&&btn.getAttribute('aria-disabled')!=='true';
  /* click, then keyboard, then submit path */
  let opened=false;if(btn){btn.click();await new Promise(r=>setTimeout(r,200));opened=!!document.querySelector('#drawer [data-form="budreq_dec"]')}
  out.clickOpened=opened;
  let submit=null;try{submit=typeof submitForm==='function'&&FORMSPEC&&FORMSPEC.budreq_dec?submitForm('budreq_dec'):null}catch(e){submit='err'}
  out.submitReturn=submit;
  const bad=BUDREQ.decide(dec.id,'Approve','test','Probe');out.apiOk=bad&&bad.ok!==false;
  return out});
 if(bud.none)V(k,'test-setup','no budget request in data');
 else{
  if(bud.decide!==BUD_DECIDERS_DEC.includes(k)&&!(k==='portfolio'||k==='arch'))V(k,'budget-decide-policy','funding-stage decision should be '+(BUD_DECIDERS_DEC.includes(k)?'allowed':'denied')+' for '+k);
  if(!BUD_DECIDERS_DEC.includes(k)){ if(bud.clickOpened)V(k,'budget-approve-click','Approve button opened the decision form for '+k); if(bud.submitReturn===true)V(k,'budget-approve-submit','form submit returned success for '+k); if(bud.apiOk&&!['portfolio','arch'].includes(k))V(k,'budget-approve-api','BUDREQ.decide succeeded for '+k)}
  if(k==='ops'&&(bud.btnEnabled||bud.clickOpened))V(k,'service-desk-budget-approve','service desk can approve a budget request')}
 /* ---- search ---- */
 const srch=await p.evaluate(()=>{const ix=searchIndex();return{inv:ix.filter(r=>r.g==='Invoices').length,perf:ix.filter(r=>r.g==='Go to'&&/Performance management/.test(r.t)).length}});
 if(srch.inv&&!['fin','exec','audit'].includes(k))V(k,'search-leak',srch.inv+' invoice results');
 if(srch.perf&&!['exec','portfolio'].includes(k))V(k,'search-leak','Performance management screen in search');
 await p.evaluate(()=>closeDrawer());
}
/* ---- the audit trail has the denials ---- */
const logc=await p.evaluate(()=>({deny:PERM.state.log.filter(l=>l.type==='deny').length,rev:PERM.state.log.filter(l=>l.type==='reveal').length}));
console.log('persona,screens open,screens denied');rows.forEach(r=>console.log(r.join(',')));
console.log('elapsed s',Math.round((Date.now()-T0)/1000),'| denial log (last persona):',logc.deny,'reveals:',logc.rev);
console.log('console errors:',errs.length);errs.slice(0,8).forEach(e=>console.log('  ',e.slice(0,200)));
console.log('VIOLATIONS:',viol.length);viol.slice(0,80).forEach(v=>console.log(' -',v.persona,v.check,v.detail));
await b.close();process.exit(viol.length||errs.length?1:0)})();
