/* ---- runs and quarantine ---- */
const RSTP=s=>pill(s,s==="ok"?"good":s==="partial"?"warn":"bad");
const QSTP={open:["Open","warn"],replayed:["Replayed","good"],dead:["Dead letter","bad"]};
function paneRuns(){
 const r24=F.runs.filter(r=>r.min<=1440),ok=r24.filter(r=>r.status==="ok").length,dead=F.quar.filter(q=>q.status==="dead").length;
 const kp=kpiRow([["Runs in 24 hours",r24.length,Math.round(100*ok/Math.max(1,r24.length))+"% finished clean"],["Records loaded",r24.reduce((a,r)=>a+r.loaded,0).toLocaleString(),"after validation and merge"],["In quarantine",qOpen().length,"waiting for a fix",{metric:"m_fab_quar",keep:true}],["Dead letter",dead,"three failed replays",{cls:dead?"bad":"",keep:true}],["Failed runs",r24.filter(r=>r.status==="failed").length,"retried with backoff",{keep:true}]]);
 const stages=[["Extract","--p4","Pull from the source or receive the event"],["Validate","--good-f","Check each record against the registry contract"],["Transform","--accent","Map and convert types"],["Match and merge","--warn-f","Find the record, apply authority and conflict rules"],["Load","--good-f","Write with an idempotency key"],["Publish event","--accent","Send a canonical change event"]];
 const pipe=card("The pipeline every run follows","Failed validation goes to quarantine, never into the registry",`<div class="fab-flow fab-flow6">${stages.map((s,i)=>`<div class="fab-fs"><i style="background:var(${s[1]})"></i><b>${i+1}. ${s[0]}</b><span>${s[2]}</span></div>`).join("")}</div>${legend(stages.map(s=>[s[0],s[1]]))}<p class="muted small">Retries use exponential backoff. Backfill replays a date range. A record that fails three replays moves to the dead letter queue for a steward. Replays are idempotent: the same key loads a record once.</p>`);
 const rt=btHTML({id:"fab_runs",cols:[
  {k:"id",label:"Run",fmt:r=>`<b>${r.id}</b><div class="muted small">${E(r.kind)}</div>`,val:r=>r.id},
  {k:"cn",label:"Connector",fmt:r=>E((conn(r.conn)||{name:r.conn}).name),val:r=>(conn(r.conn)||{name:r.conn}).name,wrap:true,w:200},
  {k:"mode",label:"Path",fmt:r=>pill(r.mode,r.mode==="Real-time"?"info":"mute"),val:r=>r.mode},
  {k:"at",label:"Started",fmt:r=>E(r.at),val:r=>-r.min},
  {k:"dur",label:"Seconds",fmt:r=>r.dur,val:r=>r.dur},
  {k:"read",label:"Read",fmt:r=>r.read.toLocaleString(),val:r=>r.read},
  {k:"quar",label:"Quarantined",fmt:r=>r.quar?pill(String(r.quar),"warn"):"0",val:r=>r.quar},
  {k:"loaded",label:"Loaded",fmt:r=>r.loaded.toLocaleString(),val:r=>r.loaded},
  {k:"held",label:"Held",fmt:r=>r.held,val:r=>r.held},
  {k:"status",label:"Status",fmt:r=>RSTP(r.status),val:r=>r.status},
  {k:"env",label:"Environment",fmt:r=>E(r.env),val:r=>r.env},
  {k:"err",label:"Error",fmt:r=>E(r.err||""),val:r=>r.err,wrap:true,w:220}
 ],rows:()=>F.runs,key:"id",h:440,rowH:48,facets:["cn","status","mode","env"],exportName:"fabric-runs",open:i=>runDrawer(i)});
 const qt=btHTML({id:"fab_quar",cols:[
  {k:"id",label:"Item",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},
  {k:"cn",label:"Connector",fmt:r=>E(conn(r.conn).name),val:r=>conn(r.conn).name,wrap:true,w:180},
  {k:"rec",label:"Record",fmt:r=>`<b>${E(r.rec)}</b><div class="muted small">${E(ENTLBL(r.ent))}, ${E(flabel(r.ent,r.k))}</div>`,val:r=>r.rec,wrap:true,w:200},
  {k:"val",label:"Value received",fmt:r=>r.val===""?`<span class="muted">Empty</span>`:`<code>${E(r.val)}</code>`,val:r=>r.val},
  {k:"reason",label:"Why it failed",fmt:r=>E(r.reason),val:r=>r.reason,wrap:true,w:260},
  {k:"at",label:"Since",fmt:r=>E(r.at),val:r=>r.at},
  {k:"att",label:"Replays",fmt:r=>r.attempts+" of 3",val:r=>r.attempts},
  {k:"status",label:"Status",fmt:r=>pill(QSTP[r.status][0],QSTP[r.status][1]),val:r=>QSTP[r.status][0]}
 ],rows:()=>F.quar,key:"id",h:380,rowH:56,facets:["status","cn"],exportName:"fabric-quarantine",open:i=>quarDrawer(i)});
 return `${prevBanner()}${kp}<div style="margin-top:14px">${pipe}</div><div style="margin-top:14px">${card("Quarantine queue","Open an item to fix the value and replay it. Replays validate again before anything loads.",qt)}</div><div style="margin-top:14px">${card("Run history","Every run is audited; open one to see its lineage, retry or replay it",rt)}</div>`}
