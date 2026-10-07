/* ============ Knowledge vault: an Obsidian-style graph of the GAAP vault ============ */
(function(){
const G=GAAPDATA,NN=G.nodes,n=NN.length;
const T={root:["Root","--accent"],area:["Area","--w1"],topic:["Topic","--p4"],subtopic:["Subtopic","--s3"],section:["Section","--u3"],meta:["Meta","--muted"],dashboard:["Dashboard","--muted"]};
const TY=["area","topic","subtopic","section","meta"];
S.vault=S.vault||{q:"",hide:{},stubOnly:false,sel:-1,hov:-1,local:false,depth:1,color:"type",queue:[],view:{k:1,x:0,y:0}};
const V=S.vault;{const kg=SCREENS.find(s=>s[0]==="kg");if(kg)kg[1]="Impact graph"}
/* ---- graph structure ---- */
const out=Array.from({length:n},()=>[]),inc=Array.from({length:n},()=>[]),adj=Array.from({length:n},()=>new Set());
const EDG=G.edges;EDG.forEach(([a,b])=>{out[a].push(b);inc[b].push(a);adj[a].add(b);adj[b].add(a)});
const deg=adj.map(s=>s.size);
const kids=Array.from({length:n},()=>[]);NN.forEach((x,i)=>{if(x[8]>=0)kids[x[8]].push(i)});
const stubs=NN.map((x,i)=>x[4]==="stub"?i:-1).filter(i=>i>=0),complete=NN.filter(x=>x[4]==="complete").length;
const orphans=deg.filter(d=>d===0).length;
Object.assign(METRICS,{
 m_vaultcov:{n:"Ontology completeness",f:"Complete notes ÷ (Complete notes + Stub notes)",u:"%",cur:Math.round(complete/(complete+stubs.length)*100),tgt:85,badAt:70,dir:"max",max:100,tr:[66,68,70,72,74,75,76,76],owner:"Accounting policy",use:["Knowledge vault"],rem:{kind:"agent",ref:"Drafting Agent",title:"Draft the most linked stubs first",agent:"Drafting Agent",auto:false,state:"idle",prog:"Drafts a note from the Codification text and queues it for a person to review"}},
 m_vaultlink:{n:"Link density",f:"Links ÷ Notes",u:"",cur:+(EDG.length/n).toFixed(2),tgt:2,badAt:1.2,dir:"max",max:4,tr:[1.6,1.7,1.8,1.9,2,2.1,2.2,2.2],owner:"Accounting policy",use:["Knowledge vault"],rem:{kind:"kb",ref:"KB-GAAP-04",title:"Add related and see-also links",agent:"Drafting Agent",auto:false,state:"idle",prog:"Suggests links between notes that cite each other"}}});
/* ---- layout ---- */
const X=new Float32Array(n),Y=new Float32Array(n),VX=new Float32Array(n),VY=new Float32Array(n),LX=new Float32Array(n),LY=new Float32Array(n);
let laid=false,alpha=0,rafId=0;
const rnd=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})();
function ringInit(){const dp={root:0,area:1,topic:2,subtopic:3,section:4,meta:2,dashboard:2},ang=new Array(n).fill(null);let ai=0;const areas=NN.filter(x=>x[3]==="area").length;
 const A=i=>{if(ang[i]!=null)return ang[i];const x=NN[i];if(x[3]==="area")ang[i]=(ai++)/areas*Math.PI*2;else if(x[8]>=0&&x[8]!==i)ang[i]=A(x[8])+(rnd()-.5)*.45;else ang[i]=rnd()*Math.PI*2;return ang[i]};
 for(let i=0;i<n;i++){const a=A(i),r=(dp[NN[i][3]]||2)*120+rnd()*30;X[i]=Math.cos(a)*r;Y[i]=Math.sin(a)*r}}
