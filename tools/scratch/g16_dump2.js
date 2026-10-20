const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.route(/^https:/,r=>r.abort());
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(1500);
const o=await p.evaluate(()=>{const r={};
r.navx=Object.keys(NAVX).join(",");
try{r.groups=NAVX.groups?JSON.stringify(NAVX.groups).slice(0,3000):'';}catch(e){r.groups='err'}
r.atlas=Object.keys(ATLAS).join(",");
try{const es=ATLAS.entities?ATLAS.entities():ATLAS.ents;r.ent=(es||[]).length;r.e0=JSON.stringify((es||[])[0]).slice(0,600);}catch(e){r.ent=e.message}
r.dm=Object.keys(DATAMODEL.tables||{}).length;
r.stor=Object.keys(STORE).join(",");r.ev=Object.keys(EVENTS).join(",");
r.cont=Object.keys(CONTRACT).join(",");
return r});
console.log(JSON.stringify(o,null,1));await b.close()})();
