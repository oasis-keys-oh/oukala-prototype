
/* ---------- generic work, alerts, meetings and simulated demo events ---------- */
const HANDLED=/^(Approvals to decide|Invoices to approve|Change approvals waiting|Service requests waiting on them|Knowledge reviews|Maturity capabilities|Meetings this week|Devices assigned|Software they hold|Their open requests|Service ownership|Accountable for AI agents|On-call shifts|Projects led)/;
const WK=[[/^Time off/,"Time off request","approval","people"],[/^Resource requests/,"Resource request","approval","people"],[/^Finance exceptions/,"Finance exception","approval","budget"],[/^Agreements to review/,"Agreement review","approval","contract"],
 [/^Reviews to write|^Feedback and 360/,"Review to write","action","people"],[/^Assessments/,"Assessment","action","task"],[/^RAID/,"Risk or issue","action","alert"],[/^Training/,"Training","action","book"],[/^Contract obligations/,"Obligation","action","contract"],
 [/^(Incidents|Problems owned|Post-incident|Changes to implement|Release readiness|Standard changes owned|Assigned work queue)/,"Service work","action","task"],[/^(Project tasks|WBS assignments|Project assignments)/,"Project task","action","task"]];
defAdp("work",{label:"Assigned work in every module",mod:"Every module via kit2 WORK",fn:"WORK.fn(person)",wired:false,
 list(me){const out=[];if(!window.WORK)return out;const per={};WORK.forEach(w=>{if(HANDLED.test(w.kind))return;const m=WK.find(x=>x[0].test(w.kind));if(!m)return;const rows=G(()=>w.fn(me),[])||[];
   rows.slice(0,m[2]==="approval"?10:6).forEach((r,i)=>{const nm=w.tag+":"+r.id;const dueH=dueFromText(r.due);out.push(mk({id:"work:"+nm,src:"work",sid:r.id,kind:m[2],cat:m[1],ic:m[3],title:r.t,req:"",ageH:12,slaH:48,dueH:r.due?dueH:120,risk:r.st==="warn"?"med":"low",flag:r.st==="warn"&&dueH<0,
    why:m[2]==="approval"?"Assigned to you in "+w.kind.toLowerCase()+". "+(r.sub||""):"Assigned to you: "+w.kind.toLowerCase()+". "+(r.sub||""),
    ai:mkAI(r.sub||r.t,.75,"Work Agent",[w.kind],""),guard:m[2]==="approval"?"This module has no approve function yet, so the inbox opens its record for you to decide.":"Work is done in the owning screen.",ev:[["From",w.kind,""],["Detail",r.sub||"",""],["Due",r.due||"None set",""]],
    can:{approve:false,reject:false,delegate:false},openLabel:m[2]==="approval"?"Open to decide":"Open",open:()=>{if(r.go)r.go();else toast("No screen is linked to this item","warn")}}))})});return out}});
defAdp("alert",{label:"Alerts",mod:"Observability",fn:"OBSX.alerts",wired:false,
 list(me){if(!(window.OBSX&&OBSX.alerts)||(S.persona!=="ops"&&S.persona!=="exec"))return[];return G(()=>OBSX.alerts(),[]).filter(a=>a.active&&(S.persona==="ops"||a.sev<=2)).slice(0,6).map(a=>mk({id:"alert:"+a.id,src:"alert",sid:a.id,kind:"mention",cat:"Alert",ic:"alert",title:a.msg,req:a.src,reqExt:true,ageH:Math.max(0,Math.abs(a.from||0)/60),dueH:2,risk:a.sev<=2?"high":"med",flag:a.sev<=2,
   why:S.persona==="ops"?"You lead the service desk, so active alerts on Tier 1 and 2 services reach you.":"Severity 1 and 2 alerts reach the CIO.",ai:mkAI("Fired by "+a.src+" on "+(a.ci||"a configuration item")+". "+(a.count>1?a.count+" repeats grouped.":""),.8,"Ops Agent",["Monitoring rules"],""),guard:"Alerts are never approved here. Open the dashboard to acknowledge.",ev:[["Source",a.src,""],["Severity",String(a.sev),a.sev<=2?"bad":"warn"],["Repeats",String(a.count||1),""]],can:{approve:false,reject:false,delegate:false},open:()=>go("obs_dash")}))}});
