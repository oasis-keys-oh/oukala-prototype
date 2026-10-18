const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(120000);
await p.route(/^https?:/,r=>r.abort());await p.addInitScript(()=>{window.__ZLINK_NOFIX=1});
await p.goto('file://'+path.resolve('scr/base.html'));await p.waitForTimeout(3000);
await p.addScriptTag({content:fs.readFileSync('mod_zlink.js','utf8')});
console.log(await p.evaluate(()=>{const U=ZLINK.universe();const it=KCSX.items();return JSON.stringify({n:it.length,has421:U.has('KB0421'),has31:U.has('KB0031'),ids:it.slice(0,5).map(x=>x.id),rem:ZLINK.deadLinks().out.filter(d=>d.rel==='metric_rem').slice(0,3),inckb:ZLINK.deadLinks().out.filter(d=>d.rel==='inc_kb').map(d=>d.ref)})}));await b.close()})();
