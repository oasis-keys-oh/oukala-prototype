/* ===== Round 16, Agent I: shell consistency.
   1 ONE page-header actions slot (Why am I seeing this + star) on every screen
   2 Budget requests as its own sidebar section (the top-rail button is gone, "+ New" keeps the entry)
   3 Favorites: collapsed accordion in the sidebar, searchable and reorderable star dropdown in the top rail
   Everything is guarded and idempotent. Favorites already persist per persona through NAVX.fav (localStorage). ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>[...(r||D).querySelectorAll(s)];
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R16I=W.R16I=W.R16I||{};
const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];
const store={get:(k,d)=>U.store.get("oukala-r16i-"+k,d),set:(k,v)=>{U.store.set("oukala-r16i-"+k,v)}};
R16I.store=store;
const STAR="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z";
const svg=(d,s,w)=>`<svg viewBox="0 0 24 24" width="${s||16}" height="${s||16}" fill="none" stroke="currentColor" stroke-width="${w||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

/* =====================================================  1. WHY AM I SEEING THIS  ===================================================== */
/* per-screen overrides: R16I.why.set(screenId,{rule:[..],data:[..],audience:[..],owner:"Name",backup:"Name"}) */
const WHY=R16I.why={over:{},set(id,o){this.over[id]=o}};
const personaRows=()=>Object.keys(PERSONAS||{}).map(k=>Object.assign({key:k},PERSONAS[k]));
function whyModel(){
 const id=G(()=>S.screen,"home"),v=q1("#view");const res=G(()=>NAVX.resolve(id),{})||{};const gid=res.g,gl=G(()=>NAVX.groupLabel(gid),"");
 const me=G(()=>PERSONAS[S.persona],{})||{};const label=G(()=>NAVX.label(id),id);
 const rules=[...new Set(qa("[data-r16-why]",v).map(e=>e.dataset.r16Why).filter(Boolean))];
 const place=[];
 if(id==="home")place.push("Home is arranged for the "+(me.n||"current")+" role: the first cards are the decisions and numbers this role acts on first.");
 else{
  const inG=(me.groups||[]).indexOf(gid);
  if(inG>=0)place.push("The group "+gl+" is number "+(inG+1)+" of "+(me.groups||[]).length+" groups promoted for the "+me.n+" role.");
  else place.push("The group "+gl+" is not one of the groups promoted for the "+me.n+" role; it is listed under More areas or reached through search.");
  if((me.pin||[]).includes(id))place.push("Pinned at the top of the menu for the "+me.n+" role.");
 }
 if(me.readonly)place.push("The "+me.n+" role is read only, so create and approve actions are disabled here.");
 const o=WHY.over[id]||{};
 const mm=G(()=>MODMAP.modules.find(m=>m.id===id||m.scr===id),null);
 const chips=[...new Set(qa(".fchip",v).map(e=>(e.getAttribute("aria-label")||e.textContent||"").trim().replace(/\s+/g," ").replace(/\s*\d[\d.,%$ ]*(target.*)?$/i,"").slice(0,42)).filter(x=>x.length>2))].slice(0,5);
 const nm=qa('[data-role="metric"]',v).length,ntab=qa("table",v).filter(t=>t.offsetParent).length,nrow=qa("table tbody tr",v).length;
 const data=[];
 if(mm&&(mm.r||[]).length)data.push("Reads "+mm.r.slice(0,6).map(x=>x.replace(/_/g," ")).join(", ")+(mm.r.length>6?" and "+(mm.r.length-6)+" more":""));
 if(mm&&(mm.w||[]).length)data.push("Writes "+mm.w.slice(0,5).map(x=>x.replace(/_/g," ")).join(", "));
 const fi=mm&&(mm.in||[]).slice(0,3).map(f=>f.from+" ("+(f.fresh||"live")+")");if(fi&&fi.length)data.push("Fed by "+fi.join(", "));
 if(chips.length)data.push("Metrics shown: "+chips.join(", "));
 data.push(nm+" measured value"+(nm===1?"":"s")+", "+ntab+" table"+(ntab===1?"":"s")+", "+nrow+" row"+(nrow===1?"":"s")+" on this screen");
 const aud=personaRows().filter(p=>(p.groups||[]).includes(gid)||(p.pin||[]).includes(id)||(id==="home")).map(p=>p.n);
 const pr=G(()=>PROCLIB.primary&&PROCLIB.primary(id),null)||G(()=>PROCLIB.forModule&&[].concat(PROCLIB.forModule(id))[0],null)||{};
 const owner=o.owner||pr.owner||(mm&&mm.own)||G(()=>NAVX.entryOf&&0,"")||"Platform owner";
 const backup=o.backup||pr.backup||"";
 return{id,label,gl,rule:(o.rule||[]).concat(rules,place),data:(o.data||[]).concat(data),aud:o.audience||(aud.length?aud:["Everyone with access to "+gl]),owner,backup,persona:me.n||"",proc:mm&&mm.proc,mm}}
