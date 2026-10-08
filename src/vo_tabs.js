const {chromium}=require('playwright');const path=require('path');
const IDS="itom_cmdb itom_model itom_graph itom_disc itom_health itom_fin itom_evt obs_dash itom_slo itom_run obs_std dev_pipe itom_dev plat_map plat_data flw_design flw_appr flw_asmt flw_dmn flw_bpmn flw_agent flw_hub ppl_org ppl_perf ppl_cap ppl_jrny ppl_train ppl_av ppl_meet svc_skills kcs_home kcs_skills kcs_gap kcs_prompt kcs_test kcs_edit kcs_ask vault kcs_viz chat_home adm_studio adm_sec adm_env adm_meter adm_gate adm_audit home metrics fo log".split(" ");
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
const res={};
for(const id of IDS){const t0=Date.now();
const t=await p.evaluate((id)=>{go(id);const v=document.querySelector('#view');
const sel='[role=tab], .vsw button, .fchips button, .seg button, .recchips button, [class*=tabs] button, [data-tab] ';
const bs=[...v.querySelectorAll('[role=tab],.vsw button,[class*="tabs"] button,.seg button')];
return bs.map((e,i)=>({i,l:e.textContent.trim().slice(0,28),c:e.className.slice(0,20),p:e.parentElement.className.slice(0,20)}))},id);
res[id]=t;console.log(id,Date.now()-t0,'ms',t.length,t.map(x=>x.l).join(' | '))}
console.log(errs.slice(0,10));
require('fs').writeFileSync('vo/tabs.json',JSON.stringify(res));
await b.close()})();
