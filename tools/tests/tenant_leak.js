// CL-56 leakage and seamless-switch test (absorbs DC-29). Rules R17, R18.
// Switches through every tenant with TENANT.switch (the real path, no reload) and checks:
//  1. seamless: same screen, user state (tab, filter) kept, no page reload, SCN in step with DATA, active tenant shown in the side menu;
//  2. no leakage on tenant-aware screens (DATA.screens() mode "data" or "tenant", every Journey maps tab): the rendered text and
//     attributes never contain another tenant's organization names, record ids, project names or people names;
//  3. legacy screens (mode "core"), swept under core and under health on a fresh page each: no industry tenant's fingerprint outside
//     that tenant, and under health every legacy screen carries the "not tenant-aware yet" label;
//  4. search never returns another industry tenant's records. Meridian records in search under other tenants are counted as legacy
//     (search providers are not tenant-aware yet), not failed.
// Fingerprints (wave 2, DC-11, DC-22, DC-23): each industry pack's ids (projects, budget lines, invoices, metrics, objectives, key results,
// processes, demand, pillars, people, journeys, workflows), its people and project names, its vendors, and its metric, objective, demand
// and process names of three words or more that no Meridian metric or objective shares.
// Excluded on purpose: tenant choosers and the identity card ([data-tenant-chooser]); the signed-in identity's own name (IDENT).
// Usage: node tools/tests/tenant_leak.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
async function open(){const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
 p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
 await p.evaluate(()=>{const fp={};const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const me=new Set(IDENT.people.map(x=>x.name));
  DATA.tenants().forEach(t=>{const terms=new Set([t.org,t.short].filter(Boolean));const add=v=>{v=String(v||'');if(v.length>=3&&!me.has(v))terms.add(v)};
   if(t.id==='core'){DATA.get('invoices',{tenant:'core'}).forEach(r=>add(r.id));DATA.get('projects',{tenant:'core'}).forEach(r=>add(r.n));
    DATA.get('people',{tenant:'core'}).filter(r=>r.kind==='human').forEach(r=>add(r.name))}
   else{['projects','budget_lines','invoices','metrics','objectives','key_results','processes','demand','pillars','people','journeys','workflows'].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>add(r.id)));
    DATA.get('projects',{tenant:t.id}).forEach(r=>add(r.n));DATA.get('people',{tenant:t.id}).forEach(r=>add(r.name));
    /* names that only this tenant's pack carries (DC-11, DC-22, DC-23); a name a Meridian metric or objective also uses identifies neither */
    const coreN=new Set(DATA.get('metrics',{tenant:'core'}).map(r=>r.n).concat(DATA.get('objectives',{tenant:'core'}).map(r=>r.n)));
    const addN=(v,any)=>{v=String(v||'');if(!coreN.has(v)&&(any||v.split(/\s+/).length>=3))add(v)}; /* three words or more: short generic names (Renewal, Scheduling) are not fingerprints */
    DATA.get('invoices',{tenant:t.id}).forEach(r=>addN(r.vendor,1));DATA.get('objectives',{tenant:t.id}).forEach(r=>addN(r.n));
    DATA.get('metrics',{tenant:t.id}).forEach(r=>addN(r.n));DATA.get('demand',{tenant:t.id}).forEach(r=>addN(r.n));DATA.get('processes',{tenant:t.id}).forEach(r=>addN(r.n))}
   fp[t.id]=[...terms]});
  /* a term shared by two tenants identifies neither */
  const cnt={};Object.values(fp).forEach(a=>a.forEach(x=>cnt[x]=(cnt[x]||0)+1));
  window.__fp={};Object.keys(fp).forEach(k=>{window.__fp[k]=fp[k].filter(x=>cnt[x]===1).map(x=>new RegExp('(^|[^A-Za-z0-9_-])'+esc(x)+'($|[^A-Za-z0-9_-])'))});
  window.__surface=()=>{const v=document.getElementById('view');const c=v.cloneNode(true);c.querySelectorAll('[data-tenant-chooser],script,style').forEach(x=>x.remove());
   const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');
   return c.textContent+' '+at};
  window.__hits=(txt,except,only)=>{const out=[];Object.keys(window.__fp).forEach(k=>{if(k===except)return;if(only&&!only.includes(k))return;
   window.__fp[k].forEach(re=>{const m=re.exec(txt);if(m)out.push(k+':'+m[0].trim()+' [..'+txt.slice(Math.max(0,m.index-50),m.index+m[0].length+10).replace(/\s+/g,' ')+'..]')})});return out};
  window.__mark=Math.random()});
 return p}
