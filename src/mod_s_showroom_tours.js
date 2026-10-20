/* ===== mod_s_showroom_tours: more Showroom tours over existing screens (backlog DC-15, DC-16, DC-21 children, DC-30).
   DC-15  VibeCheck Executive cut (8 to 10 minutes), opening with the "Build the fix in VibeCheck" hand-off (DC-17)
   DC-16  tenant VibeCheck briefs: Healthcare referral and prior authorization, Mining permit to work, Storage drive swap, Meridian
   DC-21  the six guardrail children attached to the COO cut as optional child beats, one per act, and as a cut of their own
   DC-30  the full-story path (COO cut, then the guardrails cut: two cuts, each under the 1,200 second limit) and a printable
          leave-behind built from the beats and their claim chips
   Every beat opens a screen that already exists. Fictional sample data only. Prefix: srt-. ===== */
(function(){
const W=window,D=document;const SHOW=W.SHOW;if(!SHOW)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;

/* ---------- DC-17 beat support: the hand-off as a beat setup ---------- */
SHOW.setups.fix=()=>{const f=SHOW.lastFix&&SHOW.lastFix.t>SHOW.state.t0?SHOW.lastFix:null;
 const c=f||G(()=>SHOW.firstFixCard,null)||{kind:"build",ref:"",title:"the first build on the Build list"};
 G(()=>SHOW.buildFix({kind:c.kind,ref:c.ref,title:c.title}))};

/* ---------- DC-15: VibeCheck Executive cut ---------- */
SHOW.add({id:"vibe",title:"VibeCheck Executive cut",mins:10,who:"Executives who sponsor builders: CIO, COO, CAIO",persona:"exec",group:"main",
 blurb:"A gap on the Build list becomes a plain request; VibeCheck finds what exists, builds inside the guardrails, routes the approval and lands the build where IT and executives can see it. The interview is scripted.",
 beats:[
 {id:"v.1",act:"Gap",point:"A gap on the Build list becomes a plain request",secs:50,go:"ppl_jrny",tab:"Build list",
  say:["Every card on the Build list is a gap the journeys found, with the hours it would return.","The button on each card hands that gap to VibeCheck as a plain request."],
  do:"Point at Build the fix in VibeCheck on the first card.",claims:["modeled","hypothesis"]},
 {id:"v.2",act:"Ask",point:"The gap arrives in VibeCheck as a request",secs:60,go:"studio",setup:"fix",
  say:["VibeCheck reads the request, searches the library and starts the interview.","The interview is scripted in this prototype, so show it as a preview."],
  do:"Read the request it received.",claims:["simulated"]},
 {id:"v.3",act:"Find",point:"A worked example: it searches the library before building",secs:60,go:"studio",setup:"studio:scen:ret:find",
  say:["For damaged deliveries it finds a process that already exists and offers to extend it.","Reuse first is the rule, so nothing is built twice."],
  do:"Press Next in the click-through.",claims:["simulated","fact"]},
 {id:"v.4",act:"Process",point:"Every step is done by a human, robot or agent",secs:70,go:"studio",setup:"studio:scen:ret:flow",
  say:["The process takes shape as steps, each done by a person, a robot or an agent.","Click a step to change who does it; agents get a human sponsor."],
  do:"Click one step to change who does it.",claims:["simulated"]},
 {id:"v.5",act:"Data",point:"Data comes from its owners, not from copies",secs:50,go:"studio",setup:"studio:scen:ret:data",
  say:["It reads and writes the data model the enterprise already has, and asks the owners for anything new.","No connector is live in the prototype."],
  do:"Point at the reused data.",claims:["simulated"]},
 {id:"v.6",act:"Measure",point:"How you will know it works",secs:50,go:"studio",setup:"studio:scen:ret:metrics",
  say:["Each measure says what decision it supports and who owns it.","Targets are sample values until the team sets its own."],
  do:"Open one measure.",claims:["modeled"]},
 {id:"v.7",act:"Guardrails",point:"Guardrails come in the box, not afterwards",secs:60,go:"studio",setup:"studio:scen:ret:guard",
  say:["Access, continuity, testing and accessibility are added for you because the build needs them.","They are checked in the prototype; enforcement in a live system is a plan."],
  do:"Open the guardrails list.",claims:["simulated","fact"]},
 {id:"v.8",act:"Ship",point:"Approval routes to a group, then it ships",secs:50,go:"studio",setup:"studio:scen:ret:approve",
  say:["The approval path depends on risk: low-risk extensions need less, new data needs its owner.","Approvals always go to a group and the requester never approves their own."],
  do:"Point at who approves it.",claims:["simulated","fact"]},
 {id:"v.9",act:"Land",point:"Every build lands in one inventory IT can see",secs:60,go:"r18_builds",
  say:["Each build shows its owner, its guardrails and what still needs action.","Nothing is shadow IT because nothing is built outside this inventory."],
  do:"Open Need action.",claims:["fact","modeled"]},
 {id:"v.10",act:"Oversee",point:"Executives see value, cost and risk of every build",secs:60,go:"r18_lens",
  say:["The lens rolls every build into value, cost and risk for one executive.","The dollar figures are modeled from an editable rate and are illustrative."],
  do:"Switch between the CIO and COO lenses.",claims:["modeled"]}]});

/* ---------- DC-16: tenant VibeCheck briefs ---------- */
const brief=(t,o)=>({id:"brief-"+t,title:o.title,mins:6,who:o.who,tenant:t,persona:"exec",group:"brief",
 tenantWhy:"Journey maps, the Build list, the org chart and the tenant views follow this tenant; VibeCheck's library is the Meridian sample and is labeled.",
 blurb:o.blurb,beats:[
 {id:t+".1",act:"Journey",point:o.p1,secs:60,go:"ppl_jrny",tab:"Map",
  say:[o.s1,"Red boxes have no process behind them yet; every name is fictional."],do:"Filter to No process.",claims:["modeled"]},
 {id:t+".2",act:"Gap",point:"The Build list ranks what to build first, in waves",secs:60,go:"ppl_jrny",tab:"Build list",
  say:["Agents and robots for this tenant's journeys are ranked by hours returned and ease.","The waves are a hypothesis until this customer reviews them."],do:"Open wave 1.",claims:["modeled","hypothesis"]},
 {id:t+".3",act:"Team",point:"Where the proposed helpers would sit in the team",secs:60,go:"orgassist",
  say:["Dashed cards are proposed agents and robots placed under the team they would help.","None of them is running."],do:"Turn the proposal overlay on and off.",claims:["modeled","simulated"]},
 {id:t+".4",act:"Brief",point:o.p4,secs:90,go:"studio",setup:o.setup,
  say:[o.s4,"The interview is scripted and the library behind it is the Meridian sample, so show it as a preview."],do:"Press Next in the click-through.",claims:["simulated"]},
 {id:t+".5",act:"Measure",point:"The tenant's own objectives and measures",secs:60,go:"tn_metrics",
  say:["Objectives and measures come from this tenant's own data pack, not from Meridian.","Values are sample data, so present them as modeled."],do:"Open one objective.",claims:["modeled"]}]});
[["health",{title:"Healthcare brief: referral and prior authorization",who:"Health system operations and IT leaders",
  blurb:"A specialist referral from intake to a booked visit, with prior authorization checked first. Runs on the fictional Healthcare tenant.",
  p1:"The referral journey as patients and coordinators see it",s1:"Each box is a step a patient, a referral coordinator or a clinician goes through, tied to the process behind it.",
  p4:"Say the referral and prior authorization brief in plain words",s4:"The brief is typed as a plain request: route a specialist referral and check prior authorization before the visit is booked.",
  setup:"studio:ask:Route a new specialist referral and check prior authorization before the visit is booked."}],
 ["mining",{title:"Mining brief: permit to work",who:"Site operations, safety and IT leaders",
  blurb:"A permit to work for a confined space entry, with isolation checked before work starts. Runs on the fictional Mining tenant.",
  p1:"The permit to work journey as crews and supervisors see it",s1:"Each box is a step a crew member, a supervisor or a safety officer goes through, tied to the process behind it.",
  p4:"Say the permit to work brief in plain words",s4:"The brief is typed as a plain request: issue a permit to work for a confined space entry with isolation checked first.",
  setup:"studio:ask:Issue a permit to work for a confined space entry, with isolation checked before work starts."}],
 ["storage",{title:"Storage brief: failed drive swap",who:"Support, logistics and IT leaders at a storage company",
  blurb:"A customer's failed drive swapped within a day, the replacement shipped before the old drive comes back. Runs on the fictional Storage and backup tenant.",
  p1:"The customer support journey as customers and engineers see it",s1:"Each box is a step a customer, a support engineer or the warehouse goes through, tied to the process behind it.",
  p4:"Say the failed drive swap brief in plain words",s4:"The brief is typed as a plain request: approve a failed drive swap within one day and ship the replacement first.",
  setup:"studio:ask:Approve a customer's failed drive swap within one day and ship the replacement first."}],
 ["core",{title:"Meridian brief: damaged deliveries",who:"Operations leaders at the Meridian sample",
  blurb:"Printed standards arriving damaged: VibeCheck finds the process that exists and extends it. Runs on the fictional Meridian Standards Foundation.",
  p1:"The member journey as members and staff see it",s1:"Each box is a step a member or a staff member goes through, tied to the process behind it.",
  p4:"Damaged deliveries: extend the process that already exists",s4:"The brief is the scripted example: printed standards keep arriving damaged, and VibeCheck extends the existing process.",
  setup:"studio:scen:ret:find"}]].forEach(([t,o])=>SHOW.add(brief(t,o)));

/* DC-16 home: the tenant briefs */
SHOW.home.push(()=>{const briefs=SHOW.demos.filter(d=>d.group==="brief");if(!briefs.length)return"";
 return `<section class="sr-card glass srt" aria-label="Tenant briefs"><div class="sr-ch"><h3>Tenant VibeCheck briefs</h3><span class="sr-pill">About 6 min each</span></div>
 <p class="muted small">The same story on each sample tenant. Journey maps, the Build list, the org chart and the tenant views follow the tenant; VibeCheck's library is the Meridian sample and the bar says so.</p>
 <div class="srt-grid">${briefs.map(d=>`<article class="srt-c"><b>${E(d.title)}</b><p class="small muted">${E(d.blurb)}</p><div class="row"><button type="button" class="btn sm" data-sr-start="${E(d.id)}">Start</button>${SHOW.leaveBehind?`<button type="button" class="btn quiet sm" data-sr-leave="${E(d.id)}">Leave-behind</button>`:""}</div></article>`).join("")}</div></section>`});

/* ---------- DC-21: guardrail children as optional child beats, and as their own cut ---------- */
const kids=G(()=>GUARD.children(),[])||[];
const kidBeat=c=>({id:"g."+c.id,act:c.act,title:c.title,point:c.point,secs:c.secs,go:"guard",arg:c.id,say:c.say.slice(),do:c.do,claims:c.claims.slice()});
const coo=SHOW.byId("coo");
if(coo&&kids.length){const actBeat={};coo.beats.forEach(b=>{if(!actBeat[b.act])actBeat[b.act]=b});
 /* Deliver's child is about agents, so it sits on the agents beat */
 const at=c=>c.act==="Deliver"?coo.beats.find(b=>b.id==="deliver.3"):actBeat[c.act];
 kids.forEach(c=>{const b=at(c);if(b){b.kids=b.kids||[];if(!b.kids.some(k=>k.id==="g."+c.id))b.kids.push(kidBeat(c))}})}
if(kids.length)SHOW.add({id:"guardrails",title:"Guardrails, one act at a time",mins:Math.round(kids.reduce((a,c)=>a+c.secs,0)/60),who:"CIO, CISO, CAIO and audit audiences",persona:"exec",group:"part",
 blurb:"The six guided guardrail views in the order of the COO cut's acts. Each runs the real prototype check where one exists and says what is simulated.",
 beats:["tenant","demand","fund","track","deliver","build"].map(id=>kids.find(c=>c.id===id)).filter(Boolean).map(kidBeat)});

/* ---------- DC-30: full-story path ----------
   A cut never runs past 1,200 seconds (SHOW.lint). The 25 to 30 minute story is therefore a path of two cuts played in
   order: the COO cut, then the guardrails cut. */
if(SHOW.byId("guardrails"))SHOW.paths.push({id:"full",title:"Full story",parts:["coo","guardrails"],who:"A first meeting with a COO and their CIO",
 blurb:"The COO thin thread, then the guardrail behind each act. Two cuts, each under the limit, played as one path."});

/* ---------- DC-30: leave-behind ---------- */
const scrName=id=>G(()=>NAVX.label(id),null)||G(()=>SCREENS.find(s=>s[0]===id)[1],id);
function leaveBehindHTML(id){const path=String(id).indexOf("path:")===0?SHOW.paths.find(p=>p.id===String(id).slice(5)):null;
 const tours=path?path.parts.map(SHOW.byId).filter(Boolean):[SHOW.byId(id)].filter(Boolean);if(!tours.length)return"";
 const C=SHOW.CLAIM,name=G(()=>BRAND.name,"")||"the platform";const title=path?path.title:tours[0].title;
 const tot=tours.reduce((a,d)=>a+d.total,0);let n=0;const sim=[];
 const beat=(b,opt)=>{n++;if(b.claims.indexOf("simulated")>=0)sim.push(b.point);
  return `<li class="${opt?"opt":""}"><div class="h"><span class="n">${opt?"Optional":n}</span><b>${E(b.point)}</b><span class="act">${E(b.act)} · ${E(scrName(b.go))}</span></div>
  <p>${E(b.say[0])} ${E(b.say[1])}</p><p class="cl">${b.claims.map(k=>`<span>${E(C[k].l)}</span>`).join("")}</p></li>`};
 const body=tours.map(d=>`<section><h2>${E(d.title)}</h2><p class="muted">${E(d.blurb)} About ${Math.round(d.total/60)} minutes.</p><ol>${d.beats.map(b=>beat(b)+(b.kids||[]).map(k=>beat(k,true)).join("")).join("")}</ol></section>`).join("");
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(title)}: leave-behind</title>
<style>body{font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;margin:32px auto;max-width:760px;padding:0 16px;color:CanvasText;background:Canvas}h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:28px 0 4px}
ol{list-style:none;padding:0;margin:12px 0}li{border-top:1px solid GrayText;padding:10px 0;break-inside:avoid}li.opt{padding-left:24px}.h{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.n{font-weight:700;min-width:22px}.act{color:GrayText;font-size:13px}
p{margin:4px 0}.muted{color:GrayText}.cl span{display:inline-block;border:1px solid GrayText;border-radius:99px;padding:0 8px;margin:2px 6px 0 0;font-size:12px}dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px}dt{font-weight:700}
footer{margin-top:28px;border-top:1px solid GrayText;padding-top:10px;font-size:13px;color:GrayText}@media print{body{margin:0 auto}}</style></head><body>
<h1>${E(title)}</h1><p class="muted">A walkthrough of the ${E(name)} prototype. ${tours.length>1?tours.length+" parts, ":""}about ${Math.round(tot/60)} minutes. Every organization, person and figure is fictional sample data (Meridian Standards Foundation and the sample tenants).</p>
${body}<h2>How to read the labels</h2><dl>${Object.keys(C).map(k=>`<dt>${E(C[k].l)}</dt><dd>${E(C[k].d)}</dd>`).join("")}</dl>
${sim.length?`<h2>What is simulated</h2><p>Scripted in the prototype, with no live connection, run or enforcement: ${sim.map(E).join("; ")}.</p>`:""}
<footer>Prototype walkthrough. ${E(name)} is a working name. Nothing here is a certification claim or a price; security and isolation are plans.</footer></body></html>`}
function leaveBehind(id,o){o=o||{};const html=leaveBehindHTML(id);if(!html)return null;const w=G(()=>W.open("","_blank"),null);
 if(!w){G(()=>toast("The browser blocked the leave-behind window. Allow pop-ups for this page.","warn"));return null}
 w.document.open();w.document.write(html);w.document.close();if(o.print!==false)setTimeout(()=>G(()=>w.print()),400);return w}
Object.assign(SHOW,{leaveBehind,leaveBehindHTML});
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-sr-leave]");if(t)leaveBehind(t.dataset.srLeave)});

/* ---------- DC-30 home: the full-story path and the last rehearsal ---------- */
SHOW.home.push(()=>{const p=SHOW.paths.find(x=>x.id==="full");const fmt=SHOW.fmt;
 const parts=p?p.parts.map(SHOW.byId).filter(Boolean):[];const tot=parts.reduce((a,d)=>a+d.total,0);
 return `${p?`<section class="sr-card glass srt" aria-label="Full story"><div class="sr-ch"><h3>${E(p.title)}</h3><span class="sr-pill">About ${Math.round(tot/60)} min</span><span class="sr-pill">${parts.length} cuts</span></div>
 <p class="muted">${E(p.blurb)} Each cut stays under the ${fmt(SHOW.LIMIT)} limit; the path plays them in order and the bar says which part you are in.</p>
 <ol class="sr-ol">${parts.map(d=>`<li><b>${E(d.title)}</b> <span class="sr-sc">${d.beats.length} beats, ${fmt(d.total)}</span></li>`).join("")}</ol>
 <div class="row"><button type="button" class="btn primary" data-sr-path="full">Start the full story</button><button type="button" class="btn quiet" data-sr-leave="path:full">Leave-behind</button></div></section>`:""}
 ${(()=>{const r=G(()=>SHOW.lastRehearsal||U.store.get("showroom.rehearsal",null),null);if(!r||!r.rows)return"";
  return `<section class="sr-card glass srt" aria-label="Last rehearsal"><div class="sr-ch"><h3>Last rehearsal: ${E(r.title)}</h3><span class="sr-pill">${fmt(r.actual)} of ${fmt(r.budget)}</span></div>
  <div class="tscroll"><table class="tbl"><thead><tr><th>Beat</th><th class="num">Budget</th><th class="num">Took</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${E(x.point)}</td><td class="num">${fmt(x.secs)}</td><td class="num${x.actual>x.secs?" srt-over":""}">${fmt(x.actual)}</td></tr>`).join("")}</tbody></table></div></section>`})()}`});
})();
