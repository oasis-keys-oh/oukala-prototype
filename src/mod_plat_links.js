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
const KEY={service:"business_service",parent_service:"business_service",ci:"config_item",root_cause_ci:"config_item",parent:"config_item",child:"config_item",
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
 const tn=DATAMODEL.cnt();if(tn!==_tn){_tn=tn;PLAT.refresh()}
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
const FAM=[["strat","Strategy and portfolio"],["demand","Demand"],["proj","Projects and WBS"],["agile","Agile delivery and release trains"],["chg","Change and release"],["inc","Incident and problem"],["req","Request and catalog"],["cmdb","CMDB and discovery"],["evt","Event and automation"],["obs","Observability and SLO"],["fin","Finance and invoices"],["con","Contracts and SOW"],["ppl","People, skills and on-call"],["kn","Knowledge"],["ai","AI governance"],["wf","Workflow and approvals"],["gov","Security, audit and platform governance"]];
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
 bud_ben:["Benefits realization","strat"],bud_over:["Budget control","fin"],bud_model:["Financial model and forecast","fin"],bud_doa:["Delegation of authority","fin"],bud_ven:["Vendor and contract management","con"],
 adm_gate:["AI gateway and token spend","ai"],tower:["AI oversight and control","ai"],adm_sec:["Access and security administration","gov"],adm_audit:["Audit and compliance evidence","gov"],
 flw_design:["Workflow design","wf"],flw_appr:["Approvals","wf"],flw_asmt:["Assessments","wf"],flw_dmn:["Decision tables","wf"]};
const PREF=[[/^itsm_/,"inc"],[/^itom_/,"cmdb"],[/^svc_/,"req"],[/^ppm_/,"proj"],[/^kcs_/,"kn"],[/^flw_/,"wf"],[/^exe_/,"strat"],[/^ppl_/,"ppl"],[/^bud_/,"fin"],[/^agile_/,"agile"],[/^obs_/,"obs"],[/^tbm_/,"fin"]];
function procIds(){
 return Object.keys(PROC.defs).filter(k=>!/_t\d+$/.test(k)&&!/^plat_/.test(k)).filter(k=>PF[k]||PREF.some(p=>p[0].test(k)));
}
const pFam=id=>PF[id]?PF[id][1]:(PREF.find(p=>p[0].test(id))||[0,"wf"])[1];
const pName=id=>PF[id]?PF[id][0]:(PROC.defs[id]?PROC.defs[id].title:id);
const PX={ims:{r:["project","project_task","wbs_line","person"],w:["project_task"]},plan:{r:["project","wbs_line"],w:["project_task","wbs_line"]},ppm_raid:{r:["project","person"],w:["raid_item"]},
 exe_dash:{r:["project","business_service","slo","invoice"]},exe_strat:{r:["demand_request","project","maturity_capability"]},exe_risk:{r:["raid_item","project","project_task"]},exe_apps:{r:["business_service","config_item","cost_allocation"]},exe_board:{r:["project","invoice","raid_item","cost_allocation"]},exe_scen:{r:["project","cost_allocation","project_task"]},
 dev_pipe:{r:["change_request","release","pull_request"],w:["release_task"]},itom_dev:{r:["release","change_request","incident"]},itsm_mi:{r:["incident","business_service"],w:["incident"]},itsm_home:{r:["incident","request_item","task_sla"]},
 itom_model:{r:["config_item","cmdb_rel_ci"],w:["cmdb_rel_ci"]},itom_graph:{r:["config_item","cmdb_rel_ci","business_service"]},itom_disc:{r:["config_item"],w:["config_item"]},itom_health:{r:["config_item","cmdb_rel_ci","asset"]},itom_fin:{r:["config_item","asset"],w:["cost_allocation"]},
 svc_req:{r:["catalog_item","person"],w:["request_item","fulfillment_step"]},svc_portal:{r:["catalog_item","service_offering"],w:["request_item"]},svc_asset:{r:["request_item","person"],w:["asset"]},svc_notify:{r:["person","incident","change_request","request_item"]},chat_home:{r:["incident","request_item","person"],w:["request_item"]},svc_360:{r:["business_service","config_item","incident","project"]},
 itom_slo:{r:["metric_series","business_service"],w:["slo"]},obs_std:{r:["automation_rule","change_request"],w:["standard_change"]},tbm_model:{r:["invoice","business_service"],w:["cost_allocation","scaling_step"]},
 ppl_perf:{r:["person","skill_claim","project_task"]},ppl_cap:{r:["person","time_off","project_task","oncall_shift"]},ppl_jrny:{r:["person"]},
 kcs_home:{r:["incident","request_item"]},kcs_gap:{r:["incident","request_item"]},kcs_edit:{r:["incident","problem_record"]},kcs_ask:{r:["incident"]},vault:{r:["business_service","config_item"]},kcs_skills:{r:["person","skill_claim"]},
 flw_design:{r:["change_approval_policy"]},
 bud_ben:{r:["project","demand_request"]},bud_over:{r:["invoice"],w:["cost_allocation"]},bud_model:{r:["cost_allocation"]},bud_doa:{r:["person","change_approval_policy"]},bud_ven:{r:["contract","invoice"],w:["contract_obligation"]},
 adm_gate:{r:["cost_allocation"]},tower:{r:["alert_event","runbook_execution"],w:["false_positive_feedback"]},adm_sec:{r:["person"]},adm_audit:{r:["person","change_request"]}};
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
 ["itsm_chg","itom_cmdb",["change_request","config_item"],"Change closes, CI updated","event"],
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
 ["itom_disc","itom_cmdb",["config_item"],"Nightly discovery load","batch"],
 ["itom_health","itom_cmdb",["config_item"],"Quality fix list","batch"],
 ["itom_cmdb","itom_graph",["config_item","cmdb_rel_ci"],"Relationships refreshed","batch"],
 ["itom_cmdb","itom_evt",["config_item","business_service"],"Alerts enriched with service","event"],
 ["itom_graph","itsm_chg",["business_service","config_item"],"Impact analysis on a change","event"],
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
 ["flw_asmt","exe_mat",["maturity_capability"],"Assessment sets a level","batch"],
 ["ppm_proj","bud_ben",["project"],"Project approved with a business case","event"],
 ["bud_ben","exe_strat",["project","demand_request"],"Benefit review feeds strategy","batch"],
 ["inv","bud_over",["invoice","cost_allocation"],"Invoice posted against a budget line","batch"],
 ["bud_over","bud_model",["cost_allocation"],"Month-end actuals","batch"],
 ["bud_model","exe_board",["cost_allocation"],"Forecast for the board","batch"],
 ["bud_doa","flw_appr",["change_approval_policy"],"Limits applied to approval routing","event"],
 ["bud_doa","inv",["invoice"],"Invoice approver chosen by amount","event"],
 ["ppm_sow","bud_ven",["contract"],"Contract signed","event"],
 ["bud_ven","inv",["contract","invoice"],"Vendor invoices matched to contract","batch"],
 ["bud_ven","ppm_sow",["contract_obligation"],"Renewal or change needs a contract review","human"],
 ["adm_gate","tbm_model",["cost_allocation"],"AI token cost allocated","batch"],
 ["adm_gate","tower",["alert_event"],"Spend and policy events","event"],
 ["kcs_test","tower",["alert_event"],"Test results feed oversight","batch"],
 ["tower","kcs_skills",["false_positive_feedback"],"Guardrail finding becomes a skill fix","human"],
 ["ppl_org","adm_sec",["person"],"Joiner, mover or leaver changes access","event"],
 ["adm_sec","flw_appr",["person"],"Privileged access needs approval","event"],
 ["adm_sec","adm_audit",["person"],"Access evidence for audit","batch"],
 ["tower","adm_audit",["alert_event"],"Agent oversight evidence","batch"],
 ["bud_over","adm_audit",["cost_allocation"],"Budget control evidence","batch"],
 ["adm_audit","exe_risk",["raid_item"],"Findings feed the risk register","batch"],
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
/* ---------- graph engine: layout helpers, svg frame, pan and zoom ---------- */
function clip(cx,cy,w,h,tx,ty){const dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return[cx,cy];const sx=dx?(w/2)/Math.abs(dx):1e9,sy=dy?(h/2)/Math.abs(dy):1e9,s=Math.min(sx,sy);return[cx+dx*s,cy+dy*s]}
function curve(a,b,bend){
 const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;
 const p1=clip(ax,ay,a.w,a.h,bx,by),p2=clip(bx,by,b.w,b.h,ax,ay);
 const dx=p2[0]-p1[0],dy=p2[1]-p1[1],len=Math.hypot(dx,dy)||1,off=Math.min(46,len*.14)*(bend||1);
 const mx=(p1[0]+p2[0])/2-dy/len*off,my=(p1[1]+p2[1])/2+dx/len*off;
 return{d:`M${p1[0].toFixed(1)},${p1[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`,mid:[(p1[0]+2*mx+p2[0])/4,(p1[1]+2*my+p2[1])/4]};
}
function boundsOf(list){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;list.forEach(n=>{x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+n.w);y1=Math.max(y1,n.y+n.h)});if(x0>x1)return[0,0,400,300];return[x0-24,y0-24,x1-x0+48,y1-y0+48]}
function markers(k){return `<defs>${["ref","wr","rd","pl","ev","ba","hu","dt"].map(t=>`<marker id="plk-ar-${k}-${t}" class="plk-mk ${t}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z"/></marker>`).join("")}</defs>`}
let lastAR=1.6;
function svgFrame(k,vb,body,label,cls){
 lastAR=vb[2]/vb[3];
 return `<svg class="plk-svg ${cls||""}" data-plk-vp="${k}" data-fit="${vb.map(v=>Math.round(v)).join(" ")}" viewBox="${vb.map(v=>+v.toFixed(1)).join(" ")}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${E(label)}" tabindex="0">${markers(k)}${body}</svg>`;
}
const stateOf=k=>k==="d"?Z.d:k==="p"?Z.p:Z.g;
function vbFor(k,fit){const s=stateOf(k);return s.vb&&s.vb.length===4?s.vb:fit}
function zoomVp(k,f){ /* f: factor (>1 zoom in), "fit" */
 const svg=document.querySelector(`[data-plk-vp="${k}"]`);if(!svg)return;const s=stateOf(k);
 const fit=svg.dataset.fit.split(" ").map(Number);
 if(f==="fit"){s.vb=null;svg.setAttribute("viewBox",fit.join(" "));return}
 const cur=svg.getAttribute("viewBox").split(" ").map(Number),cx=cur[0]+cur[2]/2,cy=cur[1]+cur[3]/2,w=cur[2]/f,h=cur[3]/f;
 if(w>fit[2]*2.5||w<fit[2]/12)return;
 const nv=[cx-w/2,cy-h/2,w,h];s.vb=nv;svg.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "));
}
function panVp(k,dx,dy){const svg=document.querySelector(`[data-plk-vp="${k}"]`);if(!svg)return;const cur=svg.getAttribute("viewBox").split(" ").map(Number);const nv=[cur[0]+dx,cur[1]+dy,cur[2],cur[3]];stateOf(k).vb=nv;svg.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "))}
const zoomBar=k=>`<div class="plk-zoom" role="group" aria-label="Zoom and pan"><button class="btn quiet" data-plk-zoom="${k}:out" aria-label="Zoom out">−</button><button class="btn quiet" data-plk-zoom="${k}:in" aria-label="Zoom in">+</button><button class="btn quiet" data-plk-zoom="${k}:fit">Fit</button></div>`;
const seg=(label,items,attr)=>`<div class="plk-seg" role="group" aria-label="${E(label)}"><span class="small muted">${E(label)}</span>${items.map(i=>`<button type="button" class="${i[2]?"on":""}" aria-pressed="${!!i[2]}" ${attr}="${E(i[0])}">${E(i[1])}</button>`).join("")}</div>`;
const togBtn=(k,label,on,title)=>`<button type="button" class="plk-tog ${on?"on":""}" aria-pressed="${on}" data-plk-tog="${k}" ${title?`title="${E(title)}"`:""}>${E(label)}</button>`;
/* ---------- overlays: what the node color means ---------- */
const AUTHC={platform:"--s3",external:"--p1",shared:"--w1"},CLSC={public:"--faint",internal:"--p5",confidential:"--w1",restricted:"--e1",personal:"--u3"};
function authOf(e){let best="platform",n=-1;["platform","external","shared"].forEach(k=>{if((e.authMix[k]||0)>n){n=e.authMix[k]||0;best=k}});return best}
function ovVar(e){
 switch(Z.d.ov){
  case"auth":return AUTHC[authOf(e)];
  case"cls":return CLSC[e.cls]||"--faint";
  case"dup":return e.status==="duplicate"?"--e1":e.status==="fixed"?"--p1":e.writers.length>1?"--w1":"--s3";
  default:return"--plk-c"+DCOL[e.domain];
 }
}
function ovLegend(){
 switch(Z.d.ov){
  case"auth":return legend([["Mostly platform authority","--s3"],["Mostly external authority","--p1"],["Mostly shared authority","--w1"]]);
  case"cls":return legend([["Public","--faint"],["Internal","--p5"],["Confidential","--w1"],["Restricted","--e1"],["Personal","--u3"]]);
  case"dup":return legend([["Single writer, canonical","--s3"],["Two or more writers","--w1"],["Known duplicate","--e1"],["Duplicate fixed","--p1"]]);
  default:return legend(DORD.map(d=>[DOM[d].n,"--plk-c"+DCOL[d]]));
 }
}
const edgeLegend=`<div class="legend plk-elg" role="note"><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ref"/></svg>Entity points to entity (field reference)</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e wr"/></svg>App writes</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e rd"/></svg>App reads</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e pl"/></svg>Planned link</span><span class="plk-sh"><i class="plk-shp sent"></i>Entity</span><span class="plk-sh"><i class="plk-shp sapp"></i>App or screen</span><span class="plk-sh"><i class="plk-shp sgh"></i>Planned entity</span></div>`;
/* ---------- data connections: layout ---------- */
const CW=150,CH=28,GX=10,GY=8,PX_=12,HEAD=38,GAP=26;
function mkNode(id,kind,x,y,o){return Object.assign({id,kind,x,y,w:CW,h:CH},o||{})}
function layoutD(){
 const m=model(),D=Z.d,doms=mpGet("plk_dom"),nodes=new Map(),boxes=[];
 const focus=D.hop>0&&D.sel&&!/^dom:/.test(D.sel);
 const entNode=e=>mkNode(e.id,"ent",0,0,{label:e.label,e,v:ovVar(e)});
 const appNode=a=>mkNode(nidA(a.id),"app",0,0,{label:a.n,app:a});
 const gNode=g=>mkNode(nidG(g.id),"gh",0,0,{label:g.label,g});
 if(focus){
  const seen=new Map([[D.sel,0]]);let fr=[D.sel];
  for(let d=1;d<=D.hop;d++){const nx=[];fr.forEach(u=>(m.adj.get(u)||[]).forEach(({id,e})=>{
    if(seen.has(id))return;
    if(e.type==="ref"&&!D.refs)return;if(e.type==="write"&&!D.wr)return;if(e.type==="read"&&!D.rd)return;
    if(/^app:/.test(id)&&!D.apps)return;if(/^g:/.test(id)&&!D.pl)return;
    seen.set(id,d);nx.push(id)}));fr=nx}
  const rings={};seen.forEach((d,id)=>{(rings[d]=rings[d]||[]).push(id)});
  const mk=id=>/^app:/.test(id)?appNode(PLAT.app(id.slice(4))):/^g:/.test(id)?gNode(m.gset.get(id.slice(2))):entNode(m.eset.get(id));
  Object.keys(rings).forEach(d=>{
   const ids=rings[d].sort((a,b)=>{const ka=/^app:/.test(a)?"z"+a:/^g:/.test(a)?"y"+a:(m.eset.get(a).domain+a),kb=/^app:/.test(b)?"z"+b:/^g:/.test(b)?"y"+b:(m.eset.get(b).domain+b);return ka<kb?-1:1});
   if(+d===0){const n=mk(ids[0]);n.x=-CW/2;n.y=-CH/2;nodes.set(n.id,n);return}
   const r=Math.max(190*d,ids.length*11.8),rx=r*1.75;
   ids.forEach((id,i)=>{const ang=-Math.PI/2+(i+(d%2?0:.5))/ids.length*2*Math.PI;const n=mk(id);n.x=Math.cos(ang)*rx-CW/2;n.y=Math.sin(ang)*r-CH/2;n.hop=+d;nodes.set(n.id,n)})});
  return{nodes,boxes,vb:boundsOf([...nodes.values()]),focus:true};
 }
 const order=DORD.filter(d=>doms.includes(d));
 const bw=2*CW+GX+2*PX_,list=order.map(d=>({key:d,n:DOM[d].n,c:DCOL[d],items:m.es.filter(e=>e.domain===d)}));
 const lay=(b,x,y)=>{const coll=!!D.col[b.key];b.coll=coll;b.x=x;b.y=y;b.w=bw;
  if(coll){b.h=HEAD+58;const n={id:"dom:"+b.key,kind:"dom",x:x+PX_,y:y+HEAD+4,w:bw-2*PX_,h:44,label:b.n,count:b.items.length,b};nodes.set(n.id,n)}
  else{const rows=Math.ceil(b.items.length/2);b.h=HEAD+rows*(CH+GY)+PX_-GY+4;
   b.items.forEach((it,i)=>{const n=b.ghost?gNode(it):entNode(it);n.x=x+PX_+(i%2)*(CW+GX);n.y=y+HEAD+Math.floor(i/2)*(CH+GY);n.c=b.c;nodes.set(n.id,n)})}
  boxes.push(b)};
 let y=0;const cols=3;
 for(let r=0;r*cols<list.length;r++){const row=list.slice(r*cols,r*cols+cols);row.forEach((b,i)=>lay(b,i*(bw+GAP),y));y+=Math.max.apply(null,row.map(b=>b.h))+GAP}
 const totalW=Math.min(cols,list.length||1)*(bw+GAP)-GAP;
 if(D.apps){
  const apps=PLAT.APPS.slice().sort((a,b)=>a.mod<b.mod?-1:a.mod>b.mod?1:a.n<b.n?-1:1),per=Math.max(2,Math.floor((totalW+GX)/(CW+GX)));
  const rows=Math.ceil(apps.length/per),b={key:"apps",n:"Apps and screens",c:-1,apps:true,x:0,y,w:totalW,h:HEAD+rows*(CH+GY)+PX_-GY+4};
  apps.forEach((a,i)=>{const n=appNode(a);n.x=PX_+(i%per)*(CW+GX);n.y=y+HEAD+Math.floor(i/per)*(CH+GY);nodes.set(n.id,n)});
  boxes.push(b);
 }
 if(D.pl){
  const gb={key:"plan",n:"Planned entities",c:-2,ghost:true,items:PLAT.PLANNED.map(p=>m.gset.get(p[0]))};
  lay(gb,Math.max(totalW,bw)+GAP*2,0);
 }
 const allb=boxes.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}));
 return{nodes,boxes,vb:boundsOf(allb),focus:false};
}
function dNodeId(id){ /* an entity may sit inside a collapsed domain */
 const m=model(),L=_L;if(!id)return null;if(L.nodes.has(id))return id;
 const e=m.eset.get(id);if(e&&L.nodes.has("dom:"+e.domain))return"dom:"+e.domain;return null}
