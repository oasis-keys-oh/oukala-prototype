// Showroom role cards test (PR-110, DC-51 front door): the Showroom home shows one card per executive track in order (COO Cost
// Takeout, CFO Material Weakness Traceability, CEO Strategy Implementation); COO and CEO start their track in one click as that
// role (track bar up, ?track= in the URL); the CFO card is honest (disabled, says coming, starts nothing, no fake track); every card
// carries a Modeled or Simulated label and no em dash; the More demos heading sits above Experiences and tours, which stay;
// the cards fit the first view at 1440x900 and 1280x720 (measured against the viewport, the sticky header sits above them).
// Usage: node tools/tests/showroom_roles.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const URL0='file://'+dir+'/full.html';
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await b.newContext({viewport:{width:1440,height:900}});await ctx.route(/^https?:/,r=>r.abort());
const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};const ok=m=>console.log('ok  ',m);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,200)));
await p.goto(URL0,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.EXP&&window.TRACKS&&window.SHOW&&SHOW.front&&EXP.byId('trk_cost'),null,{timeout:60000});await p.waitForTimeout(800);
const settle=ms=>p.waitForTimeout(ms||700);
await p.evaluate(()=>go('showroom'));await settle(900);
const cards=()=>p.evaluate(()=>[...document.querySelectorAll('#view [data-srs-role]')].map(c=>{const bt=c.querySelector('button');return{id:c.dataset.srsRole,txt:c.textContent.replace(/\s+/g,' ').trim(),open:bt.dataset.trkOpen||null,disabled:bt.disabled,label:!!c.querySelector('.exp-chip')}}));
let C=await cards();
if(C.map(c=>c.id).join()!=='cost,mw,strat')fail('cards '+JSON.stringify(C.map(c=>c.id)));
const want={cost:/COO.*Cost Takeout/,mw:/CFO.*Material Weakness Traceability/,strat:/CEO.*Strategy Implementation/};
C.forEach(c=>{if(!want[c.id].test(c.txt))fail('card text '+c.txt);if(!/(Modeled|Simulated)/i.test(c.txt)||!c.label)fail('card has no label '+c.txt);if(/[—–]/.test(c.txt))fail('dash in card '+c.txt)});
const by=Object.fromEntries(C.map(c=>[c.id,c]));
if(by.cost.open!=='cost'||by.cost.disabled||by.strat.open!=='strat'||by.strat.disabled)fail('COO or CEO card not startable '+JSON.stringify([by.cost,by.strat]));
if(!by.mw.disabled||by.mw.open||!/Coming/.test(by.mw.txt)||!/Simulated/i.test(by.mw.txt))fail('CFO card not honest '+JSON.stringify(by.mw));else ok('cards '+C.map(c=>c.id+(c.disabled?' (disabled)':'')).join(', '));
// CFO card starts nothing (the disabled button ignores a click, and a programmatic open of the unbuilt track starts nothing)
await p.evaluate(()=>{document.querySelector('[data-srs-role="mw"] button').click()});await settle(500);
let cur=await p.evaluate(()=>({t:TRACKS.current(),bar:!!document.getElementById('trkBar'),e:EXP.current()&&EXP.current().m.id}));
if(cur.t||cur.bar||cur.e)fail('CFO card started something '+JSON.stringify(cur));else ok('CFO card starts nothing');
// one click starts the track as that role
for(const [id,persona] of [['cost','coo'],['strat','ceo']]){
 await p.evaluate(()=>go('showroom'));await settle(700);await p.click('#view [data-srs-role="'+id+'"] [data-trk-open]');await settle(1600);
 cur=await p.evaluate(()=>({t:TRACKS.current(),bar:!!document.getElementById('trkBar'),chips:document.querySelectorAll('#trkBar [data-trk-stage]').length,persona:S.persona,url:location.search}));
 if(!cur.t||cur.t.id!==id||!cur.bar||cur.chips!==6||cur.persona!==persona||!new RegExp('track='+id).test(cur.url))fail(id+' one click '+JSON.stringify(cur));else ok(id+' starts in one click as '+persona+' '+JSON.stringify({chips:cur.chips,url:cur.url}));
 await p.click('#trkBar [data-trk-leave]');await settle(900)}
// More demos: heading and link, Experiences and tours still there, in order
await p.evaluate(()=>go('showroom'));await settle(800);
const M=await p.evaluate(()=>{const v=document.getElementById('view'),f=v.querySelector('.srs-front'),h=document.getElementById('srMore'),e=v.querySelector('.exp-home'),t=v.querySelector('.sr-backup'),L=v.querySelector('[data-srs-more]');
 const before=(a,c)=>!!(a&&c&&(a.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING));return{order:before(f,h)&&before(h,e)&&before(e,t),link:!!L&&L.getAttribute('aria-controls')==='srMore',tours:v.querySelectorAll('[data-sr-start]').length}});
if(!M.order||!M.link||!M.tours)fail('more demos '+JSON.stringify(M));else ok('More demos '+JSON.stringify(M));
// layout: cards in the first view, no overflow, no clipped text (positions measured against the viewport)
for(const [w,h] of [[1440,900],[1280,720]]){await p.setViewportSize({width:w,height:h});await p.evaluate(()=>{go('showroom');window.scrollTo(0,0);const v=document.getElementById('view');v.scrollTop=0});await settle(900);
 const Lm=await p.evaluate(()=>{const cs=[...document.querySelectorAll('#view [data-srs-role]')].map(c=>{const r=c.getBoundingClientRect();return{top:Math.round(r.top),bottom:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right),clip:c.scrollWidth>c.clientWidth+1}});
  const hdr=document.querySelector('header,.top,#top');return{cs,vw:innerWidth,vh:innerHeight,hscroll:document.documentElement.scrollWidth>innerWidth+1,hdr:hdr?Math.round(hdr.getBoundingClientRect().bottom):null}});
 const inView=Lm.cs.every(c=>c.top>=0&&c.bottom<=Lm.vh);const sameRow=new Set(Lm.cs.map(c=>c.top)).size===1;const noOver=Lm.cs.every((c,i)=>i===0||c.l>=Lm.cs[i-1].r);
 console.log('layout '+w+'x'+h+' '+JSON.stringify(Lm));
 if(!sameRow||!noOver||Lm.hscroll||Lm.cs.some(c=>c.clip))fail('layout '+w+'x'+h+' '+JSON.stringify(Lm));
 if(!inView)fail('cards not fully inside the first view at '+w+'x'+h+' '+JSON.stringify(Lm))}
await b.close();
if(errs.length){fail('page errors');console.log(errs.slice(0,8))}
console.log(bad?'showroom_roles: '+bad+' failure'+(bad>1?'s':''):'showroom_roles: all passed');process.exit(bad?1:0)})();
