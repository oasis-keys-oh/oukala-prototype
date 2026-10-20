const {chromium}=require('playwright');const path=require('path');
(async()=>{const [dir,id,sel,out,w,theme]=[path.resolve(process.argv[2]),process.argv[3],process.argv[4],process.argv[5],+process.argv[6]||1440,process.argv[7]||'dark'];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:w,height:900},colorScheme:theme})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
await p.evaluate(i=>go(i),id);await p.waitForTimeout(800);
const el=await p.$(sel);if(!el){console.log('no el');process.exit(1)}await el.scrollIntoViewIfNeeded();await p.waitForTimeout(300);await el.screenshot({path:out});await b.close()})();