let _L=null;
function visEdgesD(L){
 const m=model(),D=Z.d,acc=new Map();
 m.raw.forEach(e=>{
  if(e.type==="ref"&&!D.refs)return;if(e.type==="write"&&!D.wr)return;if(e.type==="read"&&!D.rd)return;
  if(e.ghost&&!D.pl)return;
  const k=m.key(e);const a=dNodeId(k[0]),b=dNodeId(k[1]);if(!a||!b||a===b)return;
  const kk=e.type+"|"+a+"|"+b,r=acc.get(kk)||{a,b,type:e.type,n:0,fields:[]};r.n++;if(e.field)r.fields.push(e.field);acc.set(kk,r)});
 if(D.pl)Object.keys(m.conn).forEach(g=>{const c=m.conn[g];c.apps.forEach(ap=>{if(!D.apps)return;const a=dNodeId(nidA(ap)),b=dNodeId(nidG(g));if(a&&b)acc.set("pl|"+a+"|"+b,{a,b,type:"pl",n:1,fields:[]})})});
 return[...acc.values()];
}
/* ---------- data connections: drawing ---------- */
function nodeSvg(n,st){
 const cls=["plk-n","k"+n.kind,st.sel===n.id?"sel":"",st.lit&&st.lit.has(n.id)?"lit":"",st.hit&&st.hit.has(n.id)?"hit":""].join(" ");
 const c=n.kind==="ent"?n.v:n.kind==="gh"?"--faint":n.kind==="app"?"--muted":"--plk-c"+(n.b?n.b.c:0);
 const label=n.kind==="dom"?n.label+" ("+n.count+")":n.label;
 const w=n.w,h=n.h,rx=n.kind==="app"?h/2:n.kind==="dom"?12:7;
 const tx=n.kind==="dom"?14:n.kind==="app"?13:12;
 const max=Math.floor((w-tx-8)/6.2);
 const sub=n.kind==="dom"?`<text class="sub" x="${tx}" y="${h-9}">${n.count} entities, collapsed. Select to inspect.</text>`:"";
 return `<g class="${cls}" style="--c:var(${c})" transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})" data-plk-n="${E(n.id)}" tabindex="0" role="button" aria-pressed="${st.sel===n.id}" aria-label="${E((n.kind==="app"?"App ":n.kind==="gh"?"Planned entity ":n.kind==="dom"?"Domain ":"Entity ")+label)}"><title>${E(label)}</title><rect width="${w}" height="${h}" rx="${rx}"/>${n.kind==="ent"||n.kind==="dom"?`<rect class="stripe" width="5" height="${h}" rx="2.5"/>`:""}<text x="${tx}" y="${n.kind==="dom"?19:h/2+4}">${E(trunc(label,n.kind==="dom"?44:max))}</text>${sub}</g>`;
}
function dGraph(){
 const m=model(),D=Z.d;_L=layoutD();const L=_L;
 const edges=visEdgesD(L);
 const sel=D.sel?dNodeId(D.sel):null;
 const lit=new Set();if(sel){lit.add(sel);edges.forEach(e=>{if(e.a===sel)lit.add(e.b);if(e.b===sel)lit.add(e.a)})}
 const q=D.q.trim().toLowerCase();let hit=null;
 if(q){hit=new Set();L.nodes.forEach(n=>{const t=((n.label||"")+" "+n.id+" "+(n.e?n.e.fields.map(f=>f.k).join(" "):"")).toLowerCase();if(t.includes(q))hit.add(n.id)})}
 const st={sel,lit:sel?lit:null,hit};
 const ep=edges.map(e=>{const a=L.nodes.get(e.a),b=L.nodes.get(e.b);const c=curve(a,b,e.type==="read"?-1:1);const on=sel&&(e.a===sel||e.b===sel);
  const cls=["plk-e",e.type,on?"lit":""].join(" ");const mk=e.type==="ref"?"ref":e.type==="write"?"wr":e.type==="read"?"rd":"pl";
  return `<path class="${cls}" d="${c.d}" style="stroke-width:${(1+Math.min(2.2,Math.log2(e.n+1)*.7)).toFixed(1)}px" marker-end="url(#plk-ar-d-${mk})"${on?` data-lit="1"`:""}><title>${E(entN(/^app:/.test(e.a)?e.b:e.a))}${e.fields.length?": "+E(e.fields.slice(0,4).join(", ")):""}</title></path>`}).join("");
 const bx=L.boxes.map(b=>{
  const hd=b.apps?`<text class="bh" x="14" y="23">${E(b.n)} (${PLAT.APPS.length})</text>`:`<g class="plk-bt" data-plk-dtoggle="${b.key}" tabindex="0" role="button" aria-expanded="${!b.coll}" aria-label="${E(b.n)}, ${b.coll?"collapsed":"expanded"}"><rect x="0" y="0" width="${b.w}" height="${HEAD-4}" fill="transparent"/><text class="bh" x="14" y="23">${b.coll?"▸":"▾"} ${E(b.n)} (${b.items.length})</text></g>`;
  return `<g transform="translate(${b.x},${b.y})" class="plk-box${b.apps?" kapps":""}${b.ghost?" kgh":""}" style="--c:var(${b.apps?"--muted":b.ghost?"--faint":"--plk-c"+b.c})"><rect class="bg" width="${b.w}" height="${b.h}" rx="16"/>${hd}</g>`}).join("");
 const ns=[...L.nodes.values()].map(n=>nodeSvg(n,st)).join("");
 const body=`${bx}<g class="plk-edges">${ep}</g><g class="plk-nodes">${ns}</g>`;
 const vb=vbFor("d",L.vb);
 return svgFrame("d",vb,body,"Data connections graph. Tab to a node and press Enter to select it. Arrow keys pan, plus and minus zoom.",(sel?"has-sel ":"")+(hit?"has-q":""));
}
/* ---------- panel ---------- */
const clsPill=c=>`<span class="pill ${({public:"mute",internal:"mute",confidential:"warn",restricted:"bad",personal:"bad"})[c]||"mute"}">${E(c)}</span>`;
function selRow(id,sub,tag,st){return{id,t:entN(id),sub:sub||"",tag:tag||"",st:st||"mute",go:()=>pickD(id)}}
function appRow(a,tag,st){const ap=PLAT.app(a);return{id:a,t:ap?ap.n:a,sub:ap?ap.mod:"",tag:tag||"",st:st||"mute",go:()=>pickD(nidA(a))}}
function fieldImpact(eid,fk){
 const e=PLAT.ent(eid),f=e.fields.find(x=>x.k===fk),m=model();
 if(!fk||!f){const b=blast(eid);return{label:"any field",apps:b.apps.length,ents:b.entities.length,procs:b.processes.length,mets:b.metrics.length,note:"A change to the entity itself, such as its identifier or state, reaches everything that points at it up to two steps away."}}
 const keyish=/^(id|number|name|state|status|label)$/.test(fk);
 if(keyish){const b=blast(eid);return{label:f.label,apps:b.apps.length,ents:b.entities.length,procs:b.processes.length,mets:b.metrics.length,note:"Identifying and state fields are joined on by other entities, so the change travels downstream."}}
 const ap=appsOf(eid),tg=(f.type==="ref"||f.type==="person")?m.raw.filter(x=>x.type==="ref"&&x.from===eid&&x.field.split(", ").indexOf(f.label||f.k)>=0).map(x=>x.to):[];
 const procs=procsTouching(eid),mets=metricsFor(ap);
 return{label:f.label,apps:ap.length,ents:tg.length,procs:procs.length,mets:mets.length,note:tg.length?"This field points at "+tg.map(entN).join(", ")+". Changing what it means changes the join.":"The field is used on screens and in rules of the apps that touch this entity; nothing else points at it."};
}
function panelD(){
 const D=Z.d,m=model();let id=D.sel;
 if(!id)return hubPanel();
 if(/^dom:/.test(id)){const k=id.slice(4),ents=m.es.filter(e=>e.domain===k);
  const out={};m.raw.filter(e=>e.type==="ref").forEach(e=>{const a=m.eset.get(e.from),b=m.eset.get(e.to);if(a&&b&&a.domain!==b.domain&&(a.domain===k||b.domain===k)){const o=a.domain===k?b.domain:a.domain;out[o]=(out[o]||0)+1}});
  return `<div class="plk-ph"><div class="eyebrow">Domain</div><h3>${E(DOM[k].n)}</h3><p class="small muted">Steward: ${E(DOM[k].steward)}. ${ents.length} entities, ${ents.reduce((a,e)=>a+e.nf,0)} fields.</p><div class="row"><button class="btn primary" data-plk-dtoggle="${k}">${D.col[k]?"Expand it":"Collapse it"}</button></div></div>
  <div class="plk-ps"><b>Links to other domains</b><p class="small">${Object.keys(out).map(o=>`<span class="pill mute">${E(DOM[o].n)} ${out[o]}</span>`).join(" ")||"None"}</p></div>
  ${lrHTML({id:"plk_dm",groups:[{key:"e",label:"Entities in this domain",rows:ents.map(e=>selRow(e.id,e.owner,e.cls,e.status==="duplicate"?"bad":"mute"))}],limit:8})}`}
 if(/^app:/.test(id)){const a=PLAT.app(id.slice(4));if(!a)return hubPanel();
  const nown=PLAT.nonOwnerWrites().filter(x=>x.app===a.id).map(x=>x.ent);
  const hasP=pgraph().ids.indexOf(a.id)>=0;
  return `<div class="plk-ph"><div class="eyebrow">App or screen</div><h3>${E(a.n)}</h3><p class="small muted"><code>${E(a.id)}</code> in ${E(a.mod)}. Writes ${a.writes.length}, reads ${a.reads.length} entities.</p>
  <div class="row"><button class="btn quiet" data-plk-hop="1" aria-label="Focus one hop">Focus 1 hop</button><button class="btn quiet" data-plk-hop="2">2 hops</button>${hasScr(a.id)?`<button class="btn quiet" data-plk-go="${E(a.id)}">Open screen</button>`:""}${hasP?`<button class="btn quiet" data-plk-pgo="${E(a.id)}">Open its process</button>`:""}</div></div>
  ${nown.length?`<div class="story small"><b>Writes outside its own module:</b> ${nown.map(x=>E(entN(x))).join(", ")}. These are listed as debt in the registry.</div>`:""}
  ${lrHTML({id:"plk_aw",groups:[{key:"w",label:"Writes",rows:a.writes.filter(inE).map(x=>selRow(x,"",nown.indexOf(x)>=0?"Not owner":"Owner","warn"))},{key:"r",label:"Reads",rows:a.reads.filter(inE).map(x=>selRow(x))},{key:"m",label:"Metrics shown here",rows:metricsFor([a.id]).map(k=>({id:k,t:METRICS[k].n,sub:METRICS[k].f,tag:"Metric",st:"info",go:()=>go("metrics")}))}],limit:8})}`}
 if(/^g:/.test(id)){const g=m.gset.get(id.slice(2)),c=m.conn[g.id];
  return `<div class="plk-ph"><div class="eyebrow">Planned entity, ${E(DOM[g.domain].n)}</div><h3>${E(g.label)}</h3><p class="small muted">Proposed steward ${E(g.steward)}. First users: ${E(g.use)}</p></div><div class="story small">${E(g.why)}</div>
  ${c.all?`<p class="small"><b>Every app would use it.</b></p>`:""}${c.why.length?`<ul class="small plk-ul">${c.why.map(w=>`<li>${w}</li>`).join("")}</ul>`:""}
  ${lrHTML({id:"plk_gp",groups:[{key:"e",label:"Existing entities that would connect",rows:c.ents.map(x=>selRow(x))},{key:"a",label:"Apps that would use it",rows:c.apps.map(a=>appRow(a))}],limit:8,empty:"Nothing connects yet."})}
  <div class="row" style="margin-top:10px"><button class="btn primary" data-plk-go="plat_reg">Propose it in the registry</button></div>`}
 const e=PLAT.ent(id);if(!e)return hubPanel();
 const ff=D.ff&&e.fields.some(f=>f.k===D.ff)?D.ff:"",fi=fieldImpact(e.id,ff);
 const up=m.outRefs(e.id),dn=m.raw.filter(x=>x.type==="ref"&&x.to===e.id);
 const bl=blast(e.id),nown=PLAT.nonOwnerWrites().filter(x=>x.ent===e.id).map(x=>x.app);
 return `<div class="plk-ph"><div class="eyebrow">${E(DOM[e.domain].n)}</div><h3>${E(e.label)}</h3><p class="small muted"><code>${E(e.id)}</code> owned by ${E(e.owner)}, stewarded by ${E(e.steward)}.</p>
  <div class="row" style="gap:6px;flex-wrap:wrap">${clsPill(e.cls)}<span class="pill ${e.status==="duplicate"?"bad":e.status==="fixed"?"info":"good"}">${e.status==="duplicate"?"Duplicate":e.status==="fixed"?"Fixed":"Canonical"}</span>${e.writers.length>1?`<span class="pill warn">${e.writers.length} writers</span>`:""}</div></div>
  <div class="plk-imp"><label class="small muted" for="plk_ff">Impact if this field changes</label><select class="fin" id="plk_ff" data-plk-ff><option value="">Any field on the entity</option>${e.fields.map(f=>`<option value="${E(f.k)}" ${f.k===ff?"selected":""}>${E(f.label||f.k)}</option>`).join("")}</select>
  <div class="statrow plk-st"><div class="stat"><small>Apps</small><span class="num" data-role="metric">${fi.apps}</span></div><div class="stat"><small>Entities</small><span class="num" data-role="metric">${fi.ents}</span></div><div class="stat"><small>Processes</small><span class="num" data-role="metric">${fi.procs}</span></div><div class="stat"><small>Metrics</small><span class="num" data-role="metric">${fi.mets}</span></div></div>
  <p class="small muted" data-role="story">${E(fi.note)}</p></div>
  <div class="row plk-act"><button class="btn quiet" data-plk-hop="1">Focus 1 hop</button><button class="btn quiet" data-plk-hop="2">2</button><button class="btn quiet" data-plk-hop="3">3</button><button class="btn quiet" data-plk-trace="${E(e.id)}">Trace a field</button><button class="btn quiet" data-plk-go="plat_reg">Registry</button></div>
  ${lrHTML({id:"plk_en",groups:[
   {key:"up",label:"Upstream: this points to",rows:up.map(x=>selRow(x.to,x.field,x.ghost?"Planned":"Reference",x.ghost?"warn":"info"))},
   {key:"dn",label:"Downstream: points to this",rows:dn.map(x=>selRow(x.from,x.field,"Reference","info"))},
   {key:"w",label:"Written by",rows:e.writers.map(a=>appRow(a,nown.indexOf(a)>=0?"Not owner":"Writes",nown.indexOf(a)>=0?"warn":"good"))},
   {key:"r",label:"Read by",rows:e.readers.map(a=>appRow(a,"Reads","info"))},
   {key:"p",label:"Processes that touch it",rows:bl.processes.length?procsTouching(e.id).map(p=>({id:p,t:pName(p),sub:FAM[FIDX[pFam(p)]][1],tag:pEnts(p).w.indexOf(e.id)>=0?"Writes":"Reads",st:"mute",go:()=>pickP(p,true)})):[]}
  ],limit:6})}
  ${SCALE&&SCALE.on?`<p class="small muted">Enterprise scale is on. The model keeps the same shape because it describes tables, not rows.</p>`:""}`;
}
function hubPanel(){
 const m=model(),deg={};m.raw.forEach(e=>{const k=m.key(e);k.forEach(x=>deg[x]=(deg[x]||0)+1)});
 const top=m.es.map(e=>({e,n:deg[e.id]||0})).sort((a,b)=>b.n-a.n).slice(0,8);
 const iso=stats().isolated;
 return `<div class="plk-ph"><div class="eyebrow">Nothing selected</div><h3>Pick a node</h3><p class="small muted">Select an entity, an app or a domain. Its links light up and flow, everything else dims, and this panel lists fields, writers, readers and the impact of changing a field.</p></div>
 ${lrHTML({id:"plk_hub",groups:[{key:"h",label:"Most connected entities",rows:top.map(t=>selRow(t.e.id,t.n+" links",DOM[t.e.domain].n,"info"))},{key:"i",label:"Entities with no links",rows:iso.map(x=>selRow(x,"No reference, reader or writer","Isolated","warn"))}],limit:8,search:false})}`;
}
/* ---------- the connections view: toolbar, graph or list, panel ---------- */
function dList(){
 const m=model(),doms=mpGet("plk_dom");const deg={};m.raw.forEach(e=>{const k=m.key(e);deg[k[0]]=(deg[k[0]]||0)+1;deg[k[1]]=(deg[k[1]]||0)+1});
 return btHTML({id:"plk_dlist",cols:[
  {k:"label",label:"Entity",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.id)}</div>`,val:r=>r.label,wrap:true,w:220},
  {k:"domain",label:"Domain",fmt:r=>E(DOM[r.domain].n),val:r=>DOM[r.domain].n},
  {k:"out",label:"Points to",fmt:r=>m.outRefs(r.id).length,val:r=>m.outRefs(r.id).length},
  {k:"in",label:"Pointed at by",fmt:r=>m.inRefs(r.id).length,val:r=>m.inRefs(r.id).length},
  {k:"w",label:"Writers",fmt:r=>r.writers.length,val:r=>r.writers.length},
  {k:"r",label:"Readers",fmt:r=>r.readers.length,val:r=>r.readers.length},
  {k:"cls",label:"Class",fmt:r=>clsPill(r.cls),val:r=>r.cls}
 ],rows:()=>m.es.filter(e=>doms.includes(e.domain)),key:"id",h:420,rowH:52,facets:["domain"],exportName:"entity-connections",open:id=>pickD(id)});
}
function toolbarD(){
 const D=Z.d;
 return `<div class="plk-bar"><div class="plk-brow">${seg("Color by",[["domain","Domain",D.ov==="domain"],["auth","Authority",D.ov==="auth"],["cls","Classification",D.ov==="cls"],["dup","Duplicates",D.ov==="dup"]],"data-plk-ov")}
 <div class="plk-seg" role="group" aria-label="Layers"><span class="small muted">Show</span>${togBtn("d:refs","Entity links",D.refs)}${togBtn("d:apps","Apps",D.apps)}${togBtn("d:wr","Writes",D.wr)}${togBtn("d:rd","Reads",D.rd)}${togBtn("d:pl","Planned",D.pl,"Show planned entities as ghost nodes")}</div></div>
 <div class="plk-brow">${seg("Focus",[["0","Whole model",D.hop===0],["1","1 hop",D.hop===1],["2","2 hops",D.hop===2],["3","3 hops",D.hop===3]],"data-plk-hopset")}
 <div class="plk-seg" role="group" aria-label="Domains"><button type="button" class="plk-tog" data-plk-colall="d:1">Collapse all</button><button type="button" class="plk-tog" data-plk-colall="d:0">Expand all</button></div>
 ${seg("View",[["graph","Graph",D.view==="graph"],["list","List",D.view==="list"]],"data-plk-view")}${zoomBar("d")}</div></div>
 <div class="plk-lg">${ovLegend()}${edgeLegend}</div>`;
}
function dHost(){
 const D=Z.d,gsvg=dGraph(),ar=lastAR.toFixed(2);
 return `<div class="plk-split" data-view="${D.view}"><div class="plk-main">${toolbarD()}<div class="plk-canvas plk-gonly" data-plk-canvas="d" style="aspect-ratio:${ar}">${gsvg}<p class="plk-hint small muted">Drag to pan. Hold Ctrl or Cmd and scroll to zoom. Tab to a node and press Enter.</p></div><div class="plk-lonly">${dList()}</div></div><aside class="plk-panel card glass" aria-live="polite" data-plk-panel>${panelD()}</aside></div>`;
}
function domOpts(){return DORD.map(d=>({v:d,l:DOM[d].n,sub:DOM[d].ent.length+" entities"}))}
function drawD(refit){
 if(refit)Z.d.vb=null;
 const h=document.querySelector("[data-plk-dhost]");if(!h){render();return}
 h.innerHTML=dHost();
}
function pickD(id){
 const D=Z.d;D.sel=id;D.ff="";if(D.hop>0)D.vb=null;
 if(!document.querySelector("[data-plk-dhost]")){S.v.plk_d=0;go("plat_dmap");return}
 const el=document.querySelector("[data-plk-dhost]");
 if(S.v.plk_d!==0){S.v.plk_d=0;render();return}
 drawD(false);
}
/* ---------- process connections: layout, drawing, panel ---------- */
const MODEC={event:"info",batch:"mute",human:"warn"},MODEN={event:"Event",batch:"Batch",human:"Human"};
const WHON={human:"Person",agent:"AI agent",robot:"Robot",auto:"Robot",fn:"Robot",gate:"Approval gate"},WHOC={human:"mute",agent:"info",robot:"good",auto:"good",fn:"good",gate:"warn"};
function layoutP(){
 const P=Z.p,g=pgraph(),nodes=new Map(),boxes=[];
 const sel=P.sel&&!/^fam:/.test(P.sel)?P.sel:null;
 if(P.hop>0&&sel&&g.ids.indexOf(sel)>=0){
  const seen=new Map([[sel,0]]);let fr=[sel];const es=g.ho.concat(P.data?g.dep:[]);
  for(let d=1;d<=P.hop;d++){const nx=[];fr.forEach(u=>es.forEach(e=>{const o=e.from===u?e.to:e.to===u?e.from:null;if(o&&!seen.has(o)){seen.set(o,d);nx.push(o)}}));fr=nx}
  const rings={};seen.forEach((d,id)=>(rings[d]=rings[d]||[]).push(id));
  Object.keys(rings).forEach(d=>{const ids=rings[d].sort((a,b)=>FIDX[pFam(a)]-FIDX[pFam(b)]||(a<b?-1:1));
   ids.forEach((id,i)=>{const n={id,kind:"proc",w:210,h:28,label:pName(id),v:"--plk-c"+FIDX[pFam(id)],proc:id};
    if(+d===0){n.x=-105;n.y=-14}else{const r=Math.max(200*d,ids.length*13),ang=-Math.PI/2+(i+(d%2?0:.5))/ids.length*2*Math.PI;n.x=Math.cos(ang)*r*1.7-105;n.y=Math.sin(ang)*r-14}
    nodes.set(id,n)})});
  return{nodes,boxes,vb:boundsOf([...nodes.values()]),focus:true};
 }
 const fams=FAM.map((f,i)=>({key:f[0],n:f[1],c:i,items:g.ids.filter(p=>pFam(p)===f[0])})).filter(f=>f.items.length);
 const flt=mpGet("plk_fam"),list=fams.filter(f=>flt.indexOf(f.key)>=0);
 const PW=210,PH=28,bw=PW+2*PX_,cols=4;
 const lay=(b,x,y)=>{const coll=!P.exp[b.key];b.coll=coll;b.x=x;b.y=y;b.w=bw;
  if(coll){b.h=HEAD+58;nodes.set("fam:"+b.key,{id:"fam:"+b.key,kind:"fam",x:x+PX_,y:y+HEAD+4,w:bw-2*PX_,h:44,label:b.n,count:b.items.length,c:b.c,b})}
  else{b.h=HEAD+b.items.length*(PH+GY)+PX_-GY+4;b.items.forEach((p,i)=>nodes.set(p,{id:p,kind:"proc",x:x+PX_,y:y+HEAD+i*(PH+GY),w:PW,h:PH,label:pName(p),v:"--plk-c"+b.c,proc:p,b}))}
  boxes.push(b)};
 let y=0;
 for(let r=0;r*cols<list.length;r++){const row=list.slice(r*cols,r*cols+cols);row.forEach((b,i)=>lay(b,i*(bw+GAP),y));y+=Math.max.apply(null,row.map(b=>b.h))+GAP}
 return{nodes,boxes,vb:boundsOf(boxes.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}))),focus:false};
}
let _PL=null;
const pNode=id=>{const L=_PL;if(L.nodes.has(id))return id;const f=pFam(id);return L.nodes.has("fam:"+f)?"fam:"+f:null};
function pGraphSvg(){
 const P=Z.p,g=pgraph();_PL=layoutP();const L=_PL;
 const acc=new Map();
 const add=(e,type)=>{const a=pNode(e.from),b=pNode(e.to);if(!a||!b||a===b)return;const k=type+"|"+a+"|"+b,r=acc.get(k)||{a,b,type,n:0,ents:new Set(),items:[]};r.n++;e.entities.forEach(x=>r.ents.add(x));r.items.push(e);acc.set(k,r)};
 g.ho.forEach(h=>add(h,h.mode));
 if(P.data)g.dep.forEach(d=>add(d,"dt"));
 const edges=[...acc.values()];
 const sel=P.sel?pNode(P.sel):null,lit=new Set();
 if(sel){lit.add(sel);edges.forEach(e=>{if(e.a===sel)lit.add(e.b);if(e.b===sel)lit.add(e.a)})}
 const q=(P.q||"").trim().toLowerCase();let hit=null;
 if(q){hit=new Set();L.nodes.forEach(n=>{const t=((n.label||"")+" "+n.id+" "+(n.proc&&PROC.defs[n.proc]?PROC.defs[n.proc].title:"")+" "+(n.b?n.b.n:"")).toLowerCase();if(t.includes(q))hit.add(n.id)});
  /* a family node matches when any process in it matches */
  L.nodes.forEach(n=>{if(n.kind==="fam"&&n.b.items.some(p=>(pName(p)+" "+p).toLowerCase().includes(q)))hit.add(n.id)})}
 const st={sel,lit:sel?lit:null,hit};
 const mk={event:"ev",batch:"ba",human:"hu",dt:"dt"};
 const ep=edges.map(e=>{const a=L.nodes.get(e.a),b=L.nodes.get(e.b),c=curve(a,b,1),on=sel&&(e.a===sel||e.b===sel);
  const tip=e.items.slice(0,4).map(h=>pName(h.from)+" to "+pName(h.to)+(h.trigger?" ("+h.trigger+")":"")).join("; ");
  return `<path class="plk-e ho ${e.type}${on?" lit":""}" d="${c.d}" style="stroke-width:${(1.3+Math.min(2.4,Math.log2(e.n+1)*.8)).toFixed(1)}px" marker-end="url(#plk-ar-p-${mk[e.type]})"><title>${E(tip)}</title></path>`}).join("");
 const bx=L.boxes.map(b=>`<g transform="translate(${b.x},${b.y})" class="plk-box" style="--c:var(--plk-c${b.c})"><rect class="bg" width="${b.w}" height="${b.h}" rx="16"/><g class="plk-bt" data-plk-ptoggle="${b.key}" tabindex="0" role="button" aria-expanded="${!b.coll}" aria-label="${E(b.n)}, ${b.coll?"collapsed":"expanded"}"><rect x="0" y="0" width="${b.w}" height="${HEAD-4}" fill="transparent"/><text class="bh" x="14" y="23">${b.coll?"▸":"▾"} ${E(trunc(b.n,26))} (${b.items.length})</text></g></g>`).join("");
 const ns=[...L.nodes.values()].map(n=>{ const o=Object.assign({},n);if(o.kind==="fam"){o.count=n.count;o.b={c:n.c}}return nodeSvgP(o,st)}).join("");
 return svgFrame("p",vbFor("p",L.vb),`${bx}<g class="plk-edges">${ep}</g><g class="plk-nodes">${ns}</g>`,"Process connections graph. Tab to a node and press Enter to select it. Arrow keys pan, plus and minus zoom.",(sel?"has-sel ":"")+(hit?"has-q":""));
}
function nodeSvgP(n,st){
 const isF=n.kind==="fam";
 const cls=["plk-n",isF?"kdom":"kent",st.sel===n.id?"sel":"",st.lit&&st.lit.has(n.id)?"lit":"",st.hit&&st.hit.has(n.id)?"hit":""].join(" ");
 const label=isF?n.label+" ("+n.count+")":n.label,c=isF?"--plk-c"+n.c:n.v,max=Math.floor((n.w-20)/6.2);
 const sub=isF?`<text class="sub" x="14" y="${n.h-9}">${n.count} processes, collapsed</text>`:"";
 return `<g class="${cls}" style="--c:var(${c})" transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})" data-plk-pn="${E(n.id)}" tabindex="0" role="button" aria-pressed="${st.sel===n.id}" aria-label="${E((isF?"Process family ":"Process ")+label)}"><title>${E(label)}</title><rect width="${n.w}" height="${n.h}" rx="${isF?12:7}"/><rect class="stripe" width="5" height="${n.h}" rx="2.5"/><text x="${isF?14:12}" y="${isF?19:n.h/2+4}">${E(trunc(label,isF?44:max))}</text>${sub}</g>`;
}
function hoRows(list,dir){
 return list.map(h=>{const o=dir==="in"?h.from:h.to;return{id:h.from+h.to,t:pName(o),sub:h.entities.map(entN).join(", ")+" · "+h.trigger,tag:MODEN[h.mode],st:MODEC[h.mode],go:()=>pickP(o,true)}});
}
/* CL-52: the steps render from the one process strip (procCard), which opens each step and the Workflow designer */
function stepsHTML(pid){return PROC.defs[pid]&&typeof procCard==="function"?procCard(pid):""}
function panelP(){
 const P=Z.p,g=pgraph();let id=P.sel;
 if(!id)return `<div class="plk-ph"><div class="eyebrow">Nothing selected</div><h3>Pick a process</h3><p class="small muted">Select a family or a process. Its handoffs light up and flow, and this panel lists what comes in and goes out, the data it reads and writes, and its steps.</p></div>
  ${lrHTML({id:"plk_phub",groups:[{key:"h",label:"Most connected processes",rows:g.ids.map(p=>({p,n:g.ho.filter(h=>h.from===p||h.to===p).length})).sort((a,b)=>b.n-a.n).slice(0,8).map(x=>({id:x.p,t:pName(x.p),sub:x.n+" handoffs",tag:FAM[FIDX[pFam(x.p)]][1],st:"info",go:()=>pickP(x.p,true)}))}],search:false})}`;
 if(/^fam:/.test(id)){const k=id.slice(4),fi=FAM[FIDX[k]],ps=g.ids.filter(p=>pFam(p)===k);
  const inn=g.ho.filter(h=>pFam(h.to)===k&&pFam(h.from)!==k),out=g.ho.filter(h=>pFam(h.from)===k&&pFam(h.to)!==k);
  return `<div class="plk-ph"><div class="eyebrow">Process family</div><h3>${E(fi[1])}</h3><p class="small muted">${ps.length} processes, ${inn.length} handoffs in, ${out.length} handoffs out.</p><div class="row"><button class="btn primary" data-plk-ptoggle="${k}">${P.exp[k]?"Collapse it":"Expand it"}</button></div></div>
  ${lrHTML({id:"plk_pf1",groups:[{key:"p",label:"Processes",rows:ps.map(p=>({id:p,t:pName(p),sub:PROC.defs[p].title,tag:(pEnts(p).w.length)+" writes",st:"mute",go:()=>pickP(p,true)}))},{key:"i",label:"Handoffs in from other families",rows:hoRows(inn,"in")},{key:"o",label:"Handoffs out to other families",rows:hoRows(out,"out")}],limit:6})}`}
 const d=PROC.defs[id];if(!d)return"";
 const inn=g.ho.filter(h=>h.to===id),out=g.ho.filter(h=>h.from===id),ents=pEnts(id),ds=downstream(id);
 const dIn=g.dep.filter(x=>x.to===id),dOut=g.dep.filter(x=>x.from===id);
 const cnt={};(S.proc&&S.proc[id]||d.steps).forEach(s=>{const w=s.who||"human";cnt[w]=(cnt[w]||0)+1});
 return `<div class="plk-ph"><div class="eyebrow">${E(FAM[FIDX[pFam(id)]][1])}</div><h3>${E(pName(id))}</h3><p class="small muted">${E(d.title)}</p>
  <div class="row" style="gap:6px;flex-wrap:wrap">${(()=>{try{const m=window.PROCLIB&&PROCLIB.maturity(id);return m?`<span class="pill ${m.level>=m.target?"good":"warn"}" title="Process maturity, Year 1 target ${m.target}">Maturity ${m.level} of ${m.max}</span>`:""}catch(e){return""}})()}${Object.keys(cnt).map(w=>`<span class="pill ${WHOC[w]}">${cnt[w]} ${WHON[w].toLowerCase()}</span>`).join("")}</div></div>
  <div class="plk-imp"><b class="small">If this breaks</b><div class="statrow plk-st"><div class="stat"><small>Processes</small><span class="num" data-role="metric">${ds.procs.length}</span></div><div class="stat"><small>Entities</small><span class="num" data-role="metric">${ds.real.length}</span></div><div class="stat"><small>Apps</small><span class="num" data-role="metric">${ds.apps.length}</span></div></div><p class="small muted" data-role="story">${ds.procs.length?"Downstream: "+ds.procs.slice(0,5).map(pName).join(", ")+(ds.procs.length>5?" and "+(ds.procs.length-5)+" more.":"."):"Nothing depends on this process through a documented handoff or written data."}</p></div>
  <div class="row plk-act"><button class="btn quiet" data-plk-phop="1">Focus 1 hop</button><button class="btn quiet" data-plk-phop="2">2</button><button class="btn quiet" data-plk-phop="3">3</button>${window.PROCLIB?`<button class="btn primary" data-plk-pfull="${E(id)}">Open full process page</button>`:""}${hasScr(id)?`<button class="btn quiet" data-plk-go="${E(id)}">Open process screen</button>`:""}</div>
  ${lrHTML({id:"plk_pp",groups:[
   {key:"in",label:"Handoffs in",rows:hoRows(inn,"in")},{key:"out",label:"Handoffs out",rows:hoRows(out,"out")},
   {key:"w",label:"Data it writes",rows:ents.w.map(x=>({id:x,t:entN(x),sub:DOM[model().eset.get(x).domain].n,tag:"Writes",st:"good",go:()=>pickD(x)}))},
   {key:"r",label:"Data it reads",rows:ents.r.map(x=>({id:x,t:entN(x),sub:DOM[model().eset.get(x).domain].n,tag:"Reads",st:"info",go:()=>pickD(x)}))},
   {key:"di",label:"Depends on data written by",rows:dIn.map(x=>({id:x.from+x.to,t:pName(x.from),sub:x.entities.map(entN).join(", "),tag:"Data",st:"mute",go:()=>pickP(x.from,true)}))},
   {key:"do",label:"Feeds data to",rows:dOut.map(x=>({id:x.from+x.to,t:pName(x.to),sub:x.entities.map(entN).join(", "),tag:"Data",st:"mute",go:()=>pickP(x.to,true)}))}
  ],limit:5})}
  <div class="plk-ps"><b class="small">Steps and who does them</b>${stepsHTML(id)}</div>`;
}
const famLegend=()=>legend(FAM.map((f,i)=>[f[1],"--plk-c"+i]));
const hoLegend=`<div class="legend plk-elg" role="note"><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho event"/></svg>Event handoff</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho batch"/></svg>Batch handoff</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho human"/></svg>Human handoff</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho dt"/></svg>Shared data (writer to reader)</span></div>`;
function toolbarP(){
 const P=Z.p;
 return `<div class="plk-bar"><div class="plk-brow"><div class="plk-seg" role="group" aria-label="Layers"><span class="small muted">Show</span>${togBtn("p:data","Shared data dependencies",P.data,"Draw a dotted line from a process that writes data to a process that reads it")}${togBtn("p:hub","Count hub entities",P.hub,"Person, service and CI are used almost everywhere. Off keeps the picture readable.")}</div>
 ${seg("Focus",[["0","Whole map",P.hop===0],["1","1 hop",P.hop===1],["2","2 hops",P.hop===2],["3","3 hops",P.hop===3]],"data-plk-phopset")}</div>
 <div class="plk-brow"><div class="plk-seg" role="group" aria-label="Families"><button type="button" class="plk-tog" data-plk-pcol="1">Collapse all</button><button type="button" class="plk-tog" data-plk-pcol="0">Expand all</button></div>
 ${seg("View",[["graph","Graph",P.view==="graph"],["list","List",P.view==="list"]],"data-plk-pview")}${zoomBar("p")}</div></div><div class="plk-lg">${famLegend()}${hoLegend}</div>`;
}
function pList(){
 const g=pgraph();
 return btHTML({id:"plk_plist",cols:[
  {k:"n",label:"Process",fmt:r=>`<b>${E(r.n)}</b><div class="muted small">${E(r.fam)}</div>`,val:r=>r.n,wrap:true,w:240},
  {k:"fam",label:"Family",fmt:r=>E(r.fam),val:r=>r.fam},
  {k:"i",label:"Handoffs in",fmt:r=>r.i,val:r=>r.i},
  {k:"o",label:"Handoffs out",fmt:r=>r.o,val:r=>r.o},
  {k:"w",label:"Writes",fmt:r=>r.w,val:r=>r.w},
  {k:"r",label:"Reads",fmt:r=>r.r,val:r=>r.r}
 ],rows:()=>g.ids.map(p=>({id:p,n:pName(p),fam:FAM[FIDX[pFam(p)]][1],i:g.ho.filter(h=>h.to===p).length,o:g.ho.filter(h=>h.from===p).length,w:pEnts(p).w.length,r:pEnts(p).r.length})),key:"id",h:420,rowH:52,facets:["fam"],exportName:"process-connections",open:id=>pickP(id,true)});
}
function pHost(){
 const P=Z.p,gsvg=pGraphSvg(),ar=lastAR.toFixed(2);
 return `<div class="plk-split" data-view="${P.view}"><div class="plk-main">${toolbarP()}<div class="plk-canvas plk-gonly" data-plk-canvas="p" style="aspect-ratio:${ar}">${gsvg}<p class="plk-hint small muted">Drag to pan. Hold Ctrl or Cmd and scroll to zoom. Select a family to see its processes. Select a process, then select it again to open its full page.</p></div><div class="plk-lonly">${pList()}</div></div><aside class="plk-panel card glass" aria-live="polite" data-plk-panel>${panelP()}</aside></div>`;
}
function drawP(refit){if(refit)Z.p.vb=null;const h=document.querySelector("[data-plk-phost]");if(!h){render();return}h.innerHTML=pHost()}
function pickP(id,open){
 const P=Z.p;P.sel=id;if(P.hop>0)P.vb=null;
 if(open&&!document.querySelector("[data-plk-phost]")){S.v.plk_p=0;go("plat_pmap");return}
 if(S.v.plk_p!==0){S.v.plk_p=0;render();return}
 drawP(false);
}
/* ---------- dependency matrix ---------- */
function sharedBetween(a,b){const g=pgraph();return(g.shared[a+"|"+b]||[]).filter(x=>Z.p.hub||!g.hubs.has(x))}
function famShared(fa,fb){
 const g=pgraph(),set=new Set();
 g.ids.filter(p=>pFam(p)===fa).forEach(p=>g.ids.filter(q=>pFam(q)===fb&&q!==p).forEach(q=>sharedBetween(p,q).forEach(x=>set.add(x))));return[...set];
}
function matrixP(){
 const P=Z.p,g=pgraph();
 const shade=n=>`style="--k:${Math.min(1,n/6).toFixed(2)}"`;
 const toggle=seg("Level",[["fam","By family",P.mx==="fam"],["proc","By process",P.mx==="proc"]],"data-plk-mxlev");
 let tbl;
 if(P.mx==="fam"){
  const fams=FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0]));
  tbl=`<table class="plk-mx"><thead><tr><th scope="col">Family</th>${fams.map(f=>`<th scope="col" class="v"><span>${E(trunc(f[1],24))}</span></th>`).join("")}</tr></thead><tbody>${fams.map(a=>`<tr><th scope="row">${E(a[1])}</th>${fams.map(b=>{if(a[0]===b[0])return`<td class="self"></td>`;const n=famShared(a[0],b[0]).length;return n?`<td class="c" ${shade(n)}><button type="button" data-plk-pair="f:${a[0]}:${b[0]}" aria-label="${E(a[1]+" and "+b[1]+": "+n+" shared entities")}">${n}</button></td>`:`<td class="z"></td>`}).join("")}</tr>`).join("")}</tbody></table>`;
 }else{
  const fl=mpGet("plk_pmf"),ids=g.ids.filter(p=>fl.indexOf(pFam(p))>=0);
  tbl=`<table class="plk-mx"><thead><tr><th scope="col">Process</th>${ids.map(p=>`<th scope="col" class="v"><span>${E(trunc(pName(p),22))}</span></th>`).join("")}</tr></thead><tbody>${ids.map(a=>`<tr><th scope="row">${E(pName(a))}</th>${ids.map(b=>{if(a===b)return`<td class="self"></td>`;const n=sharedBetween(a,b).length;return n?`<td class="c" ${shade(n)}><button type="button" data-plk-pair="p:${a}:${b}" aria-label="${E(pName(a)+" and "+pName(b)+": "+n+" shared entities")}">${n}</button></td>`:`<td class="z"></td>`}).join("")}</tr>`).join("")}</tbody></table>`;
 }
 return `<div class="plk-brow">${toggle}${P.mx==="proc"?mpHTML({id:"plk_pmf",label:"Families",all:"All families",opts:FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0])).map(f=>({v:f[0],l:f[1]}))}):""}${togBtn("p:hub","Count hub entities",P.hub,"Person, service and CI are used almost everywhere. Off shows the meaningful sharing.")}</div>
 <div class="plk-lg">${legend([["Darker means more shared entities","--p1"]])}</div><div class="plk-mxwrap">${tbl}</div>`;
}
function pairDrawer(kind,a,b){
 const g=pgraph();let ps1,ps2,ents,title;
 if(kind==="f"){ps1=g.ids.filter(p=>pFam(p)===a);ps2=g.ids.filter(p=>pFam(p)===b);ents=famShared(a,b);title=FAM[FIDX[a]][1]+" and "+FAM[FIDX[b]][1]}
 else{ps1=[a];ps2=[b];ents=sharedBetween(a,b);title=pName(a)+" and "+pName(b)}
 const ho=g.ho.filter(h=>(ps1.indexOf(h.from)>=0&&ps2.indexOf(h.to)>=0)||(ps2.indexOf(h.from)>=0&&ps1.indexOf(h.to)>=0));
 const dep=g.dep.filter(h=>(ps1.indexOf(h.from)>=0&&ps2.indexOf(h.to)>=0)||(ps2.indexOf(h.from)>=0&&ps1.indexOf(h.to)>=0));
 const wr={};ents.forEach(x=>{wr[x]=ps1.concat(ps2).filter(p=>pEnts(p).w.indexOf(x)>=0)});
 openDrawer(`<div class="dfullgrid"><div><div class="eyebrow">Shared data</div><h2 style="margin:4px 0">${E(title)}</h2><p class="story" data-role="story">${ents.length?`They touch <b>${ents.length}</b> of the same ${ents.length===1?"entity":"entities"}. A change to any of them reaches both.`:"They share no registered entity. Any link between them is a handoff only."}</p>
 ${lrHTML({id:"plk_pair_e",groups:[{key:"e",label:"Shared entities",rows:ents.map(x=>({id:x,t:entN(x),sub:wr[x].length?"Written by "+wr[x].map(pName).join(", "):"Read only by both",tag:wr[x].length>1?"Two writers":"Shared",st:wr[x].length>1?"warn":"info",go:()=>{closeDrawer();pickD(x)}}))}],limit:8,empty:"No shared entities."})}</div>
 <div>${lrHTML({id:"plk_pair_h",groups:[{key:"h",label:"Documented handoffs between them",rows:ho.map(h=>({id:h.from+h.to,t:pName(h.from)+" to "+pName(h.to),sub:h.entities.map(entN).join(", ")+" · "+h.trigger,tag:MODEN[h.mode],st:MODEC[h.mode],go:()=>{closeDrawer();pickP(h.from,true)}}))},{key:"d",label:"Data dependencies (one writes, the other reads)",rows:dep.map(h=>({id:h.from+h.to,t:pName(h.from)+" feeds "+pName(h.to),sub:h.entities.map(entN).join(", "),tag:"Data",st:"mute",go:()=>{closeDrawer();pickP(h.from,true)}}))}],limit:8,empty:"None."})}
 <div class="row" style="margin-top:12px"><button class="btn quiet" data-plk-go="plat_reg">Open the registry</button></div></div></div>`);
}
/* ---------- critical paths ---------- */
const CHAINS=[
 {id:"c1",n:"Demand to improvement",d:"A funded idea becomes a project, a release and a change. When it breaks, an incident and a problem feed the knowledge base and the next demand.",steps:["exe_strat","port","ppm_proj","agile_board","itsm_rel","itsm_chg","itsm_inc","itsm_prb","kcs_gap"]},
 {id:"c2",n:"Alert to permanent fix",d:"A discovered configuration item raises an alert, the alert becomes an incident, and the root cause returns to the CMDB through a change.",steps:["itom_disc","itom_cmdb","itom_evt","itom_run","itsm_inc","itsm_prb","itsm_chg","itom_cmdb"]},
 {id:"c3",n:"Request to board cost view",d:"A request in chat starts a clock, the clock feeds a vendor credit, the credit lands on an invoice and the invoice becomes the cost the board sees.",steps:["chat_home","svc_req","svc_sla","ppm_sow","inv","tbm_model","exe_board"]},
 {id:"c4",n:"Service level to cost",d:"A metric becomes an objective, the objective is compared to the agreement, and a miss turns into a vendor credit on a paid invoice.",steps:["obs_dash","itom_slo","svc_sla","ppm_sow","inv","tbm_model"]},
 {id:"c5",n:"Person to board risk view",d:"A new person gets a skill profile, is assigned to a project, the plan feeds the schedule and the schedule feeds date confidence for the board.",steps:["ppl_org","svc_skills","ppm_proj","ppm_wbs","ims","exe_risk","exe_board"]}
];
function chainView(c){
 const g=pgraph(),ids=new Set(g.ids),steps=c.steps.filter(s=>ids.has(s));
 const hops=[];for(let i=0;i<steps.length-1;i++){const h=g.ho.find(x=>x.from===steps[i]&&x.to===steps[i+1])||g.ho.find(x=>x.from===steps[i+1]&&x.to===steps[i]);hops.push(h||null)}
 return{steps,hops};
}
function blastCard(){
 const sp=Z.p.pstep;if(!sp)return `<div class="story small">Select a step in any chain to see what breaks downstream if it fails.</div>`;
 const [cid,i]=sp.split(":");const c=CHAINS.find(x=>x.id===cid);if(!c)return"";const v=chainView(c),pid=v.steps[+i];if(!pid)return"";
 const ds=downstream(pid);const inChain=ds.procs.filter(p=>v.steps.indexOf(p)>=0);
 return `<div class="plk-blast"><div class="eyebrow">If this breaks</div><h3 style="margin:2px 0 6px">${E(pName(pid))}</h3>
 <div class="statrow"><div class="stat"><small>Processes affected</small><span class="num" data-role="metric">${ds.procs.length}</span><em>${inChain.length} on this chain</em></div><div class="stat"><small>Entities at risk</small><span class="num" data-role="metric">${ds.real.length}</span><em>stale or missing</em></div><div class="stat"><small>Apps affected</small><span class="num" data-role="metric">${ds.apps.length}</span></div></div>
 <p class="small" data-role="story">${ds.procs.length?`The first processes to feel it are ${ds.procs.filter(p=>ds.depth.get(p)===1).slice(0,5).map(pName).join(", ")||"none"}. After ${Math.max.apply(null,[0].concat([...ds.depth.values()]))} steps the effect reaches ${ds.procs.length} processes.`:"No process depends on it through a handoff or shared writes."}</p>
 <p class="small muted">Entities that would go stale: ${ds.entities.slice(0,10).map(entN).join(", ")||"none"}${ds.entities.length>10?" and "+(ds.entities.length-10)+" more":""}.</p>
 <div class="row"><button class="btn quiet" data-plk-pgo="${E(pid)}">Show it on the map</button>${hasScr(pid)?`<button class="btn quiet" data-plk-go="${E(pid)}">Open the process</button>`:""}</div></div>`;
}
function pathsHTML(){
 const g=pgraph();
 const cards=CHAINS.map(c=>{const v=chainView(c);if(v.steps.length<2)return"";
  const doc=v.hops.filter(Boolean).length,tot=v.hops.length,ents=new Set();v.hops.forEach(h=>h&&h.entities.forEach(x=>ents.add(x)));
  const weak=v.steps.map((p,i)=>({p,i,n:downstream(p).procs.length})).sort((a,b)=>b.n-a.n)[0];
  const flow=v.steps.map((p,i)=>`<li class="plk-st1"><button type="button" class="plk-step ${Z.p.pstep===c.id+":"+i?"on":""}" data-plk-step="${c.id}:${i}" style="--c:var(--plk-c${FIDX[pFam(p)]})"><span class="small muted">${E(FAM[FIDX[pFam(p)]][1])}</span><b>${E(pName(p))}</b><span class="small">${downstream(p).procs.length} downstream</span></button>${i<v.steps.length-1?`<span class="plk-hop" aria-hidden="true"><i class="${v.hops[i]?MODEC[v.hops[i].mode]:"bad"}"></i><small>${v.hops[i]?E(v.hops[i].entities.slice(0,2).map(entN).join(", ")):"no handoff"}</small></span>`:""}</li>`).join("");
  return card(c.n,c.d,`<div class="statrow plk-st"><div class="stat"><small>Steps</small><span class="num" data-role="metric">${v.steps.length}</span></div><div class="stat"><small>Handoffs documented</small><span class="num" data-role="metric">${doc} of ${tot}</span></div><div class="stat"><small>Entities carried</small><span class="num" data-role="metric">${ents.size}</span></div><div class="stat"><small>Weakest link</small><span class="num" style="font-size:1.05rem">${E(pName(weak.p))}</span><em>${U.esc(weak.n)} processes downstream</em></div></div><ol class="plk-flow">${flow}</ol>`);
 }).join("");
 return `<div class="plk-lg">${legend([["Event handoff","--info-f"],["Batch handoff","--muted"],["Human handoff","--warn-f"],["No documented handoff","--bad-f"]])}</div><div class="plk-paths">${cards}</div><div class="card glass" data-plk-blast>${blastCard()}</div>`;
}
function findingsHTML(){
 const s=stats(),m=model(),g=pgraph();
 const procRow=(p,sub,tag,st)=>({id:p,t:pName(p),sub,tag,st,go:()=>hasScr(p)?go(p):pickP(p,true)});
 const entRow=(e,sub,tag,st)=>({id:e,t:entN(e),sub,tag,st,go:()=>go("plat_reg")});
 const nown=PLAT.nonOwnerWrites();
 const groups=[
  {key:"a",label:"Processes that share no registered data",rows:s.noShare.map(p=>procRow(p,"Keeps its data outside the registry. Register the entity it uses, then it connects.","No shared data","warn"))},
  {key:"b",label:"Processes with no documented handoff",rows:s.noHand.map(p=>procRow(p,"Nothing hands work to it or takes work from it in the handoff table.","No handoff","warn"))},
  {key:"c",label:"Entities written by more than one process",rows:s.multiP.map(e=>entRow(e,"Written by "+s.pw[e].map(pName).join(", ")+". Name one owner.","Two writers","bad"))},
  {key:"d",label:"Entities that processes use but no app writes",rows:s.noWriter.map(e=>entRow(e.id,"Used by "+g.cnt[e.id]+" processes. Who creates the records?","No writer","warn"))},
  {key:"e",label:"Writes by an app that is not the owner module",rows:nown.map(x=>entRow(x.ent,appN(x.app)+" writes it; the owner is "+x.owner+".","Not owner","warn"))},
  {key:"f",label:"Entities with no link at all",rows:s.isolated.map(e=>entRow(e,"No reference, reader or writer. Connect it or retire it.","Isolated","bad"))}
 ];
 return{groups,s,count:groups.reduce((a,x)=>a+x.rows.length,0)};
}
/* ---------- field lineage ---------- */
function srcFor(e,m){
 const t=e.id;
 if(m.auth==="platform")return{n:"Created in "+BRAND.name,d:"People and agents create it in "+(e.writers.map(appN).join(", ")||e.owner)+"."};
 let n="External system";
 if(t==="person"||t==="time_off")n="Entra ID and the HR system";
 else if(t==="invoice")n="ERP, the finance ledger";
 else if(t.indexOf("config_item")===0||t==="asset")n="Discovery tools";
 else if(["alert_event","metric_series","log_pattern","synthetic_check"].indexOf(t)>=0)n="Monitoring tools";
 else if(t==="pull_request")n="Source control";
 else if(t==="project_task"||t==="wbs_line")n="Project planning tool";
 else if(t==="user_story"||t==="feature")n="Agile tool";
 return{n:m.auth==="shared"?n+" and "+BRAND.name:n,d:m.why+"."};
}
const AUTHP={platform:"good",external:"info",shared:"warn"};
function linHTML(){
 const m=model(),L=Z.lin;let e=PLAT.ent(L.ent)||m.es[0];
 const f=e.fields.find(x=>x.k===L.f)||e.fields[0];if(!f)return`<p class="muted">This entity has no fields.</p>`;
 const meta=PLAT.fieldMeta(e.id,f),src=srcFor(e,meta),nown=PLAT.nonOwnerWrites().filter(x=>x.ent===e.id).map(x=>x.app);
 const tg=(f.type==="ref"||f.type==="person")?m.raw.filter(x=>x.type==="ref"&&x.from===e.id&&x.field.split(", ").indexOf(f.label||f.k)>=0).map(x=>x.to):[];
 const apps=appsOf(e.id),mets=metricsFor(apps),procs=procsTouching(e.id);
 const chip=(a,c)=>`<button type="button" class="chip plk-chip ${c||""}" data-plk-appgo="${E(a)}">${E(appN(a))}</button>`;
 const col=(h,body,cls)=>`<section class="plk-lc ${cls||""}"><div class="eyebrow">${h}</div>${body}</section>`;
 const arrow=`<span class="plk-ar" aria-hidden="true"></span>`;
 const opts=DORD.map(d=>`<optgroup label="${E(DOM[d].n)}">${m.es.filter(x=>x.domain===d).map(x=>`<option value="${E(x.id)}" ${x.id===e.id?"selected":""}>${E(x.label)}</option>`).join("")}</optgroup>`).join("");
 return `<div class="plk-brow plk-linsel"><label class="small muted">Entity <select class="fin" data-plk-lin="ent" aria-label="Entity">${opts}</select></label><label class="small muted">Field <select class="fin" data-plk-lin="f" aria-label="Field">${e.fields.map(x=>`<option value="${E(x.k)}" ${x.k===f.k?"selected":""}>${E(x.label||x.k)}</option>`).join("")}</select></label><button class="btn quiet" data-plk-appgo="${E(e.id)}" data-ent="1">Show the entity on the graph</button></div>
 <div class="plk-lin">
 ${col("1. Source",`<h4>${E(src.n)}</h4><p class="small">${E(src.d)}</p><p class="small muted">${meta.auth==="platform"?"No external system to mirror.":meta.auth==="external"?"Mirrored read-only. Edits here are blocked.":"Both sides edit. Differences open a reconciliation item."}</p>`)}${arrow}
 ${col("2. Rules in the registry",`<h4>${E(f.label||f.k)} <span class="muted small">(${E(f.k)})</span></h4><p class="small"><span class="pill ${AUTHP[meta.auth]}">${E(meta.auth)} authority</span> ${clsPill(meta.cls)} <span class="pill mute">${E(f.type||"string")}</span></p><dl class="plk-kv"><dt>Direction</dt><dd>${meta.dir==="in"?"In from the source":meta.dir==="out"?"Out of "+BRAND.name:"Both ways"}</dd><dt>Freshness</dt><dd>${E(meta.fresh)}</dd><dt>If they disagree</dt><dd>${E(meta.conflict)}</dd><dt>Quality rule</dt><dd>${E(meta.rule)}</dd><dt>Trust score</dt><dd>${Math.round(meta.trust*100)}%</dd>${tg.length?`<dt>Points to</dt><dd>${tg.map(x=>`<button type="button" class="chip plk-chip" data-plk-entgo="${E(x)}">${E(entN(x))}</button>`).join(" ")}</dd>`:""}</dl>`,"focus")}${arrow}
 ${col("3. Written by",e.writers.length?`<div class="plk-chips">${e.writers.map(a=>chip(a,nown.indexOf(a)>=0?"warn":"")).join("")}</div>${nown.length?`<p class="small muted">Highlighted apps write it but ${E(e.owner)} owns it. See the registry.</p>`:`<p class="small muted">All writers are the owner module.</p>`}`:`<p class="small muted">No app writes this entity yet.</p>`)}${arrow}
 ${col("4. Read by",e.readers.length?`<div class="plk-chips">${e.readers.map(a=>chip(a)).join("")}</div>`:`<p class="small muted">Nothing reads it yet, a candidate for retirement.</p>`)}${arrow}
 ${col("5. Used in",`<p class="small"><b>${mets.length}</b> metrics and <b>${procs.length}</b> processes.</p>${lrHTML({id:"plk_lm",groups:[{key:"m",label:"Metrics on screens that use it",rows:mets.map(k=>({id:k,t:METRICS[k].n,sub:METRICS[k].f,tag:"Metric",st:"info",go:()=>go("metrics")}))},{key:"p",label:"Processes",rows:procs.map(p=>({id:p,t:pName(p),sub:FAM[FIDX[pFam(p)]][1],tag:pEnts(p).w.indexOf(e.id)>=0?"Writes":"Reads",st:"mute",go:()=>pickP(p,true)}))}],limit:5,search:false,empty:"Nothing uses it yet."})}`)}
 </div>
 <p class="small" data-role="story">${E(f.label||f.k)} on ${E(e.label)} starts in <b>${E(src.n)}</b>, passes through the registry rules above, is written by ${plural(e.writers.length,"app")} and read by ${plural(e.readers.length,"app")}, and shows up in ${plural(mets.length,"metric")}. If it changes, ${plural(apps.length,"app")} and ${plural(procs.length,"process","processes")} feel it.</p>`;
}
/* ---------- entity by app matrix ---------- */
function matrixD(){
 const m=model(),doms=mpGet("plk_mdom"),non=new Set(PLAT.nonOwnerWrites().map(x=>x.ent+"|"+x.app)),multi=new Set(PLAT.multiWriters().map(x=>x.ent));
 const apps=PLAT.APPS.slice().sort((a,b)=>a.mod<b.mod?-1:a.mod>b.mod?1:a.n<b.n?-1:1);
 let rows=m.es.filter(e=>doms.indexOf(e.domain)>=0);
 if(Z.mx.issues)rows=rows.filter(e=>multi.has(e.id)||e.writers.some(a=>non.has(e.id+"|"+a)));
 const body=rows.map(e=>`<tr class="${multi.has(e.id)?"mw":""}"><th scope="row"><span class="plk-dot" style="--c:var(--plk-c${DCOL[e.domain]})"></span>${E(e.label)}${multi.has(e.id)?` <span class="pill warn">${e.writers.length} writers</span>`:""}</th>${apps.map(a=>{const w=e.writers.indexOf(a.id)>=0,r=e.readers.indexOf(a.id)>=0;if(!w&&!r)return`<td class="z"></td>`;const no=non.has(e.id+"|"+a.id);const t=w&&r?"RW":w?"W":"R";return`<td class="c ${w&&r?"b":w?"w":"r"}${no?" no":""}"><button type="button" data-plk-cell="${E(e.id)}|${E(a.id)}" aria-label="${E(a.n+" "+(w&&r?"reads and writes ":w?"writes ":"reads ")+e.label+(no?", not the owner":""))}">${t}</button></td>`}).join("")}</tr>`).join("");
 return `<div class="plk-brow">${mpHTML({id:"plk_mdom",label:"Domains",all:"All domains",opts:domOpts()})}${togBtn("m:issues","Only entities with problems",Z.mx.issues,"Show entities with two or more writers or a write by a non-owner")}</div>
 <div class="plk-lg">${legend([["Writes","--s3"],["Reads","--p1"],["Reads and writes","--u3"]])}<div class="legend" role="note"><span><i class="plk-no-sw"></i>Write by an app that is not the owner</span><span><i class="plk-mw-sw"></i>Row with two or more writers</span></div></div>
 <div class="plk-mxwrap"><table class="plk-mx plk-mxd"><thead><tr><th scope="col">Entity (${rows.length})</th>${apps.map(a=>`<th scope="col" class="v" title="${E(a.n+" ("+a.mod+")")}"><span>${E(trunc(a.n,24))}</span></th>`).join("")}</tr></thead><tbody>${body||`<tr><td>No entities match.</td></tr>`}</tbody></table></div>`;
}
function cellDrawer(ent,app){
 const e=PLAT.ent(ent),a=PLAT.app(app);if(!e||!a)return;
 const w=e.writers.indexOf(app)>=0,r=e.readers.indexOf(app)>=0,no=PLAT.nonOwnerWrites().some(x=>x.ent===ent&&x.app===app);
 const others=e.writers.filter(x=>x!==app);
 openDrawer(`<div class="eyebrow">${E(DOM[e.domain].n)}</div><h2 style="margin:4px 0">${E(a.n)} and ${E(e.label)}</h2>
 <p class="story" data-role="story">${E(a.n)} ${w&&r?"reads and writes":w?"writes":"reads"} ${E(e.label)}. ${no?`The owner is ${E(e.owner)}, so this write is outside its module and counts as debt.`:w?"It is the owner module, so the write is expected.":"Reading is always allowed and is how apps share data without copying it."} ${others.length?`Other writers: ${others.map(appN).join(", ")}.`:""}</p>
 <div class="row"><button class="btn primary" data-plk-entgo="${E(ent)}">Show on the graph</button><button class="btn quiet" data-plk-go="plat_reg">Open the registry</button><button class="btn quiet" data-plk-trace="${E(ent)}">Trace a field</button></div>
 ${no?`<div class="story small" style="margin-top:12px"><b>Suggested fix:</b> let ${E(e.owner)} own the write, and have ${E(a.n)} call it through the platform API.</div>`:""}`);
}
/* ---------- gaps: planned entities as ghost nodes ---------- */
function layoutG(){
 const m=model(),ghosts=PLAT.PLANNED.map(p=>m.gset.get(p[0])).sort((a,b)=>DORD.indexOf(a.domain)-DORD.indexOf(b.domain)||(a.label<b.label?-1:1));
 const ents=new Set(),apps=new Set();ghosts.forEach(g=>{m.conn[g.id].ents.forEach(x=>ents.add(x));m.conn[g.id].apps.forEach(x=>apps.add(x))});
 const ea=[...ents].map(x=>m.eset.get(x)).sort((a,b)=>DORD.indexOf(a.domain)-DORD.indexOf(b.domain)||(a.label<b.label?-1:1)),aa=[...apps].map(x=>PLAT.app(x)).sort((a,b)=>a.n<b.n?-1:1);
 const W=176,H=24,STEP=31,nodes=new Map();
 const put=(arr,x,mk)=>arr.forEach((o,i)=>{const n=mk(o);n.x=x;n.y=44+i*STEP;n.w=W;n.h=H;nodes.set(n.id,n)});
 put(ea,0,e=>({id:e.id,kind:"ent",label:e.label,e,v:ovVar(e)}));
 put(ghosts,380,g=>({id:nidG(g.id),kind:"gh",label:g.label,g}));
 put(aa,760,a=>({id:nidA(a.id),kind:"app",label:a.n,app:a}));
 const rows=Math.max(ea.length,ghosts.length,aa.length);
 return{nodes,ea,ghosts,aa,vb:[-20,-10,W+760+40,44+rows*STEP+20],heads:[[0,"Existing entities that would connect"],[380,"Planned entities"],[760,"Apps that would use them"]]};
}
function pickG(id){const G=Z.g;G.sel=G.sel===id?null:id;drawG()}
function drawG(){const h=document.querySelector("[data-plk-ghost]");if(!h){render();return}h.innerHTML=gHost()}
function gGraph(){
 const m=model(),L=layoutG(),sel=Z.g.sel;const lit=new Set();
 const edges=[];
 L.ghosts.forEach(g=>{const c=m.conn[g.id];c.ents.forEach(x=>edges.push({a:x,b:nidG(g.id),type:"pl"}));c.apps.forEach(a=>edges.push({a:nidG(g.id),b:nidA(a),type:"pl"}))});
 if(sel){lit.add(sel);edges.forEach(e=>{if(e.a===sel)lit.add(e.b);if(e.b===sel)lit.add(e.a)})}
 const ep=edges.filter(e=>L.nodes.has(e.a)&&L.nodes.has(e.b)).map(e=>{const c=curve(L.nodes.get(e.a),L.nodes.get(e.b),.6),on=sel&&(e.a===sel||e.b===sel);return`<path class="plk-e pl${on?" lit":""}" d="${c.d}" marker-end="url(#plk-ar-g-pl)"/>`}).join("");
 const st={sel,lit:sel?lit:null,hit:null};
 const ns=[...L.nodes.values()].map(n=>nodeSvg(n,st)).join("");
 const hd=L.heads.map(h=>`<text class="bh" x="${h[0]}" y="14">${E(h[1])}</text>`).join("");
 return svgFrame("g",vbFor("g",L.vb),`${hd}<g class="plk-edges">${ep}</g><g class="plk-nodes">${ns}</g>`,"Planned entities and what would connect to them",sel?"has-sel":"");
}
function gPanel(){
 const G=Z.g,m=model();
 if(!G.sel||!/^g:/.test(G.sel)){
  if(G.sel&&!/^g:/.test(G.sel)){const id=G.sel.replace(/^app:/,"");const gs=PLAT.PLANNED.filter(p=>{const c=m.conn[p[0]];return c.ents.indexOf(id)>=0||c.apps.indexOf(id)>=0}).map(p=>p[0]);
   return `<div class="plk-ph"><div class="eyebrow">${/^app:/.test(G.sel)?"App":"Existing entity"}</div><h3>${E(/^app:/.test(G.sel)?appN(id):entN(id))}</h3><p class="small muted">It would connect to ${gs.length} planned ${gs.length===1?"entity":"entities"}.</p></div>${lrHTML({id:"plk_gn",groups:[{key:"g",label:"Planned entities it connects to",rows:gs.map(x=>({id:x,t:entN(x),sub:m.gset.get(x).why,tag:"Planned",st:"warn",go:()=>pickG(nidG(x))}))}],limit:8,search:false})}`}
  const top=PLAT.PLANNED.map(p=>({p,n:m.conn[p[0]].ents.length+m.conn[p[0]].apps.length})).sort((a,b)=>b.n-a.n).slice(0,8);
  return `<div class="plk-ph"><div class="eyebrow">Nothing selected</div><h3>Pick a planned entity</h3><p class="small muted">Dashed nodes do not exist yet. Select one to see what would connect to it, why it is needed and who would own it.</p></div>${lrHTML({id:"plk_gtop",groups:[{key:"t",label:"Planned entities that would connect to the most",rows:top.map(t=>({id:t.p[0],t:t.p[2],sub:t.p[4],tag:t.n+" links",st:"warn",go:()=>pickG(nidG(t.p[0]))}))}],limit:8,search:false})}`;
 }
 const g=m.gset.get(G.sel.slice(2)),c=m.conn[g.id];
 return `<div class="plk-ph"><div class="eyebrow">Planned entity, ${E(DOM[g.domain].n)}</div><h3>${E(g.label)}</h3><p class="small muted"><code>${E(g.id)}</code>. Proposed steward ${E(g.steward)}. First users: ${E(g.use)}</p></div><div class="story small" data-role="story">${E(g.why)}</div>
 ${c.all?`<p class="small"><b>Every app would use it</b>, so it is not drawn as individual links.</p>`:""}${c.why.length?`<ul class="small plk-ul">${c.why.map(w=>`<li>${w}</li>`).join("")}</ul>`:""}
 ${lrHTML({id:"plk_gp2",groups:[{key:"e",label:"Existing entities that would connect",rows:c.ents.map(x=>({id:x,t:entN(x),sub:"",tag:"Entity",st:"info",go:()=>pickG(x)}))},{key:"a",label:"Apps that would use it",rows:c.apps.map(a=>({id:a,t:appN(a),sub:PLAT.app(a).mod,tag:"App",st:"mute",go:()=>pickG(nidA(a))}))}],limit:8,empty:"Nothing connects yet."})}
 <div class="row" style="margin-top:10px"><button class="btn primary" data-plk-go="plat_reg">Propose it in the registry</button></div>`;
}
function gHost(){return `<div class="plk-split"><div class="plk-main"><div class="plk-bar"><div class="plk-brow"><span class="small muted">Select a node to light its links.</span>${zoomBar("g")}</div></div><div class="plk-lg">${legend([["Existing entity (color is its domain)","--plk-c0"],["Planned entity (dashed)","--faint"],["App or screen","--muted"]])}</div><div class="plk-canvas tall" data-plk-canvas="g">${gGraph()}<p class="plk-hint small muted">Drag to pan. Hold Ctrl or Cmd and scroll to zoom.</p></div></div><aside class="plk-panel card glass" aria-live="polite" data-plk-panel>${gPanel()}</aside></div>`}
function gapTable(){
 const m=model();
 return btHTML({id:"plk_gap",cols:[
  {k:"label",label:"Planned entity",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.id)}</div>`,val:r=>r.label,wrap:true,w:200},
  {k:"domain",label:"Domain",fmt:r=>E(DOM[r.domain].n),val:r=>DOM[r.domain].n},
  {k:"ne",label:"Entities it touches",fmt:r=>r.ne,val:r=>r.ne},
  {k:"na",label:"Apps that would use it",fmt:r=>r.all?"All apps":r.na,val:r=>r.all?99:r.na},
  {k:"why",label:"Why",fmt:r=>E(r.why),val:r=>r.why,wrap:true,w:340}
 ],rows:()=>PLAT.PLANNED.map(p=>{const c=m.conn[p[0]];return{id:p[0],label:p[2],domain:p[1],ne:c.ents.length,na:c.apps.length,all:c.all,why:p[4]}}),key:"id",h:380,rowH:56,facets:["domain"],exportName:"planned-connections",open:id=>{Z.g.sel=nidG(id);drawG()}});
}
/* ---------- PR-32 B2: tenant views. Under a tenant other than core both screens read that tenant's records through DATA: the data map
   from its entities and the links between their rows (TREAD.audit), the process map from its processes, the metrics they report on and
   the objectives those metrics serve. Same purpose and tab names as the Meridian views; every figure is sample data (simulated). ---------- */
const tX=()=>window.STN||{};
const tTbl=(c,r)=>tX().table?tX().table(c,r):"";
const tMet=()=>DATA.get("metrics"),tObj=()=>DATA.get("objectives");
const tMetN=id=>(tMet().find(m=>m.id===id)||{}).n||id;
const tProcs=()=>DATA.get("processes");
function tDmap(){const A=TREAD.audit(),org=(DATA.tenantInfo()||{}).org||DATA.tenant();const lab=e=>E((A.ents.find(x=>x.entity===e)||{}).label||e);
 const withRows=A.ents.filter(e=>e.rows),gaps=A.ents.filter(e=>!e.rows),refs=A.links.reduce((n,l)=>n+l.n,0),bad=A.links.reduce((n,l)=>n+l.bad.length,0);
 const linked=new Set();A.links.forEach(l=>{linked.add(l.from);linked.add(l.to)});const iso=withRows.filter(e=>!linked.has(e.entity));
 const k0=kpiRow([["Entities with rows",withRows.length,"of "+A.ents.length+" defined"],["Links between records",refs,"field points to a record"],["Unresolved links",bad,"target not in this company",{cls:bad?"warn":"good",keep:true}],["Not linked",iso.length,"entities with rows and no link",{keep:true}]]);
 const p0=k0+card("Connections","Entity, field and the entity it points to, counted over this company's rows",tTbl(["From","Field","To","Links","Unresolved"],A.links.map(l=>[lab(l.from),E(l.field),lab(l.to),String(l.n),String(l.bad.length)])));
 const M=tMet(),O=tObj();
 const p1=card("Field lineage","Each metric, its formula and the objective it serves",M.length?tTbl(["Metric","Formula","Objective","Owner and backup"],M.map(m=>[`<b>${E(m.n)}</b>`,E(m.f||""),E((O.find(o=>o.id===m.obj)||{}).n||""),tX().own?tX().own(m.owner,m.backup,"metric:"+m.id):""])):(tX().gap?tX().gap("metrics"):TREAD.gap("metrics")));
 const pairs={};A.links.forEach(l=>{const k=l.from+"|"+l.to;pairs[k]=(pairs[k]||0)+l.n});
 const p2=card("Matrix","How many links run from each entity to each other entity",tTbl(["From","To","Links"],Object.keys(pairs).sort((a,b)=>pairs[b]-pairs[a]).map(k=>{const [a,b]=k.split("|");return[lab(a),lab(b),String(pairs[k])]})));
 const p3=card("Gaps",gaps.length+" entities have no rows in "+E(org)+" yet (recorded gaps, never filled from another company)",gaps.length?tTbl(["Entity","Area"],gaps.map(e=>[E(e.label),E(e.area||"")])):empty("No gaps","Every entity has rows in this company."))
  +card("Unresolved links","Record, field and missing target",bad?tTbl(["From","Record","Field","Missing"],[].concat(...A.links.map(l=>l.bad.map(b=>[lab(l.from),E(b.row),E(l.field),E(l.to)+": "+E(b.v)]))).slice(0,60)):empty("Every link resolves",refs+" links checked."));
 const head=tX().head?tX().head("Data connections","How every data element connects to every other",`<b data-role="metric">${withRows.length}</b> entities with rows and <b data-role="metric">${refs}</b> links between ${E(org)}'s records, read through the tenant data layer. <b data-role="metric">${bad}</b> links do not resolve and <b data-role="metric">${gaps.length}</b> entities are recorded gaps.`):"";
 return `<div class="screen plk-screen">${head}${lensNote()}${views("plk_d",["Connections","Field lineage","Matrix","Gaps"],[p0,p1,p2,p3])}${procCard("plat_dmap")}</div>`}
function tPmap(){const P=tProcs(),M=tMet(),O=tObj(),W=DATA.get("workflows"),org=(DATA.tenantInfo()||{}).org||DATA.tenant();
 const mets=p=>Array.isArray(p.metrics)?p.metrics:[];const share=(a,b)=>mets(a).filter(x=>mets(b).indexOf(x)>=0);
 const ho=[];P.forEach((a,i)=>P.slice(i+1).forEach(b=>{const s_=share(a,b);if(s_.length)ho.push({a,b,s:s_})}));
 const objOf=p=>[...new Set(mets(p).map(id=>(M.find(m=>m.id===id)||{}).obj).filter(Boolean))];
 const noMet=P.filter(p=>!mets(p).length),noWf=P.filter(p=>!p.wf||!W.some(w=>w.id===p.wf)),noBak=P.filter(p=>!p.backup||p.backup===p.owner),noHo=P.filter(p=>!ho.some(h=>h.a===p||h.b===p));
 const k0=kpiRow([["Processes",P.length,"in this company"],["Shared-metric links",ho.length,"two processes report on one metric"],["With a workflow",P.length-noWf.length,"steps defined"],["Objectives served",new Set([].concat(...P.map(objOf))).size,"of "+O.length]]);
 const p0=k0+card("Map","Each process, its workflow, the metrics it reports on and the objectives they serve",P.length?tTbl(["Process","Owner and backup","Metrics","Objectives"],P.map(p=>[`<b>${E(p.n||p.id)}</b><small class="muted"> ${E(p.id)}</small>`,tX().own?tX().own(p.owner,p.backup,"process:"+p.id):"",mets(p).map(id=>E(tMetN(id))).join(", ")||`<span class="muted">none</span>`,objOf(p).map(id=>E((O.find(o=>o.id===id)||{}).n||id)).join(", ")||`<span class="muted">none</span>`])):(tX().gap?tX().gap("processes"):TREAD.gap("processes")));
 const p1=card("Dependency matrix","Pairs of processes that report on the same metric",ho.length?tTbl(["Process","Process","Shared metrics"],ho.map(h=>[E(h.a.n),E(h.b.n),h.s.map(id=>E(tMetN(id))).join(", ")])):empty("No shared metrics","No two processes in this company report on the same metric."));
 const p2=card("Critical paths","Objective, the metrics that measure it and the processes that move them",O.length?tTbl(["Objective","Metrics","Processes"],O.map(o=>{const ms=M.filter(m=>m.obj===o.id);return[`<b>${E(o.n)}</b>`,ms.map(m=>E(m.n)).join(", ")||`<span class="muted">none</span>`,P.filter(p=>mets(p).some(id=>ms.some(m=>m.id===id))).map(p=>E(p.n)).join(", ")||`<span class="muted">none</span>`]})):(tX().gap?tX().gap("objectives"):TREAD.gap("objectives")));
 const f=[["No metric",noMet],["No workflow steps",noWf],["No backup",noBak],["No shared metric",noHo]];
 const p3=kpiRow(f.map(x=>[x[0],x[1].length,"processes",{cls:x[1].length?"warn":"good",keep:true}]))+card("Orphans and findings","Processes with a missing connection",f.some(x=>x[1].length)?tTbl(["Finding","Processes"],f.filter(x=>x[1].length).map(x=>[E(x[0]),x[1].map(p=>E(p.n||p.id)).join(", ")])):empty("No findings","Every process has a metric, a workflow, a backup and a shared metric."));
 const head=tX().head?tX().head("Process connections","No process runs alone",`<b data-role="metric">${P.length}</b> processes of ${E(org)}, joined by <b data-role="metric">${ho.length}</b> shared metrics. <b data-role="metric">${noHo.length}</b> processes share no metric with another, read through the tenant data layer.`):"";
 return `<div class="screen plk-screen">${head}${lensNote()}${views("plk_p",["Map","Dependency matrix","Critical paths","Orphans and findings"],[p0,p1,p2,p3])}${procCard("plat_pmap")}</div>`}
/* ---------- screens ---------- */
function dmapScreen(){if(!TREAD.core())return tDmap();
 const s=syncMetrics(),m=model(),refs=m.raw.filter(e=>e.type==="ref"&&!e.ghost).length,gref=m.raw.filter(e=>e.type==="ref"&&e.ghost).length;
 const hero_=hero("Data connections","How every data element connects to every other",`<b data-role="metric">${s.entities}</b> entities, <b data-role="metric">${refs}</b> field references between them and <b data-role="metric">${PLAT.APPS.length}</b> apps that read or write them, drawn as one graph. Select any node to see who writes it, who reads it and what breaks if a field changes. <b data-role="metric">${s.isolated.length}</b> entities are not linked to anything and <b data-role="metric">${PLAT.PLANNED.length}</b> planned entities would add ${gref} more links.`,
  `<div class="row">${fchip("m_plk_single")}${fchip("m_plk_conn")}${fchip("m_plk_reuse")}${stdChip("dmbok","Entity relationships and data lineage are the core of DMBOK data architecture.")}${stdChip("togaf","The graph is the TOGAF data architecture view, with apps as the application layer.")}</div>`);
 const k0=kpiRow([["Entities",s.entities,"CI classes counted once"],["Field references",refs,"entity points to entity"],["App links",m.raw.filter(e=>e.type!=="ref").length,"reads and writes"],["Single writer",METRICS.m_plk_single.cur+"%","of written entities",{metric:"m_plk_single"}],["Isolated entities",s.isolated.length,"no link at all",{cls:s.isolated.length?"bad":"good",keep:true}]]);
 const ctl=`<div class="plk-brow plk-ctl"><label class="plk-search"><span class="small muted">Search</span><input type="search" class="txtin" data-plk-q="d" value="${E(Z.d.q)}" placeholder="Entity, app or field name" aria-label="Search the graph"></label>${mpHTML({id:"plk_dom",label:"Domains",all:"All domains",opts:domOpts(),onChange:()=>{Z.d.vb=null}})}</div>`;
 const pane0=`${k0}${ctl}<div data-plk-dhost>${dHost()}</div>`;
 const s2=PLAT.stats(),k1=kpiRow([["Fields in the catalog",s2.nf.toLocaleString(),"each with a source rule"],["External authority",s2.extAuth,"mirrored, never edited here"],["Shared authority",s2.shared,"both sides edit"],["Metrics tied to apps",Object.keys(METRICS).filter(k=>metricsFor(PLAT.APPS.map(a=>a.id)).indexOf(k)>=0).length,"read these entities"]]);
 const pane1=`${k1}<div data-plk-linhost>${linHTML()}</div>`;
 const non=PLAT.nonOwnerWrites(),mw=PLAT.multiWriters();
 const k2=kpiRow([["Entities with two or more writers",mw.length,"one owner is the goal",{cls:mw.length?"warn":"good",keep:true}],["Writes by a non-owner",non.length,"counted as debt",{cls:non.length?"warn":"good",keep:true}],["Readers in total",PLAT.stats().readers,"app to entity reads"],["Writers in total",PLAT.stats().writers,"app to entity writes"]]);
 const pane2=`${k2}<div data-plk-mxhost>${matrixD()}</div>`;
 const gh=PLAT.PLANNED.length,ge=new Set(),ga=new Set();PLAT.PLANNED.forEach(p=>{m.conn[p[0]].ents.forEach(x=>ge.add(x));m.conn[p[0]].apps.forEach(x=>ga.add(x))});
 const k3=kpiRow([["Planned entities",gh,"missing from the model",{cls:"warn",keep:true}],["Existing entities that connect",ge.size,"would gain a link"],["Apps that would use them",ga.size,"named by their first users"],["Duplicate fixes open",PLAT.FIXES.filter(f=>!S.plat.applied[f.id]).length,"merge into planned entities"]]);
 const pane3=`${k3}<div data-plk-ghost>${gHost()}</div><div style="margin-top:14px">${gapTable()}</div>`;
 return `<div class="screen plk-screen">${hero_}${lensNote()}${views("plk_d",["Connections","Field lineage","Matrix","Gaps"],[pane0,pane1,pane2,pane3])}${procCard("plat_dmap")}</div>`;
}
function pmapScreen(){if(!TREAD.core())return tPmap();
 const s=syncMetrics(),g=pgraph(),fl=FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0])).length;
 const fd=findingsHTML();
 const hero_=hero("Process connections","No process runs alone",`<b data-role="metric">${g.ids.length}</b> processes in <b data-role="metric">${fl}</b> families, joined by <b data-role="metric">${g.ho.length}</b> documented handoffs and <b data-role="metric">${g.dep.length}</b> shared-data dependencies. <b data-role="metric">${s.noShare.length}</b> processes keep their data outside the registry and <b data-role="metric">${s.noHand.length}</b> have no documented handoff.`,
  `<div class="row">${fchip("m_plk_hand")}${fchip("m_plk_reuse")}${fchip("m_plk_single")}${stdChip("bpmn","Handoffs follow BPMN: a message or event between pools, with the data it carries.")}${stdChip("togaf","The map is the TOGAF business architecture view tied to the data architecture.")}</div>`);
 const mode={};g.ho.forEach(h=>mode[h.mode]=(mode[h.mode]||0)+1);
 const k0=kpiRow([["Processes",g.ids.length,fl+" families"],["Handoffs",g.ho.length,(mode.event||0)+" event, "+(mode.batch||0)+" batch, "+(mode.human||0)+" human"],["With a handoff",METRICS.m_plk_hand.cur+"%","of processes",{metric:"m_plk_hand"}],["Data reuse",METRICS.m_plk_reuse.cur+"%","entities used by 2+ processes",{metric:"m_plk_reuse"}],["Hub entities",g.hubs.size,[...g.hubs].slice(0,3).map(entN).join(", ")||"none"]]);
 const ctl=`<div class="plk-brow plk-ctl"><label class="plk-search"><span class="small muted">Search</span><input type="search" class="txtin" data-plk-q="p" value="${E(Z.p.q||"")}" placeholder="Process or family name" aria-label="Search processes"></label>${mpHTML({id:"plk_fam",label:"Families",all:"All families",opts:FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0])).map(f=>({v:f[0],l:f[1]})),onChange:()=>{Z.p.vb=null}})}</div>`;
 const pane0=`${k0}${ctl}<div data-plk-phost>${pHost()}</div>`;
 const famPairs=[];FAM.forEach(a=>FAM.forEach(b=>{if(a[0]<b[0]){const n=famShared(a[0],b[0]).length;if(n)famPairs.push(n)}}));
 const k1=kpiRow([["Family pairs sharing data",famPairs.length,"of "+(fl*(fl-1)/2)+" possible"],["Strongest link",famPairs.length?Math.max.apply(null,famPairs):0,"shared entities"],["Data dependencies",g.dep.length,"one writes, one reads"],["Hub entities set aside",g.hubs.size,Z.p.hub?"counted":"not counted"]]);
 const pane1=`${k1}<div data-plk-pmxhost>${matrixP()}</div>`;
 const k2=kpiRow([["Critical chains",CHAINS.length,"end to end"],["Handoffs on chains",CHAINS.reduce((a,c)=>a+chainView(c).hops.filter(Boolean).length,0),"all documented"],["Longest chain",Math.max.apply(null,CHAINS.map(c=>chainView(c).steps.length)),"processes"],["Widest blast radius",Math.max.apply(null,g.ids.map(p=>downstream(p).procs.length)),"processes downstream"]]);
 const pane2=`${k2}${pathsHTML()}`;
 const k3=kpiRow([["Findings",fd.count,"across 6 checks",{cls:fd.count?"warn":"good",keep:true}],["No shared data",s.noShare.length,"processes"],["No handoff",s.noHand.length,"processes"],["Two writers",s.multiP.length,"entities written by 2+ processes"],["Isolated entities",s.isolated.length,"no link at all"]]);
 const pane3=`${k3}<p class="muted small">Each finding opens the process screen or the registry. Fixing the first two groups raises the handoff metric; fixing the third and fourth raises the single-writer metric.</p>${lrHTML({id:"plk_find",groups:fd.groups,limit:6,empty:"No findings."})}`;
 return `<div class="screen plk-screen">${hero_}${lensNote()}${views("plk_p",["Map","Dependency matrix","Critical paths","Orphans and findings"],[pane0,pane1,pane2,pane3])}${procCard("plat_pmap")}</div>`;
}
const IC1="M5 6a2 2 0 1 0 0 .01M19 6a2 2 0 1 0 0 .01M12 19a2 2 0 1 0 0 .01M7 7l4 10M17 7l-4 10M7 6h10";
REG("plat_dmap","Data connections","platform",IC1,dmapScreen);
REG("plat_pmap","Process connections","platform","M3 6h6v4H3zM15 6h6v4h-6zM9 14h6v4H9zM6 10v2h12v-2M12 12v2",pmapScreen);
try{DATA.screen("plat_dmap",{mode:"data",entities:["metrics","objectives","processes","trace_links"],note:"PR-32 B2: other tenants map their own entities and links through DATA"});
 DATA.screen("plat_pmap",{mode:"data",entities:["processes","metrics","objectives","workflows"],note:"PR-32 B2: other tenants map their own processes through DATA"})}catch(e){console.error("plk tenant",e)}
