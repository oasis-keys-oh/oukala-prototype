
/* ---------- seed fixes: every record carries a registry service, registry CIs, team assignment and measured impact inputs ---------- */
const INC_FIX={
INC0412:{svc:"Standards Platform",ci:"ci_por0",grp:"Ops team",own:"Sam Patel",ua:140,deg:85,txh:5000,reg:0,urg:2,role:"lead",swarm:["Tom Becker","Triage Agent"]},
INC0413:{svc:"Standards Platform",ci:"ci_cod2",grp:"Platform team",own:"",ua:30,deg:60,txh:800,reg:0,urg:1,role:"lead",swarm:["Sam Patel","Elise Park"]},
INC0408:{svc:"Search and indexing",ci:"ci_sea0",grp:"Data team",own:"Jordan Lee",ua:60,deg:30,txh:0,reg:0,urg:2,role:"analyst",direct:{by:"Tom Becker",why:"The restart test needs the architect who wrote it, and the Data team has no free engineer this week."}},
INC0405:{svc:"Lease subledger (ERP)",ci:"ci_erp2",grp:"Finance",own:"Avery Chen",ua:12,deg:40,txh:1500,reg:1,urg:2,role:"analyst"},
INC0409:{svc:"Contract Repository",ci:"ci_cr2",grp:"Platform team",own:"Elise Park",ua:8,deg:25,txh:0,reg:0,urg:3,role:"analyst"},
INC0401:{svc:"Identity (Entra ID)",ci:"ci_mfa",grp:"Service desk",own:"Tom Becker",ua:6,deg:30,txh:0,reg:0,urg:3,role:"analyst"},
INC0410:{svc:"Email and collaboration (M365)",ci:"ci_m361",grp:"Service desk",own:"Triage Agent",ua:12,deg:10,txh:0,reg:0,urg:3,role:"caller"},
INC0411:{svc:"Network and VPN",ci:"ci_vpn",grp:"Ops team",own:"Ravi Menon",st:"In progress",respH:.5,ua:3,deg:30,txh:0,reg:0,urg:2,role:"analyst"},
INC0402:{svc:"Data platform",ci:"ci_dat3",grp:"Data team",own:"Dev Rao",ua:25,deg:15,txh:0,reg:0,urg:2,role:"analyst"},
INC0406:{svc:"Endpoint management (Intune)",ci:"ci_end1",grp:"Service desk",own:"Northwind Managed Services",ua:20,deg:20,txh:0,reg:0,urg:3,role:"analyst"},
INC0407:{svc:"Lease subledger (ERP)",ci:"ci_int1",grp:"Finance",own:"",ua:8,deg:15,txh:0,reg:1,urg:3,role:"analyst",ovr:{p:2,from:3,by:"Avery Chen",role:"owner",why:"The payment export feeds Friday's AP run, so the service owner raised the priority.",at:"Oct 6 09:40"}},
INC0414:{svc:"Standards Portal",ci:"ci_por3",grp:"Platform team",own:"",ua:0,deg:0,txh:0,reg:1,urg:3,role:"analyst"},
INC0415:{svc:"Search and indexing",ci:"ci_sea2",grp:"Lumen (vendor)",own:"Marco Ellis",ua:40,deg:20,txh:0,reg:0,urg:3,role:"analyst"},
INC0403:{svc:"Network and VPN",ci:"ci_az",grp:"Ops team",own:"Sam Patel",ua:0,deg:0,txh:0,reg:0,urg:4,role:"analyst"},
INC0404:{svc:"Endpoint management (Intune)",ci:"ci_end0",grp:"Service desk",own:"Tom Becker",ua:4,deg:40,txh:0,reg:0,urg:3,role:"analyst"}};
const INC_NEW=()=>[
{id:"INC0416",t:"Executive laptop cannot join Teams meetings before the 15:00 call",d:"The CEO's laptop fails to join Teams meetings after the overnight update. A board call is at 15:00.",caller:"Executive office (CEO)",ch:"Phone",svc:"Endpoint management (Intune)",ci:"ci_end0",cat:"Hardware",grp:"Service desk",own:"",st:"New",age:.7,respH:null,prb:"",chg:"",kb:"",maj:false,ua:1,deg:80,txh:0,reg:0,urg:4,role:"analyst",vip:"board",notes:[mkN(.7,"Executive office","Comment","Laptop shows a blank window when joining Teams. Reported as low urgency by the assistant.")]},
{id:"INC0417",t:"Board pack site returns 403 for two directors",d:"Two directors cannot open the Board pack library in SharePoint. Papers are due tomorrow morning.",caller:"Corporate secretary",ch:"Email",svc:"Email and collaboration (M365)",ci:"ci_m362",cat:"Access and identity",grp:"Service desk",own:"Northwind Managed Services",st:"In progress",age:2.1,respH:.2,prb:"",chg:"",kb:"",maj:false,ua:2,deg:60,txh:0,reg:0,urg:3,role:"analyst",vip:"board",notes:[mkN(2.1,"Corporate secretary","Comment","Directors see Access denied on the Board pack library."),mkN(1.9,"Northwind Managed Services","Work note","Claimed for the Service desk. Checking group membership sync from Entra ID.")]}];

