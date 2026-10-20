const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const ids=(process.argv[3]||'itom_evt').split(',');const scale=process.argv.includes('--scale');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
if(scale){const t=await p.evaluate(()=>{const t=performance.now();SCALE.set(true);return performance.now()-t});console.log('SCALE.set',Math.round(t))}
for(const id of ids){const t=await p.evaluate(i=>{const t=performance.now();go(i);return [Math.round(performance.now()-t),document.querySelector('#view').querySelectorAll('*').length]},id);
const t2=await p.evaluate(i=>{const t=performance.now();go(i);return Math.round(performance.now()-t)},id);console.log(id,'first',t[0],'ms nodes',t[1],'second',t2)}
console.log(errs.slice(0,5));await b.close()})();
