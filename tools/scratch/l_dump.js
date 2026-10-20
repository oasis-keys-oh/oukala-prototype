const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1300,height:900}})).newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const o={};o.proc=Object.keys(PROC.defs).map(k=>k+"|"+PROC.defs[k].title+"|"+PROC.defs[k].steps.length);
o.ents=PLAT.entities().map(e=>e.id+":"+e.domain+":"+e.fields.filter(f=>f.type==="ref").map(f=>f.k).join("+")).join("\n");
o.scr=SCREENS.map(s=>s[0]).join(",");o.nm=Object.keys(METRICS).length;
const ap=new Set();PLAT.APPS.forEach(a=>ap.add(a.n));o.mu=Object.keys(METRICS).filter(k=>METRICS[k].use&&METRICS[k].use.some(u=>PLAT.APPS.some(a=>a.n===u))).length;
return o});
console.log(r.proc.join("\n"));console.log(r.ents);console.log(r.scr);console.log(r.nm,r.mu);await b.close()})();
