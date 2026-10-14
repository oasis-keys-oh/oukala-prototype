/* ===== Round 18, A: the Make / Work / Oversee shell. Regroups every screen, rebuilds the rail by surface and role, adds the lens switch and a Work block on every home.
   Nothing is deleted: screens keep their ids, routes, search entries and favorites. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;
const {G,H,arr}=R18;const ST=R18.st;
const GM={"home":["home",""],"r17p_tour":["story","Guided"],"r17q_thinking":["story","Guided"],"flw_appr":["my",""],"meet_hub":["my",""],"svc_portal":["help",""],"kcs_ask":["help",""],"chat_home":["help",""],"r15d_firstweek":["help",""],"port":["plan","Choose and plan"],"ppm_proj":["plan","Choose and plan"],"ims":["plan","Choose and plan"],"plan":["plan","Choose and plan"],"ppm_wbs":["plan","Choose and plan"],"ppm_raid":["plan","Choose and plan"],"ppl_cap":["plan","Staff and deliver"],"agile_board":["plan","Staff and deliver"],"agile_art":["plan","Staff and deliver"],"itsm_rel":["plan","Staff and deliver"],"svc_cat":["fix","Run the service desk"],"itsm_home":["fix","Run the service desk"],"itsm_inc":["fix","Run the service desk"],"itsm_mi":["fix","Run the service desk"],"itsm_prb":["fix","Run the service desk"],"itsm_chg":["fix","Run the service desk"],"obs_std":["fix","Run the service desk"],"svc_req":["fix","Run the service desk"],"svc_oncall":["fix","Promises and cover"],"svc_sla":["fix","Promises and cover"],"inv":["money","Approve and pay"],"bud_doa":["money","Approve and pay"],"ppm_sow":["money","Approve and pay"],"bud_req":["money","Approve and pay"],"bud_over":["money","Budgets and funding"],"fin_color":["money","Budgets and funding"],"fin_spend":["money","Budgets and funding"],"fin_gates":["money","Budgets and funding"],"fin_rules":["money","Budgets and funding"],"bud_ccmap":["money","Budgets and funding"],"bud_lines":["money","Budgets and funding"],"bud_ven":["money","Vendors"],"org_chart":["people",""],"svc_skills":["people",""],"ppl_perf":["people",""],"ppl_jrny":["people",""],"kcs_home":["learn",""],"kcs_edit":["learn",""],"kcs_gap":["learn",""],"ppl_train":["learn",""],"r18_builds":["make","Your builds"],"r18_access":["make","Your builds"],"plat_build":["make","Start and approve"],"plat_self":["make","Start and approve"],"plat_gate":["make","Start and approve"],"plat_contract":["make","Start and approve"],"plat_proc":["kit","Process"],"plat_map":["kit","Data"],"plat_store":["kit","Data"],"r16m_sources":["kit","Data"],"flw_hub":["kit","Data"],"r16m_import":["kit","Data"],"r16g_perm":["kit","Security and access"],"flw_dmn":["kit","Rules and controls"],"flw_asmt":["kit","Rules and controls"],"itom_run":["kit","Rules and controls"],"wf_runs":["kit","Rules and controls"],"r16h_status":["kit","Rules and controls"],"kcs_prompt":["kit","AI skills and prompts"],"kcs_test":["kit","AI skills and prompts"],"plat_mcp":["kit","AI skills and prompts"],"r18_lens":["lens",""],"r18_strategy":["lens",""],"exe_strat":["strat","Strategy and goals"],"strat_exec":["strat","Strategy and goals"],"exe_scen":["strat","Strategy and goals"],"exe_board":["strat","Strategy and goals"],"loop":["strat","Strategy and goals"],"r15d_evidence":["strat","Strategy and goals"],"exe_dash":["strat","Measures"],"metrics":["strat","Measures"],"exe_mat":["strat","Measures"],"r17q_value":["strat","Value and cost"],"bud_ben":["strat","Value and cost"],"tbm_model":["strat","Value and cost"],"fin_alloc":["strat","Value and cost"],"itom_fin":["strat","Value and cost"],"exe_risk":["grc",""],"grc_home":["grc",""],"grc_ctl":["grc",""],"grc_find":["grc",""],"grc_pol":["grc",""],"grc_aud":["grc",""],"grc_exc":["grc",""],"adm_audit":["grc",""],"bc_home":["res",""],"bc_frame":["res",""],"bc_tiers":["res",""],"bc_cal":["res",""],"bc_plans":["res",""],"bc_trace":["res",""],"bc_metrics":["res",""],"bc_decl":["res",""],"tower":["ai",""],"adm_gate":["ai",""],"kcs_skills":["ai",""],"plat_reg":["reg",""],"own_gaps":["reg",""],"r15d_facts":["reg",""],"svc_360":["reg",""],"exe_apps":["reg",""],"kg":["reg",""],"r16h_ci":["reg",""],"itom_cmdb":["tech","Technology records"],"svc_asset":["tech","Technology records"],"itom_model":["tech","Technology records"],"itom_disc":["tech","Technology records"],"itom_health":["tech","Technology records"],"itom_evt":["tech","Operate and watch"],"itom_slo":["tech","Operate and watch"],"dev_pipe":["tech","Operate and watch"],"adm_env":["tech","Operate and watch"],"r16m_setup":["plat","Set up"],"r16m_deploy":["plat","Set up"],"r16m_overlay":["plat","Set up"],"nav_studio":["plat","Set up"],"adm_studio":["plat","Set up"],"adm_meter":["plat","Set up"],"log":["plat","Product"],"rec_shell":["plat","Product"]};
/* 1. regroup */
function apply(){const M=G(()=>NAVX.map,null);if(!M)return;Object.keys(GM).forEach(id=>{const m=M[id];if(!m)return;m.g=GM[id][0];m.sub=GM[id][1]});
 const R15=W.R15=W.R15||{};Object.keys(R15.hidden||{}).forEach(id=>{const m=M[id];if(m)m.g="r15hid"});
 G(()=>{NAVX.alias["impact explorer"]="kg";NAVX.alias["processes"]="plat_proc";NAVX.alias["approvals"]="flw_appr";NAVX.alias["permissions"]="r16g_perm";NAVX.alias["registries"]="plat_reg";NAVX.alias["my builds"]="r18_builds";NAVX.alias["builds"]="r18_builds";NAVX.alias["lens"]="r18_lens";NAVX.alias["lenses"]="r18_lens";NAVX.alias["executive lens"]="r18_lens";NAVX.alias["data access"]="r18_access";NAVX.alias["access requests"]="r18_access";NAVX.alias["strategy map"]="r18_strategy"});
 G(()=>{if(NAVX.int&&NAVX.int.IDX)NAVX.int.IDX.dirty=true})}
