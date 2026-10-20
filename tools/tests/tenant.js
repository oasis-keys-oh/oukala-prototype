// Tenancy test: one tenant model (DC-31), identity and membership with default deny (CL-63), the tenant-aware screen registry
// (CL-55), the tenant pack validator and the Meridian core pack regression snapshot (DC-09).
// Snapshot rule: for the record entities the core ids must match tools/tests/tenant_core_snapshot.json exactly; for the
// metrics registry no snapshot id may disappear (additions are reported); processes and workflows register lazily and on timers
// while the page settles, so only their counts are recorded and reported, never compared.
// Usage: node tools/tests/tenant.js <dir containing full.html> [--update]   (--update rewrites the snapshot after a deliberate change)
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const SNAP=path.join(__dirname,'tenant_core_snapshot.json');const OPEN=['metrics'],LAZY=['processes','workflows'];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const update=process.argv.includes('--update');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const f=[];const snap=DATA.snapshot('core'); /* taken first: some registries grow as screens render */const ok=(c,m)=>{if(!c)f.push(m)};const btn=()=>(document.getElementById('tnBtn')||{}).textContent||'';
 /* one tenant model (DC-31) */
 let fired=0;const off=HOOKS.on('tenantChange',()=>fired++,{id:'t-count'});
 SCN.set('mining');ok(DATA.tenant()==='mining'&&TENANT.cur()==='mining','SCN.set drives DATA and TENANT');
 TENANT.switch('storage');ok(SCN.cur==='storage'&&DATA.tenant()==='storage','TENANT.switch goes through SCN and DATA');
 DATA.setTenant('health');ok(SCN.cur==='health'&&TENANT.cur()==='health','DATA.setTenant moves SCN (one model)');
 ok(btn().indexOf('Larkspur Health')>=0,'active tenant visible in the side menu: '+btn());
 ok(fired===3,'one tenantChange per switch, got '+fired);off();
 ok(JYX.JY.list.every(j=>/^JH/.test(j.id)),'Healthcare journeys only after the switch');
 ok(DATA.tenants().length===4&&DATA.tenants().every(t=>t.org),'tenant registry has four named tenants');
 /* R18: a gap is empty, never Meridian rows */
 TENANT.switch('mining');const coreP=new Set(DATA.get('projects',{tenant:'core'}).map(x=>x.id));
 ok(DATA.get('projects').length>0&&DATA.get('projects').every(x=>/^RR-/.test(x.id)&&!coreP.has(x.id)),'mining projects are its own');
 ok(DATA.get('people').length>0&&DATA.get('people').every(x=>x.org!=='Meridian Standards Foundation'),'mining people are its own');
 DATA.pack('zz_gap',{projects:[{id:'G1',n:'Gap fixture'}]});ok(DATA.get('invoices',{tenant:'zz_gap'}).length===0&&DATA.gaps().includes('zz_gap:invoices'),'a missing entity is an empty list and a recorded gap');
 TENANT.switch('core');
 /* industry packs (DC-11, DC-22, DC-23): generated, complete, owners and backups, maturity records, COO inputs (JM-07) */
 const coreNames=new Set(DATA.get('people',{tenant:'core'}).map(x=>x.name));const need=['projects','budget_lines','invoices','people','metrics','objectives','key_results','processes','maturity','vocabulary','workload','value_chain','pillars','demand'];
 ['health','mining','storage'].forEach(t=>{const g=(e)=>DATA.get(e,{tenant:t});
  ok(window.TENANT_PACKS&&TENANT_PACKS[t]&&/gen_pack_specs/.test(TENANT_PACKS[t].spec),t+': pack is generated from a spec');
  need.forEach(e=>ok(g(e).length>0,t+': pack has '+e));
  const hum=new Set(g('people').filter(p=>p.kind==='human').map(p=>p.name));
  ok(g('metrics').every(m=>m.owner&&m.backup&&m.owner!==m.backup&&hum.has(m.owner)&&hum.has(m.backup)&&m.f&&m.rem&&m.base!=null),t+': every metric has owner, different backup, formula, baseline and remediation');
  ok(g('processes').every(p=>{const m=g('maturity').find(x=>x.process===p.id);return m&&Object.keys(m.dims).length===6&&m.target>=1&&m.level===Math.min(...Object.values(m.dims))}),t+': every process has a six-dimension maturity record with a target');
  ok(g('people').filter(p=>p.kind!=='human').every(p=>hum.has(p.sponsor)),t+': every agent and robot has a human sponsor');
  ok(g('people').every(p=>!coreNames.has(p.name)),t+': no person shares a name with a Meridian person: '+g('people').filter(p=>coreNames.has(p.name)).map(p=>p.name));
  ok(g('budget_lines').every(l=>g('projects').some(p=>p.id===l.p))&&g('invoices').every(v=>g('budget_lines').some(l=>l.id===v.line)),t+': the thread links invoice to line to project');
  ok(g('projects').every(p=>g('objectives').some(o=>o.id===p.obj)),t+': every project serves an objective')});
 /* vocabulary (CL-57) */
 ok(DATA.term('incident',{tenant:'core'})==='incident'&&DATA.term('incident',{tenant:'mining'})==='safety event'&&DATA.term('customer',{tenant:'health',many:true})==='patients'&&DATA.term('ticket',{tenant:'storage',cap:true})==='Support case','DATA.term follows the tenant');
 TENANT.switch('mining');ok(DATA.term('ticket')==='work order'&&DATA.terms().incident==='safety event','DATA.term reads the active tenant');TENANT.switch('core');
 /* identity and membership, default deny (CL-63) */
 ok(IDENT.me().id==='casey-rowan'&&TENANT.list().length===4,'demo presenter is a member of four tenants');
 IDENT.use('jordan-lee');ok(TENANT.list().join()==='core','Jordan Lee sees only Meridian');
 ok(TENANT.switch('health')===false&&DATA.tenant()==='core','switch to a tenant without membership is refused');
 ok(DATA.setTenant('health')===false&&DATA.tenant()==='core','DATA refuses a tenant without membership');
 ok(IDENT.can('configure','core')&&!IDENT.can('approve','core')&&!IDENT.can('view','health'),'roles per membership, default deny');
 TENANT.switch('core');document.querySelector('[data-r32-tn="open"]')&&document.querySelector('[data-r32-tn="open"]').click();
 const menu=[...document.querySelectorAll('#tnMenu [data-r32-tn]')].map(x=>x.dataset.r32Tn);ok(menu.join()==='core','switcher offers only member tenants: '+menu);
 document.body.click();
 IDENT.use('grace-oduya');ok(DATA.tenant()==='health','an identity with one membership lands in that tenant');
 IDENT.use('casey-rowan');TENANT.switch('core');ok(DATA.tenant()==='core'&&TENANT.list().length===4,'back to the demo presenter on Meridian');
 /* screen registry (CL-55) */
 const scr=DATA.screens();ok(scr.length>=SCREENS.length,'every registered screen is in the tenant registry');
 ['tn_projects','tn_people','tn_metrics','tn_admin'].forEach(id=>ok(DATA.screenMode(id)==='data','screen '+id+' reads through DATA'));
 ok(DATA.screenMode('ppl_jrny')==='tenant'&&DATA.screenMode('home')==='core','registry modes');
 /* pack validator (DC-09) */
 const val=DATA.tenants().map(t=>DATA.validate(t.id));val.forEach(v=>ok(v.ok,'pack '+v.tenant+' valid: '+v.errors.join('; ')));
 DATA.pack('zz_bad',{projects:[{id:'X1',n:'A'},{id:'X1',n:'B'},{n:'no id'},{id:'X2',n:'Run by Meridian Standards Foundation'}],nonsense:[{id:1}]});
 const bad=DATA.validate('zz_bad');ok(!bad.ok,'validator rejects a bad pack');
 ['duplicate id X1','missing id','unknown entity nonsense','mentions another tenant'].forEach(m=>ok(bad.errors.some(e=>e.indexOf(m.split(' ').slice(-1)[0])>=0&&e.indexOf(m.split(' ')[0])>=0),'validator reports '+m+': '+bad.errors.join('; ')));
 return{f,snap,val:val.map(v=>v.tenant+' '+JSON.stringify(v.counts))}});
