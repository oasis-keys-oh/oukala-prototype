const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>errs.push(m.type()+':'+m.text()));
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
await p.evaluate(()=>go('kcs_ask'));await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const v=document.querySelector('#view');const el=v.firstElementChild;const cs=el&&getComputedStyle(el);return {kids:v.children.length,html:v.innerHTML.slice(0,300),op:cs&&cs.opacity,disp:cs&&cs.display,vis:cs&&cs.visibility,h:el&&el.getBoundingClientRect().height,anim:cs&&cs.animationName}});
console.log(JSON.stringify(r),errs.slice(0,5));
await p.screenshot({path:'vo/shots/kcs_ask-3s.png'});await b.close()})();
