const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:400,height:820}});const p=await c.newPage();
p.setDefaultTimeout(150000);await p.goto('file://'+path.resolve('out_c14/full.html'),{timeout:150000});await p.waitForTimeout(1500);
const scan=()=>p.evaluate(()=>{const o=[];document.querySelectorAll('#view *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>innerWidth+2&&r.width>0&&!e.closest('.tscroll,.svc3-swwrap,.flowscroll'))o.push(e.tagName+'.'+String(e.className).slice(0,40)+' '+Math.round(r.right))});return o.slice(0,8)});
for(const [n,f] of [['orders',()=>go('svc_guides')],['wiz',()=>{OGX.start('onboarding')}],['queue',()=>{S.v.svc3_tabs=2;render()}],['portal',()=>{go('svc_portal');S.svc.pItem='laptop';S.svc.pTab=0;render()}],['next',()=>{S.svc.pTab=2;render()}]]){await p.evaluate(f);await p.waitForTimeout(500);console.log(n,JSON.stringify(await scan()))}
await p.screenshot({path:'out_c14/shots/c14_next-phone.png'});await b.close()})();
