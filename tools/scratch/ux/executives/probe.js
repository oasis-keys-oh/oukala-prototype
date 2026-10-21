// UX probe (PR-31): lists personas, tenants, missions, lenses and rail entries from the built full.html.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(__dirname,'../../../build_out');
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.message).slice(0,200)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function'&&window.EXP,null,{timeout:120000});await p.waitForTimeout(1500);
const r=await p.evaluate(()=>({personas:Object.keys(PERSONAS),cur:S.persona,screen:S.screen,tenants:DATA.tenants().map(t=>t.id+':'+t.org),missions:EXP.list().map(m=>m.id+':'+JSON.stringify(m.role)),
 showkeys:Object.keys(window.SHOW||{}),navx:Object.keys(NAVX),persona:Object.keys(NAVX.persona||{}),
 rail:[...document.querySelectorAll('#nav [data-nav], #nav button')].slice(0,40).map(e=>(e.getAttribute('data-nav')||'')+'|'+(e.getAttribute('aria-label')||'')+'|'+e.textContent.trim().slice(0,40)),
 w:Object.keys(window).filter(k=>/^[A-Z][A-Z0-9_]{1,12}$/.test(k)).join(' ')}));
console.log(JSON.stringify(r,null,1));console.log(errs);await b.close()})();
