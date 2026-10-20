
/* ---------- drawer context: detect which record a drawer shows and how to reopen it ---------- */
const DR={cur:null,click:null};
let CTX=null;
const SKIPA=/^data-(nx|dnd|nav$|vw$|bt-|dexpand|lr-|popover|k$)/;
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;if(t.closest("#drawer>.dctl,[data-nx-star],#nxPal,.nx-pop"))return;
 let el=t,depth=0,found=null;while(el&&el!==document.body&&depth<7){const a={};let n=0;for(const at of el.attributes||[]){if(at.name.indexOf("data-")===0&&!SKIPA.test(at.name)&&at.value.length<140){a[at.name]=at.value;n++}}if(n){found=a;break}el=el.parentElement;depth++}
 DR.click={t:now(),attrs:found,scr:S.screen}},true);
function withCtx(ctx,fn,self,args){const prev=CTX;CTX=ctx;try{return fn.apply(self,args)}finally{CTX=prev}}
function drawerTitle(d){let t="";const hs=qa("h1,h2,h3,.ftitle",d);for(const h of hs){if(h.closest(".dctl"))continue;t=(h.textContent||"").replace(/\s+/g," ").trim();if(t)break}
 if(!t){const e=d.querySelector(".eyebrow");t=e?(e.textContent||"").replace(/\s+/g," ").trim():""}return t.slice(0,120)}
const TYPEPAT=[[/\bINC\d+/,"Incident"],[/\bCHG\d+/,"Change"],[/\bPRB\d+/,"Problem"],[/\b(RITM|REQ)\d+/,"Request"],[/\bINV-\d+/,"Invoice"],[/\bPR\d\b/,"Project"],[/\bKB\d+|\bKB-\d+/,"Article"],[/\bRX\d+/,"RAID item"],[/\bSOW\b|\bCTR?-?\d+/,"Contract"],[/\bRB-?\d+/,"Runbook"],[/\bSLO-?\d+/,"SLO"],[/\bREL-?\d+/,"Release"],[/\bDEM-?\d+|\bD\d{3}\b/,"Demand"]];
function guessType(title,attrs,d){const hay=title+" "+Object.values(attrs||{}).join(" ");for(const p of TYPEPAT){if(p[0].test(hay))return p[1]}
 const e=d&&d.querySelector(".eyebrow, .pill");const et=e?(e.textContent||"").replace(/\s+/g," ").trim():"";if(et&&et.length<=28&&!/^(close|full screen)/i.test(et))return et.replace(/^\W+|\W+$/g,"");return "Record"}
function hash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)}
function entryFromDrawer(d,title){const c=CTX;
 if(c&&c.kind){return {id:c.kind+":"+c.key,kind:c.kind,type:c.type||"Record",key:c.key,title:c.title||title,sub:c.sub||labelOf(S.screen),op:c.op||null,scr:c.scr||S.screen}}
 if(c&&c.fn){const ok=c.args.every(a=>/^(string|number|boolean)$/.test(typeof a)&&String(a).length<90);
  if(ok){const key=c.fn+":"+c.args.join("|");return {id:"call:"+key,kind:"call",type:guessType(title,{a:c.args.join(" ")},d),key,title,sub:labelOf(S.screen),op:{fn:c.fn,args:c.args},scr:S.screen}}}
 const k=DR.click;if(k&&k.attrs&&now()-k.t<1800){const key=hash(JSON.stringify(k.attrs));return {id:"dom:"+key,kind:"dom",type:guessType(title,k.attrs,d),key,title,sub:labelOf(S.screen),op:{attrs:k.attrs},scr:k.scr||S.screen}}
 return {id:"search:"+hash(title.toLowerCase()),kind:"search",type:guessType(title,null,d),key:title.toLowerCase(),title,sub:labelOf(S.screen),scr:S.screen}}
