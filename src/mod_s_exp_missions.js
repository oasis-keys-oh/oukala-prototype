/* ===== mod_s_exp_missions: the five starter missions (backlog DC-40, DC-42 Your Monday). Each plays on screens that already
   exist (DC-34), takes 3 minutes or less, asks for one decision, shows one ripple and earns one success. Situations are seeded
   through the screens' own state and APIs and labeled simulated; every ripple is modeled. Names and figures are read from the
   data at run time (fictional sample data), never typed here. Missions whose screens are not tenant-aware run on the core sample
   and the mission card says so. Prefix: exp- (shared with mod_s_exp). ===== */
(function(){
const W=window,D=document;const X=W.EXP;if(!X)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const arr=x=>Array.isArray(x)?x:[];
const rows=e=>arr(G(()=>DATA.get(e),[]));
const cash=v=>G(()=>U.moneyShort(v),null)||("$"+Math.round(v));
const done=id=>G(()=>!!X.current().done[id],false);
/* press a tab or button on the current screen by its label (the same way the tours do) */
function press(txt){const want=String(txt).toLowerCase();const bs=[...D.querySelectorAll("#view .views button,#view [role=tab],#view button")];
 const b=bs.find(x=>x.textContent.trim().toLowerCase().replace(/^\d+\s*/,"")===want)||bs.find(x=>x.textContent.trim().toLowerCase().startsWith(want));if(b){b.click();return true}return false}
const later=(f,ms)=>setTimeout(()=>G(f),ms||350);
const isAudit=(ev,re)=>ev.kind==="audit"&&re.test(ev.a);
const kr=(o,k)=>({k,o});

/* ---------- 1. CFO: an invoice is over budget before the steering meeting ---------- */
X.register({id:"cfo_invoice",title:"The invoice that breaks the budget",role:["cfo"],tenants:"any",clock:180,labels:["simulated","modeled","fact"],
 screens:["inv","bst"],ripples:["budget","objective"],
 brief:"An invoice lands before the steering meeting and would push its budget line over plan, so find why and decide what to do.",
 goal:"The invoice is decided and you have seen what the decision does to the line, the project and the objective score.",
 situation:ctx=>{const i=ctx.inv&&G(()=>INVOICES.find(x=>x.id===ctx.inv),null);return i?"Seeded: "+i.vendor+" billed "+cash(i.amt)+" on "+i.id+", due "+i.due+"; the steering meeting is this week.":"Seeded: an invoice is waiting before the steering meeting."},
 setup(ctx){const L=arr(G(()=>INVOICES,[]));const i=L.find(x=>x.rec==="hold")||L[0];if(!i)return;ctx.inv=i.id;G(()=>{delete S.dec[i.id]});ctx.chain=G(()=>ZLINK.chains.invoiceToProject(i.id),null)},
 checkpoints:[
  {id:"find",t:"Open the invoice the advisor flagged",screen:"inv",
   when:(ev,ctx)=>(ev.kind==="click"&&ev.data.invpick===ctx.inv)||((ev.kind==="render"||ev.kind==="tick")&&G(()=>S.screen==="inv"&&S.inv===ctx.inv,false)),
   hint:{after:20,text:"Open Approve invoices from the menu or search, then pick the invoice marked Recommend Hold."},
   claim:{k:"fact",t:"The invoice, its contract ledger and the advisor's recommendation sit on one screen."},
   recover:ctx=>{G(()=>{S.inv=ctx.inv});go("inv")}},
  {id:"why",t:"See why: follow it to the goal it serves",screen:"inv",
   when:(ev)=>isAudit(ev,/^traced golden thread$/)||(ev.kind==="go"&&(ev.screen==="trace"||ev.screen==="strat_exec"))||(ev.kind==="click"&&/^(Where it connects|Open in Executive trace|Trace)$/.test(ev.text)),
   hint:{after:25,text:"Open the Where it connects tab on the invoice, or press Trace on its row in Budget and spend traceability."},
   claim:{k:"modeled",t:"Invoice to contract, budget line, project and objective is computed from the records; dollar figures are modeled."},
   recover:ctx=>{G(()=>{S.inv=ctx.inv});go("inv");later(()=>press("Where it connects"))}},
  {id:"decide",t:"Decide: hold, reject or approve",screen:"inv",
   when:(ev,ctx)=>isAudit(ev,/^(on hold|rejected|approved) invoice$/)&&ev.d.indexOf(ctx.inv)===0,
   hint:{after:30,text:"Use Hold, Reject or Approve on the invoice, and add a reason for the audit trail."},
   claim:{k:"modeled",t:"The ripple shows the forecast, the line variance and the objective score before and after the decision."},
   ripple:(ctx,ev)=>{const dec=/^on hold/.test(ev.a)?"On hold":/^rejected/.test(ev.a)?"Rejected":"Approved";ctx.decision=dec;
    return{kind:"invoice",id:ctx.inv,decision:dec,cause:"You set "+ctx.inv+" to "+dec.toLowerCase()}}}],
 success:ctx=>done("decide"),
 debrief:ctx=>({what:ctx.decision&&ctx.decision!=="Approved"?"You stopped "+cash(G(()=>INVOICES.find(x=>x.id===ctx.inv).amt,0))+" leaving this period and brought the line back toward plan before anyone had to explain it.":"You paid it knowingly: the line stays over plan and the trail shows exactly which objective carries the overrun.",
  mean:"At "+ctx.companyName+", the same chain runs from every supplier invoice to the objective it serves, so the overrun shows before the steering meeting, not after it. Modeled."})});

/* ---------- 2. COO: a journey step is failing customers ---------- */
function coachKr(ctx){const krs=rows("key_results");if(!krs.length)return null;
 let k=ctx.tenant==="core"?krs.find(x=>/reviewer/i.test(x.n)):null;
 if(!k){const objs=[...new Set(krs.map(x=>x.o))].map(o=>({o,s:X.objScore(o)})).filter(x=>x.s!=null).sort((a,b)=>a.s-b.s);const o=objs[0]&&objs[0].o;
  const att=x=>G(()=>ROLLUP.att(+x.cur,+x.tgt,+x.start),0);k=krs.filter(x=>x.o===o).sort((a,b)=>att(a)-att(b))[0]||krs[0]}
 return k}
const studioSteps=()=>G(()=>{const B=STUDIO.B;return (B.phases?B.phases.reduce((a,p)=>a.concat(p.steps),[]):B.steps)||[]},[]);
X.register({id:"coo_journey",title:"The step nobody runs",role:["coo"],tenants:"any",clock:180,labels:["simulated","modeled","fact"],
 screens:["ppl_jrny","studio"],neutral:["studio"],ripples:["metric","objective"],
 brief:"A step in your customer journey has no process behind it and customers wait there, so find it and fix it with a robot or an agent.",
 goal:"The step has a process with a robot or agent on it, and you have seen the objective it serves move.",
 situation:ctx=>"Seeded: complaints point at a journey step that nothing runs today ("+ctx.tenantName+" journeys).",
 setup(ctx){G(()=>{if(W.STUDIO){STUDIO.sc=null;STUDIO.view="home";STUDIO.lastScen=null;STUDIO.built=false}})},
 checkpoints:[
  {id:"find",t:"Find a journey step nothing runs (a red box)",screen:"ppl_jrny",
   when:(ev)=>(ev.kind==="tick"||ev.kind==="render")&&G(()=>S.screen==="ppl_jrny"&&!!D.querySelector('#view [data-sr-fix^="journey|"]'),false),
   hint:{after:20,text:"Open Journey maps and pick a journey; red boxes are steps with no process behind them."},
   claim:{k:"fact",t:"Red boxes are journey steps with no process behind them, found from the journey's own records."},
   recover:()=>{go("ppl_jrny");later(()=>{const j=D.querySelector('#view [data-pp2-act="jopen"]');if(j)j.click()})}},
  {id:"fix",t:"Fix it with a robot or an agent",screen:"ppl_jrny",
   when:(ev,ctx)=>{if(!isAudit(ev,/^Build the fix in VibeCheck$/))return false;ctx.fix=String(ev.d).replace(/^Build the process for the step "?/,"").replace(/".*$/,"").slice(0,90);return true},
   hint:{after:25,text:"Press Build the fix in VibeCheck on a red step, or on a robot or agent card in the Build list."},
   claim:{k:"simulated",t:"The gap becomes a plain request in the studio; the interview is scripted in the prototype."},
   recover:()=>{const b=D.querySelector('#view [data-sr-fix^="journey|"]');if(b)b.click();else{go("ppl_jrny");later(()=>press("Build list"))}}},
  {id:"built",t:"See it built, with a robot or agent on a step",screen:"studio",
   when:(ev)=>ev.kind==="tick"&&G(()=>!!STUDIO.built&&studioSteps().some(s=>s.who==="robot"||s.who==="agent"),false),
   hint:{after:30,text:"In the studio press Auto and let the interview run; the steps fill in with who does each one."},
   claim:{k:"modeled",t:"The objective moves through its key result by a modeled amount; nothing is running."},
   recover:()=>{if(G(()=>S.screen,"")!=="studio")go("studio");later(()=>{const b=[...D.querySelectorAll("button")].find(x=>x.textContent.trim()==="Auto");if(b)b.click()})},
   ripple:(ctx)=>{const k=coachKr(ctx);if(!k)return null;const st=studioSteps(),n=st.filter(s=>s.who==="robot"||s.who==="agent").length;
    const curv=ctx.tenant==="core"?+G(()=>EXE.krCur(EXE.E.krs.find(x=>x.id===k.id)),k.cur):+k.cur;const from=isFinite(curv)?curv:+k.start;const to=Math.round((from+(k.tgt-from)*.25)*10)/10;
    return{kind:"kr",kr:k.id,to,cause:"A process now runs "+(ctx.fix||"the step"),
     via:[{level:"record",id:"",label:ctx.fix||"Journey step",before:null,after:null,note:"Before: nothing ran it. After: "+st.length+" steps, "+n+" by a robot or agent (simulated)."}],
     rule:"Modeled: the new process takes a quarter of the remaining gap off one key result (the reviewer turnaround on the core sample, otherwise the furthest-behind key result of the weakest objective); the objective score is recomputed with the roll-up rule."}}}],
 success:()=>done("built"),
 debrief:ctx=>({what:"You turned a step nobody ran into a process with an owner and a robot or agent on the routine part, in one conversation.",
  mean:"At "+ctx.companyName+", every journey step that has no process shows red the same way, and each one becomes a build in the studio with its owner and measures. Modeled."})});

/* ---------- 3. CISO: an agent asks for access to restricted records ---------- */
const REQ="AR-0031";
const trustObj=()=>G(()=>(S.exe.objs.find(o=>/\bAI\b|trust/i.test(o.n))||S.exe.objs[0]).id,null);
X.register({id:"ciso_agent",title:"The agent that wants more",role:["ciso"],tenants:"any",clock:180,labels:["simulated","modeled","fact"],
 screens:["r15_iam","guard"],ripples:["risk","objective"],
 brief:"An AI agent asks for standing access to restricted HR records, so decide and then see what the guardrails do on their own.",
 goal:"The request is decided and you have watched a guardrail refuse an attempt to get around it.",
 situation:ctx=>"Seeded: "+(ctx.agent||"an agent")+" requests the HR data reader set ("+REQ+"). You decide as the security administrator on duty, "+(ctx.actAs||"named on the card")+"; acting as is audited.",
 setup(ctx){const ag=G(()=>{const L=AGENTRT.registry();return (L.find(r=>r.lifecycle==="active")||L[0]||{}).name},null)||"An agent";ctx.agent=ag;
  const I=G(()=>GUARD.state,null);if(!I)return;
  const prev=S.persona;let who=null;try{S.persona="admin";who=G(()=>GUARD.can(null,"role.assign",{}).who,null)}finally{S.persona=prev}
  ctx.prevAs=I.actAs||"";if(who){I.actAs=who;ctx.actAs=who;G(()=>audit("Acting as",who+" (experience: the security administrator decides access requests)"))}
  I.reqs=arr(I.reqs).filter(r=>r.id!==REQ);I.reqs.unshift({id:REQ,who:ag,item:"PS-HR",days:0,why:"Read compensation records to price a contractor renewal (simulated request)",st:"submitted",at:U.TODAY_ISO,by:ag})},
 teardown(ctx){const I=G(()=>GUARD.state,null);if(!I)return;I.actAs=ctx.prevAs||"";I.reqs=arr(I.reqs).filter(r=>r.id!==REQ)},
 checkpoints:[
  {id:"find",t:"Find the agent's request",screen:"r15_iam",
   when:(ev)=>(ev.kind==="click"&&/^Access requests/.test(ev.text))||(ev.kind==="tick"&&G(()=>S.screen==="r15_iam"&&!!D.querySelector('#view [data-r3i-no="'+REQ+'"]')&&D.querySelector('#view [data-r3i-no="'+REQ+'"]').offsetParent!==null,false)),
   hint:{after:20,text:"Open Identity and access, then the Access requests tab."},
   claim:{k:"fact",t:"Each request shows its segregation-of-duties check before anyone decides."},
   recover:()=>{go("r15_iam");later(()=>press("Access requests"))}},
  {id:"decide",t:"Decide the request",screen:"r15_iam",
   when:(ev,ctx)=>{if(ev.kind!=="audit"||ev.d.indexOf(REQ)<0)return false;if(/^Approved access request$/.test(ev.a))ctx.decision="granted";else if(/^Denied access request$/.test(ev.a))ctx.decision="denied";else if(/^Denied: /.test(ev.a))ctx.decision="refused";else return false;return true},
   hint:{after:25,text:"Approve or Deny on the request row; read the SoD check and the duration first."},
   claim:{k:"simulated",t:"Roles and grants are enforced inside the prototype; nothing reaches a real directory."},
   ripple:(ctx)=>{const ppl=rows("people").length||0,o=trustObj(),b=o?X.objScore(o):null,g=ctx.decision==="granted";
    const nodes=[{level:"record",id:REQ,label:ctx.agent+" asks for HR data reader",before:null,after:null,note:g?"Granted, standing":"Not granted"},
     {level:"risk",id:"PS-HR",label:"Restricted records the agent can read",before:0,after:g?ppl:0,unit:"",good:"down",note:g?"Every person's pay and reviews":"Exposure stays at zero"}];
    if(o&&b!=null)nodes.push({level:"objective",id:o,label:G(()=>S.exe.objs.find(x=>x.id===o).n,o),before:b,after:g?Math.round((b-3)*10)/10:b,unit:"pts",good:"up",note:g?"Until the grant is recertified":"Nothing moved, which is the point"});
    return{nodes,cause:"You "+(ctx.decision==="granted"?"granted":ctx.decision==="denied"?"denied":"tried to decide")+" "+REQ,rule:"Modeled: a standing grant of restricted data to an agent takes 3 points off the trust objective until it is recertified; a denial keeps exposure at zero. Record counts are prototype facts."}}},
  {id:"guard",t:"Try to break it: watch a guardrail hold",screen:"guard",
   when:(ev)=>isAudit(ev,/^Guardrail test \(simulated\)/),
   hint:{after:25,text:"Open Guardrails, then Try to break it, and try to open a pay record as the service desk."},
   claim:{k:"simulated",t:"Each attempt calls the real check in the prototype and writes an audit entry; it is not a security test."},
   recover:()=>{go("guard");later(()=>press("Try to break it"))}}],
 success:()=>done("decide")&&done("guard"),
 debrief:ctx=>({what:"You decided an agent's access the way you decide a person's, and saw the platform refuse a way around it without anyone watching.",
  mean:"At "+ctx.companyName+", agents ask through the same request, review and audit path as people, and every refusal is on the record. Simulated."})});

/* ---------- 4. CIO: a change collides with a release the week of a board meeting ---------- */
function clashOf(){const R=arr(G(()=>RELX.releases,[]));for(const r of R){const c=arr(G(()=>RELX.clashes(r.id),[])).find(x=>x.k==="hard"&&/^CHG/.test(x.w||""));if(c)return{rel:r,chg:c.w}}return null}
const hardLeft=id=>arr(G(()=>RELX.clashes(id),[])).filter(x=>x.k==="hard").length;
X.register({id:"cio_clash",title:"The clash in board week",role:["cio"],tenants:"any",clock:180,needs:t=>t==="core", /* release records exist only in the Atlantic Systems sample until PR-36 */labels:["simulated","modeled","fact"],
 screens:["itsm_rel","itsm_chg"],ripples:["risk","objective"],
 brief:"A change and a release hit the same service on the same day in the week of a board meeting, so find the clash and resolve it.",
 goal:"No hard clash is left on the release and you have seen what the move does to the objective it serves.",
 situation:ctx=>"Seeded: the board meets the week of "+(ctx.date||"the release")+"; "+(ctx.rel||"a release")+" and change "+(ctx.chg||"")+" touch the same service that day.",
 setup(ctx){const c=clashOf();if(!c)return;ctx.rel=c.rel.id;ctx.chg=c.chg;ctx.proj=c.rel.proj||"";ctx.date=G(()=>U.fmtDate(c.rel.date),c.rel.date);ctx.hard0=hardLeft(c.rel.id)},
 checkpoints:[
  {id:"find",t:"Find the release with a hard clash",screen:"itsm_rel",
   when:(ev,ctx)=>(isAudit(ev,/^opened release$/)&&ev.d===ctx.rel)||(ev.kind==="click"&&ev.data.relOpen===ctx.rel),
   hint:{after:20,text:"Open Releases; the dashboard names the releases with a hard clash. Open the first one."},
   claim:{k:"fact",t:"Clash detection checks releases, changes and freezes together, live in the prototype."},
   recover:ctx=>{go("itsm_rel");later(()=>G(()=>RELX.open(ctx.rel)))}},
  {id:"resolve",t:"Resolve it: move the release or the change",screen:"itsm_rel",
   when:(ev,ctx)=>{if(ev.kind!=="audit")return false;if(ev.a==="moved release date"&&ev.d.indexOf(ctx.rel)===0){ctx.moved="release";return true}
    if(/^(rescheduled change|Change rescheduled|Change withdrawn)$/.test(ev.a)&&ev.d.indexOf(ctx.chg)===0){ctx.moved="change";return true}return false},
   hint:{after:30,text:"In the release, use Move to first clear day, or open the clashing change and move it to another day."},
   claim:{k:"modeled",t:"Which date moves decides which key result carries the cost; the ripple shows it, modeled."},
   ripple:(ctx)=>{const ob=G(()=>{const w=S.exe.links[ctx.proj]||{};return Object.keys(w).sort((a,b)=>w[b]-w[a])[0]},null);
    const ks=arr(G(()=>EXE.E.krs,[])).filter(k=>k.o===ob);const k=ks.find(x=>/failover|availab/i.test(x.n))||ks[0];if(!k)return null;
    const c=+G(()=>EXE.krCur(k),k.cur),from=isFinite(c)?c:+k.start,span=(+k.tgt)-(+k.start);
    const to=Math.round((ctx.moved==="release"?from-span*.05:from+((+k.tgt)-from)*.1)*10)/10;
    const pj=G(()=>PROJ.find(p=>p.id===ctx.proj),null);
    return{kind:"kr",kr:k.id,to,cause:ctx.moved==="release"?"You moved "+ctx.rel+" past the clash":"You moved change "+ctx.chg+" off the release day",
     via:[{level:"release",id:ctx.rel,label:ctx.rel+" hard clashes",before:ctx.hard0||1,after:hardLeft(ctx.rel),unit:"",good:"down",note:"Checked live"}].concat(pj?[{level:"project",id:pj.id,label:pj.n,before:null,after:null,note:ctx.moved==="release"?"Lands later than planned":"Keeps its date"}]:[]),
     rule:"Modeled: a release that keeps its date adds a tenth of the remaining gap to its key result; one that slips takes off a twentieth of the span. Clash counts are prototype facts."}}},
  {id:"clear",t:"See the calendar clear",screen:"itsm_rel",
   when:(ev,ctx)=>ev.kind==="tick"&&done("resolve")&&ctx.rel&&hardLeft(ctx.rel)===0,
   hint:{after:25,text:"Open the release again: its clash detection should show no hard clash."},
   claim:{k:"fact",t:"The release calendar re-checks itself after the move."},
   recover:ctx=>{go("itsm_rel");later(()=>G(()=>RELX.open(ctx.rel)))}}],
 success:()=>done("clear"),
 debrief:ctx=>({what:ctx.moved==="change"?"You kept the release on its date and moved the smaller change, so board week carries one less risk.":"You moved the release past the clash; the trail shows the key result that pays for it.",
  mean:"At "+ctx.companyName+", every release and change is checked against the others and the freezes, so a clash shows before the change advisory board, not during board week. Modeled."})});

/* ---------- 5. Any role: Your Monday (DC-42), a 3-minute slice ---------- */
const ownObj=role=>G(()=>{const n=String((PERSONAS[X.personaOf(role)]||{}).n||"");return (S.exe.objs.find(o=>o.owner===n)||S.exe.objs[0]).id},null);
X.register({id:"monday",title:"Your Monday",role:"any",tenants:"any",clock:180,labels:["simulated","modeled","fact"],
 screens:["inbox","flw_appr"],ripples:["metric","objective"],
 brief:"Three things are waiting on you this Monday morning, so open them and make one decision that matters.",
 goal:"One decision is made from the inbox and you have seen what it moved.",
 situation:ctx=>"Seeded: a new request arrived just now (simulated). Waiting at the top: "+arr(ctx.top).join("; ")+".",
 setup(ctx){G(()=>{ctx.sim=INBOX.simNow()});const it=arr(G(()=>INBOX.items(),[]));ctx.n0=it.length;ctx.top=it.slice(0,3).map(x=>String(x.title||"").slice(0,70))},
 checkpoints:[
  {id:"open",t:"Open what is waiting on you",screen:"inbox",
   when:(ev)=>(ev.kind==="go"&&(ev.screen==="inbox"||ev.screen==="flw_appr"))||isAudit(ev,/^Inbox: opened/)||(ev.kind==="click"&&(ev.data.inbxOpen!==undefined||ev.data.inbxFocus!==undefined)),
   hint:{after:15,text:"Open My inbox from the menu or the bell; the items at the top are waiting on you."},
   claim:{k:"fact",t:"Approvals, alerts and requests from every module wait in one inbox."},
   recover:()=>go("inbox")},
  {id:"decide",t:"Make one decision",screen:"inbox",
   when:(ev,ctx)=>{if(!isAudit(ev,/^Inbox: /)||/^Inbox: (opened|undid|delegation|demo|policy)/.test(ev.a))return false;ctx.item=String(ev.d).split(" · ")[0].slice(0,80);ctx.verb=ev.a.replace(/^Inbox: /,"");return true},
   hint:{after:25,text:"Approve, reject or snooze one item from the inbox; the decision commits after the undo window."},
   claim:{k:"modeled",t:"The queue count is a prototype fact; the wait and the objective score after it are modeled."},
   ripple:(ctx)=>{const n1=arr(G(()=>INBOX.items(),[])).length,m=G(()=>METRICS.m_inbox_wait,null),o=ownObj(ctx.role),b=o?X.objScore(o):null;
    const nodes=[{level:"record",id:"",label:ctx.item||"The item",before:null,after:null,note:"You "+(ctx.verb||"decided")+" it"},
     {level:"queue",id:"inbox",label:"Waiting on you",before:ctx.n0,after:Math.min(ctx.n0,n1),unit:"",good:"down",note:"Prototype fact"}];
    if(m)nodes.push({level:"metric",id:"m_inbox_wait",label:m.n,before:+m.cur,after:Math.round(+m.cur*Math.max(0,ctx.n0-1)/Math.max(1,ctx.n0)*10)/10,unit:"h",good:"down",note:"Modeled: one fewer item in the queue"});
    if(o&&b!=null)nodes.push({level:"objective",id:o,label:G(()=>S.exe.objs.find(x=>x.id===o).n,o),before:b,after:Math.round((b+.5)*10)/10,unit:"pts",good:"up",note:"Your objective"});
    return{nodes,cause:"You "+(ctx.verb||"decided")+": "+(ctx.item||"an item"),rule:"Modeled: a decision made on Monday instead of later in the week takes its share off the median wait and adds half a point to the objective you own."}}}],
 success:()=>done("decide"),
 debrief:ctx=>({what:"You cleared a decision that was waiting on you, from one inbox, and saw what it moved.",
  mean:"At "+ctx.companyName+", every module's approvals arrive in the same inbox with the context to decide, so Monday starts with decisions, not searching. Modeled."})});
})();
