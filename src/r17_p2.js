const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:+(process.env.W||390),height:844},isMobile:true,hasTouch:true});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.cwd()+'/out_o217/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(800);
await p.evaluate(i=>go(i),process.argv[2]);await p.waitForTimeout(+(process.env.WT||900));
console.log(await p.evaluate(process.argv[3]));await b.close()})()
