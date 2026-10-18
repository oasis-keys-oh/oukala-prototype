const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve('out_d','full.html'));await p.waitForTimeout(600);await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(900);
const chk=async t=>console.log(t,await p.evaluate(()=>{const v=document.querySelector('.at-vp').getBoundingClientRect(),w=document.querySelector('.at-world').getBoundingClientRect();return JSON.stringify({clip:w.left<v.left-1||w.top<v.top-1||w.right>v.right+1||w.bottom>v.bottom+1,vh:Math.round(v.height),vw:Math.round(v.width),k:+S.atlas.cam.k.toFixed(3)})}));
await chk('1440');
for(const [w,h] of [[1000,800],[1920,1080],[1200,700]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(700);await chk(w)}
await p.evaluate(()=>{const s=document.querySelector('[data-at-refs]');s.value='off';s.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(400);
console.log('off lines',await p.evaluate(()=>document.querySelectorAll('.at-svg path,.at-bl').length));
await p.evaluate(()=>{const s=document.querySelector('[data-at-refs]');s.value='sel';s.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(400);
console.log('sel lines',await p.evaluate(()=>document.querySelectorAll('.at-svg path,.at-bl').length));
console.log(errs);await b.close()})();