function sim(idx,E,PX,PY,ticks,rep,len){const m=idx.length;if(!m)return;let a=1;const pos=new Map(idx.map((v,j)=>[v,j]));
 for(let t=0;t<ticks;t++){a*=.985;for(let p=0;p<m;p++){const i=idx[p];for(let q=p+1;q<m;q++){const j=idx[q];let dx=PX[i]-PX[j],dy=PY[i]-PY[j],d2=dx*dx+dy*dy+.01;if(d2>90000)continue;const f=rep/d2,d=Math.sqrt(d2);dx=dx/d*f;dy=dy/d*f;VX[i]+=dx;VY[i]+=dy;VX[j]-=dx;VY[j]-=dy}}
  for(const [u,w] of E){if(!pos.has(u)||!pos.has(w))continue;let dx=PX[w]-PX[u],dy=PY[w]-PY[u];const d=Math.sqrt(dx*dx+dy*dy)+.01,f=(d-len)*.012*Math.min(1,.5+a);dx=dx/d*f;dy=dy/d*f;VX[u]+=dx;VY[u]+=dy;VX[w]-=dx;VY[w]-=dy}
  for(const i of idx){VX[i]-=PX[i]*.0016;VY[i]-=PY[i]*.0016;VX[i]*=.82;VY[i]*=.82;PX[i]+=VX[i];PY[i]+=VY[i]}}
 for(const i of idx){VX[i]=0;VY[i]=0}}
function layoutGlobal(){if(laid)return;ringInit();const all=[...Array(n).keys()];sim(all,EDG,X,Y,300,140,44);laid=true}
function bfs(s,d){const seen=new Map([[s,0]]);let fr=[s];for(let k=1;k<=d;k++){const nx=[];fr.forEach(u=>adj[u].forEach(w=>{if(!seen.has(w)){seen.set(w,k);nx.push(w)}}));fr=nx}return seen}
let LSET=null;
function layoutLocal(){const seen=bfs(V.sel,V.depth);LSET=seen;const idx=[...seen.keys()],byD={};idx.forEach(i=>{(byD[seen.get(i)]=byD[seen.get(i)]||[]).push(i)});
 Object.entries(byD).forEach(([d,l])=>l.forEach((i,j)=>{const a=j/l.length*Math.PI*2+d*.7,r=d*95;LX[i]=Math.cos(a)*r;LY[i]=Math.sin(a)*r}));
 sim(idx,EDG.filter(([a,b])=>seen.has(a)&&seen.has(b)),LX,LY,200,90,60)}
const PX=()=>V.local&&LSET?LX:X,PY=()=>V.local&&LSET?LY:Y;
/* ---- view ---- */
const CC={};let ccTheme="";const cc=v=>{const k=document.documentElement.getAttribute("data-theme")+(matchMedia("(prefers-color-scheme:dark)").matches?"d":"l");if(k!==ccTheme){ccTheme=k;for(const x in CC)delete CC[x]}return CC[v]||(CC[v]=getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"#888")};
let cv,ctx,W=0,H=0,dpr=1,drag=null,moved=false;
const vis=i=>{const x=NN[i];if(V.hide[x[3]])return false;if(V.stubOnly&&x[4]!=="stub"&&i!==V.sel)return false;if(V.local&&LSET&&!LSET.has(i))return false;return true};
const matches=()=>{const q=V.q.trim().toLowerCase();if(!q)return null;const s=new Set();NN.forEach((x,i)=>{if((x[2]+" "+x[1]+" "+x[0]).toLowerCase().includes(q))s.add(i)});return s};
function fit(){const xs=PX(),ys=PY();let a=1e9,b=-1e9,c=1e9,d=-1e9;for(let i=0;i<n;i++){if(!vis(i))continue;a=Math.min(a,xs[i]);b=Math.max(b,xs[i]);c=Math.min(c,ys[i]);d=Math.max(d,ys[i])}
 if(a>b)return;const k=Math.min(W/(b-a+80),H/(d-c+80),V.local?1.5:2.6);V.view={k,x:W/2-(a+b)/2*k,y:H/2-(c+d)/2*k}}
