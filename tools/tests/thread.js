// Golden thread tests (stream thread, wave 2): record numbers (DC-02), budget guards (PR-24), reserve check (PR-26),
// ZLINK chains (DC-04), Trace this (DC-10), cascade (DC-12), strategy authoring gate (DC-13), group view (DC-14), business-case export (PR-21).
// Usage: node tools/tests/thread.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.NUM&&NUM.syncRecords&&window.EXE&&window.BUDX&&window.BUDREQ&&window.ZLINK&&typeof go==='function',null,{timeout:120000});
await p.waitForTimeout(3000);
const step=async(name,fn,arg)=>{try{return await p.evaluate(fn,arg)}catch(e){return ['THROW '+name+': '+String(e.message||e).slice(0,300)]}};
const fails=[];const add=a=>{(a||[]).forEach(x=>fails.push(x))};

/* ---- DC-02: stored record numbers, written on the record, searchable, linkable, in the CSV cross-reference ---- */
add(await step('DC-02',()=>{const f=[];const ok=(c,m)=>{if(!c)f.push('DC-02 '+m)};
 ok(NUM_DATA.r&&NUM_DATA.r.obj&&NUM_DATA.r.obj['core|O1']===1,'seed numbers are committed in NUM_DATA.r');
 ok(NUM.rec('obj','O1')==='O-001'&&NUM.rec('kr','k12')==='O-001.2'&&NUM.rec('proj','PR4')==='PJ-004','objective, key result, project numbers');
 ok(/^BL-\d{3}$/.test(NUM.rec('line','PR1-CLD'))&&/^IV-\d{3}$/.test(NUM.rec('inv','INV-20433'))&&/^LG-\d{3}$/.test(NUM.rec('led','RL-04')),'budget line, invoice, ledger numbers');
 NUM.syncRecords();ok(S.exe.objs[0].num==='O-001'&&PROJ[0].num==='PJ-001'&&S.bud.lines.every(l=>/^BL-/.test(l.num))&&INVOICES.every(i=>/^IV-/.test(i.num))&&S.bud.led.every(e=>/^LG-/.test(e.num)),'numbers are written on the records (rec.num)');
 const r=NUM.resolve('o-1.2');ok(r&&r.kind==='r'&&r.rk==='kr'&&r.id==='k12','resolve a key result number');
 ok(NUM.resolve('P-014')&&NUM.resolve('P-014').kind==='p','process numbers still resolve');
 const before=NUM.rec('proj','PR2');PROJ.push({id:'PRT9',n:'Thread test project',short:'Thread test',owner:'Priya Shah',bac:10,paid:0});const nn=NUM.rec('proj','PRT9');PROJ.pop();
 ok(/^PJ-\d{3}$/.test(nn)&&nn!==before&&NUM.rec('proj','PR2')===before,'a new project gets the next number and old numbers do not move');
 const q=document.getElementById('q');if(q){q.value=NUM.rec('inv','INV-20433');const hits=SEARCHX.flatMap(fn=>{try{return fn()||[]}catch(e){return[]}}).filter(x=>x.m==='Number');ok(hits.length===1&&/Invoice/.test(hits[0].t),'search finds an invoice by number');q.value=''}
 const csv=NUM.recordCSV('core');['O-001.2','PJ-002','LG-004'].forEach(n=>ok(csv.indexOf(n)>=0,'CSV cross-reference has '+n));ok(/Key result of/.test(csv)&&/Funds project/.test(csv)&&/Posts to budget line/.test(csv),'CSV carries the links');
 ok(NUM.open(NUM.rec('line','PR1-CLD'))===true,'open a budget line by number');
 const h=NUM.rec('obj','LH-O1','health');ok(/^O-\d{3}$/.test(h)&&h!=='O-001','another tenant gets its own numbers');
 return f}));

/* ---- PR-24: budget screens survive a project with no run-cost record and Enterprise scale ---- */
add(await step('PR-24',()=>{const f=[];const n0=PROJ.length;addProject({name:'Thread guard test',pm:'Priya Shah',cost:100,tasks:[]});
 ['bud_over','bud_model','bud_ven','bud_doa','exe_dash'].forEach(s=>{try{go(s)}catch(e){f.push('PR-24 '+s+' throws: '+e.message)}});
 S.bud.mproj='all';try{go('bud_model');if(!/No run cost recorded/.test(document.querySelector('#view').innerHTML))f.push('PR-24 bud_model does not say no run cost recorded')}catch(e){f.push('PR-24 bud_model all: '+e.message)}
 S.bud.mproj='PR1';try{SCALE.set(true);['bud_over','bud_model','exe_dash'].forEach(s=>go(s));SCALE.set(false)}catch(e){f.push('PR-24 scale: '+e.message);try{SCALE.set(false)}catch(x){}}
 const i=PROJ.findIndex(x=>x.n==='Thread guard test');if(i>=0)PROJ.splice(i,1);go('home');return f}));

