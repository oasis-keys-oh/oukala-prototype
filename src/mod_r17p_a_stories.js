/* ===== Round 17, Agent P (part 1 of 3): Tour content. One data array (STORIES), the live proof registry (PROOF), the moment ids, and the schema check.
   Nothing here touches the DOM. Numbers are never typed into story text: a proof chip and the {token} markers in presenter notes read the live
   registries at run time (FACTS, METRICS, AGENTS_STATE, PROCLIB, ATLAS and others). Parts 2 and 3 are mod_r17p_b_engine.js and mod_r17p_c_screen.js. ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined||v===null?d:v}catch(e){return d}};
const R=W.R17P=W.R17P||{};
const nf=n=>Number(n).toLocaleString("en-US");

/* ---------------------------------------------------------------- proof registry ----------------------------------------------------------------
   Each entry reads a live registry when asked. f returns a number or a short string; undefined means "does not resolve" (counted in the health metric). */
const MET=id=>{const m=G(()=>METRICS[id],null);if(!m||m.cur===undefined||m.cur===null||isNaN(+m.cur))return undefined;return G(()=>mfmt(m),String(m.cur)+(m.u||""))};
const metProof=(id,l)=>({l,src:"METRICS "+id,f:()=>MET(id)});
const PROOF=R.PROOF={
 screens:{l:"screens in this build",src:"SCREENS registry",f:()=>SCREENS.length},
 processes:{l:"documented processes",src:"PROCLIB.stats()",f:()=>nf(PROCLIB.stats().processes)},
 procCover:{l:"modules with a defined process",src:"PROCLIB.stats()",f:()=>{const s=PROCLIB.stats();return s.modulesCovered+" of "+s.modules}},
 maturity:{l:"average process maturity, scale 1 to 5",src:"PROCLIB.stats().avgMaturity",f:()=>PROCLIB.stats().avgMaturity},
 agents:{l:"AI agents registered",src:"FACTS agents.registered",f:()=>FACTS.get("agents.registered")},
 agentsWorking:{l:"agents working this hour",src:"FACTS agents.working",f:()=>FACTS.get("agents.working")},
 agentBlocked:{l:"agent runs blocked by a control, budget or missing backup",src:"AGENTRT.runs()",f:()=>AGENTRT.runs().filter(r=>r.state==="blocked").length},
 approvals:{l:"approvals open across the tenant",src:"INBOX.counts()",f:()=>nf(INBOX.counts().approval)},
 groups:{l:"approver groups",src:"APG.groups()",f:()=>APG.groups().length},
 apgCov:metProof("m_r16_apg_cov","approval steps routed to a group"),
 perm:{l:"permission rules in one model: row, table and field",src:"PERM.state",f:()=>PERM.state.rules.length+PERM.state.fields.length},
 flows:{l:"documented flows between modules",src:"MODMAP.stats()",f:()=>nf(MODMAP.stats().nf)},
 modules:{l:"modules on the platform map",src:"MODMAP.stats()",f:()=>MODMAP.stats().n},
 workflows:{l:"workflows in the catalog",src:"FLOWX.stats()",f:()=>nf(FLOWX.stats().workflows)},
 automation:{l:"of work steps done by an agent or automation",src:"FLOWX.stats()",f:()=>FLOWX.stats().automationPct+"%"},
 contract:{l:"features at full contract",src:"CONTRACT.stats()",f:()=>{const s=CONTRACT.stats();return s.fullContract+" of "+s.features}},
 owners:{l:"things with a named owner and backup",src:"OWNX.stats()",f:()=>{const s=OWNX.stats();return Math.round(100*(s.total-s.gapRecs)/s.total)+"%"}},
 events:{l:"event types on the bus",src:"EVENTS.list()",f:()=>EVENTS.list().length},
 tables:{l:"tables in the data model",src:"DATAMODEL.tables",f:()=>Object.keys(DATAMODEL.tables).length},
 metrics:{l:"metrics, each with a formula and an owner",src:"METRICS",f:()=>Object.keys(METRICS).length},
 stratCover:metProof("m_sx_cover","of funded dollars reach a goal"),
 orphan:metProof("m_sx_orphan","orphan spend"),
 demand:{l:"ranked requests for new work",src:"DEMAND",f:()=>DEMAND.length},
 spi:metProof("m_spi","schedule performance index"),
 budVar:metProof("m_budvar","forecast variance to approved budget"),
 brCycle:metProof("m_br_cycle","budget request cycle time"),
 tbm:metProof("m_tbm_alloc","spend traced to consumers"),
 benefit:metProof("m_benefit","benefits realized to date"),
 decAge:metProof("m_decage","executive decision age"),
 aiSpend:metProof("m_aispend","AI spend against daily cap"),
 chain:metProof("m_r15d_ev_chain","audit chain intact"),
 zl:metProof("m_zl_score","connectivity score"),
 bcPlans:{l:"continuity plans approved",src:"BCX.plans()",f:()=>{const p=BCX.plans();return p.filter(x=>x.status==="Approved").length+" of "+p.length}},
 bcDims:{l:"resilience dimensions assessed",src:"BCX.D().fw.dims",f:()=>BCX.D().fw.dims.length},
 bcApps:{l:"applications in continuity scope",src:"BCX.apps()",f:()=>BCX.apps().length},
 bcEx:{l:"exercises on record or scheduled",src:"BCX.exs()",f:()=>BCX.exs().length},
 bcDecl:{l:"disaster declarations on record",src:"BCX.D().decl",f:()=>BCX.D().decl.length},
 guides:{l:"order guides",src:"OGX.guides",f:()=>OGX.guides.length},
 statuses:{l:"person statuses with an approval group and launch set",src:"STATUS.defs()",f:()=>STATUS.defs().length}
};
/* resolve a proof key to {key,l,src,v,ok}; never throws */
R.proof=function(key){const p=PROOF[key];if(!p)return{key,l:"unknown proof",src:"",v:"",ok:false};
 let v;try{v=p.f()}catch(e){v=undefined}
 const ok=!(v===undefined||v===null||v===""||(typeof v==="number"&&isNaN(v)));
 return{key,l:p.l,src:p.src,v:ok?String(v):"not available",ok}};
