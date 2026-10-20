/* ===== Round 18, C: Make. My builds (list), the App record (eight guardrails), Maturity roadmaps and Risk and debt across builds.
   Built on the citizen-app registry (GATE), the debt register (DEBT) and the gate checks. Class prefix r18-. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;
const {G,H,arr,usd,pill,fD}=R18;const ST=R18.st;
const me=()=>G(()=>R15D.me().name,"Casey Rowan");
const STAGE={idea:["Idea","mute"],sandbox:["Sandbox","info"],review:["In review","warn"],certified:["Certified","good"],sunset:["Retired","mute"]};
const SEV={High:"bad",Medium:"warn",Low:"mute"};
const dots=(id)=>R18.facets(id).map(f=>`<i class="r18-pip s-${f.s}" title="${H(f.label)}: ${R18.stateText[f.s]}. ${H(f.d)}"></i>`).join("");
const ring=p=>`<div class="r18-ring" style="--p:${p}" role="img" aria-label="${p} percent of guardrails in place"><b>${p}%</b><small>in place</small></div>`;
const bar=(l,t)=>`<span class="r18-lvl" role="img" aria-label="Level ${l} of 5, target ${t}">${[1,2,3,4,5].map(i=>`<i class="${i<=l?"on":""}${i===t?" tgt":""}"></i>`).join("")}</span>`;
const chipGo=(go,label,cls)=>`<button type="button" class="btn ${cls||"quiet"}" data-go="${go}">${H(label)}</button>`;
const nextActions=id=>{const f=R18.facets(id),out=[];f.filter(x=>x.s==="missing").forEach(x=>out.push([x.label,x.d,x.go,"bad"]));f.filter(x=>x.s==="drafted").forEach(x=>out.push([x.label,x.d,x.go,"warn"]));return out.slice(0,4)};

/* ============================ My builds ============================ */
function row(a){const m=R18.meta(a.id),v=R18.value(a.id),mt=R18.maturity(a.id),st=STAGE[a.status]||STAGE.idea,cov=R18.coverage(a.id);
 return `<tr class="r18-row" tabindex="0" data-r18-app="${H(a.id)}" aria-label="Open ${H(a.n)}"><td><b>${H(a.n)}</b><small class="muted">${H(m.fn)} · ${H(a.builder||"")}</small></td><td>${m.owner?H(m.owner):'<span class="r18-gap">No owner</span>'}${m.backup?"":' <span class="r18-gap">no backup</span>'}</td><td>${pill(st[0],st[1])}</td><td><span class="r18-pips">${dots(a.id)}</span> <span class="num r18-pct">${cov}%</span></td><td>${bar(mt.lvl,mt.tgt)}</td><td class="n num">${usd(v.net)}</td></tr>`}
function table(list){if(!list.length)return `<p class="muted r18-none">Nothing here yet.</p>`;
 return `<div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Build</th><th>Owner</th><th>Stage</th><th>Guardrails</th><th>Maturity</th><th class="n">Net value a month</th></tr></thead><tbody>${list.map(row).join("")}</tbody></table></div>`}
function startCards(){
 return `<section class="card glass r18-start"><div class="cardhead"><div><h3>Start something new</h3><span class="muted small">Three ways in. Whichever you use, the process map, metrics, maturity roadmap, debt register, data approvals and security review come attached.</span></div></div>
 <div class="r18-ways"><article><b>In your own AI tool</b><p>Add the ${BRAND.name} skills to Claude, ChatGPT or your coding tool. As you describe what you need, the skills build the guardrail pieces alongside it.</p><button class="btn primary" type="button" data-go="plat_mcp">Get the skills</button></article>
 <article><b>With the workflow designer</b><p>Draw the steps, pick who does each one (a person, a rule or AI) and the platform generates the rest. Good for work that touches several teams.</p><button class="btn" type="button" data-go="flw_design">Open the designer</button></article>
 <article><b>We build it for you</b><p>Describe the job in plain words. You get a working draft, or the exact prompts to fine tune it yourself.</p><button class="btn" type="button" data-go="plat_build">Describe what you need</button></article></div></section>`}
