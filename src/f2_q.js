const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1400,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(+(process.env.W||5000));
const r=await p.evaluate(process.argv[3]);console.log(typeof r==='string'?r:JSON.stringify(r,null,1).slice(0,+(process.argv[4]||3500)));console.log('ERRS',errs.slice(0,5));await b.close()})();
