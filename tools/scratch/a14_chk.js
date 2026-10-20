const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=process.argv[2];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(dir+'/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(600);
const ids=await p.evaluate(()=>SCREENS.map(s=>s.id||s[0]).slice(0,400));
const hits={};let nScr=0;
for(const id of ids){try{await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(120);
 const t=await p.evaluate(()=>{const v=document.getElementById('view').innerText;const m=[];const rx=/Chief Editor|Invoice Advisor|Forecast Agent|Drafting Agent|Personal assistant|Approval Advisor|Knowledge Curator|Triage Agent|PMO Agent|Ops Agent/g;let x;while((x=rx.exec(v))&&m.length<4)m.push(v.slice(Math.max(0,x.index-20),x.index+x[0].length+10).replace(/\n/g,'/'));return m});
 if(t.length){hits[id]=t;nScr++}}catch(e){}}
console.log(nScr,'screens with old strings');Object.entries(hits).slice(0,40).forEach(([k,v])=>console.log(k,JSON.stringify(v)));console.log(errs.slice(0,3));await b.close()})();
