const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1400,height:1000}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto('file://'+path.resolve('out_svc360/full.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const o={};o.tg=TBMX.triggers().map(t=>t.inWeeks+"w "+t.kind+" "+t.text.slice(0,90));
 const all=[];['svc_cod','svc_portal','svc_search','svc_id','svc_net','svc_desk'].forEach(id=>{const a=SVCX.assess([id],4);all.push(id+" down"+a.down.length+" deg"+a.deg.length+" users"+a.users)});o.imp=all;
 ['ci_sea0','ci_cod2','ci_tenant','ci_az'].forEach(id=>{const a=SVCX.assess([id],4);o[id]=a.down.map(s=>s.n).join(",")+" | deg "+a.deg.length});
 o.uc=TBMX.unitCost('svc_search');o.fc=TBMX.forecast({service:'svc_search'}).crossesInWeeks;return o});
console.log(JSON.stringify(r,null,1));
// exercise all tabs / forms / drawers
const steps=[["go('svc_360');S.svc360.sel='svc_portal';for(let i=0;i<9;i++){S.v.s360d=i;render()}"],["offDrawer"],
["openImpact({type:'incident',id:'INC0412'})"],["openImpact({type:'problem',id:'PRB0010',service:'Search service'})"],["openImpact({type:'request',service:'Contract Repository'})"],["openImpact({type:'release',service:'Identity'})"],["SCALE.set(true);openImpact({type:'ci',id:'CI100123'})"],["openImpact({type:'service',service:'Network and VPN'});S.imp.depth=5;S.imp.dir='both';impRender&&0"],
["go('svc_360');S.svc360.sel='svc_search';render();for(let i=0;i<9;i++){S.v.s360d=i;render()}"],["go('tbm_model');for(let i=0;i<5;i++){S.v.tbmv=i;render()}"],["S.tbm.focus='svc_search';S.v.tbmv=0;render();S.tbm.sel='t:Compute';render()"]];
for(const [js] of steps){try{await p.evaluate(js)}catch(e){errs.push('EV '+js.slice(0,30)+' '+e.message)}await p.waitForTimeout(150)}
console.log('ERRS',errs);await b.close()})();
