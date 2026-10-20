const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:400,height:820},hasTouch:true,isMobile:false});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:300000});await p.waitForTimeout(2500);
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));let tot=0;const per=[],hot={};
for(const id of ids){await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const sel='button,a[href],[role=button],[role=tab],summary,select,input:not([type=hidden]),textarea,[data-go],[data-nav],[data-link],[data-rec]';const out=[];
  document.querySelectorAll('#view '+sel.split(',').join(',#view ')).forEach(e=>{if(e.closest('[hidden],[popover]:not(:popover-open),details:not([open])>:not(summary)'))return;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.pointerEvents==='none')return;
   if(e.tagName==='INPUT'&&(e.type==='radio'||e.type==='checkbox')&&e.closest('label')&&e.closest('label').getBoundingClientRect().height>=44)return;
   if(e.tagName==='INPUT'&&e.type==='radio'&&e.id&&document.querySelector('label[for="'+e.id+'"]'))return;
   if(r.height<43.5||r.width<43.5){const lb=e.tagName==='INPUT'?'':'';out.push(e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/)[0]:'')+' '+Math.round(r.width)+'x'+Math.round(r.height))}});return out});
 tot+=r.length;if(r.length)per.push([id,r.length]);r.forEach(k=>{const kk=k.replace(/ \d+x\d+/,'');hot[kk]=(hot[kk]||0)+1})}
per.sort((x,y)=>y[1]-x[1]);console.log('TOTAL',tot,'screens',ids.length,'with findings',per.length);console.log('TOP',JSON.stringify(per.slice(0,15)));
console.log('HOT',JSON.stringify(Object.entries(hot).sort((x,y)=>y[1]-x[1]).slice(0,25)));console.log('errs',errs.slice(0,3));await b.close()})();
