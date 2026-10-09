/* ---------- mapping drawer and forms ---------- */
const TFS=["As is","Trim","ISO date to date","Currency, two decimals","Map value","Directory lookup"];
function mapDrawer(id){
 const un=id.indexOf("U-")===0,row=mapRows(F.mapConn).find(r=>r.id===id);if(!row)return;
 const m=un?null:eff(row.ent,row.k);
 openDrawer(`<div class="eyebrow">${E(conn(row.conn).name)}</div><h2 style="margin:4px 0">${E(row.src)} ${un?"":"to "+E(flabel(row.ent,row.k))}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${un?pill("Unmapped","mute"):pill(row.status,row.status==="approved"?"good":row.status==="proposed"?"warn":"bad")} ${m?pill(m.auth,AUTHP[m.auth]):""} ${row.ai?pill("AI proposed","info"):""}</div>
 <div class="story">${un?"This source field has no registry target. Map it to an existing field, or propose a new one in the registry (the reuse check runs first).":"Source field "+E(row.src)+" ("+E(row.srcType)+") feeds "+E(ENTLBL(row.ent))+" "+E(flabel(row.ent,row.k))+". "+E(m.why)+". Because authority is "+E(m.auth)+", "+(m.auth==="platform"?"loaded values are kept out; Oukala wins":m.auth==="external"?"the source value overwrites":"differences open a reconciliation item")+"."}</div>
 <dl class="kv"><dt>Sample value</dt><dd><code>${E(String(row.sample||""))}</code></dd>${un?"":`<dt>Transform</dt><dd>${E(row.tf)}${row.em?" "+Object.keys(row.em).map(k=>E(k)+" to "+E(row.em[k])).join(", "):""}</dd><dt>Confidence</dt><dd>${Math.round(row.conf*100)}% ${row.ai?aiChip({model:"Claude Sonnet",conf:row.conf,title:"Why this target",note:"Source name and type matched the registry field name, label and type.",src:["Source field name and sample","Registry field catalog"]}):"(set by a person)"}</dd><dt>Version</dt><dd>v${row.ver}</dd><dt>Freshness target</dt><dd>${E(FR[m.fresh].l)} (${FR[m.fresh].mode.toLowerCase()})</dd><dt>Lag today</dt><dd>${lagS(row.lag==null?conn(row.conn).lag:row.lag)}</dd>`}</dl>
 <div class="row" style="gap:8px;flex-wrap:wrap">${un?`<button class="btn primary" data-fab-chg="${row.id}">Map to a registry field</button><button class="btn quiet" onclick="go('plat_reg')">Propose a new field</button>`:`${row.status!=="approved"?`<button class="btn primary" data-fab-apprmap="${row.id}">Approve</button>`:""}<button class="btn" data-fab-chg="${row.id}">Change target</button>${row.status!=="rejected"?`<button class="btn quiet" data-fab-rejmap="${row.id}">Reject</button>`:""}`}</div>`)}
function chgForm(id){
 const un=id.indexOf("U-")===0,row=mapRows(F.mapConn).find(r=>r.id===id);if(!row)return;
 const ents=[...new Set(F.maps.filter(m=>m.conn===row.conn).map(m=>m.ent).concat((SAMPLES[row.conn]||[]).map(s=>s.ent)).concat(conn(row.conn).ents))].filter(e=>ent_(e));
 const opts=[];ents.forEach(en=>ent_(en).fields.forEach(f=>opts.push([en+"."+f.k,ENTLBL(en)+": "+f.label])));
 openForm({id:"fab_chg",title:un?"Map "+row.src:"Change the target of "+row.src,story:"Pick the registry field this source field should feed. The mapping goes back to Proposed and needs an approval, which bumps the mapping set version.",submit:"Save mapping",
  fields:[{k:"to",label:"Registry field",type:"select",req:true,opts},{k:"tf",label:"Transform",type:"select",opts:TFS}],defaults:{to:un?opts[0][0]:row.ent+"."+row.k,tf:un?"Trim":row.tf},
  live:v=>{const p=(v.to||".").split("."),m=eff(p[0],p.slice(1).join("."));return `<div class="story"><b>Authority:</b> ${E(m.auth)}. ${E(m.conflict)}. Freshness target ${E(FR[m.fresh].l.toLowerCase())}.</div>`},
  onSubmit:v=>{const i=v.to.indexOf("."),en=v.to.slice(0,i),k=v.to.slice(i+1);if(un)F.maps.push({id:"MP-"+(100+F.maps.length),conn:row.conn,src:row.src,srcType:row.srcType,ent:en,k,tf:v.tf||"Trim",conf:1,status:"proposed",lag:conn(row.conn).lag,em:null,ver:1,ai:false});else{const m=F.maps.find(x=>x.id===id);m.ent=en;m.k=k;m.tf=v.tf||m.tf;m.status="proposed";m.conf=1;m.ai=false}
   audit("Fabric mapping edited",row.src+" to "+en+"."+k);toast("Saved as proposed","good");closeDrawer();render()}})}
