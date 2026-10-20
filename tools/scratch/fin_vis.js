const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(700);
for(const s of ['fin_model','fin_color','fin_spend','fin_budget','fin_gates','fin_alloc','fin_rules']){for(let v=0;v<6;v++){const r=await p.evaluate(([s,v])=>{try{S.v=S.v||{};S.v[s]=v;go(s);const t=document.querySelector('.screen');return t?t.innerText.length:-1}catch(e){return 'ERR '+e.message+' '+(e.stack||'').split('\n')[1]}},[s,v]);console.log(s,v,r)}}
console.log('ERRS',errs.slice(0,10));await b.close()})();
