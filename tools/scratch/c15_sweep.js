// node c15_sweep.js OUT [--phone] [--dark] [--only a,b] > json
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]);const phone=a.includes('--phone'),dark=a.includes('--dark');const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));const out=[];
for(const id of ids){const n0=errs.length;const t0=Date.now();await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(220);
 const r=await p.evaluate(()=>{const v=document.querySelector('#view');const h=v.querySelector('h1');const m=NAVX.resolve(S.screen);const lab=NAVX.label(S.screen);const crumb=(v.querySelector('.r15-crumb [aria-current]')||{}).textContent||'';
  const nm=el=>(el.getAttribute('aria-label')||el.textContent||el.title||'').trim();
  const unnamed=[...v.querySelectorAll('button,a[href],[role=button],input:not([type=hidden]),select,textarea')].filter(e=>e.offsetParent&&!nm(e)&&!e.getAttribute('aria-labelledby')&&!(e.id&&document.querySelector('label[for="'+e.id+'"]'))&&!e.closest('label')).length;
  const small=[...v.querySelectorAll('button,a[href],[role=button],[role=tab],select,input:not([type=hidden]):not([type=radio]):not(.sr)')].filter(e=>{if(!e.offsetParent)return false;const r=e.getBoundingClientRect();return r.width>0&&(r.height<44||r.width<44)&&r.height>0}).length;
  return {id:S.screen,label:lab,h1:h?h.textContent.trim():'',crumb,title:document.title,hash:location.hash,ox:document.documentElement.scrollWidth>innerWidth+1,len:v.innerHTML.length,unnamed,small,same:(h&&h.textContent.trim()===lab)&&crumb===lab&&document.title.indexOf(lab)===0}});
 r.ms=Date.now()-t0;r.errs=errs.slice(n0);out.push(r)}
console.log(JSON.stringify(out));await b.close()})();