/* replace {key} markers in presenter notes with the live value */
R.fill=function(s){return String(s==null?"":s).replace(/\{(\w+)\}/g,(m,k)=>PROOF[k]?R.proof(k).v:m)};
R.tokensOf=s=>(String(s||"").match(/\{(\w+)\}/g)||[]).map(x=>x.slice(1,-1));

/* ---------------------------------------------------------------- stories ----------------------------------------------------------------
   Stop fields:  id, screen, arg?, tab? (label of a tab on the screen, matched from the start), sel? (CSS selector, or "card:Heading text"),
   head (8 words or fewer), see (one sentence), why (one sentence), proof (key or [key,key]), tryit? {label, act} (act is a moment id or an action id),
   notes [talking points], qa [[question,answer]], persona? (switch the viewing role for this stop), needs? (screen id the stop depends on; the stop is
   omitted until that screen exists), */
const S1=[
 {id:"home",screen:"home",sel:"card:How we're doing",head:"One home for the whole IT business",
  see:"A role-based home shows delivery, finance and operations health, the decisions waiting on the person, and what changed.",
  why:"Leaders open one page and see the cause of amber and red instead of a list of tools.",
  proof:["screens","processes"],
  notes:["Every ring opens its formula, owner and trend; nothing on the page is a bare number.","The role switcher in the top bar changes the home, the menu order and the default actions.","{screens} screens and {processes} documented processes sit behind this page."],
  qa:[["Is this real data?","It is a seeded sample tenant (Atlantic Systems). The screens read live registries, so figures move when records change."],["Does it connect to our systems?","The Data sources and integrations screen lists connectors and the import path. This prototype runs without a backend."]]},
 {id:"inbox",screen:"inbox",tab:"Queue",sel:"card:Where it comes from",head:"Approvals go to groups, not people",
  see:"One queue collects approvals, actions and mentions from every module, ranked by urgency, with the deciding group and the clock on each item.",
  why:"Decisions stop waiting on one person's calendar, and the wait is measured.",
  proof:"approvals",tryit:{label:"Raise an approval request",act:"approval"},
  notes:["Every approval routes to an approver group; a person acts only as a member of that group.","The median wait for a decision is a metric with an owner and a remediation, not a feeling.","{approvals} approvals are open in this tenant right now."],
  qa:[["What if the group is unavailable?","Groups carry delegates and escalation rules; the Approval groups screen shows who acted and who can."],["Can approvals happen on a phone?","Yes. Mobile approvals and on-call is a screen of its own, and the phone layout has an Approvals tab."]]},
 {id:"agents",screen:"tower",tab:"Kill switch",sel:".killbox",head:"AI agents run under a kill switch",
  see:"Every agent has a named sponsor and backup, a tier that limits what it may do alone, and a switch that halts it at once.",
  why:"AI work follows the same accountable-human rule as every other kind of work.",
  proof:"agents",tryit:{label:"Trip an agent kill switch",act:"kill"},
  notes:["An agent without a sponsor and a backup cannot run; the runtime blocks it and records why.","Tier 1 suggests, tier 2 acts with approval, tier 3 acts alone above a confidence floor.","{agents} agents are registered and {agentsWorking} are working this hour."],
  qa:[["Who can stop an agent?","A sponsor, the backup, or a platform administrator, and the stop is written to the audit trail."],["Are the agent runs real model calls?","Runs are simulated and labeled as such; the controls, budgets and audit records are real platform behavior."]]},
 {id:"strategy",screen:"strat_exec",tab:"Tree",sel:".sx-goal",head:"Strategy traced to funded work",
  see:"Goals link to the capabilities they depend on, the maturity roadmap, the funded projects and the money behind them.",
  why:"Funding that reaches no goal, and goals with no funded path, show up as named gaps.",
  proof:["stratCover","orphan"],
  notes:["The chain runs goal, capability, roadmap item, project, budget line and work item.","Orphan work is listed with its dollars, so the conversation starts from a number.","Capabilities come from the maturity engine, so levels are not typed in by hand."],
  qa:[["Can goals be changed here?","Goals are edited in Strategy alignment; this view reads them and edits only the links."]]},
 {id:"money",screen:"bud_over",tab:"Overview",sel:"card:From approved to forecast",head:"Money against plan, with the cause",
  see:"Approved budget, forecast and reserve sit side by side, and each variance names the vendor change or decision behind it.",
  why:"Finance and delivery argue from one set of numbers and one cause.",
  proof:"budVar",
  notes:["A variance links to the change order, request or contract line that produced it.","The management reserve is shown with what it can still cover.","Budget lines belong to cost centers and projects through one shared list."],
  qa:[["Does this replace the ERP?","No. It reads actuals and commitments from the ledger and adds forecast, approval and traceability."]]},
 {id:"resilience",screen:"bc_home",sel:"card:Tier 1 readiness",head:"Resilience measured, not assumed",
  see:"Continuity plans, recovery tiers, exercises and gaps are scored from live records for each application.",
  why:"Recovery targets are tested and tracked, so a disaster declaration is not the first test.",
  proof:"bcPlans",tryit:{label:"Declare a disaster (simulated)",act:"disaster"},
  notes:["Tiers come from the CMDB business criticality; exercise rules follow the tier.","Everything in a declaration is simulated and labeled: no message is sent and no system changes.","{bcApps} applications are in scope and {bcEx} exercises are on record or scheduled."],
  qa:[["Is the framework fixed?","No. The framework name and its six dimensions are editable on the Resilience framework screen."]]},
 {id:"contract",screen:"plat_contract",tab:"Dashboard",sel:"card:Where the platform stands",head:"Nothing ships without four rules",
  see:"Every screen, module and citizen app is scored on process, data, metrics and connections, and gaps flow to a debt ledger.",
  why:"The platform stays coherent as it grows, because incomplete features are visible and owned.",
  proof:"contract",
  notes:["The four rules are a process model, a data model with a reuse decision, metrics with maturity, and connections.","A fifth rule, a named human owner and backup, is enforced at the publish gate.","A waiver needs a reason, an owner and an expiry of at most 90 days."],
  qa:[["Who enforces it?","Design-time agents, the publish gate and the runtime matrix on this screen, all reading the same definition."]]},
 {id:"thinking",screen:"r17q_thinking",sel:"hero",needs:"r17q_thinking",head:"The thinking behind the design",
  see:"The design decisions, the alternatives considered and the rules the platform holds itself to are laid out in order.",
  why:"Buyers and builders can inspect the reasoning, not only the result.",
  proof:"modules",
  notes:["Each decision links to the screen where it shows up.","The same page is the source for the decisions log in the project."],
  qa:[["Is it up to date?","It is generated from the platform's own records where possible and edited by named owners where not."]]},
 {id:"value",screen:"r17q_value",sel:"hero",needs:"r17q_value",head:"Value computed from this tenant's data",
  see:"Measured figures come from the registries, and every assumption is editable, labeled as modeled and shows its formula.",
  why:"The business case can be read, challenged and changed in the room.",
  proof:"metrics",
  notes:["Anything from the registries is labeled as from this tenant's data; anything assumed is labeled modeled.","No figure is presented as a measured result unless it is computed here."],
  qa:[["Can we change the assumptions?","Yes. Each modeled assumption is an input and the totals recompute."]]}
];

