const {chromium}=require('playwright');
(async()=>{const a=process.argv.slice(2);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
await p.goto('file://'+process.cwd()+'/'+a[0]+'/full.html');await p.waitForTimeout(900);
const ids=a[1]?a[1].split(','):await p.evaluate(()=>SCREENS.map(s=>s[0]));
const roles={'card title':'.card>h3,.card h3','th':'th','td':'td','pill':'.pill','btn':'.btn','chip':'.chip','eyebrow':'.eyebrow','tile label':'.tile .lbl,.tile small','kv dt':'.kv dt','kv dd':'.kv dd'};
const agg={};
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(100);
 const r=await p.evaluate(roles=>{const o={};for(const k in roles){o[k]=[...document.querySelectorAll('#view '+roles[k].split(',').join(',#view '))].filter(e=>e.checkVisibility&&e.checkVisibility()).slice(0,60).map(e=>{const c=getComputedStyle(e);return c.fontFamily.split(',')[0].replace(/"/g,'')+' '+c.fontSize+' '+c.fontWeight})}return o},roles);
 for(const k in r){agg[k]=agg[k]||{};r[k].forEach(v=>agg[k][v]=(agg[k][v]||0)+1)}}
for(const k in agg){console.log('##',k);Object.entries(agg[k]).sort((x,y)=>y[1]-x[1]).slice(0,10).forEach(([v,n])=>console.log('  ',n,v))}
await b.close()})();
