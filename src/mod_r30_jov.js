/* ===== mod_r30_jov: the Overlay tab on Journey maps, and the hover card on boxes.
   A hospital has about ten journeys and they share touchpoints: the bed board, coverage and authorization, medication reconciliation. A fix at a shared touchpoint reaches every journey that depends on it.
   Nothing here is stored. Every figure is computed from the boxes on the maps, and every box figure is a modeled sample value.
   Friction hours = hours a month x how badly the step feels (1 frustrated counts in full, 5 delighted counts for nothing). ===== */
(function(){
const W=window;if(!W.JYX||!JYX.api)return;
const api=()=>JYX.api;
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=n=>api().fmt(Math.round(n)),sum=(a,f)=>a.reduce((x,y)=>x+f(y),0);
const JOV=W.JOV={sel:null,fix:new Set(),pct:40,inited:false};
const fric=b=>b.min*b.vol/60*(5-b.em)/4;
const short=n=>{const x=String(n).replace(/^[A-Za-z ]+: /,"");return x.charAt(0).toUpperCase()+x.slice(1)};

function build(){const a=api(),X=JYX;const boxes=[];X.JY.list.forEach(j=>a.allBoxes(j).forEach(q=>boxes.push(q)));
 const anyKey=boxes.some(q=>q.b.key);const kOf=b=>b.key||(!anyKey&&b.sys&&b.sys!=="None"?"sys:"+b.sys:null);const map={};
 boxes.forEach(q=>{const k=kOf(q.b);if(!k)return;(map[k]=map[k]||{k,rows:[]}).rows.push(q)});
 const out={};
 Object.values(map).forEach(t=>{const js=[...new Set(t.rows.map(x=>x.j.id))];if(js.length<2)return;
  const tp=(X.TP&&X.TP[t.k])||{n:t.k.indexOf("sys:")===0?"Shared system: "+t.k.slice(4):t.k,kind:"System of record",d:"A system that several journeys depend on."};
  const R=t.rows.map(x=>({q:x,r:a.rec(x.b)}));const vol=sum(t.rows,x=>x.b.vol)||1;
  const best=t.rows.slice().sort((p,q)=>fric(q.b)-fric(p.b))[0];
  out[t.k]=Object.assign({k:t.k,n:tp.n,kind:tp.kind,d:tp.d,journeys:js.length,jids:js,rows:t.rows,
   hrs:sum(t.rows,x=>x.b.min*x.b.vol/60),shrs:sum(t.rows.filter(x=>x.b.who!=="Patient"),x=>x.b.min*x.b.vol/60),fh:sum(t.rows,x=>fric(x.b)),cost:sum(t.rows,x=>x.b.cost*x.b.vol),
   em:sum(t.rows,x=>x.b.em*x.b.vol)/vol,pains:t.rows.filter(x=>x.b.pain).length,noproc:t.rows.filter(x=>!x.b.procs.length).length,
   robot:R.filter(x=>x.r.k==="robot"&&x.r.st==="cand").length,agent:R.filter(x=>x.r.k==="agent"&&x.r.st==="cand").length,people:R.filter(x=>x.r.st==="none").length,running:R.filter(x=>x.r.st==="running").length,
   save:sum(R.filter(x=>!x.r.pt),x=>x.r.save),best:best,
   kpis:js.map(id=>(X.KPI&&X.KPI[id])||short((X.JY.list.find(j=>j.id===id)||{}).n||id))},{});
 });
 return {out,boxes};
}
JOV.index=()=>build().out;

function figures(B,T,pct){const p=pct/100,S=B.out[JOV.sel]||T[0];const fix=[...JOV.fix].map(k=>B.out[k]).filter(Boolean);
 const fb=new Set();fix.forEach(t=>t.rows.forEach(x=>fb.add(x)));const m=fix.length;
 const single=B.boxes.slice().sort((x,y)=>fric(y.b)-fric(x.b)).slice(0,Math.max(1,m));
 return {sel:S?{hrs:S.hrs*p,fh:S.fh*p,usd:S.shrs*p*api().REC_RATE}:{hrs:0,fh:0,usd:0},
  set:{n:m,boxes:fb.size,journeys:new Set([...fb].map(x=>x.j.id)).size,hrs:sum([...fb],x=>x.b.min*x.b.vol/60)*p,fh:sum([...fb],x=>fric(x.b))*p,usd:sum([...fb].filter(x=>x.b.who!=="Patient"),x=>x.b.min*x.b.vol/60)*p*api().REC_RATE},
  single:{hrs:sum(single,x=>x.b.min*x.b.vol/60)*p,fh:sum(single,x=>fric(x.b))*p,n:single.length,journeys:new Set(single.map(x=>x.j.id)).size}};
}
function paintFigures(){const root=document.querySelector(".jov");if(!root)return;const B=build(),T=Object.values(B.out);if(!T.length)return;const F=figures(B,T.sort((a,b)=>b.fh-a.fh),JOV.pct);
 const set=(k,v)=>root.querySelectorAll('[data-wi="'+k+'"]').forEach(n=>n.textContent=v);
 set("sel-hrs",fmt(F.sel.hrs));set("sel-fh",fmt(F.sel.fh));set("sel-usd","$"+fmt(F.sel.usd));set("pct",JOV.pct+"%");
 set("set-hrs",fmt(F.set.hrs));set("set-fh",fmt(F.set.fh));set("set-usd","$"+fmt(F.set.usd));set("one-fh",fmt(F.single.fh));
 const mx=Math.max(F.set.fh,F.single.fh,1);root.querySelectorAll('[data-wb]').forEach(n=>{n.style.width=Math.round((n.dataset.wb==="set"?F.set.fh:F.single.fh)/mx*100)+"%"})}

JOV.render=function(){const a=api(),X=JYX,B=build(),T=Object.values(B.out).sort((p,q)=>q.fh-p.fh);const jl=X.JY.list;
 if(!T.length)return `<p class="story" data-role="story">The overlay needs at least two journeys that share a touchpoint, such as the same system of record or the same handoff. This demo does not have that yet. The Healthcare scenario carries ten journeys with sixteen shared touchpoints.</p>`;
 if(!JOV.inited){T.slice(0,3).forEach(t=>JOV.fix.add(t.k));JOV.inited=true}
 [...JOV.fix].forEach(k=>{if(!B.out[k])JOV.fix.delete(k)});
 if(!JOV.sel||!B.out[JOV.sel])JOV.sel=T[0].k;const S=B.out[JOV.sel];
 const totF=sum(B.boxes,x=>fric(x.b)),shF=sum(T,t=>t.fh),shareP=Math.round(shF/Math.max(1,totF)*100);
 const loud=B.boxes.slice().sort((p,q)=>fric(q.b)-fric(p.b));const L1=loud[0];const L1k=L1.b.key&&B.out[L1.b.key]?B.out[L1.b.key]:null;
 const rankOf=t=>{const r=t.rows.slice().sort((p,q)=>fric(q.b)-fric(p.b))[0];return loud.findIndex(x=>x.b===r.b)+1};
 const hidden=T.slice(0,4).filter(t=>rankOf(t)>8);
 const top=T[0];const F=figures(B,T,JOV.pct);
 const maxF=T[0].fh;
 /* network */
 const rows=Math.max(jl.length,T.length),H=Math.max(380,rows*40+40),pad=26;const yJ=i=>pad+(H-2*pad)*(i+.5)/jl.length,yT=i=>pad+(H-2*pad)*(i+.5)/T.length;
 const jIdx={};jl.forEach((j,i)=>jIdx[j.id]=i);const edges=[];
 T.forEach((t,ti)=>t.jids.forEach(jid=>{const rr=t.rows.filter(x=>x.j.id===jid);const w=sum(rr,x=>fric(x.b)),em=sum(rr,x=>x.b.em)/rr.length;edges.push({t:t.k,j:jid,w,em,y1:yJ(jIdx[jid]),y2:yT(ti)})}));
 const maxW=Math.max(1,...edges.map(e=>e.w));
 const jEm=j=>{const L=a.allBoxes(j),v=sum(L,x=>x.b.vol)||1;return sum(L,x=>x.b.em*x.b.vol)/v};
 const net=`<svg class="jnet has-sel" viewBox="0 0 1000 ${H}" role="group" aria-label="Journeys on the left, shared touchpoints on the right, joined where a journey depends on the touchpoint">
  ${edges.map((e,i)=>`<path class="jed${e.t===JOV.sel?" is-sel":""}" data-t="${E(e.t)}" data-j="${E(e.j)}" d="M318 ${e.y1.toFixed(1)}C500 ${e.y1.toFixed(1)} 500 ${e.y2.toFixed(1)} 682 ${e.y2.toFixed(1)}" pathLength="1" style="stroke-width:${(1.6+8*Math.sqrt(e.w/maxW)).toFixed(1)};stroke:var(${a.EMC[Math.max(1,Math.min(5,Math.round(e.em)))]});animation-delay:${Math.min(900,i*18)}ms"><title>${E(short((jl.find(j=>j.id===e.j)||{}).n||e.j))} depends on ${E(B.out[e.t].n)}: ${fmt(e.w)} friction hours a month</title></path>`).join("")}
  ${jl.map((j,i)=>`<g class="jnn" data-jn="${E(j.id)}" data-pp2-act="jopen" data-a="${E(j.id)}" tabindex="0" role="button" aria-label="Open ${E(short(j.n))}"><circle cx="318" cy="${yJ(i).toFixed(1)}" r="8" fill="var(${a.EMC[Math.max(1,Math.min(5,Math.round(jEm(j))))]})" stroke="var(--bg)" stroke-width="2"/><text x="302" y="${(yJ(i)+4).toFixed(1)}" text-anchor="end">${E(short(j.n).length>40?short(j.n).slice(0,39)+"…":short(j.n))}</text><title>${E(j.n)}. Click to open the map.</title></g>`).join("")}
  ${T.map((t,i)=>`<g class="jnt${t.k===JOV.sel?" is-sel":""}" data-tn="${E(t.k)}" data-jov="sel" data-a="${E(t.k)}" tabindex="0" role="button" aria-label="${E(t.n)}, ${t.journeys} journeys"><circle cx="682" cy="${yT(i).toFixed(1)}" r="${(6+7*Math.sqrt(t.fh/maxF)).toFixed(1)}"/><text x="704" y="${(yT(i)+4).toFixed(1)}">${E(t.n.length>42?t.n.slice(0,41)+"…":t.n)}</text><title>${E(t.n)}: ${t.journeys} journeys, ${fmt(t.fh)} friction hours a month. Click to select.</title></g>`).join("")}
 </svg>`;
 const tile=(l,v,s,c)=>`<div class="jk${c?" t-"+c:""}"><span class="jk-l">${l}</span><b>${v}</b><small>${s}</small></div>`;
 /* ranked list */
 const list=T.map((t,i)=>{const hid=hidden.indexOf(t)>=0;return `<div class="jov-row${t.k===JOV.sel?" is-sel":""}" data-tn="${E(t.k)}" data-jov="sel" data-a="${E(t.k)}" tabindex="0" role="button" aria-pressed="${t.k===JOV.sel}"><span class="jov-rk">${i+1}</span><div class="jov-rb"><div class="row sp"><b>${E(t.n)}</b><span class="small muted">${t.journeys} journeys</span></div><div class="jov-bar"><i style="width:${Math.max(4,Math.round(t.fh/maxF*100))}%"></i></div><div class="jov-chips"><span class="small muted">${fmt(t.fh)} friction h a month</span>${hid?`<span class="jov-hid" title="No single box here looks urgent: the largest is number ${rankOf(t)} of ${loud.length} by friction. It only shows up when the journeys are laid on top of each other.">Hidden</span>`:""}${t.noproc?`<span class="jov-nop">${a.ICO.flag}${t.noproc} no process</span>`:""}${t.robot?`<span class="jmode m-robot m-cand">${a.ICO.robot}${t.robot}</span>`:""}${t.agent?`<span class="jmode m-agent m-cand">${a.ICO.agent}${t.agent}</span>`:""}</div></div><button class="jov-fix${JOV.fix.has(t.k)?" is-on":""}" data-jov="fix" data-a="${E(t.k)}" aria-pressed="${JOV.fix.has(t.k)}" title="${JOV.fix.has(t.k)?"Remove from the fix set":"Add to the fix set"}">${JOV.fix.has(t.k)?"In fix set":"Add"}</button></div>`}).join("");
 /* selected */
 const strip=j=>{const rr=S.rows.filter(x=>x.j.id===j.id);return `<div class="jov-wh"><div class="row sp"><b>${E(short(j.n))}</b><span class="small muted">${E((X.KPI&&X.KPI[j.id])||"")}</span></div><div class="jov-strip" style="--n:${j.stages.length}">${j.stages.map(s=>`<i class="${rr.some(x=>x.s===s)?"is-on":""}" title="${E(s.n)}"></i>`).join("")}</div>${rr.map(x=>`<button class="pp2-lnk jov-bx" data-pp2-act="jgo" data-a="${j.id}|${x.b.id}"><span class="jov-dot" style="background:var(${a.EMC[x.b.em]})"></span>${E(x.b.t)}<span class="small muted"> · ${E(x.s.n)} · ${fmt(x.b.min*x.b.vol/60)} h a month${x.b.procs.length?"":" · no process"}</span></button>`).join("")}</div>`};
 const detail=`<div class="jov-d"><div class="eyebrow">${E(S.kind)} · selected touchpoint</div><h3 class="jov-t">${E(S.n)}</h3><p class="jov-p">${E(S.d)}</p>
  <div class="jh-kpis jov-k">${tile("Journeys",S.journeys,"depend on it")}${tile("Friction hours",fmt(S.fh),"a month","warn")}${tile("Hours a month",fmt(S.hrs),"$"+fmt(S.shrs*a.REC_RATE)+" of staff time")}${tile("Experience",a.f1(S.em),"of 5, by volume")}${tile("No process",S.noproc,S.noproc?"red flags":"all linked",S.noproc?"bad":"good")}</div>
  <h4 class="jd-h">Metrics it moves</h4><div class="jov-m">${S.kpis.map(k=>`<span class="pill mute">${E(k)}</span>`).join("")}</div>
  <h4 class="jd-h">How to build it</h4><div class="jov-mix"><span class="jmode m-robot m-cand">${a.ICO.robot}${S.robot} robot candidates</span><span class="jmode m-agent m-cand">${a.ICO.agent}${S.agent} agent candidates</span><span class="jmode m-people">${a.ICO.people}${S.people} keep with people</span>${S.running?`<span class="small muted">${S.running} already automated</span>`:""}</div><p class="small muted">A robot where the steps repeat the same way, an agent where judgment is needed. About ${fmt(S.save)} staff hours a month freed if every candidate is built (modeled; patient time is not counted).</p>
  <h4 class="jd-h">If we remove <b data-wi="pct">${JOV.pct}%</b> of the effort here</h4><input type="range" min="10" max="80" step="5" value="${JOV.pct}" data-jov-pct aria-label="Share of the effort removed"><div class="jov-f"><div><b data-wi="sel-hrs">${fmt(F.sel.hrs)}</b><span>hours a month freed</span></div><div><b data-wi="sel-fh">${fmt(F.sel.fh)}</b><span>friction hours</span></div><div><b data-wi="sel-usd">$${fmt(F.sel.usd)}</b><span>a month of staff time at $${a.REC_RATE} an hour</span></div></div><p class="small muted">The percentage is your assumption, not a measurement.</p>
  <h4 class="jd-h">Where it shows up</h4><div class="jov-whs">${S.jids.map(id=>strip(jl.find(j=>j.id===id))).join("")}</div>
  <div class="row" style="margin-top:12px"><button class="btn primary" data-jov="demand" data-a="${E(S.k)}">Raise one shared demand</button><button class="btn" data-jov="fix" data-a="${E(S.k)}">${JOV.fix.has(S.k)?"Remove from fix set":"Add to fix set"}</button></div></div>`;
 /* fix set */
 const fixSet=`<div class="jov-set"><div class="row sp"><div><h3 class="jov-t">What if we fix these?</h3><p class="small muted">Pick touchpoints in the list. The comparison is against the same number of fixes (builds) spent on the loudest single boxes instead, at the same ${JOV.pct}% effort removed.</p></div><button class="btn quiet" data-jov="clear">Clear</button></div>
  <div class="jov-chipsel">${[...JOV.fix].map(k=>`<button class="jov-sc" data-jov="fix" data-a="${E(k)}">${E(B.out[k].n)} <i>×</i></button>`).join("")||'<span class="muted small">Nothing picked yet.</span>'}</div>
  <div class="jov-cmp"><div><div class="row sp"><span>Fix the ${F.set.n} shared touchpoints</span><b><span data-wi="set-fh">${fmt(F.set.fh)}</span> friction h</b></div><div class="jov-cb set"><i data-wb="set" style="width:${Math.round(F.set.fh/Math.max(F.set.fh,F.single.fh,1)*100)}%"></i></div><small>${F.set.boxes} boxes in ${F.set.journeys} journeys · <span data-wi="set-hrs">${fmt(F.set.hrs)}</span> hours a month · <span data-wi="set-usd">$${fmt(F.set.usd)}</span> a month of staff time</small></div>
  <div><div class="row sp"><span>Fix the ${F.single.n} loudest single box${F.single.n===1?"":"es"}, the same number of builds</span><b><span data-wi="one-fh">${fmt(F.single.fh)}</span> friction h</b></div><div class="jov-cb one"><i data-wb="one" style="width:${Math.round(F.single.fh/Math.max(F.set.fh,F.single.fh,1)*100)}%"></i></div><small>${F.single.n} boxes in ${F.single.journeys} journeys</small></div></div></div>`;
 const cmp=`<div class="jov-vs"><div class="jov-vs-a"><span class="jk-l">The loudest single box</span><b>${E(L1.b.t)}</b><small>${E(short(L1.j.n))} · ${fmt(fric(L1.b))} friction hours a month</small>${L1k?`<small>It is one of ${L1k.rows.length} boxes at <button class="pp2-lnk" data-jov="sel" data-a="${E(L1k.k)}">${E(L1k.n)}</button>.</small>`:`<small>It sits in one journey.</small>`}</div><div class="jov-vs-x" aria-hidden="true">vs</div><div class="jov-vs-b"><span class="jk-l">The top shared touchpoint</span><b>${E(top.n)}</b><small>${top.journeys} journeys · ${fmt(top.fh)} friction hours a month</small><small><b>${(top.fh/Math.max(1,fric(L1.b))).toFixed(1)}×</b> the loudest box.${hidden.length?` ${hidden.length} of the top four have no single urgent-looking box: ${hidden.map(t=>E(t.n)).join(", ")}.`:""}</small></div></div>`;
 return `<p class="story" data-role="story">${jl.length} journeys, ${T.length} shared touchpoints. <b>${shareP}%</b> of all friction hours sit at a touchpoint that more than one journey depends on, so a fix there reaches every one of them. Friction hours are hours a month weighted by how bad the step feels. All figures are modeled from the sample boxes.</p>
 <div class="jov">
 <div class="jh-kpis">${tile("Journeys",jl.length,"on the overlay")}${tile("Shared touchpoints",T.length,"in two or more journeys")}${tile("Friction at shared touchpoints",shareP+"%",fmt(shF)+" of "+fmt(totF)+" hours","warn")}${tile("Top touchpoint",top.journeys+" journeys",E(top.n))}${tile("No process at shared points",sum(T,t=>t.noproc),"red flags to fix first",sum(T,t=>t.noproc)?"bad":"good")}</div>
 ${cmp}
 <section class="card glass jov-netc"><div class="cardhead"><div><h3>How the journeys connect</h3><p class="muted small">Each line is a journey that depends on a touchpoint. A thicker line is more friction; red is a step that feels bad, green a step that feels good. Hover to trace, click a touchpoint to select it, click a journey to open its map.</p></div></div>${net}</section>
 <div class="jov-cols"><section class="card glass"><div class="cardhead"><div><h3>Touchpoints, by friction</h3><p class="muted small">Add the ones you would fix to the set.</p></div></div><div class="jov-list">${list}</div></section><section class="card glass">${detail}</section></div>
 <section class="card glass">${fixSet}</section></div>`};

/* ---- interaction ---- */
const refresh=()=>{try{api().paneRefresh()}catch(e){}};
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-jov]");if(!el)return;const k=el.dataset.jov,a=el.dataset.a;
 if(k==="sel"){JOV.sel=a;refresh()}
 else if(k==="fix"){e.stopPropagation();JOV.fix.has(a)?JOV.fix.delete(a):JOV.fix.add(a);refresh()}
 else if(k==="clear"){JOV.fix.clear();refresh()}
 else if(k==="demand"){const t=build().out[a];if(!t)return;
  if(typeof W.addDemand!=="function"||typeof W.openForm!=="function"){try{W.toast("Portfolio intake is not available in this build.","info")}catch(x){}return}
  const hrs=t.shrs*JOV.pct/100;W.openForm({id:"jov_dem",title:"Raise one shared demand",story:"One demand item that fixes "+t.n+" for every journey that depends on it, so the portfolio sees the whole case instead of "+t.rows.length+" small ones.",submit:"Raise demand",fields:[{k:"t",label:"Title",type:"text",req:true},{k:"why",label:"Reason",type:"longtext",wide:true,req:true},{k:"cost",label:"Build cost ($ thousand)",type:"number",min:1}],
   defaults:{t:"Fix "+t.n+" once for "+t.journeys+" journeys",why:"Modeled: "+t.rows.length+" boxes in "+t.journeys+" journeys, "+fmt(t.hrs)+" hours a month ("+fmt(t.shrs)+" of staff time), "+fmt(t.fh)+" friction hours. Removing "+JOV.pct+"% of the effort frees about "+fmt(hrs)+" hours a month, worth about $"+fmt(hrs*api().REC_RATE)+". Metrics moved: "+t.kpis.join(", ")+".",cost:Math.max(20,Math.round(hrs*api().REC_RATE*12/1000/2))},
   onSubmit:v=>{try{W.addDemand({title:v.t,reason:v.why,source:"Journey overlay",cost:+v.cost,kind:"automation"})}catch(x){}return {toast:"Demand raised in the portfolio"}}})}},true);
