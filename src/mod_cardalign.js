/* Card aligner (round 9). Sibling cards that repeat the same structure share section heights, so badges, values,
   formulas and buttons line up across a row. It is the runtime half of the card-consistency rule; cardscan.js is the test. */
(function(){
 const SEL="[class]";let busy=false,timer=0,obs=null;
 const cardish=el=>{const r=el.getBoundingClientRect();if(r.width<110||r.height<50)return false;const cs=getComputedStyle(el);return cs.display!=="inline"&&cs.position!=="absolute"&&(cs.backgroundColor!=="rgba(0, 0, 0, 0)"||cs.backgroundImage!=="none"||parseFloat(cs.borderTopWidth)>0||cs.boxShadow!=="none")};
 function run(){const v=document.getElementById("view");if(!v||busy)return;busy=true;if(obs)obs.disconnect();
  try{v.querySelectorAll("[data-ca]").forEach(e=>{e.style.minHeight="";e.removeAttribute("data-ca")});
   const parents=new Map();let n=0;for(const el of v.querySelectorAll(SEL)){if(++n>4000)break;if(el.offsetParent===null)continue;const p=el.parentElement;if(!p||p.closest("table,.tscroll,.vtab,[data-virtual]"))continue;if(!parents.has(p))parents.set(p,[]);parents.get(p).push(el)}
   parents.forEach(kids=>{if(kids.length<2||kids.length>40)return;const fam={};kids.forEach(k=>{if(k.tagName==="SECTION")return;const key=k.tagName+"."+[...k.classList].filter(c=>!/^(on|sel|open|active|st-|is-)/.test(c)).sort().join(".");(fam[key]=fam[key]||[]).push(k)});
    Object.values(fam).forEach(list=>{if(list.length<2)return;const rows={};list.forEach(k=>{const t=Math.round(k.getBoundingClientRect().top/6);(rows[t]=rows[t]||[]).push(k)});
     Object.values(rows).forEach(row=>{if(row.length<2||!cardish(row[0]))return;const cc=row.map(k=>k.children.length);const m=Math.min(...cc);if(m<2||Math.max(...cc)>10)return;
      for(let i=0;i<m;i++){if(new Set(row.map(k=>k.children[i].className)).size!==1)break;const hs=row.map(k=>k.children[i].getBoundingClientRect().height);const mx=Math.max(...hs);if(mx-Math.min(...hs)>2&&mx<400)row.forEach((k,j)=>{const c=k.children[i];if(getComputedStyle(c).position==="absolute")return;c.style.minHeight=mx+"px";c.dataset.ca="1"})}
      const hs=row.map(k=>k.getBoundingClientRect().height),mx=Math.max(...hs);if(mx-Math.min(...hs)>3)row.forEach(k=>{k.style.minHeight=mx+"px";k.dataset.ca="1"})})})})
  }catch(e){}finally{busy=false;if(obs)obs.observe(v,{childList:true,subtree:true})}}
 const sched=()=>{clearTimeout(timer);timer=setTimeout(()=>{(window.requestIdleCallback||setTimeout)(run)},90)};
 function boot(){const v=document.getElementById("view");if(!v)return setTimeout(boot,200);obs=new MutationObserver(sched);obs.observe(v,{childList:true,subtree:true});window.addEventListener("resize",sched);document.addEventListener("click",sched);window.CARDALIGN={run};sched()}
 if(document.readyState!=="loading")boot();else document.addEventListener("DOMContentLoaded",boot)})();
