/* ============ GRAPHX: reusable living-graph engine (force layout, hover dimming, flowing edges, search,
   neighborhood-only rendering, clustering, path finder, dot-walk impact mode) ============
   Usage:  GRAPHX.render(elOrId,{nodes:[{id,label,type,group,sub,st,w,deg?}],edges:[{a,b,t}],groups:{type:{l:"Service",c:"--p4",shape:"circle|square|diamond"}},
           onSelect:(id,node,ctl)=>{},panel:(node,ctl)=>html,height:560,depth:1,focus:id,maxAll:700,cap:320,weightLabel:"users",
           edgeTypes:{"runs on":{l:"runs on"}},startMode:"explore|path|walk",name:"cmdb",open:id=>{}})  -> controller
   Controller: select(id,{center}),focus(id),path(a,b,{directed}),walk(id,{dir:"in|out|both",depth,types}),setData(nodes,edges),fit(),destroy().
   Pure helpers (no DOM): GRAPHX.graph(nodes,edges) -> {walk(start,opts),path(a,b,opts),neighbors(id),deg(id)}.
   Host markup for screens that re-render: GRAPHX.host(id,{h}) returns a placeholder; call GRAPHX.mount(id,cfg) after render(). */
(function(){
const GRAPHX=(function(){
const CC={};let ccK="";
const cc=v=>{const k=(document.documentElement.getAttribute("data-theme")||"")+(matchMedia("(prefers-color-scheme:dark)").matches?"d":"l");if(k!==ccK){ccK=k;for(const x in CC)delete CC[x]}return CC[v]||(CC[v]=getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"#888")};
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const reduce=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
let UID=0;
/* ---------- pure graph ---------- */
function graph(nodes,edges){
 const idx=new Map(nodes.map((n,i)=>[n.id,i])),N=nodes.length;
 const O=Array.from({length:N},()=>[]),I=Array.from({length:N},()=>[]),EA=[],EB=[],ET=[];
 edges.forEach(e=>{const a=idx.get(e.a),b=idx.get(e.b);if(a==null||b==null||a===b)return;const k=EA.length;EA.push(a);EB.push(b);ET.push(e.t||"");O[a].push([b,k]);I[b].push([a,k])});
 const deg=nodes.map((_,i)=>O[i].length+I[i].length);
 const g={nodes,idx,N,O,I,EA,EB,ET,deg,
  index:id=>idx.get(id),
  neighbors(i){const out=[];O[i].forEach(([j,k])=>out.push({j,k,dir:"out"}));I[i].forEach(([j,k])=>out.push({j,k,dir:"in"}));return out},
  /* walk: dir "out" follows a->b, "in" follows b->a, "both". types: array of allowed edge types (empty or null = all) */
  walk(s,o){o=o||{};const dir=o.dir||"both",maxD=o.depth||3,types=o.types&&o.types.length?new Set(o.types):null;const depth=new Map([[s,0]]),par=new Map(),order=[s];let fr=[s];const byD=[[s]];
   for(let d=1;d<=maxD;d++){const nx=[];fr.forEach(u=>{const nb=[];if(dir!=="in")O[u].forEach(([j,k])=>nb.push([j,k,"out"]));if(dir!=="out")I[u].forEach(([j,k])=>nb.push([j,k,"in"]));nb.forEach(([j,k,dd])=>{if(types&&!types.has(ET[k]))return;if(!depth.has(j)){depth.set(j,d);par.set(j,{from:u,k,dir:dd});nx.push(j);order.push(j)}})});if(!nx.length)break;byD.push(nx);fr=nx}
   const byType={};order.forEach(i=>{const t=nodes[i].type;byType[t]=(byType[t]||0)+1});const weight=order.reduce((a,i)=>a+(+nodes[i].w||0),0);
   return {start:s,depth,par,order,byD,byType,weight,reached:order.length-1,
    pathTo(j){const p=[];let c=j;while(c!==s&&par.has(c)){const x=par.get(c);p.unshift({to:c,from:x.from,k:x.k,dir:x.dir});c=x.from}return p}}},
  path(a,b,o){o=o||{};if(a===b)return {nodes:[a],steps:[]};const par=new Map([[a,null]]);let fr=[a];
   while(fr.length&&!par.has(b)){const nx=[];for(const u of fr){const nb=[];O[u].forEach(([j,k])=>nb.push([j,k,"out"]));if(!o.directed)I[u].forEach(([j,k])=>nb.push([j,k,"in"]));for(const [j,k,dd] of nb){if(!par.has(j)){par.set(j,{from:u,k,dir:dd});nx.push(j)}}}fr=nx}
   if(!par.has(b))return null;const steps=[];let c=b;while(c!==a){const x=par.get(c);steps.unshift({from:x.from,to:c,k:x.k,dir:x.dir});c=x.from}return {nodes:[a].concat(steps.map(s=>s.to)),steps}}};
 return g}
/* ---------- engine ---------- */
function create(el,cfg){
 const uid="gx"+(++UID),G0={g:null};let g,nodes,groups=cfg.groups||{};
 const S0={sel:-1,hov:-1,mode:cfg.startMode||"explore",depth:cfg.depth||1,hide:{},exp:{},q:"",A:-1,B:-1,pathR:null,directed:false,walkR:null,wdir:"in",wdepth:3,wtypes:[],view:{k:1,x:0,y:0},cl:true};
 const st=S0;let VN=[],VE=[],vmap=new Map(),W=0,Hh=0,dpr=1,cv,ctx,raf=0,drag=null,moved=false,pos=new Map(),t0=performance.now(),alive=true,tipEl,panelEl,searchRes=null;
 const maxAll=cfg.maxAll||700,cap=cfg.cap||320,height=cfg.height||560;
 const tcol=t=>(groups[t]&&groups[t].c)||"--muted",tlab=t=>(groups[t]&&groups[t].l)||t;
 function setData(ns,es){nodes=ns;g=graph(ns,es);G0.g=g;pos=new Map();st.sel=-1;st.hov=-1;st.pathR=null;st.walkR=null;st.A=-1;st.B=-1;st.exp={};st.local=false;
  const rt={};es.forEach(e=>{if(e.t)rt[e.t]=1});relTypes=Object.keys(rt).sort()}
 let relTypes=[];
 /* clustering key */
 const clKey=n=>cfg.clusterBy?cfg.clusterBy(n):(n.type+(n.group?"|"+n.group:""));
 let clusters=null;
 function buildClusters(){clusters=new Map();nodes.forEach((n,i)=>{const k=clKey(n);let c=clusters.get(k);if(!c){c={key:k,type:n.type,group:n.group,members:[]};clusters.set(k,c)}c.members.push(i)});if(clusters.size>64){clusters=new Map();nodes.forEach((n,i)=>{let c=clusters.get(n.type);if(!c){c={key:n.type,type:n.type,group:null,members:[]};clusters.set(n.type,c)}c.members.push(i)})}
  clusters.forEach(c=>c.members.sort((a,b)=>g.deg[b]-g.deg[a]));cOf=new Int32Array(nodes.length);let ci=0;clusters.forEach(c=>{c.ci=ci++;c.members.forEach(m=>cOf[m]=c.ci)});clArr=[...clusters.values()]}
 let cOf=null,clArr=[];
 const vis=i=>!st.hide[nodes[i].type];
 /* ----- view model ----- */
 function addVN(o){VN.push(o);return VN.length-1}
 function viewNode(i,depth){let v=vmap.get(i);if(v!=null)return v;const n=nodes[i];v=addVN({i,key:"n"+i,label:n.label,type:n.type,st:n.st,r:0,depth:depth||0,hid:0});vmap.set(i,v);return v}
 function buildView(){VN=[];VE=[];vmap=new Map();const ve=new Map();
  const addE=(a,b,w,k)=>{if(a===b)return;const key=a<b?a+"_"+b:b+"_"+a;let e=ve.get(key);if(!e){e=[a,b,0,k,0];ve.set(key,e);VE.push(e)}e[2]+=w;if(k!=null&&(e[3]==null||e[3]===""))e[3]=k;if(k!=null&&a===e[0])e[4]|=1;else if(k!=null)e[4]|=2};
  const fromEdges=ids=>{const set=new Set(ids);ids.forEach(i=>{g.O[i].forEach(([j,k])=>{if(set.has(j)&&vis(i)&&vis(j))addE(vmap.get(i),vmap.get(j),1,g.ET[k])})})};
  if(st.mode==="walk"&&st.walkR){const w=st.walkR;let ids=[];for(const d of w.byD){const lv=d.filter(vis).sort((a,b)=>g.deg[b]-g.deg[a]);ids=ids.concat(lv.slice(0,Math.max(12,Math.floor(cap/ (w.byD.length||1)))))}if(!ids.includes(w.start))ids.unshift(w.start);ids.forEach(i=>viewNode(i,w.depth.get(i)));
   const set=new Set(ids);ids.forEach(i=>{const p=w.par.get(i);if(p&&set.has(p.from))addE(vmap.get(p.from),vmap.get(i),1,g.ET[p.k])});
   /* extra relationships among reached nodes, light */ if(ids.length<160)fromEdges(ids);
   VN.forEach(v=>{v.hid=0});const shown=new Set(ids);w.order.forEach(i=>{if(!shown.has(i)){const p=w.par.get(i);if(p&&vmap.has(p.from))VN[vmap.get(p.from)].hid++}});return}
  if(st.mode==="path"&&st.pathR){const p=st.pathR;const ids=[];p.nodes.forEach(i=>ids.push(i));const set=new Set(ids);p.nodes.forEach(i=>{let c=0;g.neighbors(i).sort((a,b)=>g.deg[b.j]-g.deg[a.j]).forEach(({j})=>{if(c<5&&!set.has(j)&&vis(j)){set.add(j);ids.push(j);c++}})});ids.forEach((i,ix)=>{const v=viewNode(i,ix<p.nodes.length?0:1);if(ix<p.nodes.length)VN[v].pin=ix});fromEdges(ids);return}
  if(st.sel>=0&&(st.local||nodes.length>maxAll)){const s=st.sel,seen=new Map([[s,0]]);let fr=[s],ids=[s];for(let d=1;d<=st.depth;d++){const nx=[];fr.forEach(u=>{const nb=g.neighbors(u).filter(x=>vis(x.j)&&!seen.has(x.j)).sort((a,b)=>g.deg[b.j]-g.deg[a.j]);nb.forEach(x=>{if(!seen.has(x.j)&&ids.length<cap){seen.set(x.j,d);ids.push(x.j);nx.push(x.j)}})});fr=nx}
   ids.forEach(i=>viewNode(i,seen.get(i)));fromEdges(ids);const set=new Set(ids);ids.forEach(i=>{let h=0;g.neighbors(i).forEach(({j})=>{if(!set.has(j)&&vis(j))h++});VN[vmap.get(i)].hid=h});return}
  if(nodes.length>maxAll&&st.cl){if(!clusters)buildClusters();const exp=st.exp;
   clArr.forEach(c=>{if(exp[c.key]){c.members.filter(vis).slice(0,150).forEach(i=>viewNode(i,1))}else{const members=c.members.filter(vis);if(!members.length)return;const v=addVN({i:-1,key:"c"+c.key,cl:c.key,label:(c.group?c.group+" · ":"")+tlab(c.type),type:c.type,n:members.length,r:0,depth:0,hid:0});c.v=v}});
   const mapi=i=>{const v=vmap.get(i);if(v!=null)return v;const c=clArr[cOf[i]];return c&&!exp[c.key]?c.v:undefined};
   const agg=new Map();for(let k=0;k<g.EA.length;k++){const a=g.EA[k],b=g.EB[k];if(!vis(a)||!vis(b))continue;const x=mapi(a),y=mapi(b);if(x==null||y==null||x===y)continue;const key=x<y?x+"_"+y:y+"_"+x;let e=agg.get(key);if(!e){e=[x,y,0,"",0];agg.set(key,e);VE.push(e)}e[2]++}return}
  const ids=[];nodes.forEach((n,i)=>{if(vis(i))ids.push(i)});ids.forEach(i=>viewNode(i,0));fromEdges(ids)}
 function sizeOf(v){const n=v.cl?v.n:0;if(v.cl)return 14+Math.log10(n+1)*13;const d=v.i>=0?g.deg[v.i]:0;return Math.min(15,4.5+Math.sqrt(d)*1.35)}
 /* ----- layout ----- */
 const rngf=(()=>{let s=11;return()=>(s=(s*16807)%2147483647)/2147483647})();
 function layout(){const n=VN.length;if(!n)return;VN.forEach(v=>{v.r=sizeOf(v)});
  const prev=VN.map(v=>pos.get(v.key));const radial=st.mode==="walk"||(st.sel>=0&&st.mode!=="path"&&(st.local||nodes.length>maxAll));
  VN.forEach((v,j)=>{v.vx=0;v.vy=0;const p=prev[j];if(p){v.x=p[0];v.y=p[1];return}
   if(st.mode==="path"&&st.pathR&&v.pin!=null){v.x=(v.pin-(st.pathR.nodes.length-1)/2)*150;v.y=(rngf()-.5)*30;return}
   if(radial){const same=VN.filter(u=>u.depth===v.depth);const o=same.indexOf(v),a=o/Math.max(1,same.length)*6.283+v.depth*.8,r=v.depth*(st.mode==="walk"?150:105);v.x=Math.cos(a)*r+(rngf()-.5)*10;v.y=Math.sin(a)*r+(rngf()-.5)*10}
   else{const a=rngf()*6.283,r=Math.sqrt(rngf())*Math.sqrt(n)*34;v.x=Math.cos(a)*r;v.y=Math.sin(a)*r}v.vx=0;v.vy=0});
  const ticks=n<=60?260:n<=200?200:n<=450?140:100,len=st.mode==="walk"?90:n<=60?85:60,rep=n<=60?260:150;
  sim(ticks,len,rep,radial);VN.forEach(v=>pos.set(v.key,[v.x,v.y]))}
 function sim(ticks,len,rep,radial){const n=VN.length;let a=1;for(let t=0;t<ticks;t++){a*=.985;const CS=400,grid=new Map(),ck=(i,j)=>i*8192+j;if(n>400){for(let p=0;p<n;p++){const u=VN[p],k=ck(Math.floor(u.x/CS)+4096,Math.floor(u.y/CS)+4096);const b=grid.get(k);if(b)b.push(p);else grid.set(k,[p])}}
   const pair=(u,w)=>{let dx=u.x-w.x,dy=u.y-w.y,d2=dx*dx+dy*dy+.01;if(d2>(u.cl?160000:62500))return;const f=rep/d2*(1+(u.r+w.r)/40)*(u.cl&&w.cl?5:1),d=Math.sqrt(d2);dx=dx/d*f;dy=dy/d*f;u.vx+=dx;u.vy+=dy;w.vx-=dx;w.vy-=dy};
   if(n>400){grid.forEach((b,k)=>{const ci=Math.floor(k/8192),cj=k%8192;for(let a=0;a<b.length;a++){for(let c=a+1;c<b.length;c++)pair(VN[b[a]],VN[b[c]])}for(const[di,dj]of[[1,-1],[1,0],[1,1],[0,1]]){const o=grid.get(ck(ci+di,cj+dj));if(o)for(const a of b)for(const c of o)pair(VN[a],VN[c])}})}
   else for(let p=0;p<n;p++){const u=VN[p];for(let q=p+1;q<n;q++)pair(u,VN[q])}
   for(const e of VE){const u=VN[e[0]],w=VN[e[1]];let dx=w.x-u.x,dy=w.y-u.y;const d=Math.sqrt(dx*dx+dy*dy)+.01,l=(u.pin!=null&&w.pin!=null?150:len+(u.r+w.r)*(u.cl?1.8:.6)),f=(d-l)*.012*Math.min(1,.5+a);dx=dx/d*f;dy=dy/d*f;u.vx+=dx;u.vy+=dy;w.vx-=dx;w.vy-=dy}
   for(const v of VN){if(radial&&v.depth>=0){const r=Math.sqrt(v.x*v.x+v.y*v.y)+.01,tr=v.depth*(st.mode==="walk"?150:105),f=(tr-r)*.045*(v.depth===0?3:1);v.vx+=v.x/r*f;v.vy+=v.y/r*f}if(v.pin!=null)v.vy-=v.y*.06;v.vx-=v.x*.0016;v.vy-=v.y*.0016;v.vx*=.82;v.vy*=.82;v.x+=v.vx;v.y+=v.vy}}
  VN.forEach(v=>{v.vx=0;v.vy=0})}
 function fit(){if(!VN.length||!W)return;let a=1e9,b=-1e9,c=1e9,d=-1e9;VN.forEach(v=>{a=Math.min(a,v.x-v.r);b=Math.max(b,v.x+v.r);c=Math.min(c,v.y-v.r);d=Math.max(d,v.y+v.r)});const top=44,bot=70,H2=Math.max(120,Hh-top-bot),k=Math.min(W/(b-a+90),H2/(d-c+90),VN.length<12?1.6:2.4);st.view={k,x:W/2-(a+b)/2*k,y:top+H2/2-(c+d)/2*k}}
 /* ----- draw ----- */
 const matchSet=()=>{const q=st.q.trim().toLowerCase();if(!q||st.q.length<2)return null;const s=new Set();VN.forEach((v,j)=>{if(v.label&&v.label.toLowerCase().includes(q))s.add(j)});return s};
 function focusIdx(){if(st.hov>=0)return st.hov;if(st.sel<0)return -1;if(st.mode==="walk"&&st.walkR&&st.sel===st.walkR.start)return -1;if(st.mode==="path"&&st.pathR)return -1;const f=vmap.get(st.sel);return f==null?-1:f}
 function draw(now){if(!cv||!cv.isConnected||!alive)return;now=now||performance.now();const {k,x:ox,y:oy}=st.view;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,Hh);ctx.translate(ox,oy);ctx.scale(k,k);
  const f=focusIdx(),adjSet=new Set();if(f>=0){adjSet.add(f);VE.forEach(e=>{if(e[0]===f)adjSet.add(e[1]);else if(e[1]===f)adjSet.add(e[0])})}
  const pathSet=new Set(),pathE=new Set();if(st.mode==="path"&&st.pathR){st.pathR.nodes.forEach(i=>pathSet.add(vmap.get(i)));st.pathR.steps.forEach(s=>{const a=vmap.get(s.from),b=vmap.get(s.to);pathE.add(a<b?a+"_"+b:b+"_"+a)})}
  const wSel=st.mode==="walk"&&st.walkR&&st.sel>=0&&st.sel!==st.walkR.start?new Set(st.walkR.pathTo(st.sel).flatMap(s=>[vmap.get(s.to),vmap.get(s.from)])):null;
  const mt=matchSet(),emph=f>=0||pathSet.size>0||(wSel&&wSel.size>0)||!!mt;const flow=!reduce();
  const muted=cc("--muted"),acc=cc("--accent"),ink=cc("--ink"),warn=cc("--warn-f");
  const isHot=e=>f>=0&&(e[0]===f||e[1]===f);const key=e=>e[0]<e[1]?e[0]+"_"+e[1]:e[1]+"_"+e[0];
  /* edges: three passes */
  const base=[],hot=[],pth=[];VE.forEach(e=>{if(isHot(e))hot.push(e);else if(pathE.size&&pathE.has(key(e)))pth.push(e);else if(wSel&&wSel.has(e[0])&&wSel.has(e[1]))pth.push(e);else base.push(e)});
  const strokeSet=(L,col,al,w,dash)=>{if(!L.length)return;ctx.beginPath();L.forEach(e=>{const u=VN[e[0]],v=VN[e[1]];if(!u||!v)return;ctx.moveTo(u.x,u.y);ctx.lineTo(v.x,v.y)});ctx.strokeStyle=col;ctx.globalAlpha=al;ctx.lineWidth=w/Math.pow(k,.45);if(dash){ctx.setLineDash(dash);ctx.lineDashOffset=flow?-(now/1000*38)/Math.pow(k,.2):0}else ctx.setLineDash([]);ctx.stroke();ctx.setLineDash([])};
  strokeSet(base,muted,emph?.05:(VN.length>300?.12:.2),1);
  if(!VN.length&&alive){}
  strokeSet(hot,acc,.85,2,[7,7]);strokeSet(pth,warn,.95,2.8,[9,6]);
  if(k>1.1||hot.length||pth.length){ctx.fillStyle=muted;const arrow=(e,col)=>{if(!e[4]&&!e[3])return;const u=VN[e[0]],v=VN[e[1]];let dx=v.x-u.x,dy=v.y-u.y;const d=Math.sqrt(dx*dx+dy*dy)||1;dx/=d;dy/=d;const rev=(e[4]&2)&&!(e[4]&1);const tx=rev?u.x:v.x,ty=rev?u.y:v.y,sx=rev?-dx:dx,sy=rev?-dy:dy,r=(rev?u.r:v.r)+2,px=tx-sx*r,py=ty-sy*r,s=5/Math.pow(k,.5);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-sx*s*1.6+sy*s*.8,py-sy*s*1.6-sx*s*.8);ctx.lineTo(px-sx*s*1.6-sy*s*.8,py-sy*s*1.6+sx*s*.8);ctx.closePath();ctx.fillStyle=col;ctx.fill()};ctx.globalAlpha=.8;hot.forEach(e=>arrow(e,acc));pth.forEach(e=>arrow(e,warn));if(k>1.6&&VN.length<250){ctx.globalAlpha=.35;base.forEach(e=>arrow(e,muted))}}
  ctx.globalAlpha=1;const labs=[];
  VN.forEach((v,j)=>{const dim=(f>=0&&!adjSet.has(j))||(pathSet.size&&!pathSet.has(j)&&f<0)||(wSel&&!wSel.has(j)&&f<0)||(mt&&!mt.has(j)&&f<0&&!adjSet.has(j));const r=v.r*Math.min(1.5,Math.max(.8,Math.pow(k,.28))),col=cc(tcol(v.type));ctx.globalAlpha=dim?.13:1;const sh=(groups[v.type]||{}).shape||"circle";
   ctx.beginPath();if(v.cl){ctx.arc(v.x,v.y,r,0,6.283)}else if(sh==="square")ctx.rect(v.x-r*.9,v.y-r*.9,r*1.8,r*1.8);else if(sh==="diamond"){ctx.moveTo(v.x,v.y-r*1.15);ctx.lineTo(v.x+r*1.15,v.y);ctx.lineTo(v.x,v.y+r*1.15);ctx.lineTo(v.x-r*1.15,v.y);ctx.closePath()}else ctx.arc(v.x,v.y,r,0,6.283);
   if(v.cl){ctx.fillStyle=col;ctx.globalAlpha=dim?.1:.22;ctx.fill();ctx.globalAlpha=dim?.2:1;ctx.lineWidth=2.2/Math.pow(k,.3);ctx.strokeStyle=col;ctx.stroke()}
   else if(v.st==="stub"||v.st==="gap"){ctx.fillStyle=cc("--bg");ctx.fill();ctx.lineWidth=2/Math.pow(k,.3);ctx.strokeStyle=v.st==="gap"?warn:col;ctx.stroke()}
   else{ctx.fillStyle=col;ctx.fill();if(v.st==="risk"||v.st==="stale"){ctx.lineWidth=2.2/Math.pow(k,.3);ctx.strokeStyle=cc("--bad-f");ctx.stroke()}}
   if(v.hid>0&&!dim){ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(v.x+r*.8,v.y-r*.8,2.6/Math.pow(k,.2),0,6.283);ctx.fillStyle=acc;ctx.fill()}
   if(j===st.hov||(st.sel>=0&&vmap.get(st.sel)===j)||(st.mode==="walk"&&st.walkR&&v.i===st.walkR.start)||st.A===v.i&&v.i>=0||st.B===v.i&&v.i>=0){ctx.globalAlpha=1;ctx.beginPath();ctx.arc(v.x,v.y,r+4.5,0,6.283);ctx.lineWidth=2.4/Math.pow(k,.3);ctx.strokeStyle=ink;ctx.stroke()}
   if(!dim&&(v.cl||adjSet.has(j)&&f>=0||(mt&&mt.has(j))||pathSet.has(j)||(wSel&&wSel.has(j))||VN.length<=30||k>2.3||(g&&v.i>=0&&g.deg[v.i]>=Math.max(12,VN.length/10))||j===(st.sel>=0?vmap.get(st.sel):-1)))labs.push(v,r)});
  ctx.globalAlpha=1;ctx.font=`600 ${12.5/k}px Hanken Grotesk, system-ui, sans-serif`;ctx.textAlign="center";const used=[];
  for(let q=0;q<labs.length;q+=2){const v=labs[q],r=labs[q+1];let t=v.cl?v.label+" ("+v.n.toLocaleString("en-US")+")":v.label;if(t.length>34)t=t.slice(0,32)+"…";const yy=v.y+r+14/k,ww=t.length*6.6/k;if(!(v.i>=0&&v.i===st.sel)&&used.some(u=>Math.abs(u[0]-v.x)<(u[2]+ww)/2&&Math.abs(u[1]-yy)<14/k))continue;used.push([v.x,yy,ww]);ctx.lineWidth=3.5/k;ctx.strokeStyle=cc("--bg");ctx.strokeText(t,v.x,yy);ctx.fillStyle=ink;ctx.fillText(t,v.x,yy)}
  if(st.mode==="walk"&&st.walkR&&VN.length){/* ring guides */ctx.globalAlpha=.12;ctx.setLineDash([4/k,6/k]);ctx.lineWidth=1/k;ctx.strokeStyle=muted;for(let d=1;d<st.walkR.byD.length;d++){ctx.beginPath();ctx.arc(0,0,d*150,0,6.283);ctx.stroke()}ctx.setLineDash([]);ctx.globalAlpha=1}
 }
 function loop(now){raf=0;if(!alive||!cv||!cv.isConnected)return;draw(now);const animating=!reduce()&&(st.hov>=0||st.sel>=0||(st.mode==="path"&&st.pathR));if(animating)raf=requestAnimationFrame(loop)}
 const kick=()=>{if(!raf)raf=requestAnimationFrame(loop)};
 /* ----- view control ----- */
 function rebuild(refit){buildView();layout();if(refit!==false)fit();panels();stats();kick();draw()}
 function resize(){if(!cv)return;const r=cv.parentElement.getBoundingClientRect();if(!r.width)return;W=r.width;Hh=r.height;dpr=Math.min(2,window.devicePixelRatio||1);cv.width=W*dpr;cv.height=Hh*dpr;cv.style.width=W+"px";cv.style.height=Hh+"px"}
 function hit(mx,my){const {k,x,y}=st.view,gx=(mx-x)/k,gy=(my-y)/k;let best=-1,bd=1e9;for(let j=0;j<VN.length;j++){const v=VN[j],r=v.r*Math.min(1.5,Math.max(.8,Math.pow(k,.28)))+3/Math.pow(k,.3),dx=v.x-gx,dy=v.y-gy,d=dx*dx+dy*dy;if(d<r*r&&d<bd){bd=d;best=j}}return best}
 function anim(tx,ty,tk){const v0={...st.view},t1=performance.now();const step=t=>{const p=Math.min(1,(t-t1)/360),e=1-Math.pow(1-p,3);st.view={k:v0.k+(tk-v0.k)*e,x:v0.x+(tx-v0.x)*e,y:v0.y+(ty-v0.y)*e};draw();if(p<1&&alive)requestAnimationFrame(step)};requestAnimationFrame(step)}
 /* ----- public actions ----- */
 const find=id=>g.idx.get(id);
 function select(id,o){o=o||{};const i=typeof id==="number"?id:find(id);if(i==null||i<0){st.sel=-1;rebuild();return}st.sel=i;
  const inWalk=st.mode==="walk"&&st.walkR,inPath=st.mode==="path"&&st.pathR&&!st.pathR.none;
  if(!o.refocus&&((inWalk&&st.walkR.depth.has(i))||inPath)){panels();draw();kick();emit(i);return}
  if(o.refocus&&(inWalk||inPath)){st.mode="explore";st.pathR=null;st.walkR=null;modeUI()}
  if(st.mode==='explore'&&!st.local&&nodes.length<=maxAll){panels();draw();kick();emit(i);return}
  rebuild();emit(i)}
 function emit(i){if(cfg.onSelect)try{cfg.onSelect(nodes[i].id,nodes[i],ctl)}catch(e){}}
 function setMode(m){st.mode=m;if(m==="explore"){st.pathR=null;st.walkR=null}if(m==="path")st.walkR=null;if(m==="walk")st.pathR=null;rebuild();modeUI()}
 function doPath(a,b,o){const A=typeof a==="number"?a:find(a),B=typeof b==="number"?b:find(b);if(A==null||B==null||A<0||B<0)return null;st.A=A;st.B=B;if(o&&o.directed!=null)st.directed=!!o.directed;const r=g.path(A,B,{directed:st.directed});st.mode="path";st.pathR=r||{nodes:[],steps:[],none:true};st.walkR=null;rebuild();modeUI();return r}
 function doWalk(id,o){const s=typeof id==="number"?id:find(id);if(s==null||s<0)return null;o=o||{};if(o.dir)st.wdir=o.dir;if(o.depth)st.wdepth=o.depth;if(o.types)st.wtypes=o.types;st.sel=s;st.mode="walk";st.pathR=null;st.walkR=g.walk(s,{dir:st.wdir,depth:st.wdepth,types:st.wtypes});pos=new Map();rebuild();modeUI();return st.walkR}
 /* ----- DOM ----- */
 const typesPresent=()=>{const m={};nodes.forEach(n=>{m[n.type]=(m[n.type]||0)+1});return m};
 function build(){el.classList.add("gx");el.innerHTML=`<div class="gx-bar"><div class="gx-search"><input type="search" class="fin" placeholder="Search ${nodes.length.toLocaleString("en-US")} nodes" aria-label="Search the graph" data-gx-q><div class="gx-res" hidden data-gx-res></div></div><div class="gx-seg" role="group" aria-label="Mode"><button data-gx-mode="explore">Explore</button><button data-gx-mode="path">Find path</button><button data-gx-mode="walk">Dot-walk impact</button></div><div class="gx-seg" role="group" aria-label="Neighborhood depth" data-gx-depthseg>${[1,2,3].map(d=>`<button data-gx-depth="${d}" title="Show ${d} step${d>1?"s":""} around the selection">${d}</button>`).join("")}</div><div class="gx-seg" role="group" aria-label="View"><button data-gx-zoom="1.3" aria-label="Zoom in">+</button><button data-gx-zoom=".77" aria-label="Zoom out">−</button><button data-gx-fit>Fit</button><button data-gx-reset title="Clear selection and show the overview">Overview</button></div></div>
 <div class="gx-main"><div class="gx-cv" style="height:${height}px"><canvas role="img" aria-label="Interactive graph of ${nodes.length} records and relationships. Use the panel beside it for a text version."></canvas><div class="gx-tip" hidden></div><div class="gx-stat" data-gx-stat></div><div class="gx-leg" data-gx-leg></div></div><aside class="gx-side" data-gx-side aria-live="polite"></aside></div>`;
  cv=el.querySelector("canvas");ctx=cv.getContext("2d");tipEl=el.querySelector(".gx-tip");panelEl=el.querySelector("[data-gx-side]");legendUI();modeUI();bind()}
 function legendUI(){const tp=typesPresent();el.querySelector("[data-gx-leg]").innerHTML=Object.keys(tp).sort((a,b)=>tp[b]-tp[a]).map(t=>`<button data-gx-type="${E(t)}" aria-pressed="${!st.hide[t]}" title="Show or hide ${E(tlab(t))} (${tp[t].toLocaleString("en-US")})"><i style="background:var(${tcol(t)})"></i>${E(tlab(t))} <span>${tp[t].toLocaleString("en-US")}</span></button>`).join("")+`<span class="gx-note"><i class="gx-hollow"></i>Gap or stub</span><span class="gx-note"><i class="gx-ring"></i>At risk</span>`}
 function modeUI(){el.querySelectorAll("[data-gx-mode]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.gxMode===st.mode));el.querySelectorAll("[data-gx-depth]").forEach(b=>{b.setAttribute("aria-pressed",+b.dataset.gxDepth===st.depth);b.disabled=st.mode!=="explore"});panels()}
 function stats(){const s=el.querySelector("[data-gx-stat]");if(!s)return;const big=nodes.length>maxAll;const cl=VN.some(v=>v.cl);s.textContent=(st.mode==="walk"&&st.walkR?"Dot-walk: ":st.mode==="path"&&st.pathR?"Path: ":st.sel>=0?"Neighborhood: ":cl?"Overview, grouped: ":"All: ")+VN.length.toLocaleString("en-US")+(cl?" groups":" nodes")+" shown of "+nodes.length.toLocaleString("en-US")+(big&&!cl?" · more hidden":"")}
 const nbChip=(i,extra)=>`<button class="chip gx-chip" data-gx-pick="${i}"><i style="background:var(${tcol(nodes[i].type)})"></i>${E(nodes[i].label)}${extra||""}</button>`;
 const relL=k=>E(g.ET[k]||"relates to");
 function selHTML(){if(st.sel<0)return `<div class="gx-empty"><b>Pick a node</b><span class="muted small">Select a dot or search. You will see its properties, what it links to, and who links back. ${nodes.length>maxAll?"Big graphs open as groups; click a group to open it, or search for a record to see only its neighborhood.":""}</span></div>`;
  const i=st.sel,n=nodes[i],nb=g.neighbors(i);const by={};nb.forEach(x=>{(by[nodes[x.j].type]=by[nodes[x.j].type]||[]).push(x)});
  const lr=lrHTML({id:"gxnb_"+uid,limit:5,groups:Object.keys(by).sort((a,b)=>by[b].length-by[a].length).map(t=>({key:t,label:tlab(t),rows:by[t].sort((a,b)=>g.deg[b.j]-g.deg[a.j]).map(x=>({id:nodes[x.j].id,t:nodes[x.j].label,sub:(x.dir==="out"?"→ ":"← ")+(g.ET[x.k]||"relates to"),tag:nodes[x.j].sub||"",st:nodes[x.j].st==="risk"?"bad":nodes[x.j].st==="stale"||nodes[x.j].st==="gap"?"warn":"mute",go:()=>ctl.select(x.j,{center:1,refocus:1})}))}))});
  return `<div class="eyebrow">${E(tlab(n.type))}${n.sub?" · "+E(n.sub):""}</div><h3 class="gx-h">${E(n.label)}</h3><dl class="kv gx-kv"><dt>Links</dt><dd class="num" data-role="metric">${g.O[i].length} out · ${g.I[i].length} in</dd>${n.w!=null&&n.w!==""?`<dt>${E(cfg.weightLabel||"Weight")}</dt><dd class="num" data-role="metric">${(+n.w).toLocaleString("en-US")}</dd>`:""}${n.st?`<dt>Flag</dt><dd><span class="pill ${n.st==="risk"?"bad":"warn"}">${E(n.st)}</span></dd>`:""}</dl>${cfg.panel?cfg.panel(n,ctl):""}
  <div class="row gx-act"><button class="btn primary" data-gx-focus="${i}">Show neighborhood</button><button class="btn" data-gx-walkfrom="${i}">Dot-walk from here</button><button class="btn quiet" data-gx-setA="${i}">Path start</button><button class="btn quiet" data-gx-setB="${i}">Path end</button>${cfg.open?`<button class="btn quiet" data-gx-open="${i}">Open record</button>`:""}</div><div class="gx-sec"><b>Linked records (${nb.length})</b>${lr}</div>`}
 function pathHTML(){const A=st.A>=0?nodes[st.A]:null,B=st.B>=0?nodes[st.B]:null,r=st.pathR;
  let out=`<div class="gx-sec"><b>Find the path between two records</b><div class="gx-ab"><div><span class="eyebrow">From</span><div class="gx-pick">${A?nbChip(st.A):'<span class="muted small">Select a node, then press Path start</span>'}</div></div><div><span class="eyebrow">To</span><div class="gx-pick">${B?nbChip(st.B):'<span class="muted small">Select a node, then press Path end</span>'}</div></div></div><label class="gx-chk"><input type="checkbox" data-gx-directed ${st.directed?"checked":""}> Follow arrows only</label><div class="row"><button class="btn primary" data-gx-findpath ${A&&B?"":"disabled"}>Find shortest path</button><button class="btn quiet" data-gx-swap ${A&&B?"":"disabled"}>Swap</button></div></div>`;
  if(r&&r.none)out+=`<div class="gx-sec"><span class="pill warn">No path</span> <span class="muted small">These two records are not connected${st.directed?" in the arrow direction. Try without Follow arrows only":""}.</span></div>`;
  else if(r){const types=new Set(r.nodes.map(i=>nodes[i].type));out+=`<div class="gx-sec"><b>${r.steps.length} hop${r.steps.length===1?"":"s"} across ${types.size} kind${types.size===1?"":"s"} of record</b><ol class="gx-steps">${r.nodes.map((i,ix)=>`<li>${nbChip(i)}${ix<r.steps.length?`<span class="gx-rel">${r.steps[ix].dir==="out"?relL(r.steps[ix].k)+" →":"← "+relL(r.steps[ix].k)}</span>`:""}</li>`).join("")}</ol></div>`}
  return out}
 function walkHTML(){const w=st.walkR,s=st.sel>=0?nodes[st.sel]:null;const start=w?nodes[w.start]:s;
  let out=`<div class="gx-sec"><b>Dot-walk: follow relationships step by step</b><div class="gx-pick">${start?nbChip(w?w.start:st.sel):'<span class="muted small">Select a node to start from</span>'}</div>
  <span class="eyebrow">Direction</span><div class="gx-seg gx-seg2" role="group" aria-label="Walk direction">${[["in","Impact: what depends on it"],["out","Sources: what it depends on"],["both","Both ways"]].map(d=>`<button data-gx-wdir="${d[0]}" aria-pressed="${st.wdir===d[0]}">${d[1]}</button>`).join("")}</div>
  <span class="eyebrow">Steps</span><div class="gx-seg" role="group" aria-label="Walk depth">${[1,2,3,4,5,6].map(d=>`<button data-gx-wdepth="${d}" aria-pressed="${st.wdepth===d}">${d}</button>`).join("")}</div>
  ${relTypes.length?`<span class="eyebrow">Relationships to follow</span><div class="gx-rels">${relTypes.map(t=>`<button class="chip" data-gx-wtype="${E(t)}" aria-pressed="${!st.wtypes.length||st.wtypes.includes(t)}">${E(t)}</button>`).join("")}</div>`:""}
  <div class="row"><button class="btn primary" data-gx-runwalk ${start?"":"disabled"}>Walk</button></div></div>`;
  if(w){const rows=w.byD.slice(1).map((l,d)=>[d+1,l.length]);const mx=Math.max(...rows.map(r=>r[1]),1);out+=`<div class="gx-sec"><b>${w.reached.toLocaleString("en-US")} record${w.reached===1?"":"s"} reached in ${w.byD.length-1} step${w.byD.length===2?"":"s"}</b>${cfg.weightLabel?`<span class="muted small">${(+w.weight).toLocaleString("en-US")} ${E(cfg.weightLabel)} across them</span>`:""}<div class="gx-bars">${rows.map(r=>`<div><span>Step ${r[0]}</span><i style="width:${Math.max(3,r[1]/mx*100)}%"></i><b class="num">${r[1].toLocaleString("en-US")}</b></div>`).join("")||'<span class="muted small">Nothing to walk to with these settings.</span>'}</div><div class="gx-types">${Object.entries(w.byType).filter(([t])=>t!==nodes[w.start].type||w.byType[t]>1).sort((a,b)=>b[1]-a[1]).map(([t,c])=>`<span class="pill mute"><i class="gx-dot" style="background:var(${tcol(t)})"></i>${E(tlab(t))} ${c.toLocaleString("en-US")}</span>`).join(" ")}</div></div>`;
   if(st.sel>=0&&st.sel!==w.start&&w.depth.has(st.sel)){const p=w.pathTo(st.sel);out+=`<div class="gx-sec"><b>How the walk reaches ${E(nodes[st.sel].label)}</b><ol class="gx-steps"><li>${nbChip(w.start)}</li>${p.map(s=>`<li><span class="gx-rel">${s.dir==="out"?relL(s.k)+" →":"← "+relL(s.k)}</span>${nbChip(s.to)}</li>`).join("")}</ol></div>`}
   else out+=`<div class="gx-sec"><span class="muted small">Select any reached dot to see the path the walk took to get there.</span></div>`;
   const top=w.order.slice(1).sort((a,b)=>(+nodes[b].w||0)-(+nodes[a].w||0)||g.deg[b]-g.deg[a]).slice(0,6);if(top.length)out+=`<div class="gx-sec"><b>Largest reached</b><div class="gx-chips">${top.map(i=>nbChip(i,`<small class="muted"> step ${w.depth.get(i)}</small>`)).join("")}</div></div>`}
  return out}
 function panels(){if(!panelEl)return;panelEl.innerHTML=(st.mode==="path"?pathHTML():st.mode==="walk"?walkHTML():"")+`<div class="gx-selbox">${selHTML()}</div>`}
 function searchRun(q){const box=el.querySelector("[data-gx-res]");q=q.trim().toLowerCase();if(q.length<2){box.hidden=true;return}const r=[];for(let i=0;i<nodes.length&&r.length<9;i++){const n=nodes[i];if(n.label.toLowerCase().includes(q)||(n.sub||"").toLowerCase().includes(q)||String(n.id).toLowerCase().includes(q))r.push(i)}
  box.innerHTML=r.map(i=>`<button data-gx-pick="${i}" data-gx-fromsearch><i style="background:var(${tcol(nodes[i].type)})"></i><span>${E(nodes[i].label)}<small>${E(tlab(nodes[i].type))}${nodes[i].sub?" · "+E(nodes[i].sub):""}</small></span></button>`).join("")||'<span class="muted small" style="padding:8px">No match</span>';box.hidden=false}
 function bind(){const rect=()=>cv.getBoundingClientRect();
  cv.style.touchAction="none";cv.style.cursor="grab";
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);const r=rect(),mx=e.clientX-r.left,my=e.clientY-r.top;moved=false;drag={h:hit(mx,my),mx,my,v0:{...st.view}}};
  cv.onpointermove=e=>{const r=rect(),mx=e.clientX-r.left,my=e.clientY-r.top;if(drag){const dx=mx-drag.mx,dy=my-drag.my;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;if(moved){if(drag.h>=0){const v=VN[drag.h],k=st.view.k;v.x=(mx-st.view.x)/k;v.y=(my-st.view.y)/k;pos.set(v.key,[v.x,v.y]);draw()}else{st.view.x=drag.v0.x+dx;st.view.y=drag.v0.y+dy;draw()}}return}
   const h=hit(mx,my);if(h!==st.hov){st.hov=h;cv.style.cursor=h>=0?"pointer":"grab";if(h>=0){const v=VN[h];tipEl.hidden=false;tipEl.innerHTML=v.cl?`<b>${E(v.label)}</b><span>${v.n.toLocaleString("en-US")} records. Click to open this group.</span>`:`<b>${E(v.label)}</b><span>${E(tlab(v.type))} · ${g.deg[v.i]} links${nodes[v.i].sub?" · "+E(nodes[v.i].sub):""}</span>`}else tipEl.hidden=true;kick();draw()}
   if(h>=0){tipEl.style.left=Math.min(W-230,mx+14)+"px";tipEl.style.top=Math.max(4,my-8)+"px"}};
  cv.onpointerup=e=>{const d=drag;drag=null;if(!d||moved)return;const v=d.h>=0?VN[d.h]:null;if(!v){if(st.sel>=0&&st.mode==="explore"){}return}if(v.cl){st.exp[v.cl]=true;rebuild();return}select(v.i,{})};
  cv.onpointerleave=()=>{if(st.hov>=0&&!drag){st.hov=-1;tipEl.hidden=true;draw()}};
  cv.ondblclick=e=>{const r=rect(),h=hit(e.clientX-r.left,e.clientY-r.top);if(h>=0&&!VN[h].cl){st.sel=VN[h].i;st.mode="explore";st.pathR=null;st.walkR=null;st.local=true;modeUI();rebuild()}};
  cv.onwheel=e=>{e.preventDefault();const r=rect(),mx=e.clientX-r.left,my=e.clientY-r.top,f=e.deltaY<0?1.12:.89,v=st.view,k=Math.max(.12,Math.min(9,v.k*f));st.view={k,x:mx-(mx-v.x)*k/v.k,y:my-(my-v.y)*k/v.k};draw()};
  el.onclick=e=>{const t=e.target.closest("[data-gx-mode],[data-gx-depth],[data-gx-zoom],[data-gx-fit],[data-gx-reset],[data-gx-type],[data-gx-pick],[data-gx-focus],[data-gx-walkfrom],[data-gx-setA],[data-gx-setB],[data-gx-findpath],[data-gx-swap],[data-gx-wdir],[data-gx-wdepth],[data-gx-wtype],[data-gx-runwalk],[data-gx-open]");if(!t)return;const d=t.dataset;
   if(d.gxMode){setMode(d.gxMode);return}
   if(d.gxDepth){st.depth=+d.gxDepth;if(st.sel>=0)st.local=true;if(st.sel>=0)rebuild();modeUI();return}
   if(d.gxZoom){const k=Math.max(.12,Math.min(9,st.view.k*+d.gxZoom)),v=st.view,cx=W/2,cy=Hh/2;st.view={k,x:cx-(cx-v.x)*k/v.k,y:cy-(cy-v.y)*k/v.k};draw();return}
   if(d.gxFit!==undefined){fit();draw();return}
   if(d.gxReset!==undefined){st.sel=-1;st.exp={};st.local=false;st.pathR=null;st.walkR=null;st.mode="explore";modeUI();rebuild();return}
   if(d.gxType){st.hide[d.gxType]=!st.hide[d.gxType];t.setAttribute("aria-pressed",!st.hide[d.gxType]);rebuild();return}
   if(d.gxPick!==undefined){const i=+d.gxPick;const box=el.querySelector("[data-gx-res]");if(box)box.hidden=true;if(d.gxFromsearch!==undefined){const inp=el.querySelector("[data-gx-q]");if(inp)inp.value="";st.q=""}select(i,{});return}
   if(d.gxFocus!==undefined){if(st.mode!=="explore"){st.mode="explore";st.pathR=null;st.walkR=null}st.sel=+d.gxFocus;st.local=true;modeUI();rebuild();return}
   if(d.gxWalkfrom!==undefined){doWalk(+d.gxWalkfrom,{});return}
   if(d.gxSeta!==undefined){st.A=+d.gxSeta;if(st.mode!=="path"){st.mode="path";st.walkR=null;modeUI();rebuild(false)}else panels();draw();return}
   if(d.gxSetb!==undefined){st.B=+d.gxSetb;if(st.mode!=="path"){st.mode="path";st.walkR=null;modeUI();rebuild(false)}else panels();draw();return}
   if(d.gxFindpath!==undefined){doPath(st.A,st.B);if(window.audit)audit("graph path search",nodes[st.A].label+" to "+nodes[st.B].label);return}
   if(d.gxSwap!==undefined){const a=st.A;st.A=st.B;st.B=a;doPath(st.A,st.B);return}
   if(d.gxWdir){st.wdir=d.gxWdir;if(st.walkR)doWalk(st.walkR.start,{});else panels();return}
   if(d.gxWdepth){st.wdepth=+d.gxWdepth;if(st.walkR)doWalk(st.walkR.start,{});else panels();return}
   if(d.gxWtype){const tp=d.gxWtype,all=relTypes;let cur=st.wtypes.length?st.wtypes.slice():all.slice();cur=cur.includes(tp)?cur.filter(x=>x!==tp):cur.concat(tp);st.wtypes=cur.length===all.length||!cur.length?[]:cur;if(st.walkR)doWalk(st.walkR.start,{});else panels();return}
   if(d.gxRunwalk!==undefined){const s=st.walkR?st.walkR.start:st.sel;doWalk(s,{});if(window.audit)audit("graph dot-walk",nodes[s].label+" · "+st.wdir+" · "+st.wdepth+" steps");return}
   if(d.gxOpen!==undefined&&cfg.open){cfg.open(nodes[+d.gxOpen].id,nodes[+d.gxOpen]);return}};
  el.oninput=e=>{if(e.target.matches("[data-gx-q]")){st.q=e.target.value;searchRun(st.q);draw()}if(e.target.matches("[data-gx-directed]"))st.directed=e.target.checked};
  el.onchange=e=>{if(e.target.matches("[data-gx-directed]")){st.directed=e.target.checked;if(st.pathR)doPath(st.A,st.B)}};
  el.onkeydown=e=>{if(e.key==="Enter"&&e.target.matches("[data-gx-q]")){const b=el.querySelector("[data-gx-res] button");if(b)b.click()}}}
 const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>{if(!cv||!cv.isConnected){return}const ow=W;resize();if(W){if(!ow)fit();draw()}}):null;
 setData(cfg.nodes||[],cfg.edges||[]);build();resize();if(ro)ro.observe(cv.parentElement);
 const ctl={select,focus:id=>{const i=typeof id==="number"?id:find(id);if(i==null)return;st.mode="explore";st.pathR=null;st.walkR=null;st.sel=i;st.local=true;modeUI();rebuild()},path:(a,b,o)=>doPath(a,b,o),walk:(id,o)=>doWalk(id,o),
  setData:(ns,es)=>{setData(ns,es);clusters=null;legendUI();el.querySelector("[data-gx-q]").placeholder="Search "+ns.length.toLocaleString("en-US")+" nodes";rebuild()},fit:()=>{fit();draw()},resize:()=>{resize();fit();draw()},
  graph:()=>g,state:()=>st,setMode,view:()=>({nodes:VN.length,edges:VE.length,clusters:VN.filter(v=>v.cl).length}),destroy:()=>{alive=false;if(ro)ro.disconnect()}};
 if(cfg.focus!=null&&find(cfg.focus)!=null){st.sel=find(cfg.focus);if(st.mode==="walk")doWalk(st.sel,{});else rebuild()}else rebuild();
 return ctl}
/* ---------- public ---------- */
const mounted={};
const api={graph,
 render(elOrId,cfg){const el=typeof elOrId==="string"?document.getElementById(elOrId)||document.querySelector(elOrId):elOrId;if(!el)return null;if(el._gx)try{el._gx.destroy()}catch(e){}const c=create(el,cfg);el._gx=c;return c},
 host(id,o){return `<div class="gx glass" id="${E(id)}" data-gx-host="${E(id)}" style="min-height:${(o&&o.h||560)+60}px"><div class="gx-loading muted small" style="padding:20px">Loading graph</div></div>`},
 mount(id,cfg){setTimeout(()=>{const el=document.getElementById(id);if(!el)return;const c=api.render(el,cfg);mounted[id]=c},0)},
 get(id){return mounted[id]}};
return api})();
window.GRAPHX=GRAPHX;
})();
