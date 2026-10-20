const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(()=>go('inv'));await p.waitForTimeout(800);
console.log(await p.evaluate(()=>[...document.querySelectorAll('.proc .ps')].map(e=>{const r=e.getBoundingClientRect();const kids=[...e.querySelectorAll('*')].filter(k=>k.getBoundingClientRect().right>r.right+1).map(k=>k.tagName+'.'+k.className+' '+Math.round(k.getBoundingClientRect().right-r.right));return e.scrollWidth+'/'+e.clientWidth+' '+kids.join(',')}).join('\n')));await b.close()})();
