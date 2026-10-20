const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext()).newPage();
p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(0,4).join('|')));p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(800);console.log(await p.evaluate(()=>document.body.innerHTML.length));await b.close()})();
