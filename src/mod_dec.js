/* ===== mod_dec: Decision rules for EVERY process =====
   Answer to "would Decision rules exist for every process, or only the ones listed on top?":
   before this module only 4 seeded decision tables (Automation > Decision tables) and 5 generic approval-policy families
   (PROC.policyFor, matched by screen name, shown on gate steps of screen processes) existed; the Process library had none.
   This module derives the decision points of every process in PROCLIB (gate steps, then steps that approve, triage, review, release,
   accept or close), gives each an AI-drafted default decision table that a person must accept, and adds coverage reporting.
   Screen: dec_cov (Decision rules, group automate). Exposes window.DECX {rulesFor, coverage, add, test, accept, ...}.
   Prefix: dx / data-dx. State: S.decx (S.dec is taken by the approvals demo). Everything touching other modules is lazy and guarded. */
(function(){
"use strict";
S.decx=S.decx||{rules:{},byId:{},seq:0,open:{},tab:0,seeded:false,rev:0};
const D=S.decx,E=esc;
const TODAY="2026-10-06";
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const clone=o=>JSON.parse(JSON.stringify(o));
const pct=(a,b)=>b?Math.round(100*a/b):0;
const hash=s=>{let h=7;s=String(s);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%9973;return h};
const G=(fn,d)=>{try{return fn()}catch(e){return d}};
const who_=n=>G(()=>window.who&&who(n),null);
const chip=n=>n?(who_(n)&&typeof pchip==="function"?pchip(n):`<span class="chip">${E(n)}</span>`):'<span class="pill warn">No owner</span>';
const me=()=>G(()=>window.CURUSER?CURUSER.name():(S.persona==="exec"?"Casey Rowan":PERSONAS[S.persona].n),"Casey Rowan");
const fD=s=>s?G(()=>new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),s):"open";

/* ---------- decision table evaluation (uses the Decision tables engine when mod_flow exposes it) ---------- */
const NUMTOK=/^(<=|>=|<|>|=)?\s*(-?[\d.]+)$/;
function fbEntry(s,type){s=String(s==null?"":s).trim();if(s===""||s==="-")return{any:1};
 if(type==="num"){const iv=[];for(const part of s.split(",")){const p=part.trim();let m;
   if(m=p.match(/^([\[\(])\s*(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)\s*([\]\)])$/))iv.push({lo:+m[2],hi:+m[3],li:m[1]==="[",hi_i:m[4]==="]"});
   else if(m=p.match(NUMTOK)){const v=+m[2],o=m[1]||"=";iv.push(o==="<="?{lo:-1e15,hi:v,li:1,hi_i:1}:o==="<"?{lo:-1e15,hi:v,li:1,hi_i:0}:o===">="?{lo:v,hi:1e15,li:1,hi_i:1}:o===">"?{lo:v,hi:1e15,li:0,hi_i:1}:{lo:v,hi:v,li:1,hi_i:1})}
   else return{err:"Cannot read “"+p+"”"}}
  return{num:iv}}
 let neg=false,b=s;const m=s.match(/^not\((.*)\)$/i);if(m){neg=true;b=m[1]}
 return{set:b.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean),neg}}
function fbMatch(d,v,type){if(d.any)return true;if(d.err)return false;if(d.num){const n=+v;if(v===""||isNaN(n))return false;return d.num.some(i=>(n>i.lo||(i.li&&n===i.lo))&&(n<i.hi||(i.hi_i&&n===i.hi)))}const h=d.set.includes(String(v).toLowerCase());return d.neg?!h:h}
function decideT(t,vals){
 if(window.DMNX&&DMNX.decide){try{const d=DMNX.decide(t,vals);return{fired:d.fired,err:d.err,matches:d.matches}}catch(e){}}
 const vs=t.inputs.map(i=>vals[i.k]==null?"":vals[i.k]),m=[];
 t.rows.forEach((r,ri)=>{if(r.c.every((c,i)=>fbMatch(fbEntry(c,t.inputs[i].t),vs[i],t.inputs[i].t)))m.push(ri)});
 return{fired:m.slice(0,1),matches:m,err:null}}
function analyzeT(t){
 if(window.DMNX&&DMNX.analyze){try{const a=DMNX.analyze(t);return{bad:a.bad||[],gaps:(a.gaps||[]).map(v=>t.inputs.map((inp,i)=>inp.l.toLowerCase()+" "+v[i]).join(", ")),ov:(a.ov||[]).length,shadow:(a.shadow||[]).length}}catch(e){}}
 const bad=[];t.rows.forEach((r,ri)=>r.c.forEach((c,ci)=>{const d=fbEntry(c,t.inputs[ci].t);if(d.err)bad.push("Row "+(ri+1)+", "+t.inputs[ci].l+": "+d.err)}));
 const last=t.rows[t.rows.length-1],catchAll=last&&last.c.every(c=>String(c).trim()===""||String(c).trim()==="-");
 return{bad,gaps:catchAll?[]:["No catch-all row, so some inputs may match nothing"],ov:0,shadow:0}}

/* ---------- templates: the AI-drafted defaults ---------- */
const YN=["Yes","No"],RISK=["Low","Medium","High"];
const KINDS=[["approval","Approval"],["route","Route or triage"],["review","Review or assess"],["eligibility","Eligibility or exception"],["release","Release or go-live"],["completion","Completion check"]];
const KN=Object.fromEntries(KINDS);
const MODES=[["human","Human decides"],["recommend","AI recommends"],["auto","Auto-decide within limits"]];
const MN=Object.fromEntries(MODES);
const R=(c,o)=>({c,o});
function tmpl(kind,P,step){
 const pol=G(()=>PROC.policyFor(P.id),{key:"gen",amt1:5000,amt2:50000,conf:85});
 const a1=pol.amt1||5000,a2=pol.amt2||50000;
 const O=[{k:"outcome",l:"Outcome"},{k:"by",l:"Decided by"}];
 if(kind==="approval"){
  if(pol.key==="chg")return{hp:"first",inputs:[{k:"score",l:"Risk score (0 to 100)",t:"num"},{k:"type",l:"Change type",t:"txt",o:["Standard","Normal","Emergency"]},{k:"freeze",l:"In a freeze window",t:"txt",o:YN}],outputs:O,
   rows:[R(["-","Standard","No"],["Pre-approved","System"]),R(["-","Emergency","No"],["Approve","Emergency board"]),R(["-","-","Yes"],["Escalate","Freeze exception panel"]),R(["<= 30","Normal","No"],["Approve","Change manager"]),R(["(30..60]","Normal","No"],["Approve","Change advisory board"]),R(["> 60","-","-"],["Approve","Board plus CIO"]),R(["-","-","-"],["Needs approver","Change manager"])],sample:{score:54,type:"Normal",freeze:"No"},purpose:"Maps change type, risk and freeze status to who decides."};
  if(pol.key==="inv")return{hp:"first",inputs:[{k:"amount",l:"Invoice amount",t:"num"},{k:"po",l:"PO match",t:"txt",o:["Match","Mismatch","Missing"]},{k:"risk",l:"Vendor risk",t:"txt",o:RISK},{k:"accepted",l:"Work accepted",t:"txt",o:YN}],outputs:O,
   rows:[R(["-","Mismatch,Missing","-","-"],["Reject to vendor","AP clerk"]),R(["-","-","High","-"],["Hold for vendor review","Vendor manager"]),R(["-","-","-","No"],["Hold until accepted","Project manager"]),R(["<= 25000","Match","Low,Medium","Yes"],["Auto-approve","System"]),R(["(25000..50000]","Match","-","Yes"],["Single approval","Controller"]),R(["> 50000","Match","-","Yes"],["Dual approval","Controller plus CIO"]),R(["-","-","-","-"],["Needs approver","Controller"])],sample:{amount:18000,po:"Match",risk:"Low",accepted:"Yes"},purpose:"Routes every invoice by amount, match, vendor risk and acceptance."};
  return{hp:"first",inputs:[{k:"amount",l:"Amount at stake",t:"num"},{k:"risk",l:"Risk",t:"txt",o:RISK},{k:"exception",l:"Policy exception",t:"txt",o:YN}],outputs:O,
   rows:[R(["-","-","Yes"],["Escalate to owner","Process owner"]),R(["-","High","-"],["Needs approver","Approver"]),R(["<= "+a1,"Low","No"],["Auto-approve","System"]),R(["<= "+a2,"Low,Medium","No"],["Approve after AI evidence review","AI agent; a person can overrule"]),R(["-","-","-"],["Needs approver","Approver"])],sample:{amount:12000,risk:"Medium",exception:"No"},purpose:"Splits decisions into pre-approved, AI-reasoned and human, using this family's limits ("+pol.name+")."}}
 if(kind==="route")return{hp:"first",inputs:[{k:"type",l:"Request type",t:"txt",o:["Standard","Non-standard","Sensitive data"]},{k:"urgency",l:"Urgency",t:"txt",o:RISK}],outputs:[{k:"outcome",l:"Route to"},{k:"by",l:"Respond within"}],
  rows:[R(["Sensitive data","-"],["Data steward","1 business day"]),R(["Standard","High"],["On-call team","1 hour"]),R(["Standard","Low,Medium"],["Team queue","1 business day"]),R(["Non-standard","-"],["Owner for triage","4 hours"]),R(["-","-"],["Team queue","1 business day"])],sample:{type:"Standard",urgency:"High"},purpose:"Chooses where work goes next and how fast."};
 if(kind==="review")return{hp:"first",inputs:[{k:"evidence",l:"Evidence complete",t:"txt",o:YN},{k:"risk",l:"Risk",t:"txt",o:RISK},{k:"open",l:"Open findings",t:"num"}],outputs:O,
  rows:[R(["No","-","-"],["Return for evidence","Submitter"]),R(["-","High","-"],["Escalate","Process owner"]),R(["Yes","Medium","> 0"],["Proceed with conditions","Reviewer"]),R(["Yes","Low,Medium","-"],["Proceed","Reviewer"]),R(["-","-","-"],["Needs reviewer","Reviewer"])],sample:{evidence:"Yes",risk:"Medium",open:2},purpose:"Decides whether the work passes review, goes back, or is escalated."};
 if(kind==="eligibility")return{hp:"first",inputs:[{k:"meets",l:"Meets criteria",t:"txt",o:YN},{k:"exception",l:"Exception requested",t:"txt",o:YN},{k:"value",l:"Value at stake",t:"num"}],outputs:O,
  rows:[R(["Yes","No","-"],["Accept","Reviewer"]),R(["No","Yes","<= "+a1],["Grant exception","Process owner"]),R(["No","Yes","> "+a1],["Exception board","Governance board"]),R(["No","No","-"],["Decline with reason","Reviewer"]),R(["-","-","-"],["Needs reviewer","Reviewer"])],sample:{meets:"No",exception:"Yes",value:2500},purpose:"Decides who qualifies and who may get an exception."};
 if(kind==="release")return{hp:"first",inputs:[{k:"tests",l:"Tests passed",t:"txt",o:YN},{k:"freeze",l:"In a freeze window",t:"txt",o:YN},{k:"risk",l:"Risk",t:"txt",o:RISK}],outputs:O,
  rows:[R(["No","-","-"],["Hold","Release manager"]),R(["-","Yes","-"],["Hold for exception","Freeze exception panel"]),R(["Yes","No","High"],["Needs approver","Change advisory board"]),R(["Yes","No","Low,Medium"],["Release","Release manager"]),R(["-","-","-"],["Hold","Release manager"])],sample:{tests:"Yes",freeze:"No",risk:"Low"},purpose:"Decides whether work may go live now, wait, or needs approval."};
 return{hp:"first",inputs:[{k:"criteria",l:"Acceptance criteria met",t:"txt",o:YN},{k:"issues",l:"Open issues",t:"num"}],outputs:O,
  rows:[R(["No","-"],["Return to previous step","Process owner"]),R(["Yes","> 0"],["Close with follow-up","Process owner"]),R(["Yes","<= 0"],["Close","Process owner"]),R(["-","-"],["Needs owner","Process owner"])],sample:{criteria:"Yes",issues:0},purpose:"Decides whether the process can close or must go back."}}

