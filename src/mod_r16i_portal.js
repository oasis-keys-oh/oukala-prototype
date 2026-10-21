/* Round 16: one end-user portal over svc_portal (mod_svc.js) for catalog items and order guides. Deep link #portal */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>[...(r||D).querySelectorAll(s)];
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];
const R16I=W.R16I=W.R16I||{};
const P=S.r16p=S.r16p||{q:"",type:"all",cat:"All",limit:24};
const B=()=>W.SVC3B||{};
const ME=()=>G(()=>B().ME,"Casey Rowan");
const svg=(d,s)=>`<svg viewBox="0 0 24 24" width="${s||18}" height="${s||18}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const IC_ITEM="M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10",IC_GUIDE="M4 6h6v5H4zM14 6h6v5h-6zM4 14h6v5H4zM14 14h6v5h-6zM10 8.5h4M10 16.5h4M7 11v3M17 11v3";
const LAYKEY="layout";
/* ---------- the unified list ---------- */
function entries(){const b=B();if(!b.pubItems)return[];const guides=G(()=>OGX.guides,[]),gItems=new Set(guides.map(g=>g.item));
 const items=b.pubItems().filter(i=>!gItems.has(i.id)).map(i=>({t:"catalog",id:i.id,n:i.n,cat:i.cat,short:i.short||"",est:i.est||"",pop:i.pop||0,off:i.off||"",price:G(()=>b.priceOf?"":"",""),item:i}));
 const gs=guides.map(g=>{const it=G(()=>b.ITEM(g.item),null)||{};return{t:"guide",id:g.id,n:g.n,cat:it.cat||"Onboarding",short:g.blurb||it.short||"",est:g.parts.length+" parts, one order",pop:it.pop||Math.round(180-guides.indexOf(g)*14),off:"order guide",kinds:g.kinds||[],g,item:it}});
 return items.concat(gs)}
const catsOf=L=>{const m={};L.forEach(e=>m[e.cat]=(m[e.cat]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1])};
function filtered(L){const tk=P.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return L.filter(e=>(P.type==="all"||P.type===e.t)&&(P.cat==="All"||e.cat===P.cat)&&tk.every(t=>(e.n+" "+e.short+" "+e.cat+" "+e.off+" "+(e.t==="guide"?"order guide bundle":"catalog item")).toLowerCase().includes(t))).sort((a,b)=>b.pop-a.pop)}
const forWho=()=>G(()=>B().V.pFor,ME());
function tile(e){const forO=forWho()!==ME();const kinds=(e.kinds||[]);const fit=e.t==="guide"&&forO&&kinds.includes("team")?"Fits your team":"";
 return `<button type="button" class="r16p-tile" data-r16p-open="${U.esc(e.t)}|${E(e.t==="guide"?e.item.id||e.g.item:e.id)}|${E(e.id)}" aria-label="${E((e.t==="guide"?"Order guide: ":"Catalog item: ")+e.n)}"><span class="r16p-ti ${U.esc(e.t)}">${svg(e.t==="guide"?IC_GUIDE:IC_ITEM,22)}</span><span class="r16p-tb"><span class="r16p-badge ${U.esc(e.t)}">${e.t==="guide"?"Order guide":"Catalog item"}</span><b>${E(e.n)}</b><small class="muted">${E(e.short.length>96?e.short.slice(0,94)+"…":e.short)}</small><span class="r16p-meta"><span>${E(e.cat)}</span>${e.est?`<span>${E(e.est)}</span>`:""}${fit?`<span class="pill good">${fit}</span>`:""}</span></span></button>`}
function resultsHTML(){const L=entries(),F=filtered(L),sh=F.slice(0,P.limit);
 return `<div class="r16p-grid" role="list">${sh.map(e=>`<div role="listitem">${tile(e)}</div>`).join("")||`<p class="muted r16p-none">Nothing matches. <button type="button" class="btn quiet" data-r16p-reset>Clear search and filters</button></p>`}</div>${F.length>sh.length?`<button type="button" class="btn" data-r16p-more>Show ${Math.min(24,F.length-sh.length)} more of ${F.length-sh.length}</button>`:""}<p class="muted small" role="status" aria-live="polite" id="r16pCount">${F.length} of ${L.length} ${P.cat==="All"&&P.type==="all"&&!P.q?"available":"match"}</p>`}
function recent(){const b=B(),me=ME();const rq=G(()=>b.REQS.filter(r=>r.requester===me||r.for===me).map(r=>({k:"req",id:r.id,t:G(()=>b.ITEM(r.item).n,r.item),st:r.state,at:r.created,fw:r.for})),[]);
 const od=G(()=>OGX.orders().filter(o=>o.by===me).map(o=>({k:"order",id:o.id,t:G(()=>OGX.guides.find(g=>g.id===o.g).n,o.g),st:o.gate&&o.gate.st==="pending"?"waiting for approval":"in progress",at:o.created,fw:o.forName})),[]);
 return rq.concat(od).sort((a,b)=>b.at-a.at).slice(0,5)}
const stTxt=s=>({pending:"Waiting for approval",approved:"Approved",fulfilling:"Being fulfilled",deployed:"Delivered",rejected:"Declined",decommissioned:"Closed"}[s]||s);
function whoHTML(){const b=B(),fw=forWho(),me=ME();const reports=G(()=>RF.directOf(me),[])||[];const mode=P.other||(fw!==me&&!reports.includes(fw))?"other":fw===me?"me":"team";
 return `<div class="r16p-who glass" role="group" aria-label="Who is this for"><b>Who is this for</b><div class="r16p-seg">${[["me","Me"],["team","My team"],["other","Someone else"]].map(x=>`<button type="button" class="chip" data-r16p-who="${x[0]}" aria-pressed="${mode===x[0]}">${x[1]}</button>`).join("")}</div>
 ${mode==="team"?`<label class="r16p-sel"><span class="sr">Choose a person on your team</span><select data-r16p-whosel aria-label="Person on your team">${reports.map(n=>`<option ${n===fw?"selected":""}>${E(n)}</option>`).join("")}</select></label>`:""}
 ${mode==="other"?`<form class="r16p-sel row" data-r16p-whoform><input class="txtin" list="r16pPeople" data-r16p-whoq placeholder="Start typing a name" aria-label="Order for" value="${fw===me?"":E(fw)}"><button class="btn primary" type="submit">Choose</button></form><datalist id="r16pPeople">${G(()=>b.poolPeople().slice(0,400).map(d=>`<option value="${E(d.name)}">`).join(""),"")}</datalist>`:""}
 <span class="muted small">${fw===me?"Price, approvals and delivery follow you.":"Ordering for <b>"+E(fw)+"</b>. Price, approvals and delivery follow them."}</span></div>`}
function unifiedHTML(){const L=entries(),cats=catsOf(L),rec=recent(),pop=L.slice().sort((a,b)=>b.pop-a.pop).slice(0,6);const nC=L.filter(e=>e.t==="catalog").length,nG=L.length-nC;
 const first=ME().split(" ")[0];const admin=G(()=>PERSONAS[S.persona].family,"decide")!=="request"&&!G(()=>PERSONAS[S.persona].readonly,false);
 return `<div class="screen r16p-screen">${hero("Portal · Meridian Standards Foundation","Order something",`One place for everything you can order: <b>${nC}</b> catalog items and <b>${nG}</b> order guides that bundle several items into one request. ${rec.length?`You have <b>${rec.filter(r=>!/Delivered|Closed|Declined/.test(stTxt(r.st))).length}</b> request${rec.length>1?"s":""} in progress.`:""}`,`<div class="r16p-hrow"><form class="r16p-search" role="search" data-r16p-form><input class="txtin" type="search" data-r16p-q placeholder="Search items and guides, for example laptop, new hire, access" aria-label="Search the portal" value="${E(P.q)}" autocomplete="off"></form><div class="r16p-types" role="group" aria-label="Show">${[["all","All ("+L.length+")"],["catalog","Catalog items ("+nC+")"],["guide","Order guides ("+nG+")"]].map(x=>`<button type="button" class="chip" data-r16p-type="${x[0]}" aria-pressed="${P.type===x[0]}">${x[1]}</button>`).join("")}</div></div>`)}
 ${whoHTML()}
 <section class="r16p-sec" aria-labelledby="r16pcat"><div class="svc-sechead"><h2 id="r16pcat">Browse by category</h2></div><div class="r16p-cats">${[["All",L.length]].concat(cats).map(c=>`<button type="button" class="r16p-cat glass" data-r16p-cat="${E(c[0])}" aria-pressed="${P.cat===c[0]}"><b>${E(c[0]==="All"?"Everything":c[0])}</b><span class="muted small">${c[1]} ${c[1]===1?"option":"options"}</span></button>`).join("")}</div></section>
 <div class="r16p-two"><section class="r16p-sec" aria-labelledby="r16ppop"><div class="svc-sechead"><h2 id="r16ppop">Popular right now</h2></div><div class="r16p-list">${pop.map(e=>`<button type="button" class="r16p-row" data-r16p-open="${U.esc(e.t)}|${E(e.t==="guide"?e.item.id||e.g.item:e.id)}|${E(e.id)}"><span class="r16p-ti ${U.esc(e.t)}">${svg(e.t==="guide"?IC_GUIDE:IC_ITEM,18)}</span><span><b>${E(e.n)}</b><small class="muted">${e.t==="guide"?"Order guide":"Catalog item"} · ${E(e.cat)}</small></span></button>`).join("")}</div></section>
 <section class="r16p-sec" aria-labelledby="r16prec"><div class="svc-sechead"><h2 id="r16prec">My recent</h2><button type="button" class="btn quiet" data-nav="svc_req">All my requests</button></div><div class="r16p-list">${rec.map(r=>`<button type="button" class="r16p-row" data-r16p-rec="${r.k}|${E(r.id)}"><span class="r16p-ti ${r.k==="order"?"guide":"catalog"}">${svg(r.k==="order"?IC_GUIDE:IC_ITEM,18)}</span><span><b>${E(r.t)}</b><small class="muted">${E(r.id)} · ${E(stTxt(r.st))}${r.fw&&r.fw!==ME()?" · for "+E(r.fw):""}</small></span></button>`).join("")||'<p class="muted">You have not ordered anything yet.</p>'}</div></section></div>
 <section class="r16p-sec" aria-labelledby="r16pall"><div class="svc-sechead"><h2 id="r16pall">${P.cat==="All"?"Everything you can order":E(P.cat)}</h2></div><div id="r16pRes">${resultsHTML()}</div></section>
 ${admin?`<div class="r16p-manage"><span class="muted small">Managing what appears here is separate:</span><button type="button" class="btn quiet" data-nav="svc_cat">Manage the catalog</button><button type="button" class="btn quiet" data-nav="svc_guides">Order guide admin</button><button type="button" class="btn quiet" data-r16p-admin>Portal admin view</button></div>`:""}
 ${typeof procCard==="function"?procCard("svc_portal"):""}</div>`}
function paint(){const r=q1("#r16pRes");if(r)r.innerHTML=resultsHTML();qa("[data-r16p-type]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.r16pType===P.type)));qa("[data-r16p-cat]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.r16pCat===P.cat)));const h=q1("#r16pall");if(h)h.textContent=P.cat==="All"?"Everything you can order":P.cat}
/* ---------- wrap the screen: customer view becomes the unified screen ---------- */
function install(){const prev=G(()=>_R.svc_portal,null);if(!prev||prev._r16)return;const f=function(){const v=B().V;if(!v||v.pItem||v.pView==="admin"||!TROWS.core())return prev.apply(this,arguments);return unifiedHTML()};f._r16=1;_R.svc_portal=f}
/* ---------- deep links ---------- */
const BOOT=location.hash||"";let bootDone=false;/* the shell rewrites the hash while it boots, so keep the one the page was opened with */
const HASH=/^#portal(?:\/(catalog|guides|orders)\/([^/?#]+))?\/?(?:\?.*)?$/;
function open(kind,id){const b=B();if(!b.V)return false;
 if(kind==="catalog"){b.V.pView="customer";b.V.pItem=id;b.V.pTab=0;go("svc_portal");render();return true}
 if(kind==="guides"){const g=G(()=>OGX.guides.find(x=>x.id===id||x.item===id),null);if(g){P.from="portal";OGX.start(g.item);return true}return false}
 if(kind==="orders"){if(G(()=>b.RQ(id),null)){go("svc_portal");setTimeout(()=>b.openMy(id),80);return true}if(G(()=>OGX.orders().some(o=>o.id===id),false)){P.from="portal";OGX.open(id);return true}}
 return false}
function applyHash(h){const m=HASH.exec(h||location.hash||"");if(!m)return false;setLayout("portal",true);const b=B();if(b.V){b.V.pView="customer";if(!m[1])b.V.pItem=null}install();if(S.screen!=="svc_portal")go("svc_portal");else render();if(m[1])setTimeout(()=>open(m[1],decodeURIComponent(m[2])),120);return true}
function urlSync(){if(S.screen!=="svc_portal"||G(()=>B().V.pView)==="admin")return;const v=B().V;const want=v&&v.pItem?"#portal/catalog/"+encodeURIComponent(v.pItem):"#portal";if(location.hash!==want){try{history.replaceState(null,"",want)}catch(e){}}}
/* ---------- layout mode: portal (employee view) or console ---------- */
const famReq=()=>G(()=>PERSONAS[S.persona].family,"")==="request";
let forced=false;
function setLayout(m,force){forced=!!force;R16I.store.set(LAYKEY,m);apply()}
const PORTAL_SCREENS={svc_portal:1};
function wantPortal(){if(!PORTAL_SCREENS[S.screen])return false;if(G(()=>B().V.pView)==="admin")return false;const pref=R16I.store.get(LAYKEY,"auto");return pref==="portal"||(pref==="auto"&&famReq())}
function shellHTML(){const cur=S.screen;const L=[["svc_portal","Portal"],["svc_req","My requests"],["kcs_ask","Knowledge"],["r15d_firstweek","First week"]].filter(x=>G(()=>SCREENS.some(s=>s[0]===x[0]),false));
 return `<a class="r16p-brand" href="#portal" data-r16p-home aria-label="Portal home"><span class="r16p-logo" aria-hidden="true">${svg("M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 5v14M5 12h14",20)}</span><b class="wm">${(()=>{const n=BRAND.name,k=String(BRAND.mark||""),i=k?n.toLowerCase().indexOf(k.toLowerCase()):-1;return i<0?n:n.slice(0,i)+'<i class="wm-ai">'+n.slice(i,i+k.length)+"</i>"+n.slice(i+k.length)})()}</b><small>Meridian Standards</small></a><nav aria-label="Portal">${L.map(x=>`<button type="button" class="r16p-nl" data-nav="${x[0]}" ${cur===x[0]?'aria-current="page"':""}>${E(x[1])}</button>`).join("")}</nav><span class="r16p-sp"></span><button type="button" class="btn quiet" data-r16p-console title="Back to the full console with the sidebar">Open the console</button>`}
function apply(){const on=wantPortal();const h=D.documentElement;if(h.getAttribute("data-r16-layout")!==(on?"portal":"console"))h.setAttribute("data-r16-layout",on?"portal":"console");
 const st=q1(".stage");let sh=q1("#r16Shell");if(on&&st){if(!sh){sh=D.createElement("header");sh.id="r16Shell";sh.className="r16p-shell glass";sh.setAttribute("role","banner");st.insertBefore(sh,st.firstChild)}const html=shellHTML();if(sh.dataset.h!==html){sh.innerHTML=html;sh.dataset.h=html}}else if(sh)sh.remove()}
/* ---------- events ---------- */
D.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;let b;
 if(b=t.closest("[data-r16p-open]")){const [k,iid,eid]=b.dataset.r16pOpen.split("|");const v=B().V;P.from="portal";if(k==="guide"){G(()=>OGX.start(iid))||toast("That guide is not available","warn")}else{v.pItem=eid;v.pTab=0;render();window.scrollTo&&window.scrollTo(0,0)}return}
 if(b=t.closest("[data-r16p-rec]")){const [k,id]=b.dataset.r16pRec.split("|");if(k==="req")G(()=>B().openMy(id));else G(()=>OGX.open(id));return}
 if(b=t.closest("[data-r16p-type]")){P.type=b.dataset.r16pType;P.limit=24;paint();return}
 if(b=t.closest("[data-r16p-cat]")){P.cat=b.dataset.r16pCat;P.limit=24;paint();return}
 if(t.closest("[data-r16p-more]")){P.limit+=24;paint();return}
 if(t.closest("[data-r16p-reset]")){P.q="";P.type="all";P.cat="All";const i=q1("[data-r16p-q]");if(i)i.value="";paint();return}
 if(b=t.closest("[data-r16p-who]")){const v=B().V,me=ME();const k=b.dataset.r16pWho;P.other=k==="other";if(k==="me")v.pFor=me;else if(k==="team"){const r=G(()=>RF.directOf(me),[])||[];v.pFor=r.includes(v.pFor)?v.pFor:(r[0]||me)}render();return}
 if(t.closest("[data-r16p-admin]")){B().V.pView="admin";apply();render();return}
 if(t.closest("[data-r16p-console]")){R16I.store.set(LAYKEY,"console");apply();return}
 if(t.closest("[data-r16p-home]")){e.preventDefault();B().V.pItem=null;go("svc_portal");render();return}
 if(t.closest("[data-r16p-employee]")){R16I.store.set(LAYKEY,"portal");apply();return}
 if(t.closest("[data-r16p-back]")){go("svc_portal");return}},true);
D.addEventListener("input",e=>{if(e.target.matches&&e.target.matches("[data-r16p-q]")){P.q=e.target.value;P.limit=24;paint()}});
D.addEventListener("change",e=>{if(e.target.matches&&e.target.matches("[data-r16p-whosel]")){B().V.pFor=e.target.value;render()}});
D.addEventListener("submit",e=>{const f=e.target;if(f.matches&&f.matches("[data-r16p-form]")){e.preventDefault();return}
 if(f.matches&&f.matches("[data-r16p-whoform]")){e.preventDefault();const n=f.querySelector("input").value.trim();const r=G(()=>DIR.find(d=>d.name.toLowerCase()===n.toLowerCase()&&d.kind!=="ai"),null);if(!r){toast((n||"That name")+" is not in the directory","warn");return}B().V.pFor=r.name;P.other=true;G(()=>audit("portal: ordering for",r.name));render()}},true);
W.addEventListener("hashchange",()=>{if(HASH.test(location.hash||""))applyHash()});
/* ---------- boot ---------- */
function afterRender(){try{install();apply();urlSync();
 /* the guide wizard and item pages reached from the portal offer a way back */
 if(P.from==="portal"&&S.screen==="svc_guides"){const sc=q1("#view .screen");if(sc&&!q1("[data-r16p-back]",sc))sc.insertAdjacentHTML("afterbegin",'<div class="r16p-backbar"><button type="button" class="btn quiet" data-r16p-back>&larr; Back to the portal</button></div>')}
 if(S.screen!=="svc_guides"&&S.screen!=="svc_portal")P.from=null;
 /* an employee-view switch for people who are not on a Request persona */
 if(S.screen==="svc_portal"&&!famReq()&&G(()=>B().V.pView)!=="admin"&&R16I.store.get(LAYKEY,"auto")!=="portal"&&!q1("[data-r16p-employee]")){const hr=q1("#view .r16p-hrow");if(hr)hr.insertAdjacentHTML("beforeend",'<button type="button" class="btn quiet" data-r16p-employee title="Lighter layout without the sidebar, the way employees see it">Employee view</button>')}}catch(e){console.error("r16i portal",e)}}
R15D.after.push(afterRender);
const bootGo=()=>{install();if(!bootDone&&HASH.test(BOOT)){applyHash(BOOT);bootDone=S.screen==="svc_portal"}};
setTimeout(bootGo,60);setTimeout(bootGo,900);setTimeout(()=>{bootGo();bootDone=true},2500);
R16I.portal={entries,open,applyHash,setLayout,urls:{prototype:"https://oukala-prototype.netlify.app/#portal",hashFor:(k,id)=>"#portal"+(k?"/"+k+"/"+encodeURIComponent(id):""),production:(tenant,domain,k,id)=>"https://portal."+tenant+"."+domain+"/"+(k?k+"/"+encodeURIComponent(id):"")}};
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>[{g:"Portal",t:"Portal: order anything",m:"Catalog items and order guides in one place",c:"--accent",f:()=>{B().V.pItem=null;go("svc_portal")},k:"portal self service order catalog order guide employee"}]);
})();
