const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('E',e.message));
await p.goto('file://'+path.resolve(process.argv[2]+'/full.html'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{SCALE.n.projects=244;let t=Date.now();SCALE.set(true);const a=Date.now()-t;t=Date.now();const n=XT.on;const bx=Date.now()-t;return JSON.stringify({set:a,xt:bx,proj:XT.proj.length,tasks:XT.tasks.length})}));
for(const s of ['ims','plan','ppm_wbs','ppm_proj','trace']){const t=Date.now();const e=await p.evaluate(i=>{const t=performance.now();go(i);return performance.now()-t},s);console.log(s,Math.round(e))}
await p.evaluate(()=>{S.ims&&(S.ims.tab="miles")});
await b.close()})();
