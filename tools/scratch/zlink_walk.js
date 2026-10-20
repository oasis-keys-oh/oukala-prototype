/* Data-link walker (Round 15). usage: NODE_PATH=$(npm root -g) node zlink_walk.js <full.html> [--screens a,b] [--click N]
   Fails (exit 1) on any data-link that does not parse, names an unknown type, or does not resolve; with --click N also
   clicks up to N links per screen and fails when nothing opens. */
const {chromium}=require('playwright');const path=require('path');
const a=process.argv.slice(2);const html=path.resolve(a[0]||'out/full.html');const only=a.includes('--screens')?a[a.indexOf('--screens')+1].split(','):null;const CLICK=a.includes('--click')?+a[a.indexOf('--click')+1]:0;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(120000);
await p.route(/^https?:/,r=>r.abort());const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+html);
await p.waitForFunction(()=>window.DATALINK&&window.ZLINK&&ZLINK.state.fixed.fx_r15e_n,null,{timeout:150000}).catch(()=>{console.error('boot did not finish');});
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));let total=0,bad=[],clicked=0,dead=0;
for(const id of ids){const r=await p.evaluate(async([id,CLICK])=>{try{go(id)}catch(e){return {err:String(e)}}await new Promise(r=>setTimeout(r,120));DATALINK.decorate(document.getElementById('view'));
  const els=[...document.querySelectorAll('#view [data-link]')];const out={n:els.length,bad:[],dead:0,clicked:0};
  els.forEach(el=>{const v=el.getAttribute('data-link');const l=DATALINK.parse(v);if(!l){out.bad.push([v,'does not parse']);return}const rs=DATALINK.resolve(l.type,l.id);if(!rs.ok)out.bad.push([v,rs.why])});
  for(const el of els.slice(0,CLICK)){const l=DATALINK.parse(el.getAttribute('data-link'));if(!l)continue;const before=S.screen+'|'+(document.getElementById('drawer')&&document.getElementById('drawer').matches(':popover-open'));
   let ok=false;try{ok=DATALINK.open(l.type,l.id)}catch(e){}out.clicked++;if(!ok)out.dead++;go(id);await new Promise(r=>setTimeout(r,80))}
  return out},[id,CLICK]);
 if(r.err){bad.push([id,r.err,'render']);continue}total+=r.n;clicked+=r.clicked;dead+=r.dead;r.bad.forEach(x=>bad.push([id,x[0],x[1]]));console.log(id.padEnd(22),String(r.n).padStart(4),'links',r.bad.length?r.bad.length+' broken':'ok')}
console.log('screens',ids.length,'links',total,'broken',bad.length,'clicked',clicked,'dead clicks',dead,'page errors',errs.length);
bad.slice(0,40).forEach(x=>console.log('  BROKEN',x.join(' | ')));await b.close();process.exit(bad.length||dead||errs.length?1:0)})();