function buildsScreen(){
 const L=R18.apps().filter(a=>a.status!=="sunset");const P=R18.portfolio();const mine=L.filter(a=>a.builder===me()||a.owner===me());
 const attn=L.filter(a=>R18.facets(a.id).some(f=>f.s==="missing"));
 const kp=typeof kpiRow==="function"?kpiRow([["Builds",P.n,P.users+" people use them"],["Guardrails in place",P.cov+"%","average across builds, 8 per build"],["Modeled net value a month",usd(P.net),"hours returned minus run cost; illustrative",{keep:true}],["Need action",attn.length,"at least one guardrail missing",{cls:attn.length?"warn":""}]]):"";
 return `<div class="screen r18-screen">${hero("Make · My builds","What you built, and what stands between it and the whole organization",`Anyone can build for their own job. Every build is checked against eight guardrails, and the ones that prove valuable can be offered to other teams. <b data-role="metric">${P.scaleReady}</b> of ${P.n} look ready to scale.`)}
 ${kp}
 ${typeof views==="function"?views("r18bv",["All builds ("+L.length+")","Mine ("+mine.length+")","Need action ("+attn.length+")"],[table(L),mine.length?table(mine):`<p class="muted r18-none">You have not built anything yet. ${"Start with the options below."}</p>`,table(attn)]):table(L)}
 ${startCards()}
 ${typeof procCard==="function"?procCard("r18_builds"):""}</div>`}
REG("r18_builds","My builds","make","M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z",buildsScreen);

/* ============================ App record ============================ */
function pick(){const L=R18.apps();return `<label class="r18-pickl small muted"><span>Build</span><select class="fin" data-r18-pickapp aria-label="Choose a build">${L.map(a=>`<option value="${H(a.id)}" ${a.id===ST.app?"selected":""}>${H(a.n)}</option>`).join("")}</select></label>`}
function guardrailsTab(a){
 const f=R18.facets(a.id),cov=R18.coverage(a.id),m=R18.meta(a.id),na=nextActions(a.id),O=R18.objectives(),ob=R18.objective(m.obj);
 const rows=f.map(x=>`<div class="r18-fr s-${x.s}"><span class="r18-fs">${pill(R18.stateText[x.s],R18.stateClass[x.s])}</span><span class="r18-fn"><b>${H(x.label)}</b><small>${H(x.d)}</small></span><button type="button" class="btn quiet" data-go="${H(x.go)}">Open</button></div>`).join("");
 const kill=R18.kill.on(a.id);
 return `<div class="r18-two"><section class="card glass"><div class="cardhead"><div><h3>The eight guardrails</h3><span class="muted small">Generated with the build. Active means done and in force; drafted means generated and waiting for the owner; missing blocks scaling.</span></div>${ring(cov)}</div><div class="r18-frs">${rows}</div></section>
 <div class="r18-col"><section class="card glass"><div class="cardhead"><div><h3>Why this exists</h3><span class="muted small">Every build names the strategy objective it advances, so leaders can see how each function enables the strategy.</span></div></div>
  <label class="small muted r18-pickl"><span>Objective</span><select class="fin" data-r18-objsel aria-label="Strategy objective this build advances"><option value="">Not linked</option>${O.map(o=>`<option value="${H(o.id)}" ${o.id===m.obj?"selected":""}>${H(o.n)}</option>`).join("")}</select></label>
  ${ob?`<p class="r18-why" data-role="story">${H(ob.story)}</p>`:`<p class="r18-why r18-warn">Not linked to any objective. A build with no stated purpose is the first to be asked about when budgets tighten.</p>`}</section>
  <section class="card glass"><div class="cardhead"><div><h3>Kill switch</h3><span class="muted small">Stops the build immediately for everyone. The data stays; nothing new runs.</span></div>${pill(kill?"Stopped":"Running",kill?"bad":"good")}</div>
  <div class="row"><button type="button" class="btn ${kill?"primary":""}" data-r18-kill="${H(a.id)}">${kill?"Turn it back on":"Stop this build"}</button><span class="muted small">${R18.kill.tested(a.id)?"Tested":"Never tested"}</span></div></section>
  <section class="card glass"><div class="cardhead"><div><h3>Next best actions</h3></div></div>${na.length?na.map(x=>`<div class="r18-na"><i class="r18-pip s-${x[3]==="bad"?"missing":"drafted"}"></i><span><b>${H(x[0])}</b><small>${H(x[1])}</small></span><button class="btn quiet" type="button" data-go="${H(x[2])}">Open</button></div>`).join(""):`<p class="muted small">All guardrails are in place.</p>`}</section></div></div>`}
