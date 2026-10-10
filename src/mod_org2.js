/* ===== mod_org2: the Org chart screen, Reporting structures, People directory, Ownership and the person profile drawer (prefix org). ===== */
(function(){
const O=window.ORGX,OS=S.org;
const H=s=>esc(s==null?"":String(s));
const first=n=>String(n).split(" ")[0];
const pctCls=p=>p>95?"bad":p>75?"warn":"good";
const lvlCls=l=>l>=4?"bad":l===3?"warn":l>=1?"info":"mute";
const root="Catherine Doyle";
const DWHY={"Aaron Whitfield":"Security standards for every design","Owen Pryce":"Adoption approach set by change management","Femi Adeyemi":"Portfolio analytics","Leila Haddad":"Editorial voice for standards content","Imran Sheikh":"Security alerts handed to the service desk","Victor Amaya":"Technology finance reporting for the portfolio","Camille Ortega":"Contract terms and obligations","Kenji Watanabe":"AI risk and legal review","Nia Brooks":"Release and portfolio calendar"};
const PNAME=id=>{try{return PROJ.find(p=>p.id===id).short||PROJ.find(p=>p.id===id).n}catch(e){return id}};
const PLEAD=id=>{try{return PROJ.find(p=>p.id===id).owner}catch(e){return ""}};
/* ---------- the tree for the chosen view ---------- */
function agBySponsor(){const m={};O.agents().forEach(a=>(m[a.sponsor]=m[a.sponsor]||[]).push(a));return m}
function match(p){const f=OS.f;if(f.team&&p.unit!==f.team)return false;const n=(agBySponsor()[p.n]||[]).length;if(f.agents==="has"&&!n)return false;if(f.agents==="none"&&n)return false;if(f.load==="over"){let l=60;try{l=workload(p.n).pct}catch(e){}if(l<=90)return false}return true}
function filtersOn(){const f=OS.f;return !!(f.team||f.agents||f.load)}
function forceOpenSet(){const q=(OS.q||"").trim().toLowerCase(),s=new Set();if(!q)return s;O.staff.forEach(p=>{if(hit(p,q))O.up(p.n).forEach(u=>s.add(u))});return s}
function hit(p,q){return (p.n+" "+p.role+" "+p.unit+" "+p.fn.join(" ")).toLowerCase().indexOf(q)>=0}
function buildTree(){
 const mode=OS.mode,ag=agBySponsor(),fo=forceOpenSet(),q=(OS.q||"").trim().toLowerCase();
 const keep=n=>mode!=="ai"||(ag[n]&&ag[n].length)||O.kids(n).some(keep);
 const total=n=>{let t=0;const g=x=>O.kids(x).forEach(k=>{t++;g(k)});g(n);return t};
 const node=n=>{const p=O.P(n),col=!!OS.collapsed[n]&&!fo.has(n);const nd={id:n,t:"h",p,kids:[],col};
  if(!col){O.kids(n).filter(keep).forEach(k=>nd.kids.push(node(k)));if(mode!=="human")(ag[n]||[]).forEach(a=>nd.kids.push({id:"ag:"+a.name,t:"a",a,kids:[]}))}
  nd.nKids=O.kids(n).filter(keep).length;nd.hidden=col?total(n)+(mode!=="human"?(ag[n]||[]).length:0):0;nd.nAg=(ag[n]||[]).length;
  nd.hit=!!q&&hit(p,q);nd.dim=(filtersOn()&&!match(p))||(!!q&&!nd.hit&&false);return nd};
 return node(root)}
const CW=224,CH=78,AH=62,GX=22,GY=48,IND=28,SG=10;
const sz=nd=>nd.t==="a"?AH:CH;
function lay(nd){const h=sz(nd);if(!nd.kids.length){nd.w=CW;nd.h=h;nd.blocks=[];nd.tw=CW;return}
 nd.kids.forEach(lay);const lv=nd.kids.filter(k=>!k.kids.length),sb=nd.kids.filter(k=>k.kids.length),bl=[];
 if(lv.length)bl.push({s:1,items:lv,w:CW+IND,h:lv.reduce((a,k)=>a+sz(k),0)+SG*(lv.length-1)});
 sb.forEach(k=>bl.push({s:0,node:k,w:k.w,h:k.h}));
 nd.tw=bl.reduce((a,b)=>a+b.w,0)+GX*(bl.length-1);nd.blocks=bl;nd.w=Math.max(CW,nd.tw);nd.h=h+GY+Math.max(...bl.map(b=>b.h))}
function put(nd,x,y,o){const h=sz(nd);nd.y=y;o.cards.push(nd);
 if(!nd.kids.length){nd.x=x+(nd.w-CW)/2;return}
 const bx0=x+(nd.w-nd.tw)/2,single=nd.blocks.length===1&&nd.blocks[0].s;
 nd.x=single?bx0:x+(nd.w-CW)/2;
 const by=y+h+GY,busY=y+h+GY/2,px=nd.x+CW/2,drops=[];let cx=bx0;
 nd.blocks.forEach(b=>{
  if(b.s){const sx=cx+14;let cy=by,lastMid=by;b.items.forEach(k=>{k.x=cx+IND;k.y=cy;o.cards.push(k);lastMid=cy+sz(k)/2;o.e.push("M"+sx+" "+lastMid+"H"+k.x);cy+=sz(k)+SG});
   o.e.push("M"+sx+" "+(single?y+h:busY)+"V"+lastMid);if(!single)drops.push(sx)}
  else{put(b.node,cx,by,o);const cxp=b.node.x+CW/2;drops.push(cxp);o.e.push("M"+cxp+" "+busY+"V"+by)}
  cx+=b.w+GX});
 if(!single){const lo=Math.min(px,...drops),hi=Math.max(px,...drops);o.e.push("M"+px+" "+(y+h)+"V"+busY);o.e.push("M"+lo+" "+busY+"H"+hi)}}
function layout(){const t=buildTree();lay(t);const o={cards:[],e:[],dot:[],mx:[]};put(t,20,20,o);o.W=t.w+40;o.H=t.h+40;o.root=t;
 const by={};o.cards.forEach(c=>by[c.id]=c);o.by=by;
 const curve=(a,b,cls,id)=>{if(!a||!b)return;const aR=a.x>b.x;const x1=aR?a.x:a.x+CW,y1=a.y+sz(a)/2,x2=aR?b.x+CW:b.x,y2=b.y+sz(b)/2;const dx=Math.max(50,Math.abs(x2-x1)*.35)*(aR?-1:1);return `<path class="org-ln ${cls}" data-for="${H(id)}" d="M${x1} ${y1}C${x1+dx} ${y1} ${x2-dx} ${y2} ${x2} ${y2}"/>`};
 if(OS.lines.dotted)O.staff.forEach(p=>{if(p.dot&&o.by[p.n]&&o.by[p.dot])o.dot.push(curve(o.by[p.n],o.by[p.dot],"dot",p.n))});
 if(OS.lines.matrix)O.staff.forEach(p=>p.mx.forEach(m=>{const l=PLEAD(m.p);if(l&&l!==p.n&&o.by[p.n]&&o.by[l])o.mx.push(curve(o.by[p.n],o.by[l],"mx",p.n))}));
 return o}
/* ---------- cards ---------- */
function loadOf(n){try{return workload(n).pct}catch(e){return 60}}
function cardHTML(c,sel){
 if(c.t==="a"){const a=c.a,L=O.LVL[a.autonomy];
  return `<div class="org-n org-ag ${a.status!=="running"?"off":""}" style="left:${c.x}px;top:${c.y}px;width:${CW}px;height:${AH}px"><button type="button" class="org-card ag" data-org-agent="${H(a.name)}" aria-label="${H(a.name)}, AI agent sponsored by ${H(a.sponsor)}, ${H(L.n)}, ${a.status}">${avatar(a.name,{size:30})}<span class="org-t"><b>${H(a.name)}</b><small>${H(L.n)} · ${a.hrs} h/week back</small></span><i class="org-st ${a.status==="running"?"good":a.status==="paused"?"warn":"bad"}" title="${H(a.status)}"></i></button></div>`}
 const p=c.p,l=loadOf(p.n),sp=O.kids(p.n).length;
 const cls=["org-n",c.hit?"hit":"",c.dim?"dim":"",sel===p.n?"sel":""].join(" ");
 const tg=(c.nKids||c.nAg)&&(c.nKids||(OS.mode!=="human"?0:0))?`<button type="button" class="org-tg" data-org-tg="${H(p.n)}" aria-expanded="${c.col?"false":"true"}" aria-label="${c.col?"Expand":"Collapse"} ${H(p.n)}'s team">${c.col?"+"+c.hidden:"−"}</button>`:"";
 return `<div class="${cls}" style="left:${c.x}px;top:${c.y}px;width:${CW}px;height:${CH}px"><button type="button" class="org-card" data-org-open="${H(p.n)}" aria-label="${H(p.n)}, ${H(p.role)}, ${sp} direct reports, load ${l} percent">${avatar(p.n,{size:38})}<span class="org-t"><b>${H(p.n)}</b><small>${H(p.role)}</small><span class="org-m"><em class="${pctCls(l)}">${l}% load</em>${sp?`<em>${sp} report${sp===1?"":"s"}</em>`:""}${c.nAg&&OS.mode==="human"?`<em class="ai">AI ${c.nAg}</em>`:""}${p.dot?`<em class="dt" title="Dotted line to ${H(p.dot)}">dotted</em>`:""}</span></span></button>${tg}</div>`}
function chartInner(o){
 const sel=OS.sel;return `<svg class="org-svg" width="${o.W}" height="${o.H}" viewBox="0 0 ${o.W} ${o.H}" aria-hidden="true"><path class="org-ln" d="${o.e.join("")}"/>${o.dot.join("")}${o.mx.join("")}</svg>${o.cards.map(c=>cardHTML(c,sel)).join("")}`}
/* outline: the accessible, phone-friendly view of the same tree */
function outline(nd,lvl){
 if(nd.t==="a"){const a=nd.a;return `<li role="treeitem" class="org-ol-a"><button type="button" class="org-ol" data-org-agent="${H(a.name)}">${avatar(a.name,{size:26})}<span><b>${H(a.name)}</b><small>AI agent · ${H(O.LVL[a.autonomy].n)} · ${a.status}</small></span></button></li>`}
 const p=nd.p,l=loadOf(p.n);const hasK=nd.nKids||nd.nAg;
 return `<li role="treeitem" aria-expanded="${hasK?!nd.col:"true"}"><div class="org-olrow">${hasK?`<button type="button" class="org-tg sm" data-org-tg="${H(p.n)}" aria-label="${nd.col?"Expand":"Collapse"} ${H(p.n)}">${nd.col?"+":"−"}</button>`:`<span class="org-tgsp"></span>`}<button type="button" class="org-ol ${nd.hit?"hit":""}" data-org-open="${H(p.n)}">${avatar(p.n,{size:30})}<span><b>${H(p.n)}</b><small>${H(p.role)} · ${l}% load${nd.nKids?` · ${nd.nKids} direct`:""}${nd.nAg?` · ${nd.nAg} agent${nd.nAg===1?"":"s"}`:""}</small></span></button></div>${nd.kids.length?`<ul role="group">${nd.kids.map(k=>outline(k)).join("")}</ul>`:""}</li>`}
/* ---------- the chart panel ---------- */
const MODES=[["human","Human","People and their reporting lines"],["ai","AI","Agents under the person who sponsors them"],["both","Human + AI","The whole team: people and their agents"]];
function chartPane(){
 const st=O.stats(),o=layout();const teams=[...new Set(O.staff.map(p=>p.unit))].sort();
 const phone=window.innerWidth<700;if(OS.outline==null||OS.outline===undefined)OS.outline=phone;
 const q=(OS.q||"").trim().toLowerCase(),nm=q?O.staff.filter(p=>hit(p,q)).length:0;
 return `<div class="org-bar card glass">
  <div class="org-seg" role="group" aria-label="Which reporting view">${MODES.map(m=>`<button type="button" data-org-mode="${m[0]}" aria-pressed="${OS.mode===m[0]}" title="${m[2]}">${m[1]}</button>`).join("")}</div>
  <label class="org-srch"><span class="org-so">Search the org chart</span><input class="txtin" type="search" data-org-q value="${H(OS.q)}" placeholder="Search people, roles, or what they do" aria-label="Search the org chart"><small data-org-qn>${q?nm+" match"+(nm===1?"":"es"):""}</small></label>
  <label class="org-sel"><span class="org-so">Filter by team</span><select class="txtin" data-org-f="team" aria-label="Filter by team"><option value="">All teams</option>${teams.map(t=>`<option ${OS.f.team===t?"selected":""}>${H(t)}</option>`).join("")}</select></label>
  <div class="org-chips" role="group" aria-label="Filters"><button type="button" class="chip" data-org-f="agents:has" aria-pressed="${OS.f.agents==="has"}">Has agents</button><button type="button" class="chip" data-org-f="agents:none" aria-pressed="${OS.f.agents==="none"}">No agents yet</button><button type="button" class="chip" data-org-f="load:over" aria-pressed="${OS.f.load==="over"}">Over 90% load</button></div>
  <div class="org-chips" role="group" aria-label="Lines"><button type="button" class="chip" data-org-ln="dotted" aria-pressed="${OS.lines.dotted}">Dotted lines</button><button type="button" class="chip" data-org-ln="matrix" aria-pressed="${OS.lines.matrix}">Project matrix</button></div>
  <div class="org-chips"><button type="button" class="chip" data-org-all="collapse">Collapse all</button><button type="button" class="chip" data-org-all="expand">Expand all</button><button type="button" class="chip" data-org-outline aria-pressed="${!!OS.outline}">Outline</button></div>
 </div>
 ${OS.outline?`<div class="card glass org-outline"><ul role="tree" aria-label="Organization outline">${outline(o.root)}</ul></div>`:`<div class="org-wrap card glass"><div class="org-vp" id="orgvp" tabindex="0" role="group" aria-label="Org chart. Drag to pan, use the buttons or plus and minus to zoom, arrow keys to move."><div class="org-cv" id="orgcv" style="width:${o.W}px;height:${o.H}px">${chartInner(o)}</div></div>
  <div class="org-zoom" role="group" aria-label="Zoom"><button type="button" class="btn" data-org-z="in" aria-label="Zoom in">+</button><button type="button" class="btn" data-org-z="out" aria-label="Zoom out">−</button><button type="button" class="btn" data-org-z="fit">Fit</button><button type="button" class="btn" data-org-z="reset">Top</button></div>
  <div class="org-hint muted small">Drag to pan. Ctrl or Command with scroll to zoom. Cards open the person profile.</div></div>`}
 <div class="org-lg">${legend([["Solid line: reports to","--ink"],["Dashed: dotted-line (functional) report","--accent"],["Long dash: project matrix lead","--warn-f"],["Dashed card: AI agent, sponsored by the person above","--p4"]])}</div>`}
/* ---------- pan and zoom (direct DOM, no re-render) ---------- */
let LAST=null;
function applyT(){const cv=document.getElementById("orgcv");if(!cv)return;cv.style.transform=`translate(${OS.x}px,${OS.y}px) scale(${OS.k})`;const z=document.querySelector(".org-zoom");if(z)z.dataset.k=Math.round(OS.k*100)}
function vp(){return document.getElementById("orgvp")}
function fit(top){const v=vp();if(!v||!LAST)return;const w=v.clientWidth,h=v.clientHeight;let k=Math.min(w/LAST.W,h/LAST.H,1);
 if(top){k=Math.max(Math.min(w/LAST.W,1),w<700?.5:.66);k=Math.min(k,1);const root=LAST.by[LAST.root.id];OS.k=k;OS.x=Math.round(w/2-(root.x+CW/2)*k);OS.y=12}
 else{k=Math.max(.22,k);OS.k=k;OS.x=Math.round((w-LAST.W*k)/2);OS.y=Math.round((h-LAST.H*k)/2)}applyT()}
function zoomAt(f,cx,cy){const v=vp();if(!v)return;const r=v.getBoundingClientRect();cx=cx==null?r.width/2:cx-r.left;cy=cy==null?r.height/2:cy-r.top;const k0=OS.k,k1=Math.max(.2,Math.min(1.6,k0*f));OS.x=cx-(cx-OS.x)*(k1/k0);OS.y=cy-(cy-OS.y)*(k1/k0);OS.k=k1;applyT()}
function paintChart(){const cv=document.getElementById("orgcv");if(!cv){render();return}LAST=layout();cv.style.width=LAST.W+"px";cv.style.height=LAST.H+"px";cv.innerHTML=chartInner(LAST);applyT()}
function mount(){
 if(S.screen!=="org_chart"||OS.tab!=="chart"||OS.outline)return;const v=vp();if(!v)return;LAST=layout();
 if(!OS.k||OS.k<=0)fit(true);else applyT();
 if(OS.q){const q=OS.q.toLowerCase(),m=O.staff.find(p=>hit(p,q));const c=m&&LAST.by[m.n];if(c){OS.x=Math.round(v.clientWidth/2-(c.x+CW/2)*OS.k);OS.y=Math.round(v.clientHeight/3-c.y*OS.k);applyT()}}}
const _ca=window.coreAfter;window.coreAfter=function(){if(_ca)_ca.apply(this,arguments);try{mount()}catch(e){console.error("org mount",e)}};
let drag=null;
document.addEventListener("pointerdown",e=>{const v=e.target.closest&&e.target.closest("#orgvp");if(!v||e.button!==0)return;if(e.target.closest("[data-org-tg]"))return;drag={x:e.clientX,y:e.clientY,ox:OS.x,oy:OS.y,m:false,id:e.pointerId}});
document.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.m&&Math.abs(dx)+Math.abs(dy)>5){drag.m=true;const v=vp();if(v){v.classList.add("pan");try{v.setPointerCapture(drag.id)}catch(x){}}}if(drag.m){OS.x=drag.ox+dx;OS.y=drag.oy+dy;applyT()}});
const endDrag=()=>{if(!drag)return;const m=drag.m;drag=null;const v=vp();if(v)v.classList.remove("pan");if(m){OS._moved=Date.now()}};
document.addEventListener("pointerup",endDrag);document.addEventListener("pointercancel",endDrag);
document.addEventListener("wheel",e=>{const v=e.target.closest&&e.target.closest("#orgvp");if(!v)return;if(e.ctrlKey||e.metaKey){e.preventDefault();zoomAt(e.deltaY<0?1.12:.89,e.clientX,e.clientY)}},{passive:false});
document.addEventListener("keydown",e=>{const v=e.target&&e.target.id==="orgvp"?e.target:null;if(!v)return;const st=60;
 if(e.key==="ArrowLeft"){OS.x+=st;applyT();e.preventDefault()}else if(e.key==="ArrowRight"){OS.x-=st;applyT();e.preventDefault()}else if(e.key==="ArrowUp"){OS.y+=st;applyT();e.preventDefault()}else if(e.key==="ArrowDown"){OS.y-=st;applyT();e.preventDefault()}
 else if(e.key==="+"||e.key==="="){zoomAt(1.15);e.preventDefault()}else if(e.key==="-"){zoomAt(.87);e.preventDefault()}else if(e.key==="0"){fit(false);e.preventDefault()}});
