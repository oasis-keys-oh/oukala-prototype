// usage: node d15_ev.js OUT "js expr (async ok)" [--dark] [--w 1440] [--shot name] [--wait ms]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const js=a[1];const dark=a.includes('--dark');
const wi=a.indexOf('--w');const w=wi>0?+a[wi+1]:1440;const si=a.indexOf('--shot');const wt=a.indexOf('--wait');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:w,height:900},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.route(/fonts\.g/,r=>r.abort());
const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:120000});await p.waitForTimeout(700);
if(dark)await p.evaluate(()=>{try{PREF.theme='dark';applyPrefs()}catch(e){}});
try{const r=await p.evaluate(js);console.log(typeof r==='string'?r:JSON.stringify(r,null,1))}catch(e){console.log('EVALERR',e.message)}
await p.waitForTimeout(wt>0?+a[wt+1]:500);
if(si>0)await p.screenshot({path:dir+'/'+a[si+1]+'.png'});
console.log('errs',errs.length,errs.slice(0,5));await b.close()})();
