// PR-12 perf report: render time of the heaviest screens at Enterprise scale (SCALE.set(true)).
// Opens each screen 3 times and reports the median go() time in ms. Numbers are prototype facts for the machine that runs it.
// It is a report, not a gate: a screen over the budget prints a warning and the exit code stays 0 (only page errors fail it).
// Usage: node tools/tests/perf.js <dir containing full.html> [--hash] [--all] [--json <file>] [--dump <dir>] [--notime]
//   --hash  also prints a hash of #view innerHTML per screen at demo and Enterprise scale (output identity check)
//   --all   with --hash: every registered screen, not only the five perf screens
//   --dump  with --hash: also write each normalized #view to <dir> for a text diff
//   Generated element ids (popover counters and similar) are blanked before hashing; they depend on render count, not on data.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const SCREENS=['itom_evt','ppm_proj','exe_mat','ppm_sow','svc_sla'];const BUDGET=800,RUNS=3;
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a.find((x,i)=>!x.startsWith('--')&&!['--json','--dump'].includes(a[i-1]))||'build_out');
const hash=a.includes('--hash'),all=a.includes('--all'),jf=a.includes('--json')?a[a.indexOf('--json')+1]:null,dump=a.includes('--dump')?a[a.indexOf('--dump')+1]:null;
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const open=async()=>{const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);
 await p.evaluate(()=>{window.__h=s=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16)+':'+s.length}});return {c,p,errs}};
const out={budget:BUDGET,runs:RUNS,ms:{},hash:{}};
/* timing: a fresh page per screen so one screen's caches do not hide another's cost */
for(const id of (a.includes("--notime")?[]:SCREENS)){const {c,p,errs}=await open();
 const r=await p.evaluate(async([id,n])=>{SCALE.set(true);await new Promise(r=>setTimeout(r,50));go('home');const t=[];
  for(let i=0;i<n;i++){go('home');await new Promise(r=>setTimeout(r,30));const a=performance.now();go(id);t.push(performance.now()-a);await new Promise(r=>setTimeout(r,30))}
  return t},[id,RUNS]).catch(e=>{errs.push(id+': '+e.message);return []});
 const s=[...r].sort((x,y)=>x-y),med=s.length?Math.round(s[Math.floor(s.length/2)]):null;out.ms[id]={median:med,runs:r.map(Math.round)};
 console.log((med!=null&&med>BUDGET?'WARN ':'ok   ')+id.padEnd(10)+' median '+String(med).padStart(5)+' ms  runs '+r.map(Math.round).join(' / ')+(med>BUDGET?'  (over '+BUDGET+' ms)':''));
 if(errs.length){console.log('!! errors',errs);out.errors=(out.errors||[]).concat(errs)}await c.close()}
if(hash){const {c,p,errs}=await open();const ids=all?await p.evaluate(()=>SCREENS.map(s=>s[0])):SCREENS;
 for(const sc of [false,true]){if(sc)await p.evaluate(()=>SCALE.set(true));const key=sc?'enterprise':'demo';out.hash[key]={};
  for(const id of ids){const h=await p.evaluate(([i,d])=>{go(i);const s=document.querySelector('#view').innerHTML.replace(/\b(id|popovertarget|for|aria-controls|aria-labelledby|aria-describedby|list|href)="[^"]*\d[^"]*"/g,'$1="#"');return d?[__h(s),s]:[__h(s)]},[id,!!dump]).catch(e=>['ERR '+e.message.split('\n')[0]]);out.hash[key][id]=h[0];
   if(dump&&h[1]){fs.mkdirSync(dump,{recursive:true});fs.writeFileSync(path.join(dump,key+'_'+id+'.html'),h[1].replace(/></g,'>\n<'))}}
  if(!all)console.log(key,JSON.stringify(out.hash[key]))}
 if(errs.length){console.log('!! errors',errs.slice(0,10));out.errors=(out.errors||[]).concat(errs)}await c.close()}
if(jf)fs.writeFileSync(jf,JSON.stringify(out,null,1));
await b.close();process.exit(out.errors&&out.errors.length?1:0)})();