defAdp("meet",{label:"Meetings: actions and decisions",mod:"Meetings (MEETX) and Forums",fn:"MEETX if present, MEETINGS review count",wired:false,
 list(me){const out=[];
  if(window.MEETX){const arr=G(()=>MEETX.awaiting?MEETX.awaiting(me):MEETX.pending?MEETX.pending(me):MEETX.inbox?MEETX.inbox(me):[],[])||[];
   arr.slice(0,12).forEach((r,i)=>out.push(mk({id:"meetx:"+(r.id||i),src:"meet",sid:r.id||i,kind:r.type==="action"?"action":"approval",cat:r.type==="action"?"Meeting action":"Decision to ratify",ic:"meet",title:r.title||r.t,req:r.by||"",dueH:r.dueH!=null?r.dueH:dueFromText(r.due),risk:"low",why:r.why||"Assigned to you in a meeting.",ai:mkAI(r.sub||r.summary||"",.8,"Meeting Agent",["Meeting record"],""),guard:"Decisions are ratified in the meeting record.",ev:[["Meeting",r.meeting||"",""]],
    can:{approve:typeof MEETX.ratify==="function"&&r.type!=="action",reject:false,delegate:false},_r:r,open:()=>{if(r.go)r.go();else if(MEETX.open)MEETX.open(r.id)}})))}
  (typeof MEETINGS!=="undefined"?MEETINGS:[]).filter(m=>m.rev>0&&(m.att||[]).includes(me)).slice(0,5).forEach(m=>out.push(mk({id:"meet:"+m.id,src:"meet",sid:m.id,kind:"mention",cat:"Meeting review",ic:"meet",title:m.rev+" AI-extracted item"+(m.rev>1?"s":"")+" to review from "+m.t,req:"First Officer",ageH:30,dueH:30,risk:"low",
   why:"You attended, so you confirm what was extracted from the minutes.",ai:mkAI(m.sum||"",.8,"First Officer",["Meeting transcript"],""),guard:"Nothing extracted from a meeting is filed until a person confirms it.",ev:[["Meeting",m.t,""],["Items to review",String(m.rev),""]],can:{approve:false,reject:false,delegate:false},open:()=>{go("fo",m.id)}})));return out},
 approve(it,note){return G(()=>{const r=MEETX.ratify(it.sid,note);return r&&r.ok===false?{ok:false,why:r.why||r.error}:{ok:true}},{ok:false,why:"Meetings module not available"})}});

const SIMT={exec:[
 ["Tom Becker asked you to approve Change CHG0042","Change","change","Tom Becker",null,"med","Standard patch window for the Standards Portal web tier. Back-out tested on Oct 4.",.88,"approve"],
 ["Avery Chen asked you to approve a $18,400 reserve release for search relevance","Budget","budget","Avery Chen",18400,"low","Within the Q4 reserve and the project's approved scope. Forecast Agent matched the amount to the plan.",.91,"approve"],
 ["Rina Okafor needs a decision on elevated access for the audit team","Access request","access","Rina Okafor",null,"high","Six-hour elevated access to the Contract Repository for the external auditors. Logged and time boxed.",.66,"conditions"],
 ["Dev Rao asked you to approve a $9,600 Lumen change order","Contract","contract","Dev Rao",9600,"low","Adds two reporting dashboards to SOW-4. Inside the 5% tolerance.",.84,"approve"]],
 fin:[["Northwind Cloud sent invoice INV-20466 for $9,850","Invoice","invoice","Northwind Cloud",9850,"low","Inside the PO and matches usage. All six checks pass.",.95,"approve"]],
 pm:[["Dev Rao asked you to confirm Milestone 3 acceptance criteria","Approval","task","Dev Rao",null,"low","Criteria were drafted from the statement of work. Two items are still open.",.8,"approve"]],
 ops:[["Nia Brooks asked you to approve emergency change CHG0044","Change","change","Nia Brooks",null,"high","Fixes the Sev 2 on the Standards Portal. Back-out takes 30 minutes.",.7,"conditions"]]};
