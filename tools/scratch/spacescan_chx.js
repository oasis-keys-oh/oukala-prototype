// Usage: NODE_PATH=$(npm root -g) node spacescan.js OUTDIR [--phone] [--dark] [--w 1100] [--only a,b]
// Flags squeezed text: words broken across lines (mid-word wraps) and tall narrow text blocks, per screen.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const phone=a.includes('--phone');const dark=a.includes('--dark');
const w=a.includes('--w')?+a[a.indexOf('--w')+1]:(phone?400:1440);const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const ids=['x'];const sayp=async q=>{await p.fill('#chatq',q);await p.press('#chatq','Enter');await p.waitForTimeout(1500)};await p.evaluate("go('itsm_inc')").catch(()=>{});await p.evaluate("CHATX.open('chat')");await sayp('Order a developer laptop for Hana Koval');await sayp('Onboard Marcus Webb as a standards editor starting Oct 26 reporting to Hana Koval');await sayp('How is the P1 incident SLA measured?');await sayp('Raise my Claude token limit to 60M');await p.evaluate("CHATX.setSubject('Hana Koval')");await p.waitForTimeout(300);let total=0;
for(const id of ids){for(const v of (process.env.VIEWS||'chat,threads,acts,ctx').split(',')){await p.evaluate("CHATX."+(process.env.FULL?'full(true);':'full(false);')+"open('"+v+"')");if(process.env.FULL)await p.evaluate("ST=CHATX.ST;ST.dock.side='"+(v==='acts'?'acts':'ctx')+"';CHATX.drawAll()").catch(()=>{});await p.waitForTimeout(300);console.log('view',v);
 // open every tab pane in turn? panes are all in DOM; scan visible only
 const r=await p.evaluate(()=>{const out=[];const view=document.querySelector('#chatDock');
  const walker=document.createTreeWalker(view,NodeFilter.SHOW_TEXT);let n;const seen=new Set();
  while(n=walker.nextNode()){const t=n.nodeValue;if(!t||t.trim().length<5)continue;const el=n.parentElement;if(!el||seen.has(el))continue;
   const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')continue;const rc=el.getBoundingClientRect();if(rc.width<2||rc.height<2)continue;
   // skip if inside closed details/hidden pane
   if(!el.checkVisibility||!el.checkVisibility({checkOpacity:false,checkVisibilityCSS:true}))continue;
   const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.3;
   const re=/[A-Za-z][A-Za-z'’\-]{4,}/g;let m,broken=0,ex='';const rng=document.createRange();
   let cnt=0;while((m=re.exec(t))&&cnt<40){cnt++;rng.setStart(n,m.index);rng.setEnd(n,m.index+m[0].length);const rs=rng.getClientRects();
     if(rs.length>1){const ys=new Set([...rs].map(q=>Math.round(q.top/3)));if(ys.size>1){broken++;ex=ex||m[0]}}}
   const lines=Math.round(rc.height/lh);
   const tall=(t.trim().length>14&&rc.width<110&&lines>=4&&cs.display!=='inline');
   if(broken||tall){seen.add(el);out.push({txt:t.trim().slice(0,40),w:Math.round(rc.width),lines,broken,ex,cls:(el.className&&el.className.toString().slice(0,40))||el.tagName})}}
  return out});
 if(r.length){total+=r.length;console.log('##',id,r.length);r.slice(0,6).forEach(x=>console.log('   ',JSON.stringify(x)))}}
}
console.log('total flagged',total);await b.close()})();
