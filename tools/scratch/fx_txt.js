const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
const t0=Date.now();await p.evaluate(s=>go(s),process.argv[3]);await p.waitForTimeout(2000);
console.log(Date.now()-t0,errs,(await p.evaluate(()=>document.querySelector('main,#app,.screen')?.innerText||document.body.innerText)).slice(0,400));await b.close()})();
