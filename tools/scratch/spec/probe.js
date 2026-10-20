const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());const t=Date.now();await p.goto('file://'+process.cwd()+'/out_v16b/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(3000);
console.log('load',Date.now()-t);
const r=await p.evaluate(()=>{const o={};
const names=['SCREENS','PERM','GUARD','ATLAS','PROCLIB','PROC','METRICS','EVENTS','ORGX','AGENTS_STATE','AGENTS','REG','NAVX','MODMAP','CONTRACT','DATAMODEL','GATE','FACTS','STORE','INBOX','ROLES','PERSONAS','APPROVALS','CONNECTORS','INTEG','BCDR','IMPORTERS','AGENT_REG','TIERS'];
for(const n of names){try{const v=eval(n);o[n]=typeof v+(v&&typeof v==='object'?' keys:'+Object.keys(v).slice(0,40).join(','):'')+(Array.isArray(v)?' len'+v.length:'')}catch(e){o[n]='ERR'}}
o.SC0=JSON.stringify(SCREENS.slice(0,3));return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
