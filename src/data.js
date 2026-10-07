"use strict";
/* ============ Seed data: every record, person, vendor and number is invented ============ */
const NOW={day:"Tuesday, October 6",h:13.5,date:"2026-10-06"};

/* ---- metrics: defined once, used anywhere. dir "max" = higher is better. badAt = where red starts ---- */
const METRICS={
m_delivery:{n:"Delivery health",f:"0.4 × Schedule adherence + 0.3 × Milestone hit rate + 0.3 × (1 − Risk exposure ÷ Contingency)",u:"pts",cur:71,tgt:80,badAt:65,dir:"max",max:100,tr:[78,77,76,74,73,72,71,71],owner:"PMO",use:["Home","Executive trace","Metrics"],rem:{kind:"sop",ref:"SOP-208",title:"Recover a slipped milestone",agent:"PMO Agent",auto:true,state:"running",prog:"Step 2 of 5: re-baselining the indexer work with Lumen"}},
m_fin:{n:"Financial health",f:"100 − (Forecast overrun % × 5) − (Budget lines over commitment × 10)",u:"pts",cur:62,tgt:85,badAt:65,dir:"max",max:100,tr:[88,86,84,80,74,70,66,62],owner:"Finance",use:["Home","Executive trace","Invoice approval"],rem:{kind:"kb",ref:"KB-114",title:"Reforecast a budget line",agent:"Forecast Agent",auto:true,state:"queued",prog:"Waiting for your approval to move $48,000 from B1 contingency"}},
m_ops:{n:"Operational health",f:"0.5 × Availability score + 0.3 × Incident score + 0.2 × Knowledge freshness",u:"pts",cur:82,tgt:80,badAt:70,dir:"max",max:100,tr:[85,84,86,83,81,80,83,82],owner:"IT Ops",use:["Home","Executive trace","AI Control Tower"],rem:null},
m_burn:{n:"Forecast vs approved budget",f:"Forecast at completion ÷ Approved budget",u:"%",cur:105.6,tgt:100,badAt:110,dir:"min",max:130,tr:[98,99,100,101,102,103,105,105.6],owner:"Finance",use:["Home","Executive trace"],rem:{kind:"kb",ref:"KB-114",title:"Reforecast a budget line",agent:"Forecast Agent",auto:true,state:"queued",prog:"Drafted a reforecast; awaiting approval"}},
m_cycle:{n:"Invoice cycle time",f:"Average days from invoice received to decision",u:"days",cur:4.2,tgt:3,badAt:6,dir:"min",max:10,tr:[5.4,5.1,4.9,4.8,4.6,4.4,4.3,4.2],owner:"Finance",use:["Home","Invoice approval","Executive trace"],rem:{kind:"agent",ref:"Invoice Advisor",title:"Pre-clear clean invoices",agent:"Invoice Advisor",auto:true,state:"running",prog:"Pre-cleared 6 of 9 invoices this week"}},
m_auto:{n:"Auto-approval rate",f:"Invoices cleared by rule ÷ Invoices received",u:"%",cur:38,tgt:60,badAt:30,dir:"max",max:100,tr:[22,26,29,31,33,35,37,38],owner:"Finance",use:["Invoice approval","Metrics"],rem:{kind:"sop",ref:"SOP-114",title:"Tune auto-approval rules",agent:"Feedback Analyst",auto:false,state:"idle",prog:"Suggests rule changes from override patterns"}},
m_vendor:{n:"Vendor performance index",f:"0.4 × Time + 0.3 × Quality + 0.3 × Expectation",u:"idx",cur:.86,tgt:.85,badAt:.75,dir:"max",max:1,tr:[.9,.9,.89,.88,.87,.86,.86,.86],owner:"Vendor mgmt",use:["Invoice approval","Executive trace"],rem:null},
m_avail:{n:"Tier 1 availability",f:"1 − (Minutes of outage ÷ Minutes in period)",u:"%",cur:99.62,tgt:99.9,badAt:99.5,dir:"max",max:100,tr:[99.95,99.93,99.9,99.88,99.8,99.7,99.65,99.62],owner:"IT Ops",use:["Home","Executive trace","AI Control Tower"],rem:{kind:"kb",ref:"RB-031",title:"Portal failover runbook",agent:"Ops Agent",auto:true,state:"running",prog:"Failover rehearsal scheduled for 16:00"}},
m_mttr:{n:"Mean time to resolve (Sev 2)",f:"Average hours from incident opened to resolved",u:"h",cur:3.4,tgt:4,badAt:6,dir:"min",max:10,tr:[4.4,4.1,3.9,3.7,3.6,3.5,3.4,3.4],owner:"IT Ops",use:["Executive trace"],rem:null},
m_override:{n:"Agent override rate",f:"Human overrides ÷ Agent recommendations",u:"%",cur:22,tgt:10,badAt:20,dir:"min",max:40,tr:[12,13,15,16,18,19,21,22],owner:"AI governance",use:["AI Control Tower","Invoice approval","Feedback loop"],rem:{kind:"agent",ref:"Feedback Analyst",title:"Review override patterns",agent:"Feedback Analyst",auto:true,state:"running",prog:"Found a pattern: 4 of 6 holds on Lumen were overridden"}},
m_aispend:{n:"AI spend against daily cap",f:"AI spend today ÷ Daily cap",u:"%",cur:29,tgt:80,badAt:95,dir:"min",max:100,tr:[22,27,31,26,30,28,27,29],owner:"AI governance",use:["AI Control Tower"],rem:null},
m_kb:{n:"Knowledge freshness",f:"Articles reviewed in the last 12 months ÷ Active articles",u:"%",cur:74,tgt:90,badAt:70,dir:"max",max:100,tr:[82,80,79,78,77,76,75,74],owner:"Knowledge",use:["Executive trace","Metrics"],rem:{kind:"agent",ref:"Knowledge Curator",title:"Draft refreshes for stale articles",agent:"Knowledge Curator",auto:true,state:"running",prog:"11 refresh drafts waiting for owner review"}},
m_yield:{n:"Meeting capture yield",f:"Actions and decisions captured ÷ Actions and decisions stated",u:"%",cur:94,tgt:90,badAt:80,dir:"max",max:100,tr:[88,89,91,92,93,93,94,94],owner:"PMO",use:["First Officer"],rem:null}
};
function mstat(m){const v=m.cur;if(m.dir==="max")return v>=m.tgt?"good":v>=m.badAt?"warn":"bad";return v<=m.tgt?"good":v<=m.badAt?"warn":"bad"}
function mfmt(m,v){v=v==null?m.cur:v;if(m.u==="%")return (Math.round(v*100)/100)+"%";if(m.u==="idx")return v.toFixed(2);if(m.u==="h")return v+"h";if(m.u==="days")return v+" days";return String(v)}

