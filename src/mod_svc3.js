(function(){
/* ===== Round 14: Requested-for (who is this for?), delegate and policy checks, and Order guides (multi-part orders) =====
   Part A: window.RF  - the "Who is this for?" step used by every catalog item and every order guide.
   Part B: window.OGX - order guides: guide, parts, dependencies, conditions driven by answers, orders, critical path, swimlanes, fulfiller queues.
   Bridge: window.SVC3B is exported by mod_svc.js (catalog and request internals). */
const B=window.SVC3B;if(!B){console.error("svc3: bridge from mod_svc.js missing");return}
const E=esc,ME=B.ME,NOW=B.NOW,DAY=864e5;
const MD=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const fd=t=>{const d=new Date(t);return MD[d.getUTCMonth()]+" "+d.getUTCDate()};
const fdw=t=>{const d=new Date(t);return DN[d.getUTCDay()]+" "+MD[d.getUTCMonth()]+" "+d.getUTCDate()};
const iso=t=>new Date(t).toISOString().slice(0,10);
const msOf=s=>{const m=/^(\d+)-(\d+)-(\d+)/.exec(s||"");return m?Date.UTC(+m[1],+m[2]-1,+m[3],9,0):null};
const uniq=a=>[...new Set(a)];
const r1=x=>Math.round(x*10)/10;
const bd=n=>r1(n)+" business day"+(r1(n)===1?"":"s");
const S3=S.svc3=Object.assign({kind:null,kindItem:null,who:"",nh:{name:"",start:"2026-10-26",mgr:"",loc:"Parker HQ",worker:"Employee"},team:[],deliver:"",contact:"",q:"",sel:"ORD-1041",gid:"onboarding",ans:{},fq:"hr",fstate:"open",tab:0,wiz:false,seq:1060,pq:""},S.svc3||{});
const isWk=t=>{const w=new Date(t).getUTCDay();return w===0||w===6};
function addBiz(t,d){let x=t,left=Math.floor(d+1e-9);while(left>0){x+=DAY;if(!isWk(x))left--}const fr=d-Math.floor(d+1e-9);if(fr>1e-6)x+=fr*DAY;while(isWk(x))x+=DAY;return x}
function bdiff(a,b){let n=0,x=a;if(b<=a)return 0;while(x+DAY<=b){x+=DAY;if(!isWk(x))n++}return n+(b-x)/DAY}
const human=n=>{const r=who(n);return r&&r.kind!=="ai"};
const ppl=()=>DIR.filter(d=>d.kind==="human"||d.kind==="contractor");

/* ================= PART A: requested for ================= */
const KINDS=[["self","Myself","M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6"],["other","Someone else","M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 8v6M14 11h6"],["newhire","A new hire","M12 3l2 5 5 .5-4 3.5 1.3 5L12 14.5 7.7 17 9 12 5 8.5 10 8zM5 21h14"],["team","A team or group","M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 7 1 7 5"]];
const DEFK={onboarding:"newhire",offboarding:"other",move:"other",project:"self",av:"self",facevent:"team",vendor:"self"};
const MGRONLY=["onboarding","offboarding","move"];/* items only a manager, the People team or a delegate may raise for someone else */
const LEADS={"Priya Shah":["Elise Park","Dmitri Volkov","Hana Sato","Greg Nolan"]};/* people the requester leads day to day */
const DELEG=[{by:"Priya Shah",for:"Maya Ortiz",scope:"All service requests",until:"Dec 31, 2026"},{by:"Priya Shah",for:"Dev Rao",scope:"Hardware and software",until:"Nov 30, 2026"}];
const LOCS=["Parker HQ","Hybrid (HQ and home)","Remote (US)","Remote EU (Prague)"];
function directOf(n){const o=[];DIR.forEach(d=>{if(d.name===n)return;if(d.mgr===n||B.CSP[d.name]===n)o.push(d.name)});(LEADS[n]||[]).forEach(x=>{if(!o.includes(x)&&who(x))o.push(x)});return o}
function reportsOf(n){const seen=new Set(),q=directOf(n);while(q.length){const x=q.shift();if(seen.has(x)||x===n)continue;seen.add(x);directOf(x).forEach(y=>q.push(y))}return [...seen]}
const isMgr=n=>directOf(n).length>0;
const delegFor=p=>DELEG.find(d=>d.by===ME&&d.for===p);
function polOne(item,kind,p,nh){/* policy check for one beneficiary */
 if(kind==="self"||p===ME)return{ok:true,rel:"self",mgr:null,mgrAp:"none",lvl:"good",msg:"Ordering for yourself. Normal approvals apply."};
 if(kind==="newhire"){const m=nh&&nh.mgr;if(!nh||!nh.name)return{ok:false,rel:"newhire",mgr:m,mgrAp:"none",lvl:"warn",msg:"Enter the new hire's name, start date and hiring manager."};
  if(m===ME)return{ok:true,rel:"newhire",mgr:m,mgrAp:"skipped",lvl:"good",msg:"You are the hiring manager, so manager approval is skipped."};
  if(delegFor(m))return{ok:true,rel:"delegate",mgr:m,mgrAp:"skipped",lvl:"good",msg:"You are a delegate for "+m+", so manager approval is skipped and the delegation is logged."};
  if(MGRONLY.includes(item.id))return{ok:false,rel:"newhire-other",mgr:m,mgrAp:"required",lvl:"bad",msg:"Only the hiring manager, the People team or a delegate can start this for a new hire. Ask "+(m||"the hiring manager")+" to raise it, or choose yourself as the hiring manager."};
  return{ok:true,rel:"newhire-other",mgr:m,mgrAp:"required",lvl:"warn",msg:"You are not the hiring manager. "+(m||"The hiring manager")+" is asked to approve."}}
 const rec=who(p);if(!rec)return{ok:false,rel:"other",mgr:null,mgrAp:"none",lvl:"warn",msg:"Choose a person."};
 if(rec.kind==="ai")return{ok:false,rel:"other",mgr:null,mgrAp:"none",lvl:"bad",msg:"AI agents are provisioned by AI governance and cannot be requested for here."};
 const rep=reportsOf(ME);if(rep.includes(p)){const direct=directOf(ME).includes(p);return{ok:true,rel:"report",mgr:ME,mgrAp:"skipped",lvl:"good",msg:"You are their "+(direct?"manager":"skip-level manager")+". Manager approval is skipped."}}
 const dg=delegFor(p);if(dg)return{ok:true,rel:"delegate",mgr:B.MGRS2(p),mgrAp:"skipped",lvl:"good",msg:"You are a delegate for "+p+" ("+dg.scope+", until "+dg.until+"). Manager approval is skipped and the delegation is logged."};
 if(B.LEVEL(p)==="Executive")return{ok:false,rel:"other",mgr:B.MGRS2(p),mgrAp:"required",lvl:"bad",msg:"Requests for executives must come from their manager or a delegate on file."};
 if(MGRONLY.includes(item.id))return{ok:false,rel:"other",mgr:B.MGRS2(p),mgrAp:"required",lvl:"bad",msg:"Only a manager, the People team or a delegate can raise this for "+p+". Ask "+B.MGRS2(p)+"."};
 return{ok:true,rel:"other",mgr:B.MGRS2(p),mgrAp:"required",lvl:"warn",msg:"You are not their manager. "+B.MGRS2(p)+" is asked to approve before work starts."}}
function polAll(item){/* policy for the current selection (worst case over a team) */
 const k=S3.kind||"self";if(k==="team"){const rs=(S3.team.length?S3.team:[]).map(p=>polOne(item,"other",p));if(!rs.length)return{ok:false,rel:"team",mgr:null,mgrAp:"none",lvl:"warn",msg:"Add at least one person."};
  const bad=rs.find(r=>!r.ok);if(bad)return Object.assign({},bad,{msg:bad.msg+" ("+S3.team[rs.indexOf(bad)]+")"});const req=rs.filter(r=>r.mgrAp==="required").length;
  return{ok:true,rel:req?"other":rs[0].rel,mgr:null,mgrAp:req?"required":"skipped",lvl:req?"warn":"good",msg:S3.team.length+" requests, one per person. "+(req?req+" need the person's manager to approve; the rest skip manager approval.":"Manager approval is skipped for all.")}}
 if(k==="other")return polOne(item,"other",S3.who);
 if(k==="newhire")return polOne(item,"newhire",null,S3.nh);
 return polOne(item,"self",ME)}
function forName(){const k=S3.kind||"self";return k==="self"?ME:k==="other"?(S3.who||ME):k==="newhire"?(S3.nh.name||"New hire"):(S3.team[0]||ME)}
function defKind(it){return DEFK[it.id]||"self"}
function rfPrep(it,kinds){if(S3.kindItem!==it.id){S3.kindItem=it.id;S3.kind=defKind(it);if(kinds&&!kinds.includes(S3.kind))S3.kind=kinds[0];S3.deliver="";S3.contact=""}
 if(kinds&&!kinds.includes(S3.kind))S3.kind=kinds[0];
 const fw=forName();B.V.pFor=fw;const P=polAll(it);B.setREL({by:ME,fw,rel:P.rel,mgr:P.mgr});
 if(S3.kind==="newhire"&&it.id==="onboarding"){const v=B.fvOf("p:onboarding",it);v.name=S3.nh.name;v.start=S3.nh.start;if(S3.nh.mgr)v.mgr=S3.nh.mgr;v.worker=S3.nh.worker}
 return P}
function pathHTML(it,P){/* approval path: requester -> manager -> item approvals -> fulfillment */
 const fw=forName();let ap=[];try{ap=B.apprFor(it,B.fvOf("p:"+it.id,it),fw,ME).list}catch(e){}
 const mg=ap.find(a=>a.rule==="manager"),others=ap.filter(a=>a.trig&&!a.dup&&a.rule!=="manager");
 let mgrNode;if(P.mgrAp==="skipped")mgrNode=`<span class="pill good">Manager approval skipped</span><small class="muted">${E(P.rel==="delegate"?"Delegate on file":"You manage this person")}</small>`;
 else if(P.mgrAp==="required"||(mg&&mg.trig))mgrNode=`<span class="pill warn">Manager approval required</span><small class="muted">${P.mgr?B.whx(P.mgr):(mg&&mg.who?B.whx(mg.who):"")}</small>`;
 else mgrNode=`<span class="pill mute">Manager approval not part of this item</span><small class="muted">Manager is told</small>`;
 const nodes=[[`<b>You</b><small class="muted">Requested by</small>`,"info"],[mgrNode,""],[others.length?`<span class="pill info">${others.length} approval${others.length>1?"s":""}</span><small class="muted">${others.slice(0,2).map(a=>E(a.n)).join(", ")}${others.length>2?" and "+(others.length-2)+" more":""}</small>`:`<span class="pill good">No other approvals</span><small class="muted">Goes straight to the team</small>`,""],[`<b>${E((B.CAT.find(c=>c.id===it.id)||it).off||"Fulfillment")}</b><small class="muted">Team queue</small>`,""]];
 return `<div class="svc3-path" role="list" aria-label="Approval path">${nodes.map((n,i)=>`<div class="svc3-pn" role="listitem">${n[0]}</div>${i<nodes.length-1?'<i class="svc3-pa" aria-hidden="true"></i>':""}`).join("")}</div>`}
const personOpt=()=>`<datalist id="svc3_dl">${ppl().slice(0,500).map(d=>`<option value="${E(d.name)}">`).join("")}</datalist>`;
function rfPanel(it,o){o=o||{};const kinds=o.kinds||KINDS.map(k=>k[0]);const P=rfPrep(it,o.kinds);const k=S3.kind,fw=forName();
 const seg=KINDS.filter(x=>kinds.includes(x[0])).map(x=>`<button type="button" class="svc3-kind" data-svc3="kind|${x[0]}" aria-pressed="${k===x[0]}"><i>${IC(x[2])}</i><b>${x[1]}</b></button>`).join("");
 const reps=reportsOf(ME);let body="";
 const pickList=window.PICK?`<div class="svc3-pick">${PICK.person({id:"svc3:"+k,me:ME,multi:k==="team",value:k==="team"?S3.team.slice():(S3.who||""),label:k==="team"?"Team members":"Person",placeholder:k==="team"?"Add people to the team":"Choose a person",kinds:["human"],exclude:[ME],onPick:v=>{if(k==="team"){S3.team=Array.isArray(v)?v:[v]}else{S3.kind="other";S3.who=v}S3.q="";sv3()}})}</div>`:`<div class="svc3-pick"><div class="row svc3-reps"><span class="muted small">Your reports</span>${directOf(ME).slice(0,8).map(n=>`<button type="button" class="chip" data-svc3="pick|${E(n)}" aria-pressed="${S3.kind==="other"?S3.who===n:S3.team.includes(n)}">${B.whx(n).replace(/<button[^>]*>|<\/button>/g,"")}</button>`).join("")||'<span class="muted small">No direct reports on file</span>'}</div>
  <form class="row svc3-find" data-svc3-form="find"><input class="txtin" list="svc3_dl" data-svc3-q placeholder="Search the directory by name" aria-label="Search the directory" value="${E(S3.q)}" autocomplete="off"><button class="btn" type="submit">${k==="team"?"Add":"Choose"}</button>${personOpt()}</form></div>`;
 const delivery=`<div class="svc3-grid2"><label class="svc3-fld"><span>Deliver to</span><select class="fin" data-svc3-f="deliver"><option value="">Their usual location${S3.kind==="other"&&S3.who&&who(S3.who)?" ("+E(who(S3.who).loc||"HQ")+")":""}</option>${["My desk","Their home (remote)","Parker HQ front desk","Another address (add in the form)"].map(x=>`<option ${S3.deliver===x?"selected":""}>${x}</option>`).join("")}</select></label>
  <label class="svc3-fld"><span>Contact for delivery</span><input class="txtin" data-svc3-f="contact" value="${E(S3.contact)}" placeholder="${S3.kind==="other"&&who(S3.who)?E(who(S3.who).email||""):"Name, phone or email"}" aria-label="Delivery contact"></label></div>`;
 if(k==="other"){const rec=who(S3.who);body=pickList+(S3.who?`<div class="svc3-sel">${B.whx(S3.who)}${rec?`<span class="pill mute">${E(rec.role||"")}</span><span class="pill mute">${E(rec.team||"")}</span><span class="pill mute">${E(B.WORKER(S3.who))}</span><span class="pill mute">${E(rec.loc||"")}</span><span class="muted small">Manager: ${E(B.MGRS2(S3.who))}</span>`:""}</div>`:'<p class="muted small">Pick a person to see whether you can order for them and who has to approve.</p>')+(S3.who?delivery:"")}
 else if(k==="team"){body=pickList+`<div class="svc3-team">${S3.team.map(n=>`<span class="svc3-tm">${B.whx(n).replace(/<button[^>]*>|<\/button>/g,"")}<button type="button" class="svc3-x" data-svc3="unpick|${E(n)}" aria-label="Remove ${E(n)}">x</button></span>`).join("")||'<span class="muted small">No one added yet</span>'}</div>${S3.team.length?delivery:""}`}
 else if(k==="newhire"){const n=S3.nh;body=`<p class="muted small">Not in the directory yet. We create the record from these answers and notify the hiring manager.</p><div class="svc3-grid2"><label class="svc3-fld"><span>Full name</span><input class="txtin" data-svc3-f="nh.name" value="${E(n.name)}" placeholder="First and last name" aria-label="New hire name"></label>
  <label class="svc3-fld"><span>Start date</span><input class="txtin" type="date" data-svc3-f="nh.start" value="${E(n.start)}" aria-label="Start date"></label>
  <label class="svc3-fld"><span>Hiring manager</span><select class="fin" data-svc3-f="nh.mgr" aria-label="Hiring manager"><option value="">Choose a manager</option>${uniq([ME].concat(DIR.filter(d=>d.kind==="human"&&isMgr(d.name)).map(d=>d.name))).slice(0,80).map(x=>`<option ${n.mgr===x?"selected":""} value="${E(x)}">${E(x)}${x===ME?" (you)":""}</option>`).join("")}</select></label>
  <label class="svc3-fld"><span>Work location</span><select class="fin" data-svc3-f="nh.loc" aria-label="Work location">${LOCS.map(x=>`<option ${n.loc===x?"selected":""}>${x}</option>`).join("")}</select></label></div>
  <div class="row"><span class="muted small">Worker type</span>${["Employee","Contractor"].map(x=>`<button type="button" class="chip" data-svc3="nhw|${x}" aria-pressed="${n.worker===x}">${x}</button>`).join("")}</div>`}
 else body=`<p class="muted small">Delivery follows your usual location. Approvals follow you.</p>`;
 const cls=P.lvl==="bad"?"bad":P.lvl==="warn"?"warn":"good";
 return `<section class="svc3-for glass" data-svc3-for aria-label="Who is this for">
  <div class="svc3-forhead"><div><h3>Who is this for?</h3><span class="muted small">Requested by ${B.whx(ME)}${isMgr(ME)?` <span class="pill mute" title="You manage ${reports_n()} people">Manager</span>`:""}</span></div>${o.hint?`<span class="muted small">${E(o.hint)}</span>`:""}</div>
  <div class="svc3-kinds" role="group" aria-label="Request for">${seg}</div>${body}
  <div class="svc3-pol ${cls}" role="status"><span class="pill ${cls}">${P.ok?"Allowed":"Not allowed"}</span><span>${E(P.msg)}</span></div>
  ${P.ok||P.lvl==="warn"?pathHTML(it,P):""}</section>`}
const reports_n=()=>reportsOf(ME).length;
function rfOk(it){const P=polAll(it);if(!P.ok){toast(P.msg,"warn");return false}
 if(S3.kind==="other"&&!S3.who){toast("Choose who this is for","warn");return false}
 if(S3.kind==="newhire"&&(!S3.nh.name||!S3.nh.start||!S3.nh.mgr)){toast("Enter the new hire's name, start date and hiring manager","warn");return false}
 return true}
function rfCreate(it,vals,fw){
 const targets=S3.kind==="team"?S3.team.slice():[fw];let first=null,reqNo=null;
 targets.forEach(t=>{const kind=S3.kind==="team"?"other":S3.kind;const P=polOne(it,kind,t,S3.nh);B.setREL({by:ME,fw:t,rel:P.rel,mgr:P.mgr});
  const v=Object.assign({},vals);if(S3.kind==="team"&&it.vars.some(x=>x.k==="who"))v.who=t;
  const extra={rel:P.rel,fk:S3.kind,deliver:S3.deliver||(S3.kind==="self"?"":"Their usual location"),contact:S3.contact||"",mgrApproval:P.mgrAp,relMgr:P.mgr,team:S3.kind==="team"?S3.team.slice():null,nh:S3.kind==="newhire"?Object.assign({},S3.nh):null};if(reqNo)extra.req=reqNo;
  const r=B.createReq(it,v,ME,t,extra);reqNo=r.req;if(!first)first=r;
  B.log(r,"Requested by "+ME+" for "+t+" ("+(B.RELN[P.rel]||P.rel)+"). Manager approval: "+({skipped:"skipped",required:"required",none:"not applicable"}[P.mgrAp]));
  if(t!==ME&&human(t)){try{B.NOTI("e12",t,r)}catch(e){}}if(P.mgr&&P.mgr!==ME&&P.mgrAp!=="none"){try{B.NOTI("e12",P.mgr,r)}catch(e){}}
  audit("requested for another person",r.id+" by "+ME+" for "+t+" ["+P.rel+"] "+it.n)});
 if(targets.length>1)toast(targets.length+" requests created for the team under "+reqNo,"good");
 return first}
window.RF={prep:it=>{rfPrep(it)},panel:rfPanel,ok:rfOk,create:rfCreate,policy:polAll,polOne,reportsOf,directOf,delegations:()=>DELEG.slice(),state:()=>S3,forName};
const sv3=()=>{try{render()}catch(e){}};
document.addEventListener("click",e=>{const t=e.target.closest("[data-svc3]");if(!t)return;const a=String(t.getAttribute("data-svc3")).split("|"),x=a[0];
 if(x==="kind"){S3.kind=a[1];if(a[1]==="team"&&!S3.team.length&&S3.who)S3.team=[S3.who];sv3()}
 else if(x==="pick"){if(S3.kind==="team"){if(!S3.team.includes(a[1]))S3.team.push(a[1]);else S3.team=S3.team.filter(n=>n!==a[1])}else{S3.kind="other";S3.who=a[1]}S3.q="";sv3()}
 else if(x==="unpick"){S3.team=S3.team.filter(n=>n!==a[1]);sv3()}
 else if(x==="nhw"){S3.nh.worker=a[1];sv3()}});
document.addEventListener("submit",e=>{const f=e.target.closest("[data-svc3-form='find']");if(!f)return;e.preventDefault();const v=(f.querySelector("[data-svc3-q]").value||"").trim().toLowerCase();if(!v)return;
 const r=ppl().find(d=>d.name.toLowerCase()===v)||ppl().find(d=>d.name.toLowerCase().includes(v));if(!r){toast("No one in the directory matches that name","warn");return}
 if(S3.kind==="team"){if(!S3.team.includes(r.name))S3.team.push(r.name)}else{S3.kind="other";S3.who=r.name}S3.q="";sv3()});
document.addEventListener("change",e=>{const t=e.target.closest("[data-svc3-f]");if(!t)return;const k=t.getAttribute("data-svc3-f"),v=t.value;
 if(k.startsWith("nh.")){S3.nh[k.slice(3)]=v;if(S3.kindItem==="onboarding"||S3.kindItem)sv3()}else{S3[k]=v}});

/* ================= PART B: order guides ================= */
const LANES={
 hr:{n:"HR",g:"People team",c:"--p1",own:"Joanna Pierce",code:"HRC"},
 it:{n:"IT",g:"Endpoint team",c:"--p4",own:"Sam Patel",code:"ITK"},
 mgr:{n:"Manager",g:"Hiring or line manager",c:"--w1",own:"@mgr",code:"MGT"},
 comp:{n:"Compliance",g:"Legal and compliance",c:"--u3",own:"Theo Marlowe",code:"CPT"},
 pay:{n:"Payroll",g:"Payroll (Finance)",c:"--s3",own:"Avery Chen",code:"PRT"},
 fac:{n:"Facilities",g:"Facilities",c:"--p5",own:"Nia Brooks",code:"FCT"},
 log:{n:"Shipping",g:"Logistics (Service desk)",c:"--e4",own:"Tom Becker",code:"SHT"},
 pmo:{n:"PMO",g:"PMO",c:"--p1",own:"Maya Ortiz",code:"PMT"},
 fin:{n:"Finance",g:"Finance",c:"--s3",own:"Avery Chen",code:"FNT"},
 sec:{n:"Security",g:"Security",c:"--e4",own:"Rina Okafor",code:"SCT"},
 proc:{n:"Procurement",g:"Procurement",c:"--w1",own:"Avery Chen",code:"PUT"},
 ev:{n:"Events",g:"Facilities events",c:"--u3",own:"Nia Brooks",code:"EVT"}};
const LSTEPS={hr:["Confirm the person and employment terms","Create or update the employment record","Send paperwork and collect signatures","Release the record to identity and payroll"],
 it:["Create the identity and mailbox","Assign groups and licenses for the role","Prepare and enroll the device","Hand over or ship, confirm sign-in"],
 mgr:["Review the plan template","Name a buddy and schedule day one","Set 30, 60 and 90 day goals","Confirm readiness"],
 comp:["Start the required checks or training","Collect consent and evidence","Review results","Record clearance or exceptions"],
 pay:["Confirm the record and pay terms","Set up pay, tax and benefits","Validate the first cycle","Close and notify"],
 fac:["Confirm location and dates","Assign desk, badge and parking","Prepare the space","Confirm ready"],
 log:["Pack and label equipment","Hand to carrier with tracking","Confirm delivery","Close and log"],
 pmo:["Review the request","Register the project and charter","Assign a PMO partner","Open the project record"],
 fin:["Confirm the funding source","Create the cost center or budget code","Check limits","Confirm to requester"],
 sec:["Classify the data","Run the review checklist","Record findings and conditions","Approve or return"],
 proc:["Check the vendor register","Run due diligence","Raise the purchase order","Confirm contract on file"],
 ev:["Confirm date, headcount and needs","Book vendors","Confirm the run sheet","Close and review cost"]};
const P=(id,n,lane,dur,deps,when,o)=>Object.assign({id,n,lane,dur,deps:deps||[],when:when||"",sla:Math.ceil(dur*1.5)},o||{});
const Q=(k,l,t,o)=>Object.assign({k,l,t},o||{});
const REMOTE=a=>/Remote/.test(a.loc||"");
const GUIDES=[
{id:"onboarding",item:"onboarding",n:"New hire onboarding",kinds:["newhire","team"],need:"start",needL:"Start date",
 blurb:"One order that fans out to HR, IT, the hiring manager, Compliance, Payroll and Facilities (or Shipping for remote hires), each with its own process, owner and SLA.",
 q:[Q("role","Role type","chips",{o:["Standard","Developer","Finance","Standards editor"],d:"Standard"}),Q("device","Device","chips",{o:["Standard laptop","Developer laptop","MacBook"],d:"Standard laptop"}),Q("access","System access","chips",{o:["Standard","Finance systems","Standards Platform admin"],d:"Standard"}),Q("clear","Needs a security clearance check","toggle",{d:false,help:"Adds time to the Compliance part"})],
 fromFor:true,derive:a=>{a.remote=REMOTE(a);a.onsite=!a.remote;a.eu=/EU/.test(a.loc||"")},
 parts:[P("hr","Employment record and offer paperwork","hr",1,[],"",{ctx:["worker","start"]}),
  P("comp","Background check and required training","comp",3,["hr"],"",{ctx:["clear","worker"],durFn:a=>a.clear?5:3}),
  P("pay","Payroll and benefits enrollment","pay",1,["hr","comp"],"worker=Employee",{ctx:["worker"]}),
  P("it","Laptop, accounts and access","it",3,["hr"],"",{item:"laptop",ctx:["device","access","loc"],durFn:a=>a.access==="Finance systems"?4:a.access==="Standards Platform admin"?4:3}),
  P("ship","Ship equipment to the new hire's home","log",2,["it"],"remote",{ctx:["loc"]}),
  P("fac","Desk, badge and parking","fac",2,["hr"],"onsite",{ctx:["loc"]}),
  P("mgr","Day-one plan, buddy and 30-60-90 goals","mgr",2,["hr"],"",{ctx:["role","start"]})]},
{id:"offboarding",item:"offboarding",n:"Employee offboarding",kinds:["other","self","team"],need:"last",needL:"Last working day",
 blurb:"Exit paperwork, access removal, device recovery, handover and final pay, coordinated so nothing is left active after the last day.",
 q:[Q("last","Last working day","date",{d:"2026-10-16"}),Q("reason","Reason","chips",{o:["Resignation","Termination","Retirement","Contract end"],d:"Resignation"}),Q("loc","Work location","chips",{o:["Parker HQ","Hybrid (HQ and home)","Remote (US)"],d:"Parker HQ"}),Q("access","Highest access held","chips",{o:["Standard","Privileged","Finance systems"],d:"Standard"}),Q("legal","Legal hold applies","toggle",{d:false}),Q("reports","Has direct reports","toggle",{d:false})],
 derive:a=>{a.remote=REMOTE(a);a.onsite=!a.remote},
 parts:[P("hr","Exit paperwork and employment record","hr",1,[],"",{ctx:["reason","last"]}),
  P("mgr","Work handover and direct report reassignment","mgr",3,[],"",{ctx:["reports"],durFn:a=>a.reports?4:3}),
  P("ship","Prepaid return shipping for equipment","log",2,[],"remote",{ctx:["loc"]}),
  P("it","Revoke access and recover device","it",2,["hr","ship"],"",{ctx:["access","loc"],durFn:a=>a.access==="Privileged"?3:2}),
  P("fac","Return badge, desk and parking","fac",1,["hr"],"onsite",{ctx:["loc"]}),
  P("pay","Final pay, PTO payout and benefits end","pay",2,["hr"],"",{ctx:["reason"]}),
  P("comp","Compliance exit review and legal hold","comp",2,["it"],"legal or access in Privileged|Finance systems",{ctx:["legal","access"]})]},
{id:"move",item:"move",n:"Role or location change",kinds:["other","self","team"],need:"eff",needL:"Effective date",
 blurb:"A move between roles, teams or places: record change, pay and tax, access, desk, re-certification and a transition plan, only the parts the change needs.",
 q:[Q("eff","Effective date","date",{d:"2026-11-02"}),Q("type","What is changing","chips",{o:["Role change","Location change","Both"],d:"Role change"}),Q("newloc","New work location","chips",{o:["Parker HQ","Hybrid (HQ and home)","Remote (US)","Remote EU (Prague)"],d:"Parker HQ",show:"type in Location change|Both"}),Q("pay","Pay changes","toggle",{d:false})],
 derive:a=>{a.roleChg=a.type==="Role change"||a.type==="Both";a.locChg=a.type==="Location change"||a.type==="Both";a.eu=!!a.locChg&&/EU/.test(a.newloc||"");a.newonsite=!!a.locChg&&/Parker|Hybrid/.test(a.newloc||"")},
 parts:[P("hr","Update employment record and title","hr",1,[],"",{ctx:["type","eff"]}),
  P("pay","Compensation and tax update","pay",2,["hr"],"pay or eu",{ctx:["pay","newloc"]}),
  P("it","Access, group and device changes","it",2,["hr"],"roleChg or eu",{ctx:["type","newloc"]}),
  P("fac","Desk move and new badge","fac",2,["hr"],"newonsite",{ctx:["newloc"]}),
  P("comp","Re-certification and data residency review","comp",3,["hr"],"eu or roleChg",{ctx:["type","newloc"],durFn:a=>a.eu?5:3}),
  P("mgr","Transition plan with the new manager","mgr",2,[],"",{ctx:["type","eff"]})]},
{id:"project",item:"project",n:"New project kickoff",kinds:["self","other"],need:"start",needL:"Kickoff date",
 blurb:"Register a project and stand up what it needs: charter, budget code, workspace, security review and vendor onboarding when a supplier is involved.",
 q:[Q("pname","Project name","text",{d:"",ph:"For example, Standards Portal search upgrade"}),Q("start","Kickoff date","date",{d:"2026-10-26"}),Q("budget","Budget (USD)","number",{d:50000}),Q("vendor","A vendor is involved","toggle",{d:false}),Q("sens","Data sensitivity","chips",{o:["Low","Moderate","High"],d:"Low"}),Q("workspace","Needs a workspace (Teams, SharePoint, repository)","toggle",{d:true})],
 parts:[P("pmo","Register the project and charter","pmo",2,[],"",{ctx:["pname","budget"]}),
  P("fin","Cost center and budget code","fin",2,["pmo"],"",{ctx:["budget"],durFn:a=>+a.budget>250000?3:2}),
  P("it","Workspace: Teams, SharePoint and repository","it",1,["pmo"],"workspace",{ctx:["pname"]}),
  P("sec","Security and privacy review","sec",4,["pmo"],"sens in Moderate|High",{ctx:["sens","vendor"]}),
  P("proc","Vendor onboarding and purchase order","proc",5,["fin","sec"],"vendor",{ctx:["vendor","budget"]})]},
{id:"facevent",item:"facevent",n:"Office move or event",kinds:["team","self"],need:"date",needL:"Date",
 blurb:"Space and layout, AV and network, catering and vendors, visitor badges and budget for an office move or an event.",
 q:[Q("kind","What is it","chips",{o:["Office move","Event"],d:"Event"}),Q("date","Date","date",{d:"2026-11-05"}),Q("headcount","People","number",{d:30}),Q("guests","External guests attend","toggle",{d:false}),Q("catering","Catering needed","toggle",{d:false}),Q("av","AV and network support","toggle",{d:true})],
 parts:[P("fac","Space, layout and furniture","fac",3,[],"",{ctx:["kind","headcount"]}),
  P("it","AV, network and device moves","it",2,["fac"],"av or kind=Office move",{ctx:["kind","av"]}),
  P("ev","Catering and vendors","ev",3,[],"catering",{ctx:["headcount","catering"]}),
  P("sec","Visitor registration and badges","sec",2,["fac"],"guests",{ctx:["guests"]}),
  P("fin","Budget approval and purchase orders","fin",2,[],"headcount>50 or catering",{ctx:["headcount","catering"]})]}];
const GD=id=>GUIDES.find(g=>g.id===id);
const guideOf=itemId=>GUIDES.find(g=>g.item===itemId);
/* a conditional-expression language that is readable and editable: k=v, k!=v, k>n, k in a|b, k (true), joined with and / or */
function cond(s,a){if(!s)return true;return s.split(/\s+or\s+/).some(g=>g.split(/\s+and\s+/).every(c=>{c=c.trim();let m;
 if((m=/^(\w+)\s*(>=|<=|!=|=|>|<)\s*(.+)$/.exec(c))){const x=a[m[1]],y=m[3].trim();switch(m[2]){case"=":return String(x)===y;case"!=":return String(x)!==y;case">":return +x>+y;case"<":return +x<+y;case">=":return +x>=+y;default:return +x<=+y}}
 if((m=/^(\w+)\s+in\s+(.+)$/.exec(c)))return m[2].split("|").map(z=>z.trim()).includes(String(a[m[1]]));
 return !!a[c]&&a[c]!=="No"}))}
const KEYL={remote:"Work location is remote",onsite:"Work location is on site",eu:"Location is in the EU",worker:"Worker type",roleChg:"Role changes",locChg:"Location changes",newonsite:"New location is on site",legal:"Legal hold",guests:"External guests",catering:"Catering needed",av:"AV needed",vendor:"A vendor is involved",workspace:"Needs a workspace",pay:"Pay changes"};
function ctext(s,g){if(!s)return"Always";const lab=k=>(g.q.find(q=>q.k===k)||{}).l||KEYL[k]||k;
 return s.replace(/\b([A-Za-z]\w*)\s*(>=|<=|!=|=|>|<)\s*([^\s]+(?:\s+(?!and\b|or\b)[^\s]+)*)/g,(m,k,op,v)=>lab(k)+" "+({"=":"is","!=":"is not",">":"is over","<":"is under",">=":"is at least","<=":"is at most"}[op])+" "+v)
  .replace(/\b([A-Za-z]\w*)\s+in\s+([^\s]+(?:\s+(?!and\b|or\b)[^\s]+)*)/g,(m,k,v)=>lab(k)+" is "+v.split("|").join(" or ")).replace(/\b(remote|onsite|eu|legal|guests|catering|av|vendor|workspace|pay|roleChg|locChg|newonsite)\b/g,m=>(KEYL[m]||m)).replace(/\band\b/g," and ").replace(/\bor\b/g," or ")}
function ansOf(g,raw){const a=Object.assign({},raw||{});g.q.forEach(q=>{if(a[q.k]===undefined)a[q.k]=q.d===undefined?"":q.d});if(g.derive)g.derive(a);return a}
const partsOf=(g,a)=>g.parts.filter(p=>cond(p.when,a));
const durOf=(p,a)=>p.durFn?p.durFn(a):p.dur;
function topo(inc){const ids=new Set(inc.map(p=>p.id)),out=[],done=new Set();let g=0;while(out.length<inc.length&&g++<50){inc.forEach(p=>{if(done.has(p.id))return;if((p.deps||[]).filter(d=>ids.has(d)).every(d=>done.has(d))){out.push(p);done.add(p.id)}})}return out}
const ORD=[];let genOn=null;
function laneName(p,o){const l=LANES[p.lane];return l.n}
function ownerOf(p,o){const l=LANES[p.lane];if(l.own==="@mgr")return (o&&o.ans&&o.ans.mgr)||(o&&o.nhMgr)||(o&&o.by)||ME;return l.own}
/* the planning engine: baseline schedule, forecast from actual progress, critical path (forecast slack), ETA */
function plan(o){const g=GD(o.g),a=o.A||(o.A=ansOf(g,o.ans)),inc=topo(partsOf(g,a)),m={};inc.forEach(p=>m[p.id]=p);
 const nowOff=bdiff(o.created,NOW),R={},gp=!!(o.gate&&o.gate.st==="pending"),g0=gp?Math.max(1,nowOff+1):((o.gate&&o.gate.off)||0);
 inc.forEach(p=>{const ds=(p.deps||[]).filter(d=>m[d]),du=durOf(p,a),es=ds.length?Math.max(...ds.map(d=>R[d].pef)):g0;R[p.id]={p,du,deps:ds,pes:es,pef:es+du}});
 const tot=inc.length?Math.max(...inc.map(p=>R[p.id].pef)):0;
 inc.forEach(p=>{const r=R[p.id],ac=(o.act&&o.act[p.id])||{};r.ac=ac;const dep=r.deps.length?Math.max(...r.deps.map(d=>R[d].fef)):g0,depsDone=!gp&&r.deps.every(d=>R[d].state==="done");
  if(ac.e!=null){r.fs=ac.s!=null?ac.s:dep;r.fef=ac.e;r.state="done";r.prog=1}
  else{const rem=r.du*(1-(ac.prog||0)),hold=ac.blocked?(ac.blocked.hold||1.5):0;r.prog=ac.prog||0;
   if(ac.s!=null){r.fs=ac.s;r.fef=Math.max(nowOff,ac.s)+rem+hold;r.state=ac.blocked?"blocked":depsDone?"active":"waiting"}
   else{r.fs=Math.max(dep,nowOff);r.fef=r.fs+r.du+hold;r.state=ac.blocked?"blocked":depsDone?"ready":"waiting"}}});
 const ftot=inc.length?Math.max(...inc.map(p=>R[p.id].fef)):0;
 [...inc].reverse().forEach(p=>{const r=R[p.id],succ=inc.filter(q=>R[q.id].deps.includes(p.id));r.slack=succ.length?Math.min(...succ.map(q=>R[q.id].slack+(R[q.id].fs-r.fef))):ftot-r.fef;r.slack=Math.max(0,Math.round(r.slack*100)/100);r.crit=r.slack<.02});
 const done=inc.filter(p=>R[p.id].state==="done").length,wsum=inc.reduce((s,p)=>s+R[p.id].du,0),wdone=inc.reduce((s,p)=>s+R[p.id].du*R[p.id].prog,0);
 const eta=addBiz(o.created,ftot),blocked=inc.filter(p=>R[p.id].state==="blocked").length,target=o.target||null;
 const late=target?eta>target+DAY*.99:false;
 const st=done===inc.length?"done":gp?"gate":blocked?"blocked":late?"risk":"track";
 const crit=inc.filter(p=>R[p.id].crit&&R[p.id].state!=="done");
 return{g,a,R,inc,nowOff,gp,tot,ftot,eta,done,n:inc.length,pct:wsum?Math.round(wdone/wsum*100):0,blocked,late,st,target,crit,lateBy:target?Math.max(0,Math.round(bdiff(target,eta)*10)/10):0,removed:g.parts.filter(p=>!cond(p.when,a)),finished:inc.length&&done===inc.length}}
const PLC=new WeakMap();
const planOf=o=>{const k=o._v||0,c=PLC.get(o);if(c&&c.k===k)return c.p;const p=plan(o);PLC.set(o,{k,p});return p};
const touchO=o=>{o._v=(o._v||0)+1;REQV3++;};let REQV3=0;
/* simulation used to seed orders realistically (deterministic) */
function simulate(o,ov,rr){const g=GD(o.g),a=o.A=ansOf(g,o.ans),inc=topo(partsOf(g,a)),nowOff=bdiff(o.created,NOW),act={};
 inc.forEach(p=>{const ds=(p.deps||[]).filter(d=>act[d]!==undefined||inc.some(q=>q.id===d));if(ds.some(d=>!(act[d]&&act[d].e!=null)))return;
  const es=ds.length?Math.max(...ds.map(d=>act[d].e)):0;if(es>nowOff)return;const s=es+rr()*.35;if(s>nowOff)return;const du=durOf(p,a)*(.85+rr()*.45),x=ov&&ov[p.id];
  if(x&&x.blocked)act[p.id]={s,prog:x.prog||.3,blocked:x.blocked};else if(s+du<=nowOff)act[p.id]={s,e:s+du,prog:1,by:ownerOf(p,o)};else act[p.id]={s,prog:Math.min(.9,(nowOff-s)/du)}});
 return act}
let ORSEQ=1000;
const recId=(p,o)=>LANES[p.lane].code+(ORSEQ++);
function mkOrder(d,rr){const g=GD(d.g),o={id:d.id,g:d.g,by:d.by||ME,forName:d.forName,fk:d.fk||"other",rel:d.rel||"other",ans:d.ans||{},created:addBiz(NOW,-0),team:d.team||null,nh:d.nh||null,deliver:d.deliver||"",contact:d.contact||"",log:[],recs:{},seed:1,gate:d.gate?Object.assign({at:NOW},d.gate):null};
 let c=NOW;let n=d.ago||0;while(n>0){c-=DAY;if(!isWk(c))n--}o.created=c-(c%DAY)+9*36e5-(c-(c-(c%DAY)))*0;o.created=Math.floor(c/DAY)*DAY+9*36e5;
 o.nhMgr=d.nh&&d.nh.mgr;o.A=ansOf(g,o.ans);const need=msOf(o.A[g.need]);o.target=need?need:null;
 o.act=o.gate&&o.gate.st==="pending"?{}:simulate(o,d.ov,rr);
 partsOf(g,o.A).forEach(p=>{o.recs[p.id]={id:recId(p,o),type:p.item?"Request item":"Catalog task"}});
 o.log.push({t:o.created,tx:"Order created from the "+g.n+" guide by "+o.by+" for "+o.forName,by:o.by});
 partsOf(g,o.A).forEach(p=>{const a=o.act[p.id];if(a&&a.e!=null)o.log.push({t:addBiz(o.created,a.e),tx:p.n+" completed",by:ownerOf(p,o)})});
 Object.keys(o.act).forEach(k=>{const a=o.act[k];if(a.blocked)o.log.push({t:NOW-3*36e5,tx:(g.parts.find(p=>p.id===k)||{}).n+" blocked: "+a.blocked.why,by:ownerOf(g.parts.find(p=>p.id===k),o)})});
 o.log.sort((x,y)=>x.t-y.t);return o}
const SEEDS=[
 {id:"ORD-1042",g:"move",by:ME,forName:"Zoe Hart",fk:"other",rel:"other",ago:0,ans:{eff:"2026-11-09",type:"Role change",pay:false},gate:{who:"Maya Ortiz",st:"pending"}},
 {id:"ORD-1041",g:"onboarding",by:ME,forName:"Jamie Okoro",fk:"newhire",rel:"newhire",ago:3,nh:{name:"Jamie Okoro",start:"2026-10-14",mgr:ME,loc:"Remote (US)",worker:"Employee"},ans:{name:"Jamie Okoro",start:"2026-10-14",mgr:ME,loc:"Remote (US)",worker:"Employee",role:"Developer",device:"Developer laptop",access:"Standards Platform admin",clear:true},ov:{comp:{blocked:{why:"Background vendor is waiting for a signed consent form",hold:2},prog:.35}},deliver:"Their home (remote)"},
 {id:"ORD-1040",g:"onboarding",by:"Tom Becker",forName:"Marcus Webb",fk:"newhire",rel:"newhire-other",ago:6,nh:{name:"Marcus Webb",start:"2026-10-12",mgr:"Tom Becker",loc:"Parker HQ",worker:"Employee"},ans:{name:"Marcus Webb",start:"2026-10-12",mgr:"Tom Becker",loc:"Parker HQ",worker:"Employee",role:"Standard",device:"Standard laptop",access:"Standard",clear:false}},
 {id:"ORD-1039",g:"offboarding",by:ME,forName:"Elise Park",fk:"other",rel:"report",ago:4,ans:{last:"2026-10-09",reason:"Contract end",loc:"Hybrid (HQ and home)",access:"Privileged",legal:true,reports:false},ov:{}},
 {id:"ORD-1038",g:"move",by:"Maya Ortiz",forName:ME,fk:"other",rel:"other",ago:5,ans:{eff:"2026-10-19",type:"Both",newloc:"Remote EU (Prague)",pay:true}},
 {id:"ORD-1037",g:"project",by:ME,forName:ME,fk:"self",rel:"self",ago:2,ans:{pname:"Standards Portal search upgrade",start:"2026-10-19",budget:320000,vendor:true,sens:"High",workspace:true}},
 {id:"ORD-1036",g:"facevent",by:ME,forName:"Hana Sato",fk:"team",rel:"report",ago:1,team:["Hana Sato","Dmitri Volkov","Greg Nolan"],ans:{kind:"Event",date:"2026-10-20",headcount:60,guests:true,catering:true,av:true}},
 {id:"ORD-1035",g:"onboarding",by:"Joanna Pierce",forName:"Lena Fischer",fk:"newhire",rel:"delegate",ago:8,nh:{name:"Lena Fischer",start:"2026-10-08",mgr:"Dev Rao",loc:"Remote EU (Prague)",worker:"Contractor"},ans:{name:"Lena Fischer",start:"2026-10-08",mgr:"Dev Rao",loc:"Remote EU (Prague)",worker:"Contractor",role:"Standards editor",device:"MacBook",access:"Standard",clear:false}},
 {id:"ORD-1034",g:"offboarding",by:"Sam Patel",forName:"Ben Alvarez",fk:"other",rel:"report",ago:11,ans:{last:"2026-09-25",reason:"Resignation",loc:"Remote (US)",access:"Standard",legal:false,reports:false}}];
function build(){ORD.length=0;ORSEQ=1000;SEEDS.forEach(d=>ORD.push(mkOrder(d,RNG("og"+d.id))));
 if(SCALE&&SCALE.on){const rr=RNG("ogscale"),P=ppl(),gs=GUIDES;for(let i=0;i<320;i++){const g=gs[Math.floor(rr()*gs.length)],by=P[Math.floor(rr()*P.length)].name,fo=P[Math.floor(rr()*P.length)].name;const a={};g.q.forEach(q=>{if(q.t==="chips")a[q.k]=q.o[Math.floor(rr()*q.o.length)];else if(q.t==="toggle")a[q.k]=rr()<.35;else a[q.k]=q.d});
  if(g.id==="onboarding"){a.name="New hire "+(i+1);a.start=iso(NOW+(2+Math.floor(rr()*20))*DAY);a.mgr=by;a.loc=["Parker HQ","Remote (US)","Hybrid (HQ and home)"][Math.floor(rr()*3)];a.worker=rr()<.8?"Employee":"Contractor"}
  else{const dk=g.need;a[dk]=iso(NOW+(Math.floor(rr()*25)-4)*DAY)}
  ORD.push(mkOrder({id:"ORD-"+(2000+i),g:g.id,by,forName:g.id==="onboarding"?a.name:fo,fk:g.id==="onboarding"?"newhire":"other",rel:"other",ago:Math.floor(rr()*14),ans:a,nh:g.id==="onboarding"?{name:a.name,start:a.start,mgr:by,loc:a.loc,worker:a.worker}:null},RNG("ogx"+i)))}}
 genOn=!!(SCALE&&SCALE.on);REQV3++}
const ensureO=()=>{if(genOn===null||genOn!==!!(SCALE&&SCALE.on))build()};
const OQ=id=>{ensureO();return ORD.find(o=>o.id===id)};
/* ---------- presentation helpers ---------- */
const ST={done:["Done","good","--s3"],active:["In progress","info","--p1"],ready:["Ready to start","info","--p4"],waiting:["Waiting","mute","--faint"],blocked:["Blocked","bad","--e4"]};
const OST={done:["Complete","good"],track:["On track","good"],risk:["At risk","warn"],blocked:["Blocked","bad"],gate:["Waiting for manager approval","warn"]};
const stP=s=>`<span class="pill ${ST[s][1]}">${ST[s][0]}</span>`;
const oP=s=>`<span class="pill ${OST[s][1]}">${OST[s][0]}</span>`;
const relP=r=>`<span class="pill mute" title="Relationship between requester and the person it is for">${E(B.RELN[r]||r)}</span>`;
const bar=(pct,cls)=>`<div class="svc3-bar2 ${cls||""}" role="img" aria-label="${pct} percent"><i style="width:${Math.max(2,pct)}%"></i></div>`;
const mine=o=>o.by===ME||o.forName===ME||(o.team&&o.team.includes(ME));
const waitOn=(pl,r)=>r.deps.filter(d=>pl.R[d].state!=="done").map(d=>pl.R[d].p);
const crumb=pl=>pl.crit.length?pl.crit.map(p=>E(LANES[p.lane].n)).join(" then "):"None";
function laneOrder(pl){const ls=[];pl.inc.forEach(p=>{if(!ls.includes(p.lane))ls.push(p.lane)});return ls}
let UID=0;
function swim(pl,o,opt){opt=opt||{};const id="sw"+(++UID),ls=laneOrder(pl),W=1000,LBL=132,PR=18,RH=30,GAP=8,TOP=34;
 const tOff=pl.target?bdiff(o.created,pl.target):null;
 const hz=Math.max(pl.ftot,pl.tot,opt.preview?0:pl.nowOff+.6,1)+.5,hz2=tOff!=null&&tOff<hz+3?Math.max(hz,tOff+.5):hz,sc=(W-LBL-PR)/hz2;
 let y=TOP;const pos={},laneY=[];
 ls.forEach(l=>{const rows=[],ps=pl.inc.filter(p=>p.lane===l).sort((a,b)=>pl.R[a.id].fs-pl.R[b.id].fs);ps.forEach(p=>{const r=pl.R[p.id];let ri=rows.findIndex(e=>e<=r.fs+.01);if(ri<0){ri=rows.length;rows.push(0)}rows[ri]=r.fef;pos[p.id]={x:LBL+r.fs*sc,w:Math.max(14,(r.fef-r.fs)*sc),y:y+ri*(RH+GAP)+GAP/2,ri}});
  const h=Math.max(1,rows.length)*(RH+GAP)+GAP/2;laneY.push({l,y,h});y+=h});
 const H=y+8,ticks=[];const step=hz2>14?2:1;for(let i=0;i<=Math.ceil(hz2);i+=step){ticks.push(i)}
 let svg=`<svg class="svc3-sw" viewBox="0 0 ${W} ${H}" role="img" aria-label="Parallel flow of ${pl.n} parts across ${ls.length} groups with dependencies" preserveAspectRatio="xMinYMin meet">
 <defs><marker id="${id}a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="svc3-ah"/></marker><marker id="${id}c" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="svc3-ahc"/></marker></defs>`;
 laneY.forEach((ly,i)=>{svg+=`<rect class="svc3-lane ${i%2?"alt":""}" x="0" y="${ly.y}" width="${W}" height="${ly.h}" rx="6"/><text class="svc3-ll" x="10" y="${ly.y+ly.h/2-2}">${E(LANES[ly.l].n)}</text><text class="svc3-ls" x="10" y="${ly.y+ly.h/2+12}">${E(LANES[ly.l].g.length>20?LANES[ly.l].g.slice(0,19)+"…":LANES[ly.l].g)}</text>`});
 ticks.forEach(i=>{const x=LBL+i*sc;svg+=`<line class="svc3-grid" x1="${x}" y1="${TOP-6}" x2="${x}" y2="${H-4}"/><text class="svc3-tk" x="${x+3}" y="${TOP-14}">${i===0?"Start":fd(addBiz(o.created,i))}</text>`});
 if(!opt.preview){const xn=LBL+pl.nowOff*sc;svg+=`<line class="svc3-now" x1="${xn}" y1="${TOP-8}" x2="${xn}" y2="${H-4}"/><text class="svc3-nowt" x="${xn+4}" y="${H-8}">Today</text>`}
 if(tOff!=null&&tOff>=0&&tOff<=hz2){const xt=LBL+tOff*sc;svg+=`<line class="svc3-need" x1="${xt}" y1="${TOP-8}" x2="${xt}" y2="${H-4}"/><text class="svc3-needt" x="${xt-4}" y="${TOP+6}" text-anchor="end">${E(pl.g.needL)} ${fd(pl.target)}</text>`}
 pl.inc.forEach(p=>{pl.R[p.id].deps.forEach(d=>{const a=pos[d],b=pos[p.id];if(!a||!b)return;const c=pl.R[d].crit&&pl.R[p.id].crit;const x1=a.x+a.w,y1=a.y+RH/2,x2=b.x,y2=b.y+RH/2;
  const dd=x2-x1>=12?`M${x1} ${y1} C${x1+(x2-x1)/2} ${y1} ${x1+(x2-x1)/2} ${y2} ${x2-1} ${y2}`:`M${x1} ${y1} H${x1+5} V${y2<y1?y2+RH/2+GAP/2:y2-RH/2-GAP/2} H${x2-8} V${y2} H${x2-1}`;
  svg+=`<path class="svc3-dep ${c?"crit":""}" d="${dd}" marker-end="url(#${id}${c?"c":"a"})"/>`})});
 pl.inc.forEach(p=>{const r=pl.R[p.id],q=pos[p.id],cid=id+"c"+p.id;const lab=(r.state==="done"?"✓ ":"")+p.n;
  svg+=`<g class="svc3-b ${r.state} ${r.crit&&r.state!=="done"?"crit":""}" data-og="part|${E(o.id||"")}|${p.id}" tabindex="0" role="button" aria-label="${E(p.n+", "+ST[r.state][0]+", "+LANES[p.lane].n)}" style="--lc:var(${LANES[p.lane].c})"><title>${E(p.n+" · "+ST[r.state][0]+" · "+r1(r.du)+" business days"+(r.crit&&r.state!=="done"?" · critical path":""))}</title><clipPath id="${cid}"><rect x="${q.x}" y="${q.y}" width="${q.w}" height="${RH}"/></clipPath><rect class="svc3-br" x="${q.x}" y="${q.y}" width="${q.w}" height="${RH}" rx="7"/><text class="svc3-bt" clip-path="url(#${cid})" x="${q.x+8}" y="${q.y+RH/2+4}">${E(lab)}</text></g>`});
 return svg+`</svg>`}
const swimWrap=(pl,o,opt)=>`<div class="tscroll svc3-swwrap">${swim(pl,o,opt)}</div>${legend([["Done","--s3"],["In progress","--p1"],["Ready to start","--p4"],["Waiting on a dependency","--faint"],["Blocked","--e4"]])}<p class="muted small svc3-lgn">Arrows go from a part to the part that waits for it. A bold outline and a bold arrow mark the critical path, the chain that sets the finish date. ${opt&&opt.preview?"":"The solid vertical line is today"+(pl.target?"; the dashed line is the date it is needed":"")+"."}</p>`;
const ctxChips=(o,p)=>{const A=o.A||ansOf(GD(o.g),o.ans);return (p.ctx||[]).map(k=>{const v=A[k];if(v===undefined||v===""||v===false)return"";const q=GD(o.g).q.find(z=>z.k===k);const l=(q&&q.l)||KEYL[k]||({worker:"Worker type",start:"Start date",loc:"Location",last:"Last day",eff:"Effective",type:"Change",newloc:"New location",reason:"Reason"}[k])||k;return `<span class="svc3-ctx"><small>${E(l)}</small> ${E(v===true?"Yes":String(v))}</span>`}).join("")};
function partCard(o,pl,p){const r=pl.R[p.id],l=LANES[p.lane],ow=ownerOf(p,o),rec=o.recs[p.id]||{},w=waitOn(pl,r);
 const due=addBiz(o.created,r.pes+p.sla-r.du+0);const slaU=r.state==="done"?"":(r.fef>r.pes+p.sla-r.du+0.5?"over":"");
 return `<article class="svc3-pc glass" style="--lc:var(${l.c})"><header><span class="svc3-lane-chip" style="--lc:var(${l.c})">${E(l.n)}</span>${stP(r.state)}${r.crit&&r.state!=="done"?'<span class="pill warn" title="This part sets the finish date of the whole order">Critical path</span>':""}</header>
 <h4>${E(p.n)}</h4><div class="svc3-pm"><span class="muted small">Group</span><span>${E(l.g)}</span><span class="muted small">Owner</span><span>${B.whx(ow)}</span><span class="muted small">Plan</span><span class="num">${bd(r.du)} · SLA ${p.sla} d</span><span class="muted small">Expected</span><span class="num">${fd(addBiz(o.created,r.fef))}</span></div>
 ${bar(Math.round(r.prog*100),r.state)}<div class="svc3-pw">${r.state==="waiting"&&w.length?`<span class="small muted">Waiting on</span> ${w.map(q=>`<span class="pill mute">${E(LANES[q.lane].n)}: ${E(q.n.length>26?q.n.slice(0,25)+"…":q.n)}</span>`).join("")}`:r.state==="blocked"?`<span class="small">${E((r.ac.blocked||{}).why||"Blocked")}</span>`:pl.gp&&r.state==="waiting"?'<span class="small muted">Waiting for the manager approval</span>':`<span class="small muted">${r.state==="done"?"Finished "+fd(addBiz(o.created,r.fef)):"No dependency open"}</span>`}</div>
 ${p.when?`<div class="svc3-why"><small class="muted">Added because</small> ${E(ctext(p.when,pl.g))}</div>`:""}
 <footer><button class="btn quiet" data-og="rec|${E(o.id)}|${p.id}" title="Open the fulfillment record">${E(rec.id||"Record")}</button><button class="btn quiet" data-og="proc|${l.proc||("og_p_"+p.lane)}" title="Open the process in the process library">Process</button><button class="btn" data-og="part|${E(o.id)}|${p.id}">Details</button></footer></article>`}
function orderDetail(o){const pl=planOf(o),g=pl.g,etaS=fdw(pl.eta),pend=pl.inc.filter(p=>["ready","active"].includes(pl.R[p.id].state));
 const removed=pl.removed.map(p=>`<span class="pill mute" title="${E(ctext(p.when,g))}">${E(LANES[p.lane].n)}: ${E(p.n)}</span>`).join("");
 const added=pl.inc.filter(p=>p.when).map(p=>`<span class="pill info" title="${E(ctext(p.when,g))}">${E(LANES[p.lane].n)}: ${E(p.n)}</span>`).join("");
 return `<div class="svc3-od">
 <section class="card glass svc3-ohead"><div class="svc3-oh1"><div><div class="eyebrow">${E(g.n)} · order ${E(o.id)}</div><h2>${E(o.forName)}${o.team&&o.team.length>1?` and ${o.team.length-1} others`:""}</h2>
  <div class="row small"><span class="muted">Requested by</span>${B.whx(o.by)}<span class="muted">for</span>${B.whx(o.forName)}${relP(o.rel)}${o.deliver?`<span class="muted">Deliver to</span><b>${E(o.deliver)}</b>`:""}</div></div>
  <div class="svc3-ost">${oP(pl.st)}<span class="muted small">${pl.done} of ${pl.n} parts done</span></div></div>
 ${bar(pl.pct,pl.st)}
 <div class="svc3-kpis"><div><small>Progress</small><b class="num" data-role="metric">${pl.pct}%</b></div><div><small>Expected complete</small><b class="num" data-role="metric">${pl.st==="done"?"Done":fd(pl.eta)}</b><em>${pl.st==="done"?"All parts finished":etaS}</em></div><div><small>${E(g.needL)}</small><b class="num">${pl.target?fd(pl.target):"None set"}</b><em>${pl.target?(pl.late?`<span class="bad-t">${pl.lateBy} business days late</span>`:"Ready in time"):""}</em></div><div><small>Critical path</small><b>${pl.finished?"Finished":E(crumb(pl))}</b><em>${pl.finished?"":r1(pl.ftot-pl.nowOff)+" business days left"}</em></div></div>
 ${o.gate&&o.gate.st==="pending"?`<div class="svc3-gate"><b>Waiting for ${B.whx(o.gate.who)} to approve</b><span class="muted small">You are not this person's manager, so their manager decides before any part starts.</span><button class="btn primary" data-og="gate|${E(o.id)}|approve">Approve as ${E(o.gate.who)}</button></div>`:o.gate&&o.gate.st==="approved"?`<div class="svc3-gate ok"><span class="pill good">Manager approved</span> ${B.whx(o.gate.who)}</div>`:""}
 </section>
 <section class="card glass"><div class="cardhead"><h3>Parts and who owns them</h3><span class="muted small">${pl.n} parts from ${laneOrder(pl).length} groups</span></div><div class="svc3-pgrid">${pl.inc.map(p=>partCard(o,pl,p)).join("")}</div></section>
 <section class="card glass"><div class="cardhead"><h3>Parallel flow and dependencies</h3><span class="muted small">Groups in lanes, time runs left to right</span></div>${swimWrap(pl,o)}</section>
 <div class="grid g2"><section class="card glass"><div class="cardhead"><h3>What your answers changed</h3></div><div class="svc3-br2"><div><small class="muted">Added by an answer</small><div class="row">${added||'<span class="muted small">Nothing optional added</span>'}</div></div><div><small class="muted">Not needed</small><div class="row">${removed||'<span class="muted small">Every part applies</span>'}</div></div></div></section>
 <section class="card glass"><div class="cardhead"><h3>What is next</h3></div>${pend.length?pend.map(p=>`<div class="svc3-nx"><span class="svc3-lane-chip" style="--lc:var(${LANES[p.lane].c})">${E(LANES[p.lane].n)}</span><b>${E(p.n)}</b>${stP(pl.R[p.id].state)}<span class="muted small">${B.whx(ownerOf(p,o))}</span></div>`).join(""):'<p class="muted">Nothing is ready. Waiting on dependencies or an approval.</p>'}</section></div>
 <section class="card glass"><div class="cardhead"><h3>History</h3></div><ol class="svc3-hist">${o.log.slice().reverse().map(l=>`<li><span class="muted small">${fd(l.t)}</span> ${E(l.tx)} <span class="muted small">${E(l.by||"")}</span></li>`).join("")}</ol></section></div>`}
/* ---------- actions on parts (fulfillers) ---------- */
function after(o){touchO(o);syncM();sv3()}
function startPart(o,pid){const pl=planOf(o),r=pl.R[pid];if(!r||r.state==="done")return;if(r.state==="waiting"){toast("Waiting on "+waitOn(pl,r).map(p=>p.n).join(", ")||"the approval","warn");return}
 (o.act[pid]=o.act[pid]||{}).s=pl.nowOff;o.act[pid].prog=Math.max(o.act[pid].prog||0,.05);o.log.push({t:NOW,tx:r.p.n+" started",by:ME});audit("started order part",o.id+" "+r.p.n);toast("Started: "+r.p.n,"good");after(o)}
function donePart(o,pid){const pl=planOf(o),r=pl.R[pid];if(!r||r.state==="done")return;if(r.state==="waiting"){toast("Cannot finish yet. Waiting on "+(waitOn(pl,r).map(p=>p.n).join(", ")||"the manager approval"),"warn");return}
 const a=o.act[pid]=o.act[pid]||{};if(a.s==null)a.s=pl.nowOff;a.e=Math.max(pl.nowOff,a.s);a.prog=1;delete a.blocked;a.by=ME;o.log.push({t:NOW,tx:r.p.n+" completed",by:ownerOf(r.p,o)});audit("completed order part",o.id+" "+r.p.n);
 touchO(o);const p2=planOf(o);const opened=p2.inc.filter(p=>p2.R[p.id].state==="ready"&&p2.R[p.id].deps.includes(pid));
 toast(r.p.n+" done."+(opened.length?" Now ready: "+opened.map(p=>LANES[p.lane].n).join(", ")+".":""),"good");
 if(p2.finished){o.log.push({t:NOW,tx:"Order complete. All "+p2.n+" parts delivered.",by:"Oukala"});try{B.NOTI("e5",o.by,{id:o.id});if(o.forName!==o.by&&human(o.forName))B.NOTI("e5",o.forName,{id:o.id})}catch(e){}toast(o.id+" is complete","good")}
 syncM();sv3()}
function blockPart(o,pid){const pl=planOf(o),r=pl.R[pid];if(!r)return;openForm({id:"svc3_blk",title:"Block: "+r.p.n,story:"A blocked part holds back every part that depends on it and moves the order's expected date. Say what is needed and from whom.",submit:"Mark blocked",fields:[{k:"why",label:"What is blocking it",type:"longtext",req:true,ph:"For example, waiting for a signed consent form"},{k:"hold",label:"Expected delay (business days)",type:"number",min:.5,max:20,step:.5}],defaults:{hold:2},
 onSubmit:v=>{const a=o.act[pid]=o.act[pid]||{};if(a.s==null)a.s=pl.nowOff;a.blocked={why:v.why,hold:+v.hold||1.5};o.log.push({t:NOW,tx:r.p.n+" blocked: "+v.why,by:ME});audit("blocked order part",o.id+" "+r.p.n+": "+v.why);toast("Marked blocked. The order's expected date moved.","warn");closeDrawer();after(o)}})}
function unblockPart(o,pid){const a=o.act[pid];if(a)delete a.blocked;const r=planOf(o).R[pid];o.log.push({t:NOW,tx:(r?r.p.n:pid)+" unblocked",by:ME});audit("unblocked order part",o.id);toast("Unblocked","good");after(o)}
function gateAct(o){if(!o.gate)return;const pl=planOf(o);o.gate.st="approved";o.gate.off=pl.nowOff;o.log.push({t:NOW,tx:"Manager approval by "+o.gate.who,by:o.gate.who});audit("approved order",o.id+" "+o.gate.who);
 const pl2=plan(Object.assign({},o,{_v:-1}));pl2.inc.forEach(p=>{if(!pl2.R[p.id].deps.length){(o.act[p.id]=o.act[p.id]||{}).s=pl.nowOff;o.act[p.id].prog=.05}});toast("Approved. "+pl2.inc.filter(p=>!pl2.R[p.id].deps.length).length+" parts started in parallel.","good");after(o)}
function partDrawer(oid,pid){const o=OQ(oid);if(!o)return;const pl=planOf(o),r=pl.R[pid];if(!r)return;const p=r.p,l=LANES[p.lane],rec=o.recs[pid]||{},w=waitOn(pl,r),ow=ownerOf(p,o);
 const succ=pl.inc.filter(q=>pl.R[q.id].deps.includes(pid));const steps=LSTEPS[p.lane]||[];
 openDrawer(`<div class="svc3-dr"><div class="row"><span class="svc3-lane-chip" style="--lc:var(${l.c})">${E(l.n)}</span>${stP(r.state)}${r.crit&&r.state!=="done"?'<span class="pill warn">Critical path</span>':""}<span class="pill mute">${E(rec.id||"")}</span></div><h2>${E(p.n)}</h2>
 <p class="muted small">Part of ${E(g_n(o))} order <b>${E(o.id)}</b>. Fulfillment group: ${E(l.g)}.</p>
 <div class="svc3-ctxbox"><b>From the parent order</b><div class="svc3-ctxg"><span class="muted small">Requested by</span><span>${B.whx(o.by)}</span><span class="muted small">Requested for</span><span>${B.whx(o.forName)} ${relP(o.rel)}</span><span class="muted small">${E(pl.g.needL)}</span><span>${pl.target?fdw(pl.target):"Not set"}</span><span class="muted small">Order expected</span><span>${fdw(pl.eta)} ${oP(pl.st)}</span>${o.deliver?`<span class="muted small">Deliver to</span><span>${E(o.deliver)}</span>`:""}</div><div class="row">${ctxChips(o,p)}</div></div>
 <dl class="kv"><dt>Owner</dt><dd>${B.whx(ow)}</dd><dt>Plan</dt><dd>${bd(r.du)}, SLA ${p.sla} days</dd><dt>Expected finish</dt><dd>${fdw(addBiz(o.created,r.fef))}</dd><dt>Slack</dt><dd>${r.crit?"None. A delay here delays the order.":r1(r.slack)+" business days before it affects the order"}</dd><dt>Added because</dt><dd>${E(ctext(p.when,pl.g))}</dd><dt>Waits for</dt><dd>${r.deps.length?r.deps.map(d=>`${E(LANES[pl.R[d].p.lane].n)}: ${E(pl.R[d].p.n)} ${stP(pl.R[d].state)}`).join("<br>"):"Nothing. Starts as soon as the order is approved."}</dd><dt>Unlocks</dt><dd>${succ.length?succ.map(q=>E(LANES[q.lane].n+": "+q.n)).join("<br>"):"Nothing else waits on it"}</dd></dl>
 <div class="eyebrow">Process steps in this group</div><ol class="svc3-steps">${steps.map(s=>`<li>${E(s)}</li>`).join("")}</ol>
 <div class="row svc3-act">${r.state==="ready"?`<button class="btn primary" data-og="start|${E(oid)}|${pid}">Start</button>`:""}${r.state==="active"||r.state==="ready"?`<button class="btn primary" data-og="done|${E(oid)}|${pid}">Mark done</button><button class="btn" data-og="block|${E(oid)}|${pid}">Mark blocked</button>`:""}${r.state==="blocked"?`<button class="btn primary" data-og="unblock|${E(oid)}|${pid}">Unblock</button>`:""}${r.state==="waiting"?'<span class="muted small">Actions open when the parts it waits for are done.</span>':""}
 <button class="btn quiet" data-og="proc|og_p_${p.lane}">Open the process</button><button class="btn quiet" data-og="rec|${E(oid)}|${pid}">Fulfillment record</button><button class="btn quiet" data-og="order|${E(oid)}">Open the order</button></div></div>`);audit("opened order part",oid+" "+p.n)}
const g_n=o=>GD(o.g).n;
function recDrawer(oid,pid){const o=OQ(oid);if(!o)return;const rec=o.recs[pid];if(rec&&rec.ritm&&B.RQ(rec.id)){B.openReq(rec.id);return}
 const pl=planOf(o),r=pl.R[pid];if(!r)return;const p=r.p,l=LANES[p.lane];
 openDrawer(`<div class="svc3-dr"><div class="row"><span class="pill info">${E(rec.type||"Catalog task")}</span><span class="pill mute">${E(rec.id)}</span>${stP(r.state)}</div><h2>${E(p.n)}</h2><dl class="kv"><dt>Parent order</dt><dd><button class="btn quiet" data-og="order|${E(oid)}">${E(oid)} ${E(g_n(o))}</button></dd><dt>Assignment group</dt><dd>${E(l.g)}</dd><dt>Assigned to</dt><dd>${B.whx(ownerOf(p,o))}</dd><dt>Opened</dt><dd>${fdw(o.created)}</dd><dt>Due</dt><dd>${fdw(addBiz(o.created,r.pes+p.sla-r.du))}</dd><dt>Requested for</dt><dd>${B.whx(o.forName)}</dd><dt>Process</dt><dd><button class="btn quiet" data-og="proc|og_p_${p.lane}">Open in the process library</button></dd></dl><div class="row"><button class="btn" data-og="part|${E(oid)}|${pid}">Part details</button></div></div>`)}
/* ---------- tabs ---------- */
const orders=()=>{ensureO();return ORD};
const openO=()=>orders().filter(o=>!planOf(o).finished);
function stats(){const os=orders(),pls=os.map(planOf),open=pls.filter(p=>!p.finished),parts=pls.reduce((a,p)=>a.concat(p.inc.map(q=>p.R[q.id])),[]);
 return{n:os.length,open:open.length,risk:open.filter(p=>p.st==="risk").length,blocked:open.filter(p=>p.st==="blocked").length,gate:open.filter(p=>p.st==="gate").length,done:pls.filter(p=>p.finished).length,
  openParts:parts.filter(r=>r.state!=="done").length,blockedParts:parts.filter(r=>r.state==="blocked").length,parts:parts.length,removed:pls.reduce((a,p)=>a+p.removed.length,0),cat:pls.reduce((a,p)=>a+p.g.parts.length,0),
  other:os.filter(o=>["other","newhire-other"].includes(o.rel)).length,onbehalf:os.filter(o=>o.rel!=="self").length,
  cyc:(()=>{const c=pls.map((p,i)=>p.finished?bdiff(os[i].created,addBiz(os[i].created,p.ftot)):null).filter(x=>x!=null).sort((a,b)=>a-b);return c.length?c[Math.floor(c.length/2)]:0})(),
  ontime:(()=>{const c=pls.filter(p=>p.target);return c.length?Math.round(c.filter(p=>!p.late&&p.st!=="blocked").length/c.length*100):100})()}}
function syncM(){try{const s=stats(),set=(id,v)=>{const m=METRICS[id];if(!m||!isFinite(v))return;m.cur=Math.round(v*10)/10;m.tr=m.tr.slice(0,7).concat(m.cur)};set("m_og_cycle",s.cyc||5.8);set("m_og_ontime",s.ontime);set("m_og_blocked",s.openParts?s.blockedParts/s.openParts*100:0);set("m_og_branch",s.cat?s.removed/s.cat*100:0);set("m_rf_mgrap",s.onbehalf?s.other/s.onbehalf*100:0)}catch(e){}}
Object.assign(METRICS,{
 m_og_cycle:{n:"Order guide cycle time",f:"Median of (date the last part finished − date the order was placed), in business days, for completed orders",u:"d",cur:5.8,tgt:6,badAt:9,dir:"min",max:14,tr:[7.2,6.9,6.8,6.4,6.3,6.1,6,5.8],owner:"Service desk lead",use:["Order guides"],rem:{kind:"sop",ref:"SOP-OG-1",title:"Run the order guide critical path review",agent:"Order Guide Watcher",auto:false,state:"idle",prog:"Lists parts on the critical path that are waiting or blocked"}},
 m_og_ontime:{n:"Orders ready by the need date",f:"Orders with a need date that are complete or forecast to finish on or before it ÷ orders with a need date × 100",u:"%",cur:88,tgt:92,badAt:75,dir:"max",max:100,tr:[84,85,87,86,88,89,88,88],owner:"Service desk lead",use:["Order guides","Self-service portal"],rem:{kind:"sop",ref:"SOP-OG-2",title:"Escalate at-risk orders to the part owners",agent:"Order Guide Watcher",auto:false,state:"idle",prog:"Flags orders forecast past their need date"}},
 m_og_blocked:{n:"Open parts that are blocked",f:"Parts in state Blocked ÷ parts not yet done × 100",u:"%",cur:4,tgt:3,badAt:10,dir:"min",max:30,tr:[6,5,5,4,4,5,4,4],owner:"Fulfillment group leads",use:["Order guides"],rem:{kind:"sop",ref:"SOP-OG-3",title:"Clear a blocked part",agent:"Order Guide Watcher",auto:false,state:"idle",prog:"Messages the unblocker named on the part"}},
 m_og_branch:{n:"Work avoided by question-driven branching",f:"Guide parts not needed for the answers given ÷ all parts defined on the guides × 100",u:"%",cur:22,tgt:20,badAt:5,dir:"max",max:60,tr:[14,15,18,18,20,21,22,22],owner:"Catalog manager",use:["Order guides"],rem:{kind:"kb",ref:"KB-OG-2",title:"Write better branching questions",agent:"Order Guide Watcher",auto:false,state:"idle",prog:"Suggests questions that remove unneeded parts"}},
 m_rf_mgrap:{n:"On-behalf orders needing manager approval",f:"Orders where the requester is not the person's manager or a delegate ÷ orders raised for someone else × 100",u:"%",cur:30,tgt:25,badAt:60,dir:"min",max:100,tr:[38,36,34,33,32,31,30,30],owner:"Service catalog manager",use:["Who is this for","Order guides"],rem:{kind:"sop",ref:"SOP-RF-1",title:"Register delegates and reporting lines",agent:"Order Guide Watcher",auto:false,state:"idle",prog:"Lists requesters who often order for people they do not manage"}}});
const hdr=()=>{syncM();const s=stats();return hero("Order guides","Multi-part orders, one status",`<b>${s.open}</b> open orders · <b>${s.risk}</b> at risk · <b>${s.blocked}</b> blocked · <b>${s.gate}</b> waiting for a manager · ${s.openParts} open parts across ${laneKeys().length} fulfillment groups.`,`<div class="row">${fchip("m_og_cycle")}${fchip("m_og_ontime")}${fchip("m_og_blocked")}${fchip("m_rf_mgrap")}<button class="btn primary" data-og="new">Start an order</button></div>`)};
const laneKeys=()=>Object.keys(LANES);
function orderRow(o){const pl=planOf(o);return `<button class="svc3-orow glass ${S3.sel===o.id?"sel":""}" data-og="order|${E(o.id)}" aria-pressed="${S3.sel===o.id}"><span class="svc3-or1"><b>${E(o.id)}</b>${oP(pl.st)}</span><span class="svc3-or2">${E(g_n(o))}</span><span class="svc3-or3 small muted">${E(o.by===ME?"By you":"By "+o.by)} for ${E(o.forName===ME?"you":o.forName)}</span>${bar(pl.pct,pl.st)}<span class="svc3-or4 small"><span class="num">${pl.done}/${pl.n}</span> parts · ${pl.st==="done"?"complete":"expected "+fd(pl.eta)}</span></button>`}
function ordersTab(){const os=orders(),m=os.filter(mine),sel=OQ(S3.sel)||m[0]||os[0];
 const list=m.length?m.map(orderRow).join(""):'<p class="muted">You have no orders yet.</p>';
 const allT=os.length>12?card("All orders",N(os.length)+" orders in the organization. Search by order, guide or person.",btHTML({id:"svc3_all",cols:[{k:"id",label:"Order",fmt:o=>`<b>${E(o.id)}</b>`,val:o=>o.id,cls:"tok"},{k:"g",label:"Guide",fmt:o=>E(g_n(o)),val:o=>g_n(o)},{k:"by",label:"Requested by",fmt:o=>B.whx(o.by),val:o=>o.by},{k:"forName",label:"Requested for",fmt:o=>B.whx(o.forName),val:o=>o.forName},{k:"rel",label:"Relationship",fmt:o=>E(B.RELN[o.rel]||o.rel),val:o=>o.rel},{k:"st",label:"Status",fmt:o=>oP(planOf(o).st),val:o=>OST[planOf(o).st][0]},{k:"pct",label:"Progress",fmt:o=>planOf(o).pct+"%",val:o=>planOf(o).pct},{k:"eta",label:"Expected",fmt:o=>fd(planOf(o).eta),val:o=>planOf(o).eta}],rows:()=>orders(),key:"id",h:380,rowH:44,facets:["g","st","rel"],exportName:"order_guide_orders",open:id=>{S3.sel=id;sv3()}})):"";
 return `<div class="svc3-split"><aside class="svc3-side"><div class="eyebrow">My orders (${m.length})</div>${list}<button class="btn" data-og="new">Start another order</button></aside><div class="svc3-main">${sel?orderDetail(sel):empty("No order selected","Pick an order on the left.")}</div></div>${allT}`}
function qField(g,q,A){const v=(S3.ans[g.id]||{})[q.k];const val=v===undefined?q.d:v;if(q.show&&!cond(q.show,ansOf(g,S3.ans[g.id])))return"";
 const lab=`<span class="svc3-ql">${E(q.l)}${q.help?` <small class="muted">${E(q.help)}</small>`:""}</span>`;
 if(q.t==="chips")return `<div class="svc3-q"><div>${lab}</div><div class="row">${q.o.map(x=>`<button type="button" class="chip" data-og="ans|${q.k}|${E(x)}" aria-pressed="${val===x}">${E(x)}</button>`).join("")}</div></div>`;
 if(q.t==="toggle")return `<div class="svc3-q tg"><div>${lab}</div><button type="button" class="ftog" role="switch" aria-checked="${!!val}" aria-label="${E(q.l)}" data-og="tog|${q.k}"><i></i></button></div>`;
 return `<label class="svc3-q"><div>${lab}</div><input class="txtin" type="${q.t==="date"?"date":q.t==="number"?"number":"text"}" data-og-a="${q.k}" value="${E(val==null?"":val)}" placeholder="${E(q.ph||"")}" aria-label="${E(q.l)}"></label>`}
function wizAns(g){const a=Object.assign({},S3.ans[g.id]||{});if(g.fromFor&&S3.kind==="newhire"){a.name=S3.nh.name;a.start=S3.nh.start;a.mgr=S3.nh.mgr;a.loc=S3.nh.loc;a.worker=S3.nh.worker}
 a.person=RF.forName();return ansOf(g,a)}
function wizard(g){const it=B.ITEM(g.item)||{id:g.item,n:g.n,vars:[],appr:[]};const panel=rfPanel(it,{kinds:g.kinds,hint:g.n});const A=wizAns(g);
 const o={g:g.id,A,ans:A,created:NOW,act:{},target:msOf(A[g.need])};const pl=plan(o);const removed=pl.removed.map(p=>`<span class="pill mute">${E(LANES[p.lane].n)}: ${E(p.n)}</span>`).join("");
 const P_=polAll(it);const nh=g.fromFor?`<div class="svc3-nhn muted small">Name, start date, manager and location come from "Who is this for" above.</div>`:"";
 return `<div class="svc3-wiz"><div class="row"><button class="btn quiet" data-og="back">Back to guides</button><span class="pill info">Order guide</span></div><h2>${E(g.n)}</h2><p class="muted">${E(g.blurb)}</p>
 ${panel}
 <section class="card glass"><div class="cardhead"><h3>A few questions</h3><span class="muted small">Your answers add or remove parts</span></div>${nh}<div class="svc3-qs">${g.q.map(q=>qField(g,q,A)).join("")}</div></section>
 <section class="card glass"><div class="cardhead"><h3>The order you will place</h3><span class="muted small"><b>${pl.n}</b> parts · <b>${laneOrder(pl).length}</b> groups · about <b>${r1(pl.tot)}</b> business days · expected <b>${fdw(addBiz(NOW,pl.tot))}</b></span></div>
  <div class="svc3-chg"><div><small class="muted">Parts in this order</small><div class="row">${pl.inc.map(p=>`<span class="pill ${p.when?"info":"mute"}" title="${E(ctext(p.when,g))}">${E(LANES[p.lane].n)}: ${E(p.n)}${p.when?" · added by your answers":""}</span>`).join("")}</div></div><div><small class="muted">Not needed for these answers</small><div class="row">${removed||'<span class="muted small">None. Every part applies.</span>'}</div></div></div>
  ${pl.target&&addBiz(NOW,pl.tot)>pl.target?`<div class="svc3-warn"><span class="pill warn">At risk</span> ${E(g.needL)} ${fd(pl.target)} is ${r1(bdiff(pl.target,addBiz(NOW,pl.tot)))} business days before the plan can finish. Critical path: ${E(crumb({crit:pl.inc.filter(p=>pl.R[p.id].crit)}))}.</div>`:""}
  ${swimWrap(pl,{created:NOW,id:""},{preview:true})}</section>
 <div class="row svc3-submit"><button class="btn primary" data-og="place|${g.id}" ${P_.ok?"":'aria-disabled="true"'}>Place order</button><button class="btn quiet" data-og="back">Cancel</button><span class="muted small">${P_.ok?"Each part goes to its group as soon as its dependencies allow.":E(P_.msg)}</span></div></div>`}
function startTab(){if(S3.wiz&&GD(S3.gid))return wizard(GD(S3.gid));
 return `<div class="svc3-gcards">${GUIDES.map(g=>{const lanes=uniq(g.parts.map(p=>p.lane));return `<article class="svc3-gc glass"><div class="svc3-gct"><b>${E(g.n)}</b><span class="pill info">${g.parts.length} parts</span></div><p class="muted small">${E(g.blurb)}</p><div class="row svc3-gcl">${lanes.map(l=>`<span class="svc3-lane-chip" style="--lc:var(${LANES[l].c})">${E(LANES[l].n)}</span>`).join("")}</div><div class="svc3-gcf"><span class="muted small">Default for: ${E((KINDS.find(k=>k[0]===(DEFK[g.item]||g.kinds[0]))||KINDS[0])[1].toLowerCase())}</span><button class="btn primary" data-og="gstart|${g.id}">Order</button></div></article>`}).join("")}</div>`}
function laneQueue(lane){const out=[];orders().forEach(o=>{const pl=planOf(o);pl.inc.forEach(p=>{if(p.lane===lane)out.push({o,pl,p,r:pl.R[p.id]})})});return out}
function queueTab(){const lane=S3.fq&&LANES[S3.fq]?S3.fq:"hr",all=laneQueue(lane),fs=S3.fstate;const open=all.filter(x=>x.r.state!=="done");
 const rows=(fs==="open"?open:fs==="blocked"?all.filter(x=>x.r.state==="blocked"):fs==="done"?all.filter(x=>x.r.state==="done"):all).sort((a,b)=>({blocked:0,active:1,ready:2,waiting:3,done:4}[a.r.state]-{blocked:0,active:1,ready:2,waiting:3,done:4}[b.r.state])||(a.r.crit?0:1)-(b.r.crit?0:1)).slice(0,14);
 const L=LANES[lane];
 const chips=laneKeys().map(k=>{const q=laneQueue(k).filter(x=>x.r.state!=="done").length;return `<button class="chip" data-og="lane|${k}" aria-pressed="${k===lane}" style="--lc:var(${LANES[k].c})">${E(LANES[k].n)} <b class="num">${q}</b></button>`}).join("");
 return `<div class="row svc3-lanes" role="group" aria-label="Fulfillment group">${chips}</div>
 <div class="statrow"><div class="stat"><small>${E(L.g)}</small><span class="num" data-role="metric">${open.length}</span><em>open parts</em></div><div class="stat ${all.filter(x=>x.r.state==="blocked").length?"crit":""}"><small>Blocked</small><span class="num">${all.filter(x=>x.r.state==="blocked").length}</span><em>need an unblocker</em></div><div class="stat"><small>On the critical path</small><span class="num">${open.filter(x=>x.r.crit).length}</span><em>delay moves an order</em></div><div class="stat"><small>Ready to start</small><span class="num">${open.filter(x=>x.r.state==="ready").length}</span><em>no dependency open</em></div></div>
 <div class="row svc3-fbar"><div class="svc-seg" role="group" aria-label="State">${[["open","Open"],["blocked","Blocked"],["done","Done"],["all","All"]].map(x=>`<button class="chip" data-og="fst|${x[0]}" aria-pressed="${fs===x[0]}">${x[1]}</button>`).join("")}</div><span class="muted small">Queue owner ${B.whx(L.own==="@mgr"?"Hiring or line managers":L.own)}. Each item shows the parent order it belongs to.</span></div>
 <div class="svc3-qlist">${rows.map(({o,pl,p,r})=>{const w=waitOn(pl,r);return `<article class="svc3-qi glass ${r.state}"><div class="svc3-qi1"><div class="row"><b>${E(p.n)}</b>${stP(r.state)}${r.crit&&r.state!=="done"?'<span class="pill warn">Critical path</span>':""}</div><div class="svc3-ctxbox small"><span class="muted">From order</span> <button class="btn quiet" data-og="order|${E(o.id)}">${E(o.id)} · ${E(g_n(o))}</button><div class="row"><span class="muted">Requested by</span> ${B.whx(o.by)} <span class="muted">for</span> ${B.whx(o.forName)} ${relP(o.rel)}</div><div class="row"><span class="muted">${E(pl.g.needL)}</span> <b>${pl.target?fd(pl.target):"None"}</b> <span class="muted">Order expected</span> <b>${fd(pl.eta)}</b> ${oP(pl.st)}</div><div class="row">${ctxChips(o,p)}</div></div>${w.length?`<div class="small"><span class="muted">Waiting on</span> ${w.map(q=>`<span class="pill mute">${E(LANES[q.lane].n)}: ${E(q.n)}</span>`).join(" ")}</div>`:""}</div>
  <div class="svc3-qi2"><span class="small muted">${E(rowId(o,p))}</span><div class="row">${r.state==="ready"?`<button class="btn primary" data-og="start|${E(o.id)}|${p.id}">Start</button>`:""}${r.state==="active"||r.state==="ready"?`<button class="btn" data-og="done|${E(o.id)}|${p.id}">Mark done</button>`:""}${r.state==="blocked"?`<button class="btn primary" data-og="unblock|${E(o.id)}|${p.id}">Unblock</button>`:""}<button class="btn quiet" data-og="part|${E(o.id)}|${p.id}">Details</button></div></div></article>`}).join("")||'<p class="muted">Nothing in this view.</p>'}</div>${all.length>14?`<p class="muted small">Showing 14 of ${all.length}. Filter by state to narrow.</p>`:""}`}
const rowId=(o,p)=>(o.recs[p.id]||{}).id||"";
function guidesTab(){return `<p class="muted">Each guide is a set of parts. A part has a group, an owner, a duration, the parts it waits for and a condition on the answers. Edit a guide to add a part.</p>`+GUIDES.map(g=>{const lanes=uniq(g.parts.map(p=>p.lane));
  return `<section class="card glass svc3-gd"><div class="cardhead"><h3>${E(g.n)}</h3><div class="row"><span class="pill info">${g.parts.length} parts defined</span><span class="pill mute">${lanes.length} groups</span><span class="pill mute">${g.q.length} questions</span><button class="btn" data-og="addpart|${g.id}">Add a part</button><button class="btn primary" data-og="gstart|${g.id}">Try it</button></div></div>
  <div class="tscroll"><table class="svc-t svc3-t"><thead><tr><th>Part</th><th>Group</th><th>Owner</th><th>Days</th><th>SLA</th><th>Waits for</th><th>Included when</th><th>Process</th></tr></thead><tbody>${g.parts.map(p=>`<tr><td><b>${E(p.n)}</b>${p.item?` <span class="pill mute" title="Creates a real request item">${E(p.item)} item</span>`:""}</td><td><span class="svc3-lane-chip" style="--lc:var(${LANES[p.lane].c})">${E(LANES[p.lane].n)}</span> <small class="muted">${E(LANES[p.lane].g)}</small></td><td>${B.whx(LANES[p.lane].own==="@mgr"?"Hiring or line manager":LANES[p.lane].own)}</td><td class="num">${p.dur}</td><td class="num">${p.sla} d</td><td>${p.deps.length?p.deps.map(d=>E((g.parts.find(x=>x.id===d)||{n:d}).n)).join(", "):'<span class="muted">Starts at once</span>'}</td><td>${p.when?E(ctext(p.when,g)):'<span class="muted">Always</span>'}</td><td><button class="btn quiet" data-og="proc|og_p_${p.lane}">Open</button></td></tr>`).join("")}</tbody></table></div>
  <p class="muted small">Questions: ${g.q.map(q=>E(q.l)).join(" · ")}.</p></section>`}).join("")}
function procTab(){let ev=null;try{ev=window.CONTRACT&&CONTRACT.evaluate("svc_guides")}catch(e){}let mat=null;try{mat=window.PROCLIB&&PROCLIB.maturity("og_orchestrate")}catch(e){}
 const dec=(window.OGX&&OGX.decisions)||[];
 return `<div class="grid g2">${card("Orchestration process","How one order becomes many parts and closes.",`<ol class="svc3-steps">${["Place the order: who it is for, answers to the questions","Check policy: can the requester order for this person; manager approval skipped or required","Branch: add or remove parts from the answers","Create one fulfillment record per part and send each to its group","Track dependencies; start a part when everything it waits for is done","Watch the critical path; escalate parts that are blocked or late","Close the order and tell the requester and the person it is for"].map(s=>`<li>${E(s)}</li>`).join("")}</ol><div class="row"><button class="btn" data-og="proc|og_orchestrate">Open in the process library</button></div>`)}
 ${card("Maturity and contract",mat?"Process maturity from the shared model.":"Registering with the process library.",mat?`<dl class="kv"><dt>Level</dt><dd>${mat.level} of 5 (target ${mat.target})</dd><dt>Model</dt><dd>${E(mat.model||"")}</dd><dt>Gaps</dt><dd>${(mat.gaps||[]).map(E).join("<br>")||"None"}</dd></dl>${ev?`<dl class="kv"><dt>Feature contract</dt><dd><b>${ev.score}</b> of 4</dd></dl>`:""}`:'<p class="muted">Not registered yet.</p>')}</div>
 ${card("Data model decisions","Reuse first, extend second, add new last.",`<div class="tscroll"><table class="svc-t"><thead><tr><th>Entity</th><th>Decision</th><th>Why</th></tr></thead><tbody>${dec.map(d=>`<tr><td><b>${E(d.entity)}</b></td><td>${E(d.kind)}</td><td>${E(d.why)}</td></tr>`).join("")}</tbody></table></div>`)}
 <div class="grid g3">${["m_og_cycle","m_og_ontime","m_og_blocked","m_og_branch","m_rf_mgrap"].map(id=>`<div class="card glass" style="margin:0"><div class="eyebrow">${E(METRICS[id].n)}</div><div class="num" style="font-size:26px">${METRICS[id].cur}${METRICS[id].u==="%"?"%":" "+(METRICS[id].u||"")}</div>${fchip(id)}</div>`).join("")}</div>
 <section class="card glass"><div class="cardhead"><h3>Who can request for whom</h3></div><div class="grid g2"><div><b>Delegations on file for you</b>${DELEG.map(d=>`<div class="svc3-nx">${B.whx(d.for)}<span class="muted small">${E(d.scope)} until ${E(d.until)}</span></div>`).join("")}</div><div><b>Your reports</b><div class="row">${reportsOf(ME).map(n=>B.whx(n)).join("")}</div><p class="muted small">Rules: managers order for their reports; delegates on file order for the person who delegated; People team and service desk administrators order for anyone; everyone else needs the person's manager to approve; executives and AI agents are restricted.</p></div></div></section>
 ${typeof procCard==="function"?procCard("svc_guides"):""}`}
function screenGuides(){ensureO();syncM();const t=S3.tab||0;
 return `<div class="screen svc3-screen">${hdr()}${lensNote()}${views("svc3_tabs",["My orders","Start an order","Fulfiller queues","Guides","Process and data"],[ordersTab(),startTab(),queueTab(),guidesTab(),procTab()])}</div>`}
/* ---------- placing an order ---------- */
function place(gid){const g=GD(gid),it=B.ITEM(g.item);if(!it){toast("The catalog item for this guide is missing","warn");return}if(!rfOk(it))return;
 const A=wizAns(g);if(g.id==="project"&&!String(A.pname||"").trim()){toast("Give the project a name","warn");return}if(!A[g.need]){toast("Choose a date for \""+g.needL+"\"","warn");return}
 const P=polAll(it),fw=forNameX(),id="ORD-"+(++S3.seq);ensureO();
 const o={id,g:g.id,by:ME,forName:fw,fk:S3.kind,rel:P.rel,ans:Object.assign({},A),created:Math.floor(NOW/DAY)*DAY+9*36e5,team:S3.kind==="team"?S3.team.slice():null,nh:S3.kind==="newhire"?Object.assign({},S3.nh):null,deliver:S3.deliver||"",contact:S3.contact||"",log:[],recs:{},act:{}};
 o.A=ansOf(g,o.ans);o.nhMgr=S3.kind==="newhire"?S3.nh.mgr:null;o.target=msOf(o.A[g.need]);
 if(P.mgrAp==="required")o.gate={who:P.mgr,st:"pending",at:NOW};
 const inc=partsOf(g,o.A);
 inc.forEach(p=>{let rec={id:recId(p,o),type:"Catalog task"};
  if(p.item&&B.ITEM(p.item)){try{const li=B.ITEM(p.item),dv=B.defVals(li);const v=Object.assign({},dv,{reason:"New hire",deliver:o.A.remote?"Home (remote)":"Parker HQ desk",model:o.A.device==="Developer laptop"?"Developer 16-inch":o.A.device==="MacBook"?"MacBook Pro 16-inch":"Standard 14-inch"});
   B.setREL({by:ME,fw,rel:P.rel,mgr:P.mgr});const r=B.createReq(li,v,ME,fw,{rel:P.rel,fk:S3.kind,guide:o.id,deliver:o.deliver,contact:o.contact,relMgr:P.mgr});rec={id:r.id,type:"Request item",ritm:true};B.log(r,"Created by order guide "+o.id+" for part "+p.n)}catch(e){console.warn("svc3 part item",e)}}
  o.recs[p.id]=rec});
 if(!o.gate)inc.forEach(p=>{if(!(p.deps||[]).some(d=>inc.some(q=>q.id===d)))o.act[p.id]={s:0,prog:.05}});
 o.log.push({t:NOW,tx:"Order placed by "+ME+" for "+fw+" ("+(B.RELN[P.rel]||P.rel)+"). "+inc.length+" parts, "+uniq(inc.map(p=>LANES[p.lane].n)).length+" groups.",by:ME});
 o.log.push({t:NOW,tx:o.gate?"Waiting for manager approval from "+o.gate.who+" before any part starts":"Parts with no dependencies started in parallel: "+inc.filter(p=>o.act[p.id]).map(p=>LANES[p.lane].n).join(", "),by:"Oukala"});
 ORD.unshift(o);touchO(o);S3.sel=id;S3.wiz=false;S.v.svc3_tabs=0;B.setREL(null);
 if(fw!==ME&&human(fw)){try{B.NOTI("e12",fw,{id})}catch(e){}}if(o.gate){try{B.NOTI("e4",o.gate.who,{id})}catch(e){}}
 audit("placed order guide",id+" "+g.n+" by "+ME+" for "+fw+" ["+P.rel+"], "+inc.length+" parts");toast(id+" placed. "+inc.length+" parts sent to "+uniq(inc.map(p=>LANES[p.lane].n)).length+" groups"+(o.gate?"; waiting for "+o.gate.who+" to approve.":"."),"good");syncM();go("svc_guides");sv3()}
const forNameX=()=>forName();
function addPartForm(gid){const g=GD(gid);openForm({id:"svc3_ap",title:"Add a part to "+g.n,story:"A new part joins every future order of this guide whose answers match the condition. Existing orders do not change.",submit:"Add part",
 fields:[{k:"n",label:"Part name",type:"text",req:true},{k:"lane",label:"Group",type:"select",req:true,opts:laneKeys().map(k=>[k,LANES[k].n+" ("+LANES[k].g+")"])},{k:"dur",label:"Planned duration (business days)",type:"number",min:.5,max:30,step:.5,req:true},{k:"deps",label:"Waits for",type:"multi",opts:g.parts.map(p=>[p.id,p.n])},{k:"when",label:"Included when (optional)",type:"text",ph:"For example, remote or access in Privileged|Finance systems",help:"Use question keys: "+g.q.map(q=>q.k).join(", ")}],
 defaults:{lane:"hr",dur:1,deps:[]},live:v=>`<p class="story">${v.n?E(v.n):"This part"} runs in ${E((LANES[v.lane]||{n:""}).n)} for ${+v.dur||0} business days${(v.deps||[]).length?" after "+v.deps.map(d=>E((g.parts.find(p=>p.id===d)||{n:d}).n)).join(" and "):", starting as soon as the order is placed"}. ${v.when?"Included when "+E(ctext(v.when,g))+".":"Included on every order."}</p>`,
 onSubmit:v=>{const id="x"+(g.parts.length+1);g.parts.push(P(id,v.n,v.lane,+v.dur||1,v.deps||[],(v.when||"").trim(),{ctx:[]}));audit("added a part to an order guide",g.n+": "+v.n);toast("Part added to "+g.n,"good");closeDrawer();ORD.forEach(o=>o._v=(o._v||0)+1);sv3()}})}
document.addEventListener("click",e=>{const t=e.target.closest("[data-og]");if(!t)return;const a=String(t.getAttribute("data-og")).split("|"),x=a[0];
 const ob=a[1]&&OQ(a[1]);
 if(x==="new"){S3.wiz=false;S.v.svc3_tabs=1;go("svc_guides")}
 else if(x==="gstart"){S3.gid=a[1];S3.wiz=true;S3.kindItem=null;S.v.svc3_tabs=1;go("svc_guides");sv3()}
 else if(x==="back"){S3.wiz=false;sv3()}
 else if(x==="ans"){const q=GD(S3.gid);(S3.ans[S3.gid]=S3.ans[S3.gid]||{})[a[1]]=a.slice(2).join("|");sv3()}
 else if(x==="tog"){const g=GD(S3.gid),q=g.q.find(z=>z.k===a[1]),cur=(S3.ans[S3.gid]||{})[a[1]];(S3.ans[S3.gid]=S3.ans[S3.gid]||{})[a[1]]=!(cur===undefined?q.d:cur);sv3()}
 else if(x==="order"){S3.sel=a[1];S.v.svc3_tabs=0;try{closeDrawer()}catch(e2){}go("svc_guides");sv3()}
 else if(x==="part")partDrawer(a[1],a[2]);
 else if(x==="rec")recDrawer(a[1],a[2]);
 else if(x==="proc"){if(window.PROCLIB&&PROCLIB.open)PROCLIB.open(a[1]);else toast("The process library is not loaded","info")}
 else if(x==="start"&&ob){startPart(ob,a[2]);}
 else if(x==="done"&&ob){donePart(ob,a[2]);try{closeDrawer()}catch(e2){}}
 else if(x==="block"&&ob)blockPart(ob,a[2]);
 else if(x==="unblock"&&ob){unblockPart(ob,a[2]);try{closeDrawer()}catch(e2){}}
 else if(x==="gate"&&ob)gateAct(ob);
 else if(x==="lane"){S3.fq=a[1];sv3()}
 else if(x==="fst"){S3.fstate=a[1];sv3()}
 else if(x==="addpart")addPartForm(a[1]);
 else if(x==="place")place(a[1])});
document.addEventListener("change",e=>{const t=e.target.closest("[data-og-a]");if(!t)return;const k=t.getAttribute("data-og-a"),g=GD(S3.gid);if(!g)return;const q=g.q.find(z=>z.k===k);(S3.ans[S3.gid]=S3.ans[S3.gid]||{})[k]=q&&q.t==="number"?+t.value:t.value;sv3()});
/* ---------- registration: screen, process, search, chat, person 360 ---------- */
REG("svc_guides","Order guides","service","M4 6h6v5H4zM14 6h6v5h-6zM4 14h6v5H4zM14 14h6v5h-6zM10 8.5h4M10 16.5h4M7 11v3M17 11v3",screenGuides);
if(window.PROC&&PROC.reg)PROC.reg("svc_guides",{title:"Order guide: place, branch, fan out, track, close",std:["itil4","bpmn"],steps:[
 {n:"Place the order",d:"Who it is for, the answers, delivery contact.",who:"human",owner:"Requester",sla:"Minutes",in:"A need",out:"Order"},
 {n:"Check policy",d:"Can the requester order for this person; manager approval skipped or required.",who:"auto",owner:"Oukala automation",sla:"Instant",in:"Order",out:"Approval path"},
 {n:"Manager approval",d:"Only when the requester is not the manager or a delegate.",who:"gate",owner:"Manager of the person",sla:"1 day",in:"Approval path",out:"Approved order"},
 {n:"Branch and fan out",d:"Answers add or remove parts; one record per part goes to its group.",who:"auto",owner:"Oukala automation",sla:"Instant",in:"Approved order",out:"Part records"},
 {n:"Fulfill the parts",d:"Each group works its part; a part starts when everything it waits for is done.",who:"human",owner:"Fulfillment groups",sla:"Per part SLA",in:"Part record",out:"Done part"},
 {n:"Watch the critical path",d:"Forecast date, slack, blocked parts, escalation.",who:"agent",owner:"Order Guide Watcher",sla:"Continuous",in:"Part states",out:"Alerts"},
 {n:"Close and tell",d:"Requester and the person it is for are told.",who:"auto",owner:"Oukala automation",sla:"Instant",in:"All parts done",out:"Closed order"}]});
SEARCHX.push(()=>{ensureO();return GUIDES.map(g=>({g:"Order guides",t:g.n,m:g.parts.length+" parts",c:"--p4",f:()=>{S3.gid=g.id;S3.wiz=true;S3.kindItem=null;S.v.svc3_tabs=1;go("svc_guides")},k:"order guide multi part "+g.blurb+" "+g.parts.map(p=>p.n).join(" ")})).concat(ORD.slice(0,SCALE&&SCALE.on?300:40).map(o=>({g:"Orders",t:o.id+" "+g_n(o),m:OST[planOf(o).st][0],c:"--p3",f:()=>{S3.sel=o.id;S.v.svc3_tabs=0;go("svc_guides")},k:o.by+" "+o.forName+" order guide "+g_n(o)})))});
SEARCHX.push(()=>[{g:"Actions",t:"Order for someone else",m:"Who is this for: myself, someone else, a new hire, a team",c:"--accent",f:()=>go("svc_portal"),k:"requested for on behalf of delegate order for my report new hire manager approval"}]);
ASKX.push(q=>{const t=String(q).toLowerCase();let m;ensureO();
 if((m=/ord-?\s?(\d{4})/.exec(t))){const o=OQ("ORD-"+m[1]);if(o){const pl=planOf(o);S3.sel=o.id;S.v.svc3_tabs=0;go("svc_guides");const bl=pl.inc.filter(p=>pl.R[p.id].state==="blocked").map(p=>LANES[p.lane].n+": "+p.n);
  say(q,{t:`<b>${E(o.id)} ${E(g_n(o))}</b>: ${OST[pl.st][0]}. ${pl.done} of ${pl.n} parts done (${pl.pct}%). Expected ${fdw(pl.eta)}${pl.target?`; needed ${fd(pl.target)}`:""}. Critical path: ${E(crumb(pl))}.${bl.length?" Blocked: "+E(bl.join("; "))+".":""} Requested by ${E(o.by)} for ${E(o.forName)}.`,steps:["Read the order and its parts","Recomputed the forecast from part progress"]});return true}}
 if(/(order guide|multi.?part|onboarding order|offboarding order)/.test(t)&&/(status|late|risk|blocked|open|how many|where)/.test(t)){const s=stats();go("svc_guides");say(q,{t:`<b>${s.open} open order-guide orders</b>: ${s.risk} at risk, ${s.blocked} blocked, ${s.gate} waiting for a manager. ${s.blockedParts} of ${s.openParts} open parts are blocked. Median cycle time is ${s.cyc||"n/a"} business days.`,steps:["Counted orders by forecast state"]});return true}
 if((m=/(start|place|open|new).*(onboarding|offboarding|role change|location change|project kickoff|office move|event).*?(?:for|of)?\s*([A-Z][a-z]+ [A-Z][a-z]+)?/i.exec(q))&&/(onboarding|offboarding|role|location|project|office|event)/.test(t)){const kw=m[2].toLowerCase(),g=GUIDES.find(z=>kw.indexOf(z.id.slice(0,5))===0||z.n.toLowerCase().includes(kw))||(kw.includes("role")||kw.includes("location")?GD("move"):kw.includes("project")?GD("project"):kw.includes("office")||kw.includes("event")?GD("facevent"):GD("onboarding"));
  S3.gid=g.id;S3.wiz=true;S3.kindItem=null;S.v.svc3_tabs=1;go("svc_guides");say(q,{t:`Opened the <b>${E(g.n)}</b> guide. It has ${g.parts.length} parts across ${uniq(g.parts.map(p=>p.lane)).length} groups; your answers decide which apply.`,steps:["Opened the order guide"]});return true}
 if(/(who can i (order|request) for|on behalf|order for someone|delegat(e|ion))/.test(t)){go("svc_guides");S.v.svc3_tabs=4;say(q,{t:`You can order for <b>${reportsOf(ME).length} people</b> you manage or lead without a manager approval, and for ${DELEG.map(d=>E(d.for)).join(" and ")} as a delegate. For anyone else their manager is asked to approve; executives and AI agents are restricted.`,steps:["Read reporting lines and delegations"]});return true}
 return false});
WORK.push({kind:"Order guide parts",tag:"OGP",fn:name=>{ensureO();const out=[];ORD.forEach(o=>{if(out.length>=10)return;const pl=planOf(o);pl.inc.forEach(p=>{const r=pl.R[p.id];if(r.state==="done"||ownerOf(p,o)!==name)return;out.push({id:rowId(o,p),t:p.n,sub:o.id+" · "+LANES[p.lane].n+" · "+(g_n(o)),due:"Expected "+fd(addBiz(o.created,r.fef)),st:r.state==="blocked"?"bad":r.crit?"warn":"info",hrs:2,go:()=>{S3.sel=o.id;go("svc_guides");partDrawer(o.id,p.id)}})})});return out}});
/* ---------- the catalog: add the office move or event item the guide hangs on ---------- */
try{if(!B.ITEM("facevent")){const base=B.ITEM("av");if(base)B.CAT.push(Object.assign({},base,{id:"facevent",n:"Office move or event",short:"An order guide for an office move or an event: space, AV, catering, visitors and budget, only the parts you need.",pop:34}))}}catch(e){console.warn("svc3 catalog item",e)}
/* ---------- data model, process library, module map: registered lazily (modules load alphabetically) ---------- */
const W={},WS={};
const tryv=(f,d)=>{try{return f()}catch(e){return d}};
function wire(){try{
 if(window.NAVX&&NAVX.add&&!W.nav){NAVX.add("svc_guides",{group:"help",label:"Order several things at once",hint:"Order guides: new hire, offboarding and status change, move, project, event",sub:"",kw:"order guide multi part onboarding offboarding new hire leaver role change location move project kickoff office event requested for on behalf delegate swimlane critical path"});W.nav=true}
 if(!W.ent&&window.ATLAS&&ATLAS.addEntity&&window.COVER&&COVER.recs){
  const fld=(k,label,type,cls,req,au)=>({k,label,type,authority:au||"platform",classification:cls||"internal",req:!!req});
  const defs=[{id:"order_guide_part",label:"Order guide part",domain:"service",source:"Order guides",ownerApp:"svc_guides",ownerMod:"svc_guides",status:"proposed",note:"A part template on an order guide: the group that fulfills it, its owner, planned duration, SLA, the parts it waits for, the condition on the answers that includes it, and its process.",
   fields:[fld("guide_ref","Order guide (a catalog item)","ref","internal",1),fld("part_key","Part key","string","internal",1),fld("name","Part name","string","internal",1),fld("group_ref","Fulfillment group","ref","internal",1),fld("owner_ref","Owner","ref","personal"),fld("duration_days","Planned duration (business days)","number","internal",1),fld("sla_days","SLA (days)","number","internal"),fld("depends_on","Waits for (part keys)","list","internal"),fld("when_expr","Included when (condition on answers)","text","internal"),fld("process_ref","Process in the library","ref","internal"),fld("item_ref","Catalog item it creates","ref","internal")],
   decision:"New, thin. catalog_task is an instance of work, not a template; a part template also needs its dependency list, condition and process link. The guide itself is a catalog_item (reused).",searched:"catalog_item, catalog_task, request_item, process_definition, approval"},
  {id:"guide_order",label:"Order guide order",domain:"service",source:"Order guides",ownerApp:"svc_guides",ownerMod:"svc_guides",status:"proposed",note:"The parent of a multi-part order: guide, who requested, who it is for, their relationship, the policy result, the answers, the need-by date, the forecast finish and the critical path. Parts are catalog tasks and request items that point back to it.",
   fields:[fld("order_id","Order id","string","internal",1),fld("guide_ref","Order guide","ref","internal",1),fld("requested_by","Requested by","ref","personal",1),fld("requested_for","Requested for","ref","personal",1),fld("relationship","Relationship (self, report, delegate, other, new hire)","enum","internal",1),fld("policy_result","Policy result","enum","internal"),fld("manager_approval","Manager approval (skipped, required, approved)","enum","internal"),fld("answers","Answers","json","confidential"),fld("need_by","Need-by date","date","internal"),fld("forecast_finish","Forecast finish","date","internal"),fld("critical_path","Critical path (part keys)","list","internal"),fld("status","Status","enum","internal",1)],
   decision:"New, thin. request_item is one line; a multi-part order needs a parent that groups many request items and catalog tasks and holds the answers and forecast.",searched:"request_item, catalog_item, catalog_task, approval, demand_request"},
  {id:"request_delegation",label:"Request delegation",domain:"service",source:"Order guides",ownerApp:"svc_guides",ownerMod:"svc_guides",status:"proposed",note:"A person allows another person to request on their behalf: who, for whom, scope and expiry.",
   fields:[fld("delegate_ref","Delegate","ref","personal",1),fld("principal_ref","On behalf of","ref","personal",1),fld("scope","Scope","string","internal"),fld("valid_until","Valid until","date","internal",1),fld("status","Status","enum","internal")],
   decision:"New, thin. The delegation of authority records are about money; this is about who may raise requests for whom.",searched:"delegation, approval, person"}];
  const r=defs.map(d=>tryv(()=>ATLAS.addEntity(d),null));
  const add=(key,label,ent,how,n,path)=>{if(!COVER.recs.some(x=>x.key===key))COVER.recs.push({key,label,scr:["svc_guides"],mod:"svc_guides",n,ent,how,path:path||key})};
  add("OGX_ORDERS","Order guide orders","guide_order","new",13,"S.svc3.orders");add("OGX_PARTS","Order guide part templates","order_guide_part","new",11,"OGX.guides");add("OGX_DELEG","Request delegations","request_delegation","new",5,"RF.delegations");add("OGX_TASKS","Part fulfillment records","catalog_task","ext",9,"OGX.orders.recs");add("REQ_FOR","Requested for on requests","request_item","ext",6,"REQREG.for");
  window.OGX.decisions=[{entity:"catalog_item",kind:"Reuse",why:"An order guide is a catalog item; its questions and approvals are the item's."},{entity:"order_guide_part",kind:"New, thin",why:defs[0].decision},{entity:"guide_order",kind:"New, thin",why:defs[1].decision},{entity:"request_delegation",kind:"New, thin",why:defs[2].decision},{entity:"request_item",kind:"Extend by reference",why:"Adds requested_for, relationship, delivery location, delivery contact and manager approval mode so every request records both requested by and requested for."},{entity:"catalog_task",kind:"Reuse, extend",why:"Each part's fulfillment record is a catalog task with part key and dependency fields."},{entity:"approval",kind:"Reuse",why:"Manager approval on behalf requests is an approval record in the Needs you inbox."},{entity:"person",kind:"Reuse",why:"Requested by and for are people; a new hire becomes a person record at the hire date."},{entity:"audit_event, notification",kind:"Reuse",why:"Every placement, part change and beneficiary notice uses the shared audit and notification records."}];
  window.OGX.entWarn=r.map(x=>x&&x.warnings).filter(Boolean);W.ent=true}
 if(!W.mod&&W.ent&&window.MODMAP&&MODMAP.addModule&&tryv(()=>MODMAP.modules.some(m=>m.id==="svc_cat")&&MODMAP.modules.some(m=>m.id==="flw_appr"),false)){
  const r=MODMAP.addModule({id:"svc_guides",name:"Order guides",sn:"Order guides",band:tryv(()=>MODMAP.modules.find(m=>m.id==="svc_cat").band,"ops"),own:"Service catalog manager",proposed:false,
   r:["catalog_item","request_item","catalog_task","person","approval","notification"],w:["guide_order","order_guide_part","request_delegation","catalog_task","request_item","approval","audit_event","notification"],
   flows:[{dir:"pull",other:"svc_cat",data:"Guide definitions, questions and approval rules",entity:"catalog_item",mode:"api",trig:"Order started"},{dir:"pull",other:"svc_portal",data:"Who it is for and the answers",entity:"request_item",mode:"human",trig:"Order placed in the portal"},
    {dir:"push",other:"svc_req",data:"One fulfillment record per part",entity:"catalog_task",mode:"event",trig:"Order approved and branched"},{dir:"push",other:"flw_appr",data:"Manager approval on behalf requests",entity:"approval",mode:"human",trig:"Requester is not the manager"},
    {dir:"push",other:"svc_sla",data:"Part SLAs and the order's forecast finish",entity:"catalog_task",mode:"event",trig:"Part created or changed"},{dir:"push",other:"adm_audit",data:"Order, part and policy decisions",entity:"audit_event",mode:"event",trig:"Any change"}]});
  if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=true;window.OGX.modWarn=r&&r.warnings}
 if(W.mod&&!W.inb&&window.MODMAP&&MODMAP.addFlows&&tryv(()=>MODMAP.modules.some(m=>m.id==="inbox"),false)){const r=tryv(()=>MODMAP.addFlows([{from:"svc_guides",to:"inbox",dir:"push",data:"Approvals and parts that need a person",entity:"approval",mode:"human",trig:"Part becomes ready or blocked"}]),null);W.inb=true;window.OGX.inbWarn=r&&r.warnings}
 if(!W.proc&&W.mod&&window.PROCLIB&&PROCLIB.addProcess){
  const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
  const ok=r=>r&&(r.ok||/already exists/.test((r.warnings||[]).join(" ")));let all=true;
  const r0=PROCLIB.addProcess({id:"og_orchestrate",name:"Order guide: place, branch, fan out, track and close",module:"svc_guides",family:"req",owner:"Tom Becker",backup:"Nia Brooks",trigger:"A requester starts an order guide",std:["itil4","bpmn"],
   steps:[st("Place the order","Who it is for (myself, someone else, a new hire, a team), delivery contact and the guide's questions. RACI: Responsible requester, Accountable service catalog manager, Informed the person it is for.","human","Requester","Minutes","A need","Order"),
    st("Check policy","Can this requester order for this person; manager approval skipped for managers and delegates, required otherwise.","auto","Oukala automation","Instant","Order","Approval path"),
    st("Manager approval","Decided by the person's manager when the requester is not their manager or a delegate. RACI: Responsible manager, Accountable service catalog manager.","gate","Manager of the person","1 day","Approval path","Approved order"),
    st("Branch and fan out","Answers add or remove parts; one fulfillment record per part goes to its group.","auto","Oukala automation","Instant","Approved order","Part records"),
    st("Fulfill each part","Each group runs its own process, SLA and queue; a part starts when everything it waits for is done.","human","Fulfillment groups","Per part","Part record","Done part"),
    st("Watch the critical path","Forecast finish, slack, blocked parts; escalate to the part owner.","agent","Order Guide Watcher","Continuous","Part states","Alerts"),
    st("Close and notify","Requester and the person it is for are told; metrics updated.","auto","Oukala automation","Instant","All parts done","Closed order")],
   inputs:["Guide definition","Answers","Policy rules"],outputs:["Part records","Closed order","Audit trail"],entities:["guide_order","order_guide_part","catalog_task","request_item","approval"],metrics:["m_og_cycle","m_og_ontime","m_og_blocked","m_og_branch","m_rf_mgrap"],model:"itil"});
  all=all&&ok(r0);
  const who_={human:"human",it:"human"};
  Object.keys(LANES).forEach(k=>{const L=LANES[k],ss=LSTEPS[k];const r=PROCLIB.addProcess({id:"og_p_"+k,name:L.n+" part of an order guide: "+L.g,module:"svc_guides",family:"req",owner:L.own==="@mgr"?"Tom Becker":L.own,backup:"Nia Brooks",trigger:"A part is created for "+L.g+" by an order guide",std:["itil4"],
    steps:ss.map((d,i)=>st(d,d+". Part SLA from the guide.",i===0?"human":i===ss.length-1?"auto":"human",L.own==="@mgr"?"Hiring or line manager":L.own,"Per part","Part record",i===ss.length-1?"Done part":"Work in progress")),inputs:["Part record","Order context"],outputs:["Done part"],entities:["catalog_task","guide_order"],metrics:["m_og_cycle","m_og_blocked"],model:"itil"});all=all&&ok(r)});
  if(all)W.proc=true;window.OGX.procState=all}
 }catch(e){console.error("svc3 wire",e)}
 window.OGX.wired=!!(W.nav&&W.ent&&W.mod&&W.proc);
 if(W.mod&&W.proc&&!W.ref&&window.MODMAP&&MODMAP.refresh){W.ref=1;tryv(()=>MODMAP.refresh())}}
window.OGX={guides:GUIDES,lanes:LANES,orders:()=>{ensureO();return ORD},plan:o=>planOf(typeof o==="string"?OQ(o):o),guideOf:itemId=>GUIDES.find(g=>g.item===itemId),start:id=>{const g=guideOf(id);if(!g)return false;S3.gid=g.id;S3.wiz=true;S3.kindItem=null;S.v.svc3_tabs=1;go("svc_guides");return true},stats,cond,decisions:[],wire,wireState:W,place,open:id=>{S3.sel=id;S.v.svc3_tabs=0;go("svc_guides")}};
[700,2200,5000,9000].forEach(t=>setTimeout(wire,t));
syncM();
})();
