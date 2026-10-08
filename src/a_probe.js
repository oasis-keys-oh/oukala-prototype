const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const o={};
o.screens=SCREENS.length;o.sample=SCREENS.slice(0,100).map(s=>s.slice(0,3).join('|')).join('\n');
for(const g of ['SVCREG','CIREG','DATAMODEL','METRICS','WFX','PROC','SCALE','REQREG','CHATX','PPMX','RELX','SOWX','SKILLSDB','lrHTML','fchip','openImpact','addDemand','person360','openDrawer','SVCX','TBMX','TBM','ONCALL','OCX','SLAX','VIZ','KGX','AUDIT']){let v;try{v=eval(g)}catch(e){v=undefined}
 o['g_'+g]=v===undefined?'UNDEF':(typeof v)+(v&&typeof v==='object'?' keys:'+Object.keys(v).slice(0,40).join(','):'');}
return o});
console.log(r.sample);delete r.sample;console.log(JSON.stringify(r,null,1));console.log(errs);await b.close()})();
