const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(150000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve('out_g14/full.html'));await p.waitForTimeout(7000);
const r=await p.evaluate(async()=>{const o={};const J=x=>JSON.stringify(x).slice(0,400);
 const inb0=INBOX.items().length;o.inbox=inb0+' items; adapters zl: '+!!INBOX.adapters.zl_work;
 o.mcp=J(MCPX.call('get_record',{id:'INC0412'}));o.mcp2=J(MCPX.call('get_connections',{id:'PR1'}));o.mcp3=J(MCPX.call('trace_metric',{metric_id:'m_delivery'}));o.mcp4=J(MCPX.call('list_approvals',{limit:2}));
 // real invoice decision with fan-out
 const b0=JSON.stringify([S.bud.po[0].paid,PROJ[1].paid]);
 S.inv='INV-20433';go('inv','INV-20433');await new Promise(r=>setTimeout(r,500));
 const btn=document.querySelector('[data-decide="Approved"]');o.btn=!!btn;if(btn)btn.click();await new Promise(r=>setTimeout(r,400));
 o.after=JSON.stringify([S.bud.po[0].paid,PROJ[1].paid]);o.before=b0;o.ledger=J(Object.keys(ZLINK.state.ledger));o.notes=ZLINK.state.notes.length;o.audit=AUDIT.slice(0,3).map(a=>a.a);
 const und=document.querySelector('[data-decide="__undo"]');o.undoBtn=!!und;if(und)und.click();await new Promise(r=>setTimeout(r,400));o.undone=JSON.stringify([S.bud.po[0].paid,PROJ[1].paid]);o.ledgerAfterUndo=Object.keys(ZLINK.state.ledger).length;
 // drawer connected records
 go('ppm_proj');await new Promise(r=>setTimeout(r,500));recDrawer('PR1');await new Promise(r=>setTimeout(r,900));o.drawerPanel=!!document.querySelector('#drawer [data-zl-conn]');o.drawerGroups=document.querySelectorAll('#drawer [data-zl-conn] details').length;
 closeDrawer();
 o.ask=await new Promise(res=>{let said='';const sv=window.say;window.say=(q,x)=>{said=(x&&x.t||'').replace(/<[^>]+>/g,'')};const sg=window.go;window.go=()=>{};for(const fn of ASKX){try{if(fn('what is connected to PR1'))break}catch(e){}}window.say=sv;window.go=sg;res(said.slice(0,200))});
 o.gate=J(ZLINK.audit().checks.filter(c=>['a_work','i_invoice','i_flows','c_questions','n_events','k_mcp'].includes(c.id)).map(c=>c.id+'='+c.bad));
 return o});
console.log(r);console.log('errors',errs);await b.close()})();