R16I.whyModel=whyModel;
function whyHTML(){const m=whyModel();
 const sec=(t,items)=>`<section class="r16-wsec" aria-label="${E(t)}"><h4>${E(t)}</h4><ul>${items.map(x=>`<li>${E(x)}</li>`).join("")}</ul></section>`;
 return `<div class="r16-wh"><div><div class="eyebrow">Why am I seeing this</div><h3 id="r16WhyT">${E(m.label)}</h3></div><button type="button" class="btn quiet" popovertarget="r16WhyPop" popovertargetaction="hide" aria-label="Close">Close</button></div>
 <p class="small muted r16-wnote">Built from platform records for the ${E(m.persona||"current")} role. Not AI text.</p>
 ${sec("Source rule",m.rule.length?m.rule:["No rule recorded for this screen."])}${sec("Data",m.data)}${sec("Audience",[m.aud.join(", ")])}
 <section class="r16-wsec" aria-label="Owner"><h4>Owner</h4><ul><li>${E(m.owner)}${m.backup?` <span class="muted">Backup: ${E(m.backup)}</span>`:""}</li></ul></section>
 <div class="row r16-wf"><button type="button" class="btn quiet" data-r16-why-go="${E(m.proc||"")}"${m.proc?"":" hidden"}>Open the process behind it</button></div>`}
function ensureWhyPop(){let p=q1("#r16WhyPop");if(p)return p;p=D.createElement("div");p.id="r16WhyPop";p.setAttribute("popover","auto");p.setAttribute("role","dialog");p.setAttribute("aria-labelledby","r16WhyT");p.className="pop glass r16-whypop";D.body.appendChild(p);
 p.addEventListener("beforetoggle",e=>{if(e.newState==="open"){p.innerHTML=whyHTML();const b=q1("#r16Why");if(b){const r=b.getBoundingClientRect();const w=Math.min(420,innerWidth-24);p.style.width=w+"px";p.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+"px";p.style.top=Math.round(r.bottom+8)+"px"}}});
 p.addEventListener("toggle",e=>{if(e.newState==="open"){const c=q1("button",p);if(c)try{c.focus({preventScroll:true})}catch(x){}}});
 p.addEventListener("click",e=>{const g=e.target.closest("[data-r16-why-go]");if(g&&g.dataset.r16WhyGo){try{p.hidePopover()}catch(x){}G(()=>PROCLIB.open?PROCLIB.open(g.dataset.r16WhyGo):go("plat_proclib"))}});return p}
/* the slot: always the first child of #view, right-aligned, same size and position on every screen */
function mountSlot(){const v=q1("#view");if(!v)return;const id=G(()=>S.screen,"home");
 qa(".nx-hstar",v).forEach(x=>x.remove());
 let slot=q1("#r16Pha");if(slot&&slot.parentNode!==v){slot.remove();slot=null}
 if(!slot){slot=D.createElement("div");slot.id="r16Pha";slot.className="r16-pha";slot.setAttribute("role","group");slot.setAttribute("aria-label","Page actions");v.insertBefore(slot,v.firstChild)}
 else if(slot!==v.firstChild)v.insertBefore(slot,v.firstChild);
 const on=G(()=>NAVX.fav.has("screen:"+id),false),lab=G(()=>NAVX.label(id),id);
 const sig=id+"|"+on+"|"+lab;if(slot.dataset.sig===sig&&slot.children.length)return;slot.dataset.sig=sig;
 slot.innerHTML=`<button type="button" class="chip r16-why-btn" id="r16Why" popovertarget="r16WhyPop" aria-haspopup="dialog" title="Why am I seeing this? Source rule, data, audience and owner">Why am I seeing this?</button><button type="button" class="nx-star r16-star" data-nx-star="screen:${E(id)}" aria-pressed="${on}" aria-label="${on?"Remove "+E(lab)+" from favorites":"Add "+E(lab)+" to favorites"}" title="${on?"Remove from favorites":"Add to favorites"}">${svg(STAR,18,1.8)}</button>`;
 ensureWhyPop()}
