const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(()=>null)||await chromium.launch();
const mode=process.argv[2]||'dark';const phone=mode==='phone';
const p=await b.newPage({viewport:phone?{width:400,height:860}:{width:1440,height:900}});
await p.route(/^https?:/,r=>r.abort());const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
const t0=Date.now();await p.goto('file://'+process.cwd()+'/out_s17/full.html');await p.waitForTimeout(3500);
if(mode==='dark')await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')});
await p.evaluate(()=>{go('r17s_rules')});await p.waitForTimeout(800);
const names=['overview','rules','editor','test','log','library','gov'];
for(let i=0;i<7;i++){console.log('tab',i);await p.evaluate(i=>{S.v.r17sv=i;render()},i);await p.waitForTimeout(500);
 if(i===2){await p.evaluate(()=>{const r=window.RULES.UI;r.loadDraft('RUL-0101');S.v.r17sv=2;render()});await p.waitForTimeout(500)}
 if(i===3){await p.evaluate(()=>{const T=window.RULES.UI.tst;T.ruleId='RUL-0101';T.entity='incident';T.trigger='before_save';window.RULES.UI.runTest();render()});await p.waitForTimeout(400)}
 await p.screenshot({path:`out_s17/shot_${mode}_${i}_${names[i]}.png`,fullPage:false});}
console.log('load+nav ms',Date.now()-t0);console.log(JSON.stringify(errs.slice(0,12),null,1));await b.close()})();
