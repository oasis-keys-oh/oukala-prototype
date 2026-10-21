// PR-33 contribution anchor (docs/ia/navigation-architecture.md section f): the thread in the top bar on every screen with an
// objective anchor, each segment opens THREAD; My contribution on Home and in My work for several personas, with modeled labels,
// the formula chip and the no-rating, no-ranking rule; gaps read "Not linked to an objective"; menu anchor marks and the All screens
// filter "Serves my objectives"; all four tenants; no page errors.
// Usage: node tools/tests/contrib.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR '+String(e.message||e).slice(0,300)));
p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.CONTRIB&&window.THREAD&&window.EXE&&window.NAVX&&typeof go==='function',null,{timeout:120000});
await p.waitForTimeout(1500);
const fails=[];const add=a=>(a||[]).forEach(x=>fails.push(x));
const step=async(name,fn,arg)=>{try{return await p.evaluate(fn,arg)}catch(e){return ['THROW '+name+': '+String(e.message||e).slice(0,300)]}};

/* ---- 1. the thread on every screen: segments for an anchored screen, the gap badge otherwise ---- */
add(await step('thread',async()=>{const f=[];const w=ms=>new Promise(r=>setTimeout(r,ms));NAVX.persona.set('ops');await w(250);
 const ids=SCREENS.map(s=>s[0]);let anchored=0,gap=0;
 for(const id of ids){try{go(id)}catch(e){f.push('thread: go '+id+' throws '+e.message);continue}await w(15);
  const s=document.getElementById('tbThread');if(!s||s.hidden){f.push('thread: slot hidden on '+id);continue}
  const a=CONTRIB.anchor(id);const segs=s.querySelectorAll('.ctb-seg[data-ctb-open]').length;
  if(a.gap){gap++;if(!/Not linked to an objective/.test(s.textContent))f.push('thread: '+id+' has no anchor but shows no gap badge')}
  else{anchored++;if(segs!==a.chain.length)f.push('thread: '+id+' shows '+segs+' segments, anchor has '+a.chain.length);
   if(!s.querySelector('[data-ctb-lvl=company]'))f.push('thread: '+id+' has no Company segment');
   if(/—/.test(s.textContent))f.push('thread: em dash on '+id)}}
 if(anchored<150)f.push('thread: only '+anchored+' anchored screens');if(!gap)f.push('thread: no screen shows a gap');
 /* "your team" on a screen anchored to the viewer's own team objective, with its key result */
 go('itsm_inc');await w(60);const s=document.getElementById('tbThread');const mine=s.querySelector('.ctb-mine');
 if(!mine||!/your team/.test(mine.textContent)||!/toward/.test(mine.textContent))f.push('thread: itsm_inc for the service desk lead does not read "your team" with its key result');
 return f}));

/* ---- 2. each segment opens THREAD (the golden thread drawer) ---- */
add(await step('open',async()=>{const f=[];const w=ms=>new Promise(r=>setTimeout(r,ms));
 for(const id of ['itsm_inc','inv','ppm_proj','exe_strat','home','flw_appr']){go(id);await w(60);
  const segs=[...document.querySelectorAll('#tbThread .ctb-seg[data-ctb-open]')];if(!segs.length){f.push('open: no segment on '+id);continue}
  for(let i=0;i<segs.length;i++){const sg=document.querySelectorAll('#tbThread .ctb-seg[data-ctb-open]')[i];const t=sg.getAttribute('data-ctb-open');
   if(!t){f.push('open: '+id+' segment '+i+' has no number to open');continue}sg.click();await w(80);
   const d=document.querySelector('#drawer .thr');if(!d)f.push('open: '+id+' segment '+i+' ('+t+') did not open the thread');try{document.getElementById('drawer').hidePopover()}catch(e){}}}
 return f}));

