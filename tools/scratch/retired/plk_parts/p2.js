/* ---------- graph engine: layout helpers, svg frame, pan and zoom ---------- */
function clip(cx,cy,w,h,tx,ty){const dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return[cx,cy];const sx=dx?(w/2)/Math.abs(dx):1e9,sy=dy?(h/2)/Math.abs(dy):1e9,s=Math.min(sx,sy);return[cx+dx*s,cy+dy*s]}
function curve(a,b,bend){
 const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;
 const p1=clip(ax,ay,a.w,a.h,bx,by),p2=clip(bx,by,b.w,b.h,ax,ay);
 const dx=p2[0]-p1[0],dy=p2[1]-p1[1],len=Math.hypot(dx,dy)||1,off=Math.min(46,len*.14)*(bend||1);
 const mx=(p1[0]+p2[0])/2-dy/len*off,my=(p1[1]+p2[1])/2+dx/len*off;
 return{d:`M${p1[0].toFixed(1)},${p1[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`,mid:[(p1[0]+2*mx+p2[0])/4,(p1[1]+2*my+p2[1])/4]};
}
function boundsOf(list){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;list.forEach(n=>{x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+n.w);y1=Math.max(y1,n.y+n.h)});if(x0>x1)return[0,0,400,300];return[x0-24,y0-24,x1-x0+48,y1-y0+48]}
function markers(k){return `<defs>${["ref","wr","rd","pl","ev","ba","hu","dt"].map(t=>`<marker id="plk-ar-${k}-${t}" class="plk-mk ${t}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z"/></marker>`).join("")}</defs>`}
let lastAR=1.6;
function svgFrame(k,vb,body,label,cls){
 lastAR=vb[2]/vb[3];
 return `<svg class="plk-svg ${cls||""}" data-plk-vp="${k}" data-fit="${vb.map(v=>Math.round(v)).join(" ")}" viewBox="${vb.map(v=>+v.toFixed(1)).join(" ")}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${E(label)}" tabindex="0">${markers(k)}${body}</svg>`;
}
const stateOf=k=>k==="d"?Z.d:k==="p"?Z.p:Z.g;
function vbFor(k,fit){const s=stateOf(k);return s.vb&&s.vb.length===4?s.vb:fit}
function zoomVp(k,f){ /* f: factor (>1 zoom in), "fit" */
 const svg=document.querySelector(`[data-plk-vp="${k}"]`);if(!svg)return;const s=stateOf(k);
 const fit=svg.dataset.fit.split(" ").map(Number);
 if(f==="fit"){s.vb=null;svg.setAttribute("viewBox",fit.join(" "));return}
 const cur=svg.getAttribute("viewBox").split(" ").map(Number),cx=cur[0]+cur[2]/2,cy=cur[1]+cur[3]/2,w=cur[2]/f,h=cur[3]/f;
 if(w>fit[2]*2.5||w<fit[2]/12)return;
 const nv=[cx-w/2,cy-h/2,w,h];s.vb=nv;svg.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "));
}
function panVp(k,dx,dy){const svg=document.querySelector(`[data-plk-vp="${k}"]`);if(!svg)return;const cur=svg.getAttribute("viewBox").split(" ").map(Number);const nv=[cur[0]+dx,cur[1]+dy,cur[2],cur[3]];stateOf(k).vb=nv;svg.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "))}
const zoomBar=k=>`<div class="plk-zoom" role="group" aria-label="Zoom and pan"><button class="btn quiet" data-plk-zoom="${k}:out" aria-label="Zoom out">−</button><button class="btn quiet" data-plk-zoom="${k}:in" aria-label="Zoom in">+</button><button class="btn quiet" data-plk-zoom="${k}:fit">Fit</button></div>`;
const seg=(label,items,attr)=>`<div class="plk-seg" role="group" aria-label="${E(label)}"><span class="small muted">${E(label)}</span>${items.map(i=>`<button type="button" class="${i[2]?"on":""}" aria-pressed="${!!i[2]}" ${attr}="${E(i[0])}">${E(i[1])}</button>`).join("")}</div>`;
const togBtn=(k,label,on,title)=>`<button type="button" class="plk-tog ${on?"on":""}" aria-pressed="${on}" data-plk-tog="${k}" ${title?`title="${E(title)}"`:""}>${E(label)}</button>`;
/* ---------- overlays: what the node color means ---------- */
const AUTHC={platform:"--s3",external:"--p1",shared:"--w1"},CLSC={public:"--faint",internal:"--p5",confidential:"--w1",restricted:"--e1",personal:"--u3"};
function authOf(e){let best="platform",n=-1;["platform","external","shared"].forEach(k=>{if((e.authMix[k]||0)>n){n=e.authMix[k]||0;best=k}});return best}
function ovVar(e){
 switch(Z.d.ov){
  case"auth":return AUTHC[authOf(e)];
  case"cls":return CLSC[e.cls]||"--faint";
  case"dup":return e.status==="duplicate"?"--e1":e.status==="fixed"?"--p1":e.writers.length>1?"--w1":"--s3";
  default:return"--plk-c"+DCOL[e.domain];
 }
}
function ovLegend(){
 switch(Z.d.ov){
  case"auth":return legend([["Mostly platform authority","--s3"],["Mostly external authority","--p1"],["Mostly shared authority","--w1"]]);
  case"cls":return legend([["Public","--faint"],["Internal","--p5"],["Confidential","--w1"],["Restricted","--e1"],["Personal","--u3"]]);
  case"dup":return legend([["Single writer, canonical","--s3"],["Two or more writers","--w1"],["Known duplicate","--e1"],["Duplicate fixed","--p1"]]);
  default:return legend(DORD.map(d=>[DOM[d].n,"--plk-c"+DCOL[d]]));
 }
}
const edgeLegend=`<div class="legend plk-elg" role="note"><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e ref"/></svg>Entity points to entity (field reference)</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e wr"/></svg>App writes</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e rd"/></svg>App reads</span><span><svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="30" y2="5" class="plk-e pl"/></svg>Planned link</span><span class="plk-sh"><i class="plk-shp sent"></i>Entity</span><span class="plk-sh"><i class="plk-shp sapp"></i>App or screen</span><span class="plk-sh"><i class="plk-shp sgh"></i>Planned entity</span></div>`;
/* ---------- data connections: layout ---------- */
const CW=150,CH=28,GX=10,GY=8,PX_=12,HEAD=38,GAP=26;
function mkNode(id,kind,x,y,o){return Object.assign({id,kind,x,y,w:CW,h:CH},o||{})}
function layoutD(){
 const m=model(),D=Z.d,doms=mpGet("plk_dom"),nodes=new Map(),boxes=[];
 const focus=D.hop>0&&D.sel&&!/^dom:/.test(D.sel);
 const entNode=e=>mkNode(e.id,"ent",0,0,{label:e.label,e,v:ovVar(e)});
 const appNode=a=>mkNode(nidA(a.id),"app",0,0,{label:a.n,app:a});
 const gNode=g=>mkNode(nidG(g.id),"gh",0,0,{label:g.label,g});
 if(focus){
  const seen=new Map([[D.sel,0]]);let fr=[D.sel];
  for(let d=1;d<=D.hop;d++){const nx=[];fr.forEach(u=>(m.adj.get(u)||[]).forEach(({id,e})=>{
    if(seen.has(id))return;
    if(e.type==="ref"&&!D.refs)return;if(e.type==="write"&&!D.wr)return;if(e.type==="read"&&!D.rd)return;
    if(/^app:/.test(id)&&!D.apps)return;if(/^g:/.test(id)&&!D.pl)return;
    seen.set(id,d);nx.push(id)}));fr=nx}
  const rings={};seen.forEach((d,id)=>{(rings[d]=rings[d]||[]).push(id)});
  const mk=id=>/^app:/.test(id)?appNode(PLAT.app(id.slice(4))):/^g:/.test(id)?gNode(m.gset.get(id.slice(2))):entNode(m.eset.get(id));
  Object.keys(rings).forEach(d=>{
   const ids=rings[d].sort((a,b)=>{const ka=/^app:/.test(a)?"z"+a:/^g:/.test(a)?"y"+a:(m.eset.get(a).domain+a),kb=/^app:/.test(b)?"z"+b:/^g:/.test(b)?"y"+b:(m.eset.get(b).domain+b);return ka<kb?-1:1});
   if(+d===0){const n=mk(ids[0]);n.x=-CW/2;n.y=-CH/2;nodes.set(n.id,n);return}
   const r=Math.max(190*d,ids.length*11.8),rx=r*1.75;
   ids.forEach((id,i)=>{const ang=-Math.PI/2+(i+(d%2?0:.5))/ids.length*2*Math.PI;const n=mk(id);n.x=Math.cos(ang)*rx-CW/2;n.y=Math.sin(ang)*r-CH/2;n.hop=+d;nodes.set(n.id,n)})});
  return{nodes,boxes,vb:boundsOf([...nodes.values()]),focus:true};
 }
 const order=DORD.filter(d=>doms.includes(d));
 const bw=2*CW+GX+2*PX_,list=order.map(d=>({key:d,n:DOM[d].n,c:DCOL[d],items:m.es.filter(e=>e.domain===d)}));
 const lay=(b,x,y)=>{const coll=!!D.col[b.key];b.coll=coll;b.x=x;b.y=y;b.w=bw;
  if(coll){b.h=HEAD+58;const n={id:"dom:"+b.key,kind:"dom",x:x+PX_,y:y+HEAD+4,w:bw-2*PX_,h:44,label:b.n,count:b.items.length,b};nodes.set(n.id,n)}
  else{const rows=Math.ceil(b.items.length/2);b.h=HEAD+rows*(CH+GY)+PX_-GY+4;
   b.items.forEach((it,i)=>{const n=b.ghost?gNode(it):entNode(it);n.x=x+PX_+(i%2)*(CW+GX);n.y=y+HEAD+Math.floor(i/2)*(CH+GY);n.c=b.c;nodes.set(n.id,n)})}
  boxes.push(b)};
 let y=0;const cols=3;
 for(let r=0;r*cols<list.length;r++){const row=list.slice(r*cols,r*cols+cols);row.forEach((b,i)=>lay(b,i*(bw+GAP),y));y+=Math.max.apply(null,row.map(b=>b.h))+GAP}
 const totalW=Math.min(cols,list.length||1)*(bw+GAP)-GAP;
 if(D.apps){
  const apps=PLAT.APPS.slice().sort((a,b)=>a.mod<b.mod?-1:a.mod>b.mod?1:a.n<b.n?-1:1),per=Math.max(2,Math.floor((totalW+GX)/(CW+GX)));
  const rows=Math.ceil(apps.length/per),b={key:"apps",n:"Apps and screens",c:-1,apps:true,x:0,y,w:totalW,h:HEAD+rows*(CH+GY)+PX_-GY+4};
  apps.forEach((a,i)=>{const n=appNode(a);n.x=PX_+(i%per)*(CW+GX);n.y=y+HEAD+Math.floor(i/per)*(CH+GY);nodes.set(n.id,n)});
  boxes.push(b);
 }
 if(D.pl){
  const gb={key:"plan",n:"Planned entities",c:-2,ghost:true,items:PLAT.PLANNED.map(p=>m.gset.get(p[0]))};
  lay(gb,Math.max(totalW,bw)+GAP*2,0);
 }
 const allb=boxes.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}));
 return{nodes,boxes,vb:boundsOf(allb),focus:false};
}
function dNodeId(id){ /* an entity may sit inside a collapsed domain */
 const m=model(),L=_L;if(!id)return null;if(L.nodes.has(id))return id;
 const e=m.eset.get(id);if(e&&L.nodes.has("dom:"+e.domain))return"dom:"+e.domain;return null}
