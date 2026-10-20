// PR-32 entity check (B0, B1): the 58 tenant entities of docs/data/entity-plan.md section 3.
//  1. every entity in the plan is defined on DATA and listed in TENANT_ENTITIES (50 record entities, 8 configuration);
//  2. core rows: every entity returns Meridian rows once the screens have rendered (some stores fill on first render),
//     with unique keys and a known part on every row;
//  3. every industry pack validates (DATA.validate); a pack that carries the PR-32 entities carries all 58, every row has a
//     part, links resolve inside the pack, owners and backups are different people in the pack (R12), people fields name
//     people in the pack, and the threads hold: service to configuration item to change to incident, risk to control and back,
//     agent to sponsor and process, budget line to project to objective, role holders to people, approval policies to groups;
//  4. the packs listed in FILLED must carry the entities (B1 lanes add their tenant here).
// Usage: node tools/tests/data_entities.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
const FILLED=['health'];
const PLAN=['risks','benefits','trace_links','scenarios','plan_tasks','raid_items','work_items','capacity','budget_requests','cost_centers','vendors','ledger_entries',
 'contracts','purchase_orders','timesheets','approval_policies','finance_policies','services','config_items','changes','knowledge_articles','incidents','service_requests',
 'catalog_items','monitors','problems','service_levels','events','rotas','ops_automations','service_tasks','service_policies','agents','access_grants','audit_log','controls',
 'audits','policies','role_assignments','org_units','teams','skills','learning','leave','rooms','forums','meetings','decisions','action_items','conversations','capabilities',
 'applications','tech_debt','builds','tenant_settings','connectors','reports','decision_tables'];
