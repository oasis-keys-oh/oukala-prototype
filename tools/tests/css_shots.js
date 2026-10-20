// CSS stream (wave 3): screenshot comparison for CSS-only refactors. Prototype fact: pixels measured on this machine.
// Capture: node tools/tests/css_shots.js capture build_out tools/scratch/out_css_shots/<tag>
// Compare: node tools/tests/css_shots.js compare <before> <after> [--max 0.5] [--noise <before2>]...
// --noise: a second capture of the same build; pixels that differ between before and before2 (timers, live counters) are masked (3 px margin).
// Captures a fixed set of representative screens in light, dark and at 400 px (light). Animations and transitions are frozen.
// Compare reports, per shot, the share of pixels whose largest channel difference exceeds 24 (of 255); a size change counts every
// pixel outside the overlap as different. Exit code 1 only when --max is given and a shot exceeds it.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const SCREENS=['home','trace','fo','tower','metrics','exe_dash','exe_risk','flw_design','flw_bpmn','inbox','itom_cmdb','itsm_inc','itsm_home',
 'kcs_home','meet_hub','org_chart','ppl_jrny','plat_map','plat_data','plat_proc','draw_studio','bud_over','adm_studio','svc_cat','svc_portal',
 'guard','showroom','r18_lens','studio','scr_map','chat_home','grc_home','r16h_groups','agile_board','r17q_value'];
const MODES=[{k:'light',vp:{width:1440,height:900},cs:'light'},{k:'dark',vp:{width:1440,height:900},cs:'dark'},{k:'w400',vp:{width:400,height:820},cs:'light'}];
const FREEZE='*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important;caret-color:transparent!important}html body #toasts,html body #toasts *{display:none!important;visibility:hidden!important}';
const MAXH=2400;
async function capture(dir,out){fs.mkdirSync(out,{recursive:true});const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const only=process.env.SHOTS?process.env.SHOTS.split(','):null;
 for(const m of MODES){const c=await b.newContext({viewport:m.vp,colorScheme:m.cs,reducedMotion:'reduce'});const p=await c.newPage();
  await p.route(/^https?:/,r=>r.abort());
  await p.addInitScript(()=>{Math.random=(()=>{let s=42;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}})()});
  await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});
  await p.addStyleTag({content:FREEZE});await p.waitForTimeout(900);
  for(const id of SCREENS){if(only&&!only.includes(id))continue;
   await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(500);
   await p.evaluate(()=>{scrollTo(0,0);const a=document.activeElement;if(a&&a.blur)a.blur()});await p.mouse.move(0,0);await p.waitForTimeout(150);
   const h=Math.min(MAXH,await p.evaluate(()=>document.documentElement.scrollHeight));
   for(let t=0;t<3;t++){try{await p.screenshot({path:path.join(out,m.k+'__'+id+'.png'),fullPage:true,timeout:60000,clip:{x:0,y:0,width:m.vp.width,height:Math.max(m.vp.height,h)}});break}catch(e){console.log('retry',m.k,id,e.message.split('\n')[0]);await p.waitForTimeout(1000)}}}
  await c.close();}
 await b.close();console.log('captured',fs.readdirSync(out).length,'shots to',out)}
async function compare(a,bdir,max,noise){const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await b.newPage();
 const files=fs.readdirSync(a).filter(f=>f.endsWith('.png')).sort();const rows=[];let worst=0;
 const rd=(d,f)=>fs.existsSync(path.join(d,f))?fs.readFileSync(path.join(d,f)).toString('base64'):null;
 for(const f of files){const A=rd(a,f),B=rd(bdir,f);if(!B){rows.push([f,'missing']);continue}
  if(A===B){rows.push([f,0]);continue}
  const N=noise.map(d=>rd(d,f)).filter(x=>x&&x!==A);
  const r=await p.evaluate(async([A,B,N])=>{const ld=s=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.src='data:image/png;base64,'+s});
   const ia=await ld(A),ib=await ld(B),ins=[];for(const s of N)ins.push(await ld(s));const W=Math.max(ia.width,ib.width),H=Math.max(ia.height,ib.height);
   const px=i=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(i,0,0);return x.getImageData(0,0,W,H).data};
   const T=24,dif=(u,v,o)=>Math.abs(u[o]-v[o])>T||Math.abs(u[o+1]-v[o+1])>T||Math.abs(u[o+2]-v[o+2])>T;
   const da=px(ia),db=px(ib);const mask=new Uint8Array(W*H);
   for(const ni of ins){const dn=px(ni);for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(dif(da,dn,(y*W+x)*4)){for(let yy=Math.max(0,y-3);yy<=Math.min(H-1,y+3);yy++)for(let xx=Math.max(0,x-3);xx<=Math.min(W-1,x+3);xx++)mask[yy*W+xx]=1}}}
   let n=0,m=0;const mw=Math.min(ia.width,ib.width),mh=Math.min(ia.height,ib.height);let x0=1e9,y0=1e9,x1=-1,y1=-1;
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;if(mask[k]){m++;continue}
    if(x>=mw||y>=mh||dif(da,db,k*4)){n++;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y}}
   return {pct:100*n/(W*H),masked:+(100*m/(W*H)).toFixed(2),size:ia.width+'x'+ia.height+(ia.height!==ib.height||ia.width!==ib.width?' -> '+ib.width+'x'+ib.height:''),box:x1<0?'':x0+','+y0+'-'+x1+','+y1}},[A,B,N]);
  rows.push([f,+r.pct.toFixed(3),r.size,'box '+r.box,'noise-masked '+r.masked+'%']);worst=Math.max(worst,r.pct)}
 await b.close();
 const changed=rows.filter(r=>r[1]!==0);console.log('shots',rows.length,'identical',rows.length-changed.length,'changed',changed.length,'worst %',worst.toFixed(3));
 for(const r of changed.sort((x,y)=>(y[1]||0)-(x[1]||0)))if(r[1]==='missing'||r[1]>=0.001)console.log('  ',r.join('  '));
 if(max!=null&&worst>max)process.exit(1)}
(async()=>{const [cmd,x,y]=process.argv.slice(2);const mi=process.argv.indexOf('--max');const max=mi>0?+process.argv[mi+1]:null;
 if(cmd==='capture')await capture(x||'build_out',y||'tools/scratch/out_css_shots/now');
 else if(cmd==='compare'){const noise=[];process.argv.forEach((v,k)=>{if(v==='--noise')noise.push(process.argv[k+1])});await compare(x,y,max,noise)}
 else{console.log('usage: capture <build dir> <out dir> | compare <dir a> <dir b> [--max pct] [--noise <second capture of a>]...');process.exit(2)}})();