function simPush(){const T=SIMT[S.persona]||SIMT.exec;const t=T[I.simN%T.length];I.simN++;const id="sim:"+I.simN;
 const it=mk({id,src:"sim",sid:id,cat:t[1],ic:t[2],title:t[0],req:t[3],ageH:0.05,slaH:24,dueH:t[5]==="high"?3:20,amt:t[4],risk:t[5],sim:true,flag:t[5]==="high",
  why:"Simulated demo event: it shows how a new request would reach you. "+(S.persona==="exec"?"You hold the executive approver role.":""),ai:mkAI(t[6],t[7],"Approval Advisor",["Simulated example"],t[8]),rec:t[8],guard:"Simulated demo event. Approving it records your decision in the inbox only; no module changes.",
  ev:[["Origin","Simulated demo event","warn"],["Requester",t[3],""],["Risk",t[5],""]],can:{approve:true,reject:true,delegate:true},open:()=>toast("This is a simulated demo event, so there is no record to open","info")});
 I.simItems.push(Object.assign({},it,{open:undefined,_t:t,_p:S.persona,_at:Date.now()}));bump();return it}
function simFor(me){return I.simItems.filter(x=>x._p===S.persona&&!I.hist.some(h=>h.id===x.id)).map(x=>mk(Object.assign({},x,{open:()=>toast("This is a simulated demo event, so there is no record to open","info"),ageH:Math.max(0.05,x.ageH+(Date.now()-(x._at||Date.now()))/36e5)})))}

/* ---------- collect everything ---------- */
function collect(force){const key=[S.persona,window.SCALE&&SCALE.on,VER,I.dele.length,Object.keys(I.snz).length].join("|");
 if(!force&&CACHE&&CKEY===key&&Date.now()-CT<2500)return CACHE;
 const me=ME(),items=[],seen=new Set();I.errs={};
 Object.values(ADP).forEach(a=>{let r=[];try{r=a.list(me)||[]}catch(e){I.errs[a.key]=String(e&&e.message||e)}r.forEach(x=>{if(!x||seen.has(x.id))return;seen.add(x.id);items.push(x)})});
 simFor(me).forEach(x=>{if(!seen.has(x.id)){seen.add(x.id);items.push(x)}});
 const now=Date.now(),dl=activeDele();
 const out=items.filter(x=>{if(I.pend[x.id])return false;if(I.snz[x.id]&&I.snz[x.id]>now)return false;if(I.delegated&&I.delegated[x.id])return false;return true});
  out.sort((a,b)=>a.sc-b.sc);CACHE=out;CKEY=key;CT=now;
 return out}
function snoozedItems(){const me=ME(),now=Date.now();return Object.keys(I.snz).filter(id=>I.snz[id]>now)}
const counts=list=>{list=list||collect();const c={all:list.length,approval:0,action:0,mention:0,urgent:0,overdue:0};list.forEach(x=>{c[x.kind]=(c[x.kind]||0)+1;if(x.urgent)c.urgent++;if(x.dueH<0&&x.kind!=="mention")c.overdue++});return c};
const byTab=(list,tab)=>tab==="all"?list:list.filter(x=>x.kind===tab);
const byId=id=>collect().find(x=>x.id===id);
const flt=list=>{const f=I.flt||{};let r=list;if(f.kinds&&f.kinds.length)r=r.filter(x=>f.kinds.includes(x.cat));if(f.srcs&&f.srcs.length)r=r.filter(x=>f.srcs.includes(x.src));if(f.grp&&f.grp.length)r=r.filter(x=>f.grp.includes(x.group));if(f.q){const q=f.q.toLowerCase();r=r.filter(x=>(x.title+" "+x.req+" "+x.cat).toLowerCase().includes(q))}return r};

