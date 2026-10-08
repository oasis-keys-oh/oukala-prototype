const openCh=c=>c.st!=="Closed"&&c.st!=="Rejected";
const overlap=(a,b)=>a.start<=b.end&&b.start<=a.end;
function collisions(c){const out=[];if(!openCh(c))return out;X.chg.forEach(o=>{if(o.id===c.id||!openCh(o)||!overlap(c,o))return;const sh=c.cis.filter(x=>o.cis.includes(x));if(sh.length)out.push({o,kind:"hard",sh});else if(o.svc===c.svc)out.push({o,kind:"soft",sh:[]})});return out}
function freezeHits(c){if(!openCh(c))return[];return FREEZE.filter(f=>c.start<=f.to&&f.from<=c.end&&(f.kind==="Blackout"||c.type==="Normal"))}
function risk(c){const items=RQ.map(q=>{const i=+(c.rq[q.k]||0),o=q.o[Math.min(i,q.o.length-1)];return {q:q.q,l:o[0],p:o[1],mx:Math.max(...q.o.map(x=>x[1])),k:q.k}});
 const col=collisions(c).filter(x=>x.kind==="hard"),fz=freezeHits(c);
 items.push({q:"Collides with another change on the same CI",l:col.length?col.map(x=>x.o.id).join(", "):"None",p:col.length?COLP:0,mx:COLP,auto:1});
 items.push({q:"Falls inside a freeze window",l:fz.length?fz.map(f=>f.n).join(", "):"None",p:fz.length?FRZP:0,mx:FRZP,auto:1});
 const sum=items.reduce((a,i)=>a+i.p,0),score=Math.round(sum/RTOT*100),b=score<20?["Low","good"]:score<40?["Medium","info"]:score<60?["High","warn"]:["Very high","bad"];
 return {items,sum,score,band:b[0],cls:b[1],formula:"("+items.map(i=>i.p).join(" + ")+" = "+sum+") ÷ "+RTOT+" × 100 = "+score}}
function advisor(c){const r=risk(c),top=[...r.items].sort((a,b)=>b.p-a.p).filter(i=>i.p>0).slice(0,3),red=[];
 RQ.filter(q=>["test","back","auto","time"].includes(q.k)).forEach(q=>{const cur=q.o[Math.min(+(c.rq[q.k]||0),q.o.length-1)][1],best=q.o.reduce((a,o)=>o[1]<a[1]?o:a);if(cur-best[1]>=6)red.push({q:q.q,to:best[0],d:cur-best[1]})});red.sort((a,b)=>b.d-a.d);const r2=red.slice(0,2),ds=r2.reduce((a,x)=>a+x.d,0);
 const sim=X.chg.filter(x=>x.hist&&x.svc===c.svc),failed=sim.filter(x=>x.out==="Failed").length;
 return {r,top,red:r2,after:Math.max(0,Math.round((r.sum-ds)/RTOT*100)),sim:sim.length,failed,conf:.82}}
