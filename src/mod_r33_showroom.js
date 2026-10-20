/* ===== mod_r33_showroom: the Showroom (backlog DC-05 thin, DC-08, DC-35, DC-10 thin, DC-32 thin).
   A presenter bar, talk track, timekeeper and claim chips laid over screens that already exist. It builds no new business
   screens: a beat opens an existing screen (and optionally one of its tabs) and says what is on it.
   Tours are data (SHOW.demos). Fictional Meridian Standards Foundation sample data only. Every number is labeled
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
   beat: id, act, point (12 words or fewer), secs, go (screen id), tab (button text on that screen), say (exactly two sentences),
   do (one interaction), claims (chips). */
const DEMOS=[
{id:"coo",title:"COO thin thread",mins:15,who:"COO and operations leaders",
 blurb:"From the CEO's objectives to the dollar, the work, the agents and the next build. Ten existing screens on the fictional Meridian sample.",
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
 {id:"fund.1",act:"Fund",point:"Follow the dollar to the goal",secs:100,go:"bst",tab:"Trace detail",
  say:["Spend rolls up from the cost center to the goal it serves, so every dollar has a reason.","Money that serves no goal is flagged as orphan spend."],
  do:"Open the orphan spend line.",claims:["modeled"]},
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
 {id:"build.1",act:"Build",point:"Build the next one from a plain request",secs:100,go:"studio",
  say:["You describe the job in plain words and the studio builds it inside the guardrails.","The interview is scripted in this prototype, so show it as a preview."],
  do:"Press Start the click-through demo.",claims:["simulated"]}]},
{id:"maturity",title:"Process maturity and roadmap",mins:8,who:"COO, CIO and PMO audiences",draft:true,
 blurb:"Pick a process, see its maturity against target, the measure behind the score, the roadmap and what to build first. Draft: not yet checked for every process.",
 beats:[
 {id:"m.1",act:"Pick",point:"Pick any process and find it by number",secs:60,go:"ppl_jrny",tab:"Processes",
  say:["Every process has a stable number such as P-014 and a link you can share.","Press Ctrl K and type a number to jump straight to it."],
  do:"Click one process row.",claims:["fact"]},
 {id:"m.2",act:"Level",point:"Maturity today against target",secs:80,go:"exe_mat",
  say:["Each capability is scored on one shared scale, today against the target.","These levels are sample values and self-assessed, so present them as a conversation starter."],
  do:"Open the Models and levels tab.",claims:["modeled"]},
 {id:"m.3",act:"Evidence",point:"Why that level: a defined measure",secs:60,go:"metrics",
  say:["Every measure has an owner, a formula and a baseline.","Open a formula chip to see exactly how the number is built."],
  do:"Open one formula chip.",claims:["modeled"]},
 {id:"m.4",act:"Roadmap",point:"Each build's path to a higher level",secs:80,go:"r18_mature",tab:"Maturity roadmaps",
  say:["Every build shows its level, its target and the next step to move up.","The roadmap lists what is below target and what is already at the next tier."],
  do:"Select one build to see its full roadmap.",claims:["modeled"]},
 {id:"m.5",act:"Fix first",point:"What to fix first, in waves",secs:80,go:"ppl_jrny",tab:"Build list",
  say:["The Build list orders agents and robots into waves, easy and valuable first.","The wave logic is a hypothesis until a buyer reviews it."],
  do:"Open wave 1.",claims:["modeled","hypothesis"]},
 {id:"m.6",act:"Build",point:"Build the fix from a plain request",secs:80,go:"studio",
  say:["A gap becomes a plain-language request in the studio.","The interview is scripted here, so show it as a preview."],
  do:"Press Start the click-through demo.",claims:["simulated"]}]}];
const BY={};DEMOS.forEach(d=>{BY[d.id]=d;d.total=d.beats.reduce((a,b)=>a+b.secs,0)});