function quarDrawer(id){
 const q=F.quar.find(x=>x.id===id);if(!q)return;const c=conn(q.conn),m=eff(q.ent,q.k);
 openDrawer(`<div class="eyebrow">Quarantine item</div><h2 style="margin:4px 0">${E(q.rec)}: ${E(flabel(q.ent,q.k))}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(QSTP[q.status][0],QSTP[q.status][1])} ${pill(m.auth,AUTHP[m.auth])} ${pill(q.attempts+" of 3 replays","mute")}</div>
 <div class="story"><b>${E(q.reason)}.</b> ${E(c.name)} sent <code>${q.val===""?"(empty)":E(q.val)}</code> in run ${E(q.run)}. The registry rule is: ${E(m.rule)}. Nothing was written to ${E(ENTLBL(q.ent))}.</div>
 <dl class="kv"><dt>Entity</dt><dd>${E(ENTLBL(q.ent))}</dd><dt>Since</dt><dd>${E(q.at)}</dd><dt>Owner of the fix</dt><dd>${own_(c.owner)}</dd><dt>Idempotency</dt><dd>Replaying the same record loads it once.</dd></dl>
 <div class="row" style="gap:8px;flex-wrap:wrap">${q.status==="open"?`<button class="btn primary" data-fab-fix="${q.id}">Fix and replay</button>`:q.status==="dead"?`<button class="btn primary" data-fab-requeue="${q.id}">Requeue for replay</button>`:""}<button class="btn quiet" data-fab-conn="${q.conn}">Open connector</button></div>`)}
function fixForm(id){
 const q=F.quar.find(x=>x.id===id);if(!q)return;if(isCore()){unlockDrawer("Fix and replay needs the Fabric edition.");return}
 const t=ftype(q.ent,q.k);
 openForm({id:"fab_fix",title:"Fix and replay "+q.rec,story:"Correct the value, and the Fabric validates it against the registry contract again. If it passes, the record loads once, a change event is published and the item closes. Three failed replays move it to the dead letter queue.",submit:"Replay",
  fields:[{section:"Corrected value"},{k:"val",label:flabel(q.ent,q.k),type:"text",req:true,ph:t==="date"||t==="datetime"?"2026-11-20":t==="percent"?"0 to 100":"Corrected value",help:"Field type: "+t+". Rule: "+eff(q.ent,q.k).rule+"."},{k:"note",label:"Note for the audit log",type:"text",ph:"Confirmed with the project manager"}],
  defaults:{val:q.val},
  live:v=>{const r=coerce(q.ent,q.k,v.val,null),pr=r.ok&&q.ctx?pairRule(q.ent,Object.assign({},q.ctx,{[q.k]:r.val})):null;return `<div class="story"><b>Validation now:</b> ${r.ok&&!pr?"passes. It would load and publish "+E(q.ent+"."+q.k+".changed")+".":E(pr?pr.why:r.why)}</div>`},
  onSubmit:v=>{const r=coerce(q.ent,q.k,v.val,null),pr=r.ok&&q.ctx?pairRule(q.ent,Object.assign({},q.ctx,{[q.k]:r.val})):null;
   if(!r.ok||pr){q.attempts++;if(q.attempts>=3){q.status="dead";toast("Still failing. Moved to the dead letter queue.","bad");audit("Fabric item dead-lettered",q.id+": "+q.rec);closeDrawer()}else{toast("Still fails: "+(pr?pr.why:r.why),"warn");audit("Fabric replay failed",q.id+" attempt "+q.attempts)}render();return}
   q.status="replayed";q.val=String(r.val);F.usage++;const c=conn(q.conn);
   const run=newRun(c,{mode:"Batch",read:1,valid:1,loaded:1,events:1,kind:"replay",idem:"idem-"+hs(q.id)*7919});
   F.events.unshift(mkEvent(q.ent,q.k,q.rec,"(quarantined)",String(r.val),q.conn,0));audit("Fabric quarantine replayed",q.id+" "+q.rec+" loaded as "+r.val+(v.note?" ("+v.note+")":""));toast("Replayed and loaded: "+q.rec,"good");closeDrawer();render()}})}
