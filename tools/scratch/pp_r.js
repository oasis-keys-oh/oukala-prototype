const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({reducedMotion:'reduce',viewport:{width:+a[2]||1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CE',m.text())});
await p.goto('file://'+path.resolve(a[0]+'/full.html'));await p.waitForTimeout(500);await p.evaluate(i=>go(i),a[1]);await p.waitForTimeout(300);
if(a[3]){await p.evaluate(a[3]);await p.waitForTimeout(500)}
if(a[4]){await p.screenshot({path:a[4],fullPage:a[5]==='full'})}
console.log(await p.evaluate(()=>document.querySelector('.screen')?document.querySelector('.screen').innerText.length:-1));await b.close()})();
