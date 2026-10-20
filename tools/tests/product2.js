// Wave 4 stream product-2: one check per backlog row (PR-29, PR-30, CL-89, PR-18, CL-87, CL-30, PR-11, CL-79).
// Usage: node tools/tests/product2.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const root=path.resolve(__dirname,'../..');const fails=[];const ok=(c,m)=>{if(!c)fails.push(m)};

/* ---- CL-79: only the four kept generators remain; every retired script has a README line ---- */
const gens=fs.readdirSync(path.join(root,'tools/generators')).filter(f=>/\.(sh|py)$/.test(f)).sort();
ok(JSON.stringify(gens)===JSON.stringify(['bsow.sh','gen_pack.py','gen_scrmap.py']),'CL-79 tools/generators keeps only bsow, gen_pack and gen_scrmap (gen_num lives in tools/scratch): '+gens.join(', '));
ok(fs.existsSync(path.join(root,'tools/scratch/gen_num.js')),'CL-79 gen_num.js is kept');
const retDir=path.join(root,'tools/scratch/retired');const readme=fs.existsSync(path.join(retDir,'README.md'))?fs.readFileSync(path.join(retDir,'README.md'),'utf8'):'';
const retired=fs.existsSync(retDir)?fs.readdirSync(retDir).filter(f=>/\.(sh|py)$/.test(f)):[];
ok(retired.length>=12,'CL-79 at least 12 retired generator scripts, found '+retired.length);
retired.forEach(f=>ok(readme.indexOf('`'+f+'`')>=0,'CL-79 retired README has a line for '+f));

const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const open=async(opts)=>{const c=await b.newContext(Object.assign({viewport:{width:1440,height:900}},opts||{}));const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e)));await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view')&&window.APG&&APG.check&&window.CHATX&&CHATX.gateOrder,null,{timeout:120000});
 await p.waitForTimeout(1500);return{c,p,errs}};
const {c,p,errs}=await open();

/* ---- PR-30: an order from chat with no gate list decides each approval through APG.check ---- */
const r30=await p.evaluate(()=>{const out={};const mem=(APG.route('catalog',{})||{members:[]}).members;const other=mem.find(m=>m!=='Casey Rowan')||mem[0];
 const mk=gates=>({id:'SR-T30',by:'Casey Rowan',for:'Casey Rowan',state:'Approvals',gates:gates.map(w=>({who:w,why:'test',st:'pending'})),log:[],item:'laptop'});
 const a=CHATX.gateOrder(mk(['Casey Rowan']));out.sod={st:a.gates[0].st,rule:a.gates[0].apgCheck.rule,state:a.state};
 const b2=CHATX.gateOrder(mk([other]));out.member={who:other,st:b2.gates[0].st,rule:b2.gates[0].apgCheck.rule,state:b2.state};
 const src=String(CHATX.gateOrder);out.calls=/check\(/.test(src);return out});
ok(r30.calls,'PR-30 gateOrder calls APG.check');
ok(r30.sod.st==='pending'&&r30.sod.rule==='sod'&&r30.sod.state==='Approvals','PR-30 the requester cannot approve their own chat order: '+JSON.stringify(r30.sod));
ok(r30.member.st==='approved'&&r30.member.state==='Fulfillment','PR-30 a member of the routed group is recorded as approved: '+JSON.stringify(r30.member));

/* ---- CL-89: #nwPop and #r15GrpPop have a close control at the top right, in flow, and it closes the popover ---- */
for(const [name,opener] of [['nwPop','#nwBtn'],['r15GrpPop','[data-r15-grp]']]){
 await p.evaluate(()=>{try{go('wf_runs')}catch(e){}});await p.waitForTimeout(600);
 const r=await p.evaluate(([id,sel])=>{const o=document.querySelector(sel);if(!o)return{err:'no opener '+sel};o.click();const pop=document.getElementById(id);if(!pop||!pop.matches(':popover-open'))return{err:'did not open'};
  const x=pop.querySelector('[popovertargetaction=hide][aria-label=Close]');if(!x)return{err:'no close control'};const P=pop.getBoundingClientRect(),X=x.getBoundingClientRect();
  const cs=getComputedStyle(x);const over=[...pop.querySelectorAll('button:not([aria-label=Close])')].some(bn=>{const q=bn.getBoundingClientRect();return !(q.right<=X.left||q.left>=X.right||q.bottom<=X.top||q.top>=X.bottom)});
  x.click();return{dx:Math.round(P.right-X.right),dy:Math.round(X.top-P.top),pos:cs.position,over,closed:!pop.matches(':popover-open')}},[name,opener]);
 ok(!r.err,'CL-89 '+name+': '+r.err);
 if(!r.err)ok(r.dx>=0&&r.dx<=40&&r.dy>=0&&r.dy<=40&&r.pos==='static'&&!r.over&&r.closed,'CL-89 '+name+' close control top right, in flow, not over items, and it closes: '+JSON.stringify(r))}
const base=JSON.parse(fs.readFileSync(path.join(root,'tools/tests/nav_close_baseline.json'),'utf8'));
ok(!base.outliers.some(o=>/#nwPop|#r15GrpPop/.test(o.key)),'CL-89 nav_close baseline no longer lists #nwPop or #r15GrpPop');

/* ---- PR-18 follow-up: the CxO menu carries Strategy to execution and Demand and priorities, so wedge mode shows all ten COO screens ---- */
const r18=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));NAVX.persona.set('coo');await wait(600);SHOW.wedge.set(true);go('home');await wait(1200);
 const its=[...document.querySelectorAll('#nav [data-nx-it]')];const vis=its.filter(x=>!x.hidden&&x.offsetParent!==null).map(x=>x.dataset.nxIt);const w=SHOW.wedge.screens();
 const out={wedge:w.length,vis,missing:w.filter(i=>vis.indexOf(i)<0),extra:vis.filter(i=>w.indexOf(i)<0),note:!!document.querySelector('.srs-wnote')};
 const se=document.querySelector('#nav [data-nx-it=strat_exec] [data-nav]');if(se){se.click();await wait(400);out.opened=S.screen==='strat_exec'}
 SHOW.wedge.set(false);await wait(300);out.offStill=!!document.querySelector('#nav [data-nx-it=strat_exec]')&&!!document.querySelector('#nav [data-nx-it=port]');
 NAVX.persona.set('cio');await wait(400);return out});
