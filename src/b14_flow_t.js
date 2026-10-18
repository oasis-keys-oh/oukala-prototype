const {chromium}=require('playwright');const path=require('path');
const scheme=process.argv[2]||'light';const dir=path.resolve('out_b14');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1680,height:950},colorScheme:scheme});const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>m.type()==='error'&&p.errs.push(m.text()));
await p.goto('file://'+dir+'/full.html',{waitUntil:'commit',timeout:90000});await p.waitForTimeout(9000);
const setup=async()=>{await p.evaluate(()=>{const f=FLOWX.get('wf_inv');if(!window.__orig)window.__orig=JSON.parse(JSON.stringify({n:f.nodes,e:f.edges}));const o=JSON.parse(JSON.stringify(window.__orig));const pick=id=>o.n.find(n=>n.id===id);
 const set=(id,x,l,r)=>{const n=pick(id);n.x=x;n.l=l;n.r=r;return n};
 f.nodes=[set('T1',162,1,0),set('A1',382,1,0),set('AP1',682,1,0),set('A4',1002,1,0),set('E1',1222,1,0)];
 f.nodes.forEach(n=>{n.g=null});f.groups=[];
 f.edges=[{id:'e1',f:'T1',p:'next',t:'A1'},{id:'e2',f:'A1',p:'next',t:'AP1'},{id:'e3',f:'AP1',p:'Approved',t:'A4'},{id:'e4',f:'A4',p:'next',t:'E1'}];f.undo=[];f.redo=[];
 FLOWX.open('wf_inv');});await p.waitForTimeout(900);
 await p.evaluate(()=>{const A=FLOWX._ed();A.E.zoom=.75;A.paintCanvas();A.E.inspOff=true;});await p.waitForTimeout(500)};