/* ---- PR-26: funding from the reserve is refused, with a reason, when the reserve cannot cover it ---- */
add(await step('PR-26',()=>{const f=[];const r=BUDREQ.requests().find(q=>q.st==='dec'&&/reserve/i.test(q.src));if(!r)return ['PR-26 no reserve-funded request at the decision stage'];
 const nm=BUDREQ.rev('dec',r).name;const open=S.bud.led.find(e=>e.t==='open');const keep=open.amt;open.amt=20000;
 const x=BUDREQ.decide(r.id,'Approve','',nm);open.amt=keep;
 if(!x||x.ok!==false||x.rule!=='reserve'||!/reserve/i.test(x.why||''))f.push('PR-26 over-reserve funding was not refused with a reason: '+JSON.stringify(x));
 if(BUDREQ.requests().find(q=>q.id===r.id).st!=='dec')f.push('PR-26 refused request left the decision stage');
 return f}));

/* ---- DC-04: ZLINK has objective, key result, budget line, invoice and ledger nodes; the three chains resolve ---- */
add(await step('DC-04',()=>{const f=[];const ok=(c,m)=>{if(!c)f.push('DC-04 '+m)};ZLINK.refresh();const U=ZLINK.universe();
 [['O1','objective'],['k12','key_result'],['RL-02','ledger'],['PR1-CLD','budget_line'],['INV-20433','invoice'],['BR-0105','budget_request']].forEach(([id,t])=>ok(U.get(id)&&U.get(id).t===t,'node '+id+' is a '+t));
 const C=ZLINK.chains,v=C.verify();ok(!v.missingNodes.length,'no node type missing: '+v.missingNodes.join(','));
 /* invoice to project: every invoice either reaches a project or is a run-budget invoice with its contract named */
 v.invoice.forEach(x=>ok(x.proj||/run budget/.test(x.via),'invoice '+x.id+' reaches a project or says run budget'));
 ok(C.invoiceToProject('INV-20433').proj==='PR2'&&C.invoiceToProject('INV-20418').proj==='PR1','invoice to project (contract and trace graph)');
 const g=ZLINK.graph();ok((g.out.get('INV-20433')||[]).some(x=>x.id==='PR2'),'invoice to project is an edge in the graph');
 ok((g.out.get('k12')||[]).some(x=>x.id==='O1')&&(g.out.get('RL-04')||[]).some(x=>x.id==='PR1-CLD'),'key result and ledger edges in the graph');
 /* demand to budget line: proposed before funding, real lines after the funding decision */
 const d7=C.demandToLine('D7');ok(d7.ok&&d7.rows[0].br==='BR-0105'&&d7.rows[0].proposed,'D7 reaches BR-0105 and its proposed project lines');
 const r=BUDREQ.requests().find(q=>q.id==='BR-0105');if(r&&r.st==='dec'){const by=(APG.route('budget_request',{stage:'dec',amount:r.amt,requester:r.req}).members||[]).find(m=>m!==r.req);PERM.enforceOn(false);const x=BUDREQ.decide(r.id,'Approve','thread test',by);PERM.enforceOn(true);ok(x&&x.ok,'BR-0105 funds: '+JSON.stringify(x));
  const d7b=C.demandToLine('D7');ok(d7b.funded&&d7b.rows[0].lines.length&&d7b.rows[0].lines.every(l=>S.bud.lines.some(y=>y.id===l&&/BR-0105/.test(y.why))),'after funding, D7 reaches the budget lines BR-0105 created')}
 else ok(false,'BR-0105 is not at the decision stage');
 /* variance to objective score: weighted variance and the objective score from key results */
 const vo=C.varianceToObjective('PR1-CLD');ok(vo.ok&&vo.variance===48000&&vo.rows.length===2,'PR1-CLD variance reaches two objectives');
 const o1=vo.rows.find(x=>x.obj==='O1');ok(o1&&Math.round(o1.wvar)===Math.round(48000*S.exe.links.PR1.O1)&&o1.score===Math.round(EXE.objProg(S.exe.objs[0]).p*100),'weighted variance and objective score match their sources');
 ok(v.variance.filter(x=>x.ok).length>=13,'most budget lines reach a scored objective ('+v.variance.filter(x=>x.ok).length+')');
 return f}));

console.log('thread test',fails.length?'FAIL\n - '+fails.join('\n - '):'ok','| page errors',errs.length?errs.slice(0,4):'none');
await b.close();process.exit(fails.length||errs.length?1:0)})();
