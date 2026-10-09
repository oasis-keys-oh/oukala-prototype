/* ---------- process connections: layout, drawing, panel ---------- */
const MODEC={event:"info",batch:"mute",human:"warn"},MODEN={event:"Event",batch:"Batch",human:"Human"};
const WHON={human:"Person",agent:"AI agent",auto:"Automatic",gate:"Approval gate"},WHOC={human:"mute",agent:"info",auto:"good",gate:"warn"};
function layoutP(){
 const P=Z.p,g=pgraph(),nodes=new Map(),boxes=[];
 const sel=P.sel&&!/^fam:/.test(P.sel)?P.sel:null;
 if(P.hop>0&&sel&&g.ids.indexOf(sel)>=0){
  const seen=new Map([[sel,0]]);let fr=[sel];const es=g.ho.concat(P.data?g.dep:[]);
  for(let d=1;d<=P.hop;d++){const nx=[];fr.forEach(u=>es.forEach(e=>{const o=e.from===u?e.to:e.to===u?e.from:null;if(o&&!seen.has(o)){seen.set(o,d);nx.push(o)}}));fr=nx}
  const rings={};seen.forEach((d,id)=>(rings[d]=rings[d]||[]).push(id));
  Object.keys(rings).forEach(d=>{const ids=rings[d].sort((a,b)=>FIDX[pFam(a)]-FIDX[pFam(b)]||(a<b?-1:1));
   ids.forEach((id,i)=>{const n={id,kind:"proc",w:210,h:28,label:pName(id),v:"--plk-c"+FIDX[pFam(id)],proc:id};
    if(+d===0){n.x=-105;n.y=-14}else{const r=Math.max(200*d,ids.length*13),ang=-Math.PI/2+(i+(d%2?0:.5))/ids.length*2*Math.PI;n.x=Math.cos(ang)*r*1.7-105;n.y=Math.sin(ang)*r-14}
    nodes.set(id,n)})});
  return{nodes,boxes,vb:boundsOf([...nodes.values()]),focus:true};
 }
 const fams=FAM.map((f,i)=>({key:f[0],n:f[1],c:i,items:g.ids.filter(p=>pFam(p)===f[0])})).filter(f=>f.items.length);
 const flt=mpGet("plk_fam"),list=fams.filter(f=>flt.indexOf(f.key)>=0);
 const PW=210,PH=28,bw=PW+2*PX_,cols=4;
 const lay=(b,x,y)=>{const coll=!P.exp[b.key];b.coll=coll;b.x=x;b.y=y;b.w=bw;
  if(coll){b.h=HEAD+58;nodes.set("fam:"+b.key,{id:"fam:"+b.key,kind:"fam",x:x+PX_,y:y+HEAD+4,w:bw-2*PX_,h:44,label:b.n,count:b.items.length,c:b.c,b})}
  else{b.h=HEAD+b.items.length*(PH+GY)+PX_-GY+4;b.items.forEach((p,i)=>nodes.set(p,{id:p,kind:"proc",x:x+PX_,y:y+HEAD+i*(PH+GY),w:PW,h:PH,label:pName(p),v:"--plk-c"+b.c,proc:p,b}))}
  boxes.push(b)};
 let y=0;
 for(let r=0;r*cols<list.length;r++){const row=list.slice(r*cols,r*cols+cols);row.forEach((b,i)=>lay(b,i*(bw+GAP),y));y+=Math.max.apply(null,row.map(b=>b.h))+GAP}
 return{nodes,boxes,vb:boundsOf(boxes.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}))),focus:false};
}
let _PL=null;
const pNode=id=>{const L=_PL;if(L.nodes.has(id))return id;const f=pFam(id);return L.nodes.has("fam:"+f)?"fam:"+f:null};
function pGraphSvg(){
 const P=Z.p,g=pgraph();_PL=layoutP();const L=_PL;
 const acc=new Map();
 const add=(e,type)=>{const a=pNode(e.from),b=pNode(e.to);if(!a||!b||a===b)return;const k=type+"|"+a+"|"+b,r=acc.get(k)||{a,b,type,n:0,ents:new Set(),items:[]};r.n++;e.entities.forEach(x=>r.ents.add(x));r.items.push(e);acc.set(k,r)};
 g.ho.forEach(h=>add(h,h.mode));
 if(P.data)g.dep.forEach(d=>add(d,"dt"));
 const edges=[...acc.values()];
 const sel=P.sel?pNode(P.sel):null,lit=new Set();
 if(sel){lit.add(sel);edges.forEach(e=>{if(e.a===sel)lit.add(e.b);if(e.b===sel)lit.add(e.a)})}
 const q=(P.q||"").trim().toLowerCase();let hit=null;
 if(q){hit=new Set();L.nodes.forEach(n=>{const t=((n.label||"")+" "+n.id+" "+(n.proc&&PROC.defs[n.proc]?PROC.defs[n.proc].title:"")+" "+(n.b?n.b.n:"")).toLowerCase();if(t.includes(q))hit.add(n.id)});
  /* a family node matches when any process in it matches */
  L.nodes.forEach(n=>{if(n.kind==="fam"&&n.b.items.some(p=>(pName(p)+" "+p).toLowerCase().includes(q)))hit.add(n.id)})}
 const st={sel,lit:sel?lit:null,hit};
 const mk={event:"ev",batch:"ba",human:"hu",dt:"dt"};
 const ep=edges.map(e=>{const a=L.nodes.get(e.a),b=L.nodes.get(e.b),c=curve(a,b,1),on=sel&&(e.a===sel||e.b===sel);
  const tip=e.items.slice(0,4).map(h=>pName(h.from)+" to "+pName(h.to)+(h.trigger?" ("+h.trigger+")":"")).join("; ");
  return `<path class="plk-e ho ${e.type}${on?" lit":""}" d="${c.d}" style="stroke-width:${(1.3+Math.min(2.4,Math.log2(e.n+1)*.8)).toFixed(1)}px" marker-end="url(#plk-ar-p-${mk[e.type]})"><title>${E(tip)}</title></path>`}).join("");
 const bx=L.boxes.map(b=>`<g transform="translate(${b.x},${b.y})" class="plk-box" style="--c:var(--plk-c${b.c})"><rect class="bg" width="${b.w}" height="${b.h}" rx="16"/><g class="plk-bt" data-plk-ptoggle="${b.key}" tabindex="0" role="button" aria-expanded="${!b.coll}" aria-label="${E(b.n)}, ${b.coll?"collapsed":"expanded"}"><rect x="0" y="0" width="${b.w}" height="${HEAD-4}" fill="transparent"/><text class="bh" x="14" y="23">${b.coll?"▸":"▾"} ${E(trunc(b.n,26))} (${b.items.length})</text></g></g>`).join("");
 const ns=[...L.nodes.values()].map(n=>{ const o=Object.assign({},n);if(o.kind==="fam"){o.count=n.count;o.b={c:n.c}}return nodeSvgP(o,st)}).join("");
 return svgFrame("p",vbFor("p",L.vb),`${bx}<g class="plk-edges">${ep}</g><g class="plk-nodes">${ns}</g>`,"Process connections graph. Tab to a node and press Enter to select it. Arrow keys pan, plus and minus zoom.",(sel?"has-sel ":"")+(hit?"has-q":""));
}
function nodeSvgP(n,st){
 const isF=n.kind==="fam";
 const cls=["plk-n",isF?"kdom":"kent",st.sel===n.id?"sel":"",st.lit&&st.lit.has(n.id)?"lit":"",st.hit&&st.hit.has(n.id)?"hit":""].join(" ");
 const label=isF?n.label+" ("+n.count+")":n.label,c=isF?"--plk-c"+n.c:n.v,max=Math.floor((n.w-20)/6.2);
 const sub=isF?`<text class="sub" x="14" y="${n.h-9}">${n.count} processes, collapsed</text>`:"";
 return `<g class="${cls}" style="--c:var(${c})" transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})" data-plk-pn="${E(n.id)}" tabindex="0" role="button" aria-pressed="${st.sel===n.id}" aria-label="${E((isF?"Process family ":"Process ")+label)}"><title>${E(label)}</title><rect width="${n.w}" height="${n.h}" rx="${isF?12:7}"/><rect class="stripe" width="5" height="${n.h}" rx="2.5"/><text x="${isF?14:12}" y="${isF?19:n.h/2+4}">${E(trunc(label,isF?44:max))}</text>${sub}</g>`;
}
function hoRows(list,dir){
 return list.map(h=>{const o=dir==="in"?h.from:h.to;return{id:h.from+h.to,t:pName(o),sub:h.entities.map(entN).join(", ")+" · "+h.trigger,tag:MODEN[h.mode],st:MODEC[h.mode],go:()=>pickP(o,true)}});
}
function stepsHTML(pid){
 const d=PROC.defs[pid];if(!d)return"";const steps=S.proc&&S.proc[pid]||d.steps;
 return `<ol class="plk-steps">${steps.map(s=>`<li><span class="pill ${WHOC[s.who||"human"]}">${WHON[s.who||"human"]}</span> <b>${E(s.n)}</b><span class="small muted"> ${E(s.d||"")}</span></li>`).join("")}</ol>`;
}
function panelP(){
 const P=Z.p,g=pgraph();let id=P.sel;
 if(!id)return `<div class="plk-ph"><div class="eyebrow">Nothing selected</div><h3>Pick a process</h3><p class="small muted">Select a family or a process. Its handoffs light up and flow, and this panel lists what comes in and goes out, the data it reads and writes, and its steps.</p></div>
  ${lrHTML({id:"plk_phub",groups:[{key:"h",label:"Most connected processes",rows:g.ids.map(p=>({p,n:g.ho.filter(h=>h.from===p||h.to===p).length})).sort((a,b)=>b.n-a.n).slice(0,8).map(x=>({id:x.p,t:pName(x.p),sub:x.n+" handoffs",tag:FAM[FIDX[pFam(x.p)]][1],st:"info",go:()=>pickP(x.p,true)}))}],search:false})}`;
 if(/^fam:/.test(id)){const k=id.slice(4),fi=FAM[FIDX[k]],ps=g.ids.filter(p=>pFam(p)===k);
  const inn=g.ho.filter(h=>pFam(h.to)===k&&pFam(h.from)!==k),out=g.ho.filter(h=>pFam(h.from)===k&&pFam(h.to)!==k);
  return `<div class="plk-ph"><div class="eyebrow">Process family</div><h3>${E(fi[1])}</h3><p class="small muted">${ps.length} processes, ${inn.length} handoffs in, ${out.length} handoffs out.</p><div class="row"><button class="btn primary" data-plk-ptoggle="${k}">${P.exp[k]?"Collapse it":"Expand it"}</button></div></div>
  ${lrHTML({id:"plk_pf1",groups:[{key:"p",label:"Processes",rows:ps.map(p=>({id:p,t:pName(p),sub:PROC.defs[p].title,tag:(pEnts(p).w.length)+" writes",st:"mute",go:()=>pickP(p,true)}))},{key:"i",label:"Handoffs in from other families",rows:hoRows(inn,"in")},{key:"o",label:"Handoffs out to other families",rows:hoRows(out,"out")}],limit:6})}`}
 const d=PROC.defs[id];if(!d)return"";
 const inn=g.ho.filter(h=>h.to===id),out=g.ho.filter(h=>h.from===id),ents=pEnts(id),ds=downstream(id);
 const dIn=g.dep.filter(x=>x.to===id),dOut=g.dep.filter(x=>x.from===id);
 const cnt={};(S.proc&&S.proc[id]||d.steps).forEach(s=>{const w=s.who||"human";cnt[w]=(cnt[w]||0)+1});
 return `<div class="plk-ph"><div class="eyebrow">${E(FAM[FIDX[pFam(id)]][1])}</div><h3>${E(pName(id))}</h3><p class="small muted">${E(d.title)}</p>
  <div class="row" style="gap:6px;flex-wrap:wrap">${Object.keys(cnt).map(w=>`<span class="pill ${WHOC[w]}">${cnt[w]} ${WHON[w].toLowerCase()}</span>`).join("")}</div></div>
  <div class="plk-imp"><b class="small">If this breaks</b><div class="statrow plk-st"><div class="stat"><small>Processes</small><span class="num" data-role="metric">${ds.procs.length}</span></div><div class="stat"><small>Entities</small><span class="num" data-role="metric">${ds.real.length}</span></div><div class="stat"><small>Apps</small><span class="num" data-role="metric">${ds.apps.length}</span></div></div><p class="small muted" data-role="story">${ds.procs.length?"Downstream: "+ds.procs.slice(0,5).map(pName).join(", ")+(ds.procs.length>5?" and "+(ds.procs.length-5)+" more.":"."):"Nothing depends on this process through a documented handoff or written data."}</p></div>
  <div class="row plk-act"><button class="btn quiet" data-plk-phop="1">Focus 1 hop</button><button class="btn quiet" data-plk-phop="2">2</button><button class="btn quiet" data-plk-phop="3">3</button>${hasScr(id)?`<button class="btn quiet" data-plk-go="${E(id)}">Open process screen</button>`:""}</div>
  ${lrHTML({id:"plk_pp",groups:[
   {key:"in",label:"Handoffs in",rows:hoRows(inn,"in")},{key:"out",label:"Handoffs out",rows:hoRows(out,"out")},
   {key:"w",label:"Data it writes",rows:ents.w.map(x=>({id:x,t:entN(x),sub:DOM[model().eset.get(x).domain].n,tag:"Writes",st:"good",go:()=>pickD(x)}))},
   {key:"r",label:"Data it reads",rows:ents.r.map(x=>({id:x,t:entN(x),sub:DOM[model().eset.get(x).domain].n,tag:"Reads",st:"info",go:()=>pickD(x)}))},
   {key:"di",label:"Depends on data written by",rows:dIn.map(x=>({id:x.from+x.to,t:pName(x.from),sub:x.entities.map(entN).join(", "),tag:"Data",st:"mute",go:()=>pickP(x.from,true)}))},
   {key:"do",label:"Feeds data to",rows:dOut.map(x=>({id:x.from+x.to,t:pName(x.to),sub:x.entities.map(entN).join(", "),tag:"Data",st:"mute",go:()=>pickP(x.to,true)}))}
  ],limit:5})}
  <div class="plk-ps"><b class="small">Steps and who does them</b>${stepsHTML(id)}</div>`;
}
const famLegend=()=>legend(FAM.map((f,i)=>[f[1],"--plk-c"+i]));
const hoLegend=`<div class="legend plk-elg" role="note"><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho event"/></svg>Event handoff</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho batch"/></svg>Batch handoff</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho human"/></svg>Human handoff</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ho dt"/></svg>Shared data (writer to reader)</span></div>`;
function toolbarP(){
 const P=Z.p;
 return `<div class="plk-bar"><div class="plk-brow"><div class="plk-seg" role="group" aria-label="Layers"><span class="small muted">Show</span>${togBtn("p:data","Shared data dependencies",P.data,"Draw a dotted line from a process that writes data to a process that reads it")}${togBtn("p:hub","Count hub entities",P.hub,"Person, service and CI are used almost everywhere. Off keeps the picture readable.")}</div>
 ${seg("Focus",[["0","Whole map",P.hop===0],["1","1 hop",P.hop===1],["2","2 hops",P.hop===2],["3","3 hops",P.hop===3]],"data-plk-phopset")}</div>
 <div class="plk-brow"><div class="plk-seg" role="group" aria-label="Families"><button type="button" class="plk-tog" data-plk-pcol="1">Collapse all</button><button type="button" class="plk-tog" data-plk-pcol="0">Expand all</button></div>
 ${seg("View",[["graph","Graph",P.view==="graph"],["list","List",P.view==="list"]],"data-plk-pview")}${zoomBar("p")}</div></div><div class="plk-lg">${famLegend()}${hoLegend}</div>`;
}
function pList(){
 const g=pgraph();
 return btHTML({id:"plk_plist",cols:[
  {k:"n",label:"Process",fmt:r=>`<b>${E(r.n)}</b><div class="muted small">${E(r.fam)}</div>`,val:r=>r.n,wrap:true,w:240},
  {k:"fam",label:"Family",fmt:r=>E(r.fam),val:r=>r.fam},
  {k:"i",label:"Handoffs in",fmt:r=>r.i,val:r=>r.i},
  {k:"o",label:"Handoffs out",fmt:r=>r.o,val:r=>r.o},
  {k:"w",label:"Writes",fmt:r=>r.w,val:r=>r.w},
  {k:"r",label:"Reads",fmt:r=>r.r,val:r=>r.r}
 ],rows:()=>g.ids.map(p=>({id:p,n:pName(p),fam:FAM[FIDX[pFam(p)]][1],i:g.ho.filter(h=>h.to===p).length,o:g.ho.filter(h=>h.from===p).length,w:pEnts(p).w.length,r:pEnts(p).r.length})),key:"id",h:420,rowH:52,facets:["fam"],exportName:"process-connections",open:id=>pickP(id,true)});
}
function pHost(){
 const P=Z.p,gsvg=pGraphSvg(),ar=lastAR.toFixed(2);
 return `<div class="plk-split" data-view="${P.view}"><div class="plk-main">${toolbarP()}<div class="plk-canvas plk-gonly" data-plk-canvas="p" style="aspect-ratio:${ar}">${gsvg}<p class="plk-hint small muted">Drag to pan. Hold Ctrl or Cmd and scroll to zoom. Select a family to see its processes.</p></div><div class="plk-lonly">${pList()}</div></div><aside class="plk-panel card glass" aria-live="polite" data-plk-panel>${panelP()}</aside></div>`;
}
function drawP(refit){if(refit)Z.p.vb=null;const h=document.querySelector("[data-plk-phost]");if(!h){render();return}h.innerHTML=pHost()}
function pickP(id,open){
 const P=Z.p;P.sel=id;if(P.hop>0)P.vb=null;
 if(open&&!document.querySelector("[data-plk-phost]")){S.v.plk_p=0;go("plat_pmap");return}
 if(S.v.plk_p!==0){S.v.plk_p=0;render();return}
 drawP(false);
}
/* ---------- dependency matrix ---------- */
function sharedBetween(a,b){const g=pgraph();return(g.shared[a+"|"+b]||[]).filter(x=>Z.p.hub||!g.hubs.has(x))}
function famShared(fa,fb){
 const g=pgraph(),set=new Set();
 g.ids.filter(p=>pFam(p)===fa).forEach(p=>g.ids.filter(q=>pFam(q)===fb&&q!==p).forEach(q=>sharedBetween(p,q).forEach(x=>set.add(x))));return[...set];
}
function matrixP(){
 const P=Z.p,g=pgraph();
 const shade=n=>`style="--k:${Math.min(1,n/6).toFixed(2)}"`;
 const toggle=seg("Level",[["fam","By family",P.mx==="fam"],["proc","By process",P.mx==="proc"]],"data-plk-mxlev");
 let tbl;
 if(P.mx==="fam"){
  const fams=FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0]));
  tbl=`<table class="plk-mx"><thead><tr><th scope="col">Family</th>${fams.map(f=>`<th scope="col" class="v"><span>${E(trunc(f[1],24))}</span></th>`).join("")}</tr></thead><tbody>${fams.map(a=>`<tr><th scope="row">${E(a[1])}</th>${fams.map(b=>{if(a[0]===b[0])return`<td class="self"></td>`;const n=famShared(a[0],b[0]).length;return n?`<td class="c" ${shade(n)}><button type="button" data-plk-pair="f:${a[0]}:${b[0]}" aria-label="${E(a[1]+" and "+b[1]+": "+n+" shared entities")}">${n}</button></td>`:`<td class="z"></td>`}).join("")}</tr>`).join("")}</tbody></table>`;
 }else{
  const fl=mpGet("plk_pmf"),ids=g.ids.filter(p=>fl.indexOf(pFam(p))>=0);
  tbl=`<table class="plk-mx"><thead><tr><th scope="col">Process</th>${ids.map(p=>`<th scope="col" class="v"><span>${E(trunc(pName(p),22))}</span></th>`).join("")}</tr></thead><tbody>${ids.map(a=>`<tr><th scope="row">${E(pName(a))}</th>${ids.map(b=>{if(a===b)return`<td class="self"></td>`;const n=sharedBetween(a,b).length;return n?`<td class="c" ${shade(n)}><button type="button" data-plk-pair="p:${a}:${b}" aria-label="${E(pName(a)+" and "+pName(b)+": "+n+" shared entities")}">${n}</button></td>`:`<td class="z"></td>`}).join("")}</tr>`).join("")}</tbody></table>`;
 }
 return `<div class="plk-brow">${toggle}${P.mx==="proc"?mpHTML({id:"plk_pmf",label:"Families",all:"All families",opts:FAM.filter(f=>g.ids.some(p=>pFam(p)===f[0])).map(f=>({v:f[0],l:f[1]}))}):""}${togBtn("p:hub","Count hub entities",P.hub,"Person, service and CI are used almost everywhere. Off shows the meaningful sharing.")}</div>
 <div class="plk-lg">${legend([["Darker means more shared entities","--p1"]])}</div><div class="plk-mxwrap">${tbl}</div>`;
}
function pairDrawer(kind,a,b){
 const g=pgraph();let ps1,ps2,ents,title;
 if(kind==="f"){ps1=g.ids.filter(p=>pFam(p)===a);ps2=g.ids.filter(p=>pFam(p)===b);ents=famShared(a,b);title=FAM[FIDX[a]][1]+" and "+FAM[FIDX[b]][1]}
 else{ps1=[a];ps2=[b];ents=sharedBetween(a,b);title=pName(a)+" and "+pName(b)}
 const ho=g.ho.filter(h=>(ps1.indexOf(h.from)>=0&&ps2.indexOf(h.to)>=0)||(ps2.indexOf(h.from)>=0&&ps1.indexOf(h.to)>=0));
 const dep=g.dep.filter(h=>(ps1.indexOf(h.from)>=0&&ps2.indexOf(h.to)>=0)||(ps2.indexOf(h.from)>=0&&ps1.indexOf(h.to)>=0));
 const wr={};ents.forEach(x=>{wr[x]=ps1.concat(ps2).filter(p=>pEnts(p).w.indexOf(x)>=0)});
 openDrawer(`<div class="dfullgrid"><div><div class="eyebrow">Shared data</div><h2 style="margin:4px 0">${E(title)}</h2><p class="story" data-role="story">${ents.length?`They touch <b>${ents.length}</b> of the same ${ents.length===1?"entity":"entities"}. A change to any of them reaches both.`:"They share no registered entity. Any link between them is a handoff only."}</p>
 ${lrHTML({id:"plk_pair_e",groups:[{key:"e",label:"Shared entities",rows:ents.map(x=>({id:x,t:entN(x),sub:wr[x].length?"Written by "+wr[x].map(pName).join(", "):"Read only by both",tag:wr[x].length>1?"Two writers":"Shared",st:wr[x].length>1?"warn":"info",go:()=>{closeDrawer();pickD(x)}}))}],limit:8,empty:"No shared entities."})}</div>
 <div>${lrHTML({id:"plk_pair_h",groups:[{key:"h",label:"Documented handoffs between them",rows:ho.map(h=>({id:h.from+h.to,t:pName(h.from)+" to "+pName(h.to),sub:h.entities.map(entN).join(", ")+" · "+h.trigger,tag:MODEN[h.mode],st:MODEC[h.mode],go:()=>{closeDrawer();pickP(h.from,true)}}))},{key:"d",label:"Data dependencies (one writes, the other reads)",rows:dep.map(h=>({id:h.from+h.to,t:pName(h.from)+" feeds "+pName(h.to),sub:h.entities.map(entN).join(", "),tag:"Data",st:"mute",go:()=>{closeDrawer();pickP(h.from,true)}}))}],limit:8,empty:"None."})}
 <div class="row" style="margin-top:12px"><button class="btn quiet" data-plk-go="plat_reg">Open the registry</button></div></div></div>`);
}
/* ---------- critical paths ---------- */
const CHAINS=[
 {id:"c1",n:"Demand to improvement",d:"A funded idea becomes a project, a release and a change. When it breaks, an incident and a problem feed the knowledge base and the next demand.",steps:["exe_strat","port","ppm_proj","agile_board","itsm_rel","itsm_chg","itsm_inc","itsm_prb","kcs_gap"]},
 {id:"c2",n:"Alert to permanent fix",d:"A discovered configuration item raises an alert, the alert becomes an incident, and the root cause returns to the CMDB through a change.",steps:["itom_disc","itom_cmdb","itom_evt","itom_run","itsm_inc","itsm_prb","itsm_chg","itom_cmdb"]},
 {id:"c3",n:"Request to board cost view",d:"A request in chat starts a clock, the clock feeds a vendor credit, the credit lands on an invoice and the invoice becomes the cost the board sees.",steps:["chat_home","svc_req","svc_sla","ppm_sow","inv","tbm_model","exe_board"]},
 {id:"c4",n:"Service level to cost",d:"A metric becomes an objective, the objective is compared to the agreement, and a miss turns into a vendor credit on a paid invoice.",steps:["obs_dash","itom_slo","svc_sla","ppm_sow","inv","tbm_model"]},
 {id:"c5",n:"Person to board risk view",d:"A new person gets a skill profile, is assigned to a project, the plan feeds the schedule and the schedule feeds date confidence for the board.",steps:["ppl_org","svc_skills","ppm_proj","ppm_wbs","ims","exe_risk","exe_board"]}
];
function chainView(c){
 const g=pgraph(),ids=new Set(g.ids),steps=c.steps.filter(s=>ids.has(s));
 const hops=[];for(let i=0;i<steps.length-1;i++){const h=g.ho.find(x=>x.from===steps[i]&&x.to===steps[i+1])||g.ho.find(x=>x.from===steps[i+1]&&x.to===steps[i]);hops.push(h||null)}
 return{steps,hops};
}
function blastCard(){
 const sp=Z.p.pstep;if(!sp)return `<div class="story small">Select a step in any chain to see what breaks downstream if it fails.</div>`;
 const [cid,i]=sp.split(":");const c=CHAINS.find(x=>x.id===cid);if(!c)return"";const v=chainView(c),pid=v.steps[+i];if(!pid)return"";
 const ds=downstream(pid);const inChain=ds.procs.filter(p=>v.steps.indexOf(p)>=0);
 return `<div class="plk-blast"><div class="eyebrow">If this breaks</div><h3 style="margin:2px 0 6px">${E(pName(pid))}</h3>
 <div class="statrow"><div class="stat"><small>Processes affected</small><span class="num" data-role="metric">${ds.procs.length}</span><em>${inChain.length} on this chain</em></div><div class="stat"><small>Entities at risk</small><span class="num" data-role="metric">${ds.real.length}</span><em>stale or missing</em></div><div class="stat"><small>Apps affected</small><span class="num" data-role="metric">${ds.apps.length}</span></div></div>
 <p class="small" data-role="story">${ds.procs.length?`The first processes to feel it are ${ds.procs.filter(p=>ds.depth.get(p)===1).slice(0,5).map(pName).join(", ")||"none"}. After ${Math.max.apply(null,[0].concat([...ds.depth.values()]))} steps the effect reaches ${ds.procs.length} processes.`:"No process depends on it through a handoff or shared writes."}</p>
 <p class="small muted">Entities that would go stale: ${ds.entities.slice(0,10).map(entN).join(", ")||"none"}${ds.entities.length>10?" and "+(ds.entities.length-10)+" more":""}.</p>
 <div class="row"><button class="btn quiet" data-plk-pgo="${E(pid)}">Show it on the map</button>${hasScr(pid)?`<button class="btn quiet" data-plk-go="${E(pid)}">Open the process</button>`:""}</div></div>`;
}
function pathsHTML(){
 const g=pgraph();
 const cards=CHAINS.map(c=>{const v=chainView(c);if(v.steps.length<2)return"";
  const doc=v.hops.filter(Boolean).length,tot=v.hops.length,ents=new Set();v.hops.forEach(h=>h&&h.entities.forEach(x=>ents.add(x)));
  const weak=v.steps.map((p,i)=>({p,i,n:downstream(p).procs.length})).sort((a,b)=>b.n-a.n)[0];
  const flow=v.steps.map((p,i)=>`<li class="plk-st1"><button type="button" class="plk-step ${Z.p.pstep===c.id+":"+i?"on":""}" data-plk-step="${c.id}:${i}" style="--c:var(--plk-c${FIDX[pFam(p)]})"><span class="small muted">${E(FAM[FIDX[pFam(p)]][1])}</span><b>${E(pName(p))}</b><span class="small">${downstream(p).procs.length} downstream</span></button>${i<v.steps.length-1?`<span class="plk-hop" aria-hidden="true"><i class="${v.hops[i]?MODEC[v.hops[i].mode]:"bad"}"></i><small>${v.hops[i]?E(v.hops[i].entities.slice(0,2).map(entN).join(", ")):"no handoff"}</small></span>`:""}</li>`).join("");
  return card(c.n,c.d,`<div class="statrow plk-st"><div class="stat"><small>Steps</small><span class="num" data-role="metric">${v.steps.length}</span></div><div class="stat"><small>Handoffs documented</small><span class="num" data-role="metric">${doc} of ${tot}</span></div><div class="stat"><small>Entities carried</small><span class="num" data-role="metric">${ents.size}</span></div><div class="stat"><small>Weakest link</small><span class="num" style="font-size:1.05rem">${E(pName(weak.p))}</span><em>${weak.n} processes downstream</em></div></div><ol class="plk-flow">${flow}</ol>`);
 }).join("");
 return `<div class="plk-lg">${legend([["Event handoff","--info-f"],["Batch handoff","--muted"],["Human handoff","--warn-f"],["No documented handoff","--bad-f"]])}</div><div class="plk-paths">${cards}</div><div class="card glass" data-plk-blast>${blastCard()}</div>`;
}
function findingsHTML(){
 const s=stats(),m=model(),g=pgraph();
 const procRow=(p,sub,tag,st)=>({id:p,t:pName(p),sub,tag,st,go:()=>hasScr(p)?go(p):pickP(p,true)});
 const entRow=(e,sub,tag,st)=>({id:e,t:entN(e),sub,tag,st,go:()=>go("plat_reg")});
 const nown=PLAT.nonOwnerWrites();
 const groups=[
  {key:"a",label:"Processes that share no registered data",rows:s.noShare.map(p=>procRow(p,"Keeps its data outside the registry. Register the entity it uses, then it connects.","No shared data","warn"))},
  {key:"b",label:"Processes with no documented handoff",rows:s.noHand.map(p=>procRow(p,"Nothing hands work to it or takes work from it in the handoff table.","No handoff","warn"))},
  {key:"c",label:"Entities written by more than one process",rows:s.multiP.map(e=>entRow(e,"Written by "+s.pw[e].map(pName).join(", ")+". Name one owner.","Two writers","bad"))},
  {key:"d",label:"Entities that processes use but no app writes",rows:s.noWriter.map(e=>entRow(e.id,"Used by "+g.cnt[e.id]+" processes. Who creates the records?","No writer","warn"))},
  {key:"e",label:"Writes by an app that is not the owner module",rows:nown.map(x=>entRow(x.ent,appN(x.app)+" writes it; the owner is "+x.owner+".","Not owner","warn"))},
  {key:"f",label:"Entities with no link at all",rows:s.isolated.map(e=>entRow(e,"No reference, reader or writer. Connect it or retire it.","Isolated","bad"))}
 ];
 return{groups,s,count:groups.reduce((a,x)=>a+x.rows.length,0)};
}
