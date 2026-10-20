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

// JM-13: Build list by purview; the drawer refuses a build outside the purview; the purview is on screen
const r13=await p.evaluate(async()=>{const out={};window.__p1dr=0;HOOKS.on('afterOpenDrawer',()=>{window.__p1dr++},{id:'p1.drawers'});const prev=S.persona;SCN.set('core');await new Promise(r=>setTimeout(r,120));const ALL=JXR.builds();
 for(const ps of ['exec','arch','ops','pm','newhire']){S.persona=ps;S.pp2.tab.ppl_jrny=8;go('ppl_jrny');await new Promise(r=>setTimeout(r,150));
  const pv=JXR.purview(),mine=JXR.buildsFor(pv),out1=ALL.filter(o=>!mine.some(m=>m.id===o.id));const v=document.querySelector('#view .pp2-pane');
  let refused=true;const n0=window.__p1dr;if(out1.length){JXR.buildDrawer(out1[0].id);refused=window.__p1dr===n0}
  if(mine.length){const n1=window.__p1dr;JXR.buildDrawer(mine[0].id);if(window.__p1dr!==n1+1)refused=false}
  const bar=v&&v.querySelector('.jb-pv');out[ps]={scope:pv.scope,n:mine.length,total:ALL.length,cards:v?v.querySelectorAll('.jb-card').length:-1,bar:bar?bar.innerText:'',refused,
   ownOk:pv.scope!=='own'||mine.every(o=>{const w=JXR.buildOwners(o);return [...w.box,...w.step,...w.proc].some(n=>n===pv.user||(pv.role&&n.toLowerCase()===pv.role.toLowerCase()))})}}
 S.persona=prev;closeDrawer&&closeDrawer();render();return out});
for(const ps in r13){const c=r13[ps];ok(/Your purview/.test(c.bar)&&/Showing \d+ of \d+ build/.test(c.bar)&&c.cards===Math.min(24,c.n)&&c.refused&&c.ownOk&&!EMDASH.test(c.bar),`JM-13 ${ps}: purview ${c.scope}, ${c.n} of ${c.total} builds shown and named on screen; a build outside it does not open`)}
ok(r13.exec.scope==='all'&&r13.arch.scope==='all'&&r13.ops.scope==='dept'&&r13.pm.scope==='own'&&r13.newhire.scope==='own','JM-13: leaders and architects all, a department head dept, individual contributors own');

//@@NEXT

ok(errs.length===0,'no page errors');if(errs.length)console.log(errs.slice(0,8));
console.log(fail?'PRODUCT1 FAIL ('+fail+')':'PRODUCT1 PASS');await b.close();process.exit(fail?1:0)})();
