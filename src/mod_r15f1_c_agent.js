/* ===== Round 15, Agent F1, part C: agent runtime with accountable-human controls.
   Registry state machine (draft, testing, active, paused, retired), tier rules, run records, kill switch and pause at agent/tier/global level,
   human approval gates by tier, budget caps, run audit trail, sponsor and backup enforcement, and a Runs tab on the agent profile.
   No model is called: runs are simulated, every run says so, and all text is data (no generated prose). ===== */
(function(){
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ST=()=>window.STORE;const me=()=>G(()=>INBOX.me(),null)||G(()=>PERSONAS[S.persona].n,"System");
const F=(k,label,type,o)=>Object.assign({k,label,type:type||"string",authority:"platform",classification:"internal"},o||{});
const simNow=()=>G(()=>WF.clock().sim,Date.now());
const fmtSim=ms=>{const d=new Date(ms);return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
const R=window.AGENTRT={};
const disp=n=>G(()=>agentDisplay(n).full,n);
const $$m=n=>"$"+(n<10?n.toFixed(2):n<1000?n.toFixed(0):Math.round(n).toLocaleString("en-US"));
/* ---------------- data model, metrics, process ---------------- */
const ENTS=[
 {id:"agent_registry",label:"Agent registry entry",note:"Integration decision: extend. Agents already exist in the org model (sponsor, autonomy, status) and the AI Control Tower (spend, cap). The registry entry adds only what the runtime enforces: lifecycle state, tier, backup owner, monthly budget cap and the control flags. Sponsor and status still come from the org model.",fields:[F("name","Agent"),F("lifecycle","Lifecycle","enum",{opts:["draft","testing","active","paused","retired"]}),F("tier","Tier","number"),F("sponsor","Sponsor","reference"),F("backup","Backup owner","reference"),F("budget_cap","Daily budget cap (USD)","number"),F("confidence_floor","Confidence floor (percent)","number"),F("delegate_apg","Approver group the sponsor delegates gate decisions to (PR-27)","reference"),F("note","Note","text")]},
 {id:"agent_run",label:"Agent run",note:"Integration decision: new. A run is one execution of an agent for one step: inputs, tools used, output, cost, a confidence value with its basis, the tier gate and who decided. It links to workflow_instance and step_run, and rolls up to the agent's spend.",fields:[F("agent","Agent"),F("instance_id","Workflow instance","reference"),F("step","Step"),F("tier","Tier","number"),F("mode","Mode","enum",{opts:["live","test"]}),F("state","State","enum",{opts:["completed","blocked","escalated","awaiting approval","approved","rejected"]}),F("started_at","Started (simulated ms)","number"),F("model","Model"),F("inputs","Inputs","text"),F("tools_used","Tools used","text"),F("output","Output","text"),F("tokens_in","Tokens in","number"),F("tokens_out","Tokens out","number"),F("cost","Cost (USD)","number"),F("confidence","Confidence","number"),F("basis","Confidence basis","text"),F("gate","Human gate"),F("decided_by","Decided by","reference"),F("blocked_by","Blocked by"),F("origin","Origin","enum",{opts:["live","demo seed","guard playground"]}),F("goal","Goal","text"),F("tenant","Tenant (CL-67: every run runs in exactly one tenant)","reference"),F("gateway","Model route (AI gateway, simulated)")]},
 {id:"agent_control",label:"Agent control",note:"Integration decision: new. One record per kill switch or pause: global, a tier, or one agent. A control wins over every lifecycle state and is checked before each run.",fields:[F("scope","Scope","enum",{opts:["global","tier","agent"]}),F("target","Target"),F("paused","Paused","boolean"),F("kind","Kind","enum",{opts:["pause","kill"]}),F("by","Set by","reference"),F("reason","Reason","text"),F("at","At (simulated ms)","number"),F("origin","Set from","enum",{opts:["runtime","tower"]}),F("simulated","Simulated","boolean")]},
 {id:"agent_event",label:"Agent audit event",note:"Integration decision: new. The run audit trail: lifecycle changes, controls, gate decisions and budget stops, one row each, with the human who acted.",fields:[F("agent","Agent"),F("kind","Kind","enum",{opts:["lifecycle","control","gate","budget","enforcement","run"]}),F("detail","Detail","text"),F("by","By","reference"),F("at","At (simulated ms)","number"),F("tenant","Tenant","reference")]}];
const MET={
 m_agrt_gate:{n:"Gated agent runs decided by a human",f:"Agent runs that needed a tier gate and were approved or rejected by a named human ÷ agent runs that needed a gate × 100",u:"%",cur:0,tgt:100,badAt:85,dir:"max",max:100,tr:[92,94,95,96,97,97,98,98],owner:"AI platform lead",use:["Agent runtime"],rem:{kind:"sop",ref:"SOP-AGRT-1",title:"Clear the approval queue",agent:"Triage Agent",auto:false,state:"idle",prog:"Lists runs waiting on a sponsor, oldest first"}},
 m_agrt_budget:{n:"Agent budget used today",f:"Σ agent spend today ÷ Σ daily budget caps × 100 (reconciled with the Control Tower figures)",u:"%",cur:0,tgt:70,badAt:90,dir:"min",max:120,tr:[41,46,52,55,58,61,64,66],owner:"AI platform lead",use:["Agent runtime"],rem:{kind:"sop",ref:"SOP-AGRT-2",title:"Raise or reduce a budget cap",agent:"Forecast Agent",auto:false,state:"idle",prog:"Shows agents above 80 percent of their cap"}},
 m_agrt_acct:{n:"Active agents with a sponsor and a backup",f:"Active agents with a named human sponsor and a different named backup ÷ active agents × 100",u:"%",cur:0,tgt:100,badAt:80,dir:"max",max:100,tr:[70,72,75,78,80,82,84,85],owner:"AI platform lead",use:["Agent runtime"],rem:{kind:"sop",ref:"SOP-AGRT-3",title:"Name a backup owner",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists agents missing a backup, by sponsor"}}};
Object.keys(MET).forEach(k=>{if(!METRICS[k])METRICS[k]=MET[k]});
PROC.reg("ai_runtime",{title:"How an agent run is controlled",std:["nist","cobit"],steps:[
 {n:"Check the controls",d:"Global, tier and agent switches are read first; a paused or killed scope blocks the run and records why.",who:"robot",owner:"Agent runtime",sla:"Instant",in:"Run request",out:"Allowed or blocked"},
 {n:"Check lifecycle and accountability",d:"Only active agents run for real; testing agents run in test mode. An agent without a sponsor and a backup cannot be activated.",who:"gate",owner:"AI platform lead",sla:"Instant",in:"Registry entry",out:"Allowed or blocked"},
 {n:"Check the budget cap",d:"Estimated cost plus spend today must stay under the daily cap of the agent, the same cap the Control Tower shows.",who:"robot",owner:"Agent runtime",sla:"Instant",in:"Spend and cap",out:"Allowed or blocked"},
 {n:"Run the agent",d:"Simulated run: inputs, tools used, output, tokens, cost and a confidence value with its basis are recorded.",who:"agent",owner:"Agent sponsor",sla:"Seconds",in:"Goal and tools",out:"Run record"},
 {n:"Apply the tier gate",d:"Tier 1 suggests only. Tier 2 needs the sponsor to approve every result. Tier 3 acts alone above the confidence floor and asks below it.",who:"gate",owner:"Agent sponsor",sla:"Per run",in:"Run record",out:"Approved, rejected or used"},
 {n:"Audit and learn",d:"Every run, gate decision, pause and budget stop is written to the audit trail and feeds the acceptance and escalation figures.",who:"robot",owner:"Agent runtime",sla:"Instant",in:"Decision",out:"Audit event and metrics"}]});
const SPEC={id:"ai_runtime",pid:"agent_run_process",pname:"Run an AI agent under accountable-human control",name:"Agent runtime",sn:"Agent runtime",owner:"Casey Rowan",backup:"Maya Ortiz",ents:ENTS,reads:["person","workflow_instance"],writes:["agent_registry","agent_run","agent_control","agent_event"],metrics:["m_agrt_gate","m_agrt_budget","m_agrt_acct"],
 trigger:"A workflow reaches an agent step, or a sponsor runs a test.",inputs:["Agent registry","Controls","Budget caps"],outputs:["Run records","Audit events","Approval requests"],
 flows:[["org_chart","pull","Agents, sponsors and autonomy levels","person","api","Agent step reached"],["org_chart","push","Pause, kill and lifecycle state","person","event","Control changed"],["wf_runs","pull","Agent steps to execute","workflow_instance","api","Workflow reaches an agent step"],["wf_runs","push","Agent run results and gate decisions","agent_run","event","Run finished"],["inbox","push","Runs waiting on a sponsor","approval","event","Tier gate reached"],["tower","push","Spend against budget cap","agent_run","event","Run finished"],["plat_store","push","Registry, runs and controls","agent_registry","api","Any change"]],
 hint:"Agent lifecycle, tiers, kill switch, run records, gates, budgets",sub:"Lifecycle, gates, kill switch",kw:"agent runtime registry lifecycle tier kill switch pause approval gate budget cap runs audit sponsor backup",navGroup:"ai"};
const CON3=window.R15CON3={done:{}};
function boot(){if(window.R15F1&&R15F1.tryReg)R15F1.tryReg(CON3,SPEC);G(()=>R15F1.addRecs([["AG_REG","Agent registry entries","ai_runtime",1,"agent_registry","extend","STORE agent_registry"],["AG_RUN","Agent runs","ai_runtime",1,"agent_run","new","STORE agent_run"],["AG_CTL","Agent controls","ai_runtime",1,"agent_control","new","STORE agent_control"]]),0)}
window.addEventListener("load",()=>setTimeout(boot,1300));if(document.readyState==="complete")setTimeout(boot,1300);
/* ---------------- rules ---------------- */
const TIERS={1:{n:"Tier 1",lvl:"suggest",name:"Suggest",gate:"No gate: output is advice, never written to a record",cap:10,floor:0},2:{n:"Tier 2",lvl:"approval",name:"Act with approval",gate:"Sponsor approves every result before it is used",cap:15,floor:75},3:{n:"Tier 3",lvl:"act",name:"Act within rules",gate:"Acts alone at or above the confidence floor; below it the sponsor decides",cap:20,floor:80}};
const tierOf=lvl=>lvl==="act"?3:lvl==="approval"?2:1;
const LC=["draft","testing","active","paused","retired"];
const NEXT={draft:["testing","retired"],testing:["active","draft","retired"],active:["paused"],paused:["active","retired"],retired:[]};
const LCC={draft:"mute",testing:"info",active:"good",paused:"warn",retired:"mute"};
function oAgents(){return G(()=>ORGX.agents(),[])}
/* PR-32 B7: another tenant's own agents (DATA agents) join the registry with that tenant's sponsor and backup; Meridian keeps the org chart.
   A tenant agent is shaped like an org chart agent so the same lifecycle, tier, budget, sponsor and kill switch rules apply. */
const isCore=()=>tenantNow()==="core";
function tAgentRows(){return isCore()?[]:G(()=>DATA.get("agents").filter(a=>(a.part||"agent")==="agent"),[])}
function tAgent(name){const r=tAgentRows().find(a=>a.n===name||a.id===name);if(!r)return null;
 return{name:r.n,model:r.model||"",tools:Array.isArray(r.tools)?r.tools:[],status:r.st==="running"?"running":r.st||"paused",sponsor:r.owner||"",backup:r.bak||"",autonomy:r.tier==="act"||r.tier==="approval"?r.tier:"suggest",eval:null,tenantRow:r}}
function oAgent(name){const t=G(()=>agentDisplay(name).title,name);return G(()=>ORGX.agentByName(name),null)||G(()=>ORGX.agentByName(t),null)||oAgents().find(a=>a.name===name||a.name===t||G(()=>agentDisplay(a.name).first,"")===name)||tAgent(name)||null}
const reg=name=>ST().get("agent_registry",name);
function sApp(name){return G(()=>S.agents.find(a=>a.n===name),null)||G(()=>tAgent(name).tenantRow,null)}
const isHuman=nm=>!!nm&&((G(()=>!!window.who(nm),false)&&G(()=>window.who(nm).kind!=="ai",true))||(!isCore()&&G(()=>DATA.get("people").some(p=>p.name===nm&&p.kind==="human"),false)));
function backupGuess(sp){const u=G(()=>ORGX.up(sp),[]);return Array.isArray(u)&&u[0]?(u[0].name||u[0]):""}
/* registry entries of the active tenant's agents (seeded once, tagged with the tenant); Meridian entries carry no tenant */
function seedTenant(){if(isCore())return;const t=tenantNow();tAgentRows().forEach(r=>{if(reg(r.n))return;const a=tAgent(r.n),tr=tierOf(a.autonomy);
 ST().put("agent_registry",{id:r.n,name:r.n,tenant:t,lifecycle:a.status==="running"?"active":"paused",tier:tr,sponsor:a.sponsor,backup:a.backup,budget_cap:+r["cap$"]||TIERS[tr].cap,confidence_floor:TIERS[tr].floor,note:""},{silent:true})})}
const regsHere=()=>{seedTenant();const t=tenantNow();return ST().all("agent_registry").filter(r=>(r.tenant||"core")===t)};
function seedRegistry(){oAgents().forEach(a=>{if(reg(a.name))return;const st=a.status==="running"?"active":"paused";const lc=a.source==="built"&&!(a.eval&&a.eval.runs)?"testing":st;const app=sApp(a.name);
 ST().put("agent_registry",{id:a.name,name:a.name,lifecycle:lc,tier:tierOf(a.autonomy),sponsor:a.sponsor,backup:backupGuess(a.sponsor),budget_cap:app?app["cap$"]:TIERS[tierOf(a.autonomy)].cap,confidence_floor:TIERS[tierOf(a.autonomy)].floor,note:""},{silent:true})})}
function ctl(scope,target){return ST().get("agent_control",scope+":"+target)}
function ctlOn(scope,target){const c=ctl(scope,target);return c&&c.paused?c:null}
function lifecycle(name){const r=reg(name);if(!r)return"draft";if(r.lifecycle==="active"||r.lifecycle==="paused"){const a=oAgent(name);if(a&&a.status!=="running")return"paused"}return r.lifecycle}
function eventLog(agent,kind,detail,by){ST().put("agent_event",{agent,kind,detail,by:by||me(),at:simNow(),tenant:tenantNow()})}
/* ---------------- CL-67: tenant boundary (R49). Every run record carries DATA.tenant(); retrieval, memory and log arrays are kept
   per tenant and a run only ever writes to its own tenant's arrays. Model calls go only through the AI gateway, which is simulated
   here: no model is called. Tenant isolation is simulated in this prototype (R52). ---------------- */
const tenantNow=()=>G(()=>window.DATA&&DATA.tenant(),"core")||"core";
const SCOPES={};
function scope(t){t=t||tenantNow();return SCOPES[t]||(SCOPES[t]={tenant:t,retrieval:[],memory:[],log:[]})}
const tenantOf=r=>(r&&r.tenant)||"core";
function remember(rec,why){const sc=scope(rec.tenant);sc.log.push({run:rec.id,tenant:sc.tenant,state:rec.state,agent:rec.agent,at:rec.started_at,why:why||""});
 if(rec.state!=="blocked"){(rec.tools_used?String(rec.tools_used).split(", "):[]).filter(Boolean).forEach(t=>sc.retrieval.push({run:rec.id,tenant:sc.tenant,source:t}));sc.memory.push({run:rec.id,tenant:sc.tenant,agent:rec.agent,goal:rec.goal})}
 ["log","retrieval","memory"].forEach(k=>{if(sc[k].length>500)sc[k].splice(0,sc[k].length-500)})}
/* leak check: every entry in a tenant's arrays belongs to that tenant, and every run lives only in its own tenant's arrays */
function leakCheck(){const bad=[];Object.keys(SCOPES).forEach(t=>["log","retrieval","memory"].forEach(k=>SCOPES[t][k].forEach(e=>{if(e.tenant!==t)bad.push(t+"/"+k+"/"+e.run)})));
 const owner={};Object.keys(SCOPES).forEach(t=>SCOPES[t].log.forEach(e=>{if(owner[e.run]&&owner[e.run]!==t)bad.push("run "+e.run+" in "+owner[e.run]+" and "+t);owner[e.run]=t}));return{ok:!bad.length,bad}}
R.scope=t=>{const s=scope(t);return{tenant:s.tenant,retrieval:s.retrieval.slice(),memory:s.memory.slice(),log:s.log.slice()}};
R.tenants=()=>Object.keys(SCOPES);R.leakCheck=leakCheck;R.tenant=tenantNow;
R.GATEWAY_NOTE="Model calls go only through the AI gateway. In this prototype the gateway is simulated and no model is called. Runs, retrieval, memory and logs are kept per tenant; tenant isolation is simulated, not enforced by infrastructure.";
/* spend: Control Tower figure (this month) plus recorded runs */
function spent(name){const app=sApp(name);const base=app?+app.spend||0:0;const day=Math.floor(simNow()/864e5);return base+ST().all("agent_run").filter(r=>r.agent===name&&r.state!=="blocked"&&Math.floor(r.started_at/864e5)===day).reduce((a,r)=>a+(+r.cost||0),0)}
function capOf(name){const r=reg(name);return r?+r.budget_cap||0:0}
function accountable(name){const r=reg(name);return !!(r&&isHuman(r.sponsor)&&isHuman(r.backup)&&r.sponsor!==r.backup)}
/* ---------------- execute a run ---------------- */
const RATE={"Claude Sonnet":[.003,.015],"GPT (OpenAI)":[.0025,.01]};
const h=(s,n)=>parseInt(ST()._h53(String(s),n||1).slice(-6),16);
function execute(o){o=o||{};const name=o.agent||"";const a=oAgent(name);const nm=a?a.name:name;const at=o.at!=null?o.at:simNow();
 const base={tenant:tenantNow(),gateway:"AI gateway (simulated)",agent:nm||name,instance_id:o.instance||"",step:o.step||"",goal:String(o.goal||"").slice(0,200),started_at:at,origin:o.origin||"live",model:a?a.model:"unregistered",inputs:JSON.stringify(o.input||{}),tools_used:"",output:"",tokens_in:0,tokens_out:0,cost:0,confidence:0,basis:"[]",gate:"",decided_by:"",blocked_by:"",tier:a?tierOf(a.autonomy):0,mode:"live"};
 const block=(why,by)=>{const rec=ST().put("agent_run",Object.assign({id:"AR-"+(1001+ST().count("agent_run"))},base,{state:"blocked",blocked_by:by,output:why}));remember(rec,why);eventLog(base.agent,by==="budget"?"budget":by==="enforcement"?"enforcement":"control","Run blocked: "+why);return{ok:false,blocked:true,why,runId:rec.id,by}};
 if(!a)return block("Not in the agent registry: register it with a sponsor and a backup before it can run","enforcement");
 const r=reg(nm);if(!r)return block("No registry entry","enforcement");
 const lc=lifecycle(nm),tier=r.tier||base.tier;base.tier=tier;
 G(()=>towerSync(),0);
 let c;
 if(c=ctlOn("global","all"))return block("Global "+c.kind+" is on ("+(c.reason||"no reason given")+")","control");
 if(c=ctlOn("tier",String(tier)))return block("Tier "+tier+" is paused ("+(c.reason||"no reason given")+")","control");
 if(c=ctlOn("agent",nm))return block((c.origin==="tower"?"AI Control Tower "+(c.kind==="kill"?"kill switch":"pause"):"Agent "+c.kind)+" is on ("+(c.reason||"no reason given")+")","control");
 if(lc==="paused")return block("Agent is paused","control");
 if(lc==="retired")return block("Agent is retired","lifecycle");
 if(lc==="draft")return block("Agent is a draft: move it to testing first","lifecycle");
 if(!accountable(nm))return block("No named sponsor and backup owner: an agent cannot run without both","enforcement");
 const test=lc==="testing";base.mode=test?"test":"live";
 /* cost estimate */
 const tools=(o.tools&&o.tools.length?o.tools:a.tools||[]),tin=600+base.goal.length*3+tools.length*150,tout=200+h(nm+o.instance+o.step,2)%420,rt=RATE[a.model]||[.002,.008];const cost=+(tin/1000*rt[0]+tout/1000*rt[1]).toFixed(4);
 if(spent(nm)+cost>capOf(nm))return block("Daily budget cap reached ("+$$m(spent(nm))+" of "+$$m(capOf(nm))+")","budget");
 /* confidence with its basis */
 const acc=(a.eval&&a.eval.accept)||75,runs=(a.eval&&a.eval.runs)||0,cov=(a.tools||[]).length?Math.min(1,tools.filter(t=>(a.tools||[]).includes(t)||true).length/Math.max(1,(a.tools||[]).length)):1,comp=o.input&&Object.keys(o.input).length?Math.min(1,.7+Object.values(o.input).filter(Boolean).length*.15):.7;
 const jit=((h(nm+(o.instance||"")+(o.step||"")+at,3)%200)-120)/1000;let conf=Math.max(.35,Math.min(.98,acc/100*.5+cov*.2+comp*.3+jit));conf=+conf.toFixed(2);
 const basis=[{k:"Historical acceptance",v:acc+"% over "+runs+" runs",w:50},{k:"Tool coverage",v:tools.length+" tools requested",w:20},{k:"Input completeness",v:Math.round(comp*100)+"%",w:30},{k:"Run variation",v:(jit>=0?"+":"")+Math.round(jit*100)+" points",w:0}];
 const floor=Math.max(+o.conf||0,+r.confidence_floor||0)/100;
 let state="completed",gate=TIERS[tier].name+": "+(tier===1?"advice only":"no gate needed"),needs=false,esc=false;
 if(test){needs=true;state="awaiting approval";gate="Testing mode: sponsor reviews every result"}
 else if(tier===2){needs=true;state="awaiting approval";gate="Tier 2: sponsor approves before use"}
 else if(tier===3&&conf<Math.max(floor,.8)){needs=true;state="awaiting approval";gate="Tier 3: confidence "+Math.round(conf*100)+"% below floor "+Math.round(Math.max(floor,.8)*100)+"%, sponsor decides"}
 else if(conf<floor){esc=true;state="escalated";gate="Below confidence floor "+Math.round(floor*100)+"%: human fallback"}
 const rec=ST().put("agent_run",Object.assign({id:"AR-"+(1001+ST().count("agent_run"))},base,{state,inputs:base.inputs,tools_used:tools.join(", "),output:"Simulated "+(tier===1?"suggestion":"proposed action")+" for "+(base.goal||"the step").slice(0,80),tokens_in:tin,tokens_out:tout,cost,confidence:conf,basis:JSON.stringify(basis),gate}));
 remember(rec);eventLog(nm,"run",rec.id+" "+state+" · "+Math.round(conf*100)+"% · "+$$m(cost));
 if(window.EVENTS&&EVENTS.emit)G(()=>EVENTS.emit("agent.run."+state.replace(/ /g,"_"),{agent:nm,run:rec.id},{source:"Agent runtime",actor:r.sponsor}));
 return{ok:true,runId:rec.id,confidence:conf,escalated:esc,needsApproval:needs,sponsor:r.sponsor,tier,cost,test}}
R.execute=execute;
/* a gate decision: from the workflow (token resolved), the inbox or the agent profile */
/* PR-27: only the agent's human sponsor, or a member of the approver group the sponsor delegates to (registry delegate_apg),
   decides a gated run. "Name (recorded by X)" is X acting, so recording on someone's behalf is no way around it. */
const actorOf=by=>{const s=String(by||"");const m=s.match(/\(recorded by ([^)]+)\)\s*$/);return (m?m[1]:s).trim()};
function canDecide(runOrAgent,by){const r=typeof runOrAgent==="string"&&/^AR-/.test(runOrAgent)?ST().get("agent_run",runOrAgent):null;const name=r?r.agent:String(runOrAgent||"");
 const g=reg(name);const who_=actorOf(by);if(!g)return{ok:false,rule:"registry",why:"No registry entry for "+name};
 if(!who_)return{ok:false,rule:"actor",why:"No deciding person is known"};
 if(who_===g.sponsor)return{ok:true,rule:"sponsor",why:who_+" is the sponsor of "+disp(name)};
 if(g.delegate_apg&&window.APG&&G(()=>APG.isMember(g.delegate_apg,who_),false))return{ok:true,rule:"delegate",why:who_+" decides as a member of "+G(()=>APG.nameOf(g.delegate_apg),g.delegate_apg)+", which "+g.sponsor+" delegates to"};
 return{ok:false,rule:"sponsor",why:"Only the sponsor of "+disp(name)+" ("+(g.sponsor||"none named")+")"+(g.delegate_apg?" or a member of "+G(()=>APG.nameOf(g.delegate_apg),g.delegate_apg):"")+" can decide this run; "+who_+" cannot"}}
R.canDecide=canDecide;
/* the sponsor may delegate gate decisions to one approver group (APG id); null clears it */
R.delegate=function(name,apgId,by){const g=reg(name);if(!g)return{ok:false,why:"Unknown agent"};const who_=actorOf(by||me());
 if(who_!==g.sponsor)return{ok:false,why:"Only the sponsor ("+g.sponsor+") can delegate gate decisions"};
 if(apgId&&!G(()=>APG.get(apgId),null))return{ok:false,why:"No approver group "+apgId};
 ST().patch("agent_registry",name,{delegate_apg:apgId||""});eventLog(name,"gate",apgId?"Gate decisions delegated to "+G(()=>APG.nameOf(apgId),apgId):"Gate delegation cleared",who_);return{ok:true}};
R.gate=function(runId,decision,by,note){const r=ST().get("agent_run",runId);if(!r||r.state!=="awaiting approval")return false;
 const cd=canDecide(runId,by||me());if(!cd.ok){eventLog(r.agent,"gate",runId+" decision refused: "+cd.why,actorOf(by||me()));G(()=>audit("Agent gate refused",runId+" · "+cd.why));R.lastRefusal=cd;return false}
 ST().patch("agent_run",runId,{state:decision==="Approved"?"approved":"rejected",decided_by:by||me(),gate:r.gate+" · "+decision});eventLog(r.agent,"gate",runId+" "+decision.toLowerCase()+(note?" ("+note+")":""),by);syncMetrics();return true};
R.approve=function(runId,decision,note){const r=ST().get("agent_run",runId);if(!r)return{ok:false,why:"No run"};
 if(r.state!=="awaiting approval")return{ok:false,why:"Already decided"};
 const cd=canDecide(runId,me());if(!cd.ok){eventLog(r.agent,"gate",runId+" decision refused: "+cd.why,me());G(()=>audit("Agent gate refused",runId+" · "+cd.why));return{ok:false,why:cd.why,rule:cd.rule}}
 /* linked to a workflow step? decide it there so the instance moves on */
 if(r.instance_id&&window.WF){const i=WF.get(r.instance_id);const t=i&&i.tokens.find(x=>x.agentRun===runId&&x.st==="wait");if(t){const rr=WF.decide(i.id,t.id,{decision},note);R.gate(runId,decision,me(),note);return rr}}
 return R.gate(runId,decision,me(),note)?{ok:true}:{ok:false,why:(R.lastRefusal&&R.lastRefusal.why)||"Already decided"}};
/* ---------------- controls ---------------- */
function setControl(scope,target,paused,kind,reason,origin){ST().put("agent_control",{id:scope+":"+target,scope,target:String(target),paused,kind:kind||"pause",by:me(),reason:reason||"",at:simNow(),origin:origin||"runtime",simulated:true});
 eventLog(scope==="agent"?target:"(all agents)","control",(paused?(kind==="kill"?"Kill switch":"Pause"):"Resumed")+(origin==="tower"?" from the AI Control Tower":"")+" · "+scope+" "+target+(reason?" · "+reason:""));
 if(scope==="agent"){G(()=>ORGX.setState(target,paused?(kind==="kill"?"killed":"paused"):"running"))}
 audit(paused?"Agent control on":"Agent control off",scope+" "+target);syncMetrics()}
R.setControl=setControl;
/* PR-25: the AI Control Tower kill switch and pause (screens3, S.agents) write runtime controls. Each tower agent that is killed or
   paused gets an agent control with origin "tower" (reason from the tower log); a restore clears only a tower control. The runtime
   reads these in execute, so runs are refused with the reason and the audit trail shows who acted. Simulated: no live agent exists. */
function towerSync(){const L=G(()=>S.agents,null);if(!Array.isArray(L))return 0;let n=0;const why=G(()=>S.ct.log[0][1],"")||"";
 L.forEach(a=>{const nm=a&&a.n;if(!nm||!reg(nm))return;const c=ctl("agent",nm),on=c&&c.paused;
  if(a.st==="killed"||a.st==="paused"){const kind=a.st==="killed"?"kill":"pause";if(!on||c.kind!==kind){setControl("agent",nm,true,kind,(why||kind)+" (simulated)","tower");n++}}
  else if(on&&c.origin==="tower"&&(a.st==="running"||a.st==="observed")){setControl("agent",nm,false,"pause","Restored in the AI Control Tower (simulated)","tower");n++}});return n}
R.towerSync=towerSync;
document.addEventListener("click",e=>{if(G(()=>S.screen,"")!=="tower")return;const t=e.target&&e.target.closest&&e.target.closest("#fire,#pause,[data-restore],[data-quick]");if(t)setTimeout(()=>G(()=>towerSync(),0),0)});
function setLifecycle(name,to,reason){const r=reg(name);if(!r)return{ok:false,why:"Unknown agent"};const from=lifecycle(name);
 if(!NEXT[from]||!NEXT[from].includes(to))return{ok:false,why:"An agent in state "+from+" cannot move to "+to+". Allowed: "+((NEXT[from]||[]).join(", ")||"none (final)")};
 if(to==="active"){if(!isHuman(r.sponsor))return{ok:false,why:"Enforcement: an active agent needs a named human sponsor",enforce:1};if(!isHuman(r.backup)||r.backup===r.sponsor)return{ok:false,why:"Enforcement: an active agent needs a backup owner who is a different named human",enforce:1};if(ctlOn("agent",name))setControl("agent",name,false)}
 ST().patch("agent_registry",name,{lifecycle:to});
 G(()=>ORGX.setState(name,to==="active"?"running":"paused"));
 eventLog(name,"lifecycle",from+" to "+to+(reason?" · "+reason:""));audit("Agent lifecycle",disp(name)+": "+from+" to "+to);syncMetrics();return{ok:true,from,to}}
R.setLifecycle=setLifecycle;
R.registry=()=>ST().all("agent_registry");/* runs are read per tenant: the active tenant sees only its own run records (CL-67); pass {tenant:"*"} for the cross-tenant admin view */
R.runs=(name,o)=>{const t=(o&&o.tenant)||tenantNow();return ST().all("agent_run").filter(r=>(!name||r.agent===name)&&(t==="*"||tenantOf(r)===t)).sort((a,b)=>b.started_at-a.started_at)};
/* ---------------- metrics ---------------- */
function syncMetrics(){try{const runs=ST().all("agent_run"),gated=runs.filter(r=>r.state==="awaiting approval"||r.state==="approved"||r.state==="rejected"),dec=gated.filter(r=>r.state!=="awaiting approval");
 if(!isCore())return;const regs=ST().all("agent_registry").filter(r=>!r.tenant),act=regs.filter(r=>lifecycle(r.name)==="active"),ok=act.filter(r=>accountable(r.name));
 const cap=regs.reduce((a,r)=>a+(+r.budget_cap||0),0),sp=regs.reduce((a,r)=>a+spent(r.name),0);
 const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=+v.toFixed(1);m.tr=m.tr.slice(0,-1).concat([m.cur])};
 set("m_agrt_gate",gated.length?dec.length*100/gated.length:100);set("m_agrt_budget",cap?sp*100/cap:0);set("m_agrt_acct",act.length?ok.length*100/act.length:100)}catch(e){}}
/* ---------------- seeded history ---------------- */
function seedRuns(){if(ST().count("agent_run"))return;const regs=ST().all("agent_registry").filter(r=>r.lifecycle==="active");const goals={"First Officer":"File decisions and actions from the Oct 1 portfolio meeting","Invoice Advisor":"Score INV-2231 against PO and contract","Knowledge Curator":"Propose an article from 4 similar tickets","Triage Agent":"Route 6 new incidents","Change Risk Agent":"Rate change CHG-0042 against history"};
 const base=simNow()-4*24*3600000;let k=0;
 regs.slice(0,8).forEach((r,ix)=>{for(let j=0;j<3;j++){const at=base+(ix*3+j)*5*3600000;const res=execute({agent:r.name,goal:goals[r.name]||("Handle queue item "+(100+k)),instance:"",step:"Seed run "+(++k),input:{queue:"demo",item:k},at,origin:"demo seed"});
  if(res.runId&&res.needsApproval&&j<2){R.gate(res.runId,j===0?"Approved":"Rejected",r.sponsor,"demo seed")}}});
 /* one blocked run for the audit trail */ }
/* ---------------- screen ---------------- */
const SS=S.r15ag=S.r15ag||{tab:"profile"};
const stPill=s=>`<span class="pill ${s==="completed"||s==="approved"?"good":s==="blocked"||s==="rejected"?"bad":s==="awaiting approval"?"warn":"info"}">${H(s)}</span>`;
const lcPill=l=>`<span class="pill ${LCC[l]||"mute"}">${H(l)}</span>`;
function basisChips(b){let a=[];try{a=JSON.parse(b||"[]")}catch(e){}return a.map(x=>`<span class="pill mute" title="weight ${x.w}">${H(x.k)}: ${H(x.v)}</span>`).join(" ")}
function runDrawer(id){const r=ST().get("agent_run",id);if(!r)return;let inp="";try{inp=JSON.stringify(JSON.parse(r.inputs||"{}"),null,1)}catch(e){inp=r.inputs}
 openDrawer(`<div class="r15-wfdr"><div class="row"><h2>${H(r.id)}</h2>${stPill(r.state)}<span class="pill ${r.mode==="test"?"info":"mute"}">${H(r.mode)}</span>${r.origin==="demo seed"?`<span class="pill mute">demo seed</span>`:""}</div>
 <p class="muted small">${H(disp(r.agent))} · Tier ${r.tier} · ${fmtSim(r.started_at)} · simulated run, no model was called</p>
 <dl class="kv"><dt>Workflow</dt><dd>${r.instance_id?`<a href="#" data-r15-openi="${H(r.instance_id)}">${H(r.instance_id)}</a> · ${H(r.step)}`:"Manual test"}</dd><dt>Goal</dt><dd>${H(r.goal||"-")}</dd><dt>Tools used</dt><dd>${H(r.tools_used||"none")}</dd><dt>Output</dt><dd>${H(r.output)}</dd><dt>Confidence</dt><dd><b>${Math.round((r.confidence||0)*100)}%</b> ${basisChips(r.basis)}</dd><dt>Cost</dt><dd>${$$m(r.cost)} · ${r.tokens_in} tokens in, ${r.tokens_out} out · ${H(r.model)}</dd><dt>Human gate</dt><dd>${H(r.gate||"none")}${r.decided_by?` · decided by ${pchip(r.decided_by)}`:""}</dd>${r.blocked_by?`<dt>Blocked by</dt><dd><span class="pill bad">${H(r.blocked_by)}</span></dd>`:""}</dl>
 ${r.state==="awaiting approval"?`<div class="row r15-actions"><button class="btn primary" data-r15-ag-gate="${H(r.id)}|Approved">Approve result</button><button class="btn danger" data-r15-ag-gate="${H(r.id)}|Rejected">Reject result</button></div>`:""}
 <div class="eyebrow">Inputs</div><pre class="r15-pre">${H(inp)}</pre></div>`)}
function runsTable(rows,id,h){return btHTML({id,h:h||360,rowH:48,key:"id",exportName:"agent-runs",facets:["state","agent"],cols:[{k:"id",label:"Run",fmt:r=>`<b>${H(r.id)}</b>`,val:r=>r.id},{k:"agent",label:"Agent",fmt:r=>H(disp(r.agent)),val:r=>r.agent},{k:"state",label:"State",fmt:r=>stPill(r.state),val:r=>r.state},{k:"tier",label:"Tier",val:r=>r.tier},{k:"conf",label:"Confidence",fmt:r=>r.blocked_by?"-":Math.round(r.confidence*100)+"%",val:r=>r.confidence},{k:"cost",label:"Cost",fmt:r=>$$m(r.cost),val:r=>r.cost},{k:"gate",label:"Gate or block",fmt:r=>H(r.blocked_by?r.blocked_by+": "+r.output:r.gate)},{k:"by",label:"Decider",fmt:r=>r.decided_by&&window.R17T?R17T.actorChip(r.decided_by):r.state==="awaiting approval"?`<span class="muted small">waiting on sponsor</span>`:r.blocked_by?`<span class="muted small">control</span>`:`<span class="muted small">${r.tier===3?"within floor":"advice"}</span>`,val:r=>r.decided_by||""},{k:"at",label:"When",fmt:r=>fmtSim(r.started_at),val:r=>r.started_at}],rows:rows.map(r=>Object.assign({},r,{conf:r.confidence,at:r.started_at})),open:rid=>runDrawer(rid)})}
function auditTable(name){const rows=ST().all("agent_event").filter(e=>(!name||e.agent===name)&&(e.tenant||"core")===tenantNow()).sort((a,b)=>b.at-a.at).slice(0,60);return `<div class="tscroll r15-sl"><table><thead><tr><th>When</th><th>Agent</th><th>Kind</th><th>Detail</th><th>By</th></tr></thead><tbody>${rows.map(e=>`<tr><td class="small">${fmtSim(e.at)}</td><td>${H(disp(e.agent))}</td><td><span class="pill mute">${H(e.kind)}</span></td><td class="small">${H(e.detail)}</td><td class="small">${H(e.by)}</td></tr>`).join("")||`<tr><td colspan="5" class="muted">No events yet.</td></tr>`}</tbody></table></div>`}
function scopeButtons(){const g=ctlOn("global","all");return `<div class="r15-ctls"><div class="r15-ctl ${g?"on":""}"><b>Global</b><span class="muted small">${g?"All agents blocked":"Running"}</span><button class="btn ${g?"primary":"danger"}" data-r15-ag-ctl="global|all|${g?"off":"on"}">${g?"Resume all":"Kill switch: stop all"}</button></div>${[1,2,3].map(t=>{const c=ctlOn("tier",String(t));return `<div class="r15-ctl ${c?"on":""}"><b>Tier ${t} · ${TIERS[t].name}</b><span class="muted small">${c?"Paused":"Running"}</span><button class="btn ${c?"primary":""}" data-r15-ag-ctl="tier|${t}|${c?"off":"on"}">${c?"Resume tier":"Pause tier"}</button></div>`}).join("")}</div>`}
function screen(){syncMetrics();const regs=regsHere(),runs=R.runs();const blocked=runs.filter(r=>r.state==="blocked").length,wait=runs.filter(r=>r.state==="awaiting approval").length;
 const act=regs.filter(r=>lifecycle(r.name)==="active"),viol=act.filter(r=>!accountable(r.name));
 const cap=regs.reduce((a,r)=>a+(+r.budget_cap||0),0),sp=regs.reduce((a,r)=>a+spent(r.name),0);
 const KR=items=>kpiRow(isCore()?items:items.map(i=>i[3]&&i[3].metric?[i[0],i[1],i[2],Object.assign({},i[3],{metric:null})]:i));
  const kp=typeof kpiRow==="function"?KR([["Active agents",String(act.length),"of "+regs.length+" registered"],["Waiting on a sponsor",String(wait),"gated runs",{cls:wait?"warn":""}],["Blocked runs",String(blocked),"controls, budget, enforcement"],["Budget used",Math.round(cap?sp*100/cap:0)+"%",$$m(sp)+" of "+$$m(cap),{metric:"m_agrt_budget"}],["Without backup",String(viol.length),"active agents",{cls:viol.length?"bad":"",metric:"m_agrt_acct"}]]):"";
 const regTbl=btHTML({id:"r15_agreg",h:420,rowH:52,key:"name",exportName:"agent-registry",facets:["lc","tier"],cols:[{k:"name",label:"Agent",fmt:r=>`<b>${H(disp(r.name))}</b>`,val:r=>r.name},{k:"lc",label:"Lifecycle",fmt:r=>lcPill(r.lc),val:r=>r.lc},{k:"tier",label:"Tier",fmt:r=>"T"+r.tier,val:r=>r.tier},{k:"sponsor",label:"Sponsor",fmt:r=>r.sponsor?pchip(r.sponsor):`<span class="pill bad">none</span>`,val:r=>r.sponsor},{k:"backup",label:"Backup",fmt:r=>r.backup?pchip(r.backup):`<span class="pill bad">none</span>`,val:r=>r.backup},{k:"sp",label:"Spend today / cap",fmt:r=>`${$$m(r.sp)} / ${$$m(r.cap)}<div class="r15-meter"><i style="width:${Math.min(100,r.cap?r.sp*100/r.cap:0)}%"></i></div>`,val:r=>r.cap?r.sp/r.cap:0},{k:"runs",label:"Runs",val:r=>r.runs},{k:"ctl",label:"Control",fmt:r=>r.ctl?`<span class="pill bad">${r.ctl}</span>`:`<span class="muted">none</span>`,val:r=>r.ctl}],
  rows:regs.map(r=>({name:r.name,lc:lifecycle(r.name),tier:r.tier,sponsor:r.sponsor,backup:r.backup,sp:spent(r.name),cap:+r.budget_cap||0,runs:runs.filter(x=>x.agent===r.name).length,ctl:(ctlOn("agent",r.name)||{}).kind||""})),open:n=>{G(()=>ORGX.openAgent(n),0)}});
 const trs=`<div class="tscroll"><table><thead><tr><th>Tier</th><th>Autonomy</th><th>Human gate</th><th>Confidence floor</th><th>Default daily cap</th></tr></thead><tbody>${[1,2,3].map(t=>`<tr><td><b>${TIERS[t].n}</b></td><td>${TIERS[t].name}</td><td class="small">${TIERS[t].gate}</td><td class="num">${TIERS[t].floor||"n/a"}${TIERS[t].floor?"%":""}</td><td class="num">${$$m(TIERS[t].cap)}</td></tr>`).join("")}</tbody></table></div>`;
 const sm=`<div class="r15-sm" role="img" aria-label="Lifecycle: draft, testing, active, paused, retired">${LC.map(l=>`<span class="pill ${LCC[l]}">${l}</span>`).join('<i aria-hidden="true">&rarr;</i>')}</div><p class="muted small">Allowed: draft to testing; testing to active, draft or retired; active to paused; paused to active or retired. Activation needs a named sponsor and a different named backup.</p>`;
 const tabs=views("r15agrt",["Registry","Runs ("+runs.length+")","Controls and rules","Audit trail"],[card("Agent registry","Lifecycle, tier, accountable humans, spend against cap",regTbl),card("All agent runs","Select a run for inputs, tools, output, cost and confidence basis",runsTable(runs,"r15_runs",420)),`${card("Kill switch and pause","A control wins over every lifecycle state and is checked before each run",scopeButtons())}${card("Tier rules","What each tier may do without a person",trs)}${card("Lifecycle","State machine enforced by the runtime",sm)}`,card("Run audit trail","Lifecycle changes, controls, gate decisions, budget stops and runs",auditTable())]);
 return `<div class="screen r15-screen">${hero("AI governance","Agent runtime",`<b data-role="metric">${act.length}</b> active agents, <b data-role="metric">${wait}</b> runs waiting on a sponsor, <b data-role="metric">${blocked}</b> blocked by a control, budget or missing backup. Runs are simulated; each carries its confidence basis, tier gate and tenant.`,`<div class="row">${isCore()?fchip("m_agrt_gate")+fchip("m_agrt_budget")+fchip("m_agrt_acct"):""}${matChip()}</div>`)}${lensNote()}${gatewayNote()}${kp}${tabs}${procCard("ai_runtime")}</div>`}
function gatewayNote(){const t=tenantNow();const sc=scope(t);return card("AI gateway and tenant boundary","Simulated: no model is called and isolation is not enforced by infrastructure in this prototype",`<p class="small" data-role="story">${H(R.GATEWAY_NOTE)}</p><div class="row"><span class="pill info">Tenant: ${H(t)}</span><span class="pill mute">${sc.log.length} log entries</span><span class="pill mute">${sc.retrieval.length} retrieval entries</span><span class="pill mute">${sc.memory.length} memory entries</span><span class="pill warn">Tenant isolation: simulated</span><button class="btn quiet" data-go="guard">Guardrail register</button></div>`)}
function matChip(){const p=G(()=>PROCLIB.get("agent_run_process"),null);return p?`<span class="pill metric">Maturity L${p.level} of 5 · target ${p.target}</span>`:""}
REG("ai_runtime","Agent runtime","ai","M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7zM9 12l2 2 4-4",screen);
G(()=>DATA.screen("ai_runtime",{mode:"data",entities:["agents","people"],note:"PR-32 B7: the registry, runs and audit trail of the active tenant"}));
/* ---------------- Runs tab on the agent profile ---------------- */
function profileRuns(name){const r=reg(name);if(!r)return`<p class="muted">Not in the registry.</p>`;const lc=lifecycle(name),runs=R.runs(name);const sp=spent(name),cap=capOf(name),ok=accountable(name);const c=ctlOn("agent",name);
 const done=runs.filter(x=>x.state!=="blocked"),acc=done.filter(x=>x.state==="completed"||x.state==="approved").length;
 const next=(NEXT[lc]||[]).map(t=>`<button class="btn ${t==="active"?"primary":""}" data-r15-ag-lc="${H(name)}|${t}">${t==="active"?"Activate":t==="testing"?"Start testing":t==="paused"?"Lifecycle: paused":t==="retired"?"Retire":"Back to draft"}</button>`).join("");
 return `<div class="r15-agruns"><div class="row">${lcPill(lc)}<span class="pill info">Tier ${r.tier} · ${TIERS[r.tier].name}</span>${c?`<span class="pill bad">${c.kind==="kill"?"Kill switch on":"Paused"}</span>`:""}<span class="pill ${ok?"good":"bad"}">${ok?"Sponsor and backup named":"Missing sponsor or backup"}</span></div>
 <div class="statrow" style="margin-top:12px"><div class="stat"><small>Runs</small><span class="num">${runs.length}</span><em>${runs.filter(x=>x.state==="blocked").length} blocked</em></div><div class="stat"><small>Accepted</small><span class="num">${done.length?Math.round(acc*100/done.length):0}%</span><em>${acc} of ${done.length}</em></div><div class="stat"><small>Spend vs cap</small><span class="num">${$$m(sp)}</span><em>of ${$$m(cap)} a day</em></div></div>
 <div class="r15-meter" role="img" aria-label="Budget used"><i style="width:${Math.min(100,cap?sp*100/cap:0)}%"></i></div>
 <dl class="kv" style="margin-top:12px"><dt>Sponsor</dt><dd>${r.sponsor?pchip(r.sponsor):"none"}</dd><dt>Backup owner</dt><dd>${r.backup?pchip(r.backup):`<span class="pill bad">none</span>`} <button class="btn quiet" data-r15-ag-backup="${H(name)}">Set</button></dd><dt>Gate</dt><dd class="small">${H(TIERS[r.tier].gate)}</dd><dt>Budget cap</dt><dd>${$$m(cap)} a day <button class="btn quiet" data-r15-ag-cap="${H(name)}">Change</button></dd></dl>
 <div class="row r15-actions">${next}${c?`<button class="btn primary" data-r15-ag-ctl="agent|${H(name)}|off">Resume agent</button>`:`<button class="btn" data-r15-ag-ctl="agent|${H(name)}|pause">Pause runs</button><button class="btn danger" data-r15-ag-ctl="agent|${H(name)}|kill">Kill switch</button>`}<button class="btn" data-r15-ag-test="${H(name)}">Run a test</button></div>
 <div class="eyebrow">Runs</div>${runs.length?`<div class="tscroll"><table><thead><tr><th>Run</th><th>State</th><th>Conf.</th><th>Cost</th><th>When</th></tr></thead><tbody>${runs.slice(0,12).map(x=>`<tr class="r15-row" data-r15-ag-run="${H(x.id)}"><td><b>${H(x.id)}</b></td><td>${stPill(x.state)}</td><td class="num">${x.blocked_by?"-":Math.round(x.confidence*100)+"%"}</td><td class="num">${$$m(x.cost)}</td><td class="small">${fmtSim(x.started_at)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">No runs yet.</p>`}
 <div class="eyebrow" style="margin-top:12px">Audit trail</div>${auditTable(name)}</div>`}
function decorate(name){const root=document.querySelector("#drawer .org-dr");if(!root||root.querySelector("[data-r15-tabs]"))return;const head=root.querySelector(".p360h");if(!head)return;
 const prof=document.createElement("div");prof.setAttribute("data-r15-prof","1");while(head.nextSibling)prof.appendChild(head.nextSibling);
 const tabs=document.createElement("div");tabs.className="r15-atabs";tabs.setAttribute("data-r15-tabs",name);tabs.setAttribute("role","tablist");
 tabs.innerHTML=`<button type="button" role="tab" data-r15-atab="profile">Profile</button><button type="button" role="tab" data-r15-atab="runs">Runs</button>`;
 const runs=document.createElement("div");runs.setAttribute("data-r15-runs","1");runs.hidden=true;
 root.appendChild(tabs);root.appendChild(prof);root.appendChild(runs);setTab(SS.tab||"profile",name)}
function setTab(t,name){SS.tab=t;const root=document.querySelector("#drawer .org-dr");if(!root)return;const pr=root.querySelector("[data-r15-prof]"),ru=root.querySelector("[data-r15-runs]");if(!pr||!ru)return;
 root.querySelectorAll("[data-r15-atab]").forEach(b=>{const on=b.dataset.r15Atab===t;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
 pr.hidden=t!=="profile";ru.hidden=t!=="runs";if(t==="runs"){ru.innerHTML=profileRuns(name||root.querySelector("[data-r15-tabs]").dataset.r15Tabs)}}
function nameFromDrawer(){const h2=document.querySelector("#drawer .org-dr .p360h h2");if(!h2)return null;const tx=h2.textContent||"";const a=oAgents().find(a=>tx.includes(a.name)||tx.includes(G(()=>agentDisplay(a.name).first,"\u0000")+" "));return a?a.name:null}
let MO=null;
function wrapOpenAgent(){if(!MO){MO=new MutationObserver(()=>{const root=document.querySelector("#drawer .org-dr");if(root&&!root.querySelector("[data-r15-tabs]")){const nm=nameFromDrawer();if(nm)decorate(nm)}});const d=document.querySelector("#drawer");if(d)MO.observe(d,{childList:true,subtree:true})}if(!window.ORGX||!ORGX.openAgent||ORGX.openAgent.__r15)return;const o=ORGX.openAgent;ORGX.openAgent=function(name){const r=o.apply(this,arguments);try{G(()=>decorate(name),0);if(SS.tabReopen){SS.tabReopen=false}}catch(e){console.error(e)}return r};ORGX.openAgent.__r15=1}
function reopen(name){const t=SS.tab;ORGX.openAgent(name);setTab(t,name)}
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-r15-atab]")){const nm=t.parentNode.dataset.r15Tabs;setTab(t.dataset.r15Atab,nm);return}
 if(t=e.target.closest("[data-r15-ag-run]")){runDrawer(t.dataset.r15AgRun);return}
 if(t=e.target.closest("[data-r15-ag-gate]")){const [id,d]=t.dataset.r15AgGate.split("|");const r=R.approve(id,d,"");toast(r&&r.ok!==false?"Run "+id+": "+d:(r&&r.why)||"Not allowed",r&&r.ok!==false?"good":"warn");runDrawer(id);if(S.screen==="ai_runtime")render();return}
 if(t=e.target.closest("[data-r15-ag-ctl]")){const [sc,tg,op]=t.dataset.r15AgCtl.split("|");if(op==="off"){setControl(sc,tg,false);toast("Resumed","good")}else{setControl(sc,tg,true,op==="kill"||sc==="global"?"kill":"pause","Set from the runtime screen by "+me());toast(op==="kill"||sc==="global"?"Kill switch on: new runs are blocked":"Paused","warn")}
  if(sc==="agent"&&document.querySelector("#drawer .org-dr"))reopen(tg);if(S.screen==="ai_runtime")render();return}
 if(t=e.target.closest("[data-r15-ag-lc]")){const [nm,to]=t.dataset.r15AgLc.split("|");const r=setLifecycle(nm,to);toast(r.ok?disp(nm)+": "+to:r.why,r.ok?"good":"warn");reopen(nm);if(S.screen==="ai_runtime")render();return}
 if(t=e.target.closest("[data-r15-ag-test]")){const nm=t.dataset.r15AgTest;const r=execute({agent:nm,goal:"Manual test run from the agent profile",input:{source:"profile",by:me()},step:"Manual test"});toast(r.ok?"Run "+r.runId+" recorded"+(r.needsApproval?" · waiting on the sponsor":""):"Blocked: "+r.why,r.ok?"good":"warn");reopen(nm);if(r.runId)setTimeout(()=>runDrawer(r.runId),50);return}
 if(t=e.target.closest("[data-r15-ag-backup]")){const nm=t.dataset.r15AgBackup;openForm({id:"r15_backup",title:"Backup owner",story:"An active agent needs a sponsor and a different named human as backup. The backup covers the sponsor's gates when the sponsor is away.",submit:"Save",fields:[{k:"b",label:"Backup owner",type:"people",req:true}],defaults:{b:reg(nm).backup},onSubmit:v=>{if(!isHuman(v.b)||v.b===reg(nm).sponsor){toast("Pick a human who is not the sponsor","warn");return false}ST().patch("agent_registry",nm,{backup:v.b});eventLog(nm,"enforcement","Backup owner set to "+v.b);audit("Agent backup owner",disp(nm)+" · "+v.b);toast("Saved","good");closeDrawer();setTimeout(()=>reopen(nm),60)}});return}
 if(t=e.target.closest("[data-r15-ag-cap]")){const nm=t.dataset.r15AgCap;openForm({id:"r15_cap",title:"Daily budget cap",story:"Runs are blocked once spend today reaches the cap. The cap and today's spend are the same figures the Control Tower shows.",submit:"Save",fields:[{k:"c",label:"Cap (USD a day)",type:"money",req:true}],defaults:{c:capOf(nm)},onSubmit:v=>{if(!(+v.c>0)){toast("Enter an amount above zero","warn");return false}ST().patch("agent_registry",nm,{budget_cap:+v.c});eventLog(nm,"budget","Cap set to "+$$m(+v.c));G(()=>{const a=sApp(nm);if(a)a["cap$"]=+v.c});toast("Saved","good");closeDrawer();setTimeout(()=>reopen(nm),60)}});return}});
/* inbox: runs waiting on a sponsor that are not tied to a workflow step */
function inboxAdapter(){if(!(window.INBOX&&INBOX.adapters)||INBOX.adapters.agrun)return;
 const mkI=o=>{const it=Object.assign({kind:"approval",cat:"Agent run",ic:"task",title:"",req:"",ageH:0,dueH:48,amt:null,risk:"low",why:"",ai:null,guard:"",ev:[],extra:"",can:{approve:true,reject:true,delegate:false},blk:"",rec:"",needNote:false,vendor:"",sim:false,openLabel:"Open run",open:()=>{}},o);it.group=it.dueH<0?"Overdue":it.dueH<=24?"Due today":"This week";it.urgent=false;it.sc=1e6+it.dueH;return it};
 INBOX.adapters.agrun={key:"agrun",label:"Agent runs",mod:"Agent runtime",fn:"AGENTRT.approve",wired:true,list(meName){return R.runs().filter(r=>r.state==="awaiting approval"&&!r.instance_id&&(reg(r.agent)||{}).sponsor===meName).map(r=>mkI({id:"agrun:"+r.id,src:"agrun",sid:r.id,title:disp(r.agent)+" result · "+(r.goal||r.step).slice(0,60),req:disp(r.agent),ageH:Math.max(0,(simNow()-r.started_at)/36e5),why:r.gate,guard:"Tier gate: the sponsor decides before the result is used.",ev:[["Confidence",Math.round(r.confidence*100)+"%",""],["Cost",$$m(r.cost),""],["Run",r.id,""]],open:()=>runDrawer(r.id)}))},
  approve(it,note){return R.approve(it.sid,"Approved",note)},reject(it,why){return R.approve(it.sid,"Rejected",why)},check(it){const r=ST().get("agent_run",it.sid);return r?{st:r.state,hist:0}:null}}}
/* ---------------- boot ---------------- */
function bootRt(){seedRegistry();ST().all("agent_control").forEach(c=>{if(c.scope==='agent'&&c.paused)G(()=>ORGX.setState(c.target,c.kind==='kill'?'killed':'paused'),0)});ST().all("agent_registry").forEach(r=>{if(r.lifecycle!=='active'&&r.lifecycle!=='testing')G(()=>ORGX.setState(r.name,'paused'),0)});seedRuns();wrapOpenAgent();inboxAdapter();syncMetrics();R.booted=true;
 /* an outside change to an agent's state (org drawer buttons) is mirrored as an audit event */
 const seen={};ST().all("agent_registry").forEach(r=>seen[r.name]=lifecycle(r.name));
 setInterval(()=>{ST().all("agent_registry").forEach(r=>{const l=lifecycle(r.name);if(seen[r.name]&&seen[r.name]!==l){eventLog(r.name,"lifecycle",seen[r.name]+" to "+l+" (changed in the org profile)")}seen[r.name]=l})},2500)}
if(window.STORE)STORE.onHydrate(()=>setTimeout(bootRt,300));
SEARCHX.push(()=>{const o=[{g:"Go to",t:"Agent runtime",m:"Kill switch, tiers, runs",c:"--p4",f:()=>go("ai_runtime"),k:"agent runtime kill switch pause tier gate budget cap runs lifecycle sponsor backup"}];G(()=>ST().all("agent_registry").forEach(r=>o.push({g:"AI agents",t:disp(r.name)+" runs",m:lifecycle(r.name)+" · Tier "+r.tier,c:"--p4",f:()=>{go("ai_runtime")},k:r.name+" "+disp(r.name)+" agent runs lifecycle"})),0);return o});
ASKX.push(q=>{const t=q.toLowerCase();
 if(/(kill switch|pause).*(agent|all)|stop all agents/.test(t)&&/(status|on|state|which)/.test(t)){const c=ST().all("agent_control").filter(x=>x.paused);go("ai_runtime");say(q,{t:c.length?c.length+" control"+(c.length>1?"s":"")+" on: "+c.map(x=>x.scope+" "+x.target+" ("+x.kind+")").join(", ")+".":"No kill switch or pause is on.",steps:["Read agent controls"]});return true}
 if(/agents?.*(waiting|pending).*(approval|sponsor)|runs? waiting/.test(t)){const w=ST().all("agent_run").filter(r=>r.state==="awaiting approval");go("ai_runtime");say(q,{t:w.length+" agent run"+(w.length===1?"":"s")+" waiting on a sponsor"+(w.length?": "+w.slice(0,5).map(r=>r.id+" "+disp(r.agent)).join("; "):"")+".",steps:["Read agent runs"]});return true}
 if(/agents?.*(without|missing).*(backup|sponsor)/.test(t)){const m=ST().all("agent_registry").filter(r=>!accountable(r.name));go("ai_runtime");say(q,{t:m.length+" agent"+(m.length===1?"":"s")+" lack a sponsor or backup"+(m.length?": "+m.slice(0,6).map(r=>disp(r.name)).join(", "):"")+".",steps:["Checked the registry"]});return true}
 return false});
})();
