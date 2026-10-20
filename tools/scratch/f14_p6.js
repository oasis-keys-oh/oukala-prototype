const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const id=process.argv[3];const sel=process.argv[4];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'})).newPage();
p.on('pageerror',e=>console.log('PE',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
await p.evaluate(i=>go(i),id);
for(let i=0;i<8;i++){await p.waitForTimeout(400);console.log(i,await p.evaluate(s=>{const g=document.querySelector(s);return g?('gf='+g.dataset.gf+' kids='+g.children.length+' ca='+document.querySelectorAll('[data-ca]').length+' cols='+getComputedStyle(g).gridTemplateColumns.split(' ').length):'none'},sel))}
await b.close()})();
