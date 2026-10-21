/* ===== Round 18, D: Data access and approval (Make). A build declares the data it needs; each source routes to its authoritative owner GROUP;
   an automated security review runs first; decisions are time-boxed grants that must be recertified. Screen r18_access. Class prefix r18-. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;
const {G,H,arr,pill,fD}=R18;const ST=R18.st;
const TODAY=R18.TODAY;
const addD=(d,n)=>{const t=new Date(d+"T12:00:00Z");t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
const dayDiff=(a,b)=>Math.round((new Date(b+"T12:00:00Z")-new Date(a+"T12:00:00Z"))/864e5);
const me=()=>G(()=>R15D.me().name,"Casey Rowan");
const CLS=["public","internal","personal","confidential","restricted"];
const STATE={pending:["Waiting for the owner","warn"],approved:["Approved","good"],approved_masked:["Approved with masking","good"],limited:["Limited scope","info"],denied:["Denied","bad"],expired:["Expired","bad"],revoked:["Revoked","mute"],none:["Not requested","mute"]};
const LIVE=s=>s==="approved"||s==="approved_masked"||s==="limited";
/* PR-32 B9: access requests are derived state, seeded from the Meridian builds only. Another tenant starts with no requests (a labeled gap)
   and keeps the ones made in this session apart from Meridian's; the Meridian access metrics are synced and shown under Meridian only. */
const TCORE=()=>!W.DATA||DATA.tenant()==="core";
const TGAP=w=>`<p class="muted small" data-tenant-gap="1">No data in this sample company yet${w?": "+H(w):""}.</p>`;
const kpT=o=>{if(TCORE()||!o)return o;const c=Object.assign({},o);delete c.metric;return c};

/* ---------- who owns what ---------- */
const GRP={budget_line:"Budget approvers (delegation of authority)",budget_request:"Budget approvers (delegation of authority)",budget_adjustment:"Budget approvers (delegation of authority)",cost_center:"Finance review group",cost_center_map:"Finance review group",invoice:"Payables approvers",contract:"Finance review group",contract_line:"Finance review group",core_company:"Finance review group",person:"People Operations",objective:"Portfolio council",key_result:"Portfolio council",project:"Portfolio council",project_task:"Portfolio council",wbs_line:"Portfolio council",incident:"Architecture and security review group",change_request:"Change advisory board",config_item:"Architecture and security review group"};
const DOMG={fin:"Finance review group",people:"People Operations",sec:"Security approvers",plat:"Architecture and security review group"};
/* PR-02: entity ids are the registered ones (contract_line, budget_line). OLD only migrates ids saved before the change. */
const OLD={contract:"contract_line",budget_request:"budget_line"};const realId=id=>OLD[id]||id;
const ent=id=>G(()=>PLAT.ent(id),null);
const tbl=id=>G(()=>DATAMODEL.tables[id],null);
const labelOf=id=>(ent(id)||tbl(id)||{}).label||id;
const fieldsOf=id=>arr((ent(id)||tbl(id)||{}).fields).map(f=>({k:f.k,label:f.label||f.k,cls:f.classification||"internal"}));
const clsOf=(id,attrs)=>{const fs=fieldsOf(id).filter(f=>!attrs||attrs.indexOf(f.k)>=0);return fs.reduce((m,f)=>CLS.indexOf(f.cls)>CLS.indexOf(m)?f.cls:m,"internal")};
const groupFor=id=>GRP[id]||DOMG[(ent(id)||{}).domain]||"Architecture and security review group";
const ownerOf=id=>(ent(id)||{}).owner||"Platform";
const stewardOf=id=>(ent(id)||tbl(id)||{}).steward||"";
/* candidate sources shown in the request wizard (real registered entities) */
const CANDS=["person","objective","key_result","project","budget_line","cost_center","invoice","contract_line","core_company","incident","change_request","wbs_line"].filter(id=>ent(id)||tbl(id));
R18.accessEnts=()=>CANDS.filter(id=>ent(id)||tbl(id));

/* ---------- state and seeds ---------- */
const A=ST.acc=ST.acc||{seq:1030,reqs:null,grants:null};
function mkItem(app,e,state,o){o=o||{};const fs=fieldsOf(e),attrs=o.attrs||fs.slice(0,Math.min(fs.length,o.n||8)).map(f=>f.k);const cls=clsOf(e,attrs);
 const it={id:"ARI-"+(A.seq++),ent:e,attrs,group:groupFor(e),cls,state,by:o.by||"",at:o.at||"",note:o.note||"",mask:state==="approved_masked",expires:o.expires||"",policy:!!o.policy};return it}
