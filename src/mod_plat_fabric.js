/* mod_plat_fabric: the Oukala Integration Fabric. ETL, orchestration and middleware that feed any registry entity or field from external systems.
   Separately licensable (placeholder edition names), built into the platform. Screen: plat_fab. Exposes window.FAB. */
(function(){
const E=esc;
const F=S.fab=S.fab||{edition:"fabric",key:"FAB-MSF-2026-7Q4K",ready:false,mapConn:"c_graph",sel:null,ovr:{},lastSample:{},mapTest:{},mapVer:{},usage:1412,seq:{run:4900,q:60,ev:9000,wi:1300,rec:300,req:40,prj:7}};
/* PR-32 B9 tenant rows (R16 to R18): Meridian reads the entity part's own source live through the entity layer (S.fab.conns, maps,
   runs, events and the reconcile work items, the same objects); another tenant reads its own pack rows through DATA.get; no rows is []
   and a labeled gap. Under another tenant the screen shows the tenant's connectors and mappings and labeled gaps for the rest, since
   the runs, quarantine, reconciliation, M2M projects and samples here are Meridian records. */
const TCORE=()=>!window.DATA||DATA.tenant()==="core";
const TPARTS=new WeakMap();
const TROWS=(e,part)=>{if(TCORE()){const d=window.TENANT_ENTITIES&&TENANT_ENTITIES.get(e);const p=d&&(part?d.src.find(x=>x[0]===part):d.src[0]);
  let v=null;try{v=p?p[1]():null}catch(x){}return v==null?[]:v}
 const all=DATA.get(e);if(!part)return all;let m=TPARTS.get(all);if(!m){m={};TPARTS.set(all,m)}return m[part]||(m[part]=all.filter(r=>r.part===part))};
const TGAP=w=>`<p class="muted small" data-tenant-gap="1">No data in this sample company yet${w?": "+U.esc(w):""}.</p>`;
const fchipT=id=>TCORE()||DATA.byId("metrics",id)?fchip(id):"";
const CONNS=()=>TROWS("connectors","connection"),MAPS=()=>TROWS("connectors","mapping"),RUNS=()=>TROWS("connectors","run"),FEVTS=()=>TROWS("connectors","event"),WIS=()=>TROWS("work_items","reconcile");
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NOW=new Date(U.TODAY_ISO+"T15:30:00Z");
const tsAgo=m=>{const d=new Date(NOW.getTime()-m*60000);return MON[d.getUTCMonth()]+" "+d.getUTCDate()+", "+String(d.getUTCHours()).padStart(2,"0")+":"+String(d.getUTCMinutes()).padStart(2,"0")};
const dayS=(n)=>{const d=new Date(NOW.getTime()+n*86400000);return MON[d.getUTCMonth()]+" "+d.getUTCDate()+", "+d.getUTCFullYear()};
const isoDay=n=>new Date(NOW.getTime()+n*86400000).toISOString().slice(0,10);
const hs=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%9973;return h};
const ED={core:{n:"Base",conn:3,runs:2000,env:1,envs:["Production"],tag:"Free inside the platform",feat:["Read-only connections to platform data","A few built-in sync jobs"]},
 fabric:{n:"Integration",conn:15,runs:100000,env:2,envs:["Production","Sandbox"],tag:"Per year, by connector count",feat:["External connectors","Mapping studio","Orchestration and event bus","Reconciliation","Machine-to-machine projects"]},
 enterprise:{n:"Enterprise integration",conn:60,runs:2000000,env:5,envs:["Production","Staging","Test","Development","Sandbox"],tag:"Per year, by volume",feat:["Everything in Integration","More certified connectors","Up to five environments","Much higher run volume"]}};
const FR={live:{s:5,l:"Live, under 5 seconds",mode:"Real-time",how:"Event stream: the source pushes every change as it happens"},"near-live":{s:300,l:"Near-live, under 5 minutes",mode:"Real-time",how:"Event stream with a short coalescing window, or a one minute poll when the source cannot push"},hourly:{s:3600,l:"Hourly",mode:"Batch",how:"Scheduled batch every hour"},daily:{s:86400,l:"Daily",mode:"Batch",how:"Scheduled nightly batch"}};
const lagS=s=>s<60?s+" s":s<3600?Math.round(s/60)+" min":Math.round(s/3600*10)/10+" h";
const AUTHP={platform:"good",external:"info",shared:"warn"},CLSP={public:"mute",internal:"mute",confidential:"warn",restricted:"bad",personal:"bad"};
const pill=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
const TIERP={certified:["Certified","good"],community:["Community","warn"],project:["Project-scoped","info"]};
const STP={healthy:["Healthy","good"],degraded:["Degraded","warn"],sandbox:["Sandbox only","warn"],expiring:["Expiring soon","warn"],expired:["Expired","bad"],paused:["Paused","mute"],roadmap:["Roadmap","mute"],"new":["New, first run pending","info"]};
const tierPill=t=>pill(TIERP[t][0],TIERP[t][1]),stPill=s=>pill((STP[s]||[s])[0],(STP[s]||[0,"mute"])[1]);
const ent_=id=>PLAT.ent(id);
const ENTLBL=id=>{const e=ent_(id);return e?e.label:id};
const fieldOf=(en,k)=>{const e=ent_(en);return e&&e.fields.find(f=>f.k===k)};
const ftype=(en,k)=>{const f=fieldOf(en,k);return f?(f.type||"string"):"string"};
const flabel=(en,k)=>{const f=fieldOf(en,k);return f?f.label:k};
function eff(en,k){const f=fieldOf(en,k);let m=f?PLAT.fieldMeta(en,f):{auth:"platform",dir:"out",fresh:"live",cls:"internal",why:"",conflict:BRAND.name+" wins",trust:.9,rule:""};
 const o=F.ovr[en+"."+k];if(o)m=Object.assign({},m,{auth:o.auth,fresh:o.fresh,dir:o.auth==="platform"?"out":o.auth==="external"?"in":"both",conflict:o.conflict||m.conflict,over:true});return m}
const modeOf=fr=>FR[fr]||FR.hourly;
/* ---------- seeds ---------- */
function A(scopes,t,profile,vault,idn){return{t,profile,vault,idn,scopes}}
function seedConns(){return[
 {id:"c_plat",name:"Platform data (read only)",kind:"builtin",tier:"certified",status:"healthy",owner:"Platform team",min:"core",env:"Production",ents:["project","project_task","person","incident"],canStream:true,lag:2,sys:BRAND.name+" registry",risk:"Low",desc:"Reads any registry entity the viewer is allowed to see, through the typed API. No external system and no secret.",auth:A(["registry.read"],"Service identity","svc-fabric-readonly","None needed","svc-fabric-readonly")},
 {id:"c_hol",name:"Holiday calendar sync",kind:"builtin",tier:"certified",status:"healthy",owner:"Platform team",min:"core",env:"Production",ents:["time_off"],canStream:false,lag:2400,sys:"Public holiday calendar",risk:"Low",desc:"Built-in job that loads company holidays into time off every night.",auth:A(["calendar.public.read"],"No credential","public-feed","None needed","svc-fabric-builtin")},
 {id:"c_dir",name:"Directory refresh",kind:"builtin",tier:"certified",status:"healthy",owner:"Platform team",min:"core",env:"Production",ents:["person"],canStream:false,lag:3000,sys:BRAND.name+" profile editor",risk:"Low",desc:"Built-in nightly job that normalizes titles and teams edited inside "+BRAND.name+".",auth:A(["profile.read"],"Service identity","svc-fabric-builtin","None needed","svc-fabric-builtin")},
 {id:"c_graph",name:"Microsoft Graph",kind:"graph",tier:"certified",status:"healthy",owner:"Jordan Lee",min:"fabric",env:"Production",ents:["person","project_task","time_off"],canStream:true,lag:140,sys:"Microsoft 365 (E5)",risk:"Medium",desc:"Users, groups, calendar, mail metadata, Teams, Planner and files. Also the replacement path for retired Project Online.",auth:A(["User.Read.All","Group.Read.All","Calendars.ReadBasic.All","Tasks.Read.All","Team.ReadBasic.All","Mail.ReadBasic.All","Sites.Selected"],"OAuth 2.0 client credentials","graph-prod-app","vault://meridian-prod/fabric/graph-client-secret","svc-fabric-graph")},
 {id:"c_idp",name:"Entra ID (OIDC and SCIM)",kind:"idp",tier:"certified",status:"healthy",owner:"Rina Okafor",min:"fabric",env:"Production",ents:["person"],canStream:true,lag:45,sys:"Microsoft Entra ID",risk:"Medium",desc:"OpenID Connect sign-in plus SCIM (System for Cross-domain Identity Management) lifecycle and groups. Feeds role-based and attribute-based access control.",auth:A(["openid","profile","scim.users","scim.groups"],"OIDC + SCIM bearer","entra-oidc-prod","vault://meridian-prod/fabric/entra-scim-token","svc-fabric-idp")},
 {id:"c_jira",name:"Jira Cloud (Generic REST)",kind:"rest",tier:"certified",status:"healthy",owner:"Sam Patel",min:"fabric",env:"Production",ents:["user_story","project_task"],canStream:true,lag:70,sys:"Jira Cloud",risk:"Medium",desc:"Issues and due dates from the engineering team's Jira. Webhooks for real-time, REST polling as fallback.",auth:A(["read:jira-work"],"OAuth 2.0 (3LO)","jira-oauth-prod","vault://meridian-prod/fabric/jira-oauth","svc-fabric-rest")},
 {id:"c_erp",name:"Lease subledger (Generic REST)",kind:"rest",tier:"certified",status:"degraded",owner:"Avery Chen",min:"fabric",env:"Production",ents:["invoice"],canStream:false,lag:61000,sys:"Lease subledger (ERP)",risk:"Medium",desc:"Posted invoice amounts and payment status, nightly. ERP is authoritative for money.",auth:A(["invoices.read"],"API key in header","erp-readonly-key","vault://meridian-prod/fabric/erp-api-key","svc-fabric-rest"),note:"Rate limit hit twice last night (HTTP 429). Backoff worked; next run is on schedule."},
 {id:"c_mcp_reg",name:BRAND.name+" registry as an MCP server",kind:"mcp",tier:"certified",status:"healthy",owner:"Sam Patel",min:"fabric",env:"Production",ents:[],canStream:true,lag:1,sys:"Agents and IDE tools",risk:"Medium",desc:"Exposes the platform registry as MCP (Model Context Protocol) tools and resources, with ABAC masking on every call.",auth:A(["registry.read","registry.propose"],"OAuth 2.0 token exchange","mcp-registry-server","vault://meridian-prod/fabric/mcp-signing-key","svc-fabric-mcp-out")},
 {id:"c_mcp_lumen",name:"Lumen search MCP server",kind:"mcp",tier:"community",status:"sandbox",owner:"Tom Becker",min:"fabric",env:"Sandbox",ents:["alert_event"],canStream:false,lag:30,sys:"Lumen search service",risk:"Medium",desc:"Consumes the vendor's MCP server for index alerts. Sandbox only until the security evaluation completes.",auth:A(["tools:list_index_alerts"],"Bearer token","lumen-mcp-sbx","vault://meridian-sbx/fabric/lumen-mcp-token","svc-fabric-mcp-in")},
 {id:"c_cr",name:"Contract Repository (citizen build)",kind:"rest",tier:"community",status:"sandbox",owner:"Maya Ortiz",min:"fabric",env:"Sandbox",ents:["contract"],canStream:false,lag:80000,sys:"Contract Repository",risk:"High",desc:"Built by a business team with the REST connector. Sandbox only; contract values are confidential.",auth:A(["contracts.read"],"API key in header","cr-sbx-key","vault://meridian-sbx/fabric/cr-key","svc-fabric-rest-sbx")},
 {id:"c_cod",name:"Standards Platform export",kind:"rest",tier:"project",status:"healthy",owner:"Chief Editor",min:"fabric",env:"Production",ents:["feature"],canStream:false,lag:3300,sys:"Standards Platform",risk:"Low",desc:"Temporary feed for project PR3 while the editorial workflow moves. Decommission task is created at expiry.",expiry:isoDay(55),auth:A(["export.read"],"API key in header","cod-export-key","vault://meridian-prod/fabric/cod-key","svc-fabric-rest")},
 {id:"c_lum",name:"Lumen index cutover feed",kind:"rest",tier:"project",status:"expiring",owner:"Dev Rao",min:"fabric",env:"Production",ents:["alert_event"],canStream:false,lag:240,sys:"Lumen search service",risk:"Low",desc:"Project PR2 cutover monitoring. Expires Oct 20.",expiry:isoDay(14),auth:A(["alerts.read"],"API key in header","lum-cutover-key","vault://meridian-prod/fabric/lum-cutover","svc-fabric-rest")},
 {id:"c_pol",name:"Project Online export bridge",kind:"graph",tier:"project",status:"expired",owner:"Priya Shah",min:"fabric",env:"Production",ents:["project_task","project"],canStream:false,lag:0,sys:"Project Online (retired Sept 30, 2026)",risk:"Low",desc:"One-time bridge for project PR1 that copied schedules out of Project Online before it retired on Sept 30, 2026. Replaced by Planner through Microsoft Graph.",expiry:isoDay(-6),auth:A(["Tasks.Read.All"],"OAuth 2.0 client credentials","pol-bridge","vault://meridian-prod/fabric/pol-bridge (revoked)","svc-fabric-pol (disabled)")},
 {id:"r_perp",name:"Perplexity",kind:"roadmap",tier:"certified",status:"roadmap",owner:"Platform team",min:"enterprise",ents:[],desc:"Cited research answers as a governed source."},
 {id:"r_ide",name:"IDE and coding tools",kind:"roadmap",tier:"certified",status:"roadmap",owner:"Platform team",min:"enterprise",ents:[],desc:"Pull requests, builds and repository metadata."},
 {id:"r_erp",name:"ERP (native)",kind:"roadmap",tier:"certified",status:"roadmap",owner:"Platform team",min:"enterprise",ents:[],desc:"Prebuilt ledger, purchase order and cost center models."},
 {id:"r_hr",name:"HR system",kind:"roadmap",tier:"certified",status:"roadmap",owner:"Platform team",min:"enterprise",ents:[],desc:"Positions, leave balances and org units."},
 {id:"r_crm",name:"CRM",kind:"roadmap",tier:"certified",status:"roadmap",owner:"Platform team",min:"enterprise",ents:[],desc:"Members, accounts and engagement."},
 {id:"r_itsm",name:"Other ITSM tools",kind:"roadmap",tier:"certified",status:"roadmap",owner:"Platform team",min:"enterprise",ents:[],desc:"Two-way sync with ticketing systems used by vendors."}]}
const KIND={builtin:"Built in",graph:"Microsoft Graph",idp:"Identity provider",rest:"Generic REST",mcp:"MCP",roadmap:"Roadmap"};
const MAPSEED=[
 ["c_graph","startDateTime","datetime","project_task","planned_start","ISO date to date",.96,"approved",2400],["c_graph","dueDateTime","datetime","project_task","planned_finish","ISO date to date",.96,"approved",2400],
 ["c_graph","percentComplete","int","project_task","percent_complete","As is",.93,"approved",2400],["c_graph","title","string","project_task","name","Trim",.9,"approved",2400],
 ["c_graph","displayName","string","person","name","Trim",.97,"approved",140],["c_graph","jobTitle","string","person","role","Trim",.95,"approved",140],["c_graph","department","string","person","team","Trim",.82,"approved",140],
 ["c_graph","oofStart","datetime","time_off","from","ISO date to date",.88,"approved",900],["c_graph","oofEnd","datetime","time_off","to","ISO date to date",.88,"approved",900],
 ["c_idp","displayName","string","person","name","Trim",.98,"approved",45],["c_idp","title","string","person","role","Trim",.96,"approved",45],["c_idp","department","string","person","team","Trim",.9,"approved",45],
 ["c_idp","userType","string","person","kind","Map value",.8,"approved",45,{Member:"human",Guest:"contractor"}],["c_idp","manager","string","person","manager","Trim",.86,"proposed",45],
 ["c_jira","status","string","user_story","state","Map value",.9,"approved",70,{"To Do":"New","In Progress":"In progress","In Review":"In review","Done":"Done"}],["c_jira","summary","string","user_story","short_description","Trim",.95,"approved",70],
 ["c_jira","storyPoints","int","user_story","story_points","As is",.78,"proposed",70],["c_jira","duedate","date","project_task","planned_finish","ISO date to date",.7,"proposed",300],
 ["c_erp","gross_amount","decimal","invoice","amount","Currency, two decimals",.94,"approved",61000],["c_erp","payment_status","string","invoice","status","Map value",.9,"approved",61000,{POSTED:"Approved",PAID:"Paid",HOLD:"On hold"}],
 ["c_erp","paid_to_date","decimal","invoice","paid_to_date","Currency, two decimals",.93,"approved",61000],["c_erp","po_number","string","invoice","po","Trim",.74,"proposed",61000],
 ["c_mcp_lumen","severity","string","alert_event","severity","Map value",.88,"proposed",30,{critical:"Critical",major:"Major",minor:"Minor",warning:"Warning"}],["c_mcp_lumen","state","string","alert_event","state","Trim",.9,"proposed",30],["c_mcp_lumen","last_seen","datetime","alert_event","last_seen","ISO date to date",.85,"proposed",30],
 ["c_lum","severity","string","alert_event","severity","Map value",.88,"approved",240,{critical:"Critical",major:"Major",minor:"Minor",warning:"Warning"}],["c_lum","state","string","alert_event","state","Trim",.9,"approved",240],
 ["c_hol","from","date","time_off","from","ISO date to date",.97,"approved",2400],["c_hol","to","date","time_off","to","ISO date to date",.97,"approved",2400],["c_hol","status","string","time_off","status","Trim",.9,"approved",2400],["c_hol","type","string","time_off","type","Trim",.9,"approved",2400],
 ["c_dir","displayName","string","person","name","Trim",.99,"approved",3000],["c_dir","title","string","person","role","Trim",.97,"approved",3000],
 ["c_cr","status","string","contract","status","Trim",.9,"proposed",80000],["c_cr","value","decimal","contract","value","Currency, two decimals",.9,"proposed",80000],["c_cr","end","date","contract","end","ISO date to date",.9,"proposed",80000],
 ["c_cod","short_description","string","feature","short_description","Trim",.95,"approved",3300],["c_cod","state","string","feature","state","Trim",.9,"approved",3300]];
const SRCX={c_graph:[["assignments","array","[{userId:'7f2c'}]"],["priority","int","5"],["bucketId","string","bkt-22"],["createdDateTime","datetime","2026-09-01T10:00:00Z"],["managerId","string","3a91-44"]],
 c_jira:[["assignee","string","avery.chen"],["labels","array","[search]"],["priority","string","High"],["sprint","string","MSF Sprint 41"]],
 c_erp:[["vendor_name","string","Northwind Leasing"],["currency","string","USD"],["gl_account","string","6120"]],
 c_idp:[["mobilePhone","string","+1 303 555 0100"],["groups","array","[PMO, All staff]"],["employeeId","string","E-4410"]],c_mcp_lumen:[["index_name","string","standards-main"],["shard","int","4"]]};
const SMP=(label,ent,rows,cur,o)=>Object.assign({label,ent,rows,cur:cur||{}},o||{});
const SAMPLES={
 c_graph:[SMP("Planner tasks","project_task",[
   {id:"PT-114",title:"Draft indexing cutover plan",startDateTime:"2026-10-12T08:00:00Z",dueDateTime:"2026-10-30T17:00:00Z",percentComplete:40},
   {id:"PT-121",title:"Vendor sign-off",startDateTime:"2026-11-03T08:00:00Z",dueDateTime:"2026-10-20T17:00:00Z",percentComplete:0},
   {id:"PT-126",title:"Migrate saved searches",startDateTime:"2026-10-19T08:00:00Z",dueDateTime:"2026-11-06T17:00:00Z",percentComplete:"n/a"},
   {id:"PT-133",title:"Update runbook",startDateTime:"2026-10-08T08:00:00Z",dueDateTime:"2026-10-09T17:00:00Z",percentComplete:100},
   {id:"PT-140",title:"Retire legacy index",startDateTime:"2026-11-09T08:00:00Z",dueDateTime:"2026-11-20T17:00:00Z",percentComplete:0}],
   {"PT-114":{planned_start:"2026-10-12",planned_finish:"2026-10-28",percent_complete:35,name:"Draft indexing cutover plan",_edit:{planned_finish:true}},"PT-133":{planned_start:"2026-10-08",planned_finish:"2026-10-09",percent_complete:100,name:"Update runbook"}}),
  SMP("Users","person",[{id:"g-1",displayName:"Avery Chen",jobTitle:"Controller",department:"Finance"},{id:"g-2",displayName:"Jordan Lee",jobTitle:"Enterprise architect",department:"Architecture"}],{"Avery Chen":{role:"Controller",team:"Finance"},"Jordan Lee":{role:"Architect",team:"Architecture"}},{nameKey:"displayName"})],
 c_idp:[SMP("SCIM users","person",[
   {id:"u-priya",displayName:"Priya Shah",title:"Project manager",department:"PMO",userType:"Member",active:true},
   {id:"u-dev",displayName:"Dev Rao",title:"Senior project manager",department:"PMO",userType:"Member",active:true},
   {id:"u-marco",displayName:"Marco Ellis",title:"Contractor, data engineer",department:"Platform",userType:"Guest",active:true},
   {id:"u-elena",displayName:"Elena Voss",title:"",department:"Standards",userType:"Member",active:true},
   {id:"u-leaver",displayName:"Casey Morgan",title:"Editor",department:"Standards",userType:"Member",active:false}],
   {"Priya Shah":{role:"Project manager",team:"PMO",kind:"human"},"Dev Rao":{role:"Project manager",team:"PMO",kind:"human"},"Marco Ellis":{role:"Contractor, data engineer",team:"Platform",kind:"contractor"}},{nameKey:"displayName"})],
 c_jira:[SMP("Jira issues","user_story",[{id:"MSF-482",summary:"Saved search filters",status:"In Review",storyPoints:5},{id:"MSF-490",summary:"Index rebuild job",status:"Waiting for QA",storyPoints:3},{id:"MSF-495",summary:"Export citations",status:"Done",storyPoints:8},{id:"MSF-501",summary:"Audit log view",status:"To Do",storyPoints:2}],
   {"MSF-482":{state:"In review",short_description:"Saved search filters"},"MSF-495":{state:"In review",short_description:"Export citations",_edit:{state:false}}})],
 c_erp:[SMP("Posted invoices","invoice",[{id:"INV-5521",gross_amount:"18,400.00",payment_status:"POSTED",paid_to_date:"0.00"},{id:"INV-5530",gross_amount:"TBD",payment_status:"POSTED",paid_to_date:"0.00"},{id:"INV-5544",gross_amount:"7,250.50",payment_status:"PAID",paid_to_date:"7,250.50"},{id:"INV-5552",gross_amount:"92,000.00",payment_status:"HOLD",paid_to_date:"0.00"}],
   {"INV-5544":{amount:7250.5,status:"Approved",paid_to_date:0}})],
 c_mcp_lumen:[SMP("Tool result: list_index_alerts","alert_event",[{id:"ALR-8821",severity:"critical",state:"open",last_seen:"2026-10-06T15:22:10Z"},{id:"ALR-8824",severity:"urgent",state:"open",last_seen:"2026-10-06T15:24:41Z"},{id:"ALR-8830",severity:"minor",state:"closed",last_seen:"2026-10-06T14:02:00Z"}],{})],
 c_lum:[SMP("Cutover alerts","alert_event",[{id:"ALR-8901",severity:"major",state:"open"},{id:"ALR-8902",severity:"warning",state:"closed"}],{"ALR-8901":{severity:"Minor",state:"open"}})],
 c_hol:[SMP("Public holidays","time_off",[{id:"HOL-1126",type:"Holiday",from:"2026-11-26",to:"2026-11-26",status:"Approved"},{id:"HOL-1225",type:"Holiday",from:"2026-12-25",to:"2026-12-25",status:"Approved"},{id:"HOL-BAD",type:"Holiday",from:"2026-13-40",to:"2026-12-31",status:"Approved"}],{})],
 c_dir:[SMP("Profile refresh","person",[{id:"d-1",displayName:"Nia Brooks",title:"Change manager"},{id:"d-2",displayName:"Sam Patel",title:"Platform engineer"}],{"Nia Brooks":{role:"Change manager"},"Sam Patel":{role:"Platform engineer "}},{nameKey:"displayName"})],
 c_cr:[SMP("Contracts","contract",[{id:"CT-2201",status:"Active",value:"240,000",end:"2027-03-31"},{id:"CT-2207",status:"Active",value:"58,500",end:"31/03/2027"}],{"CT-2201":{status:"Active",value:240000,end:"2027-03-31"}})],
 c_cod:[SMP("Editorial features","feature",[{id:"FEAT-31",short_description:"Standards export v2",state:"In progress"},{id:"FEAT-34",short_description:"Citation checker",state:"Planned"}],{"FEAT-31":{short_description:"Standards export",state:"Planned"}})],
 c_plat:[SMP("Projects read through the platform data layer","project",[{id:"PR1",name:"Project Online exit",status:"Active"},{id:"PR2",name:"Search modernization",status:"Active"},{id:"PR3",name:"Standards workflow",status:"Active"},{id:"PR4",name:"Contract analyzer",status:"Planned"}],{},{readonly:true})]};
/* ---------- subscribers and canonical events ---------- */
const SUBS=[
 {id:"s_plan",n:"Portfolio plan",pat:["project_task","project"],mode:"Push (webhook)",lag:"0.9 s",dl:0,st:"healthy"},
 {id:"s_exec",n:"Executive dashboard",pat:["project","project_task","invoice"],mode:"Push (webhook)",lag:"1.4 s",dl:0,st:"healthy"},
 {id:"s_sla",n:"Agreements and SLA engine",pat:["incident","alert_event"],mode:"Push (webhook)",lag:"0.7 s",dl:0,st:"healthy"},
 {id:"s_obs",n:"Observability correlation",pat:["alert_event","config_item"],mode:"Stream consumer",lag:"0.4 s",dl:1,st:"degraded"},
 {id:"s_fo",n:"First Officer notifications agent",pat:["*"],mode:"Stream consumer",lag:"2.1 s",dl:0,st:"healthy"},
 {id:"s_p360",n:"Person 360",pat:["person","time_off"],mode:"Pull on open",lag:"n/a",dl:0,st:"healthy"},
 {id:"s_mcp",n:"Registry MCP cache",pat:["*"],mode:"Stream consumer",lag:"1.1 s",dl:0,st:"healthy"},
 {id:"s_rbac",n:"Access control (RBAC and ABAC)",pat:["person"],mode:"Push (webhook)",lag:"0.6 s",dl:0,st:"healthy"}];
const subsFor=en=>SUBS.filter(s=>s.pat.includes("*")||s.pat.includes(en));
/* ---------- seeding ---------- */
let _nt=0;
function sync_(){const n=DATAMODEL.cnt();if(n!==_nt){_nt=n;PLAT.refresh();if(F.ready){F.proj.forEach(p=>{if(p.eval&&!p.mine){p.eval=evaluate(p);p.route=routeOf(p,p.eval);const r=F.reqs.find(x=>x.ref===p.id);if(r)r.route=p.route}})}}}
function ensure(){
 sync_();if(F.ready)return;
 F.conns=seedConns();
 F.maps=MAPSEED.map((m,i)=>({id:"MP-"+(100+i),conn:m[0],src:m[1],srcType:m[2],ent:m[3],k:m[4],tf:m[5],conf:m[6],status:m[7],lag:m[8],em:m[9]||null,ver:m[7]==="approved"?3:1,ai:m[6]<.95}));
 ["c_graph","c_idp","c_jira","c_erp","c_hol"].forEach((c,i)=>{F.mapVer[c]=[4,3,2,5,1][i]});
 const R=RNG("fab-runs"),act=F.conns.filter(c=>c.min!=="enterprise"&&c.status!=="expired");
 F.runs=[];
 for(let i=0;i<190;i++){const c=act[Math.floor(R()*act.length)];if(c.id==="c_mcp_reg")continue;const mins=3+i*14+Math.floor(R()*9);const mode=c.lag<=300?"Real-time":"Batch";
  const read=c.id==="c_plat"?1+Math.floor(R()*3):Math.floor(20+R()*(c.lag>5000?2400:300));const q=R()<.22?1+Math.floor(R()*4):0;const failed=R()<.025;
  const loaded=failed?0:Math.max(0,Math.round((read-q)*(.3+R()*.5)));
  F.runs.push({id:"RUN-"+(4900-i),conn:c.id,mode,at:tsAgo(mins),min:mins,dur:Math.round((mode==="Real-time"?2+R()*6:20+R()*160)),read,valid:failed?0:read-q,quar:failed?0:q,loaded,held:failed?0:(R()<.1?1:0),events:loaded,status:failed?"failed":q?"partial":"ok",env:c.env==="Sandbox"?"Sandbox":"Production",retries:failed?3:R()<.06?1:0,
   err:failed?(R()<.5?"HTTP 429 from source after 3 retries; backoff exceeded":"401: token expired, secret rotation is due"):"",idem:"idem-"+(hs(c.id+i)*7919).toString(16),kind:"scheduled"})}
 F.seq.run=4900;
 const Q=(c,en,rec,k,val,why,mins,att)=>({id:"Q-"+(F.seq.q++),conn:c,ent:en,rec,k,val:val,reason:why,at:tsAgo(mins),status:"open",attempts:att||0,run:"RUN-"+(4890-Math.floor(mins/14)),raw:null});
 F.quar=[Q("c_graph","project_task","PT-121","planned_finish","2026-10-20","Finish is before start (start 2026-11-03)",95),
  Q("c_graph","project_task","PT-126","percent_complete","n/a","Percent complete must be a number from 0 to 100",95),
  Q("c_idp","person","Elena Voss","role","","Role is required and arrived empty",40),
  Q("c_jira","user_story","MSF-490","state","Waiting for QA","No mapping for Jira status 'Waiting for QA'",120,1),
  Q("c_erp","invoice","INV-5530","amount","TBD","Amount is not a number",600,2),
  Q("c_hol","time_off","HOL-BAD","from","2026-13-40","Not a valid date",1500,3),
  Q("c_idp","person","Sam Reyes","team","","Team does not exist in the directory",200),
  Q("c_jira","user_story","MSF-471","short_description","","Summary is required and arrived empty",260)];
 F.quar[5].status="dead";F.quar[0].ctx={planned_start:"2026-11-03"};
 F.recon=[
  ["project_task","PT-114","Draft indexing cutover plan","planned_finish","Oct 28","Oct 30","c_graph",480],["project_task","PT-087","Pilot sign-off","planned_start","Oct 14","Oct 19","c_jira",1300],
  ["project_task","PT-092","Content freeze","planned_finish","Nov 6","Nov 4","c_graph",1900],["user_story","MSF-482","Saved search filters","state","In progress","In review","c_jira",75],
  ["user_story","MSF-466","Export citations","state","In review","Done","c_jira",2600],["project_task","PT-101","Index backfill","percent_complete","60","75","c_graph",3100],
  ["project_task","PT-110","Training materials","planned_finish","Nov 13","Nov 20","c_graph",4300],["user_story","MSF-459","Audit log view","state","New","In progress","c_jira",5000],
  ["project_task","PT-075","Security review","planned_start","Oct 8","Oct 7","c_graph",300]
  ].map((r,i)=>({id:"REC-"+(200+i),ent:r[0],rec:r[1],label:r[2],k:r[3],plat:r[4],ext:r[5],conn:r[6],at:tsAgo(r[7]),min:r[7],status:i===4?"resolved":i===2?"wi":"open",wi:i===2?"WI-1298":null,how:i===4?"Took the Jira value":""}));
 F.wi=[{id:"WI-1298",t:"Reconcile Content freeze finish date",sub:"REC-202 on project_task",who:"Priya Shah",due:"Oct 9",st:"open",ref:"REC-202"},
  {id:"WI-1299",t:"Decommission Project Online export bridge",sub:"Expired Sept 30; revoke secret, remove mappings, archive runs",who:"Priya Shah",due:"Oct 13",st:"open",ref:"c_pol"}];
 F.seq.wi=1300;
 const P=(id,t,pur,sys,ents,fields,dir,vol,own,risk,by,ctype,stage,days,extra)=>Object.assign({id,t,purpose:pur,systems:sys,ents,fields,dir,vol,owner:own,risk,by,ctype,stage,created:days,len:"ongoing",eval:null,route:null,outcome:null},extra||{});
 F.proj=[P("M2M-01","Posted lease invoices into invoice records","Keep invoice amount, status and paid-to-date in step with the lease subledger so the budget screens stop retyping them.",["Lease subledger (ERP)"],["invoice"],"amount, status, paid_to_date","In",1200,"Avery Chen","Medium","Avery Chen","Generic REST","certified",40,{conn:"c_erp",outcome:{kind:"certified",days:6,at:dayS(-34),by:"Platform team and security",reasons:"Contract fit passed; sandbox 99% clean."}}),
  P("M2M-02","Standards Platform release export","Temporary feed of editorial features while the workflow moves to "+BRAND.name+".",["Standards Platform"],["feature"],"short_description, state","In",90,"Chief Editor","Low","Chief Editor","Generic REST","project",70,{len:"temporary",conn:"c_cod",outcome:{kind:"project",days:3,at:dayS(-14),by:"Auto-approved by rules",expiry:isoDay(55),reasons:"Needed for PR3 only; decommission at expiry."}}),
  P("M2M-03","Lumen alerts into alert events","Bring index alerts into the correlation engine.",["Lumen search service"],["alert_event"],"severity, state, last_seen","In",2400,"Tom Becker","Medium","Tom Becker","MCP","evaluating",8,{conn:"c_mcp_lumen"}),
  P("M2M-04","Leave balances from the HR system","Show leave balances in Person 360 and capacity planning.",["HR system"],["time_off","person"],"from, to, status, hours","In",300,"Rina Okafor","High","Maya Ortiz","Generic REST","proposed",3),
  P("M2M-05","Intune compliance into assets","Know which laptops are compliant without opening Intune.",["Microsoft Intune via Graph"],["asset"],"intune_compliant, lifecycle","In",600,"Sam Patel","Medium","Sam Patel","Microsoft Graph","awaiting",12),
  P("M2M-06","Survey scores into experience responses","Pull member satisfaction scores from a survey tool.",["Survey tool"],["xla_response"],"score, dimension","In",150,"Maya Ortiz","Low","Maya Ortiz","Generic REST","rejected",25,{dup:"Experience response already receives survey scores from the service desk survey, so a second feed would duplicate it",outcome:{kind:"rejected",days:7,at:dayS(-18),by:"Platform team and security",reasons:"Duplicates the experience response entity fed by the service desk survey; reuse the existing entity and add a connector mapping instead of a new feed."}}),
  P("M2M-07","Publish project dates to a board report","Send approved project finish dates to the board's reporting workbook.",["Board workbook (SharePoint)"],["project"],"finish, status, percent_complete","Out",40,"Maya Ortiz","Medium","Maya Ortiz","Microsoft Graph","awaiting",5)];
 F.proj.forEach(p=>{if(["evaluating","awaiting","certified","project","rejected"].includes(p.stage)){p.eval=evaluate(p);p.route=routeOf(p,p.eval)}});
 F.reqs=[];F.proj.forEach(p=>{if(p.route)F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"M2M project",ref:p.id,t:p.t,route:p.route,state:p.stage==="awaiting"?"Waiting":p.stage==="evaluating"?"Evaluating":"Decided",at:p.created})});
 F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"Certify connector",ref:"c_mcp_lumen",t:"Promote the Lumen search MCP server to certified",route:{k:"std",n:"Platform team and security",sla:"3 days",why:"Medium risk, internal data, certified connector type"},state:"Waiting",at:6});
 const RE=RNG("fab-ev"),ap=F.maps.filter(m=>m.status==="approved"&&m.conn!=="c_pol");F.events=[];
 for(let i=0;i<340;i++){const m=ap[Math.floor(RE()*ap.length)],mins=2+i*6+Math.floor(RE()*5);F.events.push(mkEvent(m.ent,m.k,["PT-114","PT-133","MSF-482","INV-5544","Priya Shah","Dev Rao","ALR-8821","FEAT-31"][Math.floor(RE()*8)],"v"+Math.floor(RE()*90),"v"+Math.floor(RE()*90),m.conn,mins))}
 F.ready=true;
}
function mkEvent(en,k,rec,old,nw,conn,mins,type){const c=F.conns.find(x=>x.id===conn);return{id:"EVT-"+(F.seq.ev++),type:type||en+"."+k+".changed",ent:en,k,rec,old,nw,conn,at:tsAgo(mins||0),min:mins||0,path:c&&c.lag<=300?"stream":"batch",subs:subsFor(en).map(s=>s.n),run:"RUN-"+(4900-Math.floor((mins||0)/14)),schema:"1.3"}}
/* ---------- validation, authority, run engine ---------- */
function coerce(en,k,v,m){const t=ftype(en,k),s=v==null?"":String(v).trim();
 if(m&&m.em){if(!(s in m.em))return{ok:false,why:"No mapping for "+(m.src||"value")+" '"+s+"'"};return{ok:true,val:m.em[s]}}
 if(t==="date"||t==="datetime"){const d=s.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||isNaN(Date.parse(d)))return{ok:false,why:"Not a valid date"};const dt=new Date(d+"T00:00:00Z");if(dt.toISOString().slice(0,10)!==d)return{ok:false,why:"Not a valid date"};return{ok:true,val:d}}
 if(t==="percent"){if(s===""||isNaN(+s)||+s<0||+s>100)return{ok:false,why:"Percent complete must be a number from 0 to 100"};return{ok:true,val:+s}}
 if(t==="currency"||t==="money"||t==="number"){const n=+(s.replace(/,/g,""));if(s===""||isNaN(n))return{ok:false,why:flabel(en,k)+" is not a number"};return{ok:true,val:t==="number"?n:Math.round(n*100)/100}}
 if(t==="boolean")return/^(true|false)$/i.test(s)?{ok:true,val:/^true$/i.test(s)}:{ok:false,why:"Must be true or false"};
 if(s==="")return{ok:false,why:flabel(en,k)+" is required and arrived empty"};
 return{ok:true,val:s}}
