const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('ERR',e.stack.split('\n').slice(0,4).join('|')));
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(800);console.log('loaded');await b.close()})();
