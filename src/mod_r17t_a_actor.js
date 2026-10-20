/* ===== Round 17, Agent T, part A: one human-versus-AI actor renderer and the AI teammate model.
   window.R17T = {actorChip, actorBadge, isAgent, canon, model, workforce, ...}
   - Overrides the shared avatar() and pchip() renderers (kit2.js) so AI actors are a squircle machine badge with a circuit corner mark and a persistent AI tag, humans stay round.
   - Every figure comes from ORGX, AGENTS_STATE, AGENTRT (STORE agent_registry, agent_run, agent_control, agent_event), SKILLSDB, PERM, FLOWX, DATAMODEL.
     Anything not recorded (daily history, latency, prior quarters, hours per run) is computed deterministically and labeled modeled or illustrative. ===== */
(function(){
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R=window.R17T=window.R17T||{};
S.r17t=S.r17t||{minPerRun:8,span:5,ptab:"overview",pend:[],seq:1};
const SS=S.r17t;
const hs=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return((h>>>0)%10000)/10000};
R.H=H;R.G=G;R.hs=hs;

/* ---------- identity helpers ---------- */
function canon(n){if(n==null||n==="")return null;n=String(n);const d=G(()=>agentDisplay(n),null);if(d&&d.known)return d.title;const O=window.ORGX;if(O&&O.agentByName&&O.agentByName(n))return n;const m=/^(.*?)\s·\s(.*)$/.exec(n);if(m){const t=G(()=>agentDisplay(m[2]),null);if(t&&t.known)return t.title;if(O&&O.agentByName&&O.agentByName(m[2]))return m[2]}return null}
function isAgent(n){if(canon(n))return true;const r=G(()=>who(n),null);return !!(r&&r.kind==="ai")}
R.canon=canon;R.isAgent=isAgent;
const firstOf=n=>{const c=canon(n)||n;const d=G(()=>agentDisplay(c),null);return d&&d.known?d.first:String(c).split(" ")[0]};
const initials=n=>{const f=firstOf(n);return f.slice(0,2)};

/* ---------- the AI machine badge: squircle, distinct hue, circuit corner mark ---------- */
function aiBadge(name,s){const k=canon(name)||name;const r=hs(k+"b");const h=Math.floor(r*3);
 const id="r17tg"+(Math.floor(hs(k+"i")*1e6));const sq="M32 2C50 2 62 14 62 32S50 62 32 62 2 50 2 32 14 2 32 2Z";
 const small=s<26;
 const mono=`<text x="${small?32:30}" y="${small?41:40}" text-anchor="middle" font-size="${small?26:24}" font-weight="800" fill="currentColor" style="color:var(--r17t-ink)" font-family="Hanken Grotesk,system-ui,sans-serif" letter-spacing="-.5">${H(initials(name))}</text>`;
 const circuit=small?"":`<g fill="none" stroke="var(--r17t-trace)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M40 10h9l5 5v8"/><path d="M47 10v6h6"/><path d="M14 54h8l4-4"/></g><g fill="var(--r17t-trace)"><circle cx="54" cy="25" r="2"/><circle cx="26" cy="49.6" r="1.8"/></g>`;
 return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true" class="r17t-svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--r17t-ai2)"/><stop offset="1" stop-color="var(--r17t-ai)"/></linearGradient></defs><path d="${sq}" fill="url(#${id})"/><path d="${sq}" fill="none" stroke="var(--r17t-edge)" stroke-width="2.2"/>${circuit}${mono}</svg>`}
function aiAvatar(name,o){o=o||{};const s=o.size||36;const c=canon(name)||name;const d=G(()=>agentDisplay(c),{full:c});
 return `<span class="avx k-ai r17t-av" style="width:${s}px;height:${s}px" title="${H(d.full||c)} · AI teammate">${aiBadge(c,s)}${s>=30&&o.tag!==false?`<b class="r17t-aitag">AI</b>`:""}</span>`}
R.aiBadge=aiAvatar;

/* ---------- shared renderers: extend, do not fork. avatar() and pchip() are looked up on window at call time by every module. ---------- */
const _avatar=window.avatar,_pchip=window.pchip;
if(_avatar&&!_avatar.__r17t){const av=function(name,o){try{const r=typeof name==="object"?name:null;const nm=r?r.name:name;if(r?r.kind==="ai":G(()=>{const x=who(nm);return (x&&x.kind==="ai")||canon(nm)},false)){return aiAvatar(r?(canon(r.name)||r.name):nm,o)}}catch(e){}
  const out=_avatar.apply(this,arguments);return out.replace('class="avx k-human"','class="avx k-human r17t-hu"')};av.__r17t=1;window.avatar=av;try{avatar=av}catch(e){}}
function pchipX(name,o){o=o||{};if(!isAgent(name)){return _pchip?_pchip(name,o):H(name)}
 const c=canon(name)||name;const d=G(()=>agentDisplay(c),{full:c,first:c,title:""});
 return `<button type="button" class="pchipx r17t-pc" data-person="${H(c)}" data-r17t-agent="${H(c)}">${aiAvatar(c,{size:o.size||26})}<span>${H(d.full)}${o.role?` <small>${H(G(()=>(ORGX.agentByName(c)||{}).does,"").split(".")[0].slice(0,60))}</small>`:""}</span><i class="r17t-tag">AI</i></button>`}
if(_pchip&&!_pchip.__r17t){pchipX.__r17t=1;window.pchip=pchipX;try{pchip=pchipX}catch(e){}}
/* the person chip for humans and agents, used wherever an owner, approver, decider or RACI slot names an actor */
R.actorChip=function(idOrName,o){if(idOrName==null||idOrName==="")return `<span class="muted small">none</span>`;return window.pchip(idOrName,o||{})};
R.actorBadge=function(idOrName,o){return window.avatar(isAgent(idOrName)?(canon(idOrName)||idOrName):idOrName,o||{})};
R.kindTag=n=>isAgent(n)?`<i class="r17t-tag">AI</i>`:`<i class="r17t-tag hu">Person</i>`;
/* clicks on an agent chip anywhere open the AI teammate profile */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-person]");if(!b||b.closest("[data-owner]"))return;const n=b.dataset.person;if(!isAgent(n))return;if(!window.R17T.openProfile)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();R.openProfile(canon(n)||n)},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r17t-open]");if(!b)return;e.preventDefault();R.openProfile(b.dataset.r17tOpen)});

