// CxO simplified Home test (PR-106, PR-103, PR-108, revised by PR-111 on Omar's 2026-11-17 feedback). COO and CFO, top to bottom:
//   1. the original hero with its three metric tiles, "Choose what matters to you" and "What should I look at first?", outside Show details;
//   2. "Your top three decisions" directly under the hero: one row each with title and requester/amount on the left and fixed Risk,
//      Time left and action columns on the right (they line up across rows), no Prototype fact label, All decisions (n), ranked by
//      due date then value, Approve only where the inbox item allows it;
//   3. "Three to watch" as metric panels in the hero tile's family (value, trend, status pill, data-state label, Trace), built from
//      the role's "What you care about" topics and ranked off target first;
//   4. Show details folding the rest of the old Home in its old order (role pins, My contribution, topics, ...). There is no "Your three
//      numbers" band and no contribution band or card on the Home face.
// Also: the first view at 1440 x 900 shows the hero and the top of the decisions, with the design fonts and with wide fallback fonts
// (Verdana and Times forced); no clipped text; one target per metric (PR-103); owners and backups are in the data layer and in the
// trace (PR-108); no real vendor names; no horizontal scroll at 400 px light and dark; other personas keep the old Home.
// Usage: node tools/tests/cxo_home.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const URL0='file://'+dir+'/full.html';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};const ok=m=>console.log('ok  ',m);const errs=[];
// the earlier proxy for a Linux runner without the design fonts: wider sans and serif fallbacks forced on the page
const FALLBACK='body,button,input,select,textarea,.btn,.pill{font-family:Verdana,sans-serif!important}:root:root{--serif:"Times New Roman",Times,serif!important}';
async function open(w,h,scheme,fb){const ctx=await b.newContext({viewport:{width:w,height:h},colorScheme:scheme||'light'});await ctx.route(/^https?:/,r=>r.abort());
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,200)));
 await p.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.EXP&&window.TRACKS&&window.R21H&&window.CXOHOME,null,{timeout:60000});await p.waitForTimeout(800);
 if(fb)await p.addStyleTag({content:FALLBACK});return p}
const home=async(p,k)=>{await p.evaluate(k=>{NAVX.persona.set(k);go('home')},k);
 await p.waitForFunction(k=>{const n=Math.min(3,R21H.decisions(k).length);return document.querySelectorAll('#view .cxo-dec').length===n&&document.querySelectorAll('#view .cxo-watch').length===3},k,{timeout:15000}).catch(()=>{});await p.waitForTimeout(3000)};
const VENDOR=/Contoso|Azure|Lumen|Teams|Copilot|Entra|Claude|GPT|WorldCC|SolarWinds|Project Online/;
const LABEL=/^(Modeled|Simulated|Prototype fact|Hypothesis)$/;

