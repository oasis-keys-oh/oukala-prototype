const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]);const code=fs.existsSync(process.argv[3])?fs.readFileSync(process.argv[3],'utf8'):process.argv[3];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());else if(process.argv.includes('--log'))console.log('LOG',m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.R16M&&R16M.ST&&R16M.ST.ok()&&R16M.wire&&(R16M.wire.tries>2||performance.now()>60000),null,{timeout:170000}).catch(e=>console.log('wait failed'));await p.waitForTimeout(1500);
const r=await p.evaluate(async c=>{try{return await (0,eval)('(async()=>{'+c+'})()')}catch(e){return 'ERR '+e.message+e.stack}},code);
console.log(typeof r==='string'?r:JSON.stringify(r,null,1));console.log('errors',errs.slice(0,10));await b.close()})();
