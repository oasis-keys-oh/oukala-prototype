/* ===== mod_r33_showroom: the Showroom engine (backlog DC-05, DC-08, DC-35, DC-10 thin, DC-32, DC-36, DC-37).
   A presenter bar, beat rail, talk track, timekeeper and claim chips laid over screens that already exist. It builds no new
   business screens: a beat opens an existing screen (and optionally one of its tabs) and says what is on it.
   Tours are data (SHOW.demos, SHOW.add). Lenses, wedge mode, demo reset, the VibeCheck hand-off, extra tours and the
   leave-behind live in mod_s_showroom*.js and plug in through SHOW. Fictional sample data only. Every number is labeled
   prototype fact, modeled, hypothesis or simulated. Prefix: sr-. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SELF="showroom",LIMIT=1200;

/* claim chips: what kind of statement a number or a screen is */
const CLAIM={
 fact:{l:"Prototype fact",d:"This screen exists and runs in the prototype today."},
 modeled:{l:"Modeled",d:"A sample or computed value, not measured in a real organization."},
 hypothesis:{l:"Hypothesis",d:"A working assumption not yet tested with a buyer."},
 simulated:{l:"Simulated",d:"Behavior is scripted in the prototype. No live connection, run or enforcement."}};

/* ---------- the tours (data) ----------
   beat: id, act, point (12 words or fewer), secs, go (screen id), arg (passed to go), tab (button text on that screen),
   say (exactly two sentences), do (one interaction), claims (chips). Optional: persona (role key), tenant, approve {kind,id}
   (the persona is then chosen so the Approve click passes group routing, DC-37), setup ("name:arg", see SHOW.setups),
   kids (optional child beats, outside the cut budget).
   tour: id, title, mins, who, blurb, beats; optional persona, tenant (default core: Meridian), lens, group (main, lens, brief, part). */
const DEMOS=[
{id:"coo",title:"COO thin thread",mins:15,who:"COO and operations leaders",persona:"coo",lens:"coo",
 blurb:"From the CEO's objectives to the dollar, the work, the agents and the next build. Ten existing screens on the fictional Meridian sample. These are the wedge screens.",
 beats:[
 {id:"set.1",act:"Set",point:"The CEO's objectives, each with a measure",secs:90,go:"exe_strat",
  say:["These are the company objectives, each with an owner and a measurable outcome.","The alignment score is a sample value, so treat it as modeled, not measured."],
  do:"Open one objective to see its key results.",claims:["modeled"]},
 {id:"cascade.1",act:"Cascade",point:"Every goal traces to capability, roadmap and work",secs:100,go:"strat_exec",
  say:["Each goal links to the capabilities that serve it, the roadmap items that raise them and the projects that deliver.","Where a goal has no funded path, the gap shows."],
  do:"Open a goal that shows a gap.",claims:["modeled"]},
 {id:"demand.1",act:"Demand",point:"Requests ranked against what we can fund",secs:90,go:"port",tab:"Capacity vs demand",
  say:["New requests are scored against the objectives and against the capacity we have.","The capacity view shows which teams are overloaded by funded work."],
  do:"Point at the team with the highest load.",claims:["modeled"]},
 {id:"fund.1",act:"Fund",point:"Follow the dollar to the goal",secs:100,go:"bst",
  say:["Spend rolls up from the cost center to the goal it serves, so every dollar has a reason.","Money that reaches no goal shows as orphan spend in the trace."],
  do:"Press Open the trace and point at orphan spend.",claims:["modeled"]},
 {id:"track.1",act:"Track",point:"One dashboard per role, same underlying numbers",secs:70,go:"exe_dash",tab:"COO",
  say:["Each executive sees the same numbers cut for their job.","The COO view leads with delivery and service health."],
  do:"Compare the COO tab with the CEO tab.",claims:["modeled"]},
 {id:"deliver.1",act:"Deliver",point:"The work as the people inside it experience it",secs:90,go:"ppl_jrny",tab:"Map",
  say:["A journey shows the stages, the people and the steps that carry the work.","Boxes with no process behind them are flagged in red."],
  do:"Click a stage to filter the journey.",claims:["modeled"]},
 {id:"deliver.2",act:"Deliver",point:"Every step is a process we can open",secs:80,go:"ppl_jrny",tab:"Process map",
  say:["Each journey step maps to a numbered process, with hand-offs between them.","Steps that share a touchpoint with another journey are marked."],
  do:"Open one process in the designer.",claims:["fact"]},
 {id:"deliver.3",act:"Deliver",point:"Where agents and robots would take work",secs:100,go:"orgassist",
  say:["Dashed cards are recommended agents and robots, placed under the team they would help.","They are proposals drawn from the journeys. None of them is running."],
  do:"Turn the proposal overlay on and off.",claims:["modeled","simulated"]},
 {id:"deliver.4",act:"Deliver",point:"What to build first, in waves",secs:90,go:"ppl_jrny",tab:"Build list",
  say:["Recommended builds are grouped into waves, starting with the easy and valuable ones.","The wave logic is our working hypothesis and has not been reviewed by a buyer."],
  do:"Open wave 1.",claims:["modeled","hypothesis"]},
 {id:"build.1",act:"Build",point:"Build the next one from a plain request",secs:100,go:"studio",setup:"studio:home",
  say:["You describe the job in plain words and the studio builds it inside the guardrails.","The interview is scripted in this prototype, so show it as a preview."],
  do:"Press Start the click-through demo.",claims:["simulated"]}]},
/* DC-32: built from the DC-33 inventory (docs/inventory/maturity-tour-map.md). Seven beats; the Process library beat is new and uses an
   existing screen. Every screen on this tour shows the Meridian sample in every tenant, so the tour runs on Meridian and says so. */
{id:"maturity",title:"Process maturity and roadmap",mins:8,who:"COO, CIO and PMO audiences",persona:"coo",tenant:"core",
 tenantWhy:"Four of these screens are not tenant-aware yet, so the tour runs on the Meridian sample in every tenant.",
 blurb:"Pick a process, see its maturity record and target, the measure behind the score, the roadmap and what to build first. Checked against the maturity inventory (DC-33); runs on the Meridian sample.",
 beats:[
 {id:"m.1",act:"Pick",point:"Pick any process and find it by number",secs:60,go:"ppl_jrny",tab:"Processes",
  say:["Every process has a stable number such as P-014 and a link you can share.","Press Ctrl K and type a number to jump straight to it."],
  do:"Click one process row.",claims:["fact"]},
 {id:"m.2",act:"Record",point:"Each process carries a maturity record and a target",secs:80,go:"plat_proc",tab:"Maturity",
  say:["The process library scores every library process on six dimensions: defined, owned, measured, integrated, automated and governed.","Levels are computed from signals in each process and the counts grow as screens add their processes, so treat them as modeled."],
  do:"Open one process to see its six dimensions and Year 1 target.",claims:["modeled","fact"]},
 {id:"m.3",act:"Level",point:"Maturity today against target, on one shared scale",secs:70,go:"exe_mat",tab:"Models and levels",
  say:["Each capability is scored on one shared scale, today against the target.","Capability levels are sample values entered for Meridian, so present them as a conversation starter."],
  do:"Open one model to see its levels.",claims:["modeled"]},
 {id:"m.4",act:"Evidence",point:"Why that level: a defined measure",secs:60,go:"metrics",
  say:["Every measure has an owner, a formula and a baseline.","Open a formula chip to see exactly how the number is built."],
  do:"Open one formula chip.",claims:["modeled"]},
 {id:"m.5",act:"Roadmap",point:"Each build's path to a higher level",secs:70,go:"r18_mature",
  say:["Every build shows its level, its target and the next step to move up.","The roadmap lists what is below target and what is already at the next tier."],
  do:"Select one build to see its full roadmap.",claims:["modeled"]},
 {id:"m.6",act:"Fix first",point:"What to fix first, in waves",secs:70,go:"ppl_jrny",tab:"Build list",
  say:["The Build list orders agents and robots into waves, easy and valuable first.","The wave logic is a hypothesis until a buyer reviews it."],
  do:"Open wave 1.",claims:["modeled","hypothesis"]},
 {id:"m.7",act:"Build",point:"Build the fix from a plain request",secs:70,go:"studio",setup:"studio:home",
  say:["A gap becomes a plain-language request in the studio.","The interview is scripted here, so show it as a preview."],
  do:"Press Start the click-through demo.",claims:["simulated"]}]}];
