/* mod_zevt.js (Round 15, Agent E). Event bus: window.EVENTS = {register, emit, on, rules, addRule, log, list, ...}.
   Rules react to events (when, if, then). Persistence through window.STORE when present, else memory.
   Screen: Platform, "Events and rules". Loads before mod_zlink and the mod_r15* modules; consumers call lazily. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const arr=x=>Array.isArray(x)?x:[];
const Z=S.zevt=S.zevt||{tab:0,sel:null,dry:null,records:[],connectors:[],tasks:[],hooks:[]};
const CATALOG=new Map(),SUBS=new Map(),LOG=[],RULES=[];
let SEQ=0,PERSIST_FAIL=0;
/* PR-32 B9 tenant rows (R16 to R18): Meridian reads the entity part's own source live through the entity layer; another tenant reads its
   own pack rows through DATA.get; no rows is [] and a labeled gap, never Meridian rows. Events fired while a tenant is active carry its id. */
const TCORE=()=>!window.DATA||DATA.tenant()==="core";
const TPARTS=new WeakMap();
const TROWS=(e,part)=>{if(TCORE()){const d=window.TENANT_ENTITIES&&TENANT_ENTITIES.get(e);const p=d&&(part?d.src.find(x=>x[0]===part):d.src[0]);
  let v=null;try{v=p?p[1]():null}catch(x){}return v==null?[]:v}
 const all=DATA.get(e);if(!part)return all;let m=TPARTS.get(all);if(!m){m={};TPARTS.set(all,m)}return m[part]||(m[part]=all.filter(r=>r.part===part))};
const TGAP=w=>`<p class="muted small" data-tenant-gap="1">No data in this sample company yet${w?": "+U.esc(w):""}.</p>`;
const fchipT=id=>TCORE()||DATA.byId("metrics",id)?fchip(id):"";
/* Meridian people (core people and the directory) are not shown under another tenant: an owner or holder name becomes "" (R18) */
let TFV=-1,TFS=null;
const TFOR=()=>{if(TFV!==DATA.version){TFV=DATA.version;const mine=new Set(DATA.get("people").map(r=>r.name));TFS=new Set();
  DATA.get("people",{tenant:"core"}).concat(G(()=>DIR,[])||[]).forEach(r=>{if(r&&r.name&&!mine.has(r.name))TFS.add(r.name)})}return TFS};
const TWHO=n=>TCORE()||!n||!TFOR().has(String(n))?n:"";
const TCLEAN=v=>{if(TCORE())return true;const t=G(()=>JSON.stringify(v),"");for(const n of TFOR())if(t.indexOf(n)>=0)return false;return true};
const TOWN="not set in this sample company";
const STO=()=>window.STORE&&typeof STORE.put==="function"?STORE:null;
const NOW=()=>new Date().toISOString();
function persist(kind,rec){const s=STO();if(!s)return;try{s.put(kind,rec)}catch(e){PERSIST_FAIL++}}
/* ---------- condition language: clause (&& | ||) with path op literal; ops == != > >= < <= contains in ---------- */
function getPath(o,p){return String(p).split(".").reduce((a,k)=>a==null?undefined:a[k],o)}
function lit(s){s=s.trim();if(/^".*"$|^'.*'$/.test(s))return s.slice(1,-1);if(s==="true")return true;if(s==="false")return false;if(s==="null")return null;if(s!==""&&!isNaN(+s))return +s;if(s[0]==="["&&s.slice(-1)==="]")return s.slice(1,-1).split(",").map(lit);return s}
function clause(c,p){const m=/^\s*([\w.]+)\s*(==|!=|>=|<=|>|<|contains|in)\s*(.+?)\s*$/.exec(c);if(!m)throw new Error("Cannot read condition: "+c);
 const a=getPath(p,m[1]),b=lit(m[3]);switch(m[2]){case"==":return a==b;case"!=":return a!=b;case">":return +a>+b;case">=":return +a>=+b;case"<":return +a<+b;case"<=":return +a<=+b;
 case"contains":return String(a==null?"":a).toLowerCase().includes(String(b).toLowerCase());case"in":return arr(b).map(String).includes(String(a))}return false}
function evalIf(expr,p){expr=String(expr||"").trim();if(!expr||expr==="always")return true;
 return expr.split("||").some(or=>or.split("&&").every(c=>clause(c,p||{})))}