/* keep the star in sync when favorites change from anywhere else (menu, popover, chat) */
function syncSlotStar(){const b=q1("#r16Pha .r16-star");if(!b)return;const id=G(()=>S.screen,"home");const on=G(()=>NAVX.fav.has("screen:"+id),false);if(b.getAttribute("aria-pressed")!==String(on)){b.setAttribute("aria-pressed",String(on));const lab=G(()=>NAVX.label(id),id);b.setAttribute("aria-label",on?"Remove "+lab+" from favorites":"Add "+lab+" to favorites");b.title=on?"Remove from favorites":"Add to favorites";const s=q1("#r16Pha");if(s)s.dataset.sig=id+"|"+on+"|"+lab}}

/* =====================================================  2. TOP RAIL: no Request budget button  ===================================================== */
function cleanRail(){const b=q1("#nwRb");if(b)b.remove();qa(".nw-rb").forEach(x=>x.remove())}

/* =====================================================  3. SIDEBAR: Budget requests section + favorites accordion  ===================================================== */
const BUD=[["intake","Request budget","Intake form, one screen","M12 3v18M7 8h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h9"],["mine","My requests","Everything you asked for","M6 4h12v16H6zM9 9h6M9 13h6M9 17h3"],["queue","Review queue","Requests waiting at a stage","M4 5h16l-6 8v6l-4-2v-4z"],["decisions","Decisions","Funded, declined, returned","M5 12l4 4 10-10"]];
const RS=R16I.bud={filter:null};
const showBud=()=>{const f=G(()=>PERSONAS[S.persona].family,"decide"),ro=G(()=>PERSONAS[S.persona].readonly,false);return f!=="request"&&!ro&&G(()=>SCREENS.some(s=>s[0]==="bud_req"),false)};
function budOpen(k){RS.filter=k==="mine"?"mine":k==="decisions"?"decided":null;
 if(k==="intake"){S.v.budreq=0;go("bud_req");let n=0;const iv=setInterval(()=>{if(G(()=>BUDREQ.openForm)){clearInterval(iv);BUDREQ.openForm()}else if(++n>20)clearInterval(iv)},120);return}
 S.v.budreq=k==="queue"?0:1;go("bud_req");setTimeout(applyBudFilter,60)}
function budGroupHTML(){const cur=G(()=>S.screen)==="bud_req";S.navOpen=S.navOpen||{};const open=S.navOpen.r16bud!==undefined?S.navOpen.r16bud:cur;
 const act=RS.filter==="mine"?"mine":RS.filter==="decided"?"decisions":(S.v.budreq===1?"mine":"queue");
 return `<details class="navgd r16-budg" data-ng="r16bud" ${open?"open":""}><summary title="Ask for money and follow how it is decided"><span class="nx-gi">${svg("M12 3v18M7 8h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h9",15,1.9)}</span><span class="nx-gl">Budget requests</span><em class="nx-gc">4</em></summary>${BUD.map(b=>`<div class="navit"><button type="button" class="navi" data-r16-bud="${b[0]}" ${cur&&act===b[0]?'aria-current="page"':""} title="${E(b[2])}">${svg(b[3],21,1.8)}<span class="nx-t"><span class="nx-l">${E(b[1])}</span><small class="nx-h">${E(b[2])}</small></span></button></div>`).join("")}</details>`}
