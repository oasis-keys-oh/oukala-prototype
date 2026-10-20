/* ===== mod_s_showroom: shared Showroom actions (backlog DC-17, PR-18, PR-19).
   SHOW.buildFix(ctx)   "Build the fix in VibeCheck": opens the studio with the gap as a plain request (DC-17)
   SHOW.wedge           wedge mode: only the wedge screens (the COO cut) in the menu and search; the rest is hidden, never deleted (PR-18)
   SHOW.reset(o)        demo reset and role preset: clears the browser storage the app uses, resets the demo state, sets
                        tenant Meridian and the tour's role, and reloads clean (PR-19)
   Fictional sample data only. Prefix: srs-. ===== */
(function(){
const W=window,D=document;const SHOW=W.SHOW;if(!SHOW)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- DC-17: build the fix in VibeCheck ----------
   One action for every place a gap shows: a red Journey box (no process), a Build list card, an Agent Action gap and an
   orphan on the money thread. Any module can offer it with data-sr-fix="kind|ref|title" on a button; the Showroom adds the
   button to Build list cards and red Journey boxes itself until those modules carry the attribute. */
const FIX={
 journey:c=>"Build the process for the step \""+c.title+"\""+(c.ref?" ("+c.ref+")":"")+": nothing runs this journey step today, so give it an owner, the steps and who does each one.",
 build:c=>"Build "+c.title+(c.ref?" ("+c.ref+" on the Build list)":"")+" with its steps, data, measures and guardrails.",
 gap:c=>"Close the gap \""+c.title+"\""+(c.ref?" ("+c.ref+", from Agent Action)":"")+": propose the process, who does each step and how we will know it works.",
 orphan:c=>"Tie the orphan spend \""+c.title+"\""+(c.ref?" ("+c.ref+")":"")+" to a goal, or propose how to stop it, with an owner and a measure."};
function buildFix(ctx){ctx=ctx||{};const k=FIX[ctx.kind]?ctx.kind:"build";const text=FIX[k]({ref:ctx.ref||"",title:String(ctx.title||"this gap").replace(/\s+/g," ").trim().slice(0,120)});
 G(()=>{if(W.STUDIO){STUDIO.sc=null;STUDIO.view="home";STUDIO.lastScen=null}});
 SHOW.lastFix={kind:k,ref:ctx.ref||"",title:ctx.title||"",text,from:G(()=>S.screen,""),t:Date.now()};
 G(()=>audit("Build the fix in VibeCheck",text));
 if(W.STUDIO&&STUDIO.open)STUDIO.open(text);else G(()=>go("studio"));
 return text}
SHOW.buildFix=buildFix;
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-sr-fix]");if(!t)return;e.preventDefault();e.stopPropagation();
 const [kind,ref,title]=String(t.dataset.srFix).split("|");buildFix({kind,ref,title})},true);
const fixBtn=(kind,ref,title)=>{const b=D.createElement("button");b.type="button";b.className="btn sm srs-fix";b.dataset.srFix=[kind,ref,title].map(x=>String(x||"").replace(/\|/g,"/")).join("|");
 b.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg><span>Build the fix in VibeCheck</span>';
 b.setAttribute("aria-label","Build the fix in VibeCheck: "+title);return b};
function decorate(){const v=D.getElementById("view");if(!v)return;
 v.querySelectorAll(".jb-card:not([data-srs-fix])").forEach(c=>{c.dataset.srsFix="1";const chip=c.querySelector(".num-chip");const ref=chip?chip.textContent.trim():"";
  const t=c.querySelector(".jb-t b");const title=t?t.textContent.replace(ref,"").trim():"this build";c.appendChild(fixBtn("build",ref,title));
  if(c===v.querySelector(".jb-card"))SHOW.firstFixCard={kind:"build",ref,title}});
 v.querySelectorAll("div.noproc:not([data-srs-fix])").forEach(c=>{c.dataset.srsFix="1";const ref=(c.dataset.jb||"").split("|").join(" ");
  const t=c.querySelector("b,strong,.jb-n,.t");const title=(t?t.textContent:c.textContent).trim().split("\n")[0].slice(0,90);c.appendChild(fixBtn("journey",ref,title))})}
let decoT=0;const deco=()=>{if(decoT)return;decoT=requestAnimationFrame(()=>{decoT=0;if(G(()=>S.screen,"")==="ppl_jrny")decorate()})};
G(()=>HOOKS.on("afterRender",s=>{if(s==="ppl_jrny")deco()},{id:"srs-fix"}));
G(()=>{const v=D.getElementById("view");if(v)new MutationObserver(deco).observe(v,{childList:true,subtree:true})});

