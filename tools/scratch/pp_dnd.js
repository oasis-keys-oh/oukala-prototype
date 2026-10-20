const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{S.pp2.tab.ppl_org=5;go('ppl_org')});await p.waitForTimeout(300);
const before=await p.evaluate(()=>S.pp2.org.wq.map(x=>x.id+':'+x.team).join(','));
const src=p.locator('.pp2-kl .pp2-wi').first();const id=await src.getAttribute('data-dnd-id');
const tgt=p.locator('.pp2-kl[data-dnd="Platform team"]');await tgt.scrollIntoViewIfNeeded();
await src.scrollIntoViewIfNeeded();const sb=await src.boundingBox();let tb=await tgt.boundingBox();
await p.mouse.move(sb.x+30,sb.y+20);await p.mouse.down();await p.mouse.move(sb.x+60,sb.y+40,{steps:5});
tb=await tgt.boundingBox();await p.mouse.move(tb.x+tb.width/2,tb.y+tb.height/2,{steps:15});await p.mouse.up();await p.waitForTimeout(400);
console.log(id,await p.evaluate(i=>S.pp2.org.wq.find(x=>x.id===i).team,id),'audit',await p.evaluate(()=>S.pp2.org.audit.length));
// keyboard/assign button
await p.screenshot({path:'out_fix_people/shots/dnd.png'});await b.close()})();
