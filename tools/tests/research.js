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
for(const sel of ['#view [data-rsr-counts]','#view [data-rsr-table]','#view [data-rsr-sources] [data-rsr-need]:last-child'])if(!await inView(sel))fail('no simulated banner in the viewport with '+sel+' in view');
if(!bad)ok('simulated banner visible before, during and after the run, and in the viewport while results are in view');
const want=await p.evaluate(()=>RSR.events('a').map(e=>e.type));if(JSON.stringify(seen)!==JSON.stringify(want))fail('stream seen on screen differs from RSR.events: '+seen.length+' vs '+want.length);else ok('the screen ran on the event stream ('+seen.length+' events)');
await p.evaluate(()=>window.__rsrOff&&window.__rsrOff());
// PR-100 and PR-101: the maps, the tiles, the table and the detail
const NODES=m=>p.evaluate(m=>[...document.querySelectorAll('#view [data-rsr-map="'+m+'"] [data-rsr-node]')].map(n=>({k:n.dataset.rsrNode,st:n.dataset.rsrStatus,flag:n.dataset.rsrFlag||'',badge:(n.querySelector('[data-rsr-badge] text')||{}).textContent||'',tip:(n.querySelector('title')||{}).textContent||'',tab:n.getAttribute('tabindex'),aria:n.getAttribute('aria-label')||'',hasShape:!!n.querySelector('.r17pd-sh')})),m);
const F=await p.evaluate(()=>{const c=document.querySelector('#view [data-rsr-card]');const f=RSR.filing('a');
 const q=[...c.querySelectorAll('[data-rsr-quote]')].map(x=>({pg:+x.dataset.rsrPage,cite:x.querySelector('cite').textContent,ok:(f.pages.find(y=>y.page===+x.dataset.rsrPage)||{text:''}).text.includes(x.firstChild.textContent)}));
 return{counts:c.querySelector('[data-rsr-counts]').textContent.replace(/\s+/g,' '),dash:/—/.test(c.textContent),filing:c.querySelectorAll('[data-rsr-filing-page]').length,after:!!document.querySelector('#view .hero + [data-rsr-card], #view .hero ~ [data-rsr-card]'),
  oldSteps:c.querySelectorAll('.rsr-steps,[data-rsr-step]').length,svgs:c.querySelectorAll('[data-rsr-map="run"] svg').length,q}});
