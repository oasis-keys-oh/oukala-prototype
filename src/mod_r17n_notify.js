/* ===== Round 17, Agent N: one notification layer, top right, liquid glass.
   Replaces the bottom-right toast dock (R15 toast2), the Needs you banner dock (R15 Agent D) and the bottom-centre undo dock (Inbox).
   Keeps window.toast(msg,kind,opt), R15.toast, the "Open approvals" action, and every Inbox path: Approve/Review/Undo go through INBOX.decide / INBOX.undo.
   API: R17N.notify({kind,title,body,key,actions,life,sticky}), R17N.history(), R17N.onChange(fn), R17N.demo(n), R17N.clear(). ===== */
(function(){
"use strict";
const W=window,D=document;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>[...(r||D).querySelectorAll(s)];
const RM=()=>G(()=>matchMedia("(prefers-reduced-motion:reduce)").matches,false);
const MAXV=3,HIST_MAX=100;
const R=W.R17N=W.R17N||{};
const HIST=[],LIS=[];
let layer=null,expanded=false,seq=0,tickT=0;
const ICON={approval:"M5 12.5l4.2 4.2L19 7",good:"M5 12.5l4.2 4.2L19 7",info:"M12 8h.01M11 12h1v5h1",warn:"M12 4l9 16H3zM12 10v4M12 17h.01",bad:"M6 6l12 12M18 6L6 18"};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[k]||ICON.info}"/></svg>`;

function relT(ts){const d=Math.max(0,Date.now()-ts);if(d<45e3)return"now";if(d<36e5)return Math.max(1,Math.round(d/6e4))+"m";return Math.round(d/36e5)+"h"}

function place(){const tb=q1(".topbar");let top=84;if(tb){const r=tb.getBoundingClientRect();top=Math.round(r.bottom+10);if(top<48||top>180)top=innerWidth<=600?72:84}
 const safe=G(()=>parseFloat(getComputedStyle(D.documentElement).getPropertyValue("--sat"))||0,0);
 if(layer)layer.style.setProperty("--r17n-top",(top+safe)+"px")}
function ensure(){if(layer&&layer.isConnected)return layer;
 layer=q1("#toasts");if(!layer){layer=D.createElement("div");layer.id="toasts";D.body.appendChild(layer)}
 layer.className="r17n-layer";layer.setAttribute("role","region");layer.setAttribute("aria-label","Notifications");layer.removeAttribute("aria-live");
 layer.addEventListener("keydown",e=>{if(e.key==="Escape"){const c=e.target.closest&&e.target.closest(".r17n-card");if(c){e.preventDefault();e.stopPropagation();dismiss(c);const n=q1(".r17n-card:not(.r17n-out)",layer);if(n)n.focus()}}});
 place();return layer}

function dismiss(c,right){if(!c||c._gone)return;c._gone=1;clearTimeout(c._t);c.classList.add(right?"r17n-outr":"r17n-out");setTimeout(()=>{c.remove();layout()},RM()?220:320);if(c._onGone)G(()=>c._onGone())}
function layout(){if(!layer)return;const live=qa(".r17n-card:not(.r17n-out):not(.r17n-outr)",layer);
 let mw=q1(".r17n-mw",layer);const extra=live.length-MAXV;
 live.forEach((c,i)=>c.classList.toggle("r17n-back",!expanded&&i>=MAXV));
 if(extra>0){if(!mw){mw=D.createElement("div");mw.className="r17n-mw";mw.innerHTML='<button type="button" class="r17n-more" aria-expanded="false"></button>';layer.appendChild(mw)}
  const b=q1(".r17n-more",mw);b.textContent=expanded?"Show fewer":"+"+extra+" more";b.setAttribute("aria-expanded",String(expanded));b.setAttribute("aria-label",expanded?"Show fewer notifications":extra+" more notifications, show all");
  if(layer.lastElementChild!==mw)layer.appendChild(mw)}
 else{if(mw)mw.remove();expanded=false}
 layer.classList.toggle("r17n-open",expanded&&extra>0)}

function arm(c){clearTimeout(c._t);if(c._life>0){c._t=setTimeout(()=>dismiss(c),c._life)}}
function hold(c){clearTimeout(c._t);c.classList.add("paused");const b=q1(".r17n-bar",c);if(b)b.style.animationPlayState="paused"}
function release(c){c.classList.remove("paused");const b=q1(".r17n-bar",c);if(b)b.style.animationPlayState="";if(c._life>0)c._t=setTimeout(()=>dismiss(c),Math.min(c._life,c._barless?c._life:4000))}

function record(o){const key=o.kind+"|"+o.title+"|"+(o.body||"");const last=HIST[0];
 if(last&&last.key===key&&Date.now()-last.ts<60000){last.n++;last.ts=Date.now()}
 else{HIST.unshift({id:"r17n-"+(++seq),key,kind:o.kind,title:o.title,body:o.body||"",ts:Date.now(),n:1,sys:!!o.sys});if(HIST.length>HIST_MAX)HIST.length=HIST_MAX;
  /* bell panel hook: attention-worthy items also land in the notification centre list */
  if(!o.sys&&/^(approval|warn|bad)$/.test(o.kind))G(()=>{const st=W.NOTIF&&NOTIF.state;if(st&&st.items){st.items.unshift({id:"N-r17-"+seq,type:o.kind==="approval"?"approval":"alert",prio:o.kind==="bad"?"high":"normal",title:o.title+(o.body?". "+o.body:""),sub:"Raised on screen",src:o.src||"flw_appr",group:o.group||"Approvers",ts:Date.now(),read:false,cleared:false,defer:0,esc:null})}})}
 LIS.forEach(f=>G(()=>f(HIST)));G(()=>D.dispatchEvent(new CustomEvent("r17n:history",{detail:{count:HIST.length}})))}

/* notify: o={kind:'approval'|'good'|'info'|'warn'|'bad', title, body, key, actions:[{label,primary,fn}], life(ms), sticky, compact, bar(ms), sys, onGone, role} */
function notify(o){o=Object.assign({kind:"info"},o||{});ensure();place();o.title=String(o.title==null?"":o.title);
 const key=o.key||(o.kind+"|"+o.title+"|"+(o.body||""));
 const dupe=qa(".r17n-card",layer).find(c=>c._key===key&&!c._gone);
 if(dupe){const n=(dupe._n=(dupe._n||1)+1);let b=q1(".r17n-cnt",dupe);if(!b){b=D.createElement("span");b.className="r17n-cnt";q1(".r17n-t",dupe).after(b)}b.textContent="×"+n;dupe._ts=Date.now();{const w=q1(".r17n-when",dupe);if(w)w.textContent="now"}arm(dupe);record(o);return dupe}
 const compact=o.compact!=null?o.compact:(!o.body&&!(o.actions&&o.actions.length));
 const c=D.createElement("div");c._key=key;c._ts=Date.now();c._life=o.sticky?0:(o.life!=null?o.life:(o.actions&&o.actions.length?10000:4200));c._onGone=o.onGone;
 c.className="r17n-card r17n-in "+o.kind+(compact?" compact":"");c.tabIndex=0;
 const urgent=o.role?o.role==="alert":/warn|bad/.test(o.kind);c.setAttribute("role",urgent?"alert":"status");c.setAttribute("aria-atomic","true");
 c.setAttribute("aria-label",o.title+(o.body?". "+o.body:""));
 c.innerHTML=`<span class="r17n-chip">${svg(o.icon||o.kind)}</span><div class="r17n-top"><span class="r17n-t">${esc(o.title)}</span></div><span class="r17n-when">${compact?"":"now"}</span>`+
  (o.body?`<div class="r17n-b">${esc(o.body)}</div>`:"")+
  `<button type="button" class="r17n-x" aria-label="Dismiss notification">&times;</button>`+
  ((o.actions&&o.actions.length)?`<div class="r17n-acts">${o.actions.map((a,i)=>`<button type="button" class="r17n-act${a.primary?" pri":""}" data-i="${i}">${esc(a.label)}</button>`).join("")}</div>`:"")+
  (o.bar?`<i class="r17n-bar" style="animation-duration:${o.bar}ms" aria-hidden="true"></i>`:"");
 if(compact){const w=q1(".r17n-when",c);w.remove()}
 c._barless=!o.bar;
 q1(".r17n-x",c).addEventListener("click",()=>dismiss(c));
 qa(".r17n-act",c).forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const a=o.actions[+b.dataset.i];dismiss(c);try{a.fn&&a.fn(c)}catch(x){console.error(x)}}));
 c.addEventListener("mouseenter",()=>hold(c));c.addEventListener("mouseleave",()=>release(c));c.addEventListener("focusin",()=>hold(c));c.addEventListener("focusout",()=>release(c));
 /* swipe right to dismiss */
 let sx=0,dx=0,drag=false,pid=null;
 c.addEventListener("pointerdown",e=>{if(e.target.closest("button")||(e.pointerType==="mouse"&&e.button!==0))return;drag=true;sx=e.clientX;dx=0;pid=e.pointerId;c.classList.add("r17n-drag");try{c.setPointerCapture(pid)}catch(x){}});
 c.addEventListener("pointermove",e=>{if(!drag)return;dx=Math.max(0,e.clientX-sx);c.style.transform="translateX("+dx+"px)";c.style.opacity=String(Math.max(.25,1-dx/280))});
 const end=()=>{if(!drag)return;drag=false;c.classList.remove("r17n-drag");try{c.releasePointerCapture(pid)}catch(x){}if(dx>80){c.style.transform="";c.style.opacity="";dismiss(c,true)}else{c.style.transform="";c.style.opacity=""}};
 c.addEventListener("pointerup",end);c.addEventListener("pointercancel",end);
 layer.insertBefore(c,layer.firstChild);
 layout();arm(c);record(o);
 /* hard cap: never more than 12 live cards */
 qa(".r17n-card:not(.r17n-out)",layer).slice(12).forEach(x=>dismiss(x));
 if(!tickT)tickT=setInterval(()=>{const cs=qa(".r17n-card",layer||D);if(!cs.length){clearInterval(tickT);tickT=0;return}cs.forEach(x=>{const w=q1(".r17n-when",x);if(w)w.textContent=relT(x._ts)})},20000);
 return c}