/* ---------- lint: beats and budgets must pass before anything ships ---------- */
function lint(){const bad=[];
 DEMOS.forEach(d=>{if(d.total>LIMIT)bad.push(d.id+": cut is "+d.total+" seconds, over "+LIMIT);
  d.beats.forEach(b=>{const t=d.id+"/"+b.id;
   if(!b.point||b.point.split(/\s+/).length>12)bad.push(t+": point missing or over 12 words");
   if(!(b.secs>0))bad.push(t+": secs missing");
   if(!b.say||b.say.length!==2)bad.push(t+": talk track must be exactly two sentences");
   if(!b.claims||!b.claims.length||b.claims.some(c=>!CLAIM[c]))bad.push(t+": claim chip missing or unknown");
   if(!b.do)bad.push(t+": no interaction");
   if(!G(()=>SCREENS.some(s=>s[0]===b.go),true))bad.push(t+": screen "+b.go+" is not registered");
   [b.point,...(b.say||[]),b.do].forEach(x=>{if(/—/.test(x||""))bad.push(t+": em dash in text")})})});
 return bad}

/* ---------- state ---------- */
const ST=W.SHOW={demos:DEMOS,lint,state:{demo:null,i:0,aud:false,talk:true,t0:0,tick:0},CLAIM,LIMIT};
const st=ST.state;
const fmt=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const chip=k=>`<span class="sr-chip sr-${k}" title="${E(CLAIM[k].d)}">${E(CLAIM[k].l)}</span>`;

/* ---------- quiet the app while presenting ---------- */
function quiet(){G(()=>CHATX.close());G(()=>INBOX.closePanel());G(()=>INBOX.closeFocus());G(()=>{D.querySelectorAll("dialog[open]").forEach(x=>x.close())});G(()=>closeDrawer())}
function clickTab(txt){if(!txt)return false;const want=txt.toLowerCase();
 const bs=[...D.querySelectorAll(".screen .views button, .screen [role=tab]")];
 const b=bs.find(x=>x.textContent.trim().toLowerCase()===want)||bs.find(x=>x.textContent.trim().toLowerCase().startsWith(want));
 if(b){b.click();try{const a=D.activeElement;if(a&&a!==D.body&&a.blur)a.blur()}catch(e){}return true}return false}

/* ---------- bar and talk track ---------- */
function host(){let h=D.getElementById("srBar");if(!h){h=D.createElement("div");h.id="srBar";h.setAttribute("role","region");h.setAttribute("aria-label","Showroom presenter controls");D.body.appendChild(h)}return h}
function barHTML(){const d=BY[st.demo];if(!d)return"";const b=d.beats[st.i],n=d.beats.length,el=(Date.now()-st.t0)/1000,pc=Math.min(100,el/d.total*100);
 const cls=el>d.total?"over":el>d.total*.8?"warn":"";
 const talk=(!st.aud&&st.talk)?`<div class="sr-talk" id="srTalk" aria-live="polite"><div class="sr-tk-h"><span class="sr-act">${E(b.act)}</span><span class="sr-tk-n">Beat ${st.i+1} of ${n}</span></div>
  <p class="sr-say">${E(b.say[0])} ${E(b.say[1])}</p><p class="sr-do"><b>Do:</b> ${E(b.do)}</p><div class="sr-chips">${b.claims.map(chip).join("")}</div>
  <p class="sr-key">Keys: Right and Left arrows move, T hides this, A audience mode, Esc exits.</p></div>`:"";
 return `${talk}<div class="sr-bar glass${st.aud?" aud":""}">
  <div class="sr-r1"><span class="sr-demo">${E(d.title)}</span><span class="sr-pt" id="srPt">${E(b.point)}</span>${st.aud?"":`<span class="sr-t ${cls}" title="Elapsed against the ${fmt(d.total)} budget"><i style="width:${pc.toFixed(0)}%"></i><b>${fmt(el)} of ${fmt(d.total)}</b></span>`}
   <button type="button" class="btn quiet sr-x" data-sr="exit" aria-label="Exit the Showroom tour" title="Exit (Esc)">&times;</button></div>
  <div class="sr-r2"><button type="button" class="btn" data-sr="back"${st.i?"":" disabled"}>Back</button>
   <span class="sr-dots" role="list">${d.beats.map((x,k)=>`<button type="button" role="listitem" class="sr-dot${k===st.i?" on":k<st.i?" done":""}" data-sr="jump" data-i="${k}" aria-label="Beat ${k+1}: ${E(x.point)}" aria-current="${k===st.i?"step":"false"}"></button>`).join("")}</span>
   ${st.aud?"":`<button type="button" class="btn quiet" data-sr="talk" aria-pressed="${st.talk}">Talk track</button>`}
   <button type="button" class="btn quiet" data-sr="aud" aria-pressed="${st.aud}">Audience</button>
   <button type="button" class="btn primary" data-sr="next">${st.i>=n-1?"Finish":"Next"}</button></div></div>`}
