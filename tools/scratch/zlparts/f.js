
/* ---------- Feature Contract: process, data, metrics, links ---------- */
const OWN="Rina Okafor",BAK="Jordan Lee";
PROC.reg("zl_conn",{title:"How connection gaps are found and closed",std:["togaf","dmbok","itil5"],steps:[
 {n:"Collect",d:"Read the entity registry, module map, process library, workflows, search index and inbox adapters.",who:"auto",owner:OWN,sla:"On open",in:"Registries",out:"Record universe"},
 {n:"Check",d:"Run data, process, workflow, cross-module reference, platform and interoperability checks.",who:"auto",owner:OWN,sla:"On open",in:"Record universe",out:"Findings"},
 {n:"Fix by registration",d:"Declare targets, add flows, register adapters, resolvers, tools and intents. Each fix is logged.",who:"auto",owner:OWN,sla:"On load",in:"Findings",out:"Fix log"},
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
    steps:[st("Collect","Read registries.","auto",OWN,"On open","Registries","Record universe"),st("Check","Run checks.","auto",OWN,"On open","Record universe","Findings"),st("Fix by registration","Apply registration fixes.","auto",OWN,"On load","Findings","Fix log"),st("Route to a human","Debt items for owner decisions.","gate",OWN,"5 working days","Open findings","Debt items"),st("Re-measure","Score and trend.","human",BAK,"Weekly","Fix log","Connectivity score")],
    inputs:["Registries"],outputs:["Connectivity score","Debt items"],entities:["connectivity_finding","process_definition","metric_definition","person"],metrics:["m_zl_score","m_zl_dead","m_zl_fanout","m_zl_orphans"],model:"cmmi"}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=true}
 }catch(e){console.error("zlink wire",e)}
 if(W.mod&&window.MODMAP&&MODMAP.refresh&&!W.fl){W.fl=1;G(()=>MODMAP.refresh())}}
SEARCHX.push(()=>[{g:"Platform",t:"Connections and gaps",m:"Connectivity score and dead links",c:"--accent",f:()=>go("zl_conn"),k:"connectivity audit gaps dead links orphans reverse links backlinks interoperability"}]);
function boot(){if(NOFIX)return;wire();fixAll();wire();G(()=>{const a=getAudit(true);fixDebt(a);Z.last=null})}
window.ZLINK={_fx:{fixRefs,fixWfService,fixAliases,fixMetricUse,fixStepIO,fixFlows,fixLineage,fixInbox,fixMcp,fixSearch,fixAsk,fixDebt,hookAudit,watchDrawer},audit:()=>getAudit(true),deadLinks,universe,graph,connected,open:openRec,interop:runIP,fixAll,score:()=>scoreOf(getAudit(true)),log:()=>Z.log,state:Z,relations,actor,wire,boot};
if(!NOFIX){setTimeout(boot,1500);setTimeout(()=>{wire();watchDrawer();G(()=>{const l=Z.log.find(x=>x.id==='fx_lineage'),keep=l?l.n:0;fixLineage();const l2=Z.log.find(x=>x.id==='fx_lineage');if(l2)l2.n+=keep});Z.last=null},4000)}
})();
