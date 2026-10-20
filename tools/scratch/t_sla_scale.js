const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_slafull');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(500);
for(let i=0;i<6;i++){const ms=await p.evaluate(i=>{const t=performance.now();S.v.svc_slav=i;go('svc_sla');render();return performance.now()-t},i);await p.waitForTimeout(1500);console.log('tab',i,Math.round(ms)+'ms')}
console.log('agreements',await p.evaluate(()=>SLAX.AGS().length));
await p.evaluate(()=>{S.v.svc_slav=0;render()});await p.waitForTimeout(1500);await p.screenshot({path:dir+'/shots/sla_scale0.png'});
console.log('errors',errs.length?errs:'none');await b.close()})();
