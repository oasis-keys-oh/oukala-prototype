const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CH||undefined});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{NAVX.ensureIndex(true);for(let i=0;i<200&&!NAVX.index.built;i++)await new Promise(r=>setTimeout(r,100));
const it=NAVX.index.items;const byTy={},byG={};it.forEach(x=>{byTy[x.ty]=(byTy[x.ty]||0)+1;const g=x.g||(x.m||'').split(' · ')[0];const k=x.ty+'|'+(x.g||'-')+'|'+(x.g?'':g);byG[k]=(byG[k]||0)+1});
return {n:it.length,byTy,byG,timings:NAVX.index.timings.filter(t=>t[2]>0).map(t=>t[0]+':'+t[2]),skipped:NAVX.index.skipped}});
console.log(JSON.stringify(r,null,0));console.log('errs',errs.slice(0,5));await b.close()})();
