/* ===== Round 17, Agent P (part 4 of 4): the Tour hub screen (r17p_tour) and its Feature Contract records.
   Process model (PROC.reg and PROCLIB through the shared wiring helper), data model with reuse-first decisions, two metrics with maturity,
   module flows, search, chat intent, named owner and backup. Reads the engine (part 2), the moments and rehearsal (part 3) and the stories (part 1). ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined||v===null?d:v}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>Array.prototype.slice.call((r||D).querySelectorAll(s));
const E=U.esc;
const R=W.R17P=W.R17P||{};
const OWN=["Rina Okafor","Jordan Lee"];
const PV=k=>R.proof(k).v;

/* ---------------------------------------------------------------- metrics (outcome and health), shown with fchip ---------------------------------------------------------------- */
(function(){const base=G(()=>{const o={};R.STORIES.forEach(s=>R.stopsOf(s).forEach(sp=>[].concat(sp.proof||[]).forEach(k=>{o.n=(o.n||0)+1;if(R.proof(k).ok)o.ok=(o.ok||0)+1})));return o},{n:0,ok:0});
 const stops=R.STORIES.reduce((a,s)=>a.concat(R.stopsOf(s)),[]);const okScreens=stops.filter(sp=>G(()=>SCREENS.some(s=>s[0]===sp.screen),false)).length;
 const pct=(a,b)=>b?Math.round(1000*a/b)/10:100;
 Object.assign(METRICS,{
  m_r17p_rehearsal:{n:"Tour rehearsal pass rate",f:"Stops whose screen opens without a console error and whose tab and target exist ÷ Stops in all stories",u:"%",cur:pct(okScreens,stops.length),tgt:100,badAt:90,dir:"max",max:100,tr:[pct(okScreens,stops.length),pct(okScreens,stops.length)],owner:OWN[0],use:["Tour"],
   rem:{kind:"sop",ref:"SOP-751",title:"Fix a failed tour stop before a session",agent:"",auto:false,state:"idle",prog:""}},
  m_r17p_proofs:{n:"Tour proof chips that read a live value",f:"Proof chips whose registry call returns a value ÷ Proof chips in all stories",u:"%",cur:pct(base.ok||0,base.n||0),tgt:100,badAt:95,dir:"max",max:100,tr:[pct(base.ok||0,base.n||0),pct(base.ok||0,base.n||0)],owner:OWN[0],use:["Tour"],
   rem:{kind:"sop",ref:"SOP-752",title:"Repoint a tour proof chip to a live registry",agent:"",auto:false,state:"idle",prog:""}}})})();

/* live recomputation: proof chips that resolve, and (until a full rehearsal has run) stops whose screen exists */
R.refreshMetrics=function(){G(()=>{let n=0,ok=0,stops=0,scr=0;R.STORIES.forEach(s=>R.stopsOf(s).forEach(sp=>{stops++;if(SCREENS.some(z=>z[0]===sp.screen))scr++;[].concat(sp.proof||[]).forEach(k=>{n++;if(R.proof(k).ok)ok++})}));
 const pct=(a,b)=>b?Math.round(1000*a/b)/10:100;const m1=METRICS.m_r17p_proofs,m2=METRICS.m_r17p_rehearsal;
 m1.cur=pct(ok,n);m1.tr=(m1.tr||[]).slice(-7);m1.tr[m1.tr.length-1]=m1.cur;
 if(!R.lastRehearsal){m2.cur=pct(scr,stops);m2.tr=(m2.tr||[]).slice(-7);m2.tr[m2.tr.length-1]=m2.cur}})};
[6500,12000].forEach(t=>setTimeout(()=>R.refreshMetrics(),t));
/* ---------------------------------------------------------------- process model ---------------------------------------------------------------- */
G(()=>PROC.reg("r17p_tour",{title:"Prepare and deliver a product demonstration",std:["itil5"],steps:[
 {n:"Choose a story",d:"The presenter picks a story for the audience and the time available; each story lists its stops, its persona and its length.",who:"human",owner:OWN[0],sla:"Before the session",in:"Audience and time",out:"Selected story"},
 {n:"Rehearse",d:"The rehearsal check opens every stop, confirms the tab and target exist, reads each proof chip and records console errors.",who:"robot",owner:OWN[0],sla:"Under a minute",in:"Selected story",out:"Pass or failure list"},
 {n:"Reset demo data",d:"Persisted edits are cleared and the seeded tenant is restored so every session starts from the same state.",who:"human",owner:OWN[0],sla:"Before the session",in:"Edited demo data",out:"Seeded tenant"},
 {n:"Present",d:"The presenter walks the stops with notes, spotlight and moments; every moment runs on the real runtime.",who:"human",owner:OWN[0],sla:"Story length",in:"Rehearsed story",out:"Delivered story"},
 {n:"Approve a story change",d:"A change to story text, stops or proof sources is reviewed by the governance group before it joins the tenant.",who:"gate",owner:"Platform governance group",sla:"2 working days",in:"Proposed story change",out:"Approved story"}]}));