function paint(){const h=host();h.innerHTML=barHTML();D.body.classList.toggle("sr-aud",!!st.aud)}

/* ---------- navigation ---------- */
function open(i,quietly){const d=BY[st.demo];if(!d)return;st.i=Math.max(0,Math.min(d.beats.length-1,i));const b=d.beats[st.i];
 quiet();
 G(()=>go(b.go));
 setTimeout(()=>{if(b.tab)clickTab(b.tab);quiet();const v=D.getElementById("view");if(v)v.scrollTop=0;try{W.scrollTo(0,0)}catch(e){}},360);
 setTimeout(()=>G(()=>CHATX.close()),1100);
 G(()=>{const u=new URL(location.href);u.searchParams.set("showroom",st.demo);u.searchParams.set("beat",String(st.i+1));history.replaceState(null,"",u)});
 paint();
 setTimeout(()=>{const p=D.getElementById("srPt");if(p&&!quietly){}},0)}
function start(id,beat,opts){if(!BY[id])return false;
 if(G(()=>SCN.cur,"core")!=="core")G(()=>SCN.set("core"));
 st.demo=id;st.aud=!!(opts&&opts.aud);st.talk=true;st.t0=Date.now();
 D.body.classList.add("sr-on");clearInterval(st.tick);st.tick=setInterval(()=>{const t=D.querySelector(".sr-t");const d=BY[st.demo];if(!t||!d)return;const el=(Date.now()-st.t0)/1000;t.className="sr-t "+(el>d.total?"over":el>d.total*.8?"warn":"");t.querySelector("i").style.width=Math.min(100,el/d.total*100).toFixed(0)+"%";t.querySelector("b").textContent=fmt(el)+" of "+fmt(d.total)},1000);
 open(beat||0);return true}
function exit(){clearInterval(st.tick);st.demo=null;D.body.classList.remove("sr-on","sr-aud");const h=D.getElementById("srBar");if(h)h.innerHTML="";
 G(()=>{const u=new URL(location.href);u.searchParams.delete("showroom");u.searchParams.delete("beat");history.replaceState(null,"",u)});
 G(()=>go(SELF))}
ST.start=start;ST.exit=exit;ST.jump=i=>open(i);
ST.next=()=>{const d=BY[st.demo];if(!d)return;if(st.i>=d.beats.length-1){exit();G(()=>toast("Tour finished in "+fmt((Date.now()-st.t0)/1000)+" of "+fmt(d.total),"good"));return}open(st.i+1)};
ST.back=()=>{if(st.demo&&st.i>0)open(st.i-1)};

D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-sr],[data-sr-start]");if(!t)return;
 if(t.dataset.srStart){const aud=!!(D.getElementById("srAud")&&D.getElementById("srAud").checked);start(t.dataset.srStart,+t.dataset.srBeat||0,{aud});return}
 const a=t.dataset.sr;
 if(a==="next")ST.next();else if(a==="back")ST.back();else if(a==="exit")exit();
 else if(a==="jump")open(+t.dataset.i);
 else if(a==="talk"){st.talk=!st.talk;paint()}
 else if(a==="aud"){st.aud=!st.aud;paint()}});
