const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const scale=process.argv[2]==='scale';
if(scale){const t=Date.now();await p.evaluate(()=>SCALE.set(true));console.log('SCALE.set ms',Date.now()-t, await p.evaluate(()=>JSON.stringify({n:SCALE.n,cis:SCALE.cis&&SCALE.cis.length,tickets:SCALE.tickets&&SCALE.tickets.length,projects:SCALE.projects&&SCALE.projects.length})))}
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
for(const id of ids){const e0=errs.length;
 const t=await p.evaluate(i=>{const t0=performance.now();go(i);return performance.now()-t0},id).catch(e=>{errs.push(id+e.message);return -1});
 await p.waitForTimeout(80);
 const r=await p.evaluate(()=>{const v=document.querySelector('#view');const vis=e=>e.checkVisibility&&e.checkVisibility();
  const tabs=[...v.querySelectorAll('.vsw')].filter(vis);const lab=tabs.length?[...tabs[0].querySelectorAll('label')].map(l=>l.textContent.trim()):[];
  const chk=tabs.length?(()=>{const ins=[...document.querySelectorAll('input[name]')].filter(i=>i.id&&i.id.startsWith('v-'+S.screen+'-'));const c=ins.find(i=>i.checked);return c?c.id:null})():null;
  const stats=[...v.querySelectorAll('.stat')].filter(vis);
  const statF=stats.filter(s=>s.querySelector('.fchip,[data-metric],.mchip')).length;
  const svgs=[...v.querySelectorAll('svg')].filter(vis).filter(s=>{const r=s.getBoundingClientRect();return r.width>80&&r.height>40&&s.querySelectorAll('rect,path,circle,line,polyline').length>4&&!s.closest('button')});
  const bars=[...v.querySelectorAll('[class*=bar],[class*=spark],[class*=ring],[class*=heat],[class*=donut],[class*=gantt],[class*=chart]')].filter(vis).length;
  const lists=[...v.querySelectorAll('table,.bt,[class*=-list],[class*=tbl],[role=table],[role=grid]')].filter(vis).length;
  const rows=[...v.querySelectorAll('tr,.row,[class*=-li],[class*=-row]')].filter(vis).length;
  const fch=[...v.querySelectorAll('.fchip')].filter(vis).length;
  return {tabs:lab.length,first:lab[0]||'',chk,stats:stats.length,statF,charts:svgs.length+bars,lists,rows,fch,h:v.scrollHeight,tabLabels:lab.join(' / ')}});
 console.log(JSON.stringify({id,ms:Math.round(t),err:errs.length>e0?errs.slice(e0):undefined,...r}));}
console.log('ERRS',errs);await b.close()})();
