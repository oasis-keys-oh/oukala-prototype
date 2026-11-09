/* ---------- M2M evaluation and approval routing ---------- */
function pfields(p){const toks=(p.fields||"").split(/[,;]+/).map(s=>s.trim()).filter(Boolean);return toks.map(t=>{let hit=null;p.ents.forEach(en=>{const e=ent_(en);if(!e||hit)return;const f=e.fields.find(f=>f.k===t||f.label.toLowerCase()===t.toLowerCase());if(f)hit={ent:en,k:f.k}});return{tok:t,hit}})}
const activeConns=()=>F.conns.filter(c=>c.kind!=="roadmap"&&c.status!=="expired");
function evaluate(p){
 const pf=pfields(p),unknown=pf.filter(x=>!x.hit),metas=pf.filter(x=>x.hit).map(x=>Object.assign({ent:x.hit.ent,k:x.hit.k},eff(x.hit.ent,x.hit.k)));
 const missEnt=p.ents.filter(e=>!ent_(e)),conflict=p.dir==="Out"?metas.filter(m=>m.auth==="external"):metas.filter(m=>m.auth==="platform");
 const sens=metas.filter(m=>m.cls==="personal"||m.cls==="restricted"),conf=metas.filter(m=>m.cls==="confidential");
 const ck=[];
 ck.push(unknown.length||missEnt.length?{k:"contract",n:"Contract fit against the registry",st:"fail",d:(unknown.length?unknown.length+" field"+(unknown.length>1?"s":"")+" not in the registry ("+unknown.map(u=>u.tok).join(", ")+"). Propose them in the registry first. ":"")+(missEnt.length?"Unknown entity: "+missEnt.join(", ")+".":"")}
  :conflict.length?{k:"contract",n:"Contract fit against the registry",st:"warn",d:"All "+metas.length+" fields exist. "+conflict.length+" field"+(conflict.length>1?"s":"")+" ("+conflict.slice(0,3).map(m=>m.k).join(", ")+") "+(p.dir==="Out"?"are owned by an external system, so the push would be ignored":"are owned by Oukala, so the feed would be a suggestion, not an overwrite")+". Change authority or direction."}
  :{k:"contract",n:"Contract fit against the registry",st:"pass",d:"All "+metas.length+" fields exist and the direction matches their declared authority."});
 ck.push(p.dir!=="In"&&sens.length?{k:"security",n:"Security review",st:"fail",d:"Restricted or personal fields ("+sens.map(m=>m.k).join(", ")+") may not be pushed to an external system without a data council exception."}
  :sens.length?{k:"security",n:"Security review",st:"warn",d:sens.length+" restricted or personal field"+(sens.length>1?"s":"")+": masking rules, a per-connector service identity and a data council decision are required."}
  :conf.length?{k:"security",n:"Security review",st:"warn",d:conf.length+" confidential field"+(conf.length>1?"s":"")+": ABAC masking applies to non-owners. Secret held as a vault reference; least-privilege scopes only."}
  :{k:"security",n:"Security review",st:"pass",d:"Internal data only. Secret held as a vault reference, per-connector service identity, read scopes only, audit on every run."});
 const rate=97+(hs(p.id)%4)-(unknown.length?7:0)-(p.ctype==="Other (custom code)"?5:0);
 ck.push({k:"sandbox",n:"Sandbox sample test",st:rate>=95?"pass":"fail",d:"A 200 record sample ran in the sandbox: "+rate+"% passed validation"+(rate>=95?" (the bar is 95%).":", below the 95% bar. Failures are listed in quarantine for the sandbox run.")});
 const runsMo=Math.ceil(p.vol/(p.len==="temporary"?250:500))*30,left=ED[F.edition].runs-F.usage,slots=ED[F.edition].conn-activeConns().length;
 ck.push({k:"cost",n:"Cost estimate",st:slots<=0?"warn":"pass",d:"About "+runsMo.toLocaleString()+" runs a month ("+p.vol.toLocaleString()+" records a day) and one connector slot. "+(slots<=0?"No slot is free in the "+ED[F.edition].n+" edition; approval needs a larger license.":slots+" slot"+(slots>1?"s":"")+" free and "+left.toLocaleString()+" runs left this month.")+" Estimated run cost $"+Math.max(8,Math.round(runsMo*0.011))+" a month."});
 const rc=(window.PLAT&&PLAT.reuseCheck?PLAT.reuseCheck(p.t,p.fields+" "+p.purpose):[]).filter(h=>h.kind==="existing"&&h.sc>=.5&&!p.ents.includes(h.id)).slice(0,2);
 const same_=activeConns().filter(c=>c.id!==p.conn&&c.fromProject!==p.id&&c.ents.some(e=>p.ents.includes(e))&&p.systems.some(s=>c.sys.toLowerCase().split(/[^a-z0-9]+/).some(w=>w.length>3&&s.toLowerCase().includes(w))));
 const over=activeConns().filter(c=>c.id!==p.conn&&c.fromProject!==p.id&&c.ents.some(e=>p.ents.includes(e)));
 ck.push(p.dup?{k:"dup",n:"Duplicate check",st:"fail",d:p.dup+"."}:same_.length?{k:"dup",n:"Duplicate check",st:"fail",d:same_[0].name+" already connects to this system and feeds "+p.ents.join(", ")+". Extend it instead of building another."}
  :over.length||rc.length?{k:"dup",n:"Duplicate check",st:"warn",d:(over.length?over.map(c=>c.name).join(", ")+" already feed"+(over.length>1?"":"s")+" the same entity from another system. Precedence rules are needed. ":"")+(rc.length?"Registry reuse check also matches "+rc.map(h=>h.label+" ("+Math.round(h.sc*100)+"%)").join(", ")+".":"")}
  :{k:"dup",n:"Duplicate check",st:"pass",d:"No existing connector feeds these entities from this system, and the registry reuse check found no close match."});
 const fails=ck.filter(c=>c.st==="fail").length;
 return{checks:ck,at:dayS(0),rec:fails?"Reject":p.len==="temporary"?"Approve project-scoped":"Approve certified",fails,warns:ck.filter(c=>c.st==="warn").length,sens:sens.length,cls:metas.reduce((m,x)=>PLAT.CLS_ORDER.indexOf(x.cls)>PLAT.CLS_ORDER.indexOf(m)?x.cls:m,"public")}}
