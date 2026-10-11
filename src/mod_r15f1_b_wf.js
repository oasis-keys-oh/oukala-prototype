/* ===== Round 15, Agent F1, part B: durable workflow runtime and the Run monitor screen.
   Executes saved workflow and process definitions (task, approval, decision, parallel, wait/timer, connector call (simulated and labeled),
   notify, sub-process, loop). Instance state lives in STORE (workflow_instance, step_run) and resumes after a reload.
   Demo clock: simulated time runs faster than real time (default 1 simulated hour per second). ===== */
(function(){
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const HR=3600000;
const BASE=new Date(2026,9,6,8,0,0).getTime();   /* the product's "today": Tue Oct 6 2026, 08:00 */
const F=(k,label,type,o)=>Object.assign({k,label,type:type||"string",authority:"platform",classification:"internal"},o||{});
const me=()=>G(()=>INBOX.me(),null)||G(()=>PERSONAS[S.persona].n,"System");
const ST=()=>window.STORE;
const W=window.WF={};
/* ---------------- entities, metrics, process ---------------- */
const ENTS=[
 {id:"workflow_instance",label:"Workflow instance",note:"Integration decision: new. workflow_definition and process_definition describe a flow; nothing recorded one execution of it. An instance points at the existing definition (reuse), holds its token state and context, and links to the record that triggered it.",fields:[F("def_id","Definition","reference"),F("def_name","Definition name"),F("source","Source"),F("state","State","enum",{opts:["running","waiting","paused","completed","failed","cancelled"]}),F("started_by","Started by","reference"),F("started_at","Started (simulated ms)","number"),F("ended_at","Ended (simulated ms)","number"),F("outcome","Outcome"),F("tokens","Token state","text"),F("ctx","Context","text"),F("current","Current step(s)"),F("steps_done","Steps completed","number"),F("sla_breaches","SLA breaches","number"),F("parent_id","Parent instance","reference"),F("rec_ref","Triggering record","reference"),F("origin","Origin","enum",{opts:["live","demo seed"]}),F("fail_at","Injected failures","text"),F("paused_at","Paused at","number"),F("cycle_h","Cycle time (hours)","number"),F("auto","Assignees simulated","boolean"),F("note","Note","text")]},
 {id:"step_run",label:"Step run",note:"Integration decision: new. A step run is one execution of one node in one instance, with who acted, the result and the SLA outcome. It replaces the free-text run log kept by the simulator.",fields:[F("instance_id","Instance","reference"),F("node_id","Node"),F("node_name","Step"),F("node_type","Type"),F("mode","Mode","enum",{opts:["human","agentic","deterministic","control"]}),F("state","State","enum",{opts:["running","waiting","done","failed","skipped","cancelled"]}),F("who","Assignee or actor"),F("started_at","Started (simulated ms)","number"),F("ended_at","Ended (simulated ms)","number"),F("due_at","SLA due (simulated ms)","number"),F("attempt","Attempt","number"),F("port","Exit taken"),F("result","Result"),F("detail","Detail","text"),F("simulated","Connector simulated","boolean"),F("sla_breached","SLA breached","boolean"),F("agent_run","Agent run","reference")]},
 {id:"workflow_run_definition",label:"Runnable definition (from a drawing)",note:"Integration decision: reuse first. Saved designer and process definitions run directly from workflow_definition and process_definition. This record exists only for a drawing that has not been saved to a process yet: it keeps the steps that were run, as a snapshot.",fields:[F("name","Name"),F("source","Source"),F("json","Definition snapshot","text")]},
 {id:"engine_state",label:"Engine state",note:"Integration decision: new, one record. Keeps the simulated clock and counters so a reload resumes where the engine stopped.",fields:[F("sim_ms","Simulated time (ms)","number"),F("speed","Simulated minutes per second","number"),F("seeded","Demo history seeded","boolean"),F("n_inst","Instance counter","number"),F("n_step","Step counter","number"),F("auto_tasks","Simulate assignees","boolean")]}];
const MET={
 m_wf_cycle:{n:"Workflow cycle time",f:"Σ (instance end − instance start) ÷ completed instances, in hours of simulated time",u:"h",cur:0,tgt:48,badAt:120,dir:"min",max:200,tr:[60,58,55,54,52,50,49,48],owner:"Workflow owner",use:["Run monitor"],rem:{kind:"sop",ref:"SOP-WF-1",title:"Find the slowest step",agent:"Workflow Agent",auto:false,state:"idle",prog:"Ranks steps by waiting time across instances"}},
 m_wf_fail:{n:"Workflow failure rate",f:"Instances that ended Failed ÷ instances that ended Completed or Failed × 100",u:"%",cur:0,tgt:5,badAt:15,dir:"min",max:50,tr:[9,8,8,7,7,6,6,6],owner:"Workflow owner",use:["Run monitor"],rem:{kind:"sop",ref:"SOP-WF-2",title:"Retry or repair a failed step",agent:"Workflow Agent",auto:false,state:"idle",prog:"Lists failed steps with the connector error"}},
 m_wf_sla:{n:"Steps finished within SLA",f:"Step runs with an SLA that ended before their due time ÷ step runs with an SLA × 100",u:"%",cur:0,tgt:90,badAt:70,dir:"max",max:100,tr:[80,82,83,85,86,87,88,88],owner:"Workflow owner",use:["Run monitor"],rem:{kind:"sop",ref:"SOP-WF-3",title:"Rebalance an overloaded assignee",agent:"Workflow Agent",auto:false,state:"idle",prog:"Shows the assignees with the most breached steps"}}};
Object.keys(MET).forEach(k=>{if(!METRICS[k])METRICS[k]=MET[k]});
PROC.reg("wf_runs",{title:"How a saved workflow runs",std:["bpmn","itil5"],steps:[
 {n:"Start an instance",d:"A person, an event rule, the drawing studio or the process library starts a saved definition. The instance and its context are stored.",who:"human",owner:"Workflow owner",sla:"Instant",in:"Definition and record",out:"Instance"},
 {n:"Execute automatic steps",d:"Decisions evaluate their conditions, connectors run (simulated and labeled), notifications go out, forks and joins keep the paths in step.",who:"auto",owner:"Workflow runtime",sla:"Instant",in:"Ready steps",out:"Step runs"},
 {n:"Wait for people and time",d:"Tasks and approvals appear in the approvals inbox; timers run on the demo clock; each step has an SLA.",who:"human",owner:"Assignee",sla:"Per step",in:"Task or approval",out:"Decision"},
 {n:"Run an agent step",d:"The agent runtime checks the agent state, tier, budget and kill switch; low confidence or a tier gate sends the step to a person.",who:"agent",owner:"Agent sponsor",sla:"Seconds",in:"Agent step",out:"Agent run and result"},
 {n:"Escalate on SLA breach",d:"A step past its SLA is flagged, counted and announced as an event.",who:"gate",owner:"Workflow owner",sla:"On breach",in:"Overdue step",out:"Breach record"},
 {n:"Finish and measure",d:"The instance ends with an outcome; cycle time, failure rate and SLA are recomputed and feed process maturity.",who:"auto",owner:"Workflow runtime",sla:"Instant",in:"End step",out:"Metrics"}]});
const SPEC={id:"wf_runs",pid:"wf_run_process",pname:"Run a saved workflow",name:"Run monitor",sn:"Run monitor",owner:"Nia Brooks",backup:"Priya Shah",ents:ENTS,reads:["workflow_definition","process_definition","person"],writes:["workflow_instance","step_run","engine_state","workflow_run_definition"],metrics:["m_wf_cycle","m_wf_fail","m_wf_sla"],
 trigger:"A person, event rule or drawing starts a saved workflow.",inputs:["Workflow definitions","Triggering records","Approvals"],outputs:["Instances and step runs","Events","Cycle time, failure rate, SLA"],
 flows:[["flw_design","pull","Saved workflow definitions to execute","workflow_definition","api","Instance started"],["inbox","push","Tasks and approvals waiting on a person","approval","event","Task or approval step reached"],["inbox","pull","Decisions on workflow tasks","approval_decision","event","Person decides"],["draw_studio","pull","Drawn processes to run","process_definition","api","Run pressed in the drawing studio"],["plat_store","push","Instance and step records","workflow_instance","api","Any state change"],["org_chart","pull","Agent state and tier for agent steps","person","api","Agent step reached"],["plat_reg","pull","Process definitions","process_definition","api","Run this process"]],
 hint:"Executes saved workflows; instances, timers, retries, SLA",sub:"Instances, timers, retries",kw:"workflow run monitor instance execute timer sla retry cancel pause trace",navGroup:"auto"};
const CON2=window.R15CON2={done:{}};
function boot(){if(window.R15F1&&R15F1.tryReg)R15F1.tryReg(CON2,SPEC);G(()=>R15F1.addRecs([["WF_INST","Workflow instances","wf_runs",1,"workflow_instance","new","STORE workflow_instance"],["WF_STEP","Step runs","wf_runs",1,"step_run","new","STORE step_run"],["WF_DEF","Workflow definitions executed","wf_runs",1,"workflow_definition","direct","FLOWX.flows"]]),0);syncMetrics()}
window.addEventListener("load",()=>setTimeout(boot,1100));if(document.readyState==="complete")setTimeout(boot,1100);
/* ---------------- clock ---------------- */
const CLK={sim:BASE,anchor:Date.now(),speed:15,auto:false,seeded:false,ni:0,ns:0};
const SPEEDS=[[0,"Paused"],[1,"1 min per second"],[15,"15 min per second"],[60,"1 hour per second"],[600,"10 hours per second"],[1440,"1 day per second"]];
function SIM(){return CLK.sim+(CLK.speed?(Date.now()-CLK.anchor)*CLK.speed*60:0)}
function setSpeed(v){CLK.sim=SIM();CLK.anchor=Date.now();CLK.speed=v;saveClock()}
function advanceBy(h){CLK.sim=SIM()+h*HR;CLK.anchor=Date.now();saveClock();tick(true)}
function saveClock(){ST().put("engine_state",{id:"clock",sim_ms:Math.round(CLK.sim),speed:CLK.speed,seeded:CLK.seeded,n_inst:CLK.ni,n_step:CLK.ns,auto_tasks:CLK.auto},{silent:true})}
const fmtSim=ms=>{const d=new Date(ms);return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+" "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
const fmtH=h=>h==null||isNaN(h)?"-":h<1?Math.round(h*60)+" min":h<48?(Math.round(h*10)/10)+" h":(Math.round(h/24*10)/10)+" d";
W.clock=()=>({sim:SIM(),speed:CLK.speed,fmt:fmtSim(SIM())});
/* ---------------- definitions ---------------- */
const hrsOf=s=>{if(s==null||s==="")return null;if(typeof s==="number")return s;const t=String(s).trim();let m=t.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?$/i);if(m&&(m[1]||m[2]||m[3]))return(+m[1]||0)*24+(+m[2]||0)+(+m[3]||0)/60;m=t.match(/^(\d+(?:\.\d+)?)\s*(m|min|minutes?|h|hrs?|hours?|d|days?|w|weeks?)?\b/i);if(!m)return null;const v=+m[1],u=(m[2]||"h").toLowerCase();return u[0]==="m"?v/60:u[0]==="d"?v*24:u[0]==="w"?v*168:v};
function synthDef(id,name,steps,src){/* a runnable definition from a list of {n,d,who,owner,sla} steps */
 const nodes=[{id:"T1",t:"trigger",n:"Start",a:{src:"api",ev:"Run pressed"},p:{tg:{},asg:{},params:{}}}],edges=[];let prev="T1";
 steps.forEach((s,i)=>{const w=String(s.who||"human"),id="S"+(i+1);const t=w==="agent"?"agent":w==="auto"?"auto":w==="gate"?"approval":"human";
  const a=t==="agent"?{agent:s.owner||"Process Drawing Agent",goal:s.d||s.n,tools:[],conf:70,autonomy:"propose",fallback:s.owner||""}:t==="auto"?{op:/notif|email|message/i.test(s.n)?"Send notification":"Call REST API",chan:"Teams",to:s.owner||""}:t==="approval"?{approvers:[s.owner||"Process owner"],mode:"any",allowReturn:true,tiers:"fixed",asm:[]}:{outcomes:["Done"]};
  nodes.push({id,t,n:s.n||("Step "+(i+1)),a,p:{tg:{sla:s.sla&&/\d/.test(s.sla)?s.sla:"",dur:0},asg:{kind:"person",person:s.owner||"",team:s.owner||""},params:{retries:2}}});edges.push({f:prev,p:"next",t:id});prev=id});
 nodes.push({id:"E1",t:"end",n:"End",a:{outcome:"Completed"},p:{tg:{},asg:{},params:{}}});edges.push({f:prev,p:"next",t:"E1"});
 return{id,name,nodes,edges,src:src||"drawing",owner:""}}
function getDef(id){const syn=ST().get("workflow_run_definition",id);if(syn){try{return JSON.parse(syn.json)}catch(e){}}
 const f=G(()=>FLOWX.get(String(id)),null)||G(()=>FLOWX.get("wfx:"+id),null)||G(()=>FLOWX.get("proc:"+id),null);
 return f?{id:f.id,name:f.name,nodes:f.nodes,edges:f.edges,vars:f.vars||[],src:f.src||"designer",owner:f.owner,service:f.service}:null}
function nodeOf(d,id){return d.nodes.find(n=>n.id===id)}
function portsOf(n){const a=n.a||{};if(n.t==="end")return[];if(n.t==="approval")return a.allowReturn===false?["Approved","Rejected"]:["Approved","Rejected","Returned"];if(n.t==="assessment")return a.gate==="advisory"?["next"]:["Pass","Fail"];if(n.t==="decision")return(a.branches||[]).map(b=>b.label).concat(["Else"]);if(n.t==="loop")return["Each","Done"];return["next"]}
function nextNodes(d,n,port){const es=d.edges.filter(e=>e.f===n.id);if(port==="next"||n.t==="parallel")return es.filter(e=>e.p==="next"||portsOf(n).length===1);return es.filter(e=>e.p===port)}
/* ---------------- conditions ---------------- */
function lookup(inst,k){if(k==null)return undefined;if(k in inst.ctx)return inst.ctx[k];if(/^rec\./.test(k))return inst.ctx[k]!=null?inst.ctx[k]:(inst.ctx.rec||{})[k.slice(4)];return undefined}
function evalRule(inst,r){if(r.rules||r.groups)return evalCond(inst,r);const l=lookup(inst,r.f);const rv=r.vt==="pill"?lookup(inst,r.v):r.v;const a=isNaN(+l)||l===""||l==null?String(l==null?"":l):+l,b=isNaN(+rv)||rv===""?String(rv==null?"":rv):+rv;
 switch(r.o){case"=":case"==":case"is":return String(a)===String(b);case"!=":case"is not":return String(a)!==String(b);case">":return a>b;case">=":return a>=b;case"<":return a<b;case"<=":return a<=b;case"contains":return String(a).toLowerCase().includes(String(b).toLowerCase());case"in":return String(rv).split(",").map(x=>x.trim()).includes(String(a));case"is empty":return a===""||l==null;case"is not empty":return !(a===""||l==null);default:return false}}
function evalCond(inst,c){if(!c)return{ok:true,empty:true};const items=(c.rules||[]).concat(c.groups||[]);if(!items.length)return{ok:true,empty:true};const res=items.map(x=>{const r=evalRule(inst,x);return r&&typeof r==="object"?r.ok:r});return{ok:c.j==="OR"?res.some(Boolean):res.every(Boolean)}}
/* ---------------- event bus (guarded) ---------------- */
const EVS=[["workflow.started","Workflow started"],["workflow.step.completed","Workflow step completed"],["workflow.step.failed","Workflow step failed"],["workflow.completed","Workflow completed"],["workflow.cancelled","Workflow cancelled"],["workflow.sla.breached","Workflow step past its SLA"]];
let EVREG=false;
function ev(id,p){G(()=>{if(!window.EVENTS)return;if(!EVREG&&EVENTS.register){EVREG=true;EVS.forEach(e=>{try{EVENTS.register({id:e[0],label:e[1],module:"wf_runs",owner:"Workflow owner",fields:[{name:"instance",type:"string",ref:"workflow_instance"},{name:"definition",type:"string"},{name:"step",type:"string"},{name:"state",type:"string"}]})}catch(x){}})}
 if(EVENTS.emit)EVENTS.emit(id,p,{source:"Workflow runtime",actor:me()})},0)}
/* ---------------- instances ---------------- */
const stepsOf=id=>ST().all("step_run").filter(s=>s.instance_id===id);
function save(inst){ST().put("workflow_instance",{id:inst.id,def_id:inst.def,def_name:inst.name,source:inst.source,state:inst.state,started_by:inst.by,started_at:inst.t0,ended_at:inst.t1,outcome:inst.outcome,tokens:JSON.stringify(inst.tokens),ctx:JSON.stringify(inst.ctx),current:inst.tokens.filter(t=>t.st==="wait"||t.st==="ready"||t.st==="failed").map(t=>t.name).join(", "),steps_done:inst.done||0,sla_breaches:inst.breaches||0,parent_id:inst.parent||"",rec_ref:inst.rec||"",origin:inst.origin||"live",fail_at:(inst.fail||[]).join(","),paused_at:inst.pausedAt||0,cycle_h:inst.t1?+((inst.t1-inst.t0)/HR).toFixed(2):0,auto:!!inst.autoTasks,note:inst.note||""},{keepAudit:false})}
const MEM={};/* id -> live object */
function fromRec(r){let tokens=[],ctx={};try{tokens=JSON.parse(r.tokens||"[]");ctx=JSON.parse(r.ctx||"{}")}catch(e){}return{id:r.id,def:r.def_id,name:r.def_name,source:r.source,state:r.state,by:r.started_by,t0:r.started_at,t1:r.ended_at||0,outcome:r.outcome||"",tokens,ctx,done:r.steps_done||0,breaches:r.sla_breaches||0,parent:r.parent_id||"",rec:r.rec_ref||"",origin:r.origin,fail:(r.fail_at||"").split(",").filter(Boolean),pausedAt:r.paused_at||0,autoTasks:!!r.auto,note:r.note||"",joins:(ctx.__joins)||{},loops:(ctx.__loops)||{},tk:tokens.reduce((m,t)=>Math.max(m,+String(t.id).slice(1)||0),0)}}
function inst(id){return MEM[id]||(()=>{const r=ST().get("workflow_instance",id);if(!r)return null;return MEM[id]=fromRec(r)})()}
function allInst(){ST().all("workflow_instance").forEach(r=>{if(!MEM[r.id])MEM[r.id]=fromRec(r)});return Object.values(MEM)}
function srPut(i,tok,patch){const id=tok.sr||("SR-"+(++CLK.ns));tok.sr=id;const prev=ST().get("step_run",id)||{};const d=getDefCached(i);const n=d&&nodeOf(d,tok.node);
 ST().put("step_run",Object.assign({id,instance_id:i.id,node_id:tok.node,node_name:tok.name,node_type:tok.type,mode:modeOf(tok.type),state:"running",who:(tok.who||[]).join(", "),started_at:tok.t0,due_at:tok.slaDue||0,attempt:tok.attempt||1,simulated:tok.type==="auto"},prev,patch||{}),{silent:false});return id}
const modeOf=t=>({human:"human",approval:"human",assessment:"human",agent:"agentic",auto:"deterministic",decision:"deterministic"}[t]||"control");
const DEFC={};function getDefCached(i){const k=i.def;if(!DEFC[k]||DEFC[k].t<Date.now()-4000)DEFC[k]={t:Date.now(),d:getDef(k)};return DEFC[k].d}
function newTok(i,node,now){const d=getDefCached(i),n=nodeOf(d,node);const t={id:"k"+(++i.tk),node,name:n.n,type:n.t,st:"ready",t0:now,attempt:1};return t}
function who(i,n){const a=n.a||{},p=n.p||{},asg=p.asg||{};
 if(n.t==="approval"){if(a.tiers==="doa"){const amt=+lookup(i,a.amountField||"rec.amount")||+(i.ctx.rec||{}).amount||0;const tiers=G(()=>S.bud.doa,[]);const t=tiers.find(x=>amt<=x.max)||tiers[tiers.length-1]||{role:"Budget owner"};return[t.role]}return(a.approvers||[]).length?a.approvers.slice():[asg.person||asg.team||"Approver"]}
 if(n.t==="assessment")return(a.sme&&a.sme.length?a.sme:[asg.person||asg.team||"Assessor"]);
 if(n.t==="agent")return[a.agent||"AI agent"];
 return[asg.person||asg.team||"Service desk"]}
const isPerson=nm=>G(()=>!!who_(nm),false);function who_(nm){return window.who&&window.who(nm)}
function slaH(n,d){const s=hrsOf((n.p&&n.p.tg||{}).sla);if(s)return s;return null}
function durH(n){const t=(n.p&&n.p.tg)||{};if(+t.dur>0)return +t.dur;return({human:4,approval:8,assessment:6,agent:.05}[n.t])||0}
function formulaIn(i,f){const m=String(f).match(/^if\(\{\{(.+?)\}\}\s*(>=|<=|>|<|==|=)\s*\{\{(.+?)\}\}\s*,\s*'(.*?)'\s*,\s*'(.*?)'\)$/);if(!m)return"";const a=+lookup(i,m[1]),b=+lookup(i,m[3]);const ok=m[2]===">="?a>=b:m[2]==="<="?a<=b:m[2]===">"?a>b:m[2]==="<"?a<b:a===b;return ok?m[4]:m[5]}
function dmnPort(i,n){const a=n.a,t=G(()=>DMNX.tables().find(x=>x.id===a.dmn),null);if(!t)return{port:"No match",why:"Decision table "+a.dmn+" not found"};
 const vals={};t.inputs.forEach(c=>{const inp=((n.p||{}).inputs||[]).find(x=>x.name===c.k);let v;if(inp){v=inp.src==="pill"?lookup(i,inp.val):inp.src==="formula"?formulaIn(i,inp.val):inp.val}else v=lookup(i,"rec."+c.k);vals[c.k]=v==null?"":v});
 const d=DMNX.decide(t,vals);const oi=Math.max(0,t.outputs.findIndex(o=>o.k===a.col));if(!d.fired||!d.fired.length)return{port:"No match",why:"Decision table \u201c"+(t.name||t.id)+"\u201d: no rule matched "+JSON.stringify(vals)};
 const v=String(t.rows[d.fired[0]].o[oi]||"").trim();return{port:v,why:"Decision table \u201c"+(t.name||t.id)+"\u201d fired rule R"+(d.fired[0]+1)+" for "+JSON.stringify(vals)}}
function setOutputs(i,n){((n.p||{}).outputs||[]).forEach(o=>{const v=o.type==="bool"?true:o.type==="num"?1:/match/i.test(o.name)?"Match":/risk/i.test(o.name)?"Low":"ok";i.ctx[n.id+"."+o.name]=v})}
/* ---------------- start ---------------- */
function start(defId,rec,opt){opt=opt||{};const d=getDef(defId);if(!d)return{ok:false,why:"No workflow "+defId};
 const tr=d.nodes.find(n=>n.t==="trigger");if(!tr)return{ok:false,why:"The workflow has no trigger step"};
 const now=opt.at!=null?opt.at:SIM();const id="WFI-"+(1000+(++CLK.ni));
 const i={id,def:d.id,name:d.name,source:opt.source||"api",state:"running",by:opt.by||me(),t0:now,t1:0,outcome:"",tokens:[],ctx:{rec:rec||{}},done:0,breaches:0,parent:opt.parent||"",rec:(rec&&(rec.id||rec.number||rec.name))||"",origin:opt.origin||"live",fail:opt.fail||[],pausedAt:0,autoTasks:!!(opt.auto!=null?opt.auto:CLK.auto),note:opt.note||"",joins:{},loops:{},tk:0};
 Object.keys(rec||{}).forEach(k=>{i.ctx["rec."+k]=rec[k]});(d.vars||[]).forEach(v=>{i.ctx["var."+v.name]=v.init});
 MEM[id]=i;i.tokens.push(newTok(i,tr.id,now));saveClock();save(i);
 if(!opt.quiet){audit("Started workflow",d.name+" · "+id);ev("workflow.started",{instance:id,definition:d.id,state:"running"})}
 if(!opt.defer)stepInst(i,now);
 return{ok:true,id,flow:d.id,name:d.name,at:"Now",by:i.by,outcome:"running",steps:0,state:i.state}}
W.start=start;W.startFromSteps=function(name,steps,opt){const id="syn_"+Math.abs(parseInt(ST()._h53(name+JSON.stringify(steps),7).slice(0,8),16)).toString(36);const d=synthDef(id,name,steps,"drawing");ST().put("workflow_run_definition",{id,name,source:(opt&&opt.source)||"drawing",json:JSON.stringify(d)});DEFC[id]=null;return start(id,{name},Object.assign({source:"drawing"},opt||{}))};
/* ---------------- execution ---------------- */
function complete(i,tok,port,now,res){/* close the token and route */
 tok.st="done";tok.t1=now;const d=getDefCached(i),n=nodeOf(d,tok.node);i.done++;if(n.t!=="decision")setOutputs(i,n);
 const sla=tok.slaDue&&now>tok.slaDue;srPut(i,tok,{state:"done",ended_at:now,port:port||"",result:(res&&res.result)||port||"Done",detail:(res&&res.detail)||"",sla_breached:!!(tok.breached||sla),who:(res&&res.who)||(tok.who||[]).join(", ")});
 if(tok.type!=="trigger"||true)ev("workflow.step.completed",{instance:i.id,definition:i.def,step:tok.name,state:port||"done"});
 if(n.t==="end"){i.outcome=(n.a&&n.a.outcome)||"Completed";i.endedAt=now;return}
 const nx=nextNodes(d,n,port||"next");
 if(!nx.length){if(port!=="Error"){tok.stuck=true;i.note="No connection leaves “"+port+"” at "+n.n;tok.st="failed";tok.err=i.note;srPut(i,tok,{state:"failed",detail:i.note})}return}
 nx.forEach(e=>i.tokens.push(newTok(i,e.t,now)))}
function fail(i,tok,now,why){tok.st="failed";tok.err=why;srPut(i,tok,{state:"failed",ended_at:now,detail:why,result:"Failed"});ev("workflow.step.failed",{instance:i.id,definition:i.def,step:tok.name,state:why})}
function waitOn(i,tok,kind,due,now,extra){tok.st="wait";tok.kind=kind;tok.due=due;Object.assign(tok,extra||{});srPut(i,tok,{state:"waiting",detail:tok.detail||kind})}
function execTok(i,tok,now){const d=getDefCached(i),n=nodeOf(d,tok.node),a=n.a||{},p=n.p||{};tok.who=who(i,n);
 const sh=slaH(n,d);if(sh&&!tok.slaDue)tok.slaDue=now+sh*HR;
 /* skip / entry conditions */
 const sk=p.skip&&((p.skip.rules||[]).length||(p.skip.groups||[]).length)?evalCond(i,p.skip).ok:false,en=p.entry&&((p.entry.rules||[]).length||(p.entry.groups||[]).length)?evalCond(i,p.entry).ok:true;
 if(sk||!en){srPut(i,tok,{state:"skipped",ended_at:now,detail:sk?"Skip condition true":"Entry condition not met"});tok.st="done";const port=n.t==="approval"?"Approved":n.t==="decision"?"Else":portsOf(n)[0]||"next";const nx=nextNodes(d,n,port);nx.forEach(e=>i.tokens.push(newTok(i,e.t,now)));return}
 switch(n.t){
  case"trigger":return complete(i,tok,"next",now,{result:"Started",detail:"Trigger: "+(a.ev||a.src||"manual")});
  case"human":{tok.detail="Task for "+tok.who.join(", ");const due=i.autoTasks?now+Math.max(.25,durH(n)*.7)*HR:null;return waitOn(i,tok,"human",due,now,{auto:i.autoTasks,outs:a.outcomes||["Done"]})}
  case"approval":{tok.detail="Approval by "+tok.who.join(", ");const due=i.autoTasks?now+Math.max(.5,durH(n)*.6)*HR:null;return waitOn(i,tok,"approval",due,now,{auto:i.autoTasks})}
  case"assessment":{const sc=parseInt(ST()._h53(i.id+n.id,3).slice(-6),16)%61+40,pass=a.pass||60,ok=sc>=pass;const port=a.gate==="advisory"?"next":ok?"Pass":"Fail";tok.detail="Score "+sc+" against pass mark "+pass+" (simulated answers)";return complete(i,tok,port,now,{result:ok?"Passed":"Below pass mark",detail:tok.detail,who:"Assessment (simulated)"})}
  case"decision":{let port="Else",why="No branch condition was true";for(const b of a.branches||[]){const r=evalCond(i,b.c);if(r.ok&&!r.empty){port=b.label;why="Condition for “"+b.label+"” is true";break}}
   if(a.mode==="dmn"){const r=dmnPort(i,n);port=r.port;why=r.why}
   const eps=getDefCached(i).edges.filter(e=>e.f===n.id).map(e=>e.p);if(!eps.includes(port))port=eps.includes("No match")&&a.mode==="dmn"?"No match":eps.includes("Else")?"Else":port;i.ctx[n.id+".branch"]=port;return complete(i,tok,port,now,{result:port,detail:why})}
  case"parallel":{if(a.kind==="join"){const need=d.edges.filter(e=>e.t===n.id).length;const c=(i.joins[n.id]=(i.joins[n.id]||0)+1);const others=i.tokens.filter(t=>t!==tok&&(t.st==="ready"||t.st==="wait")&&!(t.node===n.id));
    if(c<need&&others.length){tok.st="wait";tok.kind="join";tok.detail="Joined "+c+" of "+need+" paths";srPut(i,tok,{state:"waiting",detail:tok.detail});return}
    i.tokens.filter(t=>t.node===n.id&&t.st==="wait").forEach(t=>{t.st="done";srPut(i,t,{state:"done",ended_at:now,result:"Joined"})});i.joins[n.id]=0;return complete(i,tok,"next",now,{result:"Joined",detail:"All paths arrived"})}
   const es=d.edges.filter(e=>e.f===n.id);tok.detail="Forked into "+es.length+" paths";return complete(i,tok,"next",now,{result:"Forked",detail:tok.detail})}
  case"wait":{const h=hrsOf(a.dur)||24,evn=a.kind!=="timer";tok.detail=evn?"Waiting for "+(a.until||a.ev||"an event")+" (times out after "+fmtH(h)+")":"Timer: "+fmtH(h);return waitOn(i,tok,evn?"event":"timer",now+h*HR,now,{})}
  case"loop":{const items=Array.isArray(lookup(i,a.over))?lookup(i,a.over).length:3,max=Math.min(items,a.max||10);const c=(i.loops[n.id]=(i.loops[n.id]||0)+1);const port=c<=max?"Each":"Done";if(port==="Done")i.loops[n.id]=0;return complete(i,tok,port,now,{result:port,detail:port==="Each"?"Iteration "+c+" of "+max:"Loop finished after "+max})}
  case"subflow":{const r=start(a.ref,i.ctx.rec,{parent:i.id,source:"sub-process",by:i.by,origin:i.origin,auto:i.autoTasks,at:now,defer:false});if(!r.ok){return fail(i,tok,now,"Sub-process not found: "+(a.ref||"(none)"))}tok.child=r.id;tok.detail="Sub-process "+r.name+" · "+r.id;return waitOn(i,tok,"child",null,now,{})}
  case"agent":return execAgent(i,tok,n,now);
  case"auto":return execAuto(i,tok,n,now);
  case"end":return complete(i,tok,"next",now,{result:(a.outcome||"Completed"),detail:"Finished with outcome "+(a.outcome||"Completed")});
  default:return complete(i,tok,"next",now,{result:"Passed through"})}}
function execAuto(i,tok,n,now){const a=n.a||{},p=n.p||{};const notify=/notif|message|email/i.test(a.op||"");
 if(notify){tok.detail="Notification via "+(a.chan||"Teams")+" to "+(a.to||tok.who.join(", "))+" (simulated delivery)";ev("workflow.notify",{instance:i.id,step:n.n});return complete(i,tok,"next",now,{result:"Sent",detail:tok.detail,who:"System"})}
 const retries=p.params&&p.params.retries!=null?+p.params.retries:2,forced=(i.fail||[]).includes(n.id);
 const flaky=parseInt(ST()._h53(i.id+n.id,5).slice(-4),16)%13===0&&tok.attempt<2;
 tok.detail="Simulated connector call: "+(a.op||"Call REST API")+" (no network traffic)";
 if(forced||flaky){const why=(a.op||"Call")+" returned 503 (simulated)";
  if(tok.attempt<=retries&&!(forced&&tok.attempt>retries)){tok.attempt++;const back=.25*Math.pow(2,tok.attempt-2);return waitOn(i,tok,"retry",now+back*HR,now,{detail:"Attempt "+(tok.attempt-1)+" failed: "+why+". Retry in "+fmtH(back)})}
  const hasErr=portsOf(n).concat(["Error"]) && d_has(i,n,"Error");if(hasErr){return complete(i,tok,"Error",now,{result:"Failed, error path taken",detail:why})}
  return fail(i,tok,now,why+" after "+retries+" retries")}
 return complete(i,tok,"next",now,{result:"OK (simulated)",detail:tok.detail,who:"System"})}
function d_has(i,n,port){return getDefCached(i).edges.some(e=>e.f===n.id&&e.p===port)}
function execAgent(i,tok,n,now){const a=n.a||{};let r=null;
 if(window.AGENTRT&&AGENTRT.execute){try{r=AGENTRT.execute({agent:a.agent,goal:a.goal,tools:a.tools||[],conf:a.conf,autonomy:a.autonomy,instance:i.id,step:n.name||n.n,input:{definition:i.name,record:i.rec},at:now,auto:i.autoTasks})}catch(e){r={ok:false,blocked:true,why:String(e&&e.message||e)}}}
 else r={ok:true,confidence:.86,runId:"",output:"No agent runtime loaded"};
 tok.detail=r.blocked?"Blocked: "+r.why:(a.agent?G(()=>agentDisplay(a.agent).full,a.agent):"Agent")+" · confidence "+Math.round((r.confidence||0)*100)+"%";
 if(r.runId)tok.agentRun=r.runId;
 if(r.blocked){/* agent paused, retired, kill switch, or budget cap: hand to a person */tok.fallback=true;tok.who=[a.fallback||r.sponsor||"Agent sponsor"];return waitOn(i,tok,"human",i.autoTasks?now+2*HR:null,now,{detail:tok.detail+". A person takes over."})}
 if(r.needsApproval){tok.who=[r.sponsor||"Agent sponsor"];return waitOn(i,tok,"approval",i.autoTasks?now+HR:null,now,{agentGate:true,detail:tok.detail+". Tier "+r.tier+" requires sponsor approval before the result is used."})}
 if(r.escalated){tok.who=[a.fallback||r.sponsor||"Agent sponsor"];return waitOn(i,tok,"human",i.autoTasks?now+2*HR:null,now,{detail:tok.detail+" is under the "+(a.conf||70)+"% threshold: human fallback."})}
 i.ctx[n.id+".confidence"]=r.confidence;return complete(i,tok,"next",now,{result:"Done, confidence "+Math.round((r.confidence||0)*100)+"%",detail:tok.detail,who:G(()=>agentDisplay(a.agent).full,a.agent)})}
/* resolve a waiting token (by timer, signal, person or agent gate) */
function resolveTok(i,tok,now,how,by,note){const d=getDefCached(i),n=nodeOf(d,tok.node);if(tok.st!=="wait")return false;
 if(tok.kind==="human"){const oc=how&&how.outcome||(tok.outs&&tok.outs[0])||"Done";i.ctx[n.id+".result"]=oc;return complete(i,tok,"next",now,{result:oc,detail:(note||tok.detail||""),who:by||tok.who.join(", ")}),true}
 if(tok.kind==="approval"){const dec=how&&how.decision||"Approved";if(tok.agentGate){G(()=>window.AGENTRT&&tok.agentRun&&AGENTRT.gate(tok.agentRun,dec==="Approved"?"Approved":"Rejected",by||me(),note));if(dec==="Approved"){i.ctx[n.id+".confidence"]=.9;return complete(i,tok,"next",now,{result:"Sponsor approved the agent result",detail:note||"",who:by||tok.who.join(", ")}),true}return complete(i,tok,"next",now,{result:"Sponsor rejected the agent result: a person redoes the step",detail:note||"",who:by||""}),true}
  const port=portsOf(n).includes(dec)?dec:"Approved";i.ctx[n.id+".decision"]=dec;return complete(i,tok,port,now,{result:dec,detail:note||"",who:by||tok.who.join(", ")}),true}
 if(tok.kind==="timer"||tok.kind==="event"){return complete(i,tok,"next",now,{result:tok.kind==="event"&&!by?"Timed out waiting":"Done",detail:by?"Signalled by "+by:tok.detail,who:by||"Timer"}),true}
 if(tok.kind==="retry"){tok.st="ready";return true}
 if(tok.kind==="child"){return true}
 return false}
function stepInst(i,now){if(!i||i.state==="completed"||i.state==="failed"||i.state==="cancelled"||i.state==="paused")return false;let changed=false,g=0;
 for(;g<400;g++){let did=false;
  const tok=i.tokens.find(t=>t.st==="ready");if(tok){try{execTok(i,tok,now)}catch(e){console.error("wf exec",e);fail(i,tok,now,"Engine error: "+(e&&e.message))}did=true}
  else{for(const t of i.tokens){if(t.st!=="wait")continue;
    if(t.kind==="child"){const c=inst(t.child);if(c&&(c.state==="completed"||c.state==="failed"||c.state==="cancelled")){if(c.state==="completed")complete(i,t,"next",now,{result:"Sub-process "+c.outcome,detail:c.id,who:"Sub-process"});else fail(i,t,now,"Sub-process "+c.id+" "+c.state);did=true;break}continue}
    if(t.due!=null&&t.due<=now){resolveTok(i,t,now);did=true;break}
    if(t.slaDue&&now>t.slaDue&&!t.breached){t.breached=true;i.breaches++;srPut(i,t,{sla_breached:true});ev("workflow.sla.breached",{instance:i.id,definition:i.def,step:t.name});did=true;break}}}
  if(!did)break;changed=true}
 /* finish */
 const act=i.tokens.some(t=>t.st==="ready"||t.st==="wait"),bad=i.tokens.find(t=>t.st==="failed");
 let ns=act?"waiting":(bad?"failed":"completed");if(act&&i.tokens.some(t=>t.st==="ready"))ns="running";
 if(ns!==i.state||changed){const was=i.state;i.state=ns;if((ns==="completed"||ns==="failed")&&!i.t1){i.t1=Math.max(now,i.endedAt||0)||now;if(ns==="completed"&&!i.outcome)i.outcome="Completed";if(ns==="failed")i.outcome="Failed at "+bad.name;ev("workflow.completed",{instance:i.id,definition:i.def,state:ns});audit("Workflow "+ns,i.name+" · "+i.id)}
  i.ctx.__joins=i.joins;i.ctx.__loops=i.loops;save(i);return true}
 return false}
/* ---------------- tick ---------------- */
function tick(force){if(!ST()||!ST().isReady())return;const now=SIM();let any=false;allInst().forEach(i=>{if(i.state==="waiting"||i.state==="running"){/* cheap guard: only step when something can happen */
  const can=i.tokens.some(t=>t.st==="ready"||(t.st==="wait"&&(t.kind==="child"||(t.due!=null&&t.due<=now)||(t.slaDue&&now>t.slaDue&&!t.breached))));if(can||force){if(stepInst(i,now))any=true}}});
 if(any&&(S.screen==="wf_runs"||document.querySelector("[data-r15-live]"))){softRender()}
 if(any&&window.INBOX&&INBOX.refresh)G(()=>INBOX.refresh())}
let softT=0;function softRender(){if(softT)return;softT=setTimeout(()=>{softT=0;if(document.querySelector("#drawer.open .r15-wfdr, .r15-wfdr"))return;if(S.screen==="wf_runs")render()},900)}
/* controls */
function setState(id,op,arg){const i=inst(id);if(!i)return{ok:false,why:"No instance"};const now=SIM();
 if(op==="pause"&&(i.state==="running"||i.state==="waiting")){i.prevState=i.state;i.state="paused";i.pausedAt=now}
 else if(op==="resume"&&i.state==="paused"){const dt=now-i.pausedAt;i.tokens.forEach(t=>{if(t.due!=null)t.due+=dt;if(t.slaDue)t.slaDue+=dt});i.state="waiting";i.pausedAt=0;save(i);stepInst(i,now)}
 else if(op==="cancel"&&!["completed","failed","cancelled"].includes(i.state)){i.tokens.forEach(t=>{if(t.st==="wait"||t.st==="ready"){t.st="done";srPut(i,t,{state:"cancelled",ended_at:now,detail:"Cancelled by "+me()})}});i.state="cancelled";i.t1=now;i.outcome="Cancelled";i.tokens.filter(t=>t.child).forEach(t=>setState(t.child,"cancel"));ev("workflow.cancelled",{instance:i.id,definition:i.def,state:"cancelled"})}
 else if(op==="retry"){const t=i.tokens.find(x=>x.id===arg)||i.tokens.find(x=>x.st==="failed");if(!t)return{ok:false,why:"Nothing to retry"};t.st="ready";t.attempt=1;t.err="";i.fail=(i.fail||[]).filter(x=>x!==t.node);if(i.state==="failed"){i.state="running";i.t1=0;i.outcome=""}i.note="";save(i);stepInst(i,now)}
 else if(op==="signal"){const t=i.tokens.find(x=>x.id===arg);if(t)resolveTok(i,t,now,null,me());stepInst(i,now)}
 else return{ok:false,why:"Not allowed in state "+i.state};
 save(i);audit("Workflow "+op,i.name+" · "+i.id);return{ok:true,state:i.state}}
W.control=setState;
function decideTok(id,tokId,how,note,onBehalf){const i=inst(id);if(!i)return{ok:false,why:"No instance"};const t=i.tokens.find(x=>x.id===tokId);if(!t||t.st!=="wait")return{ok:false,why:"Step is no longer waiting"};
 if(i.state==="paused")return{ok:false,why:"The instance is paused"};
 if(t.kind==="approval"&&i.by===me()&&!onBehalf&&!t.agentGate)return{ok:false,why:"Separation of duties: the requester cannot approve their own request"};
 const by=onBehalf?(t.who[0]||"")+" (recorded by "+me()+")":me();resolveTok(i,t,SIM(),how,by,note);stepInst(i,SIM());save(i);audit("Workflow step decided",i.name+" · "+t.name+" · "+((how&&(how.decision||how.outcome))||"Done"));return{ok:true,state:i.state}}
W.decide=decideTok;W.instances=()=>allInst();W.get=inst;W.steps=stepsOf;W.tick=tick;
/* ---------------- replace the simulated FLOWX.start ---------------- */
function hookFlowx(){if(!window.FLOWX)return;const old=FLOWX.start;FLOWX.start=function(id,rec,opt){const r=start(id,rec||{},Object.assign({source:"api"},opt||{}));if(!r.ok&&old&&false)return old(id,rec);return r};FLOWX.instances=()=>allInst().map(i=>({id:i.id,flow:i.def,state:i.state}));FLOWX.runtime=W}
/* ---------------- inbox adapter: tasks and approvals waiting on a person ---------------- */
function inboxAdapter(){if(!(window.INBOX&&INBOX.adapters)||INBOX.adapters.wfrun)return;
 const mkI=o=>{const it=Object.assign({kind:"approval",cat:"Workflow task",ic:"task",title:"",req:"",ageH:0,dueH:96,amt:null,risk:"low",why:"",ai:null,guard:"",ev:[],extra:"",can:{approve:false,reject:false,delegate:false},blk:"",rec:"",needNote:false,vendor:"",sim:false,openLabel:"Open run",open:()=>{}},o);const g=h=>h<0?"Overdue":h<=24?"Due today":h<=168?"This week":"Later";it.group=g(it.dueH);it.urgent=it.dueH<0||it.dueH<4;it.sc=(it.urgent?0:1)*1e6+(it.kind==="approval"?0:1)*1e4+Math.max(-48,it.dueH);return it};
 INBOX.adapters.wfrun={key:"wfrun",label:"Workflow runs",mod:"Run monitor",fn:"WF.decide",wired:true,
  list(meName){const now=SIM(),out=[];allInst().forEach(i=>{if(i.state==="paused"||i.state==="completed"||i.state==="cancelled")return;i.tokens.forEach(t=>{if(t.st!=="wait"||(t.kind!=="human"&&t.kind!=="approval"))return;
    const mine=t.who.some(w=>w===meName)||t.who.some(w=>!isPerson(w));if(!mine)return;
    const dueH=t.slaDue?(t.slaDue-now)/HR:96,sod=t.kind==="approval"&&i.by===meName&&!t.agentGate;
    out.push(mkI({id:"wfrun:"+i.id+":"+t.id,src:"wfrun",sid:i.id+":"+t.id,cat:t.kind==="approval"?"Workflow approval":"Workflow task",ic:t.kind==="approval"?"check":"task",title:t.name+" · "+i.name,req:i.by,ageH:Math.max(0,(now-t.t0)/HR),slaH:t.slaDue?(t.slaDue-t.t0)/HR:96,dueH,risk:"low",
     why:"Assigned to "+t.who.join(", ")+" by "+i.id+". "+t.detail,guard:sod?"Separation of duties: you started this run, so someone else must approve it.":"Decision is written to the run trace and the audit log.",ev:[["Instance",i.id,""],["Definition",i.name,""],["Waiting since",fmtSim(t.t0),""]],blk:sod?"You started this run; another approver must decide.":"",
     can:{approve:!sod,reject:t.kind==="approval",delegate:false},needNote:false,flag:false,open:()=>{go("wf_runs");setTimeout(()=>openInst(i.id),50)}}))})});return out},
  approve(it,note){const [id,tk]=it.sid.split(":");const t=inst(id).tokens.find(x=>x.id===tk);return decideTok(id,tk,t&&t.kind==="approval"?{decision:"Approved"}:{outcome:(t&&t.outs&&t.outs[0])||"Done"},note)},
  reject(it,why){const [id,tk]=it.sid.split(":");return decideTok(id,tk,{decision:"Rejected"},why)},
  check(it){const [id]=it.sid.split(":");const i=inst(id);return i?{st:i.state,hist:i.done}:null}}}
/* ---------------- metrics ---------------- */
function stats(){const L=allInst(),done=L.filter(i=>i.state==="completed"),fl=L.filter(i=>i.state==="failed"),act=L.filter(i=>["running","waiting","paused"].includes(i.state));
 const cyc=done.length?done.reduce((a,i)=>a+(i.t1-i.t0)/HR,0)/done.length:0;const fin=done.length+fl.length;
 const sr=ST().all("step_run").filter(s=>s.due_at&&s.state==="done"),ok=sr.filter(s=>!s.sla_breached).length;
 return{n:L.length,done:done.length,failed:fl.length,active:act.length,cancelled:L.filter(i=>i.state==="cancelled").length,paused:L.filter(i=>i.state==="paused").length,cycle:cyc,failRate:fin?fl.length*100/fin:0,sla:sr.length?ok*100/sr.length:100,slaN:sr.length,breaches:L.reduce((a,i)=>a+(i.breaches||0),0),steps:ST().count("step_run")}}
function syncMetrics(){try{const s=stats(),set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=+v.toFixed(1);m.tr=m.tr.slice(0,-1).concat([m.cur])};set("m_wf_cycle",s.cycle);set("m_wf_fail",s.failRate);set("m_wf_sla",s.sla)}catch(e){}}
W.stats=stats;
/* ---------------- demo history (real engine runs on the fast-forwarded clock, labeled "demo seed") ---------------- */
function seedHistory(){if(CLK.seeded||ST().count("workflow_instance"))return;CLK.seeded=true;
 const picks=["wf_inv","wf_dem","wf_vend","wf_hire","wf_renew","wf_laptop","wf_inv","wf_dem","wf_laptop"].filter(id=>getDef(id));const t0=BASE-5*24*HR;const ids=[];
 picks.forEach((id,ix)=>{const at=t0+ix*7*HR;const amt=[4200,38000,12000,0,9000,0,61000,15000,0][ix];
  const r=start(id,{id:"SEED-"+(100+ix),amount:amt,accepted_work:amt,name:"Seeded sample"},{at,origin:"demo seed",source:"demo seed",by:["Priya Shah","Dev Rao","Nia Brooks"][ix%3],auto:true,quiet:true,fail:ix===5?[(getDef(id).nodes.find(n=>n.t==="auto"&&!/notif/i.test((n.a||{}).op||""))||{}).id].filter(Boolean):[]});if(r.ok)ids.push(r.id)});
 let now=t0,guard=0;const T0=Date.now();const live=()=>allInst().filter(i=>i.origin==="demo seed"&&["running","waiting"].includes(i.state));
 while(guard++<800&&live().length&&Date.now()-T0<4000){const dues=[];live().forEach(i=>i.tokens.forEach(t=>{if(t.st==="wait"&&t.due!=null)dues.push(t.due)}));if(!dues.length)break;now=Math.max(now,Math.min(...dues));live().forEach(i=>stepInst(i,now));live().forEach(i=>stepInst(i,now))}
 saveClock()}
/* ---------------- screen ---------------- */
const SS=S.r15wf=S.r15wf||{};
const STC={running:"info",waiting:"info",paused:"warn",completed:"good",failed:"bad",cancelled:"mute"};
const pill=(s)=>`<span class="pill ${STC[s]||"mute"}">${H(s)}</span>`;
function maturityChip(){const p=G(()=>PROCLIB.get("wf_run_process"),null);return p?`<span class="pill metric" title="Process maturity from the Process library">Maturity L${p.level} of 5 · target ${p.target}</span>`:""}
function screen(){syncMetrics();const s=stats(),L=allInst().sort((a,b)=>b.t0-a.t0);const clk=SIM();
 const kp=typeof kpiRow==="function"?kpiRow([["Active",String(s.active),s.paused+" paused"],["Completed",String(s.done),"demo seed + live"],["Failed",String(s.failed),s.failed?"retry from the run":"none",{cls:s.failed?"bad":""}],["Cycle time",fmtH(s.cycle),"mean, simulated clock",{metric:"m_wf_cycle"}],["SLA met",Math.round(s.sla)+"%",s.slaN+" steps with an SLA",{metric:"m_wf_sla"}]]):"";
 const clock=`<div class="r15-clock"><span class="r15-sim" data-r15-sim title="Demo clock (simulated time)">${fmtSim(clk)}</span><label class="small muted">Speed <select data-r15-speed>${SPEEDS.map(x=>`<option value="${x[0]}" ${x[0]===CLK.speed?"selected":""}>${x[1]}</option>`).join("")}</select></label><button class="btn" data-r15-adv="1">+1 hour</button><button class="btn" data-r15-adv="8">+8 hours</button><button class="btn" data-r15-adv="24">+1 day</button><label class="r15-tg"><input type="checkbox" data-r15-autot ${CLK.auto?"checked":""}> New runs simulate assignees</label></div>`;
 const tbl=btHTML({id:"r15_inst",h:460,rowH:50,key:"id",exportName:"workflow-instances",facets:["state","source"],cols:[
  {k:"id",label:"Run",fmt:r=>`<b>${H(r.id)}</b>`,val:r=>r.id},{k:"name",label:"Workflow",fmt:r=>`${H(r.name)}${r.origin==="demo seed"?` <span class="pill mute">demo seed</span>`:""}`},{k:"state",label:"State",fmt:r=>pill(r.state),val:r=>r.state},
  {k:"cur",label:"Waiting on",fmt:r=>H(r.cur),val:r=>r.cur},{k:"by",label:"Started by",fmt:r=>pchip(r.by),val:r=>r.by},{k:"t0",label:"Started",fmt:r=>fmtSim(r.t0),val:r=>r.t0},{k:"cyc",label:"Age or cycle",fmt:r=>fmtH(r.cyc),val:r=>r.cyc},{k:"sla",label:"SLA",fmt:r=>r.breaches?`<span class="pill bad">${r.breaches} breached</span>`:`<span class="pill good">on track</span>`,val:r=>r.breaches},{k:"source",label:"Source"}],
  rows:L.map(i=>({id:i.id,name:i.name,state:i.state,cur:i.tokens.filter(t=>t.st==="wait"||t.st==="failed").map(t=>t.name).join(", "),by:i.by,t0:i.t0,cyc:((i.t1||clk)-i.t0)/HR,breaches:i.breaches||0,source:i.source,origin:i.origin})),open:id=>openInst(id)});
 const byDef={};L.forEach(i=>{(byDef[i.name]=byDef[i.name]||{n:0,c:0,f:0,h:0})[i.state==="completed"?"c":i.state==="failed"?"f":"n"]++;if(i.state==="completed")byDef[i.name].h+=(i.t1-i.t0)/HR});
 const defRows=Object.keys(byDef).map(k=>`<tr><td>${H(k)}</td><td class="num">${byDef[k].c}</td><td class="num">${byDef[k].f}</td><td class="num">${byDef[k].n}</td><td class="num">${byDef[k].c?fmtH(byDef[k].h/byDef[k].c):"-"}</td></tr>`).join("");
 const over=card("Run summary","Cycle time, failures and open runs by workflow",`<div class="tscroll"><table><thead><tr><th>Workflow</th><th>Completed</th><th>Failed</th><th>Open</th><th>Mean cycle</th></tr></thead><tbody>${defRows}</tbody></table></div>`);
 const pv=views("r15wf",["Runs","Overview"],[card("Workflow runs","Select a run for its trace, waiting steps and controls. Timers and SLAs run on the demo clock.",`<div class="r15-clockrow">${clock}</div>${tbl}`),over]);
 return `<div class="screen r15-screen" data-r15-live>${hero("Automation","Run monitor",`<b data-role="metric">${s.active}</b> active, <b data-role="metric">${s.done}</b> completed, <b data-role="metric">${s.failed}</b> failed; mean cycle <b data-role="metric">${fmtH(s.cycle)}</b>, failure rate <b data-role="metric">${s.failRate.toFixed(0)}%</b>, SLA met <b data-role="metric">${Math.round(s.sla)}%</b>. Connector calls are simulated and labeled; state survives a reload.`,`<div class="row"><button class="btn primary" data-r15-new>Start a run</button><button class="btn" data-go="flw_design">Workflow designer</button>${fchip("m_wf_cycle")}${fchip("m_wf_fail")}${fchip("m_wf_sla")}${maturityChip()}</div>`)}${lensNote()}${kp}${pv}${procCard("wf_runs")}</div>`}
REG("wf_runs","Run monitor","automate","M5 4l12 8-12 8zM19 5v14",screen);
/* drawer */
function traceRows(id){return stepsOf(id).sort((a,b)=>(a.started_at-b.started_at)||(a.createdAt-b.createdAt)).map(s=>`<tr><td class="small">${fmtSim(s.started_at)}</td><td><b>${H(s.node_name)}</b><br><span class="muted small">${H(s.node_type)}${s.simulated?" · simulated connector":""}</span></td><td>${s.state==="done"?`<span class="pill good">done</span>`:s.state==="failed"?`<span class="pill bad">failed</span>`:s.state==="waiting"?`<span class="pill info">waiting</span>`:`<span class="pill mute">${H(s.state)}</span>`}${s.sla_breached?` <span class="pill bad">SLA</span>`:""}</td><td class="small">${H(s.who)}</td><td class="small">${H(s.result)}${s.detail?`<br><span class="muted">${H(s.detail)}</span>`:""}</td><td class="num small">${s.ended_at?fmtH((s.ended_at-s.started_at)/HR):"-"}</td></tr>`).join("")}
function openInst(id){const i=inst(id);if(!i)return;SS.open=id;const now=SIM();
 const waits=i.tokens.filter(t=>t.st==="wait"||t.st==="failed");
 const wl=waits.map(t=>{const acts=t.st==="failed"?`<button class="btn primary" data-r15-ctl="retry|${i.id}|${t.id}">Retry step</button>`:t.kind==="human"?`<button class="btn" data-r15-dec="${i.id}|${t.id}|outcome|${H((t.outs||["Done"])[0])}">Complete as ${H(t.who[0]||"assignee")}</button>`:t.kind==="approval"?`<button class="btn primary" data-r15-dec="${i.id}|${t.id}|decision|Approved">Approve</button><button class="btn" data-r15-dec="${i.id}|${t.id}|decision|Returned">Return</button><button class="btn danger" data-r15-dec="${i.id}|${t.id}|decision|Rejected">Reject</button>`:t.kind==="event"?`<button class="btn" data-r15-ctl="signal|${i.id}|${t.id}">Signal event</button>`:"";
  return `<div class="r15-wait"><div><b>${H(t.name)}</b> <span class="pill ${t.st==="failed"?"bad":"info"}">${t.st==="failed"?"failed":H(t.kind)}</span> ${t.breached?`<span class="pill bad">past SLA</span>`:""}<div class="muted small">${H(t.st==="failed"?t.err:t.detail)}${t.slaDue?` · SLA due ${fmtSim(t.slaDue)}`:""}${t.due!=null&&t.kind!=="retry"&&t.st!=="failed"?` · resolves ${fmtSim(t.due)}`:""}${t.who&&t.who.length&&t.kind!=="timer"?` · for ${H(t.who.join(", "))}`:""}</div></div><div class="row r15-actions">${acts}</div></div>`}).join("")||`<p class="muted">Nothing is waiting.</p>`;
 const ctl=i.state==="paused"?`<button class="btn primary" data-r15-ctl="resume|${i.id}">Resume</button>`:["running","waiting"].includes(i.state)?`<button class="btn" data-r15-ctl="pause|${i.id}">Pause</button>`:"";
 const cancel=!["completed","failed","cancelled"].includes(i.state)?`<button class="btn danger" data-r15-ctl="cancel|${i.id}">Cancel run</button>`:"";
 const kids=allInst().filter(x=>x.parent===i.id);
 openDrawer(`<div class="r15-wfdr"><div class="row"><h2 style="margin:0">${H(i.id)}</h2>${pill(i.state)}${i.origin==="demo seed"?`<span class="pill mute">demo seed</span>`:""}</div>
 <p class="muted small">${H(i.name)} · started ${fmtSim(i.t0)} by ${H(i.by)} · ${i.t1?"ended "+fmtSim(i.t1)+" ("+fmtH((i.t1-i.t0)/HR)+")":"running for "+fmtH((now-i.t0)/HR)}${i.outcome?" · outcome "+H(i.outcome):""}</p>
 <div class="row r15-actions">${ctl}${cancel}<button class="btn quiet" data-r15-open-def="${H(i.def)}">Open definition</button></div>
 <div class="statrow"><div class="stat"><small>Steps done</small><span class="num">${i.done}</span><em>of this run</em></div><div class="stat"><small>SLA breaches</small><span class="num">${i.breaches||0}</span><em>flagged</em></div><div class="stat"><small>Record</small><span class="num">${H(i.rec||"-")}</span><em>${H(i.source)}</em></div></div>
 ${i.parent?`<p class="small">Sub-process of <a href="#" data-r15-openi="${H(i.parent)}">${H(i.parent)}</a></p>`:""}${kids.length?`<p class="small">Sub-processes: ${kids.map(k=>`<a href="#" data-r15-openi="${H(k.id)}">${H(k.id)}</a> (${H(k.state)})`).join(", ")}</p>`:""}
 <div class="eyebrow">Waiting steps</div>${wl}
 <div class="eyebrow" style="margin-top:14px">Trace</div><div class="tscroll"><table><thead><tr><th>Started</th><th>Step</th><th>State</th><th>Actor</th><th>Result</th><th>Took</th></tr></thead><tbody>${traceRows(i.id)}</tbody></table></div>
 <div class="eyebrow" style="margin-top:14px">Context</div><pre class="r15-pre">${H(JSON.stringify(Object.fromEntries(Object.entries(i.ctx).filter(([k])=>k[0]!=="_")),null,1).slice(0,1400))}</pre></div>`)}
W.open=openInst;
function startForm(pre){const defs=G(()=>FLOWX.flows().filter(f=>!/^gen_/.test(f.id)&&(f.nodes||[]).some(n=>n.t==="trigger")).slice(0,260),[]);
 openForm({id:"r15_wfstart",title:"Start a run",story:"Runs a saved workflow definition on the runtime. Human tasks and approvals appear in the approvals inbox; connector calls are simulated and labeled. Optionally inject a failure to practice retry.",submit:"Start run",
  fields:[{k:"def",label:"Workflow or process",type:"select",req:true,opts:defs.map(f=>[f.id,f.name+" ("+(f.src||"")+")"])},{k:"rec",label:"Record reference",type:"text",ph:"INV-1042"},{k:"amount",label:"Amount (for approval tiers)",type:"money"},{k:"auto",label:"Simulate assignees (tasks finish on their own)",type:"toggle"},{k:"fail",label:"Inject a connector failure at the first automatic step",type:"toggle"}],
  defaults:{def:pre||(defs[0]&&defs[0].id),auto:CLK.auto},
  onSubmit:v=>{const d=getDef(v.def);if(!d){toast("Pick a workflow","warn");return false}const au=d.nodes.find(n=>n.t==="auto"&&!/notif/i.test((n.a||{}).op||""));const r=start(v.def,{id:v.rec||"MAN-"+(CLK.ni+1),amount:+v.amount||0},{source:"manual",auto:!!v.auto,fail:v.fail&&au?[au.id]:[]});if(!r.ok){toast(r.why,"warn");return false}toast("Started "+r.id,"good");closeDrawer();if(S.screen==="wf_runs")render();else{go("wf_runs")}setTimeout(()=>openInst(r.id),80)}})}
W.startForm=startForm;
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-r15-new]")){startForm();return}
 if(t=e.target.closest("[data-r15-adv]")){advanceBy(+t.dataset.r15Adv);toast("Clock moved forward "+t.dataset.r15Adv+" h","info");render();return}
 if(t=e.target.closest("[data-r15-ctl]")){const [op,id,arg]=t.dataset.r15Ctl.split("|");const r=setState(id,op,arg);if(!r.ok)toast(r.why,"warn");else toast("Run "+id+": "+op,"good");openInst(id);if(S.screen==="wf_runs")softRenderNow();return}
 if(t=e.target.closest("[data-r15-dec]")){const [id,tk,kind,val]=t.dataset.r15Dec.split("|");const ins=inst(id),tok=ins&&ins.tokens.find(x=>x.id===tk);const onb=!!(tok&&!tok.who.includes(me()));const r=decideTok(id,tk,kind==="decision"?{decision:val}:{outcome:val},"",onb);if(!r.ok)toast(r.why,"warn");else toast(val+(onb?" (recorded on behalf of "+tok.who[0]+")":""),"good");openInst(id);if(S.screen==="wf_runs")softRenderNow();return}
 if(t=e.target.closest("[data-r15-openi]")){e.preventDefault();openInst(t.dataset.r15Openi);return}
 if(t=e.target.closest("[data-r15-open-def]")){const d=t.dataset.r15OpenDef;closeDrawer();if(!G(()=>openWorkflow(d),false))go("flw_design");return}
 if(t=e.target.closest("[data-r15-runproc]")){startProc(t.dataset.r15Runproc);return}
 if(t=e.target.closest("[data-r15-drawrun]")){drawRun();return}});
