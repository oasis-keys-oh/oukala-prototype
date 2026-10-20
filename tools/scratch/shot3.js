const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const errs=[];const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(600);
await p.screenshot({path:'n_home.png'});
for(const id of ['port','ims','plan','log']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(300);await p.screenshot({path:'n_'+id+'.png'});}
await p.evaluate(()=>{go('port');S.v.port=1;render()});await p.waitForTimeout(200);await p.screenshot({path:'n_pipe.png'});
await p.evaluate(()=>{S.v.port=2;render()});await p.waitForTimeout(200);await p.screenshot({path:'n_cap.png'});
await p.evaluate(()=>{S.v.port=0;render();demandDrawer('D3')});await p.waitForTimeout(500);await p.screenshot({path:'n_dem.png'});
await p.keyboard.press('Escape');
await p.evaluate(()=>{go('ims');S.ims.scen='lumen5';render();});await p.waitForTimeout(200);await p.screenshot({path:'n_ims5.png'});
await p.evaluate(()=>{S.v.ims=2;render()});await p.waitForTimeout(200);await p.screenshot({path:'n_delta.png'});
await p.evaluate(()=>{S.v.ims=0;taskDrawer('p1_3')});await p.waitForTimeout(500);await p.screenshot({path:'n_task.png'});
await p.keyboard.press('Escape');
await p.evaluate(()=>{go('log');S.v.log=1;render()});await p.fill('#logTxt','Gantt needs a resource row');await p.click('[data-logadd]');await p.waitForTimeout(300);await p.screenshot({path:'n_log.png'});
// range slider
await p.evaluate(()=>{go('port')});await p.waitForTimeout(200);
await p.evaluate(()=>{const r=document.querySelector('[data-rng=env]');r.value=2800;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(300);
console.log('env',await p.evaluate(()=>S.env),await p.evaluate(()=>document.querySelector('.fundline b').textContent));
console.log('ovx',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
await c.close();const c2=await b.newContext({viewport:{width:400,height:820}});const q=await c2.newPage();q.on('pageerror',e=>errs.push('PE '+e.message));await q.goto('file://'+process.cwd()+'/full.html');
for(const id of ['port','ims','plan','log']){await q.evaluate(i=>go(i),id);await q.waitForTimeout(250);console.log(id,'ovx',await q.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));}
await q.evaluate(()=>go('port'));await q.screenshot({path:'nm_port.png'});
await b.close();console.log(errs)})();
