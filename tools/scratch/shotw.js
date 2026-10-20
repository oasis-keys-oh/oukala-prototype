// Usage: node shotw.js OUTDIR screen WIDTH [--dark] [--eval js] [--full]  -> OUTDIR/shots/<screen>-<w>.png
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),id=a[1],w=+a[2];const dark=a.includes('--dark');const ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:null;const full=a.includes('--full');
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:w,height:a.includes('--h')?+a[a.indexOf('--h')+1]:1000},colorScheme:dark?'dark':'light',deviceScaleFactor:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(dir,'full.html'),{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(500);await p.evaluate(i=>go(i),id);await p.waitForTimeout(+(process.env.WAITMS||300));if(ev){await p.evaluate(ev);await p.waitForTimeout(300)}
const f=path.join(dir,'shots',id+'-'+w+(dark?'-dark':'')+'.png');await p.screenshot({path:f,fullPage:full});console.log(f,errs);await b.close()})();