function softRenderNow(){setTimeout(()=>{if(S.screen==="wf_runs")render()},60)}
document.addEventListener("change",e=>{let t;if(t=e.target.closest("[data-r15-speed]")){setSpeed(+t.value);toast("Clock: "+(SPEEDS.find(x=>x[0]===+t.value)||[0,""])[1],"info");return}if(t=e.target.closest("[data-r15-autot]")){CLK.auto=t.checked;saveClock()}});
/* ---------------- entry points: process card, drawing studio, process library ---------------- */
function startProc(screen){const id=PROC.defs[screen]?"proc:"+screen:screen;let r=start(id,{name:screen},{source:"process card"});if(!r.ok){const steps=G(()=>S.proc[screen]||PROC.defs[screen].steps,null);if(steps)r=W.startFromSteps(G(()=>PROC.defs[screen].title,screen),steps,{source:"process card"})}
 if(!r.ok){toast(r.why||"Cannot run","warn");return}toast("Started "+r.id+" · "+r.name,"good");go("wf_runs");setTimeout(()=>openInst(r.id),120)}
const _pc=window.procCard;
if(_pc)window.procCard=function(screen,opts){const h=_pc.apply(this,arguments);if(!h||screen==="wf_runs")return h;const n=allInst().filter(i=>i.def==="proc:"+screen).length;return h.replace(/<\/section>\s*$/,`<div class="r15-runbar"><button class="btn" data-r15-runproc="${H(screen)}">Run this process</button><span class="muted small">${n} run${n===1?"":"s"} recorded · steps execute on the workflow runtime, connector calls are simulated</span></div></section>`)};
function drawRun(){const D=window.DRAW;if(!D||!D.ST||!D.ST.doc){toast("Open a drawing first","warn");return}const doc=D.ST.doc;let steps=[];try{steps=D.toSteps(doc)}catch(e){}if(!steps.length){toast("Draw at least one step before running","warn");return}
 const r=W.startFromSteps(doc.name||"Drawing",steps.map(s=>({n:s.n||s.name,d:s.d,who:s.who,owner:s.owner,sla:s.sla})),{source:"drawing studio"});if(!r.ok){toast(r.why,"warn");return}toast("Running "+r.name+" · "+r.id,"good");go("wf_runs");setTimeout(()=>openInst(r.id),150)}
