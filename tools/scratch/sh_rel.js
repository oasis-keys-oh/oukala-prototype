const {chromium}=require('playwright');const path=require('path');
// usage: node sh_rel.js out screen tabVar tabIdx width [dark] [evalJS]
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),id=a[1],tv=a[2],ti=+a[3],w=+a[4],dark=a.includes('dark');const ev=a.find(x=>x.startsWith('ev:'));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);await p.evaluate(([i,tv,ti])=>{S.v[tv]=ti;go(i)},[id,tv,ti]);await p.waitForTimeout(300);if(ev){await p.evaluate(ev.slice(3));await p.waitForTimeout(400)}
const f=path.join(dir,'shots',`${id}-${ti}-${w}${dark?'-d':''}${ev?'-e':''}.png`);await p.screenshot({path:f,fullPage:!ev});console.log(f,errs.slice(0,5));
const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);console.log('hscroll',ov);await b.close()})();