const S2=[
 {id:"groups",screen:"r16h_groups",tab:"Overview",sel:"card:Where approvals stand",head:"Every approval step names a group",
  see:"Approval steps across the platform are audited, and any step that still names a person is listed for migration to a group.",
  why:"No decision depends on one individual being available.",
  proof:["apgCov","groups"],
  notes:["Groups can be fixed, dynamic (line manager, service owner) or role based.","Quorum, delegates and escalation are set per group.","{groups} approver groups exist and the migration tool moves person-named steps in one action."],
  qa:[["Can a requester approve their own request?","No. Segregation of duties is checked, and a person cannot act on a change to their own status."]]},
 {id:"rules",screen:"r16h_rules",sel:"card:Approval rules",head:"Rules choose the group by condition",
  see:"A rule designer shows the levels, the conditions and the group at each level, tested against a sample record.",
  why:"Amount, risk and type decide who approves, and the policy is readable by an auditor.",
  proof:"groups",
  notes:["Rules bind to record types, so one rule serves invoices, changes, requests and statuses.","Tenant overlays change a rule for one customer without forking the product."],
  qa:[["Who approves a change to a rule?","Rule changes are themselves approvals routed to a group."]]},
 {id:"decide",screen:"flw_appr",sel:"card:How an approval gets decided",head:"How each approval was decided",
  see:"Each approval shows whether a policy, an AI recommendation or a person decided it, with the factors used.",
  why:"Automated approval is allowed where policy says so, and always explained.",
  proof:"automation",
  notes:["Pre-approved, AI-reasoned and human paths are separate and labeled.","A human can always override, and the override rate is tracked as a metric."],
  qa:[["Can AI approve on its own?","Only where a policy pre-approves it. Otherwise AI supplies a recommendation and a group decides."]]},
 {id:"perm",screen:"r16g_perm",tab:"Matrix",sel:"card:One entity, every role",head:"One permission model for everything",
  see:"Tables, rows and attributes are governed in one matrix, with a rule behind every yes and no.",
  why:"Access is defined once, tested by simulation and explained when denied.",
  proof:"perm",
  notes:["The model nests: table, then row, then attribute.","The Simulate tab shows what any persona can do, and Explain gives the rule behind a result.","Sensitive data is denied unless a rule allows it."],
  qa:[["Is this connected to Entra ID?","Identity and access lists the Entra ID groups and how they map to roles."]]},
 {id:"denied",screen:"ppl_perf",sel:"[data-perm-denied]",persona:"ops",head:"Service desk is denied, with a reason",
  see:"The same screen, opened as a service desk lead, shows a denial that names the rule and the group to ask.",
  why:"Least privilege is visible to the person affected, so access requests go to the right place.",
  proof:"perm",
  notes:["The viewing role is switched for this stop and restored on the next.","Every denial is logged for the security review."],
  qa:[["Can the denial be bypassed in the UI?","No. Screens, rows and fields all call the same permission check."]]},
 {id:"runtime",screen:"ai_runtime",tab:"Controls",sel:"card:Kill switch and pause",persona:"exec",head:"Tiers decide what an agent does alone",
  see:"The runtime shows global, tier and per-agent switches, the tier rules and the run audit trail.",
  why:"Autonomy is granted in steps and can be withdrawn instantly.",
  proof:"agentBlocked",tryit:{label:"Trip an agent kill switch",act:"kill"},
  notes:["A control wins over every lifecycle state and is checked before each run.","Daily budget caps stop a run before it starts.","{agentBlocked} runs have been blocked by a control, budget or missing backup."],
  qa:[["Which model do agents use?","The AI gateway routes by policy; the registry records the model per agent."]]},
 {id:"gateway",screen:"adm_gate",sel:"card:Outcomes by AI task",head:"AI spend and routing under policy",
  see:"Outcomes by AI task, cost per outcome, routing policies and per-agent caps are shown against the monthly budget.",
  why:"AI cost is tied to outcomes and capped before it surprises finance.",
  proof:"aiSpend",
  notes:["Routing policies pick a model by task, sensitivity and cost.","Guardrail policies can be tested on the Test panel."],
  qa:[["Is the spend real?","Spend is simulated on the demo clock; the cap and routing logic are the real implementation."]]},
 {id:"evidence",screen:"r15d_evidence",sel:"card:Controls and their evidence",head:"Evidence an auditor can sample",
  see:"Controls, their current evidence and a hash-chained audit trail are available read only, with an export.",
  why:"Audit preparation becomes a view, not a project.",
  proof:"chain",
  notes:["Verify chain recomputes the hashes and reports any break.","The room cannot change a record."],
  qa:[["Which frameworks are covered?","SOC 2, ISO 27001 and the NIST AI Risk Management Framework are the sample control sets."]]}
];

