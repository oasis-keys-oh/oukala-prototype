// Wave 4 stream product-1: one check per backlog row (CL-88, JM-13, PR-22, PR-23, CL-51, PR-08).
// Usage: node tools/tests/product1.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view')&&window.JYX&&JYX.api&&window.PROCLIB&&window.OWNERX,null,{timeout:120000});
await p.evaluate(()=>new Promise(r=>{if(window.PROCLIB&&PROCLIB.whenSettled){PROCLIB.whenSettled(r);setTimeout(r,20000)}else r()}));await p.waitForTimeout(300);
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++};
const txt=async(id,pre)=>p.evaluate(async([id,pre])=>{if(pre)(new Function(pre))();go(id);await new Promise(r=>setTimeout(r,250));return document.querySelector('#view').innerText},[id,pre||'']);
const EMDASH=/\u2014/;

// CL-88: the six robot steps once owned by AI agents keep kind robot; the owner is the robot, with a human sponsor and backup
const r88=await p.evaluate(()=>{const want={ppl_cap:["Collect demand","Subtract leave and holidays"],ppl_jrny:["Measure"],port:["Turn into a project"],ppm_raid:["Watch exposure"],plat_cov:["Audit"]};
 const hum=n=>{const x=who(n);return !!(x&&x.kind!=="ai"&&x.name===n)};const out=[];
 for(const pid in want){const g=PROCLIB.get(pid);want[pid].forEach(n=>{const s=(g&&g.stepsList||[]).find(x=>x.n===n);const rb=s&&STEPMODE.robotFor(s,{process:pid});
  out.push({pid,n,found:!!s,kind:s&&STEPMODE.of(s.who),owner:s&&s.owner,robot:rb&&rb.name,sp:rb&&rb.sponsor,bk:rb&&rb.backup,ok:!!(s&&STEPMODE.of(s.who)==="robot"&&!/Agent$/.test(s.owner)&&rb&&rb.name===s.owner&&hum(rb.sponsor)&&hum(rb.backup)&&rb.sponsor!==rb.backup)})})}
 return out});
ok(r88.length===6&&r88.every(x=>x.ok),'CL-88: 6 robot steps are owned by their robot with a human sponsor and a different backup: '+r88.map(x=>x.pid+'/'+x.n+' -> '+x.owner+' (sponsor '+x.sp+')').join('; '));

//@@NEXT

ok(errs.length===0,'no page errors');if(errs.length)console.log(errs.slice(0,8));
console.log(fail?'PRODUCT1 FAIL ('+fail+')':'PRODUCT1 PASS');await b.close();process.exit(fail?1:0)})();
