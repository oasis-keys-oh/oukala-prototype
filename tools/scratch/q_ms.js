const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1200,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_mat/full.html'));await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(()=>{const P=plan("now");return {ms:TASKS.map(t=>[t.id,t.n,fmtD(P.R[t.id].ef,true)]), today:TODAY, y1:wdOf("2027-10-06"), d:DEMAND.map(d=>[d.id,d.m0,d.mo]),px:SCALE.projects().slice(0,3),pe:P.pe}})));await b.close()})();