const S3=[
 {id:"align",screen:"exe_strat",tab:"Score",sel:"card:How the alignment score",head:"Is the money pointed at strategy",
  see:"Objectives and key results link to funded initiatives, and an alignment score shows what is covered.",
  why:"Funding debates start from coverage instead of opinion.",
  proof:"stratCover",
  notes:["Objectives without funded work are named, with the reason.","Run budget and change budget are separated."],
  qa:[["Who owns the objectives?","Each objective has a named owner and backup in the ownership registry."]]},
 {id:"gaps",screen:"strat_exec",tab:"Gaps",sel:"card:Gaps",head:"Orphan work and unfunded gaps",
  see:"A gap list shows capabilities below target with no roadmap, and funded work that reaches no goal.",
  why:"The portfolio can be pruned or re-pointed with evidence.",
  proof:"orphan",
  notes:["Each gap links to the record to fix.","A roadmap item moves a capability one maturity level and is delivered by a project."],
  qa:[["Does a gap block funding?","No. It is a visible finding with an owner; blocking rules are set in Funding gates."]]},
 {id:"demand",screen:"port",tab:"Priorities",sel:"card:Ranked demand",head:"Ranked demand against the funding line",
  see:"Requests are scored, ranked and cut at the funding envelope, with person-months checked against capacity.",
  why:"The line between funded and unfunded is explained, including items that carry a hard date.",
  proof:"demand",
  notes:["Scores come from a weighted model that can be edited and back-tested.","Capacity versus demand is a separate tab."],
  qa:[["Can the weights be changed?","Yes. The scoring weights are editable and the ranking recomputes."]]},
 {id:"schedule",screen:"ims",tab:"Overview",sel:"card:Furthest behind baseline",head:"One timeline across projects",
  see:"Schedules for every project sit on one timeline, and shared teams explain why one slip moves another.",
  why:"Cross-project dependencies are visible before they become a missed date.",
  proof:"spi",
  notes:["Schedule performance index is a metric with a formula and owner.","The What changed tab lists slips since the last baseline."],
  qa:[["Does it import from Project Online?","A coverage tab shows what is imported from Project Online and what is not."]]},
 {id:"budget",screen:"bud_over",tab:"Overview",sel:"card:Where the forecast differs",head:"Forecast against approved budget",
  see:"Approved budget, forecast, commitments and reserve are compared by project and category, with the cause of each variance.",
  why:"Variances arrive with an explanation and a decision path.",
  proof:"budVar",
  notes:["Vendor change orders and hosting tiers are traced to budget lines.","The reserve view shows what is left after approved draws."],
  qa:[["Where do actuals come from?","The ledger and the timesheet module; both post to budget lines."]]},
 {id:"requests",screen:"bud_req",tab:"Decision funnel",sel:"card:The decision funnel",head:"Requests decided by group, in stages",
  see:"Budget requests move through a funnel in which small asks skip stages and large ones go to a council.",
  why:"Cycle time and stuck requests are measured per stage.",
  proof:"brCycle",
  notes:["Routing rules are shown and editable; every stage names its approver group.","The slowest stage is flagged against its target."],
  qa:[["Who sits on the council?","The Approval groups screen lists members, quorum and delegates."]]},
 {id:"cost",screen:"tbm_model",sel:"card:From the ledger to the people",head:"Every dollar traced to a consumer",
  see:"Spend flows from the ledger through towers and services to consumers, with unit costs and a scaling forecast.",
  why:"Showback and chargeback rest on a traced cost model.",
  proof:"tbm",
  notes:["The cost flow follows the Technology Business Management taxonomy.","Forecast triggers name the capacity line that will be crossed."],
  qa:[["Is it chargeback-ready?","Showback and chargeback views are included; allocation rules are editable."]]},
 {id:"benefits",screen:"bud_ben",tab:"Planned and realized",sel:"card:Planned against realized",head:"Benefits measured after go-live",
  see:"A register compares planned and realized benefit and flags the amount at risk.",
  why:"Value is checked after delivery, not only promised before it.",
  proof:"benefit",
  notes:["Benefits link back to the demand request that proposed them.","Most value starts after go-live, so realized benefit lags by design."],
  qa:[["Who confirms a benefit?","The named benefit owner records the measurement; it is audited."]]},
 {id:"board",screen:"exe_board",sel:"card:Sections",persona:"exec",head:"Board pack written from live data",
  see:"A quarterly pack is generated from the registries, and each number links to its source record.",
  why:"Board material is traceable and cannot drift from the system of record.",
  proof:"decAge",
  notes:["Hover a number to see its source; select it to open the record.","The pack status moves from draft to approved through a group."],
  qa:[["Can sections be reordered?","The generator lists sections and their sources; the layout is a template."]]}
];