R18.regroup=apply;apply();
/* 2. surfaces */
const SURF=[
 {id:"work",label:"Work",blurb:"What is waiting on you and the apps for your role",groups:["story","my","help","plan","fix","money","people","learn"]},
 {id:"make",label:"Make",blurb:"What you built, and the guardrails it carries",groups:["make","kit"]},
 {id:"oversee",label:"Oversee",blurb:"Value, cost and risk across everything built",groups:["lens","strat","grc","res","ai","reg"]},
 {id:"it",label:"Enterprise IT",blurb:"Technology records, alerts and pipelines",groups:["tech"]},
 {id:"admin",label:"Platform",blurb:"Set up and run the platform itself",groups:["plat","new"]}];
R18.SURF=SURF;
const surfOf=g=>(SURF.find(s=>s.groups.indexOf(g)>=0)||{}).id||"admin";R18.surfOf=surfOf;
const FAMN={decide:"Decide",operate:"Operate",build:"Build and plan",assure:"Assure",request:"Request"};
function compose(){
 const base=NAVX._baseHtml;let raw=base.apply(NAVX,arguments);
 /* permission filter (same rule as the enforcement module): remove screens this role may not open before regrouping */
 try{const PM=W.PERM;if(PM&&PM.state&&PM.state.enforce){const r0=D.createElement("div");r0.innerHTML=raw;r0.querySelectorAll("[data-nx-it]").forEach(el=>{const id=el.dataset.nxIt;if(id&&id!=="home"&&!PM.can(null,"read","screen:"+id).ok)el.remove()});
  r0.querySelectorAll("details.navgd").forEach(g=>{if(!g.querySelector("[data-nx-it]"))g.remove();else{const c=g.querySelector(".nx-gc");if(c&&/^\d+$/.test(c.textContent.trim()))c.textContent=g.querySelectorAll("[data-nx-it]").length}});raw=r0.innerHTML}}catch(e){}
 const NP=NAVX.persona||{};const vis=(NP.visible?NP.visible():[]).slice();const order=NP.groups?NP.groups():[];const all=!!ST.showAll;
 const root=D.createElement("div");root.innerHTML=raw;
 const gs=[...root.querySelectorAll(":scope > details.navgd")];
 if(!gs.length){/* collapsed rail: keep only the groups this role uses, with a rule between surfaces */
  if(!all){root.querySelectorAll("button.nx-gbtn").forEach(b=>{if(vis.length&&vis.indexOf(b.dataset.nxGrp)<0)b.remove()})}
  let last=null;root.querySelectorAll("button.nx-gbtn").forEach(b=>{const s=surfOf(b.dataset.nxGrp);if(last&&s!==last){const sp=D.createElement("div");sp.className="nx-sep";sp.setAttribute("role","separator");b.parentNode.insertBefore(sp,b)}last=s});
  return root.innerHTML}
 const by={};gs.forEach(g=>{by[g.dataset.ng]=g;g.remove()});
 const out=D.createElement("div");[...root.childNodes].forEach(c=>out.appendChild(c));
 /* pins for this role */
 const p=G(()=>PERSONAS[S.persona],{});const d=G(()=>NP.def(),{});
 const pins=arr(NP.pin?NP.pin():[]).map(id=>{const it=gs.map(g=>g.querySelector('[data-nx-it="'+id+'"]')).find(Boolean);return it?it.cloneNode(true):null}).filter(Boolean);
 if(pins.length){const s=D.createElement("section");s.className="r15d-pins";s.setAttribute("aria-label","For your role");s.innerHTML='<div class="r15d-pinh"><b>'+H(p.n||"")+'</b><small>'+H(FAMN[d.family]||"")+(d.readonly?" · read only":"")+'</small></div>';pins.forEach(n=>{n.classList.add("r15d-pin");s.appendChild(n)});
  const hi=out.querySelector('[data-nx-it="home"]');if(hi)hi.insertAdjacentElement("afterend",s);else out.insertBefore(s,out.firstChild)}
 const shown=g=>by[g]&&(all||vis.indexOf(g)>=0);
 SURF.forEach(sf=>{const list=sf.groups.filter(shown).sort((a,b)=>order.indexOf(a)-order.indexOf(b));if(!list.length)return;
  const h=D.createElement("div");h.className="r18-sec";h.dataset.sf=sf.id;h.innerHTML='<i class="r18-sd" aria-hidden="true"></i><b>'+H(sf.label)+'</b><small>'+H(sf.blurb)+'</small>';out.appendChild(h);list.forEach(g=>out.appendChild(by[g]))});
 const rest=Object.keys(by).filter(g=>!shown(g));
 if(rest.length){const curIn=rest.some(g=>by[g].querySelector('[aria-current="page"]'));const m=D.createElement("details");m.className="r15d-more";m.dataset.r15dMore="1";if(curIn||(S.r15d&&S.r15d.moreOpen))m.open=true;
  const n=rest.reduce((a,g)=>a+(+((by[g].querySelector(".nx-gc")||{}).textContent)||0),0);
  const sm=D.createElement("summary");sm.innerHTML='<span>More areas</span><em class="nx-gc">'+rest.length+' groups, '+n+' screens</em>';m.appendChild(sm);
  SURF.forEach(sf=>{const l=sf.groups.filter(g=>rest.indexOf(g)>=0);if(!l.length)return;const h=D.createElement("div");h.className="r18-sec r18-sec-in";h.dataset.sf=sf.id;h.innerHTML='<i class="r18-sd" aria-hidden="true"></i><b>'+H(sf.label)+'</b>';m.appendChild(h);l.forEach(g=>m.appendChild(by[g]))});out.appendChild(m)}
 const t=D.createElement("div");t.className="r18-all";t.innerHTML='<button type="button" class="r18-allb" data-r18-all aria-pressed="'+all+'">'+(all?"Show only my role's areas":"Show every area")+'</button>';out.appendChild(t);
 return out.innerHTML}
