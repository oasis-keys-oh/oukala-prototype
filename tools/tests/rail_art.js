// BR-11 rail art: the gold falcon mark at the top of the rail, the falcon-style icon on every area and fixed item (no fallback
// glyphs), rail labels at 4.5:1 or better over the painted panel and its scrim (measured on the screen pixels behind each label,
// with every area open and the menu scrolled end to end), reduced effects and prefers-reduced-transparency show the plain navy
// surface, the collapsed rail uses the same icons, and light, dark and 400 px (the phone menu sheet: icons and overlap only) show no overlap.
// Usage: node tools/tests/rail_art.js <dir containing full.html>   (RAIL_ART_SHOTS=<dir> also saves light, dark and 400 px screenshots)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const dir=path.resolve(process.argv[2]||'build_out');const SHOTS=process.env.RAIL_ART_SHOTS||'';
const MIN=4.5;const AREAS=['strat','deliver','ops','money','people','risk','transform'];const FIXED=['home','my','ask','all','show','build'];
const fails=[];const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails.push(m)};
(async()=>{const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const errs=[];
async function open(theme,w){const ctx=await b.newContext({viewport:{width:w,height:900},colorScheme:theme});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push(theme+' '+w+': '+e.message.slice(0,200)));await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof go==='function'&&window.NAVX&&NAVX.persona&&document.querySelector('#nav .navi'),null,{timeout:120000});
 await p.evaluate(async t=>{document.documentElement.setAttribute('data-theme',t);try{EFFECTS.set('full')}catch(e){}try{SHOW.wedge.set(false)}catch(e){}PREF.nav='full';NAVX.persona.set('admin');go('home');await new Promise(r=>setTimeout(r,500));
  /* the element that scrolls the menu inside a root (#nav in the rail, the sheet body on a phone) */
  window.__rartScr=root=>{const b=document.querySelector(root);const c=[b,...b.querySelectorAll('*')].find(e=>{const o=getComputedStyle(e).overflowY;return (o==='auto'||o==='scroll')&&e.scrollHeight>e.clientHeight+2&&e.querySelector('details.nx-area')});return c||b}},theme);
 return {ctx,p}}