/* ---------- ITIL 5 aligned process strips ---------- */
const PROCS={
itsm_inc:{title:"Incident process (ITIL 5 Support activity)",std:["itil5","iso20k"],steps:[
 {n:"Detect and log",d:"Monitoring, a caller or an agent raises the incident against a service and CI.",who:"auto",owner:"Triage Agent",sla:"Seconds",in:"Alert or call",out:"Incident with service and CI"},
 {n:"Calculate priority",d:"Impact is computed from the service's key metrics. Urgency is the customer's choice within the role bounds. Priority comes from the matrix.",who:"auto",owner:"Incident manager",sla:"Instant",in:"Impact inputs and urgency",out:"P1 to P4"},
 {n:"Confirm triage",d:"An agent suggests category, team and similar incidents. A person confirms.",who:"agent",owner:"Triage Agent",sla:"5 min for P1 or P2",in:"Text and history",out:"Team and category"},
 {n:"Route to a team",d:"Work lands in the team queue. Individuals are not assigned from outside the team.",who:"auto",owner:"Service desk lead",sla:"Instant",in:"Category and service",out:"Assignment group"},
 {n:"Claim and swarm",d:"A team member claims it, or the team swarms. A direct assignment needs a stated reason.",who:"human",owner:"Team lead",sla:"Response target",in:"Team queue",out:"Owner and swarm"},
 {n:"Diagnose and restore",d:"Work the known error or runbook, link a change if one is needed, communicate.",who:"human",owner:"Resolver",sla:"Resolution target",in:"Runbooks, known errors",out:"Service restored"},
 {n:"Resolve and learn",d:"Record cause and code. An agent drafts the knowledge article and suggests a problem if it repeats.",who:"agent",owner:"Knowledge Curator",sla:"Same day",in:"Resolution notes",out:"Article and problem"}]},
itsm_prb:{title:"Problem process (ITIL 5 Support and Evolve)",std:["itil5"],steps:[
 {n:"Detect a pattern",d:"An agent groups repeat incidents by service and text and proposes a problem.",who:"agent",owner:"Triage Agent",sla:"Daily",in:"Incidents",out:"Problem candidate"},
 {n:"Assess and prioritize",d:"Rank by repeats times people affected.",who:"human",owner:"Problem manager",sla:"2 days",in:"Candidates",out:"Priority"},
 {n:"Root cause analysis",d:"Fishbone to find contributing causes by category, then five whys to the root.",who:"human",owner:"Problem owner",sla:"Per priority",in:"Fishbone, five whys",out:"Root cause"},
 {n:"Publish known error",d:"Record the workaround and symptoms so the desk can use them today.",who:"human",owner:"Problem owner",sla:"1 day after workaround",in:"Workaround",out:"Known error"},
 {n:"Fix through change",d:"Raise a change, a knowledge article or a demand for the permanent fix.",who:"gate",owner:"Change manager",sla:"Per change",in:"Root cause",out:"Change, article, demand"},
 {n:"Verify and close",d:"Confirm repeats stopped, retire the known error.",who:"auto",owner:"Problem manager",sla:"4 weeks",in:"Incident trend",out:"Closed problem"}]},
itsm_chg:{title:"Change enablement process (ITIL 5 Transition)",std:["itil5","devops"],steps:[
 {n:"Request and assess",d:"Describe the change, the service and CIs, plans and the risk questionnaire.",who:"human",owner:"Requester",sla:"Same day",in:"Request",out:"Risk score"},
 {n:"Check conflicts",d:"Collision on the same CI and freeze windows are checked live.",who:"auto",owner:"Change Risk Agent",sla:"Instant",in:"Dates and CIs",out:"Conflicts"},
 {n:"Route approvals",d:"The approval policies decide who approves, in what order, with what quorum.",who:"auto",owner:"Change manager",sla:"Instant",in:"Service, CI, type, risk, group, cost",out:"Approval route"},
 {n:"Approve",d:"Policy picks the approvers. Standard changes from a template need no vote.",who:"gate",owner:"Approvers",sla:"Per policy",in:"Route",out:"Decision"},
 {n:"Schedule and implement",d:"Calendar slot, implementation by the team, backout ready.",who:"human",owner:"Implementer",sla:"Window",in:"Plan",out:"Result"},
 {n:"Review",d:"Outcome feeds the change failure rate. Lessons go to the template or policy.",who:"human",owner:"Change manager",sla:"3 days",in:"Result",out:"Closed change"}]},
itsm_mi:{title:"Major incident process (ITIL 5 Support)",std:["itil5","iso20k"],steps:[
 {n:"Declare",d:"Tier 1 service, many users, no workaround.",who:"gate",owner:"Incident manager",sla:"15 min",in:"Incident",out:"War room"},
 {n:"Fill roles",d:"Commander, technical lead, communications lead, scribe.",who:"human",owner:"Incident commander",sla:"15 min",in:"Roster",out:"Named roles"},
 {n:"Diagnose and restore",d:"Diagnostics by an agent, decisions by people; emergency change if needed.",who:"agent",owner:"Technical lead",sla:"Per priority",in:"Runbook",out:"Restored service"},
 {n:"Communicate",d:"AI drafts, communications lead approves every update.",who:"gate",owner:"Communications lead",sla:"Every 60 min",in:"Timeline",out:"Updates"},
 {n:"Review",d:"Blameless post-incident review ends in tasks.",who:"human",owner:"Problem manager",sla:"5 business days",in:"Timeline",out:"Actions"}]},
itsm_home:{title:"Service desk operating rhythm",std:["itil5","iso20k"],steps:[
 {n:"Watch the queue",d:"Priority, timers and team queues.",who:"auto",owner:"Triage Agent",sla:"Live",in:"Incidents",out:"What needs attention"},
 {n:"Decide the day",d:"The service desk lead confirms ownership and escalations.",who:"human",owner:"Service desk lead",sla:"Start of shift",in:"Overview",out:"Plan"},
 {n:"Check changes",d:"Next 7 days, collisions, freezes.",who:"human",owner:"Change manager",sla:"Daily",in:"Calendar",out:"Risks to approve or move"},
 {n:"Improve",d:"Trends feed problems, knowledge and the policy.",who:"agent",owner:"Problem manager",sla:"Weekly",in:"Trends",out:"Improvements"}]}};
