/* mod_selfbuild: Oukala manages its own build. Loads the prototype backlog into Demand, Projects, WBS and RAID, then shows the gap analysis. */
(function(){
const WS=[["Planning and WBS","wbs",["WBS task sheet","Master schedule","Baselines","Network diagram"],95],["Projects, demand and RAID","ppm",["Demand and scoring","Projects and teams","RAID log"],90],["SOW and contracts","sow",["Repository","Analyzer","Playbook","Change requests"],85],["Maturity models","exec",["Model library","Glide path","What-if"],85],["Incident, problem, change","itsm",["Priority engine","Fishbone","Approval policies","Calendar"],88],["Releases and agile","rel",["Release readiness","Sprints and backlog","Release trains"],80],["Service 360 and TBM","svc360",["Impact analysis","Seven-lens service view","Cost transparency"],85],["Catalog and portal","svc",["Catalog","Fulfillment workflows","Portal"],80],["SLA, XLA, on-call, skills","sla",["Agreement designer","Coverage","Rotas","Skills database"],78],["CMDB and CSDM","itom",["Data model","Dependency graph","Ingestion"],85],["Observability and DevOps","obs",["Event management","Automation","Pipeline","Master maps"],78],["Workflow designer and approvals","flow",["Designer","Decision tables","Approvals","Assessments"],82],["People and resourcing","people",["Org chart","Performance","Capacity","Journey maps"],80],["Chat and agents","chat",["Threads","Tool registry","Guardrails"],85],["Visualization builder","viz",["Chart types","Maps","Shape charts"],85],["Knowledge lifecycle","know",["Lifecycle","Agent skills","Living graph"],85]];
const GAPS=[
["P1","Scale","Screens over 800 ms at Enterprise scale (itom_evt, ppm_proj, exe_mat, ppm_sow, svc_sla)","Cache computed data; build generated data lazily; virtualize first paint","ppm"],
["P1","Persistence","All data is in memory. Nothing survives reload","Add a data layer (database or document store) behind the same registries","platform"],
["P1","Security","No real login, roles or row-level security; personas are simulated","Single sign-on, role and permission service, audit store","platform"],
["P2","Integrations","SolarWinds, Intune, Entra, GitHub, HRIS feeds are simulated payloads","Build connectors and an ingestion service with mapping and reconciliation","cmdb"],
["P2","AI","Planner, analyzers and agents are rule-based, not model-backed","Model gateway with evaluations, guardrails and cost control","chat"],
["P2","Documents","PDF and Word contract parsing needs a document service","OCR and extraction service feeding the SOW analyzer","sow"],
["P2","Visual","BPMN text, Gantt legend and network diagram readability still below target","Zoomable canvases with minimum label sizes","flow"],
["P2","Process","Dashboard-and-list first view still missing on a few admin and budget tabs","Adopt kpi() and statrow on remaining tabs","core"],
["P3","Standards","ITIL 5 and CSDM 5 mappings are summaries, not full practice guides","Curate practice libraries and mapping tables","itsm"],
["P3","Quality","No automated regression suite beyond scans","Playwright suite per screen plus visual diffs in CI","core"],
["P3","Knowledge","Live Obsidian connector deferred","Read and write vault notes through a connector","know"]];
let done=false;
function seed(){
 if(done)return;done=true;const _t=window.toast;window.toast=function(){};
 try{
 let pid=null;
 try{ if(window.addProject){const r=window.addProject({name:"Oukala platform build: prototype to pilot",short:"Oukala build",pm:"Omar Hamid",cost:1850,src:"self-build"});pid=r&&r.id||(PROJ[PROJ.length-1]||{}).id}}catch(e){console.warn("selfbuild project",e)}
 if(pid&&window.PPMX&&PPMX.addTasks){
  try{WS.forEach(w=>{PPMX.addTasks(pid,w[2].map((n,i)=>({n:w[0]+": "+n,dur:3+i*2,own:"Omar Hamid"})),{phase:w[0],own:"Omar Hamid"})})}catch(e){console.warn("selfbuild tasks",e)}
 }
 try{(window.PPMRAID||[]).push(
  {id:"R-OB1",t:"R",p:pid||"PR1",n:"Prototype data is in memory only; a pilot needs a persistence layer",d:"Every record disappears on reload.",pr:4,im:5,cost:0,own:"Omar Hamid",acc:"Omar Hamid",s:"open",due:"2026-11-30"},
  {id:"R-OB2",t:"R",p:pid||"PR1",n:"No real authentication or row-level security",d:"Personas are simulated.",pr:3,im:5,cost:0,own:"Omar Hamid",acc:"Omar Hamid",s:"open",due:"2026-12-15"},
  {id:"R-OB3",t:"R",p:pid||"PR1",n:"Screens slow at Enterprise scale",d:"Several screens exceed 800 ms.",pr:4,im:3,cost:0,own:"Omar Hamid",acc:"Omar Hamid",s:"open",due:"2026-11-15"})}catch(e){}
 try{if(window.addDemand)GAPS.filter(g=>g[0]!=="P3").forEach(g=>addDemand({title:g[1]+": "+g[2],reason:g[3],source:"Self-build gap analysis",cost:60,kind:"Platform build",pm:"Omar Hamid"}))}catch(e){}
 try{if(window.audit)audit("Self-build loaded","Oukala backlog loaded into Demand, Projects, WBS and RAID")}catch(e){}
 }finally{window.toast=_t}
}
const pill=p=>`<span class="pill ${p==="P1"?"bad":p==="P2"?"warn":"info"}">${p}</span>`;
REG("plat_self","Self-build","platform","M4 6h16M4 12h10M4 18h16",()=>{
 seed();
 const avg=Math.round(WS.reduce((a,w)=>a+w[3],0)/WS.length);
 const tasks=WS.reduce((a,w)=>a+w[2].length,0);
 return `<div class="hero" style="min-height:0;padding:18px 22px"><h1 style="margin:0">Oukala managing its own build</h1><p class="muted" style="margin:4px 0 0">The prototype backlog is loaded into Demand, Projects, the WBS and the RAID log. The gaps below came from running the tool on itself.</p></div>
 <div class="statrow" style="margin-top:14px"><div class="stat"><small>Workstreams</small><span class="num">${WS.length}</span><em>one per module</em></div><div class="stat"><small>Work packages</small><span class="num">${tasks}</span><em>in the WBS</em></div><div class="stat"><small>Average built</small><span class="num">${avg}%</span><em>prototype depth</em></div><div class="stat"><small>Open gaps</small><span class="num">${GAPS.length}</span><em>${GAPS.filter(g=>g[0]==="P1").length} priority 1</em></div></div>
 <div class="grid g2" style="margin-top:14px;gap:16px">
 <section class="card glass"><h3>Gap analysis</h3><div class="tscroll"><table><thead><tr><th>Priority</th><th>Area</th><th>Gap</th><th>Next step</th></tr></thead><tbody>${GAPS.map(g=>`<tr><td>${pill(g[0])}</td><td><b>${g[1]}</b></td><td style="white-space:normal;min-width:220px">${g[2]}</td><td style="white-space:normal;min-width:220px" class="muted">${g[3]}</td></tr>`).join("")}</tbody></table></div><div class="row" style="margin-top:10px;gap:8px"><button class="btn" onclick="go('port')">Open in Demand</button><button class="btn" onclick="go('ppm_wbs')">Open the WBS</button><button class="btn" onclick="go('ppm_raid')">Open the RAID log</button></div></section>
 <section class="card glass"><h3>Workstreams</h3><div class="tscroll"><table><thead><tr><th>Workstream</th><th>Module</th><th>Built</th></tr></thead><tbody>${WS.map(w=>`<tr><td style="white-space:normal;min-width:180px"><b>${w[0]}</b><span class="sub">${w[2].join(", ")}</span></td><td class="small">mod_${w[1]}</td><td style="min-width:130px"><div style="height:8px;border-radius:6px;background:var(--hair)"><div style="width:${w[3]}%;height:100%;border-radius:6px;background:var(--accent)"></div></div><span class="small muted">${w[3]}%</span></td></tr>`).join("")}</tbody></table></div></section></div>`;
});
})();
