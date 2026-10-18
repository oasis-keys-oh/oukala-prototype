const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const w=+a[0]||1440,mode=a[1]||'both',tag=a[2]||'x',dark=a[3]==='dark',ev=a[4]||'';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:w,height:1000},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_a14/full.html'));await p.waitForTimeout(500);
if(dark)await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark');document.body.setAttribute('data-theme','dark')});
await p.evaluate(m=>{S.org.mode=m;S.org.k=0;go('org_chart')},mode);await p.waitForTimeout(600);
if(ev){await p.evaluate(ev).catch(e=>errs.push('ev '+e.message));await p.waitForTimeout(500)}
await p.screenshot({path:`out_a14/s_${tag}_${w}.png`});console.log('errs',errs);await b.close()})();