function pairRule(en,t){if(en==="project_task"&&t.planned_start&&t.planned_finish&&t.planned_finish<t.planned_start)return{k:"planned_finish",why:"Finish is before start (start "+t.planned_start+")"};
 if(en==="project"&&t.start&&t.finish&&t.finish<t.start)return{k:"finish",why:"Finish is before start"};return null}
const same=(a,b)=>String(a).trim()===String(b).trim();
function pipeline(connId,sandbox,onlyApproved){
 const c=CONNS().find(x=>x.id===connId),sets=SAMPLES[connId]||[],out={rows:[],read:0,quar:[],events:[],recon:[],loaded:0,held:0,kept:0,same:0,notes:[]};
 sets.forEach(sm=>{const maps=MAPS().filter(m=>m.conn===connId&&m.ent===sm.ent&&m.status!=="rejected"&&(onlyApproved?m.status==="approved":true));
  sm.rows.forEach(row=>{out.read++;const rid=sm.nameKey?row[sm.nameKey]:row.id,cur=(sm.cur||{})[rid]||null,tgt={},errs=[];
   if(row.active===false){out.events.push({ent:sm.ent,k:"lifecycle",rec:rid,old:"active",nw:"leaver",type:"person.lifecycle.leaver"});out.notes.push(rid+": SCIM reports the account disabled, so a leaver event revokes access in RBAC and ABAC.")}
   maps.forEach(m=>{if(!(m.src in row))return;const r=coerce(m.ent,m.k,row[m.src],m);if(!r.ok)errs.push({k:m.k,val:row[m.src],why:r.why,src:m.src});else tgt[m.k]=r.val});
   const pr=errs.length?null:pairRule(sm.ent,tgt);if(pr)errs.push({k:pr.k,val:tgt[pr.k],why:pr.why});
   if(errs.length){out.quar.push({ent:sm.ent,rec:rid,k:errs[0].k,val:errs[0].val,reason:errs[0].why,row,ctx:Object.assign({},tgt)});out.rows.push({rec:rid,ent:sm.ent,res:"Quarantined",why:errs[0].why});return}
   const res=[];Object.keys(tgt).forEach(k=>{const mt=eff(sm.ent,k),cv=cur&&k in cur?cur[k]:undefined,nv=tgt[k];
    if(sm.readonly){res.push([k,"Read only",nv]);return}
    if(cv!==undefined&&same(cv,nv)){out.same++;res.push([k,"Unchanged",nv]);return}
    if(mt.auth==="platform"){out.kept++;res.push([k,"Platform wins, kept "+cv,nv]);return}
    if(mt.auth==="shared"&&cv!==undefined&&cur._edit&&cur._edit[k]){out.held++;out.recon.push({ent:sm.ent,rec:rid,k,plat:cv,ext:nv,label:row.title||row.summary||rid});res.push([k,"Held for reconciliation",nv]);return}
    out.loaded++;out.events.push({ent:sm.ent,k,rec:rid,old:cv===undefined?"(none)":cv,nw:nv});res.push([k,"Loaded",nv])});
   out.rows.push({rec:rid,ent:sm.ent,res:"Processed",fields:res})})});
 return out}
