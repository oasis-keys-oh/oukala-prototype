// Baseline measurements (CL-01): sizes, cold-load timing, JS and CSS coverage on key screens.
// Usage: node tools/baseline.js [build_out] [--runs 5]   (build first: python3 src/build.py --out build_out)
// Serves the folder on 127.0.0.1 with no HTTP caching, loads index.html in a fresh browser context per run (cold cache),
// and blocks every request that is not to that local server (Google Fonts), so numbers depend only on the build.
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const a=process.argv.slice(2);const dir=path.resolve(a.find(x=>!x.startsWith('--')&&!/^\d+$/.test(x))||'build_out');
const runs=a.includes('--runs')?+a[a.indexOf('--runs')+1]:5;
const CT={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(dir,u==='/'?'index.html':u);
 if(!f.startsWith(dir)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
 r.writeHead(200,{'Content-Type':CT[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(f).pipe(r)});
const med=v=>{const s=[...v].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]};
(async()=>{await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+srv.address().port+'/';
// CL-15: the split build (index.html plus assets/) or the older one-file build (index.html plus oukala-js.js)
const files=['index.html'].concat(fs.existsSync(path.join(dir,'assets'))?fs.readdirSync(path.join(dir,'assets')).filter(f=>/\.(js|css)$/.test(f)).sort().map(f=>'assets/'+f):['oukala-js.js']);
const size={};for(const f of files){const b=fs.readFileSync(path.join(dir,f));size[f]={raw:b.length,gzip:zlib.gzipSync(b,{level:9}).length}}
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const fresh=async()=>{const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
 // viewAt (CL-15): when #view first holds more than 400 characters, timed in the page, so it does not wait for the load event
 await p.addInitScript(()=>{window.__viewAt=null;const mo=new MutationObserver(()=>{const v=document.getElementById('view');if(v&&v.innerHTML.length>400){window.__viewAt=performance.now();mo.disconnect()}});mo.observe(document,{childList:true,subtree:true})});
 await p.route(u=>!String(u).startsWith(base),r=>r.abort());return {c,p}};
const ready=p=>p.waitForFunction(()=>typeof SCREENS!=='undefined'&&document.querySelector('#view')&&document.querySelector('#view').innerHTML.length>400,null,{timeout:120000,polling:20});
// cold load
const T=[];for(let i=0;i<runs;i++){const {c,p}=await fresh();await p.goto(base+'index.html',{waitUntil:'load',timeout:120000});await ready(p);
 const t=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0],R=performance.getEntriesByType('resource'),js=R.filter(x=>/oukala-js\.js|\/assets\/[^/]+\.js/.test(x.name)),s=js.length?js.reduce((m,x)=>x.responseEnd>m.responseEnd?x:m):null,ready=performance.now();
  return {viewAt:window.__viewAt,ttfb:n.responseStart,dcl:n.domContentLoadedEventEnd,load:n.loadEventEnd,ready,scriptFetched:s?s.responseEnd:null,
   bytesBeforeReady:(n.decodedBodySize||0)+R.filter(x=>x.responseEnd<=ready).reduce((t,x)=>t+(x.decodedBodySize||0),0),
   heapMB:performance.memory?performance.memory.usedJSHeapSize/1048576:null}});T.push(t);await c.close()}
const cold={};for(const k of Object.keys(T[0]))cold[k]=Math.round(med(T.map(x=>x[k]))*10)/10;
// coverage
const scr=[['home',p=>p.evaluate(()=>go('home'))],['ppl_jrny',p=>p.evaluate(()=>go('ppl_jrny'))],['showroom',p=>p.evaluate(()=>go('showroom'))]];
const cov={};for(const [id,open] of scr){const {c,p}=await fresh();await p.coverage.startJSCoverage({resetOnNavigation:false});await p.coverage.startCSSCoverage({resetOnNavigation:false});
 await p.goto(base+'index.html',{waitUntil:'load',timeout:120000});await ready(p);await open(p);await p.waitForTimeout(800);
 const js=await p.coverage.stopJSCoverage(),css=await p.coverage.stopCSSCoverage();
 const sum=(arr,flt)=>{let tot=0,used=0;for(const e of arr.filter(flt)){const L=(e.text||e.source||'').length;tot+=L;
   if(e.ranges)used+=e.ranges.reduce((s,r)=>s+r.end-r.start,0);
   else if(e.functions){const m=new Uint8Array(L);for(const f of e.functions)for(const r of f.ranges){if(r.count>0)m.fill(1,r.startOffset,r.endOffset)}for(const f of e.functions)for(const r of f.ranges){if(r.count===0)m.fill(0,r.startOffset,r.endOffset)}used+=m.reduce((s,x)=>s+x,0)}}
  return {total:tot,used,pct:tot?Math.round(used/tot*1000)/10:0}};
 cov[id]={js:sum(js,e=>/oukala-js\.js|\/assets\/[^/]+\.js/.test(e.url)),css:sum(css,()=>true),screen:await p.evaluate(()=>S.screen)};await c.close()}
await b.close();srv.close();
console.log(JSON.stringify({dir,runs,size,cold,coldRuns:T,coverage:cov},null,1))})();