let _L=null;
function visEdgesD(L){
 const m=model(),D=Z.d,acc=new Map();
 m.raw.forEach(e=>{
  if(e.type==="ref"&&!D.refs)return;if(e.type==="write"&&!D.wr)return;if(e.type==="read"&&!D.rd)return;
  if(e.ghost&&!D.pl)return;
  const k=m.key(e);const a=dNodeId(k[0]),b=dNodeId(k[1]);if(!a||!b||a===b)return;
  const kk=e.type+"|"+a+"|"+b,r=acc.get(kk)||{a,b,type:e.type,n:0,fields:[]};r.n++;if(e.field)r.fields.push(e.field);acc.set(kk,r)});
 if(D.pl)Object.keys(m.conn).forEach(g=>{const c=m.conn[g];c.apps.forEach(ap=>{if(!D.apps)return;const a=dNodeId(nidA(ap)),b=dNodeId(nidG(g));if(a&&b)acc.set("pl|"+a+"|"+b,{a,b,type:"pl",n:1,fields:[]})})});
 return[...acc.values()];
}
/* ---------- data connections: drawing ---------- */
function nodeSvg(n,st){
 const cls=["plk-n","k"+n.kind,st.sel===n.id?"sel":"",st.lit&&st.lit.has(n.id)?"lit":"",st.hit&&st.hit.has(n.id)?"hit":""].join(" ");
 const c=n.kind==="ent"?n.v:n.kind==="gh"?"--faint":n.kind==="app"?"--muted":"--plk-c"+(n.b?n.b.c:0);
 const label=n.kind==="dom"?n.label+" ("+n.count+")":n.label;
 const w=n.w,h=n.h,rx=n.kind==="app"?h/2:n.kind==="dom"?12:7;
 const tx=n.kind==="dom"?14:n.kind==="app"?13:12;
 const max=Math.floor((w-tx-8)/6.2);
 const sub=n.kind==="dom"?`<text class="sub" x="${tx}" y="${h-9}">${n.count} entities, collapsed. Select to inspect.</text>`:"";
 return `<g class="${cls}" style="--c:var(${c})" transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})" data-plk-n="${E(n.id)}" tabindex="0" role="button" aria-pressed="${st.sel===n.id}" aria-label="${E((n.kind==="app"?"App ":n.kind==="gh"?"Planned entity ":n.kind==="dom"?"Domain ":"Entity ")+label)}"><title>${E(label)}</title><rect width="${w}" height="${h}" rx="${rx}"/>${n.kind==="ent"||n.kind==="dom"?`<rect class="stripe" width="5" height="${h}" rx="2.5"/>`:""}<text x="${tx}" y="${n.kind==="dom"?19:h/2+4}">${E(trunc(label,n.kind==="dom"?44:max))}</text>${sub}</g>`;
}
function dGraph(){
 const m=model(),D=Z.d;_L=layoutD();const L=_L;
 const edges=visEdgesD(L);
 const sel=D.sel?dNodeId(D.sel):null;
 const lit=new Set();if(sel){lit.add(sel);edges.forEach(e=>{if(e.a===sel)lit.add(e.b);if(e.b===sel)lit.add(e.a)})}
 const q=D.q.trim().toLowerCase();let hit=null;
 if(q){hit=new Set();L.nodes.forEach(n=>{const t=((n.label||"")+" "+n.id+" "+(n.e?n.e.fields.map(f=>f.k).join(" "):"")).toLowerCase();if(t.includes(q))hit.add(n.id)})}
 const st={sel,lit:sel?lit:null,hit};
 const ep=edges.map(e=>{const a=L.nodes.get(e.a),b=L.nodes.get(e.b);const c=curve(a,b,e.type==="read"?-1:1);const on=sel&&(e.a===sel||e.b===sel);
  const cls=["plk-e",e.type,on?"lit":""].join(" ");const mk=e.type==="ref"?"ref":e.type==="write"?"wr":e.type==="read"?"rd":"pl";
  return `<path class="${cls}" d="${c.d}" style="stroke-width:${(1+Math.min(2.2,Math.log2(e.n+1)*.7)).toFixed(1)}px" marker-end="url(#plk-ar-d-${mk})"${on?` data-lit="1"`:""}><title>${E(entN(/^app:/.test(e.a)?e.b:e.a))}${e.fields.length?": "+E(e.fields.slice(0,4).join(", ")):""}</title></path>`}).join("");
 const bx=L.boxes.map(b=>{
  const hd=b.apps?`<text class="bh" x="14" y="23">${E(b.n)} (${PLAT.APPS.length})</text>`:`<g class="plk-bt" data-plk-dtoggle="${b.key}" tabindex="0" role="button" aria-expanded="${!b.coll}" aria-label="${E(b.n)}, ${b.coll?"collapsed":"expanded"}"><rect x="0" y="0" width="${b.w}" height="${HEAD-4}" fill="transparent"/><text class="bh" x="14" y="23">${b.coll?"▸":"▾"} ${E(b.n)} (${b.items.length})</text></g>`;
  return `<g transform="translate(${b.x},${b.y})" class="plk-box${b.apps?" kapps":""}${b.ghost?" kgh":""}" style="--c:var(${b.apps?"--muted":b.ghost?"--faint":"--plk-c"+b.c})"><rect class="bg" width="${b.w}" height="${b.h}" rx="16"/>${hd}</g>`}).join("");
 const ns=[...L.nodes.values()].map(n=>nodeSvg(n,st)).join("");
 const body=`${bx}<g class="plk-edges">${ep}</g><g class="plk-nodes">${ns}</g>`;
 const vb=vbFor("d",L.vb);
 return svgFrame("d",vb,body,"Data connections graph. Tab to a node and press Enter to select it. Arrow keys pan, plus and minus zoom.",(sel?"has-sel ":"")+(hit?"has-q":""));
}
/* ---------- panel ---------- */
const clsPill=c=>`<span class="pill ${({public:"mute",internal:"mute",confidential:"warn",restricted:"bad",personal:"bad"})[c]||"mute"}">${E(c)}</span>`;
function selRow(id,sub,tag,st){return{id,t:entN(id),sub:sub||"",tag:tag||"",st:st||"mute",go:()=>pickD(id)}}
function appRow(a,tag,st){const ap=PLAT.app(a);return{id:a,t:ap?ap.n:a,sub:ap?ap.mod:"",tag:tag||"",st:st||"mute",go:()=>pickD(nidA(a))}}
function fieldImpact(eid,fk){
 const e=PLAT.ent(eid),f=e.fields.find(x=>x.k===fk),m=model();
 if(!fk||!f){const b=blast(eid);return{label:"any field",apps:b.apps.length,ents:b.entities.length,procs:b.processes.length,mets:b.metrics.length,note:"A change to the entity itself, such as its identifier or state, reaches everything that points at it up to two steps away."}}
 const keyish=/^(id|number|name|state|status|label)$/.test(fk);
 if(keyish){const b=blast(eid);return{label:f.label,apps:b.apps.length,ents:b.entities.length,procs:b.processes.length,mets:b.metrics.length,note:"Identifying and state fields are joined on by other entities, so the change travels downstream."}}
 const ap=appsOf(eid),tg=(f.type==="ref"||f.type==="person")?m.raw.filter(x=>x.type==="ref"&&x.from===eid&&x.field.split(", ").indexOf(f.label||f.k)>=0).map(x=>x.to):[];
 const procs=procsTouching(eid),mets=metricsFor(ap);
 return{label:f.label,apps:ap.length,ents:tg.length,procs:procs.length,mets:mets.length,note:tg.length?"This field points at "+tg.map(entN).join(", ")+". Changing what it means changes the join.":"The field is used on screens and in rules of the apps that touch this entity; nothing else points at it."};
}
function panelD(){
 const D=Z.d,m=model();let id=D.sel;
 if(!id)return hubPanel();
 if(/^dom:/.test(id)){const k=id.slice(4),ents=m.es.filter(e=>e.domain===k);
  const out={};m.raw.filter(e=>e.type==="ref").forEach(e=>{const a=m.eset.get(e.from),b=m.eset.get(e.to);if(a&&b&&a.domain!==b.domain&&(a.domain===k||b.domain===k)){const o=a.domain===k?b.domain:a.domain;out[o]=(out[o]||0)+1}});
  return `<div class="plk-ph"><div class="eyebrow">Domain</div><h3>${E(DOM[k].n)}</h3><p class="small muted">Steward: ${E(DOM[k].steward)}. ${ents.length} entities, ${ents.reduce((a,e)=>a+e.nf,0)} fields.</p><div class="row"><button class="btn primary" data-plk-dtoggle="${k}">${D.col[k]?"Expand it":"Collapse it"}</button></div></div>
  <div class="plk-ps"><b>Links to other domains</b><p class="small">${Object.keys(out).map(o=>`<span class="pill mute">${E(DOM[o].n)} ${out[o]}</span>`).join(" ")||"None"}</p></div>
  ${lrHTML({id:"plk_dm",groups:[{key:"e",label:"Entities in this domain",rows:ents.map(e=>selRow(e.id,e.owner,e.cls,e.status==="duplicate"?"bad":"mute"))}],limit:8})}`}
 if(/^app:/.test(id)){const a=PLAT.app(id.slice(4));if(!a)return hubPanel();
  const nown=PLAT.nonOwnerWrites().filter(x=>x.app===a.id).map(x=>x.ent);
  const hasP=pgraph().ids.indexOf(a.id)>=0;
  return `<div class="plk-ph"><div class="eyebrow">App or screen</div><h3>${E(a.n)}</h3><p class="small muted"><code>${E(a.id)}</code> in ${E(a.mod)}. Writes ${a.writes.length}, reads ${a.reads.length} entities.</p>
  <div class="row"><button class="btn quiet" data-plk-hop="1" aria-label="Focus one hop">Focus 1 hop</button><button class="btn quiet" data-plk-hop="2">2 hops</button>${hasScr(a.id)?`<button class="btn quiet" data-plk-go="${E(a.id)}">Open screen</button>`:""}${hasP?`<button class="btn quiet" data-plk-pgo="${E(a.id)}">Open its process</button>`:""}</div></div>
  ${nown.length?`<div class="story small"><b>Writes outside its own module:</b> ${nown.map(x=>E(entN(x))).join(", ")}. These are listed as debt in the registry.</div>`:""}
  ${lrHTML({id:"plk_aw",groups:[{key:"w",label:"Writes",rows:a.writes.filter(inE).map(x=>selRow(x,"",nown.indexOf(x)>=0?"Not owner":"Owner","warn"))},{key:"r",label:"Reads",rows:a.reads.filter(inE).map(x=>selRow(x))},{key:"m",label:"Metrics shown here",rows:metricsFor([a.id]).map(k=>({id:k,t:METRICS[k].n,sub:METRICS[k].f,tag:"Metric",st:"info",go:()=>go("metrics")}))}],limit:8})}`}
 if(/^g:/.test(id)){const g=m.gset.get(id.slice(2)),c=m.conn[g.id];
  return `<div class="plk-ph"><div class="eyebrow">Planned entity, ${E(DOM[g.domain].n)}</div><h3>${E(g.label)}</h3><p class="small muted">Proposed steward ${E(g.steward)}. First users: ${E(g.use)}</p></div><div class="story small">${E(g.why)}</div>
  ${c.all?`<p class="small"><b>Every app would use it.</b></p>`:""}${c.why.length?`<ul class="small plk-ul">${c.why.map(w=>`<li>${w}</li>`).join("")}</ul>`:""}
  ${lrHTML({id:"plk_gp",groups:[{key:"e",label:"Existing entities that would connect",rows:c.ents.map(x=>selRow(x))},{key:"a",label:"Apps that would use it",rows:c.apps.map(a=>appRow(a))}],limit:8,empty:"Nothing connects yet."})}
  <div class="row" style="margin-top:10px"><button class="btn primary" data-plk-go="plat_reg">Propose it in the registry</button></div>`}
 const e=PLAT.ent(id);if(!e)return hubPanel();
 const ff=D.ff&&e.fields.some(f=>f.k===D.ff)?D.ff:"",fi=fieldImpact(e.id,ff);
 const up=m.outRefs(e.id),dn=m.raw.filter(x=>x.type==="ref"&&x.to===e.id);
 const bl=blast(e.id),nown=PLAT.nonOwnerWrites().filter(x=>x.ent===e.id).map(x=>x.app);
 return `<div class="plk-ph"><div class="eyebrow">${E(DOM[e.domain].n)}</div><h3>${E(e.label)}</h3><p class="small muted"><code>${E(e.id)}</code> owned by ${E(e.owner)}, stewarded by ${E(e.steward)}.</p>
  <div class="row" style="gap:6px;flex-wrap:wrap">${clsPill(e.cls)}<span class="pill ${e.status==="duplicate"?"bad":e.status==="fixed"?"info":"good"}">${e.status==="duplicate"?"Duplicate":e.status==="fixed"?"Fixed":"Canonical"}</span>${e.writers.length>1?`<span class="pill warn">${e.writers.length} writers</span>`:""}</div></div>
  <div class="plk-imp"><label class="small muted" for="plk_ff">Impact if this field changes</label><select class="fin" id="plk_ff" data-plk-ff><option value="">Any field on the entity</option>${e.fields.map(f=>`<option value="${E(f.k)}" ${f.k===ff?"selected":""}>${E(f.label||f.k)}</option>`).join("")}</select>
  <div class="statrow plk-st"><div class="stat"><small>Apps</small><span class="num" data-role="metric">${fi.apps}</span></div><div class="stat"><small>Entities</small><span class="num" data-role="metric">${fi.ents}</span></div><div class="stat"><small>Processes</small><span class="num" data-role="metric">${fi.procs}</span></div><div class="stat"><small>Metrics</small><span class="num" data-role="metric">${fi.mets}</span></div></div>
  <p class="small muted" data-role="story">${E(fi.note)}</p></div>
  <div class="row plk-act"><button class="btn quiet" data-plk-hop="1">Focus 1 hop</button><button class="btn quiet" data-plk-hop="2">2</button><button class="btn quiet" data-plk-hop="3">3</button><button class="btn quiet" data-plk-trace="${E(e.id)}">Trace a field</button><button class="btn quiet" data-plk-go="plat_reg">Registry</button></div>
  ${lrHTML({id:"plk_en",groups:[
   {key:"up",label:"Upstream: this points to",rows:up.map(x=>selRow(x.to,x.field,x.ghost?"Planned":"Reference",x.ghost?"warn":"info"))},
   {key:"dn",label:"Downstream: points to this",rows:dn.map(x=>selRow(x.from,x.field,"Reference","info"))},
   {key:"w",label:"Written by",rows:e.writers.map(a=>appRow(a,nown.indexOf(a)>=0?"Not owner":"Writes",nown.indexOf(a)>=0?"warn":"good"))},
   {key:"r",label:"Read by",rows:e.readers.map(a=>appRow(a,"Reads","info"))},
   {key:"p",label:"Processes that touch it",rows:bl.processes.length?procsTouching(e.id).map(p=>({id:p,t:pName(p),sub:FAM[FIDX[pFam(p)]][1],tag:pEnts(p).w.indexOf(e.id)>=0?"Writes":"Reads",st:"mute",go:()=>pickP(p,true)})):[]}
  ],limit:6})}
  ${SCALE&&SCALE.on?`<p class="small muted">Enterprise scale is on. The model keeps the same shape because it describes tables, not rows.</p>`:""}`;
}
function hubPanel(){
 const m=model(),deg={};m.raw.forEach(e=>{const k=m.key(e);k.forEach(x=>deg[x]=(deg[x]||0)+1)});
 const top=m.es.map(e=>({e,n:deg[e.id]||0})).sort((a,b)=>b.n-a.n).slice(0,8);
 const iso=stats().isolated;
 return `<div class="plk-ph"><div class="eyebrow">Nothing selected</div><h3>Pick a node</h3><p class="small muted">Select an entity, an app or a domain. Its links light up and flow, everything else dims, and this panel lists fields, writers, readers and the impact of changing a field.</p></div>
 ${lrHTML({id:"plk_hub",groups:[{key:"h",label:"Most connected entities",rows:top.map(t=>selRow(t.e.id,t.n+" links",DOM[t.e.domain].n,"info"))},{key:"i",label:"Entities with no links",rows:iso.map(x=>selRow(x,"No reference, reader or writer","Isolated","warn"))}],limit:8,search:false})}`;
}
/* ---------- the connections view: toolbar, graph or list, panel ---------- */
function dList(){
 const m=model(),doms=mpGet("plk_dom");const deg={};m.raw.forEach(e=>{const k=m.key(e);deg[k[0]]=(deg[k[0]]||0)+1;deg[k[1]]=(deg[k[1]]||0)+1});
 return btHTML({id:"plk_dlist",cols:[
  {k:"label",label:"Entity",fmt:r=>`<b>${E(r.label)}</b><div class="muted small">${E(r.id)}</div>`,val:r=>r.label,wrap:true,w:220},
  {k:"domain",label:"Domain",fmt:r=>E(DOM[r.domain].n),val:r=>DOM[r.domain].n},
  {k:"out",label:"Points to",fmt:r=>m.outRefs(r.id).length,val:r=>m.outRefs(r.id).length},
  {k:"in",label:"Pointed at by",fmt:r=>m.inRefs(r.id).length,val:r=>m.inRefs(r.id).length},
  {k:"w",label:"Writers",fmt:r=>r.writers.length,val:r=>r.writers.length},
  {k:"r",label:"Readers",fmt:r=>r.readers.length,val:r=>r.readers.length},
  {k:"cls",label:"Class",fmt:r=>clsPill(r.cls),val:r=>r.cls}
 ],rows:()=>m.es.filter(e=>doms.includes(e.domain)),key:"id",h:420,rowH:52,facets:["domain"],exportName:"entity-connections",open:id=>pickD(id)});
}
function toolbarD(){
 const D=Z.d;
 return `<div class="plk-bar"><div class="plk-brow">${seg("Color by",[["domain","Domain",D.ov==="domain"],["auth","Authority",D.ov==="auth"],["cls","Classification",D.ov==="cls"],["dup","Duplicates",D.ov==="dup"]],"data-plk-ov")}
 <div class="plk-seg" role="group" aria-label="Layers"><span class="small muted">Show</span>${togBtn("d:refs","Entity links",D.refs)}${togBtn("d:apps","Apps",D.apps)}${togBtn("d:wr","Writes",D.wr)}${togBtn("d:rd","Reads",D.rd)}${togBtn("d:pl","Planned",D.pl,"Show planned entities as ghost nodes")}</div></div>
 <div class="plk-brow">${seg("Focus",[["0","Whole model",D.hop===0],["1","1 hop",D.hop===1],["2","2 hops",D.hop===2],["3","3 hops",D.hop===3]],"data-plk-hopset")}
 <div class="plk-seg" role="group" aria-label="Domains"><button type="button" class="plk-tog" data-plk-colall="d:1">Collapse all</button><button type="button" class="plk-tog" data-plk-colall="d:0">Expand all</button></div>
 ${seg("View",[["graph","Graph",D.view==="graph"],["list","List",D.view==="list"]],"data-plk-view")}${zoomBar("d")}</div></div>
 <div class="plk-lg">${ovLegend()}${edgeLegend}</div>`;
}
function dHost(){
 const D=Z.d,gsvg=dGraph(),ar=lastAR.toFixed(2);
 return `<div class="plk-split" data-view="${D.view}"><div class="plk-main">${toolbarD()}<div class="plk-canvas plk-gonly" data-plk-canvas="d" style="aspect-ratio:${ar}">${gsvg}<p class="plk-hint small muted">Drag to pan. Hold Ctrl or Cmd and scroll to zoom. Tab to a node and press Enter.</p></div><div class="plk-lonly">${dList()}</div></div><aside class="plk-panel card glass" aria-live="polite" data-plk-panel>${panelD()}</aside></div>`;
}
function domOpts(){return DORD.map(d=>({v:d,l:DOM[d].n,sub:DOM[d].ent.length+" entities"}))}
function drawD(refit){
 if(refit)Z.d.vb=null;
 const h=document.querySelector("[data-plk-dhost]");if(!h){render();return}
 h.innerHTML=dHost();
}
function pickD(id){
 const D=Z.d;D.sel=id;D.ff="";if(D.hop>0)D.vb=null;
 if(!document.querySelector("[data-plk-dhost]")){S.v.plk_d=0;go("plat_dmap");return}
 const el=document.querySelector("[data-plk-dhost]");
 if(S.v.plk_d!==0){S.v.plk_d=0;render();return}
 drawD(false);
}
