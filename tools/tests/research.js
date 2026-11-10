// 10-K research run test (PR-96 phase A): the simulated replay on the fictional filing reproduces the run key and invents nothing.
// Run key (vault: Atlantic Logistics Sample 10-K Excerpt): one weakness found and mapped (manual journal entries), one found and
// needing data (user access reviews, with sources and reasons), one area not disclosed (revenue cut-off and inventory). Variant B
// returns no weakness, no mapping and no data request. Every item shows its quote and page, and each quote is verbatim in the
// filing at that page. A fabricated event is refused. The simulated banner shows before, during and after the run. The screen is
// built from the event stream alone: events fed by hand (as a live back end would send them) give the same result as the replay.
// No review step in phase A. The card shows on Issues and findings for the core company only.
// Usage: node tools/tests/research.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const URL0='file://'+dir+'/full.html';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});await ctx.route(/^https?:/,r=>r.abort());
const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};const ok=m=>console.log('ok  ',m);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.RSR&&window.DATA,null,{timeout:60000});await p.waitForTimeout(600);
const settle=ms=>p.waitForTimeout(ms||600);
// the run key, written here independently of the module (titles, outcome, pages, data sources)
const KEY={found:[{title:'Material weakness 1: manual journal entries',outcome:'mapped',pages:[58,60],needs:0},
  {title:'Material weakness 2: user access reviews',outcome:'needs',pages:[59,60],needs:3}],
 clear:[{title:'Revenue cut-off and inventory controls',page:59}]};
// sentences copied from the vault excerpt, to catch drift between the note and the module's filing text
const NOTE=[[58,'Role assignments in the ledger allowed members of the finance operations team to create and post manual entries without an independent review.'],
 [59,'Quarterly reviews were completed for one of the four quarters, and we could not determine how long terminated users kept access.'],
 [59,'Management concluded that our controls over revenue cut-off and over fuel and spare parts inventory were designed and operating effectively as of December 31, 2025.'],
 [60,'The material weaknesses relate to the review of manual journal entries and to user access reviews for the transportation management system and the billing interface.']];
const VB='Management concluded that our internal control over financial reporting was effective as of December 31, 2025. We identified no material weaknesses.';

// 1. the excerpt in the module matches the vault note
const drift=await p.evaluate(N=>{const f=RSR.filing('a');return N.filter(([pg,s])=>!(f.pages.find(x=>x.page===pg)||{text:''}).text.includes(s))},NOTE);
if(drift.length)fail('filing text differs from the vault excerpt: '+JSON.stringify(drift));else ok('filing text matches the vault excerpt ('+NOTE.length+' sentences)');
const vb=await p.evaluate(()=>RSR.filing('b').pages.filter(x=>/^Item 9A/.test(x.section)).map(x=>x.text));
if(vb.join('|')!==VB)fail('variant B Item 9A body '+JSON.stringify(vb));else ok('variant B replaces the Item 9A body');

// 2. the event stream: every quote verbatim at its page; the item set equals the run key
const chk=v=>p.evaluate(v=>{const f=RSR.filing(v);const E=RSR.events(v);const bad=[];
 const at=(pg,q)=>{const x=f.pages.find(y=>y.page===pg);return !!(x&&q&&x.text.includes(q))};
 E.forEach(e=>{if(!RSR.TYPES[e.type])bad.push('type '+e.type);if(e.quote!=null&&!at(e.page,e.quote))bad.push(e.type+' quote not at page '+e.page);
  if(e.corroboration&&!at(e.corroboration.page,e.corroboration.quote))bad.push('corroboration not at page '+e.corroboration.page);if(e.quote!=null&&!(e.page>0))bad.push(e.type+' without page')});
 const items=E.filter(e=>e.type==='item.extracted').map(e=>({id:e.item,title:e.title,pages:[e.page].concat(e.corroboration?[e.corroboration.page]:[]),
  needs:E.filter(d=>d.type==='data.requested'&&d.item===e.item).map(d=>({s:d.source,r:d.reason})),mapped:E.some(m=>m.type==='item.mapped'&&m.item===e.item)}));
 return{bad,items,clear:E.filter(e=>e.type==='check.not_disclosed').map(e=>({title:e.title,page:e.page})),fin:(E.find(e=>e.type==='run.finished')||{}).outcomes,
  steps:[...new Set(E.filter(e=>e.type==='step').map(e=>e.name))],types:E.map(e=>e.type)}},v);
