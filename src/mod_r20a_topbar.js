/* ===== Round 20, A: a calmer top bar. History, Favorites and Clarity lens become icon-only with a hover tooltip; Tour becomes a pi symbol in the bottom-right corner. ===== */
(function(){
"use strict";
const W=window,D=document;
const GLASSES='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="14.5" r="3.6"/><circle cx="17.5" cy="14.5" r="3.6"/><path d="M10.1 14.2c1.2-.8 2.6-.8 3.8 0M2.9 14.2 5 7.5h2.2M21.1 14.2 19 7.5h-2.2"/></svg>';
function tip(el,text){if(!el)return;const t=text||el.getAttribute("data-tip")||el.getAttribute("title")||"";if(!t)return;el.setAttribute("data-tip",t);el.removeAttribute("title")}
function topbar(){
 const nx=[D.getElementById("nxFavBtn"),D.getElementById("nxHistBtn")];
 nx.forEach(b=>{if(!b)return;tip(b);b.classList.add("r20-ico")});
 const lb=D.querySelector(".topbar .lensbtn");
 if(lb&&!lb.classList.contains("r20-ico")){const t=lb.getAttribute("title")||"Show which fields tell the story and which are measured";lb.innerHTML=GLASSES;lb.setAttribute("aria-label","Clarity lens");lb.setAttribute("data-tip","Clarity lens: "+t.charAt(0).toLowerCase()+t.slice(1));lb.removeAttribute("title");lb.classList.add("r20-ico")}
 const old=D.querySelector(".tb-right #r17pLaunch");if(old)old.remove();
 if(!D.getElementById("r20Pi")){const b=D.createElement("button");b.type="button";b.id="r20Pi";b.className="r20-pi";b.setAttribute("data-r17p-launch","");b.setAttribute("aria-label","Tour: guided stories and demo tools");b.setAttribute("data-tip","Tour: guided stories, moments and rehearsal");b.innerHTML='<span aria-hidden="true">&pi;</span>';D.body.appendChild(b)}
}
let timer=0;
function later(){clearTimeout(timer);timer=setTimeout(()=>{try{topbar()}catch(e){console.error("r20 topbar",e)}},40)}
HOOKS.on("afterRender",()=>later(),{id:"r20a.topbar"});
const start=()=>{later();const tb=D.querySelector(".topbar");if(tb)new MutationObserver(later).observe(tb,{childList:true,subtree:true})};
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",()=>setTimeout(start,600));else setTimeout(start,600);
})();