function resize(){if(!cv)return;const r=cv.parentElement.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(2,window.devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+"px";cv.style.height=H+"px"}
function colorOf(i){const x=NN[i];if(V.color==="status")return x[4]==="stub"?cc("--warn-f"):x[4]==="complete"?cc("--good-f"):cc("--muted");return cc((T[x[3]]||T.meta)[1])}
function draw(){if(!cv||!cv.isConnected)return;const xs=PX(),ys=PY(),{k,x:ox,y:oy}=V.view;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);ctx.translate(ox,oy);ctx.scale(k,k);
 const focus=V.hov>=0?V.hov:V.sel,emph=focus>=0?new Set([focus,...adj[focus]]):null,mt=matches(),ink=cc("--ink"),muted=cc("--muted");
 const dim=i=>(emph&&!emph.has(i))||(mt&&!mt.has(i)&&!(emph&&emph.has(i)));
 const lines=[[],[],[]];EDG.forEach(([a,b])=>{if(!vis(a)||!vis(b))return;const hot=emph&&(a===focus||b===focus);lines[hot?2:(emph||mt)?0:1].push(a,b)});
 [[0,.05,1],[1,.16,1],[2,.75,1.8]].forEach(([c,al,w])=>{const L=lines[c];if(!L.length)return;ctx.beginPath();for(let j=0;j<L.length;j+=2){ctx.moveTo(xs[L[j]],ys[L[j]]);ctx.lineTo(xs[L[j+1]],ys[L[j+1]])}ctx.strokeStyle=c===2?cc("--accent"):muted;ctx.globalAlpha=al;ctx.lineWidth=w/k**.4;ctx.stroke()});
 ctx.globalAlpha=1;const lab=[];
 for(let i=0;i<n;i++){if(!vis(i))continue;const x=NN[i],r=(x[3]==="root"?11:3+Math.sqrt(deg[i])*1.5)*Math.min(1.5,Math.max(.8,k**.3)),d=dim(i),c=colorOf(i);ctx.globalAlpha=d?.14:1;ctx.beginPath();ctx.arc(xs[i],ys[i],r,0,6.283);
  if(x[4]==="stub"){ctx.fillStyle=cc("--bg");ctx.fill();ctx.lineWidth=1.8/k**.3;ctx.strokeStyle=c;ctx.stroke()}else{ctx.fillStyle=c;ctx.fill()}
  if(i===V.sel){ctx.globalAlpha=1;ctx.beginPath();ctx.arc(xs[i],ys[i],r+4,0,6.283);ctx.lineWidth=2.4/k**.3;ctx.strokeStyle=ink;ctx.stroke()}
  if(!d&&((emph&&emph.has(i))||(mt&&mt.has(i))||deg[i]>=26||k>2.4||V.local))lab.push(i,r)}
 ctx.globalAlpha=1;ctx.font=`600 ${12.5/k}px Hanken Grotesk, system-ui, sans-serif`;ctx.textAlign="center";
 const lw=new Map();for(let j=0;j<lab.length;j+=2){const i=lab[j],t=NN[i][2].length>34?NN[i][2].slice(0,32)+"…":NN[i][2];ctx.lineWidth=3.5/k;ctx.strokeStyle=cc("--bg");ctx.strokeText(t,xs[i],ys[i]+lab[j+1]+14/k);ctx.fillStyle=ink;ctx.fillText(t,xs[i],ys[i]+lab[j+1]+14/k)}}