/* ---------- M2M evaluation and approval routing ---------- */
function pfields(p){const toks=(p.fields||"").split(/[,;]+/).map(s=>s.trim()).filter(Boolean);return toks.map(t=>{let hit=null;p.ents.forEach(en=>{const e=ent_(en);if(!e||hit)return;const f=e.fields.find(f=>f.k===t||f.label.toLowerCase()===t.toLowerCase());if(f)hit={ent:en,k:f.k}});return{tok:t,hit}})}
const activeConns=()=>CONNS().filter(c=>c.kind!=="roadmap"&&c.status!=="expired");
function evaluate(p){
 const pf=pfields(p),unknown=pf.filter(x=>!x.hit),metas=pf.filter(x=>x.hit).map(x=>Object.assign({ent:x.hit.ent,k:x.hit.k},eff(x.hit.ent,x.hit.k)));
 const missEnt=p.ents.filter(e=>!ent_(e)),conflict=p.dir==="Out"?metas.filter(m=>m.auth==="external"):metas.filter(m=>m.auth==="platform");
 const sens=metas.filter(m=>m.cls==="personal"||m.cls==="restricted"),conf=metas.filter(m=>m.cls==="confidential");
 const ck=[];
 ck.push(unknown.length||missEnt.length?{k:"contract",n:"Contract fit against the registry",st:"fail",d:(unknown.length?unknown.length+" field"+(unknown.length>1?"s":"")+" not in the registry ("+unknown.map(u=>u.tok).join(", ")+"). Propose them in the registry first. ":"")+(missEnt.length?"Unknown entity: "+missEnt.join(", ")+".":"")}
  :conflict.length?{k:"contract",n:"Contract fit against the registry",st:"warn",d:"All "+metas.length+" fields exist. "+conflict.length+" field"+(conflict.length>1?"s":"")+" ("+conflict.slice(0,3).map(m=>m.k).join(", ")+") "+(p.dir==="Out"?"are owned by an external system, so the push would be ignored":"are owned by "+BRAND.name+", so the feed would be a suggestion, not an overwrite")+". Change authority or direction."}
  :{k:"contract",n:"Contract fit against the registry",st:"pass",d:"All "+metas.length+" fields exist and the direction matches their declared authority."});
 ck.push(p.dir!=="In"&&sens.length?{k:"security",n:"Security review",st:"fail",d:"Restricted or personal fields ("+sens.map(m=>m.k).join(", ")+") may not be pushed to an external system without a data council exception."}
  :sens.length?{k:"security",n:"Security review",st:"warn",d:sens.length+" restricted or personal field"+(sens.length>1?"s":"")+": masking rules, a per-connector service identity and a data council decision are required."}
  :conf.length?{k:"security",n:"Security review",st:"warn",d:conf.length+" confidential field"+(conf.length>1?"s":"")+": ABAC masking applies to non-owners. Secret held as a vault reference; least-privilege scopes only."}
  :{k:"security",n:"Security review",st:"pass",d:"Internal data only. Secret held as a vault reference, per-connector service identity, read scopes only, audit on every run."});
 const rate=97+(hs(p.id)%4)-(unknown.length?7:0)-(p.ctype==="Other (custom code)"?5:0);
 ck.push({k:"sandbox",n:"Sandbox sample test",st:rate>=95?"pass":"fail",d:"A 200 record sample ran in the sandbox: "+rate+"% passed validation"+(rate>=95?" (the bar is 95%).":", below the 95% bar. Failures are listed in quarantine for the sandbox run.")});
 const runsMo=Math.ceil(p.vol/(p.len==="temporary"?250:500))*30,left=ED[F.edition].runs-F.usage,slots=ED[F.edition].conn-activeConns().length;
 ck.push({k:"cost",n:"Cost estimate",st:slots<=0?"warn":"pass",d:"About "+runsMo.toLocaleString()+" runs a month ("+p.vol.toLocaleString()+" records a day) and one connector slot. "+(slots<=0?"No slot is free in the "+ED[F.edition].n+" edition; approval needs a larger license.":slots+" slot"+(slots>1?"s":"")+" free and "+left.toLocaleString()+" runs left this month.")+" Estimated run cost $"+Math.max(8,Math.round(runsMo*0.011))+" a month."});
 const rc=(window.PLAT&&PLAT.reuseCheck?PLAT.reuseCheck(p.t,p.fields+" "+p.purpose):[]).filter(h=>h.kind==="existing"&&h.sc>=.5&&!p.ents.includes(h.id)).slice(0,2);
 const same_=activeConns().filter(c=>c.id!==p.conn&&c.fromProject!==p.id&&c.ents.some(e=>p.ents.includes(e))&&p.systems.some(s=>c.sys.toLowerCase().split(/[^a-z0-9]+/).some(w=>w.length>3&&s.toLowerCase().includes(w))));
 const over=activeConns().filter(c=>c.id!==p.conn&&c.fromProject!==p.id&&c.ents.some(e=>p.ents.includes(e)));
 ck.push(p.dup?{k:"dup",n:"Duplicate check",st:"fail",d:p.dup+"."}:same_.length?{k:"dup",n:"Duplicate check",st:"fail",d:same_[0].name+" already connects to this system and feeds "+p.ents.join(", ")+". Extend it instead of building another."}
  :over.length||rc.length?{k:"dup",n:"Duplicate check",st:"warn",d:(over.length?over.map(c=>c.name).join(", ")+" already feed"+(over.length>1?"":"s")+" the same entity from another system. Precedence rules are needed. ":"")+(rc.length?"Registry reuse check also matches "+rc.map(h=>h.label+" ("+Math.round(h.sc*100)+"%)").join(", ")+".":"")}
  :{k:"dup",n:"Duplicate check",st:"pass",d:"No existing connector feeds these entities from this system, and the registry reuse check found no close match."});
 const fails=ck.filter(c=>c.st==="fail").length;
 return{checks:ck,at:dayS(0),rec:fails?"Reject":p.len==="temporary"?"Approve project-scoped":"Approve certified",fails,warns:ck.filter(c=>c.st==="warn").length,sens:sens.length,cls:metas.reduce((m,x)=>PLAT.CLS_ORDER.indexOf(x.cls)>PLAT.CLS_ORDER.indexOf(m)?x.cls:m,"public")}}
function routeOf(p,ev){
 const certType=["Generic REST","MCP","Identity provider","Microsoft Graph"].includes(p.ctype),pi=["public","internal"].includes(ev.cls);
 if(ev.fails)return{k:"std",n:"Platform team and security",who:"Platform team and security",sla:"3 days",why:"A failed check always needs a person, whatever the risk."};
 if(p.risk==="High"||ev.sens)return{k:"council",n:"Data council",who:"Data council",sla:"5 days",why:(p.risk==="High"?"High risk":"Sensitive data ("+ev.cls+")")+" goes to the data council."};
 if(p.risk==="Low"&&p.dir==="In"&&pi&&certType)return{k:"auto",n:"Auto-approve",who:"Rules engine",sla:"Instant",why:"Low risk, read-only, internal data, certified connector type."};
 return{k:"std",n:"Platform team and security",who:"Platform team and security",sla:"3 days",why:"Standard risk: "+(p.risk!=="Low"?p.risk.toLowerCase()+" risk":p.dir!=="In"?"writes to an external system":!pi?"data class "+ev.cls:"custom connector type")+"."}}
const ROUTES=[["auto","Auto-approve","Low risk AND read-only AND internal or public data AND a certified connector type (REST, MCP, identity, Graph) AND no failed check.","--good-f"],["std","Platform team plus security","Anything that is not low risk, or writes outward, or uses confidential data, or has a failed check.","--info-f"],["council","Data council","High risk, or any restricted or personal data. Five business days.","--warn-f"]];
const routePill=r=>pill(r.n,r.k==="auto"?"good":r.k==="council"?"warn":"info");
const CTYPES=["Generic REST","MCP","Identity provider","Microsoft Graph","Other (custom code)"];
function mkConnFromProject(p,kind,expiry){
 const id="c_"+p.id.toLowerCase().replace(/-/g,"");const k={"Generic REST":"rest",MCP:"mcp","Identity provider":"idp","Microsoft Graph":"graph"}[p.ctype]||"rest";
 const c={id,name:p.t,kind:k,tier:kind==="certified"?"certified":"project",status:"new",owner:p.owner,min:"fabric",env:"Production",ents:p.ents.slice(),canStream:false,lag:3600,sys:p.systems.join(", "),risk:p.risk,desc:p.purpose,auth:A(["read"],"Set at go-live","pending","vault://meridian-prod/fabric/"+p.id.toLowerCase()+" (created at go-live)","svc-fabric-"+p.id.toLowerCase()),expiry:expiry||undefined,fromProject:p.id};
 CONNS().splice(CONNS().findIndex(x=>x.kind==="roadmap"),0,c);
 pfields(p).filter(x=>x.hit).forEach(x=>MAPS().push({id:"MP-"+(100+MAPS().length),conn:id,src:x.tok,srcType:"string",ent:x.hit.ent,k:x.hit.k,tf:"As is",conf:.82,status:"proposed",lag:3600,em:null,ver:1,ai:true}));
 return c}
function decide(p,kind,expiry,reasons){
 if(kind!=="rejected"&&activeConns().length>=ED[F.edition].conn){toast("No free connector slot in the "+ED[F.edition].n+" edition","warn");unlockDrawer("The "+ED[F.edition].n+" edition allows "+ED[F.edition].conn+" connectors and all are in use.");return false}
 p.stage=kind;const days=Math.max(1,p.created?Math.round(p.created/2):3);p.outcome={kind,at:dayS(0),by:p.route?p.route.n:"Platform team",days:Math.min(days,12),expiry:expiry||"",reasons:reasons||""};
 if(kind!=="rejected"){const c=mkConnFromProject(p,kind,expiry);p.conn=c.id;audit("Data layer connector approved",p.id+" as "+(kind==="certified"?"certified":"project-scoped until "+expiry));toast(kind==="certified"?"Approved as certified: "+c.name:"Approved, project-scoped until "+expiry,"good")}
 else{audit("Data layer M2M project rejected",p.id+": "+(reasons||"").slice(0,80));toast("Rejected with reasons recorded","warn")}
 const rq=F.reqs.find(r=>r.ref===p.id);if(rq)rq.state="Decided";return true}
function expireConn(c){c.status="expired";c.lag=0;if(!WIS().find(w=>w.ref===c.id)){WIS().unshift({id:"WI-"+(F.seq.wi++),t:"Decommission "+c.name,sub:"Expired "+c.expiry+"; revoke the secret, remove mappings, archive runs",who:c.owner,due:dayS(7).slice(0,6),st:"open",ref:c.id})}
 audit("Data layer connector expired",c.name+": decommission task created")}
function sweepExpiry(){CONNS().forEach(c=>{if(c.tier==="project"&&c.expiry&&c.status!=="expired"){if(c.expiry<=isoDay(0))expireConn(c);else{const d=Math.round((Date.parse(c.expiry)-Date.parse(isoDay(0)))/86400000);if(d<=30&&c.status==="healthy")c.status="expiring"}}})}
/* ---------- derived numbers, metrics ---------- */
const conn=id=>CONNS().find(c=>c.id===id);
const EDO={core:0,fabric:1,enterprise:2};
const allowed=c=>EDO[F.edition]>=EDO[c.min]&&c.min!=="enterprise";
const live=c=>c&&c.kind!=="roadmap"&&c.status!=="expired";
const apprMaps=()=>MAPS().filter(m=>m.status==="approved"&&live(conn(m.conn)));
const fedCount=id=>new Set(MAPS().filter(m=>m.conn===id&&m.status==="approved").map(m=>m.ent+"."+m.k)).size;
function slaStats(){const a=apprMaps().filter(m=>eff(m.ent,m.k).auth!=="platform");let ok=0;const miss=[];a.forEach(m=>{const t=FR[eff(m.ent,m.k).fresh].s,lg=m.lag==null?conn(m.conn).lag:m.lag;if(lg<=t)ok++;else miss.push({m,t,lg})});return{n:a.length,ok,pct:a.length?Math.round(100*ok/a.length):100,miss}}
function covStats(){const es=new Set();activeConns().filter(c=>c.min!=="core").forEach(c=>c.ents.forEach(e=>es.add(e)));let tot=0,cov=0;const cv=new Set(apprMaps().map(m=>m.ent+"."+m.k));
 PLAT.fieldsAll().forEach(f=>{if(!es.has(f.ent))return;const m=eff(f.ent,f.k);if(m.auth==="platform")return;tot++;if(cv.has(f.ent+"."+f.k))cov++});return{tot,cov,pct:tot?Math.round(100*cov/tot):100}}
const qOpen=()=>F.quar.filter(q=>q.status==="open");
const rOpen=()=>F.recon.filter(r=>r.status!=="resolved");
function cycle(){const d=F.proj.filter(p=>p.outcome&&p.outcome.days);return d.length?Math.round(10*d.reduce((a,p)=>a+p.outcome.days,0)/d.length)/10:0}
Object.assign(METRICS,{
 m_fab_fresh:{n:"Data layer freshness SLA met",f:"Mapped fields whose observed sync lag is within their freshness target ÷ all approved mapped fields × 100",u:"%",cur:90,tgt:95,badAt:85,dir:"max",max:100,tr:[96,95,95,94,93,92,91,90],owner:"Platform team",use:["Integration fabric","Field authority"],rem:{kind:"agent",ref:"AG-FAB1",title:"Move a polled field to the event stream, or relax its target",agent:"Integration Agent",auto:false,state:"idle",prog:"Compares each field's target with the connector's real lag and proposes the cheaper fix"}},
 m_fab_quar:{n:"Quarantine backlog",f:"Records in quarantine waiting for a fix or replay (dead letters not counted)",u:"",cur:7,tgt:5,badAt:15,dir:"min",max:30,tr:[3,4,6,5,8,9,8,7],owner:"Data stewards",use:["Integration fabric","Runs and quarantine"],rem:{kind:"sop",ref:"SOP-742",title:"Fix and replay a quarantined record",agent:"Integration Agent",auto:false,state:"idle",prog:"Suggests the corrected value and replays when the steward approves"}},
 m_fab_cov:{n:"Field mapping coverage",f:"External and shared fields, in entities that have a connector, with an approved mapping ÷ all such fields × 100",u:"%",cur:40,tgt:70,badAt:40,dir:"max",max:100,tr:[22,26,29,31,34,36,38,40],owner:"Platform team",use:["Integration fabric","Mapping studio"],rem:{kind:"agent",ref:"AG-FAB2",title:"Propose mappings for uncovered fields",agent:"Integration Agent",auto:false,state:"idle",prog:"Proposes source to target mappings with confidence for human approval"}},
 m_fab_m2m:{n:"M2M evaluation cycle time",f:"Σ(decision date − proposal date) ÷ decided machine-to-machine projects",u:"d",cur:5.3,tgt:5,badAt:10,dir:"min",max:15,tr:[9,8,8,7,6,6,5.5,5.3],owner:"Platform team",use:["Integration fabric","M2M projects"],rem:{kind:"sop",ref:"SOP-743",title:"Triage a machine-to-machine proposal",agent:"Integration Agent",auto:false,state:"idle",prog:"Runs the five checks the moment a project is proposed"}},
 m_fab_recon:{n:"Open reconciliation differences",f:"Differences between "+BRAND.name+" and an external value on shared fields that no one has resolved",u:"",cur:8,tgt:5,badAt:15,dir:"min",max:30,tr:[2,3,5,4,6,7,8,8],owner:"Field stewards",use:["Integration fabric","Reconciliation"],rem:{kind:"kb",ref:"KB0743",title:"Choosing which side wins on a shared field",agent:"Integration Agent",auto:false,state:"idle",prog:"Drafts a recommendation using trust score and who edited last"}}});
function syncMetrics(){const s=slaStats(),c=covStats();METRICS.m_fab_fresh.cur=s.pct;METRICS.m_fab_quar.cur=qOpen().length;METRICS.m_fab_cov.cur=c.pct;METRICS.m_fab_m2m.cur=cycle();METRICS.m_fab_recon.cur=rOpen().length}
/* ---------- sample runs ---------- */
function newRun(c,o){F.seq.run++;const r=Object.assign({id:"RUN-"+F.seq.run,conn:c.id,mode:c.lag<=300?"Real-time":"Batch",at:tsAgo(0),min:0,dur:2+(hs(c.id+F.seq.run)%9),read:0,valid:0,quar:0,loaded:0,held:0,kept:0,same:0,events:0,status:"ok",env:c.env==="Sandbox"?"Sandbox":"Production",retries:0,err:"",idem:"idem-"+(hs(c.id+F.seq.run)*7919).toString(16),kind:"sample"},o);RUNS().unshift(r);return r}
function runSample(id){
 const c=conn(id);if(!c)return;
 if(!allowed(c)){unlockDrawer("Running "+c.name+" is part of the Integration edition. The Base edition runs only the built-in jobs.");return}
 if(c.status==="expired"){toast("This connector expired. It cannot run; follow its decommission task.","bad");return}
 if(c.id==="c_mcp_reg"){const run=newRun(c,{mode:"Request",read:1,valid:1,loaded:0,events:0,kind:"mcp call"});F.usage++;F.lastSample[id]={expose:true,run:run.id,at:run.at};audit("Data layer MCP sample call","registry.get_entity project_task by Planning Agent");toast("Sample call served with masking applied","good");connDrawer(id);render();return}
 if(!SAMPLES[id]){toast("No sample dataset yet. The owner adds one in the sandbox step.","warn");return}
 const sandbox=c.tier==="community"||c.env==="Sandbox",r=pipeline(id,sandbox,!sandbox);
 const run=newRun(c,{read:r.read,valid:r.read-r.quar.length,quar:r.quar.length,loaded:sandbox?0:r.loaded,held:sandbox?0:r.held,kept:r.kept,same:r.same,events:sandbox?0:r.events.length,status:r.quar.length?"partial":"ok",wouldLoad:sandbox?r.loaded:0});
 F.usage++;
 if(!sandbox){r.quar.forEach(q=>{F.quar=F.quar.filter(x=>!(x.rec===q.rec&&x.k===q.k&&x.conn===id&&x.status==="open"));F.quar.unshift({id:"Q-"+(F.seq.q++),conn:id,ent:q.ent,rec:q.rec,k:q.k,val:q.val==null?"":String(q.val),reason:q.reason,at:tsAgo(0),status:"open",attempts:0,run:run.id,raw:q.row,ctx:q.ctx})});
  r.recon.forEach(x=>{if(!F.recon.find(y=>y.ent===x.ent&&y.rec===x.rec&&y.k===x.k&&y.status!=="resolved"))F.recon.unshift({id:"REC-"+(F.seq.rec++),ent:x.ent,rec:x.rec,label:x.label,k:x.k,plat:String(x.plat),ext:String(x.ext),conn:id,at:tsAgo(0),min:0,status:"open",wi:null,how:""})});
  r.events.forEach(e=>FEVTS().unshift(mkEvent(e.ent,e.k,e.rec,String(e.old),String(e.nw),id,0,e.type)))}
 F.lastSample[id]={run:run.id,sandbox,r:{read:r.read,quar:r.quar.length,loaded:r.loaded,held:r.held,kept:r.kept,same:r.same,events:r.events.length,rows:r.rows,notes:r.notes},at:run.at,unused:MAPS().filter(m=>m.conn===id&&(sandbox?m.status==="rejected":m.status!=="approved")).length};
 audit("Data layer sample run",c.name+": read "+r.read+", quarantined "+r.quar.length+", "+(sandbox?"sandbox, nothing written":"loaded "+r.loaded));
 toast(sandbox?"Sandbox run finished, nothing was written":"Run finished: "+r.loaded+" loaded, "+r.quar.length+" quarantined","good");
 connDrawer(id);render()}
function lineage(r){const merged=r.loaded+r.held+(r.kept||0)+(r.same||0);return[
 ["Extract","--p4",r.read+" records read"+(r.mode==="Real-time"?" from the event stream":r.mode==="Request"?" by a request":" in a batch")],
 ["Validate against contract","--good-f",r.valid+" passed, "+r.quar+" to quarantine"],
 ["Transform","--accent",r.valid+" mapped to registry fields"],
 ["Match and merge","--warn-f",merged+" field changes checked: "+r.loaded+" load, "+r.held+" held for reconciliation"+(r.kept?", "+r.kept+" kept by platform authority":"")],
 ["Load","--good-f",r.env==="Sandbox"?"Sandbox: nothing written (would load "+(r.wouldLoad||0)+")":r.loaded+" written, each with an idempotency key"],
 ["Publish change event","--accent",(r.events||0)+" canonical events sent to subscribers"]]}
/* ---------- shared UI helpers ---------- */
const goTab=i=>{S.v.fab=i;render()};
const own_=n=>typeof pchip==="function"?pchip(n):E(n);
const isCore=()=>F.edition==="core";
const meter=(label,used,limit,txt)=>{const p=Math.min(100,Math.round(100*used/limit)),c=used>limit?"bad":p>=80?"warn":"good";return `<div class="fab-mt"><div class="fab-mt-h"><span>${E(label)}</span><b>${E(txt||used.toLocaleString()+" of "+limit.toLocaleString())}</b></div><div class="fab-track" role="img" aria-label="${E(label)} ${p} percent used"><i class="${c}" style="width:${used>limit?100:p}%"></i></div></div>`};
const prevBanner=()=>isCore()?`<div class="fab-prev glass" role="note"><div><b>Preview with seeded sample data.</b> <span class="muted">You are on the free Base edition. Everything below is what the platform data layer does once a license is in place; actions that change anything ask you to unlock it first.</span></div><button class="btn primary" data-fab-unlock>Unlock the Integration edition</button></div>`:"";
const maskKey=k=>k?k.slice(0,4)+"-••••-"+k.slice(-4):"None";
function unlockDrawer(why){
 const cols=["core","fabric","enterprise"],row=(l,f)=>`<tr><th scope="row">${l}</th>${cols.map(c=>`<td>${f(ED[c],c)}</td>`).join("")}</tr>`;
 openDrawer(`<div class="eyebrow">Platform data layer</div><h2 style="margin:4px 0">Unlock the Integration edition</h2><div class="story">${E(why||"The platform data layer feeds any registry field from external systems and orchestrates the data between them. It is built into the platform; a license key switches the external parts on.")}</div>
 <p class="muted small">Edition names and prices are placeholders while packaging is decided.</p>
 <div class="tscroll"><table class="fab-ed"><thead><tr><th></th>${cols.map(c=>`<th>${ED[c].n}${F.edition===c?` ${pill("Current","good")}`:""}</th>`).join("")}</tr></thead><tbody>
 ${row("Connectors",e=>e.conn)}${row("Runs a month",e=>e.runs.toLocaleString())}${row("Environments",e=>e.env)}
 ${row("External connectors",(e,c)=>c==="core"?"Locked":"Included")}${row("Mapping studio",(e,c)=>c==="core"?"Preview":"Included")}${row("Orchestration and event bus",(e,c)=>c==="core"?"Preview":"Included")}${row("Reconciliation",(e,c)=>c==="core"?"Preview":"Included")}${row("Machine-to-machine projects",(e,c)=>c==="core"?"Preview":"Included")}
 ${row("Built-in sync jobs",()=>"Included")}${row("Packaging",e=>E(e.tag))}</tbody></table></div>
 <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn primary" data-fab-key>Enter a license key</button><button class="btn quiet" onclick="closeDrawer()">Keep browsing the preview</button></div>
 <h3>Demo switch</h3><p class="muted small">Flip the edition to see each state without a key.</p><div class="row" style="gap:6px;flex-wrap:wrap">${cols.map(c=>`<button class="chip ${F.edition===c?"on":""}" data-fab-ed="${c}">${ED[c].n}</button>`).join("")}</div>`)}
function keyForm(){openForm({id:"fab_key",title:"Enter a license key",story:"Keys start with FAB-. A key containing ENT unlocks Enterprise integration; any other valid key unlocks Integration. The key is stored as a masked reference and every use is audited.",submit:"Apply key",
 fields:[{k:"key",label:"License key",type:"text",req:true,ph:"FAB-XXXX-XXXX-XXXX",help:"Issued by your account team."}],
 live:v=>{const k=(v.key||"").trim().toUpperCase();return `<div class="story"><b>Check:</b> ${!k?"Waiting for a key.":/^FAB-/.test(k)?"Valid format. Edition would be "+(k.includes("ENT")?ED.enterprise.n:ED.fabric.n)+".":"Keys start with FAB-."}</div>`},
 onSubmit:v=>{const k=(v.key||"").trim().toUpperCase();if(!/^FAB-/.test(k)){toast("That key does not start with FAB-","bad");return}
  F.key=k;F.edition=k.includes("ENT")?"enterprise":"fabric";audit("Data layer license applied",ED[F.edition].n+" with key "+maskKey(k));toast(ED[F.edition].n+" is on","good");closeDrawer();render()}})}
