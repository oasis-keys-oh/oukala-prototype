const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_core');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
// kit2 gallery screen registered ad hoc
await p.evaluate(()=>{REG("k2test","K2 test","platform","M4 6h16",()=>{SCALE.on||0;const cis=SCALE.cis();
 const av=DIR.map(d=>`<div style="display:flex;gap:10px;align-items:center;margin:6px 0">${avatar(d,{size:48})}${pchip(d.name,{role:1})}${kindPill(d.kind)}</div>`).join("");
 return `<div class="screen">${hero("Kit2","Foundation gallery","Avatars, pickers, big tables and linked records.","")}
 <div class="grid g2"><section class="card glass"><h3>People directory</h3>${av}</section><section class="card glass"><h3>Pickers and linked records</h3>${mpHTML({id:"t_proj",label:"Projects",opts:PROJ.concat(SCALE.projects()).map(p=>({v:p.id,l:p.n,sub:p.short})),all:"All projects"})}<br><br>${lrHTML({id:"t_lr",groups:[{key:"a",label:"Incidents",rows:SCALE.tickets().slice(0,80).map(t=>({id:t.id,t:t.t,sub:t.svc,tag:t.id,st:"warn"}))},{key:"b",label:"Changes",rows:SCALE.tickets().slice(100,104).map(t=>({id:t.id,t:t.t,sub:t.svc,tag:t.id}))}],limit:5})}</section></div>
 ${card("Configuration items ("+cis.length+")","Virtual scrolling: only visible rows are drawn.",btHTML({id:"t_ci",cols:[{k:"id",label:"ID"},{k:"name",label:"Name"},{k:"class",label:"Class"},{k:"env",label:"Env"},{k:"svc",label:"Service"},{k:"status",label:"Status"},{k:"crit",label:"Criticality"},{k:"uptime",label:"Uptime %"},{k:"owner",label:"Owner"}],rows:cis,facets:["class","status"],groupBy:["class","env"],h:420,exportName:"cis",open:id=>toast("open "+id)}))}</div>`})});
await p.evaluate(()=>{SCALE.set(true);go("k2test")});await p.waitForTimeout(600);
await p.screenshot({path:'out_core/shots/k2a.png',fullPage:true});
const info=await p.evaluate(()=>({rows:document.querySelectorAll('[data-bt-row]').length,dir:DIR.length}));console.log(info);
await p.evaluate(()=>{const s=document.querySelector('[data-bt-scroll]');s.scrollTop=20000});await p.waitForTimeout(300);
console.log('after scroll rows',await p.evaluate(()=>document.querySelectorAll('[data-bt-row]').length), await p.evaluate(()=>document.querySelector('[data-bt-row]').dataset.id));
await p.evaluate(()=>person360("Priya Shah"));await p.waitForTimeout(400);await p.screenshot({path:'out_core/shots/k2p.png'});
await p.evaluate(()=>document.querySelector('[data-dexpand]').click());await p.waitForTimeout(400);await p.screenshot({path:'out_core/shots/k2full.png'});
await p.evaluate(()=>{closeDrawer();person360("Marco Ellis")});await p.waitForTimeout(300);await p.screenshot({path:'out_core/shots/k2m.png'});
console.log('errors',errs);await b.close()})();
