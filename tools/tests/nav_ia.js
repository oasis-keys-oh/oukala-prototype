// PH-14 navigation architecture test (docs/ia/navigation-architecture.md, migration steps 1 to 8; Omar approved 2026-10-20).
// Checks: the fixed area order; per persona the areas and role pins of section (b); every screen has exactly one place; every old
// group id, old group label, saved override, merged id, retired id and old favorite still resolves; the Build and admin gear rule;
// the menu budget (7 areas x 7 sub-groups x 7 entries); the renamed labels (decision 10); REG metadata on every screen (step 8);
// and that the build lint fails a new screen without an archetype or an R3 comparison.
// Usage: node tools/tests/nav_ia.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'../..');
const AREAS=['strat','deliver','ops','money','people','risk','transform'];
/* section (b), copied from the approved paper, not from the source */
const PV={
 ceo:[['strat','deliver','money','people','risk','transform'],['exe_board','r18_lens','exe_strat','exe_dash']],
 exec:[['strat','deliver','ops','money','risk','transform'],['bst','exe_dash','tower','r18_builds']],
 cfo:[['strat','deliver','money','risk'],['bst','inv','bud_over','exe_dash']],
 coo:[['strat','deliver','ops','people','risk','transform'],['exe_strat','strat_exec','ppl_jrny','orgdesign']],
 cco:[['strat','ops','money','people','transform'],['metrics','svc_req','org_chart','plat_proc']],
 chro:[['strat','people','transform'],['org_chart','ppl_perf','ppl_train','ppl_cap']],
 ciso:[['strat','ops','risk'],['grc_home','r15_iam','exe_risk','guard']],
 caio:[['strat','risk','transform'],['tower','r15d_agents','kcs_test','r17q_value']],
 clo:[['strat','money','risk'],['ppm_sow','grc_pol','grc_exc','bud_ven']],
 board:[['strat','risk'],['exe_board','r15d_evidence','exe_risk','exe_dash']],
 portfolio:[['strat','deliver','money','people','transform'],['port','ims','ppm_raid','ppl_cap']],
 audit:[['strat','money','risk'],['r15d_evidence','grc_home','bud_doa','exe_board']],
 pm:[['deliver','money','people'],['ppm_proj','ims','ppm_raid','r15_time']],
 ops:[['ops','people','risk'],['itsm_inc','itsm_mi','svc_oncall','kcs_home']],
 dist:[['deliver','ops','transform'],['svc_req','plat_proc','metrics','svc_guides']],
 fac:[['ops','money','transform'],['svc_req','plat_proc','metrics','bud_ven']],
 scm:[['ops','money','transform'],['bud_ven','r15_p2p','ppm_sow','plat_proc']],
 plant:[['deliver','ops','risk','transform'],['metrics','plat_proc','exe_mat','svc_req']],
 proc:[['ops','risk','transform'],['itsm_chg','plat_proc','metrics','svc_req']],
 change:[['deliver','ops','transform'],['itsm_chg','itsm_rel','dev_pipe','itom_run']],
 arch:[['deliver','ops','risk','transform'],['plat_map','plat_reg','plat_debt','itom_cmdb']],
 admin:[['ops','people','risk'],['adm_studio','r16g_perm','plat_reg','tn_admin']],
 fin:[['deliver','money'],['inv','bud_over','bud_req','bud_ven']],
 emp:[['people'],['svc_portal','kcs_ask','svc_guides','ppl_train']],
 newhire:[['people'],['r15d_firstweek','svc_portal','ppl_train','kcs_ask']],
 guest:[[],['svc_portal']]};