const S4=[
 {id:"overview",screen:"bc_home",sel:"card:Tier 1 readiness",head:"Resilience overview by application",
  see:"Plan approval, exercise currency, recovery results and single points of failure are summarized for Tier 1 and 2 applications.",
  why:"Continuity status is a number with a source, not a binder.",
  proof:"bcPlans",
  notes:["Counts are computed from plans, exercises and the CMDB.","BETH3D is the sample framework name and can be renamed."],
  qa:[["Is this ISO 22301 aligned?","The framework screen records the standards it follows; the dimensions are editable."]]},
 {id:"framework",screen:"bc_frame",tab:"Dimensions",sel:"card:Data",head:"A named framework with six dimensions",
  see:"Each dimension is assessed from live records, and readiness is shown per dimension.",
  why:"The organization can adopt its own framework language without rebuilding the screens.",
  proof:"bcDims",
  notes:["Data was added as a dimension: backups, replication, recovery points, lineage, classification, retention and integrity.","History shows how readiness moved."],
  qa:[["Can dimensions be added?","Yes, on the Dimensions tab, and assessments recompute."]]},
 {id:"tiers",screen:"bc_tiers",tab:"Policy",sel:"card:Tier policy",head:"Tiers drive exercise obligations",
  see:"Recovery tiers come from CMDB business criticality and set how often an exercise is required.",
  why:"Effort follows criticality, and overdue exercises are listed.",
  proof:"bcApps",
  notes:["Tier 1 needs an annual live failover; Tier 2 alternates live and tabletop.","Obligations and CIs have their own tabs."],
  qa:[["Where does criticality come from?","The CMDB business service record; it is not retyped here."]]},
 {id:"plans",screen:"bc_plans",tab:"Plans",sel:"card:Continuity and recovery plans",head:"Plans with owner, backup and approver",
  see:"Each plan names an owner, a backup and an approver group and links to CIs, data, vendors, people and budget lines.",
  why:"A plan that cannot name who runs it is visible as a gap.",
  proof:"bcPlans",tryit:{label:"Declare a disaster (simulated)",act:"disaster"},
  notes:["Call trees, communications and runbooks sit on their own tabs.","Runbook drafts are generated into Knowledge for the plan owner to complete."],
  qa:[["Are runbooks automated?","The Runbooks and automation tab links steps to the workflow runtime."]]},
 {id:"exercises",screen:"bc_cal",tab:"Calendar",sel:"card:Exercise calendar",head:"Exercises placed inside change windows",
  see:"Planned and in-progress exercises sit on a calendar that flags conflicts with freezes and other changes.",
  why:"A live failover creates its change record and never collides with a freeze.",
  proof:"bcEx",
  notes:["Conflicts are blocking and named.","Results feed recovery time and recovery point attainment."],
  qa:[["Does it schedule people?","It reads the call tree and the resource calendar; booking stays with the owner."]]},
 {id:"trace",screen:"bc_trace",tab:"Gaps",sel:"card:Gaps by kind",head:"Every plan traces to what it protects",
  see:"Plans and components link to CIs, services, processes, data, vendors, contracts, people, budget lines, risks and controls, and open gaps are listed.",
  why:"A gap such as a vendor without an exit plan is found before an outage finds it.",
  proof:"bcApps",
  notes:["Impact analysis starts from any node and shows what is affected.","Gaps are findings with owners."],
  qa:[["Can gaps be exported?","Yes, the Matrix tab exports the traceability table."]]},
 {id:"declare",screen:"bc_decl",tab:"Declare",sel:"card:Invoke a plan",head:"Declaring a disaster, simulated",
  see:"A declaration starts the plan's recovery workflow, notifies the call tree in order and links the major incident.",
  why:"The response path is rehearsed on the same runtime that would run it.",
  proof:"bcDecl",tryit:{label:"Declare a disaster (simulated)",act:"disaster"},
  notes:["No message is sent and no system is changed; the simulation is labeled everywhere it appears.","The declaration, workflow and notices appear in the inbox and audit trail."],
  qa:[["Does it page real people?","Not in the prototype. The notification engine supports channels; the demo writes to the inbox only."]]},
 {id:"metrics",screen:"bc_metrics",tab:"Maturity",sel:"card:Maturity levels",head:"Resilience metrics roll into maturity",
  see:"Metrics by application, CI and component roll into a five-level maturity with the formula lineage shown.",
  why:"Tier 1 readiness has a number, a target and a gap.",
  proof:"bcApps",
  notes:["Maturity uses the platform's single maturity scale, not a parallel one.","Formula lineage opens from any measure."],
  qa:[["What is the target?","Targets are set per tier on the Maturity tab."]]}
];

