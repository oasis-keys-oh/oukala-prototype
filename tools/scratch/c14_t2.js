const {chromium}=require('playwright');const path=require('path');
(async()=>{const dark=process.argv.includes('--dark'),phone=process.argv.includes('--phone');const dir=path.resolve('out_c14');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
p.setDefaultTimeout(150000);await p.goto('file://'+dir+'/full.html',{timeout:150000});await p.waitForTimeout(1500);
const sfx=(dark?'-dark':'')+(phone?'-phone':'');
const shot=async(n,full)=>{await p.waitForTimeout(400);await p.screenshot({path:dir+'/shots/c14_'+n+sfx+'.png',fullPage:!!full});};
const ov=()=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
// someone else on laptop for Elise Park (report)
await p.evaluate(()=>{go('svc_portal');S.svc.pItem='laptop';S.svc.pTab=0;});await p.waitForTimeout(300);
await p.evaluate(()=>{const s=RF.state();s.kindItem=null;s.kind=null;});
await p.evaluate(()=>{S.svc.pItem='laptop';render();});await p.waitForTimeout(300);
await p.click('[data-svc3="kind|other"]');await p.waitForTimeout(300);
await p.click('[data-svc3="pick|Elise Park"]');await p.waitForTimeout(300);
await shot('for_report');console.log('ov',await ov());
await p.evaluate(()=>{const s=RF.state();s.who="Tom Becker";render()});await shot('for_other');
// wizard onboarding
await p.evaluate(()=>{OGX.start('onboarding')});await p.waitForTimeout(500);
await p.evaluate(()=>{const s=RF.state();s.nh.name="Priya Test";s.nh.mgr="Priya Shah";s.nh.loc="Remote (US)";render()});await shot('wiz',true);console.log('ov wiz',await ov());
await p.evaluate(()=>{OGX.place('onboarding')});await p.waitForTimeout(600);await shot('placed',true);
// queue
await p.evaluate(()=>{S.v.svc3_tabs=2;render()});await shot('queue',true);
await p.evaluate(()=>{S.v.svc3_tabs=3;render()});await shot('guides',true);
await p.evaluate(()=>{S.v.svc3_tabs=4;render()});await shot('proc',true);
console.log(await p.evaluate(()=>JSON.stringify({sc:CONTRACT.evaluate("svc_guides").score,wired:OGX.wired})));
console.log('errors:',errs.length?errs:'none');await b.close()})();
