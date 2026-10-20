const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'})).newPage();const e=[];p.on('pageerror',x=>e.push('PE '+x.message));p.on('console',m=>m.type()==='error'&&e.push(m.text()));
await p.goto('file://'+process.cwd()+'/out_ppm/full.html');await p.waitForTimeout(400);
await p.evaluate(()=>{go('ppm_proj');person360('Maya Ortiz')});await p.waitForTimeout(300);
console.log(await p.evaluate(()=>[...document.querySelectorAll('#drawer .vsw label')].map(l=>l.textContent).join('|')));
await p.evaluate(()=>{document.querySelector('#drawer input[data-vw="p360:3"]')?.click();document.querySelector('#drawer input[data-vw="p360:4"]')?.click()});
for(const sel of ['[data-ppm-skadd]']){}
const forms=[()=>document.querySelector('[data-ppm-skadd]')?.click(),()=>{closeDrawer();S.v.ppmv=6;render();document.querySelector('[data-ppm-newreq]').click()},()=>{closeDrawer();ppmOpenProject('PR2');document.querySelector('[data-ppm-addm]').click()},()=>{closeDrawer();ppmOpenProject('PR2');document.querySelector('[data-ppm-pm]').click()},()=>{closeDrawer();go('ppm_raid');document.querySelector('[data-ppm-radd]').click()}];
let i=0;for(const f of forms){await p.evaluate(f);await p.waitForTimeout(300);await p.screenshot({path:'out_ppm/shots/f'+(i++)+'.png'})}
await p.evaluate(()=>{closeDrawer();go('port');S.v.port=3;render()});await p.waitForTimeout(300);await p.screenshot({path:'out_ppm/shots/dk_cap.png'});
console.log('errors',e);await b.close()})();
