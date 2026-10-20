const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const W=+process.env.W||1440;const dark=process.env.DARK;
const ctx=await b.newContext({viewport:{width:W,height:+process.env.H||950},colorScheme:dark?'dark':'light'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(1200);
if(dark)await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')}).catch(()=>{});
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){console.log('EVERR',e.message.slice(0,200))}};
const tag=(dark?'d':'l')+W;
// library page hook
await ev(()=>go('plat_proc'));await p.waitForTimeout(700);
console.log('lib btn',await ev(()=>!!document.querySelector('#view [data-dr-open]')));
await ev(()=>PROCLIB.open('draw_process'));await p.waitForTimeout(700);
console.log('page btn',await ev(()=>{const b=document.querySelector('#drawer [data-dr-open]');return b&&b.textContent}));
await p.screenshot({path:'shots_b13/t5_page_'+tag+'.png'});
await p.click('#drawer [data-dr-open]');await p.waitForTimeout(900);
console.log('screen',await ev(()=>S.screen+' '+DRAW.ST.doc.name+' '+DRAW.ST.doc.shapes.length));
await p.screenshot({path:'shots_b13/t5_open_'+tag+'.png'});
// flow hero
await ev(()=>go('flw_design'));await p.waitForTimeout(600);console.log('flow btn',await ev(()=>!!document.querySelector('#view [data-dr-open]')));
await ev(()=>go('flw_bpmn'));await p.waitForTimeout(600);console.log('bpmn btn',await ev(()=>!!document.querySelector('#view [data-dr-open]')));
// chat intent
const asked=await ev(()=>{let said=null;const r=ASKX.some(f=>{try{return f('draw a process for vendor onboarding')}catch(e){return false}});return r+' '+S.screen+' '+(DRAW.ST.doc&&DRAW.ST.doc.name)});console.log('ask',asked);
const asked2=await ev(()=>{ASKX.some(f=>{try{return f('draw the incident process')}catch(e){return false}});return S.screen+' '+(DRAW.ST.doc&&DRAW.ST.doc.name+' '+DRAW.ST.doc.shapes.length)});console.log('ask2',asked2);
console.log('search',await ev(()=>SEARCHX.flatMap(f=>{try{return f()}catch(e){return[]}}).filter(r=>r.g==='Draw a process').length));
// keyboard palette add
await ev(()=>DRAW.open(null,{name:"Kbd test"}));await p.waitForTimeout(500);
await p.focus('[data-dr-pi="task"]:visible');await p.keyboard.press('Enter');await p.waitForTimeout(300);await p.keyboard.press('Escape');
await p.focus('[data-dr-pi="gateway"]:visible');await p.keyboard.press('Enter');await p.waitForTimeout(300);
console.log('kbd',await ev(()=>JSON.stringify({s:DRAW.ST.doc.shapes.map(s=>s.t),c:DRAW.ST.doc.conns.map(c=>c.ap+'>'+c.bp+(c.lb||''))})));
await p.screenshot({path:'shots_b13/t5_kbd_'+tag+'.png'});
// connector select -> drawer
await ev(()=>{const c=DRAW.ST.doc.conns[1];DRAW.ST.selC=c.id;DRAW.ST.sel.clear();DRAW.openProps();DRAW.paint()});await p.waitForTimeout(500);
console.log('conn drawer',await ev(()=>!!document.querySelector('#drawer [data-dr-props-c]')));
await p.screenshot({path:'shots_b13/t5_conn_'+tag+'.png'});
console.log('errors',errs);await b.close()})();
