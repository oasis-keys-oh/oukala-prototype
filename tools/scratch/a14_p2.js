const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'})).newPage();p.setDefaultTimeout(60000);
p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>m.type()==='error'&&console.log('CE',m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a14/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(500);
console.log('loaded');
await p.evaluate(()=>{S.org.mode='both';S.org.k=0;go('org_chart')});console.log('went');await p.waitForTimeout(800);
await p.locator('.org-wrap').screenshot({path:'out_a14/s_wrap.png'});console.log('shot');await b.close()})();
