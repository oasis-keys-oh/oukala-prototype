// Experiences test (DC-40, DC-41, DC-42): EXP.lint passes and fails a mission over 180 seconds; the Showroom home shows
// Experiences before the tours; every starter mission starts, its checkpoints fire when the test performs the actions on the
// real screens, success fires, a ripple trail is shown, the facilitator console (a second page on BroadcastChannel) receives
// the state and can nudge, skip and recover; hints and stuck detection fire; the leave-behind renders; the engagement signal
// is stored; the self-serve link starts a mission with coaching in the chat; exit restores role and tenant.
// Usage: node tools/tests/exp.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const URL0='file://'+dir+'/full.html';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});await ctx.route(/^https?:/,r=>r.abort());
const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};const ok=m=>console.log('ok  ',m);
const watch=pg=>{pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message));pg.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,200)))};
const p=await ctx.newPage();watch(p);await p.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.EXP&&EXP.missions().length>=5,null,{timeout:60000});await p.waitForTimeout(800);
const con=await ctx.newPage();watch(con);await con.goto(URL0+'?exp=console',{waitUntil:'domcontentloaded',timeout:120000});await con.waitForFunction(()=>window.EXP&&EXP.console&&EXP.console.isOn(),null,{timeout:60000});
// lint, and the 180 second rule bites
const lint=await p.evaluate(()=>EXP.lint());if(lint.length)fail('lint '+JSON.stringify(lint));else ok('lint clean, '+(await p.evaluate(()=>EXP.missions().map(m=>m.id+' '+m.clock+'s').join(', '))));
const over=await p.evaluate(()=>{const m=Object.assign({},EXP.byId('monday'),{id:'__over',clock:181});return EXP.lint([m])});
if(!over.some(x=>/__over: clock 181 s is over 180 s/.test(x)))fail('lint did not fail a 181 second mission '+JSON.stringify(over));else ok('lint fails a mission over 180 s');
if(await p.evaluate(()=>EXP.missions().some(m=>m.clock>180)))fail('a mission clock is over 180 s');
// Showroom home: Experiences first, tours under Rehearse and backup, the four sample companies when PACKGEN is absent
await p.evaluate(()=>go('showroom'));await p.waitForTimeout(500);
const home=await p.evaluate(()=>{const e=document.querySelector('#view .exp-home'),t=document.querySelector('#view .sr-backup');return{exp:!!e,tours:!!t,first:!!(e&&t&&(e.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING)),cos:document.querySelectorAll('#view [data-exp-ten]').length,pg:!!window.PACKGEN,bring:!!document.querySelector('[data-exp-bring]'),cards:document.querySelectorAll('#view [data-exp-card]').length}});
if(!home.exp||!home.tours||!home.first)fail('home order '+JSON.stringify(home));if(!home.pg&&home.cos<4)fail('home companies '+JSON.stringify(home));if(home.pg&&!home.bring)fail('PACKGEN present but no Bring your company');if(home.cards<1)fail('no mission cards');ok('home '+JSON.stringify(home));
await p.click('[data-exp-role="coo"]');await p.waitForTimeout(300);const cooCards=await p.evaluate(()=>[...document.querySelectorAll('#view [data-exp-card]')].map(x=>x.dataset.expCard));if(cooCards.indexOf('coo_journey')<0||cooCards.indexOf('monday')<0)fail('COO cards '+cooCards);
const start0=await p.evaluate(()=>({persona:S.persona,tenant:DATA.tenant()}));
const conState=()=>con.evaluate(()=>{const s=EXP.console.state();return s&&s.st?{mission:s.mission,cp:s.checkpoint,screen:s.screen,elapsed:s.elapsed,done:s.st.done,success:s.st.success,ripple:!!s.lastRipple}:null});
const settle=ms=>p.waitForTimeout(ms||700);
const press=async t=>p.evaluate(t=>{const b=[...document.querySelectorAll('#view .views button,#view [role=tab],#view button')].find(x=>x.textContent.trim().startsWith(t));if(b)b.click();return !!b},t);
// the five missions, each driven the way a buyer would
const RUN={
 cfo_invoice:async()=>{await p.evaluate(()=>go('inv'));await settle();const id=await p.evaluate(()=>EXP.current().ctx.inv);await p.click('#view [data-invpick="'+id+'"]');await settle();
  await press('Where it connects');await settle();await p.click('#view [data-decide="On hold"]');await settle(1200)},
 coo_journey:async()=>{await p.evaluate(()=>go('ppl_jrny'));await settle();await p.click('#view [data-pp2-act="jopen"]');await settle(1500);
  await p.click('#view [data-sr-fix^="journey|"]');await settle(1800);await p.evaluate(()=>{STUDIO.fast=true;const a=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Auto');if(a)a.click()});
  await p.waitForFunction(()=>EXP.state().success,null,{timeout:30000}).catch(()=>{})},
 ciso_agent:async()=>{await p.evaluate(()=>go('r15_iam'));await settle();await press('Access requests');await settle();await p.click('#view [data-r3i-no="AR-0031"]');await settle(1000);
  await p.evaluate(()=>{try{closeDrawer()}catch(e){}go('guard')});await settle();await press('Try to break it');await settle();await p.click('#view [data-gd-try="restricted"]');await settle(1200)},
 cio_clash:async()=>{await p.evaluate(()=>go('itsm_rel'));await settle();const id=await p.evaluate(()=>EXP.current().ctx.rel);await p.locator('#view [data-rel-open="'+id+'"]').locator('visible=true').first().click();await settle(1000);
  await p.locator('[data-rel-move^="'+id+'"]').locator('visible=true').last().click();await settle(2500)},
 break_it:async()=>{await p.evaluate(()=>go('guard'));await settle();await p.evaluate(()=>EXP.current().m.checkpoints.forEach(c=>{try{GUARD.attempt(c.id)}catch(e){}}));await settle(1500)},
 two_seats:async()=>{await p.evaluate(()=>{if(!SEATS.role())SEATS.pick('cfo');const ch=new BroadcastChannel('falconaire-seats'); /* acts as the other window */
  ch.postMessage({v:1,id:'test-other-seat',type:'hello',role:'coo',tenant:'core'});
  setTimeout(()=>ch.postMessage({v:1,id:'test-other-seat',type:'audit',role:'coo',tenant:'core',entry:{a:'approved budget request',d:'BL-012 moved $12,000',s:'bud_req'},num:'$12,000'}),300)});await settle(2000)},
 monday:async()=>{await p.evaluate(()=>go('inbox'));await settle();await p.evaluate(()=>{const it=INBOX.items().sort((a,b)=>(b.sim?1:0)-(a.sim?1:0));for(const x of it){const r=INBOX.decide(x.id,'approve',{note:'experience test'});if(r.ok)break}INBOX.flush()});await settle(1500)}};
const ROLE={break_it:'ciso',two_seats:'cfo',cfo_invoice:'cfo',coo_journey:'coo',ciso_agent:'ciso',cio_clash:'cio',monday:'chro'};
const TEN={break_it:'core',two_seats:'core',cfo_invoice:'health',coo_journey:'storage',ciso_agent:'core',cio_clash:'mining',monday:'core'};
for(const id of await p.evaluate(()=>EXP.missions().map(m=>m.id))){const n0=errs.length;
 if(!RUN[id]){fail('no test driver for mission '+id);continue}
 const ev=await p.evaluate(([id,role,ten])=>{window.__ev=[];['checkpoint','ripple','success'].forEach(k=>EXP.on(k,d=>window.__ev.push(k)));return EXP.start(id,{role,tenant:ten,mode:'facilitated'})},[id,ROLE[id],TEN[id]]);
 if(!ev){fail(id+' did not start');continue}await settle(1600);
 const s0=await conState();if(!s0||s0.mission!==id)fail(id+' console did not receive the state '+JSON.stringify(s0));
 const meta=await p.evaluate(t=>({ran:EXP.state().ranOn,need:EXP.needsCore(EXP.current().m,t),ten:DATA.tenant(),hud:!!document.querySelector('#expHud .exp-cps')}),TEN[id]);
 if(!meta.hud)fail(id+' no mission card');if(meta.ten!==meta.ran)fail(id+' tenant '+JSON.stringify(meta));if(!meta.need&&meta.ran!==TEN[id])fail(id+' a tenant-aware mission left the chosen company '+JSON.stringify(meta));
 await RUN[id]();
 const r=await p.evaluate(()=>{const s=EXP.state(),m=EXP.current().m,tr=document.getElementById('expTrail');return{done:s.done,all:m.checkpoints.map(c=>c.id),success:s.success,ripples:s.ripples.length,trail:!!(tr&&!tr.hidden&&tr.querySelectorAll('.exp-tn').length>=2),modeled:!!(tr&&/Modeled/.test(tr.textContent)),ev:window.__ev,claims:s.claims.length}});
 const missing=r.all.filter(x=>r.done.indexOf(x)<0);if(missing.length)fail(id+' checkpoints did not fire: '+missing.join(', '));
 if(!r.success)fail(id+' success did not fire');if(!r.ripples||!r.trail||!r.modeled)fail(id+' ripple trail '+JSON.stringify(r));
 if(r.claims!==r.all.length)fail(id+' claims '+r.claims+' for '+r.all.length+' checkpoints');
 await con.waitForTimeout(1600);const s1=await conState();if(!s1||!s1.success||!s1.ripple)fail(id+' console after success '+JSON.stringify(s1));
 const story=await p.evaluate(()=>{const h=EXP.story();EXP.openStory();const sh=document.getElementById('expStory');const out={len:h.length,title:h.indexOf(EXP.current().m.title)>=0,moved:/What moved/.test(h),sim:/Simulated/.test(h),sheet:!!(sh&&!sh.hidden)};sh.querySelector('[data-exp-story="close"]').click();return out});
 if(!story.title||!story.moved||!story.sim||!story.sheet)fail(id+' story '+JSON.stringify(story));
 await p.evaluate(()=>EXP.stop());await settle(600);
 const back=await p.evaluate(()=>({persona:S.persona,tenant:DATA.tenant(),hud:!!document.getElementById('expHud')}));if(back.persona!==start0.persona||back.tenant!==start0.tenant||back.hud)fail(id+' stop did not restore '+JSON.stringify(back));
 if(errs.length>n0)fail(id+' errors '+errs.slice(n0).join(' | '));
 console.log(id,(r.success?'success':'NO SUCCESS'),r.done.length+'/'+r.all.length,'checkpoints, ripple',r.trail,'on',meta.ran)}
// console controls: nudge, skip, recover; hints and stuck detection (timings shortened for the test only)
await p.evaluate(()=>{EXP.STUCK=3;EXP.hintScale=0.05;EXP.start('cio_clash',{role:'cio',mode:'facilitated'})});await settle(1500);
await con.waitForTimeout(1600);await con.click('[data-exp-con="nudge"]');await settle(500);
const nd=await p.evaluate(()=>/Nudge:/.test((document.getElementById('expHud')||{}).textContent||''));if(!nd)fail('console nudge did not reach the buyer');
await p.waitForFunction(()=>EXP.state().stuck,null,{timeout:10000}).catch(()=>{});const stk=await p.evaluate(()=>({stuck:EXP.state().stuck,hints:EXP.state().hints.length}));
if(!stk.stuck)fail('stuck detection did not fire');if(!stk.hints)fail('hint did not fire');
await con.waitForTimeout(1600);const cs=await con.evaluate(()=>!!document.querySelector('#expCon .exp-stuck'));if(!cs)fail('console does not show the stuck buyer');
await con.click('[data-exp-con="recover"]');await settle(1200);const rec=await p.evaluate(()=>S.screen);if(rec!=='itsm_rel')fail('recover went to '+rec);
await con.click('[data-exp-con="skip"]');await settle(500);const sk=await p.evaluate(()=>EXP.state().checkpoints);if(!sk.some(c=>c.done&&c.skipped))fail('skip '+JSON.stringify(sk));
await p.evaluate(()=>{EXP.stop({stay:true});EXP.STUCK=40;EXP.hintScale=1});ok('console nudge, stuck, recover and skip');
// engagement signal
const ss=await p.evaluate(()=>{const L=U.store.get('exp.sessions',[]);return{n:L.length,fin:L.filter(x=>x.finished).length,ms:[...new Set(L.map(x=>x.mission))].length}});
if(ss.n<6||ss.fin<5||ss.ms<5)fail('sessions '+JSON.stringify(ss));else ok('exp.sessions '+JSON.stringify(ss));
// self-serve link: starts on its own, coaches in the chat
const self=await ctx.newPage();watch(self);await self.goto(URL0+'?exp=monday&mode=self&role=cfo&tenant=storage',{waitUntil:'domcontentloaded',timeout:120000});
await self.waitForFunction(()=>window.EXP&&EXP.state().running,null,{timeout:30000}).catch(()=>{});
await self.evaluate(()=>{EXP.hintScale=0.05});await self.waitForTimeout(2500);
const sf=await self.evaluate(()=>{const s=EXP.state();const th=(CHATX.ST.threads||[]).find(t=>/^Coach: /.test(t.title));return{run:s.running,mode:s.mode,role:s.role,company:s.company,hud:!!document.getElementById('expHud'),hints:s.hints.length,chat:!!(th&&th.msgs.length),hudHint:/Hint:/.test(document.getElementById('expHud').textContent)}});
if(!sf.run||sf.mode!=='self'||sf.role!=='cfo'||sf.company!=='storage'||!sf.hud||!sf.hints||!sf.chat||!sf.hudHint)fail('self-serve link '+JSON.stringify(sf));else ok('self-serve link '+JSON.stringify(sf));
await b.close();
if(errs.length)console.log('page errors:',errs.slice(0,8));
console.log(bad?'exp: '+bad+' failure'+(bad>1?'s':''):'exp: all passed');process.exit(bad?1:0)})();
