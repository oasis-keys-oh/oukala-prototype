// PR-31 UX evaluation helper: open the local full.html, set persona and tenant, capture text and screenshots.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const FULL=path.resolve(__dirname,'../../../src/build_out/full.html');
async function open(opt={}){const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const c=await b.newContext({viewport:opt.vp||{width:1440,height:900},colorScheme:opt.dark?'dark':'light'});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+FULL,{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&window.NAVX&&NAVX.persona&&window.TENANT,null,{timeout:120000});await p.waitForTimeout(1500);
 return {b,c,p,errs}}
async function setup(p,persona,tenant){await p.evaluate(([k,t])=>{try{SHOW.wedge.set(false)}catch(e){}NAVX.persona.set(k);if(t)TENANT.switch(t)},[persona,tenant]);await p.waitForTimeout(400)}
async function goto(p,id){await p.evaluate(i=>go(i),id);await p.waitForTimeout(600)}
async function shot(p,dir,name,full){fs.mkdirSync(dir,{recursive:true});const f=path.join(dir,name+'.png');await p.screenshot({path:f,fullPage:!!full});return f}
const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.innerText:''},sel||'#view');
module.exports={open,setup,goto,shot,txt,FULL};
