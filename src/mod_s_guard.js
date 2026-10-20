/* ===== mod_s_guard: Guardrail register (DC-18), stage-by-family matrix (DC-19), "Try to break it" playground (DC-20),
   guided guardrail views per act (DC-21). Screen "guard". API: window.GUARD (extends the IAM GUARD object, never replaces it):
   GUARD.rails() rows · GUARD.families() · GUARD.matrix() · GUARD.attempt(id) · GUARD.attempts() · GUARD.child(id) · GUARD.children().
   The register is an inventory of the code: every status is what the code does today (enforced, partial or documented only), and
   GUARD.verify() looks up each check function in the running page. Everything here runs in a database-free prototype: it is
   simulated, tenant isolation is simulated, and nothing is a security certification. Counsel review (BR-08) is required before
   any of it is used with a customer. Prefix: gd-. ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>W.U&&U.esc?U.esc(s):String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const GD=W.GUARD=W.GUARD||{};
const SELF="guard";
const chip=(n,rec,role)=>G(()=>ownerChip(n,{record:rec,role}),E(n));

/* ---------- families (DC-18: at least 12) ---------- */
const FAM=[
 {id:"perm",n:"Permissions",d:"Who may open, read, change or approve what."},
 {id:"apg",n:"Approval groups",d:"Approvals route to a group, never a person (R14)."},
 {id:"sod",n:"Segregation of duties",d:"The requester never approves their own request."},
 {id:"doa",n:"Delegation of authority",d:"The amount decides who may approve."},
 {id:"cap",n:"Budget caps",d:"Spend cannot pass the money that is free."},
 {id:"tier",n:"Agent tier",d:"What an agent may do without a person."},
 {id:"abud",n:"Agent budget",d:"A daily spend cap per agent."},
 {id:"conf",n:"Confidence floor",d:"Below the floor a person decides."},
 {id:"kill",n:"Kill switch",d:"Stop one agent, a tier or all agents."},
 {id:"gate",n:"Gate promotion",d:"Nothing is promoted past a failed gate."},
 {id:"cls",n:"Data classification",d:"Confidential is masked, restricted is hidden."},
 {id:"ten",n:"Tenant boundary",d:"One tenant never sees another's data (simulated isolation)."},
 {id:"aud",n:"Audit",d:"Every decision leaves a record."},
 {id:"own",n:"Owner and backup",d:"A named human owner and a different backup (R12)."},
 {id:"gw",n:"AI gateway",d:"Model calls go only through the gateway (simulated)."}];
const FAMBY=Object.fromEntries(FAM.map(f=>[f.id,f]));

/* ---------- process stages (DC-19 uses them) ---------- */
const STAGES=[
 {id:"request",n:"Request"},{id:"route",n:"Route"},{id:"approve",n:"Approve"},{id:"fund",n:"Fund"},
 {id:"run",n:"Build and run"},{id:"promote",n:"Promote"},{id:"operate",n:"Operate"},{id:"audit",n:"Audit"}];

/* ---------- the register: one row per guardrail, inventoried from the code ----------
   status: enforced (a code path refuses the action) · partial (refuses on some paths, or only flags) · documented (text only).
   test: which automated test covers it ("guard.js", "platform.js") or "none". probe: the check function in the running page. */
