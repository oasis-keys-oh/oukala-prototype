/* ============ Chat and agents: dock, threads, activities, context, tools, planner, guardrails ============
   Aligned to: MCP-style tool registry (name, JSON-schema-like inputs, risk annotations), ServiceNow AI Agents and Flow Designer
   (plan, tools, human in the loop), Moveworks agentic fulfillment (plugins, approvals), Copilot Studio (topics and actions),
   Salesforce Agentforce (topics, actions, guardrails and trust layer). No network model: a deterministic planner scores tools. */
(function(){
const H=s=>esc(s==null?"":s);
const CX=window.CHATX=window.CHATX||{};
const LSK="oukala-chx-1";
const TODAY="2026-10-06";
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DW=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const pd=s=>new Date(s+"T00:00:00Z"),iso=d=>d.toISOString().slice(0,10),addD=(s,n)=>iso(new Date(pd(s).getTime()+n*864e5));
const fd=s=>{if(!s)return"";const d=pd(s);return MON[d.getUTCMonth()]+" "+d.getUTCDate()};
const clock=()=>new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
const N0=n=>Math.round(+n||0).toLocaleString("en-US");
const mon=n=>"$"+N0(n);
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const plain=h=>String(h==null?"":h).replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
let SEQ=0;const uid=p=>p+(++SEQ).toString(36)+Math.floor(Math.random()*46656).toString(36);
const ME_NAME="Omar Hamid";

/* ---------------- state ---------------- */
const DEF_POL=[
 {id:"G1",n:"High risk actions need a person",d:"An action marked high risk never runs on its own, even when the thread is set to act within guardrails.",on:true,lock:false},
 {id:"G2",n:"Spend limit",d:"Orders above the limit need the requester's manager. Orders above ten times the limit also need Finance.",on:true,val:2000,unit:"$"},
 {id:"G3",n:"Delegation required",d:"Writing records for another person needs a verified delegation (management chain, executive delegation or a recorded grant).",on:true},
 {id:"G4",n:"Redact sensitive HR data",d:"Compensation, performance and the reason for time off are hidden unless the acting role holds the HR data permission.",on:true},
 {id:"G5",n:"AI token limit policy",d:"A raise above the multiple needs Finance. Restricted data adds Security. Nothing goes above the hard cap.",on:true,val:2,unit:"x",cap:200},
 {id:"G6",n:"Tier 1 changes go to the CAB",d:"A change on a Tier 1 service is never approved automatically: the change advisory board (CAB) decides.",on:true},
 {id:"G7",n:"Separation of duties",d:"A person never approves their own request, even through chat or a delegate.",on:true,lock:true},
 {id:"G8",n:"Bulk limit",d:"One chat action may create or change at most this many records; more goes to a person to review.",on:true,val:25,unit:"records"},
 {id:"G9",n:"Cite or decline",d:"Answers about policy, SLAs and metrics must cite a source from the platform, or say they cannot.",on:true},
 {id:"G10",n:"Audit every action",d:"Every executed step writes an audit entry with the model, confidence and the policy that allowed it. Cannot be turned off.",on:true,lock:true}];
const DEF_DELEG=[
 {id:"DL1",from:"Hana Koval",to:ME_NAME,scope:"Orders, tickets, approvals",by:"Maya Ortiz",until:"2027-03-31",why:"Contractor onboarding"},
 {id:"DL2",from:"Avery Chen",to:ME_NAME,scope:"Approvals up to $50,000",by:"Avery Chen",until:"2026-12-31",why:"Quarter-end cover"}];
const ST=S.chx=S.chx||{threads:[],active:null,acts:[],forms:{},reqs:[],swaps:[],pto:[],limits:{},lastRec:null,lastPerson:null,
 dock:{w:460,full:false,view:"chat",side:"ctx",open:false},pol:JSON.parse(JSON.stringify(DEF_POL)),deleg:JSON.parse(JSON.stringify(DEF_DELEG)),
 mode:"ask",use:{asks:0,answered:0,tasks:0,done:0,steps:0,esc:0,blocked:0,deflect:0},toolUse:{},seq:1,permOv:{},drafts:[]};
CX.ST=ST;
function save(){try{const o={threads:ST.threads.map(t=>Object.assign({},t,{msgs:t.msgs.slice(-60).map(m=>{const c=Object.assign({},m);delete c.act;delete c.stream;return c})})),active:ST.active,dock:ST.dock,pol:ST.pol,deleg:ST.deleg,mode:ST.mode,use:ST.use,toolUse:ST.toolUse,permOv:ST.permOv,limits:ST.limits,
  acts:ST.acts.slice(0,40).map(a=>Object.assign({},a,{steps:a.steps.map(s=>Object.assign({},s,{res:s.res?Object.assign({},s.res,{rec:s.res.rec}):s.res}))}))};localStorage.setItem(LSK,JSON.stringify(o))}catch(e){}}
function load(){try{const o=JSON.parse(localStorage.getItem(LSK)||"null");if(!o)return;if(o.threads)ST.threads=o.threads;ST.active=o.active;if(o.dock)Object.assign(ST.dock,o.dock,{open:false});if(o.pol&&o.pol.length)ST.pol=DEF_POL.map(p=>Object.assign({},p,(o.pol.find(x=>x.id===p.id)||{})));if(o.deleg)ST.deleg=o.deleg;if(o.mode)ST.mode=o.mode;if(o.use)Object.assign(ST.use,o.use);if(o.toolUse)ST.toolUse=o.toolUse;if(o.permOv)ST.permOv=o.permOv;if(o.limits)ST.limits=o.limits;
  if(o.acts)ST.acts=o.acts.map(a=>{a.restored=true;a.steps.forEach(s=>{if(s.status==="running"||s.status==="queued")s.status="cancelled";delete s.undone});if(a.status==="running"||a.status==="planned")a.status="cancelled";return a})}catch(e){}}
let _sv=0;const saveSoon=()=>{clearTimeout(_sv);_sv=setTimeout(save,400)};
CX.save=saveSoon;

/* ---------------- roles and capabilities (what the acting person may do) ---------------- */
const ROLE_CAPS={
 exec:["read","incident.create","incident.write","request.order","request.approve","ai.limit.request","ai.limit.approve","project.write","demand.write","change.write","oncall.write","pto.write","kb.write","report.build","contract.read","hr.read","runbook.run","access.grant","ui.set"],
 fin:["read","incident.create","request.order","request.approve","ai.limit.request","ai.limit.approve","report.build","contract.read","pto.write","demand.write","ui.set"],
 pm:["read","incident.create","request.order","project.write","demand.write","pto.write","kb.write","report.build","contract.read","ui.set"],
 ops:["read","incident.create","incident.write","request.order","request.approve","change.write","oncall.write","pto.write","kb.write","runbook.run","access.grant","report.build","ui.set"]};
const CAP_LABEL={"read":"Read records and answers","incident.create":"Report an incident","incident.write":"Assign, prioritize and resolve incidents","request.order":"Order from the catalog","request.approve":"Approve or reject requests","ai.limit.request":"Request a higher AI token limit","ai.limit.approve":"Approve AI token limits","project.write":"Create projects, tasks and RAID items","demand.write":"Raise demand","change.write":"Create and schedule changes","oncall.write":"Swap on-call shifts","pto.write":"Request time off","kb.write":"Draft knowledge articles","report.build":"Build charts and reports","contract.read":"Read and summarize contracts","hr.read":"See sensitive HR data","runbook.run":"Run runbooks and standard changes","access.grant":"Grant system access","ui.set":"Change display settings and chat controls"};
CX.CAPS=ROLE_CAPS;CX.CAP_LABEL=CAP_LABEL;
const roleKey=()=>S.persona;
function capsOf(k){const base=(ROLE_CAPS[k||roleKey()]||[]).slice();const ov=ST.permOv[k||roleKey()]||{};Object.keys(ov).forEach(c=>{const i=base.indexOf(c);if(ov[c]&&i<0)base.push(c);if(!ov[c]&&i>=0)base.splice(i,1)});return base}
const hasCap=c=>!c||capsOf().includes(c);
const roleName=()=>(PERSONAS[S.persona]||{n:"Executive"}).n;
const pol=id=>ST.pol.find(p=>p.id===id)||{on:false};
const polOn=id=>!!pol(id).on;

/* ---------------- people helpers ---------------- */
const PS=()=>DIR.filter(d=>!d.generated);
const KNAME=n=>{const r=who(n);return r?r.name:n};
const firstOf=n=>String(n||"").split(" ")[0];
function personOpts(limit){const base=PS().map(d=>[d.name,d.name+" · "+KINDS[d.kind]+" · "+(d.role||"")]);return limit?base.slice(0,limit):base}
const mgrChain=n=>{const out=[];let c=who(n),g=0;while(c&&c.mgr&&g++<8){out.push(c.mgr);c=who(c.mgr)}return out};
function delegation(subject){
 const out={subject,verified:false,basis:"",scope:"",needs:""};if(!subject||subject===ME_NAME){out.verified=true;out.basis="Acting for yourself";out.scope="Everything your role allows";return out}
 const rec=who(subject);if(!rec){out.verified=true;out.basis="New starter with no account yet: you request on their behalf as sponsor";out.scope="Onboarding requests";return out}
 const dl=ST.deleg.find(d=>d.from===subject&&d.to===ME_NAME&&(!d.until||d.until>=TODAY));
 if(dl){out.verified=true;out.basis="Recorded delegation "+dl.id+" from "+subject+" (valid to "+fd(dl.until)+")";out.scope=dl.scope;return out}
 if(mgrChain(subject).includes(ME_NAME)&&rec&&rec.kind!=="ai"){out.verified=true;out.basis="Management chain: "+ME_NAME+" is above "+subject;out.scope="Orders, tickets, approvals and tasks for direct and indirect reports";return out}
 if(S.persona==="exec"&&rec&&rec.kind!=="ai"&&rec.kind!=="msp"){out.verified=true;out.basis="Executive delegation: the CIO may act for anyone in the Foundation. Each use is logged.";out.scope="Orders, tickets and approvals. HR data stays redacted unless your role has it.";return out}
 if(rec&&(rec.kind==="ai"||rec.kind==="msp")){out.basis=KINDS[rec.kind]+" are acted for by their owner team, not by delegation";out.needs="Ask the owner team to run the action, or open the AI Control Tower.";return out}
 out.basis="No delegation on record and "+ME_NAME+" is not in "+firstOf(subject)+"'s management chain";out.needs="Ask "+firstOf(subject)+" to grant a delegation, or ask their manager"+(rec&&rec.mgr?" ("+rec.mgr+")":"")+".";return out}
CX.delegation=delegation;

/* ---------------- threads and context ---------------- */
function newThread(title,o){const t=Object.assign({id:uid("T"),title:title||"New chat",pinned:false,arch:false,created:Date.now(),upd:Date.now(),mode:ST.mode,msgs:[],pend:null,unread:0,ctx:{subj:null,attach:[],off:{}}},o||{});ST.threads.unshift(t);ST.active=t.id;return t}
const cur=()=>{let t=ST.threads.find(x=>x.id===ST.active&&!x.arch);if(!t){t=ST.threads.find(x=>!x.arch)||newThread()}ST.active=t.id;return t};
CX.cur=cur;
try{Object.defineProperty(S,"chat",{configurable:true,enumerable:true,get(){return cur().msgs},set(v){cur().msgs=Array.isArray(v)?v:[]}})}catch(e){}
const screenName=id=>{const s=SCREENS.find(x=>x[0]===id);return s?s[1]:id};
function lookupRec(id){if(!id)return null;const X=S.itsm||{};let r;
 if(/^INC/.test(id)&&(r=(X.inc||[]).find(i=>i.id===id)))return{id,type:"Incident",t:r.t,sub:r.svc+" · "+r.st,svc:r.svc,go:()=>{go("itsm_inc")}};
 if(/^CHG/.test(id)&&(r=(X.chg||[]).find(i=>i.id===id)))return{id,type:"Change",t:r.t,sub:r.svc+" · "+r.st,svc:r.svc,go:()=>go("itsm_chg")};
 if(/^PRB/.test(id)&&(r=(X.prb||[]).find(i=>i.id===id)))return{id,type:"Problem",t:r.t,sub:r.svc+" · "+r.st,svc:r.svc,go:()=>go("itsm_prb")};
 if(/^RITM/.test(id)){r=(window.REQREG||[]).find(i=>i.id===id);if(r)return{id,type:"Request",t:G(()=>(r.vals&&(r.vals.title||r.vals.model||r.vals.name))||r.item,r.item),sub:r.service+" · "+(r.state||""),svc:r.service,go:()=>{go("svc_req");G(()=>svcOpenRequest(id))}};r=ST.reqs.find(i=>i.id===id);if(r)return{id,type:"Request",t:r.title,sub:r.svc+" · "+r.state,svc:r.svc,go:()=>go("svc_req")}}
 if(/^KB/.test(id)&&(r=(X.kb||[]).find(i=>i.id===id)))return{id,type:"Article",t:r.t,sub:r.svc,svc:r.svc,go:()=>go("kcs_home")};
 if(/^R-\d/.test(id)&&(r=(window.PPMRAID||[]).find(i=>i.id===id)))return{id,type:"RAID item",t:r.n,sub:r.p+" · "+r.s,go:()=>go("ppm_raid")};
 if(/^PR\d/.test(id)&&(r=PROJ.find(p=>p.id===id)))return{id,type:"Project",t:r.n,sub:"Owner "+r.owner,go:()=>go("plan",id)};
 if(/^MSF-/.test(id)&&(r=(window.SVC_ASSETS||[]).find(a=>a.id===id)))return{id,type:"Asset",t:r.model,sub:r.st+(r.who?" · "+r.who:""),go:()=>{go("svc_asset");G(()=>svcOpenAsset(id))}};
 if(/^SLA-/.test(id)){r=G(()=>SLAX.AGS().find(a=>a.id===id));if(r)return{id,type:"SLA",t:r.n,sub:r.ty+" · "+r.tbl,go:()=>go("svc_sla")}}
 return null}
CX.lookupRec=lookupRec;
const REC_RE=/\b(INC\d{4,6}|CHG\d{4,6}|PRB\d{4,6}|RITM\d{5,8}|KB\d{4}|SLA-[A-Z0-9-]+|R-\d{3}|MSF-\d{5})\b/;
function trackDrawer(){const d=$("#drawer");if(!d)return;let txt="";try{txt=d.textContent.slice(0,700)}catch(e){}
 const h=d.querySelector(".p360h h2");if(h){ST.lastPerson={name:h.textContent.trim(),at:Date.now()};ST.lastRec={id:"person:"+h.textContent.trim(),person:h.textContent.trim(),type:"Person",t:h.textContent.trim(),sub:"Person 360",at:Date.now(),screen:S.screen};return}
 const m=REC_RE.exec(txt);if(m){const r=lookupRec(m[1]);ST.lastRec={id:m[1],type:r?r.type:"Record",t:r?r.t:m[1],sub:r?r.sub:"",at:Date.now(),screen:S.screen}}}
document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="drawer"&&e.newState==="open"){setTimeout(()=>{trackDrawer();CX.drawCtx&&CX.drawCtx()},60)}},true);
function ctxNow(t){t=t||cur();const c=t.ctx;const rec=ST.lastRec&&!c.off.rec?ST.lastRec:null;
 return{page:c.off.page?null:{id:S.screen,name:screenName(S.screen)},rec,acting:{name:ME_NAME,role:roleName(),caps:capsOf()},subj:c.subj,attach:c.attach,off:c.off,mode:t.mode||ST.mode,thread:t}}
