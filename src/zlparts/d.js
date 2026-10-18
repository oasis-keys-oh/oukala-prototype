
/* ---------- graph: connected records and reverse links ---------- */
let _gr=null,_grV="";
function graph(){const v=uniVersion();if(_gr&&_grV===v)return _gr;_grV=v;const out=new Map(),inn=new Map();
 relations().forEach(r=>{if(r.kind==="entity"||r.kind==="edge"||r.kind==="screen")return;let rows=[];try{rows=r.rows()}catch(e){}
  rows.forEach(([f,t])=>{f=String(f).split("/")[0];if(t==null||t===""||String(t)===f)return;t=String(t);const U=universe();if(!U.has(f))return;
   let tt=t;if(!U.has(tt)){const s=SVCREG.find(x=>lc(x.n)===lc(t));if(s)tt=s.id;else return}
   (out.get(f)||out.set(f,[]).get(f)).push({rel:r.name,id:tt});(inn.get(tt)||inn.set(tt,[]).get(tt)).push({rel:r.name,id:f})})});
 return _gr={out,inn}}
function openRec(id){id=String(id);const u=universe().get(id);if(!u)return false;
 try{
  if(u.t==="person"){person360(u.id);return true}
  if(u.t==="record"){recDrawer(u.id);return true}
  if(u.t==="invoice"){go("inv",u.id);return true}
  if(u.t==="metric"){go("metrics",u.id);return true}
  if(u.t==="process"){PROCLIB.open(u.id);return true}
  if(u.t==="workflow"){FLOWX.open(u.id);return true}
  if(u.t==="meeting"&&window.MEETX){MEETX.open(u.id);return true}
  if(u.t==="demand"&&window.demandDrawer){demandDrawer(u.id);return true}
  if(u.t==="task"&&window.taskDrawer){taskDrawer(u.id);return true}
  if(u.t==="service"&&window.openService360){openService360(u.alias?(SVCREG.find(s=>s.n===u.id)||{}).id:u.id);return true}
 }catch(e){}
 /* fall back to the search index, which holds an opener for every searchable record */
 let hit=null;G(()=>searchIndex().some(r=>{if(String(r.t||"").split(" ")[0]===id){hit=r;return true}}),0);if(hit&&hit.f){hit.f();return true}
 return false}
function connected(id){id=String(id);const g=graph(),U=universe();const grp={};
 const push=(dir,x)=>{const t=U.get(x.id);if(!t)return;const key=(dir==="out"?"Points to: ":"Referenced by: ")+(TYPEN[t.t]||t.t);(grp[key]=grp[key]||[]).push({id:x.id,t:t.label,sub:x.rel,tag:x.id,st:"info",go:()=>openRec(x.id)})};
 arr(g.out.get(id)).forEach(x=>push("out",x));arr(g.inn.get(id)).forEach(x=>push("in",x));
 return Object.keys(grp).sort().map(k=>({key:k,label:k,rows:grp[k]}))}
let _drT=0;
let _hint=null;
function connPanel(){const d=document.getElementById("drawer");if(!d||!d.innerHTML||d.querySelector("[data-zl-conn]"))return;const hint=_hint;_hint=null;
 const head=(d.querySelector("h2,h1")||{}).textContent||"";const txt=(d.innerText||"").slice(0,500);let id=null;const U=universe();
 if(U.has(head.trim())&&U.get(head.trim()).t==="person")id=head.trim();
if(!id&&hint&&U.has(hint)&&(graph().out.has(hint)||graph().inn.has(hint)))id=hint;
 if(!id){const toks=txt.match(/\b([A-Z]{2,5}-?\d{2,6}|PR\d|m_[a-z0-9_]+|[A-Z]\d{1,3})\b/g)||[];id=toks.find(t=>U.has(t)&&U.get(t).t!=="person"&&(graph().out.has(t)||graph().inn.has(t)))||null}
 if(!id)return;const groups=connected(id);if(!groups.length)return;const n=groups.reduce((a,g)=>a+g.rows.length,0);const lid="zl_"+id.replace(/\W/g,"_");
 const sec=document.createElement("section");sec.setAttribute("data-zl-conn",id);sec.className="zl-conn";
 sec.innerHTML=`<h3>Connected records <span class="pill mute">${n}</span></h3><p class="muted small">Every record that points to ${H(id)} or that it points to, from the cross-module relations. Source: Connections and gaps.</p>${lrHTML({id:lid,groups,limit:5,search:true})}`;
 d.appendChild(sec)}
