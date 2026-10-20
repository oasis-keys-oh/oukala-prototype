const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]),id=process.argv[3]||'ppm_proj';const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);await p.evaluate(()=>SCALE.set(true));
const c=await p.context().newCDPSession(p);await c.send('Profiler.enable');await c.send('Profiler.start');
await p.evaluate(i=>go(i),id);const {profile}=await c.send('Profiler.stop');
const self={};const dt=profile.timeDeltas;const idx={};profile.nodes.forEach(n=>idx[n.id]=n);
profile.samples.forEach((s,i)=>{const n=idx[s];const k=n.callFrame.functionName+':'+n.callFrame.lineNumber+':'+n.callFrame.columnNumber;self[k]=(self[k]||0)+dt[i]/1000});
console.log(Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,14).map(e=>e[0]+' '+Math.round(e[1])).join('\n'));await b.close()})();