const R=(id,fam,rule,status,owner,backup,test,scr,file,fn,probe,stages,note)=>({id,fam,rule,status,owner,backup,test,scr,file,fn,probe,stages,note:note||""});
const RAILS=[
 R("GR-01","perm","Screens, sections and actions are deny by default for confidential and restricted data, and decided by one permission model.","enforced","Rina Okafor","Sam Patel","guard.js","r16g_perm","mod_r16g_a_perm.js, mod_r16g_b_enforce.js","PERM.can, PERM.require",()=>typeof PERM.can==="function"&&PERM.enforceOn()===true,["request","approve","operate"],"An administrator can switch enforcement off on the Permissions screen to simulate; every decision then reads allowed."),
 R("GR-02","perm","Role capabilities gate inbox, budget edit and access buttons.","enforced","Rina Okafor","Colette Brandt","none","r15_iam","mod_r15f3_iam.js","GUARD.can, GUARD.require",()=>typeof GD.can==="function",["approve","operate"]),
 R("GR-03","apg","Catalog, budget and change approvals resolve to one group model, and only a member of that group can decide.","partial","Casey Rowan","Rina Okafor","guard.js","r16h_groups","mod_r16h_c_groups.js (APG.route, APG.check)","APG.check",()=>typeof APG.check==="function"&&typeof APG.route==="function",["route","approve"],"Bound in the inbox adapters and inside BUDREQ.decide; screen buttons are bound when permission enforcement is on. The chat catalog approval path is not bound yet."),
 R("GR-04","apg","Every approval step names a group, never a person.","partial","Casey Rowan","Rina Okafor","none","r16h_groups","mod_r16h_c_groups.js (audit, migrate)","APG.audit",()=>typeof APG.audit==="function",["route"],"The gap check flags steps that still name a person; those route to the person's group until moved."),
 R("GR-05","sod","The requester can never approve their own catalog, budget or change request.","enforced","Rina Okafor","Avery Chen","guard.js","bud_req","mod_r16h_c_groups.js, mod_budget3.js (BUDREQ.decide), mod_itsm.js","APG.check, BUDREQ.decide",()=>typeof BUDREQ.decide==="function"&&typeof APG.check==="function",["approve"]),
 R("GR-06","sod","Segregation-of-duties checks on purchase orders and budget lines.","partial","Avery Chen","Victor Amaya","none","bud_doa","mod_budget.js (sodChecks)","sodChecks",()=>!!G(()=>_R.bud_doa,null),["approve","fund"],"Violations are listed; the purchase order approve control does not re-check them."),
 R("GR-07","sod","A break-glass approver cannot be the person who asked for access.","enforced","Rina Okafor","Sam Patel","none","adm_sec","mod_admin.js","break-glass approval",()=>!!G(()=>_R.adm_sec,null),["approve","operate"]),
 R("GR-08","doa","The amount decides the approver tier; a self-approval moves up one tier.","partial","Avery Chen","Marcus Reid","none","bud_doa","mod_budget.js (whoApproves)","DOA.approverFor",()=>typeof DOA.approverFor==="function",["route","approve"],"Routes and hides buttons; the reserve draw approve control does not re-check the tier."),
 R("GR-09","cap","A purchase order cannot pass the line's uncommitted amount, and a reforecast cannot pass the free reserve.","enforced","Avery Chen","Victor Amaya","none","bud_lines","mod_budget.js (PO and reforecast forms)","form checks",()=>!!G(()=>_R.bud_lines,null),["fund"]),
 R("GR-10","cap","Funding an approved budget request checks the reserve balance.","partial","Avery Chen","Casey Rowan","none","bud_req","mod_budget3.js (fund)","BUDREQ.decide",()=>typeof BUDREQ.decide==="function",["fund"],"The request page shows when the reserve is not enough; funding still posts the draw."),
 R("GR-11","cap","A funding gate move is refused when a hard check fails.","enforced","Avery Chen","Maya Ortiz","none","fin_gates","mod_plat_fin2.js (gateChecks)","gate checks",()=>!!G(()=>_R.fin_gates,null),["fund","promote"]),
 R("GR-12","tier","Tier 2 results wait for the sponsor; Tier 3 acts alone only above the confidence floor.","partial","Kenji Watanabe","Casey Rowan","guard.js","ai_runtime","mod_r15f1_c_agent.js (execute)","AGENTRT.execute",()=>typeof AGENTRT.execute==="function",["run"],"The run waits; the gate decision does not yet check that the decider is the sponsor."),
 R("GR-13","tier","An agent cannot be activated or run without a human sponsor and a different backup.","enforced","Kenji Watanabe","Theo Marlowe","none","ai_runtime","mod_r15f1_c_agent.js (setLifecycle, execute)","AGENTRT.setLifecycle",()=>typeof AGENTRT.setLifecycle==="function",["run","promote"]),
 R("GR-14","abud","A run is blocked when today's spend plus its cost would pass the agent's daily cap.","enforced","Kenji Watanabe","Avery Chen","guard.js","ai_runtime","mod_r15f1_c_agent.js (execute)","AGENTRT.execute",()=>typeof AGENTRT.execute==="function",["run"]),
 R("GR-15","conf","Below the confidence floor a run escalates to a person.","partial","Kenji Watanabe","Casey Rowan","guard.js","ai_runtime","mod_r15f1_c_agent.js, mod_r15f1_b_wf.js","AGENTRT.execute",()=>typeof AGENTRT.execute==="function",["run"],"Workflow steps hand the run to a person; other callers read the flag but do not stop."),
 R("GR-16","conf","An AI estimate shows the basis of its confidence.","documented","Kenji Watanabe","Jordan Lee","none","home","mod_r15d_ai.js (aiChip)","aiChip",()=>typeof W.aiChip==="function",["run","operate"],"Display only."),
 R("GR-17","kill","A global, tier or agent kill switch is checked before every agent run.","enforced","Kenji Watanabe","Casey Rowan","guard.js","ai_runtime","mod_r15f1_c_agent.js (setControl, execute)","AGENTRT.setControl",()=>typeof AGENTRT.setControl==="function",["run","operate"]),
 R("GR-18","kill","The kill switch on the AI Control Tower stops agents.","partial","Kenji Watanabe","Casey Rowan","none","tower","screens3.js (tower handler)","tower kill switch",()=>!!G(()=>_R.tower,null),["operate"],"It marks agents killed in the tower; it writes no runtime control record, so the runtime sees it only indirectly."),
 R("GR-19","gate","A citizen app is promoted only when its gate passes, including owner and backup.","enforced","Jordan Lee","Rina Okafor","none","plat_gate","mod_plat_gate.js (GATE.decide), mod_own.js","GATE.decide",()=>typeof G(()=>GATE.decide,null)==="function",["promote"]),
 R("GR-20","gate","A promotion cannot skip an environment or a missing gate.","enforced","Sam Patel","Jordan Lee","none","adm_env","mod_admin.js (promote)","environment promote",()=>!!G(()=>_R.adm_env,null),["promote"]),
 R("GR-21","cls","Confidential fields are masked and restricted fields are hidden by default.","partial","Rina Okafor","Jordan Lee","none","r16g_perm","mod_r16g_a_perm.js (fields), mod_r16g_b_enforce.js (masks)","PERM.fields",()=>typeof PERM.fields==="function",["operate"],"Masks apply to some drawer labels and table columns; a new entity can be registered without a classification."),
 R("GR-22","ten","A tenant never sees another tenant's rows; a missing pack shows empty and records a gap. Tenant isolation is simulated.","partial","Sam Patel","Jordan Lee","platform.js","home","platform.js (DATA.get)","DATA.get",()=>typeof DATA.get==="function",["request","operate"],"The data layer is tested; most screens still read sample globals. Isolation is simulated, not enforced by infrastructure."),
 R("GR-23","ten","An agent run, its retrieval, memory and log stay in one tenant. Tenant isolation is simulated.","enforced","Kenji Watanabe","Sam Patel","guard.js","ai_runtime","mod_r15f1_c_agent.js (scope, leakCheck)","AGENTRT.scope",()=>typeof AGENTRT.scope==="function",["run","audit"],"Enforced inside the simulated runtime only."),
 R("GR-24","aud","Every decision is written to the audit trail.","partial","Rina Okafor","Sam Patel","none","adm_audit","ui.js (audit), mod_r15f1_c_agent.js (eventLog), mod_r16g_a_perm.js (log)","audit",()=>typeof W.audit==="function",["approve","run","audit"],"The shared trail is kept in memory only; agent events and permission decisions are stored in the browser."),
 R("GR-25","own","Every record has a human owner and a different named backup.","partial","Casey Rowan","Maya Ortiz","none","own_gaps","mod_own.js (OWNX.assign)","OWNX.assign",()=>typeof G(()=>OWNX.assign,null)==="function",["request","promote","audit"],"Assignment refuses a missing or duplicate backup; the process library only warns."),
 R("GR-26","gw","Model calls go only through the AI gateway.","documented","Kenji Watanabe","Sam Patel","none","adm_gate","mod_admin.js (runGuards test panel)","runGuards",()=>!!G(()=>_R.adm_gate,null),["run"],"No model is called in this prototype; the gateway is simulated.")];
