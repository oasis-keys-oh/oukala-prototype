// NODE_PATH=... node r17_shot.js OUTDIR PREFIX id1,id2 [--w 390] [--full]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const pre=a[1];const ids=a[2].split(',');const W=a.includes('--w')?+a[a.indexOf('--w')+1]:390;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
fs.mkdirSync('r17_shots',{recursive:true});
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(700);
 await p.screenshot({path:`r17_shots/${pre}_${id}.png`,fullPage:true,clip:{x:0,y:0,width:W,height:a.includes("--h")?+a[a.indexOf("--h")+1]:2400}});}
await b.close()})();
