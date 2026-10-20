const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
// enumerate all drill targets on each tab, click each, check drawer renders w/o error
const res={};
for(let v=0;v<5;v++){
 await p.evaluate(v=>{S.v.budv=v;go('bud_over')},v);await p.waitForTimeout(150);
 const specs=await p.evaluate(()=>[...new Set([...document.querySelectorAll('#view [data-bd]')].map(e=>e.getAttribute('data-bd')))]);
 res[v]=specs.length;
 for(const sp of specs){
  await p.evaluate(sp=>{closeDrawer();BD.stack=[];openBudgetDrill(sp)},sp);await p.waitForTimeout(30);
  const r=await p.evaluate(()=>{const d=document.getElementById('drawer');return {len:d.innerText.length,bad:(d.innerText.match(/.{0,30}(undefined|NaN|\[object|Unknown|could not).{0,30}/g)||[]),crumb:!!d.querySelector('.bd-crumb')}});
  if(r.len<150||r.bad.length||!r.crumb)console.log('!!',v,sp,JSON.stringify(r));
  // second-level: click all data-bd in drawer
  const sub=await p.evaluate(()=>[...new Set([...document.querySelectorAll('#drawer [data-bd]')].map(e=>e.getAttribute('data-bd')))]);
  for(const s2 of sub){await p.evaluate(s2=>{BD.stack.length=Math.min(BD.stack.length,1);BD.show();openBudgetDrill.__n=0;const e=document.querySelector('#drawer [data-bd="'+s2.replace(/"/g,'\\"')+'"]');if(e)e.click()},s2);await p.waitForTimeout(10);
   const r2=await p.evaluate(()=>{const d=document.getElementById('drawer');return {len:d.innerText.length,bad:(d.innerText.match(/.{0,30}(undefined|NaN|\[object|Unknown|could not).{0,30}/g)||[]),d:BD.stack.length}});
   if(r2.len<150||r2.bad.length)console.log('!!2',v,sp,'->',s2,JSON.stringify(r2));}
 }
}
console.log(res,errs.slice(0,10));await b.close()})();