function ovrForm(id){
 const i=id.indexOf("."),en=id.slice(0,i),k=id.slice(i+1),m=eff(en,k),f=fieldOf(en,k);if(!f)return;
 openForm({id:"fab_ovr",title:"Override "+f.label,story:"Changes who is the source of truth and how fresh the field must be. The change applies to every connector feeding it, is written to the audit log with your reason, and can be reset to the registry default.",submit:"Save override",
  fields:[{section:ENTLBL(en)+": "+f.label},{k:"auth",label:"Authority",type:"chips",req:true,opts:[["platform","Oukala (platform)"],["external","External system"],["shared","Shared"]],help:"Platform: Oukala wins. External: the source wins. Shared: both edit; differences are reconciled."},
   {k:"fresh",label:"Freshness target",type:"chips",req:true,opts:[["live","Live, under 5 seconds"],["near-live","Near-live, under 5 minutes"],["hourly","Hourly"],["daily","Daily"]]},
   {k:"conflict",label:"Conflict rule",type:"select",opts:["Oukala wins","External system wins","Newest wins, differences open a reconciliation item","Always ask the steward"],show:v=>v.auth==="shared"},{k:"reason",label:"Reason",type:"longtext",req:true,ph:"Why this field needs a different authority or freshness"}],
  defaults:{auth:m.auth,fresh:m.fresh,conflict:m.conflict,reason:""},
  live:v=>{const fr=FR[v.fresh||m.fresh],mp=F.maps.filter(x=>x.ent===en&&x.k===k&&x.status==="approved"),worst=mp.length?Math.min(...mp.map(x=>x.lag==null?conn(x.conn).lag:x.lag)):null;return `<div class="story"><b>Result:</b> ${E(fr.mode)} path. ${E(fr.how)}.${worst!=null?(worst<=fr.s?" Today's connector delivers in about "+lagS(worst)+", so this target is met.":" Today's connector delivers in about "+lagS(worst)+", so this target would be missed until it moves to the event stream."):" No connector feeds it yet."}</div>`},
  onSubmit:v=>{F.ovr[id]={auth:v.auth||m.auth,fresh:v.fresh||m.fresh,conflict:v.conflict||"",reason:v.reason,by:"Omar Hamid",at:dayS(0)};audit("Fabric authority overridden",en+"."+k+": "+m.auth+"/"+m.fresh+" to "+(v.auth||m.auth)+"/"+(v.fresh||m.fresh)+". "+v.reason);toast("Override saved and audited","good");closeDrawer();render()}})}
