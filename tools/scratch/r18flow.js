const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message.slice(0,160)+' @ '+String(e.stack).split('\n')[1]));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(4500);
const ev=(f,a)=>p.evaluate(f,a);
console.log('wire',JSON.stringify(await ev(()=>R18.wireState)));
console.log('inbox adapter',await ev(()=>!!INBOX.adapters.r18_access));
console.log('metrics',await ev(()=>['m_acc_time','m_acc_policy','m_acc_recert','m_acc_denied','m_acc_over','m_bld_cov'].map(k=>k+':'+(METRICS[k]&&METRICS[k].cur)).join(' ')));
console.log('ents',await ev(()=>['access_request','access_grant','review_finding','build_objective_link'].map(k=>k+':'+!!PLAT.ent(k)).join(' ')));
console.log('modmap',await ev(()=>['r18_access','r18_builds','r18_lens','r18_strategy'].map(k=>k+':'+MODMAP.modules.some(m=>m.id===k)).join(' ')));
console.log('procs',await ev(()=>['r18_data_access','r18_build_lifecycle','r18_lens_review','r18_strategy_map'].map(k=>k+':'+!!PROCLIB.get(k)).join(' ')));
// access flow
await ev(()=>{R18.access.startFor("ca_inv_exc",[])});await p.waitForTimeout(300);
// choose a new request for pipeline: person + budget_line already pending; make new request for ca_travel contract? use wizard
await ev(()=>{S.v=S.v||{};S.v.r18acv=1;go("r18_access")});await p.waitForTimeout(400);
console.log('wizard text',(await ev(()=>document.querySelector('.r18-two')?document.querySelector('.r18-two').innerText.slice(0,200).replace(/\n+/g,' | '):'none')));
await p.selectOption('[data-r18-accapp]','ca_pipeline');await p.waitForTimeout(300);
await p.check('[data-r18-ent="incident"]');await p.waitForTimeout(300);await p.check('[data-r18-ent="contract"]');await p.waitForTimeout(300);const before=await ev(()=>R18.access.queue().length);
console.log('wizard preview',await ev(()=>document.querySelectorAll('.r18-pv').length),'pv; queue before',before);
await p.click('[data-r18-submit]');await p.waitForTimeout(500);
console.log('queue after submit',await ev(()=>R18.access.queue().length),'reqs',await ev(()=>R18.st.acc.reqs.length));
// review queue
await ev(()=>{S.v.r18acv=2;go("r18_access")});await p.waitForTimeout(400);
console.log('queue cards',await ev(()=>document.querySelectorAll('.r18-rq').length));
await p.click('.r18-rq [data-r18-dec$="|approve"]');await p.waitForTimeout(400);
console.log('queue after approve',await ev(()=>R18.access.queue().length),'stateOf pipeline',JSON.stringify(await ev(()=>R18.access.stateOf('ca_pipeline'))));
console.log('inbox items',await ev(()=>{try{return INBOX.adapters.r18_access.list().length}catch(e){return 'ERR '+e.message}}));
// grants tab + recertify
await ev(()=>{S.v.r18acv=3;go("r18_access")});await p.waitForTimeout(300);
console.log('grants rows',await ev(()=>document.querySelectorAll('.screen tbody tr').length));
// lenses
for(const id of ['coo','cfo','caio','ceo','ciso','cio','chro']){const t=await ev(id=>{R18.st.lens=id;go('r18_lens');return document.querySelector('.r18-lead').innerText},id);console.log(id,'->',t.slice(0,150))}
console.log('caio playbook rows',await ev(()=>{R18.st.lens='caio';go('r18_lens');return document.querySelectorAll('.r18-t tbody tr').length}));
await ev(()=>go('home'));await p.waitForTimeout(400);
console.log('home strip',await ev(()=>!!document.querySelector('.r18-homelens')),'work block',await ev(()=>!!document.querySelector('.r18-work')));
// build record tabs
for(let i=0;i<8;i++){await ev(i=>{R18.st.app='ca_pipeline';S.v=S.v||{};S.v.r18av=i;go('r18_app')},i);await p.waitForTimeout(150)}
console.log('app tabs ok');
// personas
const per=await ev(()=>Object.keys(PERSONAS||{}));console.log('personas',per.join(','));
for(const k of per){const r=await ev(k=>{try{S.persona=k;render();renderNav();const nav=[...document.querySelectorAll('#nav .r18-sec b')].map(e=>e.textContent).join('/');return nav+' | items '+document.querySelectorAll('#nav a,#nav button').length}catch(e){return 'ERR '+e.message}},k);console.log(' ',k,r)}
console.log('ERRS',errs.length);errs.slice(0,12).forEach(e=>console.log(e));
await b.close()})();
