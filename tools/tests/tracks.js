// Executive tracks test (DC-51): EXP.lint and SHOW.lint stay clean with the tracks registered; the three track metrics (TKVT,
// STSH, MWLS) exist with every Metric Definition Standard field; the COO home shows them as its top three, each labeled
// (modeled or simulated) and each opening its track; the track bar sits above the view with six stage chips, the current one
// marked, the track metric with its label, Next and Leave track; stages fire only in order; the bar survives navigation; Next
// moves the stage and the URL; Leave track removes the bar and the URL; the deep link ?track=<id>&stage=<n> resumes a stage.
// Usage: node tools/tests/tracks.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const URL0='file://'+dir+'/full.html';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});await ctx.route(/^https?:/,r=>r.abort());
const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};const ok=m=>console.log('ok  ',m);
const watch=pg=>{pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message));pg.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,200)))};
const p=await ctx.newPage();watch(p);await p.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.EXP&&window.TRACKS&&EXP.byId('trk_cost'),null,{timeout:60000});await p.waitForTimeout(800);
const settle=ms=>p.waitForTimeout(ms||700);
// lints
const L=await p.evaluate(()=>({exp:EXP.lint(),show:SHOW.lint()}));if(L.exp.length||L.show.length)fail('lint '+JSON.stringify(L));else ok('EXP.lint and SHOW.lint clean');
// metrics: every field of the standard, and a takeout target in the data
const M=await p.evaluate(()=>['m_tkvt','m_stsh','m_mwls'].map(id=>{const m=METRICS[id];if(!m)return{id,missing:['metric']};
 return{id,acr:m.acr,label:m.label,missing:['n','f','u','tgt','dir','owner','acr','why','dec','how','trend','thr','on','off','obs','label','rem'].filter(k=>m[k]==null||m[k]===''),cur:m.cur,val:TRACKS.value(id)}}));
M.forEach(m=>{if(m.missing.length)fail(m.id+' missing fields '+m.missing.join(','));if(m.cur!==m.val)fail(m.id+' value '+m.cur+' is not the live value '+m.val)});
if(M.map(m=>m.acr).join()!=='TKVT,STSH,MWLS')fail('acronyms '+M.map(m=>m.acr));if(M[2].label!=='simulated')fail('MWLS is not labeled simulated');
if(!(await p.evaluate(()=>typeof TAKEOUT!=='undefined'&&TAKEOUT.tgt>0)))fail('no takeout target in the data');ok('metrics '+JSON.stringify(M.map(m=>m.acr+'='+m.cur+' '+m.label)));
// COO home: the three track tiles are the top three, labeled, each opening its track
await p.evaluate(()=>{NAVX.persona.set('coo');go('home')});await settle(900);
const T=await p.evaluate(()=>[...document.querySelectorAll('#view .r21-top .r21-tile')].map(t=>({trk:t.dataset.trkOpen||null,txt:t.textContent.replace(/\s+/g,' ').trim(),aria:t.getAttribute('aria-label')})));
if(T.map(t=>t.trk).join()!=='cost,strat,mw')fail('COO top tiles '+JSON.stringify(T));
T.forEach(t=>{if(!/(Modeled|Simulated)/.test(t.txt))fail('tile has no label '+t.txt);if(!/track/.test(t.aria||''))fail('tile aria '+t.aria)});
if(T[2]&&!/Simulated/.test(T[2].txt))fail('MWLS tile not labeled simulated '+T[2].txt);ok('COO tiles '+T.map(t=>t.txt).join(' | '));
// the TKVT tile opens the Cost Takeout track: bar above the view, six chips, stage 1 current, metric labeled, URL set
await p.click('#view [data-trk-open="cost"]');await settle(1600);
const bar=()=>p.evaluate(()=>{const b=document.getElementById('trkBar');const v=document.getElementById('view');if(!b)return null;
 return{beforeView:b.nextElementSibling===v,chips:b.querySelectorAll('[data-trk-stage]').length,now:[...b.querySelectorAll('[data-trk-stage]')].findIndex(x=>x.getAttribute('aria-current')==='step'),
  tile:(b.querySelector('.trk-tile')||{}).textContent||'',label:!!b.querySelector('.trk-tile .exp-chip'),next:!!b.querySelector('[data-trk-next]'),leave:!!b.querySelector('[data-trk-leave]'),
  url:location.search,cur:TRACKS.current(),screen:S.screen,persona:S.persona}});