/* ---- reconciliation ---- */
const RECP={open:["Open","warn"],wi:["Work item open","info"],resolved:["Resolved","good"]};
const steward=en=>({project_task:"Priya Shah",user_story:"Sam Patel",person:"Rina Okafor",invoice:"Avery Chen"})[en]||"Maya Ortiz";
function paneRecon(){
 const open=rOpen(),sh=authRows().filter(r=>r.auth==="shared").length,age=open.length?Math.max(...open.map(r=>r.min)):0;
 const kp=kpiRow([["Open differences",open.length,"between Oukala and the source",{metric:"m_fab_recon",keep:true}],["Work items open",F.wi.filter(w=>w.st==="open").length,"assigned to stewards",{keep:true}],["Resolved this week",F.recon.filter(r=>r.status==="resolved").length,"decided and audited"],["Oldest open",age>=1440?Math.floor(age/1440)+" days":Math.round(age/60)+" hours","since detection",{keep:true}],["Shared fields",sh,"where both sides may edit"]]);
 const tbl=btHTML({id:"fab_recon",cols:[
  {k:"id",label:"Difference",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},
  {k:"rec",label:"Record",fmt:r=>`<b>${E(r.rec)}</b><div class="muted small">${E(r.label)}</div>`,val:r=>r.rec,wrap:true,w:210},
  {k:"k",label:"Field",fmt:r=>`${E(flabel(r.ent,r.k))}<div class="muted small">${E(ENTLBL(r.ent))}</div>`,val:r=>r.k,wrap:true},
  {k:"plat",label:"Oukala says",fmt:r=>`<code>${E(r.plat)}</code>`,val:r=>r.plat},
  {k:"ext",label:"Source says",fmt:r=>`<code>${E(r.ext)}</code>`,val:r=>r.ext},
  {k:"cn",label:"Source",fmt:r=>E(conn(r.conn).name),val:r=>conn(r.conn).name,wrap:true},
  {k:"at",label:"Detected",fmt:r=>E(r.at),val:r=>-r.min},
  {k:"status",label:"Status",fmt:r=>pill(RECP[r.status][0],RECP[r.status][1])+(r.wi?` <span class="muted small">${r.wi}</span>`:""),val:r=>RECP[r.status][0]}
 ],rows:()=>F.recon,key:"id",h:440,rowH:56,facets:["status","cn"],exportName:"fabric-reconciliation",open:i=>reconDrawer(i)});
 const wi=F.wi.length?card("Work items from the Fabric","Reconciliation and decommission tasks, assigned to a person",`<div class="fab-hl">${F.wi.map(w=>`<div class="fab-hr fab-wi"><span class="fab-hn"><b>${E(w.id)}</b> ${E(w.t)}<br><span class="muted small">${E(w.sub)}</span></span>${pill(w.st==="open"?"Open":"Done",w.st==="open"?"warn":"good")}<span class="small">${own_(w.who)} · due ${E(w.due)}</span></div>`).join("")}</div>`):"";
 return `${prevBanner()}${kp}<div style="margin-top:14px">${card("Differences on shared fields","When both sides may edit a field, the newest value wins unless Oukala has an unsynced edit. Then the difference lands here instead of being overwritten.",`${tbl}`)}</div>${wi?`<div style="margin-top:14px">${wi}</div>`:""}`}
