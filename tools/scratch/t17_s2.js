// node t17_s2.js OUT name [--w 1440] [--h 900] [--dark] [--eval js] [--sel css] [--full] [--wait ms]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),name=a[1];const g=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const w=+g('--w',1440),h=+g('--h',900),dark=a.includes('--dark'),ev=g('--eval',''),sel=g('--sel',''),wait=+g('--wait',1500);
fs.mkdirSync(dir+'/shots',{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.AGENTRT&&AGENTRT.booted,null,{timeout:120000}).catch(()=>console.log('boot timeout'));
if(ev){await p.evaluate(ev);await p.waitForTimeout(wait)}
const f=dir+'/shots/'+name+'-'+w+(dark?'-dark':'')+'.png';
if(sel){const el=await p.$(sel);if(el)await el.screenshot({path:f});else{console.log('no sel');await p.screenshot({path:f})}}else await p.screenshot({path:f,fullPage:a.includes('--full')});
console.log(f,'errs',errs.slice(0,4));await b.close()})();
