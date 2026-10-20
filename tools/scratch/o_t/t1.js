(async()=>{
 const o={};
 o.wired=ORGX.wired;o.wireState=ORGX.wireState;o.modWarn=ORGX.modWarn;o.procWarn=ORGX.procWarn;
 o.dec=(ORGX.decisions||[]).map(d=>d.entity+": "+(d.warnings||[]).join("|")+" dups "+(d.dups||[]).length);
 const ev=CONTRACT.evaluate("org_chart");o.score=ev&&ev.score;o.rules=ev&&ev.rules.map(r=>r.id+":"+r.st+" "+r.ev);
 o.stats=ORGX.stats();o.ownpct=ORGX.ownIndex().pct;o.unres=ORGX.ownIndex().un.metrics.slice(0,3);
 o.agents=ORGX.agents().length;
 o.avery=ORGX.opps("Avery Chen").map(x=>x.title+" "+x.hrs+" "+(x.cov||"")+(x.builtBy||""));
 o.maya=ORGX.opps("Maya Ortiz").map(x=>x.title+" "+x.hrs+" "+(x.cov||""));
 return o})()
