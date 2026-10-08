const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const o={};let t=performance.now();SCALE.set(true);o.scale=Math.round(performance.now()-t);
for(const id of ['ppm_proj','ppm_raid','port']){t=performance.now();go(id);o[id]=Math.round(performance.now()-t)}
const n=document.querySelectorAll('.vsw').length;o.tabs=[];const labs=[...document.querySelectorAll('.vsw')];return o});
console.log(JSON.stringify(r),errs);
// per tab timing for ppm_proj
await p.evaluate(()=>go('ppm_proj'));
const names=await p.evaluate(()=>[...document.querySelectorAll('.vsw label')].map(l=>l.textContent.trim()));
for(const n of names){const t=await p.evaluate(n=>{const l=[...document.querySelectorAll('.vsw label')].find(l=>l.textContent.trim()===n);const t0=performance.now();l.click();return Math.round(performance.now()-t0)},n);console.log(n,t)}
await b.close()})();
