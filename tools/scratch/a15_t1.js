const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'})).newPage();
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a15/full.html'),{waitUntil:'load'});await p.waitForTimeout(1500);
await p.evaluate(()=>{S.org.mode='human';S.org.k=0;go('org_chart')});await p.waitForTimeout(800);
console.log(await p.evaluate(()=>JSON.stringify({vac:document.querySelectorAll('.org-vac').length,et:document.querySelectorAll('.org5-et').length,wired:ORGX.wired,w5:ORGX.wired5,ws:ORGX.wireState5,pw:ORGX.procWarn5})));
await p.screenshot({path:'out_a15/s1.png'});
console.log(errs);await b.close()})();
