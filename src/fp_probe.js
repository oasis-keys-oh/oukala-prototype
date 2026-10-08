const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1000,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const r=await p.evaluate(async()=>{const o={};o.w=JSON.stringify(S.w);o.rng=[...document.querySelectorAll('.rng')].length;
const t=(id,sc)=>{if(sc)SCALE.set(true);const a=performance.now();go(id);return Math.round(performance.now()-a)};
o.port=t('port');o.proj=t('ppm_proj');o.raid=t('ppm_raid');
SCALE.set(true);o.scale={port:t('port'),proj:t('ppm_proj'),raid:t('ppm_raid')};
try{o.n={proj:SCALE.projects().length,dem:SCALE.demand&&SCALE.demand().length,raid:SCALE.raid&&SCALE.raid().length}}catch(e){o.n=String(e)}
return o});
console.log(JSON.stringify(r),errs);await b.close()})();
