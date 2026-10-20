/* ===== mod_flow_ins: Workflow designer, Round 14. Insert between steps, box nudge with before / branch / after zones, hover handle with a mini picker,
   collision avoidance (dropped steps never overlap; downstream steps slide right). Reads the designer through FLOWX._ed() and is called back from mod_flow.js
   (FLOWX._ins.dropNew for palette drops, FLOWX._ins.afterMove for moved steps). Undo and redo use the designer's own history. ===== */
(function(){
"use strict";
const $q=(s,r)=>(r||document).querySelector(s),$$q=(s,r)=>Array.from((r||document).querySelectorAll(s));
const A=()=>window.FLOWX&&FLOWX._ed&&FLOWX._ed();
const ES=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const reduce=()=>matchMedia("(prefers-reduced-motion:reduce)").matches||document.documentElement.dataset.motion==="reduced";
const NOINS=new Set(["trigger","end"]);
const MINI=[["human","Task"],["decision","Decision"],["approval","Approval"],["agent","AI step"],["notify","Notify"],["wait","Wait"]];
let hov=null,plusT=0,mini=null;
const nd=(f,id)=>f.nodes.find(n=>n.id===id);
/* the gap a step needs to its right: room for the port labels (Yes, Else, Approved...) of a step that branches */
const gapOf=(f,a,b)=>{const E=A(),L=a.x<=b.x?a:b;const o=E?E.outs(L):[];if(o.length<2)return E?E.GX:44;const w=Math.max(...o.map(x=>Math.min(14,String(x).length)));return Math.max(E.GX,Math.round(24+w*6))};
const nodeOk=A_=>!!document.querySelector(`#wfdCanvas [data-wfd-node="${A_}"]`);

/* ---------- geometry helpers ---------- */
function rect(a,n){return{x:n.x,y:a.nodeY(n),w:a.NW,h:a.NH}}
function hit(f,a,m,o,gx){const p=rect(a,m),q=rect(a,o);return p.x<q.x+q.w+gx&&q.x<p.x+p.w+gx&&p.y<q.y+q.h+8&&q.y<p.y+p.h+8}
function down(f,id){const seen=new Set([id]),q=[id];while(q.length){const i=q.pop();f.edges.forEach(e=>{if(e.f===i&&!seen.has(e.t)){seen.add(e.t);q.push(e.t)}})}return seen}
/* strict list of overlapping pairs (tests, checker) */
function overlaps(f){const a=A(),L=f.nodes.filter(n=>nodeOk(n.id)||true),r=[];for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const p=rect(a,L[i]),q=rect(a,L[j]);if(p.x<q.x+q.w&&q.x<p.x+p.w&&p.y<q.y+q.h&&q.y<p.y+p.h)r.push([L[i].id,L[j].id])}return r}
/* resolve: pinned steps stay; the thing they hit slides right with every step at or after its column */
function resolve(f,pin){
 const a=A();pin=new Set(pin||[]);const touched=new Set(pin);let n=0;
 for(let it=0;it<80;it++){
  let P=null,M=null;
  for(let i=0;i<f.nodes.length&&!P;i++)for(let j=i+1;j<f.nodes.length;j++){
   const p=f.nodes[i],q=f.nodes[j];if(!(touched.has(p.id)||touched.has(q.id)))continue;if(pin.has(p.id)&&pin.has(q.id))continue;
   if(!hit(f,a,p,q,gapOf(f,p,q)))continue;
   if(pin.has(p.id)){P=p;M=q}else if(pin.has(q.id)){P=q;M=p}else if(touched.has(p.id)&&!touched.has(q.id)){P=p;M=q}else if(touched.has(q.id)&&!touched.has(p.id)){P=q;M=p}else{if(p.x<=q.x){P=p;M=q}else{P=q;M=p}}
   break}
  if(!P)break;
  const g=gapOf(f,P,M);
  if(M.x>=P.x-a.NW/2){const d=Math.ceil(P.x+a.NW+g-M.x);f.nodes.forEach(o=>{if(!pin.has(o.id)&&o.id!==P.id&&o.x>=M.x-1){o.x+=Math.max(d,1);touched.add(o.id)}});n++}
  else{P.x=Math.ceil(M.x+a.NW+g);touched.add(P.id);n++}
 }
 return n;
}
function primary(n){const a=A(),o=a.outs(n);return o.length?o[0]:null}
function unusedPort(f,n){const a=A(),o=a.outs(n);return o.find(p=>!f.edges.some(e=>e.f===n.id&&e.p===p))||null}
const shiftFrom=(f,x,d,skip)=>f.nodes.forEach(o=>{if(!skip.has(o.id)&&o.x>=x-1)o.x+=d});

/* put node n on edge e: re-wire both halves, keep the branch label (port), and open a column for it */
function insertOnEdge(f,n,e,pos){
 const a=A(),An=nd(f,e.f),Bn=nd(f,e.t);if(!An||!Bn)return false;
 f.edges=f.edges.filter(x=>x.id!==e.id);
 f.edges.push({id:"e"+a.uid(),f:e.f,p:e.p,t:n.id});
 const o=primary(n);if(o)f.edges.push({id:"e"+a.uid(),f:n.id,p:o,t:e.t});
 if(!pos||pos.x==null){
  n.x=An.x+a.CW;
  if(Bn.x>An.x){const need=n.x+a.CW-Bn.x;if(need>0)shiftFrom(f,Bn.x,need,new Set([n.id,An.id]))}
 }
 return true;
}
function insertAtBox(f,n,T,zone){
 const a=A(),I=f.edges.filter(e=>e.t===T.id),O=f.edges.filter(e=>e.f===T.id);
 if(zone==="before"&&T.t==="trigger")zone="after";
 if(zone==="after"&&T.t==="end")zone="before";
 if(zone==="before"){
  if(I.length)return insertOnEdge(f,n,I[0]);
  n.l=T.l;n.r=T.r;n.x=T.x;shiftFrom(f,T.x,a.CW,new Set([n.id]));const o=primary(n);if(o)f.edges.push({id:"e"+a.uid(),f:n.id,p:o,t:T.id});return true}
 if(zone==="after"){
  if(O.length)return insertOnEdge(f,n,O[0]);
  n.l=T.l;n.r=T.r;n.x=T.x+a.CW;const p=unusedPort(f,T);if(p)f.edges.push({id:"e"+a.uid(),f:T.id,p,t:n.id});return true}
 /* branch */
 const p=unusedPort(f,T);
 n.l=T.l;n.r=(T.r||0)===0?1:0;n.x=T.x+a.CW;
 if(p)f.edges.push({id:"e"+a.uid(),f:T.id,p,t:n.id});
 else if(I.length&&I[0].p==="next"){const P=nd(f,I[0].f);if(P&&["trigger","human","auto","agent","wait","subflow","parallel"].includes(P.t)){f.edges.push({id:"e"+a.uid(),f:P.id,p:"next",t:n.id});if(O.length){const o=primary(n);if(o)f.edges.push({id:"e"+a.uid(),f:n.id,p:o,t:O[0].t})}}}
 return true;
}
/* lift a connected step out, bridging its neighbours. false when it has a real fan-in or fan-out */
function detach(f,n){
 const I=f.edges.filter(e=>e.t===n.id),O=f.edges.filter(e=>e.f===n.id);
 if(I.length>1||O.length>1)return false;
 f.edges=f.edges.filter(e=>e.t!==n.id&&e.f!==n.id);
 if(I.length&&O.length&&I[0].f!==O[0].t)f.edges.push({id:"e"+A().uid(),f:I[0].f,p:I[0].p,t:O[0].t});
 return true;
}

/* ---------- probe: what is under the pointer ---------- */
function probe(f,p,self){
 const a=A();
 for(const n of f.nodes){if(n.id===self||!nodeOk(n.id))continue;const r=rect(a,n);
  if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h){const fx=(p.x-r.x)/r.w,zone=fx<.34?"before":fx>.66?"after":"branch";return{kind:"box",id:n.id,zone}}}
 let best=null,bd=18;
 $$q("#wfdCanvas .wfd-edge").forEach(g=>{const id=g.dataset.wfdEdge,e=f.edges.find(x=>x.id===id);if(!e||e.f===self||e.t===self)return;const v=g.querySelector(".vis");if(!v||!v.getTotalLength)return;
  const L=v.getTotalLength();for(let i=0;i<=40;i++){const q=v.getPointAtLength(L*i/40),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best={kind:"edge",eid:id,pt:[q.x,q.y]}}}});
 return best;
}
const sameHov=(x,y)=>(!x&&!y)||(x&&y&&x.kind===y.kind&&x.eid===y.eid&&x.id===y.id&&x.zone===y.zone);

