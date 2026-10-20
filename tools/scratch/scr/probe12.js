const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(300000);
await p.route(/^https?:/,r=>r.abort());await p.addInitScript(()=>{window.__ZLINK_NOFIX=1});
await p.goto('file://'+path.resolve('scr/base.html'));await p.waitForTimeout(3000);
await p.addScriptTag({content:fs.readFileSync('mod_zlink.js','utf8')});
for(const f of ['fixRefs','fixWfService','fixAliases','fixMetricUse','fixStepIO','fixFlows','fixLineage','fixInbox','fixMcp','fixSearch','fixAsk','hookAudit','watchDrawer']){
 const r=await p.evaluate(n=>{const t=performance.now();let e='';try{ZLINK._fx[n]()}catch(x){e=x.message}return Math.round(performance.now()-t)+' '+e},f);console.log(f,r)}
await b.close()})();
