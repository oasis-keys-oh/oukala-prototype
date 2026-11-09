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
/* CL-87 (Omar 2026-10-20): builder mode is for the Tenant admin and Architect roles only. Granted by the demo identity's roles in
   the active tenant (IDENT, mod_s_tenant) or by the Architect or Platform admin persona. Simulated permission: nothing is enforced
   on a server. Everyone else gets a note instead of the switch. */
const BROLES=["Tenant admin","Architect"],BPERS=["arch","admin"];
SRCH.builderRoles=()=>BROLES.slice();
SRCH.canBuild=()=>{const roles=G(()=>IDENT.roles(DATA.tenant()),[])||[];if(roles.some(r=>BROLES.indexOf(r)>=0))return true;return BPERS.indexOf(G(()=>S.persona,""))>=0};
SRCH.builderWhy=()=>{if(SRCH.canBuild())return"";const who=G(()=>IDENT.me().name,"This identity");const t=G(()=>(DATA.tenantInfo(DATA.tenant())||{}).short,"")||G(()=>DATA.tenant(),"");
 return"Builder mode is for the Tenant admin and Architect roles. "+who+(t?" has neither role in "+t:" has neither role")+" (simulated permission).";};
SRCH.builder=()=>SRCH.canBuild()&&(!!store.get(BKEY,false)||G(()=>PREF.nav==="full",false));
SRCH.setBuilder=on=>{if(on&&!SRCH.canBuild()){G(()=>toast(SRCH.builderWhy(),"warn"));return false}store.set(BKEY,!!on);SRCH.dirty();if(W.audit)G(()=>audit(on?"Turned on builder mode for search":"Turned off builder mode for search",""));return !!on};
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
 return [["Tenant records",()=>{const o=[];G(()=>DATA.tenants().forEach(t=>tenantRows(t.id).forEach(x=>{const it=NI.mkItem("record",x.t,x.m,x.c,x.f,x.k,"tn:"+t.id+":"+x.g+":"+x.t,{g:x.g,tn:x.tn});if(it)o.push(it)})));return o}],
  ["Screen tabs",()=>{const o=[];const T=SRCH.allTabs();Object.keys(T).forEach(id=>{const sl=labelOf(id);
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

/* ---------- CL-75: tenant scope (R18). Every index item carries tn: null (product, any tenant), "core" (the Atlantic Systems
   sample) or a tenant id. Search providers still read the Atlantic Systems globals, so their records are tagged "core" here, centrally,
   instead of in each provider; under another tenant they are hidden and the palette says how many. ---------- */
const tenant=()=>G(()=>DATA.tenant(),"core");
const tname=t=>G(()=>{const i=DATA.tenantInfo(t);return i.short||i.org||t},t);
/* sources and provider groups that describe the product, not a customer's records (still checked for Atlantic Systems names) */
const NEUTRAL_SRC=/^(Screens|Actions|Screen tabs|Data entities|Data fields)$/;
const NEUTRAL_G=/^(go to|screens|actions|chat tools|agent tools|mcp tools|chart types|data model tables|data diagram tables|registry|proposed entities|data model coverage|data model gaps|data connections|process connections|modules|feature contract|screen decisions|product decisions|tour stories|tour moments)$/i;
let FP=null;
/* Atlantic Systems fingerprint: organization, invoice ids, project names and human names that no other tenant shares */
function fingerprint(){if(FP)return FP;const terms=new Set();const add=v=>{v=String(v||"").trim();if(v.length>=3)terms.add(v)};
 G(()=>{const ci=DATA.tenantInfo("core")||{};add(ci.org);add(ci.short)});add("Atlantic Systems");
 G(()=>DATA.get("invoices",{tenant:"core"}).forEach(r=>add(r.id)));G(()=>DATA.get("projects",{tenant:"core"}).forEach(r=>{add(r.n);add(r.id)}));
 G(()=>DATA.get("people",{tenant:"core"}).filter(r=>r.kind==="human").forEach(r=>add(r.name)));
 const shared=new Set();G(()=>DATA.tenants().filter(t=>t.id!=="core").forEach(t=>{shared.add(t.org);shared.add(t.short);["projects","people"].forEach(e=>DATA.get(e,{tenant:t.id}).forEach(r=>{shared.add(r.n);shared.add(r.name);shared.add(r.id)}))}));
 G(()=>IDENT.people.forEach(p=>shared.add(p.name)));
 const L=[...terms].filter(x=>!shared.has(x)).sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
 FP=L.length?new RegExp("(^|[^A-Za-z0-9_-])("+L.join("|")+")($|[^A-Za-z0-9_-])"):/$^/;return FP}
SRCH.isAtlantic=txt=>fingerprint().test(String(txt||""));
const textOf=x=>[x.g,x.t,x.m,x.k].join(" ");
/* tag an index item once, when the index is built (mod_nav ensureIndex) */
SRCH.tag=function(it,src){if(!it||it.tn!==undefined)return it;
 if(it.ty==="screen"||it.ty==="action"||NEUTRAL_SRC.test(src||"")||NEUTRAL_G.test(it.g||""))it.tn=SRCH.isAtlantic(textOf(it))?"core":null;
 else it.tn="core";return it};
/* a screen that still shows only the Atlantic Systems sample says so under another tenant */
function sayAtlanticOnly(it){const t=tenant();if(it._mt===t)return;if(it.m0==null)it.m0=it.m;it._mt=t;
 const core=t!=="core"&&G(()=>DATA.screenMode(it.sid)==="core",false);it.m=core?it.m0+" · Atlantic Systems sample only":it.m0;it._z=null}

/* tenant records: each industry tenant's own rows, searchable only inside that tenant */
const TREC=[["projects","Projects","Project","tn_projects",r=>r.n,r=>[r.short,r.owner,r.id].join(" ")],
 ["budget_lines","Budget lines","Budget line","tn_projects",r=>r.id+" "+r.n,r=>[r.cat,r.own,r.p].join(" ")],
 ["people","People","Person","tn_people",r=>r.name,r=>[r.role,r.team,(r.skills||[]).join(" ")].join(" ")],
 ["metrics","Metrics","Metric","tn_metrics",r=>r.n,r=>[r.owner,r.u].join(" ")],
 ["objectives","Strategic objectives","Objective","tn_metrics",r=>r.n,r=>[r.owner,r.story].join(" ")],
 ["journeys","Journeys","Journey","ppl_jrny",r=>r.n,r=>[r.desc,r.cat].join(" ")],
 ["workflows","Workflows","Workflow","ppl_jrny",r=>r.name,r=>[r.service,r.owner,r.kind].join(" ")]];
function tenantRows(t){const o=[];if(!t||t==="core")return o;
 TREC.forEach(([e,g,kind,scr,title,kw])=>G(()=>DATA.get(e,{tenant:t}).forEach(r=>{const tt=G(()=>title(r),"");if(!tt)return;
  o.push({g,t:String(tt),m:tname(t)+" · "+kind,k:G(()=>kw(r),""),c:"--p4",tn:t,scr,f:()=>{if(G(()=>DATA.tenant())!==t)return;go(scr)}})})));
 return o}
SRCH.tenantRows=tenantRows;

/* ---------- PH-14 (step 6): facets. area (a business area or fixed space) and object (an object word such as invoice).
   Set from the palette's Area menu (SRCH.setFacet) or typed in the query (area:money, object:invoice, obj:incident); both
   engines parse the query with SRCH.parseFacets and apply the facets in SRCH.allow. Items without a place (records, people)
   match an area facet only when their text names an object of that area. ---------- */
const FAC={area:null,object:null};let QF={area:null,object:null};
SRCH.facets=()=>({area:QF.area||FAC.area,object:QF.object||FAC.object});
SRCH.setFacet=(k,v)=>{if(k in FAC)FAC[k]=v||null;SRCH.dirty()};
const areaOf=q=>{q=String(q||"").trim().toLowerCase();if(!q)return null;const r=G(()=>NAVX.resolveGroup(q),null);if(r)return r;
 const sp=G(()=>NAVX.taxo.spaces(),[]).find(s=>s.id.indexOf(q)===0||s.label.toLowerCase().indexOf(q)===0||s.label.toLowerCase().split(/[ ,]+/).some(w=>w.indexOf(q)===0&&q.length>=3));return sp?sp.id:null};
SRCH.parseFacets=function(raw){let q=String(raw||"");const f={area:null,object:null};
 q=q.replace(/(^|\s)(area|in-area):\s*("[^"]+"|[a-z][a-z-]*)/ig,(m,a,k,v)=>{const id=areaOf(v.replace(/"/g,""));if(id){f.area=id;return a}return m})
  .replace(/(^|\s)(object|obj|type):\s*("[^"]+"|[a-z][a-z-]*)/ig,(m,a,k,v)=>{f.object=v.replace(/"/g,"").toLowerCase();return a}).replace(/\s+/g," ").trim();
 /* a facet alone lists what it names: the object word, or the area's own name */
 if(!q&&f.object)q=f.object;else if(!q&&f.area)q=G(()=>NAVX.taxo.label(f.area),"");
 QF=f;return {q,facets:SRCH.facets()}};
