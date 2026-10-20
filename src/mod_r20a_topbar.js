/* ===== Round 20, A: a calmer top bar. History, Favorites and Clarity lens become icon-only with a hover tooltip; Tour becomes a pi symbol in the bottom-right corner.
   PR-06 (PH-14 step 5, Omar approved 2026-10-20): the top bar is built around four things: the search palette, the tenant badge
   (R17: the active tenant is always visible), View as, and the contribution thread (slot #tbThread, filled by the contribution
   thread work, DC-12 follow-up; empty and hidden until then). New, agents working, notifications, favorites, history and the
   Clarity lens move to the profile panel ("Quick controls"). The original controls stay in the page, hidden from the bar at
   desktop widths, so every module, shortcut and test that opens them keeps working; the panel buttons open the same popovers. ===== */
(function(){
"use strict";
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const GLASSES='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="14.5" r="3.6"/><circle cx="17.5" cy="14.5" r="3.6"/><path d="M10.1 14.2c1.2-.8 2.6-.8 3.8 0M2.9 14.2 5 7.5h2.2M21.1 14.2 19 7.5h-2.2"/></svg>';
const ic=d=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
function tip(el,text){if(!el)return;const t=text||el.getAttribute("data-tip")||el.getAttribute("title")||"";if(!t)return;el.setAttribute("data-tip",t);el.removeAttribute("title")}
/* the controls that leave the bar: [key, label, how to find the original, icon path] */
const QUICK=[["new","New","#nwBtn","M12 5v14M5 12h14"],["inbox","Notifications","#inbxBell","M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"],
 ["fav","Favorites","#nxFavBtn","M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"],["hist","History","#nxHistBtn","M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2"],
 ["agents","Agents working",".tb-right .btn.live","M13 2L4 14h7l-1 8 9-12h-7z"],["lens","Clarity lens",".topbar .lensbtn",""]];
const orig=k=>{const q=QUICK.find(x=>x[0]===k);return q?D.querySelector(q[2]):null};
function quickHTML(){return `<section class="r20-quick" data-r20-quick aria-label="Quick controls"><div class="eyebrow">Quick controls</div><div class="r20-qgrid">${QUICK.map(([k,l,,d])=>{
 const o=orig(k);const n=k==="fav"?G(()=>NAVX.fav.list().length,0):k==="inbox"?((o&&o.textContent||"").trim()):"";const on=k==="lens"&&!!G(()=>D.getElementById("lens").checked,false);
 const pt=k==="fav"?' popovertarget="nxFavPop"':k==="hist"?' popovertarget="nxHistPop"':"";
 return `<button type="button" class="btn quiet r20-q" data-r20-q="${k}"${pt}${k==="lens"?` aria-pressed="${on}"`:""}>${k==="lens"?GLASSES:ic(d)}<span>${E(l)}</span>${n?`<em>${E(n)}</em>`:""}</button>`}).join("")}</div></section>`}
function profile(){const p=D.getElementById("profilePop");if(!p)return;const old=p.querySelector("[data-r20-quick]");const html=quickHTML();
 if(old){if(old.outerHTML!==html)old.outerHTML=html;return}
 const h=p.querySelector("h3");if(h)h.insertAdjacentHTML("afterend",html);else p.insertAdjacentHTML("afterbegin",html)}
/* the tenant badge in the bar: the same control as the switcher in the rail, always showing the active tenant (R17) */
function tenantShort(){return G(()=>{const i=DATA.tenantInfo(DATA.tenant())||{};return i.short||i.org||DATA.tenant()},"")}
function tenantChip(tb){if(!D.getElementById("tnBtn"))return;let b=D.getElementById("r20Tenant");const t=tenantShort();
 if(!b){b=D.createElement("button");b.type="button";b.id="r20Tenant";b.className="btn quiet r20-tenant";b.setAttribute("data-r20-tenant","");tb.insertBefore(b,tb.firstChild)}
 const html=`<span class="r20-tdot" aria-hidden="true"></span><span>${E(t)}</span>`;if(b.innerHTML!==html){b.innerHTML=html;b.setAttribute("aria-label","Active tenant: "+t+". Switch tenant");b.setAttribute("data-tip","Active tenant: "+t+" (tenant isolation is simulated)")}}
/* the contribution thread slot under the bar's search: empty and hidden until the thread is rendered */
function threadSlot(){const bar=D.querySelector(".topbar");if(!bar||D.getElementById("tbThread"))return;const s=D.createElement("div");s.id="tbThread";s.className="r20-thread";s.hidden=true;s.setAttribute("aria-label","Your contribution thread");
 const se=bar.querySelector(".search");if(se)se.insertAdjacentElement("afterend",s);else bar.appendChild(s)}
function topbar(){
 const nx=[D.getElementById("nxFavBtn"),D.getElementById("nxHistBtn")];
 nx.forEach(b=>{if(!b)return;tip(b);b.classList.add("r20-ico")});
 const lb=D.querySelector(".topbar .lensbtn");
 if(lb&&!lb.classList.contains("r20-ico")){const t=lb.getAttribute("title")||"Show which fields tell the story and which are measured";lb.innerHTML=GLASSES;lb.setAttribute("aria-label","Clarity lens");lb.setAttribute("data-tip","Clarity lens: "+t.charAt(0).toLowerCase()+t.slice(1));lb.removeAttribute("title");lb.classList.add("r20-ico")}
 const old=D.querySelector(".tb-right #r17pLaunch");if(old)old.remove();
 if(!D.getElementById("r20Pi")){const b=D.createElement("button");b.type="button";b.id="r20Pi";b.className="r20-pi";b.setAttribute("data-r17p-launch","");b.setAttribute("aria-label","Tour: guided stories and demo tools");b.setAttribute("data-tip","Tour: guided stories, moments and rehearsal");b.innerHTML='<span aria-hidden="true">&pi;</span>';D.body.appendChild(b)}
 const tb=D.querySelector(".tb-right");if(tb){tb.classList.add("r20-simple");tenantChip(tb)}
 threadSlot();profile()}
let timer=0;
function later(){clearTimeout(timer);timer=setTimeout(()=>{try{topbar()}catch(e){console.error("r20 topbar",e)}},40)}
HOOKS.on("afterRender",()=>later(),{id:"r20a.topbar"});
HOOKS.on("tenantChange",()=>later(),{id:"r20a.tenant"});
ROUTER.on("click","[data-r20-tenant]",()=>{const b=D.getElementById("tnBtn");if(b)b.click()},{id:"r20a.tenant"});
ROUTER.on("click","[data-r20-q]",(e,t)=>{const k=t.dataset.r20Q;if(k==="fav"||k==="hist")return; /* native popover buttons */
 const p=D.getElementById("profilePop");try{if(p&&p.matches(":popover-open"))p.hidePopover()}catch(x){}
 if(k==="lens"){const l=D.getElementById("lens");if(l){l.checked=!l.checked;l.dispatchEvent(new Event("change",{bubbles:true}))}return}
 const o=orig(k);if(o)setTimeout(()=>o.click(),0)},{id:"r20a.quick"});
const start=()=>{later();const tb=D.querySelector(".topbar");if(tb)new MutationObserver(later).observe(tb,{childList:true,subtree:true})};
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",()=>setTimeout(start,600));else setTimeout(start,600);
})();
