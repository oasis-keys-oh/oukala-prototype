/* Inbox (Round 11, Agent I). One place for everything that needs the signed-in person:
   approvals, actions, mentions and alerts, gathered from the modules that own them.
   Every approval acts through the owning module, so its state, audit trail and downstream effects match its own screen.
   Decisions wait 8 seconds so they can be undone, then go through the owner. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const NOW0=Date.UTC(2026,9,6,16,0,0);          /* the prototype's "today": Tue Oct 6 2026 */
const USERS={exec:"Casey Rowan",fin:"Avery Chen",pm:"Priya Shah",ops:"Tom Becker"};
const ME=()=>USERS[S.persona]||"Casey Rowan";
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
defAdp("fab",{label:"Fabric connector requests",mod:"Integration fabric",fn:"FAB.openProject (record drawer)",wired:false,
 list(me){if(!(window.FAB&&FAB.projects))return[];const p0=FAB.projects.filter(p=>(p.stage==="awaiting"&&me==="Casey Rowan")||((p.stage==="evaluating"||p.stage==="proposed")&&me==="Tom Becker"));return p0.map(p=>mk({id:"fab:"+p.id,src:"fab",sid:p.id,cat:"Connector request",ic:"plug",title:p.id+" "+p.t,req:p.owner||p.by,ageH:(p.created||2)*12,slaH:72,dueH:72-(p.created||2)*12,risk:p.risk==="High"||p.risk==="high"?"high":"med",
   why:"Routed to "+((p.route||{}).n||"the platform team")+" by the machine-to-machine rules: "+((p.route||{}).why||"standard risk")+".",ai:mkAI(p.purpose||"",.8,"Integration Advisor",["Connector catalog","Data classes"],"conditions"),guard:"Approval creates a connector with the scope you pick. Decide it in the fabric.",ev:[["Systems",(p.systems||[]).join(", "),""],["Direction",p.dir||"",""],["Volume",p.vol||"",""]],can:{approve:false,reject:false,delegate:false},openLabel:"Open to decide",open:()=>{go("plat_fab");if(FAB.openProject)FAB.openProject(p.id)}}))}});
defAdp("gapp",{label:"Citizen app certification",mod:"Citizen apps",fn:"go plat_gate (screen)",wired:false,
 list(me){if(!(window.GATE&&GATE.apps)||me!=="Casey Rowan")return[];return GATE.apps().filter(a=>a.status==="review").map(a=>{const c=G(()=>GATE.conformance(a.id),{rows:[]});const fail=(c.rows||[]).filter(r=>r.r==="fail");return mk({id:"gapp:"+a.id,src:"gapp",sid:a.id,cat:"App certification",ic:"gate",title:"Certify "+a.n+" at the "+a.tier+" tier",req:a.builder,ageH:96,slaH:240,dueH:120,risk:fail.length?"med":"low",
   why:"You chair the certification board for citizen apps.",ai:mkAI(a.purpose+" "+(fail.length?fail.length+" check"+(fail.length>1?"s":"")+" failing.":"All checks pass."),fail.length?.6:.9,"Platform Governance Agent",["12 conformance checks"],fail.length?"conditions":"approve"),guard:"Hard-stop checks must pass for the tier. Waivers expire.",
   ev:(c.rows||[]).filter(r=>r.r!=="pass").slice(0,5).map(r=>[r.n,r.ev,r.r==="fail"?"bad":"warn"]),can:{approve:false,reject:false,delegate:false},openLabel:"Open to decide",open:()=>go("plat_gate")})})}});
defAdp("debt",{label:"Platform exceptions and debt",mod:"Technical debt ledger",fn:"go plat_debt (screen)",wired:false,
 list(me){if(!(window.DEBT&&DEBT.items)||me!=="Casey Rowan")return[];return DEBT.items().filter(d=>d.status==="open"&&(d.sev==="High"||d.sev==="Critical")).slice(0,6).map(d=>mk({id:"debt:"+d.id,src:"debt",sid:d.id,cat:"Debt decision",ic:"debt",title:"Accept, schedule or fix: "+d.title,req:d.owner,ageH:d.age*24,slaH:90*24,dueH:dueFromISO(d.due,0),risk:d.sev==="High"||d.sev==="Critical"?"high":"med",
   why:"As CIO you decide whether to accept this platform debt or fund the fix.",ai:mkAI("Interest is about "+d.interest+" hours a month. "+d.iformula,.7,"Debt Advisor",["Debt ledger"],"conditions"),guard:"Accepting debt is a recorded risk decision with an expiry.",ev:[["Severity",d.sev,d.sev==="High"?"bad":"warn"],["Owner",d.owner,""],["Open for",d.age+" days",""]],can:{approve:false,reject:false,delegate:false},openLabel:"Open to decide",open:()=>go("plat_debt")}))}});
