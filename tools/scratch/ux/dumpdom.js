// PR-31: save the rendered page for a few executive screens so the impeccable detector can scan real markup.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'../../..');const out=path.join(__dirname,'dom');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+ROOT+'/build_out/full.html',{waitUntil:'domcontentloaded',timeout:180000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function',null,{timeout:180000});await p.waitForTimeout(1500);
for(const [k,id] of [['exec','home'],['cfo','inv'],['ceo','exe_board'],['coo','strat_exec'],['ciso','grc_home'],['exec','tower']]){
 await p.evaluate(([k,id])=>{NAVX.persona.set(k);go(id)},[k,id]);await p.waitForTimeout(500);
 const html=await p.evaluate(()=>{const css=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');return '<!doctype html><html><head><style>'+css+'</style></head><body>'+document.querySelector('.app').outerHTML+'</body></html>'});
 fs.writeFileSync(path.join(out,k+'_'+id+'.html'),html)}
await b.close()})();
