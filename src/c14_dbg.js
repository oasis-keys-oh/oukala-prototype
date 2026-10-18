const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext();const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p);await cdp.send('Debugger.enable');
cdp.on('Debugger.paused',e=>{console.log(e.callFrames.slice(0,8).map(f=>f.functionName+':'+f.location.lineNumber).join(' < '));process.exit(0)});
p.goto('file://'+path.resolve('out_c14/full.html'),{waitUntil:'commit'}).catch(()=>{});
await new Promise(r=>setTimeout(r,4000));await cdp.send('Debugger.pause');await new Promise(r=>setTimeout(r,3000));console.log('no pause');await b.close()})();