const BY={};
function add(d){if(!d||!d.id||!Array.isArray(d.beats))return false;d.total=d.beats.reduce((a,b)=>a+(+b.secs||0),0);
 const i=DEMOS.findIndex(x=>x.id===d.id);if(i>=0&&DEMOS[i]!==d)DEMOS[i]=d;else if(i<0)DEMOS.push(d);BY[d.id]=d;return true}
DEMOS.slice().forEach(add);
/* paths: several cuts played in order. Each cut stays under the limit; the path itself may run longer (DC-30). */
const PATHS=[];

/* ---------- lint: beats and budgets must pass before anything ships ---------- */
const BANNED=/\b(Fabric|Trellis|Oukala|Shaheen)\b/;
function lintBeat(t,b,bad){
 if(!b.point||b.point.split(/\s+/).length>12)bad.push(t+": point missing or over 12 words");
 if(!(b.secs>0))bad.push(t+": secs missing");
 if(!b.say||b.say.length!==2)bad.push(t+": talk track must be exactly two sentences");
 if(!b.claims||!b.claims.length||b.claims.some(c=>!CLAIM[c]))bad.push(t+": claim chip missing or unknown");
 if(!b.do)bad.push(t+": no interaction");
 if(!G(()=>SCREENS.some(s=>s[0]===b.go),true))bad.push(t+": screen "+b.go+" is not registered");
 if(b.persona&&!G(()=>PERSONAS[b.persona],true))bad.push(t+": persona "+b.persona+" is unknown");
 if(b.tenant&&!tenantKnown(b.tenant))bad.push(t+": tenant "+b.tenant+" is unknown");
 if(b.setup&&!ST.setups[String(b.setup).split(":")[0]])bad.push(t+": setup "+b.setup+" is unknown");
 [b.point,...(b.say||[]),b.do,b.title].forEach(x=>{if(/—/.test(x||""))bad.push(t+": em dash in text");if(BANNED.test(x||""))bad.push(t+": banned name in text")})}
