const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'})).newPage();p.setDefaultTimeout(15000);
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(process.argv[2]+'/full.html'),{waitUntil:'load',timeout:60000});console.log('loaded');
for(const s of ['home','people','org_chart']){const t=Date.now();try{await p.evaluate(s=>go(s),s);console.log(s,'ok',Date.now()-t)}catch(e){console.log(s,'FAIL',e.message.slice(0,80));break}}
await b.close()})();
