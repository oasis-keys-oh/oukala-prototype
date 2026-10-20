const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const W=+process.env.W||1440;
const ctx=await b.newContext({viewport:{width:W,height:950},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(1200);
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){console.log('EVERR',e.message.slice(0,200))}};
// ---- new drawing from template, publish
await ev(()=>DRAW.open(null,{tpl:'tpl_approval'}));await p.waitForTimeout(600);
console.log('tpl valid',await ev(()=>JSON.stringify(DRAW.validate(DRAW.ST.doc).items.filter(i=>i.lv!=='ok').map(i=>i.title))));
await p.screenshot({path:'shots_b13/t4_tpl_'+W+'.png'});
const before=await ev(()=>PROCLIB.list().length);
const r=await ev(()=>{DRAW.ST.doc.name='Approval request drawn';const r=DRAW.publish();return r&&{pid:r.pid,steps:r.steps,lv:r.lv,w:r.warnings}});
console.log('publish new',JSON.stringify(r),before,await ev(()=>PROCLIB.list().length));
console.log('process get',await ev(()=>{const g=PROCLIB.get(DRAW.ST.doc.pid);return JSON.stringify({n:g.name,steps:g.stepsList.map(s=>[s.n,s.who,s.owner].join('|')),lvl:g.level})}));
await p.waitForTimeout(500);await p.screenshot({path:'shots_b13/t4_saved_'+W+'.png'});
// ---- open existing process, modify, publish, round trip
const pid=await ev(()=>PROCLIB.list().find(x=>x.steps>=5&&x.steps<=8).id);
await ev(i=>DRAW.open(i),pid);await p.waitForTimeout(700);
console.log('existing opened',await ev(()=>JSON.stringify({n:DRAW.ST.doc.name,sh:DRAW.ST.doc.shapes.length,v:DRAW.validate(DRAW.ST.doc).items.filter(i=>i.lv==='err').map(i=>i.title)})));
await p.screenshot({path:'shots_b13/t4_existing_'+W+'.png'});
const rt=await ev(()=>{const D=DRAW,d=D.ST.doc;const st0=D.stepsNow(d.pid);const st1=D.toSteps(d);return JSON.stringify({a:st0.length,b:st1.length,same:st0.every((s,i)=>st1[i]&&st1[i].n===s.n&&st1[i].who===(s.who||'human'))})});
console.log('roundtrip',rt);
await ev(()=>{const D=DRAW;D.addAuto('approval',{n:'Extra sign-off',owner:'Marcus Reid'});D.addAuto('end',{n:'Closed'});});
const pub=await ev(()=>{const r=DRAW.publish();return JSON.stringify(r?{steps:r.steps,lv:r.lv&&r.lv.level}:null)});console.log('publish existing',pub);
console.log('steps now',await ev(()=>PROCLIB.get(DRAW.ST.doc.pid).stepsList.length));
// stale banner after outside change
await ev(()=>{const pid=DRAW.ST.doc.pid;S.proc[pid]=S.proc[pid].concat([{n:'External step',who:'human'}]);PROCLIB.refresh();render()});await p.waitForTimeout(600);
console.log('stale',await ev(()=>!!document.querySelector('.dr-stale')));
// export
const dj=await ev(()=>DRAW.exportJSON());const ds=await ev(()=>DRAW.exportSVG());
console.log('json',dj.length,'svg',ds&&ds.length,ds&&ds.slice(0,120));fs.writeFileSync('shots_b13/exp.svg',ds||'');fs.writeFileSync('shots_b13/exp.json',dj);
const imp=await ev(t=>DRAW.applyJSON(t),dj);console.log('import ok',imp);
// metrics
console.log('metrics',await ev(()=>{DRAW.syncMetrics();return JSON.stringify(['m_draw_cov','m_draw_valid','m_draw_auto','m_draw_sync'].map(k=>METRICS[k].cur))}));
// contract
console.log('contract',await ev(()=>JSON.stringify(CONTRACT.evaluate('draw_studio')&&{f:Object.keys(CONTRACT.evaluate('draw_studio')),s:CONTRACT.evaluate('draw_studio').score,ch:(CONTRACT.evaluate('draw_studio').checks||[]).map(c=>c.id+':'+c.ok)})));
console.log('errors',errs);await b.close()})();
