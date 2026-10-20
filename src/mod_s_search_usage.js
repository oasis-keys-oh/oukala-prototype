/* ============ mod_s_search_usage.js: real screen-open counts (PR-16, window.USAGE) ============
   Counts every screen open and the time spent on it, in this browser only (prototype fact), stored with U.store and kept
   apart from the seeded demo history in mod_nav. Shown on the Screen map (each row and the details drawer) and on the
   "Usage" tab of Navigation and search. Lifecycle through HOOKS; no wrappers. Keep and cut decisions (CL-41) can read it. */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>(W.U&&U.esc)?U.esc(s):String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KEY="falconaire-usage";const CAP=30*60*1000; /* one stay counts at most 30 minutes */
const LABEL="this browser only (prototype fact)";
const USAGE=W.USAGE=W.USAGE||{};
const blank=()=>({v:1,since:Date.now(),screens:{}});
let D=null;
const load=()=>{if(D)return D;const x=G(()=>U.store.get(KEY,null),null);D=x&&x.v===1&&x.screens?x:blank();return D};
let saveT=0;const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>G(()=>U.store.set(KEY,load())),400)};
const flush=()=>{clearTimeout(saveT);G(()=>U.store.set(KEY,load()))};
const known=id=>G(()=>SCREENS.some(s=>s[0]===id),false);

/* ---------- recording ---------- */
const CUR={id:null,t0:0};
function stop(){if(!CUR.id)return;const d=Math.min(Date.now()-CUR.t0,CAP);const r=load().screens[CUR.id];if(r&&d>0)r.ms=(r.ms||0)+d;CUR.id=null;save()}
function open(id){if(!id||!known(id)||CUR.id===id)return;stop();const s=load().screens;const r=s[id]=s[id]||{n:0,ms:0,last:0};
 r.n++;r.last=Date.now();CUR.id=id;CUR.t0=Date.now();save()}
if(W.HOOKS)HOOKS.on("afterRender",sc=>{try{open(sc||S.screen)}catch(e){}},{id:"usage.open",order:30});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else{const sc=G(()=>S.screen,null);if(sc&&!CUR.id&&known(sc)){CUR.id=sc;CUR.t0=Date.now()}}});
W.addEventListener("pagehide",()=>{stop();flush()});

/* ---------- API ---------- */
USAGE.label=LABEL;
USAGE.get=id=>{const r=load().screens[id];const live=CUR.id===id?Math.min(Date.now()-CUR.t0,CAP):0;return r?{n:r.n,ms:(r.ms||0)+live,last:r.last}:{n:0,ms:0,last:0}};
USAGE.all=()=>G(()=>SCREENS.map(s=>Object.assign({id:s[0],name:String(G(()=>NAVX.label(s[0]),s[1]))},USAGE.get(s[0]))),[]);
USAGE.since=()=>load().since;
USAGE.flush=flush;
USAGE.reset=()=>{D=blank();CUR.id=null;flush();if(W.audit)G(()=>audit("Reset screen usage counts",LABEL))};
const mins=ms=>{const m=Math.round(ms/60000);return ms<60000?(ms>=5000?"under a minute":"a few seconds"):m+" min"};
const day=t=>t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"never";
USAGE.text=id=>{const u=USAGE.get(id);return u.n?u.n+" open"+(u.n===1?"":"s")+", "+mins(u.ms)+" in total, last "+day(u.last):"Not opened yet"};

/* ---------- Screen map: a count on each row and a line in the details drawer ---------- */
function decorateMap(){if(G(()=>S.screen,null)!=="scr_map")return;
 document.querySelectorAll("#view [data-scm-row]").forEach(row=>{const id=row.getAttribute("data-scm-row");const box=row.querySelector(".scm-s");if(!box)return;
  const u=USAGE.get(id);let el=box.querySelector(".us-n");if(!el){el=document.createElement("span");el.className="us-n muted";box.appendChild(el)}
  const t=u.n+" open"+(u.n===1?"":"s");if(el.textContent!==t){el.textContent=t;el.title="Screen opens, "+LABEL}})}
let mq=0;const soon=()=>{if(mq)return;mq=requestAnimationFrame(()=>{mq=0;try{decorateMap()}catch(e){}})};
if(W.HOOKS)HOOKS.on("afterRender",sc=>{if(sc==="scr_map")queueMicrotask(soon)},{id:"usage.map",order:31});
/* the Screen map regroups and filters rows in place, so watch the view while it is open */
let mo=null;const watch=()=>{const v=document.getElementById("view");if(!v||mo)return;mo=new MutationObserver(()=>{if(G(()=>S.screen,null)==="scr_map")soon()});mo.observe(v,{childList:true,subtree:true})};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch);else setTimeout(watch,0);
if(W.HOOKS)HOOKS.on("afterOpenDrawer",d=>{queueMicrotask(()=>{try{const dr=(d||document).querySelector("[data-scm-dr]");if(!dr)return;const id=dr.getAttribute("data-scm-dr");
 const kv=dr.querySelector("dl.kv");if(!kv||kv.querySelector("[data-us-dd]"))return;
 kv.insertAdjacentHTML("afterbegin",`<dt>Opened in this browser</dt><dd data-us-dd="${E(id)}">${E(USAGE.text(id))} <span class="pill mute" title="Counted on this device since ${E(day(USAGE.since()))}. Not shared, not a measure of real users.">${E(LABEL)}</span></dd>`)}catch(e){}})},{id:"usage.drawer",order:30});

/* ---------- admin panel: the Usage tab of Navigation and search ---------- */
USAGE.panelHTML=function(){const all=USAGE.all();const used=all.filter(r=>r.n>0).sort((a,b)=>b.n-a.n||b.ms-a.ms);const never=all.length-used.length;
 const tot=used.reduce((a,r)=>a+r.n,0);
 const row=r=>`<tr><td><button type="button" class="btn quiet sm" data-go="${E(r.id)}">${E(r.name)}</button><br><small class="muted"><code>${E(r.id)}</code></small></td><td class="num">${r.n}</td><td class="num">${E(mins(r.ms))}</td><td>${E(day(r.last))}</td></tr>`;
 return `<div class="card glass us-panel"><div class="cardhead"><div><h3>Screen usage</h3><span class="muted small">Real screen opens and time on screen, counted in ${E(LABEL)} since ${E(day(USAGE.since()))}. Seeded demo history is not counted. Use it as a hint for keep and cut decisions, not as a measure of real users.</span></div><button class="btn quiet" type="button" data-us-reset>Reset counts</button></div>
 <div class="statrow us-stats"><div class="stat"><small>Screens opened</small><span class="num">${used.length}</span><em>of ${all.length} registered</em></div><div class="stat"><small>Opens</small><span class="num">${tot}</span><em>${E(LABEL)}</em></div><div class="stat"><small>Never opened</small><span class="num">${never}</span><em>candidates to review</em></div></div>
 ${used.length?`<div class="tscroll"><table class="tbl us-tbl"><thead><tr><th>Screen</th><th>Opens</th><th>Time on screen</th><th>Last opened</th></tr></thead><tbody>${used.map(row).join("")}</tbody></table></div>`:`<p class="muted">Nothing counted yet in this browser.</p>`}</div>`};
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-us-reset]");if(!b)return;e.preventDefault();
 if(!confirm("Reset the screen usage counts in this browser?"))return;USAGE.reset();G(()=>render())});
})();
