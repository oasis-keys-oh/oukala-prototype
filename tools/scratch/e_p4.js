const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file:///tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const o={};const J=x=>String(JSON.stringify(x)).slice(0,500);
o.LN=J(BUDX.LN().slice?BUDX.LN().slice(0,2):BUDX.LN());o.VID=J(BUDX.VID());o.CID=J(BUDX.CID());o.PJ=J(BUDX.PJ());o.PL=J(BUDX.PL());o.B=J(BUDX.B());o.T=J(BUDX.T());
o.vendorsrc=J(Object.keys(window).filter(k=>/vend|contract|inv/i.test(k)));
o.INV=J(INVOICES.slice(0,1));
return o});console.log(JSON.stringify(r,null,1));await b.close()})();
