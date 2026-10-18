const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
await p.evaluate(()=>go('svc_guides'));await p.waitForTimeout(800);
console.log(await p.evaluate(()=>[...document.querySelectorAll('[data-og]')].slice(0,8).map(b=>b.dataset.og).join(' ; ')+' | sw:'+document.querySelectorAll('.svc3-swwrap').length+' scr:'+S.screen));
await p.evaluate(()=>{const b=document.querySelector('[data-og^="gstart"]');if(b)b.click()});await p.waitForTimeout(900);
console.log(await p.evaluate(()=>'sw:'+document.querySelectorAll('.svc3-swwrap').length+' zs:'+document.querySelectorAll('.zs-root').length));
console.log(errs);await b.close()})();
