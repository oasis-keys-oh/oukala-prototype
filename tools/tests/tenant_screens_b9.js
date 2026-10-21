// PR-32 batch B9 (Build, admin, transformation and showroom): every B9 screen under every tenant.
// For each screen in the list below and each tenant (Meridian, the three industry packs, and one company made by Bring your company,
// PACKGEN), switched with TENANT.switch (the real path, no reload), it checks:
//  1. the screen renders (a view of some size) with no page errors;
//  2. its registered mode is the one this batch declares (DATA.screen from the screen's own module);
//  3. a screen in mode "data" shows this tenant's own rows (an id or name from the entities it registers, or a person of the tenant),
//     or a labeled gap ("No data in this sample company yet"); a screen in mode "tenant" follows the tenant its own way (checked for leaks only);
//     a screen in mode "core" carries the "not tenant-aware yet" label;
//  4. no other tenant's organization name (a Meridian-only screen, labeled, may still show Meridian; never an industry tenant), record ids, project names or people names on screen (fingerprints as in tenant_leak.js,
//     plus the tenant-prefixed ids of the entities the B9 screens read).
// A screen registered with no entities (a product page with no tenant business data) needs no own rows, only no leakage.
// ONLY=id1,id2 limits the run to those screens.
// Usage: node tools/tests/tenant_screens_b9.js <dir containing full.html> [--report]   (--report prints hits and never fails)
const {chromium}=require('playwright');const path=require('path');
const ALL=[
 /* mod_flow */ 'flw_design','flw_asmt','flw_appr','flw_dmn','flw_bpmn','flw_agent','flw_hub',
 /* mod_admin, mod_r16j_d_admin */ 'adm_studio','adm_sec','adm_env','adm_meter','adm_gate','adm_audit',
 /* mod_r18* */ 'r18_builds','r18_app','r18_mature','r18_debt','r18_access','r18_strategy',
 /* single files */ 'plat_gate','plat_mcp','exe_mat','plat_debt','plat_fab','r16g_perm','r16h_groups','r16h_status','r16h_rules','r17s_rules','zevt','plat_store',
 /* check and mode registration */ 'dec_cov','draw_studio','nav_studio','own_gaps','plat_build','plat_reg','wf_runs','studio','orgdesign','scr_map','showroom','plat_self'];
const SCREENS=process.env.ONLY?ALL.filter(id=>process.env.ONLY.split(',').includes(id)):ALL;
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const report=process.argv.includes('--report');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(900);
/* one generated company (Bring your company), so a pack made at run time is covered too */
const gen=await p.evaluate(()=>{try{if(!window.PACKGEN||!PACKGEN.fromAnswers)return null;const r=PACKGEN.fromAnswers({name:'Halvorsen Freight Lines',industry:'retail',pain:'cost'},{switch:false});return r&&r.ok?r.id:'refused: '+(r&&r.errors||[]).join(' | ')}catch(e){return 'error: '+e.message}});
const setup=await p.evaluate(()=>{const fp={},own={};const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const me=new Set(IDENT.people.map(x=>x.name));
 const B9E=['agents','approval_policies','connectors','decision_tables','access_grants','tenant_settings','policies','controls','builds','tech_debt','capabilities','role_assignments','audit_log','events','teams','org_units','services','workflows'];
 const nm=r=>[r.n,r.name,r.t,r.title,r.label].filter(v=>typeof v==='string');
 DATA.tenants().forEach(t=>{const terms=new Set([t.org,t.short].filter(Boolean)),mine=new Set();const add=v=>{v=String(v||'');if(v.length>=3&&!me.has(v))terms.add(v)};
  const ent=e=>{try{return DATA.get(e,{tenant:t.id})||[]}catch(x){return[]}};
  if(t.id==='core'){ent('invoices').forEach(r=>add(r.id));ent('projects').forEach(r=>add(r.n));ent('people').filter(r=>r.kind==='human').forEach(r=>add(r.name))}
  else{['projects','budget_lines','invoices','metrics','objectives','key_results','processes','demand','pillars','people','journeys','workflows'].forEach(e=>ent(e).forEach(r=>add(r.id)));
   ent('projects').forEach(r=>add(r.n));ent('people').forEach(r=>add(r.name));
   /* B9 entities: ids that carry the tenant prefix (names are not fingerprints: generic catalog words such as "Permit to work" also appear in product text) */
   B9E.forEach(e=>ent(e).forEach(r=>{const id=String(r.id||'');if(/^[A-Z]{2}-[A-Z0-9]/.test(id))add(id)}))}
  /* own rows: any id or name of the B9 entities and the people of this tenant (used only to prove the tenant's data is on screen) */
  B9E.concat(['people','metrics','processes','objectives','projects']).forEach(e=>ent(e).forEach(r=>{nm(r).forEach(v=>{if(v.length>=6)mine.add(v)});const id=String(r.id||'');if(id.length>=4)mine.add(id)}));
  fp[t.id]=[...terms];own[t.id]=[...mine]});
 const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
 const ocnt={};Object.values(own).forEach(a=>a.forEach(x=>ocnt[x]=(ocnt[x]||0)+1));
 const rx=x=>new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+'($|[^A-Za-z0-9_-])');
 window.__fp={};window.__own={};Object.keys(fp).forEach(k=>{window.__fp[k]=fp[k].filter(x=>cnt[x]===1).map(rx);window.__own[k]=own[k].filter(x=>ocnt[x]===1).map(rx)});
 window.__surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],[data-tenant-chip],script,style').forEach(x=>x.remove());
  const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');return c.textContent+' '+at};
 window.__hits=(txt,t)=>{const out=[];Object.keys(window.__fp).forEach(k=>{if(k===t)return;window.__fp[k].forEach(re=>{const m=re.exec(txt);if(m)out.push(k+':'+m[0].trim()+' [..'+txt.slice(Math.max(0,m.index-40),m.index+m[0].length+10).replace(/\s+/g,' ')+'..]')})});return out};
 window.__mine=(txt,t)=>(window.__own[t]||[]).filter(re=>re.test(txt)).length;
 return{tenants:DATA.tenants().map(t=>t.id)}});
