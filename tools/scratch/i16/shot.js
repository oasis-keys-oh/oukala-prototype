const {chromium}=require('playwright');
// usage: node shot.js outdir screen [--light] [--eval js] [--w N] [--name n]
(async()=>{const a=process.argv.slice(2);const dir=require('path').resolve(a[0]);const scr=a[1];const light=a.includes('--light');const w=a.includes('--w')?+a[a.indexOf('--w')+1]:1440;
const ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:null;const nm=a.includes('--name')?a[a.indexOf('--name')+1]:scr+(light?'_l':'_d');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:900},colorScheme:light?'light':'dark'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1200);
if(scr!=='-')await p.evaluate(i=>go(i),scr);await p.waitForTimeout(600);
if(ev){const r=await p.evaluate(ev);if(r!==undefined)console.log('eval:',JSON.stringify(r).slice(0,1500));await p.waitForTimeout(500)}
require('fs').mkdirSync(dir+'/shots',{recursive:true});await p.screenshot({path:dir+'/shots/'+nm+'.png'});console.log('errors',errs.slice(0,6));await b.close()})();
