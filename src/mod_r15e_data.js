/* mod_r15e_data.js (Round 15, Agent E). Mandatory reference targets, declared authority and classification,
   metric lineage assistant, KB stub generator, run-budget lines, stale screen names. window.R15E.{refs,lineage,kb,runLines}.
   Applied by mod_zlink boot (phaseC), after zlink's own reference fixes. */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const arr=x=>Array.isArray(x)?x:[];
const lc=s=>String(s==null?"":s).toLowerCase();
const norm=s=>lc(s).replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const toks=s=>norm(s).split(" ").filter(w=>w.length>2);
const uniq=a=>[...new Set(a)];
const TODAY=U.TODAY_ISO;
const R=window.R15E=window.R15E||{};
const RS=S.r15e=S.r15e||{roles:[],bak:{},gate:[],ver:0,applied:{}};
RS.ref=RS.ref||{};RS.kb=RS.kb||{};RS.lin=RS.lin||{};RS.undecl=RS.undecl||{};
R.runLines=R.runLines||[];
/* ---------- 5. reference targets ---------- */
const BYFIELD={assignment_group:"organization_unit",support_group:"organization_unit",managed_by_group:"organization_unit",owned_by:"person",location:"organization_unit",service_owner:"person",team:"organization_unit",cat_item:"catalog_item",po:"purchase_order",
 playbook_clause:"contract_line",wbs_link:"wbs_line",sla_link:"sla_definition",invoice_link:"invoice",child:"config_item",parent:"config_item",root_cause_ci:"config_item",acknowledged_by:"person",marked_by:"person",executor:"person",verified_by:"person",author:"person",requested_by:"person",approved_by:"person",decided_by:"person",changed_by:"person",steward:"person",chair:"person",reviewer:"person",hiring_manager:"person",release_manager:"person",accountable_human:"person",delegated_from:"person",preferred:"person",owner_person:"person",backup_person:"person",accepted_by:"person",by:"person",from_person:"person",to_person:"person",delegate_ref:"person",principal_ref:"person",
 alert:"alert_event",entity:"data_asset",object_id:"data_asset",record_ref:"data_asset",promoted_from:"environment",supersedes:"decision",dept:"cost_center",workflow:"workflow_definition",fulfillment_flow:"workflow_definition",line_id:"fin_funding_line",consumer_id:"application",solution_id:"application",release_train:"organization_unit",sprint:"user_story",epic:"feature",program_increment:"feature",schedule:"maintenance_window",definition:"sla_definition",request:"request_item",agent:"agent_skill",domain_id:"organization_unit",guide_ref:"catalog_item",process_ref:"process_definition",item_ref:"catalog_item",rule_id:"decision_table",requested_for:"person",service:"business_service",ci:"config_item",caller:"person",manager:"person",owner:"person",vendor:"core_company",asset_tag:"asset",rack:"asset",replica_of:"config_item",product_owner:"person",business_capability:"maturity_capability",offering:"service_offering",raid_link:"raid_item",budget_link:"budget_line",project:"project",task:"project_task",contract:"ast_contract",incident:"incident",change:"change_request",problem:"problem_record",invoice:"invoice",policy:"policy",capability:"maturity_capability",objective:"objective",department:"cost_center",cost_center:"cost_center",approver:"person",assignee:"person",sponsor:"person",requester:"person",created_by:"person",assigned_to:"person",opened_by:"person",resolved_by:"person",closed_by:"person"};
const BYPAIR={"alert_event.rule":"alert_rule","runbook_execution.rule":"automation_rule","runbook_execution.alert":"alert_event","delegation.from":"person","delegation.to":"person","perf_feedback.from":"person","perf_feedback.to":"person","cost_allocation.from":"cost_center","cost_allocation.to":"cost_center","assessment.by":"person","approval.delegated_from":"person","decision_test_case.rule_id":"decision_rule","fin_funding_line.line_id":"budget_line","fin_funding_line.consumer_id":"application","fin_mapping_record.line_id":"fin_funding_line","fin_exception.line_id":"fin_funding_line","task_sla.definition":"sla_definition","xla_response.definition":"sla_definition","exception.entity":"data_asset","mapping.entity":"data_asset","sync_exception.entity":"data_asset","debt_item.entity":"data_asset","asset.request":"request_item","user_story.team":"organization_unit","resource_request.team":"organization_unit","person.team":"organization_unit","journey_map.workflow":"workflow_definition"};
function declareRefs(){const T=G(()=>DATAMODEL.tables,{});const ids=new Set(Object.keys(T));let n=0,left=[];
 Object.keys(T).forEach(t=>arr(T[t].fields).forEach(f=>{if(f.type!=="ref"||f.ref)return;const k=lc(f.k);
  let tg=BYPAIR[t+"."+k]||BYFIELD[k]||BYFIELD[k.replace(/_(id|ref)$/,"")];
  if(!tg){const m=ids.has(k.replace(/_(id|ref)$/,""))?k.replace(/_(id|ref)$/,""):null;tg=m}
  if(!tg&&/_by$|_user$|^by$/.test(k))tg="person";
  if(tg&&ids.has(tg)){f.ref=tg;f.refBy="Reference-target assistant, steward to confirm";RS.ref[t+"."+f.k]={to:tg,at:TODAY,state:"proposed"};n++}
  else if(!tg&&ids.has(t.indexOf("config_item")===0?"config_item":"data_asset")){tg=t.indexOf("config_item")===0?"config_item":"data_asset";f.ref=tg;f.refBy="Polymorphic target declared, steward to narrow";RS.ref[t+"."+f.k]={to:tg,at:TODAY,state:"polymorphic"};n++}
  else left.push(t+"."+f.k)}));
 G(()=>PLAT.refresh());return {n,left}}