function lint(){const bad=[];
 DEMOS.forEach(d=>{const tot=d.beats.reduce((a,b)=>a+(+b.secs||0),0);d.total=tot;
  if(tot>LIMIT)bad.push(d.id+": cut is "+tot+" seconds, over "+LIMIT);
  if(d.persona&&!G(()=>PERSONAS[d.persona],true))bad.push(d.id+": persona "+d.persona+" is unknown");
  if(d.tenant&&!tenantKnown(d.tenant))bad.push(d.id+": tenant "+d.tenant+" is unknown");
  if(d.lens&&ST.lensOf&&!ST.lensOf(d.lens))bad.push(d.id+": lens "+d.lens+" is unknown");
  if(BANNED.test(d.title+" "+d.blurb)||/—/.test(d.title+" "+d.blurb))bad.push(d.id+": banned name or em dash in title or blurb");
  d.beats.forEach(b=>{lintBeat(d.id+"/"+b.id,b,bad);(b.kids||[]).forEach(k=>lintBeat(d.id+"/"+b.id+"/"+k.id,k,bad))})});
 PATHS.forEach(p=>p.parts.forEach(id=>{if(!BY[id])bad.push("path "+p.id+": part "+id+" is not a tour")}));
 return bad}
function tenantKnown(t){return t==="core"||!!G(()=>SCN.list[t],false)||!!G(()=>DATA.tenantInfo(t),null)}

/* ---------- state ---------- */
const ST=W.SHOW={demos:DEMOS,paths:PATHS,lint,add,CLAIM,LIMIT,setups:{},home:[],
 state:{demo:null,i:0,mode:"presenter",talk:true,rail:false,t0:0,bt0:0,tick:0,laps:{},busy:false,queued:false,kid:null,lens:null,path:null,prev:null,win:null,remote:false}};
const st=ST.state;
Object.defineProperty(st,"aud",{get(){return st.mode==="audience"},set(v){st.mode=v?"audience":"presenter"},enumerable:true});
const fmt=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const chip=k=>`<span class="sr-chip sr-${k}" title="${E(CLAIM[k].d)}">${E(CLAIM[k].l)}</span>`;
ST.fmt=fmt;ST.chip=chip;ST.byId=id=>BY[id]||null;
const tName=t=>G(()=>(SCN.list[t]||{}).n,null)||G(()=>DATA.tenantInfo(t).org,null)||t;
const curTenant=()=>G(()=>DATA.tenant(),null)||G(()=>SCN.cur,"core");

/* ---------- setups: small named actions a beat may run after its screen opens ---------- */
const studioReset=()=>G(()=>{if(W.STUDIO){STUDIO.sc=null;STUDIO.view="home";STUDIO.stage="find"}});
ST.setups.studio=(arg)=>{if(!W.STUDIO)return;arg=String(arg||"home");const c=arg.indexOf(":"),kind=c<0?arg:arg.slice(0,c),rest=c<0?"":arg.slice(c+1);
 if(kind==="home"){studioReset();G(()=>render())}
 else if(kind==="scen"){const [id,view]=rest.split(":");
  if(!STUDIO.sc||STUDIO.lastScen!==id){studioReset();G(()=>render());G(()=>STUDIO.start(id));STUDIO.lastScen=id}
  if(view){STUDIO.view=view;G(()=>render())}}
 else if(kind==="ask"){studioReset();STUDIO.lastScen=null;G(()=>render());G(()=>STUDIO.mount());G(()=>STUDIO.submit(rest))}};
ST.setups.budreq=(id)=>{G(()=>BUDREQ.openReq(id))};
ST.setups.lens=(id)=>{G(()=>ST.applyLens&&ST.applyLens(id,{quiet:true}));G(()=>render())};

/* ---------- DC-37: personas that can click Approve on a beat ----------
   Approvals route to a group (APG.route) and only a member may decide (APG.check). The screen's actor is read the way the
   screen reads it: budget requests through INBOX.me(), everything else through the persona's identity. */
function actorAs(kind,p){const prev=S.persona;try{S.persona=p;return kind==="budget_request"?G(()=>INBOX.me(),null):G(()=>R15D.me().name,null)}finally{S.persona=prev}}
function approvalRec(ap){if(!ap)return null;if(ap.kind==="budget_request"){const r=G(()=>BUDREQ.requests().find(x=>x.id===ap.id),null);
  return r?{id:r.id,requester:r.req,stage:r.st,amount:r.amt,named:G(()=>BUDREQ.rev(r.st,r).name,"")}:null}return ap.rec||null}
function personaForApproval(ap,pref){const rec=approvalRec(ap);if(!rec||!W.APG)return pref||null;
 const cands=[pref,"exec","fin","pm","ops"].concat(Object.keys(G(()=>PERSONAS,{}))).filter((x,i,a)=>x&&a.indexOf(x)===i);
 for(const p of cands){const a=actorAs(ap.kind,p);if(a&&G(()=>APG.check(a,ap.kind,rec).ok,false))return p}return pref||null}
ST.approvalRec=approvalRec;ST.personaForApproval=personaForApproval;ST.actorAs=actorAs;