function seed(){if(A.reqs)return;A.reqs=[];
 const apps=R18.apps();let n=1001;
 apps.forEach(a=>{const reads=arr(a.reads).map(realId);a.reads=reads.length?reads:a.reads;if(!reads.length)return;const at=a.created||"2026-08-01";let items;
  if(a.id==="ca_pipeline"){items=[mkItem(a,"objective","approved",{by:"Portfolio council",at:"2026-10-04",expires:addD("2026-10-04",180),n:5}),mkItem(a,"cost_center","approved_masked",{by:"Finance review group",at:"2026-10-05",expires:addD("2026-10-05",180),n:6,note:"Approved; owner names masked."}),mkItem(a,"person","pending",{n:7}),mkItem(a,"budget_line","pending",{n:8})]}
  else if(a.id==="ca_travel"){items=reads.map(e=>mkItem(a,e,e==="invoice"?"denied":"approved",{by:groupFor(e),at:addD(at,3),expires:addD(at,183),note:e==="invoice"?"Personal-tier builds may not read invoices. Request the team tier first.":"",n:6}))}
  else if(a.id==="ca_lease"){items=reads.map(e=>mkItem(a,e,"expired",{by:groupFor(e),at:addD(at,3),expires:"2026-09-30",note:"Builder has left; recertification was not done.",n:5}))}
  else if(a.id==="ca_budget"){items=reads.map((e,i)=>mkItem(a,e,"approved",{by:groupFor(e),at:addD(at,3),expires:i===0?"2026-10-18":addD(at,183),n:7}))}
  else if(a.id==="ca_inv_exc"){items=reads.map(e=>mkItem(a,e,e==="contract_line"?"approved_masked":"approved",{by:groupFor(e),at:"2026-09-30",expires:addD("2026-09-30",180),n:6,note:e==="contract_line"?"Approved; pricing terms masked.":""}))}
  else{items=reads.map(e=>mkItem(a,e,a.status==="sunset"?"revoked":"approved",{by:groupFor(e),at:addD(at,3),expires:addD(at,183),n:6,policy:CLS.indexOf(clsOf(e))<=1}))}
  items.forEach(i=>{if(!i.by)i.by="";i.reqBy=a.builder;i.req=a.id});
  A.reqs.push({id:"AR-"+(n++),app:a.id,by:String(a.builder||"").replace(/\s*\(.*\)$/,""),at,purpose:a.purpose,items})});
 A.log=[]}
const reqs=()=>{if(!TCORE()){A.byT=A.byT||{};const t=DATA.tenant();return A.byT[t]||(A.byT[t]=[])}seed();return A.reqs};
const itemsOf=app=>{const out=[];reqs().filter(r=>r.app===app).forEach(r=>r.items.forEach(i=>out.push(i)));return out};
/* current item per entity for a build: the latest one wins */
const needs=(app,e)=>{const i=latest(app,e);return !i||(!live(i)&&i.state!=="pending")};
const latest=(app,e)=>{const l=itemsOf(app).filter(i=>i.ent===e);return l.length?l[l.length-1]:null};
function live(i){if(!i)return false;if(!LIVE(i.state))return false;return !i.expires||i.expires>=TODAY}
function normalize(){reqs().forEach(r=>r.items.forEach(i=>{i.ent=realId(i.ent);if(LIVE(i.state)&&i.expires&&i.expires<TODAY)i.state="expired"}));G(()=>R18.apps().forEach(a=>{if(Array.isArray(a.reads)&&a.reads.some(e=>OLD[e]))a.reads=a.reads.map(realId)}))}

const access=R18.access={};
access.stateOf=app=>{normalize();const a=R18.app(app);const reads=arr(a&&a.reads);if(!reads.length)return{ok:true,pending:0,n:0,missing:0,denied:0};
 let ok=0,pending=0,missing=0,denied=0,n=0;reads.forEach(e=>{const i=latest(app,e);if(!i){missing++;return}n++;if(live(i))ok++;else if(i.state==="pending")pending++;else if(i.state==="denied")denied++});
 return{ok:ok===reads.length,pending,n,missing,denied,okN:ok,total:reads.length}};
access.rowsFor=app=>{normalize();const a=R18.app(app);return arr(a&&a.reads).map(e=>{const i=latest(app,e);const st=i?(i.state==="approved"||i.state==="approved_masked"||i.state==="limited"?(i.expires&&i.expires<TODAY?"expired":i.state):i.state):"none";const s=STATE[st]||STATE.none;
  return{entity:e,label:labelOf(e),group:groupFor(e),cls:i?i.cls:clsOf(e),state:s[0],tone:s[1],act:(!i||st==="denied"||st==="expired"||st==="revoked")?`<button type="button" class="btn quiet" data-r18-reqent="${H(app+"|"+e)}">${st==="expired"?"Recertify":"Request"}</button>`:""}})};

