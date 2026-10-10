const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]);const phone=process.argv.includes('--phone'),dark=process.argv.includes('--dark');const w=+(process.argv.find(a=>/^--w=/.test(a))||'--w=1440').slice(4);
fs.mkdirSync(dir+'/shots',{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:phone?{width:400,height:820}:{width:w,height:900},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
const suf=(phone?'-phone':'')+(dark?'-dark':'');
const steps=JSON.parse(process.argv[3]);
for(const s of steps){await p.evaluate(s.js).catch(e=>errs.push(s.n+': '+e.message));await p.waitForTimeout(s.wait||350);
 if(s.shot){await p.screenshot({path:dir+'/shots/'+s.n+suf+'.png',fullPage:!!s.full})}
 if(s.log){console.log(s.n,await p.evaluate(s.log).catch(e=>'ERR '+e.message))}}
const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);console.log('overflowX',ox);
console.log('errors:',errs.length?errs:'none');await b.close()})();
