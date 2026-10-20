const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const W=+process.env.W||1440;
const ctx=await b.newContext({viewport:{width:W,height:950},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(1200);
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){console.log('EVERR',e.message.slice(0,200))}};
await ev(()=>DRAW.open(null,{name:"Vendor onboarding"}));await p.waitForTimeout(600);
await ev(()=>{const D=DRAW,c=D.ST.doc;D.ST.k=.7;D.ST.px=30;D.ST.py=20;
 const mk=(t,x,y,n,o)=>{D.placeShape(t,x,y,Object.assign({n},o||{}))};
 mk('humantask',280,200,'Collect vendor form',{owner:'Procurement lead'});mk('aistep',520,200,'Check form against policy',{owner:'Contract Analyst Agent'});mk('gateway',740,200,'Risk acceptable?');
 mk('approval',960,200,'Procurement approves',{owner:'Procurement lead'});mk('humantask',740,360,'Return for rework',{owner:'Requester'});mk('sysaction',1180,200,'Create vendor record',{owner:'Contract Repository'});mk('end',1380,200,'Done');
 D.closeProps();D.ST.sel.clear();D.paint()});
await p.waitForTimeout(400);
console.log('A',await ev(()=>JSON.stringify({c:DRAW.ST.doc.conns.map(c=>c.a+c.ap+'>'+c.b+c.bp+(c.lb?'['+c.lb+']':'')),v:DRAW.validate(DRAW.ST.doc).items.filter(i=>i.lv!=='ok').map(i=>i.title)})));
// manual connect: drag from rework 'r' port... use mouse: drag port of Return for rework to Check form (loop back)
await ev(()=>DRAW.cmd('fit'));await p.waitForTimeout(300);
const geo=await ev(()=>{const D=DRAW,s=D.ST.doc.shapes.find(x=>x.n==='Return for rework'),t=D.ST.doc.shapes.find(x=>x.n==='Collect vendor form');const r=document.querySelector('#drSvg').getBoundingClientRect(),k=D.ST.k;const P=(x,y)=>[r.left+D.ST.px+x*k,r.top+D.ST.py+y*k];return {a:P(s.x,s.y+s.h/2),b:P(t.x+t.w/2,t.y+t.h/2),sc:P(s.x+s.w/2,s.y+s.h/2)}});
// hover shape then drag from its left port
await p.mouse.move(geo.sc[0],geo.sc[1]);await p.waitForTimeout(150);
await p.mouse.move(geo.a[0],geo.a[1]);await p.mouse.down();await p.mouse.move((geo.a[0]+geo.b[0])/2,(geo.a[1]+geo.b[1])/2,{steps:6});await p.screenshot({path:'shots_b13/t3_conn_drag.png'});await p.mouse.move(geo.b[0],geo.b[1],{steps:6});await p.mouse.up();await p.waitForTimeout(400);
console.log('B conn manual',await ev(()=>JSON.stringify(DRAW.ST.doc.conns.filter(c=>!c.auto).map(c=>c.a+c.ap+'>'+c.b+c.bp))));
await ev(()=>{DRAW.ST.selC=null;DRAW.closeProps();DRAW.ST.sel.clear();DRAW.paint()});await p.waitForTimeout(300);
await p.screenshot({path:'shots_b13/t3_full_'+W+'.png'});
// click select a shape -> drawer
const c1=await ev(()=>{const D=DRAW,s=D.ST.doc.shapes.find(x=>x.n==='Check form against policy'),r=document.querySelector('#drSvg').getBoundingClientRect(),k=D.ST.k;return [r.left+D.ST.px+(s.x+s.w/2)*k,r.top+D.ST.py+(s.y+s.h/2)*k]});
await p.mouse.click(c1[0],c1[1]);await p.waitForTimeout(600);
console.log('drawer open',await ev(()=>!!document.querySelector('#drawer [data-dr-props]')&&document.getElementById('drawer').matches(':popover-open')));
await p.screenshot({path:'shots_b13/t3_props_'+W+'.png'});
// edit field
await p.fill('#drawer #drp_sla','2 business days');await p.fill('#drawer #drp_ctl','Policy check log');await p.click('#drawer [data-dr-who="agent"]');await p.waitForTimeout(200);
console.log('edited',await ev(()=>{const s=DRAW.ST.doc.shapes.find(x=>x.n==='Check form against policy');return JSON.stringify([s.sla,s.ctl,s.who])}));
// undo / redo via keys
await p.keyboard.press('Escape');await p.waitForTimeout(200);
await ev(()=>{DRAW.ST.sel=new Set([DRAW.ST.doc.shapes.find(x=>x.n==='Done').id]);DRAW.paint()});await p.focus('#drSvg');
const before=await ev(()=>DRAW.ST.doc.shapes.find(x=>x.n==='Done').x);
await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');const after=await ev(()=>DRAW.ST.doc.shapes.find(x=>x.n==='Done').x);
await p.keyboard.press('Control+z');const u1=await ev(()=>DRAW.ST.doc.shapes.find(x=>x.n==='Done').x);await p.keyboard.press('Control+Shift+Z');const r1=await ev(()=>DRAW.ST.doc.shapes.find(x=>x.n==='Done').x);
console.log('keys move/undo/redo',before,after,u1,r1);
// duplicate + copy paste
const n0=await ev(()=>DRAW.ST.doc.shapes.length);await p.keyboard.press('Control+d');const n1=await ev(()=>DRAW.ST.doc.shapes.length);await p.keyboard.press('Control+z');const n2=await ev(()=>DRAW.ST.doc.shapes.length);
console.log('dup',n0,n1,n2);
// align / distribute
await ev(()=>{const D=DRAW;D.ST.sel=new Set(D.ST.doc.shapes.filter(s=>['humantask','aistep','approval'].includes(s.t)).map(s=>s.id));D.align('t');});
console.log('align top',await ev(()=>JSON.stringify([...DRAW.ST.sel].map(i=>DRAW.getS(DRAW.ST.doc,i).y))));
await ev(()=>DRAW.distribute('h'));
// swimlanes
await ev(()=>DRAW.cmd('lanes'));await p.waitForTimeout(400);await ev(()=>DRAW.fit());await p.waitForTimeout(300);
console.log('lanes',await ev(()=>JSON.stringify(DRAW.ST.doc.shapes.filter(s=>s.t==='swimlane').map(s=>s.n))));
await p.screenshot({path:'shots_b13/t3_lanes_'+W+'.png'});
// AI panel
await ev(()=>{DRAW.ST.sel=new Set([DRAW.ST.doc.shapes.find(x=>x.n==='Create vendor record').id]);DRAW.cmd('ai')});await p.waitForTimeout(400);
await p.screenshot({path:'shots_b13/t3_ai_'+W+'.png'});
console.log('sugg',await ev(()=>JSON.stringify(DRAW.ST.sugg.map(s=>s.n))));
await ev(()=>DRAW.cmd('ai'));
// validation checks panel
await ev(()=>{DRAW.ST.checks=true;DRAW.paint()});await p.waitForTimeout(300);
await p.screenshot({path:'shots_b13/t3_checks_'+W+'.png'});
console.log('errors',errs);await b.close()})();