document.addEventListener("input",e=>{const r=e.target.closest&&e.target.closest("[data-jov-pct]");if(!r)return;JOV.pct=+r.value;paintFigures()});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const g=e.target.closest&&e.target.closest("[data-jov]");if(g&&e.target===g){e.preventDefault();g.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}))}});
/* trace a line: hover a touchpoint or a journey and everything it touches lights up */
function trace(kind,id){const svg=document.querySelector(".jnet");if(!svg)return;
 const ed=[...svg.querySelectorAll(".jed")];const hit=ed.filter(x=>kind==="t"?x.dataset.t===id:x.dataset.j===id);const js=new Set(hit.map(x=>x.dataset.j)),ts=new Set(hit.map(x=>x.dataset.t));
 svg.classList.remove("has-sel");svg.classList.add("tracing");ed.forEach(x=>x.classList.toggle("is-on",hit.indexOf(x)>=0));
 svg.querySelectorAll(".jnn").forEach(n=>n.classList.toggle("is-on",js.has(n.dataset.jn)));svg.querySelectorAll(".jnt").forEach(n=>n.classList.toggle("is-on",ts.has(n.dataset.tn)))}
function untrace(){const svg=document.querySelector(".jnet");if(!svg)return;svg.classList.remove("tracing");svg.classList.add("has-sel");svg.querySelectorAll(".is-on").forEach(n=>n.classList.remove("is-on"))}
document.addEventListener("mouseover",e=>{const t=e.target.closest&&e.target.closest("[data-tn]"),j=e.target.closest&&e.target.closest("[data-jn]");if(t)trace("t",t.dataset.tn);else if(j)trace("j",j.dataset.jn);else untrace()});

