const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
// ID=x TABS="0|1" (index or name) W=1440 DARK=1 SC=1 FULL=1 EV=js OUT=out_fix_itsm
const ID=process.env.ID,TABS=(process.env.TABS||"0").split("|");const OUT=process.env.OUT||'out_fix_itsm';
const W=+process.env.W||1440,DARK=!!process.env.DARK,SC=!!process.env.SC,FULL=process.env.FULL!=='0',H=+process.env.H||1000;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:W,height:H},colorScheme:DARK?'dark':'light'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve(OUT+'/full.html'));await p.waitForTimeout(500);
if(SC){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(500)}
let t0=Date.now();await p.evaluate(i=>go(i),ID);await p.waitForTimeout(300);console.log('go ms',Date.now()-t0);
fs.mkdirSync(OUT+'/shots',{recursive:true});
for(const t of TABS){t0=Date.now();
 const names=await p.evaluate((t)=>{const v=document.querySelector('#view');const ls=[...v.querySelectorAll('.vsw label, .views label, .vtabs label')];const l=/^\d+$/.test(t)?ls[+t]:ls.find(x=>x.textContent.trim().startsWith(t));if(l)l.click();return ls.map(x=>x.textContent.trim())},t);
 await p.waitForTimeout(500);if(process.env.EV){await p.evaluate(process.env.EV);await p.waitForTimeout(400)}
 const f=`${OUT}/shots/${ID}_${t.replace(/\W+/g,'_')}_${W}${DARK?'d':''}${SC?'s':''}.png`;await p.screenshot({path:f,fullPage:FULL});
 console.log(t,'ms',Date.now()-t0,'h',await p.evaluate(()=>document.documentElement.scrollHeight),f);if(t===TABS[0])console.log('tabs',names.join(' | '))}
console.log('errs',errs.slice(0,5));await b.close()})();
