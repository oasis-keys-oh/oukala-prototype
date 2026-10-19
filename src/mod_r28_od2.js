/* ===== mod_r28_od2: Agent Action (working name). Part 2 of 2: screens and events. Screen id: orgdesign. Prefix od.
   Primary lens is the COO; CFO, CHRO and CIO are views of the same plan. Tabs: COO brief, Sources, Diagnose, Hypotheses, Gaps and options, Roadmap, Adoption and impact.
   Prototype limits, stated on screen: 10-K parsing is keyword and structure parsing in the browser; no connectors are live; every adoption and impact actual is simulated. ===== */
(function(){
const W=window,D=document;
const X=W.ODX;if(!X)return;
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const r0=Math.round,r1=n=>Math.round(n*10)/10,sum=a=>a.reduce((s,x)=>s+x,0),avg=a=>a.length?sum(a)/a.length:0;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const U=(v,u)=>v+(u==="%"?"%":" "+u);
const TABS=["COO brief","Sources","Diagnose","Hypotheses","Gaps and options","Roadmap","Adoption and impact"];
const LENS={coo:{n:"COO",q:"What changes in how work runs, by when, and what could go wrong?",order:["ops","org","exp","sc","tech","data","fin","gov"]},
 cfo:{n:"CFO",q:"What does it cost, what comes back, and when?",order:["fin","ops","sc","tech","data","org","exp","gov"]},
 chro:{n:"CHRO",q:"Who is affected, how do they get ready, and who leads?",order:["org","exp","ops","gov","data","sc","tech","fin"]},
 cio:{n:"CIO",q:"What do we connect, what do we keep, and what do we retire?",order:["tech","data","ops","gov","sc","fin","exp","org"]}};
const SRC={fact:"Prototype fact",modeled:"Modeled",hyp:"Hypothesis",sim:"Simulated"};
const pill=k=>`<span class="od-src od-${k}" title="${E(({fact:"Computed from the prototype's sample organization",modeled:"Computed from a stated assumption",hyp:"A working default or judgment, not a benchmark",sim:"Illustrative. Not measured from a live system"})[k])}">${SRC[k]}</span>`;
const dimN=k=>G(()=>X.DIMS.find(d=>d.k===k).n,k);
const DEFS=()=>({tab:0,lens:"coo",posture:"stay",choice:{},hyp:{},filings:null,fsel:0,ref:"itil",month:6,gsel:"G07",gdim:"all",prf:"all",lsort:"pct",rdim:"all"});
const OD=()=>{const s=W.S=W.S||{};if(!s.od)s.od={};const d=DEFS();for(const k in d)if(!(k in s.od))s.od[k]=d[k];return s.od};
const filings=()=>{const o=OD();if(!o.filings){o.filings=X.SAMPLE.map(f=>({name:f.name,fict:true,parsed:X.parseFiling(f.text,f.name,true)}))}return o.filings};
const bar=(p,c)=>`<span class="od-bar"><i class="${c||""}" style="width:${clamp(p,0,100)}%"></i></span>`;
const stLabel={pass:"Meets",watch:"Watch",fail:"Gap",na:"n/a"};
const dimOrder=()=>LENS[OD().lens].order;

/* ---------- 0: the COO brief ---------- */
function brief(){
 const o=OD(),A=X.after(o.hyp),P=X.people(),L=LENS[o.lens];
 const rows=X.GAPS.map(g=>{const k=X.choiceOf(g,o.posture,o.choice),op=X.options(g)[k];return{g,k,op,sc:g.reach*(op.val||0)/(op.eff+8)}}).filter(r=>r.k!=="leave").sort((a,b)=>b.sc-a.sc).slice(0,6);
 const outside=X.O2C.steps.filter(s=>!s.in).length;
 const augH=r0(sum(P.map(p=>p.aug)));
 const steps=X.roadmap(o.posture,o.choice);
 const ad=adoptionAll(steps,o.month);
 return `<div class="od-grid4">
  <div class="card glass od-tile"><span class="od-k">Average workload</span><b>${r0(avg(P.map(p=>p.pct)))}%</b><span class="od-s">${P.filter(p=>p.pct>100).length} of ${P.length} people above 100%</span>${pill("fact")}</div>
  <div class="card glass od-tile"><span class="od-k">Order-to-cash steps outside the system</span><b>${outside} of ${X.O2C.steps.length}</b><span class="od-s">Sample process, fictional</span>${pill("modeled")}</div>
  <div class="card glass od-tile"><span class="od-k">Hours a week an agent could take</span><b>${augH}</b><span class="od-s">of ${r0(sum(P.map(p=>p.tot)))} hours logged</span>${pill("modeled")}</div>
  <div class="card glass od-tile"><span class="od-k">Using the new way at month ${o.month}</span><b>${ad.using}%</b><span class="od-s">Built is not the same as used</span>${pill("sim")}</div></div>
 <div class="card glass"><div class="cardhead"><div><h3>How will you treat the ERP?</h3><span class="muted small">This choice changes every recommendation below. Most clients do not have an ideal state; they have a direction and a pace.</span></div></div>
  <div class="od-post">${Object.keys(X.POSTURES).map(k=>`<button class="od-pc ${o.posture===k?"on":""}" data-od="posture|${k}" aria-pressed="${o.posture===k}"><b>${E(X.POSTURES[k].n)}</b><span>${E(X.POSTURES[k].d)}</span></button>`).join("")}</div></div>
 <div class="card glass"><div class="cardhead"><div><h3>What I recommend first</h3><span class="muted small">Ranked by modeled value for effort, for the posture you chose. Each is a hypothesis you can overrule.</span></div>${pill("modeled")}</div>
  <div class="od-list">${rows.map(r=>`<button class="od-row" data-od="gap|${r.g.id}"><span class="od-dim">${E(dimN(r.g.dim))}</span><span class="od-t"><b>${E(r.g.t)}</b><span>${E(X.why(r.g,o.posture,r.k))}</span></span><span class="od-opt od-o-${r.k}">${E(r.op.n)}</span></button>`).join("")}</div></div>
 <div class="card glass"><div class="cardhead"><div><h3>The roadmap on a page</h3><span class="muted small">Steps by wave. Each step is discrete, owned and measured. Open the Roadmap tab for the activities.</span></div></div>
  <div class="od-waves">${X.WAVES.map(w=>{const s=steps.filter(x=>x.wave===w.k);return `<div class="od-wv"><b>${E(w.n)}</b><span class="od-sp">${E(w.span)}</span><span class="od-d">${E(w.d)}</span><div class="od-chips">${dimOrder().map(d=>{const n=s.filter(x=>x.dim===d).length;return n?`<button class="od-ch" data-od="tab|5">${E(dimN(d))} ${n}</button>`:""}).join("")||'<span class="muted small">Nothing in this wave</span>'}</div></div>`}).join("")}</div></div>
 <div class="card glass od-honest"><b>What is real in this prototype and what is not</b><p>Org, workload, time and agent figures are computed from the prototype's sample organization (fictional Meridian Standards Foundation). Gaps, options, effort and value shares are modeled with working defaults. Sample filings are fictional; text you add is parsed in your browser only. No connector to an ERP, HR system or ticketing tool is live, and every adoption and impact figure is simulated.</p></div>`}

/* ---------- 1: sources ---------- */
function sources(){
 const o=OD(),F=filings(),agg=X.themeAgg(F),R=X.REFS[o.ref],st=X.stats();
 const agents=X.agents(),runs=sum(agents.map(a=>a.runs));
 const card=(t,s,c,k)=>`<div class="card glass od-src-c"><div class="cardhead"><h3>${t}</h3><span class="od-st od-st-${k}">${s}</span></div><p>${c}</p></div>`;
 return `<div class="od-grid5">
  ${card("Filings (10-K style)",F.length+" read","Sample filings are fictional. Add your own below; text is read in this browser and not stored.","ok")}
  ${card("Reference architecture",E(R.n),"Choose below. Used to name the activities each gap and step belongs to.","ok")}
  ${card("Org chart",X.people().length+" staff, "+Object.keys(X.units()).length+" units","Live from the prototype's sample organization.","ok")}
  ${card("Transactions and outcomes",runs+" agent runs","Agent run history from the prototype. No ERP or ticketing connector is live.","part")}
  ${card("Strategy","3 sample pillars","Grow member trust, publish faster, spend less per standard. Fictional.","ok")}</div>
 <div class="card glass"><div class="cardhead"><div><h3>Add a filing</h3><span class="muted small">Drop a 10-K as .txt, .htm or .html. It is split into Items, and themes, risks and headcount mentions are extracted by keyword and structure. A language model is not connected.</span></div></div>
  <label class="od-drop" data-od-drop><input type="file" data-od-file accept=".txt,.htm,.html,.md" multiple hidden><b>Drop files here or choose</b><span>Real filings are public documents. Keep customer-confidential material out.</span></label>
  <div class="od-list">${F.map((f,i)=>{const p=f.parsed;return `<button class="od-row ${o.fsel===i?"on":""}" data-od="fsel|${i}"><span class="od-dim">${f.fict?"Fictional sample":"Added by you"}</span><span class="od-t"><b>${E(f.name)}</b><span>${p.words.toLocaleString()} words, ${p.secs.length} sections found${p.emp?", mentions about "+E(p.emp)+" employees":""}</span></span><span class="od-opt">${i===o.fsel?"Open":"View"}</span></button>`}).join("")}</div>
  ${F[o.fsel]?filingDetail(F[o.fsel].parsed):""}</div>
 <div class="card glass"><div class="cardhead"><div><h3>Strategy signals across the filings</h3><span class="muted small">Mentions per 10,000 words, averaged. Used to show which hypotheses the filings back.</span></div>${pill("fact")}</div>
  <div class="od-themes">${X.THEMES.map(t=>`<div class="od-th"><span>${E(t.n)}</span>${bar(clamp((agg[t.k]||0)/Math.max(1,...Object.values(agg))*100,0,100))}<b>${agg[t.k]||0}</b></div>`).join("")}</div></div>
 <div class="card glass"><div class="cardhead"><div><h3>Reference architecture</h3><span class="muted small">${E(R.note)}</span></div>
  <div class="od-seg">${Object.keys(X.REFS).map(k=>`<button class="${o.ref===k?"on":""}" data-od="ref|${k}">${E(X.REFS[k].n)}</button>`).join("")}</div></div>
  <div class="od-grid3">${Object.keys(R.acts).map(k=>`<div class="od-act"><b>${E(R.acts[k][0])}</b><span>${E(R.acts[k][1])}</span></div>`).join("")}</div></div>`}
function filingDetail(p){return `<div class="od-fd"><div><b>Sections</b><ul>${p.secs.map(s=>`<li>Item ${E(s.k)}: ${E(s.t)} (about ${s.w.toLocaleString()} words)</li>`).join("")||"<li>No Items detected</li>"}</ul></div>
 <div><b>Risks it states</b><ul>${p.risks.map(r=>`<li>${E(r)}</li>`).join("")||"<li>None extracted</li>"}</ul></div>
 <div><b>Most used terms</b><p>${p.top.map(E).join(", ")}</p></div></div>`}

/* ---------- 2: diagnose (principles and load) ---------- */
function diagnose(){
 const o=OD(),P=X.people(),rows=X.PR.map(p=>{const v=X.prVal(p);return{p,v,s:X.prStatus(p,v)}});
 const n={pass:0,watch:0,fail:0,na:0};rows.forEach(r=>n[r.s]++);
 const f=o.prf,shown=rows.filter(r=>f==="all"||r.s===f);
 const lsort=o.lsort,S0=P.slice().sort((a,b)=>lsort==="aug"?b.aug-a.aug:lsort==="name"?a.n.localeCompare(b.n):b.pct-a.pct).slice(0,18);
 const ag=X.agents(),hc=sum(P.map(p=>p.cap)),ah=sum(ag.map(a=>a.real));
 return `<div class="card glass"><div class="cardhead"><div><h3>Twenty organizational excellence principles</h3><span class="muted small">Measured on the sample organization. Bands are working defaults for discussion, not published benchmarks. Edit them for your client.</span></div>
  <div class="od-seg">${[["all","All "+rows.length],["fail","Gap "+n.fail],["watch","Watch "+n.watch],["pass","Meets "+n.pass]].map(a=>`<button class="${f===a[0]?"on":""}" data-od="prf|${a[0]}">${a[1]}</button>`).join("")}</div></div>
  <div class="od-table"><div class="od-th2"><span>Principle</span><span>Now</span><span>Band</span><span>Status</span></div>
  ${shown.map(r=>`<details class="od-pr"><summary><span><b>${E(r.p.id)}</b> ${E(r.p.n)}<em>${E(r.p.g)}</em></span><span class="od-v">${r.v==null?"n/a":r.v}</span><span class="od-bd">${E(X.prBand(r.p))}</span><span class="od-pill od-s-${r.s}">${stLabel[r.s]}</span></summary>
   <div class="od-det"><p>${E(r.p.why)}</p><p><b>Measure:</b> ${E(r.p.u)}. <b>Formula:</b> ${E(r.p.f)}. ${pill(r.p.src)}</p>${r.p.hyp&&r.p.hyp.length?`<p><b>Hypotheses that address it:</b> ${r.p.hyp.map(h=>`<button class="od-ch" data-od="tab|3">${E(h)}</button>`).join(" ")}</p>`:""}</div></details>`).join("")}</div></div>
 <div class="card glass"><div class="cardhead"><div><h3>Load: people and agents</h3><span class="muted small">Workload is hours logged against capacity. Augmentable hours assume agents can take about ${r0(X.AUG.rep*100)}% of reporting, ${r0(X.AUG.mtg*100)}% of meetings, ${r0(X.AUG.apr*100)}% of approvals and ${r0(X.AUG.ops*100)}% of operations time, less what is already automated.</span></div>${pill("modeled")}</div>
  <div class="od-grid4"><div class="od-mini"><span>Human capacity</span><b>${r0(hc)} h/wk</b></div><div class="od-mini"><span>Agent hours returned</span><b>${r1(ah)} h/wk</b></div><div class="od-mini"><span>Augmentable, not yet taken</span><b>${r0(sum(P.map(p=>p.aug)))} h/wk</b></div><div class="od-mini"><span>Agents running</span><b>${ag.filter(a=>a.status!=="killed").length} of ${ag.length}</b></div></div>
  <div class="od-cardhead2"><b>People</b><div class="od-seg">${[["pct","By load"],["aug","By augmentable"],["name","By name"]].map(a=>`<button class="${lsort===a[0]?"on":""}" data-od="lsort|${a[0]}">${a[1]}</button>`).join("")}</div></div>
  <div class="od-table">${S0.map(p=>`<div class="od-ld"><span><b>${E(p.n)}</b><em>${E(p.role)} · ${E(p.unit)}</em></span>${bar(p.pct,p.pct>100?"bad":p.pct<50?"warn":"")}<span class="od-v">${p.pct}%</span><span class="od-aug">${p.aug} h augmentable</span></div>`).join("")}</div>
  <div class="od-cardhead2"><b>AI agents</b></div>
  <div class="od-table"><div class="od-th2 od-agh"><span>Agent</span><span>Plan h/wk</span><span>Realized</span><span>Runs</span><span>Accepted</span><span>Tier</span></div>
  ${ag.map(a=>`<div class="od-th2 od-agr"><span><b>${E(a.name)}</b><em>Sponsor ${E(a.sponsor||"none")}</em></span><span>${a.plan}</span><span>${r1(a.real)}</span><span>${a.runs}</span><span>${a.acc}%</span><span>${E(a.tier)}</span></div>`).join("")}</div></div>`}

/* ---------- 3: hypotheses and before/after ---------- */
function hypotheses(){
 const o=OD(),A=X.after(o.hyp),agg=X.themeAgg(filings());
 const ba=(n,b,a,u,better)=>`<div class="od-ba"><span>${n}</span><b>${b}${u||""}</b><i>→</i><b class="${a===b?"":"od-chg"}">${a}${u||""}</b></div>`;
 return `<div class="card glass"><div class="cardhead"><div><h3>If you accept these</h3><span class="muted small">Before and after, from the hypotheses you accept. Accept one below to see the change. Modeled. Each change needs a person's decision in a real engagement.</span></div>${pill("modeled")}</div>
  <div class="od-grid3">${ba("Average workload",A.load[0],A.load[1],"%")}${ba("People above 100%",A.over[0],A.over[1])}${ba("People below 50%",A.under[0],A.under[1])}${ba("Average span",A.span[0],A.span[1])}${ba("Managers as share of staff",A.mgrShare[0],A.mgrShare[1],"%")}${ba("AI agents",A.agents,A.agentsA)}${ba("Reporting and admin share of hours",A.adminPct[0],A.adminPct[1],"%")}<div class="od-ba"><span>Agent hours a week added</span><b>${A.agentHrs}</b></div></div></div>
 <div class="od-hl">${X.hyps().map(h=>{const st=o.hyp[h.id]||"proposed",th=X.THEMES.filter(t=>t.hy.indexOf(h.id)>=0).map(t=>[t,X.signalLevel(agg,t.k)]).filter(x=>x[1]==="high"||x[1]==="medium");
  return `<div class="card glass od-hy od-hs-${st}"><div class="cardhead"><div><span class="od-hid">${h.id}</span><h3>${E(h.t)}</h3></div><span class="od-conf" title="A judgment, not a statistic">Confidence ${h.conf.toFixed(2)}</span></div>
  <p>${E(h.why)}</p>
  <div class="od-meta"><span>${h.ch==="agent"?"Agent hypothesis":h.ch==="human"?"Organizational hypothesis":"Mixed hypothesis"}</span>${h.agent?`<span>Agent: ${E(h.agent)}${h.tier?" ("+h.tier+" tier)":""}</span>`:""}<span>${h.n} ${h.names||h.reqs?"items":"people"}</span>${h.hrs?`<span>${h.hrs} h/wk (${h.fte} FTE)</span>`:""}${h.freed?`<span>Frees ${h.freed} manager roles</span>`:""}</div>
  <div class="od-meta">${h.pr.map(p=>`<button class="od-ch" data-od="tab|2">${p}</button>`).join("")}${th.map(x=>`<span class="od-sig">10-K signal: ${E(x[0].n)} (${x[1]})</span>`).join("")}</div>
  <details><summary>Evidence</summary><p class="small">${E((h.aff.slice(0,12).map(a=>a.n+" ("+(a.hrs>0?"-":"+")+Math.abs(a.hrs)+" h)").join(", "))||((h.names||h.reqs||[]).slice(0,12).join(", "))||"No named evidence")}</p></details>
  <div class="od-act2"><button class="btn ${st==="accepted"?"primary":""}" data-od="hyp|${h.id}|accepted">Accept</button><button class="btn" data-od="hyp|${h.id}|rejected">Reject</button><button class="btn" data-od="hyp|${h.id}|proposed">Reset</button><span class="od-stt">${st==="accepted"?"Accepted":st==="rejected"?"Rejected":"Proposed"}</span></div></div>`}).join("")}</div>`}

/* ---------- 4: gaps and options ---------- */
function gaps(){
 const o=OD(),dims=dimOrder(),list=X.GAPS.filter(g=>o.gdim==="all"||g.dim===o.gdim).sort((a,b)=>dims.indexOf(a.dim)-dims.indexOf(b.dim));
 const g=X.gapById(o.gsel)||list[0]||X.GAPS[0],opts=X.options(g),rec=X.recommend(g,o.posture),pick=X.choiceOf(g,o.posture,o.choice),m=X.measure(g.id);
 const oc=k=>{const p=opts[k];return `<div class="od-oc ${pick===k?"pick":""} ${rec===k?"rec":""}"><div class="od-och"><b>${E(p.n)}</b>${rec===k?'<span class="od-r">Recommended</span>':""}${pick===k&&pick!==rec?'<span class="od-r">Your choice</span>':""}</div><p>${E(p.d)}</p>
  <div class="od-ocm"><span>Effort <b>${k==="leave"?"none":p.eff+" person-weeks"}</b></span><span>Value captured <b>${r0(p.val*100)}%</b></span><span>Risk <b>${p.risk} of 5</b></span><span>${E(p.rev)}</span>${k==="leave"?`<span>Carrying cost <b>about ${p.carry} h/wk</b></span>`:""}</div>
  <button class="btn ${pick===k?"primary":""}" data-od="choose|${g.id}|${k}">${pick===k?"Chosen":"Choose this"}</button></div>`};
 return `<div class="od-split"><div class="od-gl"><div class="od-seg od-wrap"><button class="${o.gdim==="all"?"on":""}" data-od="gdim|all">All</button>${dims.map(d=>`<button class="${o.gdim===d?"on":""}" data-od="gdim|${d}">${E(dimN(d))}</button>`).join("")}</div>
  ${list.map(x=>{const k=X.choiceOf(x,o.posture,o.choice);return `<button class="od-row ${x.id===g.id?"on":""}" data-od="gap|${x.id}"><span class="od-dim">${E(dimN(x.dim))}</span><span class="od-t"><b>${E(x.t)}</b></span><span class="od-opt od-o-${k}">${E(X.options(x)[k].n)}</span></button>`}).join("")}</div>
  <div class="od-gd"><div class="card glass"><span class="od-dim">${E(dimN(g.dim))} · ${g.id}</span><h3>${E(g.t)}</h3>
   <div class="od-nn"><div><span>Where they are</span><p>${E(g.now)}</p></div><div><span>Next target state</span><p>${E(g.next)}</p></div></div>
   <div class="od-meta">${pill(g.src)}<span>Size ${g.size} of 5</span><span>Reach ${g.reach} of 5</span><span>${["Not tied to the ERP","Touches the ERP","Depends on the ERP"][g.erp]}</span>${g.hy.map(h=>`<button class="od-ch" data-od="tab|3">${h}</button>`).join("")}</div>
   <p class="od-why"><b>Why ${E(X.options(g)[rec].n.toLowerCase())}.</b> ${E(X.why(g,o.posture,rec))}</p>
   <div class="od-opts">${["rebuild","bridge","leave"].map(oc).join("")}</div>
   ${m?`<div class="od-meas"><b>How you will know</b> ${E(m.n)}: ${U(m.base,m.u)} to ${U(m.target,m.u)} ${pill(m.src)}</div>`:""}
   <div class="od-act2"><button class="btn primary" data-od="build|${g.id}">Build the fix in VibeCheck</button><span class="muted small">Opens VibeCheck with this gap and the chosen option. The agent gets a box: tier, budget, confidence floor and a kill switch.</span></div></div>
  ${g.id==="G07"?o2c(o):""}</div></div>`}
function o2c(o){
 const S0=X.O2C.steps,now=X.o2cStats("now"),br=X.o2cStats("bridge"),rb=X.o2cStats("rebuild");
 const col=(t,s,sub)=>`<div class="od-cmp"><b>${t}</b><span>${s.inSys} of ${s.total} steps in the system</span><span>${s.min} min of handling</span><span>${s.days} days to cash</span><span>${s.weeks?s.weeks+" person-weeks":"No build"}</span><span>Risk ${s.risk} of 5</span><em>${sub}</em></div>`;
 return `<div class="card glass"><div class="cardhead"><div><h3>Order to cash: rebuild it, or cover the four gaps?</h3><span class="muted small">Sample process. Four of seven steps happen outside the system. Minutes and days are modeled.</span></div>${pill("modeled")}</div>
  <div class="od-o2c">${S0.map((s,i)=>`<div class="od-st2 ${s.in?"in":"out"}"><i>${i+1}</i><b>${E(s.n)}</b><span>${E(s.who)} · ${s.min} min</span><em>${s.in?"In the system":E(s.note)}</em>${s.in?"":`<span class="od-bridge">Bridge: ${E(s.bridge)}</span>`}</div>`).join("")}</div>
  <div class="od-cmps">${col("Today",now,"Keep the workarounds")}${col("Cover the gaps",br,"Four bridges around the ERP")}${col("Rebuild order to cash",rb,"New process, cut over")}</div>
  <p class="od-why">${o.posture==="replace"?"Because you are replacing the ERP, rebuilding is on the table. Run the bridge first so the new process is designed from measured reality, not memory.":"Covering the gaps reaches most of the benefit in about a third of the effort, can be undone, and leaves the ERP untouched. Each bridge also records what the ERP actually does, which is what makes a later decision to wean off it cheap."}</p></div>`}

/* ---------- adoption model (change management measurement). Simulated: the curve is illustrative, not observed. ---------- */
const STAGES=[["Aware","Know what is changing and why","Pulse survey: % who can state the change and the reason"],["Ready","Have a role in it and time to learn","Readiness check: % with manager sign-off and time booked"],["Trained","Completed the role-specific training","Training records: % of the audience completed"],["Using","Do the work the new way","System logs: % of cases handled through the new path"],["Proficient","Do it well without help","Override rate, rework rate and help requests against a threshold"],["Sustained","Have not slipped back to the old way","Reversion rate after 60 days: % still on the new path"]];
const RF={org:.8,exp:.95,fin:.9,tech:1,data:.85,sc:.8,ops:.95,gov:.9};
const DU={org:null,exp:["Membership","Publishing and licensing","Standards development"],fin:["Finance","Internal audit"],tech:["Platform engineering","Architecture","Security"],data:["Data and analytics"],sc:["Commercial","Distribution"],ops:["Service desk and operations","Change and release","Platform engineering"],gov:["Legal and compliance","Security","Internal audit"]};
const START={0:0,1:3,2:6,3:12};
const audience=d=>{const U=X.units();if(!DU[d])return X.people().length;return sum(DU[d].map(u=>(U[u]||[]).length))};
function stepAdopt(s,month){
 const t0=START[s.wave],rf=RF[s.dim]||.9;if(month<t0)return null;
 const st=STAGES.map((x,i)=>{const t=(month-t0-i*.8)/2.5;return r0(clamp(t,0,1)*100*(i>=3?rf:1))});
 const built=r0(clamp((month-t0-2)/2,0,1)*100);
 return{st:st,built:built,lag:built-st[3]}}
function adoptionAll(steps,month){
 const live=steps.filter(s=>s.gap&&s.type!=="Extract"&&s.type!=="Retire"&&s.type!=="Harden");
 const per=live.map(s=>({s,a:stepAdopt(s,month)})).filter(x=>x.a);
 const byDim={};X.DIMS.forEach(d=>{const xs=per.filter(x=>x.s.dim===d.k);byDim[d.k]=xs.length?{n:xs.length,aud:audience(d.k),st:STAGES.map((_,i)=>r0(avg(xs.map(x=>x.a.st[i])))),built:r0(avg(xs.map(x=>x.a.built)))}:null});
 return{using:per.length?r0(avg(per.map(x=>x.a.st[3]))):0,started:per.length,total:live.length,byDim:byDim,per:per}}

/* ---------- 5: roadmap ---------- */
function roadmap(){
 const o=OD(),steps=X.roadmap(o.posture,o.choice),dims=dimOrder(),rd=o.rdim||"all";
 return `<div class="card glass"><div class="cardhead"><div><h3>${E(X.POSTURES[o.posture].n)}: a step-by-step transition</h3><span class="muted small">Generated from your options and posture. Each step is discrete, owned and measured. Change the choice on the Gaps tab and this changes with it. Open a step for its activities.</span></div>
  <div class="od-seg od-wrap"><button class="${rd==="all"?"on":""}" data-od="rdim|all">All</button>${dims.map(d=>`<button class="${rd===d?"on":""}" data-od="rdim|${d}">${E(dimN(d))}</button>`).join("")}</div></div></div>
 ${X.WAVES.map(w=>{const ws=steps.filter(s=>s.wave===w.k&&(rd==="all"||s.dim===rd)).sort((a,b)=>dims.indexOf(a.dim)-dims.indexOf(b.dim));
  return `<div class="card glass od-wave"><div class="cardhead"><div><h3>Wave ${w.k}: ${E(w.n)}</h3><span class="muted small">${E(w.span)}. ${E(w.d)}</span></div><span class="od-conf">${ws.length} steps</span></div>
  ${ws.map(s=>{const a=stepAdopt(s,o.month);return `<details class="od-step"><summary><span class="od-dim">${E(dimN(s.dim))}</span><span class="od-ty">${E(s.type)}</span><b>${E(s.title)}</b>${s.eff?`<em>${s.eff} person-weeks, modeled</em>`:""}</summary>
   <div class="od-sb"><div><span class="od-k">Activities</span><ol>${s.acts.map(x=>`<li>${E(x)}</li>`).join("")}</ol></div>
   <div><span class="od-k">Owner</span><p>${E(s.owner)}</p>${s.measure?`<span class="od-k">Measure</span><p>${E(s.measure.n)}: ${U(s.measure.base,s.measure.u)} to ${U(s.measure.target,s.measure.u)} ${pill(s.measure.src)}</p>`:""}
   ${s.retrain?`<span class="od-k">Retraining</span><p>${E(s.retrain)}. Audience ${audience(s.dim)} people.</p>`:""}
   ${s.agent?`<span class="od-k">AI agent</span><p>${E(s.agent)}${s.box?`<br>Box: ${s.box.tier} tier, run budget ${s.box.budget} a month (sample), confidence floor ${s.box.floor}, kill switch for ${E(s.box.kill)}.`:""}</p>`:""}
   <span class="od-k">Change adoption</span><p>${a?`Using ${a.st[3]}%, built ${a.built}% at month ${o.month} (simulated).`:`Starts month ${START[s.wave]}.`}</p></div></div></details>`}).join("")||'<p class="muted small">Nothing in this wave for this dimension.</p>'}</div>`}).join("")}`}

/* ---------- 6: adoption and impact ---------- */
function impact(){
 const o=OD(),steps=X.roadmap(o.posture,o.choice),A=adoptionAll(steps,o.month),HA=X.after(o.hyp);
 const per=A.per.filter(x=>x.s.measure);
 const returned=r1(HA.agentHrs*A.using/100);
 const stuck=X.DIMS.filter(d=>A.byDim[d.k]&&A.byDim[d.k].built-A.byDim[d.k].st[3]>=35).sort((x,y)=>(A.byDim[y.k].built-A.byDim[y.k].st[3])-(A.byDim[x.k].built-A.byDim[x.k].st[3])).slice(0,3);
 return `<div class="card glass od-sim"><b>Simulated.</b> No ERP, HR or ticketing connector is live in this prototype. The curves below show what the measurement would look like, so the definitions and the flags can be reviewed. In an engagement the baselines are frozen on a date and actuals come from system logs, surveys and training records.</div>
 <div class="card glass"><div class="cardhead"><div><h3>Month ${o.month} of 24</h3><span class="muted small">Move the slider to see the program progress.</span></div></div>
  <input type="range" min="0" max="24" value="${o.month}" data-od-month aria-label="Program month" class="od-range"><div class="od-grid4">
  <div class="od-mini"><span>Steps started</span><b>${A.started} of ${A.total}</b></div><div class="od-mini"><span>Using the new way</span><b>${A.using}%</b></div><div class="od-mini"><span>Agent hours returned</span><b>${returned} h/wk</b></div><div class="od-mini"><span>Of the modeled</span><b>${HA.agentHrs} h/wk</b></div></div>
  <p class="od-why">${stuck.length?`<b>Built but not used, largest gaps:</b> ${stuck.map(d=>E(d.n)).join(", ")}. The technology is live and people are not yet using it. This is where value leaks, and it is a change-management problem, not a build problem.`:"Adoption is keeping pace with what is built."}</p></div>
 <div class="card glass"><div class="cardhead"><div><h3>Measuring change adoption</h3><span class="muted small">Six stages for each group. Every stage has a definition, so it can be measured and owned.</span></div>${pill("sim")}</div>
  <div class="od-table"><div class="od-ocmh"><span></span>${STAGES.map(s=>`<span title="${E(s[1])}">${s[0]}</span>`).join("")}</div>
  ${dimOrder().map(d=>{const b=A.byDim[d];return `<div class="od-ocmr"><span><b>${E(dimN(d))}</b><em>${b?b.n+" steps, "+b.aud+" people":"Not started"}</em></span>${STAGES.map((_,i)=>`<span>${b?`<i class="od-heat" style="--h:${b.st[i]}">${b.st[i]}%</i>`:"-"}</span>`).join("")}</div>`}).join("")}</div>
  <details><summary>How each stage is measured</summary><ul class="od-defs">${STAGES.map(s=>`<li><b>${s[0]}.</b> ${E(s[1])}. ${E(s[2])}.</li>`).join("")}<li><b>Leading signals.</b> First-week use, help requests per user, override rate on agent suggestions, and manager check-ins held.</li></ul></details></div>
 <div class="card glass"><div class="cardhead"><div><h3>Measures: baseline, target and simulated actual</h3><span class="muted small">Each measure has an owner, a formula and a dated baseline. Actuals follow adoption: nothing improves until people use it.</span></div>${pill("sim")}</div>
  <div class="od-table"><div class="od-th2 od-mh"><span>Measure</span><span>Baseline</span><span>Target</span><span>Actual</span><span>Owner</span></div>
  ${per.length?per.map(x=>{const m=x.s.measure,act=m.base+(m.target-m.base)*x.a.st[3]/100;return `<div class="od-th2 od-mr"><span><b>${E(m.n)}</b><em>${E(dimN(x.s.dim))} · ${E(x.s.type)} · formula: ${E(m.f)}</em></span><span>${U(m.base,m.u)}</span><span>${U(m.target,m.u)}</span><span><b>${U(r1(act),m.u)}</b>${bar(clamp(Math.abs(act-m.base)/Math.max(1,Math.abs(m.target-m.base))*100,0,100))}</span><span>${E(x.s.owner)}</span></div>`}).join(""):'<p class="muted small">No measured steps have started at this month.</p>'}</div>
  <div class="od-act2"><button class="btn" data-od="dl">Download the plan (JSON)</button></div></div>`}

/* ---------- the screen ---------- */
function body(){
 const o=OD(),L=LENS[o.lens],P=[brief,sources,diagnose,hypotheses,gaps,roadmap,impact][o.tab]||brief;
 let html;try{html=P()}catch(e){html=`<div class="card glass"><b>This tab could not render.</b><p class="muted small">${E(e&&e.message||e)}</p></div>`;console.error("orgdesign",e)}
 return `<div class="od-lens" role="group" aria-label="Lens"><span class="od-k">View as</span>${Object.keys(LENS).map(k=>`<button class="${o.lens===k?"on":""}" data-od="lens|${k}" aria-pressed="${o.lens===k}">${LENS[k].n}${k==="coo"?" (primary)":""}</button>`).join("")}<span class="od-q">${E(L.q)}</span></div>
 <div class="od-tabs" role="tablist">${TABS.map((t,i)=>`<button role="tab" class="${o.tab===i?"on":""}" aria-selected="${o.tab===i}" data-od="tab|${i}"><i>${i+1}</i>${E(t)}</button>`).join("")}</div>
 <div class="od-pane">${html}</div>`}
function screen(){OD();return `<div class="screen od-screen">${hero("Operations and strategy","Agent Action (working name)","Start with the operator's questions: how does the work run today, what do we change first, and how will we know people changed? Ingests filings and a reference architecture, reads the org and its load, and proposes a transition. Not an ideal org chart. A gap-by-gap path with options, a roadmap, and adoption you can measure.",`<div class="row"><span class="od-src od-sim">Prototype: sample data and simulated actuals</span></div>`)}<div id="odRoot">${body()}</div></div>`}
function paint(keepScroll){const r=D.getElementById("odRoot");if(!r)return;const y=W.scrollY;r.innerHTML=body();if(keepScroll)W.scrollTo(0,y)}
function buildFix(gid){const o=OD(),g=X.gapById(gid),k=X.choiceOf(g,o.posture,o.choice),op=X.options(g)[k],bx=X.box(g),m=X.measure(gid);
 const t=`Build a fix for this gap. Gap: ${g.t}. Today: ${g.now}. Next target: ${g.next}. Chosen option: ${op.n}. ${op.d}. ERP posture: ${X.POSTURES[o.posture].n}. Give any agent a box: ${bx.tier} tier, monthly run budget ${bx.budget} (sample), confidence floor ${bx.floor}, kill switch for ${bx.kill}.${m?" Measure: "+m.n+", baseline "+U(m.base,m.u)+", target "+U(m.target,m.u)+".":""}`;
 if(W.STUDIO&&W.STUDIO.open)W.STUDIO.open(t);else go("studio")}
function dl(){const o=OD(),steps=X.roadmap(o.posture,o.choice);const data={workingName:"Agent Action",note:"Prototype export. Sample data, modeled effort, simulated actuals.",posture:o.posture,lens:o.lens,hypotheses:X.hyps().map(h=>({id:h.id,title:h.t,status:o.hyp[h.id]||"proposed",confidence:h.conf})),gaps:X.GAPS.map(g=>({id:g.id,dimension:dimN(g.dim),title:g.t,choice:X.choiceOf(g,o.posture,o.choice)})),steps:steps.map(s=>({id:s.id,wave:s.wave,dimension:dimN(s.dim),type:s.type,title:s.title,activities:s.acts,owner:s.owner,measure:s.measure}))};
 const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=D.createElement("a");a.href=URL.createObjectURL(b);a.download="org-redesign-plan.json";D.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function readFiles(files){const o=OD();filings();[].slice.call(files).forEach(f=>{const r=new FileReader();r.onload=()=>{o.filings.push({name:f.name,fict:false,parsed:X.parseFiling(String(r.result||""),f.name,false)});o.fsel=o.filings.length-1;paint(true)};r.readAsText(f)})}
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-od]");if(!t||!D.getElementById("odRoot"))return;
 const a=t.dataset.od.split("|"),o=OD();
 switch(a[0]){
  case"tab":o.tab=+a[1];paint();W.scrollTo(0,0);break;
  case"lens":o.lens=a[1];paint(true);break;
  case"posture":o.posture=a[1];o.choice={};paint(true);break;
  case"ref":o.ref=a[1];paint(true);break;
  case"fsel":o.fsel=+a[1];paint(true);break;
  case"prf":o.prf=a[1];paint(true);break;
  case"lsort":o.lsort=a[1];paint(true);break;
  case"hyp":o.hyp[a[1]]=a[2];paint(true);break;
  case"gap":o.gsel=a[1];o.tab=4;paint();W.scrollTo(0,0);break;
  case"gdim":o.gdim=a[1];paint(true);break;
  case"rdim":o.rdim=a[1];paint(true);break;
  case"choose":o.choice[a[1]]=a[2];paint(true);break;
  case"build":buildFix(a[1]);break;
  case"dl":dl();break}});
D.addEventListener("input",e=>{const t=e.target;if(t&&t.matches&&t.matches("[data-od-month]")){OD().month=+t.value;paint(true);const r=D.querySelector("[data-od-month]");if(r)r.focus()}});
D.addEventListener("change",e=>{const t=e.target;if(t&&t.matches&&t.matches("[data-od-file]")&&t.files)readFiles(t.files)});
D.addEventListener("dragover",e=>{if(e.target.closest&&e.target.closest("[data-od-drop]"))e.preventDefault()});
D.addEventListener("drop",e=>{if(e.target.closest&&e.target.closest("[data-od-drop]")){e.preventDefault();if(e.dataTransfer&&e.dataTransfer.files)readFiles(e.dataTransfer.files)}});
G(()=>REG("orgdesign","Agent Action","people","M4 6h16M4 12h10M4 18h6M17 14l3 3-3 3",screen));
G(()=>NAVX.add("orgdesign",{group:"strat",label:"Agent Action",hint:"Gap by gap, from where you are to the next target state",sub:"Org, work and change",kw:"agent action org redesign restructure span of control agents transition roadmap erp bridge gap coo change management adoption ocm 10-K reference architecture principles load"}));
})();
