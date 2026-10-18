const {chromium}=require('playwright');
(async()=>{const dir=require('path').resolve(process.argv[2]);const light=process.argv.includes('--light');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:light?'light':'dark'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2200);
await p.click('#inbxBell');await p.waitForTimeout(400);await p.click('[data-r16n-tab]');await p.waitForTimeout(300);
const log=[];const cnt=()=>p.evaluate(()=>({unread:NOTIF.unread(),rows:document.querySelectorAll('#inbxPanel .r16n-row').length,live:NOTIF.items().filter(n=>!n.cleared&&!(n.defer>Date.now())).length,def:NOTIF.items().filter(n=>n.defer>Date.now()).length,tot:NOTIF.items().length}));
log.push(['initial',await cnt()]);
await p.screenshot({path:dir+'/shots/ntf1'+(light?'_l':'_d')+'.png'});
// filter high
await p.selectOption('[data-r16n-f=prio]','high');await p.waitForTimeout(100);log.push(['high',await cnt()]);
await p.selectOption('[data-r16n-f=prio]','all');
await p.selectOption('[data-r16n-f=grp]','type');await p.waitForTimeout(100);log.push(['grouped heads',await p.evaluate(()=>document.querySelectorAll('#inbxPanel .r16n-gh').length)]);
await p.selectOption('[data-r16n-f=grp]','none');
// escalate first row
await p.click('.r16n-row [data-r16n-esc]');await p.waitForTimeout(100);
await p.screenshot({path:dir+'/shots/ntf2'+(light?'_l':'_d')+'.png'});
await p.fill('[data-r16n-reason]','Customer impact is growing');await p.click('.r16n-pop button[type=submit]');await p.waitForTimeout(200);
log.push(['escalated evt',await p.evaluate(()=>EVENTS.log.filter(e=>e.id==='notification.escalated').length+' / '+(NOTIF.items().filter(n=>n.esc).map(n=>n.esc.to).join(',')))]);
// defer one via API short timer and check resurface
await p.evaluate(()=>{NOTIF.defer('N1004',1500)});await p.waitForTimeout(300);log.push(['after defer',await cnt()]);
await p.waitForTimeout(1800);await p.evaluate(()=>NOTIF.tick());log.push(['after resurface',await cnt(),await p.evaluate(()=>NOTIF.items().find(n=>n.id==='N1004').defer)]);
// UI defer 1 hour on a row
await p.click('.r16n-row [data-r16n-def]');await p.click('[data-r16n-defgo="1h"]');await p.waitForTimeout(150);log.push(['ui defer',await cnt()]);
// bulk select 3 + clear
for(let i=0;i<3;i++){const bx=await p.$$('#inbxPanel [data-r16n-sel]');await bx[i].click({force:true});await p.waitForTimeout(60)}await p.waitForTimeout(100);
await p.screenshot({path:dir+'/shots/ntf3'+(light?'_l':'_d')+'.png'});
await p.click('[data-r16n-bulk=clr]');await p.waitForTimeout(150);log.push(['bulk clear 3',await cnt()]);
await p.click('[data-r16n-clearall]');await p.waitForTimeout(150);log.push(['clear all',await cnt()]);
await p.screenshot({path:dir+'/shots/ntf4'+(light?'_l':'_d')+'.png'});
await p.click('[data-r16n-undo]');await p.waitForTimeout(150);log.push(['undo',await cnt()]);
// tab switching back
await p.click('[data-inbx-tab=all]');await p.waitForTimeout(200);log.push(['switch back has center',await p.evaluate(()=>!!document.querySelector('[data-r16n-root]'))]);
await p.click('[data-r16n-tab]');await p.waitForTimeout(200);log.push(['again',await cnt()]);
console.log(JSON.stringify(log));console.log('errors',errs);await b.close()})();
