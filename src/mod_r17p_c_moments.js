/* ===== Round 17, Agent P (part 3 of 4): live moments, demo data reset, and the rehearsal check.
   Moments call the real runtimes through their window APIs (INBOX, STATUS and APG, AGENTRT, BCX, OGX, ask, the Why panel, PERM). Nothing is faked: a
   moment whose API is missing is left out of the list and says why in R17P.missing(). ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined||v===null?d:v}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>Array.prototype.slice.call((r||D).querySelectorAll(s));
const R=W.R17P=W.R17P||{};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const screenName=id=>G(()=>SCREENS.find(s=>s[0]===id)[1],id);
const known=id=>G(()=>SCREENS.some(s=>s[0]===id),false);
const fn=(o,k)=>G(()=>typeof o[k]==="function",false);
const todayIso=()=>G(()=>BCX.TODAY,new Date().toISOString().slice(0,10));
const addDays=(iso,n)=>{const d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};

/* ---------------------------------------------------------------- moments ---------------------------------------------------------------- */
const MOMENTS=[
 {id:"approval",label:"Raise an approval request",sub:"A new approval reaches the inbox and shows as a notification.",api:"INBOX.simNow()",
  need:()=>fn(INBOX,"simNow"),
  run:async()=>{const it=INBOX.simNow();return{ok:true,summary:"Raised in the inbox: "+it.title+". It waits for the approver group and shows in the notification area."}}},
 {id:"status",label:"Change a person's status",sub:"A leave request routes through approver groups, then launches the standard process.",api:"STATUS.request(), STATUS.decide(), APG.members()",
  need:()=>fn(STATUS,"request")&&fn(STATUS,"decide")&&fn(APG,"members"),
  run:async()=>{
   const person=G(()=>DIR.filter(d=>d.kind==="human"&&d.mgr&&d.name!==R.viewerName()).map(d=>d.name).find(n=>n==="Dev Rao")||DIR.find(d=>d.kind==="human"&&d.mgr).name,"");
   if(!person)return{ok:false,summary:"No person is available to change"};
   const iso=todayIso();const v={person,status:"pto",eff:addDays(iso,7),ret:addDays(iso,12),reason:"Vacation"};
   const r=STATUS.request(v);let rec=null,steps=0;
   if(!r.needs){const a=STATUS.apply(v);rec=a.ok?a.rec:null}
   else{let guard=0,res=null;while(r.pend&&r.pend.state==="waiting"&&guard++<5){const w=STATUS.waiting(r.pend);if(!w.length)break;const lv=w[0].lv;
     const m=APG.members(lv.group,{requester:person}).filter(x=>x!==person);if(!m.length)break;res=STATUS.decide(r.pend.id,lv.id,m[0],"approve");steps++;if(!res.ok||res.done)break}
    rec=res&&res.applied&&res.applied.ok?res.applied.rec:null}
   G(()=>go("r16h_status"));setTimeout(()=>G(()=>R.applyTab("Approvals")),80);
   if(!rec)return{ok:true,summary:"Request for "+person+" is waiting on an approver group on the Status catalog screen."};
   const ln=(rec.launches||[]).map(l=>l.label+" ("+l.state+")").join(", ");
   return{ok:true,summary:person+" is now "+rec.label+" after "+steps+" group decision"+(steps===1?"":"s")+". Launched: "+(ln||"nothing")+"."}}},
 {id:"kill",label:"Trip an agent kill switch",sub:"A control stops a live agent, and the next run is blocked and recorded.",api:"AGENTRT.setControl(), AGENTRT.execute()",
  need:()=>fn(AGENTRT,"setControl")&&fn(AGENTRT,"execute")&&fn(AGENTRT,"registry"),
  run:async()=>{
   const reg=AGENTRT.registry();const a=reg.find(r=>r.lifecycle==="active"&&(r.tier>=2))||reg.find(r=>r.lifecycle==="active");
   if(!a)return{ok:false,summary:"No active agent is registered"};
   AGENTRT.setControl("agent",a.name,true,"kill","Tripped from the Tour moments panel");
   const run=AGENTRT.execute({agent:a.name,goal:"Draft the weekly vendor status summary"});
   G(()=>go("ai_runtime"));setTimeout(()=>G(()=>R.applyTab("Runs")),80);
   return{ok:true,summary:a.name+" halted. The next run was "+(run.blocked?"blocked: "+run.why:"not blocked ("+(run.why||"unexpected")+")")+".",undo:{label:"Resume "+a.name,fn:()=>{AGENTRT.setControl("agent",a.name,false);return"Resumed "+a.name+"."}}}}},
 {id:"disaster",label:"Declare a disaster (simulation)",sub:"The plan's recovery workflow starts and the call tree is notified. Simulated and labeled.",api:"BCX.declareForm() on the form runtime",
  need:()=>fn(BCX,"declareForm")&&known("bc_decl"),
  run:async()=>{const before=G(()=>BCX.D().decl.length,0);
   BCX.declareForm({title:"Standards Portal outage (simulation)"});await sleep(250);
   const btn=qa("#drawer button").find(b=>/^declare disaster/i.test(b.textContent.trim()));
   if(!btn){return{ok:false,summary:"The declaration form did not open"}}
   btn.click();await sleep(300);const d=G(()=>BCX.D().decl[0],null);
   if(G(()=>BCX.D().decl.length,0)<=before||!d)return{ok:false,summary:"The form needs another answer; it is open on screen"};
   return{ok:true,summary:d.id+" declared under plan "+d.planId+": recovery workflow "+(d.inst||"not started")+", "+d.notified.length+" people on the call tree (simulated, nothing sent)."}}},
 {id:"orderguide",label:"Open the order guide",sub:"A multi-part order starts from one guide, with one status.",api:"OGX.guides, the Order guides screen",
  need:()=>G(()=>OGX.guides.length>0,false)&&known("svc_guides"),
  run:async()=>{go("svc_guides");await sleep(120);R.applyTab("Start an order");await sleep(200);
   const b=qa("#view button").find(x=>/start|begin|use this guide|order this/i.test(x.textContent)&&x.closest(".card,.tile,.mini"));
   return{ok:true,summary:"Order guides open on the Start an order tab: "+OGX.guides.length+" guides bundle several catalog items into one request."}}},
 {id:"ask",label:"Ask a plain question",sub:"A plain-language question is answered in Ask with its sources.",api:"ask() and the chat dock",
  need:()=>typeof W.ask==="function",
  run:async()=>{const q="Which approvals are waiting on me?";W.ask(q);G(()=>{q1("#chatOpen").checked=true});return{ok:true,summary:"Asked: “"+q+"” The answer is in the Ask panel with its steps."}}},
 {id:"why",label:"Show Why am I seeing this",sub:"The source rule, data, audience and owner behind the screen.",api:"The Why panel in the page header",
  need:()=>true,
  run:async()=>{if(!q1("#r16Why")){go("home");await sleep(150)}const b=q1("#r16Why");
   if(!b)return{ok:false,summary:"This screen has no Why panel"};b.click();await sleep(120);
   return{ok:true,summary:"Opened Why am I seeing this on "+screenName(G(()=>S.screen,""))+": the rule, the data, the audience and the owner."}}},
 {id:"perm",label:"Show a permission denial",sub:"A service desk lead opens performance data and is denied, with the rule named.",api:"NAVX.persona.set(), PERM",
  need:()=>fn(PERM,"can")&&known("ppl_perf"),
  run:async()=>{const R_=R.st;if(R_.prevPersona==null)R_.prevPersona=G(()=>S.persona,"exec");const was=G(()=>S.persona,"exec");
   if(!R.setPersona("ops"))return{ok:false,summary:"The service desk role could not be selected"};
   go("ppl_perf");await sleep(180);const den=!!q1("#view [data-perm-denied]");
   return{ok:den,summary:den?"Viewing as the service desk lead: Performance management is denied, with the rule and the group to ask on screen.":"The screen opened for the service desk lead; no denial was shown",
    undo:{label:"Return to "+(R.PERSONA_NOTE[was]||was),fn:()=>{R.setPersona(was);R.st.prevPersona=null;go("r17p_tour");return"Role restored."}}}}}
];
const ACTIONS=MOMENTS.concat([
 {id:"contract",label:"Score the Tour screen",sub:"The four-rule contract evaluated on this screen.",api:"CONTRACT.evaluate()",hidden:true,
  need:()=>fn(CONTRACT,"evaluate"),
  run:async()=>{const ev=CONTRACT.evaluate("r17p_tour");const sc=G(()=>ev.score,G(()=>ev.rules&&Object.keys(ev.rules).filter(k=>ev.rules[k]&&(ev.rules[k].r==="pass"||ev.rules[k].pass)).length,null));
   const ok=G(()=>CONTRACT.matrix().find(x=>x.id==="r17p_tour"),null);
   return{ok:true,summary:"Tour screen contract score: "+(sc===null?"see the Feature contract screen":sc+" of 4")+".",undo:null}}}
]);
R.viewerName=()=>G(()=>R15D.me().name,"Casey Rowan");
R.moments=()=>MOMENTS.filter(m=>G(m.need,false));
R.missing=()=>MOMENTS.filter(m=>!G(m.need,false)).map(m=>({id:m.id,label:m.label,api:m.api}));
R.allMoments=()=>MOMENTS;
const UNDO={};
R.runAct=async function(id){const m=ACTIONS.find(x=>x.id===id);if(!m)return{ok:false,summary:"Unknown action"};
 if(!G(m.need,false))return{ok:false,summary:"Not available in this build: "+m.api+" is missing."};
 let r;try{r=await m.run()}catch(e){r={ok:false,summary:"Failed: "+(e&&e.message||e)}}
 G(()=>audit("ran tour moment",m.label));
 R.lastMoment={id,at:Date.now(),ok:r.ok,summary:r.summary};(R.momentLog=R.momentLog||[]).unshift({id,label:m.label,ok:r.ok,summary:r.summary,at:new Date()});R.momentLog.length=Math.min(R.momentLog.length,12);
 if(r.undo){UNDO[id]=r.undo.fn;r.summary=r.summary+" ";}
 G(()=>toast(r.ok?"Moment run: "+m.label:"Moment not completed: "+m.label,r.ok?"good":"warn"));
 /* undo button next to the result text */
 setTimeout(()=>{["r17pMres","r17pTryMsg","r17pHubRes"].forEach(i=>{const o=q1("#"+i);if(o&&o.textContent.replace(/\s/g,"").indexOf(r.summary.replace(/\s/g,""))===0&&r.undo&&!q1("[data-r17p-undo]",o)){const b=D.createElement("button");b.type="button";b.className="btn quiet r17p-undo";b.dataset.r17pUndo=id;b.textContent=r.undo.label;o.appendChild(b)}})},30);
 G(()=>R.hubRefresh&&R.hubRefresh());
 return r};
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r17p-undo]");if(!b)return;const f=UNDO[b.dataset.r17pUndo];if(!f)return;let msg="";try{msg=f()}catch(x){msg="Could not undo"}const p=b.parentElement;b.remove();if(p)p.append(" "+msg)});

