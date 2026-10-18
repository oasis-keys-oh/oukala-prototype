const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a15/full.html'),{waitUntil:'load',timeout:120000});await p.waitForTimeout(6000);
const r=await p.evaluate(()=>{const a=ZLINK.audit(true);const s=JSON.stringify(a);const out=[];const re=/(org_|compensation_record|benefit_enrollment|pto_|m_org_|org5|vacanc|"position")/i;
 (function walk(o,path){if(o&&typeof o==='object'){for(const k in o){walk(o[k],path+'.'+k)}}else if(typeof o==='string'&&re.test(o))out.push(path+': '+o.slice(0,160))})(a,'');return out.slice(0,40)});
console.log(r.join('\n'),errs);await b.close()})();