/* ---------- quiet the app while presenting ---------- */
function quiet(){G(()=>CHATX.close());G(()=>INBOX.closePanel());G(()=>INBOX.closeFocus());G(()=>{D.querySelectorAll("dialog[open]").forEach(x=>x.close())});G(()=>closeDrawer());G(()=>{const c=D.getElementById("chatOpen");if(c)c.checked=false})}
function clickTab(txt){if(!txt)return false;const want=txt.toLowerCase();
 const bs=[...D.querySelectorAll(".screen .views button, .screen [role=tab]")];
 /* screens that draw their own view switcher: fall back to an exact button label inside the screen */
 const b=bs.find(x=>x.textContent.trim().toLowerCase()===want)||bs.find(x=>x.textContent.trim().toLowerCase().startsWith(want))||[...D.querySelectorAll("#view .screen button")].find(x=>x.textContent.trim().toLowerCase()===want);
 if(b){b.click();try{const a=D.activeElement;if(a&&a!==D.body&&a.blur)a.blur()}catch(e){}return true}return false}

/* ---------- what the presenter sees ---------- */
const cur=()=>{const d=BY[st.demo];if(!d)return null;const b=d.beats[st.i];return st.kid!=null&&b&&b.kids&&b.kids[st.kid]?b.kids[st.kid]:b};
function tenantChip(d,b){const t=b.tenant||d.tenant||"core",mode=G(()=>DATA.screenMode(b.go),"core");
 let h=`<span class="sr-chip sr-ten" title="${E(d.tenantWhy||"The tour runs on this tenant. Every name and figure is fictional sample data.")}">${E(tName(t))}${st.forced?" (switched for this tour)":""}</span>`;
 if(t!=="core"&&mode==="core")h+=`<span class="sr-chip sr-warnchip" title="This screen is not tenant-aware yet, so it shows the Meridian sample under every tenant.">Meridian-only screen</span>`;
 return h}
function lensStrip(){const L=st.lens&&ST.lensOf?ST.lensOf(st.lens):null;if(!L)return"";
 const ms=(L.metrics||[]).map(id=>G(()=>{const m=METRICS[id];return m?`<span class="sr-met" title="${E(m.n)}: sample value, modeled"><b>${E(mfmt(m))}</b> ${E(m.n)}</span>`:""},"")).join("");
 return `<div class="sr-lens"><span class="sr-act">${E(L.short)} lens</span> <span class="sr-lq">${E(L.q)}</span>${ms?`<div class="sr-mets">${ms} ${chip("modeled")}</div>`:""}</div>`}
function railHTML(){const d=BY[st.demo];if(!d||!st.rail||st.aud)return"";let last="";
 return `<nav class="sr-rail glass" id="srRail" aria-label="Beats in this tour"><div class="sr-rh"><b>${E(d.title)}</b><button type="button" class="btn quiet sr-x" data-srx="rail" aria-label="Close the beat list">&times;</button></div><ol>${d.beats.map((b,k)=>{const head=b.act!==last?`<li class="sr-ract">${E(b.act)}</li>`:"";last=b.act;
  return head+`<li><button type="button" class="sr-rb${k===st.i&&st.kid==null?" on":""}${k<st.i?" done":""}" data-srx="jump" data-i="${k}" aria-current="${k===st.i&&st.kid==null?"step":"false"}"><span class="sr-rn">${k+1}</span><span>${E(b.point)}</span><em>${fmt(b.secs)}</em></button></li>`+
   (b.kids||[]).map((c,j)=>`<li class="sr-rkid"><button type="button" class="sr-rb${k===st.i&&st.kid===j?" on":""}" data-srx="kid" data-i="${k}" data-k="${j}"><span class="sr-rn">+</span><span>Optional: ${E(c.title||c.point)}</span><em>${fmt(c.secs)}</em></button></li>`).join("")}).join("")}</ol>
  <p class="small muted">Optional views do not count toward the ${fmt(d.total)} budget.</p></nav>`}
