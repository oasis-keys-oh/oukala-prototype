const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const code=process.argv[3];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
const r=await p.evaluate(code).catch(e=>'EVALERR '+e.message);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));if(errs.length)console.log('ERRS',errs.slice(0,6));await b.close()})();
