/* ============ R8: programmatic contract used by chat, DevOps, observability, flow ============ */
const _ok=(o)=>Object.assign({ok:true},o),_err=m=>({ok:false,error:m});
window.ITSMX={
 get incidents(){return ALLI()},get changes(){return ALLC()},get problems(){return ALLP()},
 getIncident:id=>INC(id)||null,getChange:id=>CHGB(id)||null,getProblem:id=>PRB(id)||null,
 createIncident(o){o=o||{};if(!o.title&&!o.t)return _err("title is required");const sv=SV(o.svc||o.service)?(o.svc||o.service):SVN[0];
  const v={title:o.title||o.t,desc:o.desc||o.description||"",caller:o.caller||ME,ch:o.ch||"Portal",role:o.role||"analyst",vip:o.vip||"",svc:sv,ci:o.ci||"",ua:o.ua!=null?o.ua:1,deg:o.deg!=null?o.deg:30,txh:o.txh||0,reg:o.reg||0,urg:o.urg||3,cat:o.cat||classify((o.title||o.t)+" "+(o.desc||"")).cat,grp:o.grp||o.team||classify((o.title||o.t)+" "+(o.desc||"")).grp};
  const id=nextId("inc","INC");const i=Object.assign({id,t:v.title,d:v.desc||v.title,caller:v.caller,ch:v.ch,cat:v.cat,grp:v.grp,own:"",st:"New",age:0,respH:null,prb:"",chg:"",kb:"",maj:!!o.major,ci:v.ci,notes:[{a:0,w:String(v.caller).split(" (")[0],k:"Comment",x:v.desc||v.title}]},tmpI(v));
  X.inc.unshift(i);pidxReset();if(o.owner||o.own){const w=o.owner||o.own;if(w===ME)claim(i,ME,"",false);else claim(i,w,o.why||"Assigned by an automated process",true)}
  i.notes.push({a:0,w:"System",k:"System",x:"Priority P"+prio(i)+" calculated: impact "+BANDN[calc(i).band]+" (score "+calc(i).score+"), urgency "+URGN[calc(i).u]+". Routed to "+i.grp+"."});
  if(o.source)i.notes.push({a:0,w:"System",k:"System",x:"Opened by "+o.source+"."});
  done("Incident logged",id+" · P"+prio(i)+" · "+i.grp);return _ok({id,priority:prio(i),team:i.grp,service:i.svc})},
 setPriority(id,p,why,by){const i=INC(id);if(!i)return _err("Unknown incident "+id);const to=+String(p).replace(/\D/g,"");if(!(to>=1&&to<=4))return _err("Priority must be 1 to 4");const cur=prio(i);if(to===cur)return _ok({id,priority:cur,unchanged:true});
  if(cur===1&&to>1&&!(arguments[4]))return _err("Downgrading a P1 needs a second approver (pass it as the fifth argument)");
  const role=(X.pol.roles.find(r=>r.ovr)||{n:"Incident manager"});i.ovr={p:to,from:cur,by:by||ME,role:role.n,why:why||"Set by an automated process",at:"Oct 8 "+hmAt(0),appr:arguments[4]||""};X.ovlog.unshift({id,from:cur,to,by:by||ME,role:role.n,why:i.ovr.why,at:i.ovr.at,appr:i.ovr.appr});
  i.notes.push({a:0,w:by||ME,k:"System",x:"Priority overridden from P"+cur+" to P"+to+". Reason: "+i.ovr.why});done("Priority overridden",id+" · P"+cur+" to P"+to);return _ok({id,priority:to,from:cur})},
 assign(id,target,why){const i=INC(id);if(!i)return _err("Unknown incident "+id);if(!target)return _err("Name a team or a person");
  if(TEAMN.includes(target)){if(target!==i.grp){i.notes.push({a:0,w:"System",k:"System",x:"Reassigned from "+i.grp+" to "+target+"."});i.grp=target;if(i.own&&(who(i.own)||{}).team!==target&&kindOf(i.own)==="human"){i.notes.push({a:0,w:"System",k:"System",x:i.own+" is not in "+who+"; returned to the team queue."});i.own="";if(i.st==="In progress")i.st="New"}}done("Assigned to team",id+" · "+target);return _ok({id,team:target,owner:i.own})}
  const mem=(members(i.grp)||[]).some(m=>m.name===target);if(target===ME||mem)claim(i,target,"",false);else claim(i,target,why||"Assigned by an automated process",true);
  done("Assigned",id+" · "+target);return _ok({id,team:i.grp,owner:i.own,direct:!!i.direct})},
 createChange(o){o=o||{};if(!(o.t||o.title))return _err("title is required");const type=o.type||"Normal";const st=o.start||addD(TODAYI,7);
  const svc=SV(o.svc||o.service)?(o.svc||o.service):SVN[0];const rqv=Object.fromEntries(RQ.map(q=>[q.k,(o.rq&&o.rq[q.k])||"0"]));
  const c={id:nextId("chg","CHG"),t:o.t||o.title,type,svc,cis:o.cis||[],just:o.just||o.justification||"Raised by "+(o.source||"an automated process"),impl:o.impl||"See linked pipeline or runbook.",back:o.back||o.rollback||"Redeploy the previous version.",test:o.test||"",start:st,end:o.end||st,win:o.win||"Off-hours: 22:00 to 02:00",own:o.own||o.owner||"Sam Patel",inc:o.inc||"",prb:o.prb||"",cost:+o.cost||0,env:o.env||"Production",grp:o.grp||"Ops team",tpl:type==="Standard"?(o.tpl||""):"",rq:rqv,st:"Draft",req:o.req||ME,rel:o.rel||"",proj:o.proj||"",appr:[],stages:[],ok:[]};
  if(o.source)c.src=o.source;X.chg.unshift(c);ALLC();submitChange(c);const rr=risk(c);done("Change submitted",c.id+" · risk "+rr.score+" "+rr.band);return _ok({id:c.id,state:c.st,risk:rr.score,band:rr.band,stages:(c.stages||[]).length})},
 approve(id,approver,why){const c=CHGB(id);if(!c)return _err("Unknown change "+id);if(c.st!=="Authorize")return _err(id+" is "+c.st+", not awaiting approval");
  for(let si=0;si<c.stages.length;si++){const ap=c.stages[si].ap;for(let ai=0;ai<ap.length;ai++){const a=ap[ai];if(a.dec==="approved"||a.dec==="rejected")continue;if(approver&&a.w!==approver&&a.deleg!==approver)continue;if(a.w===c.req||approver===c.req)return _err("The requester cannot approve their own change");cabDecide(c,si,ai,"approved",why||"");return _ok({id,state:c.st,by:a.w})}}
  return _err(approver?approver+" has no pending approval on "+id:"No pending approvals on "+id)},
 createProblem(o){o=o||{};if(!(o.t||o.title))return _err("title is required");const p=newProblem({t:o.t||o.title,svc:SV(o.svc||o.service)?(o.svc||o.service):SVN[0],pr:o.pr||o.priority||3,owner:o.owner,inc:o.inc||o.incidents||[]});if(o.cause)p.cause=o.cause;if(o.workaround)p.workaround=o.workaround;audit("created problem",p.id);done("Problem created",p.id);return _ok({id:p.id,service:p.svc,linked:(o.inc||o.incidents||[]).length})},
 isOpen:i=>!!i&&i.st!=="Resolved",
 counts:()=>{const a=ALLI(),c=ALLC();return {incidentsOpen:a.filter(isOpen).length,incidentsTotal:a.length,changesOpen:c.filter(openCh).length,changesTotal:c.length}}
};