function decorateDrawer(ent){const d=q1("#drawer");if(!d)return;const bar=d.querySelector(":scope>.dctl");if(!bar)return;let b=bar.querySelector(".nx-dstar");
 if(!ent){if(b)b.remove();return}
 const html=starBtn("drawer","nx-dstar",ent.title);if(b)b.outerHTML=html;else bar.insertAdjacentHTML("afterbegin",html)}
function afterDrawer(){const d=q1("#drawer");if(!d)return;DR.cur=null;
 if(d.querySelector("form.fform")){decorateDrawer(null);return}
 const title=drawerTitle(d);if(!title){decorateDrawer(null);return}
 const ent=entryFromDrawer(d,title);DR.cur=ent;visit(ent);decorateDrawer(ent)}
const _od=W.openDrawer;
W.openDrawer=function(html){const r=_od.apply(this,arguments);try{afterDrawer()}catch(e){}return r};

/* wrap the named open-a-record functions once everything else has loaded */
let wrapped=false;
function wrapGlobals(){if(wrapped)return;wrapped=true;
 const explicit={
  recDrawer:(id)=>{const n=G(()=>N(id))||G(()=>KGN.find(x=>x.id===id));const T=n?G(()=>(KGN.find(x=>x.id===id)?KT[n.t]:TYPES[n.t])):null;return {kind:"record",key:id,type:T?T[0]:"Record",title:n?n.n:id}},
  person360:(name)=>({kind:"person",key:name,type:"Person",title:name,sub:(G(()=>who(name))||{}).role||""}),
  meetingDrawer:(id)=>{const m=G(()=>MEETINGS.find(x=>x.id===id));return {kind:"meeting",key:id,type:"Meeting",title:m?m.t:id}}};
 Object.keys(explicit).forEach(n=>{const f=W[n];if(typeof f!=="function")return;W[n]=function(){const a=arguments;const c=G(()=>explicit[n].apply(null,a));return withCtx(c,f,this,a)}});
 const skip=/^(open|close)Drawer$|Form/;
 Object.getOwnPropertyNames(W).forEach(n=>{if(!/Drawer$/.test(n)||skip.test(n)||explicit[n])return;const f=W[n];if(typeof f!=="function"||f.__nx)return;
  const w=function(){const a=[].slice.call(arguments);return withCtx({fn:n,args:a},f,this,arguments)};w.__nx=1;try{W[n]=w}catch(e){}});
 /* object APIs: process library, data atlas, module map */
 if(W.PROCLIB&&PROCLIB.open&&!PROCLIB.open.__nx){const f=PROCLIB.open;PROCLIB.open=function(id){const p=G(()=>PROCLIB.get(id));return withCtx({kind:"process",key:id,type:"Process",title:p?p.name:id,sub:p&&p.familyName||""},f,this,arguments)};PROCLIB.open.__nx=1}
 if(W.ATLAS&&ATLAS.focus&&!ATLAS.focus.__nx){const f=ATLAS.focus;ATLAS.focus=function(id){const r=f.apply(this,arguments);const en=G(()=>PLAT.ent(id));if(en)visit({id:"entity:"+id,kind:"entity",type:"Data entity",key:id,title:en.label||id,sub:"Data model"});return r};ATLAS.focus.__nx=1}
 if(W.MODMAP&&MODMAP.select&&!MODMAP.select.__nx){const f=MODMAP.select;MODMAP.select=function(id){const r=f.apply(this,arguments);const m=G(()=>MODMAP.modules.find(x=>x.id===id));if(m)visit({id:"module:"+id,kind:"module",type:"Module",key:id,title:m.name||m.sn||id,sub:"Process flow"});return r};MODMAP.select.__nx=1}
}

/* ---------- stars ---------- */
function isFavRef(ref){if(!ref)return false;const s=st();
 if(ref==="drawer")return !!(DR.cur&&s.fav.some(f=>f.id===DR.cur.id));
 const i=ref.indexOf(":"),k=ref.slice(0,i),v=ref.slice(i+1);
 if(k==="screen")return s.fav.some(f=>f.id===ref);
 if(k==="hist"||k==="fav")return s.fav.some(f=>f.id===v);
 return s.fav.some(f=>f.id===ref)}
