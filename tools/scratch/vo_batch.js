const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const IDS=(process.env.IDS||"").split(" ").filter(Boolean);
const W=+process.env.W||1440, DARK=!!process.env.DARK, SC=!!process.env.SC, H=+process.env.H||1000, FULL=!!process.env.FULL, MET=!!process.env.MET;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:W,height:H},colorScheme:DARK?'dark':'light'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
if(SC){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(800)}
for(const id of IDS){const t0=Date.now();await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+e.message));await p.waitForTimeout(700);
const m=await p.evaluate((MET)=>{const r={h:document.documentElement.scrollHeight,ox:document.documentElement.scrollWidth>innerWidth+1};
if(MET){const v=document.querySelector('#view');r.nodes=v.querySelectorAll('*').length;
const nm=e=>(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||'').trim();
r.noname=[...v.querySelectorAll('button,a[href],[role=button],[role=tab]')].filter(e=>!nm(e)).length;
r.nolabel=[...v.querySelectorAll('input,select,textarea')].filter(e=>e.type!=='hidden'&&!e.getAttribute('aria-label')&&!(e.id&&document.querySelector('label[for="'+e.id+'"]'))&&!e.closest('label')&&!e.getAttribute('placeholder')&&!e.title).length;
r.noalt=[...v.querySelectorAll('img:not([alt])')].length;
r.svgnolabel=[...v.querySelectorAll('svg')].filter(s=>s.getBoundingClientRect().width>150&&!s.getAttribute('aria-label')&&!s.getAttribute('role')&&!s.querySelector('title')).length;
const small=[];for(const e of v.querySelectorAll('*')){if(e.children.length)continue;const t=(e.textContent||'').trim();if(!t)continue;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<11.5&&e.getBoundingClientRect().width>0)small.push(fs+':'+t.slice(0,20))}
r.small=small.length;r.smallS=small.slice(0,4);
const clip=[];for(const e of v.querySelectorAll('*')){const cs=getComputedStyle(e);if(e.children.length===0&&e.textContent.trim()&&e.scrollWidth>e.clientWidth+2&&e.clientWidth>0&&(cs.overflow!=='visible'||cs.textOverflow==='ellipsis'))clip.push(e.textContent.trim().slice(0,30))}
r.clip=clip.length;r.clipS=clip.slice(0,4);
r.tabbable=[...v.querySelectorAll('div[onclick],span[onclick],[data-nav]:not(button):not(a)')].filter(e=>!e.getAttribute('tabindex')&&!e.getAttribute('role')).length;
}return r},MET);
const f=`vo/shots/${id}-${W}${DARK?'-dark':''}${SC?'-sc':''}.png`;await p.screenshot({path:f,fullPage:FULL});
console.log(id,W,JSON.stringify(m),Date.now()-t0)}
console.log(errs.slice(0,10));await b.close()})();
