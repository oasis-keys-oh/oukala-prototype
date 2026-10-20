const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const n0=PPMX.tasksOf('PR3').length;const r=PPMX.addTasks('PR3',[{n:'AUDITTASK_ONE',dur:2,own:'Sam Patel'},{n:'AUDITTASK_TWO',dur:1,pred:[]}]);const n1=PPMX.tasksOf('PR3').length;go('ppm_wbs');const a=document.querySelector('#view').innerText.includes('AUDITTASK_ONE');go('plan');const b=document.querySelector('#view').innerText.includes('AUDITTASK_ONE');const w=workFor('Sam Patel').flatMap(g=>g.rows).some(r=>/AUDITTASK_ONE/.test(r.t));return JSON.stringify({r:typeof r,n0,n1,inWbsScreen:a,inPlan:b,onPlate:w})}));
// release readiness push: find API
console.log(await p.evaluate(()=>{const R=RELX.releases;const rel=(typeof R==='function'?R():R)[0];return JSON.stringify({id:rel.id,keys:Object.keys(rel).join(',')})}));
console.log(errs);await b.close()})();
