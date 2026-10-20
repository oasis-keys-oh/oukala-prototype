const {chromium}=require('playwright');const path=require('path');
const W=+process.argv[2]||1440,dark=process.argv[3]==='dark',only=process.argv[4]||'';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--hide-scrollbars']});
const c=await b.newContext({viewport:{width:W,height:W<500?820:900},colorScheme:dark?'dark':'light',hasTouch:W<500});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
if(dark)await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark');document.body.setAttribute('data-theme','dark')});
const tag=(dark?'d':'l')+W;
const st=async()=>p.evaluate(()=>{const o={};document.querySelectorAll('.zs-host').forEach((h,i)=>{const H=h._zs;if(!H)return;const v=H.ad.getView();o[i+':'+H.opt.name]={x:Math.round(v.x),y:Math.round(v.y),k:H.ad.getZoom?+H.ad.getZoom().toFixed(2):null,tx:getComputedStyle(h.querySelector('[data-zs-thumb=x]')).left,ty:getComputedStyle(h.querySelector('[data-zs-thumb=y]')).top}});return o});
async function dragThumb(sel,ax,d){const th=p.locator(sel+' [data-zs-thumb='+ax+']').first();if(!(await th.isVisible())){return false}const bb=await th.boundingBox();const x=bb.x+bb.width/2,y=bb.y+bb.height/2;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(ax==='x'?x+d:x,ax==='y'?y+d:y,{steps:6});await p.mouse.up();await p.waitForTimeout(250);return true}
async function check(name,setup,hostSel0,shot){
 if(only&&only!==name)return;
 await p.evaluate(setup);await p.waitForTimeout(1500);
 await p.evaluate(sel=>{document.querySelectorAll('[data-zt]').forEach(e=>e.removeAttribute('data-zt'));const h=[...document.querySelectorAll(sel)].find(e=>e.getBoundingClientRect().width>50);if(h)h.setAttribute('data-zt','1')},hostSel0);const hostSel='[data-zt="1"]';
 const n=await p.locator(hostSel+' .zs-root').count();ok(n>=1,name+': sliders attached');if(!n)return;
 await p.locator(hostSel).first().scrollIntoViewIfNeeded();await p.evaluate(sel=>{const r=document.querySelector(sel).getBoundingClientRect();const lim=innerHeight-(innerWidth<500?150:20);if(r.bottom>lim)window.scrollBy(0,r.bottom-lim)},hostSel);await p.waitForTimeout(250);
 const q=()=>p.evaluate(sel=>{const h=document.querySelector(sel);const H=h._zs,v=H.ad.getView();return{x:v.x,y:v.y,k:H.ad.getZoom?H.ad.getZoom():null,tx:parseFloat(h.querySelector('[data-zs-thumb=x]').style.left||0),ty:parseFloat(h.querySelector('[data-zs-thumb=y]').style.top||0),vis:{x:h.querySelector('[data-zs-thumb=x]').style.display!=='none',y:h.querySelector('[data-zs-thumb=y]').style.display!=='none'&&h.querySelector('.zs-v').offsetParent!==null},aria:h.querySelector('[data-zs-thumb=x]').getAttribute('aria-valuenow')}},hostSel);
 let s0=await q();console.log(name,JSON.stringify(s0));
 // zoom in first so both thumbs can move
 const rng=p.locator(hostSel+' .zs-rng').first();
 if(await rng.count()&&await rng.isVisible()){const z0=s0.k;const bb=await rng.boundingBox();await p.mouse.click(bb.x+bb.width*0.9,bb.y+bb.height/2);await p.waitForTimeout(500);const s=await q();ok(s.k!==z0,name+': zoom slider changes zoom '+(z0&&z0.toFixed(2))+' -> '+(s.k&&s.k.toFixed(2)));
  await p.locator(hostSel+' [data-zs-z=out]').first().click();await p.waitForTimeout(300);const s2=await q();ok(s2.k<s.k,name+': zoom out button');}
 s0=await q();
 for(const ax of ['x','y']){ if(!s0.vis[ax]){console.log(name,ax,'thumb hidden (content fits)');continue}
  const before=await q();const did=await dragThumb(hostSel,ax,ax==='x'?-60:-40);const a1=await q();
  const did2=await dragThumb(hostSel,ax,ax==='x'?90:70);const a2=await q();
  ok(a2[ax]!==a1[ax]||a1[ax]!==before[ax],name+': drag '+ax+' thumb moves camera ('+before[ax].toFixed(0)+' -> '+a1[ax].toFixed(0)+' -> '+a2[ax].toFixed(0)+')');
  ok((ax==='x'?a2.tx!==a1.tx||a1.tx!==before.tx:a2.ty!==a1.ty||a1.ty!==before.ty),name+': thumb tracks camera');}
 // keyboard
 const th=p.locator(hostSel+' [data-zs-thumb=x]').first();if(await th.isVisible()){await th.focus();await p.keyboard.press('Home');await p.waitForTimeout(200);const b0=await q();await p.keyboard.press('ArrowRight');await p.keyboard.press('PageDown');await p.waitForTimeout(250);const b1=await q();ok(b1.x!==b0.x,name+': keyboard moves camera');await p.keyboard.press('End');await p.waitForTimeout(250);const b2=await q();ok(b2.x>=b1.x,name+': End');await p.keyboard.press('Home');await p.waitForTimeout(250);const b3=await q();ok(b3.x<b2.x,name+': Home')}
 await p.waitForTimeout(300);
 if(shot)await p.screenshot({path:`out_s14/zs_${name}_${tag}.png`});
}
const go=(f)=>f;
await check('org',()=>{S.org.mode='tree';S.org.k=0;S.org.tab='chart';go('org_chart')},'.org-wrap',true);
await check('modmap',()=>{S.v.mm_v=0;go('plat_map')},'[data-mm-vp]',true);
await check('atlas',()=>{S.v.atlas=0;go('plat_data')},'.at-vpbox',true);
await check('draw',()=>{DRAW.open('Slider test');const D=DRAW,d=D.ST.doc;let prev=D.addShape(d,'start',60,200);for(let i=0;i<9;i++){const s=D.addShape(d,'task',200+i*220,200+(i%3)*160,{n:'Step '+i});D.addConn(d,prev.id,s.id,'r','l');prev=s}D.ST.fit=true;D.paint();D.fit()},'.dr-canvas,.dr-ro-wrap',true);
await check('wfd',()=>{go('flw_design');FLOWX.open('wf_inv')},'.wfd-canvaswrap',true);
await check('graph',()=>{go('itom_graph')},'.itom-gc',true);
await check('swim',()=>{go('svc_guides');setTimeout(()=>{const b=document.querySelector('[data-og^="gstart|"]');if(b)b.click()},500)},'.zs-wrap',true);
console.log('errors',errs);console.log(fails?'FAILS '+fails:'ALL OK');await b.close()})();