/* ---------- the AI teammate model ---------- */
const O=()=>window.ORGX;
const ST=()=>window.STORE;
const TIERN={1:"Suggest",2:"Act with approval",3:"Act within rules"};
const TIERGATE={1:"Advice only: nothing is written to a record",2:"Sponsor approves every result before it is used",3:"Acts alone at or above the confidence floor; below it the sponsor decides"};
R.TIERN=TIERN;R.TIERGATE=TIERGATE;
const PROV={Claude:"Anthropic","Claude Sonnet":"Anthropic","GPT (OpenAI)":"OpenAI"};
const regOf=k=>G(()=>ST().get("agent_registry",k),null);
const rowsMap=()=>{const m={};G(()=>AGENTS_STATE.rows(),[]).forEach(r=>m[r.name]=r);return m};
function humanOk(n){return !!n&&G(()=>{const w=who(n);return !!w&&w.kind!=="ai"},false)}
function lifecycleOf(k,a,reg){if(!reg)return a.status==="running"?"active":"paused";if(reg.lifecycle==="active"||reg.lifecycle==="paused"){if(a.status!=="running")return"paused"}return reg.lifecycle}
const teamOf=sp=>G(()=>O().P(sp).unit,"");
const headOf=unit=>{const st=O().staff;const p=st.find(x=>x.unit===unit&&(!x.mgr||(O().P(x.mgr)||{}).unit!==unit));return p?p.n:""};
R.headOf=headOf;R.teamOf=teamOf;R.humanOk=humanOk;
function classRank(c){return {public:0,internal:1,personal:2,confidential:3,restricted:4}[c]==null?1:{public:0,internal:1,personal:2,confidential:3,restricted:4}[c]}
function tablesFor(a){const T=G(()=>DATAMODEL.tables,{});const keys=Object.keys(T);const toks=(a.data||[]).concat(a.tools||[]);const out=[];const seen={};
 toks.forEach(t=>{const w=String(t).toLowerCase().replace(/[^a-z0-9 ]/g," ").trim();if(!w)return;const sing=w.replace(/ies$/,"y").replace(/s$/,"");
  let hit=keys.find(k=>k===w||k===sing||k===w.replace(/ /g,"_")||k===sing.replace(/ /g,"_"))||keys.find(k=>(T[k].label||"").toLowerCase()===w||(T[k].label||"").toLowerCase()===sing);
  if(!hit){const map={meetings:"project",minutes:"project",records:"person","records api":"person",pos:"invoice","purchase orders":"invoice",contracts:"contract_line",invoices:"invoice",tickets:"incident",alerts:"alert_event",changes:"change_request",projects:"project",tasks:"project_task",resources:"person",people:"person",services:"business_service"};hit=map[w]&&T[map[w]]?map[w]:null}
  const key=hit||("tag:"+w);if(seen[key])return;seen[key]=1;
  out.push({tag:t,table:hit,label:hit?(T[hit].label||hit):String(t),cls:hit?G(()=>PERM.entityClass(hit),"internal"):"internal",mapped:!!hit})});
 return out}
