// Guardrail tests (stream guard): one approval routing source (PR-20), plus the checks added by DC-18 to DC-21, CL-67 and CL-71.
// Usage: node tools/tests/guard.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const fails=[];
/* ---- CL-71 (R30, R52): no certification or "bank-grade" claim in the built JS outside an explicit plan sentence ----
   A claim is "bank-grade" anywhere, or SOC 2 said of this product (its name, "our", "we", "the platform") or as "SOC 2 certified/compliant".
   Every other SOC 2 mention must be third-party evidence (a vendor's report, a framework label on the fictional customer's controls)
   or sit in a plan sentence; anything else fails too. */
const js=fs.readFileSync(path.join(dir,'full.html'),'utf8');
const PLAN=/\b(plan|plans|planned|planning|intend|intends|roadmap|not (yet )?(certified|claimed|attested)|no SOC 2|until it is true)\b/i;
const OWNCLAIM=/(Falconaire|Oukala|our platform|the platform|\bwe are\b|\bwe're\b|\bour\b)[^.]{0,60}(SOC ?2|bank[- ]grade)|SOC ?2[- ](certified|compliant|attested)|bank[- ]grade/i;
const THIRD=/SOC ?2 Type I{1,2}|SOC 2 (report|examination|testing|coverage|and DR|and ISO)|SOC 2[":,)]|SOC 2: |\(SOC 2|across SOC 2|soc ?2[ ,"]|fw:"SOC 2|"SOC 2"/i;
function sentenceAt(t,i){let s=i,e=i;while(s>0&&!/[.!?\n"`]/.test(t[s-1])&&i-s<240)s--;while(e<t.length&&!/[.!?\n"`]/.test(t[e])&&e-i<240)e++;return t.slice(s,e+1)}
function judge(t,i,len){const sent=sentenceAt(t,i);const near=t.slice(Math.max(0,i-12),i+len+24);
 if(PLAN.test(sent))return null;if(OWNCLAIM.test(sent))return sent.trim();if(THIRD.test(near))return null;return sent.trim()}
const RE=/(SOC ?2|bank[- ]grade)/gi;let m;const bad=[];
while((m=RE.exec(js))){const v=judge(js,m.index,m[0].length);if(v)bad.push(v.slice(0,120))}
const self=t=>{const x=/(SOC ?2|bank[- ]grade)/i.exec(t);return x?judge(t,x.index,x[0].length):null};
if(!self('Falconaire is SOC 2 certified.')||!self('Our security is bank-grade.')||!self('We are SOC 2 compliant.')||self('Certifications such as SOC 2 are a plan, not a claim.')||self('Ask the vendor for its SOC 2 Type II report.'))fails.push('CL-71 rule self-test failed');
if(bad.length)fails.push('CL-71 certification claim outside a plan sentence: '+bad.slice(0,3).join(' | '));
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await (await b.newContext()).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.APG&&APG.route&&window.BUDREQ&&window.ITSMX&&window.REQREG&&window.INBOX&&INBOX.adapters&&INBOX.adapters.budreq&&window.AGENTRT&&AGENTRT.registry().length,null,{timeout:60000});
await p.waitForTimeout(3500);
const r=await p.evaluate(()=>{const f=[];const ok=(c,m)=>{if(!c)f.push(m)};
 /* ---- PR-20: one source; both APIs are adapters over it ---- */
 const fin=APG.route("budget_request",{stage:"fin",amount:20000});ok(fin&&fin.id==="apg_fin","PR-20 budget fin stage routes to apg_fin");
 ok(PERM.approverOf.budget_request({stage:"fin",amount:20000})==="GRP-FINREV","PR-20 PERM.approverOf is an adapter over APG.route (budget)");
 ok(APG.route("change_request",{role:"Finance"}).id==="apg_fin"&&APG.route("change_request",{}).id==="apg_cab","PR-20 change routes by stage role, else CAB");
 ok(PERM.approverOf.change_request({})==="GRP-CAB","PR-20 PERM adapter (change)");
 ok(APG.route("catalog",{requester:"Maya Ortiz"}).id==="apg_line","PR-20 catalog routes to line management");
 ok(PERM.approverOf.approval({kind:"catalog",requester:"Maya Ortiz"})==="GRP-GEN","PR-20 PERM adapter (catalog)");
 /* requester can never approve own request, on all three */
 ok(APG.check("Avery Chen","budget_request",{requester:"Avery Chen",stage:"fin"}).rule==="sod","PR-20 budget: own request refused");
 ok(APG.check("Nia Brooks","change_request",{requester:"Nia Brooks"}).rule==="sod","PR-20 change: own change refused");
 ok(APG.check("Casey Rowan","catalog",{requester:"Casey Rowan"}).rule==="sod","PR-20 catalog: own request refused");
 /* group binding: a non-member is refused, a member is allowed */
 ok(APG.check("Tom Becker","budget_request",{requester:"Priya Shah",stage:"fin",amount:20000}).rule==="group","PR-20 budget: non-member refused");
 ok(APG.check("Victor Amaya","budget_request",{requester:"Priya Shah",stage:"fin",amount:20000}).ok,"PR-20 budget: member allowed");
 ok(APG.check("Avery Chen","change_request",{requester:"Tom Becker"}).rule==="group"&&APG.check("Nia Brooks","change_request",{requester:"Tom Becker"}).ok,"PR-20 change: binding");
 const lm=APG.route("catalog",{requester:"Maya Ortiz"}).members;ok(lm.length&&APG.check(lm[0],"catalog",{requester:"Maya Ortiz"}).ok&&APG.check("Nobody Person","catalog",{requester:"Maya Ortiz"}).rule==="group","PR-20 catalog: binding");
 /* the real decision paths refuse */
 const br=BUDREQ.requests().find(q=>q.st==="fin");if(br){const own=BUDREQ.decide(br.id,"Approve","",br.req);ok(own&&own.ok===false,"PR-20 BUDREQ.decide refuses the requester");
  PERM.enforceOn(false);const out=BUDREQ.decide(br.id,"Approve","","Nobody Person");PERM.enforceOn(true);ok(out&&out.ok===false&&out.rule==="group","PR-20 BUDREQ.decide refuses a non-member even with permission enforcement off")}
 ok(PERM.can("fin","approve","budget_request",{requester:"Avery Chen",stage:"fin",amount:5000}).ok===false,"PR-20 PERM.can refuses own budget request");
 const ad=INBOX.adapters.chg;const c=ITSMX.changes.find(x=>x.req&&(x.stages||[]).some(s=>(s.ap||[]).some(a=>a.dec==="pending")));
 if(ad&&c){let si=-1,ai=-1;c.stages.forEach((s,i)=>(s.ap||[]).forEach((a,j)=>{if(si<0&&a.dec==="pending"){si=i;ai=j}}));
  const prev=window.INBOX.me;const res=PERM.as(c.req,()=>{INBOX.me=()=>c.req;try{return ad.approve({sid:c.id,sx:si,ax:ai,req:c.req},"test")}finally{INBOX.me=prev}});ok(res&&res.ok===false,"PR-20 change inbox adapter refuses the requester")}
 ok(APG.denials().length>0,"PR-20 refusals are recorded");
 /* ---- CL-67: tenant id on every agent run, per-tenant retrieval, memory and log ---- */
 const RT=window.AGENTRT;const ag=RT&&RT.registry().map(x=>x.name)[0];ok(!!ag,"CL-67 agent registry present");
 if(ag){const prev=DATA.tenant();const a=RT.execute({agent:ag,goal:"guard test core",input:{t:1},step:"guard test"});
  DATA.setTenant("zz_guard");const b2=RT.execute({agent:ag,goal:"guard test other tenant",input:{t:2},step:"guard test"});
  const runsB=RT.runs();ok(runsB.length>=1&&runsB.every(x=>x.tenant==="zz_guard"),"CL-67 runs are read per tenant");
  ok(RT.scope("zz_guard").log.some(e=>e.run===b2.runId)&&!RT.scope("zz_guard").log.some(e=>e.run===a.runId),"CL-67 log is scoped per tenant");
  DATA.setTenant(prev);ok(!RT.runs().some(x=>x.id===b2.runId),"CL-67 other tenant's run is not visible");
  ok(RT.runs(null,{tenant:"*"}).every(x=>!x.tenant||typeof x.tenant==="string"),"CL-67 tenant field on run records");
  ok(RT.runs(null,{tenant:"*"}).filter(x=>x.id===a.runId||x.id===b2.runId).every(x=>x.tenant&&x.gateway),"CL-67 tenant and gateway on new runs");
  ok(RT.leakCheck().ok,"CL-67 leak check: "+RT.leakCheck().bad.slice(0,2).join(", "))}
 /* ---- DC-18: the register is an inventory true to the code ---- */
 const rails=GUARD.rails();const fams=new Set(rails.map(x=>x.fam));ok(rails.length>=12&&fams.size>=12,"DC-18 at least 12 families ("+fams.size+")");
 ["perm","apg","sod","doa","cap","tier","abud","conf","kill","gate","cls","ten","aud"].forEach(k=>ok(fams.has(k),"DC-18 family "+k));
 ok(rails.every(x=>["enforced","partial","documented"].includes(x.status)),"DC-18 status vocabulary");
 ok(rails.every(x=>x.owner&&x.backup&&x.owner!==x.backup),"DC-18 owner and different backup on every row");
 ok(rails.every(x=>x.found),"DC-18 every check is found in the page: "+rails.filter(x=>!x.found).map(x=>x.id).join(","));
 ok(rails.every(x=>SCREENS.some(s=>s[0]===x.scr)),"DC-18 every row links to a registered screen: "+rails.filter(x=>!SCREENS.some(s=>s[0]===x.scr)).map(x=>x.id+">"+x.scr).join(","));
 const byId=Object.fromEntries(rails.map(x=>[x.id,x]));
 /* the rows that claim guard.js are exercised here against the real check functions */
 if(ag){const reg=STORE.get("agent_registry",ag);
  AGENTRT.setControl("global","all",true,"kill","guard test");const k=AGENTRT.execute({agent:ag,goal:"kill switch test",step:"guard test"});AGENTRT.setControl("global","all",false);
  ok(k.blocked&&k.by==="control","GR-17 kill switch blocks the run");
  const cap=reg.budget_cap;STORE.patch("agent_registry",ag,{budget_cap:0});const bu=AGENTRT.execute({agent:ag,goal:"budget test",step:"guard test"});STORE.patch("agent_registry",ag,{budget_cap:cap});
  ok(bu.blocked&&bu.by==="budget","GR-14 daily cap blocks the run");
  const act=AGENTRT.registry().find(x=>x.lifecycle==="active");if(act){const lo=AGENTRT.execute({agent:act.name,goal:"floor test",step:"guard test",conf:99});ok(lo.ok&&(lo.escalated||lo.needsApproval),"GR-15 below the floor a person decides")}
  const t2=AGENTRT.registry().find(x=>x.lifecycle==="active"&&x.tier===2);if(t2){const r2=AGENTRT.execute({agent:t2.name,goal:"tier test",step:"guard test"});ok(r2.ok?r2.needsApproval:r2.blocked,"GR-12 tier 2 waits for the sponsor")}}
 ok(byId["GR-01"].status==="enforced"&&PERM.enforceOn()===true,"GR-01 permission enforcement is on");
 ok(byId["GR-26"].status==="documented","GR-26 AI gateway is documented only (no model is called)");
 go("guard");const gv=document.getElementById("view").textContent;ok(/Guardrail register/.test(gv)&&!/undefined|NaN/.test(gv),"DC-18 screen renders without undefined");
 ok(/simulated/i.test(gv)&&/BR-08/.test(gv)&&/isolation is simulated/i.test(gv),"DC-18 / CL-71 honesty labels on the screen");
 /* ---- DC-19: stage by family matrix ---- */
 const M=GUARD.matrix();ok(M.length===GUARD.families().length&&M.every(m=>m.cells.length===GUARD.stages().length),"DC-19 matrix covers every family and stage");
 ok(M.every(m=>m.cells.every(c=>c.ids.every(id=>byId[id].fam===m.fam&&byId[id].stages.includes(c.stage)))),"DC-19 cells hold only their family's rows at that stage");
 S.v.sguard=1;go("guard");ok(document.querySelectorAll("#view .gd-mx [data-gd-cell]").length>0,"DC-19 matrix cells render");
 ok(!/Not available\./.test(document.getElementById("view").textContent),"every guard tab renders (no failed tab)");
 document.querySelector("#view .gd-mx [data-gd-cell]").click();ok(S.v.sguard===0&&S.sguard.stage,"DC-19 a cell filters the register");S.sguard.fam=S.sguard.stage="";
 /* ---- DC-20: try to break it: real checks, audited, all refused, nothing left changed ---- */

 const tries=GUARD.tries();ok(["budget","confidence","restricted","own","kill"].every(id=>tries.some(t=>t.id===id)),"DC-20 five attempts");
 const res=tries.map(t=>GUARD.attempt(t.id));res.forEach(x=>ok(x&&x.refused&&!x.na,"DC-20 "+(x&&x.id)+" is refused: "+(x&&x.why)));
 ok(res.every(x=>x.sim),"DC-20 attempts are labeled simulated");
 ok(AUDIT.slice(0,60).filter(a=>/^Guardrail test/.test(a.a)).length>=5,"DC-20 each attempt writes an audit entry");
 ok(!STORE.all("agent_control").some(c=>c.scope==="global"&&c.paused),"DC-20 kill switch is back off");
 if(ag)ok(STORE.get("agent_registry",AGENTRT.registry().find(x=>x.lifecycle==="active")?AGENTRT.registry().find(x=>x.lifecycle==="active").name:ag).budget_cap>0,"DC-20 budget cap restored");
 S.v.sguard=2;go("guard");ok(/Refused/.test(document.getElementById("view").textContent),"DC-20 results show on the screen");
 /* ---- DC-21: guided views per act, beat-ready, deep-linkable ---- */
 const ch=GUARD.children();ok(ch.length>=5,"DC-21 at least five guided views");
 ch.forEach(c=>{ok(c.point.split(/\s+/).length<=12,"DC-21 "+c.id+" point is 12 words or fewer");ok(c.say.length===2,"DC-21 "+c.id+" has exactly two sentences");
  ok(c.secs>=120&&c.secs<=180,"DC-21 "+c.id+" runs 2 to 3 minutes");ok(c.do&&c.claims.length&&c.act,"DC-21 "+c.id+" has an act, an interaction and claim chips");
  ok(c.rails.every(id=>byId[id]),"DC-21 "+c.id+" rails exist");ok(c.steps.every(s=>s.tryit?tries.some(t=>t.id===s.tryit):SCREENS.some(x=>x[0]===s.link)),"DC-21 "+c.id+" steps resolve");
  ok(!/—/.test(JSON.stringify(c)),"DC-21 "+c.id+" has no em dash")});
 GUARD.child("deliver");ok(S.screen==="guard"&&document.querySelector("#view .gd-child")&&/Agents work inside a box/.test(document.getElementById("view").textContent),"DC-21 GUARD.child opens the view");
 document.querySelector("#view .gd-child [data-gd-child]").click();ok(!document.querySelector("#view .gd-child"),"DC-21 the view closes");
 go("guard","fund");ok(document.querySelector("#view .gd-child"),"DC-21 go(guard, id) opens the view");S.sguard.child="";
 go("ai_runtime");const v=document.getElementById("view").textContent;ok(/only through the AI gateway/.test(v)&&/isolation is simulated|isolation: simulated/i.test(v),"CL-67 gateway and simulated-isolation note on the agent runtime");
 /* ---- CL-71: guardrail and agent screens that mention tenants say isolation is simulated ---- */
 [["guard",/isolation is simulated/i],["ai_runtime",/isolation[^.]{0,40}simulated/i],["r16h_rules",/tenant isolation is simulated/i]].forEach(([id,re])=>{go(id);ok(re.test(document.getElementById("view").textContent),"CL-71 "+id+" labels tenant isolation as simulated")});
 return f});
fails.push(...r);
/* DC-21 deep link: ?guardchild=<id> opens the guided view on load */
const p2=await (await b.newContext()).newPage();p2.on('pageerror',e=>errs.push(String(e)));await p2.route(/^https?:/,x=>x.abort());
await p2.goto('file://'+dir+'/full.html?guardchild=tenant',{waitUntil:'domcontentloaded',timeout:120000});
const dl=await p2.waitForFunction(()=>S.screen==="guard"&&S.sguard&&S.sguard.child==="tenant"&&!!document.querySelector("#view .gd-child"),null,{timeout:30000}).then(()=>true,()=>false);
if(!dl)fails.push('DC-21 deep link ?guardchild=tenant does not open the guided view');
if(errs.length)fails.push('page errors: '+errs.slice(0,3).join(' | '));
console.log('guard',fails.length?'FAIL\n - '+fails.join('\n - '):'ok');await b.close();process.exit(fails.length?1:0)})();
