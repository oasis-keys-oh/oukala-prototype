/* Steps: shared helpers for the four step kinds (CL-58), the trigger every robot and agent step needs (CL-73),
   and the agent definition card (CL-74). Reads STEPMODE and TRIGGERS from platform.js. Prefix stp-.
   Everything on the agent card is simulated: no model runs, no budget is spent, the kill switch changes prototype state only. */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;
const SM=W.STEPMODE,TR=W.TRIGGERS;if(!SM||!TR)return;
const STEPS=W.STEPKIT=W.STEPKIT||{};

/* ---------- kinds ---------- */
STEPS.kind=v=>SM.of(v);
STEPS.cls=v=>"sm-"+SM.of(v);
STEPS.label=v=>SM.label(v);
STEPS.pill=v=>SM.pill(v);
STEPS.ORDER=["human","robot","agent","gate"];
STEPS.legend=()=>`<div class="stp-legend" aria-label="Step kinds">${STEPS.ORDER.map(k=>SM.pill(k)).join("")}</div>`;
/* owner text for a step that is not a person: never "Automatic" or "Function" (one rule, STEPMODE.ownerFor in platform.js) */
STEPS.ownerFor=(k,cur)=>SM.ownerFor(k,cur);

/* robot steps resolve to a robot record with a human sponsor and backup (CL-78, OWNERX robot directory) */
STEPS.robotFor=(s,ctx)=>G(()=>W.OWNERX.robotFor(s,ctx),null);
/* the owner chip for any step: robots get their directory record (sponsor and backup ride along), others the step owner */
STEPS.ownerChip=(s,ctx)=>{ctx=ctx||{};const k=SM.of(s&&s.who);if(k==="robot"){const r=STEPS.robotFor(s,ctx);if(r)return W.ownerChip(r.name,{kind:"robot",sponsor:r.sponsor,backup:r.backup,role:ctx.role||"Robot",record:ctx.record})}
 return W.ownerChip(STEPS.ownerFor(k,s&&s.owner),{role:ctx.role,record:ctx.record})};

/* ---------- triggers (R21a): robot and agent steps must have one; human steps start by assignment ---------- */
STEPS.needsTrigger=v=>SM.needsTrigger(v);
const MAINF={metric:"metric",schedule:"every",step:"step",event:"event",record:"entity"};
STEPS.mainField=t=>MAINF[t]||"event";
/* a sensible first trigger from what the step says; the person can change it */
STEPS.guessTrig=s=>{s=s||{};const n=String(s.n||"")+" "+String(s.d||""),sla=String(s.sla||"");
 if(/weekly|daily|monthly|nightly|every/i.test(sla))return{type:"schedule",params:{every:sla.toLowerCase()}};
 if(/\bdue\b|in \d+ days|overdue|expir/i.test(n))return{type:"schedule",params:{every:"daily"}};
 if(/threshold|tolerance|exceed|above|below|drift|breach|over budget|cap\b/i.test(n))return{type:"metric",params:{metric:s.metric||"the step's measure",op:"crosses",value:"limit"}};
 if(/record|update|status|certificate|register/i.test(n))return{type:"record",params:{entity:"record",field:"status"}};
 return{type:"step",params:{step:s.prev?s.prev:"the previous step is done"}}};
STEPS.ensureTrig=s=>{if(s&&STEPS.needsTrigger(s.who)&&!(s.trig&&TR.get(s.trig.type)))s.trig=STEPS.guessTrig(s);return s};
STEPS.trigText=s=>{const k=SM.of(s&&s.who);if(k==="human")return"Starts by assignment";if(k==="gate")return"Starts when a request reaches it";
 return s&&s.trig?"Starts when "+lc(TR.label(s.trig)):"No trigger set"};
