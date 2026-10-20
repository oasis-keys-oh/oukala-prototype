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

/*@@NEXT@@*/

ok(!errs.length,'page errors: '+errs.slice(0,3).join(' | '));
await b.close();
if(fails.length){console.log('product2 FAIL\n - '+fails.join('\n - '));process.exit(1)}
console.log('product2 ok');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
