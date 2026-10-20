const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+(e.stack||'').split('\n').slice(0,3).join('|')));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);console.log('ERRS',errs);await b.close()})();
