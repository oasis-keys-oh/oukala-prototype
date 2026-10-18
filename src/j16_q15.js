(()=>{SCALE.n.projects=500;SCALE._pj=null;SCALE.set(true);go('strat_exec');const T=f=>{const t=performance.now();f();return Math.round(performance.now()-t)};
const r={};r.reflow1=T(()=>document.body.offsetHeight);document.body.appendChild(document.createElement('i'));r.dirtyReflow=T(()=>document.body.offsetHeight);
r.nodes=document.getElementsByTagName('*').length;
const btn=document.querySelector('[data-pk2-open="sx_proj"]');r.click1=T(()=>btn.click());r.open1=PICKER.perf.open;PICKER.close_all();
r.click2=T(()=>btn.click());r.open2=PICKER.perf.open;PICKER.close_all();
const q=T(()=>{btn.click()});r.click3=q;r.open3=PICKER.perf.open;return r})()
