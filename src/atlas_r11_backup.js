/* mod_plat_atlas: the data atlas. Takes over screen plat_data (Master data model).
   Tabs: Diagram (pan, zoom, drill, inspector, overlays), Metric lineage (how each metric is calculated, traced to fields),
   Domain map (cross-domain reference matrix and ring), Tables and checks (the previous screen, preserved).
   Loads before the registry and links modules, so PLAT and LINKS are only touched inside functions, never at load. */
(function(){
const E=esc,N0=n=>Math.round(n).toLocaleString("en-US");
const PREV=(typeof _R!=="undefined"&&_R["plat_data"])||null;
S.atlas=Object.assign({ov:"domain",sel:null,fld:null,dom:null,exp:{},q:"",refs:"all",cam:null,trace:null,itab:"fields",metric:"m_delivery",ovr:{},lfld:null,lq:"",showAll:false,panel:true,hist:[],approved:{},confirmed:{},debtLogged:{}},S.atlas||{});
const A=S.atlas;
["approved","confirmed","debtLogged"].forEach(k=>{if(!A[k])A[k]={}});
/* every DATAMODEL.register call flows through here so the atlas honors the optional domain, status, owner module and steward, and updates live */
let DMV=1,_dmT=0;
(function(){const R=DATAMODEL.register;if(!R||R._atlas)return;
 const w=function(t,def){const cur=R.call(this,t,def);
  if(def){["domain","status","ownerMod","steward","note","ownerApp","seed"].forEach(k=>{if(def[k]!=null)cur[k]=def[k]})}
  if(!cur.domain&&/^fin_/.test(t))cur.domain="money";
  DMV++;try{if(window.PLAT&&PLAT.refresh)PLAT.refresh();if(window.LIN)LIN.bump()}catch(e){}
  clearTimeout(_dmT);_dmT=setTimeout(()=>{if(S.screen==="plat_data"||S.screen==="plat_reg"){try{render()}catch(e){}}},120);
  return cur};w._atlas=1;DATAMODEL.register=w})();
const scrName=id=>{const s=SCREENS.find(x=>x[0]===id);return s?s[1]:""};
const hasScr=id=>SCREENS.some(x=>x[0]===id);
let _sbn=null;
function scrByName(n){if(!_sbn||_sbn.n!==SCREENS.length){_sbn={n:SCREENS.length,m:new Map()};SCREENS.forEach(s=>_sbn.m.set(String(s[1]).toLowerCase(),s[0]))}
 const k=String(n||"").toLowerCase();if(_sbn.m.has(k))return _sbn.m.get(k);
 for(const [nm,id] of _sbn.m)if(nm===k||nm.indexOf(k)===0||(k.length>6&&nm.indexOf(k)>=0))return id;return null}
const trunc=(s,n)=>String(s).length>n?String(s).slice(0,n-1)+"…":String(s);
const plural=(n,a,b)=>N0(n)+" "+(n===1?a:(b||a+"s"));
const reduced=()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}};

/* ---------- domains, colors, layers ---------- */
const DC={service:"--p1",ops:"--e4",cmdb:"--w1",agree:"--u1",portfolio:"--u3",agile:"--s1",people:"--s4",fin:"--p5",money:"--p2",know:"--p6",gov:"--w3",plat:"--u4",planned:"--faint"};
const DPOOL=["--p3","--e1","--s3","--p4"];
const LAYERS=[["Plan and deliver",["portfolio","agile","fin","money"]],["Run and support",["service","agree","ops"]],["Foundation data",["people","cmdb"]],["Knowledge, AI, governance and platform",["know","gov","plat"]],["Planned entities",["planned"]]];
const dName=k=>k==="planned"?"Planned entities":((window.PLAT&&PLAT.DOM[k])?PLAT.DOM[k].n:k);
const AUTHC={platform:"--p1",external:"--u3",shared:"--w1"};
const AUTHN={platform:"Oukala owns it",external:"External system owns it",shared:"Shared, newest wins"};
const CLSC={public:"--s4",internal:"--p5",confidential:"--w1",restricted:"--e4",personal:"--u1"};
const COVC=["--faint","--p6","--p3","--p1"];
const COVN=["Feeds no metric","Feeds 1 or 2 metrics","Feeds 3 to 5 metrics","Feeds 6 or more metrics"];
const covIdx=n=>n<=0?0:n<=2?1:n<=5?2:3;
const STC={canonical:"--s3",duplicate:"--e1",fixed:"--p3",planned:"--faint",proposed:"--p4"};
const STN={canonical:"Canonical, one copy",duplicate:"Duplicate, fix open",fixed:"Duplicate fixed in preview",planned:"Planned, not built yet",proposed:"Proposed, waiting for approval"};
const OVN=[["domain","Domain"],["authority","Authority"],["class","Classification"],["metrics","Metric coverage"],["status","Duplicate status"]];
const TYG={ref:["→","Reference"],person:["→","Reference to a person"],string:["Aa","Text"],text:["Aa","Text"],enum:["▾","Choice"],choice:["▾","Choice"],select:["▾","Choice"],number:["#","Number"],currency:["$","Money"],money:["$","Money"],date:["▦","Date"],datetime:["▦","Date and time"],percent:["%","Percent"],duration:["⏱","Duration"],"boolean":["✓","Yes or no"],bool:["✓","Yes or no"],list:["☰","List"]};
const tyg=t=>TYG[t]||["Aa",String(t||"Text")];

/* ---------- the model: entities, planned entities, reference edges ---------- */
let _M=null,_Mk="";
function model(){
 const es=PLAT.entities();const lv=LIN.ver();
 const key=es.length+"|"+Object.keys(DATAMODEL.tables).length+"|"+Object.keys(PLAT.FIXES).length+"|"+JSON.stringify(S.plat&&S.plat.applied||{})+"|"+lv+"|"+DMV+"|"+Object.keys(A.approved).length+"|"+(window.SCALE&&SCALE.on?1:0);
 if(_M&&_Mk===key)return _M;
 const ent=new Map(),list=[];
 es.forEach(e=>{if(!DC[e.domain]){DC[e.domain]=DPOOL[Object.keys(DC).length%DPOOL.length]}});
 es.forEach(e=>{const o=Object.assign({},e,{ghost:false,out:[],inn:[],fkey:null});ent.set(e.id,o);list.push(o)});
 const raw=LINKS.edgesData().filter(x=>x.type==="ref"),edges=[];
 const pl=new Map(PLAT.PLANNED.map(p=>[p[0],p]));
 const need=new Set();raw.forEach(r=>{if(r.ghost)need.add(r.to)});LIN.ghostsUsed().forEach(g=>need.add(g));
 need.forEach(id=>{const p=pl.get(id);if(!p||ent.has(id))return;const o={id,label:p[2],owner:"Not built yet",steward:p[3],domain:"planned",pd:p[1],nf:0,fields:[],fam:null,cls:"internal",ret:"",readers:[],writers:[],status:"planned",authMix:{},ghost:true,why:p[4],use:p[5],out:[],inn:[]};ent.set(id,o);list.push(o)});
 raw.forEach(r=>{const a=ent.get(r.from),b=ent.get(r.to);if(!a||!b)return;const fields=String(r.field||"").split(", ").filter(Boolean);edges.push({from:r.from,to:r.to,fields,ghost:!!r.ghost,cross:a.domain!==b.domain});a.out.push(r.to);b.inn.push(r.from)});
 const deg={};list.forEach(e=>deg[e.id]=e.out.length+e.inn.length);
 const hub=new Set(list.filter(e=>e.inn.length>=12).map(e=>e.id));
 const more=(PLAT.missing?PLAT.missing():PLAT.PLANNED).filter(p=>!ent.has(p[0])).map(p=>({id:p[0],label:p[2],domain:p[1],steward:p[3],why:p[4],use:p[5]}));
 /* domain pair counts */
 const pair={};edges.forEach(e=>{const a=ent.get(e.from).domain,b=ent.get(e.to).domain;const k=a+"|"+b;(pair[k]=pair[k]||[]).push(e)});
 const ddeg={};list.forEach(e=>{if(!e.proposed)ddeg[e.domain]=(ddeg[e.domain]||0)+deg[e.id]});
 const top=Object.keys(ddeg).filter(k=>k!=="planned").sort((a,b)=>ddeg[b]-ddeg[a])[0]||"service";
 _Mk=key;_M={list,ent,edges,deg,hub,more,pair,ddeg,top,byDom:k=>list.filter(e=>e.domain===k)};return _M}

/* key field ordering for an expanded box */
const KEYRE=/^(id|number|name|wbs|clause|asset_tag|step|template|asset|definition)$/;
function ordFields(e){if(e._ord)return e._ord;
 const fs=(e.fields||[]).map((f,i)=>({f,i,m:PLAT.fieldMeta(e.id,f)}));
 const rank=x=>KEYRE.test(x.f.k)?0:(x.f.type==="ref"||x.f.type==="person")?1:/^(currency|money|percent|number|duration)$/.test(x.f.type||"")?2:3;
 e._ord=fs.sort((a,b)=>rank(a)-rank(b)||a.i-b.i);return e._ord}

/* ---------- tracing metrics to fields: parser, resolver, index ---------- */
const STOP=new Set("the a an of in on to for and or with by per at as is are be that than from all each any every their its this these those only not no over under within after before between into out up down it was were has have had who whose which when where while into".split(" "));
const stem=w=>{w=String(w).toLowerCase();if(w.length>4&&/ies$/.test(w))return w.slice(0,-3)+"y";if(w.length>3&&/(ss|us|is)$/.test(w))return w;if(w.length>3&&/s$/.test(w))return w.slice(0,-1);return w};
const toks=s=>String(s||"").toLowerCase().replace(/[^a-z0-9% ]+/g," ").split(/\s+/).filter(Boolean);
const _stc=new Map();
const stems=s=>{const k=String(s==null?"":s);let v=_stc.get(k);if(!v){v=toks(k).filter(w=>!STOP.has(w)).map(stem);if(_stc.size>6000)_stc.clear();_stc.set(k,v)}return v};
const normP=s=>String(s||"").toLowerCase().replace(/[^a-z0-9% ]+/g," ").replace(/\s+/g," ").trim();

/* synonym rules: [regex, entity, [fields], weight]. Entity-only rules pick fields by word overlap. */
const SYN=[
 [/\b(incidents?|tickets?|sev ?[1-4])\b/,"incident",[],1],
 [/\b(outage|downtime|availability|uptime)\b/,"business_service",["availability_30d"],1],
 [/\bmonitored|monitoring\b/,"cmdb_ci",["uptime_30d"],.7],
 [/(incidents?|tickets?|major).*\b(opened|declared)\b|^(incident )?opened$/,"incident",["opened_at"],.8],
 [/(incidents?|tickets?).*\bresolved\b|\bresolved.*(incidents?|tickets?)|^resolved$|resolution time|service restored|^restored$/,"incident",["resolved_at"],.8],
 [/(incidents?|tickets?).*(inside|within).*(sla|target)|made sla|incidents? .*resolution target/,"incident",["made_sla","sla_due"],1],
 [/\bfirst response\b/,"incident",["first_response_at"],1],
 [/\bpriorit(y|ies)\b.*\boverrid|\boverrid.*\bpriorit/,"incident_priority_policy",["overridden","priority"],1],
 [/\bimpact score\b/,"incident_priority_policy",["impact_score","impact_band"],1],
 [/\breopen/,"incident",["reopen_count"],1],
 [/\brouted to a team|team first|claimed\b/,"incident",["assignment_group","reassignment_count"],.8],
 [/\b(backlog|hours open|open incidents)\b/,"incident",["state","opened_at"],.8],
 [/\bchanges?\b(?! the)|change request|rollback|rolled back|hotfix/,"change_request",[],1],
 [/\b(changes?|deployments?|releases?)\b.*\b(failed|rolled back|rollback|caused an incident|hotfix)\b/,"change_request",["state","close_code"],.8],
 [/\bchanges?\b.*\b(closed|successful|outcome)\b/,"change_request",["state","close_code"],.9],
 [/\bapprovals?\b|\bapprover\b/,"approval",[],.8],
 [/\bproblems?\b|known error|workaround|repeat incident/,"problem_record",["workaround","repeat_incidents"],1],
 [/(?<!approvals? )(?<!resource )(?<!decision was )\brequest(s|ed)?\b(?! time)|requested items?|\bfulfil/,"request_item",[],.9],
 [/\bfulfil+ment time|cycle time\b/,"request_item",["cycle_hours"],.8],
 [/\bcost per request|process cost|fulfil+ment step/,"request_item",["process_cost"],.9],
 [/\brework\b|no more information|resubmission/,"fulfillment_step",["rework"],.8],
 [/\bcatalog items?\b|\bcatalog\b/,"catalog_item",[],.8],
 [/\b(xla|experience|survey)\b/,"xla_response",["score","dimension"],.9],
 [/\bsla\b|service level|agreements?|\bolas?\b|\bclocks?\b|underpinning/,"task_sla",["has_breached","business_percentage","stage"],.8],
 [/agreement types|coverage policy|active (slas|agreements)/,"sla_definition",["type","goal"],.8],
 [/\bprojects?\b|portfolio return/,"project",[],.9],
 [/(?<!monthly )(?<!error )\bbudget\b(?! lines?)|approved \$|^approved$/,"project",["budget"],.8],
 [/actual cost|actual spend|spent\b/,"project",["actual_cost"],.9],
 [/forecast at completion|estimate at completion/,"project",["actual_cost","cpi","budget"],1],
 [/\bearned value\b/,"project",["percent_complete","budget"],1],
 [/\bplanned value\b/,"project",["start","baseline_finish","budget"],1],
 [/\bcpi\b|\bspi\b/,"project",["spi","cpi"],1],
 [/baseline (date|finish)/,"project",["baseline_finish"],.9],[/forecast (finish|date)/,"project",["finish"],.9],
 [/\bforecast\b/,"forecast_entry",[],.5],
 [/\bmilestones?\b/,"project_task",["milestone","planned_finish","actual_finish"],1],
 [/\bwork lines?\b|\bwbs\b|work breakdown/,"wbs_line",[],.9],
 [/\bpredecessor/,"wbs_line",["pred"],1],[/\bdeliverable/,"wbs_line",["dv"],1],[/\bduration\b/,"wbs_line",["dur"],.6],
 [/\btasks?\b(?! (completed|started))/,"project_task",[],.7],
 [/\b(risks?|raid)\b/,"raid_item",[],.9],[/\bexposure\b/,"raid_item",["exposure"],1],[/\bprobability\b/,"raid_item",["probability"],1],[/\bimpact in dollars|cost impact\b/,"raid_item",["impact"],1],
 [/\bdemand\b|\bintake\b|strategic fit|financial return|risk reduction|urgency/,"demand_request",[],.8],
 [/funded (dollars|amount|work)/,"demand_request",["cost","stage"],.8],
 [/date (decided|submitted)/,"demand_request",["stage","created_by_trigger"],.5],
 [/\b(fte|capacity|utili[sz]ation|available hours|person weeks?|overallocated|over allocated|contract hours)\b/,"person",["hours","load"],.9],
 [/\boverloaded|above 100%/,"person",["load"],1],
 [/\b(people|employees|contractors|responders?|headcount)\b/,"person",[],.8],
 [/\bskill (claims?|levels?|depth)|skills required|qualified people|\bskills?\b(?! runs?)/,"skill_claim",["level","status","expires"],1],[/\bverified|certificate/,"skill_claim",["verified_by","expires"],.8],
 [/on call|oncall|\brotas?\b|\bshifts?\b|\bpaged\b/,"oncall_shift",["rota","starts","ends","person"],.9],
 [/time off|\bpto\b|\bleave\b|holidays?/,"time_off",["from","to","type"],.9],
 [/\breleases?\b|deployments?|\bdeploy/,"release",["actual_date","state"],.9],
 [/readiness|exit criteria|checklist item/,"release",["readiness","exit_criteria_pass"],1],[/release trains?|\bpi\b|increment/,"feature",["program_increment"],.8],
 [/stor(y|ies)\b|story points|\bsprints?\b|velocity|\bdefects?\b/,"user_story",["story_points","state","kind"],.9],
 [/pull requests?/,"pull_request",["status","checks"],1],[/\bfeatures?\b|\bepics?\b|business value/,"feature",["wsjf","state"],.8],
 [/\b(cis?|configuration items?)\b|active cis/,"cmdb_ci",[],1],
 [/\bstale|not seen|last discovered|discovered|discovery/,"cmdb_ci",["last_discovered","discovery_source"],1],
 [/orphan|relationships?|path to any service/,"cmdb_rel_ci",["parent","child","type"],1],
 [/same identity|duplicate (ci|identity)/,"cmdb_ci",["correlation_id"],1],
 [/attributes? filled|required attributes|completeness/,"cmdb_ci",["name","class","environment","owned_by","support_group"],.7],
 [/audit rules?|lifecycle sanity|support group|mission critical/,"cmdb_ci",["owned_by","support_group","business_criticality","lifecycle_stage"],.8],
 [/\bservices?\b(?! (restored|down|degraded|desk))|service tier|tier 1/,"business_service",[],.8],[/\btier\b/,"business_service",["tier"],.9],
 [/\bassets?\b|inventory|intune|warranty|devices?/,"asset",["asset_tag","intune_compliant","lifecycle"],.9],
 [/\bvendors?\b|\bproviders?\b/,"core_company",["name","risk_rating"],.7],
 [/\bcontracts?\b|statement of work|\bsow\b/,"contract",[],.9],[/renewal|notice deadline|auto renew|notice/,"contract",["auto_renew","notice_days","end"],1],
 [/obligations?/,"contract_obligation",["due","status"],1],
 [/clause|standard term|fallback|lines analy[sz]ed|\bterms?\b|playbook (clause|coverage)/,"contract_line",["clause","playbook","status"],.9],
 [/paid beyond|leakage/,"invoice",["paid_to_date","accepted_work"],1],
 [/\binvoices?\b|cleared by rule/,"invoice",[],.9],[/\bamount|paid|accepted work/,"invoice",["amount","accepted_work","paid_to_date"],.6],
 [/purchase orders?|\bpo\b|receipt|three way/,"purchase_order",[],.8],
 [/cost allocation|allocated|consumers?|showback|spend traced|technology cost/,"cost_allocation",["amount","to","driver"],1],
 [/unit cost|cost per unit|planned cost per unit|offerings?/,"service_offering",["unit_cost","unit"],1],
 [/scaling|capacity per step|scaling drivers?/,"scaling_step",["units_in_place","cost_per_step"],.9],
 [/budget lines?|committed/,"budget_line",[],.8],[/cost cent(er|re)/,"cost_center",[],.8],
 [/\balerts?\b|raw events?|\bevents?\b/,"alert_event",[],.9],
 [/acknowledg|took the alert|taken/,"alert_event",["acknowledged_by","state"],1],
 [/alert fired|fired\b|threshold breach|onset/,"alert_event",["first_seen","last_seen"],.9],
 [/false positive|expected behavior/,"false_positive_feedback",["kind","marked_at"],1],
 [/correlation groups?|actionable/,"correlation_group",["alert_count","severity"],1],
 [/dedup|noise|suppress/,"alert_event",["event_count","dedup_key"],.8],
 [/playbook|runbooks?|automation rule|automation/,"automation_rule",["workflow","executor"],.7],[/handled end to end|automation level/,"runbook_execution",["result","dry_run"],.8],
 [/\bslos?\b|error budget/,"slo",["objective","budget_left","window_days"],.9],
 [/synthetic/,"synthetic_check",["type","interval_min"],1],[/\bdashboards?\b/,"dashboard",["name","tile_count"],1],[/\blogs?\b/,"log_pattern",["template","count_24h"],.8],
 [/maintenance/,"maintenance_window",["mode","schedule"],1],[/standard change|\btemplates?\b/,"standard_change",["automation_level","success_rate"],.9],
 [/articles?|knowledge|\bkb\b|\bsops?\b|published items?|procedural items?/,"knowledge_article",[],.8],
 [/notifications?/,"notification",[],.9],[/\bstakeholders?\b/,"customer_or_stakeholder",[],.8],[/(?<!red )\bteams?\b|org(ani[sz]ation)? units?/,"organization_unit",[],.5],
 [/\bcontrols?\b|\bevidence\b/,"control",[],.8],[/\bexceptions?\b/,"exception",[],.8],
 [/\bdebt\b|debt items?/,"debt_item",[],.9],[/integrations?|failed calls/,"integration",[],.7],[/\bconnector/,"connector",[],.8],[/\bmapp(ed|ing|ings)\b/,"mapping",[],.8],[/quarantine|sync/,"sync_run",[],.7],
 [/citizen apps?|app manifest|builds/,"app_manifest",[],.8],[/data assets?|registry|registered entit|entities/,"data_asset",[],.5],[/\bapplications?\b/,"application",[],.7],
 [/\benvironments?\b|promotions?/,"environment",[],.5],[/(strategic )?objective/,"demand_request",["objective"],.5]
];
/* terms that are policy settings or time windows, not data */
const PARAM=/^(daily cap|contingency( reserve)?|board capital envelope|capital envelope|minutes in (the )?period|period|days in (the )?period|weeks in (the )?period|minutes in period|target|threshold|policy sla|rate card rate|loaded rate|seat price|list price|none expected|weeks)\b/;