PROC.reg("plat_dmap",{title:"How the data connection map stays true",std:["dmbok","togaf"],steps:[
 {n:"Fields declare references",d:"A field of type reference names the entity it points to, so every join is known.",who:"human",owner:"Entity steward",out:"Reference list"},
 {n:"Apps declare reads and writes",d:"Each app lists what it reads and writes; the registry compares writers to the owner module.",who:"robot",owner:"Platform",out:"App links"},
 {n:"The graph is built",d:"References, reads and writes become edges. Nothing is drawn by hand.",who:"robot",owner:"Platform",out:"Graph"},
 {n:"Gaps are proposed",d:"The Registry Agent spots isolated or duplicate entities and drafts a fix.",who:"agent",owner:"Registry Agent",out:"Findings"},
 {n:"Data council decides",d:"The council accepts, reshapes or rejects each proposed link or entity.",who:"gate",owner:"Data council",sla:"3 days",out:"Registry change"}]});
PROC.reg("plat_pmap",{title:"How the process connection map stays true",std:["bpmn","togaf"],steps:[
 {n:"Owners define processes",d:"Each screen registers its steps and who does them.",who:"human",owner:"Process owners",out:"Process definitions"},
 {n:"Handoffs are declared",d:"A handoff names the data it carries, the trigger and whether it is an event, a batch or a person.",who:"human",owner:"Process governance lead",out:"Handoff table"},
 {n:"Data sharing is derived",d:"Two processes that touch the same entity are linked automatically through the registry.",who:"robot",owner:"Platform",out:"Dependencies"},
 {n:"Findings are raised",d:"Processes with no shared data, no handoff or a second writer are listed for review.",who:"agent",owner:"Process Agent",out:"Findings"},
 {n:"Governance reviews",d:"The process governance lead accepts or reshapes each finding.",who:"gate",owner:"Process governance lead",sla:"Monthly",out:"Updated map"}]});