const OLD_GROUPS=['home','story','my','help','plan','fix','money','people','learn','make','kit','lens','strat','grc','res','ai','reg','tech','plat','new'];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const fails=[];const ok=(c,m)=>{if(!c)fails.push(m)};
/* ---- the lint fails a new screen without archetype or comparison, and passes it with both ---- */
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nav-ia-'));const bad=path.join(tmp,'mod_zz_navia.js'),good=path.join(tmp,'mod_zz_navia_ok.js');
fs.writeFileSync(bad,'(function(){REG("zz_navia","Probe","platform","",()=>"<div></div>");})();\n');
fs.writeFileSync(good,'(function(){REG("zz_navia","Probe","platform","",()=>"<div></div>",{archetype:"Report",compare:"exe_dash",menu:"search"});})();\n');
const lint=f=>spawnSync(process.execPath,[path.join(ROOT,'tools/lint/lint.js'),'--rule','screen-meta','--extra',f],{encoding:'utf8'});
const lb=lint(bad),lg=lint(good);
ok(lb.status===1&&/screen-meta/.test(lb.stdout),'lint fails a new screen without archetype or comparison (exit '+lb.status+')');
ok(lg.status===0,'lint passes a new screen that declares archetype and comparison (exit '+lg.status+'): '+lg.stdout.slice(-200));
fs.rmSync(tmp,{recursive:true,force:true});

const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(String(e)));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&window.NAVX&&NAVX.taxo&&NAVX.purview&&window.R15&&R15.setFamilies&&window.SHOW&&SHOW.wedge,null,{timeout:120000});await p.waitForTimeout(2000);
await p.evaluate(()=>{try{SHOW.wedge.set(false)}catch(e){}PREF.nav='simple'});

/* ---- model: area order, one place per screen, references, budget, metadata ---- */
const M=await p.evaluate(()=>{const c=NAVX.check();const t=NAVX.taxo.check();
 const ids=SCREENS.map(s=>s[0]);const meta=ids.filter(id=>{const m=REG.meta(id);return !(m.area&&m.archetype&&m.compare&&m.objective&&m.menu&&Array.isArray(m.personas)&&Array.isArray(m.objects))});
 const sp=NAVX.taxo.spaces();const per={};sp.forEach(s=>{const e=NAVX.taxo.entries(s.id,'admin');per[s.id]={subs:Object.keys(e).filter(k=>e[k].length).length,max:Math.max(0,...Object.values(e).map(a=>a.length))}});
 return {areas:NAVX.taxo.areas(),c:{notPlaced:c.notPlaced,duplicates:c.duplicates,unmapped:c.unmapped,orphans:c.orphans,badRef:c.badRef,over:c.over,placed:c.placed,screens:c.screens},
  fam:R15.families.filter(f=>!f.merge).length,merges:Object.keys(NAVX.taxo.merges()).length,meta,per,
  counts:{entries:t.entries,views:t.views,merged:t.merged,search:t.search,role:t.role,retire:t.retire}}});
ok(JSON.stringify(M.areas)===JSON.stringify(AREAS),'area order is fixed: '+M.areas.join(','));
ok(!M.c.notPlaced.length&&!M.c.duplicates.length&&!M.c.unmapped.length&&!M.c.orphans.length&&!M.c.badRef.length,'every screen has exactly one place: '+JSON.stringify(M.c));
ok(!M.c.over.length&&M.areas.length<=7,'menu budget 7 x 7 x 7: '+M.c.over.join('; '));
Object.keys(M.per).forEach(k=>ok(M.per[k].subs<=7&&M.per[k].max<=7,'budget in '+k+': '+JSON.stringify(M.per[k])));
ok(M.fam===36,'36 families (17 kept or changed, 19 new): '+M.fam);
ok(M.merges===10,'10 merges: '+M.merges);
ok(!M.meta.length,'REG metadata on every screen; missing: '+M.meta.join(', '));

