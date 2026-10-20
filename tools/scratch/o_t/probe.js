const {chromium}=require('playwright');const path=require('path');
const [,,out,file]=process.argv;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto('file://'+path.resolve(out+'/full.html'));await p.waitForTimeout(3500);
const js=require('fs').readFileSync(file,'utf8');
const r=await p.evaluate(js);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));
if(errs.length)console.log('ERRORS',errs.slice(0,10));await b.close()})()
