const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const sizes=[[1000,700],[1280,720],[1440,800],[1920,1080],[400,820]];const errs=[];
for(const [w,h] of sizes)for(const insp of [0,1])for(const full of [0,1]){
 const c=await b.newContext({viewport:{width:w,height:h}});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
 await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
 await p.evaluate(()=>{SCALE.set(true);S.v.cov=0;go&&go('plat_data')}).catch(()=>{});await p.waitForTimeout(700);
 await p.evaluate(i=>{S.atlas.tab=0;if(i){ATLAS&&document.querySelector('[data-at-ent]')&&document.querySelector('[data-at-ent]').click()}},insp);await p.waitForTimeout(500);
 if(full){await p.evaluate(()=>document.querySelector('[data-at-full]').click());await p.waitForTimeout(500)}
 else{await p.evaluate(()=>{const v=document.querySelector('.at-vpbox');v&&v.scrollIntoView({block:'start'})});await p.waitForTimeout(300)}
 const r=await p.evaluate(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right),h:Math.round(r.height)}};
 return {vp:q('.at-vp'),tools:q('.at-tools'),mm:q('.at-mm'),bar:q('.at-bar'),insp:q('.at-insp:not([hidden])'),full:q('[data-at-full]'),relsel:q('[data-at-refs]'),leg:q('.at-lgd summary'),iw:innerWidth,ih:innerHeight}});
 const bad=[];for(const sel of ['[data-at-z=in]','[data-at-z=out]','[data-at-z=fit]','[data-at-collapse]','[data-at-full]','[data-at-refs]','[data-at-ov]','.at-lgd summary','[data-at-q]']){const hit=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return 'missing';const r=e.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;if(y<0||y>innerHeight||x<0||x>innerWidth)return 'offscreen';const t=document.elementFromPoint(x,y);return t&&(e===t||e.contains(t)||t.contains(e))?'ok':'covered by '+(t&&t.className&&String(t.className).slice(0,30))},sel);if(hit!=='ok')bad.push(sel+' '+hit)}for(const k of ['tools','mm','bar','full','relsel','leg']){const x=r[k];if(!x){if(k!=='mm'||w>640)bad.push(k+':missing');continue}if(x.t<0||x.b>r.ih||x.l<0||x.r>r.iw)bad.push(k+JSON.stringify(x))}
 if(r.insp&&(r.insp.b>r.ih+1||r.insp.t<0))bad.push('insp'+JSON.stringify(r.insp));
 console.log(w+'x'+h,'insp',insp,'full',full,'vpH',r.vp&&r.vp.h,bad.length?'BAD '+bad.join(' '):'ok');
 if(process.argv[3]==='shots')await p.screenshot({path:dir+`/shots/r11_${w}_${insp}_${full}.png`});
 await c.close()}
console.log('errs',errs.slice(0,5));await b.close()})();
