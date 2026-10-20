/* ===== mod_r31_jzx: Process map, experience bars (replace the dial), and the Build list (one card per agent or robot to create).
   All figures are modeled sample values: a robot frees 80% and an agent 60% of the hours, 140 hours is one FTE a month. Nothing here is live. ===== */
(function(){
const W=window,X=W.JYX,R=W.JXR;if(!X||!X.api||!R||!R.av)return;
const A=()=>X.api,E=R.E,fmt=n=>A().fmt(Math.round(n)),f1=n=>A().f1(n);
const FTE_H=A().FTE_H||140,q=s=>encodeURIComponent(s);
const hrsOf=b=>b.min*b.vol/60;
const brief=h=>`<div class="jx-brief" data-role="story">${h}</div>`;
const tile=(l,v,s,c)=>`<div class="jk${c?" t-"+c:""}"><span class="jk-l">${l}</span><b>${v}</b><small>${s||""}</small></div>`;
const EXT=new Set(["Patient","Payer","Vendor","Regulator","Member","Customer IT admin","Referring clinician"]);
const N=R.pmap={j:null};

/* ---------- 1. Process map: the processes of one journey laid out by stage, with the hand-offs between them ---------- */
function wrap(s,n){const w=String(s).split(" ");const L=[""];w.forEach(x=>{const c=L[L.length-1];if((c+" "+x).trim().length>n&&c)L.push(x);else L[L.length-1]=(c+" "+x).trim()});if(L.length>2){L.length=2;L[1]=L[1].slice(0,n-1)+"…"}return L}
function graph(j){const a=A(),L=a.allBoxes(j),si=new Map(j.stages.map((s,i)=>[s.id,i]));const nodes=new Map(),edges=new Map();let order=0;
 const node=(key,p,col,b)=>{let o=nodes.get(key);if(!o){o={key,p,col,ord:order++,boxes:[],gap:!p};nodes.set(key,o)}if(b)o.boxes.push(b);return o};
 const keysOf=(x,i)=>x.b.procs.length?x.b.procs.map(p=>{node(R.pkey(p),p,si.get(x.s.id),x.b);return R.pkey(p)}):(()=>{const k="gap|"+x.s.id;node(k,null,si.get(x.s.id),x.b);return [k]})();
 const ks=L.map(keysOf);
 for(let i=0;i<L.length-1;i++)ks[i].forEach(f=>ks[i+1].forEach(t=>{if(f===t)return;const k=f+">"+t;edges.set(k,{f,t,n:(edges.get(k)?edges.get(k).n:0)+1})}));
 const cols=j.stages.map(()=>[]);[...nodes.values()].sort((x,y)=>x.ord-y.ord).forEach(o=>{o.row=cols[o.col].length;cols[o.col].push(o)});
 return {nodes,edges:[...edges.values()],cols,L}}
/* the whole process, read only, in the process designer's own look (same data, same classes); a step opens the real designer */
R.flowPanel=function(key){const a=A(),me=R.pindex().get(key);if(!me)return "";const p=me.p,ref=p.ref;
 const id=p.src==="WFX"?"wfx:"+ref:p.src==="PROC"?"proc:"+ref:ref;let f=null,ed=null;
 try{f=W.FLOWX&&(FLOWX.get(id)||FLOWX.get(ref));ed=f&&FLOWX._ed()}catch(e){console.error("flowPanel",e)}
 const head=`<div class="jpm-fh"><div><div class="eyebrow">Whole process ${W.NUM?NUM.pchip(key):""}</div><h3>${E(a.wfN(p))}</h3></div><div class="row"><button class="btn primary" data-pp2-act="jopenwf" data-a="${E(ref)}">Open in the designer</button><button class="btn quiet" data-pp2-act="jprocx" data-a="${E(key)}">How it connects</button></div></div>`;
 if(!f||!ed||!f.nodes||!f.nodes.length)return `<section class="jpm-flow card glass">${head}<p class="small muted">This process has no steps defined in this demo yet.</p></section>`;
 const NW_=ed.NW,NH_=ed.NH,LH_=ed.LH,nY=ed.nodeY,T=ed.NTY||{};
 const Wd=Math.max(900,...f.nodes.map(n=>n.x+NW_+60)),Ht=Math.max(LH_*2,f.lanes.length*LH_+20),by={};f.nodes.forEach(n=>by[n.id]=n);
 const lanes=f.lanes.map((l,i)=>`<div class="wfd-lane${i%2?" alt":""}" style="top:${i*LH_}px;height:${LH_}px;width:${Wd}px"><div class="wfd-lanelab"><b>${E(l.n)}</b></div></div>`).join("");
 const edges=f.edges.map(e=>{const A_=by[e.f],B=by[e.t];if(!A_||!B)return "";const x1=A_.x+NW_,y1=nY(A_)+NH_/2,x2=B.x,y2=nY(B)+NH_/2;
  const d=x2<x1+30?`M${x1} ${y1}C${x1+50} ${y1} ${x1+50} ${Math.max(nY(A_),nY(B))+NH_+16} ${(x1+x2)/2} ${Math.max(nY(A_),nY(B))+NH_+16}S${x2-50} ${y2} ${x2} ${y2}`:`M${x1} ${y1}C${x1+Math.max(40,(x2-x1)/2)} ${y1} ${x2-Math.max(40,(x2-x1)/2)} ${y2} ${x2} ${y2}`;
  return `<path class="vis" d="${d}" marker-end="url(#jpfArr)" fill="none"/>`}).join("");
 const meta=n=>{const g=n.p||{},asg=g.asg||{},tg=g.tg||{};return [asg.person||asg.team||"",tg.sla?"SLA "+tg.sla:""].filter(Boolean).join(" · ")};
 const nodes=f.nodes.map(n=>{const t=T[n.t]||{l:n.t,c:"--muted"};
  return `<button type="button" class="wfd-node t-${n.t}" style="left:${n.x}px;top:${nY(n)}px;--nc:var(${t.c})" data-pp2-act="jflowstep" data-a="${E(f.id)}|${E(n.id)}" aria-label="${E(t.l)}: ${E(n.n)}. Open the designer on this step."><div class="wfd-nh"><span class="wfd-nt">${E(t.l)}</span>${W.NUM?NUM.schip(f,n):""}</div><div class="wfd-nn">${E(n.n)}</div><div class="wfd-nm">${E(meta(n))}</div></button>`}).join("");
 const real=f.nodes.filter(n=>!["trigger","end"].includes(n.t)).length;
 return `<section class="jpm-flow card glass" aria-label="Whole process: ${E(a.wfN(p))}">${head}<p class="small muted">${real} step${real===1?"":"s"}, drawn from the same definition the process designer opens. Select a step to open the designer on it.</p><div class="tscroll"><div class="wfd-world jpm-fw" style="width:${Wd}px;height:${Ht}px">${lanes}<svg class="wfd-edges" width="${Wd}" height="${Ht}" aria-hidden="true"><defs><marker id="jpfArr" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" class="wfd-arrow"/></marker></defs>${edges}</svg>${nodes}</div></div></section>`};
R.procMap=function(){const a=A(),Y=X.JY;const hasDetail=Y.list.some(x=>x.cat!=="End to end");
 const cur=N.j&&Y.list.find(x=>x.id===N.j)||a.curJ()||Y.list[0];N.j=cur.id;
 const G=graph(cur),CW=214,NW=176,NH=58,RH=76,X0=14,Y0=46;const maxRow=Math.max(1,...G.cols.map(c=>c.length));
 const Wd=X0*2+CW*cur.stages.length-(CW-NW),Ht=Y0+maxRow*RH+12;
 const pos=o=>({x:X0+o.col*CW,y:Y0+o.row*RH});
 const real=[...G.nodes.values()].filter(o=>!o.gap),gaps=[...G.nodes.values()].filter(o=>o.gap);
 const selKey=(real.find(o=>o.key===N.pm)||real[0]||{}).key;
 const shared=real.filter(o=>{const c=R.conn(o.key);return c.pe.size>0}).length;
 const gapSteps=gaps.reduce((s,o)=>s+o.boxes.length,0);
 const path=e=>{const A_=G.nodes.get(e.f),B=G.nodes.get(e.t),p=pos(A_),r=pos(B);
  if(A_.col===B.col){const xr=p.x+NW;if(r.y>p.y)return `M${p.x+NW/2} ${p.y+NH}L${r.x+NW/2} ${r.y}`;return `M${xr} ${p.y+NH/2}C${xr+44} ${p.y+NH/2} ${xr+44} ${r.y+NH/2} ${xr} ${r.y+NH/2}`}
  const fwd=B.col>A_.col,x1=fwd?p.x+NW:p.x,x2=fwd?r.x:r.x+NW,y1=p.y+NH/2,y2=r.y+NH/2,dx=Math.max(30,Math.abs(x2-x1)*.5)*(fwd?1:-1);
  return `M${x1} ${y1}C${x1+dx} ${y1} ${x2-dx} ${y2} ${x2} ${y2}`};
 const svg=`<svg class="jpm-svg" viewBox="0 0 ${Wd} ${Ht}" width="${Wd}" height="${Ht}" role="group" aria-label="Processes of ${E(cur.n)} and the hand-offs between them"><defs><marker id="jpmA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L9 5L0 9z" class="jpm-ah"/></marker></defs>
 ${cur.stages.map((s,i)=>`<g><text x="${X0+i*CW}" y="22" class="jpm-st">${E(s.n)}</text><line x1="${X0+i*CW}" y1="30" x2="${X0+i*CW+NW}" y2="30" class="jpm-sl"/></g>`).join("")}
 ${G.edges.map(e=>`<path d="${path(e)}" class="jpm-e${G.nodes.get(e.f).gap||G.nodes.get(e.t).gap?" is-gap":""}" style="stroke-width:${Math.min(3.4,1.2+e.n*.5)}" marker-end="url(#jpmA)"><title>${E(G.nodes.get(e.f).gap?"A step with no process":a.wfN(G.nodes.get(e.f).p))} hands off to ${E(G.nodes.get(e.t).gap?"a step with no process":a.wfN(G.nodes.get(e.t).p))} (${e.n} time${e.n===1?"":"s"})</title></path>`).join("")}
 ${[...G.nodes.values()].map(o=>{const p=pos(o);if(o.gap)return `<g class="jpm-n is-gap" transform="translate(${p.x} ${p.y})"><rect width="${NW}" height="${NH}" rx="12"/><text x="14" y="25" class="jpm-t">No process yet</text><text x="14" y="43" class="jpm-s">${o.boxes.length} step${o.boxes.length===1?"":"s"} nobody is accountable for</text></g>`;
  const lvl=a.procAuto(o.p),l=wrap(a.wfN(o.p),24),c=R.conn(o.key),nc=c.pe.size;
  return `<g class="jpm-n lv${Math.min(2,lvl)}${o.key===selKey?" is-sel":""}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" data-pp2-act="jpmsel" data-a="${E(o.key)}" aria-label="${E(a.wfN(o.p))}. Show the whole process"><title>${E(a.wfN(o.p))}: ${o.boxes.length} step${o.boxes.length===1?"":"s"} here, ${a.AUTOL[lvl][0]}. Select to see the whole process below.</title><rect width="${NW}" height="${NH}" rx="12"/><text x="14" y="${l.length>1?22:30}" class="jpm-t">${E(l[0])}</text>${l[1]?`<text x="14" y="37" class="jpm-t">${E(l[1])}</text>`:""}<text x="14" y="${NH-8}" class="jpm-s">${W.NUM?E(NUM.proc(o.key))+" · ":""}${o.boxes.length} step${o.boxes.length===1?"":"s"} · ${E(a.AUTOL[lvl][0])}</text>${nc?`<g transform="translate(${NW-34} 7)"><rect width="28" height="16" rx="8" class="jpm-b"/><text x="14" y="12" text-anchor="middle" class="jpm-bt">↔${nc}</text></g>`:""}</g>`}).join("")}</svg>`;
 const chips=Y.list.map(x=>`<button class="jmc${x.id===cur.id?" is-on":""}" data-pp2-act="jpmj" data-a="${x.id}" aria-pressed="${x.id===cur.id}">${E(R.jshort(x))}</button>`).join("");
 return `${brief(`<b>${E(R.jshort(cur))}</b>: <b>${real.length} processes</b> carry ${G.L.length} steps across ${cur.stages.length} stages, with <b>${G.edges.filter(e=>!G.nodes.get(e.f).gap&&!G.nodes.get(e.t).gap).length} hand-offs</b> between them. <b>${shared}</b> share a touchpoint with another journey, so a change there is felt in both. <b>${gapSteps}</b> step${gapSteps===1?"":"s"} ha${gapSteps===1?"s":"ve"} no process, shown in red.`)}
 <div class="jh-kpis">${tile("Processes",real.length,"behind this journey")}${tile("Hand-offs",G.edges.filter(e=>!G.nodes.get(e.f).gap&&!G.nodes.get(e.t).gap).length,"one process to the next")}${tile("Shared",shared,"touch another journey","info")}${tile("No process",gapSteps,"steps nobody owns",gapSteps?"bad":"good")}</div>
 <div class="jmood jo-ctl" role="group" aria-label="Journey">${chips}</div>
 <section class="jpm-wrap" aria-label="Process map"><div class="tscroll"><div class="jpm-in" style="min-width:${Wd}px">${svg}</div></div></section>
 ${selKey?R.flowPanel(selKey):""}
 <div class="jfl jo-leg"><span><i class="jpm-sw lv0"></i> Manual today</span><span><i class="jpm-sw lv1"></i> Partly automated</span><span><i class="jpm-sw lv2"></i> Automated</span><span><i class="jpm-sw gap"></i> No process</span><span><b>↔</b> Shares a touchpoint with another journey</span></div>
 <p class="muted small jhint">Read left to right: each box is a process, placed in the stage where it first does work. An arrow means the next step in the journey runs on the next process. Select a process to see all of its steps below, drawn the way the process designer draws them; select a step to open the designer on it. Generated processes are drafts from the map.</p>`};

/* ---------- 2. Experience bars: now, after fixes, where the drag is ---------- */
const ZC=["","#d9534f","#e8883a","#d8b53a","#7fb443","#2e9e5b"];
R.expBar=function(d){const pos=v=>((Math.max(1,Math.min(5,v))-1)/4*100).toFixed(1)+"%";const gain=d.after-d.now;
 const cnt=[0,0,0,0,0,0];d.L.forEach(x=>cnt[Math.max(1,Math.min(5,Math.round(x.b.em)))]+=x.b.vol);const mx=Math.max(1,...cnt);
 const drags=d.L.slice().sort((x,y)=>x.b.em-y.b.em||y.b.vol-x.b.vol).filter(x=>x.b.em<=2).slice(0,2);
 return `<div class="jeb" role="group" aria-label="Experience ${d.now.toFixed(1)} of 5 now, ${d.after.toFixed(1)} after the proposed fixes">
 <div class="jeb-h"><span class="jeb-v"><b>${d.now.toFixed(1)}</b><small>now</small></span>${gain>.04?`<span class="jeb-ar" aria-hidden="true">→</span><span class="jeb-v up"><b>${d.after.toFixed(1)}</b><small>after fixes</small></span><span class="jeb-g">+${gain.toFixed(1)}</span>`:`<span class="jeb-g flat">no lift modeled</span>`}</div>
 <div class="jeb-track"><i class="jeb-z" style="background:linear-gradient(90deg,${ZC[1]},${ZC[2]},${ZC[3]},${ZC[4]},${ZC[5]})"></i>${gain>.04?`<i class="jeb-gain" style="left:${pos(d.now)};width:calc(${pos(d.after)} - ${pos(d.now)})"></i><i class="jeb-aft" style="left:${pos(d.after)}"></i>`:""}<i class="jeb-now" style="left:${pos(d.now)}"></i></div>
 <div class="jeb-ends"><span>${faceSvg(1)} Frustrated</span><span>Delighted ${faceSvg(5)}</span></div>
 <div class="jeb-dist" role="img" aria-label="Steps by feeling, weighted by volume">${[1,2,3,4,5].map(i=>`<span title="${cnt[i]?Math.round(cnt[i]/(cnt.reduce((s,x)=>s+x,0)||1)*100):0}% of volume feels ${["","frustrated","annoyed","neutral","pleased","delighted"][i]}"><i style="height:${Math.max(3,Math.round(cnt[i]/mx*30))}px;background:${ZC[i]}"></i></span>`).join("")}<small>volume by feeling</small></div>
 ${drags.length?`<div class="jeb-drag"><span class="jk-l">Biggest drag</span>${drags.map(x=>`<button class="pp2-lnk" data-pp2-act="jbox" data-a="${x.j.id}|${x.b.id}"><span class="jtn">${E(R.tn(x.j,x.b))}</span> ${E(x.b.t)}</button>`).join("")}</div>`:""}</div>`};
function faceSvg(em){return `<svg class="jfsv" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="--c:${ZC[em]}">${R.face(em,12,12,10.5)}</svg>`}

/* ---------- 3. Build list: one card per agent or robot to create ---------- */
const O={flt:"all",wave:0,all:false,sel:null};R.build=O;
const lim=(k,risk)=>k==="robot"?{tier:"Rule: no model",floor:"Not applicable",ask:"Fails closed and alerts the owner",kill:"Owner team switch"}:
 risk>=4?{tier:"Tier 3: a person approves each action",floor:"0.85",ask:"Asks a person before it acts",kill:"Named owner and a different backup"}:
 {tier:"Tier 2: acts, then reports",floor:"0.75",ask:"Asks below the confidence floor",kill:"Named owner and a different backup"};
function builds(){const a=A(),Y=X.JY,map=new Map();
 Y.list.forEach(j=>{if(!R.inScope(j))return; /* JM-04: same scope and same rule as the org chart */
  a.allBoxes(j).forEach(({b,s})=>{const r=a.rec(b);if(r.st!=="cand"||(r.k!=="agent"&&r.k!=="robot"))return;
   const grp=R.buildGroup(j,s,b),key=R.buildKey(j,s,b,r);
   let o=map.get(key);if(!o){o={key,k:r.k,grp,rows:[]};map.set(key,o)}o.rows.push({j,s,b,r,hrs:hrsOf(b)})})});
 const out=[...map.values()].map(o=>{const f=o.rows[0],b=f.b,p=b.procs[0];
  const title=p?a.wfN(p):(b.key&&X.TP&&X.TP[b.key]?X.TP[b.key].n:f.j.cat==="End to end"?f.s.n:R.jshort(f.j)+": "+f.s.n);
  const hrs=o.rows.reduce((s,x)=>s+x.hrs,0),freed=o.rows.reduce((s,x)=>s+x.r.save,0),risk=Math.max(...o.rows.map(x=>x.b.risk||1));
  const roles=[...new Set(o.rows.map(x=>x.b.who))],teams=[...new Set(o.rows.map(x=>x.b.owner).filter(Boolean))],sys=[...new Set(o.rows.map(x=>x.b.sys).filter(Boolean))];
  const ext=roles.every(x=>EXT.has(x)),pain=o.rows.filter(x=>x.b.pain&&x.b.em<=2).length;
  return Object.assign(o,{name:R.dwName(b,o.k),title,hrs,freed,capped:o.rows.some(x=>x.r.capped),risk,roles,teams,sys,ext,pain,hasProc:!!p,lim:lim(o.k,risk),js:[...new Set(o.rows.map(x=>R.jshort(x.j)))]})});
 out.sort((x,y)=>y.freed-x.freed);const n=out.length;
 out.forEach((o,i)=>{o.wave=(o.risk<=3&&o.hasProc&&i<Math.ceil(n*.3))?1:(o.risk>=5||!o.hasProc||i>=Math.ceil(n*.7))?3:2;o.id="b"+i});
 return out}
R.builds=builds;R.bdec=R.bdec||{};
const wl={1:"Wave 1",2:"Wave 2",3:"Wave 3"};
function bcard(o){const a=A();
 return `<article class="jb-card k-${o.k}"><button class="jb-open" data-pp2-act="jbld" data-a="${o.id}" aria-label="Open the build summary for ${E(o.title)}"><span class="jb-top">${R.av(o.k,o.name,44)}<span class="jb-t"><b>${W.NUM?NUM.bchip(o.key)+" ":""}${E(o.title)}</b><small>${o.k==="agent"?"Agent":"Robot"} ${E(o.name.split(" ")[1])} · ${o.rows.length} step${o.rows.length===1?"":"s"} · ${E(o.js.slice(0,2).join(", "))}${o.js.length>2?" +"+(o.js.length-2):""}</small></span><span class="jb-wv w${o.wave}" title="Build order, a hypothesis: easy and valuable first">${wl[o.wave]}</span></span>${R.bdec[o.id]==="plan"?`<span class="jb-pl">In the build plan</span>`:R.bdec[o.id]==="defer"?`<span class="jb-pl d">Deferred</span>`:""}
  <span class="jb-m"><span><b>${fmt(o.hrs)}</b>h a month covered</span><span><b>${o.ext?fmt(o.freed):(o.freed/FTE_H).toFixed(1)}</b>${o.ext?"h back to them":"FTE released"}${o.capped?`<em class="jb-cap" title="${E(R.capNote())}">capped</em>`:""}</span><span><b>${o.risk}</b>risk of 5</span></span>
  <span class="jb-r small muted">${o.roles.slice(0,3).map(E).join(", ")}${o.roles.length>3?" +"+(o.roles.length-3):""} · owner ${E(o.teams[0]||"to assign")}</span>
  <span class="jb-chk"><i class="${o.hasProc?"ok":"no"}"></i>${o.hasProc?"Process exists":"Needs a process first"}${o.sys.length?` · <i class="ok"></i>${E(o.sys.slice(0,2).join(", "))}`:""}</span></button></article>`}

/* ---------- cross-reference export: journey step -> process step -> build ---------- */
const csvq=v=>{v=v==null?"":String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const csvOut=(name,head,rows)=>{const txt=[head].concat(rows).map(r=>r.map(csvq).join(",")).join("\n");try{const b=new Blob(["\ufeff"+txt],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(b),a_=document.createElement("a");a_.href=u;a_.download=name;document.body.appendChild(a_);a_.click();setTimeout(()=>{a_.remove();URL.revokeObjectURL(u)},500)}catch(e){console.error(e)}};
R.xrefJourney=function(){const a=A(),B=builds(),bm=new Map();B.forEach(o=>o.rows.forEach(r=>bm.set(r.b,o)));const ten=W.TENANT?TENANT.name():"";const rows=[];
 X.JY.list.forEach(j=>a.allBoxes(j).forEach(({b,s})=>{const p=b.procs[0],key=p?p.src+"|"+p.ref:"",bo=bm.get(b);let sn="";try{if(p&&p.step&&p.src==="WFX"){const w=WFX.get(p.ref),st=w&&w.steps.find(x=>x.id===p.step);sn=st?st.n:""}}catch(e){}
  rows.push([ten,j.id,j.n,s.n,R.tn(j,b),b.t,b.who,b.owner||"",p?NUM.proc(key):"",p?a.wfN(p):"",p&&p.step?NUM.stepById(key,p.step):"",sn,bo?NUM.build(bo.key):"",bo?bo.k:"",bo?bo.title:"",bo?"Wave "+bo.wave+" (hypothesis)":""])}));
 csvOut("journey-to-process-to-build.csv",["Tenant","Journey ID","Journey","Stage","Journey step","Step","Role","Owner team","Process no.","Process","Process step no.","Process step","Build no.","Build kind","Build","Build wave"],rows)};
R.xrefSteps=function(){const a=A(),M=R.pindex(),ten=W.TENANT?TENANT.name():"";const rows=[];
 [...M.values()].forEach(o=>{const p=o.p,key=p.src+"|"+p.ref;let f=null;try{f=FLOWX.get(NUM.flowId(key))}catch(e){}
  if(!f){rows.push([ten,NUM.proc(key),a.wfN(p),"","","","","No definition in this demo"]);return}
  f.nodes.filter(n=>n.t!=="trigger"&&n.t!=="end").forEach(n=>{rows.push([ten,NUM.proc(key),a.wfN(p),NUM.step(f,n),n.n,n.t,(n.p&&n.p.asg&&(n.p.asg.person||n.p.asg.team))||"",n.g?"Child step in a sub-flow":""])})});
 csvOut("process-steps.csv",["Tenant","Process no.","Process","Step no.","Step","Type","Owner","Note"],rows)};
R.xrefBar=()=>`<div class="row jx-xref" role="group" aria-label="Export"><span class="small muted">Numbers: P-014 process, P-014.3 step, P-014.3.1 child step, B-012 build. Type one in search to open it.</span><button class="btn quiet" data-pp2-act="jxref" data-a="journey">Export journey to process to build (CSV)</button><button class="btn quiet" data-pp2-act="jxref" data-a="steps">Export process steps (CSV)</button></div>`;
R.buildTab=function(){const a=A(),B=builds();const ag=B.filter(x=>x.k==="agent"),rb=B.filter(x=>x.k==="robot"),steps=B.reduce((s,x)=>s+x.rows.length,0);
 const st=B.filter(x=>!x.ext),fte=st.reduce((s,x)=>s+x.freed,0)/FTE_H,ext=B.filter(x=>x.ext).reduce((s,x)=>s+x.freed,0);
 const show=B.filter(x=>(O.flt==="all"||O.flt===x.k)&&(!O.wave||O.wave===x.wave));const lim_=O.all?show.length:24;
 const chip=(g,id,txt,num)=>`<button class="jmc${(g==="f"?O.flt===id:O.wave===id)?" is-on":""}" data-pp2-act="jbf" data-a="${g}|${id}" aria-pressed="${g==="f"?O.flt===id:O.wave===id}">${num!=null?`<b>${num}</b> `:""}${txt}</button>`;
 return `${brief(`<b>${B.length} things to build:</b> <span class="jx-bt g">${ag.length} agents</span> <span class="jx-bt r">${rb.length} robots</span>. ${steps} recommended steps become ${B.length} builds when steps that share a process are combined. Together they release about <b>${fte.toFixed(1)} FTE</b> of staff effort${ext>0?` and return about ${fmt(ext)} hours a month to people outside the organization`:""} (modeled).`)}
 <div class="jh-kpis">${tile("To build",B.length,"agents and robots")}${tile("Agents",ag.length,"reason inside a box","agent")}${tile("Robots",rb.length,"rules, no model cost","robot")}${tile("Wave 1",B.filter(x=>x.wave===1).length,"start here: easy and valuable","good")}${tile("Staff capacity",fte.toFixed(1)+" FTE","released if all built, modeled; at most "+A().REC_CAP_FTE+" FTE a step")}</div>
 <div class="jmood jo-ctl" role="group" aria-label="Filter builds">${chip("f","all","Everything")}${chip("f","agent","Agents",ag.length)}${chip("f","robot","Robots",rb.length)}<span class="jo-sp"></span>${chip("w",0,"Any wave")}${chip("w",1,"Wave 1",B.filter(x=>x.wave===1).length)}${chip("w",2,"Wave 2",B.filter(x=>x.wave===2).length)}${chip("w",3,"Wave 3",B.filter(x=>x.wave===3).length)}${R.hasDetail()?`<span class="jo-sp"></span><div class="vsw glass" role="group" aria-label="Journeys counted"><button class="${R.scopeNow()==="detail"?"on":""}" data-pp2-act="jorgs" data-a="detail" aria-pressed="${R.scopeNow()==="detail"}">Detailed journeys</button><button class="${R.scopeNow()==="all"?"on":""}" data-pp2-act="jorgs" data-a="all" aria-pressed="${R.scopeNow()==="all"}">All journeys</button></div>`:""}</div>
 ${(()=>{const pl=B.filter(x=>R.bdec[x.id]==="plan"),nx=pl.slice().sort((x,y)=>x.wave-y.wave||y.freed-x.freed)[0];const pf=pl.filter(x=>!x.ext).reduce((s,x)=>s+x.freed,0)/FTE_H;return `<div class="jb-plan" role="status"><b>Build plan</b> ${pl.length?`${pl.length} build${pl.length===1?"":"s"} · about ${pf.toFixed(1)} FTE released if all are built (modeled)${nx?` <button class="btn sm primary" data-pp2-act="jbvc" data-a="${nx.id}">Build the next one in VibeCheck</button>`:""}`:`<span class="muted">Empty. Open a card and choose Add to the build plan, or Build it in VibeCheck.</span>`}</div>`})()}
 ${R.xrefBar()}
 <div class="jb-grid">${show.slice(0,lim_).map(bcard).join("")||`<p class="muted">Nothing matches these filters.</p>`}</div>
 ${show.length>24?`<div class="row" style="margin-top:10px"><button class="btn quiet" data-pp2-act="jbmore" data-a="">${O.all?"Show the top 24":"Show all "+show.length}</button></div>`:""}
 <p class="muted small jhint">Counted by one rule shared with the org chart: recommended steps of the same kind that share a process are one build, and the same journeys are counted (${R.scopeNow()==="detail"&&R.hasDetail()?"detailed journeys; the end-to-end journey is left out so the same work is not counted twice":"all journeys"}). Waves are a hypothesis: Wave 1 is the most hours released among builds with a process behind them and risk of 3 or less; Wave 3 has risk 5, no process yet, or the least return. FTE is modeled: a robot frees 80% and an agent 60% of a step's hours, ${FTE_H} hours is one FTE a month, and ${E(R.capNote().replace(/^Each/,"each"))}; cards marked capped hit that limit. Limits shown are the proposed starting box (tier, confidence floor, kill switch), not a running configuration. Nothing here is built or live. Teammate names are placeholders.</p>`};
R.buildDrawer=function(id){const a=A(),o=builds().find(x=>x.id===id);if(!o)return;const L=o.lim;
 const rows=o.rows.slice().sort((x,y)=>y.hrs-x.hrs);const p=o.rows[0].b.procs[0];
 const kv=(k,v)=>`<div class="jb-kv"><span>${k}</span><b>${v}</b></div>`;
 openDrawer(`<div class="jd"><div class="eyebrow">${o.k==="agent"?"Agent":"Robot"} to create · ${wl[o.wave]} ${W.NUM?NUM.bchip(o.key):""}</div><h2 class="jd-t">${E(o.title)}</h2>
 <div class="jd-crew">${R.av(o.k,o.name,44)}<span class="small muted">Placeholder name: ${E(o.name)}. Proposed, not built.</span></div>
 <div class="jd-tiles">${tile("Steps",o.rows.length,"it would take over")}${tile("Hours a month",fmt(o.hrs),"covered today")}${tile(o.ext?"Hours back":"Released",o.ext?fmt(o.freed):(o.freed/FTE_H).toFixed(1)+" FTE",(o.k==="robot"?"80% freed, modeled":"60% freed, modeled")+(o.capped?"; capped at "+A().REC_CAP_FTE+" FTE a step":""))}</div>
 <h3 class="jd-h">Job</h3><p class="small">${o.k==="agent"?"Reads the request, decides what to do inside its box, acts or hands to a person, and records why.":"Runs the same fixed rule every time, with no model, and alerts the owner when an input is not what it expects."} It covers: ${rows.slice(0,4).map(x=>E(x.b.t)).join("; ")}${rows.length>4?"; and "+(rows.length-4)+" more":""}.</p>
 <h3 class="jd-h">Starting box</h3><div class="jb-kvs">${kv("Mode",o.k==="agent"?"Agent":"Robot")}${kv("Tier",E(L.tier))}${kv("Confidence floor",E(L.floor))}${kv("When unsure",E(L.ask))}${kv("Kill switch",E(L.kill))}${kv("Budget","Set when it is built; not priced here")}${kv("Accountable owner",E(o.teams[0]||"To assign"))}${kv("Highest step risk",o.risk+" of 5")}</div>
 <h3 class="jd-h">Before it can be built</h3><ul class="jb-need"><li class="${o.hasProc?"ok":"no"}">${o.hasProc?"A process to run inside: "+E(a.wfN(p)):"A process first. Draft one from the steps below."}</li><li class="${o.sys.length?"ok":"no"}">${o.sys.length?"Access to "+E(o.sys.join(", ")):"Systems to be named"}</li><li class="${o.risk>=4?"no":"ok"}">${o.risk>=4?"High risk: a person approves each action until it earns trust":"Risk is low enough to act and report"}</li>${o.pain?`<li class="ok">${o.pain} painful step${o.pain===1?"":"s"} it would relieve</li>`:""}</ul>
 <h3 class="jd-h">Serves</h3><p class="small">${o.roles.map(E).join(", ")} · ${E(o.js.join(", "))}</p>
 <h3 class="jd-h">Steps</h3><div class="jo-steps">${rows.map(x=>`<button class="jo-step" data-pp2-act="jgo" data-a="${x.j.id}|${x.b.id}"><span class="jo-sa">${R.av("human",x.b.who,26)}</span><span class="jo-sb"><span>${R.tnChip(x.j,x.b)} <b>${E(x.b.t)}</b></span><small>${E(x.b.who)} · ${E(R.jshort(x.j))} · ${fmt(x.hrs)} h a month · frees about ${fmt(x.r.save)} h</small></span></button>`).join("")}</div>
 <h3 class="jd-h">Take action</h3><div class="row jb-act"><button class="btn primary" data-pp2-act="jbvc" data-a="${o.id}">Build it in VibeCheck</button><button class="btn${R.bdec[o.id]==="plan"?" on":""}" data-pp2-act="jbdec" data-a="${o.id}|plan" aria-pressed="${R.bdec[o.id]==="plan"}">${R.bdec[o.id]==="plan"?"In the build plan (remove)":"Add to the build plan"}</button><button class="btn quiet" data-pp2-act="jbdec" data-a="${o.id}|defer" aria-pressed="${R.bdec[o.id]==="defer"}">${R.bdec[o.id]==="defer"?"Deferred (undo)":"Defer"}</button></div><p class="small muted">The build plan is a working list in this demo. Nothing is approved, built or live; VibeCheck opens with this request filled in and walks through it as a scripted demo.</p>
 <div class="row" style="margin-top:12px">${p?`<button class="btn primary" data-pp2-act="jopenwf" data-a="${E(p.ref)}">Open its process</button><button class="btn quiet" data-pp2-act="jprocx" data-a="${E(R.pkey(p))}">How it connects</button>`:`<button class="btn primary" data-pp2-act="jgo" data-a="${o.rows[0].j.id}|${o.rows[0].b.id}">Open the first step</button>`}</div></div>`)};

const ACT=A().ACT;if(ACT){const rf=()=>{try{A().paneRefresh()}catch(e){}};
 ACT.jpmj=t=>{N.j=t.dataset.a;N.pm=null;rf()};ACT.jxref=t=>{if(t.dataset.a==="steps")R.xrefSteps();else R.xrefJourney()};ACT.jbdec=t=>{const [id,v]=t.dataset.a.split("|");R.bdec[id]=R.bdec[id]===v?"":v;R.buildDrawer(id);rf()};ACT.jbvc=t=>{const id=t.dataset.a,o=builds().find(x=>x.id===id);if(!o)return;try{closeDrawer()}catch(e){}const q="Build the "+o.title+" "+(o.k==="agent"?"agent":"robot")+" for "+o.teams.slice(0,2).join(" and ")+": it takes over "+o.rows.length+" step"+(o.rows.length===1?"":"s")+" and starts inside its box.";if(W.STUDIO&&STUDIO.open)STUDIO.open(q);else go("studio")};ACT.jflowstep=t=>{const [fid,nid]=t.dataset.a.split("|");try{FLOWX.open(fid,nid)}catch(e){A().openWf(fid)}};ACT.jpmsel=t=>{N.pm=t.dataset.a;rf();setTimeout(()=>{const el=document.querySelector(".jpm-flow");if(el&&el.scrollIntoView)el.scrollIntoView({block:"nearest",behavior:"smooth"})},60)};
 ACT.jbf=t=>{const [g,v]=t.dataset.a.split("|");if(g==="f")O.flt=v;else O.wave=+v;rf()};
 ACT.jbmore=()=>{O.all=!O.all;rf()};ACT.jbld=t=>R.buildDrawer(t.dataset.a)}
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("jpm-n")){e.preventDefault();e.target.dispatchEvent(new MouseEvent("click",{bubbles:true}))}});
})();
