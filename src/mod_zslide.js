/* =====================================================================
   mod_zslide.js  -  permanent sliders (always-visible scroll, pan and zoom controls)
   window.SLIDERS.attach(host, adapter, opts)
     adapter = { getView(){x,y,w,h in content coords}, getBounds(){x,y,w,h}, panTo(x,y),
                 zoomTo(k,anchor?), getZoom(), minZoom, maxZoom, fit() }
   Renders inside host: a vertical scrollbar-style slider on the right edge, a horizontal one along
   the bottom, and a zoom slider (role=slider, minus/plus, percentage, Fit). Always visible, never
   auto-hiding; the thumb hides when content fits but the track stays. Keyboard accessible.
   SLIDERS.attachScroll(el, opts) wraps a native overflow container and replaces its hidden
   overlay scrollbars with the same controls.  Wiring for the app canvases is at the bottom.
   ===================================================================== */
(function(){
"use strict";
if(window.SLIDERS)return;
const SL=window.SLIDERS={ver:1,_all:new Set()};
const clamp=U.clamp;
const mk=(tag,cls,attrs)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);return e};
const SV=d=>`<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const ARW={l:"M7.5 2.5L4 6l3.5 3.5",r:"M4.5 2.5L8 6 4.5 9.5",u:"M2.5 7.5L6 4l3.5 3.5",d:"M2.5 4.5L6 8l3.5-3.5"};
const lsGet=k=>{const v=U.store.get(k,null);return v==null?null:String(v)};
const lsSet=(k,v)=>{U.store.set(k,+v)};
let UID=0;

function attach(host,ad,opt){
 opt=opt||{};
 if(!host||!ad)return null;
 if(host._zs){if(host._zs.root.parentNode===host){host._zs.ad=ad;host._zs.update(true);return host._zs}host._zs.destroy()}
 try{if(getComputedStyle(host).position==="static")host.style.position="relative"}catch(e){}
 host.classList.add("zs-host");
 const id="zs"+(++UID),wrapMode=opt.mode==="wrap";
 const root=mk("div","zs-root"+(wrapMode?" zs-wrapmode":""),{"data-zs":opt.name||"canvas"});
 const bar=ax=>{
  const v=ax==="y",el=mk("div",v?"zs-v":"zs-h"),b1=mk("button",`zs-ab zs-${v?"up":"lf"}`,{type:"button",tabindex:"-1","aria-label":v?"Scroll up":"Scroll left"}),
   tr=mk("div","zs-tr",{"data-zs-track":ax}),th=mk("div","zs-th",{role:"scrollbar",tabindex:"0","aria-orientation":v?"vertical":"horizontal","aria-label":v?"Vertical scroll":"Horizontal scroll","aria-valuemin":"0","aria-valuemax":"100","aria-valuenow":"0","data-zs-thumb":ax}),
   b2=mk("button",`zs-ab zs-${v?"dn":"rt"}`,{type:"button",tabindex:"-1","aria-label":v?"Scroll down":"Scroll right"});
  b1.innerHTML=SV(v?ARW.u:ARW.l);b2.innerHTML=SV(v?ARW.d:ARW.r);tr.appendChild(th);el.append(b1,tr,b2);
  return{ax,el,b1,b2,tr,th,pk:v?"y":"x",sk:v?"h":"w"}};
 const X=bar("x"),Y=bar("y"),bt=mk("div","zs-bt");
 const hasZoom=!!ad.zoomTo,zm=mk("div","zs-zm",{role:"group","aria-label":"Zoom"});
 let rng=null,lab=null,out=null,mbtn=null;
 if(hasZoom||ad.fit){
  let h="";
  if(hasZoom)h+=`<button type="button" class="zs-zb" data-zs-z="out" aria-label="Zoom out" title="Zoom out">${SV("M2.5 6h7")}</button><input type="range" class="zs-rng" aria-label="Zoom" min="0" max="1000" step="1" value="500"><button type="button" class="zs-zb" data-zs-z="in" aria-label="Zoom in" title="Zoom in">${SV("M2.5 6h7M6 2.5v7")}</button><output class="zs-pct" aria-live="off">100%</output>`;
  if(ad.fit)h+=`<button type="button" class="zs-fit" data-zs-fit aria-label="Fit to view" title="Fit to view">Fit</button>`;
  if(opt.mini)h+=`<button type="button" class="zs-fit zs-mini" data-zs-mini aria-pressed="true" aria-label="Show minimap" title="Show or hide the minimap">Map</button>`;
  zm.innerHTML=h;rng=zm.querySelector(".zs-rng");out=zm.querySelector(".zs-pct");mbtn=zm.querySelector("[data-zs-mini]");
 }
 bt.append(X.el);if(zm.children.length)bt.appendChild(zm);
 root.append(Y.el,bt);host.appendChild(root);
 const H={host,root,ad,opt,id,destroy,update:sched,_bars:{x:X,y:Y}};
 host._zs=H;SL._all.add(H);

 /* ---------- geometry ---------- */
 let frozen=null,raf=0,pend=null,sig="";
 const axisCalc=(B,v,b)=>{
  const p=B.pk,s=B.sk;let lo,range;
  if(frozen&&frozen.ax===B.ax){lo=frozen.lo;range=frozen.range}else{lo=Math.min(b[p],v[p]);range=Math.max(b[p]+b[s],v[p]+v[s])-lo}
  const size=Math.max(1,v[s]);range=Math.max(range,size);
  const fits=b[p]>=v[p]-1&&b[p]+b[s]<=v[p]+size+1;
  const pos=range>size?clamp((v[p]-lo)/(range-size),0,1):0;
  return{lo,range,size,fits,pos,ratio:Math.min(1,size/range)}};
 function paintAxis(B,c){
  const T=B.ax==="x"?B.tr.clientWidth:B.tr.clientHeight;if(!T)return;
  const min=Math.min(T,B.ax==="x"?36:36),len=clamp(Math.round(c.ratio*T),min,T),off=Math.round(c.pos*(T-len));
  B.tr.classList.toggle("zs-fit",c.fits);B.th.setAttribute("aria-disabled",c.fits?"true":"false");
  if(c.fits){B.th.style.display="none"}else{B.th.style.display="";if(B.ax==="x"){B.th.style.width=len+"px";B.th.style.left=off+"px";B.th.style.height="";B.th.style.top=""}else{B.th.style.height=len+"px";B.th.style.top=off+"px";B.th.style.width="";B.th.style.left=""}}
  const now=Math.round(c.pos*100);B.th.setAttribute("aria-valuenow",String(now));B.th.setAttribute("aria-valuetext",c.fits?"All content visible":now+" percent");
  B.b1.disabled=c.fits||c.pos<=0.0005;B.b2.disabled=c.fits||c.pos>=.9995;
 }
 function paint(force){
  if(!host.isConnected)return;
  const v=ad.getView(),b=ad.getBounds();if(!v||!b)return;
  const k=hasZoom?ad.getZoom():1;
  const s=[v.x,v.y,v.w,v.h,b.x,b.y,b.w,b.h,k,host.clientWidth,host.clientHeight,Y.tr.clientHeight,X.tr.clientWidth,opt.mini?1:0].map(n=>typeof n==="number"?Math.round(n*100)/100:n).join("|");
  const nar=host.clientWidth<560;
  if(root.classList.contains("zs-narrow")!==nar)root.classList.toggle("zs-narrow",nar);
  /* vertical bar is only shown in wrap mode when the content actually overflows vertically */
  const needV=!wrapMode||b.h>v.h+1;
  if(root.classList.contains("zs-nov")===needV)root.classList.toggle("zs-nov",!needV);
  const bh=bt.offsetHeight,vw=needV?Y.el.offsetWidth:0;
  if(bh&&host._zsb!==bh){host._zsb=bh;host.style.setProperty("--zs-b",bh+"px")}
  if(host._zsr!==vw){host._zsr=vw;host.style.setProperty("--zs-r",vw+"px")}
  if(!force&&s===sig&&!frozen)return;sig=s;
  paintAxis(X,axisCalc(X,v,b));if(needV)paintAxis(Y,axisCalc(Y,v,b));
  if(rng){const lo=Math.log(ad.minZoom||.1),hi=Math.log(ad.maxZoom||4),pc=Math.round(k*100);
   if(document.activeElement!==rng||!rng._drag)rng.value=String(Math.round(1000*(Math.log(k)-lo)/(hi-lo||1)));
   out.textContent=pc+"%";rng.setAttribute("aria-valuetext",pc+" percent");
   const zi=zm.querySelector('[data-zs-z="in"]'),zo=zm.querySelector('[data-zs-z="out"]');if(zi)zi.disabled=k>=(ad.maxZoom||4)-.001;if(zo)zo.disabled=k<=(ad.minZoom||.1)+.001}
  if(opt.mini)applyMini();
 }
 function sched(force){if(force===true)sig="";if(raf)return;raf=requestAnimationFrame(()=>{raf=0;try{paint()}catch(e){}})}

 /* ---------- panning ---------- */
 const flush=()=>{if(!pend)return;const p=pend;pend=null;ad.panTo(p.x,p.y);sched()};
 function panAbs(ax,val,lo,range){
  const v=ad.getView(),B=ax==="x"?X:Y,s=v[B.sk];
  const L=lo!=null?lo:Math.min(ad.getBounds()[B.pk],v[B.pk]),R=range!=null?range:Math.max(ad.getBounds()[B.pk]+ad.getBounds()[B.sk],v[B.pk]+s)-L;
  const nv=range>s||R>s?clamp(val,L,L+Math.max(0,R-s)):v[B.pk];
  const x=ax==="x"?nv:v.x,y=ax==="y"?nv:v.y;
  pend={x,y};if(frozen)requestAnimationFrame(flush);else flush();
 }
 const panBy=(ax,d)=>{const v=ad.getView();panAbs(ax,v[ax==="x"?"x":"y"]+d)};
 const size=ax=>ad.getView()[ax==="x"?"w":"h"];

 [X,Y].forEach(B=>{
  const ax=B.ax;
  /* thumb drag */
  B.th.addEventListener("pointerdown",e=>{
   if(e.button&&e.pointerType==="mouse")return;e.preventDefault();e.stopPropagation();
   const v=ad.getView(),b=ad.getBounds(),c=axisCalc(B,v,b),T=ax==="x"?B.tr.clientWidth:B.tr.clientHeight,len=ax==="x"?B.th.offsetWidth:B.th.offsetHeight;
   frozen={ax,lo:c.lo,range:c.range};
   const st={p:ax==="x"?e.clientX:e.clientY,v0:v[B.pk],k:(c.range-c.size)/Math.max(1,T-len),id:e.pointerId};
   B.th.classList.add("zs-drag");try{B.th.setPointerCapture(e.pointerId)}catch(x){}
   B.th._d=st;B.th.focus({preventScroll:true});
  });
  B.th.addEventListener("pointermove",e=>{const st=B.th._d;if(!st||e.pointerId!==st.id)return;const d=(ax==="x"?e.clientX:e.clientY)-st.p;panAbs(ax,st.v0+d*st.k,frozen.lo,frozen.range)});
  const up=e=>{const st=B.th._d;if(!st||e.pointerId!==st.id)return;B.th._d=null;frozen=null;B.th.classList.remove("zs-drag");try{B.th.releasePointerCapture(e.pointerId)}catch(x){}sched(true)};
  B.th.addEventListener("pointerup",up);B.th.addEventListener("pointercancel",up);B.th.addEventListener("lostpointercapture",up);
  /* track click: page toward the click */
  B.tr.addEventListener("pointerdown",e=>{
   if(e.target!==B.tr)return;if(e.button&&e.pointerType==="mouse")return;e.preventDefault();e.stopPropagation();
   const r=B.th.getBoundingClientRect(),before=ax==="x"?e.clientX<r.left:e.clientY<r.top;
   const step=()=>panBy(ax,(before?-1:1)*size(ax)*.9);step();
  });
  /* arrow buttons with press-and-hold */
  [[B.b1,-1],[B.b2,1]].forEach(([btn,dir])=>{
   let t1=0,t2=0;const stop=()=>{clearTimeout(t1);clearInterval(t2)};
   btn.addEventListener("pointerdown",e=>{if(btn.disabled)return;e.preventDefault();e.stopPropagation();const go=()=>panBy(ax,dir*size(ax)*.14);go();stop();t1=setTimeout(()=>{t2=setInterval(go,70)},380);try{btn.setPointerCapture(e.pointerId)}catch(x){}});
   ["pointerup","pointercancel","lostpointercapture"].forEach(n=>btn.addEventListener(n,stop));
   btn.addEventListener("click",e=>{if(e.detail===0&&!btn.disabled)panBy(ax,dir*size(ax)*.14)});
  });
  /* wheel on the bar scrolls that axis */
  B.el.addEventListener("wheel",e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();e.stopPropagation();const d=(ax==="x"&&Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?24:1);panBy(ax,d/(Math.max(.05,hasZoom?ad.getZoom():1)))},{passive:false});
  /* keyboard */
  B.th.addEventListener("keydown",e=>{
   const key=e.key,s=size(ax),prev=ax==="x"?"ArrowLeft":"ArrowUp",next=ax==="x"?"ArrowRight":"ArrowDown";let h=true;
   const bnd=ad.getBounds(),v=ad.getView(),L=Math.min(bnd[B.pk],v[B.pk]),R=Math.max(bnd[B.pk]+bnd[B.sk],v[B.pk]+s);
   if(key===prev)panBy(ax,-s*.1);else if(key===next)panBy(ax,s*.1);
   else if(key==="PageUp"||(key===" "&&e.shiftKey))panBy(ax,-s*.9);else if(key==="PageDown"||key===" ")panBy(ax,s*.9);
   else if(key==="Home")panAbs(ax,L,L,R-L);else if(key==="End")panAbs(ax,R-s,L,R-L);else h=false;
   if(h){e.preventDefault();e.stopPropagation()}
  });
 });

 /* ---------- zoom ---------- */
 if(hasZoom){
  const lo=()=>Math.log(ad.minZoom||.1),hi=()=>Math.log(ad.maxZoom||4);
  rng.addEventListener("pointerdown",()=>{rng._drag=true});
  ["pointerup","pointercancel","blur"].forEach(n=>rng.addEventListener(n,()=>{rng._drag=false}));
  rng.addEventListener("input",()=>{const k=Math.exp(lo()+(hi()-lo())*(+rng.value)/1000);ad.zoomTo(k);sched(true)});
  zm.addEventListener("click",e=>{const b=e.target.closest("[data-zs-z]");if(!b)return;const k=ad.getZoom(),f=b.dataset.zsZ==="in"?1.2:1/1.2;ad.zoomTo(clamp(k*f,ad.minZoom||.1,ad.maxZoom||4));sched(true)});
 }
 if(ad.fit)zm.addEventListener("click",e=>{if(e.target.closest("[data-zs-fit]")){ad.fit();sched(true);setTimeout(()=>sched(true),420)}});
 /* optional minimap toggle */
 const mkey="zs.mini."+(opt.name||"c");
 let miniOn=lsGet(mkey)!=="0";
 function applyMini(){const sel=opt.mini;if(!sel)return;host.querySelectorAll(sel).forEach(m=>{if(m.closest(".zs-root"))return;m.style.display=miniOn?"":"none"});if(mbtn)mbtn.setAttribute("aria-pressed",miniOn?"true":"false")}
 if(mbtn)mbtn.addEventListener("click",()=>{miniOn=!miniOn;lsSet(mkey,miniOn?"1":"0");applyMini()});

 /* ---------- keep the host's own handlers out of the control strip ---------- */
 ["pointerdown","pointermove","pointerup","click","dblclick","contextmenu","keydown","wheel","mousedown","touchstart"].forEach(n=>root.addEventListener(n,e=>{if(n==="pointerup"||n==="pointermove")return;e.stopPropagation()},{passive:n!=="wheel"&&n!=="touchstart"?undefined:false}));

 /* ---------- live updates ---------- */
 const ev=["pointermove","pointerup","wheel","keyup","transitionend","animationend"];ev.forEach(n=>host.addEventListener(n,()=>sched(),{passive:true}));
 host.addEventListener("scroll",()=>sched(),true);
 if(opt.scroller)opt.scroller.addEventListener("scroll",()=>sched(),{passive:true});
 if(window.ResizeObserver){H._ro=new ResizeObserver(()=>sched(true));H._ro.observe(host);if(opt.scroller)H._ro.observe(opt.scroller)}
 function destroy(){SL._all.delete(H);if(H._ro)H._ro.disconnect();cancelAnimationFrame(raf);if(root.parentNode)root.parentNode.removeChild(root);if(host._zs===H)host._zs=null}
 paint(true);requestAnimationFrame(()=>paint(true));
 return H;
}
SL.attach=attach;

/* generic adapter for a native scroll container (optionally with a zoom hook) */
SL.scrollAdapter=function(el,z){
 const ad={getView:()=>({x:el.scrollLeft,y:el.scrollTop,w:el.clientWidth,h:el.clientHeight}),
  getBounds:()=>({x:0,y:0,w:el.scrollWidth,h:el.scrollHeight}),
  panTo:(x,y)=>{el.scrollLeft=x;el.scrollTop=y}};
 if(z)Object.assign(ad,z);return ad};

/* wrap an overflow:auto element, hide its overlay-prone native bars, and give it permanent controls */
SL.attachScroll=function(el,opt){
 opt=opt||{};if(!el||!el.parentNode)return null;
 let wrap=el.parentNode.classList&&el.parentNode.classList.contains("zs-wrap")?el.parentNode:null;
 if(!wrap){wrap=mk("div","zs-wrap");el.parentNode.insertBefore(wrap,el);wrap.appendChild(el)}
 el.classList.add("zs-scroller");
 const ad=opt.adapter||SL.scrollAdapter(el,opt.zoom);
 return attach(wrap,ad,Object.assign({},opt,{mode:"wrap",scroller:el}));
};

/* one slow tick: drop handles whose host left the page, refresh the rest */
setInterval(()=>{if(document.hidden)return;SL._all.forEach(h=>{if(!h.host.isConnected){h.destroy();return}h.update()})},350);

/* =====================================================================
   Wiring: adapters for the app canvases. Each target finds its host after a screen paints.
   ===================================================================== */
const rd2=n=>Math.round(n*100)/100;
const T=[];
const target=(name,find,build,opt)=>T.push({name,find,build,opt:Object.assign({name},opt||{})});

/* Org chart (all chart views) */
target("org",()=>{const v=document.getElementById("orgvp");return v&&v.closest(".org-wrap")||null},host=>{
 const C=()=>window.ORGX&&ORGX.cam;if(!C())return null;
 return{getView(){const c=C().get(),k=c.k;return{x:-c.x/k,y:-c.y/k,w:c.vw/k,h:c.vh/k}},
  getBounds(){const c=C().get();return{x:0,y:0,w:c.W||1,h:c.H||1}},
  panTo(x,y){const k=C().get().k;C().set(Math.round(-x*k),Math.round(-y*k))},
  zoomTo(k){const c=C().get();C().zoomAt(k/c.k)},getZoom:()=>C().get().k,minZoom:C().min,maxZoom:C().max,fit:()=>C().fit()}});

/* Master process flow map */
target("modmap",()=>document.querySelector("[data-mm-vp]"),host=>{
 const C=()=>window.MODMAP&&MODMAP._cam;if(!C()||!C().get())return null;
 return{getView(){const v=C().get(),k=v.k;return{x:-v.x/k,y:-v.y/k,w:host.clientWidth/k,h:host.clientHeight/k}},
  getBounds:()=>C().bounds(),
  panTo(x,y){const k=C().get().k;C().set({k,x:-x*k,y:-y*k})},
  zoomTo(k){const v=C().get();C().zoomAt(k/v.k)},getZoom:()=>C().get().k,minZoom:C().min,maxZoom:C().max,fit:()=>C().fit()}},{mini:".mm-mini"});

/* Master data model diagram */
target("atlas",()=>{const v=document.querySelector('[data-at-vp="dm"]');return v&&(v.parentElement&&v.parentElement.classList.contains("at-vpbox")&&v.parentElement.clientHeight<=v.clientHeight+2?v.parentElement:v)},host=>{
 const C=()=>window.ATLAS&&ATLAS._cam;if(!C()||!C().get())return null;const vp=()=>host.querySelector('[data-at-vp="dm"]')||host;
 return{getView(){const c=C().get(),k=c.k,v=vp();return{x:-c.x/k,y:-c.y/k,w:v.clientWidth/k,h:v.clientHeight/k}},
  getBounds:()=>C().bounds(),
  panTo(x,y){const k=C().get().k;C().set({k,x:-x*k,y:-y*k})},
  zoomTo(k){const c=C().get(),v=vp();C().set(zoomAround(c,k,v.clientWidth/2,v.clientHeight/2,C().min,C().max))},getZoom:()=>C().get().k,minZoom:C().min,maxZoom:C().max,fit:()=>C().fit()}},{mini:".at-mm"});
function zoomAround(c,k,cx,cy,mn,mx){const k2=clamp(k,mn,mx);return{k:k2,x:cx-(cx-c.x)*k2/c.k,y:cy-(cy-c.y)*k2/c.k}}

/* Process drawing studio */
target("draw",()=>{const s=document.getElementById("drSvg");return s&&s.closest(".dr-canvas,.dr-ro-wrap")},host=>{
 const D=window.DRAW;if(!D||!D.ST)return null;const ST=D.ST,svg=()=>document.getElementById("drSvg");
 const sz=()=>{const s=svg();return s?{w:s.clientWidth||s.getBoundingClientRect().width||1,h:s.clientHeight||s.getBoundingClientRect().height||1}:{w:1,h:1}};
 return{getView(){const z=sz(),k=ST.k||1;return{x:-ST.px/k,y:-ST.py/k,w:z.w/k,h:z.h/k}},
  getBounds(){const sh=(ST.doc&&ST.doc.shapes||[]);const v=this.getView();if(!sh.length)return v;
   const x0=Math.min(...sh.map(s=>s.x)),y0=Math.min(...sh.map(s=>s.y)),x1=Math.max(...sh.map(s=>s.x+s.w)),y1=Math.max(...sh.map(s=>s.y+s.h+24));return{x:x0-60,y:y0-60,w:x1-x0+120,h:y1-y0+120}},
  panTo(x,y){const k=ST.k||1;ST.px=-x*k;ST.py=-y*k;D.paint()},
  zoomTo(k){const z=sz(),k0=ST.k||1,k1=rd2(clamp(k,.25,2.2)),cx=z.w/2,cy=z.h/2;ST.px=cx-(cx-ST.px)*k1/k0;ST.py=cy-(cy-ST.py)*k1/k0;ST.k=k1;D.paint()},
  getZoom:()=>ST.k||1,minZoom:.25,maxZoom:2.2,fit:()=>D.fit()}});

/* Workflow designer canvas (native scroll plus a zoom scale) */
target("wfd",()=>document.querySelector(".wfd-canvaswrap"),host=>{
 const A=window.FLOWX&&FLOWX._ed&&FLOWX._ed();if(!A)return null;const cv=()=>host.querySelector("#wfdCanvas");if(!cv())return null;
 const z=()=>FLOWX._ed().E.zoom||1;
 return{getView(){const c=cv(),k=z();return{x:c.scrollLeft/k,y:c.scrollTop/k,w:c.clientWidth/k,h:c.clientHeight/k}},
  getBounds(){const c=cv(),k=z();return{x:0,y:0,w:c.scrollWidth/k,h:c.scrollHeight/k}},
  panTo(x,y){const c=cv(),k=z();c.scrollLeft=x*k;c.scrollTop=y*k},
  zoomTo(k){const a=FLOWX._ed(),c=cv(),k0=z(),cx=(c.scrollLeft+c.clientWidth/2)/k0,cy=(c.scrollTop+c.clientHeight/2)/k0;a.E.zoom=rd2(clamp(k,.35,1.5));a.paintCanvas();if(a.paintHead)a.paintHead();const c2=cv(),k1=z();c2.scrollLeft=cx*k1-c2.clientWidth/2;c2.scrollTop=cy*k1-c2.clientHeight/2},
  getZoom:z,minZoom:.35,maxZoom:1.5,fit(){const a=FLOWX._ed();if(a.fitZoom)a.fitZoom()}}},{mini:".wfd-mm"});

/* Knowledge and impact graphs (canvas) */
target("graph",()=>{const o=[];document.querySelectorAll(".gx-cv").forEach(h=>{if(!h._zs)o.push(h)});return o},host=>{
 const gx=host.closest(".gx"),C=()=>gx&&gx._gxcam;if(!C())return null;
 return{getView(){const v=C().get(),s=C().size(),k=v.k;return{x:-v.x/k,y:-v.y/k,w:s.w/k,h:s.h/k}},
  getBounds:()=>C().bounds(),
  panTo(x,y){const v=C().get();C().set({k:v.k,x:-x*v.k,y:-y*v.k})},
  zoomTo(k){const v=C().get();C().zoomBy(k/v.k)},getZoom:()=>C().get().k,minZoom:C().min,maxZoom:C().max,fit:()=>C().fit()}});

/* Dependency and impact graph (canvas) */
target("itomgraph",()=>{const c=document.getElementById("itomCv");return c&&c.closest(".itom-gc")},host=>{
 const C=()=>window.ITOMCAM;if(!C())return null;
 return{getView(){const v=C().get(),s=C().size(),k=v.k;return{x:-v.x/k,y:-v.y/k,w:s.w/k,h:s.h/k}},
  getBounds:()=>C().bounds(),
  panTo(x,y){const v=C().get();C().set({k:v.k,x:-x*v.k,y:-y*v.k})},
  zoomTo(k){const v=C().get();C().zoomBy(k/v.k)},getZoom:()=>C().get().k,minZoom:C().min,maxZoom:C().max,fit:()=>C().fit()}});

/* Visualization builder preview: scale the chart inside a scrolling frame */
function vizZoom(el){
 const svg=()=>el.querySelector("svg.vz-svg"),zk=()=>{const s=svg(),w=s&&s.style.width;return w&&/%$/.test(w)?Math.max(1,parseFloat(w)/100):1};
 return{getZoom:zk,minZoom:1,maxZoom:4,
  zoomTo(k){const s=svg();if(!s)return;const k0=zk(),k1=rd2(clamp(k,1,4)),cx=(el.scrollLeft+el.clientWidth/2)/k0,cy=(el.scrollTop+el.clientHeight/2)/k0;s.style.maxWidth=k1>1?"none":"";s.style.width=k1>1?(k1*100)+"%":"";s.style.height="auto";el.scrollLeft=cx*k1-el.clientWidth/2;el.scrollTop=cy*k1-el.clientHeight/2},
  fit(){this.zoomTo(1);el.scrollLeft=0;el.scrollTop=0}}}

const wired=[];
SL.wire=function(def){wired.push(def)};
SL.scan=function(){
 T.forEach(t=>{
  let hs;try{hs=t.find()}catch(e){hs=null}if(!hs)return;if(!Array.isArray(hs))hs=[hs];
  hs.forEach(h=>{if(!h||!h.isConnected)return;if(h._zs&&h._zs.root.parentNode===h)return;
   let ad=null;try{ad=t.build(h)}catch(e){ad=null}if(ad)attach(h,ad,t.opt)})});
 /* scroll containers that need permanent controls */
 const sw=[".svc3-swwrap",".flw-bpwrap"];
 sw.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{if(el.classList.contains("zs-scroller")&&el.parentNode&&el.parentNode._zs)return;SL.attachScroll(el,{name:"swim"})}));
 document.querySelectorAll(".viz-bc .vz-mount").forEach(el=>{if(el.classList.contains("zs-scroller")&&el.parentNode&&el.parentNode._zs)return;SL.attachScroll(el,{name:"viz",adapter:SL.scrollAdapter(el,vizZoom(el))})});
 wired.forEach(w=>{try{w()}catch(e){}});
};
let sraf=0;const kick=()=>{if(sraf)return;sraf=requestAnimationFrame(()=>{sraf=0;try{SL.scan()}catch(e){console.error("sliders scan",e)}})};
const start=()=>{
 const root=document.getElementById("view")||document.body;
 new MutationObserver(kick).observe(document.body,{childList:true,subtree:true});
 const ca=window.coreAfter;window.coreAfter=function(){if(ca)ca.apply(this,arguments);kick()};
 kick();
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