/* ---------------------------------------------------------------- feature contract records (entities, module flows, process, ownership) ---------------------------------------------------------------- */
const F=(k,l,t,c,a)=>[k,l,t,c||"internal",a||"platform"];
G(()=>{const RR=W.R15F3;if(!RR||!RR.queue)return;
 RR.owners.r17p=OWN;
 RR.queue({key:"r17p",name:"Tour",screen:"r17p_tour",
  ent:[
   {id:"tour_story",label:"Tour story",domain:"gov",how:"new",n:5,note:"Integration decision: new. Registry search found process_guide (documents one process from the record) and learning_event (a completed training item). Neither holds an ordered route across screens for an audience with presenter notes and a live proof per stop. Stories are code data validated at load; only the shape is registered.",
    fields:[F("story_id","Story","string"),F("title","Title","string"),F("audience","Audience","string"),F("minutes","Length in minutes","number"),F("persona","Opening role","string"),F("stops","Stops","text"),F("owner","Owner","string","personal")]},
   {id:"tour_rehearsal",label:"Tour rehearsal result",domain:"gov",how:"new",n:40,note:"Integration decision: new and thin. The gate check result (publish gate) scores a module, not a presentation path; a rehearsal records, per stop, whether the screen opened, the target existed, each proof resolved and any console error.",
    fields:[F("story_id","Story","string"),F("stop_id","Stop","string"),F("screen","Screen","string"),F("ok","Passed","boolean"),F("issues","Issues","text"),F("run_at","Run at","string"),F("run_by","Run by","string","personal")]}],
  mod:{id:"r17p_tour",sn:"Tour",band:"plt",own:"Platform",r:["process_definition","metric_definition","agent_registry","process_guide","person"],w:["tour_story","tour_rehearsal","audit_event","notification"],
   flows:[["pull","r16m_guides","Process guides and process facts for stops","process_guide","api","Story opened"],["pull","ai_runtime","Agent counts and controls for proof chips","agent_registry","api","Stop opened"],["push","inbox","Approval request raised for a moment","notification","event","Moment run"],["push","adm_audit","Tour started, moment run, rehearsal run, data reset","audit_event","event","Presenter action"]]},
  proc:{id:"r17p_tour_process",name:"Prepare and deliver a product demonstration",owner:OWN[0],backup:OWN[1],trigger:"A presenter prepares a demonstration or a session is scheduled",
   steps:[["Choose a story","Presenter picks a story for the audience and time available.","human",OWN[0],"Before the session","Audience and time","Selected story"],["Rehearse","Rehearsal check opens every stop and reads each proof chip.","robot",OWN[0],"Under a minute","Selected story","Pass or failure list"],["Reset demo data","Persisted edits are cleared and the seeded tenant restored.","human",OWN[0],"Before the session","Edited demo data","Seeded tenant"],["Present","Presenter walks the stops with notes, spotlight and moments.","human",OWN[0],"Story length","Rehearsed story","Delivered story"],["Approve a story change","Governance group reviews a change to stories or proof sources.","gate","Platform governance group","2 working days","Proposed story change","Approved story"]],
   inputs:["Audience and time","Story definitions"],outputs:["Delivered story","Rehearsal result"],entities:["tour_story","tour_rehearsal"],metrics:["m_r17p_rehearsal","m_r17p_proofs"]}})});

/* ---------------------------------------------------------------- the hub screen ---------------------------------------------------------------- */
const T=(id)=>R.story(id);
const pill=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
function storyCard(st){const stops=R.stopsOf(st);const who=R.PERSONA_NOTE[st.persona]||st.persona;
 return `<article class="card glass r17p-story" aria-labelledby="r17p-s-${E(st.id)}"><header><div class="r17p-sh"><h3 id="r17p-s-${E(st.id)}">${E(st.title)}</h3><div class="r17p-pills">${pill(st.audience,"info")}${pill(st.minutes+" min")}${pill(stops.length+" stops")}</div></div></header>
  <p class="r17p-blurb">${E(st.blurb)}</p><p class="muted small">Opens as ${E(who)}.</p>
  <ol class="r17p-stops">${stops.map((sp,i)=>`<li><button type="button" class="r17p-stop" data-r17p-start="${E(st.id)}" data-i="${i}" title="Start the story at this stop">${E(sp.head)}</button></li>`).join("")}</ol>
  <div class="row r17p-acts"><button type="button" class="btn primary" data-r17p-start="${E(st.id)}">Start the story</button><button type="button" class="btn" data-r17p-reh="${E(st.id)}" data-go="1">Rehearse, then start</button></div></article>`}