const lc=t=>String(t).charAt(0).toLowerCase()+String(t).slice(1);
STEPS.trigChip=s=>`<span class="stp-trig ${STEPS.cls(s&&s.who)}${STEPS.needsTrigger(s&&s.who)&&!(s&&s.trig)?" none":""}" title="${E(STEPS.trigText(s))}">${E(STEPS.trigText(s))}</span>`;
STEPS.trigOptions=cur=>TR.list().map(t=>`<option value="${t.id}" ${cur===t.id?"selected":""}>${E(t.label)}</option>`).join("");

/* ---------- agent definition (CL-74) ---------- */
const JUDG=/\b(recommend|draft|summar|classif|triage|propos|assess|predict|forecast|interpret|negotiat|decid|judg|suggest|analy[sz]|identif|extract|read|writ|explain|evaluat|review|prioriti|answer|resolv|diagnos|advis|cause|pattern|translat)/i;
const DET=/\b(list|compare|calculat|count|notif|tell|route|validat|reconcil|total|flag|threshold|toleranc|match|sum|copy|update|schedul|send|check|lookup|look up|post|archiv|log|release|remind|assign|sync|move|create)/i;
STEPS.robotTest=def=>{const t=String(def.task||"");const judge=JUDG.test(t)||(def.judgment&&def.judgment.length>0);const det=DET.test(t);
 return{robot:!judge&&det,judge,det,why:!judge&&det?"The task names no judgment, and the same input always gives the same output. A robot (a fixed if, then, else function) would do it with no model, no cost per run and exact tests.":judge?"The task needs judgment ("+(t.match(JUDG)||["judgment"])[0]+"), so an agent fits, with a person confirming.":"The task is not written precisely enough to test. Write the task first."}};
const TIERS={1:["Tier 1","Suggests only. A person does the action."],2:["Tier 2","Acts after a person approves each proposal."],3:["Tier 3","Acts inside its limits and reports. A person reviews samples."]};
const tierOf=v=>v==null?null:typeof v==="number"?Math.max(1,Math.min(3,v)):({suggest:1,propose:1,approval:2,approve:2,act:3,auto:3})[String(v).toLowerCase()]||2;
const ST=STEPS.state=STEPS.state||{};
STEPS.agentDef=function(name,ctx){ctx=ctx||{};name=String(name||ctx.name||"Studio Agent");
 const o=G(()=>ORGX.agentByName(name),null),c=G(()=>(W.CONTRACT&&CONTRACT.agents||[]).find(a=>a.n===name||a.id===name),null);
 const task=ctx.task||(o&&o.does)||(c&&c.purpose)||"";
 const tier=tierOf(ctx.tier!=null?ctx.tier:o?o.autonomy:ctx.autonomy)||(c?1:2);
 let conf=ctx.conf!=null?+ctx.conf:c?c.conf:o&&o.eval?o.eval.accept/100:.75;if(conf>1)conf=conf/100;
 const cap=ctx.cap!=null?+ctx.cap:.4,runs=o&&o.eval?o.eval.runs:120;
 const guide=(ctx.guides&&ctx.guides.length?ctx.guides:o&&o.guards&&o.guards.length?o.guards:c?c.guard:["Drafts only until a person accepts","Cites the records it used","Stops and asks when confidence is under the floor"]).slice();
 const sponsor=ctx.sponsor||(o&&o.sponsor)||(c?"Casey Rowan":"")||"";
 const st=ST[name]||(ST[name]={killed:o?o.status==="killed":false,paused:o?o.status==="paused":false});
 const trig=ctx.trig&&TR.get(ctx.trig.type)?ctx.trig:{type:"step",params:{step:ctx.prev||"the previous step is done"}};
 const v1=`Task: ${task||"not written"}\nWork only inside the tier and budget below. Below a ${Math.round(conf*100)}% confidence floor, stop and hand it to ${sponsor||"the sponsor"}.`;
 const prompts=[{v:"1.0",at:"2026-08-14",by:sponsor||"Sponsor",note:"First version",text:v1.split("\n")[0]},{v:"1.1",at:"2026-09-22",by:sponsor||"Sponsor",note:"Added the confidence floor and the hand-off",text:v1,cur:true}];
 return{name,task,tier,conf,cap,monthly:+(cap*runs).toFixed(2),runs,guide,sponsor,model:(o&&o.model)||(c&&c.model)||"Claude Sonnet",kill:(o&&o.kill)||"agent",state:st,trig,prompts,src:o?"Org chart agent registry":c?"Feature contract agents":"Defined on this step",judgment:ctx.judgment||null}};
