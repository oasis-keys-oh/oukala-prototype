const {chromium}=require('playwright');const path=require('path');
// node pp_m.js dir width scale(0/1) dark(0/1) scr:tab,scr:tab...
(async()=>{const a=process.argv.slice(2);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({reducedMotion:'reduce',colorScheme:a[3]==='1'?'dark':'light',viewport:{width:+a[1],height:1000}});const p=await c.newPage();p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CE',m.text())});
await p.goto('file://'+path.resolve(a[0]+'/full.html'));await p.waitForTimeout(400);
if(a[2]==='1')await p.evaluate(()=>SCALE.set(true));
for(const s of a[4].split(',')){const [scr,t]=s.split(':');const t0=Date.now();await p.evaluate(([scr,t])=>{S.pp2.tab[scr]=+t;go(scr);render()},[scr,t]);const ms=await p.evaluate(()=>{const t=performance.now();render();return Math.round(performance.now()-t)});await p.waitForTimeout(150);
await p.screenshot({path:`${a[0]}/shots/m_${scr}_${t}${a[2]==='1'?'_sc':''}${a[3]==='1'?'_dk':''}_${a[1]}.png`});console.log(scr,t,'render ms',ms)}
await b.close()})();