function connForm(){
 if(isCore()){unlockDrawer("Adding external connectors needs the Fabric edition.");return}
 const draftP=v=>({id:"c_new",t:v.name||"New connector",purpose:"",systems:[v.sys||"External system"],ents:Array.isArray(v.ents)?v.ents:[],fields:"",dir:"In",vol:500,risk:v.risk||"Low",ctype:v.ctype||"Generic REST",len:"ongoing"});
 openForm({id:"fab_conn",title:"Add a connector",story:"Community connectors run in the sandbox only until evaluated. Project-scoped connectors are temporary and close at their expiry date. Certified connectors need an approval, routed by risk and data sensitivity.",submit:"Create",
  fields:[{section:"Connector"},{k:"name",label:"Name",type:"text",req:true,ph:"HR leave balances"},{k:"ctype",label:"Type",type:"select",opts:CTYPES},{k:"sys",label:"External system",type:"text",req:true,ph:"HR system"},{k:"owner",label:"Owner",type:"people",req:true},{k:"ents",label:"Entities it feeds",type:"multi",opts:PLAT.entities().map(e=>[e.id,e.label])},
   {section:"Tier and security"},{k:"tier",label:"Tier",type:"chips",opts:[["community","Community (sandbox only)"],["project","Project-scoped (temporary)"],["certified","Certified (needs approval)"]]},{k:"exp",label:"Expiry date",type:"date",show:v=>v.tier==="project"},{k:"risk",label:"Risk",type:"chips",opts:["Low","Medium","High"]},{k:"vault",label:"Secret reference",type:"text",ph:"vault://meridian-prod/fabric/hr-key",help:"A vault path only. Never paste a secret."}],
  defaults:{ctype:"Generic REST",tier:"community",risk:"Low",exp:isoDay(60)},
  live:v=>{if(v.tier!=="certified")return `<div class="story"><b>Next:</b> ${v.tier==="project"?"Runs for real until "+E(v.exp||"its expiry")+", then a decommission task opens.":"Runs in the sandbox only. Request certification when it is ready."}</div>`;const p=draftP(v),rt=routeOf(p,evaluate(p));return `<div class="story"><b>Approval route:</b> ${E(rt.n)}. ${E(rt.why)}</div>`},
  onSubmit:v=>{if(activeConns().length>=ED[F.edition].conn){toast("No free connector slot","warn");unlockDrawer("All "+ED[F.edition].conn+" connector slots in the "+ED[F.edition].n+" edition are used.");return}
   if(v.vault&&!/^vault:\/\//.test(v.vault)){toast("Use a vault:// reference, never a secret","bad");return}
   const p=draftP(v),rt=routeOf(p,evaluate(p)),cert=v.tier==="certified"&&rt.k==="auto",tier=cert?"certified":v.tier==="project"?"project":"community";
   const c={id:"c_"+hs(v.name+F.conns.length).toString(36),name:v.name,kind:{"Generic REST":"rest",MCP:"mcp","Identity provider":"idp","Microsoft Graph":"graph"}[v.ctype]||"rest",tier,status:tier==="community"?"sandbox":"new",owner:v.owner||"Omar Hamid",min:"fabric",env:tier==="community"?"Sandbox":"Production",ents:p.ents,canStream:false,lag:3600,sys:v.sys,risk:v.risk||"Low",desc:"Added by "+(v.owner||"Omar Hamid")+".",expiry:tier==="project"?v.exp:undefined,auth:A(["read"],"To be set","pending",v.vault||"vault://meridian-sbx/fabric/"+hs(v.name)+" (to be created)","svc-fabric-"+hs(v.name))};
   F.conns.splice(F.conns.findIndex(x=>x.kind==="roadmap"),0,c);
   if(v.tier==="certified"&&!cert)F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"Certify connector",ref:c.id,t:"Certify "+c.name,route:rt,state:"Waiting",at:0});
   audit("Fabric connector added",c.name+" as "+tier+(v.tier==="certified"&&!cert?", certification routed to "+rt.n:""));toast(cert?"Auto-approved as certified":v.tier==="certified"?"Created in the sandbox; certification routed to "+rt.n:"Connector created: "+TIERP[tier][0],"good");closeDrawer();render()}})}
