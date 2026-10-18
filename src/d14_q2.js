const {chromium}=require('playwright');const fs=require('fs');const Q=require('./d14_queries.js').concat(['Workday','timesheet','reserve entry','who owns budget','who owns invoices','owner of security','spend by vendor']);
(async()=>{const out=process.argv[2];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await p.goto('file://'+out+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1200);
const R=await p.evaluate(async(Q)=>{NAVX.ensureIndex(true);await new Promise(r=>setTimeout(r,300));for(let i=0;i<900&&(NAVX.index.building||!NAVX.index.built);i++)await new Promise(r=>setTimeout(r,100));
const o=[];for(const q of Q){const r=NAVX.zsearch.search(q);o.push({q,total:r.total,n:r.groups.length,fams:r.fams,top:r.groups.slice(0,5).map(g=>g.lab+':'+g.n)})}return o},Q);
fs.writeFileSync(out+'/queries2.json',JSON.stringify(R,null,1));
const zero=R.filter(r=>!r.total),rec=f=>['money','work','service','people','gov','know'].some(k=>f[k]);const noRec=R.filter(r=>r.total&&!rec(r.fams)),one=R.filter(r=>r.n===1&&r.total);
console.log('queries',R.length,'| zero:',zero.map(r=>r.q).join('|'));console.log('no business records (screens/data only):',noRec.map(r=>r.q).join('|'));console.log('single group:',one.map(r=>r.q+'->'+r.top[0]).join('|'));
['budget','cost','PO','reserve','forecast','who owns budget','owner of security','spend by vendor','Workday'].forEach(q=>{const r=R.find(x=>x.q===q);console.log(q,r.total,r.top.join(', '))});await b.close()})();
