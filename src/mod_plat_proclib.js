/* mod_plat_proclib: Process library. One index of every process (LINKS processes, every PROC.reg screen process, the nine module
   processes defined here, and any added later), a maturity assessment for each built on window.MAT, and one full page per process.
   Reads MODMAP, LINKS, PLAT, MAT and PROC lazily because it loads before the registry. */
(function(){
"use strict";
S.plib=S.plib||{tab:0,own:{},rev:{},ovr:{},hist:{},model:{},custom:[],hfam:null};
const PL=S.plib,E=esc;
const ICON="M5 4h14v4H5zM5 10h14v4H5zM5 16h9v4H5zM17 17l2 2 3-4";
const scName=id=>{const s=SCREENS.find(x=>x[0]===id);return s?s[1]:""};
const hasScr=id=>SCREENS.some(x=>x[0]===id);
const todayIso=()=>{try{return dateOf(TODAY).toISOString().slice(0,10)}catch(e){return "2026-10-06"}};
const dayN=iso=>Date.parse(iso+"T00:00:00Z")/864e5;
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const r1=v=>Math.round(v*10)/10;
const plural=(n,a,b)=>n+" "+(n===1?a:(b||a+"s"));
/* ---------- the nine module processes that did not exist before ---------- */
const NEW9={
 bud_ben:{name:"Benefits realization",family:"strat",trigger:"A project with a business case is approved",owner:"PMO director",entities:["project","demand_request","budget_line"],metrics:["m_benefit"],model:"cmmi",std:[],
  steps:[{n:"Record the expected benefit",d:"The sponsor states the benefit, its measure and the baseline from the business case.",who:"human",owner:"Project sponsor",in:"Business case",out:"Benefit statement with baseline"},
   {n:"Name a benefit owner",d:"One person outside the project team is accountable for the benefit after delivery.",who:"human",owner:"PMO director"},
   {n:"Measure at checkpoints",d:"An agent pulls the measure from the source system each quarter and compares it to the baseline.",who:"agent",owner:"PMO Agent",sla:"Quarterly",in:"Project and metric data"},
   {n:"Review the variance",d:"The benefits board reviews shortfalls and decides whether the benefit still holds.",who:"human",owner:"Benefits board"},
   {n:"Close or re-forecast",d:"The board closes a realized benefit or restates the forecast.",who:"gate",owner:"Steering committee",out:"Closed or restated benefit"}]},
 bud_over:{name:"Budget control",family:"fin",trigger:"The fiscal budget is approved and loaded",owner:"Finance controller",entities:["cost_allocation","invoice","budget_line","purchase_order","cost_center"],metrics:["m_budvar","m_commit"],model:"tbm",std:["tbm"],
  steps:[{n:"Load the approved budget",d:"The ledger budget is loaded by cost center and account.",who:"auto",owner:"Finance systems",sla:"Once a year",in:"General ledger budget",out:"Budget lines by cost center"},
   {n:"Match spend and commitments",d:"Posted invoices and open purchase orders are matched to budget lines.",who:"auto",owner:"Finance systems",in:"Invoices and purchase orders"},
   {n:"Flag overruns",d:"An agent projects each line to year end and flags lines that will pass their limit.",who:"agent",owner:"Forecast Agent",sla:"Weekly",out:"List of at-risk lines"},
   {n:"Explain the variance",d:"The budget owner writes the cause and the plan.",who:"human",owner:"Budget owner"},
   {n:"Approve a transfer",d:"Moving money between lines needs approval at the authority level.",who:"gate",owner:"Finance controller"},
   {n:"Publish the monthly view",d:"The month-end view goes to owners and the executive dashboard.",who:"auto",owner:"Finance systems"}]},
 bud_model:{name:"Financial model and forecast",family:"fin",trigger:"Month end closes or a major assumption changes",owner:"Finance controller",entities:["cost_allocation","forecast_entry","gl_account"],metrics:[],model:"tbm",std:[],
  steps:[{n:"Collect the drivers",d:"Headcount, vendor rates, volumes and project plans are gathered as model inputs.",who:"human",owner:"Finance analyst",in:"Plans and rate cards"},
   {n:"Build scenarios",d:"An agent builds base, low and high cases from the drivers and shows what moved.",who:"agent",owner:"Forecast Agent",out:"Three scenarios"},
   {n:"Reconcile with the ledger",d:"Actuals are tied back to the ledger before the forecast is trusted.",who:"human",owner:"Finance analyst"},
   {n:"Approve the forecast",d:"The finance leader approves the reforecast that becomes the plan of record.",who:"gate",owner:"CFO"},
   {n:"Publish the reforecast",d:"The approved forecast replaces the old one in every view.",who:"auto",owner:"Finance systems"}]},
 bud_doa:{name:"Delegation of authority",family:"fin",trigger:"Someone submits a spend, contract or change that needs approval",owner:"CFO office",entities:["person","change_approval_policy","approval_policy","organization_unit"],metrics:[],model:"cmmi",std:[],
  steps:[{n:"Set limits by role",d:"The board and CFO set approval limits by role, amount and risk.",who:"human",owner:"CFO office",in:"Board policy"},
   {n:"Check the requester",d:"When something is submitted, the platform checks the requester against the limits.",who:"auto",owner:"Workflow engine"},
   {n:"Route to the right approver",d:"The request goes to the lowest role whose limit covers it.",who:"auto",owner:"Workflow engine",sla:"Instant"},
   {n:"Escalate over-limit items",d:"Anything over every limit goes to the next level, with the reason recorded.",who:"gate",owner:"CFO office"},
   {n:"Expire delegations",d:"Temporary delegations end on their date and are logged.",who:"auto",owner:"Workflow engine"}]},
 bud_ven:{name:"Vendor and contract management",family:"con",trigger:"A new vendor is proposed or a contract nears renewal",owner:"Procurement lead",entities:["contract","contract_obligation","vendor","ast_contract","invoice"],metrics:["m_vendor"],model:"tbm",std:[],
  steps:[{n:"Register the vendor and tier its risk",d:"Basic facts, data access and spend decide the risk tier.",who:"human",owner:"Procurement lead",in:"Vendor request"},
   {n:"Review the contract terms",d:"An agent compares clauses to the playbook and lists deviations.",who:"agent",owner:"Contract Analyst Agent",out:"Clause deviations"},
   {n:"Approve the award",d:"Procurement and the budget owner approve at their authority level.",who:"gate",owner:"Procurement lead"},
   {n:"Track obligations and renewals",d:"Dates and duties are tracked and reminders are sent.",who:"auto",owner:"Contract Repository"},
   {n:"Review performance",d:"The vendor owner reviews delivery, credits and risk each quarter.",who:"human",owner:"Vendor owner",sla:"Quarterly"},
   {n:"Renew, renegotiate or exit",d:"A decision is recorded with the evidence.",who:"gate",owner:"Procurement lead"}]},
 adm_gate:{name:"AI gateway and token spend",family:"ai",trigger:"An application or agent calls a model through the gateway",owner:"AI platform lead",entities:["cost_allocation","policy","application"],metrics:["m_aispend"],model:"gai",std:[],
  steps:[{n:"Register the model and route",d:"Each model and approved use gets a route, a budget and an owner.",who:"human",owner:"AI platform lead",in:"Model request"},
   {n:"Apply policy to each call",d:"Personal data, topic and rate rules run on every request.",who:"auto",owner:"AI gateway",sla:"Instant"},
   {n:"Meter tokens",d:"Tokens and cost are recorded per request, team and agent.",who:"auto",owner:"AI gateway",out:"Cost per team"},
   {n:"Enforce the daily cap",d:"Spend over the cap pauses the route and alerts the owner.",who:"auto",owner:"AI gateway"},
   {n:"Review spend and exceptions",d:"The platform lead reviews unusual spend and policy blocks.",who:"human",owner:"AI platform lead"}]},
 tower:{name:"AI oversight and control",family:"ai",trigger:"An agent run finishes, drifts or breaks a guardrail",owner:"AI governance lead",entities:["alert_event","runbook_execution","false_positive_feedback","automation_rule"],metrics:["m_guard"],model:"gai",std:[],
  steps:[{n:"Watch agent runs",d:"Every run reports its outcome, cost, confidence and any override.",who:"auto",owner:"Control tower",in:"Agent run records"},
   {n:"Detect drift and guardrail hits",d:"An agent looks for rising override rates, cost spikes and blocked actions.",who:"agent",owner:"Ops Agent",out:"Findings"},
   {n:"Triage the finding",d:"A person decides whether it is noise, a defect or a risk.",who:"human",owner:"AI governance lead"},
   {n:"Pause or roll back an agent",d:"Pausing a production agent needs an authorized person.",who:"gate",owner:"AI governance lead"},
   {n:"Feed the result back",d:"The outcome becomes a test case and a guardrail update.",who:"agent",owner:"Test Agent"}]},
 adm_sec:{name:"Access and security administration",family:"gov",trigger:"A person asks for access, joins, moves or leaves",owner:"Security lead",entities:["person","role","permission_policy","audit_event"],metrics:[],model:"nist",std:["nist"],
  steps:[{n:"Request access",d:"The requester names the role and the reason.",who:"human",owner:"Requester",in:"Access request"},
   {n:"Check role and policy",d:"The request is checked against the role catalog and separation-of-duty rules.",who:"auto",owner:"Entra ID"},
   {n:"Approve privileged access",d:"Privileged roles need the security lead to approve.",who:"gate",owner:"Security lead"},
   {n:"Provision and log",d:"Access is granted and the grant is logged.",who:"auto",owner:"Entra ID",out:"Granted access with log entry"},
   {n:"Review access each quarter",d:"Managers confirm or remove each person's access.",who:"human",owner:"Security lead",sla:"Quarterly"},
   {n:"Revoke on leave or move",d:"A leaver or mover loses access that no longer fits.",who:"auto",owner:"Entra ID"}]},
 adm_audit:{name:"Audit and compliance evidence",family:"gov",trigger:"An audit period opens or a control test is due",owner:"Compliance lead",entities:["audit_event","control","policy","exception"],metrics:[],model:"nist",std:[],
  steps:[{n:"Select the control and period",d:"The compliance lead picks the control set and period to test.",who:"human",owner:"Compliance lead"},
   {n:"Collect the evidence",d:"An agent gathers logs, approvals and screenshots from the source systems.",who:"agent",owner:"Registry Agent",out:"Evidence set"},
   {n:"Test the control",d:"An auditor tests a sample against the control statement.",who:"human",owner:"Auditor"},
   {n:"Log findings",d:"Failures become findings with an owner and a due date.",who:"human",owner:"Compliance lead",in:"Test results"},
   {n:"Track remediation",d:"Owners fix findings. Overdue items escalate.",who:"human",owner:"Finding owner"},
   {n:"Report to the audit committee",d:"The committee receives the results and signs off.",who:"gate",owner:"Audit committee"}]}
};
const NEWIDS=Object.keys(NEW9);
NEWIDS.forEach(id=>{if(!PROC.defs[id]){const d=NEW9[id];PROC.reg(id,{title:d.name+" process",std:d.std.slice(),steps:d.steps.map(s=>Object.assign({},s))})}});
/* ---------- placement, models and owners ---------- */
const MODOF={plan:"ims",exe_apps:"exe_dash",exe_board:"exe_dash",exe_scen:"exe_dash",flw_asmt:"flw_design",flw_dmn:"flw_design",itom_model:"itom_cmdb",itsm_home:"itsm_inc",kcs_gap:"kcs_home",kcs_prompt:"kcs_skills",kcs_edit:"kcs_home",kcs_test:"kcs_skills",vault:"kcs_ask",ppl_perf:"ppl_org",ppl_jrny:"ppl_org",svc_notify:"svc_req",kcs_viz:"kcs_ask",plat_map:"plat_reg",plat_data:"plat_reg",plat_dmap:"plat_reg",plat_pmap:"plat_reg",plat_proc:"plat_reg",plat_reg:"plat_reg",plat_debt:"plat_debt",plat_fab:"plat_fab",plat_gate:"plat_gate",plat_mcp:"plat_gate"};
const XFAM={plat_map:"gov",plat_data:"gov",plat_dmap:"gov",plat_pmap:"gov",plat_reg:"gov",plat_debt:"gov",plat_fab:"gov",plat_gate:"gov",plat_mcp:"ai",plat_proc:"gov"};
const XNAME={plat_map:"Master process flow",plat_data:"Master data model",plat_dmap:"Data connections",plat_pmap:"Process connections",plat_proc:"Process library",plat_reg:"Platform registry",plat_debt:"Debt ledger",plat_fab:"Integration fabric",plat_gate:"Citizen app gate",plat_mcp:"AI and coding clients"};
const MODEL_BY_ID={dev_pipe:"dora",itom_dev:"dora",itsm_rel:"dora",agile_art:"dora",itom_health:"dmm",itom_model:"dmm",plat_data:"dmm",plat_reg:"dmm",plat_proc:"cmmi",plat_dmap:"dmm",plat_fab:"dmm",plat_mcp:"gai",chat_home:"gai",kcs_ask:"gai",vault:"dmm",adm_sec:"nist",adm_audit:"nist",plat_gate:"nist",itom_slo:"dora",tbm_model:"tbm",itom_fin:"tbm",inv:"tbm"};
const MODEL_BY_FAM={inc:"itil",chg:"itil",req:"itil",cmdb:"itil",evt:"itil",obs:"itil",fin:"tbm",con:"tbm",ai:"gai",gov:"nist"};
const CORE=new Set(["itsm_inc","itsm_chg","itsm_mi","itsm_prb","svc_req","itom_cmdb","itsm_rel","flw_appr","inv","dev_pipe","adm_sec","adm_audit","adm_gate","tower","bud_over","bud_doa"]);
const NAMED={strat:"Maya Ortiz",demand:"Maya Ortiz",proj:"Priya Shah",agile:"Sam Patel",chg:"Nia Brooks",inc:"Tom Becker",req:"Tom Becker",cmdb:"Sam Patel",evt:"Sam Patel",obs:"Sam Patel",fin:"Avery Chen",con:"Avery Chen",ppl:"Nia Brooks",kn:"Jordan Lee",ai:"Jordan Lee",wf:"Jordan Lee",gov:"Rina Okafor"};
const BACKUPS=["Priya Shah","Dev Rao","Jordan Lee","Sam Patel","Nia Brooks","Avery Chen"];
const hashN=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
/* ---------- the six dimensions, with written criteria for each of levels 1 to 5 ---------- */
const DIMS=[
 ["defined","Defined","Steps are documented with inputs and outputs",["Three or more steps are written down","Inputs and outputs are documented, on at least half the steps or as the module's data flows","Every step has an owner, inputs and outputs","Three quarters of steps have a target time, and the process names its trigger and a standard","Reviewed in the last 12 months"]],
 ["owned","Owned","A named accountable owner and a backup",["The accountable team or role is named","A named person is accountable","Two or more responsible roles are recorded for the steps (RACI)","A named backup can step in","Owner and backup reviewed the process in the last 12 months"]],
 ["measured","Measured","Metrics with formula, target and remediation",["At least one metric is linked","A linked metric has a formula, a target and a remediation","Two or more complete metrics are linked","Three or more complete metrics, one with six months of history","Two thirds of the metrics meet target or have a remediation running"]],
 ["integrated","Integrated","Flows reference registered entities",["The process touches at least one data entity","At least one entity it touches is registered in the data model","Half or more of its module's data flows carry a registered entity","80 percent of flows are registered and handoffs run both in and out","Every flow is registered and the module writes nothing it does not own"]],
 ["automated","Automated","Share of steps run by an agent or automatically",["At least one step runs by agent or automatically","A quarter of the steps","Half of the steps","70 percent of the steps","85 percent of the steps"]],
 ["governed","Governed","Approval gates, audit trail and guardrails",["Every change is written to the audit trail","At least one approval gate or recorded control","Every agent step is followed by a person or a gate","Aligned to a named standard, and each gate has approval paths","Reviewed in the last 12 months and gates are in force"]]
];
const DK=DIMS.map(d=>d[0]);
const LVN=["Incomplete","Initial","Managed","Defined","Quantitatively managed","Optimizing"];
/* ---------- helpers over MODMAP, LINKS, PLAT, MAT (all lazy) ---------- */
const modsAll=()=>{try{return(window.MODMAP&&MODMAP.modules)||[]}catch(e){return[]}};
const modOf=id=>modsAll().find(x=>x.id===id)||null;
const matReady=()=>!!(window.MAT&&MAT.CAPS&&MAT.M);
let _ed=null,_edk="";
function edges(){
 const k=(window.LINKS?LINKS.processEdges().length:0)+"|"+PROC_IDS().length;if(_ed&&_edk===k)return _ed;
 const up={},dn={};if(window.LINKS)LINKS.processEdges().forEach(e=>{(dn[e.from]=dn[e.from]||[]).push(e);(up[e.to]=up[e.to]||[]).push(e)});
 _ed={up,dn};_edk=k;return _ed;
}
function PROC_IDS(){return Object.keys(PROC.defs).filter(k=>!/_t\d+$/.test(k))}
const stepsOf=id=>{const d=PROC.defs[id];return d?(S.proc&&S.proc[id])||d.steps||[]:[]};
const entLabel=id=>{const e=window.PLAT&&PLAT.ent?PLAT.ent(id):null;if(e)return e.label;const p=(window.PLAT&&PLAT.PLANNED||[]).find(x=>x[0]===id);return p?p[2]:id};
const entReg=id=>!!(window.PLAT&&PLAT.ent&&PLAT.ent(id));
const entKnown=id=>entReg(id)||!!(window.PLAT&&PLAT.PLANNED||[]).find(x=>x[0]===id);
/* ---------- the process index ---------- */
let IDX=null,IDXK="",VER=0;
const famName=id=>{const f=window.LINKS?LINKS.families.find(x=>x.id===id):null;return f?f.name:({gov:"Platform, security and audit"})[id]||id};
const seedReview=id=>CORE.has(id)?"2026-04-15":null;
function ownerInfo(P){
 const o=PL.own[P.id]||{},mod=modOf(P.module),def=P.def||{};
 const isNew=!!NEW9[P.id]||P.src==="added";
 const role=def.owner&&!(window.who&&who(def.owner))?def.owner:(mod?mod.own:"Process owner");
 let owner=o.owner!==undefined?o.owner:(def.owner&&window.who&&who(def.owner)?def.owner:(isNew?null:NAMED[P.family]||null));
 let backup=o.backup!==undefined?o.backup:(!isNew&&hashN(P.id)%3===0?BACKUPS[hashN(P.id)%BACKUPS.length]:null);
 if(backup&&backup===owner)backup=BACKUPS.find(b=>b!==owner);
 const rv=PL.rev[P.id]||(seedReview(P.id)?{date:seedReview(P.id),by:"Process governance lead",note:"Sample register entry",seed:1}:null);
 return{owner,backup,role,named:!!owner,rev:rv,seeded:o.owner===undefined&&!!owner};
}
function metricsOf(P){
 const out=[],add=k=>{if(METRICS[k]&&!out.includes(k))out.push(k)};
 (P.declMetrics||[]).forEach(add);
 if(!NEW9[P.id]&&P.src!=="added"){
  const mod=modOf(P.module),names=[scName(P.id),P.name,mod&&mod.name,mod&&mod.sn].filter(Boolean).map(s=>s.toLowerCase());
  Object.keys(METRICS).forEach(k=>{const u=(METRICS[k].use||[]).map(x=>String(x).toLowerCase());if(names.some(n=>u.includes(n)))add(k)});
 }
 return out.slice(0,8);
}
const mDone=k=>{const m=METRICS[k];return !!(m&&m.f&&m.tgt!=null&&m.rem&&(m.rem.title||m.rem.ref))};
const mOn=k=>{const m=METRICS[k];return !!m&&(m.dir==="min"?m.cur<=m.tgt:m.cur>=m.tgt)};
function entitiesOf(P,lp){
 const mod=modOf(P.module);let r=[],w=[];
 if(lp&&lp.entities){r=lp.entities.r.slice();w=lp.entities.w.slice()}
 if(P.declEnt)P.declEnt.forEach(e=>{if(!r.includes(e)&&!w.includes(e))r.push(e)});
 if(!r.length&&!w.length&&mod){r=mod.r.slice();w=mod.w.slice()}
 return{r,w,all:[...new Set(r.concat(w))]};
}
function build(){
 const lp={};if(window.LINKS)LINKS.processes().forEach(p=>lp[p.id]=p);
 const ids=[];const seen=new Set();
 const add=id=>{if(!seen.has(id)){seen.add(id);ids.push(id)}};
 Object.keys(lp).forEach(add);PROC_IDS().forEach(add);PL.custom.forEach(c=>add(c.id));
 const list=[];
 ids.forEach(id=>{
  const cu=PL.custom.find(c=>c.id===id),nw=NEW9[id];
  const def=cu||nw||null;
  const mod=cu?cu.module:(MODOF[id]||(modOf(id)?id:null));
  const pr=PROC.defs[id]||{};
  const name=cu?cu.name:nw?nw.name:(lp[id]?lp[id].name:(XNAME[id]||scName(id)||pr.title||id));
  const family=cu?cu.family:nw?nw.family:(lp[id]?lp[id].family:(XFAM[id]||(modOf(id)&&modOf(id).band==="plt"?"gov":"wf")));
  const P={id,name,title:pr.title||name,family,module:mod||"plat_reg",src:cu?"added":nw?"new":lp[id]?"links":"screen",def,steps:stepsOf(id),std:pr.std||[],
   declMetrics:def&&def.metrics?def.metrics:null,declEnt:def&&def.entities?def.entities:null,trigger:def&&def.trigger?def.trigger:""};
  P.ent=entitiesOf(P,lp[id]);
  P.model=PL.model[id]||(def&&def.model)||MODEL_BY_ID[id]||MODEL_BY_FAM[family]||"cmmi";
  list.push(P);
 });
 return list;
}
function trigOf(P){
 if(P.trigger)return P.trigger;
 const up=(edges().up[P.id]||[]).filter(e=>e.kind==="handoff").map(e=>e.trigger);
 if(up.length)return [...new Set(up)].slice(0,3).join("; ");
 const s=P.steps[0];return s?(s.in?s.in:s.n):"Not recorded";
}
/* ---------- assessment: six dimensions, each a ladder of five written criteria ---------- */
function signals(P){
 const st=P.steps,n=st.length,mod=modOf(P.module),oi=ownerInfo(P),ed=edges();
 const c=w=>st.filter(s=>(s.who||"human")===w).length;
 const withIO=st.filter(s=>s.in&&s.out).length,withOwner=st.filter(s=>s.owner).length,withSla=st.filter(s=>s.sla).length;
 const gates=c("gate"),agents=c("agent"),autos=c("auto"),humans=c("human");
 const mets=metricsOf(P),done=mets.filter(mDone),on=done.filter(mOn);
 const flows=mod?mod.inn.concat(mod.out):[],reg=flows.filter(f=>f.reg);
 const inG=(ed.up[P.id]||[]).length,outG=(ed.dn[P.id]||[]).length;
 const ho=(window.LINKS&&LINKS.processes().some(p=>p.id===P.id))?(inG>0&&outG>0):(mod?mod.inn.length>0&&mod.out.length>0:false);
 let unfenced=0;st.forEach((s,i)=>{if((s.who||"human")==="agent"){const nx=st[i+1];if(!nx||!/^(human|gate)$/.test(nx.who||"human"))unfenced++}});
 const rvOk=!!(oi.rev&&dayN(todayIso())-dayN(oi.rev.date)<=365);
 const raci=new Set(st.map(s=>s.owner).filter(Boolean)).size;
 const entReg_=P.ent.all.filter(entReg).length;
 return{n,withIO,withOwner,withSla,gates,agents,autos,humans,mets,done,on,hist:done.some(k=>(METRICS[k].tr||[]).length>=6),flows:flows.length,regFlows:reg.length,
  regShare:flows.length?reg.length/flows.length:0,ho,inG,outG,unfenced,rvOk,raci,entN:P.ent.all.length,entReg:entReg_,nonOwn:mod?mod.nonOwn.length:0,oi,
  autoShare:n?(agents+autos)/n:0,std:P.std.length,trig:!!(P.trigger||(ed.up[P.id]||[]).length||(P.steps[0]&&P.steps[0].in))}
}
function crit(P){
 const g=signals(P),n=g.n||1,o=g.oi;
 const T={
  defined:[g.n>=3,g.withIO/n>=.5||g.flows>0,g.withIO===g.n&&g.withOwner===g.n&&g.n>0,g.withSla/n>=.75&&g.trig&&g.std>0,g.rvOk&&g.withSla===g.n],
  owned:[!!o.role,o.named,g.raci>=2&&o.named,!!o.backup&&o.named,!!o.backup&&o.named&&g.rvOk],
  measured:[g.mets.length>=1,g.done.length>=1,g.done.length>=2,g.done.length>=3&&g.hist,g.done.length>=3&&g.hist&&g.on.length/g.done.length>=.66],
  integrated:[g.entN>=1,g.entReg>=1,g.flows>=2&&g.regShare>=.5&&g.entReg>=2,g.flows>=2&&g.regShare>=.8&&g.ho,g.flows>=2&&g.regShare===1&&g.ho&&g.nonOwn===0],
  automated:[g.autoShare>0,g.autoShare>=.25,g.autoShare>=.5,g.autoShare>=.7,g.autoShare>=.85],
  governed:[true,g.gates>=1,g.gates>=1&&g.unfenced===0,g.gates>=1&&g.unfenced===0&&g.std>0,g.gates>=1&&g.unfenced===0&&g.std>0&&g.rvOk]
 };
 const ev={
  defined:`${g.n} steps. ${g.withIO} state inputs and outputs, ${g.withOwner} have an owner, ${g.withSla} have a target time. Trigger ${g.trig?"is recorded":"is not recorded"}. ${g.std?g.std+" standard"+(g.std>1?"s":"")+" named":"No standard named"}.`,
  owned:`Accountable role: ${o.role}. ${o.named?"Named owner "+o.owner+(o.seeded?" (sample register)":""):"No named owner"}. ${o.backup?"Backup "+o.backup:"No backup"}. ${g.raci} distinct step owner${g.raci===1?"":"s"}. ${o.rev?"Last review "+o.rev.date+(o.rev.seed?" (sample register)":""):"No review recorded"}.`,
  measured:`${g.mets.length} metric${g.mets.length===1?"":"s"} linked, ${g.done.length} complete (formula, target, remediation), ${g.on.length} on target. ${g.hist?"At least one has six or more months of history.":"No metric has six months of history."}`,
  integrated:`${g.entN} entit${g.entN===1?"y":"ies"} touched, ${g.entReg} registered. ${g.regFlows} of ${g.flows} module data flows carry a registered entity. Handoffs ${g.ho?"run in and out":"are not documented both ways"}. ${g.nonOwn} entit${g.nonOwn===1?"y":"ies"} written without ownership.`,
  automated:`${g.autos} automatic and ${g.agents} AI agent step${g.agents===1?"":"s"} out of ${g.n} (${Math.round(g.autoShare*100)}%). ${g.humans} by people, ${g.gates} approval gate${g.gates===1?"":"s"}.`,
  governed:`Audit trail on. ${g.gates} approval gate${g.gates===1?"":"s"}. ${g.unfenced} AI step${g.unfenced===1?"":"s"} not followed by a person or a gate. ${g.std?"Aligned to a named standard.":"No standard named."} ${g.rvOk?"Reviewed in the last 12 months.":"No review in the last 12 months."}`
 };
 return{T,ev,g};
}
function assess(P){
 const c=crit(P),dims={};
 DK.forEach(k=>{let L=0;while(L<5&&c.T[k][L])L++;dims[k]=L});
 const vals=DK.map(k=>dims[k]),av=avg(vals),weak=Math.min.apply(null,vals);
 const raw=Math.round(av),L=Math.max(0,Math.min(raw,weak+1));
 const next={};DK.forEach(k=>{next[k]=dims[k]<5?DIMS[DK.indexOf(k)][3][dims[k]]:null});
 return{dims,avg:av,weak,raw,level:L,capped:raw>L,next,ev:c.ev,T:c.T,sig:c.g};
}
const mLv=model=>{if(!matReady())return 5;const m=MAT.ALLM().find(x=>x.id===model);return m?m.lv.length:5};
const toModel=(L5,model)=>{const mx=mLv(model);if(L5<=1)return 1;return Math.max(1,Math.min(mx,Math.round(1+(L5-1)*(mx-1)/4)))};
const modelName=id=>{const m=matReady()?MAT.ALLM().find(x=>x.id===id):null;return m?m.n:id};
const levelName=(model,lv)=>{const m=matReady()?MAT.ALLM().find(x=>x.id===model):null;const l=m&&m.lv[Math.round(lv)-1];return l?l[0]:"Level "+lv};
function defTargets(P){const base1=CORE.has(P.id)||P.src==="added"?4:3;return[base1,Math.min(5,base1+1),5].map(x=>toModel(x,P.model))}
function finish(P){
 const a=assess(P),ov=PL.ovr[P.id];
 const mlv=ov&&ov.model===P.model?ov.level:toModel(a.level,P.model);
 const mx=mLv(P.model);
 let tg=defTargets(P);
 if(window.MAT&&MAT.tgtN&&P.cap){tg=[0,1,2].map(h=>{try{const v=MAT.tgtN(P.cap,h);return v!=null?v:tg[h]}catch(e){return tg[h]}})}
 const oi=ownerInfo(P);
 const dm=P.steps.map(s=>PROC.modeOf?PROC.modeOf(s):"hum");
 const ai=P.steps.filter(s=>/^(agent|auto)$/.test(s.who||"human")).length,sh=P.steps.length?ai/P.steps.length:0;
 Object.assign(P,{a,level:mlv,l5:a.level,override:ov&&ov.model===P.model?ov:null,target:tg[0],targets:tg,max:mx,oi,owner:oi.owner||oi.role,mix:sh>=.6?"Mostly automated":sh>=.3?"Mixed":"Mostly people",modeMix:dm,mets:a.sig.mets,
  below:mlv<tg[0],hasOwner:oi.named,hasMetric:a.sig.mets.length>0});
 return P;
}
let IDXOLD=null,LASTB=0,IDXQ=0;
function idx(){
 if(!IDX&&IDXOLD&&performance.now()<20000&&performance.now()-LASTB<1500){if(!IDXQ){IDXQ=1;setTimeout(()=>{IDXQ=0;try{idx()}catch(e){}},1600)}return IDXOLD}
 const key=[PROC_IDS().length,PL.custom.length,modsAll().length,window.PLAT&&PLAT.entities?PLAT.entities().length:0,Object.keys(S.proc||{}).map(k=>(S.proc[k]||[]).length).join(","),VER,matReady()?MAT.M.xmodels.length:0,window.LINKS?LINKS.processEdges().length:0].join("|");
 if(IDX&&IDXK===key)return IDX;
 const list=build();IDX={list,by:{}};list.forEach(P=>IDX.by[P.id]=P);IDXK=key;LASTB=performance.now();IDXOLD=IDX;
 syncMat();list.forEach(finish);list.forEach(snap);
 refreshMetrics();
 return IDX;
}
const bump=()=>{VER++;if(IDX)IDXOLD=IDX;IDX=null};
/* ---------- registering every process as a capability in the Maturity models engine ---------- */
let BY=null;
function getBY(){
 if(BY)return BY;
 try{
  Object.defineProperty(Object.prototype,"__plprobe",{configurable:true,get(){const h=Object.prototype.hasOwnProperty;if(h.call(this,"ASD")&&h.call(this,"CMMI"))BY=this;return undefined}});
  try{MAT.whatIf("__plprobe",1,0,0,0)}catch(e){}
 }catch(e){}
 try{delete Object.prototype.__plprobe}catch(e){}
 return BY;
}
const capId=id=>"PM."+id,areaId=m=>"PMA."+String(m).toUpperCase();
function regCap(o,parentId){
 const by=getBY();if(window.MAT&&MAT.reg){try{MAT.reg(o);return}catch(e){}}
 if(!by)return;
 by[o.id]=o;const p=parentId?by[parentId]:null;if(p){p.ids=(p.ids||[]).filter(x=>x!==o.id).concat(o.id)}
}
function syncMat(){
 if(!matReady()||!IDX)return;
 const M=MAT.M,roots={};MAT.CAPS().forEach(n=>{if(n.root)roots[n.model]=n});
 const oldCaps={};M.xcaps.forEach(c=>{if(c.pl)oldCaps[c.id]=c});
 const by0=getBY();Object.keys(roots).forEach(k=>{roots[k].ids=(roots[k].ids||[]).filter(x=>!/^PMA\./.test(x))});
 if(by0)Object.keys(oldCaps).forEach(id=>{delete by0[id]});
 const keep=M.xcaps.filter(c=>!c.pl);M.xcaps.length=0;keep.forEach(c=>M.xcaps.push(c));
 const areas={},used=new Set(IDX.list.map(P=>P.id));
 IDX.list.forEach(P=>{
  const root=roots[P.model]||roots.cmmi;if(!root){return}
  const mid=root.model,aid=areaId(mid);
  if(!areas[aid]){
   const a=oldCaps[aid]||{id:aid,model:mid,parent:root.id,name:"Process maturity",cur:null,t:[null,null,null],conf:.7,owner:"Process governance lead",objs:[],svcs:[],pre:[],cr:[],mt:[],sk:[],w:1,b0:null,eff:0,mo:0,root:0,ids:[],pl:1,area:1,note:"Every platform process, assessed from observable signals in the Process library."};
   a.ids=[];a.model=mid;a.parent=root.id;areas[aid]=a;M.xcaps.push(a);regCap(a,root.id);
   root.ids=(root.ids||[]).filter(x=>x!==aid).concat(aid);
  }
  const cid=capId(P.id);
  let c=oldCaps[cid];const t=defTargets({id:P.id,src:P.src,model:mid});
  if(!c){c={id:cid,model:mid,parent:aid,name:P.name,cur:1,t:t.slice(),conf:.6,owner:"",objs:[],svcs:[],pre:[],cr:[],mt:[],sk:[],w:1,b0:1,eff:1.5+(hashN(P.id)%4)*.5,mo:3+(hashN(P.id)%3),root:0,pl:1,proc:P.id}}
  c.model=mid;c.parent=aid;c.name=P.name;c.proc=P.id;if(c.model!==c._m){c.t=t.slice();c._m=c.model}
  areas[aid].ids.push(cid);M.xcaps.push(c);regCap(c,aid);P.cap=c;
 });
 /* stale entries for removed processes or models leave BYID harmlessly because nothing lists them */
}
function pushLevels(){
 IDX.list.forEach(P=>{const c=P.cap;if(!c)return;c.cur=P.level;c.name=P.name;c.owner=P.oi.owner||P.oi.role;c.conf=P.override?.85:(P.a.sig.mets.length?.7:.6);c.mt=P.mets.slice(0,3);
  if(!c._init){c.b0=c.cur;c._init=1}c.note="Assessed from "+(P.override?"a manual override with evidence":"platform signals")+". Open it in the Process library for the six dimensions.";});
}
/* ---------- assessment history ---------- */
function sigOf(P){return P.level+"|"+DK.map(k=>P.a.dims[k]).join("")+"|"+(P.override?"o":"c")+"|"+P.model}
function snap(P){
 const h=PL.hist[P.id]=PL.hist[P.id]||[];const key=sigOf(P),last=h[h.length-1];
 if(last&&last.key===key)return;
 h.push({key,date:todayIso(),level:P.level,model:P.model,dims:Object.assign({},P.a.dims),basis:P.override?"Manual override":"Computed from platform signals",by:P.override?P.override.reviewer:"Maturity Agent",note:P.override?P.override.evidence:(h.length?"Signals changed":"Baseline assessment")});
 if(h.length>24)h.shift();
}
/* ---------- metrics ---------- */
const MR=(ref,title,agent,prog)=>({kind:"agent",ref,title,agent,auto:false,state:"idle",prog});
Object.assign(METRICS,{
 m_pl_avg:{n:"Average process maturity",f:"Σ process level ÷ processes. Each process level = round(average of its six dimension scores: Defined, Owned, Measured, Integrated, Automated, Governed), capped at the weakest dimension + 1, on the platform scale of 1 to 5",u:"",cur:3,tgt:3.5,badAt:2.2,dir:"max",max:5,tr:[3,3,3,3,3,3,3,3],owner:"Process governance lead",use:["Process library","Master process flow","Maturity models"],rem:{kind:"sop",ref:"SOP-PL-01",title:"Raise the weakest dimension on the lowest processes",agent:"Maturity Agent",auto:false,state:"idle",prog:"Lists the next written criterion for each process and who owns it"}},
 m_pl_below:{n:"Processes below their Year 1 target",f:"Processes whose current maturity level is under their Year 1 target ÷ all processes × 100",u:"%",cur:40,tgt:20,badAt:60,dir:"min",max:100,tr:[40,40,40,40,40,40,40,40],owner:"Process governance lead",use:["Process library","Maturity models"],rem:{kind:"sop",ref:"SOP-PL-02",title:"Turn a below-target process into a funded improvement",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Drafts a demand request for the biggest gaps with cost from MAT unit costs"}},
 m_pl_cov:{n:"Modules with a defined process",f:"Modules with at least one process in the library ÷ modules in the Master process flow × 100",u:"%",cur:100,tgt:100,badAt:90,dir:"max",max:100,tr:[85,85,85,85,100,100,100,100],owner:"Process governance lead",use:["Process library","Master process flow"],rem:{kind:"sop",ref:"SOP-PL-03",title:"Define the process for a module that has none",agent:"Process Agent",auto:false,state:"idle",prog:"Drafts steps from the module's data flows for a person to confirm"}},
 m_pl_noown:{n:"Processes without a named owner",f:"Processes with no named accountable person (only a team or role), counted",u:"",cur:9,tgt:0,badAt:10,dir:"min",max:30,tr:[9,9,9,9,9,9,9,9],owner:"Process governance lead",use:["Process library"],rem:{kind:"sop",ref:"SOP-PL-04",title:"Name an accountable owner and a backup",agent:"Process Agent",auto:false,state:"idle",prog:"Suggests the person who runs most of the steps"}},
 m_pl_nomet:{n:"Processes without a metric",f:"Processes with no linked metric, counted",u:"",cur:9,tgt:0,badAt:12,dir:"min",max:40,tr:[9,9,9,9,9,9,9,9],owner:"Process governance lead",use:["Process library"],rem:{kind:"sop",ref:"SOP-PL-05",title:"Link or define a metric with formula, target and remediation",agent:"Metric Steward Agent",auto:false,state:"idle",prog:"Proposes a metric from the process's outputs"}}
});
function refreshMetrics(){
 if(!IDX)return;const L=IDX.list,n=L.length||1,mods=modsAll().filter(m=>!m.proposed);
 METRICS.m_pl_avg.cur=r1(avg(L.map(P=>P.level/P.max*5)));
 METRICS.m_pl_below.cur=Math.round(100*L.filter(P=>P.below).length/n);
 METRICS.m_pl_cov.cur=mods.length?Math.round(100*mods.filter(m=>L.some(P=>P.module===m.id)).length/mods.length):100;
 METRICS.m_pl_noown.cur=L.filter(P=>!P.hasOwner).length;
 METRICS.m_pl_nomet.cur=L.filter(P=>!P.hasMetric).length;
 ["m_pl_avg","m_pl_below","m_pl_cov","m_pl_noown","m_pl_nomet"].forEach(k=>{const t=METRICS[k].tr;t[t.length-1]=METRICS[k].cur});
 pushLevels();
}
/* ---------- small renderers ---------- */
const bk=P=>Math.max(1,Math.min(5,Math.round(P.level/P.max*5)));
const lvPill=P=>`<span class="pl-lv pl-b${bk(P)}" title="Level ${P.level} of ${P.max}: ${E(levelName(P.model,P.level))}"><i>${P.level}</i><small>${E(levelName(P.model,P.level))}</small></span>`;
const dimCell=v=>`<span class="pl-d pl-b${Math.max(0,v)}" title="${v} of 5">${v}</span>`;
const WHON={human:"Person",agent:"AI agent",auto:"Automatic",gate:"Approval gate"};
const gof=id=>{const l=idx().by[id];return l||null};
const primaryOf=mid=>{const L=idx().list;return L.find(P=>P.id===mid)||L.find(P=>P.module===mid)||null};
const procBtn=(id,label)=>{const P=gof(id);return `<button type="button" class="pl-pc${P?" pl-b"+bk(P):""}" data-pl-open="${E(id)}" title="Open the full process page">${E(label||(P?P.name:id))}${P?`<small>${P.level}</small>`:""}</button>`};
function radar(P){
 const cx=130,cy=112,R=74,n=6,pt=(v,i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*(r||R)*v/5,cy+Math.sin(a)*(r||R)*v/5]};
 const poly=vals=>vals.map((v,i)=>pt(v,i).map(x=>x.toFixed(1)).join(",")).join(" ");
 const rings=[1,2,3,4,5].map(k=>`<polygon points="${poly(DK.map(()=>k))}" class="pl-rg"/>`).join("");
 const ax=DK.map((k,i)=>{const [x,y]=pt(5,i),[lx,ly]=pt(5,i,R+17);return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="pl-ax"/><text x="${lx.toFixed(1)}" y="${(ly+3.5).toFixed(1)}" text-anchor="${lx<cx-4?"end":lx>cx+4?"start":"middle"}" class="pl-rl">${DIMS[i][1]}</text>`}).join("");
 const t5=P.target/P.max*5;
 return `<svg class="pl-radar" viewBox="-34 0 328 226" role="img" aria-label="Six dimensions: ${DIMS.map((d,i)=>d[1]+" "+P.a.dims[d[0]]).join(", ")}. Dashed line is the Year 1 target level.">${rings}${ax}<polygon points="${poly(DK.map(()=>t5))}" class="pl-tg"/><polygon points="${poly(DK.map(k=>P.a.dims[k]))}" class="pl-cu"/>${DK.map((k,i)=>{const [x,y]=pt(P.a.dims[k],i);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" class="pl-dot"/>`}).join("")}</svg>`;
}
function dimBars(P){
 return `<div class="pl-bars">${DIMS.map(d=>{const v=P.a.dims[d[0]];return `<div class="pl-br"><div class="row sp"><b>${d[1]}</b><span class="num" data-role="metric">${v} of 5</span></div><div class="pl-tk" role="img" aria-label="${d[1]} ${v} of 5"><i class="pl-b${v}" style="width:${v*20}%"></i></div><p class="small muted">${E(P.a.next[d[0]]?"Next: "+P.a.next[d[0]]:"Top of the ladder.")}</p></div>`}).join("")}</div>`;
}
const lvLegend=()=>legend([["0 Not met","--pl-c0"],["1","--pl-c1"],["2","--pl-c2"],["3","--pl-c3"],["4","--pl-c4"],["5 Best","--pl-c5"]]);
const ownerLabel=oi=>oi.owner?(window.who&&who(oi.owner)?pchip(oi.owner):E(oi.owner)):`<span class="pill warn">No named owner</span> <span class="small muted">${E(oi.role)}</span>`;
const ownerOf=P=>P.oi.owner||P.oi.role;
function modeCounts(P){const c={};P.steps.forEach(s=>{const w=s.who||"human";c[w]=(c[w]||0)+1});return c}
function story(P){
 const c=modeCounts(P),mod=modOf(P.module),ed=edges();
 const parts=[`<b>${E(P.name)}</b> is run by ${P.oi.owner?"<b>"+E(P.oi.owner)+"</b>":"the "+E(P.oi.role)+" (no named owner yet)"}${P.oi.backup?", with "+E(P.oi.backup)+" as backup":""}. It has <b data-role="metric">${P.steps.length}</b> steps: ${c.auto||0} automatic, ${c.agent||0} by an AI agent, ${c.human||0} by people and ${c.gate||0} approval gate${c.gate===1?"":"s"}.`];
 parts.push(`Maturity is <b data-role="metric">level ${P.level} of ${P.max} (${E(levelName(P.model,P.level))})</b> on the ${E(modelName(P.model))} scale${P.override?", set by a manual override with evidence":", assessed from platform signals"}. The Year 1 target is <b>${P.target}</b>${P.below?`, so it is <b>${P.target-P.level} level${P.target-P.level===1?"":"s"} short</b>`:", which it meets"}.`);
 const w=DK.slice().sort((a,b)=>P.a.dims[a]-P.a.dims[b])[0];
 parts.push(`The weakest dimension is <b>${DIMS[DK.indexOf(w)][1]}</b> at ${P.a.dims[w]} of 5.`);
 return parts.join(" ");
}
function ioGroups(P){
 const mod=modOf(P.module);if(!mod)return{inn:[],out:[]};
 const row=(f,dir)=>{const o=dir==="in"?f.from:f.to,om=modOf(o);return{id:f.id,t:f.data,sub:(dir==="in"?"From ":"To ")+(om?om.sn:o)+" · "+f.trig+(f.refs.length?" · "+f.refs.slice(0,2).map(r=>r.label).join(", "):""),tag:f.mode,st:f.reg?"info":"warn",go:()=>{closeDrawer();window.MODMAP&&MODMAP.select&&MODMAP.select(P.module,dir==="in"?"pulls":"pushes")}}};
 const dec=(a,dir)=>(P.def&&P.def[a]||[]).map((t,i)=>({id:P.id+a+i,t:String(t),sub:"Declared on the process, not yet a documented module flow",tag:"declared",st:"mute",go:()=>{}}));
 return{inn:dec("inputs").concat(mod.inn.map(f=>row(f,"in"))),out:dec("outputs").concat(mod.out.map(f=>row(f,"out")))};
}
function neighborsOf(P){
 const ed=edges(),up=new Map(),dn=new Map();
 (ed.up[P.id]||[]).forEach(e=>{if(!up.has(e.from))up.set(e.from,e)});(ed.dn[P.id]||[]).forEach(e=>{if(!dn.has(e.to))dn.set(e.to,e)});
 let via=false;
 if(!up.size&&!dn.size&&window.MODMAP&&MODMAP.neighbors){const nb=MODMAP.neighbors(P.module)||{push:[],pull:[]};
  nb.pull.forEach(m=>{const q=primaryOf(m);if(q&&q.id!==P.id)up.set(q.id,{from:q.id,to:P.id,kind:"module",mode:"event",entities:[],trigger:"Module data flow"})});
  nb.push.forEach(m=>{const q=primaryOf(m);if(q&&q.id!==P.id)dn.set(q.id,{from:P.id,to:q.id,kind:"module",mode:"event",entities:[],trigger:"Module data flow"})});via=up.size||dn.size}
 return{up:[...up.entries()],dn:[...dn.entries()],via};
}
const edgeChip=(id,e)=>{const P=gof(id);if(!P)return"";return `<span class="pl-nb">${procBtn(id)}<small class="muted">${E(e.trigger||"")}${e.entities&&e.entities.length?" · "+e.entities.slice(0,2).map(entLabel).join(", "):""}</small></span>`};
function controlsHTML(P){
 const st=P.steps,gates=st.filter(s=>s.who==="gate"),ag=st.filter(s=>s.who==="agent"),g=P.a.sig;
 const pol=gates.length&&PROC.policyFor?PROC.policyFor(P.id):null;
 const li=[];
 li.push(`<li><b>Audit trail.</b> Every edit to this process and every change to its records is written to the audit log.</li>`);
 li.push(gates.length?`<li><b>${gates.length} approval gate${gates.length===1?"":"s"}:</b> ${gates.map(s=>E(s.n)).join(", ")}.${pol?` Paths: pre-approved up to ${money(pol.amt1)}, AI-reasoned up to ${money(pol.amt2)} at ${pol.conf}% confidence or more, otherwise a person decides.`:""}</li>`:`<li><b>No approval gate.</b> Nothing in this process needs a person to approve before it commits. Add one if it changes money, access or customer data.</li>`);
 li.push(ag.length?`<li><b>${ag.length} AI agent step${ag.length===1?"":"s"}:</b> ${ag.map(s=>E(s.n)+(s.owner?" ("+E(s.owner)+")":"")).join(", ")}. ${g.unfenced?`<span class="pill warn">${g.unfenced} not followed by a person or gate</span>`:`Each is followed by a person or a gate.`}</li>`:`<li><b>No AI agent steps.</b> Nothing here acts without a person or a rule.</li>`);
 const cls=P.ent.all.map(e=>PLAT.ent&&PLAT.ent(e)).filter(e=>e&&(e.cls==="restricted"||e.cls==="confidential"||e.cls==="personal"));
 if(cls.length)li.push(`<li><b>Sensitive data:</b> touches ${cls.slice(0,4).map(e=>E(e.label)+" ("+E(e.cls)+")").join(", ")}${cls.length>4?" and "+(cls.length-4)+" more":""}.</li>`);
 return `<ul class="pl-ul">${li.join("")}</ul><div class="row">${P.std.map(k=>stdChip(k,"This process is aligned to "+(STD[k]?STD[k].n:k)+".")).join("")||'<span class="small muted">No standard named.</span>'}</div>`;
}
function raciHTML(P){
 const oi=P.oi,ns=neighborsOf(P),own=id=>{const q=gof(id);return q?ownerOf(q):""};
 const R=[...new Set(P.steps.map(s=>s.owner).filter(Boolean))],C=[...new Set(ns.up.map(x=>own(x[0])).filter(Boolean))].slice(0,4),I=[...new Set(ns.dn.map(x=>own(x[0])).filter(Boolean))].slice(0,4);
 const chips=a=>a.length?a.map(x=>window.who&&who(x)?pchip(x):`<span class="chip">${E(x)}</span>`).join(" "):'<span class="small muted">None recorded</span>';
 const rw=(l,b)=>`<div class="pl-rw"><span class="small muted">${l}</span><div class="row">${b}</div></div>`;
 return `<div class="pl-raci">${rw("Accountable",ownerLabel(oi))}${rw("Backup",oi.backup?(window.who&&who(oi.backup)?pchip(oi.backup):E(oi.backup)):'<span class="pill warn">No backup</span>')}${rw("Responsible",chips(R.slice(0,8)))}${rw("Consulted",chips(C))}${rw("Informed",chips(I))}${rw("Last review",oi.rev?E(oi.rev.date)+(oi.rev.seed?' <span class="small muted">(sample register)</span>':""):'<span class="pill warn">None recorded</span>')}</div>`;
}
function maturityPanel(P){
 const a=P.a,hist=PL.hist[P.id]||[],ov=P.override;
 const mods=matReady()?MAT.ALLM():[];
 const nxt=Math.min(5,a.level+1);
 const needDims=DK.filter(k=>a.dims[k]<a.level+0).map(k=>DIMS[DK.indexOf(k)]);
 const nextCrit=DK.filter(k=>a.next[k]).sort((x,y)=>a.dims[x]-a.dims[y]).slice(0,3).map(k=>`<li><b>${DIMS[DK.indexOf(k)][1]}</b> (now ${a.dims[k]}): ${E(a.next[k])}</li>`).join("");
 const ga=matReady()&&MAT.gapActions&&P.cap?MAT.gapActions().filter(x=>x.node===P.cap.id):[];
 const m=matReady()?MAT.ALLM().find(x=>x.id===P.model):null;
 const ladder=m?`<ol class="pl-lad">${m.lv.map((l,i)=>`<li class="${i+1===P.level?"here":""}${i+1===P.target?" tgt":""}"><span class="pl-ln">${i+1}</span><div><b>${E(l[0])}</b>${i+1===P.level?' <span class="pill info">Now</span>':""}${i+1===P.target?' <span class="pill mute">Year 1 target</span>':""}<p class="small muted">${E(l[1])}</p></div></li>`).join("")}</ol>`:"";
 const evid=DIMS.map(d=>`<tr><th scope="row">${d[1]}</th><td>${dimCell(a.dims[d[0]])}</td><td class="wrap">${E(a.ev[d[0]])}</td></tr>`).join("");
 return `<div class="pl-mat">
  <div class="row sp"><div><div class="eyebrow">Process maturity</div><h3 class="pl-h">Level ${P.level} of ${P.max}, ${E(levelName(P.model,P.level))}</h3></div><div class="row">${aiChip({model:"Maturity Agent",conf:P.override?.85:.7,title:"How this level was assessed",note:"Scores six dimensions from the process steps, owners, linked metrics, module data flows, automation share and gates. A person can override the result with evidence.",src:["Process steps and owners","Linked metrics","Module data flows","Gates and audit trail"],guards:["Reads platform records only","Cannot change a level without a named reviewer","Every override is audited"]})}${stdChip("cmmi","Levels follow the CMMI and ISO/IEC 33020 capability scale.")}</div></div>
  <p class="small muted" data-role="story">Assessment basis: ${ov?`manual override by <b>${E(ov.reviewer)}</b> on ${E(ov.date)} (computed level was ${toModel(a.level,P.model)})`:`computed from observable platform signals, last recorded ${E((hist[hist.length-1]||{}).date||todayIso())}`}. Level = round(average of six dimensions) = ${a.raw}, capped at weakest dimension + 1 = ${a.weak+1}${a.capped?", so the cap applies":""}. Result ${a.level} on a 0 to 5 scale${a.level===0?"; the platform scale starts at 1, so it shows as Initial":""}.</p>
  <div class="dfullgrid pl-mg"><div class="pl-rwrap">${radar(P)}<div class="legend pl-lg"><span><i class="pl-sw cu"></i>Assessed level</span><span><i class="pl-sw tg"></i>Year 1 target (level ${P.target})</span></div></div><div>${dimBars(P)}</div></div>
  <div class="dfullgrid pl-mg"><div><div class="eyebrow">Level ladder, ${E(modelName(P.model))}</div>${ladder}</div>
   <div><div class="eyebrow">To reach level ${nxt}</div>${a.level>=5?"<p class='small'>Top of the scale.</p>":`<p class="small muted">Every dimension must be at least ${a.level} and the average must round to ${nxt}. Next written criteria, weakest first:</p><ul class="pl-ul">${nextCrit}</ul>`}
   <div class="eyebrow" style="margin-top:12px">Gap actions</div>${ga.length?`<ul class="pl-ul">${ga.map(x=>`<li><b>${E(x.title)}</b><br><span class="small muted">${E(x.reason)}</span></li>`).join("")}</ul>`:`<p class="small muted">${P.below?"A funded project already reaches the target, or no costed gap action applies yet.":"At or above its Year 1 target. No gap action needed."}</p>`}
   <div class="row" style="margin-top:8px"><button class="btn" data-pl-cap="${E(P.id)}">Open in Maturity models</button></div></div></div>
  <div class="eyebrow">Evidence behind each score</div><div class="tscroll"><table class="pl-ev"><tbody>${evid}</tbody></table></div>
  <div class="dfullgrid pl-mg"><div><div class="eyebrow">Model for this process</div><label class="small muted" for="pl-mp-${E(P.id)}">Measure it on</label><select class="fin pl-sel" id="pl-mp-${E(P.id)}" data-pl-model="${E(P.id)}">${mods.map(x=>`<option value="${E(x.id)}" ${x.id===P.model?"selected":""}>${E(x.n)}${x.src&&/Ingest|Authored/.test(x.src)&&!MAT_BUILT.has(x.id)?" (imported)":""}</option>`).join("")}</select><p class="small muted">Switching keeps the six dimensions and re-maps the result to that model's levels. Models you paste into Maturity models appear here.</p></div>
   <div><div class="eyebrow">Change the assessment</div><div class="row"><button class="btn primary" data-pl-ovr="${E(P.id)}">${ov?"Edit override":"Override with evidence"}</button>${ov?`<button class="btn" data-pl-ovrclr="${E(P.id)}">Remove override</button>`:""}<button class="btn" data-pl-rev="${E(P.id)}">Record a review</button><button class="btn" data-pl-owner="${E(P.id)}">Assign owner and backup</button></div></div></div>
  <div class="eyebrow">Assessment history</div>${lrHTML({id:"pl_h_"+P.id,groups:[{key:"h",label:"Assessments, newest first",rows:hist.slice().reverse().map((h,i)=>({id:P.id+i,t:`Level ${h.level} of ${mLv(h.model)} on ${h.date}`,sub:`${h.basis} · ${h.by} · ${h.note||""}`,tag:h.dims?DK.map(k=>h.dims[k]).join("-"):"",st:"mute",go:()=>{}}))}],limit:4,search:false})}
 </div>`;
}
const MAT_BUILT=new Set(["asd","pdt","cmmi","itil","tbm","dmm","nist","gai","dora","p3m3"]);
function whereHTML(){
 const it=(n,t,d,b)=>`<div class="pl-wc"><span class="pl-wn">${n}</span><div><b>${t}</b><p class="small muted">${d}</p>${b||""}</div></div>`;
 return `<div class="pl-where">
  ${it(1,"From the Master process flow","Open the module map, select a module, choose the <b>Its process</b> tab, then select the process name or any step. The full process page opens.",`<button class="btn" data-pl-goscreen="plat_map">Open Master process flow</button>`)}
  ${it(2,"From the Process library tab on the map","The Master process flow has a <b>Process library</b> tab and a button in its header. Both open this list.",`<button class="btn" data-pl-goscreen="plat_map" data-pl-tab6>Open the map's library tab</button>`)}
  ${it(3,"From Process connections","Select a process node, then <b>Open full process page</b> in its side panel. Upstream and downstream chips on the page jump to the neighbor.",`<button class="btn" data-pl-goscreen="plat_pmap">Open Process connections</button>`)}
  ${it(4,"From search","Press the search box at the top and type a process name, for example <i>incident</i>, <i>change enablement</i> or <i>benefits</i>. Every process is a result.",`<button class="btn" data-pl-open="itsm_inc">Try: Incidents</button>`)}
  ${it(5,"From chat","Ask Oukala: <i>show the incident process</i>, <i>what is the maturity of change enablement</i>, <i>which processes are below target</i> or <i>open the process library</i>.",`<button class="btn" data-pl-goscreen="chat_home">Open chat</button>`)}
  ${it(6,"From this library","Select any row in the table on the first tab, or any cell in the heat map on the Maturity tab.",`<button class="btn" data-pl-lib="0">Go to the table</button>`)}
 </div>`;
}
/* ---------- the full process page ---------- */
function procPage(P){
 const mod=modOf(P.module),ns=neighborsOf(P),io=ioGroups(P),c=modeCounts(P);
 let blast=null;try{if(window.LINKS&&LINKS.processes().some(p=>p.id===P.id))blast=LINKS.processBlast(P.id)}catch(e){}
 const entChip=(e,kind)=>`<button type="button" class="chip pl-ec" data-pl-ent="${E(e)}" title="Open ${E(entLabel(e))} in the data model">${E(entLabel(e))}${entReg(e)?"":" (planned)"}${kind?` <small>${kind}</small>`:""}</button>`;
 const ents=P.ent.all.length?`<div class="row">${P.ent.w.map(e=>entChip(e,"writes")).join("")}${P.ent.r.filter(e=>!P.ent.w.includes(e)).map(e=>entChip(e,"reads")).join("")}</div>`:`<p class="small muted">No entity is recorded for this process. Name the records it reads and writes so the data model can trace it.</p>`;
 const mets=P.mets.length?`<div class="row">${P.mets.map(k=>fchip(k)).join("")}</div>`:`<p class="small muted">No metric is linked. Without one the Measured dimension stays at 0. <button type="button" class="btn quiet" data-pl-goscreen="metrics">Open Metrics</button></p>`;
 const mix=Object.keys(c).map(w=>`<span class="pill ${w==="agent"?"info":w==="auto"?"good":w==="gate"?"warn":"mute"}">${c[w]} ${WHON[w].toLowerCase()}</span>`).join("");
 const nbHTML=(a,dir)=>a.length?`<div class="pl-nbs">${a.map(x=>edgeChip(x[0],x[1])).join("")}</div>`:`<p class="small muted">No ${dir} processes are documented.</p>`;
 return `<div class="pl-page" data-pl-page="${E(P.id)}">
 <div class="row sp"><div class="row"><span class="eyebrow">${E(famName(P.family))}</span>${mod?`<span class="pill mute">Module: ${E(mod.name)}</span>`:""}${P.src==="new"?'<span class="pill warn">New in Round 10</span>':P.src==="added"?'<span class="pill info">Added</span>':""}</div></div>
 <h2 class="pl-title">${E(P.name)}</h2>
 <div class="row">${lvPill(P)}<span class="pill ${P.below?"warn":"good"}">${P.below?"Below target":"Meets target"} (Year 1: ${P.target})</span>${mix}<span class="pill mute">${E(P.mix)}</span></div>
 <p class="story" data-role="story">${story(P)}</p>
 <div class="row">${hasScr(P.id)?`<button class="btn primary" data-pl-goscreen="${E(P.id)}">Open the screen</button>`:""}${mod?`<button class="btn" data-pl-map="${E(P.module)}">Show module on the map</button>`:""}${window.DRAW&&DRAW.btn?DRAW.btn(P.id,"Draw this process","primary"):""}<button class="btn" data-pl-owner="${E(P.id)}">Assign owner and backup</button><button class="btn" data-pl-ovr="${E(P.id)}">Override maturity</button></div>
 <div class="dfullgrid pl-sec">
  <div class="pl-card glass">${maturityPanel(P)}</div>
 </div>
 <div class="pl-sec">${procCard(P.id)}</div>
 <div class="dfullgrid pl-sec">
  <div class="pl-card glass"><div class="eyebrow">Trigger</div><p>${E(trigOf(P))}</p><div class="eyebrow" style="margin-top:12px">Owner and RACI</div>${raciHTML(P)}</div>
  <div class="pl-card glass"><div class="eyebrow">Controls and guardrails</div>${controlsHTML(P)}</div>
  <div class="pl-card glass"><div class="eyebrow">Metrics</div>${mets}<div class="eyebrow" style="margin-top:12px">Entities touched</div>${ents}</div>
 </div>
 <div class="dfullgrid pl-sec">
  <div class="pl-card glass"><div class="eyebrow">Inputs and outputs from the module's data flows</div><p class="small muted">${mod?`${E(mod.name)} pulls ${io.inn.length} and pushes ${io.out.length} documented flows. The data carried is named on each row.`:"This process has no module on the map."}</p>${lrHTML({id:"pl_io_"+P.id,groups:[{key:"i",label:"Inputs (pulled)",rows:io.inn},{key:"o",label:"Outputs (pushed)",rows:io.out}],limit:5,empty:"No documented data flows."})}</div>
  <div class="pl-card glass"><div class="eyebrow">Upstream processes</div>${nbHTML(ns.up,"upstream")}<div class="eyebrow" style="margin-top:12px">Downstream processes</div>${nbHTML(ns.dn,"downstream")}${ns.via?'<p class="small muted">Taken from the module data flows because no process handoff is documented.</p>':""}
   <div class="eyebrow" style="margin-top:12px">Blast radius</div>${blast?`<div class="statrow pl-st"><div class="stat"><small>Processes</small><span class="num" data-role="metric">${blast.processes.length}</span></div><div class="stat"><small>Entities</small><span class="num" data-role="metric">${blast.entities.length}</span></div><div class="stat"><small>Apps</small><span class="num" data-role="metric">${blast.apps.length}</span></div></div><p class="small muted" data-role="story">${blast.processes.length?"If this process stops, these depend on it: "+blast.processes.slice(0,5).map(id=>(gof(id)||{name:id}).name).join(", ")+(blast.processes.length>5?" and "+(blast.processes.length-5)+" more.":"."):"Nothing downstream depends on it through a documented handoff or data it writes."}</p>`:'<p class="small muted">Blast radius is calculated for processes in the Process connections graph. This one is tied to its module instead.</p>'}</div>
 </div>
 <details class="pl-card glass pl-sec"><summary><b>Where to click to get here again</b></summary>${whereHTML()}</details>
 </div>`;
}
let LASTOPEN=null;
function openProc(id){
 let P=gof(id);if(!P){const pm=primaryOf(id);if(pm)P=pm}
 if(!P){toast("No process found for "+id,"warn");return false}
 LASTOPEN=P.id;
 try{if(window.innerWidth>=1100)S.k2.dfull=true}catch(e){}
 openDrawer(procPage(P));
 audit("Process library: opened process",P.name);
 return true;
}
/* ---------- the library screen ---------- */
function rowsNow(){return idx().list.map(P=>({id:P.id,n:P.name,fam:famName(P.family),mod:(modOf(P.module)||{name:P.module}).name,lvl:P.level,lname:levelName(P.model,P.level),lab:"Level "+P.level+" "+levelName(P.model,P.level),tgt:P.target,model:modelName(P.model),own:P.oi.owner||P.oi.role+" (no named owner)",mix:P.mix,steps:P.steps.length,mets:P.mets.length,gap:Math.max(0,P.target-P.level),below:P.below}))}
function libTable(){
 return btHTML({id:"pl_tbl",h:520,rowH:56,key:"id",sort:{k:"lvl",d:1},exportName:"process-library",facets:["fam","mod","lab","own","mix"],rows:rowsNow,cols:[
  {k:"n",label:"Process",wrap:1,val:r=>r.n,fmt:r=>`<b>${E(r.n)}</b><div class="small muted">${E(r.mod)}</div>`},
  {k:"fam",label:"Family",val:r=>r.fam,fmt:r=>E(r.fam),wrap:1},
  {k:"mod",label:"Module",val:r=>r.mod,fmt:r=>E(r.mod),wrap:1},
  {k:"lab",label:"Maturity",val:r=>r.lab,fmt:r=>{const P=gof(r.id);return P?lvPill(P):""}},
  {k:"lvl",label:"Level",val:r=>r.lvl,fmt:r=>`<span class="num">${r.lvl}</span>`},
  {k:"tgt",label:"Year 1 target",val:r=>r.tgt,fmt:r=>`<span class="num">${r.tgt}</span>${r.below?' <span class="pill warn">short</span>':""}`},
  {k:"model",label:"Model",val:r=>r.model,fmt:r=>E(r.model),wrap:1},
  {k:"own",label:"Owner",val:r=>r.own,fmt:r=>E(r.own),wrap:1},
  {k:"mix",label:"Mode mix",val:r=>r.mix,fmt:r=>E(r.mix)},
  {k:"steps",label:"Steps",val:r=>r.steps,fmt:r=>`<span class="num">${r.steps}</span>`},
  {k:"mets",label:"Metrics",val:r=>r.mets,fmt:r=>`<span class="num">${r.mets}</span>`}],open:id=>openProc(id)});
}
function stats(){
 const L=idx().list,mods=modsAll().filter(m=>!m.proposed),covered=mods.filter(m=>L.some(P=>P.module===m.id)).length;
 const dist=[0,0,0,0,0,0];L.forEach(P=>dist[bk(P)]++);
 const dimAvg={};DK.forEach(k=>dimAvg[k]=avg(L.map(P=>P.a.dims[k])));
 return{processes:L.length,modules:mods.length,covered,avg:METRICS.m_pl_avg.cur,below:L.filter(P=>P.below).length,noOwner:L.filter(P=>!P.hasOwner).length,noMetric:L.filter(P=>!P.hasMetric).length,noBackup:L.filter(P=>!P.oi.backup).length,dist,dimAvg,
  byLevel:L.reduce((a,P)=>{a[P.level]=(a[P.level]||0)+1;return a},{}),fromLinks:L.filter(P=>P.src==="links").length,fromScreens:L.filter(P=>P.src==="screen").length,fromNew:L.filter(P=>P.src==="new").length,added:L.filter(P=>P.src==="added").length};
}
function famBars(){
 const L=idx().list,fams=[...new Set(L.map(P=>P.family))].map(f=>({f,l:L.filter(P=>P.family===f)})).map(x=>({f:x.f,n:x.l.length,a:avg(x.l.map(P=>P.level/P.max*5)),b:x.l.filter(P=>P.below).length})).sort((p,q)=>p.a-q.a);
 return `<div class="pl-fb">${fams.map(x=>`<div class="pl-fr"><span class="small">${E(famName(x.f))}</span><div class="pl-tk" role="img" aria-label="${E(famName(x.f))}: average level ${r1(x.a)} of 5"><i class="pl-b${Math.max(1,Math.round(x.a))}" style="width:${x.a*20}%"></i></div><span class="num small">${r1(x.a)}</span><span class="small muted">${x.n}</span></div>`).join("")}</div>${lvLegend()}`;
}
function libPane(){
 const s=stats(),L=idx().list;
 const kp=kpiRow([["Processes defined",s.processes,"from "+s.fromLinks+" connected, "+s.fromScreens+" screen, "+s.fromNew+" new, "+s.added+" added"],["Modules covered",s.covered+" of "+s.modules,"each has a process",{metric:"m_pl_cov"}],["Average maturity",s.avg+" of 5","platform scale",{metric:"m_pl_avg"}],["Below Year 1 target",s.below,Math.round(100*s.below/Math.max(1,s.processes))+"% of processes",{metric:"m_pl_below"}],["No named owner",s.noOwner,"team or role only",{metric:"m_pl_noown"}],["No metric",s.noMetric,"Measured stays at 0",{metric:"m_pl_nomet"}]]);
 const top=L.filter(P=>P.below).sort((a,b)=>(b.target-b.level)-(a.target-a.level)||a.a.avg-b.a.avg).slice(0,6);
 return `${kp}<div class="grid g2 pl-two"><div class="card glass"><div class="eyebrow">Average maturity by family</div><p class="small muted">Lowest first. The bar is the average level on the platform scale of 1 to 5.</p>${famBars()}</div>
 <div class="card glass"><div class="eyebrow">Needs attention first</div><p class="small muted">Processes furthest below their Year 1 target.</p><div class="pl-top">${top.map(P=>`<button type="button" class="pl-trow" data-pl-open="${E(P.id)}">${lvPill(P)}<span><b>${E(P.name)}</b><small class="muted">${E(P.oi.owner||P.oi.role)} · target ${P.target}</small></span></button>`).join("")||'<p class="small muted">Every process meets its target.</p>'}</div></div></div>
 <div class="card glass pl-tcard"><div class="row sp"><div><div class="eyebrow">All processes</div><p class="small muted">Select a row to open the full process page. Filter by family, module, maturity level, owner or mode mix, or search by name.</p></div><div class="row"><button class="btn primary" data-pl-add>Add a process</button></div></div>${libTable()}</div>`;
}
function heatRows(){
 const sel=mpGet("pl_hfam");const all=!sel.length||sel.length>=famCount();
 return idx().list.filter(P=>all||sel.includes(P.family)).sort((a,b)=>a.level/a.max-b.level/b.max||a.name.localeCompare(b.name));
}
const famCount=()=>new Set(idx().list.map(P=>P.family)).size;
function ownerWork(){
 const m=new Map();idx().list.filter(P=>P.below).forEach(P=>{const o=P.oi.owner||P.oi.role+" (no named owner)";(m.get(o)||m.set(o,[]).get(o)).push(P)});
 return[...m.entries()].sort((a,b)=>b[1].length-a[1].length);
}
function matPane(){
 const s=stats(),L=idx().list,mx=Math.max.apply(null,s.dist.slice(1).concat([1]));
 const dist=`<div class="pl-dist">${[1,2,3,4,5].map(k=>`<div class="pl-dc"><span class="num">${s.dist[k]}</span><div class="pl-col"><i class="pl-b${k}" style="height:${Math.max(3,s.dist[k]/mx*100)}%"></i></div><small>${k}<br>${LVN[k].split(" ")[0]}</small></div>`).join("")}</div>`;
 const dimB=`<div class="pl-fb">${DIMS.map(d=>`<div class="pl-fr"><span class="small">${d[1]}</span><div class="pl-tk" role="img" aria-label="${d[1]} average ${r1(s.dimAvg[d[0]])} of 5"><i class="pl-b${Math.max(1,Math.round(s.dimAvg[d[0]]))}" style="width:${s.dimAvg[d[0]]*20}%"></i></div><span class="num small">${r1(s.dimAvg[d[0]])}</span><span></span></div>`).join("")}</div>`;
 const gaps=L.filter(P=>P.below).sort((a,b)=>(b.target-b.level)-(a.target-a.level)||a.a.avg-b.a.avg).slice(0,8);
 const heat=heatRows();
 const head=`<tr><th scope="col" class="pl-hn">Process</th>${DIMS.map(d=>`<th scope="col" title="${E(d[2])}">${d[1]}</th>`).join("")}<th scope="col">Level</th></tr>`;
 const body=heat.map(P=>`<tr data-pl-open="${E(P.id)}" tabindex="0"><th scope="row" class="pl-hn"><button type="button" class="pl-link" data-pl-open="${E(P.id)}">${E(P.name)}</button></th>${DK.map(k=>`<td>${dimCell(P.a.dims[k])}</td>`).join("")}<td>${lvPill(P)}</td></tr>`).join("");
 const ow=ownerWork();
 const ownRows=ow.slice(0,10).map(([o,ps])=>`<div class="pl-ow"><div class="row sp"><b>${window.who&&who(o)?pchip(o):E(o)}</b><span class="pill warn">${ps.length} below target</span></div><div class="row">${ps.slice(0,5).map(P=>procBtn(P.id)).join("")}${ps.length>5?`<span class="pill mute">+${ps.length-5}</span>`:""}</div></div>`).join("");
 const mods=matReady()?MAT.ALLM():[];
 const imp=mods.filter(m=>!MAT_BUILT.has(m.id));
 const fams=[...new Set(L.map(P=>P.family))];
 return `<div class="grid g3 pl-three"><div class="card glass"><div class="eyebrow">Distribution by level</div><p class="small muted">Processes at each level of the platform scale.</p>${dist}</div>
  <div class="card glass"><div class="eyebrow">Weakest dimensions</div><p class="small muted">Average score of all processes, 0 to 5. Raise the lowest bar first.</p>${dimB}</div>
  <div class="card glass"><div class="eyebrow">Biggest gaps</div><p class="small muted">Furthest below the Year 1 target.</p><div class="pl-top">${gaps.map(P=>`<button type="button" class="pl-trow" data-pl-open="${E(P.id)}">${lvPill(P)}<span><b>${E(P.name)}</b><small class="muted">needs +${P.target-P.level}, weakest ${DIMS[DK.indexOf(DK.slice().sort((a,b)=>P.a.dims[a]-P.a.dims[b])[0])][1]}</small></span></button>`).join("")}</div></div></div>
  <div class="card glass pl-hcard"><div class="row sp"><div><div class="eyebrow">Heat map, process by dimension</div><p class="small muted">Each cell is the dimension score from 0 to 5. Lowest processes first. Select a row to open it.</p></div>${mpHTML({id:"pl_hfam",label:"Family",all:"All families",opts:fams.map(f=>({v:f,l:famName(f)}))})}</div>
   <div class="tscroll pl-heatw" tabindex="0" aria-label="Heat map of ${heat.length} processes, scrolls"><table class="pl-heat"><thead>${head}</thead><tbody>${body}</tbody></table></div>${lvLegend()}</div>
  <div class="grid g2 pl-two"><div class="card glass"><div class="eyebrow">Owner worklist</div><p class="small muted">Who has processes below their Year 1 target. Open one to see the next criterion to meet.</p>${ownRows||'<p class="small muted">No process is below target.</p>'}</div>
   <div class="card glass pl-own"><div class="eyebrow">Use your own model</div><h3 class="pl-h">Bring your own maturity model</h3><p class="small">Paste a model into <b>Maturity models, Ingest a model</b> (CSV, JSON or Markdown). After the import, open any process and pick the model in <b>Model for this process</b>, or switch a whole family here. The six dimensions stay the same; the result is re-mapped to the levels of the model you chose.</p>
   <div class="row"><button class="btn primary" data-pl-ingest>Open Ingest a model</button>${imp.length?`<span class="pill info">${imp.length} imported model${imp.length===1?"":"s"} ready</span>`:'<span class="pill mute">No imported model yet</span>'}</div>
   <div class="pl-bulk"><label class="small" for="pl-bf">Family</label><select class="fin" id="pl-bf" data-pl-bf>${fams.map(f=>`<option value="${f}">${E(famName(f))}</option>`).join("")}</select><label class="small" for="pl-bm">Model</label><select class="fin" id="pl-bm" data-pl-bm>${mods.map(m=>`<option value="${E(m.id)}">${E(m.n)}</option>`).join("")}</select><button class="btn" data-pl-bulk>Switch family</button></div>
   <p class="small muted">Defaults: ITSM processes use IT service management practices, security uses NIST tiers, cost and finance use TBM, data uses DAMA data management, AI uses AI governance, delivery uses DORA, everything else uses the process capability scale (ISO/IEC 33020 shaped).</p></div></div>
  <div class="card glass pl-meth"><div class="eyebrow">How a process level is worked out</div><p class="small" data-role="story">Six dimensions, each scored 0 to 5 by walking five written criteria in order. The level is the <b>rounded average</b>, <b>capped at the weakest dimension plus one</b>, so a process cannot look mature by being strong in one area. ${fchip("m_pl_avg")} ${fchip("m_pl_below")}</p>
   <div class="tscroll"><table class="pl-crit"><thead><tr><th scope="col">Dimension</th>${[1,2,3,4,5].map(k=>`<th scope="col">Score ${k}</th>`).join("")}</tr></thead><tbody>${DIMS.map(d=>`<tr><th scope="row">${d[1]}<small class="muted">${E(d[2])}</small></th>${d[3].map(t=>`<td class="wrap small">${E(t)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
}
function whereCard(){return `<div class="card glass"><div class="eyebrow">Where to click</div><h3 class="pl-h">Six ways to reach one process</h3>${whereHTML()}</div>`}
function screen(){
 const s=stats();
 const hero_=hero("Process library",`${s.processes} processes, ${s.covered} of ${s.modules} modules covered`,`Every module now has a defined process, <b data-role="metric">${s.processes}</b> in all. Average maturity is <b data-role="metric">${s.avg} of 5</b>, <b data-role="metric">${s.below}</b> are below their Year 1 target, <b data-role="metric">${s.noOwner}</b> have no named owner and <b data-role="metric">${s.noMetric}</b> have no metric. Levels come from observable platform signals across six dimensions, not from opinion; anyone can override a level with evidence.`,
  `<div class="row">${fchip("m_pl_avg")}${fchip("m_pl_below")}${fchip("m_pl_cov")}${stdChip("cmmi")}${stdChip("iso33k")}${stdChip("bpmn")}${window.DRAW&&DRAW.btn?DRAW.btn("","Draw a process"):""}<button class="btn" data-pl-goscreen="plat_map">Master process flow</button></div>`);
 return `<div class="screen pl-screen">${hero_}${lensNote()}${views("pl_v",["Library","Maturity","Where to click"],[libPane(),matPane(),whereCard()])}${procCard("plat_proc")}</div>`;
}
PROC.reg("plat_proc",{title:"How a process gets into the library and gets a level",std:["cmmi","iso33k","bpmn"],steps:[
 {n:"Define the process",d:"Steps, who acts, inputs and outputs are written on the module's screen or in the Workflow designer.",who:"human",owner:"Process owner",sla:"Ad hoc",in:"How the work is done",out:"Documented steps"},
 {n:"Index and tie to a module",d:"The library finds it, ties it to a module on the map and registers it as a capability in Maturity models.",who:"auto",owner:"Process library",sla:"Instant",in:"Process definition",out:"Library entry"},
 {n:"Assess from signals",d:"The Maturity Agent scores six dimensions from steps, owners, metrics, flows, automation and gates.",who:"agent",owner:"Maturity Agent",sla:"Every change",in:"Platform records",out:"Level with evidence"},
 {n:"Review or override",d:"A named reviewer can override a level with written evidence and a date.",who:"gate",owner:"Process governance lead",sla:"Quarterly",in:"Evidence",out:"Confirmed level"},
 {n:"Close the gap",d:"The next criterion becomes a gap action and, if funded, a project in Maturity models.",who:"human",owner:"Process owner",sla:"Per project",in:"Gap action",out:"Higher level"}]});
REG("plat_proc","Process library","platform",ICON,screen);
/* ---------- public API ---------- */
function summary(P){return{id:P.id,name:P.name,module:P.module,family:P.family,familyName:famName(P.family),owner:P.oi.owner||P.oi.role,backup:P.oi.backup||null,named:P.hasOwner,level:P.level,target:P.target,model:P.model,below:P.below,steps:P.steps.length,metrics:P.mets.slice(),mix:P.mix,source:P.src,dims:Object.assign({},P.a.dims)}}
function maturityOf(id){
 const P=gof(id);if(!P)return null;
 const gaps=DK.filter(k=>P.a.next[k]).sort((a,b)=>P.a.dims[a]-P.a.dims[b]).map(k=>DIMS[DK.indexOf(k)][1]+": "+P.a.next[k]);
 return{model:P.model,level:P.level,target:P.target,dims:Object.assign({},P.a.dims),gaps,basis:P.override?"override":"computed",max:P.max};
}
function addProcess(def){
 def=def||{};const w=[];const name=String(def.name||"").trim();
 if(!name)return{ok:false,id:null,warnings:["A process needs a name."]};
 const id=def.id||slug(name);
 if(!id)return{ok:false,id:null,warnings:["The name could not be turned into an id."]};
 if(PROC.defs[id]||PL.custom.some(c=>c.id===id)||(IDX&&IDX.by[id]))return{ok:false,id,warnings:["A process with the id "+id+" already exists. Pick another name or id."]};
 let module=def.module;if(!modOf(module)){w.push(module?"Module "+module+" is not on the Master process flow. The process was tied to the Platform registry; move it to the right module.":"No module was named. The process was tied to the Platform registry; move it to the right module.");module="plat_reg"}
 const steps=(def.steps||[]).map(s=>({n:s.n||"Step",d:s.d||"",who:/^(human|agent|auto|gate)$/.test(s.who)?s.who:"human",owner:s.owner||"",sla:s.sla||"",in:s.in||"",out:s.out||""}));
 if(!steps.length)w.push("No steps. Maturity will stay at the bottom until steps are written.");
 else if(steps.some(s=>!s.in||!s.out))w.push(steps.filter(s=>!s.in||!s.out).length+" of "+steps.length+" steps have no inputs or outputs. The Defined dimension is capped by this.");
 if(!def.owner)w.push("No owner. Name an accountable person and a backup so the Owned dimension can rise.");
 else if(!(window.who&&who(def.owner)))w.push("The owner is a role, not a named person. Owned stays at 1 until a person is named.");
 if(!def.trigger)w.push("No trigger. Say what starts this process.");
 const mets=(def.metrics||[]).filter(k=>METRICS[k]);
 if((def.metrics||[]).length!==mets.length)w.push("Some metric ids do not exist and were ignored.");
 if(!mets.length)w.push("No metric. Link one with a formula, target and remediation so it can be measured.");
 const ents=def.entities||[];const unk=ents.filter(e=>!entKnown(e));
 if(unk.length)w.push("Unknown entit"+(unk.length>1?"ies":"y")+": "+unk.join(", ")+". Register "+(unk.length>1?"them":"it")+" in the data model.");
 if(!ents.length)w.push("No entities named. Say which records it reads and writes.");
 const rec={id,name,module,family:def.family||(modOf(module)&&(modOf(module).band==="plt"?"gov":null))||"wf",owner:def.owner||"",trigger:def.trigger||"",steps,inputs:def.inputs||[],outputs:def.outputs||[],entities:ents,metrics:mets,model:def.model||"",std:def.std||[]};
 PL.custom.push(rec);
 PROC.reg(id,{title:name,std:rec.std.slice(),steps:steps.map(s=>Object.assign({},s))});
 bump();
 audit("Process library: added process",name+" ("+w.length+" warning"+(w.length===1?"":"s")+")");
 return{ok:true,id,warnings:w};
}
/* Round 13: the Process drawing studio writes steps back here (guarded caller: DRAW). Keeps PROC.defs, S.proc and any added-process record in step. */
function setSteps(id,steps,meta){
 meta=meta||{};if(!id||!Array.isArray(steps))return false;
 const cp=steps.map(s=>Object.assign({},s));
 if(!PROC.defs[id])PROC.reg(id,{title:meta.name||id,std:["bpmn"],steps:cp.map(s=>Object.assign({},s))});
 S.proc=S.proc||{};S.proc[id]=cp;
 const cu=PL.custom.find(c=>c.id===id);if(cu){cu.steps=cp.map(s=>({n:s.n,d:s.d||"",who:s.who||"human",owner:s.owner||"",sla:s.sla||"",in:s.in||"",out:s.out||""}));if(meta.name)cu.name=meta.name}
 bump();idx();audit("Process library: steps updated from the drawing studio",(meta.name||id)+" ("+cp.length+" steps)");
 return true;
}
const moduleMaturity=mid=>{const ps=idx().list.filter(P=>P.module===mid);if(!ps.length)return null;const a=avg(ps.map(P=>P.level/P.max*5));return{n:ps.length,avg:r1(a),level:Math.max(1,Math.min(5,Math.round(a))),min:Math.min.apply(null,ps.map(P=>P.level/P.max*5)),below:ps.filter(P=>P.below).length,ids:ps.map(P=>P.id)}};
function findProc(q){
 const stop=new Set("the and for show open view display give tell about what whats how mature maturity level process processes procedure library please can you our please me of is are does".split(" "));
 const toks=String(q).toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>2&&!stop.has(w)).map(w=>w.replace(/(ies)$/,"y").replace(/s$/,""));
 if(!toks.length)return null;let best=null,bs=0;
 idx().list.forEach(P=>{
  const nm=P.name.toLowerCase().replace(/[^a-z0-9 ]/g," "),md=modOf(P.module),al=((md&&md.al)||[]).join(" "),idw=P.id.replace(/_/g," ");
  let sc=0;toks.forEach(t=>{const tt=t.replace(/s$/,"");if(nm.split(/\s+/).some(w=>w.replace(/s$/,"").replace(/ies$/,"y")===tt||w.startsWith(tt)&&tt.length>3))sc+=3;else if(nm.includes(tt))sc+=2;else if(idw.includes(tt))sc+=1.5;else if(al.includes(tt))sc+=1});
  if(P.id===md?.id)sc+=.5;if(sc>bs){bs=sc;best=P}
 });
 return bs>=2?best:null;
}
/* ---------- forms ---------- */
function ownerForm(id){
 const P=gof(id);if(!P)return;
 openForm({id:"pl_own",title:"Assign owner and backup",story:`Names who is accountable for ${P.name} and who steps in. Owned rises to 2 with a named owner and to 4 with a named backup (and 3 once two responsible roles are on the steps). The change is audited and the level is recomputed at once.`,submit:"Save owner and backup",
  fields:[{k:"owner",label:"Accountable owner",type:"people",req:true,help:"One named person. A team or role does not count."},{k:"backup",label:"Backup",type:"people",req:true,help:"Someone who can run the process when the owner is away."}],defaults:{owner:P.oi.owner||"",backup:P.oi.backup||""},
  onSubmit:v=>{if(v.owner===v.backup)return{toast:"The backup must be a different person",close:false};PL.own[id]={owner:v.owner,backup:v.backup};bump();audit("Process library: assigned owner",P.name+": "+v.owner+", backup "+v.backup);toast("Owner and backup saved","good");render();openProc(id)}});
}
function ovrForm(id){
 const P=gof(id);if(!P||!matReady())return;const m=MAT.ALLM().find(x=>x.id===P.model);const ov=P.override;
 openForm({id:"pl_ovr",title:"Override the maturity level",story:`The computed level is ${toModel(P.a.level,P.model)} on the ${modelName(P.model)} scale. An override replaces it with a level you can defend, and records the evidence, the reviewer and the date. Overrides are kept in the assessment history and can be removed.`,submit:"Save override",
  fields:[{k:"level",label:"Level",type:"chips",req:true,opts:m.lv.map((l,i)=>[String(i+1),(i+1)+" "+l[0]])},{k:"evidence",label:"Evidence",type:"longtext",req:true,help:"What you saw: an audit, a review, a measured result. At least 20 characters.",ph:"For example: Q3 internal audit sampled 25 incidents and found every step followed"},{k:"reviewer",label:"Reviewer",type:"people",req:true},{k:"date",label:"Review date",type:"date",req:true}],
  defaults:{level:String(ov?ov.level:P.level),evidence:ov?ov.evidence:"",reviewer:ov?ov.reviewer:"",date:ov?ov.date:todayIso()},
  live:v=>`<p class="small muted">${v.level&&+v.level!==toModel(P.a.level,P.model)?`This moves the level ${+v.level>toModel(P.a.level,P.model)?"up":"down"} from the computed ${toModel(P.a.level,P.model)} to ${+v.level}.`:"Same as the computed level."} The Year 1 target is ${P.target}.</p>`,
  onSubmit:v=>{if(String(v.evidence||"").trim().length<20)return{toast:"Write at least 20 characters of evidence",close:false};PL.ovr[id]={level:+v.level,model:P.model,evidence:v.evidence.trim(),reviewer:v.reviewer,date:v.date};bump();audit("Process library: overrode maturity",P.name+" to level "+v.level+" by "+v.reviewer);toast("Override saved with evidence","good");render();openProc(id)}});
}
function revForm(id){
 const P=gof(id);if(!P)return;
 openForm({id:"pl_rev",title:"Record a review",story:`Records that the owner and backup reviewed ${P.name}. A review inside the last 12 months is the top criterion of Defined, Owned and Governed.`,submit:"Record review",
  fields:[{k:"date",label:"Review date",type:"date",req:true},{k:"by",label:"Reviewed by",type:"people",req:true},{k:"note",label:"What was checked",type:"longtext",ph:"Steps, owners, metrics and gates confirmed against current practice"}],defaults:{date:todayIso(),by:P.oi.owner||"",note:""},
  onSubmit:v=>{PL.rev[id]={date:v.date,by:v.by,note:v.note||""};bump();audit("Process library: recorded review",P.name+" by "+v.by);toast("Review recorded","good");render();openProc(id)}});
}
function parseSteps(txt){
 const map={person:"human",human:"human",people:"human",agent:"agent","ai agent":"agent",ai:"agent",auto:"auto",automatic:"auto",gate:"gate",approval:"gate","approval gate":"gate"};
 return String(txt||"").split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const m=l.match(/^([A-Za-z ]{2,14}):\s*(.+)$/);const w=m&&map[m[1].toLowerCase().trim()];return w?{n:m[2].trim(),who:w}:{n:l,who:"human"}});
}
function addForm(){
 const mods=modsAll();
 openForm({id:"pl_add",title:"Add a process",story:"Adds a process to the library, registers it as a capability in Maturity models and in the process registry, and tells you what is missing. A new process starts honestly low; each warning is the next thing to fill in.",submit:"Add process",
  fields:[{section:"What it is"},{k:"name",label:"Process name",type:"text",req:true,ph:"Vendor onboarding"},{k:"module",label:"Module it belongs to",type:"select",req:true,opts:mods.map(m=>[m.id,m.name])},{k:"family",label:"Family",type:"select",opts:(window.LINKS?LINKS.families:[]).map(f=>[f.id,f.name])},{k:"trigger",label:"Trigger",type:"text",ph:"A vendor is approved by procurement"},{k:"owner",label:"Accountable owner",type:"people"},
   {section:"How it works"},{k:"steps",label:"Steps, one per line",type:"longtext",wide:true,help:"Start a line with person:, agent:, auto: or gate: to say who acts. Default is a person.",ph:"person: Collect the vendor form\nagent: Check the form against the policy\ngate: Procurement approves\nauto: Create the vendor record"},
   {k:"entities",label:"Entities it touches",type:"multi",opts:(window.PLAT&&PLAT.entities?PLAT.entities():[]).map(e=>[e.id,e.label])},{k:"metrics",label:"Metrics",type:"multi",opts:Object.keys(METRICS).slice(0,260).map(k=>[k,METRICS[k].n])},{k:"model",label:"Maturity model",type:"select",opts:[["","Default for the family"]].concat(matReady()?MAT.ALLM().map(m=>[m.id,m.n]):[])}],
  defaults:{family:"wf",module:"plat_reg"},
  live:v=>{const w=[];if(!v.owner)w.push("no owner");if(!v.trigger)w.push("no trigger");if(!(v.metrics||[]).length)w.push("no metric");if(!String(v.steps||"").trim())w.push("no steps");return `<p class="small muted">${w.length?"Will start with: "+w.join(", ")+".":"Looks complete. The assessment will still score it from signals."}</p>`},
  onSubmit:v=>{const r=addProcess({name:v.name,module:v.module,family:v.family,trigger:v.trigger,owner:v.owner,steps:parseSteps(v.steps),entities:v.entities||[],metrics:v.metrics||[],model:v.model||""});
   if(!r.ok)return{toast:r.warnings[0],close:false};toast("Added. "+(r.warnings.length?plural(r.warnings.length,"thing is","things are")+" missing.":"Nothing missing."),r.warnings.length?"warn":"good");render();openProc(r.id)}});
}
/* ---------- events ---------- */
function openLib(tab){S.v.pl_v=tab||0;if(S.screen==="plat_proc")render();else go("plat_proc")}
document.addEventListener("click",e=>{
 let t;
 if((t=e.target.closest("[data-pl-open]"))){e.preventDefault();openProc(t.dataset.plOpen);return}
 if((t=e.target.closest("[data-pl-goscreen]"))){const id=t.dataset.plGoscreen;if(t.hasAttribute("data-pl-tab6"))S.v.mm_v=5;if(window.closeDrawer)closeDrawer();go(id);return}
 if((t=e.target.closest("[data-pl-lib]"))){if(window.closeDrawer)closeDrawer();openLib(+t.dataset.plLib);return}
 if(e.target.closest("[data-pl-add]")){addForm();return}
 if((t=e.target.closest("[data-pl-owner]"))){ownerForm(t.dataset.plOwner);return}
 if((t=e.target.closest("[data-pl-ovrclr]"))){const id=t.dataset.plOvrclr;delete PL.ovr[id];bump();audit("Process library: removed override",id);toast("Override removed. The computed level applies.","good");render();openProc(id);return}
 if((t=e.target.closest("[data-pl-ovr]"))){ovrForm(t.dataset.plOvr);return}
 if((t=e.target.closest("[data-pl-rev]"))){revForm(t.dataset.plRev);return}
 if((t=e.target.closest("[data-pl-ent]"))){const id=t.dataset.plEnt;if(window.closeDrawer)closeDrawer();if(window.ATLAS&&ATLAS.focus)ATLAS.focus(id);else go("plat_data");return}
 if((t=e.target.closest("[data-pl-map]"))){if(window.closeDrawer)closeDrawer();if(window.MODMAP&&MODMAP.select)MODMAP.select(t.dataset.plMap,"proc");else go("plat_map");return}
 if((t=e.target.closest("[data-pl-cap]"))){const P=gof(t.dataset.plCap);if(P&&P.cap&&window.MAT&&MAT.openCap)MAT.openCap(P.cap.id);else toast("Open Maturity models to see this capability","warn");return}
 if(e.target.closest("[data-pl-ingest]")){if(window.MAT){MAT.tab(5);MAT.go()}return}
 if(e.target.closest("[data-pl-bulk]")){const f=document.querySelector("[data-pl-bf]").value,m=document.querySelector("[data-pl-bm]").value;let k=0;idx().list.forEach(P=>{if(P.family===f){PL.model[P.id]=m;k++}});bump();audit("Process library: switched family model",famName(f)+" to "+modelName(m)+" ("+k+" processes)");toast(k+" processes now use "+modelName(m),"good");render();return}
 if((t=e.target.closest("[data-pl-page] [data-proc-step]"))){const pid=t.closest("[data-pl-page]").dataset.plPage;setTimeout(()=>{const d=document.getElementById("drawer");if(!d||d.querySelector("[data-pl-back]"))return;const h=d.querySelector("h2");if(h)h.insertAdjacentHTML("beforebegin",`<button type="button" class="btn" data-pl-open="${E(pid)}" data-pl-back>Back to the process page</button>`)},30);return}
});
document.addEventListener("change",e=>{
 const t=e.target.closest("[data-pl-model]");if(!t)return;const id=t.dataset.plModel,P=gof(id);if(!P)return;
 PL.model[id]=t.value;bump();audit("Process library: changed maturity model",P.name+" to "+modelName(t.value));toast(P.name+" is now measured on "+modelName(t.value),"good");if(S.screen==="plat_proc")render();openProc(id);
});
document.addEventListener("keydown",e=>{if(e.key!=="Enter")return;const t=e.target.closest&&e.target.closest("tr[data-pl-open]");if(t&&e.target===t)openProc(t.dataset.plOpen)});
/* ---------- search and chat ---------- */
SEARCHX.push(()=>{if(!modsAll().length)return[];return idx().list.map(P=>({g:"Processes",t:P.name,m:"Level "+P.level+" of "+P.max+" · "+famName(P.family),c:"--p4",f:()=>openProc(P.id),k:P.id+" "+P.title+" "+famName(P.family)+" process maturity "+(modOf(P.module)?modOf(P.module).name:"")}))});
ASKX.push(q=>{
 const t=q.toLowerCase();
 if(!window.PROC||!window.MODMAP)return false;
 if(/process library/.test(t)&&/(open|show|go to|take me|view)/.test(t)||/^(show|list) (me )?(all )?(the )?processes$/.test(t.trim())){const s=stats();openLib(0);say(q,{t:`The process library lists ${s.processes} processes across ${s.covered} of ${s.modules} modules. Average maturity is ${s.avg} of 5 and ${s.below} are below their Year 1 target.`,steps:["Opened the Process library"]});return true}
 if(/(which|what|list|show).*(processes|process).*(below|under|short of|miss).*target|below target.*process/.test(t)){const L=idx().list.filter(P=>P.below).sort((a,b)=>(b.target-b.level)-(a.target-a.level));openLib(1);say(q,{t:`${L.length} of ${idx().list.length} processes are below their Year 1 target. Furthest behind: ${L.slice(0,5).map(P=>P.name+" (level "+P.level+", target "+P.target+")").join("; ")}.`,steps:["Opened the Maturity tab of the Process library"]});return true}
 if(/process(es)?.*(no|without|missing).*(named )?owner|(no|without).*owner.*process/.test(t)){const L=idx().list.filter(P=>!P.hasOwner);openLib(1);say(q,{t:`${L.length} processes have no named owner: ${L.slice(0,8).map(P=>P.name).join(", ")}${L.length>8?" and "+(L.length-8)+" more":""}. Open one to assign an owner and backup.`,steps:["Opened the Process library"]});return true}
 if(/process(es)?.*(no|without|missing).*metric|(no|without).*metric.*process/.test(t)){const L=idx().list.filter(P=>!P.hasMetric);openLib(0);say(q,{t:`${L.length} processes have no metric: ${L.slice(0,8).map(P=>P.name).join(", ")}${L.length>8?" and "+(L.length-8)+" more":""}.`,steps:["Opened the Process library"]});return true}
 let m;
 if((m=t.match(/(?:maturity|how mature)(?: level)?(?: of| for| is)?\s+(?:the\s+)?(.+?)\s*(?:process)?\??$/))){const P=findProc(m[1]);if(P){openProc(P.id);const mt=maturityOf(P.id);say(q,{t:`${P.name} is at level ${P.level} of ${P.max} (${levelName(P.model,P.level)}) on the ${modelName(P.model)} scale. The Year 1 target is ${P.target}. Weakest dimension: ${DIMS[DK.indexOf(DK.slice().sort((a,b)=>P.a.dims[a]-P.a.dims[b])[0])][1]}. ${mt.gaps[0]?"Next step: "+mt.gaps[0]+".":""}`,steps:["Found the process","Opened its full page"]});return true}}
 if((m=t.match(/(?:show|open|view|display|find|go to)(?: me)?(?: the)?\s+(.+?)\s+process(?:es)?\b/))||(m=t.match(/process(?:es)? (?:for|of)\s+(.+)$/))){const P=findProc(m[1]);if(P){openProc(P.id);say(q,{t:`${P.name}: ${P.steps.length} steps, level ${P.level} of ${P.max}, owner ${P.oi.owner||P.oi.role}. The full page shows the steps, who acts, data in and out, metrics, controls and neighbors.`,steps:["Found the process","Opened its full page"]});return true}}
 return false;
});
window.PROCLIB={
 open:openProc,openLibrary:openLib,pane:libPane,
 list(){return idx().list.map(summary)},
 get(id){const P=gof(id)||primaryOf(id);if(!P)return null;return Object.assign(summary(P),{title:P.title,stepsList:P.steps.map(s=>Object.assign({},s)),entities:{r:P.ent.r.slice(),w:P.ent.w.slice()},trigger:trigOf(P),override:P.override?Object.assign({},P.override):null,history:(PL.hist[P.id]||[]).map(h=>Object.assign({},h)),capability:P.cap?P.cap.id:null,assessment:{avg:r1(P.a.avg),raw:P.a.raw,weakest:P.a.weak,capped:P.a.capped,evidence:Object.assign({},P.a.ev)}})},
 addProcess,setSteps,maturity:maturityOf,stats(){const s=stats();return{processes:s.processes,modules:s.modules,modulesCovered:s.covered,avgMaturity:s.avg,belowTarget:s.below,noOwner:s.noOwner,noMetric:s.noMetric,noBackup:s.noBackup,byLevel:s.byLevel,dimensionAverage:s.dimAvg}},
 moduleMaturity,forModule:mid=>idx().list.filter(P=>P.module===mid).map(summary),primary:mid=>{const P=primaryOf(mid);return P?P.id:null},find:q=>{const P=findProc(q);return P?P.id:null},
 refresh(){bump();return true},dims:DIMS.map(d=>({id:d[0],name:d[1],what:d[2],criteria:d[3].slice()}))
};
setTimeout(()=>{try{idx();if(window.MODMAP&&MODMAP.refresh)MODMAP.refresh()}catch(e){console.error("proclib init",e)}},0);
})();
