const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const code=process.argv[3];const W=+process.argv[4]||390,H=+process.argv[5]||844;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1800);
console.log(JSON.stringify(await p.evaluate(code),null,1));
await b.close()})();
