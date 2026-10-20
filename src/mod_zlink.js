/* mod_zlink.js (Round 14, Connectivity Auditor). Loads last. Audits data, process, workflow and interoperability
   connectivity from the live registries, fixes what it can through registration APIs, and shows the result on
   Platform, "Connections and gaps". window.ZLINK = {audit, fixAll, graph, connected, open, interop, harness}.
   Baseline measurements run with window.__ZLINK_NOFIX=1 (no fixes applied), so before and after use the same checks. */
(function(){
"use strict";
const NOFIX=!!window.__ZLINK_NOFIX;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const TODAY="2026-10-06";
const Z=S.zlink=S.zlink||{fixed:{},log:[],events:[],notes:[],ledger:{},alias:[],tgt:0,tab:0,sel:null,hv:null};
const arr=x=>Array.isArray(x)?x:[];
const lc=s=>String(s==null?"":s).toLowerCase();
const norm=s=>lc(s).replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const toks=s=>norm(s).split(" ").filter(w=>w.length>2);
const uniq=a=>[...new Set(a)];
const HARNESS=/*HARNESS_DATA*/{"before":{"checks":{"d_noscreen":0,"d_noproc":0,"d_noowner":0,"d_orphan_tbl":0,"d_undecl":55,"d_ref_untargeted":130,"d_dup":6,"d_metric_untraced":76,"d_planned":5,"p_noowner":12,"p_nobackup":104,"p_nometric":10,"p_fewsteps":0,"p_stepowner":26,"p_stepio":306,"p_noentity":24,"p_nomodule":0,"p_screen_noproc":18,"m_noin":0,"m_noout":0,"m_nodata":23,"m_nononown":11,"w_owner":24,"w_service":148,"w_table":0,"w_assignee":418,"w_approver":78,"w_agent":0,"w_edge":0,"w_dec_owner":27,"task_proj":0,"task_pred":0,"task_own":0,"proj_own":0,"proj_rec":0,"dem_obj":0,"dem_sp":6,"dem_svc":0,"inv_node":0,"inv_con":0,"inv_vend":0,"meet_link":0,"meet_att":0,"meet_chair":0,"inc_svc":0,"inc_ci":0,"inc_own":0,"inc_prb":0,"inc_chg":0,"inc_kb":4,"inc_node":0,"chg_svc":0,"chg_ci":0,"chg_own":0,"prb_svc":0,"prb_inc":0,"svc_own":0,"svc_sme":0,"svc_proj":0,"svc_dep":0,"ci_svc":0,"ci_own":0,"ciedge":0,"po_vend":0,"po_con":0,"po_line":6,"con_inv":0,"con_proj":0,"con_own":0,"line_proj":0,"line_own":0,"vend_own":0,"raid_own":0,"raid_proj":0,"metric_use":34,"metric_agent":12,"metric_rem":22,"proc_own":4,"proc_bak":0,"proc_met":0,"proc_mod":0,"k_mcp":16,"k_mcp_write":17,"s_groups":0,"c_questions":7,"a_work":13,"a_gate":78,"n_events":8,"i_invoice":7,"i_flows":5},"score":83,"findings":1740,"dead":609,"deadTotal":6299},"walk":{"before":{"total":275,"bad":1,"by":{"ok":274,"badtext":1},"screens":39},"after":{"total":267,"bad":1,"by":{"ok":266,"badtext":1},"screens":38},"deadList":[{"screen":"svc_notify","txt":"Avery Chen","verdict":"badtext","why":"not found"}],"beforeList":[{"screen":"svc_notify","txt":"Avery Chen","verdict":"badtext","why":"not found"}]},"scan":{"before":{"screens":121,"chips":2654,"dead":9},"after":{"screens":123,"chips":2786,"dead":1},"deadList":[{"screen":"plat_fab","attr":"data-person","val":"Platform team","txt":"Platform team"}],"beforeList":[{"screen":"bud_req","attr":"data-person","val":"the CEO","txt":"the CEO"},{"screen":"exe_apps","attr":"data-person","val":"Chief Editor","txt":"Chief Editor"},{"screen":"meet_hub","attr":"data-person","val":"Chief Editor","txt":"Chief Editor3.5 h"},{"screen":"ppl_org","attr":"data-person","val":"Chief Editor","txt":"Chief Editor"},{"screen":"plat_fab","attr":"data-person","val":"Platform team","txt":"Platform team"},{"screen":"plat_fab","attr":"data-person","val":"Chief Editor","txt":"Chief Editor"},{"screen":"itsm_rel","attr":"data-person","val":"Chief Editor","txt":"Chief Editor"},{"screen":"agile_board","attr":"data-person","val":"Chief Editor","txt":"Chief Editor"},{"screen":"agile_art","attr":"data-person","val":"Chief Editor","txt":"Chief Editor"}],"byAttr":{"data-go":1165,"data-nav":99,"data-rec":59,"data-person":991,"data-dx-goproc":45,"data-mm-gomod":48,"data-pl-open":350,"data-s360-open":29}}}/*END_HARNESS_DATA*/;

/* ---------- people, agents, teams, roles: one resolver ---------- */
let _actors=null,_actV="",_actMemo=new Map();
function actorIdx(){const v=[DIR.length,G(()=>ORGX.people.length,0),G(()=>ORGX.domains.length,0),Z.alias.length,G(()=>R15E.roles.version(),0)].join(",");
 if(_actors&&_actV===v)return _actors;_actV=v;_actMemo=new Map();
 const m=new Map();const put=(n,k)=>{if(n)m.set(norm(n),k)};
 DIR.forEach(d=>put(d.name,d.kind==="ai"?"agent":d.kind==="human"?"person":d.kind));
 arr(G(()=>ORGX.people,[])).forEach(p=>put(p.name,p.kind==="agent"?"agent":"person"));
 arr(G(()=>ORGX.agents(),[])).forEach(a=>put(a.name,"agent"));
 arr(G(()=>TEAMS,[])).forEach(t=>put(t.n,"team"));
 uniq(DIR.map(d=>d.team)).forEach(t=>put(t,"team"));
 arr(G(()=>SVCREG,[])).forEach(s=>put(s.n,"service"));
 arr(G(()=>typeof KCSX.skills==="function"?KCSX.skills():KCSX.skills,[])).forEach(k=>{put(k.id,"skill");put(k.n||k.name,"skill")});
 return _actors=m}
/* returns person|agent|team|role|queue|contractor|msp|skill|service or "" when the text resolves to nothing */
function actor(text){const t=norm(text);if(!t)return"";const m=actorIdx();if(m.has(t))return m.get(t);if(_actMemo.has(t))return _actMemo.get(t);
 let r="";const al=Z.alias.find(a=>a.k===t);if(al||G(()=>R15E.roles.find(text),null))r="role";else{const dom=G(()=>ORGX.byDomain(text),null);if(dom&&(dom.ownerId||dom.owner||dom.ownerName||dom.person||dom.length))r="role"}
 _actMemo.set(t,r);return r}
const isHuman=n=>{const k=actor(n);return k==="person"||k==="contractor"||k==="msp"};

/* ---------- the record universe: every id the app can open ---------- */
let _uni=null,_uniV="";
const itsm=()=>window.ITSMX||{incidents:[],changes:[],problems:[]};
let _uvT=0,_uvV="";
function uniVersion(){if(_uvV&&Date.now()-_uvT<2000)return _uvV;_uvT=Date.now();return _uvV=[PROJ.length,TASKS.length,DEMAND.length,INVOICES.length,MEETINGS.length,DIR.length,G(()=>itsm().incidents.length,0),G(()=>itsm().changes.length,0),G(()=>SEARCHX.length,0),G(()=>Object.keys(METRICS).length,0),G(()=>PROCLIB.list().length,0),G(()=>FLOWX.flows().length,0),G(()=>S.bud.po.length,0),G(()=>(S.kcsx.created||[]).length,0),G(()=>R15E.runLines.length,0),(window.SCALE&&SCALE.on)?1:0,G(()=>S.exe.objs.length+"."+S.exe.krs.length,0),G(()=>S.bud.led.length+"."+S.bud.lines.length,0),G(()=>BUDREQ.requests().map(r=>r.st).join(""),"")].join(",")}
function universe(){const v=uniVersion();if(_uni&&_uniV===v)return _uni;_uniV=v;const U=new Map();
 const add=(id,t,label,extra)=>{if(id==null||id==="")return;U.set(String(id),Object.assign({id:String(id),t,label:label||String(id)},extra||{}))};
 PROJ.forEach(p=>add(p.id,"project",p.n,{owner:p.owner}));
 TASKS.forEach(t=>add(t.id,"task",t.n,{owner:t.own,proj:t.p}));
 DEMAND.forEach(d=>add(d.id,"demand",d.n,{owner:d.sp}));
 INVOICES.forEach(i=>add(i.id,"invoice",i.vendor+" "+i.id,{owner:"",vendor:i.vendor}));
 MEETINGS.forEach(m=>add(m.id,"meeting",m.t,{owner:m.chair}));
 arr(G(()=>itsm().incidents,[])).forEach(i=>add(i.id,"incident",i.t,{owner:i.own,svc:i.svc}));
 arr(G(()=>itsm().changes,[])).forEach(i=>add(i.id,"change",i.t,{owner:i.own,svc:i.svc}));
 arr(G(()=>itsm().problems,[])).forEach(i=>add(i.id,"problem",i.t,{owner:i.own,svc:i.svc}));
 arr(SVCREG).forEach(s=>{add(s.id,"service",s.n,{owner:s.owner});add(s.n,"service",s.n,{owner:s.owner,alias:1})});
 arr(CIREG).forEach(c=>add(c.id,"ci",c.name,{owner:c.owner}));
 arr(NODES).forEach(n=>add(n.id,"record",n.n,{owner:n.owner}));
 /* DC-04: strategy and ledger nodes. Objectives and key results come from the strategy registry (S.exe), ledger lines from the
    management reserve ledger (S.bud.led), budget requests from BUDREQ. An objective id that is also a trace-graph record becomes an objective. */
 arr(G(()=>S.exe.objs,[])).forEach(o=>add(o.id,"objective",o.n,{owner:o.owner}));
 arr(G(()=>S.exe.krs,[])).forEach(k=>add(k.id,"key_result",k.n,{owner:k.owner,obj:k.o}));
 arr(G(()=>S.bud.led,[])).forEach(e=>add(e.id,"ledger",e.id+" "+(e.why||""),{owner:e.req,line:e.line,proj:e.p}));
 arr(G(()=>BUDREQ.requests(),[])).forEach(r=>add(r.id,"budget_request",r.t,{owner:r.sp}));
 arr(G(()=>KGN,[])).forEach(n=>{if(!U.has(n.id))add(n.id,"record",n.n||n.t)});
 DIR.forEach(d=>add(d.name,"person",d.name,{kind:d.kind}));
 Object.keys(METRICS).forEach(k=>add(k,"metric",METRICS[k].n,{owner:METRICS[k].owner}));
 arr(G(()=>PROCLIB.list(),[])).forEach(p=>add(p.id,"process",p.name,{owner:p.owner}));
 arr(G(()=>FLOWX.flows(),[])).forEach(f=>add(f.id,"workflow",f.name,{owner:f.owner}));
 G(()=>{S.bud.po.forEach(p=>add(p.id,"po",p.d,{vendor:p.v}));S.bud.con.forEach(c=>add(c.id,"contract",c.n,{owner:c.own}));S.bud.vend.forEach(v=>add(v.id,"vendor",v.n,{owner:v.own}));S.bud.lines.forEach(l=>add(l.id,"budget_line",l.n,{owner:l.own}));arr(R15E.runLines).forEach(l=>add(l.id,"budget_line",l.n,{owner:l.own}))});
 arr(G(()=>PPMRAID,[])).forEach(r=>add(r.id,"raid",r.t||r.n||r.title,{owner:r.own||r.owner}));
 arr(G(()=>typeof KCSX.items==="function"?KCSX.items():KCSX.items,[])).forEach(k=>add(k.id,"article",k.t||k.n));
 /* the search index is the app's own list of openable records: anything it names starting with an id token is real */
 G(()=>{SEARCHX.forEach(fn=>{G(()=>fn(),[]).forEach(r=>{const m=/^([A-Za-z]{2,5}-?\d{2,6}|[a-z]{2,6}_[a-z0-9_]+)\b/.exec(String(r.t||""));if(m&&!U.has(m[1]))add(m[1],lc(r.g||"record"),String(r.t).slice(m[1].length).trim()||m[1],{viaSearch:1})})})});
 return _uni=U}
const has=id=>universe().has(String(id));
const TYPEN={project:"Project",task:"Task",demand:"Demand request",invoice:"Invoice",meeting:"Meeting",incident:"Incident",change:"Change",problem:"Problem",service:"Service",ci:"Configuration item",record:"Strategy or work record",person:"Person",metric:"Metric",process:"Process",workflow:"Workflow",po:"Purchase order",contract:"Contract",vendor:"Vendor",budget_line:"Budget line",raid:"RAID item",article:"Knowledge article",objective:"Objective",key_result:"Key result",ledger:"Ledger line",budget_request:"Budget request"};

/* ---------- cross-module relations: every reference that should resolve ---------- */
/* each rel: {id, name, from, to, rows(): [[fromId, ref, label?]]} ; ref may be a list. unresolved refs are dead links */
function relations(){const R=[];
 const rel=(id,name,from,to,rows,kind)=>R.push({id,name,from,to,rows,kind:kind||"id"});
 const pr=x=>x==null||x===""?[]:Array.isArray(x)?x:[x];
 rel("task_proj","Task to project","task","project",()=>TASKS.map(t=>[t.id,t.p]));
 rel("task_pred","Task to predecessor","task","task",()=>TASKS.flatMap(t=>pr(t.pred).map(p=>[t.id,typeof p==="object"?p.id||p[0]:p])));
 rel("task_own","Task owner","task","person",()=>TASKS.map(t=>[t.id,t.own]),"person");
 rel("proj_own","Project owner","project","person",()=>PROJ.map(p=>[p.id,p.owner]),"person");
 rel("proj_rec","Project to strategy record","project","record",()=>PROJ.map(p=>[p.id,p.rec]));
 rel("dem_obj","Demand to objective","demand","record",()=>DEMAND.map(d=>[d.id,d.obj]));
 rel("dem_sp","Demand sponsor","demand","person",()=>DEMAND.map(d=>[d.id,d.sp]),"person");
 rel("dem_svc","Demand to service","demand","service",()=>DEMAND.map(d=>[d.id,d.svc]),"svc");
 rel("inv_node","Invoice to record","invoice","record",()=>INVOICES.map(i=>[i.id,i.node]));
 rel("inv_con","Invoice to contract","invoice","contract",()=>G(()=>INVOICES.map(i=>[i.id,(S.bud.con.find(c=>arr(c.inv).includes(i.id))||{}).id||""]),[]));
 rel("inv_vend","Invoice to vendor","invoice","vendor",()=>G(()=>INVOICES.map(i=>[i.id,(S.bud.vend.find(v=>lc(v.n)===lc(i.vendor))||{}).id||""]),[]));
 rel("meet_link","Meeting to linked record","meeting","project",()=>MEETINGS.map(m=>[m.id,m.link]));
 rel("meet_att","Meeting attendees","meeting","person",()=>MEETINGS.flatMap(m=>arr(m.att).map(a=>[m.id,a])),"person");
 rel("meet_chair","Meeting chair","meeting","person",()=>MEETINGS.map(m=>[m.id,m.chair]),"person");
 rel("inc_svc","Incident to service","incident","service",()=>arr(G(()=>itsm().incidents,[])).map(i=>[i.id,i.svc]),"svc");
 rel("inc_ci","Incident to CI","incident","ci",()=>arr(G(()=>itsm().incidents,[])).map(i=>[i.id,i.ci]));
 rel("inc_own","Incident owner","incident","person",()=>arr(G(()=>itsm().incidents,[])).map(i=>[i.id,i.own]),"person");
 rel("inc_prb","Incident to problem","incident","problem",()=>arr(G(()=>itsm().incidents,[])).map(i=>[i.id,i.prb]));
 rel("inc_chg","Incident to change","incident","change",()=>arr(G(()=>itsm().incidents,[])).map(i=>[i.id,i.chg]));
 rel("inc_kb","Incident to knowledge article","incident","article",()=>arr(G(()=>itsm().incidents,[])).map(i=>[i.id,i.kb]));
 rel("inc_node","Incident to record","incident","record",()=>arr(G(()=>itsm().incidents,[])).map(i=>[i.id,i.node]));
 rel("chg_svc","Change to service","change","service",()=>arr(G(()=>itsm().changes,[])).map(i=>[i.id,i.svc]),"svc");
 rel("chg_ci","Change to CI","change","ci",()=>arr(G(()=>itsm().changes,[])).flatMap(c=>arr(c.cis).map(x=>[c.id,x])));
 rel("chg_own","Change owner","change","person",()=>arr(G(()=>itsm().changes,[])).map(i=>[i.id,i.own]),"person");
 rel("prb_svc","Problem to service","problem","service",()=>arr(G(()=>itsm().problems,[])).map(i=>[i.id,i.svc]),"svc");
 rel("prb_inc","Problem to incidents","problem","incident",()=>arr(G(()=>itsm().problems,[])).flatMap(p=>arr(p.incs||p.inc||p.related).map(x=>[p.id,typeof x==="object"?x.id:x])));
 rel("svc_own","Service owner","service","person",()=>SVCREG.map(s=>[s.id,s.owner]),"person");
 rel("svc_sme","Service experts","service","person",()=>SVCREG.flatMap(s=>arr(s.sme).map(x=>[s.id,x])),"person");
 rel("svc_proj","Service to project","service","project",()=>SVCREG.flatMap(s=>arr(s.proj).map(x=>[s.id,x])));
 rel("svc_dep","Service dependency","service","service",()=>SVCREG.flatMap(s=>arr(s.deps).map(x=>[s.id,x])));
 rel("ci_svc","CI to service","ci","service",()=>CIREG.map(c=>[c.id,c.svc]),"svc");
 rel("ci_own","CI owner","ci","person",()=>CIREG.map(c=>[c.id,c.owner]),"person");
 rel("ciedge","CI dependency edge","ci","ci",()=>arr(G(()=>CIEDGE,[])).flatMap(e=>[[e[0],e[0]],[e[0],e[1]]]));
 rel("po_vend","PO to vendor","po","vendor",()=>G(()=>S.bud.po.map(p=>[p.id,p.v]),[]));
 rel("po_con","PO to contract","po","contract",()=>G(()=>S.bud.po.map(p=>[p.id,p.ct]),[]));
 rel("po_line","PO to budget line","po","budget_line",()=>G(()=>S.bud.po.map(p=>[p.id,p.line]),[]));
 rel("con_inv","Contract to invoice","contract","invoice",()=>G(()=>S.bud.con.flatMap(c=>arr(c.inv).map(x=>[c.id,x])),[]));
 rel("con_proj","Contract to project","contract","project",()=>G(()=>S.bud.con.map(c=>[c.id,c.proj]),[]));
 rel("con_own","Contract owner","contract","person",()=>G(()=>S.bud.con.map(c=>[c.id,c.own]),[]),"person");
 rel("line_proj","Budget line to project","budget_line","project",()=>G(()=>S.bud.lines.map(l=>[l.id,l.p]),[]));
 rel("line_own","Budget line owner","budget_line","person",()=>G(()=>S.bud.lines.map(l=>[l.id,l.own]),[]),"person");
 rel("vend_own","Vendor owner","vendor","person",()=>G(()=>S.bud.vend.map(v=>[v.id,v.own]),[]),"person");
 rel("raid_own","RAID item owner","raid","person",()=>arr(G(()=>PPMRAID,[])).map(r=>[r.id,r.own||r.owner]),"person");
 rel("raid_proj","RAID item to project","raid","project",()=>arr(G(()=>PPMRAID,[])).map(r=>[r.id,r.p||r.proj||r.project]));
 rel("metric_use","Metric to screen","metric","screen",()=>Object.keys(METRICS).flatMap(k=>arr(METRICS[k].use).map(u=>[k,u])),"screen");
 rel("metric_agent","Metric remediation agent","metric","agent",()=>Object.keys(METRICS).map(k=>[k,(METRICS[k].rem||{}).agent]).filter(x=>x[1]),"actor");
 rel("metric_rem","Metric remediation article","metric","article",()=>Object.keys(METRICS).map(k=>[k,(METRICS[k].rem||{}).ref]).filter(x=>/^KB\d+/.test(x[1]||"")));
 rel("proc_own","Process owner","process","person",()=>G(()=>PROCLIB.list().map(p=>[p.id,p.owner]),[]),"person");
 rel("proc_bak","Process backup","process","person",()=>G(()=>PROCLIB.list().map(p=>[p.id,p.backup]),[]),"person");
 rel("proc_met","Process to metric","process","metric",()=>G(()=>PROCLIB.list().flatMap(p=>arr(p.metrics).map(m=>[p.id,m])),[]));
 rel("proc_mod","Process to module","process","module",()=>G(()=>PROCLIB.list().map(p=>[p.id,p.module]),[]),"module");
 rel("wf_own","Workflow owner","workflow","person",()=>G(()=>FLOWX.flows().map(f=>[f.id,f.owner]),[]),"actor");
 rel("wf_svc","Workflow to service","workflow","service",()=>G(()=>FLOWX.flows().map(f=>[f.id,f.service]),[]),"svc");
 rel("wf_tbl","Workflow to table","workflow","entity",()=>G(()=>FLOWX.flows().map(f=>[f.id,f.table]),[]),"entity");
 rel("wf_asg","Workflow step assignee","workflow","actor",()=>G(()=>FLOWX.flows().flatMap(f=>f.nodes.filter(n=>n.p&&n.p.asg).flatMap(n=>[n.p.asg.person,n.p.asg.team].filter(Boolean).map(a=>[f.id+"/"+n.id,a]))),[]),"actor");
 rel("wf_apr","Workflow approver","workflow","actor",()=>G(()=>FLOWX.flows().flatMap(f=>f.nodes.filter(n=>n.t==="approval").flatMap(n=>arr(n.a.approvers).map(a=>[f.id+"/"+n.id,a]))),[]),"actor");
 rel("wf_agent","Workflow agent step","workflow","agent",()=>G(()=>FLOWX.flows().flatMap(f=>f.nodes.filter(n=>n.t==="agent"&&n.a.agent).map(n=>[f.id+"/"+n.id,n.a.agent])),[]),"actor");
 rel("wf_edge","Workflow edge","workflow","step",()=>G(()=>FLOWX.flows().flatMap(f=>{const ids=new Set(f.nodes.map(n=>n.id));return arr(f.edges).flatMap(e=>{const a=e.from||e[0],b=e.to||e[1];return [[f.id+"/"+a,ids.has(a)?a:""],[f.id+"/"+b,ids.has(b)?b:""]]})}),[]),"edge");
 /* DC-04: the golden thread relations: key result to objective, work to objective (weighted links), invoice to project and budget line,
    ledger line to budget line and project, budget request to demand, budget line, project and objective */
 rel("kr_obj","Key result to objective","key_result","objective",()=>arr(G(()=>S.exe.krs,[])).map(k=>[k.id,k.o]));
 rel("init_obj","Work to objective (weighted)","project","objective",()=>{const L=G(()=>S.exe.links,{});return Object.keys(L).flatMap(i=>Object.keys(L[i]||{}).filter(o=>L[i][o]>0).map(o=>[i,o]))});
 rel("inv_proj","Invoice to project","invoice","project",()=>INVOICES.map(i=>[i.id,invProject(i.id).proj]));
 rel("inv_line","Invoice to budget line","invoice","budget_line",()=>INVOICES.map(i=>[i.id,invProject(i.id).line]));
 rel("led_line","Ledger line to budget line","ledger","budget_line",()=>arr(G(()=>S.bud.led,[])).map(e=>[e.id,e.line]));
 rel("led_proj","Ledger line to project","ledger","project",()=>arr(G(()=>S.bud.led,[])).map(e=>[e.id,e.p]));
 rel("br_dem","Budget request to demand","budget_request","demand",()=>arr(G(()=>BUDREQ.requests(),[])).map(r=>[r.id,r.dem]));
 rel("br_line","Budget request to budget line","budget_request","budget_line",()=>arr(G(()=>BUDREQ.requests(),[])).flatMap(r=>(r.lineIds&&r.lineIds.length?r.lineIds:[r.lineId||r.line]).map(l=>[r.id,l])));
 rel("br_proj","Budget request to project","budget_request","project",()=>arr(G(()=>BUDREQ.requests(),[])).map(r=>[r.id,r.proj]));
 rel("br_obj","Budget request to objective","budget_request","objective",()=>arr(G(()=>BUDREQ.requests(),[])).map(r=>[r.id,r.obj]));
 try{(window.ZLINK_REL_HOOKS||[]).forEach(f=>f(rel))}catch(e){}
 return R}
/* ---------- DC-04: the three golden-thread chains, computed from the source registries (not the cached graph) ----------
   demand to budget line: demand > budget request (r.dem) > the budget lines a funded request created, or the request's target project
     lines when it is not funded yet (labeled "proposed");
   invoice to project: invoice > contract (S.bud.con inv list) > project, else the trace graph (invoice node billed by a contract node,
     committed by a budget node, funding a project);
   variance to objective score: budget line variance (forecast minus approved) > project > objectives it contributes to (weights in
     S.exe.links) > each objective's score from its key results. Dollar figures are modeled. */
function invProject(id){const inv=INVOICES.find(i=>i.id===id);if(!inv)return {proj:"",line:"",via:"",path:[]};
 const con=G(()=>S.bud.con.find(c=>arr(c.inv).includes(id)),null),lines=G(()=>S.bud.lines,[]);
 const line=con&&lines.some(l=>l.id===con.line)?con.line:"";
 if(con&&con.proj)return {proj:con.proj,line,via:"contract",contract:con.id,path:[id,con.id,con.proj]};
 if(inv.node){const E_=G(()=>EDGES,[]);const up=(to,lab)=>(E_.find(e=>e[1]===to&&e[2]===lab)||[])[0];const v=up(inv.node,"billed"),bn=v&&up(v,"committed to"),pr=bn&&up(bn,"funded by");
  if(pr&&PROJ.some(p=>p.id===pr))return {proj:pr,line,via:"trace graph",contract:con?con.id:"",path:[id,v,bn,pr].filter(Boolean)}}
 return {proj:"",line,via:con?"contract (run budget, no project)":"",contract:con?con.id:"",path:con?[id,con.id]:[id]}}
const CHAINS={
 invoiceToProject:invProject,
 demandToLine(did){const d=G(()=>DEMAND.find(x=>x.id===did),null);if(!d)return {ok:false,why:"No demand "+did,path:[]};
  const brs=arr(G(()=>BUDREQ.requests(),[])).filter(r=>r.dem===did);if(!brs.length)return {ok:false,why:"No budget request carries this demand",path:[did]};
  const lines=G(()=>S.bud.lines,[]),out=[];
  brs.forEach(r=>{const own=(r.lineIds&&r.lineIds.length?r.lineIds:[r.lineId||r.line]).filter(l=>l&&lines.some(x=>x.id===l));
   if(own.length)out.push({br:r.id,lines:own,proposed:false,st:r.st});else{const pl=lines.filter(l=>l.p===r.proj).map(l=>l.id);out.push({br:r.id,lines:pl,proposed:true,proj:r.proj,st:r.st})}});
  const ok=out.some(x=>x.lines.length);return {ok,funded:out.some(x=>!x.proposed&&x.lines.length),rows:out,path:ok?[did,out[0].br].concat(out[0].lines.slice(0,1)):[did,out[0].br],why:ok?"":"The request has no target project lines yet"}},
 varianceToObjective(lid){const l=G(()=>S.bud.lines.find(x=>x.id===lid),null);if(!l)return {ok:false,why:"No budget line "+lid};
  const v=l.fcst-l.appr,w=G(()=>S.exe.links[l.p],{})||{},E_=G(()=>EXE,null);
  const rows=Object.keys(w).filter(o=>w[o]>0).map(o=>{const ob=G(()=>S.exe.objs.find(x=>x.id===o),null);const pg=ob&&E_?G(()=>E_.objProg(ob),null):null;
   return {obj:o,n:ob?ob.n:o,w:w[o],wvar:v*w[o],score:pg?Math.round(pg.p*100):null,exp:pg?Math.round(pg.e*100):null,st:pg?pg.st:""}});
  return {ok:rows.length>0&&rows.every(r=>r.score!=null),line:lid,proj:l.p,variance:v,rows,modeled:true,path:[lid,l.p].concat(rows.map(r=>r.obj)),why:rows.length?"":"The line's project is linked to no objective"}},
 /* every chain the seed data should carry; used by tools/tests/thread.js and the Trace drawer */
 verify(){const dem=arr(G(()=>DEMAND,[])).map(d=>Object.assign({id:d.id},CHAINS.demandToLine(d.id))).filter(x=>x.path.length>1);
  const inv=INVOICES.map(i=>Object.assign({id:i.id},invProject(i.id)));const lines=G(()=>S.bud.lines,[]).map(l=>Object.assign({id:l.id},CHAINS.varianceToObjective(l.id)));
  return {demand:dem,invoice:inv,variance:lines,missingNodes:["objective","key_result","ledger","budget_line","invoice"].filter(t=>!G(()=>[...universe().values()].some(u=>u.t===t),false))}}};
const SCRN=()=>new Set(SCREENS.map(s=>s[0]));
const SCRNAME=()=>new Set(SCREENS.map(s=>lc(s[1])));
function resolves(kind,ref){ref=ref==null?"":String(ref);if(!ref)return null; /* null = nothing to check */
 if(kind==="person")return actor(ref)==="person"||actor(ref)==="contractor"||actor(ref)==="msp"||actor(ref)==="agent"||has(ref)||actor(ref)==="role"||/^(Sponsor|Requester|Automatic|Robot)$/i.test(ref)?true:false;
 if(kind==="actor")return !!actor(ref)||has(ref);
 if(kind==="svc")return has(ref)||SVCREG.some(s=>lc(s.n)===lc(ref)||lc(s.n).includes(lc(ref))||lc(ref).includes(lc(s.n)))||SCRN().has(ref);
 if(kind==="screen"){return SCRNAME().has(lc(ref))||SCRN().has(ref)||SCREENS.some(s=>lc(s[1]).includes(lc(ref))||lc(ref).includes(lc(s[1])))}
 if(kind==="entity")return !!G(()=>DATAMODEL.tables[ref],null)||G(()=>PLAT.ent(ref),null)!=null;
 if(kind==="module")return G(()=>MODMAP.modules.some(m=>m.id===ref),false)||SCRN().has(ref);
 if(kind==="edge")return !!ref;
 return has(ref)}
let _dl=null,_dlK="";
function deadLinks(){const key=uniVersion()+"|"+Z.alias.length+"|"+(Z.dlRev||0)+"|"+G(()=>R15E.roles.version(),0);if(_dl&&_dlK===key)return _dl;_dlK=key;const out=[];let total=0;const by={};
 relations().forEach(r=>{let rows=[];try{rows=r.rows()}catch(e){rows=[]}const b=by[r.id]={total:0,bad:0};
  rows.forEach(([from,ref])=>{if(ref==null||ref==="")return;total++;b.total++;const ok=resolves(r.kind==="id"?r.to:r.kind,ref);if(ok===false){b.bad++;const fr=universe().get(String(from).split("/")[0]);out.push({rel:r.id,name:r.name,from:String(from),fromT:r.from,ref:String(ref),to:r.to,kind:r.kind,label:fr?fr.label:String(from)})}})});
 return _dl={out,total,by}}

/* ---------- the audit: every check returns {id,area,name,total,bad,items,fix,rem,std} ---------- */
const KEYOBJ=[["incident","Incidents"],["change_request","Changes"],["problem_record","Problems"],["request_item","Requests"],["project","Projects"],["project_task","Project tasks"],["invoice","Invoices"],["person","People"],["business_service","Services"],["config_item","Configuration items"],["metric_definition","Metrics"],["process_definition","Processes"],["knowledge_article","Knowledge articles"],["raid_item","RAID items"],["meeting","Meetings"],["approval","Approvals"],["debt_item","Debt items"],["contract_line","Contracts"]];
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
 add("Data","d_orphan_tbl","Tables outside the entity registry",tbl.length,tbl.filter(t=>!eid.has(t)&&t.indexOf("config_item")!==0).map(t=>E(t,t,"In DATAMODEL, not in the registry")),{rem:"Register through ATLAS.addEntity",std:"dmbok"});
 const fa=G(()=>PLAT.fieldsAll(),[]);const undecl=fa.filter(f=>f.basis==="default");const byE={};undecl.forEach(f=>{(byE[f.ent]=byE[f.ent]||[]).push(f.k)});
 add("Data","d_undecl","Fields with no declared authority or classification",fa.length,Object.keys(byE).map(e=>E(e,(G(()=>PLAT.ent(e).label,e)),byE[e].length+" fields: "+byE[e].slice(0,4).join(", ")+(byE[e].length>4?"...":""),()=>G(()=>ATLAS.focus(e)))),{units:undecl.length,rem:"Steward confirms authority and class per entity (routed to Technical debt)",std:"dmbok"});
 const refF=[];ents.forEach(e=>arr(e.fields).forEach(f=>{if(f.type==="ref"&&!f.ref)refF.push([e,f])}));
 const nref=ents.reduce((a,e)=>a+arr(e.fields).filter(f=>f.type==="ref").length,0);
 const byR={};refF.forEach(([e,f])=>{(byR[e.id]=byR[e.id]||[]).push(f.k)});
 add("Data","d_ref_untargeted","Reference fields with no declared target entity",nref,Object.keys(byR).map(e=>E(e,G(()=>PLAT.ent(e).label,e),byR[e].length+" refs: "+byR[e].slice(0,4).join(", "))),{units:refF.length,rem:"Declare the target entity on each reference field",std:"dmbok"});
 const dupP=G(()=>PLAT.FIXES.filter(f=>!(S.plat&&S.plat.applied&&S.plat.applied[f.id])),[]);
 const lab=ents.filter(e=>!e.fam&&e.id.indexOf("config_item")!==0).map(e=>[e,new Set(toks(e.label.replace(/\(.*\)/,"")))]);const near=[];
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
 const noOwnStep=[],noIo=[];pls.forEach(p=>arr(p.stepsList).forEach((s,i)=>{if(!s.owner&&STEPMODE.of(s.who)!=="robot")noOwnStep.push(E(p.id+"#"+(i+1),p.name+": "+s.n,"Acting as "+s.who+", no owner"));if(!s.in||!s.out)noIo.push(E(p.id+"#"+(i+1),p.name+": "+s.n,(s.in?"":"no input ")+(s.out?"":"no output")))}));
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
 const adpOK=k=>ADP_SCREEN[k]&&adpKeys.includes(ADP_SCREEN[k])||(Z.fixed.gate_inbox&&Z.gateCovered&&Z.gateCovered[k])||G(()=>R15E.gateCovered(k),false);
 add("Approvals","a_gate","Screens with a gate step that do not register in the inbox",gateScr.length,gateScr.filter(k=>!adpOK(k)).map(k=>E(k,(SCREENS.find(s=>s[0]===k)||[0,k])[1],arr(PROC.defs[k].steps).filter(s=>s.who==="gate").map(s=>s.n).join(", "),()=>go(k))),{rem:"Register gate items in the inbox adapter",std:"itil5"});
 const tpl=[];G(()=>SEARCHX.forEach(fn=>G(()=>fn(),[]).forEach(r=>{if(/notification/i.test(r.g||""))tpl.push(String(r.t))})),0);
 add("Approvals","n_events","Business events with no notification",BUS_EVENTS.length,BUS_EVENTS.filter(e=>!tpl.some(t=>e[2].test(t))&&!(Z.fixed.notify&&Z.notifyReg&&Z.notifyReg[e[0]])).map(e=>E(e[0],e[1],"No template in the notification engine")),{rem:"Register the event and a template",std:"itil5"});
 /* ---- INTEROPERABILITY ---- */
 const ip=interopMatrix();add("Interoperability","i_invoice","Invoice decision consumers that do not update",ip.consumers.length,ip.consumers.filter(c=>!c.updated).map(c=>E(c.id,c.name,c.how)),{rem:"Publish an invoice.decided event with consumers",std:"togaf"});
 add("Interoperability","i_flows","Expected invoice flows missing from the module map",ip.expected.length,ip.expected.filter(e=>!e.present).map(e=>E(e.id,e.name,"No flow from the invoice module")),{rem:"MODMAP.addFlows",std:"togaf"});
 return {at:new Date().toISOString().slice(0,19),checks:A,deadTotal:dl.total}}

/* ---------- interoperability: what an invoice decision updates ---------- */
const IP_CONS=[["budget","Budget (PO paid, contract milestone)"],["actuals","Budget line actuals"],["forecast","Forecast to complete"],["reserve","Reserve check"],["project","Project cost to date"],["vendor","Vendor record"],["metrics","Metrics"],["audit","Audit trail"],["notify","Notification"],["inbox","Inbox (item leaves the queue)"]];
const IP_EXP=[["bud_ven","Vendors and contracts"],["bud_over","Reserve and overruns"],["fin_budget","Budget lines and actuals"],["bud_model","Budget model and forecast"],["ppm_proj","Project cost"],["exe_dash","Executive metrics"],["adm_audit","Audit trail"],["chat_home","Notifications"],["inbox","Inbox"]];
function expectedFlows(){const fl=G(()=>MODMAP.flows,[]);return IP_EXP.map(e=>({id:e[0],name:e[1],present:fl.some(f=>f.from==="inv"&&f.to===e[0])}))}
function snapIP(){const b=S.bud||{};const j=x=>JSON.stringify(x);
 return {budget:j([b.po,b.con]),actuals:j((b.lines||[]).map(l=>l.act)),forecast:j((b.lines||[]).map(l=>l.fcst-l.act)),reserve:j([b.led,Z.ledger&&Object.values(Z.ledger).map(x=>x.reserve)]),project:j(PROJ.map(p=>p.paid)),vendor:j(b.vend),
  metrics:j(Object.keys(METRICS).map(k=>METRICS[k].cur)),audit:AUDIT.length,notify:(Z.notes||[]).length,inbox:G(()=>INBOX.items().filter(i=>i.src==="inv"&&i.sid==="INV-20433").length,-1)}}
function restoreIn(t,s){if(Array.isArray(t)&&Array.isArray(s)){t.length=s.length;s.forEach((v,i)=>{if(v&&typeof v==="object"&&t[i]&&typeof t[i]==="object")restoreIn(t[i],v);else t[i]=v});return}
 if(t&&s&&typeof t==="object"&&typeof s==="object"){Object.keys(t).forEach(k=>{if(!(k in s))delete t[k]});Object.keys(s).forEach(k=>{const v=s[k];if(v&&typeof v==="object"&&t[k]&&typeof t[k]==="object")restoreIn(t[k],v);else t[k]=v})}}
let _ipBusy=false;
function runIP(force){if(Z.ip&&!force)return Z.ip;if(_ipBusy)return Z.ip||{consumers:[],expected:[],at:""};_ipBusy=true;
 const id="INV-20433";const inv=INVOICES.find(i=>i.id===id);const res={consumers:IP_CONS.map(c=>({id:c[0],name:c[1],updated:false,how:"No change after the decision"})),expected:[],at:TODAY,invoice:id};
 try{
  const sv=JSON.parse(JSON.stringify({bud:S.bud,proj:PROJ,met:Object.keys(METRICS).map(k=>[k,METRICS[k].cur,METRICS[k].tr&&METRICS[k].tr.slice()]),dec:S.dec,inv:S.inv,led:Z.ledger,notes:Z.notes,ev:Z.events}));const alen=AUDIT.length;
  const before=snapIP();S.inv=id;const rr=window.render;window.render=()=>{};
  const b=document.createElement("button");b.setAttribute("data-decide","Approved");b.style.display="none";document.body.appendChild(b);b.click();b.remove();window.render=rr;
  const after=snapIP();
  res.consumers.forEach(c=>{if(String(before[c.id])!==String(after[c.id])){c.updated=true;c.how="Changed after the decision"}});
  /* restore in place */
  restoreIn(S.bud,sv.bud);restoreIn(PROJ,sv.proj);sv.met.forEach(([k,c,tr])=>{if(METRICS[k]){METRICS[k].cur=c;if(tr)METRICS[k].tr=tr}});
  Object.keys(S.dec).forEach(k=>delete S.dec[k]);Object.assign(S.dec,sv.dec);S.inv=sv.inv;AUDIT.splice(0,AUDIT.length-alen);
  Z.ledger=sv.led||{};Z.notes=sv.notes||[];Z.events=sv.ev||[];_bust();
 }catch(e){res.err=String(e&&e.message||e)}
 res.expected=expectedFlows();
 Z.ip=res;_ipBusy=false;return res}
function interopMatrix(){const r=runIP();r.expected=expectedFlows();return r}
function _bust(){_uni=null;_actors=null;_uvV="";Z.dlRev=(Z.dlRev||0)+1}
try{if(window.DATA)DATA.on("change",_bust)}catch(e){} /* a tenant switch or pack change drops the link universe at once (CL-56) */

/* ---------- event layer: invoice.decided fans out to budget, actuals, forecast, reserve, project, vendor, notify ---------- */
const POST=[];
function emitInvoice(id,dec){const inv=INVOICES.find(i=>i.id===id);if(!inv||!S.bud)return;undoInvoice(id,true);
 const eff=[],un={};const amt=inv.amt;const con=S.bud.con.find(c=>arr(c.inv).includes(id));const po=con&&S.bud.po.find(p=>p.ct===con.id&&p.st==="Open")||null;const line=po&&S.bud.lines.find(l=>l.id===po.line)||null;
 const pj=line?PROJ.find(p=>p.id===line.p):(con&&PROJ.find(p=>p.id===con.proj))||null;const vend=S.bud.vend.find(v=>lc(v.n)===lc(inv.vendor));
 const approved=/approve/i.test(dec),rejected=/reject/i.test(dec);
 if(approved){
  if(po){po.paid+=amt;un.po={id:po.id,paid:amt};eff.push(["budget","PO "+po.id+" paid "+money(po.paid)+" of "+money(po.ord)])}
  if(con){const m=con.ms.find(x=>String(x[0]).indexOf(id)>=0);if(m){un.ms={con:con.id,name:m[0],prev:m[3]};m[3]="Approved";eff.push(["budget","Contract "+con.id+" milestone marked Approved"])}}
  if(line){line.act+=amt;un.line={id:line.id,act:amt};eff.push(["actuals",line.id+" actual "+money(line.act)]);eff.push(["forecast","Forecast to complete on "+line.id+" is "+money(line.fcst-line.act)])}
  if(pj){pj.paid+=amt/1000;un.proj={id:pj.id,paid:amt/1000};eff.push(["project",pj.short+" paid to date "+K$(pj.paid*1000)])}
  const over=line&&line.act>line.fcst;Z.ledger[id]=Z.ledger[id]||{};un.reserve=1;
  eff.push(["reserve",over?"Line "+line.id+" is "+money(line.act-line.fcst)+" over forecast: reserve draw review opened":"No draw needed"+(line?" ("+money(line.fcst-line.act)+" left on "+line.id+")":" (funded from the run budget)")])}
 else if(rejected&&po){po.inv=Math.max(0,po.inv-amt);un.po={id:po.id,inv:-amt};eff.push(["budget","PO "+po.id+" invoiced total reduced by the disputed "+money(amt)])}
 else eff.push(["budget","No money moves while the invoice is on hold"]);
 if(vend){un.vend={id:vend.id,prev:vend.lastDecision||""};vend.lastDecision=dec+" "+id+" "+TODAY;eff.push(["vendor",vend.n+": last decision recorded"])}
 eff.push(["notify","Notice to "+(pj?pj.owner:"the invoice owner")+" and Accounts payable"]);
 Z.notes.unshift({id:"N"+(Z.notes.length+1),ev:"invoice.decided",t:inv.id+" "+dec.toLowerCase()+": "+inv.vendor+" "+money(amt),to:[pj?pj.owner:"Avery Chen","Avery Chen"],at:TODAY,rec:id});
 Z.ledger[id]=Object.assign(Z.ledger[id]||{},{dec,at:TODAY,eff,un,reserve:eff.find(e=>e[0]==="reserve")?eff.find(e=>e[0]==="reserve")[1]:""});
 Z.events.unshift({ev:"invoice.decided",rec:id,dec,n:eff.length,at:TODAY});
 G(()=>_origAudit("Downstream effects of "+id,eff.map(e=>e[0]).join(", ")));
 G(()=>{if(METRICS.m_zl_fanout){METRICS.m_zl_fanout.cur=Math.min(100,Math.round(100*Object.keys(Z.ledger).length/Math.max(1,Object.keys(S.dec).length||1)))}})}
function undoInvoice(id,silent){const L=Z.ledger[id];if(!L||!L.un)return;const u=L.un;G(()=>{
  if(u.po){const p=S.bud.po.find(x=>x.id===u.po.id);if(p){if(u.po.paid)p.paid-=u.po.paid;if(u.po.inv)p.inv-=u.po.inv}}
  if(u.ms){const c=S.bud.con.find(x=>x.id===u.ms.con);const m=c&&c.ms.find(x=>x[0]===u.ms.name);if(m)m[3]=u.ms.prev}
  if(u.line){const l=S.bud.lines.find(x=>x.id===u.line.id);if(l)l.act-=u.line.act}
  if(u.proj){const p=PROJ.find(x=>x.id===u.proj.id);if(p)p.paid-=u.proj.paid}
  if(u.vend){const v=S.bud.vend.find(x=>x.id===u.vend.id);if(v)v.lastDecision=u.vend.prev}});
 delete Z.ledger[id];Z.notes=Z.notes.filter(n=>n.rec!==id);if(!silent)G(()=>_origAudit("Reversed downstream effects of "+id,"Undo"))}
let _origAudit=window.audit;
function hookAudit(){if(NOFIX||window.audit.__zl)return;_origAudit=window.audit;
 const w=function(a,d){const r=_origAudit.apply(this,arguments);try{const m=/^(approved|rejected|on hold) invoice$/i.exec(a||"");if(m){const id=String(d||"").split(" ")[0];if(/^INV-/.test(id))emitInvoice(id,m[1])}
  else if(/^undid decision$/i.test(a||"")&&/^INV-/.test(String(d||"")))undoInvoice(String(d))}catch(e){console.error("zlink event",e)}return r};w.__zl=1;window.audit=w}

/* ---------- graph: connected records and reverse links ---------- */
let _gr=null,_grV="";
function graph(){const v=uniVersion();if(_gr&&_grV===v)return _gr;_grV=v;const out=new Map(),inn=new Map();
 relations().forEach(r=>{if(r.kind==="entity"||r.kind==="edge"||r.kind==="screen")return;let rows=[];try{rows=r.rows()}catch(e){}
  rows.forEach(([f,t])=>{f=String(f).split("/")[0];if(t==null||t===""||String(t)===f)return;t=String(t);const U=universe();if(!U.has(f))return;
   let tt=t;if(!U.has(tt)){const s=SVCREG.find(x=>lc(x.n)===lc(t));if(s)tt=s.id;else return}
   (out.get(f)||out.set(f,[]).get(f)).push({rel:r.name,id:tt});(inn.get(tt)||inn.set(tt,[]).get(tt)).push({rel:r.name,id:f})})});
 return _gr={out,inn}}
function openRec(id){id=String(id);const u=universe().get(id);if(!u)return false;
 try{
  if(u.t==="person"){person360(u.id);return true}
  if(u.t==="record"){recDrawer(u.id);return true}
  if(u.t==="invoice"){go("inv",u.id);return true}
  if(u.t==="metric"){go("metrics",u.id);return true}
  if(u.t==="objective"){go("exe_strat");if(window.THREAD&&THREAD.open)setTimeout(()=>THREAD.open(u.id),120);return true}
  if(u.t==="key_result"){go("exe_strat");setTimeout(()=>G(()=>EXE.krDrawer(u.id)),120);return true}
  if(u.t==="ledger"&&window.openBudgetDrill){openBudgetDrill("led:"+u.id);return true}
  if(u.t==="budget_line"&&window.openBudgetDrill){openBudgetDrill("line:"+u.id);return true}
  if(u.t==="budget_request"&&window.BUDREQ&&BUDREQ.openReq){go("bud_req");setTimeout(()=>G(()=>BUDREQ.openReq(u.id)),120);return true}
  if(u.t==="process"){PROCLIB.open(u.id);return true}
  if(u.t==="workflow"){FLOWX.open(u.id);return true}
  if(u.t==="meeting"&&window.MEETX){MEETX.open(u.id);return true}
  if(u.t==="demand"&&window.demandDrawer){demandDrawer(u.id);return true}
  if(u.t==="task"&&window.taskDrawer){taskDrawer(u.id);return true}
  if(u.t==="service"&&window.openService360){openService360(u.alias?(SVCREG.find(s=>s.n===u.id)||{}).id:u.id);return true}
 }catch(e){}
 /* fall back to the search index, which holds an opener for every searchable record */
 let hit=null;G(()=>searchIndex().some(r=>{if(String(r.t||"").split(" ")[0]===id){hit=r;return true}}),0);if(hit&&hit.f){hit.f();return true}
 return false}
function connected(id){id=String(id);const g=graph(),U=universe();const grp={};
 const push=(dir,x)=>{const t=U.get(x.id);if(!t)return;const key=(dir==="out"?"Points to: ":"Referenced by: ")+(TYPEN[t.t]||t.t);(grp[key]=grp[key]||[]).push({id:x.id,t:t.label,sub:x.rel,tag:x.id,st:"info",go:()=>openRec(x.id)})};
 arr(g.out.get(id)).forEach(x=>push("out",x));arr(g.inn.get(id)).forEach(x=>push("in",x));
 return Object.keys(grp).sort().map(k=>({key:k,label:k,rows:grp[k]}))}
let _drT=0;
let _hint=null;
function connPanel(){const d=document.getElementById("drawer");if(!d||!d.innerHTML||d.querySelector("[data-zl-conn]"))return;const hint=_hint;_hint=null;
 const head=(d.querySelector("h2,h1")||{}).textContent||"";const txt=(d.innerText||"").slice(0,500);let id=null;const U=universe();
 if(U.has(head.trim())&&U.get(head.trim()).t==="person")id=head.trim();
if(!id&&hint&&U.has(hint)&&(graph().out.has(hint)||graph().inn.has(hint)))id=hint;
 if(!id){const toks=txt.match(/\b([A-Z]{2,5}-?\d{2,6}|PR\d|m_[a-z0-9_]+|[A-Z]\d{1,3})\b/g)||[];id=toks.find(t=>U.has(t)&&U.get(t).t!=="person"&&(graph().out.has(t)||graph().inn.has(t)))||null}
 if(!id)return;const groups=connected(id);if(!groups.length)return;const n=groups.reduce((a,g)=>a+g.rows.length,0);const lid="zl_"+id.replace(/\W/g,"_");
 const sec=document.createElement("section");sec.setAttribute("data-zl-conn",id);sec.className="zl-conn";
 sec.innerHTML=`<h3>Connected records <span class="pill mute">${n}</span></h3><p class="muted small">Every record that points to ${H(id)} or that it points to, from the cross-module relations. Source: Connections and gaps.</p>${lrHTML({id:lid,groups,limit:5,search:true})}`;
 d.appendChild(sec)}
function hookOpeners(){if(NOFIX)return;["recDrawer","person360"].forEach(n=>{const f=window[n];if(typeof f!=="function"||f.__zl)return;const w=function(a){_hint=a==null?null:String(a);return f.apply(this,arguments)};w.__zl=1;window[n]=w})}
function watchDrawer(){if(NOFIX)return;hookOpeners();const d=document.getElementById("drawer");if(!d||d.__zl)return;d.__zl=1;new MutationObserver(()=>{clearTimeout(_drT);_drT=setTimeout(()=>G(connPanel),120)}).observe(d,{childList:true})}

/* ---------- fixes ---------- */
const FIXLOG=(id,what,n,state)=>{Z.log=Z.log.filter(x=>x.id!==id);Z.log.push({id,what,n,state:state||"applied",at:TODAY})};
const REFMAP={service:"business_service",ci:"config_item",configuration_item:"config_item",caller:"person",requested_for:"person",assigned_to:"person",owner:"person",manager:"person",approver:"person",opened_by:"person",requester:"person",created_by:"person",assignee:"person",sponsor:"person",resolved_by:"person",closed_by:"person",project:"project",task:"project_task",problem:"problem_record",change:"change_request",incident:"incident",vendor:"core_company",company:"core_company",invoice:"invoice",knowledge_article:"knowledge_article",kb:"knowledge_article",objective:"objective",capability:"maturity_capability",policy:"policy",contract:"ast_contract",demand:"demand_request",department:"cost_center",cost_center:"cost_center"};
function fixRefs(){const T=G(()=>DATAMODEL.tables,{});let n=0,un=0;const ids=Object.keys(T);
 ids.forEach(t=>arr(T[t].fields).forEach(f=>{if(f.type!=="ref"||f.ref)return;const k=lc(f.k).replace(/_(id|ref)$/,"");let tg=REFMAP[k]||(T[k]?k:null);
  if(!tg&&/^parent/.test(k))tg=t;if(!tg){const m=ids.filter(x=>x!==t&&x.indexOf("cmdb_ci_")!==0&&(x===k||x.endsWith("_"+k)));if(m.length===1)tg=m[0]}
  if(tg&&(T[tg]||tg===t)){f.ref=tg;f.refBy="Connectivity audit, steward to confirm";n++}else un++}));
 G(()=>PLAT.refresh());FIXLOG("fx_ref","Declared the target entity on reference fields",n,un?"partial: "+un+" left for the steward":"applied");return n}
const RUNTIME=["automatic","anyone","any user","any admin","workflow engine","inbox","claude","claude sonnet","requester","sponsor","implementer","approvers","approver","the executive","subject matter expert","drawing studio","process library","discovery sources","organizer","secretary","carrier","approver rule","policy"];
const ABBR={ceo:"chief executive",cio:"chief information",cfo:"chief financial",coo:"chief operating",cto:"chief technology",pmo:"portfolio project management",hr:"people",cmdb:"configuration",tbm:"technology business management",kcs:"knowledge"};
const expand=t=>norm(t).split(" ").map(w=>ABBR[w]||w).join(" ");
function fixAliases(){const dl=deadLinks().out.filter(d=>d.kind==="actor"||d.kind==="person");const seen=new Set();let n=0,rt=0;
 const people=arr(G(()=>ORGX.people,[]));const doms=arr(G(()=>ORGX.domains,[]));
 uniq(dl.map(d=>d.ref)).forEach(ref=>{const k=norm(ref);if(!k||seen.has(k))return;seen.add(k);
  if(RUNTIME.includes(k)){Z.alias.push({k,text:ref,to:"Resolved at run time",conf:100,via:"runtime role"});rt++;return}
  const w=toks(expand(ref));if(!w.length)return;
  let best=null,bs=0;doms.forEach(d=>{const hay=new Set(toks([d.label].concat(d.aliases||[]).join(" ")));let c=0;w.forEach(x=>{if(hay.has(x))c++});const s=c/w.length;if(s>bs){bs=s;best=d}});
  let bp=null,ps=0;people.forEach(p=>{const hay=new Set(toks(p.title));let c=0;w.forEach(x=>{if(hay.has(x))c++});const s=c/w.length;if(s>ps){ps=s;bp=p}});
  if(bp&&ps>=.67&&ps>=bs){Z.alias.push({k,text:ref,to:bp.name,conf:Math.round(ps*100),via:"title"});n++;return}
  if(best&&bs>=.5){best.aliases=best.aliases||[];if(!best.aliases.includes(ref))best.aliases.push(ref);Z.alias.push({k,text:ref,to:best.label,conf:Math.round(bs*100),via:"domain"});n++}});
 _actors=null;Z.dlRev=(Z.dlRev||0)+1;const left=uniq(deadLinks().out.filter(d=>d.kind==="actor"||d.kind==="person").map(d=>d.ref)).length;
 FIXLOG("fx_alias","Registered role names as resolvers (accountability domain, title, or run-time role)",n+rt,left?"partial: "+left+" names resolve to nobody":"applied");return n+rt}
function fixMetricUse(){const names=SCREENS.map(s=>s[1]);let n=0,left=0;
 Object.keys(METRICS).forEach(k=>{const m=METRICS[k];if(!Array.isArray(m.use))return;m.use=m.use.map(u=>{if(resolves("screen",u))return u;const w=toks(u);let b=null,bs=0;names.forEach(nm=>{const h=new Set(toks(nm));let c=0;w.forEach(x=>{if(h.has(x))c++});const s=c/Math.max(1,w.length);if(s>bs||(s===bs&&b&&nm.length<b.length)){bs=s;b=nm}});if(b&&bs>=.99){n++;return b}left++;return u})});
 Z.dlRev=(Z.dlRev||0)+1;FIXLOG("fx_metricuse","Repointed metric 'used on' names that matched a renamed screen",n,left?"partial: "+left+" names match no screen":"applied");return n}
function fixStepIO(){const defs=G(()=>PROC.defs,{});let n=0;
 G(()=>PROCLIB.list()).forEach(p=>{const d=defs[p.id];if(!d||!Array.isArray(d.steps))return;const st=d.steps;st.forEach((s,i)=>{if(!s.in&&i>0&&st[i-1].out){s.in=st[i-1].out;s.inInferred=1;n++}if(!s.out&&i<st.length-1&&(st[i+1].in||st[i+1].n)){s.out=st[i+1].in||st[i+1].n;s.outInferred=1;n++}})});
 G(()=>PROCLIB.refresh());FIXLOG("fx_stepio","Filled step inputs and outputs from the neighboring step (flagged inferred)",n,"partial: first and last steps need the real source and result");return n}
function roleToPerson(n){const t=norm(String(n).replace(/^the\s+/i,""));if(!t)return null;const e=expand(t);const rh=G(()=>R15E.roles.holderOf(n),"");if(rh&&DIR.some(x=>norm(x.name)===norm(rh)))return rh;
 let d=DIR.find(x=>norm(x.name)===t);if(d)return d.name;d=DIR.find(x=>x.kind==="human"&&(norm(x.role)===t||norm(x.role)===e));if(d)return d.name;
 const p=arr(G(()=>ORGX.people,[])).find(x=>x.kind!=="agent"&&(norm(x.title)===t||norm(x.title)===e));return p&&DIR.some(x=>norm(x.name)===norm(p.name))?p.name:null}
function fixPeople(){if(window.who&&window.who.__zlp)return 0;const ow=window.who,op=window.person360;if(typeof ow!=="function")return 0;
 const w=function(a){const r=ow.apply(this,arguments);if(r||typeof a!=="string")return r;const t=roleToPerson(a);return t&&t!==a?ow.call(this,t):r};w.__zlp=1;window.who=w;
 if(typeof op==="function"){const p=function(a){if(typeof a==="string"&&!ow(a)){const t=roleToPerson(a);if(t)arguments[0]=t}return op.apply(this,arguments)};p.__zlp=1;window.person360=p}
 FIXLOG("fx_people","Person chips that name a role (Chief Editor, the CEO) now open the person who holds the role",2,"applied");return 2}
function fixWfService(){const fl=G(()=>FLOWX.flows(),[]);const by={};fl.forEach(f=>{if(f.service&&f.table){(by[f.table]=by[f.table]||{})[f.service]=(by[f.table][f.service]||0)+1}});let n=0;
 fl.forEach(f=>{if(!f.service&&f.table&&by[f.table]){const s=Object.keys(by[f.table]).sort((a,b)=>by[f.table][b]-by[f.table][a])[0];f.service=s;n++}});
 const un=fl.filter(f=>!f.service).length;FIXLOG("fx_wfsvc","Set the service on workflows from the table they work on",n,un?"partial: "+un+" have no table":"applied");return n}
function fixFlows(){if(!G(()=>MODMAP.addFlows,0))return 0;const have=new Set(MODMAP.flows.map(f=>f.from+">"+f.to));const ids=new Set(MODMAP.modules.map(m=>m.id));const src=ids.has("inv")?"inv":null;let n=0;
 const add=[];IP_EXP.forEach(e=>{if(src&&ids.has(e[0])&&!have.has(src+">"+e[0])&&e[0]!=="inbox")add.push({from:src,to:e[0],data:"Invoice decision: "+e[1].toLowerCase(),entity:"invoice",mode:"event",trig:"Invoice approved, held or rejected"})});
 if(add.length){const r=G(()=>MODMAP.addFlows(add),null);n+=add.length}
 /* attach an entity to flows that carry text but name none */
 const nd=MODMAP.flows.filter(f=>!arr(f.refs).length&&f.data);let m=0;
 nd.forEach(f=>{const h=G(()=>PLAT.reuseCheck(f.data,""),[]).filter(x=>x.kind==="existing"&&x.sc>=.5)[0];if(h){const e=PLAT.ent(h.id);if(e){f.refs=[{id:e.id,kind:"reg",label:e.label,owner:e.owner,steward:e.steward,cls:e.cls,f:[],by:"Connectivity audit"}];f.partial=true;m++}}});
 G(()=>MODMAP.refresh());FIXLOG("fx_flows","Added invoice fan-out flows and attached an entity to untyped flows",n+m,"applied");return n+m}
function fixLineage(){const A=S.atlas;if(!A||!A.ovr)return 0;const ents=G(()=>PLAT.entities(),[]);let n=0,tot=0;
 G(()=>LIN.all()).filter(t=>t.status==="none").forEach(t=>t.gaps.forEach(g=>{tot++;const w=toks(g.phrase);if(!w.length)return;let best=null,bs=0,tie=false;
  ents.forEach(e=>{if(e.proposed)return;arr(e.fields).forEach(f=>{const hf=new Set(toks(f.label+" "+f.k)),he=new Set(toks(e.label));let c=0;w.forEach(x=>{if(hf.has(x))c+=1;else if(he.has(x))c+=.5});const s=c/w.length;if(s>bs+1e-9){bs=s;best=[e.id,f.k];tie=false}else if(Math.abs(s-bs)<1e-9&&best&&best[0]!==e.id)tie=true})});
  const key=t.id+"|"+norm(g.phrase);if(best&&bs>=.99&&!tie&&!A.ovr[key]){A.ovr[key]={ref:best[0]+"."+best[1],by:"Connectivity audit (proposed, steward to confirm)",at:TODAY,note:"Exact term match, confidence "+Math.round(bs*100)+"%"};n++}}));
const mine=["m_zl_score","m_zl_dead","m_zl_fanout","m_zl_orphans"];
 mine.forEach(id=>{const t=G(()=>LIN.trace(id),null);if(!t)return;t.gaps.forEach(g=>{const key=id+"|"+norm(g.phrase);if(!A.ovr[key]&&PLAT.ent("connectivity_finding")){A.ovr[key]={ref:"connectivity_finding."+(/consumer|updated/i.test(g.phrase)?"state":"check_id"),by:"Connectivity audit",at:TODAY,note:"Own metric, computed from connectivity_finding"};n++}})});
 if(n){G(()=>LIN.bump())}FIXLOG("fx_lineage","Mapped metric terms that match one field exactly",n,"partial: "+(tot-n)+" terms need a steward");return n}

/* inbox adapters */
const grpOf=h=>h<0?"Overdue":h<=24?"Due today":h<=24*7?"This week":"Later";
function mkItem(o){const it=Object.assign({kind:"action",cat:"Work",ic:"task",title:"",req:"",ageH:12,slaH:48,dueH:96,amt:null,risk:"low",why:"",ai:null,guard:"",ev:[],extra:"",can:{approve:false,reject:false,delegate:false},blk:"",rec:"",needNote:false,vendor:"",sim:false,openLabel:"Open",open:()=>{}},o);
 it.group=grpOf(it.dueH);it.urgent=it.dueH<0||it.risk==="high"||it.dueH<4||!!it.flag;it.sc=(it.urgent?0:1)*1e6+({approval:0,action:1,mention:2}[it.kind]||0)*1e4+Math.max(-48,it.dueH);return it}
function dueFromText(t){t=String(t||"");if(/overdue/i.test(t))return -12;let m=t.match(/^(\d+)\s*d/i);if(m)return +m[1]*24;m=t.match(/^(\d+)\s*h/i);if(m)return +m[1];return 96}
function fixInbox(){const A=G(()=>INBOX.adapters,null);if(!A)return 0;
 A.zl_work={key:"zl_work",label:"Assigned work not covered by another adapter",mod:"Connectivity audit (WORK providers)",fn:"WORK.fn(person)",wired:false,
  list(me){const out=[];arr(G(()=>WORK,[])).forEach(w=>{if(HANDLED_RX.test(w.kind)||WK_RX.some(r=>r.test(w.kind)))return;const rows=G(()=>w.fn(me),[])||[];const appr=/approv|gate|request|exception/i.test(w.kind);
   rows.slice(0,6).forEach(r=>out.push(mkItem({id:"zlw:"+w.tag+":"+r.id,src:"zl_work",sid:r.id,kind:appr?"approval":"action",cat:w.kind.replace(/ waiting$/,""),ic:appr?"gate":"task",title:r.t,req:"",dueH:r.due?dueFromText(r.due):120,risk:r.st==="warn"?"med":"low",flag:r.st==="warn",
    why:"Assigned to you in "+w.kind.toLowerCase()+". "+(r.sub||""),guard:"Decide in the owning screen; this module has no approve function the inbox can call.",ev:[["From",w.kind,""],["Detail",r.sub||"",""]],openLabel:appr?"Open to decide":"Open",open:()=>{if(r.go)r.go();else toast("No screen is linked to this item","warn")}})))});return out}};
 A.zl_events={key:"zl_events",label:"Downstream notices",mod:"Connectivity audit (event layer)",fn:"ZLINK.notes",wired:false,
  list(me){return arr(Z.notes).filter(n=>n.to.includes(me)).slice(0,5).map(n=>mkItem({id:"zln:"+n.id,src:"zl_events",sid:n.id,kind:"mention",cat:"Downstream notice",ic:"bell",title:n.t,req:"Event layer",dueH:48,why:"Sent to "+n.to.join(" and ")+" when the decision was recorded.",guard:"Notices are read-only.",ev:[["Event",n.ev,""],["Record",n.rec,""]],open:()=>{if(!openRec(n.rec))go("zl_conn")}}))}};
 G(()=>INBOX.state.fl);Z.fixed.inbox=1;FIXLOG("fx_inbox","Registered inbox adapters for dropped WORK providers and downstream notices",arr(G(()=>WORK,[])).filter(w=>!HANDLED_RX.test(w.kind)&&!WK_RX.some(r=>r.test(w.kind))).length,"applied");return 1}

/* MCP tools */
function fixMcp(){if(!window.MCPX||MCPX.tools.some(t=>t.n==="get_record"))return 0;
 const obj={type:"object"},str={type:"string"};
 const T=(n,d,props,req,ex)=>({n,d,write:false,ex,in:{type:"object",required:req,properties:props},out:obj});
 MCPX.tools.push(T("get_record","Read one record by id (incident, change, project, invoice, person, metric, process, workflow, service and more): label, owner, and connection counts.",{id:str},["id"],{id:"INC0412"}),
  T("list_records","List records of one type with an optional text filter.",{type:{type:"string",enum:Object.keys(TYPEN)},q:str,limit:{type:"integer",default:10,maximum:50}},["type"],{type:"incident",q:"portal",limit:5}),
  T("get_connections","Everything that points to a record or that it points to, with the relation name.",{id:str},["id"],{id:"PR1"}),
  T("list_approvals","List what is waiting for the signed-in person across the inbox adapters (read only; decisions go through the inbox).",{limit:{type:"integer",default:10,maximum:50}},[],{limit:5}),
  T("trace_metric","Trace a metric to the entity fields it is computed from, with gaps.",{metric_id:str},["metric_id"],{metric_id:"m_delivery"}),
  T("get_connectivity","Connectivity audit: counts per check, optionally one area (Data, Process, Workflow, Links, People, Platform, Approvals, Interoperability).",{area:str},[],{area:"Data"}));
 const prev=MCPX.call;
 MCPX.call=function(name,args){args=args||{};
  if(name==="get_record"){const u=universe().get(String(args.id));if(!u)throw new Error("No record "+args.id+". Try list_records.");const g=connected(u.id);return {id:u.id,type:u.t,label:u.label,owner:u.owner||"",connections:g.reduce((a,x)=>a+x.rows.length,0)}}
  if(name==="list_records"){const q=lc(args.q||"");const L=[...universe().values()].filter(u=>u.t===args.type&&!u.alias&&(!q||lc(u.id+" "+u.label).includes(q))).slice(0,Math.min(50,args.limit||10));return {total:L.length,records:L.map(u=>({id:u.id,label:u.label,owner:u.owner||""}))}}
  if(name==="get_connections"){return {id:args.id,groups:connected(args.id).map(g=>({relation:g.label,records:g.rows.map(r=>({id:r.id,label:r.t,via:r.sub}))}))}}
  if(name==="list_approvals"){const L=G(()=>INBOX.items(),[]).filter(i=>i.kind==="approval").slice(0,Math.min(50,args.limit||10));return {total:L.length,approvals:L.map(i=>({id:i.id,title:i.title,source:i.src,due_hours:Math.round(i.dueH),risk:i.risk}))}}
  if(name==="trace_metric"){const t=G(()=>LIN.trace(args.metric_id),null);if(!t)throw new Error("No metric "+args.metric_id);return {metric:t.id,status:t.status,traced_percent:t.pct,sources:[...(t.srcs instanceof Map?t.srcs.values():Object.values(t.srcs||{}))].map(s=>s.ent+"."+s.fld),gaps:t.gaps.map(g=>g.phrase)}}
  if(name==="get_connectivity"){const a=audit();return {at:a.at,checks:a.checks.filter(c=>!args.area||lc(c.area)===lc(args.area)).map(c=>({id:c.id,area:c.area,name:c.name,total:c.total,gaps:c.bad}))}}
  return prev.apply(this,arguments)};
 FIXLOG("fx_mcp","Added six MCP tools: get_record, list_records, get_connections, list_approvals, trace_metric, get_connectivity",6,"applied");return 6}

/* search and chat */
function scoreOf(a){a=a||audit();const c=a.checks.filter(x=>x.total>0);const s=c.reduce((t,x)=>t+(1-Math.min(1,(x.units||x.bad)/x.total)),0)/Math.max(1,c.length);return Math.round(s*100)}
function fixSearch(){if(Z.fixed.search)return;Z.fixed.search=1;
 SEARCHX.push(()=>{const o=[{g:"Connections",t:"Connections and gaps",m:"Platform",c:"--accent",f:()=>go("zl_conn"),k:"connectivity dead links orphans reverse links interoperability audit"}];
  G(()=>Z.last&&Z.last.checks.forEach(c=>{if(c.bad)o.push({g:"Connections",t:c.name+" ("+c.bad+")",m:c.area,c:"--warn-f",f:()=>{Z.sel=c.id;Z.tab=1;go("zl_conn")},k:c.rem+" "+c.id})}));return o});
 SEARCHX.push(()=>BUS_EVENTS.map(e=>({g:"Notification templates",t:e[1]+" notice",m:e[0],c:"--e4",f:()=>{Z.tab=4;go("zl_conn")},k:"notice event downstream "+e[0]})));
 Z.notifyReg={};BUS_EVENTS.forEach(e=>Z.notifyReg[e[0]]=1);Z.fixed.notify=1;
 FIXLOG("fx_search","Added search groups for Connections and templates for eight business events",9,"applied")}
function say2(q,t){if(typeof say==="function")say(q,{t})}
function fixAsk(){if(Z.fixed.ask)return;Z.fixed.ask=1;
 ASKX.push(q=>{const t=lc(q);let m;
  if(_inAsk){return /connected to|connections? (of|for)|dead links?|broken links?|connection gaps?|connectivity|how connected|what happens (when|if) .*invoice|processes?.*(no|without|missing) (an )?owner|entit(y|ies).*(nothing|no one|unused|orphan)|metrics?.*not traced/.test(t)}
  if((m=/(?:connected to|connections? (?:of|for)|links? to|backlinks? (?:of|for)|what (?:uses|references)) ([a-z0-9_-]+)/i.exec(q))){const id=m[1].toUpperCase();const rid=universe().has(m[1])?m[1]:universe().has(id)?id:null;if(rid){const g=connected(rid);const n=g.reduce((a,x)=>a+x.rows.length,0);say2(q,`<b>${H(rid)}</b> has <b>${n}</b> connections: ${g.map(x=>H(x.label.replace(/^(Points to|Referenced by): /,"$1 "))+" ("+x.rows.length+")").join("; ")||"none"}.`);openRec(rid);return true}}
  if(/dead links?|broken links?|connection gaps?|connectivity (?:score|gaps?|audit)|how connected/.test(t)){const a=audit();Z.last=a;say2(q,`Connectivity score <b>${scoreOf(a)}</b>. <b>${a.checks.reduce((n,c)=>n+c.bad,0)}</b> findings across ${a.checks.length} checks; <b>${deadLinks().out.length}</b> cross-module references do not resolve.`);go("zl_conn");return true}
  if(/what happens (?:when|if) .*invoice|invoice (?:approval )?(?:effects?|fan.?out|downstream)/.test(t)){const ip=runIP();say2(q,`An invoice decision updates <b>${ip.consumers.filter(c=>c.updated).length} of ${ip.consumers.length}</b> consumers: ${ip.consumers.map(c=>H(c.name)+(c.updated?" (yes)":" (no)")).join("; ")}.`);Z.tab=3;go("zl_conn");return true}
  if(/processes?.*(?:no|without|missing) (?:an )?owner/.test(t)){const c=audit().checks.find(x=>x.id==="p_noowner");say2(q,`<b>${c.bad}</b> of ${c.total} processes have no named owner.`);return true}
  if(/entit(?:y|ies).*(?:nothing|no one|nobody|no screen|unused|orphan)/.test(t)){const c=audit().checks.find(x=>x.id==="d_noscreen");say2(q,`<b>${c.bad}</b> entities have no reader or writer. First: ${c.items.slice(0,5).map(i=>H(i.label)).join(", ")||"none"}.`);return true}
  if(/metrics?.*not traced|untraced metrics?/.test(t)){const c=audit().checks.find(x=>x.id==="d_metric_untraced");say2(q,`<b>${c.bad}</b> of ${c.total} metrics are not traced to any field.`);go("plat_data");return true}
  return false});
 FIXLOG("fx_ask","Added chat intents for connections, dead links, invoice fan-out, ownerless processes, unused entities and untraced metrics",6,"applied")}
function fixDebt(a){if(!G(()=>DEBT.add,0)||Z.fixed.debt)return 0;Z.fixed.debt=1;let n=0;
 a.checks.filter(c=>c.bad>0&&["d_undecl","d_ref_untargeted","w_approver","w_assignee","a_gate","d_noscreen","p_nobackup"].includes(c.id)).forEach(c=>{const r=G(()=>DEBT.add({type:"ooc",title:"Connectivity: "+c.name+" ("+(c.units||c.bad)+")",sev:"Medium",source:"connectivity_audit",apps:[],owner:"Rina Okafor",owner2:"Jordan Lee",steward:"Data council chair",principal:Math.max(4,Math.round((c.units||c.bad)/10)),reason:c.rem,status:"open",fix:c.rem}),null);if(r)n++});
 FIXLOG("fx_debt","Routed remaining findings to Technical debt (one item per check)",n,"applied");return n}
let _fixing=false;
function fixAll(){if(NOFIX||_fixing)return;_fixing=true;
 try{[["fx_r15e_a",()=>G(()=>R15E.phaseA(),0)],["fx_ref",fixRefs],["fx_wfsvc",fixWfService],["fx_people",fixPeople],["fx_alias",fixAliases],["fx_metricuse",fixMetricUse],["fx_stepio",fixStepIO],["fx_flows",fixFlows],["fx_lineage",fixLineage],["fx_inbox",fixInbox],["fx_mcp",fixMcp],["fx_r15e_b",()=>G(()=>R15E.phaseB(),0)],["fx_r15e_c",()=>G(()=>R15E.phaseC(),0)],["fx_r15e_n",()=>G(()=>R15E.phaseN(),0)]].forEach(([id,f])=>{if(!Z.fixed[id]){try{f();Z.fixed[id]=1}catch(e){console.error("zlink fix",id,e)}}});
  fixSearch();fixAsk();hookAudit();watchDrawer();Z.ip=null;Z.ipStale=true}finally{_fixing=false}}

/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_zl_score:{n:"Connectivity score",f:"Σ (1 − gaps ÷ records checked) across all connectivity checks ÷ number of checks",u:"%",cur:0,tgt:90,badAt:70,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Architecture",use:["Connections and gaps"],rem:{kind:"sop",ref:"SOP-540",title:"Close connectivity gaps",agent:"Connectivity audit",auto:false,state:"idle",prog:"Re-runs the checks after each fix"}},
 m_zl_dead:{n:"Dead references",f:"Cross-module references that do not resolve ÷ cross-module references checked",u:"%",cur:0,tgt:1,badAt:5,dir:"min",max:20,tr:[0,0,0,0,0,0,0,0],owner:"Architecture",use:["Connections and gaps"],rem:{kind:"sop",ref:"SOP-541",title:"Repair a dead reference",agent:"Connectivity audit",auto:false,state:"idle",prog:"Lists the record, the field and the missing target"}},
 m_zl_fanout:{n:"Decision fan-out",f:"Consumers updated by an invoice decision ÷ consumers that should update (budget, actuals, forecast, reserve, project, vendor, metrics, audit, notice, inbox)",u:"%",cur:0,tgt:100,badAt:60,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Finance systems",use:["Connections and gaps","Invoice approval"],rem:{kind:"sop",ref:"SOP-542",title:"Add a consumer to a decision event",agent:"Connectivity audit",auto:false,state:"idle",prog:"Runs the sandboxed decision test and lists consumers that did not change"}},
 m_zl_orphans:{n:"Orphan records",f:"Entities with no reader or writer + processes linked to no module + modules with no flow in or out",u:"",cur:0,tgt:0,badAt:25,dir:"min",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Architecture",use:["Connections and gaps"],rem:{kind:"sop",ref:"SOP-543",title:"Place or retire an orphan",agent:"Connectivity audit",auto:false,state:"idle",prog:"Proposes the owning module"}}});
function syncMetrics(a){const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(1).concat([v])};
 const dl=deadLinks();set("m_zl_score",scoreOf(a));set("m_zl_dead",Math.round(1000*dl.out.length/Math.max(1,dl.total))/10);
 const ip=Z.ip;if(ip)set("m_zl_fanout",Math.round(100*ip.consumers.filter(c=>c.updated).length/Math.max(1,ip.consumers.length)));
 const g=id=>(a.checks.find(c=>c.id===id)||{bad:0}).bad;set("m_zl_orphans",g("d_noscreen")+g("p_nomodule")+g("m_noin")+g("m_noout"))}
function getAudit(force){if(!NOFIX&&Z.fixed.fx_r15e_c)G(()=>R15E.refresh());if(!force&&Z.last&&Date.now()-(Z.lastT||0)<4000)return Z.last;const a=audit();Z.last=a;Z.lastT=Date.now();G(()=>syncMetrics(a));return a}

/* ---------- screen ---------- */
const BEFORE={checks:{"d_noscreen":0,"d_noproc":0,"d_noowner":0,"d_orphan_tbl":0,"d_undecl":55,"d_ref_untargeted":68,"d_dup":6,"d_metric_untraced":80,"d_planned":5,"p_noowner":9,"p_nobackup":119,"p_nometric":10,"p_fewsteps":0,"p_stepowner":26,"p_stepio":85,"p_noentity":23,"p_nomodule":0,"p_screen_noproc":19,"m_noin":0,"m_noout":0,"m_nodata":23,"m_nononown":11,"w_owner":11,"w_service":60,"w_table":0,"w_assignee":199,"w_approver":36,"w_agent":0,"w_edge":0,"w_dec_owner":27,"task_proj":0,"task_pred":0,"task_own":0,"proj_own":0,"proj_rec":0,"dem_obj":0,"dem_sp":2,"dem_svc":0,"inv_node":0,"inv_con":0,"inv_vend":0,"meet_link":0,"meet_att":0,"meet_chair":0,"inc_svc":0,"inc_ci":0,"inc_own":0,"inc_prb":0,"inc_chg":0,"inc_kb":4,"inc_node":0,"chg_svc":0,"chg_ci":0,"chg_own":0,"prb_svc":0,"prb_inc":0,"svc_own":0,"svc_sme":0,"svc_proj":0,"svc_dep":0,"ci_svc":0,"ci_own":0,"ciedge":0,"po_vend":0,"po_con":0,"po_line":6,"con_inv":0,"con_proj":0,"con_own":0,"line_proj":0,"line_own":0,"vend_own":0,"raid_own":0,"raid_proj":0,"metric_use":33,"metric_agent":12,"metric_rem":22,"proc_own":3,"proc_bak":0,"proc_met":0,"proc_mod":0,"k_mcp":0,"k_mcp_write":0,"s_groups":0,"c_questions":0,"a_work":0,"a_gate":79,"n_events":0,"i_invoice":0,"i_flows":0},score:92,findings:1031,dead:329,label:"Round 14 build"};
const AREAS=["Data","Process","Workflow","Links","People","Platform","Search and chat","Approvals","Interoperability"];
const fixOf=id=>({d_ref_untargeted:"fx_ref",w_service:"fx_wfsvc",w_approver:"fx_alias",w_assignee:"fx_alias",m_nodata:"fx_flows",i_flows:"fx_flows",d_metric_untraced:"fx_lineage",a_work:"fx_inbox",k_mcp:"fx_mcp",k_mcp_write:"fx_mcp",s_groups:"fx_search",c_questions:"fx_ask",n_events:"fx_search",i_invoice:"fx_events",proc_own:"fx_alias",p_stepio:"fx_stepio",metric_use:"fx_metricuse"})[id]||null;
const stateOf=c=>{if(c.bad===0)return["good","Clean"];const f=fixOf(c.id);const b=BEFORE.checks[c.id];if(f&&Z.fixed[f]&&b!=null&&c.bad<b)return["info","Reduced from "+b];if(c.bad>0&&["d_undecl","d_noowner","p_noowner","p_nobackup","p_stepowner","d_dup","d_planned","a_gate"].includes(c.id))return["warn","Needs a human owner"];return["warn","Open"]};
function ring(pct,label){return `<div class="zl-ring" role="img" aria-label="${H(label)} ${pct}"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--hair)" stroke-width="3"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="${pct>=85?"var(--good-f)":pct>=65?"var(--warn-f)":"var(--bad-f)"}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(pct*97.4/100).toFixed(1)} 97.4" transform="rotate(-90 18 18)"/></svg><b class="num">${pct}</b></div>`}
function areaStats(a){return AREAS.map(ar=>{const cs=a.checks.filter(c=>c.area===ar);const bad=cs.reduce((n,c)=>n+c.bad,0);const b0=cs.reduce((n,c)=>n+(BEFORE.checks[c.id]==null?c.bad:BEFORE.checks[c.id]),0);return {ar,n:cs.length,bad,b0}}).filter(x=>x.n)}
function paneOverview(a){const sc=scoreOf(a),ar=areaStats(a),tot=ar.reduce((n,x)=>n+x.bad,0),t0=ar.reduce((n,x)=>n+x.b0,0),dl=deadLinks();const ip=Z.ip||{consumers:[]};
 const mx=Math.max(1,...ar.map(x=>Math.max(x.bad,x.b0)));
 return `<div class="zl-top">${card("Connectivity score","Mean share of records that connect, across "+a.checks.filter(c=>c.total).length+" checks",`<div class="zl-score">${ring(sc,"Connectivity score")}<div class="zl-kv"><div><span class="muted small">Before this round</span><b class="num">${BEFORE.score==null?"n/a":BEFORE.score}</b></div><div><span class="muted small">Findings now</span><b class="num" data-role="metric">${tot}</b></div><div><span class="muted small">Findings before</span><b class="num">${t0}</b></div></div></div><div class="row">${fchip("m_zl_score")}${fchip("m_zl_dead")}${fchip("m_zl_fanout")}${fchip("m_zl_orphans")}</div>`)}
 ${card("Findings by area","Bars compare the baseline build with now",`<div class="zl-bars">${ar.map(x=>`<div class="zl-bar"><span>${H(x.ar)}</span><i class="b0" style="width:${Math.round(100*x.b0/mx)}%" title="Before: ${x.b0}"></i><i class="b1" style="width:${Math.round(100*x.bad/mx)}%" title="Now: ${x.bad}"></i><b class="num">${x.b0} to ${x.bad}</b></div>`).join("")}</div>${legend([["Before (baseline build)","--faint"],["Now","--accent"]])}`)}</div>
 <div class="grid g4 zl-tiles">${[["Dead references",dl.out.length,"of "+dl.total+" checked"],["Orphan records",(METRICS.m_zl_orphans||{}).cur,"entities, processes, modules"],["Decision fan-out",ip.consumers.filter(c=>c.updated).length+" of "+ip.consumers.length,"invoice decision consumers"],["Fixes applied",Z.log.filter(l=>!/^partial/.test(l.state)).length+" of "+Z.log.length,"by registration APIs"]].map(t=>`<div class="tile glass"><span class="muted small">${H(t[0])}</span><b class="num" data-role="metric">${H(t[1])}</b><span class="muted small">${H(t[2])}</span></div>`).join("")}</div>
 ${card("Biggest open gaps","Ranked by findings; click to see the records",`<div class="zl-list">${a.checks.filter(c=>c.bad).sort((x,y)=>y.bad-x.bad).slice(0,8).map(c=>`<button class="zl-row" data-zl-sel="${c.id}"><span class="pill ${stateOf(c)[0]}">${H(stateOf(c)[1])}</span><b>${H(c.name)}</b><span class="muted small">${H(c.area)}</span><span class="num">${c.bad}${c.units&&c.units!==c.bad?" ("+c.units+" fields)":""}</span></button>`).join("")}</div>`)}
 ${procCard("zl_conn")}`}
function paneGaps(a){const sel=a.checks.find(c=>c.id===Z.sel)||null;
 const rows=a.checks.map(c=>({id:c.id,area:c.area,name:c.name,total:c.total,bad:c.bad,before:BEFORE.checks[c.id]==null?"":BEFORE.checks[c.id],st:stateOf(c)[1],rem:c.rem,std:c.std}));
 return btHTML({id:"zl_gaps",cols:[{k:"area",label:"Area"},{k:"name",label:"Check",wrap:1},{k:"total",label:"Checked",cls:"num"},{k:"before",label:"Before",cls:"num"},{k:"bad",label:"Now",cls:"num",fmt:r=>`<b class="num">${r.bad}</b>`},{k:"st",label:"Status",fmt:r=>`<span class="pill ${r.bad?(/human/.test(r.st)?"warn":/Reduced/.test(r.st)?"info":"warn"):"good"}">${H(r.st)}</span>`},{k:"rem",label:"Remediation",wrap:1}],rows,key:"id",h:460,rowH:44,facets:["area","st"],exportName:"connectivity-checks",open:id=>{Z.sel=id;render()}})+
 (sel?card(sel.name,sel.area+" · "+sel.bad+" of "+sel.total+(sel.units?" ("+sel.units+" fields)":""),sel.items.length?`<div class="tscroll"><table><thead><tr><th>Record</th><th>Detail</th><th></th></tr></thead><tbody>${sel.items.slice(0,60).map((it,i)=>`<tr><td><b>${H(it.label)}</b><br><small class="muted">${H(String(it.id).slice(0,48))}</small></td><td class="small">${H(it.detail)}</td><td>${it.go||universe().has(String(it.id).split("|")[0])?`<button class="btn quiet" data-zl-item="${sel.id}|${i}">Open</button>`:""}</td></tr>`).join("")}</tbody></table></div>${sel.items.length>60?`<p class="muted small">${sel.items.length-60} more. Export the table for the full list.</p>`:""}<p class="small"><b>Remediation:</b> ${H(sel.rem)} ${sel.std?stdChip(sel.std,"Standard behind this check"):""}</p>`:empty("No findings","This check is clean.")):"")}
function paneDead(a){const dl=deadLinks();const hv=HARNESS.walk||{},sc=HARNESS.scan||{};
 const rows=dl.out.map((d,i)=>({id:"d"+i,rel:d.name,from:d.from,label:d.label,ref:d.ref,fx:Z.alias.some(x=>x.text===d.ref)?"Resolver added":"Open"}));
 return `<div class="grid g3"><div class="tile glass"><span class="muted small">References checked</span><b class="num" data-role="metric">${dl.total}</b></div><div class="tile glass"><span class="muted small">Do not resolve</span><b class="num" data-role="metric">${dl.out.length}</b></div><div class="tile glass"><span class="muted small">Chips and links with a missing target (every screen)</span><b class="num" data-role="metric">${sc.after?sc.after.dead+" of "+sc.after.chips:"not run"}</b>${sc.before?`<span class="muted small">Baseline: ${sc.before.dead} of ${sc.before.chips}</span>`:""}</div></div>`+
 card("Cross-module references that do not resolve","Record, field and the missing target",dl.out.length?btHTML({id:"zl_dead",cols:[{k:"rel",label:"Reference"},{k:"from",label:"From",cls:"num"},{k:"label",label:"Record",wrap:1},{k:"ref",label:"Missing target",wrap:1},{k:"fx",label:"Fix status"}],rows,key:"id",h:380,rowH:42,facets:["rel","fx"],exportName:"dead-references"}):empty("Every reference resolves","All "+dl.total+" cross-module references checked point at a record that exists."))+
 card("Linked-record chips and drill links with a missing target","Playwright scan (zl_scan.js) reads every chip on every screen; the walker (zl_walk.js) clicked "+(hv.after?hv.after.total:0)+" of them and checked the destination renders and shows the record. Baseline list below, with fix status",(sc.beforeList&&sc.beforeList.length)?`<div class="tscroll"><table><thead><tr><th>Screen</th><th>Link</th><th>Target</th><th>Fix status</th></tr></thead><tbody>${sc.beforeList.slice(0,60).map(d=>{const fixedNow=!(arr(sc.deadList).some(x=>x.screen===d.screen&&x.attr===d.attr&&x.val===d.val));return `<tr><td>${H(d.screen)}</td><td class="small">${H(d.txt||d.attr)}</td><td class="small">${H(d.attr.replace("data-",""))}: ${H(d.val)}</td><td><span class="pill ${fixedNow?"good":"warn"}">${fixedNow?"Fixed":"Open"}</span></td></tr>`}).join("")}</tbody></table></div><p class="muted small">Walker: ${hv.after?hv.after.bad+" of "+hv.after.total+" clicked links flagged":"not run"}${hv.before?" (baseline "+hv.before.bad+" of "+hv.before.total+")":""}.</p>`:empty("Scan results not embedded","Run zl_scan.js and zl_embed.js to embed results."))}
function paneOrphans(a){const ids=["d_noscreen","d_noproc","d_orphan_tbl","p_nomodule","p_screen_noproc","m_noin","m_noout"];const rows=[];a.checks.filter(c=>ids.includes(c.id)).forEach(c=>c.items.forEach((it,i)=>rows.push({id:c.id+"#"+i,kind:c.name,label:it.label,detail:it.detail})));
 return card("Orphans","Entities, processes, screens and modules with a missing connection",rows.length?btHTML({id:"zl_orph",cols:[{k:"kind",label:"Orphan type",wrap:1},{k:"label",label:"Record",wrap:1},{k:"detail",label:"Why",wrap:1}],rows,key:"id",h:420,rowH:42,facets:["kind"],exportName:"orphans"}):empty("No orphans","Everything is connected."))}
function paneFan(a){const ip=runIP();
 return `<div class="grid g2">${card("Invoice decision fan-out","Sandbox test: INV-20433 approved through the real handler, state compared, then restored ("+(ip.at||"")+")",`<div class="tscroll"><table><thead><tr><th>Consumer</th><th>Result</th></tr></thead><tbody>${ip.consumers.map(c=>`<tr><td>${H(c.name)}</td><td><span class="pill ${c.updated?"good":"bad"}">${c.updated?"Updated":"Not updated"}</span></td></tr>`).join("")}</tbody></table></div><div class="row"><button class="btn" data-zl-run>Run the test again</button>${fchip("m_zl_fanout")}</div>`)}
 ${card("Flows from the invoice module on the map","Expected consumers and whether a registered flow exists",`<div class="tscroll"><table><thead><tr><th>Consumer module</th><th>Flow</th></tr></thead><tbody>${ip.expected.map(e=>`<tr><td>${H(e.name)} <small class="muted">${H(e.id)}</small></td><td><span class="pill ${e.present?"good":"bad"}">${e.present?"Registered":"Missing"}</span></td></tr>`).join("")}</tbody></table></div>`)}</div>
 ${card("Effects recorded for real decisions","Each decision writes its downstream effects here and can be reversed with Undo on the invoice",Object.keys(Z.ledger).length?`<div class="tscroll"><table><thead><tr><th>Invoice</th><th>Decision</th><th>Consumer</th><th>Effect</th></tr></thead><tbody>${Object.keys(Z.ledger).flatMap(k=>arr(Z.ledger[k].eff).map(e=>`<tr><td>${H(k)}</td><td>${H(Z.ledger[k].dec)}</td><td>${H(e[0])}</td><td class="small">${H(e[1])}</td></tr>`)).join("")}</tbody></table></div>`:empty("No decisions yet","Approve, hold or reject an invoice on Invoice approval and the effects appear here."))}
 ${card("Downstream notices","Read-only copies sent to the people named; also in the inbox as notices",Z.notes.length?`<ul class="zl-ul">${Z.notes.slice(0,10).map(n=>`<li><b>${H(n.t)}</b> <small class="muted">to ${H(n.to.join(", "))}</small></li>`).join("")}</ul>`:empty("No notices yet",""))}`}
function paneFixes(){return card("What was fixed","Each fix uses a registration API; partial fixes name what is left",`<div class="tscroll"><table><thead><tr><th>Fix</th><th>Count</th><th>Status</th></tr></thead><tbody>${Z.log.map(l=>`<tr><td>${H(l.what)}</td><td class="num">${l.n}</td><td><span class="pill ${/^partial/.test(l.state)?"warn":"good"}">${H(l.state)}</span></td></tr>`).join("")||`<tr><td colspan=3 class="muted">No fixes applied (audit only).</td></tr>`}</tbody></table></div>`)+
 card("Role resolvers added","Role names in workflows mapped to an accountability domain or a title, with match confidence",Z.alias.length?`<div class="tscroll"><table><thead><tr><th>Role text</th><th>Resolves to</th><th>Via</th><th>Match</th></tr></thead><tbody>${Z.alias.map(x=>`<tr><td>${H(x.text)}</td><td>${H(x.to)}</td><td>${H(x.via)}</td><td class="num">${x.conf}%</td></tr>`).join("")}</tbody></table></div>`:empty("None","No role names needed a resolver."))}
function paneMetrics(){return card("Connectivity metrics","Formula, owner, target and remediation on each chip",`<div class="row">${["m_zl_score","m_zl_dead","m_zl_fanout","m_zl_orphans"].map(k=>fchip(k)).join("")}</div>`)+card("Maturity","Process maturity of this screen's process on the CMMI scale, rolled up in Maturity models",`<p class="small">${G(()=>{const m=PROCLIB.get("connectivity_audit");return m?"Level "+m.level+" of target "+m.target+" ("+m.model+")":"Process registers with the library once it loads."},"")}</p>`)}
function screenFn(){const a=getAudit(true);Z.last=a;
 const tot=a.checks.reduce((n,c)=>n+c.bad,0),dl=deadLinks();
 return `<div class="screen zl">${hero("Platform · connectivity","Connections and gaps",`<b>${scoreOf(a)}</b> connectivity score. <b>${tot}</b> findings in <b>${a.checks.filter(c=>c.bad).length}</b> of ${a.checks.length} checks; <b>${dl.out.length}</b> of ${dl.total} cross-module references do not resolve${BEFORE.findings!=null?`. Round 14 build: ${BEFORE.findings} findings, ${BEFORE.dead} unresolved references, score ${BEFORE.score}`:""}.`,`<div class="row">${fchip("m_zl_score")}<button class="btn primary" data-zl-rerun>Re-run the audit</button>${stdChip("togaf","Interoperability and data-architecture views")}${stdChip("dmbok","Data lineage, ownership and reference data checks")}</div>`)}${lensNote()}
 ${(()=>{const X=G(()=>ZLINK15.tabs(a),{t:[],p:[]});return views("zl_v",["Overview","Gaps by check","Dead links","Orphans","Event fan-out","Fixes and resolvers","Metrics"].concat(X.t),[paneOverview(a),paneGaps(a),paneDead(a),paneOrphans(a),paneFan(a),paneFixes(),paneMetrics()].concat(X.p))})()}</div>`}
REG("zl_conn","Connections and gaps","platform","M5 12h4M15 12h4M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM3 6v12M21 6v12",screenFn);
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-zl-sel]")){Z.sel=t.dataset.zlSel;S.v.zl_v=1;render();return}
 if(t=e.target.closest("[data-zl-item]")){const [c,i]=t.dataset.zlItem.split("|");const ck=(Z.last||{checks:[]}).checks.find(x=>x.id===c);const it=ck&&ck.items[+i];if(it){if(it.go)it.go();else if(!openRec(String(it.id).split("|")[0]))toast("No screen is linked to this record","warn")}return}
 if(t=e.target.closest("[data-zl-run]")){Z.ip=null;runIP(true);audit_("Connectivity: re-ran the invoice decision test","INV-20433 sandbox");render();return}
 if(t=e.target.closest("[data-zl-rerun]")){_bust();Z.ip=null;getAudit(true);audit_("Connectivity: re-ran the audit","");toast("Audit re-run","good");render();return}});
