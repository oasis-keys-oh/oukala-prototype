const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1300,height:1000}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto('file://'+path.resolve('out_svc360/full.html'));await p.waitForTimeout(400);
const clk=async s=>{await p.evaluate(s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click()},s);await p.waitForTimeout(250)};
await p.evaluate(()=>go('svc_360'));await p.waitForTimeout(200);
await clk('[data-s360-newsvc]');await p.screenshot({path:'out_svc360/shots/f_newsvc.png'});
// fill and submit new service
await p.evaluate(()=>{const d=document.getElementById('drawer');const i=d.querySelector('input[type=text]');i.value='Standards translation';i.dispatchEvent(new Event('input',{bubbles:true}))});
console.log(await p.evaluate(()=>[...document.querySelectorAll('#drawer button')].map(b=>b.textContent.trim()).filter(x=>x).slice(0,30).join('|')));
await p.keyboard.press('Escape');
await p.evaluate(()=>{S.svc360.sel='svc_cod';S.v.s360d=7;render()});await p.waitForTimeout(200);
await p.evaluate(()=>{const r=document.querySelector('[data-bt-row]');r&&r.click()});await p.waitForTimeout(300);await p.screenshot({path:'out_svc360/shots/f_off.png'});
await p.keyboard.press('Escape');
await clk('[data-s360-newoff]');await p.screenshot({path:'out_svc360/shots/f_newoff.png'});await p.keyboard.press('Escape');
await clk('[data-s360-newrel]');await p.screenshot({path:'out_svc360/shots/f_rel.png'});await p.keyboard.press('Escape');
await p.evaluate(()=>{go('tbm_model');S.v.tbmv=4;render()});await p.waitForTimeout(200);
await clk('[data-tbm-demand]');await p.screenshot({path:'out_svc360/shots/f_dem.png'});
console.log('ERRS',errs);await b.close()})();