function starBtn(ref,cls,name){const on=isFavRef(ref);return `<button type="button" class="nx-star ${cls||""}" data-nx-star="${E(ref)}" aria-pressed="${on}" aria-label="${on?"Remove":"Add"} ${E(name||"this")} ${on?"from":"to"} favorites" title="${on?"Remove from favorites":"Add to favorites"}">${SVG(ICO.star,16,1.8)}</button>`}
function syncStars(){qa("[data-nx-star]").forEach(b=>{const on=isFavRef(b.dataset.nxStar);if(b.getAttribute("aria-pressed")!==String(on)){b.setAttribute("aria-pressed",String(on));const nm=(b.getAttribute("aria-label")||"").replace(/^(Add|Remove) | (to|from) favorites$/g,"");b.setAttribute("aria-label",(on?"Remove ":"Add ")+nm+(on?" from":" to")+" favorites");b.title=on?"Remove from favorites":"Add to favorites"}});
 const n=st().fav.length;qa(".nx-favcount").forEach(x=>{x.textContent=n;x.hidden=!n})}
function decorateHero(){const h=q1("#view .hero,#view .hero-x");if(!h||h.querySelector(".nx-hstar"))return;h.insertAdjacentHTML("beforeend",starBtn("screen:"+S.screen,"nx-hstar",labelOf(S.screen)))}

/* ---------- navigation HTML (called by ui.js navHTML) ---------- */
const phoneMQ=matchMedia("(max-width:900px)");
const collapsed=()=>!phoneMQ.matches&&!!(q1("#railCollapse")&&q1("#railCollapse").checked);
function typeIcon(t){t=String(t||"");if(/person|people|contractor/i.test(t))return ICO.user;if(/process|workflow/i.test(t))return ICO.flow;if(/data|field|entity|table/i.test(t))return ICO.table;if(/metric|measure/i.test(t))return ICO.chart;if(/knowledge|article|book/i.test(t))return ICO.doc;if(/module/i.test(t))return ICO.plat;return ICO.doc}
const BADGE={inv:3,tower:1};
function itemHTML(id){const s=screenRow(id);if(!s)return"";const m=resolve(id),hint=hintOf(id),cur=S.screen===id;
 return `<div class="navit" data-nx-it="${id}"><button class="navi" data-nav="${id}" ${cur?'aria-current="page"':""} title="${E(tip(id))}">${IC(s[2])}<span class="nx-t"><span class="nx-l">${E(m.l)}</span>${hint?`<small class="nx-h">${E(hint)}</small>`:""}</span>${BADGE[id]?`<b class="badge">${BADGE[id]}</b>`:""}</button>${starBtn("screen:"+id,"nx-rowstar",m.l)}</div>`}
function favRow(f){const scr=f.kind==="screen"&&screenRow(f.key);const name=f.label||(scr?labelOf(f.key):f.title);const icon=scr?IC(scr[2]):IC(typeIcon(f.type));const cur=scr&&S.screen===f.key;
 const meta=scr?"":`<small class="nx-h">${E(f.type)}${f.sub?" · "+E(f.sub):""}</small>`;
 return `<div class="navit nx-fav${cur?" is-cur":""}" data-dnd-id="${E(f.id)}" data-nx-fav="${E(f.id)}">${grip}<button class="navi" type="button" data-nx-open="${E(f.id)}" title="${E(scr?tip(f.key):f.type+": "+f.title)}">${icon}<span class="nx-t"><span class="nx-l" data-nx-lab>${E(name)}</span>${meta}</span></button><button type="button" class="nx-pen" data-nx-ren="${E(f.id)}" aria-label="Rename ${E(name)}" title="Rename">${SVG(ICO.pen,14,1.9)}</button><button type="button" class="nx-star nx-rowstar" data-nx-star="fav:${E(f.id)}" aria-pressed="true" aria-label="Remove ${E(name)} from favorites" title="Remove from favorites">${SVG(ICO.star,16,1.8)}</button></div>`}