function barHTML(){const d=BY[st.demo];if(!d)return"";const b=cur(),main=d.beats[st.i],n=d.beats.length,now=Date.now(),el=(now-st.t0)/1000,pc=Math.min(100,el/d.total*100);
 const cls=el>d.total?"over":el>d.total*.8?"warn":"";const bel=(now-st.bt0)/1000;
 const reh=st.mode==="rehearse"?`<span class="sr-t sr-bt ${bel>b.secs?"over":bel>b.secs*.8?"warn":""}" title="This beat against its own budget"><i style="width:${Math.min(100,bel/b.secs*100).toFixed(0)}%"></i><b>Beat ${fmt(bel)} of ${fmt(b.secs)}</b></span>`:"";
 const path=st.path?`<span class="sr-pill">${E(st.path.title)}: part ${st.path.part+1} of ${st.path.parts.length}</span>`:"";
 const kidBtn=st.kid==null&&main.kids&&main.kids.length&&!st.aud?main.kids.map((c,j)=>`<button type="button" class="btn quiet sr-kidb" data-srx="kid" data-i="${st.i}" data-k="${j}" title="Optional guided view, outside the cut budget (G)">Optional: ${E(c.title||c.point)} (${fmt(c.secs)})</button>`).join(""):"";
 const unkid=st.kid!=null?`<button type="button" class="btn" data-srx="unkid">Back to the tour</button>`:"";
 const talk=(!st.aud&&st.talk)?`<div class="sr-talk" id="srTalk" aria-live="polite"><div class="sr-tk-h"><span class="sr-act">${E(b.act)}${st.kid!=null?" · optional":""}</span><span class="sr-tk-n">Beat ${st.i+1} of ${n}</span></div>
  ${lensStrip()}<p class="sr-say">${E(b.say[0])} ${E(b.say[1])}</p><p class="sr-do"><b>Do:</b> ${E(b.do)}</p><div class="sr-chips">${b.claims.map(chip).join("")}${tenantChip(d,b)}</div>
  ${st.personaNote?`<p class="sr-key">${E(st.personaNote)}</p>`:""}
  <p class="sr-key">Keys: Right and Left arrows or Page Down and Page Up move, R beat list, T talk track, A audience, G optional view, Esc exits.${st.queued?" Next is queued until the screen finishes typing.":""}</p></div>`:"";
 return `${railHTML()}${talk}<div class="sr-bar glass${st.aud?" aud":""}">
  <div class="sr-r1"><span class="sr-demo">${E(d.title)}</span>${path}<span class="sr-pt" id="srPt">${E(b.point)}</span>${st.aud?"":`<span class="sr-t ${cls}" title="Elapsed against the ${fmt(d.total)} budget"><i style="width:${pc.toFixed(0)}%"></i><b>${fmt(el)} of ${fmt(d.total)}</b></span>${reh}`}
   <button type="button" class="btn quiet sr-x" data-srx="exit" aria-label="Exit the Showroom tour" title="Exit (Esc)">&times;</button></div>
  <div class="sr-r2"><button type="button" class="btn" data-srx="back"${st.i||st.kid!=null?"":" disabled"}>Back</button>
   <span class="sr-dots" role="list">${d.beats.map((x,k)=>`<button type="button" role="listitem" class="sr-dot${k===st.i?" on":k<st.i?" done":""}" data-srx="jump" data-i="${k}" aria-label="Beat ${k+1}: ${E(x.point)}" aria-current="${k===st.i?"step":"false"}"></button>`).join("")}</span>
   ${st.aud?"":`<button type="button" class="btn quiet" data-srx="rail" aria-pressed="${st.rail}">Beats</button><button type="button" class="btn quiet" data-srx="talk" aria-pressed="${st.talk}">Talk track</button>`}
   <label class="sr-mode"><span class="sr-vh">Mode</span><select data-sr-mode aria-label="Presenting mode">${[["presenter","Presenter"],["audience","Audience"],["rehearse","Rehearse"]].map(([k,l])=>`<option value="${k}"${st.mode===k?" selected":""}>${l}</option>`).join("")}</select></label>
   ${st.aud||st.remote?"":`<button type="button" class="btn quiet" data-srx="win" title="Open the talk track in a second window and keep this one for the audience">Presenter window</button>`}
   ${unkid}${kidBtn}
   <button type="button" class="btn primary" data-srx="next">${st.queued?"Next (queued)":st.i>=n-1&&st.kid==null?(st.path&&st.path.part<st.path.parts.length-1?"Next part":"Finish"):"Next"}</button></div></div>`}
function host(){let h=D.getElementById("srBar");if(!h){h=D.createElement("div");h.id="srBar";h.setAttribute("role","region");h.setAttribute("aria-label","Showroom presenter controls");D.body.appendChild(h)}return h}
function paint(){const h=host();h.innerHTML=barHTML();D.body.classList.toggle("sr-aud",!!st.aud);D.body.classList.toggle("sr-rail-on",!!(st.rail&&!st.aud))}
ST.paint=paint;

/* ---------- tenant, persona and lens for a beat ---------- */
function applyTenant(t){t=t||"core";if(curTenant()===t)return true;const ok=G(()=>SCN.set(t),false);if(!ok)G(()=>DATA.setTenant(t));return curTenant()===t}
function applyPersona(p){if(!p||S.persona===p)return;G(()=>NAVX.persona.set(p))}
function setupBeat(d,b){st.personaNote="";
 applyTenant(b.tenant||d.tenant||"core");
 let p=b.persona||d.persona||null;
 if(b.approve){const q=personaForApproval(b.approve,b.persona||d.persona);if(q){p=q;const who=actorAs(b.approve.kind,q);st.personaNote="Viewing as "+G(()=>PERSONAS[q].n,q)+" ("+who+") so the Approve click routes to a group this person belongs to. Approval routing is real in the prototype; the decision is sample data."}}
 applyPersona(p);
 if(st.lens&&ST.applyLens)G(()=>ST.applyLens(st.lens,{quiet:true}))}

