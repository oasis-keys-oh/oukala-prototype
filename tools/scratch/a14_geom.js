// Org chart connector geometry test: every edge starts at parent bottom-center and ends at child top-center within 1px (dot/matrix: card edge centers).
const {chromium}=require('playwright');const path=require('path');
const dir=process.argv[2]||'out_a14';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});let bad=0,total=0,errs=[];
for(const scheme of ['dark','light'])for(const w of [1000,1440,1920]){
 const p=await (await b.newContext({viewport:{width:w,height:1000},colorScheme:scheme})).newPage();
 p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
 await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(dir+'/full.html'),{waitUntil:'load',timeout:90000});await p.waitForTimeout(400);
 for(const mode of ['human','ai','both'])for(const exp of [false,true])for(const lines of [false,true]){
  await p.evaluate(([m,e,l])=>{S.org.mode=m;S.org.tab='chart';S.org.outline=false;S.org.k=0;S.org.collapsed={};S.org.seed13=false;S.org.lines={dotted:l,matrix:l};if(e){S.org.seed13=true}go('org_chart');render()},[mode,exp,lines]);
  await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const cv=document.getElementById('orgcv');if(!cv)return{err:'no canvas'};const cr=cv.getBoundingClientRect(),sc=cr.width/cv.offsetWidth;
   const R={};cv.querySelectorAll('.org-n').forEach(n=>{const r=n.getBoundingClientRect();R[n.dataset.oid]={l:(r.left-cr.left)/sc,t:(r.top-cr.top)/sc,w:r.width/sc,h:r.height/sc}});
   const paths=[...cv.querySelectorAll('path.org-ln')];const fails=[];
   const num=d=>{const t=d.match(/-?\d+(\.\d+)?/g).map(Number);return t};
   paths.forEach(pa=>{const f=R[pa.dataset.from],t=R[pa.dataset.to],k=pa.dataset.k;const d=pa.getAttribute('d');const n=num(d);const sx=n[0],sy=n[1];
    // end point: replicate command walk
    let x=0,y=0;(d.match(/[MHV][^MHV]*/g)||[]).forEach(c=>{const v=+c.slice(1);if(c[0]==='M'){const q=num(c);x=q[0];y=q[1]}else if(c[0]==='H')x=v;else y=v});
    if(!f||!t){fails.push('missing card '+pa.dataset.from+'>'+pa.dataset.to);return}
    const near=(a,bb)=>Math.abs(a-bb)<=1;
    if(k==='line'){if(!(near(sx,f.l+f.w/2)&&near(sy,f.t+f.h)&&near(x,t.l+t.w/2)&&near(y,t.t)))fails.push('line '+pa.dataset.from+'>'+pa.dataset.to+' '+[sx,sy,x,y].join(','))}
    else{const onEdge=(px,py,c)=>near(px,c.l+c.w/2)&&(near(py,c.t)||near(py,c.t+c.h));
     const a=R[pa.dataset.from],c=R[pa.dataset.to];if(!((onEdge(sx,sy,a)&&onEdge(x,y,c))||(onEdge(sx,sy,c)&&onEdge(x,y,a))))fails.push(k+' '+pa.dataset.from+'>'+pa.dataset.to)}});
   // every non-root card has exactly one 'line' edge into it
   const incoming={};paths.filter(p=>p.dataset.k==='line').forEach(p=>incoming[p.dataset.to]=(incoming[p.dataset.to]||0)+1);
   const ids=Object.keys(R);const noParent=ids.filter(i=>!incoming[i]);
   const roles=new Set(ORGX.staff.map(x=>x.role.toLowerCase()).concat(DIR.map(d=>(d.role||'').toLowerCase())));
   const nameIsTitle=[...cv.querySelectorAll('.org-t b')].map(x=>x.textContent.trim()).filter(t=>roles.has(t.toLowerCase())||/^Chief Editor$/.test(t));
   const lum=c=>{const m=c.match(/\d+(\.\d+)?/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
   let bgc=getComputedStyle(document.querySelector('.org-vp')).backgroundColor;if(/rgba\(.*, 0\)|transparent/.test(bgc))bgc=getComputedStyle(document.body).backgroundColor;
   const lc=paths[0]?getComputedStyle(paths[0]).stroke:'rgb(0,0,0)';const L1=lum(lc),L2=lum(bgc.indexOf('rgb')===0?bgc:'rgb(255,255,255)');const contrast=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
   if(nameIsTitle.length)fails.push('name is title: '+nameIsTitle.join(','));if(contrast<3)fails.push('line contrast '+contrast.toFixed(2));
   const sty=getComputedStyle(paths[0]||cv);return{n:paths.length,cards:ids.length,noParent:noParent.length,fails,stroke:sty.stroke,bg:getComputedStyle(document.querySelector('.org-wrap')).backgroundColor}});
  total++;const tag=[scheme,w,mode,exp?'expanded':'collapsed',lines?'dot+mx':'tree'].join(' ');
  if(r.err||r.fails.length||r.noParent!==1||r.n<r.cards-1){bad++;console.log('FAIL',tag,JSON.stringify(r).slice(0,300))}
 }
 await p.close()}
console.log('configs',total,'failed',bad,'errs',errs.slice(0,3));await b.close();process.exit(bad?1:0)})();
