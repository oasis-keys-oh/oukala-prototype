// CxO simplified Home test (PR-106 phase 1, PR-103, PR-108): COO and CFO show three bands of three (numbers, decisions, to watch)
// that fit a 1440 x 900 first view in at most 300 words and 30 controls; every tile and row carries a data-state label (R29);
// one target per metric (forecast against approved is at most 3 percent in the hero, the bands, What you care about and the health
// strip); no real vendor or product names in the bands; decisions are ranked by due date then value and Approve appears only where
// the item allows it; Show details restores every earlier section; the CFO numbers have an owner and a different backup (PR-108)
// and both new Finance people open in Person 360; no horizontal scroll at 400 px; other personas keep the old Home.
// Usage: node tools/tests/cxo_home.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const URL0='file://'+dir+'/full.html';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};const ok=m=>console.log('ok  ',m);const errs=[];
async function open(w,h,scheme){const ctx=await b.newContext({viewport:{width:w,height:h},colorScheme:scheme||'light'});await ctx.route(/^https?:/,r=>r.abort());
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,200)));
 await p.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.EXP&&window.TRACKS&&window.R21H&&window.CXOHOME,null,{timeout:60000});await p.waitForTimeout(800);return p}
const home=async(p,k)=>{await p.evaluate(k=>{NAVX.persona.set(k);go('home')},k);
 await p.waitForFunction(()=>document.querySelectorAll('#view .cxo-dec').length===3,null,{timeout:15000}).catch(()=>{});await p.waitForTimeout(500)};
