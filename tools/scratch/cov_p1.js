const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(process.argv[2],'full.html'));await p.waitForTimeout(800);
console.log(await p.evaluate(process.argv[3]));console.log('errs',errs);await b.close()})();
