/* ===== mod_s_exp_story: the leave-behind of an experience (backlog DC-40). EXP.story(session?) returns a printable one-page
   story of the session: what the buyer did, what moved (the ripple trails), the claims they saw, and what it would mean at their
   company. Labeled simulated; ripples are modeled. EXP.openStory() shows it as a sheet with Print and Close (top right).
   Reads the running session, or the last one saved in U.store "exp.sessions" (this browser only). Prefix: exp-. ===== */
(function(){
const W=window,D=document;const X=W.EXP;if(!X)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;const arr=x=>Array.isArray(x)?x:[];
function session(){const c=X.current();if(c)return{mission:c.m.id,title:c.m.title,role:c.role,tenant:c.ranOn,company:c.company,mode:c.mode,
  secs:Math.round(((c.endT||Date.now())-c.t0)/1000),finished:!!c.success,checkpoints:c.m.checkpoints.filter(x=>c.done[x.id]).map(x=>({id:x.id,t:x.t,at:c.done[x.id].at,skipped:c.done[x.id].skipped})),
  stuck:Object.keys(c.stuckN||{}),ripples:c.ripples,claims:c.claims,debrief:c.debrief||G(()=>c.m.debrief(c.ctx),null)};
 return X._last||arr(X.sessions())[0]||null}
const V=(v,n)=>v==null?"":n.fmt==="money"?(G(()=>U.moneyShort(v),null)||"$"+Math.round(v)):(Math.round(v*10)/10)+(n.unit==="pts"?" pts":n.unit&&n.unit!=="$"?(/^%/.test(n.unit)?n.unit:" "+n.unit):"");
function story(s){s=s||session();if(!s)return `<article class="exp-story"><p>No experience has run in this browser yet.</p></article>`;
 const m=X.byId(s.mission)||{},role=(X.roles().find(r=>r.id===s.role)||{n:s.role}).n,co=X.tName(s.company||s.tenant),ran=X.tName(s.tenant);
 const db=s.debrief||{};
 return `<article class="exp-story" aria-label="Leave-behind">
 <header><span class="exp-eye">${E(BRAND.name)} experience &middot; ${E(G(()=>U.fmtDate(U.todayDate()),""))}</span><h2>${E(s.title||m.title||"Experience")}</h2>
 <p>${E(role)} at ${E(co)}${ran!==co?`, played on the ${E(ran)} sample`:""}. ${s.finished?"Finished":"Stopped"} in ${E(X.fmt(s.secs||0))} of ${E(X.fmt(m.clock||X.MAXCLOCK))}, ${s.mode==="self"?"self-serve":"with a presenter"}.</p>
 <p class="exp-note">${X.chip("simulated")} The situation was seeded in a database-free prototype; ripples are modeled; no number here was measured in a real organization.</p></header>
 <section><h3>The job</h3><p>${E(m.brief||"")}</p></section>
 <section><h3>What you did</h3><ol>${arr(s.checkpoints).map(c=>`<li>${E(c.t)} <span class="muted">at ${E(X.fmt(c.at||0))}${c.skipped?", skipped":""}</span></li>`).join("")||"<li>Nothing yet.</li>"}</ol></section>
 <section><h3>What moved</h3>${arr(s.ripples).map(r=>`<p><b>${E(r.cause)}</b></p><ul>${arr(r.nodes).map(n=>`<li>${E(n.label)}${n.before!=null||n.after!=null?`: ${E(V(n.before,n))} to ${E(V(n.after,n))}`:""}${n.note?` <span class="muted">(${E(n.note)})</span>`:""}</li>`).join("")}</ul><p class="small muted">${X.chip("modeled")} ${E(r.rule||"")}</p>`).join("")||"<p>No decision landed in this session.</p>"}</section>
 <section><h3>What you saw for yourself</h3><ul>${arr(s.claims).map(c=>`<li>${X.chip(c.k)} ${E(c.t)}</li>`).join("")||"<li>None yet.</li>"}</ul></section>
 <section><h3>What it would mean at ${E(co)}</h3><p>${E(db.what||"")}</p><p>${E(db.mean||"")}</p></section>
 ${arr(s.stuck).length?`<section><h3>Where it slowed down</h3><p class="small">${arr(s.stuck).map(id=>E((arr(m.checkpoints).find(c=>c.id===id)||{t:id}).t)).join("; ")}</p></section>`:""}
 <footer class="small muted">Fictional sample data. No price points, no certification claims. Kept in this browser only.</footer></article>`}
function openStory(){let h=D.getElementById("expStory");if(!h){h=D.createElement("div");h.id="expStory";h.className="exp-sheet";h.setAttribute("role","dialog");h.setAttribute("aria-modal","true");h.setAttribute("aria-label","Leave-behind");D.body.appendChild(h)}
 h.innerHTML=`<div class="exp-sheet-bar"><button type="button" class="btn primary" data-exp-story="print">Print</button><button type="button" class="btn quiet exp-x" data-exp-story="close" aria-label="Close the leave-behind">&times;</button></div>${story()}`;h.hidden=false;
 G(()=>audit("Experience leave-behind opened",(session()||{}).mission||""));return h}
ROUTER.on("click","[data-exp-story]",(e,t)=>{const a=t.dataset.expStory,h=D.getElementById("expStory");if(a==="close"){if(h){h.hidden=true;h.innerHTML=""}}
 else if(a==="print"){D.body.classList.add("exp-print");G(()=>W.print());setTimeout(()=>D.body.classList.remove("exp-print"),500)}},{id:"exp-story"});
Object.assign(X,{story,openStory,session});
})();