D.addEventListener("keydown",e=>{if(!st.demo)return;const t=e.target;if(t&&t.matches&&t.matches("input:not([type=radio]):not([type=checkbox]):not([type=button]),textarea,select,[contenteditable=true]"))return;if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==="ArrowRight"){e.preventDefault();ST.next()}
 else if(e.key==="ArrowLeft"){e.preventDefault();ST.back()}
 else if(e.key==="Escape"){exit()}
 else if(e.key==="t"||e.key==="T"){st.talk=!st.talk;paint()}
 else if(e.key==="a"||e.key==="A"){st.aud=!st.aud;paint()}});

/* ---------- the Showroom home screen ---------- */
function demoCard(d){return `<article class="sr-card glass"><div class="sr-ch"><h3>${E(d.title)}</h3><span class="sr-pill">About ${d.mins} min</span>${d.draft?`<span class="sr-pill sr-draft" title="The beats exist but have not been checked for every process (backlog DC-33).">Draft</span>`:""}</div>
 <p class="muted">${E(d.blurb)}</p><p class="muted small">For: ${E(d.who)}. ${d.beats.length} beats, ${fmt(d.total)} budget (limit ${fmt(LIMIT)}).</p>
 <ol class="sr-ol">${d.beats.map((b,k)=>`<li><button type="button" class="sr-lk" data-sr-start="${d.id}" data-sr-beat="${k}" title="Start at this beat">${E(b.point)}</button> <span class="sr-sc">${E(b.act)}</span></li>`).join("")}</ol>
 <div class="row"><button type="button" class="btn primary" data-sr-start="${d.id}">Start the tour</button></div></article>`}
function render_(){
 const story=`Two short guided tours over screens that already exist. Everything uses the fictional Meridian Standards Foundation. Nothing on a tour is a live connection, and every number carries a label.`;
 return `<div class="screen sr-home">${hero("Showroom","Showroom",story,`<div class="row"><label class="sr-chk"><input type="checkbox" id="srAud"> Start in audience mode (no talk track or timer)</label></div>`)}
 <div class="grid g2" style="align-items:start">${DEMOS.map(demoCard).join("")}</div>
 <div class="grid g2" style="align-items:start">
 <section class="sr-card glass"><h3>How labels work</h3><p class="muted small">A label sits on every beat that shows a number or a capability.</p><dl class="kv">${Object.keys(CLAIM).map(k=>`<dt>${chip(k)}</dt><dd>${E(CLAIM[k].d)}</dd>`).join("")}</dl></section>
 <section class="sr-card glass"><h3>Before you present</h3><ul class="sr-ul"><li>Starting a tour switches the demo scenario to Meridian, closes chat and notification panels and hides pop-up alerts until you exit.</li>
  <li>Keys: Right and Left arrows move between beats, T hides the talk track, A toggles audience mode, Esc exits.</li>
  <li>Open any beat from the lists above to start mid-tour. A link such as <code>?showroom=coo&amp;beat=4</code> does the same.</li>
  <li>The timer is a guide. A tour that runs past its budget turns amber, then red.</li></ul></section></div></div>`}
REG(SELF,"Showroom","platform","M3 5h18v12H3zM8 21h8M12 17v4M9 10l2 2 4-4",render_);

/* ---------- wiring ---------- */
try{if(W.NAVX&&NAVX.add)NAVX.add(SELF,{group:"plat",label:"Showroom",hint:"Showroom",sub:"Guided tours",kw:"showroom demo tour presenter guided walkthrough meeting COO maturity roadmap"})}catch(e){}
const q=new URLSearchParams(location.search);
if(q.get("showroom")&&BY[q.get("showroom")]){const b=Math.max(1,+q.get("beat")||1)-1;setTimeout(()=>start(q.get("showroom"),b,{aud:q.get("mode")==="audience"}),1200)}
const bad=lint();if(bad.length&&W.console)console.warn("Showroom lint:",bad);
})();
