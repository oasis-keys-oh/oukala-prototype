/* R17 tables: flat connected tables (no per-cell bubbles) and sticky heads that never float inside scrollers */
(function(){
 if(window.__r17rTables)return;window.__r17rTables=1;
 const GRID=/^(\d+(\.\d+)?)px (\d+(\.\d+)?)px$/;
 function tag(root){
  const view=document.getElementById("view");if(!view)return;
  (root||view).querySelectorAll("table").forEach(t=>{
   if(t.dataset.r17t)return;
   const cs=getComputedStyle(t);let flat=true;
   if(cs.borderCollapse==="separate"){const m=GRID.exec(cs.borderSpacing||"");if(m&&parseFloat(m[1])>=2)flat=false}
   t.dataset.r17t=flat?"flat":"grid";
   let a=t.parentElement,sc=false;
   while(a&&a!==view){const o=getComputedStyle(a);if(/(auto|scroll|hidden)/.test(o.overflowX+" "+o.overflowY)){sc=true;break}a=a.parentElement}
   if(sc)t.dataset.r17sc="1";
  });
 }
 let q=0;
 function sched(){if(q)return;q=requestAnimationFrame(()=>{q=0;tag()})}
 function boot(){const v=document.getElementById("view");if(!v){setTimeout(boot,300);return}
  new MutationObserver(sched).observe(v,{childList:true,subtree:true});sched()}
 boot();window.R17R={tag};
})();