/* ---------- delegation rules, policies ---------- */
const TODAY_ISO="2026-10-06";
function activeDele(){return I.dele.filter(d=>d.on&&d.from<=TODAY_ISO&&d.until>=TODAY_ISO&&d.owner===ME())}
function covers(d,it){return it.kind==="approval"&&it.can&&it.can.delegate&&(d.limit==null||it.amt==null||it.amt<=d.limit)&&it.risk!=="high"&&it.src!=="sim"}
function pols(){const me=ME();I.pol=I.pol||{};if(!I.pol[me]){I.pol[me]=[
 {id:"pol-inv",name:"Pay invoices under $25,000 from certified vendors",src:"inv",max:25000,minConf:.9,vendors:["Northwind Cloud"],on:false,runs:0,exp:"2027-03-31",why:"All six invoice checks pass and the advisor recommends approval at 90% or more."},
 {id:"pol-cat",name:"Approve standard catalog requests under $500",src:"cat",max:500,minConf:.85,on:false,runs:0,exp:"2027-03-31",why:"Inside the entitlement, with the AI recommending approval at 85% or more."},
 {id:"pol-wf",name:"Approve low-risk workflow items under $2,500",src:"flow",max:2500,minConf:.92,on:false,runs:0,exp:"2027-03-31",why:"Low risk, no open gate, AI recommending approval at 92% or more."}]}return I.pol[me]}
function polMatch(it,p){if(it.src!==p.src||it.sim||!it.can.approve||it.blk||it.risk!=="low"||it.rec!=="approve")return false;if(p.max!=null&&it.amt!=null&&it.amt>p.max)return false;if(it.ai&&it.ai.conf<p.minConf)return false;if(p.vendors&&p.vendors.length&&!p.vendors.includes(it.vendor))return false;
 if(p.src==="inv"){const inv=G(()=>INVOICES.find(i=>i.id===it.sid),null);if(!inv||!inv.checks.every(c=>c[1]==="good"))return false}return it.req!==ME()}
const polHits=p=>collect().filter(it=>polMatch(it,p));

/* ---------- decisions: deferred commit with undo ---------- */
const live=(msg)=>{const l=document.getElementById("inbxLive");if(l){l.textContent="";setTimeout(()=>{l.textContent=msg},30)}};
const PEND={};
function commit(P){const it=P.it,a=ADP[it.src],t0=Date.now();delete I.pend[it.id];delete PEND[it.id];let r;
 try{
  if(it.sim)r={ok:true};
  else if(P.act==="approve")r=a.approve(it,P.arg.note);else if(P.act==="reject")r=a.reject(it,P.arg.note);else if(P.act==="delegate")r=a.delegate(it,P.arg.to,P.arg.note);
 }catch(e){r={ok:false,why:String(e&&e.message||e)}}
 r=r||{ok:false,why:"The owning module returned nothing"};
 if(r.ok===false){toast("Not recorded for "+it.title.slice(0,50)+": "+(r.why||r.error||"the owning module refused"),"warn");live("Could not record the decision on "+it.title+". "+(r.why||""));bump();refreshAll();return r}
 const rec={id:it.id,sid:it.sid,src:it.src,title:it.title,cat:it.cat,kind:it.kind,dec:P.act==="approve"?"Approved":P.act==="reject"?"Rejected":"Delegated to "+P.arg.to,note:P.arg.note||"",by:ME(),at:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),via:P.via||"inbox",sim:!!it.sim,amt:it.amt,ageH:it.ageH};
 I.hist.unshift(rec);I.decided++;if(it.kind==="approval"&&!it.sim)I.waitH.push(+it.ageH||0);if(it.sim)I.simDone=(I.simDone||0)+1;
 if(P.via&&/^policy/.test(P.via)){const p=pols().find(x=>"policy:"+x.id===P.via);if(p)p.runs++;I.autoN=(I.autoN||0)+1}
 audit("Inbox: "+rec.dec.toLowerCase(),it.title+(P.arg.note?" · "+P.arg.note:"")+(it.sim?" · simulated demo event":"")+(P.via&&P.via!=="inbox"?" · "+P.via:""));
 bump();refreshAll();return r}
