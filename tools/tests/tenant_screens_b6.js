// PR-32 B6 Operations and service: every B6 screen under every tenant (Meridian, Larkspur Health, Redstone Resources, Corvane Data Protection).
// For each screen and tenant, on one page switched with TENANT.switch (the real path, no reload):
//  1. the screen renders (view not blank) with no page errors, and so does each of its first view tabs (views() labels, up to 8);
//  2. it is registered mode "data" (DATA.screens()), so it carries no "not tenant-aware yet" label;
//  3. under an industry tenant it shows that tenant's organization or its own rows (ids or names of the tenant's own records); under a
//     company made by Bring your company (no operations rows) it shows its organization or the labeled gap "No data in this sample company yet";
//  4. it shows no other tenant's names: organizations, people, projects, invoice ids (the tenant_leak.js fingerprints) plus the
//     ids and names of the operations records (services, configuration items, incidents, changes, problems, articles and the rest).
// Tenants: core, health, mining, storage and one PACKGEN company (Tillbury Market, retail). Meridian (core) renders as before; the core snapshot, smoke and tabs suites guard that separately.
// Usage: node tools/tests/tenant_screens_b6.js <dir containing full.html> [--only id,id] [--tenants core,health]
const {chromium}=require('playwright');const path=require('path');
const SCREENS={
 itsm:['itsm_inc','itsm_prb','itsm_chg','itsm_mi','itsm_home'],
 itom:['itom_cmdb','itom_model','itom_graph','itom_disc','itom_health','itom_fin'],
 obs:['dev_pipe','itom_dev','plat_map','plat_data','plat_data_old','itom_evt','obs_dash','itom_slo','itom_run','obs_std'],
 svc:['svc_cat','svc_req','svc_portal','svc_asset','svc_notify','svc_guides','plat_contract','plat_retrofit'],
 kcs:['kcs_home','kcs_edit','kcs_ask','kcs_gap','kcs_prompt','kcs_test','kcs_skills'],
 oncall:['svc_oncall','svc_skills','svc_sla'],
 single:['kg','chat_home','vault','r16h_ci','svc_360']};
const OPS=['services','config_items','changes','knowledge_articles','incidents','service_requests','catalog_items','monitors','problems','service_levels','events','rotas','ops_automations','service_tasks','service_policies'];
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a.find(x=>!x.startsWith('--')&&!/,/.test(x))||'build_out');
const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;const tsel=a.includes('--tenants')?a[a.indexOf('--tenants')+1].split(','):null;
const ids=only||Object.values(SCREENS).flat();
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(900);
/* a company made by Bring your company (PACKGEN): no operations rows, so every screen shows labeled gaps, never another tenant */
const gen=await p.evaluate(()=>{if(!window.PACKGEN||!PACKGEN.fromAnswers)return null;const r=PACKGEN.fromAnswers({name:'Tillbury Market',industry:'retail',pain:'customer'});if(DATA.tenant()!=='core')TENANT.switch('core');return r&&r.id}).catch(e=>{errs.push('packgen: '+e.message);return null});
const tenants=await p.evaluate(OPS=>{const fp={},own={};const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const me=new Set(IDENT.people.map(x=>x.name));
 DATA.tenants().forEach(t=>{const terms=new Set([t.org,t.short].filter(Boolean)),mine=new Set();const add=(v,o)=>{v=String(v||'').trim();if(v.length>=3&&!me.has(v)){terms.add(v);if(o)mine.add(v)}};
  if(t.id==='core'){DATA.get('invoices',{tenant:'core'}).forEach(r=>add(r.id));DATA.get('projects',{tenant:'core'}).forEach(r=>add(r.n));
   DATA.get('people',{tenant:'core'}).filter(r=>r.kind==='human').forEach(r=>add(r.name))}
  else{['projects','budget_lines','invoices','metrics','objectives','key_results','processes','people'].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>add(r.id)));
   DATA.get('projects',{tenant:t.id}).forEach(r=>add(r.n));DATA.get('people',{tenant:t.id}).forEach(r=>add(r.name,1));
   /* operations records: ids with the tenant prefix, and names of three words or more */
   OPS.forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>{if(/^[A-Z]{2}-/.test(String(r.id||'')))add(r.id,1);['n','t','name'].forEach(f=>{const v=r[f];if(typeof v==='string'&&v.split(/\s+/).length>=3)add(v,1)})}))}
  fp[t.id]=[...terms];own[t.id]=[...mine]});
 /* names Meridian also uses as platform definitions (a proposed table in mod_r24_ops is called "Permit to work", as is a mining
    service): such a name identifies no tenant */
 ['Permit to work'].forEach(x=>Object.values(fp).forEach(a=>a.push(x)));
 const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
 const re=x=>new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+'($|[^A-Za-z0-9_-])');
 window.__fp={};window.__own={};Object.keys(fp).forEach(k=>{window.__fp[k]=fp[k].filter(x=>cnt[x]===1).map(re);window.__own[k]=own[k].filter(x=>cnt[x]===1).map(re)});
 window.__surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],script,style').forEach(x=>x.remove());
  const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');
  const opt=[...c.querySelectorAll('option')].map(o=>o.textContent).join(' ');return c.textContent+' '+at+' '+opt};
 window.__hits=(txt,t)=>{const out=[];Object.keys(window.__fp).forEach(k=>{if(k===t)return;window.__fp[k].forEach(r=>{const m=r.exec(txt);if(m)out.push(k+':'+m[0].trim()+' [..'+txt.slice(Math.max(0,m.index-40),m.index+m[0].length+10).replace(/\s+/g,' ')+'..]')})});return out};
 window.__mine=(txt,t)=>window.__own[t].filter(r=>r.test(txt)).length;
 return DATA.tenants().map(t=>t.id)},OPS);
