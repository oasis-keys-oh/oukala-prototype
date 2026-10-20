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

/*@@NEXT@@*/

ok(!errs.length,'page errors: '+errs.slice(0,3).join(' | '));
await b.close();
if(fails.length){console.log('product2 FAIL\n - '+fails.join('\n - '));process.exit(1)}
console.log('product2 ok');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