const STATUS={enforced:{l:"Enforced",c:"good",d:"A code path refuses the action."},partial:{l:"Partial",c:"warn",d:"Refuses on some paths, or only flags."},documented:{l:"Documented only",c:"bad",d:"Described, nothing refuses."}};
const RANK={enforced:3,partial:2,documented:1};
function verify(){return RAILS.map(r=>({id:r.id,found:!!G(()=>r.probe(),false)}))}
function rails(){const v=Object.fromEntries(verify().map(x=>[x.id,x.found]));return RAILS.map(r=>Object.assign({},r,{found:v[r.id],famName:FAMBY[r.fam].n}))}
Object.assign(GD,{rails,families:()=>FAM.slice(),stages:()=>STAGES.slice(),verify,STATUS});

/* ---------- screen pieces ---------- */
const S_=S.sguard=S.sguard||{fam:"",st:"",stage:""};
const pill=(t,c,title)=>`<span class="pill ${c||"mute"}"${title?` title="${E(title)}"`:""}>${E(t)}</span>`;
const simChip=()=>`<span class="pill info gd-sim" title="Behavior is scripted in the prototype. No live connection, run or enforcement outside this page.">Simulated</span>`;
function counts(rows){const c={enforced:0,partial:0,documented:0};rows.forEach(r=>c[r.status]++);return c}
function dashboard(rows){const c=counts(rows),fams=new Set(rows.map(r=>r.fam)).size,tested=rows.filter(r=>r.test!=="none").length,found=rows.filter(r=>r.found).length;
 const kp=(l,v,s,cls)=>`<div class="stat${cls?" "+cls:""}"><small>${E(l)}</small><span class="num">${E(v)}</span><em>${E(s)}</em></div>`;
 const att=rows.filter(r=>r.status!=="enforced").sort((a,b)=>RANK[a.status]-RANK[b.status]).slice(0,6);
 return `<div class="statrow">${kp("Guardrails in the register",rows.length,fams+" families · prototype fact")}${kp("Enforced in code",c.enforced,"a code path refuses · prototype fact")}${kp("Partial",c.partial,"some paths, or flags only",c.partial?"warn":"")}${kp("Documented only",c.documented,"nothing refuses yet",c.documented?"bad":"")}${kp("Covered by a test",tested,"of "+rows.length+" · prototype fact")}${kp("Check found in this page",found,"of "+rows.length+" looked up live")}</div>
 ${card("What needs attention","The weakest guardrails first. Each says what is missing in the code today.",`<ul class="gd-att">${att.map(r=>`<li>${pill(STATUS[r.status].l,STATUS[r.status].c)} <b>${E(r.id)}</b> ${E(r.rule)} <span class="muted small">${E(r.note)}</span> <button type="button" class="chip" data-link="screen:${E(r.scr)}">Open ${E(scrName(r.scr))}</button></li>`).join("")}</ul>`)}`}
