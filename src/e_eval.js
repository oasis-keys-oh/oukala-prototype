const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const dir=process.argv[2],code=fs.readFileSync(process.argv[3],'utf8');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(120000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(dir,'full.html'));await p.waitForTimeout(3500);
const r=await p.evaluate(code).catch(e=>'EVALERR '+e.message);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));if(errs.length)console.log('ERRS',errs.slice(0,5));await b.close()})();