/* ---- per persona: areas and pins match section (b), the rail shows no area outside them, at most 7, gear rule ---- */
for(const k of Object.keys(PV)){const r=await p.evaluate(async k=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));NAVX.persona.set(k);await wait(250);
  const P=NAVX.purview(k);const nav=document.getElementById('nav');
  const sps=[...nav.querySelectorAll(':scope > details[data-nx-sp]')].map(d=>d.dataset.nxSp);
  return {areas:P.areas,pins:P.pins,rail:sps,gear:!!nav.querySelector('details.nx-gear'),all:!!nav.querySelector('[data-nx-all]'),show:!!nav.querySelector('[data-nx-it="showroom"]'),
   ask:[...nav.querySelectorAll('details[data-nx-sp="ask"] [data-nx-it]')].map(x=>x.dataset.nxIt),ro:!!P.readonly}},k);
 const [areas,pins]=PV[k];
 ok(JSON.stringify(r.areas)===JSON.stringify(areas),k+' areas '+r.areas.join(',')+' expected '+areas.join(','));
 ok(JSON.stringify(r.pins)===JSON.stringify(pins),k+' pins '+r.pins.join(',')+' expected '+pins.join(','));
 const railAreas=r.rail.filter(s=>AREAS.indexOf(s)>=0);
 ok(railAreas.every(a=>areas.indexOf(a)>=0)&&railAreas.length<=7,k+' rail areas inside the purview: '+railAreas.join(','));
 ok(JSON.stringify(railAreas)===JSON.stringify(AREAS.filter(a=>railAreas.indexOf(a)>=0)),k+' rail areas in the fixed order: '+railAreas.join(','));
 ok(r.gear===(k==='arch'||k==='admin'),k+' Build and admin gear shown: '+r.gear);
 ok(r.all===(k!=='guest')&&r.show===(k!=='guest'),k+' All screens '+r.all+', Showroom '+r.show);
 if(k==='board'||k==='audit')ok(r.ro&&r.ask.indexOf('svc_portal')<0,k+' is read only with no request forms: '+r.ask.join(','))}
await p.evaluate(()=>NAVX.persona.set('exec'));await p.waitForTimeout(300);

/* ---- All screens reaches Build and admin for a persona without the gear ---- */
const A=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('#nav [data-nx-all]').click();await wait(300);const pop=document.getElementById('nxAll');
 const o={open:!!pop&&pop.matches(':popover-open'),build:!!pop&&!!pop.querySelector('[data-nav="scr_map"]'),n:pop?pop.querySelectorAll('[data-nav]').length:0};try{pop.hidePopover()}catch(e){}return o});
ok(A.open&&A.build,'All screens opens and reaches the Screen map in Build and admin: '+JSON.stringify(A));

/* ---- old group ids, labels, saved overrides and hash links resolve ---- */
const O=await p.evaluate(async OG=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={bad:[]};
 OG.forEach(g=>{const sp=NAVX.resolveGroup(g);if(!sp)out.bad.push('group '+g);const a=NAVX.resolveAlias(g);if(!a)out.bad.push('alias '+g);if(!NAVX.groupLabel(g))out.bad.push('label '+g)});
 ['service and support','enterprise it','knowledge and learning','risk and control','platform admin','new and unsorted','my builds and access'].forEach(l=>{if(!NAVX.resolveAlias(l))out.bad.push('old label '+l)});
 NAVX.setOverride('svc_cat',{g:'fix'});out.ovr=NAVX.resolve('svc_cat').g;NAVX.setOverride('svc_cat',{g:'kit'});out.ovr2=NAVX.resolve('svc_cat').g;NAVX.setOverride('svc_cat',null);out.back=NAVX.resolve('svc_cat').g;
 location.hash='#fix';await wait(400);out.hash=S.screen;location.hash='#home';await wait(300);return out},OLD_GROUPS);
ok(!O.bad.length,'old group ids and labels resolve: '+O.bad.join(', '));
ok(O.ovr==='ops'&&O.ovr2==='build'&&O.back==='ops','a saved override with an old group id resolves to its area: '+JSON.stringify(O));
ok(O.hash==='itsm_home','old group hash #fix opens the area landing screen: '+O.hash);