/* ---------- PR-18: wedge mode ----------
   The wedge screens are the COO cut's screens (decision 2026-10-19: the COO direction is the wedge), plus Home and the Showroom.
   On: the menu and search show only those; every other screen is hidden, never deleted, and still opens from a link. */
const WKEY="falconaire.wedge";
let WS=null;const wedgeSet=()=>{if(WS)return WS;const s=new Set(["home","showroom"]);const c=SHOW.byId("coo");if(c)c.beats.forEach(b=>s.add(b.go));if(c)WS=s;return s};
let wedgeOn=!!G(()=>U.store.get(WKEY,false),false);
function applyWedge(){const nav=D.getElementById("nav");D.body.toggleAttribute("data-wedge",wedgeOn);if(!nav)return;const ok=wedgeSet();
 nav.querySelectorAll("[data-nx-it]").forEach(it=>{const hide=wedgeOn&&!ok.has(it.dataset.nxIt);if(it.hidden!==hide)it.hidden=hide});
 nav.querySelectorAll("details,section.r15d-pins").forEach(g=>{const any=g.querySelector("[data-nx-it]:not([hidden])");const hide=wedgeOn&&!any;if(g.hidden!==hide)g.hidden=hide});
 let n=nav.querySelector(".srs-wnote");
 if(wedgeOn&&!n){n=D.createElement("div");n.className="srs-wnote";n.setAttribute("role","status");n.innerHTML=`<b>Wedge mode</b><span>${ok.size} screens shown, the rest hidden.</span><button type="button" class="btn quiet sm" data-srs-wedge="0">Show all</button>`;nav.insertBefore(n,nav.firstChild)}
 else if(!wedgeOn&&n)n.remove()}
function setWedge(on){wedgeOn=!!on;G(()=>U.store.set(WKEY,wedgeOn));G(()=>{if(W.NAVX&&NAVX.ensureIndex)NAVX.ensureIndex()});G(()=>render());applyWedge();return wedgeOn}
/* ?wedge=1 or ?wedge=0 sets it from a link and remembers it */
G(()=>{const w=new URLSearchParams(location.search).get("wedge");if(w==="1"||w==="0"){wedgeOn=w==="1";G(()=>U.store.set(WKEY,wedgeOn));setTimeout(applyWedge,0)}});
SHOW.wedge={on:()=>wedgeOn,set:setWedge,screens:()=>[...wedgeSet()],apply:applyWedge};
/* search: hide every screen outside the wedge (chained onto the existing hide rule) */
G(()=>{const R=W.R15=W.R15||{};const prev=R.hideItem;R.hideItem=function(it,raw){try{if(wedgeOn&&it){const sid=it.sid||(it.ty==="screen"&&it.key?String(it.key).replace(/^screen:/,""):null);if(sid&&!wedgeSet().has(sid))return true}}catch(e){}return prev?prev.apply(this,arguments):false}});
G(()=>HOOKS.on("afterRender",applyWedge,{id:"srs-wedge",order:50}));
G(()=>{const nav=D.getElementById("nav");if(nav)new MutationObserver(()=>applyWedge()).observe(nav,{childList:true})});
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-srs-wedge]");if(!t)return;setWedge(t.dataset.srsWedge==="1");G(()=>toast(wedgeOn?"Wedge mode on: only the COO cut's screens are in the menu and search.":"Wedge mode off: every screen is back in the menu.","info"))});

