const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('E',e.message));
await p.goto('file://'+path.resolve(process.argv[2]+'/full.html'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{SCALE.n.projects=244;SCALE.set(true);const o=[];for(const s of ['ims','ims','ppm_wbs','ppm_wbs']){const t=performance.now();go(s);o.push(s+' '+Math.round(performance.now()-t))}
 const P=plan("now",ulist());let t=performance.now();plan("now",ulist());o.push('plan '+Math.round(performance.now()-t));t=performance.now();rollup(plan("now",ulist()));o.push('rollup '+Math.round(performance.now()-t));t=performance.now();baseCalc(ulist());o.push('base '+Math.round(performance.now()-t));return o.join(' | ')}));
await b.close()})();
