const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file:///tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13/full.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const o={};const J=x=>String(JSON.stringify(x)).slice(0,700);
o.agents=J(ORGX.agents);o.agentsOf=J(ORGX.agentsOf("Kenji Watanabe"));o.resolve=J(ORGX.resolve("Tom Becker"));
o.audit=String(audit).slice(0,200);o.btHTML=String(btHTML).slice(0,300);o.pchip=J(pchip("Tom Becker"));
o.apps=J(GATE.apps()[0]);o.ba=J(Object.keys(NAVX.map).filter(k=>/^(plat|adm|own)/.test(k)));
o.PLATent=J(Object.keys(PLAT));
return o});console.log(JSON.stringify(r,null,1));await b.close()})();
