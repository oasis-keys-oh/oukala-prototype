const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);await p.evaluate(()=>SCALE.set(true));
const r=await p.evaluate(()=>{const c={};const o=window.plan||plan;let n=0;window.__c=c;
 const orig=plan;try{window.plan=function(){n++;const s=new Error().stack.split("\n").slice(2,5).map(x=>x.trim().slice(0,70)).join(" < ");c[s]=(c[s]||0)+1;return orig.apply(this,arguments)}}catch(e){}
 go('ppm_proj');return {n,top:Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5)}});
console.log(JSON.stringify(r,null,1));await b.close()})();