function audit_(a,d){G(()=>(window.audit.__zl?_origAudit:window.audit)(a,d))}

/* ---------- Feature Contract: process, data, metrics, links ---------- */
const OWN="Rina Okafor",BAK="Jordan Lee";
PROC.reg("zl_conn",{title:"How connection gaps are found and closed",std:["togaf","dmbok","itil5"],steps:[
 {n:"Collect",d:"Read the entity registry, module map, process library, workflows, search index and inbox adapters.",who:"robot",owner:OWN,sla:"On open",in:"Registries",out:"Record universe"},
 {n:"Check",d:"Run data, process, workflow, cross-module reference, platform and interoperability checks.",who:"robot",owner:OWN,sla:"On open",in:"Record universe",out:"Findings"},
 {n:"Fix by registration",d:"Declare targets, add flows, register adapters, resolvers, tools and intents. Each fix is logged.",who:"robot",owner:OWN,sla:"On load",in:"Findings",out:"Fix log"},
 {n:"Route to a human",d:"Findings that need a person (owners, authority, classification) become Technical debt items.",who:"gate",owner:OWN,sla:"5 working days",in:"Open findings",out:"Debt items"},
 {n:"Re-measure",d:"Score and trend per area; the invoice decision test re-runs.",who:"human",owner:BAK,sla:"Weekly",in:"Fix log",out:"Connectivity score"}]});
