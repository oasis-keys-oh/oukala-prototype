/* ===== Round 17, Agent P (part 2 of 3): the guided tour engine and presenter bar.
   Reads R17P.STORIES (part 1). Opens each stop with go(screen), optionally selects a tab, spotlights an element, and shows a slim glass bar at the
   bottom center (the top right belongs to notifications). Back, Next, progress dots, Notes, Moments, Spotlight, Present, Exit to screen, Esc and the
   arrow keys. Present mode hides clutter chrome and enlarges base type. Everything is lazy and guarded; no work happens at startup except one
   listener set and the Tour control in the top bar. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v===undefined||v===null?d:v}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>Array.prototype.slice.call((r||D).querySelectorAll(s));
const E=U.esc;
const R=W.R17P=W.R17P||{};
const reduced=()=>G(()=>W.matchMedia("(prefers-reduced-motion: reduce)").matches,false);
const svg=(d,n)=>`<svg width="${n||16}" height="${n||16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const IC={back:"M15 6l-6 6 6 6",next:"M9 6l6 6-6 6",notes:"M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",wow:"M12 3l2.2 5.6 5.8.5-4.4 3.8 1.4 5.8L12 15.8 7 18.7l1.4-5.8L4 9.1l5.8-.5z",spot:"M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 4v3M12 17v3M4 12h3M17 12h3",present:"M3 5h18v11H3zM8 21h8M12 16v5",exit:"M9 4H5v16h4M16 8l4 4-4 4M20 12H9",tour:"M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14",caret:"M6 15l6-6 6 6"};

/* ---------------------------------------------------------------- state ---------------------------------------------------------------- */
const ST=R.st={story:null,i:0,stops:[],panel:"",spot:true,present:false,hideBadges:false,collapsed:false,prevPersona:null,popup:null,active:false};
const KEY="oukala-r17p-state";
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({story:ST.active?ST.story:null,i:ST.i,present:ST.present,spot:ST.spot,hideBadges:ST.hideBadges,prev:ST.prevPersona}))}catch(e){}};
const load=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||"null")}catch(e){return null}};
const storyObj=()=>R.story&&R.story(ST.story);
const stopNow=()=>ST.stops[ST.i]||null;

/* ---------------------------------------------------------------- persona ---------------------------------------------------------------- */
function curPersona(){return G(()=>S.persona,"exec")}
function setPersona(k){if(!k||curPersona()===k)return true;const ok=G(()=>NAVX.persona.set(k),false);return !!ok}
function restorePersona(){const p=ST.prevPersona;ST.prevPersona=null;if(p&&p!==curPersona()){G(()=>NAVX.persona.set(p));G(()=>render())}}
R.setPersona=setPersona;

/* ---------------------------------------------------------------- target resolution ---------------------------------------------------------------- */
const vis=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>4&&r.height>4};
function cardByTitle(t){const want=String(t).toLowerCase();const cs=qa("#view .card");let first=null;
 for(const c of cs){const h=q1("h1,h2,h3,h4,header,.ch,.ctitle",c);const tx=((h&&h.textContent)||"").trim().toLowerCase();if(tx&&tx.indexOf(want)>=0){if(vis(c))return c;if(!first)first=c}}return first}
function activePane(){const v=q1("#view .views");if(!v)return null;const ins=qa(":scope > input[type=radio]",v);let i=ins.findIndex(x=>x.checked);if(i<0)i=0;const ps=qa(":scope > .panes > .pane",v);return ps[i]||null}
function resolveTarget(sel){if(!sel)return null;
 try{if(sel==="hero")return q1("#view .hero");
  if(sel==="pane")return activePane();
  if(sel.indexOf("card:")===0)return cardByTitle(sel.slice(5));
  return q1(sel,q1("#view")||D)||q1(sel)}catch(e){return null}}
R.resolveTarget=resolveTarget;
/* select a tab on the current screen by label (start-of-text match, case-insensitive); returns the label element or null */
function findTab(label){if(!label)return null;const want=String(label).toLowerCase();
 const labs=qa("#view .views .vsw label, #view [role=tab]");
 return labs.find(l=>l.textContent.trim().toLowerCase().indexOf(want)===0)||null}
