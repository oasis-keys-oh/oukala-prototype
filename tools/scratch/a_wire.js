const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const R=async(n,f)=>{try{const r=await p.evaluate(f);console.log('##',n,JSON.stringify(r))}catch(e){console.log('##',n,'EXC',e.message.slice(0,200))}};
await R('addDemand',()=>{const id=addDemand({title:'AUDITDEMAND_X',reason:'test',source:'audit',cost:50,service:SVCREG[0].n});go('port');const h=document.querySelector('#view').innerHTML;return {id,onPortInitial:h.includes('AUDITDEMAND_X'),inDEMAND:DEMAND.some(d=>d.n==='AUDITDEMAND_X')}});
await R('addDemand-other-tabs',()=>{const out={};document.querySelectorAll('#view .vsw label').forEach(l=>{l.click();out[l.textContent.trim()]=document.querySelector('#view').innerText.includes('AUDITDEMAND_X')});return out});
await R('tbm triggers',()=>{const t=TBMX.triggers();return {n:t.length,first:t[0]&&Object.keys(t[0]),ids:t.slice(0,3).map(x=>x.id)}});
await R('tbm trigger->demand',()=>{go('tbm_model');const t=TBMX.triggers()[0];const n0=DEMAND.length;const btn=document.querySelector('[data-tbm-demand]');const has=!!btn;if(btn)btn.click();const f=document.querySelector('#drawer, .formdr, [data-form]');
 // submit form
 const sub=[...document.querySelectorAll('#drawer button, dialog button, [popover] button')].find(b=>/Create demand/.test(b.textContent));if(sub)sub.click();return {has,sub:!!sub,added:DEMAND.length-n0,last:DEMAND[DEMAND.length-1].n,trig:DEMAND[DEMAND.length-1].trig}});
await R('tbm made ids',()=>({made:(window.SVCX&&SVCX.demands||[]).map(d=>d.id)}));
console.log(errs);await b.close()})();