/* ---- hover card on boxes and curve points ---- */
let peek=null,cur=null;
const ensure=()=>{if(!peek){peek=document.createElement("div");peek.id="jpeek";peek.setAttribute("role","tooltip");document.body.appendChild(peek)}return peek};
function hide(){if(peek)peek.classList.remove("show");cur=null;document.querySelectorAll(".jb.hl,.jpt.hl").forEach(n=>n.classList.remove("hl"))}
function show(el){const a=api(),X=JYX;const [jid,bid]=(el.dataset.jb||"").split("|");const j=X.JY.list.find(x=>x.id===jid);const q=j&&a.allBoxes(j).find(x=>x.b.id===bid);if(!q)return;const b=q.b,r=a.rec(b),np=!b.procs.length;
 const IX=JOV.index(),sh=b.key&&IX[b.key]&&IX[b.key].journeys>1?IX[b.key]:null;
 const p=ensure();cur=el;
 p.innerHTML=`<div class="jpeek-k">${E(b.who)} · ${E(q.s.n)}</div><b class="jpeek-t">${E(b.t)}</b><div class="jpeek-g"><span><b>${b.min}</b> min each</span><span><b>${fmt(b.vol)}</b> a month</span><span><b>${fmt(b.min*b.vol/60)}</b> hours a month</span></div><div class="jpeek-e" style="--c:var(${a.EMC[b.em]})">${b.em} ${a.EML[b.em]}</div>${b.pain?`<p class="jpeek-bad"><span>Pain</span>${E(b.pain)}</p>`:""}${b.opp?`<p class="jpeek-good"><span>Opportunity</span>${E(b.opp)}</p>`:""}${np?`<div class="jpeek-flag">${a.ICO.flag}Red flag: nothing runs this step</div>`:""}<div class="jpeek-r${r.st==="cand"?" m-"+r.k:""}">${r.k==="people"?a.ICO.people:a.ICO[r.k]}<span>${E(a.recLabel(r))}${r.st==="cand"?", frees about "+fmt(r.save)+(r.pt?" patient":"")+" h a month":""}</span></div>${sh?`<div class="jpeek-sh">${a.ICO.link}<span>${E(sh.n)}: shared by ${sh.journeys} journeys</span></div>`:""}<small>Click to open</small>`;
 document.querySelectorAll('[data-jb="'+el.dataset.jb+'"]').forEach(n=>n.classList.add("hl"));
 p.classList.add("show");const rc=el.getBoundingClientRect(),pw=p.offsetWidth,ph=p.offsetHeight,vw=innerWidth,vh=innerHeight;
 let x=rc.right+12;if(x+pw>vw-12)x=Math.max(12,rc.left-pw-12);let y=rc.top+rc.height/2-ph/2;y=Math.max(12,Math.min(vh-ph-12,y));p.style.left=x+"px";p.style.top=y+"px"}
document.addEventListener("mouseover",e=>{const el=e.target.closest&&e.target.closest("[data-jb]");if(!el){if(cur)hide();return}if(el===cur)return;hide();show(el)});
document.addEventListener("focusin",e=>{const el=e.target.closest&&e.target.closest("[data-jb]");if(el&&el!==cur){hide();show(el)}});
document.addEventListener("focusout",e=>{if(e.target.closest&&e.target.closest("[data-jb]"))hide()});
document.addEventListener("scroll",hide,true);document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-pp2-act]"))hide()},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape")hide()});
})();