const KRX=[["route",/triag|route|prioriti|classif|categor|assign/i],["release",/releas|go.?live|publish|promot|deploy|ship/i],["eligibility",/exception|eligib|waiv|accept|qualif/i],["review",/review|assess|verify|validate|check|evaluate|score|inspect/i]];
function kindOf(s){const t=(s.n||"")+" "+(s.d||"");if(s.who==="gate")return/triag|route|prioriti/i.test(s.n||"")?"route":/releas|go.?live/i.test(s.n||"")?"release":"approval";
 if(/\b(approv|authori[sz]|sign.?off|decide|decision)\w*/i.test(t))return"approval";for(const k of KRX)if(k[1].test(t))return k[0];return null}
function candidates(steps){
 const c=[];steps.forEach((s,i)=>{const k=kindOf(s);if(k&&(s.who==="gate"||c.filter(x=>x.step.who!=="gate").length<2))c.push({i,step:s,kind:k})});
 c.sort((a,b)=>(b.step.who==="gate")-(a.step.who==="gate")||a.i-b.i);
 let out=c.slice(0,4);
 if(!out.length&&steps.length){const i=steps.length-1;out=[{i,step:steps[i],kind:"completion",suggested:true}]}
 return out.sort((a,b)=>a.i-b.i)}

/* ---------- owners and approvers (org chart when present) ---------- */
const DOMX=[[/budget|forecast|financ|spend|invoice|cost|allocation|showback|reconcil/i,"budget"],[/vendor|contract|sow|procure/i,"vendor management"],[/change|advisory|cab\b/i,"change"],[/incident|problem|major/i,"incidents"],[/release|deploy|pipeline|sprint|train/i,"releases"],[/risk/i,"risk"],[/secur|access|identity/i,"security"],[/data|entity|model|registry/i,"data governance"],[/knowledge|article|answer/i,"knowledge"],[/\bAI\b|agent|prompt|gateway|oversight/i,"AI governance"],[/hire|people|perform|joiner|skill|resource/i,"people"],[/portfolio|project|demand|plan|schedule|benefit/i,"portfolio"],[/strateg|objective|board/i,"strategy"]];
function orgxApprover(text){
 if(!window.ORGX||!ORGX.byDomain)return null;
 let d="";for(const x of DOMX)if(x[0].test(text)){d=x[1];break}if(!d)return null;
 try{const r=ORGX.byDomain(d);if(!r)return null;
  const nm=v=>{if(!v)return"";if(typeof v==="string"){const p=(ORGX.people||[]).find(x=>x.id===v);return p?p.name:v}return v.name||""};
  const o=Array.isArray(r)?r[0]:r.owner||r.ownerId||r;const b=Array.isArray(r)?r[1]:r.backup||r.backupId;
  const name=nm(o);return name?{name,backup:nm(b),domain:d}:null}catch(e){return null}}
function ownerOfStep(P,step){
 const so=step&&step.owner;if(so&&who_(so))return so;
 const po=P.owner;return po&&who_(po)?po:(po&&!/\(no named owner\)/.test(po)&&P.named?po:"")}

/* ---------- materializing rules ---------- */
function mkRule(P,steps,c,i){
  const t=tmpl(c.kind,P,c.step),own=ownerOfStep(P,c.step),ox=orgxApprover((P.name||"")+" "+(c.step.n||"")+" "+(P.familyName||""));
  const rid=P.id+"#"+(++D.seq);
  const draftConf=.72+(hash(rid)%20)/100;
  const stepOwner=c.step.owner||"";
  const r={id:rid,proc:P.id,stepIdx:c.i,stepName:c.step.n||"",who:c.step.who||"human",kind:c.kind,name:(c.step.n||"Decision")+(c.suggested?" (suggested)":""),purpose:t.purpose,
   hp:t.hp,inputs:t.inputs,outputs:t.outputs,rows:t.rows,sample:t.sample,mode:c.step.who==="gate"?"recommend":"recommend",conf:85,limit:t.inputs.some(x=>/amount|value|cost/i.test(x.k))?(G(()=>PROC.policyFor(P.id).amt1,5000)):0,
   owner:own,approver:ox?ox.name:(stepOwner&&!/^(Approver|Reviewer|Requester)$/i.test(stepOwner)?stepOwner:(own||"")),approverSrc:ox?"org chart · "+ox.domain:(stepOwner?"process step owner":"process owner"),backup:ox?ox.backup:"",
   status:"draft",version:1,effFrom:TODAY,effTo:"",evidence:[],tests:[],history:[{v:1,at:TODAY,by:"Decision rules drafter (AI)",note:"Drafted default from the process step, its approval-policy family and its neighbors"}],dirty:false,
   ai:{model:"Claude Sonnet",conf:+draftConf.toFixed(2),why:c.suggested?"No step in this process approves, routes or reviews, so the closing step is proposed as the one decision that needs a rule.":"Drafted from the step \""+(c.step.n||"")+"\" ("+({gate:"approval gate",agent:"AI agent step",robot:"robot step",human:"person step"})[STEPMODE.of(c.step.who||"human")]+") and the "+(G(()=>PROC.policyFor(P.id).name,"approval"))+" limits."},custom:false};
  D.byId[rid]=r;return r}
function ensure(pid){
 if(D.rules[pid])return D.rules[pid];
 let P=G(()=>PROCLIB.get(pid),null);if(!P)return[];
 const steps=P.stepsList||[];D.rules[pid]=[];
 candidates(steps).forEach((c,i)=>D.rules[pid].push(mkRule(P,steps,c,i)));
 seedOne(pid);return D.rules[pid]}
const SEEDS={inv:{kind:0,mode:"auto",limit:25000,src:"dt_inv",ev:"Seeded from Decision tables: Invoice auto-approval (dt_inv). 4 of the last 6 holds under $5,000 were released unchanged."},itsm_chg:{kind:0,mode:"recommend",src:"dt_chg",ev:"Seeded from Decision tables: Change risk to approver (dt_chg)."},itsm_inc:{kind:0,mode:"auto",src:"dt_pri",ev:"Seeded from Decision tables: Ticket priority matrix (dt_pri). Deterministic ITIL impact and urgency grid."},bud_doa:{kind:0,mode:"human",src:"policy",ev:"Delegation of authority matrix approved by the CFO office."},svc_req:{kind:0,mode:"recommend",src:"policy",ev:"Request approval policy (catalog), approved by service owners."},fin_gates:{kind:0,mode:"recommend",src:"policy",ev:"Funding gate criteria approved by the steering committee."}};
function seedOne(pid){
 const s=SEEDS[pid],L=D.rules[pid];if(!s||!L||!L.length)return;let r=L.find(x=>x.kind==="approval"&&x.who==="gate")||L.find(x=>x.kind==="approval")||L[0];
 if(r.kind!=="approval"&&s.src!=="dt_pri"){const P=G(()=>PROCLIB.get(pid),null);if(P){const t=tmpl("approval",P,{});Object.assign(r,{kind:"approval",inputs:t.inputs,outputs:t.outputs,rows:t.rows,sample:t.sample,purpose:t.purpose})}}
 if(s.src==="dt_pri"){const t=G(()=>DMNX.tables().find(x=>x.id==="dt_pri"),null);
  r.kind="route";r.name="Set priority from impact and urgency";r.inputs=[{k:"impact",l:"Impact",t:"txt",o:RISK.slice().reverse()},{k:"urgency",l:"Urgency",t:"txt",o:RISK.slice().reverse()}];r.outputs=[{k:"outcome",l:"Priority"},{k:"by",l:"Respond within"}];
  r.rows=(t?t.rows.map(x=>({c:x.c.slice(),o:x.o.slice()})):[["High","High","P1","15 minutes"],["High","Medium","P2","1 hour"],["Medium","High","P2","1 hour"],["High","Low","P3","4 hours"],["Medium","Medium","P3","4 hours"],["Low","High","P3","4 hours"],["Medium","Low","P4","1 business day"],["Low","Medium","P4","1 business day"],["Low","Low","P5","3 business days"]].map(a=>R([a[0],a[1]],[a[2],a[3]])));r.sample={impact:"High",urgency:"Medium"};r.purpose="The ITIL priority grid: impact crossed with urgency sets the response target."}
 r.status="accepted";r.mode=s.mode;if(s.limit)r.limit=s.limit;r.acceptedBy="Seeded from "+(s.src.indexOf("dt_")===0?"Decision tables":"the approval policy");r.acceptedAt="2026-09-14";r.version=2;
 r.history.push({v:2,at:"2026-09-14",by:r.acceptedBy,note:"Existing rule imported and accepted"});r.evidence.push({at:"2026-09-14",by:r.acceptedBy,note:s.ev});
 if(pid==="inv"||pid==="itsm_chg"||pid==="itsm_inc"){const v=r.sample,d=decideT(r,v),row=r.rows[(d.fired||[])[0]];if(row)r.tests.push({at:"2026-09-20",vals:clone(v),out:row.o[0],expect:row.o[0],pass:true,by:"Seed"})}
 if(!r.owner){const po=G(()=>PROCLIB.get(pid).owner,"");r.owner=po}}
