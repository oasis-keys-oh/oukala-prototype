/* Round 26 (part 1): how the studio designs the guardrails. Standards for every step, and the agent or robot decision for every step.
   Everything here is computed from the process being built, so it works for any example and for anything a person types. */
(function(){
const W=window,D=document,SD=W.STUD,Xs=W.STUDIO&&W.STUDIO.x;if(!Xs||!SD)return;
const X=Xs,{E,G,Q,WHO,head,tile,eyebrow,canvas,flatSteps,say,later,render,STAFF}=X,V=X.views;
const A=()=>!Q.fast;
const steps=()=>flatSteps();
const tag=(c,t)=>`<span class="r26-tg ${c}">${E(t)}</span>`;
const SMK=v=>W.STEPMODE?STEPMODE.of(v):v;
const who=k=>`<span class="r26-who ${WHO[SMK(k)][1]}"><i class="stu-dot ${WHO[SMK(k)][1]}"></i>${WHO[SMK(k)][0]}</span>`;
X.pickPerson=function(re,fallback){const s=STAFF();const p=s.find(x=>re.test(x.role+" "+x.unit));return p?p.n:(fallback||X.me())};
X.person=function(n){return G(()=>ORGX.P(n),null)};
X.initials=n=>String(n||"?").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();

/* ---------- the agent or robot decision, step by step (a robot is a fixed if, then, else function) ---------- */
const STRONG_FN=/\b(list|compare|calculate|count|schedule|notify|tell|route|validate|reconcile|total|flag|trigger|timer|tolerance|threshold|duplicate|complete and not|update record|release|restock|refund|invoice|post|archive|log)\b/i;
const STRONG_AI=/\b(draft|summar|classif|triage|recommend|predict|forecast|pattern|cause to|match the cause|suggest|analy[sz]e|identify|translate|extract|read)\b/i;
const GATE=/\b(approv|sign|decid|authori[sz]e|accept|review an?|review the|review)\b/i;
function repeats(s){return /instant|same shift|weekly|daily|per|1 day|immediate/i.test(s.sla||"")||SMK(s.who)==="robot"?"often":/week|month/i.test(s.sla||"")?"sometimes":"sometimes"}
function risk(s){return /sign|approv|batch|safety|payment|refund|release|decid|hold|permit|isolat|lockout|contract/i.test(s.n)?"high":/review|restock|claim|calibrat/i.test(s.n)?"medium":"low"}
X.classify=function(s){
 const n=s.n||"",r=risk(s),rep=repeats(s),k=SMK(s.who);
 if(k==="gate"||GATE.test(n)&&k!=="robot")return{v:"gate",rec:"gate",r,rep,why:"A decision with consequences stays with a named person. I prepare the evidence so the decision takes minutes, but it is theirs."};
 if(STRONG_AI.test(n)&&k!=="robot"&&!/tolerance|threshold|compare/i.test(n))return{v:"agent",rec:"agent",r:r==="high"?"medium":"low",rep,why:"The input is messy and the work repeats, but a wrong guess is cheap because a person confirms it. Good work for an AI agent."};
 if(k==="robot")return{v:"robot",rec:"robot",r,rep,why:"Already a robot. It runs the same way every time its trigger fires."};
 if(STRONG_FN.test(n)&&(k==="agent"||/list|compare|calculate|count|notify|route|schedule|validate|flag/i.test(n)))return{v:"robot",rec:"robot",r:"low",rep,why:"Same input, same answer. A fixed rule does this instantly, costs nothing per run and can be tested exactly. An agent would add cost, delay and a chance of a different answer, so I recommend a robot."};
 if(k==="agent")return{v:"agent",rec:"agent",r:"low",rep,why:"The input varies and a person confirms the result. An AI agent fits, with a person as the safety net."};
 return{v:"human",rec:"human",r,rep,why:/physical|pull|calibrat|inspect|receive|repair|visit|negotiat|meet|talk|photo/i.test(n)?"Physical or hands-on work. Nothing to automate here.":"Judgment, context or a relationship. I keep a person on it and make their part faster."}};
const KIND={human:"human",gate:"gate",robot:"robot",agent:"agent"};
function agentRows(){const st=steps();return st.map((s,i)=>{const c=X.classify(s);return Object.assign({s,i,cur:SMK(s.who),tgt:KIND[c.rec]},c)})}
X.applyAgents=function(){let n=0,rm=0;agentRows().forEach(r=>{if(r.s.base)return;if(r.tgt!==r.cur&&!r.s.keep){if(r.cur==="agent"&&r.tgt==="robot")rm++;X.setWhoQuiet(r.s,r.tgt);n++}});Q.B.agentsDone={n,rm};Q.B.fnApplied=true;return{n,rm}};
X.setWhoQuiet=function(s,to){to=SMK(to);if(!s.was)s.was=SMK(s.who);s.who=to;const P=W.STEPKIT;s.owner=P?P.ownerFor(to,s.owner):s.owner;if(P)P.ensureTrig(s)};

V.agents=function(){const B=Q.B,rows=agentRows(),applied=!!B.fnApplied,m={human:0,gate:0,robot:0,agent:0};rows.forEach(r=>m[r.cur]++);
 const mt={human:0,gate:0,robot:0,agent:0};rows.forEach(r=>mt[r.s.base?r.cur:r.tgt]++);
 const chg=rows.filter(r=>!r.s.base&&r.tgt!==r.cur&&!applied);const rmAg=rows.filter(r=>!r.s.base&&r.cur==="agent"&&r.tgt==="robot").length+(B.agentsDone?B.agentsDone.rm:0);
 const top=rows.filter(r=>!r.s.base);const showN=top.length>14?14:top.length;
 const tiles=["human","gate","robot","agent"].map(k=>`<div class="stu-k card glass r26-kk ${WHO[k][1]}"><small>${WHO[k][0]}</small><b>${m[k]}</b><span>${applied?"now":mt[k]!==m[k]?"proposed "+mt[k]:"as drafted"}</span></div>`).join("");
 return `${head("Where AI helps",'Agent, robot or a person','I asked one question of every step: <i>is the answer always the same for the same input?</i>')}
 <div class="r26-tree card glass"><span class="r26-q">Same answer every time?</span><i>yes</i>${who("robot")}<span class="r26-sep">or</span><i>no, but a wrong guess is cheap to catch</i>${who("agent")}<span class="r26-sep">or</span><i>no, and it matters</i>${who("human")}</div>
 <div class="stu-ks r26-ks5">${tiles}</div>
 ${rmAg?`<p class="r26-call"><b>${rmAg} step${rmAg>1?"s":""} did not need an agent.</b> A fixed rule does the job, so I made ${rmAg>1?"them":"it"} a <b>robot</b>: the indigo kind of step, with no model, no cost per run and exact tests.</p>`:""}
 <div class="r26-vg">${top.slice(0,showN).map(r=>{const chg=!applied&&r.tgt!==r.cur,end=applied?r.cur:r.tgt;
  return `<div class="r26-vc card glass ${KIND[end]}"><div class="r26-vh"><em>${r.i+1}</em><b>${E(r.s.n)}</b></div><div class="r26-vk">${chg||applied&&r.s.was?`${who(applied?(r.s.was||r.cur):r.cur)}<span class="r26-ar" aria-hidden="true">→</span>`:""}${who(end)}${r.tgt==="robot"&&r.cur==="agent"?tag("neg","No AI needed"):""}</div><p>${E(r.why)}</p><div class="r26-vm"><span>Repeats <b>${r.rep}</b></span><span>If wrong <b>${r.r}</b></span></div></div>`}).join("")}</div>
 ${top.length>showN?`<p class="stu-sum">Showing ${showN} of ${top.length}. The rest follow the same test.</p>`:""}
 <h3>The process, with every step on its own lane</h3>${B.phases?`<p class="stu-note">${steps().length} steps in ${B.phases.length} phases. Open Process to see each phase.</p>`:canvas(B.steps,"")}
 ${!applied&&chg.length?`<div class="stu-cta"><button class="btn primary" data-r26-agents="1">Apply the ${chg.length} recommendation${chg.length>1?"s":""}</button></div>`:""}`}

/* ---------- industry standards, step by step ---------- */
const STDS=[
 [/calibrat|tolerance|instrument|reading/i,"ISO/IEC 17025","6.4 Equipment, 6.5 Traceability","Record the reference standard used, and its own calibration date, on every certificate.","adds a field"],
 [/sign|approv/i,"ISO 9001","7.5.3 Control of documented information","Signer must differ from the person who did the work. Keep the signature with the record.","adds a rule"],
 [/review|decide|go ahead/i,"COSO internal control","Control activities","Set a time limit and say who decides when the reviewer is away.","adds a time limit"],
 [/receive|inspect|return|damage|restock|write off/i,"ISO 9001","8.6 Release, 8.7 Nonconforming outputs","Hold nonconforming items apart and record why before any restock or write-off.","adds a hold"],
 [/claim|refund|pay|invoice|credit/i,"SOX 404 and COSO","Segregation of duties","The person who approves a payment is not the person who triggers it. Log both.","adds a check"],
 [/record|update|certificate|archive|log/i,"ISO 9001","7.5 Documented information","Keep the record immutable once signed, with a retention period.","adds retention"],
 [/notify|tell|list|schedule|due/i,"ITIL 4","Monitoring and event management","Send one notice, then one reminder, then escalate. Never silence.","adds escalation"],
 [/request|raise|intake|complete and not|duplicate/i,"BPMN 2.0","Start events and exception paths","Name the start, the end and each exception path so nothing waits unseen.","adds an exit path"],
 [/batch|hold|quality|affected/i,"ISO 9001","8.7 Control of nonconforming outputs","Quarantine affected batches automatically until quality releases them.","adds a hold"],
 [/discount|price|bundle|promotion|offer/i,"Delegation of authority","Pricing authority","Discounts above the member threshold need the commercial lead's approval.","adds an approval"],
 [/shutdown|turnaround|permit|lockout|isolat|outage|plant/i,"ISO 45001","8.1 Operational control","Isolation and permits come before any work. Verify zero energy before the first task.","adds a permit"],
 [/contract|vendor|supplier|procure|buy/i,"ISO 20400","Sustainable procurement","Check the supplier against the approved list before any commitment.","adds a check"],
 [/train|handover|knowledge|document/i,"ISO 30401","Knowledge management","Capture what was learned as an article while it is fresh.","adds an article"]];
X.stdFor=function(s){const m=STDS.find(r=>r[0].test(s.n));return m?{std:m[1],cl:m[2],rec:m[3],eff:m[4]}:null};
function stdRows(){return steps().map((s,i)=>Object.assign({s,i},X.stdFor(s)||{})).filter(r=>r.std)}
V.stdstep=function(){const B=Q.B,rows=stdRows(),rest=steps().length-rows.length;B.stdOff=B.stdOff||{};
 const on=rows.filter(r=>!B.stdOff[r.i]).length;const shown=rows.slice(0,16);
 return `${head("Standards","Recommended for each step",`${rows.length} of ${steps().length} steps have a specific recommendation from an industry standard. <b>${on}</b> adopted.`)}
 <div class="r26-sl">${shown.map(r=>{const off=B.stdOff[r.i];return `<div class="r26-sr card glass ${off?"off":""}"><div class="r26-sn"><em class="${WHO[SMK(r.s.who)][1]}">${r.i+1}</em><b>${E(r.s.n)}</b></div><div class="r26-sb"><span class="r26-std">${E(r.std)}</span><small>${E(r.cl)}</small></div><p>${E(r.rec)}</p><label class="r26-ad"><input type="checkbox" data-r26-std="${r.i}" ${off?"":"checked"}><span>${off?"Skipped":"Added: "+E(r.eff)}</span></label></div>`}).join("")}</div>
 ${rows.length>shown.length?`<p class="stu-sum">Showing ${shown.length} of ${rows.length}.</p>`:""}
 ${rest>0?`<p class="stu-note">The other ${rest} steps follow BPMN 2.0 naming, one start and one end, with every exception named.</p>`:""}`}

/* ---------- events ---------- */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r26-agents]");if(!t||!D.getElementById("stuRoot"))return;const r=X.applyAgents();say("Applied. "+r.n+" step"+(r.n===1?"":"s")+" changed"+(r.rm?", and "+r.rm+" no longer need"+(r.rm===1?"s":"")+" an AI agent":"")+". Click any step on the lanes to change it back.");render()});
D.addEventListener("change",e=>{const t=e.target;if(!t.matches||!t.matches("[data-r26-std]")||!D.getElementById("stuRoot"))return;Q.B.stdOff[+t.dataset.r26Std]=!t.checked;say(t.checked?"Added the recommendation to the step.":"Skipped. I logged that you chose not to follow the standard here.");render()});
X.design={rows:agentRows,stdRows};
})();
