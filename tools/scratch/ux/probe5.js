// PR-31 probe 5: rail signals (counts, dots, anchors) for the CFO and CIO, and what each count means to a screen reader.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'../../..');const out=path.join(__dirname,'shots','_probe5');fs.mkdirSync(out,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+ROOT+'/build_out/full.html',{waitUntil:'domcontentloaded',timeout:180000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function',null,{timeout:180000});await p.waitForTimeout(1500);
const R={};
for(const k of ['cfo','exec']){await p.evaluate(k=>{NAVX.persona.set(k);go('inv')},k);await wait(500);
 R[k]=await p.evaluate(()=>{const nav=document.getElementById('nav');
  const rows=[...nav.querySelectorAll('[data-nav],[data-nx-area],button')].filter(e=>e.getBoundingClientRect().width>0).slice(0,40).map(e=>({t:e.textContent.trim().replace(/\s+/g,' ').slice(0,40),aria:e.getAttribute('aria-label'),title:e.getAttribute('title'),
   bits:[...e.querySelectorAll('span,i,b,em,small')].filter(s=>s.getBoundingClientRect().width>0&&s.getBoundingClientRect().width<30).map(s=>(s.className.toString().slice(0,24))+'='+(s.textContent.trim()||'·')+(s.getAttribute('title')?'('+s.getAttribute('title')+')':'')+(s.getAttribute('aria-label')?'['+s.getAttribute('aria-label')+']':'')).slice(0,5)}));
  const all=[...nav.querySelectorAll('[data-nav]')].map(e=>e.getAttribute('data-nav'));const dup={};all.forEach(x=>dup[x]=(dup[x]||0)+1);
  return {rows,dups:Object.entries(dup).filter(([a,n])=>n>1)}})}
/* the meaning of "How to read this menu" */
await p.evaluate(()=>{const h=[...document.querySelectorAll('#nav button,#nav a')].find(e=>/How to read this menu/.test(e.textContent));if(h)h.click()});await wait(400);
R.help=await p.evaluate(()=>(document.getElementById('navHelp')||{innerText:''}).innerText.replace(/\s+/g,' ').slice(0,900));await p.screenshot({path:out+'/nav_help.jpg',type:'jpeg',quality:55});
fs.writeFileSync(out+'/data.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,0).slice(0,7000));await b.close()})();
