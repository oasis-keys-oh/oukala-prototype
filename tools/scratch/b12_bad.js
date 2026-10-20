const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
for(const id of ['bud_over','bud_ven','bud_model','bud_ben','bud_doa']){for(let v=0;v<5;v++){const r=await p.evaluate(([i,v])=>{const n={bud_over:'budv',bud_ven:'budx',bud_model:'budm',bud_ben:'budb',bud_doa:'budd'}[i];S.v[n]=v;go(i);const t=document.querySelector('#view').innerText;const m=t.match(/.{0,40}(undefined|NaN|\[object|Infinity).{0,40}/g);return m},[id,v]);if(r)console.log(id,v,r)}}
await b.close()})();
