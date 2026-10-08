const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>JSON.stringify({types:Object.keys(VIZ.types).length,names:Object.keys(VIZ.types).join(','),shapes:Object.keys(VIZ.shapes||{}).join(','),lib:(VIZ.lib||[]).length,pals:Object.keys(VIZ.PALS||{}).length})));
await b.close()})();