const placeArea=it=>{if(it.area)return it.area;if(it.sid){const top=G(()=>NAVX.rail.topOf(it.sid),it.sid);return G(()=>NAVX.taxo.place(top).sp,null)}return null};
function facetOk(it){const f=SRCH.facets();if(!f.area&&!f.object)return true;
 const hay=((it.objs||[]).join(" ")+" "+(it.t||"")+" "+(it.m||"")+" "+(it.g||"")).toLowerCase();
 if(f.object&&hay.indexOf(f.object)<0&&hay.indexOf(f.object.replace(/s$/,""))<0)return false;
 if(f.area){const a=placeArea(it);if(a)return a===f.area;
  const objs=G(()=>NAVX.taxo.rows().filter(id=>{const p=NAVX.taxo.place(id);return p.sp===f.area&&p.kind==="entry"}).map(id=>NAVX.taxo.row(id).objs).flat(),[]);
  return objs.some(o=>{const w=String(o).toLowerCase().split(" ")[0].replace(/s$/,"");return w.length>=4&&hay.indexOf(w)>=0})}
 return true}
SRCH.facetOk=facetOk;
/* wedge mode also limits the view-level results to the wedge screens */
const wedgeOk=it=>{if(!it.view)return true;return !G(()=>SHOW.wedge.on(),false)||G(()=>SHOW.wedge.screens().indexOf(it.view)>=0,true)};

