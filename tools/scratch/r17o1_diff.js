const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const [,,A,B,W,H]=process.argv;const w=+W||1440,h=+H||900;
const ids=['home','inv','itsm_inc','kg','metrics','fo','tower','plat_data','ppl_org','flw_appr'];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [tag,dir] of [['A',A],['B',B]]){
 const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce'});const p=await c.newPage();p.setDefaultTimeout(120000);
 await p.route(/^https?:/,r=>r.abort());await p.addInitScript(()=>{const d=Date;Math.random=(()=>{let s=1;return()=>(s=(s*16807)%2147483647)/2147483647})()});
 await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.go&&document.querySelector('#view')&&document.querySelector('#view').children.length>0);await p.waitForTimeout(2500);
 await p.addStyleTag({content:'*{animation:none!important;transition:none!important;caret-color:transparent!important}'});
 for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(900);await p.screenshot({path:`r17_shots/dd_${tag}_${w}_${id}.png`})}
 await c.close()}
await b.close();
const {execSync}=require('child_process');
console.log(execSync(`python3 - <<'PY'
from PIL import Image,ImageChops
for i in "${ids.join(' ')}".split():
    a=Image.open('r17_shots/dd_A_${w}_%s.png'%i).convert('RGB');b=Image.open('r17_shots/dd_B_${w}_%s.png'%i).convert('RGB')
    d=ImageChops.difference(a,b);bb=d.getbbox()
    n=sum(1 for px in d.getdata() if px!=(0,0,0)) if bb else 0
    print(i,'IDENTICAL' if not bb else 'DIFF px=%d bbox=%s'%(n,bb))
PY`).toString())})();
