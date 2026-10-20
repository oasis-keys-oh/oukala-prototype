const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_slafull');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
async function drag(srcSel,dstSel){const s=await p.$(srcSel),d=await p.$(dstSel);if(!s||!d){console.log('missing',srcSel,!!s,dstSel,!!d);return}await s.scrollIntoViewIfNeeded();await d.scrollIntoViewIfNeeded();await s.scrollIntoViewIfNeeded();let a=await s.boundingBox();
 await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2+12,a.y+a.height/2+12,{steps:4});
 // scroll so destination visible while dragging
 await p.evaluate(sel=>document.querySelector(sel).scrollIntoView({block:'center'}),dstSel);await p.waitForTimeout(100);const dd=await (await p.$(dstSel)).boundingBox();await p.mouse.move(dd.x+dd.width/2,dd.y+dd.height/2,{steps:10});await p.mouse.up();await p.waitForTimeout(600)}
await p.evaluate(()=>{S.v.svc_slav=2;go('svc_sla');render()});await p.waitForTimeout(1500);
const before=await p.evaluate(()=>SLAX.covMatrix().pct);
const cell=await p.evaluate(()=>{const m=SLAX.covMatrix();for(const rw of m.rows)for(let i=0;i<rw.cs.length;i++)if(rw.cs[i].state==='gap'&&rw.cs[i].need.includes('OLA'))return `[data-dnd="cov|${rw.r.k}|${m.cols[i].k}"]`});console.log(cell);
await drag('.sla-pc[data-dnd-id^="A|"]',cell);
console.log('coverage',before,'->',await p.evaluate(()=>SLAX.covMatrix().pct));
await p.evaluate(()=>{S.v.svc_slav=4;render()});await p.waitForTimeout(1500);
await drag('.sla-ar[data-dnd-id^="C|"]','.sla-pp[data-dnd^="P|"]');
console.log('desk',await p.evaluate(()=>JSON.stringify(SLAX.SL.desk)));
await p.screenshot({path:dir+'/shots/sla_dnd.png'});await b.close()})();
