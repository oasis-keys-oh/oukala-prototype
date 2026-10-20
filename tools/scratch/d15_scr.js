const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(700);
const sc=process.argv.includes('--scale');if(sc){const t=Date.now();await p.evaluate(()=>SCALE.set(true));console.log('scale set',Date.now()-t)}
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const out=[];
for(const id of ids){const r=await p.evaluate(i=>{const t=performance.now();try{go(i)}catch(e){return [-1,0]}return [Math.round(performance.now()-t),document.querySelector('#view').querySelectorAll('*').length]},id);out.push([id,...r])}
out.sort((a,b)=>b[1]-a[1]);console.log(out.slice(0,15).map(x=>x.join(' ')).join('\n'));console.log('sum',out.reduce((a,x)=>a+x[1],0),'errs',errs.length,errs.slice(0,3));await b.close()})();