/* ---------- connector drawer ---------- */
const REST_CFG={c_jira:{spec:"jira-cloud-v3.openapi.json",total:214,ops:[["GET","/rest/api/3/search","Issues changed since the last cursor"],["GET","/rest/api/3/issue/{key}","One issue with its status history"],["GET","/rest/api/3/project","Projects and their keys"],["POST","/rest/webhooks/1.0/webhook","Register the change webhook"]],page:"Offset: startAt and maxResults, 100 per page, up to 50 pages",rate:"300 requests a minute; 41 used in the last minute",prof:[["OAuth 2.0 (3LO)","Active"],["API token (basic)","Disabled by policy"]]},
 c_erp:{spec:"lease-subledger-v2.openapi.yaml",total:96,ops:[["GET","/invoices?status=POSTED","Posted invoices since the last run"],["GET","/invoices/{id}","One invoice with lines"],["GET","/payments","Payments by invoice"]],page:"Link header, 500 per page",rate:"100 requests a minute; throttled twice last night",prof:[["API key in header","Active"],["OAuth 2.0 client credentials","Planned for next quarter"]]},
 c_cr:{spec:"contract-repo.openapi.json",total:38,ops:[["GET","/contracts","All contracts"],["GET","/contracts/{id}/clauses","Clauses for one contract"]],page:"Page number, 50 per page",rate:"60 requests a minute",prof:[["API key in header","Active in sandbox only"]]},
 c_cod:{spec:"standards-export.openapi.json",total:21,ops:[["GET","/export/features","Editorial features and states"]],page:"Cursor token, 200 per page",rate:"30 requests a minute",prof:[["API key in header","Active until expiry"]]},
 c_lum:{spec:"lumen-cutover.openapi.json",total:12,ops:[["GET","/alerts","Cutover alerts"]],page:"Cursor token, 100 per page",rate:"60 requests a minute",prof:[["API key in header","Active until expiry"]]}};