function refViolations(){const T=G(()=>DATAMODEL.tables,{});const o=[];Object.keys(T).forEach(t=>arr(T[t].fields).forEach(f=>{if(f.type==="ref"&&!f.ref)o.push(t+"."+f.k)}));return o}
/* mandatory: registering a reference field without a target is repaired when a rule matches, and recorded as a violation when not */
(function(){const D=window.DATAMODEL;if(!D||D.__r15e)return;D.__r15e=1;const reg=D.register;
 D.register=function(t,def){const r=reg.apply(this,arguments);try{const v=refViolations().filter(x=>x.indexOf(t+".")===0);if(v.length){const x=declareRefs();RS.refLast={table:t,repaired:x.n,left:x.left.filter(y=>y.indexOf(t+".")===0)};if(RS.refLast.left.length)console.warn("DATAMODEL.register("+t+"): reference fields with no target: "+RS.refLast.left.join(", "))}}catch(e){}return r}})();
/* ---------- declared authority and classification ---------- */
function declareFields(){const fa=G(()=>PLAT.fieldsAll(),[]).filter(f=>f.basis==="default");const T=G(()=>DATAMODEL.tables,{});let n=0;const ents=new Set();
 fa.forEach(m=>{const t=T[m.ent];if(!t)return;const f=arr(t.fields).find(x=>x.k===m.k);if(!f||f.authority||f.classification)return;const k=lc(m.k);
  let cls="internal";if(/email|phone|birth|home|address/.test(k))cls="personal";else if(/_by$|owner|assigned|caller|requested_for|manager|author|approver|reviewer|person|steward|chair|decided|accepted/.test(k))cls="personal";else if(/amount|cost|price|budget|rate|salary|spend|forecast|balance|funding|paid|appr|comm|act\b/.test(k))cls="confidential";
  let auth="platform";if(/^t[1-9]$|discovered|uptime|ip|os|serial|cpu|ram|disk|firmware/.test(k)&&m.ent.indexOf("cmdb")===0)auth="external";
  f.authority=auth;f.classification=cls;f.why="Declared by the metadata assistant from the field name; steward to confirm";RS.undecl[m.ent+"."+m.k]={auth,cls,at:TODAY};ents.add(m.ent);n++});
 G(()=>PLAT.refresh());return {n,ents:ents.size}}
/* ---------- 6. metric lineage assistant ---------- */
const GAPW=new Set(["total","rate","count","days","hours","share","average","number","percent","per","of","and","the","with","by","for","human","agent","agents","open","closed","new","active","median","avg","time","overrides","spend"]);
let _fi=null;
function fieldIndex(){if(_fi)return _fi;_fi=[];G(()=>PLAT.entities(),[]).forEach(e=>{if(e.proposed)return;const he=new Set(toks(e.label+" "+e.id));arr(e.fields).forEach(f=>_fi.push({e:e.id,k:f.k,he,hf:new Set(toks(f.label+" "+f.k))}))});return _fi}
function bestField(phrase,extra){const w=toks(phrase).filter(x=>!GAPW.has(x));if(!w.length)return null;let best=null,bs=0,tie=false;
 fieldIndex().forEach(f=>{let c=0;w.forEach(x=>{if(f.hf.has(x))c+=1;else if(f.he.has(x))c+=.5;else if(extra&&extra.has(x))c+=.25});const s=c/w.length;if(s>bs+1e-9){bs=s;best=[f.e,f.k];tie=false}else if(Math.abs(s-bs)<1e-9&&best&&best[0]!==f.e)tie=true});
 return best?{ref:best[0]+"."+best[1],conf:Math.round(Math.min(.95,bs)*100),tie}:null}