if(G(()=>NAVX._baseHtml)){NAVX.html=function(){try{return compose.apply(this,arguments)}catch(e){console.error("r18 rail",e);return NAVX._baseHtml.apply(this,arguments)}}}
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r18-all]");if(!b)return;ST.showAll=!ST.showAll;try{renderNav()}catch(x){}});
/* 3. the lens switch in the top bar */
function lensPop(){const L=arr(R18.LENSES);const cur=L.find(l=>l.id===ST.lens)||L[0]||{};
 return `<button type="button" class="btn quiet r18-lensb" id="r18LensBtn" popovertarget="r18LensPop" aria-haspopup="dialog" title="Choose the executive lens"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><span>Lens</span><b>${H(cur.short||"COO")}</b></button>
 <div id="r18LensPop" popover class="pop glass r18-lenspop" aria-label="Executive lens"><div class="eyebrow">Executive lens</div><h3>See it the way they weigh it</h3><p class="muted small">Every executive balances value against cost and risk. The lens changes the headline question, the figures that lead and the words used.</p>
  <div class="r18-lenslist">${L.map(l=>`<button type="button" class="r18-lopt" data-r18-lens="${H(l.id)}" aria-pressed="${l.id===ST.lens}"><b>${H(l.short)}</b><span>${H(l.balance)}</span></button>`).join("")}</div>
  <div class="row" style="margin-top:12px"><button class="btn" type="button" data-go="r18_lens" popovertarget="r18LensPop" popovertargetaction="hide">Open lens view</button><button class="btn quiet" popovertarget="r18LensPop" popovertargetaction="hide">Close</button></div></div>`}