const scrName=id=>G(()=>SCREENS.find(s=>s[0]===id)[1],id);
function registerTab(rows){const f=S_.fam,st=S_.st,sg=S_.stage;const L=rows.filter(r=>(!f||r.fam===f)&&(!st||r.status===st)&&(!sg||r.stages.indexOf(sg)>=0));
 const fbtn=(k,v,l,on)=>`<button type="button" class="chip" data-gd-f="${k}|${E(v)}" aria-pressed="${on}">${E(l)}</button>`;
 return card("Guardrail register","One row per guardrail found in the code. The status is what the code does today; the last column looks the check up in this page.",
 `<div class="gd-filt">${fbtn("fam","","All families",!f)}${FAM.map(x=>fbtn("fam",x.id,x.n,f===x.id)).join("")}</div>
 <div class="gd-filt">${fbtn("st","","Any status",!st)}${Object.keys(STATUS).map(k=>fbtn("st",k,STATUS[k].l,st===k)).join("")}${sg?fbtn("stage","","Stage: "+(STAGES.find(x=>x.id===sg)||{}).n+" (clear)",true):""}<span class="muted small">${L.length} of ${rows.length}</span></div>
 <div class="tscroll"><table class="gd-reg"><thead><tr><th>ID</th><th>Rule</th><th>Family</th><th>Enforcement</th><th>Owner</th><th>Test</th><th>Where it lives</th><th>Check</th></tr></thead><tbody>${L.map(r=>`<tr data-gd-row="${E(r.id)}"><td><b>${E(r.id)}</b></td><td>${E(r.rule)}${r.note?`<div class="muted small">${E(r.note)}</div>`:""}</td><td>${E(r.famName)}</td><td>${pill(STATUS[r.status].l,STATUS[r.status].c,STATUS[r.status].d)}</td><td>${chip(r.owner,"guardrail:"+r.id,"Owner")}<div class="muted small">Backup ${chip(r.backup,"guardrail:"+r.id,"Backup")}</div></td><td>${r.test==="none"?pill("No test","mute"):pill(r.test,"info","Automated test in tools/tests")}</td><td><button type="button" class="chip" data-link="screen:${E(r.scr)}">${E(scrName(r.scr))}</button><div class="muted small"><code>${E(r.file)}</code></div></td><td>${r.found?pill("Found: "+r.fn,"good"):pill("Not found","bad")}</td></tr>`).join("")||`<tr><td colspan="8" class="muted">Nothing matches these filters.</td></tr>`}</tbody></table></div>`)}
const TABS=[{l:"Register",h:rows=>registerTab(rows)}];
GD._tabs=TABS;

/* ---------- DC-19: process stage by guardrail family ----------
   A cell holds the guardrails of that family that act at that stage; its color is the strongest status among them.
   An empty cell is a stage the family does not guard. Select a cell to filter the register. */
function matrix(rows){rows=rows||rails();return FAM.map(f=>({fam:f.id,n:f.n,cells:STAGES.map(s=>{const L=rows.filter(r=>r.fam===f.id&&r.stages.indexOf(s.id)>=0);
 const best=L.reduce((a,r)=>RANK[r.status]>(RANK[a]||0)?r.status:a,"");return{stage:s.id,ids:L.map(r=>r.id),best}})}))}
function matrixTab(rows){const M=matrix(rows);const gaps=STAGES.filter(s=>M.every(m=>!m.cells.find(c=>c.stage===s.id).ids.length));
 const weak=STAGES.map(s=>({s,n:M.filter(m=>{const c=m.cells.find(x=>x.stage===s.id);return c.ids.length&&c.best!=="enforced"}).length}));
 return card("Stage by family","Rows are guardrail families, columns are the stages of a process. Each cell shows how strongly that family guards that stage today; select it to see the rows.",
 `<div class="tscroll"><table class="gd-mx"><thead><tr><th>Family</th>${STAGES.map(s=>`<th>${E(s.n)}</th>`).join("")}</tr></thead><tbody>${M.map(m=>`<tr><th scope="row">${E(m.n)}</th>${m.cells.map(c=>c.ids.length?`<td><button type="button" class="gd-cell ${STATUS[c.best].c}" data-gd-cell="${E(m.fam)}|${E(c.stage)}" title="${E(c.ids.join(", "))}" aria-label="${E(m.n+" at "+c.stage+": "+STATUS[c.best].l+", "+c.ids.length+" guardrails")}">${E(STATUS[c.best].l)}<small>${c.ids.length}</small></button></td>`:`<td><span class="gd-cell none">None</span></td>`).join("")}</tr>`).join("")}</tbody></table></div>
 <div class="row gd-legend">${Object.keys(STATUS).map(k=>`<span class="gd-cell ${STATUS[k].c} sm">${E(STATUS[k].l)}</span>`).join("")}<span class="gd-cell none sm">None: the family does not guard that stage</span></div>
 <p class="small muted">${gaps.length?"Stages with no guardrail at all: "+E(gaps.map(s=>s.n).join(", "))+". ":"Every stage has at least one guardrail. "}Stages with the most families short of enforced: ${E(weak.sort((a,b)=>b.n-a.n).slice(0,3).map(x=>x.s.n+" ("+x.n+")").join(", "))}. Prototype fact, read from the register.</p>`)}
