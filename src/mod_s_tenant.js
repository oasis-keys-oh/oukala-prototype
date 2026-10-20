/* ===== mod_s_tenant: tenancy on top of DATA (docs/tenant-seams.md). CSS prefix stn-.
   CL-55  core entities defined over the existing Meridian globals, a tenant-aware screen registry (DATA.screens()).
   DC-03  loader spike: three read-only screens that read only through DATA (tn_projects, tn_people, tn_metrics).
   DC-31  one tenant model: SCN.set and TENANT.switch both go through DATA.setTenant; the active tenant is always on screen.
   CL-56  seamless switch: the same screen re-renders with S (tabs, filters) kept; legacy screens are labeled, not hidden.
   CL-63  demo identity: one person, memberships per tenant, roles per membership, default deny (DATA.guard). Simulated.
   DC-09  tenant pack format, DATA.validate and DATA.snapshot (the Meridian regression snapshot is in tools/tests/tenant.js).
   DC-11 DC-22 DC-23  industry packs are generated modules (src/mod_s_pack_<id>.js) loaded before this file; reuse of SCN content.
   CL-57  vocabulary: DATA.term(key, n | {many, cap, tenant}) and DATA.terms(tenant); defaults below, tenant words from the packs.
   JM-07  COO brief inputs per tenant: entities workload, value_chain, pillars (plus objectives, key_results, people agents).
   Tenant pack format: DATA.pack(tenantId, {entity: rows | () => rows, ...}, {org, short, kind}). Entities: DATA.entities().
   Format and generator: docs/tenant-packs.md. Screen adapters for existing read-only screens: mod_s_tenant_screens.js.
   Tenant isolation here is simulated (R52): it is application code in one browser page, not enforcement below the application. ===== */