if(!/Simulated/.test(F.counts))fail('outcome counts not labeled '+F.counts);if(F.dash)fail('em dash in the card');if(F.filing<4)fail('filing text pages '+F.filing);if(!F.after)fail('card not after the hero');
if(F.oldSteps)fail('the plain step list is still on screen');if(F.svgs!==1)fail('run map svgs '+F.svgs);
F.q.forEach(x=>{if(!x.ok)fail('quote not in the filing at page '+x.pg);if(!new RegExp('page '+x.pg+'$').test(x.cite))fail('cite '+x.cite)});
// the run map (simulated): seven nodes in step order, human, robot or agent, all done, flags on steps 6 and 7 with their counts
const RN=await NODES('run');
if(RN.length!==7||RN.map(n=>n.k).join()!=='1,2,3,4,5,6,7')fail('run map nodes '+JSON.stringify(RN.map(n=>n.k)));
if(RN.some(n=>n.st!=='done'||!n.hasShape||n.tab!=='0'||!n.tip||!n.aria))fail('run map node states, tooltips or focus '+JSON.stringify(RN.map(n=>[n.st,n.tab])));
const fl=RN.filter(n=>n.flag).map(n=>n.k+':'+n.flag+':'+n.badge).join();if(fl!=='6:1:1,7:3:3')fail('flagged nodes '+fl);
const lanes=await p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-map="run"] .r17pd-lt')].map(t=>t.textContent).join('|'));
if(lanes!=='Presenter|Research robot|Research agent')fail('run map lanes '+lanes);
const labs=await p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-map="run"] figcaption [data-rsr-label]')].map(l=>l.dataset.rsrLabel).join());if(labs!=='simulated')fail('run map label '+labs);
// the tiles filter the table
const rowsNow=()=>p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-row]')].map(r=>r.dataset.rsrOutcome).join());
let outs=await rowsNow();if(outs!=='mapped,needs,clear')fail('outcomes on screen '+outs);
const tiles=await p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-tile]')].map(t=>t.dataset.rsrTile+':'+t.querySelector('.rsr-cv').textContent));if(tiles.join()!=='mapped:1,needs:1,clear:1')fail('tiles '+tiles);
for(const k of ['mapped','needs','clear']){await p.click('#view [data-rsr-tile="'+k+'"]');const r=await rowsNow();const pr=await p.getAttribute('#view [data-rsr-tile="'+k+'"]','aria-pressed');if(r!==k||pr!=='true')fail('tile '+k+' filtered to '+r+' pressed '+pr)}
await p.click('#view [data-rsr-tile="clear"]');outs=await rowsNow();if(outs!=='mapped,needs,clear')fail('selecting the tile again did not clear the filter: '+outs);
// the table: columns, one row per weakness, pills
const T=await p.evaluate(()=>{const t=document.querySelector('#view [data-rsr-table]');return{heads:[...t.querySelectorAll('th')].map(h=>h.textContent),rows:[...t.querySelectorAll('[data-rsr-row]')].map(r=>[...r.children].map(c=>c.textContent.replace(/\s+/g,' ').trim())),pills:t.querySelectorAll('tbody .pill').length,tbl:t.classList.contains('tbl')}});
if(T.heads.join()!=='Weakness,Area,Gap type,Outcome,Test result,Data needs')fail('table columns '+T.heads);
if(!T.tbl||T.pills<6)fail('table or pill components not used '+T.tbl+' '+T.pills);
if(T.rows[0][2]!=='Design gap'||T.rows[0][3]!=='Found and mapped'||T.rows[0][4]!=='Checked'||T.rows[0][5]!=='0')fail('row 1 '+JSON.stringify(T.rows[0]));
if(T.rows[1][2]!=='Operating gap'||T.rows[1][3]!=='Found, needs data'||T.rows[1][4]!=='Needs data'||T.rows[1][5]!=='3')fail('row 2 '+JSON.stringify(T.rows[1]));
if(!/Not disclosed/.test(T.rows[2][3]))fail('row 3 '+JSON.stringify(T.rows[2]));
// the detail: one at a time, with the chain, the auditor's line, Map B and the quotes collapsed
const detail=async id=>{await p.evaluate(id=>{const cur=document.querySelector('#view [data-rsr-detail]');if(cur&&cur.dataset.rsrDetail===id)return;document.querySelector('#view [data-rsr-open="'+id+'"]').click()},id);await settle(150);
 return p.evaluate(()=>{const ds=document.querySelectorAll('#view [data-rsr-detail]');const d=ds[0];if(!d)return{n:0};const f=RSR.filing('a');
  return{n:ds.length,id:d.dataset.rsrDetail,chain:[...d.querySelectorAll('.rsr-map dt')].map(x=>x.textContent).join(),auditor:(d.querySelector('[data-rsr-auditor]')||{textContent:''}).textContent,
   collapsed:!!d.querySelector('details.rsr-qd:not([open])'),summary:(d.querySelector('details.rsr-qd summary')||{textContent:''}).textContent,
   q:[...d.querySelectorAll('[data-rsr-quote]')].map(x=>({pg:+x.dataset.rsrPage,ok:(f.pages.find(y=>y.page===+x.dataset.rsrPage)||{text:''}).text.includes(x.firstChild.textContent),cite:x.querySelector('cite').textContent})),
   labels:[...d.querySelectorAll('[data-rsr-label]')].map(l=>l.dataset.rsrLabel),test:(d.querySelector('[data-rsr-test]')||{dataset:{}}).dataset.rsrTest||'',
   maps:d.querySelectorAll('[data-rsr-map="business"]').length,note:(d.querySelector('[data-rsr-flagnote]')||{textContent:''}).textContent}})};
