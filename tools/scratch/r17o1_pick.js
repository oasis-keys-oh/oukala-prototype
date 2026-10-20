const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();p.setDefaultTimeout(120000);
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(process.argv[2])+'/full.html',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.go&&document.querySelector('#view').children.length>0);await p.waitForTimeout(1500);
await p.evaluate(()=>go('itsm_inc'));await p.waitForTimeout(800);
const s=p.locator('#view details.mp > summary').first();await s.scrollIntoViewIfNeeded();await s.tap();await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const m=document.querySelector('details.mp[open]');return m?JSON.stringify(m.querySelector('.mpp').getBoundingClientRect()):'none open'}));
await p.screenshot({path:'r17_shots/o1_p390_picker.png'});await b.close()})();
