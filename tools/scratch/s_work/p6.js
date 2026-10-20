const L=require('./load.js');
(async()=>{
for(const [w,h] of [[1440,900],[400,820]]){
const {b,p}=await L(w,h);
const r=await p.evaluate(async()=>{
 const o={};const rc=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)].join(',')+' '+getComputedStyle(e).position};
 o.app=rc(document.querySelector('.app'))+' cols='+getComputedStyle(document.querySelector('.app')).gridTemplateColumns+' gap='+getComputedStyle(document.querySelector('.app')).gap+' pad='+getComputedStyle(document.querySelector('.app')).padding;
 o.aside=rc(document.querySelector('aside.rail'));o.topbar=rc(document.querySelector('.topbar'));o.view=rc(document.querySelector('#view'));
 o.topKids=[...document.querySelectorAll('.topbar > *, .topbar .tbr > *')].map(e=>(e.tagName+'.'+String(e.className).slice(0,30)+' | '+(e.getAttribute('aria-label')||e.title||e.textContent.trim().slice(0,25))+' | '+rc(e)));
 o.railKids=[...document.querySelector('aside.rail').children].map(e=>e.tagName+'.'+String(e.className).slice(0,30)+' '+rc(e)+' '+(e.textContent.trim().slice(0,40)));
 o.viewPad=getComputedStyle(document.querySelector('#view')).padding;
 o.viewMax=getComputedStyle(document.querySelector('#view')).maxWidth;
 o.screenPad=getComputedStyle(document.querySelector('.screen')).padding+' gap='+getComputedStyle(document.querySelector('.screen')).gap;
 openDrawer('<h3>Test</h3><p>x</p>');await new Promise(r=>setTimeout(r,500));
 o.drawer=rc(document.querySelector('#drawer'));o.drawerW=getComputedStyle(document.querySelector('#drawer')).width;
 closeDrawer();
 document.querySelector('#chxOrb').click();await new Promise(r=>setTimeout(r,500));o.chat=rc(document.querySelector('#chatDock'));
 document.querySelector('#chxOrb').click();
 return o});
console.log(w,JSON.stringify(r,null,1));await b.close()}})();
