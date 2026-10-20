const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const W=+process.env.W||1000;const dark=process.env.DARK;
const ctx=await b.newContext({viewport:{width:W,height:+process.env.H||900},colorScheme:dark?'dark':'light'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(1200);
const ev=async(f,a)=>{try{return await p.evaluate(f,a)}catch(e){console.log('EVERR',e.message.slice(0,200))}};
const tag=(dark?'d':'l')+W;
await ev(()=>go('draw_studio'));await p.waitForTimeout(600);await p.screenshot({path:'shots_b13/t6_pick_'+tag+'.png'});
console.log('hscroll',await ev(()=>document.documentElement.scrollWidth>innerWidth+1));
await ev(()=>DRAW.open('draw_process'));await p.waitForTimeout(800);await p.screenshot({path:'shots_b13/t6_open_'+tag+'.png'});
console.log('ro',await ev(()=>DRAW.ST.ro),'hscroll',await ev(()=>document.documentElement.scrollWidth>innerWidth+1));
if(W>=760){await ev(()=>{const s=DRAW.ST.doc.shapes.find(x=>x.n==='Draft the next step');DRAW.ST.sel=new Set([s.id]);DRAW.openProps();DRAW.paint()});await p.waitForTimeout(700);await p.screenshot({path:'shots_b13/t6_props_'+tag+'.png'});console.log('hscroll2',await ev(()=>document.documentElement.scrollWidth>innerWidth+1))}
console.log('errors',errs);await b.close()})();
