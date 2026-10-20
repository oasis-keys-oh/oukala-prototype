const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const tag=process.argv[3]||'base';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'});
const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
for(const id of ['home','invoices','projects']){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(500);await p.screenshot({path:`r17_shots/${tag}_${id}.png`})}
console.log(await p.evaluate(()=>SCREENS.slice(0,12).map(s=>s[0]).join(',')));
await b.close()})();
