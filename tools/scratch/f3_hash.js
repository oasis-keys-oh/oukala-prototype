const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_f3_15/full.html')+'#m',{timeout:240000,waitUntil:'domcontentloaded'});await p.waitForTimeout(5000);
console.log(await p.evaluate(()=>S.screen+' '+document.body.className+' '+!!document.querySelector('.r3m-tabs')));
await p.screenshot({path:'out_f3_15/shots/hash_m_390_d.png'});
await p.evaluate(()=>{S.r15m.offline=true;render()});await p.click('.r3m-b.ok >> nth=0');await p.waitForTimeout(300);console.log('queued',await p.evaluate(()=>S.r15m.queue.length));
await p.screenshot({path:'out_f3_15/shots/m_queue_390_d.png'});await b.close()})();