function all(){return G(()=>PROCLIB.list(),[])}
function rulesFor(pid){return ensure(pid).map(clone)}
function allRules(){const L=[];all().forEach(P=>ensure(P.id).forEach(r=>L.push(r)));return L}
const live=r=>r.status!=="retired";
const eff=r=>r.status==="retired"?["Retired","mute"]:r.effFrom>TODAY?["Scheduled","info"]:(r.effTo&&r.effTo<TODAY)?["Expired","bad"]:r.status==="accepted"?["Accepted v"+r.version,"good"]:["AI draft","warn"];

/* ---------- coverage ---------- */
function coverage(){
 const L=all(),rows=[];let dp=0,acc=0,dr=0,noOwn=0,noTest=0,auto=0,autoOk=0,none=0,withAcc=0,withAny=0,tested=0;const dom={},queue=[],gaps={noOwner:[],noTest:[],autoNoLimit:[],noPoints:[]};
 L.forEach(P=>{const rs=ensure(P.id).filter(live);const a=rs.filter(r=>r.status==="accepted"),d=rs.filter(r=>r.status!=="accepted");
  const no=rs.filter(r=>!r.owner).length,nt=a.filter(r=>!r.tests.some(t=>t.pass)).length+d.filter(r=>!r.tests.length).length;
  dp+=rs.length;acc+=a.length;dr+=d.length;noOwn+=no;noTest+=nt;if(a.length)withAcc++;if(rs.length)withAny++;else{none++;gaps.noPoints.push(P)}
  a.forEach(r=>{if(r.tests.some(t=>t.pass))tested++;});
  rs.forEach(r=>{if(!r.owner)gaps.noOwner.push(r);if(!r.tests.length)gaps.noTest.push(r);if(r.mode==="auto"){auto++;const ok=r.status==="accepted"&&(+r.conf>=70)&&r.tests.some(t=>t.pass)&&(!/amount|value|cost/i.test(r.inputs.map(x=>x.k).join(" "))||+r.limit>0);if(ok)autoOk++;else gaps.autoNoLimit.push(r)}
   if(r.status!=="accepted")queue.push(r)});
  const f=P.familyName||"Other";const o=dom[f]||(dom[f]={domain:f,processes:0,withAccepted:0,points:0,accepted:0,drafts:0,noOwner:0,noTest:0});
  o.processes++;if(a.length)o.withAccepted++;o.points+=rs.length;o.accepted+=a.length;o.drafts+=d.length;o.noOwner+=no;o.noTest+=nt;
  rows.push({id:P.id,name:P.name,domain:f,owner:P.owner,points:rs.length,accepted:a.length,drafts:d.length,noOwner:no,noTest:nt,modes:[...new Set(rs.map(r=>MN[r.mode]))].join(", ")||"None",gates:rs.filter(r=>r.who==="gate").length})});
 const acceptedCount=acc;
 return{processes:L.length,withAccepted:withAcc,withDrafts:withAny,pctProcesses:pct(withAcc,L.length),pctWithAnyRule:pct(withAny,L.length),decisionPoints:dp,accepted:acc,drafts:dr,noOwner:noOwn,noTest,autoRules:auto,autoWithinLimits:autoOk,noDecisionPoint:none,
  pctOwned:pct(dp-noOwn,dp),pctTested:pct(tested,acceptedCount),testedAccepted:tested,
  byDomain:Object.values(dom).map(o=>Object.assign(o,{pct:pct(o.withAccepted,o.processes)})).sort((a,b)=>a.pct-b.pct||b.processes-a.processes),
  processRows:rows,queue,gaps}}

/* ---------- metrics ---------- */
const M=(n,f,u,cur,tgt,badAt,dir,max,tr,owner,use,rem)=>({n,f,u,cur,tgt,badAt,dir,max,tr,owner,use,rem});
Object.assign(METRICS,{
 m_dec_cov:M("Decision rule coverage","Processes with at least one accepted decision rule ÷ all processes in the Process library × 100","%",5,70,25,"max",100,[0,0,1,2,3,4,5,5],"Process governance lead",["Decision rules","Process library"],{kind:"agent",ref:"AG-DEC1",title:"Review the AI-drafted rules for one domain and accept or edit them",agent:"Decision rules drafter",auto:false,state:"idle",prog:"Drafts a default decision table for every decision point; the process owner accepts, edits or retires it"}),
 m_dec_owned:M("Decision points with an owner","Decision points whose rule has a named, resolvable owner ÷ all decision points × 100","%",80,95,70,"max",100,[70,72,74,76,78,79,80,80],"Process governance lead",["Decision rules"],{kind:"sop",ref:"SOP-DEC2",title:"Assign a named owner and backup to each decision point",agent:"Process owners",auto:false,state:"idle",prog:"Gaps list on the Decision rules screen; the owner is set from the org chart when it knows the domain"}),
 m_dec_tested:M("Accepted rules with a passing test","Accepted rules with at least one saved test case that passed ÷ accepted rules × 100","%",50,90,50,"max",100,[20,28,34,40,44,48,50,50],"Process governance lead",["Decision rules"],{kind:"sop",ref:"SOP-DEC3",title:"Save at least two test cases per rule: one typical and one at the limit",agent:"Rule owner",auto:false,state:"idle",prog:"Use Test a rule on the process page; a saved case records inputs, the outcome and the expected outcome"}),
 m_dec_drafts:M("AI-drafted rules waiting for a person","Count of decision rules still in AI draft status (not accepted, not retired)","",240,40,300,"min",400,[250,250,250,248,246,244,242,240],"Process governance lead",["Decision rules"],{kind:"agent",ref:"AG-DEC4",title:"Sort the review queue by gates and money at stake",agent:"Decision rules drafter",auto:false,state:"idle",prog:"Orders drafts by approval gates, then by amount at stake, so owners review the riskiest first"}),
 m_dec_auto:M("Auto-decide rules inside limits","Auto-decide rules that are accepted, have a confidence threshold, a limit (where money is involved) and a passing test ÷ all auto-decide rules × 100","%",100,100,90,"max",100,[100,100,100,100,100,100,100,100],"Process governance lead",["Decision rules"],{kind:"sop",ref:"SOP-DEC5",title:"Pull an auto-decide rule back to AI recommends until it has a limit and a test",agent:"Rule owner",auto:false,state:"idle",prog:"The mode selector blocks Auto-decide on a draft, and the coverage Gaps tab lists any auto rule missing a limit or test"})});
let lastCov=null;
function refreshMetrics(){
 try{const c=coverage();lastCov=c;const set=(k,v)=>{const m=METRICS[k];if(!m)return;m.cur=v;if(m.tr&&m.tr.length)m.tr[m.tr.length-1]=v};
  set("m_dec_cov",c.pctProcesses);set("m_dec_owned",c.pctOwned);set("m_dec_tested",c.pctTested);set("m_dec_drafts",c.drafts);set("m_dec_auto",c.autoRules?pct(c.autoWithinLimits,c.autoRules):100)}catch(e){}}

/* ---------- mutations ---------- */
const find=rid=>D.byId[rid];
function bump(){D.rev++;refreshMetrics()}
function accept(rid,note){
 const r=find(rid);if(!r)return{ok:false,msg:"Rule not found"};
 const a=analyzeT(r);if(a.bad.length)return{ok:false,msg:"Fix the unreadable cells first: "+a.bad[0]};
 r.status="accepted";r.acceptedBy=me();r.acceptedAt=TODAY;if(r.version===1&&r.history.length===1)r.version=1;
 r.history.push({v:r.version,at:TODAY,by:me(),note:note||"Accepted"+(r.dirty?" with edits":" as drafted")});r.evidence.push({at:TODAY,by:me(),note:note||"Accepted by the rule owner after review"});r.dirty=false;
 audit("Decision rules: accepted rule",r.name+" in "+r.proc);bump();return{ok:true,rule:clone(r)}}
function add(pid,spec){
 spec=spec||{};const P=G(()=>PROCLIB.get(pid),null);if(!P)return{ok:false,msg:"No such process"};ensure(pid);
 const steps=P.stepsList||[],si=spec.stepIdx!=null&&spec.stepIdx>=0&&steps[spec.stepIdx]?spec.stepIdx:-1;
 const kind=spec.kind||"approval",step=si>=0?steps[si]:{n:spec.name||"Decision",who:"human",d:""};
 const r=mkRule(P,steps,{i:si,step,kind},0);
 r.name=spec.name||(si>=0?steps[si].n:"New decision point");r.custom=true;if(spec.owner)r.owner=spec.owner;if(spec.mode&&spec.mode!=="auto")r.mode=spec.mode;
 r.ai.why="Starter table from the "+KN[kind]+" template. Edit it to match how this process really decides, then accept.";r.history[0].note="Added by "+me()+" from the "+KN[kind]+" template";r.history[0].by=me();
 D.rules[pid].push(r);audit("Decision rules: added decision point",r.name+" in "+P.name);bump();return{ok:true,rule:clone(r)}}
