const {chromium}=require('playwright');const path=require('path');
module.exports=async function(w=1440,h=900){const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:h}});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve('/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_v16b/full.html'),{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(9000);return {b,p}};