STEPS.agentCard=function(def){const r=STEPS.robotTest(def),t=TIERS[def.tier]||TIERS[2],st=def.state;
 const kv=(k,v,s)=>`<div class="stp-kv"><small>${E(k)}</small><b>${v}</b>${s?`<span>${E(s)}</span>`:""}</div>`;
 const sp=def.sponsor?G(()=>W.ownerChip(def.sponsor,{role:"Sponsor"}),E(def.sponsor)):'<span class="stp-trig none">No sponsor named</span>';
 const ks=st.killed?'<span class="off">Stopped</span>':st.paused?'<span class="off">Paused</span>':'<span class="on">Running (simulated)</span>';
 return `<div class="stp-card" data-rsh-skip data-stp-card="${E(def.name)}">
 <div class="stp-head"><div class="stp-ht"><div class="eyebrow">Agent definition</div><h2>${E(def.name)}</h2><div class="row" style="gap:6px;flex-wrap:wrap">${SM.pill("agent")}<span class="stp-sim">Simulated</span><span class="small muted">${E(def.src)} · ${E(def.model)}</span></div></div></div>
 ${r.robot?`<div class="stp-robot" data-stp-robot="1"><b>Could be a robot.</b> ${E(r.why)}</div>`:""}
 <div class="stp-sec"><h4>Task</h4><p class="small" style="margin:0">${E(def.task||"No task written yet. An agent without a task is not allowed to run.")}</p></div>
 <div class="stp-grid">${kv("Tier",t[0],t[1])}${kv("Budget","$"+def.cap.toFixed(2)+" a run","About $"+def.monthly+" a month at "+def.runs+" runs (modeled)")}${kv("Confidence floor",Math.round(def.conf*100)+"%","Below this it hands off to the sponsor")}${kv("Trigger",E(TR.label(def.trig)),"From the shared trigger catalog")}</div>
 <div class="stp-sec"><h4>Human sponsor</h4>${sp}</div>
 <div class="stp-sec"><h4>Kill switch</h4><div class="stp-ks">${ks}<span class="small muted">Scope: ${E(def.kill==="agent"?"this agent":def.kill)}</span><button type="button" class="btn sm" data-stp-kill="${E(def.name)}">${st.killed?"Restore (simulated)":"Stop this agent (simulated)"}</button></div></div>
 <div class="stp-sec"><h4>Prompts, versioned</h4><ol class="stp-ver">${def.prompts.slice().reverse().map(p=>`<li class="${p.cur?"cur":""}"><b>v${E(p.v)}</b><span class="small muted">${E(p.at)} · ${E(p.by)} · ${E(p.note)}${p.cur?" · in use":""}</span><pre>${E(p.text)}</pre></li>`).join("")}</ol></div>
 <div class="stp-sec"><h4>Guidelines (v1.1)</h4><ul class="small" style="margin:0;padding-left:18px">${def.guide.map(g=>`<li>${E(g)}</li>`).join("")}</ul></div>
 <p class="small muted" style="margin:0">Simulated. No model runs in this prototype and no money is spent. Budget figures are modeled from the run count.</p></div>`};
