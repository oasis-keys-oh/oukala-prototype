/* ===== mod_org5: people lifecycle on the org chart (Round 15, Agent A). Prefix org5.
   Joiner, mover, change status (formerly leaver), edit; employment type and FTE; vacancies as ghost cards; Entra ID style directory sync; lifecycle events through window.EVENTS
   (local queue until the bus loads); compensation, benefits and PTO tab (restricted, masked). Reuses ORGX staff, DIR, S.pp2.vac (People vacancies), METRICS, PROCLIB, ATLAS, MODMAP. ===== */
(function(){
const O=window.ORGX;if(!O||!O.staff||!O.by)return;
const OS=S.org;
const H=s=>esc(s==null?"":String(s));
const slug=O.slug,first=O.first;
const TODAY="2026-10-10";
const HR=OS.hr=Object.assign({log:[],tasks:[],former:[],sched:[],seq:1,applied:{},lastSync:"2026-10-10 06:30",reveals:[],pto:{},as:"",seeded:false,vopen:null},OS.hr||{});
const ET={ft:["Full-time","FT"],pt:["Part-time","PT"],ct:["Contractor","CT"],in:["Intern","INT"]};
const ETK=Object.keys(ET);
const fmtD=s=>{try{return new Date(s+"T00:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}catch(e){return s||""}};
const addDays=(s,n)=>{const d=new Date(s+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const daysBetween=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
const money=n=>"$"+Math.round(n).toLocaleString("en-US");
const G=(f,d)=>{try{return f()}catch(e){return d}};

/* ---------- employment type: stored on the staff record (et, fte) ---------- */
const SEEDET={"Isla Fenn":["pt",.6],"Femi Adeyemi":["pt",.8],"Wes Hartley":["pt",.5],"Grace Whitfield":["pt",.9],"Hannah Lowe":["ct",1],"Owen Pryce":["ct",1],"Ben Alvarez":["ct",1]};
O.staff.forEach(p=>{if(!p.et){const s=SEEDET[p.n];p.et=s?s[0]:"ft";p.fte=s?s[1]:1}});
const etOf=n=>{const p=O.P(n);return p?{et:p.et||"ft",fte:p.fte!=null?p.fte:1}:{et:"ft",fte:1}};
const etShort=n=>{const x=etOf(n);return x.et==="pt"?"PT "+x.fte.toFixed(1).replace(/^0/,""):ET[x.et][1]};
O.etOf=etOf;
O.etBadge=n=>{const p=O.P(n);if(!p)return "";const x=etOf(n);const note=p.leaving?"Leaves "+fmtD(p.leaving):p.moving?"Moves "+fmtD(p.moving.eff):p.start&&p.start>TODAY?"Starts "+fmtD(p.start):"";
 return `<span class="org5-et ${note?"nt":x.et}" title="${H(ET[x.et][0]+(x.et==="pt"?", "+x.fte+" FTE":"")+(note?" · "+note:""))}">${H(note||etShort(n))}</span>`};

/* ---------- vacancies: stored in the People vacancy list (S.pp2.vac) so one requisition list exists; fields added here ---------- */
const UMAP={"Platform team":"Platform engineering","Service desk":"Service desk and operations","Data team":"Data and analytics","Security":"Security","Editors":"Editorial","Lumen (vendor)":"Portfolio and delivery"};
const MMAP={"Chief Editor":"Elena Marsh","Marta Kessler":"Dev Rao"};
const BUDLINES=[["BL-1100","BL-1100 Technology personnel"],["BL-1200","BL-1200 Contract labor"],["BL-1300","BL-1300 Editorial personnel"],["BL-1500","BL-1500 Intern program"],["BL-1600","BL-1600 Security personnel"]];
const budFor=v=>v.et==="in"?"BL-1500":v.et==="ct"?"BL-1200":/Editorial/.test(v.unit)?"BL-1300":/Security/.test(v.unit)?"BL-1600":"BL-1100";
function pp2(){return G(()=>S.pp2,null)}
function seedVac(){const s=pp2();if(!s||!s.vac||HR.seeded)return;HR.seeded=true;
 if(!s.vac.some(v=>v.id==="V07"))s.vac.push({id:"V07",title:"Enterprise data steward",team:"Technology",mgr:"Casey Rowan",kind:"human",status:"Open",opened:"2026-10-05",skills:["Data governance","Metadata"],loaded:76000,et:"pt",fte:.5});
 if(!s.vac.some(v=>v.id==="V08"))s.vac.push({id:"V08",title:"Editorial intern",team:"Editorial",mgr:"Elena Marsh",kind:"human",status:"Sourcing",opened:"2026-09-28",skills:["Style guide","Research"],loaded:34000,et:"in",fte:.5})}
function vnorm(v){if(v._n)return v;v._n=1;v.req=v.req||"REQ-26-"+String(v.id).replace(/\D/g,"").padStart(3,"0");v.unit=v.unit||UMAP[v.team]||v.team;v.rep=v.rep||MMAP[v.mgr]||v.mgr;v.et=v.et||(v.kind==="contractor"?"ct":"ft");v.fte=v.fte!=null?v.fte:1;v.target=v.target||addDays(v.opened,75);v.budget=v.budget||budFor(v);return v}
function vacsAll(){seedVac();const s=pp2();return s&&s.vac?s.vac.map(vnorm):[]}
const vacOpen=()=>vacsAll().filter(v=>v.status!=="Filled");
const vacBy=id=>vacsAll().find(v=>v.id===id||v.req===id)||null;
const vage=v=>Math.max(0,daysBetween(v.opened,TODAY));
O.vacs=vacsAll;O.vacOpen=vacOpen;O.vacFor=n=>vacOpen().filter(v=>v.rep===n&&O.P(v.rep));
O.vacNode=v=>({id:"vac:"+v.id,t:"v",v,kids:[]});
O.vacCard=function(c,pos){const v=c.v,x=ET[v.et];const old=vage(v)>35;
 return `<div class="org-n org-vac" data-oid="${H(c.id)}" style="${pos}"><button type="button" class="org-card vac" data-org5-vac="${H(v.id)}" aria-label="Open position ${H(v.title)}, ${H(x[0])}, reports to ${H(v.rep)}, open ${vage(v)} days"><span class="org5-vi" aria-hidden="true">+</span><span class="org-t" title="${H(v.title)}"><b><span class="org5-op">Open</span> ${H(v.title)}</b><small>Position · ${H(v.req)}</small><span class="org-m"><em class="${old?"warn":""}">${vage(v)}d open</em><em>${H(v.et==="pt"?"PT "+v.fte:x[1])}</em><em>${H(v.status)}</em></span></span></button></div>`};
O.vacOutline=v=>`<li role="treeitem" class="org-ol-a"><button type="button" class="org-ol org5-vo" data-org5-vac="${H(v.id)}"><span class="org5-vi sm" aria-hidden="true">+</span><span><b>${H(v.title)} <span class="pill warn">Open position</span></b><small>${H(v.req)} · ${H(ET[v.et][0])} · ${H(v.status)} · ${vage(v)} days open</small></span></button></li>`;

/* ---------- events: window.EVENTS when present, otherwise a local queue that replays ---------- */
const EVDEF=[["person.created","Person created","person_id:ref:person,name:text,title:text,manager:ref:person,team:text,employment_type:enum,fte:number,start_date:date,source:text"],
 ["person.updated","Person updated","person_id:ref:person,changes:list,effective:date"],
 ["person.terminated","Person left","person_id:ref:person,name:text,effective:date,reason:enum,rehire_eligible:boolean,handover:list"],
 ["person.status_changed","Person status changed","person_id:ref:person,name:text,from_status:enum,to_status:enum,category:enum,effective:date,return_date:date,reason:text,rehire_eligible:boolean,approval_group:text,launches:list,handover:list"],
 ["person.moved","Person moved","person_id:ref:person,from_manager:ref:person,to_manager:ref:person,from_team:text,to_team:text,from_title:text,to_title:text,effective:date"],
 ["person.employment_type_changed","Employment type changed","person_id:ref:person,from_type:enum,to_type:enum,from_fte:number,to_fte:number,effective:date"],
 ["vacancy.opened","Vacancy opened","req_id:text,title:text,team:text,reports_to:ref:person,employment_type:enum,target_start:date,budget_line:text"],
 ["vacancy.filled","Vacancy filled","req_id:text,person_id:ref:person,start_date:date"],
 ["vacancy.closed","Vacancy closed","req_id:text,reason:enum"]];
const act=(action,connector,label)=>{const o={action,connector,label};
 if(action==="call_connector"){o.target=connector;o.op=label}else if(action==="create_task"){o.title=label;o.target=connector;o.owner="Hiring manager"}else if(action==="notify"){o.target=connector;o.message=label}
 else if(action==="start_workflow"){o.target=label}else if(action==="update_record"){o.entity=slug(connector).replace(/-/g,"_");o.rid="{recordId}";o.field="status";o.value="updated"}return o};
const DEDUP=["org_r_term_idp","org_r_term_itsm","org_r_vf_wf"];
const DR=[
 {id:"org_r_create_idp",when:"person.created",label:"Create the identity account",then:[act("call_connector","Microsoft Graph","POST /users, add to the team group, assign licence")]},
 {id:"org_r_create_itsm",when:"person.created",label:"Provision equipment and access",then:[act("create_task","ITSM","Laptop, accounts and building access for the new starter")]},
 {id:"org_r_create_pay",when:"person.created",label:"Notify payroll and benefits",then:[act("notify","Payroll","New starter: pay record and benefits enrollment window")]},
 {id:"org_r_create_wf",when:"person.created",label:"Start the joiner process",then:[act("start_workflow","Workflow","org_joiner")]},
 {id:"org_r_upd_idp",when:"person.updated",label:"Update the identity profile",then:[act("call_connector","Microsoft Graph","PATCH /users: title, location, department")]},
 {id:"org_r_upd_itsm",when:"person.updated",label:"Update the ITSM user record",then:[act("update_record","ITSM","User record fields from the directory")]},
 {id:"org_r_mv_idp",when:"person.moved",label:"Update manager and group membership",then:[act("call_connector","Microsoft Graph","PATCH /users/manager; swap team groups")]},
 {id:"org_r_mv_itsm",when:"person.moved",label:"Open an access review task",then:[act("create_task","ITSM","Remove old-team access, grant new-team access")]},
 {id:"org_r_mv_notify",when:"person.moved",label:"Notify both managers",then:[act("notify","Email","Old and new manager: handover and start date")]},
 {id:"org_r_term_idp",when:"person.terminated",label:"Deprovision the identity",then:[act("call_connector","Microsoft Graph","Disable account, revoke sessions, remove licences")]},
 {id:"org_r_term_mail",when:"person.terminated",label:"Archive mailbox and files",then:[act("call_connector","Microsoft Graph","Convert mailbox to shared, move files to the manager")]},
 {id:"org_r_term_itsm",when:"person.terminated",label:"Create access removal tasks",then:[act("create_task","ITSM","Remove access to each system; recover laptop and badge")]},
 {id:"org_r_term_pay",when:"person.terminated",label:"Notify payroll",then:[act("notify","Payroll","Final pay, PTO payout and benefits end date")]},
 {id:"org_r_et_pay",when:"person.employment_type_changed",label:"Notify payroll and benefits",then:[act("notify","Payroll","Status or FTE change: pay and benefits eligibility")]},
 {id:"org_r_et_idp",when:"person.employment_type_changed",label:"Update licence assignment",then:[act("call_connector","Microsoft Graph","PATCH /users employeeType; reassign licence")]},
 {id:"org_r_vo_ats",when:"vacancy.opened",label:"Publish the requisition",then:[act("call_connector","Applicant tracking","Create requisition and job posting")]},
 {id:"org_r_vo_plan",when:"vacancy.opened",label:"Reserve headcount in the plan",then:[act("update_record","Headcount plan","Reserve the position against the budget line")]},
 {id:"org_r_vf_ats",when:"vacancy.filled",label:"Close the requisition",then:[act("call_connector","Applicant tracking","Mark requisition filled; reject remaining candidates")]},
 {id:"org_r_vf_wf",when:"vacancy.filled",label:"Start the joiner process",then:[act("start_workflow","Workflow","org_joiner")]},
 {id:"org_r_vc_ats",when:"vacancy.closed",label:"Withdraw the requisition",then:[act("call_connector","Applicant tracking","Withdraw requisition and postings")]},
 {id:"org_r_vc_plan",when:"vacancy.closed",label:"Release the headcount",then:[act("update_record","Headcount plan","Release the reserved position to the budget line")]}];
const EQ=[];let EVSEQ=0;
const bus=()=>window.EVENTS&&typeof window.EVENTS.emit==="function"?window.EVENTS:null;
function regEvents(){const b=bus();if(!b||HR._reg)return;
 G(()=>{if(b.register)EVDEF.forEach(e=>b.register({id:e[0],label:e[1],module:"org_chart",owner:"Joanna Pierce",fields:e[2].split(",").map(f=>{const q=f.split(":");return{name:q[0],type:q[1],ref:q[2]}})}));HR._reg=1});
 G(()=>{if(b.addRule&&!HR._rules){const have=new Set((b.rules||[]).map(r=>r.id));DR.forEach(r=>{if(DEDUP.indexOf(r.id)>=0&&(b.rules||[]).some(x=>x.when===r.when&&!/^org_r_/.test(x.id)))return;if(!have.has(r.id))b.addRule({id:r.id,when:r.when,label:r.label,then:r.then.map(a=>Object.assign({},a)),enabled:true,owner:"Joanna Pierce"})});HR._rules=1}})}
const viewer=()=>HR.as||(S.persona==="exec"?"Casey Rowan":(G(()=>PERSONAS[S.persona].n,"")||"Viewer"));
function alias(id,p){p=p||{};if(p.person_id&&!p.personId)p.personId=p.person_id;if(p.req_id&&!p.vacancyId)p.vacancyId=p.req_id;if(!p.recordId)p.recordId=p.person_id||p.req_id||"";if(id==="person.employment_type_changed"){p.to=(ET[p.to_type]||[p.to_type])[0];p.from=(ET[p.from_type]||[p.from_type])[0]}return p}
function emit(id,payload,src){payload=alias(id,payload);const r={id,payload,src:src||"org_chart",t:Date.now(),eid:null,local:"LEV-"+(++EVSEQ),via:"queue"};const b=bus();
 if(b){regEvents();try{r.eid=b.emit(id,payload,{source:r.src,actor:viewer()});r.via="bus"}catch(e){r.err=String(e&&e.message||e);EQ.push(r)}}else EQ.push(r);return r}
setInterval(()=>{const b=bus();if(!b)return;regEvents();if(!EQ.length)return;while(EQ.length){const r=EQ.shift();try{r.eid=b.emit(r.id,r.payload,{source:r.src,actor:viewer(),replayed:true});r.via="bus (replayed)"}catch(e){r.err=String(e&&e.message||e)}}if(S.screen==="org_chart"&&document.querySelector("[data-org5-trig]")==null&&OS.tab==="act")render()},1500);
function rulesFor(id){const b=bus();let L=[];if(b&&Array.isArray(b.rules)&&b.rules.length)L=b.rules.filter(r=>r&&r.when===id&&r.enabled!==false).map(r=>({id:r.id,label:r.label||r.name||r.id,then:r.then||[],iff:r.if,src:"bus"}));
 if(!L.length)L=DR.filter(r=>r.when===id).map(r=>({id:r.id,label:r.label,then:r.then,src:"local"}));return L}
const aTarget=a=>{const t=a.connector||a.system||a.channel||a.target||a.to||a.url||"";return t===aText(a)?"":t};
const aText=a=>a.label||a.op||a.title||a.message||a.template||a.process||a.name||(a.entity?"Set "+a.entity+"."+(a.field||"status")+" = "+(a.value||""):"")||a.target||"";
let PHP=null;const ph=t=>String(t==null?"":t).replace(/\{([\w.]+)\}/g,(m,k)=>PHP&&PHP[k]!=null&&PHP[k]!==""?String(PHP[k]):"\u2039"+k+"\u203a");
const aKind=a=>({call_connector:"Connector call",create_task:"Task",notify:"Notification",update_record:"Record update",start_workflow:"Workflow",webhook:"Webhook"})[a.action]||a.action||"Action";
function trigRows(evs){const rows=[];evs.forEach(e=>rulesFor(e.id).forEach(r=>(r.then&&r.then.length?r.then:[{}]).forEach(a=>rows.push({ev:e.id,rule:r,a}))));return rows}
const outcomeOf=(eid)=>{const b=bus();if(!b||!eid||!Array.isArray(b.log))return null;const x=b.log.find(l=>l.eventId===eid);return x?x.outcomes||[]:null};
function trigHTML(evs,o){o=o||{};const rows=trigRows(evs),b=bus();const evMap={};evs.forEach(e=>{evMap[e.id]=e.eid});const state=o.preview?"Will fire":o.scheduled?"Scheduled":"Fired";
 const stOf=x=>{if(o.preview||o.scheduled)return[state,"mute"];const oc=outcomeOf(evMap[x.ev]);if(!oc)return[x.rule.src==="local"?"Queued":"Fired","info"];const m=oc.find(z=>z.rule===x.rule.id);if(!m)return["Not run","mute"];return m.status==="fired"?["Fired","good"]:m.status==="skipped"?["Skipped, condition false","mute"]:["Error","bad"]};
 return `<div class="org5-trig" data-org5-trig><div class="org5-trh"><b>Triggers</b><span class="muted small">${rows.length} action${rows.length===1?"":"s"} from ${new Set(rows.map(x=>x.rule.id)).size} rules on ${evs.length} event${evs.length===1?"":"s"}</span><span class="pill ${b?"good":"warn"}" title="${b?"window.EVENTS is connected":"window.EVENTS is not loaded; events wait in a local queue and replay when it appears"}">${b?"Event bus connected":"Local queue, replays on load"}</span>${o.edit===false?"":`<button type="button" class="chip" data-org5="rules" data-ev="${H(evs.map(e=>e.id)[0]||"")}">Edit rules</button>${bus()?`<button type="button" class="chip" data-org5="newrule" data-ev="${H(evs.map(e=>e.id)[0]||"")}">New rule</button>`:""}`}</div>
 ${rows.length?`<ul class="org5-tl">${rows.map(x=>{const q=stOf(x);PHP=(()=>{const b=bus();const l=b&&Array.isArray(b.log)&&evMap[x.ev]?b.log.find(z=>z.eventId===evMap[x.ev]):null;return l?l.payload:null})();const lab=ph(x.rule.label&&x.rule.label!==x.rule.id?x.rule.label:aText(x.a)||x.rule.id);return `<li><div class="org5-tl1"><b>${H(lab)}</b><span class="pill ${q[1]}">${H(q[0])}</span><span class="pill warn" title="No real system is called in this prototype">Simulated</span></div><div class="org5-tl2"><code>${H(x.ev)}</code> <span class="muted small">${H(x.rule.id)}</span> · ${H(aKind(x.a))}${aText(x.a)&&ph(aText(x.a))!==lab?": "+H(ph(aText(x.a))):""}${aTarget(x.a)?" · <b>"+H(aTarget(x.a))+"</b>":""}${x.rule.iff?` <span class="muted small">if ${H(x.rule.iff)}</span>`:""}</div></li>`}).join("")}</ul>`:`<p class="muted small">No rule listens to ${evs.length?H(evs[0].id):"these events"}. Add one in the rules editor.</p>`}</div>`}
const EVPILL=r=>`<span class="pill ${r.via&&r.via.indexOf("bus")===0?"good":"mute"}" title="${H(r.id)} ${H(r.eid||r.local)}">${H(r.id.replace("person.","").replace("vacancy.","vac."))}</span>`;

/* ---------- process models (editable in the drawing studio through PROC / PROCLIB) ---------- */
const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const PM=[
 {id:"org_joiner",name:"Join the organization (joiner)",owner:"Joanna Pierce",backup:"Grace Whitfield",trigger:"A person is added to the org chart or an offer is accepted",
  steps:[st("Record the new person","Name, title, team, manager, employment type and FTE, start date. RACI: Responsible HR partner, Accountable Joanna Pierce, Consulted the hiring manager, Informed the CIO.","human","Joanna Pierce","1 day","Offer or approved vacancy","Person record"),
   st("Create identity and groups","Directory account, team groups and licence from the person.created rule.","robot","Colette Brandt","Immediate","Person record","Identity account"),
   st("Order equipment and access","Laptop, building access and role access requests as ITSM tasks.","human","Wes Hartley","3 days","Identity account","Equipment and access ready"),
   st("Plan the first 90 days","Buddy, goals and training path. RACI: Responsible manager, Accountable manager, Consulted People Operations.","human","The manager","5 days","Person record","30/60/90 plan"),
   st("Enroll pay and benefits","Payroll record, benefits election and PTO accrual set up.","human","Joanna Pierce","5 days","Person record","Pay and benefits record"),
   st("Day-one check","Manager confirms access works and the plan is shared.","gate","The manager","Day 1","Equipment and access ready","Active person")],
  inputs:["Offer or approved vacancy","Start date"],outputs:["Person record","Identity account","Pay and benefits record"],entities:["person","position","organization_unit","compensation_record","benefit_enrollment","pto_balance"],metrics:["m_org_fte","m_org_hc_plan","m_org_lc"]},
 {id:"org_mover",name:"Change role, team or manager (mover)",owner:"Joanna Pierce",backup:"Grace Whitfield",trigger:"A promotion, transfer, reorganization or manager change is approved",
  steps:[st("Approve the move","Old and new manager and People Operations agree the change and date. RACI: Responsible HR partner, Accountable Joanna Pierce, Consulted both managers, Informed the CIO.","gate","Joanna Pierce","3 days","Move request","Approved move"),
   st("Update reporting line","Manager, team and title change on the effective date; the chart redraws.","robot","Org chart","Immediate","Approved move","Updated person record"),
   st("Hand over owned work","Metrics, processes, data, services and approvals the person owns are kept or handed over.","human","The outgoing manager","5 days","Updated person record","Ownership reassigned"),
   st("Review access","Remove old-team access and grant new-team access.","human","Colette Brandt","5 days","Updated person record","Access reviewed"),
   st("Confirm after 30 days","New manager confirms the move is working.","human","The new manager","30 days","Access reviewed","Move closed")],
  inputs:["Move request"],outputs:["Updated person record","Ownership reassigned","Access reviewed"],entities:["person","organization_unit","role","access_review"],metrics:["m_org_lc","m_org_own"]},
 {id:"org_separation",name:"Separate from the organization (change status)",owner:"Joanna Pierce",backup:"Colette Brandt",trigger:"A status change to retired, resigned, terminated, laid off, contract ended or transferred is applied",
  steps:[st("Record the separation","Last day, reason and rehire eligibility. RACI: Responsible manager, Accountable Joanna Pierce, Consulted legal for dismissals, Informed security and the CIO.","human","Joanna Pierce","1 day","Status change","Separation record"),
   st("Hand over owned work","Every metric, process, entity, service, project, risk and accountability domain gets a named new owner.","gate","The manager","Before last day","Separation record","Ownership reassigned"),
   st("Transfer agent sponsorship","Each AI agent sponsored by the person gets a new human sponsor.","gate","Kenji Watanabe","Before last day","Separation record","Agents re-sponsored"),
   st("Deprovision identity","Disable account, revoke sessions and licences on the last day.","robot","Colette Brandt","Last day","Separation record","Account disabled"),
   st("Recover equipment and access","Laptop, badge and system access removal tasks.","human","Tom Becker","5 days","Account disabled","Equipment recovered"),
   st("Final pay and benefits","Final pay, PTO payout and benefits end date.","human","Joanna Pierce","Last day","Separation record","Final pay record"),
   st("Archive","Mailbox and files archived; person moves to former staff.","robot","Directory sync","Last day + 30","Account disabled","Archived person")],
  inputs:["Status change"],outputs:["Ownership reassigned","Agents re-sponsored","Account disabled","Final pay record"],entities:["person","role","access_review","compensation_record","benefit_enrollment","pto_balance"],metrics:["m_org_lc","m_org_own","m_org_gov"]},
 {id:"org_vac_hire",name:"Fill an open position (vacancy to hire)",owner:"Joanna Pierce",backup:"Victor Amaya",trigger:"A manager opens a requisition against an approved budget line",
  steps:[st("Open the requisition","Title, team, reports-to, employment type and target start. RACI: Responsible hiring manager, Accountable Joanna Pierce, Consulted finance, Informed the CIO.","human","The hiring manager","2 days","Headcount need","Requisition"),
   st("Approve headcount and budget line","Position is in plan and the budget line has room.","gate","Victor Amaya","3 days","Requisition","Approved position"),
   st("Publish","Requisition posted to the applicant tracking system.","robot","Applicant tracking","Immediate","Approved position","Open vacancy"),
   st("Source and interview","Screens, interviews and references.","human","The hiring manager","30 days","Open vacancy","Selected candidate"),
   st("Make the offer","Offer within the pay band; approval by People Operations.","gate","Joanna Pierce","5 days","Selected candidate","Accepted offer"),
   st("Fill the vacancy","The person is created from the vacancy and the joiner process starts.","robot","Org chart","Immediate","Accepted offer","Active person")],
  inputs:["Headcount need"],outputs:["Open vacancy","Active person"],entities:["position","person","budget_line","compensation_record"],metrics:["m_org_vac_age","m_org_hc_plan","m_org_fte"]}];
const procSteps=id=>G(()=>PROC.defs[id].steps,null)||(PM.find(p=>p.id===id)||{steps:[]}).steps;

/* ---------- metrics ---------- */
const MR=(kind,ref,title,agent,prog)=>({kind,ref,title,agent,auto:false,state:"idle",prog});
Object.assign(METRICS,{
 m_org_fte:{n:"Full-time equivalent (FTE)",f:"Σ FTE fraction of every active person: full-time 1.0, part-time and intern at the stated fraction, contractor at the stated fraction. Source: employment type and FTE on the Org chart person record",u:"FTE",cur:44,tgt:46,badAt:40,dir:"max",max:60,tr:[41,41.5,42,42.5,43,43.4,43.8,44],owner:"Joanna Pierce",use:["Org chart"],rem:MR("sop","SOP-ORG6","Compare FTE with the headcount plan before opening a requisition","People Operations","Vacancies tab shows plan, actual and open positions")},
 m_org_hc_plan:{n:"Headcount vs plan",f:"Active people ÷ (active people + open vacancies in the headcount plan) × 100. Sources: Org chart staff and the vacancy list",u:"%",cur:85,tgt:92,badAt:75,dir:"max",max:100,tr:[80,81,82,82,83,84,84,85],owner:"Joanna Pierce",use:["Org chart"],rem:MR("sop","SOP-ORG7","Fill or close the oldest open position","People Operations","Vacancies tab, sorted by days open")},
 m_org_pt:{n:"Part-time, contract and intern share",f:"People whose employment type is part-time, contractor or intern ÷ active people × 100. Source: employment type on the Org chart person record",u:"%",cur:15,tgt:20,badAt:40,dir:"min",max:50,tr:[12,12,13,13,14,14,15,15],owner:"Joanna Pierce",use:["Org chart"],rem:MR("sop","SOP-ORG8","Review contractor roles that have run longer than 12 months","People Operations","Filter the chart by Contractor")},
 m_org_vac_age:{n:"Open vacancy age",f:"Average days from requisition opened to today across open vacancies. Source: vacancy list (req opened date)",u:"days",cur:30,tgt:45,badAt:70,dir:"min",max:120,tr:[28,31,35,38,40,36,33,30],owner:"Joanna Pierce",use:["Org chart"],rem:MR("agent","AG-ORG9","Escalate requisitions open longer than 45 days to the hiring manager","Agent studio","Opens the Vacancies tab sorted by age")},
 m_org_lc:{n:"Lifecycle events with every rule fired",f:"person.* and vacancy.* events where every enabled rule produced an action ÷ all such events × 100. Source: event log",u:"%",cur:100,tgt:98,badAt:90,dir:"max",max:100,tr:[96,97,98,98,99,99,100,100],owner:"Colette Brandt",use:["Org chart"],rem:MR("sop","SOP-ORG10","Fix the failing rule or connector in the rules editor","Identity engineering","Lifecycle activity tab lists events with a failed action")}});
function stats5(){const S0=O.staff;const n=S0.length;const fte=S0.reduce((a,p)=>a+(p.fte!=null?p.fte:1),0);const by={ft:0,pt:0,ct:0,in:0};S0.forEach(p=>by[p.et||"ft"]++);const vo=vacOpen();const vf=vo.reduce((a,v)=>a+v.fte,0);
 const age=vo.length?vo.reduce((a,v)=>a+vage(v),0)/vo.length:0;return{n,fte:+fte.toFixed(1),by,vo:vo.length,vfte:+vf.toFixed(1),plan:n+vo.length,planFte:+(fte+vf).toFixed(1),pct:Math.round(100*n/Math.max(1,n+vo.length)),age:Math.round(age),flex:Math.round(100*(by.pt+by.ct+by.in)/Math.max(1,n))}}
O.stats5=stats5;
const _sync=O.sync;O.sync=function(){if(_sync)_sync.apply(this,arguments);G(()=>{const s=stats5();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(0,7).concat([v])};set("m_org_fte",s.fte);set("m_org_hc_plan",s.pct);set("m_org_pt",s.flex);set("m_org_vac_age",s.age);set("m_org_lc",lcPct())})};
function lcPct(){const L=HR.log;if(!L.length)return 100;let tot=0,bad=0;L.forEach(e=>e.events.forEach(ev=>{tot++;const oc=outcomeOf(ev.eid);if(oc&&oc.some(z=>z.status==="error"))bad++}));return tot?Math.round(100*(tot-bad)/tot):100}

/* ---------- helpers for forms ---------- */
const units=()=>[...new Set(O.staff.map(p=>p.unit))].sort();
const pOpts=(ex)=>O.staff.filter(p=>p.n!==ex&&!(ex&&O.up(p.n).includes(ex))).map(p=>[p.n,p.n+" · "+p.role]);
const pOptsAll=ex=>O.staff.filter(p=>p.n!==ex).map(p=>[p.n,p.n+" · "+p.role]);
const etOpts=ETK.map(k=>[k,ET[k][0]]);
const LOCS=["Norwalk, CT","Washington, DC","Chicago, IL","Remote"];
function rtFor(unit){const c={};O.staff.filter(p=>p.unit===unit).forEach(p=>c[p.rt]=(c[p.rt]||0)+1);const k=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];return k||"dev"}
const emailOf=n=>slug(n).replace(/-/g,".")+"@meridian.example";
const uniqName=n=>!O.names.has(String(n).trim());
function ownedCounts(n){const w=O.ownRecs(n),ag=O.agentsOf(n),dm=O.owns(n);let pend=0;G(()=>{pend=O.pending(n).reduce((s,g)=>s+g.rows.length,0)},0);
 return{metrics:w.metrics,procs:w.procs,ents:w.ents,svcs:w.svcs,projs:w.projs,raid:w.raid,backup:w.backup,agents:ag,domains:dm.filter(d=>d.role==="owner"),dombk:dm.filter(d=>d.role==="backup"),kids:O.kids(n),pend,
  approvals:G(()=>O.perms(n).app,[])}}
function ownedTotal(c){return c.metrics.length+c.procs.length+c.ents.length+c.svcs.length+c.projs.length+c.raid.length+c.agents.length+c.domains.length+c.kids.length}
function liveBlock(n,evs,eff){const c=ownedCounts(n);const rows=[["Direct reports",c.kids.length],["Metrics",c.metrics.length],["Processes",c.procs.length],["Data entities",c.ents.length],["Services",c.svcs.length],["Projects",c.projs.length],["Open risks",c.raid.length],["Accountability domains",c.domains.length],["AI agents sponsored",c.agents.length],["Backup for processes",c.backup.length+c.dombk.length],["Pending approvals",c.pend]].filter(r=>r[1]);
 return `<div class="org5-own"><b>What ${H(first(n))} owns</b><div class="row">${rows.map(r=>`<span class="pill ${r[0]==="AI agents sponsored"||r[0]==="Accountability domains"?"warn":"info"}">${r[0]} · ${r[1]}</span>`).join("")||'<span class="muted small">Nothing owned in the registries</span>'}</div></div>${trigHTML(evs.map(e=>({id:e})),{preview:true})}`}

/* ---------- performing actions ---------- */
let PL_DIRTY=0;
function reown(kind,ids,to){ids.forEach(id=>{G(()=>{
 if(kind==="metrics")METRICS[id].owner=to;
 else if(kind==="procs"){const o=S.plib.own;o[id]=Object.assign({},o[id]||{},{owner:to});if(o[id].backup===to)o[id].backup=undefined;PL_DIRTY=1}
 else if(kind==="ents"){const e=PLAT.ent(id);if(e){if(e.steward!=null)e.steward=to;else e.owner=to}}
 else if(kind==="svcs"){const s=SVCREG.find(z=>z.id===id);if(s)s.owner=to}
 else if(kind==="projs"){const p=PROJ.find(z=>z.id===id);if(p)p.owner=to}
 else if(kind==="raid"){const r=(window.PPMRAID||[]).find(z=>z.id===id);if(r)r.own=to}})})}
function setSponsor(a,to){if(O.agSeed&&O.agSeed[a.name])O.agSeed[a.name].sp=to;a.sponsor=to;G(()=>{const g=(S.agents||[]).find(x=>x.id===a.id||x.n===a.name);if(g){["sponsor","owner","own"].forEach(k=>{if(g[k]!=null)g[k]=to})}})}
function handOver(n,v){const c=ownedCounts(n),moved=[];const to=k=>v[k]||v.h_all;
 [["metrics","Metrics"],["procs","Processes"],["ents","Data entities"],["svcs","Services"],["projs","Projects"],["raid","Open risks"]].forEach(([k,l])=>{if(c[k].length&&to("h_"+k)){reown(k,c[k],to("h_"+k));moved.push({what:l,n:c[k].length,to:to("h_"+k)})}});
 if(c.domains.length&&to("h_dom")){c.domains.forEach(d=>{const dd=O.domains.find(x=>x.id===d.domainId);if(dd){dd.ownerId=slug(to("h_dom"));if(dd.backupId===dd.ownerId)dd.backupId=""}});moved.push({what:"Accountability domains",n:c.domains.length,to:to("h_dom")})}
 if(c.dombk.length){c.dombk.forEach(d=>{const dd=O.domains.find(x=>x.id===d.domainId);if(dd&&dd.backupId===slug(n)){dd.backupId=(v.h_dom&&slug(v.h_dom)!==dd.ownerId)?slug(v.h_dom):""}});moved.push({what:"Backup roles",n:c.dombk.length,to:v.h_dom||"(vacant)"})}
 if(c.agents.length&&to("h_agents")){c.agents.forEach(a=>setSponsor(a,to("h_agents")));moved.push({what:"AI agent sponsorship",n:c.agents.length,to:to("h_agents")})}
 if(c.kids.length&&v.h_kids){c.kids.forEach(k=>{const p=O.P(k);if(p){p.mgr=v.h_kids;const d=O.dir(k);if(d)d.mgr=v.h_kids}});moved.push({what:"Direct reports",n:c.kids.length,to:v.h_kids})}
 if(c.backup.length&&to("h_bkp")){c.backup.forEach(id=>G(()=>{const o=S.plib.own;o[id]=Object.assign({},o[id]||{},{backup:to("h_bkp")});PL_DIRTY=1}));moved.push({what:"Backup owner on processes",n:c.backup.length,to:to("h_bkp")})}
 if(c.pend&&v.h_pend)moved.push({what:"Pending approvals delegated",n:c.pend,to:v.h_pend});
G(()=>{if(PL_DIRTY&&window.PROCLIB&&PROCLIB.refresh){PROCLIB.refresh();PL_DIRTY=0}});O.bump();return moved}
function mkTasks(kind,subject,eff,steps){const out=[];steps.forEach((s,i)=>{const t={id:"T"+(HR.tasks.length+1),proc:kind,step:s.n,who:s.who,owner:s.owner,subject,due:s.who==="human"||s.who==="gate"?eff:eff,sla:s.sla,state:STEPMODE.needsTrigger(s.who)?"done":"open"};HR.tasks.push(t);out.push(t)});return out}
function record(kind,subject,eff,evs,tasks,extra){const e=Object.assign({id:"LC-"+(HR.seq++),t:new Date().toISOString().slice(11,16),date:TODAY,kind,subject,eff,actor:viewer(),events:evs.map(r=>({id:r.id,eid:r.eid||r.local,via:r.via,rules:rulesFor(r.id).length,r})),tasks:tasks||[],state:extra&&extra.pend?"Scheduled":"Done"},extra||{});HR.log.unshift(e);
 G(()=>{if(window.STORE&&STORE.put)STORE.put("org_lifecycle",{id:e.id,kind:e.kind,subject:e.subject,eff:e.eff,events:e.events.map(x=>x.id)})});
 audit("People lifecycle: "+kind,subject+" effective "+eff);return e}
function setDir(n,ch){const d=O.dir(n);if(d)Object.assign(d,ch)}
function createPerson(d){
 const rt=rtFor(d.unit);const p={n:d.name,role:d.title,mgr:d.mgr,unit:d.unit,rt,dot:"",mx:[],fn:["Onboarding with "+d.mgr+" until responsibilities are set"],value:"Joined "+fmtD(d.start)+" as "+d.title+".",loc:d.loc||"Remote",yrs:0,et:d.et,fte:d.fte,start:d.start,end:d.end||"",src:d.src||"org_chart"};
 O.staff.push(p);O.by[p.n]=p;O.names.add(p.n);if(O.PBYID)O.PBYID[slug(p.n)]=p;O.ensureDir();setDir(p.n,{hrs:Math.round(40*d.fte),email:emailOf(p.n),mgr:d.mgr,type:d.et==="ct"?"contractor":"employee"});O.bump();OS.collapsed[d.mgr]=false;
 const ev=[emit("person.created",{person_id:slug(p.n),name:p.n,title:p.role,manager:d.mgr,team:p.unit,employment_type:d.et,fte:d.fte,start_date:d.start,location:p.loc,upn:emailOf(p.n),source:p.src},p.src)];
 if(d.vac){const v=vacBy(d.vac);if(v){v.status="Filled";v.filledBy=p.n;v.filledOn=TODAY;ev.push(emit("vacancy.filled",{req_id:v.req,person_id:slug(p.n),start_date:d.start,title:v.title},"org_chart"))}}
 const steps=procSteps(d.vac?"org_vac_hire":"org_joiner");const jt=procSteps("org_joiner");const tasks=mkTasks("org_joiner",p.n,d.start,jt);
 const rec=record(d.vac?"Fill vacancy":"Add person",p.n,d.start,ev,tasks,{proc:"org_joiner",detail:p.role+" · "+p.unit+" · "+ET[d.et][0]+(d.et==="pt"?" "+d.fte:"")});
 p.start&&p.start>TODAY&&(p.preboard=true);feedLeave();return rec}
function applyMove(n,d){const p=O.P(n);if(!p)return null;const from={mgr:p.mgr,unit:p.unit,role:p.role};
 if(d.mgr)p.mgr=d.mgr;if(d.unit)p.unit=d.unit;if(d.title)p.role=d.title;delete p.moving;setDir(n,{mgr:p.mgr,team:p.unit,role:p.role});
 const moved=handOver(n,d._h||{});O.bump();const ev=emit("person.moved",{person_id:slug(n),from_manager:from.mgr,to_manager:p.mgr,from_team:from.unit,to_team:p.unit,from_title:from.role,to_title:p.role,effective:d.eff,reason:d.reason},d.src);return {ev,moved}}
function applyTerm(n,d){const p=O.P(n);if(!p)return null;const moved=handOver(n,d);
 O.staff.splice(O.staff.indexOf(p),1);delete O.by[n];O.names.delete(n);if(O.PBYID)delete O.PBYID[slug(n)];O.staff.forEach(q=>{if(q.dot===n)q.dot=""});
 HR.former.unshift({n,role:p.role,unit:p.unit,mgr:p.mgr,left:d.eff,reason:d.reason,rehire:!!d.rehire,et:p.et,fte:p.fte});setDir(n,{inactive:true,status:"Left "+d.eff});
 if(OS.sel===n)OS.sel=null;O.bump();
 const ev=emit("person.terminated",{person_id:slug(n),name:n,effective:d.eff,reason:d.reason,rehire_eligible:!!d.rehire,handover:moved.map(m=>m.what+": "+m.n+" to "+m.to)},d.src);return{ev,moved}}

/* ---------- forms ---------- */
const reasonsL=["Resignation","Retirement","End of contract","Dismissal","Role eliminated","Other"];
function addSpec(pre){pre=pre||{};
 return{id:"org5_add",title:pre.vac?"Fill "+H(pre.title||"position")+" (create person from vacancy)":"Add a person",story:"Creates the person on the org chart and starts the joiner process. Events fire on save; the Triggers panel shows what runs downstream.",submit:pre.vac?"Fill vacancy":"Add person",
  fields:[{section:"Who"},{k:"name",label:"Full name",req:true,help:"Must not match anyone already on the chart.",wide:true},{k:"title",label:"Job title",req:true},{k:"unit",label:"Team",type:"select",opts:units().map(u=>[u,u]),req:true},{k:"mgr",label:"Reports to",type:"select",opts:pOptsAll(),req:true},
   {section:"Employment"},{k:"et",label:"Employment type",type:"chips",opts:etOpts,req:true},{k:"fte",label:"FTE fraction",type:"range",min:.1,max:1,step:.1,show:v=>v.et==="pt"||v.et==="in"||v.et==="ct",help:"1 is full time."},{k:"start",label:"Start date",type:"date",req:true},{k:"end",label:"End date",type:"date",show:v=>v.et==="ct"||v.et==="in",req:true,help:"Contractors and interns need an end date."},{k:"loc",label:"Location",type:"select",opts:LOCS.map(l=>[l,l])}],
  defaults:Object.assign({et:"ft",fte:1,loc:"Remote",start:addDays(TODAY,14)},pre),
  live:v=>{const e=[];if(v.name&&!uniqName(v.name))e.push("A person named "+v.name+" is already on the chart");if(v.start&&v.start<addDays(TODAY,-30))e.push("Start date is more than 30 days in the past");if(v.end&&v.start&&v.end<=v.start)e.push("End date must be after the start date");
   return (e.length?`<div class="org5-err">${e.map(x=>`<span class="pill bad">${H(x)}</span>`).join(" ")}</div>`:"")+trigHTML([{id:"person.created"}].concat(v.vac?[{id:"vacancy.filled"}]:[]),{preview:true})},
  onSubmit:v=>{v.name=String(v.name||"").trim();if(!uniqName(v.name))return{close:false,toast:v.name+" is already on the org chart"};if(!O.P(v.mgr))return{close:false,toast:"Pick a manager on the chart"};if((v.et==="ct"||v.et==="in")&&(!v.end||v.end<=v.start))return{close:false,toast:"End date must be after the start date"};
   v.fte=v.et==="ft"?1:+v.fte||1;const rec=createPerson(v);showResult(rec,"Person added: "+v.name);if(S.screen==="org_chart")G(render);return{close:false,toast:v.name+" added to the org chart"}}}}
function openAdd(pre){if(pre&&pre.vac){const v=vacBy(pre.vac);if(v)pre=Object.assign({},pre,{title:v.title,unit:v.unit,mgr:v.rep,et:v.et,fte:v.fte,start:v.target,vac:v.id})}openForm(addSpec(pre),null)}
function openEdit(n){const p=O.P(n);if(!p)return;const x=etOf(n);
 openForm({id:"org5_edit",title:"Edit "+H(n),story:"Title, location and employment type. Team or manager changes use Move, which runs the mover process.",submit:"Save changes",
  fields:[{k:"title",label:"Job title",req:true},{k:"loc",label:"Location",type:"select",opts:LOCS.map(l=>[l,l])},{section:"Employment"},{k:"et",label:"Employment type",type:"chips",opts:etOpts,req:true},{k:"fte",label:"FTE fraction",type:"range",min:.1,max:1,step:.1,show:v=>v.et!=="ft"},{k:"end",label:"End date",type:"date",show:v=>v.et==="ct"||v.et==="in"},{k:"eff",label:"Effective date",type:"date",req:true}],
  defaults:{title:p.role,loc:p.loc,et:x.et,fte:x.fte,end:p.end||"",eff:TODAY},
  live:v=>{const ch=[];if(v.title!==p.role)ch.push("person.updated");if(v.loc!==p.loc&&ch.indexOf("person.updated")<0)ch.push("person.updated");if(v.et!==x.et||(v.et!=="ft"&&+v.fte!==x.fte))ch.push("person.employment_type_changed");return ch.length?trigHTML(ch.map(e=>({id:e})),{preview:true}):`<p class="muted small">No change yet.</p>`},
  onSubmit:v=>{const ev=[],changes=[];const nfte=v.et==="ft"?1:+v.fte||1;
   if(v.title!==p.role){changes.push({field:"title",from:p.role,to:v.title});p.role=v.title;setDir(n,{role:v.title})}if(v.loc!==p.loc){changes.push({field:"location",from:p.loc,to:v.loc});p.loc=v.loc;setDir(n,{loc:v.loc})}
   if(changes.length)ev.push(emit("person.updated",{person_id:slug(n),changes,effective:v.eff},"org_chart"));
   if(v.et!==x.et||nfte!==x.fte){ev.push(emit("person.employment_type_changed",{person_id:slug(n),from_type:x.et,to_type:v.et,from_fte:x.fte,to_fte:nfte,effective:v.eff},"org_chart"));p.et=v.et;p.fte=nfte;p.end=v.end||"";setDir(n,{hrs:Math.round(40*nfte),type:v.et==="ct"?"contractor":"employee"})}
   if(!ev.length)return{close:false,toast:"Nothing changed"};O.bump();const rec=record("Edit person",n,v.eff,ev,[],{detail:changes.map(c=>c.field).concat(ev.length>changes.length?["employment"]:[]).join(", ")});showResult(rec,"Saved: "+n);if(S.screen==="org_chart")G(render);return{close:false,toast:"Saved "+n}}})}
function defaultTo(n){const p=O.P(n);return p&&p.mgr?p.mgr:"Catherine Doyle"}
function handFields(n,mode){const c=ownedCounts(n),d=defaultTo(n),opts=pOptsAll(n);const f=[];const add=(k,label,cnt,help,req)=>{if(cnt)f.push({k,label:label+" ("+cnt+")",type:"select",opts,req:req!==false,help})};
 f.push({section:mode==="term"?"Handover: every owned item needs a named new owner":"Ownership: hand over what stays with the old team"});
 add("h_kids","Direct reports move to",c.kids.length,"Their reporting line changes with the status change.");
 add("h_dom","Accountability domains: new owner",c.domains.length+c.dombk.length,"Owner or backup in the Accountability map ("+c.domains.map(x=>x.label).concat(c.dombk.map(x=>x.label+" (backup)")).slice(0,3).join(", ")+(c.domains.length+c.dombk.length>3?"...":"")+").");
 add("h_agents","AI agents: new human sponsor",c.agents.length,c.agents.map(a=>O.agentDisplay?O.agentDisplay(a.name).first:a.name).join(", ")+". An agent must have a named sponsor.");
 add("h_bkp","Processes where "+first(n)+" is backup: new backup",c.backup.length,"Backup owner in the process library.");
 add("h_metrics","Metrics: new owner",c.metrics.length,"Owner field in the metric registry.");add("h_procs","Processes: new owner",c.procs.length,"Owner in the process library.");add("h_ents","Data entities: new steward",c.ents.length,"Steward in the data registry.");add("h_svcs","Services: new owner",c.svcs.length,"Owner in the service registry.");add("h_projs","Projects: new project manager",c.projs.length);add("h_raid","Open risks and issues: new owner",c.raid.length);
 if(c.pend)f.push({k:"h_pend",label:"Pending approvals and tasks ("+c.pend+"): delegate to",type:"select",opts,req:false,help:"Delegation of authority stays by role; this routes the open items."});
 return{fields:f,defaults:(()=>{const o={};f.forEach(x=>{if(x.k)o[x.k]=x.k==="h_dom"&&c.domains[0]&&c.domains[0].other&&c.domains[0].other.name!==n?c.domains[0].other.name:d});return o})()}}
function openMove(n){const p=O.P(n);if(!p)return;const hf=handFields(n,"move");const ownerKeys=hf.fields.filter(f=>f.k&&f.k!=="h_kids");
 openForm({id:"org5_move",title:"Move "+H(n),story:"Change manager, team or title on an effective date. Runs the mover process; direct reports and owned work stay put unless you hand them over.",submit:"Record move",
  fields:[{section:"New position"},{k:"mgr",label:"Reports to",type:"select",opts:pOpts(n),req:true},{k:"unit",label:"Team",type:"select",opts:units().map(u=>[u,u]),req:true},{k:"title",label:"Job title",req:true},{k:"eff",label:"Effective date",type:"date",req:true},{k:"reason",label:"Reason",type:"select",opts:["Promotion","Transfer","Reorganization","Manager change","Backfill"].map(x=>[x,x]),req:true}]
   .concat(O.kids(n).length?[{section:"Direct reports"},{k:"kidsTo",label:"Direct reports ("+O.kids(n).length+")",type:"select",opts:[["stay","Stay with "+first(n)],["old","Move to previous manager"]],req:true}]:[])
   .concat(ownerKeys.length?[{k:"keepOwn",label:"Owned work",type:"select",opts:[["keep","Keep ownership"],["hand","Hand over to the previous manager"]],req:true,help:"Keeps "+ownerKeys.length+" ownership categories (metrics, processes, domains, agents) or hands them over."}]:[]),
  defaults:{mgr:p.mgr||"Catherine Doyle",unit:p.unit,title:p.role,eff:TODAY,reason:"Transfer",kidsTo:"stay",keepOwn:"keep"},
  live:v=>{const e=[];if(v.mgr===n)e.push("A person cannot report to themselves");if(O.up(v.mgr||"").includes(n))e.push("That would make a reporting loop");if(v.mgr===p.mgr&&v.unit===p.unit&&v.title===p.role)e.push("Nothing changes yet");return (e.length?`<div class="org5-err">${e.map(x=>`<span class="pill bad">${H(x)}</span>`).join(" ")}</div>`:"")+liveBlock(n,["person.moved"])},
  onSubmit:v=>{if(v.mgr===n||O.up(v.mgr).includes(n))return{close:false,toast:"That move would create a reporting loop"};if(v.mgr===p.mgr&&v.unit===p.unit&&v.title===p.role)return{close:false,toast:"Nothing changes: pick a new manager, team or title"};
   const old=p.mgr||"Catherine Doyle",h={};if(v.kidsTo==="old")h.h_kids=old;if(v.keepOwn==="hand"){hf.fields.forEach(f=>{if(f.k&&f.k!=="h_kids"&&f.k!=="h_pend")h[f.k]=old})}
   if(v.eff>TODAY){p.moving={eff:v.eff,mgr:v.mgr,unit:v.unit,title:v.title};const ev=[];const rec=record("Move (scheduled)",n,v.eff,[],mkTasks("org_mover",n,v.eff,procSteps("org_mover")),{detail:old+" to "+v.mgr+", "+v.title,proc:"org_mover",pend:{kind:"move",n,d:Object.assign({},v,{_h:h,src:"org_chart"})}});HR.sched.push(rec.id);showResult(rec,"Move scheduled for "+fmtD(v.eff),["person.moved"]);G(render);return{close:false,toast:"Move scheduled for "+fmtD(v.eff)}}
   const r=applyMove(n,Object.assign({},v,{_h:h,src:"org_chart"}));const eventsOut=[r.ev];
   const tasks=mkTasks("org_mover",n,v.eff,procSteps("org_mover"));const rec=record("Move",n,v.eff,eventsOut,tasks,{detail:old+" to "+p.mgr+" · "+p.role,proc:"org_mover",moved:r.moved});showResult(rec,"Moved: "+n);if(S.screen==="org_chart")G(render);return{close:false,toast:n+" moved to report to "+p.mgr}}})}
function openTerm(n,pre){const p=O.P(n);if(!p)return;pre=pre||{};if(O.openStatus){O.openStatus(n,{status:"resigned",src:pre.src});return}if(!p.mgr){toast("The chief executive cannot be removed from the chart here","warn");return}
 const hf=handFields(n,"term");
 openForm({id:"org5_term",title:"Separation: "+H(n),story:"Records the last day, hands over everything the person owns, transfers AI agent sponsorship and runs the separation process. Identity is deprovisioned by the rules below.",submit:"Record separation",
  fields:[{section:"Leaving"},{k:"eff",label:"Last working day",type:"date",req:true},{k:"reason",label:"Reason",type:"select",opts:reasonsL.map(x=>[x,x]),req:true},{k:"rehire",label:"Eligible for rehire",type:"toggle"}].concat(hf.fields),
  defaults:Object.assign({eff:addDays(TODAY,0),reason:pre.reason||"Resignation",rehire:true,src:pre.src||"org_chart"},hf.defaults),
  live:v=>{const e=[];if(v.eff&&v.eff<addDays(TODAY,-30))e.push("Last day is more than 30 days in the past");const c=ownedCounts(n);if(c.agents.length&&!v.h_agents)e.push("Every agent needs a human sponsor");return (e.length?`<div class="org5-err">${e.map(x=>`<span class="pill bad">${H(x)}</span>`).join(" ")}</div>`:"")+liveBlock(n,["person.terminated"])},
  onSubmit:v=>{const c=ownedCounts(n);if(c.agents.length&&!v.h_agents)return{close:false,toast:"Pick a sponsor for the AI agents"};
   const bad=Object.keys(v).filter(k=>/^h_/.test(k)&&v[k]===n);if(bad.length)return{close:false,toast:"A new owner cannot be the person who is leaving"};
   const vv=Object.assign({},v,{src:v.src||"org_chart"});
   if(v.eff>TODAY){p.leaving=v.eff;const rec=record("Separation (scheduled)",n,v.eff,[],mkTasks("org_separation",n,v.eff,procSteps("org_separation")),{detail:v.reason+" · last day "+fmtD(v.eff),proc:"org_separation",pend:{kind:"term",n,d:vv}});HR.sched.push(rec.id);showResult(rec,"Separation scheduled for "+fmtD(v.eff),["person.terminated"]);G(render);return{close:false,toast:n+" scheduled to leave on "+fmtD(v.eff)}}
   const r=applyTerm(n,vv);const tasks=mkTasks("org_separation",n,v.eff,procSteps("org_separation"));const rec=record("Separation",n,v.eff,[r.ev],tasks,{detail:v.reason+" · "+r.moved.length+" handover groups",proc:"org_separation",moved:r.moved});showResult(rec,"Separation recorded: "+n);if(S.screen==="org_chart")G(render);return{close:false,toast:n+" recorded as separating "+fmtD(v.eff)}}})}
function applySched(id){const r=HR.log.find(x=>x.id===id);if(!r||!r.pend)return;const pd=r.pend;const n=pd.n;let ev;
 if(pd.kind==="term"){const x=applyTerm(n,pd.d);ev=[x.ev];r.moved=x.moved}else{const x=applyMove(n,pd.d);ev=[x.ev];r.moved=x.moved}
 r.events=ev.map(e=>({id:e.id,eid:e.eid||e.local,via:e.via,rules:rulesFor(e.id).length,r:e}));r.state="Done";r.kind=r.kind.replace(" (scheduled)","");delete r.pend;HR.sched=HR.sched.filter(z=>z!==id);audit("People lifecycle: scheduled change applied",n);toast("Applied: "+r.kind+" for "+n,"good");G(render)}
function showResult(rec,title,previewEv){const steps=procSteps(rec.proc||"org_joiner");
 openDrawer(`<div class="org5-res"><h3 class="ftitle">${H(title)}</h3><p class="muted small">${H(rec.detail||"")} · ${/^(Add person|Fill vacancy|Open position)$/.test(rec.kind)?"starts":"effective"} ${H(fmtD(rec.eff))} · ${H(rec.state)}</p>
 ${rec.moved&&rec.moved.length?`<div class="eyebrow">Handed over</div><div class="row">${rec.moved.map(m=>`<span class="pill info">${H(m.what)} · ${m.n} to ${H(m.to)}</span>`).join("")}</div>`:""}
 <div class="eyebrow" style="margin-top:14px">Process run: ${H(G(()=>PROCLIB.get(rec.proc).name,rec.proc||""))}</div>
 <ol class="org5-steps">${steps.map(s=>{const auto=STEPMODE.needsTrigger(s.who);const sch=rec.state==="Scheduled";return `<li><span class="pill ${auto?(sch?"mute":"good"):s.who==="gate"?"warn":"info"}">${auto?(sch?"Queued":"Done"):s.who==="gate"?"Approval":"Task"}</span><b>${H(s.n)}</b><small>${H(s.owner)} · ${H(s.sla||"")}</small></li>`}).join("")}</ol>
 ${trigHTML((rec.events.length?rec.events.map(e=>({id:e.id,eid:e.r&&e.r.eid})):(previewEv||[]).map(e=>({id:e}))),{scheduled:rec.state==="Scheduled"})}
 <div class="row" style="margin-top:14px"><button type="button" class="btn primary" data-org5="tab" data-t="act">Open lifecycle activity</button><button type="button" class="btn" data-org5="proc" data-id="${H(rec.proc||"org_joiner")}">Edit this process</button><button type="button" class="btn quiet" data-org5="close">Close</button></div></div>`)}

/* vacancies */
function openVacForm(id){const v=id?vacBy(id):null;
 openForm({id:"org5_vac",title:v?"Edit position "+H(v.req):"Open a position",story:"A vacancy shows on the org chart as a dashed card under the manager and counts in headcount vs plan.",submit:v?"Save position":"Open position",
  fields:[{k:"title",label:"Job title",req:true,wide:true},{k:"unit",label:"Team",type:"select",opts:units().map(u=>[u,u]),req:true},{k:"rep",label:"Reports to",type:"select",opts:pOptsAll(),req:true},{k:"et",label:"Employment type",type:"chips",opts:etOpts,req:true},{k:"fte",label:"FTE fraction",type:"range",min:.1,max:1,step:.1,show:x=>x.et!=="ft"},{k:"target",label:"Target start",type:"date",req:true},{k:"budget",label:"Budget line",type:"select",opts:BUDLINES,req:true,help:"Headcount plan line this position draws on."},{k:"status",label:"Status",type:"select",opts:["Open","Sourcing","Interviewing","Offer out"].map(x=>[x,x])}],
  defaults:v?{title:v.title,unit:v.unit,rep:v.rep,et:v.et,fte:v.fte,target:v.target,budget:v.budget,status:v.status}:{et:"ft",fte:1,target:addDays(TODAY,75),status:"Open",budget:"BL-1100",unit:"Technology",rep:"Casey Rowan"},
  live:x=>trigHTML([{id:v?"vacancy.opened":"vacancy.opened"}],{preview:true}),
  onSubmit:x=>{x.fte=x.et==="ft"?1:+x.fte||1;if(v){Object.assign(v,{title:x.title,unit:x.unit,team:x.unit,rep:x.rep,mgr:x.rep,et:x.et,fte:x.fte,target:x.target,budget:x.budget,status:x.status});audit("Vacancy edited",v.req);toast("Position saved","good");G(render);return{close:true,toast:v.req+" saved"}}
   const s=pp2();if(!s||!s.vac)return{close:false,toast:"Vacancy list is not available"};const nid="V"+String(s.vac.length+1).padStart(2,"0");const nv={id:nid,title:x.title,team:x.unit,mgr:x.rep,kind:x.et==="ct"?"contractor":"human",status:x.status||"Open",opened:TODAY,skills:[],loaded:0,unit:x.unit,rep:x.rep,et:x.et,fte:x.fte,target:x.target,budget:x.budget};s.vac.push(nv);vnorm(nv);
   const e=emit("vacancy.opened",{req_id:nv.req,title:nv.title,team:nv.unit,reports_to:nv.rep,employment_type:nv.et,target_start:nv.target,budget_line:nv.budget},"org_chart");OS.collapsed[x.rep]=false;
   const rec=record("Open position",nv.title,nv.target,[e],mkTasks("org_vac_hire",nv.title,nv.target,procSteps("org_vac_hire")),{detail:nv.req+" · "+nv.unit+" · "+ET[nv.et][0],proc:"org_vac_hire"});showResult(rec,"Position opened: "+nv.req);G(render);return{close:false,toast:nv.req+" opened"}}})}
function openVacCard(id){const v=vacBy(id);if(!v)return;const a=vage(v),sp=stats5();
 openDrawer(`<div class="org5-res"><div class="eyebrow">Open position · ${H(v.req)}</div><h3 class="ftitle">${H(v.title)}</h3>
 <div class="row"><span class="pill ${a>35?"warn":"info"}">${a} days open</span><span class="pill info">${H(ET[v.et][0])}${v.et!=="ft"?" · "+v.fte+" FTE":""}</span><span class="pill mute">${H(v.status)}</span></div>
 <dl class="kv"><dt>Team</dt><dd>${H(v.unit)}</dd><dt>Reports to</dt><dd>${O.P(v.rep)?pchip(v.rep):H(v.rep)}</dd><dt>Target start</dt><dd>${H(fmtD(v.target))}</dd><dt>Budget line</dt><dd>${H((BUDLINES.find(b=>b[0]===v.budget)||[0,v.budget])[1])} <button type="button" class="chip" data-go="bud_over">Open budgets</button></dd><dt>Skills</dt><dd>${(v.skills||[]).map(s=>`<span class="pill info">${H(s)}</span>`).join(" ")||'<span class="muted">None listed</span>'}</dd><dt>Loaded cost</dt><dd>${v.loaded?money(v.loaded)+" a year":"n/a"}</dd></dl>
 <div class="row" style="margin-top:12px"><button type="button" class="btn primary" data-org5="fill" data-id="${H(v.id)}">Fill: create person</button><button type="button" class="btn" data-org5="vedit" data-id="${H(v.id)}">Edit</button><button type="button" class="btn quiet" data-org5="vclose" data-id="${H(v.id)}">Close position</button></div>
 <div style="margin-top:14px">${trigHTML([{id:"vacancy.opened"},{id:"vacancy.filled"},{id:"vacancy.closed"}],{preview:true})}</div></div>`);audit("Opened vacancy",v.req)}
function openVacClose(id){const v=vacBy(id);if(!v)return;
 openForm({id:"org5_vclose",title:"Close "+H(v.req),story:"Closes the requisition without a hire and releases the headcount to the budget line.",submit:"Close position",fields:[{k:"reason",label:"Reason",type:"select",opts:["Role no longer needed","Budget cut","Filled internally","Replaced by AI agent","Other"].map(x=>[x,x]),req:true}],defaults:{reason:"Role no longer needed"},live:()=>trigHTML([{id:"vacancy.closed"}],{preview:true}),
  onSubmit:x=>{v.status="Filled";v.closed=true;v.closeReason=x.reason;const e=emit("vacancy.closed",{req_id:v.req,reason:x.reason},"org_chart");const rec=record("Close position",v.title,TODAY,[e],[],{detail:v.req+" · "+x.reason,proc:"org_vac_hire"});showResult(rec,"Position closed: "+v.req);G(render);return{close:false,toast:v.req+" closed"}}})}

/* ---------- toolbar, tabs, profile actions ---------- */
O.barX=function(){const s=stats5();
 return `<div class="org-chips org5-bar" role="group" aria-label="Employment type"><span class="org5-lbl">Employment</span>${ETK.map(k=>`<button type="button" class="chip" data-org-f="et:${k}" aria-pressed="${OS.f.et===k}" title="Show only ${ET[k][0].toLowerCase()} people">${ET[k][0]} · ${s.by[k]}</button>`).join("")}</div>
 <div class="org-chips org5-bar" role="group" aria-label="People actions"><button type="button" class="btn primary sm" data-org5="add">Add person</button><button type="button" class="btn sm" data-org5="vnew">Open position</button><button type="button" class="chip" data-org5="tab" data-t="vac">${s.vo} open position${s.vo===1?"":"s"}</button></div>
 <div class="org5-hc" role="status" data-role="metric"><b>${s.n}</b> people · <b>${s.fte}</b> FTE · plan <b>${s.plan}</b> (${s.pct}%)</div>`};
O.profActions=n=>{const p=O.P(n);if(!p)return "";const ch=etOf(n);return `<div class="org5-pa" role="group" aria-label="Actions for ${H(n)}"><span class="org5-et ${ch.et} big" title="${H(ET[ch.et][0])}">${H(ET[ch.et][0])}${ch.et==="pt"?" · "+ch.fte+" FTE":""}</span>${p.leaving?`<span class="pill warn">Leaves ${H(fmtD(p.leaving))}</span>`:""}<button type="button" class="btn sm" data-org5="edit" data-n="${H(n)}">Edit</button><button type="button" class="btn sm" data-org5="move" data-n="${H(n)}">Move</button><button type="button" class="btn sm" data-org5="status" data-n="${H(n)}">Change status</button></div>`};
O.tabs.push(["vac","Vacancies"],["sync","Directory sync"],["act","Lifecycle"]);
function kp(l,v,sub,o){return kpi(l,String(v),sub,o||{})}
function vacPane(){const s=stats5(),L=vacsAll().filter(v=>v.status!=="Filled").sort((a,b)=>vage(b)-vage(a));const closed=vacsAll().filter(v=>v.status==="Filled");
 return `<div class="statrow">${kp("Open positions",s.vo,s.vfte+" FTE in plan")}${kp("Headcount vs plan",s.pct+"%",s.n+" of "+s.plan+" planned positions",{metric:"m_org_hc_plan"})}${kp("FTE vs plan",s.fte+" / "+s.planFte,"actual and planned FTE",{metric:"m_org_fte"})}${kp("Average days open",s.age,"target under 45",{metric:"m_org_vac_age",cls:s.age>45?"warn":""})}</div>
 ${card("Open positions","Each position appears as a dashed card under its manager on the org chart. Fill creates the person and starts the joiner process; Close releases the headcount.",`<div class="row" style="margin-bottom:12px"><button type="button" class="btn primary" data-org5="vnew">Open a position</button><button type="button" class="chip" data-org5="tab" data-t="chart">Show on the org chart</button></div>
 <div class="tscroll"><table class="org5-vt"><thead><tr><th>Req</th><th>Title</th><th>Team</th><th>Reports to</th><th>Type</th><th>Target start</th><th>Budget line</th><th>Days open</th><th>Status</th><th></th></tr></thead><tbody>${L.map(v=>`<tr><td><code>${H(v.req)}</code></td><td><b>${H(v.title)}</b></td><td>${H(v.unit)}</td><td>${O.P(v.rep)?pchip(v.rep):H(v.rep)}</td><td><span class="org5-et ${v.et}">${H(v.et==="pt"?"PT "+v.fte:ET[v.et][1])}</span></td><td>${H(fmtD(v.target))}</td><td><code>${H(v.budget)}</code></td><td class="num"><span class="pill ${vage(v)>35?"warn":"mute"}">${vage(v)}</span></td><td>${H(v.status)}</td><td class="org5-act"><button type="button" class="btn sm primary" data-org5="fill" data-id="${H(v.id)}">Fill</button><button type="button" class="btn sm" data-org5="vedit" data-id="${H(v.id)}">Edit</button><button type="button" class="btn sm quiet" data-org5="vclose" data-id="${H(v.id)}">Close</button></td></tr>`).join("")||`<tr><td colspan="10" class="muted">No open positions.</td></tr>`}</tbody></table></div>`)}
 ${closed.length?card("Filled or closed","From the requisition list.",`<div class="row">${closed.map(v=>`<span class="pill mute">${H(v.req)} · ${H(v.title)} · ${v.closed?"closed":"filled"+(v.filledBy?" by "+v.filledBy:"")}</span>`).join("")}</div>`):""}`}

/* ---------- directory sync (simulated Entra ID import) ---------- */
const DELTAS=[{op:"new",name:"Jamie Okoro",title:"Editorial intern",unit:"Editorial",mgr:"Elena Marsh",et:"in",fte:.5,start:"2026-10-19",end:"2027-04-16"},
 {op:"new",name:"Rahul Verma",title:"Data engineer",unit:"Data and analytics",mgr:"Anil Mehta",et:"ft",fte:1,start:"2026-10-26"},
 {op:"chg",name:"Maribel Cruz",field:"title",to:"Senior service desk analyst"},
 {op:"chg",name:"Leah Moss",field:"mgr",to:"Carla Reyes"},
 {op:"chg",name:"Femi Adeyemi",field:"et",to:"ct"},
 {op:"del",name:"Paula Grant",reason:"accountEnabled = false"}];
const FLD={title:"Job title",mgr:"Manager",et:"Employee type",unit:"Department"};
function syncRows(){return DELTAS.map(d=>{const p=O.P(d.name);let state="pending",cur="";
 if(d.op==="new"){state=p?"in sync":"pending";cur=p?"on chart":"not on chart"}
 else if(d.op==="chg"){if(!p){state="missing";cur="not on chart"}else{cur=d.field==="title"?p.role:d.field==="mgr"?p.mgr:d.field==="et"?ET[p.et||"ft"][0]:p.unit;const to=d.field==="et"?ET[d.to][0]:d.to;state=cur===to?"in sync":"pending"}}
 else{state=p?"pending":"in sync";cur=p?"enabled":"removed"}
 return Object.assign({state,cur,key:d.op+":"+d.name+(d.field||"")},d)})}
function applySync(d){
 if(d.op==="new"){createPerson({name:d.name,title:d.title,unit:d.unit,mgr:d.mgr,et:d.et,fte:d.fte,start:d.start,end:d.end,loc:"Remote",src:"directory_sync"});return true}
 const p=O.P(d.name);if(!p)return false;const ch=[],ev=[];
 if(d.field==="title"){ch.push({field:"title",from:p.role,to:d.to});p.role=d.to;setDir(d.name,{role:d.to});ev.push(emit("person.updated",{person_id:slug(d.name),changes:ch,effective:TODAY},"directory_sync"))}
 else if(d.field==="mgr"){const old=p.mgr;p.mgr=d.to;setDir(d.name,{mgr:d.to});O.bump();ev.push(emit("person.moved",{person_id:slug(d.name),from_manager:old,to_manager:d.to,from_team:p.unit,to_team:p.unit,from_title:p.role,to_title:p.role,effective:TODAY},"directory_sync"))}
 else if(d.field==="et"){const o=etOf(d.name);p.et=d.to;p.fte=d.to==="ft"?1:p.fte;setDir(d.name,{type:d.to==="ct"?"contractor":"employee"});ev.push(emit("person.employment_type_changed",{person_id:slug(d.name),from_type:o.et,to_type:d.to,from_fte:o.fte,to_fte:p.fte,effective:TODAY},"directory_sync"))}
 O.bump();record("Directory sync",d.name,TODAY,ev,[],{detail:(FLD[d.field]||"")+": "+(d.field==="et"?ET[d.to][0]:d.to),proc:"org_mover"});return true}
function syncPane(){const R=syncRows(),pend=R.filter(r=>r.state==="pending"),s=stats5();
 const cnt=k=>pend.filter(r=>r.op===k).length;
 return `<div class="statrow">${kp("Source of record","Entra ID","Simulated: Microsoft Graph /users/delta")}${kp("Last sync",HR.lastSync.slice(11),HR.lastSync.slice(0,10)+" · every 4 hours")}${kp("New",cnt("new"),"in Entra ID, not on the chart",{cls:cnt("new")?"warn":""})}${kp("Changed",cnt("chg"),"attribute differs",{cls:cnt("chg")?"warn":""})}${kp("Removed",cnt("del"),"disabled in Entra ID",{cls:cnt("del")?"bad":""})}</div>
 ${card("Directory differences","The directory is the source of record for people. Applying a difference changes the org chart and fires the same person.* events as a manual change, with source directory_sync. A removed account opens Change status so ownership is handed over before the person leaves the chart.",`<div class="row" style="margin-bottom:12px"><button type="button" class="btn primary" data-org5="syncrun">Run sync now</button><button type="button" class="btn" data-org5="applyall" ${pend.filter(r=>r.op!=="del").length?"":"disabled"}>Apply new and changed (${pend.filter(r=>r.op!=="del").length})</button><span class="pill warn">Simulated</span><span class="muted small">${s.n} people on the chart · ${s.n+cnt("new")-cnt("del")} expected after applying</span></div>
 <div class="tscroll"><table class="org5-vt"><thead><tr><th>Change</th><th>Person</th><th>Attribute</th><th>On the chart</th><th>In Entra ID</th><th>Status</th><th></th></tr></thead><tbody>${R.map(r=>`<tr><td><span class="pill ${r.op==="new"?"good":r.op==="del"?"bad":"warn"}">${r.op==="new"?"New":r.op==="del"?"Removed":"Changed"}</span></td><td><b>${H(r.name)}</b>${r.op==="new"?`<div class="muted small">${H(r.title)} · ${H(r.unit)} · ${H(ET[r.et][0])}</div>`:""}</td><td>${r.op==="new"?"Account":r.op==="del"?"accountEnabled":H(FLD[r.field])}</td><td>${H(r.cur)}</td><td>${r.op==="new"?H(emailOf(r.name)):r.op==="del"?"disabled":H(r.field==="et"?ET[r.to][0]:r.to)}</td><td><span class="pill ${r.state==="in sync"?"good":"warn"}">${H(r.state==="in sync"?"Applied":"Pending")}</span></td><td>${r.state==="pending"?`<button type="button" class="btn sm ${r.op==="del"?"":"primary"}" data-org5="syncone" data-k="${H(r.key)}">${r.op==="del"?"Change status":"Apply"}</button>`:""}</td></tr>`).join("")}</tbody></table></div>`)}`}

/* ---------- lifecycle activity ---------- */
function actPane(){const L=HR.log,t=HR.tasks.filter(x=>x.state==="open");const evTotal=L.reduce((a,e)=>a+e.events.length,0);
 return `<div class="statrow">${kp("Lifecycle actions",L.length,"this session")}${kp("Events emitted",evTotal,bus()?"on the event bus":"queued until the bus loads")}${kp("Scheduled",HR.sched.length,"future effective date",{cls:HR.sched.length?"warn":""})}${kp("Open tasks",t.length,"from process steps",{metric:"m_org_lc"})}</div>
 ${card("Lifecycle activity","Every add, edit, move, status change and vacancy action with the events it emitted and the rules that listen to them.",`<div class="row" style="margin-bottom:12px"><button type="button" class="btn primary" data-org5="add">Add person</button><button type="button" class="btn" data-org5="rules" data-ev="person.created">Rules for person.* events</button></div>
 ${L.length?`<div class="tscroll"><table class="org5-vt"><thead><tr><th>Action</th><th>Subject</th><th>Effective</th><th>Events</th><th>Rules</th><th>State</th><th></th></tr></thead><tbody>${L.map(e=>`<tr><td><b>${H(e.kind)}</b><div class="muted small">${H(e.detail||"")}</div></td><td>${H(e.subject)}</td><td>${H(fmtD(e.eff))}</td><td>${e.events.map(x=>EVPILL(x.r)).join(" ")||'<span class="muted small">on effective date</span>'}</td><td class="num">${e.events.reduce((a,x)=>a+rulesFor(x.id).length,0)||trigRows((e.pend?[{id:e.pend.kind==="term"?"person.terminated":"person.moved"}]:[])).length}</td><td><span class="pill ${e.state==="Done"?"good":"warn"}">${H(e.state)}</span></td><td class="org5-act"><button type="button" class="btn sm" data-org5="showlog" data-id="${H(e.id)}">Triggers</button>${e.pend?`<button type="button" class="btn sm primary" data-org5="applysched" data-id="${H(e.id)}">Apply now</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">No lifecycle actions yet. Add a person, move someone, record a leaver or open a position.</p>`}`)}
 ${t.length?card("Open tasks from process steps","Human and approval steps created by the joiner, mover, separation, absence and vacancy processes.",`<div class="tscroll"><table class="org5-vt"><thead><tr><th>Process</th><th>Step</th><th>Subject</th><th>Owner</th><th>Due</th><th></th></tr></thead><tbody>${t.slice(0,14).map(x=>`<tr><td>${H(x.proc.replace("org_",""))}</td><td>${H(x.step)}</td><td>${H(x.subject)}</td><td>${H(x.owner)}</td><td>${H(fmtD(x.due))}</td><td><button type="button" class="btn sm" data-org5="taskdone" data-id="${H(x.id)}">Done</button></td></tr>`).join("")}</tbody></table></div>`):""}
 ${HR.former.length?card("Former staff","People recorded as leaving. They are off the chart and their ownership was handed over.",`<div class="row">${HR.former.map(f=>`<span class="pill mute">${H(f.n)} · ${H(f.role)} · left ${H(fmtD(f.left))}</span>`).join("")}</div>`):""}`}
O.extraPane=tab=>tab==="vac"?vacPane():tab==="sync"?syncPane():tab==="act"?actPane():null;

/* ---------- compensation, benefits and PTO (restricted; demo data; masked until revealed) ---------- */
const HROPS=["Joanna Pierce","Grace Whitfield"];
function canSee(n){const v=viewer();if(v===n)return{ok:true,why:"own record"};if(HROPS.indexOf(v)>=0)return{ok:true,why:"People Operations role"};if(O.up(n).indexOf(v)>=0)return{ok:true,why:"management chain"};return{ok:false,why:"not in the management chain and not People Operations"}}
const BASE={ceo:395,cio:305,cfo:290,chiefed:235,hr:182,legal:238,pmo:168,pm:128,comms:112,arch:158,eng:138,dev:118,data:132,desk:84,ops:96,sec:146,chg:120,ctrl:148,apfa:104,ai:176,editor:92};
const CM={};
function compOf(n){if(CM[n])return CM[n];const p=O.P(n);if(!p)return null;const r=RNG("comp"+n),x=etOf(n);const base=Math.round((BASE[p.rt]||100)*1000*(.93+r()*.14)/500)*500;const lvl=O.depth(n);
 const bonus=lvl<=1?30:lvl===2?15:8;const grade="G"+Math.max(4,12-lvl*2-(p.rt==="desk"||p.rt==="editor"?0:-1));const elig=x.et==="ft"||x.et==="pt";
 const yrs=p.yrs||0,acc=Math.round((120+Math.min(yrs,10)*4)*x.fte),used=Math.round(acc*(.35+r()*.3)),req=[];
 const f=addDays(TODAY,14+Math.floor(r()*40)),t=addDays(f,4);req.push({id:"PTO-"+(1000+Math.floor(r()*900)),from:addDays(TODAY,-60),to:addDays(TODAY,-56),hrs:Math.round(32*x.fte),st:"approved",type:"PTO"});
 req.push({id:"PTO-"+(2000+Math.floor(r()*900)),from:f,to:t,hrs:Math.round(40*x.fte),st:r()>.5?"approved":"pending",type:"PTO"});
 const medical=["Plan A: PPO","Plan B: HDHP + HSA"][Math.floor(r()*2)];
 const ben=elig?[["Medical",medical,["Employee","Employee + family"][Math.floor(r()*2)],Math.round(180+r()*320),Math.round(540+r()*380)],["Dental","Delta Dental PPO","Employee + family",Math.round(22+r()*30),Math.round(48+r()*30)],["Vision","VSP Choice","Employee",Math.round(7+r()*6),Math.round(11+r()*6)],["Retirement","401(k), 4% match",Math.round(4+r()*6)+"% deferral",Math.round(base*x.fte/12*.05),Math.round(base*x.fte/12*.04)],["Life and disability","1x salary basic life + LTD","Employer paid",0,Math.round(base*x.fte/12*.004)]]:[];
 return CM[n]={base,fte:x.fte,bonus,grade,elig,et:x.et,rate:x.et==="ct"?Math.round(base/2080):0,eff:addDays(TODAY,-Math.floor(60+r()*300)),acc,used,req,ben,yrs}}
const ptoReqs=n=>{const c=compOf(n);return c?(HR.pto[n]=HR.pto[n]||c.req.map(x=>Object.assign({},x))):[]};
const planned=n=>ptoReqs(n).filter(q=>q.st==="approved"&&q.from>=TODAY).reduce((a,q)=>a+q.hrs,0);
const avail=n=>{const c=compOf(n);return c?c.acc-c.used-planned(n):0};
O.availability=n=>{const c=compOf(n);if(!c)return null;return{hoursAvailable:avail(n),accrued:c.acc,used:c.used,approvedOff:ptoReqs(n).filter(q=>q.st==="approved"&&q.to>=TODAY).map(q=>({from:q.from,to:q.to,hours:q.hrs})),pending:ptoReqs(n).filter(q=>q.st==="pending").length}};
const MASK="••••••";
const mk=(n,v,isR)=>isR?v:`<span class="org5-mask" aria-label="Masked">${MASK}</span>`;
function pComp(p){const n=p.n,c=compOf(n),see=canSee(n),rev=HR.revealed&&HR.revealed[n]&&see.ok;
 const as=viewer();const switcher=`<div class="org5-as"><span class="muted small">Viewing as</span> <b>${H(as)}</b> <button type="button" class="chip" data-org5="as" data-v="${H(as==="Joanna Pierce"?"":"Joanna Pierce")}">${as==="Joanna Pierce"?"Switch back to "+H(S.persona==="exec"?"Casey Rowan":"persona"):"Switch to Joanna Pierce, People Operations"}</button></div>`;
 const head=`<div class="org5-rs"><span class="pill bad" title="Compensation, benefits and PTO records are classified restricted">Restricted</span><span class="pill warn">Demo data</span>${see.ok?`<span class="pill good">Access: ${H(see.why)}</span>`:`<span class="pill mute">No access: ${H(see.why)}</span>`}${rev?`<button type="button" class="btn sm" data-org5="hide" data-n="${H(n)}">Hide</button>`:see.ok?`<button type="button" class="btn sm primary" data-org5="reveal" data-n="${H(n)}">Reveal</button>`:`<button type="button" class="btn sm" data-org5="reqaccess" data-n="${H(n)}">Request access</button>`}</div>`;
 const R=rev;
 const pay=`<div class="p360grid">${stat5("Base salary",c.et==="ct"?mk(n,"$"+c.rate+" / h",R):mk(n,money(c.base*c.fte)+" / yr",R),c.fte<1?"FTE-adjusted at "+c.fte:"full-time rate")}${stat5("Bonus target",mk(n,c.bonus+"%",R),"of base")}${stat5("Pay grade",mk(n,c.grade,R),"last change "+fmtD(c.eff))}${stat5("FTE",c.fte.toFixed(1),ET[c.et][0])}</div>`;
 const ben=c.elig?`<div class="tscroll"><table class="org5-vt"><thead><tr><th>Benefit and plan</th><th>Employee a month</th><th>Employer a month</th></tr></thead><tbody>${c.ben.map(b=>`<tr><td><b>${H(b[0])}</b><div class="muted small">${R?H(b[1]+" · "+b[2]):mk(n,"",R)}</div></td><td class="num">${R?money(b[3]):mk(n,"",R)}</td><td class="num">${R?money(b[4]):mk(n,"",R)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Not benefits eligible as ${H(ET[c.et][0].toLowerCase())}.</p>`;
 const pr=ptoReqs(n);const av=avail(n);
 const pto=c.et==="ct"?`<p class="muted">Contractors do not accrue PTO.</p>`:`<div class="p360grid">${stat5("Accrued",mk(n,c.acc+" h",R),"this year")}${stat5("Used",mk(n,c.used+" h",R),"year to date")}${stat5("Planned",mk(n,planned(n)+" h",R),"approved, upcoming")}${stat5("Available",mk(n,av+" h",R),"feeds availability")}</div>
 <div class="tscroll"><table class="org5-vt"><thead><tr><th>Request</th><th>Dates</th><th>Hours</th><th>Status</th><th></th></tr></thead><tbody>${pr.map(q=>`<tr><td><code>${H(q.id)}</code></td><td>${H(fmtD(q.from))} to ${H(fmtD(q.to))}</td><td class="num">${q.hrs}</td><td><span class="pill ${q.st==="approved"?"good":q.st==="pending"?"warn":"mute"}">${H(q.st)}</span></td><td>${q.st==="pending"&&see.ok&&viewer()!==n?`<button type="button" class="btn sm primary" data-org5="ptook" data-n="${H(n)}" data-id="${H(q.id)}">Approve</button><button type="button" class="btn sm quiet" data-org5="ptono" data-n="${H(n)}" data-id="${H(q.id)}">Decline</button>`:""}</td></tr>`).join("")}</tbody></table></div><div class="row" style="margin-top:10px"><button type="button" class="btn sm" data-org5="ptonew" data-n="${H(n)}">Request time off</button><span class="muted small">Approved PTO appears on Resource planning availability.</span></div>`;
 const rl=HR.reveals.filter(x=>x.n===n).slice(0,3);
 return `${switcher}${head}<p class="muted small">Entities compensation_record, benefit_enrollment, pto_balance and pto_request are classified restricted. Reveal checks your role and writes an audit entry.</p><h4 class="org5-h">Compensation</h4>${pay}<h4 class="org5-h">Benefits</h4>${ben}<h4 class="org5-h">PTO</h4>${pto}${rl.length?`<div class="muted small" style="margin-top:10px">Reveal log: ${rl.map(x=>H(x.by+" at "+x.t)).join("; ")}</div>`:""}`}
function stat5(l,v,sub){return `<div class="stat"><small>${l}</small><span class="num" data-role="metric">${v}</span><em>${sub}</em></div>`}
O.compPane=pComp;
function feedLeave(){const s=G(()=>S.ppl,null);if(!s||!s.leave||!s.people)return;
 O.staff.forEach(p=>{const pp=s.people.find(x=>x.n===p.n);if(!pp)return;ptoReqs(p.n).forEach(q=>{if(q.to<TODAY)return;const id="O5-"+q.id;const ex=s.leave.find(l=>l.id===id);const rec={id,who:pp.id,from:q.from,to:q.to,type:"PTO",st:q.st==="approved"?"approved":q.st==="pending"?"pending":"declined",note:"From Org chart PTO"};if(ex)Object.assign(ex,rec);else if(q.st!=="declined")s.leave.push(rec)})})}
setTimeout(feedLeave,2000);

/* ---------- events (clicks) ---------- */
document.addEventListener("click",e=>{
 const v=e.target.closest&&e.target.closest("[data-org5-vac]");if(v){if(OS._moved&&Date.now()-OS._moved<250)return;e.preventDefault();openVacCard(v.dataset.org5Vac);return}
 const b=e.target.closest&&e.target.closest("[data-org5]");if(!b)return;const d=b.dataset,k=d.org5;
 if(k==="add")openAdd();else if(k==="vnew")openVacForm();else if(k==="vedit")openVacForm(d.id);else if(k==="vclose")openVacClose(d.id);else if(k==="fill"){openAdd({vac:d.id})}
 else if(k==="edit")openEdit(d.n);else if(k==="move")openMove(d.n);else if(k==="term"||k==="status")openTerm(d.n);
 else if(k==="tab"){OS.tab=d.t;closeDrawer();if(S.screen!=="org_chart")go("org_chart");else render()}
 else if(k==="close")closeDrawer();
 else if(k==="proc"){closeDrawer();G(()=>{if(PROCLIB.open)PROCLIB.open(d.id);else go("plat_proclib")})}
 else if(k==="newrule"){const t=document.createElement("button");t.dataset.zevtRule=d.ev||"person.created";t.hidden=true;document.body.appendChild(t);t.click();t.remove()}
 else if(k==="rules"){const id=rulesScreen();if(id){closeDrawer();S.v=S.v||{};S.v.zevt_v=1;go(id)}else toast("The rules editor is not part of this build yet. Rules listed here are the person.* and vacancy.* rules on the event bus.","warn")}
 else if(k==="showlog"){const r=HR.log.find(x=>x.id===d.id);if(r)showResult(r,r.kind+": "+r.subject)}
 else if(k==="applysched")applySched(d.id);
 else if(k==="taskdone"){const t=HR.tasks.find(x=>x.id===d.id);if(t){t.state="done";audit("Lifecycle task done",t.step+" for "+t.subject);render()}}
 else if(k==="syncrun"){HR.lastSync=TODAY+" 14:10";audit("Directory sync","Simulated delta query");toast("Simulated Entra ID delta query: "+syncRows().filter(r=>r.state==="pending").length+" differences","good");render()}
 else if(k==="syncone"){const r=syncRows().find(x=>x.key===d.k);if(!r)return;if(r.op==="del")openTerm(r.name,{src:"directory_sync",reason:"Resignation"});else if(applySync(r)){toast("Applied: "+r.name,"good");render()}}
 else if(k==="applyall"){let n=0;syncRows().filter(r=>r.state==="pending"&&r.op!=="del").forEach(r=>{if(applySync(r))n++});toast(n+" directory changes applied","good");render()}
 else if(k==="reveal"){const see=canSee(d.n);if(!see.ok){toast("Your role cannot reveal this record","warn");return}HR.revealed=HR.revealed||{};HR.revealed[d.n]=1;HR.reveals.unshift({n:d.n,by:viewer(),t:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),why:see.why});audit("Revealed restricted pay, benefits and PTO",d.n+" by "+viewer()+" ("+see.why+")");reopenProfile(d.n)}
 else if(k==="hide"){if(HR.revealed)delete HR.revealed[d.n];reopenProfile(d.n)}
 else if(k==="reqaccess"){audit("Requested access to restricted pay, benefits and PTO",d.n+" by "+viewer());toast("Access request for "+d.n+" sent to People Operations","good")}
 else if(k==="as"){HR.as=d.v;HR.revealed={};reopenProfile(OS.cur)}
 else if(k==="ptook"||k==="ptono"){const q=ptoReqs(d.n).find(x=>x.id===d.id);if(q){q.st=k==="ptook"?"approved":"declined";audit("PTO "+q.st,d.n+" "+q.id);feedLeave();toast("PTO "+q.st,"good");reopenProfile(d.n)}}
 else if(k==="ptonew"){openForm({id:"org5_pto",title:"Request time off: "+H(d.n),story:"Creates a pto_request. The manager approves it; approved days show on Resource planning.",submit:"Submit request",fields:[{k:"from",label:"From",type:"date",req:true},{k:"to",label:"To",type:"date",req:true},{k:"hrs",label:"Hours",type:"number",min:1,max:200,req:true}],defaults:{from:addDays(TODAY,30),to:addDays(TODAY,34),hrs:40},
  live:x=>x.to&&x.from&&x.to<x.from?`<span class="pill bad">End is before the start</span>`:`<span class="muted small">Available after approval: ${avail(d.n)-(+x.hrs||0)} h</span>`,
  onSubmit:x=>{if(x.to<x.from)return{close:false,toast:"End date is before the start"};ptoReqs(d.n).unshift({id:"PTO-"+(3000+HR.seq++),from:x.from,to:x.to,hrs:+x.hrs,st:"pending",type:"PTO"});audit("PTO requested",d.n);feedLeave();reopenProfile(d.n);return{close:false,toast:"Request submitted"}}})}});
function reopenProfile(n){if(n&&O.openProfile){S.v.org_p=7;O.openProfile(n,7)}}
function rulesScreen(){const ids=G(()=>SCREENS.map(s=>s[0]),[]);const c=["evt_rules","evt_home","plat_events","plat_evt","zevt","evt_bus"].find(x=>ids.indexOf(x)>=0);if(c)return c;const s=G(()=>SCREENS.find(x=>/event/i.test(x[1])&&/rule|bus|trigger/i.test(x[1]+x[0])),null);return s?s[0]:null}
O.rulesScreen=rulesScreen;

/* ---------- search and chat ---------- */
SEARCHX.push(()=>{const o=[{g:"People and teams",t:"Add a person",m:"Joiner process, identity and payroll triggers",c:"--p3",f:()=>{OS.tab="chart";go("org_chart");setTimeout(()=>openAdd(),150)},k:"org_chart add person new hire joiner onboard create employee"},
 {g:"People and teams",t:"Open positions and vacancies",m:"Requisitions, headcount vs plan",c:"--p3",f:()=>{OS.tab="vac";go("org_chart")},k:"org_chart vacancy vacancies open position requisition hiring headcount plan"},
 {g:"People and teams",t:"Directory sync (Entra ID)",m:"New, changed and removed accounts",c:"--p3",f:()=>{OS.tab="sync";go("org_chart")},k:"org_chart directory sync entra id active directory import source of record"},
 {g:"People and teams",t:"People lifecycle activity",m:"Joiner, mover and status change events and rules fired",c:"--p3",f:()=>{OS.tab="act";go("org_chart")},k:"org_chart lifecycle events triggers leaver change status mover joiner person.created person.terminated person.status_changed"}];
 vacOpen().forEach(v=>o.push({g:"Open positions",t:v.title+" ("+v.req+")",m:v.unit+" · reports to "+v.rep+" · "+vage(v)+" days open",c:"--p3",f:()=>{OS.tab="vac";go("org_chart");setTimeout(()=>openVacCard(v.id),150)},k:"org_chart vacancy open position requisition "+v.req+" "+v.title+" "+v.unit}));return o});
ASKX.push(q=>{const t=String(q||"").toLowerCase();
 if(/\b(vacanc|open position|open req|requisition|openings)/.test(t)){const s=stats5();OS.tab="vac";go("org_chart");say(q,{t:"<b>"+s.vo+" open positions</b> ("+s.vfte+" FTE), average "+s.age+" days open. Headcount vs plan is <b>"+s.pct+"%</b> ("+s.n+" of "+s.plan+").",steps:["Read the vacancy list","Opened the Vacancies tab"]});return true}
 if(/\b(fte|full.?time equivalent|part.?time|contractors?|interns?)\b/.test(t)&&/(how many|count|headcount|fte|share|who|list)/.test(t)){const s=stats5();OS.tab="chart";go("org_chart");say(q,{t:"<b>"+s.n+" people</b> are <b>"+s.fte+" FTE</b>: "+s.by.ft+" full-time, "+s.by.pt+" part-time, "+s.by.ct+" contractors, "+s.by.in+" interns. Part-time, contract and intern share: "+s.flex+"%.",steps:["Summed FTE by employment type"]});return true}
 if(/\b(directory sync|entra|active directory)\b/.test(t)){OS.tab="sync";go("org_chart");const n=syncRows().filter(r=>r.state==="pending").length;say(q,{t:"Directory sync (Entra ID, simulated): <b>"+n+" differences</b> pending, last sync "+H(HR.lastSync)+".",steps:["Compared the directory with the chart"]});return true}
 let m;if((m=t.match(/(?:add|onboard|hire)\s+(?:a\s+)?(?:new\s+)?(?:person|employee|starter|joiner)/))||/\bnew joiner\b/.test(t)){OS.tab="chart";go("org_chart");setTimeout(()=>openAdd(),150);say(q,{t:"Opened the Add person form. Saving fires <code>person.created</code> and starts the joiner process.",steps:["Opened the add person form"]});return true}
 if((m=t.match(/(?:offboard|terminate|record (?:a )?(?:leaver|resignation)|change status of|remove)\s+(.+)/))){const nm=O.staff.find(p=>t.indexOf(p.n.toLowerCase())>=0);if(nm&&nm.mgr){OS.tab="chart";go("org_chart");setTimeout(()=>openTerm(nm.n),150);say(q,{t:"Opened Change status for <b>"+H(nm.n)+"</b>: handover of owned work and agent sponsorship comes first.",steps:["Opened the leaver form"]});return true}}
 if(/\bwhat (?:happens|fires|triggers).*(?:leave|leaver|status|terminat|joiner|move)/.test(t)||/person\.(created|terminated|moved|updated)/.test(t)){const ev=/term|leave/.test(t)?"person.terminated":/mov/.test(t)?"person.moved":/updat/.test(t)?"person.updated":"person.created";const rows=trigRows([{id:ev}]);say(q,{t:"<code>"+ev+"</code> triggers "+rows.length+" actions: "+rows.map(r=>H(aKind(r.a)+": "+aText(r.a)+(aTarget(r.a)?" ("+aTarget(r.a)+")":""))).join("; ")+". All connectors are simulated.",steps:["Read the rules for "+ev]});return true}
 return false});

/* ---------- wiring: data model, contract, process, map ---------- */
const W={};
function wire(){
 try{
  if(!O.wired)return;
  if(!W.dm&&window.DATAMODEL&&DATAMODEL.register){DATAMODEL.register("person",{label:"Person",fields:[{k:"employment_type",label:"Employment type",type:"enum",opts:["Full-time","Part-time","Contractor","Intern"]},{k:"fte",label:"FTE fraction",type:"number"},{k:"end_date",label:"End date",type:"date"},{k:"leaving_date",label:"Last working day",type:"date"}]});W.dm=1}
  if(!W.ent&&window.ATLAS&&ATLAS.addEntity){
   const fld=(k,label,type,cls,req)=>({k,label,type,authority:"external",classification:cls||"restricted",req:!!req});
   const defs=[
    {id:"compensation_record",label:"Compensation record",domain:"people",status:"proposed",note:"Base pay, bonus target, grade and effective date for a person. Restricted: reveal checks role and is audited.",fields:[fld("person","Person","ref","restricted",1),fld("base_salary","Base salary","currency","restricted",1),fld("bonus_target_pct","Bonus target","percent","restricted"),fld("pay_grade","Pay grade","enum","restricted"),fld("currency","Currency","enum","internal"),fld("effective_date","Effective date","date","restricted",1)],
     decision:"New, thin. person holds identity and reporting line; nothing registered holds pay. The HR system stays authoritative (external); "+BRAND.name+" keeps a restricted reference copy keyed to person. No pay data is copied to any other entity.",searched:"person, position, budget_line, resource_request"},
    {id:"benefit_enrollment",label:"Benefit enrollment",domain:"people",status:"proposed",note:"A person's election in a benefit plan with coverage tier and monthly costs. Restricted.",fields:[fld("person","Person","ref","restricted",1),fld("plan","Plan","enum","restricted",1),fld("coverage","Coverage tier","enum","restricted"),fld("employee_cost","Employee cost a month","currency","restricted"),fld("employer_cost","Employer cost a month","currency","restricted"),fld("effective_date","Effective date","date","restricted")],
     decision:"New, thin. No benefit or enrollment entity exists. References person and holds only the election.",searched:"person, time_off, compensation_record"},
    {id:"pto_balance",label:"PTO balance",domain:"people",status:"proposed",note:"Accrued, used and planned PTO hours for a person in a year. Available hours feed availability on Resource planning.",fields:[fld("person","Person","ref","restricted",1),fld("year","Year","number","internal"),fld("accrued_hours","Accrued hours","number","restricted"),fld("used_hours","Used hours","number","restricted"),fld("planned_hours","Planned hours","number","restricted"),fld("available_hours","Available hours","number","restricted")],
     decision:"New, thin. time_off records absences but not balances or accrual. The balance is computed from accrual rules and time_off; it references person and does not copy requests.",searched:"time_off, person, oncall_shift"},
    {id:"pto_request",label:"PTO request",domain:"people",status:"proposed",note:"A request for time off with dates, hours and approval. Approved requests become time_off rows that drive availability.",fields:[fld("person","Person","ref","restricted",1),fld("from_date","From","date","internal",1),fld("to_date","To","date","internal",1),fld("hours","Hours","number","restricted"),fld("state","State","enum","internal"),fld("approver","Approver","ref","internal"),fld("time_off","Time off row","ref","internal")],
     decision:"Reuse first: time_off already holds approved absences, so an approved request is written to time_off by reference. The request exists before approval with a state and approver, which time_off lacks, so it is a thin entity rather than a copy.",searched:"time_off, approval, resource_request"}];
   W.dec=[];defs.forEach(d=>{let r=null;try{r=ATLAS.addEntity({id:d.id,label:d.label,domain:d.domain,source:"Org chart",ownerApp:"org_chart",ownerMod:"org_chart",status:d.status,note:d.note,fields:d.fields})}catch(e){}W.dec.push({entity:d.id,decision:d.decision,searched:d.searched,warnings:(r&&r.warnings)||[],dups:(r&&r.duplicates)||[]})});
   G(()=>{const r=ATLAS.addEntity({id:"position",label:"Position",domain:"people",source:"Org chart",ownerApp:"org_chart",ownerMod:"org_chart",status:"proposed",note:"A planned seat in the org. A vacancy is a position with status open.",fields:[{k:"req_id",label:"Requisition id",type:"string",authority:"platform",classification:"internal",req:true},{k:"title",label:"Title",type:"string",authority:"platform",classification:"internal",req:true},{k:"unit",label:"Team",type:"ref",authority:"platform",classification:"internal"},{k:"reports_to",label:"Reports to",type:"ref",authority:"platform",classification:"internal"},{k:"employment_type",label:"Employment type",type:"enum",authority:"platform",classification:"internal"},{k:"fte",label:"FTE fraction",type:"number",authority:"platform",classification:"internal"},{k:"target_start",label:"Target start",type:"date",authority:"platform",classification:"internal"},{k:"budget_line",label:"Budget line",type:"ref",authority:"platform",classification:"internal"},{k:"status",label:"Status",type:"enum",authority:"platform",classification:"internal"}]});W.dec.push({entity:"position",decision:"Reuse: position was already planned for headcount planning. A vacancy is a position whose status is open; no separate vacancy table. Filling it creates a person by reference.",searched:"position, person, organization_unit",warnings:(r&&r.warnings)||[],dups:(r&&r.duplicates)||[]})});
   O.decisions5=W.dec;
   if(window.COVER&&COVER.recs){const R=COVER.recs;const add=(key,label,ent,how,n,path)=>{if(!R.some(r=>r.key===key))R.push({key,label,scr:["org_chart"],mod:"org_chart",n,ent,how,path:path||key})};add("ORG_COMP","Compensation records","compensation_record","new",45,"HR.comp");add("ORG_BEN","Benefit enrollments","benefit_enrollment","new",200,"HR.ben");add("ORG_PTOB","PTO balances","pto_balance","new",45,"HR.pto");add("ORG_PTOR","PTO requests","pto_request","new",90,"HR.pto");add("ORG_VAC","Open positions","position","direct",8,"S.pp2.vac")}
   W.ent=1}
  if(W.ent&&!W.flow&&window.MODMAP&&MODMAP.addFlows){const r=MODMAP.addFlows([
    {from:"org_chart",to:"adm_sec",data:"Deprovision and provision requests from person.* events",entity:"person",mode:"event",trig:"person.created, person.moved, person.terminated"},
    {from:"org_chart",to:"ppl_cap",data:"Approved PTO and FTE as availability",entity:"time_off",mode:"api",trig:"PTO approved or FTE changed"},
    {from:"org_chart",to:"bud_over",data:"Open positions against budget lines",entity:"position",mode:"api",trig:"vacancy.opened, vacancy.closed"},
    {from:"adm_sec",to:"org_chart",data:"Directory (Entra ID) differences: new, changed, removed",entity:"person",mode:"batch",trig:"Directory sync every 4 hours"},
    {from:"bud_over",to:"org_chart",data:"Approved headcount plan lines",entity:"budget_line",mode:"api",trig:"Plan approved"}]);if(r&&r.ok!==false)W.flow=1}
  if(W.ent&&!W.proc&&window.PROCLIB&&PROCLIB.addProcess){let ok=0;O.procWarn5={};PM.forEach(d=>{if(PROCLIB.get&&G(()=>PROCLIB.get(d.id),null)){ok++;return}const r=PROCLIB.addProcess({id:d.id,name:d.name,module:"org_chart",owner:d.owner,backup:d.backup,family:"hr",trigger:d.trigger,std:["itil","cobit"],steps:d.steps,inputs:d.inputs,outputs:d.outputs,entities:d.entities,metrics:d.metrics,model:"cmmi"});O.procWarn5[d.id]=r&&r.warnings;G(()=>{S.plib.own[d.id]={owner:d.owner,backup:d.backup};PROCLIB.refresh()});if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))ok++});if(ok===PM.length)W.proc=1}
 }catch(e){console.error("org5 wire",e)}
 if(W.proc&&W.flow&&!W.ref&&window.MODMAP&&MODMAP.refresh){W.ref=1;G(()=>MODMAP.refresh())}
 O.wired5=!!(W.dm&&W.ent&&W.flow&&W.proc)}
O.wire5=wire;[900,2500,5000,9000].forEach(ms=>setTimeout(wire,ms));
const _w=O.wire;O.wire=function(){if(_w)_w.apply(this,arguments);wire()};
O.wireState5=W;
O.hr={applyTerm,handFields,handOver,ownedCounts,record,mkTasks,procSteps,showResult,liveBlock,add:openAdd,edit:openEdit,move:openMove,term:openTerm,status:n=>O.openStatus&&O.openStatus(n),vacancy:openVacForm,fill:id=>openAdd({vac:id}),log:()=>HR.log,events:EVDEF.map(e=>e[0]),rulesFor,stats:stats5,compOf,canSee,syncRows,applySched,createPerson,emit,state:HR,queued:()=>EQ.length};
})();
