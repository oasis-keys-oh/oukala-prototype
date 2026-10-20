/* ===== mod_r32_orgprop: recommended agents and robots drawn on the real org chart.
   Each build from the Build list becomes a dashed card under the head of the team it would help, the same way an open position does.
   Proposed, not built; every figure is a modeled sample value. Meridian scenario only: the industry scenarios have no real org chart. ===== */
(function(){
const W=window,O=W.ORGX,R=W.JXR;if(!O||!R||!R.builds||!W.SCN)return;
const OS=S.org;
const E=R.E,H=s=>E(s==null?"":String(s));
const FTE_H=(W.JYX&&JYX.api&&JYX.api.FTE_H)||140,WL={1:"Wave 1",2:"Wave 2",3:"Wave 3"};
/* box owners that are not an org unit by that name */
const UNIT={"People office":"People operations","Hiring manager":"People operations","Service desk":"Service desk and operations","Ops team":"Service desk and operations","Change manager":"Change and release","PMO":"Portfolio and delivery","Resource office":"Portfolio and delivery","Vendor management":"Legal and compliance"};
let CACHE=null,CK="";
const isCore=()=>SCN.cur==="core";
function headOf(unit){const st=O.staff.filter(p=>p.unit===unit);if(!st.length)return null;
 const inU=new Set(st.map(p=>p.n));const tops=st.filter(p=>!p.mgr||!inU.has(p.mgr));
 return (tops.length?tops:st).slice().sort((a,b)=>(O.depth?O.depth(a.n):0)-(O.depth?O.depth(b.n):0))[0].n}
function compute(){const by=new Map();if(!isCore())return by;
 let B=[];try{B=R.builds()}catch(e){console.error("orgprop builds",e)}
 B.forEach(o=>{const owner=o.teams[0]||"Executive office";const unit=UNIT[owner]||owner;
  let head=headOf(unit),exact=!!head;if(!head){head=headOf("Executive office");exact=false}if(!head)return;
  const pr={id:o.id,k:o.k,name:o.name,title:o.title,wave:o.wave,steps:o.rows.length,hrs:o.hrs,freed:o.freed,ext:o.ext,owner,unit,head,exact};
  (by.get(head)||by.set(head,[]).get(head)).push(pr)});
 by.forEach(l=>l.sort((a,b)=>a.wave-b.wave||b.freed-a.freed));return by}
const all=()=>{const k=SCN.cur+"|"+(window.DATA?DATA.version:0)+"|"+(R.scopeNow?R.scopeNow():""); /* keyed by tenant and data version (CL-55) */if(!CACHE||CK!==k){CACHE=compute();CK=k}return CACHE};
O.propReset=()=>{CACHE=null};
O.propFor=n=>all().get(n)||[];
O.propAll=()=>[...all().values()].flat();
O.embed=()=>!!document.getElementById("orgvp");

const fteOf=pr=>pr.ext?null:pr.freed/FTE_H;
O.propCard=function(c,pos){const pr=c.pr,f=fteOf(pr);
 return `<div class="org-n org-pp k-${pr.k}" data-oid="${H(c.id)}" style="${pos}"><button type="button" class="org-card pp" data-r32-prop="${H(pr.id)}" aria-label="Recommended ${pr.k}: ${H(pr.title)}, ${WL[pr.wave]}, ${pr.steps} steps, proposed and not built. Opens the build summary.">${R.av(pr.k,pr.name,34,"jav-cand")}<span class="org-t" title="${H(pr.title)}"><b>${H(pr.title)}</b><small>Proposed ${pr.k} · ${WL[pr.wave]}</small><span class="org-m"><em>${pr.steps} step${pr.steps===1?"":"s"}</em><em>${f==null?Math.round(pr.freed)+" h back":f.toFixed(1)+" FTE"}</em></span></span></button></div>`};
O.propOutline=pr=>`<li role="treeitem" class="org-ol-a"><button type="button" class="org-ol org-pp-ol" data-r32-prop="${H(pr.id)}">${R.av(pr.k,pr.name,26,"jav-cand")}<span><b>${H(pr.title)} <span class="pill info">Proposed ${pr.k}</span></b><small>${WL[pr.wave]} · ${pr.steps} step${pr.steps===1?"":"s"} · ${pr.ext?Math.round(pr.freed)+" h back":fteOf(pr).toFixed(1)+" FTE released"}</small></span></button></li>`;

/* toolbar switch on the org chart */
const bx=O.barX;
O.barX=function(){const h=bx?bx.apply(this,arguments):"";if(!isCore())return h;const n=O.propAll().length;
 return `<div class="org-chips org5-bar" role="group" aria-label="Recommendations"><button type="button" class="chip" data-r32-props aria-pressed="${!!OS.props}" title="Show the agents and robots recommended from the journey maps, under the team each would help. Proposed, not built.">Recommended agents and robots · ${n}</button></div>`+h};
const refresh=()=>{try{if(S.screen==="ppl_jrny"&&W.JYX&&JYX.api)JYX.api.paneRefresh();else render()}catch(e){render()}};
function openPaths(){OS.collapsed=OS.collapsed||{};
 /* the chart seeds its own collapsed branches the first time it is drawn; do that now so opening the paths below is not undone */
 if(!OS.seed13){OS.seed13=true;O.staff.forEach(p=>{if(O.kids(p.n).length&&O.depth(p.n)>=2)OS.collapsed[p.n]=true})}
 all().forEach((l,head)=>{(O.up?O.up(head):[head]).forEach(u=>{OS.collapsed[u]=false});OS.collapsed[head]=false})}
O.openProp=openPaths;
/* pan the chart to a recommendation */
O.focusProp=function(id){const vp=document.getElementById("orgvp");if(!vp)return false;
 const el=id?[...document.querySelectorAll(".org-pp [data-r32-prop]")].find(x=>x.getAttribute("data-r32-prop")===id):document.querySelector(".org-pp [data-r32-prop]");
 const n=el&&el.closest(".org-n");if(!n)return false;const k=.7;OS.k=k;O.cam.set(Math.round(vp.clientWidth/2-(n.offsetLeft+116)*k),Math.round(vp.clientHeight/3-n.offsetTop*k));return true};
document.addEventListener("click",e=>{const j=e.target.closest&&e.target.closest("[data-r32-jump]");if(j){e.preventDefault();if(!O.focusProp(j.getAttribute("data-r32-jump")))toast("Open the branch first: turn on Recommended agents and robots.","info");return}});
document.addEventListener("click",e=>{
 const t=e.target.closest&&e.target.closest("[data-r32-props],[data-r32-prop]");if(!t)return;
 if(t.hasAttribute("data-r32-props")){e.preventDefault();OS.props=!OS.props;if(OS.props)openPaths();OS.k=0;refresh();return}
 const id=t.getAttribute("data-r32-prop");if(OS._moved&&Date.now()-OS._moved<250)return;
 if(R.buildDrawer)R.buildDrawer(id)});
/* CL-35: a tenant change clears the cache through the tenantChange hook (runs before the scenario re-render) instead of wrapping SCN.set */
if(W.HOOKS&&HOOKS.on)HOOKS.on("tenantChange",()=>O.propReset(),{id:"orgprop-reset",order:10});
})();
