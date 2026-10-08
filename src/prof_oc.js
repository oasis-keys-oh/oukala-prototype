const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
for(const sc of (process.argv[3]||'svc_oncall,svc_skills,svc_sla').split(',')){
 const r=await p.evaluate(async id=>{const t=performance.now();go(id);const t1=performance.now()-t;await new Promise(r=>setTimeout(r,50));
 const tabs=[...document.querySelectorAll('#view input[type=radio]')];const res=[];for(let i=0;i<tabs.length;i++){const t2=performance.now();tabs[i].click();await new Promise(r=>setTimeout(r,30));res.push(Math.round(performance.now()-t2))}
 return {go:Math.round(t1),tabs:res}},sc);console.log(sc,JSON.stringify(r))}
console.log(errs);await b.close()})();
