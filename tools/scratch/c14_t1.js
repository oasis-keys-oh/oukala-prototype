const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dark=process.argv.includes('--dark');const dir=path.resolve('out_c14');fs.mkdirSync(dir+'/shots',{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
p.setDefaultTimeout(150000);await p.goto('file://'+dir+'/full.html',{timeout:150000});await p.waitForTimeout(1500);
const sfx=dark?'-dark':'';
const shot=async(n,full)=>{await p.waitForTimeout(350);await p.screenshot({path:dir+'/shots/c14_'+n+sfx+'.png',fullPage:!!full});};
// 1 guides orders
await p.evaluate(()=>go('svc_guides'));await shot('orders',true);
console.log(await p.evaluate(()=>JSON.stringify({wired:OGX.wired,ws:OGX.wireState,ent:OGX.entWarn,mod:OGX.modWarn})));
// catalog next tab
await p.evaluate(()=>{go('svc_portal');});await p.waitForTimeout(200);
await p.evaluate(()=>{const V=S.svc;V.pItem='laptop';V.pTab=2;render()});await shot('next_laptop',true);
await p.evaluate(()=>{S.svc.pItem='laptop';S.svc.pTab=0;render()});await shot('forpanel_laptop');
console.log('errors:',errs.length?errs:'none');await b.close()})();
