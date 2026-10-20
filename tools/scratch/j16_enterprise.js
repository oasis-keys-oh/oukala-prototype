/* Enterprise-scale picker test: node j16_enterprise.js out_j16 [n1,n2]. Fresh page per size so generated data is clean. */
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'out_j16');const sizes=(process.argv[3]||'50,500').split(',').map(Number);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});let fail=0;const out=[];
for(const n of sizes){
 const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PE '+e.message));await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:240000});await p.waitForTimeout(1200);
 await p.evaluate(n=>{SCALE.n.projects=n;SCALE._pj=null;SCALE.set(true)},n);await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const o={};const L=LISTS.projects();o.lists=L.length;const ids=new Set(L.map(x=>x.id));
  o.uproj=UPROJ().length;o.uprojSubset=UPROJ().every(x=>ids.has(x.id));o.dupIds=L.length-ids.size;
  o.adapterCount=LISTS.adapter('projects').count();
  const t=[];
  for(const [scr,id] of [['strat_exec','sx_proj'],['bud_model','bud_mproj'],['plan','plan_proj']]){
   go(scr);const t1=performance.now();document.body.appendChild(document.createElement('i'));document.body.offsetHeight;const base=Math.round(performance.now()-t1);const btn=document.querySelector('[data-pk2-open="'+id+'"]');if(!btn){t.push({scr,id,err:'missing'});continue}
   let open=1e9;for(let k=0;k<3;k++){btn.click();open=Math.min(open,PICKER.perf.open);PICKER.close_all();if(k<2)continue}btn.click();const q=document.querySelector('[data-pk2="'+id+'"] .pk2-q');q.value='a';q.dispatchEvent(new Event('input',{bubbles:true}));
   t.push({scr,id,base,open,filter:PICKER.perf.filter,rows:PICKER.perf.rows,win:PICKER.perf.windowRows});PICKER.close_all()}
  o.t=t;return o});
 const bad=[];if(r.lists!==n)bad.push('lists '+r.lists+' != '+n);if(!r.uprojSubset)bad.push('UPROJ not subset');if(r.dupIds)bad.push('dup ids');
 r.t.forEach(x=>{if(x.err)bad.push(x.id+' '+x.err);else{if(x.open>Math.max(150,x.base*3+60)&&x.open>400)bad.push(x.id+' open '+x.open+' vs page reflow '+x.base);if(x.filter>50)bad.push(x.id+' filter '+x.filter);if(x.win>60)bad.push(x.id+' window '+x.win)}});
 if(errs.length)bad.push('errors '+errs[0]);
 out.push({n,pass:!bad.length,bad,r});if(bad.length)fail++;await p.close()}
console.log(JSON.stringify(out,null,1));console.log(fail?'ENTERPRISE FAIL':'ENTERPRISE PASS');await b.close();process.exit(fail?1:0)})();