const run=tsel?tenants.filter(t=>tsel.includes(t)):tenants;
console.log('tenants',run.join(','),'| screens',ids.length);
const modes=await p.evaluate(ids=>{const m={};ids.forEach(i=>m[i]=DATA.screenMode(i));return m},ids);
let checks=0;const slow=[];
for(const t of run){
 const ok=await p.evaluate(t=>{if(DATA.tenant()!==t)TENANT.switch(t);return DATA.tenant()===t},t);await p.waitForTimeout(250);
 if(!ok){fail(t+': switch refused');continue}
 for(const id of ids){const n0=errs.length;
  const r=await p.evaluate(([id,t])=>{const t0=performance.now();go(id);const ms=Math.round(performance.now()-t0);const v=document.getElementById('view');const txt=window.__surface();
   const org=(DATA.tenantInfo(t)||{}).org||'';
   return{ms,len:v.innerHTML.length,gap:/No data in this sample company yet/.test(txt),hits:window.__hits(txt,t),mine:window.__mine(txt,t),org:!!org&&txt.indexOf(org)>=0,lab:!!v.querySelector('[data-tenant-legacy]'),scr:S.screen,
    tabs:[...v.querySelectorAll('.screen .views .vsw label')].length}},[id,t]).catch(e=>{errs.push(id+': '+e.message);return null});
  checks++;const where=t+' '+id;if(!r){fail(where+': did not open');continue}
  if(r.ms>800)slow.push(where+' '+r.ms+' ms');
  if(r.len<400)fail(where+': blank view ('+r.len+')');
  if(modes[id]!=='data')fail(where+': registered mode '+modes[id]+', not data');
  if(t!=='core'&&r.lab)fail(where+': carries the not tenant-aware label');
  if(t!=='core'&&!r.org&&r.mine<1&&!(t===gen&&r.gap))fail(where+': shows neither the organization nor its own rows'+(t===gen?' nor a labeled gap':''));
  if(r.hits.length)fail(where+' shows another tenant: '+r.hits.slice(0,4).join(' | '));
  /* view tabs */
  for(let i=1;i<Math.min(r.tabs,8);i++){
   const q=await p.evaluate(([i,t])=>{const bs=[...document.querySelectorAll('#view .screen .views .vsw label')];if(!bs[i])return null;bs[i].click();
    const v=document.getElementById('view');return{len:v.innerHTML.length,hits:window.__hits(window.__surface(),t),name:bs[i].textContent.trim()}},[i,t]).catch(e=>{errs.push(id+' tab '+i+': '+e.message);return null});
   checks++;if(!q)continue;
   if(q.len<400)fail(where+' tab "'+q.name+'": blank view');
   if(q.hits.length)fail(where+' tab "'+q.name+'" shows another tenant: '+q.hits.slice(0,4).join(' | '))}
  await p.evaluate(id=>{const k=Object.keys(S.v||{});k.forEach(x=>{if(S.v[x])S.v[x]=0})},id);
  if(errs.length>n0)fail(where+' errors '+errs.slice(n0).join(' | ').slice(0,500))}
}
await p.evaluate(()=>{if(DATA.tenant()!=='core')TENANT.switch('core')});
console.log('checks',checks,'| over 800 ms (report only):',slow.length?slow.slice(0,12).join(', '):'none');
console.log('tenant screens B6',bad?'FAIL '+bad:'ok','| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();
