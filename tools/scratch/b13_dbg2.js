const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(1200);
await p.evaluate(()=>DRAW.open(null,{tpl:'tpl_incident'}));await p.waitForTimeout(700);
console.log(await p.evaluate(()=>{const D=DRAW,d=D.ST.doc;const c=d.conns[2];const pts=D.route(d,c);const m=D.labelPt(pts);
 const c1=BYK=null;const hyp={id:'__g',t:'notification',x:m[0]-75,y:m[1]-28,w:150,h:56,n:'x'};const pl=D.plan(d,hyp);
 return JSON.stringify({m,pts,kind:pl.kind,hit:!!D.hitConn(d,m,14,[]),conns:d.conns.map(c=>c.id+':'+c.a+c.ap+'>'+c.b+c.bp)})}));
console.log(errs);await b.close()})();
