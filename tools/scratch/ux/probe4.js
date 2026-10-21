// PR-31 probe 4: the mission card geometry and buttons, hints over time, Showroom default role, lens chips for CCO and Board.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'../../..');const out=path.join(__dirname,'shots','_probe4');fs.mkdirSync(out,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+ROOT+'/build_out/full.html',{waitUntil:'domcontentloaded',timeout:180000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function'&&window.EXP,null,{timeout:180000});await p.waitForTimeout(1500);
const R={};
await p.evaluate(()=>{NAVX.persona.set('cfo');go('home')});await wait(500);
await p.evaluate(()=>EXP.start('cfo_invoice',{role:'cfo',mode:'self',tenant:'core'}));await wait(1200);
const card=async()=>p.evaluate(()=>{const c=[...document.querySelectorAll('*')].find(e=>/SELF-SERVE EXPERIENCE|Self-serve experience/i.test(e.firstChild&&e.firstChild.textContent||'')&&e.children.length<4);
 const box=c?c.closest('section,aside,div[role],[class*=exp]'):null;const el=box||c;if(!el)return null;const r=el.getBoundingClientRect();
 return {cls:el.className.toString().slice(0,60),top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height),scrollH:el.scrollHeight,vh:innerHeight,
  buttons:[...el.querySelectorAll('button,a')].map(x=>{const q=x.getBoundingClientRect();return x.textContent.trim().slice(0,30)+'@'+Math.round(q.top)}).slice(0,14),screen:S.screen}});
R.t1=await card();await p.screenshot({path:out+'/cfo_start.jpg',type:'jpeg',quality:55});
await wait(25000);R.t26=await card();R.state26=await p.evaluate(()=>EXP.state());await p.screenshot({path:out+'/cfo_t26.jpg',type:'jpeg',quality:55});
await p.evaluate(()=>EXP.stop());
/* showroom default role and lens availability */
for(const k of ['cco','board','clo','exec']){await p.evaluate(k=>{NAVX.persona.set(k);go('showroom')},k);await wait(500);
 R['show_'+k]=await p.evaluate(()=>{const v=document.getElementById('view');const pressed=[...v.querySelectorAll('[aria-pressed=true],.on,.active,[aria-selected=true]')].map(e=>e.textContent.trim()).filter(t=>t.length<40).slice(0,6);
  const t=v.innerText;const i=t.indexOf('WHO IS DRIVING');return {pressed,who:t.slice(i,i+120).replace(/\s+/g,' '),lensSection:(t.match(/Lens(es)?[^\n]{0,200}/i)||[''])[0]}});
 await p.screenshot({path:out+'/show_'+k+'.jpg',type:'jpeg',quality:55,fullPage:false})}
R.lenses=await p.evaluate(()=>SHOW.lenses.map(l=>l.id+':'+l.persona));
fs.writeFileSync(out+'/data.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1).slice(0,5000));await b.close()})();