D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".r17n-more");if(!b)return;expanded=!expanded;layout();if(expanded){const f=q1(".r17n-card:not(.r17n-back)",layer);}else if(layer)layer.scrollTop=0});
D.addEventListener("keydown",e=>{if(e.key!=="Escape"||e.defaultPrevented)return;if(!layer||e.target.closest&&e.target.closest("input,textarea,select,[contenteditable=true]"))return;
 if(q1("[popover]:popover-open")||q1("dialog[open]"))return;const c=q1(".r17n-card:not(.r17n-out):not(.r17n-outr)",layer);if(c)dismiss(c)});
W.addEventListener("resize",()=>{place()});

/* ---------- legacy toast(msg,kind,opt) ---------- */
const APPR=/approv|waiting for|awaiting|RITM\d|sign.?off/i;
const lastG={t:0};["pointerdown","keydown"].forEach(ev=>D.addEventListener(ev,()=>{lastG.t=Date.now()},true));
function toast3(msg,kind,opt){opt=opt||{};kind=kind||"good";msg=String(msg==null?"":msg);
 const sys=!opt.user&&Date.now()-lastG.t>1500;
 let act=opt.label?{label:opt.label,fn:opt.fn}:null;
 const onAppr=G(()=>S.screen)==="flw_appr";
 if(!act&&!sys&&APPR.test(msg)&&!onAppr&&!/could not|cannot|failed|denied/i.test(msg))act={label:/waiting for|awaiting|waiting on/i.test(msg)?"Open approvals":"Open",fn:()=>G(()=>go("flw_appr"))};
 const waiting=/waiting for|awaiting|waiting on/i.test(msg)&&APPR.test(msg);
 const o={kind:waiting?"approval":kind,title:msg,sys,sticky:!!opt.sticky,key:"t|"+kind+"|"+msg,life:sys?3000:(act?8000:4200)};
 if(act){o.actions=[{label:act.label,primary:true,fn:act.fn}];o.compact=false}
 else o.compact=true;
 if(waiting){o.title=msg.length>64?"Approval requested":msg;if(msg.length>64)o.body=msg}
 return notify(o)}
