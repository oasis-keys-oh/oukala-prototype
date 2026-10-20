/* ---------- events ---------- */
let dragged=false;
function refocus(sel){const el=document.querySelector(sel);if(el)try{el.focus({preventScroll:true})}catch(x){}}
const cssq=v=>String(v).replace(/"/g,'\\"');
document.addEventListener("click",e=>{
 if(dragged){dragged=false;if(e.target.closest("[data-plk-vp]")){e.stopPropagation();return}}
 let t;
 if((t=e.target.closest("[data-plk-n]"))){const vp=t.closest("[data-plk-vp]"),k=vp?vp.dataset.plkVp:"d",id=t.dataset.plkN;
  if(k==="g"){pickG(id);refocus(`[data-plk-ghost] [data-plk-n="${cssq(id)}"]`);return}
  if(Z.d.sel===id&&!/^dom:/.test(id)){Z.d.sel=null;if(Z.d.hop>0)Z.d.vb=null;drawD(false);return}
  Z.d.sel=id;Z.d.ff="";if(Z.d.hop>0&&!/^dom:/.test(id))Z.d.vb=null;drawD(false);refocus(`[data-plk-dhost] [data-plk-n="${cssq(id)}"]`);return}
 if((t=e.target.closest("[data-plk-pn]"))){const id=t.dataset.plkPn;if(Z.p.sel===id){Z.p.sel=null;if(Z.p.hop>0)Z.p.vb=null;drawP(false);return}Z.p.sel=id;if(Z.p.hop>0&&!/^fam:/.test(id))Z.p.vb=null;drawP(false);refocus(`[data-plk-phost] [data-plk-pn="${cssq(id)}"]`);return}
 if((t=e.target.closest("[data-plk-dtoggle]"))){const k=t.dataset.plkDtoggle;Z.d.col[k]=!Z.d.col[k];audit("Domain "+(Z.d.col[k]?"collapsed":"expanded"),DOM[k]?DOM[k].n:k);if(Z.d.sel&&/^dom:/.test(Z.d.sel)&&!Z.d.col[k])Z.d.sel=null;drawD(true);return}
 if((t=e.target.closest("[data-plk-ptoggle]"))){const k=t.dataset.plkPtoggle;Z.p.exp[k]=!Z.p.exp[k];if(Z.p.sel==="fam:"+k&&Z.p.exp[k])Z.p.sel=null;drawP(true);return}
 if((t=e.target.closest("[data-plk-ov]"))){Z.d.ov=t.dataset.plkOv;drawD(false);return}
 if((t=e.target.closest("[data-plk-tog]"))){const [g,p]=t.dataset.plkTog.split(":");
  if(g==="d"){Z.d[p]=!Z.d[p];drawD(p==="apps"||p==="pl"||Z.d.hop>0);return}
  if(g==="p"){Z.p[p]=!Z.p[p];if(p==="hub"){render();return}drawP(false);return}
  if(g==="m"){Z.mx[p]=!Z.mx[p];render();return}}
 if((t=e.target.closest("[data-plk-hopset]"))){const n=+t.dataset.plkHopset;Z.d.hop=n;Z.d.vb=null;if(n>0&&!Z.d.sel){const m=model(),deg={};m.raw.forEach(x=>m.key(x).forEach(i=>deg[i]=(deg[i]||0)+1));Z.d.sel=m.es.map(x=>x.id).sort((a,b)=>(deg[b]||0)-(deg[a]||0))[0]}audit("Focus set",n?n+" hops":"whole model");drawD(true);return}
 if((t=e.target.closest("[data-plk-hop]"))){Z.d.hop=+t.dataset.plkHop;Z.d.vb=null;drawD(true);return}
 if((t=e.target.closest("[data-plk-phopset]"))){const n=+t.dataset.plkPhopset;Z.p.hop=n;Z.p.vb=null;if(n>0&&(!Z.p.sel||/^fam:/.test(Z.p.sel))){const g=pgraph();Z.p.sel=g.ids.slice().sort((a,b)=>g.ho.filter(h=>h.from===b||h.to===b).length-g.ho.filter(h=>h.from===a||h.to===a).length)[0]}drawP(true);return}
 if((t=e.target.closest("[data-plk-phop]"))){Z.p.hop=+t.dataset.plkPhop;Z.p.vb=null;drawP(true);return}
 if((t=e.target.closest("[data-plk-colall]"))){const on=t.dataset.plkColall.split(":")[1]==="1";DORD.concat(["plan"]).forEach(k=>Z.d.col[k]=on);Z.d.sel=null;drawD(true);return}
 if((t=e.target.closest("[data-plk-pcol]"))){const on=t.dataset.plkPcol==="0";FAM.forEach(f=>Z.p.exp[f[0]]=on);drawP(true);return}
 if((t=e.target.closest("[data-plk-view]"))){Z.d.view=t.dataset.plkView;drawD(false);return}
 if((t=e.target.closest("[data-plk-pview]"))){Z.p.view=t.dataset.plkPview;drawP(false);return}
 if((t=e.target.closest("[data-plk-zoom]"))){const [k,a]=t.dataset.plkZoom.split(":");zoomVp(k,a==="in"?1.35:a==="out"?1/1.35:"fit");return}
 if((t=e.target.closest("[data-plk-go]"))){closeDrawer&&0;go(t.dataset.plkGo);return}
 if((t=e.target.closest("[data-plk-pgo]"))){Z.p.sel=t.dataset.plkPgo;S.v.plk_p=0;go("plat_pmap");return}
 if((t=e.target.closest("[data-plk-entgo]"))){closeDrawer();Z.d.sel=t.dataset.plkEntgo;Z.d.ff="";S.v.plk_d=0;if(Z.d.hop>0)Z.d.vb=null;if(document.querySelector("[data-plk-dhost]")){render()}else go("plat_dmap");return}
 if((t=e.target.closest("[data-plk-appgo]"))){const id=t.dataset.plkAppgo;Z.d.sel=t.dataset.ent?id:nidA(id);if(Z.d.hop>0)Z.d.vb=null;S.v.plk_d=0;render();return}
 if((t=e.target.closest("[data-plk-trace]"))){closeDrawer();Z.lin={ent:t.dataset.plkTrace,f:null};S.v.plk_d=1;if(document.querySelector("[data-plk-linhost]"))render();else go("plat_dmap");audit("Field lineage opened",t.dataset.plkTrace);return}
 if((t=e.target.closest("[data-plk-cell]"))){const [en,ap]=t.dataset.plkCell.split("|");cellDrawer(en,ap);return}
 if((t=e.target.closest("[data-plk-pair]"))){const [k,a,b]=t.dataset.plkPair.split(":");pairDrawer(k,a,b);return}
 if((t=e.target.closest("[data-plk-step]"))){Z.p.pstep=t.dataset.plkStep;document.querySelectorAll("[data-plk-step]").forEach(b=>b.classList.toggle("on",b.dataset.plkStep===Z.p.pstep));const h=document.querySelector("[data-plk-blast]");if(h)h.innerHTML=blastCard();audit("Blast radius viewed",t.dataset.plkStep);return}
 if((t=e.target.closest("[data-plk-mxlev]"))){Z.p.mx=t.dataset.plkMxlev;render();return}
});
document.addEventListener("input",e=>{
 const t=e.target.closest("[data-plk-q]");if(!t)return;const k=t.dataset.plkQ;
 if(k==="d"){Z.d.q=t.value;drawD(false)}else{Z.p.q=t.value;drawP(false)}
});
document.addEventListener("change",e=>{
 let t;
 if((t=e.target.closest("[data-plk-ff]"))){Z.d.ff=t.value;const p=document.querySelector("[data-plk-dhost] [data-plk-panel]");if(p)p.innerHTML=panelD();return}
 if((t=e.target.closest("[data-plk-lin]"))){if(t.dataset.plkLin==="ent"){Z.lin={ent:t.value,f:null}}else Z.lin.f=t.value;const h=document.querySelector("[data-plk-linhost]");if(h)h.innerHTML=linHTML();return}
});
/* keyboard: activate nodes, pan and zoom the focused canvas */
document.addEventListener("keydown",e=>{
 const nd=e.target.closest&&e.target.closest("[data-plk-n],[data-plk-pn],[data-plk-dtoggle],[data-plk-ptoggle]");
 if(nd&&(e.key==="Enter"||e.key===" ")){e.preventDefault();nd.dispatchEvent(new MouseEvent("click",{bubbles:true}));return}
 const vp=e.target.closest&&e.target.closest("[data-plk-vp]");if(!vp)return;const k=vp.dataset.plkVp;
 const cur=vp.getAttribute("viewBox").split(" ").map(Number),st=cur[2]*.12;
 const map={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]};
 if(map[e.key]){e.preventDefault();panVp(k,map[e.key][0],map[e.key][1]);return}
 if(e.key==="+"||e.key==="="){e.preventDefault();zoomVp(k,1.35)}else if(e.key==="-"){e.preventDefault();zoomVp(k,1/1.35)}else if(e.key==="0"){zoomVp(k,"fit")}
 else if(e.key==="Escape"){if(k==="d"&&Z.d.sel){Z.d.sel=null;Z.d.vb=null;drawD(false)}else if(k==="p"&&Z.p.sel){Z.p.sel=null;drawP(false)}else if(k==="g"&&Z.g.sel){Z.g.sel=null;drawG()}}
});
/* pointer pan, ctrl+wheel zoom */
let drag=null;
document.addEventListener("pointerdown",e=>{
 const vp=e.target.closest&&e.target.closest("[data-plk-vp]");if(!vp||e.button!==0)return;
 const r=vp.getBoundingClientRect(),cur=vp.getAttribute("viewBox").split(" ").map(Number);
 drag={vp,x:e.clientX,y:e.clientY,cur,sc:Math.max(cur[2]/r.width,cur[3]/r.height),moved:false};
});
document.addEventListener("pointermove",e=>{
 if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;drag.vp.classList.add("panning");
 const nv=[drag.cur[0]-dx*drag.sc,drag.cur[1]-dy*drag.sc,drag.cur[2],drag.cur[3]];
 stateOf(drag.vp.dataset.plkVp).vb=nv;drag.vp.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "));
});
document.addEventListener("pointerup",()=>{if(drag){drag.vp.classList.remove("panning");if(drag.moved)dragged=true;setTimeout(()=>{dragged=false},60);drag=null}});
document.addEventListener("wheel",e=>{
 const vp=e.target.closest&&e.target.closest("[data-plk-vp]");if(!vp||!(e.ctrlKey||e.metaKey))return;e.preventDefault();
 const k=vp.dataset.plkVp,r=vp.getBoundingClientRect(),cur=vp.getAttribute("viewBox").split(" ").map(Number);
 const f=e.deltaY<0?1.18:1/1.18,sc=Math.max(cur[2]/r.width,cur[3]/r.height);
 const px=cur[0]+(e.clientX-r.left-(r.width-cur[2]/sc)/2)*sc,py=cur[1]+(e.clientY-r.top-(r.height-cur[3]/sc)/2)*sc;
 const w=cur[2]/f,h=cur[3]/f,fit=vp.dataset.fit.split(" ").map(Number);if(w>fit[2]*2.5||w<fit[2]/12)return;
 const nv=[px-(px-cur[0])/f,py-(py-cur[1])/f,w,h];stateOf(k).vb=nv;vp.setAttribute("viewBox",nv.map(v=>+v.toFixed(1)).join(" "));
},{passive:false});
/* ---------- search and chat ---------- */
SEARCHX.push(()=>{const m=model();return m.es.map(en=>({g:"Data connections",t:en.label+" ("+en.id+")",m:en.writers.length+" writers, "+en.readers.length+" readers",c:"--p4",f:()=>{Z.d.sel=en.id;Z.d.ff="";S.v.plk_d=0;go("plat_dmap")},k:en.id+" entity connections graph "+en.fields.map(f=>f.k).join(" ")}))
 .concat(pgraph().ids.map(p=>({g:"Process connections",t:pName(p),m:FAM[FIDX[pFam(p)]][1],c:"--p5",f:()=>{Z.p.sel=p;S.v.plk_p=0;go("plat_pmap")},k:p+" process handoff "+(PROC.defs[p]?PROC.defs[p].title:"")})))});
