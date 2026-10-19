/* ===== Round 15, Agent C: usability core =====
   1 URL hash routing + document titles   2 (task-first lives in mod_r15c_task.js)   3 one name per screen + 5 breadcrumbs
   4 search ranking hooks                 6 toast dock                              9 accessibility basics
   Everything is guarded: if a shared global is missing the feature quietly skips. */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>[...(r||D).querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R15=W.R15=W.R15||{};
/* merged screens: oldId -> {to, tab:"viewName:index"}. Filled by mod_r15c_merge.js. The old ids stay registered so links, search and favorites keep working. */
R15.alias=R15.alias||{};
R15.hidden=R15.hidden||{};            /* screen ids hidden from the menu and search because a canonical screen replaced them */
/* ---- measured: last user gesture, so toasts without one can be treated as system messages ---- */
let lastGesture=0;["pointerdown","keydown","change"].forEach(t=>D.addEventListener(t,()=>{lastGesture=Date.now()},true));

/* =========================================================  1. ROUTING  ========================================================= */
const RT={apply:0,arg:null,n:0,key:null};
const enc=encodeURIComponent,dec=s=>{try{return decodeURIComponent(s)}catch(e){return s}};
function parse(h){h=String(h||"").replace(/^#\/?/,"");const i=h.indexOf("?");const id=dec(i<0?h:h.slice(0,i));const params={};(i<0?"":h.slice(i+1)).split("&").forEach(kv=>{if(!kv)return;const j=kv.indexOf("=");params[dec(j<0?kv:kv.slice(0,j))]=j<0?"":dec(kv.slice(j+1))});return{id,params}}
function tabsNow(){const v=G(()=>S.v,{})||{};return qa("#view [data-views]").map(e=>e.dataset.views).filter(n=>v[n]).map(n=>n+":"+v[n]).join(",")}
function hashFor(screen,arg){const q=[];if(arg!=null&&arg!=="")q.push("arg="+enc(arg));const t=tabsNow();if(t)q.push("tab="+enc(t));return"#"+screen+(q.length?"?"+q.join("&"):"")}
function screenKnown(id){return G(()=>SCREENS.some(s=>s[0]===id),false)}
function canon(id){id=String(id||"");if(R15.alias[id])return R15.alias[id].to;return id}
function syncHash(replace){if(RT.apply)return;const id=G(()=>S.screen);if(!id)return;const h=hashFor(id,RT.arg);if(location.hash===h){RT.key=id+"|"+RT.arg;return}
 const key=id+"|"+RT.arg;const push=!replace&&RT.n>0&&RT.key!==key;RT.key=key;RT.n++;
 try{history[push?"pushState":"replaceState"](null,"",h)}catch(e){try{location.hash=h}catch(_){}}}
function applyHash(h){const p=parse(h);let id=p.id;if(!id)return;
 id=G(()=>NAVX.resolveAlias(id),null)||id;let tab=p.params.tab||"";const al=R15.alias[id];if(al){if(al.tab)tab=tab||al.tab;id=al.to}
 if(!screenKnown(id))return;const arg=p.params.arg==null?null:p.params.arg;
 if(id===G(()=>S.screen)&&(arg||null)===(RT.arg||null)&&!tab)return;
 RT.apply=1;try{tab.split(",").forEach(x=>{const k=x.indexOf(":");if(k>0)S.v[x.slice(0,k)]=+x.slice(k+1)||0});RT.arg=arg;go(id,arg==null?undefined:arg)}finally{RT.apply=0}
 syncHash(true)}
/* go(): redirect merged ids, remember the argument, then let everyone else run */
const _go=W.go;
W.go=function(screen,arg){const a=R15.alias[screen];if(a){if(a.tab){const k=a.tab.indexOf(":");try{S.v[a.tab.slice(0,k)]=+a.tab.slice(k+1)||0}catch(e){}}screen=a.to}
 if(!RT.apply)RT.arg=arg==null?null:String(arg);
 return _go.call(this,screen,arg)};
W.addEventListener("popstate",()=>{applyHash(location.hash)});
W.addEventListener("hashchange",()=>{const p=parse(location.hash);const al=R15.alias[p.id];if(p.id&&(p.id!==G(()=>S.screen)||al||p.params.arg!=null))applyHash(location.hash)});
D.addEventListener("change",e=>{if(e.target&&e.target.dataset&&e.target.dataset.vw)setTimeout(()=>syncHash(true),0)},true);
R15.route={parse,hashFor,apply:applyHash,sync:syncHash,state:RT};
/* the shell boots from screens3.js with the part of the hash before "?"; this finishes the job for arguments and tabs */
setTimeout(()=>{try{const h=location.hash;if(h&&h.length>1)applyHash(h);else syncHash(true)}catch(e){console.error("r15 route",e)}},0);

/* =========================================================  3 + 5. ONE NAME, BREADCRUMBS  ========================================================= */
const NAMEX=R15.names=R15.names||{};   /* id -> canonical label, filled by mod_r15c_merge.js, applied once at first render */
let namesDone=false;
function applyNames(){if(namesDone)return;namesDone=true;
 G(()=>{for(const id in NAMEX){if(screenKnown(id))NAVX.add(id,{label:NAMEX[id]})}
  for(const id in R15.hidden){const m=NAVX.map&&NAVX.map[id];if(m)m.g="r15hid"}
  for(const old in R15.alias){const row=SCREENS.find(s=>s[0]===old);if(row&&NAVX.alias){NAVX.alias[String(row[1]).toLowerCase()]=R15.alias[old].to;const l=G(()=>NAVX.label(old));if(l)NAVX.alias[String(l).toLowerCase()]=R15.alias[old].to}}
  if(NAVX.int&&NAVX.int.IDX)NAVX.int.IDX.dirty=true;if(W.renderNav)renderNav()})}
function reHide(){G(()=>{let ch=0;for(const id in NAMEX){if(screenKnown(id)&&NAVX.label(id)!==NAMEX[id]){const m=NAVX.map&&NAVX.map[id];if(m){m.l=NAMEX[id];ch++}}}for(const id in R15.hidden){const m=NAVX.map&&NAVX.map[id];if(m&&m.g!=="r15hid"){m.g="r15hid";ch++}}if(ch){if(NAVX.int&&NAVX.int.IDX)NAVX.int.IDX.dirty=true;if(W.renderNav)renderNav()}})}
G(()=>{if(NAVX.add&&!NAVX.add.__r15){const f=NAVX.add;NAVX.add=function(){const r=f.apply(this,arguments);reHide();return r};NAVX.add.__r15=1}});
const label=id=>G(()=>NAVX.label(id),id);
const gid=id=>{const f=R15.famOf&&R15.famOf[id];if(f&&f.id!==id)return gid(f.id);const a=R15.alias[id];if(a)return gid(a.to);return G(()=>NAVX.resolve(id).g,"new")};
function groupName(id){return G(()=>NAVX.groupLabel(gid(id)),"")}
function crumbHTML(id){const g=gid(id),gl=groupName(id),l=label(id);if(g==="home"||!gl)return `<nav class="r15-crumb" aria-label="Breadcrumb"><span aria-current="page">${esc(l)}</span></nav>`;
 return `<nav class="r15-crumb" aria-label="Breadcrumb"><button type="button" class="r15-cg" data-r15-grp="${esc(g)}" aria-haspopup="true">${esc(gl)}</button><span class="r15-sep" aria-hidden="true">/</span><span aria-current="page">${esc(l)}</span></nav>`}
function decorateNames(){const id=G(()=>S.screen);if(!id)return;const v=q1("#view");if(!v)return;const lab=label(id);
 const hero=q1(".screen > .hero",v)||q1(".hero",v);
 if(!hero){ /* screens without a hero: put the breadcrumb on top */
  const sc=q1(".screen",v)||v;if(!q1(".r15-crumb",sc)&&sc.firstElementChild)sc.insertAdjacentHTML("afterbegin",`<div class="eyebrow r15-eb">${crumbHTML(id)}</div>`);return}
 const eb=q1(".eyebrow",hero);const h1=q1("h1",hero);
 if(eb&&!q1(".r15-crumb",eb)){const slot=q1(".ownx-slot",eb);let rest="";[...eb.childNodes].forEach(n=>{if(n.nodeType===3){rest+=n.textContent;n.remove()}});eb.insertAdjacentHTML("afterbegin",crumbHTML(id));eb.dataset.r15Was=rest.trim();if(slot)eb.appendChild(slot)}
 else if(!eb){hero.insertAdjacentHTML("afterbegin",`<div class="eyebrow">${crumbHTML(id)}</div>`)}
 if(h1&&!h1.dataset.r15n){const detail=!!RT.arg||R15.detail&&R15.detail(id);h1.dataset.r15n="1";
  if(!detail&&h1.textContent.trim().toLowerCase()!==lab.toLowerCase()){const old=h1.innerHTML;h1.textContent=lab;const tag=D.createElement("p");tag.className="r15-tag";tag.innerHTML=old;h1.insertAdjacentElement("afterend",tag)}}
 document.title=(id==="home"?"Oukala":lab+" · Oukala");
 const lv=q1("#r15Live");if(lv)lv.textContent=lab}
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r15-grp]");if(!b)return;const g=b.dataset.r15Grp;
 let pop=q1("#r15GrpPop");if(!pop){pop=D.createElement("div");pop.id="r15GrpPop";pop.setAttribute("popover","auto");pop.className="glass r15-grppop";pop.setAttribute("aria-label","Screens in this group");D.body.appendChild(pop)}
 const ids=G(()=>NAVX.groupItems(g),[]);pop.innerHTML=`<div class="eyebrow">${esc(G(()=>NAVX.groupLabel(g),""))}</div>`+ids.map(i=>`<button type="button" class="r15-gi${i===S.screen?" on":""}" data-nav="${esc(i)}">${esc(label(i))}</button>`).join("");
 const r=b.getBoundingClientRect();pop.style.top=Math.round(r.bottom+6)+"px";pop.style.left=Math.max(12,Math.min(Math.round(r.left),innerWidth-300))+"px";try{pop.showPopover()}catch(x){}});
