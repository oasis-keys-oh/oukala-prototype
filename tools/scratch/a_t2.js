const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>go('ims'));await p.waitForTimeout(500);
await p.click('#view .vsw label:nth-child(3)');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>[...document.querySelectorAll('input[id^=v-ims-]')].map(i=>i.id+':'+i.checked).join(' ')));
await p.screenshot({path:'aud/ims_ms2.png',fullPage:false});
await b.close()})();
