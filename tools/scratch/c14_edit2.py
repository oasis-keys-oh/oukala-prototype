p='mod_svc.js';s=open(p,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    assert s.count(old)>=1,old[:60]
    s=s.replace(old,new,cnt)
# REL global
rep('const ME="Priya Shah";','const ME="Priya Shah";\nlet REL=null;/* Round 14: requested-for relationship of the order being built in the portal: {by,fw,rel,mgr} (set by mod_svc3 RF.prep) */')
# ctxOf
rep(' c.price=priceOf(it,base,null);c.price=priceOf(it,base,c);\n return c}',' c.price=priceOf(it,base,null);c.price=priceOf(it,base,c);\n if(REL&&by===REL.by&&forWho===REL.fw){c.rel=REL.rel;c.relMgr=REL.mgr}\n return c}')
# apprFor post-process
rep(' return {ctx,list:out}}\nconst ruleOf',' if(ctx.rel){out.forEach(a=>{if(a.rule!=="manager"||a.dup)return;if(ctx.rel==="report"||ctx.rel==="delegate"){if(a.trig){a.trig=false;a.skipped=true;a.note=ctx.rel==="report"?"Skipped: the requester is the manager of this person":"Skipped: the requester is a delegate on file, logged for audit"}}else if(ctx.rel==="other"||ctx.rel==="newhire-other"){if(!a.trig){a.trig=true;a.forced=true;a.why=(a.why?a.why+" ":"")+"Required because the requester is not the manager of this person.";a.note="Added: requested for someone the requester does not manage"}}})}\n return {ctx,list:out}}\nconst ruleOf')
# createReq audit
rep('audit("created request",r.id+" "+it.n);ap.forEach','audit("created request",r.id+" "+it.n+" · requested by "+by+(fw!==by?" for "+fw:"")+(r.rel?" ("+r.rel+")":""));ap.forEach')
# EVT
rep('  {id:"e11",n:"Access review due"','  {id:"e12",n:"Request raised for you",src:"Requests",sev:"Info",to:"Person the request is for",x:{teams:0,email:1,sms:0,push:1,inapp:1}},\n  {id:"e11",n:"Access review due"')
# req drawer header
rep('${r.onBehalfOf?`<span class="muted">for</span>${wh(r.onBehalfOf)}`:""}<span class="muted">${fdt(r.created)}</span></div>','<span class="muted">Requested for</span>${whx(r.for)}${r.rel&&r.rel!=="self"?`<span class="pill mute" title="Relationship between requester and the person it is for">${E(RELN[r.rel]||r.rel)}</span>`:""}<span class="muted">${fdt(r.created)}</span></div>${r.deliver||r.contact||r.guide?`<div class="row small muted">${r.deliver?"Deliver to: <b>"+E(r.deliver)+"</b>":""}${r.contact?" · Contact: <b>"+E(r.contact)+"</b>":""}${r.guide?` · Part of order <b>${E(r.guide)}</b>`:""}</div>`:""}')
rep('function reqDrawer(r){','const RELN={self:"Myself",report:"Their manager",delegate:"Delegate",other:"Someone else (not a report)",newhire:"New hire","newhire-other":"New hire (not my team)",team:"Team member"};\nconst whx=n=>n&&who(n)?wh(n):`<span class="pill mute">${E(n||"")}${n?" · not yet in directory":""}</span>`;\nfunction reqDrawer(r){')
# reqCols
rep('{k:"onBehalfOf",label:"For",fmt:r=>r.onBehalfOf?wh(r.onBehalfOf):"",val:r=>r.onBehalfOf||""}','{k:"onBehalfOf",label:"Requested for",fmt:r=>r.for?whx(r.for):"",val:r=>r.for||""}')
# approvals inbox: requested by / for both
rep('Requested by ${wh(a.by)}${a.for!==a.by?" for "+wh(a.for):""} <span class="num">','Requested by ${wh(a.by)} for ${whx(a.for)}${a.rel?` <span class="pill mute">${E(RELN[a.rel]||a.rel)}</span>`:""} <span class="num">')
rep('by:r.requester,for:r.for,ev:evidence(r,rule)','by:r.requester,for:r.for,rel:r.rel||"",ev:evidence(r,rule)')
# portal item prep
rep('function portalItem(it){const sc="p:"+it.id,fw=V.pFor||ME;','function portalItem(it){window.RF&&RF.prep(it);const sc="p:"+it.id,fw=V.pFor||ME;')
rep(',`<div class="row"><button class="btn" data-svc="pitem|">Back to the portal</button>${priceTag(it)}<span class="pill mute">${E(it.est)}</span>${r.xla?`<span class="pill good">${r.xla} / 5 from ${N(r.dep)} orders</span>`:""}${fchip("m_svc_xla")}</div>`)}${whoFor()}',',`<div class="row"><button class="btn" data-svc="pitem|">Back to the portal</button>${priceTag(it)}<span class="pill mute">${E(it.est)}</span>${r.xla?`<span class="pill good">${r.xla} / 5 from ${N(r.dep)} orders</span>`:""}${fchip("m_svc_xla")}</div>`)}${window.RF&&V.pView!=="admin"?RF.panel(it):whoFor()}')
# submit
rep(' const r=createReq(it,vals,ME,fw);delete FV[sc];',' if(window.RF&&!RF.ok(it))return;\n const r=window.RF&&RF.create?RF.create(it,vals,fw):createReq(it,vals,ME,fw);delete FV[sc];')
# bridge
rep('try{agg();astAgg();licAgg();notifyDash();regWFX()}catch(e){console.error("svc init",e)}','window.SVC3B={ITEM,CAT,REQS,RQ,createReq,apprFor,ctxOf,ME,GRPS,MGRS2,WORKER,REGION,LEVEL,V,fvOf,setF,openMy,openReq,NOTI,log,stPill,hh,fd,fdt,fdy,ms,NOW,poolPeople,defVals,itemName,STC,tplOf,CSP,pubItems,priceOf,RELN,whx,timelineHTML,get REL(){return REL},setREL:v=>{REL=v},tyIc,TY,addBiz};\ntry{agg();astAgg();licAgg();notifyDash();regWFX()}catch(e){console.error("svc init",e)}')
open(p,'w',encoding='utf-8').write(s)
