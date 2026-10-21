// PR-31: what the Build list shows to each purview (JM-13): bar text, KPI tiles, row count.
const {open}=require('./lib');
(async()=>{const {b,p}=await open();
 for(const k of ['emp','newhire','pm','ops','fin','arch','admin','guest']){
  const r=await p.evaluate(k=>{NAVX.persona.set(k);go('r18_builds');const v=document.querySelector('#view');
   const bar=(v.querySelector('.jb-pv')||{}).innerText||'(no purview bar on this tab)';
   const tiles=[...v.querySelectorAll('.stat,.kpi,.tile')].slice(0,5).map(t=>t.innerText.replace(/\s+/g,' ').slice(0,60));
   const tabs=[...v.querySelectorAll('.vsw label, [role=tab]')].map(t=>t.textContent.trim()).slice(0,6);
   return {bar:bar.replace(/\s+/g,' ').slice(0,400),tiles,tabs,rows:v.querySelectorAll('tbody tr').length}},k);
  console.log('\n##',k,JSON.stringify(r,null,1))}
 // try the Journey Build tab where the purview bar lives
 const r2=await p.evaluate(()=>{NAVX.persona.set('emp');const hits=[...document.querySelectorAll('.jb-pv')].length;return hits});console.log('jb-pv on screen',r2);
 await b.close()})();