/* ---------- navigation ---------- */
function open(i,o){o=o||{};const d=BY[st.demo];if(!d)return;
 if(st.mode==="rehearse"&&st.bt0){const k=st.kid!=null?st.i+"."+st.kid:String(st.i);st.laps[k]=(st.laps[k]||0)+(Date.now()-st.bt0)/1000}
 st.i=Math.max(0,Math.min(d.beats.length-1,i));st.kid=o.kid!=null?o.kid:null;const b=cur();st.bt0=Date.now();
 st.busy=true;quiet();setupBeat(d,b);
 G(()=>go(b.go,b.arg));
 setTimeout(()=>{st.tabMissed=b.tab&&!clickTab(b.tab)?b.tab:null;if(b.setup){const s=String(b.setup),c=s.indexOf(":"),k=c<0?s:s.slice(0,c),a=c<0?"":s.slice(c+1);G(()=>ST.setups[k](a,b))}
  if(b.go!=="studio")quiet();const v=D.getElementById("view");if(v)v.scrollTop=0;try{W.scrollTo(0,0)}catch(e){}
  setTimeout(()=>{st.busy=false;paint()},120)},360);
 setTimeout(()=>{G(()=>CHATX.close());G(()=>{const c=D.getElementById("chatOpen");if(c)c.checked=false})},1100);
 G(()=>{const u=new URL(location.href);u.searchParams.set("showroom",st.demo);u.searchParams.set("beat",String(st.i+1));if(st.kid!=null)u.searchParams.set("kid",String(st.kid+1));else u.searchParams.delete("kid");history.replaceState(null,"",u)});
 paint();if(!o.remote)sync()}
function start(id,beat,opts){opts=opts||{};const d=BY[id];if(!d)return false;
 if(!st.demo&&!st.prev)st.prev={persona:G(()=>S.persona,null),tenant:curTenant()};
 const want=d.tenant||"core";st.forced=opts.keepForced?!!st.forced:curTenant()!==want;
 st.demo=id;st.mode=opts.mode||(opts.aud?"audience":st.path&&opts.keepMode?st.mode:"presenter");st.talk=true;st.t0=Date.now();st.laps={};st.queued=false;st.kid=null;
 st.lens=opts.lens||d.lens||null;st.remote=!!opts.remote;
 D.body.classList.add("sr-on");clearInterval(st.tick);st.tick=setInterval(tick,1000);
 open(beat||0,{kid:opts.kid});return true}
function tick(){const d=BY[st.demo];if(!d)return;const t=D.querySelector(".sr-bar .sr-t:not(.sr-bt)");const el=(Date.now()-st.t0)/1000;
 if(t){t.className="sr-t "+(el>d.total?"over":el>d.total*.8?"warn":"");t.querySelector("i").style.width=Math.min(100,el/d.total*100).toFixed(0)+"%";t.querySelector("b").textContent=fmt(el)+" of "+fmt(d.total)}
 const bt=D.querySelector(".sr-bt"),b=cur();if(bt&&b){const be=(Date.now()-st.bt0)/1000;bt.className="sr-t sr-bt "+(be>b.secs?"over":be>b.secs*.8?"warn":"");bt.querySelector("i").style.width=Math.min(100,be/b.secs*100).toFixed(0)+"%";bt.querySelector("b").textContent="Beat "+fmt(be)+" of "+fmt(b.secs)}}
function rehearsalReport(){const d=BY[st.demo];if(!d)return null;const rows=d.beats.map((b,k)=>({id:b.id,point:b.point,secs:b.secs,actual:Math.round(st.laps[String(k)]||0)}));
 const r={demo:d.id,title:d.title,at:new Date().toISOString(),budget:d.total,actual:rows.reduce((a,x)=>a+x.actual,0),rows};G(()=>U.store.set("showroom.rehearsal",r));ST.lastRehearsal=r;return r}
function exit(o){o=o||{};if(st.mode==="rehearse"&&st.demo){if(st.bt0){const k=st.kid!=null?st.i+"."+st.kid:String(st.i);st.laps[k]=(st.laps[k]||0)+(Date.now()-st.bt0)/1000;st.bt0=0}rehearsalReport()}
 clearInterval(st.tick);const was=st.demo;st.demo=null;st.kid=null;st.queued=false;st.path=o.keepPath?st.path:null;D.body.classList.remove("sr-on","sr-aud","sr-rail-on");const h=D.getElementById("srBar");if(h)h.innerHTML="";
 G(()=>{const u=new URL(location.href);["showroom","beat","kid","mode","srwin","lens","srpath"].forEach(k=>u.searchParams.delete(k));history.replaceState(null,"",u)});
 if(!o.keepPath&&st.prev){const p=st.prev;st.prev=null;if(p.tenant)applyTenant(p.tenant);if(p.persona)applyPersona(p.persona)}
 if(!o.remote&&was)sync({exit:true});
 if(!o.stay)G(()=>go(SELF))}
const studioBusy=()=>G(()=>S.screen==="studio"&&W.STUDIO&&STUDIO.isBusy&&STUDIO.isBusy(),false);
/* Next while a screen is still opening or typing is queued, never lost (DC-05) */
function next(){const d=BY[st.demo];if(!d)return;
 if(st.busy||studioBusy()){if(!st.queued){st.queued=true;paint();const t0=Date.now();const w=setInterval(()=>{if((!st.busy&&!studioBusy())||Date.now()-t0>8000){clearInterval(w);st.queued=false;doNext()}},150)}return}
 doNext()}
