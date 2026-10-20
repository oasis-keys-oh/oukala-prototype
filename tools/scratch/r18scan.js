const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const mk=async(w,h,dark)=>{const c=await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message.slice(0,140)+' @ '+String(e.stack).split('\n')[1]));await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.argv[2]);await p.waitForTimeout(4000);return p};
const mine=['r18_builds','r18_app','r18_mature','r18_debt','r18_access','r18_lens','r18_strategy'];
// all screens error scan desktop
let p=await mk(1440,900,false);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
let bad=0;for(const id of ids){p.errs.length=0;await p.evaluate(id=>{try{go(id)}catch(e){window.__e=e.message}},id);await p.waitForTimeout(60);const e=await p.evaluate(()=>{const x=window.__e;window.__e=null;return x});if(e||p.errs.length){bad++;console.log('ERR',id,e||p.errs[0])}}
console.log('screens',ids.length,'with errors',bad);
// views of mine with every tab
for(const id of mine){const nt=await p.evaluate(id=>{go(id);return document.querySelectorAll('.screen .views button, .screen [role=tab]').length},id);for(let i=0;i<nt;i++){p.errs.length=0;await p.evaluate(([id,i])=>{go(id);const bt=document.querySelectorAll('.screen .views button, .screen [role=tab]')[i];bt&&bt.click()},[id,i]);await p.waitForTimeout(80);if(p.errs.length)console.log('TABERR',id,i,p.errs[0])}}
await p.context().close();
for(const [lab,w,h,dark] of [['phone',390,844,false],['dark',1440,900,true],['darkphone',390,844,true]]){
 p=await mk(w,h,dark);
 for(const id of mine){await p.evaluate(id=>go(id),id);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,bodysw:document.body.scrollWidth}));
  if(r.sw>r.iw+2)console.log(lab,id,'OVERFLOW',JSON.stringify(r));
  if(lab!=='phone')await p.screenshot({path:`/tmp/r18s_${lab}_${id}.png`});else if(id==='r18_builds'||id==='r18_access'||id==='r18_lens')await p.screenshot({path:`/tmp/r18s_${lab}_${id}.png`})}
 console.log(lab,'done',p.errs.length);await p.context().close()}
await b.close()})();
