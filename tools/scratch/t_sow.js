// usage: node t_sow.js OUT "tabIndex" [--dark] [--phone] [--scale] [--w N] [--eval js] [--full]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),tabs=(a[1]||"0").split(","),dark=a.includes("--dark"),phone=a.includes("--phone"),scale=a.includes("--scale"),full=a.includes("--full");
const w=a.includes("--w")?+a[a.indexOf("--w")+1]:(phone?400:1440);const ev=a.includes("--eval")?a[a.indexOf("--eval")+1]:null;
fs.mkdirSync(path.join(dir,"shots"),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:w,height:phone?820:900},colorScheme:dark?"dark":"light"});const p=await c.newPage();const errs=[];
p.on("pageerror",e=>errs.push("PAGEERROR "+e.message));p.on("console",m=>m.type()==="error"&&errs.push("console: "+m.text()));
await p.goto("file://"+path.join(dir,"full.html"));await p.waitForTimeout(500);
if(scale){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(500)}
for(const t of tabs){await p.evaluate(i=>{S.v.sow=+i;go("ppm_sow")},t).catch(e=>errs.push("go: "+e.message));await p.waitForTimeout(400);
 if(ev){await p.evaluate(ev).catch(e=>errs.push("eval: "+e.message));await p.waitForTimeout(500)}
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await p.screenshot({path:path.join(dir,"shots","sow"+t+(phone?"-phone":"")+(dark?"-dark":"")+(scale?"-scale":"")+".png"),fullPage:full});console.log("tab",t,"overflowX",ox)}
console.log("errors:",errs.length?errs:"none");await b.close()})();
