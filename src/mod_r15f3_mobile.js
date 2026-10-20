/* ===== mod_r15f3_mobile: phone-first approvals queue and on-call (screen r15_mobile, route /#m).
   Reuses the inbox decision engine (INBOX.decide) and the on-call database (ONCALL). Swipe a card right to approve, left to reject, or use the large buttons.
   Decisions made offline (simulated) wait in a local queue and sync when the connection returns. The installable manifest and service worker live in docs/pwa/. */
(function(){
const R=window.R15F3,G=R.G,E=R.E;
const NOW=Date.parse(U.TODAY_ISO+"T13:30:00Z");
const M=S.r15m=S.r15m||{tab:"appr",offline:false,queue:[],done:{},ack:{},sheet:null,more:12,fromMobile:0,decided:0,banner:null};
const need=(a,r)=>window.GUARD&&GUARD.require?GUARD.require(a,r):true;
/* route: #m opens the mobile view */
(function(){const w=window.NAVX;if(w&&w.resolveAlias&&!w._r3m){const o=w.resolveAlias;w.resolveAlias=function(s){const t=String(s||"").trim().toLowerCase().replace(/^#/,"");return t==="m"||t==="mobile"?"r15_mobile":o.apply(this,arguments)};w._r3m=1}})();
setInterval(()=>{const on=S.screen==="r15_mobile";document.body.classList.toggle("r3m-on",on)},250);
const ageTxt=h=>h<1?"under 1 h":h<48?Math.round(h)+" h":Math.round(h/24)+" d";
const money=R.money;
function items(){return G(()=>INBOX.items().filter(x=>x.can&&x.can.approve&&!M.done[x.id]),[]).sort((a,b)=>(a.sc||0)-(b.sc||0))}
function queued(id){return M.queue.some(q=>q.id===id)}
function card(it){const q=queued(it.id);const ov=it.dueH!=null&&it.dueH<0;
 return `<article class="r3m-card" data-r3m-id="${E(it.id)}" tabindex="0" aria-label="${E(it.title)}"><div class="r3m-swipe l" aria-hidden="true">Reject</div><div class="r3m-swipe r" aria-hidden="true">Approve</div>
 <div class="r3m-in"><div class="r3m-top"><span class="r3-chip">${E(it.cat)}</span>${it.risk?`<span class="pill ${it.risk==="high"?"bad":it.risk==="med"?"warn":"mute"}">${E(it.risk)} risk</span>`:""}${ov?'<span class="pill bad">overdue</span>':""}</div>
 <h3 class="r3m-t">${E(it.title)}</h3>
 <div class="r3m-meta"><span>${E(it.req||"")}</span><span>${ageTxt(it.ageH||0)} waiting</span>${it.amt?`<b class="num">${money(it.amt)}</b>`:""}</div>
 <p class="r3m-why">${E(String(it.why||"").slice(0,150))}</p>
 ${q?`<div class="pill warn" style="margin-top:8px">Queued offline. Sends when you are back online.</div>`:`<div class="r3m-btns"><button class="r3m-b rej" data-r3m-act="reject" data-id="${E(it.id)}">Reject</button><button class="r3m-b del" data-r3m-act="delegate" data-id="${E(it.id)}">Delegate</button><button class="r3m-b ok" data-r3m-act="approve" data-id="${E(it.id)}">Approve</button></div>`}</div></article>`}
function apprTab(){const L=items();const n=L.length;
 return `${M.queue.length?`<div class="r3m-banner warn"><b>${M.queue.length} decision${M.queue.length>1?"s":""} queued</b><span>Offline mode (simulated)</span>${M.offline?"":`<button class="r3m-sm" data-r3m-sync>Sync now</button>`}</div>`:""}
 <div class="r3m-sub"><b>${n}</b> waiting for you<span class="muted"> · swipe right to approve, left to reject</span></div>
 ${L.slice(0,M.more).map(card).join("")||`<div class="r3m-empty"><b>Inbox clear</b><span>Nothing needs your decision.</span></div>`}
 ${n>M.more?`<button class="btn" style="width:100%;margin-top:8px" data-r3m-more>Show more (${n-M.more})</button>`:""}`}
/* on-call */
function myRotas(){const me=R.actor();return G(()=>ONCALL.rotas().filter(r=>(r.layers||[]).some(l=>(l.members||[]).includes(me))),[])}
function nextShift(){const me=R.actor();const rs=myRotas();const tiers=["Primary","Secondary","Escalation"];for(let t=NOW;t<NOW+14*864e5;t+=3*36e5){for(const r of rs)for(const tr of tiers){const w=G(()=>ONCALL.at(r,tr,t),[]);if(w.some(x=>x.who===me))return{r,tier:tr,t,now:t===NOW}}}return null}
const fdt=t=>{const d=new Date(t);return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getUTCDay()]+" "+String(d.getUTCHours()).padStart(2,"0")+":00"};
function ocTab(){const me=R.actor();const on=G(()=>ONCALL.onCallNow(me),[]);const nx=on.length?null:nextShift();const rotas=G(()=>ONCALL.rotas().slice(0,8),[]);
 return `<div class="r3m-sub"><b>${E(me)}</b><span class="muted"> · on-call</span></div>
 <div class="r3m-hero ${on.length?"live":""}">${on.length?`<div class="eyebrow">On call now</div><h3 class="r3m-t">${on.map(r=>E(r.n)).join(", ")}</h3><div class="muted small">Respond within ${G(()=>on[0].sla.respMin,15)} minutes</div>`:nx?`<div class="eyebrow">Next shift</div><h3 class="r3m-t">${E(nx.r.n)} · ${nx.tier}</h3><div class="muted small">Starts ${fdt(nx.t)} Mountain</div>`:`<div class="eyebrow">Not on call</div><h3 class="r3m-t">No shift in the next 14 days</h3>`}</div>
 <div class="r3m-sub">Who is on call now</div>
 ${rotas.map(r=>{const p=G(()=>ONCALL.now(r,"Primary"),[]),s=G(()=>ONCALL.now(r,"Secondary"),[]);return `<div class="r3m-row"><div><b>${E(r.n)}</b><div class="muted small">${E(r.tier||"")} · respond in ${G(()=>r.sla.respMin,15)} min</div></div><div class="r3m-who"><span><i>Primary</i> ${E(p.join(", ")||"MSP desk")}</span><span><i>Secondary</i> ${E(s.join(", ")||"none")}</span></div></div>`}).join("")}`}
/* incidents */
function incs(){return G(()=>S.itsm.inc.filter(i=>!/Resolved|Closed|Cancel/.test(i.st)).sort((a,b)=>(a.urg||3)-(b.urg||3)||(b.age||0)-(a.age||0)).slice(0,10),[])}
function rotaFor(i){const rs=G(()=>ONCALL.rotas(),[]);return rs.find(r=>r.target===i.grp)||rs.find(r=>/Ops|Platform/.test(r.n))||rs[0]}
function incTab(){const L=incs();return `<div class="r3m-sub"><b>${L.filter(i=>!M.ack[i.id]).length}</b> unacknowledged<span class="muted"> · ${L.length} open</span></div><button class="btn" style="width:100%;margin-bottom:10px" data-r3m-page>Simulate a page <span class="r3-sim">simulated</span></button>
 ${L.map(i=>{const a=M.ack[i.id];const r=rotaFor(i);const sev=i.urg===1?"bad":i.urg===2?"warn":"mute";return `<article class="r3m-card"><div class="r3m-in"><div class="r3m-top"><span class="r3-chip">${E(i.id)}</span><span class="pill ${sev}">P${i.urg||3}</span><span class="pill mute">${E(i.st)}</span></div><h3 class="r3m-t">${E(i.t)}</h3><div class="r3m-meta"><span>${E(i.svc||"")}</span><span>${E(i.grp||"")}</span><span>${Math.round((i.age||0)*10)/10} h old</span></div>
 ${a?`<div class="pill ${a.status==="escalated"?"warn":"good"}" style="margin-top:8px;white-space:normal">${a.status==="escalated"?"Escalated to "+E(a.to)+" at "+a.at:"Acknowledged by "+E(a.by)+" at "+a.at}</div>`:`<div class="r3m-btns two"><button class="r3m-b del" data-r3m-esc="${E(i.id)}">Escalate</button><button class="r3m-b ok" data-r3m-ack="${E(i.id)}">Acknowledge</button></div>`}</div></article>`}).join("")}`}
function moreTab(){return `<div class="r3m-sub">Install on your phone</div>
 <div class="r3m-row" style="display:block"><p class="small" style="margin:0 0 8px">The single-file build cannot register a service worker. The manifest and service worker ship in <code>docs/pwa/</code>; host them next to the page, then use Add to Home Screen.</p><ol class="small" style="margin:0;padding-left:18px"><li>Serve the page and <code>docs/pwa/</code> files from one HTTPS origin.</li><li>Open <code>/#m</code> on the phone.</li><li>Add to Home Screen. It opens straight into this view.</li></ol></div>
 <div class="r3m-sub">Connection</div>
 <label class="r3m-row" style="display:flex;align-items:center;gap:10px"><input type="checkbox" data-r3m-off ${M.offline?"checked":""}> <span><b>Simulate offline</b><div class="muted small">Decisions and acknowledgements wait in a queue and send when you turn this off.</div></span></label>
 <div class="r3m-sub">Push <span class="r3-sim">simulated</span></div><div class="r3m-row" style="display:block"><p class="small" style="margin:0">Push needs the installed app and a push service. Use Simulate a page on the Incidents tab to see the banner.</p></div>
 <div class="r3m-sub">This session</div><div class="r3m-row" style="display:block"><div class="small">${M.fromMobile} decisions from this view · ${M.queue.length} queued · ${Object.keys(M.ack).length} acknowledgements</div></div>
 <button class="btn" style="width:100%;margin-top:10px" data-go="home">Exit mobile view</button>`}
function sheetHTML(){const s=M.sheet;if(!s)return"";const it=G(()=>INBOX.items().find(x=>x.id===s.id),null);
 if(s.kind==="reject")return `<div class="r3m-scrim" data-r3m-close></div><div class="r3m-sheet" role="dialog" aria-label="Reject"><h3 class="r3m-t">Reject: ${E(it?it.title:"")}</h3><div class="r3m-chips">${["Over budget","Missing information","Not authorised","Duplicate","Timing"].map(x=>`<button class="r3m-chip ${s.reason===x?"on":""}" data-r3m-reason="${x}">${x}</button>`).join("")}</div><textarea class="r3-in" style="width:100%;margin-top:10px" rows="2" placeholder="Add a note (optional)" data-r3m-note></textarea><div class="r3m-btns two"><button class="r3m-b del" data-r3m-close>Cancel</button><button class="r3m-b rej" data-r3m-do="reject">Reject</button></div></div>`;
 const ppl=["Maya Ortiz","Jordan Lee","Avery Chen","Priya Shah","Sam Patel","Tom Becker"].filter(n=>n!==R.actor());
 return `<div class="r3m-scrim" data-r3m-close></div><div class="r3m-sheet" role="dialog" aria-label="Delegate"><h3 class="r3m-t">Delegate: ${E(it?it.title:"")}</h3>${ppl.map(n=>`<button class="r3m-pick" data-r3m-to="${E(n)}"><span class="avatar">${E(n.split(" ").map(x=>x[0]).join(""))}</span>${E(n)}</button>`).join("")}<button class="r3m-b del" style="margin-top:8px;width:100%" data-r3m-close>Cancel</button></div>`}
REG("r15_mobile","Mobile approvals and on-call","people","M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2",()=>{
 const n=items().length,ui=incs().filter(i=>!M.ack[i.id]).length;
 METRICS.m_mob_share.cur=M.decided?Math.round(M.fromMobile/M.decided*100):18;
 const body={appr:apprTab,oc:ocTab,inc:incTab,more:moreTab}[M.tab]();
 return `<div class="screen r3m" data-r3m-root>${M.banner?`<div class="r3m-page" role="alert"><b>Page: ${E(M.banner.t)}</b><div class="small">${E(M.banner.id)} · ${E(M.banner.svc||"")}</div><div class="r3m-btns two"><button class="r3m-b del" data-r3m-esc="${E(M.banner.id)}">Escalate</button><button class="r3m-b ok" data-r3m-ack="${E(M.banner.id)}">Acknowledge</button></div></div>`:""}
 <header class="r3m-head"><div><div class="eyebrow">${BRAND.name} mobile</div><h1 class="r3m-h">${{appr:"Approvals",oc:"On-call",inc:"Incidents",more:"More"}[M.tab]}</h1></div><div class="r3m-st"><span class="pill ${M.offline?"warn":"good"}">${M.offline?"Offline (simulated)":"Online"}</span></div></header>
 <div class="r3m-body">${body}</div>
 <nav class="r3m-tabs" aria-label="Mobile sections">${[["appr","Approvals",n],["oc","On-call",0],["inc","Incidents",ui],["more","More",0]].map(t=>`<button class="r3m-tab ${M.tab===t[0]?"on":""}" data-r3m-tab="${t[0]}" ${M.tab===t[0]?'aria-current="page"':""}>${t[1]}${t[2]?`<i class="r3m-n">${t[2]}</i>`:""}</button>`).join("")}</nav>${sheetHTML()}</div>`});
PROC.reg("r15_mobile",{title:"Approve or acknowledge from a phone",std:["itil5","nist"],steps:[
 {n:"Notify",d:"An approval lands in the inbox or an incident pages the on-call person.",who:"robot",owner:"Tom Becker",sla:"Seconds",in:"Inbox item or alert",out:"Push or banner"},
 {n:"Decide",d:"Approve, reject with a reason, or delegate; the role guard and delegation of authority still apply.",who:"human",owner:"Approver",sla:"Per item",in:"Item",out:"Decision"},
 {n:"Acknowledge or escalate",d:"On-call acknowledges within the response SLA or escalates to the next tier.",who:"human",owner:"On-call person",sla:"15 min",in:"Incident",out:"Acknowledgement"},
 {n:"Queue when offline",d:"Decisions wait locally and send in order when the connection returns.",who:"robot",owner:"Sam Patel",sla:"On reconnect",in:"Queued decision",out:"Synced decision"},
 {n:"Record",d:"Decision, channel and time are written to the audit trail.",who:"robot",owner:"Tom Becker",sla:"Immediate",in:"Decision",out:"Audit entry"}]});
R.metrics({
 m_mob_share:{n:"Approvals decided on mobile",f:"Approval decisions made from the mobile view ÷ All inbox approval decisions",u:"%",cur:18,tgt:30,badAt:10,dir:"max",tr:[8,10,12,14,15,16,17,18],use:["Mobile approvals and on-call"],rem:{kind:"sop",ref:"SOP-740",title:"Enable push for approvers",agent:"",auto:false,state:"idle",prog:""}},
 m_mob_ack:{n:"Incidents acknowledged within response SLA",f:"Pages acknowledged within the rota response time ÷ Pages sent",u:"%",cur:92,tgt:95,badAt:80,dir:"max",tr:[85,88,90,89,91,92,91,92],use:["Mobile approvals and on-call"],rem:{kind:"sop",ref:"SOP-741",title:"Fix escalation paths with no secondary",agent:"",auto:false,state:"idle",prog:""}}},R.owners.mob[0]);
/* ---------------- actions ---------------- */
function decide(id,act,arg){if(!need("approval.decide",{label:id}))return false;
 if(M.offline){M.queue.push({id,act,arg:arg||{},at:Date.now()});audit("Mobile: queued decision (offline, simulated)",act+" "+id);toast("Queued. It sends when you are back online.","info");return true}
 const r=G(()=>INBOX.decide(id,act,arg||{},{via:"mobile"}),{ok:false,why:"Inbox unavailable"});if(!r.ok){toast(r.why||"Could not decide","bad");return false}
 M.done[id]=1;M.fromMobile++;M.decided++;audit("Mobile: "+act,id);R.emit("approval.decided.mobile",{id,act});return true}
function sync(){let n=0;M.queue.slice().forEach(q=>{const r=G(()=>INBOX.decide(q.id,q.act,q.arg,{via:"mobile-sync"}),{ok:false});if(r.ok){M.done[q.id]=1;M.fromMobile++;M.decided++;n++}});M.queue=[];audit("Mobile: synced queue",n+" decisions");toast(n+" queued decision"+(n===1?"":"s")+" sent","good")}
function ack(id){const i=S.itsm.inc.find(x=>x.id===id);if(!i)return;const r=rotaFor(i);const ts=new Date(NOW).toISOString().slice(11,16);
 M.ack[id]={status:"acknowledged",by:R.actor(),at:ts+(M.offline?" (queued)":"")};if(M.banner&&M.banner.id===id)M.banner=null;audit("Mobile: acknowledged incident",id+(M.offline?" (offline queue, simulated)":""));R.emit("incident.acknowledged",{incident:id,by:R.actor(),via:"mobile"});toast("Acknowledged "+id,"good")}
function esc_(id){const i=S.itsm.inc.find(x=>x.id===id);if(!i)return;const r=rotaFor(i);const to=G(()=>ONCALL.now(r,"Secondary"),[])[0]||G(()=>ONCALL.now(r,"Escalation"),[])[0]||"Duty manager";
 M.ack[id]={status:"escalated",by:R.actor(),to,at:new Date(NOW).toISOString().slice(11,16)};if(M.banner&&M.banner.id===id)M.banner=null;audit("Mobile: escalated incident",id+" to "+to);R.emit("incident.escalated",{incident:id,to,via:"mobile"});toast("Escalated to "+to,"warn")}
document.addEventListener("click",e=>{const root=e.target.closest("[data-r3m-root]");if(!root)return;const t=e.target.closest("[data-r3m-tab],[data-r3m-act],[data-r3m-more],[data-r3m-sync],[data-r3m-ack],[data-r3m-esc],[data-r3m-page],[data-r3m-close],[data-r3m-reason],[data-r3m-do],[data-r3m-to]");if(!t)return;const d=t.dataset;
 if(d.r3mTab){M.tab=d.r3mTab;M.sheet=null;render()}
 else if(d.r3mAct){if(d.r3mAct==="approve"){if(decide(d.id,"approve"))render()}else{if(!need("approval.decide",{label:d.id}))return;M.sheet={kind:d.r3mAct,id:d.id,reason:""};render()}}
 else if(d.r3mMore!==undefined){M.more+=12;render()}
 else if(d.r3mSync!==undefined){sync();render()}
 else if(d.r3mAck){ack(d.r3mAck);render()}
 else if(d.r3mEsc){esc_(d.r3mEsc);render()}
 else if(d.r3mPage!==undefined){const i=incs().find(x=>!M.ack[x.id]);if(i){M.banner=i;audit("Mobile: simulated page",i.id);render()}else toast("Everything is acknowledged","info")}
 else if(d.r3mClose!==undefined){M.sheet=null;render()}
 else if(d.r3mReason){M.sheet.reason=d.r3mReason;const n=document.querySelector("[data-r3m-note]");M.sheet.note=n?n.value:"";render();const n2=document.querySelector("[data-r3m-note]");if(n2)n2.value=M.sheet.note||""}
 else if(d.r3mDo==="reject"){const n=document.querySelector("[data-r3m-note]");const note=((M.sheet.reason||"")+(n&&n.value?": "+n.value:"")).trim();if(!note){toast("Pick a reason","bad");return}if(decide(M.sheet.id,"reject",{note}))M.sheet=null;render()}
 else if(d.r3mTo){if(decide(M.sheet.id,"delegate",{to:d.r3mTo}))M.sheet=null;render()}});
document.addEventListener("change",e=>{if(e.target.matches("[data-r3m-off]")){M.offline=e.target.checked;audit("Mobile: connection",M.offline?"offline (simulated)":"online");if(!M.offline&&M.queue.length)sync();render()}});
/* swipe */
let sw=null;
document.addEventListener("pointerdown",e=>{const c=e.target.closest(".r3m-card[data-r3m-id]");if(!c||e.target.closest("button"))return;sw={c,x:e.clientX,y:e.clientY,dx:0,lock:false};c.setPointerCapture&&c.setPointerCapture(e.pointerId)});
document.addEventListener("pointermove",e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;if(!sw.lock&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){sw=null;return}sw.lock=Math.abs(dx)>8;if(!sw.lock)return;sw.dx=dx;const in_=sw.c.querySelector(".r3m-in");in_.style.transform=`translateX(${dx}px)`;sw.c.classList.toggle("go-r",dx>60);sw.c.classList.toggle("go-l",dx<-60)});
document.addEventListener("pointerup",e=>{if(!sw)return;const {c,dx}=sw;sw=null;const in_=c.querySelector(".r3m-in");in_.style.transform="";c.classList.remove("go-r","go-l");const id=c.dataset.r3mId;if(dx>110){if(decide(id,"approve"))render()}else if(dx<-110){if(need("approval.decide",{label:id})){M.sheet={kind:"reject",id,reason:""};render()}}});
document.addEventListener("pointercancel",()=>{if(sw){const i=sw.c.querySelector(".r3m-in");i.style.transform="";sw=null}});
document.addEventListener("keydown",e=>{const c=e.target.closest&&e.target.closest(".r3m-card[data-r3m-id]");if(!c||e.target.closest("button"))return;if(e.key==="ArrowRight"&&decide(c.dataset.r3mId,"approve"))render();else if(e.key==="ArrowLeft"&&need("approval.decide",{label:c.dataset.r3mId})){M.sheet={kind:"reject",id:c.dataset.r3mId,reason:""};render()}});
SEARCHX.push(()=>[{g:"Platform",t:"Mobile approvals and on-call",m:"Phone-first view, route /#m",c:"--accent",f:()=>go("r15_mobile"),k:"mobile phone pwa approvals on-call acknowledge escalate swipe offline"}]);
ASKX.push(q=>{const l=String(q).toLowerCase();if(/mobile|phone|on-?call|acknowledge|pwa|install/.test(l)&&/mobile|phone|pwa|install|acknowledge|approve/.test(l)){go("r15_mobile");say(q,{t:`${items().length} approvals wait for you and ${incs().filter(i=>!M.ack[i.id]).length} incidents are unacknowledged. The mobile view is also at /#m.`,steps:["Read the inbox","Read open incidents"]});return true}return false});
R.queue({key:"mob",name:"Mobile approvals and on-call",screen:"r15_mobile",
 ent:[{id:"oncall_ack",label:"On-call acknowledgement",domain:"ops",note:"Integration decision: extend oncall_shift. oncall_shift says who should respond; the acknowledgement records that they did, when, and whether it was escalated. Closest: oncall_shift.",fields:[["incident","Incident","ref","internal"],["by","Acknowledged by","ref","personal"],["at","At","date","internal"],["status","Status","enum","internal"],["escalated_to","Escalated to","ref","personal"],["via","Channel","enum","internal"]]},
  {id:"mobile_queue_item",label:"Mobile queued decision",domain:"ops",note:"Integration decision: new, device-local. approval_decision is the committed record; this holds a decision made offline until it syncs. Closest: approval_decision.",fields:[["item","Inbox item","ref","internal"],["action","Action","enum","internal"],["queued_at","Queued at","date","internal"],["state","State","enum","internal"]]}],
 mod:{id:"r15_mobile",sn:"Mobile",band:"ppl",own:"Service desk",r:["approval","incident","oncall_shift","person"],w:["oncall_ack","mobile_queue_item","approval_decision"],flows:[["pull","inbox","Approvals to decide","approval","api","View opened"],["pull","svc_oncall","Who is on call","oncall_shift","api","View opened"],["pull","itsm_inc","Open incidents","incident","api","View opened"],["push","inbox","Decisions made on mobile","approval_decision","event","Decision"],["push","adm_audit","Decisions and acknowledgements","audit_event","event","Action taken"],["push","itsm_inc","Acknowledgement and escalation","oncall_ack","event","Page acknowledged"]]},
 proc:{id:"mobile_approve_oncall",name:"Approve or acknowledge from a phone",owner:R.owners.mob[0],backup:R.owners.mob[1],trigger:"An approval is assigned or an incident pages the on-call person",steps:[["Notify","Approval or page reaches the phone.","robot",R.owners.mob[0],"Seconds","Item or alert","Banner"],["Decide","Approve, reject or delegate under the role guard.","human",R.owners.mob[0],"Per item","Item","Decision"],["Acknowledge or escalate","Within response SLA.","human",R.owners.mob[1],"15 min","Incident","Acknowledgement"],["Sync and record","Queue offline; audit on sync.","robot",R.owners.mob[1],"On reconnect","Queued decision","Audit entry"]],inputs:["Inbox items","Alerts"],outputs:["Decisions","Acknowledgements"],entities:["oncall_ack","mobile_queue_item","approval_decision","oncall_shift","incident"],metrics:["m_mob_share","m_mob_ack"]}});
window.R15M={state:M,decide,sync};
})();