(function(){
const W=window,D=document,DT=W.DATA;if(!DT)return;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const E=s=>U.esc(s);
/* rows that read the legacy object live (prototype chain), with an id added */
const live=(obj,id)=>Object.assign(Object.create(obj),{id});

/* ---------- 1. core entities: getters over the existing Meridian globals (CL-55) ---------- */
const nonCoreIds=key=>{const s=new Set();G(()=>Object.keys(SCN.pack).forEach(k=>{if(k!=="core")SCN.pack[k][key].forEach(x=>s.add(x.id))}));return s};
DT.define("projects",{label:"Projects",core:()=>PROJ,required:["n"]});
DT.define("budget_lines",{label:"Budget lines",core:()=>G(()=>S.bud.lines,[]),required:["n","p"]});
DT.define("invoices",{label:"Invoices",core:()=>INVOICES,required:["vendor","amt"]});
DT.define("people",{label:"People and agents",core:()=>DIR,required:["name"]});
DT.define("metrics",{label:"Metrics",core:()=>Object.keys(METRICS).map(k=>live(METRICS[k],k)),required:["n"]});
DT.define("objectives",{label:"Objectives",core:()=>NODES.filter(n=>n.t==="obj"),required:["n"]});
DT.define("processes",{label:"Processes (screen process models)",core:()=>Object.keys(G(()=>PROC.defs,{})).map(k=>live(PROC.defs[k],k))});
DT.define("workflows",{label:"Workflows",core:()=>{const ex=nonCoreIds("wfs");const cw=G(()=>SCN.pack.core.wfs,[]);const ids=new Set(cw.map(d=>d.id));
 return G(()=>WFX.defs,[]).filter(d=>!ex.has(d.id)&&!ids.has(d.id)).concat(cw)},required:["name"]});
DT.define("journeys",{label:"Journeys",core:()=>G(()=>SCN.pack.core.jys,[]),required:["n"]});
DT.define("personas",{label:"Journey personas",core:()=>G(()=>SCN.pack.core.pers,[]).map(n=>({id:U.slug(n),name:n}))});

/* entities added for the industry packs (DC-11, DC-22, DC-23), the COO brief (JM-07) and the vocabulary (CL-57).
   Their core sources read the Meridian globals live; a module that owns the global keeps owning it. */
const PILLARS0=[{id:"MS-PL1",n:"Grow member trust",d:"Members trust the standards and the process that makes them.",obj:"O1"},
 {id:"MS-PL2",n:"Publish faster",d:"A standard moves from draft to published in weeks, not months.",obj:"O1"},
 {id:"MS-PL3",n:"Spend less per standard",d:"Lower cost per published standard without cutting review quality.",obj:"O2"}];
/* the platform's default words; a tenant pack replaces any of them (R19) */
const VOC0={customer:["customer","customers"],incident:["incident","incidents"],ticket:["ticket","tickets"],request:["request","requests"],asset:["asset","assets"],
 site:["site","sites"],downtime:["outage","outages"],workforce:["team","teams"],work_item:["ticket","tickets"],frontline:["service desk","service desks"],service:["service","services"],
 order:["order","orders"],case:["case","cases"],supplier:["vendor","vendors"],revenue:["revenue","revenue"]};
DT.define("key_results",{label:"Key results",core:()=>G(()=>S.exe.krs,[]),required:["n","o"]});
DT.define("pillars",{label:"Strategy pillars",core:()=>PILLARS0,required:["n"]});
DT.define("demand",{label:"Demand requests",core:()=>G(()=>DEMAND,[]),required:["n"]});
DT.define("maturity",{label:"Process maturity records",core:()=>[],required:["process","dims","target"]});
DT.define("vocabulary",{label:"Vocabulary",core:()=>Object.keys(VOC0).map(k=>({id:k,one:VOC0[k][0],many:VOC0[k][1]})),required:["one","many"]});
DT.define("workload",{label:"Workload (COO brief)",core:()=>G(()=>ODX.people(),[]).map(p=>Object.assign({id:"wl-"+U.slug(p.n),label:"fact"},p)),required:["n"]});
DT.define("value_chain",{label:"Value chain steps (COO brief)",core:()=>G(()=>ODX.O2C.steps,[]).map((s,i)=>Object.assign({id:"core-vc"+(i+1),flow:ODX.O2C.n,label:"modeled"},s)),required:["n"]});

/* ---------- 2. tenant packs ----------
   Each industry tenant has a generated pack (src/mod_s_pack_<id>.js, from tools/generators/gen_pack_specs/<id>.json, DC-09)
   that loads before this file. Content that already exists is reused, never copied: journeys, workflows and personas come from
   SCN for any tenant whose pack does not supply them; people fall back to the org leaders when a pack has none. */
const PK=()=>W.TENANT_PACKS||{};
const orgPeople=k=>{const o=G(()=>TENANT.orgs[k],null),info=G(()=>TENANT.info[k],{})||{};const out=[];if(!o)return out;
 const add=(n,t,team)=>{if(n&&!out.some(p=>p.name===n))out.push({id:U.slug(n),name:n,kind:"human",role:t,team,org:info.org||"",loc:"",skills:[]})};
 if(info.lead)add(info.lead.n,info.lead.t,"Executive office");o.fns.forEach(f=>add(f.lead.n,f.lead.t,f.n));return out};
G(()=>Object.keys(SCN.list).filter(k=>k!=="core").forEach(k=>{const own=(PK()[k]||{}).rows||{};const add={};
 if(!own.journeys)add.journeys=()=>SCN.pack[k].jys;
 if(!own.workflows)add.workflows=()=>SCN.pack[k].wfs;
 if(!own.personas)add.personas=()=>SCN.pack[k].pers.map(n=>({id:U.slug(n),name:n}));
 if(!own.people)add.people=()=>orgPeople(k);
 if(Object.keys(add).length)DT.pack(k,add)}));
W.STN=W.STN||{};

/* ---------- 2b. vocabulary (CL-57): DATA.term(key, n | {many, cap}) -> the active tenant's word ----------
   A tenant without its own word for a key gets the platform default (configuration, not another tenant's data). */
const vocRow=(k,t)=>DT.get("vocabulary",{tenant:t}).find(r=>r.id===k);
DT.term=(key,o)=>{o=typeof o==="number"?{many:o!==1}:(o||{});const t=o.tenant||DT.tenant();
 const r=vocRow(key,t)||(t!=="core"?vocRow(key,"core"):null);let w=r?(o.many?r.many:r.one):String(key).replace(/_/g," ");
 return o.cap?w.charAt(0).toUpperCase()+w.slice(1):w};
DT.terms=t=>{const o={};Object.keys(VOC0).forEach(k=>o[k]=DT.term(k,{tenant:t||DT.tenant()}));DT.get("vocabulary",{tenant:t||DT.tenant()}).forEach(r=>o[r.id]=r.one);return o};
const T=(k,o)=>DT.term(k,o);

/* ---------- 3. identity and membership (CL-63, R44): simulated, default deny ---------- */
const ROLES={Executive:["view","approve"],Approver:["view","approve"],Architect:["view","configure"],"Tenant admin":["view","configure","approve"],"Demo viewer":["view"]};
const IDENT=W.IDENT={people:[
 {id:"casey-rowan",name:"Casey Rowan",title:"Chief information officer (demo presenter)",memberships:[{tenant:"core",roles:["Executive","Tenant admin"]},{tenant:"health",roles:["Demo viewer"]},{tenant:"mining",roles:["Demo viewer"]},{tenant:"storage",roles:["Demo viewer"]}]},
 {id:"jordan-lee",name:"Jordan Lee",title:"Enterprise architect",memberships:[{tenant:"core",roles:["Architect"]}]},
 {id:"grace-oduya",name:"Grace Oduya",title:"Chief operating officer",memberships:[{tenant:"health",roles:["Executive"]}]}],cur:"casey-rowan",ROLES};
IDENT.me=()=>IDENT.people.find(p=>p.id===IDENT.cur)||IDENT.people[0];
IDENT.membership=t=>(IDENT.me().memberships||[]).find(m=>m.tenant===t)||null;
IDENT.member=t=>!!IDENT.membership(t);
IDENT.roles=t=>(IDENT.membership(t)||{roles:[]}).roles.slice();
/* default deny: an action is allowed only when a role in this tenant's membership grants it */
IDENT.can=(action,t)=>IDENT.roles(t==null?DT.tenant():t).some(r=>(ROLES[r]||[]).indexOf(action)>=0);
IDENT.tenants=()=>(IDENT.me().memberships||[]).map(m=>m.tenant);
IDENT.use=function(id){const p=IDENT.people.find(x=>x.id===id);if(!p)return false;IDENT.cur=id;
 G(()=>{const b=D.querySelector(".rail .whoami b");if(b)b.textContent=p.name});
 if(!IDENT.member(DT.tenant())){const t=IDENT.tenants()[0];if(t)G(()=>SCN.set(t))}else G(()=>render());return true};
/* the guard sits in DATA: a registered tenant needs a membership. Ids that are not registered tenants are test fixtures and are not gated. */
DT.guard(id=>!DT.tenantInfo(id)||IDENT.member(id));
G(()=>HOOKS.on("tenantDenied",id=>G(()=>toast("No membership in "+((DT.tenantInfo(id)||{}).org||id)+". Access is denied by default.","warn")),{id:"stn-denied"}));

/* ---------- 4. tenant-aware screen registry (CL-55) ---------- */
[["tn_projects",["projects","budget_lines"]],["tn_people",["people"]],["tn_metrics",["metrics","objectives"]],["tn_admin",DT.entities().map(e=>e.entity)]]
 .forEach(([id,ents])=>DT.screen(id,{mode:"data",entities:ents,note:"Reads only through DATA.get"}));
DT.screen("ppl_jrny",{mode:"tenant",entities:["journeys","workflows","personas"],note:"Journey maps, every tab: follows SCN (in-place swap), not yet DATA"});
DT.screen("orgassist",{mode:"tenant",entities:["people"],note:"Org chart with agent assist: reads TENANT.orgs, not yet DATA"});
DT.screen("orgdesign",{mode:"core",entities:[],note:"Agent Action: presets per tenant through ODX.preset, but its gaps and options read the Meridian sample organization"});

/* ---------- 5. labels: the active tenant is always visible; legacy screens say they show the Meridian sample (R17, R18) ---------- */
const tname=t=>{const i=DT.tenantInfo(t)||{};return i.org||i.n||t};
function label(){const t=DT.tenant();const v=D.getElementById("view");if(!v)return;const id=G(()=>S.screen,"");
 const mode=DT.screenMode(id);const host=v.querySelector(".screen")||v;if(host.querySelector(".stn-legacy,.stn-chip"))return;
 /* phone layout hides the side menu, so a small chip names the tenant there (shown by CSS only in the mobile shell) */
 if(t==="core"||mode!=="core"){host.insertAdjacentHTML("afterbegin",`<div class="stn-chip" data-tenant-chip="1"><span class="stn-dot" aria-hidden="true"></span>Tenant: <b>${E((DT.tenantInfo(t)||{}).short||tname(t))}</b></div>`);return}
 host.insertAdjacentHTML("afterbegin",`<div class="stn-legacy" role="note" data-tenant-legacy="1"><span class="stn-dot" aria-hidden="true"></span><span>Tenant: <b>${E(tname(t))}</b>. This screen is not tenant-aware yet and still shows the Meridian sample data.</span><button type="button" class="btn quiet" data-go="tn_admin">Which screens follow the tenant</button></div>`)}
G(()=>HOOKS.on("afterRender",()=>{try{label()}catch(e){console.error("stn label",e)}},{order:50,id:"stn-label"}));

/* ---------- 6. screens that read only through DATA ---------- */
S.tn=S.tn||{q:"",kind:"all",ent:"projects"};
const n0=v=>(+v||0);
const money=k=>U.moneyShort(n0(k)*1000);
const LABN={fact:"Prototype fact",modeled:"Modeled",hypothesis:"Hypothesis",simulated:"Simulated"};
const labPill=k=>`<span class="pill mute" title="How this number was produced">${E(LABN[k]||LABN.simulated)}</span>`;
const lab=`<span class="pill mute" title="Sample figures for a fictional organization">Sample data · simulated</span>`;
const head=(eyebrow,h,story,extra)=>{const t=DT.tenant();return `<section class="hero"><div class="eyebrow">${E(eyebrow)} · ${E(tname(t))}</div><h1>${E(h)}</h1><p class="story" data-role="story">${story}</p><div class="stn-row"><span class="pill good">Tenant: ${E(tname(t))}</span>${lab}<span class="pill mute">Reads through the tenant data layer</span><span class="pill mute">Tenant isolation simulated</span></div>${extra||""}</section>`};
const gap=(ent)=>empty("No "+String((DT.entities().find(e=>e.entity===ent)||{}).label||ent).toLowerCase()+" in this tenant's pack yet","The gap is recorded (DATA.gaps). Rows from another tenant are never shown in their place.");
const table=(cols,rows)=>`<div class="stn-tw"><table class="stn-t"><thead><tr>${cols.map(c=>`<th scope="col">${E(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
/* owners render through ownerChip (R13); a missing backup shows the badge (R12) */
const own=(o,b,rec)=>{if(!o)return `<span class="muted">No owner</span>`;return G(()=>W.ownerChip.pair?ownerChip.pair(o,b,{record:rec}):ownerChip(o,{record:rec,role:"Owner"})+(b?" "+ownerChip(b,{record:rec,role:"Backup"}):""),E(o)+(b?", "+E(b):""))};
const good=m=>m.dir==="min"?n0(m.cur)<=n0(m.tgt):n0(m.cur)>=n0(m.tgt);
const mst=m=>pill(good(m)?"On target":"Off target",good(m)?"good":"warn");
const unit=(v,u)=>E(v)+(u&&u.trim()?(/^\s*%/.test(u)?"":" ")+E(u.trim()):"");
const krProg=k=>{const d=n0(k.tgt)-n0(k.start);return d?U.clamp((n0(k.cur)-n0(k.start))/d,0,1):0};
/* helpers shared with the screen adapters (mod_s_tenant_screens.js) */
Object.assign(W.STN,{E,G,T,n0,money,head,gap,table,own,good,mst,unit,krProg,labPill,tname,LABN});

REG("tn_projects","Projects and budget (tenant view)","platform","M3 3h18v18H3zM3 9h18M9 21V9",()=>{
 const P=DT.get("projects"),B=DT.get("budget_lines"),I=DT.get("invoices"),O=DT.get("objectives");const bac=P.reduce((a,p)=>a+n0(p.bac),0),paid=P.reduce((a,p)=>a+n0(p.paid),0);
 const appr=B.reduce((a,l)=>a+n0(l.appr),0),fc=B.reduce((a,l)=>a+n0(l.fcst),0);const on=id=>(O.find(o=>o.id===id)||{}).n||"";
 return `<div class="screen stn">${head("Tenant view","Projects and budget",`The projects, budget lines and ${E(T("supplier",{many:true}))}' invoices of the active tenant, read only through the tenant data layer. Switch the tenant and this screen stays open with the new tenant's rows.`)}
 ${tiles([TL("Projects",P.length,"Sample count","mute"),TL("Approved budget",P.length?money(bac):"None",P.length?"Sample figure, simulated":"Gap recorded","mute"),TL("Paid to date",P.length?money(paid):"None","Sample figure, simulated","mute"),TL("Budget lines over forecast",B.filter(l=>n0(l.fcst)>n0(l.appr)).length,B.length?"Forecast above approved, simulated":"Gap recorded","mute")])}
 ${card("Projects",P.length+" in this tenant",P.length?table(["Project","Objective","Owner and backup","Approved","Paid"],P.map(p=>[`<b>${E(p.n)}</b><small class="muted"> ${E(p.id)}</small>`,E(on(p.obj)),own(p.owner,p.backup,"project:"+p.id),money(p.bac),money(p.paid)])):gap("projects"))}
 ${card("Budget lines",B.length?U.moneyShort(appr)+" approved, "+U.moneyShort(fc)+" forecast (simulated)":"",B.length?table(["Line","Project","Category","Approved","Forecast","Owner and backup"],B.map(l=>[E(l.n),E(l.p),E(l.cat||""),U.moneyShort(l.appr),U.moneyShort(l.fcst),own(l.own,l.bk,"budget_line:"+l.id)])):gap("budget_lines"))}
 ${card("Invoices",I.length?I.length+" open, "+U.moneyShort(I.reduce((a,v)=>a+n0(v.amt),0))+" (simulated)":"",I.length?table(["Invoice",T("supplier",{cap:true}),"Project","Amount","Recommendation","Owner and backup"],I.map(v=>[`<b>${E(v.id)}</b><small class="muted"> due ${E(v.due||"")}</small>`,E(v.vendor),E(v.p||""),U.money(v.amt),pill(v.rec==="pay"?"Pay":v.rec==="hold"?"Hold":"Review",v.rec==="pay"?"good":v.rec==="hold"?"bad":"warn")+`<small class="muted"> ${E(v.story||"")}</small>`,own(v.own,v.bk,"invoice:"+v.id)])):gap("invoices"))}</div>`});

REG("tn_people","People directory (tenant view)","platform","M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",()=>{
 const st=S.tn,q=String(st.q||"").toLowerCase();const all=DT.get("people");
 const rows=all.filter(p=>(st.kind==="all"||p.kind===st.kind)&&(!q||(p.name+" "+(p.role||"")+" "+(p.team||"")).toLowerCase().indexOf(q)>=0));
 const kinds=[["all","Everyone"],["human","People"],["agent","AI agents"],["robot","Robots"]];
 return `<div class="screen stn">${head("Tenant view","People directory",`The people, agents and robots of the active tenant. Your filter and search stay when you switch tenant; only the rows change.`)}
 ${card("Directory",rows.length+" of "+all.length+" shown",`<div class="stn-row" role="group" aria-label="Filter"><label class="stn-q"><span class="muted small">Search</span><input type="search" data-tn-q value="${E(st.q||"")}" placeholder="Name, role or team"></label>${kinds.map(([k,l])=>`<button type="button" class="chip" data-tn-kind="${k}" aria-pressed="${st.kind===k}">${l}</button>`).join("")}</div>
 ${all.length?(rows.length?table(["Name","Kind","Role","Team","Human sponsor"],rows.slice(0,60).map(p=>[`<b>${E(p.name)}</b>`,p.kind==="agent"?"AI agent":p.kind==="robot"?"Robot":p.kind==="human"?"Person":E(p.kind||""),E(p.role||""),E(p.team||""),p.sponsor?E(p.sponsor):""])):empty("Nobody matches the filter","Clear the search or choose Everyone.")):gap("people")}`)}</div>`});

REG("tn_metrics","Metrics and objectives (tenant view)","platform","M4 19V9M10 19V5M16 19v-7M22 19H2",()=>{
 const M=DT.get("metrics"),O=DT.get("objectives"),K=DT.get("key_results");
 return `<div class="screen stn">${head("Tenant view","Metrics and objectives",`The active tenant's own metrics, objectives and key results, with its own vocabulary. Each industry metric has an owner, a backup, a formula, a baseline and a remediation. Values are sample figures (simulated).`)}
 ${card("Metrics",M.length+" in this tenant",M.length?table(["Metric","Current","Target","Baseline","Status","Owner and backup","Source"],M.map(m=>[`<b>${E(m.n)}</b>${m.f?`<small class="muted"> ${E(m.f)}</small>`:""}`,unit(m.cur,m.u),(m.dir==="min"?"at most ":"at least ")+unit(m.tgt,m.u),m.base!=null?unit(m.base,m.u):`<span class="muted">none</span>`,mst(m),own(m.owner,m.backup,"metric:"+m.id),labPill(m.label)])):gap("metrics"))}
 ${card("Objectives and key results",O.length+" objectives, "+K.length+" key results",O.length?table(["Objective","Owner and backup","Key results"],O.map(o=>[`<b>${E(o.n)}</b><small class="muted"> ${E(o.story||"")}</small>`,own(o.owner,o.backup,"objective:"+o.id),K.filter(k=>k.o===o.id).map(k=>`<div>${E(k.n)}: ${unit(k.cur,k.u)} toward ${unit(k.tgt,k.u)} (${Math.round(krProg(k)*100)}% of the way)</div>`).join("")||`<span class="muted">No key results</span>`])):gap("objectives"))}</div>`});

/* ---------- 7. the tenancy admin screen: tenants, identity, entities, screen registry, pack validation ---------- */
REG("tn_admin","Tenancy","platform","M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",()=>{
 const t=DT.tenant(),me=IDENT.me(),scr=DT.screens(),by={data:[],tenant:[],core:[]};scr.forEach(s=>(by[s.mode]||by.core).push(s));
 const ents=DT.entities(),tens=DT.tenants();const gaps=DT.gaps();
 const tRows=tens.map(x=>{const v=DT.validate(x.id);const mem=IDENT.membership(x.id);return[`<b>${E(x.org||x.n||x.id)}</b><small class="muted"> ${E(x.id)}</small>`,E(x.kind||""),mem?E(mem.roles.join(", ")):`<span class="muted">No membership (denied)</span>`,v.ok?pill("Pack valid","good"):pill(v.errors.length+" errors","bad"),
  x.id===t?pill("Active","good"):mem?`<button type="button" class="btn quiet" data-r32-tn="${E(x.id)}">Switch</button>`:""]});
 const eRows=ents.map(e=>[`<b>${E(e.label)}</b><small class="muted"> ${E(e.entity)}</small>`].concat(tens.map(x=>{const n=DT.get(e.entity,{tenant:x.id}).length;return n?String(n):`<span class="muted">gap</span>`})));
 const cnt=k=>by[k].length;
 return `<div class="screen stn">${head("Platform","Tenancy",`Every tenant is a separate customer with its own data. You are one identity with a membership in each tenant you can open, and a role in each membership. Anything not granted is denied.`)}
 ${tiles([TL("Active tenant",E((DT.tenantInfo(t)||{}).short||tname(t)),"Always shown in the side menu","mute"),TL("Your memberships",IDENT.tenants().length,"Simulated identity","mute"),TL("Screens reading through DATA",cnt("data"),cnt("tenant")+" more follow the tenant another way","mute"),TL("Screens on the Meridian sample only",cnt("core"),"Labeled on screen under other tenants","mute")])}
 <div data-tenant-chooser="1">${card("Who you are",E(me.name)+" · "+E(me.title),`<div class="stn-row" role="group" aria-label="View as">${IDENT.people.map(p=>`<button type="button" class="chip" data-tn-ident="${E(p.id)}" aria-pressed="${p.id===me.id}">${E(p.name)}</button>`).join("")}</div>
  <p class="muted small">View as another demo identity to see default deny: the switcher only offers tenants that identity is a member of. Permissions in ${E(tname(t))}: ${["view","approve","configure"].map(a=>E(a)+" "+(IDENT.can(a,t)?"allowed":"denied")).join(", ")}.</p>`)}</div>
 <div data-tenant-chooser="1">${card("Tenants",tens.length+" registered (all fictional)",table(["Tenant","Kind","Your roles","Pack","" ],tRows))}</div>
 <div data-tenant-chooser="1">${card("Tenant packs","Generated from a small spec by tools/generators/gen_pack.py, loaded through DATA.pack: the path a real customer's data takes (R20, docs/tenant-packs.md)",table(["Tenant","Source","Reuses","Image","Vocabulary"],tens.filter(x=>x.id!=="core").map(x=>{const pk=PK()[x.id];if(!pk)return[E(x.short||x.id),`<span class="muted">No generated pack</span>`,"","",""];
  return[`<b>${E(x.short||x.id)}</b>`,`<code>${E(pk.spec)}</code>`,E((pk.reuse||[]).join(", ")),pk.images&&pk.images.hero?`<code>${E(pk.images.hero)}</code><small class="muted"> ${E(pk.images.provenance||"")}</small>`:"",E(["customer","incident","ticket","asset","site"].map(k=>k+": "+DT.term(k,{tenant:x.id})).join(" · "))]})))}</div>
 <div data-tenant-chooser="1">${card("Entities per tenant","Row counts read through DATA.get; a gap is never filled with another tenant's rows",table(["Entity"].concat(tens.map(x=>x.short||x.id)),eRows)+(gaps.length?`<p class="muted small">Gaps recorded so far: ${E(gaps.join(", "))}</p>`:""))}</div>
 ${card("Tenant-aware screen registry",scr.length+" screens",`<p class="muted small">Reads through DATA: ${by.data.map(s=>`<button type="button" class="chip" data-go="${E(s.id)}">${E(s.name)}</button>`).join(" ")}</p><p class="muted small">Follows the tenant another way, not yet DATA: ${by.tenant.map(s=>`<button type="button" class="chip" data-go="${E(s.id)}">${E(s.name)}</button>`).join(" ")}</p><p class="muted small">The other ${cnt("core")} screens show the Meridian sample only and are labeled when another tenant is active. They move to DATA screen by screen (CL-55).</p>`)}
 <p class="muted small">Tenant isolation in this prototype is simulated: one browser page with sample data, no enforcement below the application yet.</p></div>`});

/* ---------- 8. events and search ---------- */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-tn-kind],[data-tn-ident]");if(!t)return;
 if(t.dataset.tnKind){S.tn.kind=t.dataset.tnKind;render()}else if(t.dataset.tnIdent)IDENT.use(t.dataset.tnIdent)});
let qT=null;D.addEventListener("input",e=>{const i=e.target.closest&&e.target.closest("[data-tn-q]");if(!i)return;S.tn.q=i.value;clearTimeout(qT);
 qT=setTimeout(()=>{render();const n=D.querySelector("[data-tn-q]");if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(x){}}},250)});
/* search: the active non-core tenant's records come from DATA, so search follows the tenant (R18) */
G(()=>SEARCHX.push(()=>{const t=DT.tenant();if(t==="core")return[];const org=tname(t);
 return DT.get("projects").map(p=>({g:"Projects",t:p.n,m:org+" · "+(p.owner||""),c:"--p4",f:()=>go("tn_projects"),k:"project "+p.n.toLowerCase()+" "+p.id.toLowerCase()}))
  .concat(DT.get("people").map(p=>({g:"People",t:p.name,m:org+" · "+(p.role||""),c:"--s3",f:()=>{S.tn.q=p.name;go("tn_people")},k:"person "+p.name.toLowerCase()})))
  .concat(DT.get("metrics").map(m=>({g:"Metrics",t:m.n,m:org,c:"--u3",f:()=>go("tn_metrics"),k:"metric "+String(m.n).toLowerCase()})))
  .concat(DT.get("objectives").map(o=>({g:"Objectives",t:o.n,m:org+" · "+(o.owner||""),c:"--p4",f:()=>go("tn_metrics"),k:"objective strategy "+String(o.n).toLowerCase()})))
  .concat(DT.get("invoices").map(v=>({g:"Invoices",t:v.id+" "+v.vendor,m:org+" · "+U.money(v.amt),c:"--w1",f:()=>go("tn_projects"),k:"invoice "+String(v.id+" "+v.vendor).toLowerCase()})))}));
G(()=>{if(W.NAVX&&NAVX.add){NAVX.add("tn_admin",{group:"plat",label:"Tenancy",hint:"Tenancy",sub:"Tenants, memberships, data",kw:"tenant tenancy membership identity isolation pack switch customer"});
 NAVX.add("tn_projects",{group:"plat",label:"Projects and budget (tenant view)",hint:"Tenant projects",sub:"Read through the tenant data layer",kw:"tenant projects budget lines"});
 NAVX.add("tn_people",{group:"plat",label:"People directory (tenant view)",hint:"Tenant people",sub:"Read through the tenant data layer",kw:"tenant people directory"});
 NAVX.add("tn_metrics",{group:"plat",label:"Metrics and objectives (tenant view)",hint:"Tenant metrics",sub:"Read through the tenant data layer",kw:"tenant metrics objectives"})}});
})();
