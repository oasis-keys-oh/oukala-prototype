 const o={};const sh=(x,n=1200)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.rows=sh(CCMAP.rows().map(r=>r.code+' '+r.name+' '+r.st+' units:'+(r.units||[]).join('/')),900);
 o.gaps=sh(CCMAP.gaps().map(g=>g.k||g.kind||g.t).slice(0,12));
 const ents=['cost_center_map','cost_center','organization_unit','position','vacancy','employment','status_change','compensation_record','benefit_enrollment','pto_balance','pto_request','reporting_line','person','status_definition','ci_assignment','ci_ownership_default','approver_group'];
 o.ents=ents.map(id=>{const e=PLAT.entities().find(x=>x.id===id);return id+':'+(e?(e.domain+'/'+e.cls+'/'+e.nf+'f/'+e.status+'/'+e.owner):'none')});
 return JSON.stringify(o,null,1);