/* ---------- the automated security review ---------- */
function review(app,item){const a=R18.app(app)||{},m=R18.meta(app);const checks=[];const mx=item.cls;const fsAll=fieldsOf(item.ent).length;
 const add=(n,r,ev)=>checks.push({n,r,ev});
 add("Purpose is stated",(a.purpose||"").length>20?"pass":"fail",(a.purpose||"").length>20?"Purpose on the build: "+a.purpose:"The build has no stated purpose.");
 const asked=item.attrs.length;add("Minimum necessary",asked>10?"warn":asked>0?"pass":"fail",asked>10?"Asks for "+asked+" of "+fsAll+" fields. Narrow it to the fields the build uses.":"Asks for "+asked+" of "+fsAll+" fields.");
 const decl=arr(a.classes);const need=CLS.indexOf(mx)>=CLS.indexOf("personal");add("Build is declared for this class of data",need&&decl.indexOf(mx)<0&&decl.indexOf("personal")<0&&mx!=="internal"?"warn":"pass",need?"Source holds "+mx+" fields; the build declares "+(decl.join(", ")||"nothing")+".":"Source is "+mx+" data.");
 const tier=a.tier||"personal";add("Tier is high enough",(mx==="restricted"&&tier!=="enterprise")||(mx==="confidential"&&tier==="personal")?"fail":"pass",tier+" tier reading "+mx+" data"+((mx==="confidential"&&tier==="personal")||(mx==="restricted"&&tier!=="enterprise")?". Raise the tier through the approval gate first.":"."));
 add("Read through the platform, never a copy","pass","Access is by API under the owner's rules. The build cannot export or keep a copy of the source.");
 const ai=arr(a.ai);const direct=ai.some(x=>!x.gw);add("AI exposure",direct?"fail":ai.length&&need?"warn":"pass",direct?"A model is called directly, outside the gateway.":ai.length?(need?"A model sees this data through the AI gateway. Personal fields are masked before the call.":"A model sees this data only through the AI gateway."):"No AI use declared.");
 add("Accountable people named",m.owner&&m.backup?"pass":"fail",m.owner&&m.backup?"Owner "+m.owner+", backup "+m.backup+".":"The build needs a named owner and a different backup.");
 const fails=checks.filter(c=>c.r==="fail").length,warns=checks.filter(c=>c.r==="warn").length;
 let rec="approve",why="All checks pass.";
 if(fails){rec="deny";why="Resolve the failing checks first."}
 else if(CLS.indexOf(mx)>=CLS.indexOf("personal")){rec="approve_masked";why="Approve with personal fields masked."}
 else if(asked>10){rec="limited";why="Approve a narrower set of fields."}
 else if(warns){rec="approve";why="Approve; note the warnings."}
 return{checks,fails,warns,rec,why,auto:!fails&&!warns&&CLS.indexOf(mx)<=1}}
access.review=review;
const REC={approve:"Approve",approve_masked:"Approve with masking",limited:"Limit the scope",deny:"Deny until fixed"};

/* ---------- create, decide, recertify, revoke ---------- */
function submit(draft){const a=R18.app(draft.app);if(!a)return null;const ents=Object.keys(draft.ents).filter(e=>arr(draft.ents[e]).length&&needs(a.id,e));if(!ents.length)return null;
 const r={id:"AR-"+(A.seq++),app:a.id,by:me(),at:TODAY,purpose:draft.purpose||a.purpose,items:[]};
 ents.forEach(e=>{const it=mkItem(a,e,"pending",{attrs:draft.ents[e].slice(),at:TODAY});it.req=a.id;it.reqBy=me();it.rv=review(a.id,it);
  if(it.rv.auto){it.state="approved";it.by="Policy: internal data, all checks pass";it.at=TODAY;it.expires=addD(TODAY,180);it.policy=true;it.note="Decided by policy; no person needed."}
  r.items.push(it)});
 reqs().push(r);G(()=>audit("Requested data access",a.n+" · "+ents.map(labelOf).join(", ")));
 G(()=>EVENTS.emit("access.requested",{build:a.id,sources:ents.join(","),actor:me()}));G(()=>INBOX.refresh());sync();return r}
function decide(itemId,verdict,note){normalize();let hit=null;reqs().forEach(r=>r.items.forEach(i=>{if(i.id===itemId)hit={r,i}}));if(!hit)return{ok:false,why:"Request item not found"};
 const {r,i}=hit;if(i.state!=="pending")return{ok:false,why:"Already decided"};const a=R18.app(r.app)||{};
 const map={approve:"approved",approve_masked:"approved_masked",limited:"limited",deny:"denied"};i.state=map[verdict]||"approved";i.by=i.group;i.decidedBy=me();i.at=TODAY;i.note=note||"";
 if(i.state==="limited"){i.attrs=i.attrs.filter(k=>{const f=fieldsOf(i.ent).find(x=>x.k===k);return !f||CLS.indexOf(f.cls)<=CLS.indexOf("internal")});if(!i.attrs.length)i.attrs=fieldsOf(i.ent).slice(0,3).map(f=>f.k)}
 if(i.state!=="denied")i.expires=addD(TODAY,CLS.indexOf(i.cls)>=3?90:180);
 G(()=>audit(i.state==="denied"?"Denied data access":"Approved data access",(a.n||r.app)+" · "+labelOf(i.ent)+" · "+i.group));
 G(()=>EVENTS.emit(i.state==="denied"?"access.denied":"access.approved",{build:r.app,source:i.ent,group:i.group,actor:me()}));G(()=>INBOX.refresh());sync();return{ok:true}}
