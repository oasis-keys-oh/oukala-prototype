
/* ---------- the audit: every check returns {id,area,name,total,bad,items,fix,rem,std} ---------- */
const KEYOBJ=[["incident","Incidents"],["change_request","Changes"],["problem_record","Problems"],["request_item","Requests"],["project","Projects"],["project_task","Project tasks"],["invoice","Invoices"],["person","People"],["business_service","Services"],["cmdb_ci","Configuration items"],["metric_definition","Metrics"],["process_definition","Processes"],["knowledge_article","Knowledge articles"],["raid_item","RAID items"],["meeting","Meetings"],["approval","Approvals"],["debt_item","Debt items"],["contract_line","Contracts"]];
const mcpCovers=(obj)=>G(()=>MCPX.tools.some(t=>(t.n==="get_record"||t.n==="list_records")||new RegExp(obj.replace(/_/g,"[ _]"),"i").test(t.n+" "+t.d)&&!/^(search_registry|get_entity|check_reuse|validate_manifest)$/.test(t.n)),false);
const SEARCH_TYPES=[["Invoices",/invoice/i],["People",/^people$/i],["Projects",/^projects$/i],["Project tasks",/wbs|task/i],["RAID items",/raid|risks/i],["Meetings",/^meetings$/i],["Incidents",/^incidents$/i],["Changes",/^changes$/i],["Problems",/^problems$/i],["Knowledge articles",/knowledge articles/i],["Services",/^services$/i],["Configuration items",/configuration items|hosts and cis/i],["Metrics",/metric/i],["Processes",/^processes$|process areas/i],["Data model tables",/data model tables/i],["Workflows",/^workflows$/i],["Decision rules",/decision rules/i],["Budget lines",/budget lines/i],["Vendors",/^vendors$/i],["Contracts",/^contracts$/i],["Purchase orders",/purchase orders/i],["Demand",/^demand$/i],["Debt items",/debt items/i],["Approvals",/^approvals$/i],["Agents",/ai agents/i],["Ownership",/ownership/i],["Connections",/connection/i]];
const QUESTIONS=["what is connected to INC0412","which records have dead links","connection gaps","what happens when an invoice is approved","which processes have no owner","which entities does nothing read","how connected is the platform","which metrics are not traced to fields"];
let _inAsk=false;
function askHandled(q){_inAsk=true;const sv={say:window.say,go:window.go,render:window.render};let hit=false;
 try{window.say=()=>{hit=true};window.go=()=>{hit=true};window.render=()=>{};for(const fn of ASKX){try{if(fn(q)){hit=true;break}}catch(e){}}}finally{window.say=sv.say;window.go=sv.go;window.render=sv.render;_inAsk=false}
 return hit}