/* ---- records (the trace graph) ---- */
const NODES=[
{id:"O1",t:"obj",n:"Modernize standards publishing",s:"good",c:"confirmed",owner:"CEO office",story:"Cut the time to publish a standard from 23 days to 15 by end of FY27.",a:{Owner:"CEO office",Horizon:"FY26 to FY27","Legacy ID":"OBJ-0007"}},
{id:"O2",t:"obj",n:"Reduce operating risk",s:"good",c:"confirmed",owner:"CFO",story:"Keep Tier 1 services above 99.9% and every vendor above a 0.85 index.",a:{Owner:"CFO",Horizon:"FY26"}},
{id:"P1",t:"port",n:"Digital Publishing portfolio",s:"warn",c:"confirmed",owner:"Maya Ortiz",story:"Two projects, $2.06M approved, amber because the beta slipped nine days.",amt:2060000,a:{Budget:"$2.06M",Health:"Amber",Projects:"2","Cost center code":"CC-4410"}},
{id:"PR1",t:"proj",n:"Codification Platform Upgrade",s:"warn",c:"confirmed",owner:"Priya Shah",story:"Beta moved from Nov 4 to Nov 13 because Lumen delivered the search indexer late.",a:{Sponsor:"Chief Editor",Milestone:"Beta Nov 13 (slipped 9 days)",Health:"Amber","Cost center code":"CC-4411"}},
{id:"PR2",t:"proj",n:"Taxonomy Data Hub",s:"good",c:"confirmed",owner:"Dev Rao",story:"Pilot is on track for Dec 2 but depends on the same Lumen staff.",a:{Sponsor:"CIO",Milestone:"Pilot Dec 2",Health:"Green"}},
{id:"B1",t:"bud",n:"FY26 Cloud hosting",s:"warn",c:"confirmed",owner:"Tom Becker",story:"$1.2M approved and $740K paid; a larger hosting tier could add $48K.",amt:1200000,paid:740000,a:{Approved:"$1,200,000",Committed:"$1,050,000",Paid:"$740,000"}},
{id:"B2",t:"bud",n:"FY26 Vendor services",s:"bad",c:"confirmed",owner:"Tom Becker",story:"Commitments of $905K exceed the $860K approved by $45K.",amt:860000,paid:770000,a:{Approved:"$860,000",Committed:"$905,000",Paid:"$770,000"}},
{id:"V1",t:"con",n:"Northwind Cloud MSA",s:"good",c:"confirmed",owner:"Vendor mgmt",story:"Annual hosting commitment of $1.05M, delivering to terms (index 0.96).",amt:1050000,a:{Term:"Jan 2026 to Dec 2028",Rate:"$118 per vCPU block","Region tag":"US-East"}},
{id:"V2",t:"con",n:"Lumen Data Partners SOW-4",s:"warn",c:"hypothesis",owner:"Vendor mgmt",story:"$610K data engineering SOW running behind: paid $412K, accepted work worth $390K.",amt:610000,a:{Term:"Mar 2026 to Mar 2027",PO:"PO-77120"}},
{id:"I1",t:"inv",n:"INV-20418 Northwind",s:"good",c:"confirmed",owner:"Invoice Advisor",story:"Matches usage and contract; the advisor recommends approving $184,200.",amt:184200,a:{Due:"Oct 21",Recommendation:"Approve"}},
{id:"I3",t:"inv",n:"INV-20451 Northwind",s:"good",c:"confirmed",owner:"Invoice Advisor",story:"Small storage add-on inside tolerance; eligible to clear on its own.",amt:21400,a:{Due:"Oct 28",Recommendation:"Approve"}},
{id:"I2",t:"inv",n:"INV-20433 Lumen",s:"bad",c:"confirmed",owner:"Invoice Advisor",story:"Milestone 3 is not accepted and paying would overpay accepted work; hold.",amt:62900,a:{Due:"Oct 19",Recommendation:"Hold"}},
{id:"R1",t:"risk",n:"Vendor delivery slip",s:"warn",c:"hypothesis",owner:"Dev Rao",story:"A 40% chance Lumen delays the Taxonomy pilot, worth about $88K of expected loss.",amt:88000,a:{Likelihood:"40%",Impact:"$220,000"}},
{id:"S2",t:"svc",n:"Taxonomy API",s:"good",c:"confirmed",owner:"Data team",story:"Tier 2 service running normally.",a:{Tier:"2",Owner:"Data team"}},
{id:"S1",t:"svc",n:"Codification Portal",s:"warn",c:"confirmed",owner:"Platform team",story:"Tier 1 service hosted by Northwind; 99.62% available against a 99.9% target.",a:{Tier:"1",Hosting:"Northwind"}},
{id:"INC1",t:"inc",n:"Portal latency (Sev 2)",s:"bad",c:"confirmed",owner:"Ops Agent",story:"Editors saw slow pages since 09:12; 140 users affected.",a:{Opened:"Oct 5 09:12",Impact:"140 editors"}},
{id:"K1",t:"kb",n:"Portal failover runbook",s:"warn",c:"unclear",owner:"Knowledge Curator",story:"Last reviewed 14 months ago; a refresh draft is waiting for its owner.",a:{Version:"v7",Reviewed:"14 months ago","Legacy ID":"KB-0031"}}
];
const EDGES=[["O1","P1","advances"],["O2","P1","advances"],["P1","PR1","contains"],["P1","PR2","contains"],["PR1","B1","funded by"],["PR2","B2","funded by"],["B1","V1","committed to"],["B2","V2","committed to"],["V1","I1","billed"],["V1","I3","billed"],["V2","I2","billed"],["PR1","S1","delivers"],["PR2","S2","delivers"],["V1","S1","hosts"],["INC1","S1","affects"],["INC1","K1","resolved by"],["R1","PR2","threatens"],["V2","R1","drives"]];
const TYPES={obj:["Objective","--p1"],port:["Portfolio","--u3"],proj:["Project","--p4"],bud:["Budget line","--w1"],con:["Contract","--s3"],inv:["Invoice","--e4"],svc:["Service","--p5"],inc:["Incident","--e1"],kb:["Knowledge","--u4"],risk:["Risk","--w3"]};
/* attribute roles: story = part of the narrative, metric = measured, none = not in any story or metric */
const ROLE={Owner:"story",Horizon:"story",Budget:"metric",Health:"metric",Projects:"metric",Sponsor:"story",Milestone:"story",Approved:"metric",Committed:"metric",Paid:"metric",Term:"story",Rate:"metric",PO:"story",Due:"story",Recommendation:"story",Likelihood:"metric",Impact:"metric",Tier:"story",Hosting:"story",Opened:"story",Version:"story",Reviewed:"metric"};
const N=id=>NODES.find(n=>n.id===id);
const nbrs=id=>EDGES.filter(e=>e[0]===id||e[1]===id).map(e=>({o:e[0]===id?e[1]:e[0],l:e[2],out:e[0]===id}));