/* hand overrides for the most prominent metrics: operand text -> field list. "@m_x" nested metric, "#text" policy setting, "?" suffix marks an approximation */
const OVH={
 m_delivery:{f:"0.4 × Schedule adherence + 0.3 × Milestone hit rate + 0.3 × (1 − Risk exposure against contingency)",map:{"schedule adherence":"@m_spi","milestone hit rate":"@m_mshit","risk exposure against contingency":"@m_riskexp"}},
 m_fin:{map:{"forecast overrun %":"@m_budvar","budget lines over commitment":"@m_commit"}},
 m_ops:{map:{"availability score":"@m_svc_avail","incident score":"@m_itsm_sla","knowledge freshness":"@m_kb"}},
 m_burn:{map:{"forecast at completion":"project.actual_cost+project.cpi+project.budget","approved budget":"project.budget"}},
 m_cycle:{map:{"invoice received":"invoice.id?","decision":"invoice.status"}},
 m_auto:{map:{"invoices cleared by rule":"invoice.status+invoice.id","invoices received":"invoice.id"}},
 m_prio:{map:{"strategic fit":"demand_request.objective?","financial return":"demand_request.cost?","risk reduction":"demand_request.capability?","urgency":"demand_request.stage?"}},
 m_vendor:{map:{"time":"task_sla.business_percentage?","quality":"vendor_ticket.state?","expectation":"xla_response.score?"}},
 m_avail:{map:{"minutes of outage":"business_service.availability_30d+alert_event.first_seen+alert_event.last_seen","minutes in period":"#Reporting period"}},
 m_mttr:{map:{"average hours from incident opened to resolved":"incident.opened_at+incident.resolved_at"}},
 m_spi:{map:{"earned value":"project.percent_complete+project.budget","planned value":"project.start+project.baseline_finish+project.budget"}},
 m_budvar:{map:{"forecast":"project.actual_cost+project.cpi+project.budget","approved":"project.budget"}},
 m_commit:{map:{"budget lines":"budget_line"}},
 m_riskexp:{map:{"probability":"raid_item.probability","impact in dollars":"raid_item.impact","contingency reserve":"#Contingency reserve (10% of approved budget)"}},
 m_wbs_cmp:{map:{"work lines with an owner":"wbs_line.own+wbs_line.dur+wbs_line.pred+wbs_line.dv","work lines":"wbs_line.wbs"}},
 m_mshit:{map:{"milestones finished on or before their baseline date":"wbs_line.ms+wbs_line.af+wbs_line.bef","milestones whose baseline date has passed":"wbs_line.ms+wbs_line.bef"}},
 m_ontime:{map:{"milestones met by the baseline date":"wbs_line.ms+wbs_line.af+wbs_line.bef","milestones due to date":"wbs_line.ms+wbs_line.bef"}},
 m_itsm_sla:{map:{"incidents resolved inside their resolution target":"incident.made_sla+incident.sla_due+incident.resolved_at","incidents resolved":"incident.resolved_at+incident.state"}},
 m_svc_avail:{map:{"minutes the service was down or degraded":"business_service.availability_30d+alert_event.first_seen","minutes in the period":"#Reporting period"}},
 m_kb:{map:{"articles reviewed":"knowledge_article","active articles":"knowledge_article"}},
 m_cmdb_disc:{map:{"cis that an automated source saw":"cmdb_ci.last_discovered+cmdb_ci.discovery_source","cis that can be discovered":"cmdb_ci.class"}},
 m_dora_df:{map:{"production deployments":"release.actual_date+release.state+release.type"}},
 m_dora_cfr:{map:{"production deployments that caused a rollback":"release.state+incident.service+change_request.close_code","production deployments":"release.actual_date+release.state"}},
 m_itsm_mttr:{map:{"service restored time major incident declared time":"incident.resolved_at+incident.opened_at+incident.priority"}},
 m_tbm_alloc:{map:{"cost allocated to a named consumer":"cost_allocation.amount+cost_allocation.to","total technology cost":"cost_allocation.amount+invoice.amount"}},
 m_raid:{map:{"probability cost impact for open risks":"raid_item.probability+raid_item.impact+raid_item.status"}},
 m_util:{map:{"assigned fte":"project_task.owner+person.load","available fte":"person.hours+time_off.from+time_off.to"}},
 m_slaatt:{map:{"tickets and requests closed inside their sla target":"task_sla.has_breached+task_sla.end_time+task_sla.planned_end_time","tickets and requests closed":"task_sla.end_time"}},
 m_reg_own:{map:{"entities with a named owner module and steward":"data_asset","all registered entities":"data_asset"}},
 m_reg_dup:{map:{"entities flagged as duplicates with no applied fix":"data_asset"}},
 m_reg_class:{map:{"fields with both a classification label and a declared authority":"data_asset","all fields":"data_asset"}},
 m_reg_reuse:{map:{"entities with a single writer and no duplicate":"data_asset","all entities":"data_asset"}},
 m_debt_open:{map:{"effort to fix hours of every open or in progress debt item":"debt_item"}},
 m_fab_fresh:{map:{"mapped fields whose observed sync lag is within their freshness target":"mapping+sync_run","all approved mapped fields":"mapping"}},
 m_gate_reuse:{map:{"registry entities used by citizen apps":"app_manifest+data_asset","registry entities used new entities requested":"app_manifest+data_asset"}}
};

/* ---------- tokenizer and parser ---------- */
const FNWORD=/^(average|mean|median|sum|count|total|max|maximum|min|minimum|number)( of)?$/i;
function tokenize(f){
 f=String(f||"").replace(/\s+/g," ");
 f=f.replace(/\.\s+(?=[A-Z])/,"|||").split("|||")[0];
 f=f.replace(/,?\s+where\s+.*$/i,"").replace(/,\s*(rounded|capped|each 0 to 100|after).*$/i,"");
 const out=[];let buf="";const flush=()=>{const t=buf.trim();if(t)out.push({t:"P",v:t});buf=""};
 for(let i=0;i<f.length;i++){const c=f[i];
  if("×÷+−*/".indexOf(c)>=0&&!(c==="/"&&/[a-z]/i.test(f[i-1]||"")&&/[a-z]/i.test(f[i+1]||""))){flush();out.push({t:"O",v:c==="*"?"×":c==="/"?"÷":c});continue}
  if(c==="-"&&f[i-1]===" "&&f[i+1]===" "){flush();out.push({t:"O",v:"−"});continue}
  if(c==="Σ"){flush();out.push({t:"S"});continue}
  if(c==="("){const head=buf.trim();const grp=!head||/(^|\s)(of|over|Σ)$/i.test(head)||FNWORD.test(head);
   if(grp){flush();out.push({t:"L"});continue}
   let d=1,j=i+1;while(j<f.length&&d>0){if(f[j]==="(")d++;else if(f[j]===")")d--;j++}i=j-1;continue}
  if(c===")"){flush();out.push({t:"R"});continue}
  buf+=c}
 flush();return out}
function parse(f){
 const tk=tokenize(f);let p=0;const peek=()=>tk[p],nx=()=>tk[p++];
 const mk=(op,kids)=>({t:"op",op,kids,label:null});
 function expr(){let a=term();const kids=[a];let op=null;
  while(peek()&&peek().t==="O"&&(peek().v==="+"||peek().v==="−")){const o=nx().v;const b=term();
   if(o==="+"){if(a.t==="op"&&a.op==="+"&&a.flat){a.kids.push(b)}else{a=mk("+",[a,b]);a.flat=1}}else a=mk("−",[a,b])}
  return a}
 function term(){let a=factor();
  while(peek()&&peek().t==="O"&&(peek().v==="×"||peek().v==="÷")){const o=nx().v;const b=factor();
   if(o==="×"){if(a.t==="op"&&a.op==="×"&&a.flat){a.kids.push(b)}else{a=mk("×",[a,b]);a.flat=1}}else a=mk("÷",[a,b])}
  return a}
 function factor(){const t=nx();if(!t)return{t:"leaf",text:""};
  if(t.t==="L"){const e=expr();if(peek()&&peek().t==="R")nx();return e.t==="op"?Object.assign(e,{grp:1}):e}
  if(t.t==="S"){let arg;if(peek()&&peek().t==="L"){nx();arg=expr();if(peek()&&peek().t==="R")nx()}else arg=factor();return mk("Σ",[arg])}
  if(t.t==="P"){
   if(FNWORD.test(t.v)&&peek()&&peek().t==="L"){nx();const e=expr();if(peek()&&peek().t==="R")nx();const w=t.v.toLowerCase().replace(/ of$/,"");return mk(/avg|average|mean/.test(w)?"avg":w==="median"?"med":/count|number/.test(w)?"n":"Σ",[e])}
   return{t:"leaf",text:t.v}}
  if(t.t==="O"&&t.v==="−"){return mk("−",[{t:"num",v:0},factor()])}
  return{t:"leaf",text:""}}
 const r=expr();return r}

/* clean one operand phrase: strip time windows and trailing qualifiers, pull out an embedded number */
function cleanPhrase(s){
 let v=null,t=String(s||"").trim();
 t=t.replace(/\s*,.*$/,"");
 t=t.replace(/\b(over |in |for |during |across )?(the )?(last|next|past)\s+\d+\s*(days?|weeks?|months?|hours?|quarters?|years?|sprints?)\b.*$/i,"").replace(/\b(this|last) (week|month|quarter)\b.*$/i,"").replace(/\bto date\b/i,"").replace(/\btoday\b/i,"").replace(/\s+/g," ");
 t=t.replace(/\b(per|by) (team|month|person|service|rota|contract|contractor|week|day|project|manager)\b.*$/i,"");
 t=t.replace(/^(all|the)\s+/i,"").trim();
 const m=t.match(/\$\s*(\d+(?:\.\d+)?)\s*([KMB])?/i);if(m){v=parseFloat(m[1])*({K:1e3,M:1e6,B:1e9}[(m[2]||"").toUpperCase()]||1);t=t.replace(m[0],"").replace(/\s+/g," ").trim()}
 return{text:t,v}}
const NUMRE=/^\$?\d[\d,.]*\s*[KMB%]?$/;

/* ---------- the resolver ---------- */
let _ver=1;
const fieldIdx=()=>{if(fieldIdx.c&&fieldIdx.k===_ver+"|"+PLAT.entities().length)return fieldIdx.c;
 const byEnt=new Map(),ids=new Map();
 PLAT.entities().forEach(e=>{byEnt.set(e.id,e);(e.fields||[]).forEach(f=>ids.set(e.id+"."+f.k,{e,f}))});
 PLAT.PLANNED.forEach(p=>byEnt.set(p[0],byEnt.get(p[0])||{id:p[0],label:p[2],fields:[],ghost:true}));
 fieldIdx.k=_ver+"|"+PLAT.entities().length;return fieldIdx.c={byEnt,ids}};
const keyField=e=>{const f=(e.fields||[]).find(x=>KEYRE.test(x.k))||(e.fields||[])[0];return f?f.k:null};
const GEN=new Set(["level","name","type","date","time","number","count","status","id","group","state","new","kind","value","rate"]);
function bestFields(e,words,max){const fs=e.fields||[];if(!fs.length)return[];
 const ew=new Set(stems(e.label+" "+e.id));
 const sc=fs.map(f=>{const fw=new Set(stems(f.label+" "+f.k.replace(/_/g," ")).filter(w=>!GEN.has(w)));let n=0;fw.forEach(w=>{if(words.has(w)&&!ew.has(w))n++});return{f,n:fw.size?n/fw.size:0,raw:n}}).filter(x=>x.raw>0&&x.n>=.5).sort((a,b)=>b.n-a.n);
 return sc.slice(0,max||2).map(x=>x.f.k)}
function sourcesFor(phrase,metricId){
 /* returns [{e,k,conf,via}] */
 const p=normP(phrase),idx=fieldIdx(),out=[];
 const add=(e,k,conf,via)=>{if(!out.some(o=>o.e===e&&o.k===k))out.push({e,k,conf,via})};
 const spec=(sp,via)=>{String(sp).split("+").forEach(s=>{let c=1;if(/\?$/.test(s)){c=.7;s=s.replace(/\?$/,"")}s=s.trim();const [en,fk]=s.split(".");if(!idx.byEnt.has(en))return;
   if(fk)add(en,fk,c,via);else add(en,null,c*.6,via)})};
 const oh=OVH[metricId];
 if(oh&&oh.map){for(const key in oh.map){const kk=normP(key);if(p===kk){const v=oh.map[key];if(v[0]==="@"||v[0]==="#")return{special:v};spec(v,"override");return out}}}
 const uo=A.ovr[metricId+"|"+p];if(uo){const [en,fk]=uo.ref.split(".");add(en,fk,1,"override");return out}
 if(_sfv!==_ver){_sfc.clear();_sfv=_ver}
 const cached=_sfc.get(p);if(cached)return cached;
 const hits=[];
 SYN.forEach(r=>{if(r[0].test(p))hits.push(r)});
 const words=new Set(stems(p));
 const explicit=new Set(hits.filter(h=>h[2].length).map(h=>h[1]));
 hits.forEach(h=>{const en=h[1],e=idx.byEnt.get(en);if(!e)return;
  if(h[2].length){h[2].forEach(k=>{if(e.ghost||(e.fields||[]).some(f=>f.k===k))add(en,e.ghost?null:k,.85*Math.min(1,.55+h[3]/2)*(words.size>9?.8:1),"synonym")})}
  else if(!explicit.has(en)){
   if(e.ghost){add(en,null,.4,"planned")}
   else{const bf=bestFields(e,words,2);if(bf.length)bf.forEach(k=>add(en,k,.7,"synonym"));else{const kf=keyField(e);if(kf)add(en,kf,words.size<=3?.75:.5,"record count")}}}});
 if(!out.length){
  /* generic: field label fully inside the phrase, or entity label */
  for(const [id,x] of idx.ids){const fw=stems(x.f.label);if(fw.length>=2&&fw.every(w=>words.has(w))&&stems(x.e.label.replace(/\(.*\)/,"")).some(w=>words.has(w)))add(x.e.id,x.f.k,.55,"field name")}
  if(!out.length){idx.byEnt.forEach((e,id)=>{if(e.ghost)return;const ew=stems(e.label.replace(/\(.*\)/,""));if(ew.length&&ew.every(w=>words.has(w))){const kf=keyField(e);if(kf)add(id,kf,.5,"table name")}})}}
 /* prune: at most 4, strongest first, and drop a planned entity when real fields exist */
 out.sort((a,b)=>b.conf-a.conf);
 const real=out.filter(o=>o.k!==null||!idx.byEnt.get(o.e).ghost);
 const res=(real.length?real:out).slice(0,4);_sfc.set(p,res);return res}
const _sfc=new Map();let _sfv=-1;

function mkSrc(phrase,s,v){const e=fieldIdx().byEnt.get(s.e);return{t:"src",phrase,ent:s.e,fld:s.k,conf:s.conf,via:s.via,ghost:!!(e&&e.ghost),val:v==null?null:v}}
let _depthGuard=0;
function resolve(leaf,mid,depth,seen){
 const c=cleanPhrase(leaf.text);const text=c.text,p=normP(text);
 if(!text)return{t:"num",v:null,text:""};
 if(NUMRE.test(text.trim())){const n=parseFloat(text.replace(/[$,%KMB]/g,"")); return{t:"num",v:isNaN(n)?null:n,text:text.trim()}}
 /* function prefix */
 let m=text.match(/^(average|mean|median)\s+(?:\w+\s+)?(?:from|between)\s+(.+?)\s+to\s+(.+)$/i);
 if(m){const a=resolve({text:m[3]},mid,depth,seen),b=resolve({text:m[2]},mid,depth,seen);return{t:"op",op:/median/i.test(m[1])?"med":"avg",kids:[a,b],label:"time from "+m[2]+" to "+m[3],delta:1}}
 m=text.match(/^(average|mean|median|count of|number of|sum of|total|maximum|minimum)(?: of)?\s+(?:the\s+)?(.+)$/i);
 if(m&&m[2].length>3){const w=m[1].toLowerCase();const k=resolve({text:m[2]},mid,depth,seen);return{t:"op",op:/average|mean/.test(w)?"avg":w==="median"?"med":/count|number/.test(w)?"n":"Σ",kids:[k],label:m[1]}}
 m=text.match(/^over\s+.+?\s+of\s+(.+)$/i);if(m)return resolve({text:m[1]},mid,depth,seen);
 if(PARAM.test(p)&&!/ rate$/.test(p))return{t:"param",text:trunc(text,60)};
 const sp=sourcesFor(text,mid);
 if(sp&&sp.special){const s=sp.special;if(s[0]==="#")return{t:"param",text:s.slice(1)};
  const id=s.slice(1);return metricNode(id,text,mid,depth,seen)}
 /* metric by name */
 const mm=metricByName(p,mid);if(mm)return metricNode(mm,text,mid,depth,seen);
 if(sp&&sp.length){
  if(sp.length===1)return mkSrc(text,sp[0],c.v);
  return{t:"op",op:"ƒ",kids:sp.map(s=>mkSrc(text,s,null)),label:text,derived:1,val:c.v}}
 return{t:"gap",text,phrase:text,key:p,val:c.v}}
let _mnames=null,_mnk=0;
function metricByName(p,self){const ks=Object.keys(METRICS);if(!_mnames||_mnk!==ks.length){_mnk=ks.length;_mnames=ks.filter(k=>!/^m_atlas/.test(k)).map(k=>({k,s:stems(METRICS[k].n).join(" ")}))}
 const ps=stems(p).join(" ");if(!ps)return null;
 let hit=_mnames.find(x=>x.s===ps&&x.k!==self);if(hit)return hit.k;
 const n=ps.split(" ").length;
 if(n>=3){hit=_mnames.find(x=>x.k!==self&&(x.s.indexOf(ps)===0||ps.indexOf(x.s)===0)&&x.s.split(" ").length>=3);if(hit)return hit.k}
 return null}
function metricNode(id,text,mid,depth,seen){
 if(!METRICS[id]||id===mid)return{t:"gap",text,phrase:text,key:normP(text)};
 const node={t:"metric",id,text};
 if(depth<3&&!seen.has(id)){const s2=new Set(seen);s2.add(id);node.sub=traceTree(id,depth+1,s2)}
 return node}

/* ---------- value evaluation for operator nodes ---------- */
function evalNode(n){
 if(n.t==="num")return n.v;
 if(n.t==="metric"){const m=METRICS[n.id];return m?m.cur:null}
 if(n.t==="src"||n.t==="gap")return n.val==null?null:n.val;
 if(n.t==="param")return null;
 if(n.t!=="op")return null;
 const ks=n.kids.map(evalNode);n.kv=ks;
 if(n.op==="ƒ")return n.val==null?null:n.val;
 if(n.op==="Σ"||n.op==="avg"||n.op==="med"||n.op==="n")return ks.length===1&&ks[0]!=null&&n.op!=="n"&&n.op!=="Σ"?ks[0]:null;
 if(ks.some(x=>x==null))return null;
 let v=ks[0];
 for(let i=1;i<ks.length;i++){const b=ks[i];if(n.op==="+")v+=b;else if(n.op==="−")v-=b;else if(n.op==="×")v*=b;else if(n.op==="÷"){if(!b)return null;v/=b}}
 return v}
/* turn "number × thing" and "thing ÷ number" into a scale on the edge, so weights do not clutter the graph */
function simplify(n){
 if(n.t==="metric"&&n.sub)n.sub=simplify(n.sub);
 if(n.t!=="op")return n;
 n.kids=n.kids.map(simplify);
 if(n.op==="×"){const nums=n.kids.filter(k=>k.t==="num"),rest=n.kids.filter(k=>k.t!=="num");
  if(nums.length&&rest.length===1){const r=rest[0];r.scales=(r.scales||[]).concat(nums.map(x=>["×",x.v]));return r}
  if(nums.length&&rest.length>1){n.kids=rest;n.scales=(n.scales||[]).concat(nums.map(x=>["×",x.v]))}}
 if(n.op==="÷"&&n.kids.length===2&&n.kids[1].t==="num"&&n.kids[0].t!=="num"){const r=n.kids[0];r.scales=(r.scales||[]).concat([["÷",n.kids[1].v]]);return r}
 return n}
function applyScales(v,sc){if(v==null)return null;(sc||[]).forEach(s=>{v=s[0]==="×"?v*s[1]:(s[1]?v/s[1]:null);if(v==null)v=null});return v}

