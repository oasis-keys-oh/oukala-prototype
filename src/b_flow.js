const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
await p.evaluate(()=>go('plat_build'));await p.waitForTimeout(400);
await p.screenshot({path:dir+'/shots/b0.png',fullPage:true});
await p.evaluate(()=>{document.querySelector('[data-bld-act="loadex"]').click()});await p.waitForTimeout(300);
for(let i=0;i<8;i++){await p.screenshot({path:dir+'/shots/b_s'+i+'.png',fullPage:false});if(i<7)await p.evaluate(()=>document.querySelector('[data-bld-act="next"]').click());await p.waitForTimeout(200)}
const info=await p.evaluate(()=>{const d=S.build.d;return JSON.stringify({gate:document.querySelector('[data-bld-step]').innerText.slice(0,600),missing:S.build.missing})});console.log(info);
console.log('ERR',errs);await b.close()})();