function applyTab(label){const l=findTab(label);if(!l)return false;try{l.click()}catch(e){return false}return true}
R.findTab=findTab;R.applyTab=applyTab;

/* ---------------------------------------------------------------- spotlight ---------------------------------------------------------------- */
let spotEl=null,spotTimer=0,spotTarget=null;
function ensureSpot(){if(spotEl&&D.body.contains(spotEl))return spotEl;spotEl=D.createElement("div");spotEl.id="r17pSpot";spotEl.className="r17p-spot";spotEl.setAttribute("aria-hidden","true");D.body.appendChild(spotEl);return spotEl}
function placeSpot(){const el=ensureSpot();
 if(!ST.active||!ST.spot||!spotTarget||!D.contains(spotTarget)){el.classList.remove("on");return}
 const r=spotTarget.getBoundingClientRect();if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight){el.classList.remove("on");return}
 const pad=8,x=Math.max(4,r.left-pad),y=Math.max(4,r.top-pad),w=Math.min(innerWidth-8-x,r.width+pad*2),h=Math.min(r.height+pad*2,Math.max(60,innerHeight-8-y));
 el.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;el.classList.add("on")}
function scrollToTarget(el){try{const r=el.getBoundingClientRect();const barH=bar?bar.getBoundingClientRect().height+26:0;const top=96,avail=Math.max(160,innerHeight-barH-top);
  const y=r.height<=avail?r.top-(top+(avail-r.height)/2):r.top-top;if(Math.abs(y)>8)W.scrollBy({top:y,behavior:(reduced()||Math.abs(y)>innerHeight*1.5)?"auto":"smooth"})}catch(e){}}
function aimSpot(sel,scroll){spotTarget=resolveTarget(sel);
 if(spotTarget&&scroll)scrollToTarget(spotTarget);
 placeSpot();clearInterval(spotTimer);spotTimer=setInterval(()=>{if(!ST.active||!ST.spot){clearInterval(spotTimer);placeSpot();return}
  if(!spotTarget||!D.contains(spotTarget)){spotTarget=resolveTarget(stopNow()&&stopNow().sel)}placeSpot()},350);return !!spotTarget}
["scroll","resize"].forEach(ev=>W.addEventListener(ev,()=>{if(ST.active&&ST.spot)placeSpot()},{passive:true,capture:true}));

/* ---------------------------------------------------------------- bar ---------------------------------------------------------------- */
let bar=null,live=null;
function mount(){if(bar&&D.body.contains(bar))return bar;
 bar=D.createElement("section");bar.id="r17pBar";bar.className="r17p-bar glass";bar.setAttribute("role","region");bar.setAttribute("aria-label","Guided tour presenter bar");
 bar.innerHTML=`<div class="r17p-panel" id="r17pPanel" hidden></div>
 <div class="r17p-cap" id="r17pCap"></div>
 <div class="r17p-ctl">
  <button type="button" class="btn r17p-nav" data-r17p="back" aria-label="Previous stop">${svg(IC.back)}<span>Back</span></button>
  <div class="r17p-mid"><span class="r17p-count" id="r17pCount" aria-hidden="true"></span><div class="r17p-dots" id="r17pDots" role="group" aria-label="Stops"></div></div>
  <button type="button" class="btn primary r17p-nav" data-r17p="next" aria-label="Next stop"><span id="r17pNextL">Next</span>${svg(IC.next)}</button>
  <div class="r17p-tools" role="group" aria-label="Presenter tools">
   <button type="button" class="btn quiet r17p-t" data-r17p="notes" aria-pressed="false" title="Presenter notes and likely questions">${svg(IC.notes)}<span>Notes</span></button>
   <button type="button" class="btn quiet r17p-t" data-r17p="moments" aria-pressed="false" title="One-click live moments">${svg(IC.wow)}<span>Moments</span></button>
   <button type="button" class="btn quiet r17p-t" data-r17p="spot" aria-pressed="true" title="Dim the page and ring the target">${svg(IC.spot)}<span>Spotlight</span></button>
   <button type="button" class="btn quiet r17p-t" data-r17p="present" aria-pressed="false" title="Hide clutter chrome and enlarge type for screen share">${svg(IC.present)}<span>Present</span></button>
   <button type="button" class="btn quiet r17p-t" data-r17p="fold" aria-pressed="false" aria-label="Show or hide the stop text" title="Show or hide the stop text">${svg(IC.caret)}</button>
   <button type="button" class="btn r17p-t r17p-exit" data-r17p="exit" title="Leave the tour and stay on this screen (Esc)">${svg(IC.exit)}<span>Exit to screen</span></button>
  </div>
 </div>`;
 D.body.appendChild(bar);
 live=D.createElement("div");live.id="r17pLive";live.className="sr";live.setAttribute("aria-live","polite");D.body.appendChild(live);return bar}
