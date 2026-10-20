const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
const r=await p.goto('https://oukala-prototype.netlify.app/',{waitUntil:'networkidle'});
console.log('status',r.status(),'xrobots',r.headers()['x-robots-tag']);
await p.waitForTimeout(1500);console.log('title',await p.title(),'screens',await p.evaluate(()=>typeof SCREENS!=='undefined'?SCREENS.length:-1));
await p.screenshot({path:'live.png'});console.log('errors',errs);await b.close()})();
