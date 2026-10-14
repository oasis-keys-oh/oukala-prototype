/* Round 15, Agent D. Personas built from the 11 admin roles (plus employee, new hire and board).
   Each persona has its own home, sidebar order and visibility, default actions, metrics and Ask starters.
   Navigation hook: NAVX.persona = { key(), def(), list(), set(key), groups(), pin(), me() }.
   The sidebar is trimmed by wrapping NAVX.html; mod_nav.js is not edited. Casey Rowan (Executive) stays the default. */
(function(){
const W=window;
const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];R15D.homes=R15D.homes||{};
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const M=id=>G(()=>METRICS[id],null);
const mv=id=>{const m=M(id);return m?mfmt(m):"n/a"};
const ALLG=["my","help","plan","fix","money","people","learn","make","kit","lens","strat","grc","res","ai","reg","tech","plat","story","new"];/* R18: groups follow the Make / Work / Oversee structure */
const order=(first)=>first.concat(ALLG.filter(g=>!first.includes(g)));

/* ---------- definitions ---------- */
/* family: decide, operate, build, assure, request */
const DEFS={
 exec:{role:"exec",family:"decide",groups:["strat","money","ai","my"],pin:["trace","exe_dash","inv","tower"],kpis:["m_delivery","m_fin","m_ops","m_override"]},
 fin:{role:"finance",family:"decide",groups:["money","my","strat","plan","ai"],pin:["inv","bud_over","fin_budget","bud_ven"],kpis:["m_fin","m_cycle","m_auto","m_burn"]},
 pm:{role:"pm",family:"build",groups:["plan","my","money","fix","learn"],pin:["ims","ppm_raid","ppm_proj","fo"],kpis:["m_delivery","m_vendor","m_ontime","m_spi"]},
 ops:{role:"desk",family:"operate",groups:["fix","help","tech","learn","my"],pin:["itsm_inc","itsm_mi","svc_oncall","kcs_home"],kpis:["m_ops","m_avail","m_kb","m_itsm_sla"]},
 portfolio:{n:"Portfolio lead",who:"Chooses, funds and tracks the project portfolio",role:"portfolio",family:"decide",groups:["plan","money","strat","people","my","ai"],pin:["port","ims","ppm_raid","ppl_cap"],kpis:["m_delivery","m_ontime","m_spi","m_vendor"],
  actions:[()=>["Decide on the demand queue","Demand and priorities holds the candidates; the order is set by value, risk and capacity.",["port"],"Open"],()=>["Watch the schedule index","Schedule performance index is "+mv("m_spi")+" against a target of "+G(()=>mfmt(M("m_spi"),M("m_spi").tgt),"")+".",["ims"],"Open"],()=>["Review RAID items","Risks, assumptions, issues and dependencies across the portfolio.",["ppm_raid"],"Open"]],
  sugg:["Which projects are behind baseline?","Show the demand queue","Where is capacity short?"]},
 change:{n:"Change manager",who:"Avoids collisions, runs the change advisory board",role:"change",family:"operate",groups:["fix","tech","plan","auto","my"],pin:["itsm_chg","obs_std","itsm_rel","itom_run"],kpis:["m_itsm_cfr","m_dora_cfr","m_itsm_appr","m_mttr"],
  actions:[()=>["Review pending changes","Collisions and freeze exceptions show on the change calendar.",["itsm_chg"],"Open"],()=>["Check the standard change catalog","Standard changes are pre-approved; each has a rollback.",["obs_std"],"Open"],()=>["Look at the release plan","Releases link to changes and to the test gate.",["itsm_rel"],"Open"]],
  sugg:["Which changes collide?","Show changes in the freeze window","What is the change failure rate?"]},
 arch:{n:"Architect",who:"Shapes the data model, integrations and technical debt",role:"arch",family:"build",groups:["plat","tech","auto","ai","plan"],pin:["plat_data","plat_fab","plat_debt","itom_cmdb"],kpis:["m_atlas_conf","m_fab_cov","m_contract_cov","m_debt_age"],
  actions:[()=>["Review proposed entities","New entities wait for a reuse-first decision before they are registered.",["plat_data"],"Open"],()=>["Map integrations","Field mapping coverage is "+mv("m_fab_cov")+".",["plat_fab"],"Open"],()=>["Work the debt ledger","Median age of open debt is "+mv("m_debt_age")+".",["plat_debt"],"Open"]],
  sugg:["Which entities are duplicated?","Show field mapping gaps","What is on the debt ledger?"]},
 admin:{n:"Platform admin",who:"Configures roles, fields, environments and licensing",role:"admin",family:"build",groups:["plat","ai","auto","tech","people"],pin:["adm_studio","adm_sec","plat_reg","r15d_facts"],kpis:["m_gate_conf","m_own_cov","m_contract_cov","m_fab_cov"],
  actions:[()=>["Review access","Roles, policies and the access review are on Security and access.",["adm_sec"],"Open"],()=>["Check facts and conflicts","One registry for every shared number, with a conflict check.",["r15d_facts"],"Open"],()=>["Shape fields and forms","Admin studio holds fields, layouts, themes and translations.",["adm_studio"],"Open"]],
  sugg:["Who has restricted data access?","Show licence seats","Which fields are unused?"]},
 audit:{n:"Auditor (read only)",who:"Samples evidence and traces who did what; cannot change anything",role:"audit",family:"assure",readonly:true,groups:["strat","plat","ai","money","people"],pin:["r15d_evidence","adm_audit","exe_board","bud_doa"],kpis:["m_grc_ctl_cov","m_grc_audit_req","m_own_cov","m_override"],
  actions:[()=>["Open the evidence room","Controls, approvals, audit trail, decisions and exports in one read-only index.",["r15d_evidence"],"Open"],()=>["Verify the audit chain","Recomputes every hash and reports the result.",["r15d_evidence"],"Verify"],()=>["Read the board pack","Every claim cites a record.",["exe_board"],"Open"]],
  sugg:["Which controls lack current evidence?","Verify the audit chain","Show approvals over $100,000"]},
 board:{n:"Board member (read only)",who:"Reads the quarterly pack and AI oversight; cannot change anything",role:"audit",family:"assure",readonly:true,groups:["strat","money","ai","plan"],pin:["exe_board","r15d_evidence","exe_risk","exe_dash"],kpis:["m_delivery","m_fin","m_ops","m_riskexp"],
  actions:[()=>["Read the board pack","Sections cite the records behind each claim.",["exe_board"],"Open"],()=>["See AI oversight","Override rate is "+mv("m_override")+"; spend is "+mv("m_aispend")+" of the daily cap.",["tower"],"Open"],()=>["Open the board evidence view","Controls, decisions and approvals behind the pack.",["r15d_evidence"],"Open"]],
  sugg:["What changed since last quarter?","Show top risks","Is AI spend within its cap?"]},
 cfo:{n:"CFO",who:"Chief Financial Officer: spend against profitability across every domain",role:"finance",family:"decide",as:"Marcus Reid",groups:["lens","money","strat","grc","my"],pin:["r18_spend","exe_dash","inv","bud_over"],kpis:["m_fin","m_burn","m_cycle"],
  actions:[()=>["See where the money goes","Spend by domain and by executive across the whole enterprise, with forecast against approved.",["r18_spend"],"Open"],()=>["Release or hold the largest invoice","Invoice Advisor recommends the action with its evidence.",["inv"],"Open"],()=>["Check the CFO lens","Spend, value realized and spend outside control.",["r18_lens"],"Open"]],
  sugg:["Where is spend over forecast?","Who owns the most spend?","Show invoices on hold"]},
 coo:{n:"COO",who:"Chief Operating Officer: throughput against cost to serve",role:"exec",family:"decide",as:"Victor Amaya",groups:["lens","strat","plan","fix","res","my"],pin:["r18_lens","r18_strategy","exe_dash","trace"],kpis:["m_delivery","m_ops","m_ontime"],
  actions:[()=>["See how each function enables the strategy","Function by objective, with the gaps.",["r18_strategy"],"Open"],()=>["Look at the COO lens","Where work stalls and what is ready to scale.",["r18_lens"],"Open"],()=>["Review the delivery schedule","Milestones and the schedule index.",["trace"],"Open"]],
  sugg:["Where does work stall?","Which builds are ready to scale?","Which objectives have no work?"]},
 cto:{n:"CTO",who:"Owns two domains, IT Operations and Editorial; sees each domain and the combined total",role:"exec",family:"decide",as:"Carla Reyes",groups:["lens","strat","money","ai","tech","my"],pin:["r18_spend","exe_dash","tower","r18_lens"],kpis:["m_ops","m_burn","m_delivery"],
  actions:[()=>["See spend across both domains","IT Operations and Editorial, each with its own cost centers, plus the combined total.",["r18_spend"],"Open"],()=>["Watch AI agents","Usage, cost and the override rate.",["tower"],"Open"],()=>["Check the CIO lens","Productivity against cost, sprawl and debt.",["r18_lens"],"Open"]],
  sugg:["How much do IT and Editorial cost together?","Which domain is over forecast?","Show shared platform costs"]},
 dir:{n:"Director, Editorial",who:"Runs one department: sees its budget, projects, people and requests",role:"pm",family:"operate",as:"Priya Shah",groups:["plan","money","people","my","make"],pin:["ims","bud_over","ppl_cap","r18_builds"],kpis:["m_delivery","m_vendor","m_ontime"],
  actions:[()=>["Check the department budget","Approved, committed, actual and forecast for your cost centers.",["r18_spend"],"Open"],()=>["Review project risks","RAID items in your projects.",["ppm_raid"],"Open"],()=>["See what your team built","Builds, guardrails and access requests.",["r18_builds"],"Open"]],
  sugg:["Is Editorial over forecast?","Which projects are behind?","What did my team build?"]},
 guest:{n:"Vendor guest",who:"Sees only what has been shared with the vendor",role:"guest",family:"request",readonly:true,groups:["help","my"],pin:["svc_portal","svc_req"],kpis:[]},
 emp:{n:"Employee",who:"Orders equipment and access, tracks requests, finds answers",role:"guest",family:"request",as:"Casey Rowan",groups:["help","my","learn","people"],pin:["svc_portal","svc_req","svc_guides","kcs_ask"],kpis:[]},
 newhire:{n:"New hire",who:"First week: accounts, equipment, training, who to ask",role:"guest",family:"request",as:"Rosa Delgado",groups:["help","my","learn","people"],pin:["r15d_firstweek","svc_portal","ppl_train","kcs_ask"],kpis:[]}
};
/* R18: translate the old group ids in each role to the new Make / Work / Oversee groups, then add what the role family needs */
(function(){const O2N={my:["my"],help:["help"],plan:["plan"],fix:["fix"],tech:["tech"],money:["money"],learn:["learn"],people:["people"],strat:["strat"],auto:["kit"],ai:["ai"],plat:["plat"],grc:["grc"],res:["res"],new:["new"]};
 const EXTRA={decide:["lens","grc","story"],operate:[],build:["make","kit"],assure:["lens","grc","reg","story"],request:[]};
 Object.keys(DEFS).forEach(k=>{const d=DEFS[k],out=[];(d.groups||[]).forEach(g=>(O2N[g]||[g]).forEach(x=>{if(out.indexOf(x)<0)out.push(x)}));(EXTRA[d.family]||[]).forEach(x=>{if(out.indexOf(x)<0)out.push(x)});if(!d.readonly&&out.indexOf("make")<0)out.push("make");d.groups=out})})();
const FAM={decide:"Decide",operate:"Operate",build:"Build and plan",assure:"Assure",request:"Request"};
Object.keys(DEFS).forEach(k=>{
 const d=DEFS[k];
 if(PERSONAS[k]){Object.assign(PERSONAS[k],{role:d.role,family:d.family,groups:d.groups,pin:d.pin,kpis:d.kpis});return}
 PERSONAS[k]={n:d.n,who:d.who,home:[],rings:d.kpis.slice(0,3),nav:d.pin.slice(),story:"",needs:[],sugg:d.sugg||[],role:d.role,family:d.family,groups:d.groups,pin:d.pin,kpis:d.kpis,generic:true,readonly:!!d.readonly,as:d.as||"Casey Rowan"};
 /* default-visible capabilities in the chat: read plus what the role may do */
 try{const caps=G(()=>CX.CAPS,null);if(caps&&!caps[k])caps[k]=d.readonly?["read"]:k==="emp"||k==="newhire"?["read","incident.create","request.order","pto.write","ui.set"]:["read","incident.create","request.order","report.build","ui.set"]}catch(e){}
});
PERSONAS.exec.sugg=PERSONAS.exec.sugg||[];
const defOf=k=>DEFS[k||S.persona]||DEFS.exec;

/* ---------- identity ---------- */
const meOf=()=>{const p=PERSONAS[S.persona]||{};return p.as||"Casey Rowan"};
R15D.me=()=>({name:meOf(),first:meOf().split(" ")[0],persona:PERSONAS[S.persona]?PERSONAS[S.persona].n:"Executive"});
function syncIdentity(){
 try{if(window.R15D&&R15D.setSvcMe)R15D.setSvcMe(meOf())}catch(e){}
 const who=document.querySelector(".whoami b");if(who&&who.textContent!==meOf())who.textContent=meOf();
 const av=document.querySelector(".whoami .avatar");if(av){const ini=meOf().split(" ").map(x=>x[0]).join("").slice(0,2);if(av.textContent!==ini)av.textContent=ini}
}
R15D.onAfter=R15D.onAfter||(fn=>R15D.after.push(fn));
R15D.after.push(syncIdentity);

/* ---------- NAVX.persona ---------- */
const NP=W.NAVX&&(NAVX.persona=NAVX.persona||{});
if(NP){
 NP.key=()=>S.persona;NP.def=()=>Object.assign({},defOf(),PERSONAS[S.persona]);NP.list=()=>Object.keys(PERSONAS).map(k=>({key:k,n:PERSONAS[k].n,who:PERSONAS[k].who,family:(DEFS[k]||{}).family}));
 NP.groups=()=>order(defOf().groups);NP.visible=()=>defOf().groups.slice();NP.pin=()=>(defOf().pin||[]).slice();NP.me=meOf;
 NP.set=function(k){if(!PERSONAS[k])return false;S.persona=k;try{savePrefs()}catch(e){}try{audit("switched role",PERSONAS[k].n)}catch(e){}
  if(!SCREENS.some(s=>s[0]===S.screen))S.screen="home";
  const radios=document.querySelectorAll("input[name=persona]");radios.forEach(i=>i.checked=i.value===k);
  try{render()}catch(e){console.error(e)}try{if(window.CX&&CX.drawAll)CX.drawAll()}catch(e){}return true};
}

/* ---------- sidebar: order, visibility, role pins ---------- */
if(W.NAVX&&NAVX.html&&!NAVX._r15d){
 NAVX._r15d=true;const _html=NAVX.html;NAVX._baseHtml=_html;/* R18: the shell rebuilds the rail from the base html */
 NAVX.html=function(){
  const raw=_html.apply(this,arguments);
  try{
   if(raw.indexOf('class="navgd"')<0)return raw;
   const d=defOf(),p=PERSONAS[S.persona];if(!d||!d.groups)return raw;
   const root=document.createElement("div");root.innerHTML=raw;
   const gs=[...root.querySelectorAll(":scope > details.navgd")];if(!gs.length)return raw;
   const by={};gs.forEach(g=>{by[g.dataset.ng]=g;g.remove()});
   const pins=(d.pin||[]).map(id=>{const it=gs.map(g=>g.querySelector('[data-nx-it="'+id+'"]')).find(Boolean);return it?it.cloneNode(true):null}).filter(Boolean);
   const shown=d.groups.map(g=>by[g]).filter(Boolean);
   const rest=Object.keys(by).filter(g=>!d.groups.includes(g)).map(g=>by[g]);
   const curIn=rest.some(g=>g.querySelector('[aria-current="page"]'));
   const out=document.createElement("div");
   [...root.childNodes].forEach(c=>out.appendChild(c));
   if(pins.length){const s=document.createElement("section");s.className="r15d-pins";s.setAttribute("aria-label","For your role");s.innerHTML='<div class="r15d-pinh"><b>'+E(p.n)+'</b><small>'+E(FAM[d.family]||"")+(d.readonly?" · read only":"")+'</small></div>';pins.forEach(n=>{n.classList.add("r15d-pin");s.appendChild(n)});
    const homeIt=out.querySelector('[data-nx-it="home"]');if(homeIt)homeIt.insertAdjacentElement("afterend",s);else out.insertBefore(s,out.firstChild)}
   shown.forEach(g=>out.appendChild(g));
   if(rest.length){const m=document.createElement("details");m.className="r15d-more";m.dataset.r15dMore="1";if(curIn||(S.r15d&&S.r15d.moreOpen))m.open=true;
    const n=rest.reduce((a,g)=>a+(+((g.querySelector(".nx-gc")||{}).textContent)||0),0);
    const sm=document.createElement("summary");sm.innerHTML='<span>More areas</span><em class="nx-gc">'+rest.length+' groups, '+n+' screens</em>';m.appendChild(sm);rest.forEach(g=>m.appendChild(g));out.appendChild(m)}
   return out.innerHTML;
   }catch(e){console.error("persona nav",e);return raw}
 };
 document.addEventListener("toggle",e=>{const m=e.target;if(m&&m.matches&&m.matches("details.r15d-more")){S.r15d.moreOpen=m.open}},true);
}

/* ---------- top-bar role switcher ---------- */
function switcherHTML(){
 const cur=PERSONAS[S.persona];const fams={};Object.keys(PERSONAS).forEach(k=>{const f=(DEFS[k]||{}).family||"decide";(fams[f]=fams[f]||[]).push(k)});
 return `<button type="button" class="btn quiet r15d-vas" id="r15dVasBtn" popovertarget="r15dVas" aria-haspopup="dialog" title="Switch the role you are viewing as"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg><b>${E(cur.n)}</b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
 <div id="r15dVas" popover class="pop glass r15d-vaspop" aria-label="View as a role"><div class="eyebrow">View as</div><h3>Choose a role</h3><p class="muted small">Each role has its own home, menu order, default actions and metrics. Your choice is remembered on this device. Signed in as ${E(meOf())}.</p>
 ${["decide","operate","build","assure","request"].filter(f=>fams[f]).map(f=>`<div class="r15d-fam"><div class="eyebrow">${E(FAM[f])}</div>${fams[f].map(k=>`<button type="button" class="r15d-role" data-r15d-role="${k}" aria-pressed="${k===S.persona}"><b>${E(PERSONAS[k].n)}</b><small>${E(PERSONAS[k].who)}</small></button>`).join("")}</div>`).join("")}
 <div class="row" style="margin-top:12px"><button class="btn" popovertarget="r15dVas" popovertargetaction="hide">Close</button></div></div>`;
}
function ensureSwitcher(){
 const tb=document.querySelector(".tb-right");if(!tb)return;
 let host=document.getElementById("r15dVasHost");
 if(!host){host=document.createElement("span");host.id="r15dVasHost";host.className="r15d-vashost";tb.insertBefore(host,tb.firstChild)}
 const sig=S.persona+"|"+Object.keys(PERSONAS).length;if(host.dataset.sig!==sig){host.dataset.sig=sig;host.innerHTML=switcherHTML()}
}
R15D.after.push(ensureSwitcher);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r15d-role]");if(!b)return;const k=b.dataset.r15dRole;try{const p=document.getElementById("r15dVas");p&&p.hidePopover&&p.hidePopover()}catch(x){}
 if(NAVX.persona.set(k)){S.screen="home";render();toast("Viewing as "+PERSONAS[k].n,"info")}});

