const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(1,3).join('|')));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(700);
const T=async(n,f,a)=>{try{const r=await p.evaluate(f,a);console.log(n,JSON.stringify(r))}catch(e){console.log(n,'ERR',e.message.slice(0,200))}};
const dlg=()=>p.evaluate(()=>(document.querySelector('[popover]:popover-open')||document.body).innerText.slice(0,260).replace(/\n+/g,' | '));
await p.evaluate(()=>go('fin_gates'));await p.waitForTimeout(200);
await T('dnd',()=>{DND.h.fin_gate('g-PR4','G0','G1',0)});await p.waitForTimeout(300);
console.log('form:',await dlg());
const ta=p.locator('[popover]:popover-open textarea').first();await ta.fill('Vendor selected; funding confirmed.');
const sub=p.locator('[popover]:popover-open button.primary, [popover]:popover-open button[type=submit]').last();console.log('submit',await sub.innerText());await sub.click();await p.waitForTimeout(400);
await T('after',()=>({pend:FIN.gateBoard.pending().map(q=>q.pid+q.to+q.approver),board:FIN.gateBoard.board().map(x=>x.id+x.gate)}));
// approve
await p.evaluate(()=>{S.v.fin_gates=2;render()});await p.waitForTimeout(200);
await p.locator('[data-fin2=qok]').first().click();await p.waitForTimeout(300);
await T('after approve',()=>FIN.gateBoard.board().map(x=>x.id+x.gate));
// Standards Update toggle
await p.evaluate(()=>{S.v.fin_gates=1;render()});await p.locator('[data-fin=asu][data-id="1"]').first().click();await p.waitForTimeout(300);
await T('asu',()=>({asu:FIN.asu(),cap:stats?0:0}));
// split form
await p.evaluate(()=>{S.v.fin_alloc=2;go('fin_alloc')});await p.waitForTimeout(200);
await p.locator('[data-fin2=splitnew]').first().click();await p.waitForTimeout(300);console.log('split form:',await dlg());
await p.keyboard.press('Escape');
// release at G3 via recolor path & exception fix: rebalance
await p.evaluate(()=>{S.v.fin_alloc=2;render()});
const rb=p.locator('[data-fin2=rebal]').first();if(await rb.count()){await rb.click();await p.waitForTimeout(300)}
await T('splits',()=>FIN.splits().map(s=>s.id+s.sumsToParent));
await T('rules',()=>FIN.validate().map(v=>v.id+':'+v.fail));
await T('stats',()=>FIN.stats());
console.log('ERRS',errs.slice(0,8));await b.close()})();