function loop(){if(alpha>0&&!V.local){sim(vis2(),EDG,X,Y,1,140,44);alpha--}draw();rafId=alpha>0?requestAnimationFrame(loop):0}
const vis2=()=>[...Array(n).keys()];
const kick=(a)=>{alpha=Math.max(alpha,a||1);if(!rafId)rafId=requestAnimationFrame(loop)};
function hit(mx,my){const xs=PX(),ys=PY(),{k,x,y}=V.view,gx=(mx-x)/k,gy=(my-y)/k;let best=-1,bd=1e9;for(let i=0;i<n;i++){if(!vis(i))continue;const r=(3+Math.sqrt(deg[i])*1.5)*Math.min(1.5,Math.max(.8,k**.3))+3/k**.3,dx=xs[i]-gx,dy=ys[i]-gy,d=dx*dx+dy*dy;if(d<r*r&&d<bd){bd=d;best=i}}return best}
function animateTo(tx,ty,tk){const v0={...V.view},t0=performance.now();const step=t=>{const p=Math.min(1,(t-t0)/380),e=1-Math.pow(1-p,3);V.view={k:v0.k+(tk-v0.k)*e,x:v0.x+(tx-v0.x)*e,y:v0.y+(ty-v0.y)*e};draw();if(p<1&&cv&&cv.isConnected)requestAnimationFrame(step)};requestAnimationFrame(step)}
function centerOn(i,k){const kk=k||Math.max(V.view.k,1.4);animateTo(W/2-PX()[i]*kk,H/2-PY()[i]*kk,kk)}
function select(i,center){V.sel=i;if(i>=0&&V.local){layoutLocal();fit()}panel();list();draw();if(i>=0&&center&&!V.local)centerOn(i);audit("opened note",i>=0?NN[i][2]:"none")}
/* ---- panels ---- */
const tlab=i=>(T[NN[i][3]]||T.meta)[0];
const chip=(i,extra)=>`<button class="chip vx-chip" data-vx-sel="${i}" title="${esc(NN[i][0])}"><i class="vx-dot" style="background:${NN[i][4]==="stub"?"transparent":`var(${(T[NN[i][3]]||T.meta)[1]})`};border-color:var(${(T[NN[i][3]]||T.meta)[1]})"></i>${esc(NN[i][2])}${extra||""}</button>`;
function crumbs(i){const c=[];let g=0,j=i;while(NN[j][8]>=0&&g++<8){j=NN[j][8];c.unshift(j)}return c}
function panel(){const el=$("#vxPanel");if(!el)return;const i=V.sel;if(i<0){el.innerHTML=`<div class="vx-empty"><b>Pick a note</b><span class="muted">Select a dot in the graph or a name in the list. You will see its properties, what it links to, and what links back to it.</span><div class="row" style="margin-top:12px"><button class="chip" data-vx-sel="${NN.findIndex(x=>x[3]==="root")}">Open the root</button><button class="chip" data-vx-sel="${NN.findIndex(x=>x[0].startsWith("842-10 -"))}">ASC 842 Overall</button></div></div>`;return}
 const x=NN[i],cr=crumbs(i),outs=[...new Set([...out[i]])].filter(j=>j!==i),ins=[...new Set(inc[i])].filter(j=>j!==i&&!out[i].includes(j)||inc[i].includes(j)&&!out[i].includes(j)),both=out[i].filter(j=>inc[i].includes(j));
 const rel=x[9].map(j=>chip(j)).join("")||'<span class="muted small">None recorded</span>',see=x[10].map(j=>chip(j)).join("");
 const q=V.queue.includes(i);
 el.innerHTML=`<div class="vx-note"><div class="eyebrow">${tlab(i)}${x[1]?" · "+esc(x[1]):""}</div><h3>${esc(x[2])}</h3>
 ${cr.length?`<div class="vx-crumb">${cr.map(c=>`<button data-vx-sel="${c}">${esc(NN[c][2].length>26?NN[c][2].slice(0,24)+"…":NN[c][2])}</button>`).join('<span>›</span>')}</div>`:""}
 <dl class="kv vx-props"><dt>type</dt><dd>${esc(x[3])}</dd><dt>status</dt><dd><span class="pill ${x[4]==="complete"?"good":x[4]==="stub"?"warn":"mute"}">${x[4]||"n/a"}</span></dd><dt>asc_id</dt><dd class="num">${esc(x[1]||"—")}</dd>${x[5].length?`<dt>tags</dt><dd>${x[5].map(t=>`<span class="pill mute">#${esc(t)}</span>`).join(" ")}</dd>`:""}<dt>size</dt><dd class="num">${(x[7]/1024).toFixed(1)} KB</dd><dt>links</dt><dd class="num" data-role="metric">${out[i].length} out · ${inc[i].length} back</dd></dl>
 ${x[4]==="stub"?`<div class="rem" style="margin:10px 0"><div class="ico warn">${ico("warn")}</div><div><b>This note is a stub</b><div class="muted small">The ontology has the node and ${inc[i].length} note${inc[i].length===1?"":"s"} point${inc[i].length===1?"s":""} to it, but it has no content yet.</div><div class="row" style="margin-top:8px"><button class="btn" data-vx-queue="${i}" ${q?"disabled":""}>${q?"Queued for drafting":"Queue for drafting"}</button></div></div></div>`:`<p class="vx-ex">${esc(x[6])}${x[6].length>=240?"…":""}</p>`}
 <div class="row" style="margin:6px 0 12px"><button class="btn primary" data-vx-local="${i}">Show local graph</button><button class="btn quiet" data-vx-copy="${i}">Copy [[link]]</button>${/^842/.test(x[1])?`<button class="btn" data-go="kg:std1">Impact on Meridian</button>`:""}</div>
 <div class="vx-sec"><b>Related</b> ${rel}</div>${see?`<div class="vx-sec"><b>See also</b> ${see}</div>`:""}
 ${kids[i].length?`<div class="vx-sec"><b>Contains (${kids[i].length})</b> ${kids[i].slice(0,14).map(j=>chip(j)).join("")}${kids[i].length>14?`<span class="muted small"> +${kids[i].length-14} more</span>`:""}</div>`:""}
 <div class="vx-sec"><b>Links to (${outs.length})</b> ${outs.slice(0,12).map(j=>chip(j)).join("")||'<span class="muted small">Nothing</span>'}${outs.length>12?`<span class="muted small"> +${outs.length-12} more</span>`:""}</div>
 <div class="vx-sec"><b>Backlinks (${inc[i].length})</b> ${[...new Set(inc[i])].slice(0,12).map(j=>chip(j)).join("")||'<span class="muted small">Nothing links here</span>'}${inc[i].length>12?`<span class="muted small"> +${inc[i].length-12} more</span>`:""}</div></div>`}