const S5=[
 {id:"thinking",screen:"r17q_thinking",sel:"hero",needs:"r17q_thinking",head:"The thinking behind the design",
  see:"The design decisions, the alternatives considered and the standing rules are laid out in order.",
  why:"The reasoning can be inspected, not only the screens.",
  proof:"modules",
  notes:["Each decision links to the screen where it shows up.","The standing rules are the same ones the contract screen enforces."],
  qa:[["Where do decisions live?","In the decisions log, with an owner and a date."]]},
 {id:"contract",screen:"plat_contract",tab:"The four rules",sel:"card:Process model",head:"Four rules gate every feature",
  see:"Process, data, metrics and connections are defined as rules with the evidence the platform reads for each.",
  why:"Quality is a property of the build process, not a review at the end.",
  proof:"contract",tryit:{label:"Score the Tour screen on the four rules",act:"contract"},
  notes:["The same definition runs in design agents, the publish gate and at runtime.","The Tour screen itself is scored on this page."],
  qa:[["Can a feature skip a rule?","Only through a waiver with a reason, an owner and an expiry of at most 90 days."]]},
 {id:"process",screen:"plat_proc",tab:"Library",sel:"pane",head:"A process model for every module",
  see:"Each module has an editable process with steps, who acts, owners, service levels and a cited standard.",
  why:"Processes are inspected and improved in the tool, not held in slides.",
  proof:["processes","procCover"],
  notes:["Steps say whether a person, an agent, an automatic action or a gate acts.","Maturity is scored on six dimensions from observable platform signals."],
  qa:[["Which standards are cited?","ITIL, TBM, PMBOK, NIST, KCS and others, shown as badges with how each is applied."]]},
 {id:"data",screen:"plat_data",tab:"Diagram",sel:"pane",head:"One data model, reuse first",
  see:"Tables, fields and references are drawn and audited, and each new entity records a reuse, extend or new decision.",
  why:"Duplicate definitions are found at design time, not during integration.",
  proof:"tables",
  notes:["Every field carries an authority and a classification.","Metric lineage traces measures to the fields they read."],
  qa:[["Who decides to add a new entity?","The data integrator step of the contract records the decision and the near duplicates found."]]},
 {id:"flows",screen:"plat_map",tab:"Module map",sel:"pane",head:"Documented flows between modules",
  see:"Modules sit in bands, and each flow names its data, its entity, its mode and its trigger.",
  why:"Impact of a change is read from the map, not guessed.",
  proof:["modules","flows"],
  notes:["A module with no flow in or out is a finding.","Blast radius shows what a change reaches."],
  qa:[["Is the map hand drawn?","No. It is generated from the registered modules and flows."]]},
 {id:"audit",screen:"zl_conn",tab:"Overview",sel:"card:Connectivity score",head:"The platform audits its own links",
  see:"A connectivity audit checks cross-module references, orphans and event fan-out, and lists each finding with a fix.",
  why:"Integrity is measured continuously and regressions are visible.",
  proof:"zl",
  notes:["Findings include unresolved references and records with no owner.","A resolver can repair a class of findings in one action."],
  qa:[["What is the score based on?","The share of checks without findings, weighted by severity; the formula is on the screen."]]},
 {id:"owners",screen:"own_gaps",tab:"Overview",sel:"card:Who do I go to?",head:"Every thing has a named owner",
  see:"Modules, processes, entities, metrics, agents and policies each need a named human owner and a different backup.",
  why:"Accountability is checked mechanically, and gaps carry a deadline.",
  proof:"owners",
  notes:["A team or an AI agent does not count as an owner.","An accepted gap is a time-limited exception tied to a debt item."],
  qa:[["Can an agent own something?","An agent needs a human sponsor and a backup; the sponsor is the accountable owner."]]},
 {id:"build",screen:"plat_build",tab:"Overview",sel:"card:What every new module gets",head:"New modules enter through a gate",
  see:"A builder or an AI coding client declares the contracts, reuses registry data and passes the gate before registering.",
  why:"Extensions by people and by AI follow the same path.",
  proof:"contract",
  notes:["Reuse is measured: new modules reuse most of their data from the registry.","The MCP tool run_feature_contract gives coding clients the same check."],
  qa:[["Can customers build modules?","Citizen apps use the same gate, with the tier deciding whether failures block."]]},
 {id:"value",screen:"r17q_value",sel:"hero",needs:"r17q_value",head:"Value computed from this tenant's data",
  see:"Measured figures come from the registries, and every assumption is editable, labeled as modeled and shows its formula.",
  why:"The business case can be read, challenged and changed in the room.",
  proof:"metrics",
  notes:["Registry figures are labeled as from this tenant's data; assumptions are labeled modeled."],
  qa:[["Can the assumptions be changed?","Yes. Each is an input and the totals recompute."]]}
];

