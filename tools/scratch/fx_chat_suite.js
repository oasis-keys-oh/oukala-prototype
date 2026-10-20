const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const s=CHATX.runSuite();return {pass:s.pass,total:s.rows.length,bad:s.rows.filter(r=>r.plan!=="pass"||r.exec==="fail"||r.exec==="handled").map(r=>r.id+":"+r.plan+"/"+r.guard+"/"+r.exec+" "+r.why.slice(0,80))}});
console.log(r.pass,r.total);console.log(r.bad.join("\n"));console.log(errs);await b.close()})();
