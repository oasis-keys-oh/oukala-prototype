// PR-32 B4 (portfolio and delivery) and B5 (money and contracts): the screens these batches moved to the tenant data layer, under every tenant.
// For each screen and each tenant (Meridian, the three industry packs and one company made by Bring your company):
//  1. the screen is registered as mode "data" and renders (no page error, not blank);
//  2. it shows that tenant's own rows (an id or name from one of the entities it registers) or a labeled gap (a screen that
//     registers no entities, such as the Product log, carries no tenant business data);
//  3. it never shows another tenant's names or record ids (organization, people, projects, invoices, plus the ids and names of the
//     B4 and B5 entities: plan tasks, RAID items, budget requests, cost centers, vendors, contracts, purchase orders, timesheets);
//  4. each view tab the screen offers ([role=tab], view switchers) is clicked and checked the same way.
// Usage: node tools/tests/tenant_screens_b45.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
const SCREENS=[
 // B4 Portfolio and delivery
 'ims','plan','log','ppm_proj','ppm_raid','ppm_wbs','itsm_rel','agile_board','agile_art','r15_time','r15_p2p',
 // B5 Money and contracts
 'bud_over','bud_model','bud_ven','bud_doa','fin_budget','fin_gates','fin_alloc','fin_rules','fin_model','fin_color','fin_spend','bud_req','bud_ccmap','bud_lines','ppm_sow','tbm_model'];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const only=process.argv[3]?process.argv[3].split(','):null;
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0,checks=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view')&&window.DATA&&window.TENANT,null,{timeout:120000});await p.waitForTimeout(900);
// a company made by Bring your company (PACKGEN), when the generator is present
const gen=await p.evaluate(()=>{try{if(!window.PACKGEN||!PACKGEN.fromAnswers)return 'error no PACKGEN';const r=PACKGEN.fromAnswers({name:'Quillfield Components',industry:'manufacturing',pain:'cost'});TENANT.switch('core');return r.ok?r.id:'error '+(r.errors||[]).join(' | ')}catch(e){return 'error '+e.message}});
if(typeof gen==='string'&&gen.indexOf('error')===0)console.log('note: Bring your company not exercised ('+gen+')');
await p.evaluate(()=>{(DATA.tenants()||[]).forEach(t=>{try{if(t.id!=='core'&&window.BUNDLE&&BUNDLE.need)BUNDLE.need('pack_'+t.id)}catch(e){}})});await p.waitForTimeout(400);
await p.evaluate(()=>{const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const me=new Set(IDENT.people.map(x=>x.name));
 const ENT=['projects','budget_lines','invoices','people','plan_tasks','raid_items','budget_requests','cost_centers','vendors','contracts','purchase_orders','timesheets'];
 const fp={};DATA.tenants().forEach(t=>{const terms=new Set([t.org,t.short].filter(Boolean));const add=v=>{v=String(v==null?'':v);if(v.length>=4&&!me.has(v)&&!/^\d+$/.test(v))terms.add(v)};
  ENT.forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>{if(!r)return;
   if(e==='people'){if(r.kind==='human'||t.id!=='core')add(r.name);return}
   if(e==='projects'){add(r.n);if(t.id!=='core')add(r.id);return}
   if(e==='vendors'){if(t.id!=='core'||String(r.n).split(/\s+/).length>=2)add(r.n);return} /* a one-word product name (a tool the log mentions) identifies no tenant */
   if(e==='invoices'){add(r.id);return}
   if(t.id!=='core'||/^(PO|CT|TS|BR|R)-/.test(String(r.id||'')))add(r.id||r.code)}));
  fp[t.id]=[...terms]});
 const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
 window.__b45={fp:{}};Object.keys(fp).forEach(k=>{window.__b45.fp[k]=fp[k].filter(x=>cnt[x]===1).map(x=>new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+'($|[^A-Za-z0-9_-])'))});
 window.__b45.surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],script,style').forEach(x=>x.remove());
  const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');return c.textContent+' '+at};
 window.__b45.hits=(txt,except)=>{const out=[];Object.keys(window.__b45.fp).forEach(k=>{if(k===except)return;window.__b45.fp[k].forEach(re=>{const m=re.exec(txt);if(m)out.push(k+':'+m[0].trim()+' [..'+txt.slice(Math.max(0,m.index-50),m.index+m[0].length+10).replace(/\s+/g,' ')+'..]')})});return out};
 /* own rows: any id or name from the entities the screen registers, read for this tenant */
 window.__b45.own=(id,t)=>{const s=DATA.screens().find(x=>x.id===id)||{};const txt=window.__b45.surface();let rows=0;
  if(!(s.entities||[]).length)return {ok:true,via:'no tenant business data on this screen'};
  for(const e of (s.entities||[])){const R=DATA.get(e,{tenant:t});rows+=R.length;for(const r of R){for(const f of ['n','name','short','id','code','t','title','team','d']){const v=r&&r[f];if(typeof v==='string'&&v.length>=4&&txt.indexOf(v)>=0)return {ok:true,via:e+'.'+f+'='+v}}}}
  const gap=/No data in this sample company yet|in this tenant's pack yet|gap is recorded|No .* in this sample company/i.test(txt);return {ok:gap,via:gap?'labeled gap':'none',rows}}});
const tenants=await p.evaluate(()=>DATA.tenants().map(t=>t.id));console.log('tenants',tenants.join(','),'| screens',SCREENS.length);
const list=only||SCREENS;
const tabsOf=async()=>p.evaluate(()=>[...document.querySelectorAll('#view [role=tab], #view .vsw label')].filter(x=>x.offsetParent!==null).length);
const check=async(t,id,where)=>{checks++;const r=await p.evaluate(([t,id])=>({h:window.__b45.hits(window.__b45.surface(),t),len:document.querySelector('#view').innerHTML.length,scr:S.screen}),[t,id]);
 if(r.scr!==id)return false;
 if(r.len<400)fail(t+' '+id+where+' renders blank ('+r.len+')');
 if(r.h.length)fail(t+' '+id+where+' shows another tenant: '+r.h.slice(0,4).join(' | '));return true};
for(const t of tenants){await p.evaluate(t=>TENANT.switch(t),t);await p.waitForTimeout(250);
 if(await p.evaluate(()=>DATA.tenant())!==t){fail(t+': switch refused');continue}
 for(const id of list){const n0=errs.length;
  const mode=await p.evaluate(id=>{if(S.stn&&S.stn.tab)delete S.stn.tab[id];return DATA.screenMode(id)},id);if(mode!=='data')fail(id+' is mode '+mode+', not data');
  await p.evaluate(id=>go(id),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(140);
  await check(t,id,'');
  const own=await p.evaluate(([id,t])=>window.__b45.own(id,t),[id,t]);if(!own.ok)fail(t+' '+id+' shows neither its own rows nor a labeled gap (rows '+own.rows+')');
  const nt=Math.min(10,await tabsOf());
  for(let i=0;i<nt;i++){const ok=await p.evaluate(i=>{const x=[...document.querySelectorAll('#view [role=tab], #view .vsw label')].filter(x=>x.offsetParent!==null)[i];if(!x)return false;x.click();return true},i).catch(()=>false);
   if(!ok)break;await p.waitForTimeout(120);if(!await check(t,id,' tab '+i)){await p.evaluate(id=>go(id),id);await p.waitForTimeout(100)}}
  if(errs.length>n0)fail(t+' '+id+' errors '+errs.slice(n0).join(' | ').slice(0,500))}}
console.log('checks',checks,'| failures',bad,'| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();
