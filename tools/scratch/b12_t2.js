const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
const seen=new Set(),q=[];
for(let v=0;v<5;v++){await p.evaluate(v=>{S.v.budv=v;go('bud_over')},v);const specs=await p.evaluate(()=>[...new Set([...document.querySelectorAll('#view [data-bd]')].map(e=>e.getAttribute('data-bd')))]);console.log('tab',v,specs.length);specs.forEach(s=>{if(!seen.has(s)){seen.add(s);q.push(s)}})}
let n=0;
while(q.length){const sp=q.shift();n++;
 const r=await p.evaluate(sp=>{closeDrawer();openBudgetDrill(sp);const d=document.getElementById('drawer');return {len:d.innerText.length,bad:(d.innerText.match(/.{0,30}(undefined|NaN|\[object|Unknown|could not).{0,30}/g)||[]),crumb:!!d.querySelector('.bd-crumb'),subs:[...new Set([...d.querySelectorAll('[data-bd]')].map(e=>e.getAttribute('data-bd')))]}},sp);
 if(r.len<150||r.bad.length||!r.crumb)console.log('!!',sp,JSON.stringify({len:r.len,bad:r.bad,crumb:r.crumb}));
 r.subs.forEach(s=>{if(!seen.has(s)){seen.add(s);q.push(s)}});
 if(errs.length){console.log('ERR at',sp,errs.splice(0))}
}
console.log('visited',n);await b.close()})();