function doNext(){const d=BY[st.demo];if(!d)return;
 if(st.kid!=null){if(st.i<d.beats.length-1)open(st.i+1);else open(st.i);return}
 if(st.i>=d.beats.length-1){const took=(Date.now()-st.t0)/1000;
  if(st.path&&st.path.part<st.path.parts.length-1){const p=st.path;p.part++;exit({keepPath:true,stay:true});start(p.parts[p.part],0,{mode:st.mode,keepMode:true,keepForced:true,quietForce:true});G(()=>toast(p.title+": part "+(p.part+1)+" of "+p.parts.length,"info"));return}
  const rh=st.mode==="rehearse";exit();if(rh){const r=ST.lastRehearsal;G(()=>toast("Rehearsal: "+fmt(r.actual)+" of "+fmt(r.budget)+". Beat times are on the Showroom page.",r.actual>r.budget?"warn":"good"))}
  else G(()=>toast("Tour finished in "+fmt(took)+" of "+fmt(d.total),"good"));return}
 open(st.i+1)}
function back(){if(!st.demo)return;if(st.kid!=null){open(st.i);return}if(st.i>0)open(st.i-1)}
function startPath(id,o){const p=PATHS.find(x=>x.id===id);if(!p)return false;st.path=Object.assign({},p,{part:0});return start(p.parts[0],0,o)}
function setMode(m){if(["presenter","audience","rehearse"].indexOf(m)<0)return;st.mode=m;if(m==="rehearse")st.bt0=Date.now();paint();sync()}
Object.assign(ST,{start,exit,next,back,startPath,setMode,jump:i=>open(i),kid:(i,k)=>open(i,{kid:k||0}),open,rehearsalReport,
 isBusy:()=>st.busy||studioBusy(),current:cur});

/* ---------- presenter window (DC-36): the same page, in presenter mode, kept in step by messages ---------- */
function sync(o){o=o||{};const msg={sr:"falconaire-showroom",demo:st.demo,i:st.i,kid:st.kid,exit:!!o.exit};
 G(()=>{if(st.win&&!st.win.closed)st.win.postMessage(msg,"*")});G(()=>{if(W.opener&&st.remote)W.opener.postMessage(msg,"*")})}
function presenterWindow(){if(!st.demo)return null;const u=new URL(location.href);u.searchParams.set("showroom",st.demo);u.searchParams.set("beat",String(st.i+1));u.searchParams.set("mode","presenter");u.searchParams.set("srwin","1");
 const w=G(()=>W.open(u.toString(),"falconaire-presenter","popup,width=520,height=760"),null);
 if(w){st.win=w;setMode("audience");G(()=>toast("Talk track opened in a second window. This window is now the audience view.","info"))}
 else G(()=>toast("The browser blocked the second window. Allow pop-ups for this page, or use audience mode.","warn"));return w}
ST.presenterWindow=presenterWindow;
W.addEventListener("message",e=>{const m=e.data;if(!m||m.sr!=="falconaire-showroom")return;if(e.source&&e.source!==W.opener&&e.source!==st.win)return;
 if(m.exit){if(st.demo)exit({remote:true});return}
 if(!m.demo)return;if(st.demo!==m.demo)start(m.demo,m.i,{mode:st.remote?"presenter":"audience",remote:st.remote,kid:m.kid});else open(m.i,{kid:m.kid,remote:true})});

D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-srx],[data-sr-start],[data-sr-path]");if(!t)return;
 if(t.dataset.srPath){const aud=!!(D.getElementById("srAud")&&D.getElementById("srAud").checked);startPath(t.dataset.srPath,{aud});return}
 if(t.dataset.srStart){const aud=!!(D.getElementById("srAud")&&D.getElementById("srAud").checked);const m=t.dataset.srMode||(aud?"audience":"presenter");start(t.dataset.srStart,+t.dataset.srBeat||0,{mode:m});return}
 const a=t.dataset.srx;
 if(a==="next")next();else if(a==="back")back();else if(a==="exit")exit();
 else if(a==="jump")open(+t.dataset.i);
 else if(a==="kid")open(+t.dataset.i,{kid:+t.dataset.k||0});
 else if(a==="unkid")open(st.i);
 else if(a==="talk"){st.talk=!st.talk;paint()}
 else if(a==="rail"){st.rail=!st.rail;paint()}
 else if(a==="aud"){setMode(st.aud?"presenter":"audience")}
 else if(a==="win")presenterWindow()});
D.addEventListener("change",e=>{const t=e.target;if(t&&t.matches&&t.matches("[data-sr-mode]"))setMode(t.value)});
D.addEventListener("keydown",e=>{if(!st.demo)return;const t=e.target;if(t&&t.matches&&t.matches("input:not([type=radio]):not([type=checkbox]):not([type=button]),textarea,select,[contenteditable=true]"))return;if(e.ctrlKey||e.metaKey||e.altKey)return;
 /* the VibeCheck click-through owns the arrow keys while a scenario is live; Page Down and Page Up (presentation clickers) still move the tour */
 const stu=G(()=>S.screen==="studio"&&W.STUDIO&&!!STUDIO.sc&&STUDIO.view!=="home",false);
 if(e.key==="PageDown"||(e.key==="ArrowRight"&&!stu)){e.preventDefault();next()}
 else if(e.key==="PageUp"||(e.key==="ArrowLeft"&&!stu)){e.preventDefault();back()}
 else if(e.key==="Escape"){exit()}
 else if(e.key==="t"||e.key==="T"){st.talk=!st.talk;paint()}
 else if(e.key==="r"||e.key==="R"){st.rail=!st.rail;paint()}
 else if(e.key==="g"||e.key==="G"){const b=BY[st.demo].beats[st.i];if(st.kid==null&&b.kids&&b.kids.length)open(st.i,{kid:0})}
 else if(e.key==="a"||e.key==="A"){setMode(st.aud?"presenter":"audience")}});