D.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#r15GrpPop [data-nav]")){try{q1("#r15GrpPop").hidePopover()}catch(x){}}},true);

/* =========================================================  6. TOASTS  ========================================================= */
const TST={n:0};
const APPR=/approv|waiting for|awaiting|SR\d|sign.?off/i;
function dismiss(t){if(!t||t.dataset.gone)return;t.dataset.gone=1;t.classList.add("out");setTimeout(()=>t.remove(),380)}
function toast2(msg,kind,opt){opt=opt||{};kind=kind||"good";msg=String(msg==null?"":msg);
 let box=q1("#toasts");if(!box){box=D.createElement("div");box.id="toasts";D.body.appendChild(box)}box.setAttribute("aria-live","polite");box.setAttribute("role","status");
 const sys=!opt.user&&Date.now()-lastGesture>1500;
 const dupe=qa(".toast",box).find(t=>t.dataset.msg===msg&&!t.dataset.gone);
 if(dupe){const c=+dupe.dataset.n+1;dupe.dataset.n=c;let b=q1(".tcount",dupe);if(!b){b=D.createElement("b");b.className="tcount";dupe.insertBefore(b,q1(".tmsg",dupe).nextSibling)}b.textContent="×"+c;clearTimeout(dupe._t);dupe._t=setTimeout(()=>dismiss(dupe),sys?3000:4200);return dupe}
 if(sys){qa(".toast.sys",box).forEach(t=>dismiss(t))}
 const t=D.createElement("div");t.className="toast glass "+kind+(sys?" sys":"");t.dataset.msg=msg;t.dataset.n=1;
 let act=opt.label?{label:opt.label,fn:opt.fn}:null;
 if(!act&&!sys&&APPR.test(msg)&&G(()=>S.screen)!=="flw_appr"&&!/could not|cannot|failed|denied/i.test(msg))act={label:/waiting for|awaiting|waiting on/i.test(msg)?"Open approvals":"Open",fn:()=>go("flw_appr")};
 t.innerHTML=`<i aria-hidden="true"></i><span class="tmsg">${esc(msg)}</span>${act?`<button type="button" class="tact">${esc(act.label)}</button>`:""}<button type="button" class="tx" aria-label="Dismiss notification">×</button>`;
 if(act)q1(".tact",t).addEventListener("click",()=>{dismiss(t);try{act.fn&&act.fn()}catch(e){console.error(e)}});
 q1(".tx",t).addEventListener("click",()=>dismiss(t));
 box.appendChild(t);
 const live=qa(".toast:not([data-gone])",box);if(live.length>3)live.slice(0,live.length-3).forEach(dismiss);
 const life=opt.sticky?0:sys?3000:(act?7000:4200);
 const arm=()=>{if(life){clearTimeout(t._t);t._t=setTimeout(()=>dismiss(t),life)}};arm();
 t.addEventListener("mouseenter",()=>clearTimeout(t._t));t.addEventListener("mouseleave",arm);t.addEventListener("focusin",()=>clearTimeout(t._t));t.addEventListener("focusout",arm);
 return t}