const ALIAS={change:"change_request",changes:"change_request",ci:"cmdb_ci",cis:"cmdb_ci",service:"business_service",services:"business_service",people:"person",user:"person",users:"person",problem:"problem_record",problems:"problem_record",request:"request_item",requests:"request_item",incidents:"incident",invoices:"invoice",projects:"project",alert:"alert_event",alerts:"alert_event",story:"user_story",sla:"sla_definition",slas:"sla_definition",contracts:"contract",tasks:"project_task",task:"project_task",assets:"asset",skills:"skill_claim"};
function mentionedEnts(q){
 const t=" "+q.toLowerCase().replace(/[^a-z0-9_ ]/g," ")+" ",m=model(),out=[];
 m.es.forEach(e=>{const l=" "+e.label.toLowerCase()+" ",i=" "+e.id.replace(/_/g," ")+" ";let p=t.indexOf(l);if(p<0)p=t.indexOf(i);if(p<0)p=t.indexOf(" "+e.id+" ");if(p>=0)out.push({id:e.id,p,len:e.label.length})});
 Object.keys(ALIAS).forEach(a=>{const p=t.indexOf(" "+a+" ");if(p>=0&&!out.some(o=>o.id===ALIAS[a]))out.push({id:ALIAS[a],p,len:a.length})});
 return out.sort((a,b)=>a.p-b.p).map(o=>o.id).filter((x,i,arr)=>arr.indexOf(x)===i);
}
function shortestPath(a,b){
 const m=model(),prev=new Map([[a,null]]);let fr=[a];
 while(fr.length&&!prev.has(b)){const nx=[];fr.forEach(u=>(m.adj.get(u)||[]).forEach(({id,e})=>{if(!prev.has(id)&&!/^g:/.test(id)){prev.set(id,{from:u,e});nx.push(id)}}));fr=nx}
 if(!prev.has(b))return null;const path=[];let c=b;while(c!==a){const p=prev.get(c);path.unshift({to:c,from:p.from,e:p.e});c=p.from}return path;
}
ASKX.push(q=>{
 const t=q.toLowerCase();
 let mm=t.match(/how (?:is|are) (.+?) (?:connected|linked|related) to (.+?)[?.]*$/);
 if(mm){const a=mentionedEnts(mm[1])[0],b=mentionedEnts(mm[2])[0];
  if(a&&b){const p=shortestPath(a,b);Z.d.sel=a;Z.d.hop=0;Z.d.vb=null;S.v.plk_d=0;go("plat_dmap");
   const txt=p?entN(a)+" connects to "+entN(b)+" in "+p.length+(p.length===1?" step: ":" steps: ")+[entN(a)].concat(p.map(s=>{const lab=/^app:/.test(s.to)?appN(s.to.slice(4)):entN(s.to);return(s.e.type==="ref"?"points to ":s.e.type==="write"?"is written by ":"is read by ")+lab})).join(", ")+".":"No path was found between "+entN(a)+" and "+entN(b)+".";
   say(q,{t:txt,steps:["Opened Data connections","Selected "+entN(a)]});return true}}
 mm=t.match(/what (?:reads|uses|touches|writes|writes to) (.+?)[?.]*$/);
 if(mm){const a=mentionedEnts(mm[1])[0];if(a){const e=PLAT.ent(a);Z.d.sel=a;Z.d.vb=null;S.v.plk_d=0;go("plat_dmap");
  say(q,{t:e.label+" is read by "+(e.readers.map(appN).join(", ")||"no app")+" and written by "+(e.writers.map(appN).join(", ")||"no app")+".",steps:["Opened Data connections","Selected "+e.label]});return true}}
 mm=t.match(/(?:which|what) processes (?:depend on|use|touch|read|write) (.+?)[?.]*$/);
 if(mm){const a=mentionedEnts(mm[1])[0];if(a){const ps=procsTouching(a);Z.d.sel=a;S.v.plk_d=0;go("plat_dmap");
  say(q,{t:ps.length?plural(ps.length,"process","processes")+" touch "+entN(a)+": "+ps.slice(0,10).map(pName).join(", ")+(ps.length>10?" and "+(ps.length-10)+" more":"")+".":"No process touches "+entN(a)+" yet.",steps:["Opened Data connections"]});return true}}
 if(/process(es)? (map|connection|handoff|depend)|how are (the )?processes (connected|related)|handoffs?/.test(t)){const g=pgraph();go("plat_pmap");say(q,{t:g.ids.length+" processes are joined by "+g.ho.length+" documented handoffs and "+g.dep.length+" shared-data dependencies. Select any process to see what it hands over and what breaks if it stops.",steps:["Opened Process connections"]});return true}
 if(/data (connections|map|graph)|entity (map|graph|relationship)|how .*data.*connected/.test(t)){go("plat_dmap");say(q,{t:"Here is the data connection graph. Select an entity to light its links.",steps:["Opened Data connections"]});return true}
 return false;
});
