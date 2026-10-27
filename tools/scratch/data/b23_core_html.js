// PR-32 B2/B3 (stream data-b23): Atlantic must not change by a single character. Records the innerHTML of #view for every
// registered screen under the core tenant, and diffs two recordings.
// Math.random is seeded and time is virtual (Playwright clock) so two runs of the same build match.
// Usage: node tools/scratch/data/b23_core_html.js <build dir> <out.json>
//        node tools/scratch/data/b23_core_html.js --diff <a.json> <b.json>
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
/* popover ids come from one page-wide counter that timers also advance: renumber them per screen in order of appearance */
const norm=h=>{const m=new Map();return String(h||"").replace(/file:\/\/\/[^"?#]*full\.html/g,"FULL").replace(/\b(id|popovertarget|for|aria-controls|aria-labelledby|aria-describedby)="([a-zA-Z_-]*?)(\d{2,})"/g,(x,a,pre,n)=>{const k=pre+n;if(!m.has(k))m.set(k,m.size+1);return a+'="'+pre+'#'+m.get(k)+'"'})};
if(process.argv[2]==='--diff'){const a0=JSON.parse(fs.readFileSync(process.argv[3])),b0=JSON.parse(fs.readFileSync(process.argv[4]));let n=0;
 const a={},b={};Object.keys(a0).forEach(k=>a[k]=norm(a0[k]));Object.keys(b0).forEach(k=>b[k]=norm(b0[k]));
 Object.keys(Object.assign({},a,b)).forEach(k=>{if(a[k]!==b[k]){n++;const x=a[k]||'',y=b[k]||'';let i=0;while(i<x.length&&x[i]===y[i])i++;
  console.log('DIFF',k,'at',i,'\n  a:',x.slice(Math.max(0,i-120),i+200),'\n  b:',y.slice(Math.max(0,i-120),i+200))}});
 console.log(Object.keys(a).length,'screens,',n,'differ');process.exit(n?1:0)}
(async()=>{const dir=path.resolve(process.argv[2]||'build_out'),out=process.argv[3]||'core_html.json';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const c=await b.newContext({viewport:{width:1440,height:900}});
/* virtual time (Playwright clock): every timer, interval, animation frame and Date reading advances only when this script says so,
   so two recordings of the same build are identical and a difference is a change in what a screen renders */
await c.addInitScript(()=>{let s=42;Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}});
const p=await c.newPage();const errs=[];
await p.clock.install({time:new Date('2026-10-06T09:00:00Z')});await p.clock.pauseAt(new Date('2026-10-06T09:00:01Z'));
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:180000});
for(let i=0;i<30;i++){await p.clock.runFor(500);if(await p.evaluate(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&!!document.querySelector('#view')))break}
await p.clock.runFor(+process.env.SETTLE||12000);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const res={};
/* captured in the same task as go(): the view as the screen's render left it, before timers decorate it */
for(const id of ids){res[id]=await p.evaluate(i=>{try{go(i)}catch(e){return 'ERROR '+e.message}const v=document.getElementById('view');return v?v.innerHTML.split(location.href.split('?')[0]).join('FULL').replace(/\b(\d{13})\b/g,'T').replace(/u[0-9a-z]{8,}\b/g,'UID'):''},id);
 await p.clock.runFor(200)}
fs.writeFileSync(out,JSON.stringify(res));console.log(ids.length,'screens recorded to',out,'errors',errs.length,errs.slice(0,5).join(' | '));
await b.close()})();