ok(r18.wedge===10&&!r18.missing.length&&!r18.extra.length&&r18.note,'PR-18 COO wedge mode shows exactly the ten COO screens: '+JSON.stringify(r18));
ok(r18.opened,'PR-18 Strategy to execution opens from the CxO menu');
ok(r18.offStill,'PR-18 the CxO menu keeps Strategy to execution and Demand and priorities with wedge mode off');

/* ---- CL-87: builder mode (hidden screens in search) only for the Tenant admin and Architect roles, with a note for others ---- */
const pal=async q=>{await p.evaluate(()=>{try{NAVX.palette.close()}catch(e){}go('home');NAVX.openPalette({})});await p.waitForSelector('#nxPalIn',{state:'visible'});await p.fill('#nxPalIn',q);
 await p.waitForFunction(q=>NAVX.int.PAL.q===q&&document.querySelector('#nxPalList [data-nx-i="0"]'),q,{timeout:10000});await p.waitForTimeout(120)};
const palState=()=>p.evaluate(()=>({offer:!!document.querySelector('#nxPalList [data-srch-builder="1"]'),locked:(document.querySelector('#nxPalList [data-srch-locked]')||{}).textContent||'',
 listed:NAVX.int.PAL.rows.some(r=>r.sid==='flw_design'),can:SRCH.canBuild(),on:SRCH.builder()}));