let B=await bar();
if(!B||!B.beforeView||B.chips!==6||B.now!==0||!B.label||!B.next||!B.leave||!/TKVT/.test(B.tile))fail('cost bar '+JSON.stringify(B));
if(!B||!/track=cost/.test(B.url)||!/stage=1/.test(B.url)||!B.cur||B.cur.id!=='cost')fail('cost url or state '+JSON.stringify(B));else ok('cost track bar '+JSON.stringify({chips:B.chips,now:B.now,tile:B.tile.trim(),url:B.url,screen:B.screen}));
// stages fire only in order: recording a benefit actual first does not complete stage 6
await p.evaluate(()=>R17U.recordActual({ben:'BEN-9',q:1,amount:1000,how:'Finance ledger',ev:'out of order'}));await settle(1500);
if(await p.evaluate(()=>EXP.state().done.length))fail('a later stage fired out of order '+JSON.stringify(await p.evaluate(()=>EXP.state().done)));else ok('stages fire only in order');
// the bar survives navigation and repaints
await p.evaluate(()=>go('home'));await settle(800);B=await bar();if(!B||!B.beforeView)fail('bar lost after navigation');
// Next skips stage 1 and opens stage 2's screen (a viewing stage, so it counts as seen there); the URL follows the current stage
await p.click('#trkBar [data-trk-next]');await settle(2000);B=await bar();const st=await p.evaluate(()=>EXP.state().checkpoints.map(c=>c.skipped?'s':c.done?'d':'-').join(''));
if(!B||st.slice(0,2)!=='sd'||B.now<1||!new RegExp('stage='+(B.now+1)).test(B.url)||B.screen!=='bst')fail('next '+JSON.stringify({B,st}));else ok('next stage '+JSON.stringify({st,now:B.now,url:B.url,screen:B.screen}));
// Leave track: bar and URL gone, role restored
await p.click('#trkBar [data-trk-leave]');await settle(1000);B=await bar();const left=await p.evaluate(()=>({url:location.search,cur:TRACKS.current(),persona:S.persona}));
if(B||/track=/.test(left.url)||left.cur||left.persona!=='coo')fail('leave '+JSON.stringify({B,left}));else ok('leave track');
// STSH tile opens Strategy Implementation as the CEO; MWLS tile starts nothing (its track is not built) and says so
await p.evaluate(()=>go('home'));await settle(800);await p.click('#view [data-trk-open="strat"]');await settle(1600);B=await bar();
if(!B||B.cur.id!=='strat'||B.persona!=='ceo'||!/STSH/.test(B.tile))fail('strat tile '+JSON.stringify(B));else ok('strat tile opens its track as '+B.persona);
await p.evaluate(()=>EXP.stop({stay:true}));await settle(600);await p.evaluate(()=>go('home'));await settle(800);
await p.click('#view [data-trk-open="mw"]');await settle(800);const mw=await p.evaluate(()=>({cur:TRACKS.current(),bar:!!document.getElementById('trkBar')}));
if(mw.cur||mw.bar)fail('mw tile started something '+JSON.stringify(mw));else ok('mw tile: no track yet, nothing started');
// deep link resumes a stage
const d=await ctx.newPage();watch(d);await d.goto(URL0+'?track=strat&stage=5',{waitUntil:'domcontentloaded',timeout:120000});
await d.waitForFunction(()=>window.TRACKS&&TRACKS.current(),null,{timeout:30000}).catch(()=>{});await d.waitForTimeout(1500);
const DL=await d.evaluate(()=>({chips:[...document.querySelectorAll('#trkBar [data-trk-stage]')].map(c=>/trk-done/.test(c.className)?'d':/trk-skip/.test(c.className)?'s':/trk-now/.test(c.className)?'n':'-').join(''),cur:TRACKS.current(),passed:EXP.state().checkpoints.filter(c=>c.done).length,skipped:EXP.state().checkpoints.filter(c=>c.skipped).length,screen:S.screen,bar:!!document.getElementById('trkBar'),url:location.search}));
if(!DL.cur||DL.cur.id!=='strat'||DL.cur.stage!==5||DL.passed!==4||DL.skipped<3||DL.chips.slice(4)!=='n-'||!/^[ds]{4}$/.test(DL.chips.slice(0,4))||!DL.bar||DL.screen!=='strat_exec')fail('deep link '+JSON.stringify(DL));else ok('deep link '+JSON.stringify(DL));
// skipping to the end is not success: the last stage must be done by the buyer
const sk=await d.evaluate(()=>{EXP.skip();EXP.skip();return{success:EXP.state().success,stage:TRACKS.current()&&TRACKS.current().stage}});
if(sk.success)fail('skipping the last stages counted as success '+JSON.stringify(sk));else ok('skipped stages are not success');
await b.close();
if(errs.length){fail('page errors');console.log(errs.slice(0,8))}
console.log(bad?'tracks: '+bad+' failure'+(bad>1?'s':''):'tracks: all passed');process.exit(bad?1:0)})();