function routeOf(p,ev){
 const certType=["Generic REST","MCP","Identity provider","Microsoft Graph"].includes(p.ctype),pi=["public","internal"].includes(ev.cls);
 if(ev.fails)return{k:"std",n:"Platform team and security",who:"Platform team and security",sla:"3 days",why:"A failed check always needs a person, whatever the risk."};
 if(p.risk==="High"||ev.sens)return{k:"council",n:"Data council",who:"Data council",sla:"5 days",why:(p.risk==="High"?"High risk":"Sensitive data ("+ev.cls+")")+" goes to the data council."};
 if(p.risk==="Low"&&p.dir==="In"&&pi&&certType)return{k:"auto",n:"Auto-approve",who:"Rules engine",sla:"Instant",why:"Low risk, read-only, internal data, certified connector type."};
 return{k:"std",n:"Platform team and security",who:"Platform team and security",sla:"3 days",why:"Standard risk: "+(p.risk!=="Low"?p.risk.toLowerCase()+" risk":p.dir!=="In"?"writes to an external system":!pi?"data class "+ev.cls:"custom connector type")+"."}}
const ROUTES=[["auto","Auto-approve","Low risk AND read-only AND internal or public data AND a certified connector type (REST, MCP, identity, Graph) AND no failed check.","--good-f"],["std","Platform team plus security","Anything that is not low risk, or writes outward, or uses confidential data, or has a failed check.","--info-f"],["council","Data council","High risk, or any restricted or personal data. Five business days.","--warn-f"]];
const routePill=r=>pill(r.n,r.k==="auto"?"good":r.k==="council"?"warn":"info");
const CTYPES=["Generic REST","MCP","Identity provider","Microsoft Graph","Other (custom code)"];
function mkConnFromProject(p,kind,expiry){
 const id="c_"+p.id.toLowerCase().replace(/-/g,"");const k={"Generic REST":"rest",MCP:"mcp","Identity provider":"idp","Microsoft Graph":"graph"}[p.ctype]||"rest";
 const c={id,name:p.t,kind:k,tier:kind==="certified"?"certified":"project",status:"new",owner:p.owner,min:"fabric",env:"Production",ents:p.ents.slice(),canStream:false,lag:3600,sys:p.systems.join(", "),risk:p.risk,desc:p.purpose,auth:A(["read"],"Set at go-live","pending","vault://atlantic-prod/fabric/"+p.id.toLowerCase()+" (created at go-live)","svc-fabric-"+p.id.toLowerCase()),expiry:expiry||undefined,fromProject:p.id};
 F.conns.splice(F.conns.findIndex(x=>x.kind==="roadmap"),0,c);
 pfields(p).filter(x=>x.hit).forEach(x=>F.maps.push({id:"MP-"+(100+F.maps.length),conn:id,src:x.tok,srcType:"string",ent:x.hit.ent,k:x.hit.k,tf:"As is",conf:.82,status:"proposed",lag:3600,em:null,ver:1,ai:true}));
 return c}
