/* ============ mod_s_search.js: search scope for the global search (window.SRCH) ============
   PH-12  screens, modules and tabs by name: a typed screen name lists that screen first; a tab ("Build list") resolves to its
          screen and opens the tab; hidden screens are searchable only in builder mode.
   Used by mod_nav.js (runSearch, index sources) and mod_zsearch.js (palette ranking) through guarded calls, so search keeps
   working if this module is missing. Storage through U.store; lifecycle through HOOKS. */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>(W.U&&U.esc)?U.esc(s):String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>String(s==null?"":s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const SRCH=W.SRCH=W.SRCH||{};
const store={get:(k,d)=>W.U&&U.store?U.store.get(k,d):d,set:(k,v)=>W.U&&U.store?U.store.set(k,v):false};

/* ---------- builder mode: hidden screens become searchable ---------- */
const BKEY="falconaire-search-builder";
SRCH.builder=()=>!!store.get(BKEY,false)||G(()=>PREF.nav==="full",false);
SRCH.setBuilder=on=>{store.set(BKEY,!!on);SRCH.dirty();if(W.audit)G(()=>audit(on?"Turned on builder mode for search":"Turned off builder mode for search",""));return !!on};
SRCH.dirty=()=>{G(()=>{const I=NAVX.index;if(I&&I.built)I.dirty=true})};

/* ---------- screens ---------- */
const screenRow=id=>G(()=>SCREENS.find(s=>s[0]===id),null);
SRCH.hiddenScreen=id=>!!id&&G(()=>!!((W.R15&&((R15.hidden||{})[id]||(R15.alias||{})[id]))||(NAVX.resolve(id)||{}).g==="r15hid"),false);
const labelOf=id=>G(()=>NAVX.label(id),G(()=>screenRow(id)[1],id));
const formalOf=id=>G(()=>String(screenRow(id)[1]),id);

/* ---------- tabs: a tab is found by its own name and opens on its screen ----------
   Seeded with the tab sets people ask for by name; every screen the person opens adds its own tabs (learned, this browser). */
const SEED={
 ppl_jrny:["Dashboard","Map","Overlay","Fulfillment","Processes","Process map","Personas","Org chart","Build list"],
 org_chart:["Org chart","AI workforce","Reporting structures","People directory","Ownership","Accountability map","Agent studio","Vacancies","Directory sync","Lifecycle"],
 guard:["Register","Stage matrix","Try to break it","Guided views"],
 scr_map:["Map","Table","Source files","Decisions and export","How this works"],
 nav_studio:["Menu map","Search health","Favorites and history","Process, data and measures","Usage"],
 plat_contract:["Dashboard","Matrix","The four rules","Agents","Run on a feature","Exceptions","Enforcement"]};
const TKEY="falconaire-search-tabs";
let LEARNED=store.get(TKEY,{})||{};
SRCH.tabs=id=>{const l=LEARNED[id];return (l&&l.length?l:SEED[id])||[]};
SRCH.allTabs=()=>{const o={};Object.keys(SEED).concat(Object.keys(LEARNED)).forEach(id=>{if(screenRow(id))o[id]=SRCH.tabs(id)});return o};
/* top-level tab strip of the current screen: views() radio labels or an ARIA tablist, never tabs nested inside a pane */
function tabEls(){const v=document.getElementById("view");if(!v)return[];
 const vs=[...v.querySelectorAll(".views")].filter(x=>!x.parentElement.closest(".views"));
 if(vs.length){const sw=vs[0].querySelector(":scope>.vsw");if(sw)return [...sw.querySelectorAll(":scope>label")]}
 const tl=[...v.querySelectorAll("[role=tablist]")].filter(x=>!x.parentElement.closest("[role=tablist],.views .pane"))[0];
 return tl?[...tl.querySelectorAll("[role=tab]")]:[]}
const tabText=el=>String(el.textContent||"").replace(/\s+/g," ").trim();
function learn(id){if(!id||!screenRow(id))return;const labs=tabEls().map(tabText).filter(t=>t&&t.length<=40);
 if(labs.length<2||labs.length>16)return;const prev=LEARNED[id]||SEED[id]||[];if(prev.join("|")===labs.join("|"))return;
 LEARNED[id]=labs;const ks=Object.keys(LEARNED);if(ks.length>300)delete LEARNED[ks[0]];store.set(TKEY,LEARNED);SRCH.dirty()}
SRCH.clickTab=label=>{const want=norm(label);const els=tabEls();const b=els.find(x=>norm(tabText(x))===want)||els.find(x=>norm(tabText(x)).indexOf(want)===0);
 if(!b)return false;b.click();return true};
SRCH.openTab=(id,label)=>{if(!screenRow(id))return false;if(S.screen!==id)go(id);let n=0;
 const tryIt=()=>{if(S.screen!==id)return;if(SRCH.clickTab(label))return;if(++n<12)setTimeout(tryIt,120)};tryIt();return true};
if(W.HOOKS)HOOKS.on("afterRender",sc=>{queueMicrotask(()=>{try{learn(sc||S.screen)}catch(e){}})},{id:"srch.tabs",order:20});

/* index sources for mod_nav's ensureIndex: one item per known tab */
SRCH.sources=function(){const NI=G(()=>NAVX.int,null);if(!NI)return[];
 return [["Screen tabs",()=>{const o=[];const T=SRCH.allTabs();Object.keys(T).forEach(id=>{const sl=labelOf(id);
  T[id].forEach(tab=>{if(norm(tab)===norm(sl))return;const it=NI.mkItem("screen",tab+" · "+sl,"Tab in "+sl,"--accent",()=>SRCH.openTab(id,tab),sl+" "+formalOf(id)+" tab","tab:"+id+":"+tab,{sid:id,tab});if(it)o.push(it)})});return o}]]};

/* ---------- name match: a screen, module, alias or tab named by the query ranks above every record ---------- */
const MODNAMES={};
function modNames(id){if(MODNAMES._v!==G(()=>MODMAP.modules.length,0)){Object.keys(MODNAMES).forEach(k=>delete MODNAMES[k]);MODNAMES._v=G(()=>MODMAP.modules.length,0);
  G(()=>MODMAP.modules.forEach(m=>{if(m&&m.scr){(MODNAMES[m.scr]=MODNAMES[m.scr]||[]).push(norm(m.name),norm(m.sn),...(m.al||[]).map(norm))}}));
  G(()=>Object.keys(NAVX.alias).forEach(a=>{const s=NAVX.alias[a];(MODNAMES[s]=MODNAMES[s]||[]).push(norm(a))}))}
 return (MODNAMES[id]||[]).filter(Boolean)}
const words=s=>norm(s).split(" ").filter(Boolean);
/* every query word is a prefix of some word in the name, in any order */
const wordsCover=(q,name)=>{const n=words(name);const w=words(q);return w.length>0&&w.every(x=>n.some(y=>y.indexOf(x)===0))};
SRCH.nameHit=function(it,q){if(!it||it.ty!=="screen"||!it.sid)return 0;const qn=norm(q);if(qn.length<3)return 0;const id=it.sid;
 const names=[norm(labelOf(id)),norm(formalOf(id)),norm(it.t)].concat(modNames(id));
 if(it.tab){const tn=norm(it.tab),sl=norm(labelOf(id));if(qn===tn)return 2600;if(qn===sl+" "+tn||qn===tn+" "+sl)return 2800;
  return wordsCover(qn,sl+" "+tn+" "+formalOf(id))&&words(qn).length>1?1200:0}
 if(names.indexOf(qn)>=0)return 3000;
 if(qn.length>=4&&names.some(n=>n.indexOf(qn)===0))return 1800;
 if(words(qn).length>1&&names.some(n=>wordsCover(qn,n)))return 1500;
 return 0};

/* ---------- visibility: one central check, applied by both search engines ---------- */
const CNT={hidden:0,hiddenIds:new Set()};
SRCH.reset=()=>{CNT.hidden=0;CNT.hiddenIds.clear()};
SRCH.counts=()=>({hidden:CNT.hiddenIds.size});
SRCH.allow=function(it){if(!it)return false;
 if(it.sid&&SRCH.hiddenScreen(it.sid)){if(!SRCH.builder()){CNT.hiddenIds.add(it.sid);return false}SRCH.label(it)}
 return true};
/* the label a hidden screen carries when builder mode shows it */
SRCH.label=function(it){if(it&&it.sid&&SRCH.hiddenScreen(it.sid)&&it.m&&it.m.indexOf("Hidden from the menu")<0){it.m=it.m+" · Hidden from the menu";it._z=null}};

/* palette notes above the results */
SRCH.noteHTML=function(){const c=SRCH.counts();let h="";
 if(c.hidden&&!SRCH.builder())h+=`<li class="nx-fixed ss-note" role="presentation">${c.hidden} hidden screen${c.hidden===1?"":"s"} also match${c.hidden===1?"es":""}. <button type="button" class="btn quiet sm" data-srch-builder="1">Show hidden screens (builder mode)</button></li>`;
 else if(SRCH.builder())h+=`<li class="nx-fixed ss-note" role="presentation">Builder mode: hidden screens are included. <button type="button" class="btn quiet sm" data-srch-builder="0">Turn off</button></li>`;
 return h};
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-srch-builder]");if(!b)return;e.preventDefault();e.stopPropagation();
 SRCH.setBuilder(b.dataset.srchBuilder==="1");G(()=>NAVX.int.refreshPal());const i=document.getElementById("nxPalIn");if(i)i.focus();
 if(S.screen==="nav_studio")G(()=>render())},true);
})();
