const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext()).newPage();p.setDefaultTimeout(150000);await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+path.resolve('scr/base.html'));await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>JSON.stringify({ids:MODMAP.modules.map(m=>m.id).filter(i=>/inv|bud|fin|exe_dash|audit|notify|inbox|ppm_proj|reserve|over/.test(i)),invflows:MODMAP.flows.filter(f=>f.from==='inv'||f.to==='inv').map(f=>f.from+'>'+f.to)})));await b.close()})();