function hookOpeners(){if(NOFIX)return;["recDrawer","person360"].forEach(n=>{const f=window[n];if(typeof f!=="function"||f.__zl)return;const w=function(a){_hint=a==null?null:String(a);return f.apply(this,arguments)};w.__zl=1;window[n]=w})}
function watchDrawer(){if(NOFIX)return;hookOpeners();const d=document.getElementById("drawer");if(!d||d.__zl)return;d.__zl=1;new MutationObserver(()=>{clearTimeout(_drT);_drT=setTimeout(()=>G(connPanel),120)}).observe(d,{childList:true})}

/* ---------- fixes ---------- */
const FIXLOG=(id,what,n,state)=>{Z.log=Z.log.filter(x=>x.id!==id);Z.log.push({id,what,n,state:state||"applied",at:TODAY})};
const REFMAP={service:"business_service",ci:"cmdb_ci",configuration_item:"cmdb_ci",caller:"person",requested_for:"person",assigned_to:"person",owner:"person",manager:"person",approver:"person",opened_by:"person",requester:"person",created_by:"person",assignee:"person",sponsor:"person",resolved_by:"person",closed_by:"person",project:"project",task:"project_task",problem:"problem_record",change:"change_request",incident:"incident",vendor:"core_company",company:"core_company",invoice:"invoice",knowledge_article:"knowledge_article",kb:"knowledge_article",objective:"objective",capability:"maturity_capability",policy:"policy",contract:"ast_contract",demand:"demand_request",department:"cost_center",cost_center:"cost_center"};
function fixRefs(){const T=G(()=>DATAMODEL.tables,{});let n=0,un=0;const ids=Object.keys(T);
 ids.forEach(t=>arr(T[t].fields).forEach(f=>{if(f.type!=="ref"||f.ref)return;const k=lc(f.k).replace(/_(id|ref)$/,"");let tg=REFMAP[k]||(T[k]?k:null);
  if(!tg&&/^parent/.test(k))tg=t;if(!tg){const m=ids.filter(x=>x!==t&&x.indexOf("cmdb_ci_")!==0&&(x===k||x.endsWith("_"+k)));if(m.length===1)tg=m[0]}
  if(tg&&(T[tg]||tg===t)){f.ref=tg;f.refBy="Connectivity audit, steward to confirm";n++}else un++}));
 G(()=>PLAT.refresh());FIXLOG("fx_ref","Declared the target entity on reference fields",n,un?"partial: "+un+" left for the steward":"applied");return n}
const RUNTIME=["automatic","anyone","any user","any admin","workflow engine","inbox","claude","claude sonnet","requester","sponsor","implementer","approvers","approver","the executive","subject matter expert","drawing studio","process library","discovery sources","organizer","secretary","carrier","approver rule","policy"];
const ABBR={ceo:"chief executive",cio:"chief information",cfo:"chief financial",coo:"chief operating",cto:"chief technology",pmo:"portfolio project management",hr:"people",cmdb:"configuration",tbm:"technology business management",kcs:"knowledge"};
const expand=t=>norm(t).split(" ").map(w=>ABBR[w]||w).join(" ");
function fixAliases(){const dl=deadLinks().out.filter(d=>d.kind==="actor"||d.kind==="person");const seen=new Set();let n=0,rt=0;
 const people=arr(G(()=>ORGX.people,[]));const doms=arr(G(()=>ORGX.domains,[]));
 uniq(dl.map(d=>d.ref)).forEach(ref=>{const k=norm(ref);if(!k||seen.has(k))return;seen.add(k);
  if(RUNTIME.includes(k)){Z.alias.push({k,text:ref,to:"Resolved at run time",conf:100,via:"runtime role"});rt++;return}
  const w=toks(expand(ref));if(!w.length)return;
  let best=null,bs=0;doms.forEach(d=>{const hay=new Set(toks([d.label].concat(d.aliases||[]).join(" ")));let c=0;w.forEach(x=>{if(hay.has(x))c++});const s=c/w.length;if(s>bs){bs=s;best=d}});
  let bp=null,ps=0;people.forEach(p=>{const hay=new Set(toks(p.title));let c=0;w.forEach(x=>{if(hay.has(x))c++});const s=c/w.length;if(s>ps){ps=s;bp=p}});
  if(bp&&ps>=.67&&ps>=bs){Z.alias.push({k,text:ref,to:bp.name,conf:Math.round(ps*100),via:"title"});n++;return}
  if(best&&bs>=.5){best.aliases=best.aliases||[];if(!best.aliases.includes(ref))best.aliases.push(ref);Z.alias.push({k,text:ref,to:best.label,conf:Math.round(bs*100),via:"domain"});n++}});
 _actors=null;Z.dlRev=(Z.dlRev||0)+1;const left=uniq(deadLinks().out.filter(d=>d.kind==="actor"||d.kind==="person").map(d=>d.ref)).length;
 FIXLOG("fx_alias","Registered role names as resolvers (accountability domain, title, or run-time role)",n+rt,left?"partial: "+left+" names resolve to nobody":"applied");return n+rt}