/* ---------- PR-19: demo reset and role preset ---------- */
const KNOWN=["oukala-v2","oukala-store:v1","oukala.bl.cols","oukala-chx-1","fx.num.v1","oukala.r21.cus.v2","oukala.log.v3","oukala-r15d-auditchain","showroom.lens","showroom.rehearsal","guard_attempts"];
const PREFIX=["oukala-r15d-","oukala-r16i-","oukala-nav","oukala.","oukala-"];
const KEEP=[WKEY]; /* a presenter setting, not demo data: wedge mode survives a reset */
function storageKeys(){const ks=new Set([...G(()=>[...U.store.keys],[]),...KNOWN]);G(()=>{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(PREFIX.some(p=>k.indexOf(p)===0))ks.add(k)}});KEEP.forEach(k=>ks.delete(k));return[...ks]}
function clearStorage(){const ks=storageKeys();ks.forEach(k=>G(()=>localStorage.removeItem(k)));return ks}
let resetting=false;
W.addEventListener("pagehide",()=>{if(resetting)clearStorage()}); /* registered after the modules that flush on pagehide, so it runs last */
function reset(o){o=o||{};const d=o.demo?SHOW.byId(o.demo):null;const persona=o.persona||(d&&d.persona)||"exec";
 if(G(()=>SHOW.state.demo,null))G(()=>SHOW.exit({stay:true}));
 const cleared=clearStorage();
 G(()=>{if(W.SCN&&SCN.cur!=="core")SCN.set("core");else if(DATA.tenant()!=="core")DATA.setTenant("core")});
 G(()=>{if(S.persona!==persona)NAVX.persona.set(persona)});
 G(()=>{const l=d&&d.lens||G(()=>R18.LENS_OF[persona],null);if(l){if(SHOW.applyLens&&SHOW.lensOf(l))SHOW.applyLens(l,{quiet:true});else{R18.st.lens=l;R18.st.lensBy=persona}}});
 G(()=>{if(W.STUDIO){STUDIO.sc=null;STUDIO.view="home";STUDIO.lastScen=null}});
 G(()=>CHATX.close());G(()=>INBOX.closePanel());G(()=>closeDrawer());
 SHOW.lastReset={at:new Date().toISOString(),cleared,persona,tenant:"core",demo:o.demo||null};
 if(o.reload===false){G(()=>go(o.demo?"showroom":"home"));if(o.demo)G(()=>SHOW.start(o.demo,0));return SHOW.lastReset}
 const u=new URL(location.href);["showroom","beat","kid","mode","srwin","lens","srpath"].forEach(k=>u.searchParams.delete(k));u.searchParams.set("srreset","1");u.searchParams.set("srpersona",persona);if(o.demo)u.searchParams.set("showroom",o.demo);
 G(()=>history.replaceState(null,"",u));resetting=true;
 if(W.STORE&&STORE.reset)STORE.reset();else G(()=>location.reload());
 return SHOW.lastReset}
SHOW.reset=reset;SHOW.resetKeys=storageKeys;
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-srs-reset]");if(!t)return;const sel=D.getElementById("srsResetDemo");reset({demo:sel&&sel.value||null})});
/* after a reset reload: confirm, apply the role preset, tidy the link */
G(()=>{const q=new URLSearchParams(location.search);if(!q.get("srreset"))return;const p=q.get("srpersona");
 setTimeout(()=>{G(()=>{if(p&&G(()=>PERSONAS[p],null)&&S.persona!==p&&!SHOW.state.demo)NAVX.persona.set(p)});
  G(()=>{const u=new URL(location.href);u.searchParams.delete("srreset");u.searchParams.delete("srpersona");history.replaceState(null,"",u)});
  SHOW.lastReset={at:new Date().toISOString(),reloaded:true,persona:p,tenant:G(()=>DATA.tenant(),"core")};
  if(!SHOW.state.demo)G(()=>toast("Demo reset: browser storage cleared, Meridian sample, viewing as "+G(()=>PERSONAS[S.persona].n,""),"good"))},1400)});

/* ---------- Showroom home: presenter settings ---------- */
SHOW.home.push(()=>{const main=SHOW.demos.filter(d=>!d.group||d.group==="main"||d.group==="lens");const ws=wedgeSet();
 return `<div class="grid g2" style="align-items:start"><section class="sr-card glass srs" aria-label="Wedge mode"><div class="sr-ch"><h3>Wedge mode</h3><span class="sr-pill">${wedgeOn?"On":"Off"}</span></div>
 <p class="muted small">Shows only the wedge, the screens of the COO cut, in the menu and in search. Every other screen is hidden, never deleted, and still opens from a link. Also <code>?wedge=1</code> and <code>?wedge=0</code>. Remembered on this device.</p>
 <p class="small">${[...ws].map(id=>E(G(()=>NAVX.label(id),id)||id)).join(", ")}</p>
 <div class="row"><button type="button" class="btn ${wedgeOn?"":"primary"}" data-srs-wedge="${wedgeOn?"0":"1"}" aria-pressed="${wedgeOn}">${wedgeOn?"Turn wedge mode off":"Turn wedge mode on"}</button></div></section>
 <section class="sr-card glass srs" aria-label="Demo reset"><div class="sr-ch"><h3>Demo reset</h3></div>
 <p class="muted small">One action so every demo starts the same: clears the browser storage this app uses (${storageKeys().length} keys today, wedge mode kept), resets the demo state, switches to the Meridian sample and the tour's role, then reloads clean.</p>
 <div class="row"><label class="sr-chk" for="srsResetDemo">Then start</label><select id="srsResetDemo" class="fin"><option value="">No tour (Home, as the CIO)</option>${main.map(d=>`<option value="${E(d.id)}">${E(d.title)}</option>`).join("")}</select>
 <button type="button" class="btn" data-srs-reset="1">Reset the demo</button></div></section></div>`});
})();