function list(){const el=$("#vxList");if(!el)return;const mt=matches();let ids=[...Array(n).keys()].filter(i=>(!mt||mt.has(i))&&!V.hide[NN[i][3]]&&(!V.stubOnly||NN[i][4]==="stub"));
 const tot=ids.length;ids.sort((a,b)=>deg[b]-deg[a]);ids=ids.slice(0,70);
 el.innerHTML=ids.map(i=>`<button class="vx-li" data-vx-sel="${i}" aria-current="${i===V.sel}"><i class="vx-dot" style="background:${NN[i][4]==="stub"?"transparent":`var(${(T[NN[i][3]]||T.meta)[1]})`};border-color:var(${(T[NN[i][3]]||T.meta)[1]})"></i><span>${esc(NN[i][2])}<small>${esc(NN[i][1]||tlab(i))} · ${deg[i]} links</small></span></button>`).join("")||'<span class="muted small" style="padding:10px">No notes match.</span>';
 const c=$("#vxCount");if(c)c.textContent=tot+" of "+n+" notes"+(tot>70?", showing the most linked 70":"")}
function legend(){return Object.entries(T).filter(([k])=>k!=="dashboard").map(([k,v])=>`<span><i class="vx-dot" style="background:var(${v[1]});border-color:var(${v[1]})"></i>${v[0]}</span>`).join("")+`<span><i class="vx-dot" style="border-color:var(--warn-f);background:transparent"></i>Stub</span>`}
/* ---- screen ---- */
function backlog(){const L=stubs.slice().sort((a,b)=>deg[b]-deg[a]).filter(i=>!V.queue.includes(i)).slice(0,8);
 return `<div class="grid g2"><div><h4 class="vx-h">Most linked stubs</h4><div class="vx-bl" data-dnd="vxbl" data-dnd-scope="vxq">${L.map(i=>`<div class="vx-row" data-dnd-id="${i}" tabindex="0">${grip}<span class="vx-rt"><b>${esc(NN[i][2])}</b><small>${esc(NN[i][1])} · ${inc[i].length} notes point here</small></span><button class="chip" data-vx-sel="${i}">Open</button></div>`).join("")}</div></div>
 <div><h4 class="vx-h">Drafting queue <span class="muted small">drag stubs here, top is first</span></h4><div class="vx-bl vx-q" data-dnd="vxq" data-dnd-scope="vxq">${V.queue.map(i=>`<div class="vx-row" data-dnd-id="${i}" tabindex="0">${grip}<span class="vx-rt"><b>${esc(NN[i][2])}</b><small>${esc(NN[i][1])}</small></span>${aiChip({model:"Drafting Agent",conf:.8,title:"Draft from the Codification",note:"Drafts the note from the source text and the notes that already point here. A person reviews before it lands in the vault.",src:["FASB Codification","Notes that link here"],guards:["Draft only","Human review before publish"]})}</div>`).join("")||`<div class="vx-drop">Drop a stub here to queue it for drafting</div>`}</div></div></div>`}
