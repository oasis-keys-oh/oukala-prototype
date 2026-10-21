/* mod_r15e_ntf.js (Round 15, Agent E). Notification types registered through EVENTS, routable per role and channel, with person
   preferences. window.NTFX = {types, route, send, setRoute, setPref, pane, log}. Applied by R15E.phaseB (via mod_zlink boot). */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const arr=x=>Array.isArray(x)?x:[];
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const RS=S.r15e=S.r15e||{roles:[],bak:{},gate:[],ver:0,applied:{}};
const N=RS.ntf=RS.ntf||{route:{},pref:{},log:[],reg:0};
const CH=[["teams","Teams"],["email","Email"],["sms","SMS"],["push","Push"],["inapp","In-app"]];
const BUS=[["invoice.decided","Invoice approved, held or rejected","Finance","Finance director, invoice owner"],["budget.decided","Budget request decided","Finance","Budget owner, requester"],["risk.accepted","Risk accepted or closed","Portfolio","Risk owner, portfolio lead"],["project.status","Project status changed","Portfolio","Project manager, sponsor"],["meeting.action","Meeting action overdue","Meetings","Action owner, chair"],["contract.renewal","Contract renewal window opens","Finance","Contract owner"],["owner.gap","Ownership gap opened","Platform","Platform owner"],["debt.item","Technical debt item added","Platform","Platform owner"],
 ["decision.approved","Decision approved","Approvals","Requester, approver"],["decision.rejected","Decision rejected","Approvals","Requester, approver"],["decision.deferred","Decision deferred","Approvals","Requester"],["approval.escalated","Approval escalated","Approvals","Escalation role"]];
const DEFCH={Urgent:{teams:1,email:1,sms:1,push:1,inapp:1},High:{teams:1,email:1,sms:0,push:1,inapp:1},Normal:{teams:1,email:1,sms:0,push:0,inapp:1},Info:{teams:0,email:1,sms:0,push:0,inapp:1}};
/* PR-32 B9 (R16 to R18): under another tenant the pane lists that tenant's own notification types (events part "service") and hides
   Meridian holders and deliveries; Meridian is unchanged. */
const TCORE=()=>!window.DATA||DATA.tenant()==="core";
const TWHO=n=>G(()=>EVENTS.who(n),n);
const svcEv=()=>TCORE()?G(()=>window.SVCEVT,[]):DATA.get("events").filter(r=>r.part==="service");
function types(src){const out=[];arr(src||G(()=>window.SVCEVT,[])).forEach(e=>out.push({id:"ntf."+slug(e.src)+"."+slug(e.n),label:e.n,module:e.src,sev:e.sev,aud:e.to,x:e.x,owner:null,src:"Notification engine"}));
 BUS.forEach(b=>out.push({id:b[0],label:b[1],module:b[2],sev:"Normal",aud:b[3],x:DEFCH.Normal,owner:null,src:"Business event"}));return out}
function personFor(role){return G(()=>R15E.roles.holderOf(role),"")||G(()=>R15E.personOf(role),"")||G(()=>R15E.ensureRole(role),"")}
const isRuntime=role=>G(()=>{const r=R15E.roles.resolve(role);return !!(r&&r.runtime)},false);
function register(){let n=0;if(!window.EVENTS)return 0;
 types().forEach(t=>{const own=personFor(t.aud.split(",")[0].trim())||G(()=>R15E.personOf(t.module),"")||"Noor Haddad";const had=window.EVENTS.catalog.has(t.id);
  window.EVENTS.register({id:t.id,label:t.label,module:t.module,owner:(window.EVENTS.catalog.get(t.id)||{}).owner||own,notification:true,severity:t.sev,audience:t.aud,fields:(window.EVENTS.catalog.get(t.id)||{fields:[]}).fields.length?window.EVENTS.catalog.get(t.id).fields:[{name:"recipient",type:"text",ref:"person"},{name:"recordId",type:"text"},{name:"severity",type:"text"}]});
  if(!had)n++;
  if(!N.route[t.id]){N.route[t.id]=t.aud.split(",").map(s=>s.trim()).filter(Boolean).map(role=>({role,ch:Object.assign({},t.x||DEFCH[t.sev]||DEFCH.Normal)}))}});
 sysRules();N.reg=window.EVENTS.list().filter(e=>e.notification).length;return n}
