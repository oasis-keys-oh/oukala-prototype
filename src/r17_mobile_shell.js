// usage: NODE_PATH=$(npm root -g) node r17_mobile_shell.js <outdir> [width=390] [height=844]
// Assertions: (1) no horizontal page scroll on every screen, (2) shell tap targets >= 44px, (3) no shell element wider than the viewport.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]);const W=+process.argv[3]||390,H=+process.argv[4]||844;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true,deviceScaleFactor:3});
const p=await c.newPage();p.setDefaultTimeout(120000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.go&&document.querySelector('#view')&&document.querySelector('#view').children.length>0);await p.waitForTimeout(1500);
const SH='.topbar *,#r17o1Tab *,#r17o1Abar *,#r17o1Sheet *';
const shellCheck=()=>p.evaluate(sel=>{const vw=innerWidth,bad={tap:[],wide:[]};
 const vis=e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'};
 const sheetOpen=document.querySelector('#r17o1Sheet.is-open');
 document.querySelectorAll(sel).forEach(e=>{if(!vis(e))return;if(e.closest('#r17o1Sheet')&&!sheetOpen)return;const r=e.getBoundingClientRect();
  const nm=(e.tagName+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')+(e.id?'#'+e.id:'')).slice(0,60);
  if(r.right>vw+1||r.left<-1)bad.wide.push(nm+' '+Math.round(r.left)+'..'+Math.round(r.right));
  const ia=e.matches('button,a[href],[role=button],input:not([type=hidden]),select,textarea,summary,label.btn,[data-nav]');
  if(ia&&!e.closest('button,a')||ia&&e.matches('button,a')){ if(e.tagName==='INPUT'&&e.type==='checkbox'&&e.classList.contains('sr'))return; if(r.height<43.5||r.width<43.5)bad.tap.push(nm+' '+Math.round(r.width)+'x'+Math.round(r.height)+' "'+(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,24)+'"')}});
 return bad},SH);
const out={width:W,overflow:[],tap:{},wide:{}};
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));console.log(ids.length,'screens at',W);
for(const id of ids){await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(160);
 const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,bsw:document.body.scrollWidth}));
 const who=await p.evaluate(()=>{const iw=innerWidth,o=[];document.querySelectorAll('#view *').forEach(e=>{if(o.length>=4)return;const r=e.getBoundingClientRect();if(!r.width||r.right<=iw+1||e.closest('svg'))return;{const dd=e.closest('details:not([open])');if(dd&&!(e.tagName==='SUMMARY'&&e.parentElement===dd)&&!e.closest('summary'))return}const cs=getComputedStyle(e);if(cs.position==='fixed'||cs.visibility==='hidden'||cs.display==='none')return;let a=e,sc=false;while(a&&a.id!=='view'){const ox=getComputedStyle(a).overflowX;if(ox==='auto'||ox==='scroll'||ox==='hidden'||ox==='clip'){sc=true;break}a=a.parentElement}if(!sc)o.push(e.tagName+'.'+String(e.className&&e.className.baseVal===undefined?e.className:'').slice(0,40)+' right='+Math.round(r.right))});return o});
 if(Math.max(r.sw,r.bsw)>r.iw+1||who.length)out.overflow.push({id,scrollWidth:Math.max(r.sw,r.bsw),culprits:who})
 const s=await shellCheck();if(s.tap.length)out.tap[id]=s.tap;if(s.wide.length)out.wide[id]=s.wide}
/* open sheets: More, + New, drawer header */
for(const [name,fn] of [['more',()=>document.querySelector('[data-r17o1-more]').click()],['new',()=>document.querySelector('#nwBtn').click()]]){
 await p.evaluate(()=>go('home'));await p.evaluate(fn);await p.waitForTimeout(700);const s=await shellCheck();if(s.tap.length)out.tap['sheet:'+name]=s.tap;if(s.wide.length)out.wide['sheet:'+name]=s.wide;
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(ov)out.overflow.push({id:'sheet:'+name});
 await p.keyboard.press('Escape');await p.evaluate(()=>{const c=document.querySelector('.r17o1-x');if(c&&c.offsetParent)c.click()});await p.waitForTimeout(500)}
const uniq=a=>[...new Set(a)];
const tapAgg={};Object.values(out.tap).flat().forEach(t=>{const k=t.replace(/ "[^"]*"$/,'');tapAgg[k]=(tapAgg[k]||0)+1});
console.log('screens with horizontal page scroll:',out.overflow.length);out.overflow.forEach(o=>console.log('  OVERFLOW',o.id,o.scrollWidth||'',JSON.stringify(o.culprits||[])));
console.log('shell tap targets under 44px (unique):',Object.keys(tapAgg).length);Object.entries(tapAgg).forEach(([k,n])=>console.log('  TAP',k,'x'+n));
const wideAgg={};Object.values(out.wide).flat().forEach(t=>{wideAgg[t]=(wideAgg[t]||0)+1});
console.log('shell elements wider than viewport (unique):',Object.keys(wideAgg).length);Object.entries(wideAgg).forEach(([k,n])=>console.log('  WIDE',k,'x'+n));
console.log('page errors',errs.length,errs.slice(0,3));
fs.writeFileSync(`r17_shell_result_${W}.json`,JSON.stringify(out,null,1));await b.close()})();