function runLineage(){const A=S.atlas;if(!A||!A.ovr||!window.LIN)return {n:0,left:0};let n=0;
 G(()=>LIN.all(),[]).filter(t=>t.status==="none").forEach(t=>{const m=t.m||METRICS[t.id]||{};const extra=new Set(toks((m.n||"")+" "+(m.owner||"")+" "+arr(m.use).join(" ")));let got=0;const cand=[];
  arr(t.gaps).forEach(g=>{const key=t.id+"|"+norm(g.phrase);if(A.ovr[key]){got++;return}const b=bestField(g.phrase,extra);if(b&&b.conf>=50)cand.push({key,g,b})});
  cand.forEach(c=>{if(c.b.tie&&c.b.conf<70)return;A.ovr[c.key]={ref:c.b.ref,by:"Lineage assistant (proposed, steward to confirm)",at:TODAY,note:"Term match, confidence "+c.b.conf+"%"};RS.lin[c.key]={metric:t.id,phrase:c.g.phrase,ref:c.b.ref,conf:c.b.conf,state:"proposed",at:TODAY};got++;n++});
  if(!got){const nm=bestField((m.n||"")+" "+String(m.f||""),extra);const g0=arr(t.gaps)[0];if(nm&&g0&&nm.conf>=34){const key=t.id+"|"+norm(g0.phrase);A.ovr[key]={ref:nm.ref,by:"Lineage assistant (proposed, low confidence)",at:TODAY,note:"Closest field to the metric name, confidence "+nm.conf+"%"};RS.lin[key]={metric:t.id,phrase:g0.phrase,ref:nm.ref,conf:nm.conf,state:"proposed",at:TODAY};n++}}});
 if(n)G(()=>LIN.bump());const left=G(()=>LIN.all(),[]).filter(t=>t.status==="none").length;return {n,left}}
function lineAccept(key){const l=RS.lin[key];if(!l)return;l.state="accepted";const o=S.atlas.ovr[key];if(o){o.by="Casey Rowan (accepted proposal)"}audit("Lineage accepted",l.metric+": "+l.phrase+" to "+l.ref);toast("Mapping accepted","good");render()}
function lineReject(key){const l=RS.lin[key];if(!l)return;delete S.atlas.ovr[key];delete RS.lin[key];G(()=>LIN.bump());audit("Lineage rejected",key);toast("Mapping removed","info");render()}
function traceLine(id){const t=G(()=>LIN.trace(id),null);if(!t)return "";const ent=G(()=>[...(t.srcs instanceof Map?t.srcs.values():Object.values(t.srcs||{}))],[]);const prop=Object.keys(RS.lin).filter(k=>k.indexOf(id+"|")===0&&RS.lin[k].state==="proposed").length;
 return `<div class="r15-lin small"><b>Lineage</b> ${t.pct==null?"":t.pct+"% of terms traced"}${ent.length?" · "+ent.slice(0,4).map(s=>esc(s.ent+"."+s.fld)).join(", ")+(ent.length>4?" +"+(ent.length-4):""):" · not traced"}${prop?` · <span class="pill warn">${prop} proposed</span>`:""}</div>`}
(function(){const mb=window.metricBody;if(typeof mb!=="function"||mb.__r15e)return;const w=function(id){let h=mb.apply(this,arguments);try{const m=typeof window.metricOf==="function"?window.metricOf(id):METRICS[id];if(m&&!m.__tenant)h+=traceLine(id)}catch(e){}return h} /* PR-32 B2: lineage is the Meridian registry's; a tenant metric (metricOf) has none yet */;w.__r15e=1;window.metricBody=w})();
/* ---------- 7. KB stub generator ---------- */
function ownerFor(team){return G(()=>R.personOf(team),"")||"Noor Haddad"}
function genKB(){if(!window.KCSX||!S.kcsx)return {n:0};const X=S.kcsx;X.created=X.created||[];const have=new Set(G(()=>KCSX.items(),[]).map(a=>a.id));let n=0;
 const mk=(id,t,type,svc,own,srcRef,note,proc)=>{if(have.has(id)||RS.kb[id])return;have.add(id);RS.kb[id]={id,t,source:srcRef,owner:own,at:TODAY};
  X.created.push({id,t:"Draft: "+t,type,st:"Draft",svc:svc||"",own,rvw:"Nia Brooks",rev:TODAY,conf:50,sens:"Internal",lic:"Internal use",aud:["IT staff"],srcK:"Generated from record",srcRef:srcRef,proc:proc||["p_inc"],ev:[],views:0,defl:0,reuse:0,help:0,det:10,compl:20,safe:60,gen:true,genNote:note});n++};
 arr(G(()=>ITSMX.incidents,[])).forEach(i=>{if(i.kb&&/^KB\d+/.test(i.kb))mk(i.kb,i.t||i.title||i.short||i.id,"Resolved-ticket pattern",i.svc||i.service||"",ownerFor(i.own||i.owner||i.assignee||""),"Incident "+i.id,"Draft, generated from incident "+i.id+(i.res?"; resolution notes carried over":""))});
 Object.keys(METRICS).forEach(k=>{const r=METRICS[k].rem||{};if(/^KB\d+/.test(r.ref||""))mk(r.ref,r.title||("Remediate "+METRICS[k].n),"SOP","",ownerFor(METRICS[k].owner),"Metric "+k,"Draft, generated from metric "+k+" ("+METRICS[k].n+"): formula "+METRICS[k].f,["p_inc"])});
 if(n){X.ver=(X.ver||0)+1;G(()=>KCSX.recalc&&KCSX.recalc())}return {n}}
