const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1400,height:1000},colorScheme:'dark'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>{go('ims');window.scrollTo(0,380)});await p.waitForTimeout(300);await p.screenshot({path:'dk_ims.png'});
await p.evaluate(()=>{go('home')});await p.waitForTimeout(300);await p.evaluate(()=>window.scrollTo(0,700));await p.screenshot({path:'dk_home.png'});
console.log(errs);await b.close()})();
