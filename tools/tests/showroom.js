// Showroom test: lint passes, home renders, every tour steps start to finish with no errors and the bar on screen, and the
// presenter tools work: beat rail, rehearse mode, queued Next, optional child beats, presenter window, deep links.
// When the extension modules are present it also covers every lens, wedge mode, demo reset, the VibeCheck hand-off,
// the approval persona per beat (DC-37), the full-story path and the leave-behind.
// Usage: node tools/tests/showroom.js <dir containing full.html> [--shots <outdir>]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]||'build_out');const sd=a.includes('--shots')?path.resolve(a[a.indexOf('--shots')+1]):null;if(sd)fs.mkdirSync(sd,{recursive:true});
const URL0='file://'+dir+'/full.html';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
const watch=pg=>{pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message+' '+String(e.stack||'').split('\n').slice(1,4).join(' | ').slice(0,400)));pg.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,200)))};
watch(p);await ctx.route(/^https?:/,r=>r.abort());await p.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
const settle=async(pg)=>{pg=pg||p;await pg.waitForFunction(()=>!SHOW.state.busy,null,{timeout:10000}).catch(()=>{});await pg.waitForTimeout(800)};
const lint=await p.evaluate(()=>SHOW.lint());if(lint.length)fail('lint '+JSON.stringify(lint));
await p.evaluate(()=>go('showroom'));await p.waitForTimeout(400);
const home=await p.evaluate(()=>({len:document.querySelector('#view').innerHTML.length,cards:document.querySelectorAll('.sr-card').length}));if(home.cards<3)fail('home '+JSON.stringify(home));
if(sd)await p.screenshot({path:path.join(sd,'home.png')});
const startT=await p.evaluate(()=>({persona:S.persona,tenant:DATA.tenant()}));
// every tour, every beat
for(const d of await p.evaluate(()=>SHOW.demos.map(x=>[x.id,x.beats.length,x.total,x.tenant||'core']))){const [id,n,tot,ten]=d;
 await p.evaluate(id=>SHOW.start(id,0),id);await settle();
 for(let i=0;i<n;i++){const n0=errs.length;
  const exp=await p.evaluate(([id,i])=>{const b=SHOW.demos.find(x=>x.id===id).beats[i];return{go:b.go,ap:b.approve||null}},[id,i]);
  const r=await p.evaluate(()=>{const bar=document.querySelector('.sr-bar'),r=bar&&bar.getBoundingClientRect(),v=document.querySelector('#view');return{tabMissed:SHOW.state.tabMissed,bar:!!bar,inView:!!r&&r.bottom<=innerHeight&&r.top>=0,len:v?v.innerHTML.length:0,scr:S.screen,ten:DATA.tenant(),pt:(document.getElementById('srPt')||{}).textContent,chat:(document.getElementById('chatOpen')||{}).checked}});
  if(r.scr!==exp.go)fail(id+' beat '+(i+1)+' on screen '+r.scr+', expected '+exp.go);
  if(r.tabMissed)fail(id+' beat '+(i+1)+' tab not found: '+r.tabMissed);
  if(r.ten!==ten)fail(id+' beat '+(i+1)+' on tenant '+r.ten+', expected '+ten);
  if(!r.bar||!r.inView||r.len<400||errs.length>n0||r.chat)fail(id+' beat '+(i+1)+' '+JSON.stringify(r)+' '+errs.slice(n0));
  if(exp.ap){/* DC-37: the persona set for this beat can click Approve */
   const ok=await p.evaluate(ap=>{const rec=SHOW.approvalRec(ap);const actor=ap.kind==='budget_request'?INBOX.me():R15D.me().name;const c=APG.check(actor,ap.kind,rec);return{ok:c.ok,why:c.why,actor,persona:S.persona}},exp.ap);
   if(!ok.ok)fail(id+' beat '+(i+1)+' approve would be refused: '+JSON.stringify(ok));else console.log(' ',id,'beat',i+1,'approves as',ok.actor,'('+ok.persona+')')}
  if(sd)await p.screenshot({path:path.join(sd,id+'-'+String(i+1).padStart(2,'0')+'.png')});
  if(i<n-1){await p.keyboard.press('PageDown');await settle()}}
 await p.keyboard.press('PageUp');await settle();
 const bk=await p.evaluate(()=>[...document.querySelectorAll('.sr-dot')].findIndex(x=>x.classList.contains('on')));if(n>1&&bk!==n-2)fail(id+' Back did not step back, at '+bk);
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 const gone=await p.evaluate(()=>!document.querySelector('.sr-bar')&&!document.body.classList.contains('sr-on'));if(!gone)fail(id+' exit left the bar');
 const back=await p.evaluate(()=>({persona:S.persona,tenant:DATA.tenant()}));if(back.persona!==startT.persona||back.tenant!==startT.tenant)fail(id+' exit did not restore role and tenant '+JSON.stringify(back));
 console.log(id,n,'beats',tot,'s budget: stepped');}
