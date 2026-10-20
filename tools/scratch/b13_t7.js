const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1440,height:950}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(1200);
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){console.log('EVERR',e.message.slice(0,200))}};
await ev(()=>DRAW.open(null,{tpl:'tpl_incident'}));await p.waitForTimeout(700);
// insert on connector via palette drag
await ev(()=>{DRAW.ST.k=.7;DRAW.ST.px=30;DRAW.ST.py=40;DRAW.paint()});await p.waitForTimeout(200);
const it=p.locator('[data-dr-pi="notification"]:visible').first();await it.scrollIntoViewIfNeeded();await p.waitForTimeout(200);
const mid=await ev(()=>{const D=DRAW,d=D.ST.doc;const c=d.conns[2];const pts=D.route(d,c);const m=D.labelPt(pts);const r=document.querySelector('#drSvg').getBoundingClientRect();return {w:m,client:[r.left+D.ST.px+m[0]*D.ST.k,r.top+D.ST.py+m[1]*D.ST.k],n:d.shapes.length,cn:d.conns.length}});
const bb=await it.boundingBox();
await p.mouse.move(bb.x+20,bb.y+20);await p.mouse.down();await p.mouse.move(bb.x-30,bb.y,{steps:4});await p.mouse.move(mid.client[0],mid.client[1],{steps:10});await p.screenshot({path:'shots_b13/t7_insert_preview.png'});await p.mouse.up();await p.waitForTimeout(300);
console.log('insert',mid.n,mid.cn,'->',await ev(()=>DRAW.ST.doc.shapes.length+' '+DRAW.ST.doc.conns.length+' '+JSON.stringify(DRAW.validate(DRAW.ST.doc).items.filter(i=>i.id==='dangling'||i.id==='entry').map(i=>i.lv))));
// marquee select
await ev(()=>{DRAW.closeProps();DRAW.ST.sel.clear();DRAW.paint()});await p.waitForTimeout(250);
await ev(()=>{window.scrollTo(0,0);DRAW.cmd('fit')});await p.waitForTimeout(300);const r=await ev(()=>{const r=document.querySelector('#drSvg').getBoundingClientRect();return [r.left,r.top,r.width,r.height]});
await p.mouse.move(r[0]+8,r[1]+8);await p.mouse.down();await p.mouse.move(r[0]+r[2]*0.55,r[1]+r[3]*0.6,{steps:8});await p.mouse.up();await p.waitForTimeout(200);
console.log('marquee',await ev(()=>DRAW.ST.sel.size));
// palette search
await p.fill('[data-dr-q]','approv');await p.waitForTimeout(200);console.log('search items',await ev(()=>document.querySelectorAll('.dr-pal .dr-items .dr-pi').length));await p.fill('[data-dr-q]','');
// collapse
await p.click('[data-dr-cmd="pal"]');await p.waitForTimeout(300);console.log('collapsed',await ev(()=>document.querySelector('.dr-pal').classList.contains('col')+' sel '+DRAW.ST.sel.size));await p.screenshot({path:'shots_b13/t7_collapsed.png'});await p.click('[data-dr-cmd="pal"]');await p.waitForTimeout(200);
// export svg then render it
const svg=await ev(()=>DRAW.exportSVG());fs.writeFileSync('shots_b13/exp2.svg',svg);
const p2=await ctx.newPage();await p2.setViewportSize({width:1100,height:420});await p2.goto('file://'+process.cwd()+'/shots_b13/exp2.svg');await p2.waitForTimeout(300);await p2.screenshot({path:'shots_b13/t7_svg.png'});
// leave studio drawer restore
await ev(()=>{DRAW.ST.sel=new Set([DRAW.ST.doc.shapes[1].id]);DRAW.openProps()});await p.waitForTimeout(300);
await ev(()=>go('home'));await p.waitForTimeout(500);
console.log('after leave',await ev(()=>JSON.stringify({pop:document.getElementById('drawer').getAttribute('popover'),open:document.getElementById('drawer').matches(':popover-open'),body:document.body.className})));
await ev(()=>openDrawer('<p>hi</p>'));await p.waitForTimeout(300);console.log('normal drawer',await ev(()=>document.getElementById('drawer').matches(':popover-open')));
console.log('errors',errs);await b.close()})();