access.decide=decide;
access.recertify=itemId=>{reqs().forEach(r=>r.items.forEach(i=>{if(i.id===itemId&&(LIVE(i.state)||i.state==="expired")){if(i.state==="expired")i.state=i.mask?"approved_masked":"approved";i.expires=addD(TODAY,CLS.indexOf(i.cls)>=3?90:180);i.note="Recertified by "+me()+" on "+fD(TODAY);G(()=>audit("Recertified data access",labelOf(i.ent)));G(()=>EVENTS.emit("access.recertified",{build:r.app,source:i.ent,actor:me()}))}}));sync()};
access.revoke=itemId=>{reqs().forEach(r=>r.items.forEach(i=>{if(i.id===itemId&&LIVE(i.state)){i.state="revoked";i.note="Revoked by "+me()+" on "+fD(TODAY);G(()=>audit("Revoked data access",labelOf(i.ent)));G(()=>EVENTS.emit("access.revoked",{build:r.app,source:i.ent,actor:me()}))}}));sync()};
const roleOf=()=>G(()=>PERSONAS[S.persona].role,"");
const canAct=g=>{const grp=G(()=>PERM.groups.find(x=>x.n===g),null);if(grp&&arr(grp.users).indexOf(me())>=0)return true;const r=roleOf();return r==="exec"||r==="admin"||(r==="finance"&&/Finance|Payables|Budget/.test(g))||(r==="arch"&&/Architecture|Security/.test(g))||(r==="portfolio"&&/Portfolio/.test(g))||(r==="pm"&&/Portfolio/.test(g))};
access.canAct=canAct;
access.queue=()=>{const out=[];reqs().forEach(r=>r.items.forEach(i=>{if(i.state==="pending"){if(!i.rv)i.rv=review(r.app,i);out.push({r,i})}}));return out};
access.startFor=(app,ents)=>{ST.accDraft={app,purpose:(R18.app(app)||{}).purpose||"",ents:{}};const list=ents&&ents.length?ents:arr((R18.app(app)||{}).reads).filter(e=>needs(app,e));list.forEach(e=>{ST.accDraft.ents[e]=fieldsOf(e).filter(f=>CLS.indexOf(f.cls)<=CLS.indexOf("personal")).slice(0,8).map(f=>f.k)});S.v=S.v||{};S.v.r18acv=1;G(()=>go("r18_access"))};

/* ---------- metrics (live from the state) ---------- */
function stats(){normalize();const all=[];reqs().forEach(r=>r.items.forEach(i=>all.push({r,i})));const decided=all.filter(x=>x.i.state!=="pending");
 const days=decided.filter(x=>x.i.at&&x.r.at&&!x.i.policy).map(x=>Math.max(0,dayDiff(x.r.at,x.i.at)));const avg=days.length?days.reduce((a,b)=>a+b,0)/days.length:0;
 const pol=decided.length?Math.round(100*decided.filter(x=>x.i.policy).length/decided.length):0;
 const liveG=all.filter(x=>live(x.i));const soon=liveG.filter(x=>x.i.expires&&dayDiff(TODAY,x.i.expires)<=30).length;const exp=all.filter(x=>x.i.state==="expired").length;
 const den=decided.length?Math.round(100*decided.filter(x=>x.i.state==="denied").length/decided.length):0;
 const over=R18.apps().filter(a=>a.tier==="personal"&&liveG.some(x=>x.r.app===a.id&&CLS.indexOf(x.i.cls)>=3)).length;
 return{all,decided,pending:all.filter(x=>x.i.state==="pending").length,avg,pol,soon,exp,den,over,grants:liveG.length}}
access.stats=stats;
function sync(){if(!TCORE())return;const s=stats();G(()=>{const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=+(+v).toFixed(1);m.tr=m.tr.slice(0,-1).concat([m.cur])};set("m_acc_time",s.avg);set("m_acc_policy",s.pol);set("m_acc_recert",s.soon+s.exp);set("m_acc_denied",s.den);set("m_acc_over",s.over)})}

/* ---------- screens ---------- */
const pillS=st=>{const s=STATE[st]||STATE.none;return pill(s[0],s[1])};
const clsPill=c=>pill(c,CLS.indexOf(c)>=2?"warn":"mute");
const checkPill=r=>pill(r==="pass"?"Pass":r==="warn"?"Warn":"Fail",r==="pass"?"good":r==="warn"?"warn":"bad");
function reqCard(r){const a=R18.app(r.app)||{n:r.app};const done=r.items.filter(i=>i.state!=="pending").length;
 return `<article class="card glass r18-req"><div class="cardhead"><div><h3>${H(a.n)}</h3><span class="muted small">${H(r.id)} · requested by ${ownerChip(r.by,{role:"Requester"})} on ${H(fD(r.at))} · ${done} of ${r.items.length} decided</span></div><button type="button" class="btn quiet" data-r18-app="${H(r.app)}">Open build</button></div>
 <div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Source</th><th>Approved by</th><th>Fields</th><th>Class</th><th>Decision</th><th>Expires</th></tr></thead><tbody>${r.items.map(i=>`<tr><td><b>${H(labelOf(i.ent))}</b>${i.note?`<small class="muted">${H(i.note)}</small>`:""}</td><td>${H(i.group)}${i.policy?'<small class="muted">Decided by policy</small>':""}</td><td class="num">${i.attrs.length}</td><td>${clsPill(i.cls)}</td><td>${pillS(i.state)}</td><td>${i.expires?H(fD(i.expires)):""}</td></tr>`).join("")}</tbody></table></div></article>`}