function unmount(){if(bar){bar.remove();bar=null}if(live){live.remove();live=null}if(spotEl)spotEl.classList.remove("on");clearInterval(spotTimer)}

function proofHtml(sp){const keys=[].concat(sp.proof||[]);return keys.map(k=>{const p=R.proof(k);return `<span class="r17p-proof${p.ok?"":" r17p-bad"}" data-r17p-proof="${E(k)}" tabindex="0" title="${E("Read live from "+p.src+" when this stop opened")}"><b class="num">${E(p.v)}</b> <span>${E(p.l)}</span><small>${E(p.src)}</small></span>`}).join("")}
function notesHtml(sp){const pts=(sp.notes||[]).map(t=>`<li>${E(R.fill(t))}</li>`).join("");const qa=(sp.qa||[]).map(x=>`<div class="r17p-qa"><b>${E(x[0])}</b><p>${E(R.fill(x[1]))}</p></div>`).join("");
 return `<div class="r17p-ph"><span class="eyebrow">Presenter notes</span><span class="r17p-phb"><button type="button" class="btn quiet r17p-pop" data-r17p="pop">Pop out to a second window</button><button type="button" class="btn quiet" data-r17p="closepanel" aria-label="Close panel">${svg("M6 6l12 12M18 6L6 18",14)}</button></span></div>
 <div class="r17p-cols"><div><h3>Talking points</h3><ul>${pts||"<li>No notes for this stop.</li>"}</ul></div><div><h3>Likely questions</h3>${qa||'<p class="muted small">None recorded.</p>'}</div></div>`}
function momentsHtml(){const ms=G(()=>R.moments(),[]);
 return `<div class="r17p-ph"><span class="eyebrow">Moments: live, on the real code paths</span><span class="r17p-phb"><button type="button" class="btn quiet" data-r17p="closepanel" aria-label="Close panel">${svg("M6 6l12 12M18 6L6 18",14)}</button></span></div>
 <div class="r17p-mgrid">${ms.map(m=>`<button type="button" class="btn r17p-mbtn" data-r17p-moment="${E(m.id)}" title="${E(m.sub)}"><b>${E(m.label)}</b><small>${E(m.sub)}</small></button>`).join("")}</div><div class="r17p-mres" id="r17pMres" role="status" aria-live="polite"></div>`}

