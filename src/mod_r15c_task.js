/* ===== Round 15, Agent C: task first =====
   Action screens open on the work, not on a dashboard. Dashboards stay one click away inside a closed "Overview" section.
   Done as a DOM reorder after render so the owning modules keep their code. */
(function(){
const W=window,D=document;const R15=W.R15=W.R15||{};
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const q1=(s,r)=>(r||D).querySelector(s),qa=(s,r)=>[...(r||D).querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
S.r15=S.r15||{open:{}};
function overview(sc,id,title,summaryHTML,nodes){
 if(!nodes.length||q1(".r15-ov",sc))return;
 const det=D.createElement("details");det.className="r15-ov card glass";det.dataset.r15Ov=id;if(S.r15.open[id])det.open=true;
 det.innerHTML=`<summary><span class="r15-ovt">${esc(title)}</span><span class="r15-ovs">${summaryHTML}</span></summary><div class="r15-ovb"></div>`;
 const body=q1(".r15-ovb",det);nodes.forEach(n=>body.appendChild(n));return det}
D.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.r15Ov){S.r15.open[d.dataset.r15Ov]=d.open}},true);
/* My approvals: queue first, tiles and charts into Overview */
function tfAppr(){const v=q1("#view");const sc=q1(".screen",v);if(!sc||q1(".r15-ov",sc))return;
 const kids=[...sc.children];const hero=kids.find(k=>k.classList.contains("hero"));const tiles=kids.find(k=>k.classList.contains("statrow"));const grid=kids.find(k=>k.classList.contains("grid"));
 const bar=kids.find(k=>k.classList.contains("views-bar"));const queue=bar&&bar.nextElementSibling;if(!hero||!bar||!queue||!queue.classList.contains("card"))return;
 const heroRow=q1(":scope > .row",hero);const nodes=[];if(heroRow)nodes.push(heroRow);if(tiles)nodes.push(tiles);if(grid)nodes.push(grid);
 const stats=tiles?qa(".stat",tiles).slice(0,4).map(s=>{const l=(q1("small",s)||{}).textContent||"",n=(q1(".num",s)||{}).textContent||"";return `<b>${esc(n)}</b> ${esc(l.toLowerCase())}`}).join(" · "):"";
 const det=overview(sc,"flw_appr","Overview, delegation and service levels",stats,nodes);
 const anchor=q1(":scope > .r15-fam",sc)||hero;anchor.after(bar);bar.after(queue);if(det)queue.after(det)}
const TF={flw_appr:tfAppr};
const _render=W.render;
W.render=function(){const r=_render.apply(this,arguments);try{const f=TF[G(()=>S.screen)];if(f)f()}catch(e){console.error("r15 task",e)}return r};
R15.taskFirst=TF;
/* ---- rhythm guard: bordered cards that touch (gap under 8px) get a real gap, whoever built the screen ---- */
const like=el=>{const cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden")return false;if(!(parseFloat(cs.borderTopWidth)+parseFloat(cs.borderLeftWidth)>=1)||cs.borderTopStyle==="none")return false;if((parseFloat(cs.borderTopLeftRadius)||0)<8)return false;const r=el.getBoundingClientRect();return r.width>=110&&r.height>=36&&!el.matches("button,.chip,.pill,.btn,input,select,textarea,label,summary,.fchip,.vsw,.vsw *")};
function rhythm(){const v=q1("#view");if(!v||W.__r15rh)return;W.__r15rh=1;try{let n=0;
 const els=qa("*",v);for(const P of els){if(++n>20000)break;const kc=P.children.length;if(kc<2||kc>400)continue;const tg=P.tagName;if(/^(TABLE|TBODY|THEAD|TR|SELECT|UL|OL|svg|SVG)$/.test(tg)&&tg!=="UL"&&tg!=="OL")continue;if(P.closest("svg,[data-eq=off],.at-world"))continue;
  const kids=[];const rs=[];for(const k of P.children){const r=k.getBoundingClientRect();if(r.width>=110&&r.height>=36){kids.push(k);rs.push(r)}}if(kids.length<2)continue;
  const ok=kids.map(k=>null);let hit=false,vert=true;
  for(let i=0;i<kids.length&&!hit;i++){for(let j=i+1;j<kids.length;j++){const a=rs[i],b=rs[j];const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left),oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);let gap=null,vt=true;
    if(ox>0.4*Math.min(a.width,b.width)){const g=a.bottom<=b.top+1?b.top-a.bottom:b.bottom<=a.top+1?a.top-b.bottom:null;if(g!=null&&g<8)gap=g}
    if(gap==null&&oy>0.4*Math.min(a.height,b.height)){const g=a.right<=b.left+1?b.left-a.right:b.right<=a.left+1?a.left-b.right:null;if(g!=null&&g<8){gap=g;vt=false}}
    if(gap!=null&&like(kids[i])&&like(kids[j])){hit=true;vert=vt;break}}}
  if(!hit)continue;const ps=getComputedStyle(P);
  if(ps.display==="block"||ps.display==="flow-root"){P.classList.add("r15-stack")}
  else if(/grid|flex/.test(ps.display)){if(!vert&&/flex/.test(ps.display)&&ps.flexWrap==="nowrap"&&ps.flexDirection.indexOf("row")===0)continue;P.style.gap="12px"}
  else{kids.forEach(k=>{k.style.marginBottom="12px"})}}
 }catch(e){}finally{W.__r15rh=0}}
let rt=0,rt2=0;const sched=()=>{clearTimeout(rt);clearTimeout(rt2);rt=setTimeout(rhythm,40);rt2=setTimeout(rhythm,420)};
const _r2=W.render;W.render=function(){const r=_r2.apply(this,arguments);sched();return r};
const arm=()=>{const v=q1("#view");if(!v)return setTimeout(arm,250);new MutationObserver(sched).observe(v,{childList:true,subtree:true});window.addEventListener("resize",sched)};setTimeout(arm,400);
R15.rhythm=rhythm;
})();
