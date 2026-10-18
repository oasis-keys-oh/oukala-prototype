const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>m.type()==='error'&&console.log('CONSOLE',m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());const t=Date.now();
await p.goto('file://'+process.argv[2]+'/full.html',{waitUntil:'domcontentloaded',timeout:170000});console.log('dcl',Date.now()-t);
await p.waitForFunction(()=>window.PERM&&window.PERM.state,null,{timeout:120000});console.log('perm',Date.now()-t);
const o=await p.evaluate(()=>({rules:PERM.state.rules.length,ok:PERM.can('ops','read','screen:inv').ok,ok2:PERM.can('fin','read','screen:inv').ok}));console.log(JSON.stringify(o));await b.close()})();
