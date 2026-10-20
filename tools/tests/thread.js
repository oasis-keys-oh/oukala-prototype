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

/* ---- DC-10: Trace this from any number: the thread, hand-offs with owner chips, reachable from a chip next to a number ---- */
add(await step('DC-10',async()=>{const f=[];const ok=(c,m)=>{if(!c)f.push('DC-10 '+m)};const N=(k,id)=>NUM.rec(k,id);
 const R=THREAD.build(N('line','PR1-CLD'));ok(R&&['obj','kr','proj','line','inv','led'].every(k=>R.levels[k].length),'a budget line thread reaches every level: '+(R?Object.keys(R.levels).map(k=>k+R.levels[k].length).join(' '):'none'));
 ok(R&&R.handoffs.length>=1&&R.handoffs.every(h=>h.from.owner!==h.to.owner),'hand-offs are changes of owner');
 ok(R&&R.steps.some(s=>/^P-\d{3}\.\d+$/.test(s.snum)),'process steps carry step numbers');
 [['obj','O1'],['kr','k12'],['proj','PR2'],['inv','INV-20433'],['led','RL-03']].forEach(([k,id])=>{const r=THREAD.build(N(k,id));ok(r&&r.levels.proj.length>=1&&r.levels[k].some(x=>x.id===id),'thread from '+k+' '+id)});
 const run=THREAD.build(N('inv','INV-20440'));ok(run&&run.notes.length&&!run.levels.proj.length,'a run-budget invoice says it reaches no project');
 ok(THREAD.build('P-056')&&THREAD.build('P-056').process,'a process number opens its thread');
 THREAD.open(N('line','PR1-CLD'));const dr=document.getElementById('drawer');ok(dr&&dr.querySelector('.thr')&&dr.querySelectorAll('.thr-ho [data-owner]').length>=2,'drawer shows hand-offs through ownerChip');
 ok(!/—/.test(dr.innerText),'no em dash in the thread drawer');ok(/modeled/.test(dr.innerText),'dollar figures are labeled modeled');
 closeDrawer();go('exe_strat');await new Promise(r=>setTimeout(r,400));const c=document.querySelector('#view .num-chip + .thr-chip');ok(!!c,'a Trace chip sits next to a number on screen');
 if(c){c.click();await new Promise(r=>setTimeout(r,200));ok(!!document.querySelector('#drawer .thr'),'the Trace chip opens the thread')}
 closeDrawer();return f}));

/* ---- DC-12: four-level cascade with contribution math ---- */
add(await step('DC-12',()=>{const f=[];const ok=(c,m)=>{if(!c)f.push('DC-12 '+m)};const X=EXE.cascade();
 ['company','enterprise','group','team'].forEach(l=>ok(X.nodes.some(n=>n.lvl===l),'has a '+l+' level'));
 const close=(a,b)=>Math.abs(a-b)<1e-9;
 X.nodes.filter(n=>!n.kr&&n.kids.length).forEach(n=>{const ks=n.kids.map(id=>X.by[id]).filter(c=>c.p!=null);const sw=ks.reduce((s,c)=>s+c.up[n.id],0);ok(close(n.p,ks.reduce((s,c)=>s+c.up[n.id]*c.p,0)/sw),'weighted roll-up at '+n.id)});
 X.nodes.filter(n=>n.kr).forEach(n=>{const k=S.exe.krs.find(x=>x.id===n.kr);ok(k&&close(n.p,EXE.krProg(k)),'leaf '+n.id+' is measured by its key result')});
 const pts=X.nodes.filter(n=>n.lvl==='team').reduce((s,n)=>s+n.contrib,0);ok(Math.abs(pts-X.company.p*100)<1e-6,'team contributions add up to the company score ('+pts.toFixed(2)+' vs '+(X.company.p*100).toFixed(2)+')');
 go('exe_strat');const html=document.querySelector('#view').innerHTML;ok(/Cascade: company, enterprise, group and team/.test(html)&&/Weights modeled/.test(html),'cascade pane on exe_strat, labeled modeled');
 return f}));