function requestsTab(){const s=stats();
 const list=reqs().slice().reverse().filter(r=>r.items.some(i=>i.state==="pending")||r.at>=addD(TODAY,-30)||true).slice(0,12);
 return `${typeof kpiRow==="function"?kpiRow([["Waiting for an owner",s.pending,"across "+new Set(s.all.filter(x=>x.i.state==="pending").map(x=>x.i.group)).size+" owner groups",{cls:s.pending?"warn":""}],["Average time to decide",s.avg.toFixed(1)+" days","excluding decisions made by policy",kpT({metric:"m_acc_time",keep:true})],["Decided by policy",s.pol+"%","internal data with every check passing",kpT({metric:"m_acc_policy",keep:true})],["Grants to recertify",s.soon+s.exp,s.exp+" expired, "+s.soon+" due in 30 days",kpT({metric:"m_acc_recert",cls:(s.soon+s.exp)?"warn":"",keep:true})]]):""}
 ${list.length||TCORE()?"":TGAP("data access requests")}<div class="r18-stack">${list.map(reqCard).join("")}</div>`}
function candRow(e,draft){const on=!!draft.ents[e],fs=fieldsOf(e);const sel=draft.ents[e]||[];
 return `<div class="r18-cand ${on?"on":""}"><label class="r18-cl"><input type="checkbox" data-r18-ent="${H(e)}" ${on?"checked":""}><span><b>${H(labelOf(e))}</b><small class="muted">Owned by ${H(ownerOf(e))} · approved by ${H(groupFor(e))} · up to ${H(clsOf(e))}</small></span></label>
 ${on?`<div class="r18-attrs"><div class="r18-ah"><span class="small muted">Fields requested (${sel.length} of ${fs.length}). Ask only for what the build uses.</span><button type="button" class="btn quiet" data-r18-attrs="${H(e)}:min">Fewest</button><button type="button" class="btn quiet" data-r18-attrs="${H(e)}:all">All</button></div><div class="r18-af">${fs.slice(0,40).map(f=>`<label class="r18-fl ${CLS.indexOf(f.cls)>=2?"sens":""}"><input type="checkbox" data-r18-attr="${H(e+"|"+f.k)}" ${sel.indexOf(f.k)>=0?"checked":""}>${H(f.label)} <em>${H(f.cls)}</em></label>`).join("")}</div></div>`:""}</div>`}
function newTab(){const d=ST.accDraft=ST.accDraft||{app:ST.reqFor||ST.app,purpose:"",ents:{}};const a=R18.app(d.app)||R18.apps()[0];if(a&&d.app!==a.id)d.app=a.id;if(!d.purpose&&a)d.purpose=a.purpose;
 const ents=Object.keys(d.ents).filter(e=>arr(d.ents[e]).length);
 const previews=ents.map(e=>{const it={ent:e,attrs:d.ents[e],cls:clsOf(e,d.ents[e]),group:groupFor(e)};return{e,it,rv:review(d.app,it)}});
 const sec=previews.map(p=>`<div class="r18-pv"><div class="r18-pvh"><b>${H(labelOf(p.e))}</b><span>${H(p.it.group)}</span>${pill(REC[p.rv.rec],p.rv.rec==="deny"?"bad":p.rv.rec==="approve"?"good":"warn")}${p.rv.auto?pill("Decided by policy","info"):""}</div><ul class="r18-ck">${p.rv.checks.map(c=>`<li>${checkPill(c.r)} <b>${H(c.n)}</b> <span class="muted">${H(c.ev)}</span></li>`).join("")}</ul></div>`).join("");
 return `<div class="r18-two"><section class="card glass"><div class="cardhead"><div><h3>1. What does the build need?</h3><span class="muted small">Pick the build, say why, then choose each source of data.</span></div></div>
  <label class="small muted r18-pickl"><span>Build</span><select class="fin" data-r18-accapp aria-label="Build that needs access">${R18.apps().map(x=>`<option value="${H(x.id)}" ${x.id===d.app?"selected":""}>${H(x.n)}</option>`).join("")}</select></label>
  <label class="small muted r18-pickl"><span>Purpose (shown to the data owners)</span><textarea class="fin" rows="2" data-r18-accwhy aria-label="Purpose of the request">${H(d.purpose)}</textarea></label>
  <div class="r18-cands">${CANDS.map(e=>candRow(e,d)).join("")}</div></section>
 <div class="r18-col"><section class="card glass"><div class="cardhead"><div><h3>2. How it will be routed and checked</h3><span class="muted small">One request, split by owner. Each owner group decides only its own data.</span></div></div>
  ${previews.length?sec:`<p class="muted small">Choose at least one source to see the routing and the security review.</p>`}
  <div class="row r18-actrow"><button type="button" class="btn primary" data-r18-submit ${previews.length?"":"disabled"}>Submit ${previews.length?previews.length+" request"+(previews.length>1?"s":""):"request"}</button><span class="muted small">Nothing is shared until each owner approves.</span></div></section></div></div>`}
