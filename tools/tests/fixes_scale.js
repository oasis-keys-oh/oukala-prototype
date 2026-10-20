// CL-80 Enterprise scale is real (R11): SCALE.set(true) turns it on and generates the simulated volume, then every registered
// screen opens at scale without thrown errors or a blank view. SCALE.set(false) restores the demo directory.
// Render times over 800 ms are listed (report only; PR-12 budget). Numbers are prototype facts for the machine that runs it.
// Usage: node tools/tests/fixes_scale.js <dir containing full.html> [--only id,id]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a.find(x=>!x.startsWith('--'))||'build_out');
const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(800);
let fail=0;const ck=(ok,msg)=>{console.log((ok?'ok   ':'FAIL ')+msg);if(!ok)fail++};
const s0=await p.evaluate(()=>({dir:DIR.length,on:SCALE.on}));
const s1=await p.evaluate(()=>{const t=performance.now();SCALE.set(true);const ms=Math.round(performance.now()-t);
 return {ms,on:SCALE.on,dir:DIR.length,gen:DIR.filter(d=>d.generated).length,projects:SCALE.projects().length,cis:SCALE.cis().length,tickets:SCALE.tickets().length,
  incidents:SCALE.incidents().length,changes:SCALE.changes().length,demand:SCALE.demand().length,raid:SCALE.raid().length,
  lists:window.LISTS?LISTS.projects().length:null,n:SCALE.n}});
ck(s0.on===false,'starts at demo volume ('+s0.dir+' people)');
ck(s1.on===true,'SCALE.set(true) turns Enterprise scale on (set took '+s1.ms+' ms)');
ck(s1.gen>300&&s1.dir>s0.dir+300,'directory grows to '+s1.dir+' ('+s1.gen+' generated people)');
ck(s1.projects===s1.n.projects-4,'generated projects '+s1.projects);
ck(s1.cis===s1.n.cis&&s1.tickets===s1.n.tickets&&s1.incidents===s1.n.incidents&&s1.changes===s1.n.changes&&s1.demand===s1.n.demand&&s1.raid===s1.n.raid,
 'generated cis '+s1.cis+', tickets '+s1.tickets+', incidents '+s1.incidents+', changes '+s1.changes+', demand '+s1.demand+', raid '+s1.raid);
ck(s1.lists==null||s1.lists>=s1.projects,'LISTS.projects() holds '+s1.lists+' projects');
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));const slow=[];let bad=0;
for(const id of ids){const n0=errs.length;const ms=await p.evaluate(i=>{const t=performance.now();go(i);return Math.round(performance.now()-t)},id).catch(e=>{errs.push(id+': '+e.message);return -1});
 await p.waitForTimeout(60);const len=await p.evaluate(()=>document.querySelector('#view').innerHTML.length);
 if(ms>800)slow.push(id+' '+ms+' ms');
 if(len<400||errs.length>n0){bad++;console.log('!!',id,'len '+len,errs.slice(n0))}}
ck(bad===0,ids.length+' screens open at Enterprise scale, '+bad+' flagged');
console.log('over 800 ms at scale (first open, report only): '+(slow.length?slow.join(', '):'none'));
const s2=await p.evaluate(()=>{SCALE.set(false);return {on:SCALE.on,dir:DIR.length,gen:DIR.filter(d=>d.generated).length}});
ck(s2.on===false&&s2.gen===0&&s2.dir===s0.dir,'SCALE.set(false) restores demo volume ('+s2.dir+' people)');
ck(errs.length===0,'no page errors ('+errs.length+')');if(errs.length)console.log(errs.slice(0,10));
console.log(fail?'SCALE FAIL ('+fail+')':'SCALE PASS');await b.close();process.exit(fail?1:0)})();
