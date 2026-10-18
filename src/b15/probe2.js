(async()=>{await new Promise(r=>setTimeout(r,11000));const o={};
o.zlink=ZLINK.score();
for(const id of ['bud_ccmap','bud_lines','bud_req']){const e=CONTRACT.evaluate(id);o['c_'+id]=e?{score:e.score,level:e.level,rules:e.rules.map(r=>r.id+":"+r.st)}:null}
o.cs=CONTRACT.stats();
o.cc=DATAMODEL.tables.cost_center.fields.map(f=>f.k).join(",");o.ccm=DATAMODEL.tables.cost_center_map&&DATAMODEL.tables.cost_center_map.fields.map(f=>f.k).join(",");
o.dom=ORGX.domains.find(d=>d.id==="costcenter");o.owner=ORGX.ownerOf("costcenter")&&ORGX.ownerOf("costcenter").name;o.backup=ORGX.backupOf("costcenter")&&ORGX.backupOf("costcenter").name;
o.proc=PROCLIB.list().filter(p=>/cost_center|budget_line_review/.test(p.id)).map(p=>({id:p.id,owner:p.owner,backup:p.backup,level:p.level,target:p.target,model:p.model,steps:p.steps}));
o.metrics=["m_cc_cov","m_cc_units","m_cc_one","m_bl_over"].map(k=>k+"="+METRICS[k].cur);
o.cov=CCMAP.coverage();o.wire=[CCMAP.wireState,BUDLINES&&1];o.own=ORGX.gaps&&ORGX.gaps().filter(g=>/cost|budget/i.test(g.label)).map(g=>g.label+":"+g.gap);
o.warn=[CCMAP.procWarn,BUDLINES.procWarn,CCMAP.decisions&&CCMAP.decisions.map(d=>d.warnings)];
return JSON.stringify(o,null,1)})()
