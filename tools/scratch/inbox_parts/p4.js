
/* ---------- toasts, banners, simulated arrivals ---------- */
const short=(s,n)=>{s=String(s||"");return s.length>(n||48)?s.slice(0,(n||48)-1)+"…":s};
function undoToast(verb,it,Ps){ensureHosts();let box=document.getElementById("inbxUndo");if(!box){box=document.createElement("div");box.id="inbxUndo";box.setAttribute("role","region");box.setAttribute("aria-label","Undo");document.body.appendChild(box)}
 const el=document.createElement("div");el.className="inbx-toast glass";el.dataset.ids=Ps.map(p=>p.it.id).join("|");el.innerHTML=`<span class="inbx-tk">${svgI("task",16)}</span><span class="inbx-tm"><b>${H(verb)}</b>${it?" "+H(short(it.title,56)):""}<small>Sends to the owning module in ${UNDO_MS/1000} seconds unless you undo.</small></span><button class="btn" data-inbx-undo>Undo</button><i class="inbx-tbar" style="animation-duration:${UNDO_MS}ms"></i>`;
 box.appendChild(el);el._ps=Ps;setTimeout(()=>{el.remove()},UNDO_MS+400)}
function undoGone(id){document.querySelectorAll("#inbxUndo .inbx-toast").forEach(t=>{const ids=(t.dataset.ids||"").split("|").filter(x=>x!==id);t.dataset.ids=ids.join("|");if(!ids.length||!ids.some(i=>PEND[i]))setTimeout(()=>t.remove(),400)})}
function prefOf(kind){const d={approval:{app:true,digest:true,push:true},action:{app:false,digest:true,push:false},mention:{app:true,digest:false,push:true}};return Object.assign({},d[kind]||d.approval,I.prefs[kind]||{})}
function quietNow(){const q=I.quiet;if(!q.on)return false;const d=new Date(),m=d.getHours()*60+d.getMinutes(),f=q.from.split(":"),t=q.to.split(":"),a=+f[0]*60+ +f[1],b=+t[0]*60+ +t[1];return a>b?(m>=a||m<b):(m>=a&&m<b)}
function banner(it){ensureHosts();const p=prefOf(it.kind);if(!p.app)return false;if(quietNow()&&!(I.quiet.urgent!==false&&it.urgent))return false;const box=document.getElementById("inbxBanners");
 const el=document.createElement("div");el.className="inbx-banner glass";el.dataset.id=it.id;el.setAttribute("role","group");el.setAttribute("aria-label","New: "+it.title);
 el.innerHTML=`<span class="inbx-ic ${it.kind}">${svgI(it.ic,18)}</span><div class="inbx-bm"><b>${H(it.title)}</b><small>${it.sim?"Simulated demo event. ":""}${H(it.cat)}${it.amt!=null?" · "+money0(it.amt):""} · ${it.urgent?"Urgent":"New"}</small><div class="row" style="gap:8px;margin-top:8px">${it.kind==="approval"&&it.can.approve&&!it.needNote?`<button class="btn primary" data-inbx-ban="approve">Approve</button>`:""}<button class="btn" data-inbx-ban="review">Review</button><button class="btn quiet" data-inbx-ban="open">${it.sim?"See in Needs you":"Open"}</button></div></div><button class="btn quiet inbx-bx" data-inbx-ban="x" aria-label="Dismiss">&times;</button>`;
 box.appendChild(el);while(box.children.length>3)box.firstChild.remove();let tm=setTimeout(()=>el.remove(),15000);el.addEventListener("mouseenter",()=>clearTimeout(tm));el.addEventListener("mouseleave",()=>{tm=setTimeout(()=>el.remove(),6000)});
 live((it.sim?"Simulated demo event. ":"")+it.title);return true}
let simTm=0;function scheduleSim(){clearTimeout(simTm);simTm=setTimeout(()=>{if(I.sim&&S.persona==="exec"&&!document.hidden&&I.simItems.filter(x=>x._p==="exec").length<8){const it=simPush();CACHE=null;banner(it);refreshAll()}scheduleSim()},38000+Math.random()*30000)}
let polled=false;function poll(){const list=collect();if(!polled){list.forEach(x=>I.seenBanner[x.id]=1);polled=true;updateBell();return}
 list.forEach(x=>{if(I.seenBanner[x.id])return;I.seenBanner[x.id]=1;if(x.urgent&&x.kind==="approval")banner(x)});updateBell()}

