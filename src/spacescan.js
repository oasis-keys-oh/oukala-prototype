// Usage: NODE_PATH=$(npm root -g) node spacescan.js OUTDIR [--phone] [--dark] [--w 1100] [--only a,b]
// Flags squeezed text | Rule N (nested bordered scroll wrapper in a card) lives in nestscan.js: words broken across lines (mid-word wraps) and tall narrow text blocks, per screen.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const phone=a.includes('--phone');const dark=a.includes('--dark');
const w=a.includes('--w')?+a[a.indexOf('--w')+1]:(phone?400:1440);const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(500);
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));let total=0;
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(500);await p.evaluate(()=>{try{window.R15&&R15.rhythm&&R15.rhythm()}catch(e){}});await p.waitForTimeout(80);
 // open every tab pane in turn? panes are all in DOM; scan visible only
 const r=await p.evaluate(()=>{const out=[];const view=document.querySelector('#view');
  const walker=document.createTreeWalker(view,NodeFilter.SHOW_TEXT);let n;const seen=new Set();
  while(n=walker.nextNode()){const t=n.nodeValue;if(!t||t.trim().length<5)continue;const el=n.parentElement;if(!el||seen.has(el))continue;
   const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')continue;const rc=el.getBoundingClientRect();if(rc.width<2||rc.height<2)continue;
   // skip if inside closed details/hidden pane
   if(!el.checkVisibility||!el.checkVisibility({checkOpacity:false,checkVisibilityCSS:true}))continue;
   const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.3;
   const re=/[A-Za-z][A-Za-z'’\-]{4,}/g;let m,broken=0,ex='';const rng=document.createRange();
   let cnt=0;while((m=re.exec(t))&&cnt<40){cnt++;rng.setStart(n,m.index);rng.setEnd(n,m.index+m[0].length);const rs=rng.getClientRects();
     if(rs.length>1){const ys=new Set([...rs].map(q=>Math.round(q.top/3)));if(ys.size>1&&!/-/.test(m[0])){broken++;ex=ex||m[0]}}}
   const lines=Math.round(rc.height/lh);
   const tall=(t.trim().length>14&&rc.width<110&&lines>=4&&cs.display!=='inline');
   if(broken||tall){seen.add(el);out.push({txt:t.trim().slice(0,40),w:Math.round(rc.width),lines,broken,ex,cls:(el.className&&el.className.toString().slice(0,40))||el.tagName})}}
  /* R15 rule: adjacent bordered cards closer than 8px (same row or stacked) */
  const cards=[];const all=view.querySelectorAll('*');
  for(const el of all){if(cards.length>400)break;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
   const bw=parseFloat(cs.borderTopWidth)+parseFloat(cs.borderLeftWidth);if(!(bw>=1)||cs.borderTopStyle==='none')continue;const br=parseFloat(cs.borderTopLeftRadius)||0;if(br<8)continue;
   const rc=el.getBoundingClientRect();if(rc.width<110||rc.height<36)continue;if(el.closest('[popover]:not(:popover-open)'))continue;if(!el.checkVisibility||!el.checkVisibility())continue;
   if(el.matches('button,.chip,.pill,.btn,input,select,textarea,label,summary,.fchip,.vsw,.vsw *,.cardhead .fkpi,td,th,tr,.at-reg'))continue;cards.push({el,rc:{l:rc.left,r:rc.right,t:rc.top+scrollY,b:rc.bottom+scrollY}})}
  const seenPair=new Set();
  for(let i=0;i<cards.length;i++){const A=cards[i];for(let j=i+1;j<cards.length;j++){const B=cards[j];if(A.el.contains(B.el)||B.el.contains(A.el))continue;
    const ox=Math.min(A.rc.r,B.rc.r)-Math.max(A.rc.l,B.rc.l),oy=Math.min(A.rc.b,B.rc.b)-Math.max(A.rc.t,B.rc.t);
    let gap=null;
    if(ox>0.4*Math.min(A.rc.r-A.rc.l,B.rc.r-B.rc.l)){const g=A.rc.b<=B.rc.t+1?B.rc.t-A.rc.b:B.rc.b<=A.rc.t+1?A.rc.t-B.rc.b:null;if(g!=null&&g<8)gap=g}
    if(gap==null&&oy>0.4*Math.min(A.rc.b-A.rc.t,B.rc.b-B.rc.t)){const g=A.rc.r<=B.rc.l+1?B.rc.l-A.rc.r:B.rc.r<=A.rc.l+1?A.rc.l-B.rc.r:null;if(g!=null&&g<8)gap=g}
    if(gap!=null){const k=(A.el.className+'|'+B.el.className).toString().slice(0,80);if(seenPair.has(k))continue;seenPair.add(k);out.push({txt:'ADJ gap '+Math.round(gap)+'px',w:Math.round(A.rc.r-A.rc.l),lines:0,broken:0,ex:'',cls:A.el.className.toString().slice(0,34)+' + '+B.el.className.toString().slice(0,34)})}}}
  return out});
 if(r.length){total+=r.length;console.log('##',id,r.length);r.slice(0,6).forEach(x=>console.log('   ',JSON.stringify(x)))}}
console.log('total flagged',total);await b.close()})();
