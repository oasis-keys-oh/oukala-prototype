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
const store={get(k){try{const v=localStorage.getItem(k);if(v!=null)return JSON.parse(v)}catch(e){}return MEM[k]==null?null:JSON.parse(MEM[k])},
 set(k,v){let s;try{s=JSON.stringify(v)}catch(e){return}MEM[k]=s;try{localStorage.setItem(k,s)}catch(e){}}};

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
 x:"M6 6l12 12M18 6L6 18"
};
const SVG=(d,sz,sw)=>`<svg viewBox="0 0 24 24" width="${sz||18}" height="${sz||18}" fill="none" stroke="currentColor" stroke-width="${sw||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
NAVX.svg=SVG;NAVX.icons=ICO;

const GROUPS=[
 ["home","Home",ICO.home,"Your starting point."],
 ["my","My work",ICO.my,"Things waiting on you: approvals, meetings, follow-ups."],
 ["help","Get help or ask for something",ICO.help,"Report a problem, order something, or find an answer."],
 ["plan","Plan and deliver projects",ICO.plan,"Choose the work, plan it, staff it and ship it."],
 ["fix","Fix and support services",ICO.fix,"Incidents, root causes, changes, requests and on-call."],
 ["tech","Know our technology",ICO.tech,"Services, systems, dependencies, alerts and pipelines."],
 ["money","Money and contracts",ICO.money,"Invoices, budgets, funding, vendors and cost transparency."],
 ["learn","Knowledge and learning",ICO.learn,"Articles, connected knowledge and training."],
 ["people","People and teams",ICO.people,"Who works where, skills and performance."],
 ["strat","Strategy and performance",ICO.strat,"Goals, risk, maturity, measures and board material."],
 ["auto","Automate",ICO.auto,"Design workflows, rules, notifications and automatic fixes."],
 ["ai","AI and governance",ICO.ai,"Watch, test, govern and connect AI agents."],
 ["plat","Platform and administration",ICO.plat,"Data model, processes, building blocks, security and licensing."],
 ["new","New and unsorted",ICO.new,"Screens that have not been placed in a group yet."]
];
NAVX.groups=GROUPS.map(g=>({id:g[0],label:g[1],icon:g[2],blurb:g[3]}));
const GID={};GROUPS.forEach((g,i)=>GID[g[0]]=i);
/* old product-suite groups (REG group strings) fall back to a functional group */
const OLDG={portfolio:"plan",service:"fix",ops:"tech",know:"learn",people:"people",automate:"auto",ai:"ai",platform:"plat"};
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
chat_home|help|Ask Oukala (chat and agents)|Chat and agents||assistant chat ai bot talk agent
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
itom_graph|tech|What depends on what|Dependency views|Services and records|dependency graph topology upstream downstream map
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
fin_color|money|Which funding pays for what|Color of money|Budgets and funding|color of money capex opex funding type
fin_spend|money|Test the order money is spent|Spend-order simulator|Budgets and funding|spend order simulator waterfall
fin_gates|money|Funding approval gates|Funding gates|Budgets and funding|funding gate g1 g2 g3 stage gate
fin_rules|money|Financial control checks|Financial controls|Budgets and funding|controls reconciliation exceptions rules audit
bud_ben|money|Track benefits|Benefits realization|Budgets and funding|benefits realization value savings roi
bud_ven|money|Vendors and contracts|Vendors and contracts|Vendors|vendor contract purchase order supplier renewal
tbm_model|money|See where IT money goes|Cost transparency (TBM and ATUM)|Where money goes|tbm cost transparency towers cost pools unit cost
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
plat_map|plat|How modules work together|Master process flow|Data and processes|process flow modules map between
plat_pmap|plat|How processes connect|Process connections|Data and processes|process connections links
plat_proc|plat|Process library|Process library|Data and processes|process library maturity steps owner
plat_reg|plat|Platform registry|Platform registry|Data and processes|registry canonical entities catalog
nav_studio|plat|Navigation and search settings|Navigation and search|Data and processes|navigation menu search favorites history map group
plat_build|plat|Build a module|Build a module|Build and connect|build module new app create
plat_self|plat|Let Oukala extend itself|Self-build|Build and connect|self build extend generate
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
function parseRaw(){let o=0;RAW.split("\n").forEach(line=>{const p=line.split("|");if(p.length<3)return;const id=p[0].trim();MAP[id]={g:p[1].trim(),l:p[2].trim(),h:(p[3]||"").trim(),sub:(p[4]||"").trim(),kw:(p[5]||"").trim(),o:o++}})}
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
function resolve(id){const s=screenRow(id);let m=MAP[id];const ov=OVR[id];
 if(!m){const og=oldGroup(id);const g=OLDG[og]||"new";m={g,l:s?String(s[1]).replace(/\s*\([^)]*\)\s*$/,""):id,h:"",sub:"",kw:"",o:9000,unmapped:true}}
 if(ov){m=Object.assign({},m,{g:ov.g&&GID[ov.g]!=null?ov.g:m.g,l:ov.l||m.l,sub:ov.sub!=null?ov.sub:m.sub,edited:true})}
 return m}
const formal=id=>{const s=screenRow(id);return s?String(s[1]):id};
const labelOf=id=>resolve(id).l;
const hintOf=id=>{const m=resolve(id),f=formal(id);const h=m.h||f;return h.toLowerCase()===m.l.toLowerCase()?"":h};
const gLabel=g=>(GROUPS[GID[g]]||GROUPS[GROUPS.length-1])[1];
const tip=id=>{const m=resolve(id),f=formal(id);return m.l===f?f:m.l+" ("+f+")"};
NAVX.resolve=resolve;NAVX.label=labelOf;NAVX.hint=hintOf;NAVX.groupLabel=gLabel;NAVX.formal=formal;
NAVX.setOverride=function(id,o){if(!o){delete OVR[id]}else OVR[id]=Object.assign({},OVR[id]||{},o);store.set("oukala-nav-map",OVR);IDX.dirty=true;try{renderNav()}catch(e){}};
NAVX.overrides=()=>OVR;
function groupItems(g){const ids=SCREENS.map(s=>s[0]).filter(id=>id!=="home"&&resolve(id).g===g);
 return ids.map((id,i)=>({id,m:resolve(id),i})).sort((a,b)=>(a.m.o-b.m.o)||(a.i-b.i)).map(x=>x.id)}
NAVX.groupItems=groupItems;
/* the unmapped check: every registered screen must have an entry in the map */
NAVX.unmapped=function(){return SCREENS.map(s=>s[0]).filter(id=>!MAP[id])};
NAVX.missing=function(){return Object.keys(MAP).filter(id=>!screenRow(id))};
NAVX.counts=function(){const o={};GROUPS.forEach(g=>o[g[0]]=0);SCREENS.forEach(s=>{const g=resolve(s[0]).g;o[g]=(o[g]||0)+1});return o};
NAVX.check=function(){const seen={},dup=[];let n=0;GROUPS.forEach(g=>{(g[0]==="home"?["home"]:groupItems(g[0])).forEach(id=>{n++;if(seen[id])dup.push(id);seen[id]=g[0]})});
 const all=SCREENS.map(s=>s[0]);return {screens:all.length,placed:n,notPlaced:all.filter(id=>!seen[id]),duplicates:dup,unmapped:NAVX.unmapped(),orphans:NAVX.missing()}};

/* ---------- state per persona: favorites, history, recent searches, telemetry ---------- */
let ST=null,STP=null,saveT=0;
const SEED_FAV={exec:["flw_appr","exe_dash","bud_over"],fin:["inv","bud_over","bud_ven"],pm:["ims","ppm_raid","port"],ops:["itsm_inc","itom_evt","itsm_chg"]};
const SEED_HIST=[["itsm_chg",30,6],["bud_ven",27,11],["exe_risk",52,3],["svc_portal",9,4]];
function mkScreen(id){const s=screenRow(id),m=resolve(id);return {id:"screen:"+id,kind:"screen",type:"Screen",key:id,title:m.l,sub:gLabel(m.g),formal:formal(id)}}
function st(){const p=(typeof S!=="undefined"&&S.persona)||"exec";if(STP===p&&ST)return ST;STP=p;ST=store.get("oukala-nav:"+p)||{};
 if(!ST.fav)ST.fav=[];if(!ST.hist)ST.hist=[];if(!ST.rs)ST.rs=[];if(!ST.tel)ST.tel={};
 if(!ST.seeded){ST.seeded=1;const base=now();(SEED_FAV[p]||SEED_FAV.exec).forEach(id=>{if(screenRow(id))ST.fav.push(Object.assign(mkScreen(id),{t:base,seed:1}))});
  SEED_HIST.forEach(a=>{if(screenRow(a[0]))ST.hist.push(Object.assign(mkScreen(a[0]),{t:base-a[1]*3600*1000-(a[1]>24?86400000:0),n:a[2],dur:a[2]*95000,seed:1}))});ST.hist.sort((a,b)=>b.t-a.t);persist()}
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
 if(i>=0){h=s.hist.splice(i,1)[0];h.n=(h.n||1)+1;h.title=e.title;if(e.sub)h.sub=e.sub;if(e.op)h.op=e.op;if(e.scr)h.scr=e.scr}else{h=Object.assign(stripEntry(e),{n:1,dur:0})}
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