function update(){if(!bar)return;const st=storyObj(),sp=stopNow();if(!st||!sp)return;
 const n=ST.stops.length;
 q1("#r17pCap").innerHTML=`<div class="r17p-eb"><span>${E(st.title)}</span><span class="r17p-sep" aria-hidden="true">/</span><span>Stop ${ST.i+1} of ${n}</span>${ST.persona?`<span class="pill info r17p-who">Viewing as ${E(ST.persona)}</span>`:""}</div>
  <h2 class="r17p-head" id="r17pHead">${E(sp.head)}</h2>
  <div class="r17p-two"><p><b>What you are seeing</b>${E(sp.see)}</p><p><b>Why it matters</b>${E(sp.why)}</p></div>
  <div class="r17p-row"><span class="r17p-proofs" id="r17pProofs">${proofHtml(sp)}</span>${sp.tryit?`<button type="button" class="btn r17p-try" data-r17p-try="${E(sp.tryit.act)}">${svg(IC.wow,14)}<span><small>Try it</small> ${E(sp.tryit.label)}</span></button>`:""}<span class="r17p-trymsg" id="r17pTryMsg" role="status" aria-live="polite"></span></div>`;
 const dots=q1("#r17pDots");if(dots.dataset.sig!==ST.story+":"+n){dots.dataset.sig=ST.story+":"+n;dots.innerHTML=ST.stops.map((s,i)=>`<button type="button" class="r17p-dot" data-r17p-go="${i}" aria-label="Stop ${i+1}: ${E(s.head)}" title="${E(s.head)}"></button>`).join("")}
 qa(".r17p-dot",dots).forEach((d,i)=>{d.classList.toggle("done",i<ST.i);if(i===ST.i)d.setAttribute("aria-current","step");else d.removeAttribute("aria-current")});
 q1("#r17pCount").textContent=(ST.i+1)+" / "+n;
 const back=q1('[data-r17p="back"]',bar),next=q1('[data-r17p="next"]',bar);back.disabled=ST.i===0;q1("#r17pNextL").textContent=ST.i===n-1?"Finish":"Next";
 q1('[data-r17p="notes"]',bar).setAttribute("aria-pressed",String(ST.panel==="notes"));q1('[data-r17p="moments"]',bar).setAttribute("aria-pressed",String(ST.panel==="moments"));
 q1('[data-r17p="spot"]',bar).setAttribute("aria-pressed",String(ST.spot));q1('[data-r17p="present"]',bar).setAttribute("aria-pressed",String(ST.present));q1('[data-r17p="fold"]',bar).setAttribute("aria-pressed",String(ST.collapsed));
 bar.classList.toggle("r17p-fold",ST.collapsed);
 const pn=q1("#r17pPanel");if(ST.panel){pn.hidden=false;if(pn.dataset.k!==ST.panel+":"+ST.story+":"+sp.id){pn.dataset.k=ST.panel+":"+ST.story+":"+sp.id;pn.innerHTML=ST.panel==="notes"?notesHtml(sp):momentsHtml()}}else{pn.hidden=true;pn.dataset.k=""}
 bar.classList.toggle("r17p-open",!!ST.panel);
 if(live)live.textContent="Stop "+(ST.i+1)+" of "+n+": "+sp.head;
 updatePopup()}
R.update=update;

/* second window with presenter notes (kept in step by update) */
function popHtml(sp,st){const pts=(sp.notes||[]).map(t=>`<li>${E(R.fill(t))}</li>`).join("");const qa=(sp.qa||[]).map(x=>`<p><b>${E(x[0])}</b><br>${E(R.fill(x[1]))}</p>`).join("");
 return `<p style="margin:0;color:#667;font-size:12px">${E(st.title)} · stop ${ST.i+1} of ${ST.stops.length}</p><h1 style="font-size:20px;margin:4px 0 10px">${E(sp.head)}</h1><p><b>What you are seeing.</b> ${E(sp.see)}</p><p><b>Why it matters.</b> ${E(sp.why)}</p><h2 style="font-size:15px">Talking points</h2><ul>${pts}</ul><h2 style="font-size:15px">Likely questions</h2>${qa}`}
function updatePopup(){const p=ST.popup;if(!p)return;try{if(p.closed){ST.popup=null;return}const sp=stopNow(),st=storyObj();if(sp&&st)p.document.getElementById("r17pPop").innerHTML=popHtml(sp,st)}catch(e){ST.popup=null}}
function openPopup(){try{const p=W.open("","r17pNotes","width=440,height=680");if(!p){G(()=>toast("The browser blocked the second window","warn"));return}
 p.document.title="Presenter notes";p.document.body.style.cssText="font:14px/1.5 system-ui,sans-serif;margin:16px;color:#14232a";p.document.body.innerHTML='<div id="r17pPop"></div>';ST.popup=p;updatePopup()}catch(e){G(()=>toast("The second window could not open","warn"))}}

/* ---------------------------------------------------------------- showing a stop ---------------------------------------------------------------- */
let seq=0;
function show(i){const n=ST.stops.length;if(!n)return;ST.i=Math.max(0,Math.min(n-1,i));const sp=stopNow(),st=storyObj();const my=++seq;
 const want=sp.persona||st.persona;ST.persona=G(()=>R.PERSONA_NOTE[want],want)||"";
 setPersona(want);
 mount();
 try{go(sp.screen,sp.arg)}catch(e){G(()=>console.warn("r17p go failed",sp.screen,e&&e.message))}
 if(sp.tab)applyTab(sp.tab);
 update();save();
 const finish=()=>{if(my!==seq)return;if(sp.tab&&!q1("#view .views input:checked")){}aimSpot(sp.sel,true);refreshProofs()};
 setTimeout(finish,reduced()?60:220);setTimeout(()=>{if(my===seq){aimSpot(sp.sel,false);refreshProofs()}},900)}
