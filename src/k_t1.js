const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
const t0=Date.now();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:300000});console.log('dcl',Date.now()-t0);
for(let i=0;i<30;i++){await p.waitForTimeout(2000);const r=await p.evaluate(()=>({t:performance.now()|0,lin:window.R16K&&R16K.lineage,app:!!(window.R15E&&R15E.state&&R15E.state.applied)})).catch(e=>'busy '+e.message.slice(0,40));console.log(Date.now()-t0,JSON.stringify(r));if(r&&r.lin)break}
console.log(errs.slice(0,5));await b.close()})();
