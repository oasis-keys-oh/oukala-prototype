// PR-31: walk each manager and specialist persona through its default menu on Meridian and its industry tenant.
// Usage: NODE_PATH=<repo>/node_modules node tools/scratch/ux/walk.js [personaKey ...]
// Writes tools/scratch/ux/shots/<persona>/*.png and tools/scratch/ux/out/<persona>.json
const L=require('./lib');const path=require('path'),fs=require('fs');
const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});
const P={
 portfolio:{n:'Portfolio lead',t:['core','storage'],q:'demand',tasks:[['approve','port'],['assign','ppl_cap'],['update','ppm_raid']]},
 pm:{n:'Project manager',t:['core','health'],q:'beta',tasks:[['update','ppm_proj'],['assign','ppm_raid'],['update','r15_time']]},
 ops:{n:'Service desk lead',t:['core','storage'],q:'outage',tasks:[['assign','itsm_inc'],['update','itsm_mi'],['update','svc_oncall']]},
 change:{n:'Change manager',t:['core','storage'],q:'change',tasks:[['approve','itsm_chg'],['update','itsm_rel'],['assign','itsm_chg']]},
 fin:{n:'Finance approver',t:['core','health'],q:'invoice',tasks:[['approve','inv'],['approve','bud_req'],['update','bud_over']]},
 audit:{n:'Auditor (read only)',t:['core','mining'],q:'evidence',tasks:[['approve','r15d_evidence'],['update','grc_home'],['assign','bud_doa']]},
 dist:{n:'Distribution manager',t:['core','health'],q:'request',tasks:[['assign','svc_req'],['update','plat_proc'],['update','metrics']]},
 fac:{n:'Facilities lead',t:['core','health'],q:'work order',tasks:[['assign','svc_req'],['update','bud_ven'],['update','metrics']]},
 scm:{n:'Procurement lead',t:['core','mining'],q:'purchase order',tasks:[['approve','r15_p2p'],['update','bud_ven'],['update','ppm_sow']]},
 plant:{n:'Plant manager',t:['core','mining'],q:'haul',tasks:[['update','metrics'],['update','exe_mat'],['assign','svc_req']]},
 proc:{n:'Process control lead',t:['core','mining'],q:'change',tasks:[['approve','itsm_chg'],['update','plat_proc'],['assign','svc_req']]},
};
const RX={approve:/^(approve|release|accept|sign off)/i,assign:/^(assign|reassign|claim|take|staff|allocate)/i,update:/^(update|edit|save|log|submit|change status|mark|resolve|record)/i};
const METRICS=()=>{const v=document.querySelector('#view');const t=v?v.innerText:'';const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const a=m.length>3?+m[3]:1;const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};return {L:0.2126*f(+m[0])+0.7152*f(+m[1])+0.0722*f(+m[2]),a}};
 const bgOf=e=>{while(e){const b=lum(getComputedStyle(e).backgroundColor);if(b&&b.a>0.9)return b.L;e=e.parentElement}return lum(getComputedStyle(document.body).backgroundColor).L};
 let low=0,lowEx=[],small=0,smallEx=[];const leaves=[...v.querySelectorAll('*')].filter(e=>e.childElementCount===0&&e.textContent.trim().length>1&&vis(e)).slice(0,1500);
 leaves.forEach(e=>{const s=getComputedStyle(e);const fg=lum(s.color);if(!fg)return;const bg=bgOf(e);const hi=Math.max(fg.L,bg),lo=Math.min(fg.L,bg);const cr=(hi+0.05)/(lo+0.05);
  const fs=parseFloat(s.fontSize);if(cr<4.5&&fs<18&&+s.opacity!==0){low++;if(lowEx.length<4)lowEx.push(e.textContent.trim().slice(0,40)+' '+cr.toFixed(2))}
  if(fs<12){small++;if(smallEx.length<3)smallEx.push(e.textContent.trim().slice(0,30)+' '+fs+'px')}});
 const btns=[...v.querySelectorAll('button,[role=button],a[href],[onclick]')].filter(vis);
 const noName=btns.filter(b=>!(b.innerText||'').trim()&&!b.getAttribute('aria-label')&&!b.getAttribute('title')).length;
 const clickDivs=[...v.querySelectorAll('div[onclick],span[onclick],td[onclick],tr[onclick]')].filter(e=>vis(e)&&!e.getAttribute('tabindex')&&!e.getAttribute('role')).length;
 const inputs=[...v.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis);
 const unl=inputs.filter(i=>!(i.id&&document.querySelector('label[for="'+i.id+'"]'))&&!i.closest('label')&&!i.getAttribute('aria-label')&&!i.getAttribute('aria-labelledby')&&!i.getAttribute('title')).length;
 const tables=[...v.querySelectorAll('table')].filter(vis);const rows=tables.map(x=>x.rows.length);
 const h=[...v.querySelectorAll('h1,h2,h3')].filter(vis).map(e=>e.tagName+':'+e.innerText.trim().slice(0,60)).slice(0,10);
 const tiny=[...v.querySelectorAll('button,a[href],input,select,[role=button]')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.height<24||r.width<24}).length;
 const honest=(t.match(/\b(modeled|simulated|sample|hypothesis|prototype fact|illustrative|seeded|not live)\b/gi)||[]).length;
 const nums=(t.match(/\$?\d[\d,.]*%?/g)||[]).length;
 const gapEx=(t.match(/[^\n]*(no data|not available|no records|nothing (to|here|yet)|not yet|gap|missing|not in this tenant|no .{0,20} yet)[^\n]*/gi)||[]).slice(0,6).map(s=>s.slice(0,120));
 const thr=(document.getElementById('tbThread')||{});
 return {title:(document.querySelector('.topbar h1, h1')||{}).innerText||'',h,len:t.length,words:t.split(/\s+/).length,nums,honest,emdash:(t.match(/—/g)||[]).length,
  banned:(t.match(/\b(Core|Fabric Enterprise|Fabric|Trellis|Project Online|SolarWinds|ServiceNow|Jira)\b/g)||[]).slice(0,6),meridian:(t.match(/Meridian/g)||[]).length,
  tables:tables.length,rows,buttons:btns.length,noName,clickDivs,inputs:inputs.length,unlabeled:unl,low,lowEx,small,smallEx,tiny,gapEx,
  thread:thr.hidden?'(hidden)':(thr.innerText||'').replace(/\s+/g,' ').slice(0,240),ox:document.documentElement.scrollWidth>innerWidth+1,sw:document.documentElement.scrollWidth,
  head:t.slice(0,700)}};