// layout and content checks for one persona on one page; mode names the font set in messages
async function checkHome(p,k,mode,full){
 const t=k+' '+mode+': ';
 const R=await p.evaluate(()=>{const h=document.querySelector('#view .cxo-home');if(!h)return null;
  const det=h.querySelector('.cxo-details');const vh=innerHeight;
  const order=[...h.children].filter(c=>!/stn-chip/.test(c.className)).map(c=>c.matches('.r21-hero')?'hero':c.matches('.cxo-band')?c.getAttribute('aria-labelledby'):c.matches('.cxo-details')?'details':c.className);
  const hero=h.querySelector(':scope > .r21-hero');const dband=h.querySelector('.cxo-band[aria-labelledby="cxo-d"]');
  const hb=hero&&hero.getBoundingClientRect(),dh=dband&&dband.querySelector('h2').getBoundingClientRect(),row=h.querySelector('.cxo-dec'),rb=row&&row.getBoundingClientRect();
  const bandTxt=[...h.querySelectorAll(':scope > .cxo-band')].map(c=>c.innerText).join(' ').replace(/\s+/g,' ');
  const ctl=[...h.querySelectorAll(':scope > .cxo-band')].reduce((n,c)=>n+c.querySelectorAll('button,a[href],select,input,[role=button]').length,0);
  const heroTiles=[...h.querySelectorAll(':scope > .r21-hero .r21-top .r21-tile')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
  const heroCtl=hero?[...hero.querySelectorAll('[data-r21-cus],[data-ask]')].map(x=>x.textContent.trim()):[];
  return{k:h.dataset.cxoHome,order,heroTop:hb&&Math.round(hb.top),heroBottom:hb&&Math.round(hb.bottom),decHeadTop:dh&&Math.round(dh.top),rowTop:rb&&Math.round(rb.top),rowBottom:rb&&Math.round(rb.bottom),vh,
   heroInDet:!!det.querySelector('.r21-hero'),numbersBand:!!h.querySelector('.cxo-band[aria-labelledby="cxo-n"]'),bandHeads:[...h.querySelectorAll('.cxo-band h2')].map(x=>x.textContent),
   bandTxt,words:bandTxt.split(' ').length,ctl,heroTiles,heroCtl,detOpen:det.open,scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth,
   proto:/Prototype fact/i.test(bandTxt),contribOnFace:/points of the company score|Your work this quarter|My contribution/i.test([...h.children].filter(c=>!c.matches('.cxo-details')).map(c=>c.innerText).join(' '))||!!h.querySelector(':scope > .ctb-card,:scope > .cxo-contrib,[data-cxo-contrib]')}});
 if(!R){fail(t+'no cxo home');return null}
 if(R.order.join()!=='hero,cxo-d,cxo-w,details')fail(t+'structure order '+R.order);else ok(t+'order hero, decisions, watch panels, details');
 if(R.heroInDet)fail(t+'hero is inside Show details');
 if(R.numbersBand||R.bandHeads.join()!=='Your top three decisions,Three to watch')fail(t+'bands '+R.bandHeads);else ok(t+'no Your three numbers band');
 if(R.heroTiles.length!==3||R.heroTiles.some(x=>!/(Modeled|Simulated)/.test(x)))fail(t+'hero tiles '+JSON.stringify(R.heroTiles));else ok(t+'hero keeps its three labeled metric tiles');
 if(R.heroCtl.join('|')!=='Choose what matters to you|What should I look at first?')fail(t+'hero controls '+R.heroCtl);else ok(t+'hero keeps Choose what matters to you and What should I look at first?');
 if(full){if(!(R.heroTop<R.vh&&R.heroBottom>0&&R.decHeadTop<R.vh&&R.rowTop<R.vh))fail(t+'first view shows no hero plus top of decisions '+JSON.stringify({hb:R.heroBottom,dh:R.decHeadTop,row:R.rowTop,vh:R.vh}));
  else ok(t+'first view shows the hero and the top of the decisions (decisions start at '+R.decHeadTop+' of '+R.vh+')')}
 if(R.proto)fail(t+'Prototype fact label is still in the bands');else ok(t+'no Prototype fact label');
 if(R.contribOnFace)fail(t+'contribution band or card on the Home face');else ok(t+'no contribution band or card on the Home face');
 if(R.words>200)fail(t+'bands have '+R.words+' words');if(R.ctl>20)fail(t+'bands have '+R.ctl+' controls');
 if(VENDOR.test(R.bandTxt))fail(t+'vendor or product name in the bands: '+R.bandTxt.match(VENDOR)[0]);else ok(t+'no real vendor or product names in the bands');
 if(R.detOpen)fail(t+'Show details starts open');
 if(R.scrollW>R.clientW+1)fail(t+'horizontal scroll');
 // no clipped text: every text-bearing cell fits inside its card and nothing is cut off
 const C=await p.evaluate(()=>{const out=[];document.querySelectorAll('#view .cxo-dec,#view .cxo-watch').forEach(card=>{const cb=card.getBoundingClientRect();
   card.querySelectorAll('.cxo-dh,.cxo-dm,.cxo-dm span,.pill,.btn,.cxo-tl,.cxo-tv,.cxo-trd,.cxo-tt,.cxo-lab').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width)return;
    const clip=getComputedStyle(e).overflow!=='visible';const cut=clip&&(e.scrollWidth>e.clientWidth+1||(e.scrollHeight>e.clientHeight+1&&!e.classList.contains('cxo-tl')));
    const tl=e.classList.contains('cxo-tl')&&e.scrollHeight>e.clientHeight+2;
    if(cut||tl||r.right>cb.right+1||r.left<cb.left-1)out.push((card.dataset.cxoDec||card.dataset.cxoWid)+' '+e.className+' '+e.textContent.trim().slice(0,30))})});return out});
 if(C.length)fail(t+'clipped or overflowing text '+JSON.stringify(C.slice(0,4)));else ok(t+'no clipped text');
 return R}

