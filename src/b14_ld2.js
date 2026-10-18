const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>m.type()==='error'&&console.log('C',m.text()));
await p.goto('file://'+process.argv[2],{waitUntil:'commit',timeout:60000});await p.waitForTimeout(9000);
console.log('ready',await Promise.race([p.evaluate(()=>typeof FLOWX+' '+typeof FLOWX._ins),new Promise(r=>setTimeout(()=>r('HUNG'),15000))]));
await b.close()})();
