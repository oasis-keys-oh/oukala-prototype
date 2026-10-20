/* ===== mod_s_tenant: tenancy on top of DATA (docs/tenant-seams.md). CSS prefix stn-.
   CL-55  core entities defined over the existing Meridian globals, a tenant-aware screen registry (DATA.screens()).
   DC-03  loader spike: three read-only screens that read only through DATA (tn_projects, tn_people, tn_metrics).
   DC-31  one tenant model: SCN.set and TENANT.switch both go through DATA.setTenant; the active tenant is always on screen.
   CL-56  seamless switch: the same screen re-renders with S (tabs, filters) kept; legacy screens are labeled, not hidden.
   CL-63  demo identity: one person, memberships per tenant, roles per membership, default deny (DATA.guard). Simulated.
   DC-09  tenant pack format, DATA.validate and DATA.snapshot (the Meridian regression snapshot is in tools/tests/tenant.js).
   Tenant pack format: DATA.pack(tenantId, {entity: rows | () => rows, ...}, {org, short, kind}). Entities: DATA.entities().
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

/* ---------- 2. packs for the industry tenants from the content that already exists (journeys, workflows, personas, org leaders) ---------- */
/* extra rows a later file adds per tenant (the Healthcare spike pack adds people) */
const STN_EXTRA={};W.STN={extra:STN_EXTRA};
const orgPeople=k=>{const o=G(()=>TENANT.orgs[k],null),info=G(()=>TENANT.info[k],{})||{};const out=[];if(!o)return out;
 const add=(n,t,team)=>{if(n&&!out.some(p=>p.name===n))out.push({id:U.slug(n),name:n,kind:"human",role:t,team,org:info.org||"",loc:"",skills:[]})};
 if(info.lead)add(info.lead.n,info.lead.t,"Executive office");o.fns.forEach(f=>add(f.lead.n,f.lead.t,f.n));return out};
