// PR-32 B7 (risk, control and AI) and B8 (people, organization and my work): the screens these batches moved onto the tenant data layer.
// For every screen below and every tenant (Meridian and the three industry tenants, switched with TENANT.switch, no reload):
//  1. the screen is registered in mode "data" and renders without page errors, on its first view and on each of its tabs;
//  2. it shows that tenant's organization or its own rows (an id or a name from the tenant's rows of the screen's entities), or the
//     labeled gap ("No data in this sample company yet") when the tenant has no rows;
//  3. it shows no other tenant's names: organization, record ids, project names and people names (the fingerprints of tenant_leak.js),
//     Meridian included under an industry tenant (R18).
// Usage: node tools/tests/tenant_screens_b78.js <dir containing full.html> [--verbose] [screen ...]
const {chromium}=require('playwright');const path=require('path');
const B7=['grc_home','grc_risk','grc_ctl','grc_find','grc_pol','grc_aud','grc_ven','grc_exc','r15d_agents','agent_defs','ai_runtime'];
const B8=['meet_hub','meet_act','meet_dec','meet_series','ppl_train','ppl_av','ppl_meet'];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const verbose=process.argv.includes('--verbose');
const only=process.argv.slice(3).filter(a=>!a.startsWith('--'));const SCREENS=(only.length?only:B7.concat(B8));
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
await p.evaluate(()=>{const fp={},own={};const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const me=new Set(IDENT.people.map(x=>x.name));
 DATA.tenants().forEach(t=>{const terms=new Set([t.org,t.short].filter(Boolean));const add=v=>{v=String(v||'');if(v.length>=3&&!me.has(v))terms.add(v)};
  if(t.id==='core'){DATA.get('invoices',{tenant:'core'}).forEach(r=>add(r.id));DATA.get('projects',{tenant:'core'}).forEach(r=>add(r.n));
   DATA.get('people',{tenant:'core'}).filter(r=>r.kind==='human').forEach(r=>add(r.name))}
  else{['projects','budget_lines','invoices','metrics','objectives','key_results','processes','demand','pillars','people','journeys','workflows'].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>add(r.id)));
   DATA.get('projects',{tenant:t.id}).forEach(r=>add(r.n));DATA.get('people',{tenant:t.id}).forEach(r=>add(r.name))}
  fp[t.id]=[...terms]});
 const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
 window.__fp={};Object.keys(fp).forEach(k=>{window.__fp[k]=fp[k].filter(x=>cnt[x]===1).map(x=>new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+'($|[^A-Za-z0-9_-])'))});
 window.__surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],script,style').forEach(x=>x.remove());
  const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');
  return c.textContent+' '+at};
 window.__hits=(txt,except)=>{const out=[];Object.keys(window.__fp).forEach(k=>{if(k===except)return;
  window.__fp[k].forEach(re=>{const m=re.exec(txt);if(m)out.push(k+':'+m[0].trim()+' [..'+txt.slice(Math.max(0,m.index-50),m.index+m[0].length+10).replace(/\s+/g,' ')+'..]')})});return out};
 /* own rows: ids and names of the tenant's rows of the screen's entities */
 window.__own=(id,txt)=>{const t=DATA.tenant(),i=DATA.tenantInfo(t)||{};const ents=(DATA.screens().find(s=>s.id===id)||{}).entities||[];
  if([i.org,i.short].some(x=>x&&txt.indexOf(x)>=0))return 'org';let rows=0;
  for(const e of ents){const rs=DATA.get(e);rows+=rs.length;for(const r of rs){for(const f of ['name','n','t','title','id']){const v=r&&r[f];if(typeof v==='string'&&v.length>=5&&txt.indexOf(v)>=0)return e+':'+v}}}
  if(/No data in this sample company yet/.test(txt))return 'gap';return rows?null:'no rows'}});
const tabsOf=async()=>p.evaluate(()=>[...document.querySelectorAll('#view [role=tab]')].length);
let checks=0;const tenants=await p.evaluate(()=>DATA.tenants().map(t=>t.id));
for(const t of tenants){await p.evaluate(t=>TENANT.switch(t),t);await p.waitForTimeout(200);
 for(const id of SCREENS){const n0=errs.length;
  const mode=await p.evaluate(id=>DATA.screenMode(id),id);if(t==='core'&&mode!=='data')fail(id+': mode '+mode+', expected data');
  await p.evaluate(id=>go(id),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(120);checks++;
  const r=await p.evaluate(([id,t])=>{const s=window.__surface();return{h:window.__hits(s,t),own:window.__own(id,s),scr:S.screen,len:s.length}},[id,t]);
  if(r.h.length)fail(t+' '+id+' shows another tenant: '+r.h.slice(0,4).join(' | '));
  if(!r.own)fail(t+' '+id+' shows neither the tenant organization nor its own rows');
  if(verbose)console.log(t,id,'own',r.own,'len',r.len);
  const nt=await tabsOf();
  for(let k=1;k<nt;k++){const n1=errs.length;
   await p.evaluate(k=>{const bs=[...document.querySelectorAll('#view [role=tab]')];if(bs[k])bs[k].click()},k);await p.waitForTimeout(80);checks++;
   const h=await p.evaluate(t=>window.__hits(window.__surface(),t),t);if(h.length)fail(t+' '+id+' tab '+k+' shows another tenant: '+h.slice(0,4).join(' | '));
   if(errs.length>n1)fail(t+' '+id+' tab '+k+' errors '+errs.slice(n1).join(' | ').slice(0,400))}
  if(errs.length>n0)fail(t+' '+id+' errors '+errs.slice(n0).join(' | ').slice(0,400))}}
await p.evaluate(()=>TENANT.switch('core'));
console.log('tenant_screens_b78: screens',SCREENS.length,'| tenants',tenants.join(','),'| checks',checks,'| failures',bad,'| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();
