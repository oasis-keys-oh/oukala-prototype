const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('E',e.message));p.on('console',m=>{if(m.type()=='error')console.log('CE',m.text())});
await p.goto('file://'+path.resolve(process.argv[2]+'/full.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const o={};try{const s=SUMS[0];o.k=wbsKids(s.id).length;}catch(e){o.err=e.message}
 o.ppmx=typeof PPMX!=='undefined'?Object.keys(PPMX):null;o.proj=PROJ.length;o.scale=typeof SCALE!=='undefined'?Object.keys(SCALE):null;return o});console.log(JSON.stringify(r));
for(const s of ['ims','ppm_wbs','plan']){const t=Date.now();await p.evaluate(i=>go(i),s);await p.waitForTimeout(200);console.log(s,Date.now()-t)}
await b.close()})();