/* ---------- registry ---------- */
function register(e){if(!e||!e.id)return null;const prev=CATALOG.get(e.id)||{};
 const rec=Object.assign({fields:[],label:e.id,module:"",owner:""},prev,e,{fields:arr(e.fields).length?e.fields:arr(prev.fields)});CATALOG.set(e.id,rec);persist("event_definition",{id:rec.id,label:rec.label,module:rec.module,owner:rec.owner,fields:JSON.stringify(rec.fields),notification:!!rec.notification});return rec}
function on(id,fn){if(typeof fn!=="function")return()=>{};const a=SUBS.get(id)||[];a.push(fn);SUBS.set(id,a);return()=>{const b=SUBS.get(id)||[];const i=b.indexOf(fn);if(i>=0)b.splice(i,1)}}
function subscribers(id){return arr(SUBS.get(id)).length+arr(SUBS.get("*")).length}
/* ---------- actions (connector and webhook calls are simulated and labeled) ---------- */
function fill(s,p){return String(s==null?"":s).replace(/\{([\w.]+)\}/g,(m,k)=>{const v=getPath(p,k);return v==null?"":v})}
function runAction(a,p,ev,rule,dry){const t=a.action,tgt=fill(a.target||a.to||a.name||"",p);
 const out=(r,extra)=>Object.assign({action:t,target:tgt,result:r,simulated:false},extra||{});
 if(dry)return out("would run",{simulated:true,dry:true});
 switch(t){
 case"update_record":{const rec={id:"UR"+(++SEQ),entity:a.entity||tgt.split(".")[0]||"record",rid:fill(a.rid||p.id||p.recordId||"",p),field:a.field||"status",value:fill(a.value,p),at:NOW(),event:ev.eventId,rule:rule.id};Z.records.unshift(rec);Z.records.length=Math.min(Z.records.length,200);return out("set "+rec.entity+"."+rec.field+" = "+rec.value)}
 case"call_connector":{const c={id:"CC"+(++SEQ),connector:tgt||a.connector||"connector",op:a.op||"sync",at:NOW(),event:ev.eventId};Z.connectors.unshift(c);Z.connectors.length=Math.min(Z.connectors.length,100);return out("simulated call to "+c.connector,{simulated:true})}
 case"notify":{const to=tgt||a.role||"owner";const msg=fill(a.message||ev.label,p);G(()=>window.INBOX&&INBOX.refresh&&0);Z.hooks.push({to,msg,at:NOW()});Z.hooks.length=Math.min(Z.hooks.length,100);G(()=>window.NTFX&&NTFX.send&&NTFX.send(ev.id,{to:to.replace(/^\{.*\}$/,"")||"Platform owner",msg,payload:p}));return out("notified "+to)}
 case"start_workflow":{const w=tgt||a.workflow;G(()=>window.WF&&WF.start&&WF.start(w,p));return out("started "+w,{simulated:!G(()=>window.WF&&WF.start,0)})}
 case"create_task":{const tk={id:"TK"+(++SEQ),title:fill(a.title||tgt||ev.label,p),owner:fill(a.owner||"",p),at:NOW(),event:ev.eventId};Z.tasks.unshift(tk);Z.tasks.length=Math.min(Z.tasks.length,100);return out("task "+tk.id+" created")}
 case"webhook":return out("simulated POST "+(tgt||a.url||"endpoint"),{simulated:true});
 }throw new Error("Unknown action "+t)}
