const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_a15/full.html'),{waitUntil:'load',timeout:150000});await p.waitForTimeout(6500);
const r=await p.evaluate(()=>{const o={};o.leave=(S.ppl.leave||[]).filter(l=>/^O5-/.test(l.id)).length;
 o.proc0=PROCLIB.get('org_joiner');o.proc0=Object.keys(o.proc0||{}).join(',');o.proc=['org_joiner','org_mover','org_leaver','org_vac_hire'].map(id=>{const x=PROCLIB.get(id);return x&&[x.id,x.owner,x.backup,x.level,x.target]});
 o.mat=G=>0;
 const mm=MODMAP.modules.find(m=>m.id==='org_chart');o.flows=mm&&[(mm.out||[]).length,(mm.in||[]).length,(mm.out||[]).filter(f=>/person\.\*|PTO|positions/.test(f.data)).map(f=>f.status)];
 o.mmwarn=(ORGX.modWarn||[]);
 o.ents=['compensation_record','benefit_enrollment','pto_balance','pto_request','position'].map(e=>[e,!!DATAMODEL.tables[e],DATAMODEL.tables[e]&&DATAMODEL.tables[e].status]);
 o.cls=(PLAT.ent&&PLAT.ent('compensation_record'))?JSON.stringify((PLAT.ent('compensation_record').fields||[]).map(f=>f.classification||f.cls)):'';
 o.ct=['org_chart'].map(id=>CONTRACT.evaluate(id).score);
 o.events=window.EVENTS.list().filter(e=>/^(person|vacancy)/.test(e.id)).map(e=>e.id+':'+e.enabledRules+':'+(e.owner||'-'));
 o.search=[]; try{const q='open position';o.search=SEARCHX.flatMap(f=>{try{return f()}catch(e){return[]}}).filter(x=>/Add a person|Open positions|Directory sync|Senior platform/.test(x.t)).map(x=>x.t)}catch(e){o.serr=e.message}
 let said='';const sv=window.say;window.say=(q,x)=>{said+=' | '+(x&&x.t||'').replace(/<[^>]+>/g,'')};const sg=window.go;window.go=()=>{};
 ['how many open positions do we have','how many contractors and fte','directory sync status','what fires when someone leaves'].forEach(q=>{for(const fn of ASKX){try{if(fn(q))break}catch(e){}}});window.say=sv;window.go=sg;o.ask=said.slice(0,700);return o});
console.log(JSON.stringify(r,null,1).slice(0,3500));console.log(errs);await b.close()})();
