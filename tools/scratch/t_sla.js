const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.env.OUT||'out_sla');const args=process.argv.slice(2);const dark=args.includes('--dark'),phone=args.includes('--phone'),scale=args.includes('--scale');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
if(scale)await p.evaluate(()=>SCALE.set(true));
const tabs=(args.find(a=>/^t=/.test(a))||'t=0,1,2,3,4,5').slice(2).split(',').map(Number);
const sfx=(dark?'-dark':'')+(phone?'-phone':'')+(scale?'-scale':'');
for(const i of tabs){const t0=Date.now();await p.evaluate(i=>{S.v.svc_slav=i;go('svc_sla');render()},i);await p.waitForTimeout(1600);const ms=Date.now()-t0-1600;
 const h=await p.evaluate(()=>{const m=document.querySelector('main')||document.body;return document.documentElement.scrollWidth>innerWidth+1});
 await p.screenshot({path:`${dir}/shots/sla_t${i}${sfx}.png`,fullPage:true});console.log('tab',i,'overflowX',h)}
console.log('errors:',errs.length?errs:'none');await b.close()})();