function favsHTML(){const s=st();return `<section class="nx-favs" data-nx-favs aria-label="Favorites"><div class="nx-fh"><span class="nx-fht">${SVG(ICO.star,14,2)}<b>Favorites</b><em class="nx-favcount">${s.fav.length}</em></span></div>${s.fav.length?`<div class="nx-favlist" data-dnd="nxfav" data-dnd-scope="nxfav">${s.fav.map(favRow).join("")}</div>`:`<p class="nx-empty">Star any screen or record to keep it here.</p>`}</section>`}
function groupHTML(g,cur){const ids=groupItems(g);if(!ids.length)return"";S.navOpen=S.navOpen||{};const open=S.navOpen[g]!==undefined?S.navOpen[g]:cur===g;let sub="";
 const body=ids.map(id=>{const m=resolve(id);let h="";if(m.sub&&m.sub!==sub){sub=m.sub;h=`<span class="navsub">${E(sub)}</span>`}else if(!m.sub)sub="";return h+itemHTML(id)}).join("");
 return `<details class="navgd" data-ng="${g}" ${open?"open":""}><summary title="${E(GROUPS[GID[g]][3])}"><span class="nx-gi">${SVG(ICO[g]||ICO.new,15,1.9)}</span><span class="nx-gl">${E(gLabel(g))}</span><em class="nx-gc">${ids.length}</em></summary>${body}</details>`}
function flatHTML(){const s=st();let h=`<button class="navi" type="button" data-nx-search title="Search (Ctrl or Cmd + K)">${IC(ICO.search)}<span>Search</span></button>`;
 const one=id=>{const sc=screenRow(id);return sc?`<button class="navi" data-nav="${id}" ${S.screen===id?'aria-current="page"':""} title="${E(tip(id))}">${IC(sc[2])}<span>${E(labelOf(id))}</span></button>`:""};
 h+=one("home");
 s.fav.slice(0,6).forEach(f=>{if(f.kind==="screen"&&screenRow(f.key)){if(f.key!=="home")h+=`<button class="navi nx-favi" type="button" data-nx-open="${E(f.id)}" title="Favorite: ${E(f.label||labelOf(f.key))}">${IC(screenRow(f.key)[2])}<span>${E(f.label||labelOf(f.key))}</span></button>`}else h+=`<button class="navi nx-favi" type="button" data-nx-open="${E(f.id)}" title="Favorite: ${E(favName(f))}">${IC(typeIcon(f.type))}<span>${E(favName(f))}</span></button>`});
 h+=`<div class="nx-sep" role="separator"></div>`;
 const cur=screenRow(S.screen)?resolve(S.screen).g:null;
 GROUPS.forEach(g=>{if(g[0]==="home"||!groupItems(g[0]).length)return;h+=`<button class="navi nx-gbtn${cur===g[0]?" is-cur":""}" type="button" data-nx-grp="${g[0]}" aria-haspopup="true" title="${E(g[1])}">${IC(g[2])}<span>${E(g[1])}</span></button>`});
 h+=`<div class="nx-sep" role="separator"></div><button class="navi" type="button" popovertarget="nxHistPop" title="History">${IC(ICO.clock)}<span>History</span></button>`;return h}
NAVX.html=function(){st();if(collapsed())return flatHTML();
 const cur=screenRow(S.screen)?resolve(S.screen).g:null;
 return navHelpBtn()+itemHTML("home")+favsHTML()+GROUPS.map(g=>g[0]==="home"?"":groupHTML(g[0],cur)).join("")};
function refreshFavs(){const n=q1("#nav");if(!n)return;if(collapsed()){try{renderNav()}catch(e){}return}
 const old=n.querySelector("[data-nx-favs]");if(old){old.outerHTML=favsHTML()}drawFavPop()}

