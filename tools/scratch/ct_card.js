// Usage: NODE_PATH=$(npm root -g) node cardscan.js OUTDIR [--w 1440] [--only a,b] [--json file]
// Card consistency check. For each family of sibling cards laid out in one row it flags:
//  Only structural twins are compared (same class, same row, same child count); page panels (SECTION.card) are skipped.
//  H  = unequal outer heights (>3px)   S = same child count but a child section starts at a different offset (>4px) or has a different height (>6px, text blocks excluded)
// Run it with every UI change; zero findings is the bar for shipping.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const w=a.includes('--w')?+a[a.indexOf('--w')+1]:1440;const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:w,height:900}})).newPage();
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));let total=0;const all=[];
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});if(process.env.PRE){await p.evaluate(process.env.PRE);await p.waitForTimeout(250)}await p.waitForTimeout(450);
 const r=await p.evaluate(()=>{const out=[];const view=document.querySelector('#view');if(!view)return out;
  const isCard=el=>{const cs=getComputedStyle(el);const bg=cs.backgroundColor!=='rgba(0, 0, 0, 0)'||cs.backgroundImage!=='none';const bd=parseFloat(cs.borderTopWidth)>0||cs.boxShadow!=='none';const r=el.getBoundingClientRect();return r.width>150&&r.height>70&&(bg||bd)&&cs.display!=='inline'&&cs.visibility!=='hidden'&&cs.position!=='absolute'};
  const seen=new Set();
  view.querySelectorAll('*').forEach(par=>{if(seen.has(par))return;const kids=[...par.children].filter(k=>k.offsetParent!==null&&isCard(k));if(kids.length<2)return;
   const fam={};kids.forEach(k=>{const key=k.tagName+'.'+[...k.classList].filter(c=>!/^(on|sel|open|active|st-|is-)/.test(c)).sort().join('.');(fam[key]=fam[key]||[]).push(k)});
   Object.entries(fam).forEach(([key,list])=>{if(list.length<2)return;
    // group by row
    const rows={};list.forEach(k=>{const t=Math.round(k.getBoundingClientRect().top/6);(rows[t]=rows[t]||[]).push(k)});
    Object.values(rows).forEach(row=>{if(row.length<2)return;const hs=row.map(k=>k.getBoundingClientRect().height);const dh=Math.max(...hs)-Math.min(...hs);const name=(par.id?'#'+par.id+' ':'')+key;
     const cc0=row.map(k=>k.children.length);const twin=new Set(cc0).size===1;if(key.startsWith('SECTION.')||key.startsWith('TD.')||key.startsWith('TR.'))return;if(dh>3&&twin)out.push({k:'H',fam:name,n:row.length,d:Math.round(dh),txt:(row[0].innerText||'').slice(0,30).replace(/\n/g,' ')});
     const cc=row.map(k=>k.children.length);const mm=Math.min(...cc);if(mm>=3){for(let i=0;i<mm;i++){if(new Set(row.map(k=>k.children[i].className)).size!==1)break;const tops=row.map(k=>k.children[i].getBoundingClientRect().top-k.getBoundingClientRect().top);const d=Math.max(...tops)-Math.min(...tops);if(d>4){out.push({k:'S',fam:name,n:row.length,idx:i,d:Math.round(d),el:row[0].children[i].className.toString().slice(0,30)});break}}}
     
     seen.add(par)})})});
  return out});
 if(r.length){total+=r.length;all.push({id,r});console.log(id,r.length,JSON.stringify(r.slice(0,4)))}}
console.log('TOTAL findings',total,'on',all.length,'screens');if(a.includes('--json'))fs.writeFileSync(a[a.indexOf('--json')+1],JSON.stringify(all,null,1));await b.close()})();
