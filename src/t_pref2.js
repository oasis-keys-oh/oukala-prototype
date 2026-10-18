const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());await p.goto('file:///home/claude/oukala/build_out/full.html');await p.waitForTimeout(5000);
await p.evaluate(()=>document.getElementById('profilePop').showPopover());await p.waitForTimeout(500);
console.log('panel',await p.evaluate(()=>!!document.getElementById('r27Prefs')));
await p.click('input[data-r27p="lang"][value="fr"]',{force:true});await p.waitForTimeout(700);
console.log('lang',await p.evaluate(()=>[document.documentElement.lang,PREF.lang,localStorage.getItem('oukala-v2').includes('"lang":"fr"'),document.body.innerText.includes('Accueil')]));
await p.click('input[data-r27p="nav"][value="full"]',{force:true});await p.waitForTimeout(1500);
console.log('full nav',await p.evaluate(()=>[!!document.querySelector('.r27-all'),document.querySelectorAll('.rail details.navgd').length]));
await p.click('[data-r27-reset]',{force:true});await p.waitForTimeout(700);
console.log('reset',await p.evaluate(()=>[document.documentElement.lang,PREF.lang,PREF.nav,!!document.querySelector('.r27-all'),document.body.innerText.includes('Accueil')]));
await p.screenshot({path:'/home/claude/oukala/shots/r27_panel.png'});console.log('errs',errs);await b.close()})()