CX.ctxNow=ctxNow;
function setSubject(name,t){t=t||cur();t.ctx.subj=name||null;if(name){audit("chat: acting on behalf of",name+" ("+(delegation(name).verified?"delegation verified":"not verified")+")")}else audit("chat: stopped acting on behalf","");CX.drawAll&&CX.drawAll();saveSoon()}
CX.setSubject=setSubject;
function attach(item,t){t=t||cur();if(!item||t.ctx.attach.some(a=>a.k===item.k&&a.id===item.id))return false;t.ctx.attach.push(item);audit("chat: attached to context",item.k+" "+item.label);CX.drawAll&&CX.drawAll();saveSoon();return true}
CX.attach=attach;

/* ---------------- subject records (what the AI can see for the person you act for) ---------------- */
function subjectPack(name){
 const r=who(name)||{name,kind:"human"};const out=[];const hr=hasCap("hr.read");
 const add=(key,label,rows,o)=>out.push(Object.assign({key,label,rows:rows||[],n:(rows||[]).length},o||{}));
 add("assets","Assets and software",G(()=>(window.SVC_ASSETS||[]).filter(a=>a.who===name).slice(0,60).map(a=>({id:a.id,t:a.model||a.id,sub:(a.cls||"")+" · "+(a.st||""),st:a.st==="Deployed"?"good":"mute",go:()=>{go("svc_asset");G(()=>svcOpenAsset(a.id))}})),[]));
 add("tickets","Tickets",G(()=>((S.itsm&&S.itsm.inc)||[]).filter(i=>i.own===name||String(i.caller||"").indexOf(name)===0||(i.swarm||[]).includes(name)).slice(0,40).map(i=>({id:i.id,t:i.t,sub:i.svc+" · "+i.st,st:i.st==="Resolved"?"mute":"warn",go:()=>go("itsm_inc")})),[]));
 const rq=G(()=>(window.REQREG||[]).filter(x=>x.requester===name||x.for===name||x.onBehalfOf===name).slice(0,60).map(x=>({id:x.id,t:G(()=>(x.vals&&(x.vals.title||x.vals.model||x.vals.name||x.vals.kind))||x.item,x.item)+" ("+x.item+")",sub:(x.service||"")+" · "+(x.state||""),st:/pending/.test(x.state)?"warn":/rejected|cancel/.test(x.state)?"bad":"good",go:()=>{go("svc_req");G(()=>svcOpenRequest(x.id))}})),[]);
 const mine=ST.reqs.filter(x=>x.for===name||x.by===name).map(x=>({id:x.id,t:x.title,sub:x.svc+" · "+x.state,st:x.state==="Delivered"?"good":"warn",go:()=>go("svc_req")}));
 add("requests","Requests",mine.concat(rq));
 add("approvals","Approvals waiting on them",G(()=>(window.REQREG||[]).filter(x=>Object.values(x.ap||{}).some(a=>a.who===name&&a.st==="pending")).slice(0,30).map(x=>({id:x.id,t:G(()=>(x.vals&&(x.vals.title||x.vals.model||x.vals.name||x.vals.kind))||x.item,x.item),sub:"Approval pending · "+(x.service||""),st:"warn",go:()=>{go("svc_req");G(()=>svcOpenRequest(x.id))}})),[]).concat(ST.reqs.filter(x=>(x.gates||[]).some(g=>g.who===name&&g.st==="pending")).map(x=>({id:x.id,t:x.title,sub:"Approval pending (chat order)",st:"warn",go:()=>go("svc_req")}))));
 const W=G(()=>workFor(name),[]);W.forEach(g=>add("w:"+g.kind,g.kind,g.rows.slice(0,40).map(x=>({id:x.id,t:x.t,sub:x.sub||"",st:x.st||"mute",go:x.go,tag:x.due})),{work:true}));
 add("skills","Skills",G(()=>(SKILLSDB.of(name)||[]).slice(0,30).map(x=>{const n=typeof x==="string"?x:(x.n||x.name||(x.skill&&x.skill.n)||x.skill||x.id);const lv=x.level||x.lv||"";return{id:String(n),t:String(n),sub:lv?"Level "+lv:"",st:"info",go:()=>go("svc_skills")}}),(r.skills||[]).map(s=>({id:s,t:s,sub:"",st:"info",go:()=>go("svc_skills")}))));
 const pto=G(()=>OCX.allPto().filter(p=>p.who===name),[]).concat(ST.pto.filter(p=>p.who===name));
 add("pto","Time off",pto.slice(0,10).map(p=>({id:p.id||"PTO",t:fd(p.from)+" to "+fd(p.to),sub:p.type+(hr?(p.note?" · "+p.note:""):""),st:p.st==="Approved"||p.st==="approved"?"good":"warn",go:()=>go("svc_skills")})),{redactNote:!hr});
 if(r.rate||r.kind==="contractor"||r.kind==="human")add("comp","Compensation, rate and performance",[],{redacted:!hr,note:hr?(r.rate?"Rate $"+r.rate+" an hour":"Compensation is held in the HR system; not loaded in this prototype"):"Hidden: your role ("+roleName()+") does not hold the HR data permission"});
 return out}