/* collapsed rail: a group icon opens a flyout with its screens */
function openFly(g,btn){let f=q1("#nxFly");if(!f){f=document.createElement("div");f.id="nxFly";f.setAttribute("popover","auto");f.className="nx-fly glass";document.body.appendChild(f)}
 const ids=groupItems(g);let sub="";
 f.innerHTML=`<div class="nx-flyh"><b>${E(gLabel(g))}</b><small>${E(GROUPS[GID[g]][3])}</small></div>`+ids.map(id=>{const m=resolve(id),hint=hintOf(id),s=screenRow(id);let h="";if(m.sub&&m.sub!==sub){sub=m.sub;h=`<span class="navsub">${E(sub)}</span>`}else if(!m.sub)sub="";
  return h+`<div class="nx-fi${S.screen===id?" is-cur":""}"><button type="button" class="nx-fib" data-nav="${id}" title="${E(tip(id))}">${IC(s[2])}<span class="nx-t"><span class="nx-l">${E(m.l)}</span>${hint?`<small class="nx-h">${E(hint)}</small>`:""}</span></button>${starBtn("screen:"+id,"nx-rowstar",m.l)}</div>`}).join("");
 try{f.showPopover()}catch(e){}
 const r=btn.getBoundingClientRect();const h=Math.min(f.offsetHeight,innerHeight-24);f.style.left=Math.round(r.right+10)+"px";f.style.top=Math.round(Math.max(12,Math.min(r.top-8,innerHeight-h-12)))+"px"}

/* ---------- history and favorites popovers ---------- */
const HF={q:"",f:"all"};
function ago(t){const d=now()-t;if(d<60000)return"just now";if(d<3600000)return Math.round(d/60000)+" min ago";if(d<86400000)return Math.round(d/3600000)+" h ago";const dt=new Date(t);return dt.toLocaleDateString("en-US",{month:"short",day:"numeric"})}
function dur(ms){if(!ms||ms<8000)return"";const m=Math.round(ms/60000);if(m<1)return"under a minute";if(m<60)return m+" min";return Math.floor(m/60)+" h "+(m%60?m%60+" min":"")}
function dayOf(t){const d=new Date(),s0=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();if(t>=s0)return"Today";if(t>=s0-86400000)return"Yesterday";return"Earlier"}
function histRows(){const s=st(),q=HF.q.trim().toLowerCase();let L=s.hist.filter(h=>(HF.f==="all"||(HF.f==="mod"?h.kind==="screen":h.kind!=="screen"))&&(!q||(h.title+" "+h.type+" "+(h.sub||"")).toLowerCase().indexOf(q)>=0));
 if(!L.length)return `<p class="nx-empty">${q?"Nothing in your history matches that.":"Nothing here yet. Screens and records you open are remembered."}</p>`;
 let last="",out="";L.forEach(h=>{const d=dayOf(h.t);if(d!==last){last=d;out+=`<div class="nx-hday eyebrow" role="presentation">${d}</div>`}
  const sc=h.kind==="screen"&&screenRow(h.key);const name=sc?labelOf(h.key):h.title;const du=dur(h.dur);
  out+=`<div class="nx-hrow" role="listitem"><button type="button" class="nx-hopen" data-nx-hopen="${E(h.id)}" title="${E(h.title)}"><span class="nx-hi">${sc?IC(sc[2]):IC(typeIcon(h.type))}</span><span class="nx-ht"><b>${E(name)}</b><small>${E(h.kind==="screen"?"Module":h.type)}${h.sub&&h.kind!=="screen"?" · "+E(h.sub):""} · ${ago(h.t)}${du?" · "+du:""}${h.n>1?" · "+h.n+" visits":""}</small></span></button>${starBtn("hist:"+h.id,"nx-rowstar",name)}</div>`});
 return out}
