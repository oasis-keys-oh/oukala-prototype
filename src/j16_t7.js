const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:240000});await p.waitForTimeout(1500);
await p.evaluate(()=>go('adm_studio'));await p.waitForTimeout(500);await p.click('label:has-text("Tables and forms")');await p.waitForTimeout(700);
await p.evaluate(()=>{document.querySelector('.admx').scrollIntoView()});await p.waitForTimeout(300);await p.screenshot({path:dir+'/j_a2.png'});
await p.click('.admx [data-admx-sub="Coverage"],.admx button:has-text("Coverage")');await p.waitForTimeout(500);await p.screenshot({path:dir+'/j_a3.png'});
// Enterprise test
const res=[];
for(const n of [50,500]){
 await p.evaluate(n=>{SCALE.n.projects=n;SCALE._pj=null;SCALE.set(true)},n);await p.waitForTimeout(800);
 const r=await p.evaluate(()=>{const out={};const L=LISTS.projects();out.lists=L.length;
  const ids=new Set(L.map(x=>x.v));
  try{out.uproj=UPROJ().length;out.uprojSubset=UPROJ().every(x=>ids.has(x.id))}catch(e){out.uproj='ERR'}
  try{out.allProj=allProj().length}catch(e){out.allProj='ERR'}
  try{const reg=window.D&&D.reg;out.kreg=Array.isArray(reg)?reg.length:null}catch(e){}
  const t=[];
  for(const [scr,id] of [['strat_exec','sx_proj'],['bud_model','bud_mproj'],['plan','plan_proj']]){
   try{go(scr);const el=document.querySelector('[data-pk2="'+id+'"]');if(!el){t.push([scr,'none']);continue}
    const t0=performance.now();document.querySelector('[data-pk2-open="'+id+'"]').click();const open=Math.round(performance.now()-t0);
    const q=document.querySelector('[data-pk2="'+id+'"] .pk2-q');q.value='a';q.dispatchEvent(new Event('input',{bubbles:true}));
    t.push([scr,id,open,PICKER.perf.filter,PICKER.perf.rows]);document.body.click();PICKER.close_all()}catch(e){t.push([scr,'ERR '+e.message])}}
  out.t=t;return out});
 res.push([n,r]);}
console.log(JSON.stringify(res));
console.log(await p.evaluate(()=>{go('r16j_dash');return 'ok'}));
console.log(errs.slice(0,5));await b.close()})();