/* ---- process flow: lanes by owner, numbered steps, like the Codification flow ---- */
const LANES=[["strat","Strategy and portfolio","--u3"],["deliv","Delivery (PMO)","--p4"],["fin","Finance","--w1"],["vend","Vendors","--s3"],["ops","Operations","--e4"]];
const STEPS=[
{id:"s1",ln:0,col:0,n:"Set objective",st:"2 objectives, both on track",m:"m_ops",recs:["O1","O2"]},
{id:"s2",ln:0,col:1,n:"Fund portfolio",st:"$2.06M across 2 projects",m:"m_fin",recs:["P1"]},
{id:"s3",ln:1,col:2,n:"Approve project",st:"Codification amber, Taxonomy green",m:"m_delivery",recs:["PR1","PR2"]},
{id:"s4",ln:2,col:3,n:"Commit budget line",st:"B2 is $45K over approved",m:"m_burn",recs:["B1","B2"]},
{id:"s5",ln:3,col:4,n:"Sign contract and PO",st:"2 active vendors",m:"m_vendor",recs:["V1","V2"]},
{id:"s6",ln:3,col:5,n:"Deliver milestone",st:"Lumen milestone 3 at 70%",m:"m_vendor",recs:["R1"]},
{id:"s7",ln:1,col:6,n:"Accept milestone",st:"Acceptance missing for M3",m:"m_delivery",recs:[]},
{id:"s8",ln:2,col:7,n:"Receive invoice",st:"3 invoices, $268,500",m:"m_cycle",recs:["I1","I2","I3"]},
{id:"s9",ln:2,col:8,n:"Approve invoice",st:"Advisor recommends 1 hold",m:"m_auto",agent:true,recs:[]},
{id:"s10",ln:2,col:9,n:"Pay",st:"Payment stays in the AP system",m:null,recs:[]},
{id:"s11",ln:4,col:7,n:"Service live",st:"Portal hosted by Northwind",m:"m_avail",recs:["S1","S2"]},
{id:"s12",ln:4,col:8,n:"Monitor and resolve",st:"1 Sev 2 open for 4 hours",m:"m_mttr",agent:true,recs:["INC1"]},
{id:"s13",ln:4,col:9,n:"Update knowledge",st:"Runbook is 14 months old",m:"m_kb",agent:true,recs:["K1"]}
];
const FLOW=[["s1","s2"],["s2","s3"],["s3","s4"],["s4","s5"],["s5","s6"],["s6","s7"],["s7","s8"],["s8","s9"],["s9","s10"],["s7","s11"],["s11","s12"],["s12","s13"],["s9","s7","rework","hold"],["s13","s3","rework","lessons"]];
/* which steps a record passes and where it sits now */
const PATHS={I2:{steps:["s1","s2","s3","s4","s5","s6","s7","s8","s9"],here:"s9"},I1:{steps:["s1","s2","s3","s4","s5","s6","s7","s8","s9"],here:"s9"},I3:{steps:["s1","s2","s3","s4","s5","s6","s7","s8","s9"],here:"s9"},INC1:{steps:["s3","s7","s11","s12","s13"],here:"s12"},R1:{steps:["s3","s5","s6"],here:"s6"},B2:{steps:["s1","s2","s3","s4"],here:"s4"},PR1:{steps:["s1","s2","s3","s7","s11"],here:"s3"}};

