/* Card aligner (round 9). Sibling cards that repeat the same structure share section heights, so badges, values,
   formulas and buttons line up across a row. It is the runtime half of the card-consistency rule; cardscan.js is the test. */
(function(){
 const SEL="[class]";let busy=false,timer=0,obs=null;
 const cardish=el=>{const r=el.getBoundingClientRect();if(r.width<110||r.height<50)return false;const cs=getComputedStyle(el);return cs.display!=="inline"&&cs.position!=="absolute"&&(cs.backgroundColor!=="rgba(0, 0, 0, 0)"||cs.backgroundImage!=="none"||parseFloat(cs.borderTopWidth)>0||cs.boxShadow!=="none")};

 /* Round 14: an auto-fit grid whose last row is short leaves blank cells. Spread the last row's items over the full width
    (spans of floor(cols/n), the remainder going to the first items) so every row is flush on both sides. Idempotent; cleared on each run. */
 function fillGrids(v){v.querySelectorAll("[data-gfs]").forEach(e=>{e.style.gridColumn="";e.removeAttribute("data-gfs")});v.querySelectorAll("[data-gf]").forEach(e=>e.removeAttribute("data-gf"));
  const NAMED=".grid,[class*='kpi'],[class*='tiles'],[class*='stats'],[class*='statrow'],[class*='-tiles']";let _gn=0;v.querySelectorAll("*").forEach(g=>{if(++_gn>5000||g.offsetParent===null||g.closest("[data-eq=off],table,.tscroll"))return;const cs=getComputedStyle(g);if(cs.display!=="grid")return;
   /* R15: any other grid of card-like children (itsm-go, meet-fgrid, obs-wall, er-doms, bld-cts, viz-gal, bld-mods ...) gets the same flush last row; calendars and heat maps (cells, not cards) are left alone */
   if(!g.matches(NAMED)){const k0=g.firstElementChild;if(!k0||!cardish(k0)||k0.getBoundingClientRect().width<130||g.children.length>200)return}
   if(/subgrid|masonry/.test(cs.gridTemplateColumns)||cs.gridTemplateRows.includes("subgrid"))return;
   const cols=cs.gridTemplateColumns.split(" ").filter(x=>x&&x!=="none").length;if(cols<2)return;
   const kids=[...g.children].filter(k=>k.offsetParent!==null&&getComputedStyle(k).position!=="absolute");if(kids.length<cols+1)return;
   if(kids.some(k=>{const c=getComputedStyle(k);return c.gridColumnStart!=="auto"||c.gridColumnEnd!=="auto"&&!/^span 1$/.test(c.gridColumnEnd)||!/^(auto|span \d+)$/.test(c.gridRowStart)}))return;
   const r=kids.length%cols;if(!r)return;const last=kids.slice(kids.length-r);const base=Math.floor(cols/r),extra=cols%r;
   last.forEach((k,i)=>{k.style.gridColumn="span "+(base+(i<extra?1:0));k.dataset.gfs="1"});g.dataset.gf="1"})}
 function run(){const v=document.getElementById("view");if(!v||busy)return;busy=true;if(obs)obs.disconnect();
  try{fillGrids(v);v.querySelectorAll("[data-ca]").forEach(e=>{e.style.minHeight="";e.removeAttribute("data-ca")});
   const parents=new Map();let n=0;for(const el of v.querySelectorAll(SEL)){if(++n>4000)break;if(el.offsetParent===null)continue;const p=el.parentElement;if(!p||p.closest("table,.tscroll,.vtab,[data-virtual]"))continue;if(!parents.has(p))parents.set(p,[]);parents.get(p).push(el)}
   parents.forEach(kids=>{if(kids.length<2||kids.length>40)return;const fam={};kids.forEach(k=>{if(k.tagName==="SECTION")return;const key=k.tagName+"."+[...k.classList].filter(c=>!/^(on|sel|open|active|st-|is-)/.test(c)).sort().join(".");(fam[key]=fam[key]||[]).push(k)});
    Object.values(fam).forEach(list=>{if(list.length<2)return;const rows={};list.forEach(k=>{const t=Math.round(k.getBoundingClientRect().top/6);(rows[t]=rows[t]||[]).push(k)});
     Object.values(rows).forEach(row=>{if(row.length<2||!cardish(row[0]))return;const cc=row.map(k=>k.children.length);const m=Math.min(...cc);if(m<2||Math.max(...cc)>10)return;
      for(let i=0;i<m;i++){if(new Set(row.map(k=>k.children[i].className)).size!==1)break;const hs=row.map(k=>k.children[i].getBoundingClientRect().height);const mx=Math.max(...hs);if(mx-Math.min(...hs)>2&&mx<400)row.forEach((k,j)=>{const c=k.children[i];if(getComputedStyle(c).position==="absolute")return;c.style.minHeight=mx+"px";c.dataset.ca="1"})}
      const hs=row.map(k=>k.getBoundingClientRect().height),mx=Math.max(...hs);if(mx-Math.min(...hs)>3)row.forEach(k=>{k.style.minHeight=mx+"px";k.dataset.ca="1"})})})})
  }catch(e){}finally{busy=false;if(obs)obs.observe(v,{childList:true,subtree:true})}}
 const sched=()=>{clearTimeout(timer);timer=setTimeout(()=>{requestAnimationFrame(run)},60)};
 function boot(){const v=document.getElementById("view");if(!v)return setTimeout(boot,200);obs=new MutationObserver(sched);obs.observe(v,{childList:true,subtree:true});window.addEventListener("resize",sched);document.addEventListener("click",sched);window.CARDALIGN={run};sched()}
 if(document.readyState!=="loading")boot();else document.addEventListener("DOMContentLoaded",boot)})();