function reconDrawer(id){
 const r=F.recon.find(x=>x.id===id);if(!r)return;const m=eff(r.ent,r.k),c=conn(r.conn);
 openDrawer(`<div class="eyebrow">Reconciliation ${E(r.id)}</div><h2 style="margin:4px 0">${E(r.rec)}: ${E(flabel(r.ent,r.k))}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(RECP[r.status][0],RECP[r.status][1])} ${pill(m.auth,AUTHP[m.auth])}</div>
 <div class="story">${E(r.label)} has two values. Oukala was edited after the last sync, so the Fabric kept it and opened this difference instead of overwriting. Rule: ${E(m.conflict)}.</div>
 <div class="grid g2 fab-g"><div class="mini glass fab-cmp"><span class="eyebrow">Oukala</span><b class="num">${E(r.plat)}</b><span class="small muted">Edited in the platform</span></div><div class="mini glass fab-cmp"><span class="eyebrow">${E(c.name)}</span><b class="num">${E(r.ext)}</b><span class="small muted">Detected ${E(r.at)}</span></div></div>
 <dl class="kv"><dt>Trust in the source</dt><dd>${Math.round(m.trust*100)}%</dd><dt>Field steward</dt><dd>${own_(steward(r.ent))}</dd><dt>Subscribers affected</dt><dd>${subsFor(r.ent).map(s=>E(s.n)).join(", ")}</dd>${r.wi?`<dt>Work item</dt><dd>${E(r.wi)}</dd>`:""}${r.how?`<dt>Decision</dt><dd>${E(r.how)}</dd>`:""}</dl>
 ${r.status==="resolved"?"":`<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-fab-wi="${r.id}">Open a work item</button><button class="btn" data-fab-res="${r.id}:plat">Keep the Oukala value</button><button class="btn" data-fab-res="${r.id}:ext">Take the source value</button></div>`}`)}
function wiForm(id){
 const r=F.recon.find(x=>x.id===id);if(!r)return;if(isCore()){unlockDrawer("Opening reconciliation work items needs the Fabric edition.");return}
 openForm({id:"fab_wi",title:"Open a work item for "+r.rec,story:"Creates a task for the field steward with both values and the source attached. It appears in their Person 360 work list. The difference stays open until someone decides.",submit:"Open work item",
  fields:[{k:"who",label:"Assign to",type:"people",req:true},{k:"due",label:"Due",type:"date"},{k:"note",label:"What to decide",type:"longtext",ph:"Which date is right?"}],defaults:{who:steward(r.ent)},
  onSubmit:v=>{const w={id:"WI-"+(F.seq.wi++),t:"Reconcile "+r.label+": "+flabel(r.ent,r.k),sub:r.id+" on "+r.ent+": Oukala "+r.plat+" versus source "+r.ext,who:v.who||steward(r.ent),due:v.due||dayS(5).slice(0,6),st:"open",ref:r.id};F.wi.unshift(w);r.status="wi";r.wi=w.id;audit("Fabric work item opened",w.id+" for "+r.id);toast(w.id+" opened for "+w.who,"good");closeDrawer();render()}})}
function resolveRecon(id,side){const r=F.recon.find(x=>x.id===id);if(!r)return;r.status="resolved";r.how=side==="plat"?"Kept the Oukala value":"Took the source value";
 const w=F.wi.find(x=>x.ref===id);if(w)w.st="done";if(side==="ext")F.events.unshift(mkEvent(r.ent,r.k,r.rec,r.plat,r.ext,r.conn,0));audit("Fabric difference resolved",r.id+": "+r.how);toast(r.how,"good");closeDrawer();render()}
