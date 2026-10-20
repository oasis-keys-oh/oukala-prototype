const {chromium}=require('playwright');
(async()=>{const out=process.argv[2];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,100)));
await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await p.goto('file://'+out+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(async()=>{NAVX.ensureIndex(true);await new Promise(r=>setTimeout(r,200));for(let i=0;i<900&&(NAVX.index.building||!NAVX.index.built);i++)await new Promise(r=>setTimeout(r,100))});
const r=await p.evaluate(async()=>{const seen={};const idx=[];NAVX.index.items.forEach((x,i)=>{const g=x.g||x.ty;if(!seen[g]&&x.ty!=='action'){seen[g]=1;idx.push(i)}});
 const test=async()=>{const e=[];const h=window.onerror;try{go('bud_over');await new Promise(r=>setTimeout(r,80));return document.querySelector('#view').innerText.length}catch(e){return -1}};
 for(const i of idx){const it=NAVX.index.items[i];try{it.f()}catch(e){}await new Promise(r=>setTimeout(r,300));
  try{closeDrawer()}catch(e){}
  go('bud_over');await new Promise(r=>setTimeout(r,120));const len=document.querySelector('#view').innerText.length;if(len<800)return {after:it.g||it.ty,t:it.t,len,screen:S.screen}}
 return 'none'});
console.log(JSON.stringify(r),errs.slice(0,3));await b.close()})();
