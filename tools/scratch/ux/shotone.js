// PR-31: screenshot one screen for one persona and tenant, optionally after opening the first row. node shotone.js persona screen [tenant] [row]
const L=require('./lib');const path=require('path');(async()=>{const [k,id,ten,row]=process.argv.slice(2);const {b,p}=await L.open();
await L.setup(p,k,ten&&ten!=='core'?ten:undefined);await L.goto(p,id);const dir=path.join(__dirname,'shots',k);
await L.shot(p,dir,(ten||'core')+'_'+id+'_view');console.log((await L.txt(p)).slice(0,1800).replace(/\n+/g,' | '));
if(row){const ok=await p.evaluate(()=>{const r=[...document.querySelectorAll('#view tbody tr')].find(x=>x.getBoundingClientRect().height>0);if(!r)return false;r.setAttribute('data-ux-row','1');return true});
 if(ok){await p.click('[data-ux-row="1"]');await p.waitForTimeout(900);await L.shot(p,dir,(ten||'core')+'_'+id+'_row');console.log('DRAWER',(await L.txt(p,'#drawer')).slice(0,1200).replace(/\n+/g,' | '))}}
await b.close()})();
