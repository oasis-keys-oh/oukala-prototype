// usage: node pt_atlas.js OUT name WIDTH [dark] "js steps"
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [,,out,name,w,dark,steps]=process.argv;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:+w,height:+(process.env.H||1000)},colorScheme:dark==='dark'?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(out,'full.html'));await p.waitForTimeout(500);await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(400);
if(steps){for(const s of steps.split(';;')){await p.evaluate(s);await p.waitForTimeout(500)}}
const el=await p.$('.at-root, .at-lin, .at-dm, .at-old');if(process.env.CLIP){await p.evaluate(()=>{const v=document.querySelector('.at-vpbox,.at-lbox');if(v)v.scrollIntoView({block:'start'});else window.scrollTo(0,0)});await p.waitForTimeout(200)}
const f=path.resolve(out,'shots','at_'+name+'.png');await p.screenshot({path:f});console.log(f,errs);await b.close()})();