function fixMetricUse(){const names=SCREENS.map(s=>s[1]);let n=0,left=0;
 Object.keys(METRICS).forEach(k=>{const m=METRICS[k];if(!Array.isArray(m.use))return;m.use=m.use.map(u=>{if(resolves("screen",u))return u;const w=toks(u);let b=null,bs=0;names.forEach(nm=>{const h=new Set(toks(nm));let c=0;w.forEach(x=>{if(h.has(x))c++});const s=c/Math.max(1,w.length);if(s>bs||(s===bs&&b&&nm.length<b.length)){bs=s;b=nm}});if(b&&bs>=.99){n++;return b}left++;return u})});
 Z.dlRev=(Z.dlRev||0)+1;FIXLOG("fx_metricuse","Repointed metric 'used on' names that matched a renamed screen",n,left?"partial: "+left+" names match no screen":"applied");return n}
function fixStepIO(){const defs=G(()=>PROC.defs,{});let n=0;
 G(()=>PROCLIB.list()).forEach(p=>{const d=defs[p.id];if(!d||!Array.isArray(d.steps))return;const st=d.steps;st.forEach((s,i)=>{if(!s.in&&i>0&&st[i-1].out){s.in=st[i-1].out;s.inInferred=1;n++}if(!s.out&&i<st.length-1&&(st[i+1].in||st[i+1].n)){s.out=st[i+1].in||st[i+1].n;s.outInferred=1;n++}})});
 G(()=>PROCLIB.refresh());FIXLOG("fx_stepio","Filled step inputs and outputs from the neighboring step (flagged inferred)",n,"partial: first and last steps need the real source and result");return n}
function roleToPerson(n){const t=norm(String(n).replace(/^the\s+/i,""));if(!t)return null;const e=expand(t);
 let d=DIR.find(x=>norm(x.name)===t);if(d)return d.name;d=DIR.find(x=>x.kind==="human"&&(norm(x.role)===t||norm(x.role)===e));if(d)return d.name;
 const p=arr(G(()=>ORGX.people,[])).find(x=>x.kind!=="agent"&&(norm(x.title)===t||norm(x.title)===e));return p&&DIR.some(x=>norm(x.name)===norm(p.name))?p.name:null}
function fixPeople(){if(window.who&&window.who.__zlp)return 0;const ow=window.who,op=window.person360;if(typeof ow!=="function")return 0;
 const w=function(a){const r=ow.apply(this,arguments);if(r||typeof a!=="string")return r;const t=roleToPerson(a);return t&&t!==a?ow.call(this,t):r};w.__zlp=1;window.who=w;
 if(typeof op==="function"){const p=function(a){if(typeof a==="string"&&!ow(a)){const t=roleToPerson(a);if(t)arguments[0]=t}return op.apply(this,arguments)};p.__zlp=1;window.person360=p}
 FIXLOG("fx_people","Person chips that name a role (Chief Editor, the CEO) now open the person who holds the role",2,"applied");return 2}
function fixWfService(){const fl=G(()=>FLOWX.flows(),[]);const by={};fl.forEach(f=>{if(f.service&&f.table){(by[f.table]=by[f.table]||{})[f.service]=(by[f.table][f.service]||0)+1}});let n=0;
 fl.forEach(f=>{if(!f.service&&f.table&&by[f.table]){const s=Object.keys(by[f.table]).sort((a,b)=>by[f.table][b]-by[f.table][a])[0];f.service=s;n++}});
 const un=fl.filter(f=>!f.service).length;FIXLOG("fx_wfsvc","Set the service on workflows from the table they work on",n,un?"partial: "+un+" have no table":"applied");return n}