/* pixels of a screenshot, read back through a canvas in the page */
async function pixels(p,clip){const png=await p.screenshot({clip});return p.evaluate(async b64=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return {w:im.width,h:im.height,d:Array.from(x.getImageData(0,0,im.width,im.height).data)}},png.toString('base64'))}
const lum=(r,g,b)=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const ratio=(a,b)=>{const x=Math.max(a,b),y=Math.min(a,b);return (x+.05)/(y+.05)};
/* one view: every visible text node in the root, its color, and the lowest ratio against the pixels behind it (text hidden) */
async function measure(p,root){
 const T=await p.evaluate(root=>{const box=document.querySelector(root);const R=box.getBoundingClientRect();const out=[];const SC=window.__rartScr(root);const N=SC.getBoundingClientRect();
  const vis=e=>{const r=e.getBoundingClientRect();if(!(r.width>2&&r.height>2&&r.top>=Math.max(0,R.top)&&r.bottom<=Math.min(R.bottom,innerHeight)&&r.left>=0&&r.right<=innerWidth))return false;
   if(e.checkVisibility&&!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true,contentVisibilityAuto:true}))return false;
   let a=e;while(a&&a!==document.body){if(+getComputedStyle(a).opacity<.05)return false;a=a.parentElement}
   return SC===box||!SC.contains(e)||(r.top>=N.top-1&&r.bottom<=N.bottom+1)};
  const walk=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);let n;
  while((n=walk.nextNode())){const t=n.textContent.trim();if(!t)continue;const e=n.parentElement;if(!vis(e)||e.closest('svg,.badge,.nx-gc,.apx-nb,.avatar,input,[data-stu],.stu-pill'))continue;
   if(/vibe/i.test(e.closest('button')?e.closest('button').className+' '+e.closest('button').textContent:''))continue; /* VibeCheck sits on its own gradient pill, not on the panel */
   const rg=document.createRange();rg.selectNodeContents(n);const r=rg.getBoundingClientRect();if(r.width<3||r.height<3)continue;
   const m=getComputedStyle(e).color.match(/[\d.]+/g).map(Number);out.push({t:t.slice(0,32),x:r.left-Math.max(0,R.left),y:r.top-Math.max(0,R.top),w:r.width,h:r.height,c:m,el:String(e.className||e.tagName)})}
  return {R:{x:Math.max(0,R.left),y:Math.max(0,R.top),width:Math.min(R.width,innerWidth-Math.max(0,R.left)),height:Math.min(R.bottom,innerHeight)-Math.max(0,R.top)},T:out}},root);
 const st=await p.addStyleTag({content:root+','+root+' *{color:transparent!important;text-shadow:none!important;caret-color:transparent!important}'});await p.waitForTimeout(80);
 const png=await p.screenshot({clip:T.R});await st.evaluate(s=>s.remove());
 /* the ratio per label is worked out in the page (canvas pixels), so only the results come back. It is the 2nd percentile over the
    pixels behind the label: a status dot or star drawn inside the label box (2 percent of it or less) is not background */
 const rs=await p.evaluate(async([b64,L])=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,im.width,im.height).data,w=im.width,h=im.height;
  const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};const lum=(r,g,b)=>.2126*f(r)+.7152*f(g)+.0722*f(b);
  return L.map(t=>{const a=t.c[3]==null?1:t.c[3];const ks=[];
   for(let y=Math.max(0,Math.floor(t.y));y<Math.min(h,Math.ceil(t.y+t.h));y++)for(let xx=Math.max(0,Math.floor(t.x));xx<Math.min(w,Math.ceil(t.x+t.w));xx++){const i=(y*w+xx)*4;
    const br=d[i],bg=d[i+1],bb=d[i+2];const A=lum(t.c[0]*a+br*(1-a),t.c[1]*a+bg*(1-a),t.c[2]*a+bb*(1-a)),B=lum(br,bg,bb);ks.push((Math.max(A,B)+.05)/(Math.min(A,B)+.05))}
   if(!ks.length)return 99;ks.sort((x,y)=>x-y);return ks[Math.floor(ks.length*.02)]})},[png.toString('base64'),T.T]);
 T.T.forEach((t,i)=>t.ratio=rs[i]);return T.T}
/* every area open, the menu scrolled from top to end in steps; each label is judged at its worst position */
async function contrast(p,label,root){
 const all={};const n=await p.evaluate(root=>document.querySelectorAll(root+' details.nx-area').length,root);
 for(let i=-1;i<n;i++){await p.evaluate(([root,i])=>{const ds=[...document.querySelectorAll(root+' details.nx-area')];if(i>=0&&ds[i])ds[i].open=true;window.__rartScr(root).scrollTop=0},[root,i]);await p.waitForTimeout(120);
  let guard=0;while(guard++<30){for(const t of await measure(p,root)){const k=t.t+'|'+t.el;if(!all[k]||t.ratio<all[k].ratio)all[k]=t}
   const more=await p.evaluate(root=>{const sc=window.__rartScr(root);if(sc.scrollTop+sc.clientHeight>=sc.scrollHeight-2)return false;sc.scrollTop+=Math.max(120,Math.round(sc.clientHeight*.7));return true},root);if(!more)break;await p.waitForTimeout(60)}}
 const L=Object.values(all);let worst=null;const low=[];
 for(const t of L){if(!worst||t.ratio<worst.ratio)worst=t;if(t.ratio<MIN)low.push(t.t+' '+t.ratio.toFixed(2)+(process.env.RAIL_ART_DEBUG?' ['+t.el+' rgba('+t.c.join(',')+')]':''))}
 ok(L.length>60&&!low.length,label+': '+L.length+' labels at '+MIN+':1 or better, every area opened and scrolled end to end (lowest '+(worst?worst.ratio.toFixed(2)+' "'+worst.t+'"':'none')+')'+(low.length?' below: '+low.slice(0,10).join('; '):''));
 await p.evaluate(root=>{window.__rartScr(root).scrollTop=0},root);return worst?worst.ratio:0}
