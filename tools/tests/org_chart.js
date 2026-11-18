// Org chart fills the screen (PR-113, reported by Omar 2026-11-18: the chart rendered wide and short and needed a lot of scrolling).
// 1. The chart viewport fills the band under the header once the chart is scrolled to: its bottom is inside the window and it is most of the window tall
//    (1440 x 900 and 1280 x 720, design fonts and Verdana / Times New Roman fallback fonts).
// 2. The laid-out tree is not flat: width is at most 3.5 times its height (it was about 18 times), and no horizontal page scroll.
// 3. Every person card is rendered, has a size, and has a connector; the AI teammates view still shows its agent chips.
// 4. Selection and person view still work (a card opens the profile drawer); the Has agents filter still toggles.
// Usage: node tools/tests/org_chart.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});let bad=0;const errs=[];
const ok=m=>console.log('ok   '+m),fail=m=>{bad++;console.log('FAIL '+m)};
const FB='*{font-family:Verdana,"Times New Roman",serif!important}';
async function open(w,h,fb){const p=await (await b.newContext({viewport:{width:w,height:h},colorScheme:'light'})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(800);
 if(fb)await p.addStyleTag({content:FB});return p}
async function show(p,mode){await p.evaluate(m=>{S.org.mode=m;S.org.k=0;S.org.outline=false;S.org.tab='chart';go('org_chart')},mode||'both');await p.waitForTimeout(800);
 await p.evaluate(()=>{const e=document.querySelector('.org-wrap');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-110)});await p.waitForTimeout(300)}
for(const fb of [false,true])for(const [w,h] of [[1440,900],[1280,720]]){const tag=(fb?'fallback fonts ':'design fonts ')+w+'x'+h;const p=await open(w,h,fb);await show(p,'both');
 const r=await p.evaluate(()=>{const v=document.getElementById('orgvp').getBoundingClientRect(),c=ORGX.cam.get();
  const cards=[...document.querySelectorAll('#orgcv .org-n')];const flat=cards.filter(n=>{const q=n.getBoundingClientRect();return q.width<10||q.height<10}).length;
  return {top:v.top,bottom:v.bottom,h:v.height,ih:innerHeight,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,W:c.W,H:c.H,n:cards.length,flat,lines:document.querySelectorAll('#orgcv .org-svg .org-ln').length,
  overlap:(()=>{let o=0;const q=cards.map(n=>n.getBoundingClientRect());for(let i=0;i<q.length;i++)for(let j=i+1;j<q.length;j++){const a=q[i],c=q[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)o++}return o})()}});
 if(r.overlap)fail(tag+': '+r.overlap+' overlapping cards');else ok(tag+': no overlapping cards');
 if(r.bottom>r.ih+1||r.top<0)fail(tag+': chart not inside the window '+JSON.stringify(r));else ok(tag+': chart bottom '+Math.round(r.bottom)+' is inside the '+r.ih+' px window');
 if(r.h<r.ih*.75)fail(tag+': chart only '+Math.round(r.h)+' px of '+r.ih+' px tall');else ok(tag+': chart fills '+Math.round(100*r.h/r.ih)+'% of the window height');
 if(r.W/r.H>3.5)fail(tag+': tree is flat, '+r.W+' x '+r.H);else ok(tag+': tree '+r.W+' x '+r.H+' is balanced');
 if(r.sw>r.cw+1)fail(tag+': horizontal page scroll '+r.sw+' > '+r.cw);else ok(tag+': no horizontal page scroll');
 if(r.n<30||r.flat)fail(tag+': nodes missing or collapsed '+r.n+' cards, '+r.flat+' empty');else ok(tag+': '+r.n+' cards rendered');
 if(r.lines<r.n-1)fail(tag+': connectors missing '+r.lines+' for '+r.n+' cards');else ok(tag+': '+r.lines+' connectors');
 if(w===1440){
  await show(p,'ai');const a=await p.evaluate(()=>({n:document.querySelectorAll('#orgcv .org-n').length,ag:document.querySelectorAll('#orgcv .org-ag').length,lines:document.querySelectorAll('#orgcv .org-svg .org-ln').length,c:ORGX.cam.get(),b:document.getElementById('orgvp').getBoundingClientRect().bottom,ih:innerHeight}));
  if(a.n<8||a.ag<1||a.lines<a.n-1)fail(tag+': AI teammates view broke '+JSON.stringify(a));else ok(tag+': AI teammates view shows '+a.ag+' agent card(s) of '+a.n);
  if(a.b>a.ih+1)fail(tag+': AI view chart below the window');
  await show(p,'both');
  const s=await p.evaluate(async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));const c=document.querySelector('#orgcv .org-card[data-org-open]');const name=c.dataset.orgOpen;c.click();await W(500);
   const h=(document.querySelector('#drawer h2')||{}).textContent||'';return {name,h}});
  if(!s.name||s.h.indexOf(s.name)<0)fail(tag+': person view did not open for '+s.name+' ('+s.h+')');else ok(tag+': person view opens for '+s.name);
  await p.evaluate(()=>{try{closeDrawer()}catch(e){}});await p.waitForTimeout(200);
  await show(p,'both');const f=await p.evaluate(async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));const c=document.querySelector('[data-org-f="agents:has"]');c.click();await W(500);
   const c2=document.querySelector('[data-org-f="agents:has"]');return {p:c2&&c2.getAttribute('aria-pressed'),n:document.querySelectorAll('#orgcv .org-n').length,dim:document.querySelectorAll('#orgcv .org-n.dim').length}});
  if(f.p!=='true'||f.n<30||f.dim<1)fail(tag+': Has agents filter '+JSON.stringify(f));else ok(tag+': Has agents filter toggles, '+f.dim+' cards dimmed');}
 await p.context().close()}
if(errs.length){bad++;console.log('FAIL page errors',errs.slice(0,5))}
await b.close();console.log(bad?'org_chart: '+bad+' FAILED':'org_chart: all passed');process.exit(bad?1:0)})();
