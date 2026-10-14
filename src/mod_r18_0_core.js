/* ===== Round 18, core: shared helpers and the derived view of every build (guardrail facets, process, metrics, maturity, debt, value, scale).
   A "build" is a citizen-built app from GATE.apps() (the existing registry, reused). Extra attributes live in R18.META or are derived.
   Globals: window.R18 {G,H,arr,st,TODAY,apps,app,meta,facets,coverage,process,metrics,maturity,debt,value,scale,people,kill} ===== */
(function(){
"use strict";
const W=window;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=x=>Array.isArray(x)?x:[];
const R18=W.R18=W.R18||{};
R18.G=G;R18.H=H;R18.arr=arr;
const TODAY=R18.TODAY="2026-10-06";
const ST=R18.st=(S.r18=S.r18||{});
Object.assign(ST,{obj:ST.obj||{},conf:ST.conf||{},lens:ST.lens||"coo",showAll:!!ST.showAll,app:ST.app||"ca_pipeline",kill:ST.kill||{},lensOpen:false,rate:ST.rate||62,mins:ST.mins||45});
const hash=s=>{let h=7;for(let i=0;i<String(s).length;i++)h=(h*31+String(s).charCodeAt(i))%99991;return h};
R18.hash=hash;
const fD=s=>s?new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"None";
R18.fD=fD;
const usd=n=>"$"+Math.round(n).toLocaleString("en-US");
R18.usd=usd;
const pill=(t,c)=>`<span class="pill ${c||"mute"}">${H(t)}</span>`;
R18.pill=pill;

/* ---------- people ---------- */
const HUMANS=()=>arr(G(()=>PEOPLE,[])).filter(p=>!/Contractor|AI agent|Managed service|Chief editor/i.test(p[1])).map(p=>p[0]);
R18.humans=HUMANS;
const BACKUP={"Chief Editor":"Nia Brooks","Priya Shah":"Dev Rao","Avery Chen":"Maya Ortiz","Dev Rao":"Priya Shah","Maya Ortiz":"Avery Chen","Jordan Lee":"Sam Patel","Sam Patel":"Jordan Lee","Nia Brooks":"Tom Becker","Tom Becker":"Nia Brooks","Rina Okafor":"Jordan Lee"};
const FN={"Chief Editor":"Standards","Priya Shah":"Delivery","Avery Chen":"Finance","Dev Rao":"Delivery","Maya Ortiz":"Membership","Jordan Lee":"Technology","Sam Patel":"Technology","Nia Brooks":"Standards","Tom Becker":"IT service","Rina Okafor":"Security"};
R18.FUNCTIONS=["Standards","Finance","Delivery","Membership","Technology","IT service","Security","Facilities","People"];
const OBJ_OF={ca_comments:"O1",ca_styleguide:"O1",ca_ballot:"O1",ca_digest:"O5",ca_vendor_onb:"O3",ca_budget:"O3",ca_inv_exc:"O3",ca_renewals:"O3",ca_pipeline:"O3",ca_lease:"O2",ca_oncall_swap:"O2",ca_laptops:"O2"};

/* ---------- seed two builds that tell the story (idempotent) ---------- */
const MOK=()=>({manifest:true,ownAuth:false,ownNotify:false,ownReport:false,secrets:false,labels:true,audit:true,a11y:"pass"});
const NEW=[
 {id:"ca_inv_exc",n:"Vendor invoice exceptions",purpose:"Track invoices that fail a match check, who is chasing the vendor and how long each has waited.",tier:"team",builder:"Avery Chen",owner:"Avery Chen",status:"review",reads:["invoice","contract","core_company"],writes:[],newEnts:[{id:"invoice_exception",why:"Reason, chaser and wait time for each exception",approved:false}],connectors:["m365"],ai:[{model:"Claude Haiku",gw:true,cap:60,use:"Draft the chase email to the vendor"}],classes:["confidential"],cost:58,aiCost:21,sunset:"2027-09-30",users:7,ttfa:6,created:"2026-09-28",dupProc:"",m:MOK()},
 {id:"ca_pipeline",n:"Membership pipeline and renewals view",purpose:"One view of the renewal pipeline set against the strategy and the budget, for the membership team.",tier:"personal",builder:"Maya Ortiz",owner:"Maya Ortiz",status:"sandbox",reads:["person","objective","budget_line","cost_center"],writes:[],newEnts:[],connectors:["m365"],ai:[{model:"Claude Haiku",gw:true,cap:40,use:"Explain why a renewal is at risk"}],classes:["internal","personal"],cost:30,aiCost:14,sunset:"2027-06-30",users:3,ttfa:5,created:"2026-10-02",dupProc:"",m:MOK()}];
function seed(){const a=G(()=>typeof GATE.apps==="function"?GATE.apps():GATE.apps,null);if(!Array.isArray(a))return false;NEW.forEach(n=>{if(!a.some(x=>x.id===n.id))a.push(JSON.parse(JSON.stringify(n)))});return true}
R18.apps=()=>{seed();return arr(G(()=>typeof GATE.apps==="function"?GATE.apps():GATE.apps,[]))};
R18.app=id=>R18.apps().find(a=>a.id===id)||null;

/* ---------- meta: function, backup, strategic link, process, metrics ---------- */
function ownerName(a){return String(a.owner||a.builder||"").replace(/\s*\(.*\)$/,"")}
R18.meta=id=>{const a=R18.app(id);if(!a)return{};const ow=ownerName(a);const left=/left/i.test(a.builder||"")||/left/i.test(a.owner||"");
 const fn=a.fn||FN[ow]||FN[String(a.builder||"").replace(/\s*\(.*\)$/,"")]||(/lease|room|facilit/i.test(a.n+a.purpose)?"Facilities":"Technology");
 const backup=left?"":(BACKUP[ow]||HUMANS().find(h=>h!==ow)||"");
 return{fn,owner:left?"":ow,backup,obj:ST.obj[id]!==undefined?ST.obj[id]:(OBJ_OF[id]||""),ownerGone:left,confirmed:!!ST.conf[id]}};
R18.objectives=()=>arr(G(()=>EXE.E.objs,[]));
R18.objective=id=>R18.objectives().find(o=>o.id===id)||null;

/* ---------- process steps (human, automatic, AI, gate), generated from the build ---------- */
const HAND={
 ca_inv_exc:[["Invoice fails the match check","auto","Reads the invoice and contract; compares amount, quantity and approval","Invoice, contract"],["Classify the reason","ai","Claude Haiku proposes a reason code; a person can change it","Reason code"],["Chase the vendor","human","Accounts payable analyst sends the drafted email and logs the reply","Chase log"],["Resolve or escalate","gate","Over 10 days or over $25,000 goes to the Finance review group","Decision"],["Close and learn","auto","Closes the exception and updates the vendor's exception rate","Closed exception"]],
 ca_pipeline:[["Pull renewals due in 90 days","auto","Reads the member list and renewal dates","Renewal list"],["Set against the strategy and budget","auto","Reads the approved objectives and the budget lines for the membership program","Pipeline vs plan"],["Explain the at-risk renewals","ai","Claude Haiku gives a reason from the member's history; a person reviews it","Risk note"],["Decide the outreach","human","The membership lead chooses who to contact and how","Outreach plan"],["Track the response","auto","Logs replies and updates the pipeline","Response log"]]};
R18.process=id=>{const a=R18.app(id);if(!a)return{steps:[],pid:null,counts:{human:0,auto:0,ai:0,gate:0}};
 let st=HAND[id];
 if(!st){st=[["Something triggers the work","auto","A schedule, a form or a message starts "+a.n.toLowerCase(),"Trigger"]];
  if(arr(a.reads).length)st.push(["Gather the data","auto","Reads "+arr(a.reads).slice(0,3).join(", ")+" through the platform, never directly","Data"]);
  if(arr(a.ai).length)st.push([a.ai[0].use||"AI assists","ai",a.ai[0].model+" through the AI gateway, capped at $"+(a.ai[0].cap||0)+" a month; a person reviews","AI draft"]);
  st.push(["A person decides","human",(a.builder||"The owner")+" or the team reviews and acts","Decision"]);
  if(arr(a.writes).length||arr(a.newEnts).length)st.push(["Record the outcome","gate","Writes go through the owner of the data, with an approval where needed","Record"]);
  st.push(["Notify and close","auto","Uses the platform notification service","Notice"])}
 const steps=st.map(s=>({n:s[0],who:s[1],d:s[2],out:s[3]}));const counts={human:0,auto:0,ai:0,gate:0};steps.forEach(s=>counts[s.who]=(counts[s.who]||0)+1);
 return{steps,pid:"proc_"+id,counts}};

/* ---------- metrics with formulas and a path to automating on trend ---------- */
R18.metrics=id=>{const a=R18.app(id);if(!a)return[];const h=hash(id);const u=Math.max(1,a.users||1);
 const defs=[
  {id:id+"_vol",n:"Items handled per week",f:"Items closed in the last 7 days from the app's record store",u:"",cur:Math.round(u*(3+h%5)),tgt:Math.round(u*6),dir:"max",rule:"If it falls 20% below target for 3 weeks, notify the owner and open an improvement task"},
  {id:id+"_cyc",n:"Cycle time",f:"Average days from start to close, over items closed in the last 28 days",u:" days",cur:+(2.5+(h%40)/10).toFixed(1),tgt:3,dir:"min",rule:"If it rises above target for 2 weeks, ask the owner to review the slowest step"},
  {id:id+"_rwk",n:"Rework rate",f:"Items reopened or corrected ÷ items closed × 100, last 28 days",u:"%",cur:+(3+(h%90)/10).toFixed(1),tgt:5,dir:"min",rule:"If it passes 8%, pause the AI step and require a person to review every item"}];
 defs.forEach(m=>{const bad=m.dir==="max"?m.cur<m.tgt*.8:m.cur>m.tgt*1.2;const ok=m.dir==="max"?m.cur>=m.tgt:m.cur<=m.tgt;m.st=ok?"good":bad?"bad":"warn"});
 return defs};

/* ---------- conformance, debt ---------- */
R18.conf=id=>G(()=>GATE.conformance(id),{rows:[],pass:0,warn:0,fail:0,score:0});
R18.debt=id=>{const a=R18.app(id);if(!a)return[];const out=[];
 arr(G(()=>DEBT.byApp(id),[])).forEach(d=>out.push({t:d.title||d.id,sev:d.sev||"Medium",decision:"Recorded in the platform debt register",impact:d.impact||"Counts against this app's debt budget",fix:d.fix||"See the debt item",owner:d.owner||a.owner||"",src:"register",id:d.id}));
 const DEC={nodup:["Created your own copy of a table instead of reusing the registered one","The second copy drifts from the authoritative one and cannot be scaled to other units"],noproc:["Rebuilt a process the platform already runs","Two versions of the same process; improvements will not reach this one"],nowrite:["Writes a shared table directly","A bad write corrupts data other units rely on"],auth:["Built your own sign-in and roles","Access cannot be reviewed or revoked centrally; blocks any wider rollout"],notify:["Sends its own messages and reports","Users get messages outside the notification rules and cannot manage them"],secrets:["Keeps a key in the source code","A leaked key exposes a connected system"],labels:["Stores fields without classification labels","Masking and retention rules cannot apply, so the app cannot hold sensitive data at scale"],audit:["No audit events","Changes cannot be traced, which blocks use in a controlled process"],aigw:["Calls a model directly, outside the gateway and spend cap","No spend cap or guardrails; a runaway loop can cost real money"],owner:["No support owner","When something breaks nobody is accountable"],sunset:["No review or sunset date","The app outlives its owner and becomes an orphan"],manifest:["No declared manifest","The platform cannot see what the app reads or writes"],a11y:["Accessibility basics not met","Cannot be offered to the wider organization"]};
 R18.conf(id).rows.forEach(r=>{if(r.r!=="pass"){const d=DEC[r.id]||[r.n,r.ev];out.push({t:r.n,sev:r.r==="fail"?"High":"Medium",decision:d[0],impact:d[1],fix:r.fix||"Fix the check",owner:a.owner||a.builder||"",src:"gate check",id:r.id})}});
 const m=R18.meta(id);if(m.ownerGone)out.push({t:"Owner has left",sev:"High",decision:"The builder left and nobody took over",impact:"No one is accountable; the app stays live with no support",fix:"Name a new owner and a backup, or sunset the app",owner:"",src:"ownership",id:"gone"});
 return out};

/* ---------- maturity (five levels, computed from the app itself) ---------- */
R18.LEVELS=[["Described","Purpose, builder and data are written down"],["Governed","Manifest, audit, labels, support owner, backup and review date are in place"],["Measured","Three or more metrics with formulas, targets and thresholds"],["Automated","Thresholds trigger actions; the kill switch has been tested"],["Optimized","Runs for other units; benchmarked; debt kept inside budget"]];
R18.maturity=id=>{const a=R18.app(id);if(!a)return{lvl:0,levels:[],next:[],tgt:3};const c=R18.conf(id),m=R18.meta(id),me=R18.metrics(id),dt=R18.debt(id);
 const gov=["manifest","audit","labels","owner","sunset"].every(k=>(c.rows.find(r=>r.id===k)||{r:"pass"}).r==="pass")&&!!m.backup;
 const crit=[
  [{t:"Purpose is written down",ok:!!a.purpose},{t:"Builder named",ok:!!a.builder},{t:"Data it reads or writes is declared",ok:true}],
  [{t:"Manifest, audit and labels pass the gate",ok:["manifest","audit","labels"].every(k=>(c.rows.find(r=>r.id===k)||{r:"pass"}).r==="pass")},{t:"Support owner named",ok:!!m.owner},{t:"Different backup named",ok:!!m.backup},{t:"Review or sunset date set",ok:!!a.sunset}],
  [{t:"Three metrics with formulas",ok:me.length>=3},{t:"Each metric has a target and a threshold",ok:me.every(x=>x.tgt!=null)},{t:"Process map reviewed by the owner",ok:a.status==="review"||a.status==="certified"}],
  [{t:"Thresholds trigger an action",ok:a.status==="certified"},{t:"Kill switch tested",ok:!!R18.kill.tested(id)},{t:"All required data access approved",ok:G(()=>R18.access.stateOf(id).ok,true)}],
  [{t:"Used by another unit",ok:(a.users||0)>=30},{t:"No high-severity debt",ok:!dt.some(d=>d.sev==="High")},{t:"Certified at team tier or higher",ok:a.status==="certified"&&a.tier!=="personal"}]];
 let lvl=0;for(let i=0;i<5;i++){if(crit[i].every(x=>x.ok))lvl=i+1;else break}
 const cap=a.status==="idea"?1:a.status==="sandbox"?2:a.status==="review"?3:5;lvl=Math.min(lvl,cap);
 const tgt=a.tier==="enterprise"?5:a.tier==="team"?4:3;
 const next=lvl<5?crit[lvl].filter(x=>!x.ok).map(x=>x.t):[];
 return{lvl,levels:crit,tgt,next,gov,capped:lvl<(()=>{let l=0;for(let i=0;i<5;i++){if(crit[i].every(x=>x.ok))l=i+1;else break}return l})()}};

/* ---------- kill switch (per build) ---------- */
R18.kill={on:id=>!!ST.kill[id],tested:id=>!!(ST.kill["t_"+id]||(R18.app(id)||{}).status==="certified"),set:(id,v)=>{ST.kill[id]=!!v;ST.kill["t_"+id]=true;G(()=>audit(v?"Kill switch on":"Kill switch off",(R18.app(id)||{}).n||id));G(()=>EVENTS.emit&&EVENTS.emit("build.kill_switch",{build:id,on:!!v}))}};

/* ---------- value, cost and risk (modeled; labeled illustrative) ---------- */
R18.value=id=>{const a=R18.app(id);if(!a)return{hours:0,gross:0,cost:0,net:0,risk:0};
 const hours=Math.round((a.users||0)*ST.mins/60*4.3);const gross=hours*ST.rate;const cost=(a.cost||0)+(a.aiCost||0);
 const c=R18.conf(id);const risk=Math.round((c.fail*14+c.warn*5)+(R18.debt(id).filter(d=>d.sev==="High").length*6));
 return{hours,gross,cost,net:gross-cost,risk:Math.min(100,risk),score:c.score}};

/* ---------- scale: the five questions ---------- */
const tok=s=>String(s||"").toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3&&!/^(this|that|with|from|and|the|for|their|each|every|into|when|view|app|tracker|helper)$/.test(w));
R18.scale=id=>{const a=R18.app(id);if(!a)return{};const t=new Set(tok(a.n+" "+a.purpose));
 const similar=R18.apps().filter(b=>b.id!==id).map(b=>{const o=tok(b.n+" "+b.purpose);let n=0;o.forEach(w=>{if(t.has(w))n++});return{b,n}}).filter(x=>x.n>=2).sort((x,y)=>y.n-x.n).slice(0,3).map(x=>x.b);
 const procs=G(()=>PROCLIB.list(),[]).map(p=>{const o=tok(p.name);let n=0;o.forEach(w=>{if(t.has(w))n++});return{p,n}}).filter(x=>x.n>=2).sort((x,y)=>y.n-x.n).slice(0,2).map(x=>x.p);
 const owns=arr(a.newEnts).filter(e=>!e.dupOf);const dups=arr(a.newEnts).filter(e=>e.dupOf);
 const needs=arr(a.reads).map(e=>({id:e,label:G(()=>PLAT.ent(e).label,e),owner:G(()=>PLAT.ent(e).owner,"Platform"),cls:G(()=>PLAT.ent(e).fields.reduce((m,f)=>{const o=["public","internal","personal","confidential","restricted"];return o.indexOf(f.classification)>o.indexOf(m)?f.classification:m},"internal"),"internal")}));
 const sec=a.classes.includes("confidential")||a.classes.includes("restricted")?"Confidential data: role-based access, masking of personal fields, no export, review every 90 days":a.classes.includes("personal")?"Personal data: role-based access, mask by default, review every 180 days":"Internal data: platform sign-in and role access";
 return{similar,procs,owns,dups,needs,sec,ready:similar.length>0||(a.users||0)>=20}};

/* ---------- guardrail facets: eight, each with a state and a reason ---------- */
R18.FACETS=[["process","Process","plat_proc"],["data","Data","r18_access"],["metrics","Metrics","metrics"],["maturity","Maturity","r18_mature"],["risk","Risk and debt","r18_debt"],["security","Security and access","adm_sec"],["controls","Controls","plat_gate"],["ops","Operations","svc_notify"]];
R18.facets=id=>{const a=R18.app(id);if(!a)return[];const c=R18.conf(id),m=R18.meta(id),pr=R18.process(id),mt=R18.maturity(id),dt=R18.debt(id),me=R18.metrics(id);
 const ac=G(()=>R18.access.stateOf(id),{ok:true,pending:0,n:0});
 const chk=ks=>ks.map(k=>(c.rows.find(r=>r.id===k)||{r:"pass"}).r);
 const worst=rs=>rs.includes("fail")?"missing":rs.includes("warn")?"drafted":"active";
 const done=a.status==="certified"||a.status==="review"||m.confirmed;
 const F={};
 F.process={s:done?"active":"drafted",d:pr.steps.length+" steps: "+pr.counts.human+" person, "+pr.counts.auto+" automatic, "+pr.counts.ai+" AI, "+pr.counts.gate+" gate"+(done?"":". Generated; the owner confirms it.")};
 F.data={s:!arr(a.reads).length&&!arr(a.newEnts).length?"active":ac.ok?"active":ac.n?"drafted":"missing",d:arr(a.reads).length?(ac.ok?"All "+arr(a.reads).length+" data sources approved":ac.n?ac.pending+" of "+ac.n+" access requests waiting":"Needs access to "+arr(a.reads).length+" sources; none requested"):"Uses no enterprise data"};
 F.metrics={s:done?"active":"drafted",d:me.length+" metrics with formulas, targets and a rule for acting on the trend"};
 F.maturity={s:mt.lvl>=3?"active":"drafted",d:"Level "+mt.lvl+" of 5, target "+mt.tgt+(mt.next.length?"; next: "+mt.next[0]:"")};
 F.risk={s:dt.some(d=>d.sev==="High")?"missing":dt.length?"drafted":"active",d:dt.length?dt.length+" open debt "+(dt.length===1?"item":"items")+", "+dt.filter(d=>d.sev==="High").length+" high":"No open debt"};
 F.security={s:worst(chk(["auth","secrets","labels","aigw"]).concat(ac.ok?[]:["warn"])),d:c.fail?c.fail+" gate checks failing":c.warn?c.warn+" gate warnings":"All gate checks pass"};
 const kill=R18.kill.on(id);
 F.controls={s:m.owner&&m.backup&&a.sunset?(R18.kill.tested(id)?"active":"drafted"):"missing",d:(m.owner?"Owner "+m.owner:"No owner")+(m.backup?", backup "+m.backup:", no backup")+(a.sunset?", review "+fD(a.sunset):", no review date")+(kill?". Kill switch is ON.":"")};
 F.ops={s:worst(chk(["notify"])),d:(arr(a.connectors).length?arr(a.connectors).length+" connector"+(arr(a.connectors).length>1?"s":"")+", ":"")+(a.m.ownNotify||a.m.ownReport?"own messages and reports (should use the platform)":"platform notifications, reporting and audit")};
 return R18.FACETS.map(f=>Object.assign({k:f[0],label:f[1],go:f[2]},F[f[0]]))};
R18.coverage=id=>{const f=R18.facets(id);if(!f.length)return 0;return Math.round(100*f.reduce((s,x)=>s+(x.s==="active"?1:x.s==="drafted"?.5:0),0)/f.length)};
R18.stateText={active:"Active",drafted:"Drafted",missing:"Missing"};
R18.stateClass={active:"good",drafted:"warn",missing:"bad"};

/* ---------- portfolio totals used by lenses ---------- */
R18.portfolio=()=>{const L=R18.apps().filter(a=>a.status!=="sunset");const rows=L.map(a=>{const v=R18.value(a.id);return{a,v,cov:R18.coverage(a.id),m:R18.meta(a.id),mt:R18.maturity(a.id)}});
 const sum=k=>rows.reduce((s,r)=>s+r.v[k],0);return{rows,n:rows.length,hours:sum("hours"),gross:sum("gross"),cost:sum("cost"),net:sum("net"),cov:rows.length?Math.round(rows.reduce((s,r)=>s+r.cov,0)/rows.length):0,
  ai:rows.filter(r=>arr(r.a.ai).length).length,aiDirect:rows.filter(r=>arr(r.a.ai).some(x=>!x.gw)).length,unlinked:rows.filter(r=>!r.m.obj).length,noOwner:rows.filter(r=>!r.m.owner||!r.m.backup).length,
  scaleReady:rows.filter(r=>R18.scale(r.a.id).ready).length,users:rows.reduce((s,r)=>s+(r.a.users||0),0)}};
})();
