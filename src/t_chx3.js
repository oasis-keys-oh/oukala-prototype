const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_full');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);
const ev=js=>p.evaluate(js).catch(e=>{errs.push('eval: '+e.message)});
const say=async q=>{await p.fill('#chatq',q);await p.press('#chatq','Enter');await p.waitForTimeout(1500)};
await ev("CHATX.open('chat')");
await say('Order a developer laptop for Hana Koval');
await p.fill('[data-cx-f$=":just"]','Needs more memory for builds').catch(e=>console.log('no just field'));
await p.click('[data-cx-do^="form-submit"]');await p.waitForTimeout(2500);
console.log('acts',await ev("CHATX.ST.acts.map(a=>a.title+':'+a.status+' steps '+a.steps.map(s=>s.status).join(','))"));
console.log('reqs',await ev("CHATX.ST.reqs.map(r=>r.id+':'+r.state)"));
// approve gates via demo
for(let i=0;i<4;i++){const b=await p.$('[data-cx-do^="gate:"][data-cx-do$="demo"], [data-cx-do^="reqgate:"][data-cx-do$=":demo"]');if(!b)break;await b.click();await p.waitForTimeout(1500)}
console.log('after',await ev("CHATX.ST.acts.map(a=>a.title+':'+a.status+' steps '+a.steps.map(s=>s.status).join(','))"));
console.log('reqs',await ev("CHATX.ST.reqs.map(r=>r.id+':'+r.state)"), 'itsm req tail', await ev("S.itsm.req.slice(0,2).map(r=>r.id)"));
await say('Who has the request for Rosa Delgado\'s laptop?');
console.log('last',await ev("CHATX.cur().msgs.slice(-1)[0].t.replace(/<[^>]+>/g,'')+' / '+(CHATX.cur().msgs.slice(-1)[0].cards||[]).map(c=>c.t)"));
await say('Log an incident: portal is slow for editors');
const run=await p.$('[data-cx-do^="plan-run"]');if(run){await run.click();await p.waitForTimeout(2500)}
console.log('inc acts',await ev("CHATX.ST.acts[0].title+':'+CHATX.ST.acts[0].status"));
const un=await p.$('[data-cx-do^="plan-undo"]');console.log('undo btn',!!un);if(un){await un.click();await p.waitForTimeout(1200);console.log('undone',await ev("CHATX.ST.acts[0].status"))}
console.log('audit',await ev("AUDIT.filter(x=>/^chat/.test(x.a)).length"));
console.log('errors:',errs.length?errs:'none');await b.close()})();