function drawHist(){const p=q1("#nxHistPop");if(!p)return;const l=q1("#nxHistList",p);if(l)l.innerHTML=histRows();const b=q1("[data-nx-back]",p);if(b)b.disabled=STK.length<2;qa("[data-nx-hf]",p).forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.nxHf===HF.f)))}
function drawFavPop(){const p=q1("#nxFavPop");if(!p)return;const l=q1("#nxFavList",p);if(!l)return;const s=st();
 l.innerHTML=s.fav.length?s.fav.map(f=>{const scr=f.kind==="screen"&&screenRow(f.key);const name=f.label||(scr?labelOf(f.key):f.title);return `<div class="nx-hrow" role="listitem"><button type="button" class="nx-hopen" data-nx-open="${E(f.id)}"><span class="nx-hi">${scr?IC(scr[2]):IC(typeIcon(f.type))}</span><span class="nx-ht"><b>${E(name)}</b><small>${scr?E(gLabel(resolve(f.key).g)):E(f.type+(f.sub?" · "+f.sub:""))}</small></span></button><button type="button" class="nx-star nx-rowstar" data-nx-star="fav:${E(f.id)}" aria-pressed="true" aria-label="Remove ${E(name)} from favorites" title="Remove from favorites">${SVG(ICO.star,16,1.8)}</button></div>`}).join(""):`<p class="nx-empty">Nothing starred yet. Use the star on any screen header, menu item or record.</p>`;
 const here=q1("[data-nx-pinhere]",p);if(here){const on=isFavRef("screen:"+S.screen);here.textContent=on?"Remove this page":"Star this page";here.setAttribute("aria-pressed",String(on))}}
function popPlace(p,btn){if(phoneMQ.matches){p.style.left=p.style.top=p.style.right="";return}const r=btn?btn.getBoundingClientRect():{right:innerWidth-24,bottom:60};const w=Math.min(p.offsetWidth||400,innerWidth-24);let left=Math.min(Math.max(12,r.right-w),innerWidth-w-12);p.style.left=left+"px";p.style.top=Math.round(r.bottom+10)+"px";p.style.right="auto"}
let lastInvoker=null;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[popovertarget=nxFavPop],[popovertarget=nxHistPop]");if(b)lastInvoker=b},true);
document.addEventListener("toggle",e=>{const p=e.target;if(e.newState!=="open")return;if(p.id==="nxHistPop"){drawHist();popPlace(p,lastInvoker);const i=q1("#nxHistQ",p);if(i&&!phoneMQ.matches)setTimeout(()=>i.focus(),30)}else if(p.id==="nxFavPop"){drawFavPop();popPlace(p,lastInvoker)}},true);
function closePops(){qa("#nxFavPop,#nxHistPop,#nxFly").forEach(p=>{try{if(p.matches(":popover-open"))p.hidePopover()}catch(e){}})}

