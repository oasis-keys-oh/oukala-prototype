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
// SR_ONLY=<tour id,...> limits the step-through to some tours while iterating; npm test runs them all
const only=(process.env.SR_ONLY||'').split(',').filter(Boolean);
for(const d of await p.evaluate(()=>SHOW.demos.map(x=>[x.id,x.beats.length,x.total,x.tenant||'core']))){if(only.length&&only.indexOf(d[0])<0)continue;const [id,n,tot,ten]=d;
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
// lenses (DC-07, DC-28): every lens is configuration with a cut, metrics that exist, and applying it sets the lens and the role
if(await p.evaluate(()=>!!SHOW.lenses)){
 const L=await p.evaluate(()=>SHOW.lenses.map(l=>{const o=SHOW.lensOf(l.id);const cut=SHOW.lensCut(l.id);return{id:l.id,r18:!!R18.LENSES.find(x=>x.id===l.r18),mets:l.metrics.filter(m=>!METRICS[m]),cut:!!cut&&cut.total<=SHOW.LIMIT,screens:o.screens.length,persona:l.persona}}));
 const want=['coo','cio','cfo','ceo','ciso','chro','caio','clo'];want.forEach(id=>{if(!L.find(l=>l.id===id))fail('lens missing '+id)});
 L.forEach(l=>{if(!l.r18||l.mets.length||!l.cut||l.screens<4)fail('lens '+JSON.stringify(l))});
 for(const l of L){const r=await p.evaluate(id=>{SHOW.applyLens(id);go('r18_lens');const on=document.querySelector('.r18-lopt.on');return{lens:R18.st.lens,persona:S.persona,on:on&&on.dataset.r18Lens}},l.id);await p.waitForTimeout(150);
  if(r.lens!==l.id||r.on!==l.id||r.persona!==l.persona)fail('apply lens '+l.id+' '+JSON.stringify(r))}
 await p.evaluate(p0=>{NAVX.persona.set(p0)},startT.persona);console.log('lenses:',L.map(l=>l.id+' '+l.screens+' screens').join(', '))}
// DC-17: Build the fix in VibeCheck, from a Build list card, a red Journey box, an Agent Action gap and an orphan
if(await p.evaluate(()=>!!SHOW.buildFix)){
 await p.evaluate(()=>{go('ppl_jrny')});await p.waitForTimeout(400);await p.evaluate(()=>{const b=[...document.querySelectorAll('.screen .views button, .screen [role=tab]')].find(x=>x.textContent.trim()==='Build list');b&&b.click()});await p.waitForTimeout(500);
 const nb=await p.evaluate(()=>document.querySelectorAll('.jb-card .srs-fix').length);if(!nb)fail('no Build the fix button on Build list cards');
 else{await p.click('.jb-card .srs-fix');await p.waitForTimeout(1200);const f=await p.evaluate(()=>({scr:S.screen,k:SHOW.lastFix&&SHOW.lastFix.kind,ref:SHOW.lastFix&&SHOW.lastFix.ref,sc:!!(window.STUDIO&&STUDIO.sc)}));
  if(f.scr!=='studio'||f.k!=='build'||!f.ref||!f.sc)fail('fix from a Build list card '+JSON.stringify(f))}
 await p.evaluate(()=>{SCN.set('health');go('ppl_jrny')});await p.waitForTimeout(400);await p.evaluate(()=>{const b=[...document.querySelectorAll('.screen .views button, .screen [role=tab]')].find(x=>x.textContent.trim()==='Map');b&&b.click()});await p.waitForTimeout(500);
 const nr=await p.evaluate(()=>[document.querySelectorAll('div.noproc').length,document.querySelectorAll('div.noproc .srs-fix').length]);if(!nr[0]||nr[1]!==nr[0])fail('red Journey boxes without the fix button '+nr);
 for(const k of ['journey','gap','orphan']){const r=await p.evaluate(k=>{const t=SHOW.buildFix({kind:k,ref:'X-1',title:'Test gap '+k});return{t,scr:S.screen}},k);await p.waitForTimeout(900);
  const s=await p.evaluate(()=>({scr:S.screen,sc:!!(window.STUDIO&&STUDIO.sc)}));if(!/Test gap/.test(r.t)||s.scr!=='studio'||!s.sc)fail('fix '+k+' '+JSON.stringify([r,s]))}
 await p.evaluate(()=>{SCN.set('core');go('home')});await p.waitForTimeout(300);console.log('build the fix: ok ('+nb+' cards, '+nr[1]+' red boxes)')}
// PR-18: wedge mode hides every screen outside the COO cut from the menu and search, never deletes, persists
if(await p.evaluate(()=>!!SHOW.wedge)){
 const w=await p.evaluate(async()=>{SHOW.wedge.set(true);go('home');await new Promise(r=>setTimeout(r,300));const ok=new Set(SHOW.wedge.screens());
  const its=[...document.querySelectorAll('#nav [data-nx-it]')];const vis=its.filter(x=>!x.hidden&&x.offsetParent!==null).map(x=>x.dataset.nxIt);
  const out=vis.filter(id=>!ok.has(id));const hid=its.filter(x=>x.hidden).length;
  const sh=R15.hideItem({ty:'screen',key:'screen:itsm_inc'},'incident'),sk=R15.hideItem({ty:'screen',key:'screen:bst'},'budget');
  go('itsm_inc');const opened=S.screen==='itsm_inc'&&document.querySelector('#view').innerHTML.length>400;
  return{vis:vis.length,out,hid,sh,sk,opened,note:!!document.querySelector('.srs-wnote'),stored:U.store.get('falconaire.wedge',false)}});
 if(w.out.length||!w.vis||!w.hid||!w.sh||w.sk||!w.opened||!w.note||!w.stored)fail('wedge mode '+JSON.stringify(w));
 const p3=await ctx.newPage();watch(p3);await p3.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p3.waitForTimeout(1500);
 const w2=await p3.evaluate(()=>({on:SHOW.wedge.on(),attr:document.body.hasAttribute('data-wedge')}));if(!w2.on||!w2.attr)fail('wedge mode did not persist '+JSON.stringify(w2));
 await p3.goto(URL0+'?wedge=0',{waitUntil:'domcontentloaded',timeout:120000});await p3.waitForTimeout(1500);const w3=await p3.evaluate(()=>SHOW.wedge.on());if(w3)fail('?wedge=0 did not turn wedge mode off');await p3.close();
 await p.evaluate(()=>SHOW.wedge.set(false));console.log('wedge mode:',w.vis,'menu items shown,',w.hid,'hidden')}
// PR-19: demo reset and role preset
if(await p.evaluate(()=>!!SHOW.reset)){
 const r1=await p.evaluate(()=>{localStorage.setItem('fx.num.v1','"sentinel"');localStorage.setItem('oukala-r16i-test','"sentinel"');NAVX.persona.set('ops');SCN.set('mining');
  const r=SHOW.reset({reload:false});return{persona:S.persona,tenant:DATA.tenant(),fx:localStorage.getItem('fx.num.v1'),r16:localStorage.getItem('oukala-r16i-test'),n:r.cleared.length}});
 if(r1.persona!=='exec'||r1.tenant!=='core'||r1.fx==='"sentinel"'||r1.r16!==null)fail('reset in place '+JSON.stringify(r1));
 const p4=await ctx.newPage();watch(p4);await p4.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p4.waitForTimeout(1500);
 await p4.evaluate(()=>{['fx.num.v1','oukala-chx-1','oukala.bl.cols','oukala-r15d-test','oukala-r16i-test','showroom.lens'].forEach(k=>localStorage.setItem(k,'"sentinel"'));U.store.set('falconaire.wedge',false);NAVX.persona.set('ops');SCN.set('storage')});
 await Promise.all([p4.waitForNavigation({timeout:30000}).catch(()=>null),p4.evaluate(()=>{SHOW.reset({demo:'coo'})})]);
 await p4.waitForFunction(()=>window.SHOW&&SHOW.state.demo==='coo',null,{timeout:30000}).catch(()=>{});await settle(p4);await p4.waitForTimeout(800);
 const r2=await p4.evaluate(()=>({demo:SHOW.state.demo,persona:S.persona,tenant:DATA.tenant(),left:['fx.num.v1','oukala-chx-1','oukala.bl.cols','oukala-r15d-test','oukala-r16i-test','showroom.lens'].filter(k=>localStorage.getItem(k)==='"sentinel"'),wedgeKept:localStorage.getItem('falconaire.wedge')!==null,url:location.search}));
 if(r2.demo!=='coo'||r2.persona!=='coo'||r2.tenant!=='core'||r2.left.length||!r2.wedgeKept||/srreset/.test(r2.url))fail('reset and reload '+JSON.stringify(r2));
 await p4.close();console.log('demo reset: ok, cleared',r1.n,'keys in place;',JSON.stringify(r2))}
// EXT: extension checks follow
console.log('deep link',JSON.stringify(dl),'errors',errs.length?errs:'none','failures',bad);await b.close();process.exit(bad||errs.length?1:0)})();
