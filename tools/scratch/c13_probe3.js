const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('out_c13/full.html'));await p.waitForTimeout(1200);
const r=await p.evaluate(()=>PROCLIB.list().map(x=>x.id+"|"+x.name+"|"+x.familyName+"|"+x.owner+"|"+PROC.policyFor(x.id).key).join("\n"));
console.log(r);
console.log(await p.evaluate(()=>JSON.stringify([...new Set(PROCLIB.list().map(x=>x.familyName))])));
process.exit(0)})();
