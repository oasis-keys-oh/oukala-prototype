/* mod_plat_links: how every data element and every process connects to every other.
   Screens: plat_dmap (Data connections), plat_pmap (Process connections). Exposes window.LINKS for the debt and gate modules. */
(function(){
const E=esc;
S.plk=S.plk||{};const Z=S.plk;
Z.d=Object.assign({sel:null,ov:"domain",q:"",hop:0,apps:true,wr:true,rd:true,refs:true,pl:false,view:"auto",vb:null,col:{}},Z.d||{});
Z.p=Object.assign({sel:null,hop:0,exp:{},data:false,hub:false,view:"auto",vb:null,mx:"fam",path:0,pstep:null},Z.p||{});
Z.g=Object.assign({sel:null,vb:null},Z.g||{});
Z.lin=Z.lin||{ent:"incident",f:null};
Z.mx=Z.mx||{issues:false};
const DOM=new Proxy({},{get:(_,k)=>(window.PLAT&&PLAT.DOM)?PLAT.DOM[k]:undefined}),DORD=["service","ops","cmdb","agree","portfolio","agile","fin","people"];
const DCOL={};DORD.forEach((k,i)=>DCOL[k]=i);
const scrName=id=>{const s=SCREENS.find(x=>x[0]===id);return s?s[1]:""};
const hasScr=id=>SCREENS.some(x=>x[0]===id);
const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+"…":s;
const plural=(n,a,b)=>n+" "+(n===1?a:(b||a+"s"));
/* ---------- reference derivation: field key or label to the entity it points at ---------- */
const P_="person";
const KEY={service:"business_service",parent_service:"business_service",ci:"cmdb_ci",root_cause_ci:"cmdb_ci",parent:"cmdb_ci",child:"cmdb_ci",
 caller:P_,owner:P_,manager:P_,service_owner:P_,delivery_manager:P_,primary_contact:P_,assigned_to:P_,requested_for:P_,opened_by:P_,executor:P_,approver:P_,acknowledged_by:P_,marked_by:P_,verified_by:P_,author:P_,release_manager:P_,accountable_human:P_,person:P_,owned_by:P_,
 team:"organization_unit",assignment_group:"organization_unit",support_group:"organization_unit",managed_by_group:"organization_unit",rota:"organization_unit",
 vendor:"vendor",po:"purchase_order",budget_link:"budget_line",
 project:"project",incident:"incident",change:"change_request",request:"request_item",request_item:"request_item",skill:"skill",group:"correlation_group",standard_change:"standard_change",alert:"alert_event",definition:"sla_definition",
 offering:"service_offering",service_offering:"service_offering",cat_item:"catalog_item",feature:"feature",release:"release",story:"user_story",contract:"contract",
 wbs_link:"wbs_line",sla_link:"sla_definition",invoice_link:"invoice",raid_link:"raid_item",from:"business_service",to:"service_offering",task:["incident","request_item","change_request"]};
const OVK={"alert_event.rule":"alert_rule","runbook_execution.rule":"automation_rule","alert_rule.owner":"organization_unit","task_sla.task":["incident","request_item","change_request"],"xla_response.task":["incident","request_item"],"cost_allocation.to":"service_offering","cost_allocation.from":"business_service"};
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
function tgOf(eid,f,eset,gset){
 const k=f.k,key=eid+"."+k;let t=OVK[key]!==undefined?OVK[key]:KEY[k];
 if(t===undefined){const kk=norm(k).replace(/_link$/,""),ll=norm(f.label);
  const hit=[...eset.keys()].concat([...gset.keys()]).find(id=>id===kk||id===ll||norm((eset.get(id)||gset.get(id)).label)===ll);t=hit}
 if(!t)return[];
 return(Array.isArray(t)?t:[t]).filter(x=>eset.has(x)||gset.has(x));
}
/* ---------- the data model graph ---------- */
const nidE=id=>id,nidA=id=>"app:"+id,nidG=id=>"g:"+id;
let _M=null,_Mk=null;
function words(s){return String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3).map(w=>w.replace(/s$/,""))}
let _tn=-1;
function model(){
 const tn=Object.keys(DATAMODEL.tables).length;if(tn!==_tn){_tn=tn;PLAT.refresh()}
 const es=PLAT.entities();if(_M&&_Mk===es)return _M;
 const eset=new Map(es.map(e=>[e.id,e])),gset=new Map(PLAT.PLANNED.map(p=>[p[0],{id:p[0],domain:p[1],label:p[2],steward:p[3],why:p[4],use:p[5],ghost:true}]));
 const refs=new Map();
 es.forEach(e=>e.fields.forEach(f=>{if(f.type!=="ref"&&f.type!=="person")return;tgOf(e.id,f,eset,gset).forEach(t=>{if(t===e.id)return;const kk=e.id+"|"+t;const r=refs.get(kk)||{from:e.id,to:t,type:"ref",ghost:!eset.has(t),fields:[]};r.fields.push(f.label||f.k);refs.set(kk,r)})}));
 const raw=[];refs.forEach(r=>raw.push({from:r.from,to:r.to,type:"ref",field:r.fields.join(", "),ghost:r.ghost}));
 PLAT.APPS.forEach(a=>{a.writes.forEach(w=>{if(eset.has(w))raw.push({from:a.id,to:w,type:"write"})});a.reads.forEach(r=>{if(eset.has(r))raw.push({from:r,to:a.id,type:"read"})})});
 /* planned entities: what would connect */
 const conn={};
 gset.forEach(g=>{const ents=new Set(),apps=new Set(),why=[];let all=false;
  refs.forEach(r=>{if(r.to===g.id){ents.add(r.from);why.push(E(eset.get(r.from).label)+" points to it through "+r.fields.join(", ")+".")}});
  PLAT.FIXES.forEach(f=>{if(f.keep.split(/[ ,]+/).indexOf(g.id)>=0||f.keep===g.id){f.ents.forEach(x=>{if(eset.has(x))ents.add(x)});f.apps.forEach(a=>apps.add(a));why.push("Fix \""+E(f.t)+"\" would merge into it.")}});
  const use=String(g.use||"");if(/^(all|everything)$/i.test(use.trim())){all=true}else{
   const uw=new Set(words(use+" "+g.label));
   PLAT.APPS.forEach(a=>{if(words(a.n+" "+a.mod).some(w=>uw.has(w)))apps.add(a.id)});
   es.forEach(e=>{const ew=words(e.label);if(ew.length&&ew.every(w=>uw.has(w)))ents.add(e.id)})}
  conn[g.id]={ents:[...ents],apps:[...apps],all,why}});
 const adj=new Map();const add=(a,b,e)=>{(adj.get(a)||adj.set(a,[]).get(a)).push({id:b,e})};
 const key=e=>e.type==="read"?[nidE(e.from),nidA(e.to)]:e.type==="write"?[nidA(e.from),nidE(e.to)]:[nidE(e.from),e.ghost?nidG(e.to):nidE(e.to)];
 raw.forEach(e=>{const [a,b]=key(e);add(a,b,e);add(b,a,e)});
 _Mk=es;_M={es,eset,gset,raw,conn,adj,key,
  inRefs:id=>raw.filter(e=>e.type==="ref"&&e.to===id).map(e=>e.from),
  outRefs:id=>raw.filter(e=>e.type==="ref"&&e.from===id).map(e=>({to:e.to,field:e.field,ghost:e.ghost}))};
 return _M;
}
const appsOf=id=>{const e=PLAT.ent(id);return e?[...new Set(e.readers.concat(e.writers))]:[]};
const appN=id=>{const a=PLAT.app(id);return a?a.n:id};
const entN=id=>{const m=model(),e=m.eset.get(id)||m.gset.get(id);return e?e.label:id};
function metricsFor(appIds){
 const names=new Set();appIds.forEach(a=>{const ap=PLAT.app(a);if(ap)names.add(ap.n.toLowerCase());const s=scrName(a);if(s)names.add(s.toLowerCase())});
 return Object.keys(METRICS).filter(k=>(METRICS[k].use||[]).some(u=>names.has(String(u).toLowerCase())));
}
/* ---------- processes, families, handoffs ---------- */
const FAM=[["strat","Strategy and portfolio"],["demand","Demand"],["proj","Projects and WBS"],["agile","Agile delivery and release trains"],["chg","Change and release"],["inc","Incident and problem"],["req","Request and catalog"],["cmdb","CMDB and discovery"],["evt","Event and automation"],["obs","Observability and SLO"],["fin","Finance and invoices"],["con","Contracts and SOW"],["ppl","People, skills and on-call"],["kn","Knowledge"],["ai","AI governance"],["wf","Workflow and approvals"]];
const FIDX={};FAM.forEach((f,i)=>FIDX[f[0]]=i);
const PF={exe_dash:["Executive views","strat"],exe_risk:["Risk and date confidence","strat"],exe_apps:["Application TIME class","strat"],exe_board:["Board pack","strat"],exe_scen:["Scenario compare","strat"],exe_mat:["Capability maturity","strat"],
 exe_strat:["Strategy to work","demand"],port:["Demand to funded work","demand"],
 ims:["Master schedule","proj"],plan:["Project plan","proj"],ppm_proj:["Assigning work","proj"],ppm_raid:["Risks and issues","proj"],ppm_wbs:["Work breakdown","proj"],
 agile_board:["Sprints","agile"],agile_art:["Release trains","agile"],
 itsm_chg:["Change enablement","chg"],itsm_rel:["Release management","chg"],dev_pipe:["Delivery pipeline","chg"],obs_std:["Standard changes","chg"],
 itsm_inc:["Incidents","inc"],itsm_prb:["Problems","inc"],itsm_mi:["Major incidents","inc"],itsm_home:["Service desk rhythm","inc"],
 svc_cat:["Catalog to delivery","req"],svc_req:["Request flow","req"],svc_portal:["Ordering","req"],svc_asset:["Devices and licenses","req"],svc_notify:["Notifications","req"],chat_home:["Chat fulfillment","req"],
 itom_cmdb:["Configuration items","cmdb"],itom_model:["CMDB data model","cmdb"],itom_graph:["Impact analysis","cmdb"],itom_disc:["Discovery","cmdb"],itom_health:["CMDB health","cmdb"],svc_360:["Service portfolio","cmdb"],
 itom_evt:["Event to incident","evt"],itom_run:["Alert to action","evt"],
 obs_dash:["Metrics to dashboards","obs"],itom_slo:["SLO management","obs"],svc_sla:["Agreements and SLAs","obs"],itom_dev:["Delivery performance","obs"],
 inv:["Invoice approval","fin"],tbm_model:["Cost transparency","fin"],itom_fin:["Cloud cost","fin"],
 ppm_sow:["Vendor to contract","con"],
 svc_oncall:["On-call cover","ppl"],svc_skills:["Skills and availability","ppl"],ppl_org:["Joiners and movers","ppl"],ppl_perf:["Performance cycle","ppl"],ppl_cap:["Resource planning","ppl"],ppl_jrny:["Journey to workflow","ppl"],
 kcs_home:["Knowledge flow","kn"],kcs_gap:["Search gap to article","kn"],kcs_edit:["Article lifecycle","kn"],kcs_ask:["Answer building","kn"],vault:["Knowledge graph","kn"],kcs_viz:["Visual builder","kn"],
 kcs_skills:["Agent skills","ai"],kcs_prompt:["Prompt release","ai"],kcs_test:["AI quality tests","ai"],
 flw_design:["Workflow design","wf"],flw_appr:["Approvals","wf"],flw_asmt:["Assessments","wf"],flw_dmn:["Decision tables","wf"]};
const PREF=[[/^itsm_/,"inc"],[/^itom_/,"cmdb"],[/^svc_/,"req"],[/^ppm_/,"proj"],[/^kcs_/,"kn"],[/^flw_/,"wf"],[/^exe_/,"strat"],[/^ppl_/,"ppl"],[/^bud_/,"fin"],[/^agile_/,"agile"],[/^obs_/,"obs"],[/^tbm_/,"fin"]];
function procIds(){
 return Object.keys(PROC.defs).filter(k=>!/_t\d+$/.test(k)&&!/^plat_/.test(k)).filter(k=>PF[k]||PREF.some(p=>p[0].test(k)));
}
const pFam=id=>PF[id]?PF[id][1]:(PREF.find(p=>p[0].test(id))||[0,"wf"])[1];
const pName=id=>PF[id]?PF[id][0]:(PROC.defs[id]?PROC.defs[id].title:id);
const PX={ims:{r:["project","project_task","wbs_line","person"],w:["project_task"]},plan:{r:["project","wbs_line"],w:["project_task","wbs_line"]},ppm_raid:{r:["project","person"],w:["raid_item"]},
 exe_dash:{r:["project","business_service","slo","invoice"]},exe_strat:{r:["demand_request","project","maturity_capability"]},exe_risk:{r:["raid_item","project","project_task"]},exe_apps:{r:["business_service","cmdb_ci","cost_allocation"]},exe_board:{r:["project","invoice","raid_item","cost_allocation"]},exe_scen:{r:["project","cost_allocation","project_task"]},
 dev_pipe:{r:["change_request","release","pull_request"],w:["release_task"]},itom_dev:{r:["release","change_request","incident"]},itsm_mi:{r:["incident","business_service"],w:["incident"]},itsm_home:{r:["incident","request_item","task_sla"]},
 itom_model:{r:["cmdb_ci","cmdb_rel_ci"],w:["cmdb_rel_ci"]},itom_graph:{r:["cmdb_ci","cmdb_rel_ci","business_service"]},itom_disc:{r:["cmdb_ci"],w:["cmdb_ci"]},itom_health:{r:["cmdb_ci","cmdb_rel_ci","asset"]},itom_fin:{r:["cmdb_ci","asset"],w:["cost_allocation"]},
 svc_req:{r:["catalog_item","person"],w:["request_item","fulfillment_step"]},svc_portal:{r:["catalog_item","service_offering"],w:["request_item"]},svc_asset:{r:["request_item","person"],w:["asset"]},svc_notify:{r:["person","incident","change_request","request_item"]},chat_home:{r:["incident","request_item","person"],w:["request_item"]},svc_360:{r:["business_service","cmdb_ci","incident","project"]},
 itom_slo:{r:["metric_series","business_service"],w:["slo"]},obs_std:{r:["automation_rule","change_request"],w:["standard_change"]},tbm_model:{r:["invoice","business_service"],w:["cost_allocation","scaling_step"]},
 ppl_perf:{r:["person","skill_claim","project_task"]},ppl_cap:{r:["person","time_off","project_task","oncall_shift"]},ppl_jrny:{r:["person"]},
 kcs_home:{r:["incident","request_item"]},kcs_gap:{r:["incident","request_item"]},kcs_edit:{r:["incident","problem_record"]},kcs_ask:{r:["incident"]},vault:{r:["business_service","cmdb_ci"]},kcs_skills:{r:["person","skill_claim"]},
 flw_design:{r:["change_approval_policy"]}};
const PAL={tbm_model:"bud_over"};
const inE=id=>!!model().eset.get(id);
const _pe={};
function pEnts(id){
 if(_pe[id]&&_pe[id].k===model().es)return _pe[id].v;
 const a=PLAT.app(id)||PLAT.app(PAL[id]||""),x=PX[id]||{};
 const r=new Set((a?a.reads:[]).concat(x.r||[]).filter(inE)),w=new Set((a?a.writes:[]).concat(x.w||[]).filter(inE));
 const v={r:[...r],w:[...w],all:[...new Set([...r,...w])]};_pe[id]={k:model().es,v};return v;
}
/* handoffs: from, to, carried entities (registry ids or planned ids), trigger, mode */
const HO=[
 ["exe_strat","port",["demand_request"],"Objective approved","human"],
 ["port","ppm_proj",["demand_request","project"],"Demand funded","event"],
 ["ppm_proj","ppm_wbs",["project","wbs_line"],"Project approved to plan","human"],
 ["ppm_wbs","ims",["wbs_line","project_task"],"Nightly schedule rollup","batch"],
 ["plan","ims",["project_task"],"Plan baselined","event"],
 ["ims","plan",["project_task"],"Schedule variance sent back","batch"],
 ["ppm_proj","ppm_raid",["project","raid_item"],"Risk raised on a project","event"],
 ["ppm_raid","exe_risk",["raid_item"],"Weekly risk rollup","batch"],
 ["ims","exe_risk",["project_task"],"Date confidence refresh","batch"],
 ["ims","exe_dash",["project","project_task"],"Dashboard refresh","batch"],
 ["exe_risk","exe_board",["raid_item","project"],"Board pack assembly","human"],
 ["exe_apps","exe_board",["business_service","cost_allocation"],"Quarterly board cycle","human"],
 ["exe_mat","exe_strat",["maturity_capability"],"Maturity review","batch"],
 ["ppm_proj","agile_board",["project","user_story"],"Backlog opened for a project","human"],
 ["agile_art","agile_board",["feature","user_story"],"Planning increment starts","event"],
 ["agile_board","itsm_rel",["user_story","release"],"Stories done for a release","event"],
 ["agile_art","itsm_rel",["feature","release"],"Train cut","event"],
 ["itsm_rel","itsm_chg",["release","change_request"],"Release needs a change record","event"],
 ["dev_pipe","itsm_chg",["pull_request","change_request"],"Pipeline raises change","event"],
 ["itsm_chg","itsm_rel",["change_request"],"Approval result returns","event"],
 ["obs_std","itsm_chg",["standard_change"],"Pre-approved change used","event"],
 ["itsm_chg","itom_cmdb",["change_request","cmdb_ci"],"Change closes, CI updated","event"],
 ["itsm_chg","itsm_inc",["change_request","incident"],"Change linked to an incident","event"],
 ["itsm_chg","flw_appr",["change_request"],"Approval requested","event"],
 ["flw_appr","itsm_chg",["change_request"],"Decision recorded","event"],
 ["dev_pipe","itom_dev",["release","change_request"],"Deploy event for metrics","batch"],
 ["itom_evt","itsm_inc",["alert_event","incident"],"Correlated alert becomes incident","event"],
 ["itsm_inc","itsm_mi",["incident"],"Severity 1 declared","event"],
 ["itsm_inc","itsm_prb",["incident","problem_record"],"Repeat incident pattern","human"],
 ["itsm_prb","itsm_chg",["problem_record","change_request"],"Permanent fix needs a change","human"],
 ["itsm_prb","kcs_gap",["problem_record","knowledge_article"],"Known error documented","human"],
 ["itsm_inc","svc_sla",["incident","task_sla"],"Clock starts","event"],
 ["itsm_inc","svc_notify",["incident","notification"],"Status update sent","event"],
 ["kcs_edit","itsm_inc",["knowledge_article"],"Article suggested on a ticket","event"],
 ["svc_cat","svc_req",["catalog_item","request_item"],"Item ordered","event"],
 ["svc_portal","svc_req",["request_item"],"Order placed","event"],
 ["chat_home","svc_req",["request_item"],"Request made in chat","event"],
 ["svc_req","svc_asset",["request_item","asset"],"Device or license fulfilled","event"],
 ["svc_req","flw_appr",["request_item"],"Approval needed","event"],
 ["flw_appr","svc_req",["request_item"],"Approved or rejected","event"],
 ["svc_req","svc_sla",["request_item","task_sla"],"Clock starts","event"],
 ["itom_disc","itom_cmdb",["cmdb_ci"],"Nightly discovery load","batch"],
 ["itom_health","itom_cmdb",["cmdb_ci"],"Quality fix list","batch"],
 ["itom_cmdb","itom_graph",["cmdb_ci","cmdb_rel_ci"],"Relationships refreshed","batch"],
 ["itom_cmdb","itom_evt",["cmdb_ci","business_service"],"Alerts enriched with service","event"],
 ["itom_graph","itsm_chg",["business_service","cmdb_ci"],"Impact analysis on a change","event"],
 ["itom_evt","itom_run",["alert_event","standard_change"],"Runbook matched","event"],
 ["itom_run","itsm_inc",["runbook_execution","incident"],"Auto-fix failed, ticket opened","event"],
 ["obs_dash","itom_slo",["metric_series","slo"],"Metrics feed objectives","batch"],
 ["itom_slo","svc_sla",["slo","sla_definition"],"Objective compared to agreement","batch"],
 ["svc_sla","ppm_sow",["task_sla","contract_obligation"],"Credits claimed from a vendor","batch"],
 ["ppm_sow","inv",["contract","invoice"],"Invoice matched to contract","batch"],
 ["inv","flw_appr",["invoice"],"Invoice approval","event"],
 ["flw_appr","inv",["invoice"],"Decision recorded","event"],
 ["inv","tbm_model",["invoice","cost_allocation"],"Posted invoice allocated","batch"],
 ["itom_fin","tbm_model",["cost_allocation"],"Cloud bill allocated","batch"],
 ["tbm_model","exe_board",["cost_allocation"],"Cost view for the board","batch"],
 ["tbm_model","exe_scen",["cost_allocation","scaling_step"],"Scaling scenario","human"],
 ["ppl_org","svc_oncall",["person"],"Joiner or leaver","event"],
 ["ppl_org","svc_skills",["person","skill_claim"],"New person needs a profile","event"],
 ["ppl_org","ppl_cap",["person"],"Headcount change","batch"],
 ["svc_skills","ppm_proj",["skill_claim","person"],"Skill match for assignment","human"],
 ["ppl_cap","ppm_proj",["person","time_off"],"Capacity for assignment","batch"],
 ["svc_oncall","itsm_inc",["oncall_shift","person"],"Page the on-call person","event"],
 ["ppl_perf","ppl_cap",["person"],"Review outcome informs planning","batch"],
 ["kcs_gap","kcs_edit",["knowledge_article"],"Gap becomes a draft","human"],
 ["kcs_edit","kcs_home",["knowledge_article"],"Article published","event"],
 ["kcs_home","kcs_ask",["knowledge_article"],"Index refreshed","batch"],
 ["kcs_home","vault",["knowledge_article"],"Graph updated","batch"],
 ["kcs_ask","kcs_gap",["knowledge_article"],"Unanswered question","event"],
 ["kcs_skills","kcs_test",["knowledge_article"],"Skill needs a test","event"],
 ["kcs_prompt","kcs_test",["knowledge_article"],"Prompt change needs a test","event"],
 ["kcs_test","kcs_skills",["knowledge_article"],"Test result","event"],
 ["flw_design","flw_appr",["approval_policy"],"Workflow publishes an approval step","event"],
 ["flw_dmn","flw_appr",["approval_policy"],"Decision table routes approvals","event"],
 ["flw_asmt","exe_mat",["maturity_capability"],"Assessment sets a level","batch"]
];
function validHO(){const ids=new Set(procIds());return HO.filter(h=>ids.has(h[0])&&ids.has(h[1])).map(h=>({from:h[0],to:h[1],entities:h[2],trigger:h[3],mode:h[4],kind:"handoff"}))}
/* data dependencies: p writes an entity q reads. Shared entities between every pair. */
let _PG=null,_PGk=null;
function pgraph(){
 const ids=procIds(),key=ids.join(",")+"|"+model().es.length;if(_PG&&_PGk===key)return _PG;
 const ho=validHO(),cnt={};ids.forEach(p=>pEnts(p).all.forEach(e=>cnt[e]=(cnt[e]||0)+1));
 const hubs=new Set(Object.keys(cnt).filter(e=>cnt[e]>=9));
 const dep=[],shared={};
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j],A=pEnts(a),B=pEnts(b);const common=A.all.filter(x=>B.all.indexOf(x)>=0);
  if(common.length)shared[a+"|"+b]=shared[b+"|"+a]=common;
  const ab=A.w.filter(x=>B.r.indexOf(x)>=0&&!hubs.has(x)),ba=B.w.filter(x=>A.r.indexOf(x)>=0&&!hubs.has(x));
  if(ab.length)dep.push({from:a,to:b,entities:ab,kind:"data"});
  if(ba.length)dep.push({from:b,to:a,entities:ba,kind:"data"});
 }
 const touch={};ids.forEach(p=>touch[p]=new Set(pEnts(p).all));
 _PGk=key;_PG={ids,ho,hubs,cnt,dep,shared,touch};return _PG;
}
const procsTouching=(e)=>pgraph().ids.filter(p=>pgraph().touch[p].has(e));
function downstream(pid){
 const g=pgraph(),seen=new Map([[pid,0]]);let fr=[pid];const edges=g.ho.concat(g.dep);
 while(fr.length){const nx=[];fr.forEach(u=>edges.forEach(e=>{if(e.from===u&&!seen.has(e.to)&&(e.kind!=="data"||u===pid)){seen.set(e.to,seen.get(u)+1);nx.push(e.to)}}));fr=nx}
 seen.delete(pid);const ps=[...seen.keys()];const ents=new Set();
 edges.forEach(e=>{if(e.from===pid||seen.has(e.from))e.entities.forEach(x=>ents.add(x))});
 const real=[...ents].filter(inE);const apps=new Set();real.forEach(x=>appsOf(x).forEach(a=>apps.add(a)));
 return{procs:ps,depth:seen,entities:[...ents],apps:[...apps],real};
}
/* ---------- public API ---------- */
function blast(entityId){
 const m=model(),e=PLAT.ent(entityId);if(!e)return null;
 const aff=new Map([[entityId,0]]);let fr=[entityId];
 for(let d=1;d<=2;d++){const nx=[];fr.forEach(x=>m.inRefs(x).forEach(y=>{if(!aff.has(y)){aff.set(y,d);nx.push(y)}}));fr=nx}
 const ents=[...aff.keys()].filter(x=>x!==entityId);const apps=new Set(),all=[entityId].concat(ents);
 all.forEach(x=>appsOf(x).forEach(a=>apps.add(a)));
 const procs=pgraph().ids.filter(p=>all.some(x=>pgraph().touch[p].has(x)));
 const mets=metricsFor([...apps]);
 return{entity:entityId,label:e.label,entities:ents,apps:[...apps],directApps:appsOf(entityId),processes:procs,metrics:mets,
  counts:{entities:ents.length,apps:apps.size,processes:procs.length,metrics:mets.length}};
}
window.LINKS={
 edgesData(){return model().raw.map(e=>Object.assign({},e))},
 processEdges(){const g=pgraph();return g.ho.map(h=>Object.assign({},h)).concat(g.dep.map(d=>Object.assign({mode:"data"},d)))},
 processes(){return pgraph().ids.map(id=>({id,name:pName(id),family:pFam(id),entities:pEnts(id)}))},
 blast,
 processBlast(pid){const r=downstream(pid);return{process:pid,processes:r.procs,entities:r.entities,apps:r.apps}},
 families:FAM.map(f=>({id:f[0],name:f[1]})),
 stats:()=>stats()
};
function stats(){
 const m=model(),g=pgraph(),es=m.es;
 const withW=es.filter(e=>e.writers.length>0),single=withW.filter(e=>e.writers.length===1);
 const conn=new Set();m.raw.forEach(e=>{if(e.type==="ref"){conn.add(e.from);if(!e.ghost)conn.add(e.to)}else if(e.type==="write")conn.add(e.to);else conn.add(e.from)});
 const hoSet=new Set();g.ho.forEach(h=>{hoSet.add(h.from);hoSet.add(h.to)});
 const touched=Object.keys(g.cnt),reused=touched.filter(e=>g.cnt[e]>=2);
 const noShare=g.ids.filter(p=>!g.ids.some(q=>q!==p&&g.shared[p+"|"+q]));
 const noHand=g.ids.filter(p=>!hoSet.has(p));
 const pw={};g.ids.forEach(p=>pEnts(p).w.forEach(e=>(pw[e]=pw[e]||[]).push(p)));
 const multiP=Object.keys(pw).filter(e=>pw[e].length>1);
 const noWriter=es.filter(e=>!e.writers.length&&g.cnt[e.id]);
 return{entities:es.length,single:single.length,withW:withW.length,connected:conn.size,isolated:es.filter(e=>!conn.has(e.id)).map(e=>e.id),hoCount:g.ho.length,hoProcs:hoSet.size,procs:g.ids.length,
  touched:touched.length,reused:reused.length,noShare,noHand,multiP,pw,noWriter,hubs:[...g.hubs],dataDeps:g.dep.length};
}
Object.assign(METRICS,{
 m_plk_single:{n:"Entities with a single writer",f:"Entities that exactly one app writes ÷ entities that any app writes × 100",u:"%",cur:80,tgt:90,badAt:65,dir:"max",max:100,tr:[60,64,68,72,75,77,79,80],owner:"Data council",use:["Data connections","Process connections"],rem:{kind:"agent",ref:"AG-LNK1",title:"Propose one owning app per shared entity",agent:"Registry Agent",auto:false,state:"idle",prog:"Names the likely owner from who creates most records and drafts the change"}},
 m_plk_hand:{n:"Processes with documented handoffs",f:"Processes with at least one documented handoff in or out ÷ all processes × 100",u:"%",cur:90,tgt:100,badAt:75,dir:"max",max:100,tr:[55,62,70,76,82,86,88,90],owner:"Process governance lead",use:["Process connections"],rem:{kind:"sop",ref:"SOP-720",title:"Document a handoff between two processes",agent:"Process Agent",auto:false,state:"idle",prog:"Suggests handoffs from shared data and trigger events"}},
 m_plk_reuse:{n:"Cross-process data reuse",f:"Entities used by two or more processes ÷ entities used by any process × 100",u:"%",cur:70,tgt:75,badAt:50,dir:"max",max:100,tr:[40,46,52,58,62,66,68,70],owner:"Platform team",use:["Data connections","Process connections"],rem:{kind:"kb",ref:"KB0720",title:"Share data through the registry, not copies",agent:"Registry Agent",auto:false,state:"idle",prog:"Flags a process that keeps its own copy of a registered entity"}},
 m_plk_conn:{n:"Entities connected to the model",f:"Entities with at least one reference, reader or writer ÷ all entities × 100",u:"%",cur:95,tgt:100,badAt:85,dir:"max",max:100,tr:[80,84,88,90,92,93,94,95],owner:"Data council",use:["Data connections"],rem:{kind:"sop",ref:"SOP-721",title:"Connect or retire an isolated entity",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists isolated entities with suggested references"}}
});
function syncMetrics(){const s=stats();
 METRICS.m_plk_single.cur=s.withW?Math.round(100*s.single/s.withW):100;
 METRICS.m_plk_hand.cur=s.procs?Math.round(100*s.hoProcs/s.procs):100;
 METRICS.m_plk_reuse.cur=s.touched?Math.round(100*s.reused/s.touched):100;
 METRICS.m_plk_conn.cur=s.entities?Math.round(100*s.connected/s.entities):100;
 return s}
