// Re-runnable extractor. Usage: NODE_PATH=$(npm root -g) node spec/extract_registry.js [buildDir=out_v16b] [--skip-screens] [--only a,b]
// Output: spec/registry.json  (registry facts + measured layout per screen at 1440x900 dark and 400px phone)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');const args=process.argv.slice(2);
const BUILD=path.resolve(ROOT,args.find(a=>!a.startsWith('--'))||'out_v16b');
const skipScreens=args.includes('--skip-screens');const actionsOnly=args.includes('--actions-only');const only=args.includes('--only')?args[args.indexOf('--only')+1].split(','):null;
const OUT=path.join(__dirname,'registry.json');

// ---------- in-page: registry gather ----------
function gatherRegistry(){
  const seen=new WeakSet();
  const plain=(v,d=0)=>{ if(v==null)return v; const t=typeof v; if(t==='function')return undefined; if(t!=='object')return v; if(d>6)return undefined; if(seen.has(v)&&d>0&&false)return undefined;
    if(Array.isArray(v))return v.slice(0,500).map(x=>plain(x,d+1)); const o={}; for(const k of Object.keys(v)){ if(k[0]==='_')continue; const x=plain(v[k],d+1); if(x!==undefined)o[k]=x } return o };
  const G=(f,dflt)=>{try{const r=f();return r===undefined?dflt:r}catch(e){return dflt}};
  const R={};
  R.screens=SCREENS.map(s=>({id:s[0],name:s[1],navgroup:s[3]}));
  R.navgroups=G(()=>NAVX.groups.map(g=>({id:g.id,label:g.label,blurb:g.blurb})),[]);
  R.navmap=G(()=>Object.fromEntries(Object.entries(NAVX.map).map(([k,v])=>[k,{g:v.g,l:v.l,h:v.h,kw:v.kw,o:v.o}])),{});
  R.modules=G(()=>MODMAP.modules.map(m=>({id:m.id,sn:m.sn,name:m.name,band:m.band,own:m.own,app:m.app,r:m.r,w:m.w,proc:m.proc,steps:m.steps,scr:m.scr,nout:m.nout,nin:m.nin,proposed:!!m.proposed})),[]);
  R.flows=G(()=>MODMAP.flows.map(f=>({id:f.id,from:f.from,to:f.to,data:f.data,refs:(f.refs||[]).map(r=>r.id)})),[]);
  // entities
  R.entities=G(()=>PLAT.entities().map(e=>({id:e.id,label:e.label,owner:e.owner,steward:e.steward,domain:e.domain,nf:e.nf,fam:e.fam,lifecycle:e.lifecycle,proposed:!!e.proposed,ownerMod:e.ownerMod,note:(e.note||'').slice(0,240),cls:e.cls,ret:e.ret,readers:e.readers,writers:e.writers,status:e.status,authMix:e.authMix,
     fields:(e.fields||[]).map(f=>({k:f.k,label:f.label,type:f.type,ref:f.ref||f.to||null,authority:f.authority||null,classification:f.classification||null,req:!!f.req,ext:f.ext||null,opts:f.opts?(Array.isArray(f.opts)?f.opts.length:1):0,proposed:!!f.proposed}))})),[]);
  R.entityApps=G(()=>plain(PLAT.APPS),[]);R.entityDomains=G(()=>plain(PLAT.DOM),{});R.entityStats=G(()=>plain(PLAT.stats()),{});R.planned=G(()=>PLAT.PLANNED.map(p=>({id:p[0],dom:p[1],label:p[2],steward:p[3],why:p[4],used:p[5]})),[]);
  R.ownership=G(()=>{const o=ORGX.ownIndex();return {by:plain(o.by),un:plain(o.un),total:o.total,named:o.named,pct:o.pct}},{});
  // processes
  R.processes=G(()=>PROCLIB.list().map(x=>{const p=PROCLIB.get(x.id)||x;return {id:p.id,name:p.name,title:p.title,module:p.module,family:p.family,familyName:p.familyName,owner:p.owner,backup:p.backup,named:p.named,level:p.level,target:p.target,model:p.model,below:p.below,mix:p.mix,source:p.source,dims:p.dims,metrics:p.metrics,trigger:p.trigger,capability:p.capability,entities:p.entities,assessment:p.assessment?{avg:p.assessment.avg,raw:p.assessment.raw,weakest:p.assessment.weakest,capped:p.assessment.capped}:null,std:G(()=>PROC.defs[p.id].std,null),
     steps:(p.stepsList||[]).map(s=>({n:s.n,d:s.d,who:s.who,owner:s.owner||null,sla:s.sla||null,in:s.in||null,out:s.out||null,rule:s.rule||s.decision||s.dec||null,mode:s.mode||null}))}}),[]);
  R.procModes=G(()=>plain(PROC.modes),{});
  // metrics
  R.metrics=G(()=>Object.entries(METRICS).map(([id,m])=>({id,n:m.n,f:m.f,u:m.u,cur:m.cur,tgt:m.tgt,badAt:m.badAt,dir:m.dir,max:m.max,tr:m.tr,owner:m.owner,use:m.use,src:m.src||null,rem:m.rem?{kind:m.rem.kind,ref:m.rem.ref,title:m.rem.title,agent:m.rem.agent,auto:m.rem.auto,state:m.rem.state}:null})),[]);
  R.metricLineage=G(()=>{const o={};for(const id of Object.keys(METRICS)){try{const t=ATLAS.lin&&ATLAS.lin.trace&&ATLAS.lin.trace('metric:'+id);if(t)o[id]=JSON.stringify(plain(t)).slice(0,300)}catch(e){}}return o},{});
  // events and rules
  R.events=G(()=>EVENTS.list().map(e=>({id:e.id,label:e.label,module:e.module,owner:e.owner,fields:e.fields,subscribers:e.subscribers,rules:e.rules,enabledRules:e.enabledRules})),[]);
  R.eventRules=G(()=>EVENTS.rules.map(r=>({id:r.id,label:r.label||null,when:r.when,if:r.if,then:r.then,enabled:r.enabled,owner:r.owner})),[]);
  R.eventCoverage=G(()=>plain(EVENTS.coverage()),{});
  // roles, permissions, approvals
  R.roles=G(()=>plain(PERM.roles),[]);R.permGroups=G(()=>plain(PERM.groups),[]);R.personaRoles=G(()=>plain(PERM.personaRoles),{});R.personaUser=G(()=>plain(PERM.personaUser),{});
  R.permRules=G(()=>plain(PERM.state.rules),[]);R.fieldRules=G(()=>plain(PERM.state.fields),[]);
  R.guardActions=G(()=>Object.entries(GUARD.actions).map(([id,a])=>({id,n:a.n,all:a.all||[],any:a.any||[],sod:!!a.sod})),[]);
  R.personas=G(()=>Object.entries(PERSONAS).map(([id,p])=>({id,n:p.n,who:p.who,nav:p.nav,rings:p.rings,home:p.home})),[]);
  R.approvalGroups=G(()=>plain(APG.groups()),[]);
  R.approvalRules=G(()=>APPR.rules().map(r=>{const lv=[];const walk=n=>{if(!n)return;if(n.t==='lvl')lv.push({title:n.title,group:n.group,mode:n.mode,n:n.n,cond:n.cond,skip:n.skip,sla:n.sla,esc:n.esc,deleg:n.deleg,onReject:n.onReject});(n.items||[]).forEach(walk)};walk(r.root);return {id:r.id,name:r.name,entity:r.entity,desc:r.desc,owner:r.owner,backup:r.backup,version:r.version,levels:lv}}),[]);
  R.doa=G(()=>plain(DOA.tiers()),[]);
  R.statuses=G(()=>STATUS.defs().map(s=>({id:s.id,label:s.label,cat:s.cat,group:s.group,handover:s.handover,device:s.device,rehire:s.rehire,launches:(s.launches||[]).map(l=>l.kind+':'+l.ref)})),[]);
  // integrations, agents, bcdr, importers
  R.connectors=G(()=>plain(FAB.connectors),[]);R.fabRuns=G(()=>({n:FAB.runs.length,statuses:FAB.runs.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})}),{});
  R.editions=G(()=>plain(R16M.EDITIONS),[]);R.deployments=G(()=>plain(R16M.DEPLOY),[]);
  R.importers=G(()=>R16M.TPL.map(t=>({id:t.id,n:t.n,file:t.file,ent:t.ent,order:t.order,key:t.key,dep:t.dep,desc:t.desc,cols:t.cols.map(c=>({k:c.k,label:c.label,req:!!c.req,type:c.type,ref:c.ref||null,cls:c.cls||null}))})),[]);
  R.mcpTools=G(()=>MCPX.tools.map(t=>({n:t.n,d:t.d,write:t.write,required:(t.in&&t.in.required)||[]})),[]);
  R.gateChecks=G(()=>GATE.CHECKS.map(c=>({id:c.id,n:c.n,rule:c.rule,t:c.t})),[]);
  R.agentLevels=G(()=>plain(ORGX.LVL),{});
  R.agentsPlatform=G(()=>plain(AGENTS).map(a=>({id:a.id,n:a.n,kind:a.kind,prov:a.prov,model:a.model,cap:a.cap,auto:a.auto,cap$:a['cap$'],owner:a.owner,tools:a.tools,data:a.data,guards:a.guards})),[]);
  R.agents=G(()=>ORGX.agents().map(a=>({id:a.id,name:a.name,sponsor:a.sponsor,autonomy:a.autonomy,status:a.status,does:a.does,tools:a.tools,data:a.data,guards:a.guards,kill:a.kill,model:a.model,source:a.source,eval:a.eval})),[]);
  R.agentState=G(()=>AGENTS_STATE.list().map(a=>({id:a.id,name:a.name,display:a.display,sponsor:a.sponsor,kind:a.kind,gateway:a.gateway,observed:a.observed,autonomy:a.autonomy,shift:a.shift,model:a.model,cap:a.cap})),[]);
  R.bcdrPlans=G(()=>BCX.plans().map(p=>({id:p.id,n:p.n,kind:p.kind,scope:p.scope,tier:p.tier,status:p.status,own:p.own,bak:p.bak,grp:p.grp,cadence:p.cadence,lastReview:p.lastReview,rtoT:p.rtoT,rpoT:p.rpoT,nver:(p.vers||[]).length})),[]);
  R.bcdrExercises=G(()=>BCX.exs().map(e=>({id:e.id,planId:e.planId,app:e.app,type:e.type,date:e.date,status:e.status,fac:e.fac,fbak:e.fbak,grp:e.grp,rto:e.res&&e.res.rtoA,rpo:e.res&&e.res.rpoA})),[]);
  R.bcdrComps=G(()=>{const c={};BCX.comps().forEach(x=>{c[x.dim]=(c[x.dim]||0)+1});return c},{});
  R.contract=G(()=>CONTRACT.matrix().map(m=>({id:m.id,name:m.name,kind:m.kind,area:m.area,module:m.module,owner:m.owner,procs:m.procs,score:m.score,level:m.level,pass:m.pass,full:m.full,gaps:m.gaps,rules:m.rules.map(r=>({id:r.id,st:r.st,ev:(r.ev||'').slice(0,200),fix:(r.fix||'').slice(0,200)}))})),[]);
  R.contractStats=G(()=>plain(CONTRACT.stats()),{});
  // persistence
  R.storeEntities=G(()=>plain(STORE.entities()),[]);R.storeBackend=G(()=>String(STORE.backend),'');
  // permission per screen per persona
  R.screenAccess={};
  const pu=R.personaUser;
  for(const s of SCREENS){const row={};for(const p of Object.keys(pu)){row[p]=G(()=>PERM.can(p,'read','screen:'+s[0]).ok?1:0,-1)}R.screenAccess[s[0]]=row}
  R.sectionRules=G(()=>{const o={};PERM.state.rules.filter(r=>r.tier==='section').forEach(r=>{const m=String(r.res).replace(/^section:/,'').split(/[.:]/)[0];o[m]=(o[m]||0)+1});return o},{});
  // tokens
  const names=new Set();
  const scan=(rules)=>{for(const r of rules){if(r.style&&r.selectorText&&/:root/.test(r.selectorText)){for(let i=0;i<r.style.length;i++){const n=r.style[i];if(n.startsWith('--'))names.add(n)}}if(r.cssRules)scan(r.cssRules)}};
  for(const ss of document.styleSheets){try{scan(ss.cssRules)}catch(e){}}
  const probe=document.createElement('div');probe.style.cssText='position:fixed;left:-99px;top:0;width:1px;height:1px';document.body.appendChild(probe);
  const tokens={};const root=document.documentElement;
  for(const th of ['light','dark']){root.setAttribute('data-theme',th);for(const n of names){const raw=getComputedStyle(root).getPropertyValue(n).trim();
     probe.style.backgroundColor='';probe.style.backgroundColor='var('+n+')';const bg=getComputedStyle(probe).backgroundColor;
     (tokens[n]=tokens[n]||{})[th]={raw,color:(bg&&bg!=='rgba(0, 0, 0, 0)')?bg:null}}}
  root.setAttribute('data-theme','dark');probe.remove();R.tokens=tokens;
  R.themeMeta=G(()=>({rails:getComputedStyle(root).getPropertyValue('--railw').trim(),r:getComputedStyle(root).getPropertyValue('--r').trim()}),{});
  return R;
}

