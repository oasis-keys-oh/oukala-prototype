/* ============ PPM data: demand, integrated master schedule, capacity, product log ============ */
/* Work calendar: Monday to Friday, no holidays modeled. A "work day number" (wdn) counts work days from Jul 1, 2026. */
const WD=[];(function(){const d=new Date(Date.UTC(2026,6,1)),end=Date.UTC(2028,0,1);while(d.getTime()<end){const g=d.getUTCDay();if(g!==0&&g!==6)WD.push(d.getTime());d.setUTCDate(d.getUTCDate()+1)}})();
const DAYMS=864e5,CAL0=Date.UTC(2026,6,1);
const wdOf=iso=>{const t=Date.parse(iso+"T00:00:00Z");let lo=0,hi=WD.length-1;while(lo<hi){const m=(lo+hi)>>1;if(WD[m]<t)lo=m+1;else hi=m}return lo};
const dateOf=w=>new Date(WD[Math.max(0,Math.min(WD.length-1,w))]);
const fmtD=(w,y)=>dateOf(w).toLocaleDateString("en-US",{month:"short",day:"numeric",...(y?{year:"numeric"}:{}),timeZone:"UTC"});
const xday=w=>(WD[Math.max(0,Math.min(WD.length-1,w))]-CAL0)/DAYMS;
const TODAY=wdOf("2026-10-06");

const PROJ=[
 {id:"PR1",n:"Codification Platform Upgrade",short:"Codification",c:"--p4",owner:"Priya Shah",bac:1200,paid:740,rec:"PR1"},
 {id:"PR2",n:"Taxonomy Data Hub",short:"Taxonomy",c:"--s3",owner:"Dev Rao",bac:860,paid:770,rec:"PR2"},
 {id:"PR3",n:"Portal Resilience",short:"Portal",c:"--e4",owner:"Tom Becker",bac:310,paid:120,rec:"S1"},
 {id:"PR4",n:"Contract Repository Refresh",short:"Contracts",c:"--u3",owner:"Maya Ortiz",bac:540,paid:60,rec:"R1"}];
