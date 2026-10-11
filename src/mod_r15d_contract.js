/* Round 15 Agent D: Feature Contract records for the four r15d screens. Lazy and guarded. */
(function(){
"use strict";
const W=window,tryv=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const F=(k,label,type,req)=>({k,label,type,authority:"platform",classification:"internal",req:!!req});
const SC=[
 {id:"r15d_agents",name:"Agent registry",own:"Jordan Lee",bk:"Sam Patel",ent:"agent_state",entLabel:"Agent state",entNote:"One row per registered AI agent: state (working, idle, off shift, paused, observed), shift window, runs today. Derived from the agent directory and the gateway; copies nothing.",
  fields:[F("agent_id","Agent","ref",1),F("state","State","enum",1),F("shift","Shift window","text"),F("runs_today","Runs today","number")],
  steps:[["Collect","Read the agent directory and gateway activity.","auto","Agent registry service","Minutes","Directory","Agent rows"],["Classify","Label each agent working, idle, off shift, paused or observed.","auto","Agent registry service","Immediate","Agent rows","State per agent"],["Review","A person checks idle and paused agents against intent.","human","Jordan Lee","1 day","State per agent","Action list"],["Act","Enable, pause or re-assign an agent.","human","Sam Patel","1 day","Action list","Updated registry"]],
  met:[["m_r15d_agents_idle","Agents enabled but idle","Enabled agents with no running task ÷ enabled agents × 100","%",13,10,25,"min"]],
  fin:[["ppl_org","People and org chart","person"],["adm_audit","Audit log","audit_event"]],fout:[["tower","Control Tower","agent_state"],["chat_home","Ask","agent_state"]],k:"agents working idle enabled registry count status"},
 {id:"r15d_facts",name:"Facts and conflicts",own:"Casey Rowan",bk:"Jordan Lee",ent:"fact_definition",entLabel:"Fact definition",entNote:"A named business fact with one definition, scope and unit, plus the screens that display it. Used to detect conflicting numbers.",
  fields:[F("fact_id","Fact","text",1),F("scope","Scope","text",1),F("unit","Unit","text"),F("shown_on","Shown on","ref")],
  steps:[["Define","Name the fact, scope and unit once.","human","Casey Rowan","1 week","Question","Fact definition"],["Probe","Read what each screen shows for the fact.","auto","Facts service","Minutes","Fact definition","Observed values"],["Compare","Flag differing values, units or scope.","auto","Facts service","Immediate","Observed values","Conflict list"],["Resolve","Fix the source or rename the scope.","human","Jordan Lee","3 days","Conflict list","Closed conflict"]],
  met:[["m_r15d_fact_conflicts","Open fact conflicts","Facts where two screens show different values for the same scope","",0,0,3,"min"]],
  fin:[["plat_reg","Metric registry","metric_definition"],["tower","Control Tower","agent_state"]],fout:[["plat_debt","Debt ledger","fact_definition"],["adm_audit","Audit log","audit_event"]],k:"facts conflicts definitions numbers disagree same number"},
 {id:"r15d_evidence",name:"Evidence room",own:"Casey Rowan",bk:"Sam Patel",ent:"evidence_pack",entLabel:"Evidence pack",entNote:"Read-only bundle of one control: approvals, audit entries and decisions with a hash-chain check. Exported as JSON or CSV.",
  fields:[F("control_ref","Control","text",1),F("audit_hash","Chain head","text",1),F("exported_at","Exported","date"),F("exported_by","Exported by","ref")],
  steps:[["Collect","Gather approvals, decisions and audit entries for a control.","auto","Evidence service","Minutes","Controls","Evidence set"],["Seal","Hash-chain the audit log and verify it.","auto","Evidence service","Immediate","Evidence set","Chain status"],["Review","The auditor reads the evidence read-only.","human","Casey Rowan","5 days","Chain status","Findings"],["Export","Download the pack for the auditor or the board.","human","Sam Patel","1 day","Findings","Evidence pack"]],
  met:[["m_r15d_ev_chain","Audit chain intact","Audit entries whose hash matches the chain ÷ all entries × 100","%",100,100,95,"max"]],
  fin:[["adm_audit","Audit log","audit_event"],["flw_appr","Approvals","approval"]],fout:[["plat_debt","Debt ledger","evidence_pack"],["chat_home","Ask","evidence_pack"]],k:"evidence audit auditor board controls approvals chain verify export"},
 {id:"r15d_firstweek",name:"My first week",own:"Jordan Lee",bk:"Sam Patel",ent:"first_week_plan",entLabel:"First week plan",entNote:"The checklist for a new hire: onboarding orders, accounts, mandatory courses and buddy. Reads orders and courses; stores nothing.",
  fields:[F("person","New hire","ref",1),F("order_id","Order","ref"),F("course_id","Course","ref"),F("due","Due","date")],
  steps:[["Plan","Build the checklist from the onboarding orders and courses.","auto","Onboarding service","Immediate","Hire record","Checklist"],["Provision","Fulfil accounts and equipment.","human","Sam Patel","3 days","Checklist","Ready accounts"],["Learn","Complete mandatory courses.","human","Jordan Lee","5 days","Ready accounts","Completed courses"],["Confirm","Manager confirms the first week is done.","human","Jordan Lee","7 days","Completed courses","Closed plan"]],
  met:[["m_r15d_fw_ready","New hires ready on day one","New hires with all accounts provisioned on start date ÷ new hires × 100","%",83,95,70,"max"]],
  fin:[["ppl_org","People and org chart","person"],["svc_portal","Service portal","approval"]],fout:[["chat_home","Ask","first_week_plan"],["adm_audit","Audit log","audit_event"]],k:"first week new hire onboarding checklist buddy accounts"}];
const WS={};
function wire(){
 try{
  if(!WS.met&&typeof METRICS!=="undefined"){SC.forEach(s=>s.met.forEach(m=>{if(!METRICS[m[0]])METRICS[m[0]]={n:m[1],f:m[2],u:m[3],cur:m[4],tgt:m[5],badAt:m[6],dir:m[7],max:m[3]==="%"?100:Math.max(10,m[5]*3),tr:[0,1,2,3,4,5,6,7].map(i=>m[4]),owner:s.own,use:[s.name],rem:{kind:"sop",ref:"SOP-"+s.id.toUpperCase(),title:"Review "+s.name,agent:"",auto:false,state:"idle",prog:""}}}));WS.met=1}
  if(!WS.ent&&W.ATLAS&&ATLAS.addEntity){
   SC.forEach(s=>tryv(()=>ATLAS.addEntity({id:s.ent,label:s.entLabel,domain:"gov",source:s.name,ownerApp:s.id,ownerMod:s.id,status:"live",note:s.entNote,fields:s.fields}),null));
   if(W.COVER&&Array.isArray(COVER.recs))SC.forEach(s=>{if(!COVER.recs.some(r=>r.key===s.id+".rec"))COVER.recs.push({key:s.id+".rec",label:s.entLabel+" view",scr:[s.id],mod:s.id,n:0,ent:s.ent,how:"new",path:"S.r15d"})});
   WS.ent=1}
  if(!WS.mod&&W.MODMAP&&MODMAP.addModule&&WS.ent){
   let ok=0;SC.forEach(s=>{const r=tryv(()=>MODMAP.addModule({id:s.id,name:s.name,sn:s.name,band:"plt",own:s.own,proposed:false,scr:s.id,r:s.fin.map(f=>f[2]),w:[s.ent],
    flows:s.fin.map(f=>({dir:"pull",other:f[0],data:f[1]+" data",entity:f[2],mode:"api",trig:"Screen opened"})).concat(s.fout.map(f=>({dir:"push",other:f[0],data:s.name+" result",entity:f[2],mode:"event",trig:"State changed"})))}),null);
    if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))ok++});
   if(ok===SC.length)WS.mod=1}
  if(!WS.proc&&W.PROCLIB&&PROCLIB.addProcess&&WS.mod){
   let ok=0;const fam=tryv(()=>PROCLIB.get("plat_gate").family,undefined);
   SC.forEach(s=>{const st=s.steps.map(x=>({n:x[0],d:x[1],who:x[2],owner:x[3],sla:x[4],in:x[5],out:x[6]}));
    const r=tryv(()=>PROCLIB.addProcess({id:s.id+"_process",name:s.name+" process",module:s.id,family:fam,owner:s.own,backup:s.bk,trigger:"The screen is opened or its source data changes",steps:st,inputs:[s.steps[0][5]],outputs:[s.steps[3][6]],entities:[s.ent],metrics:s.met.map(m=>m[0]),model:"cmmi"}),null);
    if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))ok++;
    tryv(()=>PROC.reg(s.id,{title:s.name+" process",std:["cobit"],steps:st}),0)});
   if(ok===SC.length)WS.proc=1}
 }catch(e){console.error("r15d contract",e)}
 if(WS.proc&&W.MODMAP&&MODMAP.refresh)tryv(()=>MODMAP.refresh())}
if(W.SEARCHX)SEARCHX.push(()=>SC.map(s=>({g:"Go to",t:s.name,m:s.name+" screen",c:"--p4",f:()=>go(s.id),k:s.id+" "+s.k})));
setTimeout(wire,900);setTimeout(wire,3000);setTimeout(wire,6800);
W.R15D=W.R15D||{};R15D.contractWire=wire;R15D.contractState=()=>Object.assign({},WS);
})();