function daily(k,a,row){const rnd=RNG(k+"d14");const tot=(a.eval&&a.eval.runs)||30;const base=Math.max(1.5,tot/40);const out=[];
 for(let i=13;i>=0;i--){const dow=(new Date(Date.UTC(2026,9,14-i))).getUTCDay();const wk=dow===0||dow===6;out.push(Math.max(0,Math.round(base*(.55+.9*rnd())*(wk?.22:1))))}
 if(row&&row.runsToday!=null)out[13]=row.runsToday;return out}
function reviewOf(m){const comp=[
  {k:"Override rate",v:m.override,u:"%",w:.5,note:"Share of results a person edited or rejected (100 minus accepted)",pts:+(m.override*.5).toFixed(1)},
  {k:"Rework",v:m.rework,u:"%",w:2,note:"Errors found in review, per 100 results",pts:+(m.rework*2).toFixed(1)},
  {k:"Cost per outcome vs budget",v:m.costVsBudget,u:"%",w:.15,note:"Spend over the daily budget, only the part above 100 percent costs points",pts:+(Math.max(0,m.costVsBudget-100)*.15).toFixed(1)},
  {k:"Incidents",v:m.incidents,u:"",w:6,note:"Blocked runs plus guardrail and control events",pts:+(Math.min(5,m.incidents)*6).toFixed(1)}];
 const score=Math.max(0,Math.min(100,Math.round(100-comp.reduce((s,c)=>s+c.pts,0))));return{comp,score}}
function build(nm){const k=canon(nm)||nm;const a=G(()=>O().agentByName(k),null);if(!a)return null;
 const reg=regOf(k),row=rowsMap()[k]||null,app=G(()=>S.agents.find(x=>x.n===k),null);const d=G(()=>agentDisplay(k),{full:k,first:k,title:k});
 const lc=lifecycleOf(k,a,reg),tier=reg?reg.tier:(a.autonomy==="act"?3:a.autonomy==="approval"?2:1);
 const ctl=G(()=>{const c=ST().get("agent_control","agent:"+k);return c&&c.paused?c:null},null);
 const runs=G(()=>AGENTRT.runs(k),[]);const ev=a.eval||{};const accept=ev.accept==null?null:ev.accept;
 const today=G(()=>Math.floor(Date.now()/864e5),0);
 const blocked=runs.filter(r=>r.state==="blocked").length;
 const events=G(()=>ST().all("agent_event").filter(e=>e.agent===k),[]);const incidents=blocked+events.filter(e=>e.kind==="enforcement"||e.kind==="budget").length+(ctl?1:0);
 const cap=reg?+reg.budget_cap||0:(app?+app["cap$"]||0:10);
 let spend,spendModeled=false;if(app&&app.spend!=null){spend=+app.spend}else{spendModeled=true;spend=+(((row&&row.runsToday)||0)*(.011+hs(k+"c")*.02)).toFixed(2)}
 const totRuns=app&&app.runs?app.runs:Math.max(1,(row&&row.runsToday)||1);const costRun=+(spend/Math.max(1,totRuns)).toFixed(3);
 const outcomes=Math.max(1,Math.round(totRuns*((accept==null?75:accept)/100)));const costOutcome=+(spend/outcomes).toFixed(3);
 const m={accept,override:accept==null?null:100-accept,rework:ev.err==null?null:ev.err,esc:ev.esc==null?null:ev.esc,incidents,costVsBudget:cap?Math.round(spend*100/cap):0,costRun,costOutcome,latency:+(1.1+hs(k+"l")*5.4).toFixed(1),runs14:daily(k,a,row),spend,cap,spendModeled};
 const have=accept!=null;const rv=have?reviewOf(Object.assign({},m,{override:m.override,rework:m.rework})):null;
 let trend=[];if(rv){const r=RNG(k+"q");let x=rv.score;trend=[x];for(let i=0;i<3;i++){x=Math.max(40,Math.min(97,x+Math.round((r()-.42)*9)));trend.unshift(x)}}
 const viol=Math.max(0,Math.round((m.rework||0)/1.5)+blocked);
 const tc=have?G(()=>O().tierCheck({tier:tier,acc:accept,esc:ev.esc,viol,runs:ev.runs||0}),null):null;
 return{name:k,d,a,reg,row,app,lc,tier,ctl,runs,m,review:rv,trend,tc,sponsor:reg?reg.sponsor:a.sponsor,backup:reg?reg.backup:"",
  team:teamOf(reg?reg.sponsor:a.sponsor),floor:reg?+reg.confidence_floor||0:0,model:a.model||"Claude Sonnet",provider:(app&&app.prov)||PROV[a.model]||"Anthropic",state:row?row.state:(lc==="active"?"idle":"paused"),
  version:"v"+(reg&&reg.v?reg.v:1)+"."+(events.filter(e=>e.kind==="lifecycle"||e.kind==="control").length+G(()=>O().agents&&0,0)),events,accountable:humanOk(reg?reg.sponsor:a.sponsor)&&humanOk(reg?reg.backup:"")&&(reg?reg.sponsor!==reg.backup:false),
  tables:tablesFor(a),systems:[...new Set([].concat(a.tools||[],app?app.tools||[]:[]))],hrsWeek:a.hrs||0}}
