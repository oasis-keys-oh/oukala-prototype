const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),scr=a[1],vn=a[2],n=+a[3];const phone=a.includes('--phone'),dark=a.includes('--dark'),scale=a.includes('--scale');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'})).newPage();
p.on('pageerror',e=>{if(!/drawChat|setting 'innerHTML'/.test(e.message)||e.stack.indexOf('drawChat')<0&&false)console.log('PAGEERROR',e.message,(e.stack||'').split('\n').slice(1,5).join('|'))});p.on('console',m=>m.type()==='error'&&console.log('console:',m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);if(scale)await p.evaluate(()=>SCALE.set(true));
fs.mkdirSync(dir+'/shots',{recursive:true});
await p.evaluate(s=>go(s),scr);await p.waitForTimeout(300);
for(let i=0;i<n;i++){await p.evaluate(([v,i])=>{S.v[v]=i;render()},[vn,i]).catch(e=>console.log('tab',i,e.message));await p.waitForTimeout(250);
const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
await p.screenshot({path:dir+'/shots/'+scr+'-t'+i+(phone?'-phone':'')+(dark?'-dark':'')+'.png',fullPage:true});console.log(scr,'tab',i,'ox',ox)}
await b.close()})();
