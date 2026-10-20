const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'})).newPage();
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a14/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(500);
await p.evaluate(()=>{S.org.mode='both';S.org.k=0;S.org.lines={dotted:true,matrix:true};go('org_chart')});await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(()=>{const n=[...document.querySelectorAll('#orgcv .org-n')].slice(0,6).map(n=>({l:n.style.left,t:n.style.top,w:n.offsetWidth,h:n.offsetHeight,card:n.firstElementChild.offsetHeight}));const cv=document.getElementById('orgcv');return {n,cv:[cv.style.width,cv.style.height,cv.offsetWidth,cv.offsetHeight],k:S.org.k,x:S.org.x,y:S.org.y,vp:[vp=document.getElementById('orgvp').clientWidth,document.getElementById('orgvp').clientHeight],ln:getComputedStyle(document.querySelector('.org-ln')).stroke}})));
await p.locator('.org-wrap').screenshot({path:'out_a14/s_wrap.png'});await b.close()})();
