/* ===== Round 18, B: duplicate remediation. Screens that did the same job are merged into families with one menu entry and a view switcher.
   Every old screen id keeps working (links, favorites, search records, process and module-map references). Uses the R15 family mechanism. ===== */
(function(){
"use strict";
const W=window;const R15=W.R15;const R18=W.R18;if(!R15||!R15.families||!R18)return;
const {G}=R18;
const REPLACE=["draw_studio","flw_dmn","svc_notify","tower","kg","exe_risk","flw_appr"];
/* [canonical id, family label, views [id,label]] */
const NEW=[
 {id:"plat_proc",label:"Processes",views:[["plat_proc","Library"],["draw_studio","Draw a process"],["flw_bpmn","BPMN models"],["flw_design","Workflow designer"],["r16m_guides","Process guides"]]},
 {id:"flw_dmn",label:"Rules and decisions",views:[["flw_dmn","Decision rules"],["dec_cov","Coverage"],["r17s_rules","In-app rules and scripts"],["zevt","Events and rules"],["svc_notify","Notifications"]]},
 {id:"flw_appr",label:"My approvals",views:[["flw_appr","Approvals"],["inbox","Alerts and inbox"],["r16h_groups","Approval groups"],["r16h_rules","Approval rules"]]},
 {id:"tower",label:"AI agents",views:[["tower","Control tower"],["r15d_agents","Agent registry"],["ai_runtime","Agent runtime"],["adm_gate","Usage and cost"],["flw_agent","Agent workflows"],["kcs_skills","Skills"]]},
 {id:"r16g_perm",label:"Permissions",views:[["r16g_perm","Who can do what"],["adm_sec","Security and access"]]},
 {id:"kg",label:"Impact Explorer",views:[["kg","What a change affects"],["itom_graph","Technology dependencies"],["vault","Connected knowledge"]]},
 {id:"metrics",label:"Measures and targets",views:[["metrics","Measures"],["svc_sla","Service promises"],["itom_slo","Reliability targets"],["bc_metrics","Resilience metrics"]]},
 {id:"exe_risk",label:"Risk",views:[["exe_risk","Heat map and Monte Carlo"],["grc_risk","Risk register"],["grc_ven","Third-party risk"],["grc_exc","Exceptions and acceptances"]]},
 {id:"plat_reg",label:"Registries",views:[["plat_reg","Platform registry"],["exe_apps","Applications"],["svc_360","Services"],["own_gaps","Ownership and gaps"],["r15d_facts","Facts and conflicts"],["r16h_ci","CI ownership"]]},
 {id:"r18_builds",label:"My builds",views:[["r18_builds","Builds"],["r18_mature","Maturity roadmaps"],["r18_debt","Risk and debt"],["plat_debt","Platform debt"]]}
];
function apply(){
 const FAM=R15.families,N=R15.names=R15.names||{},famOf=R15.famOf=R15.famOf||{};
 /* drop the old families being replaced */
 for(let i=FAM.length-1;i>=0;i--){if(REPLACE.indexOf(FAM[i].id)>=0)FAM.splice(i,1)}
 NEW.forEach(f=>{const ex=FAM.findIndex(x=>x.id===f.id);if(ex>=0)FAM.splice(ex,1);FAM.push(f)});
 /* rebuild lookup */
 Object.keys(famOf).forEach(k=>delete famOf[k]);
 FAM.forEach(f=>f.views.forEach(([id,v])=>{famOf[id]=f;if(id===f.id)N[id]=f.label;else{N[id]=f.label+": "+v;R15.hidden[id]=1}}));
 /* the canonical screen of a family that used to be hidden must show again */
 FAM.forEach(f=>{delete R15.hidden[f.id]});
 /* a hidden member keeps its own group so crumbs and the menu agree */
 G(()=>{const M=NAVX.map;Object.keys(R15.hidden).forEach(id=>{if(M[id])M[id].g="r15hid"});if(NAVX.int&&NAVX.int.IDX)NAVX.int.IDX.dirty=true});
 G(()=>R18.regroup());
 G(()=>{FAM.forEach(f=>{if(N[f.id]&&NAVX.map[f.id])NAVX.map[f.id].l=N[f.id]})});
 G(()=>{if(window.renderNav&&document.querySelector("#nav"))renderNav()});
}
R18.families=NEW;R18.applyFamilies=apply;
apply();
/* names, then once more after the other modules have finished adding their screens */
[60,400,1500].forEach(t=>setTimeout(apply,t));
})();