const CONFIG=['approval_policies','finance_policies','service_policies','policies','tenant_settings','connectors','reports','decision_tables'];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
const r=await p.evaluate(([PLAN,CONFIG,FILLED])=>{const f=[],w=[],info=[];const ok=(c,m)=>{if(!c)f.push(m)};
 const TE=window.TENANT_ENTITIES;ok(TE&&TE.list,'TENANT_ENTITIES registry is loaded');if(!TE)return{f,w,info};
 const L=TE.list(),names=L.map(x=>x.entity),defined=new Set(DATA.entities().map(x=>x.entity));
 ok(L.length===58,'58 entities in the registry, got '+L.length);
 PLAN.forEach(e=>{ok(names.includes(e),'registry has '+e);ok(defined.has(e),'DATA defines '+e)});
 ok(L.filter(x=>x.cls==='configuration').map(x=>x.entity).sort().join()===CONFIG.slice().sort().join(),'the 8 configuration entities: '+L.filter(x=>x.cls==='configuration').map(x=>x.entity));
 /* 2. core rows after every screen has rendered once (lazy stores fill on first render; memo cleared by the version bump) */
 SCREENS.forEach(s=>{try{go(s[0])}catch(e){}});DATA.touch();go('home');
 L.forEach(d=>{const rows=DATA.get(d.entity,{tenant:'core'});ok(rows.length>0,'core '+d.entity+' has Meridian rows');const keys=new Set();
  rows.forEach(x=>{const k=x[d.key];if(k==null||k===''||keys.has(k))f.push('core '+d.entity+': missing or duplicate '+d.key+' '+k);keys.add(k);
   if(!d.parts.includes(TE.part(d.entity,x)))f.push('core '+d.entity+': unknown part '+TE.part(d.entity,x))});
  info.push('core '+d.entity+' '+rows.length)});
 const cv=DATA.validate('core');ok(cv.ok,'core validates: '+cv.errors.slice(0,4).join('; '));
 /* 3. packs */
 const tens=DATA.tenants().map(t=>t.id).filter(t=>t!=='core');const counts={};
 tens.forEach(t=>{const v=DATA.validate(t);ok(v.ok,t+' pack validates: '+v.errors.slice(0,4).join('; '));
  const g=e=>DATA.get(e,{tenant:t});const has=L.filter(d=>g(d.entity).length>0).map(d=>d.entity);counts[t]={};
  if(!has.length){if(FILLED.includes(t))f.push(t+': no PR-32 entities in the pack');else w.push(t+': PR-32 entities not filled yet (gap)');return}
  L.forEach(d=>ok(g(d.entity).length>0,t+': pack has '+d.entity));
  const people=g('people'),hum=new Set(people.filter(x=>x.kind==='human').map(x=>x.name)),pid=new Set(people.map(x=>x.id));
  const pool=(e,by)=>{const d=TE.get(e);const k=by||(d?d.key:'id');return new Set(g(e).map(x=>x[k]))};
  L.forEach(d=>{const rows=g(d.entity);const by={};rows.forEach(x=>{const pt=x.part;by[pt]=(by[pt]||0)+1;if(!d.parts.includes(pt))f.push(t+' '+d.entity+' '+x[d.key]+': part '+pt+' unknown')});
   counts[t][d.entity]=by;
   TE.links(d.entity).forEach(([field,tgt,o])=>{o=o||{};const P=pool(tgt,o.by);rows.forEach(x=>{if(o.part&&x.part!==o.part)return;const v=x[field];if(v==null||v===''||(Array.isArray(v)&&!v.length))return;
    (Array.isArray(v)?v:[v]).forEach(y=>{if(!P.has(y))f.push(t+' '+d.entity+' '+x[d.key]+': '+field+' '+y+' not a '+tgt+' in the pack')})})});
   TE.pairs(d.entity).forEach(([pt,of,bf])=>rows.forEach(x=>{if(pt&&x.part!==pt)return;const o=x[of],bk=x[bf];if(!hum.has(o)||!hum.has(bk)||o===bk)f.push(t+' '+d.entity+' '+x[d.key]+': '+of+' and '+bf+' must be different people in the pack ('+o+', '+bk+')')}));
   TE.people(d.entity).forEach(([pt,fl,how])=>rows.forEach(x=>{if(pt&&x.part!==pt)return;const v=x[fl];if(v==null||v==='')return;if(how==='id'?!pid.has(v):!hum.has(v))f.push(t+' '+d.entity+' '+x[d.key]+': '+fl+' '+v+' is not a person in the pack')}))});
  /* threads */
  const svc=g('services').filter(x=>x.part==='service'),ci=g('config_items'),items=ci.filter(x=>x.part==='item'),ch=g('changes').filter(x=>x.part==='change'),inc=g('incidents');
  const ciSvc=new Map(items.map(x=>[x.id,x.svc]));
  ok(svc.length&&svc.every(s=>items.some(x=>x.svc===s.id)),t+': every service has configuration items');
  ok(ch.length&&ch.every(c=>(c.cis||[]).length&&c.cis.every(x=>ciSvc.get(x)===c.svcId)),t+': every change names configuration items of its own service');
  ok(inc.length&&inc.every(i=>ciSvc.get(i.ci)===i.svcId),t+': every incident sits on a configuration item of its service');
  ok(inc.filter(i=>i.chg).length>0&&inc.filter(i=>i.chg).every(i=>ch.find(c=>c.id===i.chg).svcId===i.svcId),t+': incidents link to changes on the same service');
  ok(inc.filter(i=>i.maj).length===1,t+': one major incident');
  const rk=g('risks').filter(x=>x.part==='control'),ct=g('controls').filter(x=>x.part==='control');
  ok(rk.length&&rk.every(x=>(x.ctl||[]).length&&x.ctl.every(c=>(ct.find(y=>y.id===c)||{risks:[]}).risks.includes(x.id))),t+': every control risk has controls that list it back');
  const ag=g('agents').filter(x=>x.part==='agent'),bots=people.filter(x=>x.kind!=='human');
  ok(ag.length===bots.length&&bots.every(bt=>ag.some(a=>a.person===bt.id&&a.owner===bt.sponsor&&a.proc)),t+': every agent and robot has an agent row with its sponsor and a process');
  ok(g('budget_lines').every(l=>g('projects').some(x=>x.id===l.p&&g('objectives').some(o=>o.id===x.obj))),t+': budget line to project to objective');
  const ra=g('role_assignments').filter(x=>x.part==='role');ok(ra.length&&ra.every(x=>(x.holders||[]).length&&x.holders.every(h=>hum.has(h.who))),t+': role holders are people in the pack');
  ok(g('approval_policies').filter(x=>x.grp).length>0&&g('approval_policies').filter(x=>x.grp).every(x=>g('teams').some(tm=>tm.id===x.grp)),t+': approval policies name groups (teams) in the pack');
  const tl=g('trace_links'),edges=tl.filter(x=>x.part==='edge');ok(['obj','proj','bud','inv'].every(k=>tl.some(x=>x.t===k)),t+': trace links carry objectives, projects, budget lines and invoices');
  ok(g('invoices').every(v=>edges.some(e=>e.to===v.id)),t+': every invoice is reached by a trace edge');
  ok(JSON.stringify(L.map(d=>g(d.entity))).indexOf('Meridian')<0,t+': no Meridian text in the PR-32 rows')});
 return{f,w,info,counts}},[PLAN,CONFIG,FILLED]);
r.w.forEach(x=>console.log('warn',x));
Object.keys(r.counts||{}).forEach(t=>{const c=r.counts[t];const n=Object.values(c).reduce((a,o)=>a+Object.values(o).reduce((x,y)=>x+y,0),0);if(n)console.log('pack',t,n,'rows in',Object.keys(c).filter(e=>Object.keys(c[e]).length).length,'entities')});
console.log('data entities',r.f.length?'FAIL '+r.f.slice(0,25).join(' | ')+(r.f.length>25?' | and '+(r.f.length-25)+' more':''):'ok','| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(r.f.length||errs.length?1:0)})();