/* ---------------------------------------------------------------- reset demo data ---------------------------------------------------------------- */
R.reset=function(){
 try{R.st&&R.st.active&&sessionStorage.setItem("oukala-r17p-state",JSON.stringify({story:R.st.story,i:R.st.i,present:R.st.present,spot:R.st.spot,hideBadges:R.st.hideBadges,prev:R.st.prevPersona}))}catch(e){}
 try{Object.keys(localStorage).filter(k=>/^oukala/i.test(k)&&!/pref|theme/i.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}
 G(()=>audit("reset demo data","Cleared persisted edits and re-seeded"));
 if(G(()=>typeof STORE.reset==="function",false)){STORE.reset()}else{try{location.reload()}catch(e){}}};

/* ---------------------------------------------------------------- rehearsal check ---------------------------------------------------------------- */
const LASTKEY="oukala-r17p-rehearsal";
R.lastRehearsal=(()=>{try{return JSON.parse(sessionStorage.getItem(LASTKEY)||"null")}catch(e){return null}})();
function captureErrors(){const errs=[];const oe=console.error;const onerr=ev=>errs.push(String(ev.message||ev.reason||ev));const onrej=ev=>errs.push(String(ev.reason&&ev.reason.message||ev.reason||"unhandled rejection"));
 console.error=function(){errs.push(Array.prototype.map.call(arguments,x=>String(x&&x.message||x)).join(" "));return oe.apply(console,arguments)};
 W.addEventListener("error",onerr);W.addEventListener("unhandledrejection",onrej);
 return{errs,stop(){console.error=oe;W.removeEventListener("error",onerr);W.removeEventListener("unhandledrejection",onrej)}}}
async function checkStop(st,sp){const issues=[];const cap=captureErrors();
 try{
  const want=sp.persona||st.persona;R.setPersona(want);
  try{go(sp.screen,sp.arg)}catch(e){issues.push("screen failed to open: "+(e&&e.message||e))}
  await sleep(220);
  const denied=!!q1("#view [data-perm-denied]");
  if(denied&&sp.persona!=="ops")issues.push("the viewing role is denied this screen");
  if(!denied&&sp.persona==="ops")issues.push("the denial expected for this role did not show");
  if(sp.tab){if(R.findTab(sp.tab))R.applyTab(sp.tab);else issues.push("tab not found: "+sp.tab);await sleep(180)}
  if(sp.sel&&!denied&&!R.resolveTarget(sp.sel))issues.push("target not found: "+sp.sel);
  [].concat(sp.proof||[]).forEach(k=>{const p=R.proof(k);if(!p.ok)issues.push("proof not available: "+k)});
  const toks=[].concat(sp.notes||[],(sp.qa||[]).map(x=>x[1])).reduce((a,t)=>a.concat(R.tokensOf(t)),[]);toks.forEach(k=>{if(!R.proof(k).ok)issues.push("note value not available: "+k)});
  if(sp.tryit){const m=ACTIONS.find(x=>x.id===sp.tryit.act);if(!m||!G(m.need,false))issues.push("try-it action not available: "+sp.tryit.act)}
 }finally{cap.stop()}
 cap.errs.forEach(e=>issues.push("console error: "+e.slice(0,160)));
 return issues}
R.rehearse=async function(ids,onProgress){
 if(R.st&&R.st.active)R.exit();
 ids=(ids&&ids.length?ids:R.STORIES.map(s=>s.id));
 const prev=G(()=>S.persona,"exec");const out=[];let total=0,pass=0;
 const plan=ids.map(id=>R.story(id)).filter(Boolean).map(st=>({st,stops:R.stopsOf(st)}));const n=plan.reduce((a,p)=>a+p.stops.length,0);let k=0;
 for(const p of plan){for(const sp of p.stops){k++;if(onProgress)onProgress(k,n,p.st.title+": "+sp.head);const issues=await checkStop(p.st,sp);total++;if(!issues.length)pass++;out.push({story:p.st.id,storyTitle:p.st.title,stop:sp.id,head:sp.head,screen:sp.screen,ok:!issues.length,issues})}
  /* omitted stops are listed, not failed */
  p.st.stops.filter(x=>x.needs&&!p.stops.includes(x)).forEach(x=>out.push({story:p.st.id,storyTitle:p.st.title,stop:x.id,head:x.head,screen:x.screen,ok:true,skipped:true,issues:["omitted until "+x.needs+" is present"]}))}
 R.setPersona(prev);G(()=>go("r17p_tour"));
 const res={at:Date.now(),total,pass,rows:out,ids};R.lastRehearsal=res;try{sessionStorage.setItem(LASTKEY,JSON.stringify(res))}catch(e){}
 G(()=>{const m=METRICS.m_r17p_rehearsal;if(m&&total){m.cur=Math.round(1000*pass/total)/10;m.tr=(m.tr||[]).slice(-7).concat([m.cur])}});
 G(()=>R.refreshMetrics&&R.refreshMetrics());
 G(()=>audit("ran rehearsal check",pass+" of "+total+" stops passed"));
 return res};
})();