const mo=new MutationObserver(()=>{if(S.screen!=="draw_studio")return;const bar=document.querySelector(".dr-right");if(bar&&!bar.querySelector("[data-r15-drawrun]")){const b=document.createElement("button");b.type="button";b.className="btn";b.setAttribute("data-r15-drawrun","1");b.textContent="Run";b.title="Run this drawing on the workflow runtime (connector calls are simulated)";bar.insertBefore(b,bar.firstChild)}});
window.addEventListener("load",()=>{const v=document.querySelector("#view");if(v)mo.observe(v,{childList:true,subtree:true})});
/* live clock label and boot */
setInterval(()=>{const e=document.querySelector("[data-r15-sim]");if(e)e.textContent=fmtSim(SIM())},1000);
function bootEngine(){const c=ST().get("engine_state","clock");if(c){CLK.sim=c.sim_ms||BASE;CLK.speed=c.speed==null?15:c.speed;CLK.seeded=!!c.seeded;CLK.ni=c.n_inst||0;CLK.ns=c.n_step||0;CLK.auto=!!c.auto_tasks;CLK.anchor=Date.now()}
 allInst();/* revive instances (no interpretation needed: tokens are plain data) */
 CLK.ni=Math.max(CLK.ni,...allInst().map(i=>(+String(i.id).replace(/\D/g,"")-1000)||0),0);CLK.ns=Math.max(CLK.ns,...ST().all("step_run").map(s=>+String(s.id).replace(/\D/g,"")||0),0);
 allInst().forEach(i=>{i.tk=Math.max(i.tk||0,...i.tokens.map(t=>+String(t.id).slice(1)||0),0)});
 hookFlowx();inboxAdapter();
 try{seedHistory()}catch(e){console.error("seed",e)}
 saveClock();syncMetrics();setInterval(()=>tick(),600);setInterval(saveClock,4000);
 G(()=>{if(window.INBOX&&INBOX.refresh)INBOX.refresh()});if(S.screen==="wf_runs")render()}
