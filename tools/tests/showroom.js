// Showroom test: lint passes, home renders, each tour steps start to finish with no errors, bar stays on screen.
// Usage: node tools/tests/showroom.js <dir containing full.html> [--shots <outdir>]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]||'build_out');const sd=a.includes('--shots')?path.resolve(a[a.indexOf('--shots')+1]):null;if(sd)fs.mkdirSync(sd,{recursive:true});
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy/.test(m.text())&&errs.push('console: '+m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
const lint=await p.evaluate(()=>SHOW.lint());if(lint.length)fail('lint '+JSON.stringify(lint));
await p.evaluate(()=>go('showroom'));await p.waitForTimeout(400);
const home=await p.evaluate(()=>({len:document.querySelector('#view').innerHTML.length,cards:document.querySelectorAll('.sr-card').length}));if(home.cards<3)fail('home '+JSON.stringify(home));
if(sd)await p.screenshot({path:path.join(sd,'home.png')});
for(const d of await p.evaluate(()=>SHOW.demos.map(x=>[x.id,x.beats.length,x.total]))){const [id,n,tot]=d;
 await p.evaluate(id=>SHOW.start(id,0),id);await p.waitForTimeout(700);
 for(let i=0;i<n;i++){const n0=errs.length;
  const exp=await p.evaluate(([id,i])=>SHOW.demos.find(x=>x.id===id).beats[i].go,[id,i]);
  const r=await p.evaluate(()=>{const bar=document.querySelector('.sr-bar'),r=bar&&bar.getBoundingClientRect(),v=document.querySelector('#view');return{bar:!!bar,inView:!!r&&r.bottom<=innerHeight&&r.top>=0,len:v?v.innerHTML.length:0,scr:S.screen,pt:(document.getElementById('srPt')||{}).textContent,toast:!!document.querySelector('#toasts .toast, #toasts > *')&&getComputedStyle(document.getElementById('toasts')).display!=='none',chat:(document.getElementById('chatOpen')||{}).checked}});
  if(r.scr!==exp)fail(id+' beat '+(i+1)+' on screen '+r.scr+', expected '+exp);
  if(!r.bar||!r.inView||r.len<400||errs.length>n0||r.chat)fail(id+' beat '+(i+1)+' '+JSON.stringify(r)+' '+errs.slice(n0));
  if(sd)await p.screenshot({path:path.join(sd,id+'-'+String(i+1).padStart(2,'0')+'.png')});
  if(i<n-1){await p.keyboard.press('ArrowRight');await p.waitForTimeout(650)}}
 await p.keyboard.press('ArrowLeft');await p.waitForTimeout(500);
 const bk=await p.evaluate(()=>document.querySelector('.sr-dot.on')&&[...document.querySelectorAll('.sr-dot')].findIndex(x=>x.classList.contains('on')));if(bk!==n-2)fail(id+' Back did not step back, at '+bk);
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 const gone=await p.evaluate(()=>!document.querySelector('.sr-bar')&&!document.body.classList.contains('sr-on'));if(!gone)fail(id+' exit left the bar');
 console.log(id,n,'beats',tot,'s budget: stepped');}
// deep link
const p2=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();await p2.route(/^https?:/,r=>r.abort());
await p2.goto('file://'+dir+'/full.html?showroom=coo&beat=4',{waitUntil:'domcontentloaded',timeout:120000});await p2.waitForTimeout(2200);
const dl=await p2.evaluate(()=>({scr:S.screen,on:[...document.querySelectorAll('.sr-dot')].findIndex(x=>x.classList.contains('on'))}));if(dl.on!==3||dl.scr!=='bst')fail('deep link '+JSON.stringify(dl));
console.log('deep link',JSON.stringify(dl),'errors',errs.length?errs:'none','failures',bad);await b.close();process.exit(bad||errs.length?1:0)})();
