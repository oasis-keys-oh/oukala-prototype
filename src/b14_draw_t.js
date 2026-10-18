const {chromium}=require('playwright');const path=require('path');
const scheme=process.argv[2]||'light';const dir=path.resolve('out_b14');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:scheme});const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>m.type()==='error'&&p.errs.push(m.text()));
await p.goto('file://'+dir+'/full.html',{waitUntil:'commit',timeout:90000});await p.waitForTimeout(9000);
const setup=async(kind)=>{await p.evaluate(kind=>{DRAW.open('Insert test '+Math.random());const D=DRAW,d=D.ST.doc;const A=D.addShape(d,'start',60,200),R=D.addShape(d,'task',200,190,{n:'Request'}),P=D.addShape(d,'approval',430,190,{n:'Approval'}),E=D.addShape(d,'end',700,200);
 if(kind==='gw'){const G=D.addShape(d,'gateway',430,190,{n:'Approved?'});d.shapes=d.shapes.filter(s=>s.id!==P.id);const Y=D.addShape(d,'task',620,120,{n:'Pay'}),N=D.addShape(d,'task',620,290,{n:'Reject'});D.addConn(d,A.id,R.id,'r','l');D.addConn(d,R.id,G.id,'r','l');D.addConn(d,G.id,Y.id,'r','l',{lb:'Yes'});D.addConn(d,G.id,N.id,'b','l',{lb:'No'});D.addConn(d,Y.id,E.id,'r','l');}
 else{D.addConn(d,A.id,R.id,'r','l');D.addConn(d,R.id,P.id,'r','l');D.addConn(d,P.id,E.id,'r','l')}
 D.ST.fit=true;D.paint();},kind);await p.waitForTimeout(400);await p.evaluate(()=>{document.querySelectorAll('details[data-dr-cat]').forEach(d=>d.open=true);DRAW.closeProps();DRAW.fit();});await p.waitForTimeout(600)};
