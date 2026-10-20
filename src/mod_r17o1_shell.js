/* Round 17 O1: phone and tablet app shell.
   Bottom tab bar (Home, My work, Approvals with badge, Search, More), the More sheet (grouped navigation, favorites accordion, role switcher,
   Demo/Enterprise switch), condensed top rail, sticky action bar, swipe-to-close sheets, keyboard-aware viewport, tablet collapsed rail.
   Nothing here runs a heavy rebuild: one small DOM build at start, one debounced observer on #view. Desktop (above 900px) is not touched. */
(function(){
"use strict";
const D=document,W=window,R=D.documentElement;
const PHQ="(max-width:700px),(max-height:500px) and (max-width:950px)";
const PH=W.matchMedia(PHQ),TAB=W.matchMedia("(min-width:701px) and (max-width:900px) and (min-height:501px)");
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>Array.prototype.slice.call((r||D).querySelectorAll(s));
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const svg=(d,n)=>`<svg width="${n||22}" height="${n||22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const IC={home:"M4 11l8-7 8 7M6 10v10h12V10",work:"M4 8h16v11H4zM9 8V5h6v3M4 13h16",appr:"M5 12l4 4 10-10M4 4h16v16H4z",search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",more:"M4 7h16M4 12h16M4 17h16",hist:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",lens:"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-12",bolt:"M13 3L5 14h6l-1 7 8-11h-6z",user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1-4 4-6 8-6s7 2 8 6",star:"M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z",dots:"M5 12h.01M12 12h.01M19 12h.01"};
const MARK=`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14" opacity=".55"/></svg>`;
const R17=W.R17O1=W.R17O1||{};

/* ============ 1. viewport, theme color, input zoom (all widths, invisible on desktop) ============ */
function meta(){
 let v=q1('meta[name=viewport]');if(!v){v=D.createElement("meta");v.name="viewport";D.head.appendChild(v)}
 let c=v.getAttribute("content")||"width=device-width,initial-scale=1";
 if(!/viewport-fit/.test(c))c+=",viewport-fit=cover";if(!/width=/.test(c))c="width=device-width,"+c;
 if(!/initial-scale/.test(c))c+=",initial-scale=1";
 v.setAttribute("content",c);
 const mk=(media,col)=>{const id="r17o1Tc"+(media?"d":"l");let m=D.getElementById(id);if(!m){m=D.createElement("meta");m.id=id;m.name="theme-color";D.head.appendChild(m)}if(media)m.media=media;m.content=col};
 mk("(prefers-color-scheme: light)","#FBFBF9");mk("(prefers-color-scheme: dark)","#061116");
 [["mobile-web-app-capable","yes"],["apple-mobile-web-app-capable","yes"],["apple-mobile-web-app-status-bar-style","black-translucent"],["format-detection","telephone=no"]].forEach(a=>{if(!q1('meta[name="'+a[0]+'"]')){const m=D.createElement("meta");m.name=a[0];m.content=a[1];D.head.appendChild(m)}});
 /* an explicit theme choice overrides the OS hint */
 const sync=()=>{const t=R.getAttribute("data-theme");if(t==="light"||t==="dark"){qa('meta[name=theme-color]').forEach(m=>{m.removeAttribute("media");m.content=t==="dark"?"#061116":"#FBFBF9"});const extra=D.getElementById(t==="dark"?"r17o1Tcl":"r17o1Tcd");if(extra)extra.remove()}};
 sync();try{new MutationObserver(sync).observe(R,{attributes:true,attributeFilter:["data-theme"]})}catch(e){}
}

/* ============ 2. keyboard and visual viewport (iOS keeps the layout viewport; sheets follow the visual one) ============ */
let kbT=0;
function vv(){const v=W.visualViewport;if(!PH.matches){R.style.removeProperty("--r17o1-vvh");R.style.removeProperty("--r17o1-kb");R.classList.remove("r17o1-kb");return}
 if(!v)return;const kb=Math.max(0,Math.round(W.innerHeight-v.height-v.offsetTop));
 R.style.setProperty("--r17o1-vvh",Math.round(v.height+(kb>0?0:0))+"px");R.style.setProperty("--r17o1-kb",kb+"px");
 const typing=/^(input|textarea|select)$/i.test((D.activeElement||{}).tagName||"");R.classList.toggle("r17o1-kb",kb>120||(typing&&kb>60))}
function vvSoon(){if(kbT)return;kbT=requestAnimationFrame(()=>{kbT=0;vv()})}

/* ============ 3. swipe to close (sheet panels and popover sheets) ============ */
function swipe(el,opt){
 let y0=0,x0=0,dy=0,on=false,dec=false,t0=0,fromHandle=false;
 const sc=()=>opt.scroller?opt.scroller():el;
 el.addEventListener("touchstart",e=>{if(e.touches.length!==1)return;const t=e.touches[0];y0=t.clientY;x0=t.clientX;dy=0;on=false;dec=false;t0=Date.now();
  fromHandle=!!(opt.handle&&e.target.closest&&e.target.closest(opt.handle))||(el.getBoundingClientRect().top+46>y0)},{passive:true});
 el.addEventListener("touchmove",e=>{const t=e.touches[0];const mx=t.clientX-x0,my=t.clientY-y0;
  if(!dec){if(Math.abs(mx)<6&&Math.abs(my)<6)return;dec=true;on=my>0&&Math.abs(my)>Math.abs(mx)&&(fromHandle||sc().scrollTop<=0);if(on&&opt.start)opt.start()}
  if(!on)return;dy=Math.max(0,my);e.preventDefault();el.style.transform="translateY("+dy+"px)";if(opt.move)opt.move(dy)},{passive:false});
 const end=()=>{if(!on){return}on=false;const v=dy/Math.max(1,Date.now()-t0);if(opt.end)opt.end();
  if(dy>110||(v>.6&&dy>40)){opt.close(dy)}else{el.style.transition="transform .22s var(--ease)";el.style.transform="";setTimeout(()=>{el.style.transition=""},240)}dy=0};
 el.addEventListener("touchend",end,{passive:true});el.addEventListener("touchcancel",end,{passive:true})}

/* ============ 4. the More sheet (also hosts the action list) ============ */
let sheet=null,lastFocus=null,PX=[];
function ensureSheet(){if(sheet)return sheet;
 sheet=D.createElement("div");sheet.id="r17o1Sheet";sheet.className="r17o1-sheet";sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-labelledby","r17o1ShT");
 sheet.innerHTML=`<div class="r17o1-scrim" data-r17o1-close></div><div class="r17o1-panel" tabindex="-1"><div class="r17o1-grab" data-r17o1-handle><i></i></div><header class="r17o1-sh" data-r17o1-handle><h2 id="r17o1ShT">Menu</h2><button type="button" class="btn quiet r17o1-x" data-r17o1-close aria-label="Close menu">Close</button></header><div class="r17o1-body" id="r17o1Body"></div></div>`;
 D.body.appendChild(sheet);
 const panel=q1(".r17o1-panel",sheet),body=q1("#r17o1Body",sheet),scrim=q1(".r17o1-scrim",sheet);
 swipe(panel,{handle:"[data-r17o1-handle]",scroller:()=>body,start:()=>sheet.classList.add("is-drag"),move:d=>{scrim.style.opacity=String(Math.max(0,1-d/400))},end:()=>{sheet.classList.remove("is-drag");scrim.style.opacity=""},close:()=>{panel.style.transform="";closeSheet()}});
 sheet.addEventListener("click",e=>{
  if(e.target.closest("[data-r17o1-close]"))return closeSheet();
  const px=e.target.closest("[data-r17o1-px]");if(px){const el=PX[+px.dataset.r17o1Px];closeSheet(true);if(el)setTimeout(()=>{try{el.click()}catch(x){}},60);return}
  const lens=e.target.closest("[data-r17o1-lens]");if(lens){const c=q1("#lens");if(c){c.checked=!c.checked;c.dispatchEvent(new Event("change",{bubbles:true}));lens.setAttribute("aria-pressed",String(c.checked))}return}
  const sc=e.target.closest("[data-scale]");if(sc){setTimeout(()=>{qa("#r17o1Body [data-scale]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.scale===(G(()=>SCALE.on,false)?"1":"0"))))},30);return}
  if(e.target.closest("[data-nav],[data-nx-open],[data-go],[data-r15d-role],[data-nx-search],[popovertarget]"))setTimeout(()=>closeSheet(true),0)});
 /* focus trap, Escape */
 sheet.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();closeSheet();return}if(e.key!=="Tab")return;
  const f=qa('button:not([disabled]),a[href],input:not([disabled]),select,textarea,summary,[tabindex]:not([tabindex="-1"])',panel).filter(x=>x.offsetParent!==null||x===D.activeElement);if(!f.length){e.preventDefault();return}
  const a=f[0],z=f[f.length-1];if(e.shiftKey&&(D.activeElement===a||D.activeElement===panel)){e.preventDefault();z.focus()}else if(!e.shiftKey&&D.activeElement===z){e.preventDefault();a.focus()}});
 /* iOS rubber band: never let a touch on the scrim or header scroll the page behind */
 sheet.addEventListener("touchmove",e=>{if(!e.target.closest("#r17o1Body")&&!sheet.classList.contains("is-drag")){if(e.cancelable)e.preventDefault()}},{passive:false});
 return sheet}
function openSheet(title,html,cls){ensureSheet();lastFocus=D.activeElement;
 q1("#r17o1ShT",sheet).textContent=title;const b=q1("#r17o1Body",sheet);b.innerHTML=html;b.scrollTop=0;sheet.dataset.kind=cls||"";
 sheet.classList.add("is-open");R.classList.add("r17o1-lock");
 qa(".app,#r17o1Tab,#r17o1Abar").forEach(n=>{try{n.inert=true}catch(e){}n.setAttribute("aria-hidden","true")});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{sheet.classList.add("is-on");const p=q1(".r17o1-panel",sheet);try{p.focus({preventScroll:true})}catch(e){}}));
 const mb=q1("#r17o1Tab [data-r17o1-more]");if(mb&&cls==="more")mb.setAttribute("aria-expanded","true")}
function closeSheet(keepFocus){if(!sheet||!sheet.classList.contains("is-open"))return;
 sheet.classList.remove("is-on");R.classList.remove("r17o1-lock");
 qa(".app,#r17o1Tab,#r17o1Abar").forEach(n=>{try{n.inert=false}catch(e){}n.removeAttribute("aria-hidden")});
 const mb=q1("#r17o1Tab [data-r17o1-more]");if(mb)mb.setAttribute("aria-expanded","false");
 const done=()=>{sheet.classList.remove("is-open");const p=q1(".r17o1-panel",sheet);if(p)p.style.transform=""};
 setTimeout(done,PH.matches&&!matchMedia("(prefers-reduced-motion:reduce)").matches?300:0);
 if(!keepFocus&&lastFocus&&lastFocus.focus)try{lastFocus.focus({preventScroll:true})}catch(e){}}
R17.open=openSheet;R17.close=closeSheet;

function moreHTML(){
 const who=G(()=>q1("#r15dVasBtn b").textContent.trim(),"Role");
 const fam=qa("#r15dVas .r15d-fam").map(n=>n.outerHTML).join("").replace(/\sid="[^"]*"/g,"");
 const nav=String(G(()=>NAVX.html(),"")).replace(/\sid="[^"]*"/g,"");
 const lensOn=!!(q1("#lens")&&q1("#lens").checked);
 const ag=G(()=>(q1(".tb-right .live .lbl-long")||{}).textContent,"Agents");
 const ent=G(()=>SCALE.on,false);
 return `<div class="r17o1-quick">
   <button type="button" popovertarget="nxHistPop">${svg(IC.hist,20)}<span>History</span></button>
   <button type="button" data-r17o1-lens aria-pressed="${lensOn}">${svg(IC.lens,20)}<span>Clarity lens</span></button>
   <button type="button" data-nav="tower">${svg(IC.bolt,20)}<span>Agents</span></button>
   <button type="button" popovertarget="profilePop">${svg(IC.user,20)}<span>Profile</span></button></div>
  <details class="r17o1-acc" open><summary>Navigate</summary><div class="r17o1-accb"><div class="r17o1-nav" data-r17o1-nav>${nav}</div></div></details>
  <details class="r17o1-acc"><summary>View as <em>${E(who)}</em></summary><div class="r17o1-accb r17o1-role">${fam}</div></details>
  `}
function openMore(){openSheet("Menu",moreHTML(),"more");
 /* open the group that holds the current screen, keep others closed to shorten the list */
 const cur=q1('#r17o1Body [aria-current="page"]');if(cur){setTimeout(()=>{try{cur.scrollIntoView({block:"center"})}catch(e){}},340)}}

/* ============ 5. bottom tab bar ============ */
function buildTab(){if(q1("#r17o1Tab"))return;
 const t=D.createElement("nav");t.id="r17o1Tab";t.className="r17o1-tab glass";t.setAttribute("aria-label","Primary");
 t.innerHTML=`<button type="button" data-nav="home">${svg(IC.home)}<span>Home</span></button><button type="button" data-nav="inbox">${svg(IC.work)}<span>My work</span></button><button type="button" data-nav="flw_appr">${svg(IC.appr)}<span>Approvals</span><em class="r17o1-badge" hidden></em></button><button type="button" data-nx-search>${svg(IC.search)}<span>Search</span></button><button type="button" data-r17o1-more aria-haspopup="dialog" aria-expanded="false">${svg(IC.more)}<span>More</span></button>`;
 D.body.appendChild(t);
 t.addEventListener("click",e=>{const m=e.target.closest("[data-r17o1-more]");if(m){e.preventDefault();openMore()}})}
function apprCount(){const nb=q1('#nav [data-nav="flw_appr"] .apx-nb');if(nb&&nb.textContent)return nb.textContent.trim();const n=G(()=>INBOX.counts().approval,0);return n?(n>99?"99+":String(n)):""}
function markTab(){const t=q1("#r17o1Tab");if(!t)return;const s=G(()=>S.screen,"home");let hit=false;
 qa("[data-nav]",t).forEach(b=>{const on=b.dataset.nav===s;if(on){b.setAttribute("aria-current","page");hit=true}else b.removeAttribute("aria-current")});
 const b=q1(".r17o1-badge",t),c=apprCount();if(b){b.hidden=!c;b.textContent=c;const bt=q1('[data-nav="flw_appr"]',t);bt.setAttribute("aria-label","Approvals"+(c?", "+c+" waiting":""))}
 const mb=q1("[data-r17o1-more]",t);if(mb){if(!hit)mb.setAttribute("aria-current","page");else mb.removeAttribute("aria-current")}}

/* ============ 6. top rail: logo mark and screen title ============ */
function buildTop(){const tb=q1(".topbar");if(!tb||q1(".r17o1-ttl",tb))return;
 const m=D.createElement("button");m.type="button";m.className="r17o1-mark";m.setAttribute("data-nav","home");m.setAttribute("aria-label",(BRAND.name+" home"));m.innerHTML=MARK;
 const h=D.createElement("p");h.className="r17o1-ttl";h.setAttribute("aria-hidden","true");
 tb.appendChild(m);tb.appendChild(h);setTitle()}
function setTitle(){const h=q1(".r17o1-ttl");if(!h)return;const s=G(()=>S.screen,"home");const t=G(()=>NAVX.label(s),"")||D.title.replace(/\s*[|·-].*$/,"")||BRAND.name;if(h.textContent!==t)h.textContent=t}

/* ============ 7. page actions: primary action docks in a sticky bar, the rest go to an Actions sheet ============ */
function buildBar(){
 const v=q1("#view");if(!v)return;let bar=q1("#r17o1Abar");
 PX.forEach(n=>n.classList&&n.classList.remove("r17o1-px"));PX=[];
 if(!PH.matches){if(bar)bar.hidden=true;R.classList.remove("r17o1-hasbar");return}
 const hero=q1(".hero",v);let acts=[];
 if(hero)acts=qa(".btn",hero).filter(b=>!b.closest(".story,.r16-pha,[data-role=story],.r17o1-nobar")&&!b.disabled&&b.offsetParent!==null||(b.classList.contains("btn")&&!b.closest(".story,.r16-pha")&&!b.disabled&&b.getClientRects().length>0));
 acts=acts.filter((b,i,a)=>a.indexOf(b)===i);
 const prim=acts.find(b=>b.classList.contains("primary"));
 if(!prim){if(bar)bar.hidden=true;R.classList.remove("r17o1-hasbar");return}
 if(!bar){bar=D.createElement("div");bar.id="r17o1Abar";bar.className="r17o1-abar glass";bar.setAttribute("role","group");bar.setAttribute("aria-label","Page actions");D.body.appendChild(bar);
  bar.addEventListener("click",e=>{const b=e.target.closest("[data-r17o1-px]");if(b&&b.dataset.r17o1Px!==""){const el=PX[+b.dataset.r17o1Px];if(el)el.click();return}
   if(e.target.closest("[data-r17o1-abmore]")){const rest=PX.map((el,i)=>[el,i]).filter(a=>a[0]!==PX[0]);openSheet("Actions",`<div class="r17o1-sheetsec">${rest.map(([el,i])=>`<button type="button" class="r17o1-act" data-r17o1-px="${i}">${E((el.getAttribute("aria-label")||el.textContent||"Action").replace(/\s+/g," ").trim())}</button>`).join("")}</div>`,"acts")}})}
 PX=[prim].concat(acts.filter(b=>b!==prim));PX.forEach(n=>n.classList.add("r17o1-px"));
 const label=(prim.getAttribute("aria-label")||prim.textContent||"Do it").replace(/\s+/g," ").trim();
 bar.innerHTML=`<button type="button" class="btn primary" data-r17o1-px="0">${E(label)}</button>${PX.length>1?`<button type="button" class="btn r17o1-ab-more" data-r17o1-abmore aria-haspopup="dialog" aria-label="More actions, ${PX.length-1}">${svg(IC.dots,20)}<span>${PX.length-1}</span></button>`:""}`;
 bar.hidden=false;R.classList.add("r17o1-hasbar")}

/* ============ 8. tab bars: selected tab in view, fade edges only where there is more to scroll ============ */
function fades(el){const l=el.scrollLeft>4,r=el.scrollLeft+el.clientWidth<el.scrollWidth-4;el.classList.toggle("r17o1-fl",l);el.classList.toggle("r17o1-fr",r)}
function tabs(){if(!PH.matches)return;qa("#view .vsw,#view [role=tablist]").forEach(el=>{fades(el);if(!el.dataset.r17o1){el.dataset.r17o1="1";el.addEventListener("scroll",()=>fades(el),{passive:true})}
 const on=q1('[aria-selected="true"],[aria-current="page"],[aria-pressed="true"]',el);if(on&&el.scrollWidth>el.clientWidth){const l=on.offsetLeft-(el.clientWidth-on.offsetWidth)/2;if(Math.abs(el.scrollLeft-l)>8)el.scrollTo({left:Math.max(0,l)})}})}
D.addEventListener("change",e=>{if(e.target.matches&&e.target.matches(".views>input"))setTimeout(tabs,30)});

/* ============ 9. popover sheets: swipe down from the handle area, drawer title in the sticky header ============ */
const SHEETS="#drawer,.pop,.nx-pop,.nw-pop,.pk2-pop,.r15-grppop";
function wirePops(){qa(SHEETS).forEach(p=>{if(!p.hasAttribute("popover")||p.dataset.r17o1sw)return;p.dataset.r17o1sw="1";
 swipe(p,{handle:".dctl,.r17o1-dt",close:()=>{p.style.transform="";try{p.hidePopover()}catch(e){}},scroller:()=>p})})}
function drawerTitle(){const d=q1("#drawer");if(!d)return;const bar=q1(":scope>.dctl",d);if(!bar||q1(".r17o1-dt",bar))return;
 let t="";for(const h of qa("h1,h2,h3,.ftitle",d)){if(h.closest(".dctl"))continue;t=(h.textContent||"").replace(/\s+/g," ").trim();if(t)break}
 if(!t)return;const s=D.createElement("span");s.className="r17o1-dt";s.textContent=t;bar.insertBefore(s,bar.firstChild)}
D.addEventListener("toggle",e=>{const p=e.target;if(!p||!PH.matches)return;if(e.newState==="open"){if(p.id==="drawer"){S&&(S.k2&&(S.k2.dfull=false));p.classList.remove("dfull");setTimeout(drawerTitle,0)}wirePops()}},true);

/* ============ 10. tablet: collapsed icon rail ============ */
let tabWas=null;
function tablet(){const c=q1("#railCollapse");if(!c)return;
 if(TAB.matches){if(!c.checked){tabWas=false;c.checked=true;c.dispatchEvent(new Event("change"))}}
 else if(tabWas===false&&!PH.matches&&!c.dataset.r17o1x){/* leaving tablet to desktop: restore the previous choice */ if(W.innerWidth>1100){c.checked=false;c.dispatchEvent(new Event("change"))}tabWas=null}}

/* ============ lifecycle ============ */
let pend=0;
function soon(){if(pend)return;pend=requestAnimationFrame(()=>{pend=0;try{setTitle();markTab();buildBar();tabs()}catch(e){}})}
function mode(){R.classList.toggle("r17o1-ph",PH.matches);R.classList.toggle("r17o1-tablet",TAB.matches);if(!PH.matches){closeSheet(true);R.classList.remove("r17o1-lock")}vv();tablet();soon()}
function init(n){const tb=q1(".topbar"),v=q1("#view");if(!tb||!v){if(n<200)setTimeout(()=>init(n+1),50);return}
 buildTop();buildTab();wirePops();mode();
 try{new MutationObserver(soon).observe(v,{childList:true})}catch(e){}
 try{const dr=q1("#drawer");if(dr)new MutationObserver(()=>{if(PH.matches){setTimeout(drawerTitle,0)}}).observe(dr,{childList:true})}catch(e){}
 setInterval(()=>{if(!D.hidden&&PH.matches)markTab()},4000);
 W.addEventListener("hashchange",soon);D.addEventListener("click",()=>setTimeout(soon,120),true)}
meta();
PH.addEventListener("change",mode);TAB.addEventListener("change",mode);
if(W.visualViewport){W.visualViewport.addEventListener("resize",vvSoon);W.visualViewport.addEventListener("scroll",vvSoon)}
D.addEventListener("focusin",vvSoon);D.addEventListener("focusout",()=>setTimeout(vvSoon,120));
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",()=>init(0));else init(0);
/* lazy: pickers that are created after load also become sheets via the shared CSS; only swipe wiring needs a nudge */
D.addEventListener("click",()=>setTimeout(()=>{if(PH.matches)wirePops()},60),true);
})();
