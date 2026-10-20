const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:180000});await p.waitForTimeout(8000);
const r=await p.evaluate(()=>{R15D.contractWire();const o={st:R15D.contractState()};['r15d_agents','r15d_facts','r15d_evidence','r15d_firstweek','plat_zlink','own_gaps'].forEach(id=>{try{const e=CONTRACT.evaluate(id);o[id]=e&&{score:e.score,rules:(e.rules||[]).map(x=>x.id+':'+x.st+(x.st!=='pass'?' '+x.ev:''))}}catch(x){o[id]='ERR '+x.message}});return o});
console.log(JSON.stringify(r,null,1));console.log(errs);await b.close()})();
