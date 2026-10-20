// PH-14 scratch: read every registered screen with its real name, nav group, hero, tabs and record types.
// Usage: node tools/scratch/ia/extract.js build_out   Writes tools/scratch/ia/screens.json
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(2500);
const meta=await p.evaluate(()=>{const G=f=>{try{return f()}catch(e){return null}};
 return {
  screens:SCREENS.map(s=>({id:s[0],name:s[1],group:s[3]||'',nav:G(()=>NAVX.resolve(s[0])),navLabel:G(()=>NAVX.label(s[0])),groupLabel:G(()=>NAVX.groupLabel(NAVX.resolve(s[0]).g)),mode:G(()=>DATA.screenMode(s[0])),hidden:!!G(()=>R15.hidden[s[0]]),alias:G(()=>R15.alias[s[0]]&&R15.alias[s[0]].to)||'',fam:G(()=>R15.famOf[s[0]]&&R15.famOf[s[0]].id)||'',famLabel:G(()=>R15.famOf[s[0]]&&R15.famOf[s[0]].label)||''})),
  groups:G(()=>NAVX.groups.map(g=>({id:g.id,label:g.label,blurb:g.blurb}))),
  personas:G(()=>Object.keys(PERSONAS).map(k=>({k,n:PERSONAS[k].n,who:PERSONAS[k].who,family:PERSONAS[k].family,groups:PERSONAS[k].groups,pin:PERSONAS[k].pin,nav:PERSONAS[k].nav}))),
  families:G(()=>R15.families.map(f=>({id:f.id,label:f.label,views:f.views}))),
  modes:G(()=>DATA.screens()),
  demoKeys:G(()=>Object.keys(SHOW.demos)),
  demoSample:G(()=>JSON.stringify(SHOW.demos[Object.keys(SHOW.demos)[0]]).slice(0,1500)),
  objs:G(()=>EXE.cascade().nodes.map(n=>({id:n.id,lvl:n.lvl,n:n.n,owner:n.owner,team:n.team||'',grp:n.grp||'',up:n.up,kr:n.kr||''})))
 }});
const out=[];
for(const s of meta.screens){
 await p.evaluate(i=>{try{go(i)}catch(e){}},s.id).catch(()=>{});await p.waitForTimeout(220);
 const r=await p.evaluate(()=>{const v=document.querySelector('#view');const t=x=>(x&&x.textContent||'').replace(/\s+/g,' ').trim();
  const h1=v.querySelector('.hero h1')||v.querySelector('h1')||v.querySelector('h2');const eb=v.querySelector('.hero .eyebrow');
  const tabs=[...v.querySelectorAll('[role=tab], .tabs button, .vtabs button, .seg button')].map(t).filter(x=>x&&x.length<40);
  const links={};v.querySelectorAll('[data-link]').forEach(e=>{const k=String(e.getAttribute('data-link')).split(':')[0];links[k]=(links[k]||0)+1});
  const nums={};v.querySelectorAll('[data-num-open],[data-num]').forEach(e=>{const k=String(e.getAttribute('data-num-open')||e.getAttribute('data-num')).replace(/[-0-9.].*$/,'');nums[k]=(nums[k]||0)+1});
  const ths=[...v.querySelectorAll('th')].slice(0,12).map(t);
  return {hero:t(h1).slice(0,140),eyebrow:t(eb).slice(0,80),tabs:[...new Set(tabs)].slice(0,14),links,nums,ths,owners:v.querySelectorAll('[data-owner]').length,fchips:v.querySelectorAll('.fchip,[data-metric]').length,len:t(v).length}});
 out.push(Object.assign({},s,r));
}
fs.writeFileSync(path.join(__dirname,'screens.json'),JSON.stringify({meta:Object.assign({},meta,{screens:undefined}),screens:out},null,1));
console.log(out.length,'screens');await b.close()})();
