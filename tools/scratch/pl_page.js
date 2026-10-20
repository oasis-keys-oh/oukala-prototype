const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]),id=process.argv[3],W=+(process.argv[4]||1440),dark=process.argv[5]==='dark';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:W,height:W<600?820:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
await p.evaluate(i=>{go('plat_proc');PROCLIB.open(i)},id);await p.waitForTimeout(500);
const h=await p.evaluate(()=>{const d=document.getElementById('drawer');return d.scrollHeight});
for(let i=0;i*800<h&&i<6;i++){await p.evaluate(y=>{document.getElementById('drawer').scrollTop=y},i*780);await p.waitForTimeout(150);await p.screenshot({path:`${dir}/shots/pg_${id}_${W}_${i}.png`})}
console.log('h',h,'errors',errs);await b.close()})();
