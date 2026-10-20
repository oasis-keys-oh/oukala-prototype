const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:400,height:820},hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
await p.evaluate(()=>{DRAW.open('x')});await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{let a=document.getElementById('drSvg'),o=[];while(a&&o.length<4){const cs=getComputedStyle(a);o.push(a.tagName+'.'+(a.className.baseVal!==undefined?a.className.baseVal:a.className)+'|'+cs.position+'|'+cs.overflow+'|'+a.clientWidth+'x'+a.clientHeight);a=a.parentElement}return o}));console.log(await p.evaluate(()=>({svg:!!document.getElementById('drSvg'),cv:!!document.querySelector('.dr-canvas'),zs:document.querySelectorAll('.zs-root').length,scr:S.screen,w:(document.querySelector('.dr-canvas')||{}).clientWidth,html:(document.querySelector('#view')||{}).innerHTML.slice(0,300)})));
await p.screenshot({path:'out_s14/dp.png'});console.log(errs);await b.close()})();