Object.keys(PROCS).forEach(k=>PROC.reg(k,PROCS[k]));

/* ---------- state: assembled once ---------- */
function ensureState(){
 if(X.inc)return;
 const FIXS=INC0().map(i=>{const f=INC_FIX[i.id]||{};const o=Object.assign({},i,f);delete o.imp;o.svc=svM(o.svc);o.ci=ciM(o.ci);o.notes=o.notes.map(n=>Object.assign({},n,{w:n.w==="Ops Agent"?"Triage Agent":n.w}));if(o.parent==null)delete o.parent;return o});
 const INCS=FIXS.concat(INC_NEW());
 INCS.forEach(i=>{if(i.own&&!i.direct){const m=who(i.own);if(!m||(m.team!==i.grp&&m.kind==="human"))i.direct=i.direct||{by:ME,why:"Named person has the context for this service."}}});
 const PR=PRB0().map(p=>{p.svc=svM(p.svc);return p});
 const CH=CHG0().concat(CHGH).map(c=>{c.svc=svM(c.svc);c.cis=(c.cis||[]).map(ciM);c.env=c.env||"Production";c.ok=(c.appr||[]).filter(a=>a.dec==="approved").map(a=>a.w==="CIO"?"Omar Hamid":a.w);return c});
 const KE=KE0().map(k=>{k.svc=svM(k.svc);return k});
 const KB=KB0().map(k=>{k.svc=svM(k.svc);return k});
 const TP=TPL0().map(t=>{t.svc=svM(t.svc);t.cis=t.cis.map(ciM);return t});
 const mi=MI0();mi.roles={ic:"Tom Becker",tech:"Sam Patel",comms:"",scribe:""};mi.tl=mi.tl.map(e=>[e[0],e[1]==="Ops Agent"?"Triage Agent":e[1],e[2],e[3]]);
 Object.assign(X,{inc:INCS,histI:HISTI.map(h=>Object.assign({},h,{svc:svM(h.svc)})),prb:PR,ke:KE,kb:KB,chg:CH,tpl:TP,mi,tasks:TASK0.slice(),kq:"",cm:"2026-10",sel:null,seq:{inc:418,prb:13,chg:324,ke:12,kb:220,t:9002,comm:4,pol:20,ap:12},ctype:"",cst:"",ovlog:[{id:"INC0407",from:3,to:2,by:"Avery Chen",role:"Service owner",why:"The payment export feeds Friday's AP run.",at:"Oct 6 09:40",appr:""}],fsel:{pid:"PRB0010",leaf:""},apsel:"",req:[
  {id:"RITM0231",t:"Standards beta access for 12 editors",st:"good",svc:"Standards Platform"},{id:"RITM0244",t:"Increase mailbox size for the Board secretary",st:"info",svc:"Email and collaboration (M365)"},{id:"RITM0252",t:"New laptop for incoming analyst",st:"mute",svc:"Endpoint management (Intune)"}]});
}
ensureState();