function applyBudFilter(){if(G(()=>S.screen)!=="bud_req")return;const v=q1("#view");if(!v)return;const f=RS.filter;
 let bar=q1("#r16BudBar",v);const rows=qa("table tbody tr",v).filter(r=>r.querySelector("[data-br-open]")&&r.closest("table").offsetParent);
 if(!f||!rows.length){if(bar)bar.remove();rows.forEach(r=>r.hidden=false);return}
 const me=G(()=>R15D.me().name,"Casey Rowan");let shown=0;
 rows.forEach(r=>{const t=r.textContent;const ok=f==="mine"?t.includes(me):/Funded|Declined|Returned|Approved and funded/i.test(t);r.hidden=!ok;if(ok)shown++});
 const title=f==="mine"?"My requests":"Decisions";
 const html=`<div class="r16-budbar" id="r16BudBar" role="status"><b>${title}</b><span class="muted small">${shown?shown+" of "+rows.length+" requests":(f==="mine"?"You have not raised a request yet. Use Request budget to start one.":"No request has been decided yet.")}</span><button type="button" class="btn quiet" data-r16-bud-clear>Show all requests</button></div>`;
 if(bar)bar.outerHTML=html;else{const t=rows[0].closest(".card")||rows[0].closest("table");if(t)t.insertAdjacentHTML("beforebegin",html)}}
let navBusy=false;
function decorateNav(){const n=q1("#nav");if(!n||navBusy)return;navBusy=true;
 try{
  /* favorites accordion: header is the toggle, count stays visible */
  const fh=q1(".nx-favs .nx-fh");if(fh){const open=store.get("favopen",false);D.documentElement.setAttribute("data-r16-fav",open?"open":"closed");
   if(fh.getAttribute("role")!=="button"){fh.setAttribute("role","button");fh.setAttribute("tabindex","0");fh.setAttribute("aria-controls","r16FavBody")}
   fh.setAttribute("aria-expanded",String(open));const body=q1(".nx-favs .nx-favlist,.nx-favs .nx-empty");if(body)body.id="r16FavBody"}
  /* budget requests: own section directly after Money and contracts */
  const old=q1(".r16-budg",n);const want=showBud();
  if(!want){if(old)old.remove()}
  else{const html=budGroupHTML();if(!old||old.outerHTML.replace(/\s+open=""/,"")!==html.replace(/\s+open=""/,"")){const anchor=q1('details[data-ng="money"]',n);const tmp=D.createElement("div");tmp.innerHTML=html;const el=tmp.firstElementChild;
    if(old){el.open=old.open;old.replaceWith(el)}else if(anchor)anchor.after(el);else n.appendChild(el)}}
  const it=q1('[data-nx-it="bud_req"]',n);if(it){it.hidden=want;const pv=it.previousElementSibling;if(pv&&pv.classList.contains("navsub")){const nx=it.nextElementSibling;pv.hidden=want&&(!nx||!nx.classList.contains("navit"))}}}
 finally{try{mo.takeRecords()}catch(e){}navBusy=false}}
const mo=new MutationObserver(()=>{if(navBusy)return;clearTimeout(mo._t);mo._t=setTimeout(decorateNav,30)});
function watchNav(){const n=q1("#nav");if(n&&!n._r16){n._r16=1;mo.observe(n,{childList:true,subtree:true});decorateNav()}}

/* favorites dropdown (top rail star): filter, reorder, remove, star this page */
function favPopDecorate(){const p=q1("#nxFavPop");if(!p)return;const list=q1("#nxFavList",p);if(!list)return;
 if(!q1("#r16FavQ",p)){const h=q1(".nx-ph",p);if(h)h.insertAdjacentHTML("afterend",`<div class="r16-favctl"><input id="r16FavQ" type="search" placeholder="Filter favorites" autocomplete="off" aria-label="Filter favorites"><span class="muted small" id="r16FavN" aria-live="polite"></span></div>`)}
 const fav=G(()=>NAVX.fav.list(),[]);const rows=qa(".nx-hrow",list);const q=((q1("#r16FavQ",p)||{}).value||"").trim().toLowerCase();let shown=0;
 rows.forEach((r,i)=>{const f=fav[i];if(!f)return;const open=q1("[data-nx-open]",r);if(open&&!r.dataset.r16)r.dataset.r16="1";
  if(!q1(".r16-mv",r)){r.insertAdjacentHTML("afterbegin",`<span class="r16-mv"><button type="button" class="r16-mvb" data-r16-mv="up" data-id="${E(f.id)}" aria-label="Move ${E(r.textContent.trim().slice(0,30))} up" title="Move up">${svg("M6 14l6-6 6 6",14,2.2)}</button><button type="button" class="r16-mvb" data-r16-mv="down" data-id="${E(f.id)}" aria-label="Move down" title="Move down">${svg("M6 10l6 6 6-6",14,2.2)}</button></span>`)}
  const mv=qa(".r16-mvb",r);mv.forEach(b=>b.dataset.id=f.id);if(mv[0])mv[0].disabled=i===0||!!q;if(mv[1])mv[1].disabled=i===rows.length-1||!!q;
  const hit=!q||(r.textContent||"").toLowerCase().includes(q);r.hidden=!hit;if(hit)shown++});
 const nEl=q1("#r16FavN",p);if(nEl)nEl.textContent=q?shown+" of "+fav.length:fav.length+" saved";
 const none=q1(".r16-favnone",list);if(q&&!shown&&rows.length){if(!none)list.insertAdjacentHTML("beforeend",'<p class="nx-empty r16-favnone">Nothing in your favorites matches that.</p>')}else if(none)none.remove()}