W.toast=toast3;G(()=>{if(W.R15)R15.toast=toast3});
/* modules that ran before this file captured toast by value (kit.js function declaration is global; W.toast reassignment covers lookups by name) */

/* ---------- Inbox mirrors: banners (Needs you) and undo toasts ---------- */
const GRP={invoice:"Finance approver group",inv:"Finance approver group",change:"Change advisory board",budget:"Finance approver group",access:"Security approver group",release:"Release approver group",catalog:"Service owners group",contract:"Legal approver group"};
function groupOf(it){if(!it)return"approver group";const g=it.apgName;if(g)return g;
 return GRP[it.ic]||GRP[it.src]||((it.cat||"Approver")+" approver group")}
const money=n=>"$"+Math.round(n).toLocaleString("en-US");
function mirrorBanner(el){const id=el.dataset.id;if(!id||el._r17n)return;el._r17n=1;
 const it=G(()=>INBOX.items().find(x=>x.id===id));
 const title=it?it.title:G(()=>q1(".inbx-bm b",el).textContent,"Approval requested");
 const isAppr=!it||it.kind==="approval";
 const parts=[];if(it&&it.sim)parts.push("Simulated");parts.push(isAppr?"Waiting on "+groupOf(it):(it?it.cat:"New"));if(it&&it.amt!=null)parts.push(money(it.amt));
 const acts=[];
 if(isAppr&&it&&it.can&&it.can.approve&&!it.needNote)acts.push({label:"Approve",primary:true,fn:()=>{const r=G(()=>INBOX.decide(id,"approve"),{});if(r&&r.ok===false)toast3(r.why||"Could not record the decision","warn")}});
 acts.push({label:isAppr&&acts.length?"Review":(isAppr?"Review":"Open"),primary:!acts.length,fn:()=>G(()=>{INBOX.state.cur=id;INBOX.state.tab="all";INBOX.openPanel();INBOX.refresh()})});
 notify({kind:isAppr?"approval":(it&&it.kind==="mention"?"info":"warn"),title:title,body:parts.join(" · "),key:"inbx|"+id,actions:acts,life:12000,src:it&&it.src,group:groupOf(it)});
}
function mirrorUndo(el){if(el._r17n)return;el._r17n=1;const verb=G(()=>q1(".inbx-tm b",el).textContent,"Approved");const rest=G(()=>el.querySelector(".inbx-tm").firstChild&&el.querySelector(".inbx-tm").childNodes[1].textContent.trim(),"");
 const ms=G(()=>INBOX.UNDO_MS,8000);
 const c=notify({kind:"good",title:verb+(rest?" "+rest:""),body:"Sends to the owning module in "+Math.round(ms/1000)+" s unless you undo",key:"undo|"+Date.now()+"|"+Math.random(),bar:ms,life:ms+300,icon:"good",
  actions:[{label:"Undo",primary:true,fn:()=>{const b=q1("[data-inbx-undo]",el);if(b)b.click()}}]});
 c.classList.add("r17n-undo");
 /* retire the card when Inbox retires its element (undone, resolved or sent) */
 const mo=new MutationObserver(()=>{if(!el.isConnected){mo.disconnect();if(!c._gone)dismiss(c)}});if(el.parentNode)mo.observe(el.parentNode,{childList:true});
 c._onGone=()=>mo.disconnect()}
