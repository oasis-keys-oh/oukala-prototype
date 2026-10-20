// CL-26 probe (prototype fact, observed states only): which !important declarations change nothing.
// Usage: node tools/tests/css_important.js <build dir> <out.json> [light|dark|w400]
// Opens every registered screen. For each !important declaration whose selector matches elements on the screen
// (rules inside @media count only when the query matches), it drops the priority in the CSSOM, compares the computed
// longhands of up to 40 matched elements (and their ::before/::after when the selector targets one), then restores it.
// A declaration is "needed" when any comparison differs on any screen; "tested" when it matched at least once.
// Declarations behind :hover, :focus, :active and similar states never match here and stay untested (kept).
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const [dir,out,mode='light']=process.argv.slice(2);
 const vp=mode==='w400'?{width:400,height:820}:{width:1440,height:900};
 const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const c=await b.newContext({viewport:vp,colorScheme:mode==='dark'?'dark':'light',reducedMotion:'reduce'});const p=await c.newPage();
 await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(900);
 await p.evaluate(()=>{const D=[];const walk=(list,media)=>{for(const r of list){
   if(r.cssRules&&r.media){walk(r.cssRules,r.media.mediaText);continue}
   if(r.cssRules&&!r.selectorText){try{walk(r.cssRules,media)}catch(e){}continue}
   if(!r.style||!r.selectorText)continue;
   for(let i=0;i<r.style.length;i++){const prop=r.style[i];if(r.style.getPropertyPriority(prop)==='important')D.push({r,prop,media,sel:r.selectorText,val:r.style.getPropertyValue(prop)})}}};
  for(const s of document.styleSheets){try{walk(s.cssRules,null)}catch(e){}}
  // longhands repeat for a shorthand: group by rule and the shorthand text the author wrote
  window.__D=D;window.__need=new Set();window.__tested=new Set();});
 const n=await p.evaluate(()=>__D.length);console.log(mode,'important longhands',n);
 const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
 for(const id of ids){await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(250);
  await p.evaluate(()=>{const pe=s=>{const m=s.match(/::?(before|after)\b/);return m?'::'+m[1]:null};
   for(let k=0;k<__D.length;k++){if(__need.has(k))continue;const d=__D[k];
    if(d.media&&!matchMedia(d.media).matches)continue;
    let els=[];const parts=d.sel.split(',');
    for(const s of parts){const ps=pe(s);const base=s.replace(/::?(before|after|placeholder|marker|selection|-webkit-[\w-]+)\b/g,'').trim()||'*';
     let q=[];try{q=document.querySelectorAll(base)}catch(e){continue}
     for(const el of q){els.push([el,ps]);if(els.length>=40)break}if(els.length>=40)break}
    if(!els.length)continue;__tested.add(k);
    const read=()=>els.map(([el,ps])=>{const cs=getComputedStyle(el,ps);return cs.getPropertyValue(d.prop)});
    const a=read();d.r.style.setProperty(d.prop,d.val,'');const bb=read();d.r.style.setProperty(d.prop,d.val,'important');
    if(a.some((v,i)=>v!==bb[i]))__need.add(k)}});}
 const res=await p.evaluate(()=>__D.map((d,k)=>({sel:d.sel,prop:d.prop,media:d.media,val:d.val,tested:__tested.has(k),need:__need.has(k)})));
 fs.writeFileSync(out,JSON.stringify(res));
 console.log(mode,'tested',res.filter(r=>r.tested).length,'needed',res.filter(r=>r.need).length,'removable',res.filter(r=>r.tested&&!r.need).length);
 await b.close()})();