function kindPanel(c){
 const kv=(a)=>`<dl class="kv">${a.map(x=>`<dt>${E(x[0])}</dt><dd>${x[1]}</dd>`).join("")}</dl>`;
 if(c.kind==="rest"||c.id==="c_pol"&&false){const g=REST_CFG[c.id]||REST_CFG.c_cod;
  return `<h3>Generic REST setup</h3><div class="dfullgrid"><div class="mini glass"><b>OpenAPI import</b><p class="small muted">${E(g.spec)}: ${g.total} operations found, ${g.ops.length} selected.</p><ul class="small fab-ul">${g.ops.map(o=>`<li><code>${o[0]}</code> ${E(o[1])}<br><span class="muted">${E(o[2])}</span></li>`).join("")}</ul></div>
  <div class="mini glass"><b>Auth profiles</b><ul class="small fab-ul">${g.prof.map(p=>`<li>${E(p[0])} ${pill(p[1],/Active/.test(p[1])?"good":"mute")}</li>`).join("")}</ul><b>Pagination</b><p class="small muted">${E(g.page)}</p><b>Rate limit</b><p class="small muted">${E(g.rate)}. Backoff is exponential with jitter and honors Retry-After; three retries, then dead letter.</p></div></div>`}
 if(c.kind==="mcp"){const tools=PLAT.entities().slice(0,6);
  return `<h3>MCP: both directions</h3><div class="dfullgrid"><div class="mini glass"><b>Consume: external MCP servers as sources</b><ul class="small fab-ul"><li>Lumen search MCP server ${pill("Sandbox","warn")}<br><span class="muted">Tools: <code>list_index_alerts</code> allowed, <code>get_index_status</code> allowed, <code>rebuild_index</code> ${pill("Blocked, write tool","bad")}</span></li><li>Every tool call is an audited run; write tools need a separate approval.</li></ul></div>
  <div class="mini glass"><b>Expose: the registry as an MCP server</b><p class="small muted">${PLAT.entities().length} entities become read tools, with propose tools for new entities and fields. Callers use their own service identity; fields above their class are masked.</p><ul class="small fab-ul"><li><code>list_entities</code>, <code>get_entity</code>, <code>propose_field</code></li>${tools.map(e=>`<li><code>query_${E(e.id)}</code></li>`).join("")}<li class="muted">and ${PLAT.entities().length-6} more, generated from the registry</li></ul></div></div>`}
 if(c.kind==="idp")return `<h3>Identity setup</h3><div class="dfullgrid"><div class="mini glass"><b>OpenID Connect sign-in</b>${kv([["Issuer","login.microsoftonline.com/meridian"],["Claims used","sub, name, email, groups"],["Session","8 hours, step-up for admin actions"]])}</div>
  <div class="mini glass"><b>SCIM lifecycle (last 7 days)</b>${kv([["Joiners","6 created, 6 provisioned"],["Movers","11 team or title changes"],["Leavers","3 disabled; access revoked in under 1 minute"]])}</div>
  <div class="mini glass"><b>Groups feed access control</b><ul class="small fab-ul"><li>MSF-PMO to role <code>project_manager</code>, attribute <code>team=PMO</code></li><li>MSF-Finance to role <code>finance_viewer</code></li><li>MSF-Security to role <code>auditor</code></li></ul><p class="small muted">Role-based (RBAC) and attribute-based (ABAC) rules read these on every request.</p></div></div>`;
 if(c.kind==="graph"){const w=[["Users and groups","User.Read.All, Group.Read.All","Change notifications","person"],["Calendar","Calendars.ReadBasic.All","Free and busy only, no titles","time_off"],["Mail metadata","Mail.ReadBasic.All","Counts and times, never bodies","none, signals only"],["Teams","Team.ReadBasic.All","Channels and membership","none yet"],["Planner","Tasks.Read.All","Polled every hour","project_task"],["Files","Sites.Selected","Only sites the owner grants","contract links"]];
  return `<h3>Workloads</h3><div class="tscroll"><table class="fab-tbl"><thead><tr><th>Workload</th><th>Least-privilege scope</th><th>How it is read</th><th>Feeds</th></tr></thead><tbody>${w.map(r=>`<tr><td><b>${r[0]}</b></td><td><code>${r[1]}</code></td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody></table></div>
  <h3>Replacement path for Project Online</h3><ol class="fab-steps small"><li>${pill("Done","good")} Project Online was scheduled to retire on Sept 30, 2026. The one-time export bridge copied every schedule out before then.</li><li>${pill("Live","good")} Plans move to Planner. Task start, due and percent complete arrive through Graph into the shared fields.</li><li>${pill("Live","good")} The ${U.esc(BRAND.name)} schedule stays authoritative. Differences open a reconciliation item instead of overwriting.</li><li>${pill("Next","info")} Decommission the bridge connector (task WI-1299).</li></ol>`}
 return `<h3>How it works</h3><p class="small muted">${E(c.desc)}</p>`}
function sampleHTML(c){
 const ls=F.lastSample[c.id];if(!ls)return "";
 if(ls.expose)return `<h3>Last sample call ${pill(ls.at,"mute")}</h3><div class="story"><b>Planning Agent</b> (service identity <code>svc-mcp-planning</code>) called <code>get_entity</code> on <code>project_task</code>. The policy engine allowed it with masking.</div><div class="tscroll"><table class="fab-tbl"><thead><tr><th>Field</th><th>Authority</th><th>Class</th><th>Returned</th></tr></thead><tbody>${PLAT.ent("project_task").fields.slice(0,6).map(f=>{const m=eff("project_task",f.k),masked=m.cls==="restricted"||m.cls==="personal";return `<tr><td>${E(f.label)}</td><td>${pill(m.auth,AUTHP[m.auth])}</td><td>${pill(m.cls,CLSP[m.cls])}</td><td>${masked?"●●●● masked for this caller":"Returned with freshness "+E(m.fresh)}</td></tr>`}).join("")}</tbody></table></div>`;
 const r=ls.r;
 return `<h3>Last sample run ${pill(ls.run,"mute")} ${ls.sandbox?pill("Sandbox, nothing written","warn"):pill("Production","good")}</h3>
 <div class="fab-flow">${lineage({mode:"Batch",read:r.read,valid:r.read-r.quar,quar:r.quar,loaded:r.loaded,held:r.held,kept:r.kept,same:r.same,events:r.events,env:ls.sandbox?"Sandbox":"Production",wouldLoad:r.loaded}).map((s,i)=>`<div class="fab-fs" style="--fd:${i*90}ms"><i style="background:var(${s[1]})"></i><b>${s[0]}</b><span>${E(s[2])}</span></div>`).join("")}</div>
 <div class="tscroll"><table class="fab-tbl"><thead><tr><th>Record</th><th>Outcome</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td><b>${E(x.rec)}</b><div class="muted small">${E(ENTLBL(x.ent))}</div></td><td>${x.fields?x.fields.map(f=>`<div class="small"><code>${E(f[0])}</code> ${E(f[1])}</div>`).join(""):pill(x.res,"bad")+` <span class="small">${E(x.why||"")}</span>`}</td></tr>`).join("")}</tbody></table></div>
 ${r.notes.map(n=>`<p class="small story">${E(n)}</p>`).join("")}${ls.unused?`<p class="small muted">${ls.unused} mapping${ls.unused>1?"s":""} not used in this run because ${ls.sandbox?"it is rejected":"it is not approved yet"}.</p>`:""}`}
function connDrawer(id){
 const c=conn(id);if(!c)return;F.sel=id;const rd=c.kind==="roadmap";
 const maps=MAPS().filter(m=>m.conn===id),runs=RUNS().filter(r=>r.conn===id).slice(0,5);
 const days=c.expiry?Math.round((Date.parse(c.expiry)-Date.parse(isoDay(0)))/86400000):null;
 const acts=rd?`<span class="pill mute">On the roadmap. Vote or request early access through your account team.</span>`:`<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-fab-run="${c.id}">${allowed(c)?"Run a sample":"Run a sample (unlock)"}</button><button class="btn" data-fab-bf="${c.id}">Backfill</button><button class="btn quiet" data-fab-tab="2" data-fab-mapconn="${c.id}">Open mappings</button>${c.tier==="community"?`<button class="btn quiet" data-fab-cert="${c.id}">Request certification</button>`:""}${c.tier==="project"&&c.status!=="expired"?`<button class="btn quiet" data-fab-expire="${c.id}">Simulate expiry</button>`:""}</div>`;
 openDrawer(`<div class="eyebrow">${E(KIND[c.kind])} connector</div><h2 style="margin:4px 0">${E(c.name)}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${tierPill(c.tier)} ${stPill(c.status)} ${c.min==="core"?pill("Included in Base","good"):c.min==="enterprise"?pill("Roadmap","mute"):pill("Integration","info")} ${c.risk?pill(c.risk+" risk",c.risk==="High"?"bad":c.risk==="Medium"?"warn":"mute"):""}</div>
 <div class="story" style="margin-top:10px">${E(c.desc)}${c.note?" "+E(c.note):""}</div>${acts}
 ${rd?"":`<dl class="kv"><dt>Owner</dt><dd>${own_(c.owner)}</dd><dt>System</dt><dd>${E(c.sys)}</dd><dt>Environment</dt><dd>${E(c.env)}</dd><dt>Path</dt><dd>${c.canStream?"Real-time capable (events), batch as fallback":"Batch only (scheduled)"}</dd><dt>Observed lag</dt><dd>${c.status==="expired"?"Stopped":lagS(c.lag)}</dd>${c.expiry?`<dt>Expires</dt><dd>${E(c.expiry)} ${days<0?pill("Expired "+(-days)+" days ago","bad"):pill(days+" days left",days<=30?"warn":"mute")}</dd>`:""}<dt>Fields fed</dt><dd>${fedCount(c.id)} approved, ${maps.filter(m=>m.status!=="approved").length} waiting</dd></dl>
 ${sampleHTML(c)}
 <h3>Authentication and identity</h3><dl class="kv"><dt>Auth profile</dt><dd>${E(c.auth.t)} (${E(c.auth.profile)})</dd><dt>Secret</dt><dd><code>${E(c.auth.vault)}</code><div class="muted small">A vault reference only. The value is never shown, logged or sent to a browser.</div></dd><dt>Service identity</dt><dd><code>${E(c.auth.idn)}</code>, one per connector</dd><dt>Scopes</dt><dd>${c.auth.scopes.map(s=>`<code>${E(s)}</code>`).join(" ")}</dd><dt>Masking</dt><dd>ABAC masks fields above the caller's class. Every run is written to the audit log.</dd></dl>
 ${kindPanel(c)}
 <h3>Mapped fields</h3>${lrHTML({id:"fab_lr_"+c.id,groups:Object.values(maps.reduce((a,m)=>{(a[m.ent]=a[m.ent]||{key:m.ent,label:ENTLBL(m.ent),rows:[]}).rows.push({id:m.id,t:m.src+" to "+flabel(m.ent,m.k),sub:m.tf+", "+Math.round(m.conf*100)+"% confidence",tag:m.status,st:m.status==="approved"?"good":"warn",go:()=>{S.fab.mapConn=c.id;closeDrawer();goTab(2)}});return a},{})),limit:6,search:true})}
 <h3>Recent runs</h3>${runs.length?`<div class="tscroll"><table class="fab-tbl"><thead><tr><th>Run</th><th>When</th><th>Read</th><th>Loaded</th><th>Quarantined</th><th>Status</th></tr></thead><tbody>${runs.map(r=>`<tr><td><b>${r.id}</b></td><td>${E(r.at)}</td><td>${r.read}</td><td>${r.loaded}</td><td>${r.quar}</td><td>${pill(r.status,r.status==="ok"?"good":r.status==="partial"?"warn":"bad")}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted small">No runs yet.</p>`}`}`)}
function runDrawer(id){
 const r=RUNS().find(x=>x.id===id);if(!r)return;const c=conn(r.conn)||{name:r.conn};
 openDrawer(`<div class="eyebrow">Run</div><h2 style="margin:4px 0">${E(r.id)}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(r.status,r.status==="ok"?"good":r.status==="partial"?"warn":"bad")} ${pill(r.mode,"info")} ${pill(r.env,r.env==="Sandbox"?"warn":"mute")} ${r.retries?pill(r.retries+" retries","warn"):""}</div>
 <div class="story">${E(c.name)} started ${E(r.at)} and took ${r.dur} seconds. ${r.err?"It failed: "+E(r.err)+". ":""}Replays use the idempotency key below, so replaying a finished run changes nothing.</div>
 <div class="fab-flow">${lineage(r).map((s,i)=>`<div class="fab-fs" style="--fd:${i*60}ms"><i style="background:var(${s[1]})"></i><b>${s[0]}</b><span>${E(s[2])}</span></div>`).join("")}</div>
 <dl class="kv"><dt>Idempotency key</dt><dd><code>${E(r.idem)}</code></dd><dt>Service identity</dt><dd><code>${E(c.auth?c.auth.idn:"svc-fabric")}</code></dd><dt>Audit</dt><dd>Written to the audit log with the connector, counts and key.</dd></dl>
 <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-fab-replay="${r.id}">Replay (idempotent)</button>${r.status==="failed"?`<button class="btn" data-fab-retry="${r.id}">Retry now</button>`:""}<button class="btn quiet" data-fab-conn="${r.conn}">Open connector</button></div>`)}
/* ---------- tabs ---------- */
const stBar=(items)=>{const t=items.reduce((a,x)=>a+x[1],0)||1;return `<div class="fab-seg" role="img" aria-label="${items.map(x=>x[0]+" "+x[1]).join(", ")}">${items.map(x=>x[1]?`<i style="flex:${x[1]};background:var(${x[2]})" title="${E(x[0])}: ${x[1]}"></i>`:"").join("")}</div>`};
function attention(){
 const a=[],s=slaStats(),ex=CONNS().filter(c=>c.status==="expired"),exs=CONNS().filter(c=>c.status==="expiring"),aw=F.proj.filter(p=>p.stage==="awaiting"),pm=MAPS().filter(m=>m.status==="proposed"&&live(conn(m.conn))&&conn(m.conn).tier!=="community");
 ex.forEach(c=>a.push(["bad","Expired connector: "+c.name,"Its decommission task is open and assigned to "+c.owner+". The secret must be revoked.",1]));
 exs.forEach(c=>a.push(["warn",c.name+" expires "+c.expiry,"Project-scoped connectors are decommissioned at expiry. Extend it through a new M2M review or let it close.",1]));
 s.miss.slice(0,3).forEach(x=>a.push(["warn","Freshness missed: "+ENTLBL(x.m.ent)+" "+flabel(x.m.ent,x.m.k),"Target "+FR[eff(x.m.ent,x.m.k).fresh].l.toLowerCase()+", but "+conn(x.m.conn).name+" delivers in about "+lagS(x.lg)+". Move it to the event stream or relax the target.",3]));
 if(qOpen().length)a.push([qOpen().length>10?"bad":"warn",qOpen().length+" records in quarantine","Oldest waited since "+qOpen()[qOpen().length-1].at+". Fix and replay them; three failed replays go to the dead letter queue.",4]);
 if(rOpen().length)a.push(["warn",rOpen().length+" reconciliation differences","Shared fields where "+BRAND.name+" and the source disagree. Each opens a work item for the field steward.",5]);
 if(aw.length)a.push(["info",aw.length+" machine-to-machine project"+(aw.length>1?"s":"")+" awaiting a decision","Routed by risk and data sensitivity: "+aw.map(p=>p.id+" to "+(p.route?p.route.n:"evaluation")).join("; ")+".",6]);
 if(pm.length)a.push(["info",pm.length+" AI-proposed mappings need approval","Nothing loads from a proposed mapping until a person approves it.",2]);
 CONNS().filter(c=>c.status==="degraded").forEach(c=>a.push(["warn",c.name+" is degraded",c.note||"Retries are succeeding; watch the rate limit.",1]));
 return a}
function paneOver(){
 const ed=ED[F.edition],ac=activeConns(),s=slaStats(),cv=covStats(),r24=RUNS().filter(r=>r.min<=1440),ok24=r24.filter(r=>r.status==="ok").length;
 const kp=kpiRow([["Connectors in use",ac.length+" of "+ed.conn,isCore()?"Base allows 3. The rest is preview":"edition limit",{cls:ac.length>ed.conn?"bad":"",keep:true}],["Fields fed",apprMaps().reduce((a,m)=>a.add(m.ent+"."+m.k),new Set()).size,"approved field mappings"],["Freshness SLA met",s.pct+"%",s.ok+" of "+s.n+" mapped fields",{metric:"m_fab_fresh"}],["Quarantine open",qOpen().length,"fix and replay",{metric:"m_fab_quar",keep:true}],["Mapping coverage",cv.pct+"%",cv.cov+" of "+cv.tot+" external or shared fields",{metric:"m_fab_cov"}]]);
 const lic=card("Edition and license","Placeholder names while packaging is decided",`<div class="row" style="gap:8px;flex-wrap:wrap">${pill(ed.n,F.edition==="core"?"mute":"good")} <span class="muted small">${E(ed.tag)}</span></div>
  <dl class="kv"><dt>License key</dt><dd><code>${E(F.edition==="core"?"None, free inside the platform":maskKey(F.key))}</code></dd><dt>Includes</dt><dd>${ed.feat.map(f=>E(f)).join("; ")}</dd><dt>Environments</dt><dd>${ed.envs.join(", ")}</dd></dl>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-fab-key>${isCore()?"Unlock with a key":"Change key"}</button><button class="btn quiet" data-fab-unlock>Compare editions</button></div>`);
 const lim=card("Limits","Connector count, monthly runs, environments",`${meter("Connectors",ac.length,ed.conn,ac.length+" of "+ed.conn+(ac.length>ed.conn?" (preview)":""))}${meter("Runs this month",F.usage,ed.runs,F.usage.toLocaleString()+" of "+ed.runs.toLocaleString())}${meter("Environments",Math.min(ed.env,2),ed.env,Math.min(ed.env,2)+" of "+ed.env)}<p class="muted small">Going over a limit never stops running connectors. New approvals wait for a larger license.</p>`);
 const att=attention();
 const attCard=card("What needs attention","Ranked by how soon something breaks or expires",`<div class="fab-att">${att.map(x=>`<div class="fab-ar ${x[0]}"><i aria-hidden="true"></i><div><b>${E(x[1])}</b><div class="muted small">${E(x[2])}</div></div><button class="btn quiet" data-fab-tab="${x[3]}">Open</button></div>`).join("")||`<p class="muted">Nothing needs attention.</p>`}</div>`);
 const cnt={};ac.forEach(c=>cnt[c.status]=(cnt[c.status]||0)+1);
 const health=card("Connector health","One row per connector, newest status",`${stBar([["Healthy",cnt.healthy||0,"--good-f"],["Degraded, expiring or new",(cnt.degraded||0)+(cnt.expiring||0)+(cnt.new||0),"--warn-f"],["Sandbox only",cnt.sandbox||0,"--info-f"]])}${legend([["Healthy","--good-f"],["Degraded, expiring or new","--warn-f"],["Sandbox only","--info-f"]])}
  <div class="fab-hl">${CONNS().filter(c=>c.kind!=="roadmap").map(c=>`<button class="fab-hr" data-fab-conn="${c.id}"><span class="fab-hn">${E(c.name)}</span>${stPill(c.status)}<span class="muted small">${c.status==="expired"?"stopped":"lag "+lagS(c.lag)}</span></button>`).join("")}</div>`);
 const bins=Array.from({length:24},()=>({ok:0,partial:0,failed:0}));r24.forEach(r=>{const h=Math.min(23,Math.floor(r.min/60));bins[h][r.status]++});const mx=Math.max(1,...bins.map(b=>b.ok+b.partial+b.failed));
 const stats=card("Run stats, last 24 hours","Runs per hour, oldest on the left",`<div class="fab-bars" role="img" aria-label="Runs per hour over the last 24 hours">${bins.slice().reverse().map(b=>`<div class="fab-bc">${["failed","partial","ok"].map(k=>b[k]?`<i class="${k}" style="height:${Math.round(100*b[k]/mx)}%"></i>`:"").join("")}</div>`).join("")}</div>${legend([["Clean run","--good-f"],["Run with quarantined records","--warn-f"],["Failed run","--bad-f"]])}
  <div class="statrow">${kpi("Runs",r24.length,Math.round(100*ok24/Math.max(1,r24.length))+"% clean")}${kpi("Records read",r24.reduce((a,r)=>a+r.read,0).toLocaleString(),"extracted")}${kpi("Loaded",r24.reduce((a,r)=>a+r.loaded,0).toLocaleString(),"after validation")}${kpi("Retries",r24.reduce((a,r)=>a+r.retries,0),"automatic",{keep:true})}</div>`);
 const how=card("How the freshness target picks the path","Set per field, not per connector",`<div class="grid g4 fab-fr">${Object.keys(FR).map(k=>`<div class="mini glass"><b>${E(FR[k].l)}</b>${pill(FR[k].mode,FR[k].mode==="Real-time"?"info":"mute")}<span class="small muted">${E(FR[k].how)}</span></div>`).join("")}</div>`);
 return `${prevBanner()}${kp}<div class="grid g2 fab-g">${lic}${lim}</div>${attCard}<div class="grid g2 fab-g">${health}${stats}</div>${how}`}
function paneConn(){
 const cs=CONNS(),n=t=>cs.filter(c=>c.tier===t&&c.kind!=="roadmap").length;
 const kp=kpiRow([["Certified",n("certified"),"approved by the enterprise"],["Community",n("community"),"sandbox only until evaluated",{cls:"warn",keep:true}],["Project-scoped",n("project"),"temporary, with expiry"],["Expiring in 30 days",cs.filter(c=>c.status==="expiring").length,"decommission at expiry",{keep:true}],["Roadmap",cs.filter(c=>c.kind==="roadmap").length,"later connectors"]]);
 const four=["c_graph","c_idp","c_jira","c_mcp_reg"].map(id=>{const c=conn(id);return `<button class="tile glass fab-four" data-fab-conn="${id}"><span class="eyebrow">${id==="c_jira"?"Generic REST":id==="c_mcp_reg"?"MCP":KIND[c.kind]}</span><b>${E(id==="c_jira"?"Generic REST: Jira Cloud":c.name)}</b><span class="row" style="gap:6px;flex-wrap:wrap">${tierPill(c.tier)}${stPill(c.status)}</span><span class="muted small">${id==="c_mcp_reg"?"Serves "+PLAT.entities().length+" registry entities to agents":fedCount(id)+" fields fed, lag "+lagS(c.lag)}</span></button>`}).join("");
 const tbl=btHTML({id:"fab_conn",cols:[
  {k:"name",label:"Connector",fmt:r=>`<b>${E(r.name)}</b><div class="muted small">${E(KIND[r.kind])}${r.min==="core"?" · Base":""}</div>`,val:r=>r.name,w:250,wrap:true},
  {k:"tier",label:"Tier",fmt:r=>tierPill(r.tier),val:r=>TIERP[r.tier][0]},
  {k:"status",label:"Status",fmt:r=>stPill(r.status),val:r=>STP[r.status][0]},
  {k:"owner",label:"Owner",fmt:r=>own_(r.owner),val:r=>r.owner,wrap:true},
  {k:"fed",label:"Fields fed",fmt:r=>r.kind==="roadmap"?"":fedCount(r.id),val:r=>r.kind==="roadmap"?-1:fedCount(r.id)},
  {k:"ents",label:"Entities",fmt:r=>E(r.ents.map(ENTLBL).join(", ")||"None"),val:r=>r.ents.length,wrap:true,w:220},
  {k:"path",label:"Path",fmt:r=>r.kind==="roadmap"?"":r.canStream?"Real-time and batch":"Batch only",val:r=>r.canStream?"Real-time and batch":"Batch only"},
  {k:"lag",label:"Observed lag",fmt:r=>r.kind==="roadmap"||r.status==="expired"?"":lagS(r.lag),val:r=>r.lag||0},
  {k:"ed",label:"Edition",fmt:r=>r.min==="core"?pill("Base","good"):r.min==="enterprise"?pill("Later","mute"):pill(allowed(r)?"Integration":"Integration (locked)",allowed(r)?"info":"warn"),val:r=>r.min}
 ],rows:()=>CONNS(),key:"id",h:520,rowH:56,facets:["tier","status","ed"],exportName:"fabric-connectors",open:id=>connDrawer(id)});
 const road=CONNS().filter(c=>c.kind==="roadmap").map(c=>`<button class="mini glass fab-road" data-fab-conn="${c.id}"><b>${E(c.name)}</b><span class="small muted">${E(c.desc)}</span>${pill("Roadmap","mute")}</button>`).join("");
 return `${prevBanner()}${kp}<div class="row sp" style="margin:12px 0 4px"><b>Four launch connectors</b><button class="btn primary" data-fab-newconn>Add a connector</button></div><div class="grid g4 fab-g">${four}</div>
 <div style="margin-top:14px">${card("All connectors","Certified, community and project-scoped, plus the roadmap",`${legend([["Certified: enterprise approved","--good-f"],["Community: sandbox only until evaluated","--warn-f"],["Project-scoped: temporary, expires","--p4"]])}${tbl}`)}</div>
 <div style="margin-top:14px">${card("Later connectors","On the roadmap; not available in any edition yet",`<div class="grid g3 fab-g">${road}</div>`)}</div>`}
/* ---- mapping studio ---- */
const SYN={due:"finish",duedate:"planned finish",start:"start",title:"name",summary:"short description",status:"state",jobtitle:"role",department:"team",manager:"manager",managerid:"manager",assignee:"owner assigned",assignments:"owner",storypoints:"story points",priority:"priority",vendor_name:"vendor",gl_account:"cost",createddatetime:"opened",mobilephone:"phone",employeeid:"id",labels:"skills",sprint:"sprint",currency:"currency",bucketid:"wbs",groups:"team",index_name:"name",shard:"count"};
const toks=s=>String(s).replace(/([a-z])([A-Z])/g,"$1 $2").toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>1);
function srcFields(id){const o={};(SAMPLES[id]||[]).forEach(sm=>sm.rows.forEach(r=>Object.keys(r).forEach(k=>{if(k==="id"||k===sm.nameKey&&false)return;if(!(k in o))o[k]={k,type:typeof r[k]==="number"?"int":/^\d{4}-\d\d-\d\d/.test(String(r[k]))?"datetime":"string",sample:String(r[k])}})));(SRCX[id]||[]).forEach(x=>{if(!(x[0] in o))o[x[0]]={k:x[0],type:x[1],sample:x[2]}});return Object.values(o)}
function mapRows(id){const mp=MAPS().filter(m=>m.conn===id).map(m=>{const sf=srcFields(id).find(x=>x.k===m.src);return Object.assign({sample:sf?sf.sample:"",open:true},m)});
 const have=new Set(mp.map(m=>m.src));const un=srcFields(id).filter(x=>!have.has(x.k)).map(x=>({id:"U-"+id+"-"+x.k,conn:id,src:x.k,srcType:x.type,sample:x.sample,unmapped:true,status:"unmapped",ent:"",k:"",tf:"",conf:0,ver:0}));return mp.concat(un)}
function proposeFor(id){
 const ents=[...new Set(MAPS().filter(m=>m.conn===id).map(m=>m.ent).concat((SAMPLES[id]||[]).map(s=>s.ent)).concat(conn(id).ents))].filter(e=>ent_(e));let n=0,miss=0;
 mapRows(id).filter(r=>r.unmapped).forEach(r=>{const st=new Set(toks(r.src).concat(toks(SYN[String(r.src).toLowerCase()]||"")));let best=null;
  ents.forEach(en=>ent_(en).fields.forEach(f=>{const ft=new Set(toks(f.k).concat(toks(f.label)));let hit=0;st.forEach(w=>{if(ft.has(w))hit++});const sc=hit/Math.max(1,st.size);if(sc>0&&(!best||sc>best.sc))best={en,f,sc}}));
  if(best&&best.sc>=.5){MAPS().push({id:"MP-"+(100+MAPS().length),conn:id,src:r.src,srcType:r.srcType,ent:best.en,k:best.f.k,tf:/date/.test(best.f.type||"")?"ISO date to date":"Trim",conf:Math.min(.94,Math.round((.5+best.sc*.4)*100)/100),status:"proposed",lag:conn(id).lag,em:null,ver:1,ai:true});n++}else miss++});
 audit("Data layer mapping proposed",conn(id).name+": "+n+" proposed, "+miss+" without a match");toast(n+" mapping"+(n===1?"":"s")+" proposed, "+miss+" with no match in the registry",n?"good":"warn");render()}
function dryRun(id){const res=[];const maps=MAPS().filter(m=>m.conn===id&&m.status!=="rejected");
 maps.forEach(m=>{let ok=0,fail=0,ex="",bad="";(SAMPLES[id]||[]).filter(s=>s.ent===m.ent).forEach(sm=>sm.rows.forEach(row=>{if(!(m.src in row))return;const r=coerce(m.ent,m.k,row[m.src],m);if(r.ok){ok++;if(!ex)ex=String(row[m.src])+" to "+String(r.val)}else{fail++;if(!bad)bad=r.why}}));res.push({m,ok,fail,ex,bad})});
 F.mapTest[id]={at:tsAgo(0),res:res.map(x=>({id:x.m.id,src:x.m.src,tgt:flabel(x.m.ent,x.m.k),ok:x.ok,fail:x.fail,ex:x.ex,bad:x.bad}))};audit("Data layer mapping tested",conn(id).name+": "+res.reduce((a,x)=>a+x.ok,0)+" passed, "+res.reduce((a,x)=>a+x.fail,0)+" failed on sample data");render()}
function setMapStatus(ids,st){const cn=MAPS().find(m=>m.id===ids[0]).conn;F.mapVer[cn]=(F.mapVer[cn]||1)+(st==="approved"?1:0);ids.forEach(i=>{const m=MAPS().find(x=>x.id===i);m.status=st;if(st==="approved")m.ver=F.mapVer[cn]});
 audit("Data layer mapping "+st,conn(cn).name+": "+ids.length+" mapping"+(ids.length>1?"s":"")+(st==="approved"?" now version "+F.mapVer[cn]:""));toast(st==="approved"?ids.length+" approved, mapping set is now version "+F.mapVer[cn]:"Rejected","good")}
function paneMap(){
 const id=F.mapConn,c=conn(id)||conn("c_graph"),mp=MAPS().filter(m=>m.conn===id),pend=mp.filter(m=>m.status==="proposed").length,cv=covStats(),tst=F.mapTest[id];
 const kp=kpiRow([["Approved mappings",MAPS().filter(m=>m.status==="approved").length,"across "+new Set(MAPS().filter(m=>m.status==="approved").map(m=>m.conn)).size+" connectors"],["Waiting for approval",MAPS().filter(m=>m.status==="proposed").length,"AI-proposed or edited",{cls:"warn",keep:true}],["Coverage",cv.pct+"%",cv.cov+" of "+cv.tot+" external or shared fields",{metric:"m_fab_cov"}],["This mapping set","v"+(F.mapVer[id]||1),E(c.name)],["Sample test",tst?tst.res.reduce((a,x)=>a+x.ok,0)+" ok":"Not run",tst?tst.res.reduce((a,x)=>a+x.fail,0)+" failed, "+tst.at:"Run it before approving",{keep:true}]]);
 const chips=[...new Set(MAPS().map(m=>m.conn).concat(Object.keys(SAMPLES)))].filter(x=>conn(x)&&conn(x).kind!=="roadmap").map(x=>`<button class="chip ${x===id?"on":""}" data-fab-mapconn="${x}">${E(conn(x).name)}</button>`).join("");
 const tbl=btHTML({id:"fab_maps_"+id,cols:[
  {k:"src",label:"Source field",fmt:r=>`<b>${E(r.src)}</b><div class="muted small">${E(r.srcType)} · e.g. ${E(String(r.sample||"").slice(0,26))}</div>`,val:r=>r.src,w:230,wrap:true},
  {k:"tgt",label:"Registry field",fmt:r=>r.unmapped?`<span class="muted">Not mapped</span>`:`<b>${E(flabel(r.ent,r.k))}</b><div class="muted small">${E(ENTLBL(r.ent))}</div>`,val:r=>r.unmapped?"":flabel(r.ent,r.k),w:210,wrap:true},
  {k:"auth",label:"Authority",fmt:r=>r.unmapped?"":pill(eff(r.ent,r.k).auth,AUTHP[eff(r.ent,r.k).auth]),val:r=>r.unmapped?"":eff(r.ent,r.k).auth},
  {k:"tf",label:"Transform",fmt:r=>E(r.tf),val:r=>r.tf,wrap:true},
  {k:"conf",label:"Confidence",fmt:r=>r.unmapped?"":pill(Math.round(r.conf*100)+"%"+(r.ai?" AI":""),r.conf>=.9?"good":r.conf>=.8?"info":"warn"),val:r=>r.conf},
  {k:"status",label:"Status",fmt:r=>pill(r.status==="unmapped"?"Unmapped":r.status[0].toUpperCase()+r.status.slice(1),r.status==="approved"?"good":r.status==="proposed"?"warn":r.status==="rejected"?"bad":"mute"),val:r=>r.status},
  {k:"ver",label:"Version",fmt:r=>r.ver?"v"+r.ver:"",val:r=>r.ver}
 ],rows:()=>mapRows(F.mapConn),key:"id",h:440,rowH:54,facets:["status","auth"],exportName:"fabric-mappings",open:i=>mapDrawer(i)});
 const tcard=tst?card("Sample-data test result","Ran "+tst.at+" with every non-rejected mapping on the connector's sample records",`<div class="tscroll"><table class="fab-tbl"><thead><tr><th>Mapping</th><th>Passed</th><th>Failed</th><th>Example or reason</th></tr></thead><tbody>${tst.res.map(x=>`<tr><td><b>${E(x.src)}</b> to ${E(x.tgt)}</td><td>${x.ok}</td><td>${x.fail?pill(String(x.fail),"bad"):0}</td><td class="small">${E(x.fail?x.bad:x.ex||"No sample values")}</td></tr>`).join("")}</tbody></table></div>`):"";
 return `${prevBanner()}${kp}<div class="row" style="gap:6px;flex-wrap:wrap;margin:12px 0">${chips}</div>
 ${card("Mapping studio: "+E(c.name),"Source fields on the left, registry fields on the right. AI proposes; a person approves; each approval bumps the version.",`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn primary" data-fab-propose="${id}">${ico("sparkle")} Propose mappings with AI</button><button class="btn" data-fab-apprall="${id}" ${pend?"":"disabled"}>Approve ${pend} waiting at 85% or more</button><button class="btn quiet" data-fab-test="${id}">Test with sample data</button><button class="btn quiet" data-fab-run="${id}">Run a sample</button>${aiChip({model:"Claude Sonnet",conf:.88,title:"How mappings are proposed",note:"Matches source field names and types to registry field names, labels and synonyms. Confidence drops when only part of a name matches.",src:["Source field names and sample values","Registry field catalog","Approved mappings on other connectors"],guards:["Proposals never load data","A person approves every mapping","Authority rules still apply at load time"]})}</div>${tbl}`)}
 ${tcard?`<div style="margin-top:14px">${tcard}</div>`:""}`}
/* ---- field authority ---- */
function authRows(){const idx={};MAPS().filter(m=>m.status==="approved"&&live(conn(m.conn))).forEach(m=>{(idx[m.ent+"."+m.k]=idx[m.ent+"."+m.k]||[]).push(m)});
 return PLAT.fieldsAll().map(f=>{const m=eff(f.ent,f.k),mp=idx[f.ent+"."+f.k]||[];const lg=mp.length?Math.min(...mp.map(x=>x.lag==null?conn(x.conn).lag:x.lag)):null;
  return{id:f.ent+"."+f.k,ent:f.ent,entLabel:f.entLabel,k:f.k,label:f.label,type:f.type,auth:m.auth,dir:m.dir,fresh:m.fresh,mode:FR[m.fresh].mode,cls:m.cls,trust:m.trust,conflict:m.conflict,over:!!m.over,fed:mp.map(x=>conn(x.conn).name).filter((v,i,a)=>a.indexOf(v)===i),lag:lg,sla:lg==null?"Not fed":lg<=FR[m.fresh].s?"Met":"Missed"}})}
function paneAuth(){
 const rows=authRows(),n=a=>rows.filter(r=>r.auth===a).length,fr=k=>rows.filter(r=>r.fresh===k).length;
 const kp=kpiRow([["Fields",rows.length.toLocaleString(),"in the registry"],["Platform authority",n("platform"),BRAND.name+" is the source of truth"],["External",n("external"),"mirrored from the source"],["Shared",n("shared"),"both edit, differences reconciled",{cls:"warn",keep:true}],["Overrides",Object.keys(F.ovr).length,"audited changes",{keep:true}]]);
 const modes=card("Freshness target decides real-time or batch","Fields by target; the target, not the connector, picks the path",`<div class="grid g4 fab-fr">${Object.keys(FR).map(k=>`<div class="mini glass"><b>${E(FR[k].l)}</b><span class="num">${fr(k).toLocaleString()}</span>${pill(FR[k].mode,FR[k].mode==="Real-time"?"info":"mute")}</div>`).join("")}</div>`);
 const tbl=btHTML({id:"fab_auth",cols:[
  {k:"entLabel",label:"Entity",fmt:r=>E(r.entLabel),val:r=>r.entLabel,wrap:true},
  {k:"label",label:"Field",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.k)} · ${E(r.type)}</div>`,val:r=>r.label,w:200,wrap:true},
  {k:"auth",label:"Authority",fmt:r=>pill(r.auth,AUTHP[r.auth])+(r.over?` <span class="fab-ov" title="Overridden from the registry default">edited</span>`:""),val:r=>r.auth},
  {k:"dir",label:"Direction",fmt:r=>r.dir==="in"?"External to "+BRAND.name:r.dir==="out"?BRAND.name+" only":"Both ways",val:r=>r.dir},
  {k:"fresh",label:"Freshness target",fmt:r=>E(FR[r.fresh].l),val:r=>r.fresh},
  {k:"mode",label:"Path",fmt:r=>pill(r.mode,r.mode==="Real-time"?"info":"mute"),val:r=>r.mode},
  {k:"fed",label:"Fed by",fmt:r=>r.fed.length?E(r.fed.join(", ")):`<span class="muted">Not fed</span>`,val:r=>r.fed.join(),wrap:true,w:180},
  {k:"sla",label:"Observed",fmt:r=>r.lag==null?`<span class="muted">Not fed</span>`:pill(r.sla+" ("+lagS(r.lag)+")",r.sla==="Met"?"good":"bad"),val:r=>r.sla},
  {k:"conflict",label:"Conflict rule",fmt:r=>E(r.conflict),val:r=>r.conflict,wrap:true,w:200},
  {k:"trust",label:"Trust",fmt:r=>Math.round(r.trust*100)+"%",val:r=>r.trust}
 ],rows:authRows,key:"id",h:520,rowH:54,facets:["auth","fresh","mode","sla"],groupBy:["entLabel","auth","fresh"],exportName:"fabric-field-authority",open:i=>fieldDrawer(i)});
 return `${prevBanner()}${kp}<div style="margin-top:14px">${modes}</div><div style="margin-top:14px">${card("Field authority","Open a field to see its source of truth and to override authority or freshness. Overrides are audited.",`${legend([["Platform authority","--good-f"],["External authority","--info-f"],["Shared","--warn-f"]])}${tbl}`)}</div>`}
function fieldDrawer(id){
 const r=authRows().find(x=>x.id===id);if(!r)return;const m=eff(r.ent,r.k),o=F.ovr[id],mp=MAPS().filter(x=>x.ent===r.ent&&x.k===r.k);
 openDrawer(`<div class="eyebrow">${E(r.entLabel)}</div><h2 style="margin:4px 0">${E(r.label)}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(m.auth,AUTHP[m.auth])} ${pill(FR[m.fresh].mode,FR[m.fresh].mode==="Real-time"?"info":"mute")} ${pill(m.cls,CLSP[m.cls])} ${o?pill("Edited","warn"):""}</div>
 <div class="story">${E(m.why)}. ${E(FR[m.fresh].how)}.</div>
 <dl class="kv"><dt>Direction</dt><dd>${m.dir==="in"?"External to "+BRAND.name:m.dir==="out"?BRAND.name+" only":"Both ways"}</dd><dt>Freshness target</dt><dd>${E(FR[m.fresh].l)}</dd><dt>Conflict rule</dt><dd>${E(m.conflict)}</dd><dt>Trust score</dt><dd>${Math.round(m.trust*100)}%</dd><dt>Quality rule</dt><dd>${E(m.rule)}</dd><dt>Fed by</dt><dd>${r.fed.length?r.fed.map(E).join(", "):"No connector yet"}</dd><dt>Observed lag</dt><dd>${r.lag==null?"Not fed":lagS(r.lag)+" ("+r.sla+")"}</dd>${o?`<dt>Last change</dt><dd>${E(o.by)} on ${E(o.at)}: ${E(o.reason)}</dd>`:""}</dl>
 ${mp.length?`<h3>Mappings</h3>${lrHTML({id:"fab_lrf",groups:[{key:"m",label:"Mappings into this field",rows:mp.map(x=>({id:x.id,t:conn(x.conn).name+": "+x.src,sub:x.tf,tag:x.status,st:x.status==="approved"?"good":"warn"}))}],limit:6})}`:""}
 <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" data-fab-ovr="${id}">Override authority or freshness</button>${o?`<button class="btn quiet" data-fab-ovrreset="${id}">Reset to registry default</button>`:""}<button class="btn quiet" onclick="go('plat_reg')">Open in the registry</button></div>`)}