function fixFlows(){if(!G(()=>MODMAP.addFlows,0))return 0;const have=new Set(MODMAP.flows.map(f=>f.from+">"+f.to));const ids=new Set(MODMAP.modules.map(m=>m.id));const src=ids.has("inv")?"inv":null;let n=0;
 const add=[];IP_EXP.forEach(e=>{if(src&&ids.has(e[0])&&!have.has(src+">"+e[0])&&e[0]!=="inbox")add.push({from:src,to:e[0],data:"Invoice decision: "+e[1].toLowerCase(),entity:"invoice",mode:"event",trig:"Invoice approved, held or rejected"})});
 if(add.length){const r=G(()=>MODMAP.addFlows(add),null);n+=add.length}
 /* attach an entity to flows that carry text but name none */
 const nd=MODMAP.flows.filter(f=>!arr(f.refs).length&&f.data);let m=0;
 nd.forEach(f=>{const h=G(()=>PLAT.reuseCheck(f.data,""),[]).filter(x=>x.kind==="existing"&&x.sc>=.5)[0];if(h){const e=PLAT.ent(h.id);if(e){f.refs=[{id:e.id,kind:"reg",label:e.label,owner:e.owner,steward:e.steward,cls:e.cls,f:[],by:"Connectivity audit"}];f.partial=true;m++}}});
 G(()=>MODMAP.refresh());FIXLOG("fx_flows","Added invoice fan-out flows and attached an entity to untyped flows",n+m,"applied");return n+m}
function fixLineage(){const A=S.atlas;if(!A||!A.ovr)return 0;const ents=G(()=>PLAT.entities(),[]);let n=0,tot=0;
 G(()=>LIN.all()).filter(t=>t.status==="none").forEach(t=>t.gaps.forEach(g=>{tot++;const w=toks(g.phrase);if(!w.length)return;let best=null,bs=0,tie=false;
  ents.forEach(e=>{if(e.proposed)return;arr(e.fields).forEach(f=>{const hf=new Set(toks(f.label+" "+f.k)),he=new Set(toks(e.label));let c=0;w.forEach(x=>{if(hf.has(x))c+=1;else if(he.has(x))c+=.5});const s=c/w.length;if(s>bs+1e-9){bs=s;best=[e.id,f.k];tie=false}else if(Math.abs(s-bs)<1e-9&&best&&best[0]!==e.id)tie=true})});
  const key=t.id+"|"+norm(g.phrase);if(best&&bs>=.99&&!tie&&!A.ovr[key]){A.ovr[key]={ref:best[0]+"."+best[1],by:"Connectivity audit (proposed, steward to confirm)",at:TODAY,note:"Exact term match, confidence "+Math.round(bs*100)+"%"};n++}}));
const mine=["m_zl_score","m_zl_dead","m_zl_fanout","m_zl_orphans"];
 mine.forEach(id=>{const t=G(()=>LIN.trace(id),null);if(!t)return;t.gaps.forEach(g=>{const key=id+"|"+norm(g.phrase);if(!A.ovr[key]&&PLAT.ent("connectivity_finding")){A.ovr[key]={ref:"connectivity_finding."+(/consumer|updated/i.test(g.phrase)?"state":"check_id"),by:"Connectivity audit",at:TODAY,note:"Own metric, computed from connectivity_finding"};n++}})});
 if(n){G(()=>LIN.bump())}FIXLOG("fx_lineage","Mapped metric terms that match one field exactly",n,"partial: "+(tot-n)+" terms need a steward");return n}

/* inbox adapters */
const grpOf=h=>h<0?"Overdue":h<=24?"Due today":h<=24*7?"This week":"Later";
function mkItem(o){const it=Object.assign({kind:"action",cat:"Work",ic:"task",title:"",req:"",ageH:12,slaH:48,dueH:96,amt:null,risk:"low",why:"",ai:null,guard:"",ev:[],extra:"",can:{approve:false,reject:false,delegate:false},blk:"",rec:"",needNote:false,vendor:"",sim:false,openLabel:"Open",open:()=>{}},o);
 it.group=grpOf(it.dueH);it.urgent=it.dueH<0||it.risk==="high"||it.dueH<4||!!it.flag;it.sc=(it.urgent?0:1)*1e6+({approval:0,action:1,mention:2}[it.kind]||0)*1e4+Math.max(-48,it.dueH);return it}