const st=()=>p.evaluate(()=>{const f=FLOWX.get('wf_inv'),nm=id=>(f.nodes.find(n=>n.id===id)||{}).n;return{n:f.nodes.map(n=>n.n+'@'+n.x+'/'+n.l+'/'+n.r),e:f.edges.map(e=>nm(e.f)+'['+e.p+']>'+nm(e.t)),ov:FLOWX._ins.overlaps(f).length,undo:f.undo.length}});
const toScr=(x,y)=>p.evaluate(([x,y])=>{const A=FLOWX._ed(),cv=document.querySelector('#wfdCanvas'),rc=cv.getBoundingClientRect(),z=A.E.zoom||1;return[rc.left-cv.scrollLeft+x*z,rc.top-cv.scrollTop+y*z]},[x,y]);
const edgeMid=(eid,fr)=>p.evaluate(([eid,fr])=>{const v=document.querySelector(`.wfd-edge[data-wfd-edge="${eid}"] .vis`),L=v.getTotalLength(),q=v.getPointAtLength(L*fr);return[q.x,q.y]},[eid,fr||.5]);
const nodeCtr=id=>p.evaluate(id=>{const A=FLOWX._ed(),n=A.f().nodes.find(n=>n.id===id);return[n.x+A.NW/2,A.nodeY(n)+A.NH/2,n.x,A.nodeY(n)]},id);
const palPos=async t=>{const l=p.locator(`[data-wfd-pal="${t}"]`).first();await l.scrollIntoViewIfNeeded();const bb=await l.boundingBox();return[bb.x+bb.width/2,bb.y+bb.height/2]};
const shot=n=>p.screenshot({path:`${dir}/shots/b14_flow_${n}_${scheme}.png`});
const dragPal=async(t,sx,sy,hold)=>{const[px,py]=await palPos(t);await p.mouse.move(px,py);await p.mouse.down();await p.mouse.move(px+25,py+10,{steps:3});await p.mouse.move(sx,sy,{steps:14});await p.waitForTimeout(450);if(hold)return;await p.mouse.up();await p.waitForTimeout(500)};
await setup();let s0=await st();console.log(JSON.stringify(s0));await shot('0_base');
// 1 palette -> edge
let m=await edgeMid('e2',.5);let[mx,my]=await toScr(...m);
await dragPal('decision',mx,my,true);
ok(await p.locator('.wfd-edge.ins-hot').count()===1,'edge glows');
ok((await p.locator('.wfd-inspill').first().textContent()).includes('Insert here'),'+ Insert here pill');
ok((await p.locator('#wfdCanvas [data-nudged]').count())===2,'two neighbours nudged: '+await p.locator('#wfdCanvas [data-nudged]').count());
await shot('1_edge');await p.mouse.up();await p.waitForTimeout(500);let s1=await st();console.log(JSON.stringify(s1));
ok(s1.n.length===6&&s1.e.includes('Three-way match[next]>Decision')&&s1.e.includes('Decision[Yes]>Controller approval')&&!s1.e.includes('Three-way match[next]>Controller approval'),'decision inserted and both ends rewired');
ok(s1.ov===0,'no overlaps after insert');await shot('1b_after');
await p.keyboard.press('Control+z');await p.waitForTimeout(400);let s1u=await st();ok(s1u.n.length===5&&s1u.e.includes('Three-way match[next]>Controller approval'),'undo restores');
await p.evaluate(()=>FLOWX._ed().f()&&0);await p.click('[data-wfd-redo]');await p.waitForTimeout(400);ok((await st()).n.length===6,'redo reapplies');
// 2 Approved label preserved
await setup();m=await edgeMid('e3',.5);[mx,my]=await toScr(...m);await dragPal('human',mx,my);let s2=await st();console.log(JSON.stringify(s2));
ok(s2.e.some(x=>x.startsWith('Controller approval[Approved]>New task'))&&s2.e.some(x=>x.startsWith('New task[next]>'))&&s2.ov===0,'Approved port label kept; no overlap');
// 3 box zones
await setup();let[cx,cy,bx,by]=await nodeCtr('AP1');[mx,my]=await toScr(bx+20,cy);await dragPal('agent',mx,my,true);
let zn=await p.evaluate(()=>{const z=document.querySelector('.wfd-zones');return z&&z.dataset.zone});ok(zn==='before','zone before: '+zn);ok(await p.locator('.wfd-zones i').count()===3,'3 zones');await shot('2_box');
await p.mouse.up();await p.waitForTimeout(500);s2=await st();console.log(JSON.stringify(s2));ok(s2.e.some(x=>x.endsWith('>Controller approval')&&x.startsWith('Three-way match'))===false&&s2.ov===0,'placed before approval, no overlap');
await setup();[cx,cy,bx,by]=await nodeCtr('AP1');[mx,my]=await toScr(bx+88,cy);await dragPal('auto',mx,my,true);zn=await p.evaluate(()=>document.querySelector('.wfd-zones').dataset.zone);ok(zn==='branch','zone branch: '+zn);await p.mouse.up();await p.waitForTimeout(500);s2=await st();console.log(JSON.stringify(s2));ok(s2.ov===0&&s2.e.some(x=>x.startsWith('Controller approval[Rejected]>Action')),'branch from free port, no overlap');
await setup();[cx,cy,bx,by]=await nodeCtr('A1');[mx,my]=await toScr(bx+160,cy);await dragPal('wait',mx,my,true);zn=await p.evaluate(()=>document.querySelector('.wfd-zones').dataset.zone);ok(zn==='after','zone after: '+zn);await p.mouse.up();await p.waitForTimeout(500);s2=await st();console.log(JSON.stringify(s2));ok(s2.e.includes('Three-way match[next]>Wait')&&s2.ov===0,'after: inserted on outgoing edge');
// 4 hover handle + mini
await setup();m=await edgeMid('e2',.5);[mx,my]=await toScr(...m);await p.mouse.move(mx-40,my-90);await p.mouse.move(mx,my,{steps:8});await p.waitForTimeout(400);
ok(await p.locator('#wfdCanvas .wfd-plus').count()===1,'hover handle visible');await shot('3_handle');
await p.mouse.down();await p.mouse.up();await p.waitForTimeout(300);ok(await p.locator('.wfd-mini-b').count()===6,'mini picker with 6 shapes');await shot('3b_mini');
await p.locator('.wfd-mini-b[data-wfd-mini="approval"]').click();await p.waitForTimeout(500);s2=await st();console.log(JSON.stringify(s2));ok(s2.e.some(x=>x.startsWith('Three-way match[next]>Approval'))&&s2.ov===0,'picker inserted approval');
// 5 keyboard
await setup();m=await edgeMid('e2',.2);[mx,my]=await toScr(...m);await p.mouse.click(mx,my);await p.waitForTimeout(400);await p.keyboard.press('Enter');await p.waitForTimeout(300);ok(await p.locator('.wfd-mini').count()===1,'Enter on selected connector opens picker');
await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');await p.waitForTimeout(500);s2=await st();console.log(JSON.stringify(s2));ok(s2.e.some(x=>x.startsWith('Three-way match[next]>Approval'))&&s2.ov===0,'keyboard inserted 3rd item (approval)');
await setup();m=await edgeMid('e2',.2);[mx,my]=await toScr(...m);await p.mouse.click(mx,my);await p.waitForTimeout(400);await p.keyboard.press('+');await p.waitForTimeout(300);ok(await p.locator('.wfd-mini').count()===1,'+ opens picker');await p.keyboard.press('Escape');await p.waitForTimeout(200);ok(await p.locator('.wfd-mini').count()===0,'Esc closes');
// 6 move existing node onto edge
await setup();await dragPal('human',700,500);// free drop in empty lane? uses coords
s2=await st();console.log(JSON.stringify(s2));
let nid=await p.evaluate(()=>{const f=FLOWX.get('wf_inv');return f.nodes[f.nodes.length-1].id});
[cx,cy]=await nodeCtr(nid);[mx,my]=await toScr(cx,cy);m=await edgeMid('e2',.5);let[ex,ey]=await toScr(...m);
await p.mouse.move(mx,my);await p.mouse.down();await p.mouse.move(mx+8,my-8,{steps:3});await p.mouse.move(ex,ey,{steps:14});await p.waitForTimeout(450);ok(await p.locator('.wfd-edge.ins-hot').count()===1,'moving node: edge glows');await shot('4_move');
await p.mouse.up();await p.waitForTimeout(500);s2=await st();console.log(JSON.stringify(s2));ok(s2.e.includes('Three-way match[next]>New task')&&s2.e.some(x=>x.startsWith('New task[next]>Controller approval'))&&s2.ov===0,'moved node inserted');
await p.keyboard.press('Control+z');await p.waitForTimeout(400);s2=await st();ok(s2.e.includes('Three-way match[next]>Controller approval'),'undo of move-insert');
// 7 repeated drops over A1 and AP1 - overlap
await setup();for(const id of ['A1','AP1','A1','A4']){[cx,cy,bx,by]=await nodeCtr(id);[mx,my]=await toScr(bx+88,cy+4);await dragPal('decision',mx,my)}
s2=await st();console.log(JSON.stringify(s2));ok(s2.ov===0,'repeated decision drops: no overlaps');await shot('5_packed');
// free drop onto occupied spot
await setup();[cx,cy,bx,by]=await nodeCtr('A1');[mx,my]=await toScr(bx+88,cy);await dragPal('human',mx,my);s2=await st();ok(s2.ov===0,'drop on occupied box: no overlaps');
console.log('errors',p.errs);ok(p.errs.length===0,'zero console errors');console.log('FAILS',fails);await b.close()})();