R15.toast=toast2;W.toast=toast2;
D.addEventListener("click",e=>{if(e.target&&e.target.closest&&e.target.closest(".toast"))return},true);

/* =========================================================  9. ACCESSIBILITY  ========================================================= */
D.documentElement.lang=D.documentElement.lang||"en";
const CLICKY="[data-nav],[data-go],[data-rec],[data-needgo],[data-trace],[data-step],[data-impact],[data-svc],[data-apx-kind],[data-fo],[data-meet],[data-decide],[data-invpick],[data-sort],[data-kgn],[data-rec-pick]";
function nameOf(el){return(el.getAttribute("aria-label")||el.getAttribute("aria-labelledby")||el.textContent||"").trim()||el.getAttribute("title")||el.getAttribute("alt")||""}
function fixA11y(root){root=root||q1("#view");if(!root)return;
 qa(CLICKY,root).forEach(el=>{if(/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|OPTION)$/.test(el.tagName))return;
  if(!el.hasAttribute("tabindex"))el.setAttribute("tabindex","0");if(!el.getAttribute("role")&&el.tagName!=="TR"&&el.tagName!=="LI"&&!el.closest("svg")&&el.tagName.toLowerCase()!=="g")el.setAttribute("role","button");el.setAttribute("data-r15-kb","1")});
 qa("svg[data-kgn],g[data-kgn]",root).forEach(el=>{if(!el.hasAttribute("tabindex"))el.setAttribute("tabindex","0");el.setAttribute("data-r15-kb","1")});
 qa("button,a[href],[role=button],[role=tab],[role=switch]",root).forEach(el=>{if(nameOf(el))return;const svgT=q1("svg title",el);const t=el.dataset&&(el.dataset.nav||el.dataset.go||el.dataset.nxStar||el.dataset.act)||"";
  el.setAttribute("aria-label",(svgT&&svgT.textContent)||(el.title)||(t?String(t).replace(/[_:|-]+/g," "):"Action"))});
 qa("input:not([type=hidden]):not([aria-label]):not([aria-labelledby]),select:not([aria-label]):not([aria-labelledby]),textarea:not([aria-label]):not([aria-labelledby])",root).forEach(el=>{if(el.id&&q1('label[for="'+CSS.escape(el.id)+'"]'))return;if(el.closest("label"))return;const n=el.getAttribute("placeholder")||el.title||el.name||el.dataset&&Object.keys(el.dataset)[0];el.setAttribute("aria-label",String(n||"Field").replace(/[_-]+/g," ").replace(/([a-z])([A-Z])/g,"$1 $2"))});
 qa("th:not([scope])",root).forEach(th=>th.setAttribute("scope","col"));
 qa("table:not([role])",root).forEach(t=>{if(!t.getAttribute("aria-label")&&!t.querySelector("caption")){const c=t.closest(".card");const h=c&&q1("h3,h2",c);if(h)t.setAttribute("aria-label",h.textContent.trim())}});
 qa("svg:not([aria-hidden]):not([role]):not([aria-label])",root).forEach(s=>{if(!s.closest("button,a,[role=button]")&&!q1("title",s))s.setAttribute("aria-hidden","true");else if(s.closest("button,a,[role=button]"))s.setAttribute("aria-hidden","true")});
 qa("img:not([alt])",root).forEach(i=>i.setAttribute("alt",""))}