const visit=async(p,id,tab)=>{await p.evaluate(([id,tab])=>{if(tab!=null)S.pp2.tab[id]=tab;go(id)},[id,tab]).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(110)};
const p=await open();const mark=await p.evaluate(()=>window.__mark);
const tenants=await p.evaluate(()=>DATA.tenants().map(t=>t.id));const nonCore=tenants.filter(t=>t!=='core');
const screens=await p.evaluate(()=>DATA.screens());
const aware=screens.filter(s=>s.mode!=='core').map(s=>s.id),legacy=screens.filter(s=>s.mode==='core').map(s=>s.id);
console.log('tenants',tenants.join(','),'| tenant-aware screens',aware.length,'| legacy screens',legacy.length);
let checks=0,legacyLabeled=0;const aliased=[];
for(const t of tenants){
 // 1. seamless switch onto t from Journey maps with a tab and a filter set
 await p.evaluate(()=>{S.pp2.tab.ppl_jrny=3;S.tn.q='a';go('ppl_jrny')});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>({scr:S.screen,tab:S.pp2.tab.ppl_jrny,q:S.tn.q}));
 const ok=await p.evaluate(t=>{TENANT.switch(t);return DATA.tenant()===t},t);await p.waitForTimeout(200);
 const after=await p.evaluate(()=>({scr:S.screen,tab:S.pp2.tab.ppl_jrny,q:S.tn.q,mark:window.__mark,btn:(document.getElementById('tnBtn')||{}).textContent||'',scn:SCN.cur,short:TENANT.short()}));
 if(!ok)fail(t+': switch refused');
 if(after.scr!==before.scr||after.tab!==before.tab||after.q!==before.q)fail(t+': user state not kept '+JSON.stringify([before,after]));
 if(after.mark!==mark)fail(t+': page reloaded');
 if(after.scn!==t)fail(t+': SCN out of step with DATA ('+after.scn+')');
 if(after.btn.indexOf(after.short)<0)fail(t+': active tenant not visible in the side menu ('+after.btn+')');
 // 2. tenant-aware screens, Journey maps on every tab
 for(const id of aware){const tabs=id==='ppl_jrny'?[0,1,2,3,4,5,6,7,8]:[null];
  for(const tab of tabs){const n0=errs.length;await visit(p,id,tab);checks++;
   const h=await p.evaluate(t=>window.__hits(window.__surface(),t),t);
   if(h.length)fail(t+' '+id+(tab!=null?' tab '+tab:'')+' shows another tenant: '+h.slice(0,4).join(' | '));
   if(errs.length>n0)fail(t+' '+id+' errors '+errs.slice(n0).join(' | ').slice(0,400))}}
 // 4. search
 const s=await p.evaluate(([t,nc])=>{const idx=searchIndex().filter(x=>!x.chooser);const txt=x=>[x.g,x.t,x.m,x.k].join(' ');
  const ind=[];let mer=0;idx.forEach(x=>{const tx=txt(x);window.__hits(tx,t,nc).forEach(h=>ind.push(h));if(t!=='core'&&window.__hits(tx,t,['core']).length)mer++});
  return{n:idx.length,ind:ind.slice(0,4),indN:ind.length,mer}},[t,nonCore]);
 if(s.indN)fail(t+' search shows another industry tenant ('+s.indN+'): '+s.ind.join(' | '));
 console.log(t,'| search entries',s.n,'| Meridian records in search (legacy, not failed)',s.mer);
}
// 3. legacy screens on a fresh page per tenant (some legacy screens add sample records when opened)
for(const t of ['core','health']){const q=await open();await q.evaluate(t=>TENANT.switch(t),t);await q.waitForTimeout(200);
 for(const id of legacy){const n0=errs.length;await visit(q,id,null);checks++;
  const r=await q.evaluate(([t,nc])=>({h:window.__hits(window.__surface(),t,nc),lab:!!document.querySelector('#view [data-tenant-legacy]'),alias:DATA.screenMode(S.screen)!=='core'?S.screen:null}),[t,nonCore]);
  if(r.h.length)fail(t+' '+id+' (legacy) shows another tenant: '+r.h.slice(0,4).join(' | '));
  if(t!=='core'){if(r.lab)legacyLabeled++;else if(r.alias){aliased.push(id+' -> '+r.alias)}else fail(t+' '+id+' legacy screen without the tenant label')} /* an old id that opens a tenant-aware screen (trace -> strat_exec) needs no label */
  if(errs.length>n0)fail(t+' '+id+' errors '+errs.slice(n0).join(' | ').slice(0,400))}
 await q.close()}
console.log('checks',checks,'| legacy screens labeled under health',legacyLabeled+'/'+legacy.length,'| aliases of tenant-aware screens',aliased.join(', ')||'none','| failures',bad,'| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();
