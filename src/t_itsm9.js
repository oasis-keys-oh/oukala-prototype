const {chromium}=require('playwright');const path=require('path');
const phone=process.argv.includes('--phone'),dark=process.argv.includes('--dark'),scale=process.argv.includes('--scale');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.resolve('out_itsm/full.html'));await p.waitForTimeout(600);
const sd='out_itsm/shots/',sfx=(phone?'-phone':'')+(dark?'-dark':'')+(scale?'-scale':'');
if(scale)await p.evaluate(()=>SCALE.set(true));
const tabs={itsm_inc:5,itsm_prb:5,itsm_chg:6,itsm_mi:5};
for(const [s,n] of Object.entries(tabs))for(let t=0;t<n;t++){
 await p.evaluate(([s,t])=>{try{closeDrawer()}catch(e){}S.v[s]=t;go(s)},[s,t]).catch(e=>errs.push(s+t+e.message));await p.waitForTimeout(350);
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(ox)errs.push(s+' tab '+t+' overflowX');
 await p.screenshot({path:sd+s+'_t'+t+sfx+'.png',fullPage:!scale})}
console.log('errors:',errs.length?errs:'none');await b.close()})();
