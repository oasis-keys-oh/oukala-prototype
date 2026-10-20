const {chromium}=require('playwright');const path=require('path');
const dir=process.argv[2],out=process.argv[3],ids=process.argv[4].split(','),cfgs=process.argv[5].split(','),scale=process.argv[6]==='scale';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const cfg of cfgs){const [w,mode]=cfg.split(':');const dark=mode==='d';
const c=await b.newContext({viewport:{width:+w,height:1000},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);if(scale){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(1500)}
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(600);
const f=path.join(out,`${id}_${w}${dark?'d':'l'}${scale?'S':''}`);
await p.screenshot({path:f+'.png',fullPage:true});
console.log(id,w,mode,errs.length?errs.join(';'):'')}
await c.close()}
await b.close()})();
