const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=process.argv[2];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(dir+'/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(500);
const scr=[['org_chart',0],['org_chart',1],['org_chart',2],['org_chart',3],['org_chart',4],['org_chart',5],['org_chart',6],['org_chart',7],['own_gaps',0],['tower',0],['gov_ai',0]];
const tabs=await p.evaluate(()=>S.org.tab);console.log('tab',tabs);
for(const t of ['chart','report','dir','own','map','studio']){await p.evaluate(t=>{S.org.tab=t;go('org_chart');render()},t).catch(e=>console.log(e.message));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const v=document.getElementById('view');const w=document.createTreeWalker(v,NodeFilter.SHOW_TEXT);const o=[];let n;while(n=w.nextNode()){const t=n.nodeValue.trim();if(t.length>70&&/[.!]\s|\.$/.test(t)&&!n.parentElement.closest('script,style'))o.push(t.slice(0,170))}return o});console.log('== '+t+' ('+r.length+')');r.slice(0,14).forEach(x=>console.log('  '+x))}
console.log(errs);await b.close()})();