const STORIES=R.STORIES=[
 {id:"five",title:"The 5-minute story",audience:"Executive",minutes:5,persona:"exec",blurb:"Home, approvals, governed AI, strategy, money, resilience and the rules that keep it coherent.",stops:S1},
 {id:"govern",title:"Approvals and governed AI",audience:"CIO and risk",minutes:8,persona:"exec",blurb:"Approver groups, rules, one permission model, a denial seen as service desk, agent tiers and evidence.",stops:S2},
 {id:"strategy",title:"From strategy to execution",audience:"PMO and finance",minutes:9,persona:"portfolio",blurb:"Goals to funded work to forecast, requests, cost traced to consumers, benefits and the board pack.",stops:S3},
 {id:"resilience",title:"Resilience and continuity",audience:"Business continuity and recovery",minutes:8,persona:"exec",blurb:"Framework, tiers, plans, exercises, traceability, a simulated declaration and maturity.",stops:S4},
 {id:"built",title:"How it was built",audience:"Product and IT leaders",minutes:10,persona:"exec",blurb:"The thinking, the four-rule contract, process and data models, the map, the self-audit and the value screen.",stops:S5}
];

/* ---------------------------------------------------------------- presenter personas ---------------------------------------------------------------- */
R.PERSONA_NOTE={exec:"Casey Rowan, CIO",portfolio:"Maya Ortiz, portfolio lead",ops:"Tom Becker, service desk lead",fin:"Avery Chen, finance approver"};

