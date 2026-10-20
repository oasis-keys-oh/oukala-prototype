/* ================================================================ WORKFLOW MODEL (v2) */
const NW=176,NH=72,LH=176,LW=132,GX=44,CW=NW+GX;
const NTY={
 trigger:{l:"Trigger",mode:"control",c:"--p6",d:"M13 2L4 14h7l-1 8 9-12h-7z",note:"Starts the workflow: event, schedule, record change, catalog request, email or API call"},
 human:{l:"Human task",mode:"human",c:"--u3",d:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",note:"A person does the work and reports an outcome"},
 approval:{l:"Approval",mode:"human",c:"--w1",d:"M5 12l5 5 9-10",note:"A person with authority decides; assessments can gate or advise"},
 assessment:{l:"Assessment",mode:"human",c:"--w3",d:"M9 4h6v3H9zM7 5.5H6v14.5h12V5.5h-1M9 12h6M9 16h4",note:"Questions and scoring: a required gate or advisory input"},
 agent:{l:"Agentic action",mode:"agentic",c:"--p4",d:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",note:"An AI agent with a goal, tools, guardrails and a human fallback"},
 auto:{l:"Deterministic action",mode:"deterministic",c:"--s3",d:"M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3",note:"API call, script, field update, create record or notification"},
 decision:{l:"Decision",mode:"deterministic",c:"--s4",d:"M12 3l9 9-9 9-9-9z",note:"Branch on conditions or a decision table"},
 wait:{l:"Wait or timer",mode:"control",c:"--p3",d:"M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",note:"Pause for time or an event, with an SLA"},
 parallel:{l:"Parallel gateway",mode:"control",c:"--u4",d:"M12 4v16M4 12h16",note:"Fork into parallel paths, or join them"},
 loop:{l:"Loop",mode:"control",c:"--u1",d:"M4 12a8 8 0 0 1 14-5l2-2v6h-6M20 12a8 8 0 0 1-14 5l-2 2v-6h6",note:"Repeat the body for each item or until a condition holds"},
 subflow:{l:"Sub-flow",mode:"control",c:"--p2",d:"M4 5h7v5H4zM13 14h7v5h-7zM11 7.5h4v9",note:"Run another workflow; collapse it on the canvas"},
 end:{l:"End",mode:"control",c:"--e4",d:"M7 7h10v10H7z",note:"Finish with an outcome so reports can count it"}
};
const PAL=["trigger","human","approval","assessment","agent","auto","decision","wait","parallel","loop","subflow","end"];
const MODES={human:["Human","--u3"],agentic:["Agentic","--p4"],deterministic:["Deterministic","--s3"],control:["Control","--muted"]};
const DAKIND={human:"human",approval:"human",assessment:"human",agent:"agentic",auto:"deterministic",decision:"deterministic"};
const WORKT=["human","approval","assessment","agent","auto","decision"];
const TRIG=[["record","Record change"],["catalog","Catalog request"],["event","Event"],["schedule","Schedule"],["email","Email received"],["api","API call"]];
const OPS_A=["Call REST API","Run script","Update fields","Create record","Send notification","Place payment hold","Release payment","Create Entra ID account","Assign M365 license","Schedule in change calendar","Post journal to ERP","Create project in Planner"];
function outs(n){const a=n.a||{},t=n.t;let o;
 if(t==="end")return[];
 if(t==="approval")o=a.allowReturn===false?["Approved","Rejected"]:["Approved","Rejected","Returned"];
 else if(t==="assessment")o=a.gate==="advisory"?["next"]:["Pass","Fail"];
 else if(t==="decision"){o=a.mode==="dmn"?dmnPorts(a.dmn,a.col).concat(["No match"]):(a.branches||[]).map(b=>b.label).concat(["Else"])}
 else if(t==="loop")o=["Each","Done"];
 else o=["next"];
 if(["human","agent","auto","subflow","wait"].includes(t)&&n.p&&n.p.params&&n.p.params.onError==="path")o=o.concat(["Error"]);
 return o}
function dmnPorts(id,col){const t=F.dmn&&F.dmn.find(x=>x.id===id);if(!t)return[];const oi=Math.max(0,t.outputs.findIndex(o=>o.k===col));const s=[];t.rows.forEach(r=>{const v=String(r.o[oi]||"").trim();if(v&&!s.includes(v))s.push(v)});return s}
const modeOf=n=>NTY[n.t].mode;
const dClass=n=>DAKIND[n.t]||null;
const blankP=()=>({inputs:[],outputs:[],skip:{j:"AND",rules:[],groups:[]},entry:{j:"AND",rules:[],groups:[]},params:{timeout:"",retries:0,backoff:"none",onError:"stop",comp:"",idem:false},asg:{kind:"team",team:"",person:"",skills:[],mode:"claim"},tg:{sla:"",ola:"",xla:"",dur:0,costMode:"fixed",cost:0,rate:0,effort:0},vis:{show:false,label:"",desc:""},guard:{audit:true,pii:false,evidence:false,note:""}});
const A0={
 trigger:()=>({src:"record",ev:"Record created",filter:"",sched:"",key:""}),
 human:()=>({instr:"",form:"",outcomes:["Done"]}),
 approval:()=>({mode:"any",quorum:1,approvers:[],tiers:"fixed",amountField:"",onTimeout:"Escalate to manager",allowReturn:true,asm:[]}),
 assessment:()=>({type:"asm_sec",gate:"gate",pass:60,sme:[]}),
 agent:()=>({agent:"Invoice Advisor",goal:"",tools:[],maxSteps:8,conf:75,autonomy:"propose",fallback:"",risk:"low",writes:false,cap:.5}),
 auto:()=>({op:"Update fields",endpoint:"",method:"POST",script:"",target:"",fields:"",chan:"Teams",to:"",msg:""}),
 decision:()=>({mode:"rules",branches:[{id:"b1",label:"Yes",c:{j:"AND",rules:[],groups:[]}}],dmn:"",col:""}),
 wait:()=>({kind:"timer",dur:"PT24H",until:"",ev:""}),
 parallel:()=>({kind:"fork"}),
 loop:()=>({over:"",max:10,until:""}),
 subflow:()=>({ref:"",name:""}),
 end:()=>({outcome:"Completed"})};
const NEWNAME={trigger:"Start",human:"New task",approval:"Approval",assessment:"Assessment",agent:"Agent step",auto:"Action",decision:"Decision",wait:"Wait",parallel:"Fork",loop:"For each item",subflow:"Sub-flow",end:"End"};
function mkNode(id,t,n,l,x,r,a,p){const P=blankP();if(p)Object.keys(p).forEach(k=>{P[k]=Array.isArray(p[k])||typeof p[k]!=="object"||p[k]===null?p[k]:Object.assign(P[k]||{},p[k])});
 const A=Object.assign(A0[t](),a||{});return{id,t,n,l,x,r:r||0,g:null,a:A,p:P}}
const laneTop=i=>i*LH;
const nodeY=n=>laneTop(n.l)+12+(n.r||0)*(NH+10);
const colX=c=>LW+30+c*CW;
const mkFlowBase=(id,name,desc,o)=>Object.assign({id,name,desc:desc||"",kind:"approval",owner:"Nia Brooks",service:"",table:"",lanes:[],nodes:[],edges:[],groups:[],vars:[],ver:1,pub:null,dirty:true,history:[],src:"designer",srcId:"",std:["bpmn"],vis:[],_v:0,undo:[],redo:[]},o||{});
/* compact builder: nodes [id,t,name,lane,col,row,a,p]; edges [from,to,port] */
function BF(id,name,desc,o,nodes,edges,groups){const f=mkFlowBase(id,name,desc,o);f.nodes=nodes.map(a=>{const n=mkNode(a[0],a[1],a[2],a[3],colX(a[4]),a[5],a[6],a[7]);return n});
 f.edges=edges.map((e,i)=>({id:"e"+i+"_"+id,f:e[0],p:e[2]||"next",t:e[1]}));f.edges.forEach(e=>{const n=f.nodes.find(x=>x.id===e.f);if(n&&e.p==="next"&&!outs(n).includes("next"))e.p=outs(n)[0]});
 if(groups)f.groups=groups;return f}
const C1=(j,...rs)=>({j,rules:rs.map(r=>({f:r[0],o:r[1],v:r[2],vt:r[3]||"lit"})),groups:[]});
const nodeById=(f,id)=>f.nodes.find(n=>n.id===id);
function touch(f){adopt(f);f._v++;f.dirty=true;if(f.pub!=null&&f.ver===f.pub)f.ver++}
function adopt(f){if(!F.W.includes(f)){F.W.push(f);if(F.cache)delete F.cache[f.id]}}
/* ---- seeded workflows ---- */
function seedInvoice(){const f=BF("wf_inv","Invoice approval with hold logic","Routes every invoice by a decision table. Holds Lumen-style invoices until milestone acceptance is recorded, so a $22,000 overpayment cannot repeat.",{kind:"purchase",owner:"Avery Chen",service:"Finance systems",table:"invoice",std:["bpmn","itil5"],lanes:[{n:"Accounts payable"},{n:"AI agents"},{n:"Project manager"},{n:"Controller and CIO"},{n:"Finance systems"}]},[
 ["T1","trigger","Invoice received",4,0,0,{src:"event",ev:"Invoice received (ERP)",filter:"vendor is not internal"},{tg:{sla:"",dur:0},vis:{show:true,label:"We received your invoice"}}],
 ["A1","auto","Three-way match",4,1,0,{op:"Call REST API",endpoint:"/erp/odata/match",method:"POST"},{inputs:[{name:"po",type:"text",src:"pill",val:"rec.po"},{name:"amount",type:"num",src:"pill",val:"rec.amount"}],outputs:[{name:"match_result",type:"enum",desc:"Match, Mismatch or Missing"}],params:{timeout:"PT30S",retries:3,backoff:"exponential",onError:"path",idem:true},tg:{dur:.05,cost:.02,sla:"1 min"}}],
 ["AG1","agent","Invoice Advisor check",1,2,0,{agent:"Invoice Advisor",goal:"Compare billed amount with accepted work and paid-to-date; recommend approve, hold or reject with sources.",tools:["Invoices","POs","Contracts","Earned value calculator"],autonomy:"propose",conf:75,maxSteps:8,fallback:"Accounts payable",risk:"medium",cap:.4},{inputs:[{name:"invoice",type:"text",src:"pill",val:"rec.id"},{name:"accepted",type:"num",src:"pill",val:"rec.accepted_work"}],outputs:[{name:"recommendation",type:"text",desc:"approve, hold or reject"},{name:"confidence",type:"num",desc:"0 to 1"}],params:{timeout:"PT2M",retries:2,backoff:"fixed",onError:"path"},asg:{kind:"agent",person:"Invoice Advisor"},tg:{dur:.02,cost:.38,sla:"5 min",xla:"Recommendation explained in plain words"}}],
 ["D1","decision","Route by invoice rules",4,3,0,{mode:"dmn",dmn:"dt_inv",col:"decision"},{inputs:[{name:"amount",type:"num",src:"pill",val:"rec.amount"},{name:"po",type:"text",src:"pill",val:"A1.match_result"},{name:"risk",type:"text",src:"lit",val:"Medium"},{name:"accepted",type:"text",src:"formula",val:"if({{rec.accepted_work}}>={{rec.amount}},'Yes','No')"}],tg:{dur:0,sla:"instant"}}],
 ["A3","auto","Schedule payment",4,4,0,{op:"Update fields",target:"invoice",fields:"status = approved\npay_on = due"},{params:{retries:3,backoff:"exponential",onError:"path"},tg:{dur:.02,cost:.02}}],
 ["AP1","approval","Controller approval",3,4,1,{approvers:["Controller"],tiers:"doa",amountField:"rec.amount",onTimeout:"Route to delegate",asm:[{type:"asm_vend",mode:"advisory"}]},{asg:{kind:"team",team:"Finance"},tg:{sla:"24 h",ola:"8 h",dur:3,effort:.25,rate:72,costMode:"hourly"},vis:{show:true,label:"Waiting for finance approval"}}],
 ["AP2","approval","CIO co-approval",3,5,0,{mode:"seq",approvers:["CIO"],onTimeout:"Escalate to manager"},{asg:{kind:"person",person:"Casey Rowan"},tg:{sla:"48 h",dur:6,effort:.1,rate:150,costMode:"hourly"},entry:{j:"AND",rules:[{f:"rec.amount",o:">",v:"50000",vt:"lit"}],groups:[]}}],
 ["A4","auto","Release payment in ERP",4,6,0,{op:"Release payment",endpoint:"/erp/payments",method:"POST"},{params:{retries:3,backoff:"exponential",onError:"path",comp:"Place payment hold (reverse)",idem:true},tg:{dur:.02,cost:.05}}],
 ["A2","auto","Place payment hold",4,4,2,{op:"Place payment hold",endpoint:"/erp/holds"},{params:{retries:3,backoff:"fixed",onError:"path",comp:"Release hold"},tg:{dur:.02,cost:.03}}],
 ["H1","human","Project manager confirms acceptance",2,5,0,{instr:"Confirm the milestone was accepted and attach the acceptance record.",form:"Milestone acceptance",outcomes:["Accepted","Not accepted"]},{asg:{kind:"person",person:"Priya Shah",skills:["Vendor management"]},outputs:[{name:"accepted",type:"bool",desc:"Acceptance recorded"}],tg:{sla:"3 d",ola:"2 d",dur:20,effort:.5,rate:95,costMode:"hourly",xla:"Requester told within 1 day"},vis:{show:true,label:"Waiting for the project manager to confirm acceptance"}}],
 ["W1","wait","Wait for acceptance",2,6,1,{kind:"event",ev:"Milestone accepted",dur:"P5D"},{tg:{sla:"5 d",dur:48}}],
 ["AS1","assessment","Vendor risk assessment",0,3,1,{type:"asm_vend",gate:"gate",pass:55,sme:["Maya Ortiz"]},{tg:{sla:"2 d",dur:6,effort:.5,rate:95,costMode:"hourly"},entry:{j:"AND",rules:[{f:"rec.vendor",o:"contains",v:"Lumen",vt:"lit"}],groups:[]}}],
 ["N1","auto","Return invoice to vendor",0,6,0,{op:"Send notification",chan:"Email",to:"Vendor contact",msg:"Invoice {{rec.id}} was returned. Reason: {{AP1.comment}}"},{tg:{dur:.02,cost:.01},vis:{show:true,label:"We sent your invoice back"}}],
 ["E1","end","Paid",4,7,0,{outcome:"Completed"},{}],
 ["E2","end","Rejected",0,7,0,{outcome:"Rejected"},{}],
 ["E3","end","Held pending acceptance",2,7,1,{outcome:"Held pending acceptance"},{}],
 ["N9","auto","Alert flow owner",4,2,1,{op:"Send notification",chan:"Teams",to:"Flow owner",msg:"Match step failed for {{rec.id}}"},{}],
 ["E9","end","Escalated",4,3,1,{outcome:"Escalated"},{}]
],[["T1","A1"],["A1","AG1"],["A1","N9","Error"],["N9","E9"],["AG1","D1"],["D1","A3","Auto-approve"],["D1","AP1","Single approval"],["D1","AP2","Dual approval"],["D1","A2","Hold until accepted"],["D1","N1","Reject to vendor"],["D1","AS1","Hold for vendor review"],["D1","A2","No match"],
 ["A3","E1"],["AP1","A4","Approved"],["AP1","N1","Rejected"],["AP1","H1","Returned"],["AP2","A4","Approved"],["AP2","N1","Rejected"],["AS1","AP1","Pass"],["AS1","N1","Fail"],["A4","E1"],["A2","H1"],["H1","W1","Not accepted"],["H1","D1","Accepted"],["W1","E3"],["N1","E2"],["AG1","D1"]]);
 f.edges=f.edges.filter((e,i,a)=>a.findIndex(x=>x.f===e.f&&x.t===e.t&&x.p===e.p)===i);
 f.ver=4;f.pub=3;f.dirty=false;f.history=[{v:3,st:"published",by:"Avery Chen",at:"Sep 22",note:"Added the Lumen hold branch and the acceptance check",snap:null},{v:2,st:"published",by:"Nia Brooks",at:"Aug 14",note:"Split auto-approval from controller approval at $50,000",snap:null},{v:1,st:"published",by:"Avery Chen",at:"Jun 30",note:"First version: one approver for every invoice",snap:null}];
 f.vars=[{name:"retry_count",type:"num",init:"0"}];f.vis=["T1","A1","AP1","H1","N1"];return f}
function seedVendor(){return BF("wf_vend","Vendor onboarding with security assessment gate","A new vendor cannot be approved until the security assessment is complete and passes. The privacy impact assessment is advisory input for the approver.",{kind:"purchase",owner:"Rina Okafor",service:"Contract Repository",table:"contract_line",lanes:[{n:"Requester"},{n:"Security"},{n:"Procurement and legal"},{n:"AI agents"},{n:"Approvers"}]},[
 ["T1","trigger","Vendor request submitted",0,0,0,{src:"catalog",ev:"Catalog request: New vendor"},{}],
 ["AG1","agent","Gather vendor evidence",3,1,0,{agent:"Contract Analyst",goal:"Collect SOC 2 report, ISO certificates, sanctions screening and public breach history; prefill the security assessment.",tools:["Contracts","Search index","Articles"],autonomy:"suggest",conf:70,risk:"low"},{outputs:[{name:"evidence_pack",type:"text",desc:"Links and extracts"},{name:"prefill_confidence",type:"num",desc:"0 to 1"}],tg:{dur:.05,cost:.42,sla:"10 min"}}],
 ["AS1","assessment","Security assessment (required gate)",1,2,0,{type:"asm_sec",gate:"gate",pass:70,sme:["Rina Okafor"]},{tg:{sla:"3 d",ola:"2 d",dur:10,effort:1.5,rate:110,costMode:"hourly"},vis:{show:true,label:"Security review"}}],
 ["AS2","assessment","Privacy impact (advisory)",1,2,1,{type:"asm_priv",gate:"advisory",pass:60,sme:["Rina Okafor"]},{tg:{sla:"3 d",dur:8,effort:1,rate:110,costMode:"hourly"}}],
 ["PX","parallel","Join assessments",1,3,0,{kind:"join"},{}],
 ["H1","human","Legal reviews terms",2,4,0,{instr:"Review MSA and data protection terms against the playbook.",outcomes:["Terms agreed","Needs negotiation"]},{asg:{kind:"team",team:"Legal"},tg:{sla:"5 d",dur:24,effort:2,rate:140,costMode:"hourly"}}],
 ["AP1","approval","Vendor approval",4,5,0,{mode:"quorum",quorum:2,approvers:["CIO","Security lead","Procurement lead"],asm:[{type:"asm_sec",mode:"gate"},{type:"asm_priv",mode:"advisory"}],tiers:"doa",amountField:"rec.target"},{tg:{sla:"48 h",dur:12},vis:{show:true,label:"Waiting for vendor approval"}}],
 ["A1","auto","Create vendor record in ERP",3,6,0,{op:"Create record",target:"vendor"},{params:{retries:3,backoff:"exponential",onError:"path"},tg:{dur:.03,cost:.03}}],
 ["E1","end","Vendor approved",0,7,0,{outcome:"Completed"},{}],["E2","end","Declined",0,6,1,{outcome:"Rejected"},{}]
],[["T1","AG1"],["AG1","AS1"],["AG1","AS2"],["AS1","PX","Pass"],["AS1","E2","Fail"],["AS2","PX"],["PX","H1"],["H1","AP1"],["AP1","A1","Approved"],["AP1","E2","Rejected"],["A1","E1"]])}
function seedHire(){const f=BF("wf_hire","New hire onboarding","Starts when HR marks an offer accepted. Accounts, licenses and equipment run in parallel; Day 1 welcome waits for the start date.",{kind:"onboarding",owner:"Tom Becker",service:"Identity (Entra ID)",table:"person",lanes:[{n:"HR"},{n:"Identity team"},{n:"Service desk"},{n:"Hiring manager"},{n:"AI agents"}]},[
 ["T1","trigger","Offer accepted",0,0,0,{src:"event",ev:"Hire accepted (HR system)"},{}],
 ["F1","parallel","Fork provisioning",1,1,0,{kind:"fork"},{}],
 ["A1","auto","Create Entra ID account",1,2,0,{op:"Create Entra ID account"},{params:{retries:3,backoff:"exponential",onError:"path"},tg:{dur:.05,cost:.05}}],
 ["A2","auto","Assign M365 E5 license",1,3,0,{op:"Assign M365 license"},{params:{retries:3,backoff:"exponential",onError:"stop"},tg:{dur:.02,cost:.4}}],
 ["S1","subflow","Provision laptop",2,2,1,{ref:"wf_laptop",name:"Provision laptop"},{tg:{sla:"3 d",dur:40,cost:18}}],
 ["AP1","approval","Manager confirms equipment",3,2,0,{approvers:["Requester's manager"],onTimeout:"Remind every 4 hours"},{tg:{sla:"2 d",dur:10,effort:.1,rate:90,costMode:"hourly"}}],
 ["AG1","agent","Draft welcome plan",4,3,1,{agent:"First Officer",goal:"Draft a first-week plan from the role and team calendar.",tools:["Teams post"],autonomy:"propose",risk:"low"},{tg:{dur:.03,cost:.2}}],
 ["J1","parallel","Join",1,4,0,{kind:"join"},{}],
 ["W1","wait","Wait until start date",0,5,0,{kind:"until",until:"start_date"},{}],
 ["A3","auto","Day 1 welcome",0,6,0,{op:"Send notification",chan:"Teams",to:"New hire",msg:"Welcome. Your checklist is ready."},{vis:{show:true,label:"Welcome message sent"}}],
 ["E1","end","Completed",0,7,0,{outcome:"Completed"},{}]
],[["T1","F1"],["F1","A1"],["F1","S1"],["F1","AP1"],["A1","A2"],["A2","J1"],["S1","J1"],["AP1","J1","Approved"],["AP1","J1","Rejected"],["AP1","J1","Returned"],["F1","AG1"],["AG1","J1"],["J1","W1"],["W1","A3"],["A3","E1"]]);return f}
function seedDemand(){return BF("wf_dem","Demand intake to project","From a one-page idea to a baselined project. A change-risk assessment is advisory; the portfolio board may override it with a reason.",{kind:"approval",owner:"Maya Ortiz",service:"Portfolio",table:"project",lanes:[{n:"Requester"},{n:"AI agents"},{n:"Finance"},{n:"Portfolio board"},{n:"PMO"}]},[
 ["T1","trigger","Demand submitted",0,0,0,{src:"event",ev:"Demand submitted"},{vis:{show:true,label:"Idea received"}}],
 ["AG1","agent","Score value, risk and fit",1,1,0,{agent:"Forecast Agent",goal:"Score the demand on value, risk and strategic fit using the portfolio rubric.",tools:["Scenario model","Contracts"],autonomy:"suggest",conf:70},{outputs:[{name:"score",type:"num",desc:"0 to 100"}],tg:{dur:.03,cost:.6}}],
 ["D1","decision","Score at least 60?",1,2,0,{mode:"rules",branches:[{id:"b1",label:"Strong",c:C1("AND",["AG1.score",">=","60"])}]},{}],
 ["H1","human","Requester revises",0,3,1,{outcomes:["Resubmitted","Parked"]},{tg:{sla:"5 d",dur:48}}],
 ["AP0","approval","Finance reviews business case",2,3,0,{approvers:["Controller"],tiers:"doa",amountField:"rec.budget"},{tg:{sla:"72 h",dur:20}}],
 ["AP1","approval","Portfolio board decision",3,4,0,{mode:"quorum",quorum:3,approvers:["Portfolio board"],asm:[{type:"asm_chg",mode:"advisory"},{type:"asm_arch",mode:"advisory"}]},{tg:{sla:"5 d",dur:72},vis:{show:true,label:"Waiting for the portfolio board"}}],
 ["A1","auto","Create project and baseline",4,5,0,{op:"Create project in Planner"},{params:{retries:3,backoff:"fixed",onError:"path"},tg:{dur:.05,cost:.1}}],
 ["E1","end","Project started",4,6,0,{outcome:"Completed"},{}],["E2","end","Parked",0,4,1,{outcome:"Cancelled"},{}],["E3","end","Declined",3,5,1,{outcome:"Rejected"},{}]
],[["T1","AG1"],["AG1","D1"],["D1","AP0","Strong"],["D1","H1","Else"],["H1","E2"],["AP0","AP1","Approved"],["AP0","E3","Rejected"],["AP1","A1","Approved"],["AP1","E3","Rejected"],["A1","E1"]])}
function seedRenew(){return BF("wf_renew","Contract renewal reminder","Runs daily, finds contracts expiring within 90 days and asks each owner to renew or exit.",{kind:"contract",owner:"Maya Ortiz",service:"Contract Repository",table:"contract_line",lanes:[{n:"System"},{n:"AI agents"},{n:"Contract owner"}]},[
 ["T1","trigger","Daily 08:00",0,0,0,{src:"schedule",ev:"Schedule",sched:"0 8 * * 1-5"},{}],
 ["A1","auto","Find contracts expiring in 90 days",0,1,0,{op:"Call REST API",endpoint:"/contracts?expiring=90"},{outputs:[{name:"contracts",type:"list",desc:"Contracts found"}],params:{retries:3,backoff:"exponential",onError:"path"}}],
 ["L1","loop","For each contract",0,2,0,{over:"A1.contracts",max:200},{}],
 ["AG1","agent","Summarize terms and spend",1,3,0,{agent:"Contract Analyst",goal:"Summarize obligations, spend to date and renewal options.",tools:["Contracts"],autonomy:"suggest"},{tg:{dur:.03,cost:.3}}],
 ["H1","human","Owner decides renew or exit",2,4,0,{outcomes:["Renew","Exit","Renegotiate"]},{asg:{kind:"person",person:"Maya Ortiz"},tg:{sla:"5 d",dur:30}}],
 ["A2","auto","Create renewal task",0,5,0,{op:"Create record",target:"task"},{}],
 ["E1","end","Completed",0,6,0,{outcome:"Completed"},{}]
],[["T1","A1"],["A1","L1"],["L1","AG1","Each"],["L1","E1","Done"],["AG1","H1"],["H1","A2"],["A2","L1"]])}
function seedBig(){const lanes=["Intake","Security","Identity","Network","Data platform","Finance","Legal","AI agents","Service desk","Go live"].map(n=>({n}));const nodes=[],edges=[],groups=[];let col=0,prev="T1";
 nodes.push(["T1","trigger","New service onboarding requested",0,0,0,{src:"catalog",ev:"Catalog request: Onboard a service"},{}]);
 const names=[["Intake","Define service and owner","Check duplicates","Assign tier","Sponsor approval","Open record","Confirm scope"],["Security","Threat model","Security assessment","Pen test slot","Fix findings","Risk sign-off","Add to monitoring"],["Identity","Create groups","Role mapping","SSO app","Access review rule","Break-glass account","Verify sign-in"],["Network","Allocate subnet","Firewall rules","DNS entries","Load balancer","VPN access","Connectivity test"],["Data platform","Schema review","Classify data","Retention rule","Backup policy","Lineage entry","Quality checks"],["Finance","Cost center","TBM mapping","Budget check","Chargeback rule","Contract link","Approve spend"],["Legal","Terms review","Data protection","Privacy impact","Licensing check","Sign-off","File records"],["AI agents","Draft runbook","Draft knowledge","Generate tests","Review telemetry","Draft SLA","Summarize risks"],["Service desk","Training","Support queue","Routing rules","Escalation path","Status page","Dry-run incident"],["Go live","Change request","CAB approval","Cutover","Smoke tests","Hypercare","Close onboarding"]];
 names.forEach((g,gi)=>{const gid="G"+gi;groups.push({id:gid,n:g[0]+" sub-flow",collapsed:false});const ids=[];g.slice(1).forEach((nm,i)=>{const id=`${gi}_${i}`;const t=gi===7?"agent":i===4&&gi%2===0?"approval":i===1&&gi===1?"assessment":i%3===2?"auto":"human";const a=t==="agent"?{agent:AGN[i%AGN.length],goal:nm,autonomy:"propose",tools:["Articles"]}:t==="assessment"?{type:"asm_sec",gate:"gate"}:t==="approval"?{approvers:["Service owner"]}:{};nodes.push([id,t,nm,gi,gi*3+Math.floor(i/2)+1,i%2,a,{tg:{sla:t==="human"?"2 d":"",dur:t==="auto"?.05:12,cost:t==="agent"?.4:t==="auto"?.05:35}}]);ids.push(id)});
  ids.forEach((id,i)=>{if(i)edges.push([ids[i-1],id])});edges.push([prev,ids[0]]);prev=ids[ids.length-1];ids.forEach(id=>{nodes.find(x=>x[0]===id).gid=gid})});
 nodes.push(["E1","end","Service onboarded",9,33,0,{outcome:"Completed"},{}]);edges.push([prev,"E1"]);
 const f=BF("wf_big","Enterprise service onboarding (60 steps, 10 subflows)","A large cross-team workflow used to show collapsed sub-flows, node search and the minimap at 60+ steps.",{kind:"onboarding",owner:"Jordan Lee",service:"Integration hub",table:"business_service",lanes},nodes,edges,groups);
 nodes.forEach(a=>{if(a.gid){const n=nodeById(f,a[0]);if(n)n.g=a.gid}});f.ver=2;f.pub=2;f.dirty=false;return f}
function seedLaptop(){return BF("wf_laptop","Provision laptop","Order, image and ship a laptop.",{kind:"request",owner:"Tom Becker",service:"Endpoint management (Intune)",table:"request_item",lanes:[{n:"Service desk"},{n:"Endpoint team"}]},[["T1","trigger","Request approved",0,0,0,{src:"catalog"},{}],["H1","human","Order device",0,1,0,{},{tg:{sla:"1 d",dur:4}}],["A1","auto","Autopilot enroll",1,2,0,{op:"Call REST API"},{params:{retries:3,onError:"path"}}],["H2","human","Ship to user",0,3,0,{},{tg:{sla:"2 d",dur:12}}],["E1","end","Delivered",0,4,0,{},{}]],[["T1","H1"],["H1","A1"],["A1","H2"],["H2","E1"]])}
F.W=F.W||[seedInvoice(),seedVendor(),seedHire(),seedDemand(),seedRenew(),seedBig(),seedLaptop()];
F.cache=F.cache||{};F.open=F.open||null;F.sel=F.sel||null;F.tab=F.tab||"do";F.rec=F.rec||{};F.runs=F.runs||{};F.pane=F.pane||"valid";F.q="";F.zoom=F.zoom||1;
