const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(30000);
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a14/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(500);
await p.evaluate(()=>go('adm_audit'));await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{const w=document.createTreeWalker(document.getElementById('view'),NodeFilter.SHOW_TEXT);let n,o=[];while(n=w.nextNode()){if(/^\s*(Forecast Agent|First Officer|Invoice Advisor)\s*$/.test(n.nodeValue)){let e=n.parentElement,path=[];for(let i=0;i<5&&e;i++){path.push(e.tagName+'.'+(e.className||'')+(e.id?'#'+e.id:''));e=e.parentElement}o.push(JSON.stringify(n.nodeValue)+' '+path.join(' < '))}}return o.slice(0,5).join('\n')}));await b.close()})();
