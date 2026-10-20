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
 SHOW.lastFix={kind:k,ref:ctx.ref||"",title:ctx.title||"",text,from:G(()=>S.screen,"")};
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
  const t=c.querySelector(".jb-t b");const title=t?t.textContent.replace(ref,"").trim():"this build";c.appendChild(fixBtn("build",ref,title))});
 v.querySelectorAll("div.noproc:not([data-srs-fix])").forEach(c=>{c.dataset.srsFix="1";const ref=(c.dataset.jb||"").split("|").join(" ");
  const t=c.querySelector("b,strong,.jb-n,.t");const title=(t?t.textContent:c.textContent).trim().split("\n")[0].slice(0,90);c.appendChild(fixBtn("journey",ref,title))})}
let decoT=0;const deco=()=>{if(decoT)return;decoT=requestAnimationFrame(()=>{decoT=0;if(G(()=>S.screen,"")==="ppl_jrny")decorate()})};
G(()=>HOOKS.on("afterRender",s=>{if(s==="ppl_jrny")deco()},{id:"srs-fix"}));
G(()=>{const v=D.getElementById("view");if(v)new MutationObserver(deco).observe(v,{childList:true,subtree:true})});

})();