// rail: R opens the beat list, a click jumps
await p.evaluate(()=>SHOW.start('coo',0));await settle();await p.keyboard.press('r');await p.waitForTimeout(200);
if(!await p.$('.sr-rail'))fail('rail did not open');else{await p.click('.sr-rail [data-srx=jump][data-i="4"]');await settle();const s=await p.evaluate(()=>({i:SHOW.state.i,scr:S.screen}));if(s.i!==4||s.scr!=='exe_dash')fail('rail jump '+JSON.stringify(s))}
// optional child beats (guardrail children per act)
const kid=await p.evaluate(()=>{const d=SHOW.demos.find(x=>x.id==='coo');const i=d.beats.findIndex(b=>b.kids&&b.kids.length);return i});
if(kid>=0){await p.evaluate(i=>SHOW.jump(i),kid);await settle();await p.keyboard.press('g');await settle();
 const k=await p.evaluate(()=>({kid:SHOW.state.kid,scr:S.screen,panel:!!document.querySelector('.gd-child')}));if(k.kid!==0||k.scr!=='guard'||!k.panel)fail('optional child '+JSON.stringify(k));
 await p.keyboard.press('PageDown');await settle();const k2=await p.evaluate(()=>({kid:SHOW.state.kid,i:SHOW.state.i}));if(k2.kid!==null||k2.i!==kid+1)fail('after the child Next should return to the tour '+JSON.stringify(k2));
 console.log('optional child beats: ok');}
// queued Next: pressing Next while the beat is still opening is kept, not lost
await p.evaluate(()=>SHOW.jump(0));await p.waitForTimeout(30);const q=await p.evaluate(()=>{SHOW.next();return SHOW.state.queued});await settle();await p.waitForTimeout(300);
const qi=await p.evaluate(()=>SHOW.state.i);if(!q||qi!==1)fail('queued Next queued='+q+' i='+qi);
// rehearse mode keeps beat times
await p.evaluate(()=>SHOW.setMode('rehearse'));await p.waitForTimeout(1100);if(!await p.$('.sr-bt'))fail('rehearse timer missing');
await p.keyboard.press('PageDown');await settle();await p.keyboard.press('Escape');await p.waitForTimeout(300);
const rh=await p.evaluate(()=>U.store.get('showroom.rehearsal',null));if(!rh||!rh.rows||!(rh.rows[1].actual>=1))fail('rehearsal report '+JSON.stringify(rh&&rh.rows&&rh.rows.slice(0,3)));
// presenter window: the second window shows the talk track, this one turns into the audience view, and they stay in step
await p.evaluate(()=>SHOW.start('coo',2));await settle();
const [pop]=await Promise.all([p.waitForEvent('popup',{timeout:15000}).catch(()=>null),p.click('[data-srx=win]')]);
if(!pop)fail('presenter window did not open');else{watch(pop);await pop.waitForLoadState('domcontentloaded');await pop.waitForFunction(()=>window.SHOW&&SHOW.state.demo==='coo'&&document.querySelector('.sr-talk'),null,{timeout:30000}).catch(()=>{});await settle(pop);
 const w1=await p.evaluate(()=>({aud:document.body.classList.contains('sr-aud'),talk:!!document.querySelector('.sr-talk')}));const w2=await pop.evaluate(()=>({i:SHOW.state.i,talk:!!document.querySelector('.sr-talk'),remote:SHOW.state.remote}));
 if(!w1.aud||w1.talk||w2.i!==2||!w2.talk||!w2.remote)fail('presenter window '+JSON.stringify({w1,w2}));
 await pop.keyboard.press('PageDown');await settle();await settle(p);const w3=await p.evaluate(()=>SHOW.state.i);if(w3!==3)fail('audience window did not follow the presenter, at '+w3);
 await pop.close();console.log('presenter window: ok');}
await p.evaluate(()=>SHOW.exit());await p.waitForTimeout(300);
// deep links
const p2=await ctx.newPage();watch(p2);
await p2.goto(URL0+'?showroom=coo&beat=4',{waitUntil:'domcontentloaded',timeout:120000});
await p2.waitForFunction(()=>typeof S!=='undefined'&&S.screen==='bst'&&document.querySelector('.sr-dot.on'),null,{timeout:20000}).catch(()=>{});await p2.waitForTimeout(300);
const dl=await p2.evaluate(()=>({scr:S.screen,on:[...document.querySelectorAll('.sr-dot')].findIndex(x=>x.classList.contains('on'))}));if(dl.on!==3||dl.scr!=='bst')fail('deep link '+JSON.stringify(dl));
await p2.goto(URL0+'?showroom=maturity&beat=2&mode=audience',{waitUntil:'domcontentloaded',timeout:120000});
await p2.waitForFunction(()=>window.SHOW&&SHOW.state.demo==='maturity',null,{timeout:20000}).catch(()=>{});await settle(p2);
const dl2=await p2.evaluate(()=>({mode:SHOW.state.mode,i:SHOW.state.i,aud:document.body.classList.contains('sr-aud')}));if(dl2.mode!=='audience'||dl2.i!==1||!dl2.aud)fail('deep link with mode '+JSON.stringify(dl2));
await p2.close();
// EXT: extension checks follow
console.log('deep link',JSON.stringify(dl),'errors',errs.length?errs:'none','failures',bad);await b.close();process.exit(bad||errs.length?1:0)})();
