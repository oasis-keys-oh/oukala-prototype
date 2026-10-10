const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>NAVX.ensureIndex());
await p.waitForFunction(()=>NAVX.index.built,null,{timeout:60000});
const r=await p.evaluate(()=>{const I=NAVX.index;const ty={};I.items.forEach(i=>ty[i.ty]=(ty[i.ty]||0)+1);return {n:I.items.length,ms:I.buildMs,ty,skipped:I.skipped,slow:I.timings.filter(t=>t[1]>40),inc:NAVX.search("incident",{limit:8}).results.map(x=>x.type+":"+x.title).slice(0,8),counts:NAVX.search("incident").counts}});
console.log(JSON.stringify(r,null,1));console.log(errs);await b.close()})();