function ensureLens(){const slot=D.getElementById("r16Pha");if(!slot||!arr(R18.LENSES).length)return;let host=D.getElementById("r18LensHost");
 if(host&&host.parentNode!==slot){host.remove();host=null}
 if(!host){host=D.createElement("span");host.id="r18LensHost";host.className="r18-lenshost";slot.insertBefore(host,slot.firstChild)}
 const sig=ST.lens+"|"+R18.LENSES.length;if(host.dataset.sig!==sig||!host.firstChild){host.dataset.sig=sig;host.innerHTML=lensPop()}}
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r18-lens]");if(!b)return;ST.lens=b.dataset.r18Lens;try{const p=D.getElementById("r18LensPop");p&&p.hidePopover&&p.hidePopover()}catch(x){}
 G(()=>audit("Chose lens",ST.lens.toUpperCase()));try{render()}catch(x){}G(()=>toast("Lens: "+(R18.LENSES.find(l=>l.id===ST.lens)||{}).short,"info"))});
/* 4. a Work block on every home */
const ROLE_FAM={exec:["Strategy and portfolio","AI governance"],finance:["Finance and invoices","Contracts and SOW"],pm:["Projects and WBS","Demand"],desk:["Incident and problem","Request and catalog","Knowledge"],portfolio:["Strategy and portfolio","Demand","Projects and WBS"],change:["Change and release","Observability and SLO"],arch:["Security, audit and platform governance","CMDB and discovery"],admin:["Security, audit and platform governance","Workflow and approvals"],audit:["Security, audit and platform governance"],guest:["Request and catalog","Knowledge"]};
const meName=()=>G(()=>R15D.me().name,"Casey Rowan");
function workBlock(){
 const me=meName();const role=G(()=>PERSONAS[S.persona].role,"exec");const fams=ROLE_FAM[role]||ROLE_FAM.exec;
 let list=G(()=>PROCLIB.list(),[]);const mine=list.filter(p=>p.owner===me||p.backup===me);
 const area=list.filter(p=>fams.indexOf(p.familyName)>=0&&mine.indexOf(p)<0).sort((a,b)=>(a.level-b.level)||String(a.name).localeCompare(b.name));
 const rows=mine.concat(area).slice(0,6);
 const builds=R18.apps().filter(a=>a.builder===me||a.owner===me);
 const pr=rows.map(p=>`<div class="r18-wr"><span class="r18-wn"><b>${H(p.name)}</b><small>${H(p.familyName)} · ${p.owner===me?"you own it":p.backup===me?"you are the backup":"in your area"} · maturity ${p.level} of 5</small></span><button type="button" class="btn quiet" data-r18-proc="${H(p.id)}">Open</button></div>`).join("");
 const ro=G(()=>PERSONAS[S.persona].readonly||NAVX.persona.def().readonly,false);
 return `<section class="card glass r18-work" aria-label="Your work"><div class="cardhead"><div><h3>Your work across processes</h3><span class="muted small">Every process step assigned to your role shows up here, whoever built the process. Make something of your own when a gap is yours to close.</span></div>${ro?"":'<button type="button" class="btn primary" data-go="r18_builds">Build something for your role</button>'}</div>
  <div class="r18-wgrid"><div><div class="eyebrow">${mine.length?"Processes you take part in":"Processes in your area"}</div>${pr||'<p class="muted small">No processes are assigned to this role yet.</p>'}<div class="row" style="margin-top:8px"><button class="btn quiet" type="button" data-go="plat_proc">All processes</button><button class="btn quiet" type="button" data-go="flw_appr">My approvals</button></div></div>
  <div><div class="eyebrow">Things you built</div>${builds.length?builds.map(a=>`<div class="r18-wr"><span class="r18-wn"><b>${H(a.n)}</b><small>${H(a.status)} · ${R18.coverage(a.id)}% of guardrails in place</small></span><button type="button" class="btn quiet" data-r18-app="${H(a.id)}">Open</button></div>`).join(""):`<p class="muted small">You have not built anything yet. Use your usual AI tool with the Oukala skills, or the workflow designer, and the guardrails arrive with it.</p>`}</div></div></section>`}
