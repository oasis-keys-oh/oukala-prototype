const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:180000});await p.waitForTimeout(4000);
const rows=await p.evaluate(async()=>{const o=[];for(const st of R17P.STORIES){for(const sp of R17P.stopsOf(st)){R17P.setPersona(sp.persona||st.persona);go(sp.screen);await new Promise(r=>setTimeout(r,250));if(sp.tab){R17P.applyTab(sp.tab);await new Promise(r=>setTimeout(r,200))}const t=R17P.resolveTarget(sp.sel);o.push(st.id+"/"+sp.id+" "+sp.sel+" h="+(t?Math.round(t.getBoundingClientRect().height):"NONE"))}}return o});
console.log(rows.join("\n"));await b.close()})();
