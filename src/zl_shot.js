const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const scheme of ['light','dark']){
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:scheme})).newPage();p.setDefaultTimeout(150000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve('out_g14/full.html'));await p.waitForTimeout(6000);
if(scheme==='dark')await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')});
await p.evaluate(()=>go('zl_conn'));await p.waitForTimeout(1500);
for(const [i,n] of [[0,'overview'],[1,'gaps'],[2,'dead'],[4,'fan'],[5,'fixes']]){await p.evaluate(i=>{S.v.zl_v=i;render()},i);await p.waitForTimeout(900);await p.screenshot({path:`out_g14/shots/zl_${n}_${scheme}.png`})}
console.log(scheme,'errors',errs);}
await b.close()})();