if(window.STORE)STORE.onHydrate(()=>setTimeout(()=>{bootEngine();W.booted=true},1500));
/* search and chat */
SEARCHX.push(()=>{const out=[{g:"Go to",t:"Run monitor",m:allInst().length+" runs",c:"--accent",f:()=>go("wf_runs"),k:"run monitor workflow instances runs execute timer sla retry"}];G(()=>allInst().slice(-60).forEach(i=>out.push({g:"Workflow runs",t:i.id+" "+i.name,m:i.state,c:"--info-f",f:()=>{go("wf_runs");setTimeout(()=>openInst(i.id),60)},k:i.id+" "+i.name+" "+i.state+" run"})),0);return out});
ASKX.push(q=>{const t=q.toLowerCase();let m;
 if(/(workflow|run).*(failed|failing)|failed (workflow|run)s?/.test(t)){const f=allInst().filter(i=>i.state==="failed");go("wf_runs");say(q,{t:f.length+" failed run"+(f.length===1?"":"s")+(f.length?": "+f.slice(0,5).map(i=>i.id+" "+i.outcome).join("; "):"")+".",steps:["Read the workflow instances","Opened the Run monitor"]});return true}
 if(/(workflow|run).*(cycle time|sla|failure rate)|how many (workflow )?runs/.test(t)){const s=stats();go("wf_runs");say(q,{t:s.n+" runs ("+s.active+" active, "+s.done+" completed, "+s.failed+" failed). Cycle "+fmtH(s.cycle)+", failure rate "+s.failRate.toFixed(0)+"%, SLA met "+Math.round(s.sla)+"%.",steps:["Computed run metrics"]});return true}
 if(m=t.match(/^(?:run|execute|start) (?:the )?(?:workflow |process )?(.+)$/)){const nm=m[1].replace(/ (workflow|process)$/,"").trim();const f=G(()=>FLOWX.flows().find(x=>x.name.toLowerCase().includes(nm)),null);if(f){const r=start(f.id,{id:"CHAT-"+(CLK.ni+1)},{source:"chat"});go("wf_runs");say(q,{t:r.ok?"Started "+r.id+" on "+f.name+".":r.why,steps:["Matched a workflow","Started it on the runtime"]});return true}}
 return false});
})();