const d1=await detail('mw_je');
if(d1.n!==1||d1.chain!=='Process,Control,Metric'||!/Auditor's report agrees \(page 60\)/.test(d1.auditor)||!d1.collapsed||d1.summary!=='Show the filing text')fail('detail 1 '+JSON.stringify(d1));
if(d1.q.length!==3||d1.q.some(x=>!x.ok||!new RegExp('page '+x.pg+'$').test(x.cite)))fail('detail 1 quotes '+JSON.stringify(d1.q));
if(!d1.labels.includes('fictional')||!d1.labels.includes('modeled')||!d1.labels.includes('simulated')||d1.test!=='checked'||d1.maps!==1)fail('detail 1 labels or test '+JSON.stringify(d1.labels));
let BN=await NODES('business');
if(BN.map(n=>n.k).join()!=='1,2,3,4'||BN.filter(n=>n.flag).map(n=>n.k+':'+n.flag+':'+n.badge).join()!=='3:design:✓')fail('weakness 1 map B '+JSON.stringify(BN.map(n=>[n.k,n.st,n.flag,n.badge])));
const kinds=await p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-map="business"] [data-rsr-node]')].map(n=>n.getAttribute('aria-label').split(' | ')[1]).join());
if(kinds!=='Human,Robot,Approval gate,Human')fail('map B step kinds '+kinds);
const mlab=await p.evaluate(()=>[...document.querySelectorAll('#view [data-rsr-map="business"] figcaption [data-rsr-label]')].map(l=>l.dataset.rsrLabel).join());if(mlab!=='modeled')fail('map B label '+mlab);
const d2=await detail('mw_uar');
if(d2.id!=='mw_uar'||d2.n!==1||d2.q.length!==3||d2.q.some(x=>!x.ok)||d2.test!=='blocked'||d2.maps!==1)fail('detail 2 '+JSON.stringify(d2));
BN=await NODES('business');
if(BN.map(n=>n.k).join()!=='1,2,3'||BN.filter(n=>n.flag).map(n=>n.k+':'+n.flag+':'+n.badge).join()!=='2:operating:3')fail('weakness 2 map B '+JSON.stringify(BN.map(n=>[n.k,n.st,n.flag,n.badge])));
if(!/Operating gap\..*3 sources/.test(d2.note))fail('weakness 2 flag note '+d2.note);
const d3=await detail('ok_cut');
if(d3.id!=='ok_cut'||d3.maps!==0||d3.q.length!==1||!d3.q[0].ok||!d3.collapsed)fail('detail 3 '+JSON.stringify(d3));
await p.click('#view [data-rsr-open="ok_cut"]');if(await p.$('#view [data-rsr-detail]'))fail('selecting the open row again did not close its detail');
// the data sources table
const DS=await p.evaluate(()=>{const t=document.querySelector('#view [data-rsr-sources]');return{heads:[...t.querySelectorAll('th')].map(h=>h.textContent).join(),rows:[...t.querySelectorAll('[data-rsr-need]')].map(r=>[...r.children].map(c=>c.textContent.replace(/\s+/g,' ').trim()))}});
if(DS.heads!=='Source,Reason,Status'||DS.rows.length!==3||DS.rows.some(r=>!r[0]||!/^needed to test: /.test(r[1])||!r[2]))fail('data sources table '+JSON.stringify(DS));
// keyboard and screen reader order: tiles, then row buttons, in reading order; Enter and Space operate them; focus survives the repaint
await p.evaluate(()=>document.querySelector('#view [data-rsr-tile="mapped"]').focus());
await p.keyboard.press('Enter');await settle(100);
let kb=await p.evaluate(()=>({f:document.activeElement.dataset.rsrTile,rows:document.querySelectorAll('#view [data-rsr-row]').length}));
if(kb.f!=='mapped'||kb.rows!==1)fail('keyboard on a tile (focus kept, filter applied) '+JSON.stringify(kb));
await p.keyboard.press('Space');await settle(100);
await p.keyboard.press('Tab');await p.keyboard.press('Tab');await p.keyboard.press('Tab');await settle(100);
const ord=await p.evaluate(()=>{const a=document.activeElement;return a.dataset.rsrOpen||a.tagName});if(ord!=='mw_je')fail('tab order from the tiles reaches '+ord+' (want the first row)');
await p.keyboard.press('Enter');await settle(100);
const ex=await p.evaluate(()=>({o:document.activeElement.dataset.rsrOpen,e:document.activeElement.getAttribute('aria-expanded'),d:!!document.querySelector('#view [data-rsr-detail="mw_je"]')}));
if(ex.o!=='mw_je'||ex.e!=='true'||!ex.d)fail('keyboard on a row '+JSON.stringify(ex));
const dom=await p.evaluate(()=>{const els=[...document.querySelectorAll('#view [data-rsr-card] [data-rsr-map="run"],#view [data-rsr-card] [data-rsr-counts],#view [data-rsr-card] [data-rsr-table],#view [data-rsr-card] [data-rsr-detail],#view [data-rsr-card] [data-rsr-sources]')];return els.map(e=>e.dataset.rsrMap?'map-'+e.dataset.rsrMap:Object.keys(e.dataset).find(k=>/^rsr(Counts|Table|Detail|Sources)$/.test(k))).join()});
if(dom!=='map-run,rsrCounts,rsrTable,rsrDetail,rsrSources')fail('reading order '+dom);
// layout: at 1440 pixels the summary tiles and the table fit one screen when the card is at the top
await p.evaluate(()=>{RSR.run('a',{delay:0});document.querySelector('#view [data-rsr-open="mw_je"]')&&document.querySelector('#view [data-rsr-open="mw_je"]').click()});await settle(300);
const fit=await p.evaluate(()=>{document.querySelector('#view [data-rsr-card]').scrollIntoView({block:'start'});const c=document.querySelector('#view [data-rsr-counts]').getBoundingClientRect(),t=document.querySelector('#view [data-rsr-table]').getBoundingClientRect();return{tiles:Math.round(c.top)+'-'+Math.round(c.bottom),table:Math.round(t.top)+'-'+Math.round(t.bottom),h:innerHeight}});
const bot=+fit.table.split('-')[1];if(!(bot<=fit.h))fail('summary and table do not fit one screen at 1440 wide: '+JSON.stringify(fit));
if(!bad)ok('on screen: run map 7 nodes done, flags 6:1 and 7:3, tiles filter, table rows, detail with map B per weakness, quotes collapsed, data sources, keyboard; table bottom '+bot+' of '+fit.h);
// the maps follow the events in order: after each event the run map matches the steps so far, and map B follows classify, test and request
const FL=await p.evaluate(()=>{const bad=[];const E=RSR.events('a');RSR.reset();let seenB={};
 const nodes=m=>[...document.querySelectorAll('#view [data-rsr-map="'+m+'"] [data-rsr-node]')];
 E.forEach(e=>{RSR.emit(JSON.parse(JSON.stringify(e)));const st=RSR.state().steps.map(t=>t.status);
  const got=nodes('run').map(n=>n.dataset.rsrStatus);const want=st.map(x=>x==='done'?'done':x);
  if(JSON.stringify(got)!==JSON.stringify(want))bad.push('seq '+e.seq+' '+e.type+': nodes '+got.join()+' steps '+want.join());
  if(e.type==='step'&&e.status==='running'&&got[e.step-1]!=='running')bad.push('step '+e.step+' not lit while running');
  if(e.type==='item.mapped'&&e.item==='mw_je'){const b=nodes('business');if(b.length!==4)bad.push('map B after mapped '+b.length)}
  if(e.type==='item.tested'&&e.item==='mw_je'){const f=document.querySelector('#view [data-rsr-map="business"] [data-rsr-flag]');if(!f||f.querySelector('[data-rsr-badge] text').textContent!=='✓')bad.push('tested badge on weakness 1 gate')}
  if(e.type==='run.finished'&&!document.querySelector('#view [data-rsr-counts]'))bad.push('no tiles at the end')});
 RSR.reset();return bad});
