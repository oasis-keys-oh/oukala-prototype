// geometry + key style diff for 10 screens, desktop widths. usage: node r17o1_geom.js dirA dirB [W] [H]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [,,A,B,W,H]=process.argv;const w=+W||1440,h=+H||900;
const ids=['home','inv','itsm_inc','kg','metrics','fo','tower','plat_data','ppl_org','flw_appr'];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const res={};
for(const [tag,dir] of [['A',A],['B',B]]){
 const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce'});const p=await c.newPage();p.setDefaultTimeout(120000);
 await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.go&&document.querySelector('#view')&&document.querySelector('#view').children.length>0);await p.waitForTimeout(2500);
 res[tag]={};
 for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(900);
  res[tag][id]=await p.evaluate(()=>{const o={};const walk=(e,pa)=>{[...e.children].forEach((k,i)=>{if(/^(SCRIPT|STYLE|LINK|META)$/.test(k.tagName))return;const key=pa+'/'+k.tagName+i;const r=k.getBoundingClientRect();const cs=getComputedStyle(k);if(k.classList.contains('r17o1-mark')||k.classList.contains('r17o1-ttl'))return;o[key]=[Math.round(r.x),Math.round(r.width),cs.display,cs.position,cs.fontSize,cs.color,cs.backgroundColor,cs.borderRadius,cs.padding].join('|');if(!k.closest('svg'))walk(k,key)})};
   walk(document.querySelector('.topbar'),'tb');walk(document.querySelector('#view'),'view');
   ['#r17o1Tab','#r17o1Sheet','#r17o1Abar','.r17o1-mark','.r17o1-ttl'].forEach(s=>{const e=document.querySelector(s);o['extra '+s]=e?getComputedStyle(e).display:'absent'});return o})}
 await c.close()}
await b.close();
let tot=0;for(const id of ids){const a=res.A[id],bb=res.B[id];let n=0;const ex=[];for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(k.startsWith('extra'))continue;if(a[k]!==bb[k]){n++;if(ex.length<3)ex.push(k+'\n   A '+a[k]+'\n   B '+bb[k])}}
 const extras=Object.keys(bb).filter(k=>k.startsWith('extra')).map(k=>k+'='+bb[k]).join(' ');
 console.log(id,'elements',Object.keys(a).length,'differences',n,n?ex.join('\n'):'',n?'':'',extras.includes('block')||extras.includes('flex')||extras.includes('grid')?'EXTRA VISIBLE '+extras:'');tot+=n}
console.log('TOTAL differences',tot)})();