/* ---- runs and quarantine ---- */
const RSTP=s=>pill(s,s==="ok"?"good":s==="partial"?"warn":"bad");
const QSTP={open:["Open","warn"],replayed:["Replayed","good"],dead:["Dead letter","bad"]};
function paneRuns(){
 const r24=RUNS().filter(r=>r.min<=1440),ok=r24.filter(r=>r.status==="ok").length,dead=F.quar.filter(q=>q.status==="dead").length;
 const kp=kpiRow([["Runs in 24 hours",r24.length,Math.round(100*ok/Math.max(1,r24.length))+"% finished clean"],["Records loaded",r24.reduce((a,r)=>a+r.loaded,0).toLocaleString(),"after validation and merge"],["In quarantine",qOpen().length,"waiting for a fix",{metric:"m_fab_quar",keep:true}],["Dead letter",dead,"three failed replays",{cls:dead?"bad":"",keep:true}],["Failed runs",r24.filter(r=>r.status==="failed").length,"retried with backoff",{keep:true}]]);
 const stages=[["Extract","--p4","Pull from the source or receive the event"],["Validate","--good-f","Check each record against the registry contract"],["Transform","--accent","Map and convert types"],["Match and merge","--warn-f","Find the record, apply authority and conflict rules"],["Load","--good-f","Write with an idempotency key"],["Publish event","--accent","Send a canonical change event"]];
 const pipe=card("The pipeline every run follows","Failed validation goes to quarantine, never into the registry",`<div class="fab-flow fab-flow6">${stages.map((s,i)=>`<div class="fab-fs"><i style="background:var(${s[1]})"></i><b>${i+1}. ${s[0]}</b><span>${s[2]}</span></div>`).join("")}</div>${legend(stages.map(s=>[s[0],s[1]]))}<p class="muted small">Retries use exponential backoff. Backfill replays a date range. A record that fails three replays moves to the dead letter queue for a steward. Replays are idempotent: the same key loads a record once.</p>`);
 const rt=btHTML({id:"fab_runs",cols:[
  {k:"id",label:"Run",fmt:r=>`<b>${r.id}</b><div class="muted small">${E(r.kind)}</div>`,val:r=>r.id},
  {k:"cn",label:"Connector",fmt:r=>E((conn(r.conn)||{name:r.conn}).name),val:r=>(conn(r.conn)||{name:r.conn}).name,wrap:true,w:200},
  {k:"mode",label:"Path",fmt:r=>pill(r.mode,r.mode==="Real-time"?"info":"mute"),val:r=>r.mode},
  {k:"at",label:"Started",fmt:r=>E(r.at),val:r=>-r.min},
  {k:"dur",label:"Seconds",fmt:r=>r.dur,val:r=>r.dur},
  {k:"read",label:"Read",fmt:r=>r.read.toLocaleString(),val:r=>r.read},
  {k:"quar",label:"Quarantined",fmt:r=>r.quar?pill(String(r.quar),"warn"):"0",val:r=>r.quar},
  {k:"loaded",label:"Loaded",fmt:r=>r.loaded.toLocaleString(),val:r=>r.loaded},
  {k:"held",label:"Held",fmt:r=>r.held,val:r=>r.held},
  {k:"status",label:"Status",fmt:r=>RSTP(r.status),val:r=>r.status},
  {k:"env",label:"Environment",fmt:r=>E(r.env),val:r=>r.env},
  {k:"err",label:"Error",fmt:r=>E(r.err||""),val:r=>r.err,wrap:true,w:220}
 ],rows:()=>RUNS(),key:"id",h:440,rowH:48,facets:["cn","status","mode","env"],exportName:"fabric-runs",open:i=>runDrawer(i)});
 const qt=btHTML({id:"fab_quar",cols:[
  {k:"id",label:"Item",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},
  {k:"cn",label:"Connector",fmt:r=>E(conn(r.conn).name),val:r=>conn(r.conn).name,wrap:true,w:180},
  {k:"rec",label:"Record",fmt:r=>`<b>${E(r.rec)}</b><div class="muted small">${E(ENTLBL(r.ent))}, ${E(flabel(r.ent,r.k))}</div>`,val:r=>r.rec,wrap:true,w:200},
  {k:"val",label:"Value received",fmt:r=>r.val===""?`<span class="muted">Empty</span>`:`<code>${E(r.val)}</code>`,val:r=>r.val},
  {k:"reason",label:"Why it failed",fmt:r=>E(r.reason),val:r=>r.reason,wrap:true,w:260},
  {k:"at",label:"Since",fmt:r=>E(r.at),val:r=>r.at},
  {k:"att",label:"Replays",fmt:r=>r.attempts+" of 3",val:r=>r.attempts},
  {k:"status",label:"Status",fmt:r=>pill(QSTP[r.status][0],QSTP[r.status][1]),val:r=>QSTP[r.status][0]}
 ],rows:()=>F.quar,key:"id",h:380,rowH:56,facets:["status","cn"],exportName:"fabric-quarantine",open:i=>quarDrawer(i)});
 return `${prevBanner()}${kp}<div style="margin-top:14px">${pipe}</div><div style="margin-top:14px">${card("Quarantine queue","Open an item to fix the value and replay it. Replays validate again before anything loads.",qt)}</div><div style="margin-top:14px">${card("Run history","Every run is audited; open one to see its lineage, retry or replay it",rt)}</div>`}
function quarDrawer(id){
 const q=F.quar.find(x=>x.id===id);if(!q)return;const c=conn(q.conn),m=eff(q.ent,q.k);
 openDrawer(`<div class="eyebrow">Quarantine item</div><h2 style="margin:4px 0">${E(q.rec)}: ${E(flabel(q.ent,q.k))}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(QSTP[q.status][0],QSTP[q.status][1])} ${pill(m.auth,AUTHP[m.auth])} ${pill(q.attempts+" of 3 replays","mute")}</div>
 <div class="story"><b>${E(q.reason)}.</b> ${E(c.name)} sent <code>${q.val===""?"(empty)":E(q.val)}</code> in run ${E(q.run)}. The registry rule is: ${E(m.rule)}. Nothing was written to ${E(ENTLBL(q.ent))}.</div>
 <dl class="kv"><dt>Entity</dt><dd>${E(ENTLBL(q.ent))}</dd><dt>Since</dt><dd>${E(q.at)}</dd><dt>Owner of the fix</dt><dd>${own_(c.owner)}</dd><dt>Idempotency</dt><dd>Replaying the same record loads it once.</dd></dl>
 <div class="row" style="gap:8px;flex-wrap:wrap">${q.status==="open"?`<button class="btn primary" data-fab-fix="${q.id}">Fix and replay</button>`:q.status==="dead"?`<button class="btn primary" data-fab-requeue="${q.id}">Requeue for replay</button>`:""}<button class="btn quiet" data-fab-conn="${q.conn}">Open connector</button></div>`)}
function fixForm(id){
 const q=F.quar.find(x=>x.id===id);if(!q)return;if(isCore()){unlockDrawer("Fix and replay needs the Integration edition.");return}
 const t=ftype(q.ent,q.k);
 openForm({id:"fab_fix",title:"Fix and replay "+q.rec,story:"Correct the value, and the platform data layer validates it against the registry contract again. If it passes, the record loads once, a change event is published and the item closes. Three failed replays move it to the dead letter queue.",submit:"Replay",
  fields:[{section:"Corrected value"},{k:"val",label:flabel(q.ent,q.k),type:"text",req:true,ph:t==="date"||t==="datetime"?"2026-11-20":t==="percent"?"0 to 100":"Corrected value",help:"Field type: "+t+". Rule: "+eff(q.ent,q.k).rule+"."},{k:"note",label:"Note for the audit log",type:"text",ph:"Confirmed with the project manager"}],
  defaults:{val:q.val},
  live:v=>{const r=coerce(q.ent,q.k,v.val,null),pr=r.ok&&q.ctx?pairRule(q.ent,Object.assign({},q.ctx,{[q.k]:r.val})):null;return `<div class="story"><b>Validation now:</b> ${r.ok&&!pr?"passes. It would load and publish "+E(q.ent+"."+q.k+".changed")+".":E(pr?pr.why:r.why)}</div>`},
  onSubmit:v=>{const r=coerce(q.ent,q.k,v.val,null),pr=r.ok&&q.ctx?pairRule(q.ent,Object.assign({},q.ctx,{[q.k]:r.val})):null;
   if(!r.ok||pr){q.attempts++;if(q.attempts>=3){q.status="dead";toast("Still failing. Moved to the dead letter queue.","bad");audit("Data layer item dead-lettered",q.id+": "+q.rec);closeDrawer()}else{toast("Still fails: "+(pr?pr.why:r.why),"warn");audit("Data layer replay failed",q.id+" attempt "+q.attempts)}render();return}
   q.status="replayed";q.val=String(r.val);F.usage++;const c=conn(q.conn);
   const run=newRun(c,{mode:"Batch",read:1,valid:1,loaded:1,events:1,kind:"replay",idem:"idem-"+hs(q.id)*7919});
   FEVTS().unshift(mkEvent(q.ent,q.k,q.rec,"(quarantined)",String(r.val),q.conn,0));audit("Data layer quarantine replayed",q.id+" "+q.rec+" loaded as "+r.val+(v.note?" ("+v.note+")":""));toast("Replayed and loaded: "+q.rec,"good");closeDrawer();render()}})}
/* ---- reconciliation ---- */
const RECP={open:["Open","warn"],wi:["Work item open","info"],resolved:["Resolved","good"]};
const steward=en=>({project_task:"Priya Shah",user_story:"Sam Patel",person:"Rina Okafor",invoice:"Avery Chen"})[en]||"Maya Ortiz";
function paneRecon(){
 const open=rOpen(),sh=authRows().filter(r=>r.auth==="shared").length,age=open.length?Math.max(...open.map(r=>r.min)):0;
 const kp=kpiRow([["Open differences",open.length,"between "+BRAND.name+" and the source",{metric:"m_fab_recon",keep:true}],["Work items open",WIS().filter(w=>w.st==="open").length,"assigned to stewards",{keep:true}],["Resolved this week",F.recon.filter(r=>r.status==="resolved").length,"decided and audited"],["Oldest open",age>=1440?Math.floor(age/1440)+" days":Math.round(age/60)+" hours","since detection",{keep:true}],["Shared fields",sh,"where both sides may edit"]]);
 const tbl=btHTML({id:"fab_recon",cols:[
  {k:"id",label:"Difference",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},
  {k:"rec",label:"Record",fmt:r=>`<b>${E(r.rec)}</b><div class="muted small">${E(r.label)}</div>`,val:r=>r.rec,wrap:true,w:210},
  {k:"k",label:"Field",fmt:r=>`${E(flabel(r.ent,r.k))}<div class="muted small">${E(ENTLBL(r.ent))}</div>`,val:r=>r.k,wrap:true},
  {k:"plat",label:BRAND.name+" says",fmt:r=>`<code>${E(r.plat)}</code>`,val:r=>r.plat},
  {k:"ext",label:"Source says",fmt:r=>`<code>${E(r.ext)}</code>`,val:r=>r.ext},
  {k:"cn",label:"Source",fmt:r=>E(conn(r.conn).name),val:r=>conn(r.conn).name,wrap:true},
  {k:"at",label:"Detected",fmt:r=>E(r.at),val:r=>-r.min},
  {k:"status",label:"Status",fmt:r=>pill(RECP[r.status][0],RECP[r.status][1])+(r.wi?` <span class="muted small">${r.wi}</span>`:""),val:r=>RECP[r.status][0]}
 ],rows:()=>F.recon,key:"id",h:440,rowH:56,facets:["status","cn"],exportName:"fabric-reconciliation",open:i=>reconDrawer(i)});
 const wi=WIS().length?card("Work items from the platform data layer","Reconciliation and decommission tasks, assigned to a person",`<div class="fab-hl">${WIS().map(w=>`<div class="fab-hr fab-wi"><span class="fab-hn"><b>${E(w.id)}</b> ${E(w.t)}<br><span class="muted small">${E(w.sub)}</span></span>${pill(w.st==="open"?"Open":"Done",w.st==="open"?"warn":"good")}<span class="small">${own_(w.who)} · due ${E(w.due)}</span></div>`).join("")}</div>`):"";
 return `${prevBanner()}${kp}<div style="margin-top:14px">${card("Differences on shared fields","When both sides may edit a field, the newest value wins unless "+BRAND.name+" has an unsynced edit. Then the difference lands here instead of being overwritten.",`${tbl}`)}</div>${wi?`<div style="margin-top:14px">${wi}</div>`:""}`}
function reconDrawer(id){
 const r=F.recon.find(x=>x.id===id);if(!r)return;const m=eff(r.ent,r.k),c=conn(r.conn);
 openDrawer(`<div class="eyebrow">Reconciliation ${E(r.id)}</div><h2 style="margin:4px 0">${E(r.rec)}: ${E(flabel(r.ent,r.k))}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(RECP[r.status][0],RECP[r.status][1])} ${pill(m.auth,AUTHP[m.auth])}</div>
 <div class="story">${E(r.label)} has two values. ${U.esc(BRAND.name)} was edited after the last sync, so the platform data layer kept it and opened this difference instead of overwriting. Rule: ${E(m.conflict)}.</div>
 <div class="grid g2 fab-g"><div class="mini glass fab-cmp"><span class="eyebrow">${U.esc(BRAND.name)}</span><b class="num">${E(r.plat)}</b><span class="small muted">Edited in the platform</span></div><div class="mini glass fab-cmp"><span class="eyebrow">${E(c.name)}</span><b class="num">${E(r.ext)}</b><span class="small muted">Detected ${E(r.at)}</span></div></div>
 <dl class="kv"><dt>Trust in the source</dt><dd>${Math.round(m.trust*100)}%</dd><dt>Field steward</dt><dd>${own_(steward(r.ent))}</dd><dt>Subscribers affected</dt><dd>${subsFor(r.ent).map(s=>E(s.n)).join(", ")}</dd>${r.wi?`<dt>Work item</dt><dd>${E(r.wi)}</dd>`:""}${r.how?`<dt>Decision</dt><dd>${E(r.how)}</dd>`:""}</dl>
 ${r.status==="resolved"?"":`<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-fab-wi="${r.id}">Open a work item</button><button class="btn" data-fab-res="${r.id}:plat">Keep the ${U.esc(BRAND.name)} value</button><button class="btn" data-fab-res="${r.id}:ext">Take the source value</button></div>`}`)}
function wiForm(id){
 const r=F.recon.find(x=>x.id===id);if(!r)return;if(isCore()){unlockDrawer("Opening reconciliation work items needs the Integration edition.");return}
 openForm({id:"fab_wi",title:"Open a work item for "+r.rec,story:"Creates a task for the field steward with both values and the source attached. It appears in their Person 360 work list. The difference stays open until someone decides.",submit:"Open work item",
  fields:[{k:"who",label:"Assign to",type:"people",req:true},{k:"due",label:"Due",type:"date"},{k:"note",label:"What to decide",type:"longtext",ph:"Which date is right?"}],defaults:{who:steward(r.ent)},
  onSubmit:v=>{const w={id:"WI-"+(F.seq.wi++),t:"Reconcile "+r.label+": "+flabel(r.ent,r.k),sub:r.id+" on "+r.ent+": "+BRAND.name+" "+r.plat+" versus source "+r.ext,who:v.who||steward(r.ent),due:v.due||dayS(5).slice(0,6),st:"open",ref:r.id};WIS().unshift(w);r.status="wi";r.wi=w.id;audit("Data layer work item opened",w.id+" for "+r.id);toast(w.id+" opened for "+w.who,"good");closeDrawer();render()}})}
function resolveRecon(id,side){const r=F.recon.find(x=>x.id===id);if(!r)return;r.status="resolved";r.how=side==="plat"?"Kept the "+BRAND.name+" value":"Took the source value";
 const w=WIS().find(x=>x.ref===id);if(w)w.st="done";if(side==="ext")FEVTS().unshift(mkEvent(r.ent,r.k,r.rec,r.plat,r.ext,r.conn,0));audit("Data layer difference resolved",r.id+": "+r.how);toast(r.how,"good");closeDrawer();render()}
/* ---- M2M ---- */
const STAGES=[["proposed","Proposed","Waiting for the platform team"],["evaluating","Evaluating","Five checks running"],["awaiting","Awaiting decision","Routed by risk and sensitivity"],["certified","Approved: certified","Ongoing connector"],["project","Approved: project-scoped","Temporary, with expiry"],["rejected","Rejected","Reasons recorded"]];
const CKP=s=>s==="pass"?["Pass","good"]:s==="warn"?["Review","warn"]:["Fail","bad"];
function paneM2M(){
 const P=F.proj,n=s=>P.filter(p=>p.stage===s).length;
 const kp=kpiRow([["Projects",P.length,"proposed by anyone"],["In evaluation",n("proposed")+n("evaluating"),"before routing"],["Awaiting a decision",n("awaiting"),"auto, platform or council",{cls:n("awaiting")?"warn":"",keep:true}],["Approved",n("certified")+n("project"),n("project")+" project-scoped"],["Evaluation cycle",cycle()+" days","proposal to decision",{metric:"m_fab_m2m"}]]);
 const rules=card("Approval routing","Chosen by configuration, risk and data sensitivity, never by who asks",`<div class="grid g3 fab-g">${ROUTES.map(r=>`<div class="mini glass fab-rt"><i style="background:var(${r[3]})"></i><b>${r[1]}</b><span class="small muted">${E(r[2])}</span></div>`).join("")}</div>`);
 const board=`<div class="fab-board" role="group" aria-label="Machine-to-machine project stages">${STAGES.map(s=>`<div class="fab-col"><div class="fab-ch"><b>${s[1]}</b><span class="pill mute">${n(s[0])}</span></div><span class="muted small">${s[2]}</span><div class="fab-cl" data-dnd="${s[0]}" data-dnd-scope="fab_m2m">${P.filter(p=>p.stage===s[0]).map(p=>`<div class="fab-card" data-dnd-id="${p.id}" tabindex="0"><span class="grip" aria-hidden="true"></span><button class="fab-cb" data-fab-pj="${p.id}"><b>${E(p.id)}</b><span>${E(p.t)}</span></button><span class="row" style="gap:4px;flex-wrap:wrap">${pill(p.risk+" risk",p.risk==="High"?"bad":p.risk==="Medium"?"warn":"mute")}${p.route?routePill(p.route):""}</span></div>`).join("")}</div></div>`).join("")}</div>`;
 const rq=btHTML({id:"fab_req",cols:[
  {k:"id",label:"Request",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},{k:"kind",label:"Kind",fmt:r=>E(r.kind),val:r=>r.kind},
  {k:"t",label:"What",fmt:r=>`<b>${E(r.ref)}</b><div class="muted small">${E(r.t)}</div>`,val:r=>r.t,wrap:true,w:300},
  {k:"route",label:"Route taken",fmt:r=>routePill(r.route),val:r=>r.route.n},
  {k:"why",label:"Why this route",fmt:r=>E(r.route.why),val:r=>r.route.why,wrap:true,w:300},
  {k:"sla",label:"Decision time",fmt:r=>E(r.route.sla),val:r=>r.route.sla},
  {k:"state",label:"State",fmt:r=>pill(r.state,r.state==="Decided"?"good":"warn"),val:r=>r.state}
 ],rows:()=>F.reqs,key:"id",h:320,rowH:56,facets:["kind","state"],exportName:"fabric-approval-requests",open:i=>{const r=F.reqs.find(x=>x.id===i);if(r&&r.kind==="M2M project")projDrawer(r.ref);else connDrawer(r.ref)}});
 return `${prevBanner()}${kp}<div style="margin-top:14px">${rules}</div><div style="margin-top:14px">${card("Machine-to-machine projects","Anyone proposes; the platform evaluates; a route decides. Drag a card to the next step, or open it.",`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn primary" data-fab-newm2m>Propose a project</button><span class="muted small">Moves: Proposed to Evaluating starts the five checks. Evaluating to Awaiting routes it. Decisions open a form.</span></div>${board}`)}</div><div style="margin-top:14px">${card("Approval requests and the route each took","Every request, whether a new project or a connector promotion",rq)}</div>`}
function projDrawer(id){
 const p=F.proj.find(x=>x.id===id);if(!p)return;const ev=p.eval,rt=p.route;
 const chk=ev?`<div class="fab-chk">${ev.checks.map(c=>{const s=CKP(c.st);return `<div class="fab-ck ${c.st}"><span class="pill ${s[1]}">${s[0]}</span><div><b>${E(c.n)}</b><div class="small muted">${E(c.d)}</div></div></div>`}).join("")}</div>`:`<p class="muted small">Evaluation has not started. Moving the project to Evaluating runs five checks: contract fit, security review, sandbox sample test, cost estimate and duplicate check.</p>`;
 const st=STAGES.find(s=>s[0]===p.stage);
 openDrawer(`<div class="eyebrow">Machine-to-machine project</div><h2 style="margin:4px 0">${E(p.id)}: ${E(p.t)}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(st[1],p.stage==="rejected"?"bad":p.stage==="awaiting"?"warn":p.stage==="certified"||p.stage==="project"?"good":"mute")} ${pill(p.risk+" risk",p.risk==="High"?"bad":p.risk==="Medium"?"warn":"mute")} ${rt?routePill(rt):""} ${p.len==="temporary"?pill("Temporary","info"):pill("Ongoing","mute")}</div>
 <div class="story">${E(p.purpose)}</div>
 <dl class="kv"><dt>Proposed by</dt><dd>${own_(p.by)} ${p.created?`<span class="muted small">${p.created} days ago</span>`:""}</dd><dt>Owner</dt><dd>${own_(p.owner)}</dd><dt>Systems</dt><dd>${p.systems.map(E).join(", ")}</dd><dt>Connector type</dt><dd>${E(p.ctype)}</dd><dt>Entities</dt><dd>${p.ents.map(e=>E(ENTLBL(e))).join(", ")}</dd><dt>Fields</dt><dd>${E(p.fields)}</dd><dt>Direction and volume</dt><dd>${p.dir==="In"?"Into "+BRAND.name:p.dir==="Out"?"Out of "+BRAND.name:"Both ways"}, about ${p.vol.toLocaleString()} records a day</dd>${rt?`<dt>Route taken</dt><dd>${routePill(rt)} ${E(rt.why)} Decision time ${E(rt.sla)}.</dd>`:""}${p.outcome?`<dt>Outcome</dt><dd>${E(p.outcome.kind==="certified"?"Approved as certified":p.outcome.kind==="project"?"Approved, project-scoped until "+p.outcome.expiry:"Rejected")} by ${E(p.outcome.by)} on ${E(p.outcome.at)}. ${E(p.outcome.reasons||"")}</dd>`:""}</dl>
 <h3>Evaluation checklist</h3>${chk}${ev?`<p class="small">Recommendation: <b>${E(ev.rec)}</b>. ${ev.fails} failed, ${ev.warns} to review.</p>`:""}
 <div class="row" style="gap:8px;flex-wrap:wrap">${p.stage==="proposed"?`<button class="btn primary" data-fab-eval="${p.id}">Start evaluation</button>`:p.stage==="evaluating"?`<button class="btn primary" data-fab-route="${p.id}">Send to the approval route</button>`:p.stage==="awaiting"?`<button class="btn primary" data-fab-decide="${p.id}">Record the decision</button>`:""}${p.conn?`<button class="btn quiet" data-fab-conn="${p.conn}">Open the connector</button>`:""}</div>`)}
function startEval(p){if(isCore()){unlockDrawer("Machine-to-machine evaluation needs the Integration edition.");return false}
 p.eval=evaluate(p);p.route=routeOf(p,p.eval);p.stage="evaluating";if(!F.reqs.find(r=>r.ref===p.id))F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"M2M project",ref:p.id,t:p.t,route:p.route,state:"Evaluating",at:0});else F.reqs.find(r=>r.ref===p.id).route=p.route;
 audit("Data layer evaluation run",p.id+": "+p.eval.fails+" failed, "+p.eval.warns+" to review, recommend "+p.eval.rec);toast("Evaluation done: "+p.eval.rec,p.eval.fails?"warn":"good");return true}
