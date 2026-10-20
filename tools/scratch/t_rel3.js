const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_rel');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1300,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const ids=['rel_new','rel_gng','rel_story','rel_plan','rel_pi','rel_est'];
await p.evaluate(()=>{S.v.rel_bv=1;go('agile_board')});await p.waitForTimeout(400);
// drag one kanban card
const r=await p.evaluate(()=>{const c=document.querySelector('[data-dnd-id].rel-sc');return c?c.dataset.dndId:null});console.log('card',r);
const cards=await p.$$('.rel-sc[data-dnd-id]');
if(cards.length){const bb=await cards[0].boundingBox();const lanes=await p.$$('.rel-lane');const lb=lanes.length>1?await lanes[1].boundingBox():null;console.log('lanes',lanes.length);
 const before=await p.evaluate(()=>[...document.querySelectorAll('.rel-lane')].map(l=>l.querySelectorAll('.rel-sc').length).join(','));
 if(lb){await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(lb.x+lb.width/2,lb.y+60,{steps:12});await p.mouse.up();await p.waitForTimeout(500);}
 const after=await p.evaluate(()=>[...document.querySelectorAll('.rel-lane')].map(l=>l.querySelectorAll('.rel-sc').length).join(','));console.log('lane counts',before,'->',after);}
// p360
const t=await p.evaluate(()=>typeof P360_TABS!=='undefined'?P360_TABS.map(x=>x.id||x.name||x.label||x.t).join('|'):'none');console.log('p360',t);
console.log('RELX',await p.evaluate(()=>window.RELX?[RELX.releases.length||RELX.releases().length,typeof RELX.gates]:'none'));
console.log(errs.slice(0,15).join('\n')||'no errors');await b.close()})();
