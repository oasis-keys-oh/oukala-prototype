const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const W=+process.env.W||1440;
const p=await (await b.newContext({viewport:{width:W,height:950}})).newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(1200);
await p.evaluate(()=>{DRAW.open(null,{name:"Vendor onboarding"})});await p.waitForTimeout(800);
const drag=async(type,wx,wy)=>{await p.evaluate(()=>{DRAW.closeProps();DRAW.ST.k=.6;DRAW.ST.px=30;DRAW.ST.py=20;DRAW.paint()});await p.waitForTimeout(250); // drag from palette item to world coords
 const it=p.locator(`[data-dr-pi="${type}"]:visible`).first();await it.scrollIntoViewIfNeeded();const bb=await it.boundingBox();
 const pt=await p.evaluate(([x,y])=>{const r=document.querySelector('#drSvg').getBoundingClientRect();return [r.left+DRAW.ST.px+x*DRAW.ST.k,r.top+DRAW.ST.py+y*DRAW.ST.k]},[wx,wy]);
 await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(bb.x+bb.width/2-40,bb.y+bb.height/2-30,{steps:4});await p.mouse.move(pt[0],pt[1],{steps:12});
 return pt};

const step=async(type,x,y)=>{const pt=await drag(type,x,y);await p.mouse.up();await p.waitForTimeout(250)};
await step('humantask',300,200);await step('gateway',520,200);await step('approval',760,200);await step('humantask',520,360);await step('end',980,200);
console.log('built',await p.evaluate(()=>JSON.stringify({s:DRAW.ST.doc.shapes.map(s=>s.id+s.t+'@'+s.x+','+s.y),c:DRAW.ST.doc.conns.map(c=>c.a+c.ap+'>'+c.b+c.bp+(c.lb?'['+c.lb+']':'')+(c.auto?'*':''))})));
await p.evaluate(()=>{DRAW.closeProps();DRAW.ST.sel.clear();DRAW.paint()});await p.waitForTimeout(300);
await p.screenshot({path:'shots_b13/t2_built.png'});
console.log('val',await p.evaluate(()=>JSON.stringify(DRAW.validate(DRAW.ST.doc).items.map(i=>i.lv+':'+i.title))));
console.log('errors',errs);await b.close()})();
