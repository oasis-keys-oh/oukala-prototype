/* ===== mod_mat: maturity models, capabilities, glide paths, project credit, what-if (prefix mat-) ===== */
(function(){
"use strict";
const M=S.mat=S.mat||{tab:0,sel:"asd",obj:"O1",cap:"ASD.1",wi:{node:"ASD",lvl:4,hz:1,crule:0,prule:0},slip:{proj:"PR1",wk:2},acc:{},tg:{},as:{},extra:[],xmodels:[],xcaps:[],act:[],unit:{rate:17500,tool:9000,train:4500,cloud:3000},ing:{fmt:"auto",txt:"",res:null,map:{}},bld:{name:"",src:"Authored by Atlantic",levels:[["Level 1","Describe the starting point"],["Level 2",""],["Level 3",""]],caps:[]},reg:null};
const H=esc,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
const SVID=k=>"svc_"+k;
const OBJN={O1:"Modernize standards publishing",O2:"Reduce operating risk",O3:"Contract discipline",O4:"Trusted AI",O5:"Editor experience"};
const objs=()=>(window.EXE&&EXE.E&&EXE.E.objs&&EXE.E.objs.length?EXE.E.objs:[{id:"O1",n:OBJN.O1,sub:"Modernize standards",owner:"CEO office",c:"--p4"},{id:"O2",n:OBJN.O2,sub:"Resilient operations",owner:"CFO",c:"--e4"},{id:"O3",n:OBJN.O3,sub:"Contract discipline",owner:"CFO",c:"--w1"},{id:"O4",n:OBJN.O4,sub:"Trusted AI",owner:"CIO",c:"--u3"},{id:"O5",n:OBJN.O5,sub:"Editor experience",owner:"COO",c:"--s3"}]);
const objOf=id=>objs().find(o=>o.id===id)||{id,n:id,sub:id,c:"--faint",owner:""};
/* work-day calendar extended past the shared calendar so 3 and 5 year horizons exist */
const LASTWD=WD.length-1,LASTT=WD[LASTWD];
const wdx=iso=>{const t=Date.parse(iso+"T00:00:00Z");return t<=LASTT?wdOf(iso):LASTWD+Math.round((t-LASTT)/864e5*5/7)};
const dx=w=>w<=LASTWD?dateOf(w):new Date(LASTT+Math.round((w-LASTWD)*7/5)*864e5);
const fx=(w,y)=>dx(w).toLocaleDateString("en-US",{month:"short",day:"numeric",...(y?{year:"numeric"}:{}),timeZone:"UTC"});
const HZ=[["Year 1","2027-06-30","end of FY27"],["Year 3","2029-06-30","end of FY29"],["Year 5","2031-06-30","end of FY31"]];
const HW=HZ.map(h=>wdx(h[1]));
const W0=0;
/* standards badges used here */
Object.assign(STD,{iso33k:{n:"ISO/IEC 33020",by:"ISO/IEC",d:"Process assessment scale: incomplete, performed, managed, established, predictable, innovating (levels 0 to 5). COBIT 2019 capability levels use the same shape."},p3m3:{n:"P3M3",by:"Axelos",d:"Portfolio, programme and project management maturity model: awareness, repeatable, defined, managed, optimized."},gai:{n:"AI maturity model",by:"Gartner, MITRE and Microsoft (blended)",d:"Five stages from awareness to transformational. Atlantic's copy keeps the five Gartner stage names and adds governance criteria from the MITRE and Microsoft AI maturity models."},dmm:{n:"DAMA DMM",by:"DAMA International",d:"Data Management Maturity: levels 1 to 5 across the DMBOK knowledge areas."}});
/* ---------------- models ---------------- */
const MODELS=[
 {id:"asd",n:"Autonomous service delivery",src:"Oukala (own)",std:"itil5",own:"Jordan Lee",ver:"1.2",ob:[2,4],desc:"How much of resolving, changing and fulfilling service work is done by agents instead of people, and under what controls. Atlantic wrote this model for its own platform.",lv:[["Manual","People do the work from memory. Tools only record it."],["Assisted","Agents suggest and draft. A person decides and does every step."],["Partially automated","Routine steps run by rule with no person. Everything else is manual or assisted."],["Agentic with approval","Agents plan and execute whole tasks. A named person approves each action before it runs."],["Autonomous within guardrails","Agents act alone inside written limits (cost, scope, data). Humans review samples and exceptions. Overrides are tracked."]]},
 {id:"pdt",n:"Project and delivery traceability",src:"Oukala (own)",std:"pmbok",own:"Maya Ortiz",ver:"1.0",ob:[1,3],desc:"How completely every dollar and day can be traced from a strategic objective to a requirement, a task, a milestone, an acceptance and an invoice.",lv:[["Ad hoc","Projects and spend sit in spreadsheets. Links between them are remembered, not recorded."],["Recorded","Each project has a budget line and a named owner. Objectives are named but not linked."],["Linked","Objective, requirement, task and invoice are linked by identifier in one system."],["Verified","Acceptance evidence gates payment. Earned value is computed from task progress, not reported."],["Continuous","The chain is live and audited by agents. Any break (unlinked spend, unaccepted payment) is flagged within a day."]]},
 {id:"cmmi",n:"Process capability (CMMI style)",src:"Ingested standard",std:"cmmi",own:"Priya Shah",ver:"V3.0 aligned, ISO/IEC 33020 scale",ob:[1,3],desc:"CMMI maturity and ISO/IEC 33020 capability scale applied to the core delivery process areas. COBIT 2019 capability levels follow the same shape.",lv:[["Initial","Work is done but unpredictably. Success depends on individuals."],["Managed","Work is planned, performed and tracked at project level."],["Defined","Organization-wide standard processes are tailored for each project."],["Quantitatively managed","Process performance is measured and controlled with statistical or quantitative techniques."],["Optimizing","The organization continually improves processes from measured results and innovation."]]},
 {id:"itil",n:"IT service management practices",src:"Ingested standard",std:"itil5",own:"Tom Becker",ver:"ITIL 5 aware (ITIL 4 practices mapped)",ob:[2,5],desc:"Practice maturity for ITIL. ITIL 5 shifts the unit of management from the practice to the digital product and service lifecycle and adds AI-enabled service management, so two ITIL 5 capabilities sit alongside the classic practices.",lv:[["Initial","The practice is informal and reactive."],["Repeatable","Basic procedure exists and is mostly followed by one team."],["Defined","Documented, owned and measured across the organization."],["Managed","Targets are set, reported and acted upon. Practice is integrated with others."],["Optimizing","Continual improvement and automation are built into the practice."]]},
 {id:"tbm",n:"Technology business management",src:"Ingested standard",std:"tbm",own:"Avery Chen",ver:"TBM Taxonomy 5 aligned",ob:[2,3],desc:"How well technology cost is traced from the ledger to towers, solutions and consumers so spend can be explained and planned.",lv:[["Foundation","Cost data is in the ledger only, by account."],["Towers","Cost is allocated to resource towers (compute, storage, labor)."],["Solutions","Cost is allocated to applications and services and their unit costs."],["Consumers","Business units see showback or chargeback by what they consume."],["Optimization","Benchmarking and value measures drive investment and sourcing choices."]]},
 {id:"dmm",n:"Data management",src:"Ingested standard",std:"dmm",own:"Dev Rao",ver:"DAMA-DMBOK 2 knowledge areas",ob:[1,2],desc:"DAMA data management maturity across the DMBOK knowledge areas that matter to a standards publisher.",lv:[["Initial","Data is handled ad hoc by individual teams."],["Managed","Data is managed within projects with local procedures."],["Defined","Enterprise policies, roles and standards exist and are followed."],["Measured","Data quality and process measures are tracked against targets."],["Optimized","Data management is automated and continuously improved."]]},
 {id:"nist",n:"Cybersecurity (NIST CSF 2.0 tiers)",src:"Ingested standard",std:"nist",own:"Rina Okafor",ver:"CSF 2.0 tiers",ob:[2],desc:"NIST CSF implementation tiers applied to the six functions. Four tiers, not five, so Atlantic's scale rule treats the top tier as level 4 of 4.",lv:[["Partial","Risk management is ad hoc and not shared across the organization."],["Risk informed","Practices are approved by management but not organization-wide policy."],["Repeatable","Practices are formally approved, expressed as policy and updated regularly."],["Adaptive","Practices adapt to changing threats using lessons learned and predictive indicators."]]},
 {id:"gai",n:"AI governance",src:"Ingested standard",std:"gai",own:"Jordan Lee",ver:"Gartner stages with MITRE and Microsoft criteria",ob:[4],desc:"How safely and visibly Atlantic runs AI agents and models: inventory, guardrails, evaluation, oversight, provenance and spend.",lv:[["Awareness","Leaders discuss AI. No inventory or policy."],["Active","Pilots run under local rules. Some policy exists."],["Operational","AI is in production with a registry, guardrails and named owners."],["Systemic","Governance is enterprise-wide, measured and audited. Overrides and drift are tracked."],["Transformational","AI governance is automated and trusted enough that agents act within policy without case-by-case approval."]]},
 {id:"dora",n:"Software delivery (DORA)",src:"Ingested standard",std:"devops",own:"Sam Patel",ver:"DORA performance clusters",ob:[1,5],desc:"DORA delivery performance clusters across the four key metrics plus rework and the technical capabilities behind them.",lv:[["Low","Releases are rare, manual and painful."],["Medium","Regular releases with some automation."],["High","Frequent, mostly automated releases with fast recovery."],["Elite","On-demand releases, low change failure, recovery within an hour."]]},
 {id:"p3m3",n:"Portfolio management (P3M3)",src:"Ingested standard",std:"p3m3",own:"Maya Ortiz",ver:"P3M3 v3 portfolio perspective",ob:[1,3],desc:"P3M3 portfolio perspective: how consistently Atlantic chooses, funds, runs and benefits from its project portfolio.",lv:[["Awareness","Portfolio is a list. No common process."],["Repeatable","Basic portfolio process exists but is applied unevenly."],["Defined","Central portfolio process applied across the organization."],["Managed","Portfolio performance is measured and used in decisions."],["Optimized","Portfolio continually improves from measured outcomes."]]}];
const MODEL0=MODELS.map(m=>m.id);
/* row format: name|current|y1|y3|y5|confidence|owner|objectives|services|prerequisites|credits|metrics|skills ; indent with two spaces for a sub capability.
   credits: PROJECT:milestone:from>to:lag work days:confidence joined with ; (milestone = task id, or the project id for a demand request) */
const ROWS={
asd:`Incident triage and routing|2|3|4|5|.8|Tom Becker|2,5|desk,portal|ASD.7:0;ITIL.1:1|PR3:p3_5:2>3:40:.8|m_mttr|itsm,ai
  Automatic classification and routing|3|4|5|5|.85|Tom Becker|5|desk||PR3:p3_3:3>4:60:.7|m_mttr|itsm,ai
  Priority and impact prediction|2|3|4|5|.7|Tom Becker|2|desk,portal|ASD.3:1||m_avail|ai
Incident resolution by agents|2|3|4|5|.75|Tom Becker|2|portal,cod,search|ASD.1:1;ASD.7:0|PR3:p3_4:2>3:30:.7;D7:D7:3>4:60:.55|m_avail|ops,ai
Change risk assessment and approval|2|3|4|5|.7|Nia Brooks|2|cod,portal|ASD.5:1;ASD.7:0;ITIL.2:1||m_delivery|itsm,ai
Request fulfillment|2|3|4|5|.7|Sam Patel|5|desk,m365,id|ASD.8:1;ITIL.4:1||m_cycle|itsm,ai
Event correlation and problem detection|2|3|4|5|.65|Sam Patel|2|net,cod,portal,search||PR3:p3_2:2>3:60:.6|m_avail|ops,ai
Knowledge capture and reuse|3|4|4|5|.8|Jordan Lee|5,4|desk|ITIL.5:0|D6:D6:3>4:10:.5|m_kb|itsm
Guardrails and human oversight for agents|2|4|5|5|.75|Jordan Lee|4,2|desk,cod,portal|GAI.2:0;GAI.4:0|D6:D6:2>3:10:.6|m_override|ai,sec
Access and identity provisioning|3|3|4|5|.8|Rina Okafor|2|id|||m_auto|sec`,
pdt:`Objective to project link|3|4|5|5|.9|Maya Ortiz|1,2,3,4,5||||m_align|pm
Requirement to task link|2|3|4|5|.75|Priya Shah|1|cod|PDT.1:0|PR1:p1_4:2>3:60:.8||pm
Task to milestone and acceptance|3|4|4|5|.8|Priya Shah|1,3|cod,cr|PDT.2:1|PR4:p4_4:3>4:90:.7|m_ontime|pm
Invoice to milestone matching|3|4|5|5|.8|Avery Chen|3|fin,cr|PDT.3:0|PR2:p2_4:3>4:120:.65|m_cycle|fin
Earned value from task progress|3|4|4|5|.8|Dev Rao|1|cod|PDT.3:0|PR1:p1_8:3>4:135:.8|m_spi|pm,data
Benefit realization tracking|1|2|3|4|.6|Maya Ortiz|1,3||PDT.1:0||m_align|pm,fin
Service to project impact (CMDB link)|2|3|4|5|.7|Sam Patel|2|cod,portal,data||D8:D8:2>3:30:.5||arch,ops
Contract obligation to work and cost|2|3|4|5|.7|Avery Chen|3|cr,erp|PDT.4:1|PR4:p4_5:2>3:70:.7||fin`,
cmmi:`Requirements management|2|3|4|4|.75|Priya Shah|1|cod||PR1:p1_4:2>3:50:.7||pm
Project planning and monitoring|3|3|4|5|.8|Priya Shah|1,3|cod,cr|||m_spi|pm
Risk management|3|4|4|5|.8|Maya Ortiz|2||||m_riskexp|pm
Configuration management|2|3|4|4|.7|Sam Patel|2|cod,end||PR3:p3_2:2>3:70:.55||ops
Measurement and analysis|2|3|4|5|.7|Dev Rao|1|data|CMMI.1:0|D10:D10:2>3:40:.5|m_conf|data
Supplier agreement management|2|3|4|4|.75|Maya Ortiz|3|cr||PR4:p4_1:2>3:60:.7|m_ontime|pm,fin
Process and product quality assurance|2|3|3|4|.7|Priya Shah|1,5|cod|||m_delivery|pm`,
itil:`Incident management|3|4|4|5|.85|Tom Becker|2|desk,portal||PR3:p3_5:3>4:60:.75|m_mttr|itsm
Change enablement|3|3|4|5|.8|Nia Brooks|2|cod,portal|||m_delivery|itsm
Service level management|2|3|4|5|.7|Tom Becker|2,5|desk,portal||PR3:p3_5:2>3:80:.6|m_avail|itsm
Service catalog and request management|3|3|4|4|.75|Sam Patel|5|desk,m365||||itsm
Knowledge management|3|4|4|5|.8|Jordan Lee|5|desk|||m_kb|itsm
Problem management|2|3|4|4|.7|Tom Becker|2|portal||PR3:p3_1:2>3:80:.7|m_mttr|itsm
Continual improvement|2|3|4|5|.65|Nia Brooks|2,5|||||itsm
Monitoring and event management|2|3|4|5|.7|Sam Patel|2|net,portal,cod|||m_avail|ops
Supplier management|2|3|3|4|.7|Maya Ortiz|3,2|cr|||m_waste|pm,fin
Digital product and service lifecycle (ITIL 5)|1|2|3|4|.6|Jordan Lee|1,5|cod,portal|ITIL.1:1|D1:D1:1>2:40:.4||arch,pm
AI-enabled service management (ITIL 5)|1|3|4|5|.65|Jordan Lee|4,2|desk|ASD.7:0;GAI.2:1||m_override|ai,itsm`,
tbm:`Cost pools and ledger mapping|3|4|4|5|.85|Avery Chen|3|fin,erp|||m_burn|fin
Resource tower allocation|2|3|4|5|.75|Avery Chen|3,2|fin|TBM.1:0|||fin
Application and solution costing|2|3|4|5|.7|Avery Chen|3|cod,portal,cr|TBM.2:0|PR4:p4_5:2>3:60:.6|m_waste|fin,data
Showback to business units|1|2|3|4|.6|Avery Chen|3||TBM.3:0||m_burn|fin
Unit costs and benchmarking|1|2|3|4|.6|Avery Chen|3,2||TBM.3:0|||fin
Forecasting and planning|2|3|4|5|.7|Avery Chen|3|fin|TBM.2:0||m_burn|fin
Value and benefit realization|1|2|3|4|.55|Maya Ortiz|1,3||TBM.3:0||m_align|fin,pm`,
dmm:`Data governance|2|3|4|5|.75|Dev Rao|1,2|data|||m_align|data
Data architecture|2|3|4|4|.7|Jordan Lee|1,2|data,int|DMM.1:1|D3:D3:2>3:60:.5;PR2:p2_1:2>3:20:.8||arch,data
Metadata and catalog|1|3|4|5|.7|Dev Rao|1|data,search|DMM.1:1|PR2:p2_5:1>3:60:.75||data
Data quality|2|3|4|5|.7|Dev Rao|1,3|data|DMM.3:0||m_waste|data
Master and reference data (taxonomy)|2|3|4|5|.75|Dev Rao|1|data,search|DMM.3:0|PR2:p2_5:2>3:40:.8||data
Data security and privacy|3|3|4|5|.8|Rina Okafor|2,4|data,id|||m_override|sec,data
Data integration and interoperability|2|3|4|4|.65|Jordan Lee|2|int,data|DMM.2:0|D8:D8:2>3:60:.5||arch,data
Business intelligence and analytics|2|3|4|5|.7|Dev Rao|1|data|DMM.4:0||m_conf|data
Document and content management|3|4|4|5|.8|Priya Shah|1,5|cod,portal||PR1:p1_9:3>4:60:.8||pm,data
Data storage and operations|3|3|4|4|.75|Sam Patel|2|data|||m_avail|ops`,
nist:`Govern|2|3|3|4|.7|Rina Okafor|2,4|id|GAI.2:1||m_riskexp|sec
Identify|3|3|4|4|.8|Rina Okafor|2|id,end,net||||sec
Protect|3|3|4|4|.85|Rina Okafor|2|id,m365,end|||m_auto|sec
Detect|2|3|3|4|.7|Sam Patel|2|m365,net|||m_avail|sec,ops
Respond|2|3|4|4|.7|Tom Becker|2|portal,desk||PR3:p3_5:2>3:40:.7|m_mttr|sec,itsm
Recover|2|3|3|4|.65|Tom Becker|2|portal,cod,data|NIST.5:1|PR3:p3_4:2>3:30:.65;D7:D7:3>4:60:.5|m_avail|ops`,
gai:`AI inventory and registry|3|4|5|5|.85|Jordan Lee|4||||m_override|ai
Guardrails and policy enforcement|3|4|4|5|.8|Jordan Lee|4|desk,cod|GAI.1:0||m_override|ai,sec
Evaluation and model risk|2|3|4|5|.7|Jordan Lee|4,2||GAI.1:0|D6:D6:2>3:50:.5||ai,data
Human oversight and override tracking|2|3|4|5|.75|Jordan Lee|4|desk,cod|GAI.2:0||m_override|ai
Provenance and citation of sources|2|4|4|5|.7|Jordan Lee|4,1|cod,search||D6:D6:2>4:10:.55||ai,data
AI spend governance|3|3|4|5|.8|Avery Chen|4,3||||m_aispend|fin,ai
AI incident response|1|2|3|4|.6|Tom Becker|4,2|desk|GAI.2:1|||ai,itsm
AI literacy and skills|2|3|4|5|.65|Nia Brooks|4,5||||m_override|ai`,
dora:`Deployment frequency|2|3|3|4|.7|Sam Patel|1|cod,portal|||m_delivery|ops
Lead time for changes|2|3|3|4|.7|Sam Patel|1,5|cod|||m_delivery|ops
Change failure rate|3|3|4|4|.75|Nia Brooks|2|cod,portal|||m_delivery|itsm,ops
Time to restore service|2|3|3|4|.75|Tom Becker|2|portal|DORA.6:1|PR3:p3_5:2>3:40:.75|m_mttr|ops
Rework rate|2|3|3|4|.6|Priya Shah|1,5|cod|||m_ontime|pm
Test automation|2|3|4|4|.7|Sam Patel|1|cod,search||PR1:p1_4:2>3:40:.7||ops
Platform engineering|1|2|3|4|.55|Jordan Lee|1|cod,data|DORA.6:0|||arch,ops`,
p3m3:`Management control|3|3|4|5|.8|Maya Ortiz|1,3||||m_ontime|pm
Benefits management|1|2|3|4|.55|Maya Ortiz|1,3||||m_align|pm,fin
Financial management|3|4|4|5|.8|Avery Chen|3|fin|||m_burn|fin
Stakeholder engagement|3|3|4|4|.75|Maya Ortiz|1,5|||||pm
Risk management|3|4|4|5|.8|Maya Ortiz|2||||m_riskexp|pm
Organizational governance|2|3|4|5|.7|Maya Ortiz|1,2||P3M3.1:0|||pm
Resource management|2|3|4|5|.7|Maya Ortiz|1,5||P3M3.1:1|D2:D2:2>3:30:.6|m_util|pm`};
const SKILLS={itsm:["ITSM and service desk",/ITIL|ServiceNow|Incident|service desk|Change/i],ai:["AI agents and governance",/\bAI\b|agent|Claude|machine|MLOps|LangChain/i],ops:["Operations and SRE",/Azure|Platform|Network|SRE|Ops|Runbook|Cloud/i],data:["Data engineering",/Data|Taxonomy|Analytics|BI/i],pm:["Delivery and portfolio",/PMP|Agile|Portfolio|Release|Project/i],sec:["Security",/Security|Entra|Defender|Identity|Access/i],fin:["Finance and FinOps",/Account|Budget|ASC|Invoice|FinOps|Finance/i],arch:["Architecture",/architect|Integration|TOGAF/i]};
const CIP={CI1:{n:"Service desk automation sprint",owner:"Tom Becker",d:"2027-02-26"},CI2:{n:"Delivery practice uplift",owner:"Maya Ortiz",d:"2027-04-30"},CI3:{n:"FinOps and TBM tagging program",owner:"Avery Chen",d:"2027-05-14"},CI4:{n:"Data governance council and catalog",owner:"Dev Rao",d:"2027-03-31"},CI5:{n:"Security uplift plan",owner:"Rina Okafor",d:"2027-04-16"},CI6:{n:"AI governance program",owner:"Jordan Lee",d:"2027-05-03"}};
const CIMAP={asd:"CI1",itil:"CI1",dora:"CI1",pdt:"CI2",cmmi:"CI2",p3m3:"CI2",tbm:"CI3",dmm:"CI4",nist:"CI5",gai:"CI6"};
const CP=[];const BYID={};
(function build(){MODELS.forEach(mo=>{const P=mo.id.toUpperCase(),max=mo.lv.length;
 const root={id:P,model:mo.id,parent:null,name:mo.n,cur:null,t:[null,null,null],conf:.78,owner:mo.own,objs:[],svcs:[],pre:[],cr:[],mt:[],sk:[],w:1,b0:null,eff:0,mo:0,root:1,ids:[]};
  CP.push(root);let n=0,sub=0,last=null;
 ROWS[mo.id].split("\n").forEach(line=>{const sb=/^\s\s/.test(line);const f=line.trim().split("|");let id;if(sb){sub++;id=last.id+String.fromCharCode(96+sub)}else{n++;sub=0;id=P+"."+n}
  const o={id,model:mo.id,parent:sb?last.id:P,name:f[0],cur:+f[1],t:[+f[2],+f[3],+f[4]],conf:+f[5]||.7,owner:f[6]||mo.own,objs:(f[7]||"").split(",").filter(Boolean).map(x=>"O"+x),svcs:(f[8]||"").split(",").filter(Boolean).map(SVID),
   pre:(f[9]||"").split(";").filter(Boolean).map(x=>{const a=x.split(":");return [a[0],+a[1]||0]}),
   cr:(f[10]||"").split(";").filter(Boolean).map(x=>{const a=x.split(":"),ft=a[2].split(">");return {p:a[0],ms:a[1],from:+ft[0],to:+ft[1],lag:+a[3]||0,conf:+a[4]||.7}}),
   mt:(f[11]||"").split(",").filter(Boolean),sk:(f[12]||"").split(",").filter(Boolean),w:1,b0:null,eff:1.2+(n%4)*.6,mo:3+(n%3),root:0};
  o.b0=o.cur>=3&&(n+sub)%3===0?o.cur-1:o.cur;CP.push(o);if(!sb)last=o;});});
 let gi=0;CP.forEach(c=>{if(!c.root&&!c.ids&&c.t[0]>c.cur&&!c.cr.length){gi++;if(gi%3!==0)c.cr.push({p:CIMAP[c.model],ms:"CI",from:c.cur,to:c.t[0],lag:30,conf:.65})}});
CP.forEach(c=>BYID[c.id]=c);CP.forEach(c=>{if(c.parent)BYID[c.parent].ids=(BYID[c.parent].ids||[]).concat(c.id)});})();
/* ---------------- model and capability access (built-ins, ingested, authored, generated at scale) ---------------- */
let GEN=null;
function genCaps(){if(GEN)return GEN;const r=RNG("matgen"),pick=a=>a[Math.floor(r()*a.length)];GEN={caps:[],extra:[]};const roots=CP.filter(c=>c.root);
 const nouns={asd:["Ticket class","Runbook","Queue","Approval path","Playbook","Service offering"],pdt:["Program","Contract line","Work package","Vendor milestone","Budget line"],cmmi:["Process area","Practice","Work product"],itil:["Practice","Value stream","Service offering"],tbm:["Cost pool","Tower","Solution"],dmm:["Dataset","Domain","Pipeline","Catalog area"],nist:["Control family","Asset class","Detection use case"],gai:["Agent","Model","Prompt library","Data source"],dora:["Pipeline","Repository","Environment"],p3m3:["Program","Business unit","Funding stream"]};
 const units=["Finance","Standards","Contracts","Member services","Editorial","Learning","Events","Policy","Licensing","Communications","Security","Facilities","Legal","Research"];
 let i=0;while(CP.length+GEN.caps.length<205){const rt=pick(roots),mo=MODELS.find(m=>m.id===rt.model),max=mo.lv.length,areas=rt.ids.filter(a=>!BYID[a].root);const par=BYID[pick(areas)];const u=pick(units),nn=pick(nouns[mo.id]);i++;
  const cur=1+Math.floor(r()*Math.min(3,max-1)),y1=Math.min(max,cur+(r()<.7?1:0)),y3=Math.min(max,y1+(r()<.6?1:0)),y5=Math.min(max,y3+(r()<.5?1:0));
  const id="G"+String(i).padStart(3,"0"),o={id,model:mo.id,parent:par.id,name:u+" "+nn.toLowerCase()+" "+par.name.split(" ")[0].toLowerCase(),cur,t:[y1,y3,y5],conf:r2(.5+r()*.4),owner:pick(["Maya Ortiz","Priya Shah","Dev Rao","Tom Becker","Avery Chen","Jordan Lee","Sam Patel","Nia Brooks"]),objs:[pick(["O1","O2","O3","O4","O5"])],svcs:r()<.7?[pick(SVCREG).id]:[],pre:[],cr:[],mt:[],sk:[pick(Object.keys(SKILLS))],w:1,b0:cur,eff:1+r()*2,mo:2+Math.floor(r()*5),root:0,gen:1};GEN.caps.push(o)}
 /* PX projects credit generated capabilities */
 SCALE.projects().forEach(p=>{const k=1+Math.floor(r()*2);for(let j=0;j<k;j++){const c=pick(GEN.caps);if(c.cr.some(x=>x.p===p.id))continue;if(c.cr.length>=2)continue;c.cr.push({p:p.id,ms:"PX",from:c.cur,to:Math.min(MODELS.find(m=>m.id===c.model).lv.length,c.cur+1),lag:20+Math.floor(r()*60),conf:r2(.45+r()*.4)})}});
 GEN.caps.forEach(c=>{BYID[c.id]=c;const p=BYID[c.parent];p.ids=(p.ids||[]).concat(c.id)});return GEN}
const ALLM=()=>MODELS.concat(M.xmodels);
const modelOf=id=>ALLM().find(m=>m.id===id)||MODELS[0];
const mMax=n=>modelOf(n.model).lv.length;
function CAPS(){let a=CP.concat(M.xcaps);if(SCALE.on){const g=genCaps();a=a.concat(g.caps)}return a}
const kids=n=>((n.ids||[]).filter(i=>BYID[i]&&(SCALE.on||!BYID[i].gen)).map(i=>BYID[i]));
const isLeaf=n=>kids(n).length===0;
const leaves=set=>(set||CAPS()).filter(isLeaf);
/* register ingested caps in BYID */
function reg(c){BYID[c.id]=c;if(c.parent&&BYID[c.parent]){const p=BYID[c.parent];p.ids=(p.ids||[]).filter(x=>x!==c.id).concat(c.id)}}
/* ---------------- projects as credit sources ---------------- */
function projInfo(id){
 if(CIP[id])return {id,n:CIP[id].n,owner:CIP[id].owner,funded:true,kind:"Program",go:"plan"};
 if(/^PR\d/.test(id)){const p=PROJ.find(x=>x.id===id);return {id,n:p?p.n:id,owner:p?p.owner:"",funded:true,kind:"Project",go:"plan"}}
 if(/^D\d/.test(id)){const d=DEMAND.find(x=>x.id===id),L=window.EXE?EXE.snap().L:[],f=L.find(x=>x.id===id);return {id,n:d?d.n:id,owner:d?d.sp:"",funded:!!(f&&f.fund),kind:"Demand",go:"port"}}
 if(/^PX/.test(id)){const p=SCALE.projects().find(x=>x.id===id);return {id,n:p?p.n:id,owner:p?p.owner:"",funded:true,kind:"Project",go:"ppm_proj",px:p}}
 return {id,n:id,owner:"",funded:false,kind:"Project"}}
let _P=null,_Pk="";const planNow=()=>{const k=JSON.stringify(S.imsSlip||{});if(!_P||k!==_Pk){_P=plan("now");_Pk=k}return _P};
function finishWd(c){const id=c.p;
 if(CIP[id])return wdx(CIP[id].d);
 if(/^PR\d/.test(id)){const P=planNow(),t=TASK(c.ms);return t?P.R[t.id].ef:TODAY+60}
 if(/^D\d/.test(id)){const d=DEMAND.find(x=>x.id===id);if(!d)return TODAY+200;const mo=MONTHS[Math.min(MONTHS.length-1,d.m0)],mi=mo[2]+d.mo,y=mo[1]+Math.floor(mi/12),m=mi%12;return wdx(new Date(Date.UTC(y,m,28)).toISOString().slice(0,10))}
 if(/^PX/.test(id)){const p=SCALE.projects().find(x=>x.id===id)||{pct:30,status:"good"};return TODAY+Math.round((100-p.pct)/100*140)+(p.status==="bad"?25:p.status==="warn"?10:0)}
 return TODAY+120}
const ckey=(n,c)=>n.id+"|"+c.p+"|"+c.to;
const slipWd=(c,slip)=>Math.round(((slip&&slip[c.p])||0)*5);
const crDate=(c,slip)=>finishWd(c)+c.lag+slipWd(c,slip);
const accepted=(n,c)=>!!M.acc[ckey(n,c)]||!!c.a;
const crFunded=c=>projInfo(c.p).funded;
/* ---------------- levels ---------------- */
const sc5=(n,v)=>{const m=mMax(n);return m<=1?1:1+(v-1)/(m-1)*4};
function cur(n){if(!isLeaf(n)){const k=kids(n),sw=k.reduce((s,x)=>s+x.w,0)||1;return k.reduce((s,x)=>s+cur(x)*x.w,0)/sw}
 let v=M.as[n.id]!=null?M.as[n.id]:n.cur;n.cr.forEach(c=>{if(accepted(n,c))v=Math.max(v,c.to)});return v}
function fore(n,wd,slip){if(!isLeaf(n)){const k=kids(n),sw=k.reduce((s,x)=>s+x.w,0)||1;return k.reduce((s,x)=>s+fore(x,wd,slip)*x.w,0)/sw}
 let v=cur(n);n.cr.forEach(c=>{if(crFunded(c)&&(accepted(n,c)||crDate(c,slip)<=wd))v=Math.max(v,c.to)});return v}
function tgtN(n,h){if(!isLeaf(n)&&!(M.tg[n.id]&&M.tg[n.id][h]!=null)){const k=kids(n),sw=k.reduce((s,x)=>s+x.w,0)||1;return k.reduce((s,x)=>s+tgtN(x,h)*x.w,0)/sw}return M.tg[n.id]&&M.tg[n.id][h]!=null?M.tg[n.id][h]:n.t[h]}
function exp(n,wd){if(!isLeaf(n)){const k=kids(n),sw=k.reduce((s,x)=>s+x.w,0)||1;return k.reduce((s,x)=>s+exp(x,wd)*x.w,0)/sw}
 const pts=[[W0,n.b0!=null?n.b0:n.cur],[HW[0],tgtN(n,0)],[HW[1],tgtN(n,1)],[HW[2],tgtN(n,2)]];for(let i=1;i<pts.length;i++){if(wd<=pts[i][0]){const a=pts[i-1],b=pts[i];return a[1]+(b[1]-a[1])*(wd-a[0])/(b[0]-a[0]||1)}}return pts[3][1]}
function slack(n,h,slip){const t=tgtN(n,h);if(isLeaf(n)){if(cur(n)>=t)return {s:null,met:true};const cs=n.cr.filter(c=>c.to>=t&&crFunded(c));if(!cs.length)return {s:null,met:false,none:true};const d=Math.min(...cs.map(c=>accepted(n,c)?-1e6:crDate(c,slip)));return {s:HW[h]-d,met:false}}
 const k=kids(n).map(x=>slack(x,h,slip));return {s:k.some(x=>x.none)?null:Math.min(...k.map(x=>x.s==null?1e9:x.s)),met:k.every(x=>x.met),none:k.some(x=>x.none)}}
function status(n,slip){const c=cur(n),e=exp(n,TODAY),v=c-e,t1=tgtN(n,0),f1=fore(n,HW[0],slip),sl=slack(n,0,slip),miss=t1-f1;
 let s="good";if(v<-.35||miss>.05)s="warn";if(v<-.75||miss>=1)s="bad";if(s==="good"&&sl.s!=null&&sl.s<15&&!sl.met)s="warn";
 return {s,v,c,e,t1,f1,miss,sl}}
const stTxt=s=>s==="good"?"On track":s==="warn"?"Watch":"Behind";
const stPill=s=>pill(stTxt(s),s);
/* roll-ups over any set of nodes (uses leaves only so nothing is counted twice) */
function roll(set,slip){const L=leaves(set);if(!L.length)return {n:0,att:0,gv:0,cov:0,cur:0,t1:0,f1:0,st:"warn",exp:0};const sw=L.reduce((s,x)=>s+x.w,0)||1;let att=0,gv=0,cu=0,t1=0,f1=0,ex=0,gaps=0,cov=0,bad=0,warn=0;
 L.forEach(n=>{const c=cur(n),t=tgtN(n,0),ts=status(n,slip);att+=Math.min(1,c/Math.max(1,t))*n.w;gv+=(c-exp(n,TODAY))*n.w;cu+=sc5(n,c)*n.w;t1+=sc5(n,t)*n.w;f1+=sc5(n,fore(n,HW[0],slip))*n.w;ex+=sc5(n,exp(n,TODAY))*n.w;if(t>c){gaps++;if(fore(n,HW[0],slip)>=t)cov++}if(ts.s==="bad")bad++;if(ts.s==="warn")warn++});
 gv/=sw;const st=gv<-.75||bad/L.length>.3?"bad":gv<-.3||(bad+warn)/L.length>.4?"warn":"good";
 return {n:L.length,att:att/sw*100,gv,cur:cu/sw,t1:t1/sw,f1:f1/sw,exp:ex/sw,cov:gaps?cov/gaps*100:100,gaps,covn:cov,bad,warn,st}}
const nodesOfObj=id=>leaves().filter(n=>n.objs.includes(id));
const nodesOfSvc=id=>leaves().filter(n=>n.svcs.includes(id));
const nodesOfModel=id=>CAPS().filter(n=>n.model===id);