function ensureProc(a,pr,m){const pid="r18p_"+a.id;if(G(()=>PROCLIB.get(pid),null))return pid;
 const W={human:"human",auto:"auto",ai:"agent",gate:"gate"};
 const steps=pr.steps.map((s,i)=>({n:s.n,d:s.d,who:W[s.who]||"human",owner:s.who==="ai"?(arr(a.ai)[0]?arr(a.ai)[0].model:"AI agent"):s.who==="gate"?"Approver group":s.who==="auto"?"Automatic":(m.owner||a.builder||"The team"),sla:s.who==="gate"?"3 working days":"",in:i?pr.steps[i-1].out:"Trigger",out:s.out}));
 const ents=arr(a.reads).concat(arr(a.writes)).filter(e=>G(()=>PLAT.ent(e),null));
 const r=G(()=>PROCLIB.addProcess({id:pid,name:a.n,module:"r18_builds",family:G(()=>PROCLIB.get("plat_gate").family,undefined),owner:m.owner||a.builder||"",backup:m.backup||"",trigger:pr.steps[0].d,steps,entities:ents,metrics:[],model:"cmmi",target:3,std:["itil5","cobit"]}),null);
 return r&&r.ok!==false?pid:(G(()=>PROCLIB.get(pid),null)?pid:null)}
function processTab(a){
 const pr=R18.process(a.id),m=R18.meta(a.id);const who={human:"human",auto:"auto",ai:"agent",gate:"gate"};
 const owners={human:m.owner||a.builder||"The team",auto:"Automatic",ai:"AI agent",gate:"Approver group"};
 const list=pr.steps.map(s=>({n:s.n,who:who[s.who]||"human",owner:s.who==="ai"?(arr(a.ai)[0]?arr(a.ai)[0].model:"AI agent"):owners[s.who],in:"",out:s.out}));
 const pid=G(()=>ensureProc(a,pr,m),null);const dg=pid?null:G(()=>R17PD.build(list),null);
 const lab={human:"Person",auto:"Automatic",ai:"AI",gate:"Approval gate"};
 return `<section class="card glass"><div class="cardhead"><div><h3>Process map</h3><span class="muted small">Generated from what you described. Every step says who acts: a person, a deterministic rule, an AI, or a gate.</span></div><span class="r18-mix">${["human","auto","ai","gate"].map(k=>`<span class="pill mute">${lab[k]} ${pr.counts[k]||0}</span>`).join("")}</span></div>
  ${pid?`<div class="pl-card glass r18-pcard">${G(()=>R17PD.card(pid),"")}</div>`:dg?`<div class="r17pd-wrap tscroll">${dg.svg}</div>`:""}
  <div class="tscroll"><table class="tbl r18-t"><thead><tr><th>#</th><th>Step</th><th>Who acts</th><th>What happens</th><th>Produces</th></tr></thead><tbody>${pr.steps.map((s,i)=>`<tr><td class="num">${i+1}</td><td><b>${H(s.n)}</b></td><td>${pill(lab[s.who],s.who==="ai"?"info":s.who==="gate"?"warn":s.who==="auto"?"good":"mute")}</td><td>${H(s.d)}</td><td>${H(s.out)}</td></tr>`).join("")}</tbody></table></div>
  <div class="row r18-actrow">${m.confirmed||a.status==="review"||a.status==="certified"?pill("Confirmed by the owner","good"):`<button type="button" class="btn primary" data-r18-conf="${H(a.id)}">Confirm this process</button>`}${pid?`<button type="button" class="btn quiet" data-pl-open="${H(pid)}">Open the full process page</button>`:""}<button type="button" class="btn quiet" data-go="flw_design">Workflow designer</button><button type="button" class="btn quiet" data-go="flw_bpmn">BPMN model</button><button type="button" class="btn quiet" data-go="plat_proc">Process library</button></div></section>`}
