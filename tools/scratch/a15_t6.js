const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const d of process.argv.slice(2)){
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(d+'/full.html'),{waitUntil:'load',timeout:120000});await p.waitForTimeout(6000);
const r=await p.evaluate(()=>{const a=ZLINK.audit(true);const o={dead:a.deadTotal,checks:Object.fromEntries(Object.entries(a.checks||{}).map(([k,v])=>[k,v&&(v.n!=null?v.n:v.bad!=null?v.bad:(v.items?v.items.length:typeof v==='object'?JSON.stringify(v).slice(0,30):v))]))};
 go('zl_conn');render();o.score=METRICS.m_zl_score.cur;return o});console.log(d,JSON.stringify(r).slice(0,1500),errs);await p.close()}
await b.close()})();
