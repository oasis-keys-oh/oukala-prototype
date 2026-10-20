const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1000,height:900}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(0,4).join(' | ')));p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
if(a[1]){const r=await p.evaluate(a[1]);console.log(r)}
await b.close()})();
