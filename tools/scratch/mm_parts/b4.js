/* ---------- matrix ---------- */
const BSH=["Strategy","Projects","Money","Build","Service ops","CMDB","Observe","People","Knowledge","Platform"];
function matrixPane(){
 const n=MODS.length,bm=BANDS.map(()=>BANDS.map(()=>[]));FL.forEach(f=>bm[MB[f.from].bi][MB[f.to].bi].push(f));
 const hv=c=>c?`--v:${Math.min(1,.2+c*.16).toFixed(2)}`:"";
 const mxMax=Math.max.apply(null,bm.flat().map(a=>a.length));
 const bsum=`<div class="mm-bmx" style="--n:${BANDS.length}"><span class="mm-bh0">From (rows) to (columns)</span>${BANDS.map((b,i)=>`<span class="mm-bh" title="${E(b[1])}">${BSH[i]}</span>`).join("")}${BANDS.map((b,i)=>`<span class="mm-bh r">${E(b[1])}</span>`+BANDS.map((c,j)=>{const k=bm[i][j].length;return k?`<button type="button" class="mm-c big" style="--v:${Math.min(1,.15+k/mxMax*.85).toFixed(2)}" data-mm-bcell="${i}-${j}" aria-label="${E(b[1])} to ${E(c[1])}: ${k} flows">${k}</button>`:`<i class="mm-z"></i>`}).join("")).join("")}</div>`;
 let hdr=`<span class="mm-corner">Pushes from (rows), pulls to (columns)</span>`+MODS.map(m=>`<button type="button" class="mm-ch" data-mm-sel="${m.id}" style="--c:${bandCol(m.bi)}" title="${E(m.name)}">${E(m.sn)}</button>`).join("");
 let rows="";MODS.forEach(a=>{rows+=`<button type="button" class="mm-rh" data-mm-sel="${a.id}" style="--c:${bandCol(a.bi)}"><i></i>${E(a.sn)}</button>`+MODS.map((b,j)=>{const k=flowsBetween(a.id,b.id).length;const bs=j&&MODS[j-1].bi!==b.bi?" bs":"";return a.id===b.id?`<i class="mm-z dg${bs}"></i>`:k?`<button type="button" class="mm-c${bs}" style="${hv(k)}" data-mm-cell="${a.id}>${b.id}" aria-label="${E(a.sn)} to ${E(b.sn)}: ${k} flows">${k}</button>`:`<i class="mm-z${bs}"></i>`}).join("")});
 const sp=BANDS.map(()=>0);
 return `<div class="mm-grid2"><div class="card glass"><div class="eyebrow">Band by band</div><h3 class="mm-h">Where the 10 bands exchange data</h3><p class="small muted">Rows push, columns pull. Darker means more flows. Select a cell to list them.</p><div class="mm-sc">${bsum}</div>${legend([["More flows","--p1"],["No flow","--hair"]])}</div>
 <div class="card glass"><div class="eyebrow">Reading it</div><h3 class="mm-h">What the matrix tells you</h3><ul class="small mm-ul"><li><b>${ST().fnd.noPush.length+ST().fnd.noPull.length}</b> modules have no push or no pull at all.</li><li>The densest block is <b>${(()=>{let b=[0,0,0];BANDS.forEach((x,i)=>BANDS.forEach((y,j)=>{if(bm[i][j].length>b[2])b=[i,j,bm[i][j].length]}));return E(BANDS[b[0]][1])+" to "+E(BANDS[b[1]][1])+" ("+b[2]+")"})()}</b>.</li><li>A filled cell near the diagonal inside one band is a local handoff. A filled cell far from it is a cross-team dependency that needs an owner.</li><li>Rows are listed in band order, so each block of columns is one band.</li></ul></div></div>
 <div class="card glass" style="margin-top:14px"><div class="eyebrow">Module by module</div><h3 class="mm-h">${n} modules, ${FL.length} flows</h3><div class="mm-mxs" tabindex="0" aria-label="Module by module matrix, scrolls sideways"><div class="mm-mx" style="--n:${n}">${hdr}${rows}</div></div>${legend([["Flow count (1 lightest, 4 or more darkest)","--p1"],["Same module","--hair"]])}</div>`;
}
/* ---------- journeys ---------- */
function journeyCard(j){
 const hops=j.steps.slice(0,-1).map((s,i)=>flowsBetween(s,j.steps[i+1])[0]||null);
 const bandsX=new Set(j.steps.map(s=>MB[s].bi)).size,ev=hops.filter(h=>h&&h.mode==="event").length,hu=hops.filter(h=>h&&h.mode==="human").length,miss=hops.filter(h=>!h).length;
 const steps=j.steps.map((s,i)=>{const m=MB[s],st=stepsOf(s);return `<div class="mm-js"><button type="button" class="mm-jm" data-mm-gomod="${s}" style="--c:${bandCol(m.bi)}"><span class="small muted">Step ${i+1}</span><b>${E(m.sn)}</b><small>${E(BANDS[m.bi][1])}</small></button>${i<hops.length?`<div class="mm-jc">${hops[i]?`<span class="mm-jar" aria-hidden="true"></span><b>${E(hops[i].data)}</b><span class="small muted">${E(hops[i].trig)}</span><span class="row">${modePillH(hops[i].mode)}${hops[i].refs[0]?`<span class="pill ${hops[i].refs[0].kind==="reg"?"info":"warn"}">${E(hops[i].refs[0].label)}</span>`:`<span class="pill mute">no entity</span>`}</span>`:`<span class="pill bad">No documented flow</span>`}</div>`:""}</div>`}).join("");
 return `<div class="card glass mm-jcard"><div class="row sp"><div><div class="eyebrow">Journey</div><h3 class="mm-h">${E(j.t)}</h3></div><div class="row"><button type="button" class="btn primary" data-mm-trace="${j.id}">Trace on map</button></div></div>
 <p class="story small" data-role="story">${E(j.story)}</p><div class="row mm-jstat"><span class="pill info">${j.steps.length} steps</span><span class="pill mute">${bandsX} bands</span><span class="pill good">${ev} event handoffs</span><span class="pill warn">${hu} human handoffs</span>${miss?`<span class="pill bad">${miss} undocumented</span>`:`<span class="pill good">All handoffs documented</span>`}</div>
 <div class="mm-jscroll flowscroll" tabindex="0" aria-label="${E(j.t)} steps, scrolls sideways"><div class="mm-jrow">${steps}</div></div></div>`;
}
function journeysPane(){return `<p class="muted small" style="margin:0 0 12px">Each journey crosses several modules. The caption on every arrow is the data handed over, when, and how. Select a module to open it on the map.</p><div class="mm-jwrap">${JOURNEYS.map(journeyCard).join("")}</div>${legend([["Event: sent when it happens","--mm-event"],["Batch: sent on a schedule","--mm-batch"],["Human: a person acts","--mm-human"]])}`}
/* ---------- coverage ---------- */
function covRows(){
 return MODS.map(m=>{const f=[];if(!m.nout)f.push("No push");if(!m.nin)f.push("No pull");if(!m.proc)f.push("No process");
  if(m.nout&&!m.out.some(x=>x.reg))f.push("No registered data on push");if(m.nin&&!m.inn.some(x=>x.reg))f.push("No registered data on pull");if(m.nonOwn.length)f.push("Writes "+m.nonOwn.length+" entity not owned");
  const noEnt=m.out.concat(m.inn).filter(x=>!x.reg).length;
  return{id:m.id,n:m.name,band:BANDS[m.bi][1],push:m.nout,pull:m.nin,proc:m.proc?m.steps+" steps":"None",entities:m.w.length+" write, "+m.r.length+" read",gaps:noEnt,find:f,status:f.length?"Needs work":"Complete"}});
}
function coveragePane(){
 const s=ST(),F=s.fnd,rows=covRows();
 const pl=Object.keys(F.planned).sort((a,b)=>F.planned[b]-F.planned[a]);
 const fc=(t,n,body,rem,cls)=>`<div class="mm-fc"><div class="row sp"><b>${t}</b><span class="pill ${cls||(n?"warn":"good")}">${n}</span></div><div class="mm-fcb">${body}</div><p class="small muted mm-fcr">${rem}</p></div>`;
 const chips=a=>a.length?`<div class="row">${a.slice(0,8).map(m=>modChip(m.id)).join("")}${a.length>8?`<span class="pill mute">+${a.length-8}</span>`:""}</div>`:`<span class="small">None. Every module qualifies.</span>`;
 const cards=[
  fc("No outgoing flow",F.noPush.length,chips(F.noPush),"Add at least one flow that publishes this module's data.",F.noPush.length?"bad":"good"),
  fc("No incoming flow",F.noPull.length,chips(F.noPull),"Add at least one flow that feeds this module from its source.",F.noPull.length?"bad":"good"),
  fc("No process definition",F.noProc.length,chips(F.noProc),"Define who does what in Workflow designer, with times and gates."),
  fc("Push or pull with no registered data",F.noReg.length,chips(F.noReg),"Register the entity or point the flow at an existing one."),
  fc("Writes an entity it does not own",F.nonOwn.length,chips(F.nonOwn),"Move the write behind the owning module or transfer ownership in the registry."),
  fc("Planned entities that block a contract",pl.length,pl.length?`<div class="row">${pl.slice(0,6).map(i=>`<span class="pill warn">${E(PLN[i].label)} ${F.planned[i]}</span>`).join("")}${pl.length>6?`<span class="pill mute">+${pl.length-6}</span>`:""}</div>`:"None.","Registering these removes the most gaps first. The count is flows that need it.")
 ];
 const tbl=btHTML({id:"mm_cov",h:460,rowH:54,key:"id",sort:{k:"n",d:1},exportName:"module-coverage",facets:["band","status"],cols:[
  {k:"n",label:"Module",val:r=>r.n,fmt:r=>`<b>${E(r.n)}</b>`},{k:"band",label:"Band",val:r=>r.band,fmt:r=>E(r.band)},
  {k:"push",label:"Pushes",val:r=>r.push,fmt:r=>`<span class="num">${r.push}</span>`},{k:"pull",label:"Pulls",val:r=>r.pull,fmt:r=>`<span class="num">${r.pull}</span>`},
  {k:"proc",label:"Process",val:r=>r.proc,fmt:r=>r.proc==="None"?pill("None","warn"):pill(r.proc,"good")},{k:"entities",label:"Registry entities",val:r=>r.entities,fmt:r=>E(r.entities)},
  {k:"gaps",label:"Flows with no registered data",val:r=>r.gaps,fmt:r=>`<span class="num">${r.gaps}</span>`},
  {k:"status",label:"Findings",val:r=>r.status+r.find.length,wrap:1,fmt:r=>r.find.length?r.find.map(x=>`<span class="pill warn">${E(x)}</span>`).join(" "):pill("Complete","good")}],rows,open:id=>{S.v.mm_v=0;MM.sel=id;MM.pair=null;MM.jny=null;MM.flow=null;MM.flyIds=[id];render()}});
 return `<div class="mm-fcg">${cards.join("")}</div><div style="margin-top:14px">${tbl}</div>`;
}
/* ---------- screen ---------- */
function oldPane(){let h="";try{h=OLD?OLD():"";h=h.replace(procCard("plat_map"),"")}catch(e){h=""}return `<div class="mm-old"><p class="small muted">The original 14-area view: a high-level loop from strategy to demand, projects, build, change, deploy, operate, incident and problem, with its handoffs and process coverage. Kept so nothing is lost.</p>${h}</div>`}
function screen(){
 if(!init())return `<div class="screen">${hero("Master process flow","Loading the module map","The platform registry is still starting.","")}</div>`;
 const s=ST(),nB=BANDS.length;
 const kp=kpiRow([["Modules",s.n,"in "+nB+" bands"],["Data flows",s.nf,"push and pull"],["Documented push and pull",METRICS.m_mm_pp.cur+"%","modules, with registered data",{metric:"m_mm_pp"}],["With a data contract",METRICS.m_mm_ct.cur+"%","flows, registered entity",{metric:"m_mm_ct"}],["Live or near-live",METRICS.m_mm_live.cur+"%","of contracted flows",{metric:"m_mm_live"}]]);
 const hero_=hero("Master process flow","Every module and how they feed each other",`<b data-role="metric">${s.n}</b> modules in <b data-role="metric">${nB}</b> bands exchange data through <b data-role="metric">${s.nf}</b> documented flows. <b data-role="metric">${s.nf-s.fnd.noContract.length}</b> of them map to a registered entity, <b data-role="metric">${s.fnd.noContract.length}</b> still move data nobody has defined, and <b data-role="metric">${s.fnd.noProc.length}</b> modules have no process definition.`,`<div class="row">${fchip("m_mm_pp")}${fchip("m_mm_ct")}${fchip("m_mm_live")}${stdChip("itil5")}${stdChip("togaf")}${stdChip("bpmn")}</div>`);
 const pane0=`${kp}${toolbar()}<div class="mm-wrap"><div class="mm-cv">${mapHTML()}<div class="mm-note small muted" data-mm-note aria-live="polite"></div></div><aside class="mm-insp glass" data-mm-insp aria-label="Module details"></aside></div>${legendHTML()}`;
 setTimeout(mount,0);
 return `<div class="screen mm-screen">${hero_}${lensNote()}${views("mm_v",["Module map","Matrix","Journeys","Coverage","Process areas (original)"],[pane0,matrixPane(),journeysPane(),coveragePane(),oldPane()])}${procCard("plat_map")}</div>`;
}
REG("plat_map","Master process flow","platform",ICON,screen);
/* ---------- mount ---------- */
let RO=null;
function mount(){
 const vp=vpEl();if(!vp||!init())return;
 drawStatic();update();
 if(!MM.view&&vp.clientWidth>0){MM.view=clusterView()}
 if(MM.view&&vp.clientWidth>0)applyView();
 if(MM.flyIds&&vp.clientWidth>0){const ids=MM.flyIds;MM.flyIds=null;if(MM.jny){const j=JOURNEYS.find(x=>x.id===MM.jny);flyTo(j?j.steps:ids)}else flyTo(ids)}
 if(window.ResizeObserver){if(RO)RO.disconnect();let w0=vp.clientWidth;RO=new ResizeObserver(()=>{const w=vp.clientWidth;if(w0===0&&w>0&&!MM.view)MM.view=clusterView();if(w>0){applyView()}w0=w});RO.observe(vp)}
 /* wheel zoom needs a non-passive listener */
 vp.addEventListener("wheel",ev=>{if(!(ev.ctrlKey||ev.metaKey))return;ev.preventDefault();const r=vp.getBoundingClientRect();zoomAt(ev.deltaY<0?1.12:1/1.12,ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
}
function goMap(o){S.v.mm_v=0;Object.assign(MM,o);go("plat_map")}
function openEnt(id){if(S.map&&S.map.er)S.map.er.sel=id;if(window.ATLAS&&ATLAS.focus)ATLAS.focus(id);else go("plat_data")}
/* ---------- events ---------- */
let drag=null,sup=false;const pts=new Map();let pinch=null;
document.addEventListener("pointerdown",e=>{
 const vp=e.target.closest&&e.target.closest("[data-mm-vp]");if(!vp||e.target.closest(".mm-ctl,.mm-mini")||!MM.view)return;
 pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pts.size===1)drag={x:e.clientX,y:e.clientY,vx:MM.view.x,vy:MM.view.y,moved:0};
 else if(pts.size===2){const p=[...pts.values()];pinch={d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),k:MM.view.k,vx:MM.view.x,vy:MM.view.y,mx:(p[0].x+p[1].x)/2,my:(p[0].y+p[1].y)/2};drag=null}
});
window.addEventListener("pointermove",e=>{
 if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 const vp=vpEl();if(!vp)return;
 if(pinch&&pts.size>=2){const p=[...pts.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),nk=Math.max(.2,Math.min(2.2,pinch.k*d/pinch.d)),r=vp.getBoundingClientRect(),cx=pinch.mx-r.left,cy=pinch.my-r.top;MM.view={k:nk,x:cx-(cx-pinch.vx)*nk/pinch.k,y:cy-(cy-pinch.vy)*nk/pinch.k};applyView();sup=true;return}
 if(drag&&pts.has(e.pointerId)){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=Math.max(drag.moved,Math.abs(dx)+Math.abs(dy));if(drag.moved>5){MM.view={k:MM.view.k,x:drag.vx+dx,y:drag.vy+dy};applyView();vp.classList.add("pan")}}
});
const pend=e=>{pts.delete(e.pointerId);if(drag&&drag.moved>5){sup=true;setTimeout(()=>{sup=false},60)}if(pts.size<2)pinch=null;if(!pts.size)drag=null;const vp=vpEl();if(vp)vp.classList.remove("pan")};
window.addEventListener("pointerup",pend);window.addEventListener("pointercancel",pend);
document.addEventListener("click",e=>{if(sup){e.stopPropagation();e.preventDefault();sup=false}},true);
document.addEventListener("pointerover",e=>{
 const t=e.target.closest&&e.target.closest("[data-mm-edge],[data-mm-bund]"),tip=document.querySelector("[data-mm-tip]");if(!tip)return;
 if(!t){tip.hidden=true;return}
 let txt="";
 if(t.dataset.mmEdge){const k=t.dataset.mmEdge.split(">"),fl=flowsBetween(k[0],k[1]);txt=`<b>${E(nameOf(k[0]))} to ${E(nameOf(k[1]))}</b><br>${E(fl[0].data)}${fl.length>1?` and ${fl.length-1} more`:""}. Select for the data contract.`}
 else{const [i,j]=t.dataset.mmBund.split("-").map(Number),n=(ST().bandPairs.get(t.dataset.mmBund)||[]).length;txt=`<b>${E(BANDS[i][1])} and ${E(BANDS[j][1])}</b><br>${n} flows between the two bands. Select to list them.`}
 tip.innerHTML=txt;tip.hidden=false;const vp=vpEl(),r=vp.getBoundingClientRect();tip.style.left=Math.min(r.width-250,Math.max(8,e.clientX-r.left+12))+"px";tip.style.top=Math.max(8,e.clientY-r.top+14)+"px";
});
document.addEventListener("click",e=>{
 let t;
 if((t=e.target.closest("[data-mm-n]"))){selectMod(t.dataset.mmN,false);return}
 if((t=e.target.closest("[data-mm-edge]"))){const k=t.dataset.mmEdge,fl=PAIRN.get(k);if(fl){MM.edge=k;MM.flow=fl[0].id;MM.insp=true;update()}return}
 if((t=e.target.closest("[data-mm-bund]"))){const k=t.dataset.mmBund,[i,j]=k.split("-").map(Number);openFlows(BANDS[i][1]+" and "+BANDS[j][1],ST().bandPairs.get(k)||[],"Every documented flow between these two bands, both directions.");return}
 if((t=e.target.closest("[data-mm-sel]"))){const id=t.dataset.mmSel;if(t.closest(".mm-insp")){selectMod(id,true)}else{if(t.closest(".mm-dr")&&window.closeDrawer)closeDrawer();goMap({sel:id,pair:null,jny:null,flow:null,edge:null,flyIds:[id]})}return}
 if((t=e.target.closest("[data-mm-gomod]"))){goMap({sel:t.dataset.mmGomod,pair:null,jny:null,flow:null,edge:null,flyIds:[t.dataset.mmGomod]});return}
 if((t=e.target.closest("[data-mm-tab]"))){MM.tab=t.dataset.mmTab;if(MM.tab!=="blast")MM.blast=false;update();return}
 if((t=e.target.closest("[data-mm-flow]"))){const f=FL.find(x=>x.id===t.dataset.mmFlow);if(f){MM.flow=f.id;MM.edge=f.from+">"+f.to;MM.insp=true;if(t.closest(".mm-dr")&&window.closeDrawer)closeDrawer();update()}return}
 if((t=e.target.closest("[data-mm-showflow]"))){const f=FL.find(x=>x.id===t.dataset.mmShowflow);if(f){const was=!!document.querySelector("[data-mm-vp]");if(t.closest(".mm-dr")&&window.closeDrawer)closeDrawer();goMap({sel:f.from,pair:null,jny:null,flow:f.id,edge:f.from+">"+f.to,flyIds:[f.from,f.to]})}return}
 if(e.target.closest("[data-mm-back]")){MM.flow=null;update();return}
 if((t=e.target.closest("[data-mm-close]"))){MM.sel=null;MM.pair=null;MM.jny=null;MM.flow=null;MM.edge=null;MM.blast=false;update();return}
 if((t=e.target.closest("[data-mm-open]"))){const id=t.dataset.mmOpen;audit("Module map: opened screen",scName(id));go(id);return}
 if((t=e.target.closest("[data-mm-cmp]"))){setPair(t.dataset.mmCmp,"",false);const b=document.querySelector("[data-mm-pb]");if(b)b.focus();return}
 if((t=e.target.closest("[data-mm-try]"))){const p=t.dataset.mmTry.split(",");setPair(p[0],p[1]);return}
 if(e.target.closest("[data-mm-swap]")){if(MM.pair){setPair(MM.pair.b,MM.pair.a)}return}
 if(e.target.closest("[data-mm-pall]")){MM.pairAll=!MM.pairAll;update();return}
 if(e.target.closest("[data-mm-blast]")){MM.blast=!MM.blast;update();return}
 if((t=e.target.closest("[data-mm-ent]"))){openEnt(t.dataset.mmEnt);return}
 if((t=e.target.closest("[data-mm-tg]"))){const k=t.dataset.mmTg;if(k==="push")MM.showPush=!MM.showPush;else if(k==="pull")MM.showPull=!MM.showPull;else MM.byMode=!MM.byMode;update();return}
 if((t=e.target.closest("[data-mm-z]"))){const k=t.dataset.mmZ;if(k==="in")zoomAt(1.25);else if(k==="out")zoomAt(.8);else if(k==="fit")setView(fitView(),true);else setView(clusterView(),true);return}
 if((t=e.target.closest("[data-mm-cell]"))){const p=t.dataset.mmCell.split(">"),fl=flowsBetween(p[0],p[1]);openFlows(nameOf(p[0])+" pushes to "+nameOf(p[1]),fl,fl.length+" flow"+(fl.length===1?"":"s")+" in this direction.");return}
 if((t=e.target.closest("[data-mm-bcell]"))){const p=t.dataset.mmBcell.split("-").map(Number),fl=FL.filter(f=>MB[f.from].bi===p[0]&&MB[f.to].bi===p[1]);openFlows(BANDS[p[0]][1]+" pushes to "+BANDS[p[1]][1],fl,fl.length+" flows.");return}
 if((t=e.target.closest("[data-mm-trace]"))){goMap({jny:t.dataset.mmTrace,sel:null,pair:null,flow:null,edge:null,flyIds:[]});audit("Module map: traced journey",t.dataset.mmTrace);return}
 if((t=e.target.closest("[data-mm-res] [data-mm-pick]"))){const id=t.dataset.mmPick;const r=document.querySelector("[data-mm-res]");if(r)r.hidden=true;const q=document.querySelector("[data-mm-q]");if(q)q.value=MB[id].name;selectMod(id,true);return}
 if(!e.target.closest(".mm-search")){const r=document.querySelector("[data-mm-res]");if(r)r.hidden=true}
});
document.addEventListener("change",e=>{
 const a=e.target.closest("[data-mm-pa]"),b=e.target.closest("[data-mm-pb]");
 if(a||b){const pa=document.querySelector("[data-mm-pa]").value,pb=document.querySelector("[data-mm-pb]").value;
  if(pa&&pb&&pa===pb){toast("Pick two different modules","warn");return}
  if(pa||pb)setPair(pa,pb);else{MM.pair=null;update()}}
});
document.addEventListener("input",e=>{
 const q=e.target.closest("[data-mm-q]");if(!q)return;const r=document.querySelector("[data-mm-res]"),v=q.value.toLowerCase().trim();
 if(!v){r.hidden=true;return}
 const hits=MODS.filter(m=>(m.name+" "+m.sn+" "+m.al.join(" ")+" "+BANDS[m.bi][1]+" "+m.r.join(" ")+" "+m.w.join(" ")).toLowerCase().includes(v)).slice(0,8);
 r.innerHTML=hits.length?hits.map(m=>`<button type="button" class="mm-pick" data-mm-pick="${m.id}"><i style="background:${bandCol(m.bi)}"></i><b>${E(m.name)}</b><small>${E(BANDS[m.bi][1])}</small></button>`).join(""):`<span class="small muted" style="padding:8px">No module matches</span>`;r.hidden=false;
});
document.addEventListener("keydown",e=>{
 const q=e.target.closest&&e.target.closest("[data-mm-q]");
 if(q&&e.key==="Enter"){const f=document.querySelector("[data-mm-res] [data-mm-pick]");if(f){e.preventDefault();f.click()}return}
 if(q&&e.key==="Escape"){const r=document.querySelector("[data-mm-res]");if(r)r.hidden=true;return}
 const vp=e.target.closest&&e.target.closest("[data-mm-vp]");if(!vp||e.target!==vp||!MM.view)return;
 const st=60;if(e.key==="ArrowLeft")MM.view.x+=st;else if(e.key==="ArrowRight")MM.view.x-=st;else if(e.key==="ArrowUp")MM.view.y+=st;else if(e.key==="ArrowDown")MM.view.y-=st;else if(e.key==="+"||e.key==="=")zoomAt(1.2);else if(e.key==="-")zoomAt(.83);else return;
 e.preventDefault();applyView();
});
/* minimap click and drag */
function miniMove(e){const m=document.querySelector("[data-mm-mini]"),vp=vpEl();if(!m||!vp||!MM.view)return;const r=m.getBoundingClientRect(),sc=Math.min(r.width/LAY.W,r.height/LAY.H),ox=(r.width-LAY.W*sc)/2,oy=(r.height-LAY.H*sc)/2;
 const wx=(e.clientX-r.left-ox)/sc,wy=(e.clientY-r.top-oy)/sc;MM.view={k:MM.view.k,x:vp.clientWidth/2-wx*MM.view.k,y:vp.clientHeight/2-wy*MM.view.k};applyView()}
let miniDown=false;
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("[data-mm-mini]")){miniDown=true;miniMove(e);e.preventDefault()}});
window.addEventListener("pointermove",e=>{if(miniDown)miniMove(e)});window.addEventListener("pointerup",()=>{miniDown=false});
/* ---------- search and chat ---------- */
SEARCHX.push(()=>{if(!init())return[];return MODS.map(m=>({g:"Modules",t:m.name,m:BANDS[m.bi][1]+" · "+m.nout+" out, "+m.nin+" in",c:"--p4",f:()=>goMap({sel:m.id,pair:null,jny:null,flow:null,edge:null,flyIds:[m.id]}),k:m.al.join(" ")+" module map pushes pulls "+m.r.join(" ")+" "+m.w.join(" ")}))});
ASKX.push(q=>{
 const t=q.toLowerCase();if(!/connect|relat|link|between|reach|path|push|pull|read|module map|how do|how does|what does|what pulls|what reads/.test(t))return false;
 if(!init())return false;const ids=matchMods(q);
 let m;
 if((/connect|relate|link|between|reach|path|talk/.test(t)||/how (do|does)/.test(t))&&ids.length>=2){
  const r=between(ids[0],ids[1]);goMap({pair:{a:ids[0],b:ids[1]},sel:null,jny:null,flow:null,edge:null,pairAll:false,flyIds:[ids[0],ids[1]].concat(r.two.slice(0,12).map(p=>p.via))});
  say(q,{t:`${nameOf(ids[0])} and ${nameOf(ids[1])}: ${r.direct.length} direct flow${r.direct.length===1?"":"s"} one way, ${r.rev.length} the other, and ${r.two.length} two-step paths. ${r.direct[0]?`For example ${nameOf(ids[0])} sends "${r.direct[0].data}" to ${nameOf(ids[1])}.`:r.chain?"They connect through a longer chain.":""}`,steps:["Opened the module map","Compared the two modules"]});return true}
 if((m=t.match(/what does (.+?) (push|send|write|give)\w* to (.+)/))&&ids.length>=2){
  const a=ids[0],b=ids[1],fl=flowsBetween(a,b);goMap({pair:{a,b},sel:null,jny:null,flow:null,edge:null,flyIds:[a,b]});
  say(q,{t:fl.length?`${nameOf(a)} pushes to ${nameOf(b)}: ${fl.map(f=>f.data+" ("+f.trig.toLowerCase()+")").join("; ")}.`:`${nameOf(a)} has no direct push to ${nameOf(b)}. The map shows two-step paths instead.`,steps:["Opened the module map"]});return true}
 if(/what (pulls|reads|takes|uses|consumes)\w* (data )?from/.test(t)&&ids.length){
  const a=ids[0],nb=neighbors(a).push;goMap({sel:a,tab:"pushes",pair:null,jny:null,flow:null,edge:null,flyIds:[a]});
  say(q,{t:nb.length?`${nb.length} modules pull from ${nameOf(a)}: ${nb.map(nameOf).join(", ")}.`:`No module pulls from ${nameOf(a)} yet.`,steps:["Opened the module map on "+nameOf(a)]});return true}
 if(/what does .* pull from|where does .* get|what feeds/.test(t)&&ids.length){
  const a=ids[0],nb=neighbors(a).pull;goMap({sel:a,tab:"pulls",pair:null,jny:null,flow:null,edge:null,flyIds:[a]});
  say(q,{t:`${nameOf(a)} pulls from ${nb.length} modules: ${nb.map(nameOf).join(", ")}.`,steps:["Opened the module map on "+nameOf(a)]});return true}
 if(/module map|master process flow|every module/.test(t)){goMap({});say(q,{t:`The module map shows ${MODS.length} modules and ${FL.length} data flows.`,steps:["Opened the module map"]});return true}
 return false;
});
