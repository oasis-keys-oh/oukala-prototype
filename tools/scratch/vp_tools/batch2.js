const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const dir=process.argv[2],out=process.argv[3],ids=process.argv[4].split(','),cfg=process.argv[5],scale=process.argv[6]==='scale';
(async()=>{const [w,mode]=cfg.split(':');const dark=mode==='d';
for(const id of ids){const f=path.join(out,`${id}_${w}${dark?'d':'l'}${scale?'S':''}.png`);if(fs.existsSync(f))continue;
 for(let t=0;t<3;t++){let b;try{b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const c=await b.newContext({viewport:{width:+w,height:1000},colorScheme:dark?'dark':'light'});const p=await c.newPage();
 await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);if(scale){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(1200)}
 await p.evaluate(i=>go(i),id);await p.waitForTimeout(600);await p.screenshot({path:f,fullPage:true});await b.close();console.log('ok',id);break}catch(e){console.log('retry',id,e.message.slice(0,60));try{await b.close()}catch(_){}}}}
})();
