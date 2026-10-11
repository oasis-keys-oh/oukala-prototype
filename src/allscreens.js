const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const phone=process.argv.includes('--phone');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(600);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));console.log(ids.length,'screens');
for(const id of ids){const n0=errs.length;await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(150);
 const r=await p.evaluate(()=>({ox:document.documentElement.scrollWidth>innerWidth+1,len:document.querySelector('#view').innerHTML.length}));
 if(r.ox||r.len<400||errs.length>n0)console.log('!!',id,JSON.stringify(r),errs.slice(n0))}
console.log('total errors',errs.length);await b.close()})();
