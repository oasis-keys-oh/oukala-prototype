const L=require('./load.js');
(async()=>{
for(const [w,h] of [[1440,900],[400,820]]){
const {b,p}=await L(w,h);
const r=await p.evaluate(()=>{
 const o={};const rc=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),pos:getComputedStyle(e).position,disp:getComputedStyle(e).display}};
 const sel=['body','#app','#rail','#side','nav','aside','header','#top','.topbar','#topbar','#view','main','#ask','.askbtn','#askfab','#toasts','#drawer','.drawer','.hero','.screen','.crumbs','.breadcrumb','#hdr','.tb','.rail'];
 o.els={};sel.forEach(s=>{const e=document.querySelector(s);if(e)o.els[s]=rc(e)});
 o.ids=[...document.querySelectorAll('body *[id]')].filter(e=>e.parentElement&&(e.parentElement===document.body||e.parentElement.id==='app')).map(e=>e.tagName+'#'+e.id+' '+JSON.stringify(rc(e)));
 o.bodyKids=[...document.body.children].map(e=>e.tagName+'#'+e.id+'.'+e.className.toString().slice(0,40)+' '+JSON.stringify(rc(e)));
 return o});
console.log(w,JSON.stringify(r,null,1));await b.close()}})();