const CAP={"Platform team":8,"Data team":6,"Lumen (vendor)":5,"Ops team":5,"Editors":4,"Architecture":3};
/* Task fields: dur = current work days, bdur = baseline work days, pred = [id] or [[id,lag]], snet = start no earlier than, pct = percent complete, res = [[resource,FTE]] */
const TASKS=[
 {id:"p1_1",p:"PR1",n:"Requirements and design",dur:20,pred:[],snet:"2026-07-06",pct:100,own:"Priya Shah",res:[["Architecture",2],["Editors",1]]},
 {id:"p1_2",p:"PR1",n:"Core platform build",dur:45,pred:["p1_1"],pct:100,own:"Priya Shah",res:[["Platform team",7]]},
 {id:"p1_3",p:"PR1",n:"Search indexer (Lumen)",dur:59,bdur:52,pred:["p1_1"],pct:70,own:"Lumen",ven:"V1",res:[["Lumen (vendor)",4]]},
 {id:"p1_4",p:"PR1",n:"Integration and test",dur:15,pred:["p1_2","p1_3"],pct:0,own:"Priya Shah",res:[["Platform team",7],["Editors",1]]},
 {id:"p1_5",p:"PR1",n:"Beta release",dur:0,pred:["p1_4"],ms:1,pct:0,own:"Priya Shah",res:[]},
 {id:"p1_6",p:"PR1",n:"Editor acceptance testing",dur:12,pred:["p1_5"],pct:0,own:"Chief Editor",res:[["Editors",4]]},
 {id:"p1_7",p:"PR1",n:"Content migration",dur:30,pred:["p1_2"],pct:0,own:"Priya Shah",res:[["Platform team",4],["Editors",1]]},
 {id:"p1_8",p:"PR1",n:"Cutover rehearsal",dur:8,pred:["p1_6","p1_7"],pct:0,own:"Priya Shah",res:[["Platform team",4],["Ops team",2]]},
 {id:"p1_9",p:"PR1",n:"Go live",dur:0,pred:["p1_8"],ms:1,pct:0,own:"Priya Shah",res:[]},
 {id:"p2_1",p:"PR2",n:"Data model design",dur:25,pred:[],snet:"2026-08-03",pct:100,own:"Dev Rao",res:[["Architecture",1],["Data team",2]]},
 {id:"p2_2",p:"PR2",n:"Taxonomy engineering (Lumen SOW-4)",dur:20,pred:["p2_1",["p1_3",0]],pct:0,own:"Lumen",ven:"V1",res:[["Lumen (vendor)",4]],note:"Starts when the same Lumen staff finish the search indexer."},
 {id:"p2_3",p:"PR2",n:"Pipeline build",dur:45,pred:["p2_1"],pct:48,own:"Dev Rao",res:[["Data team",4]]},
 {id:"p2_4",p:"PR2",n:"Pilot readiness test",dur:6,pred:["p2_2","p2_3"],pct:0,own:"Dev Rao",res:[["Data team",3],["Platform team",1]]},
 {id:"p2_5",p:"PR2",n:"Pilot",dur:0,pred:["p2_4"],snet:"2026-12-02",ms:1,pct:0,own:"Dev Rao",res:[],note:"Committed date. The pilot cannot start before Dec 2."},
 {id:"p3_1",p:"PR3",n:"Root cause review",dur:10,pred:[],snet:"2026-09-14",pct:100,own:"Tom Becker",res:[["Ops team",2]]},
 {id:"p3_2",p:"PR3",n:"Failover redesign",dur:20,pred:["p3_1"],pct:30,own:"Tom Becker",res:[["Ops team",2],["Architecture",1]]},
 {id:"p3_3",p:"PR3",n:"Runbook RB-031 refresh",dur:10,pred:["p3_1"],pct:30,own:"Ops Agent",res:[["Ops team",1]]},
 {id:"p3_4",p:"PR3",n:"Failover rehearsal",dur:5,pred:["p3_2","p3_3"],pct:0,own:"Tom Becker",res:[["Ops team",3]]},
 {id:"p3_5",p:"PR3",n:"Sev 2 problem closed",dur:0,pred:["p3_4"],ms:1,pct:0,own:"Tom Becker",res:[]},
 {id:"p4_1",p:"PR4",n:"Vendor selection",dur:20,pred:[],snet:"2026-10-05",pct:35,own:"Maya Ortiz",res:[["Architecture",1]]},
 {id:"p4_2",p:"PR4",n:"Migration design",dur:25,pred:["p4_1"],pct:0,own:"Maya Ortiz",res:[["Architecture",1],["Platform team",1]]},
 {id:"p4_3",p:"PR4",n:"Build and migrate",dur:40,pred:["p4_2"],pct:0,own:"Maya Ortiz",res:[["Platform team",3]]},
 {id:"p4_4",p:"PR4",n:"Maintenance window cutover",dur:3,pred:["p4_3"],snet:"2027-01-11",pct:0,own:"Maya Ortiz",res:[["Platform team",4],["Ops team",2]]},
 {id:"p4_5",p:"PR4",n:"Decommission legacy",dur:15,pred:["p4_4"],pct:0,own:"Maya Ortiz",res:[["Platform team",1]]}];
const TASK=id=>TASKS.find(t=>t.id===id);
const predId=p=>Array.isArray(p)?p[0]:p, predLag=p=>Array.isArray(p)?p[1]:0;
function cpm(durOf){const R={};TASKS.forEach(t=>{let es=t.snet?wdOf(t.snet):0;(t.pred||[]).forEach(p=>{es=Math.max(es,R[predId(p)].ef+predLag(p))});const d=durOf(t);R[t.id]={es,ef:es+d,d}});
 const pe={};TASKS.forEach(t=>{pe[t.p]=Math.max(pe[t.p]||0,R[t.id].ef)});
 const succ={};TASKS.forEach(t=>(t.pred||[]).forEach(p=>{(succ[predId(p)]=succ[predId(p)]||[]).push([t.id,predLag(p)])}));
 for(let i=TASKS.length-1;i>=0;i--){const t=TASKS[i],r=R[t.id];let lf=pe[t.p];(succ[t.id]||[]).forEach(([s,lag])=>{lf=Math.min(lf,R[s].ls-lag)});r.lf=lf;r.ls=lf-r.d;r.fl=r.ls-r.es;r.succ=(succ[t.id]||[]).map(x=>x[0])}
 return {R,pe}}
