// keyboard audit: after navigation #view must show no ring; Tab visits real controls in DOM order, each with a visible ring; skip link works
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const theme=process.argv[3]||'dark';const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900},colorScheme:theme})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
const ring=()=>p.evaluate(()=>{const e=document.activeElement;if(!e)return null;const cs=getComputedStyle(e);return {tag:e.tagName,id:e.id,cls:e.className.toString().slice(0,24),txt:(e.innerText||e.getAttribute('aria-label')||'').slice(0,20).replace(/\n/g,' '),outline:cs.outlineStyle+' '+cs.outlineWidth,view:e.id==='view',tabindex:e.getAttribute('tabindex'),top:Math.round(e.getBoundingClientRect().top)}});
for(const id of ['home','metrics','inv','exe_dash']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(600);const r0=await ring();console.log(id,'after nav active=',r0.tag+'#'+r0.id,'outline',r0.outline);
 // simulate a keyboard user: press Tab 3 times from the page start then check rings
 await p.evaluate(()=>{document.activeElement&&document.activeElement.blur&&document.activeElement.blur();window.scrollTo(0,0)});
 const seq=[];for(let i=0;i<14;i++){await p.keyboard.press('Tab');const r=await ring();seq.push(r.tag+'.'+r.cls.split(' ')[0]+'['+r.txt+'] '+r.outline)}
 console.log(seq.join('\n'));}
// skip link
await p.evaluate(()=>{document.activeElement.blur();});await p.keyboard.press('Tab');const s=await ring();console.log('first tab target',JSON.stringify(s));await p.keyboard.press('Enter');await p.waitForTimeout(200);const a=await ring();console.log('after skip',JSON.stringify(a));
// mouse click on a card must not leave ring on view; programmatic focus then Tab
await b.close()})();
