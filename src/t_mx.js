const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const rows=[];
for(const W of [1280,1920]){const p=await b.newPage({viewport:{width:W,height:900}});
await p.route(/^https?:/,r=>r.abort());await p.goto('file:///home/claude/oukala/build_out/full.html',{waitUntil:'load'});await p.waitForTimeout(8000);
await p.click('#stuPill');await p.waitForTimeout(1200);
await p.evaluate(()=>{STUDIO.fast=true;STUDIO.start('cal')});await p.waitForTimeout(600);
for(const col of [true])for(const dock of ['open','min','full']){
 await p.evaluate(([col,dock])=>{const c=document.getElementById('railCollapse');if(c){c.checked=col;c.dispatchEvent(new Event('change',{bubbles:true}))}
  const R=document.documentElement;if(dock==='min'){CHATX.close()}else{CHATX.open('chat');if(dock==='full'){const f=document.querySelector('[data-cx-full],#chxFull');}}},[col,dock]);await p.waitForTimeout(700);
 for(const v of ['metrics','process']){
 const r=await p.evaluate(v=>{STUDIO.view=v;STUDIO.x.render();const w=s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().width):null};return {v,screen:w('.stu-screen'),body:w('.stu-body'),grid:w('.stu-mgrid'),cv:w('#stuCv')}},v);
 rows.push(W+' col='+col+' dock='+dock+' '+JSON.stringify(r))}}
await p.close()}
console.log(rows.join('\n'));await b.close()})()
