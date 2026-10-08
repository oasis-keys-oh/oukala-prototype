// node fx_shot.js DIR screen width tabIndex out [dark] [scale]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:+a[2],height:1000},colorScheme:a[5]==='dark'?'dark':'light'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(a[0])+'/full.html');await p.waitForTimeout(500);
if(a[6]==='scale'){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(300)}
const t0=Date.now();await p.evaluate(s=>go(s),a[1]);await p.waitForTimeout(300);
const n=+a[3];if(n>0){await p.evaluate(n=>{const v=document.querySelector('.views');const nm=v&&v.dataset.views;S.v[nm]=n;render()},n);await p.waitForTimeout(1500)}
await p.screenshot({path:a[4],fullPage:a[7]==='full'});console.log(a[4],'errs',errs,'ms',Date.now()-t0);await b.close()})();
