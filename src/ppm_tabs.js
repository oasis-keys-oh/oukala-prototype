const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]),id=process.argv[3],w=+(process.argv[4]||1440),dark=process.argv.includes('--dark'),sc=process.argv.includes('--scale');
const only=process.argv.find(a=>a.startsWith('--tab='));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:w,height:1000},colorScheme:dark?'dark':'light'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);if(sc)await p.evaluate(()=>SCALE.set(true));await p.evaluate(i=>go(i),id);await p.waitForTimeout(400);
const names=await p.evaluate(()=>[...document.querySelectorAll('.screen .vsw label')].map(l=>l.textContent.trim()));
fs.mkdirSync(dir+'/shots',{recursive:true});
for(let i=0;i<names.length;i++){if(only&&+only.split('=')[1]!==i)continue;await p.evaluate(i=>document.querySelectorAll('.screen .vsw label')[i].click(),i);await p.waitForTimeout(250);
const f=dir+'/shots/'+id+'_t'+i+'_'+w+(dark?'d':'l')+(sc?'s':'')+'.png';await p.screenshot({path:f,fullPage:true,clip:undefined});console.log(i,names[i],await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2?'HSCROLL':'ok'))}
console.log(errs);await b.close()})();
