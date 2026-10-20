const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(400);
await p.evaluate(()=>SCALE.set(true));
console.log(await p.evaluate(()=>{const o={};const D=pp2Debug;let t=performance.now();const lap=k=>{const n=performance.now();o[k]=Math.round(n-t);t=n};
D.HX();lap('HX');D.PM('Sam Patel');lap('src+1PM');DIR.forEach(d=>D.PM(d.name));lap('allPM');D.agg(DIR.map(d=>d.name),'x');lap('agg');DIR.filter(d=>d.kind==='human').slice(0,380).forEach(d=>{try{D.perfOf(d.name)}catch(e){}});lap('perfOf all');
S.pp2.tab.ppl_org=1;go('ppl_org');lap('org1 go');return JSON.stringify(o)}));await b.close()})();
