// PR-31 probe 3: where the rail, search and skip link sit in tab order; chat answers through the dock; 400 px rail access.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'../../..');const out=path.join(__dirname,'shots','_probe3');fs.mkdirSync(out,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+ROOT+'/build_out/full.html',{waitUntil:'domcontentloaded',timeout:180000});
await p.waitForFunction(()=>window.NAVX&&typeof go==='function',null,{timeout:180000});await p.waitForTimeout(1500);
const R={};
R.order=await p.evaluate(()=>{const all=[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(e=>e.tabIndex>=0&&e.getBoundingClientRect().width>0&&getComputedStyle(e).visibility!=='hidden');
 const pos=e=>e.compareDocumentPosition.bind(e);const where=e=>e.closest('#nav')?'rail':e.closest('#view')?'view':e.id==='skipLink'?'skip':'other:'+(e.id||e.className.toString().slice(0,30));
 const pos2=all.map((e,i)=>({i,ti:e.tabIndex,w:where(e),t:(e.getAttribute('aria-label')||e.textContent||e.placeholder||'').trim().slice(0,30)}));
 const firstRail=pos2.find(x=>x.w==='rail');const firstView=pos2.find(x=>x.w==='view');const search=pos2.find(x=>/Search/.test(x.t));
 return {n:all.length,firstRail,firstView,search,positive:pos2.filter(x=>x.ti>0).length,skip:pos2.find(x=>x.w==='skip'),head:pos2.slice(0,12)}});
/* real Tab from the very start, pressing until we leave the view */
await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.NAVX&&typeof go==='function',null,{timeout:180000});await p.waitForTimeout(1500);
await p.evaluate(()=>{document.body.focus();const a=document.activeElement;if(a&&a.blur)a.blur()});await p.mouse.click(5,895);
let n=0,seen=[];for(;n<120;n++){await p.keyboard.press('Tab');const w=await p.evaluate(()=>{const e=document.activeElement;return e?(e.closest('#nav')?'rail':e.closest('#view')?'view':e.id==='skipLink'?'skip':'other:'+(e.id||e.tagName))+'|'+(e.getAttribute('aria-label')||e.textContent||e.placeholder||'').trim().slice(0,30):'none'});
 if(seen.length<6||!seen[seen.length-1].startsWith(w.split('|')[0]))seen.push(n+':'+w);if(w.startsWith('rail'))break}
R.tabToRail={presses:n+1,trail:seen.slice(0,20)};
/* chat dock: ask the CAIO question */
await p.evaluate(()=>NAVX.persona.set('caio'));await wait(400);
const vis=await p.evaluate(()=>{const q=document.getElementById('chatq');return !!(q&&q.getBoundingClientRect().width)});R.dockOpenAlready=vis;if(!vis){await p.evaluate(()=>document.getElementById('chxOrb').click());await wait(500)}
await p.screenshot({path:out+'/chat_open.jpg',type:'jpeg',quality:55});
const inp=await p.$('#chatq');
if(inp){await inp.fill('Which agents lack an accountable human?');await p.keyboard.press('Enter');await wait(1800);
 R.chat=await p.evaluate(()=>document.getElementById('chatDock').innerText.replace(/\s+/g,' ').slice(-900));await p.screenshot({path:out+'/chat_answer.jpg',type:'jpeg',quality:55})}
else R.chat='no input found';
/* 400 px rail */
await p.setViewportSize({width:400,height:860});await wait(500);await p.evaluate(()=>{go('home')});await wait(400);
R.dock400=await p.evaluate(()=>{const d=document.getElementById('chatDock');const r=d.getBoundingClientRect();return {w:r.width,h:r.height,open:r.width>0}});await p.screenshot({path:out+'/w400_dock.jpg',type:'jpeg',quality:55});await p.evaluate(()=>{const m=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim()==='More');if(m)m.click()});await wait(500);await p.screenshot({path:out+'/w400_more.jpg',type:'jpeg',quality:55});
R.more=await p.evaluate(()=>document.body.innerText.length);
fs.writeFileSync(out+'/data.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1).slice(0,6000));await b.close()})();