function decide(p,kind,expiry,reasons){
 if(kind!=="rejected"&&activeConns().length>=ED[F.edition].conn){toast("No free connector slot in the "+ED[F.edition].n+" edition","warn");unlockDrawer("The "+ED[F.edition].n+" edition allows "+ED[F.edition].conn+" connectors and all are in use.");return false}
 p.stage=kind;const days=Math.max(1,p.created?Math.round(p.created/2):3);p.outcome={kind,at:dayS(0),by:p.route?p.route.n:"Platform team",days:Math.min(days,12),expiry:expiry||"",reasons:reasons||""};
 if(kind!=="rejected"){const c=mkConnFromProject(p,kind,expiry);p.conn=c.id;audit("Fabric connector approved",p.id+" as "+(kind==="certified"?"certified":"project-scoped until "+expiry));toast(kind==="certified"?"Approved as certified: "+c.name:"Approved, project-scoped until "+expiry,"good")}
 else{audit("Fabric M2M project rejected",p.id+": "+(reasons||"").slice(0,80));toast("Rejected with reasons recorded","warn")}
 const rq=F.reqs.find(r=>r.ref===p.id);if(rq)rq.state="Decided";return true}
function expireConn(c){c.status="expired";c.lag=0;if(!F.wi.find(w=>w.ref===c.id)){F.wi.unshift({id:"WI-"+(F.seq.wi++),t:"Decommission "+c.name,sub:"Expired "+c.expiry+"; revoke the secret, remove mappings, archive runs",who:c.owner,due:dayS(7).slice(0,6),st:"open",ref:c.id})}
 audit("Fabric connector expired",c.name+": decommission task created")}
function sweepExpiry(){F.conns.forEach(c=>{if(c.tier==="project"&&c.expiry&&c.status!=="expired"){if(c.expiry<=isoDay(0))expireConn(c);else{const d=Math.round((Date.parse(c.expiry)-Date.parse(isoDay(0)))/86400000);if(d<=30&&c.status==="healthy")c.status="expiring"}}})}
/* ---------- derived numbers, metrics ---------- */
const conn=id=>F.conns.find(c=>c.id===id);
const EDO={core:0,fabric:1,enterprise:2};
const allowed=c=>EDO[F.edition]>=EDO[c.min]&&c.min!=="enterprise";
const live=c=>c&&c.kind!=="roadmap"&&c.status!=="expired";
const apprMaps=()=>F.maps.filter(m=>m.status==="approved"&&live(conn(m.conn)));
const fedCount=id=>new Set(F.maps.filter(m=>m.conn===id&&m.status==="approved").map(m=>m.ent+"."+m.k)).size;
function slaStats(){const a=apprMaps().filter(m=>eff(m.ent,m.k).auth!=="platform");let ok=0;const miss=[];a.forEach(m=>{const t=FR[eff(m.ent,m.k).fresh].s,lg=m.lag==null?conn(m.conn).lag:m.lag;if(lg<=t)ok++;else miss.push({m,t,lg})});return{n:a.length,ok,pct:a.length?Math.round(100*ok/a.length):100,miss}}
function covStats(){const es=new Set();activeConns().filter(c=>c.min!=="core").forEach(c=>c.ents.forEach(e=>es.add(e)));let tot=0,cov=0;const cv=new Set(apprMaps().map(m=>m.ent+"."+m.k));
 PLAT.fieldsAll().forEach(f=>{if(!es.has(f.ent))return;const m=eff(f.ent,f.k);if(m.auth==="platform")return;tot++;if(cv.has(f.ent+"."+f.k))cov++});return{tot,cov,pct:tot?Math.round(100*cov/tot):100}}
