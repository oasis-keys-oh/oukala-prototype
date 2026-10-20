/* ---------- canvas ---------- */
const ARR=["push","pull","event","batch","human","pd","pr","p2","jn"];
const bandCol=bi=>"var(--mm-b"+bi+")";
function modePillH(md){return `<span class="mm-md ${md}">${md}</span>`}
function refChips(f){
 if(!f.refs.length)return `<span class="pill mute" title="No registry entity carries this data yet">no entity</span>`;
 return f.refs.slice(0,3).map(r=>`<span class="pill ${r.kind==="reg"?"info":"warn"}" title="${E(r.kind==="reg"?"Registered entity":"Planned entity, not registered yet")}">${E(r.label)}${r.kind==="plan"?" (planned)":""}</span>`).join("")+(f.refs.length>3?`<span class="pill mute">+${f.refs.length-3}</span>`:"");
}
function mapHTML(){
 const W=LAY.W,H=LAY.H;
 const lanes=LAY.lanes.map(l=>`<div class="mm-lane" style="top:${l.y}px;height:${l.h}px;left:${GL}px;width:${W-GL-6}px;--c:${bandCol(l.bi)}"><span class="mm-lt">${E(l.name)}<small>${l.n} modules</small></span></div>`).join("");
 const nodes=MODS.map(m=>`<button type="button" class="mm-n" data-mm-n="${m.id}" style="left:${m.x}px;top:${m.y}px;--c:${bandCol(m.bi)}" aria-label="${E(m.name)}, ${m.nout} pushes, ${m.nin} pulls${m.proc?"":", no process defined"}"><i class="mm-bar"></i><b>${E(m.sn)}</b><span class="mm-io"><em class="o">${m.nout}</em> out <em class="i">${m.nin}</em> in</span>${m.proc?"":`<u class="mm-np" title="No process defined for this module yet"></u>`}</button>`).join("");
 const mk=ARR.map(c=>`<marker id="mm-ar-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" class="mm-mk ${c}"/></marker>`).join("");
 return `<div class="mm-vp" data-mm-vp tabindex="0" role="application" aria-label="Module map. Drag to pan. Control plus scroll or the plus and minus buttons to zoom. Select a module for its pushes and pulls."><div class="mm-world" data-mm-world style="width:${W}px;height:${H}px">${lanes}<svg class="mm-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>${mk}</defs><g class="mm-bund" data-mm-bund-g></g><g class="mm-edges" data-mm-edges></g></svg>${nodes}</div>
 <div class="mm-ctl" role="group" aria-label="Zoom"><button type="button" class="btn quiet" data-mm-z="in" aria-label="Zoom in">+</button><button type="button" class="btn quiet" data-mm-z="out" aria-label="Zoom out">&minus;</button><button type="button" class="btn quiet" data-mm-z="fit">Fit all</button><button type="button" class="btn quiet" data-mm-z="cluster">Incident, problem, change</button><span class="small muted" data-mm-zl>100%</span></div>
 <svg class="mm-mini" data-mm-mini viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-label="Minimap. Click to move."><g data-mm-minig></g><rect class="mm-mvp" data-mm-mvp x="0" y="0" width="10" height="10"/></svg>
 <div class="mm-tip" data-mm-tip hidden></div></div>`;
}
function drawStatic(){
 const g=document.querySelector("[data-mm-bund-g]");if(!g)return;
 const s=ST();let h="";
 s.bandPairs.forEach((fl,k)=>{const [i,j]=k.split("-").map(Number),li=LAY.lanes[i],lj=LAY.lanes[j];const y1=li.y+li.h/2,y2=lj.y+lj.h/2,x=GL-10,b=12+Math.min(70,(j-i)*9);
  h+=`<path class="mm-bu" data-mm-bund="${k}" d="M${x},${y1}C${x-b},${y1} ${x-b},${y2} ${x},${y2}" style="stroke-width:${Math.min(9,1.4+fl.length*.22)}"><title>${E(BANDS[i][1])} and ${E(BANDS[j][1])}: ${fl.length} flows. Select to list them.</title></path>`});
 g.innerHTML=h;
 const mg=document.querySelector("[data-mm-minig]");
 if(mg)mg.innerHTML=LAY.lanes.map(l=>`<rect x="${GL}" y="${l.y}" width="${LAY.W-GL}" height="${l.h}" style="fill:${bandCol(l.bi)}" opacity=".35"/>`).join("")+MODS.map(m=>`<rect x="${m.x}" y="${m.y}" width="${NW}" height="${NH}" rx="8" class="mm-md0" data-mm-mm="${m.id}"/>`).join("");
}
function bandSet(){const s=new Set(mpGet("mm_band"));return s}
function edgesNow(){
 const bands=bandSet(),allB=bands.size>=BANDS.length,vis=id=>allB||bands.has(MB[id].band),list=[],seen={};
 const add=(a,b,cls)=>{const k=a+">"+b;if(seen[k])return;const fl=flowsBetween(a,b);if(!fl.length||!vis(a)||!vis(b))return;seen[k]=1;list.push({k,a,b,n:fl.length,fl,cls})};
 if(MM.pair&&MM.pair.a&&MM.pair.b){
  const r=between(MM.pair.a,MM.pair.b);add(r.a,r.b,"pd");add(r.b,r.a,"pr");
  r.two.slice(0,MM.pairAll?99:12).forEach(p=>{if(p.dir==="ab"){add(r.a,p.via,"p2");add(p.via,r.b,"p2")}else{add(r.b,p.via,"p2");add(p.via,r.a,"p2")}});
  if(r.chain)for(let i=0;i<r.chain.length-1;i++)add(r.chain[i],r.chain[i+1],"p2");
 }else if(MM.jny){const j=JOURNEYS.find(x=>x.id===MM.jny);if(j)for(let i=0;i<j.steps.length-1;i++)add(j.steps[i],j.steps[i+1],"jn")}
 else if(MM.sel&&MB[MM.sel]){
  if(MM.showPush)neighbors(MM.sel).push.forEach(t=>add(MM.sel,t,"push"));
  if(MM.showPull)neighbors(MM.sel).pull.forEach(s=>add(s,MM.sel,"pull"));
 }
 if(MM.byMode)list.forEach(e=>{if(e.cls==="push"||e.cls==="pull"){const c={event:0,batch:0,human:0};e.fl.forEach(f=>c[f.mode]++);e.cls=c.human>=c.batch&&c.human>c.event?"human":c.batch>c.event?"batch":"event";e.dirc=1}});
 return list;
}
function geom(list){
 const ends={};
 list.forEach(e=>{const A=MB[e.a],B=MB[e.b],same=Math.abs(A.cy-B.cy)<NH;let sa,sb;
  if(same){sa=sb=(A.cx<B.cx?"t":"b")}else{sa=B.cy>A.cy?"b":"t";sb=sa==="b"?"t":"b"}
  e.sa=sa;e.sb=sb;e.same=same;(ends[e.a+sa]=ends[e.a+sa]||[]).push({e,end:"a",o:B.cx});(ends[e.b+sb]=ends[e.b+sb]||[]).push({e,end:"b",o:A.cx})});
 Object.keys(ends).forEach(k=>{const arr=ends[k].sort((p,q)=>p.o-q.o),c=arr.length,step=Math.min(15,(NW-36)/Math.max(1,c-1));arr.forEach((x,i)=>{x.e["o"+x.end]=(i-(c-1)/2)*step})});
 list.forEach(e=>{const A=MB[e.a],B=MB[e.b],x1=A.cx+e.oa,y1=e.sa==="b"?A.y+NH:A.y,x2=B.cx+e.ob,y2=e.sb==="b"?B.y+NH:B.y;
  if(e.same){const h=24+Math.min(80,Math.abs(x2-x1)*.17),s=e.sa==="t"?-1:1;e.d=`M${x1},${y1}C${x1},${y1+s*h} ${x2},${y2+s*h} ${x2},${y2}`;e.mx=(x1+x2)/2;e.my=y1+s*h*.75}
  else{const dy=y2-y1,s=dy>0?1:-1,k=Math.max(30,Math.abs(dy)*.5);e.d=`M${x1},${y1}C${x1},${y1+s*k} ${x2},${y2-s*k} ${x2},${y2}`;e.mx=(x1+x2)/2;e.my=(y1+y2)/2}});
}
function drawEdges(){
 const g=document.querySelector("[data-mm-edges]");if(!g)return;
 const list=edgesNow();geom(list);
 g.innerHTML=list.map(e=>`<g class="mm-e ${e.cls}${MM.edge===e.k?" on":""}" data-mm-edge="${e.k}"><path class="mm-hit" d="${e.d}"/><path class="mm-line" d="${e.d}" marker-end="url(#mm-ar-${e.cls})"/>${e.n>1?`<g class="mm-bub" transform="translate(${e.mx},${e.my})"><circle r="9"/><text y="3.6" text-anchor="middle">${e.n}</text></g>`:""}</g>`).join("");
 const note=document.querySelector("[data-mm-note]");if(note)note.textContent=noteText(list);
}
function noteText(list){
 if(MM.pair&&MM.pair.a&&MM.pair.b)return `Showing direct flows and up to ${MM.pairAll?"all":"12"} two-step paths between ${nameOf(MM.pair.a)} and ${nameOf(MM.pair.b)}.`;
 if(MM.jny){const j=JOURNEYS.find(x=>x.id===MM.jny);return j?`Tracing the journey: ${j.t}.`:""}
 if(MM.sel&&MB[MM.sel]){const m=MB[MM.sel];return `${m.name}: ${list.filter(e=>e.cls!=="pull"&&e.a===m.id).length} modules receive its data, ${list.filter(e=>e.b===m.id).length} send it data. Only this module's flows are drawn.`}
 return "Select a module to draw its pushes and pulls. The faint arcs on the left count flows between bands.";
}
function styleNodes(){
 const cls={},add=(id,c)=>{cls[id]=(cls[id]||" hl")+" "+c},bands=bandSet(),allB=bands.size>=BANDS.length;
 let focus=false;
 if(MM.pair&&MM.pair.a){focus=true;add(MM.pair.a,"on pa");if(MM.pair.b){add(MM.pair.b,"on pb");const r=between(MM.pair.a,MM.pair.b);r.two.slice(0,MM.pairAll?99:12).forEach(p=>add(p.via,"nb-via"));(r.chain||[]).forEach(x=>{if(x!==MM.pair.a&&x!==MM.pair.b)add(x,"nb-via")})}}
 else if(MM.jny){focus=true;const j=JOURNEYS.find(x=>x.id===MM.jny);if(j)j.steps.forEach(s=>add(s,"nb-jn"))}
 else if(MM.sel&&MB[MM.sel]){focus=true;add(MM.sel,"on");
  if(MM.blast){blastOf(MM.sel,3).forEach((lv,i)=>lv.forEach(x=>add(x,"bl"+(i+1))))}
  else{const nb=neighbors(MM.sel);if(MM.showPush)nb.push.forEach(x=>add(x,"nb-push"));if(MM.showPull)nb.pull.forEach(x=>add(x,"nb-pull"))}}
 document.querySelectorAll("[data-mm-n]").forEach(el=>{const id=el.dataset.mmN,m=MB[id];el.className="mm-n"+(cls[id]||"")+((!allB&&!bands.has(m.band))?" off":"");el.setAttribute("aria-pressed",MM.sel===id?"true":"false")});
 const w=document.querySelector("[data-mm-world]");if(w)w.classList.toggle("focus",focus);
 const mini=document.querySelectorAll("[data-mm-mm]");mini.forEach(r=>{const c=cls[r.dataset.mmMm]||"";r.setAttribute("class","mm-md0"+(/on/.test(c)?" hi":/nb|bl/.test(c)?" nb":""))});
}
/* ---------- view (pan and zoom) ---------- */
function vpEl(){return document.querySelector("[data-mm-vp]")}
function applyView(){
 const vp=vpEl(),w=document.querySelector("[data-mm-world]");if(!vp||!w||!MM.view)return;const v=MM.view;
 w.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.k})`;vp.classList.toggle("lo",v.k<.62);
 const z=document.querySelector("[data-mm-zl]");if(z)z.textContent=Math.round(v.k*100)+"%";
 const r=document.querySelector("[data-mm-mvp]");if(r){r.setAttribute("x",-v.x/v.k);r.setAttribute("y",-v.y/v.k);r.setAttribute("width",vp.clientWidth/v.k);r.setAttribute("height",vp.clientHeight/v.k)}
}
function boxView(ids,pad,maxK){
 const vp=vpEl();if(!vp)return null;const ms=ids.map(i=>MB[i]).filter(Boolean);if(!ms.length)return null;
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;ms.forEach(m=>{x0=Math.min(x0,m.x);y0=Math.min(y0,m.y);x1=Math.max(x1,m.x+NW);y1=Math.max(y1,m.y+NH)});
 x0-=pad;y0-=pad;x1+=pad;y1+=pad;const cw=vp.clientWidth||900,ch=vp.clientHeight||600;
 const k=Math.max(.2,Math.min(maxK||1.2,cw/(x1-x0),ch/(y1-y0)));
 return{k,x:cw/2-k*(x0+x1)/2,y:ch/2-k*(y0+y1)/2};
}
function clusterView(){return boxView(["itsm_mi","itsm_inc","itsm_prb","itsm_chg","obs_std"],150,1.15)}
function fitView(){const vp=vpEl();if(!vp)return null;const cw=vp.clientWidth||900,ch=vp.clientHeight||600,k=Math.min(cw/(LAY.W-GL+80),ch/LAY.H)*.97;return{k,x:cw/2-k*(LAY.W+GL-80)/2+0,y:(ch-LAY.H*k)/2}}
let anim=0;
function setView(v,smooth){
 if(!v)return;cancelAnimationFrame(anim);
 const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(!smooth||reduce||!MM.view){MM.view=v;applyView();return}
 const s0=Object.assign({},MM.view),t0=performance.now(),D=380;
 const step=t=>{const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);MM.view={x:s0.x+(v.x-s0.x)*e,y:s0.y+(v.y-s0.y)*e,k:s0.k+(v.k-s0.k)*e};applyView();if(p<1)anim=requestAnimationFrame(step)};anim=requestAnimationFrame(step);
}
function zoomAt(f,cx,cy){
 const vp=vpEl();if(!vp||!MM.view)return;const v=MM.view,nk=Math.max(.2,Math.min(2.2,v.k*f));
 cx=cx==null?vp.clientWidth/2:cx;cy=cy==null?vp.clientHeight/2:cy;MM.view={x:cx-(cx-v.x)*nk/v.k,y:cy-(cy-v.y)*nk/v.k,k:nk};applyView();
}
function flyTo(ids){const v=boxView(ids,ids.length>1?90:170,1.1);if(v)setView(v,true)}
/* ---------- selection ---------- */
function update(){styleNodes();drawEdges();const el=document.querySelector("[data-mm-insp]");if(el){el.innerHTML=inspHTML();el.classList.toggle("open",!!(MM.sel||MM.pair||MM.flow)&&MM.insp)}
 const pa=document.querySelector("[data-mm-pa]"),pb=document.querySelector("[data-mm-pb]");if(pa)pa.value=MM.pair?MM.pair.a||"":"";if(pb)pb.value=MM.pair?MM.pair.b||"":"";
 document.querySelectorAll("[data-mm-tg]").forEach(b=>{const k=b.dataset.mmTg;b.setAttribute("aria-pressed",String(k==="push"?MM.showPush:k==="pull"?MM.showPull:MM.byMode))});
 document.querySelectorAll("[data-mm-jsel]").forEach(b=>b.classList.toggle("on",b.dataset.mmJsel===MM.jny));
}
function selectMod(id,fly,tab){
 if(!MB[id])return;MM.sel=id;MM.pair=null;MM.jny=null;MM.flow=null;MM.edge=null;MM.insp=true;if(tab)MM.tab=tab;if(!/^(pulls|pushes|proc|data|blast)$/.test(MM.tab))MM.tab="pulls";
 MM.blast=MM.tab==="blast"&&MM.blast;update();if(fly)flyTo([id].concat(neighbors(id).push.slice(0,0)));
 audit("Module map: selected module",MB[id].name);
}
function setPair(a,b,fly){
 MM.pair={a:a||"",b:b||""};MM.sel=null;MM.jny=null;MM.flow=null;MM.edge=null;MM.insp=true;MM.pairAll=false;update();
 if(a&&b){const r=between(a,b),ids=[a,b].concat(r.two.slice(0,12).map(p=>p.via));if(fly!==false)flyTo(ids);audit("Module map: compared modules",nameOf(a)+" and "+nameOf(b))}
}
