const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:400,height:820},colorScheme:'dark'});const p=await c.newPage();
await p.goto('file://'+process.cwd()+'/out_a/full.html');await p.waitForTimeout(900);
await p.evaluate(()=>{go('bud_over');document.getElementById('lens').checked=true});await p.waitForTimeout(500);
await p.screenshot({path:'shots_a/ph_bud.png'});
await p.evaluate(()=>{INBOX.openFocus()});await p.waitForTimeout(400);await p.screenshot({path:'shots_a/ph_focus.png'});await b.close()})();
