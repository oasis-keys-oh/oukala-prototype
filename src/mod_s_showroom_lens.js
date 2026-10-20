/* ===== mod_s_showroom_lens: one lens mechanism for the Showroom (backlog DC-05 shared lens, DC-07 COO lens, DC-28 the other seven).
   A lens is configuration, not code: which screens (beats, in order), which metrics (shown in the talk track) and which wording
   (the question, the balance and the spoken lines). It reuses the executive lenses of mod_r18e_lens (R18.LENSES): applying a lens
   sets that lens, the role it is told from, and a lens cut of the tour. Beats reuse existing tour beats by reference
   ("coo/set.1") or name an existing screen inline; no new screen is built. Prefix: srl-. ===== */
(function(){
const W=window;const SHOW=W.SHOW;if(!SHOW)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
G(()=>{if(W.R18&&R18.LENS_OF)R18.LENS_OF.clo="clo"}); /* the CLO role reads its own lens (DC-28) */

/* the lens beat every cut shares: the r18_lens screen with this lens selected */
const lensBeat=(id,short,line)=>({id:"lens."+id,act:"Lens",point:short+" lens: value, cost and risk on one page",secs:70,go:"r18_lens",setup:"lens:"+id,
 say:[line,"Every figure on it is modeled from the sample builds and labeled illustrative."],do:"Switch to another lens and back.",claims:["modeled"]});

/* ---------- the lenses (configuration) ----------
   id, short, name, r18 (lens id in R18.LENSES), persona (role key), q, metrics (METRICS ids), beats (refs or inline beats),
   say (beat id -> two sentences, overrides the reused beat's wording), tab (beat id -> tab, overrides) */
const LENSES=[
{id:"coo",short:"COO",name:"Chief Operating Officer",r18:"coo",persona:"coo",q:"Where does work stall, and what is ready to scale?",
 metrics:["m_delivery","m_ops","m_ontime"],
 beats:["coo/set.1",lensBeat("coo","COO","The COO lens weighs throughput against the cost to serve."),"coo/demand.1","coo/track.1","coo/deliver.1",
  {id:"coo.od",act:"Deliver",point:"Agent Action: the COO brief behind the build plan",secs:90,go:"orgdesign",tab:"COO brief",
   say:["Agent Action starts from the COO's brief and walks through sources, diagnosis, gaps and a roadmap.","The options are modeled from the sample organization, and none of the agents is running."],
   do:"Open Gaps and options.",claims:["modeled","simulated"]},
  "coo/deliver.4","coo/build.1"],
 say:{"set.1":["These are the objectives the COO is held to, each with an owner and a measure.","The alignment score is a sample value, so treat it as modeled."]}},
{id:"cfo",short:"CFO",name:"Chief Financial Officer",r18:"cfo",persona:"cfo",q:"Where is the money going, and is it controlled?",
 metrics:["m_fin","m_burn","m_budvar"],
 beats:[lensBeat("cfo","CFO","The CFO lens weighs spend against value realized and money outside control."),"coo/fund.1",
  {id:"cfo.spend",act:"Fund",point:"Spend along the org chart, by domain and type",secs:80,go:"r18_spend",
   say:["Enterprise spend shows forecast against approved for every domain and executive.","The dollars are sample values, so present them as modeled."],
   do:"Switch from By domain to By type.",claims:["modeled"]},
  {id:"cfo.approve",act:"Decide",point:"Approve a funding request as the right approver group",secs:90,go:"bud_req",setup:"budreq:BR-0106",approve:{kind:"budget_request",id:"BR-0106"},
   say:["Each request routes to an approver group by its stage and amount, and only a member can decide.","The tour switches to a finance approver so the click passes; the requester could never approve it."],
   do:"Press Approve in the request drawer.",claims:["fact","modeled"]},
  {id:"cfo.ben",act:"Track",point:"Benefits promised against benefits realized",secs:80,go:"bud_ben",
   say:["Every funded benefit has an owner, a checkpoint and a realized amount.","The amounts are modeled sample values and the misses are flagged."],
   do:"Open Needs attention.",claims:["modeled"]},
  "coo/track.1"],
 tab:{"track.1":"CFO"},say:{"track.1":["The CFO view leads with forecast against budget and spend outside control.","The figures are the same numbers the COO sees, cut for finance."]}},
{id:"ceo",short:"CEO",name:"Chief Executive Officer",r18:"ceo",persona:"ceo",q:"How does every function enable our strategy?",
 metrics:["m_biz_renew","m_budvar","m_biz_cycle"],
 beats:["coo/set.1","coo/cascade.1",
  {id:"ceo.strat",act:"Cascade",point:"Each function and the objectives it advances",secs:80,go:"r18_strategy",
   say:["Every build names the objective it advances, so you see which functions carry the strategy.","Objectives with no work behind them show as gaps; the value figures are modeled."],
   do:"Switch from By objective to By function.",claims:["modeled"]},
  lensBeat("ceo","CEO","The CEO lens weighs strategic progress against what it costs."),"coo/track.1",
  {id:"ceo.board",act:"Report",point:"The board pack cites the record behind each claim",secs:80,go:"exe_board",
   say:["The board pack is generated from the same records, and each claim links to its source.","It is sample content for the fictional Meridian board."],
   do:"Open the citation on one claim.",claims:["modeled","fact"]}],
 tab:{"track.1":"CEO"},say:{"track.1":["The CEO view leads with mission, members and money.","The figures are the same numbers every executive sees."]}},
{id:"cio",short:"CIO",name:"Chief Information Officer",r18:"cio",persona:"exec",q:"How do I stop sprawl without blocking builders?",
 metrics:["m_itsm_sla","m_avail","m_mttr"],
 beats:[lensBeat("cio","CIO","The CIO lens weighs productivity against run cost and technical debt."),"coo/demand.1",
  {id:"cio.builds",act:"Build",point:"Every build in one inventory IT can see",secs:80,go:"r18_builds",
   say:["Every build made by a team shows here with its owner, its guardrails and what it needs.","The builds and their value are sample data, so treat the figures as modeled."],
   do:"Open Need action.",claims:["modeled","fact"]},
  {id:"cio.gate",act:"Build",point:"Nothing promotes past a failed conformance gate",secs:80,go:"plat_gate",tab:"Conformance gate",
   say:["A citizen app is promoted only when its gate passes, including a named owner and a different backup.","The gate checks run in the prototype; the apps are sample data."],
   do:"Open one failing check.",claims:["fact"]},
  "coo/track.1","coo/build.1"],
 tab:{"track.1":"CIO"},say:{"track.1":["The CIO view leads with service health, delivery and run cost.","The figures are the same numbers the COO sees, cut for technology."]}},
{id:"ciso",short:"CISO",name:"Chief Information Security Officer",r18:"ciso",persona:"ciso",q:"Can I prove control without blocking people?",
 metrics:["m_grc_risk_app","m_access","m_grc_ctl_cov"],
 beats:[lensBeat("ciso","CISO","The CISO lens weighs control proven against friction and cost."),
  {id:"ciso.guard",act:"Control",point:"One register of every guardrail and where it is enforced",secs:90,go:"guard",tab:"Register",
   say:["Each guardrail names its owner, the check that enforces it and whether it is enforced, partial or planned.","Enforcement is simulated where the register says so; nothing here is a certification."],
   do:"Filter to the partial guardrails.",claims:["fact","simulated"]},
  {id:"ciso.iam",act:"Control",point:"Separation of duties conflicts, found before they are granted",secs:80,go:"r15_iam",tab:"Separation of duties",
   say:["Role combinations that break separation of duties are listed with their owners.","The people and grants are fictional sample data."],
   do:"Open the open conflict.",claims:["modeled","fact"]},
  {id:"ciso.risk",act:"Risk",point:"Risks above appetite, each with an owner",secs:70,go:"grc_risk",
   say:["The register scores inherent and residual risk and flags those above appetite.","Scores are sample values, so present them as modeled."],
   do:"Open the highest residual risk.",claims:["modeled"]},
  {id:"ciso.evidence",act:"Prove",point:"Evidence for every control in one read-only room",secs:70,go:"r15d_evidence",
   say:["Controls, approvals, the audit trail and decisions sit in one index an auditor can read.","The audit chain is kept in memory in the prototype, so it is simulated."],
   do:"Press Verify the chain.",claims:["simulated","fact"]}]},
{id:"chro",short:"CHRO",name:"Chief Human Resources Officer",r18:"chro",persona:"chro",q:"How does work shift between people and AI?",
 metrics:["m_org_hc_plan","m_biz_hire","m_trainc"],
 beats:[lensBeat("chro","CHRO","The CHRO lens weighs capacity freed against how work changes for people."),"coo/deliver.3",
  {id:"chro.cap",act:"Capacity",point:"Who is over capacity, and where the bench is",secs:80,go:"ppl_cap",
   say:["Capacity is planned by person and by team, against the work already funded.","The loads are sample values, so treat them as modeled."],
   do:"Open Over capacity.",claims:["modeled"]},
  {id:"chro.train",act:"Skills",point:"Mandatory training and who is ready on day one",secs:70,go:"ppl_train",
   say:["Courses, assignments and completion sit in one place, including AI safe use.","Completion figures are sample data for the fictional organization."],
   do:"Open Assignments and completion.",claims:["modeled"]},
  {id:"chro.perf",act:"Performance",point:"Goals, reviews and calibration in one cycle",secs:70,go:"ppl_perf",
   say:["The performance cycle links goals to reviews and calibration.","The people and ratings are fictional sample data."],
   do:"Open Calibration.",claims:["modeled"]}]},
{id:"caio",short:"CAIO",name:"Chief AI Officer",r18:"caio",persona:"caio",q:"What would a CAIO make us do, done for us?",
 metrics:["m_aiown","m_override","m_aispend"],
 beats:[lensBeat("caio","CAIO","The CAIO lens weighs AI value against AI risk and runs the CAIO duties for you."),
  {id:"caio.tower",act:"Oversee",point:"Every agent, its budget and its kill switch",secs:80,go:"tower",
   say:["The control tower shows every agent with its spend against a daily cap and its guardrails.","Agent runs in the prototype are simulated, and the spend is a sample value."],
   do:"Open the Kill switch tab.",claims:["simulated","modeled"]},
  {id:"caio.runtime",act:"Oversee",point:"Every run checked against tier, budget and confidence",secs:80,go:"ai_runtime",
   say:["The runtime lists each run with the gate it passed or the reason it stopped.","Runs are simulated; the checks are the real prototype checks."],
   do:"Open one stopped run.",claims:["simulated","fact"]},
  {id:"caio.reg",act:"Own",point:"Each agent has an accountable human sponsor",secs:70,go:"r15d_agents",
   say:["The registry names the owner and sponsor of every agent and its governance status.","Agents without an accountable human are counted, never hidden."],
   do:"Sort by governance status.",claims:["fact","modeled"]},
  {id:"caio.value",act:"Value",point:"Hours returned and cost per outcome",secs:70,go:"r17q_value",
   say:["Value realized separates this tenant's own data from the business case model.","Both layers are modeled until real usage data exists."],
   do:"Switch to the business case layer.",claims:["modeled","hypothesis"]},
  "coo/build.1"]},
{id:"clo",short:"CLO",name:"Chief Legal Officer",r18:"clo",persona:"clo",q:"Where are we exposed, and what slows decisions down?",
 metrics:["m_biz_contract","m_biz_lic","m_grc_pol_ack"],
 beats:[lensBeat("clo","CLO","The CLO lens weighs exposure against the speed of the business."),
  {id:"clo.sow",act:"Contracts",point:"Contracts read for traps before they renew",secs:80,go:"ppm_sow",
   say:["The analyzer reads each contract for auto-renewal traps, obligations and terms against the playbook.","The analysis is simulated and the contracts are fictional samples."],
   do:"Open Obligations and calendar.",claims:["simulated","modeled"]},
  {id:"clo.exc",act:"Exposure",point:"Exceptions and acceptances, each with an expiry",secs:70,go:"grc_exc",
   say:["Every accepted exception has an owner and an expiry date.","Expiring exceptions come up for a decision before they lapse."],
   do:"Open the exception that expires first.",claims:["fact","modeled"]},
  {id:"clo.pol",act:"Policy",point:"Who has not acknowledged a policy yet",secs:60,go:"grc_pol",
   say:["Policies carry an owner, a version and acknowledgement by the people they apply to.","Acknowledgement rates are sample values."],
   do:"Open the policy with the lowest acknowledgement.",claims:["modeled"]},
  {id:"clo.doa",act:"Authority",point:"The amount decides who may approve",secs:70,go:"bud_doa",
   say:["The delegation of authority matrix picks the approver tier from the amount and the kind of spend.","Try it shows who would approve a sample request."],
   do:"Press Try it: who approves this?",claims:["fact"]},
  {id:"clo.evidence",act:"Prove",point:"Evidence of every approval and decision",secs:60,go:"r15d_evidence",
   say:["Approvals, decisions and exports are in one read-only index.","The audit chain is simulated in the prototype."],
   do:"Open the Approvals tab.",claims:["simulated","fact"]}]}];

/* ---------- mechanism ---------- */
const BYL={};LENSES.forEach(l=>BYL[l.id]=l);
const r18Lens=id=>G(()=>R18.LENSES.find(x=>x.id===id),null);
function lensOf(id){const l=BYL[id];if(!l)return null;const r=r18Lens(l.r18)||{};
 return Object.assign({},l,{q:l.q||r.q,balance:l.balance||r.balance,screens:cutOf(l).beats.map(b=>b.go)})}
/* apply: the lens on R18 (every lens strip and the Executive lenses screen), the role it is told from, remembered */
function applyLens(id,o){o=o||{};const l=BYL[id];if(!l)return false;
 if(!o.keepPersona&&l.persona&&G(()=>S.persona,null)!==l.persona&&!o.quiet)G(()=>NAVX.persona.set(l.persona));
 G(()=>{R18.st.lens=l.r18;R18.st.lensBy=S.persona});G(()=>U.store.set("showroom.lens",id));
 if(!o.quiet)G(()=>render());return true}
function refBeat(ref){const [d,b]=String(ref).split("/");const t=G(()=>SHOW.byId(d).beats.find(x=>x.id===b),null);return t?JSON.parse(JSON.stringify(t)):null}
function cutOf(l){const beats=l.beats.map(x=>typeof x==="string"?refBeat(x):JSON.parse(JSON.stringify(x))).filter(Boolean).map(b=>{
  if(l.say&&l.say[b.id])b.say=l.say[b.id].slice();if(l.tab&&l.tab[b.id])b.tab=l.tab[b.id];delete b.kids;return b});
 return{id:"lens-"+l.id,title:l.short+" lens",group:"lens",lens:l.id,persona:l.persona,tenant:"core",who:l.name,
  mins:Math.round(beats.reduce((a,b)=>a+b.secs,0)/60),
  blurb:"The same platform told for the "+l.name+": "+l.q+" Screens, metrics and wording come from the lens configuration; the data is the fictional Meridian sample.",beats}}
function register(){LENSES.forEach(l=>SHOW.add(cutOf(l)))}
register();
Object.assign(SHOW,{lenses:LENSES,lensOf,applyLens,lensCut:id=>SHOW.byId("lens-"+id)});

/* ---------- Showroom home: the lens list ---------- */
const chips=l=>(l.metrics||[]).map(id=>G(()=>{const m=METRICS[id];return m?`<span class="srl-m">${E(m.n)} <b>${E(mfmt(m))}</b></span>`:""},"")).join("");
SHOW.home.push(()=>`<section class="sr-card glass srl" aria-label="Executive lenses"><div class="sr-ch"><h3>Executive lenses</h3><span class="sr-pill">Configuration only</span></div>
 <p class="muted small">A lens picks the screens, the metrics and the wording for one executive. Starting a lens cut switches the role it is told from and the lens on every lens strip. Metric values are modeled sample values.</p>
 <div class="srl-grid">${LENSES.map(l=>{const d=SHOW.byId("lens-"+l.id);return `<article class="srl-c"><div class="srl-h"><b>${E(l.short)}</b><span class="muted small">${E(l.name)}</span></div>
  <p class="small">${E(l.q)}</p><div class="srl-ms">${chips(l)}</div><p class="muted small">${d.beats.length} beats, ${SHOW.fmt(d.total)}</p>
  <div class="row"><button type="button" class="btn primary sm" data-sr-start="lens-${E(l.id)}">Start the ${E(l.short)} cut</button><button type="button" class="btn quiet sm" data-srl-apply="${E(l.id)}">Apply lens only</button></div></article>`}).join("")}</div></section>`);
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-srl-apply]");if(!t)return;applyLens(t.dataset.srlApply);G(()=>toast(BYL[t.dataset.srlApply].short+" lens applied, viewing as "+G(()=>PERSONAS[S.persona].n,""),"info"))});
})();
