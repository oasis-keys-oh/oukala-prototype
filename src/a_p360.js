const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const tags=WORK.map(w=>w.tag).join(',');const names=['Sam Patel','Priya Shah','Maya Ortiz','Tom Becker','Triage Agent','Avery Chen'];const out={};names.forEach(n=>{try{const W=workFor(n);out[n]=W.map(g=>g.kind+':'+g.rows.length).join('; ')}catch(e){out[n]='ERR '+e.message}});return {n:WORK.length,tags,out}}));
await p.evaluate(()=>person360('Sam Patel'));await p.waitForTimeout(500);await p.evaluate(()=>document.querySelectorAll('#drawer .vsw label')[1].click());await p.waitForTimeout(500);await p.screenshot({path:'aud/p360.png'});
console.log(errs);await b.close()})();