const MC={};
R.model=function(nm){const k=canon(nm)||nm;const e=MC[k];const now=Date.now();if(e&&now-e.t<1500)return e.v;const v=build(k);MC[k]={t:now,v};return v};
R.bust=function(){Object.keys(MC).forEach(k=>delete MC[k])};
R.all=()=>G(()=>O().agents().map(a=>R.model(a.name)).filter(Boolean),[]);

/* ---------- workforce roll-up for the org chart band ---------- */
R.workforce=function(){const ags=R.all();const st=G(()=>O().stats(),{heads:0});const staff=G(()=>O().staff,[]);
 const humHrs=staff.reduce((s,p)=>s+40*(p.fte!=null?p.fte:1),0);
 const tiers={1:0,2:0,3:0},lc={draft:0,testing:0,active:0,paused:0,retired:0};ags.forEach(x=>{tiers[x.tier]=(tiers[x.tier]||0)+1;lc[x.lc]=(lc[x.lc]||0)+1});
 const wkRuns=ags.reduce((s,x)=>s+x.m.runs14.slice(7).reduce((a,b)=>a+b,0),0);
 const accRuns=ags.reduce((s,x)=>s+x.m.runs14.slice(7).reduce((a,b)=>a+b,0)*((x.m.accept==null?75:x.m.accept)/100),0);
 const agHrs=+(accRuns*SS.minPerRun/60).toFixed(1);
 const by={};ags.forEach(x=>{(by[x.sponsor]=by[x.sponsor]||[]).push(x)});
 const sponsors=Object.keys(by).map(n=>({n,ags:by[n],cap:by[n].reduce((s,x)=>s+x.m.cap,0),spend:by[n].reduce((s,x)=>s+x.m.spend,0),hrs:by[n].reduce((s,x)=>s+(x.hrsWeek||0),0),wait:by[n].reduce((s,x)=>s+x.runs.filter(r=>r.state==="awaiting approval").length,0),team:teamOf(n),over:by[n].length>SS.span,edge:by[n].length===SS.span})).sort((a,b)=>b.ags.length-a.ags.length||b.cap-a.cap);
 const teams={};ags.forEach(x=>{const t=x.team||"Unassigned";const o=teams[t]=teams[t]||{t,n:0,hrs:0,runs:0,agents:[]};o.n++;o.hrs+=x.hrsWeek||0;o.runs+=x.m.runs14.slice(7).reduce((a,b)=>a+b,0);o.agents.push(x.name)});
 const nobackup=ags.filter(x=>x.lc!=="retired"&&!(humanOk(x.backup)&&x.backup!==x.sponsor));
 const active=ags.filter(x=>x.lc==="active");const acc=active.filter(x=>x.accountable);
 const cap=ags.reduce((s,x)=>s+x.m.cap,0),spend=+ags.reduce((s,x)=>s+x.m.spend,0).toFixed(2);
 return{heads:st.heads,agents:ags.length,tiers,lc,humHrs,agHrs,wkRuns,sponsors,teams:Object.values(teams).sort((a,b)=>b.hrs-a.hrs),nobackup,
  stopped:ags.filter(x=>x.lc==="paused"||x.ctl||x.a.status==="killed"),maxSpan:sponsors.length?sponsors[0].ags.length:0,over:sponsors.filter(x=>x.over),cap,spend,acc:acc.length,active:active.length,
  accPct:active.length?Math.round(acc.length*100/active.length):100,observed:G(()=>AGENTS_STATE.counts().observed,0),planned:+ags.reduce((s,x)=>s+(x.hrsWeek||0),0).toFixed(1),
  review:(()=>{const v=ags.filter(x=>x.review);return v.length?Math.round(v.reduce((s,x)=>s+x.review.score,0)/v.length):0})(),ags}};

