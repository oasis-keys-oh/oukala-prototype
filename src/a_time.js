const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const ids=['itom_evt','ppm_proj','svc_oncall','vault','exe_scen','port','ppm_sow','svc_cat','exe_risk','kcs_home','svc_sla'];
for(const mode of [false,true]){await p.evaluate(m=>SCALE.set(m),mode);
 for(const id of ids){const a=[];for(let k=0;k<2;k++){a.push(Math.round(await p.evaluate(i=>{const t=performance.now();go(i);return performance.now()-t},id)))}console.log(mode?'scale':'base ',id,a.join(' / '))}}
await b.close()})();