const p=await open(1440,900);
for(const k of ['coo','cfo']){
 await home(p,k);
 const R=await checkHome(p,k,'design fonts',true);if(!R)continue;
 // decisions: columns, ranked by due then value; Approve only where the inbox item allows it; Review opens the item; All decisions (n)
 const D=await p.evaluate(k=>{const items=INBOX.items(),mine=R21H.decisions(k);const heads=[...document.querySelectorAll('.cxo-dcols span')].map(e=>e.textContent.trim());
  const rows=[...document.querySelectorAll('#view .cxo-dec')].map(e=>{const id=e.dataset.cxoDec,it=items.find(x=>x.id===id);const rb=e.getBoundingClientRect();
   const x=s=>{const n=e.querySelector(s);if(!n)return null;const r=n.getBoundingClientRect();return Math.round(r.left)};
   const acts=e.querySelector('.cxo-da').getBoundingClientRect();
   return{id,due:it?it.dueH:null,amt:it?it.amt:null,inSet:mine.some(m=>m.id===id),can:!!(it&&it.kind==='approval'&&it.can&&it.can.approve),approve:!!e.querySelector('[data-inbx-act="approve"]'),review:!!e.querySelector('[data-inbx-item]'),
    title:x('.cxo-dh'),risk:x('.cxo-dr .pill'),time:x('.cxo-dw .pill'),actR:Math.round(acts.right),riskTxt:(e.querySelector('.cxo-dr')||{}).textContent,timeTxt:(e.querySelector('.cxo-dw')||{}).textContent,
    meta:(e.querySelector('.cxo-dm')||{}).textContent,labs:e.querySelectorAll('.cxo-lab').length,rowRight:Math.round(rb.right)}});
  const all=document.querySelector('.cxo-all');return{heads,rows,all:all&&all.textContent.trim(),n:mine.length,hdr:(()=>{const hd=document.querySelector('.cxo-dcols');if(!hd)return null;const s=[...hd.children].map(c=>Math.round(c.getBoundingClientRect().left));return s})()}},k);
 if(D.heads.join()!=='Decision,Risk,Time left,')fail(k+' column headings '+D.heads);else ok(k+' decision columns: '+D.heads.filter(Boolean).join(', '));
 if(D.rows.length!==Math.min(3,D.n))fail(k+' decision rows '+D.rows.length+' of '+D.n);
 if(D.all!=='All decisions ('+D.n+')')fail(k+' All decisions control '+D.all);else ok(k+' '+D.all);
 for(let i=1;i<D.rows.length;i++){const a=D.rows[i-1],c=D.rows[i];if((a.due==null?1e9:a.due)>(c.due==null?1e9:c.due)||((a.due==c.due)&&(a.amt||0)<(c.amt||0)))fail(k+' decisions not ranked by due then value '+JSON.stringify(D.rows))}
 D.rows.forEach(d=>{if(!d.inSet)fail(k+' decision '+d.id+' is not one the persona may decide');if(d.can!==d.approve)fail(k+' Approve button mismatch for '+d.id);if(!d.review)fail(k+' no Review on '+d.id);
  if(!/risk$/.test(d.riskTxt||'')||!d.timeTxt||!d.meta||d.labs)fail(k+' row content '+JSON.stringify(d))});
 ok(k+' decisions ranked, permitted, Review and Approve '+D.rows.map(d=>d.approve?'A':'-').join(''));
 // fixed column positions: risk, time left and the action edge line up across rows, and sit to the right of the title
 const same=f=>new Set(D.rows.map(f)).size===1;
 if(!same(d=>d.risk)||!same(d=>d.time)||!same(d=>d.actR)||!same(d=>d.title)||D.rows.some(d=>!(d.title<d.risk&&d.risk<d.time&&d.time<d.actR)))fail(k+' columns do not line up '+JSON.stringify(D.rows.map(d=>[d.title,d.risk,d.time,d.actR])));
 else ok(k+' risk, time left and actions line up across rows (risk x '+D.rows[0].risk+', time x '+D.rows[0].time+')');
 if(D.hdr&&D.rows.length&&(Math.abs(D.hdr[1]-D.rows[0].risk)>12||Math.abs(D.hdr[2]-D.rows[0].time)>12))fail(k+' column headings not over their columns '+JSON.stringify([D.hdr,D.rows[0].risk,D.rows[0].time]));
 // Review opens the item
 if(D.rows.length){await p.click('.cxo-dec [data-inbx-item]');await p.waitForTimeout(500);const o=await p.evaluate(()=>!!document.querySelector('#drawer:popover-open, #drawer.open, .inbx-detail, [popover]:popover-open'));if(!o)fail(k+' Review opened nothing');else ok(k+' Review opens the item');await p.keyboard.press('Escape');await p.waitForTimeout(200)}
 // watch panels: value, trend, status pill, data-state label, Trace; ranked from What you care about, off target first
 const W=await p.evaluate(k=>{const ranks=s=>s==='good'?0:s==='warn'?1:2;const hero=R21H.effTop(k).map(t=>t[0]);
  const cand=[];R21H.care(k).forEach(c=>[c.p.lead].concat(c.p.rows||[]).forEach(id=>{if(id&&cand.indexOf(id)<0&&hero.indexOf(id)<0&&METRICS[id])cand.push(id)}));
  const sev=id=>ranks(mstat(METRICS[id]));
  const ps=[...document.querySelectorAll('#view .cxo-watch')].map(e=>{const id=e.dataset.cxoWid,m=METRICS[id];return{id,head:e.querySelector('.cxo-tl').textContent,val:(e.querySelector('.cxo-tv')||{}).textContent,trend:!!e.querySelector('.cxo-trd'),pill:(e.querySelector('.pill')||{}).textContent,
    labs:[...e.querySelectorAll('.cxo-lab')].map(x=>x.textContent.trim()),spark:!!e.querySelector('svg'),trace:!!e.querySelector('[data-r21-met="'+id+'"]'),sev:sev(id),
    serif:getComputedStyle(e.querySelector('.cxo-tv')).fontFamily===getComputedStyle(document.querySelector('.r21-tile .r21-tv')).fontFamily,exp:m?mfmt(m):null}});
  const shown=ps.map(x=>x.id),rest=cand.filter(id=>shown.indexOf(id)<0);
  return{ps,cand,shown,minShown:Math.min(...ps.map(x=>x.sev)),maxRest:rest.length?Math.max(...rest.map(sev)):-1,nonRatio:ps.map(x=>x.sev)}},k);
 if(W.ps.length!==3||new Set(W.shown).size!==3)fail(k+' watch panels '+JSON.stringify(W.shown));
 W.ps.forEach(x=>{if(!x.val||x.val!==x.exp||!x.pill||!x.trend||!x.spark||!x.trace||x.labs.length!==1||!LABEL.test(x.labs[0])||!x.serif)fail(k+' watch panel '+JSON.stringify(x))});
 ok(k+' watch panels carry value, trend, status pill, label and Trace: '+W.ps.map(x=>x.head+' '+x.val+' '+x.pill).join(' | '));
 if(W.shown.some(id=>W.cand.indexOf(id)<0))fail(k+' a watch panel is not one of the role care metrics '+JSON.stringify(W));
 if(W.maxRest>W.minShown)fail(k+' an off-target care metric was passed over '+JSON.stringify(W));else ok(k+' watch panels come from What you care about, off target first (severities '+W.nonRatio+')');
 // Trace opens the metric trace with its owner
 await p.click('#view .cxo-watch [data-r21-met]');await p.waitForTimeout(500);
 const Tr=await p.evaluate(()=>{const e=document.querySelector('#r21MetPop:popover-open');return e?e.innerText.replace(/\s+/g,' '):null});if(!Tr||!/Owner:/.test(Tr))fail(k+' watch Trace '+Tr);else ok(k+' watch Trace opens the metric trace');await p.keyboard.press('Escape');await p.waitForTimeout(200);
 // Show details restores the rest in the old order; the contribution card is there, not on the face
 const S1=await p.evaluate(()=>{const d=document.querySelector('.cxo-details');const sel=['.nx-hpins','.ctb-card','.r21-cg','.r21-dg','.r21-more'];
  const idx=sel.map(s=>{const e=d.querySelector(s);return e?[...d.querySelectorAll('*')].indexOf(e):-1});const c=d.querySelector('.ctb-card');
  return{idx,inDet:sel.map(s=>!!d.querySelector(s)),outside:!!document.querySelector('.cxo-home > .ctb-card, .cxo-home > .nx-hpins'),hiddenClosed:!c||!c.checkVisibility()}});
 if(S1.inDet.some(x=>!x)||S1.outside||S1.idx.some((v,i)=>i&&v<S1.idx[i-1])||!S1.hiddenClosed)fail(k+' details sections '+JSON.stringify(S1));else ok(k+' Show details keeps role pins, contribution card, topics, decisions and the rest in order (card folded away)');
 await p.evaluate(()=>{const d=document.querySelector('.cxo-details');d.open=true});await p.waitForTimeout(300);
 const O=await p.evaluate(()=>{const c=document.querySelector('.cxo-details .ctb-card');return c&&c.checkVisibility()});if(!O)fail(k+' contribution card not reachable in Show details');else ok(k+' contribution card is reachable once details are open');
 await p.evaluate(()=>{document.querySelector('.cxo-details').open=false});
}
// What you care about drives the watch panels: choose other topics and the panels follow
await home(p,'coo');
const Cus=await p.evaluate(async()=>{const before=[...document.querySelectorAll('#view .cxo-watch')].map(e=>e.dataset.cxoWid);
 const cur=U.store.get('oukala.r21.cus.v2',{})||{};cur.coo={top:R21H.profiles.coo.top.map(t=>t[0]),care:['budget','capital']};U.store.set('oukala.r21.cus.v2',cur);go('home');await new Promise(r=>setTimeout(r,1200));
 const shown=[...document.querySelectorAll('#view .cxo-watch')].map(e=>e.dataset.cxoWid);const allowed=['m_budvar','m_fin_variance','m_budgetburn','m_capex','m_fin_headroom','m_fin_capital'];
 U.store.set('oukala.r21.cus.v2',{});go('home');await new Promise(r=>setTimeout(r,800));return{before,shown,allowed}});
