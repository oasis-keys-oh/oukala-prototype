global.METRICS={};global.S={};global.localStorage={getItem(){return null}};
const src=require('fs').readFileSync('data2.js','utf8');eval(src+`;
const P=plan("now");console.log('today',fmtD(TODAY));
TASKS.forEach(t=>{const r=P.R[t.id],b=BASE.R[t.id];console.log(t.id,t.n.padEnd(34),fmtD(r.es),fmtD(r.ef-(t.ms?0:1)),'base',fmtD(b.es),fmtD(b.ef-(t.ms?0:1)),'float',r.fl)});
['PR1','PR2','PR3','PR4'].forEach(p=>console.log(p,evm(P,p)));
const L=load(P,[]);Object.entries(L).forEach(([k,v])=>console.log(k.padEnd(16),v.map(x=>Math.round(x*100)).join(' ')));
const s=plan('lumen5');console.log('lumen5 pilot',fmtD(s.R.p2_5.es),'beta',fmtD(s.R.p1_5.es),'golive',fmtD(s.R.p1_9.es));
console.log(rank(DW0,2000,70).map(d=>d.id+':'+d.score+(d.fund?'F':'')).join(' '))`);
