/* Round 15 Agent D: KPI tile labels and one metric chip per metric per screen. */
(function(){
"use strict";
if(!window.R15D||!R15D.onAfter)return;
R15D.onAfter(()=>{try{
 const v=document.getElementById("view");if(!v)return;
 v.querySelectorAll(".stat,.kpi,.ring-tile,.tile.glass").forEach(t=>{
  if(t.getAttribute("aria-label")||t.getAttribute("role")||t.closest("button,a,[role=button]"))return;
  if(t.matches(".tile.glass")&&!t.querySelector(".num,.val,b.num,.big"))return;
  const txt=(t.innerText||"").replace(/\s+/g," ").trim();if(!txt||txt.length>160)return;
  t.setAttribute("role","group");t.setAttribute("aria-label",txt)});
 const seen=new Set();
 v.querySelectorAll(".fchip[data-k]").forEach(c=>{const k=c.dataset.k;if(seen.has(k)){c.remove()}else seen.add(k)});
}catch(e){}});
})();