r.val.forEach(v=>console.log('pack',v));
// snapshot
LAZY.forEach(e=>{if(r.snap[e])r.snap[e]={count:r.snap[e].count,ids:'not recorded: registers lazily'}});
if(update||!fs.existsSync(SNAP)){fs.writeFileSync(SNAP,JSON.stringify(r.snap,null,1)+'\n');console.log('snapshot written',SNAP)}
else{const old=JSON.parse(fs.readFileSync(SNAP,'utf8'));
 Object.keys(old).forEach(e=>{const now=r.snap[e];if(!now){r.f.push('snapshot: entity '+e+' is gone');return}
  if(LAZY.includes(e)){console.log('snapshot: '+e+' count '+now.count+' (was '+old[e].count+', not compared)');return}
  const was=new Set(old[e].ids),is=new Set(now.ids);const lost=[...was].filter(x=>!is.has(x)),added=[...is].filter(x=>!was.has(x));
  if(lost.length)r.f.push('snapshot: '+e+' lost '+lost.length+' ids ('+lost.slice(0,5).join(', ')+')');
  if(added.length){if(OPEN.includes(e))console.log('snapshot: '+e+' gained '+added.length+' ids (allowed for this registry)');else r.f.push('snapshot: '+e+' gained '+added.length+' ids ('+added.slice(0,5).join(', ')+')')}});
 Object.keys(r.snap).filter(e=>!old[e]).forEach(e=>r.f.push('snapshot: new entity '+e+' not in the snapshot'));
 if(r.f.some(x=>/^snapshot/.test(x)))console.log('If the change is deliberate: node tools/tests/tenant.js build_out --update');}
console.log('tenant test',r.f.length?'FAIL '+r.f.join(' | '):'ok','| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(r.f.length||errs.length?1:0)})();
