// DC-38 stable process counts and CL-81 maturity at registration (R26).
// DC-38: two fresh pages open screens in different orders (one before boot registration settles); once PROCLIB.settled, both show the
// same process count, and it does not move as more screens open. CL-81: every PROCLIB process has a level, a target and six dimensions;
// every workflow draft in WFX (journey-linked drafts in every scenario) carries a maturity record; addProcess returns one at once.
// Usage: node tools/tests/fixes_procs.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
let fail=0;const ok=(v,m)=>{console.log((v?'ok   ':'FAIL ')+m);if(!v)fail++};const errs=[];
const open=async()=>{const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>window.PROCLIB&&PROCLIB.whenSettled&&typeof SCREENS!=='undefined'&&typeof go==='function',null,{timeout:60000});return {c,p}};
const settle=p=>p.evaluate(()=>new Promise(r=>PROCLIB.whenSettled(()=>setTimeout(r,1000))));
const counts=p=>p.evaluate(()=>({list:PROCLIB.list().length,count:PROCLIB.count(),stats:PROCLIB.stats().processes}));
const walk=(p,ids)=>p.evaluate(ids=>{for(const id of ids){try{go(id)}catch(e){}}},ids);
/* page A: wait for settle first, then open every screen in order */
const A=await open();await settle(A.p);const a0=await counts(A.p);const ids=await A.p.evaluate(()=>SCREENS.map(s=>s[0]));
await walk(A.p,ids);await A.p.waitForTimeout(500);const a1=await counts(A.p);
/* page B: open screens in reverse straight away, including every App record, then settle */
const B=await open();await walk(B.p,ids.slice().reverse());await B.p.evaluate(()=>{(window.R18&&R18.apps?R18.apps():[]).forEach(x=>{try{document.body.insertAdjacentHTML('beforeend','<button data-r18-app="'+x.id+'" id="cl38b"></button>');document.getElementById('cl38b').click();document.getElementById('cl38b').remove()}catch(e){}})});/* opens every App record */
await settle(B.p);await B.p.waitForTimeout(300);const b1=await counts(B.p);
ok(a0.list===a0.count&&a0.list===a0.stats,'after settle, list, count and stats agree: '+a0.list+' processes (prototype fact)');
ok(a1.list===a0.list,'opening every screen does not change the count ('+a0.list+' then '+a1.list+')');
ok(b1.list===a0.list,'another click order, started before settle, ends at the same count ('+b1.list+')');
/* CL-81 */
const m=await A.p.evaluate(()=>{const L=PROCLIB.list();const bad=L.filter(P=>{const x=PROCLIB.maturity(P.id);return !x||x.level==null||x.target==null||Object.keys(x.dims||{}).length!==6}).map(P=>P.id);
 const r=PROCLIB.addProcess({name:"Fixes test process",module:"plat_reg",owner:"Maya Ortiz",backup:"Priya Shah",trigger:"A request arrives",steps:[{n:"Receive",who:"human",in:"Request",out:"Ticket"},{n:"Route",who:"auto",in:"Ticket",out:"Queue"},{n:"Approve",who:"gate",in:"Queue",out:"Decision"}]});
 const reg=r&&r.maturity&&r.maturity.target!=null&&Object.keys(r.maturity.dims||{}).length===6;return {n:L.length,bad,reg,regM:r&&r.maturity}});
ok(m.bad.length===0,m.n+' library processes each have a level, a target and six dimensions'+(m.bad.length?' (missing: '+m.bad.slice(0,5).join(', ')+')':''));
ok(m.reg,'addProcess returns a maturity record at registration: '+JSON.stringify(m.regM&&{level:m.regM.level,target:m.regM.target,dims:m.regM.dims}));
const sc=await A.p.evaluate(async()=>{const out={};const keys=Object.keys(SCN.list).filter(k=>!SCN.allowed||SCN.allowed(k));
 const refs=()=>{const s=new Set();const seen=new Set();const walk=o=>{if(!o||typeof o!=="object"||seen.has(o))return;seen.add(o);if(o.src==="WFX"&&o.ref)s.add(o.ref);(Array.isArray(o)?o:Object.values(o)).forEach(walk)};walk(window.JYX&&JYX.JY&&JYX.JY.list);return [...s]};
 for(const k of keys){SCN.set(k);await new Promise(r=>setTimeout(r,50));const R=refs();const miss=R.filter(id=>{const x=PROCLIB.draftMaturity(id);return !x||x.target==null||Object.keys(x.dims||{}).length!==6});
  const all=WFX.defs.filter(d=>{const x=PROCLIB.draftMaturity(d.id);return !x||Object.keys(x.dims||{}).length!==6}).length;out[k]={linked:R.length,missing:miss.length,wfx:WFX.defs.length,wfxMissing:all,below:R.filter(id=>PROCLIB.draftMaturity(id).below).length}}
 SCN.set("core");return out});
Object.keys(sc).forEach(k=>{const x=sc[k];ok(x.missing===0&&x.wfxMissing===0,'scenario '+k+': '+x.linked+' journey-linked drafts and '+x.wfx+' workflows, all with a maturity record ('+x.below+' below target, modeled)')});
ok(Object.values(sc).some(x=>x.linked>0),'journey-linked drafts were found');
ok(errs.length===0,'no page errors');if(errs.length)console.log(errs.slice(0,5));
console.log(fail?'PROCS FAIL ('+fail+')':'PROCS PASS');await b.close();process.exit(fail?1:0)})();
