/* ============ Shared kit: registration, toasts, forms, drag and drop, small layout helpers ============ */
/* Screens register themselves with REG(). Navigation groups are listed in NAVG. */
const NAVG=[["portfolio","Portfolio and delivery"],["service","Service management"],["ops","Operations"],["know","Knowledge"],["people","People and work"],["automate","Automation"],["ai","AI and governance"],["platform","Platform"]];
const SCREEN_GROUP={trace:"portfolio",inv:"portfolio",port:"portfolio",ims:"portfolio",plan:"portfolio",fo:"people",tower:"ai",metrics:"platform",loop:"platform",log:"platform",kg:"know"};
SCREENS.forEach(s=>{if(!s[3])s[3]=SCREEN_GROUP[s[0]]||"platform"});
function REG(id,name,group,icon,render){_R[id]=render;const ex=SCREENS.find(s=>s[0]===id);if(ex){ex[1]=name;ex[2]=icon;ex[3]=group}else SCREENS.push([id,name,icon,group])}
/* Small helpers every screen can use */
const card=(title,sub,body,right,style)=>`<section class="card glass"${style?` style="${style}"`:""}><div class="cardhead"><div><h3>${title}</h3>${sub?`<span class="muted small" data-role="story">${sub}</span>`:""}</div>${right||""}</div>${body||""}</section>`;
const TL=(lbl,big,delta,cls)=>`<div class="tile glass"><span class="lbl">${lbl}</span><span class="big num" data-role="metric">${big}</span><span class="delta ${cls||"good"}">${delta}</span></div>`;
const tiles=a=>`<div class="grid g4">${a.join("")}</div>`;
const pill=(t,c)=>`<span class="pill ${c||"mute"}">${t}</span>`;
const empty=(t,s)=>`<div class="emptystate"><b>${t}</b>${s?`<span class="muted">${s}</span>`:""}</div>`;
/* Toasts: instant feedback for every action */
function toast(msg,kind){let box=$("#toasts");if(!box){box=document.createElement("div");box.id="toasts";box.setAttribute("aria-live","polite");document.body.appendChild(box)}
 const t=document.createElement("div");t.className="toast glass "+(kind||"good");t.innerHTML=`<i></i><span>${esc(msg)}</span>`;box.appendChild(t);setTimeout(()=>t.classList.add("out"),3200);setTimeout(()=>t.remove(),3700)}

