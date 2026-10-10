const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const tab=process.argv[3];const pre=process.argv[4]||'';const out=process.argv[5]||'ct';const phone=process.argv.includes('--phone'),dark=process.argv.includes('--dark');const wait=+(process.argv.find(a=>a.startsWith('--wait='))||'--wait=600').split('=')[1];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(700);
await p.evaluate(t=>{S.v.contract=+t;go('plat_contract')},tab);await p.waitForTimeout(400);
if(pre){await p.evaluate(pre).catch(e=>errs.push('pre '+e.message));await p.waitForTimeout(wait)}
const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
await p.screenshot({path:dir+'/shots/'+out+'.png',fullPage:process.argv.includes('--full')});console.log(out,'overflowX',ox,'errors',errs.length?errs:'none');await b.close()})();
