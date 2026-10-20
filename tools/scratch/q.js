const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const p=await b.newPage();await p.goto('file://'+path.resolve('out_kcs/full.html'));await p.waitForTimeout(400);
console.log(await p.evaluate(()=>KCS_TEST.ART.map(a=>a.id+" "+a.st+" "+JSON.stringify(KCS_TEST.qual(a))).join("\n")));await b.close()})()