/* ---------- emit ---------- */
function emit(id,payload,opts){opts=opts||{};payload=payload||{};
 if(!CATALOG.has(id))register({id,label:id,module:(opts.source||"").toString(),owner:"",fields:Object.keys(payload).map(k=>({name:k,type:typeof payload[k]})),auto:true});
 const def=CATALOG.get(id);const eventId="EV"+String(++SEQ).padStart(5,"0");
 const ev={eventId,id,label:def.label,payload,source:opts.source||def.module||"",actor:opts.actor||"",at:NOW(),outcomes:[],tenant:TCORE()?"core":DATA.tenant()};
 LOG.unshift(ev);if(LOG.length>500)LOG.length=500;def.last=ev.at;def.count=(def.count||0)+1;
 [...arr(SUBS.get(id)),...arr(SUBS.get("*"))].forEach(fn=>{try{fn(ev,payload)}catch(e){ev.outcomes.push({rule:"subscriber",status:"error",detail:String(e.message||e)})}});
 RULES.filter(r=>r.enabled!==false&&(r.when===id||r.when==="*")).forEach(r=>{
  try{if(!evalIf(r.if,payload)){ev.outcomes.push({rule:r.id,status:"skipped",detail:"condition false: "+(r.if||"")});r.skipped=(r.skipped||0)+1;return}
   const res=arr(r.then).map(a=>runAction(a,payload,ev,r,false));r.fired=(r.fired||0)+1;r.last=ev.at;ev.outcomes.push({rule:r.id,status:"fired",detail:res.map(x=>x.action+": "+x.result).join("; "),simulated:res.some(x=>x.simulated)})}
  catch(e){r.errors=(r.errors||0)+1;ev.outcomes.push({rule:r.id,status:"error",detail:String(e.message||e)})}});
 persist("event_firing",{id:eventId,event:id,source:ev.source,actor:ev.actor,at:ev.at,payload:G(()=>JSON.stringify(payload),"{}"),outcomes:G(()=>JSON.stringify(ev.outcomes),"[]")});
 G(()=>window.audit&&0);
 if(S.screen==="zevt"&&!Z.holdRender)G(()=>{clearTimeout(Z._rt);Z._rt=setTimeout(render,50)});
 return eventId}
function persistRule(r){persist("event_rule",{id:r.id,when:r.when,condition:r.if||"",actions:G(()=>JSON.stringify(r.then),"[]"),enabled:r.enabled!==false,owner:r.owner||""})}
function addRule(r){if(!r||!r.when)return null;const rule=Object.assign({id:"R"+String(RULES.length+1).padStart(3,"0"),if:"",then:[],enabled:true,owner:"",fired:0,skipped:0,errors:0},r);if(RULES.some(x=>x.id===rule.id))rule.id+="_"+(++SEQ);RULES.push(rule);persistRule(rule);return rule}
function dryRun(rule,payload){const out={ok:true,matched:false,actions:[],error:null};
 try{out.matched=evalIf(rule.if,payload);out.actions=out.matched?arr(rule.then).map(a=>runAction(a,payload,{id:rule.when,label:rule.when,eventId:"dry"},rule,true)):[]}catch(e){out.ok=false;out.error=String(e.message||e)}return out}
function sample(id){const d=CATALOG.get(id);const o={};arr(d&&d.fields).forEach(f=>{o[f.name]=f.type==="number"||f.type==="money"?1000:f.type==="boolean"?true:f.sample!=null?f.sample:f.ref?f.ref.toUpperCase()+"-001":f.name})
 return o}
function list(){return [...CATALOG.values()].map(e=>Object.assign({},e,{subscribers:subscribers(e.id),rules:RULES.filter(r=>r.when===e.id||r.when==="*").length,enabledRules:RULES.filter(r=>r.enabled!==false&&(r.when===e.id||r.when==="*")).length}))}
function coverage(){const L=list();const n=L.length||1;const owned=L.filter(e=>e.owner).length,fields=L.filter(e=>arr(e.fields).length).length,reacted=L.filter(e=>e.enabledRules||e.subscribers).length,fired=L.filter(e=>e.count).length;
 const ruleFail=RULES.filter(r=>r.errors).length;
 return {events:L.length,owned,fields,reacted,fired,rules:RULES.length,enabledRules:RULES.filter(r=>r.enabled!==false).length,ruleFail,pct:Math.round(100*(owned+fields+reacted)/(3*n)),reactPct:Math.round(100*reacted/n),unreacted:L.filter(e=>!e.enabledRules&&!e.subscribers).map(e=>e.id)}}
window.EVENTS={register,emit,on,rules:RULES,addRule,log:LOG,list,catalog:CATALOG,evalIf,dryRun,sample,coverage,subscribers,persistFailures:()=>PERSIST_FAIL,
 who:TWHO,clean:TCLEAN,
 setRuleEnabled:(id,v)=>{const r=RULES.find(x=>x.id===id);if(r){r.enabled=!!v;persistRule(r)}return r},
 state:Z};
