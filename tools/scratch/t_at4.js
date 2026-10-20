const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('out_atlas','full.html'));await p.waitForTimeout(600);await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(300);
console.log(await p.evaluate(()=>JSON.stringify(LIN.stats())));await b.close()})();