const EXTRA={"person.updated":["People operations","Person record changed: {field}"],"vacancy.opened":["Talent acquisition","Vacancy opened: {role}"],"vacancy.closed":["Talent acquisition","Vacancy closed: {reason}"],"approval.requested":["{approverRole}","Approval requested: {kind} {recordId}"],"decision.delegated":["{to}","Delegated to you: {recordId}"],"gate.passed":["{actor}","Gate decided on {screen}: {step}"],"role.assigned":["Platform owner","Role {role} now held by {holder}"],"article.generated":["Knowledge manager","Draft article {articleId} generated from {source}"],"invoice.decided":["Finance director","Invoice {invoiceId} {decision}"],"risk.accepted":["Portfolio lead","Risk {riskId} accepted"],"change.decided":["Change manager","Change {changeId} {decision}"],"incident.opened":["Service desk lead","Incident {incidentId} opened: {priority}"],"budget.changed":["Budget owner","Budget request {requestId} {decision}"],"workflow.step.failed":["Platform owner","Workflow step failed"],"workflow.sla.breached":["Platform owner","Workflow SLA breached"],"workflow.cancelled":["Platform owner","Workflow cancelled"],"access.denied":["Security lead","Access denied"],"agent.run.awaiting_approval":["AI governance lead","An agent run awaits approval"]};
function sysRules(){if(!window.EVENTS)return;const have=new Set(EVENTS_RULES().map(r=>r.when));
 window.EVENTS.list().forEach(e=>{if(have.has(e.id))return;let tgt,msg;if(e.notification){const first=String(e.audience||"").split(",")[0].trim();tgt=first||"Platform owner";msg=e.label}else if(EXTRA[e.id]){tgt=EXTRA[e.id][0];msg=EXTRA[e.id][1]}else return;
  window.EVENTS.addRule({id:"S-"+e.id.replace(/^ntf\./,"").replace(/[^a-z0-9]+/gi,"-").slice(0,34),when:e.id,if:"",then:[{action:"notify",target:tgt,message:msg}],owner:e.owner||"Platform operations",system:true})})}
const EVENTS_RULES=()=>window.EVENTS.rules;
function route(id){return arr(N.route[id]).map(r=>{const h=personFor(r.role);return {role:r.role,holder:h,ch:r.ch}})}
function effective(id,person){const out={};arr(N.route[id]).forEach(r=>{if(personFor(r.role)===person||!person)Object.keys(r.ch).forEach(c=>{if(r.ch[c])out[c]=1})});const p=(N.pref[person]||{})[id]||{};Object.keys(p).forEach(c=>{if(p[c])out[c]=1;else delete out[c]});return Object.keys(out)}
function send(id,o){o=o||{};const to=o.to||"";const person=personFor(to)||to;const chans=effective(id,person);const use=chans.length?chans:["inapp"];
 use.forEach(c=>N.log.unshift({event:id,to:person||to,role:to,channel:c,msg:String(o.msg||"").slice(0,120),at:new Date().toISOString(),tenant:TCORE()?"core":DATA.tenant()}));N.log.length=Math.min(N.log.length,200);
 return use}
