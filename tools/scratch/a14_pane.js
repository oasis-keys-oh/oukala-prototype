const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=process.argv[2];const ev=process.argv[3];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(dir+'/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(500);
await p.evaluate(ev);await p.waitForTimeout(800);
const labs=await p.evaluate(()=>[...document.querySelectorAll('#drawer label')].map(l=>l.textContent.trim()).filter(x=>x&&x.length<40));
for(const l of [...new Set(labs)].slice(0,13)){await p.evaluate(l=>{[...document.querySelectorAll('#drawer label')].find(x=>x.textContent.trim()===l).click()},l);await p.waitForTimeout(150);
console.log('== '+l+'\n'+(await p.evaluate(()=>document.getElementById('drawer').innerText.split('\n').filter(x=>x.length>70).join('\n'))))}
await b.close()})();