function wire(){const W=Z.wired=Z.wired||{};
 try{
  if(!W.ent&&window.ATLAS&&ATLAS.addEntity){const fld=(k,label,type,cls)=>({k,label,type,authority:"platform",classification:cls||"internal"});
   G(()=>ATLAS.addEntity({id:"connectivity_finding",label:"Connectivity finding",domain:"plat",source:"Connections and gaps",ownerApp:"zl_conn",ownerMod:"zl_conn",status:"live",note:"One failed connectivity check on one record. Thin; remediation work is a debt_item referenced by id. Near duplicate found: contract_finding (a feature misses a contract rule); this one is about a record whose reference does not resolve, so it stays separate.",
    fields:[fld("check_id","Check","enum"),fld("area","Area","enum"),fld("record_ref","Record","ref"),fld("detail","Detail","text"),fld("state","State","enum"),fld("owner","Owner","ref","personal"),fld("debt_item_id","Debt item","ref"),fld("opened_at","Opened","date")]}));G(()=>{if(window.COVER&&COVER.recs&&!COVER.recs.some(r=>r.key==='ZLFIND')){COVER.recs.push({key:'ZLFIND',label:'Connectivity findings',scr:['zl_conn'],mod:'zl_conn',n:90,ent:'connectivity_finding',how:'new',path:'ZLFIND'});G(()=>COVER.compute&&COVER.compute())}});W.ent=true}
  if(!W.mod&&window.MODMAP&&MODMAP.addModule&&W.ent){const ids=new Set(MODMAP.modules.map(m=>m.id));const fl=[];
   const f=(dir,other,data,entity,mode,trig)=>{if(ids.has(other))fl.push({dir,other,data,entity,mode,trig})};
   f("pull","plat_reg","Entities and fields","metric_definition","api","Audit opened");f("pull","plat_pmap","Processes and steps","process_definition","api","Audit opened");f("pull","flw_design","Workflows and steps","process_definition","api","Audit opened");f("pull","ppl_org","People and accountability domains","person","api","Resolver lookup");f("pull","itsm_inc","Incident, change and problem ids","incident","api","Audit opened");
   f("push","plat_debt","Findings that need a human","connectivity_finding","event","Check fails");f("push","inbox","Downstream notices and uncovered work","notification","event","Decision recorded");f("push","adm_audit","Fixes applied","audit_event","event","Fix applied");f("push","chat_home","Connection questions answered","notification","api","Question asked");
   const r=G(()=>MODMAP.addModule({id:"zl_conn",name:"Connections and gaps",sn:"Connections",band:"plt",own:"Architecture",proposed:false,r:["project","incident","change_request","business_service","invoice","person","process_definition","metric_definition"],w:["connectivity_finding"],flows:fl}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=true}
  if(!W.proc&&window.PROCLIB&&PROCLIB.addProcess&&W.mod){const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
   const r=G(()=>PROCLIB.addProcess({id:"connectivity_audit",name:"Connectivity audit",module:"zl_conn",family:G(()=>PROCLIB.get("plat_gate").family,undefined),owner:OWN,backup:BAK,trigger:"A registry changes or a person opens Connections and gaps",
    steps:[st("Collect","Read registries.","robot",OWN,"On open","Registries","Record universe"),st("Check","Run checks.","robot",OWN,"On open","Record universe","Findings"),st("Fix by registration","Apply registration fixes.","robot",OWN,"On load","Findings","Fix log"),st("Route to a human","Debt items for owner decisions.","gate",OWN,"5 working days","Open findings","Debt items"),st("Re-measure","Score and trend.","human",BAK,"Weekly","Fix log","Connectivity score")],
    inputs:["Registries"],outputs:["Connectivity score","Debt items"],entities:["connectivity_finding","process_definition","metric_definition","person"],metrics:["m_zl_score","m_zl_dead","m_zl_fanout","m_zl_orphans"],model:"cmmi"}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=true}
 }catch(e){console.error("zlink wire",e)}
 if(W.mod&&window.MODMAP&&MODMAP.refresh&&!W.fl){W.fl=1;G(()=>MODMAP.refresh())}}
SEARCHX.push(()=>[{g:"Platform",t:"Connections and gaps",m:"Connectivity score and dead links",c:"--accent",f:()=>go("zl_conn"),k:"connectivity audit gaps dead links orphans reverse links backlinks interoperability"}]);
function boot(){if(NOFIX)return;wire();fixAll();wire();G(()=>{const a=getAudit(true);fixDebt(a);Z.last=null})}
/* R15 speed: run the same work in three idle slices after first paint so no single task blocks input for seconds */
const idleRun=(f,ms)=>{const run=()=>{try{f()}catch(e){console.error("zlink idle",e)}};setTimeout(()=>{if(window.requestIdleCallback)requestIdleCallback(run,{timeout:6000});else run()},ms)};
function bootStaged(){if(NOFIX)return;idleRun(()=>{wire();fixAll()},1800);idleRun(()=>{wire()},2600);idleRun(()=>{G(()=>{const a=getAudit(true);fixDebt(a);Z.last=null})},3200)}
window.ZLINK={_fx:{fixRefs,fixWfService,fixAliases,fixMetricUse,fixStepIO,fixFlows,fixLineage,fixInbox,fixMcp,fixSearch,fixAsk,fixDebt,hookAudit,watchDrawer},audit:()=>getAudit(true),deadLinks,universe,graph,connected,open:openRec,interop:runIP,fixAll,score:()=>scoreOf(getAudit(true)),log:()=>Z.log,state:Z,relations,actor,wire,boot,chains:CHAINS,refresh:_bust};
if(!NOFIX){bootStaged();idleRun(()=>{wire();watchDrawer();G(()=>{const l=Z.log.find(x=>x.id==='fx_lineage'),keep=l?l.n:0;fixLineage();const l2=Z.log.find(x=>x.id==='fx_lineage');if(l2)l2.n+=keep});Z.last=null},4200)}
})();