/* ---------- seed catalog ---------- */
const RO="Rina Okafor";
const f=(n,t,ref)=>({name:n,type:t||"text",ref});
[["person.created","Person created","People",[f("personId","text","person"),f("name"),f("managerId","text","person"),f("employmentType")],"People operations"],
 ["person.updated","Person updated","People",[f("personId","text","person"),f("field"),f("from"),f("to")],"People operations"],
 ["person.terminated","Person terminated","People",[f("personId","text","person"),f("lastDay","date"),f("reason")],"People operations"],
 ["person.moved","Person moved","People",[f("personId","text","person"),f("fromTeam"),f("toTeam")],"People operations"],
 ["person.employment_type_changed","Employment type changed","People",[f("personId","text","person"),f("from"),f("to")],"People operations"],
 ["vacancy.opened","Vacancy opened","People",[f("vacancyId","text","vacancy"),f("role"),f("team")],"Talent acquisition"],
 ["vacancy.filled","Vacancy filled","People",[f("vacancyId","text","vacancy"),f("personId","text","person")],"Talent acquisition"],
 ["vacancy.closed","Vacancy closed","People",[f("vacancyId","text","vacancy"),f("reason")],"Talent acquisition"],
 ["decision.approved","Decision approved","Approvals",[f("kind"),f("recordId"),f("amount","number"),f("actor","text","person"),f("module")],"Platform operations"],
 ["decision.rejected","Decision rejected","Approvals",[f("kind"),f("recordId"),f("amount","number"),f("actor","text","person"),f("reason"),f("module")],"Platform operations"],
 ["decision.deferred","Decision deferred","Approvals",[f("kind"),f("recordId"),f("until","date"),f("actor","text","person"),f("module")],"Platform operations"],
 ["decision.delegated","Decision delegated","Approvals",[f("kind"),f("recordId"),f("from","text","person"),f("to","text","person")],"Platform operations"],
 ["approval.requested","Approval requested","Approvals",[f("kind"),f("recordId"),f("approverRole"),f("dueH","number")],"Platform operations"],
 ["approval.escalated","Approval escalated","Approvals",[f("kind"),f("recordId"),f("toRole")],"Platform operations"],
 ["invoice.decided","Invoice decided","Finance",[f("invoiceId","text","invoice"),f("decision"),f("amount","number")],"Finance systems"],
 ["budget.changed","Budget request decided","Finance",[f("requestId"),f("decision"),f("amount","number")],"Finance systems"],
 ["risk.accepted","Risk accepted","Portfolio",[f("riskId","text","risk"),f("exposure","number")],"Portfolio office"],
 ["change.decided","Change decided","Service",[f("changeId","text","change"),f("decision"),f("risk")],"Service management"],
 ["incident.opened","Incident opened","Service",[f("incidentId","text","incident"),f("priority"),f("service")],"Service management"],
 ["gate.passed","Gate step passed","Platform",[f("screen"),f("step"),f("recordId")],"Platform operations"],
 ["role.assigned","Role holder changed","Platform",[f("role"),f("holder"),f("from")],"Platform operations"],
 ["article.generated","Knowledge draft generated","Knowledge",[f("articleId","text","article"),f("source")],"Knowledge management"]
].forEach(([id,label,module,fields,owner])=>register({id,label,module,fields,owner:owner==="Platform operations"?RO:owner}));
addRule({id:"R001",when:"decision.approved",if:"amount >= 50000",then:[{action:"notify",target:"Finance director",message:"Approved {kind} {recordId} for {amount}"},{action:"create_task",title:"Confirm funding for {recordId}",owner:"Finance director"}],owner:RO});
addRule({id:"R002",when:"decision.rejected",if:"",then:[{action:"update_record",entity:"approval",rid:"{recordId}",field:"status",value:"rejected"},{action:"notify",target:"{actor}",message:"Rejected {recordId}: {reason}"}],owner:RO});
addRule({id:"R003",when:"person.terminated",if:"",then:[{action:"start_workflow",target:"offboarding"},{action:"call_connector",target:"Entra ID",op:"disable account"},{action:"create_task",title:"Reassign records of {personId}",owner:"Hiring manager"}],owner:"People operations"});
addRule({id:"R004",when:"vacancy.filled",if:"",then:[{action:"update_record",entity:"vacancy",rid:"{vacancyId}",field:"status",value:"filled"},{action:"start_workflow",target:"onboarding"}],owner:"Talent acquisition"});
addRule({id:"R005",when:"approval.escalated",if:"",then:[{action:"webhook",target:"chat-ops/escalations"},{action:"notify",target:"{toRole}",message:"Escalated {kind} {recordId}"}],owner:RO});
addRule({id:"R006",when:"person.employment_type_changed",if:"to == 'Contractor'",then:[{action:"call_connector",target:"Entra ID",op:"set guest type"},{action:"create_task",title:"Review access for {personId}",owner:"Hiring manager"}],owner:"People operations"});
/* restore persisted log lazily when STORE is available */
setTimeout(()=>{const s=STO();if(!s)return;try{arr(s.all("event_rule")).forEach(x=>{if(x&&x.when&&!RULES.some(y=>y.id===x.id)){RULES.push({id:x.id,when:x.when,if:x.condition||"",then:G(()=>JSON.parse(x.actions||"[]"),[]),enabled:x.enabled!==false,owner:x.owner||"",fired:0,skipped:0,errors:0})}});
 arr(s.all("event_firing")).slice(-200).forEach(x=>{if(x&&x.event&&!LOG.some(l=>l.eventId===x.id))LOG.push({eventId:x.id,id:x.event,label:x.event,payload:G(()=>JSON.parse(x.payload||"{}"),{}),source:x.source,actor:x.actor,at:x.at,outcomes:G(()=>JSON.parse(x.outcomes||"[]"),[]),restored:true})})}catch(e){PERSIST_FAIL++}},4000);