TABS.push({l:"Stage matrix",h:rows=>matrixTab(rows)});
GD.matrix=()=>matrix();
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-gd-cell]");if(!t)return;const [f,s]=t.dataset.gdCell.split("|");S_.fam=f;S_.stage=s;S_.st="";S.v.sguard=0;render()});
function honesty(){return `<div class="gd-honest glass" role="note"><b>Read this first.</b> Everything on this screen runs in a database-free prototype and is simulated. Tenant isolation is simulated, not enforced by infrastructure. There is no security certification; certifications such as SOC 2 are a plan, not a claim. Counsel review (BR-08) is required before any of this is used with a customer. ${simChip()}</div>`}

/* ---------- DC-20: "Try to break it" ----------
   Each attempt calls the real check function (AGENTRT.execute, PERM.can, APG.check, AGENTRT.setControl), restores anything it
   changed, and writes an audit entry. All of it runs in the prototype and is labeled simulated. */
const AKEY="guard_attempts";
let LOG=G(()=>U.store.get(AKEY,[]),[])||[];
const activeAgent=()=>G(()=>{const L=AGENTRT.registry();return (L.find(r=>r.lifecycle==="active"&&r.tier===3)||L.find(r=>r.lifecycle==="active")||L[0]||{}).name},null);
const ATTEMPTS=[
 {id:"budget",n:"Run an agent past its daily budget",rail:"GR-14",fn:"AGENTRT.execute",run(){const ag=activeAgent();if(!ag)return{na:"No agent is registered yet"};const reg=STORE.get("agent_registry",ag);const cap=reg.budget_cap;
   let r;try{STORE.patch("agent_registry",ag,{budget_cap:0});r=AGENTRT.execute({agent:ag,goal:"Guardrail playground: over budget",step:"Try to break it",origin:"guard playground"})}finally{STORE.patch("agent_registry",ag,{budget_cap:cap})}
   return{refused:!!(r&&r.blocked&&r.by==="budget"),why:r&&(r.why||"Run completed"),ref:r&&r.runId,who:ag}}},
 {id:"confidence",n:"Act on an agent result below the confidence floor",rail:"GR-15",fn:"AGENTRT.execute",run(){const ag=activeAgent();if(!ag)return{na:"No agent is registered yet"};
   const r=AGENTRT.execute({agent:ag,goal:"Guardrail playground: low confidence",step:"Try to break it",conf:99,origin:"guard playground"});
   if(!r.ok)return{refused:true,why:r.why,ref:r.runId,who:ag};return{refused:!!(r.escalated||r.needsApproval),why:"Confidence "+Math.round(r.confidence*100)+"% is below the 99% floor set for this attempt: "+(r.escalated?"escalated to a person":"held for the sponsor to decide"),ref:r.runId,who:ag}}},
 {id:"restricted",n:"Open someone else's pay record as the service desk",rail:"GR-01",fn:"PERM.can",run(){const d=PERM.can("ops","read","compensation_record","Casey Rowan");if(!d.ok)G(()=>PERM.logDenial(PERM.principalFor("ops"),d,{rec:"Casey Rowan"}));
   return{refused:!d.ok,why:d.why,who:G(()=>PERM.personaUser.ops,"Service desk")}}},
 {id:"own",n:"Approve your own request (budget, change and catalog)",rail:"GR-05",fn:"APG.check",run(){const br=G(()=>BUDREQ.requests().find(q=>["tri","fin","arc","val","cnc","dec"].indexOf(q.st)>=0),null);const ch=G(()=>ITSMX.changes.find(c=>c.req),null);
   const out=[];const t=(label,actor,kind,rec)=>{const c=APG.check(actor,kind,rec);if(!c.ok)G(()=>APG.noteDenial(actor,kind,rec,c));out.push([label,c])};
   if(br)t("Budget "+br.id,br.req,"budget_request",{id:br.id,requester:br.req,stage:br.st,amount:br.amt});
   if(ch)t("Change "+ch.id,ch.req,"change_request",{id:ch.id,requester:ch.req});
   t("Catalog request","Casey Rowan","catalog",{kind:"catalog",id:"playground",requester:"Casey Rowan"});
   return{refused:out.every(x=>!x[1].ok&&x[1].rule==="sod"),why:out.map(x=>x[0]+": "+x[1].why).join(" · "),who:out.length+" requests"}}},
 {id:"kill",n:"Run an agent while the kill switch is on",rail:"GR-17",fn:"AGENTRT.setControl",run(){const ag=activeAgent();if(!ag)return{na:"No agent is registered yet"};let r;
   try{AGENTRT.setControl("global","all",true,"kill","Guardrail playground, simulated");r=AGENTRT.execute({agent:ag,goal:"Guardrail playground: kill switch",step:"Try to break it",origin:"guard playground"})}finally{AGENTRT.setControl("global","all",false,"kill","Guardrail playground done")}
   return{refused:!!(r&&r.blocked&&r.by==="control"),why:r&&(r.why||"Run completed"),ref:r&&r.runId,who:ag}}}];
