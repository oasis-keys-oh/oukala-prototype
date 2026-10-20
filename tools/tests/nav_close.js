// PH-11 close-control audit. Opens every registered screen, then on each one the first drawer, the first popover and the first
// "new / add / create" form it can reach from a standard set of buttons, plus every panel the top bar and rail open (chat,
// VibeCheck, inbox, favorites, history, search, tenant, profile, tour). For each open container it finds the close or minimize
// control and measures it against the container's top-right corner (PH-10: close sits top right, never over content).
// Outliers are grouped by container signature and reason. The run fails only on outliers that are not in the recorded baseline
// (tools/tests/nav_close_baseline.json), so fixed ones can be removed from the baseline and new ones cannot drift in.
// Usage: node tools/tests/nav_close.js <dir containing full.html> [--update]   (--update rewrites the baseline and
//        docs/inventory/close-controls.md from this run)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const ROOT=path.resolve(__dirname,'../..');const BASE=path.join(__dirname,'nav_close_baseline.json');const DOC=path.join(ROOT,'docs/inventory/close-controls.md');
const TOL=80; // px: the control's right edge and top edge must sit within this distance of the container's top-right corner
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const update=process.argv.includes('--update');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});const errs=[];
async function page(){const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,200)));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(700);
 await p.evaluate(TOLp=>{
  const vis=e=>{if(!e||!e.isConnected)return false;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return false;const cs=getComputedStyle(e);return cs.visibility!=='hidden'&&cs.display!=='none'&&+cs.opacity>0.05};
  const DYN=/^(glass|open|show|shown|active|on|in|is-.*|has-.*|dfull|r20-ico|urgent|cx-open|anim.*|fade.*)$/;
  window.__ccSig=c=>{if(c.id&&!/^p\d+$|^v-|\d{3,}/.test(c.id))return '#'+c.id;const cl=[...c.classList].filter(x=>!DYN.test(x)).slice(0,3);
   return (c.hasAttribute('popover')?'[popover]':c.tagName.toLowerCase())+(cl.length?'.'+cl.join('.'):'')+(c.getAttribute('role')?'[role='+c.getAttribute('role')+']':'')};
  const isClose=x=>{const t=(x.textContent||'').replace(/\s+/g,' ').trim();const a=((x.getAttribute('aria-label')||'')+' '+(x.title||'')).trim();
   return x.getAttribute('popovertargetaction')==='hide'||/^(close|×|✕|✖|x|esc|done|minimi[sz]e|hide|dismiss|close panel)$/i.test(t)||/^(close|dismiss|minimi[sz]e|hide)\b/i.test(a)||/(^|\s)(closebtn|close|dclose|x-close)(\s|$)|[-_]close(\s|$)/i.test(String(x.className))};
  const box=c=>{let r=c.getBoundingClientRect();if(r.width>=innerWidth*0.9&&r.height>=innerHeight*0.9){const k=[...c.children].filter(vis).sort((a,b2)=>{const A=a.getBoundingClientRect(),B=b2.getBoundingClientRect();return B.width*B.height-A.width*A.height})[0];if(k)return k.getBoundingClientRect()}return r};
  const exempt=c=>/^(tooltip|menu|listbox|status|alert)$/.test(c.getAttribute('role')||'')||c.id==='fhov';
  window.__ccFind=fixedToo=>{const cs=new Set();
   document.querySelectorAll('[popover]').forEach(p=>{try{if(p.matches(':popover-open')&&vis(p))cs.add(p)}catch(e){}});
   document.querySelectorAll('dialog[open],[role=dialog],[aria-modal=true]').forEach(d=>{if(vis(d))cs.add(d)});
   if(fixedToo)document.querySelectorAll('body *').forEach(e=>{if(cs.has(e)||e.closest('#view,#nav,#drawer'))return;const s=getComputedStyle(e);if(s.position!=='fixed'||!vis(e))return;const r=e.getBoundingClientRect();
    if(r.width<200||r.height<80||r.width>=innerWidth*0.98)return;if([...cs].some(c=>c.contains(e)||e.contains(c)))return;if([...e.querySelectorAll('button,[role=button],label')].some(x=>vis(x)&&isClose(x)))cs.add(e)});
   return [...cs].filter(c=>!exempt(c)&&![...cs].some(o=>o!==c&&o.contains(c)&&!c.hasAttribute('popover')))};
  window.__ccMeasure=(c)=>{const r=box(c);if(r.width<140||r.height<80)return null;
   const ctl=[...c.querySelectorAll('button,[role=button],a,label,summary')].filter(x=>vis(x)&&isClose(x)).map(x=>{const q=x.getBoundingClientRect();return{x,dx:Math.round(r.right-q.right),dy:Math.round(q.top-r.top),txt:((x.getAttribute('aria-label')||x.textContent||'').trim()).slice(0,24)}}).sort((a,b2)=>(Math.abs(a.dx)+Math.abs(a.dy))-(Math.abs(b2.dx)+Math.abs(b2.dy)))[0];
   const sig=window.__ccSig(c);
   if(!ctl)return{sig,reason:'no close control',w:Math.round(r.width),h:Math.round(r.height)};
   const ok=ctl.dx>=-8&&ctl.dx<=TOLp&&ctl.dy>=-8&&ctl.dy<=TOLp;return{sig,reason:ok?null:'close not top right',dx:ctl.dx,dy:ctl.dy,ctl:ctl.txt,w:Math.round(r.width),h:Math.round(r.height)}};
  window.__ccAudit=fixedToo=>window.__ccFind(fixedToo).map(window.__ccMeasure).filter(Boolean);
  window.__ccCloseAll=()=>{document.querySelectorAll('[popover]').forEach(p=>{try{if(p.matches(':popover-open'))p.hidePopover()}catch(e){}});try{closeDrawer()}catch(e){}
   document.querySelectorAll('dialog[open]').forEach(d=>{try{d.close()}catch(e){}});try{NAVX.palette.close()}catch(e){}};
 },TOL);return p}
