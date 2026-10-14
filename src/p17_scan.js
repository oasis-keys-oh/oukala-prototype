const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load'});await p.waitForTimeout(2500);
const list=await p.evaluate(()=>{const o=[];R17P.STORIES.forEach(s=>s.stops.forEach(sp=>{if(!o.find(x=>x.screen===sp.screen&&x.persona===(sp.persona||''))&&SCREENS.some(z=>z[0]===sp.screen))o.push({screen:sp.screen,persona:sp.persona||'',tab:sp.tab||''})}));return o});
for(const it of list){await p.evaluate(x=>{if(x.persona)R17P.setPersona(x.persona);go(x.screen)},it);await p.waitForTimeout(400);
 const info=await p.evaluate(()=>({views:[...document.querySelectorAll('#view [data-views]')].map(v=>v.dataset.views+': '+[...v.querySelectorAll(':scope > .vsw label')].map(l=>l.textContent.trim().slice(0,22)).join(' | ')),cards:[...document.querySelectorAll('#view .card')].slice(0,14).map(c=>{const h=c.querySelector('h1,h2,h3,h4,header,.ch,.ctitle');return (h?h.textContent.trim():'?').slice(0,40)})}));
 console.log('##',it.screen,it.persona,'| tab wanted:',it.tab);console.log('  views',JSON.stringify(info.views));console.log('  cards',JSON.stringify(info.cards));
 await p.evaluate(x=>{if(x.persona)R17P.setPersona('exec')},it)}
await b.close()})();
