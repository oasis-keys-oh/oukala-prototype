const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const code=fs.readFileSync(process.argv[3],'utf8');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());else if(m.text().startsWith('PR:'))console.log(m.text())});
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(800);
try{const r=await p.evaluate(code);console.log(typeof r==='string'?r:JSON.stringify(r,null,1))}catch(e){console.log('EVALERR',e.message)}
console.log('errors:',errs.length?errs:'none');await b.close()})();
