const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('file://'+process.cwd()+'/out_viz/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>{VIZ.state.bigN=100000;const d=document.createElement('div');d.style.width='600px';document.body.appendChild(d);VIZ.render(d,{type:'scatter',src:'big',enc:{x:'a',y:'b',color:'group'},agg:''},null,{})});
const c=await p.context().newCDPSession(p);await c.send('Profiler.enable');await c.send('Profiler.start');
console.log(await p.evaluate(()=>{const d=document.createElement('div');d.style.width='600px';document.body.appendChild(d);const t=performance.now();VIZ.render(d,{type:'scatter',src:'big',enc:{x:'a',y:'b',color:'group'},agg:''},null,{});return Math.round(performance.now()-t)}));
const {profile}=await c.send('Profiler.stop');const self={};const dt=profile.timeDeltas;const idx={};profile.nodes.forEach(n=>idx[n.id]=n);profile.samples.forEach((s,i)=>{const n=idx[s];const k=n.callFrame.functionName+':'+n.callFrame.lineNumber;self[k]=(self[k]||0)+dt[i]});
console.log(Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0]+' '+Math.round(e[1]/1000)).join('\n'));await b.close()})();