/* ---------- visibility: one central check, applied by both search engines ---------- */
const CNT={hiddenIds:new Set(),atlantic:new Set()};
SRCH.reset=()=>{CNT.hiddenIds.clear();CNT.atlantic.clear()};
SRCH.counts=()=>({hidden:CNT.hiddenIds.size,atlantic:CNT.atlantic.size,tenant:tenant()});
SRCH.allow=function(it){if(!it)return false;const t=tenant();if(!facetOk(it)||!wedgeOk(it))return false;
 if(it.tn!=null&&it.tn!==t){if(it.tn==="core")CNT.atlantic.add(it);return false}
 if(it.sid&&SRCH.hiddenScreen(it.sid)){if(!SRCH.builder()){CNT.hiddenIds.add(it.sid);return false}SRCH.label(it)}
 if(it.sid&&it.ty==="screen")sayAtlanticOnly(it);
 return true};

/* CL-87: Recently viewed and Favorites follow the active tenant. Screens stay (they are product, labeled "Atlantic Systems sample only"
   where that applies); a record entry shows only under the tenant it was opened in: a tenant record ("tn:<tenant>:" key) or one
   tagged with that tenant. Under another tenant every Atlantic Systems record is hidden. SRCH.hist(list) filters a history list. */
SRCH.histAllow=function(h){if(!h)return false;const t=tenant();if(t==="core")return !h.tn||h.tn==="core";
 if(h.kind==="screen")return true;
 if(h.tn!=null)return h.tn===t;
 const k=String(h.key||h.id||"");if(k.indexOf("tn:"+t+":")===0||k.indexOf("record:tn:"+t+":")===0)return true;
 return false};
