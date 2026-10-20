const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext()).newPage();p.setDefaultTimeout(150000);await p.route(/^https?:/,r=>r.abort());
const t=Date.now();await p.goto('file://'+path.resolve(process.argv[2]),{waitUntil:'domcontentloaded'});console.log('dcl',Date.now()-t);
await p.waitForFunction(()=>typeof ZLINK!=='undefined'||typeof SCREENS!=='undefined',null,{timeout:150000}).catch(e=>console.log('wait fail'));console.log('ready',Date.now()-t);await b.close()})();
