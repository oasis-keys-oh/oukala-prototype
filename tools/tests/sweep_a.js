// Wave 3 sweep-a (CL-45, CL-44, CL-17, CL-72): open every screen rendered by the core files (data.js to screens4.js) and the
// modules mod_admin to mod_obs, and fail when the rendered text has an em dash, a banned name (R31), "Oukala" or an "Automatic" step label.
// Usage: node tools/tests/sweep_a.js <dir containing full.html> [--report]   (--report lists findings and never fails)
const {chromium}=require('playwright');const path=require('path');
const IDS=["home","trace","inv","fo","tower","metrics","loop","kg","port","im","plan","log",
 "adm_studio","adm_sec","adm_env","adm_meter","adm_gate","adm_audit","bud_over","bud_model","bud_ven","bud_ben","bud_doa","bud_req",
 "chat_home","dec_cov","dev_pipe","itom_dev","plat_map","plat_data","draw_studio","exe_dash","exe_strat","exe_risk","exe_apps","exe_board","exe_scen",
 "flw_design","flw_asmt","flw_appr","flw_dmn","flw_bpmn","flw_agent","flw_hub","inbox","itom_cmdb","itom_model","itom_graph","itom_disc","itom_health","itom_fin",
 "itsm_inc","itsm_prb","itsm_chg","itsm_mi","itsm_home","kcs_home","kcs_edit","kcs_ask","kcs_gap","kcs_prompt","kcs_test","kcs_skills","vault","exe_mat",
 "meet_hub","meet_act","meet_dec","meet_series","nav_studio","itom_evt","obs_dash","itom_slo","itom_run","obs_std"];
/* "Automatic" owner labels these screens show from other sweep ranges' data (mod_r15f2_d_wire.js entities and steps,
   mod_r16m_a_core.js steps); remove an entry once that range's CL-72 commit is merged */
const KNOWN={plat_map:6,plat_data:14,flw_design:1};
const RULES=[
 ["em dash",/—/],
 ["Oukala",/Oukala|Shaheen/i],
 ["banned name",/\bFabric\b|\bTrellis\b|\b(?:Falconaire|Oukala) Core\b|\bFASB\b|\bGASB\b|\bCodification\b|\bASU \d|\bASC \d/],
];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const report=process.argv.includes('--report');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(800);
const have=await p.evaluate(()=>SCREENS.map(s=>s[0]));let bad=0,opened=0;
for(const id of IDS){if(have.indexOf(id)<0)continue;opened++;
 await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(100);
 const r=await p.evaluate(()=>{const v=document.querySelector('#view');const t=v.innerText;
  /* an element whose whole text is "Automatic" is a step-kind label (R24); "auto-save" or "automatically" in a sentence is fine */
  const auto=[...v.querySelectorAll('span,b,i,em,small,td,th,option,button,label,div')].filter(e=>!e.children.length&&/^\s*Automatic\s*$/.test(e.textContent)).length;
  return{t,auto}});
 const hits=[];RULES.forEach(([n,re])=>{const m=r.t.match(new RegExp(re.source,re.flags.replace('g','')+'g'));if(m){const i=r.t.search(re);hits.push(n+' x'+m.length+': "'+r.t.slice(Math.max(0,i-50),i+50).replace(/\s+/g,' ')+'"')}});
 if(r.auto&&r.auto>(KNOWN[id]||0))hits.push('Automatic step label x'+r.auto);
 else if(r.auto)console.log('known (other range)',id,'Automatic x'+r.auto);
 if(hits.length){bad++;console.log('!!',id,hits.join(' | '))}}
console.log('sweep_a: screens',opened,'flagged',bad,'page errors',errs.length);if(errs.length)console.log(errs.slice(0,5));
await b.close();process.exit(report?0:(bad||errs.length?1:0))})();