/* ---------- home: legacy personas keep their home; the new ones get a role home ---------- */
const greeting=()=>{const h=G(()=>AGENTS_STATE.hour(),13);return h<12?"Good morning":h<18?"Good afternoon":"Good evening"};
R15D.greeting=greeting;
function kpiTile(id){const m=M(id);if(!m)return"";const st=G(()=>mstat(m),"good");return kpi(m.n,E(mfmt(m)),"target "+(m.dir==="max"?"at least ":"at most ")+E(mfmt(m,m.tgt)),{metric:id,cls:st==="good"?"":st==="warn"?"warn":"crit",keep:true})}
function genericHome(){
 const k=S.persona,p=PERSONAS[k],d=defOf(k);
 const acts=(d.actions||[]).map(f=>G(f,null)).filter(Boolean);
 const fam={decide:"Decide",operate:"Operate",build:"Build and plan",assure:"Assure",request:"Request"}[d.family];
 const story=G(()=>R15D.storyFor&&R15D.storyFor(k),"")||p.who+".";
 return `<div class="screen">${hero(G(()=>NOW.day,"Today")+" · Meridian Standards Foundation",greeting()+", "+E(meOf().split(" ")[0]),story,`<div class="row"><span class="persona-note">Viewing as <b>${E(p.n)}</b> · ${E(fam)}${d.readonly?" · read only":""}</span><button type="button" class="chip" data-r15d-vas-open>Change role</button>${p.sugg&&p.sugg[0]?`<button class="chip" data-ask="${E(p.sugg[0])}">${E(p.sugg[0])}</button>`:""}</div>`)}${lensNote()}
 ${d.kpis&&d.kpis.length?`<div class="statrow r15d-kpis">${d.kpis.map(kpiTile).join("")}</div>`:""}
 <div class="grid g2" style="align-items:start">
  ${card("Do next","Default actions for this role",`<div class="needs">${acts.map(a=>`<div class="need"><div class="ico info">${ico("bolt")}</div><div><b data-role="story">${E(a[0])}</b><span class="muted" data-role="story">${E(a[1])}</span></div><div class="act"><button class="btn primary" data-needgo="${a[2].join("|")}">${E(a[3])}</button></div></div>`).join("")||'<p class="muted">Nothing assigned to this role yet.</p>'}</div>`)}
  ${card("Start with a question","Ask answers from the records in your scope and shows where it looked",`<div class="r15d-starters">${(p.sugg||[]).map(q=>`<button class="chip" data-ask="${E(q)}">${E(q)}</button>`).join("")}</div><p class="muted small">Menu order for this role: ${d.groups.slice(0,4).map(g=>G(()=>NAVX.groupLabel(g),g)).map(E).join(", ")}. The rest are under More areas.</p>`)}
 </div></div>`;
}
const _home=_R.home;
_R.home=function(){
 const k=S.persona;
 if(R15D.homes[k]){try{return R15D.homes[k]()}catch(e){console.error("home "+k,e)}}
 if(PERSONAS[k]&&PERSONAS[k].generic)return genericHome();
 return _home.apply(this,arguments);
};
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-r15d-vas-open]")){const p=document.getElementById("r15dVas");if(p&&p.showPopover)p.showPopover()}});

