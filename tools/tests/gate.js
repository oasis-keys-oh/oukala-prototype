// Stream gate tests (wave 4): the Feature contract foundation checks ct_reuse, ct_tenant and ct_people (CL-59) and hidden
// unreachable screens (CL-41). Usage: node tools/tests/gate.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const fails=[];
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.CONTRACT&&CONTRACT.foundation&&window.GATE&&GATE.CHECKS&&window.HIDE&&window.SRCFACTS&&typeof go==='function',null,{timeout:120000});
await p.waitForTimeout(3000);
const r=await p.evaluate(async()=>{const f=[];const ok=(c,m)=>{if(!c)f.push(m)};const wait=ms=>new Promise(r=>setTimeout(r,ms));
 /* ---- CL-59: three checks, in the gate, blocking from the team tier up ---- */
 ok(CONTRACT.foundationRules.map(r=>r.chk).join()==="ct_reuse,ct_tenant,ct_people","three foundation checks");
 const ch=GATE.CHECKS.filter(c=>/^ct_(reuse|tenant|people)$/.test(c.id));ok(ch.length===3&&ch.every(c=>c.t==="team"),"gate has ct_reuse, ct_tenant, ct_people at the team tier");
 const team=GATE.apps().find(a=>a.tier==="team"&&a.status==="review"&&!a.contract);
 if(team){const d=GATE.decide(team.id);ok(!d.pass&&d.blockers.some(x=>/^ct_(reuse|tenant|people)$/.test(x.id)),"a team-tier app without foundation evidence is blocked by a ct_ check ("+team.id+")")}else f.push("no team-tier app in review to test");
 const pers=GATE.apps().find(a=>a.tier==="personal"&&a.status==="sandbox");
 if(pers){const d=GATE.decide(pers.id);ok(!d.blockers.some(x=>/^ct_(reuse|tenant|people)$/.test(x.id)),"ct_ checks are advice only on the personal tier")}
 const good=GATE.decide("ca_comments");ok(good.pass,"ca_comments (team, declares its foundation) still promotes: "+good.why.join(" | "));
 /* screens: every registered screen is scored; declaring flips ct_reuse */
 const mx=CONTRACT.foundationMatrix().filter(x=>x.kind==="screen");ok(mx.length===SCREENS.length,"retrofit matrix scores every screen ("+mx.length+" of "+SCREENS.length+")");
 ok(mx.every(x=>x.rules.length===3&&x.rules.every(r=>["pass","partial","gap","waived"].includes(r.st)&&r.ev)),"every screen has three scored checks with evidence");
 ok(mx.every(x=>x.blocks===false),"existing screens are reported, not blocked (decision 7)");
 const before=CONTRACT.foundation("ims").by.reuse.st;let threw=false;try{CONTRACT.declare("ims",{archetype:"Bespoke page"})}catch(e){threw=true}ok(threw,"an unknown archetype is refused");
 CONTRACT.declare("ims",{archetype:"Dashboard-first list",compared:["itsm_inc"]});ok(before!=="pass"&&CONTRACT.foundation("ims").by.reuse.st==="pass","declaring archetype and comparison makes ct_reuse pass on ims");
 const tn=DATA.screens().find(s=>s.mode==="data");if(tn)ok(CONTRACT.foundation(tn.id).by.tenant.st==="pass","a DATA-mode screen passes ct_tenant ("+tn.id+")");
 const core=SCREENS.map(s=>s[0]).find(id=>DATA.screenMode(id)==="core"&&SRCFACTS.files[SRCFACTS.screens[id]]&&!SRCFACTS.files[SRCFACTS.screens[id]].dget);if(core)ok(CONTRACT.foundation(core).by.tenant.st==="gap","a core-only screen is a ct_tenant gap ("+core+")");
 /* manifests and drafts */
 const dr=CONTRACT.foundation(CONTRACT.fromDraft({name:"x",data:{},proc:{steps:[{n:"a",who:"human"},{n:"b",who:"robot"}]},conns:[],sec:{}}));ok(dr.pass,"a Build a module draft starts on the foundation and passes");
 const bad=CONTRACT.foundation(CONTRACT.fromDraft({name:"x",data:{},proc:{steps:[{n:"a",who:"auto"}]},conns:[],sec:{}}));ok(bad.by.people.st!=="pass","a draft with a retired step kind fails ct_people");
 const mcp=CONTRACT.runTool({feature_id:"ims"});ok(Array.isArray(mcp.foundation)&&mcp.foundation.length===3,"MCP run_feature_contract reports the three foundation checks");
 /* the screen */
 go("plat_retrofit");await wait(400);ok(S.screen==="plat_retrofit"&&/Retrofit matrix/.test(document.querySelector("#view").textContent),"plat_retrofit renders");
 ok(/no compliance date/i.test(document.querySelector("#view").textContent),"the screen says no compliance date is set");
 const row=document.querySelector('#view [data-bt-row]');if(row){row.click();await wait(400);ok(/Foundation checks/.test((document.getElementById("drawer")||document.body).textContent),"a row opens the feature page with foundation checks")}else f.push("no matrix rows");
 const dc=document.querySelector("[data-ct-decl]");if(dc){dc.click();await wait(400);ok(!!document.querySelector('[data-k="archetype"],select[name="archetype"]')||/Declare archetype/.test(document.body.textContent),"Declare opens the archetype form")}
 try{closeDrawer()}catch(e){}
 /* ---- CL-41: unreachable screens are hidden, never deleted ---- */
 ok(HIDE.LIST.length>0,"the reachability list is applied");
 for(const x of HIDE.LIST){const id=x.id;
  ok(SCREENS.some(s=>s[0]===id),id+" is still registered (never deleted)");
  ok(SRCH.hiddenScreen(id),id+" is hidden from search");
  const m=NAVX.map[id];ok(!m||m.g==="r15hid",id+" is not in a visible menu group");
  SRCH.setBuilder(false);const res=NAVX.search?NAVX.search(SCREENS.find(s=>s[0]===id)[1],{limit:40}):null;if(res&&res.results)ok(!res.results.some(q=>q.sid===id),id+" is not listed by the global search");
  go(id);await wait(200);ok(S.screen===id&&document.querySelector("#view").textContent.trim().length>20,id+" still opens by id");
  HIDE.unhide(id);ok(!SRCH.hiddenScreen(id),id+" can be unhidden");HIDE.hide(id);ok(SRCH.hiddenScreen(id),id+" can be hidden again")}
 S.v.adm_env=4;go("adm_env");await wait(400);ok(/Hidden screens/.test(document.querySelector("#view").textContent)&&!!document.querySelector("[data-adm-hide]"),"Administration lists hidden screens with an unhide control");
 return f});
fails.push(...r);if(errs.length)fails.push('page errors: '+errs.slice(0,3).join(' / '));
console.log('gate',fails.length?'FAIL\n - '+fails.join('\n - '):'ok');await b.close();process.exit(fails.length?1:0)})();
