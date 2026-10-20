const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'out_j16');const dark=process.argv.includes('--dark');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:300000});console.log('load ms',Date.now()-t0);await p.waitForTimeout(1500);
for(let i=0;i<5;i++){await p.evaluate(i=>{go('r16j_dash');S.v.r16j_dash=i;render()},i);await p.waitForTimeout(700);
 await p.screenshot({path:dir+'/j_dash_t'+i+(dark?'d':'')+'.png'});console.log('tab',i,await p.evaluate(()=>document.querySelector('#view').innerText.length))}
console.log(errs.slice(0,8));await b.close()})();