function traceTree(id,depth,seen){
 const m=METRICS[id];const oh=OVH[id];
 let tree;try{tree=parse((oh&&oh.f)||m.f)}catch(e){tree={t:"leaf",text:m.f}}
 const walk=n=>{
  if(n.t==="leaf")return resolve(n,id,depth,seen);
  if(n.t==="op"){n.kids=n.kids.map(walk);return n}
  return n};
 tree=walk(tree);
 /* a bare leaf as the whole formula (no operators) is wrapped so the graph has an operator node */
 return simplify(tree)}

/* ---------- full trace of one metric, statistics, indexes ---------- */
const LIN={cache:new Map(),idx:null,
 ver(){return _ver},
 bump(){_ver++;this.cache.clear();this.idx=null;fieldIdx.c=null},
 trace(id){let t=this.cache.get(id);if(t)return t;const m=METRICS[id];if(!m)return null;
  const tree=traceTree(id,0,new Set([id]));
  const st={src:0,weak:0,ghost:0,gap:0,param:0,nested:0,ops:0,confSum:0,leaves:0};
  const srcs=new Map(),gaps=[],nests=[];
  const visit=(n,top)=>{
   if(n.t==="src"){if(n.ghost){st.ghost++;st.leaves++;st.confSum+=n.conf}else if(n.conf<.6){st.weak++;st.leaves++;st.confSum+=n.conf}else{st.src++;st.leaves++;st.confSum+=n.conf}srcs.set(n.ent+"."+(n.fld||""),n)}
   else if(n.t==="gap"){st.gap++;st.leaves++;gaps.push(n)}
   else if(n.t==="param")st.param++;
   else if(n.t==="metric"){st.nested++;nests.push(n);if(n.sub)visit(n.sub);else{st.src++;st.leaves++;st.confSum+=.9}}
   else if(n.t==="op"){st.ops++;n.kids.forEach(k=>visit(k))}};
  visit(tree,true);
  const got=st.src+st.weak*.6+st.ghost*.4;const pct=st.leaves?Math.round(100*got/st.leaves):0;
  const status=st.leaves&&!st.gap&&!st.ghost&&!st.weak?"full":(st.src+st.weak+st.ghost>0?"partial":"none");
  t={id,m,tree,st,srcs,gaps,nests,pct:status==="full"?100:Math.min(pct,99),status,conf:st.leaves?Math.round(100*st.confSum/Math.max(1,st.src+st.weak+st.ghost)):0};
  /* computed values */
  const v=evalNode(tree);t.val=applyScales(v,tree.scales);
  t.calcOk=t.val!=null&&Math.abs(t.val-m.cur)<=Math.max(.5,Math.abs(m.cur)*.08);
  this.cache.set(id,t);return t},
 ids(){return Object.keys(METRICS).filter(k=>!/^m_atlas/.test(k))},
 all(){return this.ids().map(k=>this.trace(k))},
 index(){if(this.idx)return this.idx;const ent=new Map(),fld=new Map(),par=new Map();
  this.all().forEach(t=>{
   t.srcs.forEach(s=>{(ent.get(s.ent)||ent.set(s.ent,new Set()).get(s.ent)).add(t.id);if(s.fld)(fld.get(s.ent+"."+s.fld)||fld.set(s.ent+"."+s.fld,new Set()).get(s.ent+"."+s.fld)).add(t.id)});
   t.nests.forEach(n=>{(par.get(n.id)||par.set(n.id,new Set()).get(n.id)).add(t.id)})});
  return this.idx={ent,fld,par}},
 feeds(e){const s=this.index().ent.get(e);return s?[...s]:[]},
 fieldUse(e,f){const s=this.index().fld.get(e+"."+f);return s?[...s]:[]},
 parents(mid,acc){acc=acc||new Set();const s=this.index().par.get(mid);if(s)s.forEach(p=>{if(!acc.has(p)){acc.add(p);this.parents(p,acc)}});return acc},
 ghostsUsed(){const out=new Set();if(!window.PLAT)return out;try{this.all().forEach(t=>t.srcs.forEach(s=>{if(s.ghost)out.add(s.ent)}))}catch(e){}return out},
 stats(){const a=this.all(),full=a.filter(t=>t.status==="full").length,part=a.filter(t=>t.status==="partial").length,none=a.filter(t=>t.status==="none").length;
  const gaps=a.reduce((s,t)=>s+t.st.gap,0),leaves=a.reduce((s,t)=>s+t.st.leaves,0);
  const c=a.filter(t=>t.st.src+t.st.weak+t.st.ghost>0);const conf=c.length?Math.round(c.reduce((s,t)=>s+t.conf,0)/c.length):0;
  return{n:a.length,full,part,none,gaps,leaves,conf,pct:a.length?Math.round(100*full/a.length):0}},
 impact(ent,fld){const ms=new Set(fld?this.fieldUse(ent,fld):this.feeds(ent));const all=new Set(ms);ms.forEach(m=>this.parents(m).forEach(p=>all.add(p)));
  const scr=new Map();all.forEach(m=>((METRICS[m]||{}).use||[]).forEach(u=>{const id=scrByName(u);const k=id||u;if(!scr.has(k))scr.set(k,{id,name:id?scrName(id):u,metrics:[]});scr.get(k).metrics.push(m)}));
  return{direct:[...ms],all:[...all],screens:[...scr.values()]}}
};

/* =====================================================================
   THE DIAGRAM: layout, world markup, camera, minimap, inspector
   ===================================================================== */
const BW=280,BH=108,GX=32,GY=30,PADR=30,HDR=112,FROW=26,MAXROWS=14,LEFT=90,TOP=170,LGAP=84;
const ovColor=(e)=>{
 if(A.ov==="domain")return DC[e.domain]||"--faint";
 if(e.ghost&&A.ov!=="metrics")return "--faint";
 if(A.ov==="authority"){const m=e.authMix||{};const k=Object.keys(m).sort((a,b)=>m[b]-m[a])[0];return AUTHC[k]||"--faint"}
 if(A.ov==="class")return CLSC[e.cls]||"--faint";
 if(A.ov==="metrics")return COVC[covIdx(LIN.feeds(e.id).length)];
 if(A.ov==="status")return e.proposed?STC.proposed:(STC[e.status]||"--faint");
 return DC[e.domain]||"--faint"};
const ovLabel=e=>{
 if(A.ov==="authority"){const m=e.authMix||{};const k=Object.keys(m).sort((a,b)=>m[b]-m[a])[0];return k?AUTHN[k]:"No fields yet"}
 if(A.ov==="class")return e.ghost?"Not built yet":"Highest class: "+e.cls;
 if(A.ov==="metrics")return COVN[covIdx(LIN.feeds(e.id).length)];
 if(A.ov==="status")return e.proposed?STN.proposed:(STN[e.status]||e.status);
 return dName(e.domain)};
function bodyH(e){
 if(e.ghost)return 84;
 const n=ordFields(e).length,shown=Math.min(n,MAXROWS);
 let h=10+shown*FROW+(n>shown?34:0)+8;
 if(e.fam)h+=4*24+40;
 return h}
const boxH=e=>BH+(A.exp[e.id]?bodyH(e):0);
function layout(M){
 const regs={},pos={},layers=[];let y=TOP,maxR=0;
 const known=new Set();LAYERS.forEach(l=>l[1].forEach(d=>known.add(d)));
 const extra=[...new Set(M.list.map(e=>e.domain))].filter(d=>!known.has(d));
 const LYS=extra.length?LAYERS.slice(0,-1).concat([["Added by modules",extra]],LAYERS.slice(-1)):LAYERS;
 LYS.forEach((ly,li)=>{
  let x=LEFT,lh=0;const rs=[];
  ly[1].forEach(d=>{
   let items=M.byDom(d).slice().sort((a,b)=>(M.deg[b.id]||0)-(M.deg[a.id]||0));
   if(d==="planned"&&M.more.length)items=items.concat([{id:"__more",label:M.more.length+" more planned entities",more:true,ghost:true,domain:"planned",fields:[],nf:0,out:[],inn:[],authMix:{},cls:"internal",status:"planned",owner:"Registry",steward:"Data council"}]);
   if(!items.length)return;
   const n=items.length,cols=n<=1?1:n<=4?2:n<=9?3:4,colH=new Array(cols).fill(0);
   items.forEach((e,i)=>{const c=i%cols,h=e.more?BH:boxH(e);pos[e.id]={x:x+PADR+c*(BW+GX),y:y+HDR+colH[c],w:BW,h,col:c};colH[c]+=h+GY});
   const h=HDR+Math.max(...colH)-GY+PADR,w=cols*BW+(cols-1)*GX+2*PADR;
   rs.push({d,x,y,w,h,n,cols});x+=w+60;lh=Math.max(lh,h)});
  rs.forEach(r=>{r.h=lh;regs[r.d]=r});
  layers.push({n:ly[0],y,h:lh,li});maxR=Math.max(maxR,x);y+=lh+LGAP});
 return{regs,pos,layers,W:maxR+20,H:y-LGAP+60}}

/* ----- geometry of one reference edge ----- */
function rowY(e,r,lab){
 if(!A.exp[e.id]||e.ghost)return r.y+BH/2;
 const rows=ordFields(e).slice(0,MAXROWS);const i=rows.findIndex(x=>x.f.label===lab);
 if(i<0)return r.y+BH/2;
 return r.y+BH+(e.fam?4*24+40:0)+10+i*FROW+FROW/2}
function edgeGeom(M,L,ed){
 const a=M.ent.get(ed.from),b=M.ent.get(ed.to),pa=L.pos[ed.from],pb=L.pos[ed.to];if(!pa||!pb)return null;
 const ca=pa.x+pa.w/2,cb=pb.x+pb.w/2;let sa,sb;
 if(cb-ca>BW*.6){sa=1;sb=-1}else if(ca-cb>BW*.6){sa=-1;sb=1}else{sa=1;sb=1}
 const x1=sa>0?pa.x+pa.w:pa.x,x2=sb>0?pb.x+pb.w:pb.x;
 const y1=rowY(a,pa,ed.fields[0]),y2=pb.y+BH/2;
 const d=Math.max(46,Math.abs(x2-x1)*.45)*(sa===sb?1.2:1);
 return{d:`M${x1.toFixed(0)} ${y1.toFixed(0)}C${(x1+sa*d).toFixed(0)} ${y1.toFixed(0)},${(x2+sb*d).toFixed(0)} ${y2.toFixed(0)},${x2.toFixed(0)} ${y2.toFixed(0)}`,x1,y1,x2,y2}}

/* ----- which things are lit ----- */
function lit(M){
 const L={ents:new Set(),edges:new Set(),trace:new Set(),active:false,fieldKey:null};
 if(A.trace&&METRICS[A.trace]){const t=LIN.trace(A.trace);t.srcs.forEach(s=>L.trace.add(s.ent));L.active=true;
  M.edges.forEach((ed,i)=>{if(L.trace.has(ed.from)&&L.trace.has(ed.to))L.edges.add(i)});L.trace.forEach(e=>L.ents.add(e))}
 if(A.sel&&M.ent.has(A.sel)){L.active=true;L.ents.add(A.sel);
  M.edges.forEach((ed,i)=>{if(ed.from===A.sel||ed.to===A.sel){L.edges.add(i);L.ents.add(ed.from);L.ents.add(ed.to)}});
  if(A.fld){L.fieldKey=A.fld.e+"|"+A.fld.k;const e=M.ent.get(A.fld.e),f=e&&e.fields.find(x=>x.k===A.fld.k);
   if(f){L.edges=new Set();L.ents=new Set([A.fld.e]);M.edges.forEach((ed,i)=>{if(ed.from===A.fld.e&&ed.fields.includes(f.label)){L.edges.add(i);L.ents.add(ed.to)}});
    if(KEYRE.test(f.k)||!L.edges.size){M.edges.forEach((ed,i)=>{if(ed.to===A.fld.e){L.edges.add(i);L.ents.add(ed.from)}})}}}}
 if(A.q){const q=A.q.toLowerCase();M.list.forEach(e=>{if(e.label.toLowerCase().includes(q)||e.id.includes(q)||(e.fields||[]).some(f=>f.label.toLowerCase().includes(q)||f.k.includes(q))){L.ents.add(e.id);L.active=true}})}
 if(A.dom&&!A.sel&&!A.trace&&!A.q){}
 return L}