/* data-driven stories: only numbers and names from live data */
R15D.storyFor=function(k){
 const c=G(()=>AGENTS_STATE.counts(),{working:0,registered:0});
 switch(k){
  case "portfolio":return `Schedule performance index is <b>${mv("m_spi")}</b> and <b>${mv("m_ontime")}</b> of milestones are on time. Vendor performance index is <b>${mv("m_vendor")}</b>.`;
  case "change":return `Change failure rate is <b>${mv("m_itsm_cfr")}</b> against a target of <b>${G(()=>mfmt(M("m_itsm_cfr"),M("m_itsm_cfr").tgt),"")}</b>. Approvals take <b>${mv("m_itsm_appr")}</b> on average.`;
  case "arch":return `Field mapping coverage is <b>${mv("m_fab_cov")}</b>, contract coverage <b>${mv("m_contract_cov")}</b>, and the median open debt item is <b>${mv("m_debt_age")}</b> old.`;
  case "admin":return `Average conformance is <b>${mv("m_gate_conf")}</b>. Ownership coverage in the registry is <b>${mv("m_own_cov")}</b>. <b>${c.working}</b> of <b>${c.registered}</b> agents are working now.`;
  case "audit":return `Read-only view. <b>${mv("m_grc_ctl_cov")}</b> of controls have current evidence. Everything on the evidence room can be exported with its source.`;
  case "board":return `Delivery health is <b>${mv("m_delivery")}</b>, financial health <b>${mv("m_fin")}</b>, operational health <b>${mv("m_ops")}</b>. Agent override rate is <b>${mv("m_override")}</b>.`;
  default:return "";
 }};

/* nav entry for views that other modules own can ask the persona what to pin */
})();
