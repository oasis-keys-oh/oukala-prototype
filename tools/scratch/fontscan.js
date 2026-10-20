// Usage: NODE_PATH=$(npm root -g) node fontscan.js OUTDIR [--light] [--w 1440] [--only a,b] [--json out.json]
// Default compares the cell's own computed style (td): what a column styling bug looks like. --inner also compares the element holding the longest text (pills, small hints, code), which is authored content and reported as information.
// Documented exceptions (not counted; printed as 'documented exceptions' per screen): tree rows whose text starts with a hierarchy marker, and signed money variance cells that go bold over target.
// Documented exceptions: heat map, matrix, gantt, RACI and calendar tables use the cell background (and padding) as the data encoding, so only family, size and weight are compared there. Rows carrying a whole-row tint (every cell shares it) are not flagged.
// Flags, per table column, mixed text styles across body rows: font family, size, weight, cell left padding, cell background.
// A row is compared only against rows of the same table in the same column. Header rows, tfoot, colspan rows, hidden rows and rows whose
// class says total or sum are skipped. Mouse is parked off the page so hover styles are never measured.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const light=a.includes('--light');const w=a.includes('--w')?+a[a.indexOf('--w')+1]:1440;
const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;const INNERF=a.includes('--inner');const jf=a.includes('--json')?a[a.indexOf('--json')+1]:null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:900},colorScheme:light?'light':'dark'});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);
let ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));if(a.includes('--shard')){const [si,sn]=a[a.indexOf('--shard')+1].split('/').map(Number);ids=ids.filter((_,i)=>i%sn===si)}let total=0;const all=[];
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.mouse.move(2,2);await p.waitForTimeout(350);
 const tabs=await p.evaluate(()=>[...document.querySelectorAll('#view [data-views]')].slice(0,1).map(e=>[e.dataset.views,e.querySelectorAll(':scope [role=tab]').length||document.querySelectorAll('#view input[name="'+e.dataset.views+'"]').length]));
 const plan=[null];if(tabs[0]){for(let i=1;i<Math.min(tabs[0][1],9);i++)plan.push([tabs[0][0],i])}
 const seenT=new Set();let rAll=[];
 for(const tb of plan){if(tb){await p.evaluate(([n,i])=>{S.v[n]=i;render()},tb).catch(()=>{});await p.mouse.move(2,2);await p.waitForTimeout(300)}
 const r=await p.evaluate((INNER)=>{const out=[];const EXC=[];window.__fsExc=EXC;const view=document.querySelector('#view');const tables=[...view.querySelectorAll('table')].slice(0,60);
  const fam=s=>String(s).split(',')[0].replace(/["']/g,'').trim();
  const eff=td=>{ // element holding the longest text node (avatars and badges are short, the cell value is long)
   const tw=document.createTreeWalker(td,NodeFilter.SHOW_TEXT);let n,best=null,bl=0;while(n=tw.nextNode()){const l=n.nodeValue.trim().length;if(l>bl){bl=l;best=n.parentElement}}return best};
  const bgOf=el=>{const c=getComputedStyle(el).backgroundColor;return(!c||c==='rgba(0, 0, 0, 0)'||c==='transparent')?'none':c};
  for(const t of tables){if(!t.checkVisibility||!t.checkVisibility())continue;if(t.closest('[popover]:not(:popover-open)'))continue;
   const rows=[...t.tBodies].flatMap(tb=>[...tb.rows]).filter(r=>{if(r.hidden)return false;const cs=getComputedStyle(r);if(cs.display==='none'||cs.visibility==='hidden')return false;
     if(/total|sum|foot|grand|subtotal/i.test(r.className))return false;if([...r.cells].some(c=>c.colSpan>1))return false;if(r.closest('details:not([open])'))return false;return true});
   if(rows.length<3)continue;const ncol=Math.max(...rows.map(r=>r.cells.length));
   const head=t.tHead&&t.tHead.rows[0];
   for(let ci=0;ci<ncol;ci++){const rec=[];
    rows.forEach((r,ri)=>{const td=r.cells[ci];if(!td||!td.checkVisibility||!td.checkVisibility())return;const e=eff(td);if(!e)return;const cs=getComputedStyle(e),ts=getComputedStyle(td);
     const rowBgs=[...r.cells].map(bgOf);const cnt0={};rowBgs.forEach(x=>cnt0[x]=(cnt0[x]||0)+1);const rowMaj=Object.keys(cnt0).sort((x,y)=>cnt0[y]-cnt0[x])[0];const mine=bgOf(td);
     rec.push({ri,fam:fam(INNER?cs.fontFamily:ts.fontFamily),size:INNER?cs.fontSize:ts.fontSize,wt:INNER?cs.fontWeight:ts.fontWeight,pad:ts.paddingLeft,bg:mine===rowMaj?'row':mine,tag:td.tagName,txt:td.textContent.trim().slice(0,22)})});
    if(rec.length<3)continue;const issues=[];
    const heat=/heat|plk-mx|(^|[\s-])mx\b|-mt\b|-xm\b|matrix|gantt|raci|swim|calendar/i.test(t.className||'');
    for(const k of (heat?['fam','size','wt']:['fam','size','wt','pad','bg'])){
     // column header cell never participates; compare how many distinct values and how many rows deviate from the majority
     const cnt={};rec.forEach(x=>cnt[x[k]]=(cnt[x[k]]||0)+1);const keys=Object.keys(cnt);if(keys.length<2)continue;
     const maj=keys.sort((x,y)=>cnt[y]-cnt[x])[0];const dev=rec.filter(x=>x[k]!==maj);
     if(dev.length&&dev.every(x=>/^[›↳└»]/.test(x.txt)||(k==='wt'&&/^[+−-]\$/.test(x.txt)))){EXC.push(k);continue}/* documented exceptions: hierarchy rows (prefixed with ›) and signed money variance cells carry weight or indent on purpose */
     // th row headers vs td in the same column are expected to differ in weight only; still reported if size/family/pad/bg differ
     issues.push({prop:k,major:maj,n:dev.length,of:rec.length,ex:dev.slice(0,2).map(x=>x[k]+' "'+x.txt+'"').join(' | ')})}
    if(issues.length){const hd=head&&head.cells[ci]?head.cells[ci].textContent.trim().slice(0,24):('col '+ci);out.push({table:(t.className||'').toString().slice(0,26)||'table',col:hd,issues})}}}
  out.exc=EXC.length;return out},INNERF);
 r.forEach(x=>{x.tab=tb?tb[1]:0;const k=x.table+'|'+x.col+'|'+x.issues.map(i=>i.prop).join(',');if(!seenT.has(k)){seenT.add(k);rAll.push(x)}})}
 const r=rAll;
 if(r.length){total+=r.length;console.log('##',id,r.length);r.slice(0,8).forEach(x=>console.log('   ',x.table,'|tab'+x.tab,'|',x.col,'|',x.issues.map(i=>i.prop+' '+i.n+'/'+i.of+' ('+i.ex+')').join('; ')));all.push({screen:id,findings:r})}}
console.log('total flagged columns',total,light?'light':'dark',w);if(jf)fs.writeFileSync(jf,JSON.stringify(all,null,1));await b.close()})();