const scr=(x,y)=>p.evaluate(([x,y])=>{const r=document.querySelector('#drSvg').getBoundingClientRect(),S=DRAW.ST;return[r.left+S.px+x*S.k,r.top+S.py+y*S.k]},[x,y]);
const st=()=>p.evaluate(()=>{const d=DRAW.ST.doc;return{n:d.shapes.map(s=>s.t+':'+s.n),c:d.conns.map(c=>{const a=d.shapes.find(s=>s.id===c.a),b=d.shapes.find(s=>s.id===c.b);return a.n+'>'+b.n+(c.lb?'['+c.lb+']':'')}),ov:DRAW.overlaps(d).length,undo:DRAW.ST.undo.length}});
const midC=(a,b,f)=>p.evaluate(([a,b,f])=>{const d=DRAW.ST.doc,A=d.shapes.find(s=>s.n===a),B=d.shapes.find(s=>s.n===b),c=d.conns.find(c=>c.a===A.id&&c.b===B.id),m=DRAW.midPt(d,c,f);return m.slice(0,2)},[a,b,f]);
const palPos=async(t)=>{await p.locator(`[data-dr-pi="${t}"]:visible`).first().scrollIntoViewIfNeeded();const bb=await p.locator(`[data-dr-pi="${t}"]:visible`).first().boundingBox();return[bb.x+bb.width/2,bb.y+bb.height/2]};
const shot=n=>p.screenshot({path:`${dir}/shots/b14_draw_${n}_${scheme}.png`});
// 1 palette drag on connector
await setup();let s0=await st();console.log(JSON.stringify(s0));
let [px,py]=await palPos('gateway');let m=await midC('Request','Approval');let [mx,my]=await scr(...m);
await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+30,py+10,{steps:3});await p.mouse.move(mx,my,{steps:12});await p.waitForTimeout(450);
let hv=await p.evaluate(()=>DRAW.ST.hov&&DRAW.ST.hov.kind);ok(hv==='conn','hover kind conn while dragging: '+hv);
ok(await p.locator('#drSvg .dr-c.ins').count()===1,'connector glow class present');
ok((await p.locator('#drSvg .dr-insl').textContent()).includes('Insert here'),'+ Insert here pill');
await shot('1_conn');
await p.mouse.up();await p.waitForTimeout(400);let s1=await st();console.log(JSON.stringify(s1));
ok(s1.n.length===s0.n.length+1&&s1.c.includes('Request>Is it approved?')&&s1.c.includes('Is it approved?>Approval[Yes]')&&!s1.c.includes('Request>Approval'),'gateway inserted and rewired');
ok(s1.ov===0,'no overlaps after insert');
await shot('1b_after');
await p.keyboard.press('Control+z');await p.waitForTimeout(200);let s1u=await st();ok(s1u.n.length===s0.n.length&&s1u.c.includes('Request>Approval'),'undo restores');
await p.keyboard.press('Control+y');await p.waitForTimeout(200);ok((await st()).c.includes('Request>Is it approved?'),'redo reapplies');
// 2 box zone (before / after) over Approval
await setup();[px,py]=await palPos('aistep');
let box=await p.evaluate(()=>{const s=DRAW.ST.doc.shapes.find(s=>s.n==='Approval');return[s.x,s.y,s.w,s.h]});
let [bx,by]=await scr(box[0]+box[2]*.15,box[1]+box[3]/2);
await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+30,py+10,{steps:3});await p.mouse.move(bx,by,{steps:12});await p.waitForTimeout(450);
let h2=await p.evaluate(()=>DRAW.ST.hov&&DRAW.ST.hov.kind+':'+DRAW.ST.hov.zone);ok(h2==='box:before','box zone before: '+h2);
ok(await p.locator('#drSvg .dr-zone').count()===3,'3 zones drawn');await shot('2_box');
await p.mouse.up();await p.waitForTimeout(350);let s2=await st();console.log(JSON.stringify(s2));
ok(s2.c.includes('Request>New ai agent step')&&s2.c.some(x=>x.endsWith('>Approval')),'placed before Approval');ok(s2.ov===0,'no overlaps (before)');
// branch
await setup();[px,py]=await palPos('task');box=await p.evaluate(()=>{const s=DRAW.ST.doc.shapes.find(s=>s.n==='Approval');return[s.x,s.y,s.w,s.h]});
[bx,by]=await scr(box[0]+box[2]*.5,box[1]+box[3]/2);
await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+30,py+10,{steps:3});await p.mouse.move(bx,by,{steps:12});await p.waitForTimeout(300);
h2=await p.evaluate(()=>DRAW.ST.hov&&DRAW.ST.hov.kind+':'+DRAW.ST.hov.zone);ok(h2==='box:branch','box zone branch: '+h2);
await p.mouse.up();await p.waitForTimeout(350);s2=await st();console.log(JSON.stringify(s2));ok(s2.ov===0,'no overlaps (branch)');
// after
await setup();[px,py]=await palPos('notification');box=await p.evaluate(()=>{const s=DRAW.ST.doc.shapes.find(s=>s.n==='Request');return[s.x,s.y,s.w,s.h]});
[bx,by]=await scr(box[0]+box[2]*.9,box[1]+box[3]/2);
await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+30,py+10,{steps:3});await p.mouse.move(bx,by,{steps:12});await p.waitForTimeout(300);
await p.mouse.up();await p.waitForTimeout(350);s2=await st();console.log(JSON.stringify(s2));ok(s2.c.some(x=>x.startsWith('Request>New notification'))&&s2.c.some(x=>x.endsWith('>Approval')),'placed after Request');ok(s2.ov===0,'no overlaps (after)');
// 3 hover + handle + mini picker
await setup();m=await midC('Request','Approval');[mx,my]=await scr(...m);
await p.mouse.move(mx-60,my-80);await p.mouse.move(mx+6,my,{steps:6});await p.waitForTimeout(250);
ok(await p.locator('#drWorld .dr-plus').count()===1,'hover handle visible');await shot('3_handle');
const hb=await p.locator('#drWorld .dr-plus').boundingBox();await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2,{steps:4});await p.waitForTimeout(450);ok(await p.locator('#drWorld .dr-plus').count()===1,'handle persists when moving onto it');
await p.mouse.down();await p.mouse.up();await p.waitForTimeout(250);
ok(await p.locator('.dr-mini .dr-mini-b').count()===6,'mini picker has 6 shapes');await shot('3b_mini');
await p.locator('.dr-mini-b[data-dr-mini="approval"]').click();await p.waitForTimeout(400);s2=await st();console.log(JSON.stringify(s2));
ok(s2.c.includes('Request>New approval gate')&&s2.c.includes('New approval gate>Approval')&&s2.ov===0,'picker inserted approval');
// 4 keyboard
await setup();m=await midC('Request','Approval',.17);[mx,my]=await scr(...m);
await p.mouse.click(mx,my);await p.waitForTimeout(200);await p.keyboard.press('Enter');await p.waitForTimeout(250);
ok(await p.locator('.dr-mini').count()===1,'Enter on selected connector opens picker');
await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');await p.waitForTimeout(400);s2=await st();console.log(JSON.stringify(s2));
ok(s2.c.includes('Request>New approval gate')&&s2.ov===0,'keyboard inserted approval (3rd item)');
await setup();m=await midC('Request','Approval',.17);[mx,my]=await scr(...m);await p.mouse.click(mx,my);await p.waitForTimeout(250);await p.keyboard.press('+');await p.waitForTimeout(250);ok(await p.locator('.dr-mini').count()===1,'+ opens picker');await p.keyboard.press('Escape');await p.waitForTimeout(150);ok(await p.locator('.dr-mini').count()===0,'Esc closes picker');
// 5 move existing onto connector
await setup();await p.evaluate(()=>{const d=DRAW.ST.doc;DRAW.addShape(d,'notification',300,330,{n:'Notify team'});DRAW.paint();DRAW.fit()});await p.waitForTimeout(500);
let nb=await p.evaluate(()=>{const s=DRAW.ST.doc.shapes.find(s=>s.n==='Notify team');return[s.x+s.w/2,s.y+s.h/2]});let[nx,ny]=await scr(...nb);m=await midC('Request','Approval');[mx,my]=await scr(...m);
await p.mouse.move(nx,ny);await p.mouse.down();await p.mouse.move(nx+5,ny-10,{steps:3});await p.mouse.move(mx,my,{steps:14});await p.waitForTimeout(400);await shot('5_move');
hv=await p.evaluate(()=>DRAW.ST.hov&&DRAW.ST.hov.kind);ok(hv==='conn','moving shape shows conn hover');await p.mouse.up();await p.waitForTimeout(400);s2=await st();console.log(JSON.stringify(s2));
ok(s2.c.includes('Request>Notify team')&&s2.c.includes('Notify team>Approval')&&s2.ov===0,'moved shape inserted');
await p.keyboard.press('Control+z');await p.waitForTimeout(250);s2=await st();ok(s2.c.includes('Request>Approval')&&!s2.c.some(x=>x.includes('Notify')),'undo of moved insert');
// 6 Yes/No label preserved
await setup('gw');await shot('6_gw_before');m=await midC('Approved?','Pay');[mx,my]=await scr(...m);[px,py]=await palPos('approval');
await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+30,py+10,{steps:3});await p.mouse.move(mx,my,{steps:12});await p.waitForTimeout(300);await p.mouse.up();await p.waitForTimeout(400);s2=await st();console.log(JSON.stringify(s2));
ok(s2.c.includes('Approved?>New approval gate[Yes]')&&s2.c.includes('Approved?>Reject[No]')&&s2.ov===0,'Yes label preserved, No untouched, no overlaps');await shot('6_gw_after');
// 7 overlap reproduction: decision dropped between Request and Approval packed close
await setup();await p.evaluate(()=>{const d=DRAW.ST.doc,P=d.shapes.find(s=>s.n==='Approval'),E=d.shapes.find(s=>s.t==='end');P.x=400;E.x=620;DRAW.paint()});await p.waitForTimeout(250);
[px,py]=await palPos('gateway');m=await midC('Request','Approval');[mx,my]=await scr(...m);
await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+30,py+10,{steps:3});await p.mouse.move(mx,my,{steps:12});await p.waitForTimeout(250);await p.mouse.up();await p.waitForTimeout(400);s2=await st();console.log(JSON.stringify(s2));ok(s2.ov===0,'tight gap: decision inserted without overlap');
// drop decision directly onto Request box center over a packed pair, twice
for(let i=0;i<3;i++){[px,py]=await palPos('gateway');box=await p.evaluate(()=>{const s=DRAW.ST.doc.shapes.find(s=>s.n==='Request');return[s.x,s.y,s.w,s.h]});[bx,by]=await scr(box[0]+box[2]*.5,box[1]+box[3]/2+6);await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+30,py+10,{steps:3});await p.mouse.move(bx,by,{steps:10});await p.mouse.up();await p.waitForTimeout(300)}
s2=await st();console.log(JSON.stringify(s2));ok(s2.ov===0,'repeated drops over Request: still no overlap');await shot('7_packed');
console.log('errors',p.errs);ok(p.errs.length===0,'zero console errors');console.log('FAILS',fails);await b.close()})();