function story(){const pct=Math.round(complete/(complete+stubs.length)*100),top=stubs.slice().sort((a,b)=>deg[b]-deg[a])[0];return `Your GAAP vault holds <b>${n} notes</b> joined by <b>${EDG.length.toLocaleString()} links</b>. <b>${pct}%</b> of the notes are complete and <b>${stubs.length}</b> are still stubs${top?`, and the most linked stub is <b>${esc(NN[top][2])}</b>, with ${inc[top].length} notes pointing at it`:""}.`}
REG("vault","Knowledge vault","know","M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM10.5 8.5L6.5 15M13.5 8.5l4 6.5M8 18h8",()=>{setTimeout(boot,0);
 return `<div class="screen">${hero("Knowledge vault","Your notes, as a living graph",story(),`<div class="row">${fchip("m_vaultcov")}${fchip("m_vaultlink")}<span class="pill mute">Snapshot of the GAAP vault, Oct 6</span>${whyPop("This reads the structure of an Obsidian vault: note properties such as type, status and up, and the [[wikilinks]] between notes. Oukala keeps the vault as the source of truth and never rewrites a note without a person approving it.")}</div>`)}${lensNote()}
 <div class="vx glass"><aside class="vx-l"><input class="fin" id="vxQ" data-vx-q placeholder="Search notes, for example lease or 606-10" aria-label="Search notes" value="${esc(V.q)}"><div class="vx-f">${TY.map(t=>`<button class="chip" data-vx-type="${t}" aria-pressed="${!V.hide[t]}">${T[t][0]}</button>`).join("")}<button class="chip" data-vx-stubs aria-pressed="${V.stubOnly}">Stubs only</button></div><div class="muted small" id="vxCount" style="padding:2px 4px"></div><div class="vx-list" id="vxList"></div></aside>
 <div class="vx-c"><canvas id="vxCv" role="img" aria-label="Graph of ${n} notes and their links. Use the list or the note panel for a text version."></canvas><div class="vx-ctl"><div class="vx-seg"><button data-vx-color="type" aria-pressed="${V.color==="type"}">Type</button><button data-vx-color="status" aria-pressed="${V.color==="status"}">Status</button></div><div class="vx-seg"><button data-vx-zoom="1.3" aria-label="Zoom in">+</button><button data-vx-zoom="0.77" aria-label="Zoom out">−</button><button data-vx-fit aria-label="Fit to screen">Fit</button></div><div class="vx-seg"><button data-vx-localtoggle aria-pressed="${V.local}">Local graph</button>${[1,2,3].map(d=>`<button data-vx-depth="${d}" aria-pressed="${V.depth===d}" ${V.local?"":"disabled"}>${d}</button>`).join("")}</div></div><div class="vx-tip" id="vxTip" hidden></div><div class="vx-leg">${legend()}</div></div>
 <aside class="vx-r" id="vxPanel"></aside></div>
 ${card("Where to put effort next","Stubs are notes the ontology names but nobody has written. Queue the ones most notes depend on, and Drafting Agent prepares a draft for a person to review.",backlog(),fchip("m_vaultcov"))}
 ${card("How the vault connects to Oukala","",`<div class="grid g3"><div class="mini glass"><small>Source of truth</small><span>Your Obsidian vault stays the home of the notes. Oukala reads properties and wikilinks, and writes back only after approval.</span></div><div class="mini glass"><small>Traceability</small><span>Policies, controls and systems can cite a note. The Impact graph shows what a change in a standard reaches.</span></div><div class="mini glass"><small>Orphans</small><span class="num" data-role="metric">${orphans}</span><span class="muted small">notes with no links at all, plus ${G.unresolved.length} links that point to notes not yet created.</span></div></div>`,`<button class="btn" data-go="kg">Open impact graph</button>`)}</div>`});
