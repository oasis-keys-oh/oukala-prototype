const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
const r=await p.evaluate(async code=>{try{const v=await (0,eval)(code);return typeof v==='string'?v:JSON.stringify(v)}catch(e){return 'ERR '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join('|')}},process.argv[3]);
console.log(r.slice(0,+process.argv[4]||1500),errs);await b.close()})();