let favMo=null;
function watchFavPop(){const l=q1("#nxFavList");if(l&&!l._r16){l._r16=1;favMo=new MutationObserver(()=>{if(favMo._b)return;favMo._b=1;try{favPopDecorate()}finally{favMo.takeRecords();favMo._b=0}});favMo.observe(l,{childList:true});favPopDecorate()}}

/* ---------- events ---------- */
D.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
 if(b=t.closest("[data-r16-bud]")){e.preventDefault();budOpen(b.dataset.r16Bud);setTimeout(()=>{S.navOpen=S.navOpen||{};S.navOpen.r16bud=true;decorateNav()},30);return}
 if(t.closest("[data-r16-bud-clear]")){RS.filter=null;applyBudFilter();decorateNav();return}
 if(b=t.closest(".nx-favs .nx-fh")){const open=!store.get("favopen",false);store.set("favopen",open);D.documentElement.setAttribute("data-r16-fav",open?"open":"closed");b.setAttribute("aria-expanded",String(open));return}
 if(b=t.closest("[data-r16-mv]")){e.preventDefault();e.stopPropagation();const id=b.dataset.id,list=G(()=>NAVX.fav.list(),[]),i=list.findIndex(f=>f.id===id);if(i<0)return;
  G(()=>NAVX.fav.move(id,b.dataset.r16Mv==="up"?i-1:i+2));setTimeout(()=>{const nb=q1('#nxFavList [data-r16-mv="'+b.dataset.r16Mv+'"][data-id="'+id+'"]');if(nb&&!nb.disabled)nb.focus();else{const o=q1('#nxFavList [data-r16-mv][data-id="'+id+'"]:not([disabled])');if(o)o.focus()}},40);return}
 if(t.closest("[data-nx-star]"))setTimeout(syncSlotStar,30)},true);
D.addEventListener("keydown",e=>{const fh=e.target.closest&&e.target.closest(".nx-favs .nx-fh");if(fh&&(e.key==="Enter"||e.key===" ")){e.preventDefault();fh.click()}},true);
D.addEventListener("input",e=>{if(e.target&&e.target.id==="r16FavQ")favPopDecorate()});
D.addEventListener("toggle",e=>{if(e.target&&e.target.id==="nxFavPop"&&e.newState==="open"){watchFavPop();setTimeout(favPopDecorate,0);const i=q1("#r16FavQ");if(i&&innerWidth>700)setTimeout(()=>i.focus(),50)}},true);

/* ---------- boot ---------- */
function after(){try{mountSlot();cleanRail();watchNav();watchFavPop();applyBudFilter();syncSlotStar()}catch(e){console.error("r16i core",e)}}
R15D.after.push(after);
const _rn=W.renderNav;if(typeof _rn==="function")W.renderNav=function(){const r=_rn.apply(this,arguments);try{decorateNav()}catch(e){}return r};
let tries=0;const iv=setInterval(()=>{after();if(++tries>12)clearInterval(iv)},700);
setInterval(()=>{try{cleanRail();syncSlotStar()}catch(e){}},3000);
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",()=>setTimeout(after,0));else setTimeout(after,0);
})();