const p=await open(1440,900);
const VENDOR=/Contoso|Azure|Lumen|Teams|Copilot|Entra|Claude|GPT|WorldCC|SolarWinds|Project Online/;
const LABEL=/^(Modeled|Simulated|Prototype fact|Hypothesis)$/;
for(const k of ['coo','cfo']){
 await home(p,k);
 const R=await p.evaluate(()=>{const h=document.querySelector('#view .cxo-home');if(!h)return null;
  const vis=[...h.children].filter(c=>c.tagName!=='DETAILS'&&!/stn-chip/.test(c.className));
  const first=vis.map(c=>c.innerText).join(' ').replace(/\s+/g,' ').trim();
  const ctl=vis.reduce((n,c)=>n+c.querySelectorAll('button,a[href],select,input,[role=button]').length,0);
  const bands=[...h.querySelectorAll('.cxo-band')];const last=bands[bands.length-1];
  const tiles=[...h.querySelectorAll('.cxo-tile,.cxo-dec,.cxo-watch')].map(t=>({cls:t.className.split(' ').find(c=>/^cxo-(tile|dec|watch)$/.test(c)),labs:[...t.querySelectorAll('.cxo-lab')].map(x=>x.textContent.trim()),txt:t.innerText.replace(/\s+/g,' ')}));
  const det=h.querySelector('.cxo-details');
  return{k:h.dataset.cxoHome,bands:bands.length,counts:['.cxo-tile','.cxo-dec','.cxo-watch'].map(s=>h.querySelectorAll(s).length),words:first.split(' ').length,ctl,bottom:Math.round(last.getBoundingClientRect().bottom),vh:innerHeight,
   tiles,detOpen:det.open,firstText:first,scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth}});
 if(!R){fail(k+' no cxo home');continue}
 if(R.bands!==3||R.counts.join()!=='3,3,3')fail(k+' bands/tiles '+JSON.stringify({b:R.bands,c:R.counts}));else ok(k+' three bands of three');
 if(R.bottom>R.vh)fail(k+' first view does not fit 1440x900: last band ends at '+R.bottom+' of '+R.vh);else ok(k+' fits first view (ends at '+R.bottom+' of '+R.vh+')');
 if(R.words>300)fail(k+' first view has '+R.words+' words');else ok(k+' '+R.words+' words');
 if(R.ctl>30)fail(k+' first view has '+R.ctl+' controls');else ok(k+' '+R.ctl+' controls');
 R.tiles.forEach(t=>{if(t.labs.length!==1||!LABEL.test(t.labs[0]))fail(k+' '+t.cls+' data-state label '+JSON.stringify(t.labs)+' in '+t.txt.slice(0,50))});ok(k+' every tile and row labeled');
 if(VENDOR.test(R.firstText))fail(k+' vendor or product name in the first view: '+R.firstText.match(VENDOR)[0]);else ok(k+' no real vendor or product names');
 if(R.detOpen)fail(k+' Show details starts open');
 if(R.scrollW>R.clientW+1)fail(k+' horizontal scroll at 1440');
 // decisions: ranked by due then value; Approve only where the inbox item allows it; Review opens the item
 const D=await p.evaluate(k=>{const ids=[...document.querySelectorAll('#view .cxo-dec')].map(e=>e.dataset.cxoDec);const items=INBOX.items();const mine=R21H.decisions(k).map(x=>x.id);
  return ids.map(id=>{const it=items.find(x=>x.id===id);const e=document.querySelector('.cxo-dec[data-cxo-dec="'+id+'"]');return{id,due:it?it.dueH:null,amt:it?it.amt:null,inSet:mine.indexOf(id)>=0,can:!!(it&&it.kind==='approval'&&it.can&&it.can.approve),approve:!!e.querySelector('[data-inbx-act="approve"]'),review:!!e.querySelector('[data-inbx-item]')}})},k);
 for(let i=1;i<D.length;i++){const a=D[i-1],c=D[i];if((a.due==null?1e9:a.due)>(c.due==null?1e9:c.due)||((a.due==c.due)&&(a.amt||0)<(c.amt||0)))fail(k+' decisions not ranked by due then value '+JSON.stringify(D))}
 D.forEach(d=>{if(!d.inSet)fail(k+' decision '+d.id+' is not one the persona may decide');if(d.can!==d.approve)fail(k+' Approve button mismatch for '+d.id+' '+JSON.stringify(d));if(!d.review)fail(k+' no Review on '+d.id)});ok(k+' decisions ranked, permitted, Review and Approve '+D.map(d=>d.approve?'A':'-').join(''));
 // watch rows: a trace control each, three distinct items
 const W=await p.evaluate(()=>[...document.querySelectorAll('#view .cxo-watch')].map(e=>({head:e.querySelector('.cxo-dh').textContent,trace:!!e.querySelector('[data-cxo-proc],[data-go],[data-r21-met]')})));
 if(new Set(W.map(w=>w.head)).size!==3||W.some(w=>!w.trace))fail(k+' watch band '+JSON.stringify(W));else ok(k+' watch: '+W.map(w=>w.head).join(' | '));
 // Show details restores every section, in the old order; the contribution line opens the card
 const S1=await p.evaluate(()=>{const d=document.querySelector('.cxo-details');const sel=['.r21-hero','.nx-hpins','.ctb-card','.r21-cg','.r21-dg','.r21-more'];
  const idx=sel.map(s=>{const e=d.querySelector(s);return e?[...d.querySelectorAll('*')].indexOf(e):-1});return{idx,inDet:sel.map(s=>!!d.querySelector(s)),outside:!!document.querySelector('.cxo-home > .ctb-card, .cxo-home > .nx-hpins')}});
 if(S1.inDet.some(x=>!x)||S1.outside||S1.idx.some((v,i)=>i&&v<S1.idx[i-1]))fail(k+' details sections '+JSON.stringify(S1));else ok(k+' Show details keeps hero, role pins, contribution, topics, decisions and the rest in order');
 await p.click('[data-cxo-contrib]');await p.waitForTimeout(300);
 if(!(await p.evaluate(()=>document.querySelector('.cxo-details').open)))fail(k+' contribution line did not open details');else ok(k+' contribution line opens the card');
 await p.evaluate(()=>{document.querySelector('.cxo-details').open=false});
}
// CFO: PR-103 one target per metric, labeled hero tiles; PR-108 owners
await home(p,'cfo');
const C=await p.evaluate(()=>{const d=document.querySelector('.cxo-details');d.open=true;const t=document.getElementById('view').innerText.replace(/\s+/g,' ');
 const hero=[...document.querySelectorAll('.r21-top .r21-tile')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
 const tiles=[...document.querySelectorAll('.cxo-tile')].map(e=>({id:e.dataset.cxoMetric,txt:e.innerText.replace(/\s+/g,' '),chips:[...e.querySelectorAll('[data-owner]')].map(c=>c.dataset.owner),nob:!!e.querySelector('.own-nob')}));
 return{tg:[METRICS.m_budvar.tgt,METRICS.m_spend_var.tgt],hero,tiles,kp:PERSONAS.cfo.kpis,shareOf100:/Forecast as share of approved budget[^A-Z]*target at most 100%/.test(t),targets:[...t.matchAll(/(Forecast (?:variance to approved budget|against approved|vs approved budget)|Enterprise forecast against approved)[^%]*?%[^%]*?target (?:at most|≤) ([\d.]+)/g)].map(m=>m[2])}});
if(C.tg.join()!=='3,3')fail('forecast targets '+C.tg);
if(C.targets.some(x=>x!=='3'))fail('forecast target on the page is not 3 percent: '+C.targets);else ok('forecast against approved: one target (at most 3%) '+JSON.stringify(C.targets));
if(C.shareOf100||C.kp.indexOf('m_burn')>=0)fail('health strip still carries the 100 percent forecast target '+C.kp);
if(C.hero.length!==3||C.hero.some(h=>!/(Modeled|Simulated)/.test(h)))fail('hero tiles unlabeled '+JSON.stringify(C.hero));else ok('hero tiles labeled '+C.hero.map(h=>h.slice(0,40)).join(' | '));
const OW={m_budvar:['Tomas Alvarez','Avery Chen'],m_biz_close:['Avery Chen','Renee Lindqvist'],m_mwls:['Renee Lindqvist','Avery Chen']};
if(C.tiles.map(t=>t.id).join()!=='m_budvar,m_biz_close,m_mwls')fail('CFO numbers '+C.tiles.map(t=>t.id));
C.tiles.forEach(t=>{const w=OW[t.id];if(!w||t.chips.join()!==w.join()||t.nob||w[0]===w[1])fail('owner and backup on '+t.id+' '+JSON.stringify(t.chips))});ok('CFO numbers show owner and a different backup, no No backup badge');
const P=await p.evaluate(async()=>{const o={};for(const n of ['Tomas Alvarez','Renee Lindqvist']){const r=who(n);o[n]={rec:!!r,mgr:r&&r.mgr,role:r&&r.role,team:r&&r.team};person360(n);await new Promise(r=>setTimeout(r,500));o[n].drawer=(document.getElementById('drawer')||{innerText:''}).innerText.indexOf(n)>=0;try{closeDrawer()}catch(e){}}
 return o}).catch(e=>({err:String(e)}));
['Tomas Alvarez','Renee Lindqvist'].forEach(n=>{const r=P[n];if(!r||!r.rec||r.mgr!=='Marcus Reid'||r.team!=='Finance'||!r.drawer)fail('Person 360 for '+n+' '+JSON.stringify(r))});ok('both new Finance people resolve, report to Marcus Reid and open in Person 360');
// COO: MWLS keeps the same owner (R6); clicking the MWLS tile opens its trace and starts no track
await home(p,'coo');
const Q=await p.evaluate(()=>{const e=document.querySelector('.cxo-tile[data-cxo-metric="m_mwls"]');return{chips:[...e.querySelectorAll('[data-owner]')].map(c=>c.dataset.owner),trk:[...document.querySelectorAll('.cxo-tile [data-trk-open]')].map(x=>x.dataset.trkOpen)}});
if(Q.chips.join()!=='Renee Lindqvist,Avery Chen')fail('COO MWLS owner '+Q.chips);else ok('COO MWLS owner and backup match the CFO Home');
if(Q.trk.join()!=='cost,strat')fail('COO tiles open tracks '+Q.trk);
await p.click('.cxo-tile[data-cxo-metric="m_mwls"] .cxo-main');await p.waitForTimeout(500);
const Z=await p.evaluate(()=>({pop:!!document.querySelector('#r21MetPop:popover-open'),cur:TRACKS.current()}));if(!Z.pop||Z.cur)fail('MWLS trace '+JSON.stringify(Z));else ok('MWLS tile opens its trace, starts no track');
await p.keyboard.press('Escape');
// other personas keep the old Home
await home(p,'ceo');if(await p.evaluate(()=>!!document.querySelector('#view .cxo-home')))fail('CEO Home was replaced (phase 2)');else ok('CEO Home unchanged in phase 1');
await p.context().close();
// 400 px: no horizontal scroll, dark theme renders the bands
for(const sch of ['light','dark']){const m=await open(400,860,sch);for(const k of ['coo','cfo']){await home(m,k);const r=await m.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,n:document.querySelectorAll('#view .cxo-tile,#view .cxo-dec,#view .cxo-watch').length}));
 if(r.sw>r.cw+1||r.n!==9)fail('400px '+sch+' '+k+' '+JSON.stringify(r));else ok('400px '+sch+' '+k+' no horizontal scroll')}await m.context().close()}
if(errs.length){bad++;console.log('FAIL page errors',errs.slice(0,5))}
await b.close();console.log(bad?'cxo_home: '+bad+' FAILED':'cxo_home: all passed');process.exit(bad?1:0)})();