/* ---------------------------------------------------------------- schema check, run at load ---------------------------------------------------------------- */
const MOMENT_IDS=["approval","status","kill","disaster","orderguide","ask","why","perm"];
const ACTION_IDS=MOMENT_IDS.concat(["contract"]);
R.MOMENT_IDS=MOMENT_IDS;R.ACTION_IDS=ACTION_IDS;
const FIRST_PERSON=/\b(I|I'm|I've|I'll|we|we're|we've|our|ours|my|let's|us)\b/i;
const sentences=s=>(String(s).match(/[.!?](\s|$)/g)||[]).length;
R.validate=function(){const errs=[];const ids=new Set();
 STORIES.forEach(st=>{
  ["id","title","audience","blurb"].forEach(k=>{if(!st[k])errs.push(st.id+": missing "+k)});
  if(ids.has(st.id))errs.push("duplicate story id "+st.id);ids.add(st.id);
  if(!(st.minutes>0))errs.push(st.id+": minutes");
  const n=(st.stops||[]).length;if(n<6||n>9)errs.push(st.id+": "+n+" stops (6 to 9 required)");
  const base=(st.stops||[]).filter(x=>!x.needs).length;if(base<6)errs.push(st.id+": only "+base+" stops without a dependency");
  const sid=new Set();
  (st.stops||[]).forEach(sp=>{const w=st.id+"/"+sp.id;
   if(sid.has(sp.id))errs.push(w+": duplicate stop id");sid.add(sp.id);
   ["screen","head","see","why","proof"].forEach(k=>{if(!sp[k])errs.push(w+": missing "+k)});
   if(sp.head&&sp.head.trim().split(/\s+/).length>8)errs.push(w+": headline over 8 words");
   ["see","why"].forEach(k=>{if(sp[k]){if(sentences(sp[k])!==1)errs.push(w+": "+k+" must be one sentence");if(FIRST_PERSON.test(sp[k]))errs.push(w+": "+k+" uses first person");if(/—/.test(sp[k]))errs.push(w+": em dash in "+k)}});
   [].concat(sp.proof||[]).forEach(k=>{if(!PROOF[k])errs.push(w+": unknown proof key "+k)});
   if(sp.tryit&&(!sp.tryit.label||ACTION_IDS.indexOf(sp.tryit.act)<0))errs.push(w+": tryit needs a label and a known action");
   [].concat(sp.notes||[],(sp.qa||[]).map(x=>x[1])).forEach(t=>{R.tokensOf(t).forEach(k=>{if(!PROOF[k])errs.push(w+": note token {"+k+"} unknown")});if(FIRST_PERSON.test(t.replace(/\{\w+\}/g,"")))errs.push(w+": notes use first person")});
  })});
 R.errors=errs;return errs};
R.validate();
if(R.errors.length)console.warn("R17P story schema:",R.errors);

/* stops that can run right now: a stop whose dependency screen is missing is omitted and returns when the module is present */
R.stopsOf=function(story){const st=typeof story==="string"?STORIES.find(x=>x.id===story):story;if(!st)return[];
 return st.stops.filter(sp=>!sp.needs||G(()=>SCREENS.some(s=>s[0]===sp.needs),false)).filter(sp=>G(()=>SCREENS.some(s=>s[0]===sp.screen),false))};
R.story=id=>STORIES.find(x=>x.id===id)||null;
})();
