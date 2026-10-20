const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
const t0=Date.now();await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(800);console.log('load',Date.now()-t0);
const r=await p.evaluate(()=>({personas:Object.entries(PERSONAS).map(([k,v])=>[k,v.n,v.r||v.role,(v.nav||v.screens||[]).length, Object.keys(v).join(',')]),screens:SCREENS.length,groups:[...new Set(SCREENS.map(s=>s[3]||''))],cur:S.persona,scr:S.screen,metrics:Object.keys(METRICS).length}));
console.log(JSON.stringify(r,null,1).slice(0,5000));console.log(errs);await b.close()})();