/* ---------- screen events ---------- */
let qT=null;
document.addEventListener("click",e=>{
 const g=e.target.closest&&e.target.closest("[data-org-open],[data-org-agent],[data-org-tg],[data-org-mode],[data-org-f],[data-org-ln],[data-org-all],[data-org-outline],[data-org-z],[data-org-tab],[data-org-rv],[data-org-reset]");if(!g)return;
 if(OS._moved&&Date.now()-OS._moved<250&&g.closest("#orgvp")){e.preventDefault();e.stopPropagation();return}
 const d=g.dataset;
 if(d.orgTg!=null){e.preventDefault();e.stopPropagation();const n=d.orgTg;OS.collapsed[n]=!OS.collapsed[n];audit("Org chart",(OS.collapsed[n]?"Collapsed ":"Expanded ")+n+"'s team");if(OS.outline)render();else paintChart();return}
 if(d.orgMode){OS.mode=d.orgMode;OS.k=0;audit("Org chart view",d.orgMode);render();return}
 if(d.orgF!=null){const v=d.orgF;if(v.indexOf(":")>0){const [k,x]=v.split(":");OS.f[k]=OS.f[k]===x?"":x;render()}return}
 if(d.orgLn){OS.lines[d.orgLn]=!OS.lines[d.orgLn];render();return}
 if(d.orgAll){O.staff.forEach(p=>{if(O.kids(p.n).length)OS.collapsed[p.n]=d.orgAll==="collapse"&&p.n!==root});OS.k=0;render();return}
 if(d.orgOutline!=null){OS.outline=!OS.outline;OS.k=0;render();return}
 if(d.orgZ){if(d.orgZ==="in")zoomAt(1.2);else if(d.orgZ==="out")zoomAt(.83);else if(d.orgZ==="fit")fit(false);else fit(true);return}
 if(d.orgRv){OS.rv=d.orgRv;render();return}
 if(d.orgTab!=null&&!d.orgOpen){OS.tab=d.orgTab;render();return}
 if(d.orgAgent){e.preventDefault();openAgent(d.orgAgent);return}
 if(d.orgOpen){e.preventDefault();openProfile(d.orgOpen,d.orgTab!=null?+d.orgTab:null)}});