function dueFromText(t){t=String(t||"");if(/overdue/i.test(t))return -12;let m=t.match(/^(\d+)\s*d/i);if(m)return +m[1]*24;m=t.match(/^(\d+)\s*h/i);if(m)return +m[1];return 96}
function fixInbox(){const A=G(()=>INBOX.adapters,null);if(!A)return 0;
 A.zl_work={key:"zl_work",label:"Assigned work not covered by another adapter",mod:"Connectivity audit (WORK providers)",fn:"WORK.fn(person)",wired:false,
  list(me){const out=[];arr(G(()=>WORK,[])).forEach(w=>{if(HANDLED_RX.test(w.kind)||WK_RX.some(r=>r.test(w.kind)))return;const rows=G(()=>w.fn(me),[])||[];const appr=/approv|gate|request|exception/i.test(w.kind);
   rows.slice(0,6).forEach(r=>out.push(mkItem({id:"zlw:"+w.tag+":"+r.id,src:"zl_work",sid:r.id,kind:appr?"approval":"action",cat:w.kind.replace(/ waiting$/,""),ic:appr?"gate":"task",title:r.t,req:"",dueH:r.due?dueFromText(r.due):120,risk:r.st==="warn"?"med":"low",flag:r.st==="warn",
    why:"Assigned to you in "+w.kind.toLowerCase()+". "+(r.sub||""),guard:"Decide in the owning screen; this module has no approve function the inbox can call.",ev:[["From",w.kind,""],["Detail",r.sub||"",""]],openLabel:appr?"Open to decide":"Open",open:()=>{if(r.go)r.go();else toast("No screen is linked to this item","warn")}})))});return out}};
 A.zl_events={key:"zl_events",label:"Downstream notices",mod:"Connectivity audit (event layer)",fn:"ZLINK.notes",wired:false,
  list(me){return arr(Z.notes).filter(n=>n.to.includes(me)).slice(0,5).map(n=>mkItem({id:"zln:"+n.id,src:"zl_events",sid:n.id,kind:"mention",cat:"Downstream notice",ic:"bell",title:n.t,req:"Event layer",dueH:48,why:"Sent to "+n.to.join(" and ")+" when the decision was recorded.",guard:"Notices are read-only.",ev:[["Event",n.ev,""],["Record",n.rec,""]],open:()=>{if(!openRec(n.rec))go("zl_conn")}}))}};
 G(()=>INBOX.state.fl);Z.fixed.inbox=1;FIXLOG("fx_inbox","Registered inbox adapters for dropped WORK providers and downstream notices",arr(G(()=>WORK,[])).filter(w=>!HANDLED_RX.test(w.kind)&&!WK_RX.some(r=>r.test(w.kind))).length,"applied");return 1}