/* ---------- chrome: popovers, phone tab bar, palette root ---------- */
function ensureChrome(){
 if(!q1("#nxFavPop")){
  const f=document.createElement("div");f.id="nxFavPop";f.setAttribute("popover","auto");f.className="nx-pop glass";f.setAttribute("aria-label","Favorites");
  f.innerHTML=`<div class="nx-ph"><div><div class="eyebrow">Favorites</div><h3>Starred for quick return</h3></div><button class="btn quiet" type="button" popovertarget="nxFavPop" popovertargetaction="hide">Close</button></div><div id="nxFavList" class="nx-plist" role="list"></div><div class="nx-pf"><button class="btn" type="button" data-nx-pinhere aria-pressed="false">Star this page</button><button class="btn quiet" type="button" popovertarget="nxHistPop">Open history</button></div>`;
  document.body.appendChild(f);
  const h=document.createElement("div");h.id="nxHistPop";h.setAttribute("popover","auto");h.className="nx-pop glass";h.setAttribute("aria-label","History");
  h.innerHTML=`<div class="nx-ph"><div><div class="eyebrow">History</div><h3>Where you have been</h3></div><button class="btn quiet" type="button" popovertarget="nxHistPop" popovertargetaction="hide">Close</button></div>
  <div class="nx-hctl"><button class="btn primary nx-back" type="button" data-nx-back title="Return to the screen or record you were on before this one">${SVG(ICO.back,16,2)}<span>Back to where I was</span></button><button class="btn quiet" type="button" data-nx-clear>Clear</button></div>
  <div class="nx-hsearch"><input id="nxHistQ" type="search" placeholder="Search your history" autocomplete="off" aria-label="Search your history"></div>
  <div class="nx-hf" role="group" aria-label="Filter history"><button type="button" class="chip" data-nx-hf="all" aria-pressed="true">All</button><button type="button" class="chip" data-nx-hf="mod" aria-pressed="false">Modules</button><button type="button" class="chip" data-nx-hf="rec" aria-pressed="false">Records</button></div>
  <div id="nxHistList" class="nx-plist" role="list"></div>`;
  document.body.appendChild(h)}
 if(!q1("#nxTab")){
  const t=document.createElement("nav");t.id="nxTab";t.className="nx-tab glass";t.setAttribute("aria-label","Quick navigation");
  t.innerHTML=`<button type="button" data-nav="home">${SVG(ICO.home,22,1.8)}<span>Home</span></button><button type="button" data-nx-search>${SVG(ICO.search,22,1.8)}<span>Search</span></button><button type="button" popovertarget="nxFavPop">${SVG(ICO.star,22,1.8)}<span>Saved</span><em class="nx-favcount">0</em></button><button type="button" popovertarget="nxHistPop">${SVG(ICO.clock,22,1.8)}<span>Recent</span></button><button type="button" data-nx-menu aria-expanded="false" aria-controls="nav">${SVG(ICO.menu,22,1.8)}<span>Menu</span></button>`;
  document.body.appendChild(t);const sc=document.createElement("div");sc.id="nxScrim";sc.setAttribute("data-nx-menu-close","");document.body.appendChild(sc)}
 if(!q1("#nxPal"))buildPalette();
 syncStars()}
