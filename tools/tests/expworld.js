// Experiential Showroom, stream exp-world (DC-43, DC-44, DC-45). Usage: node tools/tests/expworld.js <dir containing full.html> [company|seats|breakit]
//  company: PACKGEN.fromAnswers for every listed industry and an unknown one: the gen_pack checks pass, DATA.validate passes, the
//           tenant-aware screens (every DATA screen and every Journey maps tab) show the generated company, render without errors and
//           carry no other tenant's fingerprints (leak test style: organization names, people, project names, invoice ids, vendors,
//           distinctive metric, objective, demand and process names); no generated person shares a full name with anything in the
//           build; the setup dialog asks three questions and lands the buyer in the company; the session store holds the answers only.
//  seats:   two pages on one browser context, each with a seat; an audited action in one arrives in the other as a simulated
//           inbox item and notification marked "from the other seat"; SEATS.open opens the second window with its seat.
//  breakit: every Break it attempt is refused by the real check, explains the control that held, writes an audit entry and is
//           labeled simulated; with an EXP engine present, Break it registers as a mission with a clock of 180 seconds or less.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const only=process.argv[3]||'';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
const url='file://'+dir+'/full.html';const SRC=fs.readFileSync(path.join(dir,'full.html'),'utf8');
async function open(ctx,q){ctx=ctx||await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();p.errs=[];
 p.on('pageerror',e=>p.errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&p.errs.push('console: '+m.text().slice(0,300)));
 await p.route(/^https?:/,r=>r.abort());await p.goto(url+(q||''),{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>window.PACKGEN&&PACKGEN.fromAnswers&&window.DATA&&window.IDENT&&window.TENANT&&window.SCN,null,{timeout:60000});await p.waitForTimeout(1500);return p}

/* ---------------- DC-43 Bring your company ---------------- */
if(!only||only==='company'){const p=await open();
 const inds=await p.evaluate(()=>PACKGEN.industries().map(i=>i.id));
 const need=['health','mining','storage','standards','manufacturing','finserv','public','retail'];
 need.forEach(k=>{if(!inds.includes(k))fail('company: industry '+k+' is not supported')});
 /* fingerprints of every pre-existing tenant (same idea as tools/tests/tenant_leak.js) */
 await p.evaluate(()=>{const fp={};const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const me=new Set(IDENT.people.map(x=>x.name));
  DATA.tenants().forEach(t=>{const terms=new Set([t.org,t.short].filter(Boolean));const add=v=>{v=String(v||'');if(v.length>=3&&!me.has(v))terms.add(v)};
   if(t.id==='core'){DATA.get('invoices',{tenant:'core'}).forEach(r=>add(r.id));DATA.get('projects',{tenant:'core'}).forEach(r=>add(r.n));DATA.get('people',{tenant:'core'}).filter(r=>r.kind==='human').forEach(r=>add(r.name))}
   else{['projects','budget_lines','invoices','metrics','objectives','key_results','processes','demand','pillars','people'].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>add(r.id)));
    DATA.get('projects',{tenant:t.id}).forEach(r=>add(r.n));DATA.get('people',{tenant:t.id}).forEach(r=>add(r.name));
    const coreN=new Set(DATA.get('metrics',{tenant:'core'}).map(r=>r.n).concat(DATA.get('objectives',{tenant:'core'}).map(r=>r.n)));
    const addN=(v,any)=>{v=String(v||'');if(!coreN.has(v)&&(any||v.split(/\s+/).length>=3))add(v)};
    DATA.get('invoices',{tenant:t.id}).forEach(r=>addN(r.vendor,1));['objectives','metrics','demand','processes'].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>addN(r.n)))}
   fp[t.id]=[...terms]});
  const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
  window.__fp={};Object.keys(fp).forEach(k=>{window.__fp[k]=fp[k].filter(x=>cnt[x]===1).map(x=>Object.assign(new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+'($|[^A-Za-z0-9_-])'),{__t:x}))});
  window.__surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],script,style').forEach(x=>x.remove());
   const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');return c.textContent+' '+at};
  window.__hits=(txt,skip)=>{const out=[];Object.keys(window.__fp).forEach(k=>window.__fp[k].forEach(re=>{const m=re.exec(txt);if(m&&!(skip&&skip.has(re.__t)))out.push(k+':'+m[0].trim()+' [..'+txt.slice(Math.max(0,m.index-50),m.index+m[0].length+10).replace(/\s+/g,' ')+'..]')}));return out}});
 const aware=await p.evaluate(()=>DATA.screens().filter(s=>s.mode!=='core').map(s=>s.id));
 const cases=need.map((k,i)=>({name:['Harbor Lane Health','Quartzfield Minerals','Bluestack Systems','Northpoint Standards Council','Ferrogate Components','Lakeshore Mutual','City of Avonmere','Tillbury Market'][i],industry:k,pain:['speed','cost','customer','risk','people','speed','cost','customer'][i]}))
  .concat([{name:'Brightfield Logistics',industry:'artisanal cheese caves',pain:'cost',expect:'standards',fallback:true},{name:'Pinehurst Bank',industry:'regional bank',pain:'risk',expect:'finserv'}]);
 let checks=0;
 for(const c of cases){const n0=p.errs.length;
  const r=await p.evaluate(c=>{const t0=performance.now();const r=PACKGEN.fromAnswers({name:c.name,industry:c.industry,pain:c.pain});const rows=r.pack.rows;
   return{ok:r.ok,errors:r.errors,industry:r.industry,fallback:r.fallback,ms:Math.round(performance.now()-t0),tenant:DATA.tenant(),v:DATA.validate(r.id),
    counts:Object.fromEntries(Object.keys(rows).map(k=>[k,rows[k].length])),humans:rows.people.filter(x=>x.kind==='human').map(x=>x.name),
    json:JSON.stringify(rows),org:r.pack.info.org,store:U.store.get(PACKGEN.STORE_KEY,null),member:IDENT.member(r.id),scn:SCN.cur}},c);
  const tag='company '+c.industry+':';
  if(!r.ok)fail(tag+' refused: '+r.errors.slice(0,4).join(' | '));
  if(!r.v.ok)fail(tag+' DATA.validate: '+r.v.errors.slice(0,4).join(' | '));
  if(c.expect&&r.industry!==c.expect)fail(tag+' matched '+r.industry+', expected '+c.expect);
  if(c.fallback&&!r.fallback)fail(tag+' unknown industry did not report the fallback');
  if(r.tenant!=='yourco'||r.scn!==r.tenant)fail(tag+' not switched into the generated tenant ('+r.tenant+', SCN '+r.scn+')');
  if(!r.member)fail(tag+' no demo membership for the generated tenant');
  ['people','objectives','key_results','projects','budget_lines','invoices','metrics','processes','maturity','demand','pillars','vocabulary','workload','value_chain','journeys','workflows'].forEach(e=>{if(!r.counts[e])fail(tag+' no '+e)});
  if(r.counts.people<15||r.counts.metrics<8||r.counts.processes<6||r.counts.projects<5)fail(tag+' pack is thinner than the sample packs '+JSON.stringify(r.counts));
  if(/\u2014/.test(r.json)||/\b(Core|Fabric|Trellis)\b/.test(r.json))fail(tag+' em dash or banned name in the pack');
  r.humans.forEach(h=>{if(SRC.indexOf(h)>=0)fail(tag+' generated person '+h+' shares a full name with the build')});
  if(!r.store||!r.store.answers||r.store.answers.name!==c.name||Object.keys(r.store).some(k=>!['answers','at','id'].includes(k)))fail(tag+' session store holds more than the answers');
  if(r.ms>1500)fail(tag+' generation took '+r.ms+' ms');
  /* the tenant-aware screens show the company and nothing of another tenant */
  let shown=0;
  for(const id of aware){const tabs=id==='ppl_jrny'?[...Array(await p.evaluate(()=>window.JX&&JX.TABS?JX.TABS.length:9)).keys()]:[null];
   for(const tab of tabs){const e0=p.errs.length;await p.evaluate(([id,tab])=>{if(tab!=null)S.pp2.tab[id]=tab;go(id)},[id,tab]).catch(e=>p.errs.push(id+': '+e.message));await p.waitForTimeout(80);checks++;
    /* journeys and workflows are reused from the closest sample by design (shared content, relabeled): their names are not another tenant's records */
    const h=await p.evaluate(org=>{const skip=new Set(DATA.get('workflows').map(w=>w.name).concat(DATA.get('journeys').map(j=>j.n)));return{hits:window.__hits(window.__surface(),skip),has:window.__surface().indexOf(org)>=0}},r.org);
    if(h.has)shown++;
    if(h.hits.length)fail(tag+' '+id+(tab!=null?' tab '+tab:'')+' shows another tenant: '+h.hits.slice(0,3).join(' | '));
    if(p.errs.length>e0)fail(tag+' '+id+' errors: '+p.errs.slice(e0).join(' | ').slice(0,300))}}
  if(shown<6)fail(tag+' the company name shows on only '+shown+' tenant-aware screens');
  console.log('ok',c.industry,'->',r.industry,r.fallback?'(fallback)':'','|',Object.values(r.counts).reduce((a,b)=>a+b,0),'records |',r.ms,'ms | name on',shown,'screens');
  if(p.errs.length>n0)fail(tag+' page errors '+p.errs.slice(n0,n0+3).join(' | '))}
 /* the setup: three questions, then the buyer is in the company */
 const s=await p.evaluate(async()=>{TENANT.switch('core');PACKGEN.forget();const d=PACKGEN.openSetup({reset:true});const q=()=>d.querySelector('[data-xco-body]');const steps=[];
  const name=d.querySelector('[data-xco-name]');name.value='Saltgrass Clinics';name.dispatchEvent(new Event('input',{bubbles:true}));steps.push(q().textContent.slice(0,40));
  d.querySelector('[data-xco=next]').click();d.querySelector('[data-xco-set="industry|health"]').click();steps.push(q().textContent.slice(0,40));
  d.querySelector('[data-xco=next]').click();d.querySelector('[data-xco-set="pain|customer"]').click();steps.push(q().textContent.slice(0,40));
  const qs=d.querySelectorAll('.xco-n').length;d.querySelector('[data-xco=build]').click();await new Promise(r=>setTimeout(r,1800));
  const res=PACKGEN._setupState();const out={open:d.open,steps,qs,res,tenant:DATA.tenant(),org:(DATA.tenantInfo(DATA.tenant())||{}).org,cards:d.querySelectorAll('[data-xco-go]').length,sim:/Simulated/.test(d.textContent),close:!!d.querySelector('.xco-h [data-xco=close]')};
  d.querySelector('[data-xco-go=exe_strat]').click();out.after=S.screen;out.closed=!d.open;return out});
 if(!s.open||s.qs!==1||!/1 of 3/.test(s.steps[0])||!/2 of 3/.test(s.steps[1])||!/3 of 3/.test(s.steps[2]))fail('company setup: not three questions '+JSON.stringify(s.steps));
 if(!s.res.ok||s.org!=='Saltgrass Clinics')fail('company setup: buyer not in the company ('+s.tenant+' '+s.org+')');
 if(s.cards<4||!s.sim||!s.close)fail('company setup: result lacks screens, the simulated label or a close control');
 if(s.after!=='exe_strat'||!s.closed)fail('company setup: the result does not open the screen');
 /* a reload keeps the company for the session; forget clears it */
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.PACKGEN&&window.IDENT,null,{timeout:60000});await p.waitForTimeout(1500);
 const back=await p.evaluate(()=>({cur:PACKGEN.current(),org:(DATA.tenantInfo(PACKGEN.TENANT_ID)||{}).org,v:DATA.validate(PACKGEN.TENANT_ID).ok,f:PACKGEN.forget(),after:U.store.get(PACKGEN.STORE_KEY,null),member:IDENT.member(PACKGEN.TENANT_ID)}));
 if(!back.cur||back.org!=='Saltgrass Clinics'||!back.v)fail('company: not restored after a reload '+JSON.stringify(back));
 if(back.after||back.member)fail('company: forget left the answers or the membership');
 if(p.errs.length)fail('company: page errors '+p.errs.slice(0,3).join(' | '));
 console.log('company: industries',need.length,'+ fallback | screen checks',checks);
 await p.context().close()}

