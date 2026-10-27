// DC-25 per-tenant rehearsal check. For each tenant, switches with TENANT.switch (the real path, no reload) and walks every beat of
// every Showroom tour beat on the tenant the tour declares (beat.tenant, tour.tenant, default core): opens the beat's screen, clicks its tab the way the Showroom does, and checks
//  1. no other tenant's organization names, record ids, project or people names on screen (same fingerprints as tenant_leak.js);
//  2. a tenant-aware screen (DATA.screens() mode "data" or "tenant") shows this tenant's own data: its organization name and at
//     least one of its own record names or ids; an Atlantic Systems-only screen carries the "not tenant-aware yet" label instead;
//  3. no page errors; the tab named by the beat exists.
// Reports render timings per tenant (ms to open each beat and its tab, median and slowest) and the talk time of each cut.
// The Showroom itself starts tours on Atlantic Systems today; this check is what makes a tenant tour safe to rehearse.
// Usage: node tools/tests/tenant_tour.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
const setup=await p.evaluate(()=>{const fp={},own={};const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const me=new Set(IDENT.people.map(x=>x.name));
 DATA.tenants().forEach(t=>{const terms=new Set([t.org,t.short].filter(Boolean));const add=v=>{v=String(v||'');if(v.length>=3&&!me.has(v))terms.add(v)};
  if(t.id==='core'){DATA.get('invoices',{tenant:'core'}).forEach(r=>add(r.id));DATA.get('projects',{tenant:'core'}).forEach(r=>add(r.n));
   DATA.get('people',{tenant:'core'}).filter(r=>r.kind==='human').forEach(r=>add(r.name))}
  else{['projects','budget_lines','invoices','metrics','objectives','key_results','processes','people','journeys','workflows'].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>add(r.id)));
   ['projects','objectives','metrics'].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>add(r.n)));DATA.get('people',{tenant:t.id}).forEach(r=>add(r.name));DATA.get('journeys',{tenant:t.id}).forEach(r=>add(r.n))}
  fp[t.id]=[...terms]});
 const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
 window.__fp={};Object.keys(fp).forEach(k=>{window.__fp[k]=fp[k].filter(x=>cnt[x]===1).map(x=>new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+(((DATA.tenantInfo('core')||{}).org===x||(DATA.tenantInfo('core')||{}).short===x)?'(?! sample)':'')+'($|[^A-Za-z0-9_-])'))});
 window.__surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],script,style').forEach(x=>x.remove());
  const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');return c.textContent+' '+at};
 window.__hits=(txt,t)=>{const out=[];Object.keys(window.__fp).forEach(k=>{if(k===t)return;window.__fp[k].forEach(re=>{const m=re.exec(txt);if(m)out.push(k+':'+m[0].trim())})});return out};
 window.__own=(txt,t)=>window.__fp[t].filter(re=>re.test(txt)).length;
 /* the beat's tab: a view tab first (as the Showroom clicks it), then a family view chip (bst "Trace detail" opens strat_exec) */
 window.__tab=txt=>{if(!txt)return true;const want=txt.toLowerCase();const find=sel=>{const bs=[...document.querySelectorAll(sel)];const lab=x=>x.textContent.trim().toLowerCase().replace(/^\d+\s*/,'');return bs.find(x=>lab(x)===want)||bs.find(x=>lab(x).startsWith(want))};
  const b=find('.screen .views button, .screen [role=tab], .screen .views label')||find('.screen .r15-fam button');if(b){b.click();return true}return false};
 const beats=[];SHOW.demos.forEach(d=>d.beats.forEach(x=>beats.push({demo:d.id,id:x.id,go:x.go,tab:x.tab||null,secs:x.secs,tenant:x.tenant||d.tenant||'core'})));
 return{tenants:DATA.tenants().map(t=>t.id),beats,cuts:SHOW.demos.map(d=>({id:d.id,total:d.total}))}});
console.log('tours',setup.cuts.map(c=>c.id+' '+c.total+' s').join(', '),'| beats',setup.beats.length,'| tenants',setup.tenants.join(','));
const report=[];
for(const t of setup.tenants){
 await p.evaluate(t=>TENANT.switch(t),t);await p.waitForTimeout(250);
 const times=[];let aware=0,legacy=0;const legacyIds=new Set();
 for(const bt of setup.beats){if(bt.tenant!==t)continue; /* a beat is rehearsed on the tenant its tour declares (SHOW contract: default core) */const n0=errs.length;
  const r=await p.evaluate(([bt,t])=>{const t0=performance.now();go(bt.go);const tabOk=window.__tab(bt.tab);const ms=performance.now()-t0;
   const txt=window.__surface();const mode=DATA.screenMode(bt.go);
   return{ms,tabOk,mode,hits:window.__hits(txt,t),own:window.__own(txt,t),org:txt.indexOf(DATA.tenantInfo(t).org)>=0,lab:!!document.querySelector('#view [data-tenant-legacy]'),cur:DATA.tenant()}},[bt,t]);
  await p.waitForTimeout(120);
  /* a beat's tab may re-render on a timer: read the surface again after it settles */
  const late=await p.evaluate(t=>window.__hits(window.__surface(),t),t);
  const where=t+' '+bt.demo+' '+bt.id+' ('+bt.go+(bt.tab?' / '+bt.tab:'')+')';
  times.push({beat:bt.id,ms:r.ms});
  if(r.cur!==t)fail(where+': tenant changed to '+r.cur);
  if(!r.tabOk)fail(where+': tab not found');
  const hits=[...new Set(r.hits.concat(late))];if(hits.length)fail(where+' shows another tenant: '+hits.slice(0,4).join(' | '));
  if(r.mode!=='core'){aware++;if(t!=='core'&&(!r.org&&r.own<2))fail(where+': tenant-aware screen does not show the tenant\'s own data (org '+r.org+', own terms '+r.own+')');}
  else{legacy++;legacyIds.add(bt.go);if(t!=='core'&&!r.lab)fail(where+': Atlantic-only screen without the tenant label')}
  if(errs.length>n0)fail(where+' errors '+errs.slice(n0).join(' | ').slice(0,400))}
 const ms=times.map(x=>x.ms).sort((a,b)=>a-b);const med=ms[Math.floor(ms.length/2)]||0,slow=times.slice().sort((a,b)=>b.ms-a.ms)[0]||{};
 report.push({t,aware,legacy,legacyIds:[...legacyIds],med:Math.round(med),slow:slow.beat+' '+Math.round(slow.ms||0),total:Math.round(ms.reduce((a,x)=>a+x,0))});
}
await p.evaluate(()=>TENANT.switch('core'));
console.log('tenant   | beats on tenant-aware screens | beats on Atlantic-only screens | render ms median | slowest beat ms | total ms');
report.forEach(r=>console.log(r.t.padEnd(8),'|',String(r.aware).padEnd(29),'|',(r.legacy+(r.legacyIds.length?' ('+r.legacyIds.join(', ')+')':'')).padEnd(30),'|',String(r.med).padEnd(16),'|',r.slow.padEnd(15),'|',r.total));
console.log('tenant tour',bad?'FAIL '+bad:'ok','| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();