/* ---- M2M ---- */
const STAGES=[["proposed","Proposed","Waiting for the platform team"],["evaluating","Evaluating","Five checks running"],["awaiting","Awaiting decision","Routed by risk and sensitivity"],["certified","Approved: certified","Ongoing connector"],["project","Approved: project-scoped","Temporary, with expiry"],["rejected","Rejected","Reasons recorded"]];
const CKP=s=>s==="pass"?["Pass","good"]:s==="warn"?["Review","warn"]:["Fail","bad"];
function paneM2M(){
 const P=F.proj,n=s=>P.filter(p=>p.stage===s).length;
 const kp=kpiRow([["Projects",P.length,"proposed by anyone"],["In evaluation",n("proposed")+n("evaluating"),"before routing"],["Awaiting a decision",n("awaiting"),"auto, platform or council",{cls:n("awaiting")?"warn":"",keep:true}],["Approved",n("certified")+n("project"),n("project")+" project-scoped"],["Evaluation cycle",cycle()+" days","proposal to decision",{metric:"m_fab_m2m"}]]);
 const rules=card("Approval routing","Chosen by configuration, risk and data sensitivity, never by who asks",`<div class="grid g3 fab-g">${ROUTES.map(r=>`<div class="mini glass fab-rt"><i style="background:var(${r[3]})"></i><b>${r[1]}</b><span class="small muted">${E(r[2])}</span></div>`).join("")}</div>`);
 const board=`<div class="fab-board" role="group" aria-label="Machine-to-machine project stages">${STAGES.map(s=>`<div class="fab-col"><div class="fab-ch"><b>${s[1]}</b><span class="pill mute">${n(s[0])}</span></div><span class="muted small">${s[2]}</span><div class="fab-cl" data-dnd="${s[0]}" data-dnd-scope="fab_m2m">${P.filter(p=>p.stage===s[0]).map(p=>`<div class="fab-card" data-dnd-id="${p.id}" tabindex="0"><span class="grip" aria-hidden="true"></span><button class="fab-cb" data-fab-pj="${p.id}"><b>${E(p.id)}</b><span>${E(p.t)}</span></button><span class="row" style="gap:4px;flex-wrap:wrap">${pill(p.risk+" risk",p.risk==="High"?"bad":p.risk==="Medium"?"warn":"mute")}${p.route?routePill(p.route):""}</span></div>`).join("")}</div></div>`).join("")}</div>`;
 const rq=btHTML({id:"fab_req",cols:[
  {k:"id",label:"Request",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},{k:"kind",label:"Kind",fmt:r=>E(r.kind),val:r=>r.kind},
  {k:"t",label:"What",fmt:r=>`<b>${E(r.ref)}</b><div class="muted small">${E(r.t)}</div>`,val:r=>r.t,wrap:true,w:300},
  {k:"route",label:"Route taken",fmt:r=>routePill(r.route),val:r=>r.route.n},
  {k:"why",label:"Why this route",fmt:r=>E(r.route.why),val:r=>r.route.why,wrap:true,w:300},
  {k:"sla",label:"Decision time",fmt:r=>E(r.route.sla),val:r=>r.route.sla},
  {k:"state",label:"State",fmt:r=>pill(r.state,r.state==="Decided"?"good":"warn"),val:r=>r.state}
 ],rows:()=>F.reqs,key:"id",h:320,rowH:56,facets:["kind","state"],exportName:"fabric-approval-requests",open:i=>{const r=F.reqs.find(x=>x.id===i);if(r&&r.kind==="M2M project")projDrawer(r.ref);else connDrawer(r.ref)}});
 return `${prevBanner()}${kp}<div style="margin-top:14px">${rules}</div><div style="margin-top:14px">${card("Machine-to-machine projects","Anyone proposes; the platform evaluates; a route decides. Drag a card to the next step, or open it.",`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn primary" data-fab-newm2m>Propose a project</button><span class="muted small">Moves: Proposed to Evaluating starts the five checks. Evaluating to Awaiting routes it. Decisions open a form.</span></div>${board}`)}</div><div style="margin-top:14px">${card("Approval requests and the route each took","Every request, whether a new project or a connector promotion",rq)}</div>`}
function projDrawer(id){
 const p=F.proj.find(x=>x.id===id);if(!p)return;const ev=p.eval,rt=p.route;
 const chk=ev?`<div class="fab-chk">${ev.checks.map(c=>{const s=CKP(c.st);return `<div class="fab-ck ${c.st}"><span class="pill ${s[1]}">${s[0]}</span><div><b>${E(c.n)}</b><div class="small muted">${E(c.d)}</div></div></div>`}).join("")}</div>`:`<p class="muted small">Evaluation has not started. Moving the project to Evaluating runs five checks: contract fit, security review, sandbox sample test, cost estimate and duplicate check.</p>`;
 const st=STAGES.find(s=>s[0]===p.stage);
 openDrawer(`<div class="eyebrow">Machine-to-machine project</div><h2 style="margin:4px 0">${E(p.id)}: ${E(p.t)}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(st[1],p.stage==="rejected"?"bad":p.stage==="awaiting"?"warn":p.stage==="certified"||p.stage==="project"?"good":"mute")} ${pill(p.risk+" risk",p.risk==="High"?"bad":p.risk==="Medium"?"warn":"mute")} ${rt?routePill(rt):""} ${p.len==="temporary"?pill("Temporary","info"):pill("Ongoing","mute")}</div>
 <div class="story">${E(p.purpose)}</div>
 <dl class="kv"><dt>Proposed by</dt><dd>${own_(p.by)} ${p.created?`<span class="muted small">${p.created} days ago</span>`:""}</dd><dt>Owner</dt><dd>${own_(p.owner)}</dd><dt>Systems</dt><dd>${p.systems.map(E).join(", ")}</dd><dt>Connector type</dt><dd>${E(p.ctype)}</dd><dt>Entities</dt><dd>${p.ents.map(e=>E(ENTLBL(e))).join(", ")}</dd><dt>Fields</dt><dd>${E(p.fields)}</dd><dt>Direction and volume</dt><dd>${p.dir==="In"?"Into Oukala":p.dir==="Out"?"Out of Oukala":"Both ways"}, about ${p.vol.toLocaleString()} records a day</dd>${rt?`<dt>Route taken</dt><dd>${routePill(rt)} ${E(rt.why)} Decision time ${E(rt.sla)}.</dd>`:""}${p.outcome?`<dt>Outcome</dt><dd>${E(p.outcome.kind==="certified"?"Approved as certified":p.outcome.kind==="project"?"Approved, project-scoped until "+p.outcome.expiry:"Rejected")} by ${E(p.outcome.by)} on ${E(p.outcome.at)}. ${E(p.outcome.reasons||"")}</dd>`:""}</dl>
 <h3>Evaluation checklist</h3>${chk}${ev?`<p class="small">Recommendation: <b>${E(ev.rec)}</b>. ${ev.fails} failed, ${ev.warns} to review.</p>`:""}
 <div class="row" style="gap:8px;flex-wrap:wrap">${p.stage==="proposed"?`<button class="btn primary" data-fab-eval="${p.id}">Start evaluation</button>`:p.stage==="evaluating"?`<button class="btn primary" data-fab-route="${p.id}">Send to the approval route</button>`:p.stage==="awaiting"?`<button class="btn primary" data-fab-decide="${p.id}">Record the decision</button>`:""}${p.conn?`<button class="btn quiet" data-fab-conn="${p.conn}">Open the connector</button>`:""}</div>`)}
function startEval(p){if(isCore()){unlockDrawer("Machine-to-machine evaluation needs the Fabric edition.");return false}
 p.eval=evaluate(p);p.route=routeOf(p,p.eval);p.stage="evaluating";if(!F.reqs.find(r=>r.ref===p.id))F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"M2M project",ref:p.id,t:p.t,route:p.route,state:"Evaluating",at:0});else F.reqs.find(r=>r.ref===p.id).route=p.route;
 audit("Fabric evaluation run",p.id+": "+p.eval.fails+" failed, "+p.eval.warns+" to review, recommend "+p.eval.rec);toast("Evaluation done: "+p.eval.rec,p.eval.fails?"warn":"good");return true}