/* ---- 3. My contribution on Home and in My work for at least five personas, by level ---- */
add(await step('card',async()=>{const f=[];const w=ms=>new Promise(r=>setTimeout(r,ms));const withPts=[];
 for(const k of ['exec','ops','pm','fin','arch','coo','portfolio','emp']){NAVX.persona.set(k);await w(250);
  for(const id of ['home','flw_appr']){go(id);await w(80);const c=document.querySelector('#view [data-ctb-card]');if(!c){f.push('card: no My contribution on '+id+' for '+k);continue}
   const t=c.textContent;if(!/My contribution/i.test(t))f.push('card: no title for '+k);
   if(!c.querySelector('.ctb-tag')||!/modeled/.test(t))f.push('card: points not labeled modeled for '+k+' on '+id);
   const r=c.querySelector('[data-ctb-rule]');if(!r||!/not a rating/i.test(r.textContent)||!/no ranking/i.test(r.textContent))f.push('card: no-rating, no-ranking rule missing for '+k+' on '+id);
   const fx=c.querySelector('.ctb-fx');const pop=fx&&document.getElementById(fx.getAttribute('popovertarget'));
   if(!pop||!/Points =/.test(pop.textContent)||!/Owner/.test(pop.textContent)||!/Target/.test(pop.textContent))f.push('card: the metric chip has no formula, owner and target for '+k);
   if(/—/.test(t))f.push('card: em dash for '+k)}
  if(CONTRIB.points().total>0)withPts.push(k);
  /* by level: an executive opens company and enterprise, a manager groups and teams, an individual their own thread */
  const lv=CONTRIB.viewer().level;const tabs=[...document.querySelectorAll('#view [data-ctb-card] [data-ctb-lv]')].map(x=>x.getAttribute('data-ctb-lv'));
  if(lv==='executive'&&tabs.join()!=='executive,manager,individual')f.push('card: executive levels '+tabs.join());
  if(lv==='manager'&&tabs.join()!=='manager,individual')f.push('card: manager levels '+tabs.join());
  if(tabs.length){const last=document.querySelector('#view [data-ctb-card] [data-ctb-lv="individual"]');last.click();await w(40);
   if(!/Your open and closed work/.test(document.querySelector('#view [data-ctb-card]').textContent))f.push('card: the individual view does not show own work for '+k)}}
 if(withPts.length<5)f.push('card: only '+withPts.length+' personas have modeled points ('+withPts.join(', ')+')');
 /* no ranking: no card lists other people's points */
 NAVX.persona.set('ops');await w(250);go('home');await w(80);const mg=document.querySelector('#view [data-ctb-card] [data-ctb-lv="manager"]');if(mg){mg.click();await w(40)}
 if(/points/.test((document.querySelector('#view [data-ctb-card] .ctb-list')||{textContent:''}).textContent.replace(/points of the company score/g,'')))f.push('card: the team view shows points per person');
 /* the anchor at the start of the thread opens the card in a drawer */
 document.querySelector('#tbThread [data-ctb-me]').click();await w(80);if(!document.querySelector('#drawer [data-ctb-card]'))f.push('card: the thread anchor does not open My contribution');try{document.getElementById('drawer').hidePopover()}catch(e){}
 return f}));

/* ---- 4. gaps read "Not linked to an objective", styled like No backup ---- */
add(await step('gaps',async()=>{const f=[];const w=ms=>new Promise(r=>setTimeout(r,ms));const g=CONTRIB.gaps();if(!g.length)return ['gaps: no screen without an anchor'];
 go(g[0]);await w(60);const b=document.querySelector('#tbThread .ctb-gapb');if(!b||b.textContent.trim()!=='Not linked to an objective'||!b.classList.contains('ownx-badge')||!b.classList.contains('warn'))f.push('gaps: the badge on '+g[0]+' is missing or not styled like No backup');
 NAVX.persona.set('emp');await w(250);go('home');await w(80);if(!document.querySelector('#view [data-ctb-card] .ctb-gapb'))f.push('gaps: a viewer whose team has no team objective sees no gap badge');
 NAVX.persona.set('ops');await w(250);return f}));