/* ---------- metrics ---------- */
Object.assign(METRICS,{m_ev_cov:{n:"Event coverage",f:"Σ (events with an owner + events with declared fields + events with a rule or subscriber) ÷ (3 × registered events)",u:"%",cur:0,tgt:95,badAt:70,dir:"max",max:100,tr:[60,64,70,74,80,86,90,92],owner:"Platform operations",use:["Events and rules"],rem:{kind:"sop",ref:"SOP-550",title:"Register an event and its first rule",agent:"Connectivity audit",auto:false,state:"idle",prog:"Lists events nobody reacts to"}},
 m_ev_fail:{n:"Rule failures",f:"Rule firings with outcome error ÷ rule firings (fired + error)",u:"%",cur:0,tgt:1,badAt:5,dir:"min",max:20,tr:[0,0,0,0,0,0,0,0],owner:"Platform operations",use:["Events and rules"],rem:{kind:"sop",ref:"SOP-551",title:"Repair a failing rule",agent:"Connectivity audit",auto:false,state:"idle",prog:"Shows the failing condition or action"}}});
function syncM(){const c=coverage();METRICS.m_ev_cov.cur=c.pct;const e=RULES.reduce((n,r)=>n+(r.errors||0),0),fi=RULES.reduce((n,r)=>n+(r.fired||0),0);METRICS.m_ev_fail.cur=Math.round(1000*e/Math.max(1,e+fi))/10}
/* ---------- screen ---------- */
const ACTIONS=[["update_record","Update a record"],["call_connector","Call a connector (simulated)"],["notify","Notify"],["start_workflow","Start a workflow"],["create_task","Create a task"],["webhook","Webhook (simulated)"]];
const aLabel=a=>(ACTIONS.find(x=>x[0]===a)||[a,a])[1];
const ago=t=>{if(!t)return"never";const s=Math.max(0,(Date.now()-new Date(t))/1000);return s<90?Math.round(s)+" s ago":s<5400?Math.round(s/60)+" min ago":s<172800?Math.round(s/3600)+" h ago":Math.round(s/86400)+" d ago"};
const pillFor=s=>s==="fired"?"good":s==="error"?"bad":"mute";
function paneCatalog(){const L=list().sort((a,b)=>a.module.localeCompare(b.module)||a.id.localeCompare(b.id));
 return card("Event catalog",L.length+" registered events; every module registers its own and emits through window.EVENTS.emit",`<div class="tscroll"><table class="zv-t"><thead><tr><th>Event</th><th>Module and owner</th><th>Payload fields</th><th>Activity</th></tr></thead><tbody>${L.map(e=>`<tr><td><b>${H(e.label)}</b><br><small class="muted">${H(e.id)}</small></td><td>${H(e.module)}<br><small class="muted">${e.owner?H(TWHO(e.owner)||TOWN):'<span class="pill warn">unowned</span>'}</small></td><td class="small zv-fl">${arr(e.fields).map(x=>H(x.name)+(x.ref?" → "+H(x.ref):"")).join(", ")||'<span class="muted">none</span>'}</td><td class="small">${e.enabledRules} rule${e.enabledRules===1?"":"s"}${e.subscribers?", "+e.subscribers+" sub":""}<br><span class="muted">${e.count||0} fired, last ${H(ago(e.last))}</span><div class="zv-act"><button class="btn quiet" data-zevt-emit="${H(e.id)}">Emit sample</button><button class="btn quiet" data-zevt-rule="${H(e.id)}">Add rule</button></div></td></tr>`).join("")}</tbody></table></div>`,`<button class="btn" data-zevt-new-event>Register event</button>`)}
