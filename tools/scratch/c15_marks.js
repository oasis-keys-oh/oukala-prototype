const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof S!=="undefined"&&document.querySelector('#view')&&document.querySelector('#view').children.length>0);
const T=await p.evaluate(()=>__TT);let prev=T[0];const d=[];for(let i=1;i<T.length;i++){d.push([T[i-1][0],T[i][1]-T[i-1][1]])}
d.sort((a,b)=>b[1]-a[1]);console.log('total',(T[T.length-1][1]-T[0][1]).toFixed(0));d.slice(0,22).forEach(x=>console.log(x[1].toFixed(0)+'ms',x[0]));await b.close()})();
