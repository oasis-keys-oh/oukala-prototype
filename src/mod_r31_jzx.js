/* ===== mod_r31_jzx: Process map, experience bars (replace the dial), and the Build list (one card per agent or robot to create).
   All figures are modeled sample values: a robot frees 80% and an agent 60% of the hours, 140 hours is one FTE a month. Nothing here is live. ===== */
(function(){
const W=window,X=W.JYX,R=W.JXR;if(!X||!X.api||!R||!R.av)return;
const A=()=>X.api,E=R.E,fmt=n=>A().fmt(Math.round(n)),f1=n=>A().f1(n);
const FTE_H=140,q=s=>encodeURIComponent(s);
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
R.procMap=function(){const a=A(),Y=X.JY;const hasDetail=Y.list.some(x=>x.cat!=="End to end");
 const cur=N.j&&Y.list.find(x=>x.id===N.j)||a.curJ()||Y.list[0];N.j=cur.id;
 const G=graph(cur),CW=214,NW=176,NH=58,RH=76,X0=14,Y0=46;const maxRow=Math.max(1,...G.cols.map(c=>c.length));
 const Wd=X0*2+CW*cur.stages.length-(CW-NW),Ht=Y0+maxRow*RH+12;
 const pos=o=>({x:X0+o.col*CW,y:Y0+o.row*RH});
 const real=[...G.nodes.values()].filter(o=>!o.gap),gaps=[...G.nodes.values()].filter(o=>o.gap);
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
  return `<g class="jpm-n lv${Math.min(2,lvl)}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" data-pp2-act="jprocx" data-a="${E(o.key)}" aria-label="${E(a.wfN(o.p))}. Open how it connects"><title>${E(a.wfN(o.p))}: ${o.boxes.length} step${o.boxes.length===1?"":"s"} here, ${a.AUTOL[lvl][0]}. Select to open how it connects.</title><rect width="${NW}" height="${NH}" rx="12"/><text x="14" y="${l.length>1?22:30}" class="jpm-t">${E(l[0])}</text>${l[1]?`<text x="14" y="37" class="jpm-t">${E(l[1])}</text>`:""}<text x="14" y="${NH-8}" class="jpm-s">${o.boxes.length} step${o.boxes.length===1?"":"s"} · ${E(a.AUTOL[lvl][0])}</text>${nc?`<g transform="translate(${NW-34} 7)"><rect width="28" height="16" rx="8" class="jpm-b"/><text x="14" y="12" text-anchor="middle" class="jpm-bt">↔${nc}</text></g>`:""}</g>`}).join("")}</svg>`;
 const chips=Y.list.map(x=>`<button class="jmc${x.id===cur.id?" is-on":""}" data-pp2-act="jpmj" data-a="${x.id}" aria-pressed="${x.id===cur.id}">${E(R.jshort(x))}</button>`).join("");
 return `${brief(`<b>${E(R.jshort(cur))}</b>: <b>${real.length} processes</b> carry ${G.L.length} steps across ${cur.stages.length} stages, with <b>${G.edges.filter(e=>!G.nodes.get(e.f).gap&&!G.nodes.get(e.t).gap).length} hand-offs</b> between them. <b>${shared}</b> share a touchpoint with another journey, so a change there is felt in both. <b>${gapSteps}</b> step${gapSteps===1?"":"s"} ha${gapSteps===1?"s":"ve"} no process, shown in red.`)}
 <div class="jh-kpis">${tile("Processes",real.length,"behind this journey")}${tile("Hand-offs",G.edges.filter(e=>!G.nodes.get(e.f).gap&&!G.nodes.get(e.t).gap).length,"one process to the next")}${tile("Shared",shared,"touch another journey","info")}${tile("No process",gapSteps,"steps nobody owns",gapSteps?"bad":"good")}</div>
 <div class="jmood jo-ctl" role="group" aria-label="Journey">${chips}</div>
 <section class="jpm-wrap" aria-label="Process map"><div class="tscroll"><div class="jpm-in" style="min-width:${Wd}px">${svg}</div></div></section>
 <div class="jfl jo-leg"><span><i class="jpm-sw lv0"></i> Manual today</span><span><i class="jpm-sw lv1"></i> Partly automated</span><span><i class="jpm-sw lv2"></i> Automated</span><span><i class="jpm-sw gap"></i> No process</span><span><b>↔</b> Shares a touchpoint with another journey</span></div>
 <p class="muted small jhint">Read left to right: each box is a process, placed in the stage where it first does work. An arrow means the next step in the journey runs on the next process. Select a process to see what feeds it, what it hands off to and which other journeys depend on it. Generated processes are drafts from the map.</p>`};

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
 Y.list.forEach(j=>{if(j.cat==="End to end"&&Y.list.some(x=>x.cat!=="End to end"))return;
  a.allBoxes(j).forEach(({b,s})=>{const r=a.rec(b);if(r.st!=="cand"||(r.k!=="agent"&&r.k!=="robot"))return;
   const grp=b.procs.length?R.pkey(b.procs[0]):b.key?"tp:"+b.key:"st:"+j.id+":"+s.id,key=r.k+":"+grp;
   let o=map.get(key);if(!o){o={key,k:r.k,grp,rows:[]};map.set(key,o)}o.rows.push({j,s,b,r,hrs:hrsOf(b)})})});
 const out=[...map.values()].map(o=>{const f=o.rows[0],b=f.b,p=b.procs[0];
  const title=p?a.wfN(p):(b.key&&X.TP&&X.TP[b.key]?X.TP[b.key].n:f.j.cat==="End to end"?f.s.n:R.jshort(f.j)+": "+f.s.n);
  const hrs=o.rows.reduce((s,x)=>s+x.hrs,0),freed=o.rows.reduce((s,x)=>s+x.r.save,0),risk=Math.max(...o.rows.map(x=>x.b.risk||1));
  const roles=[...new Set(o.rows.map(x=>x.b.who))],teams=[...new Set(o.rows.map(x=>x.b.owner).filter(Boolean))],sys=[...new Set(o.rows.map(x=>x.b.sys).filter(Boolean))];
  const ext=roles.every(x=>EXT.has(x)),pain=o.rows.filter(x=>x.b.pain&&x.b.em<=2).length;
  return Object.assign(o,{name:R.dwName(b,o.k),title,hrs,freed,risk,roles,teams,sys,ext,pain,hasProc:!!p,lim:lim(o.k,risk),js:[...new Set(o.rows.map(x=>R.jshort(x.j)))]})});
 out.sort((x,y)=>y.freed-x.freed);const n=out.length;
 out.forEach((o,i)=>{o.wave=(o.risk<=3&&o.hasProc&&i<Math.ceil(n*.3))?1:(o.risk>=5||!o.hasProc||i>=Math.ceil(n*.7))?3:2;o.id="b"+i});
 return out}
R.builds=builds;
const wl={1:"Wave 1",2:"Wave 2",3:"Wave 3"};
function bcard(o){const a=A();
 return `<article class="jb-card k-${o.k}"><button class="jb-open" data-pp2-act="jbld" data-a="${o.id}" aria-label="Open the build summary for ${E(o.title)}"><span class="jb-top">${R.av(o.k,o.name,44)}<span class="jb-t"><b>${E(o.title)}</b><small>${o.k==="agent"?"Agent":"Robot"} ${E(o.name.split(" ")[1])} · ${o.rows.length} step${o.rows.length===1?"":"s"} · ${E(o.js.slice(0,2).join(", "))}${o.js.length>2?" +"+(o.js.length-2):""}</small></span><span class="jb-wv w${o.wave}" title="Build order, a hypothesis: easy and valuable first">${wl[o.wave]}</span></span>
  <span class="jb-m"><span><b>${fmt(o.hrs)}</b>h a month covered</span><span><b>${o.ext?fmt(o.freed):(o.freed/FTE_H).toFixed(1)}</b>${o.ext?"h back to them":"FTE released"}</span><span><b>${o.risk}</b>risk of 5</span></span>
  <span class="jb-r small muted">${o.roles.slice(0,3).map(E).join(", ")}${o.roles.length>3?" +"+(o.roles.length-3):""} · owner ${E(o.teams[0]||"to assign")}</span>
  <span class="jb-chk"><i class="${o.hasProc?"ok":"no"}"></i>${o.hasProc?"Process exists":"Needs a process first"}${o.sys.length?` · <i class="ok"></i>${E(o.sys.slice(0,2).join(", "))}`:""}</span></button></article>`}
R.buildTab=function(){const a=A(),B=builds();const ag=B.filter(x=>x.k==="agent"),rb=B.filter(x=>x.k==="robot"),steps=B.reduce((s,x)=>s+x.rows.length,0);
 const st=B.filter(x=>!x.ext),fte=st.reduce((s,x)=>s+x.freed,0)/FTE_H,ext=B.filter(x=>x.ext).reduce((s,x)=>s+x.freed,0);
 const show=B.filter(x=>(O.flt==="all"||O.flt===x.k)&&(!O.wave||O.wave===x.wave));const lim_=O.all?show.length:24;
 const chip=(g,id,txt,num)=>`<button class="jmc${(g==="f"?O.flt===id:O.wave===id)?" is-on":""}" data-pp2-act="jbf" data-a="${g}|${id}" aria-pressed="${g==="f"?O.flt===id:O.wave===id}">${num!=null?`<b>${num}</b> `:""}${txt}</button>`;
 return `${brief(`<b>${B.length} things to build:</b> <span class="jx-bt g">${ag.length} agents</span> <span class="jx-bt r">${rb.length} robots</span>. ${steps} recommended steps become ${B.length} builds when steps that share a process are combined. Together they release about <b>${fte.toFixed(1)} FTE</b> of staff effort${ext>0?` and return about ${fmt(ext)} hours a month to people outside the organization`:""} (modeled).`)}
 <div class="jh-kpis">${tile("To build",B.length,"agents and robots")}${tile("Agents",ag.length,"reason inside a box","agent")}${tile("Robots",rb.length,"rules, no model cost","robot")}${tile("Wave 1",B.filter(x=>x.wave===1).length,"start here: easy and valuable","good")}${tile("Staff capacity",fte.toFixed(1)+" FTE","released if all built, modeled")}</div>
 <div class="jmood jo-ctl" role="group" aria-label="Filter builds">${chip("f","all","Everything")}${chip("f","agent","Agents",ag.length)}${chip("f","robot","Robots",rb.length)}<span class="jo-sp"></span>${chip("w",0,"Any wave")}${chip("w",1,"Wave 1",B.filter(x=>x.wave===1).length)}${chip("w",2,"Wave 2",B.filter(x=>x.wave===2).length)}${chip("w",3,"Wave 3",B.filter(x=>x.wave===3).length)}</div>
 <div class="jb-grid">${show.slice(0,lim_).map(bcard).join("")||`<p class="muted">Nothing matches these filters.</p>`}</div>
 ${show.length>24?`<div class="row" style="margin-top:10px"><button class="btn quiet" data-pp2-act="jbmore" data-a="">${O.all?"Show the top 24":"Show all "+show.length}</button></div>`:""}
 <p class="muted small jhint">Waves are a hypothesis: Wave 1 is the most hours released among builds with a process behind them and risk of 3 or less; Wave 3 has risk 5, no process yet, or the least return. Limits shown are the proposed starting box (tier, confidence floor, kill switch), not a running configuration. Nothing here is built or live. Teammate names are placeholders.</p>`};
R.buildDrawer=function(id){const a=A(),o=builds().find(x=>x.id===id);if(!o)return;const L=o.lim;
 const rows=o.rows.slice().sort((x,y)=>y.hrs-x.hrs);const p=o.rows[0].b.procs[0];
 const kv=(k,v)=>`<div class="jb-kv"><span>${k}</span><b>${v}</b></div>`;
 openDrawer(`<div class="jd"><div class="eyebrow">${o.k==="agent"?"Agent":"Robot"} to create · ${wl[o.wave]}</div><h2 class="jd-t">${E(o.title)}</h2>
 <div class="jd-crew">${R.av(o.k,o.name,44)}<span class="small muted">Placeholder name: ${E(o.name)}. Proposed, not built.</span></div>
 <div class="jd-tiles">${tile("Steps",o.rows.length,"it would take over")}${tile("Hours a month",fmt(o.hrs),"covered today")}${tile(o.ext?"Hours back":"Released",o.ext?fmt(o.freed):(o.freed/FTE_H).toFixed(1)+" FTE",o.k==="robot"?"80% freed, modeled":"60% freed, modeled")}</div>
 <h3 class="jd-h">Job</h3><p class="small">${o.k==="agent"?"Reads the request, decides what to do inside its box, acts or hands to a person, and records why.":"Runs the same fixed rule every time, with no model, and alerts the owner when an input is not what it expects."} It covers: ${rows.slice(0,4).map(x=>E(x.b.t)).join("; ")}${rows.length>4?"; and "+(rows.length-4)+" more":""}.</p>
 <h3 class="jd-h">Starting box</h3><div class="jb-kvs">${kv("Mode",o.k==="agent"?"Agent":"Robot")}${kv("Tier",E(L.tier))}${kv("Confidence floor",E(L.floor))}${kv("When unsure",E(L.ask))}${kv("Kill switch",E(L.kill))}${kv("Budget","Set when it is built; not priced here")}${kv("Accountable owner",E(o.teams[0]||"To assign"))}${kv("Highest step risk",o.risk+" of 5")}</div>
 <h3 class="jd-h">Before it can be built</h3><ul class="jb-need"><li class="${o.hasProc?"ok":"no"}">${o.hasProc?"A process to run inside: "+E(a.wfN(p)):"A process first. Draft one from the steps below."}</li><li class="${o.sys.length?"ok":"no"}">${o.sys.length?"Access to "+E(o.sys.join(", ")):"Systems to be named"}</li><li class="${o.risk>=4?"no":"ok"}">${o.risk>=4?"High risk: a person approves each action until it earns trust":"Risk is low enough to act and report"}</li>${o.pain?`<li class="ok">${o.pain} painful step${o.pain===1?"":"s"} it would relieve</li>`:""}</ul>
 <h3 class="jd-h">Serves</h3><p class="small">${o.roles.map(E).join(", ")} · ${E(o.js.join(", "))}</p>
 <h3 class="jd-h">Steps</h3><div class="jo-steps">${rows.map(x=>`<button class="jo-step" data-pp2-act="jgo" data-a="${x.j.id}|${x.b.id}"><span class="jo-sa">${R.av("human",x.b.who,26)}</span><span class="jo-sb"><span>${R.tnChip(x.j,x.b)} <b>${E(x.b.t)}</b></span><small>${E(x.b.who)} · ${E(R.jshort(x.j))} · ${fmt(x.hrs)} h a month · frees about ${fmt(x.r.save)} h</small></span></button>`).join("")}</div>
 <div class="row" style="margin-top:12px">${p?`<button class="btn primary" data-pp2-act="jopenwf" data-a="${E(p.ref)}">Open its process</button><button class="btn quiet" data-pp2-act="jprocx" data-a="${E(R.pkey(p))}">How it connects</button>`:`<button class="btn primary" data-pp2-act="jgo" data-a="${o.rows[0].j.id}|${o.rows[0].b.id}">Open the first step</button>`}</div></div>`)};

const ACT=A().ACT;if(ACT){const rf=()=>{try{A().paneRefresh()}catch(e){}};
 ACT.jpmj=t=>{N.j=t.dataset.a;rf()};
 ACT.jbf=t=>{const [g,v]=t.dataset.a.split("|");if(g==="f")O.flt=v;else O.wave=+v;rf()};
 ACT.jbmore=()=>{O.all=!O.all;rf()};ACT.jbld=t=>R.buildDrawer(t.dataset.a)}
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.classList&&e.target.classList.contains("jpm-n")){e.preventDefault();e.target.dispatchEvent(new MouseEvent("click",{bubbles:true}))}});
})();
