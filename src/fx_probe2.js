const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(800);
const r=await p.evaluate((src)=>{try{return JSON.stringify(eval(src)).slice(0,3000)}catch(e){return 'ERR '+e.message}},process.argv[3]);
console.log(r);console.log(errs);await b.close()})();