const A=await chk('a');
if(A.bad.length)fail('variant A events '+A.bad.join('; '));
const titles=A.items.map(i=>i.title);
if(JSON.stringify(titles)!==JSON.stringify(KEY.found.map(k=>k.title)))fail('weaknesses found '+JSON.stringify(titles)+' (an invented or missing weakness)');
KEY.found.forEach(k=>{const i=A.items.find(x=>x.title===k.title);if(!i)return;
 if(JSON.stringify(i.pages)!==JSON.stringify(k.pages))fail(k.title+' pages '+i.pages);
 if(i.needs.length!==k.needs)fail(k.title+' data sources '+i.needs.length);if(i.needs.some(n=>!n.s||!/^needed to test: /.test(n.r)))fail(k.title+' a source without its reason');
 if(!i.mapped)fail(k.title+' not mapped');if((k.outcome==='needs')!==(i.needs.length>0))fail(k.title+' outcome')});
if(JSON.stringify(A.clear)!==JSON.stringify(KEY.clear))fail('not disclosed '+JSON.stringify(A.clear));
if(JSON.stringify(A.fin)!==JSON.stringify({found_mapped:1,found_needs_data:1,not_disclosed:1}))fail('outcomes '+JSON.stringify(A.fin));
if(A.steps.length!==7||A.steps.some(s=>/review/i.test(s)))fail('steps '+JSON.stringify(A.steps));
if(!bad)ok('variant A reproduces the run key: '+JSON.stringify(A.fin)+', '+A.types.length+' events, 7 steps, no review step');
const B=await chk('b');
if(B.bad.length)fail('variant B events '+B.bad.join('; '));
if(B.items.length||B.types.includes('item.mapped')||B.types.includes('data.requested'))fail('variant B found '+JSON.stringify(B.items));
if(!B.fin||B.fin.found_mapped||B.fin.found_needs_data)fail('variant B outcomes '+JSON.stringify(B.fin));else ok('variant B: no weakness, no mapping, no data request');

// 3. the guard: nothing the filing does not support reaches the screen (invented quotes, real quotes under invented titles,
//    wrong kinds, wrong classifications, data requests for an item that is not a weakness, counts that are not the items)
const G=await p.evaluate(()=>{const r={};const t=(k,e)=>{try{RSR.emit(e);r[k]='accepted'}catch(x){r[k]='refused'}};
 const E=RSR.events('a');const ex=E.find(e=>e.type==='item.extracted'&&e.item==='mw_je');const st=E[0];const C=o=>Object.assign(JSON.parse(JSON.stringify(ex)),o);
 const start=()=>{RSR.reset();RSR.emit(JSON.parse(JSON.stringify(st)))};
 start();t('fabricated quote',C({item:'f1',title:'Material weakness 3: inventory counts',quote:'We did not maintain effective controls over inventory counts.',page:59}));
 start();t('real quote, invented title',C({item:'f2',title:'Material weakness 3: inventory counts'}));
 start();t('real quote, invented area',C({item:'f3',area:'Payroll and pensions'}));
 start();t('real quote, wrong kind',C({item:'f4',kind:'effective'}));
 start();t('real quote, wrong page',C({item:'f5',page:14}));
 start();t('risk factor quoted as a weakness',C({item:'f6',quote:'We have identified material weaknesses in our internal control over financial reporting.',page:14,section:'Item 1A. Risk Factors',corroboration:null}));
 start();t('not disclosed citing a weakness',{run:'X',type:'check.not_disclosed',item:'f7',kind:'effective',title:'Manual journal entries',area:'manual journal entries',quote:ex.quote,page:58,section:ex.section});
 start();t('not disclosed citing the not effective conclusion',{run:'X',type:'check.not_disclosed',item:'f8',kind:'effective',title:'ICFR',area:'internal control over financial reporting',quote:'management concluded that our internal control over financial reporting was not effective',page:58,section:ex.section});
 start();RSR.emit(JSON.parse(JSON.stringify(ex)));t('wrong classification',{run:'X',type:'item.classified',item:'mw_je',gap:'Operating gap',quote:'Role assignments in the ledger allowed members of the finance operations team to create and post manual entries without an independent review.',page:58,section:ex.section});
 const cl=E.find(e=>e.type==='check.not_disclosed');RSR.emit(JSON.parse(JSON.stringify(cl)));
 t('data request for a not disclosed area',{run:'X',type:'data.requested',item:cl.item,source:'Inventory counts',reason:'needed to test: counts'});
 t('data request without a reason',{run:'X',type:'data.requested',item:'mw_je',source:'Ledger',reason:''});
 t('counts that are not the items',{run:'X',type:'run.finished',outcomes:{found_mapped:2,found_needs_data:1,not_disclosed:1}});
 t('event for an unknown item',{run:'X',type:'item.mapped',item:'never',mapping:{}});
 RSR.emit(JSON.parse(JSON.stringify(ex)));const dup=RSR.state().order.length;
 RSR.emit(JSON.parse(JSON.stringify(st)));const after=RSR.state().order.length;RSR.reset();return{r,dup,after}});