function certForm(id){
 const c=conn(id);if(isCore()){unlockDrawer("Certification needs the Fabric edition.");return}
 const mp=F.maps.filter(m=>m.conn===id),ctype={rest:"Generic REST",mcp:"MCP",idp:"Identity provider",graph:"Microsoft Graph"}[c.kind]||"Other (custom code)";
 const p={id:c.id,t:c.name,purpose:c.desc,systems:[c.sys],ents:c.ents,fields:mp.map(m=>m.k).join(", "),dir:"In",vol:500,risk:c.risk||"Medium",ctype,len:"ongoing"},ev=evaluate(p),rt=routeOf(p,ev);
 openForm({id:"fab_cert",title:"Request certification",story:"The five checks run on the connector as it is today, then the request goes down the route that fits its risk and data. Auto-approval promotes it immediately.",submit:"Submit request",
  fields:[{k:"why",label:"Why it is ready",type:"longtext",req:true,ph:"Sandbox runs have been clean for two weeks"}],
  live:()=>`<div class="story"><b>Route:</b> ${E(rt.n)} (${E(rt.sla)}). ${E(rt.why)} Checks: ${ev.checks.map(x=>E(x.n.split(" ")[0])+" "+CKP(x.st)[0].toLowerCase()).join(", ")}.</div>`,
  onSubmit:v=>{F.reqs.unshift({id:"REQ-"+(F.seq.req++),kind:"Certify connector",ref:c.id,t:"Promote "+c.name+" to certified",route:rt,state:rt.k==="auto"&&!ev.fails?"Decided":"Waiting",at:0});
   if(rt.k==="auto"&&!ev.fails){c.tier="certified";c.status="healthy";c.env="Production";toast("Auto-approved: "+c.name+" is certified","good")}else toast("Routed to "+rt.n,"good");audit("Fabric certification requested",c.name+" routed to "+rt.n);closeDrawer();render()}})}
function bfForm(id){
 const c=conn(id);if(isCore()&&!allowed(c)){unlockDrawer("Backfill needs the Fabric edition.");return}
 openForm({id:"fab_bf",title:"Backfill "+c.name,story:"Replays a date range through the same pipeline. Records already loaded are skipped by their idempotency keys, so a backfill is safe to repeat.",submit:"Start backfill",
  fields:[{k:"from",label:"From",type:"date",req:true},{k:"to",label:"To",type:"date",req:true}],defaults:{from:isoDay(-7),to:isoDay(0)},
  onSubmit:v=>{const d=Math.max(1,Math.round((Date.parse(v.to)-Date.parse(v.from))/86400000)+1),read=d*(c.lag>5000?60:120);const same_=Math.round(read*.8);
   newRun(c,{read,valid:read,loaded:read-same_,same:same_,events:read-same_,kind:"backfill "+v.from+" to "+v.to,dur:20+d*3});F.usage++;audit("Fabric backfill",c.name+": "+v.from+" to "+v.to+", "+read+" read, "+same_+" skipped as already loaded");toast("Backfill done: "+(read-same_)+" new, "+same_+" skipped","good");closeDrawer();render()}})}
/* ---------- screen ---------- */
function screen(){
 ensure();sweepExpiry();syncMetrics();
 const ac=activeConns(),s=slaStats(),fed=new Set(apprMaps().map(m=>m.ent+"."+m.k)).size;
 const story=`<b data-role="metric">${ac.length}</b> connectors feed <b data-role="metric">${fed}</b> registry fields, and <b data-role="metric">${s.pct}%</b> meet their freshness target. Take the project schedule: Oukala is authoritative, while dates arrive from Planner and Jira (Project Online retired on Sept 30). <b data-role="metric">${qOpen().length}</b> records wait in quarantine and <b data-role="metric">${rOpen().length}</b> differences need a decision. ${isCore()?"You are on the free Core edition, so this is a live preview.":"Edition: "+ED[F.edition].n+"."}`;
 const extra=`<div class="row" style="gap:8px;flex-wrap:wrap">${fchip("m_fab_fresh")}${fchip("m_fab_quar")}${fchip("m_fab_cov")}${stdChip("dmbok","Data integration and interoperability, data quality and metadata: each field has a steward, an authority and a quality rule, and every load is validated and audited.")}${isCore()?`<button class="btn primary" data-fab-unlock>Unlock the Fabric</button>`:""}</div>`;
 const panes=[paneOver(),paneConn(),paneMap(),paneAuth(),paneRuns(),paneRecon(),paneM2M(),paneBus()];
 return `<div class="screen fabx">${hero("Platform","Integration fabric: feed any field, keep control",story,extra)}${lensNote()}${views("fab",["Overview","Connectors","Mappings","Field authority","Runs and quarantine","Reconciliation","M2M projects","Event bus"],panes)}${procCard("plat_fab")}</div>`}
