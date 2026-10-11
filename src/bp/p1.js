/* ============ Finance module: budgets, financial model, vendors and contracts, benefits, delegation of authority ============ */
(function(){
"use strict";
const FM=["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const D$=money, C$=mk;
const pc=(n,d)=>(Math.round(n*Math.pow(10,d||0))/Math.pow(10,d||0)).toFixed(d||0)+"%";
const iso=d=>d.toISOString().slice(0,10);
const TODAYD=new Date(Date.UTC(2026,9,6));
const dd=s=>new Date(s+"T00:00:00Z");
const dfmt=s=>dd(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
const dshort=s=>dd(s).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const daysTo=s=>Math.round((dd(s)-TODAYD)/864e5);
const addDays=(s,n)=>iso(new Date(dd(s).getTime()+n*864e5));
const CATS=["Labor","Vendor","Hardware","Cloud","Licences"];
const CATC={Labor:"--p4",Vendor:"--u3",Hardware:"--w1",Cloud:"--s3",Licences:"--e4"};
const PRG={PR1:"Digital Publishing",PR2:"Digital Publishing",PR3:"Operational Resilience",PR4:"Records and Contracts"};
const DEPTS=[["ED","Editorial","CC-4411",46],["SD","Standards Development","CC-4450",54],["DO","Data Office","CC-4412",22],["FN","Finance and Legal Operations","CC-4430",18],["IT","IT Operations","CC-4420",31],["MS","Membership and Sales","CC-4460",27]];
const DN=k=>(DEPTS.find(d=>d[0]===k)||[k,k])[1];
const PJ=id=>PROJ.find(p=>p.id===id);
/* ---- budget lines, in thousands of dollars: id, project, category, name, department, approved, committed, actual, forecast, owner, why, fix ---- */
const L0=[
["PR1-LAB","PR1","Labor","Platform, architecture and editor time","ED",400,400,240,408,"Priya Shah","Integration testing needs 1.5 more test-lead FTE for two months.","Absorb by moving the content migration rehearsal two weeks; decide at the Oct 15 steering group."],
["PR1-VEN","PR1","Vendor","Lumen SOW-3 search indexer","ED",250,250,175,262,"Priya Shah","Lumen delivered the indexer 7 work days late and the slip adds $12K of extended engineer time on time and materials.","Tie the remaining SOW-3 payments to accepted milestones and claim a delivery service credit."],
["PR1-CLD","PR1","Cloud","Standards Portal hosting (Northwind)","IT",360,360,190,408,"Tom Becker","After the Oct 5 latency incident the portal needs the next hosting tier, adding $48K over the year.","Fund from the management reserve (request RL-04, waiting for your approval); right-size after the failover rehearsal."],
["PR1-LIC","PR1","Licences","Azure AI Search and M365 add-ons","ED",100,100,68,100,"Priya Shah","",""],
["PR1-HW","PR1","Hardware","Editor test lab devices","IT",90,85,67,84,"Sam Patel","Refurbished displays came in $6K under the estimate.","Release the $6K back to the reserve at project close."],
["PR2-LAB","PR2","Labor","Data engineering and architecture time","DO",150,150,92,150,"Dev Rao","",""],
["PR2-VEN","PR2","Vendor","Lumen SOW-4 taxonomy engineering and CO-2","DO",610,655,412,655,"Dev Rao","Change order CO-2 ($45K) added taxonomy mapping for three more source systems and was signed on Sep 22 without a budget transfer.","Fund from the reserve (request RL-05) and require a budget check before any change order is signed."],
["PR2-CLD","PR2","Cloud","Azure data platform","DO",60,60,30,60,"Dev Rao","",""],
["PR2-LIC","PR2","Licences","Data catalog licences","DO",40,40,24,40,"Dev Rao","",""],
["PR3-LAB","PR3","Labor","Operations engineers and rehearsal weekends","IT",140,140,70,150,"Tom Becker","The failover rehearsal needs a second weekend window with overtime.","Trim the second rehearsal to one weekend if the first passes; review Oct 22."],
["PR3-CLD","PR3","Cloud","Standby region in Azure","IT",90,70,30,100,"Tom Becker","Standby capacity priced $10K above the first estimate.","$15K already drawn from the reserve (RL-03); the last $5K is unfunded."],
["PR3-HW","PR3","Hardware","Standby network gear","IT",40,40,10,40,"Sam Patel","",""],
["PR3-VEN","PR3","Vendor","Northwind resilience consulting","IT",40,40,10,40,"Tom Becker","",""],
["PR4-LAB","PR4","Labor","Architecture, platform and PM time","FN",160,160,40,160,"Maya Ortiz","",""],
["PR4-VEN","PR4","Vendor","Replacement platform implementation (shortlist)","FN",220,0,0,256,"Maya Ortiz","Two shortlisted vendors quote $240K to $272K to migrate; the forecast uses the midpoint.","Negotiate a fixed-price migration near $230K before the selection gate on Oct 30."],
["PR4-LIC","PR4","Licences","Contract repository subscription","FN",100,0,0,100,"Maya Ortiz","",""],
["PR4-CLD","PR4","Cloud","Repository hosting and storage","FN",60,20,20,60,"Maya Ortiz","",""]
].map(r=>({id:r[0],p:r[1],cat:r[2],n:r[3],dept:r[4],appr:r[5]*1e3,comm:r[6]*1e3,act:r[7]*1e3,fcst:r[8]*1e3,own:r[9],why:r[10],fix:r[11]}));
const PLANM=[400,500,520,400,300,250,200,150,90,50,30,20].map(v=>v*1e3);
const ACTM=[380,510,588].map(v=>v*1e3);
const FCPROF=[380,340,290,220,160,110,50,30,15].map(v=>v*1e3);
const BASE_APPR=2910e3;
/* management reserve ledger */
const LED0=[
{id:"RL-01",d:"2026-07-01",t:"open",amt:180000,p:"",line:"",why:"FY27 opening management reserve, held by the CFO for the whole portfolio.",req:"Avery Chen",apr:"CFO",st:"Approved"},
{id:"RL-02",d:"2026-09-02",t:"draw",amt:-14000,p:"PR1",line:"PR1-VEN",why:"Lumen indexer slip (+$12K) and test-lead time (+$8K), net of $6K hardware underspend.",req:"Priya Shah",apr:"Maya Ortiz",st:"Approved"},
{id:"RL-03",d:"2026-09-21",t:"draw",amt:-15000,p:"PR3",line:"PR3-CLD",why:"Standby region quote above estimate after the incident review.",req:"Tom Becker",apr:"Maya Ortiz",st:"Approved"},
{id:"RL-04",d:"2026-10-06",t:"draw",amt:-48000,p:"PR1",line:"PR1-CLD",why:"Next hosting tier after the Oct 5 latency incident. Drafted by the Forecast Agent from the Northwind quote.",req:"Forecast Agent",ai:true,apr:"CIO",st:"Pending"},
{id:"RL-05",d:"2026-10-02",t:"draw",amt:-45000,p:"PR2",line:"PR2-VEN",why:"Lumen change order CO-2 signed above the approved vendor budget.",req:"Dev Rao",apr:"CIO",st:"Pending"}];
/* delegation of authority */
const ROLEH={"Budget owner":"the project's budget owner","Portfolio lead":"Maya Ortiz","CIO":"Casey (CIO)","CFO":"the CFO","CEO":"the CEO","Board finance committee":"the Board finance committee","Controller":"Avery Chen"};
const ROLES=["Budget owner","Portfolio lead","CIO","CFO","CEO","Board finance committee"];
const PROLE={"Maya Ortiz":"Portfolio lead","Casey (CIO)":"CIO","Priya Shah":"Budget owner","Dev Rao":"Budget owner","Tom Becker":"Budget owner","Avery Chen":"Controller"};
const DOA0=[{id:"T1",max:10000,role:"Budget owner"},{id:"T2",max:25000,role:"Portfolio lead"},{id:"T3",max:100000,role:"CIO"},{id:"T4",max:250000,role:"CFO"},{id:"T5",max:1000000,role:"CEO"},{id:"T6",max:Infinity,role:"Board finance committee"}];
const DCATS=["Labor","Vendor services","Hardware","Cloud","Licences","Reserve release","Budget transfer","Contract renewal"];
const CR0=[
{cat:"Vendor services",role:"Procurement",min:25000,why:"Three competitive quotes are required from $25,000."},
{cat:"Vendor services",role:"Legal",min:50000,why:"Contract terms and liability need review from $50,000."},
{cat:"Cloud",role:"FinOps and Architecture",min:25000,why:"Cloud commitments need a sizing and reservation review from $25,000."},
{cat:"Licences",role:"Security and Privacy",min:10000,why:"Software that touches data needs a security and privacy review from $10,000."},
{cat:"Hardware",role:"Architecture",min:25000,why:"Hardware from $25,000 must fit the target architecture."},
{cat:"Labor",role:"HR",min:25000,why:"Contractor engagements from $25,000 need an HR classification check."},
{cat:"Reserve release",role:"Controller",min:0,why:"The Controller posts every reserve ledger entry."},
{cat:"Budget transfer",role:"Both budget owners",min:0,why:"A transfer needs the owners of the giving and receiving budgets."},
{cat:"Contract renewal",role:"Procurement",min:0,why:"Every renewal is benchmarked against market price first."},
{cat:"Contract renewal",role:"Legal",min:50000,why:"Renewals from $50,000 get a terms review."}];
/* vendors, contracts, orders */
const VEND=[
{id:"LUM",n:"Lumen Data Partners",cat:"Search, indexing and data engineering",risk:"Medium",own:"Dev Rao",con:"Hana Weiss",del:.75,qual:.71,resp:.66,be:0,prem:0,tr:[.9,.9,.89,.86,.82,.79,.76,.74],note:"Milestone 2 was nine days late and the indexer slipped seven work days."},
{id:"NWC",n:"Northwind Cloud",cat:"Cloud hosting",risk:"Low",own:"Tom Becker",con:"Rae Lindqvist",del:.98,qual:.95,resp:.91,be:0,prem:0,tr:[.95,.95,.96,.96,.96,.96,.96,.96],note:"Delivering to terms. Availability misses the 99.9% target this quarter."},
{id:"MSF",n:"Microsoft",cat:"M365 E5, Azure and Entra ID",risk:"Low",own:"Jordan Lee",con:"Enterprise account team",del:.96,qual:.93,resp:.84,be:0,prem:0,tr:[.92,.93,.93,.93,.94,.94,.94,.94],note:"Stable. About 11% of E5 seats are unassigned."},
{id:"APX",n:"Apex Print",cat:"Print and mailing services",risk:"Low",own:"Tom Becker",con:"Dale Moreno",del:.90,qual:.88,resp:.80,be:1,prem:0,tr:[.9,.9,.9,.89,.89,.88,.88,.88],note:"One invoice looks like a duplicate of a payment made on Sep 12."},
{id:"CBL",n:"Cobalt Security",cat:"Penetration testing",risk:"Low",own:"Jordan Lee",con:"Mina Okafor",del:.94,qual:.96,resp:.92,be:0,prem:0,tr:[.93,.94,.94,.94,.95,.95,.95,.95],note:"All critical findings reported inside 24 hours."},
{id:"BRT",n:"Brightline Staffing",cat:"Contract engineers",risk:"Medium",own:"Nia Brooks",con:"Pat Hollis",del:.82,qual:.80,resp:.86,be:0,prem:.08,tr:[.85,.84,.84,.83,.83,.82,.82,.82],note:"Rates run 8% above the benchmark."},
{id:"LGD",n:"LegacyDocs Inc.",cat:"Contract Repository support",risk:"High",own:"Maya Ortiz",con:"Support desk",del:.78,qual:.72,resp:.60,be:0,prem:.12,tr:[.82,.8,.79,.77,.76,.75,.75,.74],note:"The legacy product is being replaced by PR4."}];
const VN=id=>VEND.find(v=>v.id===id);
const CON=[
{id:"CT-101",v:"NWC",n:"Northwind Cloud master services agreement",ty:"MSA",s:"2026-01-01",e:"2028-12-31",rn:"2028-12-31",rnTy:"Term end",tcv:3150000,ann:1050000,co:0,ntc:90,auto:true,own:"Tom Becker",proj:"",line:"Run budget RB-IT-HOST",
 sla:[["Monthly availability",99.9,99.62,"%",1],["Sev 1 response",15,12,"min",0],["Ticket resolution",8,6.5,"h",0]],
 obl:[["Meet the $1.05M annual commitment by Dec 31","Tom Becker","2026-12-31",0],["Hold the quarterly business review","Tom Becker","2026-10-28",0],["Northwind sends the usage report by the 5th","Northwind","2026-10-05",1]],
 ms:[["Reserved capacity prepay","2026-03-01",240000,"Paid"],["Q1 usage","2026-04-10",245000,"Paid"],["Q2 usage","2026-07-10",255000,"Paid"],["Q3 usage (INV-20418)","2026-10-21",184200,"Pending"],["Q4 usage, forecast","2027-01-10",125800,"Scheduled"]],inv:["INV-20418"],rate:"$118 per vCPU block"},
{id:"CT-102",v:"NWC",n:"Northwind storage add-on order",ty:"Order form",s:"2026-06-01",e:"2027-05-31",rn:"2027-05-31",rnTy:"Term end",tcv:60000,ann:60000,co:0,ntc:30,auto:true,own:"Tom Becker",proj:"PR1",line:"PR1-CLD",
 sla:[["Monthly availability",99.9,99.95,"%",1],["Provisioning time",24,18,"h",0]],
 obl:[["Review capacity at the quarterly business review","Tom Becker","2026-10-28",0]],
 ms:[["Jun to Aug usage","2026-09-05",18000,"Paid"],["Sep usage (INV-20451)","2026-10-28",21400,"Pending"],["Oct to May usage, estimate","2027-03-01",20600,"Scheduled"]],inv:["INV-20451"],rate:"$118 per vCPU block"},
{id:"CT-103",v:"LUM",n:"Lumen SOW-3 search indexer",ty:"SOW",s:"2026-06-01",e:"2027-01-29",rn:"2027-01-29",rnTy:"Term end",tcv:250000,ann:250000,co:0,ntc:30,auto:false,own:"Priya Shah",proj:"PR1",line:"PR1-VEN",
 sla:[["Milestones on time",90,67,"%",1],["Defects per release",5,7,"",0],["Response to a P1",4,3,"h",0]],
 obl:[["Deliver M3 performance tuning","Lumen","2026-11-20",0],["Provide knowledge transfer to the Platform team","Lumen","2027-01-20",0],["Accept or reject M2 defects list","Priya Shah","2026-10-12",0]],
 ms:[["M1 Design accepted","2026-07-15",50000,"Paid"],["M2 Indexer build, 7 work days late","2026-09-08",125000,"Paid"],["M3 Performance tuning","2026-11-20",50000,"Scheduled"],["M4 Acceptance and handover","2027-01-20",25000,"Scheduled"]],inv:[],rate:"Fixed price"},
{id:"CT-104",v:"LUM",n:"Lumen SOW-4 taxonomy data engineering",ty:"SOW",s:"2026-03-01",e:"2027-03-31",rn:"2027-03-31",rnTy:"Term end",tcv:655000,ann:655000,co:45000,ntc:60,auto:false,own:"Dev Rao",proj:"PR2",line:"PR2-VEN",
 sla:[["Milestones on time",90,67,"%",1],["Defect escape rate",3,4.8,"%",0],["Response to a blocker",4,6.2,"h",0]],
 obl:[["Accept milestone 3 (Thu Oct 8, 14:00)","Priya Shah","2026-10-08",0],["Approve PO for change order CO-2","Casey (CIO)","2026-10-09",0],["Deliver pilot readiness support","Lumen","2026-12-02",0]],
 ms:[["M1 Data model accepted","2026-04-10",122000,"Paid"],["M2 Taxonomy engineering part 1 (9 days late; $22K billed ahead of acceptance)","2026-07-31",290000,"Paid"],["M3 Taxonomy engineering part 2 (INV-20433)","2026-10-19",62900,"On hold"],["M4 Pilot readiness support","2026-12-04",80100,"Scheduled"],["M5 Final acceptance","2027-03-15",55000,"Scheduled"],["CO-2 Mapping for three more sources","2026-12-15",45000,"Pending approval"]],inv:["INV-20433"],rate:"Milestone fixed price"},
{id:"CT-105",v:"MSF",n:"Microsoft Enterprise Agreement (M365 E5, Azure, Entra ID)",ty:"Enterprise agreement",s:"2025-07-01",e:"2028-06-30",rn:"2027-07-01",rnTy:"Annual true-up",tcv:1236000,ann:412000,co:0,ntc:90,auto:true,own:"Jordan Lee",proj:"",line:"Run budget RB-IT-PLAT",
 sla:[["M365 uptime",99.9,99.97,"%",1],["Premier response (Sev A)",60,35,"min",0]],
 obl:[["Report seat usage before the true-up","Jordan Lee","2027-04-02",0],["Entra ID license reconciliation","Sam Patel","2026-11-30",0]],
 ms:[["Year 1","2025-07-01",412000,"Paid"],["Year 2","2026-07-01",412000,"Paid"],["Year 3","2027-07-01",412000,"Scheduled"]],inv:[],rate:"E5 list less 18%",util:["E5 seats assigned",765,860]},
{id:"CT-106",v:"APX",n:"Apex Print annual services",ty:"Services",s:"2026-01-01",e:"2026-12-31",rn:"2026-12-31",rnTy:"Term end",tcv:48000,ann:48000,co:0,ntc:60,auto:true,own:"Tom Becker",proj:"",line:"Run budget RB-OPS-PRINT",
 sla:[["On-time delivery",95,93,"%",1],["Error rate",1,1.4,"%",0]],
 obl:[["Reject duplicate invoice INV-20440","Dana (AP lead)","2026-10-12",0],["Confirm Nov volume","Tom Becker","2026-10-30",0]],
 ms:[["Jan batch","2026-01-31",8000,"Paid"],["Mar batch","2026-03-31",8000,"Paid"],["May batch","2026-05-31",8000,"Paid"],["Jul batch (INV-20391)","2026-09-12",7000,"Paid"],["Sep batch (INV-20440, flagged duplicate)","2026-10-24",12480,"Pending"],["Nov batch","2026-11-30",4520,"Scheduled"]],inv:["INV-20440"],rate:"Per page schedule"},
{id:"CT-107",v:"CBL",n:"Cobalt Security penetration test retainer",ty:"Retainer",s:"2025-11-16",e:"2026-11-15",rn:"2026-11-15",rnTy:"Term end",tcv:36000,ann:36000,co:0,ntc:30,auto:false,own:"Jordan Lee",proj:"",line:"Run budget RB-SEC",
 sla:[["Critical findings reported in 24h",100,100,"%",1],["Report delivery",10,8,"days",0]],
 obl:[["Schedule the Q4 test window","Jordan Lee","2026-10-16",0],["Confirm renewal decision","Jordan Lee","2026-10-16",0]],
 ms:[["Q1 test","2026-02-15",9000,"Paid"],["Q2 test","2026-05-15",9000,"Paid"],["Q3 test","2026-08-15",9000,"Paid"],["Q4 test","2026-11-15",9000,"Scheduled"]],inv:[],rate:"$220 per hour"},
{id:"CT-108",v:"BRT",n:"Brightline Staffing contract engineer MSA",ty:"MSA",s:"2026-02-01",e:"2027-01-31",rn:"2027-01-31",rnTy:"Term end",tcv:180000,ann:180000,co:0,ntc:30,auto:true,own:"Nia Brooks",proj:"",line:"Run budget RB-IT-STAFF",
 sla:[["Time to fill",10,14,"days",0],["Engineer retention",90,88,"%",1]],
 obl:[["Reconcile timesheets to POs","Nia Brooks","2026-10-30",0],["Reprice to benchmark","Nia Brooks","2026-12-15",0]],
 ms:[["Feb to Jun","2026-07-05",84000,"Paid"],["Jul to Sep","2026-10-05",45000,"Paid"],["Oct to Dec, estimate","2027-01-05",36000,"Scheduled"],["January, estimate","2027-02-05",15000,"Scheduled"]],inv:[],rate:"Platform engineer $118 per hour"},
{id:"CT-109",v:"LGD",n:"LegacyDocs Contract Repository support",ty:"Support",s:"2025-04-01",e:"2027-03-31",rn:"2027-03-31",rnTy:"Term end",tcv:192000,ann:96000,co:0,ntc:90,auto:true,own:"Maya Ortiz",proj:"PR4",line:"Run budget RB-LEGAL-REPO",replacedBy:"PR4",
 sla:[["Response to a P1",4,6,"h",0],["Patch cadence",30,45,"days",0]],
 obl:[["Export all contracts for migration","LegacyDocs","2026-12-15",0],["Agree a month-to-month fallback","Maya Ortiz","2026-12-31",0]],
 ms:[["Year 1","2025-04-01",96000,"Paid"],["Year 2, first half","2026-04-01",48000,"Paid"],["Year 2, second half","2026-10-20",48000,"Pending"]],inv:[],rate:"Flat annual fee"}];
const PO0=[
{id:"PO-77120",v:"LUM",ct:"CT-104",d:"Taxonomy engineering (SOW-4)",ord:610000,rec:390000,inv:474900,paid:412000,cBy:"Dev Rao",aBy:"CEO",rBy:"Jordan Lee",st:"Open",line:"PR2-VEN",date:"2026-03-02"},
{id:"PO-77188",v:"LUM",ct:"CT-104",d:"Change order CO-2",ord:45000,rec:0,inv:0,paid:0,cBy:"Dev Rao",aBy:"",rBy:"",st:"Pending approval",line:"PR2-VEN",date:"2026-09-22"},
{id:"PO-77090",v:"LUM",ct:"CT-103",d:"Search indexer (SOW-3)",ord:250000,rec:175000,inv:175000,paid:175000,cBy:"Priya Shah",aBy:"CFO",rBy:"Jordan Lee",st:"Open",line:"PR1-VEN",date:"2026-06-02"},
{id:"PO-76810",v:"NWC",ct:"CT-101",d:"Annual hosting commitment",ord:1050000,rec:924200,inv:924200,paid:740000,cBy:"Tom Becker",aBy:"Board finance committee",rBy:"Sam Patel",st:"Open",line:"Run",date:"2026-01-05"},
{id:"PO-77012",v:"NWC",ct:"CT-102",d:"Storage add-on",ord:60000,rec:39400,inv:39400,paid:18000,cBy:"Tom Becker",aBy:"CIO",rBy:"Sam Patel",st:"Open",line:"PR1-CLD",date:"2026-06-03"},
{id:"PO-77300",v:"MSF",ct:"CT-105",d:"Enterprise agreement year 2",ord:412000,rec:412000,inv:412000,paid:412000,cBy:"Avery Chen",aBy:"CEO",rBy:"Jordan Lee",st:"Closed",line:"Run",date:"2026-06-20"},
{id:"PO-76990",v:"APX",ct:"CT-106",d:"Print services 2026",ord:48000,rec:31000,inv:43480,paid:31000,cBy:"Tom Becker",aBy:"CIO",rBy:"Nia Brooks",st:"Open",line:"Run",date:"2026-01-08"},
{id:"PO-77231",v:"CBL",ct:"CT-107",d:"Penetration test retainer",ord:36000,rec:27000,inv:27000,paid:27000,cBy:"Tom Becker",aBy:"Tom Becker",rBy:"Jordan Lee",st:"Open",line:"Run",date:"2025-11-17"},
{id:"PO-77070",v:"BRT",ct:"CT-108",d:"Contract engineers MSA",ord:180000,rec:129000,inv:129000,paid:129000,cBy:"Maya Ortiz",aBy:"CFO",rBy:"Nia Brooks",st:"Open",line:"Run",date:"2026-02-02"},
{id:"PO-77241",v:"BRT",ct:"CT-108",d:"Extra engineer, two weeks",ord:9000,rec:9000,inv:9000,paid:9000,cBy:"Jordan Lee",aBy:"Priya Shah",rBy:"Sam Patel",st:"Closed",line:"PR1-LAB",date:"2026-09-14"},
{id:"PO-77249",v:"BRT",ct:"CT-108",d:"Extra engineer, two weeks",ord:9500,rec:9500,inv:9500,paid:9500,cBy:"Jordan Lee",aBy:"Priya Shah",rBy:"Sam Patel",st:"Closed",line:"PR1-LAB",date:"2026-09-22"},
{id:"PO-77256",v:"BRT",ct:"CT-108",d:"Extra engineer, two weeks",ord:8800,rec:0,inv:0,paid:0,cBy:"Jordan Lee",aBy:"Priya Shah",rBy:"",st:"Open",line:"PR1-LAB",date:"2026-09-29"},
{id:"PO-77301",v:"LGD",ct:"CT-109",d:"Repository support year 2",ord:96000,rec:48000,inv:48000,paid:48000,cBy:"Maya Ortiz",aBy:"CIO",rBy:"Sam Patel",st:"Open",line:"Run",date:"2026-04-02"}];
/* benefits register. Drivers: hours x rate, fixed dollars, or probability x impact. Quarter index 0 = Jul to Sep 2026. */
const BEN0=[
{id:"BEN-1",p:"PR1",n:"Editors spend less time publishing a standard",ty:"Productivity hours",own:"Chief Editor",drv:{hrs:6400,rate:68},start:3,conf:.7,real:[],ev:"Time study of 14 recent standards: 23 days to publish, target 15.",why:"The beta slipped nine days, so the first hours saved move from January to April."},
{id:"BEN-2",p:"PR1",n:"Retire the legacy codification host and licences",ty:"Cost avoidance",own:"Tom Becker",drv:{amt:142000},start:0,conf:.85,real:[15200],ev:"Decommission ticket CHG-4821 and the July hosting invoice.",why:"One legacy node was switched off early, which saved $15,200 in the first quarter."},
{id:"BEN-3",p:"PR1",n:"More standards sold through faster publication",ty:"Revenue",own:"Membership and Sales",drv:{amt:210000},start:3,conf:.55,real:[],ev:"Sales forecast model: 2.4% more titles at average net margin.",why:"Depends on the beta date and on the comment portal launching, so confidence is the lowest in the register."},
{id:"BEN-4",p:"PR2",n:"Analysts stop reconciling taxonomy by hand",ty:"Productivity hours",own:"Dev Rao",drv:{hrs:5200,rate:72},start:2,conf:.75,real:[],ev:"Analyst timesheet sample, Aug 2026: 430 hours a month on reconciliation.",why:"Starts after the Dec 2 pilot, so it moves if the Lumen work slips."},
{id:"BEN-5",p:"PR2",n:"Fewer data reconciliation errors reach publication",ty:"Risk reduction",own:"Data Office",drv:{pr:.12,imp:600000},start:2,conf:.6,real:[],ev:"Error log: 7 publication corrections in FY26, average $85K each to fix.",why:"Probability is an estimate from the correction log, not a measured result."},
{id:"BEN-6",p:"PR3",n:"Tier 1 portal outages avoided by tested failover",ty:"Risk reduction",own:"Tom Becker",drv:{pr:5.5,imp:26000},start:1,conf:.8,real:[],ev:"Outage log: 5.5 hours a year of Tier 1 downtime, $26K per hour of idle editors and lost sales.",why:"Valid only if the failover rehearsal passes in November."},
{id:"BEN-7",p:"PR3",n:"Operations hours saved by tested runbooks",ty:"Productivity hours",own:"Ops team",drv:{hrs:1100,rate:70},start:0,conf:.85,real:[7100],ev:"Ops timesheets: runbook RB-031 refresh cut incident handling time.",why:"Runbook refresh is 30% done, so the first quarter is below plan."},
{id:"BEN-8",p:"PR4",n:"Staff find contract clauses faster",ty:"Productivity hours",own:"Maya Ortiz",drv:{hrs:2800,rate:75},start:3,conf:.7,real:[],ev:"Legal and finance search log: 3.9 hours a week per person.",why:"Starts after the Jan 11 cutover."},
{id:"BEN-9",p:"PR4",n:"Avoid auto-renewals nobody reviewed",ty:"Cost avoidance",own:"Procurement",drv:{amt:88000},start:0,conf:.8,real:[10300],ev:"Renewal tracker: two auto-renewals stopped in Q1.",why:"The interim renewal tracker is already working ahead of the new repository."},
{id:"BEN-10",p:"PR4",n:"Retire LegacyDocs support contract",ty:"Cost avoidance",own:"Maya Ortiz",drv:{amt:96000},start:3,conf:.9,real:[],ev:"Contract CT-109 ends Mar 31, 2027.",why:"Valid only if the cutover finishes before Mar 31."}];
/* showback: usage shares by department and how each rule is set */
const USE={PR1:{ED:60,SD:30,MS:10},PR2:{DO:35,ED:25,SD:25,MS:15},PR3:{ED:30,SD:20,MS:25,FN:10,DO:5,IT:10},PR4:{FN:55,SD:25,ED:10,IT:10}};
const RUN0={PR1:{cld:120e3,lic:60e3,sup:96e3,ven:0},PR2:{cld:60e3,lic:40e3,sup:96e3,ven:0},PR3:{cld:100e3,lic:0,sup:24e3,ven:0},PR4:{cld:60e3,lic:100e3,sup:40e3,ven:0}};
const COSTPLAN0={PR1:[["Platform engineer",16000,2,6],["Architect",20000,1,4],["Editor subject expert",13000,1,7],["Test lead",15000,1.5,2]],PR2:[["Data engineer",16000,1.5,5],["Architect",20000,.5,3]],PR3:[["Operations engineer",14000,2,5],["Architect",20000,.5,1]],PR4:[["Architect",20000,1,3],["Platform engineer",16000,1,4],["Project manager",18000,.5,4]]};
const SCEN={base:["Base case",1,1,"Plan as approved"],low:["Low case",.7,1.12,"Benefits 30% lower, costs 12% higher"],high:["High case",1.15,.95,"Benefits 15% higher, costs 5% lower"]};
S.bud=S.bud||{
 lines:L0.map(x=>({...x})),led:LED0.map(x=>({...x})),xf:[],doa:DOA0.map(x=>({...x})),crules:CR0.map(x=>({...x})),
 po:PO0.map(x=>({...x})),con:CON.map(x=>({...x,dec:""})),vend:VEND.map(x=>({...x})),ben:BEN0.map(x=>({...x,real:x.real.slice()})),
 mp:{PR1:{pre:0,dev:85,dir:90},PR2:{pre:5,dev:75,dir:90},PR3:{pre:20,dev:20,dir:90},PR4:{pre:70,dev:15,dir:90}},
 cp:JSON.parse(JSON.stringify(COSTPLAN0)),run:JSON.parse(JSON.stringify(RUN0)),
 mproj:"PR1",rate:8,scen:"base",life:5,grow:3,envelope:1400000,
 alloc:{PR1:{driver:"usage"},PR2:{driver:"usage"},PR3:{driver:"headcount"},PR4:{driver:"usage"}},showMode:"showback",
 sim:{amt:75000,cat:"Vendor services",proj:"PR1",req:"Priya Shah",isNew:false,capital:false},
 sel:"",vsel:"VND",benProj:"all",nx:{po:77320,ct:110,vn:8,ben:11,led:6,tr:1}};
const B=()=>S.bud;
const VID=id=>B().vend.find(v=>v.id===id);
const CID=id=>B().con.find(c=>c.id===id);
/* ---- budget arithmetic ---- */
const T=a=>({appr:sum(a,l=>l.appr),comm:sum(a,l=>l.comm),act:sum(a,l=>l.act),fcst:sum(a,l=>l.fcst)});
const LN=id=>B().lines.find(l=>l.id===id);
const PL=p=>B().lines.filter(l=>l.p===p);
const vr=l=>l.fcst-l.appr;
const resBal=()=>sum(B().led.filter(e=>e.st==="Approved"),e=>e.amt);
const resPend=()=>-sum(B().led.filter(e=>e.st==="Pending"&&e.t==="draw"),e=>e.amt);
const resOpen=()=>sum(B().led.filter(e=>e.t==="open"&&e.st==="Approved"),e=>e.amt);
const drawn=p=>-sum(B().led.filter(e=>e.st==="Approved"&&e.t==="draw"&&(!p||e.p===p)),e=>e.amt);
const pendP=p=>-sum(B().led.filter(e=>e.st==="Pending"&&e.t==="draw"&&(!p||e.p===p)),e=>e.amt);
const netOver=()=>{const t=T(B().lines);return t.fcst-t.appr};
const unfunded=()=>netOver()-drawn()-resPend();
const headroom=()=>resBal()-resPend()-Math.max(0,unfunded());
function burn(){const t=T(B().lines),k=t.appr/BASE_APPR,plan=[];let c=0;PLANM.forEach(v=>{c+=v*k;plan.push(c)});
 const act=[];c=0;ACTM.forEach(v=>{c+=v;act.push(c)});
 const left=Math.max(0,t.fcst-t.act),ps=sum(FCPROF,x=>x),fc=[act[act.length-1]];c=fc[0];FCPROF.forEach(v=>{c+=v/ps*left;fc.push(c)});
 return {plan,act,fc,planM:PLANM.map(v=>v*k),fcM:FCPROF.map(v=>v/ps*left)}}
/* ---- ASC 350-40 capitalization ---- */
const capShare=l=>{const m=B().mp[l.p],dev=m.dev/100,dir=m.dir/100;return l.cat==="Labor"?dev*dir:l.cat==="Vendor"?dev:l.cat==="Hardware"?1:0};
const capOf=l=>l.fcst*capShare(l);
const capTot=a=>sum(a,capOf);
const capPlanUsed=()=>capTot(B().lines)/B().envelope*100;
/* ---- delegation of authority ---- */
function tierIdx(amt){const t=B().doa;for(let i=0;i<t.length;i++)if(amt<=t[i].max)return i;return t.length-1}
function holder(role,proj){if(role==="Budget owner")return proj&&PJ(proj)?PJ(proj).owner:"the project's budget owner";return ROLEH[role]||role}
function whoApproves(amt,cat,req,o){o=o||{};const t=B().doa,proj=o.proj||"",why=[],chain=[];let i=tierIdx(amt);const base=i;
 const reqName=req||"the requester";
 let guard=0;
 while(guard++<6){const r=t[i].role,h=holder(r,proj);const same=h===reqName||(r==="CIO"&&reqName==="Casey (CIO)")||(r==="Portfolio lead"&&reqName==="Maya Ortiz");
  if(same&&i<t.length-1){why.push(`${reqName} would be approving their own request, so it moves up to ${t[i+1].role}.`);i++}else break}
 const ap=t[i];
 const revs=[];
 if(amt>=10000)revs.push({role:"Controller",who:"Avery Chen",why:"Confirms the budget line has headroom and posts the commitment."});
 B().crules.filter(c=>c.cat===cat&&amt>=c.min).forEach(c=>revs.push({role:c.role,who:c.role,why:c.why}));
 if(cat==="Vendor services"&&o.isNew)revs.push({role:"Vendor risk",who:"Vendor management",why:"A vendor not yet in the master list needs a risk and insurance check."});
 if(o.capital&&amt>=100000)revs.push({role:"Capital committee",who:"CFO chairs",why:"Capital spend of $100,000 or more is approved as an asset, not an expense."});
 if(cat==="Reserve release"&&amt>=50000)revs.push({role:"CFO informed",who:"CFO",why:"Releases of $50,000 or more are reported to the CFO within a day."});
 const reqRole=PROLE[reqName]||"Requester";
 chain.push({n:reqName,role:reqRole==="Requester"?"Requester":reqRole+" (requester)",why:"Raises the request and cannot approve it.",k:"req"});
 revs.forEach(r=>chain.push({n:r.who,role:r.role+" review",why:r.why,k:"rev"}));
 chain.push({n:holder(ap.role,proj),role:ap.role+" approves",why:`Tier ${ap.id}: requests up to ${ap.max===Infinity?"any amount":D$(ap.max)} are approved by the ${ap.role}${i!==base?" (moved up from "+t[base].role+")":""}.`,k:"apr"});
 if(base===i)why.unshift(`${D$(amt)} falls in tier ${t[base].id} (up to ${t[base].max===Infinity?"any amount":D$(t[base].max)}), so the ${t[base].role} approves.`);
 else why.unshift(`${D$(amt)} falls in tier ${t[base].id} (up to ${D$(t[base].max)}).`);
 if(revs.length)why.push(`${revs.length} review${revs.length>1?"s":""} must finish first: ${revs.map(r=>r.role).join(", ")}.`);
 return {chain,why,tier:ap,idx:i,revs,final:ap.role,fname:holder(ap.role,proj)}}
const CIOIDX=()=>B().doa.findIndex(x=>x.role==="CIO");
const omarCan=(amt,cat,req,o)=>{const r=whoApproves(amt,cat,req,o);return r.idx<=CIOIDX()};
/* ---- vendors, contracts, orders ---- */
const m3=po=>{const tol=.02;if(po.st==="Pending approval")return["Awaiting approval","info"];if(!po.inv&&!po.rec)return["Awaiting receipt","info"];if(po.inv>po.ord)return["Over PO","bad"];if(po.inv>po.rec*(1+tol)+1)return["Invoice ahead of receipt","bad"];if(po.rec>po.inv*(1+tol)+1)return["Receipt not invoiced","warn"];return["Matched","good"]};
const poV=v=>B().po.filter(p=>p.v===v);
const vSpend=v=>({ord:sum(poV(v),p=>p.ord),paid:sum(poV(v),p=>p.paid),rec:sum(poV(v),p=>p.rec),inv:sum(poV(v),p=>p.inv)});
function vScore(v){const s=vSpend(v.id),cs=B().con.filter(c=>c.v===v.id),orig=sum(cs,c=>c.tcv-c.co),coP=orig?sum(cs,c=>c.co)/orig:0,unearn=s.paid?Math.max(0,(s.paid-s.rec)/s.paid):0;
 const cost=Math.max(0,1-2*coP-unearn-.05*v.be-v.prem);const sc=.3*v.del+.3*v.qual+.2*cost+.2*v.resp;return {cost,coP,unearn,sc}}
function slaMiss(c){return c.sla.filter(s=>s[4]?s[2]<s[1]:s[2]>s[1])}
function recommend(c){const v=VID(c.v),vs=vScore(v),miss=slaMiss(c),ev=[],sc=vs.sc;
 const facts=[`Vendor scorecard ${sc.toFixed(2)} against the 0.75 watch line`];
 if(miss.length)facts.push(`${miss.length} of ${c.sla.length} SLAs missed (${miss.map(m=>m[0]).join(", ")})`);else facts.push(`All ${c.sla.length} SLAs met`);
 if(v.be)facts.push(`${v.be} billing error on record`);if(v.prem)facts.push(`Rates ${Math.round(v.prem*100)}% above benchmark`);if(c.co)facts.push(`Change orders add ${pc(c.co/(c.tcv-c.co)*100,1)} to the original value`);
 if(c.util)facts.push(`${c.util[0]}: ${c.util[1]} of ${c.util[2]} (${Math.round(c.util[1]/c.util[2]*100)}%)`);
 let act,conf,line;
 if(c.replacedBy){act="Replace";conf=.9;line="Do not renew. Ask for a three-month month-to-month fallback at today's rate in case the cutover slips.";facts.push("PR4 cutover starts Jan 11, 2027 and decommissioning finishes before the contract ends")}
 else if(sc<.65){act="Replace";conf=.78;line="Start a competitive bid now so a replacement is ready by the end date."}
 else if(sc<.78||miss.length>=2||v.be||v.prem>.05){act="Renegotiate";conf=.74+Math.min(.12,miss.length*.04);line=c.v==="LUM"?"Tie every remaining payment to an accepted milestone, add a service credit for late work, and cap change orders at 5%.":c.v==="APX"?"Add a duplicate-billing clause and a volume floor, and right-size the annual value to the usage trend.":c.v==="BRT"?"Reprice to the benchmark rate card before the notice date.":"Open negotiation on the missed service levels."}
 else if(c.util&&c.util[1]/c.util[2]<.92){act="Renegotiate";conf=.8;line=`Right-size ${c.util[0].toLowerCase()} at the true-up and drop the ${c.util[2]-c.util[1]} unused seats.`}
 else{act="Renew";conf=.88;line="Renew on the same terms. No finding justifies the cost of a switch."}
 return {act,conf,line,facts,cls:act==="Renew"?"good":act==="Replace"?"bad":"warn"}}
const notice=c=>addDays(c.rn,-c.ntc);
const winEnd=iso(new Date(Date.UTC(2027,9,5)));
const inWin=c=>c.rn<=winEnd&&c.rn>=iso(TODAYD);
const undecided=()=>B().con.filter(c=>inWin(c)&&!c.dec&&daysTo(notice(c))<=90);
/* ---- benefits ---- */
const annual=b=>b.drv.hrs?b.drv.hrs*b.drv.rate:b.drv.pr?b.drv.pr*b.drv.imp:b.drv.amt;
const planQ=(b,i)=>i<b.start?0:(i<b.start+2?.5:1)*annual(b)/4;
const qLab=i=>"Q"+(i%4+1)+" FY"+(27+Math.floor(i/4));
const qMon=i=>["Jul to Sep","Oct to Dec","Jan to Mar","Apr to Jun"][i%4]+" "+(2026+Math.floor((i+2)/4));
const CURQ=1;
const benToDate=()=>({plan:sum(B().ben,b=>planQ(b,0)),real:sum(B().ben,b=>b.real[0]||0)});
const benFY=(p,y,sc)=>sum(B().ben.filter(b=>!p||p==="all"||b.p===p),b=>sum([0,1,2,3],k=>planQ(b,y*4+k)))*SCEN[sc||B().scen][1];