function momentsCards(){const ms=R.moments(),miss=R.missing();
 return `<div class="grid g2 r17p-mg">${ms.map(m=>`<article class="card glass r17p-mcard"><header><h3>${E(m.label)}</h3></header><p>${E(m.sub)}</p><p class="muted small">Real code path: <code>${E(m.api)}</code></p><div class="row"><button type="button" class="btn primary" data-r17p-moment="${E(m.id)}">Run it</button></div></article>`).join("")}</div>
  <div class="r17p-res card glass" id="r17pHubRes" role="status" aria-live="polite">${R.momentLog&&R.momentLog[0]?E(R.momentLog[0].summary):"Run a moment to see its result here. Each one calls the platform's own runtime; none returns a canned answer."}</div>
  ${miss.length?`<p class="muted small">Left out because the API is not present: ${miss.map(x=>E(x.label+" ("+x.api+")")).join("; ")}.</p>`:""}`}
function rehTable(){const r=R.lastRehearsal;if(!r)return `<p class="muted">No rehearsal has run in this session. The check opens every stop of every story, so it takes a few seconds.</p>`;
 const fails=r.rows.filter(x=>!x.ok);const when=new Date(r.at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
 return `<p data-role="story"><b>${r.pass} of ${r.total}</b> stops passed at ${E(when)}. ${fails.length?`<b>${fails.length}</b> need attention.`:"Every stop opened, its target and tab were found and each proof chip read a live value."}</p>
  <div class="tscroll"><table><thead><tr><th>Story</th><th>Stop</th><th>Screen</th><th>Result</th><th>Detail</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${E(x.storyTitle)}</td><td>${E(x.head)}</td><td><code>${E(x.screen)}</code></td><td>${x.skipped?pill("Omitted","mute"):x.ok?pill("Pass","good"):pill("Fail","bad")}</td><td>${E(x.issues.join("; "))||"-"}</td></tr>`).join("")}</tbody></table></div>`}
function render(){
 R.refreshMetrics();
 const sc=PV("screens"),pr=PV("processes"),ag=PV("agents");
 const hero_=hero("Platform and administration / Tour","Show the product with its own data",
  `<b>${E(sc)}</b> screens, <b>${E(pr)}</b> documented processes and <b>${E(ag)}</b> registered AI agents sit behind five stories. Each stop opens a real screen, cites a figure read from the registries when it opens, and offers a click path that runs on the real runtime.`,
  `<div class="row"><button type="button" class="btn primary" data-r17p-start="five">Start the 5-minute story</button><button type="button" class="btn" data-r17p-reh="all">Rehearsal check</button><button type="button" class="btn" data-r17p="present" aria-pressed="${R.st.present}">Present mode</button>${fchip("m_r17p_rehearsal")}${fchip("m_r17p_proofs")}</div>`);
 const stories=`<div class="grid g2 r17p-sg">${R.STORIES.map(storyCard).join("")}</div>${R.errors&&R.errors.length?`<div class="card glass"><h3>Story schema issues</h3><ul>${R.errors.map(e=>`<li>${E(e)}</li>`).join("")}</ul></div>`:""}`;
 const moments=card("Moments","Eight one-click live behaviors. Each runs on the platform's own runtime and can also be fired from the presenter bar during a story.",momentsCards());
 const ctl=card("Rehearsal and reset","Run the check before a session, reset the demo tenant to its seed, and prepare the screen for sharing.",
  `<div class="row r17p-ctlrow"><button type="button" class="btn primary" data-r17p-reh="all">Rehearse all stories</button><button type="button" class="btn danger" data-r17p-reset>Reset demo data</button><button type="button" class="btn" data-r17p="present" aria-pressed="${R.st.present}">Present mode</button></div>
   <label class="r17p-chk"><input type="checkbox" data-r17p-badges ${R.st.hideBadges?"checked":""}><span>Hide owner badges while presenting</span></label>
   <p class="muted small">Reset clears every persisted edit and approval decision and reloads the seeded tenant. An open story resumes at the same stop. Present mode hides the New menu and enlarges type by 10 percent.</p>
   <div id="r17pRehRes" class="r17p-reh" role="status" aria-live="polite">${rehTable()}</div>`);
 const proc=card("Process and data","The process behind this screen, its owner and where its records live.",
  `<div class="row">${pchip(OWN[0],{role:1})}<span class="muted small">owner</span>${pchip(OWN[1],{role:1})}<span class="muted small">backup</span></div>
   <p class="muted small">Stories live in one data array, <code>R17P.STORIES</code>, validated at load (6 to 9 stops, headline of 8 words or fewer, one sentence each for what and why, every proof key and action known). Entities: <code>tour_story</code> and <code>tour_rehearsal</code>, both new and thin.</p>${procCard("r17p_tour")}`);
 return `<div class="screen r17p-hub">${hero_}${lensNote()}${views("r17p_v",["Stories","Moments","Rehearsal and reset","Process and data"],[stories,moments,ctl,proc])}</div>`}
REG("r17p_tour","Tour","platform","M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14",render);
G(()=>NAVX.add("r17p_tour",{group:"plat",label:"Tour",hint:"Guided stories, live moments, rehearsal and demo data reset",sub:"Demo mode",kw:"tour demo demonstration present presenter story walkthrough rehearsal moments reset guided"}),0);

/* ---------------------------------------------------------------- hub events ---------------------------------------------------------------- */
let resetArm=0;
D.addEventListener("click",e=>{
 const rb=e.target.closest&&e.target.closest("[data-r17p-reh]");
 if(rb){const k=rb.dataset.r17pReh;const ids=k==="all"?null:[k];const go_=rb.dataset.go==="1";const out=q1("#r17pRehRes");S.v=S.v||{};S.v.r17p_v=2;
  const view=q1('input[name="vw-r17p_v"][id="v-r17p_v-2"]');if(view)view.checked=true;
  Array.from(D.querySelectorAll("[data-r17p-reh]")).forEach(b=>b.disabled=true);
  R.rehearse(ids,(i,n,t)=>{const o=q1("#r17pRehRes");if(o)o.innerHTML=`<p>Checking stop ${i} of ${n}: ${E(t)}</p><progress max="${n}" value="${i}" aria-label="Rehearsal progress"></progress>`}).then(res=>{
   G(()=>{S.v.r17p_v=2;render_()});const failed=res.rows.filter(x=>!x.ok).length;
   if(go_&&ids&&!failed)R.start(ids[0],0);else if(go_&&failed)G(()=>toast(failed+" stop"+(failed===1?"":"s")+" failed the rehearsal; the story was not started","warn"))}).catch(err=>{const o=q1("#r17pRehRes");if(o)o.textContent="Rehearsal stopped: "+(err&&err.message||err)});return}
 const rs=e.target.closest&&e.target.closest("[data-r17p-reset]");
 if(rs){if(!resetArm||Date.now()-resetArm>5000){resetArm=Date.now();rs.textContent="Confirm: clear edits and reload";setTimeout(()=>{if(rs.isConnected&&Date.now()-resetArm>=4900){rs.textContent="Reset demo data";resetArm=0}},5100);return}
  resetArm=0;R.reset()}});
D.addEventListener("change",e=>{const b=e.target.closest&&e.target.closest("[data-r17p-badges]");if(b)R.setBadges(b.checked)});
function render_(){if(G(()=>S.screen,"")==="r17p_tour")render__()}
const render__=()=>{try{window.render()}catch(e){}};

/* ---------------------------------------------------------------- search and chat ---------------------------------------------------------------- */
G(()=>SEARCHX.push(()=>{const o=[{g:"Platform",t:"Tour",m:"Guided stories, moments, rehearsal, demo data reset",c:"--accent",f:()=>go("r17p_tour"),k:"tour demo demonstration present presenter story walkthrough rehearsal moments reset guided show"}];
 R.STORIES.forEach(s=>o.push({g:"Tour stories",t:s.title,m:s.audience+" · "+s.minutes+" min",c:"--accent",f:()=>R.start(s.id,0),k:"tour story demo "+s.title+" "+s.audience}));
 G(()=>R.moments().forEach(m=>o.push({g:"Tour moments",t:m.label,m:m.sub,c:"--accent",f:()=>{go("r17p_tour");S.v.r17p_v=1;render()},k:"tour moment demo "+m.label})));return o}));
G(()=>ASKX.push(q=>{const l=String(q).toLowerCase();
 if(/\b(tour|demo mode|demonstration|walkthrough|present mode|presenter|rehears)/.test(l)){go("r17p_tour");
  say(q,{t:R.STORIES.length+" stories are ready: "+R.STORIES.map(s=>s.title+" ("+s.minutes+" min)").join(", ")+". "+R.moments().length+" live moments are available from the presenter bar.",steps:["Opened the Tour hub","Read the story registry and the moment list"]});return true}
 return false}));
})();
