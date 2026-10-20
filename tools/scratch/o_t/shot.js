const {chromium}=require('playwright');const path=require('path');
const [,,out,name,w,...rest]=process.argv;const dark=rest.includes('--dark');
const ev=(rest.find(a=>a.startsWith('--eval='))||'').slice(7);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:+w||1440,height:+(rest.find(a=>a.startsWith('--h='))||'--h=900').slice(4)},colorScheme:dark?'dark':'light'});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto('file://'+path.resolve(out+'/full.html'));await p.waitForTimeout(3200);
await p.evaluate(()=>{S.persona="exec";go("org_chart")});await p.waitForTimeout(700);
if(ev){await p.evaluate(ev);await p.waitForTimeout(900)}
const full=rest.includes('--full');
await p.screenshot({path:out+'/o_'+name+'.png',fullPage:full});
const ov=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
console.log('overflow',JSON.stringify(ov));if(errs.length)console.log('ERRORS',errs.slice(0,8));await b.close()})()