/* ---- invoices with a full ledger ---- */
const INVOICES=[
{id:"INV-20433",vendor:"Lumen Data Partners",contract:"SOW-4 (Taxonomy data engineering)",node:"I2",amt:62900,due:"Oct 19",rec:"hold",conf:.81,
 story:"Lumen billed $62,900 for milestone 3, which is not accepted yet. Accepted work is worth $390,000 but $412,000 is already paid, so paying now overpays by $22,000 and pushes Vendor services further past its approved budget.",
 led:{total:610000,paid:412000,earned:390000},perf:{time:.75,quality:.71,exp:.78},
 months:["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],plan:[40,100,170,240,310,380,450,520,570,610],earn:[40,95,150,210,260,330,390,390],paid:[40,100,170,230,290,350,412,412],
 checks:[["PO match","good","Within PO-77120; $198,000 remains."],["Acceptance","bad","No acceptance record for milestone 3."],["Earned vs paid","bad","Paid is $22,000 above accepted work."],["Budget headroom","bad","Vendor services is over commitment by $45,000."],["Duplicate","good","No similar invoice."],["Vendor risk","warn","Milestone 2 was nine days late."]]},
{id:"INV-20418",vendor:"Northwind Cloud",contract:"MSA (annual hosting commitment)",node:"I1",amt:184200,due:"Oct 21",rec:"approve",conf:.94,
 story:"Northwind billed $184,200 for Q3 hosting. Measured usage through September is $924,200, paid to date is $740,000, so $184,200 is exactly what is due and $125,800 of the commitment remains.",
 led:{total:1050000,paid:740000,earned:924200},perf:{time:.98,quality:.95,exp:.93},
 months:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],plan:[88,175,262,350,437,525,612,700,787,875,962,1050],earn:[90,178,270,360,450,545,640,742,924],paid:[88,175,262,350,437,525,612,740,740,740],
 checks:[["PO match","good","Within the annual commitment."],["Usage receipt","good","September usage report received Oct 3."],["Contract rate","good","$118 per vCPU block matches the MSA."],["Budget headroom","good","FY26 Cloud hosting has $306,000 uncommitted."],["Duplicate","good","No similar invoice in 24 months."],["Vendor risk","good","No open findings."]]},
{id:"INV-20451",vendor:"Northwind Cloud",contract:"Storage add-on order",node:"I3",amt:21400,due:"Oct 28",rec:"approve",conf:.91,
 story:"A $21,400 storage add-on inside the 2% tolerance. Under the current rules it would clear without anyone clicking.",
 led:{total:60000,paid:18000,earned:39400},perf:{time:.98,quality:.95,exp:.93},
 months:["Jun","Jul","Aug","Sep","Oct"],plan:[12,24,36,48,60],earn:[10,20,28,39.4],paid:[10,18,18,18,18],
 checks:[["PO match","good","Inside 2% tolerance."],["Usage receipt","good","Add-on report received."],["Contract rate","good","Matches the order."],["Budget headroom","good","Sufficient."],["Duplicate","good","None."],["Vendor risk","good","None."]]},
{id:"INV-20440",vendor:"Apex Print",contract:"Print services (annual)",node:null,amt:12480,due:"Oct 24",rec:"reject",conf:.88,
 story:"This looks like INV-20391, paid on Sep 12: same vendor, amount and service period. Nothing new has been delivered, so nothing is due.",
 led:{total:48000,paid:31000,earned:31000},perf:{time:.90,quality:.88,exp:.84},
 months:["Jan","Mar","May","Jul","Sep"],plan:[10,20,30,40,48],earn:[8,16,24,31],paid:[8,16,24,31],
 checks:[["PO match","good","PO-76990 is open."],["Delivery note","good","Present."],["Contract rate","good","Matches."],["Budget headroom","good","Within limit."],["Duplicate","bad","92% field match with INV-20391."],["Vendor risk","good","No findings."]]}
];
const vindex=p=>.4*p.time+.3*p.quality+.3*p.exp;
/* history used to back-test auto-approval rules (deterministic) */
const HIST=(()=>{const a=[];let s=7;const r=()=>{s=(s*9301+49297)%233280;return s/233280};
 for(let i=0;i<60;i++){const amt=Math.round(2000+Math.pow(r(),2.2)*190000);a.push({amt,po:r()>.07,rec:r()>.1,dup:r()>.96?.95:r()*.4,risk:r()>.85?"medium":"low",idx:+(.7+r()*.3).toFixed(2),firstTime:r()>.93,overridden:r()>.88})}
 return a})();
const RULES=[
{id:"r1",act:"Auto-approve",cls:"good",amt:25000,idx:.85,risk:"low",dup:50,why:"Small, clean invoices from trusted vendors should not need a person."},
{id:"r2",act:"Hold and ask the project manager",cls:"warn",why:"Billing ahead of accepted work is the most common cause of overpayment."},
{id:"r3",act:"Reject as duplicate",cls:"bad",dup:90,why:"Duplicates are cheaper to stop before payment than to recover."},
{id:"r4",act:"Escalate to the CFO",cls:"info",big:100000,why:"Large payments get a second pair of eyes."}
];

