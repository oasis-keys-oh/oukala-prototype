const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{try{SCALE.set(true)}catch(e){return 'noscale '+e.message}const o={};for(const s of ['fin_model','fin_color','fin_spend','fin_budget','fin_gates','fin_alloc','fin_rules']){for(let v=0;v<6;v++){const t=performance.now();S.v=S.v||{};S.v[s]=v;go(s);o[s+v]=Math.round(performance.now()-t)}}return Math.max(...Object.values(o))});
console.log('max ms',r,'wiring',await p.evaluate(()=>FIN.wiring()),'ERRS',errs.slice(0,5));await b.close()})();