CX.subjectPack=subjectPack;

/* ---------------- context pack: what the AI can see right now ---------------- */
function packItems(t){t=t||cur();const c=ctxNow(t),items=[];
 const tok=n=>Math.round(n);
 if(c.page)items.push({k:"page",label:"This page: "+c.page.name,why:"The screen you are on, its summary numbers and its records.",tok:tok(900),perm:"Same access as the page itself",rm:"page"});
 if(c.rec)items.push({k:"rec",label:"Last opened: "+c.rec.id.replace(/^person:/,"")+" "+(c.rec.t&&c.rec.t!==c.rec.id?"· "+String(c.rec.t).slice(0,40):""),why:"The record you had open in a drawer, with its history and links.",tok:tok(1200),perm:"Record permission of "+ME_NAME,rm:"rec"});
 items.push({k:"acting",label:"You: "+ME_NAME+" ("+c.acting.role+")",why:"Your profile, role capabilities and approval limits. This decides what the AI is allowed to do.",tok:200,perm:c.acting.caps.length+" capabilities"});
 if(c.subj){const dl=delegation(c.subj),sp=subjectPack(c.subj);items.push({k:"subj",label:"On behalf of: "+c.subj,why:"Their assets, software, tickets, requests, projects, approvals, skills and time off, as far as the delegation and your role allow.",tok:tok(300+sp.reduce((a,s)=>a+s.n*40,0)),perm:dl.verified?dl.basis:"Not verified: read only",rm:"subj",warn:!dl.verified})}
 c.attach.forEach(a=>items.push({k:"att",id:a.k+":"+a.id,label:a.label,why:"Attached by you: "+a.k,tok:tok(700),perm:"Record permission of "+ME_NAME,rm:"att:"+a.k+":"+a.id}));
 items.push({k:"kb",label:"Knowledge base and metrics",why:"Articles, SLA definitions and the metric catalog, used for grounded answers with citations.",tok:tok(2400),perm:"Published articles and definitions",rm:"kb"});
 items.push({k:"pol",label:"Guardrail policies ("+ST.pol.filter(p=>p.on).length+" active)",why:"Rules the planner must obey. Always included.",tok:350,perm:"Always on",locked:true});
 return items}