function dataTab(a){const s=G(()=>R18.access.rowsFor(a.id),[]);const sc=R18.scale(a.id);
 const rows=s.map(r=>`<tr><td><b>${H(r.label)}</b><small class="muted">${H(r.entity)}</small></td><td>${H(r.group)}</td><td>${pill(r.cls,r.cls==="personal"||r.cls==="confidential"?"warn":"mute")}</td><td>${pill(r.state,r.tone)}</td><td class="n">${r.act}</td></tr>`).join("");
 return `<div class="r18-two"><section class="card glass"><div class="cardhead"><div><h3>Data this build needs from the enterprise</h3><span class="muted small">Each source has an authoritative owner. Access is requested once and each owner group approves its own data.</span></div><button type="button" class="btn primary" data-r18-reqapp="${H(a.id)}">Request access</button></div>
  ${rows?`<div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Source</th><th>Approved by</th><th>Class</th><th>Access</th><th class="n"></th></tr></thead><tbody>${rows}</tbody></table></div>`:`<p class="muted">This build uses no enterprise data.</p>`}</section>
 <section class="card glass"><div class="cardhead"><div><h3>What it would own</h3><span class="muted small">Data this build creates that others could rely on.</span></div></div>
  ${sc.owns.length?sc.owns.map(e=>`<div class="r18-na"><i class="r18-pip s-${e.approved?"active":"drafted"}"></i><span><b>${H(e.id)}</b><small>${H(e.why||"")}. ${e.approved?"Data council approved it as authoritative.":"Waiting for the data council to confirm it as the authoritative source."}</small></span></div>`).join(""):`<p class="muted small">Nothing yet. It reads shared data and writes only its own working records.</p>`}
  ${sc.dups.length?sc.dups.map(e=>`<div class="r18-na"><i class="r18-pip s-missing"></i><span><b>${H(e.id)}</b><small>Duplicates ${H(e.dupOf)}. Use the registered table instead.</small></span></div>`).join(""):""}</section></div>`}
function metricsTab(a){const me_=R18.metrics(a.id),mt=R18.maturity(a.id);
 const mrows=me_.map(x=>`<tr><td><b>${H(x.n)}</b></td><td class="r18-f">${H(x.f)}</td><td class="n num">${x.cur}${H(x.u)}</td><td class="n num">${x.tgt}${H(x.u)}</td><td>${pill(x.st==="good"?"On target":x.st==="warn"?"Watch":"Off target",x.st)}</td><td class="r18-f">${H(x.rule)}</td></tr>`).join("");
 const ladder=R18.LEVELS.map((l,i)=>{const c=mt.levels[i],todo=c.filter(z=>!z.ok).length,done=!todo,here=mt.lvl===i+1,next=i+1===mt.lvl+1;const tag=done?(here?"Complete · you are here":"Complete"):todo+" to do"+(next?" · next":"")+(i+1===mt.tgt?" · target":"");return `<li class="r18-lv ${done?"done":""} ${here?"here":""} ${next?"next":""}"><span class="r18-lvn" aria-hidden="true">${done?"&#10003;":i+1}</span><div class="r18-lvb"><div class="r18-lvh"><b>${H(l[0])}</b><span class="r18-lvt">${tag}</span></div><small>${H(l[1])}</small><ul class="r18-ck">${c.map(z=>`<li class="${z.ok?"ok":"no"}"><i aria-hidden="true">${z.ok?"&#10003;":""}</i><span>${H(z.t)}<em class="sr-only">${z.ok?" (done)":" (to do)"}</em></span></li>`).join("")}</ul></div></li>`}).join("");
 return `<section class="card glass"><div class="cardhead"><div><h3>Metrics with formulas</h3><span class="muted small">Each has a formula, a target and a rule for acting on the trend. This is the path to automating outcomes on thresholds.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Metric</th><th>Formula</th><th class="n">Now</th><th class="n">Target</th><th>Status</th><th>When the trend turns</th></tr></thead><tbody>${mrows}</tbody></table></div></section>
 <section class="card glass"><div class="cardhead"><div><h3>Maturity roadmap</h3><span class="muted small">Generated for this process. You are at level ${mt.lvl} of 5; the target for a ${H(a.tier)}-tier build is level ${mt.tgt}.</span></div>${bar(mt.lvl,mt.tgt)}</div><ol class="r18-lvs">${ladder}</ol></section>`}
