const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const ids='home,itsm_inc,org_chart,strat_exec,fin_spend,plat_contract,ppm_raid,itom_cmdb,kg,svc_sla'.split(',');fs.mkdirSync('r17o2_desk',{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const o of ['out_v16g','out_o217']){const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(o)+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(900);
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(700);await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});await p.waitForTimeout(100);await p.screenshot({path:`r17o2_desk/${o}_${id}.png`,fullPage:true})}await c.close()}
await b.close()})();
