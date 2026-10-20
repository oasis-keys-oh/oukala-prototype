const {chromium}=require('playwright');
(async()=>{const out=process.argv[2];const code=require('fs').readFileSync(process.argv[3],'utf8');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await p.goto('file://'+out+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
const r=await p.evaluate(code);console.log(typeof r==='string'?r:JSON.stringify(r,null,0));await b.close()})();
