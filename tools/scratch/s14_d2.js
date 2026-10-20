const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(7000);
console.log(await p.evaluate(()=>Object.keys(window.SCREENS||{}).filter(k=>/viz|draw|vault|graph|kg|flw|guide|svc/.test(k)).join(',')||Object.keys(window).filter(k=>/SCREEN|NAV/.test(k)).join()));
await p.evaluate(()=>{DRAW.open('t')});await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const e=document.querySelector('#drSvg');if(!e)return 'no svg '+S.screen;let a=e,o=[];while(a&&a!==document.body&&o.length<7){const cs=getComputedStyle(a),r=a.getBoundingClientRect();o.push(a.tagName+'.'+(a.className.baseVal!==undefined?a.className.baseVal:a.className)+'|'+cs.position+'|'+cs.overflow+'|'+[r.x,r.y,r.width,r.height].map(Math.round));a=a.parentElement}return o.join('\n')}));
console.log(await p.evaluate(()=>[...document.querySelectorAll('#drSvg ~ *, .dr-zoom, [class*=dr-zm],[class*=dr-mini]')].map(e=>e.className.baseVal!==undefined?e.className.baseVal:e.className).join(' ; ')));
console.log(errs);await b.close()})();