/* ---------------- DC-45 Two seats ---------------- */
if(!only||only==='seats'){const ctx=await b.newContext({viewport:{width:1280,height:860}});const a=await open(ctx,'?seat=cfo');const c=await open(ctx,'?seat=coo');
 const ready=await Promise.all([a,c].map(p=>p.evaluate(()=>!!(window.SEATS&&SEATS.role()))));
 if(!ready.every(Boolean))fail('seats: a page has no seat '+ready);
 const roles=await Promise.all([a,c].map(p=>p.evaluate(()=>SEATS.role())));if(roles[0]!=='cfo'||roles[1]!=='coo')fail('seats: roles '+roles);
 await a.waitForTimeout(400);
 const peers=await a.evaluate(()=>SEATS.peers().map(x=>x.role));if(!peers.includes('coo'))fail('seats: the CFO seat does not see the COO seat '+peers);
 const before=await c.evaluate(()=>({n:SEATS.arrivals().length,inbox:INBOX.items().filter(x=>/^seat:/.test(x.id)).length}));
 await a.evaluate(()=>{audit("Approved invoice INV-2207","Finance approver group · $45,000");audit("Moved budget","$18,400 from PR1-LAB to PR2-LAB")});
 await c.waitForTimeout(700);
 const got=await c.evaluate(()=>({arr:SEATS.arrivals(),inbox:INBOX.items().filter(x=>/^seat:/.test(x.id)).map(x=>({t:x.title,sim:x.sim,cat:x.cat})),marker:document.querySelectorAll('[data-seat-from]').length,bar:(document.getElementById('seatBar')||{}).textContent||'',notif:(NOTIF.state.items||[]).filter(x=>/^seat:/.test(x.id)).length}));
 if(got.arr.length<before.n+2)fail('seats: the COO seat got '+(got.arr.length-before.n)+' arrivals, expected 2');
 if(!got.arr.every(x=>x.from==='cfo'&&x.sim))fail('seats: arrivals not marked from the other seat and simulated');
 if(got.inbox.length<before.inbox+1||!got.inbox.every(x=>x.sim&&/other seat/i.test(x.cat)))fail('seats: no simulated inbox item from the other seat '+JSON.stringify(got.inbox));
 if(!got.marker||!/from the other seat/i.test(got.bar)||!/simulated/i.test(got.bar))fail('seats: the seat bar does not show the marker and the simulated label');
 if(!got.notif)fail('seats: no notification from the other seat');
 if(!got.arr.some(x=>x.num))fail('seats: no changed number reached the other seat');
 /* no echo: the arrival is not mirrored back */
 await a.waitForTimeout(400);const echo=await a.evaluate(()=>SEATS.arrivals().length);if(echo)fail('seats: the first seat received its own actions back ('+echo+')');
 /* SEATS.open opens the second window with the role */
 const [pop]=await Promise.all([ctx.waitForEvent('page'),a.evaluate(()=>{SEATS.open('ciso')})]);
 await pop.waitForLoadState('domcontentloaded');await pop.waitForFunction(()=>window.SEATS&&SEATS.role(),null,{timeout:60000}).catch(()=>{});
 const pr=await pop.evaluate(()=>window.SEATS&&SEATS.role()).catch(()=>null);if(pr!=='ciso')fail('seats: SEATS.open did not open a CISO seat ('+pr+')');
 [a,c].forEach((p,i)=>{if(p.errs.length)fail('seats: page '+i+' errors '+p.errs.slice(0,3).join(' | '))});
 console.log('seats: arrivals',got.arr.length,'| inbox items',got.inbox.length,'| roles',roles.join(','));
 await ctx.close()}

