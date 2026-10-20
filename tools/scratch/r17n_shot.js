const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h,tag] of [[1440,900,'desktop'],[400,860,'phone']]) for(const scheme of ['light','dark']){
const c=await b.newContext({viewport:{width:w,height:h},colorScheme:scheme,hasTouch:w<500});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.cwd()+'/out_n17/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(900);
await p.evaluate(()=>{S.persona='exec';go('home')});await p.waitForTimeout(400);
await p.evaluate(()=>{INBOX.state.quiet.on=false;R17N.clear()});await p.waitForTimeout(500);console.log('pre',await p.evaluate(()=>[...document.querySelectorAll('.r17n-card')].map(c=>c.getAttribute('aria-label'))));await p.evaluate(()=>{R17N.demo(4)});await p.waitForTimeout(900);
await p.screenshot({path:`r17_shots/n_${tag}_${scheme}_stack4.png`});
console.log(tag,scheme,await p.evaluate(()=>{const l=document.getElementById('toasts');const r=l.getBoundingClientRect();return JSON.stringify({top:r.top,right:innerWidth-r.right,w:r.width,cards:R17N.count(),vis:[...l.querySelectorAll('.r17n-card')].filter(c=>c.offsetParent).length,more:(l.querySelector('.r17n-more')||{}).textContent})}));
if(scheme==='light'){await p.click('.r17n-more');await p.waitForTimeout(500);await p.screenshot({path:`r17_shots/n_${tag}_${scheme}_expanded.png`});await p.click('.r17n-more');
 await p.evaluate(()=>{R17N.clear()});await p.waitForTimeout(500);
 await p.evaluate(()=>{INBOX.simNow()});await p.waitForTimeout(700);await p.screenshot({path:`r17_shots/n_${tag}_${scheme}_inbox_banner.png`});
 // approve via banner
 const ok=await p.evaluate(()=>{const a=[...document.querySelectorAll('.r17n-act')].find(x=>x.textContent==='Approve');if(a){a.click();return true}return false});await p.waitForTimeout(700);
 console.log('approve clicked',ok,await p.evaluate(()=>[...document.querySelectorAll('.r17n-card')].map(c=>c.getAttribute('aria-label')+'|'+[...c.querySelectorAll('.r17n-act')].map(x=>x.textContent))));
 await p.screenshot({path:`r17_shots/n_${tag}_${scheme}_undo.png`});
 await p.evaluate(()=>{const a=[...document.querySelectorAll('.r17n-undo .r17n-act')][0];a&&a.click()});await p.waitForTimeout(600);
 console.log('after undo',await p.evaluate(()=>[...document.querySelectorAll('.r17n-card')].map(c=>c.getAttribute('aria-label')).join(' // ')));
 await p.evaluate(()=>{toast('Saved','good');toast('Saved','good');toast('Invoice INV-2207 is waiting for the Finance approver group','info')});await p.waitForTimeout(600);await p.screenshot({path:`r17_shots/n_${tag}_${scheme}_toasts.png`});
 await p.keyboard.press('Tab');
 console.log('hist',await p.evaluate(()=>R17N.history().length));
}
console.log('errs',errs);await c.close()}
await b.close()})();
