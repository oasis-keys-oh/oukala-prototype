const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage();const t=Date.now();await p.route(/fonts\.g/,r=>r.abort());
await p.goto('file://'+path.resolve(process.argv[2]+'/full.html'),{waitUntil:'load',timeout:90000});console.log(process.argv[2],Date.now()-t);await b.close()})();