/* ---- people, calendar and First Officer ---- */
const MEET_TYPES={proj:["Project","--p4"],vend:["Vendor","--s3"],ops:["Operations","--e4"],fin:["Finance","--w1"],pers:["Personal","--u3"],board:["Governance","--u1"]};
const MEETINGS=[
{id:"m1",d:5,s:10,e:11,t:"Codification steering group",k:"proj",st:"done",rec:5,auto:4,rev:1,room:"Teams",att:["Maya Ortiz","Dev Rao","Priya Shah","Tom Becker"],link:"PR1",sum:"Kept the Nov 13 beta date, held the next Lumen payment until milestone 3 is accepted, and asked for a hosting cost estimate."},
{id:"m2",d:5,s:14,e:14.5,t:"Northwind vendor sync",k:"vend",st:"done",rec:2,auto:2,rev:0,room:"Webex",att:["Tom Becker","Northwind account team"],link:"V1",sum:"Confirmed September usage and the storage add-on order."},
{id:"m3",d:6,s:9,e:9.5,t:"IT operations daily",k:"ops",st:"done",rec:3,auto:3,rev:0,room:"Teams",att:["Ops team"],link:"INC1",sum:"Portal latency opened as a Sev 2; failover rehearsal scheduled for 16:00."},
{id:"m4",d:6,s:11,e:12,t:"Finance review prep",k:"fin",st:"done",rec:4,auto:3,rev:1,room:"Teams",att:["Tom Becker","Dana (AP lead)"],link:"B2",sum:"Vendor services is $45,000 over commitment; reforecast drafted for approval."},
{id:"m5",d:6,s:15,e:16,t:"Taxonomy hub design review",k:"proj",st:"next",room:"Aspen room (hybrid)",av:"Display wall, 2 mics, Teams room kit booked",att:["Dev Rao","Data team","Lumen engineers"],link:"PR2",pre:"First Officer has a pre-read ready: the pilot depends on the same Lumen staff as the indexer. It will join, take notes and file actions."},
{id:"m6",d:7,s:10,e:11,t:"Change advisory board",k:"ops",st:"next",room:"Teams",att:["CAB members"],link:"S1",pre:"Pre-read: hosting tier change request and its risk score."},
{id:"m7",d:7,s:13,e:13.5,t:"1:1 with Tom Becker",k:"pers",st:"next",room:"Omar's office",att:["Tom Becker"],link:null,pre:"Not part of any project. First Officer will file only the actions you approve."},
{id:"m8",d:8,s:9.5,e:11,t:"Board audit preparation",k:"board",st:"next",room:"Boardroom",av:"Projector, 12 seats, conference phone booked",att:["Executive team"],link:"O2",pre:"Pre-read: Tier 1 availability and vendor index trends."},
{id:"m9",d:8,s:14,e:15,t:"Lumen milestone 3 acceptance",k:"vend",st:"next",room:"Teams",att:["Priya Shah","Lumen delivery lead"],link:"I2",pre:"Outcome decides whether INV-20433 is held or released."},
{id:"m10",d:9,s:11,e:12,t:"Beta readiness check",k:"proj",st:"next",room:"Teams",att:["Priya Shah","Maya Ortiz"],link:"PR1",pre:"Pre-read: open defects against the Nov 13 beta date."},
{id:"m11",d:15,s:13,e:14,t:"Finance review",k:"fin",st:"next",room:"Teams",att:["Finance team"],link:"B1",pre:"Tom Becker brings the hosting tier cost estimate."},
{id:"m12",d:22,s:10,e:11,t:"Beta date review",k:"proj",st:"next",room:"Teams",att:["Steering group"],link:"PR1",pre:"Scheduled by First Officer from the Oct 5 decision."}
];
const EXTRACTED=[
{id:"x1",kind:"Decision",txt:"Hold the next Lumen payment until milestone 3 is accepted",line:2,conf:.9,auto:true,rec:"Links INV-20433 and SOW-4"},
{id:"x2",kind:"Action",txt:"Priya Shah confirms milestone 3 acceptance criteria by Friday",line:3,conf:.95,auto:true,rec:"Task on Codification Platform Upgrade"},
{id:"x3",kind:"Action",txt:"Tom Becker brings the hosting tier estimate to the finance review on the 15th",line:5,conf:.88,auto:true,rec:"Task on FY26 Cloud hosting"},
{id:"x4",kind:"Risk",txt:"Taxonomy pilot slips if Lumen staff stay on the indexer",line:6,conf:.72,auto:false,rec:"Risk on Taxonomy Data Hub, linked to the Lumen risk"},
{id:"x5",kind:"Decision",txt:"Keep the Nov 13 beta date and review again on Oct 22",line:7,conf:.93,auto:true,rec:"Milestone note plus a review meeting"}];
const TRANSCRIPT=[["00:02","Maya","Beta was Nov 4 and we are now saying Nov 13."],["00:41","Dev","The slip is the search indexer. Lumen delivered it nine days late."],["01:30","Maya","Then let's hold the next Lumen payment until milestone 3 is accepted. Priya, can you confirm acceptance criteria by Friday?"],["01:58","Priya","Yes, I'll confirm the criteria by Friday."],["02:40","Tom","Hosting is running hot. A larger tier may cost about $48,000 more this year."],["03:15","Maya","Tom, bring a cost estimate to the finance review on the 15th."],["04:02","Dev","There's a risk the Taxonomy pilot slips if Lumen staff are still on the indexer."],["04:44","Maya","Decision: we keep the Nov 13 beta date and review again Oct 22."]];

