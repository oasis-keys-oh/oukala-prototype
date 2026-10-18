const {chromium}=require('playwright');
(async()=>{const dir=require('path').resolve(process.argv[2]);const light=process.argv.includes('--light');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:light?'light':'dark'});const p=await c.newPage();
p.setDefaultTimeout(120000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(2500);
const sfx=light?'_l':'_d';const S=n=>p.screenshot({path:dir+'/shots/'+n+sfx+'.png'});
await p.evaluate(()=>go('home'));await p.waitForTimeout(600);
// favorites accordion open
await p.click('.nx-favs .nx-fh');await p.waitForTimeout(300);await S('v_favopen');
await p.click('.nx-favs .nx-fh');await p.waitForTimeout(200);
// star dropdown
await p.click('[popovertarget=nxFavPop]');await p.waitForTimeout(500);await p.fill('#r16FavQ','lead');await p.waitForTimeout(200);await S('v_favpop');
await p.keyboard.press('Escape');await p.waitForTimeout(200);
// budget section
await p.evaluate(()=>{S.navOpen=S.navOpen||{};S.navOpen.r16bud=true;renderNav()});await p.waitForTimeout(400);
await p.click('[data-r16-bud=mine]');await p.waitForTimeout(900);await S('v_budmine');
console.log(JSON.stringify(await p.evaluate(()=>({scr:S.screen,nwRb:!!document.querySelector('#nwRb'),bar:!!document.querySelector('#r16BudBar'),rows:[...document.querySelectorAll('#view tbody tr')].filter(r=>!r.hidden).length}))));
// portal
await p.evaluate(()=>{location.hash='#portal'});await p.waitForTimeout(1500);await S('v_portal');
console.log(JSON.stringify(await p.evaluate(()=>({scr:S.screen,hash:location.hash,lay:document.documentElement.dataset.r16Layout}))));
// employee persona
await p.click('#r15dVasBtn');await p.waitForTimeout(300);await p.click('[data-r15d-role=emp]');await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.evaluate(()=>({p:S.persona,lay:document.documentElement.dataset.r16Layout,scr:S.screen}))));
await p.evaluate(()=>go('svc_portal'));await p.waitForTimeout(900);await S('v_portal_emp');
await p.fill('[data-r16p-q]','laptop');await p.waitForTimeout(400);await S('v_portal_search');
console.log(JSON.stringify(await p.evaluate(()=>({lay:document.documentElement.dataset.r16Layout,tiles:document.querySelectorAll('.r16p-tile').length,rail:getComputedStyle(document.querySelector('.rail')).display}))));
console.log('errors',errs);await b.close()})();