SRCH.hist=list=>(list||[]).filter(h=>SRCH.histAllow(h));
/* the core search list (ui.js searchIndex, wrapped by kit.js for SEARCHX providers, read by chat and the leak test) gets the
   same scope: the outermost wrapper filters it for the active tenant and adds that tenant's own records */
const _si=typeof searchIndex==="function"?searchIndex:null;
if(_si&&!_si.__srch){const wrapped=function(){const out=_si.apply(this,arguments);try{return SRCH.scopeList(out)}catch(e){console.error("search scope",e);return out}};wrapped.__srch=1;searchIndex=wrapped}
const SCRBYNAME=()=>{const m={};G(()=>SCREENS.forEach(s=>{m[String(s[1])]=s[0]}));return m};
SRCH.scopeList=function(list){const t=tenant();if(t==="core")return list.filter(x=>!x||!x.tn||x.tn==="core");
 const byName=SCRBYNAME();const out=[];
 list.forEach(x=>{if(!x)return;
  if(x.tn!=null){if(x.tn===t)out.push(x);return}
  if(x.chooser){out.push(x);return}
  if(!NEUTRAL_G.test(String(x.g||""))||SRCH.isAtlantic(textOf(x)))return;
  if(x.g==="Go to"&&byName[x.t]&&G(()=>DATA.screenMode(byName[x.t])==="core",false))x=Object.assign({},x,{m:(x.m||"Screen")+" · Atlantic Systems sample only"});
  out.push(x)});
 return out.concat(tenantRows(t))};
/* the label a hidden screen carries when builder mode shows it */
SRCH.label=function(it){if(it&&it.sid&&SRCH.hiddenScreen(it.sid)&&it.m&&it.m.indexOf("Hidden from the menu")<0){it.m=it.m+" · Hidden from the menu";it._z=null}};

/* palette notes above the results */
SRCH.noteHTML=function(){const c=SRCH.counts();let h="";
 if(c.atlantic&&c.tenant!=="core")h+=`<li class="nx-fixed ss-note" role="presentation" data-srch-scope="${E(c.tenant)}">Search follows the active tenant, ${E(tname(c.tenant))}. ${c.atlantic.toLocaleString("en-US")} result${c.atlantic===1?"":"s"} from the Atlantic Systems sample ${c.atlantic===1?"is":"are"} hidden (tenant isolation is simulated in this prototype).</li>`;
 if(c.hidden&&!SRCH.canBuild())h+=`<li class="nx-fixed ss-note ss-locked" role="presentation" data-srch-locked="1">${c.hidden} hidden screen${c.hidden===1?"":"s"} also match${c.hidden===1?"es":""}. ${E(SRCH.builderWhy())}</li>`;
 else if(c.hidden&&!SRCH.builder())h+=`<li class="nx-fixed ss-note" role="presentation">${c.hidden} hidden screen${c.hidden===1?"":"s"} also match${c.hidden===1?"es":""}. <button type="button" class="btn quiet sm" data-srch-builder="1">Show hidden screens (builder mode)</button></li>`;
 else if(SRCH.builder())h+=`<li class="nx-fixed ss-note" role="presentation">Builder mode: hidden screens are included. <button type="button" class="btn quiet sm" data-srch-builder="0">Turn off</button></li>`;
 return h};
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-srch-builder]");if(!b)return;e.preventDefault();e.stopPropagation();
 SRCH.setBuilder(b.dataset.srchBuilder==="1");G(()=>NAVX.int.refreshPal());const i=document.getElementById("nxPalIn");if(i)i.focus();
 if(S.screen==="nav_studio")G(()=>render())},true);
})();
