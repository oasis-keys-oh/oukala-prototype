const {chromium}=require('playwright');const path=require('path');
// usage: node b15/clicks.js OUTDIR [--dark] [--phone]  -> real click counts from the Home screen to an open form, per create action
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const dark=a.includes('--dark'),phone=a.includes('--phone');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource/.test(m.text())&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:240000});await p.waitForTimeout(3500);
if(dark)await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
const open=()=>p.evaluate(()=>{const d=document.querySelector('#drawer');return d&&d.matches(':popover-open')?((d.querySelector('.ftitle')||d.querySelector('h3')||{}).textContent||'(open)'):null});
const out=[];
for(const k of ['budget-request','order','incident','change','demand','po','person']){
 await p.evaluate(()=>{try{document.querySelector('#drawer').hidePopover()}catch(e){}go('home')});await p.waitForTimeout(500);
 let clicks=0;
 await p.click('#nwBtn');clicks++;await p.waitForTimeout(250);
 await p.click(`[data-nw="${k}"]`);clicks++;
 let t=null;for(let i=0;i<30&&!t;i++){await p.waitForTimeout(200);t=await open()}
 const scr=await p.evaluate(()=>S.screen);out.push({action:k,clicksFromHomeViaNewMenu:clicks,opened:t&&t.slice(0,50),screen:scr});}
// one-click: Request budget button on budget home
await p.evaluate(()=>{try{document.querySelector('#drawer').hidePopover()}catch(e){}go('bud_over')});await p.waitForTimeout(600);
await p.click('[data-bud-req-new]');let t=null;for(let i=0;i<20&&!t;i++){await p.waitForTimeout(200);t=await open()}out.push({action:'budget-request from budget home button',clicks:1,opened:t&&t.slice(0,50)});
// top bar Request budget
await p.evaluate(()=>{try{document.querySelector('#drawer').hidePopover()}catch(e){}go('home')});await p.waitForTimeout(500);
const vis=await p.evaluate(()=>{const e=document.getElementById('nwRb');return e&&e.offsetParent!==null});
if(vis){await p.click('#nwRb');t=null;for(let i=0;i<20&&!t;i++){await p.waitForTimeout(200);t=await open()}out.push({action:'budget-request from top bar button',clicks:1,opened:t&&t.slice(0,50)})}else out.push({action:'top bar Request budget button',visible:false});
// deep links
for(const k of ['budget-request','incident','change','demand','po','person','order']){await p.evaluate(()=>{try{document.querySelector('#drawer').hidePopover()}catch(e){}});await p.evaluate(h=>{location.hash=h},'#new/'+k);t=null;for(let i=0;i<30&&!t;i++){await p.waitForTimeout(200);t=await open()}out.push({deeplink:'#new/'+k,opened:t&&t.slice(0,50),screen:await p.evaluate(()=>S.screen)})}
console.log(out.map(o=>JSON.stringify(o)).join('\n'));console.log('errors:',errs.length?errs:'none');await b.close()})();