/* ----- the world ----- */
function lockSvg(){return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`}
function mixBar(e){const m=e.authMix||{},t=Object.values(m).reduce((a,b)=>a+b,0);if(!t)return"";
 return `<span class="at-mix" title="Authority mix: ${Object.keys(m).map(k=>m[k]+" "+k).join(", ")}">${["platform","external","shared"].filter(k=>m[k]).map(k=>`<i style="width:${Math.max(6,Math.round(100*m[k]/t))}%;background:var(${AUTHC[k]})"></i>`).join("")}</span>`}
function entHTML(M,L,Lt,e){
 const p=L.pos[e.id];if(!p)return"";
 if(e.more)return `<div class="at-ent at-more ghost" style="left:${p.x}px;top:${p.y}px;width:${BW}px;height:${BH}px;--c:var(--faint)"><button class="at-eh" data-at-more="1" aria-label="${E(e.label)}. Open the list."><span class="at-en">${E(e.label)}</span><span class="at-eo">Named in the registry, not yet a table</span><span class="at-er">Select to see each one, its steward and why it is needed</span><span class="at-eb"><span class="at-bd">${M.more.length} planned</span></span></button></div>`;
 const sel=A.sel===e.id,exp=!!A.exp[e.id],feeds=LIN.feeds(e.id).length,c=ovColor(e);
 const cls=["at-ent",sel?"sel":"",exp?"exp":"",e.ghost?"ghost":"",e.proposed?"prop":"",Lt.active&&!Lt.ents.has(e.id)?"dim":"",Lt.active&&Lt.ents.has(e.id)&&!sel?"rel":"",Lt.trace.has(e.id)?"tr":""].filter(Boolean).join(" ");
 const refs=[...new Set(e.out.map(id=>M.ent.get(id)).filter(Boolean).map(x=>x.label.replace(/\s*\(.*$/,"")))];
 const rt=refs.length?"→ "+refs.slice(0,2).join(", ")+(refs.length>2?" +"+(refs.length-2):""):(e.inn.length?"Referenced by "+e.inn.length:"No references yet");
 const sub=e.fam?`${e.fam.length} classes${window.SCALE&&SCALE.on?" · "+N0(SCALE.n.cis)+" records":""}`:e.ghost?"Planned, not built":e.owner;
 const nm=e.fam?e.label+" ("+e.fam.length+" classes)":e.label;
 let h=`<div class="${cls}" style="left:${p.x}px;top:${p.y}px;width:${BW}px;height:${p.h}px;--c:var(${c})" data-dom="${e.domain}">`;
 h+=`<button class="at-eh" data-at-ent="${e.id}" aria-pressed="${sel}" aria-label="${E(nm)}, ${e.ghost?"planned entity":e.proposed?"proposed entity, "+e.nf+" fields":e.nf+" fields"}, feeds ${feeds} metrics. ${E(ovLabel(e))}"><span class="at-en">${E(nm)}</span><span class="at-ef">${e.ghost?"planned":e.nf+" fields"}</span><span class="at-eo">${E(sub)}</span><span class="at-er">${E(rt)}</span><span class="at-eb">${e.proposed?'<span class="at-bd prop" title="Defined by the coverage audit and waiting for approval">Proposed</span>':""}<span class="at-bd" title="Metrics whose formula reads this entity">feeds ${feeds} metric${feeds===1?"":"s"}</span>${mixBar(e)}${CLSRANK(e.cls)>=2&&!e.ghost?`<span class="at-lk" title="Highest classification: ${e.cls}">${lockSvg()}</span>`:""}</span></button>`;
 if(!e.ghost)h+=`<button class="at-xp" data-at-xp="${e.id}" aria-expanded="${exp}" aria-label="${exp?"Hide":"Show"} fields of ${E(e.label)}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>`;
 if(exp){
  if(e.ghost)h+=`<div class="at-fl at-gh"><p>${E(e.why||"")}</p><small>Steward: ${E(e.steward)}</small></div>`;
  else{
   h+=`<div class="at-fl">`;
   if(e.fam){const cl=e.fam.filter(k=>k!==e.id).slice(0,8);h+=`<div class="at-cls"><b>${e.fam.length} classes</b><span>${cl.map(k=>`<i>${E((DATAMODEL.tables[k]&&DATAMODEL.tables[k].label||k).replace(/^Configuration item\s*[-:(]?\s*/i,"").replace(/\)$/,""))}</i>`).join("")}</span><button class="at-lnk" data-at-itab="classes" data-at-ent="${e.id}">All ${e.fam.length} classes</button></div>`}
   const rows=ordFields(e),shown=rows.slice(0,MAXROWS);
   shown.forEach(x=>{const f=x.f,m=x.m,t=tyg(f.type),isRef=f.type==="ref"||f.type==="person";
    const tg=isRef?M.edges.find(ed=>ed.from===e.id&&ed.fields.includes(f.label)):null;
    const on=A.fld&&A.fld.e===e.id&&A.fld.k===f.k,hit=Lt.fieldKey&&!on&&Lt.fieldKey.split("|")[1]===f.k;
    h+=`<button class="at-fr${isRef?" ref":""}${on?" on":""}${hit?" hit":""}" data-at-fld="${e.id}|${f.k}" title="${E(f.label+" ("+t[1]+"). "+AUTHN[m.auth]+". "+m.cls+".")}"><i class="at-ty">${t[0]}</i><span class="at-fn">${E(f.label)}</span>${tg?`<span class="at-ft">→ ${E(trunc(M.ent.get(tg.to).label.replace(/\s*\(.*$/,""),16))}</span>`:""}<i class="at-ad" style="background:var(${AUTHC[m.auth]})"></i>${CLSRANK(m.cls)>=2?`<span class="at-cl">${lockSvg()}</span>`:`<span class="at-cl"></span>`}</button>`});
   if(rows.length>shown.length)h+=`<button class="at-lnk at-moref" data-at-itab="fields" data-at-ent="${e.id}">+ ${rows.length-shown.length} more fields, open the field table</button>`;
   h+=`</div>`}}
 return h+`</div>`}
const CLSRANK=c=>PLAT.CLS_ORDER.indexOf(c);

function worldHTML(M,L){
 const Lt=lit(M);let h="";
 L.layers.forEach(ly=>{h+=`<div class="at-layer" style="top:${ly.y}px;height:${ly.h}px"><span>${E(ly.n)}</span></div>`});
 Object.keys(L.regs).forEach(d=>{const r=L.regs[d],es=M.byDom(d).filter(e=>!e.more);
  const nf=es.reduce((a,e)=>a+(e.nf||0),0),fed=new Set();es.forEach(e=>LIN.feeds(e.id).forEach(m=>fed.add(m)));
  const dim=A.dom&&A.dom!==d&&!A.sel?" dim":"";
  h+=`<section class="at-reg${A.dom===d?" cur":""}${dim}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;--c:var(${DC[d]})" aria-label="${E(dName(d))}"><header class="at-rh"><button class="at-rt" data-at-dom-go="${d}">${E(dName(d))}</button><span class="at-rs">${d==="planned"?M.byDom(d).length+" shown of "+(M.byDom(d).length+M.more.length)+" planned":es.length+" tables · "+N0(nf)+" fields"}</span><span class="at-rm">${d==="planned"?"Not built yet":fed.size+" metrics read it"}</span></header></section>`});
 /* edges */
 const mode=A.refs;let eg="",fe="";
 M.edges.forEach((ed,i)=>{
  const hot=Lt.edges.has(i);
  if(!hot){if(mode==="off"||mode==="sel")return;if(mode==="cross"&&!ed.cross)return}
  const g=edgeGeom(M,L,ed);if(!g)return;
  const c=["at-e",ed.cross?"x":"",ed.ghost?"g":"",M.hub.has(ed.to)?"hub":"",hot?"hot":(Lt.active?"off":"")].filter(Boolean).join(" ");
  eg+=`<path class="${c}" d="${g.d}" marker-end="url(#${hot?"at-arh":"at-ar"})"><title>${E(M.ent.get(ed.from).label+" points to "+M.ent.get(ed.to).label+" through "+ed.fields.join(", "))}</title></path>`});
 Object.keys(M.pair).forEach(k=>{const [a,b]=k.split("|");if(a>=b&&M.pair[b+"|"+a])return;if(a===b)return;
  const ra=L.regs[a],rb=L.regs[b];if(!ra||!rb)return;const n=(M.pair[k]||[]).length+((M.pair[b+"|"+a]||[]).length);
  const ax=ra.x+ra.w/2,ay=ra.y+ra.h/2,bx=rb.x+rb.w/2,by=rb.y+rb.h/2,mx=(ax+bx)/2+(ay-by)*.12,my=(ay+by)/2+(bx-ax)*.12;
  fe+=`<g class="at-fe"><path d="M${ax.toFixed(0)} ${ay.toFixed(0)}Q${mx.toFixed(0)} ${my.toFixed(0)} ${bx.toFixed(0)} ${by.toFixed(0)}" style="stroke-width:${Math.min(16,2+n*1.1)}px"/><text x="${mx.toFixed(0)}" y="${(my+10).toFixed(0)}" text-anchor="middle">${n}</text></g>`});
 /* trace token and flows */
 let tok="",flows="";
 if(A.trace&&METRICS[A.trace]){const m=METRICS[A.trace],t=LIN.trace(A.trace),ids=[...Lt.trace].filter(id=>L.pos[id]);
  const cx=L.W/2,cy=60;
  tok=`<div class="at-token" style="left:${cx-190}px;top:${cy-44}px"><span class="eyebrow">Metric being traced</span><b>${E(m.n)}</b><span class="at-tv num">${E(mfmt(m))}</span><small>reads ${ids.length} entit${ids.length===1?"y":"ies"}, ${t.st.src+t.st.weak+t.st.ghost} fields</small></div>`;
  ids.forEach(id=>{const p=L.pos[id];const x1=p.x+p.w/2,y1=p.y;flows+=`<path class="at-e hot fl" d="M${x1} ${y1}C${x1} ${y1-100},${cx} ${cy+120},${cx} ${cy+44}" marker-end="url(#at-arh)"/>`})}
 h+=`<svg class="at-svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}" aria-hidden="true" focusable="false"><defs><marker id="at-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L10 5L0 9z" class="at-ar"/></marker><marker id="at-arh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L10 5L0 9z" class="at-arh"/></marker></defs><g class="at-ge">${eg}</g><g class="at-gf">${fe}</g><g class="at-gt">${flows}</g></svg>`;
 M.list.forEach(e=>{h+=entHTML(M,L,Lt,e)});
 if(M.more.length)h+=entHTML(M,L,Lt,{id:"__more",more:true});
 return h+tok}

/* ----- minimap ----- */
function miniHTML(M,L){
 const w=210,sc=w/L.W,hh=Math.max(40,L.H*sc);
 let s=`<svg viewBox="0 0 ${L.W} ${L.H}" width="${w}" height="${hh.toFixed(0)}" data-at-mmsvg="1" aria-label="Minimap. Select a spot to move the view."><rect width="${L.W}" height="${L.H}" class="at-mmbg"/>`;
 Object.keys(L.regs).forEach(d=>{const r=L.regs[d];s+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="40" style="fill:var(${DC[d]});opacity:.22"/>`});
 M.list.forEach(e=>{const p=L.pos[e.id];if(p)s+=`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="14" style="fill:var(${ovColor(e)})${A.sel===e.id?";stroke:var(--ink);stroke-width:14":""}"/>`});
 s+=`<rect class="at-mv" data-at-mv="1" x="0" y="0" width="100" height="100"/></svg>`;return s}

/* ----- legend ----- */
function legendItems(M){
 if(A.ov==="domain")return Object.keys(DC).filter(d=>M.byDom(d).length).map(d=>[dName(d),DC[d]]);
 if(A.ov==="authority")return [["Oukala owns most fields",AUTHC.platform],["External system owns most fields",AUTHC.external],["Shared, newest wins",AUTHC.shared],["Planned, no fields yet","--faint"]];
 if(A.ov==="class")return [["Public",CLSC.public],["Internal",CLSC.internal],["Confidential",CLSC.confidential],["Restricted",CLSC.restricted],["Personal",CLSC.personal]];
 if(A.ov==="metrics")return COVN.map((n,i)=>[n,COVC[i]]);
 return [["Canonical, one copy",STC.canonical],["Duplicate, fix open",STC.duplicate],["Duplicate fixed in preview",STC.fixed],["Proposed, waiting for approval",STC.proposed],["Planned, not built",STC.planned]]}
function legendHTML(M){return legend(legendItems(M))+`<span class="at-lgx"><i class="at-ad" style="background:var(${AUTHC.platform})"></i><i class="at-ad" style="background:var(${AUTHC.external})"></i><i class="at-ad" style="background:var(${AUTHC.shared})"></i> dot on a field: authority (Oukala, external, shared)</span><span class="at-lgx"><i class="at-propkey" aria-hidden="true"></i> dashed outline and Proposed pill: waiting for approval</span><span class="at-lgx">${lockSvg()} confidential or more</span><span class="at-lgx"><svg width="26" height="8" aria-hidden="true"><path d="M0 4h26" class="at-lgline"/></svg> reference</span>`}

/* ----- breadcrumb ----- */
function bcHTML(M){
 const parts=[`<button class="at-bcb" data-at-bc="all">All domains</button>`];
 const dom=A.sel&&M.ent.get(A.sel)?M.ent.get(A.sel).domain:A.dom;
 if(dom)parts.push(`<button class="at-bcb" data-at-bc="dom">${E(dName(dom))}</button>`);
 if(A.sel&&M.ent.get(A.sel))parts.push(`<button class="at-bcb" data-at-bc="ent">${E(M.ent.get(A.sel).label.replace(/\s*\(.*$/,""))}</button>`);
 if(A.fld){const e=M.ent.get(A.fld.e),f=e&&e.fields.find(x=>x.k===A.fld.k);if(f)parts.push(`<span class="at-bcb cur">${E(f.label)}</span>`)}
 const back=(A.sel||A.dom||A.fld||A.trace)?`<button class="btn quiet at-back" data-at-bc="back" aria-label="Back one level">${IC("M15 6l-6 6 6 6")} Back</button>`:"";
 return back+`<nav class="at-bcn" aria-label="Where you are">${parts.join('<span class="at-sep" aria-hidden="true">›</span>')}</nav>`}

/* ----- focus card (field or trace) over the canvas ----- */
function cardHTML(M){
 if(A.fld&&M.ent.get(A.fld.e)){const e=M.ent.get(A.fld.e),f=e.fields.find(x=>x.k===A.fld.k);if(!f)return"";
  const m=PLAT.fieldMeta(e.id,f),ms=LIN.fieldUse(e.id,f.k),tg=M.edges.filter(ed=>ed.from===e.id&&ed.fields.includes(f.label)).map(ed=>M.ent.get(ed.to));
  const inc=(KEYRE.test(f.k)?M.edges.filter(ed=>ed.to===e.id).map(ed=>M.ent.get(ed.from)):[]);
  return `<div class="at-fcard"><div class="row sp"><b>${E(e.label.replace(/\s*\(.*$/,""))}: ${E(f.label)}</b><button class="btn quiet" data-at-bc="ent" aria-label="Close field highlight">Close</button></div><p class="small muted">${E(tyg(f.type)[1])} · ${E(AUTHN[m.auth])} · ${E(m.cls)}</p>
   ${tg.length?`<p class="small">Points to ${tg.map(t=>`<button class="at-lnk" data-at-fly="${t.id}">${E(t.label.replace(/\s*\(.*$/,""))}</button>`).join(", ")}</p>`:""}
   ${inc.length?`<p class="small">Referenced by ${inc.slice(0,6).map(t=>`<button class="at-lnk" data-at-fly="${t.id}">${E(t.label.replace(/\s*\(.*$/,""))}</button>`).join(", ")}${inc.length>6?" and "+(inc.length-6)+" more":""}</p>`:""}
   <p class="small">${ms.length?`Used by ${ms.length} metric${ms.length===1?"":"s"}: ${ms.slice(0,4).map(id=>`<button class="at-lnk" data-at-lin="${id}">${E(trunc(METRICS[id].n,28))}</button>`).join(", ")}${ms.length>4?" and "+(ms.length-4)+" more":""}`:"No metric formula reads this field yet."}</p></div>`}
 if(A.trace&&METRICS[A.trace]){const m=METRICS[A.trace],t=LIN.trace(A.trace),es=[...new Set([...t.srcs.values()].map(s=>s.ent))];
  return `<div class="at-fcard"><div class="row sp"><b>Tracing: ${E(m.n)}</b><button class="btn quiet" data-at-clear-trace="1">Clear</button></div><p class="small muted" data-role="metric">${E(mfmt(m))} · ${t.pct}% traced to fields</p><div class="at-chips">${es.slice(0,8).map(id=>{const e=M.ent.get(id);return e?`<button class="chip at-chip" data-at-fly="${id}">${E(trunc(e.label.replace(/\s*\(.*$/,""),22))}</button>`:""}).join("")}</div><div class="row"><button class="btn" data-at-lin="${A.trace}">Open the calculation</button></div></div>`}
 return ""}

/* ----- inspector ----- */
const ITABS=[["fields","Fields"],["conn","Connections"],["used","Used by"],["metrics","Metrics"],["lineage","Lineage"]];
function pillA(a){const c={platform:"good",external:"info",shared:"warn"}[a]||"mute";return `<span class="pill ${c}">${E(a==="platform"?"Oukala":a==="external"?"External":"Shared")}</span>`}
const CLSP={public:"mute",internal:"mute",confidential:"warn",restricted:"bad",personal:"bad"};
function inspHTML(M){
 if(!A.sel||!M.ent.get(A.sel)){
  if(A.dom&&A.dom!=="planned"||A.dom==="planned")return A.dom?domInsp(M,A.dom):"";
  return""}
 const e=M.ent.get(A.sel);
 const tabs=ITABS.concat(e.fam?[["classes","Classes"]]:[]);
 if(!tabs.some(t=>t[0]===A.itab))A.itab="fields";
 let h=`<div class="at-ih"><div><div class="eyebrow">${E(dName(e.domain))}${e.ghost?" · planned":""}</div><h3>${E(e.label)}</h3><p class="muted small"><code>${E(e.id)}</code> · owner ${E(e.owner)} · steward ${E(e.steward)}</p>${e.ghost?"":`<p class="small"><button class="at-lnk" data-cov-mods="${E(e.id)}">Which modules use this entity</button></p>`}</div><button class="btn quiet at-x" data-at-close="1" aria-label="Close the inspector">Close</button></div>${e.proposed?`<div class="story at-propbox"><span class="pill info">Proposed</span> ${E(e.note||"Defined by the coverage audit.")} No data moves until it is approved.<div class="row" style="margin-top:8px"><button class="btn primary" data-cov-approve="${E(e.id)}">Approve and make live</button></div></div>`:""}`;
 h+=`<div class="at-tabs" role="tablist" aria-label="Entity details">${tabs.map(t=>`<button role="tab" class="at-tab" aria-selected="${A.itab===t[0]}" data-at-itab="${t[0]}">${t[1]}</button>`).join("")}</div><div class="at-ib">`;
 h+=({fields:tabFields,conn:tabConn,used:tabUsed,metrics:tabMetrics,lineage:tabLineage,classes:tabClasses}[A.itab]||tabFields)(M,e);
 return h+`</div>`}
function domInsp(M,d){
 const es=M.byDom(d).filter(e=>!e.more),fed=new Set();es.forEach(e=>LIN.feeds(e.id).forEach(m=>fed.add(m)));
 const outx={},inx={};M.edges.forEach(ed=>{const a=M.ent.get(ed.from),b=M.ent.get(ed.to);if(a.domain===d&&b.domain!==d)outx[b.domain]=(outx[b.domain]||0)+1;if(b.domain===d&&a.domain!==d)inx[a.domain]=(inx[a.domain]||0)+1});
 const st=d==="planned"?"Data council":(PLAT.DOM[d]||{}).steward;
 return `<div class="at-ih"><div><div class="eyebrow">Domain</div><h3>${E(dName(d))}</h3><p class="muted small">Steward: ${E(st||"")}</p></div><button class="btn quiet at-x" data-at-close="1" aria-label="Close the inspector">Close</button></div>
 <div class="at-ib"><div class="statrow at-ss"><div class="stat"><small>Tables</small><span class="num" data-role="metric">${es.length}</span></div><div class="stat"><small>Fields</small><span class="num" data-role="metric">${N0(es.reduce((a,e)=>a+e.nf,0))}</span></div><div class="stat"><small>Metrics</small><span class="num" data-role="metric">${fed.size}</span></div></div>
 <h4 class="at-h4">Entities</h4><div class="at-chips">${es.map(e=>`<button class="chip at-chip" data-at-fly="${e.id}"><i class="at-dot" style="background:var(${DC[d]})"></i>${E(trunc(e.label.replace(/\s*\(.*$/,""),26))}</button>`).join("")}</div>
 <div class="row" style="margin-top:10px"><button class="btn" data-at-expdom="${d}">Show fields of every table here</button></div>
 <h4 class="at-h4">References to other domains</h4>${Object.keys(outx).length||Object.keys(inx).length?`<ul class="at-ul">${Object.keys(outx).map(k=>`<li><button class="at-lnk" data-at-dom-go="${k}">${E(dName(k))}</button><span class="muted small">${outx[k]} out</span></li>`).join("")}${Object.keys(inx).map(k=>`<li><button class="at-lnk" data-at-dom-go="${k}">${E(dName(k))}</button><span class="muted small">${inx[k]} in</span></li>`).join("")}</ul>`:`<p class="muted small">No references to other domains.</p>`}</div>`}

function tabFields(M,e){
 if(e.ghost)return `<p>${E(e.why||"")}</p><p class="muted small">First users: ${E(e.use||"")}. This entity is planned in the registry. It has no fields yet.</p><button class="btn" data-go-reg="1">Open the registry</button>`;
 let h="";
 if(A.fld&&A.fld.e===e.id){const f=e.fields.find(x=>x.k===A.fld.k);if(f){const m=PLAT.fieldMeta(e.id,f),ms=LIN.fieldUse(e.id,f.k),tg=M.edges.filter(ed=>ed.from===e.id&&ed.fields.includes(f.label)).map(ed=>M.ent.get(ed.to)),imp=LIN.impact(e.id,f.k);
  h+=`<div class="at-fd"><div class="row sp"><b>${E(f.label)}</b><span class="pill mute">${E(tyg(f.type)[1])}</span></div><dl class="kv small"><dt>Authority</dt><dd>${pillA(m.auth)} ${E(m.why)}</dd><dt>If two sources differ</dt><dd>${E(m.conflict)}</dd><dt>Freshness</dt><dd>${E(m.fresh)} · trust ${Math.round(m.trust*100)}%</dd><dt>Class</dt><dd><span class="pill ${CLSP[m.cls]}">${E(m.cls)}</span></dd><dt>Quality rule</dt><dd>${E(m.rule)}</dd>${tg.length?`<dt>Points to</dt><dd>${tg.map(t=>`<button class="at-lnk" data-at-fly="${t.id}">${E(t.label.replace(/\s*\(.*$/,""))}</button>`).join(", ")}</dd>`:""}<dt>Metrics using it</dt><dd>${ms.length?ms.slice(0,6).map(id=>`<button class="at-lnk" data-at-lin="${id}">${E(trunc(METRICS[id].n,30))}</button>`).join(", ")+(ms.length>6?" and "+(ms.length-6)+" more":""):"None yet"}</dd><dt>If it changes</dt><dd>${imp.all.length} metric${imp.all.length===1?"":"s"} and ${imp.screens.length} screen${imp.screens.length===1?"":"s"} would be affected</dd></dl></div>`}}
 const rows=ordFields(e);
 h+=`<div class="tscroll"><table class="at-tb"><thead><tr><th>Field</th><th>Authority</th><th>Class</th><th>Used by</th></tr></thead><tbody>${rows.map(x=>{const f=x.f,m=x.m,n=LIN.fieldUse(e.id,f.k).length,on=A.fld&&A.fld.e===e.id&&A.fld.k===f.k;
  return `<tr data-at-fld="${e.id}|${f.k}" class="${on?"on":""}" tabindex="0"><td><b>${E(f.label)}</b><div class="muted small">${E(f.k)} · ${E(tyg(f.type)[1])}</div></td><td>${pillA(m.auth)}</td><td><span class="pill ${CLSP[m.cls]}">${E(m.cls)}</span></td><td>${n?`<span class="pill metric">${n} metric${n===1?"":"s"}</span>`:'<span class="muted small">none</span>'}</td></tr>`}).join("")}</tbody></table></div>`;
 return h}
function chipEnt(M,id,sub){const t=M.ent.get(id);if(!t)return"";return `<button class="chip at-chip" data-at-fly="${id}"><i class="at-dot" style="background:var(${DC[t.domain]})"></i><span>${E(trunc(t.label.replace(/\s*\(.*$/,""),28))}</span>${sub?`<small>via ${E(trunc(sub,26))}</small>`:""}${t.ghost?'<small class="pill mute">planned</small>':""}</button>`}
function tabConn(M,e){
 const up={},down={};M.edges.forEach(ed=>{if(ed.from===e.id)(up[ed.to]=up[ed.to]||[]).push(...ed.fields);if(ed.to===e.id)(down[ed.from]=down[ed.from]||[]).push(...ed.fields)});
 const ul=Object.keys(up),dl=Object.keys(down);
 return `<p class="muted small">Select a chip to fly the camera to that entity.</p><h4 class="at-h4">Points to (upstream, ${ul.length})</h4>${ul.length?`<div class="at-chips">${ul.map(id=>chipEnt(M,id,[...new Set(up[id])].join(", "))).join("")}</div>`:`<p class="muted small">Does not reference another entity.</p>`}
 <h4 class="at-h4">Pointed to by (downstream, ${dl.length})</h4>${dl.length?`<div class="at-chips">${dl.map(id=>chipEnt(M,id,[...new Set(down[id])].join(", "))).join("")}</div>`:`<p class="muted small">No entity references this one yet.</p>`}
 ${(()=>{const x=ul.concat(dl).filter(id=>M.ent.get(id)&&M.ent.get(id).domain!==e.domain);return x.length?`<p class="small muted">${x.length} of these live in other domains, so changing this entity ripples across domains.</p>`:""})()}`}
function tabUsed(M,e){
 const apps=new Map();(e.readers||[]).forEach(a=>{(apps.get(a)||apps.set(a,{r:0,w:0}).get(a)).r=1});(e.writers||[]).forEach(a=>{(apps.get(a)||apps.set(a,{r:0,w:0}).get(a)).w=1});
 let bl=null;try{bl=e.ghost?null:LINKS.blast(e.id)}catch(x){}
 const procs=bl?bl.processes:[];
 return `${bl?`<div class="statrow at-ss"><div class="stat"><small>Entities affected</small><span class="num" data-role="metric">${bl.counts.entities}</span></div><div class="stat"><small>Apps</small><span class="num" data-role="metric">${bl.counts.apps}</span></div><div class="stat"><small>Processes</small><span class="num" data-role="metric">${bl.counts.processes}</span></div></div><p class="small muted">If this entity changes shape, this is how far it reaches (two hops of references).</p>`:""}
 <h4 class="at-h4">Apps (${apps.size})</h4>${apps.size?`<ul class="at-ul">${[...apps].map(([id,v])=>{const ap=PLAT.app(id),mm=!ap&&window.MODMAP&&MODMAP.modules.find(x=>x.id===id);return `<li><span><b>${E(ap?ap.n:mm?mm.name:id)}</b> <span class="muted small">${E(ap?ap.mod:mm?mm.own:"")}</span></span><span class="at-lr">${v.w?'<span class="pill good">Writes</span>':""}${v.r?'<span class="pill info">Reads</span>':""}${hasScr(id)?`<button class="btn quiet" data-at-go="${id}">Open</button>`:""}</span></li>`}).join("")}</ul>`:`<p class="muted small">No app reads or writes it yet.</p>`}
 <h4 class="at-h4">Processes (${procs.length})</h4>${procs.length?`<ul class="at-ul">${procs.slice(0,14).map(id=>{const d=PROC.defs[id];return `<li><span>${E(d?d.title:id)}</span>${hasScr(id)?`<button class="btn quiet" data-at-go="${id}">Open</button>`:""}</li>`}).join("")}</ul>${procs.length>14?`<p class="muted small">and ${procs.length-14} more.</p>`:""}`:`<p class="muted small">No defined process touches it.</p>`}`}
function miniGauge(m){const st=mstat(m),sc=v=>Math.max(0,Math.min(100,v/m.max*100));
 const bands=m.dir==="max"?[[0,m.badAt,"--bad-f"],[m.badAt,m.tgt,"--warn-f"],[m.tgt,m.max,"--good-f"]]:[[0,m.tgt,"--good-f"],[m.tgt,m.badAt,"--warn-f"],[m.badAt,m.max,"--bad-f"]];
 return `<div class="bandbar at-gauge" role="img" aria-label="${E(m.n)}: ${E(mfmt(m))}, ${st==="good"?"on target":st==="warn"?"watch":"off target"}">${bands.map(b=>`<span style="width:${Math.max(0,sc(b[1])-sc(b[0]))}%;background:var(${b[2]});opacity:.85"></span>`).join("")}<u style="left:${sc(m.cur)}%"></u></div>`}
function metricCard(id,e){const m=METRICS[id],t=LIN.trace(id),st=mstat(m);
 const fl=e?[...t.srcs.values()].filter(s=>s.ent===e.id&&s.fld).map(s=>{const f=e.fields.find(x=>x.k===s.fld);return f?f.label:s.fld}):[];
 return `<button class="at-mc" data-at-lin="${id}"><span class="at-mc1"><b>${E(trunc(m.n,40))}</b><span class="pill ${stCls(st)}">${st==="good"?"On target":st==="warn"?"Watch":"Off target"}</span></span><span class="at-mc2"><span class="num" data-role="metric">${E(mfmt(m))}</span><span class="muted small">target ${m.dir==="max"?"≥":"≤"} ${E(mfmt(m,m.tgt))}</span></span>${miniGauge(m)}<span class="at-mc3 small muted">${fl.length?"Reads: "+E(trunc(fl.slice(0,3).join(", "),44)):"Reads this entity"} · ${t.pct}% traced</span></button>`}
function tabMetrics(M,e){
 const ms=LIN.feeds(e.id);if(!ms.length)return `<p class="muted">No metric formula reads this entity yet. If one should, open its lineage and use Map this.</p>`;
 ms.sort((a,b)=>({bad:0,warn:1,good:2}[mstat(METRICS[a])]-{bad:0,warn:1,good:2}[mstat(METRICS[b])]));
 return `<p class="muted small">${ms.length} metric${ms.length===1?"":"s"} read this entity. Select one to see how it is calculated.</p><div class="at-mcs">${ms.slice(0,24).map(id=>metricCard(id,e)).join("")}</div>${ms.length>24?`<p class="muted small">and ${ms.length-24} more.</p>`:""}`}
function tabLineage(M,e){
 if(e.ghost)return `<p class="muted">Planned entity. Lineage starts when it is built. Planned steward: ${E(e.steward)}.</p>`;
 const metas=ordFields(e).map(x=>x.m),by={};metas.forEach(m=>{(by[m.auth]=by[m.auth]||new Set()).add(m.why)});
 const imp=LIN.impact(e.id),dn=[...new Set(e.inn)];
 return `<div class="at-flow"><div class="at-fc"><h4 class="at-h4">Comes from</h4>${Object.keys(by).map(a=>`<div class="at-fcell">${pillA(a)}<span class="small">${E([...by[a]].slice(0,2).join(". "))}</span></div>`).join("")}<p class="small muted">${E(e.owner)} owns the writes.</p></div>
 <div class="at-fa" aria-hidden="true">→</div><div class="at-fc at-self"><h4 class="at-h4">${E(trunc(e.label.replace(/\s*\(.*$/,""),24))}</h4><span class="small">${e.nf} fields</span><span class="small">${e.ret?E(e.ret):""}</span></div><div class="at-fa" aria-hidden="true">→</div>
 <div class="at-fc"><h4 class="at-h4">Flows into</h4><div class="at-fcell"><b>${dn.length}</b><span class="small">entities point to it</span></div><div class="at-fcell"><b>${(e.readers||[]).length}</b><span class="small">apps read it</span></div><div class="at-fcell"><b>${imp.direct.length}</b><span class="small">metrics read it</span></div><div class="at-fcell"><b>${imp.screens.length}</b><span class="small">screens show those metrics</span></div></div></div>
 <h4 class="at-h4">Screens that would show a change</h4>${imp.screens.length?`<div class="at-chips">${imp.screens.slice(0,14).map(s=>s.id?`<button class="chip at-chip" data-at-go="${s.id}">${E(trunc(s.name,26))}</button>`:`<span class="chip at-chip">${E(trunc(s.name,26))}</span>`).join("")}</div>`:`<p class="muted small">None yet.</p>`}
 <div class="row" style="margin-top:12px"><button class="btn" data-at-viewreg="${e.id}">Open in the registry</button></div>`}
function tabClasses(M,e){
 const cl=(e.fam||[]).map(k=>({k,label:(DATAMODEL.tables[k]||{}).label||k,nf:((DATAMODEL.tables[k]||{}).fields||[]).length})).sort((a,b)=>a.label.localeCompare(b.label));
 const q=(A.cq||"").toLowerCase(),rows=cl.filter(c=>!q||c.label.toLowerCase().includes(q)||c.k.includes(q));
 return `<p class="muted small">${cl.length} configuration item classes share the base fields. Instances live in the CMDB${window.SCALE&&SCALE.on?" ("+N0(SCALE.n.cis)+" in Enterprise mode)":""}; the diagram keeps them as one box so it stays readable.</p><input type="search" class="txtin" data-at-cq placeholder="Search ${cl.length} classes" value="${E(A.cq||"")}" aria-label="Search classes"><ul class="at-ul at-cul">${rows.slice(0,60).map(c=>`<li><span>${E(c.label)}<small class="muted"> ${E(c.k)}</small></span><span class="muted small">${c.nf} fields</span></li>`).join("")||'<li class="muted small">No class matches.</li>'}</ul>`}

/* =====================================================================
   CAMERA, EVENTS AND THE DIAGRAM PANE
   ===================================================================== */
let LAY=null,ANIM=0,RO=null,PREVSZ=null;
const KMIN=.1,KMAX=2.4;
const $r=()=>document.querySelector("[data-at-root]");
const vpEl=()=>document.querySelector('[data-at-vp="dm"]');
const worldEl=()=>document.querySelector('[data-at-world="dm"]');
const lodOf=k=>k<.5?"far":k>=1.15?"near":"mid";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function vsize(v){v=v||vpEl();return v?{w:v.clientWidth||900,h:v.clientHeight||600}:{w:900,h:600}}
function applyCam(){
 const v=vpEl(),w=worldEl();if(!v||!w||!A.cam)return;const c=A.cam;
 w.style.transform=`translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px) scale(${c.k.toFixed(4)})`;
 const lod=lodOf(c.k);if(v.dataset.lod!==lod)v.dataset.lod=lod;
 const z=document.querySelector("[data-at-zl]");if(z)z.textContent=Math.round(c.k*100)+"%";
 const mv=document.querySelector("[data-at-mv]");if(mv){const s=vsize(v);mv.setAttribute("x",(-c.x/c.k).toFixed(0));mv.setAttribute("y",(-c.y/c.k).toFixed(0));mv.setAttribute("width",(s.w/c.k).toFixed(0));mv.setAttribute("height",(s.h/c.k).toFixed(0))}}
function camFor(r,o){o=o||{};const s=vsize(),pad=o.pad==null?50:o.pad;
 let k=Math.min((s.w-2*pad)/r.w,(s.h-2*pad)/r.h);k=clamp(k,o.kmin||KMIN,o.kmax||1.6);if(o.kfix)k=o.kfix;
 return{k,x:s.w/2-(r.x+r.w/2)*k,y:s.h/2-(r.y+r.h/2)*k}}
function fly(t,instant){
 cancelAnimationFrame(ANIM);if(!A.cam||instant||reduced()||!vpEl()){A.cam=t;applyCam();return}
 const s=vsize(),f=A.cam,c0={x:(s.w/2-f.x)/f.k,y:(s.h/2-f.y)/f.k},c1={x:(s.w/2-t.x)/t.k,y:(s.h/2-t.y)/t.k},t0=performance.now(),D=520;
 const step=now=>{let u=Math.min(1,(now-t0)/D);u=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
  const k=f.k*Math.pow(t.k/f.k,u),cx=c0.x+(c1.x-c0.x)*u,cy=c0.y+(c1.y-c0.y)*u;
  A.cam={k,x:s.w/2-cx*k,y:s.h/2-cy*k};applyCam();if(u<1)ANIM=requestAnimationFrame(step)};
 ANIM=requestAnimationFrame(step)}
function zoomAt(cx,cy,factor){const v=vpEl();if(!v||!A.cam)return;cancelAnimationFrame(ANIM);const r=v.getBoundingClientRect(),px=cx-r.left,py=cy-r.top,c=A.cam,k2=clamp(c.k*factor,KMIN,KMAX);
 A.cam={k:k2,x:px-(px-c.x)*k2/c.k,y:py-(py-c.y)*k2/c.k};applyCam()}
function zoomCenter(f){const v=vpEl();if(!v)return;const r=v.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,f)}
const fitAll=()=>camFor({x:0,y:0,w:LAY.W,h:LAY.H},{pad:24,kmax:1});
function initialCam(M){const s=vsize(),W=LAY.W,H=LAY.H;
 const ka=Math.min((s.w-48)/W,(s.h-48)/H);
 if(ka*17>=11)return{k:ka,x:(s.w-W*ka)/2,y:(s.h-H*ka)/2};
 const r=LAY.regs[M.top]||LAY.regs.service;
 const k=clamp(Math.min((s.w-72)/r.w,(s.h-96)/r.h),.3,1.1);
 return{k,x:s.w/2-(r.x+r.w/2)*k,y:84-(r.y-60)*k}}
const entRect=id=>{const p=LAY.pos[id];return p?{x:p.x,y:p.y,w:p.w,h:p.h}:null};
function unionRect(rs){rs=rs.filter(Boolean);if(!rs.length)return null;const x1=Math.min(...rs.map(r=>r.x)),y1=Math.min(...rs.map(r=>r.y)),x2=Math.max(...rs.map(r=>r.x+r.w)),y2=Math.max(...rs.map(r=>r.y+r.h));return{x:x1,y:y1,w:x2-x1,h:y2-y1}}
const later=fn=>requestAnimationFrame(()=>requestAnimationFrame(fn));

/* ----- redraw in place, keeping the camera ----- */
function drawAll(){
 const root=$r();if(!root)return;const M=model();LAY=layout(M);
 const act=document.activeElement;let fk=null;if(act&&root.contains(act)){const a=act.closest("[data-at-ent],[data-at-fld],[data-at-xp],[data-at-dom-go]");if(a)fk=[...a.attributes].filter(x=>/^data-at-(ent|fld|xp|dom-go)$/.test(x.name)).map(x=>`[${x.name}="${x.value}"]`)[0]}
 const w=worldEl();w.style.width=LAY.W+"px";w.style.height=LAY.H+"px";w.innerHTML=worldHTML(M,LAY);
 root.querySelector("[data-at-mm]").innerHTML=miniHTML(M,LAY);
 const ins=root.querySelector("[data-at-insp]"),ih=inspHTML(M),open=!!ih&&A.panel;
 if(ins){ins.innerHTML=open?ih:"";ins.hidden=!open;root.querySelector(".at-wrap").classList.toggle("insp",open)}
 root.querySelector("[data-at-bc]").innerHTML=bcHTML(M);
 root.querySelector("[data-at-legend]").innerHTML=legendHTML(M);
 root.querySelector("[data-at-card]").innerHTML=cardHTML(M);
 root.querySelectorAll("[data-at-ov]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.atOv===A.ov)));
 const rs=root.querySelector("[data-at-refs]");if(rs)rs.value=A.refs;
 const vp=vpEl();vp.classList.toggle("has-act",!!(A.sel||A.trace||A.q||A.fld));
 applyCam();
 if(fk){const n=root.querySelector(fk);if(n)try{n.focus({preventScroll:true})}catch(e){}}}

/* ----- navigation actions ----- */
function selectEnt(id,o){o=o||{};const M=model(),e=M.ent.get(id);if(!e)return;
 A.sel=id;A.fld=null;A.dom=e.domain;A.trace=o.keepTrace?A.trace:null;if(!e.ghost)A.exp[id]=true;A.panel=true;if(o.tab)A.itab=o.tab;
 drawAll();later(()=>{const r=entRect(id);if(r)fly(camFor({x:r.x-24,y:r.y-16,w:r.w+48,h:r.h+32},{kmax:1.5,pad:26}),o.instant)});
 if(!o.quiet)audit("Opened an entity on the data diagram",e.label)}
function selectField(eid,k,o){const M=model(),e=M.ent.get(eid);if(!e)return;const f=e.fields.find(x=>x.k===k);if(!f)return;
 const same=A.sel===eid;A.sel=eid;A.fld={e:eid,k};A.dom=e.domain;A.exp[eid]=true;A.panel=true;A.itab="fields";drawAll();
 if(!same||(o&&o.fly))later(()=>{const r=entRect(eid);if(r)fly(camFor({x:r.x-24,y:r.y-16,w:r.w+48,h:r.h+32},{kmax:1.5,pad:26}))});
 audit("Selected a field",e.label+" · "+f.label)}
function selectDom(d){A.dom=d;A.sel=null;A.fld=null;A.panel=true;drawAll();later(()=>{const r=LAY.regs[d];if(r)fly(camFor({x:r.x,y:r.y,w:r.w,h:r.h},{kmax:1.2,pad:30}))});audit("Zoomed to a domain",dName(d))}
function clearAll(){A.sel=null;A.fld=null;A.dom=null;A.trace=null;A.q="";const q=document.querySelector("[data-at-q]");if(q)q.value="";drawAll();later(()=>fly(fitAll()))}
function back(){
 if(A.fld){A.fld=null;drawAll();return}
 if(A.sel){const d=model().ent.get(A.sel).domain;A.sel=null;A.dom=d;drawAll();later(()=>{const r=LAY.regs[d];if(r)fly(camFor(r,{kmax:1.2,pad:30}))});return}
 if(A.trace){A.trace=null;drawAll();return}
 if(A.dom){clearAll();return}}
function toggleExp(id){A.exp[id]=!A.exp[id];if(!A.exp[id])delete A.exp[id];drawAll();if(A.exp[id])later(()=>{const r=entRect(id);if(r)fly(camFor({x:r.x-24,y:r.y-16,w:r.w+48,h:r.h+32},{kmax:1.5,pad:26}))})}
function traceOnDiagram(mid){A.trace=mid;A.sel=null;A.fld=null;A.dom=null;A.q="";A.pend={k:"trace"};audit("Traced a metric on the data diagram",METRICS[mid]?METRICS[mid].n:mid);S.v.atlas=0;if(S.screen!=="plat_data")go("plat_data");else render()}
function focusTrace(){const M=model(),t=LIN.trace(A.trace);if(!t)return;const ids=[...new Set([...t.srcs.values()].map(s=>s.ent))];
 const r=unionRect(ids.map(entRect).concat([{x:LAY.W/2-200,y:0,w:400,h:110}]));if(r)fly(camFor(r,{pad:50,kmax:1}),true)}

/* ----- search ----- */
let _six=null,_sk="";
function searchIdx(){const M=model(),k=M.list.length+"|"+Object.keys(METRICS).length;if(_six&&_sk===k)return _six;_sk=k;const o=[];
 M.list.forEach(e=>{o.push({kind:"ent",id:e.id,label:e.label.replace(/\s*\(.*$/,""),sub:dName(e.domain)+" · "+(e.ghost?"planned":e.nf+" fields"),hay:(e.label+" "+e.id).toLowerCase()});(e.fields||[]).forEach(f=>o.push({kind:"fld",id:e.id,k:f.k,label:f.label,sub:e.label.replace(/\s*\(.*$/,""),hay:(f.label+" "+f.k).toLowerCase()}))});
 Object.keys(METRICS).forEach(id=>{if(/^m_atlas/.test(id))return;o.push({kind:"met",id,label:METRICS[id].n,sub:"Metric · "+METRICS[id].owner,hay:(METRICS[id].n+" "+id).toLowerCase()})});
 return _six=o}
function searchRun(q){q=q.trim().toLowerCase();if(q.length<2)return[];const ix=searchIdx(),out=[];
 for(const x of ix){if(x.hay.indexOf(q)<0)continue;x.s=(x.hay.indexOf(q)===0?0:1)+(x.kind==="ent"?0:x.kind==="met"?.5:1);out.push(x)}
 return out.sort((a,b)=>a.s-b.s).slice(0,9)}
function srHTML(q){const r=searchRun(q);if(!r.length)return q.trim().length>1?`<div class="at-srn muted small">No table, field or metric matches "${E(q)}".</div>`:"";
 return r.map((x,i)=>`<button class="at-sri" data-at-pick="${x.kind}|${x.id}|${x.k||""}" ${i===0?'data-first="1"':""}><b>${E(trunc(x.label,40))}</b><small>${x.kind==="ent"?"Table":x.kind==="fld"?"Field":"Metric"} · ${E(trunc(x.sub,40))}</small></button>`).join("")}
function pick(v){const [kind,id,k]=v.split("|");const sr=document.querySelector("[data-at-sr]");if(sr)sr.hidden=true;
 if(kind==="ent")selectEnt(id);else if(kind==="fld")selectField(id,k,{fly:true});else if(kind==="met"){traceOnDiagram(id)}
 A.q="";const q=document.querySelector("[data-at-q]");if(q)q.value=""}

/* ----- pan, pinch, wheel, keys ----- */
const PTR=new Map();let DR=null,PINCH=null,SUPP=false;
document.addEventListener("pointerdown",e=>{
 const v=e.target.closest&&e.target.closest("[data-at-vp]");if(!v||!A.cam)return;
 if(e.target.closest(".at-tools,.at-mm,.at-fcard,.at-token input")||(e.pointerType==="mouse"&&e.button!==0))return;
 PTR.set(e.pointerId,{x:e.clientX,y:e.clientY});cancelAnimationFrame(ANIM);
 if(PTR.size===1)DR={v,id:e.pointerId,sx:e.clientX,sy:e.clientY,cx:A.cam.x,cy:A.cam.y,moved:false};
 else if(PTR.size===2){const [a,b]=[...PTR.values()];PINCH={d:Math.hypot(a.x-b.x,a.y-b.y),k:A.cam.k};if(DR)DR.moved=true}});
document.addEventListener("pointermove",e=>{
 if(!PTR.has(e.pointerId))return;PTR.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(PINCH&&PTR.size>=2){const [a,b]=[...PTR.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(PINCH.d>0)zoomAt((a.x+b.x)/2,(a.y+b.y)/2,clamp(PINCH.k*d/PINCH.d,KMIN,KMAX)/A.cam.k);return}
 if(!DR||e.pointerId!==DR.id)return;const dx=e.clientX-DR.sx,dy=e.clientY-DR.sy;
 if(!DR.moved&&Math.hypot(dx,dy)>6){DR.moved=true;DR.v.classList.add("pan");try{DR.v.setPointerCapture(e.pointerId)}catch(x){}}
 if(DR.moved){A.cam.x=DR.cx+dx;A.cam.y=DR.cy+dy;applyCam()}});
const upP=e=>{if(!PTR.has(e.pointerId))return;PTR.delete(e.pointerId);if(PTR.size<2)PINCH=null;
 if(DR&&e.pointerId===DR.id){if(DR.moved){SUPP=true;setTimeout(()=>SUPP=false,50)}DR.v.classList.remove("pan");DR=null}};
document.addEventListener("pointerup",upP);document.addEventListener("pointercancel",upP);
document.addEventListener("click",e=>{if(SUPP){e.stopPropagation();e.preventDefault();SUPP=false}},true);
document.addEventListener("wheel",e=>{const v=e.target.closest&&e.target.closest("[data-at-vp]");if(!v||!A.cam)return;
 if(!(e.ctrlKey||e.metaKey)){if(e.shiftKey&&e.deltaY){e.preventDefault();A.cam.x-=e.deltaY;applyCam()}return}
 e.preventDefault();zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*(e.deltaMode===1?.06:.0024)))},{passive:false});
function ensureVisible(el){const v=vpEl();if(!v||!el)return;const r=el.getBoundingClientRect(),b=v.getBoundingClientRect();let dx=0,dy=0;
 if(r.left<b.left+20)dx=b.left+60-r.left;else if(r.right>b.right-20)dx=b.right-60-r.right;if(r.top<b.top+20)dy=b.top+60-r.top;else if(r.bottom>b.bottom-20)dy=b.bottom-60-r.bottom;
 if(dx||dy){A.cam.x+=dx;A.cam.y+=dy;applyCam()}}
document.addEventListener("keydown",e=>{
 const v=e.target.closest&&e.target.closest("[data-at-vp]");if(!v||!A.cam)return;
 const onVp=e.target===v,eh=e.target.closest&&e.target.closest(".at-eh");
 if(e.target.matches("input,select,textarea"))return;
 if(e.key==="+"||e.key==="="){e.preventDefault();zoomCenter(1.25);return}
 if(e.key==="-"||e.key==="_"){e.preventDefault();zoomCenter(.8);return}
 if(e.key==="0"){e.preventDefault();fly(fitAll());return}
 if(e.key==="Escape"){back();return}
 if(/^Arrow/.test(e.key)){
  if(onVp||e.shiftKey){e.preventDefault();const d=90;if(e.key==="ArrowLeft")A.cam.x+=d;if(e.key==="ArrowRight")A.cam.x-=d;if(e.key==="ArrowUp")A.cam.y+=d;if(e.key==="ArrowDown")A.cam.y-=d;applyCam();return}
  if(eh){e.preventDefault();const cur=eh.getBoundingClientRect(),cx=cur.left+cur.width/2,cy=cur.top+cur.height/2,dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];let best=null,bs=1e9;
   v.querySelectorAll(".at-eh").forEach(n=>{if(n===eh)return;const r=n.getBoundingClientRect(),x=r.left+r.width/2-cx,y=r.top+r.height/2-cy,fwd=x*dir[0]+y*dir[1];if(fwd<20)return;const side=Math.abs(x*dir[1])+Math.abs(y*dir[0]);const sc=fwd+side*2;if(sc<bs){bs=sc;best=n}});
   if(best){best.focus({preventScroll:true});ensureVisible(best)}}}});

/* minimap: select or drag to move */
let MMD=false;
function mmMove(e){const svg=document.querySelector("[data-at-mmsvg]");if(!svg||!A.cam)return;const r=svg.getBoundingClientRect(),wx=(e.clientX-r.left)/r.width*LAY.W,wy=(e.clientY-r.top)/r.height*LAY.H,s=vsize();
 cancelAnimationFrame(ANIM);A.cam={k:A.cam.k,x:s.w/2-wx*A.cam.k,y:s.h/2-wy*A.cam.k};applyCam()}
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("[data-at-mmsvg]")){MMD=true;mmMove(e);e.preventDefault()}});
document.addEventListener("pointermove",e=>{if(MMD)mmMove(e)});
document.addEventListener("pointerup",()=>{MMD=false});

/* ----- clicks ----- */
document.addEventListener("click",e=>{
 const t=e.target.closest&&e.target.closest("[data-at-ent],[data-at-xp],[data-at-fld],[data-at-dom-go],[data-at-bc],[data-at-z],[data-at-ov],[data-at-fly],[data-at-itab],[data-at-close],[data-at-pick],[data-at-lin],[data-at-trace],[data-at-clear-trace],[data-at-more],[data-at-go],[data-at-expdom],[data-at-collapse],[data-at-viewreg],[data-go-reg],[data-at-panel]");
 if(!t){const sr=document.querySelector("[data-at-sr]");if(sr&&!e.target.closest(".at-search"))sr.hidden=true;return}
 const d=t.dataset;
 if(d.atEnt!==undefined&&d.atItab===undefined){selectEnt(d.atEnt);return}
 if(d.atItab!==undefined){if(d.atEnt&&A.sel!==d.atEnt){A.itab=d.atItab;selectEnt(d.atEnt)}else{A.itab=d.atItab;A.panel=true;drawAll()}return}
 if(d.atXp!==undefined){toggleExp(d.atXp);return}
 if(d.atFld!==undefined){const [en,k]=d.atFld.split("|");selectField(en,k);return}
 if(d.atDomGo!==undefined){selectDom(d.atDomGo);return}
 if(d.atBc!==undefined){const M=model();if(d.atBc==="all")clearAll();else if(d.atBc==="back")back();else if(d.atBc==="dom"){selectDom(A.sel&&M.ent.get(A.sel)?M.ent.get(A.sel).domain:A.dom)}else if(d.atBc==="ent"){A.fld=null;drawAll()}return}
 if(d.atZ!==undefined){if(d.atZ==="in")zoomCenter(1.3);else if(d.atZ==="out")zoomCenter(1/1.3);else if(d.atZ==="fit")fly(fitAll());else if(d.atZ==="reset")fly(initialCam(model()));return}
 if(d.atOv!==undefined){A.ov=d.atOv;audit("Colored the data diagram by",d.atOv);drawAll();return}
 if(d.atFly!==undefined){selectEnt(d.atFly,{keepTrace:!!A.trace});return}
 if(d.atClose!==undefined){if(A.sel){A.sel=null;A.fld=null}else A.dom=null;A.panel=true;drawAll();return}
 if(d.atPick!==undefined){pick(d.atPick);return}
 if(d.atLin!==undefined){openLineage(d.atLin);return}
 if(d.atTrace!==undefined){traceOnDiagram(d.atTrace);return}
 if(d.atClearTrace!==undefined){A.trace=null;drawAll();return}
 if(d.atMore!==undefined){plannedDrawer();return}
 if(d.atGo!==undefined){go(d.atGo);return}
 if(d.atExpdom!==undefined){model().byDom(d.atExpdom).forEach(x=>{if(!x.ghost&&!x.more)A.exp[x.id]=true});A.dom=d.atExpdom;A.sel=null;drawAll();later(()=>{const r=LAY.regs[d.atExpdom];if(r)fly(camFor(r,{kmax:1,pad:30}))});return}
 if(d.atCollapse!==undefined){A.exp={};drawAll();return}
 if(d.atViewreg!==undefined){go("plat_reg");return}
 if(d.goReg!==undefined){go("plat_reg");return}
 if(d.atPanel!==undefined){A.panel=!A.panel;drawAll();return}});
document.addEventListener("input",e=>{
 const q=e.target.closest&&e.target.closest("[data-at-q]");
 if(q){A.q=q.value;const sr=document.querySelector("[data-at-sr]");if(sr){sr.innerHTML=srHTML(q.value);sr.hidden=!sr.innerHTML}
  clearTimeout(q._t);q._t=setTimeout(()=>{if(vpEl())drawAll()},180);return}
 const c=e.target.closest&&e.target.closest("[data-at-cq]");
 if(c){A.cq=c.value;const ib=document.querySelector("[data-at-insp] .at-ib");if(ib){const M=model();ib.innerHTML=tabClasses(M,M.ent.get(A.sel));const n=ib.querySelector("[data-at-cq]");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}}}});
document.addEventListener("keydown",e=>{const q=e.target.closest&&e.target.closest("[data-at-q]");if(!q)return;
 if(e.key==="Enter"){const f=document.querySelector("[data-at-sr] [data-first]");if(f){e.preventDefault();pick(f.dataset.atPick)}}
 else if(e.key==="Escape"){q.value="";A.q="";const sr=document.querySelector("[data-at-sr]");if(sr)sr.hidden=true;drawAll()}});
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-at-refs]");if(s){A.refs=s.value;drawAll()}});

/* ----- the planned-entity drawer ----- */
function plannedDrawer(){const M=model();
 const rows=M.more.map(p=>({id:p.id,t:p.label,sub:p.why,tag:dName(p.domain),st:"mute",go:()=>{}}));
 openDrawer(`<div class="eyebrow">Planned entities</div><h2 style="margin:4px 0">${M.more.length} more planned entities</h2><p class="muted small">The registry names these core entities but they are not tables yet. Each one has a steward and a reason. Entities that a metric or a reference already points to are drawn on the diagram.</p>${lrHTML({id:"at_planned",groups:[{key:"p",label:"Planned entities",rows}],limit:10,search:true})}<div class="row" style="margin-top:12px"><button class="btn primary" data-go-reg="1">Open the registry to propose one</button></div>`)}

/* ----- the diagram pane ----- */
function phoneHTML(M){
 return `<div class="at-phone" aria-label="Domains and tables as a list">${Object.keys(DC).filter(d=>M.byDom(d).length).map(d=>`<details class="at-pd" style="--c:var(${DC[d]})"><summary><i class="at-dot" style="background:var(${DC[d]})"></i><b>${E(dName(d))}</b><span class="muted small">${M.byDom(d).length} tables</span></summary><ul>${M.byDom(d).map(e=>`<li><button class="at-pr" data-at-ent="${e.id}"><span>${E(e.label.replace(/\s*\(.*$/,""))}</span><small class="muted">${e.ghost?"planned":e.nf+" fields"} · feeds ${LIN.feeds(e.id).length}</small></button></li>`).join("")}</ul></details>`).join("")}</div>`}
function diagramPane(){
 const M=model();LAY=layout(M);const st=LIN.stats(),ps=PLAT.stats();
 syncMetrics(st);
 const strip=typeof kpiRow==="function"?kpiRow([["Tables",M.list.filter(e=>!e.ghost).length,"CI classes shown as one box"],["Fields",N0(ps.nf),ps.extAuth+" external, "+ps.shared+" shared"],["Reference links",M.edges.length,M.edges.filter(e=>e.cross).length+" cross-domain"],["Metrics fully traced",st.pct+"%",st.full+" of "+st.n+" to fields",{metric:"m_atlas_trace",keep:true}],["Duplicates open",ps.dups,"fixes in the registry",{cls:ps.dups?"bad":"good",keep:true}]]):"";
 const ins=inspHTML(M),open=!!ins&&A.panel;
 return `<div class="at-root" data-at-root>
 <div class="at-bar"><label class="at-search"><span class="sr">Search tables, fields and metrics</span><input type="search" class="txtin" data-at-q placeholder="Search tables, fields, metrics" value="${E(A.q)}" autocomplete="off" aria-label="Search tables, fields and metrics"><div class="at-sr" data-at-sr hidden></div></label>
  <div class="at-ovs" role="group" aria-label="Color the diagram by"><span class="muted small">Color by</span>${OVN.map(o=>`<button class="chip" data-at-ov="${o[0]}" aria-pressed="${A.ov===o[0]}">${o[1]}</button>`).join("")}</div>
  <label class="at-refs muted small">References <select class="txtin" data-at-refs aria-label="Which references to draw"><option value="all">All</option><option value="cross">Across domains only</option><option value="sel">Selected only</option><option value="off">Hidden</option></select></label>
  <details class="at-lgd"><summary class="btn quiet">Legend</summary><div class="at-legend at-lgpop" data-at-legend>${legendHTML(M)}</div></details></div>
 <div class="at-wrap${open?" insp":""}">
  <div class="at-main">
   <div class="at-vpbox"><div class="at-bc" data-at-bc>${bcHTML(M)}</div><div class="at-vp" data-at-vp="dm" tabindex="0" role="application" aria-label="Master data model diagram. Drag to pan. Press plus and minus to zoom, zero to fit everything, arrow keys to move." data-lod="mid"><div class="at-world" data-at-world="dm" style="width:${LAY.W}px;height:${LAY.H}px">${worldHTML(M,LAY)}</div></div>
    <div class="at-tools" role="group" aria-label="Zoom"><button class="btn quiet" data-at-z="in" aria-label="Zoom in">+</button><button class="btn quiet" data-at-z="out" aria-label="Zoom out">−</button><button class="btn quiet" data-at-z="fit">Fit all</button><button class="btn quiet" data-at-z="reset">Reset</button><button class="btn quiet" data-at-collapse="1">Collapse boxes</button><span class="muted small" data-at-zl>100%</span></div>
    <div class="at-mm" data-at-mm>${miniHTML(M,LAY)}</div><div class="at-cardbox" data-at-card>${cardHTML(M)}</div>
    <p class="at-hint muted small">Drag to pan. Ctrl and scroll, or pinch, to zoom. Select a domain name to zoom to it, a table to open its details, and the arrow on a table to show its fields.</p></div></div>
  <aside class="at-insp" data-at-insp ${open?"":"hidden"} aria-label="Details">${open?ins:""}</aside>
 </div>${phoneHTML(M)}
 <div class="at-strip">${strip}</div></div>`}

function refit(){if(A.auto===false||A.sel||A.trace||A.dom||A.fld)return;const M=model();LAY=LAY||layout(M);A.cam=initialCam(M);applyCam()}
function mount(){
 const v=vpEl();if(!v)return;const M=model();LAY=layout(M);
 if(RO){try{RO.disconnect()}catch(e){}}
 PREVSZ=vsize(v);
 if(!A.cam||(A.auto!==false&&!A.sel&&!A.trace&&!A.dom&&!A.fld))A.cam=initialCam(M);
 if(A.pend){const p=A.pend;A.pend=null;A.auto=false;if(p.k==="trace")focusTrace();else if(p.k==="ent"){const r=entRect(p.id);if(r)A.cam=camFor({x:r.x-24,y:r.y-16,w:r.w+48,h:r.h+32},{kmax:1.5,pad:26})}}
 applyCam();later(()=>{if(vpEl()===v)refit()});
 if(window.ResizeObserver){RO=new ResizeObserver(()=>{const s=vsize(v);if(!PREVSZ||!A.cam){PREVSZ=s;return}if(Math.abs(s.w-PREVSZ.w)>2||Math.abs(s.h-PREVSZ.h)>2){const d={x:(s.w-PREVSZ.w)/2,y:(s.h-PREVSZ.h)/2};PREVSZ=s;if(A.auto!==false&&!A.sel&&!A.trace&&!A.dom&&!A.fld){A.cam=initialCam(model())}else{A.cam.x+=d.x;A.cam.y+=d.y}applyCam()}});RO.observe(v)}}

/* =====================================================================
   METRIC LINEAGE TAB
   ===================================================================== */
const LN={cam:null,hist:[],sel:null};
const lnEl=()=>document.querySelector('[data-at-lvp]');
const OPN={"×":"multiply","÷":"divide","+":"add","−":"subtract","Σ":"sum over records","avg":"average","med":"median","n":"count","ƒ":"combine"};
const OPS={"avg":"avg","med":"med","n":"#"};
function fmtN(v){if(v==null||!isFinite(v))return"";const a=Math.abs(v);if(a>=1e6)return (v/1e6).toFixed(2).replace(/\.?0+$/,"")+"M";if(a>=1000)return N0(v);if(a>=100)return String(Math.round(v*10)/10);return String(Math.round(v*1000)/1000)}
const lrows=()=>LIN.all().map(t=>({id:t.id,n:t.m.n,owner:t.m.owner||"",pct:t.pct,st:t.status,tr:t.status==="full"?"Fully traced":t.status==="partial"?"Partly traced":"Not traced",scr:((t.m.use||[])[0])||"No screen",val:mfmt(t.m)}));
function listHTML(){
 return btHTML({id:"at_lin",h:300,rowH:48,key:"id",sort:null,exportName:"metric-lineage",facets:["owner","tr","scr"],
  cols:[{k:"n",label:"Metric",val:r=>r.n,wrap:true,fmt:r=>`<b>${E(r.n)}</b>`},{k:"val",label:"Value",val:r=>r.val,fmt:r=>`<span class="num">${E(r.val)}</span>`},
   {k:"pct",label:"Traced",val:r=>r.pct,fmt:r=>`<span class="pill ${r.st==="full"?"good":r.st==="partial"?"warn":"bad"}">${r.pct}%</span>`},
   {k:"tr",label:"Trace status",val:r=>r.tr,fmt:r=>E(r.tr)},{k:"owner",label:"Owner",val:r=>r.owner,fmt:r=>E(r.owner)},{k:"scr",label:"Screen",val:r=>r.scr,fmt:r=>E(r.scr)}],
  rows:lrows,open:id=>{openLineage(id);const d=document.querySelector("[data-at-ldet]");if(d)d.scrollIntoView({behavior:reduced()?"auto":"smooth",block:"start"})}})}

/* ----- graph construction ----- */
function buildGraph(t){
 const nodes=[],edges=[],groups=new Map();let nid=0;
 const showVals=!(t.val!=null&&!t.calcOk);
 function mk(o){o.id=++nid;nodes.push(o);return o}
 function walk(n,parent){
  if(n.t==="num"){return mk({t:"num",w:46,h:34,col:0,text:fmtN(n.v)||"?"})}
  if(n.t==="param")return mk({t:"param",w:230,h:46,col:0,text:n.text});
  if(n.t==="gap"){return mk({t:"gap",w:250,h:84,col:0,text:n.text,key:n.key,node:n})}
  if(n.t==="src"){
   let g=groups.get(n.ent);if(!g){const M=model(),e=M.ent.get(n.ent);g={ent:n.ent,e,rows:new Map(),w:264,col:0,t:"group"};groups.set(n.ent,g);nodes.push(g);g.id=++nid}
   const rk=n.fld||"";if(!g.rows.has(rk))g.rows.set(rk,{k:n.fld,conf:n.conf,via:n.via,phrases:new Set(),i:g.rows.size});g.rows.get(rk).phrases.add(n.phrase);
   return{t:"srcref",group:g,row:g.rows.get(rk),scales:n.scales,id:++nid}}
  if(n.t==="metric"){
   const m=METRICS[n.id];
   if(n.sub){const kid=walk(n.sub,null);const me=mk({t:"metric",w:240,h:92,mid:n.id,kids:[kid],text:n.text});if(kid.t!=="srcref")kid.parentNode=me;return me}
   return mk({t:"metric",w:240,h:92,col:0,mid:n.id,kids:[],text:n.text,leaf:true})}
  if(n.t==="op"){
   const kids=n.kids.map(k=>walk(k,null));
   const me=mk(n.derived?{t:"derived",w:210,h:58,op:"ƒ",kids,text:n.label,nf:n.kids.length}:{t:"op",w:60,h:60,op:n.op,kids,v:showVals?n.v:null,label:n.label,delta:n.delta});
   return me}
  return mk({t:"param",w:200,h:40,col:0,text:"?"})}
 const rootRaw=t.tree;let rootNode=walk(rootRaw,null);
 /* scales: remember on the node that carries them */
 const attach=(raw,node)=>{if(node&&raw.scales)node.scales=raw.scales;if(raw.t==="op"&&node&&node.kids)raw.kids.forEach((k,i)=>attach(k,node.kids[i]));if(raw.t==="metric"&&raw.sub&&node&&node.kids)attach(raw.sub,node.kids[0])};
 attach(rootRaw,rootNode);
 /* srcref become edges from group rows; give srcref its scales */
 /* columns */
 const colOf=n=>{if(n.t==="group"||n.t==="srcref")return 0;if(n.col!=null&&n.col>=0&&!n.kids)return n.col;
  if(n.kids&&n.kids.length){n.col=1+Math.max(...n.kids.map(colOf));return n.col}return n.col||0};
 nodes.forEach(n=>{if(n.t!=="group")colOf(n)});
 const rootCol=rootNode.t==="srcref"?0:rootNode.col;
 /* ordering of column-0 items by first appearance (DFS) */
 const order=[];const seen=new Set();
 const dfs=n=>{if(n.t==="srcref"){if(!seen.has(n.group)){seen.add(n.group);order.push(n.group)}return}
  if(n.kids&&n.kids.length){n.kids.forEach(dfs);return}
  if(!seen.has(n)){seen.add(n);order.push(n)}};
 dfs(rootNode);
 /* group heights and positions */
 groups.forEach(g=>{g.h=40+g.rows.size*32+8});
 let y=0;order.forEach(n=>{n.y=y;y+=n.h+18});
 const col0H=y;
 /* column widths and x */
 const nCols=rootCol+1;const colW=new Array(nCols).fill(0);
 order.forEach(n=>{colW[0]=Math.max(colW[0],n.w)});
 nodes.forEach(n=>{if(n.t!=="group"&&n.col>0)colW[n.col]=Math.max(colW[n.col],n.w)});
 const gap=60;const colX=[0];for(let c=1;c<=nCols;c++)colX[c]=colX[c-1]+colW[c-1]+gap;
 order.forEach(n=>{n.x=0;n.cy=n.y+n.h/2});
 const anchorY=(k)=>k.t==="srcref"?k.group.y+40+k.row.i*32+16:k.cy;
 /* upper columns */
 for(let c=1;c<nCols;c++){
  const col=nodes.filter(n=>n.t!=="group"&&n.t!=="srcref"&&n.col===c);
  col.forEach(n=>{n.cy=n.kids.reduce((a,k)=>a+anchorY(k),0)/n.kids.length;n.x=colX[c]+(colW[c]-n.w)/2});
  col.sort((a,b)=>a.cy-b.cy);for(let i=1;i<col.length;i++){const need=col[i-1].cy+col[i-1].h/2+col[i].h/2+30;if(col[i].cy<need)col[i].cy=need}
 }
 if(rootNode.t==="srcref"){/* formula is a single operand */}
 const rootY=rootNode.t==="srcref"?anchorY(rootNode):rootNode.cy;
 /* result and consumers */
 const resX=colX[nCols],resW=240,resH=220;
 const res={x:resX,cy:rootY,w:resW,h:resH};
 const uses=(t.m.use||[]).map(u=>({name:u,id:scrByName(u)}));
 const conH=46;
 const conY0=rootY+resH/2+14;
 uses.forEach((u,i)=>{u.x=resX;u.y=conY0+i*(conH+10);u.w=resW;u.h=conH});
 /* shift everything so the minimum y is 0 */
 let minY=Math.min(0,res.cy-resH/2,...nodes.map(n=>n.t==="group"?n.y:n.cy-n.h/2),...uses.map(u=>u.y)),maxY=Math.max(col0H,res.cy+resH/2,...nodes.map(n=>n.t==="group"?n.y+n.h:n.cy+n.h/2+24),...uses.map(u=>u.y+u.h));
 const off=-minY+14;
 nodes.forEach(n=>{if(n.t==="group")n.y+=off;else n.cy+=off});res.cy+=off;uses.forEach(u=>u.y+=off);
 const W=resX+resW+24,H=maxY-minY+40;
 return{nodes,groups,rootNode,res,uses,W,H,colX,showVals,order,nCols}}

/* ----- edges ----- */
function graphEdges(G,t){
 const out=[];const anchor=(n)=>n.t==="srcref"?{x:n.group.x+n.group.w,y:n.group.y+40+n.row.i*32+16}:{x:n.x+n.w,y:n.cy};
 const inA=(n)=>({x:n.x,y:n.cy});
 const add=(a,b,o)=>out.push(Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},o||{}));
 const hotSet=new Set();
 const lf=A.lfld&&A.lfld.t===t.id?A.lfld:null;
 const path=(n,acc)=>{ /* does subtree include the selected source? */
  if(n.t==="srcref"){return lf&&n.group.ent===lf.e&&(n.row.k||"")===(lf.k||"")}
  if(!n.kids)return false;let hit=false;n.kids.forEach(k=>{if(path(k,acc)){hit=true}});if(hit)acc.add(n.id);return hit};
 if(lf)path(G.rootNode,hotSet);
 const rec=(n)=>{
  if(n.t==="srcref")return;
  if(!n.kids)return;
  n.kids.forEach(k=>{
   const a=anchor(k),b=inA(n);const sc=(k.scales||[]).map(s=>s[0]+" "+fmtN(s[1])).join(" ");
   const hot=lf&&(k.t==="srcref"?(lf.e===k.group.ent&&(k.row.k||"")===(lf.k||"")):hotSet.has(k.id));
   add(a,b,{lab:sc,hot,gap:k.t==="gap",weak:k.t==="srcref"&&k.row.conf<.6});
   rec(k)})};
 /* scaled nodes: put the scale on the edge into the parent, handled above via k.scales */
 rec(G.rootNode);
 const ra=anchor(G.rootNode);add(ra,{x:G.res.x,y:G.res.cy},{lab:(G.rootNode.scales||[]).map(s=>s[0]+" "+fmtN(s[1])).join(" "),hot:!!lf&&(G.rootNode.t==="srcref"||hotSet.has(G.rootNode.id)),res:true});
  return out}
function edgeSvg(G,edges){
 let s=`<svg class="at-lsvg" width="${G.W}" height="${G.H}" viewBox="0 0 ${G.W} ${G.H}" aria-hidden="true" focusable="false"><defs><marker id="at-lar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L10 5L0 9z" class="at-ar"/></marker><marker id="at-larh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L10 5L0 9z" class="at-arh"/></marker></defs>`;
 edges.forEach(e=>{const dx=Math.max(30,(e.x2-e.x1)*.5);
  s+=`<path class="at-le${e.hot?" hot":""}${e.gap?" gapl":""}${e.weak?" weak":""}${e.use?" use":""}" d="M${e.x1.toFixed(0)} ${e.y1.toFixed(0)}C${(e.x1+dx).toFixed(0)} ${e.y1.toFixed(0)},${(e.x2-dx).toFixed(0)} ${e.y2.toFixed(0)},${e.x2.toFixed(0)} ${e.y2.toFixed(0)}" marker-end="url(#${e.hot?"at-larh":"at-lar"})"/>`;
  if(e.lab){const mx=e.x1+(e.x2-e.x1)*.62,my=e.y1+(e.y2-e.y1)*.62;s+=`<g class="at-elab" transform="translate(${mx.toFixed(0)},${my.toFixed(0)})"><rect x="-26" y="-11" width="52" height="22" rx="11"/><text y="4" text-anchor="middle">${E(e.lab)}</text></g>`}});
 return s+`</svg>`}

/* ----- node markup ----- */
function nodeHTML(G,t){
 const M=model();let h="";
 G.groups.forEach(g=>{const e=g.e,dom=e?e.domain:"planned",ghost=e&&e.ghost;
  g.x=0;
  h+=`<div class="at-lg${ghost?" ghost":""}" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;--c:var(${DC[dom]||"--faint"})"><button class="at-lgh" data-at-viewent="${g.ent}" title="Show ${E(e?e.label:g.ent)} on the data diagram"><b>${E(e?e.label.replace(/\s*\(.*$/,""):g.ent)}</b><small>${E(dName(dom))}${ghost?" · planned":""}</small></button>`;
  g.rows.forEach(r=>{const f=r.k&&e?e.fields.find(x=>x.k===r.k):null,m=f?PLAT.fieldMeta(g.ent,f):null,on=A.lfld&&A.lfld.t===t.id&&A.lfld.e===g.ent&&(A.lfld.k||"")===(r.k||"");
   h+=`<button class="at-lgr${on?" on":""}${r.conf<.6?" weak":""}" data-at-lsrc="${g.ent}|${r.k||""}" title="${E([...r.phrases].join("; "))} · ${E(r.via)} · confidence ${Math.round(r.conf*100)}%"><i class="at-ad" style="background:var(${m?AUTHC[m.auth]:"--faint"})"></i><span>${E(f?f.label:ghost?"Planned entity":"Record count")}</span><small class="at-cf">${Math.round(r.conf*100)}%</small></button>`});
  h+=`</div>`});
 G.nodes.forEach(n=>{
  if(n.t==="group")return;
  const st=`left:${n.x||0}px;top:${(n.cy||0)-n.h/2}px;width:${n.w}px;height:${n.h}px`;
  if(n.t==="op"){const v=n.v!=null&&G.showVals?fmtN(n.v):"";h+=`<div class="at-lo" style="${st}" title="${E(OPN[n.op]||n.op)}${n.label?": "+E(n.label):""}"><span class="at-lov">${E(OPS[n.op]||n.op)}</span>${v?`<span class="at-lval num">${E(v)}</span>`:""}</div>`}
  else if(n.t==="derived")h+=`<div class="at-ld" style="${st}" title="${E(n.text)}"><b>ƒ</b><span>${E(trunc(n.text,52))}</span><small>${n.nf} field${n.nf===1?"":"s"}</small></div>`;
  else if(n.t==="metric"){const m=METRICS[n.mid];if(!m)return;const s=mstat(m);h+=`<button class="at-lm" style="${st}" data-at-lopen="${n.mid}" title="Open the calculation of ${E(m.n)}"><span class="at-lmn">${E(trunc(m.n,34))}</span><span class="at-lmr"><span class="num" data-role="metric">${E(mfmt(m))}</span><span class="pill ${stCls(s)}">${s==="good"?"On target":s==="warn"?"Watch":"Off target"}</span></span>${miniGauge(m)}<small class="muted">${n.leaf?"Another metric":"Metric, expanded to the left"}</small></button>`}
  else if(n.t==="gap"){const i=G.gapList.indexOf(n.key);h+=`<div class="at-lq" style="${st}"><span class="at-lqh"><b>Needs mapping</b></span><span class="at-lqt" title="${E(n.text)}">${E(trunc(n.text,70))}</span><button class="btn at-lqb" data-at-lmap="${i}">Map this</button></div>`}
  else if(n.t==="param")h+=`<div class="at-lp" style="${st}" title="Policy setting or time window, not stored data"><small>Setting</small><span>${E(trunc(n.text,48))}</span></div>`;
  else if(n.t==="num")h+=`<div class="at-ln" style="${st}">${E(n.text)}</div>`});
 /* result */
 const m=t.m,s=mstat(m),R=G.res,col=`var(${s==="good"?"--good-f":s==="warn"?"--warn-f":"--bad-f"})`;
 h+=`<div class="at-res" style="left:${R.x}px;top:${R.cy-R.h/2}px;width:${R.w}px;height:${R.h}px"><span class="eyebrow">Result</span><b class="at-resn">${E(m.n)}</b><div class="row"><span class="num at-resv" data-role="metric">${E(mfmt(m))}</span><span class="pill ${stCls(s)}">${s==="good"?"On target":s==="warn"?"Watch":"Off target"}</span></div><span class="muted small">target ${m.dir==="max"?"at least":"at most"} ${E(mfmt(m,m.tgt))}</span>${miniGauge(m)}<div class="at-sp">${spark(m.tr,230,34,col)}</div>${t.val!=null&&G.showVals?`<span class="small muted">Formula on current inputs: ${E(fmtN(t.val))}</span>`:""}</div>`;
 G.uses.forEach(u=>{h+=u.id?`<button class="at-lu" style="left:${u.x}px;top:${u.y}px;width:${u.w}px;height:${u.h}px" data-at-go="${u.id}" title="Open ${E(scrName(u.id))}"><small>Shown on</small><b>${E(trunc(scrName(u.id),34))}</b></button>`:`<div class="at-lu plain" style="left:${u.x}px;top:${u.y}px;width:${u.w}px;height:${u.h}px"><small>Shown on</small><b>${E(trunc(u.name,34))}</b></div>`});
 return h}

/* ----- detail panel ----- */
function suggest(phrase){
 const w=new Set(stems(phrase)),out=[];const idx=fieldIdx();
 idx.ids.forEach((x,key)=>{const fw=stems(x.f.label+" "+x.e.label.replace(/\(.*\)/,""));let n=0;fw.forEach(q=>{if(w.has(q)&&!GEN.has(q))n++});if(n){const s=n/Math.sqrt(fw.length*Math.max(1,w.size));out.push({ref:key,label:x.e.label.replace(/\s*\(.*$/,"")+" · "+x.f.label,s})}});
 return out.sort((a,b)=>b.s-a.s).slice(0,3)}
function lineageDetail(id){
 const t=LIN.trace(id);if(!t)return `<p class="muted">Choose a metric from the list.</p>`;
 const m=t.m,G=buildGraph(t);G.gapList=[...new Set(G.nodes.filter(n=>n.t==="gap").map(n=>n.key))];
 const edges=graphEdges(G,t);LN.G=G;LN.t=t;
 const ents=new Set([...t.srcs.values()].map(s=>s.ent));
 const stClass=t.status==="full"?"good":t.status==="partial"?"warn":"bad",stTxt=t.status==="full"?"Fully traced to fields":t.status==="partial"?"Partly traced":"Not traced yet";
 const lf=A.lfld&&A.lfld.t===id?A.lfld:null;
 const srcRows=[...t.srcs.values()].filter(s=>s.fld);
 const sel=lf||(srcRows[0]?{e:srcRows[0].ent,k:srcRows[0].fld,t:id}:null);
 const imp=sel?LIN.impact(sel.e,sel.k||null):null;
 const M=model();
 const parents=[...LIN.parents(id)];
 let h=`<div class="at-lh"><div class="at-lhm"><div class="eyebrow">Metric · owner ${E(m.owner||"")}</div><h3>${E(m.n)}</h3><div class="formula">${E(m.f)}</div></div>
  <div class="at-lha"><span class="pill ${stClass}">${E(stTxt)} · ${t.pct}%</span><span class="pill mute">Confidence ${t.conf}%</span>${fchip(id)}</div></div>
  <div class="row at-lbtns"><button class="btn primary" data-at-trace="${id}">Trace on the diagram</button><button class="btn" data-go="metrics:${id}">Open in Metrics</button>${LN.hist.length?`<button class="btn quiet" data-at-lback="1">Back to ${E(trunc(METRICS[LN.hist[LN.hist.length-1]].n,26))}</button>`:""}</div>
  <div class="statrow at-ss"><div class="stat"><small>Source fields</small><span class="num" data-role="metric">${srcRows.length}</span><em>in ${ents.size} entit${ents.size===1?"y":"ies"}</em></div><div class="stat"><small>Nested metrics</small><span class="num" data-role="metric">${t.st.nested}</span><em>up to 3 levels</em></div><div class="stat"><small>Needs mapping</small><span class="num" data-role="metric">${G.gapList.length}</span><em>${t.st.ghost+t.st.weak?(t.st.ghost+t.st.weak)+" weak or planned":"none weak"}</em></div><div class="stat"><small>Shown on</small><span class="num" data-role="metric">${(m.use||[]).length}</span><em>screens</em></div></div>
  <div class="at-legend">${legend([["Oukala owns the field",AUTHC.platform],["External system owns it",AUTHC.external],["Shared, newest wins",AUTHC.shared]])}<span class="muted small">Percent on a field is how sure the match is. Dashed boxes need a mapping. A circle is a step of the calculation.</span></div>
  <div class="at-vpbox at-lbox"><div class="at-vp at-lvp" data-at-lvp="1" style="height:${Math.min(680,Math.max(300,Math.round(G.H*.7)+60))}px" tabindex="0" role="application" aria-label="Calculation of ${E(m.n)}. Drag to pan, plus and minus to zoom."><div class="at-world" data-at-world="ln" style="width:${G.W}px;height:${G.H}px">${edgeSvg(G,edges)}${nodeHTML(G,t)}</div></div>
   <div class="at-tools" role="group" aria-label="Zoom"><button class="btn quiet" data-at-lz="in" aria-label="Zoom in">+</button><button class="btn quiet" data-at-lz="out" aria-label="Zoom out">−</button><button class="btn quiet" data-at-lz="fit">Fit all</button><button class="btn quiet" data-at-lz="reset">Fit width</button><span class="muted small" data-at-zl>100%</span></div></div>`;
 /* needs mapping */
 const gaps=[...new Map(t.gaps.map(g=>[g.key,g])).values()];
 const mine=Object.keys(A.ovr).filter(k=>k.indexOf(id+"|")===0);
 h+=`<section class="card glass at-lcard"><div class="cardhead"><div><h3>Needs mapping (${gaps.length})</h3><span class="muted small" data-role="story">Terms in the formula that are not yet tied to a field. A mapping you save here is applied to this metric and recorded in the audit log.</span></div>${aiChip({model:"Claude Sonnet",conf:.74,title:"Suggested mappings",note:"Suggestions compare the wording of the term with registry field names. A person confirms each one before it counts as traced.",src:["Formula wording","Registry field names"],guards:["Nothing is saved until you confirm"]})}</div>
  ${gaps.length?`<ul class="at-ul at-gul">${gaps.map((g,i)=>{const sg=suggest(g.text);return `<li><div class="at-gt2"><b>${E(trunc(g.text,90))}</b><div class="at-chips">${sg.map(s=>`<button class="chip at-chip" data-at-lapply="${E(g.key)}|${E(s.ref)}" title="Save this mapping">Map to ${E(trunc(s.label,36))}</button>`).join("")||'<span class="muted small">No close field name. Pick one by hand.</span>'}</div></div><button class="btn" data-at-lmap="${G.gapList.indexOf(g.key)}">Map this</button></li>`}).join("")}</ul>`:`<p class="muted">Every term in this formula is tied to a field, a nested metric or a policy setting.</p>`}
  ${mine.length?`<h4 class="at-h4">Mappings you added</h4><ul class="at-ul">${mine.map(k=>`<li><span>${E(k.split("|")[1])} → <b>${E(A.ovr[k].ref.replace("."," · "))}</b><small class="muted"> ${E(A.ovr[k].by)}</small></span><button class="btn quiet" data-at-lunmap="${E(k)}">Undo</button></li>`).join("")}</ul>`:""}</section>`;
 /* what if */
 h+=`<section class="card glass at-lcard"><div class="cardhead"><div><h3>What if a source field changes</h3><span class="muted small" data-role="story">Pick a field to see every metric that reads it, the metrics built on those, and the screens that show them.</span></div></div>
  ${srcRows.length?`<div class="at-chips">${srcRows.map(s=>{const e=M.ent.get(s.ent),f=e&&e.fields.find(x=>x.k===s.fld),on=sel&&sel.e===s.ent&&sel.k===s.fld;return `<button class="chip at-chip" aria-pressed="${!!on}" data-at-lsrc="${s.ent}|${s.fld}">${E(trunc((e?e.label.replace(/\s*\(.*$/,""):s.ent)+" · "+(f?f.label:s.fld),40))}</button>`}).join("")}</div>`:`<p class="muted">No source field yet. Map a term first.</p>`}
  ${imp?`<div class="at-imp"><div><h4 class="at-h4">Metrics affected (${imp.all.length})</h4>${imp.all.length?`<ul class="at-ul">${imp.all.slice(0,10).map(mid=>{const mm=METRICS[mid],s=mstat(mm);return `<li><button class="at-lnk" data-at-lopen="${mid}">${E(trunc(mm.n,40))}</button><span class="pill ${stCls(s)}">${E(mfmt(mm))}</span></li>`}).join("")}</ul>${imp.all.length>10?`<p class="muted small">and ${imp.all.length-10} more.</p>`:""}`:`<p class="muted small">Only this metric.</p>`}</div>
   <div><h4 class="at-h4">Screens affected (${imp.screens.length})</h4>${imp.screens.length?`<ul class="at-ul">${imp.screens.slice(0,10).map(s=>`<li>${s.id?`<button class="at-lnk" data-at-go="${s.id}">${E(trunc(s.name,36))}</button>`:`<span>${E(trunc(s.name,36))}</span>`}<span class="muted small">${s.metrics.length} metric${s.metrics.length===1?"":"s"}</span></li>`).join("")}</ul>`:`<p class="muted small">None.</p>`}</div></div>`:""}
  ${parents.length?`<p class="small muted">Used inside ${parents.length} other metric${parents.length===1?"":"s"}: ${parents.slice(0,5).map(p=>`<button class="at-lnk" data-at-lopen="${p}">${E(trunc(METRICS[p].n,26))}</button>`).join(", ")}${parents.length>5?" and more":""}.</p>`:""}</section>`;
 return h}

function lineagePane(){
 const st=LIN.stats();
 return `<div class="at-lin" data-at-lin-root><section class="card glass at-lside"><div class="cardhead"><div><h3>${st.n} metrics</h3><span class="muted small" data-role="story">${st.full} fully traced to fields, ${st.part} partly, ${st.none} not yet. Select a row to see how that metric is calculated.</span></div></div>${listHTML()}</section><div class="at-ldet" data-at-ldet>${lineageDetail(A.metric)}</div></div>`}
function fitLn(mode){const v=lnEl();if(!v||!LN.G)return;const s=vsize(v),G=LN.G;
 if(mode==="all"){const k=clamp(Math.min((s.w-32)/G.W,(s.h-32)/G.H),.2,1);LN.cam={k,x:(s.w-G.W*k)/2,y:(s.h-G.H*k)/2}}
 else{const k=clamp((s.w-40)/G.W,.55,1);LN.cam={k,x:20,y:14}}
 applyLn()}
function applyLn(){const v=lnEl(),w=document.querySelector('[data-at-world="ln"]');if(!v||!w||!LN.cam)return;const c=LN.cam;w.style.transform=`translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px) scale(${c.k.toFixed(4)})`;const z=v.parentElement.querySelector("[data-at-zl]");if(z)z.textContent=Math.round(c.k*100)+"%"}
function refreshLineage(keepCam){const host=document.querySelector("[data-at-ldet]");if(!host)return;const had=LN.cam;host.innerHTML=lineageDetail(A.metric);if(keepCam&&had){LN.cam=had;applyLn()}else fitLn("width");
 if(typeof btRefresh==="function"&&document.querySelector('[data-bt="at_lin"]'))btRefresh("at_lin")}
function openLineage(mid,o){o=o||{};if(!METRICS[mid])return;if(o.push!==false&&A.metric&&A.metric!==mid&&o.hist)LN.hist.push(A.metric);A.metric=mid;if(!o.hist)LN.hist=[];
 audit("Opened a metric calculation",METRICS[mid].n);
 if(S.screen==="plat_data"&&S.v.atlas===1&&document.querySelector("[data-at-ldet]")){refreshLineage();return}
 S.v.atlas=1;if(S.screen!=="plat_data")go("plat_data");else render()}
function mountLn(){if(!lnEl())return;fitLn("width")}

/* Map this */
function mapForm(mid,gapIdx,preset){
 const t=LIN.trace(mid),gaps=[...new Map(t.gaps.map(g=>[g.key,g])).values()];
 const g=typeof gapIdx==="number"?gaps.find(x=>x.key===LN.G.gapList[gapIdx]):gaps[0];
 const term=g?g.text:"";
 const opts=PLAT.fieldsAll().map(f=>[f.ent+"."+f.k,f.entLabel.replace(/\s*\(.*$/,"")+" · "+f.label]);
 openForm({id:"atlas_map",title:"Map a term to a field",story:`The formula for <b>${E(METRICS[mid].n)}</b> uses a term the registry cannot match yet. Pick the field that holds it. The mapping applies to this metric, the lineage updates at once, and the change is written to the audit log.`,submit:"Save mapping",
  fields:[{section:"The term"},{k:"term",label:"Term in the formula",type:"text",req:true,help:"Use the words as they appear in the formula."},
   {section:"Where it lives"},{k:"ref",label:"Entity and field",type:"select",req:true,ph:"Choose a field",opts,ai:{label:"Suggest",fn:v=>{const s=suggest(v.term||term)[0];return s?s.ref:null}},help:"579 registry fields are listed by entity."},
   {k:"note",label:"Why this field",type:"longtext",ph:"One sentence for the next reader",wide:true}],
  defaults:{term,ref:preset||""},
  live:v=>{if(!v.ref)return `<div class="story">After saving, this metric is re-traced and the percent traced updates.</div>`;const [en,fk]=String(v.ref).split(".");const f=PLAT.fieldsAll().find(x=>x.ent===en&&x.k===fk);return f?`<div class="story"><b>${E(f.entLabel)}</b> field <b>${E(f.label)}</b> is ${E(AUTHN[f.auth].toLowerCase())}, freshness ${E(f.fresh)}, class ${E(f.cls)}. It will count as a traced source for this metric.</div>`:""},
  onSubmit:v=>{A.ovr[mid+"|"+normP(v.term)]={ref:v.ref,by:"Omar Hamid",at:new Date().toISOString().slice(0,10),note:v.note||""};LIN.bump();_six=null;
   setTimeout(()=>{refreshLineage(true);if(vpEl()){drawAll()}},0);return{toast:"Mapped “"+trunc(v.term,30)+"” to "+v.ref.replace("."," · "),audit:METRICS[mid].n+": "+v.term+" → "+v.ref}}})}

document.addEventListener("click",e=>{
 const t=e.target.closest&&e.target.closest("[data-at-lsrc],[data-at-lopen],[data-at-lmap],[data-at-lapply],[data-at-lunmap],[data-at-lback],[data-at-viewent]");if(!t)return;const d=t.dataset;
 if(d.atLsrc!==undefined){const [en,k]=d.atLsrc.split("|");A.lfld={e:en,k:k||null,t:A.metric};refreshLineage(true);return}
 if(d.atLopen!==undefined){openLineage(d.atLopen,{hist:true});return}
 if(d.atLback!==undefined){const p=LN.hist.pop();if(p){A.metric=p;refreshLineage()}return}
 if(d.atLmap!==undefined){mapForm(A.metric,+d.atLmap);return}
 if(d.atLapply!==undefined){const i=d.atLapply.indexOf("|"),key=d.atLapply.slice(0,i),ref=d.atLapply.slice(i+1);A.ovr[A.metric+"|"+key]={ref,by:"Omar Hamid",at:new Date().toISOString().slice(0,10),note:"Accepted the suggested field"};LIN.bump();_six=null;audit("Mapped a metric term",METRICS[A.metric].n+": "+key+" → "+ref);toast("Mapped to "+ref.replace("."," · "),"good");refreshLineage(true);return}
 if(d.atLunmap!==undefined){delete A.ovr[d.atLunmap];LIN.bump();_six=null;audit("Removed a metric mapping",d.atLunmap);toast("Mapping removed","info");refreshLineage(true);return}
 if(d.atViewent!==undefined){ATLAS.focus(d.atViewent)}});

/* user took control of the camera: stop auto framing and fade the hint */
const taken=e=>{const v=e.target.closest&&e.target.closest(".at-vpbox");if(v){v.classList.add("touched");A.auto=false}};
document.addEventListener("pointerdown",taken,true);document.addEventListener("wheel",taken,{capture:true,passive:true});
document.addEventListener("keydown",e=>{if(e.target.closest&&e.target.closest("[data-at-vp]")&&/^(Arrow|\+|-|=|0)/.test(e.key))taken(e)},true);
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-at-ent],[data-at-dom-go],[data-at-z],[data-at-fly],[data-at-pick],[data-at-xp],[data-at-expdom],[data-at-bc]"))A.auto=false},true);
window.addEventListener("resize",()=>{if(S.screen==="plat_data"&&vpEl())refit()});
/* ----- calculation canvas: pan and zoom ----- */
let LDR=null;
document.addEventListener("pointerdown",e=>{const v=e.target.closest&&e.target.closest("[data-at-lvp]");if(!v||e.button>0||!LN.cam)return;if(e.target.closest("button,a,input,select"))return;LDR={id:e.pointerId,sx:e.clientX,sy:e.clientY,cx:LN.cam.x,cy:LN.cam.y,v,moved:false}});
document.addEventListener("pointermove",e=>{if(!LDR||e.pointerId!==LDR.id)return;const dx=e.clientX-LDR.sx,dy=e.clientY-LDR.sy;if(!LDR.moved&&Math.hypot(dx,dy)>5){LDR.moved=true;LDR.v.classList.add("pan")}if(LDR.moved){LN.cam.x=LDR.cx+dx;LN.cam.y=LDR.cy+dy;applyLn()}});
const lUp=e=>{if(LDR&&e.pointerId===LDR.id){LDR.v.classList.remove("pan");LDR=null}};
document.addEventListener("pointerup",lUp);document.addEventListener("pointercancel",lUp);
function lnZoom(f,cx,cy){const v=lnEl();if(!v||!LN.cam)return;const r=v.getBoundingClientRect(),px=(cx==null?r.left+r.width/2:cx)-r.left,py=(cy==null?r.top+r.height/2:cy)-r.top,c=LN.cam,k=clamp(c.k*f,.2,2.2),q=k/c.k;LN.cam={k,x:px-(px-c.x)*q,y:py-(py-c.y)*q};applyLn()}
document.addEventListener("wheel",e=>{const v=e.target.closest&&e.target.closest("[data-at-lvp]");if(!v||!LN.cam)return;if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();lnZoom(Math.exp(-e.deltaY*(e.deltaMode===1?.06:.0024)),e.clientX,e.clientY)},{passive:false});
document.addEventListener("keydown",e=>{const v=e.target.closest&&e.target.closest("[data-at-lvp]");if(!v||!LN.cam||e.target!==v)return;
 if(e.key==="+"||e.key==="="){e.preventDefault();lnZoom(1.25)}else if(e.key==="-"||e.key==="_"){e.preventDefault();lnZoom(.8)}else if(e.key==="0"){e.preventDefault();fitLn("all")}
 else if(/^Arrow/.test(e.key)){e.preventDefault();const d=80;if(e.key==="ArrowLeft")LN.cam.x+=d;if(e.key==="ArrowRight")LN.cam.x-=d;if(e.key==="ArrowUp")LN.cam.y+=d;if(e.key==="ArrowDown")LN.cam.y-=d;applyLn()}});
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-at-lz]");if(!t)return;const z=t.dataset.atLz;if(z==="in")lnZoom(1.3);else if(z==="out")lnZoom(1/1.3);else if(z==="fit")fitLn("all");else fitLn("width")});

/* ----- domain map ----- */
const DSH={service:"Service",ops:"Operations",cmdb:"Config",agree:"Agreements",portfolio:"Portfolio",agile:"Agile",people:"People",fin:"Finance",money:"Money",know:"Knowledge",gov:"Governance",plat:"Platform",planned:"Planned"};
function domainPane(){
 const M=model(),doms=Object.keys(DC).filter(d=>M.byDom(d).length||d==="planned");
 const cnt=(a,b)=>(M.pair[a+"|"+b]||[]).length;let mx=1;doms.forEach(a=>doms.forEach(b=>{if(a!==b)mx=Math.max(mx,cnt(a,b))}));
 const sel=A.pair?A.pair.split("|"):null;
 const cross=M.edges.filter(e=>e.cross).length;
 const out={},inn={};doms.forEach(d=>{out[d]=0;inn[d]=0});M.edges.forEach(e=>{if(e.cross){out[M.ent.get(e.from).domain]++;inn[M.ent.get(e.to).domain]++}});
 let h=`<div class="at-dm"><section class="card glass"><div class="cardhead"><div><h3>Which domains point at which</h3><span class="muted small" data-role="story">${cross} of ${M.edges.length} references leave their own domain. Rows are the table that holds the reference, columns are the table it points to. Select a cell to list the references.</span></div></div>
 <div class="at-lgx">${legend([["Few references",COVC[1]],["Some",COVC[2]],["Many",COVC[3]]])}<span class="muted small">The diagonal shows references inside one domain.</span></div>
 <div class="tscroll"><table class="at-mt"><thead><tr><th scope="col"><span class="sr">From domain</span></th>${doms.map(d=>`<th scope="col"><i class="at-dot" style="background:var(${DC[d]})"></i><span class="at-mth">${E(DSH[d]||d)}</span></th>`).join("")}<th scope="col" class="num">Out</th></tr></thead><tbody>
 ${doms.map(a=>`<tr><th scope="row"><i class="at-dot" style="background:var(${DC[a]})"></i>${E(dName(a))}</th>${doms.map(b=>{const n=cnt(a,b),lv=n?Math.min(3,1+Math.floor(n/mx*2.99)):0,on=sel&&sel[0]===a&&sel[1]===b;return `<td>${n?`<button class="at-xc at-lv${lv}${a===b?" self":""}" aria-pressed="${!!on}" data-at-pair="${a}|${b}" aria-label="${n} references from ${E(dName(a))} to ${E(dName(b))}">${n}</button>`:`<span class="at-xc0" aria-hidden="true">0</span>`}</td>`}).join("")}<td class="num">${out[a]}</td></tr>`).join("")}
 <tr class="at-mtf"><th scope="row">In</th>${doms.map(d=>`<td class="num">${inn[d]}</td>`).join("")}<td></td></tr></tbody></table></div></section>`;
 if(sel){const es=(M.pair[A.pair]||[]);
  h+=`<section class="card glass"><div class="cardhead"><div><h3>${E(dName(sel[0]))} to ${E(dName(sel[1]))}: ${es.length} reference${es.length===1?"":"s"}</h3><span class="muted small" data-role="story">Each row is one table that holds a reference field and the table it points to.</span></div><button class="btn primary" data-at-pairgo="${A.pair}">Show on the diagram</button></div>
  <ul class="at-ul at-pl">${es.slice(0,40).map(x=>{const a=M.ent.get(x.from),b=M.ent.get(x.to);return `<li><button class="at-lnk" data-at-focus="${x.from}">${E(a.label.replace(/\s*\(.*$/,""))}</button><span class="muted">${E(x.fields.join(", ")||"reference")}</span><span class="at-arrow" aria-hidden="true">→</span><button class="at-lnk" data-at-focus="${x.to}">${E(b.label.replace(/\s*\(.*$/,""))}</button>${x.ghost?`<span class="pill mute">planned target</span>`:""}</li>`}).join("")}</ul>${es.length>40?`<p class="muted small">And ${es.length-40} more. Show them on the diagram.</p>`:""}</section>`}
 else h+=`<section class="card glass"><p class="muted">Select a cell above to see the references behind it.</p></section>`;
 return h+`</div>`}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-at-pair],[data-at-pairgo],[data-at-focus]");if(!t)return;const d=t.dataset;
 if(d.atPair!==undefined){A.pair=A.pair===d.atPair?null:d.atPair;render();return}
 if(d.atPairgo!==undefined){ATLAS.pair(d.atPairgo);return}
 if(d.atFocus!==undefined)ATLAS.focus(d.atFocus)});

/* ----- tables and checks: the previous screen, preserved ----- */
function oldPane(){
 let inner="";
 try{if(PREV){const doc=new DOMParser().parseFromString(PREV(),"text/html"),v=doc.querySelector('.views[data-views="map_d"]');if(v)inner=v.outerHTML}}catch(x){}
 if(!inner)return `<section class="card glass"><p class="muted">The earlier tables and model checks open on their own screen.</p><button class="btn" data-go="plat_data_old">Open Data tables and model checks</button></section>`;
 return `<div class="at-old"><p class="muted small">The earlier screen, unchanged: an overview of tables, the older diagram and the model integrity checks. <button class="at-lnk" data-go="plat_data_old">Open it on its own screen</button></p>${inner}</div>`}

/* ----- metrics that describe the atlas itself ----- */
function mkMetric(id,o){if(!METRICS[id])METRICS[id]=o}
mkMetric("m_atlas_trace",{n:"Metrics fully traced to fields",f:"Metrics whose every input resolves to a registry field, a nested metric or a policy setting ÷ all metrics",u:"%",cur:36,tgt:60,badAt:30,dir:"max",max:100,tr:[18,22,25,28,31,33,35,36],owner:"Data architect",use:["Master data model"],rem:{kind:"agent",ref:"RB-LIN",title:"Map metric terms to fields",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Suggests a field for each formula term that has no match"}});
mkMetric("m_atlas_conf",{n:"Lineage match confidence",f:"Average confidence of the field matches behind all traced metrics",u:"%",cur:72,tgt:80,badAt:60,dir:"max",max:100,tr:[60,63,66,68,69,70,71,72],owner:"Data architect",use:["Master data model"],rem:{kind:"agent",ref:"RB-LIN",title:"Review weak matches",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Lists matches below 60 percent confidence"}});
mkMetric("m_atlas_gaps",{n:"Formula terms without a field",f:"Terms in metric formulas that match no registry field and no nested metric",u:"",cur:158,tgt:80,badAt:150,dir:"min",max:200,tr:[190,184,176,170,166,163,160,158],owner:"Data architect",use:["Master data model"],rem:{kind:"agent",ref:"RB-LIN",title:"Map metric terms to fields",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Suggests a field for each unmapped term"}});
function syncMetrics(st){st=st||LIN.stats();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(0,-1).concat([v])};set("m_atlas_trace",st.pct);set("m_atlas_conf",st.conf);set("m_atlas_gaps",st.gaps)}

/* ----- the screen ----- */
const TABS=["Diagram","Metric lineage","Domain map","Coverage","Module matrix","Tables and checks"];
function atlasScreen(){
 const M=model(),st=LIN.stats(),ps=PLAT.stats();syncMetrics(st);
 const cur=S.v.atlas||0;
 const CV=window.COVER;
 const panes=[cur===0?diagramPane():"",cur===1?lineagePane():"",cur===2?domainPane():"",cur===3?(CV?CV.coverPane():"<p class='muted'>The coverage module is not loaded.</p>"):"",cur===4?(CV?CV.matrixPane():""):"",cur===5?oldPane():""].map((p,i)=>p||`<p class="muted">Opening ${TABS[i]}</p>`);
 const cs=CV&&CV.summary?CV.summary():null;
 const covStory=cs?` Does it cover every module? Now <b data-role="metric">${cs.after.modFull}</b> of <b data-role="metric">${cs.modTotal}</b> (was <b data-role="metric">${cs.before.modFull}</b>), but <b data-role="metric">${cs.proposed}</b> proposed entities wait for your approval and <b data-role="metric">${cs.gapsOpen}</b> gaps remain.`:"";
 return `<div class="screen at-screen">${hero("Data atlas","Master data model, drawn, traced and audited",`<b data-role="metric">${N0(M.list.filter(e=>!e.ghost).length)}</b> tables and <b data-role="metric">${N0(ps.nf)}</b> fields in <b data-role="metric">${new Set(M.list.filter(e=>!e.ghost).map(e=>e.domain)).size}</b> domains, with <b data-role="metric">${M.edges.length}</b> references between them. <b data-role="metric">${st.full}</b> of <b data-role="metric">${st.n}</b> metrics trace all the way to fields.${covStory}`,`<div class="row">${fchip("m_atlas_trace")}${window.METRICS&&METRICS.m_cov_module?fchip("m_cov_module")+fchip("m_cov_flow"):""}${fchip("m_data_ref")}<button class="btn primary" data-cov-open>See what is missing</button>${typeof stdChip==="function"?stdChip("dmbok"):""}</div>`)}${lensNote()}${views("atlas",TABS,panes)}${procCard("plat_data")}</div>`}
REG("plat_data","Master data model","platform","M4 5h7v5H4zM13 5h7v5h-7zM8 14h8v5H8zM7.5 10v4M16.5 10v4",atlasScreen);
if(PREV)REG("plat_data_old","Data tables and model checks","platform","M4 6h16M4 12h16M4 18h10",()=>PREV());
document.addEventListener("change",e=>{const t=e.target.closest&&e.target.closest("[data-vw^='atlas:']");if(t)setTimeout(()=>{if(S.screen==="plat_data")render()},0)});
const _ca=window.coreAfter;
window.coreAfter=function(){if(_ca)_ca.apply(this,arguments);
 if(S.screen!=="plat_data")return;
 if(A.pend&&A.pend.k==="pair"){const pr=A.pend.pair.split("|"),M=model();A.pend=null;const ids=new Set();(M.pair[pr.join("|")]||[]).forEach(x=>{ids.add(x.from);ids.add(x.to)});mount();LAY=layout(M);const r=unionRect([...ids].map(entRect));if(r)A.cam=camFor({x:r.x-30,y:r.y-30,w:r.w+60,h:r.h+60},{kmax:1.1,pad:30});applyCam();return}
 if((S.v.atlas||0)===0)mount();else if(S.v.atlas===1)mountLn()};

/* ----- public API ----- */
const _ATL={
 lin:LIN,
 focus(id){if(!model().ent.get(id))return;A.sel=id;A.fld=null;A.trace=null;A.dom=null;A.pend={k:"ent",id};S.v.atlas=0;A.itab="fields";audit("Opened a table on the data diagram",id);if(S.screen==="plat_data")render();else go("plat_data")},
 traceMetric(mid){if(!METRICS[mid])return;S.v.atlas=0;if(S.screen!=="plat_data")go("plat_data");traceOnDiagram(mid)},
 lineage(mid){openLineage(mid)},
 pair(k){A.pair=k;A.pend={k:"pair",pair:k};A.sel=null;A.dom=null;A.trace=null;S.v.atlas=0;audit("Showed domain references on the data diagram",k);if(S.screen==="plat_data")render();else go("plat_data")}};
_ATL.addEntity=function(d){return window.COVER&&COVER.addEntity?COVER.addEntity(d):{ok:false,id:d&&d.id,duplicates:[],warnings:["The coverage module (mod_plat_cover) is not loaded in this build."]}};
_ATL.coverage=function(o){return window.COVER&&COVER.coverage?COVER.coverage(o):{modules:[],stats:{}}};
_ATL._dmv=()=>DMV;_ATL.color=d=>DC[d];_ATL.bump=function(){DMV++;LIN.bump();if(window.PLAT&&PLAT.refresh)PLAT.refresh();if(S.screen==="plat_data")render()};
window.ATLAS=_ATL;window.LIN=LIN;
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-atlas-go]");if(!t)return;const v=t.dataset.atlasGo;closeDrawer();if(v.indexOf("m_")===0)_ATL.lineage(v);else _ATL.focus(v)});
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-er-show]");if(!t||!model().ent.get(t.dataset.erShow))return;e.stopImmediatePropagation();e.preventDefault();closeDrawer();_ATL.focus(t.dataset.erShow)},true);

/* registry entity drawer: add a link to the diagram */
function hookDrawer(){const dr=document.getElementById("drawer");if(!dr||!window.MutationObserver)return;
 new MutationObserver(()=>{if(dr.querySelector("[data-atlas-go]"))return;const h=dr.querySelector("h2"),c=dr.querySelector("p code");if(!h||!c)return;const id=c.textContent.trim();if(!model().ent.get(id))return;
  const p=c.closest("p");const b=document.createElement("button");b.className="btn";b.setAttribute("data-atlas-go",id);b.textContent="View on the data diagram";b.style.margin="4px 0 8px";p.insertAdjacentElement("afterend",b)}).observe(dr,{childList:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hookDrawer);else hookDrawer();

/* search and chat */
SEARCHX.push(()=>LIN.ids().map(id=>{const m=METRICS[id],t=LIN.trace(id);return{g:"Metric calculations",t:m.n,m:"Traced "+t.pct+"% to fields · "+m.f.slice(0,70),c:"--p4",f:()=>_ATL.lineage(id),k:id+" "+m.f+" lineage formula calculated"}}));
SEARCHX.push(()=>model().list.filter(e=>!e.ghost).map(e=>({g:"Data diagram tables",t:e.label,m:dName(e.domain)+" · "+e.nf+" fields · feeds "+LIN.feeds(e.id).length+" metrics",c:"--p4",f:()=>_ATL.focus(e.id),k:e.id+" "+e.fields.map(f=>f.k).join(" ")+" data model diagram"})));
ASKX.unshift(q=>{const t=q.toLowerCase();
 if(/(show|open).*(data model|data diagram|er diagram|data atlas)|master data model/.test(t)){S.v.atlas=0;go("plat_data");say(q,{t:"Here is the master data model as a diagram. Drag to pan, zoom with Ctrl and scroll, and select a table for its fields, connections and metrics.",steps:["Opened the data diagram"]});return true}
 let m=/how (?:is|are|does) (.+?)(?: calculated| computed| worked out| measured| derived)?\??$/.exec(t)||/(?:calculation|lineage|formula) (?:of|for) (.+?)\??$/.exec(t);
 if(m){const w=m[1].replace(/^the /,"").trim();const hit=LIN.ids().find(id=>METRICS[id].n.toLowerCase()===w)||LIN.ids().find(id=>METRICS[id].n.toLowerCase().indexOf(w)>=0)||LIN.ids().find(id=>w.length>4&&w.indexOf(METRICS[id].n.toLowerCase())>=0);
  if(hit){const tr=LIN.trace(hit);_ATL.lineage(hit);say(q,{t:"<b>"+E(METRICS[hit].n)+"</b> is "+E(METRICS[hit].f)+". It is traced "+tr.pct+"% to registry fields. I opened the calculation so you can follow each input.",steps:["Opened the metric lineage"]});return true}}
 m=/where (?:is|are) (.+?) (?:used|referenced|read)\??$/.exec(t)||/what (?:uses|reads|depends on) (.+?)\??$/.exec(t);
 if(m){const w=m[1].replace(/^the /,"").trim().replace(/ /g,"_");const M=model();const e=M.list.find(x=>x.id===w||x.label.toLowerCase().replace(/\s*\(.*$/,"")===m[1].trim().toLowerCase());
  if(e){A.itab="used";_ATL.focus(e.id);say(q,{t:"<b>"+E(e.label)+"</b> feeds "+LIN.feeds(e.id).length+" metrics and is referenced by "+e.inn.length+" other tables. I opened it on the data diagram.",steps:["Selected the table on the diagram"]});return true}}
 return false});
})();
