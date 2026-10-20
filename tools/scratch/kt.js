const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const scale=process.argv.includes('--scale');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join('|')));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
if(scale)await p.evaluate(()=>SCALE.set(true));
await p.evaluate(()=>{window.say=(q,r)=>{window.__say=r.t}});const ev=async(f,...a)=>{try{return await p.evaluate(f,...a)}catch(e){console.log('EVALERR',e.message.slice(0,200))}};
const shot=async(n,sel)=>{await p.waitForTimeout(400);const f=dir+'/shots/kt_'+n+(scale?'_sc':'')+'.png';if(sel){const el=await p.$(sel);if(el){await el.screenshot({path:f});return}}await p.screenshot({path:f,fullPage:true})};
await ev(()=>{S.v.kcs_hv=1;go("kcs_home")});await shot('lib');
await ev(()=>KCSX.openItem("KB0451"));await shot('item','#drawer');
await ev(()=>{closeDrawer();KCSX.promoteForm("KB0480")});await shot('promoteform','#drawer');
await ev(()=>closeDrawer());
// studio
await ev(()=>{S.v.kx_sv=2;go("kcs_skills");const s=document.querySelector("[data-kx-srcsel]");s.value="KB0462"||s.value;});
await ev(()=>{const o=[...document.querySelectorAll("[data-kx-srcsel] option")];const t=o.find(x=>/KB0480|RB-080/.test(x.value));const s=document.querySelector("[data-kx-srcsel]");s.value=t.value;s.dispatchEvent(new Event("change",{bubbles:true}))});
await shot('studio1');
await ev(()=>{document.querySelectorAll("[data-kx-samp]").forEach(i=>{i.value="X1";i.dispatchEvent(new Event("input",{bubbles:true}))});document.querySelector("[data-kx-test]").click()});
await shot('studio2');
console.log(await ev(()=>JSON.stringify({test:S.kcsx.studio.test&&S.kcsx.studio.test.pass,btn:document.querySelector("[data-kx-submit]").disabled})));
await ev(()=>{const st=S.kcsx.studio;st.appr=["Service owner","Platform on-call"];render()});
await ev(()=>{document.querySelector("[data-kx-test]").click()});
console.log(await ev(()=>JSON.stringify({test:S.kcsx.studio.test&&S.kcsx.studio.test.pass,btn:document.querySelector("[data-kx-submit]").disabled})));
await ev(()=>document.querySelector("[data-kx-submit]").click());
console.log(await ev(()=>JSON.stringify(KCSX.skills().filter(s=>s.status==="Awaiting approval").map(s=>s.id))));
await ev(()=>{const s=KCSX.skills().filter(s=>s.status==="Awaiting approval")[0];KCSX.openSkill(s.id)});await shot('skilldrawer','#drawer');
await ev(()=>{const s=KCSX.skills().filter(s=>s.status==="Awaiting approval")[0];document.querySelector("[data-kx-adv]").click()});
console.log(await ev(()=>JSON.stringify({act:KCSX.skills().filter(s=>s.status==="Active").length,wf:WFX.defs.filter(w=>/skill/.test(w.id)).length})));
await ev(()=>{S.v.kx_sv=0;go("kcs_skills")});await shot('skdash');
await ev(()=>{S.v.kx_sv=1;go("kcs_skills")});await shot('skreg');
await ev(()=>{S.v.kx_sv=3;go("kcs_skills")});await shot('skloop');
await ev(()=>{S.v.kx_sv=4;go("kcs_skills")});await shot('sktools');
await ev(()=>{go("kcs_gap")});await shot('gap');
await ev(()=>{go("kcs_prompt")});await shot('prompt');
// ASKX
for(const q of ["which articles can be automated","what does the VPN article link to","how many agent skills are active","promote the lease amortization close to a skill","path from CT-118 to SK-102","walk impact of search"]){const r=await ev(q=>{let hit=false;for(const f of ASKX){try{if(f(q)){hit=true;break}}catch(e){return "ERR "+e.message}}return hit},q);console.log(q,'=>',r);await p.waitForTimeout(300);await ev(()=>{closeDrawer()})}
await ev(()=>{const r=SEARCHX.flatMap(f=>f());return r.length});console.log('search',await ev(()=>SEARCHX.flatMap(f=>f()).length));
await b.close()})();
