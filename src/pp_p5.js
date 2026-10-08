const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const o={};['Sam Patel','Priya Shah','Omar Hamid','Tom Becker'].forEach(n=>{o[n]=workFor(n).map(g=>g.kind+':'+g.rows.length).join(', ')});return JSON.stringify(o)}),errs);await b.close()})();