/* MCP tools */
function fixMcp(){if(!window.MCPX||MCPX.tools.some(t=>t.n==="get_record"))return 0;
 const obj={type:"object"},str={type:"string"};
 const T=(n,d,props,req,ex)=>({n,d,write:false,ex,in:{type:"object",required:req,properties:props},out:obj});
 MCPX.tools.push(T("get_record","Read one record by id (incident, change, project, invoice, person, metric, process, workflow, service and more): label, owner, and connection counts.",{id:str},["id"],{id:"INC0412"}),
  T("list_records","List records of one type with an optional text filter.",{type:{type:"string",enum:Object.keys(TYPEN)},q:str,limit:{type:"integer",default:10,maximum:50}},["type"],{type:"incident",q:"portal",limit:5}),
  T("get_connections","Everything that points to a record or that it points to, with the relation name.",{id:str},["id"],{id:"PR1"}),
  T("list_approvals","List what is waiting for the signed-in person across the inbox adapters (read only; decisions go through the inbox).",{limit:{type:"integer",default:10,maximum:50}},[],{limit:5}),
  T("trace_metric","Trace a metric to the entity fields it is computed from, with gaps.",{metric_id:str},["metric_id"],{metric_id:"m_delivery"}),
  T("get_connectivity","Connectivity audit: counts per check, optionally one area (Data, Process, Workflow, Links, People, Platform, Approvals, Interoperability).",{area:str},[],{area:"Data"}));
 const prev=MCPX.call;
 MCPX.call=function(name,args){args=args||{};
  if(name==="get_record"){const u=universe().get(String(args.id));if(!u)throw new Error("No record "+args.id+". Try list_records.");const g=connected(u.id);return {id:u.id,type:u.t,label:u.label,owner:u.owner||"",connections:g.reduce((a,x)=>a+x.rows.length,0)}}
  if(name==="list_records"){const q=lc(args.q||"");const L=[...universe().values()].filter(u=>u.t===args.type&&!u.alias&&(!q||lc(u.id+" "+u.label).includes(q))).slice(0,Math.min(50,args.limit||10));return {total:L.length,records:L.map(u=>({id:u.id,label:u.label,owner:u.owner||""}))}}
  if(name==="get_connections"){return {id:args.id,groups:connected(args.id).map(g=>({relation:g.label,records:g.rows.map(r=>({id:r.id,label:r.t,via:r.sub}))}))}}
  if(name==="list_approvals"){const L=G(()=>INBOX.items(),[]).filter(i=>i.kind==="approval").slice(0,Math.min(50,args.limit||10));return {total:L.length,approvals:L.map(i=>({id:i.id,title:i.title,source:i.src,due_hours:Math.round(i.dueH),risk:i.risk}))}}
  if(name==="trace_metric"){const t=G(()=>LIN.trace(args.metric_id),null);if(!t)throw new Error("No metric "+args.metric_id);return {metric:t.id,status:t.status,traced_percent:t.pct,sources:[...(t.srcs instanceof Map?t.srcs.values():Object.values(t.srcs||{}))].map(s=>s.ent+"."+s.fld),gaps:t.gaps.map(g=>g.phrase)}}
  if(name==="get_connectivity"){const a=audit();return {at:a.at,checks:a.checks.filter(c=>!args.area||lc(c.area)===lc(args.area)).map(c=>({id:c.id,area:c.area,name:c.name,total:c.total,gaps:c.bad}))}}
  return prev.apply(this,arguments)};
 FIXLOG("fx_mcp","Added six MCP tools: get_record, list_records, get_connections, list_approvals, trace_metric, get_connectivity",6,"applied");return 6}

/* search and chat */
function scoreOf(a){a=a||audit();const c=a.checks.filter(x=>x.total>0);const s=c.reduce((t,x)=>t+(1-Math.min(1,(x.units||x.bad)/x.total)),0)/Math.max(1,c.length);return Math.round(s*100)}
function fixSearch(){if(Z.fixed.search)return;Z.fixed.search=1;
 SEARCHX.push(()=>{const o=[{g:"Connections",t:"Connections and gaps",m:"Platform",c:"--accent",f:()=>go("zl_conn"),k:"connectivity dead links orphans reverse links interoperability audit"}];
  G(()=>Z.last&&Z.last.checks.forEach(c=>{if(c.bad)o.push({g:"Connections",t:c.name+" ("+c.bad+")",m:c.area,c:"--warn-f",f:()=>{Z.sel=c.id;Z.tab=1;go("zl_conn")},k:c.rem+" "+c.id})}));return o});
 SEARCHX.push(()=>BUS_EVENTS.map(e=>({g:"Notification templates",t:e[1]+" notice",m:e[0],c:"--e4",f:()=>{Z.tab=4;go("zl_conn")},k:"notice event downstream "+e[0]})));
 Z.notifyReg={};BUS_EVENTS.forEach(e=>Z.notifyReg[e[0]]=1);Z.fixed.notify=1;
 FIXLOG("fx_search","Added search groups for Connections and templates for eight business events",9,"applied")}
