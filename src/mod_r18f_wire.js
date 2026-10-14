/* ===== Round 18, F: Feature Contract wiring for r18_builds, r18_app, r18_access, r18_lens, r18_strategy: process models, reuse-first data model,
   metrics with maturity, module map, ownership (owner AND backup), events, permissions, nav, search and Ask. Idempotent; retried until the registries exist. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;
const {G,arr}=R18;
const OWN={access:["Rina Okafor","Jordan Lee"],builds:["Jordan Lee","Sam Patel"],lens:["Avery Chen","Priya Shah"]};
const PSX=s=>({n:s[0],d:s[1],who:s[2],owner:s[3],sla:s[4],in:s[5],out:s[6]});
const SCR_A="r18_access";
const PROCS=[
 {id:"r18_data_access",screen:SCR_A,name:"How a build gets access to enterprise data",owner:OWN.access,steps:[
  ["Declare what the build needs","The builder picks each source and the fields the build uses. Only the fields needed are requested.","human","Builder","1 hour","Build","Request"],
  ["Resolve the owner of each source","Each source is matched to its authoritative owner and the group that approves access. One request is split by owner.","auto","Automatic","Instant","Request","Requests per owner group"],
  ["Run the security review","Purpose, minimum necessary, data class against the build's tier, AI exposure and named owner and backup are checked. Safe internal requests are decided by policy.","auto","Automatic","Instant","Requests per owner group","Review and recommendation"],
  ["Owner group decides","The owner group approves, approves with masking, limits the scope or denies. The builder cannot approve their own request.","gate","Data owner groups","3 working days","Review and recommendation","Decision"],
  ["Grant with an end date","Approval creates a time-boxed grant. Read access is by API under the owner's rules; no copy is made.","auto","Automatic","Instant","Decision","Grant"],
  ["Recertify or lapse","The build owner recertifies before the end date or the grant expires and the build loses the data. Any grant can be revoked at any time.","human","Build owner","30 days before end","Grant","Renewed or ended grant"]]},
 {id:"r18_build_lifecycle",screen:"r18_builds",name:"How a build is registered, checked and offered to others",owner:OWN.builds,steps:[
  ["Build in the tool you already use","A person builds in their own AI tool or the workflow designer. The skills add the guardrail components.","human","Builder","Any","Need","Build"],
  ["Generate the guardrails","Process map, metrics, maturity roadmap, debt register, data needs and gate checks are generated from the build.","auto","Automatic","Instant","Build","Eight guardrails, drafted"],
  ["Confirm the process","The owner reviews the generated process, names the objective it advances and confirms. A different backup is required.","human","Build owner","2 days","Drafted guardrails","Confirmed build"],
  ["Request data access","See How a build gets access to enterprise data.","gate","Data owner groups","3 working days","Confirmed build","Approved data"],
  ["Gate review","The governance group reviews the gate checks and sets the tier.","gate","Platform governance board","5 working days","Approved data","Certified build"],
  ["Offer to other teams","If the build overlaps no other and enough people use it, it can be offered across the enterprise.","human","Build owner","As needed","Certified build","Enterprise service"]]},
 {id:"r18_lens_review",screen:"r18_lens",name:"How an executive reviews value, cost and risk",owner:OWN.lens,steps:[
  ["Choose the lens","The executive picks the lens that matches how they weigh value, cost and risk.","human","Executive","Instant","Need","Lens"],
  ["Read the balance","Value, cost and risk figures are modeled from the live builds and labeled as illustrative.","auto","Automatic","Instant","Lens","Balance"],
  ["Open the build behind a figure","Every figure leads to the build, its process and its guardrails.","human","Executive","Any","Balance","Decision"],
  ["Act or assign","The executive asks the build owner to close a gap, merge a duplicate or scale the build.","human","Executive","Any","Decision","Assigned action"]]},
 {id:"r18_strategy_map",screen:"r18_strategy",name:"How each function is shown to enable the strategy",owner:OWN.lens,steps:[
  ["Name the objective","Each build names the strategic objective it advances; the field is required to confirm a build.","human","Build owner","At confirmation","Build","Linked build"],
  ["Place it on the map","The build appears in its function row and objective column with modeled net value.","auto","Automatic","Instant","Linked build","Map cell"],
  ["Find the gaps","Objectives with no enabling work and builds with no objective are listed.","auto","Automatic","Instant","Map cell","Gap list"],
  ["Decide where to invest","The COO or CEO asks the right function to build toward the empty objective.","human","COO or CEO","Quarterly","Gap list","Assigned build"]]}];
const fld=(k,label,type,cls)=>({k,label,type,authority:"platform",classification:cls||"internal"});
function ENTS(){return[
 {id:"access_request",label:"Data access request",domain:"plat",source:"Data access",ownerApp:SCR_A,ownerMod:SCR_A,status:"live",steward:OWN.access[0],
  note:"Integration decision: new and thin. approval (reused) carries each owner group's decision in the shared inbox; this entity holds what the build asked for, the fields and the review. Closest: approval.",
  fields:[fld("id","Request ID","string"),fld("build","Build","ref"),fld("requester","Requested by","ref","internal"),fld("purpose","Purpose","text"),fld("submitted","Submitted","date"),fld("status","Status","enum")]},
 {id:"access_grant",label:"Data access grant",domain:"plat",source:"Data access",ownerApp:SCR_A,ownerMod:SCR_A,status:"live",steward:OWN.access[0],
  note:"Integration decision: extend permission rules. A grant is a time-boxed rule in the one global permission model; the end date and recertification are kept here. No parallel permission store. Closest: permission rule.",
  fields:[fld("id","Grant ID","string"),fld("request","Request","ref"),fld("source","Source entity","string"),fld("fields","Fields granted","text"),fld("mask","Masked","boolean"),fld("approver_group","Approver group","ref"),fld("expires","Ends","date"),fld("status","Status","enum")]},
 {id:"review_finding",label:"Security review finding",domain:"sec",source:"Data access",ownerApp:SCR_A,ownerMod:SCR_A,status:"live",steward:OWN.access[0],
  note:"Integration decision: reuse gate check results. The same pass, warn, fail shape the gate uses for citizen-built apps, applied per data source. Closest: gate check.",
  fields:[fld("id","Finding ID","string"),fld("request","Request","ref"),fld("check","Check","string"),fld("result","Result","enum"),fld("evidence","Evidence","text")]},
 {id:"build_objective_link",label:"Build to objective link",domain:"plat",source:"My builds",ownerApp:"r18_builds",ownerMod:"r18_builds",status:"live",steward:OWN.builds[0],
  note:"Integration decision: reuse objective. Each build points to one existing strategic objective; nothing new is kept about the objective. Closest: objective.",
  fields:[fld("build","Build","ref"),fld("objective","Objective","ref"),fld("function","Function","string"),fld("confirmed_by","Confirmed by","ref","internal")]}]}
const M=Object.assign({},R18.accessSeedMetrics||{},{
 m_bld_cov:{n:"Guardrail coverage of builds",f:"Average over live builds of (active guardrails + half of drafted guardrails) ÷ 8 × 100",u:"%",cur:60,tgt:90,badAt:50,dir:"max",max:100,tr:[30,38,44,50,54,57,60,60],owner:OWN.builds[0],use:["My builds"],rem:{kind:"sop",ref:"SOP-R18-6",title:"Finish the missing guardrail on the build with the lowest coverage",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists the missing guardrail per build"}},
 m_bld_unlinked:{n:"Builds not tied to an objective",f:"Live builds with no strategic objective named",u:"",cur:1,tgt:0,badAt:3,dir:"min",max:10,tr:[6,5,4,3,3,2,1,1],owner:OWN.lens[0],use:["Strategy enablement"],rem:{kind:"sop",ref:"SOP-R18-7",title:"Ask the owner to choose the objective the build advances",agent:"Registry Agent",auto:false,state:"idle",prog:"Notifies the build owners"}},
 m_bld_noown:{n:"Builds without owner and backup",f:"Live builds missing a named owner or a different backup",u:"",cur:1,tgt:0,badAt:2,dir:"min",max:10,tr:[4,3,3,2,2,1,1,1],owner:OWN.builds[0],use:["My builds"],rem:{kind:"sop",ref:"SOP-R18-8",title:"Name an owner and a different backup",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists the builds"}}});
function syncB(){try{if(typeof METRICS==="undefined")return;const P=R18.portfolio();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=+(+v).toFixed(1);m.tr=m.tr.slice(0,-1).concat([m.cur])};set("m_bld_cov",P.cov);set("m_bld_unlinked",P.unlinked);set("m_bld_noown",P.noOwner)}catch(e){}}
G(()=>{if(typeof METRICS!=="undefined"){Object.keys(M).forEach(k=>{if(!METRICS[k])METRICS[k]=M[k]});syncB();G(()=>R18.access.stats())}});
const EV=[["access.requested","Data access requested"],["access.approved","Data access approved"],["access.denied","Data access denied"],["access.recertified","Data access recertified"],["access.revoked","Data access revoked"],["build.kill_switch","Build kill switch changed"],["build.confirmed","Build process confirmed"],["build.linked","Build linked to an objective"]];
const MODS=[
 {id:"r18_access",name:"Data access",sn:"Data access",own:OWN.access[0],r:["person","objective","budget_line","cost_center","approval"],w:["access_request","access_grant","review_finding"],flows:[["pull","inbox","Requests for the owner group to decide","approval","batch","Request submitted"],["push","adm_audit","Requests, decisions, revokes","audit_event","event","Decision made"],["pull","plat_gate","Build tier and checks","app_check","api","Request submitted"]]},
 {id:"r18_builds",name:"My builds",sn:"My builds",own:OWN.builds[0],r:["objective"],w:["build_objective_link"],flows:[["pull","plat_gate","Citizen-built apps and checks","app_check","api","Open"],["pull","plat_proc","Generated process","process","api","Open"]]},
 {id:"r18_lens",name:"Executive lenses",sn:"Executive lenses",own:OWN.lens[0],r:["objective","build_objective_link"],w:[],flows:[["pull","r18_builds","Builds and their figures","build_objective_link","api","Open"]]},
 {id:"r18_strategy",name:"Strategy enablement",sn:"Strategy enablement",own:OWN.lens[0],r:["objective","build_objective_link"],w:[],flows:[["pull","r18_builds","Builds and their objective","build_objective_link","api","Open"]]}];
const S_={ent:0,proc:0,mods:{},own:0,evt:0,nav:0,perm:0,tries:0,fl:0};
const exists=t=>!!G(()=>DATAMODEL.tables[t],null)||!!G(()=>PLAT.ent(t),null);
function ensurePerm(){try{if(!(W.PERM&&PERM.state&&PERM.addRule))return;
 [["r18_builds","Open My builds"],["r18_app","Open the App record"],["r18_access","Open Data access"],["r18_lens","Open Executive lenses"],["r18_strategy","Open Strategy enablement"],["r18_mature","Open Maturity roadmaps"],["r18_debt","Open Risk and debt"]].forEach(x=>{if(!PERM.state.rules.some(r=>r.res==="screen:"+x[0]))PERM.addRule({name:x[1],effect:"allow",sub:{roles:["*","!vendor_guest"]},res:"screen:"+x[0],act:["read"],when:"",why:"Anyone signed in may read; what a person can do inside depends on their role and on the owner groups of the data.",tier:"screen",kind:"seed",owner:OWN.builds[0],reviewed:G(()=>R18.TODAY,null)})});
 if(!PERM.state.rules.some(r=>r.res==="entity:access_grant"))PERM.addRule({name:"Decide data access",effect:"allow",sub:{roles:["exec","admin","finance","arch","portfolio"]},res:"entity:access_grant",act:["approve"],when:"",why:"Only the owner group of a source decides access to it. Requesters cannot approve their own.",tier:"entity",kind:"seed",owner:OWN.access[0],reviewed:G(()=>R18.TODAY,null)});S_.perm=1}catch(e){}}
function wire(){S_.tries++;
 try{if(!S_.proc&&W.PROC&&PROC.reg){PROCS.forEach(p=>{try{PROC.reg(p.screen,{title:p.name,std:["itil5","cobit"],steps:p.steps.map(PSX)})}catch(e){}})}}catch(e){}
 try{if(!S_.ent&&W.ATLAS&&ATLAS.addEntity){let ok=true;ENTS().forEach(d=>{try{const r=ATLAS.addEntity(d);if(r&&r.ok===false&&!arr(r.warnings).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});S_.ent=ok?1:0}}catch(e){}
 try{if(S_.ent&&W.MODMAP&&MODMAP.addModule){const ids=new Set(MODMAP.modules.map(m=>m.id));MODS.forEach(m=>{if(S_.mods[m.id])return;const fl=m.flows.filter(f=>ids.has(f[1])||MODS.some(x=>x.id===f[1])).map(f=>({dir:f[0],other:f[1],data:f[2],entity:f[3],mode:f[4],trig:f[5]}));
   const r=MODMAP.addModule({id:m.id,name:m.name,sn:m.sn,band:"plt",own:m.own,proposed:false,r:m.r.filter(exists),w:m.w.filter(exists),flows:fl});if(r&&(r.ok!==false||arr(r.warnings).some(w=>/already exists/.test(w))))S_.mods[m.id]=1})}}catch(e){}
 try{if(Object.keys(S_.mods).length===MODS.length&&!S_.pl&&W.PROCLIB&&PROCLIB.addProcess){let ok=true;PROCS.forEach(p=>{try{const r=PROCLIB.addProcess({id:p.id,name:p.name,module:p.screen,family:G(()=>PROCLIB.get("plat_gate").family,undefined),owner:p.owner[0],backup:p.owner[1],trigger:p.steps[0][1],steps:p.steps.map(PSX),inputs:[p.steps[0][5]],outputs:[p.steps[p.steps.length-1][6]],entities:["access_request","access_grant","review_finding","build_objective_link"].filter(exists),metrics:Object.keys(M).filter(k=>(M[k].use||[]).some(u=>new RegExp(p.screen==="r18_access"?"Data access":p.screen==="r18_builds"?"My builds":"Strategy|My builds").test(u))),model:"cmmi",target:3,std:["itil5","cobit"]});if(!(r&&(r.ok!==false||arr(r.warnings).some(w=>/already exists/.test(w)))))ok=false}catch(e){ok=false}});S_.pl=ok?1:0}}catch(e){}
 try{if(S_.pl&&!S_.own&&W.OWNX&&OWNX.assign){PROCS.forEach(p=>{OWNX.assign("process",p.id,p.owner[0],p.owner[1]);OWNX.assign("process",p.screen,p.owner[0],p.owner[1]);OWNX.assign("module",p.screen,p.owner[0],p.owner[1])});
   ENTS().forEach(e=>OWNX.assign("entity",e.id,e.steward,e.steward===OWN.access[0]?OWN.access[1]:OWN.builds[1]));Object.keys(M).forEach(m=>{const o=M[m].owner;OWNX.assign("metric",m,o,o===OWN.builds[0]?OWN.builds[1]:OWN.lens[0]===o?OWN.lens[1]:OWN.access[1])});OWNX.assign("module","r18_app",OWN.builds[0],OWN.builds[1]);S_.own=1}}catch(e){}
 try{if(S_.ent&&Object.keys(S_.mods).length===MODS.length&&W.MODMAP&&MODMAP.refresh&&!S_.fl){S_.fl=1;MODMAP.refresh()}}catch(e){}
 try{if(!S_.evt&&W.EVENTS&&EVENTS.register){EV.forEach(e=>{try{EVENTS.register({id:e[0],label:e[1],module:e[0].indexOf("access")===0?"r18_access":"r18_builds",fields:[{name:"build",type:"string"},{name:"source",type:"string"},{name:"actor",type:"string"}],owner:OWN.access[0]})}catch(x){}});S_.evt=1}}catch(e){}
 try{if(S_.ent&&W.COVER&&Array.isArray(COVER.recs)&&!S_.rec){[["ACC_REQ","Data access requests","access_request","r18_access",()=>G(()=>R18.access.stats().all.length,1)],["ACC_GRT","Data access grants","access_grant","r18_access",()=>G(()=>R18.access.stats().grants,1)]].forEach(x=>{if(!COVER.recs.some(r=>r.key===x[0]))COVER.recs.push({key:x[0],label:x[1],scr:[x[3]],mod:x[3],n:G(x[4],1),ent:x[2],how:"new",path:"R18.access"})});S_.rec=1}}catch(e){}
 ensurePerm();syncB();nav();
 if(!(S_.ent&&S_.pl&&S_.own&&S_.evt&&S_.perm&&Object.keys(S_.mods).length===MODS.length)||S_.tries<6)if(S_.tries<22)setTimeout(wire,900)}
/* ---------- navigation, search, Ask ---------- */
const NAVS=[
 ["r18_builds","make","My builds","What you built, and what stands between it and the whole organization","Your builds","builds apps citizen app record vibe code guardrails scale my apps"],
 ["r18_app","make","App record","One build with its eight guardrails","Your builds","app record build guardrails facets process data metrics maturity"],
 ["r18_access","make","Data access","Ask the owners of the data your build needs, with a security review","Access and approval","data access request approval grant permission owner security review recertify masking"],
 ["r18_mature","make","Maturity roadmaps","Where each build is and how to reach the next level","Your builds","maturity roadmap level target improve"],
 ["r18_debt","make","Risk and debt","Decisions that made today easy and will not scale","Your builds","technical debt register risk simplify scale"],
 ["r18_lens","lens","Executive lenses","See value, cost and risk the way each executive weighs them","Lenses","lens executive coo cfo caio ceo ciso cio chro value cost risk balance chief ai officer"],
 ["r18_strategy","lens","Strategy enablement","How every function enables the strategy","Lenses","strategy enablement function objective pillar map coo ceo"]];
