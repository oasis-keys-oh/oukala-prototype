/* Inbox (Round 11, Agent I). One place for everything that needs the signed-in person:
   approvals, actions, mentions and alerts, gathered from the modules that own them.
   Every approval acts through the owning module, so its state, audit trail and downstream effects match its own screen.
   Decisions wait 8 seconds so they can be undone, then go through the owner. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const NOW0=U.todayDate().getTime()+16*36e5;         /* the prototype's "today": Tue Oct 6 2026 */
const USERS={exec:"Casey Rowan",fin:"Avery Chen",pm:"Priya Shah",ops:"Tom Becker"};
/* PR-28: every role approves as its own identity (R15D.me); the four core personas keep their named users */
const ME=()=>{if(USERS[S.persona])return USERS[S.persona];try{const p=PERSONAS[S.persona];if(p&&p.as&&window.R15D&&R15D.me){const n=R15D.me().name;if(n)return n}}catch(e){}return "Casey Rowan"};
const FIRST=n=>String(n||"").split(/[ (]/)[0];
const UNDO_MS=8000;
const I=S.inbox=S.inbox||{};
Object.assign(I,{snz:I.snz||{},hist:I.hist||[],dele:I.dele||[],pend:I.pend||{},sel:I.sel||{},cur:I.cur||null,tab:I.tab||"all",ui:I.ui||null,
 prefs:I.prefs||{},quiet:I.quiet||{on:true,from:"20:00",to:"07:00"},pol:I.pol||null,views:I.views||[],sim:I.sim!==false,simItems:I.simItems||[],simN:I.simN||0,
 decided:I.decided||0,undone:I.undone||0,session:I.session||{done:0,total:0},bulkMax:I.bulkMax||5000,evOpen:I.evOpen===true,flt:I.flt||{},seenBanner:I.seenBanner||{},waitH:I.waitH||[],sessions:I.sessions||0});
const KINDS={approval:["Approvals","--accent"],action:["Actions","--p4"],mention:["Mentions and alerts","--warn-f"]};
const IC={invoice:"M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",change:"M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4",catalog:"M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
 budget:"M3 6h18v12H3zM3 10h18M7 15h3",release:"M12 3c4 2 6 6 5 11l-5 4-5-4c-1-5 1-9 5-11zM9 20l3-2 3 2",access:"M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z",task:"M5 12l4 4 10-10M4 4h16v16H4z",
 alert:"M12 3l9 16H3zM12 10v4M12 17h.01",mention:"M16 12a4 4 0 1 1-4-4 4 4 0 0 1 4 4v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5",gate:"M4 20V4M4 5h12l-2 4 2 4H4",doc:"M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
 people:"M16 8a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM5 20a7 7 0 0 1 14 0",data:"M4 6c0-2 16-2 16 0v12c0 2-16 2-16 0zM4 12c0 2 16 2 16 0",bell:"M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
 meet:"M4 5h16v11H9l-5 4zM8 9h8M8 12h5",debt:"M12 3v18M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",book:"M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",plug:"M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3",
 contract:"M6 3h9l4 4v14H6zM9 12h7M9 16h5",star:"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",chev:"M9 6l6 6-6 6",x:"M6 6l12 12M18 6L6 18",gear:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 21h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",sleep:"M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"};
const svgI=(k,s)=>`<svg class="inbx-i" width="${s||18}" height="${s||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[k]||IC.task}"/></svg>`;
const money0=n=>typeof money==="function"?money(n):"$"+Math.round(n).toLocaleString("en-US");
const dueFromISO=(iso,leadH)=>{const t=Date.parse(iso+"T17:00:00Z");return isFinite(t)?(t-NOW0)/36e5-(leadH||0):96};
const dueFromText=t=>{t=String(t||"");if(/overdue/i.test(t))return -12;let m=t.match(/^(\d+)\s*d/i);if(m)return +m[1]*24;m=t.match(/^(\d+)\s*h/i);if(m)return +m[1];m=t.match(/^([A-Z][a-z]{2})\s+(\d{1,2})/);if(m){const mo="JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[1])/3;if(mo>=0){const d=Date.UTC(2026,mo,+m[2],17);return (d-NOW0)/36e5}}return 96};
const grpOf=h=>h<0?"Overdue":h<=24?"Due today":h<=24*7?"This week":"Later";
const GRP=["Overdue","Due today","This week","Later"];
const fmtH=h=>{const a=Math.abs(h);const s=a<1?Math.round(a*60)+" min":a<48?Math.round(a)+" h":Math.round(a/24)+" d";return h<0?s+" late":s+" left"};
const ageTxt=h=>h<1?"just now":h<48?Math.round(h)+" h ago":Math.round(h/24)+" d ago";
const tone=t=>t==="good"?"good":t==="bad"?"bad":t==="warn"?"warn":"info";
let VER=0;const bump=()=>{VER++;CACHE=null};
let CACHE=null,CKEY="",CT=0;

/* ---------- helpers that act through the owning module ---------- */
/* Click a hidden control that the owning module's own delegated handler listens for. */
function clickVia(attrs){const b=document.createElement("button");b.type="button";Object.entries(attrs).forEach(([k,v])=>b.setAttribute(k,v));b.style.display="none";document.body.appendChild(b);try{b.click()}finally{b.remove()}}
/* Run a module's own form submit handler with values we collected in the inbox (the form itself is not shown). */
function viaForm(formId,trigger,values){const orig=window.openForm;let hit=null;window.openForm=function(spec){if(spec&&spec.id===formId){hit=spec;return}return orig.apply(this,arguments)};
 try{trigger()}catch(e){window.openForm=orig;return{ok:false,why:String(e&&e.message||e)}}window.openForm=orig;
 if(!hit)return{ok:false,why:"The owning module did not offer that action"};
 try{const r=hit.onSubmit(Object.assign({},hit.defaults||{},values||{}));if(r&&r.close===false&&r.toast===undefined)return{ok:false,why:"The module asked for more information"};return{ok:true,res:r}}catch(e){return{ok:false,why:String(e&&e.message||e)}}}
const personKind=n=>G(()=>(who(n)||{}).kind,"human");

/* ---------- item normalizer ---------- */
function mk(o){const it=Object.assign({kind:"approval",cat:"Approval",ic:"task",title:"",req:"",ageH:0,dueH:96,amt:null,risk:"low",why:"",ai:null,guard:"",ev:[],extra:"",can:{approve:false,reject:false,delegate:false},blk:"",rec:"",needNote:false,vendor:"",sim:false,openLabel:"Open",open:()=>{}},o);
 it.group=grpOf(it.dueH);it.urgent=it.dueH<0||it.risk==="high"||it.dueH<4||!!it.flag;it.sc=(it.urgent?0:1)*1e6+({approval:0,action:1,mention:2}[it.kind]||0)*1e4+Math.max(-48,it.dueH)+(it.risk==="high"?-30:0)+(it.src==="debt"||it.src==="work"?100:0);return it}
const mkAI=(sum,conf,model,srcs,rec)=>({sum:sum,conf:conf,model:model,srcs:srcs||[],rec:rec||""});

/* ---------- adapters: one per owning module ---------- */
const ADP={};
const defAdp=(key,def)=>{ADP[key]=Object.assign({key,label:key,wired:false,list:()=>[]},def)};

/* Workflow approvals (FLOWX): the approvals inbox itself */
const KL={budget:"Budget",contract:"Contract",sla:"Service level",service:"Service change",change:"Change request",security:"Security review",access:"Access request",demand:"Demand",release:"Release",catalog:"Catalog request"};
const KI={budget:"budget",contract:"contract",sla:"doc",service:"catalog",change:"change",security:"access",access:"access",demand:"budget",release:"release",catalog:"catalog"};
defAdp("flow",{label:"Workflow approvals",mod:"Workflow designer",fn:"FLOWX.pending, FLOWX.approve",wired:true,
 list(me){if(!(window.FLOWX&&FLOWX.pending&&FLOWX.approvals))return[];const full=new Map(FLOWX.approvals().map(x=>[x.id,x]));
  return FLOWX.pending(me).slice(0,700).map(p=>{const x=full.get(p.id)||{};const ai=x.ai||{};const d=G(()=>window.DOA&&p.amount!=null?DOA.approverFor(p.amount,x.kind==="budget"?"budget":"",p.requester):null,null);
   const dl=x.dlg&&x.dlg.to===me;const why=dl?"Delegated to you by "+x.dlg.by+(x.dlg.why?" ("+x.dlg.why+")":""):d?"Delegation of authority: "+(d.why&&d.why[0]||"tier "+d.tier)+" You hold the "+d.role+" role.":"You hold a role that approves "+(KL[p.kind]||p.kind).toLowerCase()+" items.";
   const sla=x.sla||48;return mk({id:"flow:"+p.id,src:"flow",sid:p.id,cat:KL[p.kind]||p.kind,ic:KI[p.kind]||"task",title:p.title,req:p.requester,ageH:x.age||0,slaH:sla,dueH:p.hoursLeft,amt:p.amount,risk:p.risk,why,
    ai:mkAI(ai.why||x.why||"",ai.conf||.8,"Approval Advisor",ai.src,ai.d),rec:ai.d||"",blk:p.blocked?"A required assessment gate is not passing, so this cannot be approved yet.":"",
    guard:p.blocked?"Blocked by a required gate (hard stop).":"AI recommends only. Separation of duties: the requester cannot approve. "+(p.risk==="high"?"High risk: bulk approval is off.":"Within your delegated authority."),
    ev:(x.ev||[]).map(e=>Array.isArray(e)?e:[e.l,e.v,e.t]).concat(x.why?[["Context",x.why,""]]:[]),
    needNote:(ai.d==="reject"||ai.d==="return"),flag:p.blocked,can:{approve:!p.blocked,reject:true,delegate:true},kindKey:p.kind,
    open:()=>go("flw_appr",p.id)})})},
 approve(it,note){return window.FLOWX&&FLOWX.approve?FLOWX.approve(it.sid,"approve",note||"Approved from the inbox"):{ok:false,why:"Workflow module is not loaded"}},
 reject(it,why){return FLOWX.approve(it.sid,"reject",why||"Rejected from the inbox")},
 delegate(it,to,why){return viaForm("apx_dlg",()=>clickVia({"data-apx-act":it.sid+"|delegate"}),{to,why})},
 check(it){const x=G(()=>FLOWX.approvals().find(a=>a.id===it.sid),null);return x?{st:x.st,hist:(x.hist||[]).length}:null}});

/* Invoice approval (the inv screen) */
defAdp("inv",{label:"Invoice approval",mod:"Invoice approval screen",fn:"data-decide handler",wired:true,
 list(me){if(typeof INVOICES==="undefined")return[];const out=[];INVOICES.forEach(i=>{if(S.dec[i.id])return;
   const mine=S.persona==="fin"||S.persona==="exec"&&(i.amt>=50000||i.rec!=="approve");if(!mine)return;
   const bad=i.checks.filter(c=>c[1]==="bad").length,warn=i.checks.filter(c=>c[1]==="warn").length;const days=dueFromISO("2026-"+("Oct"===i.due.slice(0,3)?"10":"11")+"-"+String(i.due.replace(/\D/g,"")).padStart(2,"0"),48);
   out.push(mk({id:"inv:"+i.id,src:"inv",sid:i.id,cat:"Invoice",ic:"invoice",title:i.id+" "+i.vendor,req:i.vendor,reqExt:true,ageH:48,slaH:i.rec==="approve"?120:72,dueH:Math.min(days,i.rec==="approve"?96:30),amt:i.amt,risk:bad?"high":warn?"med":"low",vendor:i.vendor,
    why:S.persona==="fin"?"You hold the Finance approver role; invoices are yours up to your limit.":"Escalated to the CIO: the advisor recommends "+i.rec+(i.amt>=50000?" and the amount is over the finance approver limit.":"."),
    ai:mkAI(i.story,i.conf,"Invoice Advisor",["Purchase order","Contract","Acceptance records","Budget"],i.rec),rec:i.rec,needNote:i.rec!=="approve",flag:i.rec!=="approve",
    guard:"The advisor recommends "+i.rec+". Deciding against it is logged as an override and needs a reason.",
    ev:i.checks.map(c=>[c[0],c[2],tone(c[1])]),
    extra:`<div class="inbx-led"><b>Ledger</b><span>Contract ${money0(i.led.total)}</span><span>Paid ${money0(i.led.paid)}</span><span>Accepted work ${money0(i.led.earned)}</span></div>`,
    can:{approve:true,reject:true,delegate:false},delegateWhy:"Invoice approval has no per-item delegation. Use a delegation rule in My inbox settings.",
    open:()=>go("inv",i.id)}))});return out},
 _decide(it,val,note){const prev=S.inv;S.inv=it.sid;let ta=null;if(note){ta=document.createElement("textarea");ta.id="why";ta.value=note;ta.style.display="none";document.body.appendChild(ta)}
  try{clickVia({"data-decide":val})}finally{if(ta)ta.remove();}return S.dec[it.sid]===val?{ok:true}:{ok:false,why:"The invoice screen did not record the decision"}},
 approve(it,note){return this._decide(it,"Approved",note)},reject(it,why){return this._decide(it,"Rejected",why)},
 check(it){return{st:S.dec[it.sid]||"pending"}}});

/* Changes: CAB approvals (ITSMX) */
defAdp("chg",{label:"Change approvals (CAB)",mod:"Changes",fn:"ITSMX.approve, change approval form",wired:true,
 list(me){if(!(window.ITSMX&&ITSMX.changes))return[];const out=[];const all=ITSMX.changes;
  all.filter(c=>c.st==="Authorize"&&c.req!==me).forEach(c=>{(c.stages||[]).forEach((s,si)=>(s.ap||[]).forEach((a,ai)=>{if(a.dec!=="pending")return;if(!(a.w===me||a.deleg===me||(a.w==="CIO"&&me==="Casey Rowan")))return;
    const sod=a.sod?a.sod:"";const left=(s.sla||24)-(c.subH||0);const clash=all.filter(o=>o.id!==c.id&&o.svc===c.svc&&o.st!=="Closed"&&o.st!=="Cancelled"&&o.start&&c.start&&o.start<=c.end&&o.end>=c.start).map(o=>o.id+" "+o.t);
    const hi=c.type==="Emergency"||(c.env==="Production"&&(c.cost||0)>=40000);const risk=hi?"high":c.type==="Standard"?"low":"med";
    out.push(mk({id:"chg:"+c.id+":"+si+":"+ai,src:"chg",sid:c.id,sx:si,ax:ai,cat:"Change",ic:"change",title:c.id+" "+c.t,req:c.req,ageH:c.subH||0,slaH:s.sla||24,dueH:left,amt:c.cost||null,risk,
     why:(a.w===me?"You are the named approver":"Delegated to you by "+a.w)+" for "+a.r+" ("+s.n+")."+(sod?" "+sod:""),
     ai:mkAI(c.just||"",hi?.72:.86,"Change Advisor",["Change record","Service map","Calendar"],hi?"conditions":"approve"),rec:hi?"conditions":"approve",
     guard:"Change Advisory Board rule: "+s.n+" ("+(s.quorum||"all")+" must approve). The requester cannot approve their own change.",
     ev:[["Type",c.type+" change, "+c.env,""],["Service",c.svc,""],["Window",c.start+" "+(c.win||""),""],["Cost",c.cost?money0(c.cost):"None",""],["Collision check",clash.length?clash.length+" overlap: "+clash.slice(0,2).join("; "):"No overlapping change on this service",clash.length?"warn":"good"],["Back-out plan",String(c.back||"").split("\n")[0].slice(0,140),"info"],["Testing",String(c.test||"").slice(0,140),"info"]],
     extra:`<div class="inbx-led"><b>Approval path</b>${(c.stages||[]).map(st=>`<span>${H(st.n.split(":")[0])}: ${(st.ap||[]).map(x=>H(FIRST(x.w))+" "+(x.dec==="pending"?"waiting":x.dec)).join(", ")}</span>`).join("")}</div>`,
     can:{approve:true,reject:true,delegate:true},open:()=>{go("itsm_chg");clickVia({"data-itsm-a":"chgo","data-id":c.id})}}))}))});return out},
 approve(it,note){return window.ITSMX?ITSMX.approve(it.sid,ME(),note):{ok:false,why:"ITSM module is not loaded"}},
 reject(it,why){const r=viaForm("itsm_cab",()=>clickVia({"data-itsm-a":"cab","data-id":it.sid+":"+it.sx+":"+it.ax+":rejected"}),{why});try{closeDrawer()}catch(e){}return r},
 delegate(it,to,why){const r=viaForm("itsm_cab",()=>clickVia({"data-itsm-a":"cab","data-id":it.sid+":"+it.sx+":"+it.ax+":delegate"}),{to,why});try{closeDrawer()}catch(e){}return r},
 check(it){const c=G(()=>ITSMX.getChange(it.sid),null);if(!c)return null;const a=c.stages[it.sx]&&c.stages[it.sx].ap[it.ax];return{st:c.st,dec:a&&a.dec,who:a&&a.w}}});

/* Service catalog requests (svcApprove) */
defAdp("cat",{label:"Catalog requests",mod:"Service catalog",fn:"svcApprove, request reject form",wired:true,
 list(me){if(typeof window.svcApprove!=="function"||!window.REQREG)return[];const out=[];let n=0;for(const r of REQREG){if(r.state!=="pending")continue;const ap=Object.keys(r.ap||{}).find(k=>r.ap[k].st==="pending"&&r.ap[k].who===me);if(!ap)continue;if(++n>300)break;
   const s=G(()=>svcStatus(r.id),{})||{};const price=r.price||0;const risk=price>=5000?"high":price>=2000?"med":"low";const tgt=r.slaTgt||48;
   out.push(mk({id:"cat:"+r.id,src:"cat",sid:r.id,ap,cat:"Catalog request",ic:"catalog",title:r.id+" "+(s.item||r.item||"Request"),req:s.requester||r.requester||"",ageH:Math.max(0,Math.round((NOW0-(r.created||NOW0))/36e5)),slaH:tgt,dueH:tgt*(1-(r.sl||0)/100)-6,amt:price||null,risk,
    why:"You are an approver on this request ("+(s.step||"approval step")+")"+(r.onBehalfOf?"; raised on behalf of "+r.onBehalfOf+".":"."),
    ai:mkAI("A standard "+(s.item||"catalog")+" request"+(price?" priced at "+money0(price):"")+" for "+(s.service||"a service")+". Approval keeps it inside the "+tgt+"-hour fulfillment target.",price>=5000?.7:.9,"Catalog Advisor",["Catalog policy","Entitlements"],price>=5000?"conditions":"approve"),rec:price>=5000?"conditions":"approve",
    guard:"Entitlement rules apply. Anything over $5,000 needs a second approver.",ev:[["Item",s.item||"","" ],["Service",s.service||"",""],["Price",price?money0(price):"No charge",""],["Requester",s.requester||"",""],["Step",s.step||"",""],["With",s.with||"",""]],
    can:{approve:true,reject:true,delegate:false},delegateWhy:"The catalog has no per-item delegation. Use a delegation rule.",
    open:()=>{go("svc_req");if(window.svcOpenRequest)svcOpenRequest(r.id)}}))}return out},
 approve(it,note){return window.svcApprove?svcApprove(it.sid,ME(),note):{ok:false,why:"Catalog module is not loaded"}},
 reject(it,why){return viaForm("svc_rj",()=>clickVia({"data-svc":"rejectf|"+it.sid+"|"+it.ap}),{why})},
 check(it){const s=G(()=>svcStatus(it.sid),null);return s?{st:s.state,ap:(s.approvals||[]).map(a=>a.state).join(",")}:null}});

/* Release go or no-go (RELX) */
defAdp("rel",{label:"Release go or no-go",mod:"Releases",fn:"RELX.goNoGo",wired:true,
 list(me){if(!(window.RELX&&RELX.releases&&RELX.goNoGo))return[];const out=[];RELX.releases.filter(r=>r.st==="Readiness review"&&(r.rm===me||me==="Casey Rowan"&&r.svc)).forEach(r=>{const rec=G(()=>RELX.recommend(r.id),["Go","good",""]);const rd=G(()=>RELX.readiness(r.id),0);const crit=G(()=>RELX.exitCriteria(r.id),[]);const cl=G(()=>RELX.clashes(r.id),[]);
   out.push(mk({id:"rel:"+r.id,src:"rel",sid:r.id,cat:"Release",ic:"release",title:r.id+" "+r.n+" go or no-go",req:r.rm,ageH:30,slaH:48,dueH:dueFromISO(r.date,24),amt:null,risk:rec[0]==="Go"?"low":"med",
    why:r.rm===me?"You are the release manager.":"As CIO you accept the risk on Tier 1 service releases.",
    ai:mkAI(rec[2],rec[0]==="Go"?.9:.7,"Release Advisor",["Exit criteria","Defect list","Change calendar"],rec[0]==="Go"?"approve":"conditions"),rec:rec[0]==="Go"?"approve":"conditions",needNote:rec[0]!=="Go",
    guard:"A Go against a different recommendation needs a named risk acceptance. Hard exit criteria must pass.",
    ev:[["Recommendation",rec[0]+": "+rec[2],rec[1]==="good"?"good":"warn"],["Readiness",rd+"%",rd>=90?"good":"warn"]].concat(crit.slice(0,5).map(c=>[c.t,c.txt,c.ok?"good":c.hard?"bad":"warn"])).concat(cl.slice(0,2).map(c=>["Clash",c.w+" "+c.n,"warn"])),
    can:{approve:true,reject:true,delegate:false},delegateWhy:"A go or no-go belongs to one named decider.",rec0:rec[0],open:()=>{go("itsm_rel");if(RELX.open)RELX.open(r.id)}}))});return out},
 approve(it,note){const r=RELX.goNoGo(it.sid,"Go",ME(),note||"Approved from the inbox",it.needNote?ME()+" accepts the risk: "+(note||""):"");return r&&r.ok?{ok:true}:{ok:false,why:r&&r.error||"Not recorded"}},
 reject(it,why){const r=RELX.goNoGo(it.sid,"No-go",ME(),why);return r&&r.ok?{ok:true}:{ok:false,why:r&&r.error||"Not recorded"}},
 check(it){const r=G(()=>RELX.releases.find(x=>x.id===it.sid),null);return r?{st:r.st,gng:(r.gng||[]).length}:null}});

/* Funding gate approvals (FIN) with the color rule (color of money) */
defAdp("gate",{label:"Funding gates",mod:"Funding gates (FIN)",fn:"gate queue approve and reject",wired:true,
 list(me){const F=G(()=>FIN._h.F,null);if(!F||!F.gq)return[];return F.gq.filter(q=>FIRST(q.approver)===FIRST(me)).map(q=>{
   const lines=G(()=>FIN.lines.filter(l=>l.project===q.pid),[]);const byC={};lines.forEach(l=>{if(l.color)byC[l.color]=(byC[l.color]||0)+(l.amount||0)});const cs=Object.keys(byC);
   const ev=cs.slice(0,3).map(c=>{const h=G(()=>FIN.headroom(c),null);const hv=h&&typeof h==="object"?(h.headroom!=null?h.headroom:h.head):h;return ["Color "+c+" allowability",money0(byC[c])+" of this project's lines. "+(hv!=null?"Headroom "+money0(hv)+".":"Rule set applies."),hv!=null&&hv<byC[c]?"warn":"good"]});
   return mk({id:"gate:"+q.id,src:"gate",sid:q.id,cat:"Funding gate",ic:"gate",title:q.pid+" to "+q.to+" ("+money0(q.amt||0)+")",req:"",ageH:20,slaH:72,dueH:40,amt:q.amt||null,risk:(q.amt||0)>100000?"high":"med",
    why:"The delegation of authority routes this gate move to "+q.approver+(q.role?" ("+q.role+")":"")+".",ai:mkAI(q.note||"Gate move request.",.8,"Funding Gate Advisor",["Gate checks","Delegation of authority","Color rules"],"approve"),rec:"approve",
    guard:"The color's approval authority must approve. The allowability rule and evidence are checked at the gate.",ev:[["Move","Gate to "+q.to,""],["Note",q.note||"",""]].concat(ev),can:{approve:true,reject:true,delegate:false},delegateWhy:"Gate moves follow the delegation of authority table.",
    open:()=>go("fin_gates")})})},
 approve(it){const F=FIN._h.F;const n=F.gq.length;clickVia({"data-fin2":"qok","data-id":it.sid});return F.gq.length<n?{ok:true}:{ok:false,why:"The gate queue did not change"}},
 reject(it){const F=FIN._h.F;const n=F.gq.length;clickVia({"data-fin2":"qno","data-id":it.sid});return F.gq.length<n?{ok:true}:{ok:false,why:"The gate queue did not change"}},
 check(it){return{pending:G(()=>FIN._h.F.gq.some(q=>q.id===it.sid),false)}}});

/* Knowledge reviews (KCSX.publish) */
defAdp("kcs",{label:"Knowledge reviews",mod:"Knowledge management",fn:"KCSX.publish",wired:true,
 list(me){if(!(window.KCSX&&KCSX.items))return[];return KCSX.items().filter(k=>k.st==="In review"&&k.rvw===me).map(k=>mk({id:"kcs:"+k.id,src:"kcs",sid:k.id,cat:"Knowledge review",ic:"book",title:k.id+" "+k.t,req:k.own,ageH:(k.ageD||1)*24,slaH:7*24,dueH:(7-(k.ageD||1))*24,risk:k.conf<65?"med":"low",
   why:"You are the named reviewer for this "+String(k.type).toLowerCase()+".",ai:mkAI("Drafted from "+(k.srcRef||k.srcK)+". Confidence "+k.conf+", safety "+k.safe+".",k.conf/100,"Knowledge Curator",[k.srcRef||k.srcK],k.conf>=65?"approve":"return"),rec:k.conf>=65?"approve":"return",
   guard:"Publishing needs AI confidence of 65 or more, or a human override in the article editor.",ev:[["Type",k.type,""],["Confidence",k.conf+"%",k.conf>=65?"good":"warn"],["Safety",String(k.safe),k.safe>=70?"good":"warn"],["Audience",(k.aud||[]).join(", "),""],["Source",k.srcK,""]],
   can:{approve:k.conf>=65,reject:false,delegate:false},blk:k.conf<65?"Confidence is under 65. Open the article to review and publish with an override.":"",delegateWhy:"Reviews are assigned in the article editor.",rejectWhy:"Return the article from the editor so the author gets your comments.",
   open:()=>{go("kcs_home");if(KCSX.openItem)KCSX.openItem(k.id)}}))},
 approve(it,note){const r=KCSX.publish(it.sid,{});return r&&r.ok?{ok:true}:{ok:false,why:r&&r.error||"Not published"}},check(it){return{st:G(()=>KCSX.itOf(it.sid).st,"")}}});

/* Proposed data entities (ATLAS / COVER.approve) */
defAdp("ent",{label:"Proposed data entities",mod:"Data atlas",fn:"COVER.approve",wired:true,
 list(me){if(!(window.DATAMODEL&&window.COVER&&COVER.approve))return[];if(me!=="Casey Rowan")return[];return Object.entries(DATAMODEL.tables).filter(([k,t])=>t.status==="proposed"&&t.seed===false).map(([k,t])=>mk({id:"ent:"+k,src:"ent",sid:k,cat:"Proposed entity",ic:"data",title:"Approve new entity "+(t.label||k),req:t.source||"",ageH:30,slaH:120,dueH:96,risk:"low",
   why:"As CIO and platform admin you approve new entities in the data atlas.",ai:mkAI("Reuse first: "+(t.note||"Defined by "+(t.source||"a module"))+" Fields: "+((t.fields||[]).length)+".",.82,"Data Steward Agent",["Entity registry","Duplicate check"],"approve"),rec:"approve",
   guard:"Duplicate fields are flagged before approval. Approving makes the table live in the master data model.",ev:[["Owner app",t.source||"",""],["Fields",String((t.fields||[]).length),""],["Status","Proposed",""]],can:{approve:true,reject:false,delegate:false},rejectWhy:"Reject by editing or retiring the entity in the data atlas.",delegateWhy:"Entity approval belongs to the platform data steward.",
   open:()=>go("plat_data")}))},
 approve(it){const ok=COVER.approve(it.sid,true);return ok===false?{ok:false,why:"The atlas did not approve it"}:{ok:true}},check(it){return{st:G(()=>DATAMODEL.tables[it.sid].status,"")}}});

/* Modules that offer no approve function: the inbox shows them and opens the owning record */
defAdp("mat",{label:"Maturity capability reviews",mod:"Maturity models",fn:"MAT.openCap (record drawer)",wired:false,
 list(me){if(!(window.MAT&&MAT.crRows))return[];return MAT.crRows().filter(r=>r.state==="Awaiting acceptance"&&r.n.owner===me).slice(0,20).map(r=>mk({id:"mat:"+r.key,src:"mat",sid:r.n.id||r.key,cat:"Maturity review",ic:"star",title:"Accept "+r.n.name+" level "+r.c.to,req:(r.p||{}).n||"",ageH:60,slaH:120,dueH:60,risk:"low",
   why:"You own the "+r.n.name+" capability, so you accept the deliverable.",ai:mkAI("The deliverable is finished. Acceptance counts it toward the capability level.",.8,"Maturity Agent",["Milestones","Evidence"],"approve"),guard:"Acceptance needs evidence. It is recorded in the maturity model, not here.",
   ev:[["Capability",r.n.name,""],["Raises to","Level "+r.c.to,""],["Project",(r.p||{}).n||"",""]],can:{approve:false,reject:false,delegate:false},openLabel:"Open to accept",open:()=>{go("exe_mat");if(MAT.openCap)MAT.openCap(r.n.id)}}))}});
defAdp("sow",{label:"SOW changes",mod:"SOW and contract analyzer",fn:"SOWX.open (record drawer)",wired:false,
 list(me){if(!(window.SOWX&&SOWX.changes))return[];if(me!=="Casey Rowan"&&me!=="Avery Chen")return[];return SOWX.changes().filter(c=>c.stage==="Approval").map(c=>mk({id:"sow:"+c.id,src:"sow",sid:c.id,cat:"Contract change",ic:"contract",title:c.id+" "+c.title,req:c.contract,ageH:50,slaH:96,dueH:46,amt:c.amount||null,risk:Math.abs(c.amount||0)>=50000?"med":"low",
   why:"Contract changes over your tier route to you for approval.",ai:mkAI(c.type+": "+c.title+".",.78,"Contract Analyst",["Contract","Rate card"],"conditions"),guard:"Approved in the SOW and contract analyzer, where the clause diff is shown.",ev:[["Contract",c.contract,""],["Type",c.type,""],["Amount",money0(c.amount||0),""]],can:{approve:false,reject:false,delegate:false},openLabel:"Open to decide",open:()=>{go("ppm_sow");if(SOWX.open)SOWX.open(c.contract)}}))}});
defAdp("fab",{label:"Integration connector requests",mod:"Integration fabric",fn:"FAB.openProject (record drawer)",wired:false,
 list(me){if(!(window.FAB&&FAB.projects))return[];const p0=FAB.projects.filter(p=>(p.stage==="awaiting"&&me==="Casey Rowan")||((p.stage==="evaluating"||p.stage==="proposed")&&me==="Tom Becker"));return p0.map(p=>mk({id:"fab:"+p.id,src:"fab",sid:p.id,cat:"Connector request",ic:"plug",title:p.id+" "+p.t,req:p.owner||p.by,ageH:(p.created||2)*12,slaH:72,dueH:72-(p.created||2)*12,risk:p.risk==="High"||p.risk==="high"?"high":"med",
   why:"Routed to "+((p.route||{}).n||"the platform team")+" by the machine-to-machine rules: "+((p.route||{}).why||"standard risk")+".",ai:mkAI(p.purpose||"",.8,"Integration Advisor",["Connector catalog","Data classes"],"conditions"),guard:"Approval creates a connector with the scope you pick. Decide it in the integration fabric.",ev:[["Systems",(p.systems||[]).join(", "),""],["Direction",p.dir||"",""],["Volume",p.vol||"",""]],can:{approve:false,reject:false,delegate:false},openLabel:"Open to decide",open:()=>{go("plat_fab");if(FAB.openProject)FAB.openProject(p.id)}}))}});
defAdp("gapp",{label:"Citizen app certification",mod:"Citizen apps",fn:"go plat_gate (screen)",wired:false,
 list(me){if(!(window.GATE&&GATE.apps)||me!=="Casey Rowan")return[];return GATE.apps().filter(a=>a.status==="review").map(a=>{const c=G(()=>GATE.conformance(a.id),{rows:[]});const fail=(c.rows||[]).filter(r=>r.r==="fail");return mk({id:"gapp:"+a.id,src:"gapp",sid:a.id,cat:"App certification",ic:"gate",title:"Certify "+a.n+" at the "+a.tier+" tier",req:a.builder,ageH:96,slaH:240,dueH:120,risk:fail.length?"med":"low",
   why:"You chair the certification board for citizen apps.",ai:mkAI(a.purpose+" "+(fail.length?fail.length+" check"+(fail.length>1?"s":"")+" failing.":"All checks pass."),fail.length?.6:.9,"Platform Governance Agent",["12 conformance checks"],fail.length?"conditions":"approve"),guard:"Hard-stop checks must pass for the tier. Waivers expire.",
   ev:(c.rows||[]).filter(r=>r.r!=="pass").slice(0,5).map(r=>[r.n,r.ev,r.r==="fail"?"bad":"warn"]),can:{approve:false,reject:false,delegate:false},openLabel:"Open to decide",open:()=>go("plat_gate")})})}});
defAdp("debt",{label:"Platform exceptions and debt",mod:"Technical debt ledger",fn:"go plat_debt (screen)",wired:false,
 list(me){if(!(window.DEBT&&DEBT.items)||me!=="Casey Rowan")return[];return DEBT.items().filter(d=>d.status==="open"&&(d.sev==="High"||d.sev==="Critical")).slice(0,6).map(d=>mk({id:"debt:"+d.id,src:"debt",sid:d.id,cat:"Debt decision",ic:"debt",title:"Accept, schedule or fix: "+d.title,req:d.owner,ageH:d.age*24,slaH:90*24,dueH:dueFromISO(d.due,0),risk:d.sev==="High"||d.sev==="Critical"?"high":"med",
   why:"As CIO you decide whether to accept this platform debt or fund the fix.",ai:mkAI("Interest is about "+d.interest+" hours a month. "+d.iformula,.7,"Debt Advisor",["Debt ledger"],"conditions"),guard:"Accepting debt is a recorded risk decision with an expiry.",ev:[["Severity",d.sev,d.sev==="High"?"bad":"warn"],["Owner",d.owner,""],["Open for",d.age+" days",""]],can:{approve:false,reject:false,delegate:false},openLabel:"Open to decide",open:()=>go("plat_debt")}))}});

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
const TODAY_ISO=U.TODAY_ISO;
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

/* ---------- rendering: cards, rows, panel, focus mode ---------- */
const visible=()=>byTab(collect(),I.tab);
function nextAfter(id){const L=visible();const i=L.findIndex(x=>x.id===id);return (L[i+1]||L[i-1]||{}).id||null}
function advance(nxt,msg){I.cur=nxt||null;I.ui=null;I.anim=1;I.flash={msg:msg,at:Date.now()};I.focusReq="card";live(msg+(nxt&&byIdSafe(nxt)?". Next: "+byIdSafe(nxt).title:". Your queue is clear."))}
const byIdSafe=id=>{try{return CACHE&&CACHE.find(x=>x.id===id)}catch(e){return null}};
function curItem(){const L=visible();let it=L.find(x=>x.id===I.cur);if(!it){it=L[0]||null;I.cur=it?it.id:null}return it}
const riskPill=r=>`<span class="pill ${r==="high"?"bad":r==="med"?"warn":"good"}" title="Risk rating from the owning module or the advisor">${r==="med"?"Medium":r==="high"?"High":"Low"} risk</span>`;
const slaPill=it=>`<span class="pill ${it.dueH<0?"bad":it.dueH<24?"warn":"mute"}" title="Time against the service level target. ${it.slaH?"Target "+it.slaH+" hours.":""}">${svgI("sleep",12)} ${it.kind==="mention"?"Open "+ageTxt(it.ageH):fmtH(it.dueH)}</span>`;
const person=(n,ext)=>!n?"":(ext||!G(()=>who(n),null))?`<span class="chip inbx-ext">${H(n)}</span>`:G(()=>pchip(n),H(n));
const recTxt=r=>({approve:"approve",conditions:"approve with conditions",hold:"hold",reject:"reject","return":"return it"})[r]||r;

function actBar(it,big){const c=it.can||{};const dis=(ok,why)=>ok?"":` disabled aria-disabled="true" title="${H(why)}"`;
 const blkA=it.blk||"This module has no approve function wired to the inbox. Use Open to decide.";
 return `<div class="inbx-acts" role="group" aria-label="Actions for ${H(it.title)}">
  <button class="btn primary" data-inbx-act="approve" data-id="${H(it.id)}" aria-keyshortcuts="A"${dis(c.approve,blkA)}>${svgI("task",16)} ${it.kind==="approval"?(it.needNote?"Approve with reason":"Approve"):"Done"}<kbd>A</kbd></button>
  <button class="btn" data-inbx-act="reject" data-id="${H(it.id)}" aria-keyshortcuts="R"${dis(c.reject,it.rejectWhy||"This module cannot reject from the inbox. Use Open.")}>Reject<kbd>R</kbd></button>
  <button class="btn" data-inbx-act="delegate" data-id="${H(it.id)}" aria-keyshortcuts="D"${dis(c.delegate,it.delegateWhy||"This item cannot be delegated from the inbox.")}>Delegate<kbd>D</kbd></button>
  <button class="btn" data-inbx-act="snooze" data-id="${H(it.id)}" aria-keyshortcuts="S">Snooze<kbd>S</kbd></button>
  <button class="btn quiet" data-inbx-act="open" data-id="${H(it.id)}" aria-keyshortcuts="O">${H(it.openLabel||"Open")}<kbd>O</kbd></button></div>`}
function uiForm(it){const u=I.ui;if(!u||u.id!==it.id)return"";
 if(u.mode==="reject"||u.mode==="approve")return `<form class="inbx-form" data-inbx-form="${u.mode}" data-id="${H(it.id)}"><label class="inbx-l" for="inbxN">${u.mode==="reject"?"Why are you rejecting this? The requester sees it.":"You are deciding against the recommendation. Say why; it is logged as an override."}<span class="muted small"> Required</span></label>
  <textarea id="inbxN" class="fin" rows="2" required data-inbx-note placeholder="Write a short reason">${H(u.note||"")}</textarea><div class="row" style="gap:8px"><button class="btn ${u.mode==="reject"?"danger":"primary"}" type="submit">${u.mode==="reject"?"Reject and next":"Approve and next"}</button><button class="btn quiet" type="button" data-inbx-cancel>Cancel</button></div><div class="ferr" role="alert" data-inbx-err hidden></div></form>`;
 if(u.mode==="delegate"){const people=G(()=>DIR.filter(d=>d.kind==="human"&&d.name!==ME()&&d.name!==it.req).slice(0,90),[]);const sug=["Priya Shah","Maya Ortiz","Avery Chen","Tom Becker"].filter(n=>people.some(p=>p.name===n)&&n!==ME()).slice(0,3);
  return `<form class="inbx-form" data-inbx-form="delegate" data-id="${H(it.id)}"><label class="inbx-l" for="inbxTo">Delegate this one item to</label><select id="inbxTo" class="fin" data-inbx-to required><option value="">Choose a person</option>${sug.length?`<optgroup label="Suggested">${sug.map(n=>`<option>${H(n)}</option>`).join("")}</optgroup>`:""}<optgroup label="Everyone">${people.map(p=>`<option>${H(p.name)}</option>`).join("")}</optgroup></select>
  <label class="inbx-l" for="inbxN">Reason <span class="muted small">Optional</span></label><input id="inbxN" class="fin" data-inbx-note placeholder="For example: knows the vendor"><div class="row" style="gap:8px"><button class="btn primary" type="submit">Delegate and next</button><button class="btn quiet" type="button" data-inbx-cancel>Cancel</button></div><div class="ferr" role="alert" data-inbx-err hidden></div></form>`}
 if(u.mode==="snooze")return `<div class="inbx-form" role="group" aria-label="Snooze for"><span class="inbx-l">Remind me in</span><div class="row" style="gap:8px;flex-wrap:wrap">${[[1,"1 hour"],[4,"4 hours"],[18,"Tomorrow morning"],[24*5,"Next week"]].map(o=>`<button class="btn" data-inbx-snooze="${o[0]}" data-id="${H(it.id)}">${o[1]}</button>`).join("")}<button class="btn quiet" type="button" data-inbx-cancel>Cancel</button></div></div>`;return""}
function cardHTML(it,o){o=o||{};const a=ADP[it.src]||{};const ai=it.ai;const evOpen=o.big||I.evOpen;
 const ev=(it.ev||[]).filter(e=>e&&e[1]!==""&&e[1]!=null);
 return `<article class="inbx-card${o.big?" big":""}${I.anim&&o.anim?" inbx-adv":""}" data-inbx-card="${H(it.id)}" aria-labelledby="inbxT-${H(it.id.replace(/\W/g,"_"))}">
  <header class="inbx-ch"><span class="inbx-ic ${it.kind}">${svgI(it.ic,18)}</span><span class="pill info">${H(it.cat)}</span>${it.sim?`<span class="pill warn" title="This is a labeled demo event, not a real request">Simulated demo event</span>`:""}<span class="pill ${it.group==="Overdue"?"bad":it.group==="Due today"?"warn":"mute"}">${H(it.group)}</span><span class="inbx-sp"></span>${it.kind==="mention"?"":slaPill(it)}</header>
  <h3 id="inbxT-${H(it.id.replace(/\W/g,"_"))}" tabindex="-1" class="inbx-t">${H(it.title)}</h3>
  <div class="inbx-meta">${it.req?`<span class="inbx-from"><span class="muted small">${it.reqExt||!G(()=>who(it.req),null)?"From":"Asked by"}</span> ${person(it.req,it.reqExt)}</span>`:""}<span class="muted small">${it.kind==="mention"?"":"Waiting "+ageTxt(it.ageH).replace(" ago","")}</span>${it.amt!=null?`<b class="num inbx-amt" data-role="metric">${money0(it.amt)}</b>`:""}${it.kind==="approval"||it.risk!=="low"?riskPill(it.risk):""}</div>
  <p class="inbx-why"><b>Why it is yours.</b> ${H(it.why)}</p>
  ${ai?`<div class="inbx-ai"><span class="inbx-aih">${G(()=>aiChip({model:ai.model,conf:ai.conf,title:"Where this summary came from",note:"Summarized from "+(ai.srcs&&ai.srcs.length?ai.srcs.join(", "):"the record")+". It recommends; a person decides."}),"")}${ai.rec?`<span class="pill ${ai.rec==="approve"?"good":ai.rec==="conditions"?"warn":"bad"}">Suggests: ${H(recTxt(ai.rec))}</span>`:""}</span><span class="inbx-ais" data-role="story">${H(ai.sum||"")}</span></div>`:""}
  ${it.guard?`<p class="inbx-guard">${svgI("access",14)} <span><b>Guardrail.</b> ${H(it.guard)}</span></p>`:""}
  ${it.blk&&!it.can.approve?`<p class="inbx-blk" role="note">${H(it.blk)}</p>`:""}
  ${ev.length||it.extra?`<details class="inbx-ev"${evOpen?" open":""} data-inbx-ev><summary>Evidence${ev.length?" ("+ev.length+")":""}</summary><dl class="kv inbx-kv">${ev.map(e=>`<dt>${H(e[0])}</dt><dd class="${e[2]?"t-"+e[2]:""}">${H(e[1])}</dd>`).join("")}</dl>${it.extra||""}</details>`:""}
  ${uiForm(it)}${I.ui&&I.ui.id===it.id?"":actBar(it,o.big)}</article>`}
function rowHTML(it,cur){const sel=!!I.sel[it.id];const ok=it.kind==="approval"&&it.can.approve;
 return `<div class="inbx-row${cur?" cur":""}${it.urgent?" urg":""}" data-inbx-row="${H(it.id)}"><label class="inbx-ck" title="Select for bulk approval"><input type="checkbox" data-inbx-sel="${H(it.id)}" ${sel?"checked":""} ${ok?"":"disabled"} aria-label="Select ${H(it.title)}"><i></i></label>
  <button class="inbx-rb" data-inbx-pick="${H(it.id)}" aria-current="${cur?"true":"false"}"><span class="inbx-ic ${it.kind}">${svgI(it.ic,15)}</span><span class="inbx-rt"><b>${H(it.title)}</b><small>${H(it.cat)}${it.req?" · "+H(it.req):""}${it.amt!=null?" · "+money0(it.amt):""}</small></span><span class="pill ${it.dueH<0?"bad":it.dueH<24?"warn":"mute"} inbx-rp">${it.kind==="mention"?"Open":fmtH(it.dueH)}</span></button></div>`}
function listHTML(L,limit){const shown=L.slice(0,limit);let h="";GRP.forEach(g=>{const rows=shown.filter(x=>x.group===g);if(!rows.length)return;h+=`<div class="inbx-gh" role="heading" aria-level="3"><span class="${g==="Overdue"?"bad":g==="Due today"?"warn":""}">${g}</span><small>${L.filter(x=>x.group===g).length}</small></div>`+rows.map(x=>rowHTML(x,x.id===I.cur)).join("")});
 if(L.length>limit)h+=`<button class="btn quiet inbx-more" data-nav="inbox">${L.length-limit} more. Open My inbox to see all ${L.length}</button>`;return h}
function progressHTML(L){const done=I.session.done,rem=L.length,tot=done+rem,idx=Math.min(done+1,Math.max(tot,1));
 return `<div class="inbx-prog" role="group" aria-label="Progress through your queue"><div class="inbx-pt"><b>${rem?idx+" of "+tot:"All caught up"}</b><span class="muted small">${done} decided this session</span>${rem&&!isOpen(focusEl)?`<button class="btn quiet inbx-one" data-inbx-focus title="Work through the queue in a full-width view">Review one by one</button>`:""}</div><div class="inbx-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${done}" aria-label="${done} of ${tot} decided"><i style="width:${tot?Math.round(done/tot*100):100}%"></i></div></div>`}
function bulkBarHTML(){const ids=Object.keys(I.sel).filter(k=>I.sel[k]&&byIdSafe(k));if(!ids.length){const n=bulkCheck(collect().filter(x=>x.kind==="approval").map(x=>x.id)).ok.length;return n?`<div class="inbx-bulk" role="region" aria-label="Bulk actions"><span class="muted small">${n} approval${n>1?"s are":" is"} within your safe rules.</span><button class="btn" data-inbx-selsafe>Select ${n} safe</button></div>`:""}return `<div class="inbx-bulk" role="region" aria-label="Bulk actions"><b>${ids.length} selected</b><button class="btn primary" data-inbx-bulk="review">Review and approve</button><button class="btn quiet" data-inbx-bulk="clear">Clear</button></div>`}
function emptyHTML(){const c=counts();return `<div class="inbx-empty"><span class="inbx-ok">${svgI("task",26)}</span><h3 tabindex="-1" id="inbxEmpty">You are all caught up</h3><p class="muted">Nothing is waiting on you${I.tab==="all"?"":" in this tab"}. ${Object.keys(I.snz).length&&snoozedItems().length?snoozedItems().length+" snoozed item"+(snoozedItems().length>1?"s":"")+" will come back.":""}</p>${I.hist.length?`<button class="btn" data-nav="inbox" data-inbx-tab-hist>See what you decided</button>`:""}</div>`}
function tabsHTML(){const c=counts();const T=[["all","All",c.all],["approval","Approvals",c.approval],["action","Actions",c.action],["mention","Mentions and alerts",c.mention]];
 return `<div class="inbx-tabs" role="tablist" aria-label="Filter your queue">${T.map(t=>`<button role="tab" class="inbx-tab" aria-selected="${I.tab===t[0]}" data-inbx-tab="${t[0]}" tabindex="${I.tab===t[0]?0:-1}">${t[1]}<b>${t[2]}</b></button>`).join("")}</div>`}
function panelHTML(){const L=visible();const it=curItem();const c=counts();
 return `<header class="inbx-ph"><div class="inbx-phm"><h2 id="inbxH" tabindex="-1">Needs you</h2><span class="muted small">${H(ME())} · ${c.all} waiting${c.urgent?", "+c.urgent+" urgent":""}</span></div><div class="inbx-phb"><button class="btn quiet inbx-ib r21-sil" data-r21-silence aria-label="Silence notifications" title="Silence notifications"><svg class="inbx-i" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 14 6 8"/><path d="M10 19a2 2 0 0 0 4 0"/><path d="M4 4l16 16"/></svg></button><button class="btn quiet inbx-ib" data-inbx-settings aria-label="Inbox settings" title="Notification and delegation settings">${svgI("gear",17)}</button><button class="btn quiet inbx-ib" data-nav="inbox" aria-label="Open My inbox" title="Open My inbox">${svgI("chev",17)}</button><button class="btn quiet inbx-ib" data-inbx-close aria-label="Close (Escape)" title="Close (Esc)">${svgI("x",17)}</button></div></header>
  ${tabsHTML()}${progressHTML(L)}
  <div class="inbx-pb" data-inbx-scroll>${I.flash&&Date.now()-I.flash.at<2200?`<div class="inbx-flash" role="status">${svgI("task",14)} ${H(I.flash.msg)}</div>`:""}
  ${it?cardHTML(it,{anim:true}):emptyHTML()}
  <div class="inbx-phone" aria-label="Phone gestures simulated by buttons">${it?`<button class="btn" data-inbx-nav="prev">&larr; Previous</button><button class="btn primary" data-inbx-act="approve" data-id="${H(it.id)}" ${it.can.approve?"":"disabled"}>Approve and next</button><button class="btn" data-inbx-nav="next">Skip &rarr;</button>`:""}</div>
  ${bulkBarHTML()}<div class="inbx-list" role="list" aria-label="Your queue">${L.length?listHTML(L,40):""}</div></div>
  <footer class="inbx-pf"><span class="muted small" id="inbxKeys">Keys: <kbd>A</kbd> approve <kbd>R</kbd> reject <kbd>D</kbd> delegate <kbd>S</kbd> snooze <kbd>J</kbd>/<kbd>K</kbd> next and previous <kbd>Esc</kbd> close</span><label class="inbx-sw" title="Simulated demo events appear now and then when you are the Executive persona. Turn them off here."><input type="checkbox" data-inbx-simtoggle ${I.sim?"checked":""}><i></i><span>Demo events (simulated)</span></label></footer>`}
function focusHTML(){const L=visible();const it=curItem();
 return `<header class="inbx-fh"><div><h2 id="inbxFH" tabindex="-1">Review one by one</h2><span class="muted small">${H(ME())}. Decide each item without leaving this view.</span></div>${progressHTML(L)}<div class="row" style="gap:6px">${tabsHTML()}<button class="btn" data-inbx-focus-close>Exit review</button></div></header>
  <div class="inbx-fb"><div class="inbx-fm" data-inbx-scroll>${I.flash&&Date.now()-I.flash.at<2200?`<div class="inbx-flash" role="status">${svgI("task",14)} ${H(I.flash.msg)}</div>`:""}${it?cardHTML(it,{big:true,anim:true}):emptyHTML()}
  <div class="inbx-phone">${it?`<button class="btn" data-inbx-nav="prev">&larr; Previous</button><button class="btn primary" data-inbx-act="approve" data-id="${H(it.id)}" ${it.can.approve?"":"disabled"}>Approve and next</button><button class="btn" data-inbx-nav="next">Skip &rarr;</button>`:""}</div>
  <p class="muted small inbx-keys">Keys: <kbd>A</kbd> approve <kbd>R</kbd> reject <kbd>D</kbd> delegate <kbd>S</kbd> snooze <kbd>J</kbd>/<kbd>K</kbd> or arrow keys to move <kbd>O</kbd> open <kbd>Esc</kbd> exit</p></div>
  <aside class="inbx-fq" aria-label="Up next"><div class="eyebrow">Up next</div>${bulkBarHTML()}<div class="inbx-list" role="list">${L.length?listHTML(L,60):""}</div></aside></div>`}

/* ---------- panel host management ---------- */
let panel=null,focusEl=null,bell=null;
function ensureHosts(){if(!panel){panel=document.createElement("section");panel.id="inbxPanel";panel.setAttribute("popover","manual");panel.setAttribute("role","dialog");panel.setAttribute("aria-labelledby","inbxH");panel.className="glass inbx-panel";document.body.appendChild(panel)}
 if(!focusEl){focusEl=document.createElement("section");focusEl.id="inbxFocus";focusEl.setAttribute("popover","manual");focusEl.setAttribute("role","dialog");focusEl.setAttribute("aria-labelledby","inbxFH");focusEl.className="glass inbx-focus";document.body.appendChild(focusEl)}
 if(!document.getElementById("inbxLive")){const l=document.createElement("div");l.id="inbxLive";l.className="sr";l.setAttribute("role","status");l.setAttribute("aria-live","polite");document.body.appendChild(l)}
 if(!document.getElementById("inbxBanners")){const b=document.createElement("div");b.id="inbxBanners";b.setAttribute("role","region");b.setAttribute("aria-label","Inbox notifications");b.setAttribute("aria-live","polite");document.body.appendChild(b)}}
const isOpen=el=>{try{return el&&el.matches(":popover-open")}catch(e){return false}};
function placePanel(){if(!panel||!bell)return;const r=bell.getBoundingClientRect();const w=Math.min(500,innerWidth-24);panel.style.setProperty("--inbx-w",w+"px");
 if(innerWidth<=700){panel.style.top="";panel.style.left="";panel.style.right="";panel.style.maxHeight="";return}panel.style.top=Math.round(r.bottom+10)+"px";panel.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+"px";panel.style.right="auto";panel.style.maxHeight=Math.max(360,innerHeight-r.bottom-26)+"px"}
function renderPanel(keepScroll){if(!isOpen(panel))return;const sc=panel.querySelector("[data-inbx-scroll]");const top=keepScroll&&sc?sc.scrollTop:0;const ae=document.activeElement;const had=ae&&panel.contains(ae)&&ae.id;
 panel.innerHTML=panelHTML();const s2=panel.querySelector("[data-inbx-scroll]");if(s2&&keepScroll)s2.scrollTop=top;I.anim=0;focusFix(panel,had)}
function renderFocus(){if(!isOpen(focusEl))return;const sc=focusEl.querySelector("[data-inbx-scroll]");focusEl.innerHTML=focusHTML();I.anim=0;focusFix(focusEl)}
function focusFix(host,had){const f=I.focusReq;I.focusReq=null;let t=null;
 if(I.ui&&I.ui.id){t=host.querySelector(I.ui.mode==="delegate"?"[data-inbx-to]":"[data-inbx-note]")||host.querySelector("[data-inbx-snooze]")}
 else if(f==="card"){t=host.querySelector(".inbx-t")||host.querySelector("#inbxEmpty")}else if(f==="head"){t=host.querySelector("h2")}else if(f==="tab"){t=host.querySelector('[role=tab][aria-selected="true"]')}
 else if(had)t=host.querySelector("#"+had);if(t&&t.focus){try{t.focus({preventScroll:true})}catch(e){}}}
function refreshAll(){CACHE=null;updateBell();renderPanel(true);renderFocus();refreshScreen();syncMetrics()}
function openPanel(){ensureHosts();if(isOpen(focusEl))return;if(!isOpen(panel)){I.session={done:0,total:collect().length};I.sessions++;placePanel();try{panel.showPopover()}catch(e){}bell&&bell.setAttribute("aria-expanded","true");I.focusReq="head"}renderPanel();live("Needs you. "+counts().all+" items waiting.")}
function closePanel(){if(isOpen(panel)){try{panel.hidePopover()}catch(e){}}bell&&bell.setAttribute("aria-expanded","false");if(bell&&document.activeElement===document.body)try{bell.focus()}catch(e){}}
function placeFocus(){if(!focusEl)return;const st=document.querySelector(".stage"),tb=document.querySelector(".topbar");if(!st){return}const r=st.getBoundingClientRect(),t=tb?tb.getBoundingClientRect().bottom+10:r.top;focusEl.style.inset=Math.round(t)+"px "+Math.round(Math.max(0,innerWidth-r.right))+"px 12px "+Math.round(r.left)+"px";focusEl.style.borderRadius="22px"}
window.addEventListener("resize",()=>{if(isOpen(focusEl))placeFocus()});
function openFocus(){ensureHosts();placeFocus();if(isOpen(panel))try{panel.hidePopover()}catch(e){}if(!isOpen(focusEl)){I.session={done:0,total:collect().length};I.sessions++;try{focusEl.showPopover()}catch(e){}}I.focusReq="head";renderFocus();live("Review one by one. "+counts().all+" items.")}
function closeFocus(){if(isOpen(focusEl))try{focusEl.hidePopover()}catch(e){}if(bell)try{bell.focus()}catch(e){}}

/* ---------- top bar bell ---------- */
function bellHTML(){const c=counts();const n=c.all;const lab="Needs you: "+n+" item"+(n===1?"":"s")+(c.urgent?", "+c.urgent+" urgent":"")+". Open the inbox panel.";
 return `<button type="button" class="btn quiet inbx-bell${c.urgent?" urgent":""}" id="inbxBell" aria-haspopup="dialog" aria-expanded="${isOpen(panel)}" aria-controls="inbxPanel" aria-label="${H(lab)}" title="Needs you (${n})">${svgI("bell",20)}<b class="inbx-badge" ${n?"":"hidden"} aria-hidden="true">${n>99?"99+":n}</b></button>`}
function mount(){const tb=document.querySelector(".tb-right");if(!tb)return;ensureHosts();let slot=document.getElementById("tbActions")||tb.querySelector("[data-tb-slot]");
 if(!slot){slot=document.createElement("span");slot.id="tbActions";slot.setAttribute("data-tb-slot","");slot.style.cssText="display:inline-flex;align-items:center;gap:8px";const lens=tb.querySelector(".lensbtn");if(lens)tb.insertBefore(slot,lens);else tb.insertBefore(slot,tb.firstChild)}
 bell=document.getElementById("inbxBell");if(!bell){slot.insertAdjacentHTML("beforeend",bellHTML());bell=document.getElementById("inbxBell")}else if(bell.parentNode!==slot)slot.appendChild(bell);updateBell()}
let lastUrg=-1;function updateBell(){if(!bell||!bell.isConnected){bell=document.getElementById("inbxBell");if(!bell)return}const c=counts();const n=c.all;bell.classList.toggle("urgent",c.urgent>0);
 bell.setAttribute("aria-label","Needs you: "+n+" item"+(n===1?"":"s")+(c.urgent?", "+c.urgent+" urgent":"")+". Open the inbox panel.");bell.title="Needs you ("+n+")";const b=bell.querySelector(".inbx-badge");if(b){const bn=c.urgent;b.hidden=!bn;b.textContent=bn>9?"9+":bn}bell.classList.toggle("r21-muted",!!(window.R21Q&&R21Q.silenced()))
 const nb=document.querySelector('[data-nav="inbox"] .navbadge');if(nb)nb.textContent=n}

/* ---------- toasts, banners, simulated arrivals ---------- */
const short=(s,n)=>{s=String(s||"");return s.length>(n||48)?s.slice(0,(n||48)-1)+"…":s};
function undoToast(verb,it,Ps){ensureHosts();let box=document.getElementById("inbxUndo");if(!box){box=document.createElement("div");box.id="inbxUndo";box.setAttribute("role","region");box.setAttribute("aria-label","Undo");document.body.appendChild(box)}
 const el=document.createElement("div");el.className="inbx-toast glass";el.dataset.ids=Ps.map(p=>p.it.id).join("|");el.innerHTML=`<span class="inbx-tk">${svgI("task",16)}</span><span class="inbx-tm"><b>${H(verb)}</b>${it?" "+H(short(it.title,56)):""}<small>Sends to the owning module in ${UNDO_MS/1000} seconds unless you undo.</small></span><button class="btn" data-inbx-undo>Undo</button><i class="inbx-tbar" style="animation-duration:${UNDO_MS}ms"></i>`;
 box.appendChild(el);el._ps=Ps;setTimeout(()=>{el.remove()},UNDO_MS+400)}
function undoGone(id){document.querySelectorAll("#inbxUndo .inbx-toast").forEach(t=>{const ids=(t.dataset.ids||"").split("|").filter(x=>x!==id);t.dataset.ids=ids.join("|");if(!ids.length||!ids.some(i=>PEND[i]))setTimeout(()=>t.remove(),400)})}
function prefOf(kind){const d={approval:{app:true,digest:true,push:true},action:{app:false,digest:true,push:false},mention:{app:true,digest:false,push:true}};return Object.assign({},d[kind]||d.approval,I.prefs[kind]||{})}
function quietNow(){const q=I.quiet;if(!q.on)return false;const d=new Date(),m=d.getHours()*60+d.getMinutes(),f=q.from.split(":"),t=q.to.split(":"),a=+f[0]*60+ +f[1],b=+t[0]*60+ +t[1];return a>b?(m>=a||m<b):(m>=a&&m<b)}
function banner(it){ensureHosts();if(window.R21Q&&R21Q.silenced())return false;if(!/^push:/.test(String(it.id))){const nw=Date.now();if(nw-(banner._t||0)<90000)return false;banner._t=nw}const p=prefOf(it.kind);if(!p.app)return false;if(quietNow()&&!(I.quiet.urgent!==false&&it.urgent))return false;const box=document.getElementById("inbxBanners");
 const el=document.createElement("div");el.className="inbx-banner glass";el.dataset.id=it.id;el.setAttribute("role","group");el.setAttribute("aria-label","New: "+it.title);
 el.innerHTML=`<span class="inbx-ic ${it.kind}">${svgI(it.ic,18)}</span><div class="inbx-bm"><b>${H(it.title)}</b><small>${it.sim?"Simulated demo event. ":""}${H(it.cat)}${it.amt!=null?" · "+money0(it.amt):""} · ${it.urgent?"Urgent":"New"}. Waiting in <a href="#needs-you" class="inbx-nlink" data-inbx-ban="open" aria-label="Open the Needs you panel"><b>Needs you</b></a></small><div class="row" style="gap:8px;margin-top:8px">${it.kind==="approval"&&it.can.approve&&!it.needNote?`<button class="btn primary" data-inbx-ban="approve">Approve</button>`:""}<button class="btn" data-inbx-ban="review">Review</button><button class="btn quiet" data-inbx-ban="open">${it.sim?"<span>See in <b>Needs you</b></span>":"Open"}</button></div></div><button class="btn quiet inbx-bx" data-inbx-ban="x" aria-label="Dismiss">&times;</button>`;
 box.appendChild(el);while(box.children.length>3)box.firstChild.remove();let tm=setTimeout(()=>el.remove(),15000);el.addEventListener("mouseenter",()=>clearTimeout(tm));el.addEventListener("mouseleave",()=>{tm=setTimeout(()=>el.remove(),6000)});
 live((it.sim?"Simulated demo event. ":"")+it.title);return true}
let simTm=0;function scheduleSim(){clearTimeout(simTm);simTm=setTimeout(()=>{if(I.sim&&S.persona==="exec"&&!document.hidden&&I.simItems.filter(x=>x._p==="exec").length<3&&!(window.R21Q&&R21Q.silenced())){const it=simPush();CACHE=null;banner(it);refreshAll()}scheduleSim()},270000+Math.random()*120000)}
let polled=false;function poll(){const list=collect();if(!polled){list.forEach(x=>I.seenBanner[x.id]=1);polled=true;updateBell();return}
 list.forEach(x=>{if(I.seenBanner[x.id])return;I.seenBanner[x.id]=1;if(x.urgent&&x.kind==="approval")banner(x)});updateBell()}

/* ---------- delegation and policies (act through the owning modules) ---------- */
function isoPlus(days){const d=new Date(U.todayDate().getTime()+days*864e5);return d.toISOString().slice(0,10)}
function nextWeekday(name){const wd={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6}[String(name||"").toLowerCase()];if(wd==null)return isoPlus(3);let k=(wd-2+7)%7;if(k===0)k=7;return isoPlus(k)}
function createDele(o){const me=ME();if(!o.to||o.to===me)return{ok:false,why:"Pick someone other than yourself to cover."};const r={id:"dr"+(I.dele.length+1),owner:me,to:o.to,from:o.from||TODAY_ISO,until:o.until||isoPlus(3),limit:o.limit!=null&&o.limit!==""&&+o.limit>0?+o.limit:null,scope:"Approvals that can be delegated",on:true,applied:0,mod:false,at:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
 I.dele.push(r);audit("Inbox: delegation rule",me+" to "+r.to+" from "+r.from+" until "+r.until+(r.limit?" up to "+money0(r.limit):""));applyDele(r);bump();refreshAll();return{ok:true,rule:r}}
function applyDele(r){if(!(r.on&&r.from<=TODAY_ISO&&r.until>=TODAY_ISO))return 0;let n=0;
 if(r.limit==null&&!r.mod&&window.FLOWX){const x=viaForm("apx_ooo",()=>clickVia({"data-apx-ooo":"1"}),{who:r.owner,to:r.to,from:r.from,until:r.until,scope:"all"});if(x.ok){r.mod=true;n++}}
 CACHE=null;collect(true).forEach(it=>{if(!covers(r,it)||I.delegated&&I.delegated[it.id])return;const a=ADP[it.src];if(a&&a.delegate){const x=a.delegate(it,r.to,"Out of office delegation until "+r.until);if(x&&x.ok!==false){I.delegated=I.delegated||{};I.delegated[it.id]=r.id;r.applied++;n++}}});
 if(n)audit("Inbox: delegation applied",r.to+" now covers "+n+" item"+(n>1?"s":""));return n}
function runPolicy(p){const hits=polHits(p);hits.forEach(it=>decide(it.id,"approve",{note:"Auto-approved by policy: "+p.name},{via:"policy:"+p.id,quiet:true}));
 const Ps=hits.map(h=>PEND[h.id]).filter(Boolean);if(Ps.length){undoToast("Policy approved "+Ps.length,null,Ps);audit("Inbox: policy run",p.name+" · "+Ps.length+" item"+(Ps.length>1?"s":""))}bump();refreshAll();return Ps.length}

/* ---------- events ---------- */
const inField=t=>t&&t.closest&&t.closest("input,textarea,select,[contenteditable=true]");
const hostOf=t=>t&&t.closest&&t.closest("#inbxPanel,#inbxFocus");
function setUI(id,mode){I.ui=mode?{id,mode}:null;I.anim=0;redrawCards();}
function redrawCards(){renderPanel(true);renderFocus();document.querySelectorAll("#drawer [data-inbx-card]").forEach(el=>{const it=byIdSafe(el.dataset.inbxCard)||DR[el.dataset.inbxCard];if(it)el.outerHTML=cardHTML(it,{big:true});});const ui=I.ui;if(ui){const f=document.querySelector("#drawer [data-inbx-note],#drawer [data-inbx-to]");if(f&&!hostOf(f))try{f.focus()}catch(e){}}}
const DR={};
function actOn(act,id){const it=byIdSafe(id)||byId(id);if(!it)return;
 if(act==="open"){flush();closePanel();closeFocus();try{closeDrawer()}catch(e){}setTimeout(()=>{try{it.open()}catch(e){toast("Could not open that record","warn")}},30);audit("Inbox: opened",it.title);return}
 if(act==="approve"){if(!it.can.approve){toast(it.blk||"This item cannot be approved from the inbox. Open it to decide.","warn");return}if(it.needNote){setUI(id,"approve");return}const r=decide(id,"approve");if(r&&r.ok===false)toast(r.why,"warn");closeDrawerCard(id);return}
 if(act==="reject"){if(!it.can.reject){toast(it.rejectWhy||"This module cannot reject from the inbox.","warn");return}setUI(id,"reject");return}
 if(act==="delegate"){if(!it.can.delegate){toast(it.delegateWhy||"This item cannot be delegated from the inbox.","warn");return}setUI(id,"delegate");return}
 if(act==="snooze"){setUI(id,"snooze");return}}
function closeDrawerCard(id){const d=document.querySelector('#drawer [data-inbx-card="'+id+'"]');if(d)try{closeDrawer()}catch(e){}}
function moveCur(dir){const L=visible();if(!L.length)return;let i=L.findIndex(x=>x.id===I.cur);i=i<0?0:Math.max(0,Math.min(L.length-1,i+dir));I.cur=L[i].id;I.ui=null;I.anim=1;I.focusReq="card";renderPanel(false);renderFocus();live("Item "+(i+1)+" of "+L.length+": "+L[i].title);const row=document.querySelector('.inbx-row.cur');if(row)row.scrollIntoView&&row.scrollIntoView({block:"nearest"})}
document.addEventListener("click",e=>{const T=e.target;if(!T.closest)return;let t;
 if(t=T.closest("#inbxBell")){isOpen(panel)?closePanel():openPanel();return}
 if(t=T.closest("[data-inbx-act]")){actOn(t.dataset.inbxAct,t.dataset.id);return}
 if(t=T.closest("[data-inbx-pick]")){I.cur=t.dataset.inbxPick;I.ui=null;I.anim=1;I.focusReq="card";renderPanel(true);renderFocus();return}
 if(t=T.closest("[data-inbx-nav]")){moveCur(t.dataset.inbxNav==="next"?1:-1);return}
 if(t=T.closest("[data-inbx-tab]")){I.tab=t.dataset.inbxTab;I.cur=null;I.ui=null;I.focusReq="tab";renderPanel(false);renderFocus();return}
 if(T.closest("[data-inbx-close]")){closePanel();return}
 if(T.closest("[data-inbx-focus]")){openFocus();return}
 if(T.closest("[data-inbx-focus-close]")){closeFocus();return}
 if(T.closest("[data-inbx-cancel]")){I.ui=null;I.focusReq="card";redrawCards();return}
 if(t=T.closest("[data-inbx-snooze]")){decide(t.dataset.id,"snooze",{h:+t.dataset.inbxSnooze});closeDrawerCard(t.dataset.id);return}
 if(t=T.closest("[data-inbx-undo]")){const el=t.closest(".inbx-toast");let n=0;(el._ps||[]).forEach(P=>{if(undoOne(P.it.id))n++});el.remove();if(n){I.cur=(el._ps[0]||{}).it&&el._ps[0].it.id;bump();refreshAll();live("Undone. "+n+" item"+(n>1?"s are":" is")+" back in your queue.");toast("Undone. Nothing was sent.","info")}return}
 if(t=T.closest("[data-inbx-ban]")){e.preventDefault();const el=t.closest(".inbx-banner"),id=el.dataset.id,k=t.dataset.inbxBan;if(k==="x"){el.remove();return}
  if(k==="approve"){const r=decide(id,"approve");if(r.ok===false)toast(r.why,"warn");el.remove();return}
  if(k==="review"||k==="open"){el.remove();I.cur=id;I.tab="all";openPanel();renderPanel();return}}
 if(t=T.closest("[data-inbx-bulk]")){if(t.dataset.inbxBulk==="clear"){I.sel={};refreshAll()}else bulkDialog(Object.keys(I.sel).filter(k=>I.sel[k]));return}
 if(t=T.closest("[data-inbx-bulkgo]")){const ids=(t.dataset.ids||"").split("|").filter(Boolean);const n=decideMany(ids,"approve","Bulk approved within safe rules");I.sel={};try{closeDrawer()}catch(e){}if(n)toast(n+" approved. You have 8 seconds to undo.","good");return}
 if(T.closest("[data-inbx-selsafe]")){const ok=bulkCheck(collect().filter(x=>x.kind==="approval").map(x=>x.id)).ok;I.sel={};ok.forEach(x=>I.sel[x.id]=true);refreshAll();return}
 if(T.closest("[data-inbx-settings]")){closePanel();closeFocus();S.v.inbx_v=5;go("inbox");return}
 if(T.closest("[data-inbx-open]")){openPanel();return}
 if(t=T.closest("[data-inbx-item]")){openItemDrawer(t.dataset.inbxItem);return}
 if(t=T.closest("[data-inbx-bmax]")){I.bulkMax=+t.dataset.inbxBmax;bulkDialog(Object.keys(I.sel).filter(k=>I.sel[k]));return}
 if(t=T.closest("[data-inbx-simnow]")){const it=simPush();CACHE=null;banner(it);refreshAll();return}
 if(!hostOf(T)&&isOpen(panel)&&!T.closest("#inbxBell,#inbxBanners,#inbxUndo,#drawer,.pop,[popover],#toasts,dialog"))closePanel()},true);
ROUTER.on("change",e=>{const t=e.target;if(!t.matches)return;
 if(t.matches("[data-inbx-sel]")){I.sel[t.dataset.inbxSel]=t.checked;renderPanel(true);renderFocus();return}
 if(t.matches("[data-inbx-simtoggle]")){I.sim=t.checked;toast(I.sim?"Simulated demo events are on.":"Simulated demo events are off.","info");audit("Inbox: demo events",I.sim?"on":"off");refreshAll();return}
 if(t.matches("[data-inbx-ev]"))return});
document.addEventListener("toggle",e=>{const t=e.target;if(t.matches&&t.matches("[data-inbx-ev]")&&hostOf(t)){I.evOpen=t.open}},true);
ROUTER.on("submit","[data-inbx-form]",(e,f)=>{e.preventDefault();const mode=f.dataset.inbxForm,id=f.dataset.id;const note=(f.querySelector("[data-inbx-note]")||{}).value||"",to=(f.querySelector("[data-inbx-to]")||{}).value||"";
 const err=f.querySelector("[data-inbx-err]");const r=decide(id,mode,{note:note.trim(),to});if(r.ok===false){if(err){err.textContent=r.why;err.hidden=false}return}closeDrawerCard(id)});
document.addEventListener("keydown",e=>{
 const open=isOpen(panel)||isOpen(focusEl);const inDr=!!(e.target.closest&&e.target.closest("#drawer [data-inbx-card]"));
 if(e.key==="Escape"){if(I.ui&&(open||inDr)){e.preventDefault();I.ui=null;I.focusReq="card";redrawCards();return}if(isOpen(focusEl)){e.preventDefault();closeFocus();return}if(isOpen(panel)){e.preventDefault();closePanel();return}return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(open&&e.target.closest&&e.target.closest('[role=tablist]')&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){const tabs=[...document.querySelectorAll("#"+(isOpen(focusEl)?"inbxFocus":"inbxPanel")+" [role=tab]")];let i=tabs.findIndex(x=>x===e.target.closest("[role=tab]"));i=(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;e.preventDefault();I.tab=tabs[i].dataset.inbxTab;I.cur=null;I.focusReq="tab";renderPanel(false);renderFocus();return}
 if(!open||inField(e.target))return;
 const k=e.key.toLowerCase();const it=curItem();
 if(k==="j"||e.key==="ArrowDown"){e.preventDefault();moveCur(1);return}if(k==="k"||e.key==="ArrowUp"){e.preventDefault();moveCur(-1);return}
 if(!it)return;
 if(k==="a"){e.preventDefault();actOn("approve",it.id)}else if(k==="r"){e.preventDefault();actOn("reject",it.id)}else if(k==="d"){e.preventDefault();actOn("delegate",it.id)}else if(k==="s"){e.preventDefault();actOn("snooze",it.id)}else if(k==="o"){e.preventDefault();actOn("open",it.id)}},true);
/* simple swipe on touch: left skips, right goes back (approval is always an explicit tap) */
let tx=0,ty=0;document.addEventListener("touchstart",e=>{const c=e.target.closest&&e.target.closest(".inbx-card");if(!c||!hostOf(c))return;tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
document.addEventListener("touchend",e=>{if(!tx)return;const c=e.target.closest&&e.target.closest(".inbx-card");const dx=(e.changedTouches[0].clientX-tx),dy=Math.abs(e.changedTouches[0].clientY-ty);tx=0;if(!c||Math.abs(dx)<80||dy>50)return;moveCur(dx<0?1:-1)},{passive:true});
window.addEventListener("resize",()=>{if(isOpen(panel))placePanel()});
window.addEventListener("pagehide",()=>flush());
document.addEventListener("toggle",e=>{if(e.target===panel&&e.newState==="closed")bell&&bell.setAttribute("aria-expanded","false")},true);

/* ---------- stats and metrics ---------- */
const median=a=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
function stats(){const L=collect(),c=counts(L);const waits=I.waitH.length?I.waitH:L.filter(x=>x.kind==="approval").map(x=>x.ageH);const tot=I.decided+I.undone;
 return{queue:L.length,approvals:c.approval,overdue:c.overdue,wait:Math.round(median(waits)*10)/10,perSession:I.sessions?Math.round(I.decided/I.sessions*10)/10:I.decided,autoShare:I.decided?Math.round((I.autoN||0)/I.decided*100):0,undoRate:tot?Math.round(I.undone/tot*100):0}}
function syncMetrics(){const s=stats();[["m_inbox_wait",s.wait],["m_inbox_overdue",s.overdue],["m_inbox_decisions_per_session",s.perSession],["m_inbox_auto_policy_share",s.autoShare],["m_inbox_undo_rate",s.undoRate]].forEach(([k,v])=>{if(METRICS[k]){METRICS[k].cur=v}})}
Object.assign(METRICS,{
 m_inbox_wait:{n:"Median wait for a decision",f:"Median of (time of decision − time the request reached the approver), for approvals decided in the inbox",u:"h",cur:9.5,tgt:8,badAt:24,dir:"min",max:72,tr:[16,15,14,12,12,11,10,9.5],owner:"Platform lead",use:["My inbox","Needs you panel"],rem:{kind:"sop",ref:"SOP-INBOX-1",title:"Clear approvals older than one day",agent:"Approval Advisor",auto:false,state:"idle",prog:"Escalates anything past its service level to the approver's manager and offers a delegate"}},
 m_inbox_overdue:{n:"Overdue items waiting on you",f:"Count of your open approvals and actions whose due time has passed",u:"",cur:3,tgt:0,badAt:6,dir:"min",max:20,tr:[7,6,6,5,5,4,4,3],owner:"Each approver",use:["My inbox","Needs you panel"],rem:{kind:"agent",ref:"AG-INBOX-2",title:"Offer a delegate for overdue items",agent:"Approval Advisor",auto:false,state:"idle",prog:"Suggests a delegate and drafts the reason"}},
 m_inbox_decisions_per_session:{n:"Decisions per inbox session",f:"Decisions made in the inbox ÷ times someone opened Needs you or Review one by one",u:"",cur:4.2,tgt:6,badAt:2,dir:"max",max:15,tr:[2.1,2.4,2.9,3.1,3.4,3.8,4,4.2],owner:"Platform lead",use:["My inbox"],rem:{kind:"kb",ref:"KB-INBOX-3",title:"Approve and next, with keyboard shortcuts",agent:"Approval Advisor",auto:false,state:"idle",prog:"Shows the shortcuts the first time a queue has more than five items"}},
 m_inbox_auto_policy_share:{n:"Approvals decided by your own policies",f:"Approvals decided by an auto-approval policy ÷ all approvals decided × 100",u:"%",cur:0,tgt:25,badAt:5,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Each policy owner",use:["My inbox","Auto-approval policies"],rem:{kind:"sop",ref:"SOP-INBOX-4",title:"Review auto-approval policies each quarter",agent:"Approval Advisor",auto:false,state:"idle",prog:"Backtests a policy on the last 60 decisions and lists overrides"}},
 m_inbox_undo_rate:{n:"Decisions undone",f:"Decisions undone inside the 8 second window ÷ (decisions committed + undone) × 100",u:"%",cur:0,tgt:5,badAt:15,dir:"min",max:50,tr:[9,8,8,7,6,6,5,4],owner:"Platform lead",use:["My inbox"],rem:{kind:"kb",ref:"KB-INBOX-5",title:"Slow down on high-risk items",agent:"Approval Advisor",auto:false,state:"idle",prog:"Turns off Approve and next for high-risk items when undo is above 15%"}}});
PROC.reg("inbox",{title:"Receive, decide, escalate, delegate, audit",std:["itil4","bpmn"],steps:[
 {n:"Receive",d:"The inbox collects what each module says is yours: approvals, assigned work, mentions and alerts, ranked by due time and risk.",who:"robot",owner:"Inbox",sla:"Seconds",in:"Module queues",out:"Ranked inbox items"},
 {n:"Summarize and recommend",d:"The advisor writes one line on why it matters, shows its sources and suggests approve, conditions or return.",who:"agent",owner:"Approval Advisor",sla:"Seconds",in:"Inbox item and evidence",out:"Summary and recommendation"},
 {n:"Check authority",d:"Role, delegation, the delegation of authority limit, separation of duties and any required gate decide whether you may approve.",who:"gate",owner:"Process owner",sla:"Instant",in:"Item and your roles",out:"Allowed, blocked or open record"},
 {n:"Decide",d:"You approve, reject with a reason, delegate or snooze. Approve and next moves you on.",who:"human",owner:"Approver",sla:"Per item",in:"Evidence and recommendation",out:"Decision"},
 {n:"Undo window",d:"The decision waits 8 seconds so a slip can be undone. Nothing has reached the owning module yet.",who:"robot",owner:"Inbox",sla:"8 s",in:"Decision",out:"Committed decision"},
 {n:"Commit through the owner",d:"The owning module records the decision with its own state change, audit entry and downstream effects.",who:"robot",owner:"Owning module",sla:"Seconds",in:"Committed decision",out:"Module record updated"},
 {n:"Escalate or delegate",d:"Items past their service level go to the manager. Out of office rules route covered items to the delegate.",who:"robot",owner:"Inbox",sla:"On breach",in:"Overdue item or rule",out:"Rerouted item"},
 {n:"Audit",d:"Every decision, undo, delegation and policy action is logged with who, when, why and by which route.",who:"robot",owner:"Audit service",sla:"Instant",in:"Decision events",out:"Audit trail"}]});

/* ---------- the My inbox screen ---------- */
const catOpts=()=>{const m={};collect().forEach(x=>m[x.cat]=(m[x.cat]||0)+1);return Object.keys(m).sort().map(k=>({v:k,l:k,sub:m[k]+""}))};
const srcOpts=()=>{const m={};collect().forEach(x=>m[x.src]=(m[x.src]||0)+1);return Object.keys(m).sort().map(k=>({v:k,l:(ADP[k]||{label:k}).label||k,sub:m[k]+""}))};
function rowsFor(){return flt(collect()).map(x=>({id:x.id,title:x.title,cat:x.cat,kind:x.kind,req:x.req||"",group:x.group,dueH:Math.round(x.dueH),amt:x.amt==null?-1:x.amt,risk:x.risk,src:(ADP[x.src]||{}).label||x.src,rec:x.ai&&x.ai.rec||"",conf:x.ai?Math.round(x.ai.conf*100):0,ic:x.ic,it:x}))}
function queuePane(){const L=collect(),c=counts(L);const mpK=mpHTML({id:"inbx_kind",label:"Kind",opts:catOpts(),all:"All kinds",onChange:s=>{const n=catOpts().length;I.flt.kinds=s.length===n?[]:s}});
 const mpS=mpHTML({id:"inbx_src",label:"Comes from",opts:srcOpts(),all:"All modules",onChange:s=>{const n=srcOpts().length;I.flt.srcs=s.length===n?[]:s}});
 const mpG=mpHTML({id:"inbx_grp",label:"Due",opts:GRP.map(g=>({v:g,l:g})),all:"Any time",onChange:s=>{I.flt.grp=s.length===GRP.length?[]:s}});
 const srcCount={};L.forEach(x=>{const k=(ADP[x.src]||{}).label||x.src;srcCount[k]=(srcCount[k]||0)+1});const mx=Math.max(1,...Object.values(srcCount));
 const bars=Object.entries(srcCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`<div class="inbx-br"><span>${H(k)}</span><i><u style="width:${Math.round(v/mx*100)}%"></u></i><b class="num">${v}</b></div>`).join("");
 const gcount=GRP.map(g=>[g,L.filter(x=>x.group===g).length]);
 const views_=I.views.map((v,i)=>`<button class="chip" data-inbx-view="${i}" title="Apply this saved view">${H(v.n)}</button>`).join("");
 return `<div class="grid g2 inbx-dash" style="align-items:start">${card("Where it comes from","Each bar is a module that says this is yours.",`<div class="inbx-bars">${bars||'<span class="muted">Nothing is waiting.</span>'}</div>${legend([["Items waiting","--accent"]])}`)}
  ${card("How urgent","Counted against each item's service level.",`<div class="inbx-gb">${gcount.map(g=>`<div class="inbx-gbc ${g[0]==="Overdue"?"bad":g[0]==="Due today"?"warn":""}"><b class="num">${g[1]}</b><span>${g[0]}</span></div>`).join("")}</div><p class="muted small" style="margin:10px 0 0">${c.urgent} urgent: overdue, high risk or under 4 hours left. ${legend([["Overdue","--bad-f"],["Due today","--warn-f"],["Later","--muted"]])}</p>`)}</div>
  <div class="card glass inbx-fcard"><div class="row sp" style="gap:10px;flex-wrap:wrap;align-items:flex-end">${mpK}${mpS}${mpG}<button class="btn quiet" data-inbx-flt-clear>Clear filters</button><span class="inbx-sp"></span><button class="btn" data-inbx-bulk="review-all">Bulk approve safe items</button><button class="btn" data-inbx-saveview>Save this view</button></div>
  ${views_?`<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><span class="muted small">Saved views</span>${views_}</div>`:""}</div>
  ${btHTML({id:"inbx_tbl",h:480,rowH:46,key:"id",exportName:"my-inbox",facets:["risk","kind"],cols:[
   {k:"title",label:"Item",wrap:true,fmt:r=>`<span class="inbx-tcell"><span class="inbx-ic ${r.kind}">${svgI(r.ic,14)}</span><b>${H(short(r.title,70))}</b></span>`,val:r=>r.title},
   {k:"cat",label:"Kind",fmt:r=>`<span class="pill info">${H(r.cat)}</span>`},{k:"kind",label:"Queue",fmt:r=>H(KINDS[r.kind][0])},
   {k:"req",label:"From",fmt:r=>window.R17T&&R17T.isAgent&&R17T.isAgent(r.req)?R17T.actorChip(r.req):H(r.req)},{k:"group",label:"Due",fmt:r=>`<span class="pill ${r.group==="Overdue"?"bad":r.group==="Due today"?"warn":"mute"}">${r.group}</span>`},{k:"dueH",label:"Clock",val:r=>r.dueH,fmt:r=>r.kind==="mention"?"Open":fmtH(r.dueH)},
   {k:"amt",label:"Amount",val:r=>r.amt,fmt:r=>r.amt<0?"":money0(r.amt)},{k:"risk",label:"Risk",fmt:r=>riskPill(r.risk)},{k:"rec",label:"Advisor",fmt:r=>r.rec?H(recTxt(r.rec))+" "+r.conf+"%":""},{k:"src",label:"Comes from",fmt:r=>H(r.src)}],
   rows:rowsFor,open:id=>openItemDrawer(id)})}
  <p class="muted small">Rows show what the owning modules report. Open one to see the evidence and decide here, or choose Open record to decide in the module.</p>`}
function openItemDrawer(id){const it=byIdSafe(id)||byId(id);if(!it)return;DR[id]=it;I.ui=null;openDrawer(`<div class="dfullgrid inbx-dr"><div><div class="eyebrow">My inbox</div>${cardHTML(it,{big:true})}</div></div>`)}
function boardPane(){const L=collect();const cats={};L.forEach(x=>(cats[x.cat]=cats[x.cat]||[]).push(x));const keys=Object.keys(cats).sort((a,b)=>cats[b].length-cats[a].length);
 if(!keys.length)return empty("Nothing waiting on you","Your queue is clear.");
 return `<p class="muted small">One column per kind of work. Colors on the left edge show the queue: approvals teal, actions blue-green, mentions and alerts amber.</p>${legend([["Approval","--accent"],["Action","--p4"],["Mention or alert","--warn-f"]])}
  <div class="inbx-board">${keys.map(k=>`<section class="card glass inbx-col" aria-label="${H(k)}"><div class="cardhead"><h3>${H(k)}</h3><span class="pill mute">${cats[k].length}</span></div>${cats[k].slice(0,6).map(x=>`<button class="inbx-bc ${x.kind}" data-inbx-item="${H(x.id)}"><b>${H(short(x.title,64))}</b><small>${x.req?H(x.req)+" · ":""}${x.kind==="mention"?"Open":fmtH(x.dueH)}${x.amt!=null?" · "+money0(x.amt):""}</small></button>`).join("")}${cats[k].length>6?`<span class="muted small">+${cats[k].length-6} more in the Queue tab</span>`:""}</section>`).join("")}</div>`}
const SEEDH=[["Approved","INV-20418 Northwind Cloud","Invoice","Earlier this week"],["Rejected","INV-20440 Apex Print: duplicate of INV-20391","Invoice","Earlier this week"],["Approved","AP-2090 Release $19,000 for the Northwind change window","Budget","Last week"],["Delegated to Priya Shah","CHG0298 Patch Tuesday for Windows servers","Change","Last week"],["Approved","AP-2094 Data catalog pilot","Demand","Last week"]];
function decisionsPane(){const s=stats();const rows=I.hist.map((h,i)=>Object.assign({hid:"h"+i},h)).concat(SEEDH.map((h,i)=>({hid:"s"+i,dec:h[0],title:h[1],cat:h[2],at:h[3],by:ME(),via:"earlier",note:"",kind:"approval",seed:1})));
 return `${kpiRow([["Decided in the inbox",String(I.decided),"since this session started"],["Undone",String(I.undone),"inside the 8 second window",{metric:"m_inbox_undo_rate",keep:true}],["Decided by a policy",String(I.autoN||0),s.autoShare+"% of decisions",{metric:"m_inbox_auto_policy_share",keep:true}],["Median wait",s.wait+" h","before a decision",{metric:"m_inbox_wait",keep:true}]])}
  ${btHTML({id:"inbx_hist",h:380,rowH:44,key:"hid",exportName:"inbox-decisions",facets:["dec","via"],cols:[{k:"at",label:"When"},{k:"dec",label:"Decision",fmt:r=>`<span class="pill ${/^Appr/.test(r.dec)?"good":/^Rej/.test(r.dec)?"bad":"info"}">${H(r.dec)}</span>`},{k:"title",label:"Item",wrap:true,fmt:r=>H(short(r.title,80))},{k:"cat",label:"Kind"},{k:"by",label:"Decider",fmt:r=>window.R17T&&R17T.actorChip&&r.by?R17T.actorChip(r.by):H(r.by)},{k:"via",label:"Route",fmt:r=>H(r.sim?"simulated demo event":r.via)},{k:"note",label:"Reason",wrap:true,fmt:r=>H(short(r.note,60))}],rows})}
  <p class="muted small">Earlier-week rows are sample history so you can see the shape. Everything you decide now is added at the top and written to the audit log.</p>`}
function deleHTML(){const me=ME();const mine=I.dele.filter(d=>d.owner===me);const mod=G(()=>S.flw.apx.ooo,[])||[];const cover=mod.filter(o=>o.to===me&&o.on);
 return `<div class="grid g2" style="align-items:start">${card("When you are away","Route your approvals to a delegate with dates and a dollar limit. High-risk items always stay with you.",`<div class="inbx-dl">${mine.length?mine.map(d=>`<div class="inbx-dr-row"><div><b>${pchipSafe(d.to)}</b> covers for ${H(d.owner)}<small>${d.from} to ${d.until}${d.limit?" · up to "+money0(d.limit):" · no limit"} · ${d.applied} item${d.applied===1?"":"s"} routed${d.mod?" · also set in the workflow module":""}</small></div><span class="pill ${d.on?"good":"mute"}">${d.on?"On":"Off"}</span><button class="btn quiet" data-inbx-dele="toggle:${d.id}">${d.on?"Turn off":"Turn on"}</button><button class="btn quiet" data-inbx-dele="del:${d.id}">Remove</button></div>`).join(""):'<p class="muted">No delegation rules. Add one before you go out of office.</p>'}</div><div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" data-inbx-dele="new">Add a rule</button></div>`)}
  ${card("Who covers whom right now","Rules from the workflow module and from this inbox.",`<div class="inbx-dl">${cover.length?cover.map(o=>`<div class="inbx-dr-row"><div><b>You cover ${H(o.who)}</b><small>${H(o.from)} to ${H(o.until)} · ${H(o.scope)}</small></div><span class="pill info">Covering</span></div>`).join(""):'<p class="muted">Nobody has asked you to cover for them.</p>'}${mod.filter(o=>o.who===me).map(o=>`<div class="inbx-dr-row"><div><b>${H(o.to)} covers you</b><small>${H(o.from)} to ${H(o.until)} · ${H(o.scope)}</small></div><span class="pill ${o.on?"good":"mute"}">${o.on?"On":"Off"}</span></div>`).join("")}</div><p class="muted small" style="margin:10px 0 0">Rules without a dollar limit are also written to the workflow module, so its own approvals inbox routes the same way. Rules with a limit delegate item by item.</p>`)}</div>`}
const pchipSafe=n=>G(()=>pchip(n),H(n));
function polPane(){const ps=pols();return `<p class="muted">These are rules you wrote and you own. Each one only acts inside the authority you already hold, never on high-risk items, never on something you raised, and every automatic approval is logged, shown in your history and can be undone for ${UNDO_MS/1000} seconds. Policies are off until you turn them on.</p>
 <div class="grid g3 inbx-pols">${ps.map(p=>{const hits=polHits(p);return `<article class="card glass inbx-pol"><div class="cardhead"><h3>${H(p.name)}</h3><span class="pill ${p.on?"good":"mute"}">${p.on?"On":"Off"}</span></div>
  <ul class="inbx-gr"><li>${svgI("access",13)} Only items from <b>${H((ADP[p.src]||{}).label||p.src)}</b></li><li>${svgI("access",13)} Up to <b>${p.max!=null?money0(p.max):"any amount"}</b>, low risk only</li><li>${svgI("access",13)} Advisor recommends approval at <b>${Math.round(p.minConf*100)}%</b> or more</li>${p.vendors&&p.vendors.length?`<li>${svgI("access",13)} Certified vendors: <b>${H(p.vendors.join(", "))}</b></li>`:""}<li>${svgI("access",13)} Expires <b>${H(p.exp)}</b>. Owner <b>${H(ME())}</b></li></ul>
  <p class="small">${H(p.why)}</p><p class="small"><b data-role="metric">${hits.length}</b> waiting item${hits.length===1?"":"s"} would clear today. <b data-role="metric">${p.runs}</b> cleared so far.</p>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ${p.on?"":"primary"}" data-inbx-pol="toggle:${p.id}">${p.on?"Turn off":"Turn on"}</button><button class="btn" data-inbx-pol="run:${p.id}" ${hits.length?"":"disabled"}>Run on ${hits.length} now</button><button class="btn quiet" data-inbx-pol="del:${p.id}">Remove</button></div></article>`}).join("")}</div>
 <div class="row" style="margin-top:12px"><button class="btn primary" data-inbx-pol="new">New policy</button></div>${fchip("m_inbox_auto_policy_share")}`}
function notePane(){const kinds=[["approval","Approvals"],["action","Actions"],["mention","Mentions and alerts"]];const ch=[["app","In-app banner"],["digest","Email digest"],["push","Mobile push (simulated)"]];const q=I.quiet;
 return `<div class="grid g2" style="align-items:start">${card("How you hear about things","Choose a channel per kind. Email and mobile push are simulated in this prototype: the preference is saved and shown, nothing leaves the browser.",`<div class="tscroll"><table class="inbx-pt"><thead><tr><th scope="col">Kind</th>${ch.map(c=>`<th scope="col">${c[1]}</th>`).join("")}</tr></thead><tbody>${kinds.map(k=>{const p=prefOf(k[0]);return `<tr><th scope="row">${k[1]}</th>${ch.map(c=>`<td><label class="inbx-sw"><input type="checkbox" data-inbx-pref="${k[0]}:${c[0]}" ${p[c[0]]?"checked":""} aria-label="${k[1]} by ${c[1]}"><i></i></label></td>`).join("")}</tr>`}).join("")}</tbody></table></div>`)}
  ${card("Quiet hours","Banners pause during quiet hours. Urgent items can break through.",`<div class="inbx-q"><label class="inbx-sw"><input type="checkbox" data-inbx-quiet="on" ${q.on?"checked":""}><i></i><span>Quiet hours</span></label><label class="inbx-l">From <input type="time" class="fin" data-inbx-quiet="from" value="${H(q.from)}"></label><label class="inbx-l">Until <input type="time" class="fin" data-inbx-quiet="to" value="${H(q.to)}"></label><label class="inbx-sw"><input type="checkbox" data-inbx-quiet="urgent" ${q.urgent!==false?"checked":""}><i></i><span>Urgent items break through</span></label></div><p class="muted small">${quietNow()?"Quiet hours are on right now.":"It is outside quiet hours right now."}</p>`)}
  ${card("Simulated demo events","The prototype can pretend new requests arrive so you can see banners and the badge update. They are labeled as simulated and approving one changes nothing in a module.",`<label class="inbx-sw"><input type="checkbox" data-inbx-simtoggle ${I.sim?"checked":""}><i></i><span>Send simulated arrivals now and then (Executive persona)</span></label><div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" data-inbx-simnow>Send one now</button><button class="btn" data-inbx-testpush>Send a test mobile push</button></div>`)}
  ${card("Where this fits","What the inbox reads and writes.",`<ul class="inbx-gr"><li>Reads approvals from workflows, finance, IT service management, the catalog and the platform.</li><li>Writes decisions back through each owning module, never around it.</li><li>${fchip("m_inbox_wait")} ${fchip("m_inbox_overdue")} ${fchip("m_inbox_decisions_per_session")} ${fchip("m_inbox_undo_rate")}</li></ul>`)}</div>`}
function wiringPane(){return `<p class="muted">Which modules the inbox can decide in, and which it only opens. Wired means a decision made here goes through that module's own function.</p><div class="tscroll"><table><thead><tr><th scope="col">Comes from</th><th scope="col">Module</th><th scope="col">How the inbox acts</th><th scope="col">Waiting</th></tr></thead><tbody>${Object.values(ADP).map(a=>`<tr><th scope="row">${H(a.label)}</th><td>${H(a.mod||"")}</td><td>${a.wired?`<span class="pill good">Decides through ${H(a.fn)}</span>`:`<span class="pill mute">Opens the record: ${H(a.fn)}</span>`}</td><td class="num">${collect().filter(x=>x.src===a.key).length}</td></tr>`).join("")}</tbody></table></div>`}
function inboxScreen(){const me=ME(),L=collect(),c=counts(L),s=stats();syncMetrics();
 const first=L.find(x=>x.kind==="approval"&&x.urgent)||L[0];
 const story=L.length?`<b>${c.all}</b> item${c.all===1?"":"s"} wait on ${H(me)}: <b>${c.approval}</b> approval${c.approval===1?"":"s"}, <b>${c.action}</b> action${c.action===1?"":"s"} and <b>${c.mention}</b> mention${c.mention===1?"":"s"} or alert${c.mention===1?"":"s"}. <b>${c.overdue}</b> ${c.overdue===1?"is":"are"} overdue. ${first?"Start with <b>"+H(short(first.title,70))+"</b>.":""}`:`Nothing is waiting on ${H(me)}. New requests show up in the bell at the top and in this list.`;
 const wired=Object.values(ADP).filter(a=>a.wired).length;
 return `<div class="screen inbx-scr">${hero("My inbox","What needs you, in one place",story,`<div class="row"><button class="btn primary" data-inbx-open>Open Needs you</button><button class="btn" data-inbx-focus>Review one by one</button>${fchip("m_inbox_wait")}${fchip("m_inbox_overdue")}</div>`)}${lensNote()}
 ${kpiRow([["Waiting on you",String(c.all),c.urgent+" urgent",{keep:true}],["Overdue",String(c.overdue),"past their service level",{metric:"m_inbox_overdue",keep:true}],["Median wait",s.wait+" h","for decided approvals",{metric:"m_inbox_wait",keep:true}],["Decisions per session",String(s.perSession),"opened "+I.sessions+" time"+(I.sessions===1?"":"s"),{metric:"m_inbox_decisions_per_session",keep:true}],["Modules wired",wired+" of "+Object.keys(ADP).length,"decide through the owner"]])}
 ${views("inbx_v",["Queue","Board","Decisions","Delegation","Auto-approval","Notifications","Wiring"],[queuePane(),boardPane(),decisionsPane(),deleHTML(),polPane(),notePane(),wiringPane()])}
 ${procCard("inbox")}</div>`}
REG("inbox","My inbox","people","M4 13l3-8h10l3 8v6H4zM4 13h5a3 3 0 0 0 6 0h5",inboxScreen);

/* bulk dialog */
function bulkDialog(ids){if(ids==="review-all"||ids.length===1&&ids[0]==="review-all")ids=collect().filter(x=>x.kind==="approval").map(x=>x.id);
 const r=bulkCheck(ids);openDrawer(`<div class="dfullgrid inbx-dr"><div><div class="eyebrow">Bulk approval</div><h2 style="margin:4px 0 8px">Approve ${r.ok.length} item${r.ok.length===1?"":"s"} within your safe rules</h2>
  <p class="muted">Safe means: low risk, ${money0(I.bulkMax)} or less, the advisor recommends approval at 85% or more, nothing blocks it, you did not raise it, and the owning module can record your approval. Everything else is excluded below with the reason.</p>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0"><span class="muted small">Bulk limit</span>${[500,2500,5000,10000].map(v=>`<button class="chip" data-inbx-bmax="${v}" aria-pressed="${I.bulkMax===v}">${money0(v)}</button>`).join("")}</div>
  <h3>Included (${r.ok.length})</h3>${r.ok.length?`<ul class="inbx-bl">${r.ok.map(x=>`<li><b>${H(short(x.title,80))}</b><small>${H(x.cat)}${x.amt!=null?" · "+money0(x.amt):""} · ${H((x.ai||{}).model||"")} ${x.ai?Math.round(x.ai.conf*100)+"%":""}</small></li>`).join("")}</ul>`:'<p class="muted">Nothing qualifies.</p>'}
  <h3>Excluded (${r.ex.length})</h3>${r.ex.length?`<ul class="inbx-bl ex">${r.ex.slice(0,30).map(e=>`<li><b>${H(short(e.it.title,80))}</b><small>${H(e.why)}</small></li>`).join("")}${r.ex.length>30?`<li class="muted">and ${r.ex.length-30} more</li>`:""}</ul>`:'<p class="muted">Nothing excluded.</p>'}
  <div class="row" style="gap:8px;margin-top:14px"><button class="btn primary" data-inbx-bulkgo data-ids="${H(r.ok.map(x=>x.id).join("|"))}" ${r.ok.length?"":"disabled"}>Approve ${r.ok.length}</button><button class="btn quiet" onclick="closeDrawer()">Cancel</button></div><p class="muted small">After you approve, you have ${UNDO_MS/1000} seconds to undo all of them at once.</p></div></div>`)}

/* screen events */
function refreshScreen(){if(S.screen!=="inbox")return;const a=document.activeElement;if(a&&a.closest&&a.closest("#view input,#view textarea,#view select"))return;clearTimeout(refreshScreen.t);refreshScreen.t=setTimeout(()=>{try{render()}catch(e){}},60)}
ROUTER.on("click",e=>{const T=e.target;if(!T.closest)return;let t;
 if(T.closest("[data-inbx-flt-clear]")){I.flt={};["inbx_kind","inbx_src","inbx_grp"].forEach(k=>delete S.mpSel[k]);render();return}
 if(t=T.closest("[data-inbx-view]")){const v=I.views[+t.dataset.inbxView];if(v){I.flt=JSON.parse(JSON.stringify(v.flt));S.mpSel.inbx_kind=I.flt.kinds&&I.flt.kinds.length?I.flt.kinds:undefined;S.mpSel.inbx_src=I.flt.srcs&&I.flt.srcs.length?I.flt.srcs:undefined;S.mpSel.inbx_grp=I.flt.grp&&I.flt.grp.length?I.flt.grp:undefined;["inbx_kind","inbx_src","inbx_grp"].forEach(k=>{if(S.mpSel[k]===undefined)delete S.mpSel[k]});render();toast("Applied view: "+v.n,"info")}return}
 if(T.closest("[data-inbx-saveview]")){openForm({id:"inbx_view",title:"Save this view",story:"A saved view keeps your kind, module and due filters so you can come back to them with one click.",submit:"Save view",fields:[{k:"n",label:"Name",type:"text",req:true,ph:"Overdue finance"}],onSubmit:v=>{I.views.push({n:v.n,flt:JSON.parse(JSON.stringify(I.flt))});audit("Inbox: saved view",v.n);render();return{toast:"Saved view "+v.n}}});return}
 if(t=T.closest("[data-inbx-dele]")){const [a,id]=t.dataset.inbxDele.split(":");
  if(a==="new"){openForm({id:"inbx_dele",title:"Delegate while you are away",story:"The person you pick can decide your approvals between these dates. High-risk items stay with you. Without a dollar limit the rule is also written to the workflow module, so its own inbox routes the same way.",submit:"Save rule",defaults:{from:TODAY_ISO,until:isoPlus(3)},fields:[{k:"to",label:"Delegate to",type:"people",req:true},{k:"from",label:"From",type:"date",req:true},{k:"until",label:"Until",type:"date",req:true},{k:"limit",label:"Up to this amount (blank for no limit)",type:"money"}],
    onSubmit:v=>{if(!v.to||v.to===ME())return{toast:"Pick someone other than yourself",close:false};if(v.until<v.from)return{toast:"Until must be after From",close:false};const r=createDele({to:v.to,from:v.from,until:v.until,limit:v.limit});return{toast:r.ok?"Delegated to "+v.to+" until "+v.until:r.why}}});return}
  const d=I.dele.find(x=>x.id===id);if(d){if(a==="toggle"){d.on=!d.on;if(d.on)applyDele(d);audit("Inbox: delegation rule",d.to+" "+(d.on?"on":"off"))}else if(a==="del")I.dele=I.dele.filter(x=>x!==d);bump();refreshAll();render()}return}
 if(t=T.closest("[data-inbx-pol]")){const [a,id]=t.dataset.inbxPol.split(":");const ps=pols();const p=ps.find(x=>x.id===id);
  if(a==="new"){openForm({id:"inbx_pol",title:"New auto-approval policy",story:"A policy approves routine items for you inside limits you set. It never touches high-risk items or things you raised. Every approval it makes is logged and can be undone for 8 seconds.",submit:"Create policy (off)",defaults:{src:"inv",max:"5000",minConf:"90",exp:"2027-03-31"},
   fields:[{k:"name",label:"Name",type:"text",req:true,ph:"Pay small invoices from certified vendors"},{k:"src",label:"Applies to",type:"select",req:true,opts:[["inv","Invoices"],["cat","Catalog requests"],["flow","Workflow approvals"],["chg","Change approvals"]]},{k:"max",label:"Up to this amount",type:"money"},{k:"minConf",label:"Advisor confidence at least (%)",type:"number",min:70,max:100},{k:"vendors",label:"Only these vendors (invoices)",type:"text",ph:"Northwind Cloud, Lumen Data Partners",show:v=>v.src==="inv"},{k:"exp",label:"Expires",type:"date",req:true}],
   onSubmit:v=>{ps.push({id:"pol-"+(Date.now()%100000),name:v.name,src:v.src,max:v.max?+v.max:null,minConf:Math.max(.7,(+v.minConf||90)/100),vendors:v.vendors?String(v.vendors).split(",").map(x=>x.trim()).filter(Boolean):[],on:false,runs:0,exp:v.exp,why:"Written by "+ME()+"."});audit("Inbox: new policy",v.name);bump();render();return{toast:"Policy created. It is off until you turn it on."}}});return}
  if(!p)return;if(a==="toggle"){p.on=!p.on;audit("Inbox: policy "+(p.on?"on":"off"),p.name);toast(p.on?"Policy on. Use Run now to apply it to waiting items.":"Policy off.","info");bump();render()}else if(a==="run"){const n=runPolicy(p);toast(n+" approved by policy. You have 8 seconds to undo.","good")}else if(a==="del"){I.pol[ME()]=ps.filter(x=>x!==p);bump();render()}return}
 if(T.closest("[data-inbx-testpush]")){banner(mk({id:"push:"+Date.now(),src:"sim",kind:"mention",cat:"Mobile push",ic:"bell",title:"Simulated mobile push: 3 approvals are waiting for you",sim:true,flag:true,can:{approve:false,reject:false,delegate:false}}));return}});
ROUTER.on("change",e=>{const t=e.target;if(!t.matches)return;let m;
 if(m=t.getAttribute("data-inbx-pref")){const [k,c]=m.split(":");I.prefs[k]=Object.assign(prefOf(k),{[c]:t.checked});audit("Inbox: notification preference",k+" "+c+" "+(t.checked?"on":"off"));toast("Saved","good")}
 else if(m=t.getAttribute("data-inbx-quiet")){if(t.type==="checkbox")I.quiet[m]=t.checked;else I.quiet[m]=t.value;audit("Inbox: quiet hours",m+" "+I.quiet[m]);toast("Saved","good")}});

/* ---------- chat and search ---------- */
const NUM=s=>{s=String(s||"").replace(/[,$]/g,"").toLowerCase();const m=s.match(/([\d.]+)\s*(k|thousand)?/);return m?parseFloat(m[1])*(m[2]?1000:1):null};
ASKX.push(q=>{const l=q.toLowerCase();let m;
 if(/what (needs|is waiting|do i need).{0,30}(my )?approv|my pending approvals|approvals? (waiting|pending) (on|for) me|what('s| is) in my inbox|what needs me/.test(l)){const L=collect().filter(x=>x.kind==="approval");go("inbox");say(q,{t:L.length?`<b>${L.length}</b> approval${L.length>1?"s":""} wait on you, <b>${L.filter(x=>x.urgent).length}</b> urgent. Top of the list: ${L.slice(0,3).map(x=>"<b>"+H(short(x.title,60))+"</b> ("+(x.dueH<0?fmtH(x.dueH):fmtH(x.dueH))+")").join("; ")}. Open the bell to approve and move to the next one.`:"Nothing is waiting on you.",steps:["Read every module's queue for "+ME(),"Checked your roles, delegation and limits","Ranked by due time and risk"]});setTimeout(openPanel,200);return true}
 if(m=l.match(/approve (everything|all)(?: of them)? (?:under|below|less than|up to) \$?\s*([\d.,]+\s*k?)(?: from ([\w ]+?))?\s*$/)){const lim=NUM(m[2]);const v=(m[3]||"").trim();let ids=collect().filter(x=>x.kind==="approval"&&(x.amt==null||x.amt<=lim)&&(!v||(x.title+" "+x.req+" "+x.vendor).toLowerCase().includes(v)));const keep=I.bulkMax;I.bulkMax=Math.min(I.bulkMax,lim);const r=bulkCheck(ids.map(x=>x.id));I.bulkMax=keep;
  go("inbox");say(q,{t:`I found <b>${ids.length}</b> approval${ids.length===1?"":"s"} under ${money0(lim)}${v?" matching “"+H(v)+"”":""}. <b>${r.ok.length}</b> pass the safe rules and <b>${r.ex.length}</b> are excluded (${[...new Set(r.ex.map(e=>e.why))].slice(0,3).map(H).join("; ")||"none"}). I will not approve from chat. Review the list and confirm; you get 8 seconds to undo.`,steps:["Matched amount and vendor","Applied the bulk safe rules","Opened the review list"]});
  setTimeout(()=>{I.bulkMax=Math.min(keep,lim);bulkDialog(r.ok.map(x=>x.id).concat(r.ex.map(e=>e.it.id)));I.bulkMax=keep},250);return true}
 if(/overdue/.test(l)&&/(for me|my|on me|waiting)/.test(l)){const L=collect().filter(x=>x.dueH<0&&x.kind!=="mention");go("inbox");I.flt={grp:["Overdue"]};S.mpSel.inbx_grp=["Overdue"];say(q,{t:L.length?`<b>${L.length}</b> item${L.length>1?"s are":" is"} overdue for you: ${L.slice(0,4).map(x=>"<b>"+H(short(x.title,56))+"</b> ("+fmtH(x.dueH)+")").join("; ")}.`:"Nothing is overdue for you.",steps:["Compared each item's clock with its service level","Filtered the queue to Overdue"]});render();return true}
 if(m=l.match(/delegate (?:all )?my approvals to ([a-z]+)(?: until ([a-z]+))?/)){const to=G(()=>DIR.find(d=>d.kind==="human"&&d.name.toLowerCase().startsWith(m[1]))?.name,null);if(!to)return false;const until=m[2]?nextWeekday(m[2]):isoPlus(3);const r=createDele({to,until});go("inbox");S.v.inbx_v=3;say(q,{t:r.ok?`Done. <b>${H(to)}</b> covers your approvals until <b>${until}</b>. ${r.rule.applied} waiting item${r.rule.applied===1?"":"s"} moved${r.rule.mod?" and the workflow module has the same rule":""}. High-risk items stay with you. You can change it in Delegation.`:H(r.why),steps:["Created a delegation rule","Wrote it to the workflow module and delegated waiting items","Logged it in the audit trail"]});render();return true}
 return false});
SEARCHX.push(()=>{const out=[{g:"Go to",t:"My inbox",m:"Screen",c:"--accent",f:()=>go("inbox"),k:"inbox needs you approvals pending actions notifications delegate"}];try{collect().slice(0,60).forEach(x=>out.push({g:"Inbox",t:x.title,m:x.cat+(x.amt!=null?" · "+money0(x.amt):"")+" · "+(x.kind==="mention"?"Open":fmtH(x.dueH)),c:"--accent",f:()=>{openPanel();I.cur=x.id;renderPanel()},k:x.req+" "+x.cat+" "+x.src}))}catch(e){}return out});

/* ---------- Feature contract: process, data model, metrics, interconnectivity ---------- */
const CON=window.INBOXCON={done:{},log:[]};
const ENT=[
 {id:"inbox_item",label:"Inbox item",note:"Integration decision: an inbox item is a view of work other modules own, so it stores only a pointer (source_module, source_record_id) plus the ranking and summary fields. It reuses the person and work item concepts and does not copy any approval content.",fields:[
  {k:"inbox_item_id",label:"Inbox item id",type:"string",req:true},{k:"assignee_id",label:"Assigned person",type:"reference",classification:"internal"},{k:"source_module",label:"Owning module",type:"string"},{k:"source_record_id",label:"Record in the owning module",type:"string"},{k:"item_kind",label:"Kind (approval, action, mention, alert)",type:"enum"},
  {k:"due_at",label:"Due at",type:"datetime"},{k:"sla_hours",label:"Service level hours",type:"number"},{k:"risk",label:"Risk rating",type:"enum"},{k:"amount",label:"Amount",type:"money",classification:"confidential"},{k:"status",label:"Inbox status",type:"enum"},{k:"ai_summary",label:"AI summary",type:"text"},{k:"ai_confidence",label:"AI confidence",type:"number"},{k:"authority_basis",label:"Why it is yours (role, delegation or limit)",type:"text"}]},
 {id:"approval_decision",label:"Approval decision",note:"Integration decision: the Data atlas already flagged Approval as a proposed entity. This table does not redefine it. It extends it with the decision event (who, when, how, undo window) and points to approval_id, so the proposed approval entity stays the single record of the request.",fields:[
  {k:"decision_id",label:"Decision id",type:"string",req:true},{k:"approval_id",label:"Approval (proposed entity)",type:"reference"},{k:"inbox_item_id",label:"Inbox item id",type:"reference"},{k:"decided_by_id",label:"Decided by",type:"reference",classification:"internal"},{k:"decision",label:"Decision (approved, rejected, delegated)",type:"enum"},{k:"decision_reason",label:"Reason",type:"text"},
  {k:"decision_route",label:"Route (inbox, policy, bulk)",type:"enum"},{k:"undo_window_seconds",label:"Undo window in seconds",type:"number"},{k:"committed_at",label:"Committed to the owner at",type:"datetime"},{k:"owner_result",label:"Result from the owning module",type:"enum"},{k:"overrode_recommendation",label:"Went against the AI recommendation",type:"boolean"}]},
 {id:"delegation_rule",label:"Delegation rule",note:"Integration decision: the Data atlas also lists a proposed delegation entity. This table is the inbox's rule form of it (dates, limit, scope) and reuses person for both sides. It is the same rule the workflow module's out-of-office list holds.",fields:[
  {k:"delegation_rule_id",label:"Rule id",type:"string",req:true},{k:"owner_id",label:"Delegator",type:"reference",classification:"internal"},{k:"delegate_id",label:"Delegate",type:"reference",classification:"internal"},{k:"valid_from",label:"Valid from",type:"date"},{k:"valid_to",label:"Valid to",type:"date"},{k:"scope",label:"Scope",type:"string"},{k:"amount_limit",label:"Amount limit",type:"money"},{k:"active",label:"Active",type:"boolean"},{k:"applied_count",label:"Items routed",type:"number"}]},
 {id:"notification_preference",label:"Notification preference",note:"Integration decision: extends the proposed notification entity with a per-person, per-kind channel choice and quiet hours. It never stores message content.",fields:[
  {k:"preference_id",label:"Preference id",type:"string",req:true},{k:"person_id",label:"Person",type:"reference",classification:"internal"},{k:"item_kind",label:"Kind",type:"enum"},{k:"channel_in_app",label:"In-app banner",type:"boolean"},{k:"channel_digest",label:"Email digest",type:"boolean"},{k:"channel_push",label:"Mobile push",type:"boolean"},{k:"quiet_from",label:"Quiet hours from",type:"string"},{k:"quiet_to",label:"Quiet hours until",type:"string"},{k:"urgent_breakthrough",label:"Urgent items break through",type:"boolean"}]}];
const FLOWS=[["flw_appr","pull","Workflow approvals waiting on a person","approval","api","Person opens the inbox"],["inv","pull","Invoices awaiting approval","invoice","api","Invoice scored by the advisor"],["itsm_chg","pull","Change approvals in the CAB path","change_request","api","Change reaches Authorize"],["svc_req","pull","Catalog requests pending approval","request_item","api","Request needs approval"],["fin_gates","pull","Funding gate moves awaiting approval","budget_line","api","Gate move requested"],["itsm_rel","pull","Releases in readiness review","approval","api","Release reaches review"],["kcs_home","pull","Knowledge articles in review","knowledge_article","api","Article submitted for review"],["plat_gate","pull","Citizen apps in review","app_manifest","api","App submitted"],["plat_fab","pull","Connector requests","connector","api","Request submitted"],["obs_dash","pull","Active alerts for on-call","incident","event","Alert fires"],["ppm_sow","pull","Contract changes at Approval","contract_line","api","Change reaches Approval"],["exe_mat","pull","Capability acceptances","approval","api","Deliverable finished"],
 ["flw_appr","push","Approval decisions","approval","api","Person approves, rejects or delegates"],["inv","push","Invoice decisions","invoice","api","Decision committed"],["itsm_chg","push","Change approval decisions","change_request","api","Decision committed"],["svc_req","push","Catalog approval decisions","request_item","api","Decision committed"],["fin_gates","push","Funding gate decisions","budget_line","api","Decision committed"],["itsm_rel","push","Go or no-go decisions","approval","api","Decision committed"],["kcs_home","push","Knowledge publish decisions","knowledge_article","api","Decision committed"],["plat_reg","push","Approved data entities","approval","api","Person approves an entity"],["adm_audit","push","Decision audit events","audit_event","event","Any decision, undo or delegation"]];
function tryRegister(){let again=false;
 if(!CON.done.ent){if(window.ATLAS&&ATLAS.addEntity&&window.COVER&&COVER.addEntity&&window.PLAT){CON.ent=ENT.map(e=>{const r=ATLAS.addEntity({id:e.id,label:e.label,domain:"plat",source:"Inbox",status:"proposed",ownerApp:"Inbox",ownerMod:"inbox",steward:"Platform lead",note:e.note,fields:e.fields.map(f=>Object.assign({authority:"platform",classification:f.classification||"internal"},f))});CON.log.push("ATLAS.addEntity "+e.id+": "+(r.ok?"proposed":"not added")+(r.warnings&&r.warnings.length?" ("+r.warnings.length+" notes)":""));return {id:e.id,r}});CON.done.ent=1}else again=true}
 if(!CON.done.mm){if(window.MODMAP&&MODMAP.addModule&&G(()=>MODMAP.modules.length,0)){const r=MODMAP.addModule({id:"inbox",name:"My inbox",sn:"Inbox",band:"plt",own:"Platform lead",proposed:false,r:["approval","person","inbox_item","delegation_rule","notification_preference"],w:["approval_decision","inbox_item","delegation_rule"],flows:FLOWS.map(f=>({dir:f[1],other:f[0],data:f[2],entity:f[3],mode:f[4],trig:f[5]}))});CON.mm=r;CON.log.push("MODMAP.addModule inbox: "+(r.ok?"added":r.warnings[0])+" ("+(r.warnings||[]).length+" notes)");CON.done.mm=1}else again=true}
 if(!CON.done.pl){if(window.PROCLIB&&PROCLIB.addProcess&&CON.done.mm){const r=PROCLIB.addProcess({id:"inbox_decide",name:"Decide what needs you (receive, decide, escalate, delegate, audit)",module:"inbox",family:"gov",owner:"Casey Rowan",trigger:"Something needs a person: an approval, an assigned action, a mention or an alert.",
   steps:PROC.defs.inbox.steps.map(s=>Object.assign({},s)),inputs:["Module queues","Delegation rules","Notification preferences"],outputs:["Decision committed to the owning module","Audit entry","Updated queue and badge"],entities:["inbox_item","approval_decision","delegation_rule","notification_preference","approval","person"],metrics:["m_inbox_wait","m_inbox_overdue","m_inbox_decisions_per_session","m_inbox_auto_policy_share","m_inbox_undo_rate"],model:"cmmi",std:["itil4","bpmn"]});
   CON.pl=r;CON.log.push("PROCLIB.addProcess inbox_decide: "+(r.ok?"added":r.warnings[0]));CON.done.pl=1;CON.mat=G(()=>PROCLIB.maturity("inbox_decide"),null)}else again=true}
 if(again&&(CON.tries=(CON.tries||0)+1)<40)setTimeout(tryRegister,900);else if(again){/* plat modules are not in this build: register the tables directly so the data model still shows them */
  if(!CON.done.ent&&window.DATAMODEL&&DATAMODEL.register){ENT.forEach(e=>DATAMODEL.register(e.id,{label:e.label,source:"Inbox",fields:e.fields.map(f=>({k:f.k,label:f.label,type:f.type}))}));CON.done.ent=2;CON.log.push("DATAMODEL.register used (atlas not loaded)")}}}
window.addEventListener("load",()=>setTimeout(tryRegister,600));if(document.readyState==="complete")setTimeout(tryRegister,600);

/* ---------- public API ---------- */
window.INBOX={items:()=>collect(true),counts:()=>counts(collect(true)),decide,flush,openPanel,closePanel,openFocus,closeFocus,simNow:()=>{const it=simPush();CACHE=null;banner(it);refreshAll();return it},bulkCheck,bulkDialog,createDele,applyDele,pols,polHits,runPolicy,adapters:ADP,state:I,stats,collect,hist:()=>I.hist,pending:()=>Object.keys(PEND),undo:undoOne,quietNow,wiring:()=>Object.values(ADP).map(a=>({key:a.key,label:a.label,wired:a.wired,fn:a.fn,n:collect().filter(x=>x.src===a.key).length})),contract:CON,UNDO_MS,me:ME,errs:()=>I.errs,refresh:()=>{bump();refreshAll()},isOpen:()=>({panel:isOpen(panel),focus:isOpen(focusEl)})};

/* ---------- boot: mount into the top bar and keep it mounted ---------- */
function boot(){mount();const tb=document.querySelector(".topbar");if(tb&&!boot.mo){boot.mo=new MutationObserver(()=>{if(!document.getElementById("inbxBell")||!document.getElementById("inbxBell").isConnected){cancelAnimationFrame(boot.r);boot.r=requestAnimationFrame(mount)}});boot.mo.observe(tb,{childList:true,subtree:true})}
 setInterval(()=>{try{poll();const so=document.querySelector(".tb-right");if(so&&!document.getElementById("inbxBell"))mount()}catch(e){}},6000);setTimeout(()=>{try{poll()}catch(e){}},1500);scheduleSim()}
const _ca=window.coreAfter;window.coreAfter=function(){const r=_ca&&_ca.apply(this,arguments);try{mount();updateBell()}catch(e){}return r};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,0));else setTimeout(boot,0);
})();