// ---------- in-page: per-screen measurement ----------
function measureScreen(opts){
  const phone=opts.phone;const view=document.querySelector('#view');const sc=view&&(view.querySelector('.screen')||view);
  const out={ok:!!sc};if(!sc)return out;
  window.scrollTo(0,0);const sx=0,sy=0;
  const R=el=>{const r=el.getBoundingClientRect();return {x:Math.round(r.left+window.scrollX),y:Math.round(r.top+window.scrollY),w:Math.round(r.width),h:Math.round(r.height)}};
  const vis=el=>{if(!el.getBoundingClientRect)return false;const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return false;const cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'};
  // token map from computed colors
  if(!window.__tokmap||window.__tokmap.theme!==document.documentElement.getAttribute('data-theme')){const m={};const root=document.documentElement;const names=new Set();
    const scan=(rules)=>{for(const r of rules){if(r.style&&r.selectorText&&/:root/.test(r.selectorText)){for(let i=0;i<r.style.length;i++){const n=r.style[i];if(n.startsWith('--'))names.add(n)}}if(r.cssRules)scan(r.cssRules)}};
    for(const ss of document.styleSheets){try{scan(ss.cssRules)}catch(e){}}
    const pr=document.createElement('div');pr.style.cssText='position:fixed;left:-99px;width:1px;height:1px';document.body.appendChild(pr);
    for(const n of names){pr.style.backgroundColor='';pr.style.backgroundColor='var('+n+')';const c=getComputedStyle(pr).backgroundColor;if(c&&c!=='rgba(0, 0, 0, 0)'&&!m[c])m[c]=n}
    pr.remove();window.__tokmap={theme:document.documentElement.getAttribute('data-theme'),m}}
  const tok=c=>{if(!c||c==='rgba(0, 0, 0, 0)')return null;return window.__tokmap.m[c]||c};
  const fnt=(el)=>{if(!el)return null;const cs=getComputedStyle(el);return {family:cs.fontFamily.split(',')[0].replace(/["']/g,'').trim(),size:parseFloat(cs.fontSize),weight:cs.fontWeight,lh:cs.lineHeight==='normal'?'normal':parseFloat(cs.lineHeight),color:tok(cs.color),ls:cs.letterSpacing}};
  const isCard=el=>{const cs=getComputedStyle(el);const bg=cs.backgroundColor!=='rgba(0, 0, 0, 0)'||cs.backgroundImage!=='none';const bd=parseFloat(cs.borderTopWidth)>0||cs.boxShadow!=='none';const r=el.getBoundingClientRect();return r.width>150&&r.height>60&&(bg||bd)&&cs.display!=='inline'&&cs.position!=='absolute'};
  const head=el=>{const h=el.querySelector('h1,h2,h3,h4');if(h)return h.textContent.trim().replace(/\s+/g,' ').slice(0,60);const c=el.querySelector('.cardhead,.ttl,.title,legend');if(c){const f=c.firstElementChild||c;return f.textContent.trim().replace(/\s+/g,' ').slice(0,60)}return ''};
  // regions
  const regions=[];
  const kindOf=(el)=>{const c=String(el.className);
    if(el.matches('section.hero,.hero'))return 'page-header';
    if(/statrow|kpi|rings|stat-row|tiles|metric-row/i.test(c))return 'kpi-row';
    if(el.tagName==='TABLE'||(el.querySelector('table')&&el.children.length<=2&&!/card|glass/.test(c)))return 'table';
    if(el.tagName==='ASIDE')return 'drawer';
    if(isCard(el))return 'card';
    return null};
  const walk=(par,depth,parentIdx)=>{let prev=null;
    for(const c of par.children){ if(!vis(c)||/^(INPUT|SCRIPT|STYLE|BUTTON|A|LABEL)$/.test(c.tagName))continue;
      const r=c.getBoundingClientRect(); if(r.height<14)continue;
      let k=kindOf(c);
      if(!k&&depth<3&&c.children.length>0){ walk(c,depth+1,parentIdx);continue }
      if(!k)continue;
      if(regions.length>=70)return;
      const cs=getComputedStyle(c);const box=R(c);
      const reg={i:regions.length,parent:parentIdx,depth,kind:k,tag:c.tagName.toLowerCase(),cls:String(c.className).split(/\s+/).filter(Boolean).slice(0,3).join(' '),label:head(c),...box,
        pad:[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft].map(parseFloat),radius:parseFloat(cs.borderTopLeftRadius)||0,bg:tok(cs.backgroundColor),border:parseFloat(cs.borderTopWidth)>0?tok(cs.borderTopColor):null,shadow:cs.boxShadow!=='none',display:cs.display,gap:cs.gap!=='normal'?cs.gap:null,cols:cs.display==='grid'?cs.gridTemplateColumns.split(' ').length:null};
      // gap to previous region within this parent chain
      if(prev){ const pb=prev; if(box.y>=pb.y+pb.h-2){reg.gapPrev={dir:'v',px:box.y-(pb.y+pb.h)}} else {reg.gapPrev={dir:'h',px:box.x-(pb.x+pb.w)}} }
      regions.push(reg);prev=reg;
      if(k==='card'&&depth<3){ // find inner kpi rows / tables inside card
        const inner=[...c.querySelectorAll('[class*=statrow],[class*=kpi],[class*=rings]')].filter(e=>vis(e)&&e.tagName!=='BUTTON'&&e.children.length>=2&&e.getBoundingClientRect().height>30).slice(0,2);
        inner.forEach(e=>{const b=R(e);if(regions.length<70)regions.push({i:regions.length,parent:reg.i,depth:depth+1,kind:'kpi-row',tag:e.tagName.toLowerCase(),cls:String(e.className).split(/\s+/).slice(0,2).join(' '),label:head(e),...b,n:e.children.length})});
      }
    }};
  walk(sc,0,-1);
  out.regions=regions;
  // header facts
  const hero=sc.querySelector('.hero')||sc;const h1=view.querySelector('h1');
  out.h1=h1?{text:h1.textContent.trim().slice(0,80),...fnt(h1),...R(h1)}:null;
  const h2=[...view.querySelectorAll('h2')].find(vis),h3=[...view.querySelectorAll('h3')].find(vis);
  out.h2=h2?{text:h2.textContent.trim().slice(0,60),...fnt(h2)}:null;out.h3=h3?{text:h3.textContent.trim().slice(0,60),...fnt(h3)}:null;
  const bodyEl=[...view.querySelectorAll('p,.story,.muted')].find(vis);out.body=fnt(bodyEl);
  const th=[...view.querySelectorAll('th')].find(vis),td=[...view.querySelectorAll('td')].find(vis);out.th=fnt(th);out.td=fnt(td);
  const btn0=[...view.querySelectorAll('button')].find(vis);out.btnFont=fnt(btn0);
  out.heroBox=R(hero);
  const crumb=document.querySelector('.r15-crumb')||view.querySelector('nav[aria-label=Breadcrumb]');out.breadcrumb=crumb?[...crumb.children].map(e=>e.textContent.trim()).filter(t=>t&&t!=='/').join(' / '):null;
  const own=view.querySelector('[data-ownx-asg],.ownx-badge');out.ownerBadge=own?{text:own.textContent.trim(),title:own.getAttribute('title')||''}:null;
  const pha=document.querySelector('#r16Pha');out.pageActions=pha?{...R(pha),buttons:[...pha.querySelectorAll('button')].map(b=>(b.getAttribute('aria-label')||b.textContent).trim().slice(0,40))}:null;
  out.tag=(view.querySelector('.r15-tag')||{}).textContent||null;
  // headings
  out.headings=[...view.querySelectorAll('h1,h2,h3,h4')].filter(vis).slice(0,40).map(h=>({l:h.tagName.toLowerCase(),t:h.textContent.trim().replace(/\s+/g,' ').slice(0,70)}));
  // tables
  out.tables=[...view.querySelectorAll('table')].filter(vis).slice(0,14).map(t=>{const cap=(t.closest('.card,section,.glass')||t.parentElement);const ths=[...t.querySelectorAll('thead th, tr:first-child th')];
    const cols=ths.map(h=>({label:h.textContent.trim().replace(/\s+/g,' ').slice(0,40),align:getComputedStyle(h).textAlign,w:Math.round(h.getBoundingClientRect().width)}));
    const c1=t.querySelector('tbody td, td');const tr=t.querySelector('tbody tr');
    return {heading:head(cap),...R(t),cols,rows:t.querySelectorAll('tbody tr').length||t.querySelectorAll('tr').length,rowH:tr?Math.round(tr.getBoundingClientRect().height):null,cellPad:c1?[getComputedStyle(c1).paddingTop,getComputedStyle(c1).paddingLeft].map(parseFloat):null,wide:t.scrollWidth>t.clientWidth+1||(t.parentElement&&t.parentElement.scrollWidth>t.parentElement.clientWidth+1)}});
  // buttons
  const bl=[...view.querySelectorAll('button,a.btn,[role=button],a[href]')].filter(vis).filter(b=>!b.closest('.vsw')&&!b.matches('[role=tab]'));
  out.nButtons=bl.length;
  out.buttons=bl.slice(0,40).map(b=>{const cs=getComputedStyle(b);const lab=(b.getAttribute('aria-label')||b.textContent||b.title||'').trim().replace(/\s+/g,' ').slice(0,50);const r=b.getBoundingClientRect();
    return {label:lab,primary:/primary/.test(b.className),cls:String(b.className).split(/\s+/).slice(0,3).join(' '),disabled:!!b.disabled,w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left+window.scrollX),y:Math.round(r.top+window.scrollY),icon:!(b.textContent||'').trim()}});
  // fields
  const inputs=[...view.querySelectorAll('input,select,textarea')].filter(i=>i.type!=='hidden'&&!(i.type==='radio'&&i.closest('.vsw,.views'))&&i.getBoundingClientRect().width>0);
  out.nFields=inputs.length;
  out.fields=inputs.slice(0,40).map(i=>{let lab=i.getAttribute('aria-label')||'';if(!lab&&i.id){const l=view.querySelector('label[for="'+CSS.escape(i.id)+'"]');if(l)lab=l.textContent}if(!lab){const l=i.closest('label');if(l)lab=l.textContent}if(!lab)lab=i.placeholder||i.name||'';
    return {label:lab.trim().replace(/\s+/g,' ').slice(0,50),type:i.tagName==='SELECT'?'select':i.tagName==='TEXTAREA'?'textarea':(i.type||'text'),required:!!(i.required||i.getAttribute('aria-required')==='true'),labelled:!!(i.getAttribute('aria-label')||i.labels&&i.labels.length||i.closest('label')),options:i.tagName==='SELECT'?i.options.length:null,w:Math.round(i.getBoundingClientRect().width),h:Math.round(i.getBoundingClientRect().height)}});
  // a11y
  const foc=[...view.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(e=>vis(e)&&e.getAttribute('tabindex')!=='-1'&&!e.disabled);
  const nameOf=e=>(e.getAttribute('aria-label')||e.textContent||e.title||e.value||'').trim();
  out.a11y={landmarks:{main:document.querySelectorAll('main,[role=main]').length,nav:document.querySelectorAll('nav,[role=navigation]').length,banner:document.querySelectorAll('header,[role=banner]').length,aside:document.querySelectorAll('aside,[role=complementary]').length,region:document.querySelectorAll('[role=region],section[aria-label]').length,search:document.querySelectorAll('[role=search]').length},
    roles:(()=>{const c={};view.querySelectorAll('[role]').forEach(e=>{c[e.getAttribute('role')]=(c[e.getAttribute('role')]||0)+1});return c})(),
    h1:view.querySelectorAll('h1').length,tabbable:foc.length,noName:foc.filter(e=>e.tagName!=='INPUT'&&e.tagName!=='SELECT'&&e.tagName!=='TEXTAREA'&&!nameOf(e)&&!e.querySelector('img[alt],svg title')).length,
    imgNoAlt:[...view.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length,unlabelled:inputs.filter(i=>!(i.getAttribute('aria-label')||(i.labels&&i.labels.length)||i.closest('label'))).length,
    small:foc.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44}).length,focusTotal:foc.length,
    headingSkips:(()=>{let last=0,sk=0;view.querySelectorAll('h1,h2,h3,h4').forEach(h=>{const l=+h.tagName[1];if(last&&l>last+1)sk++;last=l});return sk})(),
    liveRegions:view.querySelectorAll('[aria-live],[role=status],[role=alert]').length};
  // states
  out.states={empty:view.querySelectorAll('[class*=empty],[class*=Empty]').length,loading:view.querySelectorAll('[class*=skel],[class*=spinner],[aria-busy=true],[class*=loading]').length,denied:view.querySelectorAll('[class*=denied],[class*=locked]').length,error:view.querySelectorAll('[class*=error],[role=alert]').length,masked:view.querySelectorAll('[class*=mask],[class*=redact]').length};
  // size
  out.doc={w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,nodes:view.querySelectorAll('*').length,overflowX:document.documentElement.scrollWidth>innerWidth+1,viewLen:view.innerHTML.length};
  if(phone){ const rail=document.querySelector('.rail,#rail,nav.rail,aside.rail');const rr=rail?rail.getBoundingClientRect():null;
    out.phone={overflowX:out.doc.overflowX,scrollW:out.doc.w,h1Size:out.h1&&out.h1.size,heroH:out.heroBox.h,heroW:out.heroBox.w,
      cardMinW:regions.filter(r=>r.kind==='card').reduce((a,r)=>Math.min(a,r.w),9999),cardMaxRight:regions.reduce((a,r)=>Math.max(a,r.x+r.w),0),clipped:regions.filter(r=>r.x+r.w>innerWidth+2).length,
      stacked:regions.filter(r=>r.depth<=1&&r.kind==='card').length,gridCols:Math.max(0,...regions.map(r=>r.cols||0)),tables:out.tables.length,tablesScroll:out.tables.filter(t=>t.wide||t.x+t.w>innerWidth+2).length,
      small:out.a11y.small,tabbable:out.a11y.tabbable,railW:rr?Math.round(rr.width):null,railVisible:!!(rr&&rr.width>0&&rr.right>0&&rr.left>=0),bottomBar:!![...document.querySelectorAll('nav,div')].find(e=>{const cs=getComputedStyle(e);return cs.position==='fixed'&&e.getBoundingClientRect().bottom>=innerHeight-2&&e.getBoundingClientRect().height<110&&e.getBoundingClientRect().width>=innerWidth*0.9&&e.querySelectorAll('button,a').length>=3})}}
  return out;
}

// ---------- in-page: tab discovery ----------
function discoverTabs(){
  const view=document.querySelector('#view');const vis=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
  const sets=[];
  const cont=new Set();view.querySelectorAll('[role=tablist],.vsw,.tabs,.seg,.tabbar,[class*=tabs]').forEach(c=>{if(vis(c))cont.add(c)});
  let idx=0;
  cont.forEach(c=>{const items=[...c.querySelectorAll('[role=tab],label,button')].filter(vis).filter(e=>!e.querySelector('button'));
    if(items.length<2||items.length>14)return;
    sets.push(items.map(e=>{e.setAttribute('data-spec-tab',idx);const t=(e.getAttribute('aria-label')||e.textContent).trim().replace(/\s+/g,' ').slice(0,40);const r=e.getBoundingClientRect();return {sel:'[data-spec-tab="'+(idx++)+'"]',label:t,active:e.getAttribute('aria-selected')==='true'||e.classList.contains('on')||e.classList.contains('active')||!!(e.querySelector('input:checked')||(e.control&&e.control.checked)),w:Math.round(r.width),h:Math.round(r.height)}}))});
  return sets;
}
function headingsNow(){const view=document.querySelector('#view');return [...view.querySelectorAll('h2,h3,h4')].filter(h=>{const r=h.getBoundingClientRect();return r.width>0&&r.height>0}).slice(0,30).map(h=>h.textContent.trim().replace(/\s+/g,' ').slice(0,70))}


// ---------- in-page: click probe (before/after overlay diff) ----------
async function probeOne(lab){
  const OV='dialog,[role=dialog],aside,.drawer,.modal,.pop,.nx-pop,.nw-pop,[popover],.sheet,.inbx-panel,.inbx-focus,#drawer,.toast,[role=status],[role=alert]';
  const snap=()=>[...document.querySelectorAll(OV)].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>60&&r.height>30&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight&&cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0.05}).map(e=>e.tagName.toLowerCase()+'#'+(e.id||'')+'.'+String(e.className).split(' ')[0]);
  const v=document.querySelector('#view');
  const btn=[...v.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,50)===lab);
  if(!btn)return {found:false};
  const a=snap(),h0=location.hash,n0=v.innerHTML.length,ev0=(window.EVENTS&&EVENTS.log)?EVENTS.log.length:0,txt0=v.innerText.length;
  btn.click();await new Promise(r=>setTimeout(r,450));
  const added=snap().filter(x=>!a.includes(x));
  return {found:true,overlay:added.slice(0,3),drawer:added.some(x=>/drawer/.test(x)),dialog:added.some(x=>/^dialog|dialog/.test(x)||/modal|sheet/.test(x)),popover:added.some(x=>/pop/.test(x)),toast:added.some(x=>/toast|status|alert/.test(x)),hash:location.hash!==h0,viewChanged:Math.abs(document.querySelector('#view').innerHTML.length-n0)>40,events:((window.EVENTS&&EVENTS.log)?EVENTS.log.length:0)-ev0};
}


async function probeActions(p,id,buttons){
  const prim=buttons.filter(b=>/(^| )btn( |$)/.test(b.cls)&&!/quiet|danger/.test(b.cls)&&b.label&&b.label.length<32&&!b.disabled).sort((a,b)=>(b.primary?1:0)-(a.primary?1:0)).slice(0,3);const acts=[];
  for(const b of prim){try{await p.evaluate(i=>go(i),id);await p.waitForTimeout(350);const res=await p.evaluate(probeOne,b.label);acts.push({label:b.label,...res})}catch(e){acts.push({label:b.label,err:String(e.message).slice(0,60)})}}
  return acts;
}

// ---------- driver ----------
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const mk=async(w,h)=>{const ctx=await browser.newContext({viewport:{width:w,height:h},colorScheme:'dark'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));await p.route(/^https?:/,r=>r.abort());
    await p.goto('file://'+BUILD+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(3500);await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));return p};
  const errs=[];const t0=Date.now();
  if(actionsOnly){const reg=JSON.parse(fs.readFileSync(OUT,'utf8'));const p=await mk(1440,900);let n=0;
    for(const id of (only||reg.screens.map(s=>s.id))){const rec=reg.measure[id];if(!rec||!rec.d)continue;try{rec.actions=await probeActions(p,id,rec.d.buttons||[])}catch(e){rec.actions=[]}n++;if(n%20===0){console.log('actions',n);fs.writeFileSync(OUT,JSON.stringify(reg))}}
    fs.writeFileSync(OUT,JSON.stringify(reg));console.log('actions done',n);await browser.close();return}
  let p=await mk(1440,900);
  const reg=await p.evaluate(gatherRegistry);reg.build=path.basename(BUILD);reg.extractedAt=new Date().toISOString().slice(0,10);
  console.log('registry: screens',reg.screens.length,'entities',reg.entities.length,'processes',reg.processes.length,'metrics',reg.metrics.length,'events',reg.events.length,'rules',reg.eventRules.length,'tokens',Object.keys(reg.tokens).length,'t',Date.now()-t0);
  reg.measure={};
  if(skipScreens&&fs.existsSync(OUT)){try{reg.measure=JSON.parse(fs.readFileSync(OUT,'utf8')).measure||{}}catch(e){}}
  if(!skipScreens){
    const ids=only||reg.screens.map(s=>s.id);let n=0;
    for(const id of ids){
      const rec={};
      try{
        const tg=Date.now();
        await p.evaluate(i=>{window.__t0=performance.now();go(i)},id);await p.waitForTimeout(450);
        rec.goMs=await p.evaluate(()=>Math.round(performance.now()-window.__t0));
        rec.d=await p.evaluate(measureScreen,{phone:false});
        // tabs
        const tabsets=await p.evaluate(discoverTabs);rec.tabs=[];
        rec.defaultHeadings=await p.evaluate(headingsNow);
        for(const set of tabsets.slice(0,2)){const ts={items:[],sections:{}};
          for(const it of set.slice(0,9)){ts.items.push({label:it.label,active:it.active,w:it.w,h:it.h});
            if(!it.active){try{await p.click(it.sel,{timeout:1500,force:true});await p.waitForTimeout(220);ts.sections[it.label]=await p.evaluate(headingsNow)}catch(e){}}
            else ts.sections[it.label]=rec.defaultHeadings}
          rec.tabs.push(ts);
          await p.evaluate(i=>go(i),id);await p.waitForTimeout(350);
          if(tabsets.length>1)await p.evaluate(discoverTabs)}
        // primary action probes (max 3)
        rec.actions=await probeActions(p,id,rec.d.buttons||[]);
      }catch(e){rec.err=String(e.message).slice(0,200)}
      reg.measure[id]=rec;n++;if(n%20===0)console.log('desktop',n,'/',ids.length,Math.round((Date.now()-t0)/1000)+'s');
    }
    await p.context().close();
    // phone
    const pp=await mk(400,820);let m=0;
    for(const id of ids){try{await pp.evaluate(i=>go(i),id);await pp.waitForTimeout(350);reg.measure[id].phone=(await pp.evaluate(measureScreen,{phone:true})).phone||null}catch(e){reg.measure[id].phoneErr=String(e.message).slice(0,100)}m++;if(m%40===0)console.log('phone',m,'/',ids.length)}
    await pp.context().close();
  }
  {const p2=await mk(1440,900);for(const id of (only||reg.screens.map(s=>s.id)).slice(0,0)){}
    // registries grow lazily as screens are visited; the page 'p' was closed, so re-gather on a fresh page after visiting every screen once
    for(const id of (only||reg.screens.map(s=>s.id))){await p2.evaluate(i=>{try{go(i)}catch(e){}},id).catch(()=>{});await p2.waitForTimeout(60)}
    const reg2=await p2.evaluate(gatherRegistry);for(const k of Object.keys(reg2))if(!['tokens','themeMeta'].includes(k))reg[k]=reg2[k];
    console.log('regather: processes',reg.processes.length,'entities',reg.entities.length,'metrics',reg.metrics.length);await p2.context().close()}
  reg.errors=errs.slice(0,20);
  fs.writeFileSync(OUT,JSON.stringify(reg));
  console.log('wrote',OUT,Math.round(fs.statSync(OUT).size/1024)+'KB','in',Math.round((Date.now()-t0)/1000)+'s','errors',errs.length);
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
