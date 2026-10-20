/* ============================================================================
   mod_nav.js  -  Navigation, favorites, history and global search (Round 11, Agent N)
   Globals: window.NAVX {map, groups, add, fav, hist, recordOpener, open, search, index, palette, studio}
   Everything outside this file is read lazily and guarded. See the bottom for the Feature Contract wiring.
   ============================================================================ */
(function(){
const W=window;
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const q1=(s,r)=>(r||document).querySelector(s),qa=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
const NAVX=W.NAVX=W.NAVX||{};
const G=f=>{try{return f()}catch(e){return undefined}};
const now=()=>Date.now();

/* ---------- storage: localStorage with an in-memory fallback, namespaced per persona ---------- */
const MEM={};
const store={get(k){const v=U.store.get(k,null);if(v!=null)return v;return MEM[k]==null?null:JSON.parse(MEM[k])},
 set(k,v){let s;try{s=JSON.stringify(v)}catch(e){return}MEM[k]=s;U.store.set(k,v)}};

/* ---------- the navigation model: functional groups ---------- */
const ICO={
 home:"M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
 my:"M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
 help:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.7M12 17h.01",
 plan:"M4 6h9M7 12h12M10 18h10M4 4v16",
 fix:"M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z",
 tech:"M4 5h16v5H4zM4 14h16v5H4zM8 7.5h.01M8 16.5h.01",
 money:"M12 3v18M16 7.5C16 6 14.2 5 12 5S8 6 8 7.7c0 4 8 2.3 8 6.6 0 1.7-1.8 2.7-4 2.7s-4-1-4-2.5",
 learn:"M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
 people:"M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M16 5.5a3 3 0 0 1 0 5.5M18 15c2 .6 3 2.2 3 5",
 strat:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
 auto:"M13 2L4 14h7l-1 8 9-12h-7z",
 ai:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z",
 plat:"M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5",
 new:"M12 5v14M5 12h14",
 make:"M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z",
 kit:"M4 7h6V4H4zM14 7h6V4h-6zM4 20h6v-9H4zM14 20h6v-9h-6z",
 lens:"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
 reg:"M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
 story:"M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM9 9h6M9 13h6",
 grc:"M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z",
 res:"M3 12h4l3-7 4 14 3-7h4",
 star:"M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z",
 clock:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
 search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
 doc:"M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
 user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
 flow:"M5 5h5v4H5zM14 15h5v4h-5zM10 7h4a3 3 0 0 1 3 3v5",
 table:"M4 5h16v14H4zM4 10h16M10 5v14",
 chart:"M4 20V10M10 20V4M16 20v-7M22 20H2",
 bolt:"M13 2L4 14h7l-1 8 9-12h-7z",
 menu:"M4 7h16M4 12h16M4 17h16",
 back:"M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
 pen:"M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
 x:"M6 6l12 12M18 6L6 18",
 gear:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
 grid:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
 transform:"M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"
};
const SVG=(d,sz,sw)=>`<svg viewBox="0 0 24 24" width="${sz||18}" height="${sz||18}" fill="none" stroke="currentColor" stroke-width="${sw||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
NAVX.svg=SVG;NAVX.icons=ICO;

const GROUPS=[
 ["home","Home",ICO.home,"Your starting point."],
 ["story","Story and demo",ICO.story,"The guided tour, and how this platform was built."],
 ["my","My work",ICO.my,"Things waiting on you: approvals, meetings, follow-ups."],
 ["help","Get help or ask for something",ICO.help,"Report a problem, order something, or find an answer."],
 ["plan","Projects and delivery",ICO.plan,"Choose the work, plan it, staff it and ship it."],
 ["fix","Service and support",ICO.fix,"Incidents, root causes, changes, requests and on-call."],
 ["money","Money and contracts",ICO.money,"Invoices, budgets, funding, vendors and cost transparency."],
 ["people","People and teams",ICO.people,"Who works where, skills and performance."],
 ["learn","Knowledge and learning",ICO.learn,"Articles, connected knowledge and training."],
 ["make","My builds and access",ICO.make,"What you built, whether it is safe to scale, and the data it needs."],
 ["kit","Design, data and controls",ICO.kit,"Process, data, security, rules and AI skills that every build uses."],
 ["lens","Executive lenses",ICO.lens,"Value against cost and risk, seen the way each executive weighs it."],
 ["strat","Strategy and value",ICO.strat,"Goals, measures, value realized, cost and board material."],
 ["grc","Risk and control",ICO.grc,"Risks, controls, findings, policies, audits and exceptions."],
 ["res","Resilience",ICO.res,"Continuity and disaster recovery: framework, tiers, plans, exercises, traceability and metrics."],
 ["ai","AI oversight",ICO.ai,"Watch, test and govern AI agents."],
 ["reg","Registry and truth",ICO.reg,"What exists, who owns it, and which source is authoritative."],
 ["tech","Enterprise IT",ICO.tech,"Services, systems, dependencies, alerts and pipelines."],
 ["plat","Platform admin",ICO.plat,"Navigation, setup, deployment, environments, licensing and the product log."],
 ["new","New and unsorted",ICO.new,"Screens that have not been placed in a group yet."]
];
NAVX.groups=GROUPS.map(g=>({id:g[0],label:g[1],icon:g[2],blurb:g[3]}));
const GID={};GROUPS.forEach((g,i)=>GID[g[0]]=i);
/* old product-suite groups (REG group strings) fall back to a functional group */
const OLDG={portfolio:"plan",service:"fix",ops:"tech",know:"learn",people:"people",automate:"kit",ai:"ai",platform:"plat"};
const OLDGN={portfolio:"Portfolio and delivery",service:"Service management",ops:"Operations",know:"Knowledge",people:"People and work",automate:"Automation",ai:"AI and governance",platform:"Platform"};

/* screen id | group | plain label | formal name (blank = the module's own name) | sub-heading | words people might use */
const RAW=`home|home|Home||
inbox|my|Inbox: approvals and alerts|||notifications alerts waiting on me approvals tasks
flw_appr|my|My approvals|Approvals inbox||approve sign off decisions waiting on me delegate
fo|my|My meetings, calendar and follow-ups|First Officer||calendar schedule agenda pre-read minutes actions tasks
meet_hub|my|Plan and run meetings|||schedule meeting agenda minutes invite
meet_act|my|Meeting actions I own or wait on|||action items follow up owed tasks from meetings
meet_dec|my|Decisions made in meetings|||decisions log meeting decided
meet_series|my|Recurring meetings and forums|||series forum recurring cadence standing meeting
ppl_meet|my|Meeting minutes and decisions|Forums and minutes||forum minutes decisions actions follow up
ppl_av|my|Book a room|Rooms and conference scheduling||room conference booking hybrid av
svc_portal|help|Report a problem or ask for help|Self-service portal||report problem broken issue ticket help desk raise request status my requests
svc_cat|help|Order something|Service catalog||order request laptop access software new hire onboarding buy
kcs_ask|help|Find an answer|Ask the knowledge base||how do i question answer faq search knowledge
chat_home|help|Ask ${BRAND.name} (chat and agents)|Chat and agents||assistant chat ai bot talk agent
port|plan|Ideas and requests for new work|Demand and priorities|Choose the work|demand intake prioritize portfolio idea proposal new project request
ppm_proj|plan|Projects|Projects and teams|Run projects|project list status teams health
ims|plan|Schedules across projects|Master schedule|Run projects|timeline gantt schedule dates milestone critical path
plan|plan|One project's plan|Project plan|Run projects|plan baseline milestones what if
ppm_wbs|plan|Tasks and work breakdown|WBS and task sheet|Run projects|tasks work breakdown wbs task sheet
ppm_raid|plan|Risks, issues and decisions|RAID log|Run projects|risk issue assumption dependency raid log
ppl_cap|plan|Who is available to do the work|Resource planning|Staff and release|resource capacity staffing allocation workload
agile_board|plan|Team boards and backlogs|Sprints and backlogs|Staff and release|sprint backlog story kanban board agile scrum
agile_art|plan|Planning across teams|Release trains and increments|Staff and release|release train program increment safe pi planning
itsm_rel|plan|Plan and track releases|Releases|Staff and release|release go live deploy readiness change window
itsm_home|fix|Service desk at a glance|Service desk overview||service desk queue overview tickets
itsm_inc|fix|Fix what is broken|Incidents||incident outage broken down ticket p1 restore
itsm_mi|fix|Run a major outage|Major incident||major incident outage war room bridge
itsm_prb|fix|Find root causes|Problems and known errors||problem root cause known error workaround
itsm_chg|fix|Plan and approve changes|Changes||change request cab approval freeze rfc
obs_std|fix|Pre-approved changes and runbooks|Standard change catalog||standard change pre-approved template runbook
svc_req|fix|Work the request queue|Requests and fulfillment||request fulfillment queue ritm order status
svc_oncall|fix|Who is on call|On-call and escalation||on call pager escalation rota schedule
svc_sla|fix|Service promises and targets|SLAs, OLAs and XLAs||sla ola xla service level agreement target breach
svc_360|tech|Services we run and how they connect|Service portfolio and map|Services and records|service portfolio map offering owner tier
exe_apps|tech|Applications we run|Application portfolio|Services and records|application apps software portfolio rationalize
itom_cmdb|tech|Servers, apps and other technology items|CMDB|Services and records|cmdb configuration item ci server asset inventory
svc_asset|tech|Assets and software licenses|Assets and software licenses|Services and records|asset license software hardware laptop renewal
itom_graph|tech|Impact Explorer|Impact Explorer|Services and records|impact explorer dependency graph topology upstream downstream blast radius map
kg|tech|What a change would affect|Impact graph|Services and records|impact analysis blast radius ripple change affects
itom_model|tech|How technology records are structured|CMDB data model|Data quality|cmdb model classes relationships
itom_disc|tech|Scan and import technology|Discovery and ingestion|Data quality|discovery scan ingest import connector
itom_health|tech|Is our technology data trustworthy|CMDB health and governance|Data quality|cmdb health completeness stale duplicates governance
itom_evt|tech|Alerts and events|Event management|Watch and deliver|alert event monitoring noise correlation
obs_dash|tech|Monitoring dashboards|Dashboards and metrics|Watch and deliver|dashboard monitoring grafana metrics observability
itom_slo|tech|Reliability targets|Observability and SLOs|Watch and deliver|slo error budget reliability observability uptime
dev_pipe|tech|Build and release pipelines|Delivery pipeline|Watch and deliver|pipeline ci cd build deploy devops run
itom_dev|tech|Delivery speed and environments|Environments and DORA|Watch and deliver|dora lead time deployment frequency environments
inv|money|Approve invoices|Invoice approval|Pay and approve|invoice pay approve vendor bill hold payment ap
bud_doa|money|Who can approve what|Delegation of authority|Pay and approve|delegation authority doa approval limit spending
ppm_sow|money|Review a statement of work|SOW and contract analyzer|Pay and approve|sow contract analyze clause statement of work review
bud_over|money|Budgets|Budgets overall|Budgets and funding|budget spend forecast overrun commitment
bud_model|money|Forecast and financial model|Financial model|Budgets and funding|forecast model scenario financial plan
fin_budget|money|Budget and forecast by funding type|Budget and forecast|Budgets and funding|budget forecast reforecast variance
fin_model|money|IT financial model|IT financial model|Budgets and funding|financial model decision policy
fin_color|money|Which funding pays for what|Funding color|Budgets and funding|color of money capex opex funding type
fin_spend|money|Test the order money is spent|Spend-order simulator|Budgets and funding|spend order simulator waterfall
fin_gates|money|Funding approval gates|Funding gates|Budgets and funding|funding gate g1 g2 g3 stage gate
fin_rules|money|Financial control checks|Financial controls|Budgets and funding|controls reconciliation exceptions rules audit
bud_ben|money|Track benefits|Benefits realization|Budgets and funding|benefits realization value savings roi
bud_ven|money|Vendors and contracts|Vendors and contracts|Vendors|vendor contract purchase order supplier renewal
tbm_model|money|See what technology costs|Technology cost transparency (TBM)|Where money goes|tbm cost transparency towers cost pools unit cost
fin_alloc|money|Charge costs to teams|Allocation and showback|Where money goes|allocation showback chargeback drivers
itom_fin|money|Cloud spend|Cloud cost (FinOps)|Where money goes|cloud cost finops azure spend
kcs_home|learn|Browse and manage articles|Knowledge management||knowledge article kb manage review
kcs_edit|learn|Write or update an article|Article editor||write article editor draft publish kb
kcs_gap|learn|What knowledge is missing|Knowledge gaps and analytics||knowledge gap analytics search no result
vault|learn|Explore connected knowledge|Knowledge graph||knowledge graph vault links connected
ppl_train|learn|Training and courses|Training and learning||training course learning certification
ppl_org|people|Who works where and how busy|Org chart and workload||org chart people team workload capacity manager
svc_skills|people|Skills and availability|Skills and availability||skills availability who can expertise
ppl_perf|people|Performance reviews|Performance management||performance review goals feedback rating
ppl_jrny|people|Experience journeys|Journey maps||journey map experience employee customer
exe_dash|strat|Leadership dashboard|Executive dashboard||executive dashboard overview kpi health
exe_strat|strat|Goals and objectives|Strategy alignment||strategy objectives okr goals alignment
trace|strat|Trace goals to money and work|Executive trace||trace goal project money record connection lineage
metrics|strat|Measures and targets|Metrics||metric kpi measure target formula
loop|strat|Feedback and learning loops|Feedback loop||feedback loop overrides learning improve
exe_mat|strat|Maturity and capability|Maturity models||maturity capability model cmmi level
exe_risk|strat|Risk heat map|Risk heat map and Monte Carlo||risk heat map monte carlo exposure appetite
exe_scen|strat|Compare what-if scenarios|Scenario compare||scenario compare what if plan
exe_board|strat|Board pack|Board pack||board pack report directors meeting
kcs_viz|strat|Build a chart|Visualization builder||chart visual builder graph report
r16j_dash|strat|Dashboards and charts|Saved charts, layouts, defaults||dashboard layout saved chart default publish library reorder
flw_design|auto|Design a workflow|Workflow designer||workflow designer automation process build
flw_bpmn|auto|Draw a process|Process models (BPMN)||bpmn process model diagram draw
flw_dmn|auto|Decision rules|Decision tables||decision table dmn rules logic
flw_agent|auto|Workflows with AI agents|Agentic workflows||agentic workflow agent autonomous
flw_asmt|auto|Assessments and questionnaires|Assessments||assessment questionnaire survey form
svc_notify|auto|Notifications and messages|Notification engine||notification message email template alert rule
itom_run|auto|Runbooks and automatic fixes|Runbooks and automation||runbook automation auto remediation script
tower|ai|Watch and control AI agents|AI Control Tower||ai control tower agents kill switch pause fleet
adm_gate|ai|AI usage and cost|AI gateway and tokenomics||ai gateway tokens cost cap usage
kcs_prompt|ai|Prompt library|Prompt library||prompt library template
kcs_test|ai|Test AI answers|AI test management||ai test evaluation quality suite
kcs_skills|ai|What AI agents can do|Agent skills||agent skills tools abilities
plat_mcp|ai|Connect AI and coding tools|AI and coding clients||mcp ai coding client connect claude copilot
plat_data|plat|The platform's data model|Master data model|Data and processes|data model entity field table lineage atlas
plat_data_old|plat|Data tables and checks|Data tables and model checks|Data and processes|data tables checks model coverage
plat_dmap|plat|Where data flows|Data connections|Data and processes|data connections flows between modules
plat_map|plat|How modules work together|Master process flow|Data and processes|platform maps data architecture data model entities data flows process flow modules map between
plat_pmap|plat|How processes connect|Process connections|Data and processes|process connections links
plat_proc|plat|Process library|Process library|Data and processes|process library maturity steps owner
plat_reg|plat|Platform registry|Platform registry|Data and processes|registry canonical entities catalog
nav_studio|plat|Navigation and search settings|Navigation and search|Data and processes|navigation menu search favorites history map group
plat_build|plat|Build a module|Build a module|Build and connect|build module new app create
plat_self|plat|Let ${BRAND.name} extend itself|Self-build|Build and connect|self build extend generate
plat_gate|plat|Approve citizen-built apps|Citizen apps|Build and connect|citizen apps low code governance tiers
plat_fab|plat|Connect and keep data fresh|Integration fabric|Build and connect|integration fabric freshness editions connectors
flw_hub|plat|Connect other systems|Integration hub|Build and connect|integration hub connector api webhook
plat_debt|plat|Technical debt|Technical debt ledger|Build and connect|technical debt ledger backlog
plat_contract|plat|Feature contract|Feature contract|Build and connect|feature contract rules process data metrics
adm_studio|plat|Admin studio|Admin studio|Administer|admin studio settings configuration
adm_sec|plat|Security and access|Security and access|Administer|security access roles permissions identity
adm_audit|plat|Audit and compliance|Audit and compliance|Administer|audit compliance log evidence
adm_meter|plat|Licensing and billing|Licensing and billing|Administer|licensing billing usage meter seats
adm_env|plat|Environments and releases|Environments and releases|Administer|environments releases promote sandbox
log|plat|Product log|Product log|Administer|product log feedback backlog request feature`;
const MAP={};
const OVR=store.get("oukala-nav-map")||{};
function parseRaw(){let o=0;RAW.split("\n").forEach(line=>{const p=line.split("|");if(p.length<3)return;const id=p[0].trim();MAP[id]={g:p[1].trim(),l:p[2].trim(),l0:p[2].trim(),h:(p[3]||"").trim(),sub:(p[4]||"").trim(),kw:(p[5]||"").trim(),o:o++}})}
parseRaw();
NAVX.map=MAP;
/* runtime additions: NAVX.add(screenId,{group,label,hint,sub,kw}) */
NAVX.add=function(id,d){d=d||{};const g=d.group&&GID[d.group]!=null?d.group:(d.g&&GID[d.g]!=null?d.g:(MAP[id]?MAP[id].g:"new"));
 const prev=MAP[id];MAP[id]={g,l:d.label||d.l||(prev&&prev.l)||id,h:d.hint||d.h||(prev&&prev.h)||"",sub:d.sub!=null?d.sub:(prev?prev.sub:""),kw:d.kw||(prev&&prev.kw)||"",o:prev?prev.o:5000+Object.keys(MAP).length};
 if(IDX.built)IDX.dirty=true;try{if(W.renderNav&&q1("#nav"))renderNav()}catch(e){}return MAP[id]};
/* hidden alias list so old links, old labels and old group names keep working */
const ALIAS={"service management":"itsm_home","portfolio and delivery":"exe_dash","operations":"itom_evt","knowledge":"kcs_home","people and work":"ppl_org","automation":"flw_design","platform":"plat_data","portfolio":"exe_dash","approvals":"flw_appr","calendar":"fo","incidents":"itsm_inc","cmdb":"itom_cmdb","invoices":"inv","budgets":"bud_over","executive dashboard":"exe_dash","first officer":"fo","service desk":"itsm_home"};
NAVX.alias=ALIAS;
NAVX.resolveAlias=function(s){s=String(s||"").trim().toLowerCase().replace(/^#/,"");if(!s)return null;if(S&&SCREENS.some(x=>x[0]===s))return s;if(ALIAS[s])return ALIAS[s];const hit=SCREENS.find(x=>String(x[1]).toLowerCase()===s);return hit?hit[0]:null};

function screenRow(id){return SCREENS.find(s=>s[0]===id)}
function oldGroup(id){const s=screenRow(id);return s?((W.NAVGRP&&NAVGRP[id])||s[3]):null}
/* the resolved entry for any registered screen */
/* the resolved entry for any registered screen. PH-14 (step 3): the place and the label come from the taxonomy (NAVX.taxo);
   a family view keeps its "Family: view" name; a saved override (oukala-nav-map) still wins, and an old group id in it resolves
   to the space that took that group over. g is now a space id (see SPACES); old group ids still resolve through OLDGRP. */
function resolve(id){const s=screenRow(id);let m=MAP[id];const ov=OVR[id];const t=TX[id];
 if(!m){m={g:"",l:t?t.l:(s?String(s[1]).replace(/\s*\([^)]*\)\s*$/,""):id),h:"",sub:"",kw:"",o:9000,unmapped:!t}}
 const pl=placeOf(id);const own=t&&(t.kind==="entry"||t.kind==="role"||t.kind==="search");
 m=Object.assign({},m,{g:pl.sp,sub:pl.sub,l:own?t.l:(m.l||(t&&t.l)||id),kind:pl.kind,o:t?t.o:m.o});
 if(ov){if(ov.l)m.l=ov.l;m.edited=true}
 return m}
const formal=id=>{const s=screenRow(id);return s?String(s[1]):id};
const labelOf=id=>resolve(id).l;
const hintOf=id=>{const m=resolve(id),f=formal(id);const h=m.h||f;return h.toLowerCase()===m.l.toLowerCase()?"":h};
const gLabel=g=>{if(SPID[g]!=null)return SPACES[SPID[g]][1];if(OLDGRP[g])return SPACES[SPID[OLDGRP[g]]][1];return (GROUPS[GID[g]]||GROUPS[GROUPS.length-1])[1]};
const tip=id=>{const m=resolve(id),f=formal(id);return m.l===f?f:m.l+" ("+f+")"};
NAVX.resolve=resolve;NAVX.label=labelOf;NAVX.hint=hintOf;NAVX.groupLabel=gLabel;NAVX.formal=formal;
NAVX.setOverride=function(id,o){if(!o){delete OVR[id]}else OVR[id]=Object.assign({},OVR[id]||{},o);store.set("oukala-nav-map",OVR);IDX.dirty=true;try{renderNav()}catch(e){}};
NAVX.overrides=()=>OVR;
/* the entries of one space (or of the space an old group id maps to), in sub-group order, for the active persona */
function groupItems(g){const sp=SPID[g]!=null?g:OLDGRP[g];if(!sp)return[];const e=spaceEntries(sp,G(()=>S.persona));return [].concat(...Object.keys(e).map(k=>e[k])).filter(id=>id!=="home"||sp==="home")}
NAVX.groupItems=groupItems;

/* ---------- PH-14 (step 1): the navigation taxonomy, kept as data beside RAW ----------
   Seven business areas in one fixed order, plus the fixed spaces (Home, My work, Ask or request, Showroom, Build and admin).
   Seeded from docs/ia/screen-inventory.csv (Omar approved the proposal 2026-10-20). One row per registered screen:
   screen id | space | sub-group | label | kind | ref | archetype | R3 comparison | objective level | objects shown
   kind: entry (one menu place), view (a view of the family ref), merged (merged into ref as a view), search (search only),
   role (shown only to the persona ref), retire (candidate to retire, Omar decides; the id keeps redirecting to ref).
   A screen with no row lands in search only, never in a menu (docs/ia/navigation-architecture.md, section g). */
const SPACES=[
 ["home","Home","fixed",ICO.home,"Your starting point.",["Home"]],
 ["my","My work","fixed",ICO.my,"Things waiting on you: approvals, meetings, your first week.",["Approvals","Meetings","Start here"]],
 ["ask","Ask or request","fixed",ICO.help,"Ask a question, find an answer, report a problem or order something.",["Ask","Request"]],
 ["strat","Strategy and value","area",ICO.strat,"Goals, measures, value realized and board material.",["Direction","Performance","Value and money"]],
 ["deliver","Portfolio and delivery","area",ICO.plan,"Choose the work, plan it, staff it and ship it.",["Choose the work","Plan and run","Staff and ship"]],
 ["ops","Operations and service","area",ICO.fix,"The service desk, changes, the technology behind the services, monitoring and knowledge.",["Service desk","Change and service levels","Technology and services","Monitoring","Knowledge"]],
 ["money","Money and contracts","area",ICO.money,"Approve and pay, budgets, where money goes, vendors and contracts.",["Approve and pay","Budgets","Where money goes","Vendors and contracts"]],
 ["people","People and organization","area",ICO.people,"The organization, skills and availability, learning and performance.",["Organization","Capacity and skills","Learning and performance"]],
 ["risk","Risk, control and AI","area",ICO.grc,"Risk, control and audit, access, AI oversight and resilience.",["Risk","Control, audit and access","AI oversight","Resilience"]],
 ["transform","Transformation","area",ICO.res,"Redesign the work, processes and maturity, and scale what was built.",["Redesign the work","Processes and maturity","Scale what was built"]],
 ["show","Showroom","fixed",ICO.story,"Guided tours and executive lenses.",["Showroom"]],
 ["build","Build and admin","fixed",ICO.kit,"Build, automate, data and integration, access and tenants, and running the platform.",["Build","Automate","Data and integration","Access and tenants","Run the platform","Product"]]];
const SPID={};SPACES.forEach((s,i)=>SPID[s[0]]=i);
const AREA_IDS=SPACES.filter(s=>s[2]==="area").map(s=>s[0]);
/* old group ids (saved menu overrides, crumbs, links) resolve to the space that took them over (section c) */
const OLDGRP={home:"home",story:"show",my:"my",help:"ask",plan:"deliver",fix:"ops",tech:"ops",money:"money",people:"people",learn:"ops",lens:"strat",strat:"strat",grc:"risk",res:"risk",ai:"risk",reg:"build",make:"transform",kit:"build",auto:"build",plat:"build",new:"build",
 portfolio:"deliver",service:"ops",ops:"ops",know:"ops",automate:"build",platform:"build"};
const TAXO=`home|home|Home|Home|entry||Other: landing page|none|individual|role cards, needs, rings, insights
flw_appr|my|Approvals|My approvals|entry||Approval inbox|inbox|individual|approvals on me, open, decided
inbox|my|Approvals|Alerts and inbox|view|flw_appr|Approval inbox|flw_appr|individual|alerts, queue, delegation
meet_hub|my|Meetings|Meetings|entry||Dashboard-first list|fo|individual|meetings, agendas, actions, decisions
fo|my|Meetings|My calendar and follow-ups|view|meet_hub|Other: AI assistant|meet_hub|individual|meetings, agendas, actions, pre-reads
meet_act|my|Meetings|Meeting actions|view|meet_hub|Dashboard-first list|meet_hub|individual|action items
meet_dec|my|Meetings|Decisions made in meetings|view|meet_hub|Dashboard-first list|meet_hub|team|decisions
meet_series|my|Meetings|Recurring meetings and forums|view|meet_hub|Dashboard-first list|ppl_meet|team|forums, series
ppl_av|my|Meetings|Book a room|view|meet_hub|Other: calendar|meet_hub|individual|rooms, bookings
ppl_meet|my|Meetings|Meeting minutes|view|meet_hub|Dashboard-first list|meet_series|team|forums, minutes, actions
r15d_firstweek|my|Start here|My first week|entry||Other: help or onboarding|ppl_train|individual|accounts, equipment, training, contacts
chat_home|ask|Ask|Ask ${BRAND.name}|entry||Other: chat|kcs_ask|individual|chat threads, activities, tools, guardrails
kcs_ask|ask|Ask|Find an answer|entry||Other: assistant|chat_home|individual|answers with sources
svc_portal|ask|Request|Report a problem or order something|entry||Other: portal|svc_cat|individual|catalog, forms, my requests
svc_guides|ask|Request|Order guides|view|svc_portal|Intake form|svc_portal|individual|order guides, fulfiller queues
exe_board|strat|Direction|Board pack|entry||Report|r15d_evidence|company|board sections citing records
exe_strat|strat|Direction|Goals and objectives|entry||Dashboard-first list|r18_strategy|company|objectives, key results, cascade, links to work
r18_lens|strat|Direction|Executive lenses|entry||Other: lens picker|r18_strategy|company|value against cost and risk per executive
exe_scen|strat|Direction|Compare what-if scenarios|merged|exe_strat|Report|exe_strat|enterprise|scenarios
r18_levels|strat|Direction|Views by level|merged|r18_lens|Other: lens picker|r18_lens|company|executive, manager, specialist views
r18_strategy|strat|Direction|How each function enables the strategy|view|r18_lens|Other: lens picker|exe_strat|enterprise|functions by objective, gaps
exe_dash|strat|Performance|Dashboards|entry||Dashboard-first list|r17u_dash|company|executive dashboards by role
metrics|strat|Performance|Measures and targets|entry||Other: catalog|svc_sla|enterprise|metrics, formulas, owners, targets
kcs_viz|strat|Performance|Chart library and builder|merged|r16j_dash|Designer canvas|r16j_dash|enterprise|charts, maps, shapes
r15_rpt|strat|Performance|Reports and subscriptions|view|exe_dash|Report|r16j_dash|enterprise|reports, schedules, run history
r16j_dash|strat|Performance|Build a dashboard|view|exe_dash|Designer canvas|kcs_viz|enterprise|charts, layouts, defaults
r17u_dash|strat|Performance|Dashboard viewer and templates|merged|r16j_dash|Dashboard-first list|r16j_dash|enterprise|dashboards, templates, schedules
bst|strat|Value and money|Budget and spend traceability|entry||Report|strat_exec|enterprise|funded work linked to goals, orphan spend
bud_ben|strat|Value and money|Benefits and value realized|entry||Dashboard-first list|r17q_value|enterprise|benefits, checkpoints, payback
r17q_value|strat|Value and money|Value realized|view|bud_ben|Report|bud_ben|enterprise|value layers, business case, scenarios
r18_spend|strat|Value and money|Spend detail|view|bst|Report|bst|enterprise|spend by domain and type
strat_exec|strat|Value and money|Trace goals to money and work|view|bst|Report|trace|enterprise|objectives, projects, budget lines, gaps
trace|strat|Value and money|Trace goals to money and work (old link)|retire|strat_exec|Report|strat_exec|enterprise|objectives, projects, budget lines, records
port|deliver|Choose the work|Ideas and requests for new work|entry||Dashboard-first list|bud_req|enterprise|demand items, scores, capacity, intake form
ims|deliver|Plan and run|Schedules across projects|entry||Other: timeline|plan|group|projects, milestones, Gantt, critical path
ppm_proj|deliver|Plan and run|Projects|entry||Dashboard-first list|ims|group|projects, health, milestones, teams
ppm_raid|deliver|Plan and run|Risks, issues and decisions|entry||Dashboard-first list|exe_risk|team|RAID items. RAID means risks, assumptions, issues and dependencies
r15_time|deliver|Plan and run|Timesheets and actuals|entry||Intake form|ppm_proj|individual|time entries, approvals, actuals
plan|deliver|Plan and run|One project's plan|merged|ims|Other: timeline|ims|team|one project, baseline, milestones
ppm_wbs|deliver|Plan and run|Tasks and work breakdown|view|ims|Other: spreadsheet|ims|team|tasks, WBS, Gantt, resources
agile_board|deliver|Staff and ship|Team boards and backlogs|entry||Board|agile_art|team|stories, sprints, backlogs
dev_pipe|deliver|Staff and ship|Build and release pipelines|entry||Dashboard-first list|itom_dev|team|pipelines, runs, gates, environments, freezes
itsm_rel|deliver|Staff and ship|Plan and track releases|entry||Dashboard-first list|dev_pipe|team|releases, clashes, readiness, go or no-go
ppl_cap|deliver|Staff and ship|Who is available to do the work|entry||Dashboard-first list|ppl_org|group|capacity, over capacity, scenarios
agile_art|deliver|Staff and ship|Planning across teams|view|agile_board|Board|agile_board|group|release trains, increments, objectives
itom_dev|deliver|Staff and ship|Delivery speed|merged|dev_pipe|Dashboard-first list|dev_pipe|team|DORA measures, environments
itsm_chg|ops|Change and service levels|Plan and approve changes|entry||Dashboard-first list|obs_std|team|changes, calendar, change board, templates
svc_cat|ops|Change and service levels|Manage the catalog|entry||Dashboard-first list|svc_portal|team|catalog items, workflows, approval rules
svc_sla|ops|Change and service levels|Service promises and targets|entry||Dashboard-first list|itom_slo|team|SLAs, OLAs, XLAs, breaches
obs_std|ops|Change and service levels|Pre-approved changes|merged|itsm_chg|Dashboard-first list|itsm_chg|team|standard changes, runbooks, pre-approvals
kcs_home|ops|Knowledge|Browse and manage articles|entry||Dashboard-first list|kcs_edit|team|articles, lifecycle, freshness
kcs_edit|ops|Knowledge|Write or update an article|view|kcs_home|Intake form|kcs_home|team|article draft, versions
kcs_gap|ops|Knowledge|What knowledge is missing|view|kcs_home|Report|kcs_home|team|search misses, gaps
vault|ops|Knowledge|Explore connected knowledge|view|kg|Other: graph explorer|kg|team|knowledge graph
itom_run|ops|Monitoring|Runbooks and automatic fixes|entry||Dashboard-first list|obs_std|team|runbooks, automation rules, history
obs_dash|ops|Monitoring|Monitor systems|entry||Dashboard-first list|exe_dash|team|hosts, CIs, metrics, logs, traces
itom_evt|ops|Monitoring|Alerts and events|view|obs_dash|Dashboard-first list|obs_dash|team|alerts, correlation, thresholds
itom_slo|ops|Monitoring|Reliability targets|view|obs_dash|Dashboard-first list|svc_sla|team|SLOs, error budgets, synthetic checks
itsm_home|ops|Service desk|Service desk at a glance|entry||Dashboard-first list|grc_home|group|queues, volumes
itsm_inc|ops|Service desk|Fix what is broken|entry||Dashboard-first list|itsm_mi|team|incidents, priorities, SLA timers
itsm_mi|ops|Service desk|Run a major outage|entry||Other: command center|itsm_inc|team|major incident, war room, communications
itsm_prb|ops|Service desk|Find root causes|entry||Dashboard-first list|itsm_inc|team|problems, known errors, root cause analysis
svc_oncall|ops|Service desk|Who is on call|entry||Dashboard-first list|svc_skills|team|rotas, escalation, overrides
svc_req|ops|Service desk|Work the request queue|entry||Dashboard-first list|svc_portal|team|requests, queues, approvals
itom_cmdb|ops|Technology and services|Servers, apps and other technology|entry||Dashboard-first list|itom_model|team|configuration items, classes
kg|ops|Technology and services|See what a change would affect|entry||Other: graph explorer|itom_graph|team|services, CIs, dependencies, knowledge links
svc_360|ops|Technology and services|Services we run|entry||360 view|exe_apps|group|services, owners, tiers, map
svc_asset|ops|Technology and services|Assets and software licenses|entry||Dashboard-first list|itom_cmdb|team|assets, lifecycle, licenses
exe_apps|ops|Technology and services|Applications we run|view|svc_360|Dashboard-first list|svc_360|team|applications, value and health, TIME quadrants
itom_disc|ops|Technology and services|Scan and import technology|view|itom_cmdb|Dashboard-first list|itom_cmdb|team|discovery sources, runs, mappings
itom_graph|ops|Technology and services|Technology dependencies|view|kg|Other: graph explorer|kg|team|dependency graph
itom_health|ops|Technology and services|Is our technology data trustworthy|view|itom_cmdb|Dashboard-first list|itom_cmdb|team|CI health scores, remediation tasks
itom_model|ops|Technology and services|How technology records are structured|view|itom_cmdb|Other: graph explorer|itom_cmdb|team|CI classes, relationship types
r16h_ci|ops|Technology and services|Who owns each technology item|view|itom_cmdb|Dashboard-first list|itom_health|team|CI owners, gaps
bud_doa|money|Approve and pay|Who can approve what|entry||Dashboard-first list|r16h_rules|group|approval matrix, sample cases, segregation of duties
bud_req|money|Approve and pay|Budget requests|entry||Dashboard-first list|port|enterprise|funding requests, decision funnel, routing
inv|money|Approve and pay|Approve invoices|entry||Approval inbox|flw_appr|team|invoices, vendors, milestones, approval rules
r15_p2p|money|Approve and pay|Procure to pay|entry||Dashboard-first list|inv|group|requisitions, orders, receipts, matching
bud_over|money|Budgets|Budgets|entry||Dashboard-first list|fin_budget|enterprise|budgets, forecasts, reserves, approvals
fin_color|money|Budgets|Which funding pays for what|entry||Dashboard-first list|fin_budget|enterprise|funding colors, headroom, rule matrix
bud_lines|money|Budgets|All budget lines|view|bud_over|Dashboard-first list|bud_over|enterprise|budget lines
bud_model|money|Budgets|Forecast model|view|bud_over|Report|fin_budget|enterprise|cost plan, capitalization, depreciation, TCO
fin_budget|money|Budgets|Budget by funding type|view|bud_over|Dashboard-first list|bud_model|enterprise|versions, variance, forecast methods
fin_gates|money|Budgets|Funding approval gates|view|fin_color|Dashboard-first list|fin_color|enterprise|stage gates, capitalization, release at G3
fin_model|money|Budgets|IT financial model|view|bud_over|Report|bud_model|enterprise|principles, decisions, roadmap
fin_rules|money|Budgets|Financial control checks|view|fin_color|Dashboard-first list|grc_ctl|group|validation rules, exceptions, evidence
fin_spend|money|Budgets|Test the order money is spent|view|fin_color|Other: simulator|fin_color|enterprise|spend-order waterfall
bud_ven|money|Vendors and contracts|Vendors and contracts|entry||Dashboard-first list|grc_ven|team|vendors, contracts, renewals, purchase orders
ppm_sow|money|Vendors and contracts|Review a statement of work|entry||Other: document analyzer|bud_ven|team|contracts, clauses, playbook
tbm_model|money|Where money goes|See what technology costs|entry||Report|fin_alloc|enterprise|cost pools, towers, unit cost
bud_ccmap|money|Where money goes|Cost center mapping|view|tbm_model|Dashboard-first list|fin_alloc|enterprise|cost centers, roll-up to org chart
fin_alloc|money|Where money goes|Charge costs to teams|view|tbm_model|Dashboard-first list|tbm_model|team|showback, drivers, splits
itom_fin|money|Where money goes|Cloud spend|view|tbm_model|Dashboard-first list|tbm_model|enterprise|cloud spend, untagged cost, rightsizing
svc_skills|people|Capacity and skills|Skills and availability|entry||Dashboard-first list|ppl_cap|group|skills, certificates, availability
ppl_perf|people|Learning and performance|Performance reviews|entry||Dashboard-first list|exe_strat|individual|goals, reviews, calibration
ppl_train|people|Learning and performance|Training and courses|entry||Dashboard-first list|svc_skills|individual|courses, assignments, certificates
org_chart|people|Organization|Org chart|entry||Other: map or diagram|orgassist|company|people, teams, AI teammates, ownership
ppl_org|people|Organization|Workload by team|view|org_chart|Dashboard-first list|ppl_cap|team|teams, weekly load
kcs_test|risk|AI oversight|Test AI answers|entry||Dashboard-first list|kcs_prompt|team|test cases, judge results, regression gate
tower|risk|AI oversight|Watch and control AI agents|entry||Dashboard-first list|r15d_agents|team|agents, budgets, lineage, kill switch
adm_gate|risk|AI oversight|AI usage and cost|view|tower|Other: admin configuration|tower|team|model routes, tokens, budget guard
agent_defs|risk|AI oversight|Agent definitions|view|tower|Catalog|r15d_agents|team|agent cards: prompts, guidelines, box
ai_runtime|risk|AI oversight|Agent runtime|view|tower|Dashboard-first list|wf_runs|team|agent runs, gates, controls
flw_agent|risk|AI oversight|Workflows with AI agents|view|tower|Designer canvas|flw_design|team|agentic workflows
kcs_prompt|risk|AI oversight|Prompt library|view|kcs_test|Dashboard-first list|kcs_test|team|prompts, versions, approvals
kcs_skills|risk|AI oversight|What AI agents can do|view|tower|Dashboard-first list|agent_defs|team|agent skills, tools
r15d_agents|risk|AI oversight|Agent registry|view|tower|Dashboard-first list|agent_defs|team|agents, owners, sponsors
grc_home|risk|Control, audit and access|Governance, risk and compliance|entry||Dashboard-first list|exe_risk|enterprise|risk, control, finding and policy summary
r15_iam|risk|Control, audit and access|Identity and access|entry||Dashboard-first list|r16g_perm|enterprise|roles, access requests, reviews, joiner mover leaver
r15d_evidence|risk|Control, audit and access|Evidence room|entry||Dashboard-first list|adm_audit|enterprise|controls, approvals, audit trail, decisions, exports
grc_aud|risk|Control, audit and access|Audit management|view|grc_home|Dashboard-first list|adm_audit|enterprise|audits, requests
grc_ctl|risk|Control, audit and access|Controls and testing|view|grc_home|Dashboard-first list|fin_rules|enterprise|controls, tests, attestation
grc_find|risk|Control, audit and access|Issues and findings|view|grc_home|Dashboard-first list|grc_aud|enterprise|findings
grc_pol|risk|Control, audit and access|Policies|view|grc_home|Dashboard-first list|kcs_home|enterprise|policies, acknowledgements
r18_access|risk|Control, audit and access|Data access requests|merged|r15_iam|Dashboard-first list|r15_iam|enterprise|data access requests, grants, data owners
bc_home|risk|Resilience|Resilience|entry||Dashboard-first list|itsm_mi|enterprise|continuity summary
bc_cal|risk|Resilience|Exercise calendar|view|bc_home|Other: calendar|itsm_chg|enterprise|exercises, windows, results
bc_decl|risk|Resilience|Declare a disaster|view|bc_home|Intake form|itsm_mi|enterprise|declarations
bc_frame|risk|Resilience|Resilience framework|view|bc_home|Other: reference|bc_home|enterprise|dimensions, assessment
bc_metrics|risk|Resilience|Resilience measures|view|bc_home|Report|metrics|enterprise|resilience metrics
bc_plans|risk|Resilience|Continuity plans|view|bc_home|Dashboard-first list|itom_run|enterprise|plans, call trees, runbooks
bc_tiers|risk|Resilience|Recovery tiers|view|bc_home|Dashboard-first list|svc_360|enterprise|tiers, obligations, CIs
bc_trace|risk|Resilience|Continuity traceability|view|bc_home|Report|kg|enterprise|services, CIs, contracts, gaps
exe_risk|risk|Risk|Risk|entry||Dashboard-first list|grc_risk|enterprise|risks, heat map, Monte Carlo, register
guard|risk|Risk|Guardrails|entry||Dashboard-first list (register)|r18_app|enterprise|guardrails, stage matrix, guided views
grc_exc|risk|Risk|Exceptions and acceptances|view|exe_risk|Dashboard-first list|plat_debt|enterprise|exceptions, expiry
grc_risk|risk|Risk|Risk register|view|exe_risk|Dashboard-first list|ppm_raid|enterprise|risks, owners, due dates
grc_ven|risk|Risk|Third-party risk|view|exe_risk|Dashboard-first list|bud_ven|enterprise|vendor risk
exe_mat|transform|Processes and maturity|Process maturity|entry||Dashboard-first list|r18_mature|group|maturity models, levels, scores
plat_proc|transform|Processes and maturity|Processes|entry||Dashboard-first list|plat_pmap|group|processes, steps, owners, maturity
draw_studio|transform|Processes and maturity|Draw a process|view|plat_proc|Designer canvas|flw_design|group|process drawings
flw_bpmn|transform|Processes and maturity|Process models (BPMN)|view|plat_proc|Designer canvas|draw_studio|group|BPMN models
flw_design|transform|Processes and maturity|Workflow designer|view|plat_proc|Designer canvas|draw_studio|group|workflow steps, gates, step modes
loop|transform|Processes and maturity|What we learned from overrides|retire|tower|Other: diagram|tower|team|override events, learning items
r16m_guides|transform|Processes and maturity|Process guides|view|plat_proc|Other: help or onboarding|kcs_home|group|generated guides, link checker
r18_mature|transform|Processes and maturity|Maturity roadmaps|view|exe_mat|Report|exe_mat|group|roadmaps by process
orgassist|transform|Redesign the work|Org chart with agent assist|entry||Designer canvas|org_chart|group|proposed org, AI teammates, FTE
orgdesign|transform|Redesign the work|Agent Action|entry||Other: agent action surface|orgassist|enterprise|COO brief, diagnosis, gaps, roadmap
ppl_jrny|transform|Redesign the work|Journey maps|entry||Other: map or diagram|orgassist|enterprise|journeys, steps, overlays, process map
r18_builds|transform|Scale what was built|Build list|entry||Dashboard-first list|plat_gate|team|builds, owners, need action
studio|transform|Scale what was built|VibeCheck|entry||Other: builder entry|plat_build|team|chat-to-build brief
plat_gate|transform|Scale what was built|Approve citizen-built apps|view|r18_builds|Dashboard-first list|r18_builds|team|apps, conformance gate, tiers
r18_app|transform|Scale what was built|App record|search||Record detail drawer|rec_shell|team|one build: guardrails, process, data, metrics, debt
showroom|show|Showroom|Showroom|entry||Other: demo space|r17p_tour|platform|tours, beats, lenses
r15_mobile|show|Showroom|Phone approvals and on-call (preview)|view|showroom|Other: device preview|flw_appr|individual|phone preview of approvals
r17p_tour|show|Showroom|Tour|view|showroom|Other: help or onboarding|showroom|platform|stories, moments, rehearsal
r17q_thinking|show|Showroom|How it was built|view|showroom|Report|log|platform|design principles, rounds, decisions
adm_audit|build|Access and tenants|Audit log and retention|entry||Dashboard-first list|r15d_evidence|group|audit log, retention, holds
r16g_perm|build|Access and tenants|Permissions|entry||Other: admin configuration|r15_iam|team|permission matrix, row and field rules
tn_admin|build|Access and tenants|Tenancy|entry||Other: admin configuration|r16m_setup|team|tenants, memberships, data packs
adm_sec|build|Access and tenants|Security and access|view|r16g_perm|Other: admin configuration|r16g_perm|team|roles, policies, labels, access reviews
r16m_overlay|build|Access and tenants|Tenant overlays|view|tn_admin|Other: admin configuration|tn_admin|team|overlays, compare tenants
tn_metrics|build|Access and tenants|Metrics and objectives (tenant view)|role|admin|Report|metrics|team|metrics and objectives per tenant
tn_people|build|Access and tenants|People directory (tenant view)|role|admin|Dashboard-first list|org_chart|team|people per tenant
tn_projects|build|Access and tenants|Projects and budget (tenant view)|role|admin|Dashboard-first list|ppm_proj|team|projects, budget per tenant
flw_dmn|build|Automate|Rules and decisions|entry||Designer canvas|dec_cov|team|decision tables, rules, events, notifications
r16h_groups|build|Automate|Approval groups|entry||Other: admin configuration|bud_doa|team|approver groups, approval paths
r16h_status|build|Automate|Status catalog|entry||Other: admin configuration|adm_studio|team|statuses, mappings
wf_runs|build|Automate|Workflow runs|entry||Dashboard-first list|ai_runtime|team|process instances, timers, retries
dec_cov|build|Automate|Rule coverage|view|flw_dmn|Dashboard-first list|flw_dmn|team|rule coverage, review queue, gaps
r16h_rules|build|Automate|Approval rules|view|r16h_groups|Other: admin configuration|bud_doa|team|rules, simulation, bindings
r17s_rules|build|Automate|In-app rules and scripts|view|flw_dmn|Designer canvas|zevt|team|rules, scripts, firing log
svc_notify|build|Automate|Notifications|view|flw_dmn|Other: admin configuration|zevt|team|channels, templates, delivery log
zevt|build|Automate|Events and rules|view|flw_dmn|Other: admin configuration|r17s_rules|team|events, rules, firing log
flw_asmt|build|Build|Assessments and questionnaires|entry||Intake form|r16m_import|team|questionnaires, results
plat_build|build|Build|Build a module|entry||Intake form|studio|team|blueprint, manifest, worked example
plat_contract|build|Build|Feature contract|entry||Report|plat_gate|team|contract scores, rules, exceptions
plat_mcp|build|Build|Connect AI and coding tools|entry||Other: admin configuration|flw_hub|team|tools, clients, contract file
plat_self|build|Build|Let ${BRAND.name} extend itself|merged|plat_build|Other: builder entry|plat_build|team|self-build proposals
rec_shell|build|Build|Record shell (pattern reference)|search||Record detail drawer|r18_app|team|one record with activity, comments, related
flw_hub|build|Data and integration|Connect other systems|entry||Dashboard-first list|plat_fab|team|connectors, webhooks, retries
plat_map|build|Data and integration|Platform maps|entry||Other: map or diagram|plat_pmap|team|modules, processes, data flows, data model
plat_reg|build|Data and integration|Registries|entry||Dashboard-first list|plat_store|team|entities, duplicates, field catalog
r15_sem|build|Data and integration|Semantic model|entry||Other: admin configuration|metrics|team|measures, dimensions, certified metrics
r16m_sources|build|Data and integration|Data sources|entry||Dashboard-first list|flw_hub|team|sources, field mapping
own_gaps|build|Data and integration|Ownership and gaps|view|plat_reg|Dashboard-first list|r16h_ci|team|owners, backups, gaps
plat_data|build|Data and integration|Data model|view|plat_map|Other: graph explorer|plat_data_old|team|entities, fields, lineage
plat_data_old|build|Data and integration|Data tables and checks (old)|retire|plat_data|Other: graph explorer|plat_data|team|entities, fields
plat_dmap|build|Data and integration|Data flows|view|plat_map|Other: map or diagram|plat_data|team|data connections, field lineage
plat_fab|build|Data and integration|Data feeds and mappings|view|flw_hub|Dashboard-first list|flw_hub|team|connectors, mappings, field authority
plat_pmap|build|Data and integration|How processes connect|view|plat_map|Other: map or diagram|plat_proc|team|process connections, critical paths
plat_store|build|Data and integration|Entity store|view|plat_reg|Dashboard-first list|plat_reg|team|entities, promotions, change log
r15d_facts|build|Data and integration|Facts and conflicts|view|plat_reg|Dashboard-first list|metrics|team|shared numbers, conflicts
r16m_import|build|Data and integration|Import foundation data|view|r16m_sources|Intake form|itom_disc|team|import batches, templates
zl_conn|build|Data and integration|Connections and gaps|view|plat_map|Other: graph explorer|plat_pmap|team|dead links, orphans, fixes
log|build|Product|Product log|entry||Other: activity log|r17q_thinking|team|feedback items, releases
scr_map|build|Product|Screen map|entry||Report|nav_studio|team|screens, keep and cut decisions
adm_env|build|Run the platform|Environments and releases|entry||Other: admin configuration|dev_pipe|team|environments, migration kits, upgrades, feature flags
adm_meter|build|Run the platform|Licensing and billing|entry||Dashboard-first list|tbm_model|team|seats, plans, usage meters, statements
adm_studio|build|Run the platform|Fields, forms and themes|entry||Other: admin configuration|r16h_status|team|fields, layouts, list views, themes, translations
nav_studio|build|Run the platform|Navigation and search settings|entry||Other: admin configuration|scr_map|team|menu map, search health, usage
plat_debt|build|Run the platform|Technical debt|entry||Dashboard-first list|r18_debt|team|debt items, exceptions, burn-down
r16m_setup|build|Run the platform|Implementation and setup|entry||Other: wizard|tn_admin|team|setup steps, tenants, branding, cutover
r16m_deploy|build|Run the platform|Deployment paths|view|r16m_setup|Other: reference|r16m_setup|team|deployment options, fit finder
r18_debt|build|Run the platform|Risk and debt|merged|plat_debt|Report|plat_debt|team|debt and risk per build
plat_retrofit|build|Build|Retrofit matrix|entry||Report|plat_contract|platform|screens, foundation checks, waivers`;
/* families: canonical id | menu label | views (id:label, * marks a view merged from another screen) (section d) */
const FAMS=`flw_appr|My approvals|flw_appr:My approvals;inbox:Alerts and inbox
meet_hub|Meetings|meet_hub:Meetings;fo:My calendar and follow-ups;meet_act:Meeting actions;meet_dec:Decisions made in meetings;meet_series:Recurring meetings and forums;ppl_av:Book a room;ppl_meet:Meeting minutes
svc_portal|Report a problem or order something|svc_portal:Report a problem or order something;svc_guides:Order guides
r18_lens|Executive lenses|r18_lens:Executive lenses;r18_strategy:How each function enables the strategy;r18_levels:Views by level*
exe_dash|Dashboards|exe_dash:Dashboards;r15_rpt:Reports and subscriptions;r16j_dash:Build a dashboard;kcs_viz:Chart library and builder*;r17u_dash:Dashboard viewer and templates*
bud_ben|Benefits and value realized|bud_ben:Benefits and value realized;r17q_value:Value realized
bst|Budget and spend traceability|bst:Budget and spend traceability;r18_spend:Spend detail;strat_exec:Trace goals to money and work
ims|Schedules across projects|ims:Schedules across projects;ppm_wbs:Tasks and work breakdown;plan:One project's plan*
agile_board|Team boards and backlogs|agile_board:Team boards and backlogs;agile_art:Planning across teams
kcs_home|Browse and manage articles|kcs_home:Browse and manage articles;kcs_edit:Write or update an article;kcs_gap:What knowledge is missing
kg|See what a change would affect|kg:See what a change would affect;vault:Explore connected knowledge;itom_graph:Technology dependencies
obs_dash|Monitor systems|obs_dash:Monitor systems;itom_evt:Alerts and events;itom_slo:Reliability targets
svc_360|Services we run|svc_360:Services we run;exe_apps:Applications we run
itom_cmdb|Servers, apps and other technology|itom_cmdb:Servers, apps and other technology;itom_disc:Scan and import technology;itom_health:Is our technology data trustworthy;itom_model:How technology records are structured;r16h_ci:Who owns each technology item
bud_over|Budgets|bud_over:Budgets;bud_lines:All budget lines;bud_model:Forecast model;fin_budget:Budget by funding type;fin_model:IT financial model
fin_color|Which funding pays for what|fin_color:Which funding pays for what;fin_gates:Funding approval gates;fin_rules:Financial control checks;fin_spend:Test the order money is spent
tbm_model|See what technology costs|tbm_model:See what technology costs;bud_ccmap:Cost center mapping;fin_alloc:Charge costs to teams;itom_fin:Cloud spend
org_chart|Org chart|org_chart:Org chart;ppl_org:Workload by team
tower|Watch and control AI agents|tower:Watch and control AI agents;adm_gate:AI usage and cost;agent_defs:Agent definitions;ai_runtime:Agent runtime;flw_agent:Workflows with AI agents;kcs_skills:What AI agents can do;r15d_agents:Agent registry
kcs_test|Test AI answers|kcs_test:Test AI answers;kcs_prompt:Prompt library
grc_home|Governance, risk and compliance|grc_home:Governance, risk and compliance;grc_aud:Audit management;grc_ctl:Controls and testing;grc_find:Issues and findings;grc_pol:Policies
bc_home|Resilience|bc_home:Resilience;bc_cal:Exercise calendar;bc_decl:Declare a disaster;bc_frame:Resilience framework;bc_metrics:Resilience measures;bc_plans:Continuity plans;bc_tiers:Recovery tiers;bc_trace:Continuity traceability
exe_risk|Risk|exe_risk:Risk;grc_exc:Exceptions and acceptances;grc_risk:Risk register;grc_ven:Third-party risk
plat_proc|Processes|plat_proc:Processes;draw_studio:Draw a process;flw_bpmn:Process models (BPMN);flw_design:Workflow designer;r16m_guides:Process guides
exe_mat|Process maturity|exe_mat:Process maturity;r18_mature:Maturity roadmaps
r18_builds|Build list|r18_builds:Build list;plat_gate:Approve citizen-built apps
showroom|Showroom|showroom:Showroom;r15_mobile:Phone approvals and on-call (preview);r17p_tour:Tour;r17q_thinking:How it was built
r16g_perm|Permissions|r16g_perm:Permissions;adm_sec:Security and access
tn_admin|Tenancy|tn_admin:Tenancy;r16m_overlay:Tenant overlays
flw_dmn|Rules and decisions|flw_dmn:Rules and decisions;dec_cov:Rule coverage;r17s_rules:In-app rules and scripts;svc_notify:Notifications;zevt:Events and rules
r16h_groups|Approval groups|r16h_groups:Approval groups;r16h_rules:Approval rules
plat_reg|Registries|plat_reg:Registries;own_gaps:Ownership and gaps;plat_store:Entity store;r15d_facts:Facts and conflicts
plat_map|Platform maps|plat_map:Platform maps;plat_data:Data model;plat_dmap:Data flows;plat_pmap:How processes connect;zl_conn:Connections and gaps
flw_hub|Connect other systems|flw_hub:Connect other systems;plat_fab:Data feeds and mappings
r16m_sources|Data sources|r16m_sources:Data sources;r16m_import:Import foundation data
r16m_setup|Implementation and setup|r16m_setup:Implementation and setup;r16m_deploy:Deployment paths`;
/* merge-only targets: the screen absorbs a merged view without becoming a family head; "tab" redirects to an existing tab
   that already holds the merged content (prefix:index of views()), otherwise the merged screen opens as a view of the target */
const MERGE={exe_scen:{to:"exe_strat",l:"Compare what-if scenarios"},itom_dev:{to:"dev_pipe",l:"Delivery speed",tab:"dev_v:6"},obs_std:{to:"itsm_chg",l:"Pre-approved changes"},
 r18_access:{to:"r15_iam",l:"Data access requests"},plat_self:{to:"plat_build",l:"Let "+BRAND.name+" extend itself"},r18_debt:{to:"plat_debt",l:"Risk and debt"},
 r18_levels:{to:"r18_lens"},kcs_viz:{to:"r16j_dash"},r17u_dash:{to:"r16j_dash"},plan:{to:"ims"}};
const TX={};let txo=0;
TAXO.split("\n").forEach(line=>{const p=line.split("|");if(p.length<9)return;TX[p[0]]={sp:p[1],sub:p[2],l:p[3],kind:p[4],ref:p[5]||"",arch:p[6],cmp:p[7],obj:p[8],objs:(p[9]||"").split(/\s*,\s*/).filter(Boolean),o:txo++}});
const FX=FAMS.split("\n").filter(Boolean).map(line=>{const p=line.split("|");return {id:p[0],label:p[1],views:p[2].split(";").map(v=>{const i=v.indexOf(":");const l=v.slice(i+1);return [v.slice(0,i),l.replace(/\*$/,""),/\*$/.test(l)]})}});
const spLabel=sp=>(SPACES[SPID[sp]]||[0,sp])[1];
/* the place of one screen: a saved override (old group id or new space id) moves the entry, the taxonomy row places it, and a
   screen with no row is search only */
function placeOf(id){const t=TX[id],ov=OVR[id];let r=t?Object.assign({id},t):{id,sp:OLDGRP[oldGroup(id)]||"build",sub:"",l:null,kind:"search",ref:"",arch:"",cmp:"",obj:"",objs:[],o:9000,untaxed:true};
 if(ov&&ov.g){const sp=SPID[ov.g]!=null?ov.g:OLDGRP[ov.g];if(sp){r.sp=sp;if(r.kind!=="entry")r.kind="entry";r.moved=true;if(ov.sub!=null)r.sub=ov.sub;else if(SPACES[SPID[sp]][5].indexOf(r.sub)<0)r.sub=SPACES[SPID[sp]][5][0]}}
 return r}
function spaceEntries(sp,persona){const out={};SPACES[SPID[sp]][5].forEach(s=>out[s]=[]);
 SCREENS.forEach(s=>{const id=s[0];if(id==="home"&&sp!=="home")return;const p=placeOf(id);if(p.sp!==sp)return;
  const shown=p.kind==="entry"||(p.kind==="role"&&persona&&persona===p.ref);if(!shown)return;(out[p.sub]=out[p.sub]||[]).push(id)});
 Object.keys(out).forEach(k=>out[k].sort((a,b)=>placeOf(a).o-placeOf(b).o));return out}
NAVX.taxo={spaces:()=>SPACES.map(s=>({id:s[0],label:s[1],kind:s[2],icon:s[3],blurb:s[4],subs:s[5].slice()})),areas:()=>AREA_IDS.slice(),
 row:id=>TX[id]?Object.assign({id},TX[id]):null,place:placeOf,label:spLabel,entries:spaceEntries,oldGroup:g=>OLDGRP[g]||null,oldGroups:()=>Object.assign({},OLDGRP),
 families:()=>FX.map(f=>({id:f.id,label:f.label,views:f.views.map(v=>v.slice())})),merges:()=>JSON.parse(JSON.stringify(MERGE)),rows:()=>Object.keys(TX)};
/* the check: every registered screen has exactly one place; every entry sits in one sub-group of one space; the menu stays
   inside its budget of 7 areas x 7 sub-groups x 7 entries (section g, rule 8) */
NAVX.taxo.check=function(){const ids=SCREENS.map(s=>s[0]);const by={entry:[],view:[],merged:[],search:[],role:[],retire:[]};const seen={},dup=[];
 ids.forEach(id=>{const p=placeOf(id);(by[p.kind]=by[p.kind]||[]).push(id)});
 SPACES.forEach(s=>{const e=spaceEntries(s[0],"admin");Object.keys(e).forEach(sub=>e[sub].forEach(id=>{if(seen[id])dup.push(id);seen[id]=s[0]+" / "+sub}))});
 const famIds=new Set();FX.forEach(f=>f.views.forEach(v=>famIds.add(v[0])));
 const badRef=ids.filter(id=>{const p=placeOf(id);if(p.kind==="view")return !famIds.has(id)||!ids.includes(p.ref);if(p.kind==="merged"||p.kind==="retire")return !ids.includes(p.ref);return false});
 const over=[];SPACES.forEach(s=>{const e=spaceEntries(s[0],"admin");const subs=Object.keys(e).filter(k=>e[k].length);if(subs.length>7)over.push(s[0]+" has "+subs.length+" sub-groups");subs.forEach(k=>{if(e[k].length>7)over.push(s[0]+" / "+k+" has "+e[k].length+" entries")})});
 if(AREA_IDS.length>7)over.push(AREA_IDS.length+" areas");
 return {screens:ids.length,entries:by.entry.length,views:by.view.length,merged:by.merged.length,search:by.search.length,role:by.role.length,retire:by.retire.length,
  placed:Object.keys(seen).length,duplicates:dup,untaxed:ids.filter(id=>!TX[id]),orphans:Object.keys(TX).filter(id=>!ids.includes(id)),badRef,over,where:seen}};
/* the unmapped check: every registered screen must have an entry in the map */
/* PH-14 (step 3): old group ids and labels, and the new area labels, open the area's landing screen (old links, saved hashes);
   a screen id always wins, and NAVX.resolveGroup turns any old group id into the space that took it over */
const AREA_HOME={home:"home",my:"flw_appr",ask:"svc_portal",strat:"exe_strat",deliver:"ppm_proj",ops:"itsm_home",money:"bud_over",people:"org_chart",risk:"grc_home",transform:"plat_proc",show:"showroom",build:"plat_map"};
const OLDGL={story:"story and demo",my:"my work",help:"get help or ask for something",plan:"projects and delivery",fix:"service and support",money:"money and contracts",people:"people and teams",learn:"knowledge and learning",make:"my builds and access",kit:"design, data and controls",lens:"executive lenses",strat:"strategy and value",grc:"risk and control",res:"resilience",ai:"ai oversight",reg:"registry and truth",tech:"enterprise it",plat:"platform admin",new:"new and unsorted"};
Object.keys(OLDGRP).forEach(g=>{const h=AREA_HOME[OLDGRP[g]];if(h&&g!=="plan"&&g!=="home"&&!ALIAS[g])ALIAS[g]=h});
Object.keys(OLDGL).forEach(g=>{const h=AREA_HOME[OLDGRP[g]];if(h&&!ALIAS[OLDGL[g]])ALIAS[OLDGL[g]]=h});
SPACES.forEach(s=>{const h=AREA_HOME[s[0]];if(h&&s[0]!=="home")ALIAS[s[1].toLowerCase()]=h});
NAVX.areaHome=Object.assign({},AREA_HOME);
NAVX.resolveGroup=g=>{g=String(g||"").trim();if(SPID[g]!=null)return g;if(OLDGRP[g])return OLDGRP[g];const l=g.toLowerCase();const k=Object.keys(OLDGL).find(x=>OLDGL[x]===l);if(k)return OLDGRP[k];const sp=SPACES.find(x=>x[1].toLowerCase()===l);return sp?sp[0]:null};
/* the unmapped check: every registered screen must have a row in the taxonomy (a screen with none is search only) */
NAVX.unmapped=function(){return SCREENS.map(s=>s[0]).filter(id=>!TX[id])};
NAVX.missing=function(){return Object.keys(TX).filter(id=>!screenRow(id))};
NAVX.counts=function(){const o={};SPACES.forEach(s=>{const e=spaceEntries(s[0],"admin");o[s[0]]=Object.keys(e).reduce((n,k)=>n+e[k].length,0)});return o};
/* PH-14 scope item 6: every non-hidden screen appears in exactly one menu place; every other screen is reachable through its
   family, a merge, an alias or search. placed counts the menu entries; notPlaced lists screens with no place at all. */
NAVX.check=function(){const c=NAVX.taxo.check();const ids=SCREENS.map(s=>s[0]);
 const fam=id=>!!G(()=>R15.famOf[id])||!!G(()=>R15.alias[id]);
 const notPlaced=ids.filter(id=>{const p=placeOf(id);if(p.kind==="entry"||p.kind==="role")return !c.where[id];if(p.kind==="view"||p.kind==="merged")return !fam(id);if(p.kind==="retire")return !(fam(id)||screenRow(p.ref));return false});
 return {screens:ids.length,placed:c.placed,entries:c.entries,views:c.views,merged:c.merged,search:c.search,role:c.role,retire:c.retire,notPlaced,duplicates:c.duplicates,unmapped:c.untaxed,orphans:c.orphans,badRef:c.badRef,over:c.over}};

/* ---------- state per persona: favorites, history, recent searches, telemetry ---------- */
let ST=null,STP=null,saveT=0;
const SEED_FAV={exec:["flw_appr","exe_dash","bud_over"],fin:["inv","bud_over","bud_ven"],pm:["ims","ppm_raid","port"],ops:["itsm_inc","itom_evt","itsm_chg"]};
const SEED_HIST=[["itsm_chg",30,6],["bud_ven",27,11],["exe_risk",52,3],["svc_portal",9,4]];
function mkScreen(id){const s=screenRow(id),m=resolve(id);return {id:"screen:"+id,kind:"screen",type:"Screen",key:id,title:m.l,sub:gLabel(m.g),formal:formal(id)}}
function st(){const p=(typeof S!=="undefined"&&S.persona)||"exec";if(STP===p&&ST)return ST;STP=p;ST=store.get("oukala-nav:"+p)||{};
 if(!ST.fav)ST.fav=[];if(!ST.hist)ST.hist=[];if(!ST.rs)ST.rs=[];if(!ST.tel)ST.tel={};
 if(!ST.seeded){ST.seeded=1;const base=now();(SEED_FAV[p]||SEED_FAV.exec).forEach(id=>{if(screenRow(id))ST.fav.push(Object.assign(mkScreen(id),{t:base,seed:1}))});
  SEED_HIST.forEach(a=>{if(screenRow(a[0]))ST.hist.push(Object.assign(mkScreen(a[0]),{t:base-a[1]*3600*1000-(a[1]>24?86400000:0),n:0,dur:0,seed:1}))}); /* PR-16: seeded rows carry no visit count or time; real counts live in USAGE */ST.hist.sort((a,b)=>b.t-a.t);persist()}
 return ST}
function persist(){clearTimeout(saveT);saveT=0;if(STP)store.set("oukala-nav:"+STP,ST)}
function persistSoon(){if(saveT)return;saveT=setTimeout(persist,600)}
NAVX.state=()=>st();
NAVX.fav={list:()=>st().fav.slice(),has:(id)=>st().fav.some(f=>f.id===id),toggle:(e)=>toggleFav(e),add:(e)=>addFav(e),remove:(id)=>removeFav(id),rename:(id,l)=>renameFav(id,l),move:(id,idx)=>moveFav(id,idx)};
NAVX.hist={list:()=>st().hist.slice(),clear:()=>clearHist(),back:()=>goBack(),record:(e)=>visit(e)};

/* ---------- telemetry behind the five navigation and search metrics ---------- */
const TELB={searches:240,ok:209,zero:10,navs:420,navDepth:1010,favOpens:96,histOpens:64,returns:130,weekly:208};
function tel(){const t=st().tel;Object.keys(TELB).forEach(k=>{if(t[k]==null)t[k]=TELB[k]});return t}
let SRC="nav";
function noteOpen(src,depth){const t=tel();t.navs++;t.navDepth+=depth;if(src==="fav")t.favOpens++;if(src==="hist"){t.histOpens++;t.returns++}pushMetrics()}
function pushMetrics(){const t=tel();if(typeof METRICS==="undefined")return;const M=METRICS;const r1=v=>Math.round(v*10)/10;
 if(M.m_nav_depth){M.m_nav_depth.cur=r1(t.navDepth/Math.max(1,t.navs));M.m_nav_depth.tr=M.m_nav_depth.tr.slice(1).concat([M.m_nav_depth.cur])}
 if(M.m_search_success){M.m_search_success.cur=Math.round(t.ok/Math.max(1,t.searches)*100)}
 if(M.m_search_zero_results){M.m_search_zero_results.cur=r1(t.zero/Math.max(1,t.searches)*100)}
 if(M.m_fav_use){M.m_fav_use.cur=Math.min(100,Math.round(t.favOpens/Math.max(1,t.navs)*100*4.2))}
 if(M.m_hist_return){M.m_hist_return.cur=Math.min(100,Math.round(t.returns/Math.max(1,t.navs)*100))}
 persistSoon()}

/* ---------- favorites ---------- */
function stripEntry(e){return {id:e.id,kind:e.kind,type:e.type||"Record",key:e.key,title:e.title,sub:e.sub||"",op:e.op||null,scr:e.scr||null,formal:e.formal||""}}
function addFav(e){if(!e)return false;const s=st();if(s.fav.some(f=>f.id===e.id))return false;s.fav.push(Object.assign(stripEntry(e),{t:now()}));persist();syncStars();refreshFavs();W.audit&&audit("Added a favorite",e.title);return true}
function removeFav(id){const s=st(),i=s.fav.findIndex(f=>f.id===id);if(i<0)return false;const f=s.fav.splice(i,1)[0];persist();syncStars();refreshFavs();W.audit&&audit("Removed a favorite",f.title);return true}
function toggleFav(e){if(!e)return;const on=st().fav.some(f=>f.id===e.id);if(on){removeFav(e.id);toast("Removed from favorites: "+e.title)}else{addFav(e);toast("Added to favorites: "+e.title,"good")}return !on}
function renameFav(id,label){const f=st().fav.find(x=>x.id===id);if(!f)return;label=String(label||"").trim().slice(0,60);if(label&&label!==f.title)f.label=label;else delete f.label;persist();refreshFavs();W.audit&&audit("Renamed a favorite",f.title+" to "+(label||f.title))}
function moveFav(id,idx){const a=st().fav,i=a.findIndex(f=>f.id===id);if(i<0)return;const it=a.splice(i,1)[0];if(idx>i)idx--;a.splice(Math.max(0,Math.min(a.length,idx)),0,it);persist();refreshFavs()}
const favName=f=>f.label||f.title;

/* ---------- history ---------- */
const STK=[];                 /* this session's visit stack, for "Back to where I was" */
const CUR={screen:null,rec:null};
let hidAt=0;
function finish(slot){const c=CUR[slot];if(!c)return;CUR[slot]=null;const e=st().hist.find(h=>h.id===c.id);if(e){const d=Math.min(now()-c.t0,30*60*1000);if(d>0)e.dur=(e.dur||0)+d;persistSoon()}}
function visit(e){if(!e||!e.id||!e.title)return;const s=st();const slot=e.kind==="screen"?"screen":"rec";
 if(CUR[slot]&&CUR[slot].id===e.id&&now()-CUR[slot].t0<1200)return;
 finish(slot);
 const i=s.hist.findIndex(h=>h.id===e.id);let h;
 if(i>=0){h=s.hist.splice(i,1)[0];if(h.seed){h.n=1;h.dur=0}else h.n=(h.n||1)+1;h.title=e.title;if(e.sub)h.sub=e.sub;if(e.op)h.op=e.op;if(e.scr)h.scr=e.scr}else{h=Object.assign(stripEntry(e),{n:1,dur:0})}
 h.t=now();delete h.seed;s.hist.unshift(h);if(s.hist.length>200)s.hist.length=200;
 CUR[slot]={id:e.id,t0:now()};
 if(STK[STK.length-1]!==e.id)STK.push(e.id);if(STK.length>60)STK.shift();
 persistSoon();
 const o=q1("#nxHistPop");if(o&&o.matches(":popover-open"))drawHist()}
function clearHist(){const s=st();s.hist=[];STK.length=0;persist();drawHist();W.audit&&audit("Cleared history","")}
document.addEventListener("visibilitychange",()=>{if(document.hidden){hidAt=now();finish("screen");finish("rec")}else{const sc=S.screen;if(sc&&!CUR.screen)CUR.screen={id:"screen:"+sc,t0:now()}}});
document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="drawer"&&e.newState==="closed"){finish("rec");DR.cur=null}},true);
window.addEventListener("pagehide",()=>{finish("screen");finish("rec");persist()});

/* ---------- record openers: how to reopen a favorited or remembered record ---------- */
const OPENERS={};
NAVX.recordOpener=function(kind,fn){if(typeof fn==="function")OPENERS[kind]=fn;return kind};
NAVX.openers=OPENERS;
NAVX.recordOpener("screen",(key)=>go(key));
NAVX.recordOpener("go",(key,e)=>{const op=e&&e.op||{};go(op.screen,op.arg)});
NAVX.recordOpener("record",(key)=>W.recDrawer&&recDrawer(key));
NAVX.recordOpener("person",(key)=>W.person360&&person360(key));
NAVX.recordOpener("meeting",(key)=>W.meetingDrawer&&meetingDrawer(key));
NAVX.recordOpener("process",(key)=>W.PROCLIB&&PROCLIB.open(key));
NAVX.recordOpener("entity",(key)=>W.ATLAS&&ATLAS.focus(key));
NAVX.recordOpener("module",(key)=>W.MODMAP&&MODMAP.select(key));
NAVX.recordOpener("metric",(key)=>go("metrics",key));
NAVX.recordOpener("call",(key,e)=>{const op=e.op||{};const fn=W[op.fn];if(typeof fn!=="function")return false;const run=()=>fn.apply(null,op.args||[]);if(e.scr&&S.screen!==e.scr){go(e.scr);setTimeout(run,220)}else run()});
NAVX.recordOpener("dom",(key,e)=>{const op=e.op||{};const run=()=>{const b=document.createElement("button");b.type="button";b.style.cssText="position:fixed;left:-99px;top:-99px;width:1px;height:1px;opacity:0";Object.keys(op.attrs||{}).forEach(k=>b.setAttribute(k,op.attrs[k]));document.body.appendChild(b);try{b.click()}finally{b.remove()}};
 if(e.scr&&S.screen!==e.scr){go(e.scr);setTimeout(run,260)}else run()});
NAVX.recordOpener("search",(key,e)=>{openPalette({q:e.title,scope:"all"})});
/* open any favorite or history entry; falls back to search when it cannot be reopened */
function openEntry(e,src){if(!e)return;SRC=src||SRC;let ok=true;
 noteOpen(src||"nav",src==="fav"||src==="hist"?1:2);
 if(e.kind==="screen"){go(e.key);return}
 const fn=OPENERS[e.kind];
 if(!fn){openPalette({q:e.title,scope:"all"});return}
 try{const r=fn(e.key,e);if(r===false)ok=false}catch(x){ok=false}
 if(e.kind!=="search"&&e.kind!=="go"){setTimeout(()=>{const d=q1("#drawer");const open=d&&d.matches(":popover-open");if(!ok||(!open&&!CHECKED[e.kind])){if(!ok){toast("Could not reopen "+e.title+". Searching for it instead.","warn");openPalette({q:e.title,scope:"all"})}}},700)}}
const CHECKED={process:1,entity:1,module:1,metric:1,go:1,search:1};
NAVX.open=openEntry;
function goBack(){if(STK.length<2){toast("Nothing earlier in this session yet");return}
 STK.pop();const id=STK.pop();const e=st().hist.find(h=>h.id===id);if(!e){toast("Nothing earlier in this session yet");return}
 closePops();openEntry(e,"hist");audit("Went back","to "+e.title)}
NAVX.back=goBack;

/* the screen-visit hook: render() is the one place every navigation passes through */
const ARGK={
 inv:a=>{const i=G(()=>INVOICES.find(x=>x.id===a));return i?{type:"Invoice",title:i.id+" · "+i.vendor}:null},
 trace:a=>{const n=G(()=>N(a));return n?{type:"Record",title:n.n}:null},
 metrics:a=>{const m=G(()=>METRICS[a]);return m?{type:"Metric",title:m.n}:null},
 fo:a=>{const m=G(()=>MEETINGS.find(x=>x.id===a));return m?{type:"Meeting",title:m.t}:null},
 kg:a=>{const n=G(()=>ANODE(a));return n?{type:"Graph item",title:n.n}:null}};
let lastScr=null;
function onScreen(){const sc=S.screen;if(sc===lastScr)return;lastScr=sc;if(!screenRow(sc))return;visit(Object.assign(mkScreen(sc),{}))}
function onGoArg(screen,arg){if(arg==null||!ARGK[screen])return;const r=ARGK[screen](arg);if(!r)return;visit({id:"go:"+screen+":"+arg,kind:"go",type:r.type,key:screen+":"+arg,title:r.title,sub:labelOf(screen),op:{screen,arg}})}

/* ---------- drawer context: detect which record a drawer shows and how to reopen it ---------- */
const DR={cur:null,click:null};
let CTX=null;
const SKIPA=/^data-(nx|dnd|nav$|vw$|bt-|dexpand|lr-|popover|k$)/;
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;if(t.closest("#drawer>.dctl,[data-nx-star],#nxPal,.nx-pop"))return;
 let el=t,depth=0,found=null;while(el&&el!==document.body&&depth<7){const a={};let n=0;for(const at of el.attributes||[]){if(at.name.indexOf("data-")===0&&!SKIPA.test(at.name)&&at.value.length<140){a[at.name]=at.value;n++}}if(n){found=a;break}el=el.parentElement;depth++}
 DR.click={t:now(),attrs:found,scr:S.screen}},true);
function withCtx(ctx,fn,self,args){const prev=CTX;CTX=ctx;try{return fn.apply(self,args)}finally{CTX=prev}}
function drawerTitle(d){let t="";const hs=qa("h1,h2,h3,.ftitle",d);for(const h of hs){if(h.closest(".dctl"))continue;t=(h.textContent||"").replace(/\s+/g," ").trim();if(t)break}
 if(!t){const e=d.querySelector(".eyebrow");t=e?(e.textContent||"").replace(/\s+/g," ").trim():""}return t.slice(0,120)}
const TYPEPAT=[[/\bINC\d+/,"Incident"],[/\bCHG\d+/,"Change"],[/\bPRB\d+/,"Problem"],[/\b(SR|REQ)\d+/,"Request"],[/\bINV-\d+/,"Invoice"],[/\bPR\d\b/,"Project"],[/\bKB\d+|\bKB-\d+/,"Article"],[/\bRX\d+/,"RAID item"],[/\bSOW\b|\bCTR?-?\d+/,"Contract"],[/\bRB-?\d+/,"Runbook"],[/\bSLO-?\d+/,"SLO"],[/\bREL-?\d+/,"Release"],[/\bDEM-?\d+|\bD\d{3}\b/,"Demand"]];
function guessType(title,attrs,d){const hay=title+" "+Object.values(attrs||{}).join(" ");for(const p of TYPEPAT){if(p[0].test(hay))return p[1]}
 const e=d&&d.querySelector(".eyebrow, .pill");const et=e?(e.textContent||"").replace(/\s+/g," ").trim():"";if(et&&et.length<=28&&!/^(close|full screen)/i.test(et))return et.replace(/^\W+|\W+$/g,"");return "Record"}
function hash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)}
function entryFromDrawer(d,title){const c=CTX;
 if(c&&c.kind){return {id:c.kind+":"+c.key,kind:c.kind,type:c.type||"Record",key:c.key,title:c.title||title,sub:c.sub||labelOf(S.screen),op:c.op||null,scr:c.scr||S.screen}}
 if(c&&c.fn){const ok=c.args.every(a=>/^(string|number|boolean)$/.test(typeof a)&&String(a).length<90);
  if(ok){const key=c.fn+":"+c.args.join("|");return {id:"call:"+key,kind:"call",type:guessType(title,{a:c.args.join(" ")},d),key,title,sub:labelOf(S.screen),op:{fn:c.fn,args:c.args},scr:S.screen}}}
 const k=DR.click;if(k&&k.attrs&&now()-k.t<1800){const key=hash(JSON.stringify(k.attrs));return {id:"dom:"+key,kind:"dom",type:guessType(title,k.attrs,d),key,title,sub:labelOf(S.screen),op:{attrs:k.attrs},scr:k.scr||S.screen}}
 return {id:"search:"+hash(title.toLowerCase()),kind:"search",type:guessType(title,null,d),key:title.toLowerCase(),title,sub:labelOf(S.screen),scr:S.screen}}
function decorateDrawer(ent){const d=q1("#drawer");if(!d)return;const bar=d.querySelector(":scope>.dctl");if(!bar)return;let b=bar.querySelector(".nx-dstar");
 if(!ent){if(b)b.remove();return}
 const html=starBtn("drawer","nx-dstar",ent.title);if(b)b.outerHTML=html;else bar.insertAdjacentHTML("afterbegin",html)}
/* CL-35: runs from the afterOpenDrawer hook (inside the core openDrawer). The record context (CTX, last click) is read at once;
   the star is placed one microtask later, after the shell has built the drawer's .dctl header bar. */
function afterDrawer(){const d=q1("#drawer");if(!d)return;DR.cur=null;
 if(d.querySelector("form.fform")){queueMicrotask(()=>decorateDrawer(null));return}
 const title=drawerTitle(d);if(!title){queueMicrotask(()=>decorateDrawer(null));return}
 const ent=entryFromDrawer(d,title);DR.cur=ent;visit(ent);queueMicrotask(()=>{try{if(DR.cur===ent)decorateDrawer(ent)}catch(e){}})}
if(W.HOOKS)HOOKS.on("afterOpenDrawer",()=>{try{afterDrawer()}catch(e){}},{id:"nav.drawer"});

/* wrap the named open-a-record functions once everything else has loaded */
let wrapped=false;
function wrapGlobals(){if(wrapped)return;wrapped=true;
 const explicit={
  recDrawer:(id)=>{const n=G(()=>N(id))||G(()=>KGN.find(x=>x.id===id));const T=n?G(()=>(KGN.find(x=>x.id===id)?KT[n.t]:TYPES[n.t])):null;return {kind:"record",key:id,type:T?T[0]:"Record",title:n?n.n:id}},
  person360:(name)=>({kind:"person",key:name,type:"Person",title:name,sub:(G(()=>who(name))||{}).role||""}),
  meetingDrawer:(id)=>{const m=G(()=>MEETINGS.find(x=>x.id===id));return {kind:"meeting",key:id,type:"Meeting",title:m?m.t:id}}};
 Object.keys(explicit).forEach(n=>{const f=W[n];if(typeof f!=="function")return;W[n]=function(){const a=arguments;const c=G(()=>explicit[n].apply(null,a));return withCtx(c,f,this,a)}});
 const skip=/^(open|close)Drawer$|Form/;
 Object.getOwnPropertyNames(W).forEach(n=>{if(!/Drawer$/.test(n)||skip.test(n)||explicit[n])return;const f=W[n];if(typeof f!=="function"||f.__nx)return;
  const w=function(){const a=[].slice.call(arguments);return withCtx({fn:n,args:a},f,this,arguments)};w.__nx=1;try{W[n]=w}catch(e){}});
 /* object APIs: process library, data atlas, module map */
 if(W.PROCLIB&&PROCLIB.open&&!PROCLIB.open.__nx){const f=PROCLIB.open;PROCLIB.open=function(id){const p=G(()=>PROCLIB.get(id));return withCtx({kind:"process",key:id,type:"Process",title:p?p.name:id,sub:p&&p.familyName||""},f,this,arguments)};PROCLIB.open.__nx=1}
 if(W.ATLAS&&ATLAS.focus&&!ATLAS.focus.__nx){const f=ATLAS.focus;ATLAS.focus=function(id){const r=f.apply(this,arguments);const en=G(()=>PLAT.ent(id));if(en)visit({id:"entity:"+id,kind:"entity",type:"Data entity",key:id,title:en.label||id,sub:"Data model"});return r};ATLAS.focus.__nx=1}
 if(W.MODMAP&&MODMAP.select&&!MODMAP.select.__nx){const f=MODMAP.select;MODMAP.select=function(id){const r=f.apply(this,arguments);const m=G(()=>MODMAP.modules.find(x=>x.id===id));if(m)visit({id:"module:"+id,kind:"module",type:"Module",key:id,title:m.name||m.sn||id,sub:"Process flow"});return r};MODMAP.select.__nx=1}
}

/* ---------- stars ---------- */
function isFavRef(ref){if(!ref)return false;const s=st();
 if(ref==="drawer")return !!(DR.cur&&s.fav.some(f=>f.id===DR.cur.id));
 const i=ref.indexOf(":"),k=ref.slice(0,i),v=ref.slice(i+1);
 if(k==="screen")return s.fav.some(f=>f.id===ref);
 if(k==="hist"||k==="fav")return s.fav.some(f=>f.id===v);
 return s.fav.some(f=>f.id===ref)}
function starBtn(ref,cls,name){const on=isFavRef(ref);return `<button type="button" class="nx-star ${cls||""}" data-nx-star="${E(ref)}" aria-pressed="${on}" aria-label="${on?"Remove":"Add"} ${E(name||"this")} ${on?"from":"to"} favorites" title="${on?"Remove from favorites":"Add to favorites"}">${SVG(ICO.star,16,1.8)}</button>`}
function syncStars(){qa("[data-nx-star]").forEach(b=>{const on=isFavRef(b.dataset.nxStar);if(b.getAttribute("aria-pressed")!==String(on)){b.setAttribute("aria-pressed",String(on));const nm=(b.getAttribute("aria-label")||"").replace(/^(Add|Remove) | (to|from) favorites$/g,"");b.setAttribute("aria-label",(on?"Remove ":"Add ")+nm+(on?" from":" to")+" favorites");b.title=on?"Remove from favorites":"Add to favorites"}});
 const n=st().fav.length;qa(".nx-favcount").forEach(x=>{x.textContent=n;x.hidden=!n})}
function decorateHero(){const h=q1("#view .hero,#view .hero-x");if(!h||h.querySelector(".nx-hstar"))return;h.insertAdjacentHTML("beforeend",starBtn("screen:"+S.screen,"nx-hstar",labelOf(S.screen)))}

/* ---------- navigation HTML (called by ui.js navHTML) ---------- */
const phoneMQ=matchMedia("(max-width:700px),(max-height:500px) and (max-width:950px)");/* R17: phone shell (portrait + short landscape); 701 to 900 wide is the tablet, collapsed rail */
const collapsed=()=>!phoneMQ.matches&&!!(q1("#railCollapse")&&q1("#railCollapse").checked);
function typeIcon(t){t=String(t||"");if(/person|people|contractor/i.test(t))return ICO.user;if(/process|workflow/i.test(t))return ICO.flow;if(/data|field|entity|table/i.test(t))return ICO.table;if(/metric|measure/i.test(t))return ICO.chart;if(/knowledge|article|book/i.test(t))return ICO.doc;if(/module/i.test(t))return ICO.plat;return ICO.doc}
const BADGE={inv:3,tower:1};
function itemHTML(id,o){o=o||{};const s=screenRow(id);if(!s)return"";const m=resolve(id),hint=o.pin?"":hintOf(id),cur=S.screen===id,lab=o.label||m.l;
 return `<div class="navit${o.pin?" nx-pin":""}" data-nx-it="${id}"${o.pin?' data-nx-pin="1"':""}><button class="navi" data-nav="${id}" ${cur?'aria-current="page"':""} title="${E(tip(id))}">${IC(s[2])}<span class="nx-t"><span class="nx-l">${E(lab)}</span>${hint?`<small class="nx-h">${E(hint)}</small>`:""}</span>${BADGE[id]?`<b class="badge">${BADGE[id]}</b>`:""}</button>${starBtn("screen:"+id,"nx-rowstar",lab)}</div>`}
NAVX.itemHTML=itemHTML;
function favRow(f){const scr=f.kind==="screen"&&screenRow(f.key);const name=f.label||(scr?labelOf(f.key):f.title);const icon=scr?IC(scr[2]):IC(typeIcon(f.type));const cur=scr&&S.screen===f.key;
 const meta=scr?"":`<small class="nx-h">${E(f.type)}${f.sub?" · "+E(f.sub):""}</small>`;
 return `<div class="navit nx-fav${cur?" is-cur":""}" data-dnd-id="${E(f.id)}" data-nx-fav="${E(f.id)}">${grip}<button class="navi" type="button" data-nx-open="${E(f.id)}" title="${E(scr?tip(f.key):f.type+": "+f.title)}">${icon}<span class="nx-t"><span class="nx-l" data-nx-lab>${E(name)}</span>${meta}</span></button><button type="button" class="nx-pen" data-nx-ren="${E(f.id)}" aria-label="Rename ${E(name)}" title="Rename">${SVG(ICO.pen,14,1.9)}</button><button type="button" class="nx-star nx-rowstar" data-nx-star="fav:${E(f.id)}" aria-pressed="true" aria-label="Remove ${E(name)} from favorites" title="Remove from favorites">${SVG(ICO.star,16,1.8)}</button></div>`}
function favsHTML(){const s=st();return `<section class="nx-favs" data-nx-favs aria-label="Favorites"><div class="nx-fh"><span class="nx-fht">${SVG(ICO.star,14,2)}<b>Favorites</b><em class="nx-favcount">${s.fav.length}</em></span></div>${s.fav.length?`<div class="nx-favlist" data-dnd="nxfav" data-dnd-scope="nxfav">${s.fav.map(favRow).join("")}</div>`:`<p class="nx-empty">Star any screen or record to keep it here.</p>`}</section>`}
/* ---------- PH-14 (step 3): the rail ----------
   Home, then My work and Ask or request, then the business areas in the persona's purview (always in the fixed order, never
   reordered; the persona's role pins first inside their own area), then All screens, Showroom and the Build and admin gear.
   The purview comes from NAVX.purview (mod_r15d_persona.js gives each persona its areas and pins). */
const ONLY={r15d_firstweek:["newhire","emp"]};
const READ_HIDE={ask:["Request"]}; /* read-only roles (Board member, Auditor) see no request forms */
function topOf(id){const f=G(()=>R15.famOf[id]);if(f&&f.id!==id)return topOf(f.id);const a=G(()=>R15.alias[id]);if(a&&a.to!==id)return topOf(a.to);return id}
function curSpace(){const id=G(()=>S.screen);if(!id||!screenRow(id))return null;return placeOf(topOf(id)).sp}
NAVX.purview=function(key){key=key||G(()=>S.persona)||"exec";const d=G(()=>R15D.DEFS[key])||{};const P=G(()=>PERSONAS[key])||{};
 const full=G(()=>PREF.nav==="full")&&key!=="guest";
 let areas=(d.areas||AREA_IDS).filter(a=>AREA_IDS.indexOf(a)>=0);if(full)areas=AREA_IDS.slice();
 areas=AREA_IDS.filter(a=>areas.indexOf(a)>=0); /* fixed order, whatever order the definition lists */
 const pins=(d.navPins||d.pin||[]).filter(id=>screenRow(id)).slice(0,4);
 return {key,areas,pins,gear:["arch","admin"].indexOf(key)>=0,all:key!=="guest",show:key!=="guest",readonly:!!(P.readonly||d.readonly),guest:key==="guest",full}};
function spaceIds(sp,P){const e=spaceEntries(sp,P.key);const ro=P.readonly&&!P.guest?(READ_HIDE[sp]||[]):[];
 const out={};Object.keys(e).forEach(k=>{if(ro.indexOf(k)>=0)return;const l=e[k].filter(id=>!ONLY[id]||ONLY[id].indexOf(P.key)>=0);if(l.length)out[k]=l});return out}
function pinsIn(sp,P){return P.pins.filter(id=>placeOf(topOf(id)).sp===sp)}
const pinLabel=id=>(TX[id]&&TX[id].l)||labelOf(id);
function spaceBody(sp,P){const e=spaceIds(sp,P);const pins=pinsIn(sp,P);const one=SPACES[SPID[sp]][5].length===1;
 return pins.map(id=>itemHTML(id,{pin:true,label:pinLabel(id)})).join("")+Object.keys(e).map(k=>(one?"":`<span class="navsub">${E(k)}</span>`)+e[k].map(id=>itemHTML(id)).join("")).join("")}
function groupHTML(sp,cur,P,o){o=o||{};P=P||NAVX.purview();const e=spaceIds(sp,P);const n=Object.keys(e).reduce((a,k)=>a+e[k].length,0);if(!n&&!pinsIn(sp,P).length)return"";
 S.navOpen=S.navOpen||{};const wedge=G(()=>SHOW.wedge.on(),false);const open=S.navOpen[sp]!==undefined?S.navOpen[sp]:(cur===sp||wedge);const sd=SPACES[SPID[sp]];
 return `<details class="navgd nx-area${o.gear?" nx-gear":""}" data-ng="${sp}" data-nx-sp="${sp}" ${open?"open":""}><summary title="${E(sd[4])}"><span class="nx-gi">${SVG(o.gear?ICO.gear:sd[3],15,1.9)}</span><span class="nx-gl">${E(sd[1])}</span><em class="nx-gc">${n}</em></summary>${spaceBody(sp,P)}</details>`}
const allBtn=()=>`<button class="navi nx-allb" type="button" data-nx-all aria-haspopup="dialog" title="Every area and every screen you can open">${IC(ICO.grid)}<span>All screens</span></button>`;
function railSpaces(P){return ["my","ask"].concat(P.areas)}
function flatHTML(){const s=st();const P=NAVX.purview();let h=`<span data-nx-rail hidden></span><button class="navi" type="button" data-nx-search title="Search (Ctrl or Cmd + K)">${IC(ICO.search)}<span>Search</span></button>`;
 const one=id=>{const sc=screenRow(id);return sc?`<button class="navi" data-nav="${id}" ${S.screen===id?'aria-current="page"':""} title="${E(tip(id))}">${IC(sc[2])}<span>${E(labelOf(id))}</span></button>`:""};
 h+=one("home");
 s.fav.slice(0,6).forEach(f=>{if(f.kind==="screen"&&screenRow(f.key)){if(f.key!=="home")h+=`<button class="navi nx-favi" type="button" data-nx-open="${E(f.id)}" title="Favorite: ${E(f.label||labelOf(f.key))}">${IC(screenRow(f.key)[2])}<span>${E(f.label||labelOf(f.key))}</span></button>`}else h+=`<button class="navi nx-favi" type="button" data-nx-open="${E(f.id)}" title="Favorite: ${E(favName(f))}">${IC(typeIcon(f.type))}<span>${E(favName(f))}</span></button>`});
 h+=`<div class="nx-sep" role="separator"></div>`;
 const cur=curSpace();
 const btn=(sp,ic)=>{const e=spaceIds(sp,P);if(!Object.keys(e).length&&!pinsIn(sp,P).length)return"";const sd=SPACES[SPID[sp]];return `<button class="navi nx-gbtn${cur===sp?" is-cur":""}" type="button" data-nx-grp="${sp}" aria-haspopup="true" title="${E(sd[1])}">${IC(ic||sd[3])}<span>${E(sd[1])}</span></button>`};
 railSpaces(P).forEach(sp=>{h+=btn(sp)});
 h+=`<div class="nx-sep" role="separator"></div>`;if(P.all)h+=allBtn();if(P.show)h+=one("showroom");if(P.gear)h+=btn("build",ICO.gear);
 h+=`<button class="navi" type="button" popovertarget="nxHistPop" title="History">${IC(ICO.clock)}<span>History</span></button>`;return h}
NAVX.html=function(){st();if(collapsed())return flatHTML();const P=NAVX.purview();const cur=curSpace();
 let h=`<span data-nx-rail hidden></span>`+navHelpBtn()+itemHTML("home")+favsHTML();
 ["my","ask"].forEach(sp=>h+=groupHTML(sp,cur,P));
 h+=`<div class="nx-sep nx-asep" role="separator"></div>`;
 P.areas.forEach(sp=>h+=groupHTML(sp,cur,P));
 h+=`<div class="nx-sep" role="separator"></div>`;
 if(P.all)h+=allBtn();
 if(P.show)h+=itemHTML("showroom",{label:spLabel("show")});
 if(P.gear)h+=groupHTML("build",cur,P,{gear:true});
 return h};
NAVX.rail={purview:p=>NAVX.purview(p),spaceIds:(sp,p)=>spaceIds(sp,NAVX.purview(p)),pins:(sp,p)=>pinsIn(sp,NAVX.purview(p)),curSpace,topOf};
function refreshFavs(){const n=q1("#nav");if(!n)return;if(collapsed()){try{renderNav()}catch(e){}return}
 const old=n.querySelector("[data-nx-favs]");if(old){old.outerHTML=favsHTML()}drawFavPop()}

/* collapsed rail: a group icon opens a flyout with its screens */
function openFly(g,btn){let f=q1("#nxFly");if(!f){f=document.createElement("div");f.id="nxFly";f.setAttribute("popover","auto");f.className="nx-fly glass";document.body.appendChild(f)}
 const sp=SPID[g]!=null?g:OLDGRP[g];if(!sp)return;const P=NAVX.purview();const sd=SPACES[SPID[sp]];const e=spaceIds(sp,P);const one=sd[5].length===1;
 const row=(id,o)=>{o=o||{};const m=resolve(id),hint=o.pin?"":hintOf(id),s=screenRow(id),lab=o.label||m.l;return `<div class="nx-fi${S.screen===id?" is-cur":""}${o.pin?" nx-pin":""}"><button type="button" class="nx-fib" data-nav="${id}" title="${E(tip(id))}">${IC(s[2])}<span class="nx-t"><span class="nx-l">${E(lab)}</span>${hint?`<small class="nx-h">${E(hint)}</small>`:""}</span></button>${starBtn("screen:"+id,"nx-rowstar",lab)}</div>`};
 f.innerHTML=`<div class="nx-flyh"><div><b>${E(sd[1])}</b><small>${E(sd[4])}</small></div><button type="button" class="btn quiet nx-flyx" popovertarget="nxFly" popovertargetaction="hide" aria-label="Close ${E(sd[1])}">${SVG(ICO.x,14,2)}</button></div>`+pinsIn(sp,P).map(id=>row(id,{pin:true,label:pinLabel(id)})).join("")+Object.keys(e).map(k=>(one?"":`<span class="navsub">${E(k)}</span>`)+e[k].map(id=>row(id)).join("")).join("");
 try{f.showPopover()}catch(e){}
 const r=btn.getBoundingClientRect();const h=Math.min(f.offsetHeight,innerHeight-24);f.style.left=Math.round(r.right+10)+"px";f.style.top=Math.round(Math.max(12,Math.min(r.top-8,innerHeight-h-12)))+"px"}

/* ---------- history and favorites popovers ---------- */
const HF={q:"",f:"all"};
function ago(t){const d=now()-t;if(d<60000)return"just now";if(d<3600000)return Math.round(d/60000)+" min ago";if(d<86400000)return Math.round(d/3600000)+" h ago";const dt=new Date(t);return dt.toLocaleDateString("en-US",{month:"short",day:"numeric"})}
function dur(ms){if(!ms||ms<8000)return"";const m=Math.round(ms/60000);if(m<1)return"under a minute";if(m<60)return m+" min";return Math.floor(m/60)+" h "+(m%60?m%60+" min":"")}
function dayOf(t){const d=new Date(),s0=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();if(t>=s0)return"Today";if(t>=s0-86400000)return"Yesterday";return"Earlier"}
function histRows(){const s=st(),q=HF.q.trim().toLowerCase();let L=s.hist.filter(h=>(HF.f==="all"||(HF.f==="mod"?h.kind==="screen":h.kind!=="screen"))&&(!q||(h.title+" "+h.type+" "+(h.sub||"")).toLowerCase().indexOf(q)>=0));
 if(!L.length)return `<p class="nx-empty">${q?"Nothing in your history matches that.":"Nothing here yet. Screens and records you open are remembered."}</p>`;
 let last="",out="";L.forEach(h=>{const d=dayOf(h.t);if(d!==last){last=d;out+=`<div class="nx-hday eyebrow" role="presentation">${d}</div>`}
  const sc=h.kind==="screen"&&screenRow(h.key);const name=sc?labelOf(h.key):h.title;const du=dur(h.dur);
  out+=`<div class="nx-hrow" role="listitem"><button type="button" class="nx-hopen" data-nx-hopen="${E(h.id)}" title="${E(h.title)}"><span class="nx-hi">${sc?IC(sc[2]):IC(typeIcon(h.type))}</span><span class="nx-ht"><b>${E(name)}</b><small>${E(h.kind==="screen"?"Module":h.type)}${h.sub&&h.kind!=="screen"?" · "+E(h.sub):""} · ${ago(h.t)}${du?" · "+du:""}${h.n>1?" · "+h.n+" visits":""}</small></span></button>${starBtn("hist:"+h.id,"nx-rowstar",name)}</div>`});
 return out}
function drawHist(){const p=q1("#nxHistPop");if(!p)return;const l=q1("#nxHistList",p);if(l)l.innerHTML=histRows();const b=q1("[data-nx-back]",p);if(b)b.disabled=STK.length<2;qa("[data-nx-hf]",p).forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.nxHf===HF.f)))}
function drawFavPop(){const p=q1("#nxFavPop");if(!p)return;const l=q1("#nxFavList",p);if(!l)return;const s=st();
 l.innerHTML=s.fav.length?s.fav.map(f=>{const scr=f.kind==="screen"&&screenRow(f.key);const name=f.label||(scr?labelOf(f.key):f.title);return `<div class="nx-hrow" role="listitem"><button type="button" class="nx-hopen" data-nx-open="${E(f.id)}"><span class="nx-hi">${scr?IC(scr[2]):IC(typeIcon(f.type))}</span><span class="nx-ht"><b>${E(name)}</b><small>${scr?E(gLabel(resolve(f.key).g)):E(f.type+(f.sub?" · "+f.sub:""))}</small></span></button><button type="button" class="nx-star nx-rowstar" data-nx-star="fav:${E(f.id)}" aria-pressed="true" aria-label="Remove ${E(name)} from favorites" title="Remove from favorites">${SVG(ICO.star,16,1.8)}</button></div>`}).join(""):`<p class="nx-empty">Nothing starred yet. Use the star on any screen header, menu item or record.</p>`;
 const here=q1("[data-nx-pinhere]",p);if(here){const on=isFavRef("screen:"+S.screen);here.textContent=on?"Remove this page":"Star this page";here.setAttribute("aria-pressed",String(on))}}
function popPlace(p,btn){if(phoneMQ.matches){p.style.left=p.style.top=p.style.right="";return}const r=btn?btn.getBoundingClientRect():{right:innerWidth-24,bottom:60};const w=Math.min(p.offsetWidth||400,innerWidth-24);let left=Math.min(Math.max(12,r.right-w),innerWidth-w-12);p.style.left=left+"px";p.style.top=Math.round(r.bottom+10)+"px";p.style.right="auto"}
let lastInvoker=null;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[popovertarget=nxFavPop],[popovertarget=nxHistPop]");if(b)lastInvoker=b},true);
document.addEventListener("toggle",e=>{const p=e.target;if(e.newState!=="open")return;if(p.id==="nxHistPop"){drawHist();popPlace(p,lastInvoker);const i=q1("#nxHistQ",p);if(i&&!phoneMQ.matches)setTimeout(()=>i.focus(),30)}else if(p.id==="nxFavPop"){drawFavPop();popPlace(p,lastInvoker)}},true);
function closePops(){qa("#nxFavPop,#nxHistPop,#nxFly").forEach(p=>{try{if(p.matches(":popover-open"))p.hidePopover()}catch(e){}})}

/* ---------- chrome: popovers, phone tab bar, palette root ---------- */
function ensureChrome(){
 if(!q1("#nxFavPop")){
  const f=document.createElement("div");f.id="nxFavPop";f.setAttribute("popover","auto");f.className="nx-pop glass";f.setAttribute("aria-label","Favorites");
  f.innerHTML=`<div class="nx-ph"><div><div class="eyebrow">Favorites</div><h3>Starred for quick return</h3></div><button class="btn quiet" type="button" popovertarget="nxFavPop" popovertargetaction="hide">Close</button></div><div id="nxFavList" class="nx-plist" role="list"></div><div class="nx-pf"><button class="btn" type="button" data-nx-pinhere aria-pressed="false">Star this page</button><button class="btn quiet" type="button" popovertarget="nxHistPop">Open history</button></div>`;
  document.body.appendChild(f);
  const h=document.createElement("div");h.id="nxHistPop";h.setAttribute("popover","auto");h.className="nx-pop glass";h.setAttribute("aria-label","History");
  h.innerHTML=`<div class="nx-ph"><div><div class="eyebrow">History</div><h3>Where you have been</h3></div><button class="btn quiet" type="button" popovertarget="nxHistPop" popovertargetaction="hide">Close</button></div>
  <div class="nx-hctl"><button class="btn primary nx-back" type="button" data-nx-back title="Return to the screen or record you were on before this one">${SVG(ICO.back,16,2)}<span>Back to where I was</span></button><button class="btn quiet" type="button" data-nx-clear>Clear</button></div>
  <div class="nx-hsearch"><input id="nxHistQ" type="search" placeholder="Search your history" autocomplete="off" aria-label="Search your history"></div>
  <div class="nx-hf" role="group" aria-label="Filter history"><button type="button" class="chip" data-nx-hf="all" aria-pressed="true">All</button><button type="button" class="chip" data-nx-hf="mod" aria-pressed="false">Modules</button><button type="button" class="chip" data-nx-hf="rec" aria-pressed="false">Records</button></div>
  <div id="nxHistList" class="nx-plist" role="list"></div>`;
  document.body.appendChild(h)}
 if(!q1("#nxTab")){
  const t=document.createElement("nav");t.id="nxTab";t.className="nx-tab glass";t.setAttribute("aria-label","Quick navigation");
  t.innerHTML=`<button type="button" data-nav="home">${SVG(ICO.home,22,1.8)}<span>Home</span></button><button type="button" data-nx-search>${SVG(ICO.search,22,1.8)}<span>Search</span></button><button type="button" popovertarget="nxFavPop">${SVG(ICO.star,22,1.8)}<span>Saved</span><em class="nx-favcount">0</em></button><button type="button" popovertarget="nxHistPop">${SVG(ICO.clock,22,1.8)}<span>Recent</span></button><button type="button" data-nx-menu aria-expanded="false" aria-controls="nav">${SVG(ICO.menu,22,1.8)}<span>Menu</span></button>`;
  document.body.appendChild(t);const sc=document.createElement("div");sc.id="nxScrim";sc.setAttribute("data-nx-menu-close","");document.body.appendChild(sc)}
 if(!q1("#nxPal"))buildPalette();
 syncStars()}
function menu(on){const r=document.documentElement;const v=on==null?!r.classList.contains("nx-menu-open"):on;r.classList.toggle("nx-menu-open",v);const b=q1("[data-nx-menu]");if(b)b.setAttribute("aria-expanded",String(v));if(v){const c=q1("#nav [aria-current=page]");setTimeout(()=>{try{navReveal()}catch(e){}},60)}}
function markTab(){qa("#nxTab [data-nav]").forEach(b=>{if(b.dataset.nav===S.screen)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
/* entering phone width: the rail becomes a drawer, so it must not stay in icon-only mode */
let wasCollapsed=null;
phoneMQ.addEventListener("change",()=>{const rc=q1("#railCollapse");if(!rc)return;if(phoneMQ.matches){wasCollapsed=rc.checked;if(rc.checked){rc.checked=false;rc.dispatchEvent(new Event("change"))}}else{menu(false);if(wasCollapsed){rc.checked=true;rc.dispatchEvent(new Event("change"))}wasCollapsed=null}try{renderNav()}catch(e){}});
ROUTER.on("change",e=>{if(e.target&&e.target.id==="railCollapse")closePops()});

/* ---------- events ---------- */
function focusLab(row){const f=st().fav.find(x=>x.id===row.dataset.nxFav);if(!f)return;const btn=q1(".navi",row);const inp=document.createElement("input");inp.type="text";inp.className="nx-ren";inp.value=f.label||labelOf2(f);inp.maxLength=60;inp.setAttribute("aria-label","Rename favorite");
 row.classList.add("is-ren");btn.style.display="none";row.insertBefore(inp,btn);inp.focus();inp.select();let done=false;const fin=ok=>{if(done)return;done=true;if(ok)renameFav(f.id,inp.value);else refreshFavs()};
 inp.addEventListener("keydown",ev=>{ev.stopPropagation();if(ev.key==="Enter"){ev.preventDefault();fin(true)}else if(ev.key==="Escape"){ev.preventDefault();fin(false)}});inp.addEventListener("blur",()=>fin(true));inp.addEventListener("click",ev=>ev.stopPropagation())}
const labelOf2=f=>f.kind==="screen"&&screenRow(f.key)?labelOf(f.key):f.title;
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
 if((b=t.closest("[data-nx-star]"))){e.preventDefault();e.stopPropagation();const ref=b.dataset.nxStar,i=ref.indexOf(":"),k=i<0?ref:ref.slice(0,i),v=ref.slice(i+1);
  if(k==="screen")toggleFav(mkScreen(v));else if(k==="drawer"){if(DR.cur)toggleFav(DR.cur)}else if(k==="hist"){const h=st().hist.find(x=>x.id===v);if(h)toggleFav(h)}else if(k==="fav")removeFav(v);
  syncStars();drawFavPop();drawHist();return}
 if((b=t.closest("[data-nx-open]"))){e.preventDefault();const f=st().fav.find(x=>x.id===b.dataset.nxOpen);closePops();menu(false);openEntry(f,"fav");return}
 if((b=t.closest("[data-nx-hopen]"))){e.preventDefault();const h=st().hist.find(x=>x.id===b.dataset.nxHopen);closePops();menu(false);openEntry(h,"hist");return}
 if((b=t.closest("[data-nx-ren]"))){e.preventDefault();e.stopPropagation();focusLab(b.closest("[data-nx-fav]"));return}
 if((b=t.closest("[data-nx-grp]"))){e.preventDefault();openFly(b.dataset.nxGrp,b);return}
 if(t.closest("[data-nx-search]")){e.preventDefault();menu(false);openPalette({});return}
 if(t.closest("[data-nx-menu]")){e.preventDefault();menu();return}
 if(t.closest("[data-nx-menu-close]")){menu(false);return}
 if(t.closest("[data-nx-back]")){e.preventDefault();goBack();return}
 if(t.closest("[data-nx-clear]")){e.preventDefault();if(confirm("Clear your history on this device?"))clearHist();return}
 if((b=t.closest("[data-nx-hf]"))){HF.f=b.dataset.nxHf;drawHist();return}
 if(t.closest("[data-nx-pinhere]")){toggleFav(mkScreen(S.screen));syncStars();drawFavPop();return}
 if(t.closest("[data-nx-find-go]")){const i=q1("#nxFind");openPalette({q:i?i.value:"",describe:true});if(i)i.value="";return}
 if((b=t.closest("#nav [data-nav],.nx-fi [data-nav]"))){if(!b.closest(".nx-fav")){const home=b.dataset.nav==="home";noteOpen("nav",home?1:2);SRC="nav"}menu(false);const fl=b.closest("#nxFly");if(fl){try{fl.hidePopover()}catch(x){}}}
},true);
document.addEventListener("input",e=>{const t=e.target;if(!t)return;if(t.id==="nxHistQ"){HF.q=t.value;drawHist()}
 if(t.id==="q"){e.stopImmediatePropagation();const v=t.value;t.value="";openPalette({q:v})}},true);
ROUTER.on("focusin",e=>{const t=e.target;if(t&&t.id==="q"){const v=t.value;t.value="";openPalette({q:v});try{t.blur()}catch(x){}}});
document.addEventListener("keydown",e=>{const t=e.target;
 if(t&&t.id==="nxFind"&&e.key==="Enter"){e.preventDefault();openPalette({q:t.value,describe:true});t.value="";return}
 if(e.key==="Escape"&&document.documentElement.classList.contains("nx-menu-open")){menu(false)}
 if(e.key==="Enter"&&t&&t.id==="q"){e.stopImmediatePropagation()}
},true);
/* drag to reorder favorites uses the shared kit DND */
if(typeof DND!=="undefined"&&DND.on)DND.on("nxfav",(id,from,to,idx)=>{moveFav(id,idx);audit("Reordered favorites",id)});

/* =====================================================================================
   GLOBAL SEARCH: one lazily built index over screens, records, people, processes, data,
   metrics, knowledge and actions. Ranks prefix, then word, then fuzzy; favors favorites
   and recently visited; stays fast with 100k+ records by capping and time-slicing.
   ===================================================================================== */
const SCOPES=[["all","All"],["screen","Screens"],["record","Records"],["person","People"],["process","Processes"],["data","Data"],["metric","Metrics"],["knowledge","Knowledge"],["action","Actions"]];
const TYL={screen:"Screens and modules",record:"Records",person:"People",process:"Processes",data:"Data entities and fields",metric:"Metrics",knowledge:"Knowledge articles",action:"Actions you can take"};
const TYORD=["action","screen","record","person","process","data","metric","knowledge"];
const TYW={action:6,screen:10,person:3,process:4,data:1,metric:2,knowledge:2,record:0};
const TYCOL={screen:"--accent",record:"--e4",person:"--p4",process:"--s3",data:"--u3",metric:"--metric-f",knowledge:"--story-f",action:"--good-f"};
const TYICO={screen:ICO.plat,record:ICO.doc,person:ICO.user,process:ICO.flow,data:ICO.table,metric:ICO.chart,knowledge:ICO.doc,action:ICO.bolt};
const SCOPE_ALIAS={screen:"screen",screens:"screen",module:"screen",modules:"screen",menu:"screen",record:"record",records:"record",ticket:"record",tickets:"record",person:"person",people:"person",user:"person",users:"person",team:"person",process:"process",processes:"process",flow:"process",flows:"process",data:"data",field:"data",fields:"data",entity:"data",entities:"data",table:"data",tables:"data",metric:"metric",metrics:"metric",kpi:"metric",knowledge:"knowledge",kb:"knowledge",article:"knowledge",articles:"knowledge",action:"action",actions:"action",do:"action",all:"all"};
const SYN={inc:["incident"],incident:["inc"],chg:["change"],change:["chg"],prb:["problem"],problem:["prb"],kb:["knowledge","article"],ci:["configuration item"],cis:["configuration item"],cmdb:["configuration"],sla:["service level"],ola:["operational level"],po:["purchase order"],pr:["project"],ritm:["request"],req:["request"],reqs:["request"],doa:["delegation"],raid:["risk"],tbm:["cost transparency"],mtg:["meeting"],ppl:["people"],hr:["people"],ap:["invoice"],bill:["invoice"],bills:["invoice"],pay:["invoice","payment"],oncall:["on call"],pto:["calendar"],wbs:["work breakdown"],okr:["objective"],okrs:["objective"],dmn:["decision"],bpmn:["process"],finops:["cloud cost"],it:["technology"],owner:["owner"],laptop:["order","request"],access:["security","request"],broken:["incident"],outage:["incident"],down:["incident"],slow:["incident"],buy:["order","purchase"],boss:["manager"],approvals:["approval","approve"],approval:["approvals","approve"],approve:["approval"],ticket:["incident","request"],tickets:["incident","request"],vendor:["vendors","supplier"],contract:["contracts"],budget:["budgets"],hire:["onboarding"],joiner:["onboarding"],leaver:["offboarding"]};
const STOP=new Set(["the","a","an","to","of","for","my","i","me","how","do","can","in","on","and","or","with","want","need","would","like","please","show","open","go","find","get","is","are","where","what","which","that","this","about","it","some","new"]);
const HEAVY=/computeAll\(|LIN\.(trace|ids)\(|SCALE\.(cis|tickets|incidents|changes)\(/;
const IDX={items:[],built:false,building:false,dirty:false,sig:"",vocab:new Set(),keys:new Set(),timings:[],done:0,total:0,gen:0,lastMs:0,partial:false,skipped:[]};
NAVX.index=IDX;
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function acro(t){const w=String(t).replace(/\([^)]*\)/g,"").split(/[^A-Za-z0-9]+/).filter(x=>x&&!/^(and|of|the|a|to|for|in|on)$/i.test(x));return w.length>=2?w.map(x=>x[0]).join("").toLowerCase():""}
function mkItem(ty,t,m,c,f,k,key,x){t=String(t==null?"":t).replace(/\s+/g," ").trim();if(!t)return null;const it={ty,t,m:String(m==null?"":m),c:c||TYCOL[ty]||"--accent",f,k:String(k||""),key:key||""};
 it.tl=t.toLowerCase();it.h=(it.tl+" "+it.m.toLowerCase()+" "+it.k.toLowerCase()).slice(0,520);if(ty==="screen"||ty==="process"||ty==="data"||ty==="metric"||ty==="knowledge"||ty==="action"){const a=acro(t);it.ac=a+(x&&x.ac?" "+x.ac:"")}if(x)Object.assign(it,x);return it}
function pushTo(B,it){if(!it||B.n>=B.cap)return;const dk=it.ty+"|"+(/^([A-Z]{1,6}-?\d{2,})\b/.test(it.t)?RegExp.$1.toLowerCase():norm(it.t));if(B.keys.has(dk))return;B.keys.add(dk);B.items.push(it);
 if(B.items.length<=90000){it.tl.split(/[^a-z0-9]+/).forEach(w=>{if(w.length>=3&&B.vocab.size<60000)B.vocab.add(w)})}}
const GMAP=[[/^(go to|screens?|modules?)$/i,"screen"],[/^(people|contractors|providers|ai agents)$/i,"person"],[/process|workflows?$|journeys|^flows?$/i,"process"],[/^(data model|data diagram|proposed entities|data connections|registry|metric calculations|chart data sources|integration fabric|data model coverage|data model gaps)|^data /i,"data"],[/^metrics$/i,"metric"],[/^(knowledge|knowledge articles|knowledge items|prompts|terms playbook|agent skills|ai test suites)$/i,"knowledge"],[/^(chat tools|agent tools|mcp tools|actions)$/i,"action"]];
const tyOfGroup=g=>{for(const r of GMAP){if(r[0].test(g))return r[1]}return"record"};
const goTbl=(screen,id)=>()=>{go(screen);let n=0;const iv=setInterval(()=>{const i=q1("#view [data-bt-q]");if(i){clearInterval(iv);i.value=id;i.dispatchEvent(new Event("input",{bubbles:true}))}else if(++n>12)clearInterval(iv)},150)};
function sources(){const L=[];
 L.push(["Screens",()=>{const o=[];const MA={};G(()=>MODMAP.modules).forEach(md=>{if(md&&md.scr)MA[md.scr]=((MA[md.scr]||"")+" "+(md.al||[]).join(" ")+" "+(md.name||"")).trim()});/* PH-14: an entry also answers to its old names, its aliases and the names of the views folded into it */
  const AL={};G(()=>Object.keys(ALIAS).forEach(a=>{const v=ALIAS[a];(AL[v]=AL[v]||[]).push(a)}));
  const FV={};G(()=>(W.R15&&R15.families||[]).forEach(fm=>fm.views.forEach(v=>{if(v[0]!==fm.id)(FV[fm.id]=FV[fm.id]||[]).push(v[1],formal(v[0]))})));
  SCREENS.forEach(s=>{const id=s[0],m=resolve(id),f=formal(id);const ex=[m.kw,f,hintOf(id),OLDGN[oldGroup(id)]||"",m.sub,gLabel(m.g),(AL[id]||[]).join(" "),(FV[id]||[]).join(" "),(MAP[id]&&MAP[id].l0)||""].join(" ");
  o.push(mkItem("screen",m.l,gLabel(m.g)+(hintOf(id)?" · "+hintOf(id):""),"--accent",()=>go(id),ex+" "+(MA[id]||""),"screen:"+id,{sid:id,ac:acro(f)}))});
  G(()=>MODMAP.modules).forEach(md=>{if(!md||!md.id||(md.scr&&screenRow(md.scr)))return;o.push(mkItem("screen",md.name||md.sn,"Module · process flow","--p4",()=>MODMAP.select(md.id),(md.al||[]).join(" ")+" "+md.id,"module:"+md.id,{ac:acro(md.sn||md.name)}))});return o}]);
 L.push(["Actions",()=>actionItems()]);
 L.push(["People",()=>(G(()=>DIR)||[]).map(d=>mkItem("person",d.name,d.role+" · "+d.team,d.c||"--p4",()=>person360(d.name),(d.skills||[]).join(" ")+" "+(d.email||"")+" "+d.kind+" "+(d.loc||""),"person:"+d.name))]);
 L.push(["Records",()=>{const o=[];G(()=>NODES).forEach(n=>o.push(mkItem("record",n.n,TYPES[n.t][0]+" · "+n.id,TYPES[n.t][1],()=>recDrawer(n.id),n.story,"record:"+n.id)));
  G(()=>KGN).forEach(n=>o.push(mkItem("knowledge",n.n,KT[n.t][0],KT[n.t][1],()=>go("kg",n.id),n.sub,"kg:"+n.id)));
  G(()=>MEETINGS).forEach(m=>o.push(mkItem("record",m.t,"Meeting · Oct "+m.d,"--e4",()=>go("fo",m.id),"","meeting:"+m.id)));
  G(()=>INVOICES).forEach(i=>o.push(mkItem("record",i.id+" · "+i.vendor,"Invoice · "+money(i.amt),"--e4",()=>go("inv",i.id),"","invoice:"+i.id)));
  G(()=>DEMAND).forEach(d=>o.push(mkItem("record",d.n,"Demand · "+K$(d.cost),"--u3",()=>{go("port");demandDrawer(d.id)},d.why,"demand:"+d.id)));return o}]);
 L.push(["Metrics",()=>Object.keys(METRICS).map(id=>{const m=METRICS[id];return mkItem("metric",m.n,mfmt(m)+" · "+m.owner,"--metric-f",()=>go("metrics",id),m.f+" "+id,"metric:"+id)})]);
 L.push(["Processes",()=>(G(()=>PROCLIB.list())||[]).map(p=>mkItem("process",p.name,"Process · "+(p.familyName||"")+" · level "+p.level,"--s3",()=>PROCLIB.open(p.id),p.owner+" "+p.module+" "+p.id,"process:"+p.id))]);
 L.push(["Data entities",()=>(G(()=>PLAT.entities())||[]).map(e=>mkItem("data",e.label,"Data entity · "+(e.domain||"")+" · "+(e.nf||(e.fields||[]).length)+" fields","--u3",()=>ATLAS.focus(e.id),e.id+" "+(e.owner||"")+" "+(e.note||""),"entity:"+e.id))]);
 /* PH-12: tabs by name (mod_s_search) */
 (G(()=>W.SRCH&&SRCH.sources?SRCH.sources():[])||[]).forEach(s=>L.push(s));
 const sx=typeof SEARCHX!=="undefined"?SEARCHX:[];sx.forEach((fn,i)=>L.push(["Provider "+(i+1),()=>{const r=fn()||[];const o=[];for(let j=0;j<r.length&&j<6000;j++){const x=r[j];if(!x||!x.t)continue;const ty=tyOfGroup(String(x.g||""));if(ty==="screen")continue;o.push(mkItem(ty,x.t,(x.g?x.g+" · ":"")+(x.m||""),x.c,x.f,x.k,"",x.tn!==undefined?{g:x.g,tn:x.tn}:{g:x.g}))}return o},HEAVY.test(String(fn))?"heavy":"prov"]));
 L.push(["Data fields",()=>{const o=[];(G(()=>PLAT.entities())||[]).forEach(e=>(e.fields||[]).forEach(f=>{if(o.length<9000)o.push(mkItem("data",f.label||f.k,"Field · "+e.label,"--u3",()=>ATLAS.focus(e.id),f.k+" "+(f.type||"")+" "+e.id,"field:"+e.id+"."+f.k))}));return o}]);
 if(W.SCALE&&SCALE.on){
  L.push(["Enterprise incidents",()=>(G(()=>ITSMX.incidents)||[]).slice(0,1500).map(i=>mkItem("record",i.id+" "+(i.t||i.title||""),"Incident · "+(i.st||i.state||""),"--bad-f",goTbl("itsm_inc",i.id),i.svc||i.service||"","inc:"+i.id))]);
  L.push(["Enterprise changes",()=>(G(()=>ITSMX.changes)||[]).slice(0,1200).map(i=>mkItem("record",i.id+" "+(i.t||i.title||""),"Change · "+(i.st||i.state||""),"--warn-f",goTbl("itsm_chg",i.id),i.svc||i.service||"","chg:"+i.id))]);
  L.push(["Enterprise problems",()=>(G(()=>ITSMX.problems)||[]).slice(0,800).map(i=>mkItem("record",i.id+" "+(i.t||i.title||""),"Problem","--warn-f",goTbl("itsm_prb",i.id),i.svc||i.service||"","prb:"+i.id))]);
  L.push(["Enterprise projects",()=>(G(()=>SCALE.projects())||[]).slice(0,300).map(p=>mkItem("record",p.n||p.name||p.id,"Project · "+(p.phase||""),"--p4",goTbl("ppm_proj",p.id),p.owner||"","proj:"+p.id))]);
  L.push(["Enterprise RAID",()=>(G(()=>SCALE.raid())||[]).slice(0,1500).map(r=>mkItem("record",r.id+" "+r.t,"RAID · "+r.kind+" · "+r.project,"--warn-f",goTbl("ppm_raid",r.id),r.owner||"","raid:"+r.id))])}
 return L}
function sigNow(){return [W.SCALE&&SCALE.on?1:0,SCREENS.length,G(()=>DIR.length),G(()=>SEARCHX.length),G(()=>PROCLIB.list().length),G(()=>Object.keys(DATAMODEL.tables).length),G(()=>Object.keys(METRICS).length),Object.keys(MAP).length,Object.keys(OVR).length,G(()=>W.SRCH?SRCH.builder():0)].join("|")}
let buildTimer=0;
function ensureIndex(force){const sg=sigNow();if(IDX.building)return;if(IDX.built&&!force&&!IDX.dirty&&IDX.sig===sg)return;
 IDX.building=true;IDX.heavyWait=0;IDX.dirty=false;IDX.sig=sg;const B={items:[],keys:new Set(),vocab:new Set(),n:0,cap:120000};const first=!IDX.built;const t0=performance.now();
 let L=sources();try{if(NAVX.ext&&NAVX.ext.sources)L=L.concat(NAVX.ext.sources())}catch(e){}L=L.filter(s=>s[2]!=="heavy").concat(L.filter(s=>s[2]==="heavy"));IDX.total=L.length;IDX.done=0;IDX.timings=[];IDX.skipped=[];if(first){IDX.items=B.items;IDX.vocab=B.vocab;IDX.keys=B.keys}
 let i=0;const step=()=>{if(i>=L.length){IDX.items=B.items;IDX.vocab=B.vocab;IDX.keys=B.keys;IDX.built=true;IDX.building=false;IDX.buildMs=Math.round(performance.now()-t0);if(PAL.open)refreshPal();return}
  const s=L[i];if(s[2]==="heavy"&&W.SCALE&&SCALE.on){if(PAL.open){buildTimer=setTimeout(step,2500);return}if(!IDX.heavyWait){IDX.heavyWait=1;buildTimer=setTimeout(step,4000);return}}
  i++;const ts=performance.now();let n=0;
  const tag=W.SRCH&&SRCH.tag?SRCH.tag:null; /* CL-75: tenant tag per item (mod_s_search) */
  try{const r=s[1]()||[];r.forEach(it=>{if(it){it.f=it.f||(()=>{});if(tag)tag(it,s[0]);pushTo(B,it);B.n=B.items.length}});n=r.length}catch(e){IDX.skipped.push(s[0])}
  const ms=Math.round(performance.now()-ts);IDX.timings.push([s[0],ms,n]);IDX.done=i;
  if(PAL.open&&(first||i%6===0))refreshPal(true);
  buildTimer=setTimeout(step,ms>120?30:0)};
 buildTimer=setTimeout(step,0)}
NAVX.ensureIndex=ensureIndex;
/* lazy refresh: rebuild after the data volume changes, but only if search has been used */
(function(){const w=()=>{if(W.SCALE&&SCALE.set&&!SCALE.set.__nx){const f=SCALE.set;SCALE.set=function(){const r=f.apply(this,arguments);if(IDX.built||IDX.building){IDX.dirty=true;if(!IDX.building)setTimeout(()=>ensureIndex(true),900)}return r};SCALE.set.__nx=1}};w();setTimeout(w,0)})();

/* ---------- ranking ---------- */
function toks(raw,describe){let t=raw.toLowerCase().split(/[^a-z0-9#._-]+/).filter(Boolean);const nonstop=t.filter(x=>!STOP.has(x));if(nonstop.length>=1&&(describe||t.length>2||nonstop.length<t.length&&nonstop.length>=1))t=nonstop;return t.slice(0,8)}
function alts(tok){const a=[tok];if(tok.length>3&&tok.slice(-1)==="s")a.push(tok.slice(0,-1));else if(tok.length>2)a.push(tok+"s");if(tok.length>4&&/ies$/.test(tok))a.push(tok.slice(0,-3)+"y");(SYN[tok]||[]).forEach(x=>a.push(x));return a}
function lev(a,b,max){const al=a.length,bl=b.length;if(Math.abs(al-bl)>max)return max+1;let p=new Array(bl+1),c=new Array(bl+1);for(let j=0;j<=bl;j++)p[j]=j;
 for(let i=1;i<=al;i++){c[0]=i;let mn=c[0];for(let j=1;j<=bl;j++){let v=a.charCodeAt(i-1)===b.charCodeAt(j-1)?p[j-1]:p[j-1]+1;if(p[j]+1<v)v=p[j]+1;if(c[j-1]+1<v)v=c[j-1]+1;if(i>1&&j>1&&a.charCodeAt(i-1)===b.charCodeAt(j-2)&&a.charCodeAt(i-2)===b.charCodeAt(j-1)&&p[j-2]+1<v)v=p[j-2]+1;c[j]=v;if(v<mn)mn=v}if(mn>max)return max+1;const t=p;p=c;c=t}return p[bl]}
function fixTok(tok){if(tok.length<4)return null;const V=IDX.vocab;if(V.has(tok))return null;let pre=false;const max=tok.length<=5?1:2;let best=null,bd=9;
 V.forEach(w=>{if(!pre&&w.indexOf(tok)===0)pre=true;if(Math.abs(w.length-tok.length)>max)return;const d=lev(tok,w,max);if(d<bd||(d===bd&&best&&w.length<best.length)){bd=d;best=w}});
 return pre?null:(bd<=max?best:null)}
function pref(){const s=st();const fav=new Set(),hs=new Map();s.fav.forEach(f=>{fav.add(f.title.toLowerCase());if(f.kind==="screen")fav.add("screen:"+f.key)});s.hist.slice(0,40).forEach((h,i)=>{hs.set(h.title.toLowerCase(),40-i);if(h.kind==="screen")hs.set("screen:"+h.key,40-i)});return {fav,hs}}
function scoreItem(it,T,A,q,P,acro_){let sc=0,all=true;const tl=it.tl,h=it.h;
 for(let i=0;i<T.length;i++){let best=0;const al=A[i];for(let j=0;j<al.length;j++){const a=al[j];const p=tl.indexOf(a);let s=0;
   if(p===0)s=34;else if(p>0&&(tl.charCodeAt(p-1)<48||(tl.charCodeAt(p-1)>57&&tl.charCodeAt(p-1)<97)))s=28;else if(p>0)s=14;else if(h.indexOf(a)>=0)s=(h.indexOf(" "+a)>=0?9:6);
   if(j>0&&s)s-=4;if(s>best)best=s}
  if(!best){if(acro_&&i===0&&T.length===1&&it.ac&&(it.ac.split(" ").indexOf(T[0])>=0||it.ac.indexOf(T[0])===0)){best=40}else{all=false;break}}
  sc+=best}
 if(!all)return 0;
 if(tl===q)sc+=110;else if(tl.indexOf(q)===0)sc+=48;else if(tl.indexOf(q)>0)sc+=16;
 if(it.key&&(it.key.slice(it.key.indexOf(":")+1).toLowerCase()===q))sc+=90;
 sc+=TYW[it.ty]||0;sc-=Math.min(14,tl.length/12);
 const bs=P.hs.get(it.key)||P.hs.get(tl);if(bs)sc+=12+bs*.45;if(P.fav.has(it.key)||P.fav.has(tl))sc+=34;
 if(it.sid&&W.SRCH&&SRCH.nameHit)sc+=SRCH.nameHit(it,q); /* PH-12: a named screen or tab ranks first */
 return sc}
function runSearch(raw,o){o=o||{};const t0=performance.now();let q=String(raw||"").trim(),scope=o.scope||"all";
 const m=q.match(/^in:\s*([a-z]+)\s*(.*)$/i)||q.match(/^(.*?)\s+in:\s*([a-z]+)$/i);
 if(m){const isFirst=/^in:/i.test(q);const key=(isFirst?m[1]:m[2]).toLowerCase(),rest=isFirst?m[2]:m[1];if(SCOPE_ALIAS[key]){scope=SCOPE_ALIAS[key];q=rest}}
 const ql=q.toLowerCase();const T=toks(q,o.describe);const out={q,scope,tokens:T,by:{},total:0,fixed:null,ms:0,counts:{}};
 if(!T.length){out.ms=0;return out}
 const P=pref();let A=T.map(alts);const items=IDX.items,N=items.length;const per={},cnt={};const SR=W.SRCH&&SRCH.allow?SRCH:null;if(SR)SR.reset();
 const pass=(A2,T2,penalty)=>{const acro_=T2.length===1&&T2[0].length>=2&&T2[0].length<=6;
  for(let i=0;i<N;i++){const it=items[i];if(scope!=="all"&&it.ty!==scope)continue;if(o.describe&&it.ty!=="screen"&&it.ty!=="action")continue;
   const s=scoreItem(it,T2,A2,ql,P,acro_);if(s>0&&SR&&!SR.allow(it))continue;if(s>0){cnt[it.ty]=(cnt[it.ty]||0)+1;let a=per[it.ty];if(!a)a=per[it.ty]=[];const sc=s-penalty;
    if(a.length<260||sc>a.min){a.push({it,sc});if(a.length>=520){a.sort((x,y)=>y.sc-x.sc);a.length=260}a.min=Math.min(a.min==null?1e9:a.min,sc)}}}};
 pass(A,T,0);
 let total=0;for(const k in cnt)total+=cnt[k];
 if(total<5){const T2=T.map(t=>{const f=fixTok(t);return f||t});const changed=T2.some((t,i)=>t!==T[i]);if(changed){const A2=T2.map(alts);const before=total;pass(A2,T2,22);out.fixed=T2.join(" ");total=0;for(const k in cnt)total+=cnt[k];if(total===before)out.fixed=null}}
 for(const k in per){per[k].sort((x,y)=>y.sc-x.sc)}
 out.by=per;out.counts=cnt;out.total=total;out.ms=Math.round((performance.now()-t0)*10)/10;IDX.lastMs=out.ms;return out}
NAVX.search=function(q,o){o=o||{};const r=runSearch(q,o);const lim=o.limit||20;const all=[];Object.keys(r.by).forEach(k=>r.by[k].forEach(x=>all.push(x)));all.sort((a,b)=>b.sc-a.sc);return {q:r.q,scope:r.scope,total:r.total,ms:r.ms,fixed:r.fixed,counts:r.counts,results:all.slice(0,lim).map(x=>({type:x.it.ty,title:x.it.t,meta:x.it.m,score:Math.round(x.sc),open:x.it.f,key:x.it.key,sid:x.it.sid||null,tab:x.it.tab||null}))}};

/* ---------- quick actions ---------- */
function runAct(sc,re){if(!screenRow(sc))return;go(sc);if(!re)return;let n=0;const iv=setInterval(()=>{const b=qa("#view button").find(x=>re.test((x.textContent||"").trim().replace(/\s+/g," ")));if(b){clearInterval(iv);b.click()}else if(++n>16)clearInterval(iv)},150)}
function actionItems(){const A=[];const add=(t,m,k,f,x)=>A.push(mkItem("action",t,m,"--good-f",f,k,"action:"+t,x));
 const has=id=>!!screenRow(id);
 if(has("itsm_inc"))add("Create an incident","Log something that is broken","new log report broken outage create incident",()=>runAct("itsm_inc",/^Log incident$/));
 if(has("itsm_chg"))add("Raise a change","Ask to change a service","new request change create raise cab",()=>runAct("itsm_chg",/^Request change$/));
 if(has("itsm_prb"))add("Open a problem record","Find the root cause of repeat incidents","new problem root cause",()=>runAct("itsm_prb",/^New problem$/));
 if(has("flw_appr"))add("Open my approvals","Everything waiting for your decision","approvals approve decisions waiting inbox",()=>go("flw_appr"));
 if(has("meet_hub"))add("Schedule a meeting","Set a time, invite people, add an agenda","schedule meeting calendar invite agenda",()=>go("meet_hub"));else if(has("ppl_av"))add("Schedule a meeting","Book a room and set a time","schedule meeting calendar invite room",()=>runAct("ppl_av",/^Book a room$/));
 if(has("ppl_av"))add("Book a room","Reserve a room or a hybrid setup","book room conference",()=>runAct("ppl_av",/^Book a room$/));
 if(has("svc_portal"))add("Report a problem","Tell the service desk what is wrong","report problem broken help",()=>go("svc_portal"));
 if(has("svc_cat"))add("Order something","Laptop, access, software, new hire","order request laptop access software catalog",()=>go("svc_cat"));
 if(has("port"))add("Submit a project request","Propose new work for the portfolio","new project request demand idea",()=>runAct("port",/^New request$/));
 if(has("bud_ven")){add("Add a vendor","Register a supplier","new vendor supplier",()=>runAct("bud_ven",/^New vendor$/));add("Add a contract","Record a vendor contract","new contract vendor",()=>runAct("bud_ven",/^New contract$/));add("Add a purchase order","Create a purchase order","new purchase order po",()=>runAct("bud_ven",/^New purchase order$/))}
 if(has("ppm_raid"))add("Add a risk or issue","Log it in the RAID log","new risk issue assumption dependency raid",()=>runAct("ppm_raid",/^Add an entry$/));
 if(has("flw_design"))add("Start a new workflow","Design an automated process","new workflow automation design",()=>runAct("flw_design",/^New workflow$/));
 if(has("inv"))add("Approve invoices","Review invoices waiting for you","invoice approve pay hold",()=>go("inv"));
 add("Star this page","Add the current screen to favorites","star favorite pin bookmark",()=>{toggleFav(DR.cur&&q1("#drawer:popover-open")?DR.cur:mkScreen(S.screen));syncStars()});
 add("Show my favorites","Open your starred items","favorites starred bookmarks",()=>{const b=q1("#nxFavBtn")||q1("[popovertarget=nxFavPop]");lastInvoker=b;try{q1("#nxFavPop").showPopover()}catch(e){}});
 add("Show my history","Screens and records you visited","history recent visited yesterday",()=>{const b=q1("#nxHistBtn")||q1("[popovertarget=nxHistPop]");lastInvoker=b;try{q1("#nxHistPop").showPopover()}catch(e){}});
 add("Back to where I was","Return to the previous screen or record","back previous return",()=>goBack());
 add("Switch light or dark theme","Change how "+BRAND.name+" looks","theme dark light mode appearance",()=>{PREF.theme=(document.documentElement.getAttribute("data-theme")==="dark")?"light":"dark";applyPrefs();savePrefs();toast("Theme: "+PREF.theme)});
 add("Turn Clarity lens on or off","Show which fields tell the story","clarity lens story metric",()=>{const l=q1("#lens");if(l){l.checked=!l.checked}});
 add("Ask "+BRAND.name,"Open the chat","chat ask assistant ai",()=>{if(W.CHATX&&CHATX.open)CHATX.open("chat");else{const c=q1("#chatOpen");if(c)c.checked=true}});
 return A}

/* ---------- palette ---------- */
const PAL={open:false,q:"",scope:"all",sel:0,rows:[],describe:false,res:null,prev:null,opened:0,activated:false,zero:false,had:false,more:{}};
function buildPalette(){const p=document.createElement("div");p.id="nxPal";p.className="nx-pal";p.hidden=true;p.setAttribute("role","dialog");p.setAttribute("aria-modal","true");p.setAttribute("aria-label","Search "+BRAND.name);
 p.innerHTML=`<div class="nx-palbox glass"><div class="nx-phead">${SVG(ICO.search,20,2)}<input id="nxPalIn" type="text" role="combobox" aria-expanded="true" aria-controls="nxPalList" aria-autocomplete="list" aria-label="Search" placeholder="Search screens, records, people, processes, data, or type in:people" autocomplete="off" spellcheck="false"><button type="button" class="nx-pesc" data-nx-pclose aria-label="Close search">Esc</button></div>
 <div class="nx-chips" role="group" aria-label="Search scope">${SCOPES.map(s=>`<button type="button" class="chip nx-chip" data-nx-scope="${s[0]}" aria-pressed="${s[0]==="all"}">${s[1]}<em></em></button>`).join("")}</div>
 <div class="nx-pnote" id="nxPalNote" hidden></div>
 <div class="nx-pbody"><ul id="nxPalList" class="nx-plist2" role="listbox" aria-label="Results"></ul><aside id="nxPrev" class="nx-prev" aria-label="Preview"></aside></div>
 <div class="nx-pfoot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>Tab</kbd> next type</span><span><kbd>Ctrl</kbd>+<kbd>↵</kbd> ask ${BRAND.name}</span><span><kbd>Esc</kbd> close</span><span class="nx-pstat" id="nxPalStat" aria-live="polite"></span></div></div>`;
 document.body.appendChild(p);
 p.addEventListener("mousedown",e=>{if(e.target===p){e.preventDefault();closePalette()}});
 p.addEventListener("click",e=>{const t=e.target;let b;
  if(t.closest("[data-nx-pclose]")){closePalette();return}
  if((b=t.closest("[data-nx-scope]"))){setScope(b.dataset.nxScope);return}
  if((b=t.closest("[data-nx-more]"))){PAL.more[b.dataset.nxMore]=(PAL.more[b.dataset.nxMore]||0)+25;refreshPal();return}
  if((b=t.closest("[data-nx-i]"))){const r=PAL.rows[+b.dataset.nxI];if(r)activate(r,e)}
  if((b=t.closest("[data-nx-pact]"))){const r=PAL.rows[PAL.sel];if(!r)return;const a=b.dataset.nxPact;if(a==="open")activate(r,e);else if(a==="star"){const en=entryOf(r);if(en){toggleFav(en);syncStars();drawPrev()}}else if(a==="ask")askFrom(PAL.q||r.t)}});
 p.addEventListener("mousemove",e=>{const li=e.target.closest&&e.target.closest("[data-nx-i]");if(li){const i=+li.dataset.nxI;if(i!==PAL.sel&&(e.movementX||e.movementY)){select(i,true)}}});
 const inp=q1("#nxPalIn",p);let dt=0;
 inp.addEventListener("input",()=>{clearTimeout(dt);dt=setTimeout(()=>{PAL.q=inp.value;PAL.sel=0;PAL.more={};refreshPal()},IDX.items.length>20000?90:45)});
 inp.addEventListener("keydown",onPalKey)}
function onPalKey(e){const k=e.key;
 if(k==="ArrowDown"){e.preventDefault();select(PAL.sel+1)}else if(k==="ArrowUp"){e.preventDefault();select(PAL.sel-1)}
 else if(k==="PageDown"){e.preventDefault();select(PAL.sel+6)}else if(k==="PageUp"){e.preventDefault();select(PAL.sel-6)}
 else if(k==="Home"&&e.ctrlKey){e.preventDefault();select(0)}else if(k==="End"&&e.ctrlKey){e.preventDefault();select(PAL.rows.length-1)}
 else if(k==="Enter"){e.preventDefault();clearTimeout(0);flushInput();if(e.ctrlKey||e.metaKey||e.shiftKey){askFrom(PAL.q)}else{const r=PAL.rows[PAL.sel];if(r)activate(r,e);else if(PAL.q)askFrom(PAL.q)}}
 else if(k==="Tab"){e.preventDefault();const i=SCOPES.findIndex(s=>s[0]===PAL.scope);setScope(SCOPES[(i+(e.shiftKey?-1:1)+SCOPES.length)%SCOPES.length][0])}
 else if(k==="Escape"){e.preventDefault();e.stopPropagation();closePalette()}
 else if(k==="Backspace"&&!e.target.value&&PAL.scope!=="all"){setScope("all")}}
function flushInput(){const i=q1("#nxPalIn");if(i&&i.value!==PAL.q){PAL.q=i.value;PAL.sel=0;refreshPal()}}
function setScope(s){PAL.scope=s;PAL.sel=0;PAL.more={};qa("#nxPal [data-nx-scope]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.nxScope===s)));refreshPal();const i=q1("#nxPalIn");if(i)i.focus()}
function openPalette(o){o=o||{};ensureChrome();const p=q1("#nxPal");if(!p)return;const i=q1("#nxPalIn");
 if(!PAL.open){PAL.prev=document.activeElement&&document.activeElement.id!=="q"&&document.activeElement!==document.body?document.activeElement:null;PAL.opened=now();PAL.activated=false;PAL.had=false;PAL.zero=false}
 PAL.open=true;p.hidden=false;document.documentElement.classList.add("nx-pal-open");
 PAL.describe=!!o.describe;PAL.scope=o.scope||(o.describe?"screen":"all");PAL.q=o.q||"";PAL.sel=0;PAL.more={};i.value=PAL.q;
 qa("#nxPal [data-nx-scope]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.nxScope===PAL.scope)));
 ensureIndex();refreshPal();setTimeout(()=>{i.focus();i.setSelectionRange(i.value.length,i.value.length)},10)}
function closePalette(){if(!PAL.open)return;
 if(PAL.q.trim().length>=2&&!PAL.activated){const t=tel();t.searches++;if(PAL.zero)t.zero++;pushMetrics();trackQuery(PAL.q,false)}
 PAL.open=false;const p=q1("#nxPal");if(p)p.hidden=true;document.documentElement.classList.remove("nx-pal-open");
 if(PAL.prev&&document.contains(PAL.prev)){try{PAL.prev.focus()}catch(e){}}}
function trackQuery(q,ok){const s=st();q=q.trim();if(q.length<2)return;if(!s.zq)s.zq=[];if(!ok){if(PAL.zero){s.zq=[q].concat(s.zq.filter(x=>x!==q)).slice(0,20)}}persistSoon()}
function togglePalette(){PAL.open?closePalette():openPalette({})}
NAVX.palette={open:openPalette,close:closePalette,toggle:togglePalette,state:()=>PAL};
function entryOf(r){if(!r)return null;if(r.entry)return r.entry;if(r.ty==="screen"&&r.sid)return mkScreen(r.sid);
 if(r.ty==="action"||r.ty==="ask")return null;
 const key=r.key||("q:"+hash(r.t));const kind=/^(record|person|meeting|process|entity|module|metric):/.test(key)?key.split(":")[0]:"search";
 if(kind==="search")return {id:"search:"+hash(r.t.toLowerCase()),kind:"search",type:({record:"Record",person:"Person",process:"Process",data:"Data",metric:"Metric",knowledge:"Knowledge"})[r.ty]||"Record",key:r.t.toLowerCase(),title:r.t,sub:r.m};
 const v=key.slice(key.indexOf(":")+1);const type={record:"Record",person:"Person",meeting:"Meeting",process:"Process",entity:"Data entity",module:"Module",metric:"Metric"}[kind];return {id:kind+":"+v,kind,type,key:v,title:r.t,sub:r.m}}
function askFrom(q){q=String(q||"").trim();if(!q)return;PAL.activated=true;const t=tel();t.searches++;t.ok++;pushMetrics();closePalette();SRC="ask";
 try{if(W.CHATX&&CHATX.open)CHATX.open("chat")}catch(e){}ask(q)}
function activate(r,ev){if(!r)return;if(r.ty==="ask"){askFrom(PAL.q);return}
 if(r.ty==="query"){closePalette();setTimeout(()=>{try{r.f&&r.f()}catch(e){}},20);return}
 PAL.activated=true;const q=PAL.q.trim();const t=tel();if(q.length>=1){t.searches++;t.ok++;if(q.length>=2){const s=st();s.rs=[q].concat(s.rs.filter(x=>x!==q)).slice(0,8)}}
 noteOpen(r.src||"search",r.src==="hist"||r.src==="fav"?1:2);pushMetrics();closePalette();
 setTimeout(()=>{try{r.f&&r.f()}catch(e){console.error(e)}},20)}
function select(i,noScroll){const n=PAL.rows.length;if(!n)return;PAL.sel=((i%n)+n)%n;const ul=q1("#nxPalList");qa("[data-nx-i]",ul).forEach(li=>li.setAttribute("aria-selected",String(+li.dataset.nxI===PAL.sel)));
 const cur=q1(`[data-nx-i="${PAL.sel}"]`,ul);const inp=q1("#nxPalIn");if(inp&&cur)inp.setAttribute("aria-activedescendant",cur.id);if(cur&&!noScroll)cur.scrollIntoView({block:"nearest"});drawPrev()}
const mark=(txt,toksA)=>{let s=E(txt);if(!toksA||!toksA.length)return s;const low=txt.toLowerCase();const spans=[];toksA.forEach(t=>{if(t.length<2)return;let p=low.indexOf(t);if(p>=0)spans.push([p,p+t.length])});if(!spans.length)return s;spans.sort((a,b)=>a[0]-b[0]);let out="",pos=0;spans.forEach(sp=>{if(sp[0]<pos)return;out+=E(txt.slice(pos,sp[0]))+"<mark>"+E(txt.slice(sp[0],sp[1]))+"</mark>";pos=sp[1]});return out+E(txt.slice(pos))};
function rowHTML(r,i,T){const fav=r.fav?`<span class="nx-ofav" title="Favorite" aria-label="Favorite">${SVG(ICO.star,13,1.8)}</span>`:"";
 const ic=r.ty==="screen"&&r.sid&&screenRow(r.sid)?IC(screenRow(r.sid)[2]):SVG(r.icon||TYICO[r.ty]||ICO.doc,18,1.8);
 return `<li role="option" id="nxo${i}" class="nx-opt" data-nx-i="${i}" data-ty="${r.ty}" aria-selected="${i===PAL.sel}"><span class="nx-oi" style="--c:var(${r.c||TYCOL[r.ty]||"--accent"})">${ic}</span><span class="nx-otx"><b>${mark(r.t,T)}</b><small>${E(r.m||"")}</small></span>${fav}${r.badge?`<em class="nx-obadge">${E(r.badge)}</em>`:""}</li>`}
function emptyRows(){const s=st(),rows=[];const P=pref();
 const sec=(title,list)=>{if(list.length){rows.push({sec:title});list.forEach(x=>rows.push(x))}};
 sec("Recently viewed",(window.SRCH&&SRCH.hist?SRCH.hist(s.hist):s.hist).filter(h=>h.id!=="screen:"+S.screen).slice(0,6).map(h=>({ty:h.kind==="screen"?"screen":"record",sid:h.kind==="screen"?h.key:null,t:h.kind==="screen"?labelOf(h.key):h.title,m:(h.kind==="screen"?"Module":h.type)+" · "+ago(h.t),entry:h,src:"hist",f:()=>openEntry(h,"hist"),icon:h.kind==="screen"?null:typeIcon(h.type),fav:s.fav.some(f=>f.id===h.id)})));
 sec("Favorites",s.fav.slice(0,6).map(h=>({ty:h.kind==="screen"?"screen":"record",sid:h.kind==="screen"?h.key:null,t:h.label||(h.kind==="screen"?labelOf(h.key):h.title),m:(h.kind==="screen"?"Module":h.type)+" · starred",entry:h,src:"fav",f:()=>openEntry(h,"fav"),icon:h.kind==="screen"?null:typeIcon(h.type),fav:true})));
 sec("Recent searches",s.rs.slice(0,5).map(x=>({ty:"query",t:x,m:"Search again",icon:ICO.search,f:()=>{openPalette({q:x})},keep:true})));
 sec("Quick actions",IDX.items.filter(i=>i.ty==="action").slice(0,6).map(a=>({ty:"action",t:a.t,m:a.m,f:a.f})));
 if(!IDX.items.length)rows.push({sec:"Quick actions"},{ty:"query",t:"Loading the search index",m:"One moment",icon:ICO.clock,f:()=>{},keep:true});
 return rows}
function refreshPal(soft){if(!PAL.open)return;const ul=q1("#nxPalList");if(!ul)return;if(NAVX.ext&&NAVX.ext.refresh){try{if(NAVX.ext.refresh(soft))return}catch(e){console.error(e)}}const raw=PAL.q;const T0=toks(raw.replace(/^in:\s*[a-z]+\s*/i,"").replace(/\s+in:\s*[a-z]+$/i,""),PAL.describe);
 let rows=[],hdrs=[],html="",res=null;const P=pref();
 if(!raw.trim()){rows=emptyRows()}else{
  res=runSearch(raw,{scope:PAL.scope,describe:PAL.describe});PAL.res=res;const T=res.tokens;
  const order=PAL.scope==="all"?TYORD:[PAL.scope];
  order.forEach(ty=>{const a=res.by[ty];if(!a||!a.length)return;const lim=PAL.scope==="all"?(ty==="screen"?6:4):60+(PAL.more[ty]||0);const total=res.counts[ty]||a.length;
   rows.push({sec:TYL[ty],ty,count:total,all:PAL.scope==="all"&&total>lim});
   a.slice(0,lim).forEach(x=>{const it=x.it;rows.push({ty:it.ty,t:it.t,m:it.m,c:it.c,f:it.f,key:it.key,sid:it.sid,src:"search",fav:P.fav.has(it.key)||P.fav.has(it.tl),sc:Math.round(x.sc),k:it.k,g:it.g})});
   if(PAL.scope!=="all"&&total>lim)rows.push({more:ty,t:"Show 25 more of "+total.toLocaleString("en-US")})})}
 /* navigable rows only */
 const nav=[];let h="";rows.forEach(r=>{if(r.sec){h+=`<li class="nx-grp eyebrow" role="presentation">${E(r.sec)}${r.count!=null?`<em>${r.count.toLocaleString("en-US")}</em>`:""}${r.all?`<button type="button" class="nx-seeall" data-nx-scope="${r.ty}">See all</button>`:""}</li>`}else if(r.more){h+=`<li class="nx-moreli" role="presentation"><button type="button" class="btn quiet" data-nx-more="${r.more}">${E(r.t)}</button></li>`}else{const i=nav.length;nav.push(r);h+=rowHTML(r,i,res?res.tokens:T0)}});
 /* fall through to Ask Oukala is always one keystroke away */
 const hasQ=raw.trim().length>0;
 if(hasQ){const i=nav.length;const askR={ty:"ask",t:"Ask "+BRAND.name+": "+raw.trim(),m:"Ctrl+Enter from anywhere in this list",icon:ICO.search,c:"--accent",f:()=>askFrom(raw)};nav.push(askR);h+=`<li class="nx-grp eyebrow" role="presentation">Not what you meant?</li><li role="option" id="nxo${i}" class="nx-opt nx-ask" data-nx-i="${i}" data-ty="ask" aria-selected="${i===PAL.sel}"><span class="nx-oi" style="--c:var(--accent)">${SVG(ICO.ai,18,1.8)}</span><span class="nx-otx"><b>Ask ${BRAND.name}: ${E(raw.trim())}</b><small>Get an answer in chat instead of a list</small></span><em class="nx-obadge">Ctrl ↵</em></li>`}
 if(hasQ&&res&&!res.total&&!(IDX.building&&!IDX.built)){PAL.zero=true;h=`<li class="nx-zero" role="presentation"><b>No match for “${E(raw.trim())}”.</b><span>Try fewer words, another spelling, or ask ${BRAND.name}. Press Enter to ask.</span></li>`+h;PAL.sel=nav.length-1}else PAL.zero=false;
 if(hasQ&&res&&res.fixed){h=`<li class="nx-fixed" role="presentation">Showing results for <b>${E(res.fixed)}</b></li>`+h}
 PAL.rows=nav;if(PAL.sel>=nav.length)PAL.sel=0;ul.innerHTML=h;
 /* chip counts */
 qa("#nxPal .nx-chip").forEach(c=>{const ty=c.dataset.nxScope;const em=c.querySelector("em");if(!em)return;em.textContent=(hasQ&&res&&ty!=="all"&&res.counts[ty]!=null&&PAL.scope==="all")?(res.counts[ty]>999?"999+":res.counts[ty]):""});
 const note=q1("#nxPalNote");if(note){if(PAL.describe){note.hidden=false;note.textContent="Describing what you want to do: showing screens and actions that fit. Not there? Ask "+BRAND.name+"."}else if(res&&res.scope!=="all"&&/^in:|\sin:/i.test(raw)){note.hidden=false;note.textContent="Searching only "+TYL[res.scope].toLowerCase()+". Press Backspace on an empty box or pick All to widen."}else note.hidden=true}
 const stat=q1("#nxPalStat");if(stat){const parts=[];if(IDX.building)parts.push("Indexing "+IDX.done+" of "+IDX.total);else if(IDX.items.length)parts.push(IDX.items.length.toLocaleString("en-US")+" items indexed");if(res)parts.push(res.total.toLocaleString("en-US")+" matches in "+res.ms+" ms");stat.textContent=parts.join(" · ")}
 if(PAL.rows.length){const sel=Math.min(PAL.sel,PAL.rows.length-1);PAL.sel=sel;const cur=q1(`[data-nx-i="${sel}"]`,ul);if(cur){cur.setAttribute("aria-selected","true");const inp=q1("#nxPalIn");if(inp)inp.setAttribute("aria-activedescendant",cur.id)}}
 drawPrev()}

/* ---------- preview pane ---------- */
function timeLabel(h){return h?"Last opened "+ago(h.t)+(h.n>1?", "+h.n+" visits":""):"Not opened before"}
function drawPrev(){const box=q1("#nxPrev");if(!box)return;const r=PAL.rows[PAL.sel];if(r&&NAVX.ext&&NAVX.ext.preview){try{if(NAVX.ext.preview(box,r))return}catch(e){console.error(e)}}if(!r){box.innerHTML=`<div class="nx-pv-empty"><b>Search everything</b><p class="muted small">Screens, records, people, processes, data, metrics, knowledge and actions you can take.</p><ul class="nx-tips"><li><kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> opens search from anywhere</li><li>Type <b>in:people</b> to search one type</li><li>Describe it: “approve an invoice”, “who is on call”</li><li>Press <kbd>Ctrl</kbd>+<kbd>↵</kbd> to ask ${BRAND.name} instead</li></ul></div>`;return}
 const s=st();const hist=s.hist.find(h=>(r.sid&&h.id==="screen:"+r.sid)||h.title===r.t);let body="";const en=entryOf(r);const isFav=en&&s.fav.some(f=>f.id===en.id);
 const head=`<div class="nx-pv-h"><span class="nx-oi big" style="--c:var(${r.c||TYCOL[r.ty]||"--accent"})">${r.ty==="screen"&&r.sid&&screenRow(r.sid)?IC(screenRow(r.sid)[2]):SVG(r.icon||TYICO[r.ty]||ICO.doc,22,1.8)}</span><div><div class="eyebrow">${E(r.ty==="ask"?"Ask "+BRAND.name:(TYL[r.ty]||"Result").replace(/s and modules$/,"").replace(/ you can take$/,""))}</div><h3>${E(r.t)}</h3></div></div>`;
 try{
  if(r.ty==="screen"&&r.sid){const m=resolve(r.sid),def=G(()=>PROC.defs[r.sid]);body=`<p class="muted">${E(hintOf(r.sid)?"Formal name: "+hintOf(r.sid):"Formal name: "+formal(r.sid))}</p><dl class="kv"><dt>Where</dt><dd>${E(gLabel(m.g))}${m.sub?" · "+E(m.sub):""}</dd><dt>History</dt><dd>${E(timeLabel(hist))}</dd></dl>${def&&def.steps?`<div class="eyebrow" style="margin:10px 0 6px">Process behind it</div><ol class="nx-steps">${def.steps.slice(0,4).map(x=>`<li>${E(x.n||x.d||"")}</li>`).join("")}</ol>`:""}`}
  else if(r.ty==="person"){const nm=r.t,d=G(()=>who(nm));if(d){const wl=G(()=>workload(nm));body=`<div class="row" style="gap:10px">${G(()=>avatar(nm,{size:44}))||""}<div><b>${E(d.role||"")}</b><div class="muted small">${E(d.team||"")} · ${E(d.kind||"")}</div></div></div><dl class="kv"><dt>Email</dt><dd>${E(d.email||"")}</dd><dt>Location</dt><dd>${E(d.loc||"")}</dd>${wl?`<dt>Workload</dt><dd>${wl.pct}% of ${wl.cap} hours</dd>`:""}<dt>Skills</dt><dd>${E((d.skills||[]).slice(0,5).join(", "))}</dd></dl>`}}
  else if(r.ty==="metric"){const id=(r.key||"").replace(/^metric:/,"");body=METRICS[id]?`<div class="nx-pv-kpi">${kpiBox(id)}</div>`:`<p class="muted">${E(r.m)}</p>`}
  else if(r.ty==="process"){const id=(r.key||"").replace(/^process:/,"");const p=G(()=>PROCLIB.get(id))||G(()=>PROCLIB.list().find(x=>x.id===id));body=p?`<dl class="kv"><dt>Owner</dt><dd>${(p.owner||"")?ownerChip(p.owner||"",{role:"Owner"}):""}</dd><dt>Family</dt><dd>${E(p.familyName||p.family||"")}</dd><dt>Steps</dt><dd>${E(Array.isArray(p.steps)?p.steps.length:p.steps)}</dd><dt>Maturity</dt><dd>Level ${E(p.level)} of target ${E(p.target)}</dd></dl>`:`<p class="muted">${E(r.m)}</p>`}
  else if(r.ty==="data"){const id=(r.key||"").replace(/^(entity|field):/,"").split(".")[0];const e=G(()=>PLAT.ent(id));body=e?`<dl class="kv"><dt>${/^field:/.test(r.key||"")?"Field of":"Domain"}</dt><dd>${E(/^field:/.test(r.key||"")?e.label:e.domain)}</dd><dt>Fields</dt><dd>${E(e.nf||(e.fields||[]).length)}</dd><dt>Owner</dt><dd>${(e.owner||"")?ownerChip(e.owner||"",{role:"Owner"}):""}</dd><dt>Classification</dt><dd>${E(e.cls||"")}</dd></dl><p class="muted small">${E((e.fields||[]).slice(0,8).map(f=>f.label||f.k).join(", "))}</p>`:`<p class="muted">${E(r.m)}</p>`}
  else if(r.ty==="action"){body=`<p>${E(r.m)}</p><p class="muted small">Opens the right screen and starts the form for you. Nothing is saved until you confirm.</p>`}
  else if(r.ty==="ask"){body=`<p>Send “${E(PAL.q)}” to ${BRAND.name} chat. It can answer from your records, explain, or take you there.</p>`}
  else if(r.ty==="query"){body=`<p class="muted">Run this search again.</p>`}
  else{body=`<p>${E(r.m||"")}</p>${r.k?`<p class="muted small">${E(String(r.k).slice(0,220))}</p>`:""}<dl class="kv"><dt>History</dt><dd>${E(timeLabel(hist))}</dd></dl>`}
 }catch(x){body=`<p class="muted">${E(r.m||"")}</p>`}
 const acts=`<div class="nx-pv-a"><button type="button" class="btn primary" data-nx-pact="open">Open <kbd>↵</kbd></button>${en?`<button type="button" class="btn" data-nx-pact="star" aria-pressed="${!!isFav}">${isFav?"Unstar":"Star"}</button>`:""}<button type="button" class="btn quiet" data-nx-pact="ask">Ask ${BRAND.name}</button></div>`;
 box.innerHTML=head+body+acts}

/* global keys: Ctrl or Cmd + K, and "/" */
document.addEventListener("keydown",e=>{const mod=e.ctrlKey||e.metaKey;
 if(mod&&!e.shiftKey&&!e.altKey&&(e.key==="k"||e.key==="K")){e.preventDefault();e.stopImmediatePropagation();togglePalette();return}
 if(e.key==="/"&&!mod&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"")&&!(e.target&&e.target.isContentEditable)){e.preventDefault();e.stopImmediatePropagation();openPalette({})}
 if(e.key==="Escape"&&PAL.open&&!(e.target&&e.target.id==="nxPalIn")){closePalette()}
},true);
/* warm the index in idle time so the first search is instant (small data only) */
setTimeout(()=>{if(!(W.SCALE&&SCALE.on)&&!IDX.built&&!IDX.building){const f=()=>ensureIndex();if(W.requestIdleCallback)requestIdleCallback(f,{timeout:4000});else setTimeout(f,2500)}},1800);

/* =====================================================================================
   Hooks into the shell, chat intents, and the Feature Contract artifacts
   ===================================================================================== */
/* CL-35: lifecycle through HOOKS instead of wrapping render and go. afterRender work waits one microtask so the screen
   is complete (wrappers outside the core render finish first); the go argument is recorded after go returns. */
const afterScreen=()=>{try{if(!wrapped)wrapGlobals();ensureChrome();onScreen();decorateHero();markTab();syncStars()}catch(e){console.error("nav hook",e)}};
if(W.HOOKS){HOOKS.on("afterRender",()=>{afterScreen();queueMicrotask(()=>{try{decorateHero()}catch(e){}})},{id:"nav.render"});
 HOOKS.on("beforeGo",(screen,arg)=>{closePops();document.documentElement.classList.remove("nx-menu-open");queueMicrotask(()=>{try{onGoArg(screen,arg)}catch(e){}})},{id:"nav.go"})}
/* the tab bar needs to know the persona changed: reload favorites and history for the new persona */
ROUTER.on("change",e=>{if(e.target&&e.target.name==="persona"){STP=null;ST=null;STK.length=0;setTimeout(()=>{st();syncStars();refreshFavs();drawFavPop();drawHist()},0)}});
window.addEventListener("hashchange",()=>{const id=NAVX.resolveAlias(location.hash);if(id&&id!==S.screen)go(id)});

/* ---------- chat intents: star this, what did I look at, find ... ---------- */
function histSummary(period){const s=st();const want=period==="yesterday"?"Yesterday":period==="today"?"Today":null;
 const L=s.hist.filter(h=>want?dayOf(h.t)===want:true).slice(0,8);return L}
if(typeof ASKX!=="undefined")ASKX.push(q=>{const l=q.trim().toLowerCase();let m;
 if(/^(star|favorite|favourite|pin|bookmark)( this| it)?( page| screen| record| one)?[.!]*$/.test(l)){const e=(DR.cur&&q1("#drawer:popover-open"))?DR.cur:mkScreen(S.screen);const was=NAVX.fav.has(e.id);if(!was)addFav(e);say(q,{t:was?e.title+" is already in your favorites.":"Starred "+e.title+". It is now pinned at the top of the menu.",steps:["Looked at what is open right now","Saved it to your favorites for "+PERSONAS[S.persona].n]});return true}
 if(/^((unstar|unfavorite|unfavourite|unpin)( this| it)?|remove (this )?(from )?(my )?favou?rites?)[.!]*$/.test(l)){const e=(DR.cur&&q1("#drawer:popover-open"))?DR.cur:mkScreen(S.screen);const was=NAVX.fav.has(e.id);if(was)removeFav(e.id);say(q,{t:was?"Removed "+e.title+" from your favorites.":e.title+" was not in your favorites.",steps:["Checked your favorites"]});return true}
 if(/(what|which).*(look|looked|view|viewed|visit|visited|open|opened|work|worked|been).*(yesterday|today|earlier|recently|last)|^(show|open|list)( me)?( my)? (history|recent|recents)|^my (history|recent)/.test(l)){const per=/yesterday/.test(l)?"yesterday":/today/.test(l)?"today":null;const L=histSummary(per);
  say(q,{t:L.length?(per?"Here is what you opened "+per+": ":"Most recent first: ")+L.map(h=>(h.kind==="screen"?labelOf(h.key):h.title)+(h.kind!=="screen"?" ("+h.type+")":"")).join("; ")+".":"I have nothing in your history "+(per?"for "+per:"yet")+".",steps:["Read your navigation history on this device","Grouped by day"],act:()=>{lastInvoker=q1("[popovertarget=nxHistPop]");try{q1("#nxHistPop").showPopover()}catch(e){}}});return true}
 if(/^(show|open|list)( me)?( my)? (favou?rites|starred( items)?|bookmarks)[.!]*$/.test(l)){const L=st().fav;say(q,{t:L.length?"Your favorites: "+L.map(f=>f.label||f.title).join("; ")+".":"You have no favorites yet. Say “star this” on any screen.",steps:["Read your favorites"],act:()=>{lastInvoker=q1("[popovertarget=nxFavPop]");try{q1("#nxFavPop").showPopover()}catch(e){}}});return true}
 if(/^(go )?back( to where i was)?[.!]*$|^take me back[.!]*$/.test(l)){goBack();say(q,{t:"Took you back to where you were.",steps:["Used your history for this session"]});return true}
 if((m=l.match(/^(?:find|search for|search|look for|locate)\s+(.{2,})$/))||(m=l.match(/^where (?:do i|can i|is|are|would i) (.{3,})$/))){const term=m[1].replace(/[?.!]+$/,"");ensureIndex();const r=NAVX.search(term,{limit:4});
  const top=r.results.slice(0,3);say(q,{t:top.length?"Top matches for “"+term+"”: "+top.map(x=>x.title+" ("+x.type+")").join("; ")+". I opened search so you can pick one.":"I found nothing for “"+term+"”. I opened search so you can try another word.",steps:["Searched screens, records, people, processes, data, metrics and knowledge","Ranked by closeness, favorites and what you opened recently"],act:()=>openPalette({q:term})});openPalette({q:term});return true}
 return false});

/* ---------- Feature Contract: metrics ---------- */
Object.assign(METRICS,{
 m_nav_depth:{n:"Clicks to reach a target",f:"Σ clicks from asking to arrive (menu 2, search 2, favorite 1, history 1) ÷ arrivals at a screen or record",u:"clicks",cur:1.9,tgt:2,badAt:3.2,dir:"min",max:6,tr:[2.8,2.7,2.5,2.3,2.2,2.1,2,1.9],owner:"Platform owner",use:["Navigation and search","Home"],rem:{kind:"sop",ref:"SOP-NAV-01",title:"Reorder the menu around what people open most",agent:"Navigation Agent",auto:false,state:"standby",prog:"Standing by. Proposes new groupings and favorites when the average passes the threshold."}},
 m_search_success:{n:"Searches that end in an opened result",f:"Searches where a result or Ask "+BRAND.name+" was chosen ÷ searches started × 100",u:"%",cur:87,tgt:90,badAt:75,dir:"max",max:100,tr:[74,77,80,82,84,85,86,87],owner:"Platform owner",use:["Navigation and search"],rem:{kind:"agent",ref:"Navigation Agent",title:"Add keywords to screens people could not find",agent:"Navigation Agent",auto:false,state:"standby",prog:"Reads zero-result searches weekly and drafts keyword and label changes for the owner to approve."}},
 m_search_zero_results:{n:"Searches with no results",f:"Searches that returned nothing ÷ searches started × 100",u:"%",cur:4.2,tgt:3,badAt:8,dir:"min",max:20,tr:[9.1,8.4,7.2,6.3,5.6,5,4.6,4.2],owner:"Platform owner",use:["Navigation and search"],rem:{kind:"sop",ref:"SOP-NAV-02",title:"Review zero-result searches and add synonyms",agent:"Navigation Agent",auto:false,state:"standby",prog:"Lists the top zero-result words for the owner every Monday."}},
 m_fav_use:{n:"People who return through favorites",f:"People who opened something from Favorites in the week ÷ weekly active people × 100",u:"%",cur:46,tgt:60,badAt:30,dir:"max",max:100,tr:[22,26,30,34,38,41,44,46],owner:"Platform owner",use:["Navigation and search","Home"],rem:{kind:"kb",ref:"KB-NAV-03",title:"Suggest favorites from what a person opens weekly",agent:"Navigation Agent",auto:false,state:"standby",prog:"Offers to star the three screens a person opens most."}},
 m_hist_return:{n:"Returns through history or Back",f:"Arrivals from History or Back to where I was ÷ all arrivals × 100",u:"%",cur:31,tgt:40,badAt:20,dir:"max",max:100,tr:[14,17,20,23,25,27,29,31],owner:"Platform owner",use:["Navigation and search"],rem:{kind:"kb",ref:"KB-NAV-04",title:"Teach the History flyout and the Back shortcut",agent:"Navigation Agent",auto:false,state:"standby",prog:"Shows a one-time hint after a person re-searches something they opened yesterday."}}});
pushMetrics();

/* ---------- process models, data model, maturity, module map: wired lazily because later modules own those engines ---------- */
const sx=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const FIND_STEPS=[sx("Ask","Open search with / or Ctrl+K, click the box, or describe the task in the menu.","human","Any user","Seconds","A word, a name or a sentence","A query"),
 sx("Match","Look across screens, records, people, processes, data, metrics, knowledge and actions at once.","auto","Search index","Under 100 ms","Query","Matches by type"),
 sx("Rank","Prefix first, then word, then spelling fixes and acronyms; favorites and recent visits rank higher.","auto","Search index","Under 100 ms","Matches by type","Ordered list"),
 sx("Preview and choose","Move with arrow keys, read the preview, open or star it.","human","Any user","Seconds","Ordered list","A chosen result"),
 sx("Open or ask","Open the result, run the action, or press Ctrl+Enter to ask "+BRAND.name+".","gate","Any user","Seconds","A chosen result","Screen, record or chat answer"),
 sx("Learn","Record the query and whether it succeeded; send zero-result words to the owner.","auto","Navigation Agent","Weekly","Search outcome","Keyword and label proposals")];
const RETURN_STEPS=[sx("Remember","Every screen and record opened is noted with the time spent (latest 200 kept, repeats collapsed).","auto","Navigation history","Instant","Screen or record opened","History entry"),
 sx("Star","A star on any menu item, screen header or record pins it to Favorites at the top of the menu.","human","Any user","One click","Screen or record","Favorite"),
 sx("Return","Open Favorites, open History, or use Back to where I was.","human","Any user","One click","Favorite or history entry","Screen or record reopened"),
 sx("Reopen safely","If a record cannot be reopened, search runs with its title instead.","auto","Record openers","Instant","Entry that cannot reopen","Search results"),
 sx("Tune","Rename or reorder favorites; the owner reviews what people reopen most.","human","Platform owner","Quarterly","Usage patterns","Menu changes")];
try{PROC.reg("nav_studio",{title:"How people find and return to things",std:["itil5","kcs"],steps:FIND_STEPS.concat(RETURN_STEPS.map(s=>Object.assign({},s)))})}catch(e){}
const NAV_ENT=[
 {id:"nav_favorite",label:"Navigation favorite",domain:"plat",source:"Navigation and search",ownerApp:"Navigation and search",ownerMod:"nav_studio",status:"live",steward:"Platform owner",
  note:"Integration decision: reuse the person record for the owner and the screen registry for screen targets; add one small personal table for the starred item itself. Records are reopened through registered openers instead of copying record data.",
  fields:[{k:"favorite_id",label:"Favorite ID",type:"string",authority:"platform",classification:"internal",req:true},{k:"person",label:"Person",type:"ref",authority:"platform",classification:"personal",req:true},{k:"persona",label:"Persona",type:"string",authority:"platform",classification:"internal"},{k:"target_kind",label:"Target kind",type:"enum",opts:["screen","record","person","process","entity","module","metric"],authority:"platform",classification:"internal"},{k:"target_key",label:"Target key",type:"string",authority:"platform",classification:"internal",req:true},{k:"custom_label",label:"Custom label",type:"string",authority:"platform",classification:"personal"},{k:"position",label:"Position in the list",type:"number",authority:"platform",classification:"internal"},{k:"starred_at",label:"Starred at",type:"datetime",authority:"platform",classification:"internal"}]},
 {id:"nav_history_event",label:"Navigation history event",domain:"plat",source:"Navigation and search",ownerApp:"Navigation and search",ownerMod:"nav_studio",status:"live",steward:"Platform owner",
  note:"Integration decision: extends the audit trail idea but is kept apart because history is personal and capped at 200 per person; audit stays the system of record for actions. Visits collapse by target and keep a count and total seconds.",
  fields:[{k:"event_id",label:"Event ID",type:"string",authority:"platform",classification:"internal",req:true},{k:"person",label:"Person",type:"ref",authority:"platform",classification:"personal",req:true},{k:"target_kind",label:"Target kind",type:"enum",opts:["screen","record","person","process","entity","module","metric"],authority:"platform",classification:"internal"},{k:"target_key",label:"Target key",type:"string",authority:"platform",classification:"internal",req:true},{k:"opened_at",label:"Opened at",type:"datetime",authority:"platform",classification:"personal"},{k:"seconds_on_target",label:"Seconds on the target",type:"number",authority:"platform",classification:"personal"},{k:"visit_count",label:"Visit count",type:"number",authority:"platform",classification:"internal"},{k:"arrived_by",label:"Arrived by",type:"enum",opts:["menu","favorite","history","search","ask"],authority:"platform",classification:"internal"},{k:"clicks_to_arrive",label:"Clicks to arrive",type:"number",authority:"platform",classification:"internal"}]},
 {id:"search_query",label:"Search query",domain:"plat",source:"Navigation and search",ownerApp:"Navigation and search",ownerMod:"nav_studio",status:"live",steward:"Platform owner",
  note:"Integration decision: new, because no existing entity holds what people typed. Query text is personal data, kept per person and aggregated for measures. Every module contributes index entries by pull, not by copying its records.",
  fields:[{k:"query_id",label:"Query ID",type:"string",authority:"platform",classification:"internal",req:true},{k:"person",label:"Person",type:"ref",authority:"platform",classification:"personal",req:true},{k:"query_text",label:"Query text",type:"string",authority:"platform",classification:"personal"},{k:"scope",label:"Scope",type:"enum",opts:["all","screen","record","person","process","data","metric","knowledge","action"],authority:"platform",classification:"internal"},{k:"result_count",label:"Result count",type:"number",authority:"platform",classification:"internal"},{k:"chosen_type",label:"Chosen result type",type:"string",authority:"platform",classification:"internal"},{k:"chosen_key",label:"Chosen result key",type:"string",authority:"platform",classification:"internal"},{k:"elapsed_ms",label:"Milliseconds to answer",type:"number",authority:"platform",classification:"internal"},{k:"zero_results",label:"No results",type:"boolean",authority:"platform",classification:"internal"},{k:"asked_oukala",label:"Fell through to Ask "+BRAND.name,type:"boolean",authority:"platform",classification:"internal"},{k:"searched_at",label:"Searched at",type:"datetime",authority:"platform",classification:"personal"}]}];
const NAV_PROCS=[
 {id:"nav.find",name:"Find something",module:"nav_studio",family:"Platform and administration",owner:"Platform owner",trigger:"A person opens search, presses / or Ctrl+K, or describes a task in the menu",steps:FIND_STEPS,inputs:["A word, a name or a sentence"],outputs:["An opened screen, record or action, or a chat answer"],entities:["search_query"],metrics:["m_search_success","m_search_zero_results","m_nav_depth"],model:"cmmi",target:3},
 {id:"nav.return",name:"Return to something",module:"nav_studio",family:"Platform and administration",owner:"Platform owner",trigger:"A person opens Favorites or History, or asks to go back",steps:RETURN_STEPS,inputs:["A starred item or a past visit"],outputs:["The same screen or record, reopened"],entities:["nav_favorite","nav_history_event"],metrics:["m_fav_use","m_hist_return","m_nav_depth"],model:"cmmi",target:3}];
const WIRE={ent:0,mod:0,flow:0,proc:0,tries:0};
function wire(){WIRE.tries++;
 try{if(!WIRE.ent&&W.ATLAS&&ATLAS.addEntity){let ok=true;NAV_ENT.forEach(d=>{try{const r=ATLAS.addEntity(d);if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});WIRE.ent=ok?1:0}}catch(e){}
 try{if(!WIRE.mod&&W.MODMAP&&MODMAP.addModule){const r=MODMAP.addModule({id:"nav_studio",name:"Navigation and search",sn:"Navigation and search",band:"plt",own:"Platform owner",r:["person","incident","change_request","project","business_service","invoice"],w:["nav_favorite","nav_history_event","search_query"],proposed:false,flows:[]});if(r&&r.ok!==false)WIRE.mod=1}}catch(e){}
 try{if(WIRE.mod&&!WIRE.flow&&W.MODMAP&&MODMAP.addFlows){const mods=(MODMAP.modules||[]).filter(m=>m&&m.id!=="nav_studio"&&m.scr);const fl=mods.map(m=>({from:m.id,to:"nav_studio",data:"Search index entries: titles, ids and keywords",entity:"search_query",mode:"api",trig:"Index refresh when the module registers or data volume changes"}));
   fl.push({from:"nav_studio",to:"exe_dash",data:"Navigation and search measures",entity:"search_query",mode:"batch",trig:"Weekly"},{from:"nav_studio",to:"plat_proc",data:"Find and return processes",entity:"search_query",mode:"event",trig:"Process edited"});
   const r=MODMAP.addFlows(fl);if(r&&r.ok!==false)WIRE.flow=1}}catch(e){}
 try{if(WIRE.mod&&WIRE.ent&&!WIRE.proc&&W.PROCLIB&&PROCLIB.addProcess){let ok=true;NAV_PROCS.forEach(p=>{try{const r=PROCLIB.addProcess(p);if(r&&r.ok===false)ok=false}catch(e){ok=false}});WIRE.proc=ok?1:0}}catch(e){}
 if(!(WIRE.ent&&WIRE.mod&&WIRE.flow&&WIRE.proc)&&WIRE.tries<14)setTimeout(wire,900)}
setTimeout(wire,700);
NAVX.wire=WIRE;

/* =====================================================================================
   Screen: Navigation and search (nav_studio), the editor path for the menu map and search health
   ===================================================================================== */
S.navs=S.navs||{g:"all",speed:""};
const SPEEDQ=["inc","incident","approve invoices","lumen","cmdb","who is on call","project plan","maturty","knowldge","sla","in:people maya","fin_"];
function studioMap(){const c=NAVX.check();const rows=SCREENS.map(s=>s[0]).filter(id=>id!=="home").map(id=>({id,m:resolve(id)})).filter(r=>S.navs.g==="all"||r.m.g===S.navs.g).sort((a,b)=>((SPID[a.m.g]==null?99:SPID[a.m.g])-(SPID[b.m.g]==null?99:SPID[b.m.g]))||(a.m.o-b.m.o));
 const opts=(sel)=>SPACES.filter(g=>g[0]!=="home").map(g=>`<option value="${g[0]}" ${g[0]===sel?"selected":""}>${E(g[1])}</option>`).join("");
 const cnt=NAVX.counts();
 return `${kpiRow([["Screens",c.screens,"registered right now"],["Menu entries",c.placed,"each in exactly one place",{cls:c.notPlaced.length||c.duplicates.length?"warn":""}],["Views and merges",c.views+c.merged,"reached from a view switcher"],["Not mapped yet",c.unmapped.length,c.unmapped.length?"search only until placed":"all mapped",{keep:true}],["Business areas",AREA_IDS.length,"plus My work, Ask or request, Showroom and Build and admin"]])}
 ${c.unmapped.length?`<div class="card glass"><div class="cardhead"><div><h3>Screens without a place yet</h3><span class="muted small">A screen with no taxonomy row is search only, never in a menu. Give each a plain label and a place below.</span></div></div><div class="row">${c.unmapped.map(id=>`<span class="pill warn">${E(formal(id))}</span>`).join("")}</div></div>`:""}
 ${c.orphans&&c.orphans.length?`<p class="muted small">${c.orphans.length} mapped screen${c.orphans.length===1?"":"s"} waiting for their module to register: ${c.orphans.map(E).join(", ")}.</p>`:""}
 <div class="card glass"><div class="cardhead"><div><h3>Menu map</h3><span class="muted small">Plain label first, formal module name second. Changes apply to the menu and to search at once and stay on this device.</span></div><label class="small">Show <select data-nx-sg aria-label="Show area"><option value="all">All areas</option>${opts(S.navs.g)}</select></label></div>
 <div class="tscroll"><table class="tbl nx-maptbl"><thead><tr><th>Menu label</th><th>Formal name</th><th>Area</th><th>Sub-heading</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><input class="fin nx-mapin" type="text" value="${E(r.m.l)}" data-nx-mvl="${r.id}" aria-label="Menu label for ${E(formal(r.id))}"></td><td class="muted">${E(formal(r.id))}<br><small>${E(r.id)}</small></td><td><select class="fin" data-nx-mvg="${r.id}" aria-label="Area for ${E(formal(r.id))}">${opts(r.m.g)}</select></td><td class="muted small">${E(r.m.sub||"")}</td><td>${r.m.unmapped?`<span class="pill warn">Unmapped</span>`:""}${r.m.edited?`<button type="button" class="btn quiet" data-nx-rst="${r.id}">Reset</button>`:""}</td></tr>`).join("")}</tbody></table></div></div>`}
function studioSearch(){const ty={};IDX.items.forEach(i=>ty[i.ty]=(ty[i.ty]||0)+1);const s=st();const slow=IDX.timings.slice().sort((a,b)=>b[1]-a[1]).slice(0,8);
 return (NAVX.ext&&NAVX.ext.studioTop?(()=>{try{return NAVX.ext.studioTop()}catch(e){return""}})():"")+`${kpiRow([["Items indexed",IDX.items.length.toLocaleString("en-US"),IDX.built?"index is ready":"building"],["Sources",IDX.total||0,IDX.skipped.length?IDX.skipped.length+" skipped":"all answered"],["Index build",(IDX.buildMs||0)+" ms","one time, in small slices",{keep:true}],["Last search",IDX.lastMs+" ms","target under 100 ms",{keep:true}]])}
 <div class="grid g2" style="align-items:start"><div class="card glass"><div class="cardhead"><div><h3>What is searchable</h3><span class="muted small">Every registered screen, module, process, data entity, field, metric and person, plus each module's own records.</span></div></div>
 <div class="tscroll"><table class="tbl"><thead><tr><th>Type</th><th>Items</th></tr></thead><tbody>${TYORD.map(t=>`<tr><td>${E(TYL[t])}</td><td class="num">${(ty[t]||0).toLocaleString("en-US")}</td></tr>`).join("")}</tbody></table></div>
 <div class="row" style="margin-top:12px"><button class="btn" type="button" data-nx-rebuild>Rebuild index</button><button class="btn primary" type="button" data-nx-speed>Run speed test</button></div><p class="muted small" id="nxSpeedOut" role="status">${E(S.navs.speed||"The speed test runs a dozen typical and misspelled searches against the live index.")}</p></div>
 <div class="card glass"><div class="cardhead"><div><h3>Slowest sources</h3><span class="muted small">Each source is read in its own small slice so the screen never freezes.</span></div></div>
 <div class="tscroll"><table class="tbl"><thead><tr><th>Source</th><th>Items</th><th>Milliseconds</th></tr></thead><tbody>${slow.map(r=>`<tr><td>${E(r[0])}</td><td class="num">${r[2].toLocaleString("en-US")}</td><td class="num">${r[1]}</td></tr>`).join("")||`<tr><td colspan="3" class="muted">Open search once to build the index.</td></tr>`}</tbody></table></div></div></div>
 <div class="grid g2" style="align-items:start"><div class="card glass"><div class="cardhead"><h3>Searches with no results</h3></div>${(s.zq&&s.zq.length)?`<div class="row">${s.zq.map(x=>`<span class="pill warn">${E(x)}</span>`).join("")}</div><p class="muted small" style="margin-top:8px">These words found nothing. The Navigation Agent proposes keywords for them.</p>`:`<p class="muted">None on this device yet.</p>`}</div>
 <div class="card glass"><div class="cardhead"><h3>Recent searches</h3></div>${s.rs.length?`<div class="row">${s.rs.map(x=>`<button class="chip" type="button" data-nx-rq="${E(x)}">${E(x)}</button>`).join("")}</div>`:`<p class="muted">None yet.</p>`}</div></div>`+builderCard()}
/* PH-12: hidden screens are searchable only in builder mode (mod_s_search) */
function builderCard(){if(!W.SRCH)return"";const on=SRCH.builder();const n=G(()=>SCREENS.filter(x=>SRCH.hiddenScreen(x[0])).length)||0;
 return `<div class="card glass"><div class="cardhead"><div><h3>Hidden screens in search</h3><span class="muted small">${n} screens are hidden from the menu because another screen replaced them. Search lists them only in builder mode (kept in this browser).</span></div><button class="btn${on?"":" primary"}" type="button" data-srch-builder="${on?0:1}" aria-pressed="${on}">${on?"Turn off builder mode":"Turn on builder mode"}</button></div></div>`}
function studioPeople(){const s=st();
 return `<div class="grid g2" style="align-items:start"><div class="card glass"><div class="cardhead"><div><h3>Favorites for ${E(PERSONAS[S.persona].n)}</h3><span class="muted small">Kept per persona on this device. Drag to reorder in the menu.</span></div></div>
 ${s.fav.length?`<div class="needs">${s.fav.map(f=>`<div class="need" style="grid-template-columns:auto minmax(0,1fr) auto"><div class="ico info">${SVG(ICO.star,16,1.8)}</div><div><b>${E(f.label||f.title)}</b><span class="muted small">${E(f.kind==="screen"?"Module · "+gLabel(resolve(f.key).g):f.type+(f.sub?" · "+f.sub:""))}</span></div><button class="btn quiet" type="button" data-nx-unfav="${E(f.id)}">Remove</button></div>`).join("")}</div>`:`<p class="muted">No favorites yet.</p>`}</div>
 <div class="card glass"><div class="cardhead"><div><h3>History</h3><span class="muted small">Latest ${s.hist.length} of 200. Repeat visits collapse into one entry.</span></div><button class="btn quiet" type="button" data-nx-clear>Clear</button></div>
 ${s.hist.length?`<div class="needs">${s.hist.slice(0,12).map(h=>`<div class="need" style="grid-template-columns:auto minmax(0,1fr) auto"><div class="ico">${SVG(ICO.clock,16,1.8)}</div><div><b>${E(h.kind==="screen"?labelOf(h.key):h.title)}</b><span class="muted small">${E(h.kind==="screen"?"Module":h.type)} · ${ago(h.t)}${dur(h.dur)?" · "+dur(h.dur):""}${h.n>1?" · "+h.n+" visits":""}</span></div></div>`).join("")}</div>`:`<p class="muted">Empty.</p>`}</div></div>`}
function studioContract(){const procs=G(()=>NAV_PROCS.map(p=>({p,m:PROCLIB.maturity(p.id)})))||[];const ents=NAV_ENT.map(e=>DATAMODEL.tables[e.id]);
 return `${procCard("nav_studio")}
 <div class="grid g2" style="align-items:start"><div class="card glass"><div class="cardhead"><div><h3>Data model</h3><span class="muted small">Owner app: Navigation and search. Classification: personal.</span></div></div>
 ${NAV_ENT.map(e=>`<div class="need" style="grid-template-columns:minmax(0,1fr) auto;align-items:start"><div><b>${E(e.label)} <span class="muted small">${e.id}</span></b><span class="muted small">${E(e.note)}</span><div class="row" style="margin-top:6px">${e.fields.slice(0,8).map(f=>`<span class="pill ${f.classification==="personal"?"warn":"mute"}" title="${E(f.classification)}">${E(f.label)}</span>`).join("")}</div></div><button class="btn quiet" type="button" data-atlas-go="${e.id}">Open in data model</button></div>`).join("")}
 ${legend([["Personal field","--warn-f"],["Internal field","--hair"]])}</div>
 <div class="card glass"><div class="cardhead"><div><h3>Maturity</h3><span class="muted small">Process maturity rolls up in Maturity models.</span></div></div>
 ${procs.length?procs.map(x=>`<div class="need" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${E(x.p.name)}</b><span class="muted small">Level ${x.m&&x.m.level!=null?x.m.level:"n/a"} of target ${x.p.target}${x.m&&x.m.gaps&&x.m.gaps.length?" · gaps: "+E(x.m.gaps.slice(0,2).join("; ")):""}</span></div><button class="btn quiet" type="button" data-nx-proc="${x.p.id}">Open process</button></div>`).join(""):`<p class="muted">The process library is still loading these records.</p>`}
 <div class="row" style="margin-top:12px"><button class="btn" type="button" data-nav="exe_mat">Open Maturity models</button><button class="btn" type="button" data-nav="plat_map">Open module map</button></div></div></div>
 <div class="card glass"><div class="cardhead"><div><h3>Measures</h3><span class="muted small">Each has a formula, an owner and a remediation. They update as you navigate and search.</span></div></div><div class="grid g3 mgrid">${["m_nav_depth","m_search_success","m_search_zero_results","m_fav_use","m_hist_return"].map(id=>metricRing(id,120)).join("")}</div></div>`}
REG("nav_studio","Navigation and search","platform","M4 6h16M4 12h10M4 18h7M17 14l4 4M19 16a3 3 0 1 0-6 0 3 3 0 0 0 6 0z",()=>{const c=NAVX.check();
 const story=`All <b data-role="metric">${c.screens}</b> screens have one place: <b data-role="metric">${c.placed}</b> are menu entries in <b>${AREA_IDS.length}</b> business areas and four fixed spaces, the rest are views in a family switcher, merges or search only. The formal module name stays a quiet hint. People reach what they need in <b data-role="metric">${mfmt(METRICS.m_nav_depth)} clicks</b> on average and <b data-role="metric">${mfmt(METRICS.m_search_success)}</b> of searches end in an opened result.`;
 return `<div class="screen">${hero("Platform and administration","Find anything, return to anything",story,`<div class="row">${fchip("m_nav_depth")}${fchip("m_search_success")}${fchip("m_search_zero_results")}${fchip("m_fav_use")}${fchip("m_hist_return")}<button class="btn primary" type="button" data-nx-search>Open search</button></div>`)}${lensNote()}${views("nav_v",["Menu map","Search health","Favorites and history","Process, data and measures"].concat(W.USAGE?["Usage"]:[]),[studioMap(),studioSearch(),studioPeople(),studioContract()].concat(W.USAGE?[G(()=>USAGE.panelHTML())||""]:[]))}</div>`});
ROUTER.on("change",e=>{const t=e.target;if(!t||!t.dataset)return;
 if(t.dataset.nxSg!=null){S.navs.g=t.value;S.v.nav_v=0;render();return}
 if(t.dataset.nxMvg){NAVX.setOverride(t.dataset.nxMvg,{g:t.value});audit("Moved a screen to another group",t.dataset.nxMvg+" to "+t.value);toast("Moved. The menu and search are updated.","good");S.v.nav_v=0;render();return}
 if(t.dataset.nxMvl){const v=t.value.trim();NAVX.setOverride(t.dataset.nxMvl,{l:v||undefined});audit("Renamed a menu item",t.dataset.nxMvl+" to "+v);toast("Menu label saved","good");S.v.nav_v=0;render();return}});
ROUTER.on("click","[data-nx-rst],[data-nx-rebuild],[data-nx-speed],[data-nx-rq],[data-nx-unfav],[data-nx-proc]",(e,t)=>{const d=t.dataset;
 if(d.nxRst){NAVX.setOverride(d.nxRst,null);toast("Reset to the standard label and group");S.v.nav_v=0;render();return}
 if(d.nxRebuild!=null){IDX.built=false;ensureIndex(true);toast("Rebuilding the search index in small slices");setTimeout(()=>{if(S.screen==="nav_studio"){S.v.nav_v=1;render()}},1500);return}
 if(d.nxSpeed!=null){ensureIndex();const run=()=>{if(IDX.building){setTimeout(run,300);return}let tot=0,mx=0;const out=[];SPEEDQ.forEach(q=>{const r=runSearch(q,{});tot+=r.ms;mx=Math.max(mx,r.ms);out.push(q+" "+r.ms+" ms")});S.navs.speed=SPEEDQ.length+" searches over "+IDX.items.length.toLocaleString("en-US")+" items: average "+Math.round(tot/SPEEDQ.length*10)/10+" ms, slowest "+mx+" ms ("+(W.SCALE&&SCALE.on?"enterprise volume":"demo volume")+").";const o=q1("#nxSpeedOut");if(o)o.textContent=S.navs.speed};run();return}
 if(d.nxRq){openPalette({q:d.nxRq});return}
 if(d.nxUnfav){removeFav(d.nxUnfav);if(S.screen==="nav_studio"){S.v.nav_v=2;render()}return}
 if(d.nxProc){if(W.PROCLIB)PROCLIB.open(d.nxProc);return}});
NAVX.studio=()=>go("nav_studio");

/* expose a few internals for tests and for other modules */
NAVX.int={PAL,IDX,SCOPES,TYL,TYCOL,TYICO,SCOPE_ALIAS,SYN,pref,toks,alts,fixTok,mark,rowHTML,select,activate,askFrom,entryOf,setScope,drawPrev,refreshPal,emptyRows,screenRow,mkItem,E,SVG,ICO,q1,qa,st,tel,pushMetrics,toggleFav,syncStars};NAVX.wrapGlobals=wrapGlobals;NAVX.ensureChrome=ensureChrome;NAVX.runSearch=runSearch;NAVX.visit=visit;NAVX.entryOf=entryOf;NAVX.mkScreen=mkScreen;NAVX.itemHTML=itemHTML;NAVX.menu=menu;NAVX.closePops=closePops;NAVX.drawer=()=>DR.cur;NAVX.stack=STK;NAVX.openPalette=openPalette;NAVX.syncStars=syncStars;
})();
