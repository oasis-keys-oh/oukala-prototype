const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const out={};
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(250);
 out[id]=await p.evaluate(()=>{const v=document.querySelector('#view');const h=v.querySelector('.hero');const h1s=v.querySelectorAll('h1');const first=v.querySelector('h1');
  const r={hero:!!h,h1:h1s.length,eyebrow:!!(h&&h.querySelector('.eyebrow')),story:!!(h&&h.querySelector('.story')),h1fs:first?Math.round(parseFloat(getComputedStyle(first).fontSize)):0,h1ff:first?getComputedStyle(first).fontFamily.split(',')[0]:'',h1top:first?Math.round(first.getBoundingClientRect().top-v.getBoundingClientRect().top):-1,h1InHero:!!(first&&first.closest('.hero')),pad:h?getComputedStyle(h).padding:'' ,firstChildCls:(v.firstElementChild&&v.firstElementChild.firstElementChild?v.firstElementChild.firstElementChild.className.toString().slice(0,20):'')};return r})}
fs.writeFileSync('aud14/hdr.json',JSON.stringify(out,null,1));
const bad=Object.entries(out).filter(([k,r])=>!r.hero||!r.eyebrow||!r.story||r.h1!==1||r.h1fs!==34&&r.h1fs!==0);console.log('screens',ids.length,'drift',bad.length);bad.forEach(([k,r])=>console.log(k,JSON.stringify(r)));await b.close()})();
