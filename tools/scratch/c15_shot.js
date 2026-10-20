// node c15_shot.js OUT "id1,id2" [--w 1440] [--dark] [--h 900] [--full] [--tag x]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),ids=a[1].split(',');const g=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const w=+g('--w',1440),h=+g('--h',900),dark=a.includes('--dark'),full=a.includes('--full'),tag=g('--tag','');
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.join(dir,'full.html'),{waitUntil:'domcontentloaded'});await p.waitForTimeout(800);
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(1600);const f=path.join(dir,'shots',id+'-'+w+(dark?'-dark':'')+tag+'.png');await p.screenshot({path:f,fullPage:full});console.log(f)}
console.log('errs',errs.length,errs.slice(0,3));await b.close()})();