/* ---- merged ids, retired ids, family views and an old favorite open the right view ---- */
const R=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const bad=[];const M=NAVX.taxo.merges();
 for(const old of Object.keys(M)){const m=M[old];go(old);await wait(250);
  if(m.tab){const k=m.tab.indexOf(':');if(S.screen!==m.to||String(S.v[m.tab.slice(0,k)])!==m.tab.slice(k+1))bad.push(old+' -> '+S.screen+' tab '+S.v[m.tab.slice(0,k)])}
  else{const f=R15.famOf[old];const sw=[...document.querySelectorAll('#view .r15-fam [data-nav]')].map(x=>x.dataset.nav);
   if(S.screen!==old||!f||sw.indexOf(m.to)<0&&f.id!==m.to&&!(R15.famOf[m.to]&&R15.famOf[m.to]===f))bad.push(old+' opens '+S.screen+' switcher '+sw.join(','))}}
 for(const [old,to] of [['trace','strat_exec'],['plat_data_old','plat_data']]){go(old);await wait(250);if(S.screen!==to)bad.push(old+' -> '+S.screen)}
 for(const f of R15.families){for(const v of f.views){if(v[0]===f.id)continue;go(v[0]);await wait(60);const sw=[...document.querySelectorAll('#view .r15-fam [data-nav]')].map(x=>x.dataset.nav);if(S.screen!==v[0]||sw.indexOf(f.id)<0)bad.push('view '+v[0]+' of '+f.id)}}
 NAVX.open({id:'screen:itom_dev',kind:'screen',key:'itom_dev',title:'Delivery speed'},'fav');await wait(300);if(S.screen!=='dev_pipe')bad.push('favorite itom_dev -> '+S.screen);
 go('home');return bad});
ok(!R.length,'merged, retired and family view ids open the right view: '+R.slice(0,8).join('; '));

/* ---- decision 10: the renamed labels ---- */
const L=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const tabs=()=>[...document.querySelectorAll('#view .views .vsw > label,#view [role=tab]')].map(x=>x.textContent.trim());
 go('itom_disc');await wait(400);const a=tabs();go('ims');await wait(400);const b=tabs();go('adm_audit');await wait(400);const t=document.getElementById('view').innerText;go('home');
 return {disc:a,ims:b,audit:/tracks against SOC 2/.test(t),plan:/plan, not a claim/.test(t),labels:['r18_builds','inv','itsm_inc','bud_over','ppm_proj','scr_map'].map(id=>NAVX.label(id))}});
ok(L.disc.indexOf('Uptime monitor import')>=0&&!L.disc.some(x=>/SolarWinds/.test(x)),'itom_disc tab renamed: '+L.disc.join(', '));
ok(L.ims.indexOf('Project tool coverage')>=0&&!L.ims.some(x=>/Project Online/.test(x)),'ims tab renamed: '+L.ims.join(', '));
ok(!L.audit&&L.plan,'adm_audit certification line reworded');
ok(JSON.stringify(L.labels)===JSON.stringify(['Build list','Approve invoices','Fix what is broken','Budgets','Projects','Screen map']),'labels: nouns for object homes, verbs for tasks: '+L.labels.join(' | '));

/* ---- wedge mode stays exactly the ten COO screens on top of the COO purview ---- */
const W=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));NAVX.persona.set('coo');SHOW.wedge.set(true);go('home');await wait(600);
 const vis=[...new Set([...document.querySelectorAll('#nav [data-nx-it]')].filter(x=>!x.hidden&&x.offsetParent!==null).map(x=>x.dataset.nxIt))];const w=SHOW.wedge.screens();
 SHOW.wedge.set(false);NAVX.persona.set('exec');await wait(300);return {n:w.length,missing:w.filter(i=>vis.indexOf(i)<0),extra:vis.filter(i=>w.indexOf(i)<0)}});
ok(W.n===10&&!W.missing.length&&!W.extra.length,'COO wedge mode shows exactly the ten wedge screens: '+JSON.stringify(W));

ok(!errs.length,'no page errors: '+errs.slice(0,3).join(' | '));
await b.close();
console.log('nav_ia: areas',M.areas.length,'| screens',M.c.screens,'| entries',M.counts.entries,'views',M.counts.views,'merged',M.counts.merged,'search',M.counts.search,'role',M.counts.role,'retire',M.counts.retire,'| families',M.fam,'| merges',M.merges,'| personas',Object.keys(PV).length);
if(fails.length){console.log('nav_ia FAIL');fails.forEach(f=>console.log(' - '+f));process.exit(1)}
console.log('nav_ia ok');process.exit(0)})();