console.log('B9 screens',SCREENS.length,'| tenants',setup.tenants.join(','),'| generated company',gen||'none');
/* expected modes: every B9 screen in this list is mode "data" except these (left for B10, reasons in the PR-32 B9 report) */
const MODE={orgdesign:'tenant',dec_cov:'core',draw_studio:'core',own_gaps:'core',wf_runs:'core',studio:'core',showroom:'core'};
let checks=0;const summary={};
for(const t of setup.tenants){await p.evaluate(t=>TENANT.switch(t),t);await p.waitForTimeout(250);
 for(const id of SCREENS){const n0=errs.length;await p.evaluate(id=>go(id),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(120);checks++;
  const r=await p.evaluate(([id,t])=>{const txt=window.__surface();const reg=DATA.screens().find(s=>s.id===id)||{};return{scr:S.screen,mode:DATA.screenMode(id),ents:(reg.entities||[]).length,len:document.getElementById('view').innerHTML.length,hits:window.__hits(txt,t),mine:window.__mine(txt,t),
   gap:/No data in this sample company yet/.test(txt),legacy:!!document.querySelector('#view [data-tenant-legacy]')}},[id,t]);
  const want=MODE[id]||'data';summary[id]=summary[id]||{};summary[id][t]=r.hits.length?'LEAK':r.mine?'own '+r.mine:r.gap?'gap':'none';
  if(report){if(r.hits.length||errs.length>n0)console.log(t,id,r.mode,'own',r.mine,'gap',r.gap,'|',r.hits.slice(0,process.env.NH?+process.env.NH:5).join(' | '),errs.slice(n0).join(' | ').slice(0,300));continue}
  if(r.len<400)fail(t+' '+id+': blank view');
  if(r.mode!==want)fail(t+' '+id+': mode '+r.mode+', expected '+want);
  /* a Meridian-only screen (mode core, labeled) may show Meridian under another tenant, never an industry tenant */
  const hits=r.mode==='core'?r.hits.filter(h=>h.indexOf('core:')!==0):r.hits;
  if(hits.length)fail(t+' '+id+' shows another tenant: '+hits.slice(0,4).join(' | '));
  if(t!=='core'&&r.mode==='data'&&r.ents&&!r.mine&&!r.gap)fail(t+' '+id+': neither own rows nor a labeled gap');
  if(t!=='core'&&r.mode==='core'&&!r.legacy)fail(t+' '+id+': Meridian-only screen without the tenant label');
  if(errs.length>n0)fail(t+' '+id+' errors '+errs.slice(n0).join(' | ').slice(0,400))}}
if(report)Object.keys(summary).forEach(id=>console.log(id.padEnd(14),JSON.stringify(summary[id])));
console.log('checks',checks,'| failures',bad,'| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(!report&&(bad||errs.length)?1:0)})();
