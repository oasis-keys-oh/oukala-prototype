const L=require('./load.js');
(async()=>{
for(const [w,h] of [[1440,900],[400,820]]){
const {b,p}=await L(w,h);
const r=await p.evaluate(async()=>{
 const o={};const rc=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)].join(',')};
 const sl=ms=>new Promise(r=>setTimeout(r,ms));
 o.nxTab=rc(document.querySelector('#nxTab'))+' '+getComputedStyle(document.querySelector('#nxTab')).display+' '+document.querySelector('#nxTab').textContent.trim().replace(/\s+/g,' ').slice(0,100);
 go('bud_over');await sl(800);
 o.hash=location.hash;o.title=document.title;
 o.crumb=[...document.querySelectorAll('.crumbs,.breadcrumb,[aria-label=Breadcrumb],nav[aria-label*=readcrumb]')].map(e=>e.outerHTML.slice(0,300)+rc(e));
 const h1=document.querySelector('#view h1');o.h1=h1&&h1.textContent+' '+rc(h1);
 const hero=document.querySelector('.hero');o.heroKids=hero&&[...hero.children].map(e=>e.tagName+'.'+String(e.className).slice(0,30)+' '+rc(e)+' '+e.textContent.trim().replace(/\s+/g,' ').slice(0,60));
 o.why=[...document.querySelectorAll('[class*=why],[data-why],[class*=Why]')].slice(0,8).map(e=>e.tagName+'.'+String(e.className).slice(0,40)+' '+rc(e)+' '+e.textContent.trim().slice(0,30)+' parent='+e.parentElement.className.slice(0,40));
 o.heroActions=[...document.querySelectorAll('.hero .row, .hero .actions, .page-actions, [class*=pgact],[class*=hdr-act]')].slice(0,4).map(e=>e.className+' '+rc(e));
 o.fabs=rc(document.querySelector('#chxOrb'));
 return o});
console.log(w,JSON.stringify(r,null,1));await b.close()}})();
