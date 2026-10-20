const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
let first=true;
for(const [scheme,w,h,tag] of [['dark',1440,1000,'dark'],['light',1440,1000,'light'],['dark',400,820,'phone']]){
const p=await (await b.newContext({viewport:{width:w,height:h},colorScheme:scheme})).newPage();p.setDefaultTimeout(250000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve('out_g14/full.html'));await p.waitForTimeout(7000);
await p.evaluate(()=>go('zl_conn'));await p.waitForTimeout(1500);
if(first){first=false;console.log(await p.evaluate(()=>{const e=CONTRACT.evaluate('zl_conn');return JSON.stringify({score:e.score,gaps:e.gaps,rules:Object.fromEntries(Object.entries(e.rules||{}).map(([k,v])=>[k,v.st]))})}))}
for(const [i,n] of [[0,'overview'],[1,'gaps'],[2,'dead'],[3,'orphans'],[4,'fan'],[5,'fixes'],[6,'metrics']]){await p.evaluate(i=>{S.v.zl_v=i;render()},i);await p.waitForTimeout(900);
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);await p.screenshot({path:`out_g14/shots/zl_${n}_${tag}.png`});if(ox)console.log('OVERFLOW',tag,n)}
console.log(tag,'errors',errs);await p.context().close()}
await b.close()})();