/* ---------------- DC-44 Break it ---------------- */
if(!only||only==='breakit'){const p=await open();
 await p.waitForFunction(()=>window.GUARD&&GUARD.tries&&window.AGENTRT&&AGENTRT.registry().length&&window.BUDREQ&&window.ITSMX,null,{timeout:60000});await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>{const want=["own","overspend","confidence","kill","restricted","tenant"];const tries=GUARD.tries();const a0=AUDIT.length;
  const res=want.map(id=>{const x=GUARD.attempt(id);return x?{id,refused:x.refused,na:x.na,why:x.why,held:x.held,ctl:x.control,sim:x.sim,rail:x.rail}:{id,missing:true}});
  return{tries:tries.map(t=>t.id),res,audits:AUDIT.slice(0,AUDIT.length-a0).filter(a=>/^Guardrail test/.test(a.a)).map(a=>a.a+' | '+a.d),tenant:DATA.tenant(),ident:IDENT.cur,drawer:!!document.querySelector('#drawer:popover-open')}});
 r.res.forEach(x=>{if(x.missing)return fail('breakit: no attempt '+x.id);if(!x.refused||x.na)fail('breakit: '+x.id+' was not refused: '+(x.na||x.why));
  if(!x.held||x.held.length<30||!x.ctl)fail('breakit: '+x.id+' does not explain the control that held');if(!x.sim)fail('breakit: '+x.id+' not labeled simulated')});
 if(r.audits.length<6||!r.audits.every(a=>/held by/i.test(a)))fail('breakit: audit entries missing or without the control '+r.audits.length);
 if(r.tenant!=='core'||r.ident!=='casey-rowan')fail('breakit: an attempt left the tenant or identity changed ('+r.tenant+', '+r.ident+')');
 if(r.drawer)fail('breakit: the overspend attempt left a drawer open');
 /* the free play panel renders and its buttons run the attempts */
 const ui=await p.evaluate(async()=>{GUARD.openBreakIt();await new Promise(r=>setTimeout(r,300));const host=document.querySelector('[data-bk-play]');if(!host)return{host:false};
  const btn=host.querySelector('[data-bk-try="tenant"]');btn.click();await new Promise(r=>setTimeout(r,300));const h=document.querySelector('[data-bk-play]');
  return{host:true,cards:h.querySelectorAll('[data-bk-try]').length,held:/held/i.test(h.textContent),score:(h.querySelector('[data-bk-score]')||{}).textContent||'',sim:/simulated/i.test(h.textContent)}});
 if(!ui.host||ui.cards<6||!ui.held||!ui.sim)fail('breakit: free play panel '+JSON.stringify(ui));
 /* mission registration when EXP appears */
 const m=await p.evaluate(async()=>{const got=[];window.EXP={register(x){got.push(x);return x},list:()=>got,on(){},state:()=>null};HOOKS.run('afterRender','home');await new Promise(r=>setTimeout(r,50));
  const x=got.find(g=>/break/i.test(g.id));if(!x)return null;const ev={t:'now',p:'x',s:'guard',a:'Guardrail test (simulated): x',d:''};
  return{id:x.id,clock:x.clock,brief:x.brief,goal:x.goal,cps:x.checkpoints.length,role:x.role,tenants:x.tenants,hasWhen:x.checkpoints.every(c=>typeof c.when==='function'),fires:x.checkpoints.some(c=>{try{return c.when(Object.assign({},ev,{a:'Guardrail test (simulated): '+GUARD.tries().find(t=>t.id==='own').n}),{})}catch(e){return false}})}});
 if(!m)fail('breakit: no EXP mission registered');else{if(!(m.clock<=180))fail('breakit: mission clock '+m.clock+' over 180 seconds');if(m.cps<6||!m.hasWhen||!m.fires)fail('breakit: mission checkpoints '+JSON.stringify(m));if(!m.brief||!m.goal)fail('breakit: mission brief or goal missing')}
 if(p.errs.length)fail('breakit: page errors '+p.errs.slice(0,3).join(' | '));
 console.log('breakit:',r.res.map(x=>x.id+(x.refused?' held':' NOT')).join(', '),'| mission',m&&m.id,m&&m.clock+'s');
 await p.context().close()}

console.log('expworld failures',bad);await b.close();process.exit(bad?1:0)})();