const found=new Map();let measured=0;
const seen={};const note=(list,where)=>{list.forEach(m=>{measured++;const sk=m.sig+(m.reason?' X':' ok');seen[sk]=(seen[sk]||0)+1;if(!m.reason)return;const key=m.sig+' | '+m.reason;const f=found.get(key)||{key,sig:m.sig,reason:m.reason,n:0,where:[],sample:m};f.n++;if(f.where.length<4&&!f.where.includes(where))f.where.push(where);found.set(key,f)})};
// 1. every registered screen: first drawer, first popover, first "new / add" form
const p=await page();const ids=(await p.evaluate(()=>SCREENS.map(s=>s[0]))).slice(0,+process.env.CC_LIMIT||1e9);
for(const id of ids){await p.evaluate(()=>window.__ccCloseAll());await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(90);
 note(await p.evaluate(()=>window.__ccAudit(false)),id+' (on open)');
 const tries=[
  ['drawer',()=>{const v=document.getElementById('view');const c=v.querySelector('[data-rec],[data-scm-open],[data-open],[data-detail]')||[...v.querySelectorAll('button')].find(b=>/^(details|open|view|review|open details)$/i.test((b.textContent||'').trim())&&!b.closest('[data-nav],[data-go]')&&!b.hasAttribute('data-nav')&&!b.hasAttribute('data-go'));if(!c)return false;c.click();return true}],
  ['popover',()=>{const c=[...document.querySelectorAll('#view [popovertarget]')].find(b=>b.getAttribute('popovertarget')!=='drawer'&&!b.getAttribute('popovertargetaction'));if(!c)return false;c.click();return true}],
  ['metric popover',()=>{const c=document.querySelector('#view .fchip[popovertarget]');if(!c)return false;c.click();return true}],
  ['AI popover',()=>{const c=document.querySelector('#view .aichip[popovertarget]');if(!c)return false;c.click();return true}],
  ['form',()=>{const c=[...document.querySelectorAll('#view button')].find(b=>/^(new|add|create|request|log|raise)\b/i.test((b.textContent||'').trim())&&!b.hasAttribute('data-nav')&&!b.hasAttribute('data-go')&&!b.hasAttribute('popovertarget'));if(!c)return false;c.click();return true}]];
 for(const [kind,fn] of tries){const did=await p.evaluate(`(${fn.toString()})()`).catch(()=>false);if(!did)continue;await p.waitForTimeout(160);
  note(await p.evaluate(()=>window.__ccAudit(false)),id+' ('+kind+')');await p.evaluate(()=>window.__ccCloseAll());
  if(await p.evaluate(i=>S.screen!==i,id))await p.evaluate(i=>{try{go(i)}catch(e){}},id)}}
await p.close();
// 2. panels opened from the top bar and the rail, each on a fresh page
const OPEN=[['chat (Ask)','#chxOrb'],['VibeCheck','#stuPill'],['tenant','#tnBtn'],['profile','.whoami'],['new','#nwBtn'],['view as','#r15dVasBtn'],['agents working','.live'],['inbox','#inbxBell'],['favorites','#nxFavBtn'],['history','#nxHistBtn'],['tour','#r20Pi'],['search','[data-nx-search],#q'],
 ['rail flyout (Full menu, collapsed rail)','!(async()=>{PREF.nav="full";const c=document.getElementById("railCollapse");c.checked=true;c.dispatchEvent(new Event("change"));await new Promise(r=>setTimeout(r,350));renderNav();const g=document.querySelector("#nav [data-nx-grp]");if(!g)return false;g.click();return true})()']];
for(const [name,sel] of OPEN){const q=await page();const ok=sel[0]==='!'?await q.evaluate(sel.slice(1)):await q.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.click();if(e.id==='q')try{NAVX.openPalette({})}catch(x){}return true},sel);
 if(ok){await q.waitForTimeout(450);note(await q.evaluate(()=>window.__ccAudit(true)),'top bar: '+name)}else console.log('note: opener not found',name,sel);await q.close()}
if(process.env.CC_DEBUG)console.log(JSON.stringify(seen,null,1));
const list=[...found.values()].sort((a,b2)=>a.key.localeCompare(b2.key));
const base=fs.existsSync(BASE)?JSON.parse(fs.readFileSync(BASE,'utf8')):{outliers:[]};const known=new Set(base.outliers.map(o=>o.key));
const fresh=list.filter(o=>!known.has(o.key)),gone=base.outliers.filter(o=>!found.has(o.key));
console.log('screens',ids.length,'| containers measured',measured,'| outlier groups',list.length,'| new',fresh.length,'| baseline groups no longer seen',gone.length,'| page errors (not failed here)',errs.length);
fresh.forEach(o=>console.log('NEW',o.key,'| e.g.',o.where.join(', '),'|',JSON.stringify(o.sample)));
gone.forEach(o=>console.log('fixed or not reached (remove from baseline):',o.key));
if(update){const today=new Date().toISOString().slice(0,10);
 fs.writeFileSync(BASE,JSON.stringify({about:'PH-11 close-control outliers accepted on '+today+' (tools/tests/nav_close.js --update). New outliers fail the test; remove an entry once it is fixed.',outliers:list.map(o=>({key:o.key,where:o.where,dx:o.sample.dx==null?null:o.sample.dx,dy:o.sample.dy==null?null:o.sample.dy,control:o.sample.ctl||null}))},null,1)+'\n');
 console.log('baseline written',BASE,list.length,'groups')}
await b.close();process.exit(fresh.length?1:0)})();
