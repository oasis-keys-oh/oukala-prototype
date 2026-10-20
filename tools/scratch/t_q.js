const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(8000);const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.resolve('out_flow/full.html'));await p.waitForTimeout(600);console.log('loaded',errs);
const r=await Promise.race([p.evaluate(()=>{try{go('flw_design');return 'ok '+document.querySelector('#main, .screen')?.innerText.length}catch(e){return 'ERR '+e.stack}}),new Promise(r=>setTimeout(()=>r('TIMEOUT'),10000))]);console.log(r,errs);
process.exit(0)})();
