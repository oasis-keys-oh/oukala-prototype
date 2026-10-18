const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext();const p=await c.newPage();
const cdp=await c.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:2000});await cdp.send('Profiler.start');
await p.route(/^https?:/,r=>r.abort());p.goto('file://'+dir+'/full.html',{waitUntil:'commit'}).catch(()=>{});
for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,2500));const r=await Promise.race([p.evaluate(()=>1).then(()=>'alive'),new Promise(r=>setTimeout(()=>r('blocked'),1500))]);console.log(i,r);if(r==='blocked')break}
const prof=await Promise.race([cdp.send('Profiler.stop'),new Promise(r=>setTimeout(()=>r(null),8000))]);
if(prof){const nodes=prof.profile.nodes;const self={};const dt=prof.profile.timeDeltas;const idIdx={};nodes.forEach(n=>idIdx[n.id]=n);prof.profile.samples.forEach((s,i)=>{const n=idIdx[s];const k=n.callFrame.functionName+" "+n.callFrame.url.slice(-30)+":"+n.callFrame.lineNumber;self[k]=(self[k]||0)+(dt[i]||0)});console.log(Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,12))}else console.log('no profile');
process.exit(0)})();