function queueTab(){const q=access.queue();const mine=q.filter(x=>canAct(x.i.group)),other=q.filter(x=>!canAct(x.i.group));
 const card=({r,i})=>{const a=R18.app(r.app)||{n:r.app};const rv=i.rv||(i.rv=review(r.app,i));
  return `<article class="card glass r18-rq"><div class="cardhead"><div><h3>${H(a.n)} needs ${H(labelOf(i.ent))}</h3><span class="muted small">${H(r.id)} · ${ownerChip(r.by,{})} · for ${H(i.group)} · up to ${H(i.cls)} data</span></div>${pill("Recommended: "+REC[rv.rec],rv.rec==="deny"?"bad":rv.rec==="approve"?"good":"warn")}</div>
  <p class="r18-why" data-role="story">${H(r.purpose)}</p><div class="r18-chips">${i.attrs.slice(0,14).map(k=>{const f=fieldsOf(i.ent).find(x=>x.k===k)||{label:k,cls:"internal"};return `<span class="pill ${CLS.indexOf(f.cls)>=2?"warn":"mute"}" title="${H(f.cls)}">${H(f.label)}</span>`}).join("")}${i.attrs.length>14?`<span class="muted small">+${i.attrs.length-14} more</span>`:""}</div>
  <details class="r18-det"><summary>Security review: ${rv.fails} fail, ${rv.warns} warn. ${H(rv.why)}</summary><ul class="r18-ck">${rv.checks.map(c=>`<li>${checkPill(c.r)} <b>${H(c.n)}</b> <span class="muted">${H(c.ev)}</span></li>`).join("")}</ul></details>
  <label class="small muted r18-pickl"><span>Note to the builder</span><input class="fin" type="text" data-r18-note="${H(i.id)}" placeholder="Optional" aria-label="Note to the builder"></label>
  <div class="row r18-actrow"><button type="button" class="btn primary" data-r18-dec="${H(i.id)}|approve" ${rv.rec==="deny"?"disabled":""}>Approve</button><button type="button" class="btn" data-r18-dec="${H(i.id)}|approve_masked" ${rv.rec==="deny"?"disabled":""}>Approve with masking</button><button type="button" class="btn" data-r18-dec="${H(i.id)}|limited" ${rv.rec==="deny"?"disabled":""}>Limit the scope</button><button type="button" class="btn quiet" data-r18-dec="${H(i.id)}|deny">Deny</button></div></article>`};
 return `<div class="r18-stack">${mine.length?mine.map(card).join(""):`<section class="card glass"><p class="muted">Nothing is waiting on ${roleOf()?"the groups you act for":"you"}.</p></section>`}
 ${other.length?`<section class="card glass"><div class="cardhead"><div><h3>Waiting on other groups</h3><span class="muted small">You can see these but not decide them.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Build</th><th>Source</th><th>Waiting on</th><th>Since</th></tr></thead><tbody>${other.map(x=>`<tr><td>${H((R18.app(x.r.app)||{}).n||x.r.app)}</td><td>${H(labelOf(x.i.ent))}</td><td>${H(x.i.group)}</td><td>${H(fD(x.r.at))}</td></tr>`).join("")}</tbody></table></div></section>`:""}</div>`}
function grantsTab(){normalize();const g=[];reqs().forEach(r=>r.items.forEach(i=>{if(LIVE(i.state)||i.state==="expired")g.push({r,i})}));g.sort((x,y)=>String(x.i.expires).localeCompare(String(y.i.expires)));
 return `<section class="card glass"><div class="cardhead"><div><h3>Active grants</h3><span class="muted small">Every grant ends. The owner of the build recertifies it or it expires, and the build loses the data.</span></div></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Build</th><th>Source</th><th>Scope</th><th>Approved by</th><th>Expires</th><th class="n"></th></tr></thead><tbody>${g.map(({r,i})=>{const d=i.expires?dayDiff(TODAY,i.expires):null;const tone=i.state==="expired"?"bad":d!=null&&d<=30?"warn":"mute";
  return `<tr><td>${H((R18.app(r.app)||{}).n||r.app)}</td><td><b>${H(labelOf(i.ent))}</b></td><td>${i.attrs.length} fields${i.mask?", masked":""}${i.state==="limited"?", limited":""}</td><td>${H(i.by||i.group)}</td><td>${pill(i.state==="expired"?"Expired "+fD(i.expires):d!=null?(d+" days"):"No end",tone)}</td><td class="n"><button class="btn quiet" type="button" data-r18-recert="${H(i.id)}">Recertify</button>${i.state!=="expired"?`<button class="btn quiet" type="button" data-r18-revoke="${H(i.id)}">Revoke</button>`:""}</td></tr>`}).join("")}</tbody></table></div></section>`}
function ownersTab(){const rows=CANDS.map(e=>{const users=R18.apps().filter(a=>arr(a.reads).indexOf(e)>=0).length;const grants=reqs().reduce((n,r)=>n+r.items.filter(i=>i.ent===e&&live(i)).length,0);
  return `<tr><td><b>${H(labelOf(e))}</b><small class="muted">${H(e)}</small></td><td>${H(ownerOf(e))}</td><td>${H(stewardOf(e)||"Not named")}</td><td>${H(groupFor(e))}</td><td>${clsPill(clsOf(e))}</td><td class="n num">${users}</td><td class="n num">${grants}</td></tr>`}).join("");
 return `<section class="card glass"><div class="cardhead"><div><h3>Who owns the truth</h3><span class="muted small">The authoritative owner of each source, the group that approves access, and how many builds depend on it. A build never keeps its own copy.</span></div><button class="btn quiet" type="button" data-go="plat_map">Open the data model</button></div><div class="tscroll"><table class="tbl r18-t"><thead><tr><th>Source</th><th>Authoritative owner</th><th>Steward</th><th>Approves access</th><th>Highest class</th><th class="n">Builds reading</th><th class="n">Live grants</th></tr></thead><tbody>${rows}</tbody></table></div></section>`}
