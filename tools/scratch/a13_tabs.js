const {chromium}=require('playwright');const path=require('path');
(async()=>{const w=+process.argv[2]||1440;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:w,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_a13/full.html'));await p.waitForTimeout(500);
for(const t of ['dir','own','acct','report']){await p.evaluate(t=>{S.org.tab=t;go('org_chart')},t);await p.waitForTimeout(500);
 await p.locator('.org-pane').first().screenshot({path:`out_a13/t_${t}_${w}.png`})}
await p.evaluate(()=>{S.org.tab='chart';go('org_chart');O=ORGX;ORGX.openProfile('Victor Amaya',0)});await p.waitForTimeout(600);await p.screenshot({path:`out_a13/t_prof_${w}.png`});
console.log(errs);await b.close()})();