function setRoute(id,role,ch,on){const r=arr(N.route[id]).find(x=>x.role===role);if(r){r.ch[ch]=on?1:0;audit("Notification routing changed",id+" · "+role+" · "+ch+" "+(on?"on":"off"))}}
function setPref(person,id,ch,on){N.pref[person]=N.pref[person]||{};N.pref[person][id]=N.pref[person][id]||{};N.pref[person][id][ch]=on?1:0;audit("Notification preference changed",person+" · "+id+" · "+ch)}
const me=()=>G(()=>window.CURUSER?CURUSER.name():PERSONAS[S.persona].name,"Casey Rowan");
function pane(){register();const L=types(svcEv());const m=me();const T=TCORE()?"core":DATA.tenant();
 L.forEach(t=>{if(!N.route[t.id])N.route[t.id]=String(t.aud||"").split(",").map(s=>s.trim()).filter(Boolean).map(role=>({role,ch:Object.assign({},t.x||DEFCH[t.sev]||DEFCH.Normal)}))});
 const LG=N.log.filter(l=>(l.tenant||"core")===T&&(T==="core"||(TWHO(l.to)&&G(()=>EVENTS.clean(l.msg),true))));
 const rows=L.map(t=>{const rt=route(t.id);return `<tr><td><b>${H(t.label)}</b><br><small class="muted">${H(t.id)}</small></td><td>${H(t.module)}</td><td>${rt.map(r=>`<div class="small"><b>${H(r.role)}</b>${TWHO(r.holder)?` <span class="muted">→ ${H(TWHO(r.holder))}</span>`:isRuntime(r.role)?' <span class="pill mute">from the record</span>':' <span class="pill warn">no holder</span>'}</div>`).join("")}</td><td>${rt.map(r=>`<div class="zv-ch">${CH.map(c=>`<label class="zv-chb"><input type="checkbox" data-ntf-route="${H(t.id)}|${H(r.role)}|${c[0]}" ${r.ch[c[0]]?"checked":""} aria-label="${H(r.role+" "+c[1])}"><span>${c[1]}</span></label>`).join("")}</div>`).join("")}</td></tr>`}).join("");
 return `<div class="grid g3 zv-tiles">${[["Notification types",L.length,"registered through EVENTS"],["Routable per role",L.filter(t=>route(t.id).length).length+" of "+L.length,"audience mapped to a role"],["Deliveries logged",LG.length,"this session"]].map(x=>`<div class="tile glass"><span class="muted small">${H(x[0])}</span><b class="num" data-role="metric">${H(x[1])}</b><span class="muted small">${H(x[2])}</span></div>`).join("")}</div>`+
 card("Notification routing","Every type registered in the event catalog. Tick a channel to route that role there; your own preferences are set in the card below",`<div class="tscroll"><table class="zv-t"><thead><tr><th>Type</th><th>Module</th><th>Audience role to holder</th><th>Channels</th></tr></thead><tbody>${rows}</tbody></table></div>`,`<button class="btn" data-ntf-test>Send a test to me</button>`)+
 card("My preferences",H(m)+": choose the channels you receive for each type",`<div class="tscroll"><table class="zv-t"><thead><tr><th>Type</th>${CH.map(c=>`<th>${c[1]}</th>`).join("")}</tr></thead><tbody>${L.filter(t=>effective(t.id,m).length||(N.pref[m]||{})[t.id]).map(t=>`<tr><td>${H(t.label)}</td>${CH.map(c=>`<td><input type="checkbox" data-ntf-pref="${H(t.id)}|${c[0]}" ${effective(t.id,m).includes(c[0])?"checked":""} aria-label="${H(t.label+" "+c[1])}"></td>`).join("")}</tr>`).join("")||`<tr><td colspan="6" class="muted">No notification types route to you.</td></tr>`}</tbody></table></div>`)+
 card("Delivery log","Most recent first",LG.length?`<div class="tscroll"><table class="zv-t"><thead><tr><th>Time</th><th>Type</th><th>To</th><th>Channel</th><th>Message</th></tr></thead><tbody>${LG.slice(0,15).map(l=>`<tr><td class="small">${H(l.at.slice(11,19))}</td><td>${H(l.event)}</td><td>${H(l.to)}</td><td>${H(l.channel)}</td><td class="small">${H(l.msg)}</td></tr>`).join("")}</tbody></table></div>`:empty("Nothing delivered yet","Use a rule with a Notify action, or send a test."))}
document.addEventListener("change",e=>{let t;if(t=e.target.closest("[data-ntf-route]")){const [id,role,c]=t.dataset.ntfRoute.split("|");setRoute(id,role,c,t.checked);return}
 if(t=e.target.closest("[data-ntf-pref]")){const [id,c]=t.dataset.ntfPref.split("|");setPref(me(),id,c,t.checked)}});
document.addEventListener("click",e=>{if(e.target.closest("[data-ntf-test]")){const t=types()[0];const u=send(t.id,{to:me(),msg:"Test notification"});toast("Test sent via "+u.join(", "),"good");render()}});
window.NTFX=Object.assign(window.NTFX||{},{types,route,send,setRoute,setPref,pane,register,effective,log:()=>N.log,state:N});
const prevB=window.R15E&&R15E.phaseB;
window.R15E=window.R15E||{};R15E.phaseN=register;
})();