// a person with neither role (Grace Oduya has no membership in the Meridian tenant) under the CIO persona
await p.evaluate(()=>{window.__p2cur=IDENT.cur;IDENT.cur='grace-oduya';NAVX.persona.set('exec');U.store.set('falconaire-search-builder',true);SRCH.dirty()});
await pal('workflow designer');let s87=await palState();
const set87=await p.evaluate(()=>SRCH.setBuilder(true));
ok(!s87.can&&!s87.on&&!s87.listed&&!s87.offer&&/Tenant admin and Architect/.test(s87.locked)&&/simulated/.test(s87.locked)&&set87===false,'CL-87 without the role: no builder mode, no switch, a clear note: '+JSON.stringify(s87)+' set='+set87);
// the Architect persona grants it
await p.evaluate(()=>{NAVX.persona.set('arch');SRCH.dirty()});await pal('workflow designer');s87=await palState();
ok(s87.can&&s87.on&&s87.listed,'CL-87 the Architect persona gets builder mode: '+JSON.stringify(s87));
// an identity with the Architect role (Jordan Lee) under a non-builder persona
await p.evaluate(()=>{IDENT.cur='jordan-lee';NAVX.persona.set('exec');SRCH.dirty()});await pal('workflow designer');s87=await palState();
ok(s87.can&&s87.on&&s87.listed,'CL-87 the Architect role (IDENT) gets builder mode: '+JSON.stringify(s87));
// the presenter (Tenant admin in the Meridian tenant) keeps the offer
await p.evaluate(()=>{IDENT.cur=window.__p2cur;U.store.set('falconaire-search-builder',false);SRCH.dirty()});await pal('workflow designer');s87=await palState();
ok(s87.can&&!s87.on&&s87.offer&&!s87.listed,'CL-87 the Tenant admin is offered builder mode: '+JSON.stringify(s87));
await p.evaluate(()=>{try{NAVX.palette.close()}catch(e){}});

/* ---- PR-29: the Value screen and its exports hide NPV and ROI until a platform quote is entered; benefits still show, labeled modeled ---- */
const r29=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const MSG='Enter a platform quote to see NPV and ROI';const o={};
 const look=()=>{const v=document.querySelector('#view');const t=v.innerText;const res=document.getElementById('r17q-res');const rt=res?res.innerText:'';const share=(document.getElementById('r17q-share')||{}).value||'';
  const css=R17Q.csv(),html=R17Q.caseHTML();
  return{note:!!document.querySelector('#view [data-r17q-quote]'),msg:t.indexOf(MSG)>=0,npvTile:/net present value\s*\n?\s*-?\$/i.test(rt),npvCell:/-year NPV/.test(rt),roiCell:/\bROI\b/.test(rt.split(MSG).join('')),
   benefit:/Annual benefit at full adoption/.test(rt)&&/modeled/i.test(rt),pv:/Present value/.test(rt),
   csvNpv:/-year NPV|Present value/.test(css),csvMsg:css.indexOf(MSG)>=0,caseNpv:/<th class="n">NPV<\/th>/.test(html),caseMsg:html.indexOf(MSG)>=0,
   shareMsg:share.indexOf(MSG)>=0,lines:R17Q.lines(R17Q.model(R17Q.inputs())).filter(l=>l.id==='npv'||l.id==='roi').map(l=>[l.v,R17Q.fmtLine(l)])}};
 R17Q.inputs&&1;S.v.r17qv=1;go('r17q_value');await wait(500);
 const pin=document.getElementById('r17q-i-price');if(pin){pin.value='0';pin.dispatchEvent(new Event('input',{bubbles:true}))}await wait(200);
 o.before=look();
 S.v.r17qv=2;render();await wait(300);o.before.shareMsg=((document.getElementById('r17q-share')||{}).value||'').indexOf(MSG)>=0;
 S.v.r17qv=1;render();await wait(300);
 const pin2=document.getElementById('r17q-i-price');pin2.value='120';pin2.dispatchEvent(new Event('input',{bubbles:true}));await wait(300);
 o.after=look();
 pin2.value='0';pin2.dispatchEvent(new Event('input',{bubbles:true}));await wait(100);return o});
const B=r29.before,A=r29.after;
ok(B.note&&B.msg&&!B.npvTile&&!B.npvCell&&!B.roiCell&&!B.pv&&B.benefit,'PR-29 without a quote the screen shows the prompt, benefits labeled modeled, and no NPV, ROI or present value: '+JSON.stringify(B));
ok(B.lines.every(l=>l[0]==null&&l[1]==='Enter a platform quote to see NPV and ROI'),'PR-29 the NPV and ROI lines carry no number: '+JSON.stringify(B.lines));
ok(!B.csvNpv&&B.csvMsg&&!B.caseNpv&&B.caseMsg&&B.shareMsg,'PR-29 the CSV, the one-page business case and the share text follow the same rule: '+JSON.stringify(B));
ok(!A.note&&A.npvTile&&A.npvCell&&A.pv&&A.csvNpv&&A.caseNpv&&!A.caseMsg,'PR-29 with a quote NPV and ROI appear everywhere: '+JSON.stringify(A));