const acc=Object.entries(G.r).filter(([k,v])=>v!=='refused').map(([k])=>k);
if(acc.length)fail('guard accepted: '+acc.join('; '));else ok('guard refuses all '+Object.keys(G.r).length+' unsupported events, including a real quote under an invented title');
if(G.dup!==1)fail('a repeated item.extracted gave '+G.dup+' items');if(G.after!==0)fail('run.started did not reset the state ('+G.after+' items)');else ok('repeated items are deduplicated and run.started resets the state');

// 4. the same stream from a live source gives the same screen as the replay
const same=await p.evaluate(()=>{RSR.run('a',{delay:0});const a=RSR.card();RSR.reset();RSR.events('a').forEach(e=>RSR.emit(JSON.parse(JSON.stringify(e))));const b=RSR.card();RSR.reset();return a===b});
if(!same)fail('events fed by hand render differently from the replay');else ok('events fed by hand render the same card as the replay');

// 5. on screen: Issues and findings, core company
await p.evaluate(()=>{DATA.setTenant('core');go('grc_find')});await settle(900);
const ban=()=>p.evaluate(()=>{const b=document.querySelector('#view [data-rsr-card] [data-rsr-banner]');if(!b)return null;const r=b.getBoundingClientRect();return{txt:b.textContent,vis:r.height>0&&getComputedStyle(b).visibility!=='hidden'}});
let bn=await ban();if(!bn||!bn.vis||!/Simulated/.test(bn.txt))fail('banner before the run '+JSON.stringify(bn));
const seen=[];await p.exposeFunction('__rsrSeen',t=>seen.push(t));await p.evaluate(()=>{window.__rsrOff=RSR.on(e=>window.__rsrSeen(e.type))});
await p.click('#view [data-rsr-run="a"]');await settle(1500);
bn=await ban();const mid=await p.evaluate(()=>!RSR.state().finished&&!!RSR.state().run);
if(!mid)fail('run finished too fast to check the banner during it');if(!bn||!bn.vis)fail('banner during the run '+JSON.stringify(bn));
await p.waitForFunction(()=>RSR.state().finished,null,{timeout:30000});await settle(300);
bn=await ban();if(!bn||!bn.vis)fail('banner on the results');
// with the results scrolled into view, a simulated banner is inside the viewport
const inView=async sel=>{await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'end'})},sel);await settle(300);
 const v=await p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-banner]')].map(b=>{const r=b.getBoundingClientRect();return{t:Math.round(r.top),b:Math.round(r.bottom),h:innerHeight,ok:r.height>0&&(Math.min(r.bottom,innerHeight)-Math.max(r.top,0))/r.height>=0.8&&/Simulated/.test(b.textContent)}}));if(!v.some(x=>x.ok))console.log('banners',JSON.stringify(v));return v.some(x=>x.ok)};
