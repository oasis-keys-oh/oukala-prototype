const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_itom');const b=await chromium.launch();const errs=[];
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();p.on('pageerror',e=>errs.push('PE '+e.stack.slice(0,500)));p.on('console',m=>m.type()==='error'&&errs.push('C '+m.text().slice(0,300)));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const scr=['itom_cmdb','itom_model','itom_graph','itom_disc','itom_health','itom_fin'];
for(const sc of [false,true]){await p.evaluate(s=>SCALE.set(s),sc);await p.waitForTimeout(200);
 for(const s of scr){const t=await p.evaluate(s=>{const t0=performance.now();go(s);return performance.now()-t0},s);await p.waitForTimeout(500);
  const n=await p.evaluate(()=>document.querySelectorAll('.screen').length);console.log(sc?'SCALE':'base',s,Math.round(t)+'ms','screen els',n);
  if(errs.length){console.log(errs.splice(0));}}}
await b.close()})();