const BASE=cpm(t=>t.bdur!=null?t.bdur:t.dur);
/* What-if changes to durations, in work days. Positive slips the task, negative crashes it. */
const IMS_SCEN=[["now","Current plan",{}],["lumen5","Lumen slips 5 more work days",{p1_3:5}],["lumen10","Lumen slips 10 more work days",{p1_3:10}],["crash","Add two Lumen engineers to the indexer",{p1_3:-4}],["uat","Editor testing takes twice as long",{p1_6:12}]];
function plan(scen){const ch=(IMS_SCEN.find(s=>s[0]===scen)||IMS_SCEN[0])[2];const extra=S.imsSlip||{};return cpm(t=>Math.max(t.ms?0:1,t.dur+(ch[t.id]||0)+(extra[t.id]||0)))}
const projFin=(P,id)=>Math.max(...TASKS.filter(t=>t.p===id).map(t=>P.R[t.id].ef));
/* Earned value, weighted by effort (work days x FTE) */
function evm(P,id){let pv=0,ev=0,tot=0;TASKS.filter(t=>t.p===id&&!t.ms).forEach(t=>{const fte=t.res.reduce((a,r)=>a+r[1],0)||1,w=fte*t.dur;const b=BASE.R[t.id],pp=Math.max(0,Math.min(1,(TODAY-b.es)/Math.max(1,b.ef-b.es)));tot+=w;pv+=w*pp;ev+=w*(t.pct/100)});return {pv:pv/tot,ev:ev/tot,spi:pv?ev/pv:1}}
/* Resource load by month (Jul 2026 to Mar 2027), as a share of capacity. Funded demand adds load. */
const MONTHS=[["Jul",2026,6],["Aug",2026,7],["Sep",2026,8],["Oct",2026,9],["Nov",2026,10],["Dec",2026,11],["Jan",2027,0],["Feb",2027,1],["Mar",2027,2]];
function load(P,extra){const grid={};Object.keys(CAP).forEach(r=>grid[r]=MONTHS.map(()=>0));
 MONTHS.forEach(([,y,m],mi)=>{const a=WD.findIndex(t=>{const d=new Date(t);return d.getUTCFullYear()===y&&d.getUTCMonth()===m}),b=WD.findIndex(t=>{const d=new Date(t);return d.getUTCFullYear()===(m===11?y+1:y)&&d.getUTCMonth()===((m+1)%12)});const n=b-a;
  TASKS.forEach(t=>{const r=P.R[t.id];if(t.ms||t.pct===100&&r.ef<=a)return;const s=Math.max(a,r.es),e=Math.min(b,r.ef);if(e>s)t.res.forEach(([rn,f])=>grid[rn][mi]+=f*(e-s)/n)});
  (extra||[]).forEach(d=>d.res.forEach(([rn,f])=>{if(mi>=d.m0&&mi<d.m0+d.mo)grid[rn][mi]+=f}))});
 Object.keys(grid).forEach(r=>grid[r]=grid[r].map(v=>v/CAP[r]));return grid}