document.addEventListener("input",e=>{const q=e.target.closest&&e.target.closest("[data-org-q]");if(!q)return;OS.q=q.value;clearTimeout(qT);qT=setTimeout(()=>{if(OS.outline){render();return}paintChart();const m=OS.q.trim()?O.staff.filter(p=>hit(p,OS.q.trim().toLowerCase())).length:0;const n=document.querySelector("[data-org-qn]");if(n)n.textContent=OS.q.trim()?m+" match"+(m===1?"":"es"):"";mount()},160)});
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("select[data-org-f]");if(!s)return;OS.f[s.dataset.orgF]=s.value;render()});
/* ---------- tab 2: reporting structures ---------- */
function mgrRows(){return O.staff.filter(p=>O.kids(p.n).length).map(p=>{const k=O.kids(p.n).length,ag=O.agentsOf(p.n);const sub=[];const g=x=>O.kids(x).forEach(c=>{sub.push(c);g(c)});g(p.n);const subAg=sub.concat([p.n]).reduce((s,n)=>s+O.agentsOf(n).length,0);
 const hours=sub.reduce((s,n)=>s+(((O.dir(n)||{}).hrs)||40),0)+(((O.dir(p.n)||{}).hrs)||40);const ret=sub.concat([p.n]).reduce((s,n)=>s+O.capacity(n).returned,0);
 return{n:p.n,role:p.role,span:k,size:O.size(p.n),agents:ag.length,subAg,band:k>=3&&k<=9?"ok":k<3?"narrow":"wide",hours,ret:+ret.toFixed(1)}}).sort((a,b)=>b.size-a.size)}
