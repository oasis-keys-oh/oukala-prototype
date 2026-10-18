const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const tag=process.argv[3]||'x';const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
await p.evaluate(()=>go('exe_dash'));await p.waitForTimeout(800);
const ids=await p.evaluate(()=>[...document.querySelectorAll('[data-k="m_riskexp"]')].map(e=>e.className+' '+e.tagName+' '+e.offsetParent));console.log(ids);
await p.evaluate(()=>{const e=document.querySelector('button.fkpi[data-k="m_riskexp"],.fchip[data-k="m_riskexp"]');if(e)e.click()});await p.waitForTimeout(500);
await p.screenshot({path:`aud14/pop_${tag}.png`});
// hover tooltip
await p.keyboard.press('Escape');
await p.evaluate(()=>go('metrics'));await p.waitForTimeout(600);await p.screenshot({path:`aud14/met_${tag}.png`});
await b.close()})();
