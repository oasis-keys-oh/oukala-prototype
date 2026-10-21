// PR-31: walk each persona's tasks in light, dark and 400 px; collect accessibility and copy signals.
// Usage: node tools/scratch/ux/walk.js [persona ...]
const {open}=require('./lib');const fs=require('fs');const path=require('path');
const SHOTS=path.join(__dirname,'shots');
const PLAN={
 emp:{label:'employee',screens:['home','svc_portal','kcs_ask','flw_appr','r18_builds','ppl_train']},
 newhire:{label:'new-hire',screens:['home','r15d_firstweek','svc_portal','kcs_ask','ppl_train']},
 guest:{label:'vendor-guest',screens:['home','svc_portal','kcs_ask','inv','scr_map']},
 pm:{label:'contributor-pm',screens:['home','r18_builds','flw_appr','ppm_proj']},
 ops:{label:'dept-head-ops',screens:['home','r18_builds','itsm_inc','org_chart']},
 arch:{label:'architect',screens:['home','scr_map','flw_design','plat_reg','plat_contract','plat_retrofit','r18_builds','plat_map']},
 admin:{label:'platform-admin',screens:['home','tn_admin','r16g_perm','adm_studio','plat_reg','scr_map','showroom','plat_gate']}};
const MEASURE=()=>{const v=document.querySelector('#view');const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const name=e=>(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')&&document.getElementById(e.getAttribute('aria-labelledby'))?.textContent||e.textContent||e.title||e.value||e.querySelector('img')?.alt||'').trim();
 const ctl=[...document.querySelectorAll('button,a[href],[role=button],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(vis);
 const unnamed=ctl.filter(e=>!/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)&&!name(e)).map(e=>e.outerHTML.slice(0,140));
 const inputs=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis).filter(e=>{const id=e.id;return !(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.closest('label')||(id&&document.querySelector('label[for="'+CSS.escape(id)+'"]'))||e.title)}).map(e=>e.outerHTML.slice(0,140));
 const clickDivs=[...v.querySelectorAll('div[onclick],span[onclick],div[data-go],span[data-go],tr[data-go],div[data-open],li[data-go]')].filter(vis).filter(e=>!e.hasAttribute('tabindex')&&!e.getAttribute('role')).map(e=>e.outerHTML.slice(0,120));
 const small=ctl.filter(e=>{const r=e.getBoundingClientRect();return (r.width<24||r.height<24)&&e.tagName!=='A'}).map(e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)+' '+(name(e)||e.outerHTML).slice(0,50)});
 const imgs=[...document.querySelectorAll('img')].filter(vis).filter(i=>!i.hasAttribute('alt')).map(i=>i.src.slice(-50));
 // contrast on text leaf nodes in view
 const lum=c=>{let m=c.match(/[\d.]+/g);if(!m)return null;if(/^color\(/.test(c))m=m.map((x,i)=>i<3?x*255:x);const a=m.length>3?+m[3]:1;const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return {L:.2126*f(+m[0])+.7152*f(+m[1])+.0722*f(+m[2]),a}};
 const bgOf=e=>{while(e){const s=getComputedStyle(e);if(s.backgroundImage!=='none'&&!/^url/.test(s.backgroundImage))return 'grad';const c=s.backgroundColor;const l=lum(c);if(l&&l.a>.85)return c;e=e.parentElement}return getComputedStyle(document.body).backgroundColor};
 const low=[];let checked=0;
 [...v.querySelectorAll('*')].filter(e=>vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>2)).slice(0,900).forEach(e=>{const s=getComputedStyle(e);const bg=bgOf(e);if(bg==='grad')return;const f=lum(s.color),g=lum(bg);if(!f||!g)return;checked++;
  const L1=Math.max(f.L,g.L),L2=Math.min(f.L,g.L);const cr=(L1+.05)/(L2+.05);const big=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&+s.fontWeight>=700);const need=big?3:4.5;
  if(f.a<1? cr*f.a<need : cr<need)low.push(cr.toFixed(2)+' '+s.fontSize+' '+s.color+' on '+bg+' "'+e.textContent.trim().slice(0,40)+'"')});
 const txt=v.innerText;
 return {h1:[...document.querySelectorAll('h1')].filter(vis).map(h=>h.textContent.trim().slice(0,60)),
  heroTitle:(v.querySelector('h1,h2')||{}).textContent?.trim().slice(0,80),
  headingJumps:(()=>{let last=0,j=[];v.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h=>{const n=+h.tagName[1];if(last&&n>last+1)j.push(h.tagName+' after h'+last+': '+h.textContent.trim().slice(0,30));last=n});return j.slice(0,5)})(),
  ox:document.documentElement.scrollWidth-innerWidth,viewOx:[...v.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+2&&vis(e)&&!e.closest('.tscroll,[style*=overflow],.vsw,table')}).slice(0,4).map(e=>e.tagName+'.'+String(e.className).slice(0,40)+' r='+Math.round(e.getBoundingClientRect().right)),
  ctl:ctl.length,unnamed:unnamed.slice(0,6),unnamedN:unnamed.length,inputsNoLabel:inputs.slice(0,6),inputsNoLabelN:inputs.length,clickDivs:clickDivs.slice(0,4),clickDivsN:clickDivs.length,small:small.slice(0,8),smallN:small.length,imgsNoAlt:imgs,
  contrastChecked:checked,lowContrastN:low.length,lowContrast:low.slice(0,8),
  emdash:(txt.match(/[^\n]{0,30}—[^\n]{0,30}/g)||[]).slice(0,4),
  banned:(txt.match(/\b(Fabric Enterprise|Fabric|Trellis|Oukala|Shaheen|SOC 2|Automatic)\b[^\n]{0,40}/g)||[]).slice(0,6),
  casey:(txt.match(/[^\n]{0,40}Casey[^\n]{0,40}/g)||[]).slice(0,3),
  words:txt.split(/\s+/).length,buttons:[...v.querySelectorAll('button')].filter(vis).length,
  denied:/do not have access|not allowed|denied|no access/i.test(txt)?txt.slice(0,300):'',
  start:txt.slice(0,600)}};
(async()=>{const want=process.argv.slice(2);const keys=want.length?want:Object.keys(PLAN);const out={};
for(const k of keys){const P=PLAN[k];const dir=path.join(SHOTS,P.label);fs.mkdirSync(dir,{recursive:true});out[k]={};
 for(const mode of ['light','dark','phone']){const {b,p}=await open({persona:k,dark:mode==='dark',vp:mode==='phone'?{width:400,height:860}:{width:1440,height:900}});
  if(mode==='light'){out[k]._user=await p.evaluate(()=>{try{return JXR.purview()}catch(e){return e.message}});}
  for(const id of P.screens){await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,0));
   await p.screenshot({path:path.join(dir,id+'-'+mode+'.jpg'),type:'jpeg',quality:45});
   const m=await p.evaluate(MEASURE);m.errs=p.errs.splice(0);out[k][id+'|'+mode]=m}
  await b.close()}}
fs.writeFileSync(path.join(__dirname,'walk-'+(want.join('-')||'all')+'.json'),JSON.stringify(out,null,1));console.log('done',keys)})();
