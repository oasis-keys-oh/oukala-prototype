const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(700);
const T=async(n,f)=>{try{const r=await p.evaluate(f);console.log(n,JSON.stringify(r))}catch(e){console.log(n,'ERR',e.message.slice(0,200))}};
const click=async(sel)=>{try{await p.locator(sel).first().click({timeout:2000});await p.waitForTimeout(250);return 'ok'}catch(e){return 'MISS '+sel}};
const toastTxt=()=>p.evaluate(()=>{const t=document.querySelector('.toast,#toast');return t?t.innerText:''});
await p.evaluate(()=>go('fin_gates'));await p.waitForTimeout(200);
console.log('card',await click('[data-fin2=proj][data-id=PR4]'));
console.log('advBtn',await click('[data-fin2=advance][data-id=PR4]'));
await T('formOpen',()=>!!document.querySelector('#fin_gm_f,[data-form=fin_gm_f],form'));
await T('formtext',()=>(document.querySelector('dialog[open],[popover]:popover-open')||document.body).innerText.slice(0,400));
await p.keyboard.press('Escape');
// DND scope call
await T('dnd',()=>{DND.h.fin_gate('g-PR1','G2','G3',0);return F_=FIN.gateBoard.pending()});
await T('formAfterDnd',()=>(document.querySelector('dialog[open],[popover]:popover-open')||document.body).innerText.slice(0,300));
await p.screenshot({path:dir+'/shots/int1.png'});
console.log('ERRS',errs.slice(0,8));await b.close()})();
