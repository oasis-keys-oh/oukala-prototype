const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]);const w=+a[1]||1440,dark=a.includes('--dark'),scale=a.includes('--scale');
const steps=JSON.parse(a[2]);fs.mkdirSync(path.join(dir,'shots'),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:w,height:w<500?820:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(600);
if(scale)await p.evaluate(()=>SCALE.set(true));
for(const st of steps){ // {name, js, wait, full}
 const t0=Date.now();await p.evaluate(st.js).catch(e=>errs.push(st.name+': '+e.message));await p.waitForTimeout(st.wait||400);
 const ms=await p.evaluate(()=>window.__t||0);
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await p.screenshot({path:path.join(dir,'shots',st.name+(w<500?'-phone':'')+(dark?'-dark':'')+'.png'),fullPage:!!st.full});console.log(st.name,'overflowX',ox,'elapsed',Date.now()-t0)}
console.log('errors:',errs.length?errs:'none');await b.close()})();