function say2(q,t){if(typeof say==="function")say(q,{t})}
function fixAsk(){if(Z.fixed.ask)return;Z.fixed.ask=1;
 ASKX.push(q=>{const t=lc(q);let m;
  if(_inAsk){return /connected to|connections? (of|for)|dead links?|broken links?|connection gaps?|connectivity|how connected|what happens (when|if) .*invoice|processes?.*(no|without|missing) (an )?owner|entit(y|ies).*(nothing|no one|unused|orphan)|metrics?.*not traced/.test(t)}
  if((m=/(?:connected to|connections? (?:of|for)|links? to|backlinks? (?:of|for)|what (?:uses|references)) ([a-z0-9_-]+)/i.exec(q))){const id=m[1].toUpperCase();const rid=universe().has(m[1])?m[1]:universe().has(id)?id:null;if(rid){const g=connected(rid);const n=g.reduce((a,x)=>a+x.rows.length,0);say2(q,`<b>${H(rid)}</b> has <b>${n}</b> connections: ${g.map(x=>H(x.label.replace(/^(Points to|Referenced by): /,"$1 "))+" ("+x.rows.length+")").join("; ")||"none"}.`);openRec(rid);return true}}
  if(/dead links?|broken links?|connection gaps?|connectivity (?:score|gaps?|audit)|how connected/.test(t)){const a=audit();Z.last=a;say2(q,`Connectivity score <b>${scoreOf(a)}</b>. <b>${a.checks.reduce((n,c)=>n+c.bad,0)}</b> findings across ${a.checks.length} checks; <b>${deadLinks().out.length}</b> cross-module references do not resolve.`);go("zl_conn");return true}
  if(/what happens (?:when|if) .*invoice|invoice (?:approval )?(?:effects?|fan.?out|downstream)/.test(t)){const ip=runIP();say2(q,`An invoice decision updates <b>${ip.consumers.filter(c=>c.updated).length} of ${ip.consumers.length}</b> consumers: ${ip.consumers.map(c=>H(c.name)+(c.updated?" (yes)":" (no)")).join("; ")}.`);Z.tab=3;go("zl_conn");return true}
  if(/processes?.*(?:no|without|missing) (?:an )?owner/.test(t)){const c=audit().checks.find(x=>x.id==="p_noowner");say2(q,`<b>${c.bad}</b> of ${c.total} processes have no named owner.`);return true}
  if(/entit(?:y|ies).*(?:nothing|no one|nobody|no screen|unused|orphan)/.test(t)){const c=audit().checks.find(x=>x.id==="d_noscreen");say2(q,`<b>${c.bad}</b> entities have no reader or writer. First: ${c.items.slice(0,5).map(i=>H(i.label)).join(", ")||"none"}.`);return true}
  if(/metrics?.*not traced|untraced metrics?/.test(t)){const c=audit().checks.find(x=>x.id==="d_metric_untraced");say2(q,`<b>${c.bad}</b> of ${c.total} metrics are not traced to any field.`);go("plat_data");return true}
  return false});
 FIXLOG("fx_ask","Added chat intents for connections, dead links, invoice fan-out, ownerless processes, unused entities and untraced metrics",6,"applied")}
function fixDebt(a){if(!G(()=>DEBT.add,0)||Z.fixed.debt)return 0;Z.fixed.debt=1;let n=0;
 a.checks.filter(c=>c.bad>0&&["d_undecl","d_ref_untargeted","w_approver","w_assignee","a_gate","d_noscreen","p_nobackup"].includes(c.id)).forEach(c=>{const r=G(()=>DEBT.add({type:"ooc",title:"Connectivity: "+c.name+" ("+(c.units||c.bad)+")",sev:"Medium",source:"connectivity_audit",apps:[],owner:"Rina Okafor",owner2:"Jordan Lee",steward:"Data council chair",principal:Math.max(4,Math.round((c.units||c.bad)/10)),reason:c.rem,status:"open",fix:c.rem}),null);if(r)n++});
 FIXLOG("fx_debt","Routed remaining findings to Technical debt (one item per check)",n,"applied");return n}
let _fixing=false;
function fixAll(){if(NOFIX||_fixing)return;_fixing=true;
 try{[["fx_ref",fixRefs],["fx_wfsvc",fixWfService],["fx_people",fixPeople],["fx_alias",fixAliases],["fx_metricuse",fixMetricUse],["fx_stepio",fixStepIO],["fx_flows",fixFlows],["fx_lineage",fixLineage],["fx_inbox",fixInbox],["fx_mcp",fixMcp]].forEach(([id,f])=>{if(!Z.fixed[id]){try{f();Z.fixed[id]=1}catch(e){console.error("zlink fix",id,e)}}});
  fixSearch();fixAsk();hookAudit();watchDrawer();Z.ip=null;Z.ipStale=true}finally{_fixing=false}}