/* ---------- the Showroom home screen ---------- */
function demoCard(d){return `<article class="sr-card glass" data-sr-card="${E(d.id)}"><div class="sr-ch"><h3>${E(d.title)}</h3><span class="sr-pill">About ${d.mins||Math.round(d.total/60)} min</span>${d.draft?`<span class="sr-pill sr-draft" title="The beats exist but have not been checked for every process.">Draft</span>`:""}${d.tenant&&d.tenant!=="core"?`<span class="sr-pill">${E(tName(d.tenant))}</span>`:""}</div>
 <p class="muted">${E(d.blurb)}</p><p class="muted small">For: ${E(d.who)}. ${d.beats.length} beats, ${fmt(d.total)} budget (limit ${fmt(LIMIT)}).${d.tenantWhy?" "+E(d.tenantWhy):""}</p>
 <ol class="sr-ol">${d.beats.map((b,k)=>`<li><button type="button" class="sr-lk" data-sr-start="${d.id}" data-sr-beat="${k}" title="Start at this beat">${E(b.point)}</button> <span class="sr-sc">${E(b.act)}</span>${b.kids&&b.kids.length?` <span class="sr-sc">+ optional view</span>`:""}</li>`).join("")}</ol>
 <div class="row"><button type="button" class="btn primary" data-sr-start="${d.id}">Start the tour</button><button type="button" class="btn quiet" data-sr-start="${d.id}" data-sr-mode="rehearse">Rehearse</button>${ST.leaveBehind?`<button type="button" class="btn quiet" data-sr-leave="${d.id}">Leave-behind</button>`:""}</div></article>`}
ST.demoCard=demoCard;
function render_(){const main=DEMOS.filter(d=>!d.group||d.group==="main");
 const story=`Guided tours over screens that already exist. Tours run on the fictional Meridian Standards Foundation unless a tenant brief says otherwise, and the bar says which. Nothing on a tour is a live connection, and every number carries a label.`;
 const extra=ST.home.map(f=>G(()=>f(),"")).join("");
 return `<div class="screen sr-home">${hero("Showroom","Showroom",story,`<div class="row"><label class="sr-chk"><input type="checkbox" id="srAud"> Start in audience mode (no talk track or timer)</label></div>`)}
 <div class="grid g2" style="align-items:start">${main.map(demoCard).join("")}</div>${extra}
 <div class="grid g2" style="align-items:start">
 <section class="sr-card glass"><h3>How labels work</h3><p class="muted small">A label sits on every beat that shows a number or a capability.</p><dl class="kv">${Object.keys(CLAIM).map(k=>`<dt>${chip(k)}</dt><dd>${E(CLAIM[k].d)}</dd>`).join("")}</dl></section>
 <section class="sr-card glass"><h3>Before you present</h3><ul class="sr-ul"><li>Starting a tour switches to the tenant the tour needs (Meridian unless it says otherwise) and the role it is told from, closes chat and notification panels and hides pop-up alerts. The bar names the tenant; exit restores your tenant and role.</li>
  <li>Keys: Right and Left arrows or Page Down and Page Up move between beats, R opens the beat list, T hides the talk track, A toggles audience mode, G opens a beat's optional view, Esc exits. On VibeCheck the arrows drive the click-through; Page Down still moves the tour.</li>
  <li>Modes: Presenter shows the talk track and timer; Audience hides both; Rehearse adds a timer per beat and keeps the times. Presenter window puts the talk track in a second window and turns this one into the audience view.</li>
  <li>Open any beat from the lists above to start mid-tour. A link such as <code>?showroom=coo&amp;beat=4</code> does the same; add <code>&amp;mode=audience</code> or <code>&amp;mode=rehearse</code>.</li>
  <li>The timer is a guide. A tour that runs past its budget turns amber, then red.</li></ul></section></div></div>`}
REG(SELF,"Showroom","platform","M3 5h18v12H3zM8 21h8M12 17v4M9 10l2 2 4-4",render_);

/* ---------- wiring ---------- */
try{if(W.NAVX&&NAVX.add)NAVX.add(SELF,{group:"plat",label:"Showroom",hint:"Showroom",sub:"Guided tours",kw:"showroom demo tour presenter guided walkthrough meeting COO maturity roadmap lens rehearse wedge reset"})}catch(e){}
const q=new URLSearchParams(location.search);
if(q.get("srwin"))st.remote=true;
setTimeout(()=>{const id=q.get("showroom"),pid=q.get("srpath");const m=q.get("mode");const mode=["audience","rehearse","presenter"].indexOf(m)>=0?m:"presenter";
 if(pid&&PATHS.find(p=>p.id===pid)){startPath(pid,{mode});return}
 if(id&&BY[id]){const b=Math.max(1,+q.get("beat")||1)-1;const k=q.get("kid")?Math.max(1,+q.get("kid"))-1:null;start(id,b,{mode,lens:q.get("lens")||null,remote:!!q.get("srwin"),kid:k})}},1200);
setTimeout(()=>{const bad=lint();if(bad.length&&W.console)console.warn("Showroom lint:",bad)},1500);
})();