function sendRoute(p){if(!p.eval)return false;p.route=routeOf(p,p.eval);const rq=F.reqs.find(r=>r.ref===p.id);if(rq){rq.route=p.route;rq.state="Waiting"}
 if(p.route.k==="auto"&&!p.eval.fails){p.stage="awaiting";const k=p.len==="temporary"?"project":"certified";if(decide(p,k,k==="project"?isoDay(60):"","Auto-approved by rules: "+p.route.why))audit("Data layer auto-approved",p.id);return true}
 p.stage="awaiting";audit("Data layer routed",p.id+" to "+p.route.n);toast("Routed to "+p.route.n+" ("+p.route.sla+")","good");return true}
function decideForm(id){
 const p=F.proj.find(x=>x.id===id);if(!p||!p.eval)return;
 openForm({id:"fab_decide",title:"Decision on "+p.id,story:"Recorded as the "+(p.route?p.route.n:"platform team")+". Certified creates a permanent connector. Project-scoped creates a temporary one that closes itself at expiry and opens a decommission task. Reject keeps the reasons for the proposer.",submit:"Record decision",
  fields:[{k:"out",label:"Outcome",type:"chips",req:true,opts:[["certified","Approve as certified"],["project","Approve project-scoped"],["rejected","Reject"]]},{k:"exp",label:"Expiry date",type:"date",show:v=>v.out==="project",help:"The connector stops and a decommission task opens on this date."},{k:"why",label:"Reasons",type:"longtext",req:true,ph:"Why this outcome"}],
  defaults:{out:p.eval.rec==="Reject"?"rejected":p.len==="temporary"?"project":"certified",exp:isoDay(60),why:""},
  live:v=>`<div class="story"><b>Recommendation:</b> ${E(p.eval.rec)}. ${p.eval.fails?"A failed check blocks approval; reject or send back for a fix.":""}</div>`,
  onSubmit:v=>{if(v.out!=="rejected"&&p.eval.fails){toast("A failed check blocks approval. Reject it, or fix and re-evaluate.","bad");return}if(v.out==="project"&&!v.exp){toast("Choose an expiry date","bad");return}
   if(decide(p,v.out,v.out==="project"?v.exp:"",v.why)){closeDrawer();render()}}})}
function m2mForm(){
 if(isCore()){unlockDrawer("Proposing machine-to-machine projects needs the Integration edition.");return}
 const draft=v=>({id:"M2M-"+(F.seq.prj+1).toString().padStart(2,"0"),t:v.t||"New project",purpose:v.purpose||"",systems:(v.systems||"").split(",").map(s=>s.trim()).filter(Boolean),ents:Array.isArray(v.ents)?v.ents:[],fields:v.fields||"",dir:v.dir||"In",vol:+v.vol||0,risk:v.risk||"Low",ctype:v.ctype||"Generic REST",len:v.len||"ongoing"});
 openForm({id:"fab_m2m",title:"Propose a machine-to-machine project",story:"Describe what should flow between systems. Entities and fields come from the real registry. The platform then runs five checks and routes the decision by risk and data sensitivity.",submit:"Propose",
  fields:[{section:"What and why"},{k:"t",label:"Name",type:"text",req:true,ph:"Leave balances from the HR system"},{k:"purpose",label:"Purpose",type:"longtext",req:true,ph:"Why "+BRAND.name+" needs this data"},{k:"systems",label:"External systems",type:"text",req:true,ph:"HR system, Intune",help:"Comma separated."},
   {section:"Data from the registry"},{k:"ents",label:"Entities",type:"multi",req:true,opts:PLAT.entities().map(e=>[e.id,e.label])},{k:"fields",label:"Fields",type:"text",req:true,ph:"from, to, status",help:"Field keys or labels from those entities."},{k:"dir",label:"Direction",type:"chips",opts:[["In","Into "+BRAND.name],["Out","Out of "+BRAND.name],["Both","Both ways"]]},
   {section:"Shape and risk"},{k:"ctype",label:"Connector type",type:"select",opts:CTYPES},{k:"vol",label:"Records a day",type:"number",req:true,min:1},{k:"len",label:"How long",type:"chips",opts:[["ongoing","Ongoing"],["temporary","Temporary"]]},{k:"risk",label:"Risk",type:"chips",opts:["Low","Medium","High"]},{k:"owner",label:"Owner",type:"people",req:true}],
  defaults:{dir:"In",ctype:"Generic REST",len:"ongoing",risk:"Low",vol:500},
  live:v=>{const d=draft(v),ok=d.ents.length&&d.fields;if(!ok)return `<div class="story">Pick entities and fields to see the contract check and the route.</div>`;const ev=evaluate(d),rt=routeOf(d,ev);return `<div class="story"><b>Preview:</b> ${ev.checks.map(c=>E(c.n.split(" ")[0])+" "+CKP(c.st)[0].toLowerCase()).join(", ")}. Route: <b>${E(rt.n)}</b> (${E(rt.why)}) Recommended: ${E(ev.rec)}.</div>`},
  onSubmit:v=>{const d=draft(v);d.id="M2M-"+(++F.seq.prj).toString().padStart(2,"0");d.owner=v.owner||"Casey Rowan";d.by="Casey Rowan";d.stage="proposed";d.mine=true;d.created=0;d.eval=null;d.route=null;d.outcome=null;F.proj.unshift(d);audit("Data layer M2M project proposed",d.id+": "+d.t);toast(d.id+" proposed. Drag it to Evaluating to run the checks.","good");closeDrawer();S.v.fab=6;render()}})}
/* ---- event bus ---- */
function paneBus(){
 const ev=FEVTS(),e24=ev.filter(e=>e.min<=1440).length,dl=SUBS.reduce((a,s)=>a+s.dl,0);
 const kp=kpiRow([["Events in 24 hours",e24.toLocaleString(),"canonical change events"],["Subscribers",SUBS.length,"apps and agents"],["Median delivery",(1.1).toFixed(1)+" s","source to subscriber"],["Dead letters",dl,"undelivered after retries",{cls:dl?"warn":"",keep:true}],["Event types",new Set(ev.map(e=>e.type)).size,"one name per entity field"]]);
 const st=btHTML({id:"fab_subs",cols:[
  {k:"n",label:"Subscriber",fmt:r=>`<b>${E(r.n)}</b>`,val:r=>r.n,wrap:true,w:220},{k:"pat",label:"Listens to",fmt:r=>r.pat.includes("*")?"Every entity":E(r.pat.map(ENTLBL).join(", ")),val:r=>r.pat.join(),wrap:true,w:240},
  {k:"mode",label:"Delivery",fmt:r=>E(r.mode),val:r=>r.mode},{k:"lag",label:"Lag",fmt:r=>E(r.lag),val:r=>r.lag},{k:"dl",label:"Dead letters",fmt:r=>r.dl?pill(String(r.dl),"warn"):"0",val:r=>r.dl},{k:"st",label:"Status",fmt:r=>stPill(r.st),val:r=>r.st}
 ],rows:()=>SUBS,key:"id",h:340,rowH:50,exportName:"fabric-subscribers"});
 const et=btHTML({id:"fab_events",cols:[
  {k:"id",label:"Event",fmt:r=>`<b>${r.id}</b>`,val:r=>r.id},{k:"type",label:"Type",fmt:r=>`<code>${E(r.type)}</code>`,val:r=>r.type,wrap:true,w:240},
  {k:"rec",label:"Record",fmt:r=>E(r.rec),val:r=>r.rec},{k:"chg",label:"Change",fmt:r=>`${E(String(r.old))} to ${E(String(r.nw))}`,val:r=>String(r.nw),wrap:true,w:200},
  {k:"src",label:"Source",fmt:r=>E((conn(r.conn)||{name:r.conn}).name),val:r=>(conn(r.conn)||{name:r.conn}).name,wrap:true},
  {k:"path",label:"Path",fmt:r=>pill(r.path==="stream"?"Stream":"Batch",r.path==="stream"?"info":"mute"),val:r=>r.path},
  {k:"at",label:"Time",fmt:r=>E(r.at),val:r=>-r.min},{k:"n",label:"Delivered to",fmt:r=>r.subs.length+" subscribers",val:r=>r.subs.length}
 ],rows:()=>FEVTS(),key:"id",h:440,rowH:48,facets:["path","src"],exportName:"fabric-events",open:i=>evDrawer(i)});
 return `${prevBanner()}${kp}<div style="margin-top:14px">${card("Canonical change events","Every load publishes one event per changed field. Subscribers never talk to connectors; they listen here.",`<div class="grid g3 fab-g"><div class="mini glass"><b>One shape</b><span class="small muted">Type is <code>entity.field.changed</code>, with old value, new value, source, run and schema version.</span></div><div class="mini glass"><b>Real-time and batch</b><span class="small muted">A live field publishes within seconds. A daily field publishes when its batch lands.</span></div><div class="mini glass"><b>Masked by policy</b><span class="small muted">Subscribers see only fields their class allows. Restricted values are masked in the event.</span></div></div>`)}</div>
 <div style="margin-top:14px">${card("Subscribers","Who listens, how it is delivered, and how far behind they are",st)}</div><div style="margin-top:14px">${card("Event feed","Newest first; open one to see its envelope and who received it",et)}</div>`}
function evDrawer(id){
 const e=FEVTS().find(x=>x.id===id);if(!e)return;const m=eff(e.ent,e.k)||{};
 openDrawer(`<div class="eyebrow">Change event</div><h2 style="margin:4px 0"><code>${E(e.type)}</code></h2><div class="row" style="gap:6px;flex-wrap:wrap">${pill(e.path==="stream"?"Stream":"Batch",e.path==="stream"?"info":"mute")} ${m.cls?pill(m.cls,CLSP[m.cls]):""}</div>
 <div class="story">${E(e.rec)} changed from <b>${E(String(e.old))}</b> to <b>${E(String(e.nw))}</b>, loaded by ${E((conn(e.conn)||{name:e.conn}).name)} at ${E(e.at)}.</div>
 <dl class="kv"><dt>Event id</dt><dd><code>${e.id}</code></dd><dt>Run</dt><dd><code>${E(e.run)}</code></dd><dt>Schema</dt><dd>${e.schema}</dd><dt>Authority</dt><dd>${m.auth?pill(m.auth,AUTHP[m.auth]):""}</dd></dl>
 <h3>Delivered to</h3>${lrHTML({id:"fab_lre",groups:[{key:"s",label:"Subscribers",rows:e.subs.map((n,i)=>({id:"s"+i,t:n,sub:"Acknowledged",tag:"delivered",st:"good"}))}],limit:6})}`)}
/* ---------- mapping drawer and forms ---------- */
const TFS=["As is","Trim","ISO date to date","Currency, two decimals","Map value","Directory lookup"];
function mapDrawer(id){
 const un=id.indexOf("U-")===0,row=mapRows(F.mapConn).find(r=>r.id===id);if(!row)return;
 const m=un?null:eff(row.ent,row.k);
 openDrawer(`<div class="eyebrow">${E(conn(row.conn).name)}</div><h2 style="margin:4px 0">${E(row.src)} ${un?"":"to "+E(flabel(row.ent,row.k))}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${un?pill("Unmapped","mute"):pill(row.status,row.status==="approved"?"good":row.status==="proposed"?"warn":"bad")} ${m?pill(m.auth,AUTHP[m.auth]):""} ${row.ai?pill("AI proposed","info"):""}</div>
 <div class="story">${un?"This source field has no registry target. Map it to an existing field, or propose a new one in the registry (the reuse check runs first).":"Source field "+E(row.src)+" ("+E(row.srcType)+") feeds "+E(ENTLBL(row.ent))+" "+E(flabel(row.ent,row.k))+". "+E(m.why)+". Because authority is "+E(m.auth)+", "+(m.auth==="platform"?"loaded values are kept out; "+BRAND.name+" wins":m.auth==="external"?"the source value overwrites":"differences open a reconciliation item")+"."}</div>
 <dl class="kv"><dt>Sample value</dt><dd><code>${E(String(row.sample||""))}</code></dd>${un?"":`<dt>Transform</dt><dd>${E(row.tf)}${row.em?" "+Object.keys(row.em).map(k=>E(k)+" to "+E(row.em[k])).join(", "):""}</dd><dt>Confidence</dt><dd>${Math.round(row.conf*100)}% ${row.ai?aiChip({model:"Claude Sonnet",conf:row.conf,title:"Why this target",note:"Source name and type matched the registry field name, label and type.",src:["Source field name and sample","Registry field catalog"]}):"(set by a person)"}</dd><dt>Version</dt><dd>v${row.ver}</dd><dt>Freshness target</dt><dd>${E(FR[m.fresh].l)} (${FR[m.fresh].mode.toLowerCase()})</dd><dt>Lag today</dt><dd>${lagS(row.lag==null?conn(row.conn).lag:row.lag)}</dd>`}</dl>
 <div class="row" style="gap:8px;flex-wrap:wrap">${un?`<button class="btn primary" data-fab-chg="${row.id}">Map to a registry field</button><button class="btn quiet" onclick="go('plat_reg')">Propose a new field</button>`:`${row.status!=="approved"?`<button class="btn primary" data-fab-apprmap="${row.id}">Approve</button>`:""}<button class="btn" data-fab-chg="${row.id}">Change target</button>${row.status!=="rejected"?`<button class="btn quiet" data-fab-rejmap="${row.id}">Reject</button>`:""}`}</div>`)}
function chgForm(id){
 const un=id.indexOf("U-")===0,row=mapRows(F.mapConn).find(r=>r.id===id);if(!row)return;
 const ents=[...new Set(MAPS().filter(m=>m.conn===row.conn).map(m=>m.ent).concat((SAMPLES[row.conn]||[]).map(s=>s.ent)).concat(conn(row.conn).ents))].filter(e=>ent_(e));
 const opts=[];ents.forEach(en=>ent_(en).fields.forEach(f=>opts.push([en+"."+f.k,ENTLBL(en)+": "+f.label])));
 openForm({id:"fab_chg",title:un?"Map "+row.src:"Change the target of "+row.src,story:"Pick the registry field this source field should feed. The mapping goes back to Proposed and needs an approval, which bumps the mapping set version.",submit:"Save mapping",
  fields:[{k:"to",label:"Registry field",type:"select",req:true,opts},{k:"tf",label:"Transform",type:"select",opts:TFS}],defaults:{to:un?opts[0][0]:row.ent+"."+row.k,tf:un?"Trim":row.tf},
  live:v=>{const p=(v.to||".").split("."),m=eff(p[0],p.slice(1).join("."));return `<div class="story"><b>Authority:</b> ${E(m.auth)}. ${E(m.conflict)}. Freshness target ${E(FR[m.fresh].l.toLowerCase())}.</div>`},
  onSubmit:v=>{const i=v.to.indexOf("."),en=v.to.slice(0,i),k=v.to.slice(i+1);if(un)MAPS().push({id:"MP-"+(100+MAPS().length),conn:row.conn,src:row.src,srcType:row.srcType,ent:en,k,tf:v.tf||"Trim",conf:1,status:"proposed",lag:conn(row.conn).lag,em:null,ver:1,ai:false});else{const m=MAPS().find(x=>x.id===id);m.ent=en;m.k=k;m.tf=v.tf||m.tf;m.status="proposed";m.conf=1;m.ai=false}
   audit("Data layer mapping edited",row.src+" to "+en+"."+k);toast("Saved as proposed","good");closeDrawer();render()}})}
function ovrForm(id){
 const i=id.indexOf("."),en=id.slice(0,i),k=id.slice(i+1),m=eff(en,k),f=fieldOf(en,k);if(!f)return;
 openForm({id:"fab_ovr",title:"Override "+f.label,story:"Changes who is the source of truth and how fresh the field must be. The change applies to every connector feeding it, is written to the audit log with your reason, and can be reset to the registry default.",submit:"Save override",
  fields:[{section:ENTLBL(en)+": "+f.label},{k:"auth",label:"Authority",type:"chips",req:true,opts:[["platform",BRAND.name+" (platform)"],["external","External system"],["shared","Shared"]],help:"Platform: "+BRAND.name+" wins. External: the source wins. Shared: both edit; differences are reconciled."},
   {k:"fresh",label:"Freshness target",type:"chips",req:true,opts:[["live","Live, under 5 seconds"],["near-live","Near-live, under 5 minutes"],["hourly","Hourly"],["daily","Daily"]]},
   {k:"conflict",label:"Conflict rule",type:"select",opts:[BRAND.name+" wins","External system wins","Newest wins, differences open a reconciliation item","Always ask the steward"],show:v=>v.auth==="shared"},{k:"reason",label:"Reason",type:"longtext",req:true,ph:"Why this field needs a different authority or freshness"}],
  defaults:{auth:m.auth,fresh:m.fresh,conflict:m.conflict,reason:""},
  live:v=>{const fr=FR[v.fresh||m.fresh],mp=MAPS().filter(x=>x.ent===en&&x.k===k&&x.status==="approved"),worst=mp.length?Math.min(...mp.map(x=>x.lag==null?conn(x.conn).lag:x.lag)):null;return `<div class="story"><b>Result:</b> ${E(fr.mode)} path. ${E(fr.how)}.${worst!=null?(worst<=fr.s?" Today's connector delivers in about "+lagS(worst)+", so this target is met.":" Today's connector delivers in about "+lagS(worst)+", so this target would be missed until it moves to the event stream."):" No connector feeds it yet."}</div>`},
  onSubmit:v=>{F.ovr[id]={auth:v.auth||m.auth,fresh:v.fresh||m.fresh,conflict:v.conflict||"",reason:v.reason,by:"Casey Rowan",at:dayS(0)};audit("Data layer authority overridden",en+"."+k+": "+m.auth+"/"+m.fresh+" to "+(v.auth||m.auth)+"/"+(v.fresh||m.fresh)+". "+v.reason);toast("Override saved and audited","good");closeDrawer();render()}})}
