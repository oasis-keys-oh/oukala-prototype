const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
// usage: node b15/shot.js OUT name screen "evalJS" [--dark] [--phone] [--full]
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),name=a[1],sc=a[2],ev=a[3]&&a[3]!=='-'?a[3]:null;const dark=a.includes('--dark'),phone=a.includes('--phone'),full=a.includes('--full');
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource/.test(m.text())&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(2500);
if(dark)await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
if(sc&&sc!=='-'){await p.evaluate(i=>go(i),sc).catch(e=>errs.push(sc+': '+e.message));await p.waitForTimeout(500)}
if(ev){const r=await p.evaluate(ev).catch(e=>{errs.push('eval: '+e.message)});if(r!==undefined)console.log('eval ->',typeof r==='string'?r:JSON.stringify(r));await p.waitForTimeout(700)}
const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
const f=path.join(dir,'shots',name+(phone?'-phone':'')+(dark?'-dark':'')+'.png');await p.screenshot({path:f,fullPage:full});console.log(f,'overflowX:',ox,'errors:',errs.length?errs:'none');await b.close()})();