function refreshProofs(){const sp=stopNow();const h=q1("#r17pProofs");if(sp&&h)h.innerHTML=proofHtml(sp)}
R.show=show;

function start(storyId,i){const st=R.story(storyId);if(!st){G(()=>toast("Unknown story","warn"));return false}
 const stops=R.stopsOf(st);if(!stops.length){G(()=>toast("This story has no stops that can open yet","warn"));return false}
 if(ST.active&&ST.story!==storyId){/* switching stories keeps the first remembered persona */}
 if(ST.prevPersona==null)ST.prevPersona=curPersona();
 ST.story=storyId;ST.stops=stops;ST.active=true;if(ST.foldSet===undefined){ST.foldSet=1;ST.collapsed=G(()=>W.matchMedia("(max-width:700px)").matches,false)}ST.panel=ST.panel==="moments"?"moments":"";D.documentElement.classList.add("r17p-on");
 const bd=q1("#r17pBar");if(bd){bd.remove();bar=null}
 show(i||0);G(()=>audit("started tour",st.title));return true}
function exit(reason){if(!ST.active)return;ST.active=false;seq++;const st=storyObj();ST.panel="";spotTarget=null;
 if(ST.popup){try{ST.popup.close()}catch(e){}ST.popup=null}
 unmount();D.documentElement.classList.remove("r17p-on");restorePersona();save();
 G(()=>audit(reason==="finish"?"finished tour":"left tour",st?st.title:""));
 if(reason==="finish")G(()=>toast("Tour finished","good"));miniSync()}
R.start=start;R.exit=exit;
const next=()=>{if(ST.i>=ST.stops.length-1)exit("finish");else show(ST.i+1)};
const back=()=>{if(ST.i>0)show(ST.i-1)};

/* ---------------------------------------------------------------- present mode ---------------------------------------------------------------- */
function setPresent(on){ST.present=!!on;D.documentElement.classList.toggle("r17p-present",ST.present);D.documentElement.classList.toggle("r17p-nobadge",ST.present&&ST.hideBadges);
 save();if(bar)update();miniSync();setTimeout(()=>placeSpot(),80)}
function setBadges(on){ST.hideBadges=!!on;D.documentElement.classList.toggle("r17p-nobadge",ST.present&&ST.hideBadges);save()}
R.setPresent=setPresent;R.setBadges=setBadges;
let mini=null;
function miniSync(){const need=ST.present&&!ST.active;
 if(need&&!(mini&&D.body.contains(mini))){mini=D.createElement("div");mini.id="r17pMini";mini.className="r17p-mini glass";mini.innerHTML=`<span>Presenting</span><button type="button" class="btn quiet" data-r17p="unpresent">Exit presenting</button>`;D.body.appendChild(mini)}
 else if(!need&&mini){mini.remove();mini=null}}

/* ---------------------------------------------------------------- events ---------------------------------------------------------------- */
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r17p],[data-r17p-go],[data-r17p-try],[data-r17p-moment],[data-r17p-start],[data-r17p-launch]");if(!t)return;
 if(t.dataset.r17pStart){e.preventDefault();start(t.dataset.r17pStart,+t.dataset.i||0);return}
 if(t.hasAttribute("data-r17p-launch")){e.preventDefault();go("r17p_tour");return}
 if(t.dataset.r17pGo!=null){show(+t.dataset.r17pGo);return}
 if(t.dataset.r17pTry){runAct(t.dataset.r17pTry,"r17pTryMsg");return}
 if(t.dataset.r17pMoment){runAct(t.dataset.r17pMoment,t.closest("#view")?"r17pHubRes":"r17pMres");return}
 const k=t.dataset.r17p;
 if(k==="next")next();else if(k==="back")back();else if(k==="exit")exit();
 else if(k==="notes"||k==="moments"){ST.panel=ST.panel===k?"":k;if(bar){q1("#r17pPanel").dataset.k="";update()}}
 else if(k==="closepanel"){ST.panel="";update()}
 else if(k==="spot"){ST.spot=!ST.spot;save();update();if(ST.spot)aimSpot(stopNow().sel,true);else placeSpot()}
 else if(k==="present")setPresent(!ST.present);
 else if(k==="unpresent")setPresent(false);
 else if(k==="fold"){ST.foldSet=1;ST.collapsed=!ST.collapsed;update();setTimeout(placeSpot,50)}
 else if(k==="pop")openPopup()});
