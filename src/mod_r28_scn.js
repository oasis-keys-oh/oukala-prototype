/* ===== mod_r28_scn: demo scenarios. The industry journeys and workflows (healthcare, mining, storage and backup) are separate demos for separate customers.
   By default only the Meridian sample is loaded. Choose a scenario on the Journey maps screen, from search, or with ?scenario=health|mining|storage in the address.
   Switching removes the previous scenario's journeys, workflows and personas and loads the new one. Fictional organizations only. ===== */
(function(){
const W=window,D=document;const X=W.JYX;if(!X||!W.WFX)return;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const SCN=W.SCN={cur:"core",list:{
 core:{n:"Meridian Standards Foundation",d:"A standards publisher: a standard from the first need to renewal, plus the internal IT journeys."},
 health:{n:"Healthcare",ind:"Healthcare",d:"Larkspur Health System (fictional): from the first symptom to the last payment, plus the detailed patient access and discharge journeys."},
 mining:{n:"Mining and operational technology",ind:"Mining",d:"Redstone Resources (fictional): from the mine plan to cash received and the site returned, plus maintenance and safety."},
 storage:{n:"Storage and backup",ind:"Storage and backup",d:"Corvane Data Protection (fictional): from the first data risk to the end of the relationship, plus evaluation and recovery."}}};
const ORIG5=X.PERSONAS.slice(0,5);
const pack={},byInd={};SCN.pack=pack;
Object.keys(SCN.list).forEach(k=>{pack[k]={wfs:[],jys:[],pers:[]};if(k!=="core")byInd[SCN.list[k].ind]=k});
const JP={JH:"health",JM:"mining",JS:"storage"};
W.WFX.defs.forEach(d=>{if(d.industry&&byInd[d.industry])pack[byInd[d.industry]].wfs.push(d)});
X.JY.list.forEach(j=>{pack[JP[String(j.id).slice(0,2)]||"core"].jys.push(j)});
Object.keys(pack).forEach(k=>{const set=pack[k].pers;if(k==="core")ORIG5.forEach(p=>set.push(p));pack[k].jys.forEach(j=>j.stages.forEach(s=>s.boxes.forEach(b=>{if(set.indexOf(b.who)<0)set.push(b.who)})))});
const byEnd=()=>X.JY.list.sort((a,b)=>(b.cat==="End to end")-(a.cat==="End to end"));
/* each scenario is a whole demo: only its own journeys and personas are loaded */
function strip(k){const p=pack[k];if(!p)return;const w=new Set(p.wfs.map(d=>d.id));for(let i=W.WFX.defs.length-1;i>=0;i--)if(w.has(W.WFX.defs[i].id))W.WFX.defs.splice(i,1);
 const j=new Set(p.jys.map(x=>x.id));for(let i=X.JY.list.length-1;i>=0;i--)if(j.has(X.JY.list[i].id))X.JY.list.splice(i,1);
 X.PERSONAS.length=0}
function load(k){const p=pack[k];if(!p)return;p.wfs.forEach(d=>W.WFX.reg(d));p.jys.forEach(j=>{if(!X.JY.list.some(x=>x.id===j.id))X.JY.list.push(j)});p.pers.forEach(x=>{if(X.PERSONAS.indexOf(x)<0)X.PERSONAS.push(x)});byEnd()}
Object.keys(pack).forEach(strip);load("core");G(()=>X.syncJy());
SCN.set=function(k){if(!SCN.list[k]||k===SCN.cur)return;strip(SCN.cur);load(k);SCN.cur=k;try{S.scenario=k}catch(e){}G(()=>W.DATA&&W.DATA.setTenant(k));
 if(X.JY.sel&&!X.JY.list.some(j=>j.id===X.JY.sel))X.JY.sel=null;
 G(()=>X.syncJy());G(()=>W.ODX&&W.ODX.preset&&W.ODX.preset(k));G(()=>{if(S.od){S.od.gsel=(W.ODX.GAPS[0]||{}).id||"G07";S.od.choice={};S.od.gdim="all"}});G(()=>toast("Demo scenario: "+SCN.list[k].n,"good"));G(()=>render())};
SCN.wfs=k=>pack[k]?pack[k].wfs:[];
SCN.counts=k=>pack[k]?{journeys:pack[k].jys.length,workflows:pack[k].wfs.length}:{journeys:0,workflows:0};
/* the chooser on the Journey maps screen */
function inject(){if(G(()=>S.screen,"")!=="ppl_jrny")return;const sc=D.querySelector("#view .screen");if(!sc||sc.querySelector(".r28-scn"))return;
 const chips=Object.keys(SCN.list).map(k=>`<button type="button" class="chip r15-fv" data-r28-scn="${k}" aria-pressed="${k===SCN.cur}"${k===SCN.cur?' aria-current="true"':""} title="${SCN.list[k].d}">${SCN.list[k].n}</button>`).join("");
 const html=`<nav class="r15-fam r28-scn" aria-label="Demo scenario"><span class="r15-fl">Demo scenario</span><span class="r15-fc">${chips}</span></nav><p class="muted small" style="margin:4px 2px 10px">${SCN.list[SCN.cur].d} Each scenario is a separate demo with its own journeys and workflows. All organizations and figures are fictional sample data.</p>`;
 const hero=sc.querySelector(":scope > .hero");hero?hero.insertAdjacentHTML("afterend",html):sc.insertAdjacentHTML("afterbegin",html)}
const _r=W.render;W.render=function(){const r=_r.apply(this,arguments);try{inject()}catch(e){console.error("r28 scn",e)}return r};
D.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-r28-scn]");if(b)SCN.set(b.dataset.r28Scn)});
G(()=>SEARCHX.push(()=>Object.keys(SCN.list).map(k=>({g:"Go to",t:"Demo scenario: "+SCN.list[k].n,m:SCN.list[k].d,c:"--p4",f:()=>{SCN.set(k);go("ppl_jrny")},k:"demo scenario industry journeys "+SCN.list[k].n.toLowerCase()}))));
const q=G(()=>new URLSearchParams(location.search).get("scenario"),null);if(q&&SCN.list[q])setTimeout(()=>SCN.set(q),600);
})();
