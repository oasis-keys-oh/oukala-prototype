/* ===== Round 15, Agent B: one-click "New" menu in the top bar + deep links (#new/budget-request etc.).
   Every main create action opens its form in ONE click from anywhere. ===== */
(function(){
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tryv=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const has=id=>tryv(()=>SCREENS.some(s=>s[0]===id),false);
/* go to a screen, then press its create button (found by text or selector) */
function runAct(sc,match,after){if(!has(sc))return false;if(S.screen!==sc)go(sc);let n=0;const iv=setInterval(()=>{const root=document.querySelector("#view");const b=root&&(typeof match==="string"?root.querySelector(match):[...root.querySelectorAll("button,a")].find(x=>match.test((x.textContent||"").trim().replace(/\s+/g," "))));
 if(b){clearInterval(iv);b.click()}else if(++n>30){clearInterval(iv);if(after)after()}},120);return true}
const ITEMS=[
 {k:"budget-request",t:"Request budget",s:"Ask for funding, one form",ic:"M12 3v18M7 8h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h9",run:()=>{if(window.BUDREQ&&BUDREQ.openForm){BUDREQ.openForm();return true}return runAct("bud_req",/^Request budget$/)}},
 {k:"order",t:"Order something",s:"Laptop, access, software, new hire",ic:"M6 6h15l-2 9H8zM6 6L5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",run:()=>{if(!has("svc_cat"))return false;go("svc_cat");setTimeout(()=>{const i=document.querySelector("#view input[type=search],#view input[type=text]");if(i)i.focus()},300);return true}},
 {k:"incident",t:"New incident",s:"Something is broken",ic:"M12 3l9 16H3zM12 10v4M12 17h.01",run:()=>runAct("itsm_inc",/^Log incident$/)},
 {k:"change",t:"New change",s:"Ask to change a service",ic:"M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5",run:()=>runAct("itsm_chg",/^Request change$/)},
 {k:"demand",t:"New project demand",s:"Propose new work for the portfolio",ic:"M4 5h16l-6 8v6l-4-2v-4z",run:()=>runAct("port",/^New request$/)},
 {k:"po",t:"New purchase order",s:"Commit budget with a vendor",ic:"M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",run:()=>runAct("bud_ven",/^New purchase order$/)},
 {k:"person",t:"New person",s:"Add someone to the org chart",ic:"M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 8v6M14 11h6",run:()=>runAct("org_chart",'[data-org5="add"]')||false}];
function run(key){const it=ITEMS.find(x=>x.k===key);if(!it)return false;const ok=it.run();if(ok===false)tryv(()=>toast("That form is not available in this build","warn"));return ok!==false}
const PLUS='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
function popHTML(){return `<div class="nw-h">Create</div>${ITEMS.map(x=>`<button type="button" class="nw-i" data-nw="${x.k}"><i><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${x.ic}"/></svg></i><span><b>${H(x.t)}</b><small>${H(x.s)}</small></span></button>`).join("")}`}
function mount(){const tb=document.querySelector(".tb-right");if(!tb)return;
 if(!document.getElementById("nwPop")){const p=document.createElement("div");p.id="nwPop";p.setAttribute("popover","");p.className="nw-pop glass";p.setAttribute("aria-label","Create");p.innerHTML=popHTML();document.body.appendChild(p);
  p.addEventListener("beforetoggle",e=>{if(e.newState==="open"){const b=document.getElementById("nwBtn");if(b){const r=b.getBoundingClientRect();p.style.setProperty("--nw-top",(r.bottom+8)+"px");p.style.setProperty("--nw-right",Math.max(12,innerWidth-r.right-4)+"px")}}});
  p.addEventListener("click",e=>{const t=e.target.closest("[data-nw]");if(!t)return;try{p.hidePopover()}catch(x){}run(t.dataset.nw)})}
 if(!document.getElementById("nwRb")){const r=document.createElement("button");r.type="button";r.id="nwRb";r.className="btn nw-rb";r.setAttribute("aria-label","Request budget");r.title="Request budget: opens the form in one click";r.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M7 8h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h9"/></svg><span class="lbl-rb">Request budget</span>';r.addEventListener("click",()=>run("budget-request"));tb.insertBefore(r,tb.firstChild)}
 if(!document.getElementById("nwBtn")){const b=document.createElement("button");b.type="button";b.id="nwBtn";b.className="btn primary nw-btn";b.setAttribute("popovertarget","nwPop");b.setAttribute("aria-label","New: create something");b.title="Create: request budget, order, incident, change, demand, purchase order, person";b.innerHTML=PLUS+'<span class="lbl-long">New</span>';tb.insertBefore(b,tb.firstChild)}}
/* deep links: #new/<key> */
function hashRun(){const m=/^#new\/([a-z-]+)$/.exec(location.hash||"");if(m)setTimeout(()=>run(m[1]),60)}
window.addEventListener("hashchange",hashRun);
setTimeout(()=>{mount();hashRun()},1300);setInterval(()=>{try{mount()}catch(e){}},3000);
document.addEventListener("keydown",e=>{if(e.altKey&&e.shiftKey&&(e.key==="N"||e.key==="n")&&!/input|textarea|select/i.test((e.target.tagName||""))){e.preventDefault();const p=document.getElementById("nwPop");try{p.togglePopover()}catch(x){}}});
window.NEWMENU={items:()=>ITEMS.map(x=>({k:x.k,t:x.t,hash:"#new/"+x.k})),run,mount};
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>ITEMS.map(x=>({g:"Actions",t:x.t,m:x.s+" · one click",c:"--good-f",f:()=>run(x.k),k:"new create "+x.t+" "+x.s})));
})();
