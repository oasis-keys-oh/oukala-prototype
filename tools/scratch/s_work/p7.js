const L=require('./load.js');
(async()=>{
for(const [w,h] of [[1440,900],[400,820]]){
const {b,p}=await L(w,h);
const r=await p.evaluate(async()=>{
 const o={};const rc=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)].join(',')};
 o.tb=[...document.querySelectorAll('.topbar button, .topbar a, .topbar input, .topbar select, .topbar .search')].map(e=>e.tagName+'#'+e.id+'.'+String(e.className).slice(0,25)+' | '+(e.getAttribute('aria-label')||e.title||e.textContent.trim().replace(/\s+/g,' ').slice(0,30))+' | '+rc(e));
 o.rail=[...document.querySelectorAll('aside.rail nav > *')].map(e=>(e.tagName+'.'+String(e.className).slice(0,22)+' '+e.textContent.trim().replace(/\s+/g,' ').slice(0,45))).slice(0,40);
 o.foot=[...document.querySelectorAll('.railfoot button, .railfoot a, .railfoot select')].map(e=>(e.getAttribute('aria-label')||e.title||e.textContent.trim().replace(/\s+/g,' ').slice(0,30)));
 o.brand=document.querySelector('.brand').textContent.trim().replace(/\s+/g,' ');
 o.title=document.title;o.hash=location.hash;
 return o});
console.log(w,JSON.stringify(r,null,1));await b.close()}})();