G(()=>Object.keys(SCN.list).filter(k=>k!=="core").forEach(k=>DT.pack(k,{
 journeys:()=>SCN.pack[k].jys,workflows:()=>SCN.pack[k].wfs,personas:()=>SCN.pack[k].pers.map(n=>({id:U.slug(n),name:n})),
 people:()=>orgPeople(k).concat(G(()=>STN_EXTRA[k].people,[]))})));

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
const lab=`<span class="pill mute" title="Sample figures for a fictional organization">Sample data · simulated</span>`;
const head=(eyebrow,h,story)=>{const t=DT.tenant();return `<section class="hero"><div class="eyebrow">${E(eyebrow)} · ${E(tname(t))}</div><h1>${E(h)}</h1><p class="story" data-role="story">${story}</p><div class="stn-row"><span class="pill good">Tenant: ${E(tname(t))}</span>${lab}<span class="pill mute">Reads through the tenant data layer</span><span class="pill mute">Tenant isolation simulated</span></div></section>`};
const gap=(ent)=>empty("No "+String((DT.entities().find(e=>e.entity===ent)||{}).label||ent).toLowerCase()+" in this tenant's pack yet","The gap is recorded (DATA.gaps). Rows from another tenant are never shown in their place.");
const table=(cols,rows)=>`<div class="stn-tw"><table class="stn-t"><thead><tr>${cols.map(c=>`<th scope="col">${E(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

REG("tn_projects","Projects and budget (tenant view)","platform","M3 3h18v18H3zM3 9h18M9 21V9",()=>{
 const P=DT.get("projects"),B=DT.get("budget_lines");const bac=P.reduce((a,p)=>a+n0(p.bac),0),paid=P.reduce((a,p)=>a+n0(p.paid),0);
 const appr=B.reduce((a,l)=>a+n0(l.appr),0),fc=B.reduce((a,l)=>a+n0(l.fcst),0);
 return `<div class="screen stn">${head("Tenant view","Projects and budget",`The projects and budget lines of the active tenant, read only through the tenant data layer. Switch the tenant and this screen stays open with the new tenant's rows.`)}
 ${tiles([TL("Projects",P.length,"Sample count","mute"),TL("Approved budget",P.length?money(bac):"None",P.length?"Sample figure, simulated":"Gap recorded","mute"),TL("Paid to date",P.length?money(paid):"None","Sample figure, simulated","mute"),TL("Budget lines over forecast",B.filter(l=>n0(l.fcst)>n0(l.appr)).length,B.length?"Forecast above approved, simulated":"Gap recorded","mute")])}
 ${card("Projects",P.length+" in this tenant",P.length?table(["Project","Owner","Approved","Paid"],P.map(p=>[`<b>${E(p.n)}</b><small class="muted"> ${E(p.id)}</small>`,E(p.owner||""),money(p.bac),money(p.paid)])):gap("projects"))}
 ${card("Budget lines",B.length?U.moneyShort(appr)+" approved, "+U.moneyShort(fc)+" forecast (simulated)":"",B.length?table(["Line","Project","Category","Approved","Forecast","Owner"],B.map(l=>[E(l.n),E(l.p),E(l.cat||""),U.moneyShort(l.appr),U.moneyShort(l.fcst),E(l.own||"")])):gap("budget_lines"))}</div>`});

REG("tn_people","People directory (tenant view)","platform","M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",()=>{
 const st=S.tn,q=String(st.q||"").toLowerCase();const all=DT.get("people");
 const rows=all.filter(p=>(st.kind==="all"||p.kind===st.kind)&&(!q||(p.name+" "+(p.role||"")+" "+(p.team||"")).toLowerCase().indexOf(q)>=0));
 const kinds=[["all","Everyone"],["human","People"],["agent","AI agents"]];
 return `<div class="screen stn">${head("Tenant view","People directory",`The people and agents of the active tenant. Your filter and search stay when you switch tenant; only the rows change.`)}
 ${card("Directory",rows.length+" of "+all.length+" shown",`<div class="stn-row" role="group" aria-label="Filter"><label class="stn-q"><span class="muted small">Search</span><input type="search" data-tn-q value="${E(st.q||"")}" placeholder="Name, role or team"></label>${kinds.map(([k,l])=>`<button type="button" class="chip" data-tn-kind="${k}" aria-pressed="${st.kind===k}">${l}</button>`).join("")}</div>
 ${all.length?(rows.length?table(["Name","Kind","Role","Team"],rows.slice(0,60).map(p=>[`<b>${E(p.name)}</b>`,p.kind==="agent"?"AI agent":p.kind==="human"?"Person":E(p.kind||""),E(p.role||""),E(p.team||"")])):empty("Nobody matches the filter","Clear the search or choose Everyone.")):gap("people")}`)}</div>`});

REG("tn_metrics","Metrics and objectives (tenant view)","platform","M4 19V9M10 19V5M16 19v-7M22 19H2",()=>{
 const M=DT.get("metrics"),O=DT.get("objectives");
 const st=m=>{const good=m.dir==="min"?n0(m.cur)<=n0(m.tgt):n0(m.cur)>=n0(m.tgt);return pill(good?"On target":"Off target",good?"good":"warn")};
 return `<div class="screen stn">${head("Tenant view","Metrics and objectives",`The active tenant's own metrics and objectives, with its own vocabulary. Values are sample figures (simulated).`)}
 ${card("Metrics",M.length+" in this tenant",M.length?table(["Metric","Current","Target","Status","Owner"],M.map(m=>[`<b>${E(m.n)}</b>`,E(m.cur)+" "+E(m.u||""),(m.dir==="min"?"at most ":"at least ")+E(m.tgt)+" "+E(m.u||""),st(m),E(m.owner||"")])):gap("metrics"))}
 ${card("Objectives",O.length+" in this tenant",O.length?table(["Objective","Owner","Outcome"],O.map(o=>[`<b>${E(o.n)}</b>`,E(o.owner||""),E(o.story||"")])):gap("objectives"))}</div>`});

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
  .concat(DT.get("metrics").map(m=>({g:"Metrics",t:m.n,m:org,c:"--u3",f:()=>go("tn_metrics"),k:"metric "+String(m.n).toLowerCase()})))}));
G(()=>{if(W.NAVX&&NAVX.add){NAVX.add("tn_admin",{group:"plat",label:"Tenancy",hint:"Tenancy",sub:"Tenants, memberships, data",kw:"tenant tenancy membership identity isolation pack switch customer"});
 NAVX.add("tn_projects",{group:"plat",label:"Projects and budget (tenant view)",hint:"Tenant projects",sub:"Read through the tenant data layer",kw:"tenant projects budget lines"});
 NAVX.add("tn_people",{group:"plat",label:"People directory (tenant view)",hint:"Tenant people",sub:"Read through the tenant data layer",kw:"tenant people directory"});
 NAVX.add("tn_metrics",{group:"plat",label:"Metrics and objectives (tenant view)",hint:"Tenant metrics",sub:"Read through the tenant data layer",kw:"tenant metrics objectives"})}});
})();