function wrapHome(){const prev=_R.home;if(!prev||prev.__r18)return;const f=function(){let h=prev.apply(this,arguments);try{const i=h.indexOf("</section>");const lh=G(()=>R18.lensHome?R18.lensHome():"","");if(i>0)h=h.slice(0,i+10)+lh+workBlock()+h.slice(i+10)}catch(e){console.error("r18 home",e)}return h};f.__r18=1;_R.home=f}
wrapHome();
D.addEventListener("click",e=>{const p=e.target.closest&&e.target.closest("[data-r18-proc]");if(p){G(()=>PROCLIB.open(p.dataset.r18Proc));return}const a=e.target.closest&&e.target.closest("[data-r18-app]");if(a){ST.app=a.dataset.r18App;G(()=>go("r18_app"))}});
const _render=W.render;W.render=function(){const r=_render.apply(this,arguments);try{ensureLens()}catch(e){console.error("r18 lens",e)}return r};
setTimeout(()=>{apply();try{ensureLens()}catch(e){}},50);setInterval(()=>{try{ensureLens()}catch(e){}},500);
})();
/* anchored popovers (metric formulas and others): measure after layout so a tall sheet never runs off the bottom of the screen */
(function(){const D=document;D.addEventListener("toggle",e=>{const p=e.target;if(!p.classList||!p.classList.contains("pop")||e.newState!=="open")return;
 const fit=()=>{if(!p.classList.contains("anch"))return;const vh=innerHeight;p.style.maxHeight=Math.max(240,vh-32)+"px";const r=p.getBoundingClientRect();let top=r.top;if(r.bottom>vh-16)top=vh-16-r.height;if(top<16)top=16;p.style.top=top+"px";p.style.bottom="auto"};
 requestAnimationFrame(()=>{fit();setTimeout(fit,120)})},true)})();
