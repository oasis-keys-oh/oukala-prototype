// PR-31: Build list by purview: what each manager persona sees on r18_builds, and All screens filters
const L=require('./lib');const path=require('path');(async()=>{const {b,p}=await L.open();
for(const k of ['pm','portfolio','ops','change','fin','audit','dist','fac','scm','plant','proc']){await L.setup(p,k);await L.goto(p,'r18_builds');
 const t=(await L.txt(p)).replace(/\n+/g,' | ');console.log(k,'::',t.slice(t.indexOf('Build list'),t.indexOf('Build list')+420));
 if(k==='fac'||k==='pm')await L.shot(p,path.join(__dirname,'shots',k),'core_r18_builds')}
await b.close()})();
