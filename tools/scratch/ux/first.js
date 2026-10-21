// UX first look (PR-31): home as the CIO, rail, top bar.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(__dirname,'../../../build_out');const out=path.join(__dirname,'shots','_first');require('fs').mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function'&&window.EXP,null,{timeout:120000});await p.waitForTimeout(1500);
await p.screenshot({path:out+'/home.png'});
const r=await p.evaluate(()=>({nav:document.getElementById('nav')?document.getElementById('nav').innerText.slice(0,1500):'no #nav',
 top:(document.querySelector('header,.topbar,#top')||{innerText:'?'}).innerText.slice(0,800),
 ids:[...document.querySelectorAll('body > *')].map(e=>e.tagName+'#'+e.id+'.'+e.className).slice(0,30)}));
console.log(JSON.stringify(r,null,1));await b.close()})();
