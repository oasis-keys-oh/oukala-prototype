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

// PR-22: roll-up rules (attainment, equal default weights, owner weights shown, floor, count once) in mod_mat roll and mod_exec objectives and cascade
const r22=await p.evaluate(async()=>{const R=ROLLUP,r2=v=>Math.round(v*100);const o={};
 /* the worked example of docs/options/rollup-weighting.md section 5 (modeled) */
 const a=[R.att(500,420,540),R.att(8,5,9),R.att(3,6,0)];o.att=a.map(r2);o.eq=r2(R.wmean(a.map(x=>({a:x,w:1}))));o.ow=r2(R.wmean([{a:a[0],w:.5},{a:a[1],w:.3},{a:a[2],w:.2}]));
 o.min=r2(R.att(12,10,null,'min'));o.floor=[R.floor('good',['good','bad']),R.floor('good',['good','warn']),R.floor('bad',['bad'])];o.split=R.split({A:.5,B:1.5});
 const E=EXE.E,ob=E.objs.find(x=>E.krs.filter(k=>k.o===x.id).length>=2);const p0=EXE.objProg(ob);o.src0=p0.src;o.wsum=Math.round(p0.w.reduce((s,x)=>s+x.w,0)*100);
 go('exe_strat');S.v.exestratv=0;render();await new Promise(r=>setTimeout(r,150));let t=document.querySelector('#view').innerText;o.rule=/How this rolls up/.test(t)&&/Floor/.test(t)&&/Count once/.test(t);o.eqLine=/Weights equal by default/.test(t);
 const ks=E.krs.filter(k=>k.o===ob.id);E.krw[ob.id]={w:Object.fromEntries(ks.map((k,i)=>[k.id,i?0.25/(ks.length-1):0.75])),by:ob.owner,at:U.TODAY_ISO};render();await new Promise(r=>setTimeout(r,120));
 t=document.querySelector('#view').innerText;const p1=EXE.objProg(ob);o.src1=p1.src;o.byShown=t.indexOf('Weights set by '+ob.owner)>=0;o.moved=Math.abs(p1.p-p0.p)>1e-9||ks.every(k=>EXE.krProg(k)===EXE.krProg(ks[0]));delete E.krw[ob.id];
 /* floor on real data: any objective whose raw status is good but has a red key result is held at amber */
 o.floorOk=E.objs.every(x=>{const p=EXE.objProg(x);return !(p.st==='good'&&p.red>0)});
 const X=EXE.cascade();o.casFloor=X.nodes.every(n=>!(n.st==='good'&&n.kids.some(id=>X.by[id].st==='bad')));o.leaf=Math.round(X.leafPts*10)/10;o.comp=Math.round(X.company.p*1000)/10;
 S.v.exestratv=5;render();await new Promise(r=>setTimeout(r,120));t=document.querySelector('#view').innerText;o.casRule=/How this rolls up/.test(t)&&/Count-once check/.test(t);
 /* maturity: objective roll-ups split shared capabilities so their weights add up to the whole once */
 const all=MAT.leaves().filter(n=>(n.objs||[]).length);const tot=all.reduce((s,n)=>s+n.w,0);const per=MAT.objRollRows().reduce((s,x)=>s+(x.R.sw&&x.R.n?x.R.sw:0),0);o.mat={tot:Math.round(tot*100)/100,per:Math.round(per*100)/100,shared:all.filter(n=>n.objs.length>1).length};
 const RA=MAT.roll(MAT.CAPS());o.matFloor=!(RA.st==='good'&&RA.bad>0);
 go('exe_mat');S.v.matv=0;render();await new Promise(r=>setTimeout(r,200));t=document.querySelector('#view').innerText;o.matRule=/How this rolls up/.test(t)&&/Weights: /.test(t);
 return o});
ok(r22.att.join()==='33,25,50'&&r22.eq===36&&r22.ow===34&&r22.min===83,`PR-22 attainment is direction-aware from baseline to target (33, 25, 50; lower is better 83%); equal weights 36%, owner weights 50/30/20 give 34% (worked example, modeled)`);
ok(r22.floor.join()==='warn,good,bad'&&Math.round((r22.split.A+r22.split.B)*100)===100,'PR-22 floor rule holds a green parent with a red child at amber; a shared item splits to 100%');
ok(r22.src0==='equal'&&r22.wsum===100&&r22.eqLine&&r22.src1==='owner'&&r22.byShown&&r22.moved,'PR-22 objective weights are equal by default and owner-set weights are shown with who set them');
ok(r22.floorOk&&r22.casFloor,'PR-22 no objective or cascade node is green while a child is red');
ok(Math.abs(r22.leaf-r22.comp)<0.2,`PR-22 cascade counts once: leaf points ${r22.leaf} add up to the company score ${r22.comp}`);
ok(Math.abs(r22.mat.tot-r22.mat.per)<0.01,`PR-22 maturity objective roll-ups count each capability once (${r22.mat.shared} shared, weights ${r22.mat.per} = ${r22.mat.tot})`);
ok(r22.rule&&r22.casRule&&r22.matRule&&r22.matFloor,'PR-22 the rule is shown on Strategy alignment, the cascade and Maturity models');

//@@NEXT

ok(errs.length===0,'no page errors');if(errs.length)console.log(errs.slice(0,8));
console.log(fail?'PRODUCT1 FAIL ('+fail+')':'PRODUCT1 PASS');await b.close();process.exit(fail?1:0)})();