/* Demand and prioritization */
const DSTAGES=["Submitted","Screening","Scoring","Review board"];
const DEMAND=[
 {id:"D1",n:"Public comment portal",who:"Editorial",sp:"Chief Editor",cost:420,ben:1100,strat:5,risk:2,urg:3,pm:14,st:3,res:[["Platform team",4]],m0:6,mo:5,why:"Lets stakeholders comment on drafts online. A regulator expects it before the Q2 comment window.",obj:"O1"},
 {id:"D2",n:"Reviewer workload dashboard",who:"Editorial",sp:"Chief Editor",cost:120,ben:340,strat:3,risk:1,urg:2,pm:4,st:2,res:[["Data team",1]],m0:6,mo:3,why:"Shows who is overloaded with reviews so deadlines stop slipping.",obj:"O1",dup:"D10"},
 {id:"D3",n:"Retire the legacy lease subledger",who:"Finance",sp:"CFO",cost:680,ben:910,strat:4,risk:5,urg:4,pm:22,st:3,res:[["Platform team",2],["Architecture",1]],m0:3,mo:6,why:"The old subledger cannot support the ASC 842 amendment effective Jan 1, 2027.",obj:"O2",kg:"std1"},
 {id:"D4",n:"Mobile app for editors",who:"Editorial",sp:"Chief Editor",cost:540,ben:480,strat:2,risk:1,urg:1,pm:16,st:1,res:[["Platform team",3]],m0:7,mo:6,why:"Lets editors approve changes from a phone.",obj:"O1"},
 {id:"D5",n:"Vendor risk scorecards",who:"Procurement",sp:"CFO",cost:210,ben:600,strat:4,risk:4,urg:3,pm:7,st:2,res:[["Data team",2]],m0:4,mo:3,why:"Turns the vendor index into a monthly scorecard before renewals.",obj:"O2"},
 {id:"D6",n:"AI drafting assistant for standards",who:"Editorial",sp:"CEO office",cost:350,ben:1400,strat:5,risk:2,urg:3,pm:10,st:2,res:[["Platform team",2],["Data team",1]],m0:5,mo:5,why:"Drafts first versions of standards from approved source text, with every sentence cited.",obj:"O1"},
 {id:"D7",n:"Disaster recovery for the Portal",who:"IT operations",sp:"CIO",cost:460,ben:800,strat:4,risk:5,urg:5,pm:12,st:3,res:[["Ops team",2],["Architecture",1]],m0:3,mo:5,why:"The Sev 2 incident showed there is no tested failover. Tier 1 availability depends on it.",obj:"O2"},
 {id:"D8",n:"Data warehouse consolidation",who:"Data office",sp:"CIO",cost:900,ben:1200,strat:3,risk:3,urg:2,pm:30,st:0,res:[["Data team",3]],m0:6,mo:9,why:"Merges three warehouses into one. Large, and it overlaps the Taxonomy Data Hub.",obj:"O2"},
 {id:"D9",n:"Meeting room AV refresh",who:"Facilities",sp:"COO",cost:160,ben:90,strat:1,risk:1,urg:2,pm:3,st:0,res:[["Ops team",1]],m0:5,mo:2,why:"Replaces ageing cameras and displays in four rooms.",obj:null},
 {id:"D10",n:"Standards publishing analytics",who:"Editorial",sp:"Chief Editor",cost:130,ben:310,strat:3,risk:1,urg:2,pm:4,st:0,res:[["Data team",1]],m0:6,mo:3,why:"Tracks how long each standard takes from draft to publication.",obj:"O1",dup:"D2"}];
const DW0={s:.35,f:.25,r:.2,u:.2};
function dscore(d,w){const roi=d.ben/d.cost,fin=Math.min(5,roi*2),sum=w.s+w.f+w.r+w.u||1;return Math.round((w.s*d.strat+w.f*fin+w.r*d.risk+w.u*d.urg)/sum/5*100)}
function rank(w,env,cap){const L=DEMAND.filter(d=>!(S.merged||{})[d.id]).map(d=>({...d,roi:d.ben/d.cost,score:dscore(d,w)})).sort((a,b)=>b.score-a.score);let c=0,p=0,cut=false;L.forEach(d=>{if(!cut&&c+d.cost<=env&&p+d.pm<=cap){c+=d.cost;p+=d.pm;d.fund=true}else{cut=true;d.fund=false}});L.spent=c;L.pms=p;return L}

