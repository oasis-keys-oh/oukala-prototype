const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();p.on('pageerror',e=>console.log('PE',e.message,(e.stack||'').split('\n').slice(0,3).join('|')));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(1500);await b.close()})();
