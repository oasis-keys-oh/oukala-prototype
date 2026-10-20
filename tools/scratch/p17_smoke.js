const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push('console: '+m.text());if(m.type()==='warning'&&/R17P/.test(m.text()))errs.push('WARN '+m.text())});
await p.route(/^https?:/,r=>r.abort());const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:120000});console.log('load',Date.now()-t0);await p.waitForTimeout(800);
console.log(await p.evaluate(()=>JSON.stringify({v:R17P.errors,screens:SCREENS.some(s=>s[0]==='r17p_tour'),launch:!!document.getElementById('r17pLaunch')})));
await p.evaluate(()=>go('r17p_tour'));await p.waitForTimeout(400);await p.screenshot({path:'r17_shots/p_hub.png'});
console.log(errs);await b.close()})();
