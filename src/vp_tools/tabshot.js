const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const dir=process.argv[2],out=process.argv[3],ids=process.argv[4].split(','),cfg=process.argv[5],scale=process.argv[6]==='scale';
const [w,mode]=cfg.split(':');const dark=mode==='d';
(async()=>{for(const id of ids){
 for(let t=0;t<3;t++){let b;try{b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const c=await b.newContext({viewport:{width:+w,height:1000},colorScheme:dark?'dark':'light'});const p=await c.newPage();
 await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);if(scale){await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(1200)}
 await p.evaluate(i=>go(i),id);await p.waitForTimeout(1800);
 const groups=await p.evaluate(()=>[...document.querySelectorAll('#view .vsw,#view .wbs-tabs,#view .svx-seg')].map(g=>g.children.length));
 for(let gi=0;gi<groups.length;gi++)for(let ti=0;ti<groups[gi];ti++){
  const f=path.join(out,`${id}_g${gi}t${ti}_${w}${dark?'d':'l'}${scale?'S':''}.png`);if(fs.existsSync(f))continue;
  await p.evaluate(([gi,ti])=>{const g=[...document.querySelectorAll('#view .vsw,#view .wbs-tabs,#view .svx-seg')][gi];g.children[ti].click()},[gi,ti]);await p.waitForTimeout(1500);
  await p.evaluate(()=>{document.getElementById('view').scrollTop=0;window.scrollTo(0,0)});
  await p.screenshot({path:f,fullPage:true});}
 await b.close();console.log('ok',id);break}catch(e){console.log('retry',id,e.message.slice(0,80));try{await b.close()}catch(_){}}}}})();
