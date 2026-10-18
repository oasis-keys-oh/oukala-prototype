const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_f3_15/full.html'),{timeout:120000});await p.waitForTimeout(1000);
await p.evaluate(()=>{S.r15i.actAs="Tom Becker";go("inbox")});await p.waitForTimeout(800);
const ids=await p.evaluate(()=>INBOX.items().filter(x=>x.can.approve&&!x.needNote).map(x=>x.id).slice(0,8));
let ap=null;for(const id of ids){await p.evaluate(i=>INBOX.openFocus(i),id);await p.waitForTimeout(250);ap=await p.$('button[data-inbx-act="approve"]:not([disabled])');if(ap){console.log('using',id);break}}
console.log('found',!!ap);
if(ap){await ap.scrollIntoViewIfNeeded();await ap.click();await p.waitForTimeout(500);console.log('log',await p.evaluate(()=>JSON.stringify(GUARD.log().map(l=>l.who+"|"+l.why))))}
await b.close()})();