function runAct(id,outId){const out=q1("#"+outId);if(out)out.textContent="Running...";
 const fin=(txt)=>{const o=q1("#"+outId);if(!o)return;o.textContent=txt;
  const sp=stopNow();if(ST.active&&sp&&outId!=="r17pHubRes"&&G(()=>S.screen,"")!==sp.screen){const b=D.createElement("button");b.type="button";b.className="btn quiet r17p-undo";b.setAttribute("data-r17p-go",String(ST.i));b.textContent="Return to this stop";o.appendChild(b)}};
 Promise.resolve(G(()=>R.runAct(id),null)).then(r=>fin(r?(r.ok?"":"Not run: ")+r.summary:"Not available")).catch(err=>fin("Not run: "+(err&&err.message||err)))}
const typing=t=>t&&((t.tagName==="INPUT"&&!/^(radio|checkbox|button|submit|reset|range|file|color)$/i.test(t.type||""))||/^(TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable||(t.getAttribute&&t.getAttribute("role")==="slider"));
D.addEventListener("keydown",e=>{if(!ST.active&&!ST.present)return;
 if(e.key==="Escape"){if(ST.active){if(G(()=>q1("[popover]:popover-open"),null)||typing(e.target))return;exit();e.stopPropagation()}else if(ST.present&&!G(()=>q1("[popover]:popover-open"),null))setPresent(false);return}
 if(!ST.active||e.altKey||e.ctrlKey||e.metaKey||typing(e.target))return;
 if(e.key==="ArrowRight"){e.preventDefault();next()}else if(e.key==="ArrowLeft"){e.preventDefault();back()}});

/* ---------------------------------------------------------------- Tour control in the top bar (after every render) ---------------------------------------------------------------- */
function ensureLaunch(){const tr=q1(".tb-right");if(!tr||q1("#r17pLaunch",tr))return;
 const b=D.createElement("button");b.type="button";b.id="r17pLaunch";b.className="btn quiet r17p-launch";b.setAttribute("data-r17p-launch","");b.title="Guided tours: stories, moments and rehearsal";b.setAttribute("aria-label","Tour: guided stories and demo tools");
 b.innerHTML=`${svg(IC.tour,16)}<span class="lbl-long">Tour</span>`;tr.insertBefore(b,tr.firstChild)}
const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];R15D.after.push(ensureLaunch);
/* the hub screen asks the engine to refresh its own proof chips after render */
R.afterRender=()=>{if(ST.active)setTimeout(()=>{refreshProofs();placeSpot()},120)};
R15D.after.push(()=>R.afterRender());

/* routes: #tour and #demo open the hub (R15 routing owns the hash) */
G(()=>{const R15=W.R15=W.R15||{};R15.alias=R15.alias||{};R15.alias.tour={to:"r17p_tour"};R15.alias.demo={to:"r17p_tour"}});
G(()=>{if(W.NAVX&&NAVX.alias){NAVX.alias.tour="r17p_tour";NAVX.alias.demo="r17p_tour";NAVX.alias["demo mode"]="r17p_tour"}});

/* resume after a data reset or reload */
setTimeout(()=>{const s=load();if(!s)return;ST.spot=s.spot!==false;ST.hideBadges=!!s.hideBadges;ST.prevPersona=s.prev||null;
 if(s.present)setPresent(true);
 if(s.story&&G(()=>R.story(s.story),null)){start(s.story,s.i||0);ST.prevPersona=s.prev||ST.prevPersona}},2200);
})();
