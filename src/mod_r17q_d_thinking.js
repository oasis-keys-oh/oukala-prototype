/* Round 17, Agent Q. Screen "How it was built" (r17q_thinking, alias #thinking).
   The thesis, design principles with a screen to see each one, the rounds timeline, a searchable decisions table parsed from the
   project decisions log at build time (mod_r17q_a_data.js), evidence tiles with live counts, and what we chose not to build. */
(function(){
"use strict";
const W=window,Q=W.R17Q;if(!Q)return;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=x=>Array.isArray(x)?x:[];
const ST=Q.st,{nf}=Q.fmt;
const D=()=>G(()=>W.R17Q_DATA,{decisions:[],register:{rows:0,epics:0,stories:0,byModule:[],byCategory:[],byPriority:[]},sources:[]});
const nameOf=id=>G(()=>SCREENS.find(s=>s[0]===id)[1],id);
const go_=(id,label)=>`<button type="button" class="chip r17q-lk" data-r17q-go="${id}">${H(label||nameOf(id))}</button>`;

/* ---------------- (a) thesis ---------------- */
function thesis(){
 const ag=G(()=>AGENTS_STATE.counts(),{registered:0,governed:0}),gp=G(()=>APG.groups().length,0),cs=G(()=>CONTRACT.stats(),{fullPct:0,fullContract:0,features:0}),zs=G(()=>ZLINK.score(),0),ent=G(()=>Object.keys(DATAMODEL.tables).length,0);
 const T=[
  ["One record, one number","Work, money, people and AI agents read the same registries, so a figure means the same thing on every screen.",`Connectivity score ${nf(zs)}; ${nf(ent)} entities in one data model`,"zl_conn"],
  ["Guardrails live in a box","Every agent, approval and permission has an owner, a backup, a group and a limit, set before it runs.",`${nf(ag.governed)} of ${nf(ag.registered)} agents under governance; ${nf(gp)} approval groups`,"ai_runtime"],
  ["A feature is done when it explains itself","The Feature Contract asks for a process, a data model, metrics and links, so each screen can show where its numbers come from.",`${nf(cs.fullContract)} of ${nf(cs.features)} features meet all four rules (${nf(cs.fullPct)}%)`,"plat_contract"]];
 return `<div class="r17q-th">${T.map((t,i)=>`<article class="r17q-tc"><span class="r17q-tn num" aria-hidden="true">${i+1}</span><h3>${H(t[0])}</h3><p>${H(t[1])}</p><div class="r17q-tp small"><span class="muted">Live proof</span> <b>${H(t[2])}</b></div>${go_(t[3])}</article>`).join("")}</div>`}

/* ---------------- (b) principles ---------------- */
const PRIN=[
 ["No chatty AI voice","Screens show numbers, trends, labeled sources and formulas. AI text appears only when someone asks, and it is labeled.",["r15d_agents","chat_home"],"R14"],
 ["Guardrails in a box","Each agent shows its tier, spend cap, shift, kill switch and human sponsor in one box.",["ai_runtime","tower"],"R15"],
 ["Owner and backup","Every process, metric and screen names a human owner and a different backup. Gaps show as badges.",["own_gaps"],"R13"],
 ["Reuse first","Before a new entity, search the registry: reuse, then extend, then new. The decision is recorded.",["plat_data","plat_build"],"R10"],
 ["One name per screen","A function has one screen. Merged screens redirect, and old links keep working.",["nav_studio"],"R15"],
 ["Feature Contract","A feature counts as done when it brings a process, a data model, metrics with maturity, and links.",["plat_contract"],"R11"],
 ["Groups approve","Approvals route to a group with a quorum rule and a backup, never to one person.",["r16h_groups","r16h_rules"],"R16"],
 ["Deny by default","One nested permission model at table, row and attribute level. No rule means no access.",["r16g_perm"],"R16"],
 ["Every number has a formula and a source","Formula chips open the formula, owner, target and lineage of any figure.",["metrics","zl_conn"],"R9"],
 ["Built for scale","Searchable pickers and virtual tables replace pills and long lists; every screen is tested at Enterprise volume.",["adm_studio"],"R8"]];
function principles(){
 return `<div class="tscroll"><table class="tbl r17q-t r17q-pt"><thead><tr><th>Principle</th><th>What it means on screen</th><th>Where to see it</th><th>Set in</th></tr></thead><tbody>${PRIN.map(p=>`<tr><td><b>${H(p[0])}</b></td><td>${H(p[1])}</td><td class="r17q-lks">${p[2].map(id=>go_(id)).join("")}</td><td class="n">${H(p[3])}</td></tr>`).join("")}</tbody></table></div>`}

/* ---------------- (c) rounds ---------------- */
const RND=[
 ["Rounds 1 to 7","","Platform layer and first modules: data atlas, module map, service management, portfolio, cost transparency, workflow, people, chat and knowledge.","Per-round notes were not kept in the project docs, so this block is not split by round.","plat_map","docs: status, Earlier"],
 ["Round 8","","Shared foundations: people, service and CI registries, virtual-scroll tables, searchable multi-select, a Demo and Enterprise volume switch.","Every list, chart and picker must stay usable at thousands of records, and text is never squeezed into slivers.","itom_cmdb","docs: module guide, round 8"],
 ["Round 9","","Card consistency became a shipping check; formula chips open a KPI box; process steps show how they decide.","Every metric uses one framework with formula, owner, target and remediation.","metrics","docs: module guide, round 9"],
 ["Round 10","2026-10-09","Process library with per-process maturity, a data coverage audit, the Build a module path, and the IT financial model as the money layer.","New modules enter through one path: reuse-first data check, process and flow declaration, metrics, then the gate.","plat_build","decisions log, status"],
 ["Round 11","2026-10-10","Navigation regrouped by function, approvals inbox, meetings module, and the Feature Contract.","Feature Contract adopted: process, data model with a reuse decision, metrics with maturity, and links.","plat_contract","decisions log, status"],
 ["Round 12","2026-10-10","Org chart and agent studio; budget numbers drill to source records; a type scale for typography.","AI agents are sponsored by a named person; the metric is capacity returned, never headcount reduction.","org_chart","decisions log, status"],
 ["Round 13","2026-10-10","Ownership service, process drawing studio, decision rules for every process, budget request funnel.","Every feature needs a named human owner and a backup; an AI agent is never the accountable owner.","own_gaps","decisions log, status"],
 ["Round 14","2026-10-11","Permanent sliders and zoom on large canvases, order guides, record search, org chart rebuilt.","No chatty AI voice: the product shows data and labeled sources; AI text appears only on request.","chat_home","decisions log, status"],
 ["Round 15","2026-10-11","URL routes, one name per screen, 13 personas, shared facts, persistent store, event bus, GRC suite; load time cut from 17 s to 7 s.","Single sources of truth for facts and agent counts, and one event bus for lifecycle and workflow triggers.","r15d_facts","decisions log, status"],
 ["Round 16","2026-10-11","Permissions model, group approvals, CI ownership, portal, strategy to execution, resilience, setup hub, and the specification of 15,104 requirements.","Every approval routes to a group, never a person; permissions deny by default and live on one screen.","r16g_perm","decisions log, status"]];
function rounds(){
 return `<ol class="r17q-tl">${RND.map(r=>`<li class="r17q-tli"><div class="r17q-tlh"><b>${H(r[0])}</b>${r[1]?`<span class="muted small">${H(r[1])}</span>`:""}</div><div class="r17q-tlb"><p>${H(r[2])}</p><p class="r17q-dm"><span class="muted small">Decision that mattered</span> ${H(r[3])}</p><div class="r17q-tlf">${go_(r[4],"See it: "+nameOf(r[4]))}<span class="muted small">Source: ${H(r[5])}</span></div></div></li>`).join("")}</ol>`}

/* ---------------- (d) decisions ---------------- */
function filtered(){const d=arr(D().decisions),q=(ST.q||"").toLowerCase().trim(),rd=ST.round||"";
 return d.filter(x=>(!rd||x.round===rd)&&(!q||(x.id+" "+x.date+" "+x.round+" "+x.full).toLowerCase().includes(q)))}
function decRows(){const f=filtered(),n=Math.min(f.length,ST.more||25);
 const body=f.slice(0,n).map(x=>`<tr><td class="n">${H(x.date)}</td><td class="n">${H(x.round)}</td><td><b>${H(x.decision)}</b>${x.detail?`<details class="r17q-dd"><summary>Detail from the log</summary>${H(x.detail)}</details>`:""}</td><td>${x.reason?H(x.reason):'<span class="muted">Not stated in the log</span>'}</td><td>${x.consequence?H(x.consequence):'<span class="muted">Not stated in the log</span>'}</td></tr>`).join("");
 return {n:f.length,html:`<div class="tscroll"><table class="tbl r17q-t r17q-dtb"><thead><tr><th>Date</th><th>Round</th><th>Decision</th><th>Reason</th><th>Consequence</th></tr></thead><tbody>${body||`<tr><td colspan="5" class="muted">No decision matches.</td></tr>`}</tbody></table></div>${f.length>n?`<div class="r17q-more"><button type="button" class="btn" data-r17q-more>Show ${Math.min(25,f.length-n)} more</button><span class="muted small">${n} of ${f.length}</span></div>`:`<div class="muted small r17q-more">${f.length} of ${f.length} shown</div>`}`}}
function decisions(){const d=arr(D().decisions),rs=[...new Set(d.map(x=>x.round))],r=decRows();
 const withR=d.filter(x=>x.reason).length,withC=d.filter(x=>x.consequence).length,src=arr(D().sources)[0];
 const m=G(()=>METRICS.m_val_decisions,null);if(m&&d.length)m.cur=Math.round(100*withR/d.length);
 return `<div class="r17q-dtool"><label class="r17q-sq"><span class="small muted">Search decisions</span><input type="search" class="fin" placeholder="Search by word, round or date" value="${H(ST.q)}" data-r17q-dq aria-label="Search decisions"></label>
  <label class="r17q-sq"><span class="small muted">Round</span><select class="fin" data-r17q-dr aria-label="Filter by round"><option value="">All rounds</option>${rs.map(x=>`<option value="${H(x)}" ${ST.round===x?"selected":""}>${H(x)}</option>`).join("")}</select></label></div>
  <p class="small muted r17q-dn"><b>${d.length}</b> decisions parsed from the project decisions log${src?` (${H(src.file.split("/").pop())}, build ${H(D().generated||"")})`:""}. ${withR} record a reason and ${withC} a consequence; the rest are shown as the log wrote them. ${typeof fchip==="function"?fchip("m_val_decisions","Formula"):""}</p>
  <div id="r17q-dt">${r.html}</div>`}

/* ---------------- (e) evidence ---------------- */
function evidence(){
 const R=D().register,ev=G(()=>EVENTS.coverage(),{events:0});
 let nf_=0;G(()=>Object.keys(DATAMODEL.tables).forEach(k=>nf_+=DATAMODEL.fields(k).length),0);
 const tiles=[
  ["Screens",G(()=>SCREENS.length,0),"registered in the product","nav_studio",1],
  ["Modules on the process map",G(()=>MODMAP.modules.length,0),"with flows in and out","plat_map",1],
  ["Entities",G(()=>Object.keys(DATAMODEL.tables).length,0),"in one data model","plat_data",1],
  ["Fields",nf_,"each with authority and classification","plat_data",1],
  ["Processes",G(()=>PROCLIB.stats().processes,0),"with owner, steps and maturity","plat_proc",1],
  ["Events",G(()=>ev.events,0),"on one event bus","zevt",1],
  ["Permission rules",G(()=>PERM.state.rules.length+PERM.state.fields.length,0),"row, screen and attribute rules","r16g_perm",1],
  ["Metrics",G(()=>Object.keys(METRICS).length,0),"each with a formula and an owner","metrics",1],
  ["Approval groups",G(()=>APG.groups().length,0),"with quorum rule and backup","r16h_groups",1],
  ["AI agents registered",G(()=>AGENTS_STATE.counts().registered,0),"each with a human sponsor","r15d_agents",1],
  ["Features with the full contract",G(()=>CONTRACT.stats().fullContract,0),"of "+G(()=>CONTRACT.stats().features,0),"plat_contract",1],
  ["Requirements in the register",R.rows,`${R.epics} epics, ${R.stories} story seeds; workbook read ${R.extracted||""}`,"",0]];
 const live=tiles.filter(t=>t[4]).length,m=G(()=>METRICS.m_val_evidence,null);if(m)m.cur=Math.round(100*live/tiles.length);
 const mx=Math.max(1,...arr(R.byModule).map(x=>x[1]));
 const mods=arr(R.byModule).slice().sort((a,b)=>b[1]-a[1]);
 return `<div class="r17q-ev">${tiles.map(t=>{const inner=`<span class="r17q-el">${H(t[0])}</span><b class="num r17q-evn" data-role="metric">${nf(t[1])}</b><span class="small muted">${H(t[2])}</span><span class="small r17q-es">${t[4]?"Read live":"From the register summary"}</span>`;return t[3]?`<button type="button" class="r17q-et" data-r17q-go="${t[3]}" aria-label="${H(t[0])}: ${nf(t[1])}. Open ${H(nameOf(t[3]))}">${inner}</button>`:`<div class="r17q-et static">${inner}</div>`}).join("")}</div>
  <section class="card glass r17q-c" style="margin-top:16px"><div class="cardhead"><div><h3>Requirements by module</h3><span class="muted small">${nf(R.rows)} rows from the register summary (docs/spec). Bar length is the share of the largest module.</span></div>${typeof fchip==="function"?fchip("m_val_evidence","Formula"):""}</div>
  <div class="r17q-rb">${mods.map(x=>`<div class="r17q-rr"><span class="small">${H(x[0])}</span><span class="r17q-rtrack" aria-hidden="true"><i style="width:${Math.max(2,Math.round(100*x[1]/mx))}%"></i></span><b class="num small">${nf(x[1])}</b></div>`).join("")}</div></section>`}

/* ---------------- (f) not built ---------------- */
const NOT=[
 ["A chatty AI assistant voice","Generated prose cannot be sorted, audited or compared, and it reads as noise next to the numbers.","Data, formulas and labeled sources; AI text only on request.","r15d_agents","R14"],
 ["Approvals routed to one person","People travel, change roles and leave; a single approver stalls the queue.","Groups with a quorum rule, a backup and decision criteria.","r16h_groups","R16"],
 ["Duplicated lists","Two screens for one thing drift apart and disagree.","One registry, one name per screen; merged screens redirect.","nav_studio","R15"],
 ["Pills for large sets","Pills hide values behind scroll and cannot be searched.","A searchable picklist above a small size.","plat_store","R16"],
 ["An AI agent as the accountable owner","An agent cannot be held to account.","A named human sponsor, an owner and a backup on every agent.","org_chart","R13"],
 ["A second maturity scale","Parallel scales cannot be compared or rolled up.","One maturity engine that every process rolls up into.","exe_mat","R10"],
 ["Headcount reduction as the pitch","It sets staff against the tool and hides the real gain.","Capacity returned, measured as hours.","r17q_value","R12"],
 ["A cloned database for every customer","Clones drift and multiply the upgrade work.","Pooled SaaS with a schema and key per tenant; dedicated stacks as an upgrade.","r16m_deploy","R16"],
 ["Invented benchmarks in the business case","A made-up benchmark reads as a measured fact.","Figures from this tenant's data, and assumptions the viewer edits and labels.","r17q_value","R17"]];
function notBuilt(){return `<div class="r17q-nb">${NOT.map(n=>`<article class="r17q-nc"><h3>${H(n[0])}</h3><p><span class="muted small">Why not</span> ${H(n[1])}</p><p><span class="muted small">Instead</span> ${H(n[2])}</p><div class="r17q-tlf">${go_(n[3])}<span class="muted small">Set in ${H(n[4])}</span></div></article>`).join("")}</div>`}

/* ---------------- screen ---------------- */
function screen(){
 Q.ensurePerm();
 const d=arr(D().decisions);
 return `<div class="screen r17q-screen">${hero("Strategy and performance · How it was built","How it was built",`The thesis in three statements, ten design principles, the decision that mattered in each round, <b data-role="metric">${d.length}</b> logged decisions and the live counts behind the product.`,`<div class="row" style="gap:8px;flex-wrap:wrap">${typeof fchip==="function"?fchip("m_val_evidence")+fchip("m_val_decisions"):""}<button class="btn" data-go="r17q_value">Value realized</button></div>`)}${typeof lensNote==="function"?lensNote():""}
  ${thesis()}
  ${typeof views==="function"?views("r17qt",["Design principles","Rounds","Decisions ("+d.length+")","Evidence","What we chose not to build"],[card("Design principles","Each principle, what it means on screen, and a screen where you can see it.",principles()),card("Rounds timeline","One line per round, with the decision that mattered. Read from the status and decisions docs.",rounds()),card("Decisions","Searchable, parsed at build time from the project decisions log.",decisions()),evidence(),card("What we chose not to build","Each choice with the reason and what exists instead.",notBuilt())]):principles()}
  ${typeof procCard==="function"?procCard("r17q_thinking"):""}</div>`}
REG("r17q_thinking","How it was built","strat","M4 6h16M4 12h10M4 18h6M17 14l3 3-3 3",screen);

/* ---------------- events ---------------- */
function repaintDec(){const t=document.getElementById("r17q-dt");if(t)t.innerHTML=decRows().html}
document.addEventListener("input",e=>{const t=e.target.closest&&e.target.closest("[data-r17q-dq]");if(t){ST.q=t.value;ST.more=25;repaintDec()}});
document.addEventListener("change",e=>{const t=e.target.closest&&e.target.closest("[data-r17q-dr]");if(t){ST.round=t.value;ST.more=25;repaintDec()}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r17q-more]");if(b){ST.more=(ST.more||25)+25;repaintDec()}});
})();