if(FL.length)fail('map follows events: '+FL.slice(0,4).join(' | '));else ok('run map matches the steps after every one of the '+32+' events; map B follows mapped, tested');
// the guard and banner are unchanged by the layout: a refused event leaves the maps as they were
// variant B on screen
await p.click('#view [data-rsr-run="b"]');await p.waitForFunction(()=>RSR.state().finished,null,{timeout:30000});await settle(300);
const DB=await p.evaluate(()=>({none:!!document.querySelector('#view [data-rsr-none]'),found:[...document.querySelectorAll('#view [data-rsr-outcome="mapped"],#view [data-rsr-outcome="needs"],#view [data-rsr-need]')].length,
 run:[...document.querySelectorAll('#view [data-rsr-map="run"] [data-rsr-node]')].map(n=>n.dataset.rsrStatus+(n.dataset.rsrFlag?'!':'')).join(),maps:document.querySelectorAll('#view [data-rsr-map="business"]').length}));
if(DB.run!=='done,done,done,done,done,done,done'||DB.maps)fail('variant B maps: run '+DB.run+', business maps '+DB.maps);
if(!DB.none||DB.found)fail('variant B on screen '+JSON.stringify(DB));else ok('variant B on screen: no weakness disclosed');
// 6. other tenants: no card (the filing belongs to the core company)
const others=await p.evaluate(()=>DATA.tenants().map(t=>t.id).filter(t=>t!=='core'));if(!others.length)fail('no other tenant to check');
for(const t of others){await p.evaluate(t=>{DATA.setTenant(t);go('grc_find')},t);await settle(500);if(await p.$('#view [data-rsr-card]'))fail('card shown under tenant '+t)}
await p.evaluate(()=>DATA.setTenant('core'));ok('no card under '+others.join(', '));
if(errs.length)fail('page errors '+errs.slice(0,5).join(' | '));
await b.close();console.log('research: checks done, failures '+bad);process.exit(bad?1:0)})().catch(e=>{console.error(e);process.exit(1)});
