// PR-32 batches B2 (cross-cutting helpers) and B3 (strategy and value), stream data-b23: every screen these batches moved, under every
// tenant (core, health, mining, storage). For each screen and tenant: the screen is registered with the expected mode, it renders, it
// shows rows of that tenant (a name or id from that tenant's own records, read from DATA, outside the tenant chip), it shows no other
// tenant's organization, people, record ids or record names, and it raises no page error.
// Fingerprints: the organization names, and for each tenant the ids and names (n, name, t, title) of its records in the entities
// listed per screen plus people and projects (for core: record ids, human people and project names, as tenant_leak.js); a term two
// tenants share identifies neither; names under three words and ids without a digit are left out (generic words identify nobody).
// Usage: node tools/tests/tenant_screens_b23.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
/* id, expected mode, entities whose rows identify the tenant on that screen */
const SCREENS=[
 ['plat_dmap','data',['metrics','processes']],
 ['plat_pmap','data',['metrics','processes']],
 ['plat_proc','data',['processes','metrics','people']],
 ['zl_conn','data',['people','projects','risks','services']],
 /* B3 */
 ['r18_spend','data',['budget_lines','cost_centers']],
 ['r18_levels','data',[]],
 ['kcs_viz','data',['reports','metrics']],
 ['exe_risk','data',['risks','projects']],
 ['exe_apps','data',['applications']],
 ['exe_board','data',['objectives','key_results','projects','risks']],
 ['exe_scen','data',['scenarios','projects']],
 ['bud_ben','data',['benefits','projects']],
 ['r17u_dash','data',['projects','incidents','reports','budget_lines']],
 ['r15_sem','data',['metrics','reports']],
 ['r15_rpt','data',['reports','projects']],
 ['r16j_dash','data',['reports','projects']],
];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const only=process.argv[3]?process.argv[3].split(','):null;
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0,checks=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(900);
const list=SCREENS.filter(s=>!only||only.includes(s[0]));
const tenants=await p.evaluate(()=>DATA.tenants().map(t=>t.id));
/* load every pack's records (the split build fetches them on demand; full.html embeds them) */
await p.evaluate(()=>{DATA.tenants().forEach(t=>{try{if(t.id!=='core'&&window.BUNDLE&&BUNDLE.need)BUNDLE.need('pack_'+t.id)}catch(e){}})});await p.waitForTimeout(600);
const ents=[...new Set(['people','projects'].concat(...list.map(s=>s[2])))];
await p.evaluate(ents=>{const me=new Set(IDENT.people.map(x=>x.name));const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const fp={};
 /* platform labels (data model tables) are not a tenant's fingerprint even when a pack names a process the same way */
 const plat=new Set();try{DATAMODEL.list().forEach(x=>plat.add(String(x.label||'')))}catch(e){}
 DATA.tenants().forEach(t=>{const T=new Set([t.org].filter(Boolean));const add=v=>{v=String(v==null?'':v).trim();if(v.length>=4&&!me.has(v)&&!plat.has(v))T.add(v)};
  ents.forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>{if(!r||typeof r!=='object')return;if(e!=='metrics'&&e!=='processes'&&/\d/.test(String(r.id)))add(r.id);
   /* core names: only its human people and project names (as tenant_leak.js); core record names such as metric titles reuse platform labels */
   if(t.id==='core'&&!(e==='projects'||(e==='people'&&r.kind==='human')))return;
   ['n','name','t','title'].forEach(k=>{const v=r[k];if(typeof v==='string'&&(e==='people'?v.split(/\s+/).length>=2:v.split(/\s+/).length>=3))add(v)})}));
  fp[t.id]=[...T]});
 const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
 window.__b23fp={};Object.keys(fp).forEach(k=>{window.__b23fp[k]=fp[k].filter(x=>cnt[x]===1).map(x=>({x,re:new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+'($|[^A-Za-z0-9_-])')}))});
 window.__b23surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],[data-tenant-chip],[data-tenant-legacy],script,style').forEach(x=>x.remove());
  const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');return c.textContent+' '+at};
 window.__b23=t=>{const s=window.__b23surface();const own=window.__b23fp[t].filter(f=>f.re.test(s)).map(f=>f.x);const other=[];
  Object.keys(window.__b23fp).forEach(k=>{if(k===t)return;window.__b23fp[k].forEach(f=>{const m=f.re.exec(s);if(m)other.push(k+':'+f.x+' [..'+s.slice(Math.max(0,m.index-40),m.index+f.x.length+20).replace(/\s+/g,' ')+'..]')})});
  return{own:own.length,ownS:own.slice(0,3),other,len:document.getElementById('view').innerHTML.length,mode:DATA.screenMode(S.screen),scr:S.screen}}},ents);
for(const t of tenants){await p.evaluate(t=>{if(DATA.tenant()!==t){if(window.TENANT&&TENANT.switch)TENANT.switch(t);else DATA.setTenant(t)}},t);await p.waitForTimeout(250);
 for(const [id,mode] of list){const n0=errs.length;checks++;
  await p.evaluate(id=>go(id),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(150);
  const r=await p.evaluate(t=>window.__b23(t),t);
  if(r.mode!==mode)fail(t+' '+id+' registered mode '+r.mode+', expected '+mode);
  if(r.len<400)fail(t+' '+id+' renders almost nothing ('+r.len+' characters)');
  if(!r.own)fail(t+' '+id+' shows none of this tenant\'s own rows');
  if(r.other.length)fail(t+' '+id+' shows another tenant: '+r.other.slice(0,4).join(' | '));
  if(errs.length>n0)fail(t+' '+id+' errors '+errs.slice(n0).join(' | ').slice(0,400));
  if(process.env.VERBOSE)console.log(t,id,'own rows seen',r.own,r.ownS.join(' | '))}}
console.log('tenant_screens_b23: screens',list.length,'| tenants',tenants.join(','),'| checks',checks,'| failures',bad,'| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();