function ruleCard(r){const d=CATALOG.get(r.when);return `<div class="zv-rule card glass${r.enabled===false?" zv-off":""}"><div class="row zv-rh"><b>${H(r.id)}</b><span class="pill ${r.enabled===false?"mute":"good"}">${r.enabled===false?"Disabled":"Enabled"}</span><span class="muted small">owner ${H(TWHO(r.owner||"unassigned")||TOWN)}</span><span class="zv-sp"></span><button class="btn quiet" data-zevt-toggle="${H(r.id)}">${r.enabled===false?"Enable":"Disable"}</button><button class="btn quiet" data-zevt-dry="${H(r.id)}">Dry run</button></div>
 <dl class="kv zv-kv"><dt>When</dt><dd><b>${H(d?d.label:r.when)}</b> <small class="muted">${H(r.when)}</small></dd><dt>If</dt><dd>${r.if?`<code>${H(r.if)}</code>`:'<span class="muted">always</span>'}</dd><dt>Then</dt><dd>${arr(r.then).map(a=>`<span class="chip">${H(aLabel(a.action))}${a.target||a.title?": "+H(a.target||a.title):""}</span>`).join(" ")}</dd><dt>Record</dt><dd class="small num">${r.fired||0} fired · ${r.skipped||0} skipped · ${r.errors||0} failed${r.last?" · last "+ago(r.last):""}</dd></dl></div>`}
function paneRules(){const U=RULES.filter(r=>!r.system),Y=RULES.filter(r=>r.system);return `<div class="row zv-bar"><button class="btn primary" data-zevt-rule="">New rule</button><span class="muted small">Connector and webhook actions are simulated in this prototype and labeled so in the log.</span></div><div class="zv-rules">${U.map(ruleCard).join("")||empty("No rules","Add the first rule.")}</div>${Y.length?card("System routing rules",Y.length+" rules that send each event to its audience role; edit routing per channel on the Notification routing tab",`<div class="tscroll"><table class="zv-t"><thead><tr><th>Rule</th><th>Event</th><th>Notifies</th><th>Fired</th><th>State</th><th></th></tr></thead><tbody>${Y.map(r=>`<tr><td class="num">${H(r.id)}</td><td>${H(r.when)}</td><td class="small">${H(arr(r.then).map(a=>a.target).join(", "))}</td><td class="num">${r.fired||0}</td><td><span class="pill ${r.enabled===false?"mute":"good"}">${r.enabled===false?"Disabled":"Enabled"}</span></td><td><button class="btn quiet" data-zevt-toggle="${H(r.id)}">${r.enabled===false?"Enable":"Disable"}</button> <button class="btn quiet" data-zevt-dry="${H(r.id)}">Dry run</button></td></tr>`).join("")}</tbody></table></div>`):""}`}
const logRows=()=>{if(TCORE())return TROWS("events","log").filter(l=>!l.tenant||l.tenant==="core");const t=DATA.tenant();
 return LOG.filter(l=>l.tenant===t&&TCLEAN([l.actor,l.payload,l.outcomes])).concat(TROWS("events","log").map(r=>({eventId:r.id,id:r.type||r.id,label:r.label,payload:r.payload||{},source:r.source||"",actor:r.actor||"",at:r.at||"",outcomes:arr(r.outcomes)})))};
