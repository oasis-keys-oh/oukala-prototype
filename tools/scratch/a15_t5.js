const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const d of ['out_a15']){
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(d+'/full.html'),{waitUntil:'load',timeout:120000});await p.waitForTimeout(3500);
const r=await p.evaluate(()=>{const o={};try{const e=CONTRACT.evaluate('org_chart');o.contract=e.score!=null?e.score:JSON.stringify(e).slice(0,200)}catch(x){o.cerr=x.message}
 try{const a=ZLINK.audit();o.z=a&&(a.score!=null?a.score:Object.keys(a).slice(0,8))}catch(x){o.zerr=x.message}
 try{const m=window.METRICS.m_zl_score;o.zm=m&&m.cur}catch(x){}
 try{o.ev=window.EVENTS&&EVENTS.list().filter(e=>/^(person|vacancy)/.test(e.id)).map(e=>e.id+':'+e.enabledRules)}catch(x){}
 return o});console.log(d,JSON.stringify(r).slice(0,900),errs);await p.close()}
await b.close()})();