/* ---- 5. menu anchor marks and the All screens filter ---- */
add(await step('menu',async()=>{const f=[];const w=ms=>new Promise(r=>setTimeout(r,ms));NAVX.persona.set('ops');await w(250);go('home');await w(80);
 const marks=[...document.querySelectorAll('#nav .ctb-anc')];if(!marks.length)f.push('menu: no anchor mark in the rail');
 marks.forEach(m=>{const id=m.closest('[data-nav]').getAttribute('data-nav');if(!CONTRIB.serves(id))f.push('menu: mark on '+id+' which does not serve')});
 if(document.querySelectorAll('#nav [data-nav] .ctb-anc').length!==new Set(marks.map(m=>m.closest('[data-nav]'))).size)f.push('menu: more than one mark per entry');
 document.querySelector('[data-nx-all]').click();await w(150);const P=document.getElementById('nxAll');
 if(!P||!P.querySelector('[data-ctb-serve]'))f.push('menu: All screens has no "Serves my objectives" filter');
 if(P&&P.querySelector('[data-nx-all-mine]'))f.push('menu: the interim "Only my areas" filter is still shown');
 if(P&&P.querySelector('[data-ctb-serve]')){const n0=[...P.querySelectorAll('.nx-alli')].filter(x=>!x.hidden).length;P.querySelector('[data-ctb-serve]').click();await w(80);
  const vis=[...P.querySelectorAll('.nx-alli')].filter(x=>!x.hidden);if(!vis.length||vis.length>=n0)f.push('menu: the filter shows '+vis.length+' of '+n0);
  vis.forEach(x=>{if(!CONTRIB.serves(x.getAttribute('data-nav')))f.push('menu: filter keeps '+x.getAttribute('data-nav'))});
  P.querySelector('[data-ctb-serve]').click();await w(80);try{P.hidePopover()}catch(e){}}
 return f}));

/* ---- 6. every tenant: thread, card and segments read that tenant only ---- */
add(await step('tenants',async()=>{const f=[];const w=ms=>new Promise(r=>setTimeout(r,ms));NAVX.persona.set('ops');await w(250);
 const orgs=DATA.tenants().map(t=>[t.id,t.org]);
 for(const t of ['health','mining','storage','core']){TENANT.switch(t);await w(250);
  for(const id of ['home','flw_appr','itsm_inc','bud_over']){go(id);await w(80);const s=document.getElementById('tbThread');const txt=s.textContent+' '+((document.querySelector('#view [data-ctb-card]')||{}).textContent||'');
   if(!s.querySelector('.ctb-seg[data-ctb-open]')&&!s.querySelector('.ctb-gapb'))f.push(t+': no thread on '+id);
   orgs.filter(o=>o[0]!==t&&o[1]).forEach(o=>{if(txt.indexOf(o[1])>=0)f.push(t+': '+id+' shows '+o[1])});
   if((id==='home'||id==='flw_appr')&&!document.querySelector('#view [data-ctb-card]'))f.push(t+': no My contribution on '+id)}
  go('home');await w(80);const sg=document.querySelector('#tbThread .ctb-seg[data-ctb-open]');if(sg){sg.click();await w(80);if(!document.querySelector('#drawer .thr'))f.push(t+': a segment does not open the thread');try{document.getElementById('drawer').hidePopover()}catch(e){}}
  const M=CONTRIB.model();if(!M||!M.leaves.length)f.push(t+': no team objectives in the model');if(M&&M.leaves.some(n=>n.contrib!=null&&!(n.contrib>=0)))f.push(t+': a contribution is not a number')}
 return f}));

console.log('contrib checks',fails.length?'FAIL':'ok');fails.forEach(x=>console.log('  '+x));
if(errs.length){console.log('page errors',errs.length);errs.slice(0,10).forEach(x=>console.log('  '+x))}
await b.close();process.exit(fails.length||errs.length?1:0)})();