D.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;if(!t||!t.matches||!t.matches("[data-r15-kb]"))return;if(/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(t.tagName))return;e.preventDefault();t.click()});
function landmarks(){const rail=q1("aside.rail");if(rail&&!rail.getAttribute("role")){rail.setAttribute("role","navigation");rail.setAttribute("aria-label","Main navigation")}
 const nav=q1("#nav");if(nav&&nav.tagName!=="NAV"&&!nav.getAttribute("role")){/* the rail is the navigation landmark; avoid nesting two */}
 const tb=q1(".topbar");if(tb&&!tb.getAttribute("role"))tb.setAttribute("role","banner");
 const s=q1(".topbar .search");if(s&&!s.getAttribute("role"))s.setAttribute("role","search");
 const v=q1("#view");if(v){v.setAttribute("role","main");v.setAttribute("aria-label","Page content");v.removeAttribute("aria-live")}
 const m=q1("main#view");if(m)m.removeAttribute("role");
 const d=q1("#drawer");if(d&&!d.getAttribute("role")){d.setAttribute("role","dialog");d.setAttribute("aria-modal","false")}
 if(!q1("#r15Live")){D.body.insertAdjacentHTML("beforeend",'<div id="r15Live" class="sr" role="status" aria-live="polite" aria-atomic="true"></div>')}
 const sk=q1(".skip,.skiplink,a[href=\"#view\"]");if(sk&&!sk.dataset.r15){sk.dataset.r15=1;sk.addEventListener("click",e=>{e.preventDefault();const v2=q1("#view");if(v2){v2.focus({preventScroll:false})}})}}

