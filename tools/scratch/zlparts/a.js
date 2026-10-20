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
function actorIdx(){const v=[DIR.length,G(()=>ORGX.people.length,0),G(()=>ORGX.domains.length,0),Z.alias.length].join(",");
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
 let r="";const al=Z.alias.find(a=>a.k===t);if(al)r="role";else{const dom=G(()=>ORGX.byDomain(text),null);if(dom&&(dom.ownerId||dom.owner||dom.ownerName||dom.person||dom.length))r="role"}
 _actMemo.set(t,r);return r}
const isHuman=n=>{const k=actor(n);return k==="person"||k==="contractor"||k==="msp"};

/* ---------- the record universe: every id the app can open ---------- */
let _uni=null,_uniV="";
const itsm=()=>window.ITSMX||{incidents:[],changes:[],problems:[]};
let _uvT=0,_uvV="";
function uniVersion(){if(_uvV&&Date.now()-_uvT<2000)return _uvV;_uvT=Date.now();return _uvV=[PROJ.length,TASKS.length,DEMAND.length,INVOICES.length,MEETINGS.length,DIR.length,G(()=>itsm().incidents.length,0),G(()=>itsm().changes.length,0),G(()=>SEARCHX.length,0),G(()=>Object.keys(METRICS).length,0),G(()=>PROCLIB.list().length,0),G(()=>FLOWX.flows().length,0),G(()=>S.bud.po.length,0),(window.SCALE&&SCALE.on)?1:0].join(",")}
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
 arr(G(()=>KGN,[])).forEach(n=>{if(!U.has(n.id))add(n.id,"record",n.n||n.t)});
 DIR.forEach(d=>add(d.name,"person",d.name,{kind:d.kind}));
 Object.keys(METRICS).forEach(k=>add(k,"metric",METRICS[k].n,{owner:METRICS[k].owner}));
 arr(G(()=>PROCLIB.list(),[])).forEach(p=>add(p.id,"process",p.name,{owner:p.owner}));
 arr(G(()=>FLOWX.flows(),[])).forEach(f=>add(f.id,"workflow",f.name,{owner:f.owner}));
 G(()=>{S.bud.po.forEach(p=>add(p.id,"po",p.d,{vendor:p.v}));S.bud.con.forEach(c=>add(c.id,"contract",c.n,{owner:c.own}));S.bud.vend.forEach(v=>add(v.id,"vendor",v.n,{owner:v.own}));S.bud.lines.forEach(l=>add(l.id,"budget_line",l.n,{owner:l.own}))});
 arr(G(()=>PPMRAID,[])).forEach(r=>add(r.id,"raid",r.t||r.n||r.title,{owner:r.own||r.owner}));
 arr(G(()=>typeof KCSX.items==="function"?KCSX.items():KCSX.items,[])).forEach(k=>add(k.id,"article",k.t||k.n));
 /* the search index is the app's own list of openable records: anything it names starting with an id token is real */
 G(()=>{SEARCHX.forEach(fn=>{G(()=>fn(),[]).forEach(r=>{const m=/^([A-Za-z]{2,5}-?\d{2,6}|[a-z]{2,6}_[a-z0-9_]+)\b/.exec(String(r.t||""));if(m&&!U.has(m[1]))add(m[1],lc(r.g||"record"),String(r.t).slice(m[1].length).trim()||m[1],{viaSearch:1})})})});
 return _uni=U}
const has=id=>universe().has(String(id));
const TYPEN={project:"Project",task:"Task",demand:"Demand request",invoice:"Invoice",meeting:"Meeting",incident:"Incident",change:"Change",problem:"Problem",service:"Service",ci:"Configuration item",record:"Strategy or work record",person:"Person",metric:"Metric",process:"Process",workflow:"Workflow",po:"Purchase order",contract:"Contract",vendor:"Vendor",budget_line:"Budget line",raid:"RAID item",article:"Knowledge article"};

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
 return R}
const SCRN=()=>new Set(SCREENS.map(s=>s[0]));
const SCRNAME=()=>new Set(SCREENS.map(s=>lc(s[1])));
function resolves(kind,ref){ref=ref==null?"":String(ref);if(!ref)return null; /* null = nothing to check */
 if(kind==="person")return actor(ref)==="person"||actor(ref)==="contractor"||actor(ref)==="msp"||actor(ref)==="agent"||has(ref)||actor(ref)==="role"||/^(Sponsor|Requester|Automatic)$/i.test(ref)?true:false;
 if(kind==="actor")return !!actor(ref)||has(ref);
 if(kind==="svc")return has(ref)||SVCREG.some(s=>lc(s.n)===lc(ref)||lc(s.n).includes(lc(ref))||lc(ref).includes(lc(s.n)))||SCRN().has(ref);
 if(kind==="screen"){return SCRNAME().has(lc(ref))||SCRN().has(ref)||SCREENS.some(s=>lc(s[1]).includes(lc(ref))||lc(ref).includes(lc(s[1])))}
 if(kind==="entity")return !!G(()=>DATAMODEL.tables[ref],null)||G(()=>PLAT.ent(ref),null)!=null;
 if(kind==="module")return G(()=>MODMAP.modules.some(m=>m.id===ref),false)||SCRN().has(ref);
 if(kind==="edge")return !!ref;
 return has(ref)}
let _dl=null,_dlK="";
function deadLinks(){const key=uniVersion()+"|"+Z.alias.length+"|"+(Z.dlRev||0);if(_dl&&_dlK===key)return _dl;_dlK=key;const out=[];let total=0;const by={};
 relations().forEach(r=>{let rows=[];try{rows=r.rows()}catch(e){rows=[]}const b=by[r.id]={total:0,bad:0};
  rows.forEach(([from,ref])=>{if(ref==null||ref==="")return;total++;b.total++;const ok=resolves(r.kind==="id"?r.to:r.kind,ref);if(ok===false){b.bad++;const fr=universe().get(String(from).split("/")[0]);out.push({rel:r.id,name:r.name,from:String(from),fromT:r.from,ref:String(ref),to:r.to,kind:r.kind,label:fr?fr.label:String(from)})}})});
 return _dl={out,total,by}}
