// PH-12 search test: typing a screen, module or tab name in the global search lists that screen first and opens it with Enter
// (or a click); a tab such as "Build list" opens its screen on that tab; hidden screens appear only in builder mode.
// Usage: node tools/tests/search.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
const CASES=[
 {q:'org chart',screen:'org_chart'},
 {q:'screen map',screen:'scr_map'},
 {q:'build list',screen:'ppl_jrny',tab:'Build list'},
 {q:'showroom',screen:'showroom'},
 {q:'guardrail register',screen:'guard',tab:'Register'},
 {q:'stage matrix',screen:'guard',tab:'Stage matrix'},
 {q:'impact explorer',screen:'kg'},
 {q:'journey maps',screen:'ppl_jrny'},
 {q:'navigation and search',screen:'nav_studio'},
 {q:'feature contract',screen:'plat_contract'},
 {q:'invoice approval',screen:'inv'},
 {q:'master schedule',screen:'ims'},
 {q:'ai control tower',screen:'tower'},
 {q:'org chart with agent assist',screen:'orgassist'},
 {q:'process library',screen:'plat_proc',click:true}];
const HIDDEN={q:'workflow designer',screen:'flw_design'};
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&window.NAVX&&NAVX.ensureIndex&&window.SRCH,null,{timeout:120000});await p.waitForTimeout(600);
await p.evaluate(()=>{SRCH.setBuilder(false);NAVX.ensureIndex(true)});await p.waitForFunction(()=>NAVX.index.built&&!NAVX.index.building,null,{timeout:120000});
const activeTab=()=>p.evaluate(()=>{const v=document.getElementById('view');const r=v.querySelector('.views input:checked');if(r){const l=v.querySelector('label[for="'+r.id+'"]');if(l)return l.textContent.trim()}
 const t=v.querySelector('[role=tab][aria-selected=true]');return t?t.textContent.trim():null});
async function typeQ(q){await p.evaluate(()=>{go('home');NAVX.openPalette({})});await p.waitForSelector('#nxPalIn',{state:'visible'});await p.fill('#nxPalIn',q);
 await p.waitForFunction(q=>NAVX.int.PAL.q===q&&document.querySelector('#nxPalList [data-nx-i="0"]'),q,{timeout:10000});await p.waitForTimeout(80)}
for(const c of CASES){try{await typeQ(c.q);
 const first=await p.evaluate(()=>{const r=NAVX.int.PAL.rows[0];return r?{t:r.t,sid:r.sid||null,ty:r.ty}:null});
 if(!first||first.sid!==c.screen){fail('"'+c.q+'" first result is '+JSON.stringify(first)+', expected screen '+c.screen);await p.keyboard.press('Escape');continue}
 if(c.click)await p.click('#nxPalList [data-nx-i="0"]');else await p.keyboard.press('Enter');
 await p.waitForFunction(id=>S.screen===id,c.screen,{timeout:5000}).catch(()=>{});await p.waitForTimeout(c.tab?700:150);
 const scr=await p.evaluate(()=>S.screen);if(scr!==c.screen){fail('"'+c.q+'" opened '+scr+', expected '+c.screen);continue}
 if(c.tab){const t=await activeTab();if(t!==c.tab){fail('"'+c.q+'" opened tab '+t+', expected '+c.tab);continue}}
 console.log('ok  ',c.q.padEnd(30),'->',c.screen+(c.tab?' / '+c.tab:''),c.click?'(click)':'(Enter)')}catch(e){fail(c.q+': '+e.message)}}
// hidden screens: not listed by default, offered through builder mode, listed once it is on
await typeQ(HIDDEN.q);
let h=await p.evaluate(s=>({inRows:NAVX.int.PAL.rows.some(r=>r.sid===s),offer:!!document.querySelector('#nxPalList [data-srch-builder="1"]'),api:NAVX.search('workflow designer',{limit:30}).results.some(r=>r.sid===s)}),HIDDEN.screen);
if(h.inRows||h.api)fail('hidden screen '+HIDDEN.screen+' listed without builder mode');
if(!h.offer)fail('no builder mode offer when a hidden screen matches');
await p.click('#nxPalList [data-srch-builder="1"]');await p.waitForTimeout(150);
h=await p.evaluate(s=>({inRows:NAVX.int.PAL.rows.some(r=>r.sid===s),first:(NAVX.int.PAL.rows[0]||{}).sid,meta:((NAVX.int.PAL.rows.find(r=>r.sid===s)||{}).m)||''}),HIDDEN.screen);
if(!h.inRows)fail('hidden screen '+HIDDEN.screen+' not listed in builder mode');else console.log('ok   hidden screen in builder mode:',HIDDEN.screen,'|',h.meta);
if(!/Hidden from the menu/.test(h.meta))fail('hidden screen result does not say it is hidden: '+h.meta);
await p.evaluate(()=>{SRCH.setBuilder(false);NAVX.palette.close()});
// CL-75: under another tenant the palette shows no Meridian record, says how many it hid, and finds that tenant's own records
const tq=await p.evaluate(()=>{TENANT.switch('health');const pr=DATA.get('projects',{tenant:'health'})[0];return pr?pr.n:null});
await typeQ('lumen');
let ts=await p.evaluate(()=>({mer:NAVX.int.PAL.rows.filter(r=>r.ty!=='ask'&&SRCH.isMeridian([r.t,r.m,r.k].join(' '))).map(r=>r.t),note:!!document.querySelector('#nxPalList [data-srch-scope="health"]'),api:NAVX.search('lumen',{limit:50}).results.filter(r=>SRCH.isMeridian(r.title+' '+r.meta)).length}));
if(ts.mer.length||ts.api)fail('Meridian records in search under health: '+ts.mer.slice(0,3).join(' | ')+' api '+ts.api);
if(!ts.note)fail('no tenant scope note under health');else console.log('ok   under health "lumen": no Meridian records, scope note shown');
if(tq){await typeQ(tq);ts=await p.evaluate(q=>{const r=NAVX.int.PAL.rows.find(x=>x.t===q);return r?{m:r.m}:null},tq);
 if(!ts)fail('health project "'+tq+'" not found under health');else console.log('ok   under health finds its own project:',tq,'|',ts.m)}
await p.evaluate(()=>{NAVX.palette.close();TENANT.switch('core')});
console.log('cases',CASES.length,'| failures',bad,'| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();
