const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:1000}})).newPage();const e=[];p.on('pageerror',x=>e.push('PE '+x.message));p.on('console',m=>m.type()==='error'&&e.push(m.text()));
await p.goto('file://'+process.cwd()+'/out_ppm/full.html');await p.waitForTimeout(400);
const D='out_ppm/shots/';
// scale
await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(500);
for(const [s,t] of [['port',0],['port',2],['ppm_proj',0],['ppm_proj',3],['ppm_proj',5],['ppm_proj',6],['ppm_proj',7],['ppm_raid',0],['ppm_raid',2]]){
 const ms=await p.evaluate(([s,t])=>{const k=s==='port'?'port':s==='ppm_proj'?'ppmv':'raid';S.v[k]=t;const a=performance.now();go(s);return Math.round(performance.now()-a)},[s,t]);await p.waitForTimeout(300);console.log(s,t,ms+'ms');await p.screenshot({path:D+`s_${s}_${t}.png`,fullPage:true})}
// addDemand + persons
console.log(await p.evaluate(()=>{const id=addDemand({title:'Scale test',reason:'sla breach on portal',source:'SLA breach',cost:100,service:'Codification Portal',kind:'SLA breach follow-up'});return id+' '+workload('Maya Ortiz').pct+' '+SKILLS.length}));
console.log('errors',e);await b.close()})();
