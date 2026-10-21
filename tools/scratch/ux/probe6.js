// PR-31 probe 6: Home structure for executives (section order and y position), and the "What should I look at first?" answer.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'../../..');const out=path.join(__dirname,'shots','_probe6');fs.mkdirSync(out,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+ROOT+'/build_out/full.html',{waitUntil:'domcontentloaded',timeout:180000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function',null,{timeout:180000});await p.waitForTimeout(1500);
const R={};
for(const k of ['ceo','cfo','board']){await p.evaluate(k=>{NAVX.persona.set(k);go('home')},k);await wait(500);
 R[k]=await p.evaluate(()=>{const v=document.getElementById('view');const hs=[...v.querySelectorAll('h1,h2,h3,.eyebrow,[class*=eyebrow]')].filter(e=>e.getBoundingClientRect().height>0).map(e=>Math.round(e.getBoundingClientRect().top+scrollY)+' '+e.textContent.trim().replace(/\s+/g,' ').slice(0,60));return {len:v.scrollHeight,heads:hs.slice(0,30)}});
 const btn=await p.$('text=What should I look at first?');if(btn){await btn.click();await wait(1200);R[k].first=await p.evaluate(()=>{const d=document.querySelector('#drawer:popover-open,#chatDock,.pop:popover-open');const cd=document.getElementById('chatDock');return (cd&&cd.getBoundingClientRect().width?cd.innerText:'').replace(/\s+/g,' ').slice(-700)});
  await p.screenshot({path:out+'/first_'+k+'.jpg',type:'jpeg',quality:55})}}
fs.writeFileSync(out+'/data.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1).slice(0,7000));await b.close()})();
