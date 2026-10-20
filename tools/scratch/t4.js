const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_svc');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1300}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);await p.evaluate(()=>go('svc_cat'));
await p.evaluate(()=>{const t=document.createElement('button');t.dataset.svc='design|laptop';document.body.appendChild(t);t.click()});await p.waitForTimeout(1200);
await p.evaluate(()=>{const d=document.getElementById('drawer');d.scrollTop=d.scrollHeight});await p.waitForTimeout(400);await p.screenshot({path:dir+'/shots/form-item.png'});
// toggle a variable in preview
await p.evaluate(()=>{const b=document.querySelector('[data-svc="vc|dz|reason|Lost or stolen"]');});
console.log(errs);await b.close()})();