/* ---- AI estate ---- */
const AGENTS=[
{id:"fo",n:"First Officer",kind:"Platform agent",prov:"Anthropic",model:"Claude",cap:"meetings",auto:3,runs:42,spend:6.8,cap$:25,hits:1,st:"running",owner:"PMO",tools:["Graph calendar","Transcripts","Records API"],data:["Meetings","Projects"],guards:["No external email without approval","Redact personal data"],act:[0,0,0,0,0,0,1,3,6,5,4,2,3,5,6,4,3,2,1,0,0,0,0,0]},
{id:"ia",n:"Invoice Advisor",kind:"Platform agent",prov:"OpenAI",model:"GPT (council)",cap:"finance",auto:1,runs:18,spend:3.1,cap$:20,hits:0,st:"running",owner:"Finance",tools:["Invoices","POs","Contracts"],data:["Finance"],guards:["Cannot execute payments","Reads only approver-scoped data"],act:[0,0,0,0,0,0,0,2,4,4,3,2,2,2,3,2,1,0,0,0,0,0,0,0]},
{id:"kc",n:"Knowledge Curator",kind:"Platform agent",prov:"Google",model:"Gemini",cap:"knowledge",auto:0,runs:67,spend:2.2,cap$:10,hits:2,st:"running",owner:"Knowledge",tools:["Articles","Search index"],data:["Knowledge"],guards:["Drafts only, owner publishes"],act:[1,1,1,1,1,1,2,3,5,6,6,5,5,4,4,4,3,3,2,2,1,1,1,1]},
{id:"tq",n:"Test Agent",kind:"Platform agent",prov:"Anthropic",model:"Claude (judge: OpenAI)",cap:"testing",auto:2,runs:120,spend:9.4,cap$:15,hits:0,st:"running",owner:"Engineering",tools:["Test runner","Sandbox"],data:["Test data only"],guards:["Sandbox only","Second model validates"],act:[4,4,4,4,4,4,4,5,6,6,6,6,6,6,6,6,5,5,5,4,4,4,4,4]},
{id:"pa",n:"Personal assistant",kind:"Personal agent",prov:"Anthropic",model:"Claude",cap:"personal",auto:1,runs:9,spend:.9,cap$:5,hits:0,st:"running",owner:"You",tools:["Your calendar","Your tasks"],data:["Your scope only"],guards:["Acts as you, never above you"],act:[0,0,0,0,0,0,0,1,2,1,0,1,2,1,0,0,0,0,0,1,0,0,0,0]},
{id:"cp",n:"Copilot in Teams",kind:"Third-party AI",prov:"Microsoft",model:"Microsoft-managed",cap:"external",auto:-1,runs:0,spend:0,cap$:0,hits:0,st:"observed",owner:"Microsoft",tools:["Teams chat"],data:["Observed only"],guards:["Observe only: outside the gateway"],act:[0,0,0,0,0,0,0,1,2,3,2,1,1,2,3,2,1,0,0,0,0,0,0,0]}
];
const AUTO_LEVELS=["Suggest","Draft","Act with approval","Act within rules"];
const SCOPES=[["run","One run","Stops a single execution"],["agent","One agent","Pauses all of an agent's work"],["capability","A capability","Such as every finance agent"],["provider","A provider","Switch off one model vendor"],["tenant","This tenant","Everything for Meridian"],["platform","Platform","Every tenant (operator only)"]];
const SPEND30=[3.2,3.8,3.5,4.1,4.4,3.9,4.8,5.2,4.6,5.0,5.5,5.1,5.9,6.3,5.8,6.1,6.8,6.4,7.0,7.3,6.9,7.6,8.1,7.7,8.4,8.9,8.2,9.0,9.4,9.8];
const EVENTS=[["13:29","good","Invoice Advisor scored INV-20451: approve, 91%"],["13:27","info","First Officer filed 3 records from IT operations daily"],["13:24","warn","Guardrail: redacted a personal phone number in a transcript"],["13:20","good","Test Agent passed 24 of 24 invoice flow checks"],["13:12","bad","Knowledge Curator blocked: output cited no source"],["13:05","info","Forecast Agent drafted a reforecast for FY26 Vendor services"]];
const PROV_SHARE=[["Anthropic",52,"--p4"],["OpenAI",31,"--w1"],["Google",13,"--u3"],["Other",4,"--faint"]];

