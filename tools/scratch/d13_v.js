const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_d13');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(7000);
console.log(await p.evaluate(()=>{const n0=BUDX.B().lines.length;const r=BUDREQ.submit({t:'Search relevance tuning',type:'New initiative',amt:60000,yrs:1,c_Labor:40000,c_Vendor:20000,color:'OP-U',src:'Operating budget',proj:'PR1',req:'Priya Shah',sp:'Dev Rao',cc:'CC-4411',obj:'O1',ben:90000,risk:'Low',alt:'Do nothing, relevance stays poor',why:'Complaints',what:'Tune'});
 const x=[BUDREQ.decide(r.id,'Approve','','Maya Ortiz'),BUDREQ.decide(r.id,'Approve','','Avery Chen'),BUDREQ.decide(r.id,'Approve','','Dev Rao'),BUDREQ.decide(r.id,'Approve','','Casey Rowan')];
 const led=BUDX.B().led.filter(l=>l.st==='Pending').length;return JSON.stringify({route:r.route,x,newLines:BUDX.B().lines.length-n0,st:BUDREQ.requests().find(q=>q.id===r.id).st,pendingLed:led,self:BUDREQ.decide('BR-0108','Approve','','Maya Ortiz')})}));
await p.evaluate(()=>{go('bud_req');S.v.budreq=2;render()});await p.waitForTimeout(500);await p.screenshot({path:dir+'/shots/d_an.png',fullPage:true});
await p.evaluate(()=>{S.v.budreq=3;render()});await p.waitForTimeout(400);await p.screenshot({path:dir+'/shots/d_rules.png'});
console.log(errs);await b.close()})();