function watch(box,fn){if(!box||box._r17w)return;box._r17w=1;qa(":scope > *",box).forEach(fn);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)fn(n)}))).observe(box,{childList:true})}
function attach(){const b=D.getElementById("inbxBanners"),u=D.getElementById("inbxUndo");
 if(b)watch(b,n=>{if(n.classList.contains("inbx-banner"))mirrorBanner(n)});
 if(u)watch(u,n=>{if(n.classList.contains("inbx-toast"))mirrorUndo(n)});return !!(b&&u)}
const bootMO=new MutationObserver(()=>{if(attach())bootMO.disconnect()});
function boot(){ensure();if(!attach())bootMO.observe(D.body,{childList:true})}
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",boot);else boot();
/* a banner exists in the Inbox before the first undo box does, so keep trying after the first user-visible event too */
setTimeout(()=>{attach()},1500);

/* ---------- public API ---------- */
R.notify=notify;R.toast=toast3;R.history=()=>HIST.map(h=>Object.assign({},h));R.onChange=f=>{LIS.push(f)};R.clear=()=>{qa(".r17n-card",layer||D).forEach(c=>dismiss(c))};
R.count=()=>qa(".r17n-card:not(.r17n-out):not(.r17n-outr)",layer||D).length;
R.demo=function(n){n=n||4;const L=[["Invoice INV-2207 (Lumen)","Waiting on Finance approver group · $45,000",1],["CHG0057 TLS certificate renewal","Waiting on Change advisory board",1],["PO-1180 segregation of duties check failed","Waiting on Finance approver group · $182,400",1],["Access review for Contract Repository","Waiting on Security approver group",1],["Budget request BR-0042","Waiting on Finance approver group · $96,000",1]];
 for(let i=0;i<n;i++){const x=L[i%L.length];notify({kind:"approval",title:x[0],body:x[1],key:"demo|"+i+"|"+Date.now(),sticky:true,actions:[{label:"Approve",primary:true,fn:()=>toast3("Approved. You have 8 seconds to undo.","good")},{label:"Review",fn:()=>G(()=>go("flw_appr"))}]})}};
R.demoBanner=function(){return G(()=>INBOX.simNow())};
})();
