const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const d of process.argv.slice(2)){const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.stack));await p.goto('file://'+path.resolve(d+'/full.html'));await p.waitForTimeout(800);console.log(d,errs)}process.exit(0)})();
