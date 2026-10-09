/* mod_plat_registry: the Oukala platform registry. One catalog of entities, fields, apps, duplicate fixes and planned entities.
   Other platform modules (fabric, links, debt, gate) read window.PLAT. Screen: plat_reg. */
(function(){
S.plat=S.plat||{applied:{},proposals:[],sel:null};
const E=esc;
/* ---------- domains and ownership ---------- */
const DOM={
 people:{n:"People and work",steward:"Head of People Operations",ent:["person","skill_claim","skill","time_off","oncall_shift"]},
 portfolio:{n:"Portfolio and projects",steward:"Portfolio office lead",ent:["demand_request","project","project_task","wbs_line","raid_item","maturity_capability"]},
 agile:{n:"Agile and releases",steward:"Release manager",ent:["feature","user_story","release","release_task","pull_request"]},
 service:{n:"Service management",steward:"Service desk manager",ent:["incident","problem_record","change_request","change_approval_policy","incident_priority_policy","standard_change","catalog_item","catalog_task","request_item","fulfillment_step","service_offering"]},
 cmdb:{n:"Services and configuration",steward:"Configuration manager",ent:["business_service","cmdb_rel_ci","asset","core_company","ast_contract"]},
 ops:{n:"Operations and observability",steward:"Operations lead",ent:["alert_event","alert_rule","correlation_group","false_positive_feedback","maintenance_window","automation_rule","runbook_execution","metric_series","dashboard","log_pattern","slo","synthetic_check"]},
 agree:{n:"Agreements and vendors",steward:"Service level manager",ent:["sla_definition","task_sla","xla_response","vendor_ticket"]},
 fin:{n:"Finance and contracts",steward:"Finance controller",ent:["invoice","cost_allocation","scaling_step","contract","contract_line","contract_obligation","contract_change"]}
};
const CIFAM="cmdb_ci";
const domOf=t=>{if(t.indexOf("cmdb_ci")===0)return"cmdb";for(const k in DOM)if(DOM[k].ent.includes(t))return k;return"ops"};
const STEW={person:"Head of People Operations",invoice:"Finance controller",incident:"Service desk manager",change_request:"Change manager",project:"PMO director",contract:"General counsel delegate"};
const CLS_ORDER=["public","internal","confidential","restricted","personal"];
const RET={fin:"7 years",people:"Employment plus 7 years",service:"5 years",ops:"13 months hot, 5 years cold",cmdb:"Life of item plus 3 years",portfolio:"7 years",agile:"3 years",agree:"7 years"};
/* ---------- field-level metadata: authority, direction, freshness, class, quality rule ---------- */
const hash=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%9973;return h};
function fieldMeta(t,f){
 const k=f.k,ty=f.type||"string",dm=domOf(t),isCI=t.indexOf("cmdb_ci")===0;
 let auth="platform",fresh="live",cls="internal",why="Created and edited in Oukala";
 if(t==="person"){ if(/skills|load|kind|hours/.test(k)){auth="platform";why="Oukala work data"}else{auth="external";fresh="near-live";why="Identity provider and HR are authoritative"} }
 else if(t==="time_off"){auth="external";fresh="hourly";why="HR system is authoritative"}
 else if(t==="project_task"||t==="wbs_line"){ if(/start|finish|duration|actual|percent/.test(k)){auth="shared";fresh="hourly";why="External planning tool wins dates; Oukala wins dependencies and cost"} }
 else if(t==="invoice"){ if(/amount|status|paid|po|accepted/.test(k)){auth="external";fresh="daily";why="ERP is authoritative for posted amounts"} }
 else if(isCI){ if(/discovered|status|uptime|class|environment|ip|os|serial|cpu|ram|disk|model|firmware|version/.test(k)){auth="external";fresh="hourly";why="Discovery tools are authoritative for attributes"}else if(/owned|support|criticality|business|service/.test(k)){auth="platform";why="Oukala owns relationships, ownership and service mapping"} }
 else if(t==="alert_event"||t==="metric_series"||t==="log_pattern"||t==="synthetic_check"){auth="external";fresh=t==="alert_event"?"live":"near-live";why="Monitoring tools are authoritative"}
 else if(t==="pull_request"){auth="external";fresh="near-live";why="Source control is authoritative"}
 else if(t==="user_story"||t==="feature"){auth="shared";fresh="near-live";why="Agile tool and Oukala both edit; newest wins with review"}
 else if(t==="incident"||t==="change_request"||t==="request_item"){ if(/state|assignment/.test(k)){fresh="near-live"} }
 if(/amount|cost|price|budget|rate|paid|salary|spend/.test(k)||ty==="currency")cls="confidential";
 if(/email|phone|home|birth|manager|caller|requested_for/.test(k))cls="personal";
 if(t==="person"&&/rate|contract|hours/.test(k))cls="restricted";
 if(/contract|clause|liability/.test(t+k))cls=cls==="restricted"?cls:"confidential";
 if(/^id$|number|name|label|state|status/.test(k)&&cls==="internal")cls="internal";
 const dir=auth==="platform"?"out":auth==="external"?"in":"both";
 const conflict=auth==="platform"?"Oukala wins":auth==="external"?"External system wins":"Newest wins, differences open a reconciliation item";
 const trust=auth==="platform"?0.98:Math.round((0.72+(hash(t+k)%24)/100)*100)/100;
 const rule={ref:"Must resolve to a live record",date:"Valid date; finish is on or after start",datetime:"Valid timestamp, not in the future unless a plan",currency:"Zero or more, two decimals, currency set",enum:"One of the allowed values",percent:"0 to 100","boolean":"True or false",number:"Number in range",list:"No duplicates, each item in catalog",duration:"Non-negative duration"}[ty]||"Trimmed text, required when marked";
 return{auth,dir,fresh,cls,why,conflict,trust,rule};
}
/* ---------- planned entities (gaps found in the catalog) ---------- */
const PLANNED=[
 ["budget_line","fin","Budget line","Finance controller","Today budget numbers live inside invoice, project and TBM views. One budget line gives every app the same figure.","Budget screens, project cost, TBM"],
 ["forecast_entry","fin","Forecast entry","Finance controller","Forecast is typed in several places. One entity makes variance a computed field.","Budget forecast, portfolio"],
 ["purchase_order","fin","Purchase order","Procurement lead","Invoices reference a PO that has no record of its own.","Invoices, vendor management"],
 ["cost_center","fin","Cost center","Finance controller","Needed for allocation and showback. ERP is authority.","Cost transparency"],
 ["gl_account","fin","GL account","Finance controller","Needed to map spend to the ledger. ERP is authority.","Cost transparency, budget"],
 ["vendor","fin","Vendor","Procurement lead","Vendors appear as text on invoices, contracts and tickets. One vendor record ends the drift.","Contracts, invoices, vendor tickets"],
 ["customer_or_stakeholder","people","Stakeholder","Portfolio office lead","Stakeholders are free text in projects and demand.","PPM, communications"],
 ["organization_unit","people","Organization unit","Head of People Operations","Teams exist as strings. A real org tree drives assignment and access.","Directory, RBAC"],
 ["position","people","Position","Head of People Operations","Headcount planning needs positions apart from people.","Capacity, hiring"],
 ["application","cmdb","Application","Enterprise architect","Business apps are CI subtypes today; a first-class entity serves the registry and the citizen-app gate.","Application portfolio, citizen apps"],
 ["data_asset","cmdb","Data asset","Data council chair","Classification, retention and lineage need an asset to attach to.","Governance, privacy"],
 ["integration","cmdb","Integration","Integration lead","Each connector instance needs a record with owner, cost and health.","Fabric"],
 ["environment","cmdb","Environment","Platform lead","Dev, test, prod and sandboxes are strings today.","DevOps, promotion"],
 ["risk","portfolio","Risk","Risk manager","Risks sit in RAID and enterprise risk separately.","RAID, enterprise risk"],
 ["control","portfolio","Control","Compliance lead","Evidence collection needs controls as records.","Compliance evidence"],
 ["policy","portfolio","Policy","Compliance lead","Policies are documents. A record lets rules link to them.","Governance, gate"],
 ["exception","portfolio","Exception","Data council chair","Overrides of the no-duplicate rule need an owner and an expiry.","Debt ledger"],
 ["decision","portfolio","Decision","PMO director","Decisions are buried in meeting notes.","Governance, audit"],
 ["document","people","Document","Records manager","Attachments are per module.","Everything"],
 ["knowledge_article","people","Knowledge article","Knowledge manager","Articles live in the knowledge module only; others link by text.","Incidents, requests"],
 ["approval_policy","service","Approval policy","Process governance lead","Replaces change_approval_policy and per-domain approval rules.","Every approval path"],
 ["approval","service","Approval","Process governance lead","One approval record for changes, invoices, budgets and requests.","Every approval path"],
 ["notification","service","Notification","Platform lead","Core service; every module sends through it.","All"],
 ["subscription","service","Subscription","Platform lead","Who gets which notification and how.","All"],
 ["audit_event","service","Audit event","Security lead","Shared child entity replacing per-module audit trails.","All"],
 ["role","people","Role","Security lead","RBAC needs roles as records the registry can reference.","Access"],
 ["permission_policy","people","Permission policy","Security lead","ABAC rules attach to entities and fields.","Access"],
 ["tag","service","Tag","Platform lead","Shared labeling.","All"],
 ["debt_item","portfolio","Debt item","Platform lead","The technical debt ledger.","Debt ledger"],
 ["app_manifest","cmdb","App manifest","Platform lead","Declares what a citizen app reads, writes and reuses.","Citizen gate"],
 ["connector","cmdb","Connector","Integration lead","Catalog of enterprise-approved and project connectors.","Fabric"],
 ["mapping","cmdb","Mapping","Integration lead","Versioned field mapping from an external source to the registry.","Fabric"],
 ["sync_run","cmdb","Sync run","Integration lead","Each pipeline run with counts, errors and lineage.","Fabric"]
];
/* ---------- duplicate fixes ---------- */
const FIXES=[
 {id:"fx_skill",t:"Two skill records",ents:["skill","skill_claim"],keep:"skill_claim",plan:"Keep skill_claim (person, skill, evidence). Turn skill into a catalog of skill definitions named skill_def.",apps:["ppm_proj","svc_skills"],effort:"2 days",risk:"Low",debt:"Duplicate skill entity"},
 {id:"fx_work",t:"Task and WBS line are the same thing",ents:["project_task","wbs_line"],keep:"work_item",plan:"Create one work_item with parent, dates, effort and assignee. Portfolio plan and the WBS editor become two views of it.",apps:["port","ppm_wbs"],effort:"5 days",risk:"Medium",debt:"Duplicate work entity"},
 {id:"fx_contract",t:"Contract lives in two modules",ents:["contract","contract_line"],keep:"contract",plan:"Contract repository owns contract. The analyzer owns derived contract_line and contract_obligation and references contract by id.",apps:["ppm_sow","bud_ven"],effort:"3 days",risk:"Medium",debt:"Contract written by two owners"},
 {id:"fx_approval",t:"Approvals are modeled per domain",ents:["change_approval_policy"],keep:"approval",plan:"One approval_policy and one approval used by changes, invoices, budgets and requests. This also feeds the approval paths shown on process strips.",apps:["itsm_chg","inv","flw_appr"],effort:"6 days",risk:"High",debt:"Approval rules duplicated per domain"},
 {id:"fx_child",t:"Assignment, comment, attachment and audit are embedded in each module",ents:["incident","change_request","request_item","project"],keep:"assignment, comment, attachment, audit_event",plan:"Shared child entities referenced by id. Every module reads and writes them through the platform.",apps:["itsm_inc","itsm_chg","svc_cat","ppm_proj"],effort:"8 days",risk:"High",debt:"Child records duplicated per module"}
];
/* ---------- apps: who reads and writes which entity ---------- */
const APPS=[
 ["itsm_inc","Incidents","ITSM",["person","business_service","cmdb_ci","sla_definition","incident_priority_policy"],["incident","task_sla"]],
 ["itsm_chg","Changes","ITSM",["business_service","cmdb_ci","maintenance_window"],["change_request","change_approval_policy"]],
 ["itsm_prb","Problems","ITSM",["incident","business_service"],["problem_record"]],
 ["svc_cat","Service catalog","Service catalog",["service_offering","person"],["catalog_item","catalog_task","request_item","fulfillment_step"]],
 ["itom_cmdb","CMDB","CMDB",["person"],["cmdb_ci","cmdb_rel_ci","business_service"]],
 ["itom_evt","Event management","Event management",["cmdb_ci","maintenance_window"],["alert_event","alert_rule","correlation_group","false_positive_feedback","maintenance_window"]],
 ["itom_run","Automation","Automation",["alert_event","standard_change"],["automation_rule","runbook_execution","standard_change"]],
 ["obs_dash","Observability","Observability",["business_service"],["slo","synthetic_check","metric_series","dashboard","log_pattern"]],
 ["svc_sla","Agreements","Agreements",["incident","request_item","business_service"],["sla_definition","task_sla","xla_response"]],
 ["ppm_proj","Projects","PPM",["person","demand_request","business_service"],["project","raid_item","demand_request","skill"]],
 ["port","Portfolio plan","PPM",["project","person"],["project_task"]],
 ["ppm_wbs","WBS editor","Project plan",["project","person"],["wbs_line"]],
 ["ppm_sow","SOW and contract analyzer","Contract analyzer",["contract"],["contract","contract_line","contract_obligation","contract_change"]],
 ["bud_ven","Vendor management","Vendor management",["contract","invoice"],["vendor_ticket","contract"]],
 ["inv","Invoices","Finance",["contract","project"],["invoice"]],
 ["bud_over","Budget overview","Cost transparency",["invoice","project","business_service"],["cost_allocation","scaling_step"]],
 ["svc_skills","Skills database","Skills database",["person"],["skill_claim"]],
 ["svc_oncall","On-call","On-call",["person"],["oncall_shift","time_off"]],
 ["itsm_rel","Releases","Releases",["feature","user_story","change_request"],["release","release_task"]],
 ["agile_board","Sprints and backlogs","Sprints and backlogs",["person","feature"],["user_story"]],
 ["agile_art","Release trains","Release trains",["person"],["feature"]],
 ["exe_mat","Maturity models","Maturity models",["business_service","project"],["maturity_capability"]],
 ["ppl_org","Directory","Directory",["person"],["person"]],
 ["flw_appr","Approvals","Workflow",["change_request","invoice","request_item"],["change_approval_policy"]]
].map(a=>({id:a[0],n:a[1],mod:a[2],reads:a[3],writes:a[4]}));
/* ---------- derived views of the model ---------- */
const OVER={skill:{owner:"PPM"},skill_claim:{owner:"Skills database"}};
function entities(){
 const T=DATAMODEL.tables,out=[];let ciDone=false;
 Object.keys(T).forEach(t=>{
  const isCI=t.indexOf("cmdb_ci")===0;
  if(isCI&&t!==CIFAM){return}
  const v=T[t],dm=domOf(t),own=(OVER[t]&&OVER[t].owner)||v.source;
  const fx=FIXES.find(f=>f.ents.includes(t)),applied=fx&&S.plat.applied[fx.id];
  const fam=isCI?Object.keys(T).filter(x=>x.indexOf("cmdb_ci")===0):null;
  const fields=isCI?v.fields:v.fields;
  const readers=APPS.filter(a=>a.reads.includes(t)||(isCI&&a.reads.includes(CIFAM))).map(a=>a.id);
  const writers=APPS.filter(a=>a.writes.includes(t)||(isCI&&a.writes.includes(CIFAM))).map(a=>a.id);
  out.push({id:t,label:v.label,owner:own,steward:STEW[t]||DOM[dm].steward,domain:dm,fields:fields,nf:fields.length,fam:fam,
   cls:fields.reduce((m,f)=>{const c=fieldMeta(t,f).cls;return CLS_ORDER.indexOf(c)>CLS_ORDER.indexOf(m)?c:m},"internal"),
   ret:RET[dm],readers,writers,fix:fx&&fx.id,status:fx?(applied?"fixed":"duplicate"):"canonical",
   authMix:fields.reduce((m,f)=>{const a=fieldMeta(t,f).auth;m[a]=(m[a]||0)+1;return m},{})});
 });
 return out;
}
let _ent=null,_nt=0;
const PLAT=window.PLAT={DOM,APPS,FIXES,PLANNED,fieldMeta,domOf,CLS_ORDER,
 entities(){const n=Object.keys(DATAMODEL.tables).length;if(n!==_nt){_nt=n;_ent=null}return _ent||(_ent=entities())},refresh(){_ent=null},
 ent(id){return this.entities().find(e=>e.id===id)},
 app(id){return APPS.find(a=>a.id===id)},
 fieldsAll(){const o=[];this.entities().forEach(e=>e.fields.forEach(f=>{const m=fieldMeta(e.id,f);o.push(Object.assign({ent:e.id,entLabel:e.label,k:f.k,label:f.label,type:f.type||"string",owner:e.owner,domain:e.domain},m))}));return o},
 /* entities that more than one app writes, and writes by a non-owner: used by the debt ledger and the citizen gate */
 multiWriters(){return this.entities().filter(e=>e.writers.length>1).map(e=>({ent:e.id,apps:e.writers}))},
 nonOwnerWrites(){const o=[];this.entities().forEach(e=>e.writers.forEach(a=>{const ap=APPS.find(x=>x.id===a);if(ap&&ap.mod!==e.owner)o.push({ent:e.id,app:a,owner:e.owner,mod:ap.mod})}));return o},
 stats(){const es=this.entities(),fs=this.fieldsAll();const dups=FIXES.filter(f=>!S.plat.applied[f.id]).length;
  return{n:es.length,nf:fs.length,dups,planned:PLANNED.length,withOwner:es.filter(e=>e.owner&&e.steward).length,classified:fs.filter(f=>f.cls).length,
   extAuth:fs.filter(f=>f.auth==="external").length,shared:fs.filter(f=>f.auth==="shared").length,readers:es.reduce((a,e)=>a+e.readers.length,0),writers:es.reduce((a,e)=>a+e.writers.length,0),
   reuse:Math.round(100*(1-es.filter(e=>e.status==="duplicate").length/Math.max(1,es.length)))}},
 apply(fxid){S.plat.applied[fxid]=true;this.refresh();const f=FIXES.find(x=>x.id===fxid);audit("Registry fix applied",f.t+": "+f.plan.slice(0,80));toast("Applied: "+f.t,"good");render()},
 revert(fxid){delete S.plat.applied[fxid];this.refresh();render()}
};
/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_reg_own:{n:"Entities with owner and steward",f:"Entities with a named owner module and steward ÷ all registered entities × 100",u:"%",cur:100,tgt:100,badAt:90,dir:"max",max:100,tr:[82,86,90,94,96,98,100,100],owner:"Platform team",use:["Platform registry"],rem:{kind:"sop",ref:"SOP-710",title:"Assign an owner and steward to a new entity",agent:"Registry Agent",auto:false,state:"idle",prog:"Proposes an owner from the module that writes it"}},
 m_reg_dup:{n:"Duplicate entities open",f:"Count of entities flagged as duplicates with no applied fix",u:"",cur:5,tgt:0,badAt:5,dir:"min",max:10,tr:[3,3,4,4,5,5,5,5],owner:"Data council",use:["Platform registry","Debt ledger"],rem:{kind:"agent",ref:"AG-REG1",title:"Preview and apply the fix",agent:"Registry Agent",auto:false,state:"idle",prog:"Shows affected apps and a rollback before applying"}},
 m_reg_class:{n:"Fields with classification and authority",f:"Fields with both a classification label and a declared authority ÷ all fields × 100",u:"%",cur:96,tgt:100,badAt:85,dir:"max",max:100,tr:[70,75,80,84,89,92,95,96],owner:"Data council",use:["Platform registry"],rem:{kind:"agent",ref:"AG-REG2",title:"Propose labels from field names and samples",agent:"Registry Agent",auto:false,state:"idle",prog:"Drafts a label, a steward confirms"}},
 m_reg_reuse:{n:"Reuse rate",f:"Entities with a single writer and no duplicate ÷ all entities × 100",u:"%",cur:90,tgt:95,badAt:75,dir:"max",max:100,tr:[70,74,78,82,85,88,89,90],owner:"Platform team",use:["Platform registry","Citizen gate"],rem:{kind:"kb",ref:"KB0710",title:"Reuse before you build",agent:"Registry Agent",auto:false,state:"idle",prog:"Suggests an existing entity during design"}}
});
/* ---------- screen ---------- */
const AUTHP={platform:"good",external:"info",shared:"warn"},CLSP={public:"mute",internal:"mute",confidential:"warn",restricted:"bad",personal:"bad"};
const pill_=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
function regScreen(){
 const s=PLAT.stats(),es=PLAT.entities();METRICS.m_reg_dup.cur=s.dups;METRICS.m_reg_reuse.cur=s.reuse;
 const dmCounts=Object.keys(DOM).map(k=>[DOM[k].n,es.filter(e=>e.domain===k).length]);
 const hero_=hero("Platform registry","One catalog every app builds on",`<b data-role="metric">${s.n}</b> canonical entities and <b data-role="metric">${s.nf.toLocaleString()}</b> fields, each with an owner, a steward, a classification and a declared authority. <b data-role="metric">${s.dups}</b> duplicates are open and <b data-role="metric">${s.planned}</b> core entities are still missing. Citizen apps read this registry before they build anything.`,
  `<div class="row">${fchip("m_reg_own")}${fchip("m_reg_dup")}${fchip("m_reg_class")}${fchip("m_reg_reuse")}<button class="btn primary" data-reg-new>Propose an entity</button></div>`);
 const kp=kpiRow([["Canonical entities",s.n,"CI classes counted once"],["Fields",s.nf.toLocaleString(),s.extAuth+" external, "+s.shared+" shared"],["Duplicates open",s.dups,"of 5 planned fixes",{cls:s.dups?"bad":"good",keep:true}],["Missing core entities",s.planned,"proposed below"],["Reuse rate",s.reuse+"%","single writer, no duplicate",{metric:"m_reg_reuse"}]]);
 const entTbl=btHTML({id:"reg_ent",cols:[
  {k:"label",label:"Entity",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.id)}</div>`,val:r=>r.label,wrap:true,w:240},
  {k:"domain",label:"Domain",fmt:r=>E(DOM[r.domain].n),val:r=>DOM[r.domain].n},
  {k:"owner",label:"Owner module",fmt:r=>E(r.owner),val:r=>r.owner},
  {k:"steward",label:"Steward",fmt:r=>E(r.steward),val:r=>r.steward,wrap:true},
  {k:"nf",label:"Fields",fmt:r=>r.nf,val:r=>r.nf},
  {k:"cls",label:"Highest class",fmt:r=>pill_(r.cls,CLSP[r.cls]),val:r=>r.cls},
  {k:"w",label:"Writers",fmt:r=>r.writers.length>1?pill_(r.writers.length+" writers","warn"):r.writers.length,val:r=>r.writers.length},
  {k:"r",label:"Readers",fmt:r=>r.readers.length,val:r=>r.readers.length},
  {k:"status",label:"Status",fmt:r=>r.status==="duplicate"?pill_("Duplicate","bad"):r.status==="fixed"?pill_("Fixed","good"):pill_("Canonical","good"),val:r=>r.status}
 ],rows:()=>PLAT.entities(),key:"id",h:460,rowH:52,facets:["domain","owner","status"],groupBy:["domain","owner"],exportName:"registry-entities",open:id=>entDrawer(id)});
 const fixes=FIXES.map(f=>{const ap=S.plat.applied[f.id];return `<section class="card glass reg-fix" data-reg-fix="${f.id}"><div class="row" style="justify-content:space-between;gap:10px"><b>${E(f.t)}</b>${ap?pill_("Applied","good"):pill_("Open","bad")}</div>
  <p class="muted small" style="margin:6px 0">${f.ents.map(e=>`<code>${E(e)}</code>`).join(" and ")} become <b>${E(f.keep)}</b></p>
  <p style="margin:6px 0">${E(f.plan)}</p>
  <div class="row small muted" style="gap:10px;flex-wrap:wrap"><span>Effort ${E(f.effort)}</span><span>Risk ${E(f.risk)}</span><span>${f.apps.length} apps touched: ${f.apps.map(a=>E((PLAT.app(a)||{n:a}).n)).join(", ")}</span></div>
  <div class="row" style="gap:8px;margin-top:10px">${ap?`<button class="btn quiet" data-reg-revert="${f.id}">Undo in the preview</button>`:`<button class="btn primary" data-reg-apply="${f.id}">Preview and apply</button>`}</div></section>`}).join("");
 const planned=PLANNED.map(p=>({id:p[0],label:p[2],domain:p[1],steward:p[3],why:p[4],use:p[5]}));
 const planTbl=btHTML({id:"reg_plan",cols:[
  {k:"label",label:"Planned entity",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.id)}</div>`,val:r=>r.label,w:220,wrap:true},
  {k:"domain",label:"Domain",fmt:r=>E(DOM[r.domain].n),val:r=>DOM[r.domain].n},
  {k:"steward",label:"Proposed steward",fmt:r=>E(r.steward),val:r=>r.steward,wrap:true},
  {k:"why",label:"Why it is needed",fmt:r=>E(r.why),val:r=>r.why,wrap:true,w:360},
  {k:"use",label:"First users",fmt:r=>E(r.use),val:r=>r.use,wrap:true}
 ],rows:()=>planned.concat((S.plat.proposals||[]).map(p=>({id:p.id,label:p.label,domain:p.domain,steward:p.steward,why:p.why,use:"Proposed by "+p.by}))),key:"id",h:420,rowH:56,facets:["domain"],exportName:"planned-entities",open:id=>planDrawer(id)});
 const fieldTbl=btHTML({id:"reg_fld",cols:[
  {k:"ent",label:"Entity",fmt:r=>E(r.entLabel),val:r=>r.entLabel},
  {k:"label",label:"Field",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.k)}</div>`,val:r=>r.label,w:200},
  {k:"type",label:"Type",fmt:r=>E(r.type),val:r=>r.type},
  {k:"auth",label:"Authority",fmt:r=>pill_(r.auth,AUTHP[r.auth]),val:r=>r.auth},
  {k:"dir",label:"Direction",fmt:r=>r.dir==="in"?"In":r.dir==="out"?"Out":"Both",val:r=>r.dir},
  {k:"fresh",label:"Freshness",fmt:r=>E(r.fresh),val:r=>r.fresh},
  {k:"cls",label:"Class",fmt:r=>pill_(r.cls,CLSP[r.cls]),val:r=>r.cls},
  {k:"trust",label:"Trust",fmt:r=>Math.round(r.trust*100)+"%",val:r=>r.trust},
  {k:"rule",label:"Quality rule",fmt:r=>E(r.rule),val:r=>r.rule,wrap:true,w:240}
 ],rows:()=>PLAT.fieldsAll(),key:null,h:480,rowH:48,facets:["auth","fresh","cls","domain"],groupBy:["ent","auth","cls"],exportName:"registry-fields"});
 const appTbl=btHTML({id:"reg_app",cols:[
  {k:"n",label:"App or screen",fmt:r=>`<b>${E(r.n)}</b><div class="muted small">${E(r.mod)}</div>`,val:r=>r.n,w:220},
  {k:"w",label:"Writes",fmt:r=>r.writes.map(w=>`<code>${E(w)}</code>`).join(" "),val:r=>r.writes.length,wrap:true,w:300},
  {k:"r",label:"Reads",fmt:r=>r.reads.map(w=>`<code>${E(w)}</code>`).join(" "),val:r=>r.reads.length,wrap:true,w:300},
  {k:"o",label:"Writes outside its own entities",fmt:r=>{const n=PLAT.nonOwnerWrites().filter(x=>x.app===r.id);return n.length?pill_(n.length+" not owner","warn"):pill_("None","good")},val:r=>PLAT.nonOwnerWrites().filter(x=>x.app===r.id).length}
 ],rows:()=>APPS,key:"id",h:420,rowH:60,exportName:"registry-apps"});
 const dist=`<div class="grid g2 reg-dist" style="gap:12px">${dmCounts.map(d=>`<div class="reg-bar"><span class="small">${E(d[0])}</span><div class="reg-track"><i style="width:${Math.round(100*d[1]/s.n)}%"></i></div><b>${d[1]}</b></div>`).join("")}</div>`;
 const pane0=`${kp}<div class="grid g2" style="gap:16px;margin-top:14px">${card("Entities by domain","Counts of canonical entities; CI classes count once",dist)}${card("How the registry is enforced","Every app declares what it reads and writes",`<ol class="small" style="margin:0;padding-left:18px;display:grid;gap:6px"><li>A new entity or field is proposed with an owner and steward.</li><li>The reuse check looks for the same name, fields or purpose.</li><li>The data council approves; the registry publishes the change.</li><li>Apps and citizen apps see it through the MCP server and the typed API.</li></ol>`)}</div><div style="margin-top:14px">${entTbl}</div>`;
 const pane1=`<p class="muted small">Five structural duplicates were found when the model was catalogued. Preview shows which apps change; apply updates the registry view and closes the matching debt items.</p><div class="grid g2" style="gap:14px">${fixes}</div>`;
 const pane2=`<p class="muted small">About ${s.planned} core entities are not yet in the model. Anyone can propose one; the reuse check runs first.</p>${planTbl}`;
 const pane3=`<p class="muted small">Every field has an authority, a direction, a freshness class, a classification and a quality rule. External authority means the field is mirrored from the source and never edited here.</p>${legend([["Platform authority","--good-f"],["External authority","--info-f"],["Shared","--warn-f"]])}${fieldTbl}`;
 const pane4=`<p class="muted small">What each app reads and writes. Two writers on one entity, or a write by a module that is not the owner, becomes a debt item.</p>${appTbl}`;
 return `<div class="screen">${hero_}${lensNote()}${views("reg",["Overview","Duplicates and fixes","Planned entities","Field catalog","Who reads and writes"],[pane0,pane1,pane2,pane3,pane4])}${procCard("plat_reg")}</div>`;
}
function entDrawer(id){
 const e=PLAT.ent(id);if(!e)return;
 const fx=e.fix&&FIXES.find(f=>f.id===e.fix);
 const rows=e.fields.map(f=>{const m=fieldMeta(e.id,f);return `<tr><td><b>${E(f.label)}</b><div class="muted small">${E(f.k)}</div></td><td>${E(f.type||"string")}</td><td>${pill_(m.auth,AUTHP[m.auth])}</td><td>${E(m.fresh)}</td><td>${pill_(m.cls,CLSP[m.cls])}</td><td class="small">${E(m.rule)}</td></tr>`}).join("");
 openDrawer(`<div class="dfullgrid"><div><div class="eyebrow">${E(DOM[e.domain].n)}</div><h2 style="margin:4px 0">${E(e.label)}</h2><p class="muted small"><code>${E(e.id)}</code> owned by ${E(e.owner)}, stewarded by ${E(e.steward)}. Retention: ${E(e.ret)}.</p>
  ${fx?`<div class="story" style="margin:10px 0"><b>${e.status==="fixed"?"Fixed":"Duplicate"}.</b> ${E(fx.plan)}</div>`:""}
  <h3>Readers and writers</h3><p class="small">Writes: ${e.writers.map(a=>`<code>${E(a)}</code>`).join(" ")||"none"}<br>Reads: ${e.readers.map(a=>`<code>${E(a)}</code>`).join(" ")||"none"}</p>
  <h3>Authority mix</h3><p class="small">${Object.keys(e.authMix).map(k=>`${pill_(k,AUTHP[k])} ${e.authMix[k]}`).join(" ")}</p>
  <p class="small muted">Access: ${e.cls==="personal"||e.cls==="restricted"?"attribute rules mask personal and restricted fields for roles without a need to know.":"role rules apply; no masking needed."}</p></div>
  <div><h3>Fields (${e.nf})</h3><div class="tscroll"><table><thead><tr><th>Field</th><th>Type</th><th>Authority</th><th>Freshness</th><th>Class</th><th>Quality rule</th></tr></thead><tbody>${rows}</tbody></table></div></div></div>`);
}
function planDrawer(id){
 const p=PLANNED.find(x=>x[0]===id);const q=(S.plat.proposals||[]).find(x=>x.id===id);const r=p?{label:p[2],why:p[4],steward:p[3],use:p[5],domain:p[1]}:q;if(!r)return;
 openDrawer(`<div class="eyebrow">Planned entity</div><h2 style="margin:4px 0">${E(r.label)}</h2><p class="muted small"><code>${E(id)}</code> in ${E(DOM[r.domain].n)}, proposed steward ${E(r.steward)}.</p><div class="story">${E(r.why)}</div><p class="small">First users: ${E(r.use)}</p><p class="small muted">Next step: data council review, then the field catalog is drafted by the Registry Agent for human approval.</p>`);
}
/* reuse check: finds near matches among existing and planned entities */
function reuseCheck(label,fieldsText){
 const toks=s=>(s||"").toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);
 const want=new Set(toks(label).concat(toks(fieldsText)));const hits=[];
 PLAT.entities().forEach(e=>{const have=new Set(toks(e.label).concat(toks(e.id)).concat(e.fields.flatMap(f=>toks(f.k).concat(toks(f.label)))));let n=0;want.forEach(w=>{if(have.has(w))n++});const sc=want.size?n/want.size:0;if(sc>=.34)hits.push({id:e.id,label:e.label,sc,kind:"existing"})});
 PLANNED.forEach(p=>{const have=new Set(toks(p[2]).concat(toks(p[0])));let n=0;want.forEach(w=>{if(have.has(w))n++});const sc=want.size?n/want.size:0;if(sc>=.4)hits.push({id:p[0],label:p[2],sc,kind:"planned"})});
 return hits.sort((a,b)=>b.sc-a.sc).slice(0,4);
}
PLAT.reuseCheck=reuseCheck;
document.addEventListener("click",e=>{
 let t=e.target.closest("[data-reg-apply]");if(t){const f=FIXES.find(x=>x.id===t.dataset.regApply);
  openDrawer(`<div class="eyebrow">Preview</div><h2 style="margin:4px 0">${E(f.t)}</h2><div class="story">${E(f.plan)}</div><h3>Apps that change</h3><p class="small">${f.apps.map(a=>E((PLAT.app(a)||{n:a}).n)).join(", ")}</p><h3>Before and after</h3><p class="small">Before: ${f.ents.map(x=>`<code>${E(x)}</code>`).join(", ")}. After: <b>${E(f.keep)}</b>.</p><p class="small muted">Effort ${E(f.effort)}, risk ${E(f.risk)}. The matching debt item closes and an audit event is recorded.</p><div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" data-reg-confirm="${f.id}">Apply to the registry</button><button class="btn quiet" onclick="closeDrawer()">Not now</button></div>`);return}
 t=e.target.closest("[data-reg-confirm]");if(t){closeDrawer();PLAT.apply(t.dataset.regConfirm);return}
 t=e.target.closest("[data-reg-revert]");if(t){PLAT.revert(t.dataset.regRevert);audit("Registry fix reverted",t.dataset.regRevert);toast("Reverted in the preview");return}
 t=e.target.closest("[data-reg-new]");if(t){
  openForm({id:"reg_new",title:"Propose a new entity",story:"The reuse check runs first. If a close match exists you are asked to reuse it. Otherwise the data council reviews it and the Registry Agent drafts the field catalog for approval.",submit:"Submit for review",
   fields:[{section:"What is it"},{k:"label",label:"Entity name",type:"text",req:true,ph:"Budget line"},{k:"purpose",label:"What it records",type:"longtext",req:true,ph:"One sentence"},{k:"fields",label:"Main fields",type:"text",ph:"amount, owner, period"},
   {k:"domain",label:"Domain",type:"select",opts:Object.keys(DOM).map(k=>[k,DOM[k].n])},{k:"steward",label:"Steward",type:"people"},{k:"why",label:"Why existing entities do not fit",type:"longtext",req:true}],
   live:v=>{const h=reuseCheck(v.label,(v.fields||"")+" "+(v.purpose||""));return h.length?`<div class="story"><b>Reuse check:</b> ${h.map(x=>`${E(x.label)} (${x.kind}, ${Math.round(x.sc*100)}% match)`).join("; ")}. Explain why these do not fit, or reuse one.</div>`:`<div class="story"><b>Reuse check:</b> no close match found.</div>`},
   onSubmit:v=>{const id=(v.label||"entity").toLowerCase().replace(/[^a-z0-9]+/g,"_");S.plat.proposals.push({id,label:v.label,domain:v.domain||"portfolio",steward:v.steward||"Data council chair",why:v.why,by:"Omar Hamid"});audit("Entity proposed",v.label);toast("Sent to the data council","good");closeDrawer();render()}});return}
});
REG("plat_reg","Platform registry","platform","M4 5h16v4H4zM4 11h16v4H4zM4 17h10v3H4z",regScreen);
PROC.reg("plat_reg",{title:"How the registry stays true",std:["dmbok","togaf"],steps:[
 {n:"Propose",d:"Anyone proposes an entity or field with purpose, owner and steward.",who:"human",owner:"Requester",out:"Proposal"},
 {n:"Reuse check",d:"Names, fields and purpose are matched against the registry.",who:"auto",owner:"Platform",out:"Matches"},
 {n:"Draft fields",d:"The Registry Agent drafts type, class, authority and quality rules.",who:"agent",owner:"Registry Agent",out:"Draft catalog"},
 {n:"Approve",d:"Data council and platform team approve. Low-risk additions to an existing entity auto-approve.",who:"gate",owner:"Data council",sla:"3 days",out:"Decision"},
 {n:"Publish",d:"Registry updates, MCP tool list and typed API refresh.",who:"auto",owner:"Platform",out:"New version"}]});
SEARCHX.push(()=>PLAT.entities().map(en=>({g:"Registry",t:en.label+" ("+en.id+")",m:en.owner,c:"--p4",f:()=>{go("plat_reg");setTimeout(()=>entDrawer(en.id),150)},k:en.id+" entity registry table owner "+en.steward})));
ASKX.push(q=>{const t=q.toLowerCase();
 if(/duplicate (entit|record)|registry|who owns|system of record|reuse/.test(t)){const s=PLAT.stats();go("plat_reg");say(q,{t:"The registry has "+s.n+" canonical entities and "+s.nf+" fields. "+s.dups+" duplicates are open and "+s.planned+" core entities are planned.",steps:["Opened the platform registry"]});return true}
 return false});
})();
