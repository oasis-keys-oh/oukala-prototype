const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(1,4).join('|')));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);await b.close()})();
