const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const cdp=await c.newCDPSession(p);
await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');
const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof S!=="undefined"&&document.querySelector('#view')&&document.querySelector('#view').children.length>0,null,{timeout:90000});
await p.waitForTimeout(3000);
const {profile}=await cdp.send('Profiler.stop');console.log('to interactive',Date.now()-t0);
const nodes=profile.nodes,byId={};nodes.forEach(n=>byId[n.id]=n);const self={};const dt=profile.timeDeltas;
profile.samples.forEach((s,i)=>{self[s]=(self[s]||0)+(dt[i]||0)});
const tot={};
// line-level attribution for the big script: aggregate by function+line
Object.entries(self).forEach(([id,t])=>{const n=byId[id];const cf=n.callFrame;const k=(cf.functionName||'(anon)')+' @'+cf.lineNumber;tot[k]=(tot[k]||0)+t});
Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,t])=>console.log((t/1000).toFixed(0)+'ms',k));
// inclusive by top-level (anon) funcs at module level are hard; compute inclusive for functions
const children={};nodes.forEach(n=>(n.children||[]).forEach(c=>children[c]=n.id));
const incl={};Object.entries(self).forEach(([id,t])=>{let cur=+id;const seen=new Set();while(cur){const n=byId[cur];const k=(n.callFrame.functionName||'(anon)')+' @'+n.callFrame.lineNumber;if(!seen.has(k)){seen.add(k);incl[k]=(incl[k]||0)+t}cur=children[cur]}});
console.log('--- inclusive');Object.entries(incl).sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([k,t])=>console.log((t/1000).toFixed(0)+'ms',k));
await b.close()})();