(async()=>{const keys=process.argv.slice(2).length?process.argv.slice(2):Object.keys(P);
for(const k of keys){const def=P[k];const dir=path.join(__dirname,'shots',k);const res={persona:k,name:def.n,tenants:{}};
 const {b,p,errs}=await L.open();
 for(const t of def.t){const R=res.tenants[t]={};await L.setup(p,k,t);await L.goto(p,'home');
  R.rail=await p.evaluate(()=>{const r=document.querySelector('aside.rail');return r?r.innerText.replace(/\n+/g,' | '):''});
  R.lensBadge=await p.evaluate(()=>{const v=document.querySelector('#view');return v?v.innerText.slice(0,80):''});
  R.home=await p.evaluate(METRICS);R.homeText=(await L.txt(p)).slice(0,6000);await L.shot(p,dir,t+'_home');await L.shot(p,dir,t+'_home_full',true);
  R.pins=await p.evaluate(()=>{try{return NAVX.persona.pin()}catch(e){return null}});
  R.areas=await p.evaluate(()=>{try{return NAVX.persona.groups()}catch(e){return null}});
  R.screens={};const pins=(R.pins||[]).map(x=>typeof x==='string'?x:(x.id||x[0])).filter(Boolean);
  for(const id of pins){await L.goto(p,id);const m=await p.evaluate(METRICS);R.screens[id]=m;await L.shot(p,dir,t+'_'+id);
   if(t==='core')await L.shot(p,dir,t+'_'+id+'_full',true)}
  /* tasks: find the control on the screen, click it, record what happened */
  R.tasks=[];for(const [kind,id] of def.tasks){await L.goto(p,id);const before=await p.evaluate(()=>document.querySelector('#view').innerText.length);
   const found=await p.evaluate(src=>{const rx=new RegExp(src,'i');const c=[...document.querySelectorAll('#view button,#view [role=button],#view a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0});
    const m=c.filter(e=>rx.test((e.innerText||e.getAttribute('aria-label')||'').trim()));return {all:c.length,labels:m.slice(0,6).map(e=>(e.innerText||e.getAttribute('aria-label')).trim().slice(0,50)),
    rowOpen:[...document.querySelectorAll('#view tr[data-id],#view tr[onclick],#view tbody tr')].length}},RX[kind].source);
   let outcome='',where='';
   if(found.labels.length){const idx=await p.evaluate(src=>{const rx=new RegExp(src,'i');const c=[...document.querySelectorAll('#view button,#view [role=button],#view a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0});
     const m=c.find(e=>rx.test((e.innerText||e.getAttribute('aria-label')||'').trim()));m.setAttribute('data-ux-target','1');return true},RX[kind].source);
    try{await p.click('[data-ux-target="1"]',{timeout:3000});await p.waitForTimeout(700);
     outcome=await p.evaluate(()=>{const tt=[...document.querySelectorAll('.toast,[role=status],[aria-live],.r17n-toast,.inbx-banner')].map(e=>e.innerText.trim()).filter(Boolean).join(' / ');
      const d=document.getElementById('drawer');const dr=d&&d.classList.contains('open')?'DRAWER: '+d.innerText.slice(0,300):'';
      const dl=[...document.querySelectorAll('dialog[open],[role=dialog]')].filter(e=>e.getBoundingClientRect().height>0).map(e=>'DIALOG: '+e.innerText.slice(0,300)).join(' ');
      return (tt.slice(0,300)+' '+dr+' '+dl).trim()})}catch(e){outcome='click failed: '+e.message.slice(0,100)}
    await L.shot(p,dir,t+'_task_'+kind+'_'+id)}
   else {/* try opening the first row and look again in the drawer */
    const opened=await p.evaluate(()=>{const r=document.querySelector('#view tbody tr');if(!r)return false;r.setAttribute('data-ux-row','1');return true});
    if(opened){try{await p.click('[data-ux-row="1"]',{timeout:3000});await p.waitForTimeout(700)}catch(e){}
     where=await p.evaluate(src=>{const rx=new RegExp(src,'i');const d=document.getElementById('drawer');const c=[...document.querySelectorAll('#drawer button,#drawer a,[role=dialog] button')].filter(e=>e.getBoundingClientRect().width>0);
      return {drawer:!!(d&&d.getBoundingClientRect().width>0&&d.innerText.length>20),labels:c.filter(e=>rx.test((e.innerText||'').trim())).slice(0,6).map(e=>e.innerText.trim().slice(0,50)),all:c.slice(0,14).map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,30))}},RX[kind].source);
     await L.shot(p,dir,t+'_task_'+kind+'_'+id+'_row')}}
   R.tasks.push({kind,id,found,outcome,where});await p.keyboard.press('Escape').catch(()=>{})}
  /* find a record through search */
  await L.goto(p,'home');await p.keyboard.press('Control+k');await p.waitForTimeout(400);let opened=await p.evaluate(()=>{const a=document.activeElement;return a&&(a.tagName==='INPUT')?(a.id||a.placeholder||'input'):''});
  if(!opened){await p.keyboard.press('Meta+k');await p.waitForTimeout(400);opened=await p.evaluate(()=>{const a=document.activeElement;return a&&a.tagName==='INPUT'?(a.id||a.placeholder):''})}
  if(opened){await p.keyboard.type(def.q,{delay:20});await p.waitForTimeout(900);
   R.search={input:opened,q:def.q,res:await p.evaluate(()=>{const c=[...document.querySelectorAll('[role=dialog],[role=listbox],.zs-pal,.nx-pal,#pal,.pal')].filter(e=>e.getBoundingClientRect().height>0);return c.map(e=>e.innerText).join('\n').slice(0,1500)})};
   await L.shot(p,dir,t+'_search');await p.keyboard.press('Escape')}else R.search={input:null};
  /* follow to the objective: thread on the first pin */
  if(pins[0]){await L.goto(p,pins[0]);R.threadFirst=await p.evaluate(()=>{const s=document.getElementById('tbThread');return s?{hidden:s.hidden,text:s.innerText.replace(/\s+/g,' '),chips:s.querySelectorAll('button,a').length}:null});
   const ok=await p.evaluate(()=>{const s=document.getElementById('tbThread');const c=s&&s.querySelector('button,a');if(!c)return false;c.setAttribute('data-ux-thr','1');return true});
   if(ok){try{await p.click('[data-ux-thr="1"]',{timeout:3000});await p.waitForTimeout(800);R.threadOpen=await p.evaluate(()=>{const d=document.getElementById('drawer');return d?d.innerText.slice(0,1200):''});await L.shot(p,dir,t+'_thread_open')}catch(e){R.threadOpen='click failed '+e.message.slice(0,80)}
    await p.keyboard.press('Escape')}}
 }
 /* dark and phone on the first tenant: home and the first pin */
 await b.close();
 for(const mode of ['dark','phone']){const o=mode==='dark'?{dark:true}:{vp:{width:400,height:860}};const {b:b2,p:p2}=await L.open(o);
  if(mode==='dark')await p2.evaluate(()=>{try{PREF.theme='dark';document.documentElement.setAttribute('data-theme','dark')}catch(e){}});
  for(const t of def.t){await L.setup(p2,k,t);await L.goto(p2,'home');if(mode==='dark')await p2.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
   const pins=((res.tenants[t]||{}).pins||[]).map(x=>typeof x==='string'?x:(x.id||x[0])).filter(Boolean);
   res.tenants[t][mode]={home:await p2.evaluate(METRICS)};await L.shot(p2,dir,t+'_home_'+mode);
   for(const id of pins.slice(0,mode==='phone'?4:2)){await L.goto(p2,id);if(mode==='dark')await p2.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));res.tenants[t][mode][id]=await p2.evaluate(METRICS);await L.shot(p2,dir,t+'_'+id+'_'+mode)}}
  await b2.close()}
 res.errors=errs.slice(0,20);fs.writeFileSync(path.join(OUT,k+'.json'),JSON.stringify(res,null,1));console.log('done',k,'errors',errs.length)}
})().catch(e=>{console.error(e);process.exit(1)});