/* ---------- live feedback ---------- */
function clearFx(){
 hov=null;$$q("#wfdCanvas .wfd-edge.ins-hot").forEach(g=>g.classList.remove("ins-hot"));
 $$q("#wfdCanvas .wfd-node[data-nudged]").forEach(el=>{el.style.translate="";el.removeAttribute("data-nudged")});
 $$q("#wfdCanvas .wfd-inspill,#wfdCanvas .wfd-zones").forEach(el=>el.remove());
}
function nudge(id,dx,dy){const el=$q(`#wfdCanvas [data-wfd-node="${id}"]`);if(!el||reduce())return;el.style.translate=dx+"px "+dy+"px";el.setAttribute("data-nudged","1")}
function showFx(f,h){
 const a=A(),world=$q("#wfdCanvas .wfd-world");if(!world)return;const z=a.E.zoom||1;
 $$q("#wfdCanvas .wfd-edge.ins-hot").forEach(g=>g.classList.remove("ins-hot"));
 if(!sameHov(h,hov)){$$q("#wfdCanvas .wfd-node[data-nudged]").forEach(el=>{el.style.translate="";el.removeAttribute("data-nudged")});$$q("#wfdCanvas .wfd-inspill,#wfdCanvas .wfd-zones").forEach(el=>el.remove())}
 const fresh=!sameHov(h,hov);hov=h;
 if(!h)return;
 if(h.kind==="edge"){
  const g=$q(`#wfdCanvas .wfd-edge[data-wfd-edge="${h.eid}"]`);if(g)g.classList.add("ins-hot");
  const e=f.edges.find(x=>x.id===h.eid),An=nd(f,e.f),Bn=nd(f,e.t);
  if(fresh){const hor=Bn.x>An.x+a.NW-4;nudge(An.id,hor?-10:0,hor?0:-8);nudge(Bn.id,hor?10:0,hor?0:8);
   const el=document.createElement("div");el.className="wfd-inspill";const cv=$q("#wfdCanvas"),low=h.pt[1]*z-cv.scrollTop<70;el.style.left=h.pt[0]+"px";el.style.top=(low?h.pt[1]+16/z:h.pt[1]-14/z)+"px";if(low)el.classList.add("low");el.style.setProperty("--iz",1/z);el.textContent="+ Insert here";world.appendChild(el)}
 }else{
  const T=nd(f,h.id);if(!T)return;
  if(fresh){const dx=h.zone==="before"?10:h.zone==="after"?-10:0,dy=h.zone==="branch"?-8:0;nudge(T.id,dx,dy);
   const r=rect(a,T),el=document.createElement("div");el.className="wfd-zones";el.style.cssText=`left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;el.dataset.zone=h.zone;if(r.y*z-$q("#wfdCanvas").scrollTop<70)el.classList.add("low");
   const L={before:"Before",branch:"Branch",after:"After"};
   el.innerHTML=["before","branch","after"].map(k=>`<i data-z="${k}" class="${h.zone===k?"on":""}">${L[k]}</i>`).join("")+`<b class="wfd-zcap" style="--iz:${1/z}">Place ${h.zone==="branch"?"as a branch of":h.zone} ${ES(T.n)}</b>`;
   world.appendChild(el)}
  else{const el=$q("#wfdCanvas .wfd-zones");if(el){el.dataset.zone=h.zone;$$q("i",el).forEach(i=>i.classList.toggle("on",i.dataset.z===h.zone));const c=$q(".wfd-zcap",el);if(c)c.textContent="Place "+(h.zone==="branch"?"as a branch of":h.zone)+" "+T.n}}
 }
}
ROUTER.on("pointermove",e=>{
 const a=A();if(!a)return;const d=a.drag();
 if(!d||!d.moved||(d.k!=="pal"&&d.k!=="node")){if(hov)clearFx();return}
 const f=a.f();if(!f)return;const p=a.wpt(e.clientX,e.clientY);
 if(!p.in){if(hov)clearFx();return}
 const t=d.k==="pal"?NOINS.has(d.type)?null:probe(f,p,null):(NOINS.has((nd(f,d.id)||{}).t)?null:probe(f,p,d.id));
 showFx(f,t);
});
["pointerup","pointercancel"].forEach(ev=>document.addEventListener(ev,()=>{setTimeout(clearFx,0)},true));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&hov)clearFx()},true);

/* ---------- drops ---------- */
function describe(f,h){if(!h)return"";if(h.kind==="edge"){const e=f.edges.find(x=>x.id===h.eid);return" between "+(nd(f,e.f)||{}).n+" and "+(nd(f,e.t)||{}).n}const T=nd(f,h.id);return" "+(h.zone==="branch"?"as a branch of ":h.zone+" ")+(T||{}).n}
function place(f,n,h){
 if(!h)return false;
 if(h.kind==="edge"){const e=f.edges.find(x=>x.id===h.eid);return e?insertOnEdge(f,n,e):false}
 const T=nd(f,h.id);return T?insertAtBox(f,n,T,h.zone):false;
}
function mkType(a,type,id,lane,x,row){
 let t=type,extra={};if(type==="notify"){t="auto";extra={op:"Send notification"}}
 const n=a.mkNode(id,t,type==="notify"?"Notify":a.NEWNAME[t],lane,x,row,t==="agent"?{agent:"Triage Agent",goal:""}:extra,t==="human"||t==="approval"?{tg:{sla:"1 d",dur:4}}:{});
 return n;
}
function dropNew(type,p,e){
 const a=A();if(!a)return false;const f=a.f();if(!f)return false;
 const h=NOINS.has(type)?null:probe(f,p,null);
 a.pushU(f);const id="N"+a.uid();
 const lane=Math.max(0,Math.min(f.lanes.length-1,Math.floor(p.y/a.LH))),row=((p.y%a.LH)>a.LH/2)?1:0;
 const n=mkType(a,type,id,lane,Math.max(a.LW+10,Math.round((p.x-a.NW/2)/22)*22),row);
 f.nodes.push(n);
 let did=false;const ds=describe(f,h);if(h)did=place(f,n,h);
 resolve(f,[n.id]);
 a.touch(f);a.E.sel=id;a.E.selE=null;a.E.tab="do";a.E.insp="step";
 a.audit("added workflow step",a.NTY[n.t].l+" in "+f.name+(did?ds:""));
 a.toast(did?a.NTY[n.t].l+" inserted"+ds+". Both connections re-wired.":a.NTY[n.t].l+" added. Tell it what to do on the right, then connect its port.","info");
 clearFx();a.paintAll();return true;
}
function afterMove(f,n,e){
 const a=A();if(!a)return;const p=a.wpt(e.clientX,e.clientY);
 const h=p.in&&!NOINS.has(n.t)?probe(f,p,n.id):null;
 if(h){const ds=describe(f,h);if(detach(f,n)){const did=place(f,n,h);if(did){a.toast(a.NTY[n.t].l+" moved"+ds+". Both connections re-wired.","info")}}else a.toast("That step has several connections, so it was moved but not inserted.","warn")}
 resolve(f,[n.id]);
}

/* ---------- hover handle and mini picker ---------- */
function closeMini(){if(mini){mini.remove();mini=null}}
function hidePlus(){clearTimeout(plusT);$$q("#wfdCanvas .wfd-plus").forEach(x=>x.remove())}
function edgeMid(eid,fr){const g=$q(`#wfdCanvas .wfd-edge[data-wfd-edge="${eid}"] .vis`);if(!g||!g.getTotalLength)return null;const L=g.getTotalLength(),q=g.getPointAtLength(L*(fr==null?.5:fr));return[q.x,q.y]}
function showPlus(eid){
 const a=A();if(!a||a.drag()||mini)return;const world=$q("#wfdCanvas .wfd-world");if(!world)return;
 const ex=$q("#wfdCanvas .wfd-plus");if(ex&&ex.dataset.eid===eid){clearTimeout(plusT);return}
 hidePlus();const f=a.f(),e=f.edges.find(x=>x.id===eid);if(!e)return;
 const m=edgeMid(eid,e.p!=="next"?.62:.5);if(!m)return;const z=a.E.zoom||1;
 const b=document.createElement("button");b.type="button";b.className="wfd-plus";b.dataset.eid=eid;b.setAttribute("aria-label","Insert a step here");b.title="Insert a step here";b.style.left=m[0]+"px";b.style.top=m[1]+"px";b.style.setProperty("--iz",1/z);b.textContent="+";world.appendChild(b);
}
function insertPicked(eid,type){
 const a=A(),f=a.f(),e=f.edges.find(x=>x.id===eid);if(!e)return;
 const ds=describe(f,{kind:"edge",eid:eid});a.pushU(f);const An=nd(f,e.f),id="N"+a.uid(),n=mkType(a,type,id,An.l,An.x+a.CW,An.r||0);f.nodes.push(n);
 insertOnEdge(f,n,e);resolve(f,[n.id]);a.touch(f);a.E.sel=id;a.E.selE=null;a.E.tab="do";a.E.insp="step";
 a.audit("inserted workflow step",a.NTY[n.t].l+" in "+f.name);a.toast(a.NTY[n.t].l+" inserted"+ds+". Both connections re-wired.","info");a.paintAll();
 setTimeout(()=>{const el=$q(`[data-wfd-node="${id}"]`);if(el)el.focus({preventScroll:true})},60);
}
function openMini(eid){
 const a=A();if(!a)return;closeMini();const f=a.f(),e=f&&f.edges.find(x=>x.id===eid);if(!e)return;
 const m=edgeMid(eid,e.p!=="next"?.62:.5),cv=$q("#wfdCanvas");if(!m||!cv)return;const rc=cv.getBoundingClientRect(),z=a.E.zoom||1;
 const sx=rc.left-cv.scrollLeft+m[0]*z,sy=rc.top-cv.scrollTop+m[1]*z;
 const el=document.createElement("div");el.className="wfd-mini glass";el.setAttribute("role","menu");el.setAttribute("aria-label","Insert a step here");el.dataset.eid=eid;
 el.innerHTML=`<div class="wfd-mini-t">Insert here</div><div class="wfd-mini-g">${MINI.map(([t,l])=>{const T=a.NTY[t==="notify"?"auto":t];return `<button type="button" role="menuitem" class="wfd-mini-b" data-wfd-mini="${t}" data-eid="${eid}" style="--nc:var(${T.c})"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${T.d}"/></svg><span>${l}</span></button>`}).join("")}</div>`;
 document.body.appendChild(el);const w=el.offsetWidth,h=el.offsetHeight;
 el.style.left=Math.max(8,Math.min(innerWidth-w-8,sx-w/2))+"px";el.style.top=(sy+22+h>innerHeight-8?Math.max(8,sy-22-h):sy+22)+"px";
 mini=el;hidePlus();const b=el.querySelector("button");if(b)b.focus();
}
document.addEventListener("mouseover",e=>{
 const a=A();if(!a||!a.f()||!$q("#wfdCanvas")||a.drag())return;const t=e.target;if(!t.closest)return;
 const g=t.closest("#wfdCanvas .wfd-edge"),pl=t.closest(".wfd-plus");
 if(g)showPlus(g.dataset.wfdEdge);else if(pl)clearTimeout(plusT);else if($q("#wfdCanvas .wfd-plus")){clearTimeout(plusT);plusT=setTimeout(hidePlus,320)}
},true);
ROUTER.on("focusin","#wfdCanvas .wfd-edge",(e,g)=>{showPlus(g.dataset.wfdEdge)});
document.addEventListener("pointerdown",e=>{
 const t=e.target;if(!t.closest)return;
 const pl=t.closest(".wfd-plus");if(pl){e.preventDefault();e.stopImmediatePropagation();openMini(pl.dataset.eid);return}
 if(mini&&!t.closest(".wfd-mini"))closeMini();
},true);
document.addEventListener("click",e=>{
 const b=e.target.closest&&e.target.closest("[data-wfd-mini]");if(b){e.preventDefault();e.stopPropagation();const id=b.dataset.eid,t=b.dataset.wfdMini;closeMini();insertPicked(id,t);return}
 if(e.target.closest&&e.target.closest(".wfd-plus")){e.preventDefault();e.stopPropagation()}
},true);
document.addEventListener("keydown",e=>{
 const t=e.target;
 if(mini&&t.closest&&t.closest(".wfd-mini")){
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();const id=mini.dataset.eid;closeMini();const a=A();if(a){a.E.selE=id;const g=$q(`#wfdCanvas .wfd-edge[data-wfd-edge="${id}"]`);if(g)g.focus({preventScroll:true})}return}
  const bs=$$q(".wfd-mini-b",mini),i=bs.indexOf(t);
  if(/^Arrow/.test(e.key)&&i>=0){e.preventDefault();e.stopPropagation();const n=(e.key==="ArrowRight"||e.key==="ArrowDown")?(i+1)%bs.length:(i-1+bs.length)%bs.length;bs[n].focus()}
  return;
 }
 const a=A();if(!a||!a.f()||!$q("#wfdCanvas"))return;
 if(t.closest&&t.closest(".wfd-plus")&&(e.key==="Enter"||e.key===" ")){e.preventDefault();e.stopPropagation();openMini(t.closest(".wfd-plus").dataset.eid);return}
 if(e.key!=="Enter"&&e.key!=="+"&&e.key!=="=")return;
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(t.matches&&t.matches("input,textarea,select,[contenteditable]"))return;
 const g=t.closest&&t.closest("#wfdCanvas .wfd-edge");
 const ok=t===document.body||(t.closest&&(t.closest("#wfdCanvas")||t.closest("[data-wfd-root]")&&!t.closest("button,a,summary,[role=menuitem]")));
 const id=g?g.dataset.wfdEdge:(a.E.selE&&ok?a.E.selE:null);
 if(id&&a.f().edges.some(x=>x.id===id)){
  e.preventDefault();e.stopPropagation();
  if(a.E.selE!==id){a.E.selE=id;a.E.sel=null;a.paintCanvas();a.paintInsp()}
  openMini(id);
 }
},true);
window.addEventListener("scroll",closeMini,true);

window.FLOWX=window.FLOWX||{};
FLOWX._ins={dropNew,afterMove,resolve,overlaps,probe,insertPicked,openMini,detach,clearFx};
})();
