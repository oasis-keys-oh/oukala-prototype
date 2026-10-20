const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>m.type()==='error'&&console.log('CONSOLE',m.text().slice(0,300)));p.on('crash',()=>console.log('CRASH'));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2]+'/full.html',{waitUntil:'domcontentloaded',timeout:170000});
await p.waitForFunction(()=>window.PERM&&window.NAVX&&NAVX.persona&&document.querySelector('#nav')&&document.querySelector('#view'),null,{timeout:170000});await p.waitForTimeout(1500);
const steps=require(process.argv[3]);for(const [name,fn,arg] of steps){const t=Date.now();try{const r=await p.evaluate(fn,arg);console.log(name,Date.now()-t,'ms',JSON.stringify(r).slice(0,900))}catch(e){console.log(name,'ERR',e.message.slice(0,300))}}
await b.close()})();
