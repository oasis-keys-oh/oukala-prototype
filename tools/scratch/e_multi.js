const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const [dir,mode,...jobs]=process.argv.slice(2);const dark=mode==='dark';const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:dark?'dark':'light'})).newPage();p.setDefaultTimeout(150000);const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(dir,'full.html'));
await p.waitForFunction(()=>window.ZLINK&&ZLINK.state.fixed.fx_r15e_n,null,{timeout:200000}).catch(()=>errs.push('boot not finished'));await p.waitForTimeout(2500);
if(dark)await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
await p.evaluate(()=>{const E=window.EVENTS;E.emit('decision.approved',{kind:'Invoice',recordId:'INV-20433',amount:84000,actor:'Casey Rowan',module:'inv'},{source:'inv',actor:'Casey Rowan'});E.emit('decision.rejected',{kind:'Change',recordId:'CHG0044',amount:0,actor:'Nia Brooks',reason:'Freeze window',module:'chg'},{source:'chg'});E.emit('person.terminated',{personId:'priya-shah',lastDay:'2026-10-30',reason:'Resigned'},{source:'People'});E.emit('decision.deferred',{kind:'Budget',recordId:'RL-04',until:'2026-10-15',actor:'Casey Rowan',module:'bud'},{source:'bud'})});
const ox=[];for(const j of jobs){const [scr,tab]=j.split(':');await p.evaluate(([s,t])=>{S.v[s==='zl_conn'?'zl_v':'zevt_v']=+t;go(s)},[scr,tab]);await p.waitForTimeout(1800);
 ox.push(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));const out=path.join(dir,'shots',`${scr}-${tab}-${mode}.png`);fs.mkdirSync(path.dirname(out),{recursive:true});await p.screenshot({path:out});console.log(out)}
console.log('overflow',ox,'errs',errs);await b.close()})();
