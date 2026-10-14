/* ===== Round 17, Agent S, part C: screen "Rules and scripts" (r17s_rules, alias #rules).
   Tabs: Overview, Rules, Editor, Test, Firing log, Library, Governance. The Editor and Test tabs live in part D (R.UI.editor, R.UI.test). ===== */
(function(){
"use strict";
const W=window,DOC=document;const R=W.RULES;if(!R)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const arr=x=>Array.isArray(x)?x:[];
const D=R.data;
const UI=R.UI=R.UI||{};
const U=UI.st=UI.st||{q:"",ft:"",fs:"",tbl:"",sort:"order",sel:"",draft:null,dirty:false,logq:"",logo:"",logd:true,libq:"",govRule:"",aiText:"",aiNote:"",flash:""};
const pill=(t,c)=>`<span class="pill ${c||"mute"}">${H(t)}</span>`;
const person=n=>n?(typeof pchip==="function"?pchip(n):H(n)):`<span class="pill bad">None</span>`;
const rel=ts=>{if(!ts)return "never";const d=Date.now()-ts;if(d<60e3)return "just now";if(d<36e5)return Math.round(d/6e4)+" min ago";if(d<864e5)return Math.round(d/36e5)+" h ago";return Math.round(d/864e5)+" days ago"};
const TYPE_COL={client:"--info-f",business:"--accent",notify:"--warn-f",uiaction:"--good-f",choice:"--p4"};
UI.typePill=t=>`<span class="r17s-type" style="--r17s-c:var(${TYPE_COL[t]||"--accent"})">${H(R.TYPES[t]?R.TYPES[t].short:t)}</span>`;
const entLabel=id=>{const e=R.entity(id);return e?e.label:(G(()=>DATAMODEL.tables[id].label,id)||id)};
UI.entLabel=entLabel;
const stPill=r=>r.rt.tripped?pill("Suspended by loop guard","bad"):r.status==="active"?pill(r.dirty?"Live, edits not approved":"Live","good"):r.status==="pending"?pill("Waiting for approval","warn"):r.status==="retired"?pill("Retired","mute"):pill("Draft","info");
UI.stPill=stPill;
const kpi=(l,v,sub,tone)=>`<div class="r17s-kpi ${tone||""}"><small>${H(l)}</small><b class="num" data-role="metric">${H(v)}</b><em>${H(sub||"")}</em></div>`;
const noOwner=r=>!(r.body.owner&&r.body.backup&&r.body.owner!==r.body.backup);
const legend=()=>`<div class="r17s-legend" aria-label="Rule type colors">${Object.keys(R.TYPES).map(t=>`<span>${UI.typePill(t)}</span>`).join("")}</div>`;
const kill=()=>{const k=D.kill;const off=k.all||Object.keys(k.types).some(t=>k.types[t]);if(!off)return "";
 return `<div class="r17s-killbar" role="alert"><b>Rules are switched off</b> ${k.all?"All rules are off":Object.keys(k.types).filter(t=>k.types[t]).map(t=>R.TYPES[t].label+"s").join(", ")+" are off"}. Records save without them. Switched by ${H(k.by)} ${rel(k.at)}${k.reason?": "+H(k.reason):""}. <button type="button" class="btn sm" data-r17s-tab="6">Open Governance</button></div>`};

/* ---------------- Overview ---------------- */
function overview(){const s=R.stats();const live=D.rules.filter(r=>r.status==="active");
 const mx=Math.max(1,...Object.values(s.byType));
 const typeBars=Object.keys(R.TYPES).map(t=>{const n=s.byType[t]||0;return `<div class="r17s-bar"><span class="r17s-bl">${UI.typePill(t)}</span><i style="--w:${Math.round(100*n/mx)}%;--r17s-c:var(${TYPE_COL[t]})"></i><b class="num">${n}</b></div>`}).join("");
 const tk=Object.keys(s.byTrigger).sort((a,b)=>s.byTrigger[b]-s.byTrigger[a]);const tmx=Math.max(1,...Object.values(s.byTrigger));
 const trigName={};Object.keys(R.TRIG).forEach(t=>R.TRIG[t].forEach(x=>trigName[x[0]]=x[1]));
 const trigBars=tk.map(k=>`<div class="r17s-bar"><span class="r17s-bl small">${H(trigName[k]||k)}</span><i style="--w:${Math.round(100*s.byTrigger[k]/tmx)}%;--r17s-c:var(--accent)"></i><b class="num">${s.byTrigger[k]}</b></div>`).join("");
 const real=D.log.filter(l=>!l.dry).slice(0,8);
 const recent=real.length?`<div class="tscroll"><table class="tbl r17s-tbl"><thead><tr><th>When</th><th>Rule</th><th>Record</th><th>Result</th></tr></thead><tbody>${real.map(l=>`<tr><td data-label="When">${rel(l.ts)}</td><td data-label="Rule"><b>${H(l.name)}</b><div class="small muted">${H(l.rule)} · ${H(l.src||"")}</div></td><td data-label="Record">${H(l.rec||"")}</td><td data-label="Result">${outPill(l.outcome)} <span class="small muted">${H(String(l.detail).slice(0,90))}</span></td></tr>`).join("")}</tbody></table></div>`
  :`<p class="muted">No rule has fired in this session yet. Use "Try the live rules" below, or run the scheduled rules.</p>`;
 const errs=D.errors.slice(0,5);
 const fails=errs.length?`<ul class="r17s-ul">${errs.map(e=>`<li><b>${H(e.rule||"engine")}</b> ${rel(e.ts)}: ${H(e.msg)}</li>`).join("")}</ul>`:`<p class="muted">No failures recorded. The loop guard has stopped nothing.</p>`;
 const no=s.noOwner;
 const noo=no.length?`<ul class="r17s-ul">${no.map(r=>`<li><button type="button" class="r17s-lnk" data-r17s-open="${H(r.id)}">${H(r.body.name||r.id)}</button> <span class="small muted">${r.body.owner?"owner "+H(r.body.owner)+", no different backup":"no owner"}</span></li>`).join("")}</ul>`:`<p class="muted">Every rule has a named owner and a different named backup.</p>`;
 const un=s.untestedList;
 const live1=[
  ["RUL-0101","Incident form: set Urgency to Critical and Users affected to 100 or more. The Description becomes required and a banner appears.","incident"],
  ["RUL-0102","Incident form: choose a Category. The Assignment team drop-down narrows to the teams for that category.","incident"],
  ["RUL-0103","Incident form: log a P1 (role Executive, urgency Critical, many users). The Service owners group is notified.","incident"],
  ["RUL-0106","Same incident: the response due time is set from the priority SLA (see the Firing log).","incident"],
  ["RUL-0105","Change form: the Cost field is hidden unless the viewer holds the Finance approver role (switch persona to Finance to see it).","change"],
  ["RUL-0104","Change screen: open a change linked to a project with open tasks and choose Close. The save is blocked.","change"],
  ["RUL-0107","CMDB: open a configuration item and choose Retire. A confirmation appears first.","ci"],
  ["RUL-0109","Record page of a contract (for example CT-107): change the owner. Blocked when the vendor has no security review.","contract"]];
 return `<div class="r17s-stack">
  <div class="r17s-kpis">${kpi("Rules live",s.active,s.pending+" waiting for approval, "+s.draft+" drafts")}${kpi("Fired in the last day",s.firedDay,"session total "+s.firedAll)}${kpi("Failures this week",s.failWeek,s.failWeek?"see the Firing log":"none recorded",s.failWeek?"bad":"")}${kpi("Rules without owner and backup",no.length,no.length?"fix in the Editor":"all covered",no.length?"bad":"")}${kpi("Live rules never tested",un.length,un.length?"run a test before the next change":"all tested",un.length?"warn":"")}${kpi("Loop risks",s.cycles+s.tripped,s.tripped+" suspended, "+s.cycles+" possible rings",(s.cycles+s.tripped)?"warn":"")}</div>
  <div class="r17s-two"><section class="card glass r17s-c"><div class="cardhead"><div><h3>Rules by type</h3><span class="muted small">Counts of rules that are not retired. Color is the rule type.</span></div></div>${typeBars}${legend()}</section>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Rules by trigger</h3><span class="muted small">When each rule runs.</span></div></div>${trigBars}</section></div>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Recent firings</h3><span class="muted small">Live runs only. Tests are on the Firing log tab.</span></div><div class="row"><button type="button" class="btn" data-r17s-sched>Run scheduled rules now</button><button type="button" class="btn quiet" data-r17s-tab="4">Open the log</button></div></div>${recent}</section>
  <div class="r17s-two"><section class="card glass r17s-c"><div class="cardhead"><div><h3>Failures</h3><span class="muted small">Errors and loop-guard stops.</span></div></div>${fails}</section>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Rules with no owner or backup</h3><span class="muted small">Every rule needs a named person and a different named backup.</span></div></div>${noo}</section></div>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Try the live rules</h3><span class="muted small">These seeded rules run on real forms and records in this prototype.</span></div></div>
   <div class="r17s-try">${live1.map(x=>{const r=R.get(x[0]);return `<div class="r17s-tryrow"><div><b>${H(r?r.body.name:x[0])}</b><div class="small muted">${H(x[1])}</div></div><button type="button" class="btn" data-r17s-try="${H(x[2])}">Open ${H(x[2]==="ci"?"CMDB":x[2]==="contract"?"a contract":x[2]==="change"?"changes":"incidents")}</button></div>`}).join("")}</div></section>
 </div>`}
function outPill(o){return pill(o==="fired"?"Fired":o==="blocked"?"Blocked a save":o==="asked"?"Asked to confirm":o==="error"?"Failed":o==="loop"?"Loop guard":o,o==="fired"?"good":o==="blocked"||o==="error"||o==="loop"?"bad":"warn")}
UI.outPill=outPill;

/* ---------------- Rules table ---------------- */
function filtered(){const q=U.q.trim().toLowerCase();let a=D.rules.slice();
 if(U.ft)a=a.filter(r=>r.body.type===U.ft);if(U.fs)a=a.filter(r=>U.fs==="live"?r.status==="active":r.status===U.fs);if(U.tbl)a=a.filter(r=>r.body.entity===U.tbl);
 if(q)a=a.filter(r=>(r.id+" "+r.body.name+" "+r.body.desc+" "+r.body.owner+" "+r.body.backup+" "+r.body.entity).toLowerCase().indexOf(q)>=0);
 const k=U.sort;a.sort((x,y)=>k==="name"?x.body.name.localeCompare(y.body.name):k==="fired"?y.rt.fired-x.rt.fired:k==="last"?y.rt.last-x.rt.last:k==="table"?x.body.entity.localeCompare(y.body.entity)||x.body.order-y.body.order:(x.body.type.localeCompare(y.body.type))||(x.body.order-y.body.order));return a}
function rowsHTML(){const a=filtered();if(!a.length)return `<p class="muted">No rules match. Clear a filter or create a rule.</p>`;
 return `<div class="tscroll"><table class="tbl r17s-tbl"><thead><tr><th>Rule</th><th>Type</th><th>Table</th><th>Trigger</th><th class="n">Order</th><th>Active</th><th>Owner and backup</th><th>Last fired</th><th class="n">Fires</th></tr></thead><tbody>${a.map(r=>{const b=r.body;return `<tr><td data-label="Rule"><button type="button" class="r17s-lnk" data-r17s-open="${H(r.id)}"><b>${H(b.name||"(unnamed)")}</b></button><div class="small muted">${H(r.id)} · version ${r.ver}</div></td><td data-label="Type">${UI.typePill(b.type)}</td><td data-label="Table">${H(entLabel(b.entity))}</td><td data-label="Trigger">${H(R.trigLabel(b.type,b.trigger))}</td><td data-label="Order" class="n num">${b.type==="choice"?"-":b.order}</td><td data-label="Active">${stPill(r)}</td><td data-label="Owner and backup"><div class="r17s-ob">${person(b.owner)}${person(b.backup)}</div></td><td data-label="Last fired">${rel(r.rt.last)}</td><td data-label="Fires" class="n num">${r.rt.fired}</td></tr>`}).join("")}</tbody></table></div>`}
function tablePick(){const opts=[["","All tables"]].concat(R.entities().filter(e=>D.rules.some(r=>r.body.entity===e.id)).map(e=>[e.id,e.label,e.id,"Tables with rules"]));
 return typeof PICKER!=="undefined"?PICKER.html({id:"r17s_tblf",label:"Table",source:opts,value:U.tbl,none:"All tables",placeholder:"All tables",noun:"tables",group:true,onPick:v=>{U.tbl=v||"";paintRows()}}):""}
function rulesTab(){const chips=[["","All"]].concat(Object.keys(R.TYPES).map(t=>[t,R.TYPES[t].short]));
 return `<div class="r17s-stack"><section class="card glass r17s-c"><div class="cardhead"><div><h3>All rules</h3><span class="muted small">${D.rules.length} rules. Open one to edit it. Order decides which rule runs first on a table.</span></div><div class="row"><button type="button" class="btn primary" data-r17s-new="client">New rule</button></div></div>
  <div class="r17s-filters"><label class="r17s-fl"><span class="small muted">Search</span><input class="fin" type="search" data-r17s-q value="${H(U.q)}" placeholder="Name, owner, table"></label>
   <div class="r17s-fl"><span class="small muted">Table</span>${tablePick()}</div>
   <label class="r17s-fl"><span class="small muted">Status</span><select class="fin" data-r17s-fs>${[["","Any status"],["live","Live"],["pending","Waiting for approval"],["draft","Draft"],["retired","Retired"]].map(o=>`<option value="${o[0]}" ${U.fs===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></label>
   <label class="r17s-fl"><span class="small muted">Sort by</span><select class="fin" data-r17s-sort>${[["order","Type, then order"],["name","Name"],["table","Table, then order"],["fired","Most fired"],["last","Last fired"]].map(o=>`<option value="${o[0]}" ${U.sort===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></label></div>
  <div class="fchips r17s-tchips" role="group" aria-label="Filter by type">${chips.map(c=>`<button type="button" class="chip" aria-pressed="${U.ft===c[0]}" data-r17s-ft="${c[0]}">${H(c[1])}</button>`).join("")}</div>
  <div id="r17s-rows">${rowsHTML()}</div>${legend()}</section></div>`}
function paintRows(){const el=DOC.getElementById("r17s-rows");if(el)el.innerHTML=rowsHTML()}

/* ---------------- Firing log ---------------- */
function logRows(){const q=U.logq.trim().toLowerCase();let a=D.log.slice();if(!U.logd)a=a.filter(l=>!l.dry);if(U.logo)a=a.filter(l=>U.logo==="dry"?l.dry:l.outcome===U.logo);
 if(q)a=a.filter(l=>(l.name+" "+l.rule+" "+l.rec+" "+l.detail+" "+l.entity).toLowerCase().indexOf(q)>=0);return a.slice(0,150)}
function logBody(){const a=logRows();if(!a.length)return `<p class="muted">Nothing to show. Rules write here when they fire, block a save, fail or are stopped by the loop guard.</p>`;
 return `<div class="tscroll"><table class="tbl r17s-tbl"><thead><tr><th>When</th><th>Rule</th><th>Table and record</th><th>Result</th><th>What changed</th></tr></thead><tbody>${a.map(l=>`<tr><td data-label="When">${rel(l.ts)}</td><td data-label="Rule"><b>${H(l.name)}</b><div class="small muted">${H(l.rule)} v${l.ver} · ${H(R.trigLabel(l.type,l.trigger))}${l.dry?" · test run":""}</div></td><td data-label="Table and record">${H(entLabel(l.entity))}<div class="small muted">${H(l.rec||"")} ${l.src?"· "+H(l.src):""}</div></td><td data-label="Result">${outPill(l.outcome)}<div class="small muted">${H(String(l.detail).slice(0,160))}</div></td><td data-label="What changed">${arr(l.changes).map(c=>`<div class="small"><b>${H(c.label||c.f)}</b>: ${H(c.from==null||c.from===""?"(blank)":c.from)} to ${H(c.to)}</div>`).join("")||""}${arr(l.effects).map(x=>`<div class="small muted">${H(x)}</div>`).join("")}</td></tr>`).join("")}</tbody></table></div>`}
function logTab(){const dg=D.digest;
 return `<div class="r17s-stack"><section class="card glass r17s-c"><div class="cardhead"><div><h3>Firing log</h3><span class="muted small">Every time a rule fires, blocks a save, fails or is stopped by the loop guard. Kept for this session; blocked saves and failures are also written to the entity store.</span></div><div class="row"><button type="button" class="btn quiet" data-r17s-clearlog>Clear log</button></div></div>
  <div class="r17s-filters"><label class="r17s-fl"><span class="small muted">Search</span><input class="fin" type="search" data-r17s-lq value="${H(U.logq)}" placeholder="Rule, record, message"></label>
   <label class="r17s-fl"><span class="small muted">Result</span><select class="fin" data-r17s-lo>${[["","Any result"],["fired","Fired"],["blocked","Blocked a save"],["asked","Asked to confirm"],["error","Failed"],["loop","Loop guard"],["dry","Test runs"]].map(o=>`<option value="${o[0]}" ${U.logo===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></label>
   <label class="r17s-fl r17s-chk"><input type="checkbox" data-r17s-ld ${U.logd?"checked":""}> <span>Include test runs</span></label></div>
  <div id="r17s-logrows">${logBody()}</div></section>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Digest queue</h3><span class="muted small">Notices waiting for the daily digest, including those held during quiet hours (${H(D.cfg.quiet.from)} to ${H(D.cfg.quiet.to)}).</span></div><div class="row"><button type="button" class="btn" data-r17s-digest ${dg.length?"":"disabled"}>Send digest now</button></div></div>
   ${dg.length?`<ul class="r17s-ul">${dg.slice(0,12).map(d=>`<li><b>${H(d.title)}</b> <span class="small muted">to ${H(d.to)} · ${rel(d.ts)}${d.held?" · held for quiet hours":""}</span></li>`).join("")}</ul>`:`<p class="muted">The digest queue is empty.</p>`}</section></div>`}
function paintLog(){const el=DOC.getElementById("r17s-logrows");if(el)el.innerHTML=logBody()}

/* ---------------- Library ---------------- */
function matchTemplate(text){const w=String(text||"").toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);let best=null,bs=0;
 R.LIBRARY.forEach(t=>{const h=(t.title+" "+t.use+" "+t.body.name+" "+t.body.type+" "+t.body.entity).toLowerCase();let s=0;w.forEach(x=>{if(h.indexOf(x)>=0)s++});if(/notify|tell|alert|page/.test(text)&&t.body.type==="business")s+=1;if(/hide|show/.test(text)&&t.id==="T-HIDE")s+=2;if(/require|mandatory|must/.test(text)&&t.id==="T-REQ")s+=2;if(/confirm|sure/.test(text)&&t.id==="T-CONF")s+=2;if(/block|stop|cannot|prevent/.test(text)&&t.id==="T-BLOCK")s+=2;if(/drop.?down|narrow|depend/.test(text)&&t.id==="T-DEP")s+=2;if(/digest|quiet/.test(text)&&t.id==="T-DIGEST")s+=2;if(/button/.test(text)&&t.id==="T-UI")s+=2;if(/escalat|too long|waiting/.test(text)&&t.id==="T-ESC")s+=2;
  if(s>bs){bs=s;best=t}});return best}
function libTab(){const q=U.libq.trim().toLowerCase();const L=R.LIBRARY.filter(t=>!q||(t.title+" "+t.use+" "+t.body.type).toLowerCase().indexOf(q)>=0);
 const ai=`<section class="card glass r17s-c"><div class="cardhead"><div><h3>Draft from a sentence</h3><span class="muted small">On request only. It picks the closest template and fills in your words. It is a template matcher, not a language-model call. The draft is never activated by itself.</span></div></div>
  <div class="r17s-ai"><label class="r17s-fl"><span class="small muted">Describe the rule</span><input class="fin" type="text" data-r17s-ai value="${H(U.aiText)}" placeholder="For example: require a reason when an incident is Critical"></label><button type="button" class="btn" data-r17s-aidraft>Draft it</button></div>
  ${U.aiNote?`<div class="r17s-ainote">${typeof aiChip==="function"?aiChip({model:"Template matcher",conf:.6,title:"Draft suggestion",note:"Matched your words to the closest library template. It does not call a language model.",src:["Rule library"],guards:["Draft only","You review and test it","Activation needs the Platform governance board"]}):""}<span class="small">${U.aiNote}</span></div>`:""}</section>`;
 const fn=Object.keys(R.expr.FN_DOC).map(k=>`<li><code>${H(R.expr.FN_DOC[k])}</code></li>`).join("");
 return `<div class="r17s-stack">${ai}<section class="card glass r17s-c"><div class="cardhead"><div><h3>Templates</h3><span class="muted small">Start from a proven rule. Each opens in the Editor as a new draft with you as the maker.</span></div><label class="r17s-fl"><span class="small muted">Filter</span><input class="fin" type="search" data-r17s-lbq value="${H(U.libq)}" placeholder="block, notify, drop-down"></label></div>
  <div class="r17s-lib">${L.map(t=>`<article class="r17s-tpl glass"><div class="row">${UI.typePill(t.type)}<span class="small muted">${H(entLabel(t.body.entity))}</span></div><h4>${H(t.title)}</h4><p class="small">${H(t.use)}</p><p class="small muted"><b>When</b> ${H(R.trigLabel(t.type,t.body.trigger))}${R.condPlain(t.body.when,t.body.entity)?"; <b>if</b> "+H(R.condPlain(t.body.when,t.body.entity)):""}</p><ul class="r17s-ul small">${arr(t.body.then).map(a=>`<li>${H(R.actionSummary(a,t.body.entity))}</li>`).join("")}${t.body.type==="notify"?`<li>${H("Notifies "+R.groupMembers(t.body.deliver.ref).name+" "+(t.body.deliver.mode==="digest"?"in the digest":"at once"))}</li>`:""}</ul><button type="button" class="btn" data-r17s-tpl="${H(t.id)}">Use this template</button></article>`).join("")}</div></section>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>What a script step can use</h3><span class="muted small">A script is only an expression. No code runs: only these functions, the fields of the table, and the words and, or, not, in, contains.</span></div></div><ul class="r17s-ul r17s-fn">${fn}</ul>
   <p class="small muted">Example: <code>iff(priority &lt;= 2, addHours('', slaHours(priority)), '')</code>. Conditions built in the Editor compile to the same grammar as approval-rule conditions, for example <code>urgency == 1 &amp;&amp; users_affected &gt;= 100</code>.</p></section></div>`}

/* ---------------- Governance ---------------- */
function govTab(){const can=R.can("activate"),ck=R.can("kill"),cm=R.can("create");const k=D.kill;
 const sw=(id,label,on)=>`<label class="r17s-sw"><input type="checkbox" data-r17s-kill="${id}" ${on?"checked":""} ${ck.ok?"":"disabled"}><span><b>Switch off: ${H(label)}</b><small>${on?"Off now. Records save without these rules.":"Running"}</small></span></label>`;
 const pend=D.appr.filter(a=>a.state==="pending"),done=D.appr.filter(a=>a.state!=="pending").slice(0,6);
 const apprRow=a=>{const g=R.groupMembers(a.group);const r=R.get(a.rule);const cands=g.members.filter(m=>m!==a.by);
  return `<div class="r17s-appr"><div><b>${H(a.text)}</b><div class="small muted">${H(a.id)} · asked by ${H(a.by)} ${rel(a.at)} · to ${H(g.name)} (${g.members.length} people, ${H(G(()=>APG.quorumText(APG.get(a.group)),"any one member"))})</div>${a.decisions.length?`<div class="small">${a.decisions.map(d=>H(d.by)+" "+d.dec+"d").join("; ")}</div>`:""}</div>
   <div class="r17s-apprctl"><label class="small muted">Decide as a group member</label><select class="fin" data-r17s-apby="${H(a.id)}">${cands.map(m=>`<option>${H(m)}</option>`).join("")}</select><button type="button" class="btn primary" data-r17s-ap="approve:${H(a.id)}">Approve</button><button type="button" class="btn" data-r17s-ap="reject:${H(a.id)}">Reject</button>${r?`<button type="button" class="btn quiet" data-r17s-open="${H(r.id)}">Open rule</button>`:""}</div></div>`};
 const hs=U.govRule&&R.get(U.govRule)||D.rules[0];
 const hist=hs?`<div class="tscroll"><table class="tbl r17s-tbl"><thead><tr><th>Version</th><th>When and who</th><th>Note</th><th>Approved</th><th></th></tr></thead><tbody>${hs.hist.map(h=>`<tr><td data-label="Version" class="num">v${h.v}${h.v===hs.liveVer?" "+pill("live","good"):""}${h.v===hs.ver?" "+pill("current","info"):""}</td><td data-label="When and who">${rel(h.at)}<div class="small muted">${H(h.by)}</div></td><td data-label="Note">${H(h.note)}<div class="small muted">${H(diffNote(hs,h))}</div></td><td data-label="Approved">${h.approved?pill("Yes","good"):pill("No","mute")}</td><td data-label=""><button type="button" class="btn sm" data-r17s-rb="${H(hs.id)}:${h.v}" ${R.can("edit").ok?"":"disabled"}>Roll back to this</button></td></tr>`).join("")}</tbody></table></div>`:"";
 const cyc=R.cycles();const trip=D.rules.filter(r=>r.rt.tripped);
 const aud=G(()=>AUDIT.filter(a=>/^Rule|^Rules/.test(String(a.a))).slice(0,8),[]);
 const permT=[["Create and edit drafts",R.roleSets.create],["Request activation",R.roleSets.activate],["Use the kill switch",R.roleSets.kill]];
 return `<div class="r17s-stack">
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Kill switch</h3><span class="muted small">Turns rules off without deleting them. Needs ${H(R.roleSets.kill.join(", "))}. Every switch is audited and announced.</span></div></div>
   <div class="r17s-sws">${sw("all","All rules",k.all)}${Object.keys(R.TYPES).map(t=>sw(t,R.TYPES[t].label+"s",k.types[t])).join("")}</div>
   <label class="r17s-fl"><span class="small muted">Reason (kept with the audit entry)</span><input class="fin" type="text" data-r17s-kreason value="${H(k.reason||"")}" placeholder="Why are rules being switched?"></label>${ck.ok?"":`<p class="small muted">Your current role cannot use the kill switch.</p>`}</section>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Activation approvals</h3><span class="muted small">A change goes live only after the ${H(G(()=>APG.get(R.govGroup()).name,"Platform governance board"))} approves it. The person who asked cannot decide.</span></div></div>
   ${pend.length?pend.map(apprRow).join(""):`<p class="muted">Nothing is waiting. Request activation from the Editor after a test.</p>`}
   ${done.length?`<h4 class="r17s-h4">Recently decided</h4><ul class="r17s-ul">${done.map(a=>`<li>${pill(a.state==="approved"?"Approved":"Rejected",a.state==="approved"?"good":"bad")} ${H(a.text)} <span class="small muted">${a.decisions.map(d=>H(d.by)).join(", ")}</span></li>`).join("")}</ul>`:""}</section>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Version history and rollback</h3><span class="muted small">Every save is a version. Rolling back to an approved version is live at once; any other version returns as a draft that needs approval.</span></div>
   <label class="r17s-fl"><span class="small muted">Rule</span><select class="fin" data-r17s-hsel>${D.rules.map(r=>`<option value="${H(r.id)}" ${hs&&hs.id===r.id?"selected":""}>${H(r.id+" "+r.body.name)}</option>`).join("")}</select></label></div>${hist}</section>
  <div class="r17s-two"><section class="card glass r17s-c"><div class="cardhead"><div><h3>Loop guard</h3><span class="muted small">Maximum depth 4. A rule may not run again on the same record while it is already running. More than 40 fires in 5 seconds suspends a rule.</span></div></div>
   ${trip.length?trip.map(r=>`<p>${pill("Suspended","bad")} <b>${H(r.body.name)}</b> <button type="button" class="btn sm" data-r17s-reset="${H(r.id)}">Reset</button></p>`).join(""):`<p class="muted">No rule is suspended.</p>`}
   <h4 class="r17s-h4">Static cycle check</h4>${cyc.length?`<ul class="r17s-ul">${cyc.map(c=>`<li>${H(c.text)}</li>`).join("")}</ul>`:`<p class="muted">No rule can trigger another in a ring. Checked: events raised, fields written and tables saved against what other rules listen to.</p>`}
   <h4 class="r17s-h4">Error log</h4>${D.errors.length?`<ul class="r17s-ul">${D.errors.slice(0,6).map(e=>`<li><b>${H(e.rule||"engine")}</b> ${rel(e.ts)}: ${H(e.msg)}</li>`).join("")}</ul>`:`<p class="muted">Empty.</p>`}</section>
  <section class="card glass r17s-c"><div class="cardhead"><div><h3>Who can do what</h3><span class="muted small">Role sets are enforced here and mirrored in the Permissions model (PERM). You hold: ${H(R.viewer().roles.join(", ")||"no roles")}.</span></div><button type="button" class="btn quiet" data-go="r16g_perm">Open Permissions</button></div>
   <ul class="r17s-ul">${permT.map(p=>`<li>${pill(p[1].some(r=>R.viewer().roles.indexOf(r)>=0)?"You can":"You cannot",p[1].some(r=>R.viewer().roles.indexOf(r)>=0)?"good":"mute")} <b>${H(p[0])}</b> <span class="small muted">${H(p[1].join(", "))}</span></li>`).join("")}</ul>
   <h4 class="r17s-h4">Recent audit entries</h4>${aud.length?`<ul class="r17s-ul">${aud.map(a=>`<li><b>${H(a.a)}</b> <span class="small muted">${H(a.d||"")}</span></li>`).join("")}</ul>`:`<p class="muted">No rule changes yet this session.</p>`}</section></div>
 </div>`}
function diffNote(r,h){const i=r.hist.indexOf(h);const prev=r.hist[i+1];if(!prev)return "First version";const a=prev.body,b=h.body;const o=[];
 if(a.name!==b.name)o.push("name");if(a.trigger!==b.trigger)o.push("trigger");if(R.condPlain(a.when,a.entity)!==R.condPlain(b.when,b.entity))o.push("condition");if(JSON.stringify(a.then)!==JSON.stringify(b.then))o.push("actions");if(JSON.stringify(a.else)!==JSON.stringify(b.else))o.push("else actions");if(a.owner!==b.owner||a.backup!==b.backup)o.push("owner or backup");if(JSON.stringify(a.scope)!==JSON.stringify(b.scope))o.push("scope");if(a.script!==b.script)o.push("script");if(JSON.stringify(a.choice)!==JSON.stringify(b.choice))o.push("choices");if(JSON.stringify(a.deliver)!==JSON.stringify(b.deliver))o.push("notification");
 return o.length?"Changed: "+o.join(", "):"No content change"}

/* ---------------- screen ---------------- */
function screen(){const s=R.stats();
 return `<div class="screen r17s-screen">${hero("Platform and administration · Build and connect","Rules and scripts",`<b data-role="metric">${s.active}</b> rules are live across <b data-role="metric">${Object.keys(s.byTrigger).length}</b> triggers. Client rules run in the form while a person edits, business rules run when the record is saved, notification rules decide who is told and when. Nothing goes live without a test and a group approval. ${s.noOwner.length?`<b data-role="metric">${s.noOwner.length}</b> rules need an owner and backup.`:"Every rule has an owner and a different backup."}`,`<div class="row r17s-heroact">${typeof fchip==="function"?fchip("m_rules_owned")+fchip("m_rules_fired"):""}<button class="btn primary" data-r17s-new="client">New rule</button></div>`)}${typeof lensNote==="function"?lensNote():""}${kill()}
  ${views("r17sv",["Overview","Rules","Editor","Test","Firing log","Library","Governance"],[overview(),rulesTab(),UI.editor?UI.editor():"",UI.test?UI.test():"",logTab(),libTab(),govTab()])}
  ${typeof procCard==="function"?procCard("r17s_rules"):""}</div>`}
REG("r17s_rules","Rules and scripts","platform","M4 6h10M4 12h6M4 18h10M17 4l3 3-3 3M14 14l3-3 3 3M17 11v9",screen);
UI.rerender=()=>{if(S.screen==="r17s_rules")render()};
UI.openRule=(id,tab)=>{U.sel=id;UI.loadDraft&&UI.loadDraft(id);S.v.r17sv=tab==null?2:tab;go("r17s_rules")};

/* ---------------- events ---------------- */
const tryOpen={incident:()=>find("itsm_inc",/log (an )?incident|new incident/i),change:()=>find("itsm_chg",/request a change|new change/i),ci:()=>{go("itom_cmdb")},contract:()=>{G(()=>RECSHELL.openAny("CT-107"))||go("bud_con")}};
function find(screenId,rx){go(screenId);setTimeout(()=>{const b=[...DOC.querySelectorAll("#view button")].find(x=>rx.test(x.textContent));if(b)b.click();else toast("Open the "+screenId+" screen and use its create button","info")},350)}
DOC.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r17s-tab],[data-r17s-open],[data-r17s-new],[data-r17s-tpl],[data-r17s-try],[data-r17s-sched],[data-r17s-ft],[data-r17s-clearlog],[data-r17s-digest],[data-r17s-ap],[data-r17s-rb],[data-r17s-reset],[data-r17s-aidraft]");if(!t)return;const d=t.dataset;
 if(d.r17sTab!=null){S.v.r17sv=+d.r17sTab;render();return}
 if(d.r17sOpen){UI.openRule(d.r17sOpen,2);return}
 if(d.r17sNew){const c=R.can("create");if(!c.ok){toast("Your role cannot create rules. It needs one of: "+c.need.join(", "),"warn");return}UI.newRule&&UI.newRule(d.r17sNew);return}
 if(d.r17sTpl){const c=R.can("create");if(!c.ok){toast("Your role cannot create rules","warn");return}const tp=R.LIBRARY.find(x=>x.id===d.r17sTpl);if(tp)UI.newRule&&UI.newRule(tp.body.type,tp.body);return}
 if(d.r17sTry){const f=tryOpen[d.r17sTry];f&&f();return}
 if(d.r17sSched!=null){const o=R.runSchedule();toast("Scheduled rules ran: "+o.records+" records checked, "+o.fired+" firings, "+o.notified+" notices sent","good");render();return}
 if(d.r17sFt!=null){U.ft=d.r17sFt;render();return}
 if(d.r17sClearlog!=null){R.clearLog();render();return}
 if(d.r17sDigest!=null){const n=D.digest.length;if(n){G(()=>R17N.notify({kind:"info",title:"Daily digest: "+n+" notices",body:D.digest.slice(0,3).map(x=>x.title).join("; ")+(n>3?" and "+(n-3)+" more":""),key:"r17s|digest|"+Date.now()}));D.digest.length=0;R.persist();render()}return}
 if(d.r17sAp){const [dec,id]=d.r17sAp.split(":");const sel=DOC.querySelector('[data-r17s-apby="'+id+'"]');const by=sel&&sel.value;const c=R.decide(id,by,dec,"");if(!c.ok)toast(c.why,"warn");else toast(dec==="approve"?(c.state==="approved"?"Approved. The rule is live.":"Approval recorded; more members needed ("+c.yes+" of "+c.need+")"):"Rejected","good");render();return}
 if(d.r17sRb){const [id,v]=d.r17sRb.split(":");const c=R.rollback(id,+v);toast(c.msg||c.why,c.ok?"good":"warn");UI.loadDraft&&UI.loadDraft(id);render();return}
 if(d.r17sReset){R.resetTrip(d.r17sReset);render();return}
 if(d.r17sAidraft!=null){const tp=matchTemplate(U.aiText);if(!tp){U.aiNote="No close template found. Try words like require, block, notify, confirm, hide or drop-down.";render();return}
  const c=R.can("create");if(!c.ok){toast("Your role cannot create rules","warn");return}const b=JSON.parse(JSON.stringify(tp.body));if(U.aiText.trim())b.desc="Drafted from: "+U.aiText.trim();U.aiNote="Closest template: <b>"+H(tp.title)+"</b>. It opened in the Editor as a draft. Review the condition, run a test and send it for approval.";UI.newRule&&UI.newRule(tp.body.type,b);return}});
DOC.addEventListener("input",e=>{const t=e.target;if(t.matches&&t.matches("[data-r17s-q]")){U.q=t.value;paintRows();return}
 if(t.matches&&t.matches("[data-r17s-lq]")){U.logq=t.value;paintLog();return}
 if(t.matches&&t.matches("[data-r17s-lbq]")){U.libq=t.value;clearTimeout(U._lt);U._lt=setTimeout(()=>{render();const i=DOC.querySelector("[data-r17s-lbq]");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250);return}
 if(t.matches&&t.matches("[data-r17s-ai]")){U.aiText=t.value;return}
 if(t.matches&&t.matches("[data-r17s-kreason]")){D.kill.reason=t.value}});
DOC.addEventListener("change",e=>{const t=e.target;if(!t.matches)return;
 if(t.matches("[data-r17s-fs]")){U.fs=t.value;paintRows();return}if(t.matches("[data-r17s-sort]")){U.sort=t.value;paintRows();return}
 if(t.matches("[data-r17s-lo]")){U.logo=t.value;paintLog();return}if(t.matches("[data-r17s-ld]")){U.logd=t.checked;paintLog();return}
 if(t.matches("[data-r17s-hsel]")){U.govRule=t.value;render();return}
 if(t.matches("[data-r17s-kill]")){const c=R.kill.set(t.dataset.r17sKill,t.checked,D.kill.reason);if(!c.ok){toast(c.why,"warn");t.checked=!t.checked;return}render()}});
UI.paintRows=paintRows;
})();