/* ---- personas: same data, different story ---- */
const PERSONAS={
exec:{n:"Executive",who:"CIO, sees everything that needs a decision",home:["rings","needs","burn","projects","insights"],rings:["m_delivery","m_fin","m_ops"],nav:["home","trace","kg","inv","fo","tower","metrics","loop"],
  story:'Delivery is <b>amber</b> and finance is <b>red</b> for one reason: Lumen is nine days late on the search indexer, so the beta moved to Nov 13 and Vendor services is <b>$45,000</b> over commitment.',
  needs:[{ic:"bad",t:"Release or hold the Lumen payment",d:"Invoice Advisor recommends holding $62,900 until milestone 3 is accepted (Thu 14:00).",go:["inv","INV-20433"],a:"Review"},{ic:"warn",t:"Approve a $48,000 reforecast",d:"Moves hosting contingency to cover a larger tier. Forecast Agent drafted it.",go:["metrics","m_burn"],a:"Open"},{ic:"info",t:"Tier 1 portal is below target",d:"Latency since 09:12; failover rehearsal at 16:00.",go:["trace","INC1"],a:"Trace"}],
  sugg:["Why is the portfolio amber?","Show invoices on hold","What's on my calendar tomorrow?"]},
fin:{n:"Finance approver",who:"AP lead, sees invoices, budgets and cash",home:["needs","rings","burn","insights"],rings:["m_fin","m_cycle","m_auto"],nav:["home","inv","trace","kg","metrics","fo","loop","tower"],
  story:'You have <b>three invoices</b> worth <b>$268,500</b> waiting. Two are clean; one, from Lumen, should be held because it would pay for work nobody has accepted.',
  needs:[{ic:"good",t:"Approve INV-20418 from Northwind",d:"$184,200, all six checks pass, advisor 94% confident.",go:["inv","INV-20418"],a:"Review"},{ic:"bad",t:"Hold INV-20433 from Lumen",d:"Accepted work $390,000, already paid $412,000.",go:["inv","INV-20433"],a:"Review"},{ic:"warn",t:"Reject INV-20440 as a duplicate",d:"92% match with an invoice paid Sep 12.",go:["inv","INV-20440"],a:"Review"}],
  sugg:["Which invoices can clear automatically?","How much have we paid Lumen?","Tune the auto-approval rules"]},
pm:{n:"Project manager",who:"Delivery lead, sees milestones, risks and vendors",home:["needs","projects","rings","insights"],rings:["m_delivery","m_vendor","m_yield"],nav:["home","trace","fo","kg","inv","metrics","loop","tower"],
  story:'The beta moved from Nov 4 to Nov 13 because Lumen delivered the <b>search indexer</b> nine days late. Milestone 3 is <b>70%</b> done and needs acceptance criteria by Friday.',
  needs:[{ic:"warn",t:"Confirm milestone 3 acceptance criteria",d:"Due Friday. First Officer filed this from Monday's steering group.",go:["fo","m9"],a:"Open"},{ic:"info",t:"Prepare the design review at 15:00",d:"A pre-read is ready; the Aspen room is booked with a display wall.",go:["fo","m5"],a:"Open"},{ic:"bad",t:"Taxonomy pilot risk needs an owner",d:"40% chance Lumen staff are still on the indexer.",go:["trace","R1"],a:"Trace"}],
  sugg:["What slipped and why?","Show my meetings this week","Who is the risk owner?"]},
ops:{n:"Service desk lead",who:"Sees incidents, services and knowledge",home:["needs","rings","insights","projects"],rings:["m_ops","m_avail","m_kb"],nav:["home","trace","kg","tower","metrics","fo","loop","inv"],
  story:'The <b>Codification Portal</b> has had a Sev 2 since 09:12 and availability is <b>99.62%</b> against 99.9%. The failover runbook is 14 months old, so a refresh draft is waiting.',
  needs:[{ic:"bad",t:"Portal latency (Sev 2)",d:"140 editors affected. Ops Agent is running RB-031.",go:["trace","INC1"],a:"Trace"},{ic:"warn",t:"Review the failover runbook refresh",d:"Knowledge Curator drafted changes; you own the article.",go:["trace","K1"],a:"Open"},{ic:"info",t:"Change advisory board tomorrow 10:00",d:"Hosting tier change is on the agenda with a risk score.",go:["fo","m6"],a:"Open"}],
  sugg:["Why is the portal slow?","Which articles are stale?","What changed this week?"]}
};
const SCREENS=[["home","Home","M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],["trace","Executive trace","M5 6h4v4H5zM15 6h4v4h-4zM10 14h4v4h-4zM9 8h6M12 10v4"],["inv","Invoice approval","M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"],["fo","First Officer","M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 13h3"],["tower","AI Control Tower","M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7zM9 12l2 2 4-4"],["metrics","Metrics","M4 20V10M10 20V4M16 20v-7M22 20H2"],["kg","Knowledge graph","M4 5h6v4H4zM14 5h6v4h-6zM9 15h6v4H9zM7 9v3h10V9M12 12v3"],["loop","Feedback loop","M20 12a8 8 0 1 1-3-6.2M20 4v4h-4"]];
const AUDIT=[];
const TRENDS=[
{id:"t1",ev:"4 of 6 holds on Lumen invoices were overridden",n:6,who:"Finance approver",idea:"Vendor-specific tolerance so the advisor stops holding invoices that are accepted verbally",st:"Research"},
{id:"t2",ev:"Searches for “milestone acceptance” returned nothing 7 times",n:7,who:"Project manager",idea:"A milestone acceptance view that links work, invoice and payment",st:"Backlog"},
{id:"t3",ev:"Opening the table then filtering to red, 12 times this week",n:12,who:"Executive",idea:"A saved “needs action” view on Home",st:"Backlog"},
{id:"t4",ev:"Agent-drafted knowledge refreshes accepted without edits 9 of 11 times",n:11,who:"Service desk lead",idea:"Raise Knowledge Curator one autonomy level for runbooks",st:"Research"}];
const UNUSED=[["Cost center code","Appears on 3 record types. In no story, no metric, read 0 times in 30 days.","Remove"],["Legacy ID","Carried over from the old system. Read twice in 30 days.","Archive"],["Region tag","Set on contracts only; no report uses it.","Remove"]];

/* ============ Knowledge graph: one graph for standards, policies, procedures, controls, CIs, data, reports ============ */
const KT={std:["Standard","--u1"],par:["Paragraph","--u4"],pol:["Policy","--p4"],sop:["Procedure","--p5"],ctl:["Control","--w1"],ci:["Configuration item","--s3"],dat:["Data element","--p1"],rpt:["Report","--e4"],file:["Source file","--faint"]};
const KGN=[
{id:"std1",t:"std",n:"ASC 842 Leases",owner:"Controller",x:30,y:250,sub:"FASB Codification topic",hrs:0},
{id:"par1",t:"par",n:"842-20-25 Lessee recognition",owner:"Controller",x:215,y:130,sub:"Initial and subsequent measurement",hrs:2},
{id:"par2",t:"par",n:"842-20-50 Disclosures",owner:"Controller",x:215,y:370,sub:"Footnote requirements",hrs:2},
{id:"pol1",t:"pol",n:"Lease accounting policy",owner:"Controller",x:420,y:60,sub:"v4, approved Mar 2026",hrs:6},
{id:"pol2",t:"pol",n:"Capitalization threshold policy",owner:"Controller",x:420,y:190,sub:"v2",hrs:4},
{id:"sop1",t:"sop",n:"Lease classification review",owner:"Accounting manager",x:420,y:300,sub:"Runs at lease inception",hrs:3},
{id:"sop2",t:"sop",n:"Monthly lease amortization close",owner:"Accounting manager",x:420,y:410,sub:"Business day 3",hrs:3},
{id:"ctl1",t:"ctl",n:"Lease inventory completeness",owner:"Internal audit",x:420,y:520,sub:"Quarterly, key control",hrs:4},
{id:"ctl2",t:"ctl",n:"Discount rate approval",owner:"CFO",x:620,y:130,sub:"Per new lease",hrs:4},
{id:"ci1",t:"ci",n:"Lease subledger (ERP)",owner:"Finance systems",x:620,y:300,sub:"Production, tier 2",hrs:8},
{id:"ci2",t:"ci",n:"Contract repository",owner:"Vendor mgmt",x:620,y:450,sub:"Production, tier 2",hrs:6},
{id:"dat1",t:"dat",n:"Lease term",owner:"Finance systems",x:820,y:210,sub:"Field in subledger",hrs:2},
{id:"dat2",t:"dat",n:"Discount rate",owner:"Finance systems",x:820,y:330,sub:"Field in subledger",hrs:2},
{id:"rpt1",t:"rpt",n:"Balance sheet: lease liability",owner:"Controller",x:1010,y:210,sub:"Monthly",hrs:3},
{id:"rpt2",t:"rpt",n:"Lease disclosure footnote",owner:"Controller",x:1010,y:330,sub:"Annual audit",hrs:3},
{id:"f1",t:"file",n:"Lease Accounting Policy v4.docx",owner:"Controller",x:215,y:20,sub:"\\\\fileshare\\Accounting\\Policies",hrs:1,file:true},
{id:"f2",t:"file",n:"Lease classification checklist.xlsx",owner:"Accounting manager",x:215,y:240,sub:"\\\\fileshare\\Accounting\\Checklists",hrs:1,file:true}
];
const KGE=[["std1","par1","contains"],["std1","par2","contains"],["par1","pol1","interpreted in"],["par1","pol2","interpreted in"],["par1","ctl2","drives"],["par2","rpt2","drives"],["pol1","sop1","implemented by"],["pol1","sop2","implemented by"],["pol2","sop1","implemented by"],["pol1","ctl1","enforced by"],["sop1","ci1","performed in"],["sop2","ci1","performed in"],["ctl1","ci2","tested against"],["ctl2","ci1","applied in"],["ci1","dat1","stores"],["ci1","dat2","stores"],["dat1","rpt1","feeds"],["dat2","rpt1","feeds"],["dat1","rpt2","feeds"],["dat2","rpt2","feeds"],["f1","pol1","is the source of"],["f2","sop1","is the source of"],
 /* cross-links into the delivery graph: the same engine reaches contracts, invoices and services */
 ["ci2","V1","holds contract"],["ci2","V2","holds contract"],["S1","K1","documented in"],["S1","INC1","degrades into"]];
const ALLN=()=>[...NODES.map(n=>({...n,x:null})),...KGN];
const ANODE=id=>KGN.find(n=>n.id===id)||NODES.find(n=>n.id===id);
const ALLE=()=>[...EDGES,...KGE,...(window.KG_EXTRA||[])];
const KSCEN=[["std1","FASB amends ASC 842 (hypothetical amendment, effective Jan 1, 2027)"],["ci1","Replace the lease subledger"],["ci2","Contract repository maintenance window"],["S1","Codification Portal major release"],["pol1","Rewrite the lease accounting policy"]];
const TREE=[["Accounting",[["Policies",[["Lease Accounting Policy v4.docx","linked","f1"],["Capitalization Threshold Policy v2.docx","linked","pol2"],["Revenue Recognition Policy v3.docx","unlinked"]]],["Checklists",[["Lease classification checklist.xlsx","linked","f2"],["Month-end close checklist.xlsx","suggest","sop2","Month-end close for leases (88%)"]]],["Standards",[["FASB ASC 842 summary.pdf","suggest","std1","ASC 842 Leases (96%)"],["GASB 87 comparison.pdf","unlinked"]]]]],["Vendor management",[["Lumen SOW-4 signed.pdf","suggest","V2","Lumen Data Partners SOW-4 (93%)"],["Vendor scorecard template.xlsx","unlinked"]]],["IT operations",[["Portal failover runbook v7.docx","linked","K1"],["Change request template.docx","unlinked"]]]];