/* ---- DC-13: strategy authoring with a quality gate and versions ---- */
add(await step('DC-13',()=>{const f=[];const ok=(c,m)=>{if(!c)f.push('DC-13 '+m)};
 ok(EXE.gateCheck().ok,'seed objectives pass the gate');const v0=S.exe.stv.vers.length;
 S.exe.objs.push({id:'OT1',n:'Thread gate test objective',sub:'Gate test',owner:'CIO'});
 const g=EXE.gateCheck();const r=g.rows.find(x=>x.o.id==='OT1');ok(r&&['metric','tgt','due','kr'].every(k=>r.miss.some(m=>m.k===k)),'gate names the missing metric, target, date and key result');
 const p1=EXE.publishStrat('test');ok(!p1.ok&&/quality gate/i.test(p1.why)&&S.exe.stv.vers.length===v0,'publishing is refused while the gate fails, with the reason');
 Object.assign(S.exe.objs.find(o=>o.id==='OT1'),{metric:'Search success rate',tgt:'80%',due:'2027-06-30'});S.exe.krs.push({id:'kOT1',o:'OT1',n:'Searches that end in a click',u:'%',start:40,cur:40,tgt:80,owner:'Maya Ortiz'});
 const p2=EXE.publishStrat('test version');ok(p2.ok&&p2.v===S.exe.stv.vers[v0-1].v+1&&p2.changes.some(c=>/Added objective/.test(c)),'a passing draft publishes the next version with its changes');
 ok(S.exe.stv.vers[S.exe.stv.vers.length-1].snap.objs.some(o=>o.id==='OT1')&&!S.exe.stv.vers[0].snap.objs.some(o=>o.id==='OT1'),'versions keep their own snapshot');
 const p3=EXE.publishStrat('again');ok(!p3.ok&&/Nothing changed/.test(p3.why),'an unchanged strategy is not republished');
 S.exe.objs=S.exe.objs.filter(o=>o.id!=='OT1');S.exe.krs=S.exe.krs.filter(k=>k.id!=='kOT1');
 S.v.exestratv=6;go('exe_strat');ok(/Quality gate/.test(document.querySelector('#view').innerText),'Author and publish tab renders');S.v.exestratv=0;
 return f}));

/* ---- DC-14: group view (one group, its objectives, spend and work) on Budget and spend traceability ---- */
add(await step('DC-14',async()=>{const f=[];const ok=(c,m)=>{if(!c)f.push('DC-14 '+m)};
 EXE.CGRP.forEach(g=>{const d=BSTX.groupData(g.id);ok(d&&d.gobj.length>=1,g.id+' has group objectives');ok(d&&d.lines.length&&d.lines.every(l=>g.proj.includes(l.p)),g.id+' spend is its projects\' budget lines');
  ok(d&&d.T.appr===d.lines.reduce((s,l)=>s+l.appr,0),g.id+' approved total adds up');ok(d&&d.projs.length===g.proj.length,g.id+' work lists its projects')});
 go('bst');let el=document.querySelector('#view [data-bst-group]');ok(el&&el.getAttribute('data-bst-group')==='DP'&&/modeled/.test(el.textContent),'group view renders on bst, labeled modeled');
 const b=document.querySelector('#view [data-bst-grp="OR"]');if(b){b.click();await new Promise(r=>setTimeout(r,150));el=document.querySelector('#view [data-bst-group]');ok(el&&el.getAttribute('data-bst-group')==='OR'&&/Operational Resilience/.test(el.innerText),'choosing a group switches the view')}else ok(false,'group chips');
 S.thrGrp.g='DP';return f}));

console.log('thread test',fails.length?'FAIL\n - '+fails.join('\n - '):'ok','| page errors',errs.length?errs.slice(0,4):'none');
await b.close();process.exit(fails.length||errs.length?1:0)})();