/* ---------- Forms ----------
 spec = {id, title, story, submit:"Create", fields:[...], onSubmit(vals), sections:false}
 field = {k, label, type, req, help, ph, opts, min, max, step, ai:{label, fn(vals)}, show(vals), wide, unit}
 types: text, longtext, number, money, date, select, chips (single), multi (several), range, toggle, people, file
 opts: ["A","B"] or [["value","Label"],...]
*/
const FORMSPEC={},FORMST={};
const fOpt=o=>Array.isArray(o)?o:[o,o];
function fieldHTML(f,v,err,fid){const id=`${fid}_${f.k}`,val=v==null?"":v,e=err?`<small class="ferr">${esc(err)}</small>`:"",h=f.help?`<small class="fhelp">${esc(f.help)}</small>`:"";
 const aiB=f.ai?`<button type="button" class="aisug" data-fai="${fid}:${f.k}">${ico("sparkle")}${esc(f.ai.label||"Suggest")}</button>`:"";
 const lab=`<span class="flab">${esc(f.label)}${f.req?'<b aria-hidden="true"> *</b>':""}${aiB}</span>`;
 const dat=`data-fk="${fid}:${f.k}" id="${id}"`;let inner="";
 switch(f.type){
  case "longtext":inner=`<textarea class="fin" rows="${f.rows||3}" ${dat} placeholder="${esc(f.ph||"")}">${esc(val)}</textarea>`;break;
  case "number":inner=`<input class="fin" type="number" ${dat} value="${esc(val)}" ${f.min!=null?`min="${f.min}"`:""} ${f.max!=null?`max="${f.max}"`:""} ${f.step?`step="${f.step}"`:""} placeholder="${esc(f.ph||"")}">`;break;
  case "money":inner=`<span class="fmoney"><b>$</b><input class="fin" type="number" ${dat} value="${esc(val)}" min="0" step="${f.step||1000}" placeholder="${esc(f.ph||"0")}"></span>`;break;
  case "date":inner=`<input class="fin" type="date" ${dat} value="${esc(val)}">`;break;
  case "select":inner=`<select class="fin" ${dat}>${f.ph?`<option value="">${esc(f.ph)}</option>`:""}${(f.opts||[]).map(fOpt).map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(val)?"selected":""}>${esc(o[1])}</option>`).join("")}</select>`;break;
  case "chips":inner=`<div class="fchips" role="radiogroup" aria-label="${esc(f.label)}">${(f.opts||[]).map(fOpt).map(o=>`<button type="button" class="chip" data-fchip="${fid}:${f.k}:${esc(o[0])}" aria-pressed="${String(o[0])===String(val)}">${esc(o[1])}</button>`).join("")}</div>`;break;
  case "multi":inner=`<div class="fchips" role="group" aria-label="${esc(f.label)}">${(f.opts||[]).map(fOpt).map(o=>`<button type="button" class="chip" data-fmulti="${fid}:${f.k}:${esc(o[0])}" aria-pressed="${(val||[]).includes(o[0])}">${esc(o[1])}</button>`).join("")}</div>`;break;
  case "range":inner=`<div class="frange"><input type="range" class="rng" ${dat} min="${f.min||0}" max="${f.max||100}" step="${f.step||1}" value="${esc(val===""?(f.min||0):val)}"><b class="num" id="${id}_v">${esc(val===""?(f.min||0):val)}${f.unit||""}</b></div>`;break;
  case "toggle":inner=`<button type="button" class="ftog" role="switch" aria-checked="${!!val}" data-ftog="${fid}:${f.k}"><i></i><span>${val?"On":"Off"}</span></button>`;break;
  case "people":if(window.PICK&&PICK.formField){inner=PICK.formField(fid,f,val);break}inner=`<div class="fchips" role="group" aria-label="${esc(f.label)}">${PEOPLE.map(p=>`<button type="button" class="chip pchip" data-${f.multi?"fmulti":"fchip"}="${fid}:${f.k}:${esc(p[0])}" aria-pressed="${f.multi?(val||[]).includes(p[0]):p[0]===val}">${avatar(p[0],{size:24})}${esc(p[0])}</button>`).join("")}</div>`;break;
  case "file":inner=`<label class="fdrop" for="${id}"><input type="file" class="sr" ${dat} ${f.accept?`accept="${esc(f.accept)}"`:""}><span>${ico("book")}<b>${val?esc(val):esc(f.ph||"Choose a file or drop it here")}</b><small>${esc(f.help||"")}</small></span></label>`;break;
  default:inner=`<input class="fin" type="text" ${dat} value="${esc(val)}" placeholder="${esc(f.ph||"")}" autocomplete="off">`}
 return `<div class="fld ${f.wide?"wide":""} ${err?"bad":""} t-${f.type||"text"}">${f.type==="file"?"":lab}${f.type==="file"?`<span class="flab">${esc(f.label)}${f.req?'<b> *</b>':""}</span>`:""}${inner}${e}${h}</div>`}
function liveHTML(spec){try{const v=spec.live&&spec.live(FORMST[spec.id].vals,spec.id);return typeof v==="string"?v:""}catch(e){return ""}}
function refreshLive(fid){const el=document.querySelector(`[data-flive="${fid}"]`),sp=FORMSPEC[fid];if(el&&sp)el.innerHTML=liveHTML(sp)}
function formBody(spec){const st=FORMST[spec.id];return `<div class="fgrid">${spec.fields.filter(f=>!f.show||f.show(st.vals)).map(f=>f.section?`<h4 class="fsec">${esc(f.section)}</h4>`:fieldHTML(f,st.vals[f.k],st.err[f.k],spec.id)).join("")}</div>`}
function formHTML(spec,init){FORMSPEC[spec.id]=spec;if(!FORMST[spec.id]||init)FORMST[spec.id]={vals:Object.assign({},spec.defaults||{},init||{}),err:{}};if(window.PICK&&PICK.applyDefaults&&(!FORMST[spec.id].dflt||init)){FORMST[spec.id].dflt=1;PICK.applyDefaults(spec,FORMST[spec.id].vals)}
 return `<form class="fform" data-form="${spec.id}" novalidate onsubmit="return false">${spec.title?`<h3 class="ftitle">${spec.title}</h3>`:""}${spec.story?`<p class="muted fstory" data-role="story">${spec.story}</p>`:""}<div class="fbody">${formBody(spec)}</div><div class="flive" data-flive="${spec.id}">${liveHTML(spec)}</div><div class="fact"><button type="button" class="btn primary" data-fsubmit="${spec.id}">${esc(spec.submit||"Save")}</button>${spec.secondary?`<button type="button" class="btn" data-fsecond="${spec.id}">${esc(spec.secondary.label)}</button>`:""}${spec.extra||""}</div></form>`}
function openForm(spec,init){openDrawer(formHTML(spec,init||{}));audit("opened form",spec.title||spec.id)}
function refreshForm(fid){const spec=FORMSPEC[fid],el=document.querySelector(`[data-form="${fid}"] .fbody`);if(el){const a=document.activeElement,ae=a&&a.id,ss=a&&a.selectionStart,se=a&&a.selectionEnd;el.innerHTML=formBody(spec);if(ae){const n=document.getElementById(ae);if(n&&n.focus){try{n.focus();if(ss!=null&&n.setSelectionRange)n.setSelectionRange(ss,se)}catch(e){}}}}refreshLive(fid)}
function formValues(fid){return FORMST[fid]?FORMST[fid].vals:{}}
function submitForm(fid){const spec=FORMSPEC[fid],st=FORMST[fid];st.err={};spec.fields.forEach(f=>{if(f.section||(f.show&&!f.show(st.vals)))return;const v=st.vals[f.k];if(f.req&&(v==null||v===""||(Array.isArray(v)&&!v.length)))st.err[f.k]="Needed so the record tells its story";else if(f.min!=null&&v!==""&&v!=null&&f.type!=="range"&&+v<f.min)st.err[f.k]="Must be at least "+f.min})
 if(Object.keys(st.err).length){refreshForm(fid);const first=document.querySelector(`[data-form="${fid}"] .fld.bad input,[data-form="${fid}"] .fld.bad select,[data-form="${fid}"] .fld.bad textarea`);if(first)first.focus();return false}
 const res=spec.onSubmit?spec.onSubmit(Object.assign({},st.vals)):null;audit("submitted form",(spec.title||spec.id)+(res&&res.audit?" · "+res.audit:""));toast(res&&res.toast?res.toast:(spec.title||"Form")+" saved");if(!res||res.close!==false)closeDrawer();return true}
document.addEventListener("input",e=>{const t=e.target,k=t.dataset&&t.dataset.fk;if(!k)return;const [fid,f]=k.split(":");const st=FORMST[fid];if(!st)return;st.vals[f]=t.type==="number"&&t.value!==""?+t.value:t.value;if(st.err[f]){delete st.err[f]}
 if(t.type==="range"){const o=document.getElementById(t.id+"_v");const fd=FORMSPEC[fid].fields.find(x=>x.k===f);if(o)o.textContent=t.value+(fd.unit||"")}
 const spec=FORMSPEC[fid];refreshLive(fid)});
document.addEventListener("change",e=>{const t=e.target,k=t.dataset&&t.dataset.fk;if(!k)return;const [fid,f]=k.split(":");const st=FORMST[fid];if(!st)return;if(t.type==="file"){st.vals[f]=t.files&&t.files[0]?t.files[0].name:"";const spec=FORMSPEC[fid];if(spec.onFile)spec.onFile(t.files&&t.files[0],st.vals,fid)}else st.vals[f]=t.value;const dep=FORMSPEC[fid].fields.some(x=>x.show);if(t.tagName==="SELECT"||t.type==="file"||dep)refreshForm(fid);else refreshLive(fid)});
document.addEventListener("click",e=>{const t=e.target.closest("[data-fchip],[data-fmulti],[data-ftog],[data-fsubmit],[data-fai],[data-fsecond]");if(!t)return;const d=t.dataset;
 if(d.fchip){const [fid,f,v]=d.fchip.split(":");const st=FORMST[fid];st.vals[f]=st.vals[f]===v?"":v;delete st.err[f];refreshForm(fid);refreshLive(fid);return}
 if(d.fmulti){const [fid,f,v]=d.fmulti.split(":");const st=FORMST[fid],a=st.vals[f]||[];st.vals[f]=a.includes(v)?a.filter(x=>x!==v):a.concat(v);delete st.err[f];refreshForm(fid);return}
 if(d.ftog){const [fid,f]=d.ftog.split(":");const st=FORMST[fid];st.vals[f]=!st.vals[f];refreshForm(fid);const sp=FORMSPEC[fid];if(sp.live)sp.live(st.vals,fid);return}
 if(d.fsubmit){submitForm(d.fsubmit);return}
 if(d.fsecond){const sp=FORMSPEC[d.fsecond];sp.secondary.fn(FORMST[d.fsecond].vals);return}
 if(d.fai){const [fid,f]=d.fai.split(":");const spec=FORMSPEC[fid],fd=spec.fields.find(x=>x.k===f),st=FORMST[fid];const v=fd.ai.fn(st.vals);if(v!=null){st.vals[f]=v;delete st.err[f];refreshForm(fid);toast("Claude filled "+fd.label.toLowerCase()+". Review it before saving.","info");audit("accepted AI suggestion",fd.label)}return}});
const PEOPLE=[["Maya Ortiz","Portfolio lead","--p4"],["Priya Shah","Project manager","--s3"],["Dev Rao","Project manager","--u3"],["Tom Becker","Service desk lead","--e4"],["Avery Chen","Controller","--w1"],["Jordan Lee","Architect","--p2"],["Sam Patel","Platform engineer","--s2"],["Nia Brooks","Change manager","--u2"]];

/* ---------- Drag and drop ----------
 Mark lists: <div data-dnd="listName" data-dnd-scope="scopeName"> and items: <div data-dnd-id="x" tabindex="0">.
 Items in lists that share a scope can move between lists. Register DND.on(scope, (id, fromList, toList, index)=>{...}).
 Keyboard: focus an item, then Alt+ArrowUp / Alt+ArrowDown to move it; Alt+ArrowLeft / Alt+ArrowRight moves between lists.
*/
const DND={h:{},on(scope,fn){this.h[scope]=fn}};
(function(){let drag=null,suppress=false;
 const lists=sc=>[...document.querySelectorAll(`[data-dnd][data-dnd-scope="${sc}"]`)];
 function start(e,it,list){const r=it.getBoundingClientRect();const g=it.cloneNode(true);g.classList.add("dnd-ghost");g.style.width=r.width+"px";g.style.height=r.height+"px";g.style.left=r.left+"px";g.style.top=r.top+"px";document.body.appendChild(g);
  const ph=document.createElement("div");ph.className="dnd-ph";ph.style.height=r.height+"px";it.classList.add("dnd-src");
  drag={it,g,ph,id:it.dataset.dndId,from:list.dataset.dnd,scope:list.dataset.dndScope,ox:e.clientX-r.left,oy:e.clientY-r.top,over:null};document.body.classList.add("dnding");
  lists(drag.scope).forEach(l=>l.classList.add("dnd-live"));move(e)}
 function move(e){if(!drag)return;drag.g.style.transform=`translate(${e.clientX-drag.ox-parseFloat(drag.g.style.left)}px,${e.clientY-drag.oy-parseFloat(drag.g.style.top)}px) rotate(1.2deg)`;
  const el=document.elementFromPoint(e.clientX,e.clientY),list=el&&el.closest(`[data-dnd][data-dnd-scope="${drag.scope}"]`);lists(drag.scope).forEach(l=>l.classList.toggle("dnd-over",l===list));
  if(list){const items=[...list.querySelectorAll(":scope > [data-dnd-id]")].filter(x=>x!==drag.it);let before=null;for(const x of items){const b=x.getBoundingClientRect();const horiz=list.dataset.dndDir==="x";if(horiz?e.clientX<b.left+b.width/2:e.clientY<b.top+b.height/2){before=x;break}}
   if(before)list.insertBefore(drag.ph,before);else list.appendChild(drag.ph);drag.over=list}else{drag.ph.remove();drag.over=null}}
 function end(){if(!drag)return;const d=drag;drag=null;document.body.classList.remove("dnding");d.g.remove();lists(d.scope).forEach(l=>l.classList.remove("dnd-live","dnd-over"));d.it.classList.remove("dnd-src");
  if(d.over&&d.ph.parentNode){const sibs=[...d.over.querySelectorAll(":scope > [data-dnd-id],:scope > .dnd-ph")];const idx=sibs.indexOf(d.ph);d.ph.remove();suppress=true;setTimeout(()=>suppress=false,60);const fn=DND.h[d.scope];if(fn)fn(d.id,d.from,d.over.dataset.dnd,idx);audit("dragged "+d.scope,d.id+" "+d.from+" → "+d.over.dataset.dnd+" #"+(idx+1))}else d.ph.remove()}
 let pend=null;
 document.addEventListener("pointerdown",e=>{if(e.button&&e.pointerType==="mouse")return;const it=e.target.closest("[data-dnd-id]");if(!it)return;const list=it.parentElement&&it.parentElement.closest("[data-dnd]");if(!list||it.parentElement!==list)return;if(e.target.closest("input,select,textarea,a,[data-nodrag]"))return;
  pend={e,it,list,x:e.clientX,y:e.clientY,t:e.pointerType==="touch"?setTimeout(()=>{if(pend){start(pend.e,it,list);pend.began=true}},280):null}});
 document.addEventListener("pointermove",e=>{if(drag){e.preventDefault();move(e);return}if(pend&&!pend.began){const dx=e.clientX-pend.x,dy=e.clientY-pend.y;if(e.pointerType!=="touch"&&Math.hypot(dx,dy)>6){start(e,pend.it,pend.list);pend.began=true}else if(e.pointerType==="touch"&&Math.hypot(dx,dy)>10&&!pend.began){clearTimeout(pend.t);pend=null}}},{passive:false});
 const up=()=>{if(pend&&pend.t)clearTimeout(pend.t);pend=null;end()};document.addEventListener("pointerup",up);document.addEventListener("pointercancel",up);
 document.addEventListener("click",e=>{if(suppress){e.stopPropagation();e.preventDefault()}},true);
 document.addEventListener("keydown",e=>{if(!e.altKey||!/^Arrow/.test(e.key))return;const it=e.target.closest&&e.target.closest("[data-dnd-id]");if(!it)return;const list=it.parentElement.closest("[data-dnd]");if(!list)return;e.preventDefault();const sc=list.dataset.dndScope,ls=lists(sc),items=[...list.querySelectorAll(":scope > [data-dnd-id]")],i=items.indexOf(it),fn=DND.h[sc];if(!fn)return;
  let to=list.dataset.dnd,ni=i;if(e.key==="ArrowUp"||e.key==="ArrowLeft"&&ls.length<2)ni=Math.max(0,i-1);else if(e.key==="ArrowDown"||e.key==="ArrowRight"&&ls.length<2)ni=Math.min(items.length-1,i+1);else{const li=ls.indexOf(list),nl=ls[li+(e.key==="ArrowRight"?1:-1)];if(!nl)return;to=nl.dataset.dnd;ni=0}
  const id=it.dataset.dndId;fn(id,list.dataset.dnd,to,(to===list.dataset.dnd&&ni>i)?ni+1:ni);audit("moved by keyboard "+sc,id);setTimeout(()=>{const n=document.querySelector(`[data-dnd-id="${id}"]`);if(n)n.focus()},30)})})();
const grip=`<i class="grip" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b></i>`;

/* ---------- Module hooks ----------
 SEARCHX.push(()=>[{g:"Group",t:"Title",m:"meta",c:"--accent",f:()=>go("screen"),k:"keywords"}]) adds records to global search.
 ASKX.push(q=>{ if(!/regex/i.test(q)) return false; go("screenId"); say(q,{t:"Reply with <b>html</b>",steps:["step one","step two"]}); return true }) lets chat answer module intents.
*/
const SEARCHX=[],ASKX=[];
const _siK=searchIndex;searchIndex=function(){const o=_siK();SEARCHX.forEach(fn=>{try{fn().forEach(x=>o.push(x))}catch(e){}});return o};
const _askK=ask;ask=function(q){for(const fn of ASKX){try{if(fn(q))return}catch(e){}}return _askK(q)};

/* ===== Round 14 (Agent F): formula copy buttons, truncation tooltips ===== */
(function(){
 const ok=()=>typeof document!=="undefined"&&document.body;
 function copyText(t){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t)}catch(e){}return new Promise((res,rej)=>{try{const a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;left:-9999px;top:0";document.body.appendChild(a);a.select();const r=document.execCommand("copy");a.remove();r?res():rej()}catch(e){rej(e)}})}
 /* a formula longer than a short expression gets a Copy button (popover, metric card, drawer); the hover box stays read-only */
 function enhance(root){if(!ok())return;const list=(root||document).querySelectorAll?(root||document).querySelectorAll(".formula:not([data-fc])"):[];let n=0;
  for(const f of list){if(++n>300)break;if(f.closest(".fhov,svg,table,.fk-h"))continue;const txt=(f.textContent||"").replace(/\s+/g," ").trim();if(txt.length<18)continue;
   if(!f.closest(".pop,.mcard,#drawer,dialog,.drawer,[popover],.card,.hero"))continue;
   f.dataset.fc=txt;const b=document.createElement("button");b.type="button";b.className="fcopy";b.textContent="Copy";b.setAttribute("aria-label","Copy formula to clipboard");f.appendChild(b)}}
 document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".fcopy");if(!b)return;e.stopPropagation();const f=b.closest(".formula");const t=f&&f.dataset.fc||"";
  copyText(t).then(()=>{b.textContent="Copied";b.dataset.done="1";b.setAttribute("aria-label","Formula copied")},()=>{b.textContent="Press Ctrl C"}).finally(()=>setTimeout(()=>{b.textContent="Copy";delete b.dataset.done;b.setAttribute("aria-label","Copy formula to clipboard")},1600))},true);
 document.addEventListener("toggle",e=>{if(e.newState==="open"&&e.target)enhance(e.target)},true);
 let tm=0;const sched=()=>{clearTimeout(tm);tm=setTimeout(()=>enhance(document),160)};
 function boot(){if(!ok())return setTimeout(boot,150);new MutationObserver(m=>{for(const x of m){if(x.addedNodes&&x.addedNodes.length){sched();return}}}).observe(document.body,{childList:true,subtree:true});sched()}
 if(document.readyState!=="loading")boot();else document.addEventListener("DOMContentLoaded",boot);
 window.formulaCopyEnhance=enhance;
 /* truncated text: title shows the full string the first time the pointer or keyboard focus reaches it */
 const trunc=el=>{for(let e=el,i=0;e&&e.nodeType===1&&i<4;e=e.parentElement,i++){if(e.hasAttribute("title")||e.closest("svg"))continue;const cs=getComputedStyle(e);const clamp=cs.webkitLineClamp&&cs.webkitLineClamp!=="none";const ell=cs.textOverflow==="ellipsis";
   if((ell&&e.scrollWidth>e.clientWidth+1)||(clamp&&e.scrollHeight>e.clientHeight+1)){const t=(e.innerText||e.textContent||"").replace(/\s+/g," ").trim();if(t.length>3)e.setAttribute("title",t);return}}};
 document.addEventListener("pointerover",e=>{if(e.pointerType==="touch")return;trunc(e.target)},{passive:true});
 document.addEventListener("focusin",e=>trunc(e.target));
})();
/* Round 14: skip link so keyboard users reach the page without tabbing through the whole navigation */
(function(){function add(){if(!document.body)return setTimeout(add,100);if(document.getElementById("skipLink"))return;const a=document.createElement("a");a.id="skipLink";a.className="skiplink";a.href="#view";a.textContent="Skip to main content";a.addEventListener("click",e=>{e.preventDefault();const v=document.getElementById("view");if(v){v.focus({preventScroll:false})}});document.body.insertBefore(a,document.body.firstChild)}
 if(document.readyState!=="loading")add();else document.addEventListener("DOMContentLoaded",add)})();