async function overlap(p,label,root){const r=await p.evaluate(root=>{const bad=[];const box0=document.querySelector(root);
  const box=e=>e.getBoundingClientRect();const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
  box0.querySelectorAll('.navi,details.nx-area>summary').forEach(row=>{const ic=row.querySelector('svg');const tx=row.querySelector('.nx-l,.nx-gl,span:not(.nx-gi):not(.nx-t)');if(!ic||!tx||!tx.textContent.trim())return;
   const a=box(ic),c=box(tx);if(a.width&&c.width&&hit(a,c))bad.push('icon over "'+tx.textContent.trim().slice(0,24)+'"');if(c.right>box(row).right+1)bad.push('"'+tx.textContent.trim().slice(0,24)+'" runs out of its row')});
  const m=box0.querySelector('.rart-mark'),wm=box0.querySelector('.brand b');if(m&&wm&&box(m).width&&hit(box(m),box(wm)))bad.push('mark over wordmark');
  const seen=e=>e.getBoundingClientRect().height>0&&(!e.checkVisibility||e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true,contentVisibilityAuto:true}));
  const rows=[...box0.querySelectorAll('.navit,details.nx-area>summary,.nx-allb')].filter(seen);
  for(let i=1;i<rows.length;i++){const a=box(rows[i-1]),c=box(rows[i]);if(rows[i].parentElement===rows[i-1].parentElement&&hit(a,c)&&Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)>2)bad.push('"'+rows[i-1].textContent.trim().slice(0,20)+'" and "'+rows[i].textContent.trim().slice(0,20)+'" overlap')}
  if(document.scrollingElement.scrollWidth>innerWidth+1)bad.push('horizontal scroll '+document.scrollingElement.scrollWidth+' > '+innerWidth);return bad},root);
 ok(!r.length,label+': no overlap'+(r.length?' ('+r.slice(0,6).join('; ')+')':''))}
/* the admin persona carries the gear (Build and admin); an area with no entry for a persona is not drawn, so the area check takes the
   union of the admin and exec menus */
async function icons(p,label,root,o){o=o||{};const r0=!o.union?[]:await p.evaluate(async root=>{NAVX.persona.set('exec');await new Promise(r=>setTimeout(r,250));
  const k=[...document.querySelectorAll(root+' details.nx-area>summary .nx-gi svg[data-rart]')].map(s=>s.dataset.rart);NAVX.persona.set('admin');await new Promise(r=>setTimeout(r,250));return k},root);
 const r=await p.evaluate(root=>{const box=document.querySelector(root);const got={};const fallback=[];
  box.querySelectorAll('details.nx-area>summary').forEach(s=>{const ic=s.querySelector('.nx-gi svg');const k=ic&&ic.dataset.rart;if(k)got[k]=1;else fallback.push(s.textContent.trim().slice(0,24))});
  box.querySelectorAll('.navi[data-nav="home"],.navi[data-nav="showroom"],[data-nx-all]').forEach(bn=>{const ic=bn.querySelector('svg');const k=ic&&ic.dataset.rart;if(k)got[k]=1;else fallback.push(bn.textContent.trim().slice(0,24))});
  const m=box.querySelector('.brand .rart-mark');const ms=m&&getComputedStyle(m);

  return {got:Object.keys(got),fallback,mark:!!m&&/mark-gold|data:image\/webp/.test(ms.backgroundImage)&&m.getBoundingClientRect().width>=24,oldLogo:!!box.querySelector('.brand .logo'),
   markTop:m?m.getBoundingClientRect().bottom<=(box.querySelector('.navi[data-nav="home"]')||box).getBoundingClientRect().top+1:false,
   gold:[...box.querySelectorAll('.rart-ico')].every(s=>/210, 168, 106/.test(getComputedStyle(s).color))}},root);
 const need=o.union?AREAS.concat(FIXED):FIXED; /* on the phone sheet every drawn area is checked through the fallback list */const miss=need.filter(k=>r.got.indexOf(k)<0&&(!o.union||r0.indexOf(k)<0));
 if(o.mark)ok(r.mark&&!r.oldLogo&&r.markTop,label+': the gold falcon mark sits at the top of the rail, above Home, in place of the old logo tile');
 ok(!miss.length&&!r.fallback.length,label+': every area and fixed item shows its falcon-style icon'+(miss.length?' (missing '+miss.join(', ')+')':'')+(r.fallback.length?' (fallback glyph on '+r.fallback.join(', ')+')':''));
 if(o.gold)ok(r.gold,label+': rail icons are colored by --brand-gold')}