for(const sel of ['#view [data-rsr-counts]','#view [data-rsr-item]:last-of-type','#view [data-rsr-item="mw_uar"] [data-rsr-need]:last-child'])if(!await inView(sel))fail('no simulated banner in the viewport with '+sel+' in view');
if(!bad)ok('simulated banner visible before, during and after the run, and in the viewport while results are in view');
const want=await p.evaluate(()=>RSR.events('a').map(e=>e.type));if(JSON.stringify(seen)!==JSON.stringify(want))fail('stream seen on screen differs from RSR.events: '+seen.length+' vs '+want.length);else ok('the screen ran on the event stream ('+seen.length+' events)');
await p.evaluate(()=>window.__rsrOff&&window.__rsrOff());
const D=await p.evaluate(()=>{const c=document.querySelector('#view [data-rsr-card]');const f=RSR.filing('a');
 const items=[...c.querySelectorAll('[data-rsr-item]')].map(a=>({out:a.dataset.rsrOutcome,title:a.querySelector('b').textContent,
  q:[...a.querySelectorAll('[data-rsr-quote]')].map(q=>({pg:+q.dataset.rsrPage,cite:q.querySelector('cite').textContent,ok:(f.pages.find(x=>x.page===+q.dataset.rsrPage)||{text:''}).text.includes(q.firstChild.textContent)})),
  needs:a.querySelectorAll('[data-rsr-need]').length,labels:[...a.querySelectorAll('[data-rsr-label]')].map(l=>l.dataset.rsrLabel)}));
 const counts=c.querySelector('[data-rsr-counts]');
 return{items,counts:counts?counts.textContent.replace(/\s+/g,' '):'',steps:c.querySelectorAll('[data-rsr-step]').length,done:c.querySelectorAll('[data-rsr-status="done"]').length,
  dash:/\u2014/.test(c.textContent),filing:c.querySelectorAll('[data-rsr-filing-page]').length,after:!!document.querySelector('#view .hero + [data-rsr-card], #view .hero ~ [data-rsr-card]')}});
const outs=D.items.map(i=>i.out).join();if(outs!=='mapped,needs,clear')fail('outcomes on screen '+outs);
D.items.forEach(i=>{if(!i.q.length)fail(i.title+' shows no quote');i.q.forEach(q=>{if(!q.ok)fail(i.title+' quote not in the filing at page '+q.pg);if(!new RegExp('page '+q.pg+'$').test(q.cite))fail(i.title+' cite '+q.cite)});
 if(!i.labels.includes('fictional'))fail(i.title+' quote not labeled fictional');if(i.out==='mapped'&&!i.labels.includes('modeled'))fail(i.title+' mapping not labeled modeled')});
if(D.items[1]&&D.items[1].needs!==3)fail('data sources on screen '+D.items[1].needs);
const TR=await p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-test]')].map(t=>t.dataset.rsrTest+': '+t.textContent.replace(/\s+/g,' ').trim()));
if(TR.length!==2||!/^checked: Checked/.test(TR[0])||!/^blocked: Not tested/.test(TR[1]))fail('test results on screen '+JSON.stringify(TR));
if(!/Simulated/.test(D.counts))fail('outcome counts not labeled '+D.counts);
if(D.steps!==7||D.done!==7)fail('step log '+D.steps+' steps, '+D.done+' done');if(D.dash)fail('em dash in the card');if(D.filing<4)fail('filing text pages '+D.filing);if(!D.after)fail('card not after the hero');
if(!bad)ok('on screen: '+outs+', every quote with its page, counts labeled, 7 steps done');
// variant B on screen
await p.click('#view [data-rsr-run="b"]');await p.waitForFunction(()=>RSR.state().finished,null,{timeout:30000});await settle(300);
const DB=await p.evaluate(()=>({none:!!document.querySelector('#view [data-rsr-none]'),found:[...document.querySelectorAll('#view [data-rsr-outcome="mapped"],#view [data-rsr-outcome="needs"],#view [data-rsr-need]')].length}));
if(!DB.none||DB.found)fail('variant B on screen '+JSON.stringify(DB));else ok('variant B on screen: no weakness disclosed');
// 6. other tenants: no card (the filing belongs to the core company)
const others=await p.evaluate(()=>DATA.tenants().map(t=>t.id).filter(t=>t!=='core'));if(!others.length)fail('no other tenant to check');
for(const t of others){await p.evaluate(t=>{DATA.setTenant(t);go('grc_find')},t);await settle(500);if(await p.$('#view [data-rsr-card]'))fail('card shown under tenant '+t)}
await p.evaluate(()=>DATA.setTenant('core'));ok('no card under '+others.join(', '));
if(errs.length)fail('page errors '+errs.slice(0,5).join(' | '));
await b.close();console.log('research: checks done, failures '+bad);process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
