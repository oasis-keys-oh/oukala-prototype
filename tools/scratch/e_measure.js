/* usage: node zl_measure.js <html> <out.json> [nofix-inject]  : runs ZLINK.audit and writes counts */
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const inject=process.argv[4];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(120000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());
if(inject)await p.addInitScript(()=>{window.__ZLINK_NOFIX=1});
await p.goto('file://'+path.resolve(process.argv[2]));await p.waitForFunction(()=>window.ZLINK&&ZLINK.state.fixed.fx_r15e_c,null,{timeout:90000}).catch(()=>{});await p.waitForTimeout(1500);
if(inject)await p.addScriptTag({content:fs.readFileSync('mod_zlink.js','utf8')});
const r=await p.evaluate(()=>{const t0=performance.now();const a=ZLINK.audit();const dl=ZLINK.deadLinks();
 return {ms:Math.round(performance.now()-t0),score:ZLINK.score(),findings:a.checks.reduce((n,c)=>n+c.bad,0),checks:Object.fromEntries(a.checks.map(c=>[c.id,c.bad])),totals:Object.fromEntries(a.checks.map(c=>[c.id,c.total])),dead:dl.out.length,deadTotal:dl.total,
  names:Object.fromEntries(a.checks.map(c=>[c.id,c.name])),sample:Object.fromEntries(a.checks.filter(c=>c.bad).map(c=>[c.id,c.items.slice(0,3).map(i=>i.label+' | '+i.detail)])),ip:ZLINK.interop().consumers.map(c=>c.id+':'+c.updated),log:ZLINK.log().map(l=>l.id+' '+l.n+' '+l.state)}});
r.errs=errs.slice(0,10);fs.writeFileSync(process.argv[3],JSON.stringify(r,null,1));
console.log('ms',r.ms,'score',r.score,'findings',r.findings,'dead',r.dead+'/'+r.deadTotal);console.log(Object.entries(r.checks).map(([k,v])=>k+'='+v+'/'+r.totals[k]).join('  '));console.log('IP',r.ip.join(' '));console.log('ERR',r.errs);await b.close()})();