/* ---------- 10. run-budget lines and stale screen names ---------- */
function runBudget(){const B=S.bud;if(!B||!B.po)return {n:0};const run=B.run||{};const sum=k=>Object.values(run).reduce((a,x)=>a+(x[k]||0),0);
 if(!R.runLines.length){R.runLines.push({id:"RUN-CLD",n:"Run: cloud and hosting",cat:"Cloud",own:"Tom Becker",appr:sum("cld"),p:"RUN"},{id:"RUN-LIC",n:"Run: licenses and subscriptions",cat:"Licenses",own:"Avery Chen",appr:sum("lic"),p:"RUN"},{id:"RUN-SUP",n:"Run: support and managed services",cat:"Support",own:"Tom Becker",appr:sum("sup"),p:"RUN"},{id:"RUN-VEN",n:"Run: vendor services",cat:"Vendor",own:"Camille Ortega",appr:sum("ven"),p:"RUN"})}
 let n=0;B.po.forEach(p=>{if(p.line!=="Run")return;const d=lc(p.d);p.line=/hosting|cloud/.test(d)?"RUN-CLD":/agreement|licen|subscription/.test(d)?"RUN-LIC":/support|retainer|print|engineer|msa|repository/.test(d)?"RUN-SUP":"RUN-VEN";p.lineBy="Run-budget line (by id)";n++});return {n}}
const SCREENALIAS={"decision rules":"dec_cov","obligations and calendar":"bud_ven","needs you panel":"inbox","priority policy":"itsm_inc","terms playbook":"bud_ven","assets and software licences":"svc_asset","where is my change":"itsm_chg","change and release":"itsm_chg","rollback":"itsm_chg","gate policy":"plat_gate","auto approval policies":"flw_appr","approval policies":"flw_appr","false positives":"itom_evt","field authority":"plat_fab","runs and quarantine":"plat_fab","mapping studio":"plat_fab","m2m projects":"plat_fab","reconciliation":"plat_fab","citizen gate":"plat_gate","dashboard and contracts":"bud_ven","who is this for":"svc_cat","impact analysis":"kg","service offerings":"svc_cat"};
function screenNames(){const names=new Map(SCREENS.map(s=>[s[0],s[1]]));let n=0;
 Object.keys(METRICS).forEach(k=>{const m=METRICS[k];if(!Array.isArray(m.use))return;m.use=m.use.map(u=>{const ok=SCREENS.some(s=>lc(s[1])===lc(u)||s[0]===u);if(ok)return u;const id=SCREENALIAS[norm(u)]||SCREENALIAS[norm(u).replace(/ /g," ")];if(id&&names.has(id)){RS.undecl["use:"+k+":"+u]=id;n++;return names.get(id)}
  const w=toks(u);let b=null,bs=0;SCREENS.forEach(s=>{const h=new Set(toks(s[1]));let c=0;w.forEach(x=>{if(h.has(x))c++});const sc=c/Math.max(1,w.length);if(sc>bs){bs=sc;b=s}});if(b&&bs>=.5){n++;return b[1]}return u})});return {n}}
function phaseC(){_fi=null;const a=declareRefs(),b=declareFields(),c=runLineage(),d=genKB(),e=runBudget(),f=screenNames();R.last={refs:a,fields:b,lineage:c,kb:d,run:e,screens:f};return a.n+b.n+c.n+d.n+e.n+f.n}
function refreshData(){_fi=null;const a=declareRefs(),b=declareFields(),c=runLineage(),d=genKB(),f=screenNames();return a.n+b.n+c.n+d.n+f.n}
Object.assign(R,{refreshData,declareRefs,refViolations,declareFields,runLineage,lineAccept,lineReject,genKB,runBudget,screenNames,phaseC,traceLine,refState:()=>RS.ref,linState:()=>RS.lin,kbState:()=>RS.kb,undeclState:()=>RS.undecl});
})();