function paneLog(){const L=logRows().slice(0,60);return card("Firing log","Newest first; each row shows every rule that looked at the event",L.length?`<div class="tscroll"><table class="zv-t"><thead><tr><th>Time</th><th>Event</th><th>Source</th><th>Actor</th><th>Payload</th><th>Outcomes</th></tr></thead><tbody>${L.map(l=>`<tr><td class="small">${H(String(l.at||"").slice(11,19))}</td><td><b>${H(l.id)}</b><br><small class="muted">${H(l.eventId)}</small></td><td>${H(l.source)}</td><td>${H(TWHO(l.actor))}</td><td class="small"><code>${H(JSON.stringify(l.payload).slice(0,90))}</code></td><td>${arr(l.outcomes).map(o=>`<div><span class="pill ${pillFor(o.status)}">${H(o.status)}</span> <small>${H(o.rule)}${o.simulated?" (simulated part)":""}: ${H(String(o.detail).slice(0,120))}</small></div>`).join("")||'<span class="muted small">no rule matched</span>'}</td></tr>`).join("")}</tbody></table></div>`:TCORE()?empty("Nothing fired yet","Emit a sample from the catalog, or approve something in the inbox."):TGAP("event firings"),`<button class="btn" data-zevt-clear>Clear log</button>`)}
function paneCov(){const c=coverage();return `<div class="grid g4">${[["Events registered",c.events,"in the catalog"],["With an owner",c.owned+" of "+c.events,"named human or team"],["With a rule or subscriber",c.reacted+" of "+c.events,"something reacts"],["Rules enabled",c.enabledRules+" of "+c.rules,c.ruleFail+" with failures"]].map(x=>`<div class="tile glass"><span class="muted small">${H(x[0])}</span><b class="num" data-role="metric">${H(x[1])}</b><span class="muted small">${H(x[2])}</span></div>`).join("")}</div>
 ${card("Events nobody reacts to",c.unreacted.length+" events have no enabled rule and no subscriber",c.unreacted.length?`<div class="row" style="flex-wrap:wrap;gap:8px">${c.unreacted.map(i=>`<button class="chip" data-zevt-rule="${H(i)}">${H(i)}</button>`).join("")}</div>`:empty("All events have a reaction",""))}
 ${card("Metrics","Formula, owner, target and remediation on each chip",`<div class="row">${fchipT("m_ev_cov")}${fchipT("m_ev_fail")}</div>`)}`}
function screenFn(){syncM();const c=coverage();
 return `<div class="screen zv">${hero("Platform · event bus","Events and rules",`<b data-role="metric">${c.events}</b> events, <b data-role="metric">${c.enabledRules}</b> enabled rules, coverage <b data-role="metric">${c.pct}%</b>. ${logRows().length} firings in the log.`,`<div class="row">${fchipT("m_ev_cov")}${fchipT("m_ev_fail")}<button class="btn primary" data-zevt-rule="">New rule</button></div>`)}${lensNote()}
 ${views("zevt_v",["Catalog","Rules","Firing log","Coverage","Notification routing"],[paneCatalog(),paneRules(),paneLog(),paneCov(),G(()=>window.NTFX?NTFX.pane():"",'')])}</div>`}
REG("zevt","Events and rules","platform","M4 12h4l2-6 4 12 2-6h4",screenFn);
DATA.screen("zevt",{mode:"data",entities:["events","metrics"]});
/* ---------- forms ---------- */
const evOpts=()=>[...CATALOG.values()].map(e=>[e.id,e.label+" ("+e.id+")"]);
function ruleForm(when){const acts=ACTIONS.map(a=>[a[0],a[1]]);
 openForm({id:"zevt_rule",title:"New rule",story:"When the event fires and the condition is true, every chosen action runs and the outcome lands in the firing log. Use {field} in text to insert payload values.",submit:"Add rule",
  fields:[{section:"When"},{k:"when",label:"Event",type:"select",opts:evOpts(),req:true},{k:"if",label:"If (optional)",type:"text",ph:"amount >= 50000 && module == 'invoice'",help:"Clauses: field op value, joined by && or ||. Ops: == != > >= < <= contains in"},
   {section:"Then"},{k:"acts",label:"Actions",type:"multi",opts:acts,req:true},{k:"target",label:"Target / name",type:"text",ph:"Finance director, onboarding, Entra ID, {actor}",help:"Applies to notify, workflow, connector, webhook, task owner"},{k:"message",label:"Message / task title",type:"text",ph:"Approved {recordId}"},
   {k:"owner",label:"Rule owner",type:"people"}],
  defaults:{when:when||"decision.approved",acts:["notify"]},
  onSubmit:v=>{const then=arr(v.acts).map(a=>({action:a,target:v.target,message:v.message,title:v.message,owner:a==="create_task"?v.target:undefined,entity:"record",field:"status",value:"updated"}));
   const r=addRule({when:v.when,if:v.if,then,owner:v.owner||"Unassigned"});audit("Created event rule "+r.id,v.when);toast("Rule "+r.id+" added","good");closeDrawer();render()}})}