function connForm(){
 if(isCore()){unlockDrawer("Adding external connectors needs the Integration edition.");return}
 const draftP=v=>({id:"c_new",t:v.name||"New connector",purpose:"",systems:[v.sys||"External system"],ents:Array.isArray(v.ents)?v.ents:[],fields:"",dir:"In",vol:500,risk:v.risk||"Low",ctype:v.ctype||"Generic REST",len:"ongoing"});
 openForm({id:"fab_conn",title:"Add a connector",story:"Community connectors run in the sandbox only until evaluated. Project-scoped connectors are temporary and close at their expiry date. Certified connectors need an approval, routed by risk and data sensitivity.",submit:"Create",
  fields:[{section:"Connector"},{k:"name",label:"Name",type:"text",req:true,ph:"HR leave balances"},{k:"ctype",label:"Type",type:"select",opts:CTYPES},{k:"sys",label:"External system",type:"text",req:true,ph:"HR system"},{k:"owner",label:"Owner",type:"people",req:true},{k:"ents",label:"Entities it feeds",type:"multi",opts:PLAT.entities().map(e=>[e.id,e.label])},
   {section:"Tier and security"},{k:"tier",label:"Tier",type:"chips",opts:[["community","Community (sandbox only)"],["project","Project-scoped (temporary)"],["certified","Certified (needs approval)"]]},{k:"exp",label:"Expiry date",type:"date",show:v=>v.tier==="project"},{k:"risk",label:"Risk",type:"chips",opts:["Low","Medium","High"]},{k:"vault",label:"Secret reference",type:"text",ph:"vault://meridian-prod/fabric/hr-key",help:"A vault path only. Never paste a secret."}],
  defaults:{ctype:"Generic REST",tier:"community",risk:"Low",exp:isoDay(60)},
  live:v=>{if(v.tier!=="certified")return `<div class="story"><b>Next:</b> ${v.tier==="project"?"Runs for real until "+E(v.exp||"its expiry")+", then a decommission task opens.":"Runs in the sandbox only. Request certification when it is ready."}</div>`;const p=draftP(v),rt=routeOf(p,evaluate(p));return `<div class="story"><b>Approval route:</b> ${E(rt.n)}. ${E(rt.why)}</div>`},
  onSubmit:v=>{if(activeConns().length>=ED[F.edition].conn){toast("No free connector slot","warn");unlockDrawer("All "+ED[F.edition].conn+" connector slots in the "+ED[F.edition].n+" edition are used.");return}
   if(v.vault&&!/^vault:\/\//.test(v.vault)){toast("Use a vault:// reference, never a secret","bad");return}
   const p=draftP(v),rt=routeOf(p,evaluate(p)),cert=v.tier==="certified"&&rt.k==="auto",tier=cert?"certified":v.tier==="project"?"project":"community";
   const c={id:"c_"+hs(v.name+CONNS().length).toString(36),name:v.name,kind:{"Generic REST":"rest",MCP:"mcp","Identity provider":"idp","Microsoft Graph":"graph"}[v.ctype]||"rest",tier,status:tier==="community"?"sandbox":"new",owner:v.owner||"Casey Rowan",min:"fabric",env:tier==="community"?"Sandbox":"Production",ents:p.ents,canStream:false,lag:3600,sys:v.sys,risk:v.risk||"Low",desc:"Added by "+(v.owner||"Casey Rowan")+".",expiry:tier==="project"?v.exp:undefined,auth:A(["read"],"To be set","pending",v.vault||"vault://meridian-sbx/fabric/"+hs(v.name)+" (to be created)","svc-fabric-"+hs(v.name))};
   CONNS().splice(CONNS().findIndex(x=>x.kind==="roadmap"),0,c);
   if(v.tier==="certified"&&!cert)F.reqs.push({id:"REQ-"+(F.seq.req++),kind:"Certify connector",ref:c.id,t:"Certify "+c.name,route:rt,state:"Waiting",at:0});
   audit("Data layer connector added",c.name+" as "+tier+(v.tier==="certified"&&!cert?", certification routed to "+rt.n:""));toast(cert?"Auto-approved as certified":v.tier==="certified"?"Created in the sandbox; certification routed to "+rt.n:"Connector created: "+TIERP[tier][0],"good");closeDrawer();render()}})}
function certForm(id){
 const c=conn(id);if(isCore()){unlockDrawer("Certification needs the Integration edition.");return}
 const mp=MAPS().filter(m=>m.conn===id),ctype={rest:"Generic REST",mcp:"MCP",idp:"Identity provider",graph:"Microsoft Graph"}[c.kind]||"Other (custom code)";
 const p={id:c.id,t:c.name,purpose:c.desc,systems:[c.sys],ents:c.ents,fields:mp.map(m=>m.k).join(", "),dir:"In",vol:500,risk:c.risk||"Medium",ctype,len:"ongoing"},ev=evaluate(p),rt=routeOf(p,ev);
 openForm({id:"fab_cert",title:"Request certification",story:"The five checks run on the connector as it is today, then the request goes down the route that fits its risk and data. Auto-approval promotes it immediately.",submit:"Submit request",
  fields:[{k:"why",label:"Why it is ready",type:"longtext",req:true,ph:"Sandbox runs have been clean for two weeks"}],
  live:()=>`<div class="story"><b>Route:</b> ${E(rt.n)} (${E(rt.sla)}). ${E(rt.why)} Checks: ${ev.checks.map(x=>E(x.n.split(" ")[0])+" "+CKP(x.st)[0].toLowerCase()).join(", ")}.</div>`,
  onSubmit:v=>{F.reqs.unshift({id:"REQ-"+(F.seq.req++),kind:"Certify connector",ref:c.id,t:"Promote "+c.name+" to certified",route:rt,state:rt.k==="auto"&&!ev.fails?"Decided":"Waiting",at:0});
   if(rt.k==="auto"&&!ev.fails){c.tier="certified";c.status="healthy";c.env="Production";toast("Auto-approved: "+c.name+" is certified","good")}else toast("Routed to "+rt.n,"good");audit("Data layer certification requested",c.name+" routed to "+rt.n);closeDrawer();render()}})}
function bfForm(id){
 const c=conn(id);if(isCore()&&!allowed(c)){unlockDrawer("Backfill needs the Integration edition.");return}
 openForm({id:"fab_bf",title:"Backfill "+c.name,story:"Replays a date range through the same pipeline. Records already loaded are skipped by their idempotency keys, so a backfill is safe to repeat.",submit:"Start backfill",
  fields:[{k:"from",label:"From",type:"date",req:true},{k:"to",label:"To",type:"date",req:true}],defaults:{from:isoDay(-7),to:isoDay(0)},
  onSubmit:v=>{const d=Math.max(1,Math.round((Date.parse(v.to)-Date.parse(v.from))/86400000)+1),read=d*(c.lag>5000?60:120);const same_=Math.round(read*.8);
   newRun(c,{read,valid:read,loaded:read-same_,same:same_,events:read-same_,kind:"backfill "+v.from+" to "+v.to,dur:20+d*3});F.usage++;audit("Data layer backfill",c.name+": "+v.from+" to "+v.to+", "+read+" read, "+same_+" skipped as already loaded");toast("Backfill done: "+(read-same_)+" new, "+same_+" skipped","good");closeDrawer();render()}})}
/* ---------- screen ---------- */
/* another tenant: its own connectors and mappings (pack rows, sample data), labeled gaps for the parts it has no rows for */
function tenantScreen(){
 const C=CONNS().filter(c=>c.kind!=="roadmap"),Mp=MAPS(),org=(DATA.tenantInfo()||{}).org||"";const cn=id=>(C.find(c=>c.id===id)||{name:id}).name;
 const n=f=>C.filter(f).length,ok=n(c=>c.status==="healthy"),ap=Mp.filter(m=>m.status==="approved").length;
 const ctab=C.length?`<div class="tscroll"><table><thead><tr><th>Connector</th><th>External system</th><th>Tier</th><th>Status</th><th>Feeds</th><th>Delay</th><th>Owner and backup</th></tr></thead><tbody>${C.map(c=>`<tr><td><b>${E(c.name)}</b><br><small class="muted">${E(c.id)}</small></td><td>${E(c.sys||"")}</td><td>${TIERP[c.tier]?tierPill(c.tier):E(c.tier||"")}</td><td>${stPill(c.status)}</td><td class="small">${E((c.ents||[]).join(", "))}</td><td class="num">${c.lag!=null?lagS(c.lag):""}</td><td>${c.owner?own_(c.owner):""}${c.backup?" "+own_(c.backup):""}</td></tr>`).join("")}</tbody></table></div>`:TGAP("connectors");
 const mtab=Mp.length?`<div class="tscroll"><table><thead><tr><th>Mapping</th><th>Connector</th><th>Source field</th><th>Feeds</th><th>Transform</th><th>Confidence</th><th>Status</th></tr></thead><tbody>${Mp.map(m=>`<tr><td class="num">${E(m.id)}</td><td>${E(cn(m.conn))}</td><td><code>${E(m.src)}</code> <small class="muted">${E(m.srcType||"")}</small></td><td>${E(ENTLBL(m.ent))}.${E(m.k)}</td><td>${E(m.tf||"")}</td><td class="num">${m.conf!=null?Math.round(m.conf*100)+"%":""}</td><td>${pill(m.status,m.status==="approved"?"good":m.status==="proposed"||m.status==="review"?"warn":"mute")}</td></tr>`).join("")}</tbody></table></div>`:TGAP("mappings");
 const over=kpiRow([["Connectors",C.length,"sample data"],["Healthy",ok,"of "+C.length],["Certified",n(c=>c.tier==="certified"),"approved"],["Mappings",Mp.length,ap+" approved"]])+`<div style="margin-top:14px">${card("Connectors","Sample connectors of "+E(org)+"; runs are simulated",ctab)}</div>`;
 const g=(t,w)=>card(t,"",TGAP(w));
 const panes=[over,card("Connectors",C.length+" connectors",ctab),card("Mappings",Mp.length+" mappings from source fields to records",mtab),g("Field authority","field authority overrides"),
  g("Runs and quarantine","connector runs and quarantined records"),g("Reconciliation","reconciliation items"),g("M2M projects","machine-to-machine projects"),g("Event bus","canonical change events")];
 const story=`<b data-role="metric">${C.length}</b> sample connectors of ${E(org)} feed records through <b data-role="metric">${Mp.length}</b> mappings; <b data-role="metric">${ok}</b> are healthy. Connector runs are simulated.`;
 return `<div class="screen fabx">${hero("Platform","Integration fabric: feed any field, keep control",story,`<div class="row" style="gap:8px;flex-wrap:wrap">${fchipT("m_fab_fresh")}${fchipT("m_fab_quar")}${fchipT("m_fab_cov")}</div>`)}${lensNote()}${views("fab",["Overview","Connectors","Mappings","Field authority","Runs and quarantine","Reconciliation","M2M projects","Event bus"],panes)}${procCard("plat_fab")}</div>`}
function screen(){
 if(!TCORE())return tenantScreen();
 ensure();sweepExpiry();syncMetrics();
 const ac=activeConns(),s=slaStats(),fed=new Set(apprMaps().map(m=>m.ent+"."+m.k)).size;
 const story=`<b data-role="metric">${ac.length}</b> connectors feed <b data-role="metric">${fed}</b> registry fields, and <b data-role="metric">${s.pct}%</b> meet their freshness target. Take the project schedule: ${U.esc(BRAND.name)} is authoritative, while dates arrive from Planner and Jira (Project Online retired on Sept 30). <b data-role="metric">${qOpen().length}</b> records wait in quarantine and <b data-role="metric">${rOpen().length}</b> differences need a decision. ${isCore()?"You are on the free Base edition, so this is a live preview.":"Edition: "+ED[F.edition].n+"."}`;
 const extra=`<div class="row" style="gap:8px;flex-wrap:wrap">${fchipT("m_fab_fresh")}${fchipT("m_fab_quar")}${fchipT("m_fab_cov")}${stdChip("dmbok","Data integration and interoperability, data quality and metadata: each field has a steward, an authority and a quality rule, and every load is validated and audited.")}${isCore()?`<button class="btn primary" data-fab-unlock>Unlock the Integration edition</button>`:""}</div>`;
 const panes=[paneOver(),paneConn(),paneMap(),paneAuth(),paneRuns(),paneRecon(),paneM2M(),paneBus()];
 return `<div class="screen fabx">${hero("Platform","Integration fabric: feed any field, keep control",story,extra)}${lensNote()}${views("fab",["Overview","Connectors","Mappings","Field authority","Runs and quarantine","Reconciliation","M2M projects","Event bus"],panes)}${procCard("plat_fab")}</div>`}
REG("plat_fab","Integration fabric","platform","M3 12h5l2-6 4 12 2-6h5",screen);
DATA.screen("plat_fab",{mode:"data",entities:["connectors","work_items","metrics"]});
/* ---------- events ---------- */
const CL={
 fabUnlock:()=>unlockDrawer(),fabKey:()=>keyForm(),
 fabEd:v=>{F.edition=v;if(v==="core")F.key="";else if(!F.key)F.key="FAB-MSF-2026-7Q4K";audit("Data layer edition switched",ED[v].n+" (demo switch)");toast("Edition: "+ED[v].n);closeDrawer();render()},
 fabConn:v=>connDrawer(v),fabRun:v=>runSample(v),fabBf:v=>bfForm(v),fabCert:v=>certForm(v),
 fabExpire:v=>{expireConn(conn(v));toast("Expired. A decommission task was created.","warn");connDrawer(v);render()},
 fabNewconn:()=>connForm(),fabMapconn:v=>{F.mapConn=v},
 fabPropose:v=>{if(isCore()){unlockDrawer("Proposing mappings needs the Integration edition.");return}proposeFor(v)},
 fabApprall:v=>{if(isCore()){unlockDrawer("Approving mappings needs the Integration edition.");return}const ids=MAPS().filter(m=>m.conn===v&&m.status==="proposed"&&m.conf>=.85).map(m=>m.id);if(!ids.length){toast("Nothing at 85% or more is waiting","warn");return}setMapStatus(ids,"approved");render()},
 fabApprmap:v=>{if(isCore()){unlockDrawer("Approving mappings needs the Integration edition.");return}setMapStatus([v],"approved");closeDrawer();render()},
 fabRejmap:v=>{setMapStatus([v],"rejected");closeDrawer();render()},fabChg:v=>chgForm(v),fabTest:v=>dryRun(v),
 fabOvr:v=>ovrForm(v),fabOvrreset:v=>{delete F.ovr[v];audit("Data layer override reset",v);toast("Back to the registry default");closeDrawer();render()},
 fabFix:v=>fixForm(v),fabRequeue:v=>{const q=F.quar.find(x=>x.id===v);q.status="open";q.attempts=0;audit("Data layer requeued",v);toast("Requeued");quarDrawer(v);render()},
 fabWi:v=>wiForm(v),fabRes:v=>{if(isCore()){unlockDrawer("Resolving differences needs the Integration edition.");return}const p=v.split(":");resolveRecon(p[0],p[1])},
 fabPj:v=>projDrawer(v),fabEval:v=>{const p=F.proj.find(x=>x.id===v);if(startEval(p)){render();projDrawer(v)}},fabRoute:v=>{const p=F.proj.find(x=>x.id===v);sendRoute(p);render();projDrawer(v)},fabDecide:v=>decideForm(v),fabNewm2m:()=>m2mForm(),
 fabReplay:v=>{const r=RUNS().find(x=>x.id===v),c=conn(r.conn);newRun(c,{read:r.read,valid:r.valid,same:r.loaded,loaded:0,kind:"replay of "+r.id,idem:r.idem});audit("Data layer run replayed",r.id+": nothing changed, idempotency keys matched");toast("Replayed "+r.id+": nothing changed, every key matched","good");closeDrawer();render()},
 fabRetry:v=>{const r=RUNS().find(x=>x.id===v),c=conn(r.conn);r.status="ok";r.err="";r.loaded=Math.round(60+hs(v)%80);r.read=r.loaded;r.valid=r.loaded;r.events=r.loaded;r.retries++;audit("Data layer run retried",v+" succeeded after retry");toast("Retry succeeded","good");closeDrawer();render()},
 fabTab:(v)=>{closeDrawer();goTab(+v)}};
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-fab-unlock],[data-fab-key],[data-fab-ed],[data-fab-conn],[data-fab-run],[data-fab-bf],[data-fab-cert],[data-fab-expire],[data-fab-newconn],[data-fab-mapconn],[data-fab-propose],[data-fab-apprall],[data-fab-apprmap],[data-fab-rejmap],[data-fab-chg],[data-fab-test],[data-fab-ovr],[data-fab-ovrreset],[data-fab-fix],[data-fab-requeue],[data-fab-wi],[data-fab-res],[data-fab-pj],[data-fab-eval],[data-fab-route],[data-fab-decide],[data-fab-newm2m],[data-fab-replay],[data-fab-retry],[data-fab-tab]");
 if(!t||t.disabled)return;ensure();
 Object.keys(t.dataset).filter(k=>CL[k]).sort((a,b)=>(a==="fabTab")-(b==="fabTab")).forEach(k=>CL[k](t.dataset[k],t))});
DND.on("fab_m2m",(id,from,to)=>{const p=F.proj.find(x=>x.id===id);if(!p||from===to){render();return}
 const f=p.stage;
 if(f==="proposed"&&to==="evaluating")startEval(p);
 else if(f==="evaluating"&&to==="awaiting")sendRoute(p);
 else if(f==="awaiting"&&(to==="certified"||to==="project"||to==="rejected")){render();decideForm(id);return}
 else toast("Projects move one step at a time: propose, evaluate, route, decide.","warn");
 render()});
/* ---------- process, search, ask, work, public API ---------- */
PROC.reg("plat_fab",{title:"How a connector or feed goes live",std:["dmbok","togaf"],steps:[
 {n:"Propose",d:"Anyone proposes a connector or machine-to-machine project: purpose, systems, entities and fields from the registry, direction, volume, owner, risk.",who:"human",owner:"Requester",out:"Proposal"},
 {n:"Contract and duplicate check",d:"Fields are checked against the registry and the reuse check looks for an existing connector or entity.",who:"robot",owner:"Platform",out:"Fit report"},
 {n:"Security and sandbox test",d:"The Integration Agent reviews scopes, secret references and data class, then runs a 200 record sandbox sample.",who:"agent",owner:"Integration Agent",out:"Review and sample result"},
 {n:"Approval route",d:"Low risk, read-only, internal data on a certified connector type auto-approves. Standard goes to the platform team plus security. High risk or sensitive data goes to the data council.",who:"gate",owner:"Platform team, security or data council",sla:"Instant to 5 days",out:"Certified, project-scoped with expiry, or rejected"},
 {n:"Go live",d:"Secret stored as a vault reference, service identity created, mappings approved, schedule or stream started.",who:"robot",owner:"Platform",out:"Running connector"},
 {n:"Run, validate, load",d:"Extract, validate against the contract, transform, match and merge by field authority, load with idempotency keys, publish change events.",who:"robot",owner:"Platform data layer",out:"Registry updated"},
 {n:"Fix quarantine and reconcile",d:"Stewards fix and replay quarantined records and decide differences on shared fields.",who:"human",owner:"Data steward",out:"Resolved items"},
 {n:"Expire or recertify",d:"Project-scoped connectors close at expiry and open a decommission task.",who:"robot",owner:"Platform",out:"Decommission task"}]});
SEARCHX.push(()=>{ensure();return CONNS().filter(c=>c.kind!=="roadmap").map(c=>({g:"Integration fabric",t:c.name,m:(TIERP[c.tier]||[c.tier])[0],c:"--p4",f:()=>{go("plat_fab");if(TCORE())setTimeout(()=>connDrawer(c.id),150)},k:c.name+" connector "+c.sys+" "+(c.ents||[]).join(" ")+" integration fabric"})).concat((TCORE()?F.proj:[]).map(p=>({g:"Integration fabric",t:p.id+" "+p.t,m:"M2M project",c:"--p4",f:()=>{go("plat_fab");setTimeout(()=>projDrawer(p.id),150)},k:p.t+" machine to machine integration project"})))});
ASKX.push(q=>{const t=q.toLowerCase();
 if(/how fresh|freshness|how current|how up to date/.test(t)&&/schedule|project (date|plan)|planned|task date|dates/.test(t)){ensure();
  const sf=eff("project_task","planned_finish"),ml=MAPS().filter(m=>m.ent==="project_task"&&m.k==="planned_finish"&&m.status==="approved"),lg=ml.length?Math.min(...ml.map(m=>m.lag==null?conn(m.conn).lag:m.lag)):null;
  S.v.fab=3;go("plat_fab");say(q,{t:"The project schedule is <b>"+sf.auth+"</b> authority with a <b>"+FR[sf.fresh].l.toLowerCase()+"</b> target ("+FR[sf.fresh].mode.toLowerCase()+"). Dates arrive from "+(ml.map(m=>conn(m.conn).name).join(" and ")||"no connector")+(lg!=null?", about "+lagS(lg)+" behind the source, so the target is "+(lg<=FR[sf.fresh].s?"met":"missed")+".":".")+" Differences open a reconciliation item.",steps:["Read the field authority for planned finish","Compared the connector lag with the target","Opened Field authority"]});return true}
 if(/open the fabric|integration fabric|show the fabric|go to the fabric|data fabric/.test(t)){S.v.fab=0;go("plat_fab");say(q,{t:"Opened the Integration fabric: edition, limits, connector health and what needs attention.",steps:["Opened Integration fabric"]});return true}
 if(/which connectors|list (the )?connectors|what connectors|connectors do we have/.test(t)){ensure();S.v.fab=1;go("plat_fab");const cs=CONNS().filter(c=>c.kind!=="roadmap");
  say(q,{t:"There are <b>"+cs.length+"</b> connectors: "+cs.filter(c=>c.tier==="certified").length+" certified, "+cs.filter(c=>c.tier==="community").length+" community (sandbox only) and "+cs.filter(c=>c.tier==="project").length+" project-scoped. Launch connectors: Generic REST, MCP, identity provider and Microsoft Graph. On the roadmap: Perplexity, IDE tools, ERP, HR, CRM and ITSM.",steps:["Listed connectors by tier","Opened Connectors"]});return true}
 if(/quarantine|dead letter|reconcil/.test(t)&&/fabric|integration|quarantine|reconcil/.test(t)){ensure();S.v.fab=/reconcil/.test(t)?5:4;go("plat_fab");say(q,{t:"<b>"+qOpen().length+"</b> records are in quarantine and <b>"+rOpen().length+"</b> differences await a decision on shared fields.",steps:["Counted open items"]});return true}
 return false});
window.WORK&&WORK.push({kind:"Integration work items",tag:"WI",fn:n=>{ensure();return WIS().filter(w=>w.who===n&&w.st==="open").map(w=>({id:w.id,t:w.t,sub:w.sub,due:w.due,st:"warn",hrs:1,go:()=>{S.v.fab=5;go("plat_fab")}}))}});
window.FAB={
 get connectors(){ensure();return CONNS().filter(c=>c.kind!=="roadmap").map(c=>({id:c.id,name:c.name,tier:c.tier,status:c.status,owner:c.owner,fields:fedCount(c.id),entities:(c.ents||[]).slice()}))},
 get runs(){ensure();return RUNS()},get quarantine(){ensure();return TCORE()?F.quar:[]},get projects(){ensure();return TCORE()?F.proj:[]},
 open(id){ensure();connDrawer(id)},openProject(id){ensure();projDrawer(id)},openQuarantine(id){ensure();quarDrawer(id)},
 edition(){return F.edition},limits(){return ED[F.edition]},
 freshness(ent,k){ensure();const m=eff(ent,k);return{authority:m.auth,target:m.fresh,mode:FR[m.fresh].mode}}};
})();