/* ---- PR-11: simulated contract ingestion: a local PDF, Word or text file is read by name and size only, never sent anywhere,
   and a simulated extraction labeled simulated is attached to the contract record ---- */
{const sent=[];const onReq=r=>{const u=r.url();if(!/^(file|data|blob):/.test(u))sent.push(u)};p.on('request',onReq);
 await p.evaluate(()=>{go('ppm_sow');SOWX.openRecord('CLM-1001')});await p.waitForSelector('#drawer [data-sow-ingest="CLM-1001"]',{state:'attached',timeout:8000});
 const n0=await p.evaluate(()=>SOWX.ingest.files('CLM-1001').length);
 await p.setInputFiles('#drawer [data-sow-ingest="CLM-1001"]',{name:'Lumen_MSA_2026.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(90000,1)});await p.waitForTimeout(500);
 const r11=await p.evaluate(()=>{const f=SOWX.ingest.files('CLM-1001')[0]||{};const d=document.querySelector('#drawer [data-sow-ig]');const t=d?d.innerText:'';
  return{name:f.name,size:f.size,sim:f.simulated,kind:f.ext&&f.ext.kind,onRecord:(SOWX.contract('CLM-1001').files||[]).length,shown:t.indexOf('Lumen_MSA_2026.pdf')>=0,label:/Simulated extraction/.test(t),simCount:(t.match(/simulated/gi)||[]).length,nothingUploaded:/nothing is uploaded/i.test(t),stored:Object.keys(U.store.get('falconaire.sow.ingest',{})).indexOf('CLM-1001')>=0}});
 await p.setInputFiles('#drawer [data-sow-ingest="CLM-1001"]',{name:'notes.xlsx',mimeType:'application/vnd.ms-excel',buffer:Buffer.alloc(10,1)});await p.waitForTimeout(300);
 const n2=await p.evaluate(()=>SOWX.ingest.files('CLM-1001').length);
 await p.setInputFiles('#drawer [data-sow-ingest="CLM-1001"]',{name:'Lumen SOW-4 redline.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:Buffer.alloc(40000,1)});await p.waitForTimeout(400);
 const r11b=await p.evaluate(()=>{const L=SOWX.ingest.files('CLM-1001');return{n:L.length,kind:L[0].ext.kind,rm:(()=>{const b=document.querySelector('#drawer [data-sow-igdel]');if(!b)return false;b.click();return true})()}});await p.waitForTimeout(300);
 const n3=await p.evaluate(()=>SOWX.ingest.files('CLM-1001').length);p.off('request',onReq);
 ok(r11.name==='Lumen_MSA_2026.pdf'&&r11.size===90000&&r11.sim===true&&r11.kind==='MSA'&&r11.onRecord===n0+1,'PR-11 the PDF is attached to the record with its name and size and a simulated extraction: '+JSON.stringify(r11));
 ok(r11.shown&&r11.label&&r11.simCount>=8&&r11.nothingUploaded&&r11.stored,'PR-11 the record shows the file and labels every extracted value simulated: '+JSON.stringify(r11));
 ok(n2===n0+1,'PR-11 an unsupported file type is refused');
 ok(r11b.n===n0+2&&r11b.kind==='SOW'&&r11b.rm&&n3===n0+1,'PR-11 a Word file attaches too, and Remove detaches it: '+JSON.stringify(r11b)+' after '+n3);
 ok(!sent.length,'PR-11 no network request while ingesting: '+sent.slice(0,3).join(', '));
 await p.evaluate(()=>{try{closeDrawer()}catch(e){}SOWX.ingest.files('CLM-1001').forEach(f=>SOWX.ingest.remove('CLM-1001',f.id))})}

/*@@NEXT@@*/

ok(!errs.length,'page errors: '+errs.slice(0,3).join(' | '));
await b.close();
if(fails.length){console.log('product2 FAIL\n - '+fails.join('\n - '));process.exit(1)}
console.log('product2 ok');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
