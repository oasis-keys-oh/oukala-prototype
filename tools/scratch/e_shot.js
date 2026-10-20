// node e_shot.js outdir screen tabIndex|- dark|light [eval]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const [dir,scr,tab,mode,ev]=process.argv.slice(2);const dark=mode==='dark';const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:dark?'dark':'light'})).newPage();p.setDefaultTimeout(150000);const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(dir,'full.html'));
await p.waitForFunction(()=>window.ZLINK&&ZLINK.state.fixed.fx_r15e_n,null,{timeout:150000}).catch(()=>errs.push('boot not finished'));await p.waitForTimeout(800);
if(dark)await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')});
if(ev)await p.evaluate(ev).catch(e=>errs.push('ev '+e.message));
await p.evaluate(([s,t])=>{if(t!=='-')S.v[s==='zl_conn'?'zl_v':'zevt_v']=+t;go(s)},[scr,tab]);await p.waitForTimeout(1500);
const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
const out=path.join(dir,'shots',`${scr}-${tab}-${mode}.png`);fs.mkdirSync(path.dirname(out),{recursive:true});await p.screenshot({path:out,fullPage:process.env.FULL==='1'});console.log(out,'overflowX',ox,'errs',errs);await b.close()})();
