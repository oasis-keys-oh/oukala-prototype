const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext()).newPage();
p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>m.type()==='error'&&console.log('C',m.text().slice(0,300)));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_f3_15/full.html'),{timeout:120000});await p.waitForTimeout(800);
console.log(await p.evaluate(()=>[typeof R15I,typeof R15T,typeof R15R,typeof R15M,typeof GUARD].join()));await b.close()})();
