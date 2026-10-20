// Build gate for Showroom tours (DC-06): fails when SHOW.lint() reports anything, including a cut over 1,200 seconds.
// Usage: node tools/tests/showlint.js <dir containing full.html | URL>
// It also proves the gate bites: it adds a 1,201 second test tour in the page and expects the check to fail on it.
const {chromium}=require('playwright');const path=require('path');
const target=a=>/^https?:\/\//.test(a||'')?a.replace(/\/?$/,'/'):'file://'+path.resolve(a||'build_out')+'/';
(async()=>{const base=target(process.argv[2]);const url=/^file:/.test(base)?base+'full.html':base;
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
if(/^file:/.test(url))await p.route(/^https?:/,r=>r.abort());
await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.SHOW&&typeof SHOW.lint==='function',null,{timeout:60000});
const check=()=>p.evaluate(()=>{const lim=SHOW.LIMIT||1200,bad=SHOW.lint().slice();
 SHOW.demos.forEach(d=>{const t=d.beats.reduce((a,x)=>a+(x.secs||0),0);if(t>1200||t>lim)bad.push(d.id+': beats add up to '+t+' seconds, over '+Math.min(lim,1200))});
 return {bad:[...new Set(bad)],tours:SHOW.demos.map(d=>d.id+' '+d.beats.reduce((a,x)=>a+(x.secs||0),0)+'s')}});
const r=await check();
// prove the gate: an over-budget tour must fail
const proof=await p.evaluate(()=>{const beat={id:'x.1',act:'Test',point:'Gate test beat',secs:1201,go:'home',say:['One.','Two.'],do:'Nothing.',claims:['simulated']};
 const d={id:'__gate_test',beats:[beat],total:1201};SHOW.demos.push(d);
 try{return SHOW.lint().some(x=>/__gate_test/.test(x)&&/over/.test(x))}finally{SHOW.demos.pop()}});
await b.close();
console.log('showroom lint: tours',r.tours.join(', '),'| findings',r.bad.length,'| over-budget gate proven',proof);
if(r.bad.length){r.bad.forEach(x=>console.log('LINT FAIL',x));process.exit(1)}
if(!proof){console.log('LINT FAIL the 1,200 second gate did not catch a 1,201 second tour');process.exit(1)}})();
