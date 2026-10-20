const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'out_rel');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1300,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
for(const s of ['itsm_rel','agile_board','agile_art']){await p.evaluate(i=>go(i),s);await p.waitForTimeout(300);
 const n=await p.evaluate(()=>{const v=document.querySelectorAll('input[type=radio][name^="v-rel"]').length;return v});
 // click each tab
 const tabs=s==='agile_board'?8:5;
 for(let i=0;i<tabs;i++){await p.evaluate(([s,i])=>{const nm=s==='itsm_rel'?'rel_v':s==='agile_board'?'rel_bv':'rel_av';S.v[nm]=i;render()},[s,i]);await p.waitForTimeout(150)}
 console.log(s,'tabs',tabs)}
console.log(errs.slice(0,15).join('\n')||'no errors');await b.close()})();
