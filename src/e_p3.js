const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file:///tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const o={};const J=x=>String(JSON.stringify(x)).slice(0,500);
for(const k of ["B","T","LN","VID","CID","DEPTS","PRG","PJ","CATS","PL"]){const v=BUDX[k];o[k]=(typeof v)+" "+(Array.isArray(v)?v.length:"")+" "+J(Array.isArray(v)?v.slice(0,2):v)}
o.kb=J(KCSX.items().slice(0,1));o.kbn=KCSX.items().length;
o.proj=J(PROJ.slice(0,1));
o.ents=J(typeof NODES);
return o});console.log(JSON.stringify(r,null,1));await b.close()})();