/* =========================================================  hook render  ========================================================= */
const _render=W.render;let first=true;
W.render=function(){if(first){first=false;applyNames()}else reHide();const r=_render.apply(this,arguments);
 try{landmarks();decorateNames();fixA11y();syncHash()}catch(e){console.error("r15 render hook",e)}return r};
/* anything that mutates the page without render() (drawers, lazy tabs) gets the same accessibility pass, debounced */
let mt=0;const mo=new MutationObserver(()=>{clearTimeout(mt);mt=setTimeout(()=>{try{fixA11y(q1("#view"));const d=q1("#drawer");if(d)fixA11y(d)}catch(e){}},250)});
const arm=()=>{const v=q1("#view");if(!v)return setTimeout(arm,200);mo.observe(v,{childList:true,subtree:true});const d=q1("#drawer");if(d)mo.observe(d,{childList:true,subtree:true})};setTimeout(arm,300);

/* =========================================================  4. SEARCH RANKING HOOKS  ========================================================= */
/* intent table: a typed word promotes the screen that does the job. Weights beat any plain title match. */
const INTENT={laptop:["svc_portal"],laptops:["svc_portal"],computer:["svc_portal"],phone:["svc_portal"],monitor:["svc_portal"],hardware:["svc_portal"],software:["svc_portal"],license:["svc_portal"],licence:["svc_portal"],order:["svc_portal"],buy:["svc_portal"],purchase:["svc_portal"],equipment:["svc_portal"],catalog:["svc_portal"],newhire:["svc_portal"],onboard:["svc_portal"],onboarding:["svc_portal"],hire:["svc_portal"],
 approve:["flw_appr"],approval:["flw_appr"],approvals:["flw_appr"],decision:["flw_appr"],decisions:["flw_appr"],pending:["flw_appr"],signoff:["flw_appr"],
 broken:["itsm_inc"],outage:["itsm_inc"],down:["itsm_inc"],incident:["itsm_inc"],incidents:["itsm_inc"],ticket:["itsm_inc"],
 budget:["bud_over"],budgets:["bud_over"],forecast:["bud_over"],spend:["bud_over"],
 invoice:["inv"],invoices:["inv"],bill:["inv"],
 org:["org_chart"],reports:["org_chart"],manager:["org_chart"],
 project:["ppm_proj"],projects:["ppm_proj"],
 risk:["exe_risk"],risks:["exe_risk"]};
const SNAKE=/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
R15.intent=INTENT;
R15.itemBoost=function(it,qn){try{if(!it||!qn)return 0;const toks=String(qn).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);if(!toks.length)return 0;
 const sid=it.sid||(it.ty==="screen"&&it.key?String(it.key).replace(/^screen:/,""):null);if(!sid)return 0;const cs=canon(sid);let b=0;
 for(const t of toks){const L=INTENT[t];if(L&&L.indexOf(cs)>=0){b=Math.max(b,toks.length===1?600:420)}}
 if(b&&R15.alias[sid])b=0;return b}catch(e){return 0}};
R15.hideItem=function(it,raw){try{if(!it)return false;const sid=it.sid||(it.ty==="screen"&&it.key?String(it.key).replace(/^screen:/,""):null);if(sid&&(R15.hidden[sid]||R15.alias[sid]))return true;
 if(SNAKE.test(String(it.t||"").trim())&&!/_/.test(String(raw||"")))return true;return false}catch(e){return false}};
})();
