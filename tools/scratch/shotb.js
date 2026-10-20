const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]);const phone=a.includes('--phone'),dark=a.includes('--dark');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const jobs=JSON.parse(a[1]);
for(const [name,js] of jobs){await p.evaluate(js).catch(e=>errs.push(name+': '+e.message));await p.waitForTimeout(400);
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await p.screenshot({path:dir+'/shots/'+name+(phone?'-ph':'')+(dark?'-dk':'')+'.png',fullPage:!a.includes('--view')});console.log(name,'ox',ox)}
console.log('errors',errs.length?errs:'none');await b.close()})();