/* ---------- events ---------- */
let dragged=false;
function refocus(sel){const el=document.querySelector(sel);if(el)try{el.focus({preventScroll:true})}catch(x){}}
const cssq=v=>String(v).replace(/"/g,'\\"');
ROUTER.on("click",e=>{
 if(dragged){dragged=false;if(e.target.closest("[data-plk-vp]")){e.stopPropagation();return}}
 let t;
 if((t=e.target.closest("[data-plk-n]"))){const vp=t.closest("[data-plk-vp]"),k=vp?vp.dataset.plkVp:"d",id=t.dataset.plkN;
  if(k==="g"){pickG(id);refocus(`[data-plk-ghost] [data-plk-n="${cssq(id)}"]`);return}
  if(Z.d.sel===id&&!/^dom:/.test(id)){Z.d.sel=null;if(Z.d.hop>0)Z.d.vb=null;drawD(false);return}
  Z.d.sel=id;Z.d.ff="";if(Z.d.hop>0&&!/^dom:/.test(id))Z.d.vb=null;drawD(false);refocus(`[data-plk-dhost] [data-plk-n="${cssq(id)}"]`);return}
 if((t=e.target.closest("[data-plk-pn]"))){const id=t.dataset.plkPn;if(Z.p.sel===id&&!/^fam:/.test(id)&&window.PROCLIB&&PROCLIB.open&&PROCLIB.open(id)!==false){return}if(Z.p.sel===id){Z.p.sel=null;if(Z.p.hop>0)Z.p.vb=null;drawP(false);return}Z.p.sel=id;if(Z.p.hop>0&&!/^fam:/.test(id))Z.p.vb=null;drawP(false);refocus(`[data-plk-phost] [data-plk-pn="${cssq(id)}"]`);return}
 if((t=e.target.closest("[data-plk-dtoggle]"))){const k=t.dataset.plkDtoggle;Z.d.col[k]=!Z.d.col[k];audit("Domain "+(Z.d.col[k]?"collapsed":"expanded"),DOM[k]?DOM[k].n:k);if(Z.d.sel&&/^dom:/.test(Z.d.sel)&&!Z.d.col[k])Z.d.sel=null;drawD(true);return}
 if((t=e.target.closest("[data-plk-ptoggle]"))){const k=t.dataset.plkPtoggle;Z.p.exp[k]=!Z.p.exp[k];if(Z.p.sel==="fam:"+k&&Z.p.exp[k])Z.p.sel=null;drawP(true);return}
 if((t=e.target.closest("[data-plk-ov]"))){Z.d.ov=t.dataset.plkOv;drawD(false);return}
 if((t=e.target.closest("[data-plk-tog]"))){const [g,p]=t.dataset.plkTog.split(":");
  if(g==="d"){Z.d[p]=!Z.d[p];drawD(p==="apps"||p==="pl"||Z.d.hop>0);return}
  if(g==="p"){Z.p[p]=!Z.p[p];if(p==="hub"){render();return}drawP(false);return}
  if(g==="m"){Z.mx[p]=!Z.mx[p];render();return}}
 if((t=e.target.closest("[data-plk-hopset]"))){const n=+t.dataset.plkHopset;Z.d.hop=n;Z.d.vb=null;if(n>0&&!Z.d.sel){const m=model(),deg={};m.raw.forEach(x=>m.key(x).forEach(i=>deg[i]=(deg[i]||0)+1));Z.d.sel=m.es.map(x=>x.id).sort((a,b)=>(deg[b]||0)-(deg[a]||0))[0]}audit("Focus set",n?n+" hops":"whole model");drawD(true);return}
 if((t=e.target.closest("[data-plk-hop]"))){Z.d.hop=+t.dataset.plkHop;Z.d.vb=null;drawD(true);return}
 if((t=e.target.closest("[data-plk-phopset]"))){const n=+t.dataset.plkPhopset;Z.p.hop=n;Z.p.vb=null;if(n>0&&(!Z.p.sel||/^fam:/.test(Z.p.sel))){const g=pgraph();Z.p.sel=g.ids.slice().sort((a,b)=>g.ho.filter(h=>h.from===b||h.to===b).length-g.ho.filter(h=>h.from===a||h.to===a).length)[0]}drawP(true);return}
 if((t=e.target.closest("[data-plk-phop]"))){Z.p.hop=+t.dataset.plkPhop;Z.p.vb=null;drawP(true);return}
 if((t=e.target.closest("[data-plk-colall]"))){const on=t.dataset.plkColall.split(":")[1]==="1";DORD.concat(["plan"]).forEach(k=>Z.d.col[k]=on);Z.d.sel=null;drawD(true);return}
 if((t=e.target.closest("[data-plk-pcol]"))){const on=t.dataset.plkPcol==="0";FAM.forEach(f=>Z.p.exp[f[0]]=on);drawP(true);return}
 if((t=e.target.closest("[data-plk-view]"))){Z.d.view=t.dataset.plkView;drawD(false);return}
 if((t=e.target.closest("[data-plk-pview]"))){Z.p.view=t.dataset.plkPview;drawP(false);return}
 if((t=e.target.closest("[data-plk-zoom]"))){const [k,a]=t.dataset.plkZoom.split(":");zoomVp(k,a==="in"?1.35:a==="out"?1/1.35:"fit");return}
 if((t=e.target.closest("[data-plk-pfull]"))){if(window.PROCLIB)PROCLIB.open(t.dataset.plkPfull);return}
 if((t=e.target.closest("[data-plk-go]"))){closeDrawer&&0;go(t.dataset.plkGo);return}
 if((t=e.target.closest("[data-plk-pgo]"))){Z.p.sel=t.dataset.plkPgo;S.v.plk_p=0;go("plat_pmap");return}
 if((t=e.target.closest("[data-plk-entgo]"))){closeDrawer();Z.d.sel=t.dataset.plkEntgo;Z.d.ff="";S.v.plk_d=0;if(Z.d.hop>0)Z.d.vb=null;if(document.querySelector("[data-plk-dhost]")){render()}else go("plat_dmap");return}
 if((t=e.target.closest("[data-plk-appgo]"))){const id=t.dataset.plkAppgo;Z.d.sel=t.dataset.ent?id:nidA(id);if(Z.d.hop>0)Z.d.vb=null;S.v.plk_d=0;render();return}
 if((t=e.target.closest("[data-plk-trace]"))){closeDrawer();Z.lin={ent:t.dataset.plkTrace,f:null};S.v.plk_d=1;if(document.querySelector("[data-plk-linhost]"))render();else go("plat_dmap");audit("Field lineage opened",t.dataset.plkTrace);return}
 if((t=e.target.closest("[data-plk-cell]"))){const [en,ap]=t.dataset.plkCell.split("|");cellDrawer(en,ap);return}
 if((t=e.target.closest("[data-plk-pair]"))){const [k,a,b]=t.dataset.plkPair.split(":");pairDrawer(k,a,b);return}
 if((t=e.target.closest("[data-plk-step]"))){Z.p.pstep=t.dataset.plkStep;document.querySelectorAll("[data-plk-step]").forEach(b=>b.classList.toggle("on",b.dataset.plkStep===Z.p.pstep));const h=document.querySelector("[data-plk-blast]");if(h)h.innerHTML=blastCard();audit("Blast radius viewed",t.dataset.plkStep);return}
 if((t=e.target.closest("[data-plk-mxlev]"))){Z.p.mx=t.dataset.plkMxlev;render();return}
});
ROUTER.on("input","[data-plk-q]",(e,t)=>{const k=t.dataset.plkQ;
 if(k==="d"){Z.d.q=t.value;drawD(false)}else{Z.p.q=t.value;drawP(false)}
});
ROUTER.on("change",e=>{
 let t;
 if((t=e.target.closest("[data-plk-ff]"))){Z.d.ff=t.value;const p=document.querySelector("[data-plk-dhost] [data-plk-panel]");if(p)p.innerHTML=panelD();return}
 if((t=e.target.closest("[data-plk-lin]"))){if(t.dataset.plkLin==="ent"){Z.lin={ent:t.value,f:null}}else Z.lin.f=t.value;const h=document.querySelector("[data-plk-linhost]");if(h)h.innerHTML=linHTML();return}
});
/* keyboard: activate nodes, pan and zoom the focused canvas */
ROUTER.on("keydown",e=>{
 const nd=e.target.closest&&e.target.closest("[data-plk-n],[data-plk-pn],[data-plk-dtoggle],[data-plk-ptoggle]");
 if(nd&&(e.key==="Enter"||e.key===" ")){e.preventDefault();nd.dispatchEvent(new MouseEvent("click",{bubbles:true}));return}
 const vp=e.target.closest&&e.target.closest("[data-plk-vp]");if(!vp)return;const k=vp.dataset.plkVp;
 const cur=vp.getAttribute("viewBox").split(" ").map(Number),st=cur[2]*.12;
 const map={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]};
 if(map[e.key]){e.preventDefault();panVp(k,map[e.key][0],map[e.key][1]);return}
 if(e.key==="+"||e.key==="="){e.preventDefault();zoomVp(k,1.35)}else if(e.key==="-"){e.preventDefault();zoomVp(k,1/1.35)}else if(e.key==="0"){zoomVp(k,"fit")}
 else if(e.key==="Escape"){if(k==="d"&&Z.d.sel){Z.d.sel=null;Z.d.vb=null;drawD(false)}else if(k==="p"&&Z.p.sel){Z.p.sel=null;drawP(false)}else if(k==="g"&&Z.g.sel){Z.g.sel=null;drawG()}}
});
/* pointer pan, ctrl+wheel zoom */
let drag=null;
ROUTER.on("pointerdown",e=>{
 const vp=e.target.closest&&e.target.closest("[data-plk-vp]");if(!vp||e.button!==0)return;
 const r=vp.getBoundingClientRect(),cur=vp.getAttribute("viewBox").split(" ").map(Number);
 drag={vp,x:e.clientX,y:e.clientY,cur,sc:Math.max(cur[2]/r.width,cur[3]/r.height),moved:false};
});
ROUTER.on("pointermove",e=>{
 if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;drag.vp.classList.add("panning");
 const nv=[drag.cur[0]-dx*drag.sc,drag.cur[1]-dy*drag.sc,drag.cur[2],drag.cur[3]];
 stateOf(drag.vp.dataset.plkVp).vb=nv;drag.vp.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "));
});
ROUTER.on("pointerup",()=>{if(drag){drag.vp.classList.remove("panning");if(drag.moved)dragged=true;setTimeout(()=>{dragged=false},60);drag=null}});
document.addEventListener("wheel",e=>{
 const vp=e.target.closest&&e.target.closest("[data-plk-vp]");if(!vp||!(e.ctrlKey||e.metaKey))return;e.preventDefault();
 const k=vp.dataset.plkVp,r=vp.getBoundingClientRect(),cur=vp.getAttribute("viewBox").split(" ").map(Number);
 const f=e.deltaY<0?1.18:1/1.18,sc=Math.max(cur[2]/r.width,cur[3]/r.height);
 const px=cur[0]+(e.clientX-r.left-(r.width-cur[2]/sc)/2)*sc,py=cur[1]+(e.clientY-r.top-(r.height-cur[3]/sc)/2)*sc;
 const w=cur[2]/f,h=cur[3]/f,fit=vp.dataset.fit.split(" ").map(Number);if(w>fit[2]*2.5||w<fit[2]/12)return;
 const nv=[px-(px-cur[0])/f,py-(py-cur[1])/f,w,h];stateOf(k).vb=nv;vp.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "));
},{passive:false});
/* ---------- search and chat ---------- */
SEARCHX.push(()=>{const m=model();return m.es.map(en=>({g:"Data connections",t:en.label+" ("+en.id+")",m:en.writers.length+" writers, "+en.readers.length+" readers",c:"--p4",f:()=>{Z.d.sel=en.id;Z.d.ff="";S.v.plk_d=0;go("plat_dmap")},k:en.id+" entity connections graph "+en.fields.map(f=>f.k).join(" ")}))
 .concat(pgraph().ids.map(p=>({g:"Process connections",t:pName(p),m:FAM[FIDX[pFam(p)]][1],c:"--p5",f:()=>{Z.p.sel=p;S.v.plk_p=0;go("plat_pmap")},k:p+" process handoff "+(PROC.defs[p]?PROC.defs[p].title:"")})))});