function sendRoute(p){if(!p.eval)return false;p.route=routeOf(p,p.eval);const rq=F.reqs.find(r=>r.ref===p.id);if(rq){rq.route=p.route;rq.state="Waiting"}
 if(p.route.k==="auto"&&!p.eval.fails){p.stage="awaiting";const k=p.len==="temporary"?"project":"certified";if(decide(p,k,k==="project"?isoDay(60):"","Auto-approved by rules: "+p.route.why))audit("Fabric auto-approved",p.id);return true}
 p.stage="awaiting";audit("Fabric routed",p.id+" to "+p.route.n);toast("Routed to "+p.route.n+" ("+p.route.sla+")","good");return true}
function decideForm(id){
 const p=F.proj.find(x=>x.id===id);if(!p||!p.eval)return;
 openForm({id:"fab_decide",title:"Decision on "+p.id,story:"Recorded as the "+(p.route?p.route.n:"platform team")+". Certified creates a permanent connector. Project-scoped creates a temporary one that closes itself at expiry and opens a decommission task. Reject keeps the reasons for the proposer.",submit:"Record decision",
  fields:[{k:"out",label:"Outcome",type:"chips",req:true,opts:[["certified","Approve as certified"],["project","Approve project-scoped"],["rejected","Reject"]]},{k:"exp",label:"Expiry date",type:"date",show:v=>v.out==="project",help:"The connector stops and a decommission task opens on this date."},{k:"why",label:"Reasons",type:"longtext",req:true,ph:"Why this outcome"}],
  defaults:{out:p.eval.rec==="Reject"?"rejected":p.len==="temporary"?"project":"certified",exp:isoDay(60),why:""},
  live:v=>`<div class="story"><b>Recommendation:</b> ${E(p.eval.rec)}. ${p.eval.fails?"A failed check blocks approval; reject or send back for a fix.":""}</div>`,
  onSubmit:v=>{if(v.out!=="rejected"&&p.eval.fails){toast("A failed check blocks approval. Reject it, or fix and re-evaluate.","bad");return}if(v.out==="project"&&!v.exp){toast("Choose an expiry date","bad");return}
   if(decide(p,v.out,v.out==="project"?v.exp:"",v.why)){closeDrawer();render()}}})}