const shot=async(p,name,clip)=>{if(!SHOTS)return;fs.mkdirSync(SHOTS,{recursive:true});const f=path.join(SHOTS,'rail_art_'+name+'.png');await p.screenshot({path:f,clip});console.log('     screenshot '+f)};

const res={};
/* light and dark at desktop width: the rail over the painted panel */
for(const theme of ['light','dark']){const {ctx,p}=await open(theme,1440);
 await shot(p,theme,{x:0,y:0,width:720,height:900});
 await icons(p,theme,'.rail',{mark:true,gold:true,union:true});await overlap(p,theme,'.rail');
 const bg=await p.evaluate(()=>getComputedStyle(document.querySelector('.rail')).backgroundImage);ok(/rail-panel|data:image\/webp/.test(bg)&&/gradient/.test(bg),theme+': the rail shows the painted panel under the scrim');
 res[theme]=await contrast(p,theme+', rail over the panel','.rail');
 /* reduced effects: plain navy */
 await p.evaluate(()=>EFFECTS.set('reduced'));await p.waitForTimeout(120);
 const rd=await p.evaluate(()=>{const s=getComputedStyle(document.querySelector('.rail'));return {img:s.backgroundImage,col:s.backgroundColor}});
 ok(rd.img==='none'&&/rgb\(11, 27, 51\)/.test(rd.col),theme+': reduced effects removes the panel (rail is plain navy: '+rd.col+')');
 res[theme+' reduced']=await contrast(p,theme+', reduced effects','.rail');
 await p.evaluate(()=>EFFECTS.set('full'));
 /* prefers-reduced-transparency */
 const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});await p.waitForTimeout(150);
 const rt=await p.evaluate(()=>({m:matchMedia('(prefers-reduced-transparency: reduce)').matches,img:getComputedStyle(document.querySelector('.rail')).backgroundImage}));
 ok(!rt.m||rt.img==='none',theme+': prefers-reduced-transparency removes the panel'+(rt.m?'':' (this browser cannot emulate the query; the fx-reduced check above covers it)'));
 await cdp.send('Emulation.setEmulatedMedia',{features:[]});
 /* collapsed rail: the flat icon strip uses the same icons */
 await p.evaluate(async()=>{const c=document.getElementById('railCollapse');c.checked=true;c.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,300));renderNav()});
 const flat=await p.evaluate(()=>[...document.querySelectorAll('#nav [data-nx-grp],#nav [data-nx-all],#nav .navi[data-nav="home"],#nav .navi[data-nav="showroom"]')].map(bn=>(bn.querySelector('svg')||{dataset:{}}).dataset.rart||'none'));
 ok(flat.length>=10&&flat.indexOf('none')<0,theme+': collapsed rail uses the falcon icons ('+flat.join(', ')+')');
 await ctx.close()}

/* 400 px: the phone shell hides the rail; the same menu opens as a sheet from More (light surface, icons take the sheet's ink) */
{const {ctx,p}=await open('light',400);
 const opened=await p.evaluate(async()=>{const m=[...document.querySelectorAll('[data-r17o1-more]')].find(b=>b.getBoundingClientRect().width);if(m)m.click();else NAVX.menu(true);await new Promise(r=>setTimeout(r,700));
  const host=[...document.querySelectorAll('.r17o1-sheet,.rail')].find(e=>e.getBoundingClientRect().width>200&&e.querySelector('details.nx-area'));if(!host)return false;host.setAttribute('data-rart-root','');return true});
 ok(opened,'400 px: the menu opens on a phone');
 if(opened){await shot(p,'400px',{x:0,y:0,width:400,height:900});await icons(p,'400 px','[data-rart-root]');await overlap(p,'400 px','[data-rart-root]')}  /* the sheet is a light surface, not the panel: its contrast belongs to the theme checks, not to this test */
 await ctx.close()}

ok(!errs.length,'no page errors'+(errs.length?': '+errs.slice(0,4).join(' | '):''));
console.log('rail_art contrast (lowest label ratio): '+Object.entries(res).map(([k,v])=>k+' '+v.toFixed(2)).join(', '));
await b.close();if(fails.length){console.log('rail_art: '+fails.length+' failed');process.exit(1)}console.log('rail_art: all passed')})().catch(e=>{console.error(e);process.exit(1)});