/* ---- boot and events ---- */
function boot(){cv=$("#vxCv");if(!cv)return;ctx=cv.getContext("2d");layoutGlobal();resize();if(V.local&&V.sel>=0)layoutLocal();fit();list();panel();draw();bind()}
function bind(){const rect=()=>cv.getBoundingClientRect();
 cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);const r=rect(),mx=e.clientX-r.left,my=e.clientY-r.top,h=hit(mx,my);moved=false;drag={h,mx,my,v0:{...V.view}};if(h>=0&&!V.local){alpha=0}};
 cv.onpointermove=e=>{const r=rect(),mx=e.clientX-r.left,my=e.clientY-r.top;if(drag){const dx=mx-drag.mx,dy=my-drag.my;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;if(moved){if(drag.h>=0){const k=V.view.k;PX()[drag.h]=(mx-V.view.x)/k;PY()[drag.h]=(my-V.view.y)/k;if(!V.local)kick(40);else draw()}else{V.view.x=drag.v0.x+dx;V.view.y=drag.v0.y+dy;draw()}}return}
  const h=hit(mx,my);if(h!==V.hov){V.hov=h;cv.style.cursor=h>=0?"pointer":"grab";const tip=$("#vxTip");if(tip){if(h>=0){tip.hidden=false;tip.innerHTML=`<b>${esc(NN[h][2])}</b><span>${tlab(h)} · ${NN[h][4]||"n/a"} · ${deg[h]} links</span>`;tip.style.left=Math.min(W-220,mx+14)+"px";tip.style.top=Math.max(4,my-8)+"px"}else tip.hidden=true}draw()}else if(h>=0){const tip=$("#vxTip");if(tip){tip.style.left=Math.min(W-220,mx+14)+"px";tip.style.top=Math.max(4,my-8)+"px"}}};
 cv.onpointerup=e=>{const d=drag;drag=null;if(!d)return;if(!moved){select(d.h>=0?d.h:-1,false)}};
 cv.onpointerleave=()=>{if(V.hov>=0&&!drag){V.hov=-1;const t=$("#vxTip");if(t)t.hidden=true;draw()}};
 cv.ondblclick=e=>{const r=rect(),h=hit(e.clientX-r.left,e.clientY-r.top);if(h>=0){V.sel=h;V.local=true;layoutLocal();fit();rerenderCtl();panel();list();draw()}};
 cv.onwheel=e=>{e.preventDefault();const r=rect(),mx=e.clientX-r.left,my=e.clientY-r.top,f=e.deltaY<0?1.12:.89,v=V.view,k=Math.max(.15,Math.min(8,v.k*f));V.view={k,x:mx-(mx-v.x)*k/v.k,y:my-(my-v.y)*k/v.k};draw()};
 cv.style.cursor="grab";cv.style.touchAction="none"}