STEPS.openAgent=function(name,ctx){STEPS._last={name,ctx};const def=STEPS.agentDef(name,ctx);if(typeof W.openDrawer==="function")W.openDrawer(STEPS.agentCard(def));return def};
/* any element with data-stp-agent opens the card; optional data-stp-task, data-stp-conf, data-stp-tier, data-stp-cap, data-stp-trig (type), data-stp-sponsor */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-stp-agent],[data-stp-kill]");if(!t)return;
 if(t.hasAttribute("data-stp-kill")){const n=t.getAttribute("data-stp-kill"),s=ST[n]||(ST[n]={});s.killed=!s.killed;s.paused=false;
  G(()=>toast(s.killed?n+" stopped (simulated)":n+" restored (simulated)"));const l=STEPS._last;if(l&&l.name===n)STEPS.openAgent(n,l.ctx);return}
 e.preventDefault();const d=t.dataset,ctx={};if(d.stpTask)ctx.task=d.stpTask;if(d.stpConf)ctx.conf=+d.stpConf;if(d.stpTier)ctx.tier=d.stpTier;if(d.stpCap)ctx.cap=+d.stpCap;if(d.stpSponsor)ctx.sponsor=d.stpSponsor;
 if(d.stpTrig){const[ty,pv]=d.stpTrig.split("|");if(TR.get(ty)){ctx.trig={type:ty,params:{}};if(pv)ctx.trig.params[STEPS.mainField(ty)]=pv}}
 STEPS.openAgent(d.stpAgent,ctx)});
STEPS.attrs=(name,ctx)=>{ctx=ctx||{};let a=` data-stp-agent="${E(name)}"`;if(ctx.task)a+=` data-stp-task="${E(ctx.task)}"`;if(ctx.conf!=null)a+=` data-stp-conf="${E(ctx.conf)}"`;if(ctx.tier!=null)a+=` data-stp-tier="${E(ctx.tier)}"`;if(ctx.cap!=null)a+=` data-stp-cap="${E(ctx.cap)}"`;if(ctx.sponsor)a+=` data-stp-sponsor="${E(ctx.sponsor)}"`;
 if(ctx.trig&&ctx.trig.type){const p=ctx.trig.params||{},pv=p[STEPS.mainField(ctx.trig.type)];a+=` data-stp-trig="${E(ctx.trig.type+(pv?"|"+pv:""))}"`}return a};

/* ---------- the registry: every agent, one card each ---------- */
function allAgents(){const out=[],seen=new Set();
 G(()=>ORGX.agents(),[]).forEach(a=>{if(!seen.has(a.name)){seen.add(a.name);out.push({name:a.name,src:"Org chart",task:a.does,sponsor:a.sponsor})}});
 G(()=>CONTRACT.agents,[]).forEach(a=>{if(!seen.has(a.n)){seen.add(a.n);out.push({name:a.n,src:"Feature contract",task:a.purpose,sponsor:""})}});return out}
STEPS.agents=allAgents;
G(()=>REG("agent_defs","Agent definitions","ai","M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",()=>{const L=allAgents(),rb=L.filter(a=>STEPS.robotTest({task:a.task}).robot).length;
 return `<div class="screen"><section class="card glass"><div class="eyebrow">AI oversight · Agent definitions</div><h2 style="margin:2px 0 6px">Every agent, defined in one card</h2>
 <p class="small muted">${L.length} agents (prototype fact). Each card holds the task, versioned prompts and guidelines, tier, budget, confidence floor, kill switch, human sponsor and trigger. <b>${rb}</b> read as deterministic and could be a robot. All values are simulated.</p>${STEPS.legend()}
 <div class="stp-reg">${L.map(a=>{const r=STEPS.robotTest({task:a.task});return `<button type="button" class="card glass"${STEPS.attrs(a.name,{task:a.task,sponsor:a.sponsor})}><b>${E(a.name)}</b><span class="small muted">${E(a.src)}${a.sponsor?" · sponsor "+E(a.sponsor):""}</span><span class="small">${E(String(a.task||"No task written").slice(0,120))}</span>${r.robot?'<span class="stepmode sm-robot">Could be a robot</span>':""}</button>`}).join("")}</div></section></div>`}));
G(()=>NAVX.add("agent_defs",{group:"ai",label:"Agent definitions",hint:"Task, prompts, tier, budget, confidence floor, kill switch, sponsor and trigger for every agent",sub:"Agent cards",kw:"agent definition card prompt guideline tier budget confidence floor kill switch sponsor trigger robot deterministic"}));
})();