/* ---------- delegation and policies (act through the owning modules) ---------- */
function isoPlus(days){const d=new Date(Date.UTC(2026,9,6+days));return d.toISOString().slice(0,10)}
function nextWeekday(name){const wd={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6}[String(name||"").toLowerCase()];if(wd==null)return isoPlus(3);let k=(wd-2+7)%7;if(k===0)k=7;return isoPlus(k)}
function createDele(o){const me=ME();if(!o.to||o.to===me)return{ok:false,why:"Pick someone other than yourself to cover."};const r={id:"dr"+(I.dele.length+1),owner:me,to:o.to,from:o.from||TODAY_ISO,until:o.until||isoPlus(3),limit:o.limit!=null&&o.limit!==""&&+o.limit>0?+o.limit:null,scope:"Approvals that can be delegated",on:true,applied:0,mod:false,at:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
 I.dele.push(r);audit("Inbox: delegation rule",me+" to "+r.to+" from "+r.from+" until "+r.until+(r.limit?" up to "+money0(r.limit):""));applyDele(r);bump();refreshAll();return{ok:true,rule:r}}
function applyDele(r){if(!(r.on&&r.from<=TODAY_ISO&&r.until>=TODAY_ISO))return 0;let n=0;
 if(r.limit==null&&!r.mod&&window.FLOWX){const x=viaForm("apx_ooo",()=>clickVia({"data-apx-ooo":"1"}),{who:r.owner,to:r.to,from:r.from,until:r.until,scope:"all"});if(x.ok){r.mod=true;n++}}
 CACHE=null;collect(true).forEach(it=>{if(!covers(r,it)||I.delegated&&I.delegated[it.id])return;const a=ADP[it.src];if(a&&a.delegate){const x=a.delegate(it,r.to,"Out of office delegation until "+r.until);if(x&&x.ok!==false){I.delegated=I.delegated||{};I.delegated[it.id]=r.id;r.applied++;n++}}});
 if(n)audit("Inbox: delegation applied",r.to+" now covers "+n+" item"+(n>1?"s":""));return n}
function runPolicy(p){const hits=polHits(p);hits.forEach(it=>decide(it.id,"approve",{note:"Auto-approved by policy: "+p.name},{via:"policy:"+p.id,quiet:true}));
 const Ps=hits.map(h=>PEND[h.id]).filter(Boolean);if(Ps.length){undoToast("Policy approved "+Ps.length,null,Ps);audit("Inbox: policy run",p.name+" · "+Ps.length+" item"+(Ps.length>1?"s":""))}bump();refreshAll();return Ps.length}

/* ---------- events ---------- */
const inField=t=>t&&t.closest&&t.closest("input,textarea,select,[contenteditable=true]");
const hostOf=t=>t&&t.closest&&t.closest("#inbxPanel,#inbxFocus");
function setUI(id,mode){I.ui=mode?{id,mode}:null;I.anim=0;redrawCards();}
function redrawCards(){renderPanel(true);renderFocus();document.querySelectorAll("#drawer [data-inbx-card]").forEach(el=>{const it=byIdSafe(el.dataset.inbxCard)||DR[el.dataset.inbxCard];if(it)el.outerHTML=cardHTML(it,{big:true});});const ui=I.ui;if(ui){const f=document.querySelector("#drawer [data-inbx-note],#drawer [data-inbx-to]");if(f&&!hostOf(f))try{f.focus()}catch(e){}}}
const DR={};
function actOn(act,id){const it=byIdSafe(id)||byId(id);if(!it)return;
 if(act==="open"){flush();closePanel();closeFocus();try{closeDrawer()}catch(e){}setTimeout(()=>{try{it.open()}catch(e){toast("Could not open that record","warn")}},30);audit("Inbox: opened",it.title);return}
 if(act==="approve"){if(!it.can.approve){toast(it.blk||"This item cannot be approved from the inbox. Open it to decide.","warn");return}if(it.needNote){setUI(id,"approve");return}const r=decide(id,"approve");if(r&&r.ok===false)toast(r.why,"warn");closeDrawerCard(id);return}
 if(act==="reject"){if(!it.can.reject){toast(it.rejectWhy||"This module cannot reject from the inbox.","warn");return}setUI(id,"reject");return}
 if(act==="delegate"){if(!it.can.delegate){toast(it.delegateWhy||"This item cannot be delegated from the inbox.","warn");return}setUI(id,"delegate");return}
 if(act==="snooze"){setUI(id,"snooze");return}}
function closeDrawerCard(id){const d=document.querySelector('#drawer [data-inbx-card="'+id+'"]');if(d)try{closeDrawer()}catch(e){}}
function moveCur(dir){const L=visible();if(!L.length)return;let i=L.findIndex(x=>x.id===I.cur);i=i<0?0:Math.max(0,Math.min(L.length-1,i+dir));I.cur=L[i].id;I.ui=null;I.anim=1;I.focusReq="card";renderPanel(false);renderFocus();live("Item "+(i+1)+" of "+L.length+": "+L[i].title);const row=document.querySelector('.inbx-row.cur');if(row)row.scrollIntoView&&row.scrollIntoView({block:"nearest"})}
document.addEventListener("click",e=>{const T=e.target;if(!T.closest)return;let t;
 if(t=T.closest("#inbxBell")){isOpen(panel)?closePanel():openPanel();return}
 if(t=T.closest("[data-inbx-act]")){actOn(t.dataset.inbxAct,t.dataset.id);return}
 if(t=T.closest("[data-inbx-pick]")){I.cur=t.dataset.inbxPick;I.ui=null;I.anim=1;I.focusReq="card";renderPanel(true);renderFocus();return}
 if(t=T.closest("[data-inbx-nav]")){moveCur(t.dataset.inbxNav==="next"?1:-1);return}
 if(t=T.closest("[data-inbx-tab]")){I.tab=t.dataset.inbxTab;I.cur=null;I.ui=null;I.focusReq="tab";renderPanel(false);renderFocus();return}
 if(T.closest("[data-inbx-close]")){closePanel();return}
 if(T.closest("[data-inbx-focus]")){openFocus();return}
 if(T.closest("[data-inbx-focus-close]")){closeFocus();return}
 if(T.closest("[data-inbx-cancel]")){I.ui=null;I.focusReq="card";redrawCards();return}
 if(t=T.closest("[data-inbx-snooze]")){decide(t.dataset.id,"snooze",{h:+t.dataset.inbxSnooze});closeDrawerCard(t.dataset.id);return}
 if(t=T.closest("[data-inbx-undo]")){const el=t.closest(".inbx-toast");let n=0;(el._ps||[]).forEach(P=>{if(undoOne(P.it.id))n++});el.remove();if(n){I.cur=(el._ps[0]||{}).it&&el._ps[0].it.id;bump();refreshAll();live("Undone. "+n+" item"+(n>1?"s are":" is")+" back in your queue.");toast("Undone. Nothing was sent.","info")}return}
 if(t=T.closest("[data-inbx-ban]")){const el=t.closest(".inbx-banner"),id=el.dataset.id,k=t.dataset.inbxBan;if(k==="x"){el.remove();return}
  if(k==="approve"){const r=decide(id,"approve");if(r.ok===false)toast(r.why,"warn");el.remove();return}
  if(k==="review"||k==="open"){el.remove();I.cur=id;I.tab="all";openPanel();renderPanel();return}}
 if(t=T.closest("[data-inbx-bulk]")){if(t.dataset.inbxBulk==="clear"){I.sel={};refreshAll()}else bulkDialog(Object.keys(I.sel).filter(k=>I.sel[k]));return}
 if(t=T.closest("[data-inbx-bulkgo]")){const ids=(t.dataset.ids||"").split("|").filter(Boolean);const n=decideMany(ids,"approve","Bulk approved within safe rules");I.sel={};try{closeDrawer()}catch(e){}if(n)toast(n+" approved. You have 8 seconds to undo.","good");return}
 if(T.closest("[data-inbx-selsafe]")){const ok=bulkCheck(collect().filter(x=>x.kind==="approval").map(x=>x.id)).ok;I.sel={};ok.forEach(x=>I.sel[x.id]=true);refreshAll();return}
 if(T.closest("[data-inbx-settings]")){closePanel();closeFocus();S.v.inbx_v=5;go("inbox");return}
 if(T.closest("[data-inbx-open]")){openPanel();return}
 if(t=T.closest("[data-inbx-item]")){openItemDrawer(t.dataset.inbxItem);return}
 if(t=T.closest("[data-inbx-bmax]")){I.bulkMax=+t.dataset.inbxBmax;bulkDialog(Object.keys(I.sel).filter(k=>I.sel[k]));return}
 if(t=T.closest("[data-inbx-simnow]")){const it=simPush();CACHE=null;banner(it);refreshAll();return}
 if(!hostOf(T)&&isOpen(panel)&&!T.closest("#inbxBell,#inbxBanners,#inbxUndo,#drawer,.pop,[popover],#toasts,dialog"))closePanel()},true);
document.addEventListener("change",e=>{const t=e.target;if(!t.matches)return;
 if(t.matches("[data-inbx-sel]")){I.sel[t.dataset.inbxSel]=t.checked;renderPanel(true);renderFocus();return}
 if(t.matches("[data-inbx-simtoggle]")){I.sim=t.checked;toast(I.sim?"Simulated demo events are on.":"Simulated demo events are off.","info");audit("Inbox: demo events",I.sim?"on":"off");refreshAll();return}
 if(t.matches("[data-inbx-ev]"))return});
document.addEventListener("toggle",e=>{const t=e.target;if(t.matches&&t.matches("[data-inbx-ev]")&&hostOf(t)){I.evOpen=t.open}},true);
document.addEventListener("submit",e=>{const f=e.target.closest&&e.target.closest("[data-inbx-form]");if(!f)return;e.preventDefault();const mode=f.dataset.inbxForm,id=f.dataset.id;const note=(f.querySelector("[data-inbx-note]")||{}).value||"",to=(f.querySelector("[data-inbx-to]")||{}).value||"";
 const err=f.querySelector("[data-inbx-err]");const r=decide(id,mode,{note:note.trim(),to});if(r.ok===false){if(err){err.textContent=r.why;err.hidden=false}return}closeDrawerCard(id)});
document.addEventListener("keydown",e=>{
 const open=isOpen(panel)||isOpen(focusEl);const inDr=!!(e.target.closest&&e.target.closest("#drawer [data-inbx-card]"));
 if(e.key==="Escape"){if(I.ui&&(open||inDr)){e.preventDefault();I.ui=null;I.focusReq="card";redrawCards();return}if(isOpen(focusEl)){e.preventDefault();closeFocus();return}if(isOpen(panel)){e.preventDefault();closePanel();return}return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(open&&e.target.closest&&e.target.closest('[role=tablist]')&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){const tabs=[...document.querySelectorAll("#"+(isOpen(focusEl)?"inbxFocus":"inbxPanel")+" [role=tab]")];let i=tabs.findIndex(x=>x===e.target.closest("[role=tab]"));i=(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;e.preventDefault();I.tab=tabs[i].dataset.inbxTab;I.cur=null;I.focusReq="tab";renderPanel(false);renderFocus();return}
 if(!open||inField(e.target))return;
 const k=e.key.toLowerCase();const it=curItem();
 if(k==="j"||e.key==="ArrowDown"){e.preventDefault();moveCur(1);return}if(k==="k"||e.key==="ArrowUp"){e.preventDefault();moveCur(-1);return}
 if(!it)return;
 if(k==="a"){e.preventDefault();actOn("approve",it.id)}else if(k==="r"){e.preventDefault();actOn("reject",it.id)}else if(k==="d"){e.preventDefault();actOn("delegate",it.id)}else if(k==="s"){e.preventDefault();actOn("snooze",it.id)}else if(k==="o"){e.preventDefault();actOn("open",it.id)}},true);
/* simple swipe on touch: left skips, right goes back (approval is always an explicit tap) */
let tx=0,ty=0;document.addEventListener("touchstart",e=>{const c=e.target.closest&&e.target.closest(".inbx-card");if(!c||!hostOf(c))return;tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
document.addEventListener("touchend",e=>{if(!tx)return;const c=e.target.closest&&e.target.closest(".inbx-card");const dx=(e.changedTouches[0].clientX-tx),dy=Math.abs(e.changedTouches[0].clientY-ty);tx=0;if(!c||Math.abs(dx)<80||dy>50)return;moveCur(dx<0?1:-1)},{passive:true});
window.addEventListener("resize",()=>{if(isOpen(panel))placePanel()});
window.addEventListener("pagehide",()=>flush());
document.addEventListener("toggle",e=>{if(e.target===panel&&e.newState==="closed")bell&&bell.setAttribute("aria-expanded","false")},true);