const qOpen=()=>F.quar.filter(q=>q.status==="open");
const rOpen=()=>F.recon.filter(r=>r.status!=="resolved");
function cycle(){const d=F.proj.filter(p=>p.outcome&&p.outcome.days);return d.length?Math.round(10*d.reduce((a,p)=>a+p.outcome.days,0)/d.length)/10:0}
Object.assign(METRICS,{
 m_fab_fresh:{n:"Fabric freshness SLA met",f:"Mapped fields whose observed sync lag is within their freshness target ÷ all approved mapped fields × 100",u:"%",cur:90,tgt:95,badAt:85,dir:"max",max:100,tr:[96,95,95,94,93,92,91,90],owner:"Platform team",use:["Integration fabric","Field authority"],rem:{kind:"agent",ref:"AG-FAB1",title:"Move a polled field to the event stream, or relax its target",agent:"Integration Agent",auto:false,state:"idle",prog:"Compares each field's target with the connector's real lag and proposes the cheaper fix"}},
 m_fab_quar:{n:"Quarantine backlog",f:"Records in quarantine waiting for a fix or replay (dead letters not counted)",u:"",cur:7,tgt:5,badAt:15,dir:"min",max:30,tr:[3,4,6,5,8,9,8,7],owner:"Data stewards",use:["Integration fabric","Runs and quarantine"],rem:{kind:"sop",ref:"SOP-742",title:"Fix and replay a quarantined record",agent:"Integration Agent",auto:false,state:"idle",prog:"Suggests the corrected value and replays when the steward approves"}},
 m_fab_cov:{n:"Field mapping coverage",f:"External and shared fields, in entities that have a connector, with an approved mapping ÷ all such fields × 100",u:"%",cur:40,tgt:70,badAt:40,dir:"max",max:100,tr:[22,26,29,31,34,36,38,40],owner:"Platform team",use:["Integration fabric","Mapping studio"],rem:{kind:"agent",ref:"AG-FAB2",title:"Propose mappings for uncovered fields",agent:"Integration Agent",auto:false,state:"idle",prog:"Proposes source to target mappings with confidence for human approval"}},
 m_fab_m2m:{n:"M2M evaluation cycle time",f:"Σ(decision date − proposal date) ÷ decided machine-to-machine projects",u:"d",cur:5.3,tgt:5,badAt:10,dir:"min",max:15,tr:[9,8,8,7,6,6,5.5,5.3],owner:"Platform team",use:["Integration fabric","M2M projects"],rem:{kind:"sop",ref:"SOP-743",title:"Triage a machine-to-machine proposal",agent:"Integration Agent",auto:false,state:"idle",prog:"Runs the five checks the moment a project is proposed"}},
 m_fab_recon:{n:"Open reconciliation differences",f:"Differences between Oukala and an external value on shared fields that no one has resolved",u:"",cur:8,tgt:5,badAt:15,dir:"min",max:30,tr:[2,3,5,4,6,7,8,8],owner:"Field stewards",use:["Integration fabric","Reconciliation"],rem:{kind:"kb",ref:"KB0743",title:"Choosing which side wins on a shared field",agent:"Integration Agent",auto:false,state:"idle",prog:"Drafts a recommendation using trust score and who edited last"}}});
