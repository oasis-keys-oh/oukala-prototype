const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('out_c13/full.html'));await p.waitForTimeout(2000);
console.log(JSON.stringify(await p.evaluate(()=>{const s=ATLAS.coverage().screens.find(x=>x.id==='dec_cov');const f=ATLAS.coverage().screens.find(x=>x.id==='plat_contract');return {dec:s&&{r:s.records.length,m:s.missing,st:s.state},ct:f&&{r:f.records.length,ents:f.records.map(r=>r.r&&r.r.ent)}}})));
process.exit(0)})();