function decide(id,act,arg,opt){const it=byId(id);if(!it)return{ok:false,why:"That item is no longer in your queue"};arg=arg||{};opt=opt||{};
 const a=ADP[it.src];const nxt=nextAfter(it.id);
 if(act==="snooze"){const h=arg.h||4;I.snz[it.id]=Date.now()+h*36e5;I.snoozed=(I.snoozed||0)+1;I.hist.unshift({id:it.id,title:it.title,cat:it.cat,kind:it.kind,dec:"Snoozed "+(h>=24?Math.round(h/24)+" d":h+" h"),by:ME(),at:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),via:"inbox"});audit("Inbox: snoozed",it.title+" · "+h+" h");
  advance(nxt,"Snoozed "+it.title);toast("Snoozed for "+(h>=24?Math.round(h/24)+" days":h+" hours")+". It comes back then.","info");bump();refreshAll();return{ok:true}}
 if(act==="approve"&&!it.can.approve)return{ok:false,why:it.blk||"This item cannot be approved from the inbox. Open it to decide."};
 if(act==="reject"&&!it.can.reject)return{ok:false,why:it.rejectWhy||"This module does not support rejecting from the inbox. Open it to decide."};
 if(act==="delegate"&&!it.can.delegate)return{ok:false,why:it.delegateWhy||"This item cannot be delegated from the inbox."};
 if((act==="reject"||(act==="approve"&&it.needNote))&&!String(arg.note||"").trim())return{ok:false,why:act==="reject"?"A reason is required to reject.":"You are deciding against the recommendation. Give a reason."};
 if(act==="delegate"&&!arg.to)return{ok:false,why:"Pick who to delegate to."};
 const P={it,act,arg,via:opt.via||"inbox",t0:Date.now(),grp:opt.grp};I.pend[it.id]=P;PEND[it.id]=P;P.tm=setTimeout(()=>commit(P),UNDO_MS);
 I.session.done++;
 const verb=act==="approve"?"Approved":act==="reject"?"Rejected":"Delegated to "+arg.to;
 if(!opt.quiet){advance(nxt,verb+" "+it.title);undoToast(verb,it,[P])}
 bump();if(!opt.quiet)refreshAll();return{ok:true,P}}
function undoOne(id){const P=PEND[id];if(!P)return false;clearTimeout(P.tm);delete I.pend[id];delete PEND[id];I.undone++;I.session.done=Math.max(0,I.session.done-1);audit("Inbox: undid decision",P.it.title);return true}
function flush(){Object.values(PEND).forEach(P=>{clearTimeout(P.tm);commit(P)})}
/* decide on several items; one Undo covers the group */
function decideMany(ids,act,note,via){const Ps=[];ids.forEach(id=>{const r=decide(id,act,{note:note||""},{quiet:true,via:via||"bulk",grp:1});if(r.ok)Ps.push(r.P)});
 if(Ps.length){advance(visible().find(x=>!ids.includes(x.id)),Ps.length+" decided");undoToast((act==="approve"?"Approved ":"Decided ")+Ps.length+" items",null,Ps)}bump();refreshAll();return Ps.length}
/* bulk safe rules */
function bulkCheck(ids){const ok=[],ex=[];const list=collect();ids.forEach(id=>{const it=list.find(x=>x.id===id);if(!it)return;let w="";
  if(it.kind!=="approval")w="Not an approval";else if(!it.can.approve)w=it.blk||"This module does not approve from the inbox";else if(it.risk!=="low")w=(it.risk==="high"?"High":"Medium")+" risk needs a person's eyes";
  else if(it.amt!=null&&it.amt>I.bulkMax)w=money0(it.amt)+" is over your bulk limit of "+money0(I.bulkMax);else if(it.rec&&it.rec!=="approve")w="The AI recommends "+it.rec+", not approval";else if(it.ai&&it.ai.conf<.85)w="AI confidence is "+Math.round(it.ai.conf*100)+"%, under 85%";
  else if(it.needNote)w="Deciding here goes against the recommendation";else if(it.req===ME())w="You raised it, so you cannot approve it";
  (w?ex.push({it,why:w}):ok.push(it))});return{ok,ex}}
