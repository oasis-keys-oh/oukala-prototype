const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_f3_15/full.html'),{timeout:120000});await p.waitForTimeout(1000);
await p.evaluate(()=>{S.r15i.actAs="Tom Becker";go("inbox")});await p.waitForTimeout(800);
const n=await p.evaluate(()=>{const it=INBOX.items().find(x=>x.can.approve);INBOX.openFocus(it.id);return document.querySelectorAll('[data-inbx-act]').length});await p.waitForTimeout(500);
console.log('act btns',n);
const ap=await p.$('[data-inbx-act="approve"]');
if(ap){await ap.click({force:true});await p.waitForTimeout(500);console.log('log',await p.evaluate(()=>JSON.stringify(GUARD.log().map(l=>l.who+"|"+l.why))),'pending',await p.evaluate(()=>INBOX.pending().length));await p.screenshot({path:'out_f3_15/shots/deny_inbox_d.png'})}
await p.evaluate(()=>{S.r15i.actAs="Casey Rowan"});
if(ap){await p.evaluate(()=>{const it=INBOX.items().find(x=>x.can.approve);INBOX.openFocus(it.id)});await p.waitForTimeout(400);const a2=await p.$('[data-inbx-act="approve"]');await a2.click({force:true});await p.waitForTimeout(400);console.log('allowed pending',await p.evaluate(()=>INBOX.pending().length))}
console.log('ERRS',JSON.stringify(errs));await b.close()})();