function m2mForm(){
 if(isCore()){unlockDrawer("Proposing machine-to-machine projects needs the Fabric edition.");return}
 const draft=v=>({id:"M2M-"+(F.seq.prj+1).toString().padStart(2,"0"),t:v.t||"New project",purpose:v.purpose||"",systems:(v.systems||"").split(",").map(s=>s.trim()).filter(Boolean),ents:Array.isArray(v.ents)?v.ents:[],fields:v.fields||"",dir:v.dir||"In",vol:+v.vol||0,risk:v.risk||"Low",ctype:v.ctype||"Generic REST",len:v.len||"ongoing"});
 openForm({id:"fab_m2m",title:"Propose a machine-to-machine project",story:"Describe what should flow between systems. Entities and fields come from the real registry. The platform then runs five checks and routes the decision by risk and data sensitivity.",submit:"Propose",
  fields:[{section:"What and why"},{k:"t",label:"Name",type:"text",req:true,ph:"Leave balances from the HR system"},{k:"purpose",label:"Purpose",type:"longtext",req:true,ph:"Why Oukala needs this data"},{k:"systems",label:"External systems",type:"text",req:true,ph:"HR system, Intune",help:"Comma separated."},
   {section:"Data from the registry"},{k:"ents",label:"Entities",type:"multi",req:true,opts:PLAT.entities().map(e=>[e.id,e.label])},{k:"fields",label:"Fields",type:"text",req:true,ph:"from, to, status",help:"Field keys or labels from those entities."},{k:"dir",label:"Direction",type:"chips",opts:[["In","Into Oukala"],["Out","Out of Oukala"],["Both","Both ways"]]},
   {section:"Shape and risk"},{k:"ctype",label:"Connector type",type:"select",opts:CTYPES},{k:"vol",label:"Records a day",type:"number",req:true,min:1},{k:"len",label:"How long",type:"chips",opts:[["ongoing","Ongoing"],["temporary","Temporary"]]},{k:"risk",label:"Risk",type:"chips",opts:["Low","Medium","High"]},{k:"owner",label:"Owner",type:"people",req:true}],
  defaults:{dir:"In",ctype:"Generic REST",len:"ongoing",risk:"Low",vol:500},
  live:v=>{const d=draft(v),ok=d.ents.length&&d.fields;if(!ok)return `<div class="story">Pick entities and fields to see the contract check and the route.</div>`;const ev=evaluate(d),rt=routeOf(d,ev);return `<div class="story"><b>Preview:</b> ${ev.checks.map(c=>E(c.n.split(" ")[0])+" "+CKP(c.st)[0].toLowerCase()).join(", ")}. Route: <b>${E(rt.n)}</b> (${E(rt.why)}) Recommended: ${E(ev.rec)}.</div>`},
  onSubmit:v=>{const d=draft(v);d.id="M2M-"+(++F.seq.prj).toString().padStart(2,"0");d.owner=v.owner||"Casey Rowan";d.by="Casey Rowan";d.stage="proposed";d.mine=true;d.created=0;d.eval=null;d.route=null;d.outcome=null;F.proj.unshift(d);audit("Fabric M2M project proposed",d.id+": "+d.t);toast(d.id+" proposed. Drag it to Evaluating to run the checks.","good");closeDrawer();S.v.fab=6;render()}})}