function attempt(id){const a=ATTEMPTS.find(x=>x.id===id);if(!a)return null;let res;try{res=a.run()||{}}catch(e){res={na:"The check could not run: "+(e&&e.message||e)}}
 const ent={at:Date.now(),id:a.id,n:a.n,rail:a.rail,fn:a.fn,refused:!!res.refused,na:res.na||"",why:res.na||res.why||"",ref:res.ref||"",who:res.who||"",tenant:G(()=>DATA.tenant(),"core"),sim:true};
 G(()=>audit("Guardrail test (simulated): "+a.n,(ent.na?"not run: ":ent.refused?"refused: ":"NOT refused: ")+ent.why));
 LOG.unshift(ent);if(LOG.length>40)LOG.length=40;G(()=>U.store.set(AKEY,LOG));return ent}
function playTab(){const last=id=>LOG.find(x=>x.id===id);
 return card("Try to break it","Each button asks the platform to do something a guardrail should refuse. It calls the real check, puts back anything it changed and writes an audit entry. Simulated: this is the prototype checking itself, not a security test.",
 `<div class="gd-play">${ATTEMPTS.map(a=>{const l=last(a.id);return `<div class="gd-try"><div><b>${E(a.n)}</b><div class="muted small">Guardrail ${E(a.rail)} · check <code>${E(a.fn)}</code></div>${l?`<div class="gd-res">${l.na?pill("Not run","mute"):l.refused?pill("Refused","good"):pill("Not refused","bad")} <span class="small">${E(l.why)}</span></div>`:""}</div><button type="button" class="btn" data-gd-try="${E(a.id)}">Try it</button></div>`}).join("")}</div>
 <div class="row" style="margin-top:12px"><button type="button" class="btn primary" data-gd-try="*">Try all five</button>${simChip()}</div>
 ${LOG.length?`<div class="tscroll" style="margin-top:12px"><table><thead><tr><th>When</th><th>Attempt</th><th>Result</th><th>Why</th><th>Record</th></tr></thead><tbody>${LOG.slice(0,15).map(l=>`<tr><td>${E(new Date(l.at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}))}</td><td>${E(l.n)}</td><td>${l.na?pill("Not run","mute"):l.refused?pill("Refused","good"):pill("Not refused","bad")}</td><td class="small">${E(l.why)}</td><td>${l.ref?`<code>${E(l.ref)}</code>`:""}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted small" style="margin-top:12px">No attempts yet. Each attempt is also written to the audit trail.</p>`}`)}
TABS.push({l:"Try to break it",h:()=>playTab()});
Object.assign(GD,{attempt,attempts:()=>LOG.slice(),tries:()=>ATTEMPTS.map(a=>({id:a.id,n:a.n,rail:a.rail,fn:a.fn}))});
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-gd-try]");if(!t)return;const id=t.dataset.gdTry;
 const done=(id==="*"?ATTEMPTS.map(a=>attempt(a.id)):[attempt(id)]).filter(Boolean);const bad=done.filter(x=>!x.refused&&!x.na).length;
 G(()=>toast(bad?bad+" attempt"+(bad===1?"":"s")+" not refused":done.length+" attempt"+(done.length===1?"":"s")+" refused (simulated)",bad?"warn":"good"));if(S.screen===SELF)render()});

/* ---------- DC-21: guardrail children, one short guided view per act ----------
   Beat-ready data for the Showroom (point of 12 words or fewer, seconds, exactly two sentences, one interaction, claim chips).
   Open one with GUARD.child(id), go("guard",id), or the deep link ?guardchild=<id>. The Showroom module is not edited here. */
const CHILDREN=[
 {id:"demand",act:"Demand",title:"Approvals go to a group, never a person",point:"Every approval routes to a group; nobody approves their own",secs:150,rails:["GR-03","GR-04","GR-05"],
  say:["Catalog, budget and change approvals all resolve to one group model, and only a member of that group can decide.","The requester is always refused, which you can watch happen on the next step."],
  do:"Press Try it on Approve your own request.",claims:["fact","simulated"],
  steps:[{t:"One routing source decides which group holds each approval.",link:"r16h_groups"},{t:"Try to approve your own request: the real check refuses it.",tryit:"own"},{t:"Steps that still name a person are counted as gaps.",link:"r16h_groups"}]},
 {id:"fund",act:"Fund",title:"Money cannot move past its authority",point:"The amount decides who approves; caps stop overspend",secs:150,rails:["GR-08","GR-09","GR-10","GR-11","GR-06"],
  say:["The delegation of authority picks the approver from the amount, and a purchase order cannot pass what is left on its line.","Two of these are partial today, and the register says exactly where."],
  do:"Open the delegation of authority matrix.",claims:["fact","modeled"],
  steps:[{t:"The amount picks the approver tier.",link:"bud_doa"},{t:"A purchase order or reforecast past the free money is refused.",link:"bud_lines"},{t:"Funding a request shows the reserve but does not block yet: partial.",link:"bud_req"}]},
 {id:"deliver",act:"Deliver",title:"Agents work inside a box",point:"Tier, budget, confidence floor and kill switch box every agent",secs:180,rails:["GR-12","GR-13","GR-14","GR-15","GR-17"],
  say:["Every agent run is checked against its tier, its daily budget, a confidence floor and the kill switch before anything happens.","Runs here are simulated, and each attempt below calls the real runtime check."],
  do:"Press Try it on the kill switch.",claims:["simulated"],
  steps:[{t:"Run an agent past its daily budget: blocked.",tryit:"budget"},{t:"Below the confidence floor a person decides.",tryit:"confidence"},{t:"With the kill switch on, nothing runs.",tryit:"kill"},{t:"See every run, gate and stop in the runtime.",link:"ai_runtime"}]},
 {id:"build",act:"Build",title:"Nothing ships past a failed gate",point:"A failed gate or missing owner blocks every promotion",secs:120,rails:["GR-19","GR-20","GR-25"],
  say:["A citizen app is promoted only when its gate passes, and the gate checks for a named owner and a different backup.","Environments cannot be skipped on the way to production."],
  do:"Open the citizen app gate.",claims:["fact"],
  steps:[{t:"The promotion gate refuses a failing app.",link:"plat_gate"},{t:"Environments promote in order.",link:"adm_env"},{t:"Owner and backup gaps are listed.",link:"own_gaps"}]},
 {id:"track",act:"Track",title:"Every decision leaves a record",point:"Permissions decide, masks hide, and the trail records it",secs:120,rails:["GR-01","GR-21","GR-24"],
  say:["The permission model decides every screen and action, and restricted fields stay hidden.","The shared audit trail is kept in memory in this prototype, so it is marked partial."],
  do:"Press Try it on the restricted record.",claims:["fact","simulated"],
  steps:[{t:"Open someone else's pay as the service desk: refused.",tryit:"restricted"},{t:"See how the permission model decided.",link:"r16g_perm"},{t:"Read the audit trail.",link:"adm_audit"}]},
 {id:"tenant",act:"Set",title:"One tenant, one boundary",point:"Each tenant sees its own data; isolation is simulated here",secs:150,rails:["GR-22","GR-23","GR-26"],
  say:["Data and agent runs are read per tenant, so one customer never sees another's records or runs.","Tenant isolation and the AI gateway are simulated in this prototype and are plans, not certified claims."],
  do:"Open the agent runtime and read the gateway note.",claims:["simulated","hypothesis"],
  steps:[{t:"Agent runs, retrieval, memory and logs are kept per tenant.",link:"ai_runtime"},{t:"Model calls go only through the AI gateway, which is simulated.",link:"adm_gate"},{t:"A tenant with no data sees empty screens, never sample rows from another tenant.",link:"home"}]}];
const CHBY=Object.fromEntries(CHILDREN.map(c=>[c.id,c]));
function child(id){if(!CHBY[id])return null;S_.child=id;if(W.HOOKS)G(()=>go(SELF,id));else{S.screen=SELF;render()}return Object.assign({},CHBY[id])}
G(()=>HOOKS.on("beforeGo",(s,a)=>{if(s===SELF&&a&&CHBY[a])S_.child=a},{id:"guard-child"}));
GD._childPanel=function(){const c=CHBY[S_.child];if(!c)return"";const rs=Object.fromEntries(rails().map(r=>[r.id,r]));const last=id=>LOG.find(x=>x.id===id);
 return `<section class="card glass gd-child" aria-label="Guided view: ${E(c.title)}"><div class="gd-ch-h"><div><div class="eyebrow">Guided view · ${E(c.act)} · about ${Math.round(c.secs/60)} minutes</div><h3>${E(c.title)}</h3></div><button type="button" class="btn quiet gd-x" data-gd-child="" aria-label="Close the guided view">&times;</button></div>
 <p data-role="story">${E(c.say.join(" "))}</p>
 <ol class="gd-steps">${c.steps.map(s=>{const l=s.tryit&&last(s.tryit);return `<li><span>${E(s.t)}</span> ${s.tryit?`<button type="button" class="btn sm" data-gd-try="${E(s.tryit)}">Try it</button>${l?" "+(l.refused?pill("Refused","good"):pill("Not refused","bad")):""}`:`<button type="button" class="chip" data-link="screen:${E(s.link)}">Open ${E(scrName(s.link))}</button>`}</li>`}).join("")}</ol>
 <div class="row">${c.rails.map(id=>rs[id]?pill(id+" "+STATUS[rs[id].status].l,STATUS[rs[id].status].c,rs[id].rule):"").join("")}${c.claims.indexOf("simulated")>=0?simChip():""}</div></section>`};
function childrenTab(){return card("Guided views","Short views of the guardrails, one per act of a tour. A Showroom beat can link to any of them.",
 `<div class="tscroll"><table><thead><tr><th>Act</th><th>View</th><th>Point</th><th class="num">Time</th><th>Deep link</th><th></th></tr></thead><tbody>${CHILDREN.map(c=>`<tr><td>${E(c.act)}</td><td><b>${E(c.title)}</b></td><td class="small">${E(c.point)}</td><td class="num">${Math.round(c.secs/60*10)/10} min</td><td><code>?guardchild=${E(c.id)}</code></td><td><button type="button" class="btn sm" data-gd-child="${E(c.id)}">Open</button></td></tr>`).join("")}</tbody></table></div>`)}
TABS.push({l:"Guided views",h:()=>childrenTab()});
Object.assign(GD,{child,children:()=>CHILDREN.map(c=>JSON.parse(JSON.stringify(c)))});
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-gd-child]");if(!t)return;const id=t.dataset.gdChild;if(id)child(id);else{S_.child="";render()}});
G(()=>{const q=new URLSearchParams(location.search).get("guardchild");if(q&&CHBY[q])setTimeout(()=>child(q),1200)});

/* ---------- process (R34 procCard) ---------- */
G(()=>PROC.reg(SELF,{title:"How a guardrail is kept true",std:["nist","cobit"],steps:[
 {n:"Inventory the check",d:"Find the function that refuses the action and record where it lives.",who:"human",owner:"Rina Okafor",sla:"Per release",in:"Code and screens",out:"Register row"},
 {n:"Look it up in the page",d:"The register looks each check up in the running page and flags any it cannot find.",who:"robot",owner:"Guardrail register",sla:"Every render",in:"Register row",out:"Found or not found"},
 {n:"Try to break it",d:"A tester runs the real check with a bad request; the attempt is audited.",who:"human",owner:"Rina Okafor",sla:"Per release",in:"Attempt",out:"Refused or allowed, with the reason"},
 {n:"Accept the status",d:"The owner accepts enforced, partial or documented only; a partial needs a backlog item.",who:"gate",owner:"Casey Rowan",sla:"Weekly",in:"Register and attempts",out:"Accepted status"}]}));

/* ---------- the screen ---------- */
function render_(){const rows=rails();const c=counts(rows);
 const tabs=views("sguard",TABS.map(t=>t.l),TABS.map(t=>G(()=>t.h(rows),`<p class="muted">Not available.</p>`)));
 return `<div class="screen gd-screen">${hero("Governance · Guardrails","Guardrail register",`<b>${rows.length}</b> guardrails in <b>${new Set(rows.map(r=>r.fam)).size}</b> families, read from the code: <b>${c.enforced}</b> enforced, <b>${c.partial}</b> partial, <b>${c.documented}</b> documented only. All of it is simulated in this prototype.`,`<div class="row">${simChip()}<button type="button" class="btn" data-link="screen:r16h_groups">Approval groups</button><button type="button" class="btn" data-link="screen:ai_runtime">Agent runtime</button></div>`)}${lensNote()}${honesty()}${G(()=>GD._childPanel?GD._childPanel():"","")}${dashboard(rows)}${tabs}${procHTML()}</div>`}
/* procCard has no label for robot steps yet (CL-58, steps stream): label it through STEPMODE so no step reads "undefined" */
function procHTML(){return String(G(()=>procCard(SELF),"")).replace(/<span class="who">undefined<\/span>/g,`<span class="who">${E(G(()=>STEPMODE.label("robot"),"Robot"))}</span>`)}
REG(SELF,"Guardrails","platform","M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-4.5",render_);
G(()=>{if(W.NAVX&&NAVX.add)NAVX.add(SELF,{group:"plat",label:"Guardrails",hint:"Guardrail register",sub:"Register, matrix, try to break it",kw:"guardrail register guardrails enforcement segregation of duties approval group kill switch confidence floor agent budget tenant boundary audit try to break it"})});
G(()=>SEARCHX.push(()=>[{g:"Go to",t:"Guardrails",m:"Register of every guardrail and its enforcement status",c:"--p4",f:()=>go(SELF),k:"guardrail register enforcement simulated"}].concat(RAILS.map(r=>({g:"Guardrails",t:r.id+" "+r.rule.slice(0,70),m:FAMBY[r.fam].n+" · "+STATUS[r.status].l,c:"--p4",f:()=>{S_.fam=r.fam;S_.st="";S_.stage="";S.v.sguard=0;go(SELF)},k:"guardrail "+r.id+" "+FAMBY[r.fam].n+" "+r.rule})))));

/* ---------- clicks ---------- */
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-gd-f]");if(!t)return;const [k,v]=t.dataset.gdF.split("|");S_[k]=v;S.v.sguard=0;render()});
})();