function reportPane(){
 const rv=OS.rv||"human";const rows=mgrRows(),st=O.stats();
 const seg=`<div class="org-seg" role="group" aria-label="Reporting view">${MODES.map(m=>`<button type="button" data-org-rv="${m[0]}" aria-pressed="${rv===m[0]}">${m[1]}</button>`).join("")}</div>`;
 const bandPill=b=>`<span class="pill ${b==="ok"?"good":"warn"}">${b==="ok"?"Within 3 to 9":b==="narrow"?"Narrow span":"Wide span"}</span>`;
 const maxS=Math.max(...rows.map(r=>r.span));
 let body="";
 if(rv==="human"){
  const dots=O.staff.filter(p=>p.dot),mxs=O.staff.filter(p=>p.mx.length);
  body=`<div class="grid g2" style="align-items:start">
  ${card("Spans of control","Direct reports per manager. Healthy spans are 3 to 9.",`<div class="tscroll"><table><thead><tr><th>Manager</th><th>Direct</th><th>Whole team</th><th>Span</th></tr></thead><tbody>${rows.map(r=>`<tr><td><button type="button" class="org-lnk" data-org-open="${H(r.n)}"><b>${H(r.n)}</b><small>${H(r.role)}</small></button></td><td class="num">${r.span}</td><td class="num">${r.size}</td><td>${bandPill(r.band)}<div class="org-spb"><i style="width:${Math.round(100*r.span/maxS)}%"></i></div></td></tr>`).join("")}</tbody></table></div>`)}
  <div style="display:flex;flex-direction:column;gap:16px">
  ${card("Dotted-line (functional) reports",dots.length+" people take direction from a second leader without changing their manager.",`<div class="tscroll"><table><thead><tr><th>Person</th><th>Dotted line to</th><th>For</th></tr></thead><tbody>${dots.map(p=>`<tr><td>${pchip(p.n)}</td><td>${pchip(p.dot)}</td><td class="muted small">${H(DWHY[p.n]||"Functional guidance")}</td></tr>`).join("")}</tbody></table></div>`)}
  ${card("Project matrix",mxs.length+" people split their time across projects led by someone else.",`<div class="tscroll"><table><thead><tr><th>Person</th><th>Project and lead</th><th>Share</th></tr></thead><tbody>${mxs.map(p=>p.mx.map((m,i)=>`<tr>${i===0?`<td rowspan="${p.mx.length}">${pchip(p.n)}</td>`:""}<td>${H(PNAME(m.p))} <span class="muted small">led by ${H(PLEAD(m.p))}</span></td><td class="num">${m.pct}%</td></tr>`).join("")).join("")}</tbody></table></div>`)}
  </div></div>`}
 else if(rv==="ai"){
  const ags=O.agents(),by={};ags.forEach(a=>(by[a.sponsor]=by[a.sponsor]||[]).push(a));
  const lvl=k=>ags.filter(a=>a.autonomy===k).length;
  body=`<div class="statrow">${kpi("AI agents",String(ags.length),"each with a named human sponsor")}${kpi("Suggest only",String(lvl("suggest")),"a person does the work")}${kpi("Act with approval",String(lvl("approval")),"a person approves each action")}${kpi("Act within rules",String(lvl("act")),"low-risk, reversible work only")}${kpi("Fully governed",st.govPct+"%","sponsor, guardrails, kill switch",{metric:"m_org_gov"})}</div>
  ${card("Agents by sponsor","Every agent sits under the person accountable for it. They can pause or stop it at any time.",`<div class="tscroll"><table><thead><tr><th>Sponsor</th><th>Agents</th><th>Autonomy</th><th>Hours returned a week</th></tr></thead><tbody>${Object.keys(by).sort((a,b)=>by[b].length-by[a].length).map(s=>`<tr><td>${pchip(s)}</td><td>${by[s].map(a=>`<button type="button" class="chip" data-org-agent="${H(a.name)}">${H(a.name)}</button>`).join(" ")}</td><td>${by[s].map(a=>`<span class="pill ${a.autonomy==="act"?"warn":a.autonomy==="approval"?"info":"mute"}">${H(O.LVL[a.autonomy].short)}</span>`).join(" ")}</td><td class="num">${by[s].reduce((q,a)=>q+(a.realized!=null?a.realized:a.hrs),0).toFixed(1)}</td></tr>`).join("")}</tbody></table></div>`)}`}
 else{
  body=`<div class="statrow">${kpi("People",String(st.heads),"on the org chart")}${kpi("AI teammates",String(st.agents),"sponsored by "+st.covered+" leaders")}${kpi("Hours returned",st.returned+" h","a week, across the team",{metric:"m_org_cap"})}${kpi("Still available",st.open+" h","a week, in ranked opportunities")}</div>
  ${card("Capacity by leader: people plus agents","Contracted hours of the whole team, and the hours agents give back to them. Nobody's role is reduced; the hours are reinvested.",`<div class="tscroll"><table><thead><tr><th>Leader</th><th>People</th><th>Agents</th><th>Team hours</th><th>Hours returned</th><th>Uplift</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${pchip(r.n)}</td><td class="num">${r.size+1}</td><td class="num">${r.subAg}</td><td class="num">${r.hours}</td><td class="num">${r.ret}</td><td><div class="org-spb good"><i style="width:${Math.min(100,Math.round(r.ret/r.hours*100*6))}%"></i></div><small class="muted">${(100*r.ret/r.hours).toFixed(1)}%</small></td></tr>`).join("")}</tbody></table></div>`)}`}
 return `<div class="row sp" style="margin-bottom:12px">${seg}<span class="muted small">${st.heads} people, ${st.agents} AI agents, ${st.mgrs} managers, ${st.layers} layers, average span ${st.avgSpan}.</span></div>${body}`}
/* ---------- tab 3: people directory ---------- */
function dirPane(){
 const rows=()=>O.staff.map(p=>{const w=O.owns(p.n),n=w.metrics.length+w.procs.length+w.ents.length+w.svcs.length;return{n:p.n,role:p.role,unit:p.unit,mgr:p.mgr||"",loc:p.loc,direct:O.kids(p.n).length,ag:O.agentsOf(p.n).length,load:loadOf(p.n),owns:n,rl:(O.perms(p.n).role||{}).n||""}});
 return card("People directory","Everyone on the org chart, read from the people directory. Click a row for the full profile.",btHTML({id:"org_dir",cols:[{k:"n",label:"Person",fmt:r=>`<span class="org-dn">${avatar(r.n,{size:26})}<b>${H(r.n)}</b></span>`,val:r=>r.n},{k:"role",label:"Role"},{k:"unit",label:"Team"},{k:"mgr",label:"Reports to"},{k:"direct",label:"Direct",val:r=>r.direct},{k:"ag",label:"Agents",val:r=>r.ag},{k:"load",label:"Load",fmt:r=>`<span class="pill ${pctCls(r.load)}">${r.load}%</span>`,val:r=>r.load},{k:"owns",label:"Owns",val:r=>r.owns},{k:"rl",label:"Access role"}],rows,key:"n",h:560,rowH:46,facets:["unit","rl"],exportName:"meridian-org",open:id=>openProfile(id)}))}
/* ---------- tab 5: ownership ---------- */
function ownPane(){
 const oi=O.ownIndex(),st=O.stats();const un=oi.un;
 const unTbl=k=>{const m={};un[k].forEach(x=>{m[x.owner||"(blank)"]=(m[x.owner||"(blank)"]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8)};
 const kinds=[["metrics","Metrics"],["procs","Processes"],["ents","Data entities"],["svcs","Services"]];
 const rows=O.staff.map(p=>{const w=O.owns(p.n);return{p,w,t:w.metrics.length+w.procs.length+w.ents.length+w.svcs.length}}).filter(r=>r.t).sort((a,b)=>b.t-a.t);
 return `<div class="statrow">${kpi("Ownership coverage",oi.pct+"%","items owned by a named person",{metric:"m_org_own"})}${kpi("Items with a named owner",String(oi.named),"of "+oi.total+" metrics, processes, entities, services")}${kpi("Owner is a role or team",String(oi.total-oi.named),"fix by naming a person",{cls:oi.total-oi.named?"warn":""})}</div>
 <div class="grid g2" style="align-items:start">${card("Who owns the most","Computed from the owner fields in Metrics, the process library, the data registry and the service registry.",`<div class="tscroll"><table><thead><tr><th>Person</th><th>Metrics</th><th>Processes</th><th>Entities</th><th>Services</th></tr></thead><tbody>${rows.slice(0,14).map(r=>`<tr><td>${pchip(r.p.n)}</td><td class="num">${r.w.metrics.length}</td><td class="num">${r.w.procs.length}</td><td class="num">${r.w.ents.length}</td><td class="num">${r.w.svcs.length}</td></tr>`).join("")}</tbody></table></div>`)}
 ${card("Owner fields that do not name a person","These registry items name a team or a distributed role. Open the person who should own them and assign it.",kinds.map(([k,l])=>`<div class="eyebrow" style="margin:10px 0 6px">${l}: ${un[k].length}</div><div class="row">${unTbl(k).map(x=>`<span class="pill mute">${H(x[0])} · ${x[1]}</span>`).join("")||'<span class="muted small">None</span>'}</div>`).join(""))}</div>`}
/* ---------- the person profile drawer ---------- */
function stat(l,v,sub,cls){return `<div class="stat ${cls||""}"><small>${l}</small><span class="num" data-role="metric">${v}</span><em>${sub}</em></div>`}
function lvlBar(l){return `<span class="org-lb" aria-hidden="true">${[1,2,3,4].map(i=>`<i class="${i<=l?"on "+lvlCls(l):""}"></i>`).join("")}</span>`}
function pOverview(p){
 const w=O.owns(p.n),ag=O.agentsOf(p.n),c=O.capacity(p.n),l=loadOf(p.n),kids=O.kids(p.n),rec=O.dir(p.n)||{};
 const lines=[`<dt>Reports to</dt><dd>${p.mgr?pchip(p.mgr):'<span class="muted">Board of directors</span>'}</dd>`];
 if(p.dot)lines.push(`<dt>Dotted line to</dt><dd>${pchip(p.dot)} <span class="muted small">${H(DWHY[p.n]||"")}</span></dd>`);
 if(p.mx.length)lines.push(`<dt>Project matrix</dt><dd>${p.mx.map(m=>`<span class="pill info">${H(PNAME(m.p))} ${m.pct}%</span> <span class="muted small">led by ${H(PLEAD(m.p))}</span>`).join("<br>")}</dd>`);
 if(kids.length)lines.push(`<dt>Direct reports</dt><dd><div class="row">${kids.map(k=>pchip(k)).join("")}</div></dd>`);
 lines.push(`<dt>Team</dt><dd>${H(p.unit)}</dd><dt>Location</dt><dd>${H(p.loc)}, ${p.yrs} year${p.yrs===1?"":"s"} at Meridian</dd>`);
 return `<div class="p360grid">${stat("Load",l+"%",loadHrs(p.n),l>95?"crit":"")}${stat("Open items",String(O.pending(p.n).reduce((s,g)=>s+g.rows.length,0)),"across "+O.pending(p.n).length+" areas")}${stat("AI agents",String(ag.length),ag.length?c.returned+" h/week returned":"none yet")}${stat("Still available",c.available+" h","a week in ranked opportunities")}</div>
 <div class="org-go"><div class="eyebrow">Go to ${H(first(p.n))} for</div><ul>${p.fn.map(f=>`<li>${H(f)}</li>`).join("")}</ul></div>
 <div class="org-val"><div class="eyebrow">Why this role matters</div><p class="story" data-role="story">${H(p.value)}</p></div>
 <dl class="kv">${lines.join("")}<dt>Skills</dt><dd><div class="row">${(rec.skills||[]).map(s=>`<span class="pill info">${H(s)}</span>`).join("")||'<span class="muted">None recorded</span>'}</div></dd>${ag.length?`<dt>AI agents</dt><dd><div class="row">${ag.map(a=>`<button type="button" class="chip" data-org-agent="${H(a.name)}">${H(a.name)} · ${H(O.LVL[a.autonomy].short)}</button>`).join("")}</div></dd>`:""}</dl>
 <div class="row" style="margin-top:12px"><button class="btn primary" data-org-open="${H(p.n)}" data-org-tab="6">Agent studio for ${H(first(p.n))}</button><button class="btn" data-person="${H(p.n)}">Open Person 360</button></div>`}
function loadHrs(n){try{const w=workload(n);return w.hrs+" of "+w.cap+" hours a week"}catch(e){return""}}
function pPerms(p){
 const x=O.perms(p.n);
 return `<p class="story" data-role="story">${H(first(p.n))} holds the <b>${H(x.role.n)}</b> access role. What follows is read from the access roles in Admin, the delegation of authority in Budgets and the role template. Changes go through an access request and the quarterly access review.</p>
 <div class="eyebrow">Capabilities</div><div class="row" style="margin:8px 0 16px">${x.caps.map(c=>`<span class="pill info">${H(c)}</span>`).join("")}</div>
 <div class="eyebrow">Modules</div><div class="tscroll"><table class="org-pt"><thead><tr><th>Area</th><th>Access</th><th></th></tr></thead><tbody>${x.mod.map(m=>`<tr><td>${H(m.g)}</td><td><span class="pill ${lvlCls(m.lvl)}">${O.LV[m.lvl]}</span></td><td>${lvlBar(m.lvl)}</td></tr>`).join("")}</tbody></table></div>
 <div class="eyebrow" style="margin-top:16px">Data, by classification</div><div class="tscroll"><table class="org-pt"><thead><tr><th>Class</th><th>Access</th></tr></thead><tbody>${x.dat.map(d=>`<tr><td>${H(d.c)}</td><td><span class="pill ${d.lvl===2?"warn":d.lvl===1?"info":"mute"}">${O.DA[d.lvl]}</span></td></tr>`).join("")}</tbody></table></div>
 <div class="eyebrow" style="margin-top:16px">Approvals and limits</div>${x.app.length?`<div class="tscroll"><table><thead><tr><th>Can approve</th><th>Limit</th><th>Basis</th></tr></thead><tbody>${x.app.map(a=>`<tr><td><b>${H(a.what)}</b></td><td>${H(a.limit)}</td><td class="muted small">${H(a.basis)}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">No approval authority.</p>'}
 <div class="row" style="margin-top:14px"><button class="btn" data-org-act="access" data-n="${H(p.n)}">Request an access change</button><button class="btn quiet" data-org-act="review" data-n="${H(p.n)}">Add to the next access review</button></div>`}
function pOwns(p){
 const w=O.owns(p.n),gr=[];
 gr.push({key:"m",label:"Metrics",rows:w.metrics.map(id=>{const m=METRICS[id];return{id,t:m.n,sub:m.f.slice(0,70),tag:mstat(m)==="good"?"On trend":"Off trend",st:mstat(m)==="good"?"good":"warn",go:()=>{closeDrawer();S.metricSel=id;go("metrics")}}})});
 gr.push({key:"p",label:"Processes",rows:w.procs.map(id=>{let pr=null;try{pr=PROCLIB.get(id)}catch(e){}return{id,t:pr?pr.name:id,sub:"Process library"+(pr&&pr.level!=null?", maturity "+pr.level+" of "+pr.target:""),tag:"Owner",st:"info",go:()=>{closeDrawer();try{PROCLIB.open(id)}catch(e){go("plat_proclib")}}}})});
 if(w.backup.length)gr.push({key:"pb",label:"Processes as backup owner",rows:w.backup.map(id=>({id,t:id,sub:"Backup",tag:"Backup",st:"mute",go:()=>{closeDrawer();try{PROCLIB.open(id)}catch(e){}}}))});
 gr.push({key:"e",label:"Data entities",rows:w.ents.map(id=>{let e=null;try{e=PLAT.ent(id)}catch(x){}return{id,t:e?e.label:id,sub:"Steward of "+id,tag:"Steward",st:"info",go:()=>{closeDrawer();try{ATLAS.focus(id)}catch(x){go("plat_data")}}}})});
 gr.push({key:"s",label:"Services",rows:w.svcs.map(id=>{const s=SVCREG.find(z=>z.id===id);return{id,t:s?s.n:id,sub:s?s.tier:"",tag:"Owner",st:"info",go:()=>{closeDrawer();go("svc_360",id)}}})});
 gr.push({key:"j",label:"Projects",rows:w.projs.map(id=>{const pj=PROJ.find(z=>z.id===id);return{id,t:pj?pj.n:id,sub:"Project manager",tag:id,st:"info",go:()=>{closeDrawer();go("plan",id)}}})});
 gr.push({key:"r",label:"Open risks and issues",rows:w.raid.map(id=>{const r=(window.PPMRAID||[]).find(z=>z.id===id)||{};return{id,t:r.n||id,sub:"Due "+(r.due||""),tag:id,st:"warn",go:()=>{closeDrawer();go("ppm_raid")}}})});
 const tot=gr.reduce((s,g)=>s+g.rows.length,0);
 return `<p class="story" data-role="story">${H(first(p.n))} is the named owner of <b>${tot}</b> things in the platform: ${w.metrics.length} metrics, ${w.procs.length} processes, ${w.ents.length} data entities, ${w.svcs.length} services and ${w.projs.length} projects. This is computed from each registry's owner field, not typed here.</p>${lrHTML({id:"org-own-"+O.slug(p.n),groups:gr.filter(g=>g.rows.length),limit:5,search:true,empty:"Owns nothing in the registries yet."})}`}
function pPerf(p){
 const f=O.perf(p.n);const bar=(l,v,sub,base)=>`<div style="margin:12px 0"><div class="row sp"><b>${H(l)}</b><span class="num" data-role="metric">${v}%</span></div><div class="loadbar"><u style="width:${Math.min(100,v)}%;background:${v>=(base||90)?"var(--good-f)":v>=(base||90)-8?"var(--warn-f)":"var(--bad-f)"}"></u></div><div class="muted small">${H(sub)}</div></div>`;
 return `<p class="story" data-role="story">${H(first(p.n))} is at <b>${f.att}%</b> goal attainment${f.goals[0]&&f.goals[0].src==="Metric you own"?", computed from the metrics "+H(first(p.n))+" owns":""}. Review cycle: ${H(f.review.cycle.toLowerCase())}; last review ${H(fmtISO(f.review.last))}, next ${H(fmtISO(f.review.next))}.</p>
 <div class="p360grid">${stat("Goal attainment",f.att+"%","this review cycle")}${stat("SLA adherence",f.sla+"%","items within target time")}${stat("Workload",f.wl.pct+"%",f.wl.hrs+" of "+f.wl.cap+" hours",f.wl.pct>95?"crit":"")}${stat("Last rating",f.review.rating,f.review.cycle+" review")}</div>
 <div class="eyebrow" style="margin-top:14px">Goals</div>${f.goals.map(g=>bar(g.n,g.pct,g.src,90)).join("")}
 ${bar("On-time delivery",f.delivery,"items finished by due date ÷ items finished",88)}${bar("Quality (rework free)",f.quality,"items accepted first time ÷ items delivered",88)}
 <p class="muted small">Demo data for reviews; goals that name a metric are live. Calibration and reviews are managed in Performance management.</p><div class="row"><button class="btn" data-org-go="ppl_perf">Open Performance management</button></div>`}
const fmtISO=s=>{try{return new Date(s+"T00:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}catch(e){return s}};
function pPending(p){
 const w=O.pending(p.n);const tot=w.reduce((s,g)=>s+g.rows.length,0);
 const lr=lrHTML({id:"org-pend-"+O.slug(p.n),groups:w.map(g=>({key:g.kind,label:g.kind,rows:g.rows.map(x=>({id:x.id,t:x.t,sub:x.sub,tag:x.due||x.tag||"",st:x.st,go:x.go}))})),limit:4,search:true,empty:"Nothing pending."});
 return `<p class="story" data-role="story">${H(first(p.n))} has <b>${tot}</b> items waiting across ${w.length} areas: approvals, incidents, changes, risks, reviews and tasks. These come from the same providers as Person 360 and the inbox.</p>${lr}`}
const TCOL=["--p4","--s3","--e4","--w1","--u3","--faint"];
function pTime(p){
 const rows=O.time(p.n),tot=rows.reduce((s,r)=>s+r.hrs,0),au=rows.reduce((s,r)=>s+r.auto,0);
 return `<p class="story" data-role="story">A typical week for ${H(first(p.n))}, about ${Math.round(tot)} hours. Roughly <b>${au.toFixed(1)} hours</b> of it is routine work that an agent could prepare, leaving ${H(first(p.n))} the judgment.</p>
 <div class="org-tb" role="img" aria-label="Time spent: ${rows.map(r=>r.k+" "+r.pct+" percent").join(", ")}">${rows.map((r,i)=>`<i style="width:${r.pct}%;background:var(${TCOL[i]})" title="${H(r.k)} ${r.pct}%"></i>`).join("")}</div>
 ${legend(rows.map((r,i)=>[r.k+" "+r.pct+"%",TCOL[i]]))}
 <div class="tscroll"><table><thead><tr><th>Where the week goes</th><th>Hours</th><th>Agent could prepare</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${H(r.k)}</td><td class="num">${r.hrs}</td><td class="num">${r.auto?r.auto+" h":"<span class='muted'>0</span>"}</td></tr>`).join("")}</tbody></table></div>
 <p class="muted small">Split is the role template adjusted by this person's real meetings and pending work. "Could be prepared" is limited to ranked, low and medium risk opportunities.</p>`}
const PTABS=["Overview","Access","Owns","Performance","Pending","Time","Agents"];
function profileHTML(n){
 const p=O.P(n);const rec=O.dir(n)||{};
 const panes=[pOverview(p),pPerms(p),pOwns(p),pPerf(p),pPending(p),pTime(p),(O.studioHTML?O.studioHTML(n,true):"<p class='muted'>Agent studio is loading.</p>")];
 return `<div class="org-dr"><div class="p360h">${avatar(n,{size:76})}<div><h2>${H(n)}</h2><div class="p360kv"><span>${H(p.role)}</span><span>${H(p.unit)}</span>${kindPill("human")}</div></div></div>${views("org_p",PTABS,panes)}</div>`}
function openProfile(n,tab){
 if(!O.P(n)){if(window.person360)person360(n);return}
 O.ensureDir();OS.sel=n;if(tab!=null)S.v.org_p=tab;else if(S.v.org_p==null)S.v.org_p=0;
 openDrawer(profileHTML(n));audit("Org profile",n);OS.cur=n;
 if(S.screen==="org_chart"&&OS.tab==="chart"&&!OS.outline){const cv=document.getElementById("orgcv");if(cv)cv.querySelectorAll(".org-n.sel").forEach(x=>x.classList.remove("sel"));const b=cv&&cv.querySelector(`[data-org-open="${CSS.escape(n)}"]`);if(b&&b.parentNode)b.parentNode.classList.add("sel")}}
O.openProfile=openProfile;
function openAgent(name){if(O.openAgent)O.openAgent(name);else toast("Agent studio is loading","warn")}
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("[data-org-act]");if(a){const n=a.dataset.n;if(a.dataset.orgAct==="access"){audit("Access change requested",n);toast("Access change request for "+n+" sent to the security lead","good")}else{audit("Access review",n+" added");toast(n+" added to the Q4 access review","good")}return}
 const g=e.target.closest&&e.target.closest("[data-org-go]");if(g){closeDrawer();go(g.dataset.orgGo)}});
document.addEventListener("pointerdown",()=>{},{passive:true});
/* ---------- the screen ---------- */
O.tabs=[["chart","Org chart"],["report","Reporting structures"],["dir","People directory"],["own","Ownership"],["studio","Agent studio"]];
function orgScreen(){
 O.ensureDir();if(O.wire)O.wire();O.sync();const st=O.stats();
 if(!O.tabs.some(t=>t[0]===OS.tab))OS.tab="chart";
 const pane=OS.tab==="chart"?chartPane():OS.tab==="report"?reportPane():OS.tab==="dir"?dirPane():OS.tab==="own"?ownPane():(O.studioPane?O.studioPane():"");
 const story=`Meridian has <b>${st.heads} people</b> in <b>${st.layers} layers</b> and <b>${st.agents} AI teammates</b>, each sponsored by a named person. Agents are returning <b>${st.returned} hours a week</b> to the people they support; another <b>${st.open} hours</b> is on the table. The goal is to supercharge good people, not replace them.`;
 return `<div class="screen">${hero("People and teams","Who does what, and who supports them",story,`<div class="row">${fchip("m_org_cap")}${fchip("m_org_gov")}${fchip("m_org_own")}${fchip("m_org_span")}${stdChip("togaf","Org and capability model in the chart")}${stdChip("agentic","Agent autonomy levels and sponsor accountability")}</div>`)}${lensNote()}
 ${OS.tab==="chart"?`<div class="org-strip" role="list"><span role="listitem"><b data-role="metric">${st.heads}</b> people</span><span role="listitem"><b data-role="metric">${st.mgrs}</b> managers</span><span role="listitem"><b data-role="metric">${st.avgSpan}</b> average span (widest ${st.maxSpan})</span><span role="listitem"><b data-role="metric">${st.layers}</b> layers</span><span role="listitem"><b data-role="metric">${st.agents}</b> AI agents</span><span role="listitem"><b data-role="metric">${st.returned} h</b> a week returned</span></div>`:kpiRow([["People",String(st.heads),st.mgrs+" managers, "+st.layers+" layers"],["AI teammates",String(st.agents),st.covered+" sponsors"],["Average span",String(st.avgSpan),"max "+st.maxSpan+" direct reports",{metric:"m_org_span"}],["Hours returned",st.returned+" h","a week by agents",{metric:"m_org_cap"}],["Ownership",st.ownPct+"%","of registry items name a person",{metric:"m_org_own"}]])}
 <div class="org-tabs" role="tablist" aria-label="Org chart sections">${O.tabs.map(t=>`<button type="button" role="tab" class="org-tab" aria-selected="${OS.tab===t[0]}" data-org-tab="${t[0]}">${t[1]}</button>`).join("")}</div>
 <div class="org-pane" role="tabpanel">${pane}</div>${procCard("org_chart")}</div>`}
REG("org_chart","Org chart","people","M12 3h-3v5h3M9 5.5H5v4M15 5.5h4v4M5 14h3v5H5zM16 14h3v5h-3zM10.5 14h3v5h-3zM12 8v3M6.5 11h11v3",orgScreen);
O.go=n=>{S.screen="org_chart";go("org_chart")};
})();
