const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const code=a[1];const w=+(a[2]||1440),h=+(a[3]||900);const dark=a.includes('--dark');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
const r=await p.evaluate(code);console.log(typeof r==='string'?r:JSON.stringify(r));if(errs.length)console.log('ERRS',errs.slice(0,8));
const shot=a.includes('--shot')?a[a.indexOf('--shot')+1]:null;if(shot){await p.waitForTimeout(400);await p.screenshot({path:shot})}
await b.close()})();