function rerenderCtl(){$$("[data-vx-localtoggle]").forEach(b=>b.setAttribute("aria-pressed",V.local));$$("[data-vx-depth]").forEach(b=>{b.disabled=!V.local;b.setAttribute("aria-pressed",V.depth===+b.dataset.vxDepth)})}
window.addEventListener("resize",()=>{if(cv&&cv.isConnected){resize();draw()}});
document.addEventListener("input",e=>{if(!e.target.matches("[data-vx-q]"))return;V.q=e.target.value;list();const m=matches();if(m&&m.size===1&&!V.local){const i=[...m][0];centerOn(i,1.6)}draw()});
document.addEventListener("click",e=>{const t=e.target.closest("[data-vx-sel],[data-vx-type],[data-vx-stubs],[data-vx-color],[data-vx-zoom],[data-vx-fit],[data-vx-localtoggle],[data-vx-depth],[data-vx-local],[data-vx-copy],[data-vx-queue]");if(!t)return;const d=t.dataset;
 if(d.vxSel!==undefined){select(+d.vxSel,true);return}
 if(d.vxType){V.hide[d.vxType]=!V.hide[d.vxType];t.setAttribute("aria-pressed",!V.hide[d.vxType]);list();draw();return}
 if(d.vxStubs!==undefined){V.stubOnly=!V.stubOnly;t.setAttribute("aria-pressed",V.stubOnly);list();draw();return}
 if(d.vxColor){V.color=d.vxColor;$$("[data-vx-color]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.vxColor===V.color));draw();return}
 if(d.vxZoom){const k=Math.max(.15,Math.min(8,V.view.k*+d.vxZoom)),v=V.view,cx=W/2,cy=H/2;V.view={k,x:cx-(cx-v.x)*k/v.k,y:cy-(cy-v.y)*k/v.k};draw();return}
 if(d.vxFit!==undefined){fit();draw();return}
 if(d.vxLocaltoggle!==undefined){if(V.sel<0&&!V.local){toast("Pick a note first, then turn on the local graph","info");return}V.local=!V.local;if(V.local)layoutLocal();fit();rerenderCtl();draw();audit("toggled local graph",V.local?"on":"off");return}
 if(d.vxDepth){V.depth=+d.vxDepth;if(V.local&&V.sel>=0){layoutLocal();fit()}rerenderCtl();draw();return}
 if(d.vxLocal!==undefined){V.sel=+d.vxLocal;V.local=true;layoutLocal();fit();rerenderCtl();panel();draw();audit("opened local graph",NN[V.sel][2]);return}
 if(d.vxCopy!==undefined){const txt="[["+NN[+d.vxCopy][0]+"]]";try{navigator.clipboard.writeText(txt).then(()=>toast("Copied "+txt,"good"),()=>toast(txt,"info"))}catch(er){toast(txt,"info")}return}
 if(d.vxQueue!==undefined){const i=+d.vxQueue;if(!V.queue.includes(i)){V.queue.push(i);audit("queued stub for drafting",NN[i][2]);toast("Queued. Drafting Agent will prepare a draft for review.","good");panel();render()}return}});
DND.on("vxq",(id,from,to,idx)=>{id=+id;if(to==="vxq"){V.queue=V.queue.filter(x=>x!==id);V.queue.splice(Math.min(idx,V.queue.length),0,id);audit("queued stub for drafting",NN[id][2]);toast("Added to the drafting queue","good")}else if(from==="vxq"){V.queue=V.queue.filter(x=>x!==id);toast("Removed from the queue","info")}render()});
SEARCHX.push(()=>NN.map((x,i)=>x[3]==="root"||x[3]==="meta"?null:{g:"GAAP vault",t:x[2],m:(x[1]||tlab(i))+(x[4]==="stub"?" · stub":""),c:(T[x[3]]||T.meta)[1],f:()=>{V.q="";go("vault");setTimeout(()=>select(i,true),80)},k:x[1]}).filter(Boolean));
ASKX.push(q=>{const l=q.toLowerCase();if(/stub|vault|obsidian|gaap graph|notes? (is|are) (missing|incomplete)/.test(l)){go("vault");say(q,{t:`The vault has <b>${n} notes</b>, of which <b>${stubs.length} are stubs</b>. The most linked stub is <b>${esc(NN[stubs.slice().sort((a,b)=>deg[b]-deg[a])[0]][2])}</b>. I opened the graph; queue stubs at the bottom for drafting.`,steps:["Read vault properties and links","Counted stubs and orphans","Opened Knowledge vault"]});return true}return false});
})();