/* Metrics defined once, used across PPM screens */
Object.assign(METRICS,{
 m_prio:{n:"Priority score",f:"(0.35 × Strategic fit + 0.25 × Financial return + 0.20 × Risk reduction + 0.20 × Urgency) ÷ 5 × 100",u:"",cur:68,tgt:60,badAt:45,dir:"max",max:100,tr:[61,63,64,66,67,67,68,68],owner:"Portfolio office",use:["Demand and priorities"],rem:{kind:"sop",ref:"SOP-301",title:"Re-score demand after a strategy change",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Re-scores the queue and lists items that moved"}},
 m_spi:{n:"Schedule performance index",f:"Earned value ÷ Planned value",u:"",cur:.91,tgt:.95,badAt:.85,dir:"max",max:1.2,tr:[1.02,1.0,.98,.96,.94,.93,.92,.91],owner:"PMO",use:["Master schedule","Project plan","Home"],rem:{kind:"sop",ref:"SOP-208",title:"Recover a slipped milestone",agent:"PMO Agent",auto:true,state:"running",prog:"Step 2 of 5: re-baselining the indexer work with Lumen"}},
 m_ontime:{n:"Milestones on time",f:"Milestones met by the baseline date ÷ Milestones due to date",u:"%",cur:78,tgt:85,badAt:70,dir:"max",max:100,tr:[92,90,88,85,83,80,79,78],owner:"PMO",use:["Master schedule"],rem:{kind:"kb",ref:"KB-122",title:"Replan a late milestone",agent:"PMO Agent",auto:false,state:"idle",prog:"Drafts a recovery plan when a milestone slips"}},
 m_util:{n:"Resource utilization",f:"Assigned FTE ÷ Available FTE, per team per month",u:"%",cur:92,tgt:85,badAt:105,dir:"min",max:130,tr:[78,81,84,88,91,93,94,92],owner:"Resource office",use:["Demand and priorities","Master schedule"],rem:{kind:"sop",ref:"SOP-315",title:"Level an overloaded team",agent:"Resource Agent",auto:false,state:"idle",prog:"Proposes moves that clear the overload without moving a milestone"}},
 m_intake:{n:"Demand decision time",f:"Date decided − Date submitted, in days",u:" days",cur:19,tgt:14,badAt:21,dir:"min",max:40,tr:[24,23,22,21,20,20,19,19],owner:"Portfolio office",use:["Demand and priorities"],rem:{kind:"agent",ref:"Portfolio Agent",title:"Nudge stalled reviews",agent:"Portfolio Agent",auto:true,state:"running",prog:"Reminded 2 sponsors about scores due this week"}}});

/* Product log: every update and every piece of feedback, kept for future releases */
const VERS=[["v1","2026-10-06","Prototype v1","Executive trace, invoice approval, First Officer, AI Control Tower."],["v2","2026-10-06","Oukala v2","Liquid glass shell, personas, process-flow trace, ledger and rule builder, calendars, Control Tower, metrics, knowledge graph."],["v3","2026-10-06","PPM and product log","Demand and priorities, integrated master schedule, project plans, Project Online coverage, this log."],["v4","2026-10-06","Everything on the feature list","Drag and drop, intake, contract ingestion, projects and RAID, vault graph, ITSM, ITOM, budgets, executive views, workflow, knowledge, people, admin."]];
const LOG0=[
 ["F01","Design","Shell","Floating, collapsible glass sidebar like Apple's menu, with a subtle background graphic.","Done","v2"],
 ["F02","Design","Shell","User profile and preferences.","Done","v2"],
 ["F03","Design","Visual","Liquid glass, floating layers, strong color contrast, hover effects everywhere, subtle animation, no text boxes or visible text boundaries.","Done","v2"],
 ["F04","Design","Visual","Use the supplied color palette. Name the app Oukala.","Done","v2"],
 ["F05","Design","Trace","Trace the business process like the Codification Publishing Flow, in a modern vector style, keeping the interactivity.","Done","v2"],
 ["F06","Design","Trace","\"How to read this\" was unreadable and inconsistent.","Done","v2"],
 ["F07","Design","Table","Fix the inconsistent fonts and make the table less boring.","Done","v2"],
 ["F08","Design","Table","Clicking away from a row should close the drawer. The drawer should be floating liquid glass.","Done","v2"],
 ["F09","Design","Dashboard","Dashboard was mediocre. Needs richer visuals.","Done","v2"],
 ["F10","Feature","Invoices","Show a ledger: contract total, paid to date, this invoice, what we should pay, remaining, and performance on time, quality and expectation.","Done","v2"],
 ["F11","Clarity","Invoices","Make the link between an invoice and the executive trace obvious.","Done","v2"],
 ["F12","Feature","Invoices","Show how to define auto-approval rules.","Done","v2"],
 ["F13","Feature","First Officer","Agents should handle meetings automatically. The screen is for after-the-fact review. Needs robust calendar views.","Done","v2"],
 ["F14","Design","Control Tower","The AI Control Tower was boring. Look at Salesforce and ServiceNow for inspiration.","Done","v2"],
 ["F15","Feature","Knowledge graph","Traverse a file system or other source to link knowledge such as GAAP, with the same impact analysis as a changed CI.","Done","v2"],
 ["F16","Principle","Everywhere","Every field is either part of the story or a metric. Metrics are defined once, show their formula, and name what happens when off trend.","Done","v2"],
 ["F17","Principle","Everywhere","Persona-based, hyper-contextual content. Adaptive to skill level, device and accessibility.","Done","v2"],
 ["F18","Principle","Everywhere","Track and audit every action. Trends become research for future feature requests.","In progress","v3"],
 ["F19","Principle","Everywhere","Chat can control everything. AI actions always show lineage and guardrails.","In progress","v3"],
 ["F20","Feature","Portfolio","Expand project and portfolio management: integrated master schedule across projects, Gantt charts, project plans, full Microsoft Project Online features, demand and prioritization.","In progress","v3"],
 ["F21","Process","Product log","Track every update, including design feedback, for future releases.","In progress","v3"],
 ["F22","Question","Research","Why does the data-model research matter in a prototype? It informs the real data model, so it is not a screen. Answered in chat.","Done","v2"],
 ["F23","Idea","Visual","Offer to get outside UI and UX guidance (ChatGPT) if the visuals need it. Not needed yet.","Open","—"],
 ["F24","Feature","Demand","Drag and drop priorities, with a reason captured for every override.","Done","v4"],
 ["F25","Feature","Platform","Drag and drop everywhere it makes sense: demand gates, assignments, change calendar, release trains, workflow canvas, budget transfers, risk heat map, room bookings.","Done","v4"],
 ["F26","Feature","Demand","Show how intake works, with a real form, duplicate check and live score preview.","Done","v4"],
 ["F27","Feature","Demand","Hover detail on how a priority score is calculated.","Done","v4"],
 ["F28","Feature","Demand","A funded request automatically becomes a project with tasks and a place on the master schedule.","Done","v4"],
 ["F29","Feature","Demand","Ingest a contract and extract milestones, agreements, SLAs, deliverables, budget and invoice schedule.","Done","v4"],
 ["F30","Bug","Visual","Spacing: tiles touched the cards below them in the impact report.","Done","v4"],
 ["F31","Feature","Schedule","Filter project schedules by project, assign project managers and individuals, see milestone progress and a RAID log.","Done","v4"],
 ["F32","Feature","Knowledge","Knowledge graph should feel like Obsidian. Rebuilt from the GAAP vault as a force graph with local graph, backlinks and stubs.","Done","v4"],
 ["F33","Feature","Service","Show ITSM components: incidents, problems, changes, releases, major incidents, catalog, SLAs, on-call, assets.","Done","v4"],
 ["F34","Feature","Finance","Show budgets overall, financial model, vendors and contracts, benefits and delegation of authority.","Done","v4"],
 ["F35","Feature","Executive","Show executive views: CEO, CFO, CIO, COO and Board, strategy alignment, risk heat map with Monte Carlo, application portfolio, board pack.","Done","v4"],
 ["F36","Feature","Platform","Build initial feature prototypes with forms for everything on the feature list.","Done","v4"],
 ["F37","Idea","Platform","The vault graph should read the live Obsidian vault instead of a snapshot. Needs the desktop connector.","Open","—"],
 ["F38","Idea","Demand","Contract ingestion should read real PDF and Word files through a document service.","Open","—"]];
const LOGKEY="oukala.log.v3";
let LOGX=[];try{LOGX=JSON.parse(localStorage.getItem(LOGKEY)||"[]")}catch(e){}
