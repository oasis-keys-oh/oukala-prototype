const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const s=SCREENS[3];const nav=document.querySelector('nav, .sidebar, #side, aside');
return {s3:s.slice(3), navSel:nav&&nav.tagName+'.'+nav.className, txt:nav&&nav.innerText.slice(0,5000), html:nav&&nav.innerHTML.slice(0,1500)}});
console.log(JSON.stringify(r,null,1));
await p.screenshot({path:'/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/audit_nav.png'});
await b.close()})();