function nav(){if(S_.nav||!(W.NAVX&&NAVX.add))return;try{NAVS.forEach(n=>NAVX.add(n[0],{group:n[1],label:n[2],hint:n[3],sub:n[4],kw:n[5]}));S_.nav=1;NAVS.forEach((n,i)=>{if(NAVX.map[n[0]])NAVX.map[n[0]].o=i-100});G(()=>R18.regroup&&R18.regroup());G(()=>{if(NAVX.int&&NAVX.int.IDX)NAVX.int.IDX.dirty=true});G(()=>R18.applyFamilies&&R18.applyFamilies())}catch(e){}}
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>{const o=NAVS.map(n=>({g:"Go to",t:n[2],m:n[3],c:"--accent",f:()=>G(()=>go(n[0])),k:n[5]}));
 G(()=>R18.apps().forEach(a=>o.push({g:"Builds",t:a.n,m:(a.builder||"")+" · "+a.status,c:"--info-f",f:()=>{R18.st.app=a.id;go("r18_app")},k:"build app "+a.n+" "+a.id+" "+(a.purpose||"")})));return o});
if(typeof ASKX!=="undefined")ASKX.push(q=>{const t=String(q||"").toLowerCase();
 if(/(access|permission).*(pending|waiting|request)|waiting on (an )?owner/.test(t)){const s=G(()=>R18.access.stats(),null);if(s)return{title:"Data access requests",body:s.pending+" requests are waiting on an owner group. Average time to decide is "+s.avg.toFixed(1)+" days; "+s.pol+"% are decided by policy.",go:"r18_access",label:"Open Data access"}}
 if(/which (builds|apps).*(not|without).*(objective|strategy)|not tied to (a )?strateg/.test(t)){const L=R18.apps().filter(a=>!R18.meta(a.id).obj).map(a=>a.n);return{title:"Builds not tied to an objective",body:L.length?L.join(", ")+".":"Every build names an objective.",go:"r18_strategy",label:"Open Strategy enablement"}}
 if(/(coo|cfo|caio|ceo|ciso|cio|chro) lens|executive lens/.test(t))return{title:"Executive lenses",body:"Each executive weighs value against cost and risk. Pick a lens from the top bar to change which figures lead.",go:"r18_lens",label:"Open Executive lenses"};
 return null});
setTimeout(wire,1500);[4000,9000,16000].forEach(t=>setTimeout(ensurePerm,t));setInterval(syncB,15000);
R18.wireState=S_;
})();