function menu(on){const r=document.documentElement;const v=on==null?!r.classList.contains("nx-menu-open"):on;r.classList.toggle("nx-menu-open",v);const b=q1("[data-nx-menu]");if(b)b.setAttribute("aria-expanded",String(v));if(v){const c=q1("#nav [aria-current=page]");setTimeout(()=>{try{navReveal()}catch(e){}},60)}}
function markTab(){qa("#nxTab [data-nav]").forEach(b=>{if(b.dataset.nav===S.screen)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
/* entering phone width: the rail becomes a drawer, so it must not stay in icon-only mode */
let wasCollapsed=null;
phoneMQ.addEventListener("change",()=>{const rc=q1("#railCollapse");if(!rc)return;if(phoneMQ.matches){wasCollapsed=rc.checked;if(rc.checked){rc.checked=false;rc.dispatchEvent(new Event("change"))}}else{menu(false);if(wasCollapsed){rc.checked=true;rc.dispatchEvent(new Event("change"))}wasCollapsed=null}try{renderNav()}catch(e){}});
document.addEventListener("change",e=>{if(e.target&&e.target.id==="railCollapse")closePops()});

/* ---------- events ---------- */
function focusLab(row){const f=st().fav.find(x=>x.id===row.dataset.nxFav);if(!f)return;const btn=q1(".navi",row);const inp=document.createElement("input");inp.type="text";inp.className="nx-ren";inp.value=f.label||labelOf2(f);inp.maxLength=60;inp.setAttribute("aria-label","Rename favorite");
 row.classList.add("is-ren");btn.style.display="none";row.insertBefore(inp,btn);inp.focus();inp.select();let done=false;const fin=ok=>{if(done)return;done=true;if(ok)renameFav(f.id,inp.value);else refreshFavs()};
 inp.addEventListener("keydown",ev=>{ev.stopPropagation();if(ev.key==="Enter"){ev.preventDefault();fin(true)}else if(ev.key==="Escape"){ev.preventDefault();fin(false)}});inp.addEventListener("blur",()=>fin(true));inp.addEventListener("click",ev=>ev.stopPropagation())}
const labelOf2=f=>f.kind==="screen"&&screenRow(f.key)?labelOf(f.key):f.title;
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
 if((b=t.closest("[data-nx-star]"))){e.preventDefault();e.stopPropagation();const ref=b.dataset.nxStar,i=ref.indexOf(":"),k=i<0?ref:ref.slice(0,i),v=ref.slice(i+1);
  if(k==="screen")toggleFav(mkScreen(v));else if(k==="drawer"){if(DR.cur)toggleFav(DR.cur)}else if(k==="hist"){const h=st().hist.find(x=>x.id===v);if(h)toggleFav(h)}else if(k==="fav")removeFav(v);
  syncStars();drawFavPop();drawHist();return}
 if((b=t.closest("[data-nx-open]"))){e.preventDefault();const f=st().fav.find(x=>x.id===b.dataset.nxOpen);closePops();menu(false);openEntry(f,"fav");return}
 if((b=t.closest("[data-nx-hopen]"))){e.preventDefault();const h=st().hist.find(x=>x.id===b.dataset.nxHopen);closePops();menu(false);openEntry(h,"hist");return}
 if((b=t.closest("[data-nx-ren]"))){e.preventDefault();e.stopPropagation();focusLab(b.closest("[data-nx-fav]"));return}
 if((b=t.closest("[data-nx-grp]"))){e.preventDefault();openFly(b.dataset.nxGrp,b);return}
 if(t.closest("[data-nx-search]")){e.preventDefault();menu(false);openPalette({});return}
 if(t.closest("[data-nx-menu]")){e.preventDefault();menu();return}
 if(t.closest("[data-nx-menu-close]")){menu(false);return}
 if(t.closest("[data-nx-back]")){e.preventDefault();goBack();return}
 if(t.closest("[data-nx-clear]")){e.preventDefault();if(confirm("Clear your history on this device?"))clearHist();return}
 if((b=t.closest("[data-nx-hf]"))){HF.f=b.dataset.nxHf;drawHist();return}
 if(t.closest("[data-nx-pinhere]")){toggleFav(mkScreen(S.screen));syncStars();drawFavPop();return}
 if(t.closest("[data-nx-find-go]")){const i=q1("#nxFind");openPalette({q:i?i.value:"",describe:true});if(i)i.value="";return}
 if((b=t.closest("#nav [data-nav],.nx-fi [data-nav]"))){if(!b.closest(".nx-fav")){const home=b.dataset.nav==="home";noteOpen("nav",home?1:2);SRC="nav"}menu(false);const fl=b.closest("#nxFly");if(fl){try{fl.hidePopover()}catch(x){}}}
},true);
document.addEventListener("input",e=>{const t=e.target;if(!t)return;if(t.id==="nxHistQ"){HF.q=t.value;drawHist()}
 if(t.id==="q"){e.stopImmediatePropagation();const v=t.value;t.value="";openPalette({q:v})}},true);
document.addEventListener("focusin",e=>{const t=e.target;if(t&&t.id==="q"){const v=t.value;t.value="";openPalette({q:v});try{t.blur()}catch(x){}}});
document.addEventListener("keydown",e=>{const t=e.target;
 if(t&&t.id==="nxFind"&&e.key==="Enter"){e.preventDefault();openPalette({q:t.value,describe:true});t.value="";return}
 if(e.key==="Escape"&&document.documentElement.classList.contains("nx-menu-open")){menu(false)}
 if(e.key==="Enter"&&t&&t.id==="q"){e.stopImmediatePropagation()}
},true);
/* drag to reorder favorites uses the shared kit DND */
if(typeof DND!=="undefined"&&DND.on)DND.on("nxfav",(id,from,to,idx)=>{moveFav(id,idx);audit("Reordered favorites",id)});