function test(rid,vals,opts){
 opts=opts||{};const r=find(rid);if(!r)return{ok:false,msg:"Rule not found"};
 const v={};r.inputs.forEach(i=>{v[i.k]=vals&&vals[i.k]!=null?vals[i.k]:(r.sample||{})[i.k]});
 const d=decideT(r,v),row=d.fired&&d.fired.length?r.rows[d.fired[0]]:null;
 const conf=opts.conf!=null?+opts.conf:90,amt=opts.amount!=null&&opts.amount!==""?+opts.amount:(v.amount!=null?+v.amount:(v.value!=null?+v.value:(v.cost!=null?+v.cost:null)));
 const asOf=opts.asOf||TODAY,inEff=asOf>=r.effFrom&&(!r.effTo||asOf<=r.effTo)&&r.status!=="retired";
 const ap=r.approver||"the process owner";let how,cls;
 if(!row){how="No row matches these inputs, so the process falls back to "+ap+". Add a catch-all row.";cls="warn"}
 else if(!inEff){how="This rule is not in effect on "+fD(asOf)+" (effective "+fD(r.effFrom)+" to "+fD(r.effTo)+"). "+ap+" decides without it.";cls="warn"}
 else if(r.mode==="human"){how="Human decides: "+ap+" decides. The table shows the expected outcome “"+row.o[0]+"” as guidance only.";cls="info"}
 else if(r.mode==="recommend"){how="AI recommends “"+row.o[0]+"” with "+conf+"% confidence"+(conf<r.conf?", below the "+r.conf+"% threshold, so it is flagged as low confidence":"")+". "+ap+" confirms or overrules.";cls=conf<r.conf?"warn":"info"}
 else if(r.status!=="accepted"){how="Auto-decide needs an accepted rule. This draft would only recommend “"+row.o[0]+"”; "+ap+" decides.";cls="warn"}
 else if(conf<r.conf){how="Confidence "+conf+"% is below the "+r.conf+"% threshold, so it is not decided automatically. "+ap+" decides, with “"+row.o[0]+"” as the recommendation.";cls="warn"}
 else if(+r.limit>0&&amt!=null&&amt>+r.limit){how="The amount "+amt.toLocaleString("en-US")+" is above the automatic limit of "+(+r.limit).toLocaleString("en-US")+", so "+ap+" decides, with “"+row.o[0]+"” as the recommendation.";cls="warn"}
 else{how="Decided automatically: “"+row.o[0]+"”. Written to the audit trail with the rule version, inputs and confidence.";cls="good"}
 return{ok:true,rule:rid,version:r.version,fired:d.fired||[],row:row?row.o.slice():null,outcome:row?row.o[0]:"No rule matches",error:d.err||null,how,cls,decidedBy:cls==="good"?"System":ap,vals:v}}
function setField(rid,f,val){
 const r=find(rid);if(!r)return false;
 if(f==="mode"){if(val==="auto"&&r.status!=="accepted"){toast("Accept the rule before it can decide automatically. Until then it can only recommend.","warn");return false}
  if(val==="auto"&&r.inputs.some(x=>/amount|value|cost/i.test(x.k))&&!(+r.limit>0))toast("Set an automatic limit so this rule cannot approve large amounts.","warn")}
 r[f]=(f==="conf"||f==="limit")?(+val||0):val;r.dirty=true;audit("Decision rules: edited "+f,r.name+" in "+r.proc);bump();return true}
function saveVersion(rid,note){
 const r=find(rid);if(!r)return{ok:false,msg:"Rule not found"};if(!String(note||"").trim())return{ok:false,msg:"Write what changed, in a few words."};
 const a=analyzeT(r);if(a.bad.length)return{ok:false,msg:"Fix the unreadable cells first: "+a.bad[0]};
 r.version++;r.dirty=false;r.history.push({v:r.version,at:TODAY,by:me(),note:note.trim()});r.evidence.push({at:TODAY,by:me(),note:"Version "+r.version+": "+note.trim()});
 audit("Decision rules: saved version "+r.version,r.name+" · "+note.trim());bump();return{ok:true,version:r.version}}

/* ---------- process page section ---------- */
const sel=(attr,val,opts)=>`<select class="fin dx-sel" ${attr}>${opts.map(o=>{const v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return `<option value="${E(v)}"${String(v)===String(val)?" selected":""}>${E(l)}</option>`}).join("")}</select>`;
function peopleOpts(cur){const n=G(()=>PEOPLE.map(p=>p[0]),[]);if(cur&&!n.includes(cur))n.unshift(cur);return[["","(no owner)"]].concat(n)}
function tableHTML(r){
 const a=analyzeT(r),ex=a.bad.length?`<div class="dx-note bad small">${E(a.bad[0])}</div>`:"";
 const head=`<tr><th class="dx-rn" scope="col">#</th>${r.inputs.map((i,ci)=>`<th scope="col"><span class="dx-th"><span>${E(i.l)}<small class="muted">${i.t==="num"?"number":"choice"}</small></span><button type="button" class="dx-x" data-dx-delin="${E(r.id)}|${ci}" aria-label="Remove input ${E(i.l)}" title="Remove this input">×</button></span></th>`).join("")}<th class="dx-arrow" aria-hidden="true">then</th>${r.outputs.map(o=>`<th scope="col" class="dx-out">${E(o.l)}</th>`).join("")}<th scope="col"><span class="sr">Row actions</span></th></tr>`;
 const body=r.rows.map((row,ri)=>`<tr><td class="dx-rn num">R${ri+1}</td>${row.c.map((c,ci)=>`<td><input class="fin dx-cell" data-dx-cell="${E(r.id)}|${ri}|c|${ci}" value="${E(c)}" aria-label="Row ${ri+1} ${E(r.inputs[ci].l)}"${r.inputs[ci].o?` list="dxl-${E(slug(r.id))}-${ci}"`:""}></td>`).join("")}<td class="dx-arrow">→</td>${row.o.map((o,oi)=>`<td class="dx-out"><input class="fin dx-cell" data-dx-cell="${E(r.id)}|${ri}|o|${oi}" value="${E(o)}" aria-label="Row ${ri+1} ${E(r.outputs[oi].l)}"></td>`).join("")}<td class="dx-ra"><button type="button" class="dx-ic" data-dx-mv="${E(r.id)}|${ri}|-1" aria-label="Move row up">↑</button><button type="button" class="dx-ic" data-dx-mv="${E(r.id)}|${ri}|1" aria-label="Move row down">↓</button><button type="button" class="dx-ic" data-dx-delrow="${E(r.id)}|${ri}" aria-label="Delete row">×</button></td></tr>`).join("");
 const dl=r.inputs.map((i,ci)=>i.o?`<datalist id="dxl-${E(slug(r.id))}-${ci}">${i.o.map(o=>`<option value="${E(o)}">`).join("")}</datalist>`:"").join("");
 return `<div class="dx-tw"><table class="dx-tbl"><thead>${head}</thead><tbody>${body}</tbody></table>${dl}</div>${ex}
 <div class="row dx-rowbtn"><button type="button" class="btn quiet" data-dx-addrow="${E(r.id)}">Add row</button><button type="button" class="btn quiet" data-dx-addin="${E(r.id)}">Add input</button><span class="small muted">Rows are read top to bottom; the first match wins. Use - for any, “<= 5000”, “(1..9]”, “Low,Medium” or “not(High)”.</span></div>
 ${a.gaps.length?`<div class="dx-note warn small">${a.gaps.length===1&&/catch-all/.test(a.gaps[0])?E(a.gaps[0]):"Some inputs match no row, for example "+E(a.gaps[0])+". Add a catch-all row so every case gets a decision."}</div>`:`<div class="dx-note good small">Every sampled input matches a row${a.ov?" ("+a.ov+" overlapping pair"+(a.ov>1?"s":"")+" resolved by order)":""}.</div>`}`}
function sandboxHTML(r){
 const v=r.sbVals||r.sample||{};const amtField=!r.inputs.some(x=>x.k==="amount")&&+r.limit>0;
 const f=r.inputs.map(i=>i.t==="num"?`<label class="small">${E(i.l)}<input class="fin dx-sbi" type="number" data-dx-sbv="${E(i.k)}" value="${E(v[i.k]!=null?v[i.k]:0)}"></label>`:`<label class="small">${E(i.l)}<select class="fin dx-sbi" data-dx-sbv="${E(i.k)}">${(i.o||[]).map(o=>`<option${String(v[i.k])===o?" selected":""}>${E(o)}</option>`).join("")}</select></label>`).join("");
 const res=r.sbRes;const outs=[...new Set(r.rows.map(x=>x.o[0]))].concat(["No rule matches"]);
 return `<div class="dx-sb" data-dx-sb="${E(r.id)}"><div class="eyebrow">Test a rule</div><p class="small muted">Change the sample inputs and run. Nothing is decided or sent; the result shows which row fires and what the mode would do.</p>
 <div class="dx-sbgrid">${f}<label class="small">AI confidence %<input class="fin dx-sbi" type="number" min="0" max="100" data-dx-sbc value="${E(r.sbConf!=null?r.sbConf:90)}"></label>${amtField?`<label class="small">Amount at stake<input class="fin dx-sbi" type="number" data-dx-sba value="${E(r.sbAmt!=null?r.sbAmt:0)}"></label>`:""}<label class="small">As of date<input class="fin dx-sbi" type="date" data-dx-sbd value="${E(r.sbDate||TODAY)}"></label></div>
 <div class="row dx-rowbtn"><button type="button" class="btn primary" data-dx-run="${E(r.id)}">Run test</button></div>
 ${res?`<div class="dx-res ${res.cls}" role="status"><div class="row sp"><b>Outcome: ${E(res.outcome)}</b><span class="pill ${res.cls}">${res.cls==="good"?"Decided automatically":res.cls==="info"?"Goes to a person":"Check this"}</span></div><div class="small">${E(res.how)}</div>${res.row?`<dl class="kv dx-kv">${r.outputs.map((o,i)=>`<dt>${E(o.l)}</dt><dd>${E(res.row[i]||"")}</dd>`).join("")}<dt>Row</dt><dd class="num">R${res.fired[0]+1}</dd><dt>Rule version</dt><dd class="num">v${res.version}</dd></dl>`:""}
  <div class="row dx-rowbtn"><label class="small">Expected outcome${sel(`data-dx-expect="${E(r.id)}"`,res.outcome,outs)}</label><button type="button" class="btn" data-dx-savetest="${E(r.id)}">Save as test case</button></div></div>`:""}
 ${r.tests.length?`<div class="small"><b>${r.tests.length} saved test case${r.tests.length===1?"":"s"}</b> · ${r.tests.filter(t=>t.pass).length} passing</div><ul class="dx-tests">${r.tests.slice(-4).reverse().map(t=>`<li><span class="pill ${t.pass?"good":"bad"}">${t.pass?"Pass":"Fail"}</span> ${E(Object.entries(t.vals).map(e=>e[0]+"="+e[1]).join(", "))} → ${E(t.out)} <small class="muted">(expected ${E(t.expect)} · ${fD(t.at)})</small></li>`).join("")}</ul>`:'<div class="small"><span class="pill warn">No saved test</span> Save at least one case so a later edit cannot silently change the outcome.</div>'}</div>`}
