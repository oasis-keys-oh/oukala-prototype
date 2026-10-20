const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const code=process.argv[3];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.AGENTRT&&AGENTRT.booted,null,{timeout:60000});
const r=await p.evaluate(code);console.log(typeof r==='string'?r:JSON.stringify(r,null,1).slice(0,6000));console.log('errs',errs.slice(0,5));await b.close()})();
