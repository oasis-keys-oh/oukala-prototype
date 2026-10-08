const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1500,height:1100}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>{go('ims')});await p.waitForTimeout(300);await p.evaluate(()=>window.scrollTo(0,420));await p.waitForTimeout(200);await p.screenshot({path:'g1.png'});
await p.evaluate(()=>{S.ims.scen='lumen5';render();window.scrollTo(0,420)});await p.waitForTimeout(200);await p.screenshot({path:'g2.png'});
await p.evaluate(()=>{go('port');window.scrollTo(0,300)});await p.waitForTimeout(300);await p.screenshot({path:'g3.png'});
console.log(await p.evaluate(()=>METRICS.m_spi.cur),errs);await b.close()})();
