const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const N=+(process.argv[3]||3);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const res=[];
for(let i=0;i<N;i++){const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask',buffered:true})}catch(e){}
const mo=new MutationObserver(()=>{const v=document.querySelector('#view');if(v&&v.children.length){window.__first=performance.now();mo.disconnect()}});mo.observe(document,{childList:true,subtree:true})});
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__first,null,{timeout:90000});
await p.waitForTimeout(9000);
const r=await p.evaluate(()=>{const first=__first;const lt=__lt;const after=lt.filter(x=>x[0]>=first-1);return {first:Math.round(first),nLong:lt.length,lastLongEnd:lt.length?Math.max(...lt.map(x=>x[0]+x[1])):0,tbt:Math.round(lt.reduce((a,x)=>a+Math.max(0,x[1]-50),0)),maxLong:Math.max(0,...lt.map(x=>x[1]))}});
r.errs=errs.length;res.push(r);console.log(JSON.stringify(r));await c.close()}
const med=k=>res.map(r=>r[k]).sort((a,b)=>a-b)[Math.floor(res.length/2)];console.log('MEDIAN first',med('first'),'tbt',med('tbt'),'lastLongEnd',med('lastLongEnd'),'maxLong',med('maxLong'));await b.close()})();