const HANDLED_RX=/^(Approvals to decide|Invoices to approve|Change approvals waiting|Service requests waiting on them|Knowledge reviews|Maturity capabilities|Meetings this week|Devices assigned|Software they hold|Their open requests|Service ownership|Accountable for AI agents|On-call shifts|Projects led)/;
const WK_RX=[/^Time off/,/^Resource requests/,/^Finance exceptions/,/^Agreements to review/,/^Reviews to write|^Feedback and 360/,/^Assessments/,/^RAID/,/^Training/,/^Contract obligations/,/^(Incidents|Problems owned|Post-incident|Changes to implement|Release readiness|Standard changes owned|Assigned work queue)/,/^(Project tasks|WBS assignments|Project assignments)/];
const ADP_SCREEN={inv:"inv",itsm_chg:"chg",svc_cat:"cat",svc_req:"cat",itsm_rel:"rel",plat_gate:"gapp",plat_atlas:"ent",exe_mat:"mat",ppm_sow:"sow",plat_fab:"fab",plat_debt:"debt",bud_req:"budreq",flw_appr:"flow",meet_hub:"meet",meet_act:"meet",meet_dec:"meet"};
const BUS_EVENTS=[["invoice.decided","Invoice approved, held or rejected",/invoice|payment/i],["budget.decided","Budget request decided",/budget/i],["risk.accepted","Risk accepted or closed",/risk/i],["project.status","Project status changed",/project|milestone/i],["meeting.action","Meeting action overdue",/meeting|action/i],["contract.renewal","Contract renewal window opens",/contract|renewal/i],["owner.gap","Ownership gap opened",/owner/i],["debt.item","Technical debt item added",/debt/i]];
function audit(){const A=[];const add=(area,id,name,total,items,o)=>{o=o||{};A.push(Object.assign({area,id,name,total:total||0,bad:items.length,items,fix:null,rem:"",std:""},o))};
 const ents=G(()=>PLAT.entities(),[]);const pls=G(()=>PROCLIB.list(),[]).map(p=>G(()=>PROCLIB.get(p.id),p));
 const mods=G(()=>MODMAP.modules,[]),flows=G(()=>MODMAP.flows,[]);
 const E=(id,label,detail,go)=>({id,label,detail:detail||"",go});
 /* ---- DATA ---- */
 const entInMap=new Set();mods.forEach(m=>arr(m.r).concat(arr(m.w)).forEach(e=>entInMap.add(e)));flows.forEach(f=>arr(f.refs).forEach(r=>entInMap.add(r.id)));
 add("Data","d_noscreen","Entities no screen or module reads or writes",ents.length,ents.filter(e=>!arr(e.readers).length&&!arr(e.writers).length&&!entInMap.has(e.id)).map(e=>E(e.id,e.label,"No reader, no writer, in no flow",()=>G(()=>ATLAS.focus(e.id)))),{rem:"Assign the owning module (MODMAP read/write) or retire the entity",std:"dmbok"});
 const procEnt=new Set();pls.forEach(p=>{const e=p.entities||{};arr(e.r).concat(arr(e.w)).forEach(x=>procEnt.add(x))});
 add("Data","d_noproc","Entities used by no process",ents.length,ents.filter(e=>!procEnt.has(e.id)&&!arr(e.writers).length).map(e=>E(e.id,e.label,"No process lists it as input or output")),{rem:"Link the entity to the process that creates or consumes it",std:"dmbok"});
 add("Data","d_noowner","Entities without a steward or owner",ents.length,ents.filter(e=>!e.owner||!e.steward).map(e=>E(e.id,e.label,"Owner "+(e.owner||"none")+", steward "+(e.steward||"none"))),{rem:"Name a steward in the data catalog",std:"dmbok"});
 const tbl=Object.keys(G(()=>DATAMODEL.tables,{}));const eid=new Set(ents.map(e=>e.id));
 add("Data","d_orphan_tbl","Tables outside the entity registry",tbl.length,tbl.filter(t=>!eid.has(t)&&t.indexOf("cmdb_ci")!==0).map(t=>E(t,t,"In DATAMODEL, not in the registry")),{rem:"Register through ATLAS.addEntity",std:"dmbok"});
 const fa=G(()=>PLAT.fieldsAll(),[]);const undecl=fa.filter(f=>f.basis==="default");const byE={};undecl.forEach(f=>{(byE[f.ent]=byE[f.ent]||[]).push(f.k)});
 add("Data","d_undecl","Fields with no declared authority or classification",fa.length,Object.keys(byE).map(e=>E(e,(G(()=>PLAT.ent(e).label,e)),byE[e].length+" fields: "+byE[e].slice(0,4).join(", ")+(byE[e].length>4?"...":""),()=>G(()=>ATLAS.focus(e)))),{units:undecl.length,rem:"Steward confirms authority and class per entity (routed to Technical debt)",std:"dmbok"});
 const refF=[];ents.forEach(e=>arr(e.fields).forEach(f=>{if(f.type==="ref"&&!f.ref)refF.push([e,f])}));
 const nref=ents.reduce((a,e)=>a+arr(e.fields).filter(f=>f.type==="ref").length,0);
 const byR={};refF.forEach(([e,f])=>{(byR[e.id]=byR[e.id]||[]).push(f.k)});
 add("Data","d_ref_untargeted","Reference fields with no declared target entity",nref,Object.keys(byR).map(e=>E(e,G(()=>PLAT.ent(e).label,e),byR[e].length+" refs: "+byR[e].slice(0,4).join(", "))),{units:refF.length,rem:"Declare the target entity on each reference field",std:"dmbok"});
 const dupP=G(()=>PLAT.FIXES.filter(f=>!(S.plat&&S.plat.applied&&S.plat.applied[f.id])),[]);
 const lab=ents.filter(e=>!e.fam&&e.id.indexOf("cmdb_ci")!==0).map(e=>[e,new Set(toks(e.label.replace(/\(.*\)/,"")))]);const near=[];
 for(let i=0;i<lab.length;i++)for(let j=i+1;j<lab.length;j++){const a=lab[i][1],b=lab[j][1];if(a.size<1||b.size<1)continue;let n=0;a.forEach(w=>{if(b.has(w))n++});const jac=n/(a.size+b.size-n);if(jac>=.99||(jac>=.8&&Math.min(a.size,b.size)>=2))near.push([lab[i][0],lab[j][0],jac])}
 add("Data","d_dup","Duplicate or near-duplicate concepts",ents.length,dupP.map(f=>E(f.id,f.n||f.id,"Open duplicate fix in the registry")).concat(near.map(p=>E(p[0].id+"~"+p[1].id,p[0].label+" and "+p[1].label,"Label overlap "+Math.round(p[2]*100)+"%"))),{rem:"Merge or document why both exist (reuse decision)",std:"dmbok"});
 const lins=G(()=>LIN.all(),[]);
 add("Data","d_metric_untraced","Metrics not traced to any field",lins.length,lins.filter(t=>t.status==="none").map(t=>E(t.id,t.m.n,t.gaps.length+" terms unmapped",()=>G(()=>ATLAS.lineage(t.id)))),{rem:"Map each formula term to entity.field in Data model, Lineage",std:"dmbok"});
 add("Data","d_planned","Planned entities not yet created",ents.length,G(()=>PLAT.missing(),[]).map(p=>E(p[0],p[2],p[4])),{rem:"Data council reviews and approves the entity",std:"dmbok"});
 /* ---- PROCESS ---- */
 const P=(rx,f)=>pls.filter(f);
 add("Process","p_noowner","Processes with no named owner",pls.length,pls.filter(p=>!p.owner||p.named===false).map(p=>E(p.id,p.name,"Owner: "+(p.owner||"none"),()=>G(()=>PROCLIB.open(p.id)))),{rem:"Name an accountable person",std:"itil5"});
 add("Process","p_nobackup","Processes with no backup owner",pls.length,pls.filter(p=>!p.backup).map(p=>E(p.id,p.name,"Owner "+(p.owner||"none")+", no backup",()=>G(()=>PROCLIB.open(p.id)))),{rem:"Name a backup who is a different person",std:"itil5"});
 add("Process","p_nometric","Processes with no metric",pls.length,pls.filter(p=>!arr(p.metrics).length).map(p=>E(p.id,p.name,"No outcome or health metric")),{rem:"Add an outcome and a health metric",std:"cmmi"});
 add("Process","p_fewsteps","Processes with fewer than 3 steps",pls.length,pls.filter(p=>arr(p.stepsList).length<3).map(p=>E(p.id,p.name,arr(p.stepsList).length+" steps")),{rem:"Document the steps",std:"bpmn"});
 const stepsAll=pls.reduce((a,p)=>a+arr(p.stepsList).length,0);
 const noOwnStep=[],noIo=[];pls.forEach(p=>arr(p.stepsList).forEach((s,i)=>{if(!s.owner&&s.who!=="auto")noOwnStep.push(E(p.id+"#"+(i+1),p.name+": "+s.n,"Acting as "+s.who+", no owner"));if(!s.in||!s.out)noIo.push(E(p.id+"#"+(i+1),p.name+": "+s.n,(s.in?"":"no input ")+(s.out?"":"no output")))}));
 add("Process","p_stepowner","Steps with no owner",stepsAll,noOwnStep,{rem:"Name who answers for the step",std:"bpmn"});
 add("Process","p_stepio","Steps with no input or no output",stepsAll,noIo,{rem:"Name the record or system each step reads and writes",std:"bpmn"});
 add("Process","p_noentity","Processes linked to no entity",pls.length,pls.filter(p=>!(arr((p.entities||{}).r).length+arr((p.entities||{}).w).length)).map(p=>E(p.id,p.name,"No entity read or written")),{rem:"Attach the entities the process reads and writes",std:"dmbok"});
 const modIds=new Set(mods.map(m=>m.id));
 add("Process","p_nomodule","Processes linked to no module on the map",pls.length,pls.filter(p=>!p.module||!modIds.has(p.module)).map(p=>E(p.id,p.name,"Module: "+(p.module||"none"))),{rem:"Link the process to a module via PROCLIB.addProcess module",std:"togaf"});
 add("Process","p_screen_noproc","Screens with no process strip",SCREENS.length,SCREENS.filter(s=>!G(()=>PROC.defs[s[0]],null)).map(s=>E(s[0],s[1],"No PROC.reg",()=>go(s[0]))),{rem:"PROC.reg plus a PROCLIB record",std:"bpmn"});
 add("Process","m_noin","Modules with no flow in",mods.length,mods.filter(m=>!arr(m.inn).length&&!m.nin).map(m=>E(m.id,m.name,"Nothing flows in")),{rem:"MODMAP.addFlows",std:"togaf"});
 add("Process","m_noout","Modules with no flow out",mods.length,mods.filter(m=>!arr(m.out).length&&!m.nout).map(m=>E(m.id,m.name,"Nothing flows out")),{rem:"MODMAP.addFlows",std:"togaf"});
 add("Process","m_nodata","Flows with no data contract (no entity named)",flows.length,flows.filter(f=>!arr(f.refs).length).map(f=>E(f.id,f.from+" to "+f.to,f.data||"no data text")),{rem:"Name the entity each flow carries",std:"togaf"});
 add("Process","m_nononown","Modules writing an entity another module owns",mods.length,mods.filter(m=>m.nonOwn&&(arr(m.nonOwn).length||m.nonOwn===true)).map(m=>E(m.id,m.name,"Writes a non-owned entity")),{rem:"Route the write through the owner",std:"dmbok"});
 /* ---- WORKFLOW ---- */
 const dl=deadLinks();const dlBy=k=>dl.out.filter(d=>d.rel===k);const relTotal=k=>(dl.by[k]||{total:0}).total;
 const wfI=(k)=>dlBy(k).map(d=>E(d.from+"|"+d.ref,d.label+" to "+d.ref,d.name));
 add("Workflow","w_owner","Workflow owners that resolve to nobody",relTotal("wf_own"),wfI("wf_own"),{rem:"Name a person or a registered agent as owner",std:"bpmn"});
 add("Workflow","w_service","Workflows pointing at an unknown service",relTotal("wf_svc"),wfI("wf_svc").concat(G(()=>FLOWX.flows().filter(f=>!f.service).map(f=>E(f.id+"|svc",f.name,"No service set")),[])),{rem:"Set the service from the table it works on",std:"itil5"});
 add("Workflow","w_table","Workflows on an unregistered table",relTotal("wf_tbl"),wfI("wf_tbl"),{rem:"Register the table in the data model",std:"dmbok"});
 add("Workflow","w_assignee","Step assignees that resolve to nobody",relTotal("wf_asg"),wfI("wf_asg"),{rem:"Register the person, team or role (resolver) or edit the step",std:"bpmn"});
 add("Workflow","w_approver","Approvers that resolve to nobody",relTotal("wf_apr"),wfI("wf_apr"),{rem:"Map the role to a domain owner (resolver) or edit the step",std:"cobit"});
 add("Workflow","w_agent","Agent steps naming an unregistered agent",relTotal("wf_agent"),wfI("wf_agent"),{rem:"Register the agent with a human sponsor",std:"cobit"});
 add("Workflow","w_edge","Edges that point at a missing step",relTotal("wf_edge"),wfI("wf_edge"),{rem:"Reconnect or delete the edge",std:"bpmn"});
 const dc=G(()=>DECX.coverage(),{});
 add("Workflow","w_dec_owner","Decision points with no owner",dc.decisionPoints||0,Array.from({length:dc.noOwner||0},(_,i)=>E("dec"+i,"Decision point "+(i+1),"No owner")).slice(0,60),{units:dc.noOwner||0,rem:"Assign an owner in Decision rules",std:"dmbok"});
 /* ---- CROSS-MODULE IDS ---- */
 relations().filter(r=>!/^wf_/.test(r.id)).forEach(r=>{const own=r.kind==="person";const items=dlBy(r.id).map(d=>E(d.from+"|"+d.ref,d.label+": "+d.ref,d.name+" does not resolve"));
  add(own?"People":"Links",r.id,r.name+" does not resolve",relTotal(r.id),items,{rem:own?"Add the person to the directory or correct the owner":"Correct or create the referenced record",std:"dmbok"})});
 /* ---- PLATFORM, SEARCH, CHAT, MCP ---- */
 add("Platform","k_mcp","Key objects with no MCP read tool",KEYOBJ.length,KEYOBJ.filter(k=>!mcpCovers(k[0])).map(k=>E(k[0],k[1],"Tools can read the schema (get_entity) but not the records")),{rem:"Add get_record, list_records and get_connections",std:"nist"});
 add("Platform","k_mcp_write","Approval kinds with no MCP list or decide tool",Object.keys(G(()=>INBOX.adapters,{})).length,G(()=>MCPX.tools.some(t=>/approval/i.test(t.n)),false)?[]:Object.keys(G(()=>INBOX.adapters,{})).map(k=>E(k,G(()=>INBOX.adapters[k].label,k),"No tool to list or decide")),{rem:"Add list_approvals (read) and route decisions through the inbox",std:"nist"});
 const groups=new Set();G(()=>searchIndex().forEach(r=>groups.add(String(r.g||""))),0);
 add("Search and chat","s_groups","Record types with no search group",SEARCH_TYPES.length,SEARCH_TYPES.filter(t=>![...groups].some(g=>t[1].test(g))).map(t=>E(t[0],t[0],"No SEARCHX group")),{rem:"Add a SEARCHX provider",std:"kcs"});
 add("Search and chat","c_questions","Cross-cutting questions chat cannot answer",QUESTIONS.length,QUESTIONS.filter(q=>!askHandled(q)).map(q=>E(q,q,"No ASKX intent")),{rem:"Add an ASKX intent",std:"kcs"});
 /* ---- APPROVALS, INBOX, NOTIFICATIONS ---- */
 const adpKeys=Object.keys(G(()=>INBOX.adapters,{}));
 const wk=arr(G(()=>WORK,[]));const dropped=wk.filter(w=>!HANDLED_RX.test(w.kind)&&!WK_RX.some(r=>r.test(w.kind)));
 add("Approvals","a_work","Assigned-work providers the inbox never shows",wk.length,(adpKeys.includes("zl_work")?[]:dropped).map(w=>E(w.tag,w.kind,"Registered in Person 360, missing from the inbox")),{rem:"Add an inbox adapter for the provider",std:"itil5"});
 const gateScr=Object.keys(G(()=>PROC.defs,{})).filter(k=>arr(PROC.defs[k].steps).some(s=>s.who==="gate")&&SCRN().has(k));
 const adpOK=k=>ADP_SCREEN[k]&&adpKeys.includes(ADP_SCREEN[k])||(Z.fixed.gate_inbox&&Z.gateCovered&&Z.gateCovered[k]);
 add("Approvals","a_gate","Screens with a gate step that do not register in the inbox",gateScr.length,gateScr.filter(k=>!adpOK(k)).map(k=>E(k,(SCREENS.find(s=>s[0]===k)||[0,k])[1],arr(PROC.defs[k].steps).filter(s=>s.who==="gate").map(s=>s.n).join(", "),()=>go(k))),{rem:"Register gate items in the inbox adapter",std:"itil5"});
 const tpl=[];G(()=>SEARCHX.forEach(fn=>G(()=>fn(),[]).forEach(r=>{if(/notification/i.test(r.g||""))tpl.push(String(r.t))})),0);
 add("Approvals","n_events","Business events with no notification",BUS_EVENTS.length,BUS_EVENTS.filter(e=>!tpl.some(t=>e[2].test(t))&&!(Z.fixed.notify&&Z.notifyReg&&Z.notifyReg[e[0]])).map(e=>E(e[0],e[1],"No template in the notification engine")),{rem:"Register the event and a template",std:"itil5"});
 /* ---- INTEROPERABILITY ---- */
 const ip=interopMatrix();add("Interoperability","i_invoice","Invoice decision consumers that do not update",ip.consumers.length,ip.consumers.filter(c=>!c.updated).map(c=>E(c.id,c.name,c.how)),{rem:"Publish an invoice.decided event with consumers",std:"togaf"});
 add("Interoperability","i_flows","Expected invoice flows missing from the module map",ip.expected.length,ip.expected.filter(e=>!e.present).map(e=>E(e.id,e.name,"No flow from the invoice module")),{rem:"MODMAP.addFlows",std:"togaf"});
 return {at:new Date().toISOString().slice(0,19),checks:A,deadTotal:dl.total}}