REG("plat_fab","Integration fabric","platform","M3 12h5l2-6 4 12 2-6h5",screen);
/* ---------- events ---------- */
const CL={
 fabUnlock:()=>unlockDrawer(),fabKey:()=>keyForm(),
 fabEd:v=>{F.edition=v;if(v==="core")F.key="";else if(!F.key)F.key="FAB-MSF-2026-7Q4K";audit("Fabric edition switched",ED[v].n+" (demo switch)");toast("Edition: "+ED[v].n);closeDrawer();render()},
 fabConn:v=>connDrawer(v),fabRun:v=>runSample(v),fabBf:v=>bfForm(v),fabCert:v=>certForm(v),
 fabExpire:v=>{expireConn(conn(v));toast("Expired. A decommission task was created.","warn");connDrawer(v);render()},
 fabNewconn:()=>connForm(),fabMapconn:v=>{F.mapConn=v},
 fabPropose:v=>{if(isCore()){unlockDrawer("Proposing mappings needs the Fabric edition.");return}proposeFor(v)},
 fabApprall:v=>{if(isCore()){unlockDrawer("Approving mappings needs the Fabric edition.");return}const ids=F.maps.filter(m=>m.conn===v&&m.status==="proposed"&&m.conf>=.85).map(m=>m.id);if(!ids.length){toast("Nothing at 85% or more is waiting","warn");return}setMapStatus(ids,"approved");render()},
 fabApprmap:v=>{if(isCore()){unlockDrawer("Approving mappings needs the Fabric edition.");return}setMapStatus([v],"approved");closeDrawer();render()},
 fabRejmap:v=>{setMapStatus([v],"rejected");closeDrawer();render()},fabChg:v=>chgForm(v),fabTest:v=>dryRun(v),
 fabOvr:v=>ovrForm(v),fabOvrreset:v=>{delete F.ovr[v];audit("Fabric override reset",v);toast("Back to the registry default");closeDrawer();render()},
 fabFix:v=>fixForm(v),fabRequeue:v=>{const q=F.quar.find(x=>x.id===v);q.status="open";q.attempts=0;audit("Fabric requeued",v);toast("Requeued");quarDrawer(v);render()},
 fabWi:v=>wiForm(v),fabRes:v=>{if(isCore()){unlockDrawer("Resolving differences needs the Fabric edition.");return}const p=v.split(":");resolveRecon(p[0],p[1])},
 fabPj:v=>projDrawer(v),fabEval:v=>{const p=F.proj.find(x=>x.id===v);if(startEval(p)){render();projDrawer(v)}},fabRoute:v=>{const p=F.proj.find(x=>x.id===v);sendRoute(p);render();projDrawer(v)},fabDecide:v=>decideForm(v),fabNewm2m:()=>m2mForm(),
 fabReplay:v=>{const r=F.runs.find(x=>x.id===v),c=conn(r.conn);newRun(c,{read:r.read,valid:r.valid,same:r.loaded,loaded:0,kind:"replay of "+r.id,idem:r.idem});audit("Fabric run replayed",r.id+": nothing changed, idempotency keys matched");toast("Replayed "+r.id+": nothing changed, every key matched","good");closeDrawer();render()},
 fabRetry:v=>{const r=F.runs.find(x=>x.id===v),c=conn(r.conn);r.status="ok";r.err="";r.loaded=Math.round(60+hs(v)%80);r.read=r.loaded;r.valid=r.loaded;r.events=r.loaded;r.retries++;audit("Fabric run retried",v+" succeeded after retry");toast("Retry succeeded","good");closeDrawer();render()},
 fabTab:(v)=>{closeDrawer();goTab(+v)}};
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-fab-unlock],[data-fab-key],[data-fab-ed],[data-fab-conn],[data-fab-run],[data-fab-bf],[data-fab-cert],[data-fab-expire],[data-fab-newconn],[data-fab-mapconn],[data-fab-propose],[data-fab-apprall],[data-fab-apprmap],[data-fab-rejmap],[data-fab-chg],[data-fab-test],[data-fab-ovr],[data-fab-ovrreset],[data-fab-fix],[data-fab-requeue],[data-fab-wi],[data-fab-res],[data-fab-pj],[data-fab-eval],[data-fab-route],[data-fab-decide],[data-fab-newm2m],[data-fab-replay],[data-fab-retry],[data-fab-tab]");
 if(!t||t.disabled)return;ensure();
 Object.keys(t.dataset).filter(k=>CL[k]).sort((a,b)=>(a==="fabTab")-(b==="fabTab")).forEach(k=>CL[k](t.dataset[k],t))});
