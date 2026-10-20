const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
// usage: ID=x TABS="A|B|C" W=1440 [DARK=1] [SC=1] [FULL=1] [EV=js]
const ID=process.env.ID,TABS=(process.env.TABS||"").split("|").filter(Boolean);
const W=+process.env.W||1440,DARK=!!process.env.DARK,SC=!!process.env.SC,FULL=process.env.FULL==='1',H=+process.env.H||1000;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:W,height:H},colorScheme:DARK?'dark':'light'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_fix_exm/full.html'));await p.waitForTimeout(800);
if(SC){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(800)}
await p.evaluate(i=>go(i),ID);await p.waitForTimeout(700);
for(const t of TABS){
 const t0=Date.now();
 const ok=await p.evaluate((t)=>{const v=document.querySelector('#view');const bs=[...v.querySelectorAll('.vsw label,button,[role=tab],a')].filter(b=>b.textContent.trim()===t||b.textContent.trim().startsWith(t));if(!bs.length)return false;bs[0].click();return true},t);
 await p.waitForTimeout(900);
 if(process.env.EV){await p.evaluate(process.env.EV);await p.waitForTimeout(500)}
 const slug=t.replace(/[^a-z0-9]+/ig,'_').slice(0,20);
 const f=`out_fix_exm/shots/${ID}__${slug}-${W}${DARK?'-dark':''}${SC?'-sc':''}.png`;
 await p.screenshot({path:f,fullPage:FULL});
 const h=await p.evaluate(()=>document.documentElement.scrollHeight);
 console.log(t,ok,h,Date.now()-t0,f)}
console.log(errs.slice(0,6));await b.close()})();
