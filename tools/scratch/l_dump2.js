const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1300,height:900}})).newPage();
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
const r=await p.evaluate(()=>PLAT.entities().map(e=>e.id+" ["+e.owner+"] w="+e.writers.length+" r="+e.readers.length+" :: "+e.fields.filter(f=>f.type==="ref").map(f=>f.k+"("+f.label+")"+(f.opts?JSON.stringify(f.opts).slice(0,40):"")).join(" | ")+"  types:"+[...new Set(e.fields.map(f=>f.type))].join(",")).join("\n")+"\nMETRICS use:\n"+Object.keys(METRICS).filter(k=>(METRICS[k].use||[]).length).slice(0,400).map(k=>k+": "+METRICS[k].use.join("; ")).join("\n").slice(0,3500)+"\nSCREENS "+JSON.stringify(SCREENS.slice(0,3)));
console.log(r);await b.close()})();
