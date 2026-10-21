// PR-31 executive experience walk. Usage: node tools/scratch/ux/walk_exec.js [persona,...]
// For each executive persona: Home and the role's top tasks on Meridian (light, dark, 400 px), one industry company, the
// Showroom lens and the role's missions, keyboard and search findability. Writes screenshots to tools/scratch/ux/shots/<persona>/
// and measurements to tools/scratch/ux/shots/<persona>/data.json. Fictional sample data only.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'../../..');const SHOTS=path.join(__dirname,'shots');
const P={
 ceo:{lens:'ceo',ten:'health',tasks:['exe_board','r18_lens','exe_strat','exe_dash','r18_strategy'],q:['board pack','are we on track against strategy','largest open investment','member renewal']},
 exec:{lens:'cio',ten:'storage',tasks:['bst','exe_dash','tower','r18_builds','itsm_chg'],q:['spend against plan','change collides with release','AI agents','technical debt']},
 coo:{lens:'coo',ten:'mining',tasks:['exe_strat','strat_exec','ppl_jrny','orgdesign','plat_proc'],q:['where does work stall','journey map','cost to serve','process maturity']},
 cfo:{lens:'cfo',ten:'health',tasks:['bst','inv','bud_over','exe_dash','r18_spend'],q:['approve invoices','budget variance','where the money goes','invoice over budget']},
 cco:{lens:'ceo',ten:'storage',tasks:['metrics','svc_req','org_chart','plat_proc'],q:['customer cases late','publication revenue','refunds waiting for approval','customer satisfaction']},
 chro:{lens:'chro',ten:'health',tasks:['org_chart','ppl_perf','ppl_train','ppl_cap'],q:['headcount plan','performance reviews','who is available','hiring']},
 ciso:{lens:'ciso',ten:'storage',tasks:['grc_home','r15_iam','exe_risk','guard','grc_ctl'],q:['privileged access review','risks above appetite','control evidence','break glass']},
 caio:{lens:'caio',ten:'mining',tasks:['tower','r15d_agents','kcs_test','r17q_value'],q:['AI spend cap','agents without a human owner','where is AI saving time','test AI answers']},
 clo:{lens:'clo',ten:'storage',tasks:['ppm_sow','grc_pol','grc_exc','bud_ven'],q:['review a statement of work','contract renewals','policy acknowledgement','regulatory exposure']},
 board:{lens:null,ten:'mining',tasks:['exe_board','r15d_evidence','exe_risk','exe_dash','tower'],q:['board pack','AI oversight','risk','evidence']}
};
const ROLEKEY={exec:'cio'};
const want=(process.argv[2]||Object.keys(P).join(',')).split(',');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
for(const k of want){const cfg=P[k];if(!cfg){console.log('skip',k);continue}
 const out=path.join(SHOTS,k);fs.mkdirSync(out,{recursive:true});
 const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR '+String(e.message).slice(0,200)));
 p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS|file/.test(m.text())&&errs.push('console '+m.text().slice(0,200)));
 await p.route(/^https?:/,r=>r.abort());
 const t0=Date.now();await p.goto('file://'+ROOT+'/build_out/full.html',{waitUntil:'domcontentloaded',timeout:180000});
 await p.waitForFunction(()=>window.NAVX&&typeof go==='function'&&window.EXP&&window.CONTRIB,null,{timeout:180000});await p.waitForTimeout(1200);
 const loadMs=Date.now()-t0;
 const D={persona:k,loadMs,screens:{},tenant:{},search:{},keyboard:{},showroom:{},errs};
 const shot=async(name)=>{await p.screenshot({path:path.join(out,name+'.jpg'),type:'jpeg',quality:55})};
 const measure=async(id)=>p.evaluate(async(id)=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const t=performance.now();let thrown=null;
  try{go(id)}catch(e){thrown=String(e.message)}await w(350);const ms=Math.round(performance.now()-t);const v=document.getElementById('view');
  const vis=e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'};
  const H=innerHeight;const els=[...v.querySelectorAll('*')];
  const inter=[...v.querySelectorAll('a,button,input,select,textarea,[role=button],[role=tab],[tabindex]')].filter(vis);
  const above=inter.filter(e=>e.getBoundingClientRect().top<H);
  const noname=inter.filter(e=>{const n=(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||e.value||e.getAttribute('placeholder')||'').trim();const lb=e.id&&document.querySelector('label[for="'+e.id+'"]');return !n&&!lb&&!e.getAttribute('aria-labelledby')}).map(e=>e.tagName+'.'+String(e.className).slice(0,40));
  const small=e=>e.tagName==='BUTTON'||e.tagName==='A';
  const tiny=inter.filter(e=>{const r=e.getBoundingClientRect();return r.height<24||r.width<24}).length;
  /* text: sizes and contrast */
  const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b2,a]=m.map(Number);if(a===0)return null;const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return {L:.2126*f(r)+.7152*f(g)+.0722*f(b2),a:a==null?1:a}};
  const bgOf=e=>{let n=e;while(n&&n!==document.documentElement){const cs=getComputedStyle(n);if(cs.backgroundImage&&cs.backgroundImage!=='none')return 'img';const l=lum(cs.backgroundColor);if(l&&l.a>.85)return l;n=n.parentElement}return lum(getComputedStyle(document.body).backgroundColor)};
  const sizes={};let low=[],checked=0,unknown=0,under12=0;
  const texts=els.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1)&&vis(e));
  texts.forEach(e=>{const cs=getComputedStyle(e);const fs=Math.round(parseFloat(cs.fontSize));sizes[fs]=(sizes[fs]||0)+1;if(fs<12)under12++;
   if(e.getBoundingClientRect().top>H*1.5||checked>500)return;checked++;const fg=lum(cs.color);const bg=bgOf(e);if(!fg||!bg||bg==='img'){unknown++;return}
   const r=(Math.max(fg.L,bg.L)+.05)/(Math.min(fg.L,bg.L)+.05);const big=fs>=24||(fs>=19&&+cs.fontWeight>=700);if(r<(big?3:4.5)&&fg.a>.5)low.push({t:e.textContent.trim().slice(0,40),r:+r.toFixed(2),fs})});
  const txt=v.innerText;const words=txt.split(/\s+/).filter(Boolean).length;
  const aboveTxt=texts.filter(e=>e.getBoundingClientRect().top<H).map(e=>[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ')).join(' ').split(/\s+/).filter(Boolean).length;
  const h1=[...v.querySelectorAll('h1')].map(e=>e.textContent.trim().slice(0,80));const h2=v.querySelectorAll('h2').length;
  const fonts=[...new Set(texts.slice(0,300).map(e=>getComputedStyle(e).fontFamily.split(',')[0].trim()))];
  const labels=(txt.match(/\b(modeled|simulated|hypothesis|prototype fact|illustrative|sample)\b/gi)||[]).length;
  const thread=(document.getElementById('tbThread')||{innerText:''}).innerText.replace(/\s+/g,' ').slice(0,300);
  const card=v.querySelector('[data-ctb-card]');
  const jargon=(txt.match(/\b(RACI|SLA|SLO|CMDB|TBM|DOA|BPMN|DMN|KCS|ITSM|ITOM|RAID|WBS|CI|P2P|SOW|GRC|IAM|KPI|OKR|MTTR|DORA|CFR|NPS|CSAT)\b/g)||[]);
  return {id,name:(SCREENS.find(s=>s[0]===id)||[])[1],thrown,ms,h1,h2,fonts,sizes,under12,words,aboveTxt,inter:inter.length,above:above.length,tiny,noname:noname.slice(0,8),nonameN:noname.length,
   lowContrast:low.slice(0,8),lowN:low.length,checked,unknown,emdash:(txt.match(/—/g)||[]).length,meridian:(txt.match(/Meridian/g)||[]).length,
   broken:/could not be drawn|undefined|NaN|\[object Object\]/.test(txt),brokenHit:(txt.match(/.{0,30}(could not be drawn|undefined|NaN|\[object Object\]).{0,30}/)||[''])[0],
   labels,thread,card:card?card.innerText.replace(/\s+/g,' ').slice(0,400):null,jargon:[...new Set(jargon)],
   hero:!!v.querySelector('.hero,[class*=hero]'),proc:!!v.querySelector('.proccard,[class*=procCard],[class*=proc-card],.pcard'),
   overflowX:document.documentElement.scrollWidth>innerWidth+1,scrollW:document.documentElement.scrollWidth,height:v.scrollHeight,
   first:txt.replace(/\s+/g,' ').slice(0,500)}},id);
 await p.evaluate(k=>{NAVX.persona.set(k)},k);await wait(500);
 D.who=await p.evaluate(()=>({n:PERSONAS[S.persona].n,who:PERSONAS[S.persona].who,as:PERSONAS[S.persona].as,ro:!!PERSONAS[S.persona].readonly,nav:document.getElementById('nav').innerText.replace(/\n+/g,' | ').slice(0,900),
   level:(()=>{try{return CONTRIB.viewer().level}catch(e){return null}})(),points:(()=>{try{return CONTRIB.points().total}catch(e){return null}})(),missions:EXP.list({role:null}).map(m=>m.id)}));
 /* Home and tasks, Meridian, light */
 for(const id of ['home',...cfg.tasks]){const m=await measure(id);D.screens[id]=m;await shot('core_'+id);}
 /* home, scrolled: My contribution */
 await p.evaluate(()=>go('home'));await wait(400);
 await p.evaluate(()=>{const c=document.querySelector('#view [data-ctb-card]');if(c)c.scrollIntoView({block:'start'})});await wait(250);await shot('core_home_contrib');
 await p.evaluate(()=>scrollTo(0,0));
 /* rail flyout: first area */
 await p.evaluate(()=>{const a=document.querySelector('#nav [data-nx-area],#nav .nx-area,#nav [data-area]');if(a)a.click()});await wait(300);await shot('core_rail_flyout');
 D.flyout=await p.evaluate(()=>{const f=document.querySelector('.nx-fly,[data-nx-fly],.nx-pop:not([hidden])');return f?f.innerText.replace(/\n+/g,' | ').slice(0,600):null});
 await p.keyboard.press('Escape');
 /* dark */
 await p.evaluate(()=>{PREF.theme='dark';applyPrefs()});await wait(300);
 for(const id of ['home',cfg.tasks[0],cfg.tasks[1]]){const m=await measure(id);D.screens[id+'@dark']={lowN:m.lowN,lowContrast:m.lowContrast,unknown:m.unknown,checked:m.checked};await shot('dark_'+id)}
 await p.evaluate(()=>{PREF.theme='light';applyPrefs()});
 /* 400 px */
 await p.setViewportSize({width:400,height:860});await wait(500);
 for(const id of ['home',cfg.tasks[0],cfg.tasks[1]]){const m=await measure(id);D.screens[id+'@400']={overflowX:m.overflowX,scrollW:m.scrollW,tiny:m.tiny,above:m.above,aboveTxt:m.aboveTxt,lowN:m.lowN};await shot('w400_'+id)}
 await p.setViewportSize({width:1440,height:900});await wait(400);
 /* keyboard: 25 tabs from the top of Home */
 await p.evaluate(()=>{go('home');scrollTo(0,0);document.activeElement&&document.activeElement.blur()});await wait(400);
 const stops=[];for(let i=0;i<25;i++){await p.keyboard.press('Tab');stops.push(await p.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const cs=getComputedStyle(e);
  const r=e.getBoundingClientRect();return {tag:e.tagName,name:(e.getAttribute('aria-label')||e.textContent||e.getAttribute('title')||'').trim().replace(/\s+/g,' ').slice(0,40),
  ring:(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||(cs.boxShadow&&cs.boxShadow!=='none'),inView:r.top>=0&&r.bottom<=innerHeight}}))}
 D.keyboard.home=stops;await shot('kbd_home_tab25');
 /* search findability */
 for(const q of cfg.q){D.search[q]=await p.evaluate(q=>{try{const r=NAVX.search(q,{limit:5});return {total:r.total,top:r.results.slice(0,5).map(x=>x.type+':'+x.title)}}catch(e){return {err:e.message}}},q)}
 /* industry company */
 await p.evaluate(t=>TENANT.switch(t),cfg.ten);await wait(800);
 D.tenant.id=cfg.ten;D.tenant.badge=await p.evaluate(()=>(document.getElementById('tnBtn')||{}).textContent||'');
 for(const id of ['home',...cfg.tasks.slice(0,3)]){const m=await measure(id);D.tenant[id]={meridian:m.meridian,broken:m.broken,brokenHit:m.brokenHit,words:m.words,first:m.first.slice(0,300),thread:m.thread,card:m.card};await shot('ten_'+cfg.ten+'_'+id)}
 await p.evaluate(()=>TENANT.switch('core'));await wait(600);
 /* Showroom and lens */
 await p.evaluate(()=>go('showroom'));await wait(600);await shot('show_home');
 D.showroom.home=await p.evaluate(()=>document.getElementById('view').innerText.replace(/\s+/g,' ').slice(0,900));
 if(cfg.lens){await p.evaluate(l=>{SHOW.applyLens(l,{keepPersona:true});go('r18_lens')},cfg.lens);await wait(600);await shot('show_lens_'+cfg.lens);
  D.showroom.lens=await p.evaluate(()=>document.getElementById('view').innerText.replace(/\s+/g,' ').slice(0,900))}
 const role=ROLEKEY[k]||k;D.showroom.missions=await p.evaluate(r=>EXP.list({role:r}).map(m=>({id:m.id,title:m.title,brief:m.brief,clock:m.clock,role:m.role})),role);
 for(const m of D.showroom.missions.filter(m=>m.role!=='any').concat(D.showroom.missions.filter(m=>m.id==='monday'))){
  const st=await p.evaluate(([id,r])=>{try{EXP.start(id,{role:r,mode:'self',tenant:'core'})}catch(e){return {err:e.message}}return null},[m.id,role]);await wait(1500);await shot('exp_'+m.id);
  D.showroom['exp_'+m.id]={err:st,state:await p.evaluate(()=>{const s=EXP.state();return {running:s.running,screen:s.screen,next:s.next,elapsed:s.elapsed,ranOn:s.ranOn}}),
   ui:await p.evaluate(()=>{const e=document.querySelector('.sexp,[class*=sexp],[data-exp],.exp-card,[class*=exp-]');return e?e.innerText.replace(/\s+/g,' ').slice(0,500):null})};
  await wait(4000);await shot('exp_'+m.id+'_t6');await p.evaluate(()=>EXP.stop())}
 D.errs=errs;fs.writeFileSync(path.join(out,'data.json'),JSON.stringify(D,null,1));console.log(k,'done',Math.round((Date.now()-t0)/1000)+'s','errors',errs.length);
 await ctx.close()}
await b.close()})();