function ruleHTML(r){
 const st=eff(r),open=D.open[r.id];const stuck=r.mode==="auto"&&r.status!=="accepted";
 const guard=[];if(!r.owner)guard.push('<span class="pill warn">No owner</span>');if(!r.tests.length)guard.push('<span class="pill warn">No test</span>');if(r.dirty)guard.push('<span class="pill info">Unsaved edits</span>');
 const orgNote=r.approverSrc&&/org chart/.test(r.approverSrc)?`<span class="pill info" title="Looked up in the org chart for this domain">${E(r.approverSrc)}</span>`:`<span class="small muted">${E(r.approverSrc||"")}</span>`;
 return `<details class="dx-rule ${r.status==="accepted"?"is-acc":""}" data-dx-det="${E(r.id)}"${open?" open":""}><summary><span class="dx-sum"><b>${E(r.name)}</b><small class="muted">${E(KN[r.kind]||"Decision")} · ${r.stepIdx>=0?"step "+(r.stepIdx+1)+" · "+({gate:"approval gate",agent:"AI agent",robot:"robot",human:"person"})[STEPMODE.of(r.who)]:"added"}</small></span><span class="dx-sumr"><span class="pill ${st[1]}">${E(st[0])}</span><span class="pill mute">${E(MN[r.mode])}</span>${guard.join("")}</span></summary>
 <div class="dx-body">
 ${r.status!=="accepted"&&r.status!=="retired"?`<div class="dx-ai"><div class="row">${typeof aiChip==="function"?aiChip({model:r.ai.model,conf:r.ai.conf,title:"AI-drafted default decision rule",note:r.ai.why}):""}<span class="pill warn">AI-drafted default: a person must accept it before it binds</span></div><p class="small muted">${E(r.ai.why)}</p><div class="row dx-rowbtn"><button type="button" class="btn primary" data-dx-accept="${E(r.id)}">Accept this rule</button><span class="small muted">Accepting records ${E(me())}, today's date and the version in the audit trail.</span></div></div>`:r.status==="accepted"?`<p class="small muted">Accepted by <b>${E(r.acceptedBy||"")}</b> on ${fD(r.acceptedAt)}. Version ${r.version}, effective ${fD(r.effFrom)}${r.effTo?" to "+fD(r.effTo):", no end date"}.</p>`:'<p class="small muted">Retired. It no longer decides anything.</p>'}
 <p class="small">${E(r.purpose||"")}</p>
 <div class="dx-meta">
  <label class="small">Rule owner${sel(`data-dx-fld="${E(r.id)}|owner"`,r.owner,peopleOpts(r.owner))}</label>
  <label class="small">Approver ${orgNote}<input class="fin" data-dx-fld="${E(r.id)}|approver" value="${E(r.approver||"")}" list="dx-people" placeholder="Person or role"></label>
  <label class="small">Mode${sel(`data-dx-fld="${E(r.id)}|mode"`,r.mode,MODES)}</label>
  <label class="small">Confidence threshold %<input class="fin" type="number" min="50" max="99" data-dx-fld="${E(r.id)}|conf" value="${E(r.conf)}"></label>
  <label class="small">Automatic limit<input class="fin" type="number" min="0" data-dx-fld="${E(r.id)}|limit" value="${E(r.limit||0)}" placeholder="0 = none"></label>
  <label class="small">Effective from<input class="fin" type="date" data-dx-fld="${E(r.id)}|effFrom" value="${E(r.effFrom)}"></label>
  <label class="small">Effective to<input class="fin" type="date" data-dx-fld="${E(r.id)}|effTo" value="${E(r.effTo||"")}"></label></div>
 ${stuck?'<div class="dx-note warn small">Auto-decide is only active once the rule is accepted. Until then it only recommends.</div>':""}
 <p class="small muted dx-modehelp">${r.mode==="human"?"A person decides. The table is a reference the approver can see.":r.mode==="recommend"?"The AI applies the table and recommends the outcome with a confidence score. The approver confirms or overrules.":"The table decides on its own when confidence is at or above the threshold and the amount is within the limit. Otherwise it goes to the approver."}</p>
 ${tableHTML(r)}
 <div class="dx-two">${sandboxHTML(r)}
  <div class="dx-ev"><div class="eyebrow">Evidence, versions and audit</div>
   <ul class="dx-evl">${r.evidence.slice(-4).reverse().map(e=>`<li><b>${fD(e.at)}</b> ${E(e.by)}: ${E(e.note)}</li>`).join("")||'<li class="muted">No evidence yet. Add where this rule comes from: a policy, a past decision, a regulation.</li>'}</ul>
   <div class="row dx-rowbtn"><input class="fin dx-grow" data-dx-evtext="${E(r.id)}" placeholder="Add evidence: policy, past decisions, regulation" aria-label="Evidence"><button type="button" class="btn quiet" data-dx-ev="${E(r.id)}">Add evidence</button></div>
   <div class="eyebrow dx-mt">Versions</div>
   <ul class="dx-evl">${r.history.slice(-4).reverse().map(h=>`<li><span class="pill mute">v${h.v}</span> ${fD(h.at)} · ${E(h.by)}: ${E(h.note)}</li>`).join("")}</ul>
   <div class="row dx-rowbtn"><input class="fin dx-grow" data-dx-vtext="${E(r.id)}" placeholder="What changed in this version?" aria-label="Version note"><button type="button" class="btn" data-dx-save="${E(r.id)}"${r.dirty?"":" disabled"}>Save new version</button></div>
   <div class="row dx-rowbtn"><button type="button" class="btn quiet dx-retire" data-dx-retire="${E(r.id)}">Retire this decision point</button><span class="small muted">Every change is written to the audit log.</span></div></div></div>
 </div></details>`}
function secHTML(pid){
 const rs=ensure(pid).filter(live),a=rs.filter(r=>r.status==="accepted"),d=rs.filter(r=>r.status!=="accepted");
 const P=G(()=>PROCLIB.get(pid),{name:pid});
 return `<section class="dx-sec card glass" data-dx-sec="${E(pid)}" id="dx-sec-${E(slug(pid))}" aria-labelledby="dx-h-${E(slug(pid))}">
 <div class="row sp dx-head"><div><div class="eyebrow">Decision rules</div><h3 id="dx-h-${E(slug(pid))}">How decisions are made in ${E(P.name)}</h3></div><div class="row"><button type="button" class="btn primary" data-dx-add="${E(pid)}">Add decision point</button><button type="button" class="btn quiet" data-dx-cov>Coverage across all processes</button></div></div>
 <p class="story" data-role="story">${rs.length?`<b>${rs.length} decision point${rs.length===1?"":"s"}</b> found in this process. ${a.length?`<b>${a.length}</b> ${a.length===1?"has":"have"} a rule a person has accepted.`:"None has a rule a person has accepted yet."} ${d.length?`<b>${d.length}</b> ${d.length===1?"is":"are"} an AI-drafted default waiting for the owner to accept, edit or retire.`:""}`:"No decision point is recorded. Add the places where this process approves, routes, reviews or releases."}</p>
 <div class="row dx-pills"><span class="pill ${a.length===rs.length&&rs.length?"good":"warn"}">${a.length} of ${rs.length} accepted</span><span class="pill ${rs.some(r=>!r.owner)?"warn":"good"}">${rs.filter(r=>!r.owner).length} without an owner</span><span class="pill ${rs.some(r=>!r.tests.length)?"warn":"good"}">${rs.filter(r=>!r.tests.length).length} without a test</span>${rs.some(r=>r.mode==="auto")?`<span class="pill info">${rs.filter(r=>r.mode==="auto").length} auto-decide</span>`:""}</div>
 ${rs.map(ruleHTML).join("")||'<div class="empty-s small muted">Nothing to show yet.</div>'}
 <datalist id="dx-people">${G(()=>PEOPLE.map(p=>`<option value="${E(p[0])}">`).join(""),"")}</datalist></section>`}
let BUSY=false;
function repaint(pid){if(BUSY)return;BUSY=true;try{repaint_(pid)}finally{BUSY=false}}
function repaint_(pid){document.querySelectorAll('[data-dx-sec="'+CSS.escape(pid)+'"]').forEach(el=>{const t=document.createElement("div");t.innerHTML=secHTML(pid);const n=t.firstElementChild;const sc=document.getElementById("drawer");const y=sc?sc.scrollTop:0;el.replaceWith(n);if(sc)sc.scrollTop=y})}
function inject(html,pid){
 if(html.indexOf("data-dx-sec=")>-1)return html;
 const sec=secHTML(pid);let at=html.lastIndexOf('<details class="pl-card glass pl-sec">');if(at<0)at=html.lastIndexOf("</div>");if(at<0)return html+sec;
 html=html.slice(0,at)+sec+html.slice(at);
 const rs=ensure(pid).filter(live),a=rs.filter(r=>r.status==="accepted").length;
 const jump=`<div class="row dx-jumpr"><button type="button" class="btn" data-dx-jump="${E(pid)}">Decision rules: ${rs.length} decision point${rs.length===1?"":"s"}, ${a} accepted</button></div>`;
 const m=html.match(/<p class="story"[^>]*>[\s\S]*?<\/p>/);if(m){const i=html.indexOf(m[0])+m[0].length;html=html.slice(0,i)+jump+html.slice(i)}
 return html}
(function(){const od=window.openDrawer;if(typeof od!=="function")return;
 window.openDrawer=function(html){try{if(typeof html==="string"){const m=html.match(/data-pl-page="([^"]+)"/);if(m)html=inject(html,m[1].replace(/&amp;/g,"&").replace(/&quot;/g,'"'))}}catch(e){console.error("decision rules inject",e)}
  return od.apply(this,[html].concat([].slice.call(arguments,1)))}})();
/* minimal tab registry for the process page, defined only when nobody else did */
G(()=>{const w=()=>{if(window.PROCLIB&&!PROCLIB.addTab){PROCLIB.addTab=function(def){PROCLIB._tabs=PROCLIB._tabs||[];if(def&&def.id&&!PROCLIB._tabs.some(t=>t.id===def.id))PROCLIB._tabs.push(def);return true};PROCLIB.addTab({id:"decision_rules",label:"Decision rules",section:"[data-dx-sec]"})}else if(!window.PROCLIB)setTimeout(w,400)};setTimeout(w,300)});
function jumpTo(pid,rid){setTimeout(()=>{const el=document.getElementById("dx-sec-"+slug(pid));if(!el)return;if(rid){D.open[rid]=true;repaint(pid)}const e2=document.getElementById("dx-sec-"+slug(pid));if(e2)e2.scrollIntoView({block:"start",behavior:"smooth"})},120)}
function openProcRules(pid,rid){if(window.PROCLIB&&PROCLIB.open&&PROCLIB.open(pid)!==false)jumpTo(pid,rid);else toast("That process is not in the library.","warn")}

/* ---------- forms ---------- */
function addForm(pid){
 const P=G(()=>PROCLIB.get(pid),null);if(!P)return;const steps=P.stepsList||[];
 const so=[["-1","A decision that is not one of the listed steps"]].concat(steps.map((s,i)=>[String(i),(i+1)+". "+s.n]));
 openForm({id:"dx_add",title:"Add a decision point",story:"A decision point is a place where this process chooses between outcomes. You get a starter decision table from the template, marked as a draft, that you edit and then accept.",submit:"Add decision point",
  fields:[{section:"Where"},{k:"step",label:"Process step",type:"select",opts:so,help:"The step where the decision is made."},{k:"name",label:"Name",type:"text",req:true,ph:"Approve a late exception"},
   {k:"kind",label:"Kind of decision",type:"chips",opts:KINDS,help:"Picks the starter table: who decides, what it looks at."},{section:"Who and how"},{k:"owner",label:"Rule owner",type:"people"},{k:"mode",label:"How it is decided",type:"chips",opts:MODES.slice(0,2),help:"Auto-decide becomes available after a person accepts the rule."}],
  defaults:{step:"-1",kind:"approval",mode:"recommend"},
  onSubmit:v=>{const r=add(pid,{stepIdx:+v.step,name:v.name,kind:v.kind,owner:v.owner,mode:v.mode});if(!r.ok)return{toast:r.msg,close:false};D.open[r.rule.id]=true;setTimeout(()=>openProcRules(pid,r.rule.id),50);return{toast:"Decision point added as a draft. Review and accept it.",close:false}}})}
function addInputForm(rid){
 const r=find(rid);if(!r)return;
 openForm({id:"dx_addin",title:"Add an input to the rule",story:"A new column the rule looks at. Existing rows get - (any) so nothing changes until you edit them.",submit:"Add input",
  fields:[{k:"l",label:"Name",type:"text",req:true,ph:"Vendor tier"},{k:"t",label:"Type",type:"chips",opts:[["txt","A choice from a list"],["num","A number"]]},{k:"o",label:"Choices (comma separated)",type:"text",ph:"Gold, Silver, Bronze",show:v=>v.t!=="num"}],defaults:{t:"txt"},
  onSubmit:v=>{let k=slug(v.l)||"in"+r.inputs.length;while(r.inputs.some(i=>i.k===k))k+="_";r.inputs.push({k,l:v.l.trim(),t:v.t==="num"?"num":"txt",o:v.t==="num"?undefined:String(v.o||"").split(",").map(x=>x.trim()).filter(Boolean)});r.rows.forEach(x=>x.c.push("-"));if(r.sample)r.sample[k]=v.t==="num"?0:((r.inputs[r.inputs.length-1].o||[""])[0]);r.dirty=true;audit("Decision rules: added input",v.l+" to "+r.name);bump();setTimeout(()=>openProcRules(r.proc,rid),50);return{toast:"Input added",close:false}}})}

/* ---------- events ---------- */
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.dxDet)D.open[d.dataset.dxDet]=d.open},true);
const pidOf=el=>{const s=el.closest("[data-dx-sec]");return s?s.dataset.dxSec:null};
const split=s=>String(s).split("|");
document.addEventListener("click",e=>{
 const T=e.target.closest&&e.target.closest("[data-dx-accept],[data-dx-addrow],[data-dx-delrow],[data-dx-mv],[data-dx-delin],[data-dx-addin],[data-dx-add],[data-dx-run],[data-dx-savetest],[data-dx-ev],[data-dx-save],[data-dx-retire],[data-dx-jump],[data-dx-cov],[data-dx-goproc],[data-dx-qaccept],[data-dx-tab]");
 if(!T)return;const ds=T.dataset;let rid,r,pid;
 if(ds.dxJump!==undefined){jumpTo(ds.dxJump);return}
 if(ds.dxCov!==undefined){closeDrawer();go("dec_cov");return}
 if(ds.dxGoproc!==undefined){const x=split(ds.dxGoproc);openProcRules(x[0],x[1]);return}
 if(ds.dxTab!==undefined){D.tab=+ds.dxTab;return}
 if(ds.dxQaccept!==undefined){const res=accept(ds.dxQaccept,"Accepted from the review queue without edits");if(res.ok){toast("Rule accepted. Added to the audit trail.","good");render()}else toast(res.msg,"warn");return}
 if(ds.dxAdd!==undefined){addForm(ds.dxAdd);return}
 pid=pidOf(T);
 if(ds.dxAccept!==undefined){const res=accept(ds.dxAccept);if(res.ok){toast("Rule accepted by "+me()+".","good");}else toast(res.msg,"warn");repaint(pid);return}
 if(ds.dxAddrow!==undefined){r=find(ds.dxAddrow);r.rows.push({c:r.inputs.map(()=>"-"),o:r.outputs.map((o,i)=>i?"Approver":"Needs approver")});r.dirty=true;bump();repaint(pid);return}
 if(ds.dxDelrow!==undefined){const x=split(ds.dxDelrow);r=find(x[0]);if(r.rows.length<=1){toast("A rule needs at least one row.","warn");return}r.rows.splice(+x[1],1);r.dirty=true;audit("Decision rules: deleted a row",r.name);bump();repaint(pid);return}
 if(ds.dxMv!==undefined){const x=split(ds.dxMv);r=find(x[0]);const i=+x[1],j=i+ +x[2];if(j<0||j>=r.rows.length)return;[r.rows[i],r.rows[j]]=[r.rows[j],r.rows[i]];r.dirty=true;bump();repaint(pid);return}
 if(ds.dxDelin!==undefined){const x=split(ds.dxDelin);r=find(x[0]);if(r.inputs.length<=1){toast("A rule needs at least one input.","warn");return}r.inputs.splice(+x[1],1);r.rows.forEach(w=>w.c.splice(+x[1],1));r.dirty=true;audit("Decision rules: removed an input",r.name);bump();repaint(pid);return}
 if(ds.dxAddin!==undefined){addInputForm(ds.dxAddin);return}
 if(ds.dxRun!==undefined){r=find(ds.dxRun);const box=T.closest("[data-dx-sb]");const v={};box.querySelectorAll("[data-dx-sbv]").forEach(i=>{v[i.dataset.dxSbv]=i.type==="number"?+i.value:i.value});
  const cEl=box.querySelector("[data-dx-sbc]"),aEl=box.querySelector("[data-dx-sba]"),dEl=box.querySelector("[data-dx-sbd]");
  r.sbVals=v;r.sbConf=cEl?+cEl.value:90;r.sbAmt=aEl?+aEl.value:undefined;r.sbDate=dEl&&dEl.value?dEl.value:TODAY;
  r.sbRes=test(r.id,v,{conf:r.sbConf,amount:r.sbAmt,asOf:r.sbDate});audit("Decision rules: tested rule",r.name+" → "+r.sbRes.outcome);repaint(pid);return}
 if(ds.dxSavetest!==undefined){r=find(ds.dxSavetest);const ex=T.closest("[data-dx-sb]").querySelector("[data-dx-expect]");if(!r.sbRes)return;
  r.tests.push({at:TODAY,vals:clone(r.sbRes.vals),out:r.sbRes.outcome,expect:ex?ex.value:r.sbRes.outcome,pass:(ex?ex.value:r.sbRes.outcome)===r.sbRes.outcome,by:me()});
  audit("Decision rules: saved test case",r.name);toast("Test case saved","good");bump();repaint(pid);return}
 if(ds.dxEv!==undefined){r=find(ds.dxEv);const i=T.closest("[data-dx-sec]").querySelector('[data-dx-evtext="'+CSS.escape(r.id)+'"]');const t=i&&i.value.trim();if(!t){toast("Write the evidence first.","warn");return}
  r.evidence.push({at:TODAY,by:me(),note:t});audit("Decision rules: added evidence",r.name);toast("Evidence added","good");repaint(pid);return}
 if(ds.dxSave!==undefined){r=find(ds.dxSave);const i=T.closest("[data-dx-sec]").querySelector('[data-dx-vtext="'+CSS.escape(r.id)+'"]');const res=saveVersion(r.id,i&&i.value);if(res.ok)toast("Saved as version "+res.version,"good");else toast(res.msg,"warn");repaint(pid);return}
 if(ds.dxRetire!==undefined){r=find(ds.dxRetire);if(!confirm("Retire \""+r.name+"\"? It stops deciding anything, and the history is kept."))return;r.status="retired";r.history.push({v:r.version,at:TODAY,by:me(),note:"Retired"});audit("Decision rules: retired decision point",r.name);bump();toast("Decision point retired","good");repaint(pid)}});
document.addEventListener("change",e=>{
 const c=e.target.closest&&e.target.closest("[data-dx-cell]");
 if(c){const x=split(c.dataset.dxCell),r=find(x[0]);if(!r)return;const row=r.rows[+x[1]];if(x[2]==="c")row.c[+x[3]]=c.value;else row.o[+x[3]]=c.value;r.dirty=true;audit("Decision rules: edited a cell",r.name);bump();const p=pidOf(c);if(p)repaint(p);return}
 const f=e.target.closest&&e.target.closest("[data-dx-fld]");
 if(f){const x=split(f.dataset.dxFld);const ok=setField(x[0],x[1],f.value);if(x[1]==="approver"){const r=find(x[0]);if(r)r.approverSrc="edited by "+me()}const p=pidOf(f);if(p)repaint(p);return}});

/* ---------- coverage screen ---------- */
const ICONP="M12 3l9 9-9 9-9-9zM8.5 12h7M12 8.5v7";
function barRow(o){return `<div class="dx-br"><span class="small">${E(o.domain)}</span><div class="dx-tk" role="img" aria-label="${E(o.domain)}: ${o.withAccepted} of ${o.processes} processes have an accepted rule"><i style="width:${Math.max(o.pct,o.pct?2:0)}%"></i></div><span class="num small">${o.pct}%</span><span class="small muted">${o.withAccepted} of ${o.processes}</span></div>`}
function rowBtn(r,label){return `<div class="dx-qr"><div><b>${E(r.name)}</b><div class="small muted">${E(procName(r.proc))} · ${E(KN[r.kind]||"")} · ${E(MN[r.mode])}</div></div><div class="row"><button type="button" class="btn quiet" data-dx-goproc="${E(r.proc)}|${E(r.id)}">Review</button>${label?`<button type="button" class="btn" data-dx-qaccept="${E(r.id)}">Accept as drafted</button>`:""}</div></div>`}
const procName=pid=>G(()=>all().find(p=>p.id===pid).name,pid);
function procTable(){
 if(typeof btHTML!=="function")return "";
 return btHTML({id:"dx_tbl",h:480,rowH:52,key:"id",sort:{k:"drafts",d:1},exportName:"decision-rule-coverage",facets:["domain"],rows:()=>coverage().processRows,cols:[
  {k:"name",label:"Process",wrap:1,val:r=>r.name,fmt:r=>`<b>${E(r.name)}</b><div class="small muted">${E(r.owner||"No owner")}</div>`},
  {k:"domain",label:"Domain",wrap:1,val:r=>r.domain,fmt:r=>E(r.domain)},
  {k:"points",label:"Decision points",val:r=>r.points,fmt:r=>`<span class="num">${r.points}</span>`},
  {k:"accepted",label:"Accepted",val:r=>r.accepted,fmt:r=>`<span class="num">${r.accepted}</span>${r.accepted?"":' <span class="pill warn">none</span>'}`},
  {k:"drafts",label:"AI drafts",val:r=>r.drafts,fmt:r=>`<span class="num">${r.drafts}</span>`},
  {k:"noOwner",label:"No owner",val:r=>r.noOwner,fmt:r=>`<span class="num">${r.noOwner}</span>`},
  {k:"noTest",label:"No test",val:r=>r.noTest,fmt:r=>`<span class="num">${r.noTest}</span>`},
  {k:"modes",label:"Modes",wrap:1,val:r=>r.modes,fmt:r=>E(r.modes)}],open:id=>openProcRules(id)})}
function covScreen(){
 refreshMetrics();const c=coverage();
 const kp=typeof kpiRow==="function"?kpiRow([["Processes with accepted rules",c.pctProcesses+"%",c.withAccepted+" of "+c.processes+" processes",{metric:"m_dec_cov",keep:true}],["Decision points",c.decisionPoints,"in "+c.withDrafts+" processes, each with a draft table"],["AI drafts to review",c.drafts,"waiting for a person to accept",{metric:"m_dec_drafts",keep:true,cls:c.drafts>100?"warn":""}],["With an owner",c.pctOwned+"%",c.noOwner+" have none",{metric:"m_dec_owned",keep:true,cls:c.noOwner?"warn":"good"}],["Accepted with a passing test",c.pctTested+"%",c.testedAccepted+" of "+c.accepted,{metric:"m_dec_tested",keep:true,cls:c.pctTested<90?"warn":"good"}]]):"";
 const q=c.queue.slice().sort((a,b)=>(b.who==="gate")-(a.who==="gate")||a.proc.localeCompare(b.proc));
 const dom=D.qDom||"";const qf=dom?q.filter(r=>G(()=>all().find(p=>p.id===r.proc).familyName,"")===dom):q;
 const domains=[...new Set(c.byDomain.map(o=>o.domain))];
 const gap=(title,sub,list,render)=>`<div class="card glass"><div class="eyebrow">${E(title)}</div><p class="small muted">${E(sub)}</p><div class="dx-list">${list.slice(0,10).map(render).join("")||'<p class="small muted">Nothing here.</p>'}</div>${list.length>10?`<p class="small muted">and ${list.length-10} more. Filter the All processes tab.</p>`:""}</div>`;
 const p1=`<div class="grid g2 dx-two-c"><div class="card glass"><div class="eyebrow">Coverage by domain</div><p class="small muted">Share of processes with at least one decision rule a person has accepted. Lowest first.</p><div class="dx-bars">${c.byDomain.map(barRow).join("")}</div></div>
 <div class="card glass"><div class="eyebrow">How this stays complete</div><p class="small">Every process in the library gets its decision points from its own steps: approval gates first, then steps that approve, route, review, release or close. Each point starts with an <b>AI-drafted default</b> table. It decides nothing until a person accepts it.</p><ul class="pl-ul"><li>${c.withDrafts} of ${c.processes} processes have at least one decision point (${c.noDecisionPoint} with none).</li><li>Before this, only <b>4 decision tables</b> and <b>5 approval-policy families</b> existed.</li><li><button type="button" class="btn quiet" data-go="flw_dmn">Open the original Decision tables</button></li></ul></div></div>`;
 const p2=`<div class="card glass"><div class="row sp"><div><div class="eyebrow">Review queue</div><p class="small muted">AI-drafted rules, approval gates first. Review opens the process page on that rule. Accept as drafted records you as the person who accepted it.</p></div><label class="small">Domain<select class="fin" data-dx-qdom><option value="">All domains</option>${domains.map(d=>`<option${d===dom?" selected":""}>${E(d)}</option>`).join("")}</select></label></div><div class="dx-list">${qf.slice(0,25).map(r=>rowBtn(r,true)).join("")||'<p class="small muted">Nothing waiting.</p>'}</div>${qf.length>25?`<p class="small muted">Showing 25 of ${qf.length}.</p>`:""}</div>`;
 const p3=`<div class="grid g2 dx-two-c">${gap("Decision points with no owner","Set the owner on the process page.",c.gaps.noOwner,r=>rowBtn(r))}${gap("Decision points with no test","Save at least one test case in the sandbox.",c.gaps.noTest,r=>rowBtn(r))}${gap("Auto-decide rules missing a limit, threshold or test","Pull these back to AI recommends until fixed.",c.gaps.autoNoLimit,r=>rowBtn(r))}${gap("Processes with no decision point","Add the place where the process chooses.",c.gaps.noPoints,P=>`<div class="dx-qr"><div><b>${E(P.name)}</b></div><button type="button" class="btn quiet" data-dx-add="${E(P.id)}">Add</button></div>`)}</div>`;
 const p4=`<div class="card glass">${procTable()}</div>`;
 return `<div class="screen">${hero("Automation · Decision rules","Every process has decision rules; "+c.pctProcesses+"% are accepted by a person",`<b>${c.decisionPoints} decision points</b> across <b>${c.processes} processes</b> now carry a decision table. <b>${c.withAccepted}</b> processes have a rule a person accepted, and <b>${c.drafts}</b> drafts are waiting. ${c.noOwner} points have no owner and ${c.noTest} have no test.`)}${lensNote()}${kp}
 ${views("dx_main",["Coverage","Review queue","Gaps","All processes"],[p1,p2,p3,p4])}</div>`}
REG("dec_cov","Decision rule coverage","automate",ICONP,covScreen);
document.addEventListener("change",e=>{const q=e.target.closest&&e.target.closest("[data-dx-qdom]");if(q){D.qDom=q.value;S.v.dx_main=1;render()}});

/* ---------- search, chat, wiring ---------- */
SEARCHX.push(()=>{const o=[{g:"Automation",t:"Decision rules coverage",m:"Every process, AI drafts to accept",c:"--p4",f:()=>go("dec_cov"),k:"decision rules coverage decision points ai drafted accept owner test sandbox"}];
 all().forEach(P=>{const rs=ensure(P.id).filter(live),a=rs.filter(r=>r.status==="accepted").length;o.push({g:"Decision rules",t:"Decision rules: "+P.name,m:rs.length+" points · "+a+" accepted",c:"--p4",f:()=>openProcRules(P.id),k:P.name+" decision rules decision table approval"})});return o});
ASKX.push(q=>{
 const t=q.toLowerCase();let m;
 if(/which (processes|process).*(no|without|missing|lack).*decision rule|processes (with|that have) no decision rule|no (accepted )?decision rules?/.test(t)){
  const c=coverage();const no=c.processRows.filter(r=>!r.accepted).sort((a,b)=>b.gates-a.gates);S.v.dx_main=2;go("dec_cov");
  say(q,{t:`${no.length} of ${c.processes} processes have no accepted decision rule. Every one has an AI-drafted default waiting for a person. Most gates first: ${no.slice(0,6).map(r=>r.name).join(", ")}.`,steps:["Counted accepted rules per process","Opened Decision rules"]});return true}
 if(/decision (points?|rules?).*(no|without) (an )?owner|decision (points?|rules?).*(no|without) (a )?test/.test(t)){const c=coverage(),own=/owner/.test(t);S.v.dx_main=2;go("dec_cov");
  say(q,{t:own?`${c.noOwner} decision points have no owner out of ${c.decisionPoints}.`:`${c.noTest} decision rules have no passing test case (${c.accepted-c.testedAccepted} of the ${c.accepted} accepted).`,steps:["Opened the Gaps tab"]});return true}
 if(/decision rule.*(coverage|status)|coverage.*decision rule|how many decision rules/.test(t)){const c=coverage();S.v.dx_main=0;go("dec_cov");
  say(q,{t:`${c.pctProcesses}% of processes (${c.withAccepted} of ${c.processes}) have an accepted decision rule. ${c.decisionPoints} decision points exist, ${c.drafts} are AI drafts waiting for a person.`,steps:["Opened Decision rules coverage"]});return true}
 if((m=t.match(/decision (?:rules?|points?|table)s?\s+(?:for|of|in)\s+(?:the\s+)?(.+?)\s*(?:process)?\??$/))){const pid=G(()=>PROCLIB.find(m[1]),null);
  if(pid){const rs=ensure(pid).filter(live),a=rs.filter(r=>r.status==="accepted").length;openProcRules(pid);say(q,{t:`${procName(pid)} has ${rs.length} decision point${rs.length===1?"":"s"}: ${rs.map(r=>r.name+" ("+MN[r.mode]+", "+(r.status==="accepted"?"accepted":"AI draft")+")").join("; ")}. ${a} accepted.`,steps:["Found the process","Opened its page at Decision rules"]});return true}}
 return false});

const W={};
function wire(){
 try{
  if(!W.ent&&window.ATLAS&&ATLAS.addEntity){
   const fld=(k,label,type,cls)=>({k,label,type,authority:"platform",classification:cls||"internal"});
   const defs=[{id:"decision_rule",label:"Decision rule",domain:"plat",source:"Decision rules",ownerApp:"dec_cov",ownerMod:"dec_cov",status:"live",note:"A decision table attached to one decision point of one process, with mode, confidence threshold, limit, owner, approver, version and effective dates.",
    fields:[fld("process_id","Process","ref"),fld("step","Process step","text"),fld("kind","Kind","enum"),fld("mode","Mode","enum"),fld("status","Status","enum"),fld("owner","Owner","ref","personal"),fld("approver","Approver","ref","personal"),fld("table","Decision table","json"),fld("conf_threshold","Confidence threshold","number"),fld("auto_limit","Automatic limit","number"),fld("version","Version","number"),fld("effective_from","Effective from","date"),fld("effective_to","Effective to","date"),fld("accepted_by","Accepted by","ref","personal")],
    decision:"New, thin. approval_policy holds limits per approval domain and the Decision tables screen holds four free-standing tables; neither ties a table to a step of a process or records mode, version and acceptance. The rule references process_definition and approval_policy by id instead of copying them.",searched:"approval_policy, process_definition, exception, approval"},
   {id:"decision_test_case",label:"Decision test case",domain:"plat",source:"Decision rules",ownerApp:"dec_cov",ownerMod:"dec_cov",status:"live",note:"One saved sample input with the expected and actual outcome for a decision rule version.",fields:[fld("rule_id","Decision rule","ref"),fld("rule_version","Rule version","number"),fld("inputs","Inputs","json"),fld("expected","Expected outcome","text"),fld("actual","Actual outcome","text"),fld("passed","Passed","boolean"),fld("run_at","Run at","date")],
    decision:"New, thin child of decision_rule. Test results elsewhere (AI quality tests) are about prompts, not decision tables.",searched:"ai_test_run, audit_event"}];
   defs.forEach(d=>G(()=>ATLAS.addEntity(d)));W.ent=true}
  if(window.DATAMODEL&&DATAMODEL.register&&!W.dm){G(()=>DATAMODEL.register("decision_rule",{label:"Decision rule",source:"Decision rules",fields:[{k:"process_id",label:"Process",type:"text"},{k:"kind",label:"Kind",type:"enum",opts:KINDS.map(x=>x[0])},{k:"mode",label:"Mode",type:"enum",opts:MODES.map(x=>x[0])},{k:"status",label:"Status",type:"enum",opts:["draft","accepted","retired"]},{k:"owner",label:"Owner",type:"text"},{k:"version",label:"Version",type:"num"},{k:"conf_threshold",label:"Confidence threshold",type:"num"},{k:"auto_limit",label:"Automatic limit",type:"num"}]}));W.dm=true}
  if(!W.mod&&window.MODMAP&&MODMAP.addModule&&(!window.ATLAS||W.ent)){
   const r=G(()=>MODMAP.addModule({id:"dec_cov",name:"Decision rule coverage",sn:"Decision rule coverage",band:"plt",own:"Process governance lead",proposed:false,r:["process_definition","person","approval_policy","approval"],w:["decision_rule","decision_test_case"],
    flows:[{dir:"pull",other:"plat_proc",data:"Process steps and gates",entity:"process_definition",mode:"api",trig:"Process opened or edited"},{dir:"pull",other:"ppl_org",data:"Owners, approvers and backups",entity:"person",mode:"api",trig:"Owner lookup"},{dir:"pull",other:"flw_dmn",data:"Existing decision tables",entity:"approval_policy",mode:"api",trig:"Rule imported"},
     {dir:"push",other:"flw_appr",data:"Approval routing by rule",entity:"approval",mode:"event",trig:"Rule accepted"},{dir:"push",other:"adm_audit",data:"Rule changes, acceptances and test runs",entity:"audit_event",mode:"event",trig:"Rule saved"},{dir:"push",other:"chat_home",data:"Review-queue reminders to rule owners",entity:"notification",mode:"event",trig:"Draft older than 14 days"}]}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=true}
  if(!W.proc&&window.PROCLIB&&PROCLIB.addProcess&&W.mod){
   const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
   const r=G(()=>PROCLIB.addProcess({id:"decision_rules",name:"Decision rules",module:"dec_cov",owner:"Process governance lead",trigger:"A process is added or its steps change",
    steps:[st("Find the decision points","Read the process steps and list gates and steps that approve, route, review, release or close.","auto","Decision rules drafter","Immediate","Process steps","Decision points"),st("Draft a default table","An AI agent drafts a decision table from the step, its policy family and its neighbors.","agent","Decision rules drafter","Minutes","Decision points","AI-drafted rule"),st("Review and accept","The rule owner edits, tests and accepts, edits again later, or retires the draft.","gate","Process owner","14 days","AI-drafted rule","Accepted rule v1"),st("Test in the sandbox","Sample inputs show which row fires and what the mode does; cases are saved.","human","Rule owner","1 day","Accepted rule","Saved test cases"),st("Run and audit","Auto-decide rules decide within limits, others recommend; every decision cites the rule version.","auto","Platform","Immediate","Case and rule","Decision with audit entry"),st("Review each quarter","Owners review coverage, untested rules and overrides.","human","Process governance lead","Each quarter","Coverage and overrides","Revised rules")],
    inputs:["Process steps"],outputs:["Accepted decision rules","Audit entries"],entities:["decision_rule","decision_test_case"],metrics:["m_dec_cov","m_dec_owned","m_dec_tested","m_dec_drafts","m_dec_auto"],model:"cmmi"}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=true}
  if(!W.reg&&window.PROC&&PROC.reg){G(()=>PROC.reg("dec_cov",{title:"How a decision rule is drafted, accepted and tested",std:["bpmn"],steps:[{n:"Find the decision points",d:"Gates and steps that approve, route, review, release or close.",who:"robot",owner:"Decision rules drafter",sla:"instant"},{n:"Draft a default table",d:"An AI agent drafts it; it binds nothing yet.",who:"agent",owner:"Decision rules drafter",sla:"minutes"},{n:"Review and accept",d:"The rule owner accepts, edits or retires the draft.",who:"gate",owner:"Process owner",sla:"14 days"},{n:"Test",d:"Sandbox runs and saved test cases.",who:"human",owner:"Rule owner",sla:"1 day"}]}));W.reg=true}
 }catch(e){console.error("decision rules wire",e)}
 if(!(W.ent&&W.mod&&W.proc&&W.reg)&&(W.n=(W.n||0)+1)<12)setTimeout(wire,700);else refreshMetrics()}
setTimeout(wire,400);
setTimeout(refreshMetrics,900);

window.DECX={rulesFor,coverage:()=>{const c=coverage();return{processes:c.processes,withAcceptedRules:c.withAccepted,pctProcessesWithAcceptedRules:c.pctProcesses,processesWithAnyRule:c.withDrafts,decisionPoints:c.decisionPoints,accepted:c.accepted,aiDraftsAwaiting:c.drafts,noOwner:c.noOwner,noTest:c.noTest,pctOwned:c.pctOwned,pctTested:c.pctTested,autoRules:c.autoRules,autoWithinLimits:c.autoWithinLimits,byDomain:c.byDomain.map(o=>Object.assign({},o)),processes_list:c.processRows}},add,test,accept,saveVersion,setField,open:openProcRules,refresh:()=>{bump();return true},kinds:KINDS,modes:MODES};
})();