DND.on("fab_m2m",(id,from,to)=>{const p=F.proj.find(x=>x.id===id);if(!p||from===to){render();return}
 const f=p.stage;
 if(f==="proposed"&&to==="evaluating")startEval(p);
 else if(f==="evaluating"&&to==="awaiting")sendRoute(p);
 else if(f==="awaiting"&&(to==="certified"||to==="project"||to==="rejected")){render();decideForm(id);return}
 else toast("Projects move one step at a time: propose, evaluate, route, decide.","warn");
 render()});
/* ---------- process, search, ask, work, public API ---------- */
PROC.reg("plat_fab",{title:"How a connector or feed goes live",std:["dmbok","togaf"],steps:[
 {n:"Propose",d:"Anyone proposes a connector or machine-to-machine project: purpose, systems, entities and fields from the registry, direction, volume, owner, risk.",who:"human",owner:"Requester",out:"Proposal"},
 {n:"Contract and duplicate check",d:"Fields are checked against the registry and the reuse check looks for an existing connector or entity.",who:"auto",owner:"Platform",out:"Fit report"},
 {n:"Security and sandbox test",d:"The Integration Agent reviews scopes, secret references and data class, then runs a 200 record sandbox sample.",who:"agent",owner:"Integration Agent",out:"Review and sample result"},
 {n:"Approval route",d:"Low risk, read-only, internal data on a certified connector type auto-approves. Standard goes to the platform team plus security. High risk or sensitive data goes to the data council.",who:"gate",owner:"Platform team, security or data council",sla:"Instant to 5 days",out:"Certified, project-scoped with expiry, or rejected"},
 {n:"Go live",d:"Secret stored as a vault reference, service identity created, mappings approved, schedule or stream started.",who:"auto",owner:"Platform",out:"Running connector"},
 {n:"Run, validate, load",d:"Extract, validate against the contract, transform, match and merge by field authority, load with idempotency keys, publish change events.",who:"auto",owner:"Fabric",out:"Registry updated"},
 {n:"Fix quarantine and reconcile",d:"Stewards fix and replay quarantined records and decide differences on shared fields.",who:"human",owner:"Data steward",out:"Resolved items"},
 {n:"Expire or recertify",d:"Project-scoped connectors close at expiry and open a decommission task.",who:"auto",owner:"Platform",out:"Decommission task"}]});