function syncMetrics(){const s=slaStats(),c=covStats();METRICS.m_fab_fresh.cur=s.pct;METRICS.m_fab_quar.cur=qOpen().length;METRICS.m_fab_cov.cur=c.pct;METRICS.m_fab_m2m.cur=cycle();METRICS.m_fab_recon.cur=rOpen().length}
/* ---------- sample runs ---------- */
function newRun(c,o){F.seq.run++;const r=Object.assign({id:"RUN-"+F.seq.run,conn:c.id,mode:c.lag<=300?"Real-time":"Batch",at:tsAgo(0),min:0,dur:2+(hs(c.id+F.seq.run)%9),read:0,valid:0,quar:0,loaded:0,held:0,kept:0,same:0,events:0,status:"ok",env:c.env==="Sandbox"?"Sandbox":"Production",retries:0,err:"",idem:"idem-"+(hs(c.id+F.seq.run)*7919).toString(16),kind:"sample"},o);F.runs.unshift(r);return r}
function runSample(id){
 const c=conn(id);if(!c)return;
 if(!allowed(c)){unlockDrawer("Running "+c.name+" is part of the Fabric edition. Core runs only the built-in jobs.");return}
 if(c.status==="expired"){toast("This connector expired. It cannot run; follow its decommission task.","bad");return}
 if(c.id==="c_mcp_reg"){const run=newRun(c,{mode:"Request",read:1,valid:1,loaded:0,events:0,kind:"mcp call"});F.usage++;F.lastSample[id]={expose:true,run:run.id,at:run.at};audit("Fabric MCP sample call","registry.get_entity project_task by Planning Agent");toast("Sample call served with masking applied","good");connDrawer(id);render();return}
 if(!SAMPLES[id]){toast("No sample dataset yet. The owner adds one in the sandbox step.","warn");return}
 const sandbox=c.tier==="community"||c.env==="Sandbox",r=pipeline(id,sandbox,!sandbox);
 const run=newRun(c,{read:r.read,valid:r.read-r.quar.length,quar:r.quar.length,loaded:sandbox?0:r.loaded,held:sandbox?0:r.held,kept:r.kept,same:r.same,events:sandbox?0:r.events.length,status:r.quar.length?"partial":"ok",wouldLoad:sandbox?r.loaded:0});
 F.usage++;
 if(!sandbox){r.quar.forEach(q=>{F.quar=F.quar.filter(x=>!(x.rec===q.rec&&x.k===q.k&&x.conn===id&&x.status==="open"));F.quar.unshift({id:"Q-"+(F.seq.q++),conn:id,ent:q.ent,rec:q.rec,k:q.k,val:q.val==null?"":String(q.val),reason:q.reason,at:tsAgo(0),status:"open",attempts:0,run:run.id,raw:q.row,ctx:q.ctx})});
  r.recon.forEach(x=>{if(!F.recon.find(y=>y.ent===x.ent&&y.rec===x.rec&&y.k===x.k&&y.status!=="resolved"))F.recon.unshift({id:"REC-"+(F.seq.rec++),ent:x.ent,rec:x.rec,label:x.label,k:x.k,plat:String(x.plat),ext:String(x.ext),conn:id,at:tsAgo(0),min:0,status:"open",wi:null,how:""})});
  r.events.forEach(e=>F.events.unshift(mkEvent(e.ent,e.k,e.rec,String(e.old),String(e.nw),id,0,e.type)))}
 F.lastSample[id]={run:run.id,sandbox,r:{read:r.read,quar:r.quar.length,loaded:r.loaded,held:r.held,kept:r.kept,same:r.same,events:r.events.length,rows:r.rows,notes:r.notes},at:run.at,unused:F.maps.filter(m=>m.conn===id&&(sandbox?m.status==="rejected":m.status!=="approved")).length};
 audit("Fabric sample run",c.name+": read "+r.read+", quarantined "+r.quar.length+", "+(sandbox?"sandbox, nothing written":"loaded "+r.loaded));
 toast(sandbox?"Sandbox run finished, nothing was written":"Run finished: "+r.loaded+" loaded, "+r.quar.length+" quarantined","good");
 connDrawer(id);render()}
function lineage(r){const merged=r.loaded+r.held+(r.kept||0)+(r.same||0);return[
 ["Extract","--p4",r.read+" records read"+(r.mode==="Real-time"?" from the event stream":r.mode==="Request"?" by a request":" in a batch")],
 ["Validate against contract","--good-f",r.valid+" passed, "+r.quar+" to quarantine"],
 ["Transform","--accent",r.valid+" mapped to registry fields"],
 ["Match and merge","--warn-f",merged+" field changes checked: "+r.loaded+" load, "+r.held+" held for reconciliation"+(r.kept?", "+r.kept+" kept by platform authority":"")],
 ["Load","--good-f",r.env==="Sandbox"?"Sandbox: nothing written (would load "+(r.wouldLoad||0)+")":r.loaded+" written, each with an idempotency key"],
 ["Publish change event","--accent",(r.events||0)+" canonical events sent to subscribers"]]}
