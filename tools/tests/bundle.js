// CL-14, CL-15, CL-28, CL-37, CL-39: the split build, served the way Netlify serves it (docs/bundle.md).
// Usage: node tools/tests/bundle.js [dist] [build_out]    (stage first: bash tools/ship.sh; build_out must hold full.html)
// Every page is served from 127.0.0.1 by node http; every other host is blocked, so nothing touches the network.
// Part A, the staged site in <dist>:
//   A1 index.html links one hashed stylesheet and one hashed script; inline CSS is only the boot screen; no inline JPEG (CL-14, CL-28)
//   A2 bytes of script before first paint are under budget (BUDGET_FIRST_RAW)                                   (CL-15, CL-48)
//   A3 app:ready fires exactly once and BUNDLE.ready is true                                                    (CL-37)
//   A4 on-demand data is fetched only when its screen opens; tenant packs prefetch on idle after app:ready     (CL-39, PR-32)
//   A5 every screen opens with no page error; screen list and nav order match full.html; screen text matches full.html
//      (text: screens where two full.html loads agree; report only unless BUNDLE_STRICT=1, since the app decorates on timers)
// Part B, a two-bundle build made for this test (src/build.py --first-until mod_s_tenant_screens) to keep the split working:
//   B1 the second bundle is requested only after the first screen rendered; app:ready fires once, after both bundles
//   B2 go() to a screen from the second bundle shows the waiting card, then opens the screen by itself
//   B3 a deep link (#screen) to a second-bundle screen opens it once the bundle is in
//   B4 every screen opens after the second bundle loads, with no page error; screen list and nav order match full.html
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../..');
const a=process.argv.slice(2).filter(x=>!x.startsWith('--'));const dist=path.resolve(a[0]||path.join(ROOT,'dist')),fullDir=path.resolve(a[1]||path.join(ROOT,'build_out'));
const FIRST_BUDGET=+(process.env.BUDGET_FIRST_RAW||12_500_000);  // script bytes before first paint; baseline 12,316,941 (prototype fact, 2026-10-20)
const SPLIT_AT=process.env.BUNDLE_SPLIT_AT||'mod_s_tenant_screens';
const CT={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.txt':'text/plain'};
const fails=[];const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails.push(m)};const note=m=>console.log('     '+m);
let hold=null;const holdRest=()=>{let open;hold=new Promise(r=>open=r);return()=>{open();hold=null}};
function serve(dir){const full=path.join(fullDir,'full.html');const srv=http.createServer(async(q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);
  const f=u==='/full.html'?full:path.join(dir,u==='/'?'index.html':u);
  if(!(f===full||f.startsWith(dir+path.sep))||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
  if(hold&&/\/assets\/rest\./.test(u))await hold;
  r.writeHead(200,{'Content-Type':CT[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(f).pipe(r)});
 return new Promise(o=>srv.listen(0,'127.0.0.1',()=>o({srv,base:'http://127.0.0.1:'+srv.address().port+'/'})))}
const launch=()=>chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
async function page(b,base,url,o={}){const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[],reqs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
 p.on('request',q=>reqs.push(q.url()));await p.route(u=>!/^(data:|blob:)/.test(String(u))&&!String(u).startsWith(base),r=>r.abort());
 await p.addInitScript(()=>{window.__ready=0;window.__readyAt=null;window.__firstRender=null;window.addEventListener('app:ready',()=>{window.__ready++;window.__readyAt=performance.now()});
  const t=setInterval(()=>{const v=document.getElementById('view');if(v&&v.innerHTML.length>400&&window.__firstRender==null){window.__firstRender=performance.now();clearInterval(t)}},5)});
 if(o.before)await o.before(p);await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return {c,p,errs,reqs}}
const ready=p=>p.waitForFunction(()=>window.BUNDLE&&BUNDLE.ready&&window.__ready>0,null,{timeout:120000,polling:20});
const navText=q=>q.evaluate(()=>[...document.querySelectorAll('#nav a,#nav button,#nav summary')].map(x=>x.textContent.trim()).join('|'));
// open every screen; returns the ids and the errors
async function everyScreen(p,errs){const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));let bad=0;
 for(const id of ids){const n0=errs.length;await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(100);
  const r=await p.evaluate(()=>({len:document.querySelector('#view').innerHTML.length,wait:!!document.querySelector('#view [data-bundle-wait]')}));
  if(r.len<400||r.wait||errs.length>n0){bad++;console.log('!!',id,JSON.stringify(r),errs.slice(n0))}}return {ids,bad}}

(async()=>{const b=await launch();
// ---------------- Part A: the staged site ----------------
{const {srv,base}=await serve(dist);console.log('part A: '+dist);
 const idx=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 const css=[...idx.matchAll(/<link rel="stylesheet" href="(assets\/style\.[0-9a-f]{10}\.css)">/g)].map(m=>m[1]);
 const app=(idx.match(/<script src="(assets\/app\.[0-9a-f]{10}\.js)"><\/script>/)||[])[1];
 ok(css.length===1&&fs.existsSync(path.join(dist,css[0])),'A1 index.html links one hashed stylesheet ('+(css[0]||'none')+')');
 ok(!!app&&fs.existsSync(path.join(dist,app)),'A1 index.html loads one hashed script ('+(app||'none')+')');
 const inlineCss=[...idx.matchAll(/<style>([\s\S]*?)<\/style>/g)].reduce((s,m)=>s+m[1].length,0);
 ok(inlineCss<4000,'A1 inline CSS in index.html is only the boot screen ('+inlineCss+' characters)');
 const cssText=css[0]?fs.readFileSync(path.join(dist,css[0]),'utf8'):'';const img=(cssText.match(/url\((rail\.[0-9a-f]{10}\.jpg)\)/)||[])[1];
 ok(!/data:image\/jpeg/.test(cssText)&&!!img&&fs.existsSync(path.join(dist,'assets',img)),'A1 the rail image is a hashed asset next to the stylesheet ('+(img||'missing')+'), not inline');
 const appBytes=app?fs.statSync(path.join(dist,app)).size:0;
 ok(appBytes>0&&appBytes<=FIRST_BUDGET,'A2 script before first paint '+appBytes.toLocaleString('en-US')+' bytes (budget '+FIRST_BUDGET.toLocaleString('en-US')+')');
 {const {c,p,errs,reqs}=await page(b,base,base);await ready(p);await p.waitForTimeout(600);
  const t=await p.evaluate(()=>{const R=performance.getEntriesByType('resource');return {first:window.__firstRender,ready:window.__readyAt,n:window.__ready,split:BUNDLE.split,
   before:R.filter(x=>x.responseEnd<=window.__firstRender).reduce((s,x)=>s+(x.decodedBodySize||0),0)+(performance.getEntriesByType('navigation')[0].decodedBodySize||0)}});
  note('first screen rendered at '+Math.round(t.first)+' ms; bytes fetched before it: '+t.before.toLocaleString('en-US')+' (prototype fact, loopback, no compression)');
  ok(t.split===true&&t.n===1,'A3 app:ready fired once ('+t.n+'), at '+Math.round(t.ready)+' ms');
  ok(!reqs.some(u=>/\/assets\/data\//.test(u)&&!/\/assets\/data\/pack_/.test(u)),'A4 no on-demand screen data fetched on the home screen (tenant packs prefetch on idle after app:ready, PR-32)');
  const got=n=>p.waitForFunction(x=>!!BUNDLE.get(x),n,{timeout:15000}).then(()=>true,()=>false);
  await p.evaluate(()=>go('vault'));const g1=await got('gaapdata');
  ok(g1&&reqs.some(u=>/\/assets\/data\/gaapdata\.[0-9a-f]{10}\.json/.test(u)),'A4 opening vault fetches gaapdata');
  await p.evaluate(()=>go('kcs_viz'));const g2=await got('vizgeo');
  ok(g2&&reqs.some(u=>/\/assets\/data\/vizgeo\.[0-9a-f]{10}\.json/.test(u)),'A4 opening kcs_viz fetches vizgeo');
  ok(await p.evaluate(()=>window.__ready)===1,'A3 app:ready still fired once after navigating');
  ok(errs.length===0,'A3 no page errors on the cold load'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await c.close()}
 // A5: three pages (this build and two copies of full.html), each in its own browser, with the same fixed clock and a seeded
 // Math.random reseeded before each screen opens; they start together and settle for the same time.
 {const SETTLE=+(process.env.BUNDLE_SETTLE||8000);const extra=[];
  const det=async p=>{await p.clock.setFixedTime(new Date('2026-10-06T10:00:00'));await p.addInitScript(()=>{let a=1;
   window.__seed=n=>{a=(n*2654435761)>>>0||1};Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})};
  const open=async url=>{const bb=await launch();extra.push(bb);const x=await page(bb,base,url,{before:det});await ready(x.p);return x};
  const [S1,F1,F2]=await Promise.all([open(base),open(base+'full.html'),open(base+'full.html')]);const p=S1.p,errs=S1.errs;
  await Promise.all([S1,F1,F2].map(x=>x.p.waitForTimeout(SETTLE)));
  const ids=await p.evaluate(()=>SCREENS.map(s=>s[0])),fids=await F1.p.evaluate(()=>SCREENS.map(s=>s[0]));
  ok(JSON.stringify(ids)===JSON.stringify(fids),'A5 screen list and order match full.html ('+ids.length+' and '+fids.length+' screens)');
  ok(await navText(p)===await navText(F1.p),'A5 nav entries and order match full.html');
  const text=q=>q.evaluate(()=>{const v=document.querySelector('#view').cloneNode(true);v.querySelectorAll('style,script').forEach(x=>x.remove());v.querySelectorAll('*').forEach(e=>{if(!e.children.length)e.textContent=' '+e.textContent+' '});return v.textContent.replace(/\s+/g,' ').trim()});
  const first=(x,y)=>{const A=x.split(' '),B=y.split(' ');let k=0;while(k<A.length&&A[k]===B[k])k++;return 'this build "'+A.slice(Math.max(0,k-4),k+8).join(' ')+'" / full.html "'+B.slice(Math.max(0,k-4),k+8).join(' ')+'"'};
  const show=async(q,id,w)=>{await q.evaluate(i=>{let h=7;for(const ch of i)h=(h*31+ch.charCodeAt(0))>>>0;__seed(h)},id);await q.evaluate(i=>go(i),id).catch(e=>q===p&&errs.push(id+': '+e.message));await q.waitForTimeout(w);return text(q)};
  let bad=0,noisy=0;const diffs=[];
  for(const id of ids){const n0=errs.length;let [x,y,z]=await Promise.all([show(p,id,150),show(F1.p,id,150),show(F2.p,id,150)]);
   const r=await p.evaluate(()=>({len:document.querySelector('#view').innerHTML.length,wait:!!document.querySelector('#view [data-bundle-wait]')}));
   if(r.len<400||r.wait||errs.length>n0){bad++;console.log('!!',id,JSON.stringify(r),errs.slice(n0))}
   if(x!==y||y!==z)[x,y,z]=await Promise.all([show(p,id,600),show(F1.p,id,600),show(F2.p,id,600)]);
   if(y!==z){noisy++;continue}if(x!==y)diffs.push([id,first(x,y)])}
  ok(bad===0&&errs.length===0,'A5 every screen opens ('+ids.length+' screens, '+bad+' flagged, '+errs.length+' errors)'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
  diffs.forEach(d=>note('differs: '+d[0]+': '+d[1].slice(0,300)));
  const msg='A5 screen text matches full.html: '+diffs.length+' of '+(ids.length-noisy)+' comparable screens differ ('+noisy+' skipped: two full.html loads disagree)';
  if(process.env.BUNDLE_STRICT)ok(diffs.length===0,msg);else note(msg+'; report only, BUNDLE_STRICT=1 makes it a check');
  for(const bb of extra)await bb.close()}
 srv.close()}

// ---------------- Part B: a two-bundle build, to keep the split mechanism working ----------------
{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bundle-split-'));
 cp.execFileSync('python3',[path.join(ROOT,'src/build.py'),'--out',tmp,'--first-until',SPLIT_AT],{stdio:'ignore'});
 const {srv,base}=await serve(tmp);console.log('part B: two bundles, first ends at '+SPLIT_AT);
 {const {c,p,errs}=await page(b,base,base);await ready(p);await p.waitForTimeout(400);
  const t=await p.evaluate(()=>{const R=performance.getEntriesByType('resource');const rest=R.find(x=>/\/assets\/rest\./.test(x.name));return {first:window.__firstRender,ready:window.__readyAt,n:window.__ready,restStart:rest?rest.startTime:null}});
  ok(t.restStart!=null&&t.first!=null&&t.restStart>=t.first,'B1 second bundle requested after the first screen rendered (first screen '+Math.round(t.first)+' ms, second bundle requested '+Math.round(t.restStart)+' ms)');
  ok(t.n===1&&t.ready>=t.restStart,'B1 app:ready fired once ('+t.n+'), after both bundles ('+Math.round(t.ready)+' ms)');
  ok(errs.length===0,'B1 no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await c.close()}
 let restIds=[];
 {const {c,p}=await page(b,base,base);await ready(p);const all=await p.evaluate(()=>SCREENS.map(s=>s[0]));await c.close();
  const release=holdRest();const {c:c2,p:p2}=await page(b,base,base);await p2.waitForFunction(()=>typeof go==='function'&&window.__firstRender!=null,null,{timeout:120000});
  const firstIds=await p2.evaluate(()=>SCREENS.map(s=>s[0]));restIds=all.filter(x=>!firstIds.includes(x));const target=restIds.includes('kg')?'kg':restIds[0];
  await p2.evaluate(id=>go(id),target);await p2.waitForTimeout(200);
  const w=await p2.evaluate(()=>({wait:!!document.querySelector('#view [data-bundle-wait]'),ready:BUNDLE.ready,screen:S.screen}));
  ok(!!target&&w.wait&&!w.ready&&w.screen===target,'B2 before the second bundle, go("'+target+'") shows the waiting card ('+JSON.stringify(w)+')');
  release();await ready(p2);await p2.waitForTimeout(300);
  const after=await p2.evaluate(()=>({wait:!!document.querySelector('#view [data-bundle-wait]'),screen:S.screen,len:document.querySelector('#view').innerHTML.length}));
  ok(!after.wait&&after.screen===target&&after.len>400,'B2 the screen opens by itself once the second bundle is in ('+JSON.stringify(after)+')');await c2.close()}
 note(restIds.length+' screens come from the second bundle');
 {const target=restIds.includes('metrics')?'metrics':restIds[0];const {c,p,errs}=await page(b,base,base+'#'+target);await ready(p);await p.waitForTimeout(400);
  const s=await p.evaluate(()=>({screen:S.screen,len:document.querySelector('#view').innerHTML.length,wait:!!document.querySelector('#view [data-bundle-wait]')}));
  ok(s.screen===target&&s.len>400&&!s.wait&&errs.length===0,'B3 deep link #'+target+' opens that screen ('+JSON.stringify(s)+')'+(errs.length?': '+errs.slice(0,2).join(' | '):''));await c.close()}
 {const {c,p,errs}=await page(b,base,base);await ready(p);await p.waitForTimeout(800);
  const {c:fc,p:fp}=await page(b,base,base+'full.html');await ready(fp);await fp.waitForTimeout(800);
  ok(JSON.stringify(await p.evaluate(()=>SCREENS.map(s=>s[0])))===JSON.stringify(await fp.evaluate(()=>SCREENS.map(s=>s[0]))),'B4 screen list and order match full.html (registries replayed in module order)');
  ok(await navText(p)===await navText(fp),'B4 nav entries and order match full.html');await fc.close();
  const r=await everyScreen(p,errs);ok(r.bad===0&&errs.length===0,'B4 every screen opens after the second bundle loads ('+r.ids.length+' screens, '+r.bad+' flagged, '+errs.length+' errors)'+(errs.length?': '+errs.slice(0,3).join(' | '):''));await c.close()}
 srv.close();fs.rmSync(tmp,{recursive:true,force:true})}
await b.close();console.log(fails.length?'bundle: '+fails.length+' FAILED':'bundle: all checks passed');process.exit(fails.length?1:0)})().catch(e=>{console.error(e);process.exit(1)});