function dryForm(id){const r=RULES.find(x=>x.id===id);if(!r)return;const smp=JSON.stringify(sample(r.when),null,1);
 openForm({id:"zevt_dry",title:"Dry run "+id,story:"Evaluates the condition and lists the actions that would run. Nothing is changed or logged.",submit:"Close",
  fields:[{k:"payload",label:"Sample payload (JSON)",type:"longtext",req:true}],defaults:{payload:smp},
  live:v=>{let p;try{p=JSON.parse(v.payload)}catch(e){return `<div class="pill bad">Payload is not valid JSON</div>`}const d=dryRun(r,p);return d.ok?`<div class="card glass"><b>Condition ${d.matched?"true":"false"}</b> <span class="muted small">${H(r.if||"always")}</span>${d.actions.map(a=>`<div class="small">${H(aLabel(a.action))}: ${H(a.target)} ${a.simulated?'<span class="pill mute">simulated</span>':""}</div>`).join("")||'<div class="muted small">No action would run.</div>'}</div>`:`<div class="pill bad">${H(d.error)}</div>`},
  onSubmit:()=>closeDrawer()})}
function eventForm(){openForm({id:"zevt_new",title:"Register an event",story:"Every module should register the events it emits, with an owner and its payload fields.",submit:"Register",
 fields:[{k:"id",label:"Event id",type:"text",req:true,ph:"module.verb"},{k:"label",label:"Label",type:"text",req:true},{k:"module",label:"Module",type:"text",req:true},{k:"fields",label:"Payload fields (comma separated)",type:"text",req:true},{k:"owner",label:"Owner",type:"people",req:true}],
 onSubmit:v=>{register({id:v.id.trim(),label:v.label,module:v.module,owner:v.owner,fields:String(v.fields).split(",").map(s=>({name:s.trim(),type:"text"})).filter(x=>x.name)});audit("Registered event "+v.id,v.module);toast("Event registered","good");closeDrawer();render()}})}
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-zevt-emit]")){const id=t.dataset.zevtEmit;emit(id,sample(id),{source:"Events and rules",actor:"Casey Rowan"});toast("Emitted "+id,"good");return}
 if(t=e.target.closest("[data-zevt-rule]")){ruleForm(t.dataset.zevtRule);return}
 if(t=e.target.closest("[data-zevt-toggle]")){const r=RULES.find(x=>x.id===t.dataset.zevtToggle);if(r){window.EVENTS.setRuleEnabled(r.id,r.enabled===false);audit((r.enabled?"Enabled":"Disabled")+" rule "+r.id,r.when);render()}return}
 if(t=e.target.closest("[data-zevt-dry]")){dryForm(t.dataset.zevtDry);return}
 if(t=e.target.closest("[data-zevt-new-event]")){eventForm();return}
 if(t=e.target.closest("[data-zevt-clear]")){LOG.length=0;render();return}});
SEARCHX.push(()=>[{g:"Platform",t:"Events and rules",m:"Event bus",c:"--accent",f:()=>go("zevt"),k:"event bus rules triggers webhook firing log"},...list().map(e=>({g:"Events",t:e.label,m:e.id,c:"--info-f",f:()=>go("zevt"),k:e.id+" "+e.module}))]);
ASKX.push(q=>{const t=String(q).toLowerCase();if(!/event (bus|rules?|catalog|coverage)|which events|rules? (fired|failed)/.test(t))return false;const c=coverage();say(q,{t:`<b>${c.events}</b> events registered, <b>${c.enabledRules}</b> rules enabled, coverage <b>${c.pct}%</b>; <b>${c.unreacted.length}</b> events have no reaction.`});go("zevt");return true});
})();
