const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]),code=process.argv[3];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(400);
const r=await p.evaluate(code).catch(e=>'EVALERR '+e.message);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));console.log('errors:',errs.length?errs:'none');await b.close()})();