function screen(){normalize();sync();const s=stats();
 return `<div class="screen r18-screen">${hero("Make · Data access","Get the data your build needs, with the owners' approval","A build asks for the data it needs in one request. Each source goes to its authoritative owner group, an automated security review runs first, and every grant has an end date. This is a standard part of every build's guardrails.")}
 ${typeof views==="function"?views("r18acv",["Requests ("+reqs().length+")","New request","Review queue ("+s.pending+")","Active grants ("+s.grants+")","Who owns the data"],[requestsTab(),newTab(),queueTab(),grantsTab(),ownersTab()]):requestsTab()}
 ${typeof procCard==="function"?procCard("r18_access"):""}</div>`}
REG("r18_access","Data access","make","M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6zM9 12l2 2 4-4",screen);
DATA.screen("r18_access",{mode:"data",entities:["builds"]});

/* ---------- events ---------- */
D.addEventListener("change",e=>{const t=e.target;if(!t.closest)return;
 const ap=t.closest("[data-r18-accapp]");if(ap){ST.accDraft=ST.accDraft||{ents:{}};ST.accDraft.app=ap.value;ST.accDraft.purpose=(R18.app(ap.value)||{}).purpose||"";ST.accDraft.ents={};arr((R18.app(ap.value)||{}).reads).filter(x=>needs(ap.value,x)).forEach(x=>{ST.accDraft.ents[x]=fieldsOf(x).filter(f=>CLS.indexOf(f.cls)<=2).slice(0,8).map(f=>f.k)});render();return}
 const en=t.closest("[data-r18-ent]");if(en){const d=ST.accDraft=ST.accDraft||{app:ST.app,purpose:"",ents:{}};const e2=en.dataset.r18Ent;if(en.checked)d.ents[e2]=fieldsOf(e2).filter(f=>CLS.indexOf(f.cls)<=2).slice(0,8).map(f=>f.k);else delete d.ents[e2];render();return}
 const at=t.closest("[data-r18-attr]");if(at){const [e2,k]=at.dataset.r18Attr.split("|");const d=ST.accDraft;const l=d.ents[e2]=arr(d.ents[e2]);const i=l.indexOf(k);if(at.checked&&i<0)l.push(k);if(!at.checked&&i>=0)l.splice(i,1);render()}});
D.addEventListener("input",e=>{const w=e.target.closest&&e.target.closest("[data-r18-accwhy]");if(w&&ST.accDraft)ST.accDraft.purpose=w.value});
D.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
 const a=t.closest("[data-r18-attrs]");if(a){const [e2,m]=a.dataset.r18Attrs.split(":");const d=ST.accDraft;d.ents[e2]=m==="all"?fieldsOf(e2).map(f=>f.k):fieldsOf(e2).filter(f=>CLS.indexOf(f.cls)<=1).slice(0,3).map(f=>f.k);render();return}
 const s=t.closest("[data-r18-submit]");if(s){const r=submit(ST.accDraft);if(r){const pend=r.items.filter(i=>i.state==="pending").length;ST.accDraft=null;S.v=S.v||{};S.v.r18acv=0;G(()=>toast(pend?"Request sent to "+pend+" owner group"+(pend>1?"s":""):"Approved by policy: no person needed","good"));render()}return}
 const d=t.closest("[data-r18-dec]");if(d){const [id,v]=d.dataset.r18Dec.split("|");const n=D.querySelector('[data-r18-note="'+id+'"]');const r=decide(id,v,n?n.value:"");G(()=>toast(r.ok?(v==="deny"?"Denied":"Decision recorded"):r.why,r.ok?"good":"warn"));render();return}
 const rc=t.closest("[data-r18-recert]");if(rc){access.recertify(rc.dataset.r18Recert);G(()=>toast("Recertified","good"));render();return}
 const rv=t.closest("[data-r18-revoke]");if(rv){access.revoke(rv.dataset.r18Revoke);G(()=>toast("Access revoked","warn"));render();return}
 const re=t.closest("[data-r18-reqent]");if(re){const [ap,en]=re.dataset.r18Reqent.split("|");access.startFor(ap,[en])}});

