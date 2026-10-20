const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const scale=process.argv.includes('--scale');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
if(scale)await p.evaluate(()=>SCALE.set(true));
for(const [s,vk,n] of [['svc_sla','svc_slav',6],['svc_oncall','svc_ocv',7],['svc_skills','svc_skv',7]]){
 for(let i=0;i<n;i++){const t=await p.evaluate(([s,vk,i])=>{const t0=performance.now();try{S.v[vk]=i;go(s)}catch(e){return 'ERR '+e.message}return Math.round(performance.now()-t0)},[s,vk,i]);
  const info=await p.evaluate(()=>({h:document.querySelector('#main,main,.main')?.scrollHeight,proc:!!document.querySelector('.proc,.procstrip,[data-proc]')}));console.log(s,i,t,JSON.stringify(info))}}
console.log(errs.slice(0,5));await b.close()})();
