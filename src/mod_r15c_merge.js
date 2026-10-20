/* ===== Round 15, Agent C: one name per screen, and merged screen families =====
   A family is one menu entry with several views. The canonical screen stays in the menu; the others stay registered
   (so links, search records, favorites, PROC and MODMAP references keep resolving) but leave the menu and the search list
   and are reached from a view switcher at the top of every member. Truly duplicate screens redirect through R15.alias. */
(function(){
const W=window,D=document;const R15=W.R15=W.R15||{};
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const FAM=R15.families=[
 {id:"meet_hub",label:"Meetings",views:[["meet_hub","Plan and run"],["fo","Calendar and follow-ups"],["meet_act","Actions"],["meet_dec","Decisions"],["meet_series","Forums and series"],["ppl_meet","Minutes"],["ppl_av","Rooms"]]},
 {id:"org_chart",label:"Org chart",views:[["org_chart","Chart and AI teammates"],["ppl_org","Workload"]]},
 {id:"bud_over",label:"Budgets",views:[["bud_over","Overview"],["bud_model","Forecast model"],["fin_budget","By funding type"],["fin_model","IT financial model"]]},
 {id:"plat_map",label:"Platform maps",views:[["plat_map","Modules"],["plat_pmap","Processes"],["plat_dmap","Data flows"],["plat_data","Data model"]]},
 {id:"draw_studio",label:"Draw a process",views:[["draw_studio","Drawing studio"],["flw_bpmn","BPMN models"]]},
 {id:"tower",label:"AI agents",views:[["tower","Control tower"],["flw_agent","Agent workflows"],["kcs_skills","Skills"]]},
 {id:"flw_hub",label:"Connect other systems",views:[["flw_hub","Connections"],["plat_fab","Data feeds and mappings"]]},
 {id:"flw_appr",label:"My approvals",views:[["flw_appr","Approvals"],["inbox","Alerts and inbox"]]},
 {id:"flw_dmn",label:"Decision rules",views:[["flw_dmn","Rules"],["dec_cov","Coverage"]]},
 {id:"kg",label:"Impact and knowledge graph",views:[["kg","What a change affects"],["vault","Connected knowledge"]]},
 {id:"adm_env",label:"Environments and releases",views:[["adm_env","Environments"],["itom_dev","Delivery speed"]]},
 {id:"svc_portal",label:"Order something",views:[["svc_portal","Catalog and form"],["svc_guides","Order guides"]]}
];
/* a few single renames so every label is a verb phrase or a plain noun and none collides */
const SINGLE={svc_cat:"Manage the catalog",inbox:null,plat_data_old:"Data tables and checks (old)"};
const N=R15.names=R15.names||{};
const famOf={};
FAM.forEach(f=>f.views.forEach(([id,v],i)=>{famOf[id]=f;if(id===f.id)N[id]=f.label;else{N[id]=f.label+": "+v;R15.hidden[id]=1}}));
Object.keys(SINGLE).forEach(k=>{if(SINGLE[k])N[k]=SINGLE[k]});
/* true duplicates: redirect */
R15.alias.plat_data_old={to:"plat_data",tab:"atlas:5"}; /* CL-51: lands on the Tables and checks view of the Master data model */R15.hidden.plat_data_old=1;N.plat_data_old=N.plat_data_old;
R15.famOf=famOf;
/* the switcher: first thing on every member screen */
function switcher(){const id=G(()=>S.screen);const f=famOf[id];if(!f)return;const sc=D.querySelector("#view .screen")||D.querySelector("#view");if(!sc||sc.querySelector(".r15-fam"))return;
 const chips=f.views.filter(([v])=>G(()=>SCREENS.some(s=>s[0]===v),false)).map(([v,l])=>`<button type="button" class="chip r15-fv" data-nav="${esc(v)}" aria-pressed="${v===id}"${v===id?' aria-current="page"':''}>${esc(l)}</button>`).join("");
 if(f.views.length<2)return;
 const html=`<nav class="r15-fam" aria-label="Views of ${esc(f.label)}"><span class="r15-fl">${esc(f.label)}</span><span class="r15-fc">${chips}</span></nav>`;const hero=sc.querySelector(":scope > .hero");if(hero)hero.insertAdjacentHTML("afterend",html);else sc.insertAdjacentHTML("afterbegin",html)}
function railOn(){const id=G(()=>S.screen);const f=famOf[id];if(!f||f.id===id)return;const b=D.querySelector('#nav .navi[data-nav="'+f.id+'"]');if(b){b.setAttribute("aria-current","page");b.closest(".navit")&&b.closest(".navit").classList.add("is-cur")}}
/* CL-35: lifecycle through HOOKS, not a render wrapper */
HOOKS.on("afterRender",()=>{try{switcher();railOn()}catch(e){console.error("r15 merge",e)}},{id:"r15.merge",order:1002});
/* group home for the service catalog owner screen */
setTimeout(()=>{G(()=>NAVX.add("svc_cat",{label:SINGLE.svc_cat,group:"fix"}))},0);
})();
