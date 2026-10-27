/* ===== mod_flow: Automation (workflow designer, BPMN, decision tables, approvals, agentic workflows, integration hub) ===== */
(function(){
S.flw=S.flw||{};
const F=S.flw;
const X=esc,clone=o=>JSON.parse(JSON.stringify(o)),who=()=>PERSONAS[S.persona].n;
const uid=()=>Math.random().toString(36).slice(2,7);
const $q=(s,r)=>(r||document).querySelector(s);

Object.assign(METRICS,{
 m_autoapp:{n:"Rule-decided approvals",f:"Approvals decided by a decision table with no human step ÷ Approvals requested × 100",u:"%",cur:41,tgt:55,badAt:30,dir:"max",max:100,tr:[24,27,30,33,36,38,40,41],owner:"Finance operations",use:["Decision tables","Approvals inbox"],rem:{kind:"sop",ref:"SOP-118",title:"Review overrides and widen rule bands",agent:"Feedback Analyst",auto:false,state:"idle",prog:"Proposes decision table rows from approver overrides"}},
 m_apcycle:{n:"Approval turnaround",f:"Σ(decision time − request time) ÷ Approvals decided",u:"h",cur:17.5,tgt:16,badAt:30,dir:"min",max:48,tr:[26,24,22,21,20,19,18,17.5],owner:"Finance operations",use:["Approvals inbox","Workflow designer"],rem:{kind:"agent",ref:"Reminder policy",title:"Nudge approvers at 50% of SLA",agent:"First Officer",auto:true,state:"running",prog:"Sends Teams reminders and offers a delegate when an approver is out"}},
 m_apsla:{n:"Approvals past SLA",f:"Approvals still pending after their SLA ÷ Approvals pending × 100",u:"%",cur:18,tgt:10,badAt:25,dir:"min",max:50,tr:[9,11,12,14,15,17,16,18],owner:"Service desk",use:["Approvals inbox"],rem:{kind:"sop",ref:"SOP-121",title:"Escalate to delegate at 100% of SLA",agent:"First Officer",auto:false,state:"idle",prog:"Reassigns to the delegate on file and tells the requester"}},
 m_wfrun:{n:"Workflow run success",f:"Runs that finish without manual rescue ÷ Runs started × 100",u:"%",cur:96.2,tgt:97,badAt:92,dir:"max",max:100,tr:[93.1,93.8,94.5,95,95.4,95.9,96,96.2],owner:"Automation team",use:["Workflow designer","Agentic workflows"],rem:{kind:"kb",ref:"KB0517",title:"Workflow failure triage guide",agent:"Ops Agent",auto:false,state:"idle",prog:"Groups failed runs by cause and drafts the fix"}},
 m_intfail:{n:"Integration failure rate",f:"Failed calls ÷ Total calls over the last 24 hours × 100",u:"%",cur:2.8,tgt:1,badAt:5,dir:"min",max:10,tr:[1.1,1.3,1.2,1.9,2.2,2.5,2.6,2.8],owner:"Integration team",use:["Integration hub"],rem:{kind:"sop",ref:"SOP-133",title:"Rotate expired credentials and replay the dead-letter queue",agent:"Ops Agent",auto:false,state:"idle",prog:"Renews certificates it can reach and replays safe events"}}
});

/* ---------------------------------------------------------------- workflow model */
const NW=172,NH=68;
const NT={
 trigger:{l:"Trigger",c:"--p4",d:"M13 2L4 14h7l-1 8 9-12h-7z",out:["next"],note:"Starts the flow when something happens"},
 action:{l:"Action",c:"--p1",d:"M4 12h12M12 6l6 6-6 6",out:["next"],note:"Update a record or call a system"},
 approval:{l:"Approval",c:"--u3",d:"M5 12l5 5 9-10",out:["Approved","Rejected"],note:"A person decides"},
 condition:{l:"Condition",c:"--w1",d:"M12 3l9 9-9 9-9-9z",out:["Yes","No"],note:"Branch on a rule"},
 wait:{l:"Wait or timer",c:"--s3",d:"M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",out:["next"],note:"Pause for time or an event"},
 agent:{l:"AI agent step",c:"--p5",d:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",out:["next"],note:"An agent reads, drafts or acts"},
 notify:{l:"Notification",c:"--e4",d:"M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",out:["next"],note:"Tell people in Teams, email or Slack"},
 subflow:{l:"Subflow",c:"--u4",d:"M4 5h7v5H4zM13 14h7v5h-7zM11 7.5h4v9",out:["next"],note:"Run another flow"},
 end:{l:"End",c:"--bad-f",d:"M7 7h10v10H7z",out:[],note:"Finish with an outcome"}
};
const PAL=["trigger","action","approval","condition","wait","agent","notify","subflow","end"];
const APPROVERS=["Controller (role)","Avery Chen (Controller)","CIO","Change manager","Project manager of record","Requester's manager","Portfolio board","Change advisory board","Data steward"];
const ERRP=["Stop and alert owner","Retry 3 times, then alert owner","Continue to next step","Route to exception queue"];
const AGN=["Invoice Advisor","Knowledge Curator","Forecast Agent","Ops Agent","Contract Analyst","Triage Agent"];
const AUTON=[["autonomous","Autonomous"],["propose","Propose then approve"],["suggest","Suggest only"]];
const DEF={
 trigger:{event:"Record created",filter:"",_n:"Record created"},
 action:{op:"Update record",inputs:"",onError:"",_n:"New action"},
 approval:{approver:"",mode:"Any one approver",sla:24,onTimeout:"Escalate to manager",_n:"Approval"},
 condition:{expr:"amount > 50000",dmn:"",_n:"Check a condition"},
 wait:{dur:"PT24H",until:"",_n:"Wait"},
 agent:{agent:"Invoice Advisor",autonomy:"propose",tools:"Invoices, POs, Contracts",onError:"",_n:"AI agent step"},
 notify:{channel:"Teams",to:"Requester",msg:"",onError:"",_n:"Send notification"},
 subflow:{flow:"Provision laptop",onError:"",_n:"Run subflow"},
 end:{outcome:"Completed",_n:"End"}
};
/* node form schema */
const FF={
 trigger:[{k:"event",l:"Starts when",t:"select",o:["Invoice received (ERP)","Record created","Record updated","Schedule: daily 08:00","Webhook received","Hire accepted (Workday)","Demand submitted","Standard change requested"]},{k:"filter",l:"Only when",t:"text",ph:"vendor is not internal",h:"Optional filter evaluated before the flow starts."}],
 action:[{k:"op",l:"Operation",t:"select",o:["Update record","Create record","Call REST API","Post journal to ERP","Place payment hold","Release payment in ERP","Create Entra ID account","Assign M365 license","Create project in Planner","Schedule in change calendar"]},{k:"inputs",l:"Inputs",t:"longtext",ph:"invoice = {{record.id}}\nreason = Acceptance missing",h:"One key = value per line. Use {{record.field}} to pull from the record."},{k:"onError",l:"Error path",t:"select",o:ERRP,ph:"Choose what happens on failure"}],
 approval:[{k:"approver",l:"Assignee (approver)",t:"select",o:APPROVERS,ph:"Choose an approver"},{k:"mode",l:"Decision mode",t:"select",o:["Any one approver","All approvers","In sequence"]},{k:"sla",l:"SLA (hours)",t:"number"},{k:"onTimeout",l:"When the SLA passes",t:"select",o:["Escalate to manager","Remind every 4 hours","Auto-reject","Route to delegate"]}],
 condition:[{k:"expr",l:"Condition",t:"text",ph:"amount > 50000 and vendor contains Lumen",h:"Fields: amount, vendor, accepted, overpaid, po, risk. Use and, or, contains."},{k:"dmn",l:"Also log a decision table",t:"dmn",h:"The test run records which rule fires."}],
 wait:[{k:"dur",l:"Wait for",t:"select",o:["PT1H","PT4H","PT24H","P5D","P30D","Until start date"]},{k:"until",l:"Or until this happens",t:"text",ph:"Milestone accepted"}],
 agent:[{k:"agent",l:"Agent",t:"select",o:AGN},{k:"autonomy",l:"Human in the loop",t:"chips",o:AUTON},{k:"tools",l:"Tools it may use",t:"text",h:"Matches the permissions set in Agentic workflows."},{k:"onError",l:"Error path",t:"select",o:ERRP,ph:"Choose what happens on failure"}],
 notify:[{k:"channel",l:"Channel",t:"select",o:["Teams","Email","Slack","Webex"]},{k:"to",l:"Send to",t:"text",ph:"Requester, project manager, #finance-ap"},{k:"msg",l:"Message",t:"longtext",ph:"Invoice {{record.id}} is on hold until acceptance."},{k:"onError",l:"Error path",t:"select",o:ERRP,ph:"Choose what happens on failure"}],
 subflow:[{k:"flow",l:"Flow to run",t:"select",o:["Provision laptop","Grant system access","Create Teams site","Collect signatures"]},{k:"onError",l:"Error path",t:"select",o:ERRP,ph:"Choose what happens on failure"}],
 end:[{k:"outcome",l:"Outcome",t:"select",o:["Completed","Rejected","Cancelled","Held pending acceptance","Escalated"]}]
};
function mkflow(id,name,desc,nodes,edges,extra){
 const f={id,name,desc,nodes:nodes.map(a=>({id:a[0],type:a[1],name:a[2],x:a[3],y:a[4],props:Object.assign({},DEF[a[1]],a[5]||{})})),edges:edges.map((e,i)=>({id:"e"+i+"_"+id,f:e[0],p:e[2]||(NT[nodes.find(n=>n[0]===e[0])[1]].out[0]),t:e[1]}))};
 nodes.forEach((a,i)=>{delete f.nodes[i].props._n});
 return Object.assign(f,{ver:1,pub:null,dirty:true,history:[]},extra||{})}
const c=i=>24+i*198,r=i=>20+i*92;
/* --- the prefilled flow: invoice approval with Lumen hold logic --- */
function buildInvoice(){
 const f=mkflow("f_inv","Invoice approval with hold logic","Routes every invoice by size and by whether the vendor's work is accepted. Holds Lumen-style invoices until acceptance.",[
 ["T1","trigger","Invoice received",c(0),r(2),{event:"Invoice received (ERP)",filter:"vendor is not internal"}],
 ["A1","action","Three-way match",c(1),r(2),{op:"Call REST API",inputs:"po = {{record.po}}\nreceipt = {{record.receipt}}\nrate = {{record.rate}}",onError:"Retry 3 times, then alert owner"}],
 ["AG1","agent","Invoice Advisor check",c(2),r(2),{agent:"Invoice Advisor",autonomy:"propose",tools:"Invoices, POs, Contracts",onError:"Retry 3 times, then alert owner"}],
 ["G1","condition","Amount over $50,000?",c(3),r(2),{expr:"amount > 50000",dmn:"dt_inv"}],
 ["A3","action","Auto-approve, schedule payment",c(4),r(0),{op:"Update record",inputs:"status = approved\npay_on = due_date",onError:"Retry 3 times, then alert owner"}],
 ["G2","condition","Vendor work accepted?",c(4),r(3),{expr:"accepted == true"}],
 ["A2","action","Place payment hold",c(5),r(4),{op:"Place payment hold",inputs:"invoice = {{record.id}}\nreason = Acceptance missing",onError:"Stop and alert owner"}],
 ["N1","notify","Ask PM to confirm acceptance",c(6),r(4),{channel:"Teams",to:"Project manager of record",msg:"{{record.id}} is on hold until milestone acceptance is recorded."}],
 ["W1","wait","Wait for acceptance",c(7),r(4),{dur:"P5D",until:"Milestone accepted"}],
 ["E2","end","Held, restarts on acceptance",c(8),r(4),{outcome:"Held pending acceptance"}],
 ["AP1","approval","Controller approval",c(5),r(2),{approver:"Avery Chen (Controller)",mode:"Any one approver",sla:24,onTimeout:"Route to delegate"}],
 ["A4","action","Release payment in ERP",c(6),r(1),{op:"Release payment in ERP",inputs:"invoice = {{record.id}}",onError:""}],
 ["N2","notify","Return to vendor",c(6),r(3)+10,{channel:"Email",to:"Vendor contact",msg:"Invoice {{record.id}} was rejected. Reason: {{decision.comment}}"}],
 ["E3","end","Rejected",c(7),r(3)+10,{outcome:"Rejected"}],
 ["N3","notify","Payment scheduled",c(7),r(1),{channel:"Teams",to:"#finance-ap",msg:"{{record.id}} paid on {{record.pay_on}}."}],
 ["E1","end","Completed",c(8),r(1),{outcome:"Completed"}]
 ],[["T1","A1"],["A1","AG1"],["AG1","G1"],["G1","A3","No"],["G1","G2","Yes"],["A3","N3"],["G2","AP1","Yes"],["G2","A2","No"],["A2","N1"],["N1","W1"],["W1","E2"],["AP1","A4","Approved"],["AP1","N2","Rejected"],["A4","N3"],["N3","E1"],["N2","E3"]]);
 f.ver=4;f.pub=3;f.dirty=true;
 const v3=clone(f);v3.nodes=v3.nodes.filter(n=>n.id!=="AG1");v3.edges=v3.edges.filter(e=>e.f!=="AG1"&&e.t!=="AG1");v3.edges.push({id:"e_a1g1",f:"A1",p:"next",t:"G1"});
 f.history=[{v:3,st:"published",by:"Avery Chen",at:"Sep 22",note:"Added the Lumen hold branch and the acceptance check",snap:{nodes:v3.nodes,edges:v3.edges}},{v:2,st:"published",by:"Nia Brooks",at:"Aug 14",note:"Split auto-approval from controller approval at $50,000",snap:null},{v:1,st:"published",by:"Avery Chen",at:"Jun 30",note:"First version: one approver for every invoice",snap:null}];
 return f}
const TPL=[
 {id:"t_inv",n:"Invoice over $50,000 approval",d:"Two-step approval for large invoices with a CIO sign-off.",f:()=>mkflow(null,"Invoice over $50,000 approval","Large invoices need the controller and the CIO.",[
  ["T1","trigger","Invoice received",c(0),r(1),{event:"Invoice received (ERP)"}],["G1","condition","Over $50,000?",c(1),r(1),{expr:"amount > 50000"}],
  ["AP1","approval","Controller approval",c(2),r(0),{approver:"Controller (role)",sla:24}],["AP2","approval","CIO approval",c(3),r(0),{approver:"CIO",sla:48}],
  ["A1","action","Release payment",c(4),r(0),{op:"Release payment in ERP",onError:"Retry 3 times, then alert owner"}],["A2","action","Standard approval path",c(2),r(2),{op:"Update record",onError:"Stop and alert owner"}],
  ["E1","end","Completed",c(5),r(0),{outcome:"Completed"}],["E2","end","Rejected",c(4),r(1)+40,{outcome:"Rejected"}],["E3","end","Completed",c(3),r(2),{outcome:"Completed"}]],
  [["T1","G1"],["G1","AP1","Yes"],["G1","A2","No"],["AP1","AP2","Approved"],["AP1","E2","Rejected"],["AP2","A1","Approved"],["AP2","E2","Rejected"],["A1","E1"],["A2","E3"]])},
 {id:"t_hire",n:"New hire onboarding",d:"Accounts, licenses, equipment and a Day 1 welcome, started from Workday.",f:()=>mkflow(null,"New hire onboarding","Starts when Workday marks an offer accepted.",[
  ["T1","trigger","Hire accepted",c(0),r(1),{event:"Hire accepted (Workday)"}],["A1","action","Create Entra ID account",c(1),r(1),{op:"Create Entra ID account",onError:"Retry 3 times, then alert owner"}],
  ["A2","action","Assign M365 E5 license",c(2),r(1),{op:"Assign M365 license",onError:"Retry 3 times, then alert owner"}],["S1","subflow","Provision laptop",c(3),r(0),{flow:"Provision laptop",onError:"Route to exception queue"}],
  ["AP1","approval","Manager confirms equipment",c(3),r(2),{approver:"Requester's manager",sla:48,onTimeout:"Remind every 4 hours"}],["W1","wait","Wait until start date",c(4),r(1),{dur:"Until start date"}],
  ["N1","notify","Day 1 welcome",c(5),r(1),{channel:"Teams",to:"New hire",msg:"Welcome to Atlantic. Your checklist is ready."}],["E1","end","Completed",c(6),r(1),{outcome:"Completed"}]],
  [["T1","A1"],["A1","A2"],["A2","S1"],["A2","AP1"],["S1","W1"],["AP1","W1","Approved"],["AP1","W1","Rejected"],["W1","N1"],["N1","E1"]])},
 {id:"t_chg",n:"Standard change",d:"Pre-approved changes skip the board; everything else goes to the change manager.",f:()=>mkflow(null,"Standard change","Pre-approved templates are scheduled straight away.",[
  ["T1","trigger","Change requested",c(0),r(1),{event:"Standard change requested"}],["G1","condition","Matches a pre-approved template?",c(1),r(1),{expr:"risk == Low",dmn:"dt_chg"}],
  ["AP1","approval","Change manager approval",c(2),r(2),{approver:"Change manager",sla:24}],["A1","action","Schedule in change calendar",c(3),r(1),{op:"Schedule in change calendar",onError:"Stop and alert owner"}],
  ["A2","action","Implement and verify",c(4),r(1),{op:"Update record",onError:"Route to exception queue"}],["N1","notify","Tell the requester",c(3),r(3),{channel:"Teams",to:"Requester",msg:"Your change was declined."}],
  ["E1","end","Completed",c(5),r(1),{outcome:"Completed"}],["E2","end","Rejected",c(4),r(3),{outcome:"Rejected"}]],
  [["T1","G1"],["G1","A1","Yes"],["G1","AP1","No"],["AP1","A1","Approved"],["AP1","N1","Rejected"],["A1","A2"],["A2","E1"],["N1","E2"]])},
 {id:"t_renew",n:"Contract renewal reminder",d:"Finds contracts expiring in 90 days and asks the owner to renew or exit.",f:()=>mkflow(null,"Contract renewal reminder","Runs daily and nudges owners 90 days before expiry.",[
  ["T1","trigger","Daily at 08:00",c(0),r(1),{event:"Schedule: daily 08:00"}],["A1","action","Find contracts expiring in 90 days",c(1),r(1),{op:"Call REST API",inputs:"repo = Contract Repository\nwithin_days = 90",onError:"Retry 3 times, then alert owner"}],
  ["G1","condition","Any found?",c(2),r(1),{expr:"amount > 0"}],["AG1","agent","Summarize terms and spend",c(3),r(0),{agent:"Contract Analyst",autonomy:"suggest",tools:"Contract Repository"}],
  ["N1","notify","Email the contract owner",c(4),r(0),{channel:"Email",to:"Contract owner",msg:"{{record.title}} expires on {{record.end_date}}."}],["AP1","approval","Owner decides renew or exit",c(5),r(0),{approver:"Requester's manager",sla:120,onTimeout:"Remind every 4 hours"}],
  ["A2","action","Create renewal task",c(6),r(0),{op:"Create record",onError:"Stop and alert owner"}],["E1","end","Completed",c(7),r(0),{outcome:"Completed"}],["E2","end","Nothing to do",c(3),r(2),{outcome:"Completed"}]],
  [["T1","A1"],["A1","G1"],["G1","AG1","Yes"],["G1","E2","No"],["AG1","N1"],["N1","AP1"],["AP1","A2","Approved"],["AP1","E1","Rejected"],["A2","E1"]])},
 {id:"t_dem",n:"Demand intake to project",d:"Scores a new demand, takes it to the portfolio board and creates the project.",f:()=>mkflow(null,"Demand intake to project","From idea to a baselined project record.",[
  ["T1","trigger","Demand submitted",c(0),r(1),{event:"Demand submitted"}],["AG1","agent","Score value, risk and fit",c(1),r(1),{agent:"Forecast Agent",autonomy:"propose",tools:"Demand, Capacity"}],
  ["G1","condition","Score at least 60?",c(2),r(1),{expr:"amount >= 60"}],["AP1","approval","Portfolio board decision",c(3),r(0),{approver:"Portfolio board",sla:120,onTimeout:"Escalate to manager"}],
  ["A1","action","Create project in Planner",c(4),r(0),{op:"Create project in Planner",onError:"Route to exception queue"}],["N1","notify","Tell the requester",c(5),r(0),{channel:"Teams",to:"Requester",msg:"Your demand was approved."}],
  ["N2","notify","Decline with reasons",c(3),r(2),{channel:"Email",to:"Requester",msg:"Your demand was not funded this quarter. Reasons: {{decision.comment}}"}],["E1","end","Completed",c(6),r(0),{outcome:"Completed"}],["E2","end","Rejected",c(4),r(2),{outcome:"Rejected"}]],
  [["T1","AG1"],["AG1","G1"],["G1","AP1","Yes"],["G1","N2","No"],["AP1","A1","Approved"],["AP1","N2","Rejected"],["A1","N1"],["N1","E1"],["N2","E2"]])}
];
F.flows=F.flows||[buildInvoice()];
F.fid=F.fid||"f_inv";F.sel=F.sel||null;F.selEdge=null;F.conn=null;F.run=F.run||null;
F.rec=F.rec||{id:"INV-20433",vendor:"Lumen Data Partners",amount:62900,accepted:false,overpaid:22000,po:"Match",risk:"Medium",decision:"approve"};
const flow=()=>F.flows.find(f=>f.id===F.fid)||F.flows[0];
const node=(f,id)=>f.nodes.find(n=>n.id===id);
function touch(f){if(f.pub!=null&&f.ver===f.pub)f.ver++;f.dirty=true}
const nodePos=(n,port)=>{const o=NT[n.type].out,i=Math.max(0,o.indexOf(port)),fr=o.length>1?(i?.74:.26):.5;return[n.x+NW,n.y+NH*fr]};
function meta(n){const p=n.props;switch(n.type){
 case"trigger":return p.event;case"action":return p.op;case"approval":return(p.approver?p.approver.replace(/ \(.*\)/,""):"No approver")+" · "+p.sla+"h SLA";
 case"condition":return p.expr;case"wait":return p.dur+(p.until?" or "+p.until:"");case"agent":return p.agent+" · "+(AUTON.find(a=>a[0]===p.autonomy)||AUTON[1])[1];
 case"notify":return p.channel+" to "+p.to;case"subflow":return p.flow;default:return p.outcome}}
/* ---------------------------------------------------------------- validation */
function reach(f){const seen=new Set(),q=f.nodes.filter(n=>n.type==="trigger").map(n=>n.id);q.forEach(i=>seen.add(i));while(q.length){const a=q.shift();f.edges.filter(e=>e.f===a).forEach(e=>{if(!seen.has(e.t)){seen.add(e.t);q.push(e.t)}})}return seen}
function validate(f){const out=[],R=reach(f),nm=n=>`“${n.name}”`;
 const trig=f.nodes.filter(n=>n.type==="trigger");
 if(!trig.length)out.push({sev:"err",msg:"There is no trigger, so nothing can start this flow.",sug:"Add a Trigger node from the palette.",fix:{l:"Add a trigger",a:"addTrigger"}});
 if(!f.nodes.some(n=>n.type==="end"))out.push({sev:"err",msg:"The flow has no End node.",sug:"Every path should finish with an outcome so reports can count it.",fix:{l:"Add an End node",a:"addEndFree"}});
 else if(trig.length&&!f.nodes.some(n=>n.type==="end"&&R.has(n.id)))out.push({sev:"err",msg:"No path from the trigger reaches an End node.",sug:"Connect the last step of each path to an End node."});
 f.nodes.forEach(n=>{
  if(trig.length&&!R.has(n.id))out.push({sev:"err",node:n.id,msg:`${nm(n)} is unreachable. No path from the trigger leads to it.`,sug:"Connect an earlier step to it, or delete it.",fix:{l:"Delete it",a:"delNode:"+n.id}});
  if(n.type==="approval"&&!n.props.approver)out.push({sev:"err",node:n.id,msg:`${nm(n)} has no approver, so it would wait forever.`,sug:"Pick an approver. Suggested: Controller (role), who decided 14 of the last 15 invoices over $25,000.",fix:{l:"Use Controller (role)",a:"setApprover:"+n.id}});
  if(n.type!=="end"&&R.has(n.id)){NT[n.type].out.forEach(p=>{if(!f.edges.some(e=>e.f===n.id&&e.p===p))out.push({sev:n.type==="approval"&&p==="Rejected"||n.type==="condition"?"err":"err",node:n.id,msg:NT[n.type].out.length>1?`${nm(n)} has no path for “${p}”.`:`${nm(n)} is a dead end. Nothing happens after it.`,sug:NT[n.type].out.length>1?`Connect the ${p} port to a step or an End node.`:"Connect it to the next step, or finish the path with an End node.",fix:{l:"Finish with an End node",a:"addEnd:"+n.id+":"+p}})})}
  if((n.type==="action"||n.type==="agent"||n.type==="subflow")&&(!n.props.onError||/silently/i.test(n.props.onError)))out.push({sev:"warn",node:n.id,msg:`${nm(n)} has no error path. If it fails the run stops quietly.`,sug:"Retry three times, then alert the flow owner.",fix:{l:"Set retry then alert",a:"setOnError:"+n.id}});
  if(n.type==="agent"&&n.props.autonomy==="autonomous"&&/write|post|release|pay/i.test(n.props.tools))out.push({sev:"warn",node:n.id,msg:`${nm(n)} may write to systems with no human in the loop.`,sug:"Switch to propose-then-approve for steps that change money or access.",fix:{l:"Require approval",a:"setAuton:"+n.id}});
  if(n.type==="wait"&&!n.props.dur&&!n.props.until)out.push({sev:"err",node:n.id,msg:`${nm(n)} waits for nothing.`,sug:"Set a duration or an event.",fix:{l:"Wait 24 hours",a:"setDur:"+n.id}});
  if(n.type==="condition"&&!String(n.props.expr||"").trim())out.push({sev:"err",node:n.id,msg:`${nm(n)} has no condition to test.`,sug:"Write a rule such as amount > 50000."})});
 /* cycles with no wait or human step */
 const col={},stack=[];(function dfs(a){col[a]=1;stack.push(a);f.edges.filter(e=>e.f===a).forEach(e=>{if(col[e.t]===1){const cyc=stack.slice(stack.indexOf(e.t));if(!cyc.some(i=>["wait","approval"].includes((node(f,i)||{}).type)))out.push({sev:"warn",node:e.t,msg:"A loop has no wait or approval inside it and could spin forever.",sug:"Add a Wait node inside the loop or cap the retries."})}else if(!col[e.t])dfs(e.t)});stack.pop();col[a]=2})(trig[0]?trig[0].id:null);
 return out.sort((a,b)=>(a.sev==="err"?0:1)-(b.sev==="err"?0:1))}
function applyFix(a){const f=flow(),[k,id,p]=a.split(":");const n=id&&node(f,id);
 const addAt=(type,x,y,props)=>{const nn={id:"N"+uid(),type,name:DEF[type]._n,x,y,props:Object.assign({},DEF[type],props||{})};delete nn.props._n;f.nodes.push(nn);return nn};
 if(k==="setApprover")n.props.approver="Controller (role)";
 else if(k==="setOnError")n.props.onError="Retry 3 times, then alert owner";
 else if(k==="setAuton")n.props.autonomy="propose";
 else if(k==="setDur")n.props.dur="PT24H";
 else if(k==="delNode"){f.nodes=f.nodes.filter(x=>x.id!==id);f.edges=f.edges.filter(e=>e.f!==id&&e.t!==id);if(F.sel===id)F.sel=null}
 else if(k==="addTrigger"){addAt("trigger",30,30)}
 else if(k==="addEndFree"){addAt("end",f.nodes.reduce((m,x)=>Math.max(m,x.x),0)+212,30,{outcome:"Completed"})}
 else if(k==="addEnd"){const e=addAt("end",n.x+212,n.y+(p==="Rejected"||p==="No"?90:0),{outcome:p==="Rejected"?"Rejected":"Completed"});e.name=e.props.outcome;f.edges.push({id:"e"+uid(),f:id,p:p||"next",t:e.id})}
 touch(f);audit("applied validation fix",a);toast("Fixed. Validation re-ran.");part()}
/* ---------------------------------------------------------------- rendering */
function edgePath(f,e){const a=node(f,e.f),b=node(f,e.t);if(!a||!b)return null;const[x1,y1]=nodePos(a,e.p),x2=b.x,y2=b.y+NH/2,dx=Math.max(46,Math.abs(x2-x1)/2);
 return{d:`M${x1} ${y1}C${x1+dx} ${y1} ${x2-dx} ${y2} ${x2} ${y2}`,mx:(x1+x2)/2+(x2<x1?0:0),my:(y1+y2)/2}}
function edgesSvg(f){const run=F.run;let g=`<defs><marker id="flwArr" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" class="flw-arrow"/></marker></defs>`;
 f.edges.forEach(e=>{const p=edgePath(f,e);if(!p)return;const lbl=e.p!=="next"?`<text class="flw-elab" x="${p.mx}" y="${p.my-6}" text-anchor="middle">${X(e.p)}</text>`:"";
  const st=run&&run.edgesDone&&run.edgesDone.includes(e.id)?" done":"";
  g+=`<g class="flw-edge${F.selEdge===e.id?" sel":""}${st}" data-flw-edge="${e.id}" tabindex="0" role="button" aria-label="Connection ${X(node(f,e.f).name)} to ${X(node(f,e.t).name)}"><path class="hit" d="${p.d}"/><path class="vis" d="${p.d}" marker-end="url(#flwArr)"/>${lbl}</g>`});
 return g}
function nodeHTML(f,n){const T=NT[n.type],run=F.run,act=run&&run.active===n.id,dn=run&&run.nodesDone&&run.nodesDone.includes(n.id);
 const outs=T.out.map((p,i)=>{const fr=T.out.length>1?(i?.74:.26):.5;return `<button class="flw-nout${F.conn&&F.conn.from===n.id&&F.conn.port===p?" on":""}" data-flw-out="${n.id}|${p}" style="top:${fr*100}%" aria-label="Start a connection from ${X(n.name)}${p!=="next"?", "+p+" port":""}" title="${p==="next"?"Connect to the next step":p}">${T.out.length>1?`<i>${p}</i>`:""}</button>`}).join("");
 return `<div class="flw-node t-${n.type}${F.sel===n.id?" sel":""}${act?" run-act":""}${dn?" run-done":""}${F.conn&&F.conn.from!==n.id&&n.type!=="trigger"?" can-in":""}" data-flw-node="${n.id}" tabindex="0" role="button" aria-label="${X(T.l)}: ${X(n.name)}. Press Enter to edit, arrow keys to move." style="left:${n.x}px;top:${n.y}px;--nc:var(${T.c})">
 ${n.type!=="trigger"?`<button class="flw-nin" data-flw-in="${n.id}" aria-label="Connect here: ${X(n.name)}" title="Connect here"></button>`:""}
 <div class="flw-nh"><span class="flw-ni">${IC(T.d)}</span><span>${T.l}</span></div><div class="flw-nn">${X(n.name)}</div><div class="flw-nm">${X(meta(n))}</div>${outs}</div>`}
function canvasInner(f){const W=Math.max(1000,...f.nodes.map(n=>n.x+NW+60)),H=Math.max(520,...f.nodes.map(n=>n.y+NH+60));
 return `<div class="flw-world" style="width:${W}px;height:${H}px${F.zoom?";zoom:"+F.zoom:""}"><svg class="flw-edges" width="${W}" height="${H}" aria-hidden="false">${edgesSvg(f)}</svg>${f.nodes.map(n=>nodeHTML(f,n)).join("")}</div>`}
function statusHTML(f){const dirty=f.dirty,pub=f.pub;return `${pub==null?pill("Draft v"+f.ver+" · never published","warn"):dirty?pill("Draft v"+f.ver+" · changes since v"+pub,"warn")+" "+pill("Published v"+pub,"good"):pill("Published v"+pub,"good")}`}
function validHTML(f){const v=validate(f),errs=v.filter(x=>x.sev==="err").length,w=v.length-errs;
 return `<div class="row sp"><b>${errs?`${errs} problem${errs>1?"s":""} to fix`:"No blocking problems"}</b><span class="muted small">${w} warning${w===1?"":"s"} · re-checked on every edit</span></div>`+(v.length?`<ul class="flw-vl">${v.map(x=>`<li class="${x.sev}"><span class="flw-vi">${ico(x.sev==="err"?"warn":"info")}</span><div><b>${X(x.msg)}</b><div class="muted small">Suggestion: ${X(x.sug)}</div><div class="row" style="margin-top:6px">${x.node?`<button class="chip" data-flw-show="${x.node}">Show node</button>`:""}${x.fix?`<button class="chip" data-flw-fix="${X(x.fix.a)}">${ico("bolt")}${X(x.fix.l)}</button>`:""}</div></div></li>`).join("")}</ul>`:`<div class="flw-ok">${ico("check")}<span>Every node is reachable, every approval has an approver and every path ends. You can publish.</span></div>`)}
function sideHTML(f){const e=F.selEdge&&f.edges.find(x=>x.id===F.selEdge);
 if(e){const a=node(f,e.f),b=node(f,e.t);return `<div class="eyebrow">Connection</div><h3 style="margin:2px 0 8px">${X(a.name)} → ${X(b.name)}</h3><p class="muted small">Leaves the ${e.p==="next"?"main":X(e.p)} port.</p><div class="row"><button class="btn danger" data-flw-deledge="${e.id}">Remove connection</button><button class="btn quiet" data-flw-desel>Done</button></div>`}
 const n=F.sel&&node(f,F.sel);
 if(!n)return `<div class="eyebrow">Properties</div><h3 style="margin:2px 0 8px">Select a node</h3><p class="muted small">Drag a node from the palette onto the canvas. Click a node to edit it here. To connect, click the round port on the right of one node, then the port on the left of another.</p>${F.conn?`<div class="hint" style="display:block;background:var(--story-s);color:var(--story)"><b>Connecting.</b> Now click the left port of the target node. Press Esc to cancel.</div>`:""}<div class="flw-legend">${PAL.map(t=>`<span><i style="background:var(${NT[t].c})"></i>${NT[t].l}</span>`).join("")}</div>`;
 const T=NT[n.type],fld=(fd)=>{const v=n.props[fd.k]==null?"":n.props[fd.k],id=`flwp_${n.id}_${fd.k}`,at=`data-flw-prop="${fd.k}" id="${id}"`;let inner;
  if(fd.t==="select")inner=`<select class="fin" ${at}>${fd.ph?`<option value="">${X(fd.ph)}</option>`:""}${fd.o.map(o=>`<option ${o===v?"selected":""}>${X(o)}</option>`).join("")}</select>`;
  else if(fd.t==="dmn")inner=`<select class="fin" ${at}><option value="">None</option>${(F.dmn||[]).map(t=>`<option value="${t.id}" ${t.id===v?"selected":""}>${X(t.name)}</option>`).join("")}</select>`;
  else if(fd.t==="chips")inner=`<div class="fchips">${fd.o.map(o=>`<button type="button" class="chip" data-flw-chip="${fd.k}|${o[0]}" aria-pressed="${o[0]===v}">${X(o[1])}</button>`).join("")}</div>`;
  else if(fd.t==="longtext")inner=`<textarea class="fin" rows="3" ${at} placeholder="${X(fd.ph||"")}">${X(v)}</textarea>`;
  else inner=`<input class="fin" type="${fd.t==="number"?"number":"text"}" ${at} value="${X(v)}" placeholder="${X(fd.ph||"")}">`;
  return `<div class="fld"><label class="flab" for="${id}">${X(fd.l)}</label>${inner}${fd.h?`<small class="fhelp">${X(fd.h)}</small>`:""}</div>`};
 const ai=n.type==="approval"?`<div class="row" style="margin:4px 0 10px">${aiChip({model:"Claude Sonnet",conf:.88,title:"Suggested approver",note:"Looked at who decided the last 15 invoices of this size and who was out of office.",src:["Approval history, 15 invoices over $25,000","Delegation settings","Entra ID roles"]})}<button class="chip" data-flw-aiapprover>Apply suggestion: Controller (role)</button></div>`:n.type==="agent"?`<div class="row" style="margin:4px 0 10px">${aiChip({model:"Claude Sonnet",conf:.82,title:"Suggested autonomy",note:"This agent writes nothing in this flow, but its recommendation feeds a payment decision.",src:["Agent permissions","Past override rate 18%"]})}<span class="muted small">Suggested: propose then approve</span></div>`:"";
 return `<div class="row sp"><div><div class="eyebrow">${T.l}</div><h3 style="margin:2px 0 0">Properties</h3></div><button class="btn quiet" data-flw-desel aria-label="Close properties">Done</button></div>
 <div class="fld"><label class="flab" for="flwp_${n.id}_name">Name</label><input class="fin" id="flwp_${n.id}_name" data-flw-prop="name" value="${X(n.name)}"></div>${ai}${(FF[n.type]||[]).map(fld).join("")}
 <div class="row" style="margin-top:10px"><button class="btn" data-flw-startconn="${n.id}">${ico("bolt")}Connect from here</button><button class="btn" data-flw-dup="${n.id}">Duplicate</button><button class="btn danger" data-flw-del="${n.id}">Delete</button></div>`}
function paletteHTML(){return `<div class="flw-pal" role="list" aria-label="Node palette. Drag onto the canvas, or press Enter to add."><div class="eyebrow">Palette</div>${PAL.map(t=>`<button class="flw-pi" role="listitem" data-flw-pal="${t}" style="--nc:var(${NT[t].c})" title="${X(NT[t].note)}"><span class="flw-ni">${IC(NT[t].d)}</span><span><b>${NT[t].l}</b><small>${X(NT[t].note)}</small></span></button>`).join("")}</div>`}
function runHTML(f){const r=F.run;if(!r)return `<div class="muted small">Run a sample record through the flow to see every step, branch and decision. Sample: <b>${X(F.rec.id)}</b>, ${X(F.rec.vendor)}, ${money(F.rec.amount)}, accepted work ${F.rec.accepted?"yes":"no"}.</div>`;
 return `<div class="row sp"><b>${r.status==="running"?"Running…":r.status==="done"?"Finished: "+X(r.outcome):"Stopped"}</b><span class="muted small">${r.log.length} events · simulated clock ${X(r.clock||"0:00")}</span></div><ol class="flw-log" aria-live="polite">${r.log.map(l=>`<li class="${l.k}"><time>${X(l.t)}</time><span><b>${X(l.n||"")}</b> ${X(l.x)}</span></li>`).join("")}</ol>`}
function versionsHTML(f){const d=f.pub!=null?diff(f):null;
 return `${d?`<div class="hint" style="display:block;margin-bottom:10px;background:var(--story-s);color:var(--story)"><b>Draft v${f.ver} vs published v${f.pub}:</b> ${d}</div>`:""}<div class="flw-vers">${[{v:f.ver,st:f.dirty||f.pub==null?"draft":"published",by:who(),at:"Now",note:f.dirty||f.pub==null?"Unpublished edits":"Current",cur:1}].concat(f.history.filter(h=>h.v!==f.ver)).map(h=>`<div class="flw-ver"><div class="row sp"><b>v${h.v}</b>${pill(h.st==="draft"?"Draft":"Published",h.st==="draft"?"warn":"good")}</div><div class="small">${X(h.note)}</div><div class="muted small">${X(h.by)} · ${X(h.at)}</div>${h.cur?"":`<button class="chip" data-flw-restore="${h.v}" ${h.snap?"":"disabled title='Snapshot archived'"}>Restore as draft</button>`}</div>`).join("")}</div>`}
function diff(f){const h=f.history.find(x=>x.v===f.pub);if(!h||!h.snap)return"snapshot archived.";const A=new Set(h.snap.nodes.map(n=>n.id)),B=new Set(f.nodes.map(n=>n.id));const add=f.nodes.filter(n=>!A.has(n.id)).map(n=>n.name),del=h.snap.nodes.filter(n=>!B.has(n.id)).map(n=>n.name);const ea=new Set(h.snap.edges.map(e=>e.f+e.p+e.t)),eb=new Set(f.edges.map(e=>e.f+e.p+e.t));const ea2=[...eb].filter(x=>!ea.has(x)).length,ed=[...ea].filter(x=>!eb.has(x)).length;
 const ch=f.nodes.filter(n=>A.has(n.id)&&JSON.stringify(n.props)+n.name!==JSON.stringify((h.snap.nodes.find(x=>x.id===n.id)||{}).props)+(h.snap.nodes.find(x=>x.id===n.id)||{}).name).length;
 return (add.length?`added ${add.map(x=>"“"+X(x)+"”").join(", ")}; `:"")+(del.length?`removed ${del.map(x=>"“"+X(x)+"”").join(", ")}; `:"")+`${ea2} new and ${ed} removed connection${ea2+ed===1?"":"s"}; ${ch} step${ch===1?"":"s"} edited.`}
function miniSvg(f){const W=Math.max(...f.nodes.map(n=>n.x+NW))+10,H=Math.max(...f.nodes.map(n=>n.y+NH))+10;return `<svg viewBox="0 0 ${W} ${H}" class="flw-mini" aria-hidden="true">${f.edges.map(e=>{const p=edgePath(f,e);return p?`<path d="${p.d}" class="e"/>`:""}).join("")}${f.nodes.map(n=>`<rect x="${n.x}" y="${n.y}" width="${NW}" height="${NH}" rx="14" style="fill:var(${NT[n.type].c})" opacity=".85"/>`).join("")}</svg>`}
const tplCache={};
function gallery(){return `<div class="flw-gal">${TPL.map(t=>{const f=tplCache[t.id]||(tplCache[t.id]=t.f());return `<article class="flw-tpl glass"><div class="flw-tprev">${miniSvg(f)}</div><b>${X(t.n)}</b><span class="muted small">${X(t.d)}</span><div class="row sp"><span class="pill mute">${f.nodes.length} nodes</span><button class="chip" data-flw-usetpl="${t.id}">Use template</button></div></article>`}).join("")}</div>`}
function ideBody(f){
 return `<div data-flw-root>
 <div class="card glass"><div class="cardhead"><div><h3>${X(f.name)}</h3><span class="muted small" data-role="story">${X(f.desc)}</span></div><div class="row" id="flwStatus">${statusHTML(f)}</div></div>
  <div class="row" style="margin-bottom:12px">${F.flows.map(x=>`<button class="chip" data-flw-pick="${x.id}" aria-pressed="${x.id===f.id}">${X(x.name.length>26?x.name.slice(0,25)+"…":x.name)}</button>`).join("")}<button class="chip" data-flw-newflow>+ Blank flow</button></div>
  <div class="row"><button class="btn primary" data-flw-test>${ico("bolt")}Test run</button><button class="btn" data-flw-rec>Edit sample record</button><button class="btn" data-flw-publish>Publish…</button><button class="btn quiet" data-flw-tidy>Tidy layout</button><span class="row" style="gap:4px" role="group" aria-label="Zoom"><button class="chip" data-flw-zoom="-" aria-label="Zoom out">−</button><button class="chip" data-flw-zoom="fit">Fit</button><button class="chip" data-flw-zoom="+" aria-label="Zoom in">+</button></span><span class="muted small flw-hintline">${F.conn?"Connecting: click the left port of the target node (Esc cancels).":"Drag from the palette, move nodes, connect ports."}</span></div></div>
 <div class="flw-ide">${paletteHTML()}<div class="flw-canvaswrap glass ${F.conn?"connecting":""}"><div class="flw-canvas" id="flwCanvas" tabindex="-1">${canvasInner(f)}</div></div><aside class="flw-side card glass" id="flwSide">${sideHTML(f)}</aside></div>
 <div class="grid g2"><section class="card glass"><div class="cardhead"><div><h3>Validation</h3><span class="muted small" data-role="story">Problems that would break a run, each with a one-click fix.</span></div></div><div id="flwValid">${validHTML(f)}</div></section>
 <section class="card glass"><div class="cardhead"><div><h3>Test run log</h3><span class="muted small" data-role="story">Nothing here touches real records.</span></div></div><div id="flwRun">${runHTML(f)}</div></section></div>
 <section class="card glass"><div class="cardhead"><div><h3>Versions</h3><span class="muted small" data-role="story">Publish when a draft is ready. Older versions can be restored as a draft.</span></div></div><div id="flwVers">${versionsHTML(f)}</div></section>
 <section class="card glass"><div class="cardhead"><div><h3>Template gallery</h3><span class="muted small" data-role="story">Start from a pattern. A copy opens as a new draft you can change.</span></div></div>${gallery()}</section></div>`}
function part(){const root=$q("[data-flw-root]");if(!root)return;const cv=$q("#flwCanvas"),sl=cv?cv.scrollLeft:0,st=cv?cv.scrollTop:0,ss=$q("#flwSide"),sy=ss?ss.scrollTop:0,ae=document.activeElement&&document.activeElement.dataset;const f=flow();root.outerHTML=ideBody(f);const nc=$q("#flwCanvas");if(nc){nc.scrollLeft=sl;nc.scrollTop=st}const ns=$q("#flwSide");if(ns)ns.scrollTop=sy}
function soft(n){const f=flow(),el=n&&$q(`[data-flw-node="${n.id}"]`);if(el){$q(".flw-nn",el).textContent=n.name;$q(".flw-nm",el).textContent=meta(n)}const v=$q("#flwValid");if(v)v.innerHTML=validHTML(f);const s=$q("#flwStatus");if(s)s.innerHTML=statusHTML(f);const vs=$q("#flwVers");if(vs)vs.innerHTML=versionsHTML(f)}
function redrawEdges(){const f=flow(),s=$q("#flwCanvas .flw-edges");if(s)s.innerHTML=edgesSvg(f)}
REG("flw_design","Workflow designer","automate","M4 5h6v5H4zM14 5h6v5h-6zM9 14h6v5H9zM7 10v2h10v-2M12 12v2",()=>{const f=flow(),v=validate(f);return `<div class="screen">${hero("Automation · Workflow designer",`Build the flow once, run it every time`,`<b>${F.flows.length} flow${F.flows.length===1?"":"s"}</b>, ${F.flows.filter(x=>x.pub!=null).length} published. The invoice flow <b>holds any Lumen invoice until milestone acceptance is recorded</b>, so the $22,000 overpayment on INV-20433 cannot repeat. ${v.filter(x=>x.sev==="err").length?`<b>${v.filter(x=>x.sev==="err").length} problems</b> block publishing.`:"It validates clean and is ready to publish."}`,`<div class="row">${fchip("m_wfrun")}${fchip("m_autoapp")}${aiChip({model:"Claude Sonnet",conf:.86,title:"Invoice flow drafted from policy",note:"Drafted from the AP policy and the Lumen SOW-4 terms. A person reviews every branch before publishing.",src:["AP policy 4.2","SOW-4 acceptance terms","Past overrides"]})}</div>`)}${lensNote()}${ideBody(f)}</div>`});