if(Cus.shown.length!==3||Cus.shown.some(id=>Cus.allowed.indexOf(id)<0)||Cus.shown.join()===Cus.before.join())fail('watch panels did not follow the chosen topics '+JSON.stringify(Cus));else ok('watch panels follow What you care about (chose budget and capital: '+Cus.shown.join(', ')+')');
// CFO: PR-103 one target per metric, labeled hero tiles; PR-108 owner and a different backup (data layer and trace)
await home(p,'cfo');
const C=await p.evaluate(()=>{const d=document.querySelector('.cxo-details');d.open=true;const t=document.getElementById('view').innerText.replace(/\s+/g,' ');
 const hero=[...document.querySelectorAll('.r21-top .r21-tile')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
 return{tg:[METRICS.m_budvar.tgt,METRICS.m_spend_var.tgt],hero,kp:PERSONAS.cfo.kpis,shareOf100:/Forecast as share of approved budget[^A-Z]*target at most 100%/.test(t),targets:[...t.matchAll(/(Forecast (?:variance to approved budget|against approved|vs approved budget)|Enterprise forecast against approved)[^%]*?%[^%]*?target (?:at most|≤) ([\d.]+)/g)].map(m=>m[2])}});
if(C.tg.join()!=='3,3')fail('forecast targets '+C.tg);
if(C.targets.some(x=>x!=='3'))fail('forecast target on the page is not 3 percent: '+C.targets);else ok('forecast against approved: one target (at most 3%) '+JSON.stringify(C.targets));
if(C.shareOf100||C.kp.indexOf('m_burn')>=0)fail('health strip still carries the 100 percent forecast target '+C.kp);
if(C.hero.length!==3||C.hero.some(h=>!/(Modeled|Simulated)/.test(h)))fail('hero tiles unlabeled '+JSON.stringify(C.hero));else ok('hero tiles labeled '+C.hero.map(h=>h.slice(0,40)).join(' | '));
await p.evaluate(()=>{document.querySelector('.cxo-details').open=false});
const OW={m_budvar:['Tomas Alvarez','Avery Chen'],m_biz_close:['Avery Chen','Renee Lindqvist'],m_mwls:['Renee Lindqvist','Avery Chen']};
const O2=await p.evaluate(async()=>{const o={};for(const id of ['m_budvar','m_biz_close','m_mwls']){const m=METRICS[id];R21H.openMet(id);await new Promise(r=>setTimeout(r,300));const e=document.querySelector('#r21MetPop');o[id]={own:m.owner,bak:m.bak,trace:e?e.innerText:''};try{e.hidePopover()}catch(x){}}return o});
Object.keys(OW).forEach(id=>{const w=OW[id],r=O2[id];if(r.own!==w[0]||r.bak!==w[1]||w[0]===w[1]||r.trace.indexOf(w[0])<0)fail('owner and backup on '+id+' '+JSON.stringify({own:r.own,bak:r.bak}))});ok('CFO and COO numbers keep an owner and a different backup in the data layer; the trace names the owner');
const P=await p.evaluate(async()=>{const o={};for(const n of ['Tomas Alvarez','Renee Lindqvist']){const r=who(n);o[n]={rec:!!r,mgr:r&&r.mgr,role:r&&r.role,team:r&&r.team};person360(n);await new Promise(r=>setTimeout(r,500));o[n].drawer=(document.getElementById('drawer')||{innerText:''}).innerText.indexOf(n)>=0;try{closeDrawer()}catch(e){}}
 return o}).catch(e=>({err:String(e)}));
['Tomas Alvarez','Renee Lindqvist'].forEach(n=>{const r=P[n];if(!r||!r.rec||r.mgr!=='Marcus Reid'||r.team!=='Finance'||!r.drawer)fail('Person 360 for '+n+' '+JSON.stringify(r))});ok('both new Finance people resolve, report to Marcus Reid and open in Person 360');
// COO: the hero tiles open the tracks (the MWLS track is not built, so that tile starts nothing)
await home(p,'coo');
const Q=await p.evaluate(()=>({trk:[...document.querySelectorAll('.r21-top .r21-tile[data-trk-open]')].map(x=>x.dataset.trkOpen)}));
if(Q.trk.join()!=='cost,strat,mw')fail('COO hero tiles open tracks '+Q.trk);else ok('COO hero tiles open cost, strat and mw');
await p.click('#view [data-trk-open="mw"]');await p.waitForTimeout(500);
const Z=await p.evaluate(()=>({cur:TRACKS.current(),bar:!!document.getElementById('trkBar')}));if(Z.cur||Z.bar)fail('MWLS tile '+JSON.stringify(Z));else ok('MWLS hero tile starts no track');
// other personas keep the old Home
await home(p,'ceo');if(await p.evaluate(()=>!!document.querySelector('#view .cxo-home')))fail('CEO Home was replaced (phase 2)');else ok('CEO Home unchanged in phase 1');
await p.context().close();
// wide fallback fonts: the same structure and first view with Verdana and Times forced, 1440 x 900 and 1280 x 720
for(const [w,h] of [[1440,900],[1280,720]]){const f=await open(w,h,'light',true);for(const k of ['coo','cfo']){await home(f,k);await checkHome(f,k,'fallback fonts '+w+'x'+h,true)}await f.context().close()}
// 400 px: no horizontal scroll or clipping, light and dark, with the design fonts and the fallback fonts
for(const fb of [false,true])for(const sch of ['light','dark']){const m=await open(400,860,sch,fb);for(const k of ['coo','cfo']){await home(m,k);
 const r=await m.evaluate(k=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,d:document.querySelectorAll('#view .cxo-dec').length,w:document.querySelectorAll('#view .cxo-watch').length,n:Math.min(3,R21H.decisions(k).length)}),k);
 if(r.sw>r.cw+1||r.d!==r.n||r.w!==3)fail('400px '+sch+(fb?' fallback ':' ')+k+' '+JSON.stringify(r));else ok('400px '+sch+(fb?' fallback ':' ')+k+' no horizontal scroll');
 await checkHome(m,k,'400px '+sch+(fb?' fallback':''),false)}await m.context().close()}
if(errs.length){bad++;console.log('FAIL page errors',errs.slice(0,5))}
await b.close();console.log(bad?'cxo_home: '+bad+' FAILED':'cxo_home: all passed');process.exit(bad?1:0)})();