SEARCHX.push(()=>{ensure();return F.conns.filter(c=>c.kind!=="roadmap").map(c=>({g:"Integration fabric",t:c.name,m:TIERP[c.tier][0],c:"--p4",f:()=>{go("plat_fab");setTimeout(()=>connDrawer(c.id),150)},k:c.name+" connector "+c.sys+" "+c.ents.join(" ")+" integration fabric"})).concat(F.proj.map(p=>({g:"Integration fabric",t:p.id+" "+p.t,m:"M2M project",c:"--p4",f:()=>{go("plat_fab");setTimeout(()=>projDrawer(p.id),150)},k:p.t+" machine to machine integration project"})))});
ASKX.push(q=>{const t=q.toLowerCase();
 if(/how fresh|freshness|how current|how up to date/.test(t)&&/schedule|project (date|plan)|planned|task date|dates/.test(t)){ensure();
  const sf=eff("project_task","planned_finish"),ml=F.maps.filter(m=>m.ent==="project_task"&&m.k==="planned_finish"&&m.status==="approved"),lg=ml.length?Math.min(...ml.map(m=>m.lag==null?conn(m.conn).lag:m.lag)):null;
  S.v.fab=3;go("plat_fab");say(q,{t:"The project schedule is <b>"+sf.auth+"</b> authority with a <b>"+FR[sf.fresh].l.toLowerCase()+"</b> target ("+FR[sf.fresh].mode.toLowerCase()+"). Dates arrive from "+(ml.map(m=>conn(m.conn).name).join(" and ")||"no connector")+(lg!=null?", about "+lagS(lg)+" behind the source, so the target is "+(lg<=FR[sf.fresh].s?"met":"missed")+".":".")+" Differences open a reconciliation item.",steps:["Read the field authority for planned finish","Compared the connector lag with the target","Opened Field authority"]});return true}
 if(/open the fabric|integration fabric|show the fabric|go to the fabric|data fabric/.test(t)){S.v.fab=0;go("plat_fab");say(q,{t:"Opened the Integration fabric: edition, limits, connector health and what needs attention.",steps:["Opened Integration fabric"]});return true}
 if(/which connectors|list (the )?connectors|what connectors|connectors do we have/.test(t)){ensure();S.v.fab=1;go("plat_fab");const cs=F.conns.filter(c=>c.kind!=="roadmap");
  say(q,{t:"There are <b>"+cs.length+"</b> connectors: "+cs.filter(c=>c.tier==="certified").length+" certified, "+cs.filter(c=>c.tier==="community").length+" community (sandbox only) and "+cs.filter(c=>c.tier==="project").length+" project-scoped. Launch connectors: Generic REST, MCP, identity provider and Microsoft Graph. On the roadmap: Perplexity, IDE tools, ERP, HR, CRM and ITSM.",steps:["Listed connectors by tier","Opened Connectors"]});return true}
 if(/quarantine|dead letter|reconcil/.test(t)&&/fabric|integration|quarantine|reconcil/.test(t)){ensure();S.v.fab=/reconcil/.test(t)?5:4;go("plat_fab");say(q,{t:"<b>"+qOpen().length+"</b> records are in quarantine and <b>"+rOpen().length+"</b> differences await a decision on shared fields.",steps:["Counted open items"]});return true}
 return false});
window.WORK&&WORK.push({kind:"Integration work items",tag:"WI",fn:n=>{ensure();return F.wi.filter(w=>w.who===n&&w.st==="open").map(w=>({id:w.id,t:w.t,sub:w.sub,due:w.due,st:"warn",hrs:1,go:()=>{S.v.fab=5;go("plat_fab")}}))}});
window.FAB={
 get connectors(){ensure();return F.conns.filter(c=>c.kind!=="roadmap").map(c=>({id:c.id,name:c.name,tier:c.tier,status:c.status,owner:c.owner,fields:fedCount(c.id),entities:c.ents.slice()}))},
 get runs(){ensure();return F.runs},get quarantine(){ensure();return F.quar},get projects(){ensure();return F.proj},
 open(id){ensure();connDrawer(id)},openProject(id){ensure();projDrawer(id)},openQuarantine(id){ensure();quarDrawer(id)},
 edition(){return F.edition},limits(){return ED[F.edition]},
 freshness(ent,k){ensure();const m=eff(ent,k);return{authority:m.auth,target:m.fresh,mode:FR[m.fresh].mode}}};
})();