CX.packItems=packItems;
function accessRows(t){t=t||cur();const c=ctxNow(t),hr=hasCap("hr.read");const rows=[];
 rows.push(["Page and records",ME_NAME+" ("+c.acting.role+")","Read","None",c.page?"Screen data and linked records":"Off"]);
 rows.push(["Catalog and requests","Request ordering, approvals for "+(S.persona==="fin"||S.persona==="exec"||S.persona==="ops"?"your queue":"nobody"),capsOf().includes("request.order")?"Read and order":"Read","None","All requests you requested or approve"]);
 rows.push(["Incidents, changes, problems",capsOf().includes("incident.write")?"Service desk write":"Report only",capsOf().includes("incident.write")?"Read and write":"Read and report","None","All, tier 1 included"]);
 rows.push(["People directory","Directory read","Read","Contact details only","All "+DIR.length+" people"]);
 rows.push(["Compensation, performance, time off reasons",hr?"HR data permission":"No HR data permission",hr?"Read":"Blocked",hr?"None":"Redacted","Sensitive HR fields"]);
 rows.push(["Contracts and spend",capsOf().includes("contract.read")?"Contract read":"No contract access",capsOf().includes("contract.read")?"Read":"Blocked",capsOf().includes("contract.read")?"None":"Redacted","Vendors and obligations"]);
 if(c.subj){const dl=delegation(c.subj);rows.push(["Records of "+c.subj,dl.verified?"Delegation: "+dl.basis:"No verified delegation",dl.verified?"Read and write within scope":"Read only",hr?"None":"HR fields redacted",dl.scope||"Public directory data only"])}
 return rows}
CX.accessRows=accessRows;
