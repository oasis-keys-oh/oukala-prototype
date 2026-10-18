const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
await p.evaluate(()=>go('home'));await p.waitForTimeout(600);
console.log(await p.evaluate(()=>{const el=document.querySelector('#view .story');const o=[];for(let e=el;e;e=e.parentElement){const cs=getComputedStyle(e);o.push(e.tagName+'.'+e.className.toString().slice(0,20)+' bg='+cs.backgroundColor+' img='+cs.backgroundImage.slice(0,40))}return o.join('\n')+'\n'+getComputedStyle(document.documentElement).getPropertyValue('--bg')}));await b.close()})();
