// Persistent page server. Commands: write /tmp/m16q/<id>.cmd (JSON {kind:'eval'|'shot'|'reload'|'view', code, file, dark, w, h, full}), result in /tmp/m16q/<id>.out
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const dir=path.resolve(process.argv[2]);const Q='/tmp/m16q';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push('console: '+m.text())});
await p.route(/^https?:/,r=>r.abort());
async function load(){const t=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:300000});await p.waitForFunction(()=>window.R16M&&R16M.ST&&R16M.ST.ok()&&R16M.wire.proc,null,{timeout:300000}).catch(()=>{});await p.waitForTimeout(1500);return Date.now()-t}
console.log('loading');const ms=await load();console.log('ready',ms);fs.writeFileSync(Q+'/ready','1');
setInterval(async()=>{for(const f of fs.readdirSync(Q).filter(x=>x.endsWith('.cmd'))){const fp=path.join(Q,f);let cmd;try{cmd=JSON.parse(fs.readFileSync(fp,'utf8'))}catch(e){continue}fs.unlinkSync(fp);const id=f.replace('.cmd','');let out;
 try{if(cmd.kind==='reload'){out={ms:await load()}}
 else if(cmd.kind==='view'){await p.setViewportSize({width:cmd.w||1440,height:cmd.h||900});await p.emulateMedia({colorScheme:cmd.dark?'dark':'light'});out='ok'}
 else if(cmd.kind==='eval'){const n0=errs.length;const code=cmd.file?fs.readFileSync(cmd.file,'utf8'):cmd.code;out=await p.evaluate(async c=>{try{const r=await (0,eval)('(async()=>{'+c+'})()');return typeof r==='string'?r:JSON.stringify(r)}catch(e){return 'ERR '+e.message+'\n'+(e.stack||'').slice(0,400)}},code);out=out+'\nERRORS:'+JSON.stringify(errs.slice(n0))}
 else if(cmd.kind==='shot'){const n0=errs.length;if(cmd.code)await p.evaluate(async c=>{try{await (0,eval)('(async()=>{'+c+'})()')}catch(e){console.error('shot eval '+e.message)}},cmd.code);await p.waitForTimeout(cmd.wait||700);const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);await p.screenshot({path:cmd.file,fullPage:!!cmd.full,timeout:120000});out={shot:cmd.file,overflowX:ox,errors:errs.slice(n0)}}
 }catch(e){out='SRVERR '+e.message}
 fs.writeFileSync(path.join(Q,id+'.out'),typeof out==='string'?out:JSON.stringify(out))}},300)})();