/* ---------- Feature Contract inputs used by the wiring module ---------- */
R18.accessSeedMetrics={
 m_acc_time:{n:"Time to decide a data access request",f:"Average days from request to decision, over decisions in the last 90 days made by a person (policy decisions excluded)",u:" days",cur:1.2,tgt:2,badAt:4,dir:"min",max:10,tr:[3.1,2.8,2.4,2.2,1.9,1.6,1.4,1.2],owner:"Rina Okafor",use:["Data access"],rem:{kind:"sop",ref:"SOP-R18-1",title:"Chase the owner group that has waited longest",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists requests waiting more than 3 days and nudges the owner group"}},
 m_acc_policy:{n:"Access decided by policy",f:"Items decided with no person (internal data, every check passing) ÷ all items decided × 100",u:"%",cur:30,tgt:50,badAt:15,dir:"max",max:100,tr:[10,12,15,18,22,25,28,30],owner:"Jordan Lee",use:["Data access"],rem:{kind:"sop",ref:"SOP-R18-2",title:"Add a policy for the next most common safe request",agent:"Registry Agent",auto:false,state:"idle",prog:"Finds request patterns that were always approved and proposes a policy"}},
 m_acc_recert:{n:"Grants to recertify",f:"Live grants ending within 30 days plus grants already expired, from the grant store",u:"",cur:3,tgt:0,badAt:5,dir:"min",max:20,tr:[1,2,2,3,3,4,3,3],owner:"Rina Okafor",use:["Data access"],rem:{kind:"sop",ref:"SOP-R18-3",title:"Ask the owner to recertify or let the grant lapse",agent:"Ops Agent",auto:false,state:"idle",prog:"Notifies each build owner 30 days ahead and again at expiry"}},
 m_acc_denied:{n:"Requests denied",f:"Items denied ÷ all items decided × 100; a high rate means builders are asking for the wrong things",u:"%",cur:8,tgt:10,badAt:25,dir:"min",max:50,tr:[5,6,8,9,9,8,8,8],owner:"Jordan Lee",use:["Data access"],rem:{kind:"sop",ref:"SOP-R18-4",title:"Publish a guide for the sources most often denied",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists the sources and reasons behind denials"}},
 m_acc_over:{n:"Over-privileged builds",f:"Personal-tier builds holding a live grant to confidential or restricted data",u:"",cur:0,tgt:0,badAt:2,dir:"min",max:10,tr:[2,2,1,1,1,0,0,0],owner:"Rina Okafor",use:["Data access"],rem:{kind:"sop",ref:"SOP-R18-5",title:"Reduce the grant or raise the build's tier through the gate",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists the builds and the grants that exceed their tier"}}};
access.groupFor=groupFor;access.labelOf=labelOf;access.ownerOf=ownerOf;access.CANDS=CANDS;access.STATE=STATE;
access.INBOX_ADAPTER=function(){const gl=D;
 const mk=o=>{const it=Object.assign({kind:"approval",cat:"Data access",ic:"gate",title:"",req:"",ageH:12,slaH:72,dueH:72,amt:null,risk:"low",why:"",ai:null,guard:"",ev:[],extra:"",can:{approve:true,reject:true,delegate:false},blk:"",rec:"approve",needNote:false,vendor:"",sim:false,openLabel:"Open data access",open:()=>{S.v=S.v||{};S.v.r18acv=2;go("r18_access")}},o);const grpOf=h=>h<0?"Overdue":h<=24?"Due today":h<=24*7?"This week":"Later";it.group=grpOf(it.dueH);it.urgent=it.dueH<0||it.risk==="high"||it.dueH<4;it.sc=(it.urgent?0:1)*1e6+Math.max(-48,it.dueH)+100;return it};
 return{key:"r18_access",label:"Data access requests",mod:"Data access",fn:"R18.access",wired:true,
  list:()=>access.queue().filter(x=>canAct(x.i.group)).slice(0,8).map(({r,i})=>{const a=R18.app(r.app)||{n:r.app},rv=i.rv||(i.rv=review(r.app,i));return mk({id:"ar:"+i.id,src:"r18_access",sid:i.id,title:a.n+" needs "+labelOf(i.ent),req:r.by,dueH:Math.max(-24,72-24*dayDiff(r.at,TODAY)),risk:CLS.indexOf(i.cls)>=3?"high":"low",rec:rv.rec==="deny"?"reject":"approve",why:"Your group, "+i.group+", is the authoritative approver for "+labelOf(i.ent)+". The automated security review recommends: "+REC[rv.rec]+". "+rv.why,guard:"Separation of duties: the builder cannot approve their own request. Approving here applies the recommendation, including any masking.",ev:[["Build",a.n,""],["Source",labelOf(i.ent),""],["Fields",i.attrs.length+" requested",""],["Class",i.cls,""],["Review",rv.fails+" fail, "+rv.warns+" warn",""]],blk:rv.rec==="deny"?"The security review recommends denial: "+rv.why:""})}),
  approve:(it,note)=>decide(it.sid,(access.queue().find(x=>x.i.id===it.sid)||{i:{rv:{rec:"approve"}}}).i.rv.rec==="approve_masked"?"approve_masked":(access.queue().find(x=>x.i.id===it.sid)||{i:{rv:{rec:"approve"}}}).i.rv.rec==="limited"?"limited":"approve",note),
  reject:(it,why)=>decide(it.sid,"deny",why)}};
function regAdapter(){const Ad=G(()=>INBOX.adapters,null);if(!Ad||Ad.r18_access)return Ad&&!!Ad.r18_access;Ad.r18_access=access.INBOX_ADAPTER();G(()=>INBOX.refresh());return true}
let tries=0;(function t(){if(regAdapter()||++tries>20)return;setTimeout(t,800)})();
setInterval(sync,15000);
})();
