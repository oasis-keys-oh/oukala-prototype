/* ===== mod_flow: Automation (workflow designer, approvals inbox, assessments, decision tables, process models, agentic workflows, integration hub) =====
   Prefixes: wfd (designer), apx (approvals), asm (assessments), flw (decision tables, BPMN, agent, hub).
   Contracts: WFX.reg (workflow registry), PROC.defs (process strips), ASSESSX (assessments), openImpact/SLAX/TBMX/SOWX/REQREG/routeBy are always guarded. */
(function(){
S.flw=S.flw||{};
const F=S.flw;
const X=esc,clone=o=>JSON.parse(JSON.stringify(o));
const uid=()=>Math.random().toString(36).slice(2,7);
const $q=(s,r)=>(r||document).querySelector(s);
const USERS={exec:"Omar Hamid",fin:"Avery Chen",pm:"Priya Shah",ops:"Tom Becker"};
const me=()=>USERS[S.persona]||"Omar Hamid";
const isAdmin=()=>S.persona==="exec";
const num=(v,d)=>{const n=parseFloat(v);return isNaN(n)?(d||0):n};
const fh=h=>h==null||isNaN(h)?"-":h<1?Math.round(h*60)+" min":h<48?(Math.round(h*10)/10)+" h":(Math.round(h/24*10)/10)+" d";
const usd=n=>n==null?"-":n<10?"$"+n.toFixed(2):money(Math.round(n));
const pc=(a,b)=>b?Math.round(a/b*100):0;
const hrsOf=s=>{if(s==null||s==="")return null;if(typeof s==="number")return s;const m=String(s).trim().match(/^(\d+(?:\.\d+)?)\s*(m|min|minutes?|h|hrs?|hours?|d|days?|w|weeks?)?\b/i);if(!m)return null;const v=+m[1],u=(m[2]||"h").toLowerCase();return u[0]==="m"?v/60:u[0]==="d"?v*24:u[0]==="w"?v*168:v};
const AGN=["Invoice Advisor","Knowledge Curator","Forecast Agent","Ops Agent","Contract Analyst","Triage Agent","Change Risk Agent","PMO Agent","First Officer","Test Agent"];
const AUTON=[["autonomous","Autonomous"],["propose","Propose then approve"],["suggest","Suggest only"]];
Object.assign(METRICS,{
 m_autoapp:{n:"Rule-decided approvals",f:"Approvals decided by a decision table with no human step ÷ Approvals requested × 100",u:"%",cur:41,tgt:55,badAt:30,dir:"max",max:100,tr:[24,27,30,33,36,38,40,41],owner:"Finance operations",use:["Decision tables","Approvals inbox"],rem:{kind:"sop",ref:"SOP-118",title:"Review overrides and widen rule bands",agent:"Feedback Analyst",auto:false,state:"idle",prog:"Proposes decision table rows from approver overrides"}},
 m_apcycle:{n:"Approval turnaround",f:"Σ(decision time − request time) ÷ Approvals decided",u:"h",cur:17.5,tgt:16,badAt:30,dir:"min",max:48,tr:[26,24,22,21,20,19,18,17.5],owner:"Finance operations",use:["Approvals inbox","Workflow designer"],rem:{kind:"agent",ref:"Reminder policy",title:"Nudge approvers at 50% of SLA",agent:"First Officer",auto:true,state:"running",prog:"Sends Teams reminders and offers a delegate when an approver is out"}},
 m_apsla:{n:"Approvals past SLA",f:"Approvals still pending after their SLA ÷ Approvals pending × 100",u:"%",cur:18,tgt:10,badAt:25,dir:"min",max:50,tr:[9,11,12,14,15,17,16,18],owner:"Service desk",use:["Approvals inbox"],rem:{kind:"sop",ref:"SOP-121",title:"Escalate to delegate at 100% of SLA",agent:"First Officer",auto:false,state:"idle",prog:"Reassigns to the delegate on file and tells the requester"}},
 m_wfrun:{n:"Workflow run success",f:"Runs that finish without manual rescue ÷ Runs started × 100",u:"%",cur:96.2,tgt:97,badAt:92,dir:"max",max:100,tr:[93.1,93.8,94.5,95,95.4,95.9,96,96.2],owner:"Automation team",use:["Workflow designer","Agentic workflows"],rem:{kind:"kb",ref:"KB0517",title:"Workflow failure triage guide",agent:"Ops Agent",auto:false,state:"idle",prog:"Groups failed runs by cause and drafts the fix"}},
 m_intfail:{n:"Integration failure rate",f:"Failed calls ÷ Total calls over the last 24 hours × 100",u:"%",cur:2.8,tgt:1,badAt:5,dir:"min",max:10,tr:[1.1,1.3,1.2,1.9,2.2,2.5,2.6,2.8],owner:"Integration team",use:["Integration hub"],rem:{kind:"sop",ref:"SOP-133",title:"Rotate expired credentials and replay the dead-letter queue",agent:"Ops Agent",auto:false,state:"idle",prog:"Renews certificates it can reach and replays safe events"}}
});

Object.assign(METRICS,{
 m_wfauto:{n:"Workflow automation rate",f:"Steps done by an AI agent or a deterministic action ÷ all work steps (human, agentic, deterministic) × 100",u:"%",cur:47,tgt:55,badAt:35,dir:"max",max:100,tr:[36,38,40,42,43,45,46,47],owner:"Automation team",use:["Workflow designer","Approvals inbox"],rem:{kind:"agent",ref:"Convert suggestions",title:"Review human steps the designer suggests converting",agent:"Ops Agent",auto:false,state:"idle",prog:"Scores each human step for conversion and shows expected hours and cost saved"}},
 m_wfstep:{n:"Step cycle time",f:"Σ(step end − step start, including queue wait) ÷ step executions, last 30 days",u:"h",cur:5.8,tgt:5,badAt:9,dir:"min",max:16,tr:[7.4,7.1,6.9,6.6,6.4,6.2,6,5.8],owner:"Process owners",use:["Workflow designer"],rem:{kind:"sop",ref:"SOP-140",title:"Review the three slowest steps each month",agent:"Ops Agent",auto:false,state:"idle",prog:"Ranks steps by queue time and suggests a reroute or an agent"}},
 m_gatepass:{n:"Assessment gate pass rate",f:"Required-gate assessments that passed at first completion ÷ required-gate assessments completed × 100",u:"%",cur:78,tgt:85,badAt:60,dir:"max",max:100,tr:[70,71,73,74,75,76,77,78],owner:"Security and risk",use:["Assessments","Approvals inbox"],rem:{kind:"kb",ref:"KB0602",title:"How to pass the security assessment first time",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Drafts guidance for the questions that fail most often"}},
 m_rework:{n:"Rework rate",f:"Step executions sent back, repeated or returned for information ÷ step executions × 100",u:"%",cur:9.4,tgt:7,badAt:15,dir:"min",max:25,tr:[12.8,12.1,11.6,11,10.6,10.1,9.8,9.4],owner:"Process owners",use:["Workflow designer","Approvals inbox"],rem:{kind:"sop",ref:"SOP-141",title:"Fix the form questions that cause returns",agent:"Feedback Analyst",auto:false,state:"idle",prog:"Finds the fields most often returned and proposes a clearer question"}},
 m_wfsla:{n:"Steps meeting their target",f:"Step executions finished within their SLA, OLA or XLA target ÷ step executions with a target × 100",u:"%",cur:91,tgt:94,badAt:80,dir:"max",max:100,tr:[86,87,88,89,89,90,90,91],owner:"Service desk",use:["Workflow designer"],rem:{kind:"sop",ref:"SOP-121",title:"Escalate at 75% of target",agent:"First Officer",auto:false,state:"idle",prog:"Warns the owner at 75% of a target and offers a delegate"}},
 m_wfcost:{n:"Cost per workflow run",f:"Σ(step cost: labor hours × rate + agent tokens + system calls) of every step executed ÷ workflow runs, last 30 days",u:"$",cur:38,tgt:34,badAt:55,dir:"min",max:80,tr:[46,45,43,42,41,40,39,38],owner:"Finance operations",use:["Workflow designer"],rem:{kind:"agent",ref:"Cost review",title:"Find the five steps that cost the most per run",agent:"Forecast Agent",auto:false,state:"idle",prog:"Compares each step with its target cost and flags overruns"}},
 m_aprover:{n:"Approver override rate",f:"Approvals where the approver decided against the AI recommendation or an advisory assessment ÷ approvals decided × 100",u:"%",cur:12,tgt:10,badAt:25,dir:"min",max:40,tr:[17,16,15,15,14,13,13,12],owner:"Finance operations",use:["Approvals inbox","Assessments"],rem:{kind:"sop",ref:"SOP-118",title:"Review overrides and retrain thresholds",agent:"Feedback Analyst",auto:false,state:"idle",prog:"Groups overrides by reason and proposes new rule bands"}}
});
const MET=(...a)=>a.map(x=>fchip(x)).join("");

/* R8: one tile style (kpi/statrow) when the shared helper exists */
const TL2=(l,v,s,t)=>typeof kpi==="function"?kpi(l,v,s,{cls:t==="bad"?"bad":t==="warn"?"warn":"",keep:1}):TL(l,v,s,t);
const tiles2=a=>typeof kpi==="function"?`<div class="statrow">${a.join("")}</div>`:tiles(a);