/* ---- event bus ---- */
function paneBus(){
 const ev=F.events,e24=ev.filter(e=>e.min<=1440).length,dl=SUBS.reduce((a,s)=>a+s.dl,0);
 const kp=kpiRow([["Events in 24 hours",e24.toLocaleString(),"canonical change events"],["Subscribers",SUBS.length,"apps and agents"],["Median delivery",(1.1).toFixed(1)+" s","source to subscriber"],["Dead letters",dl,"undelivered after retries",{cls:dl?"warn":"",keep:true}],["Event types",new Set(ev.map(e=>e.type)).size,"one name per entity field"]]);
 const st=btHTML({id:"fab_subs",cols:[
  {k:"n",label:"Subscriber",fmt:r=>`<b>${E(r.n)}</b>`,val:r=>r.n,wrap:true,w:220},{k:"pat",label:"Listens to",fmt:r=>r.pat.includes("*")?"Every entity":E(r.pat.map(ENTLBL).join(", ")),val:r=>r.pat.join(),wrap:true,w:240},
  {k:"mode",label:"Delivery",fmt:r=>E(r.mode),val:r=>r.mode},{k:"lag",label:"Lag",fmt:r=>E(r.lag),val:r=>r.lag},{k:"dl",label:"Dead letters",fmt:r=>r.dl?pill(String(r.dl),"warn"):"0",val:r=>r.dl},{k:"st",label:"Status",fmt:r=>stPill(r.st),val:r=>r.st}
 ],rows:()=>SUBS,key:"id",h:340,rowH:50,exportName:"fabric-subscribers"});
 const et=btHTML({id:"fab_events",cols:[
  {k:"id",label:"Event",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},{k:"type",label:"Type",fmt:r=>`<code>${E(r.type)}</code>`,val:r=>r.type,wrap:true,w:240},
  {k:"rec",label:"Record",fmt:r=>E(r.rec),val:r=>r.rec},{k:"chg",label:"Change",fmt:r=>`${E(String(r.old))} to ${E(String(r.nw))}`,val:r=>String(r.nw),wrap:true,w:200},
  {k:"src",label:"Source",fmt:r=>E((conn(r.conn)||{name:r.conn}).name),val:r=>(conn(r.conn)||{name:r.conn}).name,wrap:true},
  {k:"path",label:"Path",fmt:r=>pill(r.path==="stream"?"Stream":"Batch",r.path==="stream"?"info":"mute"),val:r=>r.path},
  {k:"at",label:"Time",fmt:r=>E(r.at),val:r=>-r.min},{k:"n",label:"Delivered to",fmt:r=>r.subs.length+" subscribers",val:r=>r.subs.length}
 ],rows:()=>F.events,key:"id",h:440,rowH:48,facets:["path","src"],exportName:"fabric-events",open:i=>evDrawer(i)});
 return `${prevBanner()}${kp}<div style="margin-top:14px">${card("Canonical change events","Every load publishes one event per changed field. Subscribers never talk to connectors; they listen here.",`<div class="grid g3 fab-g"><div class="mini glass"><b>One shape</b><span class="small muted">Type is <code>entity.field.changed</code>, with old value, new value, source, run and schema version.</span></div><div class="mini glass"><b>Real-time and batch</b><span class="small muted">A live field publishes within seconds. A daily field publishes when its batch lands.</span></div><div class="mini glass"><b>Masked by policy</b><span class="small muted">Subscribers see only fields their class allows. Restricted values are masked in the event.</span></div></div>`)}</div>
 <div style="margin-top:14px">${card("Subscribers","Who listens, how it is delivered, and how far behind they are",st)}</div><div style="margin-top:14px">${card("Event feed","Newest first; open one to see its envelope and who received it",et)}</div>`}
function evDrawer(id){
 const e=F.events.find(x=>x.id===id);if(!e)return;const m=eff(e.ent,e.k)||{};
 openDrawer(`<div class="eyebrow">Change event</div><h2 style="margin:4px 0"><code>${E(e.type)}</code></h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(e.path==="stream"?"Stream":"Batch",e.path==="stream"?"info":"mute")} ${m.cls?pill(m.cls,CLSP[m.cls]):""}</div>
 <div class="story">${E(e.rec)} changed from <b>${E(String(e.old))}</b> to <b>${E(String(e.nw))}</b>, loaded by ${E((conn(e.conn)||{name:e.conn}).name)} at ${E(e.at)}.</div>
 <dl class="kv"><dt>Event id</dt><dd><code>${e.id}</code></dd><dt>Run</dt><dd><code>${E(e.run)}</code></dd><dt>Schema</dt><dd>${e.schema}</dd><dt>Authority</dt><dd>${m.auth?pill(m.auth,AUTHP[m.auth]):""}</dd></dl>
 <h3>Delivered to</h3>${lrHTML({id:"fab_lre",groups:[{key:"s",label:"Subscribers",rows:e.subs.map((n,i)=>({id:"s"+i,t:n,sub:"Acknowledged",tag:"delivered",st:"good"}))}],limit:6})}`)}
