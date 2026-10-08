const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const v=document.getElementById('view');return v.innerHTML.length+' '+getComputedStyle(v.firstElementChild||v).opacity+' '+S.screen}));console.log(errs);await b.close()})();
