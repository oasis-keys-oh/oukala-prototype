const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});const p=await ctx.newPage();
await p.goto('file://'+process.cwd()+'/full.html',{timeout:180000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof S!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:180000});await p.waitForTimeout(2000);
const log=(k,v)=>console.log(k,JSON.stringify(v));
log('landmarks',await p.evaluate(()=>({main:document.querySelectorAll('main,[role=main]').length,nav:document.querySelectorAll('nav,[role=navigation]').length,h1:document.querySelectorAll('h1').length,skip:!!document.querySelector('a[href^="#"][class*=skip],.skip'),lang:document.documentElement.lang,viewTab:document.querySelector('#view').getAttribute('tabindex'),title:document.title})));
await p.evaluate(()=>go('home'));await p.waitForTimeout(800);
log('a11y',await p.evaluate(()=>{const q=s=>[...document.querySelectorAll(s)];
const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
const noname=q('button,a[href],[role=button],input,select,textarea').filter(vis).filter(e=>!(e.getAttribute('aria-label')||e.innerText.trim()||e.getAttribute('title')||e.labels&&e.labels.length||e.getAttribute('aria-labelledby')||e.getAttribute('placeholder')));
const small=q('button,a[href],[role=button]').filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.height<24||r.width<24});
const fs=new Map();q('#view *').filter(vis).forEach(e=>{if(e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(e).fontSize);fs.set(f,(fs.get(f)||0)+1)}});
return {noname:noname.length,nonameEx:noname.slice(0,5).map(e=>e.outerHTML.slice(0,100)),small:small.length,fontSizes:[...fs.entries()].sort((a,b)=>a[0]-b[0]).slice(0,6),imgNoAlt:q('img').filter(i=>!i.hasAttribute('alt')).length,svgNoHide:0}}));
log('focus',await p.evaluate(()=>{const v=document.querySelector('#view');v.focus();const c=getComputedStyle(v);return {outline:c.outline,boxShadow:c.boxShadow.slice(0,80)}}));
// keyboard
const seq=[];await p.evaluate(()=>document.body.focus());for(let i=0;i<14;i++){await p.keyboard.press('Tab');seq.push(await p.evaluate(()=>{const e=document.activeElement;return (e.getAttribute('aria-label')||e.innerText||e.tagName).trim().slice(0,28)}))}
log('tabseq',seq);
// contrast of muted
log('contrast',await p.evaluate(()=>{function lum(c){const m=c.match(/[\d.]+/g).map(Number);const a=m.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
const out=[];for(const sel of ['#view .muted','#view .small','#view .eyebrow','.pill.mute','#view .card .sub','#view p']){const e=document.querySelector(sel);if(!e)continue;const cs=getComputedStyle(e);let bg=e;let bc='rgba(0, 0, 0, 0)';while(bg&&/rgba\(0, 0, 0, 0\)|transparent/.test(bc)){bc=getComputedStyle(bg).backgroundColor;bg=bg.parentElement}
out.push([sel,cs.color,bc,cs.fontSize,Math.round(((Math.max(lum(cs.color),lum(bc))+.05)/(Math.min(lum(cs.color),lum(bc))+.05))*10)/10])}return out}));
// persona popover
const pb=await p.$('text=Casey Rowan');if(pb){await pb.click();await p.waitForTimeout(600);await p.screenshot({path:'shots/persona_pop_dark.png'});log('pop',await p.evaluate(()=>{const e=[...document.querySelectorAll('[role=menu],[role=dialog],.popover,.pop')].filter(x=>x.getBoundingClientRect().width>0).map(x=>x.innerText.slice(0,600));return e}))}
await b.close()})();