const ALIAS={change:"change_request",changes:"change_request",ci:"config_item",cis:"config_item",service:"business_service",services:"business_service",people:"person",user:"person",users:"person",problem:"problem_record",problems:"problem_record",request:"request_item",requests:"request_item",incidents:"incident",invoices:"invoice",projects:"project",alert:"alert_event",alerts:"alert_event",story:"user_story",sla:"sla_definition",slas:"sla_definition",contracts:"contract",tasks:"project_task",task:"project_task",assets:"asset",skills:"skill_claim"};
function mentionedEnts(q){
 const t=" "+q.toLowerCase().replace(/[^a-z0-9_ ]/g," ")+" ",m=model(),out=[];
 m.es.forEach(e=>{const l=" "+e.label.toLowerCase()+" ",i=" "+e.id.replace(/_/g," ")+" ";let p=t.indexOf(l);if(p<0)p=t.indexOf(i);if(p<0)p=t.indexOf(" "+e.id+" ");if(p>=0)out.push({id:e.id,p,len:e.label.length})});
 Object.keys(ALIAS).forEach(a=>{const p=t.indexOf(" "+a+" ");if(p>=0&&!out.some(o=>o.id===ALIAS[a]))out.push({id:ALIAS[a],p,len:a.length})});
 return out.sort((a,b)=>a.p-b.p).map(o=>o.id).filter((x,i,arr)=>arr.indexOf(x)===i);
}
function shortestPath(a,b){
 const m=model(),prev=new Map([[a,null]]);let fr=[a];
 while(fr.length&&!prev.has(b)){const nx=[];fr.forEach(u=>(m.adj.get(u)||[]).forEach(({id,e})=>{if(!prev.has(id)&&!/^g:/.test(id)){prev.set(id,{from:u,e});nx.push(id)}}));fr=nx}
 if(!prev.has(b))return null;const path=[];let c=b;while(c!==a){const p=prev.get(c);path.unshift({to:c,from:p.from,e:p.e});c=p.from}return path;
}
ASKX.push(q=>{
 const t=q.toLowerCase();
 let mm=t.match(/how (?:is|are) (.+?) (?:connected|linked|related) to (.+?)[?.]*$/);
 if(mm){const a=mentionedEnts(mm[1])[0],b=mentionedEnts(mm[2])[0];
  if(a&&b){const p=shortestPath(a,b);Z.d.sel=a;Z.d.hop=0;Z.d.vb=null;S.v.plk_d=0;go("plat_dmap");
   const txt=p?entN(a)+" connects to "+entN(b)+" in "+p.length+(p.length===1?" step: ":" steps: ")+[entN(a)].concat(p.map(s=>{const lab=/^app:/.test(s.to)?appN(s.to.slice(4)):entN(s.to);return(s.e.type==="ref"?"points to ":s.e.type==="write"?"is written by ":"is read by ")+lab})).join(", ")+".":"No path was found between "+entN(a)+" and "+entN(b)+".";
   say(q,{t:txt,steps:["Opened Data connections","Selected "+entN(a)]});return true}}
 mm=t.match(/what (?:reads|uses|touches|writes|writes to) (.+?)[?.]*$/);
 if(mm){const a=mentionedEnts(mm[1])[0];if(a){const e=PLAT.ent(a);Z.d.sel=a;Z.d.vb=null;S.v.plk_d=0;go("plat_dmap");
  say(q,{t:e.label+" is read by "+(e.readers.map(appN).join(", ")||"no app")+" and written by "+(e.writers.map(appN).join(", ")||"no app")+".",steps:["Opened Data connections","Selected "+e.label]});return true}}
 mm=t.match(/(?:which|what) processes (?:depend on|use|touch|read|write) (.+?)[?.]*$/);
 if(mm){const a=mentionedEnts(mm[1])[0];if(a){const ps=procsTouching(a);Z.d.sel=a;S.v.plk_d=0;go("plat_dmap");
  say(q,{t:ps.length?plural(ps.length,"process","processes")+" touch "+entN(a)+": "+ps.slice(0,10).map(pName).join(", ")+(ps.length>10?" and "+(ps.length-10)+" more":"")+".":"No process touches "+entN(a)+" yet.",steps:["Opened Data connections"]});return true}}
 if(/process(es)? (map|connection|handoff|depend)|how are (the )?processes (connected|related)|handoffs?/.test(t)){const g=pgraph();go("plat_pmap");say(q,{t:g.ids.length+" processes are joined by "+g.ho.length+" documented handoffs and "+g.dep.length+" shared-data dependencies. Select any process to see what it hands over and what breaks if it stops.",steps:["Opened Process connections"]});return true}
 if(/data (connections|map|graph)|entity (map|graph|relationship)|how .*data.*connected/.test(t)){go("plat_dmap");say(q,{t:"Here is the data connection graph. Select an entity to light its links.",steps:["Opened Data connections"]});return true}
 return false;
});
})();
