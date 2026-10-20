const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const T=[['incident',{type:'incident',id:'INC0412'}],['change',{type:'change',id:'CHG0314'}],['problem',{type:'problem',id:'PRB0010'}],['release',{type:'release',id:'REL-2607'}],['ci',{type:'ci',id:CIid=null}],['service',{type:'service',id:'svc_portal'}]];
for(const [n,t] of T){ if(n==='ci'){t.id=await p.evaluate(()=>CIREG[3].id);}
 const r=await p.evaluate(t=>{try{const d=document.getElementById('drawer');if(d.matches(':popover-open'))d.hidePopover();openImpact(t);const o=document.getElementById('drawer');return {open:o.matches(':popover-open'),head:(o.querySelector('h1,h2,h3')||{}).textContent,len:o.innerText.length,hasMap:!!o.querySelector('svg'),dollars:/\$[\d,]+/.test(o.innerText),sla:/SLA|error budget/i.test(o.innerText),proj:/project/i.test(o.innerText)}}catch(e){return {err:e.message}}},t);console.log(n,JSON.stringify(r))}
await p.screenshot({path:'aud/imp_svc.png'});
// UI buttons present?
for(const [scr,sel] of [['itsm_inc','Impact analysis'],['itsm_chg','mpact'],['itsm_prb','Impact analysis'],['itsm_rel','mpact'],['itom_cmdb','mpact'],['svc_360','mpact']]){await p.evaluate(i=>go(i),scr);await p.waitForTimeout(300);const n=await p.evaluate(s=>[...document.querySelectorAll('#view button')].filter(b=>b.textContent.includes(s)).length,sel);console.log(scr,'buttons containing',sel,n)}
console.log(errs);await b.close()})();
