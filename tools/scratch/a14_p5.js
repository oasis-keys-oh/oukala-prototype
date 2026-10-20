const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'});const p=await ctx.newPage();
await p.route(/fonts\.g/,r=>r.abort());
for(let i=0;i<3;i++){try{await p.goto('file://'+path.resolve(process.argv[2]+'/full.html'),{waitUntil:'load',timeout:30000});break}catch(e){console.log('retry load')}}
console.log('loaded');
const c=await ctx.newCDPSession(p);await c.send('Debugger.enable');
c.on('Debugger.paused',async ev=>{console.log('PAUSED');ev.callFrames.slice(0,8).forEach(f=>console.log(f.functionName,f.url.slice(-30),f.location.lineNumber+1,f.location.columnNumber));process.exit(0)});
p.evaluate(()=>{go('org_chart')}).catch(()=>{});
await new Promise(r=>setTimeout(r,6000));await c.send('Debugger.pause');await new Promise(r=>setTimeout(r,5000));console.log('no pause (finished?)');await b.close()})();