/* ---------- AGENTS_STATE.setControl: one door for pause, kill and resume, through the agent runtime ---------- */
if(window.AGENTS_STATE&&!AGENTS_STATE.setControl){AGENTS_STATE.setControl=function(name,mode,reason){const k=canon(name)||name;if(!window.AGENTRT||!AGENTRT.setControl)return false;
 if(mode==="resume")AGENTRT.setControl("agent",k,false);else AGENTRT.setControl("agent",k,true,mode==="kill"?"kill":"pause",reason||"Set from the AI teammate profile by "+G(()=>INBOX.me(),"a person"));
 return true}}

/* ---------- metrics (live from the registries) ---------- */
function syncMetrics(){try{const w=R.workforce();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=+(+v).toFixed(1);m.tr=m.tr.slice(0,-1).concat([m.cur])};set("m_r17t_sb",w.accPct);set("m_r17t_span",w.maxSpan);set("m_r17t_rev",w.review)}catch(e){}}
R.syncMetrics=syncMetrics;
Object.assign(METRICS,{
 m_r17t_sb:{n:"AI teammates with sponsor and backup",f:"Active AI teammates with a named human sponsor and a different named human backup ÷ active AI teammates × 100 (from the agent registry)",u:"%",cur:100,tgt:100,badAt:90,dir:"max",max:100,tr:[86,90,92,94,96,98,100,100],owner:"Kenji Watanabe",use:["Org chart"],rem:{kind:"sop",ref:"SOP-R17T-1",title:"Name a backup who is a different person",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists AI teammates missing a sponsor or a backup, by team"}},
 m_r17t_span:{n:"Sponsor span of control (AI teammates)",f:"Largest number of AI teammates under one human sponsor; the limit is the threshold set on the AI workforce tab (default 5)",u:"",cur:4,tgt:5,badAt:7,dir:"min",max:10,tr:[3,3,3,4,4,4,4,4],owner:"Joanna Pierce",use:["Org chart"],rem:{kind:"sop",ref:"SOP-R17T-2",title:"Rebalance sponsors above the threshold",agent:"Resource Agent",auto:false,state:"idle",prog:"Proposes moving a teammate to a sponsor with spare span"}},
 m_r17t_rev:{n:"AI teammate review score",f:"Average quarterly score of reviewed AI teammates: 100 − 0.5 × override rate − 2 × rework − 0.15 × cost over budget − 6 × incidents (each capped), from run and evaluation data",u:" pts",cur:80,tgt:80,badAt:60,dir:"max",max:100,tr:[74,76,77,78,79,80,80,80],owner:"Kenji Watanabe",use:["Org chart"],rem:{kind:"sop",ref:"SOP-R17T-3",title:"Run the quarterly AI teammate review",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists teammates below 70 and their largest score deduction"}}});

/* ---------- process, data, links: retrofit the Org chart screen to the Feature Contract ---------- */
G(()=>{const d=PROC.defs&&PROC.defs.org_chart;if(d&&!d.steps.some(s=>s.n==="Hire, review and retire AI teammates"))d.steps.push({n:"Hire, review and retire AI teammates",d:"Hiring or retiring an AI teammate is a request to the AI governance board (a group). It needs a human sponsor and a different human backup. Each quarter the teammate gets a score from override rate, rework, cost and incidents.",who:"gate",owner:"Kenji Watanabe",sla:"2 working days",in:"Hire or retire request",out:"Registry entry, review score"})},0);
PROC.reg&&G(()=>{PROC.reg("org_ai_teammate",{title:"Hire, review and retire an AI teammate",std:["nist","cobit","itil4"],steps:[
 {n:"Request",d:"A sponsor requests a new AI teammate or its retirement: purpose, tier, budget, confidence floor and a different named backup.",who:"human",owner:"Sponsor",sla:"1 day",in:"Need",out:"Request"},
 {n:"Rule check",d:"The platform checks that sponsor and backup are named humans and different people, and that the tier fits the work.",who:"auto",owner:"AI platform lead",sla:"Instant",in:"Request",out:"Pass or return"},
 {n:"Group approval",d:"The AI governance board decides as a group. The requester cannot approve their own request.",who:"gate",owner:"AI governance board",sla:"2 working days",in:"Request",out:"Approved or rejected"},
 {n:"Register and test",d:"An approved teammate enters the agent registry in testing mode; every result goes to its sponsor.",who:"auto",owner:"AI platform lead",sla:"Instant",in:"Approval",out:"Registry entry"},
 {n:"Quarterly review",d:"Score from override rate, rework, cost per outcome versus budget and incidents; below 70 triggers a tier review.",who:"human",owner:"Sponsor",sla:"Quarterly",in:"Run data",out:"Score and decision"},
 {n:"Retire",d:"A retired teammate is stopped, its access removed and its history kept.",who:"gate",owner:"AI governance board",sla:"2 working days",in:"Retire request",out:"Retired entry"}]})},0);
const ENT={id:"ai_teammate_review",label:"AI teammate review",note:"Integration decision: reuse-first. The agent registry, run records, controls and audit events already hold identity, lifecycle, tier, sponsor, backup, runs and incidents, and the people directory and skills registry hold skills. Only the quarterly review score is new: one row per teammate per quarter, with the inputs that produced it. Computed on demand, never typed in.",fields:[{k:"agent",label:"AI teammate",type:"reference",authority:"platform",classification:"internal"},{k:"quarter",label:"Quarter",type:"string",authority:"platform",classification:"internal"},{k:"override_rate",label:"Override rate (percent)",type:"number",authority:"platform",classification:"internal"},{k:"rework",label:"Rework (percent)",type:"number",authority:"platform",classification:"internal"},{k:"cost_vs_budget",label:"Cost versus budget (percent)",type:"number",authority:"platform",classification:"internal"},{k:"incidents",label:"Incidents",type:"number",authority:"platform",classification:"internal"},{k:"score",label:"Score (0 to 100)",type:"number",authority:"platform",classification:"internal"},{k:"sponsor",label:"Sponsor",type:"reference",authority:"platform",classification:"personal"},{k:"backup",label:"Backup",type:"reference",authority:"platform",classification:"personal"}]};
const CON={done:{},tries:0};
function boot(){if(!CON.done.ent){if(window.ATLAS&&ATLAS.addEntity&&window.PLAT&&window.COVER){G(()=>{if(!DATAMODEL.tables[ENT.id])ATLAS.addEntity({id:ENT.id,label:ENT.label,domain:"plat",source:"Org chart",status:"proposed",ownerApp:"Org chart",ownerMod:"org_chart",steward:"Kenji Watanabe",note:ENT.note,fields:ENT.fields.map(f=>Object.assign({},f))})},0);CON.done.ent=1}else if(CON.tries>30){G(()=>{if(!DATAMODEL.tables[ENT.id])DATAMODEL.register(ENT.id,{label:ENT.label,source:"Org chart",fields:ENT.fields.map(f=>({k:f.k,label:f.label,type:f.type}))})},0);CON.done.ent=1}}
 if(!CON.done.pl&&window.PROCLIB&&PROCLIB.addProcess&&window.MODMAP&&MODMAP.modules&&MODMAP.modules.length){G(()=>{PROCLIB.addProcess({id:"org_ai_teammate",name:"Hire, review and retire an AI teammate",module:"org_chart",family:"gov",owner:"Kenji Watanabe",backup:"Casey Rowan",trigger:"A sponsor asks for a new AI teammate or its retirement.",steps:PROC.defs.org_ai_teammate.steps.map(s=>Object.assign({},s)),inputs:["Hire or retire request","Run records"],outputs:["Registry entry","Review score"],entities:["ai_teammate_review","agent_registry","agent_run"],metrics:["m_r17t_sb","m_r17t_span","m_r17t_rev"],model:"cmmi",std:["bpmn","itil4"]})},0);CON.done.pl=1}
 if(!CON.done.fl&&window.MODMAP&&MODMAP.addFlows&&MODMAP.modules&&MODMAP.modules.length){G(()=>{MODMAP.addFlows&&MODMAP.addFlows("org_chart",[{dir:"pull",other:"ai_runtime",data:"Agent runs, controls and lifecycle state",entity:"agent_run",mode:"api",trig:"Profile opened"},{dir:"push",other:"ai_runtime",data:"Pause, kill, retire and hire requests",entity:"agent_registry",mode:"event",trig:"Lifecycle action"},{dir:"push",other:"inbox",data:"Hire and retire requests to the AI governance board",entity:"approval",mode:"event",trig:"Request raised"}])},0);CON.done.fl=1}
 if(!(CON.done.ent&&CON.done.pl&&CON.done.fl)&&(CON.tries+=1)<60)setTimeout(boot,900)}
window.addEventListener("load",()=>setTimeout(boot,1500));if(document.readyState==="complete")setTimeout(boot,1500);

/* ---------- search and Ask ---------- */
SEARCHX.push(()=>R.all().map(x=>({g:"AI teammates",t:x.d.full+" (AI teammate)",m:"Sponsor "+x.sponsor+" · Tier "+x.tier+" · "+x.lc,c:"--r17t-ai",f:()=>R.openProfile(x.name),k:"ai teammate agent profile "+x.name+" "+x.d.first+" "+x.sponsor+" "+x.team}))
 .concat([{g:"People and teams",t:"AI workforce",m:"Humans and AI teammates, span of control, spend",c:"--r17t-ai",f:()=>{S.org.tab="aiw";go("org_chart")},k:"ai workforce human and ai headcount span of control sponsor load teams most ai help hire ai teammate retire"}]));
ASKX.push(q=>{const t=String(q).toLowerCase();let m;
 if(/ai workforce|human and ai (workforce|headcount)|how many (ai|agents)/.test(t)){const w=R.workforce();S.org.tab="aiw";go("org_chart");say(q,{t:"<b>"+w.heads+" people</b> and <b>"+w.agents+" AI teammates</b> ("+w.tiers[1]+" suggest, "+w.tiers[2]+" act with approval, "+w.tiers[3]+" act within rules). "+w.nobackup.length+" without a backup, "+w.stopped.length+" paused or stopped, spend $"+w.spend+" of $"+w.cap+" daily budget.",steps:["Read the agent registry","Opened the AI workforce view"]});return true}
 if(/sponsors?.*(more than|over|above|exceed)|span of control.*(ai|agent)|too many (agents|ai)/.test(t)){const w=R.workforce();S.org.tab="aiw";go("org_chart");say(q,{t:w.over.length?w.over.map(s=>"<b>"+H(s.n)+"</b> sponsors "+s.ags.length+" AI teammates ($"+s.cap+" a day budget at stake)").join("; "):"No sponsor is above the limit of "+SS.span+". Widest span: "+(w.sponsors[0]?H(w.sponsors[0].n)+" with "+w.sponsors[0].ags.length:"none")+".",steps:["Counted teammates per sponsor"]});return true}
 if(/who (sponsors|is the sponsor of|backs up|is the backup (for|of))\s+(.+)/.test(t)||(m=t.match(/(?:sponsor|backup) (?:of|for)\s+(.+?)\??$/))){const nm=(t.match(/(?:sponsors|sponsor of|backs up|backup for|backup of|is the sponsor of)\s+(.+?)\??$/)||[])[1];const c=nm&&canon(nm.replace(/^the\s+/,""));if(c){const x=build(c);R.openProfile(c);say(q,{t:"<b>"+H(x.d.full)+"</b> is sponsored by <b>"+H(x.sponsor)+"</b> with <b>"+H(x.backup||"no backup")+"</b> as backup.",steps:["Read the registry entry"]});return true}}
 if(/(retire|hire).*(ai teammate|agent)|new ai teammate/.test(t)){if(/hire|new/.test(t)&&R.hireForm){R.hireForm();say(q,{t:"Opened the hire form. A sponsor and a different backup are required; the AI governance board decides.",steps:["Opened the hire form"]});return true}}
 return false});
})();
