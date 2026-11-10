/* ===== mod_s_tracks: executive tracks for the Showroom (backlog DC-51). Global: window.TRACKS.
   A track is one thread per executive across existing screens, six stages long. It runs on the experience engine (window.EXP,
   ripples DC-41): each track is one EXP mission whose six checkpoints are the stages, so briefs, hints, claims, ripples, the
   facilitator console and the leave-behind all come from the engine. No new business screen (DC-34, R3).
     TRACKS.list()  TRACKS.get(id)  TRACKS.start(id,{stage,mode})  TRACKS.open(id)  TRACKS.current()  TRACKS.value(metricId)
   The track bar is a strip at the top of the view while a track runs: six stage chips (the current one marked), the track's
   metric (the ripple tile), Next and Leave track. Deep link: ?track=<id>&stage=<n> (same pattern as ?showroom=coo&beat=4).
   Metrics TKVT, STSH and MWLS follow the vault note "EWP - Demo Track Metrics" (Metric Definition Standard v2); thresholds are
   hypotheses and every value is labeled modeled or simulated. Fictional sample data only; names come from data. Prefix: trk-. ===== */
(function(){
const W=window,D=document;const X=W.EXP;if(!X)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;const arr=x=>Array.isArray(x)?x:[];
const cash=v=>G(()=>U.moneyShort(v),null)||("$"+Math.round(v));
const r1=v=>Math.round(v*10)/10;

/* ---------- metrics (vault: EWP - Demo Track Metrics). Thresholds are hypotheses until a buyer test (DC-26). ---------- */
const takeoutTgt=()=>+G(()=>TAKEOUT.tgt,0)||0;
/* realized: cost savings an owner has recorded as realized in the benefits register (bud_ben) */
const realized=()=>arr(G(()=>BUDX.B().ben,[])).filter(b=>/^Cost (avoidance|saving)$/.test(String(b.ty||""))).reduce((a,b)=>a+arr(b.real).reduce((s,v)=>s+(+v||0),0),0);
const tkvt=()=>{const t=takeoutTgt();return t?r1(realized()/t*100):0};
const sx=()=>G(()=>SXSUM(),null);
const stsh=()=>{const s=sx();return s?r1(s.cover):null};
const orphan=()=>{const s=sx();return s?s.orAppr:null};
/* MWLS has no data source until PR-85 and PR-88; phase A of PR-96 runs on a fictional filing with both weaknesses identified */
const MW_SIM={identified:2,root_cause:0,plan:0,implemented:0,operating:0,tested:0,concluded:0};
const mwls=()=>Object.keys(MW_SIM).filter(k=>k!=="concluded").reduce((a,k)=>a+MW_SIM[k],0);
const DEF=[
 {id:"m_tkvt",acr:"TKVT",n:"Takeout realized against target",u:"%",tgt:100,badAt:80,dir:"max",max:100,label:"modeled",track:"cost",val:tkvt,
  f:"Σ cost savings recorded as realized by their owner in the benefits register ÷ takeout target × 100",
  why:"A takeout program is judged by money that left the run rate, not by cuts announced; the COO and CFO look at the same number.",
  dec:"Which candidate cuts to approve next, and whether to widen the search for cuts or stop cutting.",
  how:"Benefits register (bud_ben) for realized amounts, takeout target in the sample data. Cumulative, refreshed monthly. Modeled.",
  trend:"Up, along the planned curve to 100%.",
  thr:"Under 80% of the plan-to-date curve for 2 months, or an approved cut with no confirmed result 90 days after its due date (hypothesis).",
  on:"Approve the next cuts in order of value and keep the owners' confirmation dates.",
  off:"Stalled cut: owner review, then the approval group decides. Too few candidates: widen the scan. Service harm: pause the cut.",
  obs:"Stops mattering when the target is met or restated. Fallback: realized savings still holding after 12 months (not yet defined).",
  gaps:["Who confirms a realized saving is not defined","Realized amounts are recorded to date, not annualized run rate","Plan-to-date curve is not modeled, so the threshold is checked against the target only"],
  rem:{kind:"sop",ref:"SOP-TK-01",title:"Review each approved cut with no confirmed result",agent:"Portfolio Agent",auto:false,state:"idle"}},
 {id:"m_stsh",acr:"STSH",n:"Spend traced to strategy",u:"%",tgt:100,badAt:95,dir:"max",max:100,label:"modeled",track:"strat",val:()=>stsh(),
  f:"Approved dollars on work linked to an objective ÷ all approved dollars in scope × 100 (goal-to-money chain, SXSUM)",
  why:"Orphan spend is the first place to look for takeout, and a high orphan share says strategy is not reaching operations.",
  dec:"For each orphan item: link it to an objective, stop it, or sunset it; and whether to fund new demand.",
  how:"Strategy to execution trace (strat_exec) and budget traceability (bst). Monthly, enterprise view. Modeled.",
  trend:"Up, with orphan dollars falling to $0.",
  thr:"Any orphan line older than one planning cycle, or a fall of 2 points in one period (hypothesis).",
  on:"Hold, and keep the rule that new demand needs an objective link at intake.",
  off:"Owner links, stops or sunsets each orphan line within one cycle; re-cascade first if objectives changed; sample links if they look padded.",
  obs:"Stops mattering once intake blocks unlinked work. Fallback: exceptions to that rule (not yet defined).",
  gaps:["Link quality is not checked, so loose links can pad the share","Overlaps Alignment coverage (m_sx_cover), which uses the same chain"],
  rem:{kind:"sop",ref:"SOP-SX-02",title:"Review orphan work at the monthly portfolio board",agent:"Portfolio Agent",auto:false,state:"idle"}},
 {id:"m_mwls",acr:"MWLS",n:"Material weaknesses not yet concluded",u:"",tgt:0,badAt:2,dir:"min",max:10,label:"simulated",track:"mw",val:mwls,
  f:"Count of disclosed material weaknesses in each of seven states (identified to management conclusion); shown here as the count not yet concluded",
  why:"A weakness that does not move is the exposure; the CFO and the audit committee need movement toward a conclusion a person records.",
  dec:"Where to put remediation effort, when to escalate a stalled weakness, and when to ask management for its conclusion.",
  how:"Weakness case file and approval gates (PR-85, PR-88, not built). Until then a simulated count from the fictional filing run. Simulated.",
  trend:"Flow to the right; none past its owner-set limit. The last state is always a person's conclusion.",
  thr:"Any weakness with no gate move past its review interval, or an operating period that ends after the next year-end test (hypothesis).",
  on:"Hold, keep evidence attached to each gate, remind owners of the next gate.",
  off:"Before plan: owner and backup, escalate. Implemented, no evidence: collect it. Tested, no conclusion: ask the responsible role. Never marked resolved automatically.",
  obs:"Stops mattering when no material weakness is open. Fallback: open significant deficiencies (not yet defined).",
  gaps:["No data source until PR-85 and PR-88","Days in state are not shown","No buyer test yet"],
  rem:{kind:"sop",ref:"SOP-MW-01",title:"Escalate a weakness with no gate move",agent:"Controls Agent",auto:false,state:"idle"}}];
function refresh(){if(typeof METRICS==="undefined")return;DEF.forEach(d=>{const v=G(d.val,null);if(v==null)return;const m=METRICS[d.id];if(!m)return;m.cur=v;m.tr[7]=v})}
function metricsInit(){if(typeof METRICS==="undefined")return;DEF.forEach(d=>{if(METRICS[d.id])return;const v=G(d.val,null);const c=v==null?0:v; /* never seed a missing value as the target */
 METRICS[d.id]={n:d.n,f:d.f,u:d.u,cur:c,tgt:d.tgt,badAt:d.badAt,dir:d.dir,max:d.max,tr:[0,1,2,3,4,5,6,7].map(()=>c),owner:"COO office",backup:"CFO office",
  use:["Executive tracks","Home"],rem:d.rem,acr:d.acr,label:d.label,why:d.why,dec:d.dec,how:d.how,trend:d.trend,thr:d.thr,on:d.on,off:d.off,obs:d.obs,gaps:d.gaps.slice()}})}
G(metricsInit);
G(()=>HOOKS.on("beforeGo",()=>G(refresh),{id:"trk-metrics"}));
G(()=>HOOKS.on("audit",e=>{if(/^(recorded benefit actual|Linked project to goal|linked funded work|re-linked initiative)$/.test(String(e&&e.a||"")))setTimeout(()=>G(refresh),0)},{id:"trk-metrics-audit"}));
const fmtM=(id,v)=>{const m=G(()=>METRICS[id],null);if(!m)return"";v=v==null?m.cur:v;return m.u==="%"?r1(v)+"%":String(v)};

/* ---------- the stages: one checkpoint each, in order (a stage fires only once the one before it is done or skipped) ---------- */
const done=id=>G(()=>!!X.current().done[id],false);
/* a stage the buyer completed, not one skipped by Next or a deep link (success and the debrief rest on these) */
const did=id=>G(()=>{const d=X.current().done[id];return !!d&&!d.skipped},false);
const skipped=()=>G(()=>{const c=X.current();return c.m.checkpoints.filter(x=>c.done[x.id]&&c.done[x.id].skipped).length},0);
const on=(ev,ids)=>(ev.kind==="go"&&ids.indexOf(ev.screen)>=0)||((ev.kind==="render"||ev.kind==="tick")&&ids.indexOf(G(()=>S.screen,""))>=0);
const isAudit=(ev,re)=>ev.kind==="audit"&&re.test(ev.a);
const later=(f,ms)=>setTimeout(()=>G(f),ms||350);
function seq(cps){return cps.map((c,i)=>{const w=c.when;return Object.assign({},c,{when:(ev,ctx)=>(i===0||done(cps[i-1].id))&&w(ev,ctx)})})}
/* the request the COO may decide at its current stage (the same group check decide() makes): a retirement first, else any */
function cutRequest(){const me=G(()=>INBOX.me(),"");const L=arr(G(()=>BUDREQ.requests(),[])).filter(r=>!/^(sub|funded|declined|deferred|done)$/.test(r.st)&&r.req!==me&&G(()=>APG.check(me,"budget_request",{id:r.id,requester:r.req,stage:r.st,amount:r.amt,named:G(()=>BUDREQ.rev(r.st,r).name,"")}).ok,false));
 return L.find(r=>/retire|decommission|consolidat/i.test(r.t))||L[0]||null}
const reqOf=id=>G(()=>BUDREQ.requests().find(x=>x.id===id),null);

X.register({id:"trk_cost",track:"cost",title:"Cost Takeout",role:["coo"],tenants:"any",clock:180,labels:["simulated","modeled","fact","hypothesis"],go:"exe_strat",
 screens:["exe_strat","bst","r18_spend","port","bud_req","r18_builds","strat_exec","bud_ben"],ripples:["budget","metric"],
 brief:"Take cost out of the run rate against a target, from where the money goes to a saving its owner confirms.",
 goal:"One cut is decided, you have seen its trail, and a realized saving moves takeout against target.",
 situation:ctx=>"Seeded: a takeout target of "+cash(takeoutTgt())+" a year (modeled); "+cash(realized())+" is recorded as realized so far.",
 setup(ctx){ctx.tk0=tkvt();const r=cutRequest();ctx.br=r?r.id:"";ctx.brT=r?r.t:""},
 checkpoints:seq([
  {id:"target",t:"Set the target",screen:"exe_strat",
   when:ev=>isAudit(ev,/^(created key result|updated key result|created objective|completed objective)$/),
   hint:{after:25,text:"In Strategy alignment, add a key result for run-rate cost taken out, or update one, so the takeout target sits on an objective."},
   claim:{k:"fact",t:"Targets live on objectives and key results, each with an owner and a date."},
   recover:()=>go("exe_strat")},
  {id:"money",t:"See where the money goes",screen:"bst",
   when:ev=>on(ev,["bst","r18_spend"]),
   hint:{after:20,text:"Open Budget and spend traceability, or Spend by domain, to see who owns which dollars."},
   claim:{k:"modeled",t:"Spend is grouped by owner and goal from the records; dollar figures are modeled."},
   recover:()=>go("bst")},
  {id:"candidates",t:"Find candidate cuts",screen:"bud_req",
   when:ev=>on(ev,["port","bud_req","r18_builds"]),
   hint:{after:20,text:"Open Budget requests, the Portfolio or the Build list: retirements and duplicates are the first candidates."},
   claim:{k:"fact",t:"Candidates come from requests, the portfolio and the build list, each with an owner."},
   recover:()=>go("bud_req")},
  {id:"decide",t:"Decide one cut",screen:"bud_req",
   when:(ev,ctx)=>{if(isAudit(ev,/^Budget request (advanced|funded|returned|deferred|declined)$/)){const m=ev.d.match(/BR-\d+/);const r=m?reqOf(m[0]):null;
     ctx.br=m?m[0]:ctx.br;ctx.brT=r?r.t:ctx.brT;ctx.cut=ev.a.replace(/^Budget request /,"");
     ctx.avoid=/^(deferred|declined)$/.test(ctx.cut)?(r?+r.amt||0:0):0;ctx.claim=ctx.avoid?0:(r?+r.ben||0:0);return true}
    return false},
   hint:{after:30,text:"In Budget requests, open the request waiting at your stage and decline or defer it if it does not earn its cost, with a reason."},
   claim:{k:"modeled",t:"The decision is checked against the approval group and written to the audit trail; the dollars it moves are modeled."},
   recover:ctx=>{go("bud_req");if(ctx.br)later(()=>BUDREQ.openReq(ctx.br),400)},
   ripple:ctx=>{const t=tkvt();return{cause:"You "+(ctx.cut||"decided")+" "+((ctx.br?ctx.br+" ":"")+(ctx.brT||"a candidate cut")),
    nodes:[{level:"record",id:ctx.br||"",label:ctx.brT||"Candidate cut",before:null,after:null,note:"Request "+(ctx.cut||"decided")},
     ctx.avoid?{level:"line",id:"avoided",label:"New spend avoided",before:0,after:ctx.avoid,unit:"$",fmt:"money",good:"up",note:"The amount the request asked for; modeled"}
      :{level:"line",id:"pipeline",label:"Savings claimed in the takeout pipeline",before:0,after:ctx.claim||0,unit:"$",fmt:"money",good:"up",note:"Claimed by the request; modeled"},
     {level:"metric",id:"m_tkvt",label:"Takeout realized against target (TKVT)",before:t,after:t,unit:"%",good:"up",note:"Unchanged: only a saving its owner confirms counts"}],
    rule:"Modeled: a declined or deferred request avoids the spend it asked for, an approved one adds its claimed savings to the pipeline; takeout against target moves only when an owner records a saving as realized."}}},
  {id:"trail",t:"See the ripple",screen:"strat_exec",
   when:ev=>on(ev,["strat_exec"]),
   hint:{after:20,text:"Open Strategy to execution to follow the cut to the goals its money served."},
   claim:{k:"modeled",t:"The trail from a cut to the objective is computed from the links; dollars are modeled."},
   recover:()=>go("strat_exec")},
  {id:"landed",t:"Prove it landed",screen:"bud_ben",
   when:ev=>isAudit(ev,/^recorded benefit actual$/),
   hint:{after:30,text:"In Benefits realization, press Record actual and record a saving for a cost avoidance benefit."},
   claim:{k:"modeled",t:"Takeout counts only savings an owner records as realized; the register and the target are modeled."},
   recover:()=>go("bud_ben"),
   ripple:(ctx,ev)=>{const t=tkvt();return{cause:"You recorded a realized saving: "+String(ev.d||""),
    nodes:[{level:"record",id:String(ev.d||"").split(" ")[0],label:"Realized saving recorded",before:null,after:null,note:String(ev.d||"")},
     {level:"line",id:"realized",label:"Savings realized to date",before:null,after:realized(),unit:"$",fmt:"money",good:"up",note:"Benefits register"},
     {level:"metric",id:"m_tkvt",label:"Takeout realized against target (TKVT)",before:ctx.tk0,after:t,unit:"%",good:"up",note:"Target "+cash(takeoutTgt())+" a year, modeled"}],
    rule:"Modeled: takeout against target = savings recorded as realized ÷ the takeout target. Thresholds are hypotheses."}}}]),
 success:()=>did("landed"),
 debrief:ctx=>({what:(skipped()?"You joined part way ("+skipped()+" stage"+(skipped()===1?"":"s")+" skipped). ":"")+"You set a takeout target, found and decided a cut, followed it to the strategy and saw a realized saving move takeout against target.",
  mean:"At "+ctx.companyName+", every cut carries its owner, its trail to the strategy and the saving its owner confirms, so the COO and CFO read one number. Modeled."})});

X.register({id:"trk_strat",track:"strat",title:"Strategy Implementation",role:["ceo"],tenants:"any",clock:180,labels:["simulated","modeled","fact"],go:"exe_strat",
 screens:["exe_strat","strat_exec","bst","port","ims","exe_dash","exe_board"],ripples:["metric","objective"],
 brief:"See whether the money follows the strategy, then re-point the dollars that serve no objective.",
 goal:"Orphan work is linked to an objective and you have seen spend traced to strategy rise, then the board view.",
 situation:ctx=>"Seeded: "+cash(orphan()||0)+" of funded work reaches no objective (modeled); "+(stsh()==null?"":stsh()+"% of spend is traced to strategy.")+"",
 setup(ctx){ctx.st0=stsh();ctx.or0=orphan()},
 checkpoints:seq([
  {id:"objectives",t:"Strategy and objectives",screen:"exe_strat",
   when:ev=>on(ev,["exe_strat"]),
   hint:{after:15,text:"Open Strategy alignment: each objective has an owner, a metric and a date."},
   claim:{k:"fact",t:"Objectives carry an owner, a metric and a date, with key results under each."},
   recover:()=>go("exe_strat")},
  {id:"cascade",t:"Cascade to owners",screen:"strat_exec",
   when:ev=>on(ev,["strat_exec"]),
   hint:{after:20,text:"Open Strategy to execution to see goals cascade to capabilities, roadmap items and projects."},
   claim:{k:"fact",t:"Goals cascade to capabilities, roadmap items and projects in one tree."},
   recover:()=>go("strat_exec")},
  {id:"orphan",t:"Funded or orphaned",screen:"strat_exec",
   when:ev=>(ev.kind==="tick"||ev.kind==="render")&&(G(()=>S.screen==="strat_exec"&&+S.v.sx===2,false)||G(()=>S.screen,"")==="bst"),
   hint:{after:20,text:"Open the Gaps view in Strategy to execution, or Budget and spend traceability, to find funded work that serves no goal."},
   claim:{k:"modeled",t:"Funded work with no goal link shows as orphan spend; dollar figures are modeled."},
   recover:()=>{G(()=>{S.v.sx=2});go("strat_exec")}},
  {id:"delivery",t:"Delivery against plan",screen:"exe_dash",
   when:ev=>on(ev,["port","ims","exe_dash"]),
   hint:{after:20,text:"Open the Executive dashboard, the Portfolio or the schedule to see delivery against plan."},
   claim:{k:"fact",t:"Delivery against plan comes from the same project records as the strategy."},
   recover:()=>go("exe_dash")},
  {id:"decide",t:"Decide: re-point the orphan dollars",screen:"strat_exec",
   when:(ev,ctx)=>{if(!isAudit(ev,/^(Linked project to goal|linked funded work|re-linked initiative)$/))return false;ctx.link=ev.d;return true},
   hint:{after:30,text:"In Strategy to execution, use Link a project to a goal on the orphan item, or link it from Coverage gaps in Strategy alignment."},
   claim:{k:"modeled",t:"The orphan dollars and the share of spend traced to strategy recompute from the links; modeled."},
   recover:()=>{G(()=>{S.v.sx=2});go("strat_exec")},
   ripple:ctx=>{const a=stsh(),o=orphan();return{cause:"You re-pointed orphan work: "+(ctx.link||""),
    nodes:[{level:"record",id:"",label:String(ctx.link||"Orphan work").split(/ (→|to) /)[0],before:null,after:null,note:"Now linked to an objective"},
     {level:"line",id:"orphan",label:"Orphan spend",before:ctx.or0,after:o,unit:"$",fmt:"money",good:"down",note:"Funded work that reaches no goal"},
     {level:"metric",id:"m_stsh",label:"Spend traced to strategy (STSH)",before:ctx.st0,after:a,unit:"%",good:"up",note:"Approved dollars linked to an objective"}],
    rule:"Modeled: spend traced to strategy = approved dollars on work linked to an objective ÷ all approved dollars; orphan spend is the rest. Thresholds are hypotheses."}}},
  {id:"board",t:"Board view",screen:"exe_board",
   when:ev=>on(ev,["exe_board"]),
   hint:{after:20,text:"Open the Board pack to see the decision and its effect as the board would."},
   claim:{k:"fact",t:"The board pack is built from the same objectives, decisions and numbers."},
   recover:()=>go("exe_board")}]),
 success:()=>did("board"),
 debrief:ctx=>({what:(skipped()?"You joined part way ("+skipped()+" stage"+(skipped()===1?"":"s")+" skipped). ":"")+"You walked the strategy from objectives to the dollars, re-pointed work that served no objective and saw spend traced to strategy rise.",
  mean:"At "+ctx.companyName+", every funded dollar shows the objective it serves, so orphan work is found at the portfolio board, not at year end. Modeled."})});

/* ---------- the registry ---------- */
const TR=[
 {id:"cost",title:"Cost Takeout",role:"coo",mission:"trk_cost",metric:"m_tkvt"},
 {id:"strat",title:"Strategy Implementation",role:"ceo",mission:"trk_strat",metric:"m_stsh"},
 /* CFO track waits on PR-84, PR-85 and PR-88 (spec section 2); its tile shows a simulated count */
 {id:"mw",title:"Material Weakness",role:"cfo",mission:null,metric:"m_mwls"}];
const get=id=>TR.find(t=>t.id===id)||null;
const ofMission=mid=>TR.find(t=>t.mission===mid)||null;
function current(){const c=G(()=>X.current(),null);if(!c||!c.m)return null;const t=ofMission(c.m.id);return t?{track:t,cur:c}:null}
function stageNow(c){const cps=c.m.checkpoints;const i=cps.findIndex(x=>!c.done[x.id]);return i<0?cps.length:i}
function start(id,o){o=o||{};const t=get(id);if(!t||!t.mission)return false;
 if(!X.start(t.mission,{role:t.role,mode:o.mode||"facilitated",tenant:o.tenant}))return false;
 /* skip to the stage asked for (stages the start itself completed count), then open its screen */
 const n=Math.max(1,Math.min(6,+o.stage||1)),c=X.current();let guard=8;while(c&&stageNow(c)<n-1&&guard--)X.skip();
 if(n>1)X.recover();setUrl();paint();return true}
function open(id){const t=get(id);if(!t)return false;if(t.mission)return start(id,{mode:"facilitated"});
 G(()=>toast("The "+t.title+" track is not built yet. Its number on the home page is simulated.","info"));return false}

/* ---------- the URL while a track runs: ?track=<id>&stage=<n> replaces the engine's ?exp= so a reload resumes the stage ---------- */
function setUrl(){const k=current();G(()=>{const u=new URL(location.href);if(k){["exp","mode","role","tenant"].forEach(x=>u.searchParams.delete(x));u.searchParams.set("track",k.track.id);u.searchParams.set("stage",String(Math.min(6,stageNow(k.cur)+1)))}else{u.searchParams.delete("track");u.searchParams.delete("stage")}history.replaceState(history.state,"",u)})}

/* ---------- the track bar ---------- */
function barHTML(k){const t=k.track,c=k.cur,cps=c.m.checkpoints,now=stageNow(c),def=DEF.find(d=>d.id===t.metric)||{};
 const chips=cps.map((x,i)=>{const d=c.done[x.id];const cls=d?(d.skipped?"skip":"done"):i===now?"now":"todo";
  return `<li><button type="button" class="trk-chip trk-${cls}" data-trk-stage="${i}"${i===now?' aria-current="step"':""} title="${E(x.t)}"><span class="trk-n">${d&&!d.skipped?"&#10003;":i+1}</span><span class="trk-cl">${E(x.t)}</span></button></li>`}).join("");
 const fin=now>=cps.length;
 return `<nav class="trk-bar glass" id="trkBar" aria-label="${E(t.title)} track"><div class="trk-h"><span class="trk-eye">${E(t.title)} track · stage ${Math.min(now+1,cps.length)} of ${cps.length}</span></div>
 <ol class="trk-st">${chips}</ol>
 <div class="trk-tile" role="status"><span class="trk-tl">${E(def.acr||"")} ${E(G(()=>METRICS[t.metric].n,""))}</span><b class="trk-tv">${E(fmtM(t.metric,G(def.val,null)))}</b>${X.chip(def.label||"modeled")}</div>
 <div class="trk-act">${fin?"":`<button type="button" class="btn" data-trk-next>Next stage</button>`}<button type="button" class="btn quiet" data-trk-leave>Leave track</button></div></nav>`}
/* the bar sits just before #view, so a screen render never wipes it and screen code that reads #view never sees it */
function paint(){const v=D.getElementById("view");const old=D.getElementById("trkBar");const k=current();
 if(!k||!v||!v.parentNode){if(old)old.remove();return}
 const h=barHTML(k);if(old&&old.nextElementSibling===v){if(old.outerHTML!==h)old.outerHTML=h;return}if(old)old.remove();v.insertAdjacentHTML("beforebegin",h)}
G(()=>HOOKS.on("afterRender",()=>G(paint),{id:"trk-bar",order:85}));
["start","checkpoint","success","end"].forEach(e=>X.on(e,()=>{G(refresh);G(paint);G(setUrl)}));
X.on("ripple",()=>G(paint));
ROUTER.on("click","[data-trk-stage],[data-trk-next],[data-trk-leave],[data-trk-open]",(e,t)=>{const d=t.dataset;e.preventDefault();
 if(d.trkOpen){open(d.trkOpen);return}
 const k=current();if(!k)return;
 if(d.trkLeave!==undefined){X.stop();return}
 if(d.trkNext!==undefined){X.skip();X.recover();return}
 if(d.trkStage!==undefined){const c=k.cur.m.checkpoints[+d.trkStage];if(!c)return;G(()=>{if(+d.trkStage===stageNow(k.cur)&&c.recover)c.recover(k.cur.ctx);else go(c.screen)})}},{id:"trk-act"});

/* ---------- deep link: ?track=<id>&stage=<n> ---------- */
const q=new URLSearchParams(location.search);const qt=q.get("track");
if(qt&&get(qt)&&!q.get("showroom"))setTimeout(()=>G(()=>start(qt,{stage:+q.get("stage")||1,mode:q.get("mode")==="self"?"self":"facilitated"})),1400);

W.TRACKS={list:()=>TR.map(t=>Object.assign({},t)),get,start,open,current:()=>{const k=current();return k?{id:k.track.id,stage:stageNow(k.cur)+1,stages:k.cur.m.checkpoints.length}:null},
 value:id=>{const d=DEF.find(x=>x.id===id);return d?G(d.val,null):null},metrics:()=>DEF.map(d=>({id:d.id,acr:d.acr,n:d.n,label:d.label,track:d.track,gaps:d.gaps.slice()})),refresh,MW_SIM};
})();
