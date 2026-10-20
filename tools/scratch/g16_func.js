const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2]+'/full.html',{waitUntil:'domcontentloaded',timeout:170000});
await p.waitForFunction(()=>window.PERM&&window.NAVX&&NAVX.persona&&document.querySelector('#nav')&&document.querySelector('#view'),null,{timeout:170000});await p.waitForTimeout(1500);
const E=(f,a)=>p.evaluate(f,a);const out=(n,v)=>console.log(n,JSON.stringify(v));
/* 1. keyboard + form paths as the service desk (denied) and finance (allowed) */
await E(()=>{NAVX.persona.set('pm');go('bud_req');BUDREQ.openReq(BUDREQ.requests().find(r=>r.st==='dec').id)});await p.waitForTimeout(400);
const btn=await p.$('#drawer [data-br-act$=":Approve"]');out('pm approve btn present/disabled',btn?await btn.evaluate(b=>[b.disabled,b.getAttribute('aria-disabled'),b.title.slice(0,80)]):null);
if(btn){await btn.focus();await p.keyboard.press('Enter');await p.waitForTimeout(300)}
out('pm after Enter: decision form open',await E(()=>!!document.querySelector('#drawer [data-form="budreq_dec"]')));
out('pm denial log',await E(()=>PERM.state.log.slice(0,2).map(l=>l.who+'|'+l.action+'|'+l.res+'|'+l.rule)));
await E(()=>{NAVX.persona.set('fin');go('bud_req');BUDREQ.openReq(BUDREQ.requests().find(r=>r.st==='dec').id)});await p.waitForTimeout(400);
const fb=await p.$('#drawer [data-br-act$=":Approve"]');if(fb){await fb.focus();await p.keyboard.press('Space');await p.waitForTimeout(400)}
out('fin after Space: decision form open',await E(()=>!!document.querySelector('#drawer [data-form="budreq_dec"]')));
/* form submit for a non-approver: open the form object directly */
out('ops submitForm blocked',await E(()=>{NAVX.persona.set('ops');openForm({id:'budreq_dec',title:'Approve and fund: BR-0101',fields:[],submit:'x',onSubmit:()=>({toast:'SHOULD NOT RUN'})});return {drawerHasForm:!!document.querySelector('#drawer [data-form="budreq_dec"]'),submit:typeof FORMSPEC!=='undefined'&&FORMSPEC.budreq_dec?submitForm('budreq_dec'):'no-spec'}}));
/* 2. nested rule edit goes through a change request approved by the Security group (SoD) */
await E(()=>{NAVX.persona.set('admin');S.v.pmperm=1;go('r16g_perm')});await p.waitForTimeout(300);
await p.click('[data-pm-edit="PR-001"]');await p.waitForTimeout(300);
await p.fill('[data-pm-ed] [data-pm-f="when"]','own() or directReport()');await p.click('[data-pm-save]');await p.waitForTimeout(300);
out('pending changes',await E(()=>PERM.state.changes.map(c=>c.id+':'+c.status)));
await E(()=>{S.v.pmperm=5;render()});await p.waitForTimeout(200);
await p.click('[data-pm-decide$=":ok"]');await p.waitForTimeout(300);
out('requester approves own: status',await E(()=>PERM.state.changes[0].status));
await E(()=>GUARD.actAs('Rina Okafor'));await p.waitForTimeout(300);
await E(()=>{S.v.pmperm=5;go('r16g_perm');S.v.pmperm=5;render()});await p.waitForTimeout(300);
out('Rina principal',await E(()=>{const u=PERM.principal();return [u.user,u.roles.join(','),u.groups.join(',')]}));
const dec=await p.$('[data-pm-decide$=":ok"]');if(dec){await dec.click();await p.waitForTimeout(400)}
out('after Rina approves',await E(()=>({st:PERM.state.changes[0].status,rule:PERM.state.rules.find(r=>r.id==='PR-001').when,hist:PERM.state.hist.length,ev:(EVENTS.log||[]).filter(e=>/permission\.changed|access\.denied/.test(e.id||e.ev||'')).length})));
await E(()=>{GUARD.actAs('')});
/* 3. persistence */
out('store',await E(async()=>{await new Promise(r=>setTimeout(r,800));try{const r=STORE.get('perm_state','main');return r?{len:r.json.length}:'none'}catch(e){return 'err '+e.message}}));
/* 4. explain + field masks */
out('explain Dana approve budget_request',await E(()=>{const d=PERM.can('Dana Whitfield','approve','invoice');return {ok:d.ok,group:d.group,why:d.why}}));
out('fields ops on Priya',await E(()=>{const f=PERM.fields('ops','person','Priya Shah');return Object.fromEntries(['rating','salary','load','rate','email','name'].map(k=>[k,f[k].mode]))}));
out('fields exec on Priya',await E(()=>{const f=PERM.fields('exec','person','Priya Shah');return Object.fromEntries(['rating','salary','load','rate','grade','pto_balance'].map(k=>[k,f[k].mode]))}));
out('fields pm on self',await E(()=>{const f=PERM.fields('pm','person','Priya Shah');return Object.fromEntries(['rating','salary','pto_balance'].map(k=>[k,f[k].mode]))}));
out('rows invoice pm',await E(()=>PERM.rows('pm','invoice').text));
out('rows budget_request pm',await E(()=>PERM.rows('pm','budget_request').text));
out('errors',errs);await b.close()})();