function debtTab(a){const d=R18.debt(a.id);
 return `<section class="card glass"><div class="cardhead"><div><h3>Technical debt register</h3><span class="muted small">Shortcuts taken today that may limit how far this build can scale. Each one names the decision, what it costs later and the fix.</span></div>${pill(d.length+" open",d.length?"warn":"good")}</div>
 ${d.length?`<div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Decision made today</th><th>What it costs later</th><th>Fix</th><th>Owner</th><th>Severity</th></tr></thead><tbody>${d.map(x=>`<tr><td><b>${H(x.decision)}</b><small class="muted">${H(x.src)}</small></td><td>${H(x.impact)}</td><td>${H(x.fix)}</td><td>${x.owner?H(x.owner):'<span class="r18-gap">Nobody</span>'}</td><td>${pill(x.sev,SEV[x.sev]||"mute")}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">No open debt.</p>`}
 <div class="row r18-actrow"><button type="button" class="btn quiet" data-go="plat_gate">Open the approval gate</button><button type="button" class="btn quiet" data-go="plat_debt">Platform debt register</button></div></section>`}
function valueBox(a){const v=R18.value(a.id);
 return `<div data-r18-valbox><div class="statrow">${[["Hours returned a month",v.hours.toLocaleString("en-US"),a.users+" users × "+ST.mins+" min a week"],["Value of that time",usd(v.gross),"at $"+ST.rate+" an hour (illustrative)"],["Run cost a month",usd(v.cost),"platform plus AI usage"],["Modeled net a month",usd(v.net),"value minus cost"]].map(x=>`<div class="stat"><small><span>${H(x[0])}</span></small><span class="num" data-role="metric">${H(x[1])}</span><em>${H(x[2])}</em></div>`).join("")}</div>
  <div class="r18-inputs"><label class="small"><span class="muted">Minutes saved per user per week</span><input class="fin" type="number" min="0" max="600" step="5" value="${ST.mins}" data-r18-mins aria-label="Minutes saved per user per week"></label><label class="small"><span class="muted">Loaded cost per hour ($)</span><input class="fin" type="number" min="0" max="500" step="1" value="${ST.rate}" data-r18-rate aria-label="Loaded cost per hour in dollars"></label><span class="pill info">Modeled, not measured</span></div></div>`}
function scaleTab(a){const sc=R18.scale(a.id),m=R18.meta(a.id);
 const q=(t,body)=>`<div class="r18-q"><b>${H(t)}</b><div>${body}</div></div>`;
 return `<section class="card glass"><div class="cardhead"><div><h3>Can this scale to others in the enterprise?</h3><span class="muted small">Five questions the platform answers for every build, so a solution made for one job can help the rest of the organization.</span></div>${pill(sc.ready?"Looks ready":"Not yet",sc.ready?"good":"mute")}</div>
 ${q("Does anyone else do this work?",sc.similar.length||sc.procs.length?[...sc.similar.map(b=>`<span class="r18-lk" data-r18-app="${H(b.id)}" tabindex="0" role="button">${H(b.n)} (${H(R18.meta(b.id).fn)})</span>`),...sc.procs.map(p=>`<span class="r18-lk" data-r18-proc="${H(p.id)}" tabindex="0" role="button">${H(p.name)} process</span>`)].join(" "):`<span class="muted">No similar build or process found.</span>`)}
 ${q("What is it the authoritative source for?",sc.owns.length?sc.owns.map(e=>H(e.id)).join(", ")+" (pending data council approval)":'<span class="muted">Nothing. It reads shared data and keeps only working records.</span>')}
 ${q("What does it need from across the enterprise?",sc.needs.length?sc.needs.map(n=>`${H(n.label)} <span class="muted">(${H(n.owner)}, ${H(n.cls)})</span>`).join("; "):'<span class="muted">Nothing outside its own records.</span>')}
 ${q("How should the data be secured?",H(sc.sec))}
 ${q("Who is accountable if it scales?",m.owner&&m.backup?`${H(m.owner)}, with ${H(m.backup)} as backup. Support moves to a team group before enterprise tier.`:'<span class="r18-warn">No owner and backup yet. Name both before offering it to other teams.</span>')}</section>
 <section class="card glass"><div class="cardhead"><div><h3>Value, cost and risk</h3><span class="muted small">Edit the two assumptions to see the balance change. Risk comes from open gate checks and high-severity debt.</span></div>${pill("Risk score "+R18.value(a.id).risk+" of 100",R18.value(a.id).risk>40?"bad":R18.value(a.id).risk>15?"warn":"good")}</div>${valueBox(a)}
 <div class="row r18-actrow"><button class="btn primary" type="button" data-go="plat_gate">Request to offer it to more teams</button></div></section>`}
function appScreen(){
 const a=R18.app(ST.app)||R18.apps()[0];if(!a)return `<div class="screen">${hero("Make · App record","No builds yet","Build something first.")}</div>`;ST.app=a.id;
 const m=R18.meta(a.id),st=STAGE[a.status]||STAGE.idea,cov=R18.coverage(a.id);
 const tabs=["Guardrails","Process","Data and access","Metrics and maturity","Risk and debt","Scale, value and risk"];
 return `<div class="screen r18-screen">${hero("Make · My builds / "+H(m.fn),H(a.n),H(a.purpose),`<div class="row r18-hrow">${pill(st[0],st[1])}${pill(a.tier+" tier","mute")}<span class="r18-hm">Built by <b>${H(a.builder||"")}</b></span><span class="r18-hm">Owner <b>${m.owner?H(m.owner):"none"}</b>, backup <b>${m.backup?H(m.backup):"none"}</b></span><span class="r18-hm"><b>${a.users||0}</b> users</span>${pick()}</div>`)}
 ${typeof views==="function"?views("r18av",tabs,[guardrailsTab(a),processTab(a),dataTab(a),metricsTab(a),debtTab(a),scaleTab(a)]):guardrailsTab(a)}</div>`}
REG("r18_app","App record","make","M4 5h16v14H4zM4 10h16M9 10v9",appScreen);
/* DC-38: every build's process is registered at load, not when its App record is first opened, so process counts do not depend on clicks */
G(()=>{const all=()=>R18.apps().forEach(a=>G(()=>ensureProc(a,R18.process(a.id),R18.meta(a.id)),null));if(window.PROCLIB&&PROCLIB.get)all()},null);

/* ============================ Maturity roadmaps ============================ */
function matureScreen(){const L=R18.apps().filter(a=>a.status!=="sunset");const rows=L.map(a=>({a,mt:R18.maturity(a.id)}));
 const avg=rows.length?(rows.reduce((s,r)=>s+r.mt.lvl,0)/rows.length).toFixed(1):"0";const below=rows.filter(r=>r.mt.lvl<r.mt.tgt).length;
 return `<div class="screen r18-screen">${hero("Make · My builds / Maturity","Where each build is on the way to a higher level","Every process gets a generated maturity model: what each level means for this build and the next steps to reach it. Targets follow the tier a build is meant for.")}
 ${typeof kpiRow==="function"?kpiRow([["Average level",avg+" of 5","across "+rows.length+" builds"],["Below target",below,"need work before the next tier",{cls:below?"warn":""}],["At target or above",rows.length-below,"ready for the next review"]]):""}
 <section class="card glass"><div class="cardhead"><div><h3>Roadmap by build</h3><span class="muted small">Select a build for the full roadmap.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Build</th><th>Level</th><th>Target</th><th>Next steps to reach the next level</th></tr></thead><tbody>${rows.map(r=>`<tr class="r18-row" tabindex="0" data-r18-app="${H(r.a.id)}" data-r18-tab="3"><td><b>${H(r.a.n)}</b><small class="muted">${H(R18.meta(r.a.id).fn)}</small></td><td>${bar(r.mt.lvl,r.mt.tgt)} <span class="num">${r.mt.lvl}</span></td><td class="num">${r.mt.tgt}</td><td>${r.mt.next.length?H(r.mt.next.slice(0,2).join("; ")):"At the top level"}</td></tr>`).join("")}</tbody></table></div></section>
 <section class="card glass"><div class="cardhead"><div><h3>What the levels mean</h3></div></div><ol class="r18-lvs r18-lvs-flat">${R18.LEVELS.map((l,i)=>`<li class="r18-lv"><b>Level ${i+1}: ${H(l[0])}</b><small>${H(l[1])}</small></li>`).join("")}</ol></section></div>`}
REG("r18_mature","Maturity roadmaps","make","M4 20V10M10 20V4M16 20v-8M22 20V7M2 20h20",matureScreen);

/* ============================ Risk and debt across builds ============================ */
function debtScreen(){const L=R18.apps().filter(a=>a.status!=="sunset");const all=[];L.forEach(a=>R18.debt(a.id).forEach(d=>all.push(Object.assign({a},d))));
 const sevN=s=>all.filter(x=>x.sev===s).length;const ord={High:0,Medium:1,Low:2};all.sort((x,y)=>(ord[x.sev]-ord[y.sev])||x.a.n.localeCompare(y.a.n));
 return `<div class="screen r18-screen">${hero("Make · My builds / Risk and debt","Shortcuts taken today that may limit scale tomorrow","Every build keeps a register of the decisions it made to keep things simple, what each could cost later and how to fix it. Nothing is hidden; the point is to decide on purpose.")}
 ${typeof kpiRow==="function"?kpiRow([["Open items",all.length,"across "+L.length+" builds"],["High severity",sevN("High"),"block offering the build to more teams",{cls:sevN("High")?"crit":""}],["Medium",sevN("Medium"),"fix before the next review",{cls:sevN("Medium")?"warn":""}],["Builds with none",L.filter(a=>!R18.debt(a.id).length).length,"clean"]]):""}
 <section class="card glass"><div class="cardhead"><div><h3>Register</h3><span class="muted small">Highest severity first.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Build</th><th>Decision made today</th><th>What it costs later</th><th>Fix</th><th>Severity</th></tr></thead><tbody>${all.map(x=>`<tr class="r18-row" tabindex="0" data-r18-app="${H(x.a.id)}" data-r18-tab="4"><td><b>${H(x.a.n)}</b></td><td>${H(x.decision)}</td><td>${H(x.impact)}</td><td>${H(x.fix)}</td><td>${pill(x.sev,SEV[x.sev]||"mute")}</td></tr>`).join("")||'<tr><td colspan="5" class="muted">No open debt.</td></tr>'}</tbody></table></div></section></div>`}
REG("r18_debt","Risk and debt","make","M12 3l9 16H3zM12 10v4M12 17h.01",debtScreen);

/* ============================ events ============================ */
D.addEventListener("click",e=>{
 const k=e.target.closest&&e.target.closest("[data-r18-kill]");if(k){const id=k.dataset.r18Kill;R18.kill.set(id,!R18.kill.on(id));G(()=>toast(R18.kill.on(id)?"Build stopped":"Build running again",R18.kill.on(id)?"warn":"good"));render();return}
 const c=e.target.closest&&e.target.closest("[data-r18-conf]");if(c){ST.conf[c.dataset.r18Conf]=true;G(()=>audit("Confirmed process",(R18.app(c.dataset.r18Conf)||{}).n));G(()=>toast("Process confirmed by the owner","good"));render();return}
 const r=e.target.closest&&e.target.closest("[data-r18-reqapp]");if(r){ST.app=r.dataset.r18Reqapp;ST.reqFor=ST.app;G(()=>R18.access.startFor(ST.app));return}
 const t=e.target.closest&&e.target.closest("tr[data-r18-app][data-r18-tab]");if(t){S.v=S.v||{};S.v.r18av=+t.dataset.r18Tab;setTimeout(()=>{try{render()}catch(x){}},0)}});
D.addEventListener("change",e=>{
 const p=e.target.closest&&e.target.closest("[data-r18-pickapp]");if(p){ST.app=p.value;render();return}
 const o=e.target.closest&&e.target.closest("[data-r18-objsel]");if(o){ST.obj[ST.app]=o.value;G(()=>audit("Linked build to objective",(R18.app(ST.app)||{}).n+" → "+(o.value||"none")));render()}});
D.addEventListener("input",e=>{const m=e.target.closest&&e.target.closest("[data-r18-mins],[data-r18-rate]");if(!m)return;const v=Math.max(0,+m.value||0);if(m.hasAttribute("data-r18-mins"))ST.mins=v;else ST.rate=v;
 const box=D.querySelector("[data-r18-valbox]");if(!box)return;const a=R18.app(ST.app);if(!a)return;const act=D.activeElement,which=act&&(act.hasAttribute("data-r18-mins")?"mins":"rate");
 const tmp=D.createElement("div");tmp.innerHTML=valueBox(a);const nb=tmp.firstChild;const sr=box.querySelector(".statrow"),nr=nb.querySelector(".statrow");if(sr&&nr)sr.innerHTML=nr.innerHTML});
})();